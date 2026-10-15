import { useMemo } from 'react';
import { STORIES, STORY_CATEGORIES, storyCategoryById, estimateMinutes } from '../data/stories';
import { store, useStore } from '../state/store';
import { storyServerConfigured } from '../config/storyServer';
import { Icon } from '../components/Icon';
import { StoryRow } from '../components/storyUi';
import { BrandFooter } from '../components/BrandFooter';

const FILTERS = [
  { id: 'all', label: 'All' },
  ...STORY_CATEGORIES.map((c) => ({ id: c.id as string, label: c.short })),
  { id: 'mine', label: 'My stories', icon: 'pen' },
  { id: 'short', label: 'Under 6 min', icon: 'clock' },
  { id: 'favourites', label: 'Favourites', icon: 'heart' },
];

export function Stories() {
  const filter = useStore((s) => s.storyFilter);
  const search = useStore((s) => s.storySearch);
  const mine = useStore((s) => s.myStories);
  const favs = useStore((s) => s.favouriteStories);
  const narration = useStore((s) => s.narrationAvailable);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...mine, ...STORIES];
    if (filter === 'mine') list = mine;
    else if (filter === 'favourites') list = list.filter((st) => favs.includes(st.id));
    else if (filter === 'short') list = list.filter((st) => estimateMinutes(st) < 6);
    else if (filter !== 'all') list = list.filter((st) => st.category === filter);
    if (q) list = list.filter((st) => [st.title, st.description, st.setting, st.mood, storyCategoryById(st.category).name].some((t) => t.toLowerCase().includes(q)) || st.text.toLowerCase().includes(q));
    return list;
  }, [filter, search, mine, favs]);

  const grouped = filter === 'all' && !search.trim();

  return (
    <div className="screen">
      <div className="pad">
        <div className="eyebrow">Bedtime stories</div>
        <h1 className="title" style={{ marginTop: 4 }}>Stories for grown-ups</h1>
        <p className="muted small" style={{ marginTop: 6 }}>Slow, gentle stories read aloud to help you drift off. Tap a story to read along, or press play to listen.</p>
      </div>

      <button className="story-band" style={{ marginTop: 18, width: 'calc(100% - 40px)', textAlign: 'left', minHeight: 0, gridTemplateColumns: '1fr auto' }} onClick={() => store.set({ page: 'createStory' })}>
        <div className="txt" style={{ paddingRight: 8 }}>
          <span className="tag" style={{ alignSelf: 'flex-start' }}><Icon name="sparkles" size={11} stroke={2.2} /> Create my own story</span>
          <b style={{ fontSize: 16, fontWeight: 600 }}>Describe the story you'd like tonight</b>
          <p>Choose a mood, a setting and a length, and a new story is written just for you.{storyServerConfigured() ? '' : ' (Needs setting up first.)'}</p>
        </div>
        <span style={{ display: 'grid', placeItems: 'center', paddingRight: 18 }}><span className="play-fab"><Icon name="pen" size={18} /></span></span>
      </button>

      {narration === false && (
        <div className="notice warn" style={{ margin: '14px 20px 0' }}>
          <Icon name="info" size={18} />
          <span>This device has no voice engine for narration, so stories open in reading mode. On Android, install or enable “Speech Services by Google” in Settings → Accessibility → Text-to-speech.</span>
        </div>
      )}

      <label className="search">
        <Icon name="search" size={20} />
        <input id="story-search" type="search" placeholder="Search stories, places, moods…" value={search} onChange={(e) => store.set({ storySearch: e.target.value })} aria-label="Search stories" />
        {search && <button onClick={() => store.set({ storySearch: '' })} aria-label="Clear search" style={{ minWidth: 32, minHeight: 32 }}><Icon name="x" size={18} /></button>}
      </label>

      <div className="chips" role="tablist" aria-label="Filter stories">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => store.set({ storyFilter: f.id })}>
            {'icon' in f && f.icon && <Icon name={f.icon} size={15} fill={f.id === 'favourites' && filter === f.id} />}{f.label}
          </button>
        ))}
      </div>

      {results.length === 0 && (
        <div className="empty" style={{ marginTop: 18 }}>
          <Icon name={filter === 'favourites' ? 'heart' : filter === 'mine' ? 'pen' : 'search'} />
          {filter === 'favourites' && !search ? 'No favourite stories yet. Tap the heart on a story to keep it here.'
            : filter === 'mine' && !search ? 'Stories written for you will be saved here, ready to play again offline.'
            : `No stories match “${search}”.`}
        </div>
      )}

      {grouped ? (
        <>
          {mine.length > 0 && (
            <>
              <div className="group-title">My stories</div>
              {mine.slice(0, 3).map((st) => <StoryRow key={st.id} story={st} />)}
              {mine.length > 3 && <button className="link" style={{ margin: '0 20px 8px', minHeight: 44 }} onClick={() => store.set({ storyFilter: 'mine' })}>See all {mine.length} of your stories</button>}
            </>
          )}
          {STORY_CATEGORIES.map((c) => (
            <div key={c.id}>
              <div className="group-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={c.icon} size={14} />{c.name}</div>
              <p className="dim tiny" style={{ padding: '0 20px 10px', marginTop: -2 }}>{c.blurb}</p>
              {STORIES.filter((st) => st.category === c.id).map((st) => <StoryRow key={st.id} story={st} />)}
            </div>
          ))}
        </>
      ) : (
        <div style={{ paddingTop: 12 }}>{results.map((st) => <StoryRow key={st.id} story={st} />)}</div>
      )}

      <BrandFooter />
    </div>
  );
}
