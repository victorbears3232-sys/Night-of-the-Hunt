// World.js — the expanded map of The Hollow Quarter.
// A vast, interconnected kingdom: the original east-west backbone is preserved,
// with a massive southern continent of explorable districts layered beneath it.
// Combat, boss arenas, triggers, and progression coordinates are unchanged.

import { buildLibrary } from './Library.js';
import { buildSanctuary } from './Sanctuary.js';
import { buildLore } from './Lore.js';
import { buildFinalRegion } from './FinalRegion.js';
import { buildHunterNightmare } from './HunterNightmare.js';
import { buildNorth } from './NorthExpansion.js';
import { buildUnderworld } from './Underworld.js';
import { buildNorthwest } from './Northwest.js';

export default function buildWorld() {
  const W = 5100, H = 6400;
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });

  // ---- Outer border (expanded south) ----
  add(0, 0, W, 40);
  add(0, H - 40, W, 40);
  add(0, 0, 40, H);
  add(W - 40, 0, 40, H);

  // ============ ORIGINAL BACKBONE (preserved) ============
  // --- Hub: The Last Lantern ---
  add(120, 1180, 480, 24);
  add(680, 1180, 40, 24);   // gap x600-680: opening from the hub into the Weeping Alley (Pilgrim + Wet Note) — no key needed
  add(840, 1180, 120, 24);
  add(120, 1680, 520, 24);
  add(760, 1680, 200, 24);

  // --- Weeping Alley ---
  add(520, 360, 24, 820);
  add(720, 360, 24, 820);
  // --- Ashen Square ---
  add(300, 360, 24, 380);
  add(920, 360, 24, 380);
  add(300, 360, 360, 24);
  add(720, 360, 224, 24);
  add(300, 720, 24, 160);
  add(920, 720, 24, 160);
  // shortcut corridor
  add(940, 760, 24, 220);
  add(1080, 760, 24, 220);
  add(940, 980, 24, 360);
  add(1080, 980, 24, 360);
  add(940, 1340, 60, 24);
  add(1080, 1340, 24, 24);

  // --- East corridor (north wall split for the Northern Expansion stair) ---
  add(1080, 1280, 200, 24);
  add(1360, 1280, 140, 24);
  add(1080, 1560, 180, 24);
  add(1370, 1560, 140, 24);

  // --- Hollow Crypt ---
  add(1640, 1100, 24, 280);
  add(1640, 1480, 24, 140);
  add(2060, 1100, 24, 130);
  add(2060, 1290, 24, 330);
  add(1640, 1100, 440, 24);
  add(1640, 1596, 440, 24);
  add(1760, 1240, 40, 40);
  add(1900, 1240, 40, 40);
  add(1760, 1420, 40, 40);
  add(1900, 1420, 40, 40);

  // --- Cathedral of Floods (Boss 1: The Drowned Vicar) ---
  add(2160, 820, 24, 410);
  add(2160, 1290, 24, 410);
  add(2740, 820, 24, 380);
  add(2740, 1200, 24, 100, 'vicar_gate');
  add(2740, 1300, 24, 400);
  add(2160, 820, 600, 24);
  add(2160, 1676, 600, 24);
  add(2300, 980, 50, 50);
  add(2300, 1480, 50, 50);
  add(2600, 980, 50, 50);
  add(2600, 1480, 50, 50);

  // --- Ancient Forest (south of cathedral; south wall split for garden entrance) ---
  add(2160, 1760, 600, 24);
  add(2160, 1760, 24, 400);
  add(2740, 1760, 24, 400);
  add(2160, 2140, 240, 24);
  add(2480, 2140, 280, 24);

  // --- The Bridge of Floods: a stone span over the gorge to the Burning Graveyard ---
  walls.push({ x: 2764, y: 1176, w: 100, h: 24, parapet: true });
  walls.push({ x: 2764, y: 1300, w: 100, h: 24, parapet: true });
  add(2760, 820, 100, 24);     // seal the top of the gorge
  add(2760, 1676, 100, 48);    // seal the bottom of the gorge

  // --- Area 2: The Burning Graveyard (Boss 2: Father Gascoigne) ---
  add(2860, 820, 24, 380);
  add(2860, 1300, 24, 396);
  add(2860, 820, 960, 24);
  // south wall split for aqueduct descent
  add(2860, 1696, 520, 24);
  add(3460, 1696, 360, 24);
  add(3820, 820, 24, 380);
  add(3820, 1200, 24, 100, 'gascoigne_gate');
  add(3820, 1300, 24, 396);
  // interior ruins
  add(2980, 980, 24, 180);
  add(3100, 1380, 24, 200);
  add(3220, 980, 160, 24);
  add(3300, 1400, 200, 24);
  add(3480, 980, 24, 160);
  add(3560, 1450, 24, 180);
  // boss arena pillars
  add(3540, 1000, 40, 40);
  add(3540, 1500, 40, 40);
  add(3700, 1100, 40, 40);
  add(3700, 1400, 40, 40);

  // --- Passage: Area 2 -> Area 3 ---
  add(3844, 1176, 100, 24);
  add(3844, 1300, 100, 24);

  // --- Area 3: The Nightmare (Boss 3) ---
  add(3940, 820, 24, 380);
  add(3940, 1300, 24, 396);
  add(3940, 820, 560, 24);
  add(4600, 820, 460, 24);
  add(3940, 1696, 1120, 24);
  add(4060, 980, 24, 180);
  add(4140, 1380, 24, 200);
  add(4240, 980, 160, 24);
  add(4320, 1400, 200, 24);
  add(4400, 980, 24, 180);
  add(4440, 1400, 24, 200);
  add(4640, 1000, 40, 40);
  add(4640, 1500, 40, 40);
  add(4840, 1100, 40, 40);
  add(4840, 1400, 40, 40);
  add(4960, 1250, 40, 40);

  // ============ THE SOUTHERN CONTINENT (new exploration) ============

  // ---- Grand Staircase: Hub -> Sunken Necropolis ----
  add(560, 1700, 80, 560);   // west retaining wall
  add(760, 1700, 80, 560);   // east retaining wall (gap x640-760 matches hub)
  add(420, 2260, 220, 24);   // landing west
  add(800, 2260, 220, 24);   // landing east

  // ---- The Sunken Necropolis (x120-1500, y2280-3520) ----
  // south boundary (gap x700-820 to the village)
  add(120, 3520, 580, 24);
  add(820, 3520, 680, 24);
  // east divider to gardens (gap y3000-3120)
  add(1500, 2300, 24, 700);
  add(1500, 3120, 24, 400);
  // mausoleum blocks
  add(300, 2500, 120, 80);
  add(1100, 2500, 120, 80);
  add(700, 2760, 140, 90);
  add(300, 3100, 120, 80);
  add(1100, 3100, 120, 80);
  add(700, 3240, 140, 90);
  // collapsed arcade pillars
  add(440, 2860, 24, 180);
  add(960, 2860, 24, 180);
  // shortcut stair: East Corridor -> Necropolis (sealed until Vicar slain)
  add(1250, 1700, 24, 600);
  add(1370, 1700, 24, 600);
  add(1250, 2300, 144, 24, 'vicar_shortcut');

  // ---- The Abandoned Village (x120-1500, y3540-4380) ----
  add(250, 3700, 120, 100);
  add(500, 3700, 120, 100);
  add(850, 3700, 120, 100);
  add(1150, 3700, 120, 100);
  add(250, 3950, 120, 100);
  add(500, 3950, 120, 100);
  add(850, 3950, 120, 100);
  add(1150, 3950, 120, 100);
  // chapel
  add(560, 4150, 24, 200);
  add(820, 4150, 24, 200);
  add(560, 4150, 284, 24);

  // ---- The Forgotten Gardens (x1500-2800, y2200-3720) ----
  // low hedge walls
  add(1700, 2500, 200, 16);
  add(2300, 2500, 200, 16);
  add(1700, 2650, 16, 150);
  add(2384, 2650, 16, 150);
  add(1900, 2900, 16, 150);
  add(2500, 2900, 16, 150);
  // south boundary to the library (gap x2200-2320)
  add(1500, 3720, 700, 24);
  add(2320, 3720, 480, 24);

  // ---- The Ruined Library (x1600-2900, y3720-4380) ----
  add(1600, 3720, 24, 660);
  add(2876, 3720, 24, 660);
  // south wall split for the Grand Ancient Library stair (gap x2040-2160)
  add(1600, 4356, 440, 24);
  add(2160, 4356, 740, 24);
  // interior bookshelves
  add(1850, 3900, 24, 300);
  add(2150, 3900, 24, 300);
  add(2450, 3900, 24, 300);
  add(2700, 3900, 24, 300);
  // reading dais
  add(2200, 4200, 160, 24);

  // ---- The Old Aqueduct (x2900-3900, y2200-3720) ----
  // entrance framing from the graveyard south gap (x3380-3460)
  add(3340, 1700, 40, 500);
  add(3460, 1700, 40, 500);
  // channel walls
  add(2900, 2200, 24, 1520);
  add(3900, 2200, 24, 700);   // east wall (gap y2900-3020 to the cliffside)
  add(3900, 3020, 24, 700);
  add(2900, 3720, 1000, 24);  // south boundary (dead-end branch)
  // shortcut stair: graveyard passage -> aqueduct (sealed until Gascoigne slain)
  add(3820, 1700, 24, 520);
  add(3920, 1700, 24, 520);
  add(3820, 2220, 120, 24, 'gascoigne_shortcut');

  // ---- The Sunken Cathedral (x3000-3760, y3000-3700): Mire Mother's lair ----
  // An enterable cathedral ruin at the dead-end of the aqueduct.
  // North wall with a doorway (gap x3360-3420) leading in from the aqueduct.
  add(3000, 3000, 360, 24);
  add(3420, 3000, 340, 24);
  // West & east walls (the aqueduct south boundary at y3720 serves as the south wall).
  add(3000, 3000, 24, 676);
  add(3736, 3000, 24, 676);
  // Interior nave pillars
  add(3120, 3200, 36, 36);
  add(3620, 3200, 36, 36);
  add(3120, 3450, 36, 36);
  add(3620, 3450, 36, 36);
  // Drowned altar
  add(3350, 3540, 70, 24);
  // A few extra ruined blocks to fill the bare aqueduct approach
  add(3100, 2700, 120, 60);
  add(3500, 2800, 120, 60);

  // ---- The Cliffside Walkways (x3900-5000, y2200-4460) ----
  add(3900, 2200, 1160, 24, 'nightmare_gate');  // north wall (seal behind the Nightmare)
  // broken pillars lining the ravine edge
  add(4200, 2600, 24, 300);
  add(4600, 3000, 24, 300);
  add(4300, 3400, 24, 300);
  add(4400, 3800, 24, 200);
  // ---- The Cliff Watcher's hidden arena (NE Cliffside, behind a narrow path) ----
  add(4500, 2240, 24, 200);
  add(4500, 2500, 24, 80);
  add(4920, 2240, 24, 340);
  add(4500, 2240, 444, 24);
  add(4500, 2560, 444, 24);
  add(4600, 2360, 36, 36); add(4820, 2360, 36, 36);
  // south opens to the overlook (to the map border)

  // ---- Cliffside Walk: ruined structures, dead vegetation, broken carts (north) ----
  // Ruined watchtower (broken shell — open, not a sealed room)
  add(4060, 2320, 24, 80); add(4100, 2320, 24, 80); add(4060, 2300, 68, 24);
  // Dead tree grove clusters (vegetation)
  const grove2 = (cx, cy) => { add(cx - 22, cy - 6, 16, 12); add(cx + 6, cy - 6, 16, 12); add(cx - 6, cy - 22, 12, 16); add(cx - 6, cy + 10, 12, 16); };
  grove2(4200, 2500); grove2(4360, 2680); grove2(4100, 2820); grove2(4420, 2360);
  // Broken cart (a small clustered ruin)
  add(4240, 2760, 40, 16); add(4240, 2776, 16, 24); add(4264, 2776, 16, 24);
  // Collapsed archway
  add(4320, 2300, 24, 60); add(4380, 2300, 24, 60); add(4320, 2280, 84, 24);

  // ---- The Overlook Cathedral (x4100-4960, y3500-4380): the Hollow King's lair ----
  // A grand cathedral at the cliff's edge, entered through a doorway in the north wall.
  add(4100, 3500, 350, 24);
  add(4510, 3500, 450, 24);   // doorway x4450-4510
  add(4100, 4356, 860, 24);   // south wall (world border at y4460 frames the overlook)
  add(4100, 3500, 24, 856);
  add(4936, 3500, 24, 856);
  // Interior columns flanking the nave
  add(4250, 3720, 40, 40);
  add(4780, 3720, 40, 40);
  add(4250, 4020, 40, 40);
  add(4780, 4020, 40, 40);
  // Royal throne dais
  add(4480, 4200, 80, 24);
  // Broken stair leading up to the cathedral doors
  add(4380, 3460, 40, 40);
  add(4660, 3460, 40, 40);

  // ============ Lanterns ============
  const lanterns = [
    { x: 440, y: 1380, r: 240, flicker: 0.9, rest: true, name: 'The Last Lantern' },
    { x: 620, y: 1380, r: 150, flicker: 0.7 },
    { x: 620, y: 760, r: 200, flicker: 0.8 },
    { x: 620, y: 480, r: 160, flicker: 0.7 },
    { x: 620, y: 700, r: 130, flicker: 0.6 },
    { x: 1010, y: 1100, r: 150, flicker: 0.7 },
    { x: 1290, y: 1420, r: 140, flicker: 0.6 },
    { x: 1850, y: 1340, r: 190, flicker: 0.8 },
    { x: 1760, y: 1180, r: 120, flicker: 0.6 },
    { x: 1960, y: 1500, r: 120, flicker: 0.6 },
    { x: 2450, y: 1260, r: 240, flicker: 0.9 },
    { x: 2300, y: 980, r: 120, flicker: 0.5 },
    { x: 2620, y: 1480, r: 120, flicker: 0.5 },
    { x: 2450, y: 1950, r: 170, flicker: 0.7 },
    { x: 2920, y: 1280, r: 230, flicker: 0.9, rest: true, name: 'The Smoldering Lantern' },
    { x: 3120, y: 1080, r: 150, flicker: 0.7 },
    { x: 3340, y: 1500, r: 140, flicker: 0.6 },
    { x: 3660, y: 1260, r: 220, flicker: 0.8 },
    { x: 3980, y: 1280, r: 230, flicker: 0.85, rest: true, name: 'The Dreaming Lantern' },
    { x: 4180, y: 1080, r: 160, flicker: 0.7 },
    { x: 4400, y: 1480, r: 150, flicker: 0.7 },
    { x: 4800, y: 1280, r: 250, flicker: 0.9 },
    // --- Bridge of Floods (a single lantern per parapet) ---
    { x: 2820, y: 1200, r: 130, flicker: 0.8 },
    { x: 2820, y: 1300, r: 130, flicker: 0.8 },
    // --- southern continent ---
    { x: 700, y: 3200, r: 200, flicker: 0.7 },
    { x: 2200, y: 3000, r: 160, flicker: 0.6 },
    { x: 3400, y: 3000, r: 150, flicker: 0.6 },
    { x: 4500, y: 3000, r: 180, flicker: 0.7 },
    { x: 2250, y: 4050, r: 240, flicker: 0.9, rest: true, name: 'The Deep Lantern' },
    { x: 700, y: 4100, r: 160, flicker: 0.6 },
    { x: 760, y: 3900, r: 250, flicker: 0.85, rest: true, name: 'The Village Lantern' },
    { x: 2440, y: 3300, r: 150, flicker: 0.7 },
    { x: 4100, y: 4150, r: 150, flicker: 0.7 },
    // --- cathedral interiors ---
    { x: 3400, y: 3300, r: 200, flicker: 0.8, rest: true, name: 'The Drowned Lantern', lockedBoss: 'mire' },   // Sunken Cathedral (Mire Mother) — ignites when the Mire Mother falls
    { x: 4520, y: 3850, r: 200, flicker: 0.85, rest: true, name: 'The Overlook Lantern', lockedBoss: 'hollow_king' }, // Overlook Cathedral (Hollow King) — ignites when the Hollow King falls
  ];

  // ============ Enemy spawns ============
  const spawns = [
    { type: 'townsfolk', x: 620, y: 700 },
    { type: 'townsfolk', x: 600, y: 520 },
    { type: 'hound', x: 640, y: 560 },
    { type: 'villager', x: 500, y: 560 },
    { type: 'villager', x: 760, y: 640 },
    { type: 'priest', x: 620, y: 480 },
    { type: 'townsfolk', x: 460, y: 660 },
    { type: 'hound', x: 1010, y: 1180 },
    { type: 'knight', x: 1290, y: 1420 },
    { type: 'villager', x: 1200, y: 1460 },
    { type: 'crawler', x: 1720, y: 1300 },
    { type: 'crawler', x: 1980, y: 1300 },
    { type: 'knight', x: 1850, y: 1200 },
    { type: 'priest', x: 1850, y: 1480 },
    { type: 'watcher', x: 1760, y: 1380 },
    { type: 'hound', x: 2400, y: 1900 },
    { type: 'watcher', x: 2550, y: 2000 },
    { type: 'hound', x: 3000, y: 1080 },
    { type: 'hound', x: 3060, y: 1500 },
    { type: 'townsfolk', x: 3140, y: 1240 },
    { type: 'knight', x: 3260, y: 1320 },
    { type: 'priest', x: 3300, y: 1040 },
    { type: 'brute', x: 3360, y: 1520 },
    { type: 'hound', x: 3460, y: 1080 },
    { type: 'knight', x: 3620, y: 1380 },
    { type: 'villager', x: 3720, y: 1080 },
    { type: 'watcher', x: 4060, y: 1080 },
    { type: 'crawler', x: 4140, y: 1300 },
    { type: 'crawler', x: 4200, y: 1080 },
    { type: 'watcher', x: 4300, y: 1500 },
    { type: 'brute', x: 4360, y: 1100 },
    { type: 'crawler', x: 4440, y: 1300 },
    { type: 'watcher', x: 4540, y: 1100 },
    { type: 'knight', x: 4600, y: 1500 },
    // --- southern continent ---
    // Necropolis
    { type: 'townsfolk', x: 520, y: 2500 },
    { type: 'hound', x: 900, y: 2550 },
    { type: 'townsfolk', x: 1300, y: 2600 },
    { type: 'crawler', x: 500, y: 3100 },
    { type: 'crawler', x: 900, y: 3150 },
    { type: 'brute', x: 560, y: 3300 },
    { type: 'hound', x: 1300, y: 3200 },
    // Gardens
    { type: 'villager', x: 1800, y: 2600 },
    { type: 'villager', x: 2600, y: 2600 },
    { type: 'priest', x: 2200, y: 3050 },
    { type: 'hound', x: 2000, y: 3400 },
    // Aqueduct
    { type: 'crawler', x: 3100, y: 2450 },
    { type: 'crawler', x: 3600, y: 2700 },
    { type: 'watcher', x: 3200, y: 3200 },
    { type: 'crawler', x: 3500, y: 3500 },
    // Cliffside
    { type: 'watcher', x: 4200, y: 2500 },
    { type: 'hound', x: 4600, y: 2900 },
    { type: 'knight', x: 4400, y: 3400 },
    { type: 'watcher', x: 4700, y: 3700 },
    // Library
    { type: 'knight', x: 2000, y: 4000 },
    { type: 'crawler', x: 2300, y: 4150 },
    { type: 'crawler', x: 2600, y: 4000 },
    // Village
    { type: 'townsfolk', x: 420, y: 3750 },
    { type: 'townsfolk', x: 1000, y: 3800 },
    { type: 'hound', x: 700, y: 4200 },
    { type: 'townsfolk', x: 1300, y: 3950 },
    // Sunken Cathedral guardians
    { type: 'brute', x: 3140, y: 3300 },
    { type: 'crawler', x: 3600, y: 3200 },
    { type: 'crawler', x: 3140, y: 3500 },
    // Overlook Cathedral guardians
    { type: 'knight', x: 4270, y: 3800 },
    { type: 'knight', x: 4760, y: 3800 },
    { type: 'watcher', x: 4270, y: 4100 },
    // --- new archetypes (EnemySystem) — placed to tell a story per region ---
    // Ashen Square — corrupted villagers teach positioning & crowd control
    { type: 'knife_villager', x: 540, y: 620 },
    { type: 'knife_villager', x: 700, y: 540 },
    { type: 'torch_villager', x: 640, y: 680 },
    // Hollow Crypt — a Cathedral Guardian stands vigil beside a scholar
    { type: 'guardian', x: 1850, y: 1280 },
    { type: 'scholar', x: 1960, y: 1420 },
    // Cathedral of Floods — guardians & a crazed drifter haunt the nave
    { type: 'guardian', x: 2360, y: 1100 },
    { type: 'guardian', x: 2560, y: 1500 },
    { type: 'crazed_villager', x: 2480, y: 1000 },
    // Ancient Forest — the beast prowls, a fallen hunter waits beneath the trees
    { type: 'ancient_beast', x: 2320, y: 1960 },
    { type: 'fallen_hunter', x: 2580, y: 2020 },
    // Burning Graveyard — heavy cultists, a fallen hunter, and the Executioner (elite)
    { type: 'heavy_villager', x: 3020, y: 1100 },
    { type: 'heavy_villager', x: 3400, y: 1380 },
    { type: 'fallen_hunter', x: 3180, y: 1200 },
    { type: 'torch_villager', x: 3480, y: 1100 },
    { type: 'executioner', x: 3700, y: 1480 },
    // The Nightmare — scholars & hunters duel among the dream
    { type: 'scholar', x: 4080, y: 1100 },
    { type: 'scholar', x: 4480, y: 1400 },
    { type: 'fallen_hunter', x: 4680, y: 1200 },
    { type: 'ancient_beast', x: 4840, y: 1450 },
    // Necropolis — the Bell Keeper tolls among the tombs (elite)
    { type: 'guardian', x: 360, y: 2700 },
    { type: 'guardian', x: 1160, y: 2700 },
    { type: 'bell_keeper', x: 760, y: 3050 },
    // Village — corrupted villagers in the empty streets
    { type: 'knife_villager', x: 560, y: 3740 },
    { type: 'torch_villager', x: 1080, y: 3800 },
    { type: 'crazed_villager', x: 760, y: 3900 },
    { type: 'heavy_villager', x: 300, y: 4000 },
    // Gardens — a beast haunts the hedges, a scholar studies the dead roses
    { type: 'ancient_beast', x: 2050, y: 2750 },
    { type: 'scholar', x: 2300, y: 3100 },
    { type: 'fallen_hunter', x: 1900, y: 3300 },
    // Aqueduct — a beast lurks in the black water
    { type: 'ancient_beast', x: 3400, y: 3300 },
    { type: 'crazed_villager', x: 3100, y: 2700 },
    // Cliffside — hunters & the Executioner guard the overlook
    { type: 'fallen_hunter', x: 4300, y: 2700 },
    { type: 'guardian', x: 4500, y: 3200 },
    { type: 'executioner', x: 4650, y: 3900 },
    // Sunken Cathedral — guardians & the Bell Keeper (elite)
    { type: 'guardian', x: 3200, y: 3300 },
    { type: 'guardian', x: 3550, y: 3450 },
    { type: 'bell_keeper', x: 3350, y: 3200 },
    // Overlook Cathedral — the Hollow King's honor guard
    { type: 'guardian', x: 4300, y: 3750 },
    { type: 'guardian', x: 4730, y: 3750 },
    { type: 'fallen_hunter', x: 4500, y: 4000 },
    { type: 'executioner', x: 4650, y: 4200 },
    // --- stronger southern variants (late-game elites) ---
    { type: 'living_armor', x: 4400, y: 3900 },
    { type: 'rune_guardian', x: 3400, y: 3000 },
    { type: 'death_brute', x: 760, y: 3300 },
  ];

  // ============ Lore notes ============
  const notes = [
    { x: 300, y: 1380, title: 'Charred Ledger', text: '"The night the Vicar blessed the well, the rain turned black. By dawn the water ran black with it, and the children stopped screaming — not because they were soothed, but because their throats had changed. We call it the Night of the Hunt now. We did not call it anything then."' },
    { x: 620, y: 560, title: 'Wet Note', text: '"Do not drink. The rain remembers what we buried. — Sister Mire, Ashen Square"' },
    { x: 2450, y: 1950, title: 'Forest Shrine', text: '"The trees grow downward here, roots reaching for a sky that fell long ago. The Hunter who sleeps beneath them is not dead — only waiting."' },
    { x: 2920, y: 1340, title: 'The Smoldering Lantern', text: '"Lucian Veyr came this way, swearing the beasts feared fire. We watched him walk into the graveyard with his hat pulled low, and the embers followed him like hungry children."' },
    { x: 3980, y: 1340, title: 'The Dreaming Lantern', text: '"Beyond the burning yard, the dream seeps through. Those who sleep here do not wake — they rise, and the nightmare wears their skin."' },
    // --- southern continent ---
    { x: 520, y: 2400, title: 'Necropolis Plaque', text: '"Beneath the Quarter lie the older dead — those who drowned before the Vicar learned to bless the water. We built the city on their roofs, and forgot they were still beneath us."' },
    { x: 4500, y: 2400, title: 'Cliff Shrine', text: '"The road ends where the kingdom fell. Beyond this edge the valley is full of fog and bells, and the bells are not ringing — they are breathing."' },
    { x: 4480, y: 2440, title: "The Watcher's Perch", text: '"Something nests in the high stones where the cliff breaks. The hunters who came this way left offerings at the gap — a coin, a tooth, a name — so it would not look down. It looks down anyway. It has been looking down since before there was a down to look upon."' },
    { x: 2250, y: 3850, title: 'The Last Volume', text: '"They wrote everything down, hoping the page would outlast the plague. It did. The readers did not. The book is still warm."' },
    { x: 700, y: 3650, title: 'Village Threshold', text: '"We went down to the village for salt and candles. The doors were open. The suppers were cold. The prayers were still being said, though no mouth moved."' },
    { x: 2050, y: 3700, title: 'The Overlook', text: '"From here you can see the whole kingdom sink, district by district, into the thing it prayed to. The cathedral still stands. It is the only thing that still stands."' },
    { x: 1280, y: 3380, title: 'Lost Stair', text: '"The older dead were buried deep, and beneath them, deeper still, the kings sealed a thing they would not name. There was a stair, once. It is lost now. Good. Let it stay lost. Some mercies are kept only by forgetting."' },
    // --- Cliffside Walk northern ruins ---
    { x: 4140, y: 2320, title: 'Cliffside Ruin', text: '"The watchtower fell inward the night the bells started. The watchmen climbed down and walked into the fog, and the fog walked back without them. The tower stayed. It is still waiting for them to come back up."' },
    { x: 4380, y: 2640, title: "Cartwright's Last Load", text: '"The cart held salt and candles for the sanctuary. The road broke beneath it. The driver unhitched the horse and rode away on its back, and the cart has been holding its breath here ever since. The candles are still dry. Everything else is not."' },
  ];

  // ============ Guiding lights ============
  const guides = [
    { x: 1060, y: 1380, dir: 0 },
    { x: 1290, y: 1420, dir: 0 },
    { x: 1500, y: 1410, dir: 0 },
    { x: 1850, y: 1340, dir: 0 },
    { x: 2100, y: 1260, dir: 0 },
    { x: 2200, y: 1260, dir: 0 },
    { x: 2800, y: 1260, dir: 0 },
    { x: 2920, y: 1280, dir: 0 },
    { x: 3400, y: 1260, dir: 0 },
    { x: 3860, y: 1260, dir: 0 },
    { x: 3980, y: 1280, dir: 0 },
    { x: 4520, y: 1280, dir: 0 },
    // --- southern continent (pointing to descents & landmarks) ---
    { x: 700, y: 1720, dir: Math.PI / 2 },     // hub -> grand staircase down
    { x: 2440, y: 2180, dir: Math.PI / 2 },    // ancient forest -> gardens
    { x: 1300, y: 1600, dir: Math.PI / 2 },    // east corridor -> shortcut (vicar)
    { x: 3420, y: 1720, dir: Math.PI / 2 },    // graveyard -> aqueduct
    { x: 2100, y: 3700, dir: 0 },              // gardens -> library
    { x: 2250, y: 3700, dir: Math.PI / 2 },    // library entrance
    { x: 700, y: 3540, dir: Math.PI / 2 },     // necropolis -> village
    { x: 4500, y: 3950, dir: 0 },              // cliffside -> overlook
    { x: 3380, y: 2960, dir: Math.PI / 2 },     // aqueduct -> Sunken Cathedral
    { x: 4480, y: 3460, dir: Math.PI / 2 },     // cliffside -> Overlook Cathedral
  ];

  // ============ Map regions (fog-of-war + world map) ============
  // Each region: a named territory. Sectors overlapping these bounds are what
  // the fog of war reveals. Colors are earthy map-pigment tones, not gameplay.
  const regions = [
    { id: 'ashe',      name: 'Ashen Square',          x: 120,  y: 360,  w: 980,  h: 1340, color: '#6b5a44', icon: 'square' },
    { id: 'crypt',     name: 'Hollow Crypt',          x: 1640, y: 1100, w: 420,  h: 500,  color: '#5a5048', icon: 'crypt' },
    { id: 'cathedral', name: 'Cathedral of Floods',   x: 2160, y: 820,  w: 600,  h: 880,  color: '#3a4a55', icon: 'cathedral' },
    { id: 'forest',    name: 'Ancient Forest',        x: 2160, y: 1760, w: 600,  h: 400,  color: '#3e4a32', icon: 'tree' },
    { id: 'grave',     name: 'The Burning Graveyard', x: 2860, y: 820,  w: 960,  h: 900,  color: '#5a3a24', icon: 'grave' },
    { id: 'nightmare', name: 'The Nightmare',        x: 3940, y: 820,  w: 1120, h: 900,  color: '#3a1a5a', icon: 'eye' },
    { id: 'necro',     name: 'The Sunken Necropolis',  x: 120,  y: 2280, w: 1380, h: 1260, color: '#4a4458', icon: 'tomb' },
    { id: 'village',   name: 'The Abandoned Village', x: 120,  y: 3540, w: 1380, h: 860,  color: '#5a4a36', icon: 'house' },
    { id: 'gardens',   name: 'The Forgotten Gardens', x: 1500, y: 2200, w: 1300, h: 1540, color: '#445a3a', icon: 'rose' },
    { id: 'library',   name: 'The Ruined Library',    x: 1600, y: 3720, w: 1300, h: 660,  color: '#54483c', icon: 'book' },
    { id: 'aqueduct',  name: 'The Old Aqueduct',       x: 2900, y: 2200, w: 1000, h: 1540, color: '#4a4450', icon: 'arch' },
    { id: 'cliff',     name: 'The Cliffside Walkways',x: 3900, y: 2200, w: 1100, h: 2260, color: '#3a3a44', icon: 'mountain' },
    { id: 'mire_cath', name: 'The Sunken Cathedral',  x: 3000, y: 3000, w: 760,  h: 720,  color: '#2a4a4a', icon: 'cathedral' },
    { id: 'hollow_cath', name: 'The Overlook Cathedral', x: 4100, y: 3500, w: 860, h: 880, color: '#4a4a2a', icon: 'cathedral' },
  ];

  // ============ Map fragments — fewer, each charting a larger territory ============
  // Every fragment reveals 1–2 adjacent regions at once and rests at the end of
  // a hard-won exploration path or behind an optional encounter, so each one
  // feels like a milestone rather than a routine pickup.
  const fragments = [
    { id: 'old_quarter', name: 'The Old Quarter', regions: ['ashe', 'crypt'],
      x: 2000, y: 1300, hint: 'Inside the ruined chapel, behind the altar',
      desc: 'Ashen Square and the Hollow Crypt — where the first black rain fell, and the first prayers drowned beside it.' },
    { id: 'flooded_cathedral', name: 'The Flooded Cathedral', regions: ['cathedral', 'forest'],
      x: 2300, y: 2020, hint: 'At a crossroads beneath the inverted trees',
      desc: 'The Cathedral of Floods and the Ancient Forest — the Vicar\'s blessing, and what grew down into the roots beneath it.' },
    { id: 'grave', name: 'The Burning Graveyard', regions: ['grave'],
      x: 3400, y: 1480, hint: 'Inside a ruined chapel of the burning yard',
      desc: 'The Burning Graveyard — where Lucian Veyr walked into the embers, and the embers followed him home.' },
    { id: 'nightmare', name: 'The Nightmare', regions: ['nightmare'],
      x: 4900, y: 1300, hint: 'At the top of the nightmare spire',
      desc: 'The Nightmare — the dream that learned to wear the faces of the drowned, and will not wake.' },
    { id: 'sunken_necropolis', name: 'The Sunken Necropolis', regions: ['necro', 'village'],
      x: 520, y: 2920, hint: 'Beside an ancient statue in the collapsed arcade',
      desc: 'The Sunken Necropolis and the Abandoned Village — the older dead beneath the city, and the empty homes above them.' },
    { id: 'forgotten_gardens', name: 'The Forgotten Gardens', regions: ['gardens', 'library'],
      x: 2280, y: 4180, hint: 'On the reading dais of the forgotten library',
      desc: 'The Forgotten Gardens and the Ruined Library — dead roses, and the words that outlasted every reader.' },
    { id: 'old_aqueduct', name: 'The Old Aqueduct', regions: ['aqueduct', 'mire_cath'],
      x: 3600, y: 3460, hint: 'Behind the drowned altar of the Sunken Cathedral',
      desc: 'The Old Aqueduct and the Sunken Cathedral — black water that still flows, and the Mire Mother who sings it back.' },
    { id: 'cliffside', name: 'The Cliffside', regions: ['cliff', 'hollow_cath'],
      x: 4760, y: 4040, hint: 'Beside the throne of the Hollow King',
      desc: 'The Cliffside Walkways and the Overlook Cathedral — the kingdom\'s last edge, and the crown that ruled only nothing.' },
  ];

  // ============ Chests ============
  const chests = [
    { x: 760, y: 1380, type: 'bullets' },
    { x: 420, y: 560, type: 'vials' },
    { x: 1380, y: 1420, type: 'essence', ess: 250 },
    { x: 1920, y: 1380, type: 'bullets' },
    { x: 3180, y: 1480, type: 'weapon' },
    { x: 2760, y: 1320, type: 'molotovs' },
    { x: 3160, y: 1080, type: 'essence', ess: 350 },
    { x: 3500, y: 1500, type: 'bullets' },
    { x: 3880, y: 1260, type: 'weapon' },
    { x: 4240, y: 1300, type: 'vials' },
    { x: 4500, y: 1100, type: 'essence', ess: 450 },
    { x: 4980, y: 1280, type: 'weapon' },
    { x: 4100, y: 1480, type: 'key', keyId: 'forgotten_gate_key' },   // Forgotten Gate Key — opens the sealed northwest gate
    // --- southern continent ---
    { x: 520, y: 3360, type: 'essence', ess: 500 },   // guarded by the brute
    { x: 1300, y: 2500, type: 'bullets' },
    { x: 1700, y: 3400, type: 'vials' },
    { x: 2600, y: 3400, type: 'essence', ess: 650 },
    { x: 2960, y: 2450, type: 'bullets' },
    { x: 3020, y: 2500, type: 'molotovs' },
    { x: 3840, y: 2650, type: 'essence', ess: 700 },
    { x: 2960, y: 3600, type: 'vials' },
    { x: 4800, y: 4100, type: 'weapon' },   // cliffside overlook reward
    { x: 2800, y: 4250, type: 'weapon' },   // library
    { x: 1900, y: 4250, type: 'essence', ess: 900 },  // library
    { x: 1300, y: 4250, type: 'vials' },    // village
    { x: 1240, y: 4190, type: 'molotovs' }, // village
    { x: 420, y: 4250, type: 'bullets' },   // village
    // --- cathedral rewards (high-value) ---
    { x: 3050, y: 3650, type: 'essence', ess: 1000 },  // Sunken Cathedral
    { x: 3700, y: 3650, type: 'weapon' },              // Sunken Cathedral
    { x: 4150, y: 4300, type: 'essence', ess: 1200 },  // Overlook Cathedral
    { x: 4900, y: 4300, type: 'weapon' },              // Overlook Cathedral
    // --- Cliffside Walk northern ruins (small loot among the rubble) ---
    { x: 4080, y: 2360, type: 'bullets' },
    { x: 4420, y: 2740, type: 'vials' },
    { x: 4240, y: 2820, type: 'essence', ess: 600 },
  ];

  // ============ The Grand Ancient Library (southern deep) ============
  const lib = buildLibrary();
  walls.push(...lib.walls);
  lanterns.push(...lib.lanterns);
  spawns.push(...lib.spawns);
  notes.push(...lib.notes);
  guides.push(...lib.guides);
  chests.push(...lib.chests);
  regions.push(lib.region);
  fragments.push(lib.fragment);

  // ============ The Forgotten Sanctuary (central hub, south of the village) ============
  const sanc = buildSanctuary();
  walls.push(...sanc.walls);
  lanterns.push(...sanc.lanterns);
  notes.push(...sanc.notes);
  guides.push(...sanc.guides);
  chests.push(...sanc.chests);
  regions.push(sanc.region);
  fragments.push(sanc.fragment);
  const sanctuaryProps = sanc.props;

  // ============ The Drowned Sanctum (final endgame region, bottom-right) ============
  const fin = buildFinalRegion();
  walls.push(...fin.walls);
  lanterns.push(...fin.lanterns);
  spawns.push(...fin.spawns);
  notes.push(...fin.notes);
  guides.push(...fin.guides);
  chests.push(...fin.chests);
  regions.push(fin.region);
  fragments.push(fin.fragment);
  if (fin.fragments) fragments.push(...fin.fragments);

  // ============ The Hunter's Nightmare (central safe-zone hub) ============
  const hub = buildHunterNightmare();
  walls.push(...hub.walls);
  lanterns.push(...hub.lanterns);
  notes.push(...hub.notes);
  chests.push(...hub.chests);
  regions.push(hub.region);
  // The Hunter's Nightmare is home — charted from the moment the Hunt begins,
  // so it carries no Map Fragment of its own.
  sanctuaryProps.push(...hub.props);
  const hubInfo = hub.hub;

  // ============ The central mystery: ancient documents + glyphs ============
  const lore = buildLore();
  notes.push(...lore.notes);
  const glyphs = lore.glyphs;

  // ============ The Northern Expansion (optional endgame, above the backbone) ============
  const north = buildNorth();
  walls.push(...north.walls);
  lanterns.push(...north.lanterns);
  spawns.push(...north.spawns);
  notes.push(...north.notes);
  guides.push(...north.guides);
  chests.push(...north.chests);
  regions.push(...north.regions);
  fragments.push(...north.fragments);

  // ============ The Forgotten Underworld (hidden optional subterranean complex) ============
  const under = buildUnderworld();
  walls.push(...under.walls);
  lanterns.push(...under.lanterns);
  spawns.push(...under.spawns);
  notes.push(...under.notes);
  guides.push(...under.guides);
  chests.push(...under.chests);
  regions.push(...under.regions);
  fragments.push(...under.fragments);

  // ============ The Forgotten Northwest (optional mini-area behind a sealed gate) ============
  const nw = buildNorthwest();
  walls.push(...nw.walls);
  lanterns.push(...nw.lanterns);
  spawns.push(...nw.spawns);
  notes.push(...nw.notes);
  chests.push(...nw.chests);
  regions.push(...nw.regions);
  fragments.push(...nw.fragments);

  return { W, H, walls, lanterns, spawns, notes, guides, chests, regions, fragments, sanctuaryProps, glyphs, hub: hubInfo };
}