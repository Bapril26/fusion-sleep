/**
 * Fusion Sleep — story server (Cloudflare Worker).
 *
 * The app never holds an AI key. It sends the listener's choices here; this
 * Worker adds the secret key (stored as a Cloudflare secret), asks Claude to
 * write the story, and streams the text back.
 *
 * Endpoints
 *   GET  /health        → { ok, configured }
 *   POST /v1/stories    → NDJSON stream: {"t":"text"} … {"done":true} | {"error":"…","code":"…"}
 *
 * Environment (Cloudflare dashboard → Worker → Settings → Variables)
 *   ANTHROPIC_API_KEY    secret, required
 *   MODEL                optional, default "claude-haiku-5-5"
 *   DAILY_LIMIT_DEVICE   optional, default 5   stories per phone per day
 *   DAILY_LIMIT_IP       optional, default 20  stories per network per day
 *   DAILY_LIMIT_TOTAL    optional, default 300 stories per day for everyone (cost cap)
 *   APP_KEY              optional; if set, the app must send the same value (blocks casual misuse)
 *   USAGE                optional KV namespace binding for reliable daily counts
 */

const CATEGORIES = {
  romantic: 'a gentle romantic story for adults: tender, warm and emotionally comforting, never explicit',
  peaceful: 'a peaceful sleep story: slow, descriptive and calming, with almost no conflict',
  dream: 'a dream-escape story: an imaginary, beautiful place and a calm night-time journey',
  mystery: 'a gentle mystery: atmospheric and slow, never frightening, with a kind and reassuring solution',
};
const MOODS = ['calm', 'cosy', 'hopeful', 'tender', 'dreamy', 'nostalgic', 'serene', 'warm', 'curious', 'magical'];
const MINUTES = { 5: 650, 10: 1300, 20: 2600, 30: 3800 };

const SYSTEM = `You write original bedtime stories for adults, to be read aloud slowly by a calm narrator as the listener falls asleep.

Rules:
- Adults only as main characters. This is not a children's story.
- Gentle language, natural pacing, rich soothing sensory detail (sounds, textures, warmth, soft light).
- Clear structure: a settling beginning, a coherent unhurried middle, and a peaceful, comforting conclusion that ends with rest or sleep.
- No violence, danger, horror, cruelty, illness, death scenes, sudden shocks, cliffhangers or abrupt endings.
- Romance stays tender and non-explicit: no sexual content.
- Never mention real brands, real people or other apps. Never write about yourself or AI.
- If the listener's request asks for anything unsuitable, quietly write a gentle story that keeps only the safe parts of the idea.
- Plain prose paragraphs only. No headings, lists, markdown, or sound-effect notes.

Output format exactly:
TITLE: <a short, evocative title>

<paragraph>

<paragraph>
…`;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function cors(env, req) {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
  const origin = req.headers.get('origin') || '';
  const allow = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-device-id, x-app-key',
    'access-control-max-age': '86400',
  };
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max);

// ---------- daily limits ----------

const memory = new Map(); // fallback when no KV is bound (per-instance, best effort)
async function bump(env, key, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const k = `${day}:${key}`;
  let n;
  if (env.USAGE) {
    n = Number((await env.USAGE.get(k)) || 0);
    if (n >= limit) return false;
    await env.USAGE.put(k, String(n + 1), { expirationTtl: 60 * 60 * 30 });
  } else {
    n = memory.get(k) || 0;
    if (n >= limit) return false;
    memory.set(k, n + 1);
  }
  return true;
}

// ---------- request handling ----------

export function buildPrompt(input) {
  const category = CATEGORIES[input.category] ? input.category : 'peaceful';
  const minutes = MINUTES[input.minutes] ? Number(input.minutes) : 10;
  const words = MINUTES[minutes];
  const mood = MOODS.includes(String(input.mood).toLowerCase()) ? String(input.mood).toLowerCase() : 'calm';
  const setting = clean(input.setting, 80) || 'a quiet place by the sea';
  const idea = clean(input.description, 500);
  const user = [
    `Write ${CATEGORIES[category]}.`,
    `Setting: ${setting}.`,
    `Mood: ${mood}.`,
    idea ? `The listener's idea (use it if suitable): """${idea}"""` : '',
    `Length: about ${words} words (roughly ${minutes} minutes read aloud slowly).`,
  ].filter(Boolean).join('\n');
  return { category, minutes, words, user, maxTokens: Math.round(words * 1.6) + 200 };
}

async function handleStory(req, env, ctx, headers) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'Personalised stories are not set up on the server yet.', code: 'not_configured' }, 503, headers);
  if (env.APP_KEY && req.headers.get('x-app-key') !== env.APP_KEY) return json({ error: 'This app is not allowed to use the story server.', code: 'forbidden' }, 403, headers);

  let input;
  try { input = await req.json(); } catch { return json({ error: 'The request could not be read.', code: 'bad_request' }, 400, headers); }
  const device = clean(req.headers.get('x-device-id'), 64) || 'unknown';
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';

  const lim = (name, d) => Number(env[name] || d);
  if (!(await bump(env, `dev:${device}`, lim('DAILY_LIMIT_DEVICE', 5)))) return json({ error: 'You have reached today\'s limit of personalised stories. Please try again tomorrow.', code: 'limit_device' }, 429, headers);
  if (!(await bump(env, 'total', lim('DAILY_LIMIT_TOTAL', 300)))) return json({ error: 'Today\'s story writing limit has been reached. Please try again tomorrow.', code: 'limit_total' }, 429, headers);
  if (!(await bump(env, `ip:${ip}`, lim('DAILY_LIMIT_IP', 20)))) return json({ error: 'Too many stories from this network today. Please try again tomorrow.', code: 'limit_ip' }, 429, headers);

  const p = buildPrompt(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150000);

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-haiku-5-5',
        max_tokens: p.maxTokens,
        temperature: 0.9,
        stream: true,
        system: SYSTEM,
        messages: [{ role: 'user', content: p.user }],
      }),
    });
  } catch {
    clearTimeout(timeout);
    return json({ error: 'The story service could not be reached. Please try again.', code: 'upstream_unreachable' }, 502, headers);
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeout);
    const busy = upstream.status === 429 || upstream.status === 529;
    return json({ error: busy ? 'The story service is busy. Please try again in a minute.' : 'The story service had a problem. Please try again later.', code: `upstream_${upstream.status}` }, busy ? 503 : 502, headers);
  }

  // Convert the model's server-sent events into simple NDJSON lines for the app.
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (obj) => writer.write(enc.encode(JSON.stringify(obj) + '\n'));

  ctx.waitUntil((async () => {
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let finished = false;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          let evt;
          try { evt = JSON.parse(line.slice(5)); } catch { continue; }
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') await send({ t: evt.delta.text });
          else if (evt.type === 'message_delta' && evt.delta?.stop_reason === 'max_tokens') await send({ note: 'length' });
          else if (evt.type === 'message_stop') { finished = true; await send({ done: true }); }
          else if (evt.type === 'error') { finished = true; await send({ error: 'The story service stopped unexpectedly. Please try again.', code: 'upstream_error' }); }
        }
      }
      if (!finished) await send({ error: 'The story was interrupted. Please try again.', code: 'interrupted' });
    } catch {
      try { await send({ error: 'The story took too long to write. Please try a shorter story.', code: 'timeout' }); } catch { /* client gone */ }
    } finally {
      clearTimeout(timeout);
      try { await writer.close(); } catch { /* closed */ }
    }
  })());

  return new Response(readable, { headers: { ...headers, 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } });
}

export default {
  async fetch(req, env, ctx) {
    const headers = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ ok: true, configured: !!env.ANTHROPIC_API_KEY }, 200, headers);
    if (url.pathname === '/v1/stories' && req.method === 'POST') return handleStory(req, env, ctx, headers);
    return json({ error: 'Not found' }, 404, headers);
  },
};
