/**
 * Address of the Fusion Sleep story server (server/story-worker).
 * This is a public URL, not a secret. The AI key lives only on the server.
 *
 * Set it at build time:  VITE_STORY_API_URL=https://fusion-sleep-stories.<you>.workers.dev
 * (GitHub: Settings → Secrets and variables → Actions → Variables → STORY_API_URL)
 * Leave it empty and the app keeps working, with personalised stories switched off.
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const STORY_API_URL = (env.VITE_STORY_API_URL ?? '').trim().replace(/\/+$/, '');
/** Optional non-secret app key that must match the server's APP_KEY, if one is set there. */
export const STORY_APP_KEY = (env.VITE_STORY_APP_KEY ?? '').trim();

export const storyServerConfigured = () => STORY_API_URL.length > 0;

/** Generated stories kept on the phone. */
export const MAX_SAVED_STORIES = 30;
