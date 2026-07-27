// HuntGamePatches.js — gameplay balance & QoL overrides applied to the
// HuntGame engine class via prototype extension. HuntGame.js is too large to
// edit in place, so targeted method overrides live here and are imported for
// their side effect (prototype mutation) before the engine is instantiated.
//
// Covers: Hunter's Instinct (per-frame speed sync), reworked Molotov throwing
// (ballistic, lands where you aim + enemy-contact detonation + richer blast),
// Molotov chest rewards, and integer-only essence gains from chests/pickups.

import HuntGame from './HuntGame.js';
import * as Souls from './Souls.js';
import * as NpcSys from './NpcSystem.js';
import * as EnemySys from './EnemySystem.js';
import * as Endgame from './Endgame.js';
import * as Underworld from './Underworld.js';
import { recomputeStats } from './Charms.js';
import * as MapSystem from './MapSystem.js';
import * as Save from './SaveSystem.js';
import * as WorldEvents from './WorldEvents.js';
import * as EnvDressing from './EnvDressing.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

// ---- Hunter's Instinct: keep movement speed synced every frame so the +10%
// bonus is active the instant the Soul is unlocked (mid-run, no level-up needed).
// _updateAtmosphere runs at the top of every frame before _updatePlayer. ----
HuntGame.prototype._updateAtmosphere = function (dt) {
  if (this.player) {
    this.player.speed = 165 * Souls.speedMult(this);
    // Shortcut gates: detect proximity from the "open" side so interact() can
    // swing them wide. Each opens only from one side, becoming a two-way shortcut.
    const p = this.player;
    p.nearShortcutGate = null;
    if (this.openGates) {
      if (!this.openGates.has('sanctuary_library_gate') && p.x > 1524 && p.x < 1620 && p.y > 5040 && p.y < 5140) p.nearShortcutGate = 'sanctuary_library_gate';
      else if (!this.openGates.has('vestibule_shortcut') && p.x > 4784 && p.x < 4880 && p.y > 5780 && p.y < 5880) p.nearShortcutGate = 'vestibule_shortcut';
    }
    // The Forgotten Northwest's sealed iron gate — opened only with the Forgotten Gate Key.
    p.nearSealedGate = null;
    if (this.openGates && !this.openGates.has('forgotten_gate') && p.x > 636 && p.x < 744 && p.y > 384 && p.y < 460) p.nearSealedGate = 'forgotten_gate';
  }
  for (const r of this.rainDrops) {
    r.y += r.sp * dt; r.x -= r.sp * 0.25 * dt;
    if (r.y > this.viewH + 20) { r.y = -20; r.x = rand(-200, this.viewW + 200); }
  }
  for (const f of this.fogPuffs) {
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.x < -f.r) f.x = this.viewW + f.r;
    if (f.x > this.viewW + f.r) f.x = -f.r;
    if (f.y < -f.r) f.y = this.viewH + f.r;
    if (f.y > this.viewH + f.r) f.y = -f.r;
  }
  if (this.camera.shake > 0) this.camera.shake = Math.max(0, this.camera.shake - dt * 30);
};

// ---- Molotov throw: ballistic solve so the bottle lands exactly where the
// hunter is aiming (clamped to a sensible range), with a predictable arc. ----
HuntGame.prototype.throwMolotov = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  const p = this.player;
  if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0.15) return;
  if (p.molotovs <= 0) { this._showMsg('No molotovs remain.', 1000); return; }
  p.molotovs--;
  const a = p.aimAngle;
  const ux = Math.cos(a), uy = Math.sin(a);
  const lx = p.x + ux * 14, ly = p.y + uy * 14;
  const d = clamp(Math.hypot(this.mouse.worldX - p.x, this.mouse.worldY - p.y), 70, 380);
  const landX = p.x + ux * d, landY = p.y + uy * d;
  const G = 320, T = 0.55;           // G matches the projectile-update gravity
  const vx = (landX - lx) / T;
  const vy = (landY - ly) / T - 0.5 * G * T;
  this.projectiles.push({ molotov: true, x: lx, y: ly, vx, vy, g: G, life: T, r: 5, fromPlayer: true, color: '#e07020' });
  this.sound.shot();
  this.camera.shake = Math.max(this.camera.shake, 2);
  this._pushHud();
};

// ---- Molotov detonation: layered fire, an expanding shockwave ring, heavier
// shake, and a dedicated explosion sound. ----
HuntGame.prototype._explodeMolotov = function (pr) {
  const radius = 100 * NpcSys.molotovRadiusMult(this);
  const dmg = (60 + this.player.skl * 2) * NpcSys.molotovDmgMult(this);
  this._burst(pr.x, pr.y, '#e07020', 30, 260);
  this._burst(pr.x, pr.y, '#ffb050', 22, 200);
  for (let i = 0; i < 22; i++) {
    const fa = rand(0, TAU), sp = rand(40, 220);
    this.particles.push({ x: pr.x, y: pr.y, vx: Math.cos(fa) * sp, vy: Math.sin(fa) * sp - rand(40, 160), life: rand(0.4, 0.95), max: 0.95, r: rand(2, 5), color: i % 2 ? '#ff8a30' : '#ffd060' });
  }
  this.shockwaves.push({ x: pr.x, y: pr.y, r: 8, speed: 440, maxR: radius * 1.3, dmg: 0, color: '#e07020', hit: true, visual: true });
  this.camera.shake = Math.max(this.camera.shake, 11);
  this.sound.explosion && this.sound.explosion();
  const targets = [...this.enemies.filter(e => e.alive), ...(this.boss && this.boss.alive ? [this.boss] : [])];
  for (const e of targets) {
    const d = Math.hypot(e.x - pr.x, e.y - pr.y);
    if (d < radius + e.r) { const fall = 1 - d / (radius + e.r); this._damageEnemy(e, dmg * (0.5 + 0.5 * fall), 140); }
  }
};

// ---- Projectile update: molotovs now also detonate on direct enemy/boss
// contact (so a well-aimed throw strikes a foe mid-arc), using per-shot gravity. ----
HuntGame.prototype._updateProjectiles = function (dt) {
  const p = this.player;
  for (const pr of this.projectiles) {
    if (pr.molotov) {
      pr.vy += (pr.g || 320) * dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.life -= dt;
      let hit = pr.life <= 0;
      if (!hit) {
        for (const e of this.enemies) { if (e.alive && dist2(pr.x, pr.y, e.x, e.y) < (e.r + pr.r) ** 2) { hit = true; break; } }
        if (!hit && this.boss && this.boss.alive && dist2(pr.x, pr.y, this.boss.x, this.boss.y) < (this.boss.r + pr.r) ** 2) hit = true;
      }
      if (!hit) for (const w of this.world.walls) { if (w.gate && this.openGates.has(w.gate)) continue; if (pr.x > w.x && pr.x < w.x + w.w && pr.y > w.y && pr.y < w.y + w.h) { hit = true; break; } }
      if (hit) { this._explodeMolotov(pr); pr.life = 0; }
      continue;
    }
    pr.life -= dt;
    if (pr.homing && !pr.fromPlayer) {
      const a = Math.atan2(p.y - pr.y, p.x - pr.x);
      const cur = Math.atan2(pr.vy, pr.vx);
      const na = cur + clamp(angDiff(cur, a), -1.5 * dt, 1.5 * dt);
      const sp = Math.hypot(pr.vx, pr.vy);
      pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (pr.fromPlayer) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (dist2(pr.x, pr.y, e.x, e.y) < (e.r + pr.r) ** 2) {
          if (e.attackPhase === 'windup' && !(e.staggerImmune > 0)) {
            e.staggered = 2.2; e.state = 'attack'; e.attackPhase = null;
            this.sound.parry(); this.camera.shake = Math.max(this.camera.shake, 6);
            this._burst(e.x, e.y, '#ffd27a', 14, 160);
          } else { this._damageEnemy(e, pr.dmg, 40); }
          pr.life = 0; break;
        }
      }
      if (this.boss && this.boss.alive && dist2(pr.x, pr.y, this.boss.x, this.boss.y) < (this.boss.r + pr.r) ** 2) {
        if (this.boss.attackPhase === 'windup' && this.boss.parryable && !(this.boss.staggerImmune > 0)) {
          this.boss.staggered = 2.5; this.boss.parryCount = (this.boss.parryCount || 0) + 1;
          this.sound.parry();
        } else { this._damageEnemy(this.boss, pr.dmg, 0); }
        pr.life = 0;
      }
    } else {
      if (p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes) && dist2(pr.x, pr.y, p.x, p.y) < (p.r + pr.r) ** 2) {
        this._hurtPlayer(pr.dmg, pr.x, pr.y); pr.life = 0;
      }
    }
    for (const w of this.world.walls) {
      if (pr.x > w.x && pr.x < w.x + w.w && pr.y > w.y && pr.y < w.y + w.h) { pr.life = 0; this._burst(pr.x, pr.y, pr.color || '#888', 5, 80); break; }
    }
  }
  this.projectiles = this.projectiles.filter(pr => pr.life > 0);
};

// ---- Chests: a new 'molotovs' reward type, and essence rounded to an integer. ----
HuntGame.prototype._openChest = function (c) {
  if (c.opened) return;
  c.opened = true;
  this.sound.openChest();
  const p = this.player;
  if (c.type === 'essence') { const amt = c.ess || 250; const gain = Math.round(amt * NpcSys.essenceMult(this)); p.essence += gain; this._showMsg(`Chest — ${gain} Essence`, 1600); this.sound.essence(); }
  else if (c.type === 'vials') { p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + 5); this._showMsg("Chest — 5 Hunter's Draught", 1600); this.sound.heal(); }
  else if (c.type === 'bullets') { p.bullets = Math.min(p.maxBullets, p.bullets + 10); this._showMsg('Chest — 10 Quicksilver Bullets', 1600); this.sound.shot(); }
  else if (c.type === 'molotovs') { p.molotovs = Math.min(p.maxMolotovs, p.molotovs + 3); this._showMsg('Chest — 3 Molotovs', 1600); this.sound.shot(); }
  else if (c.type === 'key') {
    if (!p.keys) p.keys = new Set();
    p.keys.add(c.keyId || 'forgotten_gate_key');
    Save.saveGame(this);
    this.paused = true; this.pauseReason = 'keyReward';
    this._keyReward = { name: 'Forgotten Gate Key', desc: 'Unlocks the sealed gate in the northwest.' };
    this.hooks.onKeyReward && this.hooks.onKeyReward(this._keyReward);
  }
  else if (c.type === 'fragment') {
    const f = this.fragments.find(ff => ff.id === c.fragmentId);
    if (f && !f.collected) { f.x = c.x; f.y = c.y; this._collectFragment(f); }
    else this._showMsg('The chest is empty.', 1200);
  }
  else if (c.type === 'shards') {
    const amt = c.amt || 8;
    p.shards += amt;
    this._showMsg('Chest — ' + amt + ' Bloodstone Shards', 1800);
    this.sound.shard();
  }
  else { p.shards += 2; this._showMsg('Chest — 2 Bloodstone Shards', 1800); this.sound.shard(); }
  this.sound.treasure();
  this._burst(c.x, c.y, c.type === 'weapon' ? '#ffd27a' : c.type === 'molotovs' ? '#e07020' : '#c9a86a', 20, 180);
  this._pushHud();
  };

// ---- Chest rendering: molotov chests get a fiery orange accent. ----
HuntGame.prototype._drawChests = function (ctx) {
  for (const c of this.world.chests) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 8, 16, 6, 0, 0, TAU); ctx.fill();
    const accent = c.type === 'weapon' ? '#d4a040' : c.type === 'essence' ? '#a06ad6' : c.type === 'vials' ? '#c04040' : c.type === 'molotovs' ? '#e07020' : c.type === 'key' ? '#c9a86a' : c.type === 'fragment' ? '#caa238' : c.type === 'shards' ? '#a06ad6' : '#d4b040';
    ctx.fillStyle = c.opened ? '#15100a' : '#2a1c12';
    ctx.fillRect(-14, -8, 28, 16);
    if (c.opened) {
      ctx.fillStyle = '#1a120a';
      ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-16, -16); ctx.lineTo(16, -16); ctx.lineTo(14, -8); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(-14, -14, 28, 6);
      ctx.fillStyle = accent; ctx.fillRect(-3, -12, 6, 5);
    }
    ctx.strokeStyle = c.opened ? '#3a2a1a' : accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-10, 8); ctx.moveTo(10, -14); ctx.lineTo(10, 8); ctx.stroke();
    if (!c.opened && this.player.nearChest === c) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 22 + Math.sin(this.runtime * 4) * 2, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
};

// ---- Essence pickups: round to an integer so XP never shows decimals. ----
HuntGame.prototype._updatePickups = function (dt) {
  const p = this.player;
  for (const pk of this.pickups) {
    pk.t += dt;
    const a = Math.atan2(p.y - pk.y, p.x - pk.x);
    const dd = dist2(p.x, p.y, pk.x, pk.y);
    if (dd < 260 * 260) { pk.x += Math.cos(a) * 180 * dt; pk.y += Math.sin(a) * 180 * dt; }
    if (dd < 20 * 20) {
      if (pk.vial) { p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + 1); this.sound.essence(); }
      else if (pk.bullet) { p.bullets = Math.min(p.maxBullets, p.bullets + 2); this.sound.shot(); }
      else if (pk.molotov) { p.molotovs = Math.min(p.maxMolotovs, p.molotovs + 1); this.sound.shot(); }
      else { p.essence += Math.round(pk.ess * NpcSys.essenceMult(this)); this.sound.essence(); }
      pk.collected = true;
      this._pushHud();
    }
  }
  this.pickups = this.pickups.filter(pk => !pk.collected);
};

// ---- Father Gascoigne → Father Lucian Veyr: rename the boss in-fight (the
// engine's _spawnBoss hardcodes the old name) and translate any engine
// message that still uses it. ----
const _origSpawnBoss = HuntGame.prototype._spawnBoss;
HuntGame.prototype._spawnBoss = function (type) {
  _origSpawnBoss.call(this, type);
  if (this.boss && this.boss.type === 'gascoigne') this.boss.name = 'Father Lucian Veyr';
  // Mire Mother: +30% damage over her current damage (health and moveset
  // unchanged). Compounds on her prior +30% balance pass.
  if (this.boss && this.boss.type === 'mire') this.boss.dmg = Math.round(this.boss.dmg * 1.3 * 1.3);
  // Nightmare boss balance: +30% damage (health and moveset unchanged).
  if (this.boss && this.boss.type === 'nightmare') this.boss.dmg = Math.round(this.boss.dmg * 1.3);
  // Hollow King balance: +40% damage (health and moveset unchanged).
  if (this.boss && this.boss.type === 'hollow_king') this.boss.dmg = Math.round(this.boss.dmg * 1.4);
  // The Archivist balance: +40% damage (health and moveset unchanged).
  if (this.boss && this.boss.type === 'archivist') this.boss.dmg = Math.round(this.boss.dmg * 1.4);
};
const _origShowMsg = HuntGame.prototype._showMsg;
HuntGame.prototype._showMsg = function (text, dur) {
  if (typeof text === 'string') text = text.replace(/Father Gascoigne/g, 'Father Lucian Veyr').replace(/\bGascoigne\b/g, 'Lucian Veyr');
  return _origShowMsg.call(this, text, dur);
};

// ---- Vitality rebalance: each Vitality level grants 30% less max health than
// the engine's levelUp applies (14 → 9.8 per level). Recompute maxHp after a
// successful level-up and clamp hp to the reduced ceiling. (Applied here as a
// prototype override because HuntGame.js is too large to edit in place.) ----
const _origLevelUp = HuntGame.prototype.levelUp;
HuntGame.prototype.levelUp = function (stat) {
  const result = _origLevelUp.call(this, stat);
  if (result) {
    const p = this.player;
    if (p) {
      p.maxHp = 100 + Math.round((p.vit - 10) * 9.8) + (p.hpBonus || 0);
      if (p.hp > p.maxHp) p.hp = p.maxHp;
      this._pushHud && this._pushHud();
    }
  }
  return result;
};

// ---- Heavy attack: the weapon-upgrade damage contribution is reduced 30%
// (3 → 2.1 per weapon level). The full releaseHeavy is reproduced here with the
// reduced coefficient (HuntGame.js is too large to edit in place). ----
HuntGame.prototype.releaseHeavy = function () {
  const p = this.player;
  if (!p.charging) return;
  p.charging = 0;
  if (p.stamina < 8) return;
  const charged = p.chargeTime > 0.55;
  p.stamina -= (charged ? 13 : 8) * (p.passives.has('steady_grip') ? 0.85 : 1);
  p.staminaRegenDelay = 0.45;
  const sword = p.mode === 'sword';
  const reach = (sword ? 50 : 66) * NpcSys.reachMult(this);
  const arc = sword ? 1.5 : 2.0;
  let dmg = ((sword ? 22 : 18) + p.str * 1.6 + p.weaponLvl * 2.1) * NpcSys.dmgMult(this);
  if (charged) dmg *= 1.8;
  p.swing = { t: 0, dur: sword ? 0.42 : 0.5, type: 'heavy', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach, arc, dmg, knock: sword ? 140 : 200, charged, dir: 1 };
  p.recovering = p.swing.dur * 0.8 * Souls.attackSpeedMult(this);
  this.sound.heavySwing();
  if (charged && Souls.has(this, 'earthshaker')) Souls.shockwaveStrike(this, p);
};

// ---- New Game+ rebalance: in NG+ all enemies deal 20% more damage and have
// 30% more health than a normal playthrough, for a noticeably harder second
// cycle. Normal is unchanged (scales = 1). Both regular enemies (scaled in
// _applyDifficulty) and bosses (which read these scales at spawn in _spawnBoss)
// are affected consistently. (HuntGame.js is too large to edit in place, so
// _setupDifficulty is overridden here.) ----
HuntGame.prototype._setupDifficulty = function () {
  this._hpScale = this.ngPlus ? 1.30 : 1;
  this._dmgScale = this.ngPlus ? 1.20 : 1;
  this._xpScale = this.ngPlus ? 1.35 : 1;
};

// ---- Firearm: with Arcane removed, bullets scale with Skill + weapon level. ----
HuntGame.prototype.fire = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  const p = this.player;
  if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0.15) return;
  if (p.firing > 0 || p.stamina < 5 || p.bullets <= 0) return;
  p.stamina -= 5; p.staminaRegenDelay = 0.3;
  p.bullets -= 1;
  p.firing = 0.25;
  const a = p.aimAngle;
  const sp = 620;
  this.projectiles.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, r: 4, fromPlayer: true, dmg: (8 + p.weaponLvl * 1.05 + p.skl * 0.6) * NpcSys.bulletDmgMult(this) });
  this.sound.shot();
  this.camera.shake = Math.max(this.camera.shake, 3);
  EnemySys.alertBySound(this);
};

// ---- Combat balance: the standard light attack is the Hunter's primary damage
// tool — quicker, cheaper, and harder-hitting than before, so it's what you
// lean on. The Transformation Attack (F) becomes a committed, high-impact
// strike: wide reach and heavy knockback, but a long recovery and steep
// stamina cost so it can't be spammed. Best saved for crowds, stagger punishes,
// or repositioning — the Hunter mixes both rather than mashing transform. ----
HuntGame.prototype.lightAttack = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  const p = this.player;
  if (p.dodge || p.visceraling || p.staggered > 0) return;
  if (p.locked && p.locked.staggered > 0 && dist2(p.x, p.y, p.locked.x, p.locked.y) < 50 * 50) return this._visceral(p.locked);
  const staggered = this.enemies.find(e => e.alive && e.staggered > 0 && dist2(p.x, p.y, e.x, e.y) < 52 * 52);
  if (staggered) return this._visceral(staggered);
  if (p.recovering > 0) return;
  if (p.stamina < 5) return;
  p.stamina -= 5; p.staminaRegenDelay = 0.3;
  p.comboCount = p.comboTimer > 0 ? (p.comboCount % 3) + 1 : 1;
  p.comboTimer = 0.8;
  const sword = p.mode === 'sword';
  const reach = (sword ? 48 : 60) * NpcSys.reachMult(this);
  const arc = sword ? 1.15 : 1.7;
  const dmg = ((sword ? 17 : 14) + p.str * 1.3 + p.weaponLvl * 1.4 + (p.comboCount === 3 ? p.skl * 0.9 : 0)) * NpcSys.dmgMult(this);
  p.swing = { t: 0, dur: sword ? 0.24 : 0.29, type: 'light', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach, arc, dmg, knock: sword ? 64 : 96, charged: false, dir: (p.comboCount % 2 === 0) ? -1 : 1 };
  p.recovering = p.swing.dur * 0.6 * Souls.attackSpeedMult(this);
  this.sound.swing();
};

HuntGame.prototype.transform = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  const p = this.player;
  if (p.staggered > 0 || p.visceraling) return;
  p.mode = p.mode === 'sword' ? 'scythe' : 'sword';
  // A deliberate, high-impact strike: wide reach and heavy knockback, but a
  // long recovery and steep stamina cost keep it situational.
  if (p.stamina >= 10) {
    p.stamina -= 10; p.staminaRegenDelay = 0.6;
    p.swing = { t: 0, dur: 0.40, type: 'transform', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach: 62 * NpcSys.reachMult(this), arc: 1.95, dmg: (14 + p.str * 1.3 + p.weaponLvl * 1.4) * NpcSys.dmgMult(this), knock: 160, charged: false, dir: 1 };
    p.recovering = 0.55 * Souls.attackSpeedMult(this);
  }
  this.sound.transform();
};

// ---- Healing: Blood Vials → Hunter's Draught (display only; counts unchanged). ----
HuntGame.prototype.useVial = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  const p = this.player;
  if (p.bloodVials <= 0) { this._showMsg('No draughts remain.', 1200); return; }
  if (p.hp >= p.maxHp) { this._showMsg('Health is already full.', 1000); return; }
  if (p.healAnim > 0 || p.visceraling || p.staggered > 0) return;
  p.bloodVials--;
  p.healAnim = 0.7;
  const heal = Math.floor(p.maxHp * 0.35 * NpcSys.healMult(this));
  p.hp = Math.min(p.maxHp, p.hp + heal);
  p.rallyHp = 0; p.rallyTimer = 0;
  this.damageNumbers.push({ x: p.x, y: p.y - 18, v: '+' + heal, t: 0, crit: false, heal: true });
  this.sound.heal();
  this._burst(p.x, p.y, '#b03040', 14, 100);
  this._pushHud();
};

// ---- Lore notes: the 16-note Insight reward used to grant Arcane; with Arcane
// removed it now grants Endurance (and refreshes max stamina). ----
HuntGame.prototype.interact = function () {
  const p = this.player;
  if (this.paused) return;
  if (!this._memory && Endgame.tryInteract(this)) return;
  if (Underworld.tryInteract(this)) return;
  if (p.nearSealedGate) {
    if (p.keys && p.keys.has('forgotten_gate_key')) { this._openGate(p.nearSealedGate); this.sound.shortcutUnlock(); this._showMsg('The forgotten gate grinds open. A lost corner of the kingdom lies beyond.', 2800); Save.saveGame(this); }
    else { this._showMsg('A sealed iron gate bars the way. It will not yield without a forgotten key.', 2400); }
    return;
  }
  if (p.nearShortcutGate) { this._openGate(p.nearShortcutGate); this.sound.shortcutUnlock(); this._showMsg('The great gate swings wide. A shortcut is forged.', 2200); return; }
  if (p.nearNpc) { NpcSys.talkNpc(this, p.nearNpc); return; }
  if (p.nearWorkshop) { this.openWorkshop(); return; }
  if (p.nearLantern) {
    const hubLantern = p.nearLanternName === "The Hunter's Nightmare";
    const mentor = this.npcs && this.npcs.find(n => n.def.mentor);
    if (hubLantern && !this._hubIntroDone && mentor && mentor.talkedStage >= 0) {
      this._hubIntroDone = true;
      const dest = this.visitedLanterns.get('440,1380') || { x: 440, y: 1380 };
      this.sound.lantern();
      this.warpTo(dest.x, dest.y + 30, 'The lantern bears you out into the Hunt.');
      return;
    }
    this.promptLanternRest(); this.sound.lantern(); return;
  }
  if (p.nearFragment) { this._collectFragment(p.nearFragment); return; }
  if (p.nearChest) { this._openChest(p.nearChest); return; }
  if (p.nearMapTable) { this.openMapTable(); return; }
  if (p.nearNote) {
    this.hooks.onLore && this.hooks.onLore(p.nearNote.title, p.nearNote.text);
    if (!this.readNotes) this.readNotes = new Set();
    const k = p.nearNote.title;
    if (!this.readNotes.has(k)) {
      this.readNotes.add(k);
      const n = this.readNotes.size, rw = (40 + n * 15) * 4;
      p.essence += rw; this.sound.discover();
      this._showMsg('Lore recorded — +' + rw + ' essence', 1500);
      if (n === 8) { p.skl += 1; this._showMsg('Insight grows — Skill +1', 2200); }
      else if (n === 16) { p.end += 1; recomputeStats(this); p.stamina = p.maxStamina; this._showMsg('Insight grows — Endurance +1', 2200); }
      else if (n === 24) { p.vit += 1; p.maxHp = 100 + Math.round((p.vit - 10) * 9.8) + (p.hpBonus || 0); p.hp += 10; if (p.hp > p.maxHp) p.hp = p.maxHp; this._showMsg('Insight grows — Vitality +1', 2200); }
      this._pushHud();
    }
  }
};

// ---- Begin a completely fresh playthrough: resets the player and all world
// progression to first-time state (map hidden, no lanterns/bosses/quests), and
// clears persisted run + map data so a reload can't restore the old world.
// Used by "Awaken the Hunt" so a brand-new game is truly new (not NG+, not a
// continuation). ----
HuntGame.prototype.beginFreshGame = function () {
  const p = this.player;
  Object.assign(p, {
    x: 3450, y: 5090, r: 13, speed: 165,
    hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, staminaRegenDelay: 0, staminaRegen: 34,
    facing: 0, aimAngle: 0,
    level: 1, essence: 0, needed: 120,
    vit: 10, end: 10, str: 10, skl: 10, arc: 10,
    mode: 'sword', comboCount: 0, comboTimer: 0,
    swing: null, transformQueued: false,
    dodge: null, invuln: 0, recovering: 0, charging: 0, chargeTime: 0, firing: 0,
    staggered: 0, visceraling: null, locked: null, hurtFlash: 0, bloodlust: 0, footstep: 0,
    bloodVials: 5, maxBloodVials: 15, bullets: 20, maxBullets: 20, weaponLvl: 0, healAnim: 0,
    nearLantern: false, nearNote: null, nearChest: null, hpBonus: 0, staminaBonus: 0,
    molotovs: 5, maxMolotovs: 10, shards: 0,
    nearNpc: null, rallyHp: 0, rallyTimer: 0,
    keys: new Set(),
  });
  p.charms = new Set(); p.passives = new Set(); p.souls = new Set(); p.fury = 0; p.equipped = [];
  p.outfits = new Set(['hunter_garb']); p.skins = new Set(['default']); p.skin = 'default'; p.outfit = 'hunter_garb';
  recomputeStats(this);

  // --- world progression ---
  this.defeatedBosses = new Set();
  this.encounteredBosses = new Set();
  this.openGates = new Set();
  this.collectedFragments = new Set();
  this.discoveredRegions = new Set(['hub']);
  this.revealed = new Set();
  this._enteredAreas = new Set(['hub']);
  this.visitedLanterns = new Map();
  this.readNotes = new Set();
  this.boss = null;
  this.finalGateOpened = false; this.eliasFinalTalked = false;
  this._allSlain = false; this._hubIntroDone = false; this._finalRevealedOnce = false;
  this.sealBroken = false; this.trueEnding = false; this._celestialRevealedOnce = false; this._celestialDefeated = false;
  this.ngPlus = false; this.runDeaths = 0;
  this.deathMarker = null;
  this.speedrunMs = 0; this.speedrunFinalMs = 0; this._runActive = true;
  this._notifiedUpgradeTier = -1; this._levelUpNotified = false;
  this._memory = false; this._mem = null; this._memFade = 0; this._memFadeDir = 0;
  this.paused = false; this.pauseReason = null; this.mapOpen = false; this.inventoryOpen = false; this.questLogOpen = false;
  this.projectiles = []; this.shockwaves = []; this.pools = []; this.particles = [];
  this.pickups = []; this.damageNumbers = []; this.bloodStains = []; this.corpses = [];
  if (this.hubInfo) {
    this.lastLantern = { x: this.hubInfo.lantern.x, y: this.hubInfo.lantern.y };
    this.visitedLanterns.set('440,1380', { x: 440, y: 1380, name: 'The Last Lantern' });
  }

  // --- rebuild enemies, fragments, chests, NPCs, world events ---
  this.enemies = this.world.spawns.map(s => this._spawnEnemy(s.type, s.x, s.y));
  this.fragments = (this.world.fragments || []).map(f => ({ ...f, collected: false }));
  (this.world.chests || []).forEach(c => { c.opened = false; });
  NpcSys.initNpcs(this);
  this.worldEvents = WorldEvents.init(this);

  // --- clear persisted run + map so a reload starts fresh ---
  Save.clearSave();
  MapSystem.saveMap(this);
  MapSystem.pushMapState(this);
  Save.saveGame(this);

  // --- begin ---
  this.state = 'playing';
  this.sound.init();
  this._curArea = 'hub';
  this.sound.setArea('hub', "The Hunter's Nightmare");
  this.camera.x = p.x - this.viewW / 2; this.camera.y = p.y - this.viewH / 2;
  this._setupDifficulty(); this._applyDifficulty();
  this.hooks.onState && this.hooks.onState('playing');
  this._showMsg("The Hunter's Nightmare", 2600);
  this._pushHud();
  NpcSys.pushQuestState(this);
  const elias = this.npcs.find(n => n.def.mentor);
  if (elias) setTimeout(() => { if (this.state === 'playing') NpcSys.talkNpc(this, elias); }, 600);
};

// ---- New Game+ is a reward for finishing the Hunt. The title-screen button is
// already gated behind hasCompleted(), but guard the engine entry point too, so
// NG+ can never begin through any other caller before the game is first cleared.
const _origBeginNewGamePlus = HuntGame.prototype.beginNewGamePlus;
HuntGame.prototype.beginNewGamePlus = function () {
  if (!Save.hasCompleted()) { this._showMsg('New Game+ is earned only by finishing the Hunt.', 2600); return; }
  const r = _origBeginNewGamePlus.call(this);
  if (this.player) this.player.keys = new Set();   // re-earn run-specific keys in NG+
  return r;
};

// ---- Grand Sanctuary map table: open/close the detailed world chart overlay. ----
HuntGame.prototype.openMapTable = function () {
  if (this.state !== 'playing' && this.state !== 'bossActive') return;
  this.paused = true;
  this.pauseReason = 'mapTable';
  this._pushMapState();
  this.hooks.onMapTable && this.hooks.onMapTable(true);
  this.sound.menuOpen();
  this._pushHud();
};
HuntGame.prototype.closeMapTable = function () {
  this.paused = false;
  this.pauseReason = null;
  this.hooks.onMapTable && this.hooks.onMapTable(false);
  this.sound.menuClose();
  this._pushHud();
};

// ---- Charm reward: equip directly into a free slot (no Satchel trip). ----
HuntGame.prototype.equipCharmDirect = function (id) {
  const p = this.player;
  if (!p.charms.has(id) || p.equipped.includes(id)) return;
  if (p.equipped.length >= 3) return;
  p.equipped.push(id);
  recomputeStats(this);
  this.sound.equipCharm();
  this._pushHud();
  Save.saveGame(this);
};

// ---- Charm reward: swap an equipped charm for the newly discovered one. ----
HuntGame.prototype.replaceCharm = function (newId, oldId) {
  const p = this.player;
  if (!p.charms.has(newId) || !p.equipped.includes(oldId)) return;
  p.equipped[p.equipped.indexOf(oldId)] = newId;
  recomputeStats(this);
  this.sound.equipCharm();
  this._pushHud();
  Save.saveGame(this);
};

// ---- Souls-like death bloodstain: a visible world marker where the Hunter
// fell, pulsing with recoverable essence until it is reclaimed or lost. ----
const _origDrawBloodStains = HuntGame.prototype._drawBloodStains;
HuntGame.prototype._drawBloodStains = function (ctx) {
  _origDrawBloodStains.call(this, ctx);
  const dm = this.deathMarker;
  if (!dm) return;
  const t = this.runtime, pulse = 0.5 + Math.sin(t * 3) * 0.5;
  const g = ctx.createRadialGradient(dm.x, dm.y, 4, dm.x, dm.y, 34);
  g.addColorStop(0, `rgba(180,30,30,${0.5 * pulse + 0.2})`); g.addColorStop(0.6, 'rgba(120,10,10,0.3)'); g.addColorStop(1, 'rgba(120,10,10,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dm.x, dm.y, 34, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(60,6,6,0.7)'; ctx.beginPath(); ctx.ellipse(dm.x, dm.y, 14, 8, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.6 + i * 0.33) % 1;
    ctx.globalAlpha = (1 - ph) * 0.7;
    ctx.fillStyle = '#d06ad6';
    ctx.beginPath(); ctx.arc(dm.x + Math.sin(t * 2 + i) * 4, dm.y - ph * 26, 2.4, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// ---- Environment dressing: seeded decorative props + cosmetic breakables.
// Pure visual — adds nothing to collision/progression. Props render via the
// drawEnvDetails hook; breakables shatter on swings, dashes, and enemy/boss
// attacks with material-specific debris + sound and a rare tiny drop. ----
const _origStart = HuntGame.prototype.start;
HuntGame.prototype.start = function () {
  _origStart.call(this);
  if (this.player) this.player.maxBloodVials = 15;   // base Draught capacity (was 20)
  EnvDressing.init(this);
};
const _origUpdate = HuntGame.prototype.update;
HuntGame.prototype.update = function (dt) {
  _origUpdate.call(this, dt);
  // Repeat weapon-upgrade notice: the engine fires the first notice per tier;
  // this adds a fresh notice each time the hunter gathers more materials while
  // already able to upgrade. Syncs to the engine's tier tracker to avoid dupes.
  const p = this.player;
  if (p && p.weaponLvl < 10) {
    const cost = 2 + p.weaponLvl * 2;
    if (p.shards >= cost) {
      if (this._upgradeNotifyTier !== this._notifiedUpgradeTier) {
        this._upgradeNotifyTier = this._notifiedUpgradeTier;
        this._upgradeNotifyShards = p.shards;
      }
      if (p.shards > (this._upgradeNotifyShards || -1)) {
        this._upgradeNotifyShards = p.shards;
        this.hooks.onUpgradeNotice && this.hooks.onUpgradeNotice({ tier: p.weaponLvl });
      }
    } else {
      this._upgradeNotifyShards = -1;
    }
  }
  EnvDressing.update(this, dt);
};
const _origUpdateSwing = HuntGame.prototype._updateSwing;
HuntGame.prototype._updateSwing = function (dt) { _origUpdateSwing.call(this, dt); EnvDressing.checkSwingBreak(this); };
const _origDodge = HuntGame.prototype.dodge;
HuntGame.prototype.dodge = function () { _origDodge.call(this); if (this.player && this.player.dodge) EnvDressing.checkDashBreak(this); };
const _origDrawWalls = HuntGame.prototype._drawWalls;
HuntGame.prototype._drawWalls = function (ctx) { _origDrawWalls.call(this, ctx); EnvDressing.drawWallDetail(this, ctx); };
const _origDrawGround = HuntGame.prototype._drawGround;
HuntGame.prototype._drawGround = function (ctx) { _origDrawGround.call(this, ctx); EnvDressing.drawGroundDetail(this, ctx); };

// ---- Dismiss the Forgotten Gate Key reward screen (mirrors fragment discovery). ----
HuntGame.prototype.dismissKeyReward = function () {
  this._keyReward = null;
  this.paused = false;
  this.pauseReason = null;
  this.hooks.onKeyReward && this.hooks.onKeyReward(null);
  this._pushHud();
};

// ---- Player stagger: rapid hits build a meter; crossing the threshold briefly
// staggers the hunter (blocks attack/dodge/heal/movement) and shows a short
// "Staggered!" notice. A recovery window prevents stun-locking. Mirrors the
// enemy stagger system. (Overrides the engine's _addStagger to add the notice.) ----
HuntGame.prototype._addStagger = function (amt) {
  const p = this.player;
  if (!p || p.staggerImmune > 0 || p.staggered > 0) return;
  p.staggerMeter = (p.staggerMeter || 0) + amt;
  if (p.staggerMeter >= 3) {
    p.staggered = 0.9;
    p.staggerImmune = 3.0;
    p.staggerMeter = 0;
    p.recovering = Math.max(p.recovering || 0, 0.5);
    this.camera.shake = Math.max(this.camera.shake, 6);
    this._burst(p.x, p.y, '#9aa0ff', 12, 120);
    this.sound.hurt && this.sound.hurt();
    this._showMsg('Staggered!', 900);
  }
};

export default HuntGame;