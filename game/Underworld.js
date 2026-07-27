// Underworld.js — The Forgotten Underworld: a hidden, optional subterranean
// complex beneath the Sunken Necropolis. Built long before the Night of the
// Hunt to imprison an ancient celestial presence ("The One Beneath" / "The
// Sleeping Sky"). Its last guardian is the final seal; slaying it unknowingly
// breaks the binding and unlocks the secret ending. Entirely optional — never
// required to finish the main story.
//
// NOTE: this complex is relocated to a pocket below the Hunter's Nightmare hub
// (x3000-3880, y5400-6300). It must NEVER share coordinates with the hub — an
// earlier build placed it on top of the hub, which bled its divider wall and the
// Last Warden's trigger into the safe zone. The hub stays open and peaceful.

import * as BossSystem from './BossSystem.js';
import * as Save from './SaveSystem.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

// Surface entrance (in the Sunken Necropolis) and the descent destination.
export const ENTRANCE = { x: 1320, y: 3320, dest: { x: 3220, y: 5660 } };
// Exit stair inside the underworld, leading back to the surface entrance.
export const EXIT = { x: 3220, y: 5430, dest: { x: 1320, y: 3340 } };
export const REGION = { x: 3000, y: 5400, w: 880, h: 900 };

const GUARDIAN = {
  type: 'under_guardian', secret: true,
  name: 'The Last Warden',
  x: 3680, y: 6100, r: 30, hp: 2600, speed: 70, dmg: 36, ess: 1400,
  arena: { minX: 3500, maxX: 3840, minY: 5940, maxY: 6260 },
  phase2at: 0.5,
  introMsg: 'The Last Warden stirs', phase2Msg: 'The Seal Fractures',
  burstColor: '#9a8ad6',
  trigger: { minX: 3520, maxX: 3820, minY: 5960, maxY: 6240 },
};

export function buildUnderworld() {
  const walls = [];
  const add = (x, y, w, h, gate) => walls.push({ x, y, w, h, gate });
  // outer shell (walled off — only reachable via the descent warp)
  add(3000, 5400, 880, 24);
  add(3000, 6276, 880, 24);
  add(3000, 5400, 24, 900);
  add(3856, 5400, 24, 900);
  // vertical divider (doorway y5660-5720 connects the two upper rooms)
  add(3440, 5400, 24, 260);
  add(3440, 5720, 24, 556);
  // horizontal divider (doorway x3600-3660 connects upper to the deep)
  add(3000, 5800, 600, 24);
  add(3660, 5800, 196, 24);
  // interior rubble & pillars
  add(3120, 5540, 40, 40);
  add(3700, 5540, 40, 40);
  add(3300, 6040, 40, 40);
  add(3080, 6140, 40, 40);
  // guardian arena arches (open framing)
  add(3500, 5940, 24, 120);
  add(3820, 5940, 24, 120);

  const lanterns = [
    { x: 3700, y: 5640, r: 220, flicker: 0.8, rest: true, name: 'The Lantern of Dust' },
    { x: 3220, y: 5640, r: 150, flicker: 0.6 },
    { x: 3300, y: 6140, r: 150, flicker: 0.6 },
  ];
  const spawns = [
    { type: 'excavator', x: 3300, y: 5640 },
    { type: 'seal_sentinel', x: 3600, y: 5640 },
    { type: 'void_leech', x: 3120, y: 5640 },
    { type: 'excavator', x: 3700, y: 6040 },
    { type: 'seal_sentinel', x: 3200, y: 6140 },
    { type: 'void_leech', x: 3500, y: 5990 },
    { type: 'excavator', x: 3750, y: 5940 },
  ];
  const notes = [
    { x: 3220, y: 5660, title: 'The First Hunt', text: '"Before the Chorus, before the water, there was the First Hunt. The sky that slept beneath the stone was old when the first king laid the first stone. They built these cellars to keep the Sleeping Sky dreaming. Do not wake the One Beneath. We beg you. We begged ourselves, and we listened, and we are still here only because we listened."' },
    { x: 3700, y: 5540, title: 'Sealed Warning', text: '"The deepest door is sealed with a guardian of stone and oath. The guardian is the last lock. Should it fall, the seal falls with it. If you have read this far, you have come too far. Turn back. The mercy of the kingdom was to forget what lay below, and we were merciful for a very long time."' },
    { x: 3300, y: 6040, title: 'Burial Rite', text: '"The One Beneath is not a god. It is the sky before there was a sky, buried because it could not be killed. The First Hunt failed to kill it. We could only bury it, and bury the burying, and pray the praying would outlast us. It has. We have not."' },
    { x: 3640, y: 6200, title: "The Warden's Confession", text: '"I am the last lock. If you break me, you break the world\'s forgetting. I do not blame you. The curious always come down, in the end. I only hope the sky is kinder than it was the first time. It will not be. It was never kind. That is why we buried it."' },
  ];
  const guides = [
    { x: 3460, y: 5700, dir: 0 },
    { x: 3620, y: 5820, dir: Math.PI / 2 },
  ];
  const chests = [
    { x: 3700, y: 5490, type: 'essence', ess: 1500 },
    { x: 3100, y: 5740, type: 'vials' },
    { x: 3750, y: 6220, type: 'weapon' },
  ];
  const region = { id: 'underworld', name: 'The Forgotten Underworld', x: REGION.x, y: REGION.y, w: REGION.w, h: REGION.h, color: '#2a2230', icon: 'crypt' };
  const fragment = { id: 'underworld', region: 'underworld', name: 'The Forgotten Underworld', desc: 'The cellars beneath the city, built before the Night of the Hunt to imprison the Sleeping Sky. The last seal is a guardian of stone and oath.', x: 3800, y: 5540, hint: 'In the dust of the forgotten cellars' };
  return { walls, lanterns, spawns, notes, guides, chests, regions: [region], fragments: [fragment] };
}

// ---- Entrance / exit interaction (called from the patched interact) ----
export function tryInteract(game) {
  const p = game.player;
  if (dist2(p.x, p.y, ENTRANCE.x, ENTRANCE.y) < 42 * 42) {
    game.startTransition(() => {
      const d = ENTRANCE.dest;
      p.x = d.x; p.y = d.y; p.invuln = 1.2; p.dodge = null;
      game.camera.x = p.x - game.viewW / 2; game.camera.y = p.y - game.viewH / 2;
      game.sound.teleport();
      game._showMsg('You descend into the forgotten cellars.', 2200);
    }, 'Descending...');
    return true;
  }
  if (dist2(p.x, p.y, EXIT.x, EXIT.y) < 42 * 42) {
    game.startTransition(() => {
      const d = EXIT.dest;
      p.x = d.x; p.y = d.y; p.invuln = 1.2; p.dodge = null;
      game.camera.x = p.x - game.viewW / 2; game.camera.y = p.y - game.viewH / 2;
      game.sound.teleport();
      game._showMsg('You climb back to the Necropolis.', 1800);
    }, 'Ascending...');
    return true;
  }
  return false;
}

// ---- Guardian boss spawn trigger (called from _checkAreaTriggers) ----
export function checkTrigger(game) {
  const p = game.player;
  if (!p) return;
  if (game.boss || game.defeatedBosses.has('under_guardian')) return;
  const z = GUARDIAN.trigger;
  if (p.x > z.minX && p.x < z.maxX && p.y > z.minY && p.y < z.maxY) spawnGuardian(game);
}

function spawnGuardian(game) {
  game.state = 'bossIntro';
  game.encounteredBosses.add('under_guardian');
  const d = GUARDIAN;
  const hp = Math.round(d.hp * (game._hpScale || 1) * 1.5);
  game.boss = {
    type: d.type, name: d.name, x: d.x, y: d.y, r: d.r, hp, maxHp: hp, alive: true,
    speed: d.speed, dmg: Math.round(d.dmg * 1.2), facing: Math.PI, state: 'intro', stateT: 0,
    phase: 1, attackPhase: null, staggered: 0, hitFlash: 0, parryable: false,
    fireCool: 2, comboT: 0, vx: 0, vy: 0, ess: d.ess,
    arena: d.arena, phase2at: d.phase2at, phase3at: 0,
    introMsg: d.introMsg, phase2Msg: d.phase2Msg, phase3Msg: '',
    introStyle: 'fog', introT: 0, introDur: 7.5, _introAlpha: 0,
    _roared: false, _landed: false, secret: true,
  };
  game.boss._x0 = d.x; game.boss._y0 = d.y; game.boss.y = d.y + 160;
  game.hooks.onBossIntro && game.hooks.onBossIntro(d.name);
  game.hooks.onState && game.hooks.onState('bossIntro');
}

// ---- Guardian combat AI: a colossal stone warden; faster & desperate at 50% ----
export function updateGuardian(game, dt) {
  const b = game.boss, p = game.player;
  if (!b || !b.alive) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) {
    b.phase = 2; b.speed = 96; b.dmg = Math.round(b.dmg * 1.15);
    BossSystem.phaseBurst(game, b, GUARDIAN.burstColor, b.phase2Msg);
  }
  if (!BossSystem.beginFrame(game, b, dt)) return;
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    const atkRange = b.phase === 1 ? 92 : 104;
    if (b.stateT > (b.phase === 1 ? 0.7 : 0.45)) {
      const r = Math.random();
      if (b.phase === 1) {
        if (d < atkRange && r < 0.35) BossSystem.startAttack(game, b, 'swordCombo');
        else if (d < atkRange) BossSystem.startAttack(game, b, 'shockwaveSlam');
        else if (d > 150 && r < 0.4) BossSystem.startAttack(game, b, 'quickLunge');
        else if (r < 0.18) BossSystem.startAttack(game, b, 'kingGrab');
        else BossSystem.stepToward(game, b, dt);
      } else {
        if (d < atkRange && r < 0.25) BossSystem.startAttack(game, b, 'greatswordSpin');
        else if (d < atkRange && r < 0.5) BossSystem.startAttack(game, b, 'swordCombo');
        else if (d < atkRange) BossSystem.startAttack(game, b, 'shockwaveSlam');
        else if (d > 160 && r < 0.35) BossSystem.startAttack(game, b, 'quickLunge');
        else if (r < 0.2) BossSystem.startAttack(game, b, 'hollowStorm');
        else if (r < 0.32) BossSystem.startAttack(game, b, 'energyShockwave');
        else BossSystem.stepToward(game, b, dt);
      }
    } else BossSystem.stepToward(game, b, dt);
  } else if (b.state === 'attack') {
    BossSystem.resolveAttack(game, b, dt);
  }
  BossSystem.endFrame(game, b, dt);
}

// ---- Guardian defeat: the seal breaks. The player is NOT told exactly what changed. ----
export function onGuardianDefeated(game, b) {
  game.sound.stopBossTheme();
  game.defeatedBosses.add('under_guardian');
  game.hooks.onBossEnd && game.hooks.onBossEnd();
  game._burst(b.x, b.y, GUARDIAN.burstColor, 60, 320);
  game.sound.victory();
  game.player.shards = (game.player.shards || 0) + 8;
  game._showMsg('Prey Slain — The Last Warden — 8 Bloodstone', 2600);
  game.sealBroken = true;
  Save.saveGame(game);
  game.state = 'playing';
  game.hooks.onState && game.hooks.onState('playing');
  // a subtle, delayed notification that something in the world has changed
  setTimeout(() => {
    if (game.state === 'playing') {
      game._showMsg('A deep tremor passes through the earth. Something far below has changed.', 4200);
      if (game.sound) game.sound.bossRoar && game.sound.bossRoar();
      game.camera.shake = Math.max(game.camera.shake, 10);
    }
  }, 2600);
  game._pushHud();
}

// ---- Rendering: the descent stair (surface) + subterranean tint + exit ----
export function drawWorld(game, ctx) {
  const t = game.runtime;
  // subterranean dark tint over the underworld pocket (drawn first, under props)
  ctx.fillStyle = 'rgba(8,4,16,0.55)';
  ctx.fillRect(REGION.x, REGION.y, REGION.w, REGION.h);
  // drifting dust motes
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const fx = REGION.x + 80 + ((t * 14 + i * 220) % (REGION.w - 160));
    const fy = REGION.y + 60 + ((t * 8 + i * 160) % (REGION.h - 120));
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 80);
    g.addColorStop(0, 'rgba(120,90,160,0.10)'); g.addColorStop(1, 'rgba(120,90,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 80, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  drawStair(ctx, EXIT.x, EXIT.y, t, false, game);
  drawStair(ctx, ENTRANCE.x, ENTRANCE.y, t, true, game);
}

function drawStair(ctx, x, y, t, descend, game) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#1a1422'; ctx.fillRect(-22, -4, 44, 6);
  ctx.fillStyle = '#2a2230'; ctx.fillRect(-18, -18, 36, 14);
  ctx.fillStyle = '#15101a';
  for (let i = 0; i < 4; i++) ctx.fillRect(-14 + i * 2, -16 + i * 3, 28 - i * 4, 3);
  const gl = 0.5 + Math.sin(t * 2) * 0.2;
  const g = ctx.createRadialGradient(0, -6, 2, 0, -6, 26);
  g.addColorStop(0, `rgba(150,110,210,${0.4 * gl})`); g.addColorStop(1, 'rgba(150,110,210,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6, 26, 0, TAU); ctx.fill();
  ctx.restore();
  const p = game.player;
  if (p && dist2(p.x, p.y, x, y) < 52 * 52) {
    const pulse = 0.5 + Math.sin(t * 4) * 0.5;
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '600 11px ui-serif, Georgia, serif';
    ctx.fillStyle = `rgba(220,190,240,${0.6 + pulse * 0.3})`;
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
    ctx.fillText(descend ? 'Descend (E)' : 'Ascend (E)', x, y - 30);
    ctx.restore();
  }
}

// ---- The Last Warden: a colossal stone warden with a glowing sealing crest ----
export function drawGuardian(game, ctx, b) {
  const t = game.runtime;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.3, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const flash = b.hitFlash > 0, stag = b.staggered > 0, p2 = b.phase >= 2;
  const stone = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#3a3340' : '#4a4450';
  const stoneD = flash ? '#fff' : stag ? '#9aa0ff' : '#241f28';
  ctx.fillStyle = stoneD; ctx.beginPath(); ctx.ellipse(-b.r * 0.1, b.r * 0.3, b.r * 1.4, b.r * 1.7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, b.r * 0.1, b.r * 1.2, b.r * 1.45, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = stoneD; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.35, -b.r * 0.4); ctx.lineTo(i * b.r * 0.35, b.r * 0.6); ctx.stroke(); }
  ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(-b.r * 0.9, -b.r * 0.2, b.r * 0.5, b.r * 0.55, 0, 0, TAU); ctx.fill();
  // the sealing crest (glowing rune on the chest) — fractures in phase 2
  const gl = 0.5 + Math.sin(t * 3) * 0.4;
  ctx.strokeStyle = flash ? '#fff' : `rgba(170,140,230,${gl})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(b.r * 0.15, b.r * 0.1, b.r * 0.45, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(b.r * 0.15, -b.r * 0.35); ctx.lineTo(b.r * 0.15, b.r * 0.55); ctx.moveTo(-b.r * 0.3, b.r * 0.1); ctx.lineTo(b.r * 0.6, b.r * 0.1); ctx.stroke();
  if (p2) { ctx.strokeStyle = flash ? '#fff' : '#5a3030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-b.r * 0.2, -b.r * 0.1); ctx.lineTo(b.r * 0.5, b.r * 0.3); ctx.moveTo(b.r * 0.1, b.r * 0.4); ctx.lineTo(b.r * 0.4, -b.r * 0.2); ctx.stroke(); }
  // great helm
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : '#2a2a34'; ctx.beginPath(); ctx.arc(b.r * 0.25, -b.r * 0.4, b.r * 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000'; ctx.fillRect(b.r * 0.25, -b.r * 0.48, b.r * 0.55, 3);
  const eg = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = flash ? '#fff' : `rgba(180,140,240,${eg})`; ctx.fillRect(b.r * 0.32, -b.r * 0.47, b.r * 0.4, 1.8);
  // greatsword
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(b.r * 0.5, b.r * 0.4); ctx.lineTo(b.r * 1.9, -b.r * 0.2); ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : p2 ? '#d0c8e0' : '#9aa6bd'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(b.r * 0.7, b.r * 0.3); ctx.lineTo(b.r * 1.95, -b.r * 0.22); ctx.stroke();
  ctx.strokeStyle = '#a090c0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.r * 0.5, b.r * 0.1); ctx.lineTo(b.r * 0.7, b.r * 0.5); ctx.stroke();
  ctx.restore();
}