// Builds a single self-contained HTML file for previewing the app in a browser.
// (The real app is built with Vite: `npm run build`.)
import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'preview', 'out');
mkdirSync(out, { recursive: true });

const worker = await build({
  entryPoints: [path.join(root, 'src/audio/synth.worker.ts')],
  bundle: true, write: false, format: 'iife', minify: true, target: 'es2020',
});
const workerSrc = worker.outputFiles[0].text;

const shim = (p) => path.join(root, 'preview/shims', p);
const app = await build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true, write: false, outdir: out, format: 'iife', minify: true, target: 'es2020',
  jsx: 'automatic', loader: { '.woff': 'dataurl' },
  define: { __SYNTH_WORKER_SRC__: JSON.stringify(workerSrc), 'process.env.NODE_ENV': '"production"', 'import.meta.env': JSON.stringify({ VITE_TEST_BUILD: 'true', VITE_STORY_API_URL: process.env.VITE_STORY_API_URL ?? '' }) },
  nodePaths: [path.join(root, 'node_modules')],
  plugins: [{
    name: 'shims',
    setup(b) {
      b.onResolve({ filter: /^@capacitor\/core$/ }, () => ({ path: shim('capacitor-core.ts') }));
      b.onResolve({ filter: /^@capacitor\/app$/ }, () => ({ path: shim('capacitor-app.ts') }));
      b.onResolve({ filter: /\/workerFactory$/ }, () => ({ path: shim('workerFactory.ts') }));
    },
  }],
});
const js = app.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = app.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
let html = readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '')
  .replace('</head>', `<style>${css}</style></head>`)
  .replace('</body>', `<script>${js.replace(/<\/script/g, '<\\/script')}</script></body>`);
writeFileSync(path.join(out, 'index.html'), html);
console.log('preview built', (html.length / 1024).toFixed(0) + ' KB');
