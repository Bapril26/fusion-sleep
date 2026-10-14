/// <reference lib="webworker" />
// Renders generated sounds off the main thread so the interface never freezes.
import { renderRecipe } from './synth';

self.onmessage = (e: MessageEvent<{ id: number; recipe: string }>) => {
  const { id, recipe } = e.data;
  try {
    const r = renderRecipe(recipe);
    (self as unknown as Worker).postMessage({ id, ok: true, ...r }, [r.left.buffer, r.right.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: String(err) });
  }
};
