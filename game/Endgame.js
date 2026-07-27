// Endgame.js — the sealed gate, the final region's atmosphere, the final boss
// (The First Voice), and the ending sequence. All logic lives here; HuntGame
// only adds thin dispatch hooks so its file stays small.

import { GATE, REGION } from './FinalRegion.js';
import * as BossSystem from './BossSystem.js';
import * as Celestial from './CelestialEnding.js';
import { REQUIRED_GUARDIANS } from './Objectives.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// The six required Guardians — shared with Objectives (guidance) and the
// Hunter's Journal (BossProgress) so the gate, the beam, and the journal never
// disagree on what "all Guardians slain" means. Secret bosses are optional.
export function allDefeated(game) { return REQUIRED_GUARDIANS.every(id => game.defeatedBosses.has(id)); }

// ---- Player proximity to the sealed gate ----
export function onPlayerUpdate(game) {
  const p = game.player;
  const open = game.openGates.has('final_gate');
  p.nearGate = !open && !game.finalGateOpened && Math.hypot(p.x - GATE.x, p.y - GATE.y) < 70;
}

// ---- Gate interaction (message if locked, open if every Guardian is slain) ----
export function tryInteract(game) {
  const p = game.player;
  if (!p.nearGate) return false;
  if (!allDefeated(game)) {
    game._showMsg('Collect the Souls of every fallen Guardian to unlock this gate.', 3400);
    return true;
  }
  if (!game.eliasFinalTalked) {
    game._showMsg('Return to Elias in the Hunter\'s Nightmare. He awaits you.', 3600);
    return true;
  }
  // Every Guardian is slain and Elias has sent the Hunter: the seal breaks only
  // when the Hunter reaches the gate under their own feet. Begin the opening
  // rite — the gate swings open after a short cinematic (handled in update()).
  if (!game.openGates.has('final_gate') && !game.finalGateOpened && !game.finalGateOpening) {
    game.finalGateOpening = { t: 0 };
    game.sound.shortcutUnlock();
  }
  return true;
}

// ---- Per-frame: gate-opening animation + ending timeline ----
export function update(game, dt) {
  if (game.finalGateOpening) {
    game.finalGateOpening.t += dt;
    if (game.finalGateOpening.t > 2.6) {
      game.openGates.add('final_gate');
      game.finalGateOpened = true;
      game.finalGateOpening = null;
      game.sound.bossRoar();
      game.camera.shake = Math.max(game.camera.shake, 16);
      game._showMsg('The way to the final chapter lies open.', 3000);
    }
  }
  if (game.state === 'ending') { updateEnding(game, dt); return true; }
  // The mentor's reveal plays out while the player is still free to move.
  if (game.finalReveal && !game.finalReveal.spawned) {
    if (game.state === 'dead') {
      // Died mid-reveal — cancel so it restarts cleanly on re-entry.
      game.finalReveal = null;
    } else if (game.paused) {
      // hold the sequence while a menu is open
    } else {
      const p = game.player;
      // Lock the player in the arena so the revelation completes reliably and
      // cannot be cancelled by stepping back through the doorway.
      p.x = clamp(p.x, 4222 + p.r, 4878 - p.r);
      p.y = clamp(p.y, 5922 + p.r, 6268 - p.r);
      const r = game.finalReveal; r.t += dt;
      if (r.t > 1 && !r.m1) { r.m1 = true; game._showMsg('Elias steps into the Sanctum.', 3200); }
      if (r.t > 4 && !r.m2) { r.m2 = true; game._showMsg('"You were always my finest student, Hunter."', 3800); }
      if (r.t > 8 && !r.m3) { r.m3 = true; game._showMsg('"The beast sleeps in every one of us. I kept mine leashed... a long, long time."', 4400); }
      if (r.t > 12.5 && !r.m4) {
        r.m4 = true; game._showMsg('"You have freed it. Forgive me — and do not be gentle."', 3800);
        game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 18);
      }
      if (r.t > 15) { r.spawned = true; game._finalRevealedOnce = true; game.finalReveal = null; game._spawnBoss('final'); }
    }
  }
  // ---- SECRET ENDING: the Celestial God descends and strikes Elias down ----
  if (game.celestialReveal && !game.celestialReveal.spawned) {
    if (game.state === 'dead') { game.celestialReveal = null; }
    else if (game.paused) { /* hold the sequence while a menu is open */ }
    else {
      const p = game.player;
      p.x = clamp(p.x, 4222 + p.r, 4878 - p.r);
      p.y = clamp(p.y, 5922 + p.r, 6268 - p.r);
      const r = game.celestialReveal; r.t += dt;
      // The secret-ending reveal plays slowly so every line can be read. Each
      // page is given its full duration before the next appears, and the
      // Celestial God's own line (which names it) lingers longest of all.
      if (r.t > 1 && !r.m1) { r.m1 = true; game._showMsg('Elias steps into the Sanctum.', 4000); }
      if (r.t > 5.5 && !r.m2) { r.m2 = true; game._showMsg('"You came. Good. I was afraid you would not — and afraid you would."', 5500); }
      if (r.t > 11.5 && !r.m3) { r.m3 = true; game._showMsg('The air tears open above the Sanctum. Something that is not rain begins to fall.', 6000); game.camera.shake = Math.max(game.camera.shake, 14); }
      if (r.t > 18 && !r.m4) { r.m4 = true; game._showMsg('A figure of starlight descends. It does not look at you. It looks at Elias.', 6000); game.camera.shake = Math.max(game.camera.shake, 18); }
      if (r.t > 24.5 && !r.m5) { r.m5 = true; game._showMsg('"I am the dream behind the dream — the curse the kingdom forgot it made. The Night of the Hunt was always mine." The Celestial God strikes Elias down before he can change.', 8500); game.sound.bossRoar && game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 22); game._burst(p.x, p.y - 60, '#c0a8ff', 50, 300); }
      if (r.t > 34) { r.spawned = true; game._celestialRevealedOnce = true; game.celestialReveal = null; Celestial.spawnCelestial(game); }
    }
  }
  return false;
}

function updateEnding(game, dt) {
  const e = game.ending = game.ending || { t: 0, phase: 0, fired: false };
  e.t += dt;
  if (e.t > 1.4 && !e.msg1) { e.msg1 = true; game._showMsg('The song ends.', 2600); }
  if (e.t > 3.2 && e.phase === 0) {
    e.phase = 1;
    if (!e.fired) { e.fired = true; game.hooks.onEnding && game.hooks.onEnding(true); }
  }
}

// ---- World-space rendering: monumental gate + final-region atmosphere ----
export function drawWorld(game, ctx) {
  ctx.save();
  // heavy fog/darkness over the sanctum
  ctx.fillStyle = 'rgba(10,6,18,0.5)';
  ctx.fillRect(REGION.x, REGION.y, REGION.w, REGION.h);
  // endless drifting fog
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const fx = REGION.x + 80 + ((game.runtime * 10 + i * 240) % (REGION.w - 160));
    const fy = REGION.y + 80 + i * 300;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 150);
    g.addColorStop(0, 'rgba(90,70,140,0.10)'); g.addColorStop(1, 'rgba(90,70,140,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 150, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // strange glowing symbols
  ctx.fillStyle = `rgba(170,120,220,${0.4 + Math.sin(game.runtime * 2) * 0.2})`;
  ctx.font = '22px ui-serif, serif'; ctx.textAlign = 'center';
  const syms = ['✦', '☽', '✧', '◆'];
  for (let i = 0; i < 4; i++) {
    const sx = REGION.x + 220 + i * 240;
    const sy = REGION.y + 320 + Math.sin(game.runtime + i) * 12;
    ctx.fillText(syms[i], sx, sy);
  }
  ctx.textAlign = 'left';
  // the abyss beneath the bridge
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath(); ctx.ellipse(4500, 5750, 190, 120, 0, 0, TAU); ctx.fill();
  ctx.restore();
  drawGate(game, ctx);
}

function drawGate(game, ctx) {
  const open = game.openGates.has('final_gate');
  const op = game.finalGateOpening ? clamp(game.finalGateOpening.t / 2.6, 0, 1) : (open ? 1 : 0);
  const gx = GATE.x, gy = GATE.y;
  ctx.save();
  // monumental arch frame
  ctx.fillStyle = '#2a2436'; ctx.fillRect(gx - 116, gy - 76, 232, 110);
  ctx.fillStyle = '#1a1422'; ctx.fillRect(gx - 104, gy - 66, 208, 100);
  ctx.strokeStyle = '#4a3a5a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(gx, gy - 66, 104, 0, Math.PI); ctx.stroke();
  // doors slide apart
  const dx = op * 104;
  drawSlab(ctx, gx - 104 - dx, gy - 60, 104, 92, game);
  drawSlab(ctx, gx + dx, gy - 60, 104, 92, game);
  // glowing seal while closed
  if (op < 0.5) {
    ctx.fillStyle = `rgba(170,120,220,${0.5 + Math.sin(game.runtime * 4) * 0.3})`;
    ctx.beginPath(); ctx.arc(gx, gy, 11, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(170,120,220,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(gx, gy, 16, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function drawSlab(ctx, x, y, w, h, game) {
  ctx.fillStyle = '#3a2e26'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#241c14'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#6a5a4a';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(x + 12, y + 16 + i * 28, 2.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - 12, y + 16 + i * 28, 2.5, 0, TAU); ctx.fill();
  }
  const gl = 0.5 + Math.sin(game.runtime * 3) * 0.4;
  ctx.fillStyle = `rgba(170,120,220,${gl})`;
  ctx.font = '18px ui-serif, serif'; ctx.textAlign = 'center';
  ctx.fillText('✦', x + w / 2, y + h / 2 + 7);
  ctx.textAlign = 'left';
}

// ---- Screen-space: ending fade-to-light overlay ----
export function drawScreen(game, ctx) {
  if (game.state !== 'ending') return;
  const t = (game.ending && game.ending.t) || 0;
  let a = 0;
  if (t < 1.6) a = (t / 1.6) * 0.92;
  else if (t < 3.2) a = 0.92;
  else a = 0.92 - Math.min((t - 3.2) / 2, 1) * 0.45;
  ctx.fillStyle = `rgba(240,234,218,${a})`;
  ctx.fillRect(0, 0, game.viewW, game.viewH);
}

// ---- Final boss spawn trigger ----
// When the player first steps into the final arena (every Guardian slain, gate
// open), the mentor Elias reveals his true nature through a brief scripted
// sequence, then transforms into the First Beast.
export function checkTrigger(game) {
  const p = game.player;
  // Re-triggers cleanly whenever the player re-enters the arena with no boss
  // active and no reveal already in progress — so dying and returning always
  // restarts the encounter instead of soft-locking it.
  if (game.boss || game.defeatedBosses.has('final') || game.finalReveal || game.celestialReveal) return;
  if (game._celestialDefeated) return;   // the True Ending is complete — Elias never rises
  if (!allDefeated(game) || !game.openGates.has('final_gate') || !game.eliasFinalTalked) return;
  if (p.x > 4220 && p.x < 4880 && p.y > 5920 && p.y < 6270) {
    // SECRET ENDING: if the optional secret boss The Cliff Watcher has been
    // slain, the Celestial God — the true force behind the curse and the Night
    // of the Hunt — descends instead of Elias transforming, striking Elias down
    // before the fight can begin.
    if (game.defeatedBosses.has('cliff_watcher') && !game._celestialDefeated) {
      if (game._celestialRevealedOnce) { Celestial.spawnCelestial(game); return; }
      game.enemies = game.enemies.filter(e => !(e.alive && e.x > 4180 && e.x < 4920 && e.y > 5880 && e.y < 6300));
      game.celestialReveal = { t: 0, m1: false, m2: false, m3: false, m4: false, m5: false, spawned: false };
      return;
    }
    // On a retry, skip the cinematic and spawn the First Beast directly.
    if (game._finalRevealedOnce) { game._spawnBoss('final'); return; }
    // clear the cathedral honor guard so the revelation plays unbroken
    game.enemies = game.enemies.filter(e => !(e.alive && e.x > 4180 && e.x < 4920 && e.y > 5880 && e.y < 6300));
    game.finalReveal = { t: 0, m1: false, m2: false, m3: false, m4: false, spawned: false };
  }
}

// ---- Final boss AI (The First Voice: hymn shockwaves, flood, silence nova) ----
// ---- Elias, the First Voice — the greatest Hunter the player has ever faced.
// A self-contained, hunter-themed moveset: flowing combos that shift
// unpredictably, gun parries that punish reckless aggression, quickstep
// counters, plunging strikes with shockwaves, blood-infused trails, and
// delayed finishers that punish panic rolling. Each phase layers in new
// techniques rather than just inflating stats. ----
const ELIAS_ATK = {
  hunterCombo:    { windup: 0.3,  active: 0.62, recover: 0.4,  reach: 122, arc: 1.4, parry: true,  kind: 'flurry', hitEvery: 0.18 },
  gunParry:       { windup: 0.42, active: 0.12, recover: 0.45, kind: 'gunParry', parry: false },
  quickstep:      { windup: 0.24, active: 0.26, recover: 0.3,  reach: 118, arc: 1.6, parry: true,  kind: 'quickstep' },
  plungeAttack:   { windup: 0.55, active: 0.32, recover: 0.55, kind: 'plunge' },
  bloodSlash:     { windup: 0.42, active: 0.24, recover: 0.5,  reach: 122, arc: 1.6, parry: true,  kind: 'bloodSlash' },
  delayedFinisher:{ windup: 1.25, active: 0.24, recover: 0.6,  reach: 144, arc: 1.9, parry: false, kind: 'delayedFinisher' },
};

function resolveEliasAtk(game, b, dt) {
  const def = ELIAS_ATK[b._attackType];
  const p = game.player;
  b.parryable = b.attackPhase === 'windup' && !!def.parry;
  if (b.attackPhase === 'windup') {
    if (b.stateT >= def.windup) { b.attackPhase = 'active'; b.stateT = 0; b._hit = false; b._fired = false; b._flurryT = 0; }
  } else if (b.attackPhase === 'active') {
    switch (def.kind) {
      case 'flurry': {
        // A flowing combo that shifts angle between strikes — a fixed dodge
        // rhythm won't save the Hunter from the next blow.
        b._flurryT = (b._flurryT || 0) + dt;
        if (b._flurryT >= def.hitEvery) { b._flurryT = 0; b._hit = false; b.facing += (Math.random() - 0.5) * 0.7; }
        BossSystem.meleeHit(game, b, def.reach, def.arc);
        break;
      }
      case 'gunParry': {
        if (!b._fired) {
          b._fired = true;
          const a = b.facing;
          game.projectiles.push({ x: b.x + Math.cos(a) * 18, y: b.y + Math.sin(a) * 18, vx: Math.cos(a) * 680, vy: Math.sin(a) * 680, life: 1.4, r: 5, fromPlayer: false, dmg: Math.round(b.dmg * 0.7), color: '#ffd27a' });
          game.sound.shot(); game.camera.shake = Math.max(game.camera.shake, 4);
          // Reckless aggression is punished: attacking into the gunshot staggers
          // the Hunter, opening them to the next combo.
          const aggressive = p.recovering > 0.1 || p.charging || (p.swing && p.swing.t < p.swing.dur);
          if (aggressive && p.invuln <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < 460) game._addStagger(2.4);
        }
        break;
      }
      case 'quickstep': {
        if (!b._fired) {
          b._fired = true;
          // Quickstep to the Hunter's blind side, then counter immediately.
          const back = p.facing + Math.PI + (Math.random() - 0.5) * 0.9;
          const tx = clamp(p.x + Math.cos(back) * 78, b.arena.minX, b.arena.maxX);
          const ty = clamp(p.y + Math.sin(back) * 78, b.arena.minY, b.arena.maxY);
          game._burst(b.x, b.y, '#c0a060', 18, 200);
          b.x = tx; b.y = ty; b.vx = 0; b.vy = 0;
          b.facing = Math.atan2(p.y - b.y, p.x - b.x);
          game._burst(b.x, b.y, '#c0a060', 18, 200);
          game.sound.transform();
          b._hit = false;
        }
        BossSystem.meleeHit(game, b, def.reach, def.arc);
        break;
      }
      case 'plunge': {
        if (!b._fired) {
          b._fired = true;
          const t = b._leapTarget || { x: p.x, y: p.y };
          game._burst(b.x, b.y, '#c0a060', 16, 200);
          b.x = clamp(t.x, b.arena.minX, b.arena.maxX); b.y = clamp(t.y, b.arena.minY, b.arena.maxY);
          b.vx = 0; b.vy = 0;
          BossSystem.spawnShockwave(game, b.x, b.y, Math.round(b.dmg * 0.55), 250, 380, '#c0a060');
          game.camera.shake = Math.max(game.camera.shake, 14); game.sound.slam && game.sound.slam();
          const d = Math.hypot(p.x - b.x, p.y - b.y);
          if (d < 58 + p.r && p.invuln <= 0) game._hurtPlayer(b.dmg, b.x, b.y);
        }
        break;
      }
      case 'bloodSlash': {
        if (!b._fired) {
          b._fired = true;
          BossSystem.meleeHit(game, b, def.reach, def.arc);
          // A blood-infused trail lingers along the slash path.
          for (let i = 1; i <= 4; i++) {
            const px = b.x + Math.cos(b.facing) * i * 24, py = b.y + Math.sin(b.facing) * i * 24;
            BossSystem.spawnPool(game, px, py, 28, 4, Math.round(b.dmg * 0.25), 'rgba(150,20,30,0.5)');
          }
          game._bloodSplash(b.x, b.y, b.facing, 16, true);
          game.camera.shake = Math.max(game.camera.shake, 8);
        }
        break;
      }
      case 'delayedFinisher': {
        // A deliberate, telegraphed finisher that lands at the very end of a
        // long windup — a panic roll early burns iframes before the blow falls.
        if (!b._fired) {
          b._fired = true;
          BossSystem.meleeHit(game, b, def.reach, def.arc);
          game.camera.shake = Math.max(game.camera.shake, 12);
          game._burst(b.x + Math.cos(b.facing) * 44, b.y + Math.sin(b.facing) * 44, '#8a1a1a', 20, 220);
          game.sound.bossRoar && game.sound.bossRoar();
        }
        break;
      }
    }
    if (b.stateT >= def.active) { b.attackPhase = 'recover'; b.stateT = 0; }
  } else if (b.attackPhase === 'recover') {
    if (b.stateT >= def.recover) { b.state = 'chase'; b.attackPhase = null; b.stateT = 0; b._leapTarget = null; b._fired = false; }
  }
}

export function updateFinal(game, dt) {
  const b = game.boss, p = game.player;
  // Phase IV transformation cinematic: Elias becomes the First Beast. He is
  // rooted and invulnerable while the transformation plays out, then resumes
  // the hunt with his fresh health bar and far greater fury.
  if (b._transforming) {
    b._transformT = (b._transformT || 0) + dt;
    b.vx = 0; b.vy = 0;
    b.invuln = Math.max(b.invuln || 0, 0.1);
    if (b._transformT > 0.25 && !b._tfxBurst) {
      b._tfxBurst = true;
      game._burst(b.x, b.y, '#c060ff', 50, 300);
      game._burst(b.x, b.y, '#ffffff', 24, 240);
      game.camera.shake = Math.max(game.camera.shake, 18);
      game.sound.bossRoar && game.sound.bossRoar();
    }
    if (b._transformT > 1.1 && !b._tfxMsg) {
      b._tfxMsg = true;
      game._showMsg(b.phase4Msg || 'Phase IV — The True Beast', 2800);
      game.sound.bossPhase && game.sound.bossPhase();
    }
    if (b._transformT > 2.2) {
      b._transforming = false;
      b.state = 'chase'; b.stateT = 0; b.attackPhase = null;
    }
    game.hooks.onBossHp && game.hooks.onBossHp(b.hp, b.maxHp);
    return;
  }
  if (!BossSystem.beginFrame(game, b, dt)) return;
  if (b.phase === 1 && b.hp < b.maxHp * b.phase2at) { b.phase = 2; b.speed = 92; b.dmg = 40; BossSystem.phaseBurst(game, b, '#5a8ad6', b.phase2Msg); }
  else if (b.phase === 2 && b.hp < b.maxHp * b.phase3at) { b.phase = 3; b.speed = 108; b.dmg = 46; b.r = 34; BossSystem.phaseBurst(game, b, '#a06ad6', b.phase3Msg); }
  b.stateT += dt;
  if (b.state === 'chase') {
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    b.facing = Math.atan2(p.y - b.y, p.x - b.x);
    // Phase 2+: the sanctum floods — water pools spread across the arena.
    if (b.phase >= 2) {
      b._floodCool = (b._floodCool ?? 2.5) - dt;
      if (b._floodCool <= 0) {
        b._floodCool = 3 + Math.random() * 2;
        const a = Math.random() * TAU, r = 60 + Math.random() * 200;
        const px = clamp(b.x + Math.cos(a) * r, b.arena.minX + 30, b.arena.maxX - 30);
        const py = clamp(b.y + Math.sin(a) * r, b.arena.minY + 30, b.arena.maxY - 30);
        BossSystem.spawnPool(game, px, py, 70, 5, 14, 'rgba(60,120,200,0.4)');
      }
    }
    const pick = (type) => BossSystem.startAttack(game, b, type);
    if (b.stateT > (b.phase === 4 ? 0.34 : b.phase >= 3 ? 0.4 : 0.48)) {
      const r = Math.random();
      if (b.phase === 1) {
        // The Old Hunter: measured. Teaches his rhythm — combos, quicksteps, and
        // the occasional gun parry that punishes mashing.
        if (d < 120 && r < 0.6) pick('hunterCombo');
        else if (r < 0.82) pick('quickstep');
        else pick('gunParry');
      } else if (b.phase === 2) {
        // The Beast Waking: adds plunging strikes and blood trails.
        if (d < 120 && r < 0.34) pick('hunterCombo');
        else if (d < 120 && r < 0.5) pick('bloodSlash');
        else if (d > 180 && r < 0.66) { pick('plungeAttack'); b._leapTarget = { x: p.x, y: p.y }; }
        else if (r < 0.78) pick('quickstep');
        else if (r < 0.9) pick('gunParry');
        else pick('delayedFinisher');
      } else if (b.phase === 3) {
        // The First Beast: cunning — quicker combos, more delayed finishers.
        if (d < 120 && r < 0.28) pick('hunterCombo');
        else if (d < 120 && r < 0.46) pick('bloodSlash');
        else if (d > 180 && r < 0.62) { pick('plungeAttack'); b._leapTarget = { x: p.x, y: p.y }; }
        else if (r < 0.74) pick('quickstep');
        else if (r < 0.84) pick('gunParry');
        else pick('delayedFinisher');
      } else {
        // Phase IV — the True Beast: every hunter technique, faster and chained,
        // fused with the abyssal power of the unleashed beast.
        if (d < 120 && r < 0.24) pick('hunterCombo');
        else if (d < 120 && r < 0.4) pick('bloodSlash');
        else if (d > 160 && r < 0.54) { pick('plungeAttack'); b._leapTarget = { x: p.x, y: p.y }; }
        else if (r < 0.66) pick('quickstep');
        else if (r < 0.78) pick('delayedFinisher');
        else if (r < 0.88) pick('voidBarrage');
        else if (r < 0.96) pick('leviathanCharge');
        else pick('abyssalNova');
      }
    } else BossSystem.stepToward(game, b, dt);
    // Quickstep repositioning (phase 2+) — Elias dances around the arena.
    if (b.phase >= 2) { b._telepCool = (b._telepCool ?? 5) - dt; if (b._telepCool <= 0) { b._telepCool = 4 + Math.random() * 3; BossSystem.teleport(game, b); } }
    // Phase 3+: summons the drowned choir to harry the Hunter.
    if (b.phase >= 3) { b._sumCool = (b._sumCool ?? 9) - dt; if (b._sumCool <= 0 && game.enemies.filter(e => e.alive).length < 5) { b._sumCool = 14; BossSystem.summon(game, b, 'crawler'); } }
  } else if (b.state === 'attack') {
    if (ELIAS_ATK[b._attackType]) resolveEliasAtk(game, b, dt);
    else BossSystem.resolveAttack(game, b, dt);
  }
  BossSystem.endFrame(game, b, dt);
}

// ---- Phase IV: Elias transforms into the First Beast, his ultimate form ----
// When his third health bar is depleted, Elias does not die — he casts off the
// last of his humanity and rises as the First Beast with a fresh health bar,
// roughly 30% deadlier and far more aggressive, wielding an all-new moveset.
// This is the true climax of the game.
export function beginPhase4(game, b) {
  b.phase = 4;
  // An entirely new health bar — the previous one is spent.
  b.maxHp = Math.round(3200 * (game._hpScale || 1));
  b.hp = b.maxHp;
  // ~30% stronger: more damage, faster, larger, and far more aggressive.
  b.dmg = Math.round(b.dmg * 1.3);
  b.speed = Math.round(b.speed * 1.15);
  b.r = 38;
  // Reset combat state for the new phase.
  b.state = 'transform'; b.stateT = 0; b.attackPhase = null;
  b._transforming = true; b._transformT = 0; b._tfxBurst = false; b._tfxMsg = false;
  b._fired = false; b._hit = false; b._leapTarget = null;
  b._floodCool = 1.5; b._telepCool = 3; b._sumCool = 6;
  b.invuln = 2.4;
  // Cinematic punctuation: the world holds its breath.
  game.hitstop = Math.max(game.hitstop || 0, 0.5);
  game.slowmo = Math.max(game.slowmo || 0, 1.0);
  game.camera.shake = Math.max(game.camera.shake, 20);
  game.sound.bossPhase && game.sound.bossPhase();
  game.sound.bossRoar && game.sound.bossRoar();
  game._burst(b.x, b.y, '#c060ff', 60, 320);
  game._burst(b.x, b.y, '#ffffff', 30, 260);
  game.hooks.onBossHp && game.hooks.onBossHp(b.hp, b.maxHp);
}

// ---- Final boss rendering: Elias, the First Beast (3 escalating forms) ----
// Phase 1: the Old Hunter, still mostly a man, tricorn low, a blade in hand.
// Phase 2: the beast waking — hunched, claws out, tattered coat, glowing eyes.
// Phase 3: the First Beast unleashed — a towering, many-eyed horror of fur and claw.
export function drawFinal(game, ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(0, b.r * 0.85, b.r * 1.1, b.r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.rotate(b.facing);
  const t = game.runtime;
  const gl = 0.6 + Math.sin(t * 6) * 0.4;
  const flash = b.hitFlash > 0;
  const stag = b.staggered > 0;

  if (b.phase === 1) {
    // The Old Hunter — a calm, cloaked figure with a tricorn and a long blade.
    const coat = flash ? '#fff' : stag ? '#9aa0ff' : '#1a1620';
    const face = flash ? '#fff' : '#b89878';
    ctx.fillStyle = coat; ctx.beginPath(); ctx.ellipse(0, 3, b.r * 1.2, b.r * 1.45, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#24202c'; ctx.beginPath(); ctx.arc(0, -1, b.r * 0.95, 0, TAU); ctx.fill();
    ctx.fillStyle = face; ctx.beginPath(); ctx.arc(b.r * 0.1, -b.r * 0.2, b.r * 0.42, 0, TAU); ctx.fill();
    // tricorn
    ctx.fillStyle = '#0c0a12'; ctx.beginPath(); ctx.ellipse(b.r * 0.1, -b.r * 0.5, b.r * 1.0, b.r * 0.34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#15121c'; ctx.beginPath(); ctx.ellipse(b.r * 0.1, -b.r * 0.58, b.r * 0.5, b.r * 0.22, 0, 0, TAU); ctx.fill();
    // a long, steady blade
    ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.r * 1.8, -b.r * 0.2); ctx.stroke();
    // faint old eyes
    ctx.fillStyle = flash ? '#fff' : `rgba(200,170,90,${gl})`;
    ctx.beginPath(); ctx.arc(b.r * 0.28, -b.r * 0.22, 1.8, 0, TAU); ctx.fill();
  } else if (b.phase === 2) {
    // The beast waking — hunched, tattered, claws extended, eyes burning.
    const fur = flash ? '#fff' : stag ? '#9aa0ff' : '#3a2418';
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, 4, b.r * 1.35, b.r * 1.5, 0, 0, TAU); ctx.fill();
    // tattered coat tails
    ctx.fillStyle = flash ? '#fff' : '#241a12';
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.5;
      ctx.beginPath(); ctx.moveTo(Math.sin(a) * b.r * 0.8, b.r * 0.6);
      ctx.lineTo(Math.sin(a) * b.r * 1.3, b.r * 1.8); ctx.lineTo(Math.sin(a) * b.r * 0.5, b.r * 1.6); ctx.closePath(); ctx.fill();
    }
    // hunched head
    ctx.fillStyle = flash ? '#fff' : '#2a1a10'; ctx.beginPath(); ctx.arc(b.r * 0.3, -b.r * 0.3, b.r * 0.7, 0, TAU); ctx.fill();
    // jaws
    ctx.fillStyle = flash ? '#fff' : '#1a0a06';
    ctx.beginPath(); ctx.moveTo(b.r * 0.5, -b.r * 0.1); ctx.lineTo(b.r * 1.1, b.r * 0.1); ctx.lineTo(b.r * 0.6, b.r * 0.35); ctx.closePath(); ctx.fill();
    // burning eyes
    ctx.fillStyle = flash ? '#fff' : `rgba(255,90,40,${gl})`;
    ctx.beginPath(); ctx.arc(b.r * 0.5, -b.r * 0.35, 2.6, 0, TAU); ctx.arc(b.r * 0.7, -b.r * 0.2, 2.2, 0, TAU); ctx.fill();
    // a clawed arm
    ctx.strokeStyle = fur; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.r * 0.2, b.r * 0.2); ctx.lineTo(b.r * 1.5, b.r * 0.6); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#cdd2dc'; ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.r * 1.5, b.r * 0.6); ctx.lineTo(b.r * 1.95, b.r * 0.6 + i * 5); ctx.stroke(); }
  } else if (b.phase === 3) {
    // The First Beast unleashed — a towering many-eyed horror of fur and claw.
    const fur = flash ? '#fff' : stag ? '#9aa0ff' : '#2a180c';
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, 4, b.r * 1.5, b.r * 1.7, 0, 0, TAU); ctx.fill();
    // matted fur ridges
    ctx.strokeStyle = flash ? '#fff' : '#1a0e06'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + t * 0.3;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * b.r * 1.2, Math.sin(a) * b.r * 1.2, Math.cos(a) * b.r * 1.9, Math.sin(a) * b.r * 1.9);
      ctx.stroke();
    }
    // gaping maw
    ctx.fillStyle = flash ? '#fff' : '#0a0404'; ctx.beginPath(); ctx.arc(b.r * 0.4, 0, b.r * 0.7, 0, TAU); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#5a0a0a';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * b.r * 0.2 + b.r * 0.4, Math.sin(a) * b.r * 0.2); ctx.lineTo(Math.cos(a) * b.r * 0.75 + b.r * 0.4, Math.sin(a) * b.r * 0.75); ctx.lineWidth = 2; ctx.stroke(); }
    // many burning eyes
    ctx.fillStyle = flash ? '#fff' : `rgba(255,70,40,${gl})`;
    for (let i = 0; i < 7; i++) {
      const ang = i * (TAU / 7) + t * 0.4;
      const ex = Math.cos(ang) * b.r * 0.9, ey = Math.sin(ang) * b.r * 0.9 - b.r * 0.3;
      ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, TAU); ctx.fill();
    }
    // great reaching claws
    ctx.strokeStyle = flash ? '#fff' : '#cdd2dc'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath(); ctx.moveTo(b.r * 0.2, s * b.r * 0.4); ctx.lineTo(b.r * 2.0, s * b.r * 0.9); ctx.stroke();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.r * 2.0, s * b.r * 0.9); ctx.lineTo(b.r * 2.5, s * b.r * 0.9 + i * 6); ctx.stroke(); }
    }
  } else {
    // Phase IV — the True Beast: a colossal abyssal horror crowned with a ring
    // of burning eyes, wreathed in drifting void, with enormous reaching claws.
    // The ultimate form of Elias, the kingdom's first and final hunter.
    const fur = flash ? '#fff' : stag ? '#9aa0ff' : '#1a0c14';
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, 6, b.r * 1.7, b.r * 1.95, 0, 0, TAU); ctx.fill();
    // void aura
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ar = b.r * (1.7 + i * 0.35) + Math.sin(t * 2 + i) * 6;
      const g = ctx.createRadialGradient(0, 0, ar * 0.4, 0, 0, ar);
      g.addColorStop(0, 'rgba(160,80,240,0)'); g.addColorStop(1, `rgba(160,80,240,${0.18 - i * 0.05})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ar, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // matted fur ridges
    ctx.strokeStyle = flash ? '#fff' : '#0c0608'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + t * 0.4;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * b.r * 1.3, Math.sin(a) * b.r * 1.3, Math.cos(a) * b.r * 2.2, Math.sin(a) * b.r * 2.2);
      ctx.stroke();
    }
    // gaping void maw
    ctx.fillStyle = flash ? '#fff' : '#050204'; ctx.beginPath(); ctx.arc(b.r * 0.45, 0, b.r * 0.85, 0, TAU); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : '#7a0a2a'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * b.r * 0.25 + b.r * 0.45, Math.sin(a) * b.r * 0.25); ctx.lineTo(Math.cos(a) * b.r * 0.9 + b.r * 0.45, Math.sin(a) * b.r * 0.9); ctx.stroke(); }
    // crown of burning eyes
    ctx.fillStyle = flash ? '#fff' : `rgba(255,60,40,${gl})`;
    for (let i = 0; i < 11; i++) {
      const ang = i * (TAU / 11) + t * 0.5;
      const ex = Math.cos(ang) * b.r * 1.05, ey = Math.sin(ang) * b.r * 1.05 - b.r * 0.35;
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = flash ? '#fff' : `rgba(255,160,90,${gl * 0.8})`;
    ctx.beginPath(); ctx.arc(b.r * 0.55, -b.r * 0.35, 3.4, 0, TAU); ctx.fill();
    // enormous reaching claws
    ctx.strokeStyle = flash ? '#fff' : '#e0dcea'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath(); ctx.moveTo(b.r * 0.2, s * b.r * 0.5); ctx.lineTo(b.r * 2.4, s * b.r * 1.1); ctx.stroke();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.r * 2.4, s * b.r * 1.1); ctx.lineTo(b.r * 3.0, s * b.r * 1.1 + i * 8); ctx.stroke(); }
    }
  }
  ctx.restore();
}

// ---- Final boss defeated -> begin the ending ----
export function onDefeated(game, b) {
  if (b) { game._burst(b.x, b.y, '#e0d0a0', 80, 360); game.player.weaponLvl += 3; }
  game.boss = null;
  game.defeatedBosses.add('final');
  game._runActive = false;
  game.speedrunFinalMs = Math.round(game.speedrunMs || 0);
  game.gameCompleted = true;
  try { localStorage.setItem('hunt_completed_v1', '1'); } catch (e) {}
  game.hooks.onRunComplete && game.hooks.onRunComplete({ deaths: game.runDeaths || 0, timeMs: game.speedrunFinalMs, ngPlus: !!game.ngPlus });
  game.hooks.onBossEnd && game.hooks.onBossEnd();
  game.state = 'ending';
  game.ending = { t: 0, phase: 0, fired: false };
  game.sound.victory();
  game.sound.death();
  game._showMsg('Elias, the First Beast, falls silent at last.', 3200);
  game.hooks.onState && game.hooks.onState('ending');
  game._pushHud();
}

// ---- Return the Hunter to the Sanctuary to keep exploring ----
export function finishEnding(game) {
  const p = game.player;
  p.x = 750; p.y = 5120;            // Sanctuary Shrine
  p.hp = p.maxHp; p.stamina = p.maxStamina;
  p.invuln = 2; p.dodge = null; p.swing = null; p.visceraling = null;
  p.locked = null; p.staggered = 0; p.recovering = 0; p.healAnim = 0;
  game.boss = null;
  game.projectiles = []; game.particles = []; game.shockwaves = []; game.damageNumbers = []; game.pools = [];
  game.state = 'playing';
  game.ending = null;
  game.camera.x = p.x - game.viewW / 2; game.camera.y = p.y - game.viewH / 2;
  game.hooks.onEnding && game.hooks.onEnding(false);
  game.hooks.onState && game.hooks.onState('playing');
  game._pushHud();
  game._showMsg('You return to the Sanctuary. The Hunt goes on.', 3000);
}