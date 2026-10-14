import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'za.co.fusionlabs.sleep',
  appName: 'Fusion Sleep',
  webDir: 'dist',
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
  },
};

export default config;
