// EnvDressing.js — a pure-decorative environment polish pass.
// Scatters small handcrafted props across every region (deterministic, seeded),
// adds wall/ground detail overlays, atmosphere (lantern flicker + drifting dust),
// and a COSMETIC breakable-object system. Nothing here blocks movement, hides
// items, changes layout/progression, or affects combat balance — every prop is
// visual only. Breakables drop nothing ~95% of the time; a rare few yield a
// Draught, Molotov, or a pinch of Essence. Never required items.

import * as NpcSys from './NpcSystem.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- per-theme prop pools (only types with draw routines below) ----
const POOLS = {
  COMMON:  ['rubble', 'rubble', 'bones', 'barrel', 'crate', 'bucket', 'debris', 'weed', 'mossClump', 'roots'],
  GRAVE:   ['gravestone', 'gravestone', 'bones', 'deadTree', 'stump', 'brokenWeapon', 'campfire', 'debris', 'rubble', 'weed', 'fence'],
  CRYPT:   ['coffin', 'sarcophagus', 'bones', 'rubble', 'candle', 'chain', 'skullPile', 'mossClump', 'fern', 'bucket'],
  CATH:    ['statue', 'rubble', 'candle', 'banner', 'cloth', 'chain', 'fence', 'mossRock', 'gravestone', 'bench'],
  FOREST:  ['deadTree', 'deadTree', 'stump', 'roots', 'fern', 'deadBush', 'mossClump', 'weed', 'flower', 'rubble', 'bones'],
  LIBRARY: ['books', 'bookshelf', 'books', 'candle', 'rubble', 'bones', 'cloth', 'bucket', 'chain'],
  WATER:   ['bucket', 'trough', 'mossClump', 'roots', 'rubble', 'barrel', 'fern', 'weed', 'bones'],
  VILLAGE: ['cart', 'barrel', 'crate', 'bench', 'fence', 'cloth', 'bucket', 'cart', 'debris', 'weed', 'lanternPost'],
  HUB:     ['campfire', 'bench', 'banner', 'lanternPost', 'crate', 'barrel', 'cloth', 'bucket'],
  CLIFF:   ['rubble', 'deadTree', 'fence', 'debris', 'bones', 'mossRock', 'stump', 'roots'],
};
const STORY = ['fallenHunter', 'ritualCircle', 'skullPile', 'brokenWeapon', 'bones'];

function themeProps(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('nightmare') || n.includes('hub') || n.includes('sanctuary') || n.includes('haven')) return POOLS.HUB;
  if (n.includes('grave') || n.includes('burn')) return POOLS.GRAVE;
  if (n.includes('crypt') || n.includes('necro') || n.includes('tomb') || n.includes('catacomb')) return POOLS.CRYPT;
  if (n.includes('cathedral') || n.includes('flood') || n.includes('overlook') || n.includes('sanctum')) return POOLS.CATH;
  if (n.includes('forest') || n.includes('garden') || n.includes('wood') || n.includes('whisper')) return POOLS.FOREST;
  if (n.includes('library') || n.includes('archive') || n.includes('book')) return POOLS.LIBRARY;
  if (n.includes('aqueduct') || n.includes('mire') || n.includes('sunken') || n.includes('water')) return POOLS.WATER;
  if (n.includes('village') || n.includes('square') || n.includes('ash')) return POOLS.VILLAGE;
  if (n.includes('cliff')) return POOLS.CLIFF;
  return POOLS.COMMON;
}

const BREAKABLE = new Set(['crate', 'barrel', 'bucket', 'fence', 'bookshelf', 'coffin', 'cart', 'bones']);
function material(t) {
  if (t === 'crate' || t === 'barrel' || t === 'cart' || t === 'fence' || t === 'bench' || t === 'bookshelf') return 'wood';
  if (t === 'statue' || t === 'sarcophagus' || t === 'mossRock' || t === 'rubble' || t === 'trough') return 'stone';
  if (t === 'bucket' || t === 'coffin') return 'pottery';
  if (t === 'bones' || t === 'skullPile') return 'bone';
  return 'wood';
}
function debrisColors(m) {
  if (m === 'stone') return ['#5a5650', '#3a3834', '#6a665e'];
  if (m === 'pottery') return ['#7a6a52', '#5a4a3c', '#8a7a62'];
  if (m === 'bone') return ['#c9c0a8', '#9a9078', '#d8d0b8'];
  return ['#5a4a32', '#3a2e1c', '#6a5a3e']; // wood
}
function propRadius(t) { if (t === 'cart' || t === 'bookshelf' || t === 'sarcophagus') return 16; if (t === 'barrel' || t === 'crate' || t === 'coffin') return 13; return 10; }

// ===================== INIT =====================
export function init(game) {
  if (game._envDressing) return;
  const avoid = buildAvoidSet(game);
  const walls = game.world.walls;
  const props = [], breakables = [];
  (game.regions || []).forEach((reg, ri) => {
    const seed = mulberry32(((ri + 1) * 2654435761) >>> 0);
    const pool = themeProps(reg.name || reg.id || '');
    const area = (reg.w || 0) * (reg.h || 0);
    let count = clamp(Math.round(area / 5600), 6, 36);
    if (reg.safe) count = Math.round(count * 0.6);
    for (let i = 0; i < count; i++) {
      const x = reg.x + seed() * (reg.w || 0);
      const y = reg.y + seed() * (reg.h || 0);
      if (nearKey(avoid, x, y, 48)) continue;
      if (insideWall(walls, game.openGates, x, y, 11)) continue;
      let type;
      if (seed() < 0.06) type = STORY[Math.floor(seed() * STORY.length)];
      else type = pool[Math.floor(seed() * pool.length)];
      const p = { x, y, type, seed: Math.floor(seed() * 1e7), broken: false, r: propRadius(type) };
      props.push(p);
      if (BREAKABLE.has(type) && seed() < 0.5) { p.breakable = true; breakables.push(p); }
    }
  });
  const dust = [];
  for (let i = 0; i < 42; i++) dust.push(newDust(game));
  game._envDressing = { props, breakables, dust };
}

function buildAvoidSet(game) {
  const pts = [];
  const push = (x, y) => pts.push(x, y);
  for (const l of (game.world.lanterns || [])) push(l.x, l.y);
  for (const c of (game.world.chests || [])) push(c.x, c.y);
  for (const n of (game.world.notes || [])) push(n.x, n.y);
  for (const f of (game.fragments || [])) push(f.x, f.y);
  if (game.hubInfo) { push(game.hubInfo.lantern.x, game.hubInfo.lantern.y); push(game.hubInfo.workshop.x, game.hubInfo.workshop.y); }
  if (game.npcs && NpcSys.npcStagePos) for (const n of game.npcs) { try { const pos = NpcSys.npcStagePos(n); if (pos) push(pos.x, pos.y); } catch (e) {} }
  return pts; // flat [x0,y0,x1,y1,...]
}
function nearKey(flat, x, y, r) {
  const r2 = r * r;
  for (let i = 0; i < flat.length; i += 2) { if (dist2(x, y, flat[i], flat[i + 1]) < r2) return true; }
  return false;
}
function insideWall(walls, openGates, x, y, m) {
  for (const w of walls) {
    if (w.gate && openGates && openGates.has(w.gate)) continue;
    if (x > w.x - m && x < w.x + w.w + m && y > w.y - m && y < w.y + w.h + m) return true;
  }
  return false;
}

// ===================== UPDATE =====================
export function update(game, dt) {
  const d = game._envDressing; if (!d) return;
  const t = game.runtime;
  // lantern flame flicker (drives the lighting radius via l._flick)
  for (const l of game.world.lanterns) {
    l._flick = 0.9 + Math.sin(t * 11 + l.x * 0.31) * 0.06 + Math.sin(t * 23 + l.y * 0.7) * 0.04;
  }
  // drifting dust motes
  const camL = game.camera.x - 60, camT = game.camera.y - 60, camR = camL + game.viewW + 120, camB = camT + game.viewH + 120;
  for (const m of d.dust) {
    m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
    if (m.life <= 0 || m.x < camL || m.x > camR || m.y < camT || m.y > camB) Object.assign(m, newDust(game));
  }
  // enemy / boss active attacks shatter nearby fragile props
  if ((game.state === 'playing' || game.state === 'bossActive') && !game.paused) {
    for (const e of game.enemies) {
      if (!e.alive || e.attackPhase !== 'active') continue;
      const rr = e.reach + e.r + 16, rr2 = rr * rr;
      for (const b of d.breakables) { if (!b.broken && dist2(e.x, e.y, b.x, b.y) < rr2) breakProp(game, b, e.x, e.y); }
    }
    if (game.boss && game.boss.alive && game.boss.attackPhase === 'active') {
      const rr = game.boss.r + 44, rr2 = rr * rr;
      for (const b of d.breakables) { if (!b.broken && dist2(game.boss.x, game.boss.y, b.x, b.y) < rr2) breakProp(game, b, game.boss.x, game.boss.y); }
    }
    for (const sw of game.shockwaves) {
      if (sw.visual) continue;
      for (const b of d.breakables) { if (!b.broken && Math.abs(Math.hypot(b.x - sw.x, b.y - sw.y) - sw.r) < 20 + b.r) breakProp(game, b, sw.x, sw.y); }
    }
  }
}

function newDust(game) {
  const cx = game.camera ? game.camera.x + game.viewW / 2 : 0;
  const cy = game.camera ? game.camera.y + game.viewH / 2 : 0;
  return {
    x: cx + rand(-game.viewW / 2 - 40, game.viewW / 2 + 40),
    y: cy + rand(-game.viewH / 2 - 40, game.viewH / 2 + 40),
    vx: rand(-7, 7), vy: rand(-5, 5), life: rand(3, 8), r: rand(0.6, 1.8), a: rand(0.04, 0.12),
  };
}

// ===================== BREAKABLE INTERACTION =====================
export function checkSwingBreak(game) {
  const p = game.player, s = p && p.swing; if (!s) return;
  const prog = s.t / s.dur; if (prog < 0.10 || prog > 0.82) return;
  const d = game._envDressing; if (!d) return;
  const reach = s.reach + 16, reach2 = reach * reach;
  for (const b of d.breakables) {
    if (b.broken) continue;
    if (dist2(p.x, p.y, b.x, b.y) > reach2) continue;
    const a = Math.atan2(b.y - p.y, b.x - p.x);
    if (Math.abs(angDiff(s.angle, a)) < s.arc / 2 + 0.34) breakProp(game, b, p.x, p.y);
  }
}
export function checkDashBreak(game) {
  const p = game.player, d = game._envDressing; if (!d || !p) return;
  const r2 = 60 * 60;
  for (const b of d.breakables) { if (!b.broken && dist2(p.x, p.y, b.x, b.y) < r2) breakProp(game, b, p.x, p.y); }
}

function breakProp(game, b, fromX, fromY) {
  if (b.broken) return;
  b.broken = true;
  const mat = material(b.type), cols = debrisColors(mat);
  const dir = Math.atan2(b.y - fromY, b.x - fromX);
  for (let i = 0; i < 11; i++) {
    const a = dir + rand(-1.1, 1.1), sp = rand(50, 190);
    game.particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(20, 90), life: rand(0.4, 0.95), max: 0.95, r: rand(1.4, 3.6), color: cols[i % cols.length] });
  }
  for (let i = 0; i < 6; i++) game.particles.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-55, -8), life: rand(0.5, 1.0), max: 1.0, r: rand(2, 4.5), color: 'rgba(150,140,120,0.4)' });
  game.camera.shake = Math.max(game.camera.shake, 3);
  const s = game.sound;
  if (mat === 'wood') s.breakWood && s.breakWood();
  else if (mat === 'stone') s.breakStone && s.breakStone();
  else if (mat === 'pottery') s.breakPottery && s.breakPottery();
  else if (mat === 'bone') s.breakBone && s.breakBone();
  else s.breakWood && s.breakWood();
  // ~5% drop a small consumable — never a required item
  if (Math.random() < 0.05) {
    const r = Math.random();
    if (r < 0.6) game.pickups.push({ x: b.x, y: b.y, vial: true, t: 0 });
    else if (r < 0.85) game.pickups.push({ x: b.x, y: b.y, molotov: true, t: 0 });
    else game.pickups.push({ x: b.x, y: b.y, ess: Math.round(rand(30, 80)), t: 0 });
  }
}

// ===================== RENDER =====================
export function drawWorld(game, ctx) {
  const d = game._envDressing; if (!d) return;
  const t = game.runtime;
  const camL = game.camera.x - 50, camT = game.camera.y - 50, camR = camL + game.viewW + 100, camB = camT + game.viewH + 100;
  for (const p of d.props) {
    if (p.broken || p.x < camL || p.x > camR || p.y < camT || p.y > camB) continue;
    ctx.save(); ctx.translate(p.x, p.y);
    drawProp(ctx, p, t);
    ctx.restore();
  }
  // drifting dust (additive, very faint)
  ctx.globalCompositeOperation = 'lighter';
  for (const m of d.dust) {
    if (m.x < camL || m.x > camR || m.y < camT || m.y > camB) continue;
    ctx.globalAlpha = m.a;
    ctx.fillStyle = '#d8d4c8';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// ---- wall + ground detail overlays (called from wrapped draw methods) ----
export function drawWallDetail(game, ctx) {
  const t = game.runtime;
  const camL = game.camera.x - 30, camT = game.camera.y - 30, camR = camL + game.viewW + 60, camB = camT + game.viewH + 60;
  for (const w of game.world.walls) {
    if (w.gate && game.openGates.has(w.gate)) continue;
    if (w.x > camR || w.x + w.w < camL || w.y > camB || w.y + w.h < camT) continue;
    const h = Math.abs(Math.sin(w.x * 12.9898 + w.y * 78.233));
    // moss creeping up from the base
    ctx.fillStyle = 'rgba(70,92,56,0.22)';
    const mw = Math.min(w.w, w.h) * 0.5;
    ctx.beginPath(); ctx.ellipse(w.x + w.w * (0.3 + h * 0.3), w.y + w.h - 2, mw, 4, 0, 0, TAU); ctx.fill();
    if (h > 0.5) { ctx.beginPath(); ctx.ellipse(w.x + w.w * 0.7, w.y + w.h - 2, mw * 0.7, 3, 0, 0, TAU); ctx.fill(); }
    // a vertical crack
    if (h > 0.55) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w.x + w.w * (0.4 + h * 0.2), w.y + 3); ctx.lineTo(w.x + w.w * (0.45 + h * 0.1), w.y + w.h - 3); ctx.stroke(); }
    // ivy strands on some walls
    if (h > 0.72) {
      ctx.strokeStyle = 'rgba(60,80,48,0.4)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const ix = w.x + 6 + i * ((w.w - 12) / 3) + h * 4;
        ctx.beginPath(); ctx.moveTo(ix, w.y + w.h - 2);
        ctx.quadraticCurveTo(ix + Math.sin(t * 0.5 + i) * 3, w.y + w.h * 0.5, ix + Math.sin(t * 0.5 + i + 1) * 2, w.y + 3); ctx.stroke();
      }
    }
  }
}

export function drawGroundDetail(game, ctx) {
  const tile = 64, t = game.runtime;
  const x0 = Math.floor(game.camera.x / tile) * tile, y0 = Math.floor(game.camera.y / tile) * tile;
  for (let x = x0; x < game.camera.x + game.viewW + tile; x += tile) {
    for (let y = y0; y < game.camera.y + game.viewH + tile; y += tile) {
      const h = Math.abs(Math.sin(x * 0.013 + y * 0.029) * 43758.5 % 1);
      const h2 = Math.abs(Math.sin(x * 0.071 + y * 0.019) * 12543.7 % 1);
      if (h < 0.32) { // a crack
        ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + h2 * tile, y + 6); ctx.lineTo(x + h2 * tile + (h - 0.16) * 40, y + tile - 8); ctx.stroke();
      } else if (h < 0.5) { // pebbles
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.arc(x + h2 * tile, y + h * tile * 0.7, 1.4, 0, TAU); ctx.fill();
      } else if (h < 0.62) { // a dark puddle / damp patch
        ctx.fillStyle = 'rgba(10,14,20,0.30)';
        ctx.beginPath(); ctx.ellipse(x + h2 * tile, y + h * tile, 7 + h2 * 4, 3 + h * 2, 0, 0, TAU); ctx.fill();
      } else if (h < 0.74) { // a weed sprouting through
        ctx.strokeStyle = 'rgba(70,86,52,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + h2 * tile, y + tile - 4); ctx.lineTo(x + h2 * tile + Math.sin(t + x) * 2, y + tile - 10); ctx.stroke();
      } else if (h < 0.8) { // a dried blood fleck
        ctx.fillStyle = 'rgba(40,8,8,0.3)';
        ctx.beginPath(); ctx.arc(x + h2 * tile, y + h * tile, 1.8, 0, TAU); ctx.fill();
      }
    }
  }
}

// ===================== PROP DRAW ROUTINES =====================
function shadow(ctx, r) { ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.beginPath(); ctx.ellipse(0, r * 0.55, r, r * 0.38, 0, 0, TAU); ctx.fill(); }
function h(p, n) { const x = Math.sin(p.seed * 0.013 + n * 2.7) * 43758.5; return x - Math.floor(x); }

function drawProp(ctx, p, t) {
  switch (p.type) {
    case 'rubble': return drawRubble(ctx, p);
    case 'debris': return drawDebris(ctx, p);
    case 'bones': return drawBones(ctx, p);
    case 'skullPile': return drawSkullPile(ctx, p);
    case 'barrel': return drawBarrel(ctx, p);
    case 'crate': return drawCrate(ctx, p);
    case 'bucket': return drawBucket(ctx, p);
    case 'trough': return drawTrough(ctx, p);
    case 'cart': return drawCart(ctx, p);
    case 'weed': return drawWeed(ctx, p, t);
    case 'mossClump': return drawMossClump(ctx, p);
    case 'roots': return drawRoots(ctx, p);
    case 'fern': return drawFern(ctx, p, t);
    case 'deadBush': return drawDeadBush(ctx, p);
    case 'flower': return drawFlower(ctx, p, t);
    case 'mossRock': return drawMossRock(ctx, p);
    case 'gravestone': return drawGravestone(ctx, p);
    case 'statue': return drawStatue(ctx, p);
    case 'fence': return drawFence(ctx, p);
    case 'chain': return drawChain(ctx, p);
    case 'lanternPost': return drawLanternPost(ctx, p, t);
    case 'bench': return drawBench(ctx, p);
    case 'deadTree': return drawDeadTree(ctx, p);
    case 'stump': return drawStump(ctx, p);
    case 'candle': return drawCandle(ctx, p, t);
    case 'campfire': return drawCampfire(ctx, p, t);
    case 'banner': return drawBanner(ctx, p, t);
    case 'cloth': return drawCloth(ctx, p, t);
    case 'coffin': return drawCoffin(ctx, p);
    case 'sarcophagus': return drawSarcophagus(ctx, p);
    case 'books': return drawBooks(ctx, p);
    case 'bookshelf': return drawBookshelf(ctx, p);
    case 'weapon': case 'brokenWeapon': return drawWeapon(ctx, p, p.type === 'brokenWeapon');
    case 'fallenHunter': return drawFallenHunter(ctx, p);
    case 'ritualCircle': return drawRitualCircle(ctx, p, t);
    default: return drawRubble(ctx, p);
  }
}

function drawRubble(ctx, p) { shadow(ctx, 12); ctx.fillStyle = '#2a2824'; for (let i = 0; i < 4; i++) { const a = h(p, i) * TAU, r = 3 + h(p, i + 1) * 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 6, Math.sin(a) * 4, r, 0, TAU); ctx.fill(); } ctx.fillStyle = '#3a3834'; ctx.fillRect(-5, -3, 4, 3); }
function drawDebris(ctx, p) { shadow(ctx, 10); ctx.fillStyle = '#241f18'; for (let i = 0; i < 5; i++) ctx.fillRect(h(p, i) * 16 - 8, h(p, i + 1) * 8 - 4, 3, 2); ctx.fillStyle = '#3a2e1c'; ctx.fillRect(-4, -3, 6, 2); }
function drawBones(ctx, p) { shadow(ctx, 9); ctx.fillStyle = '#b8ad8e'; ctx.save(); ctx.rotate(h(p, 0) * TAU); ctx.fillRect(-7, -1.5, 14, 3); ctx.beginPath(); ctx.arc(-7, 0, 2.5, 0, TAU); ctx.arc(7, 0, 2.5, 0, TAU); ctx.fill(); ctx.restore(); ctx.fillStyle = '#9a9078'; ctx.fillRect(2, 4, 5, 1.5); }
function drawSkullPile(ctx, p) { shadow(ctx, 12); ctx.fillStyle = '#c9c0a8'; for (let i = 0; i < 3; i++) { const sx = (i - 1) * 7, sy = -i * 3; ctx.beginPath(); ctx.arc(sx, sy, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1612'; ctx.fillRect(sx - 2, sy - 1, 1.5, 1.5); ctx.fillRect(sx + 1, sy - 1, 1.5, 1.5); ctx.fillStyle = '#c9c0a8'; } ctx.fillStyle = '#9a9078'; ctx.fillRect(-8, 3, 16, 1.5); }
function drawBarrel(ctx, p) { shadow(ctx, 13); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-9, -12, 18, 22); ctx.fillStyle = '#4a3624'; ctx.fillRect(-9, -12, 18, 3); ctx.fillRect(-9, 5, 18, 3); ctx.strokeStyle = '#241812'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(9, -6); ctx.stroke(); ctx.fillStyle = '#2a1c12'; ctx.fillRect(2, -10, 2, 2); }
function drawCrate(ctx, p) { shadow(ctx, 12); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-11, -11, 22, 22); ctx.strokeStyle = '#241812'; ctx.lineWidth = 1; ctx.strokeRect(-11, -11, 22, 22); ctx.beginPath(); ctx.moveTo(-11, -11); ctx.lineTo(11, 11); ctx.moveTo(11, -11); ctx.lineTo(-11, 11); ctx.stroke(); }
function drawBucket(ctx, p) { shadow(ctx, 9); ctx.fillStyle = '#5a4a3c'; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, -7); ctx.lineTo(5, 7); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a2e22'; ctx.fillRect(-7, -7, 14, 2); ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -8, 5, Math.PI, TAU); ctx.stroke(); }
function drawTrough(ctx, p) { shadow(ctx, 14); ctx.fillStyle = '#4a4034'; ctx.fillRect(-16, -6, 32, 12); ctx.fillStyle = '#1a2a30'; ctx.fillRect(-14, -4, 28, 5); ctx.strokeStyle = '#2a241c'; ctx.lineWidth = 1; ctx.strokeRect(-16, -6, 32, 12); ctx.fillStyle = 'rgba(120,160,180,0.18)'; ctx.fillRect(-13, -3, 26, 1.5); }
function drawCart(ctx, p) { shadow(ctx, 16); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-18, -8, 36, 14); ctx.strokeStyle = '#241812'; ctx.lineWidth = 1; for (let i = -14; i < 16; i += 7) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 6); ctx.stroke(); } ctx.fillStyle = '#1a140e'; ctx.beginPath(); ctx.arc(-12, 8, 4, 0, TAU); ctx.arc(12, 8, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(12, 8); ctx.stroke(); }
function drawWeed(ctx, p, t) { ctx.strokeStyle = 'rgba(72,88,52,0.55)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const bx = (i - 1.5) * 4; ctx.beginPath(); ctx.moveTo(bx, 3); ctx.quadraticCurveTo(bx + Math.sin(t + i) * 2, -4, bx + Math.sin(t + i + 1) * 2, -8); ctx.stroke(); } }
function drawMossClump(ctx, p) { ctx.fillStyle = 'rgba(60,84,50,0.5)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((i - 2) * 4, h(p, i) * 4 - 1, 3 + h(p, i + 1) * 2, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(80,110,60,0.3)'; ctx.beginPath(); ctx.arc(-2, -2, 3, 0, TAU); ctx.fill(); }
function drawRoots(ctx, p) { ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 1.6; for (let i = 0; i < 4; i++) { const bx = (i - 1.5) * 5; ctx.beginPath(); ctx.moveTo(bx, -8); ctx.quadraticCurveTo(bx + h(p, i) * 6 - 3, 2, bx + h(p, i + 1) * 4 - 2, 8); ctx.stroke(); } }
function drawFern(ctx, p, t) { ctx.strokeStyle = 'rgba(58,86,48,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.4 + Math.sin(t + i) * 0.05; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(Math.cos(a) * 5, Math.sin(a) * 5 - 2, Math.cos(a) * 9, Math.sin(a) * 9 - 4); ctx.stroke(); } }
function drawDeadBush(ctx, p) { shadow(ctx, 9); ctx.strokeStyle = '#3a2e1c'; ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const a = h(p, i) * TAU; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 8 - 2); ctx.stroke(); } ctx.strokeStyle = '#4a3a24'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(Math.cos(h(p, i + 2) * TAU) * 5, Math.sin(h(p, i + 2) * TAU) * 5 - 1); ctx.stroke(); } }
function drawFlower(ctx, p, t) { ctx.strokeStyle = 'rgba(70,86,52,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(Math.sin(t) * 1, -6); ctx.stroke(); ctx.fillStyle = p.seed % 2 ? '#9a7ab0' : '#d8a868'; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 2.5 + Math.sin(t) * 1, Math.sin(a) * 2.5 - 6, 1.4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#d8c060'; ctx.beginPath(); ctx.arc(Math.sin(t) * 1, -6, 1, 0, TAU); ctx.fill(); }
function drawMossRock(ctx, p) { shadow(ctx, 11); ctx.fillStyle = '#3a3a36'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, h(p, 0) * TAU, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a4a44'; ctx.beginPath(); ctx.ellipse(-3, -2, 6, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(60,84,50,0.45)'; ctx.beginPath(); ctx.arc(4, 2, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-5, -1, 2.5, 0, TAU); ctx.fill(); }
function drawGravestone(ctx, p) { shadow(ctx, 11); const tilt = (h(p, 0) - 0.5) * 0.4; ctx.save(); ctx.rotate(tilt); ctx.fillStyle = '#3a3a34'; ctx.fillRect(-7, -14, 14, 18); ctx.beginPath(); ctx.arc(0, -14, 7, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#4a4a42'; ctx.fillRect(-7, -14, 14, 2); ctx.strokeStyle = 'rgba(20,18,14,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1.5, -8); ctx.lineTo(1.5, -8); ctx.moveTo(0, -10); ctx.lineTo(0, -5); ctx.stroke(); ctx.fillStyle = 'rgba(60,84,50,0.3)'; ctx.fillRect(-7, 2, 14, 2); ctx.restore(); }
function drawStatue(ctx, p) { shadow(ctx, 12); ctx.fillStyle = '#2e2c28'; ctx.fillRect(-8, 4, 16, 5); ctx.fillRect(-6, -14, 12, 20); ctx.beginPath(); ctx.arc(0, -16, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3832'; ctx.fillRect(-6, -14, 12, 2); ctx.strokeStyle = 'rgba(20,18,14,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 2); ctx.moveTo(-4, -8); ctx.lineTo(4, -8); ctx.stroke(); if (h(p, 0) > 0.5) { ctx.fillStyle = '#3a3630'; ctx.beginPath(); ctx.arc(-7, -13, 3, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(60,84,50,0.22)'; ctx.beginPath(); ctx.arc(5, -2, 3, 0, TAU); ctx.fill(); }
function drawFence(ctx, p) { shadow(ctx, 11); ctx.fillStyle = '#2a241c'; ctx.fillRect(-13, 0, 26, 3); ctx.fillRect(-13, -9, 26, 3); for (let i = -10; i <= 10; i += 7) { ctx.beginPath(); ctx.moveTo(i - 1, -11); ctx.lineTo(i + 1, -11); ctx.lineTo(i, -13); ctx.closePath(); ctx.fill(); ctx.fillRect(i - 1, -13, 2, 18); } ctx.fillStyle = 'rgba(60,84,50,0.3)'; ctx.fillRect(-13, 2, 26, 1.5); }
function drawChain(ctx, p) { ctx.strokeStyle = '#3a3a38'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -14); for (let i = 0; i < 5; i++) { ctx.quadraticCurveTo(Math.sin(i) * 3, -10 + i * 5, 0, -8 + i * 5); } ctx.stroke(); ctx.fillStyle = '#4a4a46'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.sin(i) * 3, -10 + i * 5, 1.6, 0, TAU); ctx.fill(); } }
function drawLanternPost(ctx, p, t) { shadow(ctx, 7); ctx.fillStyle = '#241c14'; ctx.fillRect(-1.5, -2, 3, 18); ctx.fillRect(-4, -14, 8, 3); ctx.fillStyle = '#1a140e'; ctx.fillRect(-3, -12, 6, 7); const fl = 0.6 + Math.sin(t * 9 + p.seed) * 0.3; ctx.fillStyle = `rgba(255,180,80,${0.5 + fl * 0.3})`; ctx.beginPath(); ctx.arc(0, -8, 2.4 + fl, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,160,70,${0.12 + fl * 0.06})`; ctx.beginPath(); ctx.arc(0, -8, 11 + fl * 2, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
function drawBench(ctx, p) { shadow(ctx, 12); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-13, -3, 26, 4); ctx.fillRect(-11, 1, 3, 7); ctx.fillRect(8, 1, 3, 7); ctx.strokeStyle = '#241812'; ctx.lineWidth = 1; ctx.strokeRect(-13, -3, 26, 4); }
function drawDeadTree(ctx, p) { shadow(ctx, 10); ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -10); ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-8, -12); ctx.moveTo(0, -7); ctx.lineTo(7, -14); ctx.moveTo(-3, -2); ctx.lineTo(-9, 2); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-11, -16); ctx.moveTo(7, -14); ctx.lineTo(11, -10); ctx.stroke(); }
function drawStump(ctx, p) { shadow(ctx, 10); ctx.fillStyle = '#2a2018'; ctx.fillRect(-6, -4, 12, 8); ctx.fillStyle = '#3a2e22'; ctx.beginPath(); ctx.ellipse(0, -4, 6, 2.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, -4, 4, 1.6, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(-5, 9); ctx.moveTo(2, 4); ctx.lineTo(5, 8); ctx.stroke(); }
function drawCandle(ctx, p, t) { shadow(ctx, 8); ctx.fillStyle = '#d8c896'; ctx.fillRect(-1.5, -4, 3, 8); ctx.fillStyle = '#3a2e1c'; ctx.fillRect(-1.5, 3, 3, 1); const fl = 0.7 + Math.sin(t * 14 + p.seed) * 0.3; ctx.fillStyle = `rgba(255,200,110,${0.8})`; ctx.beginPath(); ctx.ellipse(0, -6, 1.2, 2 + fl, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,170,80,${0.1 + fl * 0.05})`; ctx.beginPath(); ctx.arc(0, -6, 7 + fl, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
function drawCampfire(ctx, p, t) { shadow(ctx, 12); ctx.fillStyle = '#1a140e'; ctx.beginPath(); ctx.ellipse(0, 4, 12, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2218'; for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(h(p, i) * TAU); ctx.fillRect(-6, 2, 12, 2); ctx.restore(); } const fl = 0.6 + Math.sin(t * 7 + p.seed) * 0.4; ctx.fillStyle = `rgba(220,90,30,${0.7})`; ctx.beginPath(); ctx.ellipse(0, -3, 4, 6 + fl * 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,180,60,${0.6})`; ctx.beginPath(); ctx.ellipse(0, -5, 2.5, 4 + fl, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,140,50,${0.1 + fl * 0.05})`; ctx.beginPath(); ctx.arc(0, -3, 16 + fl * 3, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
function drawBanner(ctx, p, t) { ctx.fillStyle = '#5a2018'; ctx.fillRect(-1, -16, 2, 4); ctx.fillStyle = h(p, 0) > 0.5 ? '#3a2230' : '#2a2a3a'; const sw = 0.5 + Math.sin(t * 1.5 + p.seed) * 0.5; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(6 + sw * 1.5, 4); ctx.lineTo(0, 1); ctx.lineTo(-6 - sw * 1.5, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-6, -12, 12, 1.5); ctx.fillStyle = '#8a7050'; ctx.fillRect(-1, -2, 2, 4); }
function drawCloth(ctx, p, t) { const sw = Math.sin(t * 1.2 + p.seed) * 1.5; ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(-7, -12); ctx.quadraticCurveTo(0, -10 + sw, 7, -12); ctx.lineTo(7 + sw * 0.5, 2); ctx.quadraticCurveTo(0, 4 + sw, -7 - sw * 0.5, 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(7, -12); ctx.stroke(); }
function drawCoffin(ctx, p) { shadow(ctx, 14); ctx.fillStyle = '#241a12'; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(-7, -10); ctx.lineTo(7, -10); ctx.lineTo(9, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-7, -10, 14, 2); ctx.fillStyle = '#8a7050'; ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(-3, -1, 6, 2); }
function drawSarcophagus(ctx, p) { shadow(ctx, 16); ctx.fillStyle = '#3a3834'; ctx.fillRect(-15, -4, 30, 12); ctx.fillStyle = '#2a2824'; ctx.fillRect(-15, -10, 30, 8); ctx.beginPath(); ctx.arc(0, -10, 15, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#4a4842'; ctx.lineWidth = 1; ctx.strokeRect(-15, -10, 30, 18); ctx.fillStyle = '#5a5046'; ctx.fillRect(-2, -8, 4, 14); ctx.fillStyle = 'rgba(60,84,50,0.3)'; ctx.beginPath(); ctx.arc(-10, 6, 4, 0, TAU); ctx.fill(); }
function drawBooks(ctx, p) { shadow(ctx, 9); const cols = ['#5a2a2a', '#2a3a5a', '#3a2a3a', '#5a4a2a']; for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9 + i * 5, -7, 4, 12); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-9 + i * 5, -7, 4, 1.5); } ctx.fillStyle = '#c9b890'; ctx.save(); ctx.translate(4, 6); ctx.rotate(0.5); ctx.fillRect(-3, -1, 6, 3); ctx.restore(); }
function drawBookshelf(ctx, p) { shadow(ctx, 15); ctx.fillStyle = '#2a1c12'; ctx.fillRect(-13, -16, 26, 30); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-11, -14, 22, 3); ctx.fillRect(-11, -5, 22, 2); ctx.fillRect(-11, 4, 22, 2); const cols = ['#5a2a2a', '#2a3a5a', '#3a2a3a', '#5a4a2a']; for (let r = 0; r < 3; r++) { for (let i = 0; i < 5; i++) { if (h(p, r * 5 + i) > 0.25) { ctx.fillStyle = cols[(r + i) % cols.length]; ctx.fillRect(-10 + i * 4.4, -11 + r * 8, 3.6, 6); } } } }
function drawWeapon(ctx, p, broken) { shadow(ctx, 10); ctx.strokeStyle = '#5a5048'; ctx.lineWidth = 2; ctx.save(); ctx.rotate(h(p, 0) * 1.2 - 0.3); ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(0, -2); ctx.stroke(); ctx.fillStyle = '#6a6058'; ctx.fillRect(-7, 7, 6, 2); ctx.strokeStyle = '#8a8078'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(broken ? 4 : 9, broken ? 2 : -9); ctx.stroke(); if (broken) { ctx.fillStyle = '#8a8078'; ctx.fillRect(3, 0, 2, 2); } ctx.restore(); }
function drawFallenHunter(ctx, p) { shadow(ctx, 16); ctx.fillStyle = '#241c16'; ctx.save(); ctx.rotate(0.3); ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a241c'; ctx.beginPath(); ctx.arc(-11, 2, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a3328'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(8, 10); ctx.stroke(); ctx.fillStyle = '#5a4a3a'; ctx.save(); ctx.translate(9, 9); ctx.rotate(0.6); ctx.fillRect(0, 0, 9, 1.8); ctx.restore(); ctx.restore(); ctx.fillStyle = 'rgba(40,6,6,0.5)'; ctx.beginPath(); ctx.ellipse(4, 6, 9, 3, 0, 0, TAU); ctx.fill(); }
function drawRitualCircle(ctx, p, t) { ctx.strokeStyle = `rgba(150,60,160,${0.3 + Math.sin(t + p.seed) * 0.1})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke(); ctx.strokeStyle = `rgba(180,80,180,0.25)`; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + t * 0.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.stroke(); } ctx.fillStyle = 'rgba(150,60,160,0.18)'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); }