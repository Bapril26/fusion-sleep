import { store, useStore } from '../state/store';
import { Icon } from '../components/Icon';
import { Library } from './Library';
import { Mixer } from './Mixer';

/** Sleep Sounds tab: the sound library and the mixer, one tap apart. */
export function SleepSounds() {
  const view = useStore((s) => s.soundsView);
  return view === 'mixer' ? <Mixer /> : <Library />;
}

export function SoundsSwitch() {
  const view = useStore((s) => s.soundsView);
  const mixing = useStore((s) => s.mode === 'mix' && s.status !== 'idle');
  return (
    <div className="view-switch" role="tablist" aria-label="Sleep sounds view">
      <button role="tab" aria-selected={view === 'library'} className={view === 'library' ? 'on' : ''} onClick={() => store.set({ soundsView: 'library' })}>
        <Icon name="library" size={18} />All sounds
      </button>
      <button role="tab" aria-selected={view === 'mixer'} className={view === 'mixer' ? 'on' : ''} onClick={() => store.set({ soundsView: 'mixer' })}>
        <Icon name="mixer" size={18} />Mixer{mixing && <span className="dot" aria-label="mix playing" />}
      </button>
    </div>
  );
}
