// MountedBoss.js — The Hollow Castellan, reworked as a mounted knight riding an
// armored warhorse. A dedicated cavalry state machine: lance charge, sweeping
// halberd, horse rear-kick, galloping circles, hunting spears, and trampling
// hooves. Phase 2 corrupts the warhorse — dark fire trails, mounted leaps, a
// cavalry rush combo, and a final desperate charge. Shares BossSystem frame
// helpers but runs its own behavior resolver so the movement reads like a ride,
// not a footsoldier.

import { beginFrame, endFrame, phaseBurst, spawnPool, spawnShockwave } from './BossSystem.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

export function updateCastellan(game, dt) {
  const b = game.boss, p = game.player;
  if (!beginFrame(game, b, dt)) return;

  // ---- Phase 2: the warhorse corrupts (dark fire, faster, fiercer) ----
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) {
    b.phase = 2; b.speed = 156; b.dmg = Math.round(b.dmg * 1.18);
    phaseBurst(game, b, '#c040d0', b.phase2Msg);
  }
  // ---- Final desperate charge: once, below 15% HP in phase 2 ----
  if (b.phase >= 2 && !b._finalDone && b.hp < b.maxHp * 0.15 && b.state === 'chase') {
    b._finalDone = true;
    startMove(b, 'finalCharge', 1.0, 1.2, 1.0);
    game.camera.shake = Math.max(game.camera.shake, 10);
    game.sound.bossRoar();
  }

  b.stateT += dt;

  // ---- trample + dark fire trail while galloping/charging ----
  if (b.state === 'active' && (b._move === 'gallop' || b._move === 'cavalryRush' || b._move === 'finalCharge')) {
    if (p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes) && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r + 6) ** 2) {
      game._hurtPlayer(Math.round(b.dmg * 0.55), b.x, b.y);
      const a = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(a) * 200; p.vy += Math.sin(a) * 200;
    }
    if (b.phase >= 2) {
      b._trailT = (b._trailT || 0) + dt;
      if (b._trailT > 0.06) { b._trailT = 0; spawnPool(game, b.x, b.y, 36, 3.5, 16, 'rgba(140,40,160,0.5)'); game._burst(b.x, b.y, '#8030a0', 5, 90); }
    }
  }

  if (b.state === 'chase') {
    b.attackPhase = null; b.parryable = false;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    // ride toward an ideal cavalry range before the next strike
    const ideal = 220;
    if (d < ideal - 50) { b.x -= Math.cos(b.facing) * b.speed * 0.6 * dt; b.y -= Math.sin(b.facing) * b.speed * 0.6 * dt; }
    else if (d > ideal + 120) { b.x += Math.cos(b.facing) * b.speed * 0.6 * dt; b.y += Math.sin(b.facing) * b.speed * 0.6 * dt; }
    if (b.stateT > (b.phase === 2 ? 0.45 : 0.6)) pickMove(b, d);
  } else if (b.state === 'windup') {
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);   // track the hunter during the telegraph
    if (b._move === 'lanceCharge' || b._move === 'cavalryRush' || b._move === 'finalCharge') {
      b.x += Math.cos(b.facing) * b.speed * 0.4 * dt; b.y += Math.sin(b.facing) * b.speed * 0.4 * dt;   // the ride begins
    }
    if (b.stateT >= b._windup) {
      b.state = 'active'; b.stateT = 0; b._hit = false; b._fired = false;
      b.attackPhase = 'active'; b.parryable = false;
      if (b._move === 'lanceCharge' || b._move === 'finalCharge' || b._move === 'cavalryRush') b._chargeDir = b.facing;
      if (b._move === 'cavalryRush') b._rushPass = 0;
      if (b._move === 'mountedLeap') b._leapTarget = { x: p.x, y: p.y };
      if (b._move === 'gallop') {
        b._gallopCx = clamp((b.arena.minX + b.arena.maxX) / 2 + (Math.random() - 0.5) * 60, b.arena.minX + 80, b.arena.maxX - 80);
        b._gallopCy = clamp((b.arena.minY + b.arena.maxY) / 2 + (Math.random() - 0.5) * 60, b.arena.minY + 80, b.arena.maxY - 80);
        b._gallopAng = Math.atan2(b.y - b._gallopCy, b.x - b._gallopCx);
        b._gallopR = clamp(Math.min(b.arena.maxX - b.arena.minX, b.arena.maxY - b.arena.minY) * 0.32, 70, 130);
        b._spearT = 0;
      }
    }
  } else if (b.state === 'active') {
    executeMove(game, b, dt);
    if (b.stateT >= b._active) { b.state = 'recover'; b.stateT = 0; b.vx = 0; b.vy = 0; b.attackPhase = null; }
  } else if (b.state === 'recover') {
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    if (b.stateT >= b._recover) { b.state = 'chase'; b.stateT = 0; b._move = null; }
  }

  endFrame(game, b, dt);
}

function startMove(b, move, windup, active, recover) {
  b.state = 'windup'; b.stateT = 0; b._move = move;
  b._windup = windup; b._active = active; b._recover = recover;
  b._hit = false; b._fired = false;
  b.attackPhase = 'windup';
  b.parryable = (move === 'halberdSweep' || move === 'lanceCharge' || move === 'rearKick');
}

function pickMove(b, d) {
  const r = Math.random();
  if (d < 92) {
    if (r < 0.4) startMove(b, 'halberdSweep', 0.5, 0.26, 0.5);
    else if (r < 0.7) startMove(b, 'rearKick', 0.45, 0.18, 0.45);
    else if (b.phase >= 2 && r < 0.85) startMove(b, 'mountedLeap', 0.45, 0.42, 0.5);
    else startMove(b, 'lanceCharge', 0.65, 0.7, 0.5);
  } else {
    if (r < 0.3) startMove(b, 'lanceCharge', 0.65, 0.7, 0.5);
    else if (r < 0.53) startMove(b, 'gallop', 0.3, 2.0, 0.4);
    else if (r < 0.76) startMove(b, 'spearThrow', 0.5, 0.3, 0.5);
    else if (b.phase >= 2 && r < 0.9) startMove(b, 'cavalryRush', 0.5, 1.9, 0.6);
    else startMove(b, 'halberdSweep', 0.5, 0.26, 0.5);
  }
}

function executeMove(game, b, dt) {
  const p = game.player;
  switch (b._move) {
    case 'lanceCharge': {
      b.x += Math.cos(b._chargeDir) * 470 * dt; b.y += Math.sin(b._chargeDir) * 470 * dt;
      b.facing = b._chargeDir;
      if (!b._hit) {
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        const a = Math.atan2(p.y - b.y, p.x - b.x);
        if (d < 132 + p.r && Math.abs(angDiff(b._chargeDir, a)) < 0.5 && p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
          b._hit = true; game._hurtPlayer(b.dmg, b.x, b.y);
          const ka = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(ka) * 260; p.vy += Math.sin(ka) * 260;
          game._burst(p.x, p.y, '#d4a040', 14, 200);
        }
      }
      break;
    }
    case 'halberdSweep': {
      if (!b._hit) {
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        const a = Math.atan2(p.y - b.y, p.x - b.x);
        if (d < 124 + p.r && Math.abs(angDiff(b.facing, a)) < 1.1 && p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
          b._hit = true; game._hurtPlayer(Math.round(b.dmg * 0.95), b.x, b.y);
          const ka = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(ka) * 200; p.vy += Math.sin(ka) * 200;
          game._burst(p.x, p.y, '#cdd2e2', 12, 180);
        }
      }
      break;
    }
    case 'rearKick': {
      if (!b._hit) {
        const back = b.facing + Math.PI;
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        const a = Math.atan2(p.y - b.y, p.x - b.x);
        if (d < 78 + p.r && Math.abs(angDiff(back, a)) < 0.95 && p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
          b._hit = true; game._hurtPlayer(Math.round(b.dmg * 0.85), b.x, b.y);
          const ka = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(ka) * 300; p.vy += Math.sin(ka) * 300;
          game.camera.shake = Math.max(game.camera.shake, 8);
        }
      }
      break;
    }
    case 'spearThrow': {
      if (!b._fired) {
        b._fired = true;
        const n = b.phase >= 2 ? 3 : (Math.random() < 0.5 ? 2 : 1);
        const base = Math.atan2(p.y - b.y, p.x - b.x);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.18;
          game.projectiles.push({ x: b.x + Math.cos(a) * 22, y: b.y + Math.sin(a) * 22, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, life: 2.6, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.55), color: '#d4c090', spear: true });
        }
        game.sound.shot(); game._burst(b.x, b.y, '#d4c090', 8, 140);
      }
      break;
    }
    case 'gallop': {
      b._gallopAng += dt * 2.2;
      b.x = b._gallopCx + Math.cos(b._gallopAng) * b._gallopR;
      b.y = b._gallopCy + Math.sin(b._gallopAng) * b._gallopR;
      b.facing = b._gallopAng + Math.PI / 2;   // face the tangent (direction of travel)
      if (b.phase >= 2) {   // fling a hunting spear each pass
        b._spearT = (b._spearT || 0) + dt;
        if (b._spearT > 0.7) { b._spearT = 0; const a = Math.atan2(p.y - b.y, p.x - b.x); game.projectiles.push({ x: b.x + Math.cos(a) * 22, y: b.y + Math.sin(a) * 22, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 2.4, r: 7, fromPlayer: false, dmg: Math.round(b.dmg * 0.5), color: '#d4c090', spear: true }); game.sound.shot(); }
      }
      break;
    }
    case 'mountedLeap': {
      const t = b._leapTarget || { x: p.x, y: p.y };
      const a = Math.atan2(t.y - b.y, t.x - b.x);
      b.x += Math.cos(a) * 380 * dt; b.y += Math.sin(a) * 380 * dt;
      b.facing = a;
      if (!b._hit && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r + 8) ** 2) { b._hit = true; game._hurtPlayer(Math.round(b.dmg * 1.1), b.x, b.y); }
      if (b.stateT >= b._active - 0.02 && !b._fired) { b._fired = true; spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.5), 200, 360, '#8030a0'); game.camera.shake = Math.max(game.camera.shake, 10); game._burst(b.x, b.y, '#8030a0', 20, 200); }
      break;
    }
    case 'cavalryRush': {
      const passDur = 0.6;
      const pass = Math.min(2, Math.floor(b.stateT / passDur));
      if (pass !== b._rushPass) { b._rushPass = pass; b._hit = false; b._chargeDir = Math.atan2(p.y - b.y, p.x - b.x); game.camera.shake = Math.max(game.camera.shake, 6); }
      b.x += Math.cos(b._chargeDir) * 430 * dt; b.y += Math.sin(b._chargeDir) * 430 * dt;
      b.facing = b._chargeDir;
      if (!b._hit && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r + 8) ** 2 && p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
        b._hit = true; game._hurtPlayer(Math.round(b.dmg * 0.9), b.x, b.y);
        const ka = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(ka) * 240; p.vy += Math.sin(ka) * 240;
      }
      break;
    }
    case 'finalCharge': {
      b.x += Math.cos(b._chargeDir) * 560 * dt; b.y += Math.sin(b._chargeDir) * 560 * dt;
      b.facing = b._chargeDir;
      b._finT = (b._finT || 0) + dt;
      if (b._finT > 0.35) { b._finT = 0; b._hit = false; }   // re-arm: a long charge can trample repeatedly
      if (!b._hit && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r + 18) ** 2 && p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
        b._hit = true; game._hurtPlayer(Math.round(b.dmg * 1.25), b.x, b.y);
        const ka = Math.atan2(p.y - b.y, p.x - b.x); p.vx += Math.cos(ka) * 320; p.vy += Math.sin(ka) * 320;
        game.camera.shake = Math.max(game.camera.shake, 14);
      }
      break;
    }
  }
}

// ============================ RENDER ============================
// An armored warhorse with a lanced knight, top-down. Phase 2 corrupts the
// mount: darker barding, a purple dark-fire aura, and burning eyes/mane.
export function drawCastellan(game, ctx, b) {
  const t = game.runtime;
  const flash = b.hitFlash > 0, stag = b.staggered > 0;
  const p2 = b.phase >= 2;
  const moving = b.state === 'active' && (b._move === 'gallop' || b._move === 'lanceCharge' || b._move === 'cavalryRush' || b._move === 'finalCharge' || b._move === 'mountedLeap');
  const gait = moving ? 16 : 5;
  let rear = 0;
  if (b._move === 'rearKick' && (b.state === 'windup' || b.state === 'active')) rear = clamp((b.stateT || 0) / 0.45, 0, 1) * (b.state === 'active' ? 1 : 0.6);

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.8, b.r * 1.7, b.r * 0.7, 0, 0, TAU); ctx.fill();
  if (p2) { const g = ctx.createRadialGradient(0, 0, 4, 0, 0, b.r * 2.2); g.addColorStop(0, 'rgba(140,40,160,0.22)'); g.addColorStop(1, 'rgba(140,40,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r * 2.2, 0, TAU); ctx.fill(); }
  ctx.rotate(b.facing);
  ctx.rotate(-rear * 0.25);   // the horse rears back

  const armor = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#3a2a3a' : '#3a3a44';
  const armorD = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#1a1422' : '#1a1a22';
  const hide = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#2a2026' : '#2a2422';
  const hideD = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#160f18' : '#16120e';
  const gold = flash ? '#fff' : p2 ? '#a07ac0' : '#d4a040';
  const eyeRGB = p2 ? '224,64,192' : '255,184,74';
  const eg = 0.6 + Math.sin(t * 5) * 0.4;

  // ---- tail (flowing behind) ----
  const tailSway = Math.sin(t * 3) * 0.4;
  ctx.strokeStyle = hideD; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-b.r * 1.3, 0); ctx.quadraticCurveTo(-b.r * 1.9, tailSway * b.r * 0.3, -b.r * 2.2, tailSway * b.r * 0.5); ctx.stroke();
  if (p2) { ctx.strokeStyle = '#8030a0'; ctx.lineWidth = 3; ctx.stroke(); }

  // ---- legs (gallop stride; front legs tuck up on a rear) ----
  ctx.strokeStyle = hideD; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  const legs = [[b.r * 0.95, -1, 0], [b.r * 0.95, 1, 0.5], [-b.r * 0.95, -1, 1.0], [-b.r * 0.95, 1, 1.5]];
  for (const [lx, side, ph] of legs) {
    const swing = Math.sin(t * gait + ph * 1.6) * b.r * 0.18;
    const reach = lx > 0 ? b.r * 0.55 - rear * b.r * 0.4 : b.r * 0.55;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + swing, side * reach); ctx.stroke();
  }

  // ---- horse body (armored) ----
  ctx.fillStyle = hideD; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.45, b.r * 0.88, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hide; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.32, b.r * 0.78, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = armorD; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * b.r * 0.45, -b.r * 0.7); ctx.lineTo(i * b.r * 0.45, b.r * 0.7); ctx.stroke(); }
  ctx.fillStyle = armor; ctx.fillRect(-b.r * 1.2, -b.r * 0.18, b.r * 2.4, b.r * 0.36);
  ctx.fillStyle = gold; ctx.fillRect(-b.r * 1.2, -b.r * 0.18, b.r * 2.4, b.r * 0.06);

  // ---- neck + head ----
  ctx.fillStyle = hide; ctx.beginPath(); ctx.moveTo(b.r * 1.2, -b.r * 0.2); ctx.lineTo(b.r * 1.55, -b.r * 0.1); ctx.lineTo(b.r * 1.55, b.r * 0.1); ctx.lineTo(b.r * 1.2, b.r * 0.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = hideD; ctx.beginPath(); ctx.ellipse(b.r * 1.6, 0, b.r * 0.4, b.r * 0.34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(b.r * 1.68, 0, b.r * 0.22, b.r * 0.2, 0, 0, TAU); ctx.fill();   // chamfron
  ctx.fillStyle = flash ? '#fff' : `rgba(${eyeRGB},${eg})`;
  ctx.beginPath(); ctx.arc(b.r * 1.78, -b.r * 0.1, 2.4, 0, TAU); ctx.arc(b.r * 1.78, b.r * 0.1, 2.4, 0, TAU); ctx.fill();
  ctx.fillStyle = hideD; ctx.beginPath(); ctx.moveTo(b.r * 1.5, -b.r * 0.24); ctx.lineTo(b.r * 1.42, -b.r * 0.42); ctx.lineTo(b.r * 1.62, -b.r * 0.3); ctx.closePath(); ctx.moveTo(b.r * 1.5, b.r * 0.24); ctx.lineTo(b.r * 1.42, b.r * 0.42); ctx.lineTo(b.r * 1.62, b.r * 0.3); ctx.closePath(); ctx.fill();   // ears
  ctx.fillStyle = flash ? '#fff' : p2 ? '#1a0a1a' : '#1a1410';
  for (let i = 0; i < 6; i++) { const mx = b.r * (1.1 - i * 0.12); ctx.beginPath(); ctx.moveTo(mx, -b.r * 0.18); ctx.lineTo(mx - b.r * 0.04, -b.r * 0.34 - Math.sin(t * 6 + i) * 2); ctx.lineTo(mx + b.r * 0.06, -b.r * 0.2); ctx.closePath(); ctx.fill(); }   // mane
  if (p2 && Math.random() < 0.5) game.particles.push({ x: b.x + Math.cos(b.facing) * b.r * 1.2, y: b.y + Math.sin(b.facing) * b.r * 1.2, vx: (Math.random() - 0.5) * 30, vy: -rand(20, 60), life: 0.7, max: 0.7, r: 2.2, color: '#c040d0' });

  // ---- rider (armored knight) ----
  ctx.fillStyle = armorD; ctx.beginPath(); ctx.ellipse(-b.r * 0.1, -b.r * 0.05, b.r * 0.5, b.r * 0.7, 0, 0, TAU); ctx.fill();   // cape/banner behind
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(b.r * 0.05, -b.r * 0.05, b.r * 0.46, b.r * 0.6, 0, 0, TAU); ctx.fill();    // torso
  ctx.strokeStyle = armorD; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(b.r * 0.05, -b.r * 0.5); ctx.lineTo(b.r * 0.05, b.r * 0.35); ctx.stroke();
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(b.r * 0.05, -b.r * 0.45, b.r * 0.2, b.r * 0.22, 0, 0, TAU); ctx.fill();    // pauldrons
  ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(b.r * 0.05, -b.r * 0.45, b.r * 0.07, 0, TAU); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : stag ? '#9aa0ff' : p2 ? '#2a1a2a' : '#22222c'; ctx.beginPath(); ctx.ellipse(b.r * 0.15, -b.r * 0.18, b.r * 0.26, b.r * 0.3, 0, 0, TAU); ctx.fill();   // great helm
  ctx.fillStyle = '#000'; ctx.fillRect(b.r * 0.15, -b.r * 0.24, b.r * 0.34, 2.5);   // visor slit
  ctx.fillStyle = flash ? '#fff' : `rgba(${eyeRGB},${eg})`; ctx.fillRect(b.r * 0.22, -b.r * 0.235, b.r * 0.22, 1.6);   // glowing visor

  // ---- polearm (lance / halberd) ----
  let armAng = -0.08;
  if (b._move === 'halberdSweep' && b.state === 'active') armAng = Math.sin((b.stateT / b._active) * Math.PI - Math.PI / 2) * 1.1;
  else if (b._move === 'rearKick') armAng = -1.2 * rear;
  else if (b._move === 'lanceCharge' || b._move === 'finalCharge' || b._move === 'cavalryRush' || b._move === 'mountedLeap') armAng = 0;
  const couched = b._move === 'lanceCharge' || b._move === 'finalCharge';
  const pLen = couched ? b.r * 2.7 : b.r * 2.2;
  const px0 = b.r * 0.2, py0 = -b.r * 0.05;
  const px1 = px0 + Math.cos(armAng) * pLen, py1 = py0 + Math.sin(armAng) * pLen;
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px1, py1); ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : p2 ? '#b890d8' : '#c9d2e2'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px1, py1); ctx.stroke();
  ctx.save(); ctx.translate(px1, py1); ctx.rotate(armAng);   // blade head
  ctx.fillStyle = flash ? '#fff' : p2 ? '#c060e0' : '#d4c090';
  ctx.beginPath(); ctx.moveTo(0, -b.r * 0.18); ctx.lineTo(b.r * 0.3, 0); ctx.lineTo(0, b.r * 0.18); ctx.lineTo(-b.r * 0.08, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (couched) {   // lance pennant
    const fx = px0 + (px1 - px0) * 0.5, fy = py0 + (py1 - py0) * 0.5;
    ctx.fillStyle = flash ? '#fff' : p2 ? '#8030a0' : '#7a3a2a';
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 9, fy - 7); ctx.lineTo(px0 + (px1 - px0) * 0.62, py0 + (py1 - py0) * 0.62); ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

function rand(a, b) { return a + Math.random() * (b - a); }