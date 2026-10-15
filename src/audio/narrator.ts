/**
 * Narrator — reads stories aloud with the phone's text-to-speech voices.
 *
 *  - Android app: native FusionSpeech plugin (Android TextToSpeech). Free,
 *    offline, keeps reading with the screen off.
 *  - Browser preview: the Web Speech API, where the browser supports it.
 *
 * Nothing is faked: if no voice engine is available, `available()` is false
 * and the app offers reading mode instead.
 */
import { registerPlugin } from '@capacitor/core';
import { isNative } from '../native/platform';

export interface NarratorVoice {
  id: string;
  label: string;
  locale: string;
  network: boolean;
}

export interface SpeakOptions {
  voiceId?: string | null;
  rate: number;
  volume: number;
}

export interface NarratorHandlers {
  onProgress: (index: number) => void;
  onEnd: (reason: 'finished' | 'timer') => void;
  onError: (message: string) => void;
}

interface FusionSpeechPlugin {
  isAvailable(): Promise<{ available: boolean; ready: boolean }>;
  getVoices(): Promise<{ voices: { id: string; locale: string; language: string; quality: number; network: boolean }[]; defaultId: string | null }>;
  speak(o: { chunks: string[]; start: number; voiceId?: string | null; rate: number; pitch: number; volume: number }): Promise<void>;
  pause(): Promise<{ index: number }>;
  stop(): Promise<void>;
  setVolume(o: { volume: number }): Promise<void>;
  fadeOut(o: { fadeMs: number; endMs: number }): Promise<void>;
  cancelFade(): Promise<void>;
  addListener(event: 'progress' | 'end' | 'error', cb: (e: { index?: number; message?: string; reason?: string }) => void): Promise<{ remove: () => Promise<void> }>;
}

const NativeSpeech = registerPlugin<FusionSpeechPlugin>('FusionSpeech');

// ---------- text chunking ----------

export interface Chunk { text: string; paragraph: number; start: number }

/** Split paragraphs into sentence groups of up to ~260 characters. */
export function chunkParagraphs(paragraphs: string[], max = 260): Chunk[] {
  const out: Chunk[] = [];
  let pos = 0;
  paragraphs.forEach((p, pi) => {
    const sentences = p.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [p];
    let buf = '';
    for (const s of sentences) {
      if (buf && (buf + s).length > max) { out.push({ text: buf.trim(), paragraph: pi, start: pos }); pos += buf.length; buf = ''; }
      buf += s;
    }
    if (buf.trim()) { out.push({ text: buf.trim(), paragraph: pi, start: pos }); pos += buf.length; }
  });
  return out;
}

/** Characters per second for slow narration at a given rate. */
export const charsPerSecond = (rate: number) => 13.5 * rate;

// ---------- web speech fallback ----------

class WebSpeech {
  private chunks: string[] = [];
  private index = 0;
  private session = 0;
  private opts: SpeakOptions = { rate: 0.9, volume: 1 };
  private fade: { start: number; end: number } | null = null;
  private endTimer: ReturnType<typeof setTimeout> | null = null;
  private startGuard: ReturnType<typeof setTimeout> | null = null;
  handlers: NarratorHandlers | null = null;

  get supported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'; }

  voices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.supported) return Promise.resolve([]);
    const now = speechSynthesis.getVoices();
    if (now.length) return Promise.resolve(now);
    return new Promise((resolve) => {
      const done = () => resolve(speechSynthesis.getVoices());
      speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 1500);
    });
  }

  async speak(chunks: string[], start: number, opts: SpeakOptions) {
    this.stopInternal();
    this.chunks = chunks;
    this.index = start;
    this.opts = opts;
    const s = ++this.session;
    await this.next(s);
  }

  private volumeNow() {
    if (!this.fade) return this.opts.volume;
    const now = Date.now();
    if (now <= this.fade.start) return this.opts.volume;
    const k = (this.fade.end - now) / Math.max(1, this.fade.end - this.fade.start);
    return Math.max(0.05, this.opts.volume * Math.max(0, k));
  }

  private async next(s: number) {
    if (s !== this.session || this.index >= this.chunks.length) return;
    const u = new SpeechSynthesisUtterance(this.chunks[this.index]);
    u.rate = this.opts.rate;
    u.pitch = 0.95;
    u.volume = this.volumeNow();
    const voices = await this.voices();
    if (s !== this.session) return; // paused, stopped or restarted while loading voices
    const v = voices.find((x) => x.voiceURI === this.opts.voiceId) ?? voices.find((x) => x.lang.startsWith('en'));
    if (v) u.voice = v;
    const myIndex = this.index;
    u.onstart = () => { if (this.startGuard) clearTimeout(this.startGuard); };
    u.onend = () => {
      if (s !== this.session || myIndex !== this.index) return;
      this.index++;
      if (this.index >= this.chunks.length) { this.clearTimers(); this.handlers?.onEnd('finished'); }
      else { this.handlers?.onProgress(this.index); this.next(s); }
    };
    u.onerror = (e) => {
      if (s !== this.session || e.error === 'interrupted' || e.error === 'canceled') return;
      this.session++;
      this.handlers?.onError('Narration stopped because the browser voice reported an error.');
    };
    if (this.startGuard) clearTimeout(this.startGuard);
    this.startGuard = setTimeout(() => {
      if (s !== this.session || speechSynthesis.speaking) return;
      this.session++;
      speechSynthesis.cancel();
      this.handlers?.onError("Narration couldn't start. This browser may not have a voice installed.");
    }, 5000);
    speechSynthesis.speak(u);
    this.handlers?.onProgress(this.index);
  }

  pause() { this.stopInternal(); return this.index; }
  stop() { this.stopInternal(); }
  setVolume(v: number) { this.opts = { ...this.opts, volume: v }; }
  fadeOut(fadeMs: number, endMs: number) {
    this.clearTimers();
    const end = Date.now() + endMs;
    this.fade = { start: end - fadeMs, end };
    this.endTimer = setTimeout(() => { this.stopInternal(); this.handlers?.onEnd('timer'); }, endMs);
  }
  cancelFade() { this.clearTimers(); this.fade = null; }

  private clearTimers() {
    if (this.endTimer) clearTimeout(this.endTimer);
    if (this.startGuard) clearTimeout(this.startGuard);
    this.endTimer = null; this.startGuard = null;
  }
  private stopInternal() {
    this.session++;
    this.clearTimers();
    this.fade = null;
    if (this.supported) speechSynthesis.cancel();
  }
}

// ---------- public narrator ----------

const LOCALE_NAMES: Record<string, string> = {
  'en-ZA': 'South African English', 'en-GB': 'British English', 'en-US': 'American English',
  'en-AU': 'Australian English', 'en-IN': 'Indian English', 'en-IE': 'Irish English', 'en-NG': 'Nigerian English',
};

function friendlyLabel(locale: string, n: number, network: boolean) {
  const base = LOCALE_NAMES[locale] ?? `English (${locale.split('-')[1] ?? locale})`;
  return `${base} · voice ${n}${network ? ' · online' : ''}`;
}

const PREFERRED = ['en-ZA', 'en-GB', 'en-US', 'en-AU', 'en-IE', 'en-IN'];
const rank = (locale: string) => { const i = PREFERRED.indexOf(locale); return i < 0 ? 99 : i; };

class Narrator {
  private web = new WebSpeech();
  private handlers: NarratorHandlers | null = null;
  private listening = false;
  private voiceCache: NarratorVoice[] | null = null;

  setHandlers(h: NarratorHandlers) {
    this.handlers = h;
    this.web.handlers = h;
    if (isNative && !this.listening) {
      this.listening = true;
      NativeSpeech.addListener('progress', (e) => this.handlers?.onProgress(e.index ?? 0)).catch(() => undefined);
      NativeSpeech.addListener('end', (e) => this.handlers?.onEnd(e.reason === 'timer' ? 'timer' : 'finished')).catch(() => undefined);
      NativeSpeech.addListener('error', (e) => this.handlers?.onError(e.message ?? 'Narration stopped.')).catch(() => undefined);
    }
  }

  async available(): Promise<boolean> {
    if (isNative) {
      try { return (await NativeSpeech.isAvailable()).available; } catch { return false; }
    }
    if (!this.web.supported) return false;
    return (await this.web.voices()).some((v) => v.lang.toLowerCase().startsWith('en'));
  }

  async voices(): Promise<{ voices: NarratorVoice[]; defaultId: string | null }> {
    if (this.voiceCache) return { voices: this.voiceCache, defaultId: this.voiceCache[0]?.id ?? null };
    let list: NarratorVoice[] = [];
    let defaultId: string | null = null;
    if (isNative) {
      try {
        const r = await NativeSpeech.getVoices();
        defaultId = r.defaultId;
        const sorted = r.voices
          .filter((v) => !v.network)
          .concat(r.voices.filter((v) => v.network))
          .sort((a, b) => rank(a.locale) - rank(b.locale) || Number(a.network) - Number(b.network) || b.quality - a.quality);
        const counts: Record<string, number> = {};
        list = sorted.map((v) => {
          counts[v.locale] = (counts[v.locale] ?? 0) + 1;
          return { id: v.id, locale: v.locale, network: v.network, label: friendlyLabel(v.locale, counts[v.locale], v.network) };
        });
      } catch { list = []; }
    } else {
      const vs = (await this.web.voices()).filter((v) => v.lang.toLowerCase().startsWith('en'));
      list = vs.sort((a, b) => rank(a.lang) - rank(b.lang)).map((v) => ({ id: v.voiceURI, locale: v.lang, network: !v.localService, label: v.name }));
      defaultId = list[0]?.id ?? null;
    }
    this.voiceCache = list;
    return { voices: list, defaultId };
  }

  async speak(chunks: string[], start: number, opts: SpeakOptions) {
    if (isNative) await NativeSpeech.speak({ chunks, start, voiceId: opts.voiceId, rate: opts.rate, pitch: 0.95, volume: opts.volume });
    else await this.web.speak(chunks, start, opts);
  }
  async pause(): Promise<number | null> {
    if (isNative) { try { return (await NativeSpeech.pause()).index; } catch { return null; } }
    return this.web.pause();
  }
  async stop() { if (isNative) await NativeSpeech.stop().catch(() => undefined); else this.web.stop(); }
  async setVolume(v: number) { if (isNative) await NativeSpeech.setVolume({ volume: v }).catch(() => undefined); else this.web.setVolume(v); }
  /** Lower the voice over the last `fadeSec`, stopping after `endSec`. */
  async fadeOut(fadeSec: number, endSec: number) {
    const fadeMs = Math.round(fadeSec * 1000), endMs = Math.round(endSec * 1000);
    if (isNative) await NativeSpeech.fadeOut({ fadeMs, endMs }).catch(() => undefined);
    else this.web.fadeOut(fadeMs, endMs);
  }
  async cancelFade() { if (isNative) await NativeSpeech.cancelFade().catch(() => undefined); else this.web.cancelFade(); }
}

export const narrator = new Narrator();
