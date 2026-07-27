// FinalRegion.js — The Drowned Sanctum: the sealed endgame region in the
// bottom-right corner of the world. A vast, quiet ruin of monumental
// architecture, broken statues, a giant bridge over an abyss, a crumbling
// cathedral, and the final arena (The First Voice). Sealed behind the
// ancient 'final_gate' until every major Guardian has fallen.

export const GATE = { x: 4020, y: 5080 };
export const REGION = { x: 3896, y: 4600, w: 1168, h: 1720 };

export function buildFinalRegion() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });

  // ---- Approach: grand stair descending from the cliffside (north) ----
  add(3896, 4460, 24, 600);   // west retaining wall
  add(4120, 4460, 24, 600);   // east retaining wall

  // ---- The Sealed Gate (spans the corridor at the threshold) ----
  add(3920, 5060, 200, 40, 'final_gate');

  // ---- Outer shell of The Drowned Sanctum ----
  add(3896, 5100, 24, 24);            // NW corner
  add(4120, 5100, 916, 24);           // north wall (gap = the gate)
  add(3896, 5124, 24, 1172);          // west wall
  add(5036, 5124, 24, 1172);          // east wall
  add(3896, 6296, 1168, 24);          // south wall

  // ---- First Court: broken monuments & statues ----
  add(4200, 5300, 40, 80);
  add(4700, 5400, 40, 80);
  add(4400, 5520, 40, 80);
  add(3960, 5380, 36, 70);
  // collapsed colonnade
  add(4300, 5200, 24, 120);
  add(4800, 5260, 24, 100);

  // ---- Giant bridge over the abyss (north->south span) ----
  walls.push({ x: 4360, y: 5600, w: 24, h: 300, parapet: true });
  walls.push({ x: 4640, y: 5600, w: 24, h: 300, parapet: true });

  // ---- The Crumbling Cathedral / Final Arena (south end) ----
  add(4200, 5900, 200, 24);           // north wall west of doorway
  add(4640, 5900, 260, 24);           // north wall east of doorway (gap x4400-4640 = bridge arrival)
  add(4200, 5900, 24, 396);           // west wall
  add(4876, 5900, 24, 396);           // east wall
  // nave pillars
  add(4320, 6050, 40, 40);
  add(4760, 6050, 40, 40);
  add(4320, 6200, 40, 40);
  add(4760, 6200, 40, 40);
  // throne dais
  add(4480, 6240, 100, 24);

  // ---- Side sepulchre (SW corner) — the Warden's vigil ----
  add(3960, 5900, 24, 280);
  add(4100, 5900, 24, 280);
  add(3960, 6176, 128, 24);

  const lanterns = [
    { x: 4200, y: 5350, r: 240, flicker: 0.9, rest: true, name: 'The Final Lantern' },
    { x: 4500, y: 5750, r: 160, flicker: 0.7 },
    { x: 4550, y: 6000, r: 200, flicker: 0.85 },
    { x: 4320, y: 6200, r: 150, flicker: 0.6 },
    { x: 4760, y: 6200, r: 150, flicker: 0.6 },
    { x: 4020, y: 6050, r: 150, flicker: 0.6 },
  ];

  const spawns = [
    // First Court — mixed endgame pack
    { type: 'rune_guardian', x: 4200, y: 5200 },
    { type: 'pale_hunter', x: 4700, y: 5300 },
    { type: 'void_scholar', x: 4400, y: 5450 },
    { type: 'crypt_beast', x: 3980, y: 5500 },
    { type: 'phantom', x: 4800, y: 5450 },
    // Bridge — a titan holds the crossing
    { type: 'titan', x: 4500, y: 5750 },
    // Cathedral approach
    { type: 'death_brute', x: 4400, y: 5950 },
    { type: 'rune_guardian', x: 4720, y: 6000 },
    { type: 'phantom', x: 4100, y: 5800 },
    // Cathedral interior — the honor guard
    { type: 'pale_hunter', x: 4380, y: 6150 },
    { type: 'pale_hunter', x: 4720, y: 6150 },
    { type: 'void_scholar', x: 4550, y: 6220 },
    { type: 'crypt_beast', x: 4550, y: 6050 },
    // SW sepulchre — the optional mini-boss
    { type: 'the_warden', x: 4020, y: 6050 },
  ];

  const notes = [
    { x: 4040, y: 5200, title: 'The Sealed Word', text: '"We sealed the last of the Chorus behind this gate, and we sealed the gate with the deaths of its own. Only when every fallen Guardian has been silenced may the lock turn. We did not trust ourselves to open it."' },
    { x: 4500, y: 5750, title: 'Bridge Inscription', text: '"The bridge leads down, not across. Below it there is no floor — only the place where the city first learned to sing, and first learned what the singing cost."' },
    { x: 4550, y: 6240, title: 'The Throne', text: '"Here sat the First Voice, the one who taught the water to sing. It has not moved in a thousand years. It does not need to move. It has only to remember, and the remembering is enough to drown us."' },
    { x: 4020, y: 6050, title: "The Warden's Vow", text: '"I am the last guard, and I will not let you pass while I breathe. The thing behind me is not a god — it is the answer to a question we should never have asked. If you are strong enough to kill me, you are strong enough to silence it. I hope you are not."' },
    { x: 4800, y: 5450, title: 'Final Record', text: '"The Chorus was never a weapon. It was a mourning — a grief older than the stone. The city drowned itself to quiet it, and drowned the drowned, and drowned them again. The Hunter who reaches this depth will understand, or will not return."' },
  ];

  const guides = [
    { x: 4000, y: 4440, dir: Math.PI / 2 },   // cliffside -> approach down
    { x: 4020, y: 5000, dir: Math.PI / 2 },   // toward the sealed gate
    { x: 4500, y: 5600, dir: Math.PI / 2 },   // bridge -> cathedral
  ];

  const chests = [
    { x: 4820, y: 5300, type: 'weapon' },                 // First Court
    { x: 4100, y: 6200, type: 'essence', ess: 2200 },    // Warden's sepulchre
    { x: 4380, y: 6240, type: 'vials' },                  // cathedral
    { x: 4720, y: 6240, type: 'bullets' },               // cathedral
    { x: 4700, y: 5200, type: 'essence', ess: 2000 },    // hidden alcove
    { x: 4900, y: 6200, type: 'weapon' },                 // cathedral reward
  ];

  const region = { id: 'final', name: 'The Drowned Sanctum', x: 3896, y: 4600, w: 1168, h: 1720, color: '#2a2438', icon: 'cathedral', gate: { x: 4020, y: 5080 } };
  const fragment = { id: 'final', region: 'final', name: 'The Drowned Sanctum', desc: 'The sealed endgame ruin where the First Voice taught the water to sing — a monument to a mourning older than the stone.', x: 4750, y: 5160, hint: 'In a hidden alcove of the First Court, behind the broken monuments' };

  // ---- The Drowned Vestibule: an optional exploration wing off the First
  // Court's north-east. A flooded robing chamber with its own guardians, lore,
  // hidden treasure in a sealed alcove, and a one-way shortcut gate back to the
  // bridge so the Hunter need not retrace the whole court. Entered from the
  // First Court (doorway y5180-5260); an internal stair (x4900-4960) drops to a
  // lower chamber, which opens south into a hidden reliquary alcove. ----
  add(4760, 5140, 276, 24);                 // north wall
  add(4760, 5140, 24, 40);                  // west wall above the entrance
  add(4760, 5260, 24, 340);                 // west wall below the entrance (doorway y5180-5260)
  add(4760, 5600, 24, 200);                 // lower west wall
  add(4760, 5800, 24, 60, 'vestibule_shortcut');  // shortcut gate (opens from inside)
  add(4760, 5860, 24, 40);                  // lower west wall below the gate
  add(4784, 5600, 116, 24);                 // upper/lower divider (doorway x4900-4960 = stair down)
  add(4960, 5600, 76, 24);
  add(4840, 5300, 40, 40); add(5000, 5300, 40, 40);  // upper nave pillars
  add(4840, 5750, 40, 40); add(5000, 5750, 40, 40);  // lower pillars
  lanterns.push(
    { x: 4900, y: 5400, r: 160, flicker: 0.7 },
    { x: 4900, y: 5750, r: 150, flicker: 0.6 },
    { x: 4960, y: 6150, r: 140, flicker: 0.6 },
  );
  spawns.push(
    { type: 'void_scholar', x: 4840, y: 5300 },
    { type: 'phantom', x: 5000, y: 5400 },
    { type: 'crypt_beast', x: 4900, y: 5700 },
    { type: 'pale_hunter', x: 4960, y: 6150 },
  );
  notes.push(
    { x: 4820, y: 5220, title: 'Vestibule Plaque', text: '"This wing was the choir\'s robing room before it was the flood\'s. They dressed the singers here, then sent them down to the bridge to sing the city asleep. When the singing turned, the robing room turned with it. The robes are still here. They are wearing them."' },
    { x: 4920, y: 5660, title: 'The Shortcut Door', text: '"A workman\'s gate, cut through the outer wall so the choristers could reach the bridge without walking the whole court. It opens only from inside — the Index mistrusted anything that could find its own way out. Open it, and the long way round becomes the short way back."' },
    { x: 4960, y: 6240, title: 'The Drowned Reliquary', text: '"What the choristers could not sing, they hid: the relics of the first voices, locked in the deepest alcove where the water could not reach. The water reached. It reaches everything, in the end. But the reliquary held, and what is inside is still dry, and still singing very quietly to itself."' },
  );
  chests.push(
    { x: 4820, y: 5450, type: 'vials' },
    { x: 5000, y: 5750, type: 'bullets' },
    { x: 4960, y: 6200, type: 'weapon' },                 // hidden treasure (alcove)
  );
  guides.push(
    { x: 4760, y: 5220, dir: 0 },                        // First Court -> vestibule entrance
    { x: 4920, y: 5640, dir: Math.PI / 2 },               // stair down to the lower vestibule
  );
  // A Map Fragment for the new wing — collecting it charts the whole Sanctum.
  const fragment2 = { id: 'drowned_vestibule', region: 'final', name: 'The Drowned Vestibule', desc: 'A flooded robing wing off the First Court, where the choir dressed before it drowned. Its reliquary still holds the dry things the water could not reach.', x: 4840, y: 6150, hint: 'In the drowned reliquary, the deepest alcove of the vestibule' };

  return { walls, lanterns, spawns, notes, guides, chests, region, fragment, fragments: [fragment2] };
}