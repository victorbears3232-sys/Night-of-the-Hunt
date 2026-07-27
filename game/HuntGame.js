// HuntGame.js — original dark gothic action RPG engine (canvas 2D)
// "The Drowned Vicar" vertical slice. Atmosphere-first, aggressive melee combat.

import { recomputeStats } from './Charms.js';
import { drawBoss } from './BossRender.js';
import * as BossSystem from './BossSystem.js';
import Environment from './Environment.js';
import buildWorld from './World.js';
import * as MapSys from './MapSystem.js';
import { NPCS, RELICS, CHARM_EFFECTS } from './NPCs.js';
import * as NpcSys from './NpcSystem.js';
import { drawSanctuaryProps } from './SanctuaryRender.js';
import * as EnemySys from './EnemySystem.js';
import * as WorldEvents from './WorldEvents.js';
import * as Indicators from './Indicators.js';
import * as Aftermath from './Aftermath.js';
import * as Endgame from './Endgame.js';
import { updateBossIntro } from './BossIntro.js';
import * as Save from './SaveSystem.js';
import * as SecretBosses from './SecretBosses.js';
import * as WeaponSkins from './WeaponSkins.js';
import * as Souls from './Souls.js';
import { getOutfit } from './Outfits.js';
import * as Memory from './MemorySystem.js';
import * as Bestiary from './Bestiary.js';
import * as Tutorial from './Tutorial.js';
import * as Underworld from './Underworld.js';
import * as Celestial from './CelestialEnding.js';
import { drawPlayer } from './PlayerRender.js';
import { drawEnemyFigure } from './EnemyRender.js';
import { drawObjectiveBeam } from './Objectives.js';
import { updateLowHealth, drawLowHealth } from './LowHealthFx.js';
import { drawBossIntroCard } from './BossIntroCard.js';
import { drawDoors } from './Doors.js';
import { drawEnvDetails } from './EnvDetails.js';
import { drawLanterns, drawNotes, drawChests } from './WorldPropsRender.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

import SoundBank from './SoundBank.js';
import * as Achievements from './Achievements.js';

// ---------- Player ----------
function makePlayer() {
  return {
    x: 3450, y: 5090, r: 13, speed: 165,
    hp: 100, maxHp: 100,
    stamina: 100, maxStamina: 100, staminaRegenDelay: 0, staminaRegen: 34,
    facing: 0, aimAngle: 0,
    // stats
    level: 1, essence: 0, needed: 120,
    vit: 10, end: 10, str: 10, skl: 10, arc: 10,
    // weapon
    mode: 'sword', // 'sword' | 'scythe'
    comboCount: 0, comboTimer: 0,
    swing: null, // {t, dur, type, mode, hitSet, angle, reach, arc, dmg, knock, charged}
    transformQueued: false,
    // states
    dodge: null, // {t, dur, dir, iframes}
    invuln: 0,
    recovering: 0, // attack recovery lockout
    charging: 0, chargeTime: 0,
    firing: 0,
    staggered: 0,
    staggerMeter: 0, staggerImmune: 0,   // rapid-hit stagger system
    visceraling: null, // {t, target}
    locked: null, // target ref
    hurtFlash: 0,
    bloodlust: 0, // heals on visceral
    footstep: 0,
    bloodVials: 5, maxBloodVials: 20,
    bullets: 20, maxBullets: 20,
    weaponLvl: 0,
    healAnim: 0,
    nearLantern: false,
    nearNote: null,
    nearChest: null,
    hpBonus: 0, staminaBonus: 0,
    charms: new Set(), passives: new Set(),
    souls: new Set(),                     // permanent boss souls owned
    fury: 0,                               // Predator Soul: Hunter's Fury timer
    equipped: [], molotovs: 5, maxMolotovs: 10,
    shards: 0,                       // Bloodstone Shards — weapon-upgrade material
    outfits: new Set(['hunter_garb']), // cosmetic hunter outfits owned
    skins: new Set(['default']),       // cosmetic weapon skins owned
    skin: 'default',                   // currently equipped weapon skin (cosmetic only)
    outfit: 'hunter_garb',           // currently equipped outfit (cosmetic only)
    nearNpc: null,
    rallyHp: 0, rallyTimer: 0,        // Bloodbound Soul: recoverable health + window
  };
}

// ---------- Enemy factory ----------
const ENEMY_TYPES = {
  townsfolk: { name: 'Corrupted Townsfolk', hp: 60, speed: 60, r: 12, dmg: 14, reach: 34, arc: 1.4, atkWindup: 0.42, atkActive: 0.12, atkRecover: 0.5, sight: 320, color: '#7a6a5a', ess: 18, behavior: 'melee' },
  villager:  { name: 'Hollowed Villager', hp: 48, speed: 52, r: 11, dmg: 11, reach: 30, arc: 1.5, atkWindup: 0.38, atkActive: 0.1, atkRecover: 0.45, sight: 300, color: '#6b5d54', ess: 14, behavior: 'melee' },
  hound:     { name: 'Plague Hound', hp: 40, speed: 130, r: 10, dmg: 12, reach: 30, arc: 1.0, atkWindup: 0.22, atkActive: 0.1, atkRecover: 0.3, sight: 420, color: '#4a3b34', ess: 16, behavior: 'lunge' },
  priest:    { name: 'Grotesque Priest', hp: 95, speed: 48, r: 13, dmg: 20, reach: 0, arc: 0, atkWindup: 0.7, atkActive: 0.2, atkRecover: 0.8, sight: 360, color: '#8a6f5a', ess: 30, behavior: 'priest' },
  knight:    { name: 'Cursed Knight', hp: 135, speed: 70, r: 13, dmg: 24, reach: 40, arc: 1.3, atkWindup: 0.5, atkActive: 0.14, atkRecover: 0.6, sight: 340, color: '#56586a', ess: 34, behavior: 'melee' },
  crawler:   { name: 'Carrion Crawler', hp: 36, speed: 92, r: 9, dmg: 9, reach: 26, arc: 1.2, atkWindup: 0.3, atkActive: 0.1, atkRecover: 0.35, sight: 300, color: '#52483c', ess: 10, behavior: 'melee' },
  watcher:   { name: 'Eldritch Watcher', hp: 75, speed: 40, r: 12, dmg: 18, reach: 0, arc: 0, atkWindup: 0.9, atkActive: 0.3, atkRecover: 1.0, sight: 460, color: '#3a4a55', ess: 28, behavior: 'ranged' },
  brute:     { name: 'Carrion Brute', hp: 220, speed: 46, r: 17, dmg: 32, reach: 46, arc: 1.6, atkWindup: 0.7, atkActive: 0.18, atkRecover: 0.8, sight: 360, color: '#43352c', ess: 50, behavior: 'melee' },
};
// Merge new archetypes from EnemySystem into the engine's type table.
for (const k in EnemySys.TYPES) ENEMY_TYPES[k] = EnemySys.TYPES[k];

function makeEnemy(type, x, y) {
  const t = ENEMY_TYPES[type] || ENEMY_TYPES.townsfolk;
  return {
    type, name: t.name, x, y, r: t.r,
    hp: t.hp, maxHp: t.hp, speed: t.speed, dmg: t.dmg, reach: t.reach, arc: t.arc,
    atkWindup: t.atkWindup, atkActive: t.atkActive, atkRecover: t.atkRecover, sight: t.sight,
    color: t.color, ess: t.ess, behavior: t.behavior,
    state: 'idle', stateT: 0, facing: 0, attackPhase: null, // 'windup'|'active'|'recover'
    vx: 0, vy: 0, knock: 0, staggered: 0, parryWindow: 0, hitFlash: 0,
    wanderDir: rand(0, TAU), wanderT: rand(1, 3),
    fireCool: rand(0.5, 2), alive: true, spawnX: x, spawnY: y,
  };
}

// ---------- Main Engine ----------
export default class HuntGame {
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks;
    this.sound = new SoundBank();
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, rdown: false, rheld: false };
    this.camera = { x: 0, y: 0, shake: 0 };
    this.state = 'intro'; // intro | playing | bossIntro | bossActive | dead | victory | levelup
    this.msg = null; // {text, t}
    this.boss = null;
    this.defeatedBosses = new Set();
    this.encounteredBosses = new Set();
    this.openGates = new Set();
    this.lastLantern = null;
    this.ngPlus = false;
    this.runDeaths = 0;
    this.gameCompleted = false;
    this._hpScale = 1; this._dmgScale = 1; this._xpScale = 1;
    // World map / fog of war
    this.mapOpen = false;
    this.sectorSize = 280;
    this.revealed = new Set();          // revealed map sectors "cx,cy"
    this.discoveredRegions = new Set(); // region ids the player has entered
    this.collectedFragments = new Set();
    this.fragments = [];
    this.regions = [];
    this.last = 0;
    this.rainDrops = [];
    this.fogPuffs = [];
    this.particles = [];
    this.projectiles = [];
    this.pickups = [];
    this.damageNumbers = [];
    this.hitstop = 0;
    this.slowmo = 0;
    this.runtime = 0;
    this.speedrunMs = 0;       // live speedrun timer (active play only)
    this.speedrunFinalMs = 0;  // recorded on final-boss defeat
    this._runActive = false;
    this.shockwaves = [];
    this.bloodStains = [];
    this.corpses = [];
    this.pools = [];
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this._bind();
  }

  _bind() {
    this._onKey = (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = e.type === 'keydown';
      if (this.transition) return;   // lock all input during area transition
      if (this.pauseReason === 'fragment' || this.pauseReason === 'keyReward') return;  // the Map Fragment + key reward screens capture all input
      if ((this.pauseReason === 'pause' || this.pauseReason === 'mapTable') && k !== 'escape') return;  // pause menu & map table capture input
      if (e.type === 'keydown') {
        if (k === 'escape') {
          if (this.mapOpen) this.toggleMap();
          else if (this.pauseReason === 'pause') this.closePause();
          else if (this.paused) NpcSys.closePauseOverlay(this);
          else if (this.state === 'playing' || this.state === 'bossActive') this.togglePause();
        }
        if (k === ' ' || k === 'spacebar') { e.preventDefault(); this.dodge(); }
        if (k === 'j') this.lightAttack();
        if (k === 'k') this.startHeavy();
        if (k === 'f') this.transform();
        if (k === 'r') this.fire();
        if (k === 'q') this.toggleLock();
        if (k === 'e') { if (this.paused) NpcSys.closePauseOverlay(this); else this.interact(); }
        if (k === 'v') this.useVial();
        if (k === 'u') this.openLevelUp();
        if (k === 'm') NpcSys.toggleQuestLog(this);
        if (k === 'l') NpcSys.toggleQuestLog(this);
        if (k === 'n') { const m = this.sound.toggleMute(); this.hooks.onMessage && this.hooks.onMessage(m ? 'Sound muted' : 'Sound on', 1200); }
        if (k === 'tab') { e.preventDefault(); this.toggleInventory(); }
        if (k === 'g') this.throwMolotov();
      } else {
        if (k === 'k') this.releaseHeavy();
      }
    };
    this._onMouse = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    };
    this._onDown = (e) => {
      this.sound.init();
      if (e.button === 0) { this.mouse.down = true; this.lightAttack(); }
      if (e.button === 2) { this.mouse.rdown = true; this.mouse.rheld = true; this.startHeavy(); }
    };
    this._onUp = (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) { this.mouse.rdown = false; this.mouse.rheld = false; this.releaseHeavy(); }
    };
    this._onContext = (e) => e.preventDefault();
    this._onResize = () => this.resize();
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKey);
    this.canvas.addEventListener('mousemove', this._onMouse);
    this.canvas.addEventListener('mousedown', this._onDown);
    window.addEventListener('mouseup', this._onUp);
    this.canvas.addEventListener('contextmenu', this._onContext);
    window.addEventListener('resize', this._onResize);
  }

  _spawnEnemy(type, x, y) { return makeEnemy(type, x, y); }
  _callForHelp(e) { EnemySys.callForHelp(this, e); }

  start() {
    this.world = buildWorld();
    this.player = makePlayer();
    this._curArea = 'hub';
    this.regions = this.world.regions || [];
    // The Hunter's Nightmare (and any other region marked safe) is an enemy-free
    // sanctuary: strip every spawn that falls inside it, so foes can never
    // appear in the hub/starting area under any circumstance.
    this.world.spawns = (this.world.spawns || []).filter(s => !this.inSafeZone(s.x, s.y));
    this.enemies = this.world.spawns.map(s => makeEnemy(s.type, s.x, s.y));
    this.fragments = (this.world.fragments || []).map(f => ({ ...f, collected: false }));
    this.env = new Environment(this.world.W, this.world.H);
    this.env.setSound(this.sound);
    this.resize();
    this._initAtmosphere();
    this.env.initParticles(this.viewW, this.viewH);
    this._pushMapState();
    NpcSys.initNpcs(this);
    this.sanctuaryProps = this.world.sanctuaryProps || [];
    this.hubInfo = this.world.hub || null;
    this.worldEvents = WorldEvents.init(this);
    this.visitedLanterns = new Map();
    // The game begins in the Hunter's Nightmare. The mentor has charted the
    // first main-world lantern for the player, so the hub lantern can carry
    // them out to begin the Hunt.
    if (this.hubInfo) {
      this.lastLantern = { x: this.hubInfo.lantern.x, y: this.hubInfo.lantern.y };
      this.visitedLanterns.set('440,1380', { x: 440, y: 1380, name: 'The Last Lantern' });
      this._hubIntroDone = false;   // first hub-lantern use bears the player to the Hunt
      this.discoveredRegions.add('hub');   // the Nightmare is home — no discovery title on waking
      this._enteredAreas = new Set(['hub']);   // the hub is home — no arrival title on waking
      MapSys.loadPersistedMap(this);            // restore regions charted in a previous Hunt
      MapSys.pushMapState(this);
    }
    Achievements.init(this);
    Bestiary.init(this);
    Tutorial.init(this);
    this.last = performance.now();
    this._loop = (t) => {
      const dt = Math.min(0.033, (t - this.last) / 1000);
      this.last = t;
      this.update(dt);
      this.render();
      this._raf = requestAnimationFrame(this._loop);
    };
    this._raf = requestAnimationFrame(this._loop);
    this._pushHud();
  }

  stop() {
    cancelAnimationFrame(this._raf);
    if (this.sound && this.sound.updateLowHealth) this.sound.updateLowHealth(0);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKey);
    this.canvas.removeEventListener('mousemove', this._onMouse);
    this.canvas.removeEventListener('mousedown', this._onDown);
    window.removeEventListener('mouseup', this._onUp);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    window.removeEventListener('resize', this._onResize);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = w; this.viewH = h;
    this.lightCanvas.width = w; this.lightCanvas.height = h;
    if (this.env) this.env.initParticles(w, h);
  }

  _initAtmosphere() {
    this.rainDrops = [];
    for (let i = 0; i < 220; i++) this.rainDrops.push({ x: rand(-200, this.viewW + 200), y: rand(-this.viewH, this.viewH), len: rand(8, 18), sp: rand(900, 1300) });
    this.fogPuffs = [];
    for (let i = 0; i < 26; i++) this.fogPuffs.push({ x: rand(0, this.viewW), y: rand(0, this.viewH), r: rand(120, 280), vx: rand(-12, 12), vy: rand(-6, 6), a: rand(0.02, 0.07) });
  }

  // ---- player actions ----
  dodge() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0.2) return;
    if (p.stamina < 22) return;
    p.stamina -= 22; p.staminaRegenDelay = 0.5;
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    if (dx === 0 && dy === 0) { dx = Math.cos(p.facing); dy = Math.sin(p.facing); }
    const m = Math.hypot(dx, dy) || 1;
    p.dodge = { t: 0, dur: 0.42, dir: { x: dx / m, y: dy / m }, iframes: 0.3 + NpcSys.dodgeIframeBonus(this), dist: 78 * NpcSys.dodgeDistMult(this), _e: 0 };
    this.sound.dodge();
  }

  lightAttack() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.dodge || p.visceraling || p.staggered > 0) return;
    // visceral if a staggered enemy is in range
    if (p.locked && p.locked.staggered > 0 && dist2(p.x, p.y, p.locked.x, p.locked.y) < 50 * 50) {
      return this._visceral(p.locked);
    }
    const staggered = this.enemies.find(e => e.alive && e.staggered > 0 && dist2(p.x, p.y, e.x, e.y) < 52 * 52);
    if (staggered) return this._visceral(staggered);
    if (p.recovering > 0) return;
    if (p.stamina < 6) return;
    p.stamina -= 6; p.staminaRegenDelay = 0.35;
    p.comboCount = p.comboTimer > 0 ? (p.comboCount % 3) + 1 : 1;
    p.comboTimer = 0.8;
    const sword = p.mode === 'sword';
    const reach = (sword ? 46 : 58) * NpcSys.reachMult(this);
    const arc = sword ? 1.1 : 1.7;
    const dmg = ((sword ? 14 : 11) + p.str * 1.2 + p.weaponLvl * 4 + (p.comboCount === 3 ? p.skl * 0.8 : 0)) * NpcSys.dmgMult(this);
    p.swing = { t: 0, dur: sword ? 0.28 : 0.34, type: 'light', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach, arc, dmg, knock: sword ? 60 : 90, charged: false, dir: (p.comboCount % 2 === 0) ? -1 : 1 };
    p.recovering = p.swing.dur * 0.7 * Souls.attackSpeedMult(this);
    this.sound.swing();
  }

  startHeavy() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0) return;
    if (p.stamina < 8) return;
    p.charging = 1; p.chargeTime = 0;
  }
  releaseHeavy() {
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
    let dmg = ((sword ? 22 : 18) + p.str * 1.6 + p.weaponLvl * 3) * NpcSys.dmgMult(this);
    if (charged) dmg *= 1.8;
    p.swing = { t: 0, dur: sword ? 0.42 : 0.5, type: 'heavy', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach, arc, dmg, knock: sword ? 140 : 200, charged, dir: 1 };
    p.recovering = p.swing.dur * 0.8 * Souls.attackSpeedMult(this);
    this.sound.heavySwing();
    if (charged && Souls.has(this, 'earthshaker')) Souls.shockwaveStrike(this, p);
  }

  transform() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.staggered > 0 || p.visceraling) return;
    p.mode = p.mode === 'sword' ? 'scythe' : 'sword';
    // transform attack
    if (p.stamina >= 7) {
      p.stamina -= 7; p.staminaRegenDelay = 0.4;
      p.swing = { t: 0, dur: 0.34, type: 'transform', mode: p.mode, hitSet: new Set(), angle: p.aimAngle, reach: 56 * NpcSys.reachMult(this), arc: 1.9, dmg: (18 + p.str * 1.4 + p.weaponLvl * 5) * NpcSys.dmgMult(this), knock: 130, charged: false, dir: 1 };
      p.recovering = 0.28;
    }
    this.sound.transform();
  }

  fire() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0.15) return;
    if (p.firing > 0 || p.stamina < 5 || p.bullets <= 0) return;
    p.stamina -= 5; p.staminaRegenDelay = 0.3;
    p.bullets -= 1;
    p.firing = 0.25;
    const a = p.aimAngle;
    const sp = 620;
    this.projectiles.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, r: 4, fromPlayer: true, dmg: (8 + (p.arc + NpcSys.arcBonus(this)) * 0.8) * NpcSys.bulletDmgMult(this) });
    this.sound.shot();
    this.camera.shake = Math.max(this.camera.shake, 3);
    EnemySys.alertBySound(this);
  }

  toggleLock() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.locked && p.locked.alive) { p.locked = null; return; }
    let best = null, bd = 360 * 360;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist2(p.x, p.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (this.boss && this.boss.alive) {
      const d = dist2(p.x, p.y, this.boss.x, this.boss.y);
      if (d < 520 * 520 && d < bd) best = this.boss;
    }
    p.locked = best;
  }

  interact() {
    const p = this.player;
    if (this.paused) return;
    if (!this._memory && Endgame.tryInteract(this)) return;
    if (p.nearNpc) { NpcSys.talkNpc(this, p.nearNpc); return; }
    if (p.nearWorkshop) { this.openWorkshop(); return; }
    if (p.nearLantern) {
      // The very first time the player rests at the hub lantern, bear them out
      // to the Hunt as an intro — no menu. After that, the normal travel menu.
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
    if (p.nearMapTable) { NpcSys.toggleQuestLog(this); return; }
    if (p.nearNote) {
      this.hooks.onLore && this.hooks.onLore(p.nearNote.title, p.nearNote.text);
      if (!this.readNotes) this.readNotes = new Set();
      const k = p.nearNote.title;
      if (!this.readNotes.has(k)) {
        this.readNotes.add(k);
        const n = this.readNotes.size, rw = 40 + n * 15;
        p.essence += rw; this.sound.discover();
        this._showMsg('Lore recorded — +' + rw + ' essence', 1500);
        if (n === 8) { p.skl += 1; this._showMsg('Insight grows — Skill +1', 2200); }
        else if (n === 16) { p.arc += 1; this._showMsg('Insight grows — Arcane +1', 2200); }
        else if (n === 24) { p.vit += 1; p.maxHp = 100 + (p.vit - 10) * 14 + (p.hpBonus || 0); p.hp += 14; this._showMsg('Insight grows — Vitality +1', 2200); }
        this._pushHud();
      }
    }
  }

  _openChest(c) {
    if (c.opened) return;
    c.opened = true;
    this.sound.openChest();
    const p = this.player;
    if (c.type === 'essence') { const amt = c.ess || 250; p.essence += amt * NpcSys.essenceMult(this); this._showMsg(`Chest — ${amt} Essence`, 1600); this.sound.essence(); }
    else if (c.type === 'vials') { p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + 3); this._showMsg("Chest — 3 Hunter's Draughts", 1600); this.sound.heal(); }
    else if (c.type === 'bullets') { p.bullets = Math.min(p.maxBullets, p.bullets + 10); this._showMsg('Chest — 10 Quicksilver Bullets', 1600); this.sound.shot(); }
    else if (c.type === 'charm') { this._grantCharm(c.charmId); }
    else { p.shards += 2; this._showMsg('Chest — 2 Bloodstone Shards', 1800); this.sound.essence(); }
    this._burst(c.x, c.y, c.type === 'weapon' ? '#ffd27a' : c.type === 'charm' ? '#b48ad6' : '#c9a86a', 20, 180);
    this._pushHud();
  }

  openLevelUp() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    if (!this.player.nearLantern && this.state !== 'levelup') { this.hooks.onMessage && this.hooks.onMessage('Return to the Last Lantern to reflect.', 1600); return; }
    this.state = 'levelup';
    this._pushHud();
    this.hooks.onLevelUp && this.hooks.onLevelUp(true);
  }

  levelUp(stat) {
    const p = this.player;
    if (p.essence < p.needed) return false;
    p.essence -= p.needed;
    p[stat] += 1;
    p.level += 1;
    p.needed = Math.floor(p.needed * 1.35 + 20);
    p.maxHp = 100 + (p.vit - 10) * 14 + (p.hpBonus || 0);
    p.hp = p.maxHp;
    p.rallyHp = 0; p.rallyTimer = 0;
    recomputeStats(this);
    p.stamina = p.maxStamina;
    this._levelUpNotified = false;
    this.sound.levelup();
    this._pushHud();
    Save.saveGame(this);
    return true;
  }

  closeLevelUp() {
    this.state = this.boss ? 'bossActive' : 'playing';
    this.hooks.onLevelUp && this.hooks.onLevelUp(false);
    this._pushHud();
  }

  finishEnding() { Endgame.finishEnding(this); }
  startMemory(type) { Memory.startMemory(this, type); }

  useVial() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.bloodVials <= 0) { this.hooks.onMessage && this.hooks.onMessage('No blood vials remain.', 1200); return; }
    if (p.hp >= p.maxHp) { this.hooks.onMessage && this.hooks.onMessage('Health is already full.', 1000); return; }
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
  }

  // ---- combat helpers ----
  _visceral(target) {
    const p = this.player;
    const a = Math.atan2(target.y - p.y, target.x - p.x);
    // A cinematic ~1.5s finishing strike — full invincibility, 250% melee
    // damage, heavy slow-mo and blood on the killing blow.
    p.visceraling = { t: 0, dur: 1.5, target, phase: 'approach', struck: false, dir: a };
    p.recovering = 1.5;
    p.invuln = Math.max(p.invuln, 1.55);
    p.staminaRegenDelay = 0.8;
    p.locked = target;
    target.staggered = Math.max(target.staggered, 0.7);
    target.vx = 0; target.vy = 0;
    this.sound.visceralCharge();
    this.camera.shake = Math.max(this.camera.shake, 6);
  }

  _damageEnemy(e, dmg, knock, visceral = false, heavy = false, melee = false) {
    // During the final boss's phase-4 transformation, the First Beast is
    // invulnerable — the cinematic must play out before the last hunt resumes.
    if (e._transforming) return;
    if (!visceral) dmg = EnemySys.adjustDamage(this, e, dmg);
    dmg *= Souls.dmgMult(this);
    e.hp -= dmg;
    e.hitFlash = 0.15;
    const fa = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    // hit reaction — a visible flinch/recoil (visual only; bulkier foes resist)
    const resist = clamp(1 - (e.maxHp - 50) / 360, 0.35, 1);
    e.flinch = Math.max(e.flinch || 0, (heavy ? 0.28 : 0.16) * resist);
    e.flinchAngle = fa;
    if (knock) { e.vx += Math.cos(fa) * knock; e.vy += Math.sin(fa) * knock; }
    if (!visceral) {
      this._bloodSplash(e.x, e.y, fa, heavy ? 16 : 8, heavy);
      this._spark(e.x, e.y, fa, heavy ? 6 : 3);
    }
    this.damageNumbers.push({ x: e.x, y: e.y - 18, v: Math.round(dmg), t: 0, crit: visceral, heavy });
    if (melee && !visceral) Souls.onMeleeHit(this, e, dmg);
    if (e.hp <= 0 && e.alive) {
      // Elias's last health bar (phase 3) does not end him — it triggers his
      // transformation into the First Beast with a fresh health bar (phase 4).
      if (e === this.boss && e.type === 'final' && e.phase === 3 && !e._p4Started) {
        e._p4Started = true;
        Endgame.beginPhase4(this, e);
      } else {
        this._killEnemy(e);
      }
    } else if (!visceral) { if (e === this.boss) this.sound.bossHit(heavy); else this.sound.hit(heavy, clamp(e.maxHp / 120, 0.8, 2.0)); }
    if (e === this.boss) this.hooks.onBossHp && this.hooks.onBossHp(e.hp, e.maxHp);
  }

  _killEnemy(e) {
    e.alive = false; e.state = 'dead';
    Bestiary.recordKill(this, e);
    if (this.achStats) this.achStats.kills = (this.achStats.kills || 0) + 1;
    Souls.onKill(this, e);
    EnemySys.onKill(this, e);
    const da = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    this._bloodSplash(e.x, e.y, da, 18, true);
    this.bloodStains.push({ x: e.x, y: e.y, r: rand(16, 28), life: 16, max: 16 });
    if (this.bloodStains.length > 64) this.bloodStains.shift();
    this.corpses.push({ x: e.x, y: e.y, r: e.r, facing: e.facing, color: e.color, t: 0, dur: 1.5 });
    if (this.corpses.length > 18) this.corpses.shift();
    this.sound.enemyDeath(e.type);
    this._burst(e.x, e.y, '#7a0d0d', 18, 160);
    if (e !== this.boss && NpcSys.killHealChance(this) > 0 && Math.random() < NpcSys.killHealChance(this)) {
      const p = this.player, heal = Math.floor(p.maxHp * 0.12);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      this.damageNumbers.push({ x: p.x, y: p.y - 18, v: '+' + heal, t: 0, crit: false, heal: true });
    }
    if (!this._memory) {
      const isBoss = e === this.boss;
      this.pickups.push({ x: e.x, y: e.y, ess: isBoss ? Math.round(e.ess * (this._xpScale || 1)) : this._scaledEss(e), t: 0 });
      if (Math.random() < (isBoss ? 1 : 0.20)) this.pickups.push({ x: e.x + 12, y: e.y, vial: true, t: 0 });
      if (Math.random() < (isBoss ? 1 : 0.3)) this.pickups.push({ x: e.x - 12, y: e.y, bullet: true, t: 0 });
    }
    if (e === this.boss) { const b = this.boss; this.boss = null; this._onBossDefeated(b); }
  }

  // Essence scales with how deep the enemy lies in the world (further = more)
  // and how hardy it is (more health = more), so late-game foes reward more
  // without inflating early-game gains. Bosses pay their flat bounty instead.
  _scaledEss(e) {
    const depth = Math.hypot(e.spawnX - 440, e.spawnY - 1380);
    const depthFactor = 1 + Math.min(0.9, depth / 5800);
    const hpFactor = 1 + Math.min(0.7, Math.max(0, e.maxHp - 50) / 240);
    return Math.round(e.ess * depthFactor * hpFactor * (this._xpScale || 1));
  }

  _burst(x, y, color, n, sp) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(sp * 0.3, sp); this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.8), max: 0.8, r: rand(1.5, 4), color }); }
  }
  // Directional blood spray (arcs away from the blow) + a lingering ground stain.
  _bloodSplash(x, y, dirAngle, amount, heavy) {
    const cols = heavy ? ['#8b1a1a', '#6a0d0d', '#a22020', '#5a0a0a'] : ['#7a0d0d', '#5a0c0c', '#6a0d0d'];
    for (let i = 0; i < amount; i++) {
      const spread = heavy ? 1.7 : 1.2;
      const a = dirAngle + rand(-spread, spread);
      const sp = rand(70, heavy ? 340 : 220);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(10, heavy ? 90 : 50), life: rand(0.3, heavy ? 1.0 : 0.7), max: heavy ? 1.0 : 0.7, r: rand(1.4, heavy ? 5 : 3.2), color: cols[i % cols.length], blood: true });
    }
    this.bloodStains.push({ x: x + rand(-6, 6), y: y + rand(-4, 4), r: rand(heavy ? 12 : 7, heavy ? 28 : 18), life: heavy ? 11 : 7, max: heavy ? 11 : 7 });
    if (this.bloodStains.length > 64) this.bloodStains.shift();
  }
  // Bright steel-on-flesh contact sparks + a brief flash at the strike point.
  _spark(x, y, dirAngle, n) {
    for (let i = 0; i < n; i++) {
      const a = dirAngle + rand(-0.7, 0.7);
      const sp = rand(120, 260);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.12, 0.3), max: 0.3, r: rand(1, 2.4), color: i % 3 ? '#ffd9a0' : '#fff', spark: true });
    }
    this.particles.push({ x, y, vx: 0, vy: 0, life: 0.08, max: 0.08, r: 7, color: 'rgba(255,240,210,0.9)', flash: true });
  }

  _hurtPlayer(dmg, fromX, fromY, attacker = null) {
    const p = this.player;
    if (p.invuln > 0 || (p.dodge && p.dodge.t < p.dodge.iframes)) return;
    Souls.onHurt(this, attacker);
    const hpBefore = p.hp;
    p.hp -= dmg * NpcSys.hurtMult(this) * Souls.hurtMult(this); p.hurtFlash = 0.4; p.invuln = 0.6;
    this._addStagger(1);
    // Rally (Bloodbound Soul): a portion of recently lost health is temporarily
    // recoverable if the Hunter strikes back quickly with melee.
    if (Souls.has(this, 'bloodbound') && p.hp > 0) {
      const lost = hpBefore - p.hp;
      // Bloodhound Soul (Rally) balance: a tight 1s window forces an immediate
      // counterattack, and the recoverable pool is capped at 50% of the loss so
      // rapid attacks can never erase more than half a single hit's damage.
      if (lost > 0) { p.rallyHp = Math.min(p.maxHp - p.hp, lost * 0.5); p.rallyTimer = 1.0; }
    }
    if (fromX !== undefined) { const a = Math.atan2(p.y - fromY, p.x - fromX); p.vx = Math.cos(a) * 120; p.vy = Math.sin(a) * 120; }
    this.camera.shake = Math.max(this.camera.shake, 8);
    this.sound.hurt();
    this._burst(p.x, p.y, '#5a0c0c', 10, 120);
    if (p.hp <= 0) { p.hp = 0; this._die(); }
  }

  // Player stagger: rapid hits build a meter; crossing the threshold briefly
  // staggers the hunter. A recovery window prevents stun-locking.
  _addStagger(amt) {
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
    }
  }

  _die() {
    if (this._memory) { Memory.endMemory(this, false); return; }
    this.runDeaths = (this.runDeaths || 0) + 1;
    this.sound.stopBossTheme();
    // Souls-like XP recovery: drop all unspent essence where the Hunter fell.
    // A previous unrecovered bloodstain is lost, replaced by this one.
    const p = this.player;
    this.deathMarker = p.essence > 0 ? { x: p.x, y: p.y, essence: Math.floor(p.essence) } : null;
    if (this.deathMarker) { p.essence = 0; this._showMsg('Your essence spills where you fell.', 2400); }
    this.state = 'dead';
    this.sound.death();
    Save.saveGame(this);
    this._pushMapState();
    this.hooks.onState && this.hooks.onState('dead');
    this._pushHud();
  }

  _onBossDefeated(b) {
    if (this._memory) { Memory.endMemory(this, true); return; }
    if (SecretBosses.onDefeated(this, b)) return;
    this.sound.stopBossTheme();
    this.pools = []; this.shockwaves = [];
    this.defeatedBosses.add(b.type);
    this.lastDefeatedBoss = b.type;
    this.hooks.onBossEnd && this.hooks.onBossEnd();
    if (Endgame.allDefeated(this) && b.type !== 'final' && !this._allSlain) {
      this._allSlain = true;
      const g = this;
      setTimeout(() => {
        if (g.hooks.onEpicMessage) g.hooks.onEpicMessage("Something has changed...\nReturn to the Hunter's Nightmare.");
        if (g.sound) g.sound.bossPhase();
        g.camera.shake = Math.max(g.camera.shake, 14);
      }, 2600);
    }
    Aftermath.markCleared(this, b);
    if (b.type === 'vicar') {
      this._openGate('vicar_gate');
      this._openGate('vicar_shortcut');
      this._burst(b.x, b.y, '#3aa0c0', 40, 280);
      this._showMsg('Prey Slain — The Drowned Vicar', 2400);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
    } else if (b.type === 'gascoigne') {
      this._openGate('gascoigne_gate');
      this._openGate('gascoigne_shortcut');
      this._burst(b.x, b.y, '#c0482a', 40, 280);
      this._showMsg('Prey Slain — Father Gascoigne', 2400);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
    } else if (b.type === 'mire') {
      this._burst(b.x, b.y, '#2a9aa0', 50, 300);
      this.player.shards += 3;
      this._showMsg('Prey Slain — The Mire Mother — 3 Bloodstone', 2600);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
      setTimeout(() => { if (this.state === 'playing') { this.sound.lantern(); this._showMsg('A lantern ignites in the Sunken Cathedral.', 3000); } }, 1500);
    } else if (b.type === 'hollow_king') {
      this._burst(b.x, b.y, '#f0d060', 70, 340);
      this.player.shards += 5;
      this._showMsg('Prey Slain — The Hollow King — 5 Bloodstone', 2600);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
      setTimeout(() => { if (this.state === 'playing') { this.sound.lantern(); this._showMsg('A lantern ignites in the Overlook Cathedral.', 3000); } }, 1500);
    } else if (b.type === 'archivist') {
      this._burst(b.x, b.y, '#e0c060', 70, 340);
      this.player.shards += 5;
      this._openGate('archivist_unlock');
      this._showMsg('Prey Slain — The Archivist — the sealed stacks yawn open', 2800);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
    } else if (b.type === 'nightmare') {
      this._openGate('nightmare_gate');
      this._burst(b.x, b.y, '#a06ad6', 50, 300);
      this.player.shards += 3;
      this._showMsg('Prey Slain — The Nightmare — 3 Bloodstone', 2600);
      this.sound.victory();
      this.state = 'playing';
      this.hooks.onState && this.hooks.onState('playing');
    } else if (b.type === 'final') {
      Endgame.onDefeated(this, b);
    } else if (b.type === 'celestial') {
      Celestial.onDefeated(this, b);
    } else if (b.type === 'under_guardian') {
      Underworld.onGuardianDefeated(this, b);
    } else {
      this._burst(b.x, b.y, '#a06ad6', 60, 320);
      this._victory(b.name);
    }
    const soul = Souls.SOUL_BY_BOSS[b.type];
    if (soul && !(this.player.souls || (this.player.souls = new Set())).has(soul.id)) {
      this.player.souls.add(soul.id);
      this.soulReward = soul;
      this.hooks.onSoulReward && this.hooks.onSoulReward(soul);
      this.sound.soulReward && this.sound.soulReward();
      Save.saveGame(this);
    }
    this._pushHud();
  }

  _openGate(id) { this.openGates.add(id); this.sound.shortcutUnlock(); }

  _victory(name) {
    this.state = 'victory';
    this.sound.victory();
    this.hooks.onState && this.hooks.onState('victory');
    this.hooks.onVictory && this.hooks.onVictory(name || 'The Nightmare');
  }

  // Resting at a lantern returns every regular enemy to its spawn point with a
  // fresh AI state (traditional Soulslike respawn). Defeated major & secret
  // bosses never return — they're tracked in defeatedBosses / SecretBosses and
  // are only reachable again through the Memories system.
  _restAtLantern() {
    for (const e of this.enemies) {
      e.alive = true;
      e.hp = e.maxHp;
      e.x = e.spawnX; e.y = e.spawnY;
      e.state = 'idle'; e.stateT = 0; e.attackPhase = null;
      e.facing = 0; e.vx = 0; e.vy = 0; e.knock = 0;
      e.staggered = 0; e.parryWindow = 0; e.hitFlash = 0; e.flinch = 0; e._hit = false;
      e.wanderDir = Math.random() * TAU; e.wanderT = 1 + Math.random() * 2;
      e.fireCool = 0.5 + Math.random() * 1.5;
    }
    this.projectiles = []; this.shockwaves = []; this.pools = [];
    this.pickups = []; this.damageNumbers = []; this.corpses = [];
    NpcSys.onLanternRest(this);
  }

  respawn() {
    const p = this.player;
    const ll = this.lastLantern || { x: 440, y: 1380 };
    p.x = ll.x; p.y = ll.y + 30; p.hp = p.maxHp; p.stamina = p.maxStamina;
    if (p.bloodVials < 5) p.bloodVials = 5;
    if (p.bullets < 10) p.bullets = 10;
    if (p.molotovs < 3) p.molotovs = 3;
    p.invuln = 2; p.dodge = null; p.swing = null; p.visceraling = null;
    p.locked = null; p.staggered = 0; p.recovering = 0; p.charging = 0; p.healAnim = 0;
    p.nearNpc = null; p.rallyHp = 0; p.rallyTimer = 0; this.paused = false;
    this._restAtLantern();
    this.boss = null;
    this.projectiles = []; this.particles = []; this.pickups = []; this.damageNumbers = [];
    this.shockwaves = []; this.bloodStains = []; this.pools = [];
    this.state = 'playing';
    this.hooks.onState && this.hooks.onState('playing');
    this._pushHud();
  }

  toggleMap() {
    if (!this.mapOpen && this.state !== 'playing' && this.state !== 'bossActive' && this.state !== 'levelup') return;
    this.mapOpen = !this.mapOpen;
    this.hooks.onMapToggle && this.hooks.onMapToggle(this.mapOpen);
    if (this.mapOpen) this._pushMapState();
  }

  closeDialog() { NpcSys.closeDialog(this); }
  closeShop() { NpcSys.closeShop(this); }
  toggleQuestLog() { NpcSys.toggleQuestLog(this); }

  toggleInventory() {
    if (this.questLogOpen || (this.paused && this.pauseReason && this.pauseReason !== 'inventory')) return;
    if (!this.inventoryOpen && (this.state === 'bossIntro' || this.state === 'bossActive' || this.state === 'dead' || this.state === 'victory')) {
      if (this.state === 'bossActive') this._showMsg('Cannot consult your satchel mid-hunt.', 1200);
      return;
    }
    this.inventoryOpen = !this.inventoryOpen;
    this.paused = this.inventoryOpen;
    this.pauseReason = this.inventoryOpen ? 'inventory' : null;
    this.hooks.onInventoryToggle && this.hooks.onInventoryToggle(this.inventoryOpen);
    this.sound[this.inventoryOpen ? 'menuOpen' : 'menuClose']();
  }
  closeInventory() {
    this.inventoryOpen = false; this.paused = false; this.pauseReason = null;
    this.hooks.onInventoryToggle && this.hooks.onInventoryToggle(false);
    this.sound.menuClose();
  }
  togglePause() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    this.paused = !this.paused;
    this.pauseReason = this.paused ? 'pause' : null;
    this.hooks.onPauseToggle && this.hooks.onPauseToggle(this.paused);
    this.sound[this.paused ? 'menuOpen' : 'menuClose']();
    if (this.paused) Save.saveGame(this);
    this._pushHud();
  }
  closePause() {
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onPauseToggle && this.hooks.onPauseToggle(false);
    this.sound.menuClose();
    this._pushHud();
  }
  dismissSoulReward() {
    this.soulReward = null;
    this.hooks.onSoulReward && this.hooks.onSoulReward(null);
    this._pushHud();
  }
  // Dismiss the Map Fragment discovery screen and resume the Hunt.
  dismissFragmentDiscovery() {
    this._fragmentDiscovery = null;
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onFragmentDiscovery && this.hooks.onFragmentDiscovery(null);
    this._pushHud();
  }
  // A newly discovered charm — adds it and triggers the reward screen (deferred
  // if a menu is currently open so it never collides with a dialog).
  _grantCharm(id) {
    const p = this.player;
    if (!id || p.charms.has(id)) return false;
    p.charms.add(id);
    Save.saveGame(this);
    if (this.paused) { this._pendingCharmReward = id; return true; }
    this.charmReward = id;
    this.hooks.onCharmReward && this.hooks.onCharmReward(id);
    this.sound.charmFind && this.sound.charmFind();
    return true;
  }
  dismissCharmReward(openInv) {
    this.charmReward = null;
    this.hooks.onCharmReward && this.hooks.onCharmReward(null);
    this._pushHud();
    if (openInv) this.toggleInventory();
  }
  toggleCharm(id) {
    const p = this.player; if (!p.charms.has(id)) return;
    const i = p.equipped.indexOf(id);
    if (i >= 0) p.equipped.splice(i, 1);
    else if (p.equipped.length < 3) p.equipped.push(id);
    else { this._showMsg('No empty charm slot. Unequip one first.', 1400); return; }
    recomputeStats(this);
    this.sound.equipCharm();
    this._pushHud();
  }
  throwMolotov() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    const p = this.player;
    if (p.dodge || p.visceraling || p.staggered > 0 || p.recovering > 0.15) return;
    if (p.molotovs <= 0) { this._showMsg('No molotovs remain.', 1000); return; }
    p.molotovs--;
    const a = p.aimAngle;
    this.projectiles.push({ molotov: true, x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250 - 130, life: 1.4, r: 5, fromPlayer: true, color: '#e07020' });
    this.sound.shot();
    this.camera.shake = Math.max(this.camera.shake, 2);
    this._pushHud();
  }
  _explodeMolotov(pr) {
    const radius = 92 * NpcSys.molotovRadiusMult(this);
    const dmg = (55 + this.player.arc * 2) * NpcSys.molotovDmgMult(this);
    this._burst(pr.x, pr.y, '#e07020', 32, 220);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; this.particles.push({ x: pr.x, y: pr.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, life: 0.5, max: 0.5, r: 3, color: '#ffb050' }); }
    this.camera.shake = Math.max(this.camera.shake, 8);
    this.sound.bossRoar();
    const targets = [...this.enemies.filter(e => e.alive), ...(this.boss && this.boss.alive ? [this.boss] : [])];
    for (const e of targets) {
      const d = Math.hypot(e.x - pr.x, e.y - pr.y);
      if (d < radius + e.r) { const fall = 1 - d / (radius + e.r); this._damageEnemy(e, dmg * (0.5 + 0.5 * fall), 130); }
    }
  }

  buyItem(item) {
    const p = this.player;
    if (p.essence < item.price) { this._showMsg('Not enough essence.', 1000); return false; }
    p.essence -= item.price;
    if (item.effect === 'vials') p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + item.amount);
    else if (item.effect === 'bullets') p.bullets = Math.min(p.maxBullets, p.bullets + item.amount);
    else if (item.effect === 'maxvials') { p.maxBloodVials += item.amount; p.bloodVials += item.amount; }
    else if (item.effect === 'maxbullets') { p.maxBullets += item.amount; p.bullets += item.amount; }
    else if (item.effect === 'molotovs') { p.molotovs = Math.min(p.maxMolotovs, p.molotovs + item.amount); }
    else if (item.effect === 'stamina') { p.staminaBonus += item.amount; p.maxStamina += item.amount; p.stamina += item.amount; }
    else if (item.effect === 'hp') { p.hpBonus += item.amount; p.maxHp += item.amount; p.hp += item.amount; }
    this.sound.essence();
    this._pushHud();
    this.hooks.onShop && this._shopNpc && this.hooks.onShop({ def: this._shopNpc.def, npc: this._shopNpc });
    return true;
  }

  fastTravel(x, y) {
    if (this.questLogOpen) NpcSys.toggleQuestLog(this);
    else if (this.mapOpen) this.toggleMap();
    this._restAtLantern();
    this.startTransition(() => {
      const p = this.player;
      p.x = x; p.y = y; p.invuln = 1.2; p.dodge = null;
      this.camera.x = x - this.viewW / 2; this.camera.y = y - this.viewH / 2;
      this.sound.teleport();
      this._showMsg('The lantern bears you home.', 1600);
    }, 'Teleporting...');
  }

  // ---- lantern rest menu (level up / inventory / travel) ----
  // Interacting with a lantern first asks the hunter to confirm the rest, since
  // resting restores health & healing items but returns every defeated non-boss
  // enemy to its post. Confirming performs the rest, then opens the rest menu.
  promptLanternRest() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    let rest = null;
    for (const l of this.world.lanterns) {
      if (l.rest && dist2(this.player.x, this.player.y, l.x, l.y) < 80 * 80) { rest = l; break; }
    }
    if (!rest) return;
    this._pendingRestLantern = rest;
    this.paused = true;
    this.pauseReason = 'restwarn';
    this.hooks.onLanternRestWarning && this.hooks.onLanternRestWarning({ name: rest.name });
    this._pushHud();
  }
  confirmRest() {
    const p = this.player;
    p.hp = p.maxHp;
    p.stamina = p.maxStamina;
    if (p.bloodVials < 5) p.bloodVials = 5;
    if (p.bullets < 10) p.bullets = 10;
    if (p.molotovs < 3) p.molotovs = 3;
    p.rallyHp = 0; p.rallyTimer = 0;
    this._restAtLantern();
    this._pendingRestLantern = null;
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onLanternRestWarning && this.hooks.onLanternRestWarning(null);
    this.sound.heal();
    this.openLanternRest();
  }
  cancelRest() {
    this._pendingRestLantern = null;
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onLanternRestWarning && this.hooks.onLanternRestWarning(null);
    this._pushHud();
  }

  openLanternRest() {
    if (this.state !== 'playing' && this.state !== 'bossActive') return;
    let rest = null;
    for (const l of this.world.lanterns) {
      if (l.rest && dist2(this.player.x, this.player.y, l.x, l.y) < 80 * 80) { rest = l; break; }
    }
    if (!rest) return;
    const isHub = !!rest.hub;
    const lanterns = isHub
      ? Array.from(this.visitedLanterns.values()).filter(l => !(l.x === rest.x && l.y === rest.y))
      : [];
    this.paused = true;
    this.pauseReason = 'lantern';
    this.hooks.onLanternRest && this.hooks.onLanternRest({ name: rest.name, isHub, lanterns });
    this._pushHud();
  }
  closeLanternRest() {
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onLanternRest && this.hooks.onLanternRest(null);
    this._pushHud();
  }
  lanternReflect() {
    this.closeLanternRest();
    this.openLevelUp();
  }
  lanternOpenInventory() {
    this.closeLanternRest();
    this.toggleInventory();
  }

  // ---- workshop (weapon reinforcement) ----
  openWorkshop() {
    if (this.state !== 'playing') return;
    this.paused = true;
    this.pauseReason = 'workshop';
    this.hooks.onWorkshop && this.hooks.onWorkshop(true);
    this._pushHud();
  }
  closeWorkshop() {
    this.paused = false;
    this.pauseReason = null;
    this.hooks.onWorkshop && this.hooks.onWorkshop(false);
    this._pushHud();
  }

  // ---- outfit shop (cosmetic hunter garb) ----
  closeOutfitShop() {
    this.paused = false;
    this.pauseReason = null;
    this._outfitNpc = null;
    this.hooks.onOutfitShop && this.hooks.onOutfitShop(null);
    this._pushHud();
  }
  buyOutfit(id) {
    const o = getOutfit(id);
    if (!o) return false;
    const p = this.player;
    if (p.outfits.has(id)) return false;
    if (o.unlock && !o.unlock(this)) { this._showMsg('That garb is not yet yours to wear.', 1500); return false; }
    if (p.essence < (o.price || 0)) { this._showMsg('Not enough essence.', 1000); return false; }
    p.essence -= (o.price || 0);
    p.outfits.add(id);
    p.outfit = id;                       // auto-equip on purchase
    this.sound.upgradeWeapon();
    this._showMsg('Acquired: ' + o.name, 2000);
    this._pushHud();
    Save.saveGame(this);
    return true;
  }
  equipOutfit(id) {
    const o = getOutfit(id);
    if (!o || !this.player.outfits.has(id)) return false;
    this.player.outfit = id;
    this.sound.equipCharm();
    this._pushHud();
    Save.saveGame(this);
    return true;
  }
  buySkin(id) { const ok = WeaponSkins.buy(this, id); if (ok) Save.saveGame(this); return ok; }
  equipSkin(id) { const ok = WeaponSkins.equip(this, id); if (ok) Save.saveGame(this); return ok; }
  upgradeWeapon() {
    const p = this.player;
    const max = 10;
    if (p.weaponLvl >= max) { this._showMsg('The Saw Cleaver cannot be sharpened further.', 1800); return false; }
    const cost = 2 + p.weaponLvl * 2;
    if (p.shards < cost) { this._showMsg('Not enough Bloodstone Shards.', 1400); return false; }
    p.shards -= cost;
    p.weaponLvl += 1;
    this.sound.upgradeWeapon();
    this._burst(p.x, p.y, '#ffce6b', 18, 150);
    this._showMsg(`Saw Cleaver reinforced — +${p.weaponLvl}`, 2200);
    this._notifiedUpgradeTier = -1;   // re-evaluate so the next tier's notice fires
    this._pushHud();
    return true;
  }

  // ---- travel to/from the Hunter's Nightmare ----
  warpTo(x, y, msg) {
    this.startTransition(() => this._doWarp(x, y, msg), 'Teleporting...');
  }
  _doWarp(x, y, msg) {
    const p = this.player;
    p.x = x; p.y = y; p.invuln = 1.4; p.dodge = null; p.swing = null; p.locked = null;
    this.projectiles = []; this.shockwaves = []; this.pools = []; this.particles = [];
    this.camera.x = x - this.viewW / 2; this.camera.y = y - this.viewH / 2;
    this.sound.teleport();
    this._showMsg(msg, 1800);
    this._pushHud();
  }

  // ---- area transition: fade to black, warp at the peak, fade back in ----
  startTransition(midFn, label = 'Teleporting...') {
    if (this.transition) { if (midFn) midFn(); return; }
    this.transition = { phase: 'out', t: 0, dur: 0.7, label, midFn };
    this.hooks.onTransition && this.hooks.onTransition({ phase: 'out', t: 0, dur: 0.7, label });
  }
  _advanceTransition(dt) {
    const tr = this.transition;
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= tr.dur) { if (tr.midFn) tr.midFn(); Save.saveGame(this); tr.phase = 'in'; tr.t = 0; }
    else if (tr.phase === 'in' && tr.t >= tr.dur) { this.transition = null; }
    const cur = this.transition;
    this.hooks.onTransition && this.hooks.onTransition(cur ? { phase: cur.phase, t: cur.t, dur: cur.dur, label: cur.label } : null);
  }

  // ---- area discovery title card (driven by MapSystem on first entry) ----
  showAreaTitle(name) {
    this.sound.areaTitle();
    this.hooks.onAreaTitle && this.hooks.onAreaTitle(name);
  }
  travelToHub() {
    if (!this.hubInfo) return;
    this.closeLanternRest();
    this._restAtLantern();
    this.warpTo(this.hubInfo.lantern.x, this.hubInfo.lantern.y + 30, "The lantern bears you to the Hunter's Nightmare.");
  }
  travelToWorldLantern(x, y) {
    this.closeLanternRest();
    this._restAtLantern();
    this.warpTo(x, y + 30, 'The lantern bears you back to the Hunt.');
  }

  beginGame(fromSave) {
    this.state = 'playing';
    this.sound.init();
    this.speedrunMs = 0;
    this.speedrunFinalMs = 0;
    this._runActive = true;
    this._curArea = 'hub';
    this.sound.setArea('hub', "The Hunter's Nightmare");
    this.hooks.onState && this.hooks.onState('playing');
    this._pushHud();
    NpcSys.pushQuestState(this);
    if (fromSave) {
      const save = Save.loadSave();
      if (save && Save.applySave(this, save)) {
        this._setupDifficulty();
        this._applyDifficulty();
        this.camera.x = this.player.x - this.viewW / 2;
        this.camera.y = this.player.y - this.viewH / 2;
        this._showMsg(this.ngPlus ? 'The Hunt resumes — New Game+.' : 'The Hunt resumes.', 2200);
        return;
      }
    }
    if (!fromSave) this.runDeaths = 0;
    this._setupDifficulty();
    this._applyDifficulty();
    this._showMsg("The Hunter's Nightmare", 2600);
    // The mentor meets the player before they enter the world.
    const elias = this.npcs.find(n => n.def.mentor);
    if (elias) setTimeout(() => { if (this.state === 'playing') NpcSys.talkNpc(this, elias); }, 600);
  }

  // ---- New Game+ difficulty scaling (+25% HP/damage, +35% XP) ----
  _setupDifficulty() {
    this._hpScale = this.ngPlus ? 1.25 : 1;
    this._dmgScale = this.ngPlus ? 1.25 : 1;
    this._xpScale = this.ngPlus ? 1.35 : 1;
  }
  _applyDifficulty() {
    for (const e of this.enemies) {
      if (e._scaled) continue;
      e.maxHp = Math.round(e.maxHp * this._hpScale);
      // Southern continent enemies are tougher — by the time players reach the
      // south they have several upgrades, so foes there hit harder and survive more.
      if (e.spawnY > 2000) e.maxHp = Math.round(e.maxHp * 1.4);
      e.hp = e.maxHp;
      e.dmg = Math.round(e.dmg * this._dmgScale);
      if (e.spawnY > 2000) {
        e.dmg = Math.round(e.dmg * 1.25);
        e.sight = Math.round(e.sight * 1.15);
        e.speed = Math.round(e.speed * 1.08);
      }
      e._scaled = true;
    }
  }

  // ---- New Game+: keep progression, replay the story at higher difficulty ----
  beginNewGamePlus() {
    const p = this.player;
    // NG+ is launched from the title screen, where the live player is a fresh
    // lvl-1 hunter. Restore the earned progression from the completed save so
    // the kept stats reflect the player's actual progression, not a blank state.
    const freshStart = (!p.souls || p.souls.size === 0) && p.level === 1;
    if (freshStart) {
      const save = Save.loadSave();
      if (save && save.player) Save.applySave(this, save);
    }
    const keep = {
      level: p.level, essence: p.essence, needed: p.needed,
      vit: p.vit, end: p.end, str: p.str, skl: p.skl, arc: p.arc,
      weaponLvl: p.weaponLvl, skin: p.skin || 'default',
      charms: new Set(p.charms), equipped: [...(p.equipped || [])], passives: new Set(p.passives || []),
      outfits: new Set(p.outfits), skins: new Set(p.skins || ['default']), outfit: p.outfit || 'hunter_garb',
      souls: new Set(p.souls || []), fury: 0,
      hpBonus: p.hpBonus || 0, staminaBonus: p.staminaBonus || 0,
      maxBloodVials: p.maxBloodVials, maxBullets: p.maxBullets, maxMolotovs: p.maxMolotovs,
      bloodVials: p.bloodVials, bullets: p.bullets, molotovs: p.molotovs, shards: p.shards || 0,
      rallyHp: 0, rallyTimer: 0,
    };
    p.x = 3450; p.y = 5090;
    p.mode = 'sword'; p.invuln = 2; p.dodge = null; p.swing = null; p.visceraling = null;
    p.locked = null; p.staggered = 0; p.recovering = 0; p.charging = 0; p.comboCount = 0; p.comboTimer = 0;
    p.healAnim = 0; p.hurtFlash = 0; p.nearNpc = null;
    Object.assign(p, keep);
    p.charms = keep.charms; p.equipped = keep.equipped; p.passives = keep.passives;
    p.outfits = keep.outfits; p.skins = keep.skins; p.souls = keep.souls;
    recomputeStats(this);
    p.hp = p.maxHp; p.stamina = p.maxStamina;

    this.defeatedBosses = new Set();
    this.encounteredBosses = new Set();
    this.openGates = new Set();
    this.collectedFragments = new Set();
    this.discoveredRegions = new Set(['hub']);
    this.visitedLanterns = new Map();
    this.visitedLanterns.set('440,1380', { x: 440, y: 1380, name: 'The Last Lantern' });
    this.readNotes = new Set();
    this.boss = null;
    this._enteredAreas = new Set(['hub']);
    this.lastLantern = this.hubInfo ? { x: this.hubInfo.lantern.x, y: this.hubInfo.lantern.y } : null;
    this.finalGateOpened = false; this.eliasFinalTalked = false;
    this._allSlain = false; this._hubIntroDone = false; this._finalRevealedOnce = false;
    this.sealBroken = false; this.trueEnding = false; this._celestialRevealedOnce = false; this._celestialDefeated = false;
    this.ngPlus = true;
    this.runDeaths = 0;
    this.deathMarker = null;
    this.speedrunMs = 0; this.speedrunFinalMs = 0; this._runActive = true;

    this.enemies = this.world.spawns.map(s => this._spawnEnemy(s.type, s.x, s.y));
    (this.fragments || []).forEach(f => { f.collected = false; });
    (this.world.chests || []).forEach(c => { c.opened = false; });
    if (this.npcs) this.npcs.forEach(n => { n.stage = 0; n.talkedStage = -1; n.rewardClaimedStage = -1; n.movedToHub = false; });
    this.revealed = new Set();
    this.worldEvents = WorldEvents.init(this);
    MapSys.saveMap(this);
    MapSys.pushMapState(this);
    this._setupDifficulty();
    this._applyDifficulty();

    this.state = 'playing';
    this._curArea = 'hub';
    this.camera.x = p.x - this.viewW / 2; this.camera.y = p.y - this.viewH / 2;
    this.sound.setArea('hub', "The Hunter's Nightmare");
    this.sound.init();
    this.hooks.onEnding && this.hooks.onEnding(false);
    this.hooks.onState && this.hooks.onState('playing');
    this.hooks.onNewGamePlus && this.hooks.onNewGamePlus(true);
    this._showMsg('New Game+ — The Hunt begins anew.', 3000);
    Save.saveGame(this);
    this._pushHud();
    NpcSys.pushQuestState(this);
    // The mentor meets the player before they enter the world — same as a
    // first playthrough, so the hub-lantern intro warp triggers reliably.
    const elias = this.npcs.find(n => n.def.mentor);
    if (elias) setTimeout(() => { if (this.state === 'playing') NpcSys.talkNpc(this, elias); }, 600);
  }

  // ---- messages ----
  _showMsg(text, dur = 2400) {
    this.msg = { text, t: 0, dur };
    this.hooks.onMessage && this.hooks.onMessage(text, dur);
  }

  _pushHud() {
    if (!this.hooks.onHud) return;
    const p = this.player;
    this.hooks.onHud({
      hp: p.hp, maxHp: p.maxHp,
      stamina: p.stamina, maxStamina: p.maxStamina,
      essence: p.essence, needed: p.needed, level: p.level,
      vit: p.vit, end: p.end, str: p.str, skl: p.skl, arc: p.arc,
      mode: p.mode, locked: !!p.locked,
      bloodVials: p.bloodVials, maxBloodVials: p.maxBloodVials,
      bullets: p.bullets, maxBullets: p.maxBullets,
      weaponLvl: p.weaponLvl,
      charms: [...p.charms],
      equipped: [...(p.equipped || [])],
      molotovs: p.molotovs, maxMolotovs: p.maxMolotovs,
      shards: p.shards,
      rallyHp: p.rallyHp || 0,
      state: this.state,
    });
  }

  // ---------- UPDATE ----------
  update(dt) {
    this.runtime += dt;
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.05; }
    else if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.38; }
    // atmosphere always
    this._updateAtmosphere(dt);
    if (this.env) this.env.update(dt, this.runtime, this.viewW, this.viewH, this.camera);
    updateLowHealth(this, dt);
    if (!this._memory && this.worldEvents) WorldEvents.update(this, dt);
    if (this.msg) { this.msg.t += dt * 1000; if (this.msg.t > this.msg.dur) this.msg = null; }
    NpcSys.updateNpcs(this, dt);
    if (this.state !== 'intro' && this.player) {
      this._achTimer = (this._achTimer || 0) + dt;
      if (this._achTimer > 0.4) { this._achTimer = 0; Achievements.checkAll(this); }
    }
    Memory.updateFade(this, dt);
    Tutorial.update(this, dt);
    if (this.transition) { this._advanceTransition(dt); this._updateCamera(dt); return; }
    if (!this._memory && Endgame.update(this, dt)) { this._updateCamera(dt); return; }
    if (this.paused) { this._updateCamera(dt); return; }
    if (this.soulReward || this.charmReward) { this._updateCamera(dt); return; }
    if (this._pendingCharmReward) {
      this.charmReward = this._pendingCharmReward;
      this._pendingCharmReward = null;
      this.hooks.onCharmReward && this.hooks.onCharmReward(this.charmReward);
      this.sound.charmFind && this.sound.charmFind();
      this._updateCamera(dt); return;
    }
    if (this.mapOpen) { this._updateCamera(dt); return; }
    if (this.state === 'intro' || this.state === 'dead' || this.state === 'victory' || this.state === 'levelup') {
      this._updateCamera(dt);
      return;
    }
    if (this.state === 'bossIntro') { this._updateBossIntro(dt); this._updateCamera(dt); return; }

    // Speedrun timer — accumulates only during active play (menus, pauses,
    // transitions, cutscenes, and the ending have all returned above).
    if (this._runActive) this.speedrunMs += dt * 1000;
    this._saveTimer = (this._saveTimer || 0) + dt;
    if (this._saveTimer > 8) { this._saveTimer = 0; Save.saveGame(this); }

    // weapon-upgrade notice — fires once per tier when the forge materials are
    // ready, and re-checks the next tier automatically after each upgrade.
    {
      const p = this.player;
      if (p.weaponLvl < 10) {
        const cost = 2 + p.weaponLvl * 2;
        // _notifiedUpgradeTier tracks the tier last notified. When the player
        // upgrades, weaponLvl changes, so this no longer matches → the next tier
        // is re-evaluated and a fresh notice fires once its materials are gathered.
        if (this._notifiedUpgradeTier !== p.weaponLvl && p.shards >= cost) {
          this._notifiedUpgradeTier = p.weaponLvl;
          this.hooks.onUpgradeNotice && this.hooks.onUpgradeNotice({ tier: p.weaponLvl });
        }
      } else {
        this._notifiedUpgradeTier = -1;
      }
    }

    // level-up notice — fires once each time the hunter amasses enough essence to
    // reflect. Re-arms after a level-up (or if essence drops back below the cost)
    // so it can announce the next available level without spamming.
    {
      const p = this.player;
      if (p.essence >= p.needed) {
        if (!this._levelUpNotified) {
          this._levelUpNotified = true;
          this.hooks.onLevelUpNotice && this.hooks.onLevelUpNotice({ level: p.level + 1 });
        }
      } else {
        this._levelUpNotified = false;
      }
    }

    const p = this.player;
    // aim
    if (p.locked && p.locked.alive) {
      p.aimAngle = Math.atan2(p.locked.y - p.y, p.locked.x - p.x);
    } else if (p.locked && !p.locked.alive) {
      p.locked = null;
    } else {
      p.aimAngle = Math.atan2(this.mouse.worldY - p.y, this.mouse.worldX - p.x);
    }
    p.facing = p.aimAngle;

    this._updatePlayer(dt);
    this._updateSwing(dt);
    this._updateEnemies(dt);
    if (this.boss) this._updateBoss(dt);
    this._updateProjectiles(dt);
    this._updateShockwaves(dt);
    this._updatePools(dt);
    this._updatePickups(dt);
    this._updateParticles(dt);
    this._updateBloodStains(dt);
    this._updateCorpses(dt);
    this._updateDamageNumbers(dt);
    this._checkAreaTriggers();
    this._updateCamera(dt);
    this._pushHud();
  }

  _updatePlayer(dt) {
    const p = this.player;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.hurtFlash > 0) p.hurtFlash -= dt;
    if (p.firing > 0) p.firing -= dt;
    if (p.staggered > 0) p.staggered -= dt;
    if (p.staggerImmune > 0) p.staggerImmune -= dt;
    if (p.staggerMeter > 0) p.staggerMeter = Math.max(0, p.staggerMeter - dt * 0.6);
    if (p.comboTimer > 0) p.comboTimer -= dt;
    if (p.recovering > 0) p.recovering -= dt;
    if (p.healAnim > 0) p.healAnim -= dt;
    if (p.fury > 0) p.fury -= dt;
    // Rally window ticks down; once it expires, unrecovered health is lost.
    if (p.rallyTimer > 0) { p.rallyTimer -= dt; if (p.rallyTimer <= 0) { p.rallyTimer = 0; p.rallyHp = 0; } }
    p.rallyHp = Math.max(0, Math.min(p.rallyHp, p.maxHp - p.hp));

    // Forbidden Sigil — slow health regeneration
    if ((p.equipped || []).includes('forbidden_sigil') && p.hp < p.maxHp && p.invuln <= 0) {
      p.hp = Math.min(p.maxHp, p.hp + dt);
    }

    // charging
    if (p.charging) {
      p.chargeTime += dt;
      if (p.chargeTime > 1.2) p.chargeTime = 1.2;
    }

    // visceral attack — a phased, cinematic drive: approach → grab → strike → recover.
    if (p.visceraling) {
      const v = p.visceraling;
      v.t += dt;
      p.invuln = Math.max(p.invuln, v.dur - v.t + 0.05);  // invincible for the whole animation
      const a = v.dir;
      const grip = 26;
      if (v.target && v.target.alive) {
        const meetX = v.target.x - Math.cos(a) * grip;
        const meetY = v.target.y - Math.sin(a) * grip;
        const k = v.phase === 'recover' ? 0.25 : 0.4;
        p.x = lerp(p.x, meetX, k);
        p.y = lerp(p.y, meetY, k);
        if (v.phase !== 'recover') {
          v.target.x = lerp(v.target.x, p.x + Math.cos(a) * grip, 0.25);
          v.target.y = lerp(v.target.y, p.y + Math.sin(a) * grip, 0.25);
          v.target.facing = a + Math.PI;       // prey faces its killer
          v.target.vx = 0; v.target.vy = 0;
        }
      }
      if (v.phase === 'approach' && v.t > 0.30) v.phase = 'strike';
      if (v.phase === 'strike' && !v.struck && v.t > 0.34) {
        // the killing blow — 250% melee damage, dramatic slow-mo, enhanced blood
        v.struck = true;
        if (this.achStats) this.achStats.viscerals = (this.achStats.viscerals || 0) + 1;
        const baseMelee = 14 + p.str * 1.2 + p.weaponLvl * 2;
        const dmg = baseMelee * 3.75 * NpcSys.dmgMult(this);
        this._damageEnemy(v.target, dmg, 0, true, true);
        p.hp = Math.min(p.maxHp, p.hp + 14 + p.skl * 0.6);
        this._bloodSplash(v.target.x, v.target.y, a, 44, true);
        this._bloodSplash(v.target.x, v.target.y, a + 0.5, 22, true);
        this._bloodSplash(v.target.x, v.target.y, a - 0.5, 18, true);
        this._burst(v.target.x, v.target.y, '#8b1a1a', 26, 240);
        this.sound.visceral();
        this.camera.shake = Math.max(this.camera.shake, 18);
        this.hitstop = Math.max(this.hitstop, 0.14);
        this.slowmo = Math.max(this.slowmo || 0, 0.5);
      }
      if (v.phase === 'strike' && v.t > 0.50) v.phase = 'recover';
      if (v.t >= v.dur) {
        // Visceral finishes: clear the prey's stagger and grant a brief immune
        // window so it can't be re-staggered into another visceral (no infinite
        // chains). The strike costs half the Hunter's current stamina — a
        // committed, high-risk finisher, not a spammable one.
        if (v.target && v.target.alive) { v.target.staggered = 0; v.target.staggerImmune = Math.max(v.target.staggerImmune || 0, 4); }
        p.stamina = Math.max(0, p.stamina * 0.5);
        p.staminaRegenDelay = Math.max(p.staminaRegenDelay || 0, 1.2);
        p.visceraling = null;
      }
    }

    // movement
    let dx = 0, dy = 0;
    if (!p.visceraling && p.staggered <= 0) {
      if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
      if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    }
    let spd = p.speed;
    if (p.recovering > 0.05) spd *= 0.55;
    if (p.charging) spd *= 0.3;
    if (p.healAnim > 0.2) spd *= 0.45;

    if (p.dodge) {
      p.dodge.t += dt;
      if (p.dodge.t < p.dodge.dur) {
        // ease-out: a quick burst off the mark, then a smooth settle — same
        // total distance and duration, so timing/iframes are unchanged.
        const e1 = easeOutCubic(Math.min(1, p.dodge.t / p.dodge.dur));
        const step = p.dodge.dist * (e1 - (p.dodge._e || 0));
        p.x += p.dodge.dir.x * step;
        p.y += p.dodge.dir.y * step;
        p.dodge._e = e1;
        if (Souls.has(this, 'phantom')) Souls.phantomDash(this, p);
      }
      if (p.dodge.t >= p.dodge.dur) p.dodge = null;
    } else {
      const m = Math.hypot(dx, dy);
      if (m > 0) { dx /= m; dy /= m; p.x += dx * spd * dt; p.y += dy * spd * dt; p.footstep += dt * (spd / 40); if (p.footstep > 1) { p.footstep = 0; this.sound.footstep(this._curArea); this.particles.push({ x: p.x, y: p.y + 8, vx: 0, vy: 0, life: 0.3, max: 0.3, r: 2, color: 'rgba(120,120,140,0.3)' }); } }
    }

    // knockback velocity decay
    p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
    p.vx = (p.vx || 0) * Math.max(0, 1 - dt * 8);
    p.vy = (p.vy || 0) * Math.max(0, 1 - dt * 8);

    // collision with walls
    this._collideWalls(p);
    p.x = clamp(p.x, 40, this.world.W - 40);
    p.y = clamp(p.y, 40, this.world.H - 40);
    // sealed boss arena — cannot flee until the beast is slain
    if (this.boss && this.boss.alive) {
      const a = this.boss.arena;
      p.x = clamp(p.x, a.minX + p.r, a.maxX - p.r);
      p.y = clamp(p.y, a.minY + p.r, a.maxY - p.r);
    }

    // stamina regen
    if (p.staminaRegenDelay > 0) p.staminaRegenDelay -= dt;
    else if (!p.charging && p.stamina < p.maxStamina) p.stamina = Math.min(p.maxStamina, p.stamina + p.staminaRegen * NpcSys.staminaRegenMult(this) * Souls.staminaRegenMult(this) * dt);

    // near rest lantern?
    let restLantern = null;
    for (const l of this.world.lanterns) {
      if (l.rest && !(l.lockedBoss && !this.defeatedBosses.has(l.lockedBoss)) && dist2(p.x, p.y, l.x, l.y) < 80 * 80) { restLantern = l; break; }
    }
    p.nearLantern = !!restLantern;
    p.nearLanternName = restLantern ? restLantern.name : null;
    if (restLantern) {
      this.lastLantern = { x: restLantern.x, y: restLantern.y };
      const lkey = restLantern.x + ',' + restLantern.y;
      if (!this.visitedLanterns.has(lkey)) {
        this.visitedLanterns.set(lkey, { x: restLantern.x, y: restLantern.y, name: restLantern.name || 'Lantern' });
        MapSys.pushMapState(this);
      }
    }
    // near note?
    p.nearNote = null;
    for (const n of this.world.notes) { if (dist2(p.x, p.y, n.x, n.y) < 46 * 46) { p.nearNote = n; break; } }
    // near chest?
    p.nearChest = null;
    for (const c of this.world.chests) { if (!c.opened && dist2(p.x, p.y, c.x, c.y) < 40 * 40) { p.nearChest = c; break; } }
    // near map table (Sanctuary)?
    p.nearMapTable = false;
    for (const pr of (this.sanctuaryProps || [])) { if (pr.type === 'mapTable' && dist2(p.x, p.y, pr.x, pr.y) < 42 * 42) { p.nearMapTable = true; break; } }
    // near the Hunter's Nightmare workshop forge?
    p.nearWorkshop = false;
    if (this.hubInfo) {
      const w = this.hubInfo.workshop;
      if (dist2(p.x, p.y, w.x, w.y) < 52 * 52) p.nearWorkshop = true;
    }
    // near map fragment?
    p.nearFragment = null;
    for (const f of this.fragments) { if (!f.collected && !f.inChest && dist2(p.x, p.y, f.x, f.y) < 42 * 42) { p.nearFragment = f; break; } }
    // near NPC?
    p.nearNpc = null;
    for (const n of this.npcs) {
      const st = n.def.stages[n.stage];
      if (st.gone) continue;
      const pos = NpcSys.npcStagePos(n);
      if (dist2(p.x, p.y, pos.x, pos.y) < 46 * 46) { p.nearNpc = n; break; }
    }
    // relic walkover collection
    for (const r of this.relics) {
      if (!r.collected && dist2(p.x, p.y, r.x, r.y) < 24 * 24) NpcSys.collectRelic(this, r);
    }
    // Souls-like: reclaim dropped essence by walking over the bloodstain.
    if (this.deathMarker && dist2(p.x, p.y, this.deathMarker.x, this.deathMarker.y) < 40 * 40) {
      const amt = this.deathMarker.essence;
      p.essence += amt;
      this.deathMarker = null;
      this._showMsg('Lost essence reclaimed — +' + amt, 2200);
      this.sound.essence();
      this._burst(p.x, p.y, '#b06ad6', 22, 200);
      this._pushHud();
      this._pushMapState();
      Save.saveGame(this);
    }
    // fog-of-war reveal
    if (!this._memory) MapSys.updateDiscovery(this);
    if (!this._memory) this._updateAreaAudio();
    if (!this._memory) Endgame.onPlayerUpdate(this);
  }

  _collectFragment(f) { MapSys.collectFragment(this, f); }
  _pushMapState() { MapSys.pushMapState(this); }

  // Drives the ambient music engine + lantern hum from the player's region.
  _updateAreaAudio() {
    const p = this.player;
    const r = this.regions.find(rr => p.x >= rr.x && p.x <= rr.x + rr.w && p.y >= rr.y && p.y <= rr.y + rr.h);
    const id = r ? r.id : this._curArea;
    if (id !== this._curArea) { this._curArea = id; this.sound.setArea(id, r ? r.name : ''); }
    if (p.nearLantern && !this.sound._lanternHum) this.sound.startLanternHum();
    else if (!p.nearLantern && this.sound._lanternHum) this.sound.stopLanternHum();
  }

  _updateSwing(dt) {
    const p = this.player;
    if (!p.swing) return;
    p.swing.t += dt;
    const s = p.swing;
    const prog = s.t / s.dur;
    // hit detection during active window
    const activeStart = 0.15, activeEnd = 0.75;
    if (prog >= activeStart && prog <= activeEnd) {
      const cur = s.angle + lerp(-s.arc / 2, s.arc / 2, prog) * (s.dir || 1);
      const heavy = s.type === 'heavy' || s.charged;
      const targets = [...this.enemies.filter(e => e.alive), ...(this.boss && this.boss.alive ? [this.boss] : [])];
      for (const e of targets) {
        if (s.hitSet.has(e)) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d > s.reach + e.r) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        if (Math.abs(angDiff(cur, a)) < s.arc / 2 + 0.25) {
          s.hitSet.add(e);
          this._damageEnemy(e, s.dmg, s.knock, false, heavy, true);
          if (s.charged) this.sound.crit();
          this.hitstop = Math.max(this.hitstop, s.charged ? 0.10 : heavy ? 0.075 : 0.045);
          this.camera.shake = Math.max(this.camera.shake, s.charged ? 9 : heavy ? 6 : 3);
        }
      }
    }
    if (s.t >= s.dur) p.swing = null;
  }

  _updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // Safe-zone guarantee: no enemy may exist inside the hub/starting area.
      if (this.inSafeZone(e.x, e.y)) { e.alive = false; continue; }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.flinch > 0) e.flinch -= dt;
      if (e.staggerImmune > 0) e.staggerImmune -= dt;
      // held in a visceral grab — the visceral drive pins it, skip AI here
      if (this.player.visceraling && this.player.visceraling.target === e) {
        e.vx *= Math.max(0, 1 - dt * 8); e.vy *= Math.max(0, 1 - dt * 8);
        e.x += e.vx * dt; e.y += e.vy * dt; this._collideWalls(e);
        continue;
      }
      if (e.staggered > 0) {
        e.staggered -= dt;
        e.vx *= Math.max(0, 1 - dt * 6); e.vy *= Math.max(0, 1 - dt * 6);
        e.x += e.vx * dt; e.y += e.vy * dt;
        this._collideWalls(e); continue;
        }
        // New archetypes (EnemySystem) run their own state machines.
        if (EnemySys.update(this, e, dt)) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.vx *= Math.max(0, 1 - dt * 7); e.vy *= Math.max(0, 1 - dt * 7);
        this._collideWalls(e);
        e.x = clamp(e.x, 40, this.world.W - 40); e.y = clamp(e.y, 40, this.world.H - 40);
        continue;
        }
        const d2 = dist2(p.x, p.y, e.x, e.y);
        const aggro = d2 < e.sight * e.sight;

        if (e.state === 'idle') {
        if (aggro) { e.state = 'chase'; e.stateT = 0; this._callForHelp(e); }
        else { // wander
          e.wanderT -= dt;
          if (e.wanderT <= 0) { e.wanderDir = rand(0, TAU); e.wanderT = rand(1.5, 4); }
          e.x += Math.cos(e.wanderDir) * e.speed * 0.25 * dt;
          e.y += Math.sin(e.wanderDir) * e.speed * 0.25 * dt;
        }
      } else if (e.state === 'chase') {
        const d = Math.sqrt(d2);
        e.facing = Math.atan2(p.y - e.y, p.x - e.x);
        const atkRange = e.reach + e.r + p.r + 4;
        if (e.behavior === 'ranged' || e.behavior === 'priest') {
          // keep distance, attack from range
          const ideal = 220;
          if (d < ideal - 30) { e.x -= Math.cos(e.facing) * e.speed * dt; e.y -= Math.sin(e.facing) * e.speed * dt; }
          else if (d > ideal + 40) { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
          e.fireCool -= dt;
          if (e.fireCool <= 0 && d < e.sight) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
        } else if (e.behavior === 'lunge') {
          if (d < atkRange + 40) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
          else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
        } else {
          if (d < atkRange) { e.state = 'attack'; e.stateT = 0; e.attackPhase = 'windup'; }
          else { e.x += Math.cos(e.facing) * e.speed * dt; e.y += Math.sin(e.facing) * e.speed * dt; }
        }
      } else if (e.state === 'attack') {
        e.stateT += dt;
        if (e.attackPhase === 'windup') {
          e.parryWindow = 1;
          if (e.stateT >= e.atkWindup) { e.attackPhase = 'active'; e.stateT = 0; e.parryWindow = 0; e._hit = false; this.sound.enemyAttack(e.type); if (e.behavior === 'ranged' || e.behavior === 'priest') this._enemyRangedAttack(e); }
        } else if (e.attackPhase === 'active') {
          if (e.behavior !== 'ranged' && e.behavior !== 'priest') {
            const d = Math.hypot(p.x - e.x, p.y - e.y);
            const a = Math.atan2(p.y - e.y, p.x - e.x);
            if (!e._hit && d < e.reach + e.r + p.r + 4 && Math.abs(angDiff(e.facing, a)) < e.arc / 2 + 0.2) {
              e._hit = true; this._hurtPlayer(e.dmg, e.x, e.y, e);
            }
          }
          if (e.stateT >= e.atkActive) { e.attackPhase = 'recover'; e.stateT = 0; }
        } else if (e.attackPhase === 'recover') {
          if (e.stateT >= e.atkRecover) { e.state = 'chase'; e.attackPhase = null; if (e.behavior === 'ranged' || e.behavior === 'priest') e.fireCool = rand(1.2, 2.4); }
        }
      }
      // knockback
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.vx *= Math.max(0, 1 - dt * 7); e.vy *= Math.max(0, 1 - dt * 7);
      this._collideWalls(e);
      e.x = clamp(e.x, 40, this.world.W - 40); e.y = clamp(e.y, 40, this.world.H - 40);
    }
  }

  _enemyRangedAttack(e) {
    const p = this.player;
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    const sp = e.behavior === 'priest' ? 320 : 420;
    const color = e.behavior === 'priest' ? '#c47a3a' : '#5acfd6';
    this.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 2.2, r: 6, fromPlayer: false, dmg: e.dmg, color, homing: e.behavior === 'watcher' });
  }

  _updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (pr.molotov) {
        pr.vy += 320 * dt;
        pr.x += pr.vx * dt; pr.y += pr.vy * dt;
        pr.life -= dt;
        let hit = pr.life <= 0;
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
            // parry check
            if (e.attackPhase === 'windup') {
              e.staggered = 2.2; e.state = 'attack'; e.attackPhase = null;
              this.sound.parry(); this.camera.shake = Math.max(this.camera.shake, 6);
              this._burst(e.x, e.y, '#ffd27a', 14, 160);
            } else { this._damageEnemy(e, pr.dmg, 40); }
            pr.life = 0; break;
          }
        }
        if (this.boss && this.boss.alive && dist2(pr.x, pr.y, this.boss.x, this.boss.y) < (this.boss.r + pr.r) ** 2) {
          if (this.boss.attackPhase === 'windup' && this.boss.parryable) {
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
      // wall collision
      for (const w of this.world.walls) {
        if (pr.x > w.x && pr.x < w.x + w.w && pr.y > w.y && pr.y < w.y + w.h) { pr.life = 0; this._burst(pr.x, pr.y, pr.color || '#888', 5, 80); break; }
      }
    }
    this.projectiles = this.projectiles.filter(pr => pr.life > 0);
  }

  _updatePickups(dt) {
    const p = this.player;
    for (const pk of this.pickups) {
      pk.t += dt;
      const a = Math.atan2(p.y - pk.y, p.x - pk.x);
      const d2 = dist2(p.x, p.y, pk.x, pk.y);
      if (d2 < 260 * 260) { pk.x += Math.cos(a) * 180 * dt; pk.y += Math.sin(a) * 180 * dt; }
      if (d2 < 20 * 20) {
        if (pk.vial) { p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + 1); this.sound.essence(); }
        else if (pk.bullet) { p.bullets = Math.min(p.maxBullets, p.bullets + 2); this.sound.shot(); }
        else { p.essence += pk.ess * NpcSys.essenceMult(this); this.sound.essence(); }
        pk.collected = true;
        this._pushHud();
      }
    }
    this.pickups = this.pickups.filter(pk => !pk.collected);
  }

  _updateParticles(dt) {
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vx *= Math.max(0, 1 - dt * 2.5); pt.vy *= Math.max(0, 1 - dt * 2.5);
      const g = pt.blood ? 420 : (pt.spark || pt.flash ? 0 : 60);
      pt.vy += g * dt;
    }
    this.particles = this.particles.filter(pt => pt.life > 0);
  }

  _updateDamageNumbers(dt) {
    for (const d of this.damageNumbers) { d.t += dt; d.y -= 30 * dt; }
    this.damageNumbers = this.damageNumbers.filter(d => d.t < 0.9);
  }

  _updateAtmosphere(dt) {
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
  }

  _checkAreaTriggers() {
    if (this._memory) return;
    const p = this.player;
    if (!this.boss && !this.defeatedBosses.has('vicar') &&
        p.x > 2160 && p.x < 2740 && p.y > 820 && p.y < 1676) {
      this._spawnBoss('vicar');
    }
    if (!this.boss && !this.defeatedBosses.has('gascoigne') && this.defeatedBosses.has('vicar') &&
        p.x > 3420 && p.x < 3820 && p.y > 860 && p.y < 1696) {
      this._spawnBoss('gascoigne');
    }
    if (!this.boss && !this.defeatedBosses.has('nightmare') && this.defeatedBosses.has('gascoigne') &&
        p.x > 4520 && p.x < 5040 && p.y > 860 && p.y < 1696) {
      this._spawnBoss('nightmare');
    }
    // ---- Southern continent superbosses ----
    if (!this.boss && !this.defeatedBosses.has('mire') && this.defeatedBosses.has('gascoigne') &&
        p.x > 3000 && p.x < 3760 && p.y > 3000 && p.y < 3700) {
      this._spawnBoss('mire');
    }
    if (!this.boss && !this.defeatedBosses.has('hollow_king') && this.defeatedBosses.has('nightmare') &&
        p.x > 4100 && p.x < 4960 && p.y > 3500 && p.y < 4380) {
      this._spawnBoss('hollow_king');
    }
    // ---- The Grand Ancient Library: The Archivist ----
    if (!this.boss && !this.defeatedBosses.has('archivist') &&
        p.x > 1500 && p.x < 2300 && p.y > 5840 && p.y < 6320) {
      this._spawnBoss('archivist');
    }
    // ---- The Drowned Sanctum: The First Voice (final boss) ----
    Endgame.checkTrigger(this);
    // ---- Hidden optional bosses (discovered through exploration) ----
    SecretBosses.checkTrigger(this);
    Underworld.checkTrigger(this);
  }

  _spawnBoss(type) {
    this.state = 'bossIntro';
    this.encounteredBosses.add(type);
    const defs = {
      vicar: { name: 'The Drowned Vicar', x: 2450, y: 1260, r: 28, hp: 1200, speed: 64, dmg: 20, ess: 600, arena: { minX: 2184, maxX: 2716, minY: 844, maxY: 1652 }, phase2at: 0.5, introStyle: 'fog', introMsg: 'Phase I — The Shroud', dialogue: ["You smell like clean rain. I had forgotten that smell.", "I blessed the water because I believed. Believe, and drink. You will see why we did not stop."], phase2Msg: 'Phase II — The Tide Returns' },
      gascoigne: { name: 'Father Gascoigne', x: 3660, y: 1260, r: 24, hp: 1700, speed: 82, dmg: 24, ess: 900, arena: { minX: 3420, maxX: 3800, minY: 880, maxY: 1620 }, phase2at: 0.5, introStyle: 'drop', introMsg: 'Phase I — The Hunter', dialogue: ["Another Hunter. Good. I was running out of coats.", "Do not take the hat. The hat is all that is left of the man."], phase2Msg: 'Phase II — The Beast' },
      nightmare: { name: 'The Nightmare', x: 4800, y: 1280, r: 30, hp: 2400, speed: 70, dmg: 28, ess: 1400, arena: { minX: 4520, maxX: 5040, minY: 860, maxY: 1640 }, phase2at: 0.55, phase3at: 0.25, introStyle: 'cosmic', introMsg: 'Phase I — The Dream', dialogue: ["You are awake. How tiresome.", "I wear a face you nearly knew. Say hello to it before you cut it off."], phase2Msg: 'Phase II — The Mire', phase3Msg: 'Phase III — The Awakening' },
      mire: { name: 'The Mire Mother', x: 3380, y: 3340, r: 26, hp: 3420, speed: 70, dmg: 34, ess: 1000, arena: { minX: 3040, maxX: 3700, minY: 3040, maxY: 3660 }, phase2at: 0.5, introStyle: 'maw', introMsg: 'Phase I — The Shallows', dialogue: ["I was a healer before the water took my name. I still heal. I heal the unborn of being born silent.", "Sing to the water, Hunter. It will sing you back. It always sings you back."], phase2Msg: 'Phase II — The Drowned Choir' },
      hollow_king: { name: 'The Hollow King', x: 4520, y: 3850, r: 28, hp: 4200, speed: 78, dmg: 36, ess: 1600, arena: { minX: 4140, maxX: 4920, minY: 3540, maxY: 4340 }, phase2at: 0.5, phase3at: 0.25, introStyle: 'throne', introMsg: 'Phase I — The Crown', dialogue: ["A crown is a promise the head makes to the kingdom. Mine made no promises. It only took.", "They crowned me over nothing. I ruled the nothing faithfully."], phase2Msg: 'Phase II — The Wrath', phase3Msg: 'Phase III — The Hollow God' },
      archivist: { name: 'The Archivist', x: 1800, y: 6100, r: 28, hp: 3000, speed: 70, dmg: 30, ess: 1800, arena: { minX: 1540, maxX: 2260, minY: 5840, maxY: 6320 }, phase2at: 0.5, phase3at: 0.25, introStyle: 'books', introMsg: 'Phase I — The Index', dialogue: ["I have your name already. I wrote it when you first woke. Do not make me read it aloud.", "Every name the drowning took, I keep. I am very thorough. I am very hungry."], phase2Msg: 'Phase II — The Forbidden Stacks', phase3Msg: 'Phase III — The Last Chapter' },
      final: { name: 'Elias, the First Beast', x: 4550, y: 6100, r: 30, hp: 5400, speed: 90, dmg: 42, ess: 3000, arena: { minX: 4220, maxX: 4880, minY: 5920, maxY: 6270 }, phase2at: 0.6, phase3at: 0.3, introStyle: 'fog', introMsg: 'Phase I — The Old Hunter', dialogue: ["You kept the lantern lit. So did I. For longer than you can guess.", "I was the first to hunt. I was the first to fail. Let me be the last of both.", "Do not hesitate. You promised me that much. I promised you the same, once."], phase2Msg: 'Phase II — The Beast Wakes', phase3Msg: 'Phase III — The First Beast', phase4Msg: 'Phase IV — The True Beast' },
    };
    const d = defs[type];
    // Boss difficulty rebalance: every boss except the first (Vicar) is tougher.
    const bHp = type === 'vicar' ? 1 : 1.5;
    const bDmg = type === 'vicar' ? 1 : 1.2;
    this.boss = {
      type, name: d.name, x: d.x, y: d.y, r: d.r, hp: Math.round(d.hp * (this._hpScale || 1) * bHp), maxHp: Math.round(d.hp * (this._hpScale || 1) * bHp), alive: true,
      speed: d.speed, dmg: Math.round(d.dmg * (this._dmgScale || 1) * bDmg), facing: Math.PI, state: 'intro', stateT: 0,
      phase: 1, attackPhase: null, staggered: 0, hitFlash: 0, parryable: false,
      fireCool: 2, comboT: 0, vx: 0, vy: 0, riseY: 1000, ess: d.ess,
      arena: d.arena, phase2at: d.phase2at, phase3at: d.phase3at || 0,
      introMsg: d.introMsg, phase2Msg: d.phase2Msg, phase3Msg: d.phase3Msg, phase4Msg: d.phase4Msg || '',
      dialogue: d.dialogue || null,
      introStyle: d.introStyle || 'rise', introT: 0, introDur: 9.5, _introAlpha: 0,
      _roared: false, _landed: false,
    };
    this.boss._x0 = d.x;
    this.boss._y0 = d.y;
    const _s = d.introStyle;
    this.boss.y = d.y + (_s === 'drop' ? -1500 : _s === 'maw' ? 420 : _s === 'fog' ? 160 : _s === 'cosmic' ? 80 : 0);
    this.hooks.onBossIntro && this.hooks.onBossIntro(d.name);
    this.hooks.onState && this.hooks.onState('bossIntro');
  }

  // ---- cinematic boss intro (extracted to BossIntro.js) ----
  _updateBossIntro(dt) { updateBossIntro(this, dt); }

  _updateBoss(dt) {
    const b = this.boss;
    if (!b.alive) return;
    if (b.staggerImmune > 0) b.staggerImmune -= dt;
    if (this.player.visceraling && this.player.visceraling.target === b) return;
    if (b.type === 'final') return Endgame.updateFinal(this, dt);
    return BossSystem.update(this, dt);
  }

  // Boss combat AI lives in BossSystem.js; final boss in Endgame.js.

  _collideWalls(ent) {
    for (const w of this.world.walls) {
      if (w.gate && this.openGates.has(w.gate)) continue;
      const cx = clamp(ent.x, w.x, w.x + w.w);
      const cy = clamp(ent.y, w.y, w.y + w.h);
      const dx = ent.x - cx, dy = ent.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < ent.r * ent.r) {
        const d = Math.sqrt(d2) || 0.0001;
        const nx = dx / d, ny = dy / d;
        const push = ent.r - d;
        ent.x += nx * push; ent.y += ny * push;
      }
    }
  }

  // A safe zone is any world region flagged `safe` (the Hunter's Nightmare
  // hub/starting area). Enemies are never spawned inside one and are forcibly
  // removed if they ever end up within its bounds (defensive — the hub is also
  // walled, so this is a guarantee rather than a routine path).
  inSafeZone(x, y) {
    const regions = this.regions || [];
    for (const r of regions) {
      if (!r.safe) continue;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
    }
    return false;
  }

  _updateCamera(dt) {
    const p = this.player;
    let tx = p.x - this.viewW / 2, ty = p.y - this.viewH / 2;
    this.camera.x = lerp(this.camera.x, tx, Math.min(1, dt * 6));
    this.camera.y = lerp(this.camera.y, ty, Math.min(1, dt * 6));
    this.camera.x = clamp(this.camera.x, 0, this.world.W - this.viewW);
    this.camera.y = clamp(this.camera.y, 0, this.world.H - this.viewH);
    // world mouse
    this.mouse.worldX = this.mouse.x + this.camera.x;
    this.mouse.worldY = this.mouse.y + this.camera.y;
  }

  // ---------- RENDER ----------
  render() {
    const ctx = this.ctx;
    const { viewW, viewH } = this;
    ctx.clearRect(0, 0, viewW, viewH);
    // Sky + distant skyline (screen space, behind everything)
    if (this.env) this.env.drawSky(ctx, this.camera, viewW, viewH);

    ctx.save();
    let sx = 0, sy = 0;
    if (this.camera.shake > 0.2) { sx = rand(-this.camera.shake, this.camera.shake); sy = rand(-this.camera.shake, this.camera.shake); }
    const lp = this._lowHealthBeat || 0;
    if (lp > 0) { sx += Math.cos(this.runtime * 1.7) * lp * 1.4; sy += lp * 1.8; }  // subtle heartbeat camera throb
    ctx.translate(-Math.round(this.camera.x + sx), -Math.round(this.camera.y + sy));

    // Monumental architecture silhouettes behind the gameplay
    if (this.env) this.env.drawBackground(ctx, this.camera, viewW, viewH);
    this._drawGround(ctx);
    if (this.env) this.env.drawFloorDetail(ctx, this.camera, viewW, viewH);
    if (this.env) this.env.drawDistrictMood(ctx, this.camera, viewW, viewH);
    if (this.env) this.env.drawBridges(ctx, this.camera, viewW, viewH);
    // Environmental props (storytelling detail on the gameplay layer)
    if (this.env) this.env.drawProps(ctx, this.camera, viewW, viewH);
    if (this.env) this.env.drawPathLights(ctx, this.camera, viewW, viewH);
    this._drawWalls(ctx);
    this._drawFogWalls(ctx);
    Endgame.drawWorld(this, ctx);
    Underworld.drawWorld(this, ctx);
    this._drawLanterns(ctx);
    this._drawNotes(ctx);
    this._drawChests(ctx);
    drawEnvDetails(this, ctx);
    drawDoors(this, ctx);
    this._drawWorldEventWorld(ctx);
    this._drawSanctuaryProps(ctx);
    this._drawHubLabels(ctx);
    this._drawBloodStains(ctx);
    NpcSys.drawNpcs(this, ctx);
    MapSys.drawFragments(this, ctx);
    NpcSys.drawRelics(this, ctx);
    Indicators.drawIndicators(this, ctx);
    this._drawPickups(ctx);
    this._drawProjectiles(ctx);
    this._drawShockwaves(ctx);
    this._drawPools(ctx);
    this._drawEnemies(ctx);
    this._drawCorpses(ctx);
    if (this.boss) this._drawBoss(ctx);
    this._drawParticles(ctx);
    drawPlayer(this, ctx);
    this._drawDamageNumbers(ctx);

    ctx.restore();

    // Moonlight shafts (additive) above the world, below lighting tint
    if (this.env) this.env.drawLightShafts(ctx, this.camera, viewW, viewH);
    this._drawLighting(ctx);
    drawObjectiveBeam(this, ctx);
    Aftermath.drawTint(this, ctx);
    if (!this._memory) Endgame.drawScreen(this, ctx);
    this._drawFog(ctx);
    this._drawRain(ctx);
    // Drifting ash, leaves, crows (screen space)
    if (this.env) this.env.drawAmbience(ctx, viewW, viewH);
    // Foreground silhouettes frame the composition (drawn last, dark)
    if (this.env) this.env.drawForeground(ctx, this.camera, viewW, viewH);
    this._drawVignette(ctx);
    drawLowHealth(this, ctx);
    this._drawHurtOverlay(ctx);
    this._drawWorldEventLayer(ctx);
    drawBossIntroCard(this, ctx);
    Memory.drawFade(this, ctx);
  }

  _drawWorldEventWorld(ctx) { if (this.worldEvents) WorldEvents.drawWorld(this, ctx); }
  _drawWorldEventLayer(ctx) { if (this.worldEvents) WorldEvents.drawScreen(this, ctx); }

  _drawGround(ctx) {
    // base cobblestone
    ctx.fillStyle = '#16181d';
    ctx.fillRect(this.camera.x, this.camera.y, this.viewW, this.viewH);
    ctx.fillStyle = '#1b1e24';
    const tile = 64;
    const x0 = Math.floor(this.camera.x / tile) * tile;
    const y0 = Math.floor(this.camera.y / tile) * tile;
    for (let x = x0; x < this.camera.x + this.viewW + tile; x += tile) {
      for (let y = y0; y < this.camera.y + this.viewH + tile; y += tile) {
        if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
      }
    }
    // Area 2: The Burning Graveyard (scorched ember tint)
    ctx.fillStyle = 'rgba(60,28,14,0.35)';
    ctx.fillRect(2860, 820, 960, 880);
    // Area 3: The Nightmare (cosmic purple tint)
    ctx.fillStyle = 'rgba(30,14,50,0.42)';
    ctx.fillRect(3940, 820, 1120, 880);
    // cathedral puddle
    ctx.fillStyle = 'rgba(40,60,80,0.25)';
    ctx.beginPath(); ctx.ellipse(2450, 1260, 220, 150, 0, 0, TAU); ctx.fill();
    // area2 boss ember glow
    const eg = ctx.createRadialGradient(3660, 1260, 20, 3660, 1260, 260);
    eg.addColorStop(0, 'rgba(200,80,30,0.18)'); eg.addColorStop(1, 'rgba(200,80,30,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(3660, 1260, 260, 0, TAU); ctx.fill();
    // area3 boss cosmic pool
    const ng = ctx.createRadialGradient(4800, 1280, 20, 4800, 1280, 300);
    ng.addColorStop(0, 'rgba(150,80,220,0.2)'); ng.addColorStop(1, 'rgba(150,80,220,0)');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(4800, 1280, 300, 0, TAU); ctx.fill();
    // ---- Northern expansion ground tints ----
    ctx.fillStyle = 'rgba(40,70,90,0.30)'; ctx.fillRect(1080, 60, 900, 760);   // frostbound cathedral
    ctx.fillStyle = 'rgba(50,50,60,0.28)'; ctx.fillRect(2000, 60, 1220, 760);    // forgotten castle
    ctx.fillStyle = 'rgba(20,40,24,0.38)'; ctx.fillRect(3220, 60, 800, 760);    // whispering wood
    ctx.fillStyle = 'rgba(40,30,22,0.38)'; ctx.fillRect(4020, 60, 1000, 760);    // ash catacombs
  }

  _drawWalls(ctx) {
    for (const w of this.world.walls) {
      if (w.gate && this.openGates.has(w.gate)) {
        // open passage: faint warm threshold
        ctx.fillStyle = 'rgba(180,140,70,0.10)';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        continue;
      }
      if (w.parapet) {
        // low stone bridge railing
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(w.x + 3, w.y + 4, w.w, w.h);
        ctx.fillStyle = '#262a36'; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#3a4150'; ctx.fillRect(w.x, w.y, w.w, 3);
        for (let px = w.x; px < w.x + w.w; px += 22) { ctx.fillStyle = '#3a4150'; ctx.fillRect(px, w.y - 4, 6, 4); }
        continue;
      }
      // drop shadow (pseudo-3D depth)
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(w.x + 5, w.y + 6, w.w, w.h);
      // extruded side face
      ctx.fillStyle = '#15171c';
      ctx.fillRect(w.x + 4, w.y + 4, w.w, w.h);
      // top face
      ctx.fillStyle = '#2c313c';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // top edge highlight
      ctx.fillStyle = '#3a4150';
      ctx.fillRect(w.x, w.y, w.w, 3);
      // bottom shade
      ctx.fillStyle = '#1a1d23';
      ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
      // brick seams
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      for (let bx = w.x + 16; bx < w.x + w.w; bx += 32) ctx.fillRect(bx, w.y, 1, w.h);
      // sealed gate marker
      if (w.gate) {
        ctx.fillStyle = 'rgba(150,40,40,0.55)';
        ctx.fillRect(w.x, w.y + w.h / 2 - 2, w.w, 4);
        ctx.fillStyle = 'rgba(255,80,40,0.18)';
        ctx.fillRect(w.x - 2, w.y, w.w + 4, w.h);
      }
    }
  }

  _drawFogWalls(ctx) {
    const b = this.boss;
    if (!b || !b.alive) return;
    const a = b.arena, t = this.runtime;
    const camL = this.camera.x, camR = camL + this.viewW, camT = this.camera.y, camB = camT + this.viewH;
    const pulse = 0.4 + Math.sin(t * 2) * 0.1;
    ctx.save();
    const vWall = (wx) => {
      if (wx < camL - 50 || wx > camR + 50) return;
      const g = ctx.createLinearGradient(wx - 30, 0, wx + 30, 0);
      g.addColorStop(0, 'rgba(120,60,140,0)'); g.addColorStop(0.5, `rgba(150,80,170,${pulse})`); g.addColorStop(1, 'rgba(120,60,140,0)');
      ctx.fillStyle = g; const sy = Math.max(a.minY, camT - 50), ey = Math.min(a.maxY, camB + 50); ctx.fillRect(wx - 30, sy, 60, ey - sy);
    };
    const hWall = (wy) => {
      if (wy < camT - 50 || wy > camB + 50) return;
      const g = ctx.createLinearGradient(0, wy - 30, 0, wy + 30);
      g.addColorStop(0, 'rgba(120,60,140,0)'); g.addColorStop(0.5, `rgba(150,80,170,${pulse})`); g.addColorStop(1, 'rgba(120,60,140,0)');
      ctx.fillStyle = g; const sx = Math.max(a.minX, camL - 50), ex = Math.min(a.maxX, camR + 50); ctx.fillRect(sx, wy - 30, ex - sx, 60);
    };
    vWall(a.minX); vWall(a.maxX); hWall(a.minY); hWall(a.maxY);
    ctx.restore();
  }

  _drawLanterns(ctx) { drawLanterns(this, ctx); }
  _drawNotes(ctx) { drawNotes(this, ctx); }
  _drawChests(ctx) { drawChests(this, ctx); }

  _drawSanctuaryProps(ctx) { drawSanctuaryProps(this, ctx); }

  // Floating gothic labels above the hub's important interactables.
  _drawHubLabels(ctx) {
    if (!this.hubInfo) return;
    const h = this.hubInfo;
    const camL = this.camera.x, camT = this.camera.y, camR = camL + this.viewW, camB = camT + this.viewH;
    if (h.lantern.x < camL - 120 || h.lantern.x > camR + 120 || h.lantern.y < camT - 120 || h.lantern.y > camB + 120) return;
    this._drawHubLabel(ctx, h.lantern.x, h.lantern.y, 'Lantern', '#e8c878');
    this._drawHubLabel(ctx, h.workshop.x, h.workshop.y, 'Blacksmith', '#d8a85a');
  }
  _drawHubLabel(ctx, x, y, text, color) {
    const bob = Math.sin(this.runtime * 1.6 + x * 0.02) * 2.5;
    const cy = y - 64 + bob;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = '3px'; } catch (e) { /* unsupported */ }
    ctx.font = '600 14px ui-serif, Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = color;
    ctx.fillText(text, x, cy);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* reset */ }
    const w = ctx.measureText(text).width + 10;
    ctx.strokeStyle = 'rgba(200,160,90,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 10, cy); ctx.lineTo(x - w / 2 - 2, cy);
    ctx.moveTo(x + w / 2 + 2, cy); ctx.lineTo(x + w / 2 + 10, cy);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, cy + 9); ctx.lineTo(x - 4, cy + 5); ctx.lineTo(x + 4, cy + 5); ctx.closePath();
    ctx.fillStyle = 'rgba(200,160,90,0.45)';
    ctx.fill();
    ctx.restore();
  }

  _drawPickups(ctx) {
    for (const pk of this.pickups) {
      const a = 0.6 + Math.sin(this.runtime * 6 + pk.t * 10) * 0.4;
      if (pk.vial) {
        ctx.fillStyle = `rgba(190,40,40,${a})`;
        ctx.beginPath(); ctx.arc(pk.x, pk.y, 5.5, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,170,170,0.9)';
        ctx.beginPath(); ctx.arc(pk.x - 1.5, pk.y - 1.5, 1.6, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,80,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pk.x, pk.y, 7 + Math.sin(this.runtime * 5) * 1, 0, TAU); ctx.stroke();
      } else if (pk.bullet) {
        ctx.fillStyle = `rgba(230,200,120,${a})`;
        ctx.fillRect(pk.x - 1.5, pk.y - 4, 3, 8);
        ctx.fillStyle = 'rgba(255,220,150,0.9)';
        ctx.fillRect(pk.x - 2.5, pk.y - 5, 5, 2);
        ctx.strokeStyle = 'rgba(200,160,80,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pk.x, pk.y, 8 + Math.sin(this.runtime * 5) * 1, 0, TAU); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(180,140,220,${a})`;
        ctx.beginPath(); ctx.arc(pk.x, pk.y, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(220,200,255,0.8)';
        ctx.beginPath(); ctx.arc(pk.x, pk.y, 2, 0, TAU); ctx.fill();
      }
    }
  }

  _drawProjectiles(ctx) {
    for (const pr of this.projectiles) {
      if (pr.wave) {
        const a = Math.atan2(pr.vy, pr.vx);
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(a);
        const g = ctx.createLinearGradient(-pr.r * 2, 0, pr.r * 2, 0);
        g.addColorStop(0, 'rgba(90,160,214,0.1)'); g.addColorStop(0.5, pr.color || '#5aa0d6'); g.addColorStop(1, 'rgba(90,160,214,0.1)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, pr.r * 1.8, pr.r, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(210,235,255,0.5)'; ctx.beginPath(); ctx.ellipse(0, 0, pr.r * 1.3, pr.r * 0.6, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (pr.book) {
        const a = Math.atan2(pr.vy, pr.vx) + this.runtime * 6;
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(a);
        ctx.fillStyle = pr.color || '#d4b060'; ctx.fillRect(-pr.r, -pr.r * 0.65, pr.r * 2, pr.r * 1.3);
        ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.fillRect(-pr.r, -pr.r * 0.65, pr.r * 2, pr.r * 0.35);
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.strokeRect(-pr.r, -pr.r * 0.65, pr.r * 2, pr.r * 1.3);
        ctx.restore();
      } else {
        ctx.fillStyle = pr.molotov ? '#e07020' : (pr.fromPlayer ? '#ffe0a0' : (pr.color || '#aaa'));
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = pr.fromPlayer ? 'rgba(255,220,150,0.4)' : 'rgba(180,80,90,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pr.x, pr.y); ctx.lineTo(pr.x - pr.vx * 0.03, pr.y - pr.vy * 0.03); ctx.stroke();
      }
    }
  }

  _drawEnemies(ctx) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const staggered = e.staggered > 0;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, e.r * 0.7, e.r, e.r * 0.4, 0, 0, TAU); ctx.fill();
      ctx.rotate(e.facing);
      if (e.flinch > 0) {                       // recoil backward + back-tilt on hit
        const fl = clamp(e.flinch / 0.28, 0, 1);
        ctx.translate(-fl * 4, 0);
        ctx.rotate(-fl * 0.3);
      }
      this._drawEnemyFigure(ctx, e, staggered);
      if (e.attackPhase === 'windup') {
        ctx.strokeStyle = 'rgba(255,80,80,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, e.r + 4, -e.arc / 2, e.arc / 2); ctx.stroke();
      } else if (e.attackPhase === 'active') {
        ctx.fillStyle = 'rgba(255,60,60,0.35)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, e.reach + e.r, -e.arc / 2, e.arc / 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - 16, e.y - e.r - 12, 32, 4);
        ctx.fillStyle = '#a33'; ctx.fillRect(e.x - 16, e.y - e.r - 12, 32 * (e.hp / e.maxHp), 4);
      }
    }
  }

  _drawEnemyFigure(ctx, e, staggered) { drawEnemyFigure(this, ctx, e, staggered); }

  _drawBoss(ctx) { drawBoss(this, ctx); }

  // Boss figure rendering lives in BossRender.js (drawBoss).

  _drawParticles(ctx) {
    for (const pt of this.particles) {
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _updateShockwaves(dt) {
    const p = this.player;
    for (const s of this.shockwaves) {
      s.r += s.speed * dt;
      if (s.visual) continue;
      if (!s.hit) {
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (Math.abs(d - s.r) < 18 + p.r) {
          s.hit = true;
          if (!(s.losCheck && BossSystem.lineBlocked(this, s.x, s.y, p.x, p.y))) {
            this._hurtPlayer(s.dmg, s.x, s.y); this._burst(p.x, p.y, s.color || '#888', 8, 120);
          }
        }
      }
    }
    this.shockwaves = this.shockwaves.filter(s => s.r < s.maxR);
  }
  _updatePools(dt) {
    const p = this.player;
    for (const pool of this.pools) {
      pool.life -= dt;
      if (p.invuln <= 0 && !(p.dodge && p.dodge.t < p.dodge.iframes)) {
        const d = Math.hypot(p.x - pool.x, p.y - pool.y);
        if (d < pool.r) {
          p.hp -= pool.dps * dt;
          if (Math.random() < dt * 5) this._burst(p.x, p.y, pool.color, 2, 40);
          if (p.hp <= 0) { p.hp = 0; this._die(); }
        }
      }
    }
    this.pools = this.pools.filter(pl => pl.life > 0);
  }
  _updateBloodStains(dt) {
    for (const b of this.bloodStains) b.life -= dt;
    this.bloodStains = this.bloodStains.filter(b => b.life > 0);
  }
  _drawShockwaves(ctx) {
    for (const s of this.shockwaves) {
      const a = clamp(1 - s.r / s.maxR, 0, 1);
      ctx.strokeStyle = s.color || '#888'; ctx.globalAlpha = 0.6 * a; ctx.lineWidth = 6 * a + 1;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.25 * a; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  _drawPools(ctx) {
    for (const pool of this.pools) {
      const a = Math.min(1, pool.life / pool.maxLife) * 0.8;
      const g = ctx.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, pool.r);
      g.addColorStop(0, pool.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * 0.6; ctx.strokeStyle = pool.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.r * (0.92 + Math.sin(this.runtime * 3) * 0.05), 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  _drawBloodStains(ctx) {
    for (const b of this.bloodStains) {
      ctx.fillStyle = `rgba(40,6,6,${clamp(b.life / b.max, 0, 1) * 0.5})`;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.55, 0, 0, TAU); ctx.fill();
    }
  }

  // Dead foes topple and sink into a widening blood pool before fading.
  _updateCorpses(dt) {
    for (const c of this.corpses) {
      c.t += dt;
      const p = clamp(c.t / c.dur, 0, 1);
      c.tilt = lerp(0, 1.45, easeOutCubic(Math.min(1, p * 1.6)));
      c.sink = p * 3;
    }
    this.corpses = this.corpses.filter(c => c.t < c.dur);
  }
  _drawCorpses(ctx) {
    for (const c of this.corpses) {
      const p = clamp(c.t / c.dur, 0, 1);
      const fade = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      ctx.save();
      ctx.translate(c.x, c.y + (c.sink || 0));
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = `rgba(40,6,6,${0.5 * fade})`;
      ctx.beginPath(); ctx.ellipse(0, c.r * 0.6, c.r * (0.8 + p * 0.8), c.r * 0.4 * (1 + p * 0.3), 0, 0, TAU); ctx.fill();
      ctx.rotate(c.facing + (c.tilt || 0));
      ctx.scale(1, 0.82);
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(0, 0, c.r * 1.05, c.r * 1.25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1410';
      ctx.beginPath(); ctx.ellipse(c.r * 0.1, -c.r * 0.1, c.r * 0.7, c.r * 0.6, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  _drawDamageNumbers(ctx) {
    for (const d of this.damageNumbers) {
      ctx.globalAlpha = clamp(1 - d.t / 0.9, 0, 1);
      ctx.fillStyle = d.heal ? '#7ad06a' : (d.crit ? '#ffd27a' : '#fff');
      const sz = d.crit ? 20 : (d.heavy ? 16 : 14);
      ctx.font = `${d.crit ? 'bold ' : ''}${sz}px ui-monospace, monospace`;
      ctx.fillText(d.v, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  _drawLighting(ctx) {
    const lc = this.lightCtx;
    lc.clearRect(0, 0, this.viewW, this.viewH);
    // Ambient darkness: a soft directional gradient, lifted from near-black so
    // nearby architecture stays readable. Lighter toward the moon (upper-right)
    // gives silhouettes a rim and helps orient the player by landmark.
    const dg = lc.createLinearGradient(this.viewW, 0, 0, this.viewH);
    dg.addColorStop(0, 'rgba(3,4,9,0.58)');
    dg.addColorStop(1, 'rgba(2,3,7,0.80)');
    lc.fillStyle = dg;
    lc.fillRect(0, 0, this.viewW, this.viewH);
    lc.globalCompositeOperation = 'destination-out';
    // player lantern light — softer and wider so it bleeds gently into ambient
    const px = this.player.x - this.camera.x, py = this.player.y - this.camera.y;
    let g = lc.createRadialGradient(px, py, 16, px, py, 380);
    g.addColorStop(0, 'rgba(255,255,255,0.88)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    lc.fillStyle = g; lc.beginPath(); lc.arc(px, py, 380, 0, TAU); lc.fill();
    // lantern lights
    for (const l of this.world.lanterns) {
      if (l.lockedBoss && !this.defeatedBosses.has(l.lockedBoss)) continue;
      const lx = l.x - this.camera.x, ly = l.y - this.camera.y;
      if (lx < -l.r || lx > this.viewW + l.r || ly < -l.r || ly > this.viewH + l.r) continue;
      const flick = (l._flick || 1);
      const rr = l.r * flick;
      g = lc.createRadialGradient(lx, ly, 5, lx, ly, rr);
      g.addColorStop(0, 'rgba(255,255,255,0.82)'); g.addColorStop(0.6, 'rgba(255,255,255,0.34)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      lc.fillStyle = g; lc.beginPath(); lc.arc(lx, ly, rr, 0, TAU); lc.fill();
    }
    lc.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightCanvas, 0, 0);
    // warm tint overlay from lanterns
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.world.lanterns) {
      if (l.lockedBoss && !this.defeatedBosses.has(l.lockedBoss)) continue;
      const lx = l.x - this.camera.x, ly = l.y - this.camera.y;
      if (lx < -l.r || lx > this.viewW + l.r || ly < -l.r || ly > this.viewH + l.r) continue;
      const flick = (l._flick || 1);
      g = ctx.createRadialGradient(lx, ly, 5, lx, ly, l.r * flick);
      g.addColorStop(0, 'rgba(255,180,90,0.18)'); g.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, l.r * flick, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  _drawFog(ctx) {
    for (const f of this.fogPuffs) {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(180,190,210,${f.a})`); g.addColorStop(1, 'rgba(180,190,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
  }

  _drawRain(ctx) {
    ctx.strokeStyle = 'rgba(160,170,200,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of this.rainDrops) {
      ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.len * 0.25, r.y + r.len);
    }
    ctx.stroke();
  }

  _drawVignette(ctx) {
    const g = ctx.createRadialGradient(this.viewW / 2, this.viewH / 2, this.viewH * 0.3, this.viewW / 2, this.viewH / 2, this.viewH * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  _drawHurtOverlay(ctx) {
    if (this.player.hurtFlash > 0) {
      ctx.fillStyle = `rgba(120,10,10,${this.player.hurtFlash * 0.5})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.player.nearLantern) {
      ctx.fillStyle = `rgba(255,200,120,${0.04 + Math.sin(this.runtime * 2) * 0.02})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }

}