import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'za.co.fusionlabs.sleep',
  appName: 'Fusion Sleep',
  webDir: 'dist',
  backgroundColor: '#05070B',
  android: {
    backgroundColor: '#05070B',
    allowMixedContent: false,
  },
  plugins: {
    // Android 15+ draws edge-to-edge. 'native' pads the app on older WebViews and
    // lets newer ones use env(safe-area-inset-*), which the CSS already respects.
    SystemBars: {
      insetsHandling: 'native',
      style: 'DARK',
    },
  },
};

export default config;
