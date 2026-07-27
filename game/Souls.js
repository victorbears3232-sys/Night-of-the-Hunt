// Souls.js — permanent boss-soul progression. Each of the six main bosses grants
// a soul that permanently unlocks a signature ability (always active, no equip).
// Ability hooks are thin helpers the engine calls from its combat flow.

import * as NpcSys from './NpcSystem.js';

const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

export const SOULS = [
  { id: 'bloodbound', boss: 'vicar', name: 'Bloodbound Soul', ability: 'Rally',
    desc: "A portion of recently lost health becomes temporarily recoverable — strike back with melee within a few seconds to claw it back before it fades.",
    icon: '🩸', color: '#b03040' },
  { id: 'predator', boss: 'gascoigne', name: 'Predator Soul', ability: "Hunter's Fury",
    desc: 'Slaying an enemy fills you with fury — attack speed and stamina recovery surge for a few seconds.',
    icon: '🐺', color: '#c0482a' },
  { id: 'nightmare', boss: 'nightmare', name: 'Nightmare Soul', ability: 'Nightmare Awakening',
    desc: 'Below 25% health, desperation sharpens you — damage and stamina surge until you heal or fall.',
    icon: '👁️', color: '#a06ad6' },
  { id: 'earthshaker', boss: 'mire', name: 'Earthshaker Soul', ability: 'Shockwave Strike',
    desc: 'Hold Right Mouse Button (or hold K) to charge a powerful heavy attack; release it to unleash a damaging shockwave that shatters all nearby prey.',
    icon: '🌊', color: '#2a9aa0' },
  { id: 'instinct', boss: 'hollow_king', name: 'Instinct Soul', ability: "Hunter's Instinct",
    desc: 'The Hunt sharpens you — move 10% faster and recover stamina 15% quicker. Always active, no matter your build.',
    icon: '🦅', color: '#d4a850' },
  { id: 'phantom', boss: 'archivist', name: 'Phantom Soul', ability: 'Phantom Dash',
    desc: 'Dodging through prey tears them — a dash deals damage to beasts and Guardians alike, staggering lesser enemies with a phantom slash.',
    icon: '👻', color: '#7ac0e0' },
  { id: 'fortress', boss: 'hollow_castellan', name: "Cavalier's Soul", ability: 'Momentum',
    desc: "A lancer's power is the ride, not the arm — while moving, your attacks carry the warhorse's momentum and deal 20% more damage. Stand still and you are just a man; move and you are the charge.",
    icon: '🐎', color: '#d4a040' },
  { id: 'stoneform', boss: 'cliff_watcher', name: 'Stoneform Soul', ability: 'Stone Skin',
    desc: 'The cliff lives in your bones — you take 15% less damage from all sources. The gargoyle\'s patience is yours now.',
    icon: '🪨', color: '#8a9aa8' },
  { id: 'astral', boss: 'celestial', name: 'Astral Soul', ability: 'Starfall',
    desc: 'Melee strikes call down an astral meteor on the struck foe — a burst of starlight that detonates after a brief fall (with a short cooldown). The sky remembers the Hunter who set it free.',
    icon: '✦', color: '#c0a8ff' },
];

export const SOUL_MAP = Object.fromEntries(SOULS.map(s => [s.id, s]));
export const SOUL_BY_BOSS = Object.fromEntries(SOULS.map(s => [s.boss, s]));

export function has(g, id) { return !!(g.player && g.player.souls && g.player.souls.has(id)); }

// Momentum (Cavalier's Soul) — empowered while the hunter is on the move.
function moving(g) {
  const k = g.keys || {};
  return !!(k['w'] || k['a'] || k['s'] || k['d'] || k['arrowup'] || k['arrowdown'] || k['arrowleft'] || k['arrowright']);
}

// Hunter's Instinct — +10% movement speed, always active once unlocked.
export function speedMult(g) {
  return has(g, 'instinct') ? 1.10 : 1;
}

// Nightmare Awakening — damage multiplier when below 25% HP.
export function dmgMult(g) {
  const p = g.player; if (!p) return 1;
  let m = 1;
  if (has(g, 'fortress') && moving(g)) m *= 1.20;
  if (has(g, 'nightmare') && p.hp < p.maxHp * 0.25) m *= 1.25;
  return m;
}

// Stoneform Soul — flat 15% damage reduction from all sources.
export function hurtMult(g) { return has(g, 'stoneform') ? 0.85 : 1; }

// Hunter's Fury (after a kill) + Nightmare Awakening stamina multiplier.
export function staminaRegenMult(g) {
  const p = g.player; if (!p) return 1;
  let m = 1;
  if (has(g, 'predator') && p.fury > 0) m *= 1.8;
  if (has(g, 'nightmare') && p.hp < p.maxHp * 0.25) m *= 1.5;
  if (has(g, 'instinct')) m *= 1.15;
  return m;
}

// Hunter's Fury — recovery multiplier (<1 = faster attacks).
export function attackSpeedMult(g) {
  const p = g.player; if (!p) return 1;
  let m = 1;
  if (has(g, 'predator') && p.fury > 0) m *= 0.6;
  if (p.equipped && p.equipped.includes('hunters_tempo')) m *= 0.85;
  return m;
}

// Blood Feast — heal a sliver on melee hit.
export function onMeleeHit(g, e, dmg) {
  const p = g.player;
  // Bloodbound Soul — rally: recover a portion of recently lost health.
  if (has(g, 'bloodbound') && p) {
    if (p.rallyHp > 0 && p.rallyTimer > 0) {
      const recover = Math.min(p.rallyHp, Math.max(2, dmg * 0.3));
      p.hp = Math.min(p.maxHp, p.hp + recover);
      p.rallyHp = Math.max(0, p.rallyHp - recover);
    }
  }
  // Astral Soul — Starfall: call down an astral meteor on the struck foe.
  if (has(g, 'astral') && e) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - (g._astralLast || 0) > 1100) {
      g._astralLast = now;
      g.shockwaves.push({ x: e.x, y: e.y, r: 8, speed: 360, maxR: 140, dmg: Math.max(8, Math.round(dmg * 0.8)), color: '#c0a8ff', hit: false });
      g._burst(e.x, e.y, '#c0a8ff', 16, 180);
      for (let i = 0; i < 8; i++) { g.particles.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - 80, vx: (Math.random() - 0.5) * 40, vy: 220, life: 0.4, max: 0.4, r: 2.4, color: '#e8d8ff', spark: true }); }
      g.camera.shake = Math.max(g.camera.shake, 4);
    }
  }
}

// Hunter's Fury — trigger the burst on a kill.
export function onKill(g) {
  if (!has(g, 'predator')) return;
  g.player.fury = 4.5;
}

// Base behavior — a hit from a lesser foe while charging a heavy interrupts the
// wind-up. (The old Iron Soul once granted immunity to this; that Soul has been
// reworked into Hunter's Instinct, which no longer depends on charge attacks.)
export function onHurt(g, attacker) {
  if (!attacker) return;
  const p = g.player;
  if (p.charging && attacker.maxHp < 120) {
    p.charging = 0;
    p.recovering = Math.max(p.recovering || 0, 0.18);
  }
}

// Shockwave Strike — AoE burst around the hunter on a charged heavy release.
export function shockwaveStrike(g, p) {
  const radius = 120;
  const sword = p.mode === 'sword';
  const dmg = ((sword ? 22 : 18) + p.str * 1.4 + p.weaponLvl * 2) * NpcSys.dmgMult(g) * dmgMult(g);
  g._burst(p.x, p.y, '#2a9aa0', 28, 220);
  g.camera.shake = Math.max(g.camera.shake, 9);
  g.sound.heavySwing && g.sound.heavySwing();
  const targets = [...g.enemies.filter(e => e.alive), ...((g.boss && g.boss.alive) ? [g.boss] : [])];
  for (const e of targets) {
    if (dist2(p.x, p.y, e.x, e.y) < (radius + e.r) ** 2) g._damageEnemy(e, dmg, 130, false, true, false);
  }
  g.shockwaves.push({ x: p.x, y: p.y, r: 10, speed: 360, maxR: radius, dmg: 0, color: '#2a9aa0', hit: true, visual: true });
}

// Phantom Dash — tear through prey (and Guardians) while dodging. Each dash
// hits every enemy and boss it passes through once, dealing damage with a blood
// spray, a cyan phantom slash arc, sparks, and a distinct impact chime.
export function phantomDash(g, p) {
  if (!p.dodge) return;
  if (!p.dodge._phHit) p.dodge._phHit = new Set();
  const targets = [...g.enemies.filter(e => e.alive), ...((g.boss && g.boss.alive) ? [g.boss] : [])];
  for (const e of targets) {
    if (p.dodge._phHit.has(e)) continue;
    if (dist2(p.x, p.y, e.x, e.y) < (p.r + e.r + 8) ** 2) {
      p.dodge._phHit.add(e);
      const isBoss = e === g.boss;
      const dmg = (12 + p.skl * 1.5) * NpcSys.dmgMult(g) * dmgMult(g);
      const fa = Math.atan2(e.y - p.y, e.x - p.x);
      g._damageEnemy(e, dmg, 60, false, false, false);
      if (!isBoss && e.maxHp < 120) e.staggered = Math.max(e.staggered, 0.7);
      else if (isBoss) { e.flinch = Math.max(e.flinch || 0, 0.22); e.flinchAngle = fa; }
      // distinct feedback: blood, a phantom slash arc, sparks, impact chime
      g._bloodSplash(e.x, e.y, fa, isBoss ? 16 : 10, isBoss);
      g._spark(e.x, e.y, fa, 5);
      phantomSlash(g, e.x, e.y, fa);
      g._burst(e.x, e.y, '#7ac0e0', 10, 150);
      g.sound.parry();
      g.camera.shake = Math.max(g.camera.shake, isBoss ? 5 : 3);
    }
  }
}

// A swift cyan slash arc trailing through a phantom-dash victim.
function phantomSlash(g, x, y, dir) {
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const a = dir - 0.5 + t * 1.0;
    const rad = 16 + t * 7;
    g.particles.push({
      x: x + Math.cos(a) * rad, y: y + Math.sin(a) * rad,
      vx: Math.cos(a) * 70, vy: Math.sin(a) * 70,
      life: 0.22, max: 0.22, r: 2.6 - t * 0.7,
      color: i % 2 ? '#bff0ff' : '#7ac0e0', spark: true,
    });
  }
}