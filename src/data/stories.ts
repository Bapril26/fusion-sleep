/**
 * Fusion Sleep — Bedtime Stories for adults.
 *
 * Every story here is original writing by Fusion Labs. Cover artwork is drawn
 * in code (src/components/StoryCover.tsx), so there are no third-party images.
 *
 * To add a story: add an entry to STORIES. Paragraphs are separated by a
 * blank line in `text`. Duration is estimated automatically from word count.
 */

import { KIDS_CATEGORIES, KIDS_STORIES } from './kidsStories';

export type StoryCategoryId = 'romantic' | 'peaceful' | 'dream' | 'mystery' | 'kidsAnimals' | 'kidsAdventure' | 'kidsCosy';
export type Audience = 'adult' | 'kids';
export type CoverMotif = 'sea' | 'books' | 'lighthouse' | 'cabin' | 'train' | 'village' | 'shore' | 'island' | 'balloon' | 'garden' | 'hotel' | 'lamp' | 'custom';

export interface StoryCategory {
  id: StoryCategoryId;
  name: string;
  short: string;
  blurb: string;
  icon: string;
}

export interface Story {
  id: string;
  title: string;
  category: StoryCategoryId;
  description: string;
  setting: string;
  mood: string;
  motif: CoverMotif;
  text: string;
  /** 'kids' for children's stories; adult stories leave this empty */
  audience?: Audience;
  /** true for stories written by AI on request */
  generated?: boolean;
  createdAt?: number;
  /** preferred narrator voice id chosen when it was created */
  voiceId?: string | null;
  /** part of Fusion Sleep Pro */
  premium?: boolean;
  /** identifies the request that produced a generated story (avoids paying twice) */
  requestKey?: string;
}

export const STORY_CATEGORIES: StoryCategory[] = [
  { id: 'romantic', name: 'Romantic Bedtime Stories', short: 'Romantic', blurb: 'Gentle love stories with comforting endings', icon: 'heart' },
  { id: 'peaceful', name: 'Peaceful Sleep Stories', short: 'Peaceful', blurb: 'Slow journeys, cosy rooms and quiet places', icon: 'moon' },
  { id: 'dream', name: 'Dream Escapes', short: 'Dream escapes', blurb: 'Imaginary islands and calm night adventures', icon: 'sparkles' },
  { id: 'mystery', name: 'Gentle Mystery', short: 'Gentle mystery', blurb: 'Unhurried puzzles with reassuring endings', icon: 'lamp' },
];

export const storyCategoryById = (id: StoryCategoryId) => STORY_CATEGORIES.find((c) => c.id === id) ?? KIDS_CATEGORIES.find((c) => c.id === id) ?? STORY_CATEGORIES[1];
export const isKids = (story: Story) => story.audience === 'kids';

export const paragraphsOf = (story: Story) => story.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const wordCount = (story: Story) => story.text.split(/\s+/).filter(Boolean).length;
/** Slow bedtime narration is about 130 words per minute. */
export const estimateMinutes = (story: Story) => Math.max(1, Math.round(wordCount(story) / 130));

const t = (s: string) => s.trim().replace(/^[ \t]+/gm, '');

export const STORIES: Story[] = [
  // ───────────────────────── Romantic ─────────────────────────
  {
    id: 'paternoster-evening',
    title: 'An Evening in Paternoster',
    category: 'romantic',
    description: 'A long-married couple spend a slow, golden evening in a West Coast fishing village.',
    setting: 'Seaside village', mood: 'Warm', motif: 'sea',
    text: t(`
      The road to Paternoster runs out of the wheat fields and down towards the sea, and by the time Anna and Daniel arrived the afternoon had turned the colour of honey. They left the car beside a whitewashed cottage with blue shutters, and for a moment neither of them moved. They simply sat with the windows down, listening to the sea breathing somewhere beyond the dunes.

      They had been married for twenty-three years. They had learned each other the way you learn a favourite walk: where the path dips, where the view opens, where it is best to slow down. This weekend had been Daniel's idea. No phones after six, he had said. No lists. Just the two of us and the tide.

      The cottage smelled of salt and clean linen. Anna opened the back door and the wind came in carrying the sound of gulls and the low clink of fishing boats pulled up on the sand. Daniel carried their small bag to the bedroom and came back with two jerseys, because the West Coast evenings turn cool quickly, and he remembered that she always forgot.

      They walked down to the beach barefoot. The sand was still warm from the day, and further down, where the water had just left it, it was smooth and dark and cool. The colourful bakkies of the fishermen rested in a row, their paint faded to soft pinks and greens. An old man was mending a net, his hands moving in the same patient rhythm over and over. He nodded to them, and they nodded back, and nobody needed to say anything at all.

      Anna slipped her hand into Daniel's. His palm was rough from the garden at home, from years of fixing gates and planting lemon trees. She thought about the first time she had held that hand, at a crowded party in a student flat, when he had asked her to dance to a song neither of them liked. They had laughed through the whole thing. She smiled now, remembering.

      They walked until the village was small behind them. The sun lowered itself towards the sea, slowly, as if it too did not want the day to end. The sky went from gold to apricot to a deep, gentle rose. Little waves arrived one after another, folded themselves over, and slid back with a sound like a long, slow exhale.

      Daniel spread a blanket on the sand. From his jersey pocket he took a small paper parcel, and inside were two pieces of fudge from the farm stall they had passed on the road. He had bought them while she was looking at the jam. Anna laughed softly and leaned her head on his shoulder. The fudge was soft and sweet and tasted faintly of vanilla.

      They watched the sun touch the water. For a moment the whole sea seemed lit from underneath. Then the light began to fade, gently, the way a room fades when someone dims the lamp before sleep. The first star appeared low in the east, small and bright. Then another. Then, quite suddenly, there were many.

      Walking back, they could see the village lights coming on one by one: a kitchen window, a porch lamp, the warm glow of the little restaurant on the corner. They ate there, at a wooden table near the window, a simple supper of fresh fish and bread still warm from the oven. The owner brought them rooibos tea afterwards without being asked.

      Later, in the cottage, the curtains moved softly in the sea air. Anna lay listening to the waves, which sounded closer now in the dark. Daniel's breathing slowed beside her, deep and even. She matched her breath to his, in and out, in and out, the way the tide comes and goes.

      She thought that love, after many years, was not so different from the sea. It did not need to rush or to prove anything. It simply returned, again and again, faithful and unhurried.

      Outside, the waves kept their quiet rhythm. The stars turned slowly over the village. And in the little whitewashed cottage with the blue shutters, two people who knew each other very well drifted, together, into a deep and peaceful sleep.
    `),
  },
  {
    id: 'bookshop-long-street',
    title: 'The Bookshop on Long Street',
    category: 'romantic',
    description: 'Two strangers keep reaching for the same books, one rainy winter, until they finally share a cup of tea.',
    setting: 'City bookshop', mood: 'Hopeful', motif: 'books',
    text: t(`
      It began to rain on a Tuesday in June, the soft, steady winter rain that makes the whole city smell of wet stone and coffee. Thandi ducked into the secondhand bookshop on Long Street without really meaning to. She shook the drops from her coat, and the bell above the door gave a small, friendly ring.

      The shop was narrow and deep, with shelves that went all the way to the ceiling and a ladder on little brass wheels. It smelled of paper and old leather and, faintly, of the lavender the owner kept in a jar by the till. Somewhere in the back a radio was playing quiet piano music.

      Thandi wandered to the poetry section. She ran her finger along the spines until she found a small blue volume of sea poems. As she reached for it, another hand reached for it too. Their fingers touched on the cover. She looked up, and a man in a grey jersey looked down at her, and they both said sorry at exactly the same time.

      He had kind eyes and a little ink stain on his thumb. You take it, he said. No, you were first, she said. In the end the owner, an elderly woman named Mrs Pillay, settled it by saying that the book would wait on the counter for whoever came back first on Saturday. They both laughed, and the man said his name was Sipho, and then he said goodbye and went out into the rain.

      On Saturday it was raining again. Thandi arrived at ten exactly, feeling a little foolish. Sipho was already there, sitting in the old armchair by the window, holding two paper cups of tea. He held one out to her. I thought, he said, that whoever lost should at least get tea. Thandi took the cup and sat on the wooden step beside him, and they read the sea poems out loud to each other, one each, while the rain ran down the glass.

      It became a habit, the way the best things often do. Every Saturday that winter they met at the bookshop. They never planned it. They simply arrived. Sipho was a teacher who repaired old clocks on weekends. Thandi drew maps for a living, beautiful hand-drawn maps of hiking trails and wine farms. She told him about the mountains she had walked. He told her about the clocks, how each one had its own heartbeat, and how he could tell which ones had been loved by the way they had been wound.

      Mrs Pillay pretended not to notice them, but she began leaving a little plate of biscuits on the shelf near the armchair. And sometimes, when they were both reaching for the same book again, she would hum quietly to herself and smile at the till.

      In August the rain grew lighter. One afternoon Sipho arrived with something wrapped in brown paper. It was the blue book of sea poems. Inside, on the first page, he had written in his careful, slanted handwriting: For Thandi, who was first. Would you like to see the sea with me?

      They went on a clear Sunday, to a quiet beach where the water was cold and very blue. They walked along the edge of the waves with their shoes in their hands, talking about nothing important and everything that mattered. When the wind blew her hair across her face, he gently tucked it behind her ear, and she let him.

      Years later, people would ask them how they met, and they would look at each other and smile. In a bookshop, they would say. On a rainy Tuesday. We both reached for the same book.

      The blue book still sits on their bedside table. On rainy nights they sometimes read from it, one poem each, while the rain taps on the roof. And when the reading is done, they turn off the lamp and listen to the rain together, warm and unhurried, until sleep arrives as softly as that first winter afternoon.
    `),
  },
  {
    id: 'lighthouse-letters',
    premium: true,
    title: 'Letters from the Lighthouse',
    category: 'romantic',
    description: 'A woman finds the courage to answer a letter she has kept for ten years.',
    setting: 'Coastal lighthouse', mood: 'Tender', motif: 'lighthouse',
    text: t(`
      Clara kept the letter in a tin box on the top shelf of her wardrobe, beneath a folded scarf she never wore. She did not take it out often. Perhaps once a year, in late autumn, when the evenings grew long and the wind started to rattle the window frames. Then she would sit on the edge of her bed and read it slowly, the way you might sit beside an old friend.

      The letter was from Samuel. Ten years ago he had taken a job as the keeper of a small lighthouse on a rocky point far up the coast. Before he left, he had asked her to come with him. She had been afraid. Her life was in the city then, full and busy and certain. She said no, gently, and he had understood. A month later the letter arrived.

      It was not a sad letter. That was the thing about it. It described the lighthouse: the spiral stairs, one hundred and twelve of them, the round room at the top where the great lamp turned, the way the beam swept across the dark water every ten seconds, steady as a heartbeat. He wrote about the seals on the rocks, and the cormorants drying their wings, and the bread he had learned to bake in a temperamental old oven.

      And at the end he had written: The light is on every night. If you ever want to find me, just follow it.

      This autumn, Clara read the letter and did something she had never done before. She took out a sheet of paper and began to write back.

      She told him about the ten years. About the job she had loved and then outgrown. About her mother's garden, which she now looked after. About learning to swim properly at forty, in the cold, clear water of the tidal pool, and how brave it had made her feel. She wrote for a long time. When she finished, it was nearly midnight, and she felt lighter than she had in years.

      She posted it the next morning before she could change her mind.

      Two weeks passed. The wind grew colder. Clara tried not to watch the post box. Then, on a grey Thursday, an envelope arrived with handwriting she recognised at once. Inside was a single page.

      Clara, he had written. The light is still on.

      She went the following weekend. The drive up the coast took most of the day. The road narrowed and the towns grew smaller and the sea grew wider, until it was the only thing to look at. By the time she reached the point, the sun was setting behind thin clouds, and the whole sky was soft and pearly.

      The lighthouse stood at the end of a gravel path, white and tall and calm. As she walked towards it, the great lamp at the top came to life, and its beam swept slowly out over the water. Once. Twice. Every ten seconds, just as he had written.

      Samuel was waiting at the door. His hair had a little grey in it now, and there were new lines around his eyes, the kind that come from smiling into the wind. Neither of them spoke at first. Then he said, You followed the light. And she said, It took me a while. And he said, That's all right. It was always going to be here.

      He made tea in the small round kitchen at the bottom of the tower. They climbed the one hundred and twelve stairs together, slowly, stopping to rest on the landings where little windows looked out to sea. At the top, the lamp turned with a soft mechanical hum, and the beam reached out across the darkening water, and they stood side by side and watched it.

      They talked late into the night, about everything and nothing, the way people do when there is no hurry left. Below them the waves came in and out against the rocks. Above them the beam turned and turned, patient and faithful.

      When Clara finally slept, in the small room with the round window, the light passed over the ceiling every ten seconds, gentle as a hand on a shoulder. She counted the sweeps, one, and two, and three, and somewhere before ten she was fast asleep, warm and safe, as if she had come home.
    `),
  },

  // ───────────────────────── Peaceful ─────────────────────────
  {
    id: 'rain-cabin',
    title: 'Rain on the Cabin Roof',
    category: 'peaceful',
    description: 'A quiet evening alone in a mountain cabin while soft rain settles in for the night.',
    setting: 'Mountain cabin', mood: 'Cosy', motif: 'cabin',
    text: t(`
      The cabin sits at the end of a gravel track, high in the mountains, where the pine trees grow close together and the air smells green. You arrived just before dark, with a bag of groceries and a box of matches, and the key was under the flowerpot exactly where the note said it would be.

      Inside, the cabin is simple and warm. There is a wooden table with two chairs, a small kitchen with a kettle, and a stone fireplace with logs already stacked beside it. At the back, under a slanting roof, there is a bed with a thick quilt, and a window that looks out into the trees.

      You light the fire first. The kindling catches with a soft crackle, and the flames rise and settle, and a gentle orange light fills the room. You hold your hands out to the warmth for a while, feeling the cold of the drive leave your fingers.

      Outside, the sky has turned a deep slate grey. The trees are very still. Then you hear it, the first few drops on the tin roof, tapping lightly, one here, one there, like someone knocking softly to ask if they may come in.

      The rain grows steadier. Before long it settles into a gentle, even rhythm, a soft drumming on the roof that fills the whole cabin. It is the kind of sound that seems to wrap around you. You notice your shoulders lowering. You notice your breath becoming slower.

      You fill the kettle and set it on the stove. While it heats, you take a jersey from your bag, an old, soft one that has been washed many times. You pull it on and feel the comfort of it, familiar and warm.

      The kettle begins to whisper and then to sing. You pour the water over a tea bag in a thick ceramic mug and watch the colour bloom slowly, amber and gold. You add a little honey. You carry the mug to the armchair beside the fire and sit down, tucking your feet up underneath you.

      Through the window you can see the rain falling through the light from the cabin, silver threads against the dark trees. Water gathers on the edge of the roof and drips steadily onto the stones below. Somewhere further away, a small stream has begun to run, and its quiet chatter joins the sound of the rain.

      There is nothing you need to do tonight. No one needs anything from you. The day is finished, and it was enough. You can let it go now, the way the trees let the rain run down their branches and into the earth.

      You sip your tea slowly. It is warm and sweet. The fire settles lower, the logs glowing red underneath, the flames small and lazy now. Every so often a log shifts with a soft sigh, sending up a few sparks that rise and vanish.

      After a while you rinse your mug and leave it upside down beside the sink. You place the guard in front of the fire. You turn off the lamp, and the room is lit only by the gentle glow of the embers.

      The bed is cool at first, and then warm. The quilt is heavy and soft, and you pull it up to your chin. Above you, just a few feet away, the rain is still falling on the roof, steady and kind. It sounds like it will go on all night.

      You listen to it. Each drop is small, and none of them is in a hurry. Together they make a sound like a long, slow lullaby. Your eyes grow heavy. Your breathing slows to match the rain.

      Somewhere in the forest, the stream keeps running. The fire glows softly. The rain taps on the roof, gentle and patient, and you drift, warm and safe, into a deep, restful sleep.
    `),
  },
  {
    id: 'night-train-north',
    title: 'The Night Train North',
    category: 'peaceful',
    description: 'A slow overnight journey in a quiet sleeper cabin, through sleeping towns and starlit plains.',
    setting: 'Luxury sleeper train', mood: 'Calm', motif: 'train',
    text: t(`
      The station is quiet when you arrive, the evening light just fading over the platform. The train waits beside it, long and dark green with polished brass handles, and warm light glowing in every window. A porter in a neat uniform checks your ticket, smiles, and shows you to your cabin.

      It is small and perfectly arranged. There is a wide bed already made with crisp white sheets and a folded wool blanket. There is a little table by the window with a reading lamp, a carafe of water and a glass. The walls are panelled in dark, polished wood, and everything smells faintly of cedar and clean cotton.

      You set your bag down and sit by the window. On the platform a guard raises a green flag. There is a soft whistle, a gentle jolt, and then the station begins to slide away, slowly, the lamps passing one by one until there are no more.

      The train gathers speed, but never very much. This is not a train that hurries. Its wheels find their rhythm on the rails, a steady, comforting sound, da-dum, da-dum, da-dum, that seems to come up through the floor and into your body.

      Outside, the city thins into suburbs and then into open country. The last of the light lies along the horizon like a pale ribbon. Fields of grass move in the evening wind. A farmhouse appears, its kitchen window glowing yellow, and then it is gone behind you.

      There is a soft knock at the door. The attendant has brought you a tray: a bowl of warm soup, some fresh bread and butter, and a small pot of chamomile tea. You thank her, and she wishes you a good night and slides the door gently closed.

      You eat slowly, watching the world go by. The soup is rich and warming. The bread is soft. The train rocks gently from side to side, as if it is rocking you.

      By the time you have finished, it is fully dark. You switch off the main light and leave only the little reading lamp, its glow soft and amber. Now you can see the stars beginning to appear over the plains, more and more of them as your eyes adjust, until the sky is scattered with silver.

      You change into your nightclothes and climb into the bed. The sheets are cool and smooth. The blanket is light but warm. You lie on your side so that you can still see through the window.

      The train passes through a small sleeping town. A single street lamp shines on an empty road. A church steeple stands dark against the stars. A dog lifts its head on a porch and then lays it down again. Then the town is behind you, and there is only the wide night once more.

      The rhythm of the wheels continues, steady and patient. Da-dum, da-dum. Da-dum, da-dum. Every so often the train crosses a small bridge and the sound changes, becomes hollow and soft for a moment, and then returns to its familiar beat.

      Far off, the moon is rising over the hills, large and pale gold. Its light spreads across the grass and turns the whole landscape silver. A river appears beside the tracks and runs alongside you for a while, holding the moon in its dark water.

      You reach over and switch off the reading lamp. Now the cabin is lit only by moonlight. The train sways gently. The wheels sing their quiet song. There is nowhere you need to be until morning, and the train will carry you there while you rest.

      Your eyes close. The rhythm of the wheels becomes the rhythm of your breathing. Slow and steady. Slow and steady. And the night train carries you north, gently, through the silver fields and the sleeping towns, all the way into a deep and peaceful sleep.
    `),
  },
  {
    id: 'sleeping-village',
    title: 'A Walk Through the Sleeping Village',
    category: 'peaceful',
    description: 'A dusk walk along a forest path into a small village settling down for the night.',
    setting: 'Forest and village', mood: 'Gentle', motif: 'village',
    text: t(`
      The path begins at the edge of the forest, just as the sun is going down. It is soft underfoot, covered in pine needles and old leaves, and it winds gently between tall, quiet trees. You walk slowly. There is no reason to walk any other way.

      The light here is green and gold. It comes through the branches in long, slanting beams, and in each beam tiny specks of dust and pollen drift and turn. The air is cool and smells of moss and resin and damp earth. Somewhere high above, a bird sings a last few notes and then falls silent.

      You come to a small wooden bridge over a stream. You stop in the middle and lean on the rail. Below you the water runs clear over smooth brown stones, and the sound of it is soft and continuous, like someone humming. A leaf floats past, turning slowly, and you watch it until it disappears around a bend.

      You walk on. The trees begin to thin, and the path widens and becomes a lane. Ahead, in a little valley, lies the village. From here you can see its roofs, tiled in red and brown, and thin ribbons of smoke rising straight up from the chimneys into the still evening air.

      The lane passes an orchard. The apple trees are old and twisted, and a few late apples still hang on the branches, red against the darkening sky. Beside the orchard, in a small field, two horses stand close together, their heads lowered, resting. One of them lifts its head as you pass and watches you with dark, calm eyes.

      Now you are among the first houses. They are made of stone, with deep windowsills and painted doors. In one window a cat is curled on a cushion, its tail wrapped around its nose. In another, a lamp has been lit, and you can see a bookshelf and the corner of a comfortable chair.

      The village is getting ready for sleep. A woman is taking washing from a line, folding each sheet carefully over her arm. An old man is closing the green shutters on his shop, one and then the other, and he wishes you a good evening as you pass. The baker has already gone home, but the smell of bread still lingers in the lane outside her door.

      In the little square there is a fountain, and the water falls into its stone basin with a quiet, endless splash. Around the square the lamps have come on, soft and yellow, each one making a small circle of warm light on the cobblestones. You sit on a bench beside the fountain and rest for a while.

      The sky above the rooftops has turned a deep, velvety blue. The first stars are appearing, one at a time, as though someone is lighting them carefully. The church bell rings the hour, slowly and gently, and the sound floats over the roofs and out across the fields.

      One by one, the windows around the square go dark. Curtains are drawn. Doors are closed. The village breathes out, settling into the night like someone easing into a warm bed.

      At the far end of the square there is a small inn with a lantern over the door. Inside, a room has been kept for you. It is up a narrow wooden staircase, with a sloping ceiling and a window that looks out over the fountain. The bed is soft and the pillows are deep, and there is a heavy quilt that smells of lavender.

      You open the window just a little, so that you can hear the fountain. Then you lie down and pull up the quilt and let your body sink into the mattress.

      Outside, the water keeps falling into the stone basin, soft and steady. The stars turn slowly over the sleeping village. The forest stands quiet on the hills. And you drift gently away, safe and still, into a long and peaceful sleep.
    `),
  },
  {
    id: 'low-tide-dawn',
    premium: true,
    title: 'The Long Walk at Low Tide',
    category: 'peaceful',
    description: 'An unhurried walk along a wide, quiet beach as the moon rises over the water.',
    setting: 'Seaside walk', mood: 'Serene', motif: 'shore',
    text: t(`
      The tide has gone a long way out tonight. It has left behind a wide, shining beach, so flat and wet that it holds the whole evening sky like a mirror. You step down from the dunes onto the cool sand, and it is firm and smooth beneath your bare feet.

      There is no one else here. Just you, and the soft sound of the sea far out at the edge of the sand, and the cry of a single gull circling slowly overhead before it, too, flies home.

      You begin to walk. You do not choose a direction so much as let the beach choose it for you. Your footprints follow behind you, one after another, and the thin film of water fills them in, softly, as if the beach is tidying up after you.

      The sky is pale lilac near the horizon and deep blue above. A few thin clouds are lit underneath with the last of the sunset, pink and peach and gold. Their colours lie on the wet sand too, so that you seem to be walking across the sky itself.

      Little channels of seawater run across the beach towards the ocean, and you step over them, or sometimes through them, the water cold and silky around your ankles. Tiny shells lie scattered on the sand, pale and perfect: some white, some faintly pink, some ridged like little fans. You pick one up and hold it in your palm for a while, feeling its smoothness, and then you place it gently back where you found it.

      Further along, the sand gives way to a scattering of low, dark rocks. In the pools between them the water is perfectly still. You crouch beside one and look in. A small crab moves sideways and tucks itself under a ledge. Strands of seaweed sway very slightly, though there is no current you can feel. A star of light from the sky trembles on the surface.

      You stand and walk on. Now the sound of the sea is a little closer. The waves are small tonight, low and lazy. Each one rises, curls over with a soft hush, and spreads itself thinly across the sand, glittering, before sliding back again. Hush. And then a pause. And then hush again.

      You find that you are breathing with them. In as the wave draws back. Out as it spreads across the sand. In. And out. There is nothing to think about but this rhythm, and the coolness of the air, and the sand beneath your feet.

      Behind the dunes, the moon is rising. First a glow, then a thin bright edge, and then the full round moon lifting itself slowly into the sky. Its light spreads across the water in a long silver path that seems to lead right to where you are standing.

      You sit down on the dry sand at the foot of the dunes. It still holds a little of the day's warmth. You draw your knees up and rest your arms on them and watch the moon climb, and the silver path shimmer, and the small waves arrive and return.

      A cool breeze moves through the dune grass behind you with a dry, gentle rustle. Far out to sea, a ship's light moves slowly along the horizon, unhurried, on its way to somewhere far away.

      After a while, you lie back on the sand. Above you, the stars have come out in their thousands. The moon is bright and calm. The sound of the waves surrounds you, soft and slow and endlessly patient.

      Hush, says the sea. Hush. And your eyes close, and your body grows heavy and still, and the tide begins its long, slow journey back towards the shore, while you drift, peacefully, into sleep.
    `),
  },

  // ───────────────────────── Dream Escapes ─────────────────────────
  {
    id: 'island-slow-tides',
    title: 'The Island of Slow Tides',
    category: 'dream',
    description: 'A small boat carries you to an imaginary island where time moves gently.',
    setting: 'Imaginary island', mood: 'Dreamy', motif: 'island',
    text: t(`
      There is an island far out in a calm sea, where the tides move more slowly than anywhere else in the world. It does not appear on any map. You can only reach it at dusk, in a small wooden boat with a white sail, and tonight the boat is waiting for you at the end of a long, quiet jetty.

      You step aboard. The boat rocks gently and then steadies. There is a cushioned seat at the back, and a soft blanket, and you settle into it. No one needs to steer. The sail fills with a warm breeze, and the boat moves away from the jetty, smooth as a thought.

      The water is calm and clear. As the light fades, you notice that it has begun to glow very faintly, a soft blue light that ripples out from the bow wherever the boat moves through it. Tiny lights drift beneath the surface, like stars that have decided to swim.

      Ahead, the island appears on the horizon: a low green hill with a crescent of pale sand, and palm trees leaning gently over the water. As you come closer, you can smell it, flowers and warm earth and something sweet, like vanilla or ripe fruit.

      The boat slides up onto the sand with a soft whisper and comes to rest. You step out. The sand is the finest you have ever felt, cool and soft as flour. Little waves arrive at the shore so slowly that you can watch each one curl, and pause, and fold, as if the sea itself is taking a long, deep breath.

      This is the island of slow tides. Here, nothing hurries. The palm leaves move as gently as seaweed underwater. A heron standing in the shallows lifts one foot, and holds it, and sets it down again, so slowly and gracefully that it seems like a dance.

      A path leads up from the beach between flowering bushes. The flowers are large and pale, white and cream and soft yellow, and they are only now opening for the night, releasing a fragrance that is warm and calming. Small moths with silver wings move from flower to flower.

      At the top of the path, there is a clearing, and in the clearing a hammock hangs between two trees. Beside it, on a low wooden table, someone has left a glass of cool water with a slice of lime, and a bowl of fresh fruit: mango, papaya, and little sweet bananas.

      You sit in the hammock and let it hold you. It sways gently, back and forth, back and forth. Through the leaves above you can see the sky, now a deep dark blue, scattered with stars. They are bigger here, and closer, and they seem to pulse very softly, as if they too are breathing.

      Somewhere in the trees, a small creature begins to sing. It is not quite a bird and not quite a frog: just a gentle, low note, repeated slowly, like someone humming a lullaby. Another answers it from further away. And another. Soon the whole island is softly humming.

      Down on the beach, the slow waves continue to arrive. Each one takes so long that you can breathe in completely while it rises, and breathe out completely while it falls. In. And out. The island breathes with you.

      You notice that your thoughts are moving more slowly too. They drift like the boat drifted, like the lights in the water, without any need to go anywhere. One thought floats by, and you let it go. Then another. Then there is just the hammock, and the humming, and the stars.

      The moon rises over the sea, round and silver, and lays a path of light across the glowing water. The breeze is warm and soft against your face. The hammock sways, slower now, and slower still.

      On the island of slow tides, there is all the time in the world. And so you rest, held gently between two trees, beneath the breathing stars, and drift peacefully, slowly, into the deepest sleep.
    `),
  },
  {
    id: 'lantern-balloon',
    title: 'The Lantern Balloon',
    category: 'dream',
    description: 'A silent night flight in a glowing balloon over sleeping valleys, lakes and mountains.',
    setting: 'Sky over valleys', mood: 'Wonder', motif: 'balloon',
    text: t(`
      In the middle of a wide meadow, under a clear night sky, a balloon is waiting. It is not like ordinary balloons. Its silk is the colour of deep blue twilight, and inside it a soft golden light glows, like a lantern, so that it shines gently in the dark.

      Beneath it hangs a woven basket lined with cushions and blankets. You climb in and settle yourself comfortably. A rope holding the basket to the ground loosens all by itself and falls away, and without any sound at all the balloon begins to rise.

      You lift slowly above the meadow. The grass below is silver in the starlight, and you can see the path you walked to get here, winding back towards a few small houses. Their windows are dark. Everyone there is already asleep.

      Higher now. The air is cool and clean, and it smells of night flowers and distant rain. The basket sways very slightly, the way a cradle sways. Wrapped in your blanket, you feel perfectly warm and perfectly safe.

      A gentle breeze carries the balloon over the hills. Below you, a forest stretches out like a dark green blanket, soft and endless. Here and there, mist has gathered in the hollows, pale and still, lit faintly by the glow of the balloon above it.

      You float over a lake. Its surface is so calm that it holds the whole sky. You can see the stars in it, and the golden light of the balloon, and for a moment it seems that you are floating between two skies, one above and one below, both full of stars.

      On the far side of the lake, a river winds away through the valley, shining silver. You follow it for a while, drifting over farms and orchards and small stone bridges. A fox crosses a field, unhurried, and stops to look up at the light passing overhead. An owl glides beneath you on soft, silent wings.

      The breeze turns and carries you towards the mountains. They rise ahead, tall and calm, their peaks still holding a little snow that glows white in the moonlight. The balloon climbs gently to pass over them, and as it does, the air grows a little cooler, and you pull your blanket closer around your shoulders.

      From up here you can see so far. Valleys and hills fold away into the distance, one after another, each a little paler and bluer than the last, until they meet the soft line of the horizon. Tiny lights twinkle in faraway villages. Everything is quiet. Everything is resting.

      The moon is high now, full and bright. Its light spreads over the mountains and the valleys and the sleeping world, silver and soft. The stars seem close enough to touch. You reach out a hand, just to see, and feel only the cool, gentle air moving between your fingers.

      The golden light in the balloon glows softly above you, warm and steady. It hums very quietly, a sound so low that you feel it more than hear it, like a cat purring nearby.

      On the other side of the mountains, the balloon begins to sink, very slowly, towards a valley full of tall grass and wildflowers. It descends so gently that you hardly notice. The tops of the grasses brush the bottom of the basket with a soft whispering sound.

      The balloon settles. The basket rests in the grass, rocking just a little and then becoming still. Crickets are singing softly all around. The light above you dims to a warm, faint glow, like the last embers of a fire.

      You do not need to climb out. The basket is soft and warm, the blankets are deep, and the night is calm and kind. You lie back and look up at the great dark sky full of stars, and the glowing silk above you, and you let your eyes close.

      The meadow breathes around you. The crickets sing. And you drift away, light as the balloon, into a deep and dreamless sleep.
    `),
  },
  {
    id: 'glass-moon-garden',
    premium: true,
    title: 'The Garden Under the Glass Moon',
    category: 'dream',
    description: 'A hidden moonlit garden of silver trees, soft lanterns and a pool that holds the stars.',
    setting: 'Moonlit garden', mood: 'Enchanted', motif: 'garden',
    text: t(`
      At the end of a narrow lane, behind an old stone wall covered in jasmine, there is a garden that only opens at night. You find the gate easily tonight. It is made of wrought iron, curled into the shapes of leaves and vines, and when you touch it, it swings open without a sound.

      Above the garden hangs a moon unlike any other. It is round and clear, like a great sphere of glass, and its light is softer than ordinary moonlight: pale blue and silver, with a faint shimmer, as though it were shining through water.

      You step inside and close the gate behind you. The air is warm and still and full of fragrance. Jasmine and night-blooming stock, honeysuckle and something deeper, sweet and calming, that you cannot quite name.

      A path of smooth white pebbles leads into the garden. They glow faintly under the glass moon, so that the path seems to be lit from within. You follow it, walking slowly, and the pebbles make a soft crunch beneath your feet.

      On either side, the trees have silver leaves. When the breeze moves through them, which it does now and then, very gently, the leaves turn and catch the light and make a delicate sound, like tiny bells ringing far away.

      Small lanterns hang from the lower branches. They are made of paper, in shades of pale blue and soft white, and inside each one a warm light glows. They sway a little in the breeze, and their light moves softly across the path and the flowers.

      The path leads you through an archway of climbing roses. The roses are white and fully open, and their petals are cool and velvety when you brush them with your fingers. Beyond the arch, the garden opens into a wide lawn, soft and green, and at its centre there is a round pool.

      The pool is perfectly still. In its dark water, the glass moon is reflected exactly, and around it the stars. Water lilies float on the surface, their petals pale and folded for the night. Now and then, a single drop falls from a leaf above into the pool, and a small ring spreads outward, slowly, until it fades away.

      Beside the pool there is a low bench, covered with soft cushions. You sit down. From here you can see the whole garden: the silver trees, the swaying lanterns, the white path winding away into the shadows, and the glass moon above it all.

      A nightingale begins to sing somewhere in the trees. Its song is long and liquid, full of soft trills and pauses. It sings for a while, and then it stops, and the garden is silent, and then it sings again.

      You notice small lights drifting among the flowers. Fireflies, glowing gently, rising and falling, blinking on and off as they float across the lawn. One lands on the back of your hand. It glows there for a moment, warm and tiny, and then lifts away and joins the others.

      Time feels different here. Slower. Kinder. There is nothing that needs to be done and nowhere that needs to be reached. The garden asks nothing of you except that you rest.

      You lie down on the cushions. They are deep and soft and smell faintly of lavender. Above you, the silver leaves turn gently against the sky, ringing their tiny bells. The glass moon glows, calm and clear and quiet.

      Your breathing becomes slow and deep. The nightingale sings again, softly now, as if it is singing only for you. The lanterns sway. The fireflies drift. The pool holds the moon and the stars in perfect stillness.

      And here, in the garden under the glass moon, you let go of the day completely. Your eyes close. Your body softens. And you drift down, gently, into a sleep as calm and clear as the water in the moonlit pool.
    `),
  },

  // ───────────────────────── Gentle Mystery ─────────────────────────
  {
    id: 'room-eleven',
    title: 'The Quiet Mystery of Room Eleven',
    category: 'mystery',
    description: 'At a seaside hotel, someone leaves a small gift outside Room Eleven every night. Who could it be?',
    setting: 'Old seaside hotel', mood: 'Curious', motif: 'hotel',
    text: t(`
      The Harbour View Hotel had stood on the cliff above the bay for more than a hundred years. It was a tall, white building with green shutters and a wide veranda, and in the evenings the dining room smelled of roast vegetables and fresh bread. Margaret had come to stay for a week of rest, and she had been given Room Eleven, at the end of the first-floor corridor, with a window over the sea.

      On her first night, when she returned from supper, there was something on the floor outside her door. It was a small paper bag, folded neatly at the top. Inside was a single shortbread biscuit, wrapped in a napkin, and a note in careful handwriting that said simply: Sleep well.

      Margaret smiled. How kind, she thought. The hotel must do this for all its guests.

      But at breakfast the next morning, she mentioned it to the couple at the next table, and they looked puzzled. They had found nothing outside their door. Neither had the gentleman who was staying in Room Nine.

      That evening, there was another bag. This time it held a small sprig of lavender tied with blue ribbon, and the same note: Sleep well.

      Margaret was curious now. In the morning she went to the front desk, where Mr Okafor, the manager, was sorting the post. He was a tall man with silver hair and a gentle voice. He listened to her story with great interest, but he shook his head. The hotel did not leave gifts, he said. And none of the staff had mentioned it.

      On the third evening there was a tiny jar of honey. On the fourth, a smooth white pebble from the beach, painted with a small blue star. And always the note: Sleep well.

      Margaret began to look for clues. The handwriting was old-fashioned, with long looping letters. The paper bags were the kind used by the bakery in the village. The ribbon on the lavender was the same blue as the curtains in the hotel's small library.

      On the fifth day, she visited the library. It was a quiet room with deep armchairs and shelves of old books. On the wall hung photographs of the hotel through the years. And there, in a photograph from long ago, she saw a young woman standing on the veranda, smiling. Underneath was written: Rose, housekeeper, 1962.

      That evening, she asked Mr Okafor about Rose. His face softened. Rose had worked at the hotel for forty years, he said. She had retired long ago, but she still lived in the cottage at the bottom of the hotel garden. She was very old now, and did not go out much.

      And then he paused, and looked at Margaret thoughtfully. Room Eleven, he said slowly, was the room Rose looked after for most of her life. She used to say it was the most peaceful room in the house. She always made sure that whoever stayed there slept well.

      The next morning Margaret walked down through the hotel garden, past the rose beds and the lemon trees, to a small cottage with a red door. She knocked gently. After a while the door opened, and there stood a tiny old woman with bright eyes and a cardigan the colour of the sea.

      Margaret held up the painted pebble. Rose looked at it, and then at Margaret, and began to laugh, a soft, delighted laugh. Come in, she said, and I'll make us tea.

      It turned out that Rose's granddaughter worked in the hotel kitchen. Every afternoon, Rose would prepare a little something and give it to her granddaughter to leave outside Room Eleven. It's an old habit, Rose said. I can't look after the room any more. But I can still wish someone a good night's sleep.

      They sat together for the whole morning, drinking tea and talking about the sea and the hotel and the many guests Rose had known. When Margaret finally left, Rose pressed a small paper bag into her hands.

      That night, in Room Eleven, Margaret sat by the window and opened it. Inside was a shortbread biscuit, and a note in long looping letters: Mystery solved. Sleep well, my dear.

      Margaret smiled, and ate the biscuit slowly, and watched the moon rise over the quiet bay. Then she climbed into bed, in the most peaceful room in the house, and slept more deeply than she had in years.
    `),
  },
  {
    id: 'lamp-in-the-window',
    premium: true,
    title: 'The Lamp in the Window',
    category: 'mystery',
    description: 'Every night a lamp glows in an empty cottage by the harbour. A slow, kindly mystery.',
    setting: 'Harbour cottage', mood: 'Reassuring', motif: 'lamp',
    text: t(`
      When Elias moved to the little harbour town in early winter, he rented a room above the old net shop, with a window that looked out across the water. On the other side of the harbour, on a small rise, stood a single stone cottage. It was plainly empty. The garden was overgrown, and the gate hung a little crooked on its hinges.

      But every evening, just as the sky grew dark, a lamp came on in its front window.

      It was a warm, golden light, not bright, but steady. It glowed all night, reflected in the dark water of the harbour, and in the morning, by the time the fishing boats went out, it was gone.

      At first Elias assumed someone lived there after all. But in the daytime he walked past the cottage and saw that the curtains were drawn and the doorstep was covered in fallen leaves. No smoke came from the chimney. No one came or went.

      He mentioned it to Mrs Daniels at the post office. Oh, the lamp, she said, with a small smile, and went back to sorting letters, as if that explained everything.

      He mentioned it to the man who ran the café on the quay. That's Alida's lamp, the man said, wiping a cup. It's always been on. And he would say no more.

      Elias was not someone who liked to pry. But the lamp stayed with him. Each night he would sit at his window with a cup of tea, and watch the light come on across the water, and wonder.

      One evening in the middle of winter, a storm rolled in from the sea. The wind howled around the harbour, and the rain came down in heavy sheets. The boats rocked at their moorings, and the street lights flickered. Elias stood at his window, a little anxious, watching the dark water heave.

      Out beyond the harbour wall, he could just make out a small fishing boat, coming in late, rising and falling on the waves. And he saw that it was steering, very carefully, straight towards the golden lamp in the cottage window.

      The boat came safely through the harbour mouth and into the calm water inside, and tied up at the quay. And as Elias watched, the lamp in the window went out.

      The next morning the storm had passed, and the sky was washed clean and pale blue. Elias walked down to the quay. The fisherman from the late boat was there, coiling ropes. He was an old man with a white beard and hands like knotted wood. Elias asked him about the lamp.

      The old man was quiet for a moment. Then he said: Alida was my wife. Fifty years ago, the harbour light broke in a storm, and I was out at sea. She put a lamp in the window so I'd know where to steer. I came home safe. After that, she lit it every night, just in case anyone else was out there.

      She passed away three winters ago, he said. But the town didn't want the light to go out. So the neighbours take turns. Mrs Daniels from the post office, the café man, the baker, the schoolteacher. Someone slips into the cottage every evening, lights the lamp, and slips out again before dawn. It keeps her light going, he said. And it still brings people home.

      Elias felt something warm settle in his chest. That evening, he went to the post office before it closed and asked Mrs Daniels if he might take a turn.

      She smiled the same small smile and handed him a heavy iron key on a ribbon.

      So that night it was Elias who walked up the little rise, through the crooked gate, into the quiet cottage that smelled of old wood and sea air. He struck a match and lit the lamp in the window, and watched its golden glow spread across the dark harbour.

      Then he went home, and sat at his own window with a cup of tea, and looked across the water at the light he had lit. It shone, steady and kind, reflected in the calm harbour. Somewhere out at sea, perhaps, someone could see it and know the way home.

      Elias finished his tea, and drew his curtain almost closed, leaving just a gap so that he could see the lamp from his bed. And he fell asleep watching it, comforted, the way you are comforted by a light left on for you, by someone who cares.
    `),
  },
];

export const storyById = (id: string, extra: Story[] = []) => STORIES.find((s) => s.id === id) ?? KIDS_STORIES.find((s) => s.id === id) ?? extra.find((s) => s.id === id);

export { KIDS_CATEGORIES, KIDS_STORIES };

/** Stories shown first on the home screen. */
export const FEATURED_STORIES = ['rain-cabin', 'bookshop-long-street', 'night-train-north', 'island-slow-tides', 'room-eleven', 'paternoster-evening'];
