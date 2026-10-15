import { useEffect, useRef } from 'react';
import { storyCategoryById, estimateMinutes, paragraphsOf } from '../data/stories';
import { soundById } from '../data/sounds';
import { store, useStore, confirmAction } from '../state/store';
import {
  getStory, chunksFor, playStory, toggleStory, stopStory, skipParagraph, jumpToParagraph, restartStory,
  setStoryVolume, setStoryBackground, setStoryBackgroundVolume, toggleFavouriteStory, storySeconds, elapsedSeconds, deleteMyStory, isStoryLocked,
} from '../state/stories';
import { isLocked } from '../state/player';
import { StoryCover } from '../components/StoryCover';
import { Icon } from '../components/Icon';
import { Slider, fmtTime, useTick, timerRemaining } from '../components/ui';
import { BrandFooter } from '../components/BrandFooter';

const BACKGROUNDS = ['rain-gentle', 'rain-roof', 'ocean-waves', 'thunder-distant', 'stream', 'crickets', 'wind-gentle', 'campfire', 'brown-noise', 'ambient-music'];

export function StoryPlayer() {
  const page = useStore((s) => s.page);
  const viewId = useStore((s) => s.viewStoryId);
  const session = useStore((s) => s.story);
  const narratorPrefs = useStore((s) => s.narrator);
  const bg = useStore((s) => s.storyBackground);
  const soundStatus = useStore((s) => s.status);
  const currentSound = useStore((s) => s.currentId);
  const timer = useStore((s) => s.timer);
  const narration = useStore((s) => s.narrationAvailable);
  const favs = useStore((s) => s.favouriteStories);
  const progress = useStore((s) => (viewId ? s.storyProgress[viewId] : undefined));
  useStore((s) => s.myStories);
  useStore((s) => s.premium);
  useTick(1000, !!timer);
  const readerRef = useRef<HTMLDivElement>(null);

  const story = page === 'storyPlayer' && viewId ? getStory(viewId) : undefined;
  const isLive = !!story && session?.id === story.id;
  const status = isLive ? session!.status : null;
  const chunks = story ? chunksFor(story) : [];
  const index = isLive ? session!.index : progress && !progress.finished ? progress.index : 0;
  const currentParagraph = chunks[index]?.paragraph ?? 0;

  useEffect(() => {
    if (!isLive || (status !== 'playing' && status !== 'loading')) return;
    const el = readerRef.current?.querySelector<HTMLElement>(`[data-p="${currentParagraph}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentParagraph, isLive, status]);

  if (!story) return null;

  const locked = isStoryLocked(story);
  const allParagraphs = paragraphsOf(story);
  const paragraphs = locked ? allParagraphs.slice(0, 2) : allParagraphs;
  const total = storySeconds(story);
  const elapsed = elapsedSeconds(story, index);
  const playing = status === 'playing' || status === 'loading';
  const fav = favs.includes(story.id);
  const rem = timer ? timerRemaining() : null;
  const bgPlaying = soundStatus !== 'idle' && currentSound ? soundById(currentSound) : null;
  const close = () => store.set({ page: null });

  const mainAction = () => {
    if (isLive && status !== 'reading') toggleStory();
    else playStory(story.id, progress?.finished ? 0 : undefined);
  };

  return (
    <div className="sp" role="dialog" aria-label={story.title}>
      <div className="sp-inner">
        <div className="sp-top">
          <button className="icon-btn" onClick={close} aria-label="Back to stories (keeps playing)"><Icon name="chevronDown" /></button>
          <span className="eyebrow">{isLive && status !== 'reading' ? (status === 'paused' ? 'Paused' : 'Now reading') : 'Bedtime story'}</span>
          <button className={`icon-btn ${fav ? 'on' : ''}`} onClick={() => toggleFavouriteStory(story.id)} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
            <Icon name="heart" size={20} fill={fav} />
          </button>
        </div>

        <div className="sp-hero">
          <div className="thumb"><StoryCover motif={story.motif} seed={story.id} title={`Cover for ${story.title}`} /></div>
          <div style={{ minWidth: 0 }}>
            <span className="tag">{story.generated ? 'Written for you' : storyCategoryById(story.category).short}{story.premium ? ' · Pro' : ''}</span>
            <h1 style={{ marginTop: 8 }}>{story.title}</h1>
            <div className="facts">
              <span>About {estimateMinutes(story)} min</span>
              <span>{story.setting}</span>
              <span>{story.mood}</span>
            </div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 14, fontSize: 14.5 }}>{story.description}</p>

        <div className="sp-controls">
          <div className="prog">
            <div className="bar"><i style={{ width: `${Math.min(100, (elapsed / Math.max(1, total)) * 100)}%` }} /></div>
            <div className="times">
              <span>{status === 'loading' ? 'Starting narration…' : fmtTime(elapsed)}</span>
              <span>about {fmtTime(Math.max(0, total - elapsed))} left</span>
            </div>
          </div>

          <div className="controls">
            <button className="side sm" onClick={restartStory} disabled={!isLive} aria-label="Start from the beginning">
              <div style={{ display: 'grid', placeItems: 'center', gap: 2 }}><Icon name="refresh" size={19} /><span style={{ fontSize: 10 }}>Restart</span></div>
            </button>
            <button className="side" onClick={() => skipParagraph(-1)} disabled={!isLive} aria-label="Previous paragraph"><Icon name="skipBack" size={26} /></button>
            <button className="main" onClick={mainAction} aria-label={locked ? 'Unlock with Pro to play' : playing ? 'Pause story' : 'Play story'} disabled={narration === false && !isLive}>
              {status === 'loading' ? <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /> : locked ? <Icon name="lock" size={28} /> : <Icon name={playing ? 'pause' : 'play'} size={32} fill stroke={0} />}
            </button>
            <button className="side" onClick={() => skipParagraph(1)} disabled={!isLive} aria-label="Next paragraph"><Icon name="skipFwd" size={26} /></button>
            <button className="side sm" onClick={() => stopStory()} disabled={!isLive || status === 'reading'} aria-label="Stop story">
              <div style={{ display: 'grid', placeItems: 'center', gap: 2 }}><Icon name="stop" size={19} /><span style={{ fontSize: 10 }}>Stop</span></div>
            </button>
          </div>

          <div className="sp-row">
            <span className="lbl">Voice volume</span>
            <Slider value={narratorPrefs.volume} onChange={setStoryVolume} label="Story voice volume" />
          </div>
          <button className="sp-row" style={{ width: '100%', textAlign: 'left', minHeight: 44 }} onClick={() => store.set({ sheet: 'voice' })}>
            <span className="lbl">Narrator</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Change voice & reading speed</span>
            <Icon name="chevronRight" size={18} />
          </button>

          <div className="label" style={{ marginTop: 16 }}>Background sound</div>
          <div className="bg-chips">
            <button className={`chip ${!bg.soundId ? 'on' : ''}`} onClick={() => setStoryBackground(null)}>None</button>
            {BACKGROUNDS.map((id) => {
              const so = soundById(id);
              if (!so || isLocked(so)) return null;
              return <button key={id} className={`chip ${bg.soundId === id ? 'on' : ''}`} onClick={() => setStoryBackground(id)}>{so.name}</button>;
            })}
          </div>
          <div className="sp-row">
            <span className="lbl">Sound volume</span>
            <Slider value={bg.volume} onChange={setStoryBackgroundVolume} label="Background sound volume" disabled={!bg.soundId} />
          </div>
          <p className="dim tiny" style={{ marginTop: 8 }}>
            {bgPlaying ? `Playing now: ${bgPlaying.name}. It keeps going softly after the story ends.` : bg.soundId ? `${soundById(bg.soundId)?.name} will start with the story.` : 'The story will play on its own.'}
          </p>

          <div className="player-tools" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button className={`tool ${timer ? 'on' : ''}`} onClick={() => store.set({ sheet: 'timer' })}><Icon name="timer" />{rem !== null ? `${fmtTime(rem)} left` : 'Sleep timer'}</button>
            <button className="tool" onClick={() => store.set({ sleepScreen: true })} disabled={!isLive || status === 'reading'}><Icon name="moon" />Sleep screen</button>
          </div>
        </div>

        {narration === false && (
          <div className="notice warn"><Icon name="info" size={18} /><span>Narration isn't available on this device, so you can read the story below. On Android, enable “Speech Services by Google” in Settings → Accessibility → Text-to-speech.</span></div>
        )}
        {isLive && session?.error && narration !== false && (
          <div className="notice warn"><Icon name="info" size={18} /><span>{session.error} You can keep reading below, or press play to try again.</span></div>
        )}

        <div className="reader" ref={readerRef}>
          <h2>Read along · tap a paragraph to listen from there</h2>
          {paragraphs.map((p, i) => (
            <p key={i} data-p={i} className={isLive && status !== 'reading' && i === currentParagraph ? 'now' : ''}
              onClick={() => narration !== false && !locked && jumpToParagraph(i)}>{p}</p>
          ))}
          {locked ? (
            <div className="notice" style={{ marginTop: 4 }}>
              <Icon name="crown" size={18} />
              <span style={{ flex: 1 }}><b style={{ color: 'var(--text)' }}>The rest of this story is part of Fusion Sleep Pro.</b> Listen to it in full, with all Pro stories and sounds.
                <button className="btn" style={{ marginTop: 10, height: 44 }} onClick={() => store.set({ sheet: 'premium', premiumFocus: story.id })}>See Pro</button>
              </span>
            </div>
          ) : (
            <p style={{ textAlign: 'center', cursor: 'default', fontStyle: 'normal', fontFamily: 'inherit', color: 'var(--dim)', fontSize: 13 }}>The end · sleep well</p>
          )}
        </div>

        {story.generated && (
          <button className="btn danger block" style={{ marginTop: 16 }} onClick={() => confirmAction({
            title: 'Delete this story?', message: `“${story.title}” will be removed from this phone.`, confirmLabel: 'Delete', danger: true,
            onConfirm: () => { store.set({ page: null }); deleteMyStory(story.id); },
          })}><Icon name="trash" size={18} />Delete this story</button>
        )}

        <BrandFooter />
      </div>
    </div>
  );
}
