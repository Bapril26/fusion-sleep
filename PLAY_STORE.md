# Publishing Fusion Sleep on Google Play

## 1. Before you start
- A Google Play developer account (once-off US$25): https://play.google.com/console/signup
- New personal accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to production. Start this early.
- Publish the privacy policy on your website, for example `https://fusionlabs.co.za/fusion-sleep/privacy`.
  The text is in the app under Settings → Privacy policy (`src/screens/Overlays.tsx`).

## 2. Build the signed bundle (.aab)
1. Add the three secrets from `UPLOAD-KEY-DETAILS.txt` to GitHub (Settings → Secrets and variables → Actions).
2. Actions → *Build Android* → *Run workflow*.
3. Download **fusion-sleep-play-store-aab** from the run's Artifacts. Inside is `fusion-sleep-release.aab`.

The store build never shows "Unlock Pro for testing".

## 3. Create the app in Play Console
| Field | Value |
|---|---|
| App name | Fusion Sleep: Sounds & Stories |
| Package | `za.co.fusionlabs.sleep` |
| Default language | English (United Kingdom) or English (South Africa) |
| App or game | App · Free (with in-app subscription later) |
| Category | Health & Fitness |
| Target SDK | 36 (Android 16), already set by Capacitor 8 |

**Short description (80 chars):**
Sleep sounds, a sound mixer and gentle bedtime stories for grown-ups.

**Full description:**
Fusion Sleep helps you switch off and fall asleep. Choose from 31 calming sounds (rain, thunderstorms, ocean waves, forests, crickets, soft music and white noise) or mix your own. Listen to gentle bedtime stories for adults, read aloud by a calm voice with rain or waves in the background. Set a sleep timer that fades everything out softly, then simply drift off.

- 31 seamless sleep sounds and a sound mixer
- 12 original bedtime stories for grown-ups: romantic, peaceful, dreamy and gentle mysteries
- 8 gentle bedtime stories for little ones, with a Kids Mode for parents
- Read along, or listen with the screen off
- Sleep timer with gentle fade-out
- Favourites and saved mixes, no account needed
- Fusion Sleep Pro: every sound and story, personalised stories and unlimited mixes

Created by Fusion Labs, South Africa.

## 4. App content forms (Play Console → Policy → App content)
- **Privacy policy:** your URL from step 1.
- **Ads:** No ads.
- **App access:** All features available without login.
- **Content rating:** answer the questionnaire. No violence or sexual content; stories are adult-oriented but non-explicit. Expect a general audience or "Teen" rating.
- **Target audience:** 18 and over. The app is for adults; the Kids section is for parents and carers to play to children (like other sleep apps), so don't select child age groups or join the Families programme. Kids Mode hides grown-up content.
- **Data safety:**
  - Data collected: *App activity → Other user-generated content* (only if personalised stories are switched on: the story idea the user types, sent to write the story, not stored by Fusion Labs). Shared with a service provider (Anthropic) for app functionality. Encrypted in transit. Users can't request deletion because nothing is stored.
  - Device ID: a random app ID used only for daily limits. Declare under *Device or other IDs* if you switch on personalised stories.
  - Everything else (favourites, history, settings) stays on the device and doesn't count as "collected".
- **Foreground service permissions:** declare **Media playback**: "Plays sleep sounds and narrated bedtime stories while the screen is off, with media controls in the notification." Upload a short screen recording showing the notification while audio plays.
- **Health apps declaration:** if asked, the app is a relaxation/sleep aid and doesn't provide medical features.

## 5. Store graphics
- App icon 512×512: `assets/icon-512.png`
- Feature graphic 1024×500, and 2 to 8 phone screenshots (take them on your phone from the test APK).

## 6. Fusion Sleep Pro (when you're ready to charge)
Recommended launch prices for South Africa:

| Plan | Price | Notes |
|---|---|---|
| Monthly | **R59.99** | Matches local streaming-app price points |
| Yearly | **R399.99** | About 44% cheaper than monthly; push this one |
| Free trial | **7 days** | On the yearly plan |

Google takes 15% of subscription revenue. Play Console converts prices for other countries automatically; consider rounding to US$4.99 / US$29.99.

Steps: Play Console → Monetise → Subscriptions → create `fusion_sleep_pro` with base plans `monthly` and `yearly` and a trial offer. Then connect a billing library in `src/billing/plans.ts` (the file explains what to change). Until then, the app shows "Pro is coming soon" and can't charge anyone.

## 7. Release
Testing → Closed testing → create a release → upload the `.aab` → add testers' emails → roll out.
After 14 days with 12+ testers, apply for production access.
