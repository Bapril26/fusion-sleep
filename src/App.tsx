import { useEffect } from 'react';
import { store, useStore } from './state/store';
import { initPlayer } from './state/player';
import { onBackButton } from './native/platform';
import { Home } from './screens/Home';
import { Library } from './screens/Library';
import { Mixer } from './screens/Mixer';
import { Settings } from './screens/Settings';
import { SleepScreen, Onboarding, InfoPage } from './screens/Overlays';
import { MiniPlayer, TabBar, Toast, ConfirmDialog } from './components/Chrome';
import { Sheets } from './components/Sheets';

export function App() {
  const tab = useStore((s) => s.tab);
  const animations = useStore((s) => s.settings.animations);

  useEffect(() => {
    initPlayer();
    onBackButton(() => {
      const s = store.get();
      if (s.confirm) { store.set({ confirm: null }); return true; }
      if (s.page) { store.set({ page: null }); return true; }
      if (s.sheet) { store.set({ sheet: null }); return true; }
      if (s.sleepScreen) { store.set({ sleepScreen: false }); return true; }
      if (s.tab !== 'home') { store.set({ tab: 'home' }); return true; }
      return false;
    });
  }, []);

  return (
    <div className={`app ${animations ? '' : 'calm'}`}>
      {tab === 'home' && <Home />}
      {tab === 'library' && <Library />}
      {tab === 'mixer' && <Mixer />}
      {tab === 'settings' && <Settings />}
      <MiniPlayer />
      <TabBar />
      <Sheets />
      <InfoPage />
      <SleepScreen />
      <Onboarding />
      <ConfirmDialog />
      <Toast />
    </div>
  );
}
