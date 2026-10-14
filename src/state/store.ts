import { useSyncExternalStore } from 'react';

// ---------- types ----------

export type RepeatMode = 'loop' | 'once' | 'next';
export type TimerMode = 'stop' | 'fade';
export type Tab = 'home' | 'library' | 'mixer' | 'settings';
export type Sheet = 'player' | 'timer' | 'premium' | 'saveMix' | 'addLayer';
export type Page = 'privacy' | 'terms' | 'about' | 'background';

export interface Settings {
  defaultVolume: number;      // 0..1, used when the app starts
  defaultTimer: number;       // minutes, 0 = off
  timerMode: TimerMode;
  fadeMinutes: number;        // fade length for "fade" mode
  trackMinutes: number;       // track length when not looping
  breathing: boolean;         // breathing animation on the sleep screen
  animations: boolean;        // night-sky animation
}

export interface Layer { id: string; volume: number; muted: boolean }
export interface Mix { id: string; name: string; layers: Layer[]; createdAt: number }

export interface Persisted {
  favourites: string[];
  recent: string[];
  mixes: Mix[];
  settings: Settings;
  onboarded: boolean;
  playCounts: Record<string, number>;
  soundVolumes: Record<string, number>;
  masterVolume: number;
  repeatMode: RepeatMode;
}

export interface Toast { id: number; text: string; kind: 'info' | 'error' | 'success' }
export interface Confirm { title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }

export interface Runtime {
  status: 'idle' | 'loading' | 'playing' | 'paused';
  mode: 'single' | 'mix';
  currentId: string | null;
  layers: Layer[];
  activeMixId: string | null;
  preview: boolean;
  queue: string[];
  trackStart: number;
  trackLength: number | null;
  timer: { total: number; mode: TimerMode } | null;
  premium: boolean;
  tab: Tab;
  sheet: Sheet | null;
  premiumFocus: string | null;
  sleepScreen: boolean;
  page: Page | null;
  toast: Toast | null;
  confirm: Confirm | null;
  libraryFilter: string;
  search: string;
}

export type State = Persisted & Runtime;

export const DEFAULT_SETTINGS: Settings = {
  defaultVolume: 0.8,
  defaultTimer: 0,
  timerMode: 'fade',
  fadeMinutes: 5,
  trackMinutes: 10,
  breathing: true,
  animations: true,
};

const DEFAULT_PERSISTED: Persisted = {
  favourites: [],
  recent: [],
  mixes: [],
  settings: DEFAULT_SETTINGS,
  onboarded: false,
  playCounts: {},
  soundVolumes: {},
  masterVolume: DEFAULT_SETTINGS.defaultVolume,
  repeatMode: 'loop',
};

const DEFAULT_RUNTIME: Runtime = {
  status: 'idle', mode: 'single', currentId: null, layers: [], activeMixId: null, preview: false,
  queue: [], trackStart: 0, trackLength: null, timer: null, premium: false,
  tab: 'home', sheet: null, premiumFocus: null, sleepScreen: false, page: null,
  toast: null, confirm: null, libraryFilter: 'all', search: '',
};

// ---------- persistence ----------

const KEY = 'fusion-sleep:v1';
const PERSISTED_KEYS = Object.keys(DEFAULT_PERSISTED) as (keyof Persisted)[];

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const data = JSON.parse(raw) as Partial<Persisted>;
    return {
      ...DEFAULT_PERSISTED,
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function savePersisted(s: State) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const out: Partial<Persisted> = {};
    for (const k of PERSISTED_KEYS) (out as Record<string, unknown>)[k] = s[k];
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* storage full or blocked */ }
  }, 250);
}

export function clearPersisted() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

// ---------- tiny store ----------

const initial = loadPersisted();
let state: State = { ...initial, ...DEFAULT_RUNTIME };
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    const p = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...p };
    if (PERSISTED_KEYS.some((k) => k in p)) savePersisted(state);
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  reset() {
    state = { ...DEFAULT_PERSISTED, ...DEFAULT_RUNTIME, onboarded: true, premium: state.premium };
    savePersisted(state);
    listeners.forEach((l) => l());
  },
};

/** Subscribe a component to a slice of state. Select stable values (not new arrays). */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(state));
}

let toastId = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function toast(text: string, kind: Toast['kind'] = 'info', ms = 3200) {
  const t = { id: ++toastId, text, kind };
  store.set({ toast: t });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (store.get().toast?.id === t.id) store.set({ toast: null }); }, ms);
}

export function confirmAction(c: Confirm) { store.set({ confirm: c }); }
