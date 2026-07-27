// BossSystem.js — all major-boss combat AI, extracted from HuntGame so each
// boss can have a unique, memorable moveset instead of the old shared
// gun+bullet-spam pattern. Each boss picks from its OWN attack list; a shared
// resolver handles the active-phase behavior (melee, flurry, dash, slam,
// shockwave, pool, teleport, summon, charge, grab, nova, flood, etc.).
//
// The final boss (The First Voice) lives in Endgame.js and reuses the shared
// startAttack / resolveAttack / helpers exported here.

import * as Underworld from './Underworld.js';
import * as Celestial from './CelestialEnding.js';
import * as Mounted from './MountedBoss.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

// ---- Attack table: every attack across every boss, with timing + behavior kind ----
const A = {
  // === The Drowned Vicar (water cleric: pools + tidal wave) ===
  tridentSweep:  { windup: 0.45, active: 0.18, recover: 0.5,  reach: 94,  arc: 1.5, parry: true,  kind: 'melee' },
  tridentThrust: { windup: 0.5,  active: 0.14, recover: 0.5,  reach: 122, arc: 0.5, parry: true,  kind: 'melee' },
  holySplash:    { windup: 0.6,  active: 0.1,  recover: 0.6,  kind: 'pool', poolR: 70,  poolLife: 5, poolDps: 22, poolColor: 'rgba(80,140,200,0.45)' },
  tidalWave:     { windup: 0.8,  active: 0.2,  recover: 0.7,  kind: 'wave' },
  geyser:        { windup: 0.5,  active: 0.1,  recover: 0.6,  kind: 'geyser' },

  // === Father Gascoigne (hunter -> beast: combos, charge, pounce) ===
  cleaverCombo:  { windup: 0.4,  active: 0.7,  recover: 0.5,  reach: 88,  arc: 1.3, parry: true,  kind: 'flurry', hits: 3, hitEvery: 0.22 },
  overheadSlam:  { windup: 0.65, active: 0.2,  recover: 0.6,  reach: 110, arc: 1.6, parry: false, kind: 'slam', slamShock: false },
  pistolShot:    { windup: 0.35, active: 0.08, recover: 0.4,  kind: 'shot', parry: true },
  leapPounce:    { windup: 0.45, active: 0.4,  recover: 0.5,  kind: 'dash' },
  maulFlurry:    { windup: 0.4,  active: 0.66, recover: 0.5,  reach: 84,  arc: 1.6, parry: true,  kind: 'flurry', hits: 4, hitEvery: 0.16 },
  charge:        { windup: 0.7,  active: 0.55, recover: 0.6,  kind: 'charge' },
  howl:          { windup: 0.55, active: 0.3,  recover: 0.6,  kind: 'roar' },

  // === The Nightmare (cosmic horror: teleports + reality tear) ===
  tentacleLash:  { windup: 0.45, active: 0.2,  recover: 0.5,  reach: 116, arc: 1.9, parry: true,  kind: 'melee' },
  teleportStrike:{ windup: 0.5,  active: 0.2,  recover: 0.5,  reach: 110, arc: 1.8, parry: true,  kind: 'teleportStrike' },
  cosmicOrb:     { windup: 0.5,  active: 0.12, recover: 0.5,  kind: 'orb' },
  realityBurst:  { windup: 0.7,  active: 0.2,  recover: 0.7,  kind: 'burst' },
  realityTear:   { windup: 0.9,  active: 0.3,  recover: 0.8,  kind: 'nova', novaR: 700, novaSpeed: 420 },

  // === The Mire Mother (ancient magic: staff bolts, thorn vines, rune circles) ===
  mireBolt:      { windup: 0.5,  active: 0.12, recover: 0.45, kind: 'mireBolt' },
  mireVines:     { windup: 0.75, active: 0.15, recover: 0.6,  kind: 'vines' },
  mireRune:      { windup: 0.95, active: 0.2,  recover: 0.7,  kind: 'runeCircle' },
  mireTeleport:  { windup: 0.35, active: 0.05, recover: 0.25, kind: 'teleport' },
  // Phase 2: arcane spears, a great shockwave, and a rain of bolts.
  mireSpears:    { windup: 0.7,  active: 0.25, recover: 0.6,  kind: 'arcaneSpears' },
  mireNova:      { windup: 1.0,  active: 0.3,  recover: 0.8,  kind: 'nova', novaR: 560, novaSpeed: 380, color: '#5acfa0' },
  mireRain:      { windup: 0.8,  active: 0.95, recover: 0.6,  kind: 'rainBolts' },

  // === The Hollow King (greatsword melee: combos, slams, lunge, grab, knights) ===
  swordCombo:    { windup: 0.45, active: 0.75, recover: 0.55, reach: 104, arc: 1.4, parry: true,  kind: 'flurry', hits: 3, hitEvery: 0.24 },
  shockwaveSlam: { windup: 0.75, active: 0.3,  recover: 0.65, reach: 120, arc: 1.8, parry: false, kind: 'slam', slamShock: true, shockR: 280, shockDmg: 0.6 },
  quickLunge:    { windup: 0.35, active: 0.3,  recover: 0.45, kind: 'lunge', reach: 130 },
  kingGrab:      { windup: 0.8,  active: 0.45, recover: 0.7,  kind: 'grab', reach: 70 },
  summonKnights: { windup: 0.8,  active: 0.2,  recover: 0.7,  kind: 'summon', count: 2, summonType: 'knight' },
  energyShockwave:{windup: 0.7,  active: 0.25, recover: 0.7,  kind: 'nova', novaR: 440, novaSpeed: 360 },
  greatswordSpin:{ windup: 0.5,  active: 0.6,  recover: 0.5,  reach: 130, arc: TAU, parry: false, kind: 'spin' },
  hollowStorm:   { windup: 1.0,  active: 0.35, recover: 0.9,  kind: 'nova', novaR: 620, novaSpeed: 380 },

  // === The Archivist (book/paper magic: book volleys, ink pools, page storms) ===
  tomeWhack:     { windup: 0.4,  active: 0.16, recover: 0.45, reach: 90,  arc: 1.3, parry: true,  kind: 'melee' },
  bookBarrage:   { windup: 0.6,  active: 0.16, recover: 0.6,  kind: 'bookFan', parry: false },
  shelfCollapse: { windup: 0.5,  active: 0.3,  recover: 0.6,  reach: 130, arc: 2.0, parry: false, kind: 'slam', slamShock: false },
  pageStorm:     { windup: 0.8,  active: 0.25, recover: 0.7,  kind: 'pageStorm' },
  inkPool:       { windup: 0.5,  active: 0.1,  recover: 0.5,  kind: 'pool', poolR: 90,  poolLife: 7, poolDps: 14, poolColor: 'rgba(30,20,50,0.55)' },
  archivistTeleport:{ windup: 0.4, active: 0.05, recover: 0.3, kind: 'teleport' },
  forbiddenStorm:{ windup: 1.0,  active: 0.35, recover: 0.9,  kind: 'pageStorm', big: true },
  summonScholars:{ windup: 0.8,  active: 0.2,  recover: 0.7,  kind: 'summon', count: 2, summonType: 'scholar' },

  // === The First Voice (final boss: hymn shockwaves, flood, silence nova) ===
  hymnPulse:     { windup: 0.7,  active: 0.2,  recover: 0.6,  kind: 'hymn' },
  waterLash:      { windup: 0.45, active: 0.18, recover: 0.45, reach: 130, arc: 1.0, parry: true,  kind: 'melee' },
  summonChoir:    { windup: 0.8,  active: 0.2,  recover: 0.7,  kind: 'summon', count: 2, summonType: 'crawler' },
  tidalSurge:    { windup: 0.8,  active: 0.25, recover: 0.7,  kind: 'surge' },
  floodRise:     { windup: 1.0,  active: 0.3,  recover: 0.8,  kind: 'flood' },
  aquaStep:      { windup: 0.4,  active: 0.05, recover: 0.3,  kind: 'teleport' },
  comboLash:      { windup: 0.4,  active: 0.6,  recover: 0.5,  reach: 120, arc: 1.6, parry: true,  kind: 'flurry', hits: 3, hitEvery: 0.2 },
  silenceNova:   { windup: 1.2, active: 0.4, recover: 1.0, kind: 'silenceNova' },

  // === The First Beast (Elias, phase IV): ultimate-form attacks ===
  abyssalNova:    { windup: 1.4, active: 0.5, recover: 1.1, kind: 'abyssalNova' },
  voidBarrage:    { windup: 0.7, active: 0.25, recover: 0.7, kind: 'voidBarrage' },
  leviathanCharge:{ windup: 0.6, active: 0.6, recover: 0.6, kind: 'charge' },
  drowningDeluge: { windup: 1.1, active: 0.35, recover: 0.9, kind: 'deluge' },

  // === Northern expansion: The Winter Hierophant (frost caster) ===
  iceShard:   { windup: 0.5, active: 0.12, recover: 0.5, kind: 'orb', color: '#7ac0e0' },
  frostBurst: { windup: 0.7, active: 0.2,  recover: 0.7, kind: 'burst', color: '#7ac0e0' },
  frostNova:  { windup: 0.9, active: 0.3,  recover: 0.8, kind: 'nova', novaR: 600, novaSpeed: 400, color: '#9ad8f0' },
  icePool:    { windup: 0.5, active: 0.1,  recover: 0.5, kind: 'pool', poolR: 80, poolLife: 6, poolDps: 16, poolColor: 'rgba(120,180,220,0.45)' },
  // === Northern expansion: The Hollow Castellan (greatsword warden) ===
  castleBanner: { windup: 0.8, active: 0.2, recover: 0.7, kind: 'summon', count: 2, summonType: 'guardian' },
  castleNova:   { windup: 1.0, active: 0.35, recover: 0.9, kind: 'nova', novaR: 560, novaSpeed: 380, color: '#d4a040' },
  // === Northern expansion: The Wailing Mother (fear, screams, haunting) ===
  screamShock:   { windup: 0.7,  active: 0.2,  recover: 0.6,  kind: 'screamShock' },
  ghostHands:    { windup: 0.8,  active: 0.2,  recover: 0.7,  kind: 'ghostHands' },
  clawCombo:     { windup: 0.4,  active: 0.7,  recover: 0.45, reach: 122, arc: 1.5, parry: true, kind: 'flurry', hits: 3, hitEvery: 0.2 },
  cursedMist:    { windup: 0.8,  active: 0.15, recover: 0.7,  kind: 'pool', poolR: 115, poolLife: 7, poolDps: 18, poolColor: 'rgba(120,160,90,0.5)' },
  wailIllusion:  { windup: 0.8,  active: 0.35, recover: 0.7,  kind: 'illusions' },
  fastClaw:      { windup: 0.3,  active: 0.55, recover: 0.35, reach: 126, arc: 1.6, parry: true, kind: 'flurry', hits: 4, hitEvery: 0.14 },
  massiveScream: { windup: 1.4,  active: 0.45, recover: 1.0,  kind: 'massiveScream' },

  // === Northern expansion: The Cliff Watcher (stone gargoyle) ===
  cliffTalon: { windup: 0.4, active: 0.18, recover: 0.4, reach: 100, arc: 1.4, parry: true, kind: 'melee' },
  cliffDive:  { windup: 0.7, active: 0.4,  recover: 0.6, kind: 'dive' },
  cliffGust:  { windup: 0.6, active: 0.2,  recover: 0.6, kind: 'gust' },
  cliffGaze:  { windup: 1.0, active: 0.3,  recover: 0.8, kind: 'gaze' },
  cliffPerch: { windup: 0.4, active: 0.05, recover: 0.3, kind: 'teleport' },
  };

// ---- shared frame helpers (used by every per-boss update) ----
export function beginFrame(game, b, dt) {
  if (b.hitFlash > 0) b.hitFlash -= dt;
  if (b.staggered > 0) {
    b.staggered -= dt;
    b.vx *= Math.max(0, 1 - dt * 5); b.vy *= Math.max(0, 1 - dt * 5);
    b.x += b.vx * dt; b.y += b.vy * dt; game._collideWalls(b);
    if (b.staggered <= 0) b.state = 'chase';
    game.hooks.onBossHp && game.hooks.onBossHp(b.hp, b.maxHp);
    return false;
  }
  return true;
}
export function endFrame(game, b, dt) {
  b.x += b.vx * dt; b.y += b.vy * dt;
  b.vx *= Math.max(0, 1 - dt * 6); b.vy *= Math.max(0, 1 - dt * 6);
  game._collideWalls(b);
  b.x = clamp(b.x, b.arena.minX, b.arena.maxX); b.y = clamp(b.y, b.arena.minY, b.arena.maxY);
  game.hooks.onBossHp && game.hooks.onBossHp(b.hp, b.maxHp);
}
export function stepToward(game, b, dt) { b.x += Math.cos(b.facing) * b.speed * dt; b.y += Math.sin(b.facing) * b.speed * dt; }
export function stepTowardSlow(game, b, dt) { b.x += Math.cos(b.facing) * b.speed * 0.5 * dt; b.y += Math.sin(b.facing) * b.speed * 0.5 * dt; }
export function stepAway(game, b, dt) { b.x -= Math.cos(b.facing) * b.speed * dt; b.y -= Math.sin(b.facing) * b.speed * dt; }
export function phaseBurst(game, b, color, msg) {
  game.sound.bossPhase(); game.sound.setBossPhase(b.phase);
  game.camera.shake = Math.max(game.camera.shake, 14);
  game._burst(b.x, b.y, color, 44, 280); game._showMsg(msg, 2000);
  b.state = 'chase'; b.stateT = 0; b.attackPhase = null;
}

// ---- attack lifecycle ----
export function startAttack(game, b, type) {
  b.state = 'attack'; b.stateT = 0; b.attackPhase = 'windup'; b._hit = false; b._fired = false;
  b._flurryT = 0; b._attackType = type; b._leapTarget = null;
  const def = A[type];
  if (def && (def.kind === 'dash' || def.kind === 'dive')) b._leapTarget = { x: game.player.x, y: game.player.y };
}
export function meleeHit(game, b, reach, arc) {
  const p = game.player;
  const d = Math.hypot(p.x - b.x, p.y - b.y);
  const a = Math.atan2(p.y - b.y, p.x - b.x);
  if (!b._hit && d < reach + p.r && Math.abs(angDiff(b.facing, a)) < arc) {
    b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y);
  }
}
export function teleport(game, b) {
  game._burst(b.x, b.y, '#a06ad6', 22, 200);
  const a = Math.random() * TAU, r = 220 + Math.random() * 120;
  b.x = clamp(game.player.x + Math.cos(a) * r, b.arena.minX, b.arena.maxX);
  b.y = clamp(game.player.y + Math.sin(a) * r, b.arena.minY, b.arena.maxY);
  b.vx = 0; b.vy = 0;
  game._burst(b.x, b.y, '#a06ad6', 22, 200);
  game.sound.transform();
}
export function summon(game, b, type) {
  const a = Math.random() * TAU;
  const x = clamp(b.x + Math.cos(a) * 80, b.arena.minX, b.arena.maxX);
  const y = clamp(b.y + Math.sin(a) * 80, b.arena.minY, b.arena.maxY);
  game.enemies.push(game._spawnEnemy(type, x, y));
  game._burst(x, y, '#a06ad6', 14, 160);
}
export function spawnPool(game, x, y, r, life, dps, color) {
  game.pools = game.pools || [];
  game.pools.push({ x, y, r, life, maxLife: life, dps, color });
}
export function spawnShockwave(game, x, y, dmg, maxR, speed, color, losCheck) {
  game.shockwaves.push({ x, y, r: 20, speed, maxR, dmg, color, losCheck: !!losCheck, hit: false });
}

// line-of-sight check: true if a solid wall blocks the segment between two points
export function lineBlocked(game, ax, ay, bx, by) {
  for (const w of game.world.walls) {
    if (w.gate && game.openGates.has(w.gate)) continue;
    if (w.parapet) continue;
    if (segRect(ax, ay, bx, by, w.x, w.y, w.w, w.h)) return true;
  }
  return false;
}
function segRect(ax, ay, bx, by, rx, ry, rw, rh) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 12);
  for (let i = 1; i < steps; i++) {
    const t = i / steps, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    if (x > rx && x < rx + rw && y > ry && y < ry + rh) return true;
  }
  return false;
}

// ---- the shared active-phase resolver ----
export function resolveAttack(game, b, dt) {
  const def = A[b._attackType] || A.tomeWhack;
  b.parryable = b.attackPhase === 'windup' && !!def.parry;
  if (b.attackPhase === 'windup') {
    if (b.stateT >= def.windup) { b.attackPhase = 'active'; b.stateT = 0; b._hit = false; b._fired = false; }
  } else if (b.attackPhase === 'active') {
    switch (def.kind) {
      case 'melee': meleeHit(game, b, def.reach, def.arc); break;
      case 'flurry':
        b._flurryT = (b._flurryT || 0) + dt;
        if (b._flurryT >= def.hitEvery) { b._flurryT = 0; b._hit = false; }
        meleeHit(game, b, def.reach, def.arc);
        break;
      case 'spin':
        b._flurryT = (b._flurryT || 0) + dt;
        if (b._flurryT >= 0.25) { b._flurryT = 0; b._hit = false; }
        b.facing += dt * 9;
        meleeHit(game, b, def.reach, Math.PI * 2);
        break;
      case 'slam':
        meleeHit(game, b, def.reach, def.arc);
        if (!b._fired && def.slamShock) {
          b._fired = true;
          spawnShockwave(game, b.x, b.y, Math.round(b.dmg * def.shockDmg), def.shockR || 240, 280, '#d4c060');
          game.camera.shake = Math.max(game.camera.shake, 12); game.sound.bossRoar();
        }
        break;
      case 'shot':
        if (!b._fired) { b._fired = true; const a = b.facing; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 540, vy: Math.sin(a) * 540, life: 1.6, r: 5, fromPlayer: false, dmg: Math.round(b.dmg * 0.7), color: '#ffd27a' }); game.sound.shot(); }
        break;
      case 'orb':
        if (!b._fired) { b._fired = true; const a = b.facing;         game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, life: 3, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.6), color: def.color || '#a06ad6', homing: true }); game.sound.bossPhase(); }
        break;
      case 'burst': {
        if (!b._fired) { b._fired = true; const n = b.phase >= 3 ? 12 : 8;         for (let i = 0; i < n; i++) { const a = (i / n) * TAU; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 2.6, r: 6, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: def.color || '#a06ad6' }); } game.sound.bossPhase(); }
        break;
      }
      case 'wave':
        if (!b._fired) { b._fired = true; const a = b.facing; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 3.5, r: 18, fromPlayer: false, dmg: Math.round(b.dmg * 0.7), color: '#5aa0d6', wave: true }); game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 10); }
        break;
      case 'surge':
        if (!b._fired) { b._fired = true; for (let i = -1; i <= 1; i++) { const a = b.facing + i * 0.4; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 3, r: 16, fromPlayer: false, dmg: Math.round(b.dmg * 0.6), color: '#5aa0d6', wave: true }); } game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 10); }
        break;
      case 'geyser':
        if (!b._fired) { b._fired = true; for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, r = 60 + Math.random() * 120; spawnPool(game, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 52, 4, 20, 'rgba(80,140,200,0.45)'); } game.sound.bossPhase(); }
        break;
      case 'pool':
        if (!b._fired) { b._fired = true; const p = game.player; spawnPool(game, p.x, p.y, def.poolR, def.poolLife, def.poolDps, def.poolColor); game.sound.bossPhase(); }
        break;
      case 'dash': {
        const t = b._leapTarget || { x: game.player.x, y: game.player.y };
        const a = Math.atan2(t.y - b.y, t.x - b.x);
        b.x += Math.cos(a) * 300 * dt; b.y += Math.sin(a) * 300 * dt;
        if (!b._hit && dist2(b.x, b.y, game.player.x, game.player.y) < (b.r + game.player.r + 6) ** 2) { b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y); }
        break;
      }
      case 'lunge':
        if (!b._fired) { b._fired = true; b._lungeDir = b.facing; }
        b.x += Math.cos(b._lungeDir) * 430 * dt; b.y += Math.sin(b._lungeDir) * 430 * dt;
        if (!b._hit && dist2(b.x, b.y, game.player.x, game.player.y) < (b.r + game.player.r + 14) ** 2) { b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y); }
        break;
      case 'charge':
        if (!b._fired) { b._fired = true; b._chargeDir = b.facing; game.camera.shake = Math.max(game.camera.shake, 6); game.sound.bossRoar(); }
        b.x += Math.cos(b._chargeDir) * 470 * dt; b.y += Math.sin(b._chargeDir) * 470 * dt;
        if (!b._hit && dist2(b.x, b.y, game.player.x, game.player.y) < (b.r + game.player.r + 6) ** 2) { b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y); game._burst(game.player.x, game.player.y, '#c0482a', 16, 200); }
        break;
      case 'grab':
        if (!b._fired) { b._fired = true; b._grabDir = b.facing; }
        b.x += Math.cos(b._grabDir) * 300 * dt; b.y += Math.sin(b._grabDir) * 300 * dt;
        if (!b._hit && dist2(b.x, b.y, game.player.x, game.player.y) < (b.r + game.player.r + 12) ** 2) {
          b._hit = true; game._hurtPlayer(Math.round(b.dmg * 1.6), b.x, b.y);
          const p = game.player, a = Math.atan2(b.y - p.y, b.x - p.x);
          p.vx = Math.cos(a) * 240; p.vy = Math.sin(a) * 240;
          game.camera.shake = Math.max(game.camera.shake, 14); game.sound.bossRoar();
        }
        break;
      case 'roar':
        if (!b._fired) { b._fired = true; game.camera.shake = Math.max(game.camera.shake, 12); game.sound.bossRoar(); const p = game.player, dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < 240) { game._hurtPlayer(Math.round(b.dmg * 0.6), b.x, b.y); const a = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(a) * 280; p.vy += Math.sin(a) * 280; } game._burst(b.x, b.y, '#c0482a', 30, 240); }
        break;
      case 'teleportStrike':
        if (!b._fired) {
          b._fired = true; const p = game.player, back = p.facing + Math.PI;
          const tx = p.x + Math.cos(back) * 60, ty = p.y + Math.sin(back) * 60;
          game._burst(b.x, b.y, '#a06ad6', 18, 180);
          b.x = clamp(tx, b.arena.minX, b.arena.maxX); b.y = clamp(ty, b.arena.minY, b.arena.maxY);
          b.vx = 0; b.vy = 0; b.facing = Math.atan2(p.y - b.y, p.x - b.x);
          game._burst(b.x, b.y, '#a06ad6', 18, 180); game.sound.transform();
        }
        meleeHit(game, b, def.reach, def.arc);
        break;
      case 'teleport':
        if (!b._fired) { b._fired = true; teleport(game, b); }
        break;
      case 'summon':
        if (!b._fired) { b._fired = true; const n = def.count || 2; for (let i = 0; i < n; i++) summon(game, b, def.summonType || 'crawler'); game.sound.bossPhase(); }
        break;
      case 'nova':
        if (!b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.6), def.novaR || 500, def.novaSpeed || 360, def.color || '#d4c060'); game.camera.shake = Math.max(game.camera.shake, 14); game.sound.bossRoar(); }
        break;
      case 'hymn':
        if (!b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 540, 300, '#5a8ad6'); spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 380, 360, '#7ab0e0'); game.camera.shake = Math.max(game.camera.shake, 10); game.sound.bossPhase(); }
        break;
      case 'flood': {
        if (!b._fired) {
          b._fired = true; const p = game.player;
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * TAU, r = 80 + Math.random() * 220;
            const px = clamp(b.x + Math.cos(a) * r, b.arena.minX + 40, b.arena.maxX - 40);
            const py = clamp(b.y + Math.sin(a) * r, b.arena.minY + 40, b.arena.maxY - 40);
            if (Math.hypot(px - p.x, py - p.y) > 120) spawnPool(game, px, py, 78, 7, 16, 'rgba(60,120,200,0.45)');
          }
          game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 14);
        }
        break;
      }
      case 'silenceNova':
        if (!b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.9), 900, 340, '#a06ad6', true); game.camera.shake = Math.max(game.camera.shake, 18); game.sound.bossRoar(); }
        break;
      case 'abyssalNova':
        // The climax: twin expanding rings of void, the outermost dealing the
        // killing blow. A long windup telegraphs it — the Hunter must flee.
        if (!b._fired) {
          b._fired = true;
          spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.75), 1100, 360, '#c060ff', true);
          spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.55), 720, 440, '#a06ad6', true);
          game.camera.shake = Math.max(game.camera.shake, 22); game.sound.bossRoar();
          game.slowmo = Math.max(game.slowmo || 0, 0.45);
        }
        break;
      case 'voidBarrage':
        if (!b._fired) {
          b._fired = true; const nv = 14;
          for (let i = 0; i < nv; i++) { const a = (i / nv) * TAU + game.runtime; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, life: 3.2, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: '#c060ff', homing: true }); }
          game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 14);
        }
        break;
      case 'deluge':
        if (!b._fired) {
          b._fired = true; const pp = game.player;
          for (let i = 0; i < 10; i++) {
            const a = Math.random() * TAU, rr = 60 + Math.random() * 260;
            const px = clamp(b.x + Math.cos(a) * rr, b.arena.minX + 40, b.arena.maxX - 40);
            const py = clamp(b.y + Math.sin(a) * rr, b.arena.minY + 40, b.arena.maxY - 40);
            if (Math.hypot(px - pp.x, py - pp.y) > 100) spawnPool(game, px, py, 90, 9, 22, 'rgba(80,40,140,0.5)');
          }
          game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 16);
        }
        break;
      case 'bookFan':
        if (!b._fired) { b._fired = true; const n = b.phase >= 3 ? 7 : 5; for (let i = 0; i < n; i++) { const a = b.facing + (i - (n - 1) / 2) * 0.22; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, life: 3, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: '#d4b060', book: true }); } game.sound.bossPhase(); }
        break;
      case 'pageStorm':
        if (!b._fired) { b._fired = true; const n = def.big ? 16 : 12; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: 2.6, r: 5, fromPlayer: false, dmg: Math.round(b.dmg * 0.45), color: '#e8d090', book: true }); } game.sound.bossPhase(); }
        break;
      case 'dive': {
        const t = b._leapTarget || { x: game.player.x, y: game.player.y };
        const a = Math.atan2(t.y - b.y, t.x - b.x);
        b.x += Math.cos(a) * 380 * dt; b.y += Math.sin(a) * 380 * dt;
        if (!b._hit && dist2(b.x, b.y, game.player.x, game.player.y) < (b.r + game.player.r + 6) ** 2) { b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y); }
        if (b.stateT >= def.active - 0.02 && !b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 210, 360, '#8a9aa8'); game.camera.shake = Math.max(game.camera.shake, 12); game.sound.slam(); }
        break;
      }
      case 'gust':
        if (!b._fired) {
          b._fired = true; const ng = 7;
          for (let i = 0; i < ng; i++) { const a = b.facing + (i - (ng - 1) / 2) * 0.26; game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 2.4, r: 8, fromPlayer: false, dmg: Math.round(b.dmg * 0.4), color: '#a8c0d0', wave: true }); }
          const pp = game.player, pa = Math.atan2(pp.y - b.y, pp.x - b.x); pp.vx += Math.cos(pa) * 240; pp.vy += Math.sin(pa) * 240;
          game.sound.bossRoar();
        }
        break;
      case 'gaze':
        if (!b._fired) {
          b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.4), 520, 300, '#c9a86a');
          const pp = game.player, dd = Math.hypot(pp.x - b.x, pp.y - b.y);
          if (dd < 520 && pp.invuln <= 0 && !(pp.dodge && pp.dodge.t < pp.dodge.iframes)) game._addStagger(2.5);
          game.camera.shake = Math.max(game.camera.shake, 8); game.sound.bossPhase();
        }
        break;
      // ---- The Mire Mother: ancient magic ----
      case 'mireBolt':
        if (!b._fired) { b._fired = true; const n = b.phase >= 2 ? 5 : 3; const ox = b.x + Math.cos(b.facing) * 22, oy = b.y + Math.sin(b.facing) * 22; for (let i = 0; i < n; i++) { const a = b.facing + (i - (n - 1) / 2) * 0.18; game.projectiles.push({ x: ox, y: oy, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 2.6, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: '#5acfa0' }); } game._burst(ox, oy, '#5acfa0', 8, 140); game.sound.bossPhase(); }
        break;
      case 'vines':
        if (!b._fired) { b._fired = true; const t = b._vineTarget || { x: game.player.x, y: game.player.y }; spawnPool(game, t.x, t.y, 56, 5, 22, 'rgba(90,170,80,0.55)'); game._burst(t.x, t.y, '#7aa86a', 22, 200); game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 8); }
        break;
      case 'runeCircle':
        if (!b._fired) { b._fired = true; const ts = b._runeTargets || [{ x: game.player.x, y: game.player.y }]; for (const t of ts) { spawnShockwave(game, t.x, t.y, Math.round(b.dmg * 0.6), 210, 420, '#5acfa0'); game._burst(t.x, t.y, '#5acfa0', 14, 160); } game.sound.bossPhase(); game.camera.shake = Math.max(game.camera.shake, 10); }
        break;
      case 'arcaneSpears': {
        if (!b._fired) { b._fired = true; const n = 5; const base = Math.atan2(game.player.y - b.y, game.player.x - b.x); const px = Math.cos(base + Math.PI / 2), py = Math.sin(base + Math.PI / 2); for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 46; const sx = b.x + px * off, sy = b.y + py * off; const a = Math.atan2(game.player.y - sy, game.player.x - sx); game.projectiles.push({ x: sx, y: sy, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, life: 2.6, r: 8, fromPlayer: false, dmg: Math.round(b.dmg * 0.55), color: '#7adfff', spear: true }); game._burst(sx, sy, '#7adfff', 8, 120); } game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 8); }
        break;
      }
      case 'rainBolts':
        b._subT = (b._subT || 0) + dt;
        if (b._subT >= 0.16) { b._subT = 0; const px = game.player.x + (Math.random() - 0.5) * 200, py = game.player.y + (Math.random() - 0.5) * 200; game.projectiles.push({ x: px, y: py - 300, vx: 0, vy: 560, life: 2.4, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.4), color: '#5acfa0' }); game._burst(px, py - 300, '#5acfa0', 4, 80); }
        break;
      // ---- The Wailing Mother: fear, screams, haunting ----
      case 'screamShock':
        if (!b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.6), 460, 400, '#a8d08a'); const pp = game.player, dd = Math.hypot(pp.x - b.x, pp.y - b.y); if (dd < 460) { const a = Math.atan2(pp.y - b.y, pp.x - b.x); pp.vx += Math.cos(a) * 200; pp.vy += Math.sin(a) * 200; } game.camera.shake = Math.max(game.camera.shake, 12); game.sound.bossRoar(); game._burst(b.x, b.y, '#a8d08a', 28, 240); }
        break;
      case 'ghostHands':
        if (!b._fired) { b._fired = true; const t = b._handTarget || { x: game.player.x, y: game.player.y }; spawnPool(game, t.x, t.y, 64, 4, 20, 'rgba(150,170,120,0.5)'); const pp = game.player; if (Math.hypot(pp.x - t.x, pp.y - t.y) < 64 + pp.r) { game._addStagger(2.2); game._hurtPlayer(Math.round(b.dmg * 0.5), t.x, t.y); } game._burst(t.x, t.y, '#a8c08a', 20, 160); game.sound.bossRoar(); }
        break;
      case 'illusions':
        if (!b._fired) { b._fired = true; const n = 3; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.random(); const ix = clamp(game.player.x + Math.cos(a) * 160, b.arena.minX, b.arena.maxX); const iy = clamp(game.player.y + Math.sin(a) * 160, b.arena.minY, b.arena.maxY); const aa = Math.atan2(game.player.y - iy, game.player.x - ix); game.projectiles.push({ x: ix, y: iy, vx: Math.cos(aa) * 380, vy: Math.sin(aa) * 380, life: 2.4, r: 6, fromPlayer: false, dmg: Math.round(b.dmg * 0.45), color: '#b0d090' }); game._burst(ix, iy, '#b0d090', 16, 160); } game.sound.bossPhase(); game.camera.shake = Math.max(game.camera.shake, 10); }
        break;
      case 'massiveScream':
        if (!b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.8), 820, 360, '#8ab06a', true); spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 560, 440, '#a8d08a'); game.camera.shake = Math.max(game.camera.shake, 20); game.sound.bossRoar(); game.slowmo = Math.max(game.slowmo || 0, 0.35); game._burst(b.x, b.y, '#a8d08a', 50, 300); }
        break;
    }
    if (b.stateT >= def.active) { b.attackPhase = 'recover'; b.stateT = 0; }
  } else if (b.attackPhase === 'recover') {
    if (b.stateT >= def.recover) { b.state = 'chase'; b.attackPhase = null; b.stateT = 0; b._leapTarget = null; b._fired = false; }
  }
}

// ===================== Per-boss AI =====================

// ---- The Drowned Vicar ----
function updateVicar(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 80; b.dmg = 26; phaseBurst(game, b, '#3aa0c0', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const atkRange = b.phase === 1 ? 74 : 92;
    if (b.stateT > 0.6) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < atkRange) startAttack(game, b, r < 0.5 ? 'tridentSweep' : 'tridentThrust');
        else if (r < 0.3) startAttack(game, b, 'holySplash');
        else stepToward(game, b, dt);
      } else {
        if (d < atkRange && r < 0.4) startAttack(game, b, 'tridentSweep');
        else if (d < atkRange) startAttack(game, b, 'tridentThrust');
        else if (r < 0.25) startAttack(game, b, 'tidalWave');
        else if (r < 0.4) startAttack(game, b, 'geyser');
        else if (r < 0.5) startAttack(game, b, 'holySplash');
        else stepToward(game, b, dt);
      }
    } else stepToward(game, b, dt);
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- Father Gascoigne ----
function updateGascoigne(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 116; b.dmg = 30; b.r = 30; phaseBurst(game, b, '#c0482a', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const atkRange = b.phase === 1 ? 66 : 86;
    if (b.stateT > 0.45) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < atkRange) startAttack(game, b, r < 0.7 ? 'cleaverCombo' : 'overheadSlam');
        else if (d < 440 && r < 0.18) startAttack(game, b, 'pistolShot');
        else stepToward(game, b, dt);
      } else {
        if (d < atkRange && r < 0.4) startAttack(game, b, 'maulFlurry');
        else if (d < atkRange) startAttack(game, b, 'cleaverCombo');
        else if (d > 180 && r < 0.45) startAttack(game, b, 'charge');
        else if (r < 0.15) startAttack(game, b, 'howl');
        else if (r < 0.3) startAttack(game, b, 'leapPounce');
        else stepToward(game, b, dt);
      }
    } else stepToward(game, b, dt);
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Nightmare ----
function updateNightmare(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 84; b.dmg = 32; phaseBurst(game, b, '#a06ad6', b.phase2Msg); }
  else if (b.phase === 2 && b.hp < b.maxHp * b.phase3at) { b.phase = 3; b.speed = 100; b.dmg = 38; phaseBurst(game, b, '#d06af0', b.phase3Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 300;
    if (d < ideal - 40) stepAway(game, b, dt);
    else if (d > ideal + 100) stepTowardSlow(game, b, dt);
    if (b.stateT > 0.7) {
      const r = Math.random();
      if (d < 130) startAttack(game, b, 'tentacleLash');
      else if (b.phase >= 3 && r < 0.2) startAttack(game, b, 'realityTear');
      else if (b.phase >= 2 && r < 0.22) startAttack(game, b, 'realityBurst');
      else if (r < 0.25) startAttack(game, b, 'cosmicOrb');
      else startAttack(game, b, 'teleportStrike');
    }
    b._telepCool = (b._telepCool ?? 4) - dt;
    if (b._telepCool <= 0 && b.phase >= 2) { b._telepCool = 5 + Math.random() * 4; teleport(game, b); }
    if (b.phase >= 2) { b._sumCool = (b._sumCool ?? 9) - dt; if (b._sumCool <= 0 && game.enemies.filter(e => e.alive).length < 4) { b._sumCool = 16; summon(game, b, 'crawler'); } }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Mire Mother (ancient magic caster — keeps her distance, weaves spells) ----
function updateMireMother(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 88; b.dmg = 39; phaseBurst(game, b, '#2a8a9a', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 260;
    if (d < ideal - 50) stepAway(game, b, dt);
    else if (d > ideal + 120) stepTowardSlow(game, b, dt);
    if (b.stateT > 0.6) {
      const r = Math.random();
      if (b.phase === 1) {
        if (r < 0.34) { b._vineTarget = { x: p.x, y: p.y }; startAttack(game, b, 'mireVines'); }
        else if (r < 0.62) startAttack(game, b, 'mireBolt');
        else if (r < 0.82) { b._runeTargets = [{ x: p.x, y: p.y }, { x: clamp(p.x + (Math.random() - 0.5) * 240, b.arena.minX + 30, b.arena.maxX - 30), y: clamp(p.y + (Math.random() - 0.5) * 240, b.arena.minY + 30, b.arena.maxY - 30) }]; startAttack(game, b, 'mireRune'); }
        else startAttack(game, b, 'mireTeleport');
      } else {
        if (r < 0.22) { b._vineTarget = { x: p.x, y: p.y }; startAttack(game, b, 'mireVines'); }
        else if (r < 0.42) startAttack(game, b, 'mireBolt');
        else if (r < 0.6) startAttack(game, b, 'mireSpears');
        else if (r < 0.76) { b._runeTargets = [{ x: p.x, y: p.y }, { x: clamp(p.x + (Math.random() - 0.5) * 240, b.arena.minX + 30, b.arena.maxX - 30), y: clamp(p.y + (Math.random() - 0.5) * 240, b.arena.minY + 30, b.arena.maxY - 30) }, { x: clamp(p.x + (Math.random() - 0.5) * 240, b.arena.minX + 30, b.arena.maxX - 30), y: clamp(p.y + (Math.random() - 0.5) * 240, b.arena.minY + 30, b.arena.maxY - 30) }]; startAttack(game, b, 'mireRune'); }
        else if (r < 0.88) startAttack(game, b, 'mireNova');
        else startAttack(game, b, 'mireRain');
      }
    }
    // Short teleports reposition her before each big cast.
    b._telepCool = (b._telepCool ?? 5) - dt;
    if (b._telepCool <= 0) { b._telepCool = 4 + Math.random() * 3; teleport(game, b); }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Hollow King (greatsword melee) ----
function updateHollowKing(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 92; b.dmg = 41; phaseBurst(game, b, '#d4c060', b.phase2Msg); }
  else if (b.phase === 2 && b.hp < b.maxHp * b.phase3at) { b.phase = 3; b.speed = 112; b.dmg = 48; phaseBurst(game, b, '#f0d040', b.phase3Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const atkRange = b.phase === 1 ? 80 : 96;
    if (b.stateT > 0.5) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < atkRange && r < 0.4) startAttack(game, b, 'swordCombo');
        else if (d < atkRange && r < 0.65) startAttack(game, b, 'shockwaveSlam');
        else if (d > 120 && r < 0.5) startAttack(game, b, 'quickLunge');
        else if (r < 0.2) startAttack(game, b, 'kingGrab');
        else stepToward(game, b, dt);
      } else if (b.phase === 2) {
        if (d < atkRange && r < 0.3) startAttack(game, b, 'swordCombo');
        else if (d < atkRange && r < 0.5) startAttack(game, b, 'greatswordSpin');
        else if (d < atkRange) startAttack(game, b, 'shockwaveSlam');
        else if (d > 180 && r < 0.35) startAttack(game, b, 'quickLunge');
        else if (r < 0.18) startAttack(game, b, 'summonKnights');
        else if (r < 0.3) startAttack(game, b, 'energyShockwave');
        else stepToward(game, b, dt);
      } else {
        if (d < atkRange && r < 0.3) startAttack(game, b, 'greatswordSpin');
        else if (d < atkRange && r < 0.55) startAttack(game, b, 'swordCombo');
        else if (d < atkRange) startAttack(game, b, 'shockwaveSlam');
        else if (d > 180 && r < 0.35) startAttack(game, b, 'quickLunge');
        else if (r < 0.2) startAttack(game, b, 'hollowStorm');
        else if (r < 0.3) startAttack(game, b, 'summonKnights');
        else stepToward(game, b, dt);
      }
    } else stepToward(game, b, dt);
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Archivist ----
function updateArchivist(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 84; b.dmg = 34; phaseBurst(game, b, '#c0a060', b.phase2Msg); }
  else if (b.phase === 2 && b.hp < b.maxHp * b.phase3at) { b.phase = 3; b.speed = 100; b.dmg = 40; phaseBurst(game, b, '#e0c060', b.phase3Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 280;
    if (d < ideal - 40) stepAway(game, b, dt);
    else if (d > ideal + 120) stepTowardSlow(game, b, dt);
    if (b.stateT > 0.7) {
      const r = Math.random();
      if (d < 120) startAttack(game, b, r < 0.5 ? 'tomeWhack' : 'shelfCollapse');
      else if (b.phase >= 3 && r < 0.2) startAttack(game, b, 'forbiddenStorm');
      else if (b.phase >= 2 && r < 0.22) startAttack(game, b, 'pageStorm');
      else if (b.phase >= 3 && r < 0.32) startAttack(game, b, 'summonScholars');
      else if (r < 0.4) startAttack(game, b, 'inkPool');
      else startAttack(game, b, 'bookBarrage');
    }
    b._telepCool = (b._telepCool ?? 7) - dt;
    if (b._telepCool <= 0 && b.phase >= 2) { b._telepCool = 5 + Math.random() * 4; teleport(game, b); }
    b._sumCool = (b._sumCool ?? 12) - dt;
    if (b._sumCool <= 0 && game.enemies.filter(e => e.alive).length < 4) { b._sumCool = 18; summon(game, b, 'scholar'); }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- dispatcher (final boss handled separately by Endgame) ----
export function update(game, dt) {
  const b = game.boss;
  if (!b || !b.alive) return;
  switch (b.type) {
    case 'vicar': return updateVicar(game, dt);
    case 'gascoigne': return updateGascoigne(game, dt);
    case 'nightmare': return updateNightmare(game, dt);
    case 'mire': return updateMireMother(game, dt);
    case 'hollow_king': return updateHollowKing(game, dt);
    case 'archivist': return updateArchivist(game, dt);
    case 'pale_wraith': return updatePaleWraith(game, dt);
    case 'winter_hierophant': return updateWinterHierophant(game, dt);
    case 'hollow_castellan': return Mounted.updateCastellan(game, dt);
    case 'wailing_mother': return updateWailingMother(game, dt);
    case 'cliff_watcher': return updateCliffWatcher(game, dt);
    case 'under_guardian': return Underworld.updateGuardian(game, dt);
    case 'celestial': return Celestial.updateCelestial(game, dt);
  }
}

// ---- The Pale Wraith (secret boss: a teleporting ghostly shade) ----
function updatePaleWraith(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 118; b.dmg = 32; phaseBurst(game, b, '#a0c8e8', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    if (b.stateT > 0.55) {
      const r = Math.random();
      if (d < 120 && r < 0.4) startAttack(game, b, 'tentacleLash');
      else if (r < 0.28) startAttack(game, b, 'teleportStrike');
      else if (r < 0.5) startAttack(game, b, 'cosmicOrb');
      else if (b.phase >= 2 && r < 0.62) startAttack(game, b, 'realityBurst');
      else stepToward(game, b, dt);
    } else stepToward(game, b, dt);
    b._telepCool = (b._telepCool ?? 5) - dt;
    if (b._telepCool <= 0) { b._telepCool = 4 + Math.random() * 3; teleport(game, b); }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Winter Hierophant (secret boss: a frost caster that keeps its distance) ----
function updateWinterHierophant(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 96; b.dmg = 32; phaseBurst(game, b, '#9ad8f0', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 280;
    if (d < ideal - 40) stepAway(game, b, dt);
    else if (d > ideal + 100) stepTowardSlow(game, b, dt);
    if (b.stateT > 0.6) {
      const r = Math.random();
      if (d < 120 && r < 0.35) startAttack(game, b, 'tentacleLash');
      else if (b.phase >= 2 && r < 0.2) startAttack(game, b, 'frostNova');
      else if (r < 0.28) startAttack(game, b, 'frostBurst');
      else if (r < 0.5) startAttack(game, b, 'iceShard');
      else if (r < 0.65) startAttack(game, b, 'icePool');
      else startAttack(game, b, 'teleportStrike');
    }
    b._telepCool = (b._telepCool ?? 6) - dt;
    if (b._telepCool <= 0) { b._telepCool = 5 + Math.random() * 3; teleport(game, b); }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Hollow Castellan (mounted cavalry boss) — AI lives in MountedBoss.js ----

// ---- The Wailing Mother (fear, screams, and haunting) ----
function updateWailingMother(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 104; b.dmg = 36; phaseBurst(game, b, '#7aa86a', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const atkRange = b.phase === 1 ? 122 : 126;
    if (b.stateT > (b.phase === 2 ? 0.42 : 0.5)) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < atkRange && r < 0.45) startAttack(game, b, 'clawCombo');
        else if (r < 0.62) startAttack(game, b, 'screamShock');
        else if (r < 0.8) { b._handTarget = { x: p.x, y: p.y }; startAttack(game, b, 'ghostHands'); }
        else if (r < 0.92) startAttack(game, b, 'cursedMist');
        else stepToward(game, b, dt);
      } else {
        if (d < atkRange && r < 0.38) startAttack(game, b, 'fastClaw');
        else if (r < 0.5) startAttack(game, b, 'wailIllusion');
        else if (r < 0.62) startAttack(game, b, 'screamShock');
        else if (r < 0.74) { b._handTarget = { x: p.x, y: p.y }; startAttack(game, b, 'ghostHands'); }
        else if (r < 0.86) startAttack(game, b, 'cursedMist');
        else startAttack(game, b, 'massiveScream');
      }
    } else stepToward(game, b, dt);
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}

// ---- The Cliff Watcher (secret boss: a hovering stone gargoyle) ----
function updateCliffWatcher(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 100; b.dmg = 34; phaseBurst(game, b, '#8a9aa8', b.phase2Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 240;
    if (d < ideal - 50) stepAway(game, b, dt);
    else if (d > ideal + 120) stepTowardSlow(game, b, dt);
    else { b.x += Math.cos(b.facing + Math.PI / 2) * b.speed * 0.5 * dt; b.y += Math.sin(b.facing + Math.PI / 2) * b.speed * 0.5 * dt; } // strafe/hover
    if (b.stateT > 0.7) {
      const r = Math.random();
      if (b.phase >= 2 && r < 0.18) startAttack(game, b, 'cliffGaze');
      else if (d > 200 && r < 0.42) startAttack(game, b, 'cliffDive');
      else if (r < 0.35) startAttack(game, b, 'cliffGust');
      else if (d < 120 && r < 0.62) startAttack(game, b, 'cliffTalon');
      else startAttack(game, b, 'cliffPerch');
    }
  } else if (b.state === 'attack') resolveAttack(game, b, dt);
  endFrame(game, b, dt);
}