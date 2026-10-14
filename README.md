# Fusion Sleep — by Fusion Labs

A sleep and relaxation app for Android: 31 seamless ambient sounds, a sound mixer,
a sleep timer with fade-out, favourites, a low-light sleep screen and background
playback. Built with React + TypeScript + Vite, packaged for Android with Capacitor 6.

- **Package id:** `za.co.fusionlabs.sleep`
- **App name:** Fusion Sleep · **Version:** 1.0.0

---

## 1. What you need on your computer (one time)

| Tool | Where to get it |
|---|---|
| Node.js 20 or newer | https://nodejs.org (LTS) |
| Android Studio (Koala or newer) | https://developer.android.com/studio — during setup install the Android SDK (API 34) |
| JDK 17 | Bundled with Android Studio — nothing extra to install |

On Windows, use PowerShell or the Android Studio terminal. Wherever you see `./gradlew`, Windows uses `gradlew.bat`.

## 2. Build the APK

```bash
cd fusion-sleep
npm install                 # downloads React, Vite, Capacitor
npm run android:add         # creates android/ and adds the Fusion Sleep native parts
npm run android:sync        # builds the web app and copies it into android/
```

Then either:

**A. Android Studio (easiest)**
```bash
npm run android:open
```
Wait for Gradle sync to finish, then **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
The file appears at `android/app/build/outputs/apk/debug/app-debug.apk`.

**B. Command line**
```bash
npm run android:apk
```
(Same output path. On Windows: `npm run android:sync`, then `cd android` and `gradlew.bat assembleDebug`.)

## 3. Install on your phone

- **USB:** enable *Developer options → USB debugging* on the phone, plug it in, and press ▶ Run in Android Studio. Or run `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
- **Without a cable:** copy `app-debug.apk` to the phone (WhatsApp to yourself, Google Drive, USB), tap it, and allow *Install unknown apps* for that app when asked.

## 4. Release build for Google Play

1. In Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle**, create a keystore (keep it and its passwords safe forever — you need it for every update).
2. Upload the `.aab` to Google Play Console. Play requires a privacy policy URL (the in-app policy text is in `src/screens/Overlays.tsx`; publish it on fusionlabs.co.za).
3. Declare the **foreground service type "Media playback"** in Play Console → App content, explaining it keeps sleep sounds playing with the screen off.

## 5. Test checklist on a real phone

- [ ] Installs and opens; introduction can be skipped
- [ ] Every tab opens; Android back button closes sheets and returns to Home
- [ ] Sounds play and pause; next/previous work
- [ ] Mixer: 3 layers play together, each volume and mute works, master volume works
- [ ] Save, reopen and delete a mix; favourites survive closing the app
- [ ] Sleep timer: set 15 min, cancel it; set a custom timer and let it fade out and stop
- [ ] Lock the phone — sound keeps playing; notification Pause/Play/Stop work
- [ ] Timer still stops playback with the screen off
- [ ] Stop removes the notification

If audio stops with the screen off on Samsung/Xiaomi/Huawei/Oppo: Settings → Apps → Fusion Sleep → Battery → Unrestricted.

## 6. Project map

```
src/
  data/sounds.ts         sound catalogue — add sounds/categories here
  audio/synth.ts         Fusion Sound Engine (original generated audio, seamless loops)
  audio/engine.ts        Web Audio player, mixer, timer fade on the audio clock
  state/store.ts         app state + local persistence (no account, no server)
  state/player.ts        play / mix / timer / favourites actions
  billing/plans.ts       free vs premium limits; subscription hook-in point
  native/platform.ts     bridge to the Android playback service
  screens/, components/  user interface
android-src/             native Java service + icons, installed by scripts/setup-android.mjs
public/sounds/           drop recorded audio here (see README inside)
```

## 7. Premium subscriptions (later)

The free version is complete and nothing can be charged. `src/billing/plans.ts`
explains how to connect Google Play Billing when you're ready; the rest of the app
already reads premium status from there.

---

Powered by **Fusion Labs** · fusionlabs.co.za
