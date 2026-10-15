# Fusion Sleep, by Fusion Labs

A sleep and relaxation app for Android:
- 31 seamless sleep sounds and a sound mixer
- 12 original adult bedtime stories, read aloud by the phone's own voice
- personalised AI stories through your own secure server
- a sleep timer with fade-out, favourites, and a Pro tier

Built with React + TypeScript + Vite, and packaged for Android with Capacitor 8 (target Android 16 / API 36).

- **Package ID:** `za.co.fusionlabs.sleep`
- **Version:** 1.1.0 (versionCode 10100)

## Get the test APK (no computer needed)

Every push to `main` builds a fresh test APK on GitHub:

- **Direct download:** https://github.com/Bapril26/fusion-sleep/releases/download/test-latest/Fusion-Sleep-test.apk
- or **Releases:** https://github.com/Bapril26/fusion-sleep/releases

Test builds include **Settings → Tester tools → Unlock Pro for testing** (no payment). Play Store builds don't.

Install: open the link on the phone, tap the downloaded file, and allow "Install unknown apps" for your browser if asked.
Version 1.1 is signed with a new fixed test key. **Uninstall version 1.0 first**; from now on each test APK installs over the last one.

## Project map

```
src/
  data/sounds.ts           sound catalogue (31 sounds)
  data/stories.ts          the 12 bedtime stories (full text); add stories here
  audio/synth.ts           Fusion Sound Engine: original generated sounds, seamless loops
  audio/engine.ts          Web Audio player, mixer, timer fade on the audio clock
  audio/narrator.ts        story narration: Android TTS plugin, or Web Speech in the browser
  state/store.ts           app state and local persistence (no account)
  state/player.ts          sounds, mixer, timer, favourites
  state/stories.ts         story playback, progress, background sound, timer fade
  state/generate.ts        personalised stories via the story server (streaming, limits, caching)
  billing/plans.ts         Free vs Pro limits, prices, tester unlock, billing hook-in point
  config/storyServer.ts    story server URL (set at build time; not a secret)
  screens/                 Home, Sleep Sounds (library + mixer), Stories, Favourites, Settings,
                           StoryPlayer, CreateStory, overlays
  components/              UI pieces, story covers (SVG artwork drawn in code), brand footer
android-src/
  java/PlaybackService.java       foreground media service, notification controls, audio focus, wake lock
  java/FusionPlaybackPlugin.java  bridge to that service
  java/FusionSpeechPlugin.java    narration with Android TextToSpeech (offline, free)
  signing/debug.keystore          shared TEST signing key (not used for the Play Store)
server/story-worker/       Cloudflare Worker that writes stories with Claude (holds the API key)
scripts/setup-android.mjs  adds the native parts to the generated android/ project
```

## Build on your own computer (optional)

Needs Node.js 22+, Android Studio Otter (2025.2.1) or newer, and JDK 21.

```bash
npm install
npm run android:add        # creates android/ and installs Fusion Sleep's native parts
npm run android:apk        # debug APK → android/app/build/outputs/apk/debug/app-debug.apk
```

For a test build with the Pro unlock switch, set `VITE_TEST_BUILD=true` before `npm run android:sync`.

## Personalised stories (optional)

These need the story server. See `server/story-worker/README.md`. Without it, "Create my own story" explains
that it isn't set up, and everything else works offline.

## Play Store

See `PLAY_STORE.md` for the signed bundle, store listing text, data-safety answers and Pro pricing.

## Test checklist (on a real phone)

- [ ] Installs and opens; the introduction can be skipped
- [ ] All five tabs work; the Android back button closes pages and sheets, then returns Home
- [ ] Sleep sounds play, pause and loop; mixer layers and volumes work; mixes save
- [ ] A story plays aloud; pause and resume continue from the same place; next and previous paragraph work
- [ ] Background sound plays under the story with its own volume
- [ ] Sleep timer (15 / 30 / 45 / 60 / 90 min) fades out and stops both story and sounds
- [ ] Lock the phone: the story and sounds keep playing; notification Play / Pause / Stop work
- [ ] A phone call or unplugging headphones pauses playback
- [ ] Closing and reopening the app keeps favourites, story positions, narrator choice and settings
- [ ] Settings → Tester tools → Unlock Pro makes Pro stories and sounds playable

---

Created by **Fusion Labs** · fusionlabs.co.za
