// Sanctuary.js — The Forgotten Sanctuary: a safe central hub cathedral.
// Connected to the Abandoned Village through the old chapel. No enemies spawn
// here; it holds the rest shrine (home), a map table, a blacksmith's forge,
// an archive, a healing shrine, and a memorial garden. Props are rendered by
// HuntGame._drawSanctuaryProps so they sit in world space with the architecture.

export function buildSanctuary() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });

  // ===== Outer shell (x60-1500, y4400-6360) =====
  add(60, 4400, 24, 1960);      // outer west
  // outer east — split for the Library shortcut gate (opens from the Library side)
  add(1500, 4400, 24, 640);
  add(1500, 5040, 24, 100, 'sanctuary_library_gate');
  add(1500, 5140, 24, 1220);
  add(60, 6300, 1440, 24);      // south wall (world border sits just below)

  // ===== Entrance Hall (x300-1200, y4400-4700) — gap x700-820 from the village chapel =====
  add(300, 4400, 400, 24);  add(820, 4400, 380, 24);
  add(300, 4700, 400, 24);  add(820, 4700, 380, 24);
  add(300, 4400, 24, 300);
  add(1200, 4400, 24, 300);

  // ===== Central Courtyard (x300-1200, y4700-5400) =====
  add(300, 4700, 24, 300);  add(300, 5120, 24, 280);   // west wall (gap y5000-5120 -> workshop)
  add(1200, 4700, 24, 300); add(1200, 5120, 24, 280);   // east wall (gap y5000-5120 -> archive)
  add(300, 5400, 400, 24);  add(820, 5400, 380, 24);   // south wall (gap x700-820 -> healing)

  // ===== Upgrade Workshop (x60-300, y4700-5400) =====
  add(60, 4700, 244, 24);
  add(60, 5400, 90, 24);  add(230, 5400, 74, 24);   // gap x150-230 -> SW alcove

  // ===== Archive (x1200-1500, y4700-5400) =====
  add(1200, 4700, 300, 24);
  add(1200, 5400, 120, 24);  add(1400, 5400, 100, 24);   // gap x1320-1400 -> SE alcove

  // ===== Healing Shrine (x300-1200, y5400-6200) =====
  add(300, 5400, 24, 800);
  add(1200, 5400, 24, 800);
  add(300, 6200, 400, 24);  add(820, 6200, 380, 24);   // south (gap x700-820 -> garden)

  // ===== Memorial Garden (x300-1200, y6200-6300) =====
  add(300, 6200, 24, 30);  add(300, 6270, 24, 30);  // gap y6230-6270 -> SW alcove opens into the Memorial Garden
  add(1200, 6200, 24, 30);  add(1200, 6270, 24, 30);  // gap y6230-6270 -> SE alcove opens into the Memorial Garden

  // ===== Lanterns (rest shrines + candle clusters) =====
  const lanterns = [
    { x: 750, y: 5120, r: 290, flicker: 0.9, rest: true, name: 'The Sanctuary Shrine' },
    { x: 750, y: 5800, r: 250, flicker: 0.8, rest: true, name: 'The Mended Light' },
    { x: 380, y: 4550, r: 110, flicker: 0.6 }, { x: 1120, y: 4550, r: 110, flicker: 0.6 },
    { x: 450, y: 4800, r: 95, flicker: 0.6 }, { x: 1050, y: 4800, r: 95, flicker: 0.6 },
    { x: 450, y: 5300, r: 95, flicker: 0.6 }, { x: 1050, y: 5300, r: 95, flicker: 0.6 },
    { x: 140, y: 5360, r: 130, flicker: 0.7 },
    { x: 1350, y: 5350, r: 130, flicker: 0.7 }, { x: 1280, y: 4820, r: 80, flicker: 0.5 },
    { x: 450, y: 5600, r: 100, flicker: 0.6 }, { x: 1050, y: 5600, r: 100, flicker: 0.6 },
    { x: 450, y: 6000, r: 100, flicker: 0.6 }, { x: 1050, y: 6000, r: 100, flicker: 0.6 },
    { x: 400, y: 6250, r: 85, flicker: 0.5 },
    { x: 180, y: 5800, r: 130, flicker: 0.7 },
    { x: 1380, y: 5800, r: 130, flicker: 0.7 },
  ];

  // ===== Props (rendered by HuntGame._drawSanctuaryProps) =====
  const props = [];
  const P = (type, x, y, extra) => props.push({ type, x, y, ...extra });
  // Courtyard
  P('shrine', 750, 5050);
  P('mapTable', 560, 5280);
  P('fountain', 750, 4760);
  P('statue', 420, 4760); P('statue', 1080, 4760);
  P('arch', 750, 4700); P('arch', 750, 5400);
  P('pillar', 380, 4900); P('pillar', 380, 5200);
  P('pillar', 1120, 4900); P('pillar', 1120, 5200);
  P('candle', 450, 4800); P('candle', 1050, 4800); P('candle', 450, 5300); P('candle', 1050, 5300);
  // Workshop
  P('forge', 140, 4900); P('anvil', 230, 4970); P('weaponRack', 180, 5300); P('candle', 150, 5360);
  // Archive
  P('bookshelf', 1280, 4820); P('bookshelf', 1280, 5020); P('bookshelf', 1280, 5220);
  P('bookshelf', 1380, 4820); P('bookshelf', 1380, 5020);
  P('relicPedestal', 1350, 5180); P('candle', 1350, 5350);
  // Healing shrine
  P('fountain', 750, 5520);
  P('healShrine', 750, 5770);
  P('bench', 500, 5720); P('bench', 1000, 5720);
  P('candle', 450, 5600); P('candle', 1050, 5600); P('candle', 450, 6000); P('candle', 1050, 6000);
  // Memorial garden
  P('greatTree', 1120, 6240);
  P('grave', 400, 6250); P('grave', 560, 6250); P('grave', 720, 6250); P('grave', 880, 6250);
  P('candle', 400, 6250);
  // SW & SE alcoves (opened from the workshop and the archive)
  P('grave', 220, 6150); P('candle', 150, 5900);
  P('grave', 1340, 6150); P('candle', 1410, 5900);
  // Stained glass along the outer nave walls
  for (const yy of [4700, 4900, 5200, 5500, 5800, 6100]) {
    P('stainedglass', 60, yy, { side: 1 });
    P('stainedglass', 1500, yy, { side: -1 });
  }
  P('stainedglass', 500, 4400, { side: 1 });
  P('stainedglass', 950, 4400, { side: -1 });

  // ===== Lore notes =====
  const notes = [
    { x: 750, y: 4550, title: 'Sanctuary Threshold', text: '"They built this place to bury a god — not to worship one. When the rain came, the god held the roof up with its sleeping hands, and so the Sanctuary stood while the kingdom slid into the sea."' },
    { x: 560, y: 5280, title: 'The Map Table', text: 'A great oak table scarred with charcoal lines. Every road the Hunters walked is etched here, and every road ends at a lantern. "We chart the dark so that others may walk it by our light."' },
    { x: 750, y: 5700, title: 'Mended Inscription', text: 'Carved beside the healing shrine: "Kneel, and the Sanctuary will give back a little of what the Quarter took. It is old, and it is kind, and it is the only kindness left that does not lie."' },
    { x: 720, y: 6250, title: 'The Memorial', text: '"These stones remember the first Hunters — the ones who built the Sanctuary before the Vicar blessed the water. They drowned on dry land, praying to a god they had already buried. We keep their names here, because the Index must not."' },
    { x: 180, y: 6000, title: 'Sealed Alcove Inscription', text: '"They walled us in here when the singing started — the craftsmen who built the shrine. We asked to stay, to guard the forge and the silence. The door was bricked shut behind us. We are still keeping the silence. We are still guarding the forge."' },
    { x: 1450, y: 5090, title: 'The Sealed Archive Door', text: '"The east door of the Archive opens onto the great Library — or did, before the Library fell silent. The lock turns only from the far side. The craftsmen built it thus so that nothing that learned to read in the Library could walk out uninvited. Go and read, and let yourself back in."' },
  ];

  // ===== Guiding lights =====
  const guides = [
    { x: 750, y: 4360, dir: Math.PI / 2 },
    { x: 750, y: 4680, dir: Math.PI / 2 },
    { x: 400, y: 5050, dir: Math.PI },
    { x: 1100, y: 5050, dir: 0 },
    { x: 750, y: 5380, dir: Math.PI / 2 },
  ];

  // ===== Chests (gentle hub supplies) =====
  const chests = [
    { x: 150, y: 5360, type: 'vials' },
    { x: 1380, y: 5360, type: 'bullets' },
    { x: 180, y: 5850, type: 'essence', ess: 800 },
    { x: 1380, y: 5850, type: 'vials' },
  ];

  // ===== Region + fragment =====
  const region = { id: 'sanctuary', name: 'The Forgotten Sanctuary', x: 60, y: 4400, w: 1440, h: 1960, color: '#4a4030', icon: 'cathedral' };
  const fragment = { id: 'sanctuary', region: 'sanctuary', name: 'The Forgotten Sanctuary', desc: "The safe cathedral at the kingdom's heart — built to bury a god, not worship one. It held the roof up while the kingdom slid into the sea.", x: 1120, y: 6250, hint: 'In the overgrown memorial garden, beneath the broken arch' };

  return { walls, lanterns, notes, guides, chests, region, fragment, props };
}