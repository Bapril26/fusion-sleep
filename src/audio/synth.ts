/**
 * Fusion Sound Engine — original ambient sounds generated on the device.
 *
 * Each recipe builds a seamless loop: noise beds are rendered slightly longer
 * than the loop and cross-faded back into the start, and every event
 * (rain drops, thunder, birds, chords …) is written "wrapped" around the loop
 * boundary. The result repeats with no gap or click.
 *
 * Everything here is original procedural audio created by Fusion Labs code,
 * so there are no third-party licensing restrictions.
 */

export const SYNTH_RATE = 32000;

export interface SynthResult {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  seconds: number;
}

// ---------- helpers ----------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const TABLE_SIZE = 4096;
const SINE = new Float32Array(TABLE_SIZE + 1);
for (let i = 0; i <= TABLE_SIZE; i++) SINE[i] = Math.sin((i / TABLE_SIZE) * TAU);
/** fast sine of a phase measured in cycles (0..1 wraps) */
function sinc(phase: number) {
  const p = phase - Math.floor(phase);
  const x = p * TABLE_SIZE;
  const i = x | 0;
  const f = x - i;
  return SINE[i] + (SINE[i + 1] - SINE[i]) * f;
}

class Ctx {
  readonly sr = SYNTH_RATE;
  readonly n: number;
  readonly xf: number;
  readonly m: number;
  readonly out: Float32Array;
  readonly r: () => number;
  constructor(readonly L: number, seed: number) {
    this.n = Math.round(L * this.sr);
    this.xf = Math.round(Math.min(3, L / 6) * this.sr);
    this.m = this.n + this.xf;
    this.out = new Float32Array(this.n);
    this.r = rng(seed);
  }
  rand(lo: number, hi: number) { return lo + (hi - lo) * this.r(); }
  /** quantise a frequency so it repeats exactly within the loop */
  qf(f: number) { return Math.max(1, Math.round(f * this.L)) / this.L; }

  white(len = this.m) {
    const x = new Float32Array(len);
    for (let i = 0; i < len; i++) x[i] = this.r() * 2 - 1;
    return x;
  }
  pink(len = this.m) {
    const x = new Float32Array(len);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = this.r() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      x[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return x;
  }
  brown(len = this.m) {
    const x = new Float32Array(len);
    let b = 0;
    for (let i = 0; i < len; i++) {
      b = (b + 0.02 * (this.r() * 2 - 1)) / 1.02;
      x[i] = b * 3.5;
    }
    return x;
  }

  /** Cross-fade a bed of length m into a seamless loop of length n. */
  loop(x: Float32Array) {
    const { n, xf } = this;
    const y = x.slice(0, n);
    for (let i = 0; i < xf; i++) {
      const t = i / xf;
      y[i] = x[i] * Math.sin(t * Math.PI / 2) + x[n + i] * Math.cos(t * Math.PI / 2);
    }
    return y;
  }
  add(src: Float32Array, gain = 1) {
    const o = this.out;
    for (let i = 0; i < o.length; i++) o[i] += src[i] * gain;
  }
  /** add a bed (length m) as a seamless loop */
  addBed(x: Float32Array, gain = 1) { this.add(this.loop(x), gain); }
  /** Add an event buffer starting at time t (seconds), wrapping around the loop. */
  addEvent(ev: Float32Array, t: number, gain = 1) {
    const o = this.out, n = this.n;
    let start = Math.round(t * this.sr) % n;
    if (start < 0) start += n;
    for (let i = 0; i < ev.length; i++) o[(start + i) % n] += ev[i] * gain;
  }
  /** Periodic smooth modulation in [0,1] — repeats exactly every loop. */
  slowMod(minK: number, maxK: number, count = 5) {
    const comps = Array.from({ length: count }, () => ({
      k: Math.round(this.rand(minK, maxK)), p: this.r(), a: this.rand(0.4, 1),
    }));
    const total = comps.reduce((s, c) => s + c.a, 0);
    return (t: number) => {
      let v = 0;
      for (const c of comps) v += c.a * Math.sin(TAU * (c.k * t / this.L + c.p));
      return 0.5 + 0.5 * (v / total);
    };
  }
}

// ---------- filters (in place) ----------

function lowpass(x: Float32Array, fc: number, sr = SYNTH_RATE, passes = 1) {
  const a = Math.exp(-TAU * fc / sr);
  for (let p = 0; p < passes; p++) {
    let y = x[0];
    for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = y; }
  }
  return x;
}
function highpass(x: Float32Array, fc: number, sr = SYNTH_RATE) {
  const a = Math.exp(-TAU * fc / sr);
  let y = 0;
  for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = x[i] - y; }
  return x;
}
/** time-varying low-pass; fcAt(t seconds) */
function lowpassVar(x: Float32Array, fcAt: (t: number) => number, L: number, sr = SYNTH_RATE, passes = 2) {
  for (let p = 0; p < passes; p++) {
    let y = 0, a = 0;
    for (let i = 0; i < x.length; i++) {
      if ((i & 63) === 0) a = Math.exp(-TAU * fcAt((i / sr) % L) / sr);
      y = (1 - a) * x[i] + a * y; x[i] = y;
    }
  }
  return x;
}
function bandpass(x: Float32Array, f: number, q: number, sr = SYNTH_RATE) {
  const w = TAU * f / sr, alpha = Math.sin(w) / (2 * q), cw = Math.cos(w);
  const a0 = 1 + alpha;
  const b0 = alpha / a0, b2 = -alpha / a0, a1 = -2 * cw / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const y = b0 * xi + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}
/** Small Schroeder reverb, processed twice around so the tail wraps the loop. */
function wrapReverb(x: Float32Array, wet: number, size = 1) {
  const n = x.length;
  const buf = new Float32Array(n * 2);
  buf.set(x); buf.set(x, n);
  const k = SYNTH_RATE / 44100 * size;
  const combs = [1116, 1188, 1277, 1356, 1422].map((d) => ({ d: Math.round(d * k * 1.6), b: new Float32Array(Math.round(d * k * 1.6)), i: 0, f: 0 }));
  const aps = [556, 441, 341].map((d) => ({ d: Math.round(d * k), b: new Float32Array(Math.round(d * k)), i: 0 }));
  const out = new Float32Array(n);
  for (let s = 0; s < 2 * n; s++) {
    const inp = buf[s] * 0.2;
    let acc = 0;
    for (const c of combs) {
      const y = c.b[c.i];
      c.f = y * 0.7 + c.f * 0.3; // damping
      c.b[c.i] = inp + c.f * 0.84;
      c.i = (c.i + 1) % c.d;
      acc += y;
    }
    for (const a of aps) {
      const y = a.b[a.i];
      a.b[a.i] = acc + y * 0.5;
      acc = y - acc * 0.5;
      a.i = (a.i + 1) % a.d;
    }
    if (s >= n) out[s - n] = x[s - n] * (1 - wet * 0.4) + acc * wet;
  }
  return out;
}

// ---------- building blocks ----------

interface RainOpts {
  bed: number; lp: number; hp?: number; whiteMix?: number;
  dropRate: number; dropF: [number, number]; dropTau: [number, number]; dropGain: number;
  thudRate?: number; thudGain?: number;
  pat?: { rate: number; f: [number, number]; q: number; gain: number };
  swell?: number;
}

function rain(c: Ctx, o: RainOpts) {
  // steady bed
  const p = c.pink();
  if (o.whiteMix) { const w = c.white(); for (let i = 0; i < p.length; i++) p[i] = p[i] * (1 - o.whiteMix) + w[i] * o.whiteMix * 0.35; }
  lowpass(p, o.lp, SYNTH_RATE, 2);
  highpass(p, o.hp ?? 180);
  if (o.swell) {
    const mod = c.slowMod(1, 4, 3);
    for (let i = 0; i < p.length; i++) p[i] *= 1 - o.swell + o.swell * 2 * mod((i / c.sr) % c.L);
  }
  c.addBed(p, o.bed);

  // individual drops
  const drops = Math.round(o.dropRate * c.L);
  for (let k = 0; k < drops; k++) {
    const f = c.rand(o.dropF[0], o.dropF[1]);
    const tau = c.rand(o.dropTau[0], o.dropTau[1]) * c.sr;
    const len = Math.round(tau * 5);
    const ev = new Float32Array(len);
    let ph = c.r();
    for (let i = 0; i < len; i++) {
      ph += f * (1 + 0.6 * i / len) / c.sr;
      ev[i] = Math.exp(-i / tau) * (0.65 * sinc(ph) + 0.35 * (c.r() * 2 - 1));
    }
    const a = c.r();
    c.addEvent(ev, c.rand(0, c.L), o.dropGain * a * a);
  }

  // low thuds (roof / tent)
  if (o.thudRate) {
    const thuds = Math.round(o.thudRate * c.L);
    for (let k = 0; k < thuds; k++) {
      const f = c.rand(70, 160), tau = c.rand(0.01, 0.03) * c.sr, len = Math.round(tau * 5);
      const ev = new Float32Array(len);
      for (let i = 0; i < len; i++) ev[i] = Math.exp(-i / tau) * (Math.sin(TAU * f * i / c.sr) + 0.3 * (c.r() * 2 - 1));
      c.addEvent(ev, c.rand(0, c.L), (o.thudGain ?? 0.2) * c.r());
    }
  }

  // resonant pats (canvas, glass)
  if (o.pat) {
    const pats = Math.round(o.pat.rate * c.L);
    for (let k = 0; k < pats; k++) {
      const len = Math.round(0.06 * c.sr);
      const ev = new Float32Array(len);
      const tau = c.rand(0.002, 0.006) * c.sr;
      for (let i = 0; i < len; i++) ev[i] = (c.r() * 2 - 1) * Math.exp(-i / tau);
      bandpass(ev, c.rand(o.pat.f[0], o.pat.f[1]), o.pat.q);
      const a = c.r();
      c.addEvent(ev, c.rand(0, c.L), o.pat.gain * a * a);
    }
  }
}

function thunderClap(c: Ctx, t: number, opts: { dur: number; amp: number; lp: number; crack?: boolean; rolls?: number }) {
  const len = Math.round(opts.dur * c.sr);
  const ev = c.brown(len);
  lowpass(ev, opts.lp, SYNTH_RATE, 2);
  const rolls = opts.rolls ?? 3;
  const peaks = Array.from({ length: rolls }, (_, i) => ({
    at: i === 0 ? c.rand(0.05, 0.4) : c.rand(0.3, opts.dur * 0.55),
    a: i === 0 ? 1 : c.rand(0.35, 0.85),
    w: c.rand(0.5, 1.6),
  }));
  for (let i = 0; i < len; i++) {
    const ts = i / c.sr;
    let env = 0;
    for (const p of peaks) {
      const u = ts - p.at;
      env += p.a * (u < 0 ? Math.exp(-(u * u) / 0.04) : Math.exp(-u / p.w));
    }
    const fadeOut = Math.min(1, (opts.dur - ts) / 1.5);
    ev[i] *= env * fadeOut;
  }
  if (opts.crack) {
    const cl = Math.round(1.2 * c.sr);
    const cr = c.white(cl);
    lowpass(cr, 2200, SYNTH_RATE, 2);
    for (let i = 0; i < cl; i++) ev[i] += cr[i] * Math.exp(-i / (0.18 * c.sr)) * 0.55;
  }
  c.addEvent(ev, t, opts.amp);
}

function tone(c: Ctx, seconds: number, partials: { f: number; a: number; decay?: number; detune?: number }[], attack = 0.01, release = 0.5) {
  const len = Math.round(seconds * c.sr);
  const ev = new Float32Array(len);
  for (const p of partials) {
    const d = p.decay ? p.decay * c.sr : 0;
    const det = p.detune ?? 0;
    let ph1 = c.r(), ph2 = c.r();
    const inc1 = p.f / c.sr, inc2 = (p.f + det) / c.sr;
    for (let i = 0; i < len; i++) {
      ph1 += inc1; ph2 += inc2;
      const env = d ? Math.exp(-i / d) : 1;
      ev[i] += p.a * env * (det ? 0.5 * (sinc(ph1) + sinc(ph2)) : sinc(ph1));
    }
  }
  const atk = attack * c.sr, rel = release * c.sr;
  for (let i = 0; i < len; i++) {
    let g = 1;
    if (i < atk) g = i / atk;
    if (i > len - rel) g *= Math.max(0, (len - i) / rel);
    ev[i] *= g;
  }
  return ev;
}

function sweep(c: Ctx, dur: number, f0: number, f1: number, opts: { vib?: number; vibDepth?: number; h2?: number } = {}) {
  const len = Math.round(dur * c.sr);
  const ev = new Float32Array(len);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    let f = f0 + (f1 - f0) * t;
    if (opts.vib) f *= 1 + (opts.vibDepth ?? 0.02) * Math.sin(TAU * opts.vib * i / c.sr);
    ph += f / c.sr; ph2 += 2 * f / c.sr;
    const env = Math.pow(Math.sin(Math.PI * t), 2);
    ev[i] = env * (sinc(ph) + (opts.h2 ?? 0.12) * sinc(ph2));
  }
  return ev;
}

function birdsong(c: Ctx, rate: number, gain: number) {
  const phrases = Math.max(1, Math.round(rate * c.L));
  for (let k = 0; k < phrases; k++) {
    let t = c.rand(0, c.L);
    const kind = Math.floor(c.r() * 4);
    const amp = gain * c.rand(0.3, 1);
    if (kind === 0) { // chirp series
      const count = 3 + Math.floor(c.r() * 4), f = c.rand(2800, 3800);
      for (let i = 0; i < count; i++) { c.addEvent(sweep(c, 0.07, f * 1.35, f), t, amp); t += c.rand(0.1, 0.16); }
    } else if (kind === 1) { // two-note whistle
      const f = c.rand(1800, 2600);
      c.addEvent(sweep(c, 0.28, f, f * 1.02, { vib: 7 }), t, amp);
      c.addEvent(sweep(c, 0.32, f * 0.8, f * 0.78, { vib: 7 }), t + 0.36, amp);
    } else if (kind === 2) { // trill
      const f = c.rand(4000, 5000), count = 8 + Math.floor(c.r() * 8);
      for (let i = 0; i < count; i++) { c.addEvent(sweep(c, 0.035, f, f * 1.12), t, amp * 0.7); t += 0.05; }
    } else { // rising call
      const f = c.rand(2000, 2800);
      c.addEvent(sweep(c, 0.22, f, f * 1.5, { h2: 0.2 }), t, amp);
      c.addEvent(sweep(c, 0.12, f * 1.4, f * 1.2), t + 0.3, amp * 0.7);
    }
  }
}

function crickets(c: Ctx, count: number, gain: number, distant = false) {
  for (let k = 0; k < count; k++) {
    const carrier = c.rand(3800, 5200);
    const chirps = Math.max(1, Math.round(c.L / c.rand(0.45, 0.9)));
    const period = c.L / chirps;
    const offset = c.rand(0, period);
    const pulses = 2 + Math.floor(c.r() * 3);
    const amp = gain * c.rand(0.35, 1);
    const pulseLen = Math.round(0.016 * c.sr), gap = Math.round(0.012 * c.sr);
    const ev = new Float32Array(pulses * (pulseLen + gap));
    let ph = 0;
    for (let i = 0; i < ev.length; i++) {
      ph += carrier / c.sr;
      const inPulse = i % (pulseLen + gap);
      const env = inPulse < pulseLen ? Math.sin(Math.PI * inPulse / pulseLen) : 0;
      ev[i] = env * sinc(ph);
    }
    if (distant) lowpass(ev, 3500, SYNTH_RATE, 1);
    const mod = c.slowMod(1, 3, 2);
    for (let j = 0; j < chirps; j++) {
      const t = offset + j * period;
      c.addEvent(ev, t, amp * (0.55 + 0.45 * mod(t % c.L)));
    }
  }
}

function softWind(c: Ctx, gain: number, lo = 180, hi = 650) {
  const g = c.slowMod(1, 5, 4);
  const w = c.brown();
  lowpassVar(w, (t) => lo + (hi - lo) * g(t), c.L);
  for (let i = 0; i < w.length; i++) w[i] *= 0.45 + 0.55 * g((i / c.sr) % c.L);
  c.addBed(w, gain * 2.2);
}

// ---------- recipes ----------

type Recipe = { L: number; loud: number; build: (c: Ctx) => void; reverb?: number };

const RECIPES: Record<string, Recipe> = {
  rainGentle: { L: 20, loud: 0.11, build: (c) => rain(c, { bed: 0.9, lp: 3200, dropRate: 35, dropF: [1800, 4200], dropTau: [0.003, 0.008], dropGain: 0.32, swell: 0.12 }) },
  rainHeavy: { L: 20, loud: 0.15, build: (c) => rain(c, { bed: 1.2, lp: 7000, whiteMix: 0.5, dropRate: 160, dropF: [1200, 5000], dropTau: [0.002, 0.007], dropGain: 0.4, swell: 0.18, thudRate: 6, thudGain: 0.12 }) },
  rainRoof: { L: 20, loud: 0.13, build: (c) => rain(c, { bed: 0.7, lp: 2400, dropRate: 50, dropF: [2500, 5200], dropTau: [0.002, 0.005], dropGain: 0.45, thudRate: 18, thudGain: 0.35, pat: { rate: 30, f: [700, 1600], q: 6, gain: 0.5 } }) },
  rainWindow: { L: 20, loud: 0.11, build: (c) => {
    rain(c, { bed: 0.6, lp: 2000, dropRate: 10, dropF: [1500, 3000], dropTau: [0.004, 0.01], dropGain: 0.25, pat: { rate: 22, f: [2500, 5500], q: 9, gain: 0.7 } });
    // occasional trickles sliding down the glass
    for (let k = 0; k < 6; k++) { const f = c.rand(900, 1500); c.addEvent(sweep(c, c.rand(0.4, 0.9), f, f * 1.3, { h2: 0.05 }), c.rand(0, c.L), 0.04); }
  } },
  rainForest: { L: 24, loud: 0.12, build: (c) => {
    rain(c, { bed: 0.8, lp: 2600, dropRate: 30, dropF: [600, 1600], dropTau: [0.006, 0.018], dropGain: 0.4, swell: 0.2 });
    softWind(c, 0.25, 200, 700);
  } },
  rainTent: { L: 20, loud: 0.13, build: (c) => rain(c, { bed: 0.45, lp: 1800, dropRate: 15, dropF: [1500, 3000], dropTau: [0.003, 0.006], dropGain: 0.2, thudRate: 10, thudGain: 0.2, pat: { rate: 70, f: [250, 520], q: 4, gain: 0.9 } }) },
  rainTropical: { L: 24, loud: 0.15, build: (c) => {
    rain(c, { bed: 1.3, lp: 6000, whiteMix: 0.4, dropRate: 140, dropF: [900, 3800], dropTau: [0.004, 0.012], dropGain: 0.45, swell: 0.25, thudRate: 8, thudGain: 0.15 });
    birdsong(c, 0.12, 0.05);
  } },

  thunderDistant: { L: 40, loud: 0.11, build: (c) => {
    rain(c, { bed: 0.6, lp: 2600, dropRate: 20, dropF: [1800, 3800], dropTau: [0.003, 0.007], dropGain: 0.2 });
    thunderClap(c, 5, { dur: 9, amp: 0.9, lp: 140, rolls: 4 });
    thunderClap(c, 24, { dur: 8, amp: 0.7, lp: 120, rolls: 3 });
  } },
  thunderGentle: { L: 40, loud: 0.12, build: (c) => {
    rain(c, { bed: 0.85, lp: 3500, dropRate: 45, dropF: [1500, 4000], dropTau: [0.003, 0.008], dropGain: 0.3, swell: 0.15 });
    thunderClap(c, 4, { dur: 8, amp: 1.1, lp: 220, rolls: 3 });
    thunderClap(c, 22, { dur: 9, amp: 0.9, lp: 180, rolls: 4 });
  } },
  thunderHeavy: { L: 40, loud: 0.15, build: (c) => {
    rain(c, { bed: 1.2, lp: 6500, whiteMix: 0.5, dropRate: 150, dropF: [1200, 5000], dropTau: [0.002, 0.007], dropGain: 0.4, swell: 0.2, thudRate: 6 });
    thunderClap(c, 3, { dur: 9, amp: 1.6, lp: 320, crack: true, rolls: 4 });
    thunderClap(c, 17, { dur: 8, amp: 1.1, lp: 220, rolls: 3 });
    thunderClap(c, 29, { dur: 9, amp: 1.4, lp: 280, crack: true, rolls: 4 });
  } },
  thunderRolling: { L: 40, loud: 0.13, build: (c) => {
    rain(c, { bed: 1, lp: 4500, dropRate: 70, dropF: [1400, 4200], dropTau: [0.003, 0.008], dropGain: 0.32, swell: 0.2 });
    thunderClap(c, 2, { dur: 14, amp: 1.2, lp: 200, rolls: 6 });
    thunderClap(c, 21, { dur: 15, amp: 1.1, lp: 180, rolls: 6 });
  } },
  thunderNight: { L: 40, loud: 0.12, build: (c) => {
    rain(c, { bed: 0.7, lp: 3000, dropRate: 35, dropF: [1500, 3800], dropTau: [0.003, 0.008], dropGain: 0.25, swell: 0.2 });
    crickets(c, 3, 0.05, true);
    thunderClap(c, 6, { dur: 10, amp: 1.1, lp: 170, rolls: 4 });
    thunderClap(c, 27, { dur: 9, amp: 0.8, lp: 150, rolls: 3 });
  } },

  ocean: { L: 40, loud: 0.13, build: (c) => {
    const waves = Array.from({ length: 5 }, (_, k) => ({ t: k * 8 + c.rand(-1, 1), a: c.rand(0.6, 1), rise: c.rand(2.2, 3.2), fall: c.rand(2.5, 3.8) }));
    const env = (t: number) => {
      let v = 0;
      for (const w of waves) {
        const u = ((t - w.t) % c.L + c.L) % c.L;
        v += w.a * (u < w.rise ? Math.pow(u / w.rise, 2) : Math.exp(-(u - w.rise) / w.fall));
      }
      return Math.min(1.2, v);
    };
    const b = c.brown(); const p = c.pink();
    for (let i = 0; i < b.length; i++) b[i] = b[i] * 0.7 + p[i] * 0.5;
    lowpassVar(b, (t) => 250 + 2200 * env(t), c.L);
    for (let i = 0; i < b.length; i++) b[i] *= 0.2 + 0.9 * env((i / c.sr) % c.L);
    c.addBed(b, 2.2);
    const fizz = c.white(); highpass(fizz, 2500); lowpass(fizz, 7000);
    for (let i = 0; i < fizz.length; i++) { const e = env(((i / c.sr) - 1.4 + c.L) % c.L); fizz[i] *= e * e; }
    c.addBed(fizz, 0.12);
  } },
  stream: { L: 24, loud: 0.12, build: (c) => {
    const p = c.pink(); highpass(p, 350); lowpass(p, 4500, SYNTH_RATE, 2);
    const am = c.slowMod(30, 140, 8);
    for (let i = 0; i < p.length; i++) p[i] *= 0.6 + 0.6 * am((i / c.sr) % c.L);
    c.addBed(p, 1.1);
    for (let k = 0; k < 18 * c.L; k++) {
      const f = c.rand(350, 1200);
      c.addEvent(sweep(c, c.rand(0.02, 0.06), f, f * c.rand(1.3, 1.9), { h2: 0 }), c.rand(0, c.L), c.rand(0.02, 0.12));
    }
  } },
  river: { L: 30, loud: 0.13, build: (c) => {
    const b = c.brown(), p = c.pink();
    for (let i = 0; i < b.length; i++) b[i] = b[i] * 0.6 + p[i] * 0.45;
    lowpass(b, 1300, SYNTH_RATE, 2); highpass(b, 60);
    const am = c.slowMod(3, 25, 6);
    for (let i = 0; i < b.length; i++) b[i] *= 0.75 + 0.35 * am((i / c.sr) % c.L);
    c.addBed(b, 1.6);
    const s = c.white(); highpass(s, 2500); lowpass(s, 6000);
    c.addBed(s, 0.05);
    for (let k = 0; k < 7 * c.L; k++) {
      const f = c.rand(200, 600);
      c.addEvent(sweep(c, c.rand(0.04, 0.09), f, f * 1.5, { h2: 0 }), c.rand(0, c.L), c.rand(0.02, 0.07));
    }
  } },
  forest: { L: 32, loud: 0.1, build: (c) => {
    softWind(c, 0.6, 200, 900);
    const leaves = c.white(); highpass(leaves, 2500); lowpass(leaves, 7000);
    const g = c.slowMod(2, 8, 4);
    for (let i = 0; i < leaves.length; i++) { const v = g((i / c.sr) % c.L); leaves[i] *= v * v * v; }
    c.addBed(leaves, 0.12);
    birdsong(c, 0.3, 0.05);
  } },
  windTrees: { L: 32, loud: 0.12, build: (c) => {
    const g = c.slowMod(1, 6, 5);
    const w = c.pink();
    lowpassVar(w, (t) => 300 + 1600 * g(t), c.L);
    for (let i = 0; i < w.length; i++) w[i] *= 0.3 + 0.8 * g((i / c.sr) % c.L);
    c.addBed(w, 1.6);
    const r = c.white(); highpass(r, 1800); lowpass(r, 7500);
    for (let i = 0; i < r.length; i++) { const v = g((i / c.sr) % c.L); r[i] *= v * v; }
    c.addBed(r, 0.25);
  } },
  windGentle: { L: 32, loud: 0.11, build: (c) => softWind(c, 1, 150, 600) },
  birds: { L: 32, loud: 0.1, build: (c) => {
    softWind(c, 0.3, 150, 500);
    birdsong(c, 1.1, 0.07);
  } },
  crickets: { L: 24, loud: 0.09, build: (c) => {
    const b = c.brown(); lowpass(b, 300); c.addBed(b, 0.25);
    crickets(c, 6, 0.06);
  } },
  frogs: { L: 30, loud: 0.11, build: (c) => {
    const b = c.brown(); lowpass(b, 300); c.addBed(b, 0.3);
    crickets(c, 3, 0.025, true);
    for (let f = 0; f < 4; f++) {
      const f0 = c.rand(170, 340), rate = c.rand(16, 30), amp = c.rand(0.08, 0.18);
      const calls = 5 + Math.floor(c.r() * 6);
      for (let k = 0; k < calls; k++) {
        const dur = c.rand(0.25, 0.6), len = Math.round(dur * c.sr), ev = new Float32Array(len);
        const pulseSamples = c.sr / rate;
        for (let i = 0; i < len; i++) {
          const u = (i % pulseSamples) / c.sr;
          const pe = Math.exp(-u / 0.012);
          let s = 0;
          for (let h = 1; h <= 6; h++) s += Math.sin(TAU * f0 * h * i / c.sr) / h;
          ev[i] = s * pe * Math.sin(Math.PI * i / len);
        }
        c.addEvent(ev, c.rand(0, c.L), amp);
      }
    }
  } },
  campfire: { L: 24, loud: 0.11, build: (c) => {
    const roar = c.brown(); lowpass(roar, 350, SYNTH_RATE, 2);
    const g = c.slowMod(2, 10, 4);
    for (let i = 0; i < roar.length; i++) roar[i] *= 0.6 + 0.5 * g((i / c.sr) % c.L);
    c.addBed(roar, 1.2);
    const hiss = c.pink(); highpass(hiss, 1500); lowpass(hiss, 6000); c.addBed(hiss, 0.15);
    for (let k = 0; k < 14 * c.L; k++) {
      const len = Math.round(c.rand(0.0008, 0.004) * c.sr), ev = c.white(len);
      highpass(ev, 1500);
      const a = c.r();
      c.addEvent(ev, c.rand(0, c.L), 0.9 * a * a * a);
    }
    for (let k = 0; k < 0.6 * c.L; k++) {
      const len = Math.round(0.08 * c.sr), ev = c.white(len);
      for (let i = 0; i < len; i++) ev[i] *= Math.exp(-i / (0.006 * c.sr));
      bandpass(ev, c.rand(700, 2000), 5);
      c.addEvent(ev, c.rand(0, c.L), c.rand(0.6, 1.4));
    }
    crickets(c, 2, 0.015, true);
  } },

  ambientMusic: { L: 32, loud: 0.09, reverb: 0.45, build: (c) => {
    const chords = [
      [130.81, 196.0, 329.63, 493.88],
      [110.0, 164.81, 261.63, 493.88],
      [87.31, 130.81, 220.0, 329.63],
      [98.0, 146.83, 261.63, 329.63],
    ];
    chords.forEach((notes, i) => {
      const parts = notes.flatMap((f) => [
        { f, a: 0.22, detune: 0.6 },
        { f: f * 2, a: 0.04 },
      ]);
      c.addEvent(tone(c, 11, parts, 3, 3.5), i * 8 - 1.5, 1);
    });
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    for (let k = 0; k < 14; k++) {
      const f = scale[Math.floor(c.r() * scale.length)];
      c.addEvent(tone(c, 3, [{ f, a: 0.12, decay: 1.2 }, { f: f * 2, a: 0.03, decay: 0.5 }, { f: f * 3, a: 0.012, decay: 0.3 }], 0.005, 0.4), k * (c.L / 14) + c.rand(0, 0.6), 1);
    }
  } },
  calmingTones: { L: 36, loud: 0.09, reverb: 0.4, build: (c) => {
    const roots = [196, 220, 261.63, 293.66, 329.63, 146.83, 174.61, 246.94];
    for (let k = 0; k < 8; k++) {
      const f = roots[k];
      const ratios = [1, 2.76, 5.4, 8.93], amps = [1, 0.45, 0.2, 0.08], dec = [8, 4.5, 2.5, 1.5];
      c.addEvent(tone(c, 14, ratios.map((r, i) => ({ f: f * r, a: amps[i] * 0.2, decay: dec[i], detune: c.rand(0.4, 1.4) })), 0.02, 2), k * 4.5, 1);
    }
    c.addEvent(tone(c, c.L, [{ f: c.qf(98), a: 0.03 }, { f: c.qf(147), a: 0.015 }], 0, 0), 0, 1);
  } },
  nightAmbience: { L: 36, loud: 0.09, reverb: 0.25, build: (c) => {
    softWind(c, 0.35, 120, 420);
    crickets(c, 4, 0.03, true);
    const hoot = (t: number) => {
      c.addEvent(sweep(c, 0.45, 390, 360, { h2: 0.05 }), t, 0.12);
      c.addEvent(sweep(c, 0.22, 380, 365, { h2: 0.05 }), t + 0.9, 0.09);
      c.addEvent(sweep(c, 0.45, 385, 350, { h2: 0.05 }), t + 1.2, 0.1);
    };
    hoot(7); hoot(25);
  } },
  deepRelax: { L: 40, loud: 0.1, reverb: 0.3, build: (c) => {
    const swell = c.slowMod(1, 3, 2);
    const drones = [55, 82.5, 110, 164.8, 220].map((f, i) => ({ f: c.qf(f), b: c.qf(f) + (i + 1) * 0.05, a: [0.3, 0.18, 0.14, 0.07, 0.03][i] }));
    const len = c.n, ev = new Float32Array(len);
    for (const d of drones) {
      let p1 = 0, p2 = 0.25;
      for (let i = 0; i < len; i++) { p1 += d.f / c.sr; p2 += d.b / c.sr; ev[i] += d.a * 0.5 * (sinc(p1) + sinc(p2)); }
    }
    for (let i = 0; i < len; i++) ev[i] *= 0.55 + 0.45 * swell(i / c.sr);
    c.add(ev, 1);
    const b = c.brown(); lowpass(b, 400);
    for (let i = 0; i < b.length; i++) b[i] *= 0.3 + 0.7 * swell((i / c.sr) % c.L);
    c.addBed(b, 0.35);
  } },

  white: { L: 16, loud: 0.13, build: (c) => { const w = c.white(); lowpass(w, 10000); c.addBed(w); } },
  pink: { L: 16, loud: 0.14, build: (c) => { const p = c.pink(); highpass(p, 25); c.addBed(p); } },
  brown: { L: 16, loud: 0.16, build: (c) => { const b = c.brown(); highpass(b, 20); c.addBed(b); } },
  fan: { L: 16, loud: 0.14, build: (c) => {
    const b = c.brown(), p = c.pink();
    lowpass(p, 900, SYNTH_RATE, 2);
    const blade = c.qf(13.5);
    for (let i = 0; i < b.length; i++) b[i] = (b[i] * 0.6 + p[i] * 0.8) * (1 + 0.07 * Math.sin(TAU * blade * ((i / c.sr) % c.L)));
    highpass(b, 30);
    c.addBed(b, 1);
    c.addEvent(tone(c, c.L, [{ f: c.qf(100), a: 0.012 }, { f: c.qf(200), a: 0.005 }], 0, 0), 0, 1);
  } },
  aircon: { L: 16, loud: 0.13, build: (c) => {
    const p = c.pink(); lowpass(p, 1800, SYNTH_RATE, 2); highpass(p, 40); c.addBed(p, 1);
    const air = c.white(); highpass(air, 3500); lowpass(air, 8000); c.addBed(air, 0.06);
    const rum = c.brown(); lowpass(rum, 90); c.addBed(rum, 0.8);
    c.addEvent(tone(c, c.L, [{ f: c.qf(50), a: 0.03 }, { f: c.qf(100), a: 0.02 }, { f: c.qf(150), a: 0.008 }], 0, 0), 0, 1);
  } },
};

export const hasRecipe = (id: string) => id in RECIPES;

/** Render a recipe to a stereo seamless loop. */
export function renderRecipe(id: string): SynthResult {
  const recipe = RECIPES[id];
  if (!recipe) throw new Error(`Unknown sound recipe: ${id}`);
  let seed = 7;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const c = new Ctx(recipe.L, seed);
  recipe.build(c);
  let mono = c.out;
  if (recipe.reverb) mono = wrapReverb(mono, recipe.reverb);

  // remove DC, normalise loudness, soft-limit peaks
  let mean = 0;
  for (let i = 0; i < mono.length; i++) mean += mono[i];
  mean /= mono.length;
  let sq = 0;
  for (let i = 0; i < mono.length; i++) { mono[i] -= mean; sq += mono[i] * mono[i]; }
  const rms = Math.sqrt(sq / mono.length) || 1;
  const g = recipe.loud / rms;
  for (let i = 0; i < mono.length; i++) {
    const v = mono[i] * g;
    mono[i] = Math.abs(v) < 0.7 ? v : Math.sign(v) * (0.7 + 0.25 * Math.tanh((Math.abs(v) - 0.7) / 0.25));
  }

  // gentle stereo width (mono-compatible mid/side)
  const n = mono.length, d1 = Math.round(0.007 * c.sr), d2 = Math.round(0.016 * c.sr);
  const left = new Float32Array(n), right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const side = 0.3 * (mono[(i - d1 + n) % n] - mono[(i - d2 + n) % n]);
    left[i] = (mono[i] + side) * 0.9;
    right[i] = (mono[i] - side) * 0.9;
  }
  return { left, right, sampleRate: c.sr, seconds: recipe.L };
}
