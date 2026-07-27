// BossRender.js — boss figure drawing, extracted from HuntGame to keep the
// engine file lean. Each boss is a fully designed, imposing gothic figure with
// layered clothing/armor, glowing eyes, signature weapons, and ambient FX.
// Phase transitions visibly transform the silhouette.

import * as Endgame from './Endgame.js';
import * as Underworld from './Underworld.js';
import * as Celestial from './CelestialEnding.js';
import { drawPaleWraith, drawWinterHierophant, drawWailingMother, drawCliffWatcher } from './SecretBosses.js';
import { drawCastellan } from './MountedBoss.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Soft radial glow helper.
function radGlow(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const s of stops) g.addColorStop(s[0], s[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r1, 0, TAU); ctx.fill();
}

// Jagged tattered cloak hem — a row of hanging points below a cloak.
function tatteredHem(ctx, cx, cy, w, h, color, segs = 7) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = cx - w + t * w * 2;
    const drop = (i % 2 === 0) ? h : h * 0.5;
    ctx.lineTo(x, cy + drop);
  }
  ctx.lineTo(cx + w, cy);
  ctx.closePath(); ctx.fill();
}

export function drawBoss(game, ctx) {
  const b = game.boss;
  if (!b) return;
  const ia = (b._introAlpha !== undefined) ? b._introAlpha : 1;
  if (ia < 1) { ctx.save(); ctx.globalAlpha = ia; }
  if (b.type === 'final') Endgame.drawFinal(game, ctx, b);
  else if (b.type === 'gascoigne') drawGascoigne(game, ctx, b);
  else if (b.type === 'nightmare') drawNightmare(game, ctx, b);
  else if (b.type === 'mire') drawMireMother(game, ctx, b);
  else if (b.type === 'hollow_king') drawHollowKing(game, ctx, b);
  else if (b.type === 'archivist') drawArchivist(game, ctx, b);
  else if (b.type === 'pale_wraith') drawPaleWraith(game, ctx, b);
  else if (b.type === 'winter_hierophant') drawWinterHierophant(game, ctx, b);
  else if (b.type === 'hollow_castellan') drawCastellan(game, ctx, b);
  else if (b.type === 'wailing_mother') drawWailingMother(game, ctx, b);
  else if (b.type === 'cliff_watcher') drawCliffWatcher(game, ctx, b);
  else if (b.type === 'under_guardian') Underworld.drawGuardian(game, ctx, b);
  else if (b.type === 'celestial') Celestial.drawCelestial(game, ctx, b);
  else drawVicar(game, ctx, b);
  if (ia < 1) ctx.restore();
}

// ============================================================ THE DROWNED VICAR
// A drowned, waterlogged priest risen from the cathedral flood: sodden layered
// vestments, a barnacle-crusted mitre, a glowing crozier, dripping water.
function drawVicar(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  // ground shadow + spreading puddle
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(40,70,90,0.28)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.7, b.r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const p2 = b.phase >= 2;
  const robe = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#2a3850' : '#344048';
  const robeShade = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#1c2a40' : '#222c34';
  const glow = p2 ? '#5ad0ff' : '#8accd6';

  // dripping water
  if (Math.random() < 0.3) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r, y: b.y + b.r * 0.4, vx: 0, vy: 40, life: 0.6, max: 0.6, r: 2, color: 'rgba(120,170,200,0.5)' });

  // aura (phase 2 — the tide returns)
  if (p2) { radGlow(ctx, 0, 0, 4, b.r * 2.1, [[0, 'rgba(70,150,210,0.22)'], [1, 'rgba(70,150,210,0)']]); }

  // layered sodden robes
  ctx.fillStyle = robeShade; ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 1.35, b.r * 1.65, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, b.r * 0.05, b.r * 1.15, b.r * 1.45, 0, 0, TAU); ctx.fill();
  // wet sheen
  ctx.fillStyle = 'rgba(120,170,190,0.10)'; ctx.beginPath(); ctx.ellipse(-b.r * 0.3, b.r * 0.1, b.r * 0.5, b.r * 1.2, 0, 0, TAU); ctx.fill();
  // tattered hem
  tatteredHem(ctx, 0, b.r * 1.1, b.r * 1.15, b.r * 0.5, robeShade, 8);
  // leather strap across chest
  ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-b.r * 0.7, -b.r * 0.2); ctx.lineTo(b.r * 0.6, b.r * 0.5); ctx.stroke();
  // gaunt torso
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#c8d4dc' : '#aeb8c0';
  ctx.beginPath(); ctx.ellipse(b.r * 0.15, b.r * 0.1, b.r * 0.55, b.r * 0.85, 0, 0, TAU); ctx.fill();
  // long arms in wet sleeves
  ctx.strokeStyle = robe; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.1, b.r * 0.2); ctx.lineTo(b.r * 0.9, b.r * 0.55); ctx.stroke();

  // neck + gaunt head
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#c0ccd4' : '#9aa6ae';
  ctx.fillRect(-b.r * 0.06, -b.r * 0.45, b.r * 0.12, b.r * 0.4);
  ctx.beginPath(); ctx.ellipse(b.r * 0.2, -b.r * 0.55, b.r * 0.42, b.r * 0.5, 0, 0, TAU); ctx.fill();
  // hollow glowing eyes
  const eg = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(140,220,235,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.35, -b.r * 0.62, 2.6, 0, TAU); ctx.arc(b.r * 0.5, -b.r * 0.5, 2.6, 0, TAU); ctx.fill();
  // dripping maw
  ctx.strokeStyle = 'rgba(40,60,70,0.8)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(b.r * 0.3, -b.r * 0.4); ctx.lineTo(b.r * 0.55, -b.r * 0.42); ctx.stroke();

  // barnacle-crusted mitre (tall pointed bishop hat)
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#2a3a4a' : '#3a2a2a';
  ctx.beginPath(); ctx.moveTo(b.r * 0.2 - b.r * 0.45, -b.r * 0.85); ctx.lineTo(b.r * 0.2, -b.r * 1.55); ctx.lineTo(b.r * 0.2 + b.r * 0.45, -b.r * 0.85); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.5; ctx.stroke();
  // barnacle crusts
  ctx.fillStyle = flash ? '#fff' : '#6a7a7a';
  for (let i = 0; i < 5; i++) { const bx = b.r * 0.2 - b.r * 0.3 + i * b.r * 0.15; ctx.beginPath(); ctx.arc(bx, -b.r * 0.95 - (i % 2) * 6, 2.4, 0, TAU); ctx.fill(); }
  // mitre glow gem
  ctx.fillStyle = flash ? '#fff' : `rgba(140,220,235,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.2, -b.r * 1.25, 3, 0, TAU); ctx.fill();

  // crozier (bishop staff) with glowing head
  ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.7, b.r * 0.7); ctx.lineTo(b.r * 1.5, -b.r * 1.1); ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : glow; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(b.r * 1.5, -b.r * 1.35, b.r * 0.28, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  radGlow(ctx, b.r * 1.5, -b.r * 1.35, 1, b.r * 0.5, [[0, `rgba(140,220,235,${0.5 * eg})`], [1, 'rgba(140,220,235,0)']]);
  ctx.restore();
}

// ============================================================ FATHER GASCOIGNE
// Phase 1: a towering cloaked hunter dragging a massive axe. Phase 2: the beast.
function drawGascoigne(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;

  if (b.phase === 1) {
    // embers
    if (Math.random() < 0.25) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 2, y: b.y - b.r, vx: (Math.random() - 0.5) * 20, vy: -rand(20, 60), life: 0.8, max: 0.8, r: 1.6, color: '#e07020' });
    // long tattered coat, dragging
    ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#2a1a14';
    ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 1.3, b.r * 1.6, 0, 0, TAU); ctx.fill();
    tatteredHem(ctx, 0, b.r * 1.2, b.r * 1.25, b.r * 0.7, flash ? '#fff' : '#1a0e08', 9);
    // coat front
    ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#3a2418';
    ctx.beginPath(); ctx.ellipse(0, 0, b.r * 0.95, b.r * 1.25, 0, 0, TAU); ctx.fill();
    // leather straps + buckles
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-b.r * 0.5, -b.r * 0.3); ctx.lineTo(b.r * 0.5, b.r * 0.2); ctx.stroke();
    ctx.fillStyle = '#8a7050'; for (let i = 0; i < 3; i++) { ctx.fillRect(b.r * (-0.4 + i * 0.35), -b.r * 0.15 + i * b.r * 0.18, 5, 4); }
    // shoulders
    ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#22140c';
    ctx.beginPath(); ctx.ellipse(-b.r * 0.8, -b.r * 0.1, b.r * 0.4, b.r * 0.5, 0, 0, TAU); ctx.fill();
    // weathered face
    ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#b89878';
    ctx.beginPath(); ctx.ellipse(b.r * 0.25, -b.r * 0.35, b.r * 0.45, b.r * 0.5, 0, 0, TAU); ctx.fill();
    // beard
    ctx.fillStyle = flash ? '#fff' : '#2a1a10'; ctx.beginPath(); ctx.ellipse(b.r * 0.28, -b.r * 0.1, b.r * 0.3, b.r * 0.35, 0, 0, TAU); ctx.fill();
    // tricorn hat
    ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.ellipse(b.r * 0.2, -b.r * 0.7, b.r * 1.05, b.r * 0.34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#14100a'; ctx.beginPath(); ctx.ellipse(b.r * 0.2, -b.r * 0.78, b.r * 0.55, b.r * 0.24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.moveTo(b.r * 0.2, -b.r * 0.95); ctx.lineTo(b.r * 0.5, -b.r * 1.3); ctx.lineTo(b.r * 0.0, -b.r * 1.05); ctx.closePath(); ctx.fill();
    // one burning amber eye under the brim
    const eg = 0.6 + Math.sin(t * 5) * 0.4;
    ctx.fillStyle = flash ? '#fff' : `rgba(255,150,40,${eg})`;
    ctx.beginPath(); ctx.arc(b.r * 0.42, -b.r * 0.55, 2.8, 0, TAU); ctx.fill();
    radGlow(ctx, b.r * 0.42, -b.r * 0.55, 1, b.r * 0.4, [[0, `rgba(255,140,40,${0.4 * eg})`], [1, 'rgba(255,140,40,0)']]);
    // massive axe dragged behind, blade on the ground
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.r * 0.5, b.r * 0.4); ctx.lineTo(-b.r * 1.3, b.r * 0.7); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#7a8499';
    ctx.beginPath(); ctx.moveTo(-b.r * 1.3, b.r * 0.4); ctx.lineTo(-b.r * 1.7, b.r * 0.2); ctx.lineTo(-b.r * 1.75, b.r * 0.85); ctx.lineTo(-b.r * 1.25, b.r * 1.0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 1.5; ctx.stroke();
    // sparks where blade scrapes stone
    if (Math.random() < 0.2) game.particles.push({ x: b.x - Math.cos(b.facing) * b.r * 1.6, y: b.y + b.r * 0.8, vx: rand(-40, 40), vy: -rand(40, 120), life: 0.25, max: 0.25, r: 1.6, color: '#ffd9a0', spark: true });
  } else {
    // ---- the beast: hunched werewolf, tattered coat, claws ----
    const fur = flash ? '#fff' : stag ? '#9aa0ff' : '#3a2418';
    const furD = flash ? '#fff' : stag ? '#9aa0ff' : '#241610';
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, b.r * 0.25, b.r * 1.4, b.r * 1.6, 0, 0, TAU); ctx.fill();
    // matted fur ridges
    ctx.strokeStyle = furD; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const yy = -b.r * 0.6 + i * b.r * 0.32; ctx.beginPath(); ctx.moveTo(-b.r * 0.9, yy); ctx.lineTo(b.r * 0.6, yy + 4); ctx.stroke(); }
    // tattered coat remnants
    tatteredHem(ctx, 0, b.r * 1.3, b.r * 1.1, b.r * 0.6, furD, 8);
    // hunched head
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(b.r * 0.35, -b.r * 0.35, b.r * 0.75, b.r * 0.7, 0, 0, TAU); ctx.fill();
    // elongated jaws
    ctx.fillStyle = flash ? '#fff' : '#1a0a06';
    ctx.beginPath(); ctx.moveTo(b.r * 0.6, -b.r * 0.2); ctx.lineTo(b.r * 1.25, b.r * 0.05); ctx.lineTo(b.r * 0.7, b.r * 0.3); ctx.closePath(); ctx.fill();
    // fangs
    ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(b.r * 1.05, b.r * 0.0); ctx.lineTo(b.r * 1.15, b.r * 0.18); ctx.lineTo(b.r * 0.95, b.r * 0.08); ctx.closePath(); ctx.fill();
    // pointed beast ears
    ctx.fillStyle = furD; ctx.beginPath(); ctx.moveTo(b.r * 0.15, -b.r * 0.8); ctx.lineTo(b.r * 0.0, -b.r * 1.3); ctx.lineTo(b.r * 0.4, -b.r * 0.9); ctx.closePath(); ctx.fill();
    // burning eyes
    const eg = 0.6 + Math.sin(t * 7) * 0.4;
    ctx.fillStyle = flash ? '#fff' : `rgba(255,70,30,${eg})`;
    ctx.beginPath(); ctx.arc(b.r * 0.55, -b.r * 0.4, 3, 0, TAU); ctx.arc(b.r * 0.8, -b.r * 0.25, 2.6, 0, TAU); ctx.fill();
    radGlow(ctx, b.r * 0.65, -b.r * 0.32, 1, b.r * 0.6, [[0, `rgba(255,60,30,${0.4 * eg})`], [1, 'rgba(255,60,30,0)']]);
    // clawed arms
    ctx.strokeStyle = fur; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.r * 0.2, b.r * 0.3); ctx.lineTo(b.r * 1.5, b.r * 0.5); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#cdd2dc'; ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.r * 1.5, b.r * 0.5); ctx.lineTo(b.r * 2.0, b.r * 0.5 + i * 6); ctx.stroke(); }
  }
  ctx.restore();
}

// ============================================================ THE NIGHTMARE
// A cosmic horror: a dark central mass of writhing tendrils with a great eye.
function drawNightmare(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const baseCol = b.phase >= 3 ? '#5a2a8a' : b.phase === 2 ? '#3a1a6a' : '#2a1450';
  const body = flash ? '#fff' : stag ? '#9aa0ff' : baseCol;
  const tend = b.phase >= 3 ? 12 : b.phase === 2 ? 10 : 8;
  // writhing tendrils
  ctx.strokeStyle = body; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < tend; i++) {
    const a = (i / tend) * TAU + t * 0.5;
    const w = Math.sin(t * 2.5 + i) * 0.35;
    const r1 = b.r * 0.8, r2 = b.r * (1.7 + Math.sin(t + i) * 0.15);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * r1, Math.sin(a) * r1, Math.cos(a + w) * r2, Math.sin(a + w) * r2);
    ctx.stroke();
    // tendril tip
    ctx.fillStyle = flash ? '#fff' : `rgba(180,110,240,0.6)`; ctx.beginPath(); ctx.arc(Math.cos(a + w) * r2, Math.sin(a + w) * r2, 3, 0, TAU); ctx.fill();
  }
  // floating cosmic motes
  if (Math.random() < 0.4) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 3, y: b.y + (Math.random() - 0.5) * b.r * 3, vx: 0, vy: -10, life: 1, max: 1, r: 1.6, color: '#c090ff' });
  // central mass
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, b.r * 1.1, 0, TAU); ctx.fill();
  // pulsing core glow
  const cg = 0.5 + Math.sin(t * 3) * 0.5;
  radGlow(ctx, 0, 0, 2, b.r * 1.5, [[0, `rgba(180,110,240,${0.5 * cg})`], [1, 'rgba(40,10,80,0)']]);
  // the great eye
  ctx.fillStyle = flash ? '#fff' : '#e8c0ff'; ctx.beginPath(); ctx.ellipse(b.r * 0.35, 0, b.r * 0.45, b.r * 0.32, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#0a0014'; ctx.beginPath(); ctx.arc(b.r * 0.45, 0, b.r * 0.18, 0, TAU); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : `rgba(220,160,255,${cg})`; ctx.beginPath(); ctx.arc(b.r * 0.5, -b.r * 0.05, b.r * 0.06, 0, TAU); ctx.fill();
  // phase 3: many smaller eyes
  if (b.phase >= 3) {
    ctx.fillStyle = flash ? '#fff' : `rgba(220,120,255,0.8)`;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + t; const ex = Math.cos(a) * b.r * 0.75, ey = Math.sin(a) * b.r * 0.75; ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

// ============================================================ THE MIRE MOTHER
// A drowned choir matron: waterlogged robes, many reaching arms, glowing eyes.
function drawMireMother(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(40,90,100,0.3)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.8, b.r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const p2 = b.phase >= 2;
  const robe = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#0a2a4a' : '#1a4a4a';
  const robeD = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#062038' : '#103838';
  // rising water wisps
  if (Math.random() < 0.3) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 2, y: b.y + b.r * 0.6, vx: 0, vy: -rand(20, 50), life: 0.9, max: 0.9, r: 2.4, color: 'rgba(60,150,160,0.4)' });
  if (p2) radGlow(ctx, 0, 0, 4, b.r * 2, [[0, 'rgba(60,180,200,0.2)'], [1, 'rgba(60,180,200,0)']]);
  // many reaching arms (the drowned choir) behind
  ctx.strokeStyle = robeD; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const sx = i * b.r * 0.4, sw = Math.sin(t * 1.5 + i) * 0.3;
    ctx.beginPath(); ctx.moveTo(sx, b.r * 0.3); ctx.quadraticCurveTo(sx * 1.4, b.r * 0.8, sx * 1.5 + sw * b.r * 0.4, b.r * 1.4); ctx.stroke();
    // reaching hand
    ctx.fillStyle = flash ? '#fff' : robeD; const hx = sx * 1.5 + sw * b.r * 0.4, hy = b.r * 1.4;
    for (let f = 0; f < 3; f++) { ctx.beginPath(); ctx.arc(hx + (f - 1) * 4, hy + 2, 1.8, 0, TAU); ctx.fill(); }
  }
  // layered sodden robes
  ctx.fillStyle = robeD; ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 1.3, b.r * 1.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, b.r * 0.05, b.r * 1.1, b.r * 1.4, 0, 0, TAU); ctx.fill();
  tatteredHem(ctx, 0, b.r * 1.1, b.r * 1.1, b.r * 0.6, robeD, 8);
  // wet veil over the face
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#2a5a6a' : '#2a5a5a';
  ctx.beginPath(); ctx.ellipse(b.r * 0.25, -b.r * 0.3, b.r * 0.5, b.r * 0.6, 0, 0, TAU); ctx.fill();
  // glowing cyan eyes through the veil
  const eg = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(80,230,230,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.3, -b.r * 0.4, 2.8, 0, TAU); ctx.arc(b.r * 0.55, -b.r * 0.3, 2.8, 0, TAU); ctx.fill();
  radGlow(ctx, b.r * 0.42, -b.r * 0.35, 1, b.r * 0.5, [[0, `rgba(80,230,230,${0.4 * eg})`], [1, 'rgba(80,230,230,0)']]);
  // crown of reeds / water weeds
  ctx.strokeStyle = '#3a5a4a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { const sx = b.r * 0.25 + i * b.r * 0.15; ctx.beginPath(); ctx.moveTo(sx, -b.r * 0.7); ctx.lineTo(sx + Math.sin(t + i) * 4, -b.r * 1.1); ctx.stroke(); }
  // staff of drowned wood with a glowing tidal orb
  ctx.strokeStyle = '#3a4a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.7, b.r * 0.6); ctx.lineTo(b.r * 1.5, -b.r * 0.9); ctx.stroke();
  radGlow(ctx, b.r * 1.5, -b.r * 1.15, 1, b.r * 0.5, [[0, `rgba(80,230,230,${0.5 * eg})`], [1, 'rgba(80,230,230,0)']]);
  ctx.fillStyle = flash ? '#fff' : `rgba(120,240,240,${eg})`; ctx.beginPath(); ctx.arc(b.r * 1.5, -b.r * 1.15, b.r * 0.18, 0, TAU); ctx.fill();
  ctx.restore();
}

// ============================================================ THE HOLLOW KING
// A king rising from his throne: crown, tattered royal cape, greatsword.
function drawHollowKing(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const god = b.phase >= 3;
  const wrath = b.phase >= 2;
  const armor = flash ? '#fff' : stag ? '#9aa0ff' : god ? '#5a4a2a' : wrath ? '#3a3a2a' : '#2a2a24';
  const armorD = flash ? '#fff' : stag ? '#9aa0ff' : '#1a1a14';
  if (god) radGlow(ctx, 0, 0, 4, b.r * 2.4, [[0, 'rgba(230,180,80,0.18)'], [1, 'rgba(230,180,80,0)']]);
  // tattered royal cape behind
  ctx.fillStyle = armorD; ctx.beginPath(); ctx.ellipse(-b.r * 0.1, b.r * 0.3, b.r * 1.5, b.r * 1.7, 0, 0, TAU); ctx.fill();
  tatteredHem(ctx, -b.r * 0.1, b.r * 1.4, b.r * 1.4, b.r * 0.8, armorD, 9);
  // armored torso with plates
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(0, b.r * 0.1, b.r * 1.15, b.r * 1.4, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = armorD; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.35, -b.r * 0.4); ctx.lineTo(i * b.r * 0.35, b.r * 0.6); ctx.stroke(); }
  // pauldrons (shoulder plates)
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(-b.r * 0.9, -b.r * 0.2, b.r * 0.45, b.r * 0.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = armorD; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#d4a040'; ctx.beginPath(); ctx.arc(-b.r * 0.9, -b.r * 0.2, b.r * 0.12, 0, TAU); ctx.fill();
  // gaunt face
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#c9c0a8';
  ctx.beginPath(); ctx.ellipse(b.r * 0.3, -b.r * 0.35, b.r * 0.42, b.r * 0.5, 0, 0, TAU); ctx.fill();
  // hollow glowing eye sockets
  const eg = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = flash ? '#fff' : god ? `rgba(255,70,70,${eg})` : `rgba(255,180,70,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.3, -b.r * 0.45, 3, 0, TAU); ctx.arc(b.r * 0.55, -b.r * 0.3, 3, 0, TAU); ctx.fill();
  radGlow(ctx, b.r * 0.42, -b.r * 0.38, 1, b.r * 0.6, [[0, god ? `rgba(255,70,70,${0.4 * eg})` : `rgba(255,180,70,${0.4 * eg})`], [1, 'rgba(0,0,0,0)']]);
  // the crown — jagged, with a central gem
  ctx.fillStyle = flash ? '#fff' : '#d4a040';
  ctx.beginPath();
  const cy = -b.r * 0.7, cw = b.r * 0.7;
  ctx.moveTo(b.r * 0.3 - cw, cy); ctx.lineTo(b.r * 0.3 - cw, cy - b.r * 0.2);
  ctx.lineTo(b.r * 0.3 - cw * 0.5, cy - b.r * 0.05); ctx.lineTo(b.r * 0.3, cy - b.r * 0.3);
  ctx.lineTo(b.r * 0.3 + cw * 0.5, cy - b.r * 0.05); ctx.lineTo(b.r * 0.3 + cw, cy - b.r * 0.2);
  ctx.lineTo(b.r * 0.3 + cw, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : `rgba(220,60,60,${eg})`; ctx.beginPath(); ctx.arc(b.r * 0.3, cy - b.r * 0.18, b.r * 0.12, 0, TAU); ctx.fill();
  // greatsword
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.5, b.r * 0.4); ctx.lineTo(b.r * 1.8, -b.r * 0.2); ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : god ? '#e8d090' : '#c9d2e2'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(b.r * 0.7, b.r * 0.3); ctx.lineTo(b.r * 1.85, -b.r * 0.22); ctx.stroke();
  // crossguard
  ctx.strokeStyle = '#d4a040'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(b.r * 0.5, b.r * 0.1); ctx.lineTo(b.r * 0.7, b.r * 0.5); ctx.stroke();
  ctx.restore();
}

// ============================================================ THE ARCHIVIST
// An ancient scholar amid floating books, transforming into a monstrous form.
function drawArchivist(game, ctx, b) {
  const t = game.runtime;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const lastCh = b.phase >= 3;
  const forb = b.phase >= 2;
  // floating books (more + wilder as phases rise)
  const bn = lastCh ? 8 : forb ? 6 : 5;
  for (let i = 0; i < bn; i++) {
    const a = t * (lastCh ? 1.4 : 0.8) + i * (TAU / bn);
    const rr = b.r * (1.4 + (i % 2) * 0.3 + Math.sin(t + i) * 0.1);
    const bx = Math.cos(a) * rr, by = Math.sin(a) * rr;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a * 2 + t);
    ctx.fillStyle = flash ? '#fff' : '#5a3a1a'; ctx.fillRect(-7, -5, 14, 10);
    ctx.fillStyle = flash ? '#fff' : forb ? '#9a7a3a' : '#d4b060'; ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = forb ? `rgba(200,80,80,0.7)` : '#3a2a1a'; ctx.fillRect(0, -4, 1, 8);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.strokeRect(-7, -5, 14, 10);
    ctx.restore();
  }
  if (lastCh) radGlow(ctx, 0, 0, 4, b.r * 2.2, [[0, 'rgba(220,120,80,0.2)'], [1, 'rgba(220,120,80,0)']]);
  // robes
  const robe = flash ? '#fff' : stag ? '#9aa0ff' : lastCh ? '#5a3a2a' : forb ? '#3a2a3a' : '#2a2a24';
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 1.3, b.r * 1.6, 0, 0, TAU); ctx.fill();
  tatteredHem(ctx, 0, b.r * 1.2, b.r * 1.2, b.r * 0.6, flash ? '#fff' : '#1a1410', 8);
  // sash of script
  ctx.strokeStyle = '#d4b060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-b.r * 0.6, -b.r * 0.3); ctx.lineTo(b.r * 0.6, b.r * 0.3); ctx.stroke();
  // hood
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : lastCh ? '#3a1a1a' : '#2a1a3a';
  ctx.beginPath(); ctx.arc(b.r * 0.2, -b.r * 0.35, b.r * 0.6, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(b.r * 0.2 - b.r * 0.5, -b.r * 0.3); ctx.lineTo(b.r * 0.2 - b.r * 0.35, b.r * 0.1); ctx.lineTo(b.r * 0.2 + b.r * 0.35, b.r * 0.1); ctx.lineTo(b.r * 0.2 + b.r * 0.5, -b.r * 0.3); ctx.closePath(); ctx.fill();
  // shadowed face
  ctx.fillStyle = flash ? '#fff' : '#0a0408'; ctx.beginPath(); ctx.ellipse(b.r * 0.3, -b.r * 0.25, b.r * 0.32, b.r * 0.4, 0, 0, TAU); ctx.fill();
  // glowing eyes (more + redder as phases rise)
  const eg = 0.6 + Math.sin(t * 5) * 0.4;
  const eyeC = lastCh ? `rgba(255,90,60,${eg})` : forb ? `rgba(255,160,70,${eg})` : `rgba(180,200,120,${eg})`;
  ctx.fillStyle = flash ? '#fff' : eyeC;
  if (lastCh) { ctx.beginPath(); ctx.arc(b.r * 0.25, -b.r * 0.3, 2.6, 0, TAU); ctx.arc(b.r * 0.45, -b.r * 0.25, 2.6, 0, TAU); ctx.arc(b.r * 0.35, -b.r * 0.1, 2.2, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(b.r * 0.3, -b.r * 0.3, 2.6, 0, TAU); ctx.arc(b.r * 0.5, -b.r * 0.25, 2.6, 0, TAU); ctx.fill(); }
  radGlow(ctx, b.r * 0.38, -b.r * 0.25, 1, b.r * 0.5, [[0, eyeC.replace(/[\d.]+\)$/, '0.4)')], [1, 'rgba(0,0,0,0)']]);
  // last chapter: monstrous clawed limbs emerging from the robe
  if (lastCh) {
    ctx.strokeStyle = robe; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.r * 0.1, b.r * 0.3); ctx.lineTo(b.r * 1.4, b.r * 0.6); ctx.moveTo(-b.r * 0.1, b.r * 0.3); ctx.lineTo(-b.r * 1.2, b.r * 0.5); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#cdd2dc'; ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.r * 1.4, b.r * 0.6); ctx.lineTo(b.r * 1.85, b.r * 0.6 + i * 6); ctx.stroke(); }
  }
  // a great tome held forward, spilling forbidden light
  ctx.fillStyle = flash ? '#fff' : '#3a2a1a'; ctx.save(); ctx.translate(b.r * 0.9, b.r * 0.1); ctx.rotate(Math.sin(t) * 0.1);
  ctx.fillRect(-b.r * 0.4, -b.r * 0.5, b.r * 0.8, b.r); ctx.fillStyle = flash ? '#fff' : '#d4b060'; ctx.fillRect(-b.r * 0.36, -b.r * 0.46, b.r * 0.72, b.r * 0.92);
  radGlow(ctx, 0, 0, 1, b.r * 0.6, [[0, lastCh ? `rgba(255,90,60,${0.5 * eg})` : `rgba(220,180,90,${0.5 * eg})`], [1, 'rgba(0,0,0,0)']]);
  ctx.restore();
  ctx.restore();
}

function rand(a, b) { return a + Math.random() * (b - a); }