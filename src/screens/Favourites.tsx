import { STORIES } from '../data/stories';
import { soundById } from '../data/sounds';
import { store, useStore } from '../state/store';
import { playMix } from '../state/player';
import { Icon } from '../components/Icon';
import { SoundRow, SectionHead, Art } from '../components/ui';
import { StoryRow } from '../components/storyUi';
import { BrandFooter } from '../components/BrandFooter';

export function Favourites() {
  const favSounds = useStore((s) => s.favourites);
  const favStories = useStore((s) => s.favouriteStories);
  const mine = useStore((s) => s.myStories);
  const mixes = useStore((s) => s.mixes);
  const recentStories = useStore((s) => s.recentStories);
  const recentSounds = useStore((s) => s.recent);
  const stories = favStories.map((id) => mine.find((x) => x.id === id) ?? STORIES.find((x) => x.id === id)).filter(Boolean);
  const recent = recentStories.map((id) => mine.find((x) => x.id === id) ?? STORIES.find((x) => x.id === id)).filter(Boolean).slice(0, 4);
  const nothing = !favSounds.length && !stories.length && !mixes.length;

  return (
    <div className="screen">
      <div className="pad">
        <div className="eyebrow">Favourites</div>
        <h1 className="title" style={{ marginTop: 4 }}>Your saved favourites</h1>
        <p className="muted small" style={{ marginTop: 6 }}>Everything you've hearted or saved, kept on this phone. No account needed.</p>
      </div>

      {nothing && (
        <div className="empty" style={{ marginTop: 20 }}>
          <Icon name="heart" />
          <span>Nothing saved yet. Tap the heart on any sound or story, or save a mix in the Mixer, and it will appear here.</span>
        </div>
      )}

      <section className="section">
        <SectionHead title="Favourite stories" action="Browse stories" onAction={() => store.set({ tab: 'stories' })} />
        {stories.length ? stories.map((st) => <StoryRow key={st!.id} story={st!} />) : <p className="fav-section-empty">No favourite stories yet.</p>}
      </section>

      <section className="section">
        <SectionHead title="Favourite sounds" action="Browse sounds" onAction={() => store.set({ tab: 'sounds', soundsView: 'library' })} />
        <div style={{ padding: '0 10px' }}>
          {favSounds.length ? favSounds.map((id) => <SoundRow key={id} id={id} queue={favSounds} />) : <p className="fav-section-empty" style={{ margin: '0 10px' }}>No favourite sounds yet.</p>}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Saved mixes" action="Open mixer" onAction={() => store.set({ tab: 'sounds', soundsView: 'mixer' })} />
        {mixes.length ? mixes.map((m) => {
          const first = soundById(m.layers[0]?.id);
          return (
            <button key={m.id} className="saved-mix" onClick={() => playMix(m)}>
              {first && <Art sound={first} glyphSize={18} className="mix-thumb" />}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 500 }}>{m.name}</span>
                <span className="dim tiny" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.layers.map((l) => soundById(l.id)?.name).join(' · ')}</span>
              </span>
              <span className="round primary"><Icon name="play" size={16} fill stroke={0} /></span>
            </button>
          );
        }) : <p className="fav-section-empty">No saved mixes yet.</p>}
      </section>

      {(recent.length > 0 || recentSounds.length > 0) && (
        <section className="section">
          <SectionHead title="Recently played" />
          {recent.map((st) => <StoryRow key={st!.id} story={st!} />)}
          <div style={{ padding: '0 10px' }}>{recentSounds.slice(0, 4).map((id) => <SoundRow key={id} id={id} queue={recentSounds} />)}</div>
        </section>
      )}

      <BrandFooter />
    </div>
  );
}
