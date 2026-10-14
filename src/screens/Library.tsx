import { useMemo } from 'react';
import { CATEGORIES, SOUNDS, categoryById } from '../data/sounds';
import { store, useStore } from '../state/store';
import { addLayer } from '../state/player';
import { Icon } from '../components/Icon';
import { SoundRow } from '../components/ui';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'rain', label: 'Rain' },
  { id: 'thunder', label: 'Thunder' },
  { id: 'nature', label: 'Nature' },
  { id: 'relax', label: 'Relaxation' },
  { id: 'noise', label: 'White noise' },
  { id: 'favourites', label: 'Favourites', icon: 'heart' },
  { id: 'recent', label: 'Recent', icon: 'history' },
];

export function Library() {
  const filter = useStore((s) => s.libraryFilter);
  const search = useStore((s) => s.search);
  const favourites = useStore((s) => s.favourites);
  const recent = useStore((s) => s.recent);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = SOUNDS;
    if (filter === 'favourites') list = favourites.map((id) => SOUNDS.find((s) => s.id === id)!).filter(Boolean);
    else if (filter === 'recent') list = recent.map((id) => SOUNDS.find((s) => s.id === id)!).filter(Boolean);
    else if (filter !== 'all') list = list.filter((s) => s.category === filter);
    if (q) {
      list = list.filter((s) => {
        const cat = categoryById(s.category);
        return [s.name, s.description, cat.name, cat.short, ...(s.tags ?? [])].some((t) => t.toLowerCase().includes(q));
      });
    }
    return list;
  }, [filter, search, favourites, recent]);

  const queue = results.map((s) => s.id);
  const grouped = filter === 'all' && !search.trim();

  return (
    <div className="screen">
      <div className="pad">
        <div className="eyebrow">Sound library</div>
        <h1 className="title" style={{ marginTop: 4 }}>Find your sound</h1>
      </div>

      <label className="search">
        <Icon name="search" size={20} />
        <input type="search" placeholder="Search rain, ocean, fan…" value={search} onChange={(e) => store.set({ search: e.target.value })} aria-label="Search sounds" />
        {search && <button onClick={() => store.set({ search: '' })} aria-label="Clear search"><Icon name="x" size={18} /></button>}
      </label>

      <div className="chips" role="tablist" aria-label="Filter sounds">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => store.set({ libraryFilter: f.id })}>
            {f.icon && <Icon name={f.icon} size={15} fill={f.id === 'favourites' && filter === f.id} />}{f.label}
          </button>
        ))}
      </div>

      {results.length === 0 && (
        <div className="empty" style={{ marginTop: 18 }}>
          <Icon name={filter === 'favourites' ? 'heart' : 'search'} />
          {filter === 'favourites' && !search ? 'No favourites yet — tap the heart next to any sound.'
            : filter === 'recent' && !search ? 'Nothing played yet.'
            : `No sounds match “${search}”. Try “rain”, “waves” or “noise”.`}
        </div>
      )}

      {grouped ? (
        CATEGORIES.map((c) => (
          <div key={c.id}>
            <div className="group-title">{c.name}</div>
            <div style={{ padding: '0 10px' }}>
              {SOUNDS.filter((s) => s.category === c.id).map((s) => <SoundRow key={s.id} id={s.id} queue={queue} onAdd={addLayer} />)}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '10px 10px 0' }}>
          {results.map((s) => <SoundRow key={s.id} id={s.id} queue={queue} onAdd={addLayer} />)}
        </div>
      )}

      <p className="dim tiny" style={{ textAlign: 'center', marginTop: 22, padding: '0 30px' }}>
        Tap a sound to play it. Use <Icon name="plus" size={12} style={{ verticalAlign: '-2px' }} /> to layer it into a mix.
      </p>
    </div>
  );
}
