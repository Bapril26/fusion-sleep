# Adding recorded audio files

Fusion Sleep works out of the box: every sound is generated on the phone by the
Fusion Sound Engine (`src/audio/synth.ts`). You can replace any of them with a
real recording at any time.

1. Put the file in this folder, e.g. `public/sounds/ocean-waves.mp3`
   (mp3, m4a/aac, ogg or wav all work on Android).
2. Open `src/data/sounds.ts` and add `src` to that sound:

   ```ts
   { id: 'ocean-waves', name: 'Ocean Waves', ..., recipe: 'ocean', src: 'sounds/ocean-waves.mp3' },
   ```

   `src` takes priority over `recipe`.
3. Rebuild: `npm run android:sync`.

Tips
- Use only audio you recorded yourself or have a licence that allows commercial use
  in an app (keep the licence document).
- For seamless looping, export files whose end flows into the start, and trim
  any silence at both ends. WAV or OGG loop more cleanly than MP3.
- If a file is missing or damaged, the app shows "…is unavailable" instead of
  pretending to play.
