/**
 * Fusion Sleep sound catalogue.
 *
 * Every sound is played from ONE of two sources:
 *   1. `src`    – a real audio file in /public/sounds (mp3, ogg, m4a or wav).
 *   2. `recipe` – an original sound generated on the device by the
 *                 Fusion Sound Engine (src/audio/synth.ts). No licence needed.
 *
 * To replace a generated sound with a recorded file, drop the file into
 * public/sounds/ and set `src: 'sounds/<file>'` on the entry. If the file is
 * missing or can't be decoded, the app shows a clear "audio unavailable"
 * message instead of pretending to play.
 *
 * To add a new sound, add an entry here. To add a new category, add it to
 * CATEGORIES and use its id.
 */

export type CategoryId = 'rain' | 'thunder' | 'nature' | 'relax' | 'noise';

export type IconName =
  | 'rain' | 'rainHeavy' | 'home' | 'window' | 'tree' | 'tent' | 'palm'
  | 'storm' | 'waves' | 'stream' | 'wind' | 'bird' | 'cricket' | 'frog'
  | 'music' | 'bowl' | 'moon' | 'sparkles' | 'noise' | 'fan' | 'snow' | 'flame';

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  icon: IconName;
  hue: number; // tint used for artwork (kept in the blue family)
  blurb: string;
}

export interface Sound {
  id: string;
  name: string;
  category: CategoryId;
  icon: IconName;
  description: string;
  /** Generated sound recipe id (src/audio/synth.ts) */
  recipe?: string;
  /** Optional real audio file, relative to /public. Takes priority over recipe. */
  src?: string;
  /** Premium-only in the free version (a 30-second preview is always allowed). */
  premium?: boolean;
  tags?: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'rain', name: 'Rain Sounds', short: 'Rain', icon: 'rain', hue: 212, blurb: 'Soft, steady rainfall for deep sleep' },
  { id: 'thunder', name: 'Thunderstorms', short: 'Thunder', icon: 'storm', hue: 232, blurb: 'Rolling thunder and cosy storms' },
  { id: 'nature', name: 'Nature Sounds', short: 'Nature', icon: 'tree', hue: 196, blurb: 'Ocean, rivers, forests and night life' },
  { id: 'relax', name: 'Relaxation', short: 'Relax', icon: 'sparkles', hue: 222, blurb: 'Ambient music and calming tones' },
  { id: 'noise', name: 'White Noise', short: 'White noise', icon: 'noise', hue: 205, blurb: 'Steady noise to mask distractions' },
];

export const SOUNDS: Sound[] = [
  // Rain
  { id: 'rain-gentle', name: 'Gentle Rainfall', category: 'rain', icon: 'rain', recipe: 'rainGentle', description: 'Light, even rain with soft drops.', tags: ['calm', 'light'] },
  { id: 'rain-heavy', name: 'Heavy Rainfall', category: 'rain', icon: 'rainHeavy', recipe: 'rainHeavy', description: 'A full, powerful downpour.', tags: ['strong', 'masking'] },
  { id: 'rain-roof', name: 'Rain on a Roof', category: 'rain', icon: 'home', recipe: 'rainRoof', description: 'Drops drumming on a tin roof.', tags: ['cosy', 'home'] },
  { id: 'rain-window', name: 'Rain Against a Window', category: 'rain', icon: 'window', recipe: 'rainWindow', description: 'Taps and trickles on the glass.', tags: ['cosy', 'home'] },
  { id: 'rain-forest', name: 'Rain in a Forest', category: 'rain', icon: 'tree', recipe: 'rainForest', description: 'Rain falling through the leaves.', tags: ['nature'] },
  { id: 'rain-tent', name: 'Rain on a Tent', category: 'rain', icon: 'tent', recipe: 'rainTent', description: 'Pattering on canvas while camping.', premium: true, tags: ['camping', 'cosy'] },
  { id: 'rain-tropical', name: 'Tropical Rainfall', category: 'rain', icon: 'palm', recipe: 'rainTropical', description: 'Warm, dense tropical rain.', premium: true, tags: ['strong'] },

  // Thunder
  { id: 'thunder-distant', name: 'Distant Thunder', category: 'thunder', icon: 'storm', recipe: 'thunderDistant', description: 'Far-off rumbles over light rain.', tags: ['calm'] },
  { id: 'thunder-gentle', name: 'Gentle Thunderstorm', category: 'thunder', icon: 'storm', recipe: 'thunderGentle', description: 'A soft storm with mellow thunder.' },
  { id: 'thunder-heavy', name: 'Heavy Thunderstorm', category: 'thunder', icon: 'storm', recipe: 'thunderHeavy', description: 'Pouring rain and close thunder.', tags: ['strong'] },
  { id: 'thunder-rolling', name: 'Rain & Rolling Thunder', category: 'thunder', icon: 'rainHeavy', recipe: 'thunderRolling', description: 'Long, rolling thunder through steady rain.' },
  { id: 'thunder-night', name: 'Night-time Thunderstorm', category: 'thunder', icon: 'moon', recipe: 'thunderNight', description: 'A storm passing on a warm night.', premium: true },

  // Nature
  { id: 'ocean-waves', name: 'Ocean Waves', category: 'nature', icon: 'waves', recipe: 'ocean', description: 'Slow waves washing onto the shore.', tags: ['water', 'calm'] },
  { id: 'stream', name: 'Gentle Flowing Stream', category: 'nature', icon: 'stream', recipe: 'stream', description: 'A bubbling, shallow stream.', tags: ['water'] },
  { id: 'river', name: 'River Sounds', category: 'nature', icon: 'waves', recipe: 'river', description: 'A deep, steady river current.', premium: true, tags: ['water'] },
  { id: 'forest', name: 'Forest Ambience', category: 'nature', icon: 'tree', recipe: 'forest', description: 'A quiet forest with distant birds.' },
  { id: 'wind-trees', name: 'Wind Through Trees', category: 'nature', icon: 'wind', recipe: 'windTrees', description: 'Gusts moving through the branches.' },
  { id: 'wind-gentle', name: 'Gentle Wind', category: 'nature', icon: 'wind', recipe: 'windGentle', description: 'A soft, low breeze.', tags: ['calm'] },
  { id: 'birds', name: 'Birds Singing', category: 'nature', icon: 'bird', recipe: 'birds', description: 'Morning birdsong in a meadow.', tags: ['morning'] },
  { id: 'crickets', name: 'Night-time Crickets', category: 'nature', icon: 'cricket', recipe: 'crickets', description: 'A summer night full of crickets.', tags: ['night'] },
  { id: 'frogs', name: 'Frogs at Night', category: 'nature', icon: 'frog', recipe: 'frogs', description: 'Frogs calling by the water.', premium: true, tags: ['night'] },
  { id: 'campfire', name: 'Campfire Under the Stars', category: 'nature', icon: 'flame', recipe: 'campfire', description: 'A crackling fire on a still night.', premium: true, tags: ['cosy', 'night'] },

  // Relaxation
  { id: 'ambient-music', name: 'Soft Ambient Sleep Music', category: 'relax', icon: 'music', recipe: 'ambientMusic', description: 'Slow, warm chords with soft bells.', tags: ['music'] },
  { id: 'calming-tones', name: 'Gentle Calming Tones', category: 'relax', icon: 'bowl', recipe: 'calmingTones', description: 'Singing-bowl tones that fade slowly.', tags: ['meditation'] },
  { id: 'night-ambience', name: 'Peaceful Night Ambience', category: 'relax', icon: 'moon', recipe: 'nightAmbience', description: 'A still night with crickets and a far-off owl.', tags: ['night'] },
  { id: 'deep-relax', name: 'Deep Relaxation Soundscape', category: 'relax', icon: 'sparkles', recipe: 'deepRelax', description: 'A deep, slowly breathing drone.', premium: true, tags: ['meditation'] },

  // White noise
  { id: 'white-noise', name: 'White Noise', category: 'noise', icon: 'noise', recipe: 'white', description: 'Bright, even noise across all frequencies.', tags: ['masking', 'focus'] },
  { id: 'pink-noise', name: 'Pink Noise', category: 'noise', icon: 'noise', recipe: 'pink', description: 'Softer, balanced noise — like steady rain.', tags: ['masking', 'focus'] },
  { id: 'brown-noise', name: 'Brown Noise', category: 'noise', icon: 'noise', recipe: 'brown', description: 'Deep, rumbling noise — like a distant waterfall.', tags: ['masking', 'focus'] },
  { id: 'fan', name: 'Fan Noise', category: 'noise', icon: 'fan', recipe: 'fan', description: 'A bedroom fan on a low setting.', tags: ['home'] },
  { id: 'air-con', name: 'Air Conditioner Ambience', category: 'noise', icon: 'snow', recipe: 'aircon', description: 'The steady hum of an air conditioner.', premium: true, tags: ['home'] },
];

export const soundById = (id: string) => SOUNDS.find((s) => s.id === id);
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

/** Curated "Popular for Tonight" picks (free sounds first). */
export const POPULAR_TONIGHT = ['rain-gentle', 'ocean-waves', 'thunder-distant', 'brown-noise', 'crickets', 'ambient-music', 'rain-roof', 'wind-gentle'];
