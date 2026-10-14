import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works inside the Capacitor Android WebView.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
