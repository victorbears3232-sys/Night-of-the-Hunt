// Doors.js — sealed doorways of the Hollow Quarter. The buildings still stand
// and a warm sliver of light still glows beneath each threshold (someone is
// home), but the knocking interaction has been removed entirely — the survivors
// behind these doors no longer answer. The doors remain as environmental
// storytelling: lit thresholds of homes the Hunter can no longer reach.

const TAU = Math.PI * 2;

// Each door: id, x, y (world-space threshold), facing (the side the door opens
// toward, for the light sliver), region. Purely visual — no interaction.
export const DOORS = [
  { id: 'ashe_hut',         x: 560,  y: 700,  facing: -Math.PI / 2, region: 'ashe' },
  { id: 'village_hut',      x: 730,  y: 3820, facing: -Math.PI / 2, region: 'village' },
  { id: 'village_manor',     x: 1080, y: 3850, facing: Math.PI / 2,  region: 'village' },
  { id: 'necro_tomb',        x: 640,  y: 3180, facing: 0,            region: 'necro' },
  { id: 'garden_greenhouse', x: 2050, y: 2750, facing: 0,            region: 'gardens' },
  { id: 'library_shop',      x: 2250, y: 4050, facing: -Math.PI / 2, region: 'library' },
  { id: 'aqueduct_gate',     x: 3150, y: 2650, facing: Math.PI,      region: 'aqueduct' },
  { id: 'cliff_camp',        x: 4300, y: 2650, facing: 0,            region: 'cliff' },
  { id: 'overlook_vestry',   x: 4300, y: 3760, facing: 0,            region: 'hollow_cath' },
];

// Draws each door as part of its building: a dark recessed frame with a faint
// warm sliver of light beneath. No knock prompt, no interaction — purely
// environmental. Only draws doors on-screen.
export function drawDoors(game, ctx) {
  const t = game.runtime;
  const camL = game.camera.x, camT = game.camera.y;
  const camR = camL + game.viewW, camB = camT + game.viewH;
  for (const d of DOORS) {
    if (d.x < camL - 60 || d.x > camR + 60 || d.y < camT - 60 || d.y > camB + 60) continue;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-9, -15, 18, 30);
    ctx.fillStyle = '#241c14'; ctx.fillRect(-9, -15, 18, 30);
    ctx.fillStyle = '#332619'; ctx.fillRect(-9, -15, 18, 4); ctx.fillRect(-9, 11, 18, 4);
    ctx.fillStyle = '#1a130d'; ctx.fillRect(-7, -13, 14, 26);
    ctx.fillStyle = '#4a4038'; ctx.fillRect(-7, -8, 14, 2); ctx.fillRect(-7, 4, 14, 2);
    // a single warm sliver of light beneath the door — someone is home
    const sliver = 0.5 + Math.sin(t * 2 + d.x) * 0.18;
    ctx.globalAlpha = 0.7 * sliver; ctx.fillStyle = '#d8a85a'; ctx.fillRect(-7, 11, 14, 2);
    ctx.globalAlpha = 0.18 * sliver;
    const g = ctx.createRadialGradient(0, 13, 1, 0, 13, 26);
    g.addColorStop(0, 'rgba(216,168,90,0.5)'); g.addColorStop(1, 'rgba(216,168,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 13, 26, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}