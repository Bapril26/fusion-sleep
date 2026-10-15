/**
 * Bedtime story actions: narration, progress, favourites, background sound
 * and sleep-timer integration.
 *
 * Audio model (kept simple and predictable):
 *   - One story at a time, read by the narrator (phone voice engine).
 *   - The sleep sounds keep their own player and act as the story's
 *     background. Each has its own volume.
 *   - Pause/resume and the sleep timer apply to both together.
 */
import { STORIES, storyById, paragraphsOf, type Story } from '../data/stories';
import { narrator, chunkParagraphs, charsPerSecond, type Chunk } from '../audio/narrator';
import { engine } from '../audio/engine';
import { store, toast, type StorySession } from './store';
import { playSound, stop as stopSounds, setLayerVolume, syncNative, setTimer, timerFadeSeconds, onTimerEnd } from './player';

const s = () => store.get();

// ---------- lookups ----------

export const allStories = (): Story[] => [...s().myStories, ...STORIES];
export const getStory = (id: string) => storyById(id, s().myStories);

const chunkCache = new Map<string, Chunk[]>();
export function chunksFor(story: Story): Chunk[] {
  const key = `${story.id}:${story.text.length}`;
  let c = chunkCache.get(key);
  if (!c) { c = chunkParagraphs(paragraphsOf(story)); chunkCache.set(key, c); }
  return c;
}

/** Estimated narration time in seconds for the whole story at the chosen speed. */
export function storySeconds(story: Story) {
  const chunks = chunksFor(story);
  const last = chunks[chunks.length - 1];
  const chars = last ? last.start + last.text.length : story.text.length;
  return chars / charsPerSecond(s().narrator.rate);
}
export function elapsedSeconds(story: Story, index: number) {
  const c = chunksFor(story)[Math.min(index, chunksFor(story).length - 1)];
  return c ? c.start / charsPerSecond(s().narrator.rate) : 0;
}

export const isStoryLocked = (story: Story) => !!story.premium && !s().premium;

export function storyActive() {
  const st = s().story;
  return !!st && (st.status === 'playing' || st.status === 'paused' || st.status === 'loading');
}

export function storyNowPlaying() {
  const st = s().story;
  if (!st || !storyActive()) return null;
  const story = getStory(st.id);
  return story ? { title: story.title, playing: st.status !== 'paused' } : null;
}

// ---------- helpers ----------

function setSession(patch: Partial<StorySession> | null) {
  if (patch === null) { store.set({ story: null }); return; }
  const cur = s().story;
  store.set({ story: { ...(cur ?? { id: '', status: 'reading', index: 0, total: 0, error: null }), ...patch } });
}

function saveProgress(id: string, index: number, total: number, finished = false) {
  store.set((st) => ({ storyProgress: { ...st.storyProgress, [id]: { index: finished ? 0 : index, total, updatedAt: Date.now(), finished } } }));
}

function rememberStory(id: string) {
  store.set((st) => ({ recentStories: [id, ...st.recentStories.filter((r) => r !== id)].slice(0, 12) }));
}

async function speakFrom(story: Story, index: number) {
  const chunks = chunksFor(story);
  const { narrator: prefs } = s();
  setSession({ id: story.id, status: 'loading', index, total: chunks.length, error: null });
  syncNative();
  try {
    await narrator.speak(chunks.map((c) => c.text), index, { voiceId: prefs.voiceId ?? story.voiceId ?? null, rate: prefs.rate, volume: prefs.volume });
    if (s().story?.id !== story.id) return;
    setSession({ status: 'playing' });
    applyStoryTimer();
  } catch (e) {
    if (s().story?.id !== story.id) return;
    const msg = (e as Error)?.message || 'Narration could not start.';
    setSession({ status: 'reading', error: msg });
    toast(`${msg} You can still read the story.`, 'error', 6000);
  }
  syncNative();
}

// ---------- narrator events ----------

let initialised = false;
export async function initStories() {
  if (initialised) return;
  initialised = true;
  narrator.setHandlers({
    onProgress(index) {
      const st = s().story;
      if (!st) return;
      setSession({ index, status: st.status === 'loading' ? 'playing' : st.status });
      saveProgress(st.id, index, st.total);
    },
    onEnd(reason) {
      const st = s().story;
      if (!st) return;
      if (reason === 'timer') { saveProgress(st.id, st.index, st.total); onTimerEnd(); return; }
      saveProgress(st.id, 0, st.total, true);
      const story = getStory(st.id);
      setSession({ status: 'reading', index: st.total - 1 });
      syncNative();
      toast(`“${story?.title ?? 'Story'}” has finished.${s().status !== 'idle' ? ' Your sleep sounds keep playing.' : ''}`, 'info', 5000);
    },
    onError(message) {
      const st = s().story;
      if (!st) return;
      saveProgress(st.id, st.index, st.total);
      setSession({ status: 'reading', error: message });
      syncNative();
      toast(`${message} You can still read the story.`, 'error', 6000);
    },
  });
  const ok = await narrator.available();
  store.set({ narrationAvailable: ok });
}

// ---------- public actions ----------

/** Open the full story page without starting narration. */
export function openStory(id: string) {
  const story = getStory(id);
  if (!story) { toast('That story could not be found.', 'error'); return; }
  store.set({ page: 'storyPlayer', viewStoryId: id });
}

export async function playStory(id: string, fromIndex?: number) {
  const story = getStory(id);
  if (!story) { toast('That story could not be found.', 'error'); return; }
  store.set({ page: 'storyPlayer', viewStoryId: id });
  if (isStoryLocked(story)) { store.set({ sheet: 'premium', premiumFocus: id }); return; }
  await engine.unlock(); // must happen inside the tap

  if (s().narrationAvailable === false) {
    toast("Narration isn't available on this device. You can read the story instead.", 'error', 6000);
    setSession({ id, status: 'reading', index: 0, total: chunksFor(story).length, error: 'Narration unavailable' });
    return;
  }

  const cur = s().story;
  if (cur && cur.id !== id && storyActive()) {
    saveProgress(cur.id, cur.index, cur.total);
    await narrator.stop();
  }

  const chunks = chunksFor(story);
  const saved = s().storyProgress[id];
  const start = fromIndex ?? (saved && !saved.finished ? Math.min(saved.index, chunks.length - 1) : 0);
  rememberStory(id);

  // Background sound: keep anything already playing, otherwise start the chosen one.
  const bg = s().storyBackground;
  if (s().status === 'idle' && bg.soundId) {
    playSound(bg.soundId).then(() => { const cid = s().currentId; if (cid) setLayerVolume(cid, bg.volume); });
  } else if (s().status === 'paused') {
    await engine.resume();
    store.set({ status: 'playing' });
  }

  await speakFrom(story, start);

  const st = s();
  if (!st.timer && st.settings.defaultTimer > 0) setTimer(st.settings.defaultTimer, st.settings.timerMode, true);
}

export async function toggleStory() {
  const st = s().story;
  if (!st) return;
  const story = getStory(st.id);
  if (!story) return;
  if (st.status === 'playing' || st.status === 'loading') {
    const idx = await narrator.pause();
    const index = idx ?? st.index;
    setSession({ status: 'paused', index });
    saveProgress(st.id, index, st.total);
    if (s().status === 'playing') { await engine.pause(); store.set({ status: 'paused' }); }
    else await engine.pause();
    syncNative();
  } else if (st.status === 'paused') {
    await engine.resume();
    if (s().status === 'paused') store.set({ status: 'playing' });
    await speakFrom(story, st.index);
  } else {
    await playStory(st.id, st.status === 'reading' && st.index >= st.total - 1 ? 0 : st.index);
  }
}

/** Stop the story (keeps the position so it can be resumed later). */
export async function stopStory(keepSounds = false) {
  const st = s().story;
  if (!st) return;
  await narrator.stop();
  if (st.status !== 'reading') saveProgress(st.id, st.index, st.total);
  setSession(null);
  if (!keepSounds) syncNative();
}

/** Move by whole paragraphs (-1 = previous, +1 = next). */
export async function skipParagraph(dir: 1 | -1) {
  const st = s().story;
  if (!st) return;
  const story = getStory(st.id);
  if (!story) return;
  const chunks = chunksFor(story);
  const curP = chunks[st.index]?.paragraph ?? 0;
  let target: number;
  if (dir > 0) {
    target = chunks.findIndex((c) => c.paragraph > curP);
    if (target < 0) { toast('This is the last paragraph'); return; }
  } else {
    const firstOfCur = chunks.findIndex((c) => c.paragraph === curP);
    const goBackTo = st.index > firstOfCur ? curP : Math.max(0, curP - 1);
    target = chunks.findIndex((c) => c.paragraph === goBackTo);
  }
  await jumpTo(target);
}

export async function jumpToParagraph(p: number) {
  const st = s().story;
  const id = s().viewStoryId ?? st?.id;
  if (!id) return;
  const story = getStory(id);
  if (!story) return;
  const target = chunksFor(story).findIndex((c) => c.paragraph === p);
  if (target < 0) return;
  if (!st || st.id !== id) { await playStory(id, target); return; }
  await jumpTo(target);
}

async function jumpTo(index: number) {
  const st = s().story;
  if (!st) return;
  const story = getStory(st.id)!;
  saveProgress(st.id, index, st.total);
  if (st.status === 'playing' || st.status === 'loading') await speakFrom(story, index);
  else setSession({ index });
}

export async function restartStory() {
  const st = s().story;
  if (!st) return;
  await jumpTo(0);
}

export function setStoryVolume(v: number) {
  store.set((st) => ({ narrator: { ...st.narrator, volume: v } }));
  narrator.setVolume(v);
}

/** Change voice or speed; a playing story restarts at the current sentence. */
export async function setNarratorPrefs(patch: { voiceId?: string | null; rate?: number }) {
  store.set((st) => ({ narrator: { ...st.narrator, ...patch } }));
  const st = s().story;
  if (st && (st.status === 'playing' || st.status === 'loading')) {
    const story = getStory(st.id);
    if (story) await speakFrom(story, st.index);
  }
}

export async function setStoryBackground(soundId: string | null) {
  store.set((st) => ({ storyBackground: { ...st.storyBackground, soundId } }));
  if (!storyActive()) return;
  if (!soundId) { if (s().status !== 'idle') await stopSounds(); return; }
  if (s().currentId === soundId && s().mode === 'single' && s().status !== 'idle') return;
  await playSound(soundId);
  const cid = s().currentId;
  if (cid) setLayerVolume(cid, s().storyBackground.volume);
  if (s().story?.status === 'paused') { await engine.pause(); store.set({ status: 'paused' }); }
}

export function setStoryBackgroundVolume(v: number) {
  store.set((st) => ({ storyBackground: { ...st.storyBackground, volume: v } }));
  const st = s();
  if (st.status !== 'idle' && st.mode === 'single' && st.currentId) setLayerVolume(st.currentId, v);
}

export function toggleFavouriteStory(id: string) {
  const fav = s().favouriteStories.includes(id);
  store.set((st) => ({ favouriteStories: fav ? st.favouriteStories.filter((f) => f !== id) : [id, ...st.favouriteStories] }));
  const title = getStory(id)?.title ?? 'Story';
  toast(fav ? `Removed “${title}” from favourites` : `Added “${title}” to favourites`, fav ? 'info' : 'success');
}

export function deleteMyStory(id: string) {
  if (s().story?.id === id) stopStory();
  store.set((st) => ({
    myStories: st.myStories.filter((x) => x.id !== id),
    favouriteStories: st.favouriteStories.filter((x) => x !== id),
    recentStories: st.recentStories.filter((x) => x !== id),
  }));
  toast('Story deleted');
}

export function clearStoryHistory() {
  store.set({ recentStories: [], storyProgress: {} });
}

// ---------- sleep timer ----------

export function applyStoryTimer() {
  const st = s();
  if (!st.timer || !st.story || st.story.status !== 'playing') return;
  const remaining = engine.remaining('timer');
  if (remaining === null) return;
  const fade = timerFadeSeconds(st.timer.mode, st.timer.total);
  narrator.fadeOut(Math.min(fade, remaining), remaining);
}

export function cancelStoryTimer() {
  narrator.cancelFade();
}
