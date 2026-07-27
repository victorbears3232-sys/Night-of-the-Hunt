// Northwest.js — an optional forgotten mini-area tucked into the unused top-left
// corner of the map, sealed behind an iron gate that opens only with the
// Forgotten Gate Key (found in a chest within The Nightmare). Inside: the
// missing northwest map fragment (in its own chest), a new charm, a large
// essence cache, and weapon upgrade materials. Fully optional — no main-story
// progression touches it, and no existing structures are moved.

export function buildNorthwest() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });

  // The chamber occupies the empty top-left corner (x40-976, y40-360), entered
  // through the sealed iron gate set into the Ashen Square's north gap
  // (x660-720, y360). The existing Ashen Square north wall already covers
  // x300-660 and x720-944 at y360; the chamber's own south wall fills the rest.
  add(40, 360, 260, 24);                       // x40-300 (west of the Ashen Square north wall)
  add(660, 360, 60, 24, 'forgotten_gate');     // the sealed iron gate
  add(944, 360, 56, 24);                       // x944-1000 (east of the Ashen Square north wall)
  // East wall (the chamber's east boundary; the Frostbound Cathedral sits beyond).
  add(976, 40, 24, 320);                       // x976-1000, y40-360
  // (North & west are sealed by the world's outer border.)

  // ---- environmental decoration: forgotten frostbound ruins ----
  add(100, 80, 36, 36); add(900, 80, 36, 36);      // corner pillars
  add(100, 300, 36, 36); add(900, 300, 36, 36);
  add(480, 60, 40, 24);                           // broken statue base
  add(460, 200, 80, 24);                          // crumbled altar
  add(300, 250, 40, 16); add(620, 250, 40, 16);   // rubble heaps

  // ============ Lanterns (a single cold ambient candle at the altar) ============
  const lanterns = [
    { x: 500, y: 180, r: 150, flicker: 0.6 },
  ];

  // ============ Enemy spawns (a few frozen guardians) ============
  const spawns = [
    { type: 'ice_wraith', x: 200, y: 200 },
    { type: 'ice_wraith', x: 820, y: 200 },
    { type: 'fallen_hunter', x: 500, y: 260 },
  ];

  // ============ Lore notes ============
  const notes = [
    { x: 500, y: 120, title: 'The Forgotten Gate', text: '"They walled this corner off before the rain turned, and sealed the gate with a key they then threw into the dream. We asked why. They said some corners should be left to the cold. We did not ask again. The cold has been polite about it, at least."' },
  ];

  // ============ Guiding lights ============
  const guides = [];

  // ============ Chests ============
  const chests = [
    { x: 200, y: 140, type: 'fragment', fragmentId: 'forgotten_northwest' },   // the missing map fragment, in its own chest
    { x: 820, y: 140, type: 'shards', amt: 10 },                                // weapon upgrade materials
    { x: 500, y: 300, type: 'essence', ess: 15000 },                           // a forgotten cache
  ];

  // ============ Region + Fragment (fog-of-war + world map) ============
  const regions = [
    { id: 'forgotten_nw', name: 'The Forgotten Northwest', x: 40, y: 40, w: 936, h: 320, color: '#2a3a4a', icon: 'ruin' },
  ];
  const fragments = [
    { id: 'forgotten_northwest', name: 'The Forgotten Northwest', regions: ['forgotten_nw'],
      x: 200, y: 140, hint: 'In a chest beyond the forgotten gate', inChest: true,
      desc: 'A lost corner the kingdom bricked away before the rain turned — kept by the cold, and by a key thrown into the dream.' },
  ];

  return { walls, lanterns, spawns, notes, guides, chests, regions, fragments };
}