import { useState, type ReactNode } from 'react';
import { soundById, SOUNDS } from '../data/sounds';
import { STORIES, KIDS_STORIES } from '../data/stories';
import { getStory } from '../state/stories';
import { BrandFooter } from '../components/BrandFooter';
import { store, useStore } from '../state/store';
import { togglePlay } from '../state/player';
import { isNative } from '../native/platform';
import { Icon, Logo } from '../components/Icon';
import { NightSky } from '../components/NightSky';
import { fmtTime, timerRemaining, useTick } from '../components/ui';
import { APP_VERSION } from '../version';

// ---------- Sleep screen ----------

export function SleepScreen() {
  const st = useStore((s) => s);
  useTick(1000, true);
  if (!st.sleepScreen) return null;
  const storyOn = !!st.story && st.story.status !== 'reading';
  const name = storyOn
    ? getStory(st.story!.id)?.title
    : st.mode === 'mix'
      ? (st.mixes.find((m) => m.id === st.activeMixId)?.name ?? 'Your mix')
      : st.currentId ? soundById(st.currentId)?.name : null;
  const playing = storyOn ? st.story!.status === 'playing' || st.story!.status === 'loading' : st.status === 'playing';
  const idle = !storyOn && st.status === 'idle';
  const rem = st.timer ? timerRemaining() : null;
  const now = new Date();
  return (
    <div className="sleep" role="dialog" aria-label="Sleep screen">
      <div className="clock">{now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}</div>
      <div className="now">{idle ? 'Nothing playing' : name}</div>
      <button className={`orb ${st.settings.breathing && playing ? 'breathing' : ''}`} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        <Icon name={playing ? 'pause' : 'play'} size={40} fill stroke={0} />
      </button>
      <div className="remain">
        <Icon name="timer" size={16} />
        {rem !== null ? `${fmtTime(rem)} remaining` : 'No sleep timer'}
      </div>
      {rem === null && !idle && (
        <button className="remain" style={{ marginTop: 10, opacity: .8 }} onClick={() => store.set({ sleepScreen: false, sheet: 'timer' })}>Set a timer</button>
      )}
      <button className="exit" onClick={() => store.set(storyOn ? { sleepScreen: false, page: 'storyPlayer', viewStoryId: st.story!.id } : { sleepScreen: false, sheet: st.status !== 'idle' ? 'player' : null })}>Back to player</button>
    </div>
  );
}

// ---------- Onboarding ----------

const STEPS = [
  { icon: 'rain', eyebrow: 'Welcome', title: 'Drift off to rain, waves and nature', body: `${SOUNDS.length} calming sounds — rainfall, thunderstorms, ocean waves, forests, crickets, soft music and white noise. Every sound loops seamlessly.` },
  { icon: 'book', eyebrow: 'Bedtime stories', title: 'Gentle stories, read to you', body: `${STORIES.length} original stories for grown-ups and ${KIDS_STORIES.length} for little ones, read aloud with rain or waves in the background. Kids Mode keeps children to their own stories.` },
  { icon: 'mixer', eyebrow: 'Sound mixer', title: 'Blend sounds into your own mix', body: 'Layer rain with distant thunder, wind or birds. Set each volume, then save your favourite combinations.' },
  { icon: 'timer', eyebrow: 'Sleep timer', title: 'Fall asleep, we’ll handle the rest', body: 'Choose 15 minutes to 2 hours. The sound fades out gently and stops on its own — even with the screen off.' },
  { icon: 'heart', eyebrow: 'Favourites', title: 'Your sounds, one tap away', body: 'Heart the sounds you love. Recently played and favourites are saved on your phone — no account needed.' },
];

export function Onboarding() {
  const onboarded = useStore((s) => s.onboarded);
  const [i, setI] = useState(0);
  if (onboarded) return null;
  const step = STEPS[i];
  const finish = () => { store.set({ onboarded: true, tab: 'home' }); setI(0); };
  return (
    <div className="onb" role="dialog" aria-label="Introduction">
      <div className="hero-sky" style={{ inset: 0, WebkitMaskImage: 'none', maskImage: 'none' }}><NightSky density={0.0004} /></div>
      <div className="onb-inner">
        <div className="topbar">
          <div className="brand"><Logo size={34} /><div className="brand-name">Fusion <span>Sleep</span></div></div>
          <button className="muted small" onClick={finish} style={{ padding: 10 }}>Skip</button>
        </div>
        <div className="onb-visual">
          <div className="onb-orb" key={step.icon}><Icon name={step.icon} size={80} stroke={1.2} /></div>
        </div>
        <div className="onb-step" key={i}>
          <div className="eyebrow">{step.eyebrow}</div>
          <h1 className="display" style={{ marginTop: 8, fontSize: 30 }}>{step.title}</h1>
          <p className="muted" style={{ marginTop: 12 }}>{step.body}</p>
        </div>
        <div className="dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <button className="btn block" onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : finish())}>
          {i < STEPS.length - 1 ? 'Continue' : 'Start listening'}
        </button>
      </div>
    </div>
  );
}

// ---------- Info pages ----------

function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="page" role="dialog" aria-label={title}>
      <div className="page-inner">
        <button className="icon-btn" onClick={() => store.set({ page: null })} aria-label="Back"><Icon name="chevronLeft" /></button>
        <h1>{title}</h1>
        {children}
        <BrandFooter />
      </div>
    </div>
  );
}

export function InfoPage() {
  const page = useStore((s) => s.page);
  if (!page || page === 'storyPlayer' || page === 'createStory') return null;
  if (page === 'privacy') return (
    <PageShell title="Privacy policy">
      <p className="dim small">Last updated: October 2026</p>
      <h2>The short version</h2>
      <p>Fusion Sleep does not collect, sell or share your personal information. There is no account, no sign-in and no advertising tracking.</p>
      <h2>What is stored</h2>
      <p>Your favourites, saved mixes, recently played sounds and settings are stored only on your device so the app can remember them. They never leave your phone. You can delete them at any time in Settings → Reset all preferences, or by uninstalling the app.</p>
      <h2>Children</h2>
      <p>Fusion Sleep is designed for adults. The Kids section is for parents and carers to play stories to their children. The app does not knowingly collect any information from children, and “Create my own story” is not available in Kids Mode.</p>
      <h2>Personalised stories</h2>
      <p>If you use “Create my own story”, your story choices and the idea you type are sent over an encrypted connection to the Fusion Sleep story server and its AI provider (Anthropic) only to write your story. A random app ID (not linked to your name) is used to apply the daily limit. Finished stories are saved on your phone.</p>
      <h2>Narration</h2>
      <p>Stories are read aloud by your phone's own text-to-speech engine. If you pick a voice marked “online”, your phone's voice provider may process the story text to produce speech.</p>
      <h2>Permissions</h2>
      <ul>
        <li><b>Notifications</b> (Android 13+) — to show the playback controls notification while sounds play in the background.</li>
        <li><b>Foreground service & wake lock</b> — so audio and the sleep timer keep working when the screen is off.</li>
      </ul>
      <p>The app does not use your microphone, camera, contacts or location.</p>
      <h2>Future subscriptions</h2>
      <p>If Pro subscriptions are introduced, payments will be handled by Google Play under Google's privacy policy. Fusion Labs will not receive your card details.</p>
      <h2>Contact</h2>
      <p>Fusion Labs · fusionlabs.co.za</p>
    </PageShell>
  );
  if (page === 'terms') return (
    <PageShell title="Terms and conditions">
      <p className="dim small">Last updated: October 2026</p>
      <h2>Using Fusion Sleep</h2>
      <p>Fusion Sleep is provided for relaxation and general wellbeing. It is not a medical device and does not diagnose or treat sleep disorders. If you have ongoing sleep problems, please speak to a healthcare professional.</p>
      <h2>Listening safely</h2>
      <p>Keep the volume at a comfortable, low level, especially with headphones and when listening for long periods.</p>
      <h2>Sounds and stories</h2>
      <p>The sounds and the library stories in Fusion Sleep are original works © Fusion Labs. You may use them for personal listening within the app.</p>
      <h2>Kids stories and Kids Mode</h2>
      <p>Fusion Sleep is intended for adults. The Kids section contains gentle stories for parents and carers to play to children. Kids Mode hides grown-up content; a grown-up should supervise children's use of the phone.</p>
      <h2>Personalised stories</h2>
      <p>Personalised stories are written by an AI service from the choices you make. They are intended for adults, are kept gentle and non-explicit, and may occasionally contain mistakes. Do not enter personal or sensitive information in your story idea.</p>
      <h2>Fusion Sleep Pro</h2>
      <p>Pro features are not yet available for purchase. If they are introduced, pricing, billing and cancellation will be shown clearly before you subscribe, and handled through Google Play.</p>
      <h2>Changes</h2>
      <p>These terms may be updated with new versions of the app. Continued use means you accept the updated terms.</p>
    </PageShell>
  );
  if (page === 'background') return (
    <PageShell title="Background playback">
      <p>Fusion Sleep is designed to keep playing when you lock your phone, turn off the screen or switch to another app.</p>
      <h2>How it works</h2>
      <ul>
        <li>While a sound plays, the app shows a “Fusion Sleep is playing” notification with Play, Pause and Stop buttons. This keeps Android from closing the app.</li>
        <li>The sleep timer runs on the audio clock, so it still fades out and stops with the screen off.</li>
        <li>Stopping playback removes the notification and releases the phone's resources.</li>
      </ul>
      <h2>If sound stops when the screen turns off</h2>
      <ul>
        <li>Allow notifications for Fusion Sleep when asked (Android 13 and newer).</li>
        <li>Some phones (Samsung, Huawei, Xiaomi, Oppo) restrict background apps. Open Settings → Apps → Fusion Sleep → Battery and choose “Unrestricted”.</li>
      </ul>
      <p className="dim small" style={{ marginTop: 16 }}>{isNative ? 'Running as the installed Android app.' : 'You are using the web preview. Background playback with lock-screen controls needs the installed Android app.'}</p>
    </PageShell>
  );
  return (
    <PageShell title="About Fusion Sleep">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0 18px' }}>
        <Logo size={64} />
        <div><div style={{ fontWeight: 600, fontSize: 20 }}>Fusion Sleep</div><div className="muted small">Version {APP_VERSION}</div></div>
      </div>
      <p>Fusion Sleep helps you relax, reduce distractions and fall asleep faster with seamless ambient sounds, a sound mixer and a gentle sleep timer.</p>
      <h2>Original sounds</h2>
      <p>Every sound is created by the Fusion Sound Engine, which generates rain, thunder, water, wind, wildlife, music and noise directly on your device. Nothing is downloaded and no internet connection is needed.</p>
      <h2>Made in South Africa</h2>
      <p>Fusion Sleep is designed and built by Fusion Labs, a South African digital solutions studio.</p>
      <p className="footer-brand" style={{ marginTop: 30 }}>Powered by <b>Fusion Labs</b> · fusionlabs.co.za</p>
    </PageShell>
  );
}
