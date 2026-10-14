import { useEffect, useState, type ReactNode } from 'react';
import { categoryById, soundById, type Sound } from '../data/sounds';
import { useStore } from '../state/store';
import { isLocked, playSound, toggleFavourite } from '../state/player';
import { engine } from '../audio/engine';
import { Icon } from './Icon';

/** Artwork: gradient + pattern + icon, tinted per category (blue family). */
export function Art({ sound, className = '', children, glyphSize = 26 }: { sound: Sound; className?: string; children?: ReactNode; glyphSize?: number }) {
  const cat = categoryById(sound.category);
  const h = cat.hue + ((sound.id.length * 7) % 14) - 7;
  const style = {
    background: `radial-gradient(120% 90% at 20% 10%, hsla(${h}, 95%, 62%, .55), transparent 55%),
      radial-gradient(90% 80% at 100% 100%, hsla(${h + 18}, 90%, 45%, .35), transparent 60%),
      linear-gradient(160deg, hsl(${h}, 65%, 16%), #04060b 85%)`,
  };
  return (
    <div className={`art p-${sound.category} ${className}`} style={style}>
      <div className="glyph"><Icon name={sound.icon} size={glyphSize} stroke={1.6} /></div>
      {children}
    </div>
  );
}

export function Bars({ paused }: { paused?: boolean }) {
  return <div className={`playing-bars ${paused ? 'paused' : ''}`}><i /><i /><i /></div>;
}

/** Re-render every `ms` while mounted (for progress / countdowns). */
export function useTick(ms = 1000, active = true) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms, active]);
}

export function fmtTime(sec: number) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function useIsActive(id: string) {
  const currentId = useStore((s) => s.currentId);
  const layers = useStore((s) => s.layers);
  const status = useStore((s) => s.status);
  const mode = useStore((s) => s.mode);
  const active = status !== 'idle' && (mode === 'single' ? currentId === id : layers.some((l) => l.id === id));
  return { active, status };
}

export function SoundCard({ id, queue }: { id: string; queue?: string[] }) {
  const sound = soundById(id);
  const favs = useStore((s) => s.favourites);
  useStore((s) => s.premium);
  const { active, status } = useIsActive(id);
  if (!sound) return null;
  const fav = favs.includes(id);
  const locked = isLocked(sound);
  return (
    <div className="sound-card">
      <button style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => playSound(id, { queue })} aria-label={`Play ${sound.name}`}>
        <Art sound={sound} glyphSize={28}>
          {locked && <span className="badge premium"><Icon name="crown" size={11} stroke={2.2} /> Premium</span>}
          {active && (status === 'loading' ? <div className="playing-bars"><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /></div> : <Bars paused={status === 'paused'} />)}
        </Art>
        <div className="name">{sound.name}</div>
        <div className="cat">{categoryById(sound.category).short} · Continuous</div>
      </button>
      <button className={`card-fav ${fav ? 'on' : ''}`} style={{ position: 'absolute' }} onClick={() => toggleFavourite(id)} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
        <Icon name="heart" size={16} fill={fav} />
      </button>
    </div>
  );
}

export function SoundRow({ id, queue, onAdd }: { id: string; queue?: string[]; onAdd?: (id: string) => void }) {
  const sound = soundById(id);
  const favs = useStore((s) => s.favourites);
  useStore((s) => s.premium);
  const { active, status } = useIsActive(id);
  if (!sound) return null;
  const fav = favs.includes(id);
  const locked = isLocked(sound);
  return (
    <div className={`row ${active ? 'active' : ''}`}>
      <button style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => playSound(id, { queue })}>
        <Art sound={sound} glyphSize={22}>
          {active && status === 'loading' && <div className="spinner" style={{ position: 'absolute' }} />}
        </Art>
        <div className="info">
          <div className="name">{sound.name}</div>
          <div className="desc">
            {locked ? <><Icon name="crown" size={11} stroke={2.2} style={{ verticalAlign: '-1px', color: 'var(--blue-2)' }} /> Premium · </> : null}
            {active && status !== 'loading' ? (status === 'paused' ? 'Paused' : 'Now playing') : sound.description}
          </div>
        </div>
      </button>
      <div className="row-actions">
        <button className={`round ${fav ? 'on' : ''}`} onClick={() => toggleFavourite(id)} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
          <Icon name="heart" size={17} fill={fav} />
        </button>
        {onAdd && (
          <button className="round" onClick={() => onAdd(id)} aria-label={`Add ${sound.name} to mix`}>
            <Icon name="plus" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function Slider({ value, onChange, disabled, label }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string }) {
  return (
    <input className="slider" type="range" min={0} max={100} step={1} value={Math.round(value * 100)} disabled={disabled}
      aria-label={label} style={{ ['--val' as string]: `${Math.round(value * 100)}%` }}
      onChange={(e) => onChange(Number(e.target.value) / 100)} />
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action && <button onClick={onAction}>{action}</button>}
    </div>
  );
}

/** Remaining sleep-timer seconds (audio clock). */
export function timerRemaining() { return engine.remaining('timer'); }
