/**
 * AudioEngine — Web Audio based player used for single sounds AND the mixer.
 *
 *   source(s) ─► layer gain ─┐
 *   source(s) ─► layer gain ─┼─► fade gain (timer) ─► master gain ─► speakers
 *   source(s) ─► layer gain ─┘
 *
 * The sleep timer and track endings are scheduled on the AUDIO clock, so the
 * fade-out and stop still happen even if the phone throttles JavaScript while
 * the screen is off.
 */
import type { Sound } from '../data/sounds';
import { renderRecipe, type SynthResult } from './synth';
import { createSynthWorker } from './workerFactory';

export class AudioUnavailableError extends Error {
  constructor(public soundName: string, reason: string) {
    super(`"${soundName}" is unavailable: ${reason}`);
  }
}

export interface LayerInput { sound: Sound; volume: number; muted: boolean }

interface Channel { src: AudioBufferSourceNode; gain: GainNode; sound: Sound }
interface Schedule { at: number; fade: number; node: ConstantSourceNode }

const MAX_CACHE = 10;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private fadeGain!: GainNode;
  private channels = new Map<string, Channel>();
  private cache = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer>>();
  private worker: Worker | null | undefined;
  private reqId = 0;
  private reqs = new Map<number, { resolve: (r: SynthResult) => void; reject: (e: Error) => void }>();
  private schedules: Partial<Record<'timer' | 'track', Schedule>> = {};
  private masterVolume = 0.8;
  private layerToken = 0;
  onStateChange: ((state: AudioContextState) => void) | null = null;

  get ready() { return !!this.ctx; }
  get state(): AudioContextState | 'none' { return this.ctx?.state ?? 'none'; }
  now() { return this.ctx?.currentTime ?? 0; }

  /** Must be called from a user gesture the first time. */
  async unlock() {
    if (!this.ctx) {
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC({ latencyHint: 'playback' });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.fadeGain = this.ctx.createGain();
      this.fadeGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.ctx.onstatechange = () => this.onStateChange?.(this.ctx!.state);
    }
    if (this.ctx.state !== 'running') await this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  // ---------- loading ----------

  private renderInWorker(recipe: string): Promise<SynthResult> {
    if (this.worker === undefined) {
      this.worker = createSynthWorker();
      if (this.worker) {
        this.worker.onmessage = (e: MessageEvent) => {
          const d = e.data, req = this.reqs.get(d.id);
          if (!req) return;
          this.reqs.delete(d.id);
          if (d.ok) req.resolve(d as SynthResult); else req.reject(new Error(d.error));
        };
        this.worker.onerror = () => { this.worker = null; };
      }
    }
    if (!this.worker) {
      return new Promise((resolve, reject) => setTimeout(() => {
        try { resolve(renderRecipe(recipe)); } catch (e) { reject(e as Error); }
      }, 30));
    }
    const id = ++this.reqId;
    return new Promise((resolve, reject) => {
      this.reqs.set(id, { resolve, reject });
      this.worker!.postMessage({ id, recipe });
    });
  }

  isLoaded(sound: Sound) { return this.cache.has(sound.id); }
  bufferDuration(id: string) { return this.cache.get(id)?.duration ?? null; }

  load(sound: Sound): Promise<AudioBuffer> {
    const hit = this.cache.get(sound.id);
    if (hit) { this.cache.delete(sound.id); this.cache.set(sound.id, hit); return Promise.resolve(hit); }
    const pending = this.loading.get(sound.id);
    if (pending) return pending;
    const p = this.loadUncached(sound).then((buf) => {
      this.cache.set(sound.id, buf);
      this.trimCache();
      return buf;
    }).finally(() => this.loading.delete(sound.id));
    this.loading.set(sound.id, p);
    return p;
  }

  private async loadUncached(sound: Sound): Promise<AudioBuffer> {
    const ctx = await this.unlock();
    if (sound.src) {
      let res: Response;
      try { res = await fetch(sound.src); } catch { throw new AudioUnavailableError(sound.name, 'the audio file could not be opened'); }
      if (!res.ok) throw new AudioUnavailableError(sound.name, `the audio file is missing (${res.status})`);
      const data = await res.arrayBuffer();
      try { return await ctx.decodeAudioData(data); } catch { throw new AudioUnavailableError(sound.name, 'the audio file is damaged or in an unsupported format'); }
    }
    if (!sound.recipe) throw new AudioUnavailableError(sound.name, 'no audio has been added for this sound yet');
    let r: SynthResult;
    try { r = await this.renderInWorker(sound.recipe); } catch (e) { throw new AudioUnavailableError(sound.name, (e as Error).message); }
    const buf = ctx.createBuffer(2, r.left.length, r.sampleRate);
    buf.getChannelData(0).set(r.left);
    buf.getChannelData(1).set(r.right);
    return buf;
  }

  private trimCache() {
    for (const key of this.cache.keys()) {
      if (this.cache.size <= MAX_CACHE) break;
      if (!this.channels.has(key)) this.cache.delete(key);
    }
  }

  // ---------- playback ----------

  /**
   * Make the set of playing layers match `layers`. Sounds already playing keep
   * playing (no restart, no gap); new ones fade in; removed ones fade out.
   * Returns the layers that failed to load.
   */
  async setLayers(layers: LayerInput[], loop = true): Promise<AudioUnavailableError[]> {
    const token = ++this.layerToken;
    const ctx = await this.unlock();
    const results = await Promise.allSettled(layers.map((l) => this.load(l.sound)));
    if (token !== this.layerToken) return []; // a newer request replaced this one
    const errors: AudioUnavailableError[] = [];
    const wanted = new Set<string>();

    layers.forEach((l, i) => {
      const r = results[i];
      if (r.status === 'rejected') {
        errors.push(r.reason instanceof AudioUnavailableError ? r.reason : new AudioUnavailableError(l.sound.name, String(r.reason)));
        return;
      }
      wanted.add(l.sound.id);
      const target = l.muted ? 0 : l.volume;
      const existing = this.channels.get(l.sound.id);
      if (existing) {
        existing.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
        existing.src.loop = loop;
        return;
      }
      const src = ctx.createBufferSource();
      src.buffer = r.value;
      src.loop = loop;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.2);
      src.connect(gain).connect(this.fadeGain);
      src.start();
      this.channels.set(l.sound.id, { src, gain, sound: l.sound });
    });

    for (const [id, ch] of this.channels) if (!wanted.has(id)) this.release(id, ch, 0.6);
    return errors;
  }

  setLayerVolume(id: string, volume: number, muted: boolean) {
    const ch = this.channels.get(id);
    if (!ch || !this.ctx) return;
    ch.gain.gain.setTargetAtTime(muted ? 0 : volume, this.ctx.currentTime, 0.06);
  }

  setMasterVolume(v: number) {
    this.masterVolume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  private release(id: string, ch: Channel, fade: number) {
    this.channels.delete(id);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    ch.gain.gain.cancelScheduledValues(t);
    ch.gain.gain.setValueAtTime(ch.gain.gain.value, t);
    ch.gain.gain.linearRampToValueAtTime(0, t + fade);
    try { ch.src.stop(t + fade + 0.05); } catch { /* already stopped */ }
    setTimeout(() => { try { ch.src.disconnect(); ch.gain.disconnect(); } catch { /* noop */ } }, (fade + 0.3) * 1000);
  }

  async pause() { if (this.ctx?.state === 'running') await this.ctx.suspend(); }
  async resume() { await this.unlock(); }

  /** Stop everything (with a short fade so there's no click). */
  async stopAll(fade = 0.5, keepTimer = false) {
    this.layerToken++;
    if (!keepTimer) this.cancel('timer', false);
    this.cancel('track', false);
    const running = this.ctx?.state === 'running';
    const f = running ? fade : 0;
    for (const [id, ch] of this.channels) this.release(id, ch, f);
    if (keepTimer) { this.applyFade(); return; }
    if (this.ctx) {
      const g = this.fadeGain.gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.setValueAtTime(1, t + f + 0.1);
    }
  }

  get playingIds() { return [...this.channels.keys()]; }

  // ---------- scheduled endings (sleep timer / finite track) ----------

  /** Schedule an end at ctx time `at`, fading out over `fade` seconds first. */
  schedule(kind: 'timer' | 'track', at: number, fade: number, onEnd: () => void) {
    if (!this.ctx) return;
    this.cancel(kind, false);
    const node = this.ctx.createConstantSource();
    node.offset.value = 0;
    node.connect(this.fadeGain); // silent; keeps the node alive in the graph
    node.onended = () => {
      if (this.schedules[kind]?.node !== node) return;
      delete this.schedules[kind];
      onEnd();
    };
    node.start();
    node.stop(at);
    this.schedules[kind] = { at, fade, node };
    this.applyFade();
  }

  cancel(kind: 'timer' | 'track', reapply = true) {
    const s = this.schedules[kind];
    if (!s) return;
    delete this.schedules[kind];
    s.node.onended = null;
    try { s.node.stop(); s.node.disconnect(); } catch { /* noop */ }
    if (reapply) this.applyFade();
  }

  /** Remaining seconds on a schedule (audio clock — pauses when playback pauses). */
  remaining(kind: 'timer' | 'track') {
    const s = this.schedules[kind];
    return s && this.ctx ? Math.max(0, s.at - this.ctx.currentTime) : null;
  }

  private applyFade() {
    if (!this.ctx) return;
    const g = this.fadeGain.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    const list = Object.values(this.schedules).filter(Boolean) as Schedule[];
    if (!list.length) { g.linearRampToValueAtTime(1, now + 0.3); return; }
    const first = list.reduce((a, b) => (a.at < b.at ? a : b));
    const fadeStart = Math.max(now, first.at - first.fade);
    if (fadeStart > now) {
      g.linearRampToValueAtTime(1, now + 0.3);
      g.setValueAtTime(1, fadeStart);
    }
    g.linearRampToValueAtTime(0.0001, Math.max(fadeStart + 0.05, first.at));
  }
}

export const engine = new AudioEngine();
