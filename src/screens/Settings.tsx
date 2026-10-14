import type { ReactNode } from 'react';
import { store, useStore, confirmAction, clearPersisted, toast, type Settings as S, type Page } from '../state/store';
import { clearRecent, stop, setMasterVolume } from '../state/player';
import { Icon, Logo } from '../components/Icon';
import { Slider, Toggle } from '../components/ui';
import { APP_VERSION } from '../version';

function Row({ icon, title, sub, value, onClick, red }: { icon: string; title: string; sub?: string; value?: ReactNode; onClick?: () => void; red?: boolean }) {
  return (
    <button className="set-row" onClick={onClick}>
      <span className={`ic ${red ? 'red' : ''}`}><Icon name={icon} size={18} /></span>
      <span className="tx"><b style={red ? { color: 'var(--danger)' } : undefined}>{title}</b>{sub && <span>{sub}</span>}</span>
      {value !== undefined ? <span className="val">{value}</span> : <span className="val"><Icon name="chevronRight" size={18} /></span>}
    </button>
  );
}

function Choice<T extends number | string>({ options, value, onChange, fmt }: { options: T[]; value: T; onChange: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div className="opts">
      {options.map((o) => <button key={String(o)} className={`chip ${o === value ? 'on' : ''}`} onClick={() => onChange(o)}>{fmt(o)}</button>)}
    </div>
  );
}

export function Settings() {
  const settings = useStore((s) => s.settings);
  const premium = useStore((s) => s.premium);
  const set = (p: Partial<S>) => store.set({ settings: { ...settings, ...p } });
  const open = (page: Page) => store.set({ page });

  return (
    <div className="screen">
      <div className="pad">
        <div className="eyebrow">Settings</div>
        <h1 className="title" style={{ marginTop: 4 }}>Make it yours</h1>
      </div>

      <div className="group-label">Playback</div>
      <div className="group">
        <div className="set-block">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontWeight: 500 }}>Default volume</b><span className="muted small">{Math.round(settings.defaultVolume * 100)}%</span></div>
          <p className="dim tiny" style={{ marginBottom: 4 }}>Used each time the app opens.</p>
          <Slider value={settings.defaultVolume} onChange={(v) => { set({ defaultVolume: v }); setMasterVolume(v); }} label="Default volume" />
        </div>
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>Default sleep timer</b>
          <p className="dim tiny">Starts automatically whenever you begin playing.</p>
          <Choice options={[0, 15, 30, 45, 60, 90, 120]} value={settings.defaultTimer} onChange={(v) => set({ defaultTimer: v })} fmt={(v) => (v ? `${v} min` : 'Off')} />
        </div>
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>When the timer ends</b>
          <div className="segment" style={{ marginTop: 10 }}>
            <button className={settings.timerMode === 'fade' ? 'on' : ''} onClick={() => set({ timerMode: 'fade' })}>Fade out</button>
            <button className={settings.timerMode === 'stop' ? 'on' : ''} onClick={() => set({ timerMode: 'stop' })}>Stop</button>
          </div>
        </div>
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>Fade-out length</b>
          <p className="dim tiny">How gradually the volume lowers before stopping.</p>
          <Choice options={[1, 3, 5, 10, 15]} value={settings.fadeMinutes} onChange={(v) => set({ fadeMinutes: v })} fmt={(v) => `${v} min`} />
        </div>
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>Track length when not looping</b>
          <p className="dim tiny">Used by the “Once” and “Then next” repeat modes in the player.</p>
          <Choice options={[5, 10, 20, 30, 60]} value={settings.trackMinutes} onChange={(v) => set({ trackMinutes: v })} fmt={(v) => `${v} min`} />
        </div>
      </div>

      <div className="group-label">Display</div>
      <div className="group">
        <div className="set-row" style={{ cursor: 'default' }}>
          <span className="ic"><Icon name="sparkles" size={18} /></span>
          <span className="tx"><b>Night-sky animation</b><span>Twinkling stars on the home screen</span></span>
          <Toggle on={settings.animations} onChange={(v) => set({ animations: v })} label="Night-sky animation" />
        </div>
        <div className="set-row" style={{ cursor: 'default' }}>
          <span className="ic"><Icon name="moon" size={18} /></span>
          <span className="tx"><b>Breathing animation</b><span>Slow pulse in the player and sleep screen</span></span>
          <Toggle on={settings.breathing} onChange={(v) => set({ breathing: v })} label="Breathing animation" />
        </div>
        <Row icon="refresh" title="Replay the introduction" onClick={() => store.set({ onboarded: false })} />
      </div>

      <div className="group-label">Help</div>
      <div className="group">
        <Row icon="moon" title="Background playback" sub="Keep sounds playing with the screen off" onClick={() => open('background')} />
        <Row icon="crown" title="Fusion Sleep Premium" sub={premium ? 'Active' : 'See what is included'} onClick={() => store.set({ sheet: 'premium', premiumFocus: null })} />
      </div>

      <div className="group-label">Your data</div>
      <div className="group">
        <Row icon="history" title="Clear recently played" sub="Removes your listening history" onClick={() => confirmAction({
          title: 'Clear history?', message: 'Your recently played list will be removed from this device. Favourites and mixes are kept.', confirmLabel: 'Clear', danger: true, onConfirm: clearRecent,
        })} />
        <Row icon="trash" red title="Reset all preferences" sub="Favourites, mixes, history and settings" onClick={() => confirmAction({
          title: 'Reset everything?', message: 'This deletes your favourites, saved mixes, history and settings from this device. This cannot be undone.', confirmLabel: 'Reset', danger: true,
          onConfirm: async () => { await stop(); clearPersisted(); store.reset(); setMasterVolume(store.get().masterVolume); toast('All preferences were reset', 'success'); },
        })} />
      </div>

      <div className="group-label">About</div>
      <div className="group">
        <Row icon="shield" title="Privacy policy" onClick={() => open('privacy')} />
        <Row icon="file" title="Terms and conditions" onClick={() => open('terms')} />
        <Row icon="info" title="About Fusion Sleep" onClick={() => open('about')} />
        <Row icon="info" title="Version" value={APP_VERSION} />
      </div>

      <div className="footer-brand">
        <div style={{ display: 'inline-block', opacity: 0.85 }}><Logo size={30} /></div>
        <div style={{ marginTop: 6 }}>Powered by <b>Fusion Labs</b></div>
      </div>
    </div>
  );
}
