// CelestialEnding.js — the secret true ending. If the player broke the seal
// beneath the kingdom (defeated The Last Warden in the Forgotten Underworld),
// the final encounter at the Drowned Sanctum is forever changed: just before
// Elias can transform, the Celestial God — "The One Beneath / The Sleeping
// Sky" — descends, strikes Elias down, and becomes the true final boss. The
// hardest encounter in the game. Defeating it unlocks the True Ending.
//
// Lore: the underground complex predates the Night of the Hunt; it was built to
// imprison an ancient celestial presence. The Last Warden was its final seal.
// Elias knew something ancient was buried beneath the kingdom but never where.
// Slaying the guardian unknowingly breaks the last barrier.

import * as BossSystem from './BossSystem.js';
import * as Save from './SaveSystem.js';
import { SOUL_MAP } from './Souls.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const CELESTIAL = {
  type: 'celestial', name: 'The Celestial God',
  x: 4550, y: 6100, r: 34, hp: 7200, speed: 78, dmg: 48, ess: 3000,
  arena: { minX: 4220, maxX: 4880, minY: 5920, maxY: 6270 },
  phase2Msg: 'Phase II — The Sky Opens', phase3Msg: 'Phase III — The One Beneath',
};

// ---- Unique attack table (custom lifecycle; does not touch BossSystem.A) ----
const ATK = {
  astralSweep:   { windup: 0.5,  active: 0.25, recover: 0.5, reach: 140, arc: 1.4, parry: true },
  starRain:      { windup: 0.8,  active: 0.7,  recover: 0.7 },
  cosmicStep:    { windup: 0.45, active: 0.2,  recover: 0.5, reach: 130, arc: 1.6 },
  celestialNova: { windup: 1.3,  active: 0.4,  recover: 1.0 },
  gravityWell:   { windup: 0.9,  active: 0.5,  recover: 0.7 },
  meteorStorm:   { windup: 1.1,  active: 0.6,  recover: 0.9 },
  astralBeams:   { windup: 0.8,  active: 0.9,  recover: 0.7 },
  eclipse:       { windup: 1.6,  active: 0.6,  recover: 1.2 },
};

// ---- Spawn the Celestial God (called after the reveal cinematic completes) ----
export function spawnCelestial(game) {
  const d = CELESTIAL;
  const hp = Math.round(d.hp * (game._hpScale || 1));
  game.boss = {
    type: d.type, name: d.name, x: d.x, y: d.y, r: d.r, hp, maxHp: hp, alive: true,
    speed: d.speed, dmg: Math.round(d.dmg * 1.2), facing: Math.PI, state: 'chase', stateT: 0,
    phase: 1, attackPhase: null, staggered: 0, hitFlash: 0, parryable: false,
    fireCool: 2, comboT: 0, vx: 0, vy: 0, ess: d.ess,
    arena: d.arena, phase2at: 0.66, phase3at: 0.33,
    phase2Msg: d.phase2Msg, phase3Msg: d.phase3Msg, secret: true,
  };
  game.state = 'bossActive';
  game.hooks.onBossIntro && game.hooks.onBossIntro(d.name);
  game.hooks.onState && game.hooks.onState('bossActive');
  game.sound.bossRoar && game.sound.bossRoar();
  game.camera.shake = Math.max(game.camera.shake, 18);
  game._burst(d.x, d.y, '#c0a8ff', 60, 320);
  game.hooks.onBossHp && game.hooks.onBossHp(hp, hp);
}

// ---- Celestial combat AI: 3 escalating phases, an all-original moveset ----
export function updateCelestial(game, dt) {
  const b = game.boss, p = game.player;
  if (!b || !b.alive) return;
  if (b.phase === 1 && b.hp < b.maxHp * 0.66) { b.phase = 2; b.speed = 84; b.dmg = Math.round(b.dmg * 1.12); BossSystem.phaseBurst(game, b, '#c0a8ff', b.phase2Msg); }
  else if (b.phase === 2 && b.hp < b.maxHp * 0.33) { b.phase = 3; b.speed = 96; b.dmg = Math.round(b.dmg * 1.15); b.r = 40; BossSystem.phaseBurst(game, b, '#e8c0ff', b.phase3Msg); }
  if (!BossSystem.beginFrame(game, b, dt)) return;
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const ideal = 240;
    if (d < ideal - 60) BossSystem.stepAway(game, b, dt);
    else if (d > ideal + 140) BossSystem.stepTowardSlow(game, b, dt);
    else { b.x += Math.cos(b.facing + Math.PI / 2) * b.speed * 0.5 * dt; b.y += Math.sin(b.facing + Math.PI / 2) * b.speed * 0.5 * dt; }
    if (b.stateT > (b.phase === 3 ? 0.4 : 0.6)) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < 150 && r < 0.3) startAtk(b, 'astralSweep');
        else if (r < 0.45) startAtk(b, 'starRain');
        else startAtk(b, 'cosmicStep');
      } else if (b.phase === 2) {
        if (d < 150 && r < 0.22) startAtk(b, 'astralSweep');
        else if (r < 0.2) startAtk(b, 'celestialNova');
        else if (r < 0.4) startAtk(b, 'starRain');
        else if (r < 0.55) startAtk(b, 'gravityWell');
        else if (r < 0.72) startAtk(b, 'cosmicStep');
        else startAtk(b, 'meteorStorm');
      } else {
        if (d < 160 && r < 0.16) startAtk(b, 'astralSweep');
        else if (r < 0.16) startAtk(b, 'eclipse');
        else if (r < 0.34) startAtk(b, 'astralBeams');
        else if (r < 0.52) startAtk(b, 'celestialNova');
        else if (r < 0.7) startAtk(b, 'starRain');
        else if (r < 0.85) startAtk(b, 'gravityWell');
        else startAtk(b, 'cosmicStep');
      }
    }
    if (b.phase >= 2) { b._telepCool = (b._telepCool ?? 5) - dt; if (b._telepCool <= 0) { b._telepCool = 5 + Math.random() * 3; BossSystem.teleport(game, b); } }
  } else if (b.state === 'attack') {
    resolveCelestialAtk(game, b, dt);
  }
  BossSystem.endFrame(game, b, dt);
}

function startAtk(b, type) { b.state = 'attack'; b.stateT = 0; b.attackPhase = 'windup'; b._hit = false; b._fired = false; b._attackType = type; b._subT = 0; }

function resolveCelestialAtk(game, b, dt) {
  const def = ATK[b._attackType];
  const p = game.player;
  b.parryable = b.attackPhase === 'windup' && !!def.parry;
  if (b.attackPhase === 'windup') {
    if (b.stateT >= def.windup) { b.attackPhase = 'active'; b.stateT = 0; b._hit = false; b._fired = false; b._subT = 0; }
  } else if (b.attackPhase === 'active') {
    switch (b._attackType) {
      case 'astralSweep': BossSystem.meleeHit(game, b, def.reach, def.arc); break;
      case 'cosmicStep':
        if (!b._fired) {
          b._fired = true;
          const back = p.facing + Math.PI;
          const tx = clamp(p.x + Math.cos(back) * 55, b.arena.minX, b.arena.maxX);
          const ty = clamp(p.y + Math.sin(back) * 55, b.arena.minY, b.arena.maxY);
          game._burst(b.x, b.y, '#c0a8ff', 18, 180);
          b.x = tx; b.y = ty; b.vx = 0; b.vy = 0; b.facing = Math.atan2(p.y - b.y, p.x - b.x);
          game._burst(b.x, b.y, '#c0a8ff', 18, 180); game.sound.transform();
        }
        BossSystem.meleeHit(game, b, def.reach, def.arc);
        break;
      case 'starRain':
        b._subT += dt;
        if (b._subT >= 0.14) {
          b._subT = 0;
          const tx = p.x + (Math.random() - 0.5) * 60, ty = p.y + (Math.random() - 0.5) * 60;
          game.projectiles.push({ x: tx, y: ty - 280, vx: 0, vy: 620, life: 2.6, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: '#c0a8ff' });
          game._burst(tx, ty - 280, '#c0a8ff', 4, 80);
        }
        break;
      case 'celestialNova':
        if (!b._fired) {
          b._fired = true;
          BossSystem.spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.7), 1000, 360, '#c0a8ff', true);
          BossSystem.spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 700, 440, '#e8c0ff', true);
          game.camera.shake = Math.max(game.camera.shake, 22); game.sound.bossRoar();
          game.slowmo = Math.max(game.slowmo || 0, 0.4);
        }
        break;
      case 'gravityWell':
        if (!b._fired) {
          b._fired = true;
          const a = Math.atan2(b.y - p.y, b.x - p.x);
          p.vx -= Math.cos(a) * 260; p.vy -= Math.sin(a) * 260;
          BossSystem.spawnPool(game, p.x, p.y, 90, 5, 20, 'rgba(120,80,200,0.5)');
          game._burst(b.x, b.y, '#c0a8ff', 24, 200); game.sound.bossRoar();
        }
        break;
      case 'meteorStorm':
        b._subT += dt;
        if (b._subT >= 0.18) {
          b._subT = 0;
          const a = Math.random() * TAU, rr = 60 + Math.random() * 220;
          const mx = clamp(b.x + Math.cos(a) * rr, b.arena.minX + 30, b.arena.maxX - 30);
          const my = clamp(b.y + Math.sin(a) * rr, b.arena.minY + 30, b.arena.maxY - 30);
          BossSystem.spawnShockwave(game, mx, my, Math.round(b.dmg * 0.5), 200, 360, '#c0a8ff');
          game._burst(mx, my, '#c0a8ff', 14, 160);
        }
        break;
      case 'astralBeams':
        b._subT += dt;
        if (b._subT >= 0.12) {
          b._subT = 0;
          const a = game.runtime * 3;
          for (let i = 0; i < 3; i++) {
            const aa = a + i * (TAU / 3);
            game.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(aa) * 360, vy: Math.sin(aa) * 360, life: 1.4, r: 6, fromPlayer: false, dmg: Math.round(b.dmg * 0.45), color: '#e8c0ff' });
          }
        }
        break;
      case 'eclipse':
        if (!b._fired) {
          b._fired = true;
          BossSystem.spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.9), 1200, 320, '#e8c0ff', true);
          BossSystem.spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.6), 800, 420, '#c0a8ff', true);
          game.camera.shake = Math.max(game.camera.shake, 26); game.sound.bossRoar();
          game.slowmo = Math.max(game.slowmo || 0, 0.6);
          game._burst(b.x, b.y, '#e8c0ff', 60, 320);
        }
        break;
    }
    if (b.stateT >= def.active) { b.attackPhase = 'recover'; b.stateT = 0; }
  } else if (b.attackPhase === 'recover') {
    if (b.stateT >= def.recover) { b.state = 'chase'; b.attackPhase = null; b.stateT = 0; }
  }
}

// ---- Celestial defeat -> the True Ending + the Astral Soul ----
export function onDefeated(game, b) {
  game._celestialDefeated = true;
  game.trueEnding = true;
  game.boss = null;
  game.defeatedBosses.add('celestial');
  game._runActive = false;
  game.speedrunFinalMs = Math.round(game.speedrunMs || 0);
  game.gameCompleted = true;
  try { localStorage.setItem('hunt_completed_v1', '1'); } catch (e) {}
  game.hooks.onRunComplete && game.hooks.onRunComplete({ deaths: game.runDeaths || 0, timeMs: game.speedrunFinalMs, ngPlus: !!game.ngPlus });
  game.hooks.onBossEnd && game.hooks.onBossEnd();
  game._burst(b.x, b.y, '#e8d8ff', 90, 380);
  game._burst(b.x, b.y, '#c0a8ff', 60, 320);
  game.sound.victory();
  // the Astral Soul — the ultimate optional reward
  const p = game.player;
  const soul = SOUL_MAP['astral'];
  if (soul && !(p.souls || (p.souls = new Set())).has('astral')) {
    p.souls.add('astral');
    game.soulReward = soul;
    game.hooks.onSoulReward && game.hooks.onSoulReward(soul);
    game.sound.soulReward && game.sound.soulReward();
  }
  p.weaponLvl = Math.min(10, (p.weaponLvl || 0) + 3);
  Save.saveGame(game);
  game.state = 'ending';
  game.ending = { t: 0, phase: 0, fired: false };
  game._showMsg('The Sleeping Sky falls silent at last. The One Beneath is free — and the Quarter remembers.', 4200);
  game.hooks.onState && game.hooks.onState('ending');
  game._pushHud();
}

// ---- The Celestial God: a towering figure of starlight, wings, halo & star-eye ----
export function drawCelestial(game, ctx, b) {
  const t = game.runtime;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.4, b.r * 0.42, 0, 0, TAU); ctx.fill();
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const p3 = b.phase >= 3, p2 = b.phase >= 2;
  if (Math.random() < 0.5) game.particles.push({ x: b.x + (Math.random() - 0.5) * b.r * 3, y: b.y + (Math.random() - 0.5) * b.r * 3, vx: (Math.random() - 0.5) * 10, vy: -10 - Math.random() * 30, life: 1, max: 1, r: 1.8, color: '#e8d8ff' });
  // outer aura
  ctx.globalCompositeOperation = 'lighter';
  const ar = b.r * (p3 ? 3.2 : p2 ? 2.8 : 2.4);
  const ag = ctx.createRadialGradient(0, 0, 4, 0, 0, ar);
  ag.addColorStop(0, flash ? 'rgba(255,255,255,0.5)' : 'rgba(200,170,255,0.22)'); ag.addColorStop(1, 'rgba(160,120,220,0)');
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, ar, 0, TAU); ctx.fill();
  // wings of light
  const wingN = p3 ? 6 : p2 ? 4 : 2;
  for (let i = 0; i < wingN; i++) {
    const wa = (i / wingN) * TAU + t * 0.4;
    const wf = Math.sin(t * 2 + i) * 0.3;
    ctx.save(); ctx.rotate(wa);
    ctx.fillStyle = `rgba(200,170,255,${0.18 + wf * 0.08})`;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(b.r * 1.6, -b.r * 0.8 - wf * b.r, b.r * 2.4, 0); ctx.quadraticCurveTo(b.r * 1.6, b.r * 0.8 + wf * b.r, 0, 0); ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.rotate(b.facing);
  // robe body
  const robe = flash ? '#fff' : stag ? '#9aa0ff' : p3 ? '#2a1a4a' : p2 ? '#2a2050' : '#241c44';
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 1.1, b.r * 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : 'rgba(180,150,230,0.4)';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.3, b.r * 1.2); ctx.lineTo(i * b.r * 0.3 + b.r * 0.12, b.r * 1.8); ctx.lineTo(i * b.r * 0.3 - b.r * 0.08, b.r * 1.55); ctx.fill(); }
  // hood + shadowed face
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p3 ? '#1a0a2a' : '#1a1030';
  ctx.beginPath(); ctx.arc(b.r * 0.15, -b.r * 0.4, b.r * 0.6, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(b.r * 0.15 - b.r * 0.5, -b.r * 0.35); ctx.lineTo(b.r * 0.15 - b.r * 0.35, b.r * 0.1); ctx.lineTo(b.r * 0.15 + b.r * 0.35, b.r * 0.1); ctx.lineTo(b.r * 0.15 + b.r * 0.5, -b.r * 0.35); ctx.fill();
  ctx.fillStyle = '#0a0414'; ctx.beginPath(); ctx.ellipse(b.r * 0.2, -b.r * 0.25, b.r * 0.34, b.r * 0.4, 0, 0, TAU); ctx.fill();
  // central burning star-eye
  const eg = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.globalCompositeOperation = 'lighter';
  const cg = ctx.createRadialGradient(b.r * 0.25, -b.r * 0.28, 1, b.r * 0.25, -b.r * 0.28, b.r * 0.6);
  cg.addColorStop(0, flash ? '#fff' : `rgba(220,180,255,${eg})`); cg.addColorStop(1, 'rgba(180,120,220,0)');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(b.r * 0.25, -b.r * 0.28, b.r * 0.6, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = flash ? '#fff' : `rgba(240,220,255,${eg})`; ctx.beginPath(); ctx.arc(b.r * 0.25, -b.r * 0.28, b.r * 0.16, 0, TAU); ctx.fill();
  if (p3) { ctx.fillStyle = flash ? '#fff' : `rgba(220,180,255,${eg})`; for (let i = 0; i < 5; i++) { const aa = (i / 5) * TAU + t * 0.6; ctx.beginPath(); ctx.arc(Math.cos(aa) * b.r * 0.7 + b.r * 0.15, Math.sin(aa) * b.r * 0.7 - b.r * 0.3, 2.4, 0, TAU); ctx.fill(); } }
  // halo of rotating stars
  const haloR = b.r * (p3 ? 1.6 : p2 ? 1.4 : 1.2);
  const haloN = p3 ? 11 : p2 ? 8 : 6;
  ctx.fillStyle = flash ? '#fff' : `rgba(230,210,255,${0.7 + Math.sin(t * 3) * 0.3})`;
  for (let i = 0; i < haloN; i++) { const ha = (i / haloN) * TAU + t * 0.5; ctx.beginPath(); ctx.arc(Math.cos(ha) * haloR, Math.sin(ha) * haloR - b.r * 0.6, 2.6, 0, TAU); ctx.fill(); }
  ctx.restore();
}