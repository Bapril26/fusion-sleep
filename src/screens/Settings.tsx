import type { ReactNode } from 'react';
import { store, useStore, confirmAction, clearPersisted, toast, type Settings as S, type Page } from '../state/store';
import { clearRecent, stopEverything, setMasterVolume, setProTest } from '../state/player';
import { clearStoryHistory, setNarratorPrefs } from '../state/stories';
import { storyServerConfigured } from '../config/storyServer';
import { TEST_BUILD, PLAN_NAME } from '../billing/plans';
import { soundById } from '../data/sounds';
import { BrandFooter } from '../components/BrandFooter';
import { Icon } from '../components/Icon';
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
  const proTest = useStore((s) => s.proTest);
  const narratorPrefs = useStore((s) => s.narrator);
  const bg = useStore((s) => s.storyBackground);
  const narration = useStore((s) => s.narrationAvailable);
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

      <div className="group-label">Bedtime stories</div>
      <div className="group">
        <Row icon="mic" title="Narrator voice" sub={narration === false ? 'No voice engine found on this phone' : narratorPrefs.voiceId ? 'Custom voice selected' : 'Phone default voice'} onClick={() => store.set({ sheet: 'voice' })} />
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>Reading speed</b>
          <Choice options={[0.75, 0.85, 0.9, 1]} value={narratorPrefs.rate} onChange={(v) => setNarratorPrefs({ rate: v })} fmt={(v) => ({ 0.75: 'Very slow', 0.85: 'Slow', 0.9: 'Relaxed', 1: 'Normal' } as Record<number, string>)[v]} />
        </div>
        <div className="set-block">
          <b style={{ fontWeight: 500 }}>Default background sound</b>
          <p className="dim tiny">Plays softly under a story if nothing else is playing.</p>
          <Choice options={['', 'rain-gentle', 'ocean-waves', 'crickets', 'brown-noise']} value={bg.soundId ?? ''} onChange={(v) => store.set({ storyBackground: { ...bg, soundId: v || null } })} fmt={(v) => (v ? soundById(v)?.name ?? v : 'None')} />
        </div>
        <Row icon="sparkles" title="Personalised stories" sub={storyServerConfigured() ? 'Connected · needs internet' : 'Not set up in this version'} onClick={() => store.set({ page: 'createStory' })} />
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
        <Row icon="crown" title={PLAN_NAME} sub={premium ? (proTest ? 'Unlocked for testing' : 'Active') : 'See what is included'} onClick={() => store.set({ sheet: 'premium', premiumFocus: null })} />
      </div>

      <div className="group-label">Your data</div>
      <div className="group">
        <Row icon="history" title="Clear recently played" sub="Removes your listening history and story positions" onClick={() => confirmAction({
          title: 'Clear history?', message: 'Recently played sounds and stories, and where you stopped in each story, will be removed from this device. Favourites, mixes and your own stories are kept.', confirmLabel: 'Clear', danger: true, onConfirm: () => { clearStoryHistory(); clearRecent(); },
        })} />
        <Row icon="trash" red title="Reset all preferences" sub="Favourites, mixes, history and settings" onClick={() => confirmAction({
          title: 'Reset everything?', message: 'This deletes your favourites, saved mixes, your own stories, history, narrator choice and settings from this device. This cannot be undone.', confirmLabel: 'Reset', danger: true,
          onConfirm: async () => { await stopEverything(); clearPersisted(); store.reset(); setMasterVolume(store.get().masterVolume); toast('All preferences were reset', 'success'); },
        })} />
      </div>

      <div className="group-label">About</div>
      <div className="group">
        <Row icon="shield" title="Privacy policy" onClick={() => open('privacy')} />
        <Row icon="file" title="Terms and conditions" onClick={() => open('terms')} />
        <Row icon="info" title="About Fusion Sleep" onClick={() => open('about')} />
        <Row icon="info" title="Version" value={APP_VERSION} />
      </div>

      {TEST_BUILD && (
        <>
          <div className="group-label">Tester tools</div>
          <div className="group">
            <div className="set-row" style={{ cursor: 'default' }}>
              <span className="ic"><Icon name="crown" size={18} /></span>
              <span className="tx"><b>Unlock Pro for testing</b><span>Test build only. No payment. Hidden in the Play Store version.</span></span>
              <Toggle on={proTest} onChange={setProTest} label="Unlock Pro for testing" />
            </div>
          </div>
        </>
      )}

      <BrandFooter />
    </div>
  );
}
