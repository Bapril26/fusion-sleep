/**
 * Bridge to native Android features.
 *  - FusionPlayback: a small native plugin (android-src/) that runs a
 *    foreground "media playback" service so audio keeps playing with the
 *    screen off, and shows a notification with Play/Pause/Stop buttons.
 *  - App: Android hardware back button.
 * On the web these calls are harmless no-ops (Media Session API is used instead).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

interface PlaybackInfo { title: string; subtitle: string; playing: boolean }
interface FusionPlaybackPlugin {
  start(info: PlaybackInfo): Promise<void>;
  update(info: PlaybackInfo): Promise<void>;
  stop(): Promise<void>;
  addListener(event: 'action', cb: (e: { action: 'play' | 'pause' | 'stop' }) => void): Promise<{ remove: () => Promise<void> }>;
}

const FusionPlayback = registerPlugin<FusionPlaybackPlugin>('FusionPlayback');

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

let serviceRunning = false;

export async function showPlayback(info: PlaybackInfo) {
  updateMediaSession(info);
  if (!isNative) return;
  try {
    if (!serviceRunning) { await FusionPlayback.start(info); serviceRunning = true; }
    else await FusionPlayback.update(info);
  } catch (e) {
    console.warn('Native playback service unavailable', e);
  }
}

export async function hidePlayback() {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
  if (!isNative || !serviceRunning) return;
  serviceRunning = false;
  try { await FusionPlayback.stop(); } catch { /* noop */ }
}

type Action = 'play' | 'pause' | 'stop' | 'next' | 'previous';
let actionHandler: ((a: Action) => void) | null = null;

export function onMediaAction(cb: (a: Action) => void) {
  actionHandler = cb;
  if (isNative) {
    FusionPlayback.addListener('action', (e) => actionHandler?.(e.action)).catch(() => undefined);
  }
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    const set = (a: MediaSessionAction, h: Action) => { try { ms.setActionHandler(a, () => actionHandler?.(h)); } catch { /* unsupported */ } };
    set('play', 'play'); set('pause', 'pause'); set('stop', 'stop');
    set('nexttrack', 'next'); set('previoustrack', 'previous');
  }
}

function updateMediaSession(info: PlaybackInfo) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: info.title, artist: info.subtitle, album: 'Fusion Sleep' });
    navigator.mediaSession.playbackState = info.playing ? 'playing' : 'paused';
  } catch { /* noop */ }
}

/** Android back button. Handler returns true if it handled the press. */
export function onBackButton(handler: () => boolean) {
  if (!isNative) return;
  App.addListener('backButton', () => {
    if (!handler()) App.minimizeApp().catch(() => App.exitApp());
  }).catch(() => undefined);
}
