// HunterNightmare.js — The Hunter's Nightmare: a small, peaceful hub.
// A sealed, enemy-free dream of a hunter's refuge — just the essentials:
// the workshop forge, the rest lantern (level + travel), and the mentor.
// Reachable only by lantern travel (fully walled off from the world).

export const HUB = {
  x: 3450, y: 5060,
  lantern: { x: 3450, y: 5060, name: "The Hunter's Nightmare" },
  workshop: { x: 3280, y: 5150 },
};

export function buildHunterNightmare() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });

  // ===== Compact sealed shell (x3200-3700, y4900-5240) — a single quiet room =====
  add(3200, 4900, 500, 20);     // north
  add(3200, 5240, 500, 20);     // south
  add(3200, 4900, 20, 340);     // west
  add(3680, 4900, 20, 340);     // east

  // ===== Lanterns (the hub rest lantern + a little ambient light) =====
  const lanterns = [
    { x: 3450, y: 5060, r: 260, flicker: 0.95, rest: true, hub: true, name: "The Hunter's Nightmare" },
    { x: 3300, y: 4980, r: 110, flicker: 0.7 },
    { x: 3600, y: 5160, r: 110, flicker: 0.7 },
  ];

  // ===== Props (rendered by the Sanctuary prop renderer) =====
  const props = [];
  const P = (type, x, y, extra) => props.push({ type, x, y, ...extra });
  // The Workshop (west alcove)
  P('forge', 3260, 5120); P('anvil', 3320, 5160); P('weaponRack', 3300, 5220); P('candle', 3300, 5060);
  // A quiet memorial corner (east)
  P('statue', 3580, 5100); P('candle', 3580, 5160); P('grave', 3560, 5200);
  // Stained glass along the side walls
  for (const yy of [4960, 5060, 5160]) {
    P('stainedglass', 3200, yy, { side: 1 });
    P('stainedglass', 3680, yy, { side: -1 });
  }

  // ===== Lore note (one quiet hint toward the mentor's true nature) =====
  const notes = [
    { x: 3560, y: 5200, title: 'The Memorial', text: '"These stones remember the first Hunter — the one who built the Nightmare to keep the dark out, and the dark in. They say he never quite left. He only sat down by the lantern one evening, and stayed, and stayed, and stayed."' },
  ];

  const guides = [];

  // ===== A single supply chest =====
  const chests = [
    { x: 3640, y: 5220, type: 'vials' },
  ];

  // ===== Region + fragment =====
  const region = { id: 'hub', name: "The Hunter's Nightmare", x: 3200, y: 4900, w: 500, h: 340, color: '#3a2a3a', icon: 'cathedral', safe: true };
  const fragment = { id: 'hub', region: 'hub', x: 3560, y: 5200, hint: 'Beside the memorial stones' };

  return { walls, lanterns, notes, guides, chests, props, region, fragment, hub: HUB };
}