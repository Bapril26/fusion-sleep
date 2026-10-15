/**
 * Fusion Sleep — bedtime stories for children (about ages 3 to 8).
 * Original writing by Fusion Labs. Short, gentle, and always ending in sleep.
 */
import type { Story, StoryCategory } from './stories';

export const KIDS_CATEGORIES: StoryCategory[] = [
  { id: 'kidsAnimals', name: 'Animal Friends', short: 'Animals', blurb: 'Sleepy animals getting ready for bed', icon: 'heart' },
  { id: 'kidsAdventure', name: 'Dreamy Adventures', short: 'Adventures', blurb: 'Gentle journeys to the moon and beyond', icon: 'sparkles' },
  { id: 'kidsCosy', name: 'Cosy & Calm', short: 'Cosy', blurb: 'Warm blankets, soft rain and teddy bears', icon: 'moon' },
];

const t = (s: string) => s.trim().replace(/^[ \t]+/gm, '');

export const KIDS_STORIES: Story[] = [
  {
    id: 'kids-pip-penguin',
    audience: 'kids',
    title: 'Pip the Penguin of Boulders Beach',
    category: 'kidsAnimals',
    description: 'A little penguin says goodnight to the sea, the rocks and the moon.',
    setting: 'Seaside', mood: 'Snug', motif: 'shore',
    text: t(`
      On a sandy beach where big round boulders sit by the sea, there lived a little penguin called Pip. Pip had a black coat, a white tummy and two small pink patches above his eyes, like rosy cheeks.

      All day long Pip played. He waddled across the warm sand, flap, flap, flap. He splashed in the cool blue water, splash, splash, splash. He chased the little waves and the little waves chased him back.

      But now the sun was going down, down, down, painting the sky orange and pink. Pip's mama called softly. "Time for bed, little Pip."

      Pip gave a big penguin yawn. "Can I say goodnight first?" he asked.

      "Of course," said Mama.

      So Pip waddled to the edge of the water. "Goodnight, sea," he whispered. And the sea went shhh, shhh, shhh, very softly, as if it was saying goodnight back.

      He waddled to the biggest boulder. "Goodnight, rock," he said, and he patted it with his little flipper. The rock was still warm from the sun, like a cosy blanket.

      He looked up at the sky, where the first star was twinkling. "Goodnight, star," said Pip. The star twinkled, twinkle, twinkle.

      Then the moon came up over the water, round and silver and bright. "Goodnight, moon," Pip whispered. And the moon made a shiny path across the sea, all the way to Pip's little feet.

      Pip waddled back to his nest between the rocks. It was soft and snug. Mama was there, and Papa too, and his big sister Penny, already asleep with her beak tucked under her flipper.

      Pip snuggled in close. Mama's feathers were warm. Papa hummed a low, gentle penguin song. Hmm, hmm, hmm.

      Pip's eyes grew heavy. Outside, the sea kept whispering, shhh, shhh. The star kept twinkling. The moon kept shining.

      "Goodnight, Pip," whispered Mama.

      But Pip didn't answer. He was already fast asleep, dreaming of tomorrow, and the warm sand, and the little waves that would be waiting to play.
    `),
  },
  {
    id: 'kids-owl-stars',
    audience: 'kids',
    title: 'The Little Owl Who Counted Stars',
    category: 'kidsAnimals',
    description: 'Olive the owl tries to count every star, and finds the very best way to fall asleep.',
    setting: 'Forest', mood: 'Dreamy', motif: 'garden',
    text: t(`
      High in an old oak tree lived a little owl called Olive. Olive had big round eyes, soft fluffy feathers and two tufty ears that stood up when she was curious.

      Owls usually stay up at night, but Olive was still very little, and little owls need lots of sleep.

      "Bedtime, Olive," said Grandpa Owl, fluffing up the nest.

      "But I'm not sleepy," said Olive. "I want to count all the stars first."

      Grandpa Owl smiled a wise owl smile. "Then let's count them together," he said.

      So they sat side by side on the branch and looked up at the dark blue sky.

      "One," said Olive, pointing her wing at a bright star. "Two. Three." There was a star over the hill. "Four." There was a star above the river. "Five. Six. Seven."

      Every time she counted, more stars came out. Little ones and big ones, twinkly ones and steady ones.

      "Eight," said Olive, a little more slowly. "Nine." She gave a small yawn. "Ten."

      "Shall we breathe with the stars?" asked Grandpa Owl. "Breathe in while a star twinkles, and breathe out slowly while it shines."

      Olive tried it. She breathed in, slow and deep. She breathed out, soft and long. In, and out. In, and out.

      "Eleven," she whispered. "Twelve." Her feathers felt warm. Her eyes felt heavy.

      Below them, the forest was quiet. A cricket sang a soft song. The leaves rustled gently in the breeze, like someone whispering hush.

      "Thir-teen," said Olive, very slowly.

      Grandpa Owl tucked his big wing around her. "The stars will still be there tomorrow night," he said softly. "We can count the rest then."

      Olive nodded, but her eyes were already closed. She snuggled into Grandpa's warm feathers and fell asleep, while thousands and thousands of stars twinkled over the forest, keeping watch until morning.
    `),
  },
  {
    id: 'kids-elephant-night',
    audience: 'kids',
    title: "Little Elephant's Quiet Night",
    category: 'kidsAnimals',
    description: 'A baby elephant listens to the gentle sounds of the bush as the herd settles down to sleep.',
    setting: 'African bush', mood: 'Calm', motif: 'balloon',
    text: t(`
      Far away, where the grass is tall and golden and the trees have flat tops like umbrellas, there lived a baby elephant called Zola.

      Zola had big floppy ears, a wiggly trunk and four sturdy little legs. All day she walked with her family, munching sweet grass and splashing in the waterhole.

      When the sun went down, the herd stopped under a big acacia tree. The sky turned purple, then dark blue. It was time to sleep.

      But Zola's ears kept flapping. "Mama," she whispered, "the night is full of sounds."

      "Let's listen together," said Mama, curling her trunk around Zola. "Every sound is just the bush saying goodnight."

      They listened.

      Chirrup, chirrup, sang the crickets in the grass. "That's the crickets singing a lullaby," said Mama.

      Hoo, hoo, called an owl from a tree. "That's the owl telling everyone the night has begun."

      Swish, swish, went the long grass in the breeze. "That's the wind tucking the grass into bed."

      Far away, a lion gave a deep, sleepy rumble. Zola's ears went up. "That's just the lion yawning," said Mama gently. "He's very far away, and he's going to sleep too."

      Zola listened some more. She heard her big brother breathing slowly. She heard Grandma Elephant's tummy rumble softly, rumble, rumble. Zola giggled.

      "Mama," she said, "the night sounds are nice."

      "They are," said Mama. "And our family is all around you. You are safe and warm."

      Zola leaned against Mama's big, warm leg. Above them, the stars came out, bright and many, all across the wide sky.

      Chirrup, went the crickets. Swish, went the grass. Hoo, went the owl.

      Zola's eyes closed slowly. Her ears stopped flapping. Her little trunk curled up. And under the big acacia tree, with her family all around her, baby Zola fell fast asleep.
    `),
  },
  {
    id: 'kids-moon-boat',
    audience: 'kids',
    title: 'The Moon Boat',
    category: 'kidsAdventure',
    description: 'A silver boat sails up into the night sky to visit the sleepy moon.',
    setting: 'Night sky', mood: 'Magical', motif: 'sea',
    text: t(`
      One night, when the house was quiet, Sam looked out of the window and saw something wonderful. A little silver boat was floating outside, glowing softly, just above the garden.

      On its side, in shiny letters, it said: The Moon Boat.

      The window opened all by itself, and a gentle voice said, "Would you like a ride?"

      Sam climbed in, wearing pyjamas and slippers and holding Bunny, the soft toy rabbit. Inside the boat there were fluffy cushions and a warm blanket covered in stars.

      The boat began to rise. Up, up, up, past the roof, past the tall trees, past the sleepy birds in their nests.

      Below, the town looked tiny. The houses had little yellow windows, like toy houses. The cars were tucked up in their driveways. Everyone was getting ready for bed.

      The boat sailed through soft white clouds. They felt like cotton wool and smelled like warm milk. Sam reached out and touched one. It was cool and tickly.

      Then they saw her: the Moon, big and round and glowing. She had a kind, sleepy face.

      "Hello, Sam," said the Moon with a yawn. "I'm so glad you came. Every night I shine my light so that children everywhere can sleep without being afraid of the dark."

      "Thank you, Moon," said Sam.

      The Moon smiled. "Would you like to help me say goodnight to the world?"

      So together they called softly: "Goodnight, mountains. Goodnight, oceans. Goodnight, forests and fields. Goodnight, cats and dogs and birds and bears. Goodnight, everyone."

      All over the world, children snuggled down, and lights clicked off, one by one.

      "Now it's your turn to sleep," said the Moon. She blew a soft, silvery breath, and the Moon Boat turned around and floated gently home, down through the clouds, past the trees, all the way to Sam's window.

      Sam climbed into bed with Bunny. The Moon was still shining through the curtains, soft and bright.

      "Goodnight, Moon," Sam whispered.

      "Goodnight, Sam," the Moon whispered back. And Sam fell fast asleep, dreaming of silver boats and fluffy clouds.
    `),
  },
  {
    id: 'kids-balloon-ride',
    audience: 'kids',
    title: "Luna's Balloon Ride",
    category: 'kidsAdventure',
    description: 'Luna floats over sleeping farms and quiet hills in a glowing blue balloon.',
    setting: 'Over the hills', mood: 'Wonder', motif: 'balloon',
    text: t(`
      Luna had a balloon. Not an ordinary balloon, but a big blue one with a tiny basket underneath and a soft golden light inside, like a lantern.

      Every night, when Luna had brushed her teeth and put on her pyjamas, the balloon would bob gently by her bed, waiting.

      Tonight, Luna climbed into the little basket with her favourite blanket. "Ready," she whispered. And the balloon floated out of the window, as light as a feather.

      Up they went, into the cool night air. The world below was quiet and dark and peaceful.

      They floated over a farm. The cows were lying down in the field, chewing slowly with their eyes half closed. The sheep were huddled together like a big woolly cloud. In the barn, a mother hen tucked her chicks under her wings.

      "Goodnight, farm," whispered Luna.

      They floated over a lake. It was so still that Luna could see the stars in the water. A family of ducks was sleeping on the bank, with their heads tucked under their wings.

      "Goodnight, ducks," whispered Luna.

      They floated over a hill covered in soft grass. A little rabbit peeked out of its burrow, wiggled its nose, and went back inside to sleep.

      "Goodnight, bunny," whispered Luna.

      The balloon floated higher. The air smelled like flowers and rain. The golden light glowed softly above her, warm and safe. Luna pulled her blanket up to her chin.

      Above her, the stars twinkled. Below her, the whole world was sleeping. Everything was calm. Everything was quiet.

      The balloon began to drift slowly home, rocking gently, like a cradle. Back over the hill, back over the lake, back over the farm, and in through Luna's window.

      Luna climbed into her bed, all warm and sleepy. The blue balloon bobbed beside her, its light growing dimmer and dimmer, like a night-light.

      "Goodnight, balloon," Luna whispered.

      And with a big, happy yawn, Luna closed her eyes and drifted into a deep, sweet sleep.
    `),
  },
  {
    id: 'kids-dreamland-train',
    audience: 'kids',
    title: 'The Train to Dreamland',
    category: 'kidsAdventure',
    description: 'All aboard the sleepy little train that chuffs gently to Dreamland.',
    setting: 'Night train', mood: 'Soothing', motif: 'train',
    text: t(`
      Every night, at exactly bedtime, a little blue train comes chuffing quietly to a station that only sleepy children can find. Its name is the Dreamland Express.

      Tonight, Theo is waiting on the platform in his pyjamas, holding his ticket. The ticket says: One Sleepy Passenger. Destination: Dreamland.

      Chuff, chuff, chuff. The little train slows down. Shhh, it sighs, as it stops. The door opens and a kind conductor with a big moustache smiles. "All aboard for Dreamland," he says softly.

      Theo climbs aboard. Inside, the carriage is warm and cosy. There are soft seats like beds, with fluffy pillows and stripy blankets. A teddy bear in a little cap is already snuggled in one corner, fast asleep.

      Theo settles into his seat and pulls the blanket over his knees.

      The whistle blows a soft, sleepy whistle: toot, toot. And the train begins to move.

      Chuff, chuff, chuff. Clickety-clack, clickety-clack. The train rocks gently from side to side, side to side.

      Out of the window, Theo sees the countryside rolling by. There are hills with sheep asleep on them. There is a river, shining in the moonlight. There is a little village with all its lights turned off.

      The conductor comes by with a tray. "Warm milk for the sleepy passenger?" he asks. Theo nods and sips it slowly. It is warm and sweet.

      The train goes through a gentle tunnel, where tiny lights twinkle on the ceiling like stars. Then out again into the soft blue night.

      Clickety-clack, clickety-clack. Theo's eyes grow heavy. The rocking of the train is just like being rocked in someone's arms.

      "Next stop, Dreamland," the conductor whispers.

      Theo snuggles deeper under his stripy blanket. Clickety-clack. Clickety-clack. Slower and slower. Softer and softer.

      And by the time the little blue train arrives in Dreamland, where the clouds are soft and the dreams are kind, Theo is already fast asleep.
    `),
  },
  {
    id: 'kids-teddy-checklist',
    audience: 'kids',
    title: "Teddy's Bedtime Checklist",
    category: 'kidsCosy',
    description: 'Teddy makes sure everything is ready for bed, one cosy step at a time.',
    setting: 'Bedroom', mood: 'Cosy', motif: 'cabin',
    text: t(`
      Teddy was a small brown bear with a red bow tie and one ear that was a little bit floppy. Every night, before bedtime, Teddy had a very important job. He checked the Bedtime Checklist.

      "Number one," said Teddy. "Bath time." Splish, splash, warm bubbly water, and a fluffy towel to dry off. Check!

      "Number two," said Teddy. "Pyjamas." Soft cosy pyjamas with little stars on them. One arm, two arms. One leg, two legs. Check!

      "Number three. Brush teeth." Brush, brush, brush on the top. Brush, brush, brush on the bottom. A big smile in the mirror. Sparkly clean. Check!

      "Number four. Drink of water." A little sip from the cup. Check!

      "Number five. A story." Teddy chose a book about a bunny who lived under a tree. They read it together, and when they got to the end, Teddy whispered, "Again?" But then he remembered there were still things on the checklist.

      "Number six," said Teddy. "Say goodnight to everyone."

      Goodnight, Mummy. Goodnight, Daddy. Goodnight, Grandma on the phone. Goodnight, goldfish swimming in circles. Goodnight, toys on the shelf.

      Check!

      "Number seven. Snuggle under the blanket." Teddy climbed into bed and wriggled down until only his nose and his floppy ear were peeking out. Check!

      "Number eight. Night-light on." A soft glow, like a little moon, lit up the corner of the room. Check!

      "Number nine," said Teddy, with a big yawn. "Three slow breaths." In, and out. In, and out. In, and out. Check.

      Teddy looked at the very last line on the checklist. It was the most important one of all.

      "Number ten," he whispered. "Close your eyes and dream something lovely."

      Teddy closed his eyes. He thought about honey and sunshine and soft green grass. His breathing grew slow and quiet.

      And that was the very best check of all.
    `),
  },
  {
    id: 'kids-blanket-fort',
    audience: 'kids',
    title: 'The Rainy Night Blanket Fort',
    category: 'kidsCosy',
    description: 'Rain taps on the window while two little friends build the cosiest fort ever.',
    setting: 'Cosy home', mood: 'Snug', motif: 'books',
    text: t(`
      Pitter, patter, pitter, patter. The rain was tapping on the window. It was a cool, grey evening, and Mia and her little brother Leo were wearing their warmest pyjamas.

      "Let's build a blanket fort," said Mia.

      "The cosiest one ever," said Leo.

      So they got to work. They pulled two chairs together. They draped a big blue blanket over the top. They tucked the corners under some books so it wouldn't slip.

      Inside, they laid down the softest things they could find: two pillows, a squishy cushion, a fluffy rug and Leo's favourite blanket with the moons on it.

      Mia brought a little torch. Leo brought his stuffed giraffe, Gerry.

      They crawled inside. It was dark and snug and warm. Mia switched on the torch, and a soft circle of light shone on the blanket ceiling.

      Pitter, patter, went the rain outside. But inside the fort, everything was dry and cosy.

      "Listen," whispered Mia. "The rain is singing."

      They lay on their backs and listened. Pitter, patter. Pitter, patter. A gentle drip from the roof. A soft whoosh of wind.

      Mia made shadow animals with her hands in the torchlight. A bunny with long ears. A bird flapping its wings. A sleepy snail moving very, very slowly.

      Leo giggled. Then he yawned.

      Mum peeked in through the gap. "What a wonderful fort," she whispered. She brought them a plate of apple slices and two cups of warm milk. Then she tucked a blanket around them both.

      "Can we sleep in here?" asked Leo.

      "Just for a little while," said Mum with a smile.

      Mia switched off the torch. Now the fort was lit only by the soft glow from the hallway. The rain kept singing its gentle song. Pitter, patter. Pitter, patter.

      Leo cuddled Gerry the giraffe. Mia pulled the moon blanket up to her chin.

      Their eyes grew heavy. Their breathing grew slow.

      And there, in the cosiest blanket fort ever, with the rain tapping softly on the window, Mia and Leo drifted off to sleep.
    `),
  },
];
