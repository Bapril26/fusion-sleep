import { storyCategoryById, estimateMinutes, type Story } from '../data/stories';
import { useStore } from '../state/store';
import { playStory, openStory, toggleFavouriteStory, toggleStory, isStoryLocked } from '../state/stories';
import { StoryCover } from './StoryCover';
import { Icon } from './Icon';

function useStoryState(id: string) {
  const session = useStore((s) => s.story);
  const progress = useStore((s) => s.storyProgress[id]);
  const fav = useStore((s) => s.favouriteStories.includes(id));
  const live = session?.id === id ? session.status : null;
  return { live, progress, fav };
}

const narratorLabel = (story: Story) => (story.generated ? 'Written for you · phone voice' : 'Narrated by your phone voice');

function PlayButton({ story, live }: { story: Story; live: string | null }) {
  useStore((s) => s.premium);
  const playing = live === 'playing' || live === 'loading';
  if (isStoryLocked(story)) {
    return (
      <button className="play-fab" style={{ background: 'var(--card-2)', border: '1px solid var(--line-2)' }} onClick={(e) => { e.stopPropagation(); playStory(story.id); }} aria-label={`${story.title} is part of Pro`}>
        <Icon name="lock" size={17} />
      </button>
    );
  }
  return (
    <button className="play-fab" onClick={(e) => { e.stopPropagation(); if (live && live !== 'reading') toggleStory(); else playStory(story.id); }}
      aria-label={playing ? `Pause ${story.title}` : `Play ${story.title}`}>
      {live === 'loading' ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name={playing ? 'pause' : 'play'} size={18} fill stroke={0} />}
    </button>
  );
}

export function StoryCard({ story }: { story: Story }) {
  const { live, progress, fav } = useStoryState(story.id);
  const pct = progress && !progress.finished && progress.total ? Math.round((progress.index / progress.total) * 100) : 0;
  return (
    <div className="story-card">
      <button style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => openStory(story.id)} aria-label={`Open ${story.title}`}>
        <div className="cover-wrap">
          <StoryCover motif={story.motif} seed={story.id} />
          {story.premium && <span className="badge premium" style={{ zIndex: 1 }}><Icon name="crown" size={11} stroke={2.2} /> Pro</span>}
          <div className="meta-on"><span><Icon name="clock" size={12} stroke={2} style={{ verticalAlign: '-2px' }} /> {estimateMinutes(story)} min</span></div>
          {pct > 0 && <div className="progress-line"><i style={{ width: `${pct}%` }} /></div>}
        </div>
        <div className="name">{story.title}</div>
        <div className="cat">{storyCategoryById(story.category).short}{pct > 0 ? ` · ${pct}% heard` : ''}</div>
      </button>
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className={`card-fav ${fav ? 'on' : ''}`} style={{ position: 'static', width: 40, height: 40 }} onClick={() => toggleFavouriteStory(story.id)} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
          <Icon name="heart" size={17} fill={fav} />
        </button>
      </div>
      <div style={{ position: 'absolute', left: 10, top: 156 }}><PlayButton story={story} live={live} /></div>
    </div>
  );
}

export function StoryRow({ story }: { story: Story }) {
  const { live, progress, fav } = useStoryState(story.id);
  const pct = progress && !progress.finished && progress.total ? Math.round((progress.index / progress.total) * 100) : 0;
  return (
    <div className={`story-row ${live && live !== 'reading' ? 'active' : ''}`}>
      <button className="thumb" onClick={() => openStory(story.id)} aria-label={`Open ${story.title}`}>
        <StoryCover motif={story.motif} seed={story.id} />
      </button>
      <div className="body">
        <button className="open" onClick={() => openStory(story.id)}>
          <span className="tag">{story.generated ? <><Icon name="pen" size={11} stroke={2.2} /> Your story</> : storyCategoryById(story.category).short}{story.premium ? <> · <Icon name="crown" size={11} stroke={2.2} /> Pro</> : null}</span>
          <h3>{story.title}</h3>
          <p>{story.description}</p>
        </button>
        <div className="facts">
          <span><Icon name="clock" size={13} /> about {estimateMinutes(story)} min</span>
          <span><Icon name="mic" size={13} /> {narratorLabel(story)}</span>
          {pct > 0 && <span style={{ color: 'var(--blue-2)' }}>{pct}% heard</span>}
          {progress?.finished && <span><Icon name="check" size={13} /> Finished</span>}
        </div>
      </div>
      <div className="acts">
        <button className={`round ${fav ? 'on' : ''}`} onClick={() => toggleFavouriteStory(story.id)} aria-label={fav ? `Remove ${story.title} from favourites` : `Add ${story.title} to favourites`}>
          <Icon name="heart" size={17} fill={fav} />
        </button>
        <PlayButton story={story} live={live} />
      </div>
    </div>
  );
}
