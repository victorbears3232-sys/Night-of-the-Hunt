// Bestiary.js — the Hunter's Journal bestiary. A registry of every unique
// enemy and boss, with recording helpers called on each kill. Entries stay
// hidden until the player defeats that foe for the first time (discovery).
// State lives on the game instance: g.bestiary = { defeated: Set, counts: {} }
// and is persisted by SaveSystem. Boss entries carry the Soul ability they
// reward (looked up from Souls.js by boss id).

import { SOUL_BY_BOSS } from './Souls.js';

// cat 'enemy'  → rendered with the live canvas model (EnemyPreview)
// cat 'boss'  → rendered with the gothic SVG silhouette (BossSilhouette)
export const BESTIARY = [
  // ---- Common foes ----
  { id: 'townsfolk', cat: 'enemy', name: 'Corrupted Townsfolk', region: 'Ashen Square',
    lore: '"They drank the blessed rain and were unmade slowly, from the inside out. They wander the square where they were baptised, mouthing a sermon none now remember."' },
  { id: 'villager', cat: 'enemy', name: 'Hollowed Villager', region: 'Ashen Square',
    lore: '"Less far gone than their neighbours, but the water had them first and the water keeps them. They swing their tools as though the work were still waiting."' },
  { id: 'hound', cat: 'enemy', name: 'Plague Hound', region: 'Ashen Square',
    lore: '"The kennels opened on the night the rain turned. The hounds that came out were not the hounds that went in, though they remembered every hand that fed them."' },
  { id: 'priest', cat: 'enemy', name: 'Grotesque Priest', region: 'Ashen Square',
    lore: '"He blessed the wells and the rain and, in time, blessed himself. The lantern he carries is not for your path."' },
  { id: 'knight', cat: 'enemy', name: 'Cursed Knight', region: 'Hollow Crypt',
    lore: '"Sworn to guard the cathedral doors. The doors rotted and fell; the vow did not. He patrols a threshold that is no longer there."' },
  { id: 'crawler', cat: 'enemy', name: 'Carrion Crawler', region: 'Cathedral of Floods',
    lore: '"What crawled out from under the crypts was never a person, though it wears the shape of one. It does not sleep. It waits, which is different."' },
  { id: 'watcher', cat: 'enemy', name: 'Eldritch Watcher', region: 'Cathedral of Floods',
    lore: '"An eye that opened where a head should be. It watches because watching is all it was made to do, and it was made very well."' },
  { id: 'brute', cat: 'enemy', name: 'Carrion Brute', region: 'The Burning Graveyard',
    lore: '"The black water swelled a man until there was no man left, only mass and appetite. It moves slowly because it no longer needs to hurry."' },

  // ---- New archetypes (EnemySystem) ----
  { id: 'knife_villager', cat: 'enemy', name: 'Knife Drifter', region: 'Ashen Square',
    lore: '"A drifter who came to the square for shelter and found the rain instead. The knife was for cutting bread, once."' },
  { id: 'torch_villager', cat: 'enemy', name: 'Torch Bearer', region: 'Ashen Square',
    lore: '"He kept the fire lit because the dark was worse than the change. The fire does not care which side of him holds it."' },
  { id: 'heavy_villager', cat: 'enemy', name: 'Hammer Cultist', region: 'The Burning Graveyard',
    lore: '"A cultist of the new wet faith, swinging the hammer that built the cathedral to tear it down. He believes he is consecrating."' },
  { id: 'crazed_villager', cat: 'enemy', name: 'Crazed Drifter', region: 'Cathedral of Floods',
    lore: '"The rain broke something in him that mended wrong. He charges because standing still lets the voices catch up."' },
  { id: 'guardian', cat: 'enemy', name: 'Cathedral Guardian', region: 'Hollow Crypt',
    lore: '"An armoured sentinel of the drowned cathedrals. It raises its shield against the living as though they were the infection, which, to it, they are."' },
  { id: 'scholar', cat: 'enemy', name: 'Forbidden Scholar', region: 'Hollow Crypt',
    lore: '"He read the forbidden indexes until the words read him back. Now he floats where the library was, and the books float with him."' },
  { id: 'ancient_beast', cat: 'enemy', name: 'The Ancient Beast', region: 'Ancient Forest',
    lore: '"Older than the Hunt, older than the Quarter. It slept beneath the forest until the water reached the roots; now it wakes, hungry in the old way."' },
  { id: 'fallen_hunter', cat: 'enemy', name: 'Fallen Hunter', region: 'Ancient Forest',
    lore: '"A Hunter who came before you and stayed. The coat still fits. The eyes are the problem. He knows every trick you know, because he taught them to himself."' },
  { id: 'executioner', cat: 'enemy', name: 'The Executioner', region: 'The Burning Graveyard', elite: true,
    lore: '"An elite of the burning yard, masked and slow. The axe was made for a single duty and it has not been allowed to rest since."' },
  { id: 'bell_keeper', cat: 'enemy', name: 'The Bell Keeper', region: 'The Sunken Necropolis', elite: true,
    lore: '"He tolls the bell to call the drowned home. Every toll summons more, and he has lost count of the tolling, and of himself."' },
  { id: 'librarian', cat: 'enemy', name: 'Librarian Guardian', region: 'The Grand Ancient Library', elite: true,
    lore: '"A guardian of the Grand Ancient Library, wreathed in orbiting volumes that turn the pages of the living. It shushes with its teeth."' },

  // ---- Endgame foes (The Drowned Sanctum) ----
  { id: 'void_scholar', cat: 'enemy', name: 'Void Scholar', region: 'The Drowned Sanctum',
    lore: '"A scholar of the Drowned Sanctum, where the forbidden indexes go to be forgotten. It casts from further than you can see."' },
  { id: 'rune_guardian', cat: 'enemy', name: 'Rune Guardian', region: 'The Drowned Sanctum',
    lore: '"Armoured in glowing runes that ward the deepest crypt. It guards nothing living, and nothing living should want what it guards."' },
  { id: 'pale_hunter', cat: 'enemy', name: 'Pale Hunter', region: 'The Drowned Sanctum',
    lore: '"A hunter of the deep sanctum, faster than any who came before. It learned to dodge from a better teacher than you had."' },
  { id: 'crypt_beast', cat: 'enemy', name: 'Crypt Beast', region: 'The Drowned Sanctum',
    lore: '"A beast bred for the drowned vaults — hairless, long-limbed, patient. It has been patient for a very long time."' },
  { id: 'death_brute', cat: 'enemy', name: 'Death Brute', region: 'The Drowned Sanctum', elite: true,
    lore: '"Mass given purpose. It cannot be reasoned with because there is nothing left in it to reason. It simply continues."' },
  { id: 'phantom', cat: 'enemy', name: 'Phantom', region: 'The Drowned Sanctum',
    lore: '"A remnant of a Hunter who fell in the sanctum and refused to fall entirely. It blinks in and out of the world, angry at both."' },
  { id: 'titan', cat: 'enemy', name: 'Titan', region: 'The Drowned Sanctum', elite: true,
    lore: '"A towering guardian of the final vaults. Where it walks, the floor remembers."' },
  { id: 'the_warden', cat: 'enemy', name: 'The Warden', region: 'The Drowned Sanctum', miniboss: true,
    lore: '"The keeper of the Drowned Sanctum\'s deepest door. It is not a beast; it is a sentence, and it is unfinished."' },

  // ---- Northern expansion foes ----
  { id: 'ice_wraith', cat: 'enemy', name: 'Ice Wraith', region: 'The Frostbound Cathedral',
    lore: '"A priest of the frost who blessed the cold as the Vicar blessed the water. It flickers in and out of the snow, weeping ice that is also a prayer."' },
  { id: 'fallen_knight', cat: 'enemy', name: 'Fallen Knight', region: 'The Forgotten Castle',
    lore: '"Sworn to the Castellan, sworn to the keep. The keep fell, the Castellan fell, the vow did not. It patrols halls that no longer echo to anything but the rain it keeps out."' },
  { id: 'living_armor', cat: 'enemy', name: 'Living Armor', region: 'The Forgotten Castle', elite: true,
    lore: '"The plate stands empty and walks anyway. Whatever wore it left long ago; the armor simply prefers to keep its post. It is very patient, and very strong."' },
  { id: 'skeleton', cat: 'enemy', name: 'Risen Skeleton', region: 'The Ash Catacombs',
    lore: '"The first dead, buried before the water turned. The rain reached them anyway, through six feet of earth, and asked them to stand. They are still standing."' },

  // ---- Major bosses ----
  { id: 'vicar', cat: 'boss', name: 'The Drowned Vicar', region: 'Cathedral of Floods',
    lore: '"He blessed the black water and drank deep of his own blessing. The Cathedral drowned with its choir still singing, and the Vicar conducts them still."' },
  { id: 'gascoigne', cat: 'boss', name: 'Father Lucian Veyr', region: 'The Burning Graveyard',
    lore: '"A Hunter who hunted Hunters until the hunt took root in him. The beast beneath the coat had waited longer than the man."' },
  { id: 'nightmare', cat: 'boss', name: 'The Nightmare', region: 'The Nightmare',
    lore: '"It wore the dream like a skin, and the dream wore the faces of the drowned. Slaying it woke a city that did not know it had been sleeping."' },
  { id: 'mire', cat: 'boss', name: 'The Mire Mother', region: 'The Sunken Cathedral',
    lore: '"She sang the Chorus into the unborn. Her daughters are the water now, and the water loves them, and still it listens for the next verse."' },
  { id: 'hollow_king', cat: 'boss', name: 'The Hollow King', region: 'The Overlook Cathedral',
    lore: '"He ordered the digging, the sealing, the singing. What rose ate his throne from beneath him; the crown rests where he left it, unlifted."' },
  { id: 'archivist', cat: 'boss', name: 'The Archivist', region: 'The Grand Ancient Library',
    lore: '"He became the Index of every name the Chorus had drowned — and the Index is very hungry to learn your name. Do not read him aloud."' },
  { id: 'final', cat: 'boss', name: 'The First Voice', region: 'The Drowned Sanctum',
    lore: '"The first prayer, and the first to be answered. To stand before it is to hear every verse at once, and to know the silence after is the oldest thing in the Quarter."' },

  // ---- Secret boss ----
  { id: 'pale_wraith', cat: 'boss', name: 'The Pale Wraith', region: 'The Forgotten Gardens', secret: true,
    lore: '"A shade the Quarter forgot to bury. It haunts the gardens it once tended, unremembered even by the rain."' },

  // ---- Northern expansion: optional bosses ----
  { id: 'winter_hierophant', cat: 'boss', name: 'The Winter Hierophant', region: 'The Frostbound Cathedral', secret: true,
    lore: '"He banked the cathedral coals with snow and prayed the cold would keep the water out. The cold kept everything out, including mercy. He conducts the frost now as the Vicar once conducted the flood."' },
  { id: 'hollow_castellan', cat: 'boss', name: 'The Hollow Castellan', region: 'The Forgotten Castle', secret: true,
    lore: '"He held the keep until there was no one left to hold it for. A vow outlasts its reason. He is still holding, and the plate is still walking, and the banner has not finished falling."' },
  { id: 'wailing_mother', cat: 'boss', name: 'The Wailing Mother', region: 'The Whispering Wood', secret: true,
    lore: '"She came into the wood to give birth away from the water. The water found her anyway. What she bore is still crying, and the crying is not a child\'s, and the wood will not stop listening."' },
  { id: 'cliff_watcher', cat: 'boss', name: 'The Cliff Watcher', region: 'The Cliffside Walk', secret: true,
    lore: '"It was carved to watch the road, and it watched. When the road fell and the kingdom with it, it kept watching, because no one told it to stop. It learned to leave its perch the night the rain turned. It has been coming down ever since."' },

  // ---- The Forgotten Underworld (unique foes + the seal's guardian) ----
  { id: 'excavator', cat: 'enemy', name: 'Grave Excavator', region: 'The Forgotten Underworld',
    lore: '"They dug the cellars deeper than any king asked, and kept digging after the king was gone. The pickaxe is the only prayer they remember, and they swing it still."' },
  { id: 'seal_sentinel', cat: 'enemy', name: 'Seal Sentinel', region: 'The Forgotten Underworld',
    lore: '"Sworn to the deepest door, they guard a thing they were never named. The crest on their chest is the last word of the sealing rite, and it is still glowing, which means the seal is still holding, which means the kingdom is still forgetting."' },
  { id: 'void_leech', cat: 'enemy', name: 'Void Leech', region: 'The Forgotten Underworld',
    lore: '"It feeds on the silence the cellars were built to keep. Where it drifts, the dark thickens, and the dark is hungry in a way the light never taught it not to be."' },
  { id: 'under_guardian', cat: 'boss', name: 'The Last Warden', region: 'The Forgotten Underworld', secret: true,
    lore: '"The last lock of the deepest seal — a guardian of stone and oath, set to outlast the kingdom that made it. It has. Slaying it breaks the seal, and the seal is the only mercy the kingdom ever truly kept."' },

  // ---- The secret ending: the ancient celestial presence ----
  { id: 'celestial', cat: 'boss', name: 'The Celestial God', region: 'The Drowned Sanctum', secret: true,
    lore: '"The One Beneath. The Sleeping Sky. The sky before there was a sky, buried beneath the oldest stones because it could not be killed. The First Hunt failed to end it; the kings could only bury it, and bury the burying. When the last seal broke, it remembered the surface, and descended, and the Quarter learned why its ancestors had been so afraid of the dark above as well as the dark below."' },
];

export const BESTIARY_MAP = Object.fromEntries(BESTIARY.map(b => [b.id, b]));

export function init(g) {
  if (!g.bestiary) g.bestiary = { defeated: new Set(), counts: {} };
}

// Called from HuntGame._killEnemy for every foe (enemies and bosses alike).
// Records the type, counts the kill, and marks the first defeat (discovery).
export function recordKill(g, e) {
  if (!g) return;
  if (!g.bestiary) init(g);
  if (g._memory) return;   // boss Memories are replays — don't record or count them
  const id = e && e.type;
  if (!id || !BESTIARY_MAP[id]) return;
  g.bestiary.counts[id] = (g.bestiary.counts[id] || 0) + 1;
  g.bestiary.defeated.add(id);
}

export function isDefeated(g, id) { return !!(g.bestiary && g.bestiary.defeated.has(id)); }
export function count(g, id) { return (g.bestiary && g.bestiary.counts[id]) || 0; }

export function isComplete(g) {
  if (!g.bestiary) return false;
  return BESTIARY.every(b => g.bestiary.defeated.has(b.id));
}

export function progress(g) {
  if (!g.bestiary) return { cur: 0, max: BESTIARY.length };
  return { cur: g.bestiary.defeated.size, max: BESTIARY.length };
}

// The Soul ability a boss rewards, if any (for boss entries).
export function soulFor(id) { return SOUL_BY_BOSS[id] || null; }