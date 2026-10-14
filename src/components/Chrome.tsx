import { soundById, categoryById } from '../data/sounds';
import { store, useStore, type Tab } from '../state/store';
import { togglePlay } from '../state/player';
import { Icon } from './Icon';
import { Art, fmtTime, timerRemaining, useTick } from './ui';
import { engine } from '../audio/engine';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'library', label: 'Sounds', icon: 'library' },
  { id: 'mixer', label: 'Mixer', icon: 'mixer' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function TabBar() {
  const tab = useStore((s) => s.tab);
  const mode = useStore((s) => s.mode);
  const status = useStore((s) => s.status);
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => { store.set({ tab: t.id }); window.scrollTo({ top: 0 }); }}>
          <Icon name={t.icon} size={22} />
          {t.label}
          {t.id === 'mixer' && mode === 'mix' && status !== 'idle' && tab !== 'mixer' && <span className="dot" />}
        </button>
      ))}
    </nav>
  );
}

export function MiniPlayer() {
  const status = useStore((s) => s.status);
  const mode = useStore((s) => s.mode);
  const currentId = useStore((s) => s.currentId);
  const layers = useStore((s) => s.layers);
  const mixes = useStore((s) => s.mixes);
  const activeMixId = useStore((s) => s.activeMixId);
  const timer = useStore((s) => s.timer);
  const trackLength = useStore((s) => s.trackLength);
  const trackStart = useStore((s) => s.trackStart);
  const preview = useStore((s) => s.preview);
  useTick(1000, status === 'playing');
  if (status === 'idle') return null;

  const firstId = mode === 'single' ? currentId : layers[0]?.id;
  const sound = firstId ? soundById(firstId) : null;
  if (!sound) return null;
  const title = mode === 'mix' ? (mixes.find((m) => m.id === activeMixId)?.name ?? 'Custom mix') : sound.name;
  const sub = mode === 'mix' ? `${layers.length} sound${layers.length > 1 ? 's' : ''} mixed` : preview ? 'Premium preview' : categoryById(sound.category).name;
  const rem = timer ? timerRemaining() : null;
  const progress = trackLength ? Math.min(1, (engine.now() - trackStart) / trackLength) : null;

  return (
    <div className="mini" role="region" aria-label="Now playing">
      <button style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }} onClick={() => store.set({ sheet: 'player' })} aria-label="Open player">
        <Art sound={sound} glyphSize={20} />
        <div className="info">
          <div className="t">{title}</div>
          <div className="s">
            {status === 'loading' ? 'Preparing sound…' : status === 'paused' ? 'Paused' : sub}
            {rem !== null && <span className="tm"><Icon name="timer" size={12} stroke={2} />{fmtTime(rem)}</span>}
          </div>
        </div>
      </button>
      <button className="round" onClick={() => store.set({ sheet: 'timer' })} aria-label="Sleep timer" style={timer ? { color: 'var(--blue-2)' } : undefined}>
        <Icon name="timer" size={18} />
      </button>
      <button className="round primary" onClick={togglePlay} aria-label={status === 'playing' ? 'Pause' : 'Play'} style={{ width: 46, height: 46 }}>
        {status === 'loading' ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name={status === 'playing' ? 'pause' : 'play'} size={20} fill stroke={0} />}
      </button>
      {progress !== null && <div className="progress"><i style={{ width: `${progress * 100}%` }} /></div>}
    </div>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind}`} role="status" key={toast.id} onClick={() => store.set({ toast: null })}>
      <Icon name={toast.kind === 'error' ? 'info' : toast.kind === 'success' ? 'check' : 'moon'} size={18} />
      <span>{toast.text}</span>
    </div>
  );
}

export function ConfirmDialog() {
  const c = useStore((s) => s.confirm);
  if (!c) return null;
  const close = () => store.set({ confirm: null });
  return (
    <>
      <div className="backdrop top" onClick={close} />
      <div className="dialog" role="alertdialog" aria-modal="true">
        <h3>{c.title}</h3>
        <p>{c.message}</p>
        <div className="acts">
          <button className="btn ghost" onClick={close}>Cancel</button>
          <button className={`btn ${c.danger ? 'danger' : ''}`} onClick={() => { close(); c.onConfirm(); }}>{c.confirmLabel}</button>
        </div>
      </div>
    </>
  );
}
