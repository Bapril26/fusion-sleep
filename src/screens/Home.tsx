import { useMemo } from 'react';
import { CATEGORIES, SOUNDS, POPULAR_TONIGHT, soundById, categoryById } from '../data/sounds';
import { store, useStore } from '../state/store';
import { togglePlay, recommendations, playMix, isLocked } from '../state/player';
import { NightSky } from '../components/NightSky';
import { Icon, Logo } from '../components/Icon';
import { SoundCard, SectionHead, Art } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still awake?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function Home() {
  const recent = useStore((s) => s.recent);
  const favourites = useStore((s) => s.favourites);
  const mixes = useStore((s) => s.mixes);
  const status = useStore((s) => s.status);
  const currentId = useStore((s) => s.currentId);
  const mode = useStore((s) => s.mode);
  const animations = useStore((s) => s.settings.animations);
  const premium = useStore((s) => s.premium);
  const recs = useMemo(() => recommendations(8), [recent, favourites, premium]);

  const resumeId = recent.find((id) => { const s = soundById(id); return s && !isLocked(s); }) ?? 'rain-gentle';
  const resume = soundById(resumeId)!;
  const playingName = mode === 'mix' ? 'your mix' : currentId ? soundById(currentId)?.name : '';

  const openCategory = (id: string) => store.set({ tab: 'library', libraryFilter: id, search: '' });

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      <div className="hero" style={{ paddingTop: 'calc(var(--safe-t) + 18px)' }}>
        <div className="hero-sky"><NightSky animate={animations} /></div>
        <div className="moon" aria-hidden="true" style={{ top: 'calc(var(--safe-t) + 70px)' }} />
        <div className="topbar">
          <div className="brand"><Logo size={38} /><div className="brand-name">Fusion <span>Sleep</span></div></div>
          <button className="icon-btn" onClick={() => store.set({ sheet: 'premium', premiumFocus: null })} aria-label="Premium">
            <Icon name="crown" size={20} />
          </button>
        </div>

        <div className="eyebrow" style={{ marginTop: 30 }}>{greeting()}</div>
        <h1 className="display">Welcome to Fusion&nbsp;Sleep</h1>
        <p className="sub">Relax your mind. Rest your body. Sleep peacefully.</p>

        <button className="big-play" onClick={() => (status === 'idle' ? togglePlay() : store.set({ sheet: 'player' }))}>
          <span className="disc">
            {status === 'loading' ? <div className="spinner" /> : <Icon name={status === 'playing' ? 'pause' : 'play'} size={26} fill stroke={0} />}
          </span>
          <span>
            <span className="label" style={{ display: 'block' }}>
              {status === 'idle' ? (recent.length ? 'Continue listening' : 'Start sleeping') : status === 'paused' ? 'Paused' : 'Now playing'}
            </span>
            <span className="meta">{status === 'idle' ? `${resume.name} · tap to play` : `${playingName} · open player`}</span>
          </span>
        </button>

        <div className="quick-row">
          <button className="quick" onClick={() => store.set({ sheet: 'timer' })}><Icon name="timer" size={18} />Sleep timer</button>
          <button className="quick" onClick={() => store.set({ tab: 'mixer' })}><Icon name="mixer" size={18} />Mix sounds</button>
          <button className="quick" onClick={() => store.set({ sleepScreen: true })} disabled={status === 'idle'} style={status === 'idle' ? { opacity: .5 } : undefined}><Icon name="moon" size={18} />Sleep mode</button>
        </div>
      </div>

      <section className="section" style={{ marginTop: 6 }}>
        <SectionHead title="Your Sleep Sounds" action="See all" onAction={() => openCategory('all')} />
        <div className="rail">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="cat-tile" onClick={() => openCategory(c.id)}
              style={{ background: `radial-gradient(100% 120% at 100% 0%, hsla(${c.hue},95%,60%,.45), transparent 60%), linear-gradient(150deg, hsl(${c.hue},60%,15%), #05070c)` }}>
              <Icon name={c.icon} size={24} />
              <div>
                <div className="name">{c.short === 'White noise' ? 'White Noise' : c.short}</div>
                <div className="count">{SOUNDS.filter((s) => s.category === c.id).length} sounds</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Popular for Tonight" />
        <div className="rail">{POPULAR_TONIGHT.map((id) => <SoundCard key={id} id={id} queue={POPULAR_TONIGHT} />)}</div>
      </section>

      <section className="section">
        <SectionHead title="Recently Played" action={recent.length ? 'History' : undefined} onAction={() => store.set({ tab: 'library', libraryFilter: 'recent' })} />
        {recent.length ? (
          <div className="rail">{recent.slice(0, 10).map((id) => <SoundCard key={id} id={id} queue={recent} />)}</div>
        ) : (
          <div className="empty"><Icon name="history" />Sounds you play will appear here so you can return to them quickly.</div>
        )}
      </section>

      <section className="section">
        <SectionHead title="Your Favourites" action={favourites.length ? 'See all' : undefined} onAction={() => store.set({ tab: 'library', libraryFilter: 'favourites' })} />
        {favourites.length ? (
          <div className="rail">{favourites.map((id) => <SoundCard key={id} id={id} queue={favourites} />)}</div>
        ) : (
          <div className="empty"><Icon name="heart" />Tap the heart on any sound to keep it here.</div>
        )}
      </section>

      {mixes.length > 0 && (
        <section className="section">
          <SectionHead title="Your Mixes" action="Mixer" onAction={() => store.set({ tab: 'mixer' })} />
          <div className="rail">
            {mixes.map((m) => {
              const first = soundById(m.layers[0]?.id);
              if (!first) return null;
              return (
                <button key={m.id} className="sound-card" onClick={() => playMix(m)}>
                  <Art sound={first} glyphSize={28}><span className="badge"><Icon name="mixer" size={11} stroke={2.2} /> {m.layers.length} sounds</span></Art>
                  <div className="name">{m.name}</div>
                  <div className="cat">{m.layers.map((l) => soundById(l.id)?.name.split(' ')[0]).join(' · ')}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead title="Recommended for You" />
        <div className="rail">{recs.map((id) => <SoundCard key={id} id={id} queue={recs} />)}</div>
        <p className="dim tiny" style={{ padding: '8px 20px 0' }}>Based on the {recent.length || favourites.length ? `${[...new Set([...recent.slice(0, 6), ...favourites].map((id) => categoryById(soundById(id)!.category).short.toLowerCase()))].slice(0, 3).join(', ')} sounds you enjoy` : 'most-loved sounds tonight'}.</p>
      </section>
    </div>
  );
}
