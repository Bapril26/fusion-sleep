import { useEffect, useState, type ReactNode } from 'react';
import { soundById, categoryById, SOUNDS, CATEGORIES } from '../data/sounds';
import { store, useStore, type RepeatMode, type TimerMode } from '../state/store';
import {
  togglePlay, stop, next, previous, setRepeatMode, setMasterVolume, toggleFavourite, addLayer,
  setTimer, cancelTimer, saveMix, playSound, isLocked, formatMinutes, limits,
} from '../state/player';
import { FREE_LIMITS, PREMIUM_LIMITS, BILLING_CONFIGURED, PLAN_NAME, PRO_PRICES } from '../billing/plans';
import { STORIES } from '../data/stories';
import { getStory, setNarratorPrefs } from '../state/stories';
import { newGateQuestion, disableKidsMode } from '../state/kids';
import { narrator, type NarratorVoice } from '../audio/narrator';
import { StoryCover } from './StoryCover';
import { engine } from '../audio/engine';
import { Icon } from './Icon';
import { Art, Slider, fmtTime, useTick, timerRemaining } from './ui';

function Sheet({ children, label }: { children: ReactNode; label: string }) {
  const close = () => store.set({ sheet: null });
  return (
    <>
      <div className="backdrop" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="grab" />
        {children}
      </div>
    </>
  );
}

export function Sheets() {
  const sheet = useStore((s) => s.sheet);
  const kidsMode = useStore((s) => s.kidsMode);
  if (sheet === 'player') return <PlayerSheet />;
  if (sheet === 'timer') return <TimerSheet />;
  if (sheet === 'premium') return kidsMode ? <AskGrownUpSheet /> : <PremiumSheet />;
  if (sheet === 'saveMix') return <SaveMixSheet />;
  if (sheet === 'addLayer') return <AddLayerSheet />;
  if (sheet === 'voice') return <VoiceSheet />;
  if (sheet === 'parentGate') return <ParentGateSheet />;
  return null;
}

// ---------- player ----------

const REPEAT_NEXT: Record<RepeatMode, RepeatMode> = { loop: 'once', once: 'next', next: 'loop' };
const REPEAT_ICON: Record<RepeatMode, string> = { loop: 'repeat', once: 'once', next: 'forward' };
const REPEAT_LABEL: Record<RepeatMode, string> = { loop: 'Loop', once: 'Once', next: 'Then next' };

function PlayerSheet() {
  const st = useStore((s) => s);
  useTick(1000, st.status === 'playing');
  const firstId = st.mode === 'single' ? st.currentId : st.layers[0]?.id;
  const sound = firstId ? soundById(firstId) : null;

  useEffect(() => { if (st.status === 'idle') store.set({ sheet: null }); }, [st.status]);
  if (!sound) return null;

  const isMix = st.mode === 'mix';
  const title = isMix ? (st.mixes.find((m) => m.id === st.activeMixId)?.name ?? 'Custom mix') : sound.name;
  const subtitle = isMix ? st.layers.map((l) => soundById(l.id)?.name).join(' · ') : categoryById(sound.category).name;
  const elapsed = Math.max(0, engine.now() - st.trackStart);
  const rem = st.timer ? timerRemaining() : null;
  const fav = !isMix && st.favourites.includes(sound.id);

  return (
    <Sheet label="Now playing">
      <div className="sheet-head">
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close player"><Icon name="chevronDown" /></button>
        <span className="eyebrow">{st.preview ? 'Pro preview' : isMix ? 'Your mix' : 'Now playing'}</span>
        <button className="icon-btn" onClick={() => store.set({ sheet: null, sleepScreen: true })} aria-label="Open sleep screen"><Icon name="moon" /></button>
      </div>

      <Art sound={sound} className={`player-art ${st.settings.breathing && st.status === 'playing' ? 'breathing' : ''}`} glyphSize={44} />

      <div className="player-title">
        <div style={{ minWidth: 0 }}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {!isMix && (
          <button className={`round ${fav ? 'on' : ''}`} style={{ width: 46, height: 46 }} onClick={() => toggleFavourite(sound.id)} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
            <Icon name="heart" size={20} fill={fav} />
          </button>
        )}
      </div>

      <div className="prog">
        <div className={`bar ${st.trackLength ? '' : 'loop'}`}>
          <i style={st.trackLength ? { width: `${Math.min(100, (elapsed / st.trackLength) * 100)}%` } : undefined} />
        </div>
        <div className="times">
          <span>{st.status === 'loading' ? 'Preparing…' : fmtTime(elapsed)}</span>
          <span>{st.trackLength ? fmtTime(st.trackLength) : '∞  Seamless loop'}</span>
        </div>
      </div>

      <div className="controls">
        {!isMix ? (
          <button className={`side sm ${st.repeatMode !== 'loop' ? 'on' : ''}`} onClick={() => setRepeatMode(REPEAT_NEXT[st.repeatMode])} aria-label={`Repeat mode: ${REPEAT_LABEL[st.repeatMode]}`} disabled={st.preview}>
            <div style={{ display: 'grid', placeItems: 'center', gap: 2 }}>
              <Icon name={REPEAT_ICON[st.repeatMode]} size={20} />
              <span style={{ fontSize: 10 }}>{REPEAT_LABEL[st.repeatMode]}</span>
            </div>
          </button>
        ) : <span className="side" />}
        {!isMix ? <button className="side" onClick={previous} aria-label="Previous sound"><Icon name="prev" size={26} fill stroke={1.2} /></button> : <span className="side" />}
        <button className="main" onClick={togglePlay} aria-label={st.status === 'playing' ? 'Pause' : 'Play'}>
          {st.status === 'loading' ? <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /> : <Icon name={st.status === 'playing' ? 'pause' : 'play'} size={32} fill stroke={0} />}
        </button>
        {!isMix ? <button className="side" onClick={() => next()} aria-label="Next sound"><Icon name="next" size={26} fill stroke={1.2} /></button> : <span className="side" />}
        <button className="side sm" onClick={stop} aria-label="Stop">
          <div style={{ display: 'grid', placeItems: 'center', gap: 2 }}><Icon name="stop" size={20} /><span style={{ fontSize: 10 }}>Stop</span></div>
        </button>
      </div>

      <div className="vol-row" style={{ marginTop: 8 }}>
        <Icon name="volumeOff" size={18} />
        <Slider value={st.masterVolume} onChange={setMasterVolume} label="Volume" />
        <Icon name="volume" size={18} />
      </div>

      <div className="player-tools">
        <button className={`tool ${st.timer ? 'on' : ''}`} onClick={() => store.set({ sheet: 'timer' })}>
          <Icon name="timer" />{rem !== null ? fmtTime(rem) : 'Sleep timer'}
        </button>
        {isMix ? (
          <button className="tool" onClick={() => store.set({ sheet: null, tab: 'sounds', soundsView: 'mixer' })}><Icon name="sliders" />Edit mix</button>
        ) : (
          <button className="tool" onClick={() => { if (!st.preview) store.set({ sheet: 'addLayer', tab: 'sounds', soundsView: 'mixer' }); }} disabled={st.preview}>
            <Icon name="plus" />Mix sounds
          </button>
        )}
        <button className="tool" onClick={() => store.set({ sheet: null, sleepScreen: true })}><Icon name="moon" />Sleep screen</button>
      </div>

      {st.preview && (
        <div className="note"><Icon name="crown" size={18} /><span>You're hearing a 30-second preview of a Pro sound. The full sound is part of Fusion Sleep Pro.</span></div>
      )}
    </Sheet>
  );
}

// ---------- sleep timer ----------

const PRESETS = [15, 30, 45, 60, 90, 120];

function TimerSheet() {
  const timer = useStore((s) => s.timer);
  const status = useStore((s) => s.status);
  const settings = useStore((s) => s.settings);
  const storyOn = useStore((s) => !!s.story && s.story.status !== 'reading');
  const [mode, setMode] = useState<TimerMode>(timer?.mode ?? settings.timerMode);
  const [custom, setCustom] = useState(20);
  useTick(1000, !!timer);
  const rem = timer ? timerRemaining() ?? 0 : null;
  const frac = timer && rem !== null ? rem / timer.total : 0;
  const R = 96, C = 2 * Math.PI * R;

  const start = (m: number) => { setTimer(m, mode); store.set({ sheet: null }); };

  return (
    <Sheet label="Sleep timer">
      <div className="sheet-head">
        <h3>Sleep timer</h3>
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close"><Icon name="x" /></button>
      </div>

      {timer && rem !== null && (
        <>
          <div className="timer-ring">
            <svg width="210" height="210" viewBox="0 0 210 210">
              <circle cx="105" cy="105" r={R} stroke="rgba(255,255,255,.08)" strokeWidth="8" fill="none" />
              <circle cx="105" cy="105" r={R} stroke="url(#tg)" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
              <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stopColor="#1677FF" /><stop offset="1" stopColor="#54A6FF" /></linearGradient></defs>
            </svg>
            <div className="val">
              <b>{fmtTime(rem)}</b>
              <span className="muted small">{status === 'paused' && !storyOn ? 'Paused with playback' : timer.mode === 'fade' ? 'then fades out' : 'then stops'}</span>
            </div>
          </div>
          <button className="btn ghost block" onClick={cancelTimer}><Icon name="x" size={18} />Cancel timer</button>
          <div className="label">Or start a new timer</div>
        </>
      )}

      {!timer && <p className="muted small" style={{ marginBottom: 14 }}>Choose how long to play. {storyOn ? 'The timer controls the story and any background sound.' : status === 'idle' ? 'Your last sound will start playing.' : 'The timer controls the sound that is playing now.'}</p>}

      <div className="segment" role="radiogroup" aria-label="When the timer ends">
        <button className={mode === 'fade' ? 'on' : ''} onClick={() => setMode('fade')} role="radio" aria-checked={mode === 'fade'}><Icon name="volume" size={16} />Fade out gently</button>
        <button className={mode === 'stop' ? 'on' : ''} onClick={() => setMode('stop')} role="radio" aria-checked={mode === 'stop'}><Icon name="stop" size={16} />Stop</button>
      </div>
      <p className="dim tiny" style={{ margin: '8px 4px 14px' }}>
        {mode === 'fade' ? `Volume lowers slowly over the last ${settings.fadeMinutes} minutes (change this in Settings).` : 'Playback stops when the time is up.'}
      </p>

      <div className="grid-3">
        {PRESETS.map((m) => (
          <button key={m} className={`preset ${timer?.total === m * 60 ? 'on' : ''}`} onClick={() => start(m)}>
            <b>{m < 60 ? m : m / 60}</b><span>{m < 60 ? 'minutes' : m === 60 ? 'hour' : 'hours'}</span>
          </button>
        ))}
      </div>

      <div className="label">Custom</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="stepper" style={{ flex: 1, justifyContent: 'space-between', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 16, padding: 6 }}>
          <button className="round" onClick={() => setCustom((c) => Math.max(5, c - 5))} aria-label="Less time"><Icon name="minus" size={18} /></button>
          <span className="num" style={{ fontSize: 18 }}>{formatMinutes(custom)}</span>
          <button className="round" onClick={() => setCustom((c) => Math.min(480, c + 5))} aria-label="More time"><Icon name="plus" size={18} /></button>
        </div>
        <button className="btn" onClick={() => start(custom)}>Start</button>
      </div>
    </Sheet>
  );
}

// ---------- Pro ----------

function PremiumSheet() {
  const focus = useStore((s) => s.premiumFocus);
  const premium = useStore((s) => s.premium);
  const sound = focus ? soundById(focus) : null;
  const story = focus && !sound ? getStory(focus) : null;
  const proSounds = SOUNDS.filter((s) => s.premium).length;
  const proStories = STORIES.filter((s) => s.premium).length;
  return (
    <Sheet label={PLAN_NAME}>
      <div className="premium-hero">
        <div className="crown"><Icon name="crown" size={28} /></div>
        <div className="eyebrow" style={{ color: '#cfe3ff' }}>{PLAN_NAME}</div>
        <h3 style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>{premium ? 'Pro is unlocked' : 'Every sound, every story, unlimited mixes'}</h3>
        <p className="muted small" style={{ marginTop: 6 }}>{premium ? 'All Pro features are switched on for this phone.' : 'The free version stays fully usable. Pro adds more for deeper, more personal sleep.'}</p>
      </div>

      {sound && !premium && (
        <div className="row" style={{ background: 'var(--card)', border: '1px solid var(--line)', marginBottom: 14 }}>
          <Art sound={sound} glyphSize={22} />
          <div className="info"><div className="name">{sound.name}</div><div className="desc">Pro sound · listen to a free preview</div></div>
          <button className="btn" style={{ height: 44, padding: '0 14px' }} onClick={() => { store.set({ sheet: null }); playSound(sound.id, { preview: true }); }}>
            <Icon name="play" size={16} fill stroke={0} />30s
          </button>
        </div>
      )}
      {story && !premium && (
        <div className="row" style={{ background: 'var(--card)', border: '1px solid var(--line)', marginBottom: 14 }}>
          <span style={{ width: 58, height: 58, borderRadius: 16, overflow: 'hidden', flex: 'none' }}><StoryCover motif={story.motif} seed={story.id} /></span>
          <div className="info"><div className="name">{story.title}</div><div className="desc">Pro story · read the opening for free</div></div>
          <button className="btn ghost" style={{ height: 44, padding: '0 14px' }} onClick={() => store.set({ sheet: null, page: 'storyPlayer', viewStoryId: story.id })}>Read</button>
        </div>
      )}

      {[
        `All ${SOUNDS.length} sleep sounds, including ${proSounds} Pro soundscapes`,
        `All ${STORIES.length} bedtime stories, including ${proStories} Pro stories`,
        `Personalised AI stories: ${PREMIUM_LIMITS.storiesPerDay} a day, up to 30 minutes long (free: ${FREE_LIMITS.storiesPerDay} a day, up to 10 minutes)`,
        `Mix up to ${PREMIUM_LIMITS.mixLayers} sounds at once and save unlimited mixes`,
        'New stories and soundscapes as they are added',
      ].map((b) => (
        <div className="benefit" key={b}><span className="ck"><Icon name="check" size={15} stroke={2.4} /></span><span>{b}</span></div>
      ))}

      <table className="compare">
        <thead><tr><th>Feature</th><th>Free</th><th>Pro</th></tr></thead>
        <tbody>
          <tr><td>Sleep sounds</td><td>{SOUNDS.length - proSounds}</td><td>{SOUNDS.length}</td></tr>
          <tr><td>Bedtime stories</td><td>{STORIES.length - proStories}</td><td>{STORIES.length}</td></tr>
          <tr><td>Personalised stories a day</td><td>{FREE_LIMITS.storiesPerDay}</td><td>{PREMIUM_LIMITS.storiesPerDay}</td></tr>
          <tr><td>Longest personalised story</td><td>10 min</td><td>30 min</td></tr>
          <tr><td>Sounds per mix</td><td>{FREE_LIMITS.mixLayers}</td><td>{PREMIUM_LIMITS.mixLayers}</td></tr>
          <tr><td>Saved mixes</td><td>{FREE_LIMITS.savedMixes}</td><td>Unlimited</td></tr>
          <tr><td>Sleep timer, fade-out, narration</td><td>✓</td><td>✓</td></tr>
        </tbody>
      </table>

      {!premium && (
        <>
          <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 18 }}>
            <div className="preset"><b style={{ fontSize: 19 }}>{PRO_PRICES.monthly}</b><span>per month</span></div>
            <div className="preset on"><b style={{ fontSize: 19 }}>{PRO_PRICES.yearly}</b><span>per year · save 44%</span></div>
          </div>
          <p className="dim tiny" style={{ textAlign: 'center', marginTop: 8 }}>{PRO_PRICES.trialDays}-day free trial · cancel any time in Google Play</p>
          <button className="btn block" style={{ marginTop: 14 }} disabled={!BILLING_CONFIGURED}>
            {BILLING_CONFIGURED ? `Start ${PRO_PRICES.trialDays}-day free trial` : 'Pro is coming soon'}
          </button>
          <div className="note">
            <Icon name="info" size={18} />
            <span>Subscriptions aren't available yet, so nothing can be bought and you won't be charged. When Pro launches it will be offered through Google Play.</span>
          </div>
        </>
      )}
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => store.set({ sheet: null })}>{premium ? 'Close' : 'Continue with free version'}</button>
    </Sheet>
  );
}

// ---------- kids ----------

function AskGrownUpSheet() {
  return (
    <Sheet label="Ask a grown-up">
      <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: 'rgba(22,119,255,.15)', color: 'var(--blue-2)' }}><Icon name="lock" size={28} /></div>
        <h3 style={{ fontSize: 20, fontWeight: 600 }}>Ask a grown-up</h3>
        <p className="muted" style={{ margin: '8px 0 18px' }}>This one isn't available in Kids Mode. Try another story or sound!</p>
        <button className="btn block" onClick={() => store.set({ sheet: null })}>OK</button>
      </div>
    </Sheet>
  );
}

function ParentGateSheet() {
  const [q] = useState(newGateQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const submit = () => {
    if (Number(value.trim()) === q.answer) disableKidsMode();
    else { setWrong(true); setValue(''); }
  };
  return (
    <Sheet label="Grown-up check">
      <div className="sheet-head">
        <h3>Grown-ups only</h3>
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close"><Icon name="x" /></button>
      </div>
      <p className="muted">To turn off Kids Mode, please answer:</p>
      <div style={{ fontSize: 34, fontWeight: 600, textAlign: 'center', margin: '18px 0' }}>What is {q.text}?</div>
      <input id="gate-answer" className="text-input" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={value} placeholder="Type the answer"
        onChange={(e) => { setValue(e.target.value.replace(/\D/g, '')); setWrong(false); }} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} aria-label="Answer" />
      {wrong && <p role="alert" style={{ color: 'var(--danger)', marginTop: 8, fontSize: 14 }}>That's not right. Please ask a grown-up.</p>}
      <button className="btn block" style={{ marginTop: 14 }} onClick={submit} disabled={!value}>Turn off Kids Mode</button>
    </Sheet>
  );
}

// ---------- narrator voice ----------

function VoiceSheet() {
  const prefs = useStore((s) => s.narrator);
  const [voices, setVoices] = useState<NarratorVoice[] | null>(null);
  useEffect(() => { narrator.voices().then((r) => setVoices(r.voices)).catch(() => setVoices([])); }, []);
  const speeds: [number, string][] = [[0.75, 'Very slow'], [0.85, 'Slow'], [0.9, 'Relaxed'], [1, 'Normal']];
  return (
    <Sheet label="Narrator">
      <div className="sheet-head">
        <h3>Narrator</h3>
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close"><Icon name="x" /></button>
      </div>
      <div className="label" style={{ marginTop: 0 }}>Reading speed</div>
      <div className="wrap-chips">
        {speeds.map(([r, l]) => <button key={r} className={`chip ${Math.abs(prefs.rate - r) < 0.01 ? 'on' : ''}`} onClick={() => setNarratorPrefs({ rate: r })}>{l}</button>)}
      </div>
      <div className="label">Voice</div>
      {voices === null ? (
        <div className="gen-status"><div className="spinner" />Finding voices on this phone…</div>
      ) : voices.length === 0 ? (
        <div className="notice warn"><Icon name="info" size={18} /><span>No English voices were found. On Android, open Settings → Accessibility → Text-to-speech, choose “Speech Services by Google”, and install an English voice.</span></div>
      ) : (
        <div className="voice-list">
          <button className={`voice-item ${!prefs.voiceId ? 'on' : ''}`} onClick={() => setNarratorPrefs({ voiceId: null })}>
            <Icon name="mic" size={18} /><span className="tx"><b>Phone default</b><span>The voice chosen in Android settings</span></span>{!prefs.voiceId && <Icon name="check" size={18} />}
          </button>
          {voices.map((v) => (
            <button key={v.id} className={`voice-item ${prefs.voiceId === v.id ? 'on' : ''}`} onClick={() => setNarratorPrefs({ voiceId: v.id })}>
              <Icon name="mic" size={18} />
              <span className="tx"><b>{v.label}</b><span>{v.network ? 'Needs internet · may sound more natural' : 'Works offline'}</span></span>
              {prefs.voiceId === v.id && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      )}
      <p className="dim tiny" style={{ marginTop: 12 }}>Narration uses the text-to-speech voices installed on your phone. It's free and doesn't use your data unless you pick an online voice.</p>
    </Sheet>
  );
}

// ---------- mixer helpers ----------

function SaveMixSheet() {
  const layers = useStore((s) => s.layers);
  const mixes = useStore((s) => s.mixes);
  const premium = useStore((s) => s.premium);
  const suggestion = layers.map((l) => soundById(l.id)?.name.split(' ')[0]).filter(Boolean).slice(0, 3).join(' + ');
  const [name, setName] = useState(suggestion || 'My mix');
  const full = mixes.length >= limits().savedMixes;
  return (
    <Sheet label="Save mix">
      <div className="sheet-head">
        <h3>Save this mix</h3>
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close"><Icon name="x" /></button>
      </div>
      <label className="label" htmlFor="mixname" style={{ marginTop: 0, display: 'block' }}>Mix name</label>
      <input id="mixname" className="text-input" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && saveMix(name)) store.set({ sheet: null }); }} />
      <p className="dim tiny" style={{ margin: '10px 4px 18px' }}>
        {layers.length} sound{layers.length > 1 ? 's' : ''} with their volumes will be saved.
        {!premium && ` Free version: ${mixes.length} of ${FREE_LIMITS.savedMixes} mixes used.`}
      </p>
      {full && !premium ? (
        <button className="btn block" onClick={() => store.set({ sheet: 'premium', premiumFocus: null })}><Icon name="crown" size={18} />See Premium</button>
      ) : (
        <button className="btn block" onClick={() => { if (saveMix(name)) store.set({ sheet: null }); }}><Icon name="save" size={18} />Save mix</button>
      )}
    </Sheet>
  );
}

function AddLayerSheet() {
  const layers = useStore((s) => s.layers);
  const mode = useStore((s) => s.mode);
  const [cat, setCat] = useState<string>('all');
  const inMix = new Set(mode === 'mix' ? layers.map((l) => l.id) : []);
  const list = SOUNDS.filter((s) => (cat === 'all' || s.category === cat) && !inMix.has(s.id));
  return (
    <Sheet label="Add a sound to your mix">
      <div className="sheet-head">
        <h3>Add a sound</h3>
        <button className="icon-btn" onClick={() => store.set({ sheet: null })} aria-label="Close"><Icon name="x" /></button>
      </div>
      <div className="chips" style={{ padding: '0 0 10px' }}>
        <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>All</button>
        {CATEGORIES.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.short}</button>)}
      </div>
      <div style={{ margin: '0 -10px' }}>
        {list.map((s) => (
          <div key={s.id} className="row" style={{ cursor: 'pointer' }} onClick={() => { addLayer(s.id); store.set({ sheet: null }); }}>
            <Art sound={s} glyphSize={22} />
            <div className="info">
              <div className="name">{s.name}</div>
              <div className="desc">{isLocked(s) ? 'Pro · ' : ''}{s.description}</div>
            </div>
            <span className="round primary" style={{ width: 34, height: 34 }}><Icon name={isLocked(s) ? 'lock' : 'plus'} size={16} /></span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

