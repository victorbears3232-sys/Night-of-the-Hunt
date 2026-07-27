// EnvDetails.js — environmental storytelling props.
// Subtle, static world details that communicate what happened in each district
// during the Night of the Hunt: barricaded streets, burned homes, hunter camps,
// abandoned research, bloodstains, makeshift graves, broken statues.
//
// Pure visual — drawn in world space inside the camera translate, after the
// environment props and before interactive objects. No gameplay effect. Each
// detail is placed to read as part of its region's history; the player pieces
// the story together by walking through it.

import * as EnvDressing from './EnvDressing.js';

const TAU = Math.PI * 2;

// A curated set of detail props per region. Kept sparse on purpose — a few
// per district, so each one carries weight. Types map to draw routines below.
const DETAILS = [
  // ---- Ashen Square: where the blessing was first drunk ----
  { x: 620, y: 540, type: 'brokenStatue', label: 'saint' },      // toppled saint in the square
  { x: 300, y: 640, type: 'barricade', facing: 0 },            // boarded alley mouth
  { x: 880, y: 700, type: 'burnedHome' },                      // a home that drank the rain
  { x: 540, y: 480, type: 'bloodstain', r: 26 },

  // ---- Cathedral of Floods: the cover-up ----
  { x: 2300, y: 980, type: 'brokenStatue', label: 'bishop' },  // a bishop struck down
  { x: 2620, y: 1480, type: 'bloodstain', r: 30 },
  { x: 2240, y: 1500, type: 'grave' },                         // a grave before the altar
  { x: 2540, y: 1040, type: 'barricade', facing: Math.PI / 2 },

  // ---- The Burning Graveyard: Gascoigne's last camp ----
  { x: 2960, y: 1040, type: 'hunterCamp' },                    // a dead fire, spent vials
  { x: 3300, y: 1380, type: 'burnedHome' },
  { x: 3120, y: 980, type: 'grave' },
  { x: 3500, y: 980, type: 'bloodstain', r: 24 },

  // ---- The Nightmare: abandoned research ----
  { x: 4080, y: 980, type: 'research' },                       // scholars who studied the dream
  { x: 4460, y: 1500, type: 'brokenStatue', label: 'faceless' },
  { x: 4840, y: 1280, type: 'bloodstain', r: 28 },

  // ---- The Sunken Necropolis: the older dead ----
  { x: 440, y: 2700, type: 'brokenStatue', label: 'weeping' },
  { x: 960, y: 3100, type: 'grave' },
  { x: 700, y: 3300, type: 'bloodstain', r: 22 },
  { x: 1100, y: 3160, type: 'brokenStatue', label: 'king' },

  // ---- The Abandoned Village: the cold suppers ----
  { x: 460, y: 3900, type: 'barricade', facing: 0 },
  { x: 1100, y: 3950, type: 'burnedHome' },
  { x: 760, y: 4050, type: 'brokenStatue', label: 'mother' },
  { x: 420, y: 3750, type: 'grave' },

  // ---- The Forgotten Gardens: overgrown research ----
  { x: 1900, y: 2750, type: 'research' },                     // the botanist's last notes
  { x: 2400, y: 3300, type: 'brokenStatue', label: 'maiden' },
  { x: 2050, y: 3300, type: 'grave' },

  // ---- The Ruined Library: the last readers ----
  { x: 2000, y: 4000, type: 'research' },
  { x: 2600, y: 4150, type: 'bloodstain', r: 22 },
  { x: 2300, y: 4250, type: 'brokenStatue', label: 'scholar' },

  // ---- The Old Aqueduct: the black water ----
  { x: 3200, y: 2700, type: 'hunterCamp' },                    // a healer's abandoned kit
  { x: 3500, y: 3300, type: 'bloodstain', r: 30 },
  { x: 3100, y: 2500, type: 'research' },

  // ---- The Cliffside Walkways: the last hunt ----
  { x: 4400, y: 2700, type: 'hunterCamp' },
  { x: 4300, y: 3400, type: 'grave' },
  { x: 4600, y: 3000, type: 'brokenStatue', label: 'hunter' },

  // ---- The Overlook Cathedral: the hollow court ----
  { x: 4250, y: 3720, type: 'brokenStatue', label: 'saint' },   // toppled saints in the nave
  { x: 4780, y: 3720, type: 'brokenStatue', label: 'saint' },
  { x: 4500, y: 4000, type: 'bloodstain', r: 28 },
  { x: 4250, y: 4020, type: 'grave' },

  // ---- The Sunken Cathedral (Mire): the drowned choir ----
  { x: 3120, y: 3200, type: 'brokenStatue', label: 'choir' },
  { x: 3620, y: 3450, type: 'bloodstain', r: 24 },
];

export function drawEnvDetails(game, ctx) {
  EnvDressing.drawWorld(game, ctx);
  const t = game.runtime;
  const camL = game.camera.x, camT = game.camera.y;
  const camR = camL + game.viewW, camB = camT + game.viewH;
  for (const d of DETAILS) {
    if (d.x < camL - 80 || d.x > camR + 80 || d.y < camT - 80 || d.y > camB + 80) continue;
    ctx.save();
    ctx.translate(d.x, d.y);
    switch (d.type) {
      case 'barricade': drawBarricade(ctx, d); break;
      case 'burnedHome': drawBurnedHome(ctx, d); break;
      case 'hunterCamp': drawHunterCamp(ctx, d, t); break;
      case 'research': drawResearch(ctx, d, t); break;
      case 'bloodstain': drawBloodstain(ctx, d, t); break;
      case 'grave': drawGrave(ctx, d); break;
      case 'brokenStatue': drawBrokenStatue(ctx, d, t); break;
    }
    ctx.restore();
  }
}

// ---- Barricaded street: stacked planks nailed across a passage ----
function drawBarricade(ctx, d) {
  ctx.rotate(d.facing || 0);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-26, -6, 52, 12);
  // crossbeams
  ctx.fillStyle = '#3a2a1a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-24, -5 + i * 3, 48, 2.5);
  }
  // nails
  ctx.fillStyle = '#5a4a3a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-18 + i * 12, -5 + i * 3, 2, 2.5);
    ctx.fillRect(8 + i * 6, -5 + i * 3, 2, 2.5);
  }
  // a plank torn loose, hanging
  ctx.fillStyle = '#2a1c12';
  ctx.save(); ctx.translate(16, 4); ctx.rotate(0.3);
  ctx.fillRect(-2, -1, 14, 2.5); ctx.restore();
}

// ---- Burned home: a charred, collapsed roof-line and soot ----
function drawBurnedHome(ctx, d) {
  // rubble mound
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(0, 4, 22, 8, 0, 0, TAU); ctx.fill();
  // collapsed walls
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(-18, -6, 36, 12);
  ctx.fillStyle = '#241a12';
  ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-14, -14); ctx.lineTo(14, -14); ctx.lineTo(18, -6); ctx.closePath(); ctx.fill();
  // charred beam ends
  ctx.fillStyle = '#0e0a08';
  ctx.fillRect(-12, -12, 3, 8);
  ctx.fillRect(8, -12, 3, 8);
  // soot halo
  ctx.fillStyle = 'rgba(20,12,8,0.4)';
  ctx.beginPath(); ctx.ellipse(0, -10, 26, 14, 0, 0, TAU); ctx.fill();
  // a faint ember still glowing
  ctx.fillStyle = 'rgba(200,80,30,0.5)';
  ctx.beginPath(); ctx.arc(-6, 2, 1.4, 0, TAU); ctx.fill();
}

// ---- Hunter camp: a dead fire, spent vials, a bedroll ----
function drawHunterCamp(ctx, d, t) {
  // bedroll
  ctx.fillStyle = '#2a2218';
  ctx.fillRect(-18, -2, 22, 10);
  ctx.fillStyle = '#3a3024';
  ctx.fillRect(-18, -2, 22, 2);
  // dead fire ring
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(8, 6, 12, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1208';
  ctx.beginPath(); ctx.ellipse(8, 6, 9, 4, 0, 0, TAU); ctx.fill();
  // ash + a last ember
  ctx.fillStyle = '#3a2a1a';
  for (let i = 0; i < 5; i++) { ctx.fillRect(4 + i * 2, 4 + (i % 2), 1.5, 1.5); }
  const ember = 0.4 + Math.sin(t * 3 + d.x) * 0.3;
  ctx.fillStyle = `rgba(220,90,30,${ember})`;
  ctx.beginPath(); ctx.arc(9, 6, 1.2, 0, TAU); ctx.fill();
  // spent blood vials, drained
  ctx.fillStyle = '#4a1010';
  ctx.fillRect(-6, 8, 2, 4); ctx.fillRect(-2, 9, 2, 4);
  // a forsaken weapon (broken hilt)
  ctx.strokeStyle = '#5a5048'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(20, -8); ctx.stroke();
}

// ---- Abandoned research: scattered notes, an apparatus, a cold lantern ----
function drawResearch(ctx, d, t) {
  // a low desk / lectern
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(-2, 4, 18, 6);
  ctx.fillStyle = '#241c14';
  ctx.fillRect(-12, -4, 24, 8);
  ctx.fillStyle = '#332619';
  ctx.fillRect(-12, -4, 24, 2);
  // scattered pages
  ctx.fillStyle = '#c9b890';
  ctx.save(); ctx.translate(-16, 6); ctx.rotate(-0.4); ctx.fillRect(-3, -2, 6, 4); ctx.restore();
  ctx.save(); ctx.translate(14, 8); ctx.rotate(0.3); ctx.fillRect(-3, -2, 6, 4); ctx.restore();
  // a glass apparatus (cracked beaker)
  ctx.strokeStyle = 'rgba(180,200,220,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(2, -10); ctx.lineTo(6, -10); ctx.lineTo(6, -4); ctx.stroke();
  ctx.fillStyle = 'rgba(150,90,200,0.25)';
  ctx.fillRect(2, -7, 4, 3);
  // a cold lantern (unlit)
  ctx.fillStyle = '#1a140e';
  ctx.fillRect(-16, -6, 3, 8);
  ctx.fillStyle = 'rgba(120,120,140,0.3)';
  ctx.beginPath(); ctx.arc(-14.5, -8, 2, 0, TAU); ctx.fill();
}

// ---- Bloodstain: a dark, long-dried pool ----
function drawBloodstain(ctx, d, t) {
  const r = d.r || 24;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
  g.addColorStop(0, 'rgba(40,6,6,0.75)'); g.addColorStop(0.7, 'rgba(28,4,4,0.5)'); g.addColorStop(1, 'rgba(20,2,2,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); ctx.fill();
  // a drag smear
  ctx.strokeStyle = 'rgba(40,6,6,0.35)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(0, r * 0.4, r * 0.8, r * 0.2); ctx.stroke();
  // spatter flecks
  ctx.fillStyle = 'rgba(50,8,8,0.4)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + d.x;
    ctx.fillRect(Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.7, 2, 2);
  }
}

// ---- Make-shift grave: a small mound with a marker ----
function drawGrave(ctx, d) {
  // mound
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 4, 12, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a221a';
  ctx.beginPath(); ctx.ellipse(0, 2, 11, 5, 0, 0, TAU); ctx.fill();
  // marker stone (leaning)
  ctx.save(); ctx.translate(-2, -6); ctx.rotate(-0.12);
  ctx.fillStyle = '#3a3328';
  ctx.fillRect(-3, 0, 6, 12);
  ctx.fillStyle = '#4a4234';
  ctx.fillRect(-3, 0, 6, 2);
  // a carved cross or seal, worn smooth
  ctx.strokeStyle = 'rgba(20,16,10,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-1.5, 4); ctx.lineTo(1.5, 4); ctx.moveTo(0, 2); ctx.lineTo(0, 7); ctx.stroke();
  ctx.restore();
}

// ---- Broken statue: a toppled, headless stone figure ----
function drawBrokenStatue(ctx, d, t) {
  // pedestal base, cracked
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-10, 6, 20, 4);
  ctx.fillStyle = '#2c2a26';
  ctx.fillRect(-9, 2, 18, 6);
  ctx.fillStyle = '#3a3834';
  ctx.fillRect(-9, 2, 18, 2);
  // the fallen figure, on its side
  ctx.save(); ctx.translate(0, -6); ctx.rotate(0.5);
  ctx.fillStyle = '#332f2a';
  ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.fill();
  // cloak folds
  ctx.strokeStyle = 'rgba(20,18,14,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(8, -2); ctx.moveTo(-6, 4); ctx.lineTo(6, 0); ctx.stroke();
  // the broken-off head, resting nearby
  ctx.fillStyle = '#3a3630';
  ctx.beginPath(); ctx.arc(-14, 4, 4, 0, TAU); ctx.fill();
  ctx.restore();
  // moss / age
  ctx.fillStyle = 'rgba(60,80,50,0.25)';
  ctx.beginPath(); ctx.arc(4, -2, 3, 0, TAU); ctx.fill();
}