# Fusion Sleep story server

A tiny Cloudflare Worker that writes personalised bedtime stories with Claude.
The app never holds your AI key: the key is stored only as a Cloudflare secret.

## What it costs

- **Cloudflare Workers:** free plan covers 100,000 requests a day.
- **Claude Haiku 5.5:** about US$0.10 per million input tokens and US$0.50 per million output tokens.
  A 10-minute story is about 1,700 output tokens (≈ US$0.001); a 30-minute story about 5,000 (≈ US$0.003).
  Even 300 stories a day (the default daily cap) is under US$1 a day.
- Set a monthly spend limit in the Claude Console as an extra safety net.

## Set it up (about 15 minutes, once)

1. **Get an API key:** sign up at https://console.anthropic.com, add billing, and create an API key.
   Under *Limits*, set a monthly spend limit (for example US$10).
2. **Create a free Cloudflare account:** https://dash.cloudflare.com/sign-up
3. On your computer (Node.js 22 installed), in this folder:

   ```bash
   cd server/story-worker
   npx wrangler login                              # opens the browser once
   npx wrangler kv namespace create USAGE          # copy the id it prints into wrangler.toml (remove the # signs)
   npx wrangler secret put ANTHROPIC_API_KEY       # paste your key when asked; it is never stored in files
   npx wrangler deploy
   ```

   It prints your server address, e.g. `https://fusion-sleep-stories.yourname.workers.dev`.
4. Check it: open `https://…workers.dev/health` in a browser. It should show `{"ok":true,"configured":true}`.
5. **Connect the app:** GitHub → *Bapril26/fusion-sleep* → *Settings* → *Secrets and variables* → *Actions* →
   *Variables* tab → *New repository variable*:
   - Name `STORY_API_URL`, value your server address (no slash at the end).
6. Run the *Build Android* workflow again (Actions tab → Build Android → Run workflow). The new APK has
   “Create my own story” switched on.

### Optional: block other apps from using your server

Choose any random word, then:
- `npx wrangler secret put APP_KEY` (enter the word), and
- add a GitHub repository variable `STORY_APP_KEY` with the same word.

This isn't a true secret (it ships inside the app), but it stops casual misuse.

## Limits (change in `wrangler.toml`)

| Setting | Default | Meaning |
|---|---|---|
| `DAILY_LIMIT_DEVICE` | 5 | stories per phone per day |
| `DAILY_LIMIT_IP` | 20 | stories per network per day |
| `DAILY_LIMIT_TOTAL` | 300 | stories per day for all users (cost cap) |
| `MODEL` | `claude-haiku-5-5` | Claude model used |

The app also limits free users to 1 story a day (10 minutes max) and Pro users to 5 a day (30 minutes max).

## What the server does

- `GET /health` reports whether the key is configured.
- `POST /v1/stories` checks the daily limits, asks Claude for a gentle, adults-only, non-explicit story,
  and streams the text back as it is written. Timeouts, busy errors and interruptions return friendly messages.
- Story requests are not stored by this server.
