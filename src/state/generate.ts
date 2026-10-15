/**
 * Personalised story generation through the secure story server.
 * No API key is ever stored in the app.
 */
import { STORY_API_URL, STORY_APP_KEY, storyServerConfigured, MAX_SAVED_STORIES } from '../config/storyServer';
import { FREE_LIMITS, PREMIUM_LIMITS } from '../billing/plans';
import type { Story, StoryCategoryId } from '../data/stories';
import { store } from './store';

export interface StoryRequest {
  category: StoryCategoryId;
  setting: string;
  mood: string;
  minutes: 5 | 10 | 20 | 30;
  description: string;
  voiceId: string | null;
}

export class GenerationError extends Error {
  constructor(message: string, public code: string) { super(message); }
}

const today = () => new Date().toISOString().slice(0, 10);

export const dailyStoryLimit = () => (store.get().premium ? PREMIUM_LIMITS : FREE_LIMITS).storiesPerDay;
export const allowedMinutes = () => (store.get().premium ? PREMIUM_LIMITS : FREE_LIMITS).storyMinutes;

export function generationsLeft() {
  const u = store.get().genUsage;
  return dailyStoryLimit() - (u.day === today() ? u.count : 0);
}

function countGeneration() {
  store.set((st) => ({ genUsage: { day: today(), count: (st.genUsage.day === today() ? st.genUsage.count : 0) + 1 } }));
}

export const requestKey = (r: StoryRequest) =>
  [r.category, r.setting.trim().toLowerCase(), r.mood, r.minutes, r.description.trim().toLowerCase()].join('|');

/** A story already written for exactly the same request, so we don't pay for it twice. */
export function findExisting(r: StoryRequest): Story | undefined {
  const key = requestKey(r);
  return store.get().myStories.find((s) => s.requestKey === key);
}

/** Parse "TITLE: …" plus paragraphs from the model output. */
export function parseStory(raw: string): { title: string; text: string } {
  const m = raw.match(/^\s*TITLE:\s*(.+)\s*$/m);
  const title = (m?.[1] ?? 'Your Bedtime Story').replace(/[*#"]/g, '').trim().slice(0, 80);
  const body = (m ? raw.slice(raw.indexOf(m[0]) + m[0].length) : raw)
    .replace(/[*#_]+/g, '')
    .split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
    .join('\n\n');
  return { title, text: body };
}

const MOTIFS: Partial<Record<StoryCategoryId, Story['motif'][]>> = {
  romantic: ['sea', 'books', 'lighthouse'],
  peaceful: ['cabin', 'train', 'village', 'shore'],
  dream: ['island', 'balloon', 'garden'],
  mystery: ['hotel', 'lamp'],
};

let inFlight: AbortController | null = null;
export const isGenerating = () => !!inFlight;
export function cancelGeneration() { inFlight?.abort(); inFlight = null; }

/**
 * Ask the server to write a story. Streams text into `onText` as it arrives.
 * Throws GenerationError with a friendly message on any failure.
 */
export async function generateStory(r: StoryRequest, onText: (soFar: string) => void): Promise<Story> {
  if (!storyServerConfigured()) throw new GenerationError('Personalised stories are not switched on in this version of the app yet.', 'not_configured');
  if (inFlight) throw new GenerationError('A story is already being written.', 'busy');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new GenerationError("You're offline. Connect to the internet to create a new story. Your saved stories still work offline.", 'offline');
  if (generationsLeft() <= 0) throw new GenerationError(`You've created ${dailyStoryLimit()} ${dailyStoryLimit() === 1 ? 'story' : 'stories'} today. You can create more tomorrow${store.get().premium ? '' : ', or get more with Fusion Sleep Pro'}.`, 'limit_device');
  if (!allowedMinutes().includes(r.minutes)) throw new GenerationError('Stories longer than 10 minutes are part of Fusion Sleep Pro.', 'pro_length');

  const controller = new AbortController();
  inFlight = controller;
  let idle: ReturnType<typeof setTimeout> | null = null;
  const resetIdle = () => { if (idle) clearTimeout(idle); idle = setTimeout(() => controller.abort('timeout'), 45000); };
  resetIdle();

  let raw = '';
  try {
    let res: Response;
    try {
      res = await fetch(`${STORY_API_URL}/v1/stories`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', 'x-device-id': store.get().deviceId, ...(STORY_APP_KEY ? { 'x-app-key': STORY_APP_KEY } : {}) },
        body: JSON.stringify({ category: r.category, setting: r.setting, mood: r.mood, minutes: r.minutes, description: r.description }),
      });
    } catch {
      if (controller.signal.aborted) throw new GenerationError(controller.signal.reason === 'timeout' ? 'The story server took too long to answer. Please try again.' : 'Story writing was cancelled.', controller.signal.reason === 'timeout' ? 'timeout' : 'cancelled');
      throw new GenerationError("Couldn't reach the story server. Check your internet connection and try again.", 'network');
    }

    if (!res.ok) {
      let msg = 'The story server had a problem. Please try again later.', code = `http_${res.status}`;
      try { const j = await res.json(); if (j.error) { msg = j.error; code = j.code ?? code; } } catch { /* not json */ }
      throw new GenerationError(msg, code);
    }

    countGeneration();
    const reader = res.body?.getReader();
    if (!reader) throw new GenerationError('The story could not be received.', 'no_body');
    const dec = new TextDecoder();
    let buf = '';
    let done = false;
    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try { chunk = await reader.read(); } catch {
        throw new GenerationError(controller.signal.reason === 'timeout' ? 'The connection went quiet for too long. Please try again.' : controller.signal.aborted ? 'Story writing was cancelled.' : 'The connection dropped while the story was being written. Please try again.', 'interrupted');
      }
      if (chunk.done) break;
      resetIdle();
      buf += dec.decode(chunk.value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg: { t?: string; done?: boolean; error?: string; code?: string };
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.t) { raw += msg.t; onText(raw); }
        if (msg.error) throw new GenerationError(msg.error, msg.code ?? 'stream_error');
        if (msg.done) done = true;
      }
    }
    if (!done) throw new GenerationError('The story was interrupted before it finished. Please try again.', 'interrupted');

    const { title, text } = parseStory(raw);
    if (text.split(/\s+/).length < 120) throw new GenerationError('The story came back too short. Please try again.', 'too_short');
    const pool = MOTIFS[r.category] ?? ['custom'];
    const story: Story = {
      id: `my-${Date.now().toString(36)}`,
      title,
      category: r.category,
      description: r.description.trim() ? r.description.trim().slice(0, 140) : `A ${r.mood.toLowerCase()} story set in ${r.setting.toLowerCase()}.`,
      setting: r.setting,
      mood: r.mood,
      motif: pool[Math.floor(Math.random() * pool.length)],
      text,
      generated: true,
      createdAt: Date.now(),
      voiceId: r.voiceId,
      requestKey: requestKey(r),
    };
    store.set((st) => ({ myStories: [story, ...st.myStories].slice(0, MAX_SAVED_STORIES) }));
    return story;
  } finally {
    if (idle) clearTimeout(idle);
    if (inFlight === controller) inFlight = null;
  }
}
