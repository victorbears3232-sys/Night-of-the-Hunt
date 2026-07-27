// NorthExpansion.js — the optional northern endgame expansion.
// Four interconnected regions above the main east-west backbone, reached via a
// stair from the east corridor and looping back south to the Nightmare:
//   A. The Frostbound Cathedral  — frozen cathedral + The Winter Hierophant
//   B. The Forgotten Castle       — gothic keep + The Hollow Castellan (secret boss)
//   C. The Whispering Wood       — haunted forest + The Wailing Mother
//   D. The Ash Catacombs         — tomb labyrinth (loot/lore; loops to the Nightmare)
// All optional — no main-story progression is required or changed.

export function buildNorth() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });
  const T = 24;
  const hEdge = (x, y, w, gaps) => {
    if (!gaps) return add(x, y, w, T);
    const list = Array.isArray(gaps[0]) ? gaps : [gaps];
    let cur = x;
    for (const [g0, g1] of list) { if (g0 > cur) add(cur, y, g0 - cur, T); cur = g1; }
    if (cur < x + w) add(cur, y, (x + w) - cur, T);
  };
  const vEdge = (x, y, h, gaps) => {
    if (!gaps) return add(x, y, T, h);
    const list = Array.isArray(gaps[0]) ? gaps : [gaps];
    let cur = y;
    for (const [g0, g1] of list) { if (g0 > cur) add(x, cur, T, g0 - cur); cur = g1; }
    if (cur < y + h) add(x, cur, T, (y + h) - cur);
  };
  const room = (x, y, w, h, gaps = {}) => {
    hEdge(x, y, w, gaps.n);
    hEdge(x, y + h - T, w, gaps.s);
    vEdge(x, y + T, h - 2 * T, gaps.w);
    vEdge(x + w - T, y + T, h - 2 * T, gaps.e);
  };

  // ===== Northern Approach: bound the open corridor (east-corridor gap → cathedral) =====
  add(1640, 820, 24, 280);   // extend the Crypt west wall north to seal the approach's east side

  // ============ A. THE FROSTBOUND CATHEDRAL (x1080-1980, y60-820) ============
  room(1080, 60, 900, 760, { s: [1280, 1360], e: [640, 720] });
  add(1240, 300, 36, 36); add(1700, 300, 36, 36);
  add(1240, 560, 36, 36); add(1700, 560, 36, 36);
  add(1400, 660, 120, 16); add(1500, 240, 120, 16);
  add(1460, 140, 80, 24);   // frozen altar dais (boss focal point)

  // ============ B. THE FORGOTTEN CASTLE (x2000-3220, y60-820) ============
  // Courtyard — the southern highway through the keep.
  room(2000, 600, 1220, 220, { w: [640, 720], e: [640, 720], n: [[2080, 2160], [2700, 2780], [3060, 3140]] });
  add(2160, 700, 80, 24);   // courtyard well
  // Great Hall (north-west).
  room(2000, 60, 600, 540, { s: [2080, 2160], e: [300, 380] });
  add(2120, 160, 36, 36); add(2120, 320, 36, 36);
  add(2400, 160, 36, 36); add(2400, 320, 36, 36);
  add(2280, 100, 40, 24);   // hall dais
  // Tower stair (centre).
  room(2600, 60, 300, 540, { w: [300, 380], e: [300, 380], s: [2700, 2780] });
  add(2700, 200, 100, 100); // spiral stair block
  // Treasure Room (north-east) — sealed until the Castellan falls.
  room(2900, 60, 320, 240, { s: [3060, 3140] });
  add(2980, 160, 36, 36); add(3120, 160, 36, 36);
  // Castellan's Throne Arena (centre-east).
  add(2900, 300, 160, 24); add(3060, 300, 80, 24, 'castellan_unlock'); add(3140, 300, 80, 24); // north (gated → treasure)
  hEdge(2900, 576, 320, [3060, 3140]);   // south (door to courtyard)
  vEdge(2900, 324, 252, [300, 380]);      // west (door to tower)
  vEdge(3196, 324, 252, null);            // east (sealed)
  add(3060, 520, 80, 24);   // throne dais
  add(2960, 460, 36, 36); add(3160, 460, 36, 36); // arena pillars
  // Dungeon cell (inside the courtyard's south-east corner).
  room(3000, 640, 220, 160, { w: [700, 780] });
  add(3060, 720, 24, 60);   // cell bars

  // ============ C. THE WHISPERING WOOD (x3220-4020, y60-820) ============
  room(3220, 60, 800, 760, { w: [640, 720], e: [640, 720] });
  // tree clusters (groves) + hedge walls for atmosphere and cover
  const grove = (cx, cy) => { add(cx - 22, cy - 6, 16, 12); add(cx + 6, cy - 6, 16, 12); add(cx - 6, cy - 22, 12, 16); add(cx - 6, cy + 10, 12, 16); };
  grove(3380, 300); grove(3500, 500); grove(3640, 240); grove(3380, 700); grove(3560, 700); grove(3840, 560);
  add(3720, 380, 16, 120); add(3960, 200, 16, 120);  // broken hedgerows
  // boss clearing (NE) — the Wailing Mother
  add(3780, 160, 80, 24);   // clearing shrine

  // ============ D. THE ASH CATACOMBS (x4020-5020, y60-820) ============
  room(4020, 60, 1000, 760, { w: [640, 720], s: [4500, 4600] });
  // tomb grid dividers
  vEdge(4400, 84, 716, [[150, 230], [300, 380], [560, 640]]);   // west aisle divider (added a north door so the enclosed NW tomb note is reachable)
  vEdge(4700, 84, 716, [[200, 280], [480, 560]]);   // east aisle divider
  hEdge(4044, 300, 956, [[4400, 4460], [4700, 4760]]); // mid hall divider
  // tomb pillars + niches
  add(4120, 200, 36, 36); add(4120, 460, 36, 36); add(4120, 700, 36, 36);
  add(4480, 200, 36, 36); add(4480, 460, 36, 36); add(4480, 700, 36, 36);
  add(4760, 200, 36, 36); add(4760, 460, 36, 36); add(4760, 700, 36, 36);
  add(4860, 200, 36, 36); add(4860, 460, 36, 36); add(4860, 700, 36, 36);
  add(4900, 380, 120, 24); // central catacomb altar

  // ============ Lanterns (4 rest lanterns + ambient candlelight) ============
  const lanterns = [
    // approach
    { x: 1320, y: 1000, r: 130, flicker: 0.6 },
    // cathedral
    { x: 1500, y: 620, r: 220, flicker: 0.85, rest: true, name: 'The Frost Lantern' },
    { x: 1180, y: 240, r: 130, flicker: 0.7 }, { x: 1860, y: 240, r: 130, flicker: 0.7 },
    { x: 1500, y: 740, r: 140, flicker: 0.6 },
    // castle
    { x: 2200, y: 720, r: 220, flicker: 0.85, rest: true, name: 'The Castle Lantern' },
    { x: 2100, y: 200, r: 140, flicker: 0.7 }, { x: 2400, y: 400, r: 130, flicker: 0.6 },
    { x: 2750, y: 200, r: 130, flicker: 0.6 }, { x: 3060, y: 460, r: 150, flicker: 0.7 },
    { x: 3060, y: 760, r: 130, flicker: 0.5 },
    // wood
    { x: 3500, y: 560, r: 220, flicker: 0.8, rest: true, name: 'The Wood Lantern' },
    { x: 3320, y: 300, r: 130, flicker: 0.6 }, { x: 3860, y: 300, r: 140, flicker: 0.7 },
    { x: 3600, y: 740, r: 130, flicker: 0.5 },
    // catacombs
    { x: 4240, y: 720, r: 220, flicker: 0.85, rest: true, name: 'The Catacomb Lantern' },
    { x: 4240, y: 200, r: 130, flicker: 0.6 }, { x: 4540, y: 460, r: 130, flicker: 0.6 },
    { x: 4840, y: 460, r: 140, flicker: 0.7 }, { x: 4840, y: 740, r: 130, flicker: 0.5 },
  ];

  // ============ Enemy spawns ============
  const spawns = [
    // cathedral — ice wraiths + frozen guardians
    { type: 'ice_wraith', x: 1300, y: 300 }, { type: 'ice_wraith', x: 1700, y: 560 },
    { type: 'ice_wraith', x: 1500, y: 420 }, { type: 'priest', x: 1180, y: 240 },
    { type: 'watcher', x: 1860, y: 240 }, { type: 'knight', x: 1500, y: 700 },
    // castle — fallen knights, living armor, guardians, a fallen hunter
    { type: 'fallen_knight', x: 2100, y: 200 }, { type: 'fallen_knight', x: 2400, y: 400 },
    { type: 'living_armor', x: 2750, y: 200 }, { type: 'guardian', x: 2750, y: 420 },
    { type: 'fallen_knight', x: 3060, y: 460 }, { type: 'guardian', x: 3060, y: 760 },
    { type: 'fallen_hunter', x: 2200, y: 720 }, { type: 'skeleton', x: 3100, y: 740 },
    // wood — beasts and wraiths
    { type: 'ancient_beast', x: 3380, y: 300 }, { type: 'ancient_beast', x: 3640, y: 240 },
    { type: 'ice_wraith', x: 3500, y: 500 }, { type: 'fallen_hunter', x: 3860, y: 560 },
    { type: 'hound', x: 3380, y: 700 }, { type: 'hound', x: 3560, y: 700 },
    // catacombs — skeletons, a watcher, and the Death Brute (elite)
    { type: 'skeleton', x: 4120, y: 200 }, { type: 'skeleton', x: 4480, y: 200 },
    { type: 'skeleton', x: 4120, y: 460 }, { type: 'skeleton', x: 4480, y: 700 },
    { type: 'skeleton', x: 4760, y: 200 }, { type: 'skeleton', x: 4860, y: 700 },
    { type: 'watcher', x: 4840, y: 460 }, { type: 'death_brute', x: 4900, y: 380 },
  ];

  // ============ Lore notes (tie to the Night of the Hunt) ============
  const notes = [
    { x: 1320, y: 1000, title: 'The Northern Road', text: '"The road north was the first road we built, and the first we forgot. When the rain turned, the families who lived on it sealed the gates and climbed into the cold. We did not climb after them. We did not want to know what they became."' },
    { x: 1500, y: 740, title: 'Frozen Litany', text: '"The Hierophant would not let the fire die. He banked the cathedral coals with snow, and prayed the cold would keep the water out. The cold kept everything out, including mercy."' },
    { x: 1500, y: 200, title: 'The Ice Altar', text: '"He blessed the frost as we had blessed the flood. The prayer was the same prayer, spoken through a different mouth. The cold answers as the water answers — slowly, and to all of you at once."' },
    { x: 2280, y: 100, title: 'The Castellan\'s Vow', text: '"I held the keep against the rain, and then against the drowned, and then against the thing the drowned became. I held it until there was no one left to hold it for. A vow outlasts its reason. I am still holding."' },
    { x: 3060, y: 760, title: 'Cell Ledger', text: '"The prisoners begged to be let out when the water rose. The Castellan let the water in instead, and bricked the door behind it. He said a prison is a promise, and a promise is a kind of mercy. The cells have been quiet for a long time. They are not quiet now."' },
    { x: 3060, y: 180, title: 'Sealed Treasury', text: '"The Castellan sealed his own vault from the outside and threw the key into the well. Whatever is in there, he decided the world did not deserve it, and the world did not argue. Slay him, and the seal remembers it was only stone."' },
    { x: 3500, y: 740, title: 'The Wailing', text: '"She came into the wood to give birth away from the water. The water found her anyway. What she bore in the wood is still crying, and the crying is not a child\'s, and it is not hers anymore, and the wood will not stop listening."' },
    { x: 3860, y: 300, title: 'The Shrine in the Clearing', text: '"Do not answer the wailing. It is asking for its name back. It gave its name to the water the night the rain turned, and the water has been wearing it ever since."' },
    { x: 4240, y: 200, title: 'Catacomb Plaque', text: '"We buried the first dead here, before the Vicar blessed the water, before there was anything to be blessed against. We thought the dead would be safe underground. We were right. It is the living who are not safe down here."' },
    { x: 4900, y: 740, title: 'The Last Rite', text: '"The Brute was a gravedigger who dug one grave too many and climbed in to wait. He has been waiting for someone to bury him for a very long time. Be kind. He only wants to be finished."' },
  ];

  // ============ Guiding lights ============
  const guides = [
    { x: 1320, y: 820, dir: -Math.PI / 2 },   // approach → cathedral
    { x: 1500, y: 820, dir: -Math.PI / 2 },    // cathedral entrance
    { x: 1900, y: 680, dir: 0 },               // cathedral → castle
    { x: 3100, y: 680, dir: 0 },               // castle → wood
    { x: 4000, y: 680, dir: 0 },               // wood → catacombs
    { x: 4550, y: 820, dir: Math.PI / 2 },     // catacombs → nightmare shortcut
  ];

  // ============ Chests ============
  const chests = [
    // cathedral
    { x: 1180, y: 560, type: 'vials' },
    { x: 1860, y: 560, type: 'bullets' },
    { x: 1500, y: 760, type: 'essence', ess: 800 },
    // castle (treasure room — gated behind the Castellan)
    { x: 2980, y: 200, type: 'charm', charmId: 'iron_will' },
    { x: 3120, y: 200, type: 'weapon' },
    { x: 3050, y: 240, type: 'essence', ess: 1500 },
    // wood
    { x: 3320, y: 300, type: 'bullets' },
    { x: 3600, y: 740, type: 'vials' },
    { x: 3860, y: 300, type: 'essence', ess: 1100 },
    // catacombs (the big reward)
    { x: 4840, y: 740, type: 'essence', ess: 2000 },
    { x: 4840, y: 200, type: 'weapon' },
    { x: 4540, y: 740, type: 'vials' },
    { x: 4480, y: 460, type: 'molotovs' },
  ];

  // ============ Regions + Fragments (fog-of-war + world map) ============
  const regions = [
    { id: 'frost_cath', name: 'The Frostbound Cathedral', x: 1080, y: 60, w: 900, h: 760, color: '#3a5a78', icon: 'cathedral' },
    { id: 'castle', name: 'The Forgotten Castle', x: 2000, y: 60, w: 1220, h: 760, color: '#4a4a52', icon: 'castle' },
    { id: 'whisper_wood', name: 'The Whispering Wood', x: 3220, y: 60, w: 800, h: 760, color: '#2a4a2a', icon: 'tree' },
    { id: 'ash_catacombs', name: 'The Ash Catacombs', x: 4020, y: 60, w: 1000, h: 760, color: '#4a3a2a', icon: 'tomb' },
  ];
  // Two fragments chart the four northern regions in meaningful pairs, each
  // placed deep within its territory rather than at the first step inside.
  const fragments = [
    { id: 'frostbound_north', name: 'The Frostbound North', regions: ['frost_cath', 'castle'],
      x: 2360, y: 740, hint: 'Near the old well in the castle courtyard',
      desc: 'The Frostbound Cathedral and the Forgotten Castle — the cold that kept the water out, and the vow that outlasted its reason.' },
    { id: 'whispering_north', name: 'The Whispering North', regions: ['whisper_wood', 'ash_catacombs'],
      x: 4840, y: 440, hint: 'At the central catacomb altar',
      desc: 'The Whispering Wood and the Ash Catacombs — the wailing that will not stop, and the first dead kept safe underground.' },
  ];

  return { walls, lanterns, spawns, notes, guides, chests, regions, fragments };
}