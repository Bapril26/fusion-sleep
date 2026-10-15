import { useEffect } from 'react';
import { store, useStore } from './state/store';
import { initPlayer } from './state/player';
import { initStories } from './state/stories';
import { cancelGeneration, isGenerating } from './state/generate';
import { onBackButton } from './native/platform';
import { Home } from './screens/Home';
import { SleepSounds } from './screens/SleepSounds';
import { Stories } from './screens/Stories';
import { Favourites } from './screens/Favourites';
import { Settings } from './screens/Settings';
import { StoryPlayer } from './screens/StoryPlayer';
import { CreateStory } from './screens/CreateStory';
import { SleepScreen, Onboarding, InfoPage } from './screens/Overlays';
import { MiniPlayer, TabBar, Toast, ConfirmDialog } from './components/Chrome';
import { Sheets } from './components/Sheets';

export function App() {
  const tab = useStore((s) => s.tab);
  const animations = useStore((s) => s.settings.animations);

  useEffect(() => {
    initPlayer();
    initStories();
    // Android back button: close the top-most layer first, then go Home, then minimise.
    onBackButton(() => {
      const s = store.get();
      if (s.confirm) { store.set({ confirm: null }); return true; }
      if (s.sheet) { store.set({ sheet: null }); return true; }
      if (s.sleepScreen) { store.set({ sleepScreen: false }); return true; }
      if (s.page) { if (s.page === 'createStory' && isGenerating()) cancelGeneration(); store.set({ page: null }); return true; }
      if (s.tab === 'sounds' && s.soundsView === 'mixer') { store.set({ soundsView: 'library' }); return true; }
      if (s.tab !== 'home') { store.set({ tab: 'home' }); return true; }
      return false;
    });
  }, []);

  return (
    <div className={`app ${animations ? '' : 'calm'}`}>
      {tab === 'home' && <Home />}
      {tab === 'sounds' && <SleepSounds />}
      {tab === 'stories' && <Stories />}
      {tab === 'favourites' && <Favourites />}
      {tab === 'settings' && <Settings />}
      <MiniPlayer />
      <TabBar />
      <InfoPage />
      <StoryPlayer />
      <CreateStory />
      <Sheets />
      <SleepScreen />
      <Onboarding />
      <ConfirmDialog />
      <Toast />
    </div>
  );
}
