// EnemySystem.js — new enemy archetypes: stats, AI behaviors, rendering, and
// shared hooks (sound alert, pack aggro, blocking, elite drops).
// Imported by HuntGame.js. Existing enemy types and the core combat loop are
// untouched; update() returns false for legacy behaviors so they fall through
// to the engine's own state machine.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

// ============================ ARCHETYPE TABLE ============================
export const TYPES = {
  // --- Corrupted Villagers (variants; melee behavior, distinct art) ---
  knife_villager:  { name: 'Knife Drifter',      hp: 38,  speed: 98, r: 10, dmg: 8,  reach: 30, arc: 1.1, atkWindup: 0.20, atkActive: 0.08, atkRecover: 0.24, sight: 300, color: '#7a6a5a', ess: 12, behavior: 'melee', variant: 'knife' },
  torch_villager:  { name: 'Torch Bearer',        hp: 52,  speed: 64, r: 11, dmg: 13, reach: 34, arc: 1.3, atkWindup: 0.40, atkActive: 0.12, atkRecover: 0.5,  sight: 300, color: '#6a4a3a', ess: 14, behavior: 'melee', variant: 'torch' },
  heavy_villager:  { name: 'Hammer Cultist',      hp: 120, speed: 42, r: 14, dmg: 26, reach: 54, arc: 1.9, atkWindup: 0.72, atkActive: 0.16, atkRecover: 0.72, sight: 300, color: '#6a4a3a', ess: 26, behavior: 'melee', variant: 'heavy' },
  crazed_villager: { name: 'Crazed Drifter',      hp: 50,  speed: 74, r: 11, dmg: 16, reach: 36, arc: 1.0, atkWindup: 0.40, atkActive: 0.12, atkRecover: 0.5,  sight: 360, color: '#8a5a4a', ess: 16, behavior: 'charge' },
  // --- Cathedral Guardian (blocks + counters) ---
  guardian:        { name: 'Cathedral Guardian', hp: 170, speed: 50, r: 14, dmg: 28, reach: 46, arc: 1.4, atkWindup: 0.60, atkActive: 0.16, atkRecover: 0.6,  sight: 320, color: '#5a5e6a', ess: 40, behavior: 'guard' },
  // --- Forbidden Scholar (ranged + teleport + summon) ---
  scholar:         { name: 'Forbidden Scholar',  hp: 72,  speed: 58, r: 12, dmg: 16, reach: 0,  arc: 0,   atkWindup: 0.80, atkActive: 0.20, atkRecover: 0.9,  sight: 440, color: '#4a3a5a', ess: 34, behavior: 'scholar' },
  // --- Beast ---
  ancient_beast:   { name: 'The Ancient Beast',   hp: 190, speed: 80, r: 18, dmg: 24, reach: 52, arc: 1.5, atkWindup: 0.60, atkActive: 0.20, atkRecover: 0.7,  sight: 380, color: '#3a2a2a', ess: 46, behavior: 'beast' },
  // --- Fallen Hunter (dodges, parries, duels) ---
  fallen_hunter:   { name: 'Fallen Hunter',       hp: 140, speed: 94, r: 12, dmg: 20, reach: 44, arc: 1.2, atkWindup: 0.34, atkActive: 0.12, atkRecover: 0.32, sight: 400, color: '#2a2a34', ess: 42, behavior: 'hunter' },
  // --- Elite: The Executioner ---
  executioner:     { name: 'The Executioner',     hp: 340, speed: 44, r: 20, dmg: 36, reach: 62, arc: 1.7, atkWindup: 0.82, atkActive: 0.24, atkRecover: 0.8,  sight: 340, color: '#3a1a1a', ess: 95, behavior: 'heavy', elite: true },
  // --- Elite: The Bell Keeper ---
  bell_keeper:     { name: 'The Bell Keeper',     hp: 210, speed: 52, r: 15, dmg: 18, reach: 0,  arc: 0,   atkWindup: 0.90, atkActive: 0.30, atkRecover: 1.0,  sight: 380, color: '#5a4a2a', ess: 72, behavior: 'bellkeeper', elite: true },
  // --- Elite: The Librarian Guardian ---
  librarian:       { name: 'Librarian Guardian',  hp: 250, speed: 62, r: 16, dmg: 22, reach: 0,  arc: 0,   atkWindup: 0.70, atkActive: 0.20, atkRecover: 0.8,  sight: 460, color: '#3a2a4a', ess: 82, behavior: 'librarian', elite: true },
  // --- Endgame: The Drowned Sanctum (stronger, mixed, elite, unique) ---
  void_scholar:  { name: 'Void Scholar',     hp: 110, speed: 64, r: 12, dmg: 22, reach: 0,  arc: 0,   atkWindup: 0.7,  atkActive: 0.2,  atkRecover: 0.8, sight: 480, color: '#2a1a4a', ess: 40, behavior: 'scholar' },
  rune_guardian: { name: 'Rune Guardian',    hp: 240, speed: 54, r: 15, dmg: 34, reach: 50, arc: 1.4, atkWindup: 0.55, atkActive: 0.16, atkRecover: 0.55, sight: 340, color: '#3a3a4a', ess: 60, behavior: 'guard' },
  pale_hunter:   { name: 'Pale Hunter',      hp: 190, speed: 104, r: 12, dmg: 28, reach: 46, arc: 1.2, atkWindup: 0.3,  atkActive: 0.12, atkRecover: 0.3, sight: 440, color: '#1a1a24', ess: 58, behavior: 'hunter' },
  crypt_beast:   { name: 'Crypt Beast',       hp: 260, speed: 92, r: 18, dmg: 30, reach: 54, arc: 1.5, atkWindup: 0.55, atkActive: 0.2,  atkRecover: 0.6, sight: 400, color: '#2a1a1a', ess: 64, behavior: 'beast' },
  death_brute:   { name: 'Death Brute',       hp: 420, speed: 50, r: 21, dmg: 40, reach: 64, arc: 1.8, atkWindup: 0.8,  atkActive: 0.24, atkRecover: 0.75, sight: 360, color: '#2a1414', ess: 120, behavior: 'heavy', elite: true },
  phantom:       { name: 'Phantom',            hp: 140, speed: 70, r: 12, dmg: 24, reach: 0,  arc: 0,   atkWindup: 0.6,  atkActive: 0.2,  atkRecover: 0.7, sight: 520, color: '#1a2a3a', ess: 50, behavior: 'phantom' },
  titan:         { name: 'Titan',              hp: 560, speed: 48, r: 22, dmg: 38, reach: 66, arc: 1.7, atkWindup: 0.75, atkActive: 0.24, atkRecover: 0.7, sight: 380, color: '#2a2a3a', ess: 140, behavior: 'titan', elite: true },
  the_warden:    { name: 'The Warden',         hp: 1400, speed: 60, r: 24, dmg: 42, reach: 70, arc: 1.8, atkWindup: 0.7, atkActive: 0.26, atkRecover: 0.65, sight: 460, color: '#3a2a2a', ess: 600, behavior: 'titan', elite: true, miniboss: true },
  // --- Northern expansion (Frostbound Cathedral) ---
  ice_wraith:   { name: 'Ice Wraith',       hp: 130, speed: 70, r: 12, dmg: 22, reach: 0,  arc: 0,   atkWindup: 0.6,  atkActive: 0.2,  atkRecover: 0.7, sight: 520, color: '#1a3a4a', ess: 48, behavior: 'phantom' },
  // --- Northern expansion (The Forgotten Castle) ---
  fallen_knight:{ name: 'Fallen Knight',    hp: 180, speed: 56, r: 14, dmg: 30, reach: 48, arc: 1.4, atkWindup: 0.58, atkActive: 0.16, atkRecover: 0.58, sight: 320, color: '#3a3a44', ess: 44, behavior: 'guard' },
  living_armor: { name: 'Living Armor',     hp: 260, speed: 40, r: 17, dmg: 34, reach: 58, arc: 1.7, atkWindup: 0.78, atkActive: 0.22, atkRecover: 0.78, sight: 300, color: '#2a2a34', ess: 70, behavior: 'heavy', elite: true },
  // --- Northern expansion (The Ash Catacombs) ---
  skeleton:     { name: 'Risen Skeleton',   hp: 70,  speed: 86, r: 11, dmg: 16, reach: 34, arc: 1.1, atkWindup: 0.34, atkActive: 0.12, atkRecover: 0.4,  sight: 340, color: '#d8d0b8', ess: 18, behavior: 'charge' },
  // --- The Forgotten Underworld (unique enemies; do not appear elsewhere) ---
  excavator:     { name: 'Grave Excavator',  hp: 150, speed: 56, r: 14, dmg: 26, reach: 56, arc: 1.6, atkWindup: 0.78, atkActive: 0.2, atkRecover: 0.7, sight: 320, color: '#4a3a2a', ess: 38, behavior: 'heavy' },
  seal_sentinel: { name: 'Seal Sentinel',    hp: 200, speed: 52, r: 15, dmg: 30, reach: 50, arc: 1.4, atkWindup: 0.6,  atkActive: 0.16, atkRecover: 0.6, sight: 340, color: '#3a3a4a', ess: 46, behavior: 'guard' },
  void_leech:    { name: 'Void Leech',       hp: 110, speed: 64, r: 12, dmg: 20, reach: 0,  arc: 0,   atkWindup: 0.6,  atkActive: 0.2,  atkRecover: 0.7, sight: 480, color: '#2a1a3a', ess: 34, behavior: 'phantom' },
  };

// ============================ UPDATE DISPATCH ============================
// Returns true if this module fully handled the enemy (new behavior types);
// false for legacy behaviors so the engine's own state machine runs.
export function update(game, e, dt) {
  switch (e.behavior) {
    case 'charge':     return updateCharge(game, e, dt);
    case 'guard':     return updateGuard(game, e, dt);
    case 'scholar':    return updateScholar(game, e, dt);
    case 'beast':     return updateBeast(game, e, dt);
    case 'hunter':    return updateHunter(game, e, dt);
    case 'heavy':     return updateHeavy(game, e, dt);
    case 'bellkeeper':return updateBellkeeper(game, e, dt);
    case 'librarian': return updateLibrarian(game, e, dt);
    case 'phantom':   return updatePhantom(game, e, dt);
    case 'titan':     return updateTitan(game, e, dt);
    default:          return false;
  }
}

// ============================ SHARED HOOKS ============================
// Gunfire alerts idle enemies within earshot (sound reaction).
export function alertBySound(game) {
  const p = game.player;
  for (const e of game.enemies) {
    if (!e.alive || e.state !== 'idle') continue;
    if (dist2(p.x, p.y, e.x, e.y) < 540 * 540) { e.state = 'chase'; e.stateT = 0; }
  }
}

// When one enemy spots the player, nearby idle allies aggro too (pack behavior).
export function callForHelp(game, e) {
  for (const o of game.enemies) {
    if (o === e || !o.alive || o.state !== 'idle') continue;
    if (dist2(e.x, e.y, o.x, o.y) < 210 * 210) { o.state = 'chase'; o.stateT = 0; }
  }
}

// Blocking: guardian reduces frontal damage and readies a counter.
export function adjustDamage(game, e, dmg) {
  if (!e.guarding || e.behavior !== 'guard' || e.state === 'attack' || e.staggered > 0) return dmg;
  const p = game.player;
  const aToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
  if (Math.abs(angDiff(e.facing, aToPlayer)) < 1.3) {
    game.sound.blockClang();
    game._burst(e.x + Math.cos(aToPlayer) * e.r, e.y + Math.sin(aToPlayer) * e.r, '#c9d2e2', 9, 130);
    p.stamina = Math.max(0, p.stamina - 8);
    p.staminaRegenDelay = 0.5;
    if ((e.counterCool || 0) <= 0) { e._counterPending = 0.22; e.counterCool = 2.6; }
    return dmg * 0.2;
  }
  return dmg;
}

// On-kill: lingering blood stain + guaranteed elite drops.
export function onKill(game, e) {
  game.bloodStains.push({ x: e.x, y: e.y, r: e.r * (0.8 + Math.random() * 0.7), life: 9, max: 9 });
  if (e.elite) {
    game.pickups.push({ x: e.x + 14, y: e.y, vial: true, t: 0 });
    game.pickups.push({ x: e.x - 14, y: e.y, bullet: true, t: 0 });
    game.pickups.push({ x: e.x, y: e.y - 6, ess: Math.round(e.ess * 0.5), t: 0 });
  }
}

// ============================ HELPERS ============================
function meleeHit(game, e, reach, arc) {
  const p = game.player;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  const a = Math.atan2(p.y - e.y, p.x - e.x);
  if (!e._hit && d < reach + e.r + p.r + 4 && Math.abs(angDiff(e.facing, a)) < arc / 2 + 0.2) {
    e._hit = true; game._hurtPlayer(e.dmg, e.x, e.y);
  }
}

function patrolWander(game, e, dt) {
  if (e.patrolA === undefined) {
    const a = Math.random() * TAU;
    e.patrolA = { x: e.spawnX + Math.cos(a) * 70, y: e.spawnY + Math.sin(a) * 70 };
    e.patrolB = { x: e.spawnX - Math.cos(a) * 70, y: e.spawnY - Math.sin(a) * 70 };
    e.patrolTarget = e.patrolA;
  }
  const t = e.patrolTarget;
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  if (d < 14) { e.patrolTarget = (t === e.patrolA) ? e.patrolB : e.patrolA; }
  else {
    const a = Math.atan2(t.y - e.y, t.x - e.x);
    e.facing = a;
    e.x += Math.cos(a) * e.speed * 0.4 * dt;
    e.y += Math.sin(a) * e.speed * 0.4 * dt;
  }
}

function teleportAway(game, e) {
  game._burst(e.x, e.y, '#9a6ad6', 16, 180);
  const a = Math.random() * TAU, r = 230;
  e.x = clamp(game.player.x + Math.cos(a) * r, 60, game.world.W - 60);
  e.y = clamp(game.player.y + Math.sin(a) * r, 60, game.world.H - 60);
  e.vx = 0; e.vy = 0;
  game._burst(e.x, e.y, '#9a6ad6', 16, 180);
  game.sound.transform();
}

function summon(game, e, type) {
  const a = Math.random() * TAU;
  const x = clamp(e.x + Math.cos(a) * 50, 60, game.world.W - 60);
  const y = clamp(e.y + Math.sin(a) * 50, 60, game.world.H - 60);
  game.enemies.push(game._spawnEnemy(type, x, y));
  game._burst(x, y, '#a06ad6', 14, 160);
  game.sound.summon();
}

function spot(game, e, dt) {
  // shared idle handling: aggro or patrol
  const p = game.player;
  if (dist2(p.x, p.y, e.x, e.y) < e.sight * e.sight) {
    e.state = 'chase'; e.stateT = 0; callForHelp(game, e); return true;
  }
  patrolWander(game, e, dt);
  return false;
}

// ============================ BEHAVIORS ============================
function updateCharge(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    e.chargeCool = (e.chargeCool ?? 1.5) - dt;
    if (e.chargeCool <= 0 && d < 270 && d > 44) {
      e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
      e._chargeDir = { x: Math.cos(e.facing), y: Math.sin(e.facing) };
      e.chargeCool = 3 + Math.random() * 2;
      game.sound.charge();
    } else {
      e.x += Math.cos(e.facing) * e.speed * dt;
      e.y += Math.sin(e.facing) * e.speed * dt;
    }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= e.atkWindup) { e.attackPhase = 'active'; e.stateT = 0; e._hit = false; game.sound.beastRoar(); }
    } else if (e.attackPhase === 'active') {
      e.x += e._chargeDir.x * 470 * dt;
      e.y += e._chargeDir.y * 470 * dt;
      if (!e._hit && Math.hypot(p.x - e.x, p.y - e.y) < e.reach + e.r + p.r) { e._hit = true; game._hurtPlayer(e.dmg, e.x, e.y); }
      if (e.stateT >= 0.32) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

function updateGuard(game, e, dt) {
  const p = game.player;
  e.guarding = false;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const atkRange = e.reach + e.r + p.r + 4;
    e.counterCool = (e.counterCool ?? 0) - dt;
    if (e._counterPending > 0) {
      e._counterPending -= dt;
      if (e._counterPending <= 0 && d < e.reach + e.r + p.r + 44) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false; e._attackType = 'counter';
      }
    }
    if (e.state !== 'attack') {
      if (d < atkRange && e.stateT > 0.7) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false; e._attackType = 'swing';
      } else if (d > atkRange) {
        e.guarding = true;
        e.x += Math.cos(e.facing) * e.speed * dt;
        e.y += Math.sin(e.facing) * e.speed * dt;
      } else {
        e.guarding = true; // in range, biding — hold guard
      }
    }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    const counter = e._attackType === 'counter';
    const windup = counter ? e.atkWindup * 0.55 : e.atkWindup;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= windup) { e.attackPhase = 'active'; e.stateT = 0; e._hit = false; }
    } else if (e.attackPhase === 'active') {
      meleeHit(game, e, e.reach, e.arc);
      if (e.stateT >= e.atkActive) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

function updateScholar(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const ideal = 240;
    if (d < ideal - 40) { e.x -= Math.cos(e.facing) * e.speed * dt; e.y -= Math.sin(e.facing) * e.speed * dt; }
    else if (d > ideal + 60) { e.x += Math.cos(e.facing) * e.speed * 0.6 * dt; e.y += Math.sin(e.facing) * e.speed * 0.6 * dt; }
    e.telepCool = (e.telepCool ?? 3) - dt;
    if (d < 130 && e.telepCool <= 0) { e.telepCool = 4 + Math.random() * 2; teleportAway(game, e); }
    e.fireCool = (e.fireCool ?? 1) - dt;
    if (e.fireCool <= 0 && d < e.sight) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
    e.sumCool = (e.sumCool ?? 8) - dt;
    if (e.sumCool <= 0 && game.enemies.filter(x => x.alive).length < 10) { e.sumCool = 10 + Math.random() * 3; summon(game, e, 'crawler'); }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= e.atkWindup) {
        e.attackPhase = 'active'; e.stateT = 0;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        game.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, life: 2.4, r: 6, fromPlayer: false, dmg: e.dmg, color: '#9a6ad6', homing: true });
        game.sound.summon();
      }
    } else if (e.attackPhase === 'active') {
      if (e.stateT >= 0.1) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; e.fireCool = rand(1.2, 2.4); }
    }
    return true;
  }
  return true;
}

function updateBeast(game, e, dt) {
  const p = game.player;
  if (e.hp < e.maxHp * 0.5 && !e.frenzied) { e.frenzied = true; e.speed *= 1.35; game.sound.beastRoar(); }
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const atkRange = e.reach + e.r + p.r + 4;
    if (e.stateT > 0.6) {
      if (d < atkRange) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
        e._attackType = (Math.random() < 0.4) ? 'slam' : 'swipe';
        if (e._attackType === 'slam') game.sound.beastRoar();
      } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    const slam = e._attackType === 'slam';
    const windup = slam ? 0.8 : e.atkWindup, active = slam ? 0.3 : e.atkActive, recover = slam ? 0.7 : e.atkRecover;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= windup) {
        e.attackPhase = 'active'; e.stateT = 0; e._hit = false;
        if (slam) { game.sound.slam(); game.camera.shake = Math.max(game.camera.shake, 8); game.shockwaves.push({ x: e.x, y: e.y, r: 10, maxR: 165, speed: 320, dmg: Math.round(e.dmg * 0.7), hit: false, color: '#7a4a3a' }); }
      }
    } else if (e.attackPhase === 'active') {
      if (!slam) meleeHit(game, e, e.reach, e.arc);
      if (e.stateT >= active) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= recover) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

function updateHunter(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const atkRange = e.reach + e.r + p.r + 4;
    e.dodgeCool = (e.dodgeCool ?? 1.5) - dt;
    if (p.swing && p.swing.t < 0.16 && d < 78 && e.dodgeCool <= 0) {
      e.dodgeCool = 1.6 + Math.random();
      const away = e.facing + Math.PI + (Math.random() < 0.5 ? 0.9 : -0.9);
      e.vx += Math.cos(away) * 270; e.vy += Math.sin(away) * 270;
      e._dodgeFlash = 0.3; game.sound.dodge();
    }
    if (d < atkRange && e.stateT > 0.3) {
      e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
    } else if (d > atkRange) {
      e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt;
    }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      e.parryWindow = 1; // bullets fired at us now get parried (engine reads windup)
      if (e.stateT >= e.atkWindup) { e.attackPhase = 'active'; e.stateT = 0; e._hit = false; }
    } else if (e.attackPhase === 'active') {
      meleeHit(game, e, e.reach, e.arc);
      if (e.stateT >= e.atkActive) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

function updateHeavy(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const atkRange = e.reach + e.r + p.r + 4;
    if (e.stateT > 0.8) {
      if (d < atkRange) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
        e._attackType = (Math.random() < 0.45) ? 'slam' : 'cleaver';
      } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    const slam = e._attackType === 'slam';
    const windup = slam ? 0.9 : e.atkWindup, active = slam ? 0.32 : e.atkActive, recover = slam ? 0.8 : e.atkRecover;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= windup) {
        e.attackPhase = 'active'; e.stateT = 0; e._hit = false;
        if (slam) { game.sound.slam(); game.camera.shake = Math.max(game.camera.shake, 12); game.shockwaves.push({ x: e.x, y: e.y, r: 12, maxR: 225, speed: 360, dmg: Math.round(e.dmg * 0.8), hit: false, color: '#8a3a2a' }); }
      }
    } else if (e.attackPhase === 'active') {
      if (!slam) meleeHit(game, e, e.reach, e.arc);
      if (e.stateT >= active) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= recover) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

function updateBellkeeper(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const ideal = 200;
    if (d < ideal - 40) { e.x -= Math.cos(e.facing) * e.speed * dt; e.y -= Math.sin(e.facing) * e.speed * dt; }
    else if (d > ideal + 80) { e.x += Math.cos(e.facing) * e.speed * 0.6 * dt; e.y += Math.sin(e.facing) * e.speed * 0.6 * dt; }
    e.fireCool = (e.fireCool ?? 2) - dt;
    if (e.fireCool <= 0 && d < e.sight) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
    e.sumCool = (e.sumCool ?? 10) - dt;
    if (e.sumCool <= 0 && game.enemies.filter(x => x.alive).length < 12) {
      e.sumCool = 12; summon(game, e, 'townsfolk'); summon(game, e, 'crawler');
    }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= e.atkWindup) {
        e.attackPhase = 'active'; e.stateT = 0; game.sound.bell();
        game.camera.shake = Math.max(game.camera.shake, 6);
        game.shockwaves.push({ x: e.x, y: e.y, r: 10, maxR: 265, speed: 300, dmg: e.dmg, hit: false, color: '#d4b060' });
      }
    } else if (e.attackPhase === 'active') {
      if (e.stateT >= e.atkActive) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; e.fireCool = 3 + Math.random() * 2; }
    }
    return true;
  }
  return true;
}

function updateLibrarian(game, e, dt) {
  const p = game.player;
  // orbiting books = mobile barrier / area denial
  const orbR = 44;
  for (let i = 0; i < 4; i++) {
    const a = game.runtime * 1.5 + i * (TAU / 4);
    const bx = e.x + Math.cos(a) * orbR, by = e.y + Math.sin(a) * orbR;
    if (dist2(p.x, p.y, bx, by) < 16 * 16) game._hurtPlayer(Math.round(e.dmg * 0.5), bx, by);
  }
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const ideal = 220;
    if (d < ideal - 40) { e.x -= Math.cos(e.facing) * e.speed * dt; e.y -= Math.sin(e.facing) * e.speed * dt; }
    else if (d > ideal + 80) { e.x += Math.cos(e.facing) * e.speed * 0.5 * dt; e.y += Math.sin(e.facing) * e.speed * 0.5 * dt; }
    e.fireCool = (e.fireCool ?? 2.5) - dt;
    if (e.fireCool <= 0 && d < e.sight) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= e.atkWindup) {
        e.attackPhase = 'active'; e.stateT = 0;
        const n = 5;
        for (let i = 0; i < n; i++) {
          const a = e.facing + (i - (n - 1) / 2) * 0.22;
          game.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, life: 3, r: 7, fromPlayer: false, dmg: Math.round(e.dmg * 0.5), color: '#d4b060', homing: true });
        }
        game.sound.summon();
      }
    } else if (e.attackPhase === 'active') {
      if (e.stateT >= 0.12) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; e.fireCool = 3 + Math.random() * 2; }
    }
    return true;
  }
  return true;
}

// ============================ RENDERING ============================
// Returns true if this module drew the figure (new types). Caller has already
// translated to (e.x,e.y) and rotated by e.facing.
export function drawEnemyFigure(game, ctx, e, staggered) {
  let body = e.color;
  if (e.hitFlash > 0) body = '#fff';
  if (staggered) body = '#9aa0ff';
  const breathe = e.state === 'idle' ? 1 + Math.sin(game.runtime * 2 + e.x * 0.05) * 0.03 : 1;
  const r = e.r;
  switch (e.type) {
    case 'knife_villager':  drawKnife(ctx, r, body, staggered, breathe); return true;
    case 'torch_villager':  drawTorch(ctx, r, body, staggered, breathe, game); return true;
    case 'heavy_villager': drawHeavy(ctx, r, body, staggered, breathe); return true;
    case 'crazed_villager':drawCrazed(ctx, r, body, staggered, breathe, game); return true;
    case 'guardian':       drawGuardian(ctx, r, body, staggered, breathe, game); return true;
    case 'scholar':        drawScholar(ctx, r, body, staggered, breathe, game); return true;
    case 'ancient_beast':  drawBeast(ctx, r, body, staggered, breathe, game); return true;
    case 'fallen_hunter':  drawFallenHunter(ctx, r, body, staggered, breathe, game); return true;
    case 'executioner':    drawExecutioner(ctx, r, body, staggered, breathe, game); return true;
    case 'bell_keeper':    drawBellKeeper(ctx, r, body, staggered, breathe, game); return true;
    case 'librarian':      drawLibrarian(ctx, r, body, staggered, breathe, game); return true;
    case 'void_scholar':   drawScholar(ctx, r, body, staggered, breathe, game); return true;
    case 'rune_guardian':  drawGuardian(ctx, r, body, staggered, breathe, game); return true;
    case 'pale_hunter':    drawFallenHunter(ctx, r, body, staggered, breathe, game); return true;
    case 'crypt_beast':    drawBeast(ctx, r, body, staggered, breathe, game); return true;
    case 'death_brute':    drawExecutioner(ctx, r, body, staggered, breathe, game); return true;
    case 'phantom':        drawPhantom(ctx, r, body, staggered, breathe, game); return true;
    case 'titan':          drawTitan(ctx, r, body, staggered, breathe, game); return true;
    case 'the_warden':     drawTitan(ctx, r, body, staggered, breathe, game); return true;
    case 'ice_wraith':    drawFrost(ctx, r, body, staggered, breathe, game); return true;
    case 'fallen_knight': drawGuardian(ctx, r, body, staggered, breathe, game); return true;
    case 'living_armor':  drawLivingArmor(ctx, r, body, staggered, breathe, game); return true;
    case 'skeleton':      drawSkeleton(ctx, r, body, staggered, breathe, game); return true;
    case 'excavator':     drawExcavator(ctx, r, body, staggered, breathe, game); return true;
    case 'seal_sentinel': drawSealSentinel(ctx, r, body, staggered, breathe, game); return true;
    case 'void_leech':    drawVoidLeech(ctx, r, body, staggered, breathe, game); return true;
    default: return false;
  }
}

function col(ctx, body, staggered) { return staggered ? '#9aa0ff' : body; }

function drawKnife(ctx, r, body, st, br) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 1, r * 1.0, r * 1.25, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#3a3128';
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, r * 0.62, 0, TAU); ctx.fill();
  // hunched hood
  ctx.fillStyle = st ? '#fff' : '#2a2218';
  ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.35, r * 0.5, Math.PI, TAU); ctx.fill();
  // knife
  ctx.strokeStyle = '#c9d2e2'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.1); ctx.lineTo(r * 1.4, -r * 0.1); ctx.stroke();
  ctx.fillStyle = '#8a7050'; ctx.fillRect(r * 0.3, r * 0.05, 6, 3);
  ctx.fillStyle = st ? '#fff' : '#e40'; ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.3, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawTorch(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 1, r * 1.05, r * 1.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#3a3128';
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, r * 0.65, 0, TAU); ctx.fill();
  // torch handle
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.2); ctx.lineTo(r * 1.3, -r * 0.5); ctx.stroke();
  // flame
  const fl = 1 + Math.sin(game.runtime * 8) * 0.18;
  const g = ctx.createRadialGradient(r * 1.3, -r * 0.5, 1, r * 1.3, -r * 0.5, r * 0.7 * fl);
  g.addColorStop(0, 'rgba(255,220,120,0.9)'); g.addColorStop(0.5, 'rgba(255,140,40,0.5)'); g.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r * 1.3, -r * 0.5, r * 0.7 * fl, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#ffe080'; ctx.beginPath(); ctx.ellipse(r * 1.3, -r * 0.55, r * 0.18, r * 0.32 * fl, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawHeavy(ctx, r, body, st, br) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 2, r * 1.25, r * 1.45, 0, 0, TAU); ctx.fill();
  // thick apron
  ctx.fillStyle = st ? '#fff' : '#3a2a1a'; ctx.fillRect(-r * 0.8, -r * 0.3, r * 1.6, r * 1.6);
  // bald head
  ctx.fillStyle = st ? '#fff' : '#9a7a5a'; ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.5, r * 0.48, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#1a1208'; ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.45, 1.8, 0, TAU); ctx.fill();
  // big hammer
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.4); ctx.lineTo(r * 1.5, -r * 0.9); ctx.stroke();
  ctx.fillStyle = st ? '#fff' : '#5a5048'; ctx.fillRect(r * 1.2, -r * 1.2, r * 0.7, r * 0.5);
  ctx.strokeStyle = '#2a2620'; ctx.lineWidth = 1.5; ctx.strokeRect(r * 1.2, -r * 1.2, r * 0.7, r * 0.5);
  ctx.restore();
}

function drawCrazed(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 1, r * 0.95, r * 1.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#2a2018';
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, r * 0.6, 0, TAU); ctx.fill();
  // wild hair
  ctx.strokeStyle = st ? '#fff' : '#1a1208'; ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(r * 0.1 + i * r * 0.15, -r * 0.5); ctx.lineTo(r * 0.1 + i * r * 0.15, -r * 0.95); ctx.stroke(); }
  // glowing mad eyes
  const gl = 0.7 + Math.sin(game.runtime * 10) * 0.3;
  ctx.fillStyle = st ? '#fff' : `rgba(255,80,40,${gl})`;
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.2, 1.8, 0, TAU); ctx.arc(r * 0.5, -r * 0.2, 1.8, 0, TAU); ctx.fill();
  // flailing arms
  const fl = Math.sin(game.runtime * 9) * r * 0.3;
  ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.2, r * 0.2); ctx.lineTo(r * 0.9, r * 0.5 + fl); ctx.moveTo(r * 0.2, r * 0.2); ctx.lineTo(-r * 0.7, r * 0.4 - fl); ctx.stroke();
  ctx.restore();
}

function drawGuardian(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // shield (forward-facing)
  ctx.fillStyle = st ? '#fff' : '#3a3e4a';
  ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 0.55, r * 0.95, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = st ? '#fff' : '#6a7280'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = st ? '#fff' : '#8a7050'; ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 0.18, 0, TAU); ctx.fill();
  // armored body
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(r * 0.2, 1, r * 1.1, r * 1.35, 0, 0, TAU); ctx.fill();
  // ornate helm
  ctx.fillStyle = st ? '#fff' : '#4a4e5a';
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.35, r * 0.55, 0, TAU); ctx.fill();
  // visor slit
  ctx.fillStyle = '#0a0a10'; ctx.fillRect(r * 0.3, -r * 0.4, r * 0.5, 3);
  // plume
  ctx.strokeStyle = st ? '#fff' : '#8a3a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.85); ctx.lineTo(r * 0.3, -r * 1.4 + Math.sin(game.runtime * 3) * 2); ctx.stroke();
  // rusted sword
  ctx.strokeStyle = '#7a6a5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.6, r * 0.2); ctx.lineTo(r * 1.6, -r * 0.1); ctx.stroke();
  ctx.restore();
}

function drawScholar(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // floating tome beside
  const ba = game.runtime * 0.8;
  const bx = Math.cos(ba) * r * 1.3, by = Math.sin(ba) * r * 1.3;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ba * 2);
  ctx.fillStyle = st ? '#fff' : '#5a3a1a'; ctx.fillRect(-6, -5, 12, 10);
  ctx.fillStyle = st ? '#fff' : '#d4b060'; ctx.fillRect(-5, -4, 10, 8);
  ctx.restore();
  // robes
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 1.2); ctx.lineTo(-r * 0.45, -r * 0.2); ctx.lineTo(r * 0.45, -r * 0.2); ctx.lineTo(r * 0.7, r * 1.2); ctx.closePath(); ctx.fill();
  // hood
  ctx.fillStyle = st ? '#fff' : '#2a1a3a';
  ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.6, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.25); ctx.lineTo(-r * 0.4, r * 0.1); ctx.lineTo(r * 0.4, r * 0.1); ctx.lineTo(r * 0.55, -r * 0.25); ctx.closePath(); ctx.fill();
  // shadowed face
  ctx.fillStyle = '#1a0a1a'; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.3, 0, TAU); ctx.fill();
  // glowing runes
  const gl = 0.6 + Math.sin(game.runtime * 4) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(170,110,240,${gl})`;
  ctx.beginPath(); ctx.arc(0, -r * 0.2, 2.2, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawBeast(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // quadruped body
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 1.35, r * 0.85, 0, 0, TAU); ctx.fill();
  // legs
  ctx.strokeStyle = body; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.6); ctx.lineTo(-r * 1.0, -r * 1.1);
  ctx.moveTo(r * 0.3, -r * 0.6); ctx.lineTo(r * 0.4, -r * 1.1);
  ctx.moveTo(-r * 0.9, r * 0.6); ctx.lineTo(-r * 1.0, r * 1.1);
  ctx.moveTo(r * 0.3, r * 0.6); ctx.lineTo(r * 0.4, r * 1.1);
  ctx.stroke();
  // head
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.6, 0, TAU); ctx.fill();
  // horns
  ctx.strokeStyle = st ? '#fff' : '#d8d0c0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 1.2, -r * 0.4); ctx.lineTo(r * 1.5, -r * 0.9); ctx.moveTo(r * 1.3, -r * 0.2); ctx.lineTo(r * 1.7, -r * 0.5); ctx.stroke();
  // mane (spikes)
  ctx.fillStyle = st ? '#fff' : '#2a1818';
  for (let i = -2; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.35, -r * 0.7); ctx.lineTo(i * r * 0.35 - 3, -r * 1.1); ctx.lineTo(i * r * 0.35 + 3, -r * 1.1); ctx.closePath(); ctx.fill(); }
  // glowing eye
  const gl = 0.7 + Math.sin(game.runtime * 6) * 0.3;
  ctx.fillStyle = st ? '#fff' : `rgba(255,60,30,${gl})`; ctx.beginPath(); ctx.arc(r * 1.1, -r * 0.15, 2.4, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawFallenHunter(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // dark cloak
  ctx.fillStyle = '#15131c';
  ctx.beginPath(); ctx.ellipse(0, 2, r * 1.2, r * 1.45, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.92, r * 1.18, 0, 0, TAU); ctx.fill();
  // weathered face
  ctx.fillStyle = st ? '#fff' : '#9a8870'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.35, r * 0.36, 0, TAU); ctx.fill();
  // tricorn (dark mirror of player)
  ctx.fillStyle = '#0c0a12'; ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 0.55, r * 1.0, r * 0.34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a080f'; ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 0.62, r * 0.5, r * 0.22, 0, 0, TAU); ctx.fill();
  // glowing red eyes (corrupted)
  const gl = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(220,40,40,${gl})`;
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.35, 1.6, 0, TAU); ctx.fill();
  // saw cleaver
  ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.1); ctx.lineTo(r * 1.5, -r * 0.2); ctx.stroke();
  ctx.fillStyle = '#7a8499'; ctx.fillRect(r * 1.2, -r * 0.3, r * 0.4, 4);
  ctx.restore();
}

function drawExecutioner(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // massive body
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 2, r * 1.3, r * 1.5, 0, 0, TAU); ctx.fill();
  // apron
  ctx.fillStyle = st ? '#fff' : '#2a1010'; ctx.fillRect(-r * 0.7, -r * 0.3, r * 1.4, r * 1.6);
  // sack hood
  ctx.fillStyle = st ? '#fff' : '#4a2a1a';
  ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.4, r * 0.6, 0, TAU); ctx.fill();
  // eye holes
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(r * 0.0, -r * 0.4, 2, 0, TAU); ctx.arc(r * 0.3, -r * 0.4, 2, 0, TAU); ctx.fill();
  // rope
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.9); ctx.lineTo(r * 0.1, -r * 1.2); ctx.stroke();
  // giant executioner axe
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.3); ctx.lineTo(r * 1.7, -r * 1.0); ctx.stroke();
  ctx.fillStyle = st ? '#fff' : '#8a8a94'; ctx.beginPath(); ctx.moveTo(r * 1.5, -r * 1.2); ctx.lineTo(r * 1.9, -r * 0.7); ctx.lineTo(r * 1.5, -r * 0.7); ctx.lineTo(r * 1.9, -r * 1.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

function drawBellKeeper(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // robes
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 1.2); ctx.lineTo(-r * 0.4, -r * 0.2); ctx.lineTo(r * 0.4, -r * 0.2); ctx.lineTo(r * 0.7, r * 1.2); ctx.closePath(); ctx.fill();
  // hood
  ctx.fillStyle = st ? '#fff' : '#3a2a14';
  ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.55, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.25); ctx.lineTo(-r * 0.35, r * 0.1); ctx.lineTo(r * 0.35, r * 0.1); ctx.lineTo(r * 0.5, -r * 0.25); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a0a08'; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.28, 0, TAU); ctx.fill();
  // big bell carried forward
  const sw = Math.sin(game.runtime * 3) * r * 0.08;
  ctx.save(); ctx.translate(r * 0.9, sw); ctx.rotate(sw * 0.3);
  ctx.fillStyle = st ? '#fff' : '#7a6a3a';
  ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.4); ctx.lineTo(r * 0.4, -r * 0.4); ctx.lineTo(r * 0.5, r * 0.5); ctx.lineTo(-r * 0.5, r * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#3a2a10'; ctx.fillRect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.25);
  ctx.restore();
  ctx.restore();
}

function drawLibrarian(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  // orbiting books (barrier)
  for (let i = 0; i < 4; i++) {
    const a = game.runtime * 1.5 + i * (TAU / 4);
    const bx = Math.cos(a) * 44, by = Math.sin(a) * 44;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a * 2);
    ctx.fillStyle = st ? '#fff' : '#7a5a2a'; ctx.fillRect(-7, -5, 14, 10);
    ctx.fillStyle = st ? '#fff' : '#d4b060'; ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = st ? '#fff' : '#3a2a1a'; ctx.fillRect(0, -4, 1, 8);
    ctx.restore();
  }
  // robes
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 2, r * 1.1, r * 1.4, 0, 0, TAU); ctx.fill();
  // hood
  ctx.fillStyle = st ? '#fff' : '#2a1a3a';
  ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.58, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.4, r * 0.05); ctx.lineTo(r * 0.4, r * 0.05); ctx.lineTo(r * 0.5, -r * 0.3); ctx.closePath(); ctx.fill();
  // pale face
  ctx.fillStyle = st ? '#fff' : '#b8a890'; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.3, 0, TAU); ctx.fill();
  // glowing eyes
  const gl = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(120,200,255,${gl})`;
  ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.22, 1.8, 0, TAU); ctx.arc(r * 0.1, -r * 0.22, 1.8, 0, TAU); ctx.fill();
  ctx.restore();
}

// ============================ ENDGAME BEHAVIORS ============================
function updatePhantom(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const ideal = 260;
    if (d < ideal - 50) { e.x -= Math.cos(e.facing) * e.speed * dt; e.y -= Math.sin(e.facing) * e.speed * dt; }
    else if (d > ideal + 80) { e.x += Math.cos(e.facing) * e.speed * 0.5 * dt; e.y += Math.sin(e.facing) * e.speed * 0.5 * dt; }
    e.telepCool = (e.telepCool ?? 2.5) - dt;
    if (e.telepCool <= 0) { e.telepCool = 3 + Math.random() * 2; teleportAway(game, e); }
    e.fireCool = (e.fireCool ?? 1.8) - dt;
    if (e.fireCool <= 0 && d < e.sight) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    if (e.attackPhase === 'windup') {
      if (e.stateT >= e.atkWindup) {
        e.attackPhase = 'active'; e.stateT = 0;
        const n = 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          game.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 2.6, r: 6, fromPlayer: false, dmg: Math.round(e.dmg * 0.5), color: '#5acfd6', homing: true });
        }
        game.sound.summon();
      }
    } else if (e.attackPhase === 'active') {
      if (e.stateT >= 0.1) { e.attackPhase = 'recover'; e.stateT = 0; }
    } else if (e.attackPhase === 'recover') {
      if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; e.fireCool = 2 + Math.random() * 1.5; }
    }
    return true;
  }
  return true;
}

function updateTitan(game, e, dt) {
  const p = game.player;
  if (e.state === 'idle') { spot(game, e, dt); return true; }
  if (e.state === 'chase') {
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const atkRange = e.reach + e.r + p.r + 4;
    if (e.stateT > 0.7) {
      const r = Math.random();
      if (d < atkRange) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
        e._attackType = (r < 0.4) ? 'slam' : (r < 0.7 ? 'cleaver' : 'flurry');
      } else if (d > 200 && r < 0.014) {
        e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; e._hit = false;
        e._attackType = 'leap'; e._leapTarget = { x: p.x, y: p.y };
      } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    } else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
    return true;
  }
  if (e.state === 'attack') {
    e.stateT += dt;
    const slam = e._attackType === 'slam', leap = e._attackType === 'leap', flurry = e._attackType === 'flurry';
    if (e.attackPhase === 'windup') {
      const w = slam ? 0.9 : leap ? 0.5 : flurry ? 0.5 : e.atkWindup;
      if (e.stateT >= w) {
        e.attackPhase = 'active'; e.stateT = 0; e._hit = false;
        if (slam) { game.sound.slam(); game.camera.shake = Math.max(game.camera.shake, 14); game.shockwaves.push({ x: e.x, y: e.y, r: 12, maxR: 260, speed: 380, dmg: Math.round(e.dmg * 0.8), hit: false, color: '#5a3a3a' }); }
        if (leap) game.sound.beastRoar();
      }
    } else if (e.attackPhase === 'active') {
      if (leap) {
        const a = Math.atan2(e._leapTarget.y - e.y, e._leapTarget.x - e.x);
        e.x += Math.cos(a) * 320 * dt; e.y += Math.sin(a) * 320 * dt;
        if (!e._hit && Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r + 6) { e._hit = true; game._hurtPlayer(e.dmg, e.x, e.y); }
      } else if (!slam) {
        if (flurry) { e._flurryT = (e._flurryT || 0) + dt; if (e._flurryT >= 0.18) { e._flurryT = 0; e._hit = false; } }
        meleeHit(game, e, e.reach, e.arc);
      }
      const dur = slam ? 0.32 : leap ? 0.4 : flurry ? 0.7 : 0.22;
      if (e.stateT >= dur) {
        if (leap) { game.camera.shake = Math.max(game.camera.shake, 12); game.shockwaves.push({ x: e.x, y: e.y, r: 10, maxR: 200, speed: 340, dmg: Math.round(e.dmg * 0.6), hit: false, color: '#5a3a3a' }); }
        e.attackPhase = 'recover'; e.stateT = 0;
      }
    } else if (e.attackPhase === 'recover') {
      const rc = slam ? 0.8 : leap ? 0.6 : flurry ? 0.6 : e.atkRecover;
      if (e.stateT >= rc) { e.state = 'chase'; e.attackPhase = null; }
    }
    return true;
  }
  return true;
}

// ============================ ENDGAME RENDERING ============================
function drawPhantom(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.globalAlpha = 0.7 + Math.sin(game.runtime * 3) * 0.2;
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.8); ctx.quadraticCurveTo(0, r * 1.6, r * 0.5, r * 0.8); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#0a1020';
  ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.55, Math.PI, TAU); ctx.fill();
  const gl = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(120,200,255,${gl})`;
  ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.25, 1.8, 0, TAU); ctx.arc(r * 0.18, -r * 0.25, 1.8, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTitan(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 2, r * 1.3, r * 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#1a1a26'; ctx.fillRect(-r * 0.8, -r * 0.3, r * 1.6, r * 1.6);
  ctx.fillStyle = st ? '#fff' : '#2a2a3a'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.4, r * 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000'; ctx.fillRect(r * 0.1, -r * 0.45, r * 0.5, 3);
  ctx.strokeStyle = st ? '#fff' : '#6a6a7a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.7); ctx.lineTo(r * 0.6, -r * 1.3); ctx.moveTo(0, -r * 0.7); ctx.lineTo(-r * 0.3, -r * 1.3); ctx.stroke();
  const gl = 0.6 + Math.sin(game.runtime * 4) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(220,60,60,${gl})`;
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.4, 2.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.2); ctx.lineTo(r * 1.7, -r * 0.2); ctx.stroke();
  ctx.fillStyle = '#5a4a3a'; ctx.fillRect(r * 1.4, -r * 0.25, 6, 12);
  ctx.restore();
}

// ---- Northern expansion rendering ----
// Ice Wraith: a frozen, half-visible phantom trailing frost.
function drawFrost(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.globalAlpha = 0.72 + Math.sin(game.runtime * 3) * 0.18;
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.8); ctx.quadraticCurveTo(0, r * 1.7, r * 0.5, r * 0.8); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#0a1a26'; ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.55, Math.PI, TAU); ctx.fill();
  const gl = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(150,220,255,${gl})`;
  ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.25, 1.8, 0, TAU); ctx.arc(r * 0.18, -r * 0.25, 1.8, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Living Armor: a towering, empty suit of plate, visor aglow.
function drawLivingArmor(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 2, r * 1.2, r * 1.45, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#1a1a22'; ctx.fillRect(-r * 0.7, -r * 0.4, r * 1.4, r * 1.7);
  // plate seams
  ctx.strokeStyle = st ? '#fff' : '#4a4a54'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(0, r * 1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
  // pauldrons
  ctx.fillStyle = st ? '#fff' : '#3a3a44'; ctx.beginPath(); ctx.arc(-r * 0.7, -r * 0.3, r * 0.35, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.3, r * 0.35, 0, TAU); ctx.fill();
  // great helm
  ctx.fillStyle = st ? '#fff' : '#2a2a34'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.5, r * 0.42, 0, TAU); ctx.fill();
  // visor slit
  ctx.fillStyle = '#000'; ctx.fillRect(r * 0.1, -r * 0.55, r * 0.5, 3);
  const gl = 0.6 + Math.sin(game.runtime * 4) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(120,200,255,${gl})`; ctx.fillRect(r * 0.18, -r * 0.54, r * 0.32, 1.6);
  // greatsword
  ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.2); ctx.lineTo(r * 1.7, -r * 0.3); ctx.stroke();
  ctx.restore();
}

// Risen Skeleton: a bony warrior with a rusted blade.
function drawSkeleton(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 1, r * 0.85, r * 1.15, 0, 0, TAU); ctx.fill();
  // ribcage
  ctx.strokeStyle = st ? '#fff' : '#9a9078'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, r * 0.1 + i * r * 0.22, r * 0.5, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); }
  // skull
  ctx.fillStyle = st ? '#fff' : '#e8e0c8'; ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.45, r * 0.42, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(r * 0.0, -r * 0.5, 2.4, 0, TAU); ctx.arc(r * 0.3, -r * 0.5, 2.4, 0, TAU); ctx.fill();
  const gl = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(200,180,90,${gl})`;
  ctx.beginPath(); ctx.arc(r * 0.0, -r * 0.5, 1.2, 0, TAU); ctx.arc(r * 0.3, -r * 0.5, 1.2, 0, TAU); ctx.fill();
  // rusted blade
  ctx.strokeStyle = '#7a6a5a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.2); ctx.lineTo(r * 1.4, -r * 0.2); ctx.stroke();
  ctx.restore();
}

// ---- The Forgotten Underworld: unique enemy figures ----
// Grave Excavator: a hunched miner with a pickaxe and a guttering lantern.
function drawExcavator(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 2, r * 1.25, r * 1.45, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#2a2018'; ctx.fillRect(-r * 0.7, -r * 0.2, r * 1.4, r * 1.5);
  ctx.fillStyle = st ? '#fff' : '#3a2a1a'; ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.45, r * 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a0e06'; ctx.beginPath(); ctx.ellipse(r * 0.2, -r * 0.4, r * 0.28, r * 0.32, 0, 0, TAU); ctx.fill();
  const eg = 0.6 + Math.sin(game.runtime * 4) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(255,180,70,${eg})`; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.42, 1.8, 0, TAU); ctx.fill();
  // pickaxe
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.3); ctx.lineTo(r * 1.5, -r * 0.7); ctx.stroke();
  ctx.strokeStyle = st ? '#fff' : '#8a7a6a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(r * 1.3, -r * 0.9); ctx.lineTo(r * 1.7, -r * 0.5); ctx.stroke();
  ctx.restore();
}

// Seal Sentinel: a robed warden bearing a lantern-staff and a glowing seal crest.
function drawSealSentinel(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 2, r * 1.1, r * 1.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#2a2a36'; ctx.fillRect(-r * 0.7, -r * 0.3, r * 1.4, r * 1.6);
  ctx.fillStyle = st ? '#fff' : '#1a1a24'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.35, r * 0.58, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.1 - r * 0.5, -r * 0.3); ctx.lineTo(r * 0.1 - r * 0.35, r * 0.1); ctx.lineTo(r * 0.1 + r * 0.35, r * 0.1); ctx.lineTo(r * 0.1 + r * 0.5, -r * 0.3); ctx.fill();
  ctx.fillStyle = '#0a0a12'; ctx.beginPath(); ctx.ellipse(r * 0.15, -r * 0.2, r * 0.3, r * 0.38, 0, 0, TAU); ctx.fill();
  const gl = 0.6 + Math.sin(game.runtime * 3) * 0.4;
  ctx.strokeStyle = st ? '#fff' : `rgba(170,140,230,${gl})`; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.4, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -r * 0.2); ctx.lineTo(0, r * 0.6); ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.6, r * 0.5); ctx.lineTo(r * 1.4, -r * 1.0); ctx.stroke();
  ctx.fillStyle = st ? '#fff' : `rgba(200,170,255,${gl})`; ctx.beginPath(); ctx.arc(r * 1.4, -r * 1.15, r * 0.16, 0, TAU); ctx.fill();
  ctx.restore();
}

// Void Leech: a floating, half-visible horror of writhing tendrils and a gaping maw.
function drawVoidLeech(ctx, r, body, st, br, game) {
  ctx.save(); ctx.scale(br, br);
  ctx.globalAlpha = 0.78 + Math.sin(game.runtime * 3) * 0.18;
  ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + game.runtime * 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6); ctx.stroke(); }
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = st ? '#fff' : '#0a0010'; ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = st ? '#fff' : '#6a3a8a'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.1 + r * 0.3, Math.sin(a) * r * 0.1); ctx.lineTo(Math.cos(a) * r * 0.42 + r * 0.3, Math.sin(a) * r * 0.42); ctx.stroke(); }
  const eg = 0.6 + Math.sin(game.runtime * 5) * 0.4;
  ctx.fillStyle = st ? '#fff' : `rgba(200,160,255,${eg})`; ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.1, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}