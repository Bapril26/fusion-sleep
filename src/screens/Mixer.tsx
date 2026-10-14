import { soundById } from '../data/sounds';
import { store, useStore, confirmAction, type Mix } from '../state/store';
import { togglePlay, removeLayer, setLayerVolume, toggleMute, setMasterVolume, playMix, deleteMix, updateMix, limits, stop } from '../state/player';
import { FREE_LIMITS } from '../billing/plans';
import { Icon } from '../components/Icon';
import { Art, Slider, SectionHead } from '../components/ui';

const STARTERS: Mix[] = [
  { id: 'starter-storm', name: 'Cosy Storm', createdAt: 0, layers: [{ id: 'rain-roof', volume: 0.8, muted: false }, { id: 'thunder-distant', volume: 0.6, muted: false }, { id: 'wind-gentle', volume: 0.35, muted: false }] },
  { id: 'starter-camp', name: 'Summer Night', createdAt: 0, layers: [{ id: 'crickets', volume: 0.55, muted: false }, { id: 'stream', volume: 0.5, muted: false }, { id: 'wind-gentle', volume: 0.4, muted: false }] },
  { id: 'starter-sea', name: 'Ocean Calm', createdAt: 0, layers: [{ id: 'ocean-waves', volume: 0.85, muted: false }, { id: 'ambient-music', volume: 0.35, muted: false }] },
  { id: 'starter-focus', name: 'Deep Focus', createdAt: 0, layers: [{ id: 'brown-noise', volume: 0.6, muted: false }, { id: 'rain-gentle', volume: 0.5, muted: false }] },
];

function MixStack({ mix }: { mix: Mix }) {
  return (
    <div className="stack">
      {mix.layers.slice(0, 3).map((l) => { const s = soundById(l.id); return s ? <Art key={l.id} sound={s} glyphSize={16} /> : null; })}
    </div>
  );
}

export function Mixer() {
  const mode = useStore((s) => s.mode);
  const status = useStore((s) => s.status);
  const layers = useStore((s) => s.layers);
  const mixes = useStore((s) => s.mixes);
  const activeMixId = useStore((s) => s.activeMixId);
  const masterVolume = useStore((s) => s.masterVolume);
  const premium = useStore((s) => s.premium);
  const active = mode === 'mix' && status !== 'idle' && layers.length > 0;
  const max = limits().mixLayers;
  const activeMix = mixes.find((m) => m.id === activeMixId);

  return (
    <div className="screen">
      <div className="pad" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Sound mixer</div>
        <h1 className="title" style={{ marginTop: 4 }}>Create your perfect night</h1>
        <p className="muted small" style={{ marginTop: 6 }}>Layer rain, thunder, wind or birds and balance each one.</p>
      </div>

      {active ? (
        <div className="mix-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{activeMix?.name ?? 'Current mix'}</div>
              <div className="dim tiny">{layers.length} of {max} sounds · {status === 'paused' ? 'paused' : status === 'loading' ? 'preparing…' : 'playing'}</div>
            </div>
            <button className="round" onClick={stop} aria-label="Stop mix"><Icon name="stop" size={18} /></button>
            <button className="round primary" style={{ width: 48, height: 48 }} onClick={togglePlay} aria-label={status === 'playing' ? 'Pause mix' : 'Play mix'}>
              {status === 'loading' ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name={status === 'playing' ? 'pause' : 'play'} size={20} fill stroke={0} />}
            </button>
          </div>

          <div className="vol-row" style={{ marginBottom: 6 }}>
            <span className="small" style={{ width: 92, color: 'var(--text)', fontWeight: 500 }}>Master</span>
            <Slider value={masterVolume} onChange={setMasterVolume} label="Master volume" />
            <span className="tiny" style={{ width: 34, textAlign: 'right' }}>{Math.round(masterVolume * 100)}%</span>
          </div>

          {layers.map((l) => {
            const s = soundById(l.id);
            if (!s) return null;
            return (
              <div key={l.id} className={`layer ${l.muted ? 'muted' : ''}`}>
                <Art sound={s} glyphSize={20} />
                <div className="body">
                  <div className="name">{s.name}<span>{l.muted ? 'Muted' : `${Math.round(l.volume * 100)}%`}</span></div>
                  <Slider value={l.volume} onChange={(v) => setLayerVolume(l.id, v)} label={`${s.name} volume`} disabled={l.muted} />
                </div>
                <button className={`round ${l.muted ? 'on' : ''}`} onClick={() => toggleMute(l.id)} aria-label={l.muted ? `Unmute ${s.name}` : `Mute ${s.name}`}>
                  <Icon name={l.muted ? 'volumeOff' : 'volume'} size={17} />
                </button>
                <button className="round" onClick={() => removeLayer(l.id)} aria-label={`Remove ${s.name}`}><Icon name="x" size={17} /></button>
              </div>
            );
          })}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <button className="btn ghost" onClick={() => store.set({ sheet: 'addLayer' })} disabled={layers.length >= max && premium}>
              <Icon name="plus" size={18} />Add sound
            </button>
            {activeMix
              ? <button className="btn" onClick={() => updateMix(activeMix.id)}><Icon name="save" size={18} />Save changes</button>
              : <button className="btn" onClick={() => store.set({ sheet: 'saveMix' })}><Icon name="save" size={18} />Save mix</button>}
          </div>
        </div>
      ) : (
        <div className="mix-card" style={{ textAlign: 'center', padding: '26px 20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: 'rgba(22,119,255,.15)', color: 'var(--blue-2)' }}>
            <Icon name="mixer" size={30} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 17 }}>Start a new mix</div>
          <p className="muted small" style={{ margin: '6px 0 16px' }}>Add your first sound, then layer more on top. Free mixes hold up to {FREE_LIMITS.mixLayers} sounds.</p>
          <button className="btn" onClick={() => store.set({ sheet: 'addLayer' })}><Icon name="plus" size={18} />Add a sound</button>
        </div>
      )}

      <section className="section">
        <SectionHead title="Quick-start mixes" />
        <div className="rail">
          {STARTERS.map((m) => {
            const first = soundById(m.layers[0].id)!;
            return (
              <button key={m.id} className="sound-card" onClick={() => playMix(m)}>
                <Art sound={first} glyphSize={28}><span className="badge"><Icon name="mixer" size={11} stroke={2.2} /> {m.layers.length} sounds</span></Art>
                <div className="name">{m.name}</div>
                <div className="cat">{m.layers.map((l) => soundById(l.id)?.name.split(' ')[0]).join(' · ')}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Saved mixes" />
        {!premium && <p className="dim tiny" style={{ padding: '0 20px 10px', marginTop: -6 }}>{mixes.length} of {FREE_LIMITS.savedMixes} free saved mixes used</p>}
        {mixes.length === 0 ? (
          <div className="empty"><Icon name="save" />Build a mix you love, then tap “Save mix” to keep it here.</div>
        ) : (
          mixes.map((m) => (
            <div key={m.id} className={`saved-mix ${m.id === activeMixId && active ? 'on' : ''}`}>
              <MixStack mix={m} />
              <button style={{ flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => playMix(m)}>
                <div style={{ fontWeight: 500 }}>{m.name}</div>
                <div className="dim tiny" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.layers.map((l) => soundById(l.id)?.name).join(' · ')}</div>
              </button>
              <button className="round" aria-label={`Delete ${m.name}`} onClick={() => confirmAction({
                title: 'Delete this mix?', message: `“${m.name}” will be removed from this device.`, confirmLabel: 'Delete', danger: true, onConfirm: () => deleteMix(m.id),
              })}><Icon name="trash" size={17} /></button>
              <button className="round primary" onClick={() => playMix(m)} aria-label={`Play ${m.name}`}><Icon name="play" size={16} fill stroke={0} /></button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
