import { useMemo } from 'react';
import { CATEGORIES, SOUNDS, POPULAR_TONIGHT, soundById } from '../data/sounds';
import { STORIES, FEATURED_STORIES, KIDS_STORIES, storyById, estimateMinutes, type Story } from '../data/stories';
import { store, useStore } from '../state/store';
import { togglePlay, recommendations, playMix, isLocked } from '../state/player';
import { playStory, toggleStory, getStory } from '../state/stories';
import { NightSky } from '../components/NightSky';
import { Icon, Logo } from '../components/Icon';
import { SoundCard, SectionHead, Art } from '../components/ui';
import { StoryCard } from '../components/storyUi';
import { StoryCover } from '../components/StoryCover';
import { BrandFooter } from '../components/BrandFooter';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still awake?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

/** Tonight's story: rotates daily through the featured list. */
function storyOfTheNight() {
  const day = Math.floor(Date.now() / 86400000);
  return storyById(FEATURED_STORIES[day % FEATURED_STORIES.length])!;
}

export function Home() {
  const recent = useStore((s) => s.recent);
  const recentStories = useStore((s) => s.recentStories);
  const progress = useStore((s) => s.storyProgress);
  const favourites = useStore((s) => s.favourites);
  const favStories = useStore((s) => s.favouriteStories);
  const mine = useStore((s) => s.myStories);
  const mixes = useStore((s) => s.mixes);
  const status = useStore((s) => s.status);
  const currentId = useStore((s) => s.currentId);
  const mode = useStore((s) => s.mode);
  const session = useStore((s) => s.story);
  const animations = useStore((s) => s.settings.animations);
  const premium = useStore((s) => s.premium);
  const kidsMode = useStore((s) => s.kidsMode);
  const recs = useMemo(() => recommendations(8), [recent, favourites, premium]);
  const allowed = (st: Story | undefined) => !!st && (!kidsMode || st.audience === 'kids');

  const day = Math.floor(Date.now() / 86400000);
  const tonight = kidsMode ? KIDS_STORIES[day % KIDS_STORIES.length] : storyOfTheNight();
  const kidsTonight = KIDS_STORIES[day % KIDS_STORIES.length];
  const continueStory = recentStories.map((id) => getStory(id)).find((st) => allowed(st) && progress[st!.id] && !progress[st!.id].finished && progress[st!.id].index > 0);
  const storyLive = session && session.status !== 'reading' ? getStory(session.id) : null;

  const resumeId = recent.find((id) => { const so = soundById(id); return so && !isLocked(so); }) ?? 'rain-gentle';
  const resume = soundById(resumeId)!;
  const soundName = mode === 'mix' ? 'your mix' : currentId ? soundById(currentId)?.name : '';

  // The big button: what's playing, else continue a story, else play a sound.
  const hero = storyLive
    ? { label: session!.status === 'paused' ? 'Story paused' : 'Now reading', meta: `${storyLive.title} · open`, icon: session!.status === 'paused' ? 'play' : 'pause', act: () => store.set({ page: 'storyPlayer', viewStoryId: storyLive.id }) }
    : status !== 'idle'
      ? { label: status === 'paused' ? 'Paused' : 'Now playing', meta: `${soundName} · open player`, icon: status === 'playing' ? 'pause' : 'play', act: () => store.set({ sheet: 'player' }) }
      : { label: recent.length ? 'Continue listening' : 'Play a sleep sound', meta: `${resume.name} · tap to play`, icon: 'play', act: () => togglePlay() };

  const favStoryList = favStories.map((id) => getStory(id)).filter(allowed);

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      <div className="hero" style={{ paddingTop: 'calc(var(--safe-t) + 18px)' }}>
        <div className="hero-sky"><NightSky animate={animations} /></div>
        <div className="moon" aria-hidden="true" style={{ top: 'calc(var(--safe-t) + 70px)' }} />
        <div className="topbar">
          <div className="brand"><Logo size={38} /><div className="brand-name">Fusion <span>Sleep</span></div></div>
          {kidsMode ? <span className="tag"><Icon name="shield" size={11} stroke={2.2} /> Kids Mode</span> : (
            <button className="icon-btn" onClick={() => store.set({ sheet: 'premium', premiumFocus: null })} aria-label="Pro">
              <Icon name="crown" size={20} />
            </button>
          )}
        </div>

        <div className="eyebrow" style={{ marginTop: 30 }}>{greeting()}</div>
        <h1 className="display">Welcome to Fusion&nbsp;Sleep</h1>
        <p className="sub">Relax your mind. Rest your body. Sleep peacefully.</p>

        <button className="big-play" onClick={hero.act}>
          <span className="disc">
            {status === 'loading' || session?.status === 'loading' ? <div className="spinner" /> : <Icon name={hero.icon} size={26} fill stroke={0} />}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="label" style={{ display: 'block' }}>{hero.label}</span>
            <span className="meta" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hero.meta}</span>
          </span>
        </button>

        <div className="quick-row">
          <button className="quick" onClick={() => store.set({ sheet: 'timer' })}><Icon name="timer" size={18} />Sleep timer</button>
          <button className="quick" onClick={() => store.set({ tab: 'sounds', soundsView: 'mixer' })}><Icon name="mixer" size={18} />Mix sounds</button>
          {kidsMode
            ? <button className="quick" onClick={() => store.set({ tab: 'stories' })}><Icon name="star" size={18} />Kids stories</button>
            : <button className="quick" onClick={() => store.set({ page: 'createStory' })}><Icon name="pen" size={18} />New story</button>}
        </div>
      </div>

      {/* Bedtime stories — the prominent feature */}
      <section className="section" style={{ marginTop: 8 }}>
        <SectionHead title={kidsMode ? 'Bedtime Stories for Kids' : 'Bedtime Stories'} action="All stories" onAction={() => store.set({ tab: 'stories' })} />
        <div className="story-band">
          <div className="txt">
            <span className="tag" style={{ alignSelf: 'flex-start' }}><Icon name="moon" size={11} stroke={2.2} /> {continueStory ? 'Continue your story' : "Tonight's story"}</span>
            <h3>{(continueStory ?? tonight).title}</h3>
            <p>{continueStory ? `You're ${Math.round((progress[continueStory.id].index / Math.max(1, progress[continueStory.id].total)) * 100)}% of the way through.` : `${tonight.description.split('.')[0]}. About ${estimateMinutes(tonight)} min.`}</p>
            <button className="btn" onClick={() => {
              const target = continueStory ?? tonight;
              if (session?.id === target.id && session.status !== 'reading') { toggleStory(); store.set({ page: 'storyPlayer', viewStoryId: target.id }); }
              else playStory(target.id);
            }}>
              <Icon name="play" size={16} fill stroke={0} />{continueStory ? 'Resume' : 'Play story'}
            </button>
          </div>
          <div className="art-side"><StoryCover motif={(continueStory ?? tonight).motif} seed={(continueStory ?? tonight).id} /></div>
        </div>
        <div className="rail" style={{ marginTop: 14 }}>
          {(kidsMode ? KIDS_STORIES : [...mine.slice(0, 2), ...FEATURED_STORIES.map((id) => storyById(id)!), ...STORIES.filter((x) => !FEATURED_STORIES.includes(x.id))])
            .filter((x) => x.id !== (continueStory ?? tonight).id).slice(0, 8)
            .map((st) => <StoryCard key={st.id} story={st} />)}
        </div>
      </section>

      {!kidsMode && (
        <section className="section">
          <SectionHead title="For little ones" action="Kids stories" onAction={() => store.set({ tab: 'stories', storyAudience: 'kids', storyFilter: 'all', storySearch: '' })} />
          <p className="dim tiny" style={{ padding: '0 20px 10px', marginTop: -6 }}>Short, gentle bedtime stories for children, about 2 to 4 minutes each. Turn on Kids Mode in Settings before handing over the phone.</p>
          <div className="rail">{[kidsTonight, ...KIDS_STORIES.filter((x) => x.id !== kidsTonight.id)].map((st) => <StoryCard key={st.id} story={st} />)}</div>
        </section>
      )}

      <section className="section">
        <SectionHead title="Recommended Sleep Sounds" action="All sounds" onAction={() => store.set({ tab: 'sounds', soundsView: 'library', libraryFilter: 'all', search: '' })} />
        <div className="rail">{(recent.length || favourites.length ? recs : POPULAR_TONIGHT).map((id) => <SoundCard key={id} id={id} queue={recs} />)}</div>
      </section>

      <section className="section">
        <SectionHead title="Browse by sound" />
        <div className="rail">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="cat-tile" onClick={() => store.set({ tab: 'sounds', soundsView: 'library', libraryFilter: c.id, search: '' })}
              style={{ background: `radial-gradient(100% 120% at 100% 0%, hsla(${c.hue},95%,58%,.28), transparent 60%), linear-gradient(150deg, hsl(${c.hue},50%,11%), var(--bg))` }}>
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
        <SectionHead title="Recently Played" action={recent.length || recentStories.length ? 'Favourites' : undefined} onAction={() => store.set({ tab: 'favourites' })} />
        {recent.length || recentStories.length ? (
          <div className="rail">
            {recentStories.slice(0, 4).map((id) => { const st = getStory(id); return allowed(st) ? <StoryCard key={id} story={st!} /> : null; })}
            {recent.slice(0, 8).map((id) => <SoundCard key={id} id={id} queue={recent} />)}
          </div>
        ) : (
          <div className="empty"><Icon name="history" />Stories and sounds you play will appear here so you can return to them quickly.</div>
        )}
      </section>

      <section className="section">
        <SectionHead title="Your Favourites" action={favourites.length || favStoryList.length ? 'See all' : undefined} onAction={() => store.set({ tab: 'favourites' })} />
        {favourites.length || favStoryList.length || mixes.length ? (
          <div className="rail">
            {favStoryList.map((st) => <StoryCard key={st!.id} story={st!} />)}
            {favourites.map((id) => <SoundCard key={id} id={id} queue={favourites} />)}
            {mixes.map((m) => {
              const first = soundById(m.layers[0]?.id);
              if (!first) return null;
              return (
                <button key={m.id} className="sound-card" onClick={() => playMix(m)}>
                  <Art sound={first} glyphSize={28}><span className="badge"><Icon name="mixer" size={11} stroke={2.2} /> {m.layers.length} sounds</span></Art>
                  <div className="name">{m.name}</div>
                  <div className="cat">Saved mix</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty"><Icon name="heart" />Tap the heart on any story or sound to keep it here.</div>
        )}
      </section>

      <BrandFooter />
    </div>
  );
}
