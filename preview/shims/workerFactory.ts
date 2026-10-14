// Preview build only: the worker is pre-bundled and injected as a string.
declare const __SYNTH_WORKER_SRC__: string;
export function createSynthWorker(): Worker | null {
  try {
    const blob = new Blob([__SYNTH_WORKER_SRC__], { type: 'text/javascript' });
    return new Worker(URL.createObjectURL(blob));
  } catch {
    return null;
  }
}
