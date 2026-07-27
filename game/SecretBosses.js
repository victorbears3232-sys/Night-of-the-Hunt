// SecretBosses.js — hidden optional bosses, discovered through exploration.
// Not required for the main story. Each has a unique arena, intro, reward, and
// render. Combat AI reuses the shared BossSystem attack table (a themed
// moveset defined in BossSystem.updatePaleWraith). HuntGame only adds two thin
// dispatch hooks (checkTrigger in _checkAreaTriggers, onDefeated in
// _onBossDefeated) so the engine file stays lean.

import { recomputeStats } from './Charms.js';
import * as Save from './SaveSystem.js';
import { SOUL_MAP } from './Souls.js';

const TAU = Math.PI * 2;

const DEFS = {
  pale_wraith: {
    type: 'pale_wraith', secret: true,
    name: 'The Pale Wraith',
    x: 2680, y: 3460, r: 24, hp: 1500, speed: 92, dmg: 36, ess: 800,
    arena: { minX: 2500, maxX: 2880, minY: 3300, maxY: 3680 },
    phase2at: 0.5, introStyle: 'fog',
    introMsg: 'A shade unremembered', phase2Msg: 'The Wraith Awakens',
    burstColor: '#a0c8e8',
    // appears in the Forgotten Gardens, but only after the first Guardian falls
    condition: g => g.defeatedBosses && g.defeatedBosses.has('vicar'),
    trigger: { minX: 2540, maxX: 2860, minY: 3340, maxY: 3660 },
    rewards: [
      { type: 'outfit', id: 'wraith_shroud', name: 'Wraith Shroud' },
      { type: 'shards', amount: 5 },
    ],
  },
  // ---- Northern expansion: Frostbound Cathedral ----
  winter_hierophant: {
    type: 'winter_hierophant', secret: true,
    name: 'The Winter Hierophant',
    x: 1500, y: 220, r: 26, hp: 1700, speed: 74, dmg: 26, ess: 950,
    arena: { minX: 1140, maxX: 1860, minY: 100, maxY: 440 },
    phase2at: 0.5, introStyle: 'fog',
    introMsg: 'The Frost Remembers', phase2Msg: 'The Hierophant Awakens',
    burstColor: '#9ad8f0',
    trigger: { minX: 1180, maxX: 1820, minY: 130, maxY: 410 },
    rewards: [
      { type: 'outfit', id: 'frostveil_set', name: 'Frostveil Set' },
      { type: 'shards', amount: 5 },
    ],
  },
  // ---- Northern expansion: The Forgotten Castle (the secret boss) ----
  hollow_castellan: {
    type: 'hollow_castellan', secret: true,
    name: 'The Hollow Castellan',
    x: 3060, y: 450, r: 28, hp: 2600, speed: 80, dmg: 32, ess: 1500,
    arena: { minX: 2920, maxX: 3200, minY: 300, maxY: 600 },
    phase2at: 0.5, introStyle: 'throne',
    introMsg: 'The Keep Stirs', phase2Msg: 'The Warhorse Corrupts',
    burstColor: '#d4a040',
    trigger: { minX: 2940, maxX: 3180, minY: 320, maxY: 580 },
    soul: 'fortress', unlockGate: 'castellan_unlock',
    rewards: [
      { type: 'outfit', id: 'castellan_plate', name: "Castellan's Plate" },
      { type: 'shards', amount: 8 },
    ],
  },
  // ---- Northern expansion: Whispering Wood ----
  wailing_mother: {
    type: 'wailing_mother', secret: true,
    name: 'The Wailing Mother',
    x: 3860, y: 260, r: 26, hp: 2660, speed: 88, dmg: 36, ess: 1050,
    arena: { minX: 3740, maxX: 3980, minY: 120, maxY: 420 },
    phase2at: 0.5, introStyle: 'fog',
    introMsg: 'A Cry in the Wood', phase2Msg: 'The Wailing Deepens',
    burstColor: '#7aa86a',
    trigger: { minX: 3760, maxX: 3960, minY: 150, maxY: 400 },
    rewards: [
      { type: 'outfit', id: 'wail_mantle', name: 'Wail Mantle' },
      { type: 'shards', amount: 6 },
    ],
  },
  // ---- Northern expansion: Cliffside Walk (a hidden perch arena) ----
  cliff_watcher: {
    type: 'cliff_watcher', secret: true,
    name: 'The Cliff Watcher',
    x: 4720, y: 2400, r: 26, hp: 3150, speed: 78, dmg: 45, ess: 1100,
    arena: { minX: 4520, maxX: 4920, minY: 2260, maxY: 2560 },
    phase2at: 0.5, introStyle: 'fog',
    introMsg: 'The Cliff Stirs', phase2Msg: 'The Watcher Descends',
    burstColor: '#8a9aa8',
    trigger: { minX: 4540, maxX: 4900, minY: 2280, maxY: 2540 },
    soul: 'stoneform',
    rewards: [
      { type: 'shards', amount: 6 },
    ],
  },
};

export function checkTrigger(game) {
  const p = game.player;
  if (!p) return;
  for (const def of Object.values(DEFS)) {
    if (!def.secret) continue;
    if (game.boss || game.defeatedBosses.has(def.type)) continue;
    if (def.condition && !def.condition(game)) continue;
    const z = def.trigger;
    if (p.x > z.minX && p.x < z.maxX && p.y > z.minY && p.y < z.maxY) spawnSecret(game, def);
  }
}

function spawnSecret(game, def) {
  game.state = 'bossIntro';
  game.encounteredBosses.add(def.type);
  // Boss difficulty rebalance: all secret bosses are tougher (+50% HP, +20% dmg).
  game.boss = {
    type: def.type, name: def.name, x: def.x, y: def.y, r: def.r, hp: Math.round(def.hp * 1.5), maxHp: Math.round(def.hp * 1.5), alive: true,
    speed: def.speed, dmg: Math.round(def.dmg * 1.2), facing: Math.PI, state: 'intro', stateT: 0,
    phase: 1, attackPhase: null, staggered: 0, hitFlash: 0, parryable: false,
    fireCool: 2, comboT: 0, vx: 0, vy: 0, ess: def.ess,
    arena: def.arena, phase2at: def.phase2at, phase3at: 0,
    introMsg: def.introMsg, phase2Msg: def.phase2Msg, phase3Msg: '',
    introStyle: def.introStyle, introT: 0, introDur: 6.5, _introAlpha: 0,
    _roared: false, _landed: false, secret: true,
  };
  game.boss._x0 = def.x; game.boss._y0 = def.y;
  game.boss.y = def.y + 160;
  game.hooks.onBossIntro && game.hooks.onBossIntro(def.name);
  game.hooks.onState && game.hooks.onState('bossIntro');
}

export function onDefeated(game, b) {
  const def = DEFS[b.type];
  if (!def || !def.secret) return false;
  game.sound.stopBossTheme();
  game.defeatedBosses.add(b.type);
  game.hooks.onBossEnd && game.hooks.onBossEnd();
  game._burst(b.x, b.y, def.burstColor || '#a0c0e0', 56, 300);
  game.sound.victory();
  const p = game.player;
  for (const r of (def.rewards || [])) {
    if (r.type === 'outfit' && !p.outfits.has(r.id)) { p.outfits.add(r.id); game._showMsg('Outfit acquired: ' + r.name, 2400); }
    else if (r.type === 'skin' && !(p.skins || new Set(['default'])).has(r.id)) { (p.skins || (p.skins = new Set(['default']))).add(r.id); game._showMsg('Weapon skin acquired: ' + r.name, 2400); }
    else if (r.type === 'charm' && !p.charms.has(r.id)) { game._grantCharm(r.id); }
    else if (r.type === 'shards') { p.shards = (p.shards || 0) + r.amount; game._showMsg('+' + r.amount + ' Bloodstone Shards', 2000); }
  }
  if (def.soul) {
    const soul = SOUL_MAP[def.soul];
    if (soul && !(p.souls || (p.souls = new Set())).has(soul.id)) {
      p.souls.add(soul.id);
      game.soulReward = soul;
      game.hooks.onSoulReward && game.hooks.onSoulReward(soul);
      game.sound.soulReward && game.sound.soulReward();
    }
  }
  if (def.unlockGate) game._openGate(def.unlockGate);
  game.state = 'playing';
  game.hooks.onState && game.hooks.onState('playing');
  Save.saveGame(game);
  game._pushHud();
  return true;
}

// ---- render: a ghostly pale wraith (tattered shroud, hollow eyes, scythe) ----
export function drawPaleWraith(game, ctx, b) {
  const t = game.runtime;
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const gl = 0.6 + Math.sin(t * 5) * 0.4;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.1, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  // faint aura
  const ag = ctx.createRadialGradient(0, 0, 4, 0, 0, b.r * 1.8);
  ag.addColorStop(0, flash ? 'rgba(255,255,255,0.5)' : `rgba(160,200,230,${0.18 + gl * 0.1})`);
  ag.addColorStop(1, 'rgba(160,200,230,0)');
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, b.r * 1.8, 0, TAU); ctx.fill();
  // tattered shroud
  const shroud = flash ? '#fff' : stag ? '#9aa0ff' : '#c8d4e4';
  ctx.fillStyle = shroud;
  ctx.beginPath(); ctx.ellipse(0, 2, b.r * 1.2, b.r * 1.5, 0, 0, TAU); ctx.fill();
  // ragged hem
  ctx.fillStyle = flash ? '#fff' : '#a8b8cc';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.32, b.r * 1.1); ctx.lineTo(i * b.r * 0.32 + b.r * 0.18, b.r * 1.7); ctx.lineTo(i * b.r * 0.32 - b.r * 0.12, b.r * 1.5); ctx.closePath(); ctx.fill(); }
  // hood + shadowed face
  ctx.fillStyle = flash ? '#fff' : '#9aa6b8'; ctx.beginPath(); ctx.arc(b.r * 0.1, -b.r * 0.5, b.r * 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0e14'; ctx.beginPath(); ctx.ellipse(b.r * 0.15, -b.r * 0.45, b.r * 0.34, b.r * 0.4, 0, 0, TAU); ctx.fill();
  // hollow glowing eyes
  ctx.fillStyle = flash ? '#fff' : `rgba(180,220,255,${gl})`;
  ctx.beginPath(); ctx.arc(b.r * 0.28, -b.r * 0.5, 2.4, 0, TAU); ctx.arc(b.r * 0.48, -b.r * 0.46, 2.2, 0, TAU); ctx.fill();
  // ghostly scythe
  ctx.strokeStyle = flash ? '#fff' : '#d8e0ec'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.3, b.r * 0.2); ctx.lineTo(b.r * 1.7, -b.r * 0.5); ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : '#e8eef8'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(b.r * 1.5, -b.r * 0.5, b.r * 0.5, -1.4, 0.4); ctx.stroke();
  ctx.restore();
}

// ---- The Winter Hierophant: a tall skeletal frost-priest in a cracked porcelain
// mask, trailing snow and frozen ash, orbited by ice shards, bearing a staff
// whose hanging lantern extinguishes during windups and erupts in cold blue
// flame on the strike. Arena, lore, and moveset are unchanged. ----
export function drawWinterHierophant(game, ctx, b) {
  const t = game.runtime;
  const flash = b.hitFlash > 0, stag = b.staggered > 0, p2 = b.phase >= 2;
  // The staff lantern reacts to the attack cycle: dims during a windup, erupts
  // in cold blue flame on the active strike.
  const atk = b.state === 'attack';
  const winding = atk && b.attackPhase === 'windup';
  const erupting = atk && b.attackPhase === 'active';

  ctx.save(); ctx.translate(b.x, b.y);
  // ground shadow + frost base
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.25, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(150,190,220,0.16)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.7, b.r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);

  // ---- small ice shards slowly orbiting the boss ----
  const shards = 5;
  for (let i = 0; i < shards; i++) {
    const ang = t * 0.9 + (i / shards) * TAU;
    const rad = b.r * 1.75 + Math.sin(t * 2 + i) * 4;
    const sx = Math.cos(ang) * rad, sy = Math.sin(ang) * rad;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang * 2);
    ctx.fillStyle = flash ? '#fff' : `rgba(185,228,248,${0.65 + 0.3 * Math.sin(t * 3 + i)})`;
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }

  // ---- the robe constantly sheds snow and frozen ash ----
  if (Math.random() < 0.5) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 1.8, y: b.y + (Math.random() - 0.5) * b.r * 1.2, vx: (Math.random() - 0.5) * 12, vy: -rand(8, 36), life: rand(0.7, 1.3), max: 1.3, r: rand(1.2, 2.4), color: Math.random() < 0.5 ? 'rgba(220,235,250,0.7)' : 'rgba(180,200,220,0.5)' });

  // ---- every footstep leaves frozen ground that quickly melts away ----
  if (b._prevFX === undefined) { b._prevFX = b.x; b._prevFY = b.y; }
  if (Math.hypot(b.x - b._prevFX, b.y - b._prevFY) > 6) {
    b._prevFX = b.x; b._prevFY = b.y;
    game.particles.push({ x: b.x + (Math.random() - 0.5) * 8, y: b.y + b.r * 0.8, vx: 0, vy: 0, life: 1.1, max: 1.1, r: 5, color: 'rgba(190,222,242,0.45)' });
  }

  // ---- long, tattered ceremonial robes (tall & slender) ----
  const robe = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#1e3a52' : '#2a4a64';
  const robeD = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#0e2238' : '#1a324a';
  ctx.fillStyle = robeD; ctx.beginPath(); ctx.ellipse(0, b.r * 0.35, b.r * 1.05, b.r * 1.75, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, b.r * 0.25, b.r * 0.92, b.r * 1.6, 0, 0, TAU); ctx.fill();
  // ragged, frost-crusted hem
  ctx.fillStyle = flash ? '#fff' : 'rgba(200,225,245,0.55)';
  for (let i = -3; i <= 3; i++) {
    const hx = i * b.r * 0.28;
    ctx.beginPath(); ctx.moveTo(hx - b.r * 0.14, b.r * 1.5); ctx.lineTo(hx + b.r * 0.1, b.r * 1.95 + Math.abs(i) * 3); ctx.lineTo(hx + b.r * 0.18, b.r * 1.55); ctx.closePath(); ctx.fill();
  }
  // frost seams down the robe
  ctx.strokeStyle = flash ? '#fff' : 'rgba(200,230,250,0.4)'; ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.4, -b.r * 0.2); ctx.lineTo(i * b.r * 0.4, b.r * 1.4); ctx.stroke(); }

  // ---- gaunt skeletal chest with visible ribs ----
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#cad8e2'; ctx.beginPath(); ctx.ellipse(b.r * 0.1, b.r * 0.1, b.r * 0.42, b.r * 0.85, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = flash ? '#fff' : 'rgba(120,150,170,0.6)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) { const yy = -b.r * 0.1 + i * b.r * 0.28; ctx.beginPath(); ctx.moveTo(b.r * 0.1, yy); ctx.lineTo(b.r * 0.42, yy + 3); ctx.stroke(); }
  // long thin arm clutching the staff + bony hand
  ctx.strokeStyle = robe; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.r * 0.05, b.r * 0.2); ctx.lineTo(b.r * 0.85, b.r * 0.4); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#cad8e2'; ctx.beginPath(); ctx.arc(b.r * 0.85, b.r * 0.4, 3, 0, TAU); ctx.fill();

  // ---- hood + cracked porcelain mask with glowing icy blue eyes ----
  ctx.fillStyle = flash ? '#fff' : robeD; ctx.beginPath(); ctx.arc(b.r * 0.1, -b.r * 0.55, b.r * 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#eef2f4'; ctx.beginPath(); ctx.ellipse(b.r * 0.18, -b.r * 0.5, b.r * 0.36, b.r * 0.42, 0, 0, TAU); ctx.fill();
  // cracks across the mask
  ctx.strokeStyle = flash ? '#fff' : 'rgba(120,140,160,0.6)'; ctx.lineWidth = 1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.05, -b.r * 0.7); ctx.lineTo(b.r * 0.2, -b.r * 0.45); ctx.lineTo(b.r * 0.12, -b.r * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(b.r * 0.3, -b.r * 0.62); ctx.lineTo(b.r * 0.28, -b.r * 0.4); ctx.stroke();
  // glowing icy blue eyes
  const eg = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(150,225,255,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.28, -b.r * 0.55, 2.6, 0, TAU); ctx.arc(b.r * 0.44, -b.r * 0.5, 2.4, 0, TAU); ctx.fill();
  ctx.save(); ctx.shadowColor = 'rgba(140,210,255,0.9)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(b.r * 0.28, -b.r * 0.55, 1.4, 0, TAU); ctx.arc(b.r * 0.44, -b.r * 0.5, 1.3, 0, TAU); ctx.fill();
  ctx.restore();

  // ---- long frost staff with an ancient lantern hanging from the top ----
  const staffTopX = b.r * 1.5, staffTopY = -b.r * 1.5;
  ctx.strokeStyle = '#3a5266'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.r * 0.85, b.r * 0.4); ctx.lineTo(staffTopX, staffTopY); ctx.stroke();
  ctx.strokeStyle = 'rgba(190,220,240,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.r * 0.85, b.r * 0.4); ctx.lineTo(staffTopX, staffTopY); ctx.stroke();
  // hanging lantern
  ctx.save(); ctx.translate(staffTopX, staffTopY);
  ctx.strokeStyle = 'rgba(90,100,110,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 6); ctx.stroke();
  ctx.fillStyle = '#1a2a36'; ctx.fillRect(-5, 6, 10, 12);
  ctx.strokeStyle = '#3a4a58'; ctx.lineWidth = 1; ctx.strokeRect(-5, 6, 10, 12);
  const lanternGlow = erupting ? 1 : (winding ? 0.12 : 0.7 + Math.sin(t * 4) * 0.2);
  if (lanternGlow > 0.02) {
    const lg = ctx.createRadialGradient(0, 12, 1, 0, 12, 11);
    lg.addColorStop(0, `rgba(150,230,255,${lanternGlow})`); lg.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, 12, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = erupting ? `rgba(185,240,255,${lanternGlow})` : `rgba(210,240,255,${lanternGlow * 0.8})`;
    ctx.beginPath(); ctx.ellipse(0, 12, 3, 4 * lanternGlow, 0, 0, TAU); ctx.fill();
  }
  // cold blue flame eruption on the active strike
  if (erupting) {
    for (let i = 0; i < 6; i++) {
      const fa = -Math.PI / 2 + (i - 2.5) * 0.35;
      const fl = 11 + Math.sin(t * 20 + i) * 4;
      ctx.fillStyle = 'rgba(140,220,255,0.7)';
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(Math.cos(fa) * fl, 8 + Math.sin(fa) * fl); ctx.lineTo(Math.cos(fa) * fl * 0.4, 8 + Math.sin(fa) * fl * 0.4); ctx.closePath(); ctx.fill();
    }
    if (Math.random() < 0.7) game.particles.push({ x: b.x + Math.cos(b.facing) * b.r * 1.5, y: b.y + Math.sin(b.facing) * b.r * 1.5 - b.r * 1.5, vx: (Math.random() - 0.5) * 60, vy: -rand(40, 120), life: 0.5, max: 0.5, r: 2.4, color: 'rgba(150,225,255,0.8)', spark: true });
  }
  ctx.restore();

  ctx.restore();
}

// ---- The Hollow Castellan's mounted render lives in MountedBoss.js ----

// ---- The Wailing Mother: a hunched weeping beast-wraith of the wood. ----
export function drawWailingMother(game, ctx, b) {
  const t = game.runtime;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0, p2 = b.phase >= 2;
  if (Math.random() < 0.4) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 2, y: b.y, vx: (Math.random() - 0.5) * 20, vy: -rand(10, 50), life: 0.9, max: 0.9, r: 2.2, color: 'rgba(120,170,90,0.4)' });
  const fur = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#243a1a' : '#2a3a24';
  const furD = flash ? '#fff' : stag ? '#9aa0ff' : '#16240e';
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, b.r * 0.25, b.r * 1.4, b.r * 1.6, 0, 0, TAU); ctx.fill();
  // matted moss-fur ridges
  ctx.strokeStyle = furD; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const yy = -b.r * 0.6 + i * b.r * 0.32; ctx.beginPath(); ctx.moveTo(-b.r * 0.9, yy); ctx.lineTo(b.r * 0.6, yy + 4); ctx.stroke(); }
  // tattered shroud
  ctx.fillStyle = flash ? '#fff' : '#1a2a14'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.3, b.r * 1.2); ctx.lineTo(i * b.r * 0.3 + b.r * 0.12, b.r * 1.8); ctx.lineTo(i * b.r * 0.3 - b.r * 0.08, b.r * 1.55); ctx.closePath(); ctx.fill(); }
  // hunched head
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(b.r * 0.35, -b.r * 0.35, b.r * 0.75, b.r * 0.7, 0, 0, TAU); ctx.fill();
  // weeping maw
  ctx.fillStyle = flash ? '#fff' : '#0a1a06'; ctx.beginPath(); ctx.moveTo(b.r * 0.6, -b.r * 0.2); ctx.lineTo(b.r * 1.2, b.r * 0.0); ctx.lineTo(b.r * 0.7, b.r * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(b.r * 1.0, b.r * 0.0); ctx.lineTo(b.r * 1.1, b.r * 0.16); ctx.lineTo(b.r * 0.9, b.r * 0.06); ctx.closePath(); ctx.fill();
  // long weeping ears
  ctx.fillStyle = furD; ctx.beginPath(); ctx.moveTo(b.r * 0.15, -b.r * 0.8); ctx.lineTo(b.r * 0.0, -b.r * 1.3); ctx.lineTo(b.r * 0.4, -b.r * 0.9); ctx.closePath(); ctx.fill();
  // sorrowful glowing eyes
  const eg = 0.6 + Math.sin(t * 6) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(150,220,120,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.55, -b.r * 0.4, 3, 0, TAU); ctx.arc(b.r * 0.8, -b.r * 0.25, 2.6, 0, TAU); ctx.fill();
  // clawed arms
  ctx.strokeStyle = fur; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.r * 0.2, b.r * 0.3); ctx.lineTo(b.r * 1.5, b.r * 0.5); ctx.stroke();
  ctx.restore();
}

// ---- The Cliff Watcher: a stone gargoyle that hovers, dives, and petrifies. ----
export function drawCliffWatcher(game, ctx, b) {
  const t = game.runtime;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0, p2 = b.phase >= 2;
  const flap = Math.sin(t * 4) * 0.4;
  const stone = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#3a4448' : '#4a5458';
  const stoneD = flash ? '#fff' : stag ? '#9aa0ff' : '#2a3236';
  // stone wings (flapping)
  ctx.fillStyle = stoneD;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-b.r * 1.6, -b.r * 0.8 - flap * b.r, -b.r * 1.9, b.r * 0.2 + flap * b.r * 0.5); ctx.quadraticCurveTo(-b.r * 1.2, b.r * 0.3, 0, b.r * 0.4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(b.r * 1.6, -b.r * 0.8 - flap * b.r, b.r * 1.9, b.r * 0.2 + flap * b.r * 0.5); ctx.quadraticCurveTo(b.r * 1.2, b.r * 0.3, 0, b.r * 0.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = stone; ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { if (!i) continue; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * b.r * 0.8, -b.r * 0.5 + flap * b.r); ctx.stroke(); }
  // crouched body
  ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 0.9, b.r * 1.0, 0, 0, TAU); ctx.fill();
  // horned head
  ctx.fillStyle = stone; ctx.beginPath(); ctx.arc(b.r * 0.2, -b.r * 0.4, b.r * 0.42, 0, TAU); ctx.fill();
  ctx.strokeStyle = stoneD; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.1, -b.r * 0.7); ctx.lineTo(-b.r * 0.1, -b.r * 1.2); ctx.moveTo(b.r * 0.4, -b.r * 0.6); ctx.lineTo(b.r * 0.55, -b.r * 1.1); ctx.stroke();
  // glowing eyes
  const eg = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(200,230,120,${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 0.3, -b.r * 0.45, 2.6, 0, TAU); ctx.arc(b.r * 0.48, -b.r * 0.4, 2.4, 0, TAU); ctx.fill();
  // talons
  ctx.strokeStyle = stone; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.r * 0.3, b.r * 0.6); ctx.lineTo(b.r * 1.1, b.r * 0.9); ctx.stroke();
  ctx.restore();
}

function rand(a, b) { return a + Math.random() * (b - a); }