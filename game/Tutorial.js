// Tutorial.js — lightweight contextual control hints for first-time Hunters.
// Prompts appear one at a time, bottom-center, only when their action is
// relevant; each dismisses forever once the player performs it. Never shown in
// New Game+. Pure functions on a HuntGame instance; rendering is a React overlay
// driven by the onTutorial hook, which the engine pushes only on change.
//
// Detection is observation-based — it watches the player's state each frame
// (a swing began, weapon mode changed, locked on, fired, dodged, healed, map
// or satchel opened, distance traveled, HP dropped, an important item gained)
// rather than hooking the action methods, so no gameplay code is touched.

const SAVE_KEY = 'hunt_tutorial_v1';

// Display priority. The active hint is the first un-completed one whose trigger
// is met; a hint whose trigger isn't ready is skipped (so a conditional hint like
// lock-on, heal, map, or satchel never blocks a later one). The core combat
// chain advances one at a time because each link's trigger is "previous done."
const ORDER = ['move', 'attack', 'transform', 'lockon', 'fire', 'dodge', 'heal', 'map', 'satchel', 'molotov'];

const TEXT = {
  move: 'Use WASD to Move',
  attack: 'Left Click to Attack',
  transform: 'Press F to Transform Your Weapon',
  lockon: 'Press Q to Lock Onto an Enemy',
  fire: 'Press R to Fire Your Weapon or Parry Incoming Attacks',
  dodge: 'Press Space to Dodge',
  heal: "Press V to Use a Hunter's Draught",
  map: 'Press M to Open the Map',
  satchel: 'Press Tab to Open Your Satchel',
  molotov: 'Press G to Throw a Molotov',
};
const TIPS = {
  molotov: 'Good against swarms of enemies.',
};

export function init(game) {
  game.tutorial = {
    enabled: true,
    completed: new Set(),
    started: false,
    _pushed: null,
    _lastPx: null, _lastPy: null, _dist: 0,
    _exploredT: 0, _hpLow: false, _gotItem: false,
    _prevSwing: false, _prevMode: null, _prevLocked: false,
    _prevFiring: false, _prevDodge: false, _prevHeal: false,
    _prevMap: false, _prevSatchel: false, _prevMolotov: false,
    _prevCharms: 0, _prevSouls: 0, _prevFragments: 0,
  };
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (data) {
      if (typeof data.enabled === 'boolean') game.tutorial.enabled = data.enabled;
      if (Array.isArray(data.completed)) data.completed.forEach(id => game.tutorial.completed.add(id));
    }
  } catch (e) { /* no storage */ }
}

export function setEnabled(game, enabled) {
  if (!game.tutorial) return;
  game.tutorial.enabled = !!enabled;
  _save(game);
}

function _save(game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      enabled: game.tutorial.enabled,
      completed: Array.from(game.tutorial.completed),
    }));
  } catch (e) { /* no storage */ }
}

function _complete(game, id) {
  const t = game.tutorial;
  if (!t || t.completed.has(id)) return;
  t.completed.add(id);
  _save(game);
}

export function update(game, dt) {
  const t = game.tutorial;
  if (!t || !game.player) { _push(game, null); return; }
  _detect(game, dt);
  if (!t.enabled || game.ngPlus) { _push(game, null); return; }
  if (t.completed.size >= ORDER.length) { _push(game, null); return; }
  // hide during menus, cutscenes, transitions, and non-play states
  if (game.paused || game.transition || (game.state !== 'playing' && game.state !== 'bossActive')) { _push(game, null); return; }
  // begin only after the Hunter is teleported out of the hub into the Hunt
  if (!t.started) {
    if (game._curArea && game._curArea !== 'hub') {
      t.started = true; t._dist = 0; t._lastPx = game.player.x; t._lastPy = game.player.y;
    } else { _push(game, null); return; }
  }
  const want = _want(game);
  _push(game, want ? { text: TEXT[want], tip: TIPS[want] || null } : null);
}

function _want(game) {
  const t = game.tutorial;
  const done = id => t.completed.has(id);
  const enemyNear = () => {
    const p = game.player;
    for (const e of game.enemies) { if (e.alive && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 360 * 360) return true; }
    if (game.boss && game.boss.alive && (game.boss.x - p.x) ** 2 + (game.boss.y - p.y) ** 2 < 520 * 520) return true;
    return false;
  };
  const triggers = {
    move: () => true,
    attack: () => done('move'),
    transform: () => done('attack'),
    lockon: () => done('transform') && enemyNear(),
    fire: () => done('lockon'),
    dodge: () => done('fire'),
    heal: () => t._hpLow,
    map: () => t._exploredT > 28,
    satchel: () => t._gotItem,
    molotov: () => done('satchel'),
  };
  for (const id of ORDER) {
    if (done(id)) continue;
    if (triggers[id]()) return id;
  }
  return null;
}

function _detect(game, dt) {
  const t = game.tutorial, p = game.player;
  // distance traveled — only once the Hunt has begun, so the hub-to-world
  // teleport never counts toward the "move" hint
  if (t.started && t._lastPx != null) t._dist += Math.hypot(p.x - t._lastPx, p.y - t._lastPy);
  t._lastPx = p.x; t._lastPy = p.y;
  if (t._dist > 120) _complete(game, 'move');
  // attack — a swing began
  const swinging = !!p.swing;
  if (swinging && !t._prevSwing) _complete(game, 'attack');
  t._prevSwing = swinging;
  // transform — weapon mode changed
  if (t._prevMode != null && p.mode !== t._prevMode) _complete(game, 'transform');
  t._prevMode = p.mode;
  // lock-on — gained a target
  const locked = !!p.locked;
  if (locked && !t._prevLocked) _complete(game, 'lockon');
  t._prevLocked = locked;
  // fire — a shot was fired
  if (p.firing > 0 && !t._prevFiring) _complete(game, 'fire');
  t._prevFiring = p.firing > 0;
  // dodge — a dodge began
  const dodging = !!p.dodge;
  if (dodging && !t._prevDodge) _complete(game, 'dodge');
  t._prevDodge = dodging;
  // heal — a draught was used
  if (p.healAnim > 0 && !t._prevHeal) _complete(game, 'heal');
  t._prevHeal = p.healAnim > 0;
  // map — opened once. M opens the Hunter's Journal (whose Map page is the
  // chart); the overlay mapOpen is covered too in case it's opened directly.
  const mapOpened = game.questLogOpen || game.mapOpen;
  if (mapOpened && !t._prevMap) _complete(game, 'map');
  t._prevMap = mapOpened;
  // satchel — opened once
  if (game.inventoryOpen && !t._prevSatchel) _complete(game, 'satchel');
  t._prevSatchel = game.inventoryOpen;
  // molotov — a throw began (a molotov projectile appeared in flight)
  const molotovOut = (game.projectiles || []).some(pr => pr.molotov);
  if (molotovOut && !t._prevMolotov) _complete(game, 'molotov');
  t._prevMolotov = molotovOut;
  // important item (charm / boss soul / map fragment) — gates the satchel hint
  const cs = (p.charms && p.charms.size) || 0;
  const ss = (p.souls && p.souls.size) || 0;
  const fs = (game.collectedFragments && game.collectedFragments.size) || 0;
  if (cs > t._prevCharms || ss > t._prevSouls || fs > t._prevFragments) t._gotItem = true;
  t._prevCharms = cs; t._prevSouls = ss; t._prevFragments = fs;
  // HP dropped to a noticeable degree (~78% or below)
  if (p.hp <= p.maxHp * 0.78) t._hpLow = true;
  // active exploration time — gates the map hint
  if (game.state === 'playing' && !game.paused && !game.transition) t._exploredT += dt;
}

function _push(game, payload) {
  const t = game.tutorial;
  const key = payload ? payload.text : null;
  if (!t || key === t._pushed) return;
  t._pushed = key;
  if (game.hooks && game.hooks.onTutorial) game.hooks.onTutorial(payload);
}