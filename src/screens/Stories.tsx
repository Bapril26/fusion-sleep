import { useMemo } from 'react';
import { STORIES, STORY_CATEGORIES, KIDS_STORIES, KIDS_CATEGORIES, storyCategoryById, estimateMinutes } from '../data/stories';
import { store, useStore } from '../state/store';
import { storyServerConfigured } from '../config/storyServer';
import { Icon } from '../components/Icon';
import { StoryRow } from '../components/storyUi';
import { BrandFooter } from '../components/BrandFooter';

const ADULT_FILTERS = [
  { id: 'all', label: 'All' },
  ...STORY_CATEGORIES.map((c) => ({ id: c.id as string, label: c.short })),
  { id: 'mine', label: 'My stories', icon: 'pen' },
  { id: 'short', label: 'Under 6 min', icon: 'clock' },
  { id: 'favourites', label: 'Favourites', icon: 'heart' },
];
const KIDS_FILTERS = [
  { id: 'all', label: 'All' },
  ...KIDS_CATEGORIES.map((c) => ({ id: c.id as string, label: c.short })),
  { id: 'favourites', label: 'Favourites', icon: 'heart' },
];

export function Stories() {
  const filter = useStore((s) => s.storyFilter);
  const search = useStore((s) => s.storySearch);
  const mine = useStore((s) => s.myStories);
  const favs = useStore((s) => s.favouriteStories);
  const narration = useStore((s) => s.narrationAvailable);
  const kidsMode = useStore((s) => s.kidsMode);
  const audienceChoice = useStore((s) => s.storyAudience);
  const kids = kidsMode || audienceChoice === 'kids';
  const filters = kids ? KIDS_FILTERS : ADULT_FILTERS;
  const activeFilter = filters.some((f) => f.id === filter) ? filter : 'all';

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = kids ? KIDS_STORIES : [...mine, ...STORIES];
    if (activeFilter === 'mine') list = mine;
    else if (activeFilter === 'favourites') list = list.filter((st) => favs.includes(st.id));
    else if (activeFilter === 'short') list = list.filter((st) => estimateMinutes(st) < 6);
    else if (activeFilter !== 'all') list = list.filter((st) => st.category === activeFilter);
    if (q) list = list.filter((st) => [st.title, st.description, st.setting, st.mood, storyCategoryById(st.category).name].some((t) => t.toLowerCase().includes(q)) || st.text.toLowerCase().includes(q));
    return list;
  }, [activeFilter, search, mine, favs, kids]);

  const grouped = activeFilter === 'all' && !search.trim();
  const setAudience = (a: 'adult' | 'kids') => store.set({ storyAudience: a, storyFilter: 'all', storySearch: '' });

  return (
    <div className="screen">
      <div className="pad">
        <div className="eyebrow">{kids ? 'Bedtime stories for kids' : 'Bedtime stories'}</div>
        <h1 className="title" style={{ marginTop: 4 }}>{kids ? 'Stories for little ones' : 'Stories for grown-ups'}</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          {kids ? 'Short, gentle stories about sleepy animals, moon boats and cosy nights. About 2 to 4 minutes each.' : 'Slow, gentle stories read aloud to help you drift off. Tap a story to read along, or press play to listen.'}
        </p>
      </div>

      {kidsMode ? (
        <div className="notice" style={{ margin: '16px 20px 0' }}>
          <Icon name="shield" size={18} />
          <span><b style={{ color: 'var(--text)' }}>Kids Mode is on.</b> Only children's stories are shown. A grown-up can turn it off in Settings.</span>
        </div>
      ) : (
        <div className="view-switch" role="tablist" aria-label="Who the stories are for">
          <button role="tab" aria-selected={!kids} className={!kids ? 'on' : ''} onClick={() => setAudience('adult')}><Icon name="moon" size={18} />Grown-ups</button>
          <button role="tab" aria-selected={kids} className={kids ? 'on' : ''} onClick={() => setAudience('kids')}><Icon name="star" size={18} />Kids</button>
        </div>
      )}

      {!kids && (
        <button className="story-band" style={{ marginTop: 18, width: 'calc(100% - 40px)', textAlign: 'left', minHeight: 0, gridTemplateColumns: '1fr auto' }} onClick={() => store.set({ page: 'createStory' })}>
          <div className="txt" style={{ paddingRight: 8 }}>
            <span className="tag" style={{ alignSelf: 'flex-start' }}><Icon name="sparkles" size={11} stroke={2.2} /> Create my own story</span>
            <b style={{ fontSize: 16, fontWeight: 600 }}>Describe the story you'd like tonight</b>
            <p>Choose a mood, a setting and a length, and a new story is written just for you.{storyServerConfigured() ? '' : ' (Needs setting up first.)'}</p>
          </div>
          <span style={{ display: 'grid', placeItems: 'center', paddingRight: 18 }}><span className="play-fab"><Icon name="pen" size={18} /></span></span>
        </button>
      )}

      {narration === false && (
        <div className="notice warn" style={{ margin: '14px 20px 0' }}>
          <Icon name="info" size={18} />
          <span>This device has no voice engine for narration, so stories open in reading mode. On Android, install or enable “Speech Services by Google” in Settings → Accessibility → Text-to-speech.</span>
        </div>
      )}

      <label className="search">
        <Icon name="search" size={20} />
        <input id="story-search" type="search" placeholder={kids ? 'Search animals, moon, train…' : 'Search stories, places, moods…'} value={search} onChange={(e) => store.set({ storySearch: e.target.value })} aria-label="Search stories" />
        {search && <button onClick={() => store.set({ storySearch: '' })} aria-label="Clear search" style={{ minWidth: 32, minHeight: 32 }}><Icon name="x" size={18} /></button>}
      </label>

      <div className="chips" role="tablist" aria-label="Filter stories">
        {filters.map((f) => (
          <button key={f.id} role="tab" aria-selected={activeFilter === f.id} className={`chip ${activeFilter === f.id ? 'on' : ''}`} onClick={() => store.set({ storyFilter: f.id })}>
            {'icon' in f && f.icon && <Icon name={f.icon} size={15} fill={f.id === 'favourites' && activeFilter === f.id} />}{f.label}
          </button>
        ))}
      </div>

      {results.length === 0 && (
        <div className="empty" style={{ marginTop: 18 }}>
          <Icon name={activeFilter === 'favourites' ? 'heart' : activeFilter === 'mine' ? 'pen' : 'search'} />
          {activeFilter === 'favourites' && !search ? 'No favourite stories here yet. Tap the heart on a story to keep it here.'
            : activeFilter === 'mine' && !search ? 'Stories written for you will be saved here, ready to play again offline.'
            : `No stories match “${search}”.`}
        </div>
      )}

      {grouped ? (
        <>
          {!kids && mine.length > 0 && (
            <>
              <div className="group-title">My stories</div>
              {mine.slice(0, 3).map((st) => <StoryRow key={st.id} story={st} />)}
              {mine.length > 3 && <button className="link" style={{ margin: '0 20px 8px', minHeight: 44 }} onClick={() => store.set({ storyFilter: 'mine' })}>See all {mine.length} of your stories</button>}
            </>
          )}
          {(kids ? KIDS_CATEGORIES : STORY_CATEGORIES).map((c) => (
            <div key={c.id}>
              <div className="group-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={c.icon} size={14} />{c.name}</div>
              <p className="dim tiny" style={{ padding: '0 20px 10px', marginTop: -2 }}>{c.blurb}</p>
              {(kids ? KIDS_STORIES : STORIES).filter((st) => st.category === c.id).map((st) => <StoryRow key={st.id} story={st} />)}
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
