// Library.js — The Grand Ancient Library: a vast, non-linear exploration region.
// Monumental gothic library beneath the Ruined Library. Towering shelves,
// enormous reading halls, dusty archives, abandoned study chambers, secret
// passages, and a circular archive boss arena (The Archivist) at its heart.

export function buildLibrary() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });
  const T = 24;

  // Edge-wall helpers supporting multiple doorway gaps per edge.
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

  // ===== Entrance Stairway (descends from the Ruined Library gap x2040-2160) =====
  add(1960, 4380, 80, 120);
  add(2160, 4380, 80, 120);

  // ===== Vestibule (x1900-2300, y4500-4880) =====
  room(1900, 4500, 400, 380, { n: [2040, 2160], s: [2040, 2160] });
  add(1940, 4560, 40, 40);
  add(2220, 4560, 40, 40);

  // ===== Great Reading Hall (x1500-2500, y4900-5600) — monumental central hall =====
  // West edge moved to x1500 to share the Forgotten Sanctuary's east wall, so
  // the Library no longer overlaps the Sanctuary. (The old West Wing that sat
  // on top of the Sanctuary courtyard has been removed.)
  room(1500, 4900, 1000, 700, {
    n: [2040, 2160],
    e: [[5100, 5200], [5400, 5500]],
    s: [1740, 1860],
    w: [5040, 5140],   // doorway to the Sanctuary shortcut gate
  });
  // towering shelf pillars flanking the nave
  add(1620, 5060, 40, 240);
  add(2280, 5060, 40, 240);
  add(1620, 5360, 40, 160);
  add(2280, 5360, 40, 160);
  // long broken reading tables
  add(1600, 5180, 400, 24);
  add(1600, 5320, 400, 24);
  add(1600, 5180, 24, 164);
  add(1976, 5180, 24, 164);
  // fallen shelf (environmental storytelling)
  add(1620, 5440, 200, 60);

  // ===== West Wing removed — it overlapped the Forgotten Sanctuary (x60-1500),
  // walling off the Sanctuary's courtyard, map table, workshop, and shrine. The
  // Library now begins at x1500 (sharing the Sanctuary's east wall). The Map
  // Fragment that lived here was relocated to the East Wing. =====

  // ===== East Wing: Study Chambers (x2500-3000, y4900-5600) =====
  // 2 columns x 3 rows of studies plus a southern aisle. West doorways align
  // with the Great Reading Hall; every chamber has a wide (>=60px) doorway so
  // none are sealed off, and a central colonnade links the two columns per row.
  room(2500, 4900, 500, 700, { w: [[5100, 5200], [5400, 5500]], s: [2700, 2780] });
  // horizontal dividers (y5100 / 5300 / 5500): left doorway x2524-2600, right doorway x2800-2880
  add(2600, 5100, 200, 24); add(2880, 5100, 96, 24);
  add(2600, 5300, 200, 24); add(2880, 5300, 96, 24);
  add(2600, 5500, 200, 24); add(2880, 5500, 96, 24);
  // central colonnade (x2724) with a doorway per row (y5000-5060 / 5200-5260 / 5400-5460)
  add(2724, 4924, 24, 76);
  add(2724, 5060, 24, 140);
  add(2724, 5260, 24, 140);
  add(2724, 5460, 24, 116);
  // collapsed section (debris) in the SE study room
  add(2800, 5400, 40, 80);

  // ===== Descending Passage (Great Hall -> Circular Archive) =====
  add(1720, 5760, 24, 40);
  add(1880, 5760, 24, 40);

  // ===== The Circular Archive (boss arena, x1500-2300, y5800-6360) — deepest point =====
  // West wall moved to x1500 to share the Sanctuary's east wall, so the archive
  // no longer intrudes into the Sanctuary's SE alcove.
  room(1500, 5800, 800, 560, { n: [1720, 1880], e: [6080, 6160] });
  // ring of stone pillars
  add(1600, 5950, 36, 36); add(2100, 5950, 36, 36);
  add(1600, 6200, 36, 36); add(2100, 6200, 36, 36);
  add(1780, 5880, 36, 36); add(1780, 6260, 36, 36);
  // central index pedestal
  add(1760, 6080, 80, 80);

  // ===== South Cloister — a hallway connecting the Great Hall and East Wing
  // along the south, turning them into an explorable loop. Its south wall has a
  // gap that descends to the Circular Archive, and a gated stair down to the
  // Index Vault, so the archive can be reached from either wing. =====
  hEdge(1500, 5760, 1500, [[1720, 1880], [2900, 2960]]);  // south wall (archive descent + sealed east stair)
  add(1500, 5576, 24, 184);                  // west end of the cloister (Sanctuary east wall bounds it)
  add(2976, 5576, 24, 184);                  // east end of the cloister
  // fallen columns for atmosphere and cover
  add(2400, 5660, 36, 36);

  // ===== Hidden Reading Room (east end of the cloister) — sealed behind a
  // narrow gap in the dividing wall; holds a forgotten volume and a cache. =====
  add(2800, 5576, 24, 124);                   // dividing wall upper (hidden gap below)
  add(2800, 5740, 24, 20);                    // dividing wall lower (gap y5700-5740)

  // ===== Post-Archivist Chamber: the Index Vault (sealed until slain) =====
  // A wing east of the Circular Archive, fully walled off until the gate
  // 'archivist_unlock' opens on the Archivist's defeat. Reached via a gated
  // door in the archive's east wall and a gated stair up to the cloister, it
  // turns the boss room into an explorable loop with a shortcut back up.
  add(2900, 5760, 60, 24, 'archivist_unlock');   // east stair: cloister -> Index Vault
  add(2276, 6080, 24, 80, 'archivist_unlock');   // archive east door -> Index Vault

  // ---- Index Vault (x2300-2976, y5760-6360): the sealed east wing ----
  add(2976, 5760, 24, 600);     // east wall
  add(2300, 6336, 676, 24);     // south wall
  // index pedestals & broken display cases
  add(2400, 5900, 36, 36);
  add(2400, 6180, 36, 36);
  add(2600, 6000, 160, 24);
  add(2820, 5900, 24, 180);
  add(2620, 6220, 200, 24);

  // ============ Lanterns (candlelight throughout) ============
  const lanterns = [
    { x: 1950, y: 4600, r: 130, flicker: 0.7 },
    { x: 2250, y: 4600, r: 130, flicker: 0.7 },
    { x: 2100, y: 4800, r: 150, flicker: 0.8 },
    { x: 1800, y: 5000, r: 200, flicker: 0.9 },
    { x: 1400, y: 5000, r: 140, flicker: 0.6 },
    { x: 2200, y: 5000, r: 140, flicker: 0.6 },
    { x: 1800, y: 5250, r: 180, flicker: 0.8 },
    { x: 1400, y: 5500, r: 140, flicker: 0.6 },
    { x: 2200, y: 5500, r: 140, flicker: 0.6 },
    { x: 2600, y: 5000, r: 130, flicker: 0.6 },
    { x: 2900, y: 5000, r: 130, flicker: 0.6 },
    { x: 2600, y: 5200, r: 130, flicker: 0.5 },
    { x: 2900, y: 5400, r: 130, flicker: 0.5 },
    { x: 2600, y: 5500, r: 130, flicker: 0.5 },
    { x: 1800, y: 5700, r: 140, flicker: 0.7 },
    { x: 1800, y: 5900, r: 200, flicker: 0.9, rest: true, name: 'The Archive Lantern', lockedBoss: 'archivist' },
    { x: 1600, y: 6100, r: 150, flicker: 0.7 },
    { x: 2150, y: 6100, r: 150, flicker: 0.7 },
    { x: 1800, y: 6280, r: 150, flicker: 0.7 },
    // --- South Cloister ---
    { x: 2400, y: 5680, r: 130, flicker: 0.5 },
    // --- Hidden Reading Room ---
    { x: 2880, y: 5660, r: 130, flicker: 0.6 },
    // --- Index Vault (post-Archivist) ---
    { x: 2500, y: 6050, r: 150, flicker: 0.6 },
    { x: 2820, y: 6220, r: 130, flicker: 0.5 },
  ];

  // ============ Enemy spawns (scholarly guardians) ============
  const spawns = [
    { type: 'watcher', x: 1400, y: 5050 },
    { type: 'watcher', x: 2200, y: 5050 },
    { type: 'knight', x: 1800, y: 5250 },
    { type: 'priest', x: 1600, y: 5400 },
    { type: 'knight', x: 2000, y: 5400 },
    { type: 'watcher', x: 2600, y: 5000 },
    { type: 'knight', x: 2900, y: 5000 },
    { type: 'crawler', x: 2600, y: 5200 },
    { type: 'knight', x: 2900, y: 5400 },
    { type: 'watcher', x: 2560, y: 5540 },
    { type: 'crawler', x: 1800, y: 5700 },
    // --- new archetypes: scholarly guardians & the Librarian Guardian (elite) ---
    { type: 'scholar', x: 1400, y: 5200 },
    { type: 'scholar', x: 2200, y: 5350 },
    { type: 'guardian', x: 1800, y: 5100 },
    { type: 'fallen_hunter', x: 2820, y: 5200 },
    { type: 'librarian', x: 1800, y: 5950 },
    { type: 'librarian', x: 1600, y: 6150 },
    // --- South Cloister patrol ---
    { type: 'guardian', x: 2400, y: 5680 },
    // --- Hidden Reading Room ---
    { type: 'scholar', x: 2880, y: 5700 },
    // --- Index Vault (post-Archivist guardians) ---
    { type: 'librarian', x: 2550, y: 6150 },
    { type: 'scholar', x: 2750, y: 6250 },
  ];

  // ============ Lore notes (environmental storytelling) ============
  const notes = [
    { x: 2100, y: 4700, title: 'Admission Roll', text: '"The Library accepts all who seek knowledge, and keeps them. No scholar has left these halls in three hundred years. We thought this a blessing."' },
    { x: 2600, y: 5500, title: 'Final Entry', text: '"I hear the shelves moving in the dark. They rearrange themselves when no one watches. The Library is learning the shape of us, and when it has learned enough, it will close like a book."' },
    { x: 1800, y: 5950, title: 'The Index', text: 'Carved into the pedestal in letters that hurt to look at: "I REMEMBER EVERY WORD EVER WRITTEN HERE. I REMEMBER EVERY HAND THAT WROTE THEM. I AM STILL HUNGRY."' },
    { x: 1800, y: 5700, title: 'The Cloister', text: '"When the stacks grew too tall we built the cloister to walk between them. Now the shelves walk it for us. We do not go south after dark — the Index remembers footsteps, and it remembers ours."' },
    { x: 2880, y: 5640, title: 'The Last Reading', text: '"We sealed this room from the inside to finish the work. The Index cannot read what it cannot see. If you are reading this, the seal held longer than we did. Take the volume — it is the only one that argues back."' },
    { x: 2550, y: 6150, title: 'The Index Vault', text: '"Every name the drowning took, the Index kept. Here are the originals, written in hands that no longer have arms. Do not read your own name aloud. If it is already on these pages, it is already too late for the door to save you."' },
    { x: 1600, y: 5090, title: 'The Sanctuary Door', text: '"Beyond this door lies the Sanctuary — the last kind place. The Index could not read it, and so it sealed the door against it. Open it from this side, and the Archive and the Library become one road again."' },
  ];

  // ============ Guiding lights ============
  const guides = [
    { x: 2100, y: 4880, dir: Math.PI / 2 },
    { x: 1800, y: 5580, dir: Math.PI / 2 },
    { x: 2700, y: 5660, dir: Math.PI },
    // --- South Cloister: guide to the archive descent ---
    { x: 1800, y: 5740, dir: Math.PI / 2 },
  ];

  // ============ Chests ============
  const chests = [
    { x: 1800, y: 5250, type: 'bullets' },
    { x: 2600, y: 5000, type: 'vials' },
    { x: 2900, y: 5200, type: 'essence', ess: 1000 },
    { x: 2600, y: 5400, type: 'weapon' },
    { x: 2900, y: 5440, type: 'essence', ess: 1200 },
    { x: 1600, y: 6250, type: 'essence', ess: 1400 },  // archive reward
    { x: 2150, y: 6250, type: 'weapon' },              // archive reward
    // --- South Cloister ---
    { x: 2400, y: 5720, type: 'vials' },
    // --- Hidden Reading Room ---
    { x: 2920, y: 5720, type: 'essence', ess: 1600 },
    // --- Index Vault (post-Archivist rewards) ---
    { x: 2350, y: 6300, type: 'essence', ess: 2200 },
    { x: 2920, y: 6300, type: 'vials' },
  ];

  // ============ Region + Fragment ============
  const region = { id: 'library', name: 'The Grand Ancient Library', x: 1300, y: 4500, w: 1700, h: 1860, color: '#3a3328', icon: 'book' };
  const fragment = { id: 'library', region: 'library', name: 'The Grand Ancient Library', desc: 'The great library the Index kept — every name the drowning took, written in hands that no longer have arms. The words outlasted every reader.', x: 2560, y: 5560, hint: 'In the dust of the east study chambers, beneath the fallen volumes' };

  return { walls, lanterns, spawns, notes, guides, chests, region, fragment };
}