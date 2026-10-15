/**
 * Kids Mode: only children's stories are shown, personalised (AI) stories and
 * upgrade screens are hidden, and a grown-up check is needed to switch it off.
 */
import { store, toast } from './store';
import { getStory, stopStory } from './stories';
import { isKids } from '../data/stories';

const s = () => store.get();

export const kidsModeOn = () => s().kidsMode;

export async function enableKidsMode() {
  const st = s().story;
  if (st) { const story = getStory(st.id); if (story && !isKids(story)) await stopStory(true); }
  store.set((x) => ({
    kidsMode: true, storyAudience: 'kids', storyFilter: 'all', storySearch: '',
    page: x.page === 'storyPlayer' && x.viewStoryId && getStory(x.viewStoryId)?.audience !== 'kids' ? null : x.page === 'createStory' ? null : x.page,
    tab: x.tab === 'settings' ? 'home' : x.tab,
  }));
  toast('Kids Mode is on. Only children’s stories are shown.', 'success', 4500);
}

/** Simple grown-up check (multiplication), as used by many children's apps. */
export function newGateQuestion() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 4 + Math.floor(Math.random() * 6);
  return { text: `${a} × ${b}`, answer: a * b };
}

export function disableKidsMode() {
  store.set({ kidsMode: false, sheet: null });
  toast('Kids Mode is off', 'success');
}
