/**
 * Player actions: connect the UI, the audio engine and the native service.
 */
import { engine, type LayerInput } from '../audio/engine';
import { SOUNDS, soundById, categoryById, POPULAR_TONIGHT, type Sound } from '../data/sounds';
import { FREE_LIMITS, PREMIUM_LIMITS, getEntitlement, TEST_BUILD } from '../billing/plans';
import { showPlayback, hidePlayback, onMediaAction } from '../native/platform';
import { store, toast, type Layer, type Mix, type RepeatMode, type TimerMode } from './store';
import { storyNowPlaying, toggleStory, stopStory, applyStoryTimer, cancelStoryTimer, storyActive } from './stories';

const s = () => store.get();

export const isLocked = (sound: Sound) => !!sound.premium && !s().premium;
export const limits = () => (s().premium ? PREMIUM_LIMITS : FREE_LIMITS);

// ---------- helpers ----------

function nowPlayingInfo() {
  const st = s();
  if (st.mode === 'mix') {
    const mix = st.mixes.find((m) => m.id === st.activeMixId);
    const names = st.layers.map((l) => soundById(l.id)?.name).filter(Boolean);
    return { title: mix?.name ?? 'Custom mix', subtitle: names.join(' · ') || 'Sound mixer' };
  }
  const sound = st.currentId ? soundById(st.currentId) : null;
  return { title: sound?.name ?? 'Fusion Sleep', subtitle: sound ? categoryById(sound.category).name : '' };
}

export function syncNative() {
  const st = s();
  const story = storyNowPlaying();
  if (story) {
    const bg = st.status !== 'idle' && st.currentId ? ` · with ${soundById(st.currentId)?.name ?? 'sounds'}` : '';
    showPlayback({ title: story.title, subtitle: `Bedtime story${bg}`, playing: story.playing });
    return;
  }
  if (st.status === 'idle') { hidePlayback(); return; }
  showPlayback({ ...nowPlayingInfo(), playing: st.status === 'playing' || st.status === 'loading' });
}

/** Is anything (sounds or a narrated story) currently active? */
export const anythingActive = () => s().status !== 'idle' || storyActive();

function layerInputs(layers: Layer[]): LayerInput[] {
  return layers.flatMap((l) => {
    const sound = soundById(l.id);
    return sound ? [{ sound, volume: l.volume, muted: l.muted }] : [];
  });
}

function remember(id: string) {
  store.set((st) => ({
    recent: [id, ...st.recent.filter((r) => r !== id)].slice(0, 12),
    playCounts: { ...st.playCounts, [id]: (st.playCounts[id] ?? 0) + 1 },
  }));
}

function maybeStartDefaultTimer(wasIdle: boolean) {
  const st = s();
  if (wasIdle && !st.timer && st.settings.defaultTimer > 0) setTimer(st.settings.defaultTimer, st.settings.timerMode, true);
}

function scheduleTrack() {
  const st = s();
  engine.cancel('track');
  if (st.mode !== 'single' || !st.currentId) { store.set({ trackLength: null }); return; }
  const sound = soundById(st.currentId)!;
  let length: number | null = null;
  if (st.preview) length = FREE_LIMITS.previewSeconds;
  else if (st.repeatMode !== 'loop') length = sound.src ? engine.bufferDuration(sound.id) : st.settings.trackMinutes * 60;
  const start = engine.now();
  store.set({ trackStart: start, trackLength: length });
  if (length) engine.schedule('track', start + length, st.preview ? 3 : 4, onTrackEnd);
}

function onTrackEnd() {
  const st = s();
  if (st.preview) {
    const id = st.currentId;
    stop();
    store.set({ sheet: 'premium', premiumFocus: id });
    toast('Preview finished');
    return;
  }
  if (st.repeatMode === 'next') next(true);
  else stop();
}

// ---------- single sound playback ----------

export async function playSound(id: string, opts: { queue?: string[]; preview?: boolean } = {}) {
  const sound = soundById(id);
  if (!sound) return;
  if (isLocked(sound) && !opts.preview) {
    store.set({ sheet: 'premium', premiumFocus: id });
    return;
  }
  const wasIdle = s().status === 'idle';
  const preview = !!opts.preview && isLocked(sound);
  const volume = s().soundVolumes[id] ?? 1;
  store.set({
    status: 'loading', mode: 'single', currentId: id, layers: [{ id, volume, muted: false }],
    activeMixId: null, preview, queue: opts.queue ?? s().queue,
  });
  syncNative();
  const loop = preview ? true : s().repeatMode === 'loop';
  const errors = await engine.setLayers([{ sound, volume, muted: false }], loop);
  if (s().currentId !== id || s().mode !== 'single') return; // superseded
  if (errors.length) {
    toast(errors[0].message, 'error', 5000);
    await engine.stopAll(0.2);
    store.set({ status: 'idle', currentId: null, layers: [] });
    syncNative();
    return;
  }
  await engine.resume();
  store.set({ status: 'playing' });
  if (!preview) remember(id);
  scheduleTrack();
  syncNative();
  maybeStartDefaultTimer(wasIdle);
}

export async function togglePlay() {
  if (storyActive()) { await toggleStory(); return; }
  await toggleSounds();
}

/** Pause/resume the sounds only. */
export async function toggleSounds() {
  const st = s();
  if (st.status === 'playing') {
    await engine.pause();
    store.set({ status: 'paused' });
  } else if (st.status === 'paused') {
    await engine.resume();
    store.set({ status: 'playing' });
  } else if (st.status === 'idle') {
    const firstFree = st.recent.find((id) => { const so = soundById(id); return so && !isLocked(so); });
    await playSound(firstFree ?? 'rain-gentle', { queue: POPULAR_TONIGHT });
    return;
  }
  syncNative();
}

/** Stop the sleep sounds. A story that is playing keeps going. */
export async function stop() {
  const keepTimer = storyActive();
  if (keepTimer) {
    await engine.stopAll(0.5, true);
    store.set({ status: 'idle', trackLength: null, preview: false });
  } else {
    await engine.stopAll();
    store.set({ status: 'idle', timer: null, trackLength: null, preview: false, sleepScreen: false });
  }
  syncNative();
}

/** Stop everything: sounds, story and the sleep timer. */
export async function stopEverything() {
  await stopStory(true);
  await engine.stopAll();
  store.set({ status: 'idle', timer: null, trackLength: null, preview: false, sleepScreen: false });
  syncNative();
}

function neighbour(dir: 1 | -1) {
  const st = s();
  const queue = (st.queue.length ? st.queue : SOUNDS.map((x) => x.id)).filter((id) => {
    const so = soundById(id); return so && !isLocked(so);
  });
  if (!queue.length) return null;
  const idx = st.currentId ? queue.indexOf(st.currentId) : -1;
  return queue[(idx + dir + queue.length) % queue.length];
}

export function next(_auto = false) {
  const id = neighbour(1);
  if (id) playSound(id);
}
export function previous() {
  const id = neighbour(-1);
  if (id) playSound(id);
}

export async function setRepeatMode(mode: RepeatMode) {
  store.set({ repeatMode: mode });
  const st = s();
  if (st.mode === 'single' && st.currentId && st.status !== 'idle' && !st.preview) {
    await engine.setLayers(layerInputs(st.layers), mode === 'loop');
    scheduleTrack();
  }
  toast(mode === 'loop' ? 'Repeat: continuous loop' : mode === 'once' ? 'Play once, then stop' : 'Play once, then the next sound');
}

export function setMasterVolume(v: number) {
  store.set({ masterVolume: v });
  engine.setMasterVolume(v);
}

// ---------- mixer ----------

async function applyLayers() {
  const st = s();
  if (!st.layers.length) { await stop(); return; }
  const wasIdle = st.status === 'idle';
  if (st.status !== 'playing') store.set({ status: 'loading' });
  syncNative();
  const errors = await engine.setLayers(layerInputs(st.layers), true);
  if (s().mode !== 'mix') return;
  if (errors.length) {
    const bad = new Set(errors.map((e) => SOUNDS.find((x) => x.name === e.soundName)?.id));
    store.set((x) => ({ layers: x.layers.filter((l) => !bad.has(l.id)) }));
    toast(errors[0].message, 'error', 5000);
    if (!s().layers.length) { await stop(); return; }
  }
  await engine.resume();
  store.set({ status: 'playing', trackLength: null });
  syncNative();
  maybeStartDefaultTimer(wasIdle);
}

export function addLayer(id: string) {
  const sound = soundById(id);
  if (!sound) return;
  if (isLocked(sound)) { store.set({ sheet: 'premium', premiumFocus: id }); return; }
  const st = s();
  let layers = st.mode === 'mix' ? st.layers : (st.status !== 'idle' && st.currentId && !st.preview ? st.layers : []);
  if (layers.some((l) => l.id === id)) { toast(`${sound.name} is already in your mix`); return; }
  if (layers.length >= limits().mixLayers) {
    if (!st.premium) { toast(`Free mixes can have ${FREE_LIMITS.mixLayers} sounds. Premium allows ${PREMIUM_LIMITS.mixLayers}.`); store.set({ sheet: 'premium', premiumFocus: null }); }
    else toast(`A mix can have up to ${PREMIUM_LIMITS.mixLayers} sounds`);
    return;
  }
  engine.cancel('track');
  layers = [...layers, { id, volume: st.soundVolumes[id] ?? 0.7, muted: false }];
  store.set({ mode: 'mix', layers, activeMixId: null, currentId: null, preview: false });
  remember(id);
  applyLayers();
  toast(`Added ${sound.name} to your mix`, 'success');
}

export function removeLayer(id: string) {
  store.set((st) => ({ layers: st.layers.filter((l) => l.id !== id), activeMixId: null }));
  applyLayers();
}

export function setLayerVolume(id: string, volume: number) {
  store.set((st) => ({
    layers: st.layers.map((l) => (l.id === id ? { ...l, volume } : l)),
    soundVolumes: { ...st.soundVolumes, [id]: volume },
  }));
  const l = s().layers.find((x) => x.id === id);
  if (l) engine.setLayerVolume(id, volume, l.muted);
}

export function toggleMute(id: string) {
  store.set((st) => ({ layers: st.layers.map((l) => (l.id === id ? { ...l, muted: !l.muted } : l)) }));
  const l = s().layers.find((x) => x.id === id);
  if (l) engine.setLayerVolume(id, l.volume, l.muted);
}

export function playMix(mix: Mix) {
  const allowed = mix.layers.filter((l) => { const so = soundById(l.id); return so && !isLocked(so); }).slice(0, limits().mixLayers);
  if (allowed.length < mix.layers.length) toast('Some Pro sounds in this mix were skipped');
  if (!allowed.length) return;
  engine.cancel('track');
  store.set({ mode: 'mix', layers: allowed, activeMixId: mix.id, currentId: null, preview: false });
  applyLayers();
}

export function saveMix(name: string) {
  const st = s();
  const trimmed = name.trim() || 'My mix';
  if (!st.layers.length) return false;
  if (st.mixes.length >= limits().savedMixes) {
    toast(`Free version saves up to ${FREE_LIMITS.savedMixes} mixes. Delete one or go Pro.`);
    return false;
  }
  const mix: Mix = { id: `mix-${Date.now()}`, name: trimmed, layers: st.layers, createdAt: Date.now() };
  store.set({ mixes: [mix, ...st.mixes], activeMixId: mix.id, mode: 'mix' });
  toast(`Saved “${trimmed}”`, 'success');
  syncNative();
  return true;
}

export function updateMix(id: string) {
  const st = s();
  if (!st.layers.length) return;
  store.set({ mixes: st.mixes.map((m) => (m.id === id ? { ...m, layers: st.layers } : m)) });
  toast('Mix updated', 'success');
}

export function deleteMix(id: string) {
  store.set((st) => ({ mixes: st.mixes.filter((m) => m.id !== id), activeMixId: st.activeMixId === id ? null : st.activeMixId }));
}

// ---------- sleep timer ----------

export async function setTimer(minutes: number, mode: TimerMode, silent = false) {
  if (minutes <= 0) return;
  if (!anythingActive()) await togglePlay();
  if (!anythingActive()) return;
  if (storyActive()) { if (s().story?.status === 'paused') await toggleStory(); }
  else if (s().status === 'paused') { await engine.resume(); store.set({ status: 'playing' }); }
  await engine.unlock();
  const total = Math.round(minutes * 60);
  const fade = timerFadeSeconds(mode, total);
  engine.schedule('timer', engine.now() + total, fade, onTimerEnd);
  store.set({ timer: { total, mode } });
  applyStoryTimer();
  syncNative();
  if (!silent) toast(`Sleep timer set for ${formatMinutes(minutes)}${mode === 'fade' ? ' with fade-out' : ''}`, 'success');
}

export const timerFadeSeconds = (mode: TimerMode, total: number) =>
  mode === 'fade' ? Math.min(s().settings.fadeMinutes * 60, total * 0.5) : 1.5;

export function cancelTimer() {
  engine.cancel('timer');
  cancelStoryTimer();
  store.set({ timer: null });
  toast('Sleep timer cancelled');
}

export function onTimerEnd() {
  if (!s().timer) return;
  stopEverything().then(() => toast('Sleep timer finished. Sweet dreams.', 'info', 6000));
}

export function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} hour${h > 1 ? 's' : ''}`;
}

/** Test builds only: unlock or lock Pro without any payment. */
export function setProTest(on: boolean) {
  if (!TEST_BUILD) return;
  store.set({ proTest: on, premium: on });
  toast(on ? 'Pro unlocked for testing. No payment is involved.' : 'Back to the free version', 'success');
}

// ---------- favourites & history ----------

export function toggleFavourite(id: string) {
  const st = s();
  const fav = st.favourites.includes(id);
  store.set({ favourites: fav ? st.favourites.filter((f) => f !== id) : [id, ...st.favourites] });
  const name = soundById(id)?.name;
  toast(fav ? `Removed ${name} from favourites` : `Added ${name} to favourites`, fav ? 'info' : 'success');
}

export function clearRecent() {
  store.set({ recent: [], playCounts: {} });
  toast('Recently played history cleared', 'success');
}

// ---------- recommendations (simple, on-device, no AI) ----------

export function recommendations(limit = 8): string[] {
  const st = s();
  const weight: Record<string, number> = {};
  st.recent.slice(0, 6).forEach((id, i) => { const so = soundById(id); if (so) weight[so.category] = (weight[so.category] ?? 0) + (6 - i); });
  st.favourites.forEach((id) => { const so = soundById(id); if (so) weight[so.category] = (weight[so.category] ?? 0) + 3; });
  const recentTop = new Set(st.recent.slice(0, 3));
  return SOUNDS
    .filter((so) => !recentTop.has(so.id))
    .map((so) => ({ id: so.id, score: (weight[so.category] ?? 0) + (POPULAR_TONIGHT.includes(so.id) ? 2 : 0) + (so.premium && !st.premium ? -1.5 : 0) + (st.playCounts[so.id] ?? 0) * 0.2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.id);
}

// ---------- startup ----------

let initialised = false;
export async function initPlayer() {
  if (initialised) return;
  initialised = true;
  engine.setMasterVolume(s().masterVolume);
  engine.onStateChange = (state) => {
    // Android may suspend audio (e.g. a phone call). Reflect that in the UI.
    const st = s();
    if (state !== 'running' && st.status === 'playing' && !storyActive()) { store.set({ status: 'paused' }); syncNative(); }
  };
  onMediaAction((a) => {
    const st = s();
    const storyState = st.story?.status;
    if (storyActive()) {
      if (a === 'play' && storyState === 'paused') toggleStory();
      else if (a === 'pause' && (storyState === 'playing' || storyState === 'loading')) toggleStory();
    }
    else if (a === 'play' && st.status === 'paused') togglePlay();
    else if (a === 'pause' && st.status === 'playing') togglePlay();
    else if (a === 'stop') stopEverything();
    else if (a === 'next' && !storyActive()) next();
    else if (a === 'previous' && !storyActive()) previous();
  });
  const ent = await getEntitlement();
  store.set({ premium: ent.premium || (TEST_BUILD && s().proTest) });
  // Timers scheduled on the audio clock fire their callbacks when the app resumes,
  // this keeps the UI honest if the callback was delayed in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const st = s();
      if (st.timer && engine.remaining('timer') === null && anythingActive()) stopEverything();
    }
  });
}
