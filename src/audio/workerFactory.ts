// Vite bundles the worker automatically from this URL pattern.
export function createSynthWorker(): Worker | null {
  try {
    return new Worker(new URL('./synth.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return null; // fall back to rendering on the main thread
  }
}
