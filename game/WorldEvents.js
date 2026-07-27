// WorldEvents.js — Dynamic World Events System.
// Fully additive: reads game state (player position, defeated bosses, regions
// discovered, runtime) and layers atmosphere/events on top. It never modifies
// combat formulas, controls, bosses, existing quests, or progression gating.
// Spawns ambient enemies via game._spawnEnemy + game.enemies (the same factory
// the world uses), toggles a transient `game.weather` object, plays existing
// audio cues, and draws screen-space + world-space overlays.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

// Sites where bell events can toll. Triggers when the player lingers within range.
const BELL_SITES = [
  { id: 'floods', x: 2450, y: 1260, name: 'the Cathedral of Floods', r: 520 },
  { id: 'grave', x: 3660, y: 1260, name: 'the graveyard chapel', r: 480 },
  { id: 'mire', x: 3350, y: 3340, name: 'the Sunken Cathedral', r: 520 },
  { id: 'overlook', x: 4520, y: 3850, name: 'the Overlook Cathedral', r: 520 },
  { id: 'sanctuary', x: 750, y: 5050, name: 'the Sanctuary', r: 560 },
  { id: 'library', x: 1800, y: 6100, name: 'the Grand Library', r: 540 },
];

const LORE_RUMORS = [
  'A crow lands on a broken weathervane. It is watching you.',
  'Somewhere a door closes that no one opened.',
  'The fog shifts. A shape moves where nothing should be walking.',
  'You hear footsteps that stop when you stop.',
  'A distant light flickers, then is gone.',
];

const DISCOVERY_LORE = {
  camp: 'An abandoned camp. The fire is cold, but the bedroll is still warm.',
  grave: 'A forgotten grave. The name has been scratched away by patient fingers.',
  ritual: 'A circle of salt and bone. Whatever was summoned here has already left.',
};

export function init(game) {
  return {
    nextAmbient: rand(120, 240),
    nextStorm: rand(180, 320),
    nextInvasion: rand(220, 400),
    nextBell: rand(150, 280),
    nextDiscovery: rand(150, 300),
    storm: null,
    bell: null,
    invasion: null,
    fx: [],          // screen-space ambient fx (crows, shadows, wanderers)
    discoveries: [], // world-space hidden discoveries
    knownBosses: new Set([...(game.defeatedBosses || [])]),
    reactionQueue: [], // pending post-boss world reactions {t, bosses:[...]}
    evolution: 0,
    msgCool: 0,
  };
}

export function update(game, dt) {
  const S = game.worldEvents;
  if (!S) return;
  S.evolution = (game.defeatedBosses ? game.defeatedBosses.size : 0);
  if (S.msgCool > 0) S.msgCool -= dt;

  // Active events wind down regardless of play state so visuals resolve cleanly.
  if (S.storm) {
    S.storm.t += dt;
    updateStorm(game, S.storm, dt);
    if (S.storm.t >= S.storm.dur) { endStorm(game, S.storm); S.storm = null; }
  }
  if (S.bell) {
    S.bell.t += dt;
    S.bell.nextToll -= dt;
    if (S.bell.nextToll <= 0 && S.bell.tollsLeft > 0) {
      S.bell.tollsLeft--;
      S.bell.nextToll = rand(1.1, 1.8);
      // The bell falls silent during a boss encounter — no tolling intrudes on a fight.
      if (game.state === 'playing') { game.sound.bell(); game.camera.shake = Math.max(game.camera.shake, 2); }
    }
    if (S.bell.t >= S.bell.dur && S.bell.tollsLeft <= 0) S.bell = null;
  }
  if (S.invasion) {
    S.invasion.t += dt;
    if (S.invasion.t >= S.invasion.dur) S.invasion = null;
  }
  for (const f of S.fx) {
    f.t += dt;
    if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; }
    if (f.particles) for (const p of f.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  }
  S.fx = S.fx.filter((f) => f.t < f.dur);

  // Discoveries: proximity collect.
  const p = game.player;
  for (const d of S.discoveries) {
    if (d.collected) continue;
    if (dist2(p.x, p.y, d.x, d.y) < 34 * 34) collectDiscovery(game, d);
  }
  S.discoveries = S.discoveries.filter((d) => !d.collected);

  // Pending story reactions.
  for (const r of S.reactionQueue) {
    r.t -= dt;
    if (r.t <= 0 && game.state === 'playing') { triggerReaction(game, r); r.done = true; }
  }
  S.reactionQueue = S.reactionQueue.filter((r) => !r.done);

  // Detect newly-defeated bosses → schedule a world reaction.
  if (game.defeatedBosses) {
    for (const b of game.defeatedBosses) {
      if (!S.knownBosses.has(b)) {
        S.knownBosses.add(b);
        S.reactionQueue.push({ t: 9, boss: b, done: false });
      }
    }
  }

  // Only schedule NEW events while the player is freely exploring — never during
  // a boss encounter (intro or active) or after death, so ambient notifications
  // never intrude on a fight.
  const active = game.state === 'playing';
  if (!active) return;

  // Ambient moments (the "footsteps in the fog" rumors) are intentionally rare:
  // roughly every few minutes, with randomness, so they stay surprising.
  S.nextAmbient -= dt;
  if (S.nextAmbient <= 0) { scheduleAmbient(game); S.nextAmbient = rand(150, 300); }

  S.nextStorm -= dt;
  if (S.nextStorm <= 0 && !S.storm) { startStorm(game); S.nextStorm = rand(220, 420) - S.evolution * 8; }

  S.nextBell -= dt;
  if (S.nextBell <= 0 && !S.bell) { maybeStartBell(game); S.nextBell = rand(180, 360); }

  S.nextInvasion -= dt;
  if (S.nextInvasion <= 0 && !S.invasion) { maybeStartInvasion(game); S.nextInvasion = rand(240, 480) - S.evolution * 10; }

  S.nextDiscovery -= dt;
  if (S.nextDiscovery <= 0 && S.discoveries.length < 2) { spawnDiscovery(game); S.nextDiscovery = rand(180, 360); }
}

// ---------- Storm ----------
function startStorm(game) {
  const S = game.worldEvents;
  const rain = [];
  const n = 260;
  for (let i = 0; i < n; i++) rain.push({ x: rand(-200, game.viewW + 200), y: rand(-game.viewH, game.viewH), len: rand(10, 22), sp: rand(1200, 1700) });
  S.storm = {
    t: 0, dur: rand(34, 60), rain, fog: [],
    nextLightning: rand(4, 9), flash: 0, thunderCool: 0,
  };
  for (let i = 0; i < 10; i++) S.storm.fog.push({ x: rand(0, game.viewW), y: rand(0, game.viewH), r: rand(160, 320), a: rand(0.06, 0.12), vx: rand(-14, 14), vy: rand(-6, 6) });
  game.weather = { storm: true };
  // A few creatures slip in with the storm.
  const near = pickSpawnNear(game, 360, 560);
  for (let i = 0; i < 2 + Math.floor(rand(0, 2)); i++) {
    const t = pick(['hound', 'crawler', 'villager', 'knife_villager']);
    game.enemies.push(game._spawnEnemy(t, near.x + rand(-60, 60), near.y + rand(-60, 60)));
  }
  game._showMsg('A storm rolls in over the Quarter.', 2200);
  game.sound.windGust();
}

function updateStorm(game, st, dt) {
  for (const r of st.rain) {
    r.y += r.sp * dt; r.x -= r.sp * 0.28 * dt;
    if (r.y > game.viewH + 20) { r.y = -20; r.x = rand(-200, game.viewW + 200); }
  }
  for (const f of st.fog) {
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.x < -f.r) f.x = game.viewW + f.r;
    if (f.x > game.viewW + f.r) f.x = -f.r;
    if (f.y < -f.r) f.y = game.viewH + f.r;
    if (f.y > game.viewH + f.r) f.y = -f.r;
  }
  st.nextLightning -= dt;
  if (st.flash > 0) st.flash -= dt;
  if (st.nextLightning <= 0) {
    st.nextLightning = rand(5, 12);
    // Lightning (flash + thunder + shake) is an ambient event — suppressed during boss fights.
    if (game.state === 'playing') {
      st.flash = 0.18;
      game.camera.shake = Math.max(game.camera.shake, 3);
      setTimeout(() => { if (game.sound) game.sound.bossPhase(); }, rand(300, 900)); // distant thunder
    }
  }
}

function endStorm(game, st) {
  game.weather = { storm: false };
  if (game.state === 'playing') game._showMsg('The storm passes. The Quarter is quiet again.', 1800);
}

// ---------- Bell ----------
function maybeStartBell(game) {
  const p = game.player;
  // Prefer a site the player is near; otherwise toll a distant one.
  let site = BELL_SITES.find((s) => dist2(p.x, p.y, s.x, s.y) < s.r * s.r);
  if (!site && Math.random() < 0.4) site = pick(BELL_SITES);
  if (!site) return;
  const S = game.worldEvents;
  S.bell = { t: 0, dur: 8, site, tollsLeft: Math.floor(rand(3, 7)), nextToll: 0.4 };
  game._showMsg(`A bell tolls in ${site.name}. Who rings it?`, 2600);
  // A guardian of the bell stirs, and the faithful wander toward the sound.
  const near = { x: site.x + rand(-80, 80), y: site.y + rand(-80, 80) };
  game.enemies.push(game._spawnEnemy('bell_keeper', near.x, near.y));
  for (let i = 0; i < 2; i++) game.enemies.push(game._spawnEnemy(pick(['townsfolk', 'villager', 'torch_villager']), site.x + rand(-120, 120), site.y + rand(-120, 120)));
  game.sound.bell();
}

// ---------- Invasion ----------
function maybeStartInvasion(game) {
  const S = game.worldEvents;
  const discovered = (game.discoveredRegions && [...game.discoveredRegions]) || [];
  if (!discovered.length) return;
  const rid = pick(discovered);
  const region = (game.regions || []).find((r) => r.id === rid);
  if (!region) return;
  const kinds = [
    { name: 'a band of corrupted hunters', types: ['fallen_hunter', 'knife_villager', 'townsfolk', 'fallen_hunter'] },
    { name: 'a beast that broke its chains', types: ['ancient_beast', 'hound', 'hound'] },
    { name: 'a raid upon the settlement', types: ['brute', 'heavy_villager', 'townsfolk', 'torch_villager'] },
    { name: 'an elite searching the ruins', types: ['executioner', 'guardian'] },
  ];
  const k = pick(kinds);
  const cx = clamp(region.x + region.w * 0.5, 80, game.world.W - 80);
  const cy = clamp(region.y + region.h * 0.5, 80, game.world.H - 80);
  for (const t of k.types) game.enemies.push(game._spawnEnemy(t, cx + rand(-100, 100), cy + rand(-100, 100)));
  S.invasion = { t: 0, dur: 18, region: region.name, kind: k.name };
  game._showMsg(`${capitalize(k.name)} invades ${region.name}.`, 2800);
  game.sound.beastRoar();
  game.camera.shake = Math.max(game.camera.shake, 5);
}

// ---------- Ambient moments ----------
function scheduleAmbient(game) {
  const r = Math.random();
  if (r < 0.3) ambientCrows(game);
  else if (r < 0.55) ambientDistantShadow(game);
  else if (r < 0.75) ambientWanderer(game);
  else if (r < 0.88) ambientStatueCrumble(game);
  else ambientDistantSound(game);
}

function ambientCrows(game) {
  const n = Math.floor(rand(4, 9));
  const particles = [];
  const sx = rand(0, game.viewW);
  const dir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    particles.push({
      x: sx + i * 14 * dir, y: rand(40, game.viewH * 0.4),
      vx: dir * rand(120, 200), vy: rand(-20, 30), life: rand(2.5, 4),
    });
  }
  game.worldEvents.fx.push({ type: 'crows', t: 0, dur: 4.5, particles });
  game.sound.raven();
}

function ambientDistantShadow(game) {
  game.worldEvents.fx.push({
    type: 'shadow', t: 0, dur: 3.4,
    x: rand(0, game.viewW), y: rand(game.viewH * 0.3, game.viewH * 0.7),
    vx: rand(30, 70) * (Math.random() < 0.5 ? 1 : -1), alpha: 0,
  });
  game.sound.creak();
}

function ambientWanderer(game) {
  const fromLeft = Math.random() < 0.5;
  game.worldEvents.fx.push({
    type: 'wanderer', t: 0, dur: rand(5, 8),
    x: fromLeft ? -30 : game.viewW + 30,
    y: rand(game.viewH * 0.45, game.viewH * 0.8),
    vx: (fromLeft ? 1 : -1) * rand(28, 44),
  });
  if (S_msgCoolOk(game)) { game._showMsg(pick(LORE_RUMORS), 2400); game.worldEvents.msgCool = 8; }
}

function ambientStatueCrumble(game) {
  // Crumble a random sanctuary/nearby statue prop if visible.
  const props = (game.sanctuaryProps || []).filter((p) => p.type === 'statue');
  if (!props.length) { ambientDistantSound(game); return; }
  const pr = pick(props);
  game._burst(pr.x, pr.y, '#6a5a44', 16, 120);
  game.camera.shake = Math.max(game.camera.shake, 2);
  game.sound.slam();
  game.worldEvents.fx.push({ type: 'dust', t: 0, dur: 1.2, wx: pr.x, wy: pr.y, particles: dustBurst(pr.x, pr.y) });
}

function ambientDistantSound(game) {
  const r = Math.random();
  if (r < 0.5) { game.sound.bell(); if (S_msgCoolOk(game)) { game._showMsg('A bell tolls far away. It is not answered.', 2200); game.worldEvents.msgCool = 10; } }
  else { game.sound.hurt(); if (S_msgCoolOk(game)) { game._showMsg('A scream rises from somewhere below. Then silence.', 2200); game.worldEvents.msgCool = 10; } }
}

function dustBurst(x, y) {
  const arr = [];
  for (let i = 0; i < 14; i++) { const a = rand(0, TAU), s = rand(40, 140); arr.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(0.6, 1.2) }); }
  return arr;
}

// ---------- Discoveries (exploration rewards) ----------
function spawnDiscovery(game) {
  const S = game.worldEvents;
  const discovered = (game.discoveredRegions && [...game.discoveredRegions]) || [];
  if (!discovered.length) return;
  // Prefer the player's current region so it feels found, not arbitrary.
  const p = game.player;
  let region = (game.regions || []).find((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (!region || Math.random() < 0.3) region = (game.regions || []).find((r) => r.id === pick(discovered));
  if (!region) return;
  const type = pick(['camp', 'grave', 'ritual']);
  const x = clamp(p.x + rand(-380, 380), region.x + 60, region.x + region.w - 60);
  const y = clamp(p.y + rand(-380, 380), region.y + 60, region.y + region.h - 60);
  if (dist2(x, y, p.x, p.y) < 180 * 180) return; // not too close
  S.discoveries.push({ x, y, type, collected: false, t: rand(0, TAU), lore: DISCOVERY_LORE[type] });
  game.sound.discover();
}

function collectDiscovery(game, d) {
  d.collected = true;
  const p = game.player;
  if (d.type === 'camp') {
    p.essence += 220; p.bloodVials = Math.min(p.maxBloodVials, p.bloodVials + 2);
    game._showMsg('Discovery: an abandoned camp. (+220 essence, +2 vials)', 2600);
  } else if (d.type === 'grave') {
    p.essence += 300;
    game._showMsg('Discovery: a forgotten grave. (+300 essence)', 2600);
  } else {
    p.essence += 180; p.bullets = Math.min(p.maxBullets, p.bullets + 6);
    game._showMsg('Discovery: a ritual circle. (+180 essence, +6 bullets)', 2600);
  }
  game._burst(d.x, d.y, d.type === 'ritual' ? '#b070d0' : '#c9a86a', 18, 150);
  game.sound.fragment();
  if (game.hooks.onLore) game.hooks.onLore('A Hidden Discovery', d.lore);
  game._pushHud && game._pushHud();
}

// ---------- Story reactions (boss defeat consequences) ----------
function triggerReaction(game, r) {
  // The world stirs after a boss falls: old areas grow a little more dangerous,
  // and a rumor reaches the player. Purely additive atmosphere.
  const early = (game.regions || []).find((rg) => rg.id === 'ashe') || (game.regions || [])[0];
  if (early) {
    const cx = early.x + early.w * 0.5, cy = early.y + early.h * 0.5;
    const pool = ['townsfolk', 'villager', 'hound', 'knife_villager', 'crawler', 'watcher'];
    const n = 2 + Math.floor(rand(0, 2));
    for (let i = 0; i < n; i++) game.enemies.push(game._spawnEnemy(pick(pool), cx + rand(-160, 160), cy + rand(-160, 160)));
  }
  game._showMsg('The Quarter shifts. Something old has noticed the silence.', 3000);
  game.sound.bell();
}

// ---------- helpers ----------
function pickSpawnNear(game, minD, maxD) {
  const p = game.player;
  const a = rand(0, TAU);
  const d = rand(minD, maxD);
  return { x: clamp(p.x + Math.cos(a) * d, 60, game.world.W - 60), y: clamp(p.y + Math.sin(a) * d, 60, game.world.H - 60) };
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function S_msgCoolOk(game) { return game.worldEvents.msgCool <= 0; }

// ---------- RENDER ----------
// World-space layer (discoveries + statue dust). Called within the world transform.
export function drawWorld(game, ctx) {
  const S = game.worldEvents;
  if (!S) return;
  // Discoveries
  for (const d of S.discoveries) {
    d.t += 0.05;
    ctx.save();
    ctx.translate(d.x, d.y);
    const pulse = 0.6 + Math.sin(d.t * 3) * 0.4;
    // glow
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    const col = d.type === 'ritual' ? 'rgba(170,110,220,0.5)' : d.type === 'camp' ? 'rgba(220,150,80,0.5)' : 'rgba(180,170,140,0.4)';
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 28 * pulse, 0, TAU); ctx.fill();
    if (d.type === 'camp') {
      // little tent + cold fire
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(0, -10); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a4028'; ctx.fillRect(-2, 0, 4, 6);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-14, 4, 4, 2);
    } else if (d.type === 'grave') {
      ctx.fillStyle = '#4a4438'; ctx.fillRect(-7, -6, 14, 12);
      ctx.fillStyle = '#3a3428'; ctx.beginPath(); ctx.arc(0, -6, 7, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#2a2620'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(180,140,220,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + d.t; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.stroke(); }
    }
    ctx.restore();
  }
  // Statue dust (world space)
  for (const f of S.fx) {
    if (f.type !== 'dust') continue;
    for (const p of (f.particles || [])) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = clamp(p.life, 0, 1) * 0.6;
      ctx.fillStyle = '#6a5a44';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Ancient glyphs — mystery symbols that brighten as the player nears.
  const glyphs = game.world && game.world.glyphs;
  if (glyphs) {
    const px = game.player.x, py = game.player.y;
    for (const g of glyphs) {
      const near = dist2(px, py, g.x, g.y) < 220 * 220;
      const pulse = 0.5 + Math.sin(game.runtime * 2 + g.x * 0.01) * 0.5;
      const a = (near ? 0.7 : 0.32) * (0.6 + pulse * 0.4);
      ctx.save();
      ctx.translate(g.x, g.y);
      const rad = 24;
      const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
      grd.addColorStop(0, `rgba(${g.col},${a})`);
      grd.addColorStop(1, `rgba(${g.col},0)`);
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${g.col},${a * 1.3})`; ctx.lineWidth = 2;
      ctx.beginPath();
      if (g.sym === 'chorus') { ctx.arc(0, 0, 10, 0, TAU); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); }
      else if (g.sym === 'seal') { ctx.moveTo(0, -12); ctx.lineTo(10, 6); ctx.lineTo(-10, 6); ctx.closePath(); }
      else if (g.sym === 'eye') { ctx.ellipse(0, 0, 12, 7, 0, 0, TAU); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); }
      else if (g.sym === 'crown') { ctx.moveTo(-10, 4); ctx.lineTo(-10, -2); ctx.lineTo(-4, 4); ctx.lineTo(0, -6); ctx.lineTo(4, 4); ctx.lineTo(10, -2); ctx.lineTo(10, 4); ctx.closePath(); }
      else { ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); }
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Screen-space layer (storm, lightning, fog, ambient fx, wanderers). Called after world restore.
export function drawScreen(game, ctx) {
  const S = game.worldEvents;
  if (!S) return;
  const { viewW, viewH } = game;

  // Storm darkness + heavy rain + fog
  if (S.storm) {
    ctx.fillStyle = 'rgba(4,6,12,0.34)';
    ctx.fillRect(0, 0, viewW, viewH);
    // fog
    for (const f of S.storm.fog) {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(120,130,150,${f.a})`); g.addColorStop(1, 'rgba(120,130,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
    // rain
    ctx.strokeStyle = 'rgba(150,160,200,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of S.storm.rain) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.len * 0.28, r.y + r.len); }
    ctx.stroke();
    // lightning flash
    if (S.storm.flash > 0) {
      ctx.fillStyle = `rgba(200,210,240,${S.storm.flash * 1.6})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Bell event warm pulse
  if (S.bell && S.bell.tollsLeft > 0) {
    const a = 0.04 + Math.sin(game.runtime * 4) * 0.03;
    ctx.fillStyle = `rgba(220,170,80,${a})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // Ambient fx
  for (const f of S.fx) {
    if (f.type === 'crows') {
      ctx.fillStyle = 'rgba(10,8,12,0.9)';
      for (const p of (f.particles || [])) {
        if (p.life <= 0) continue;
        const flap = Math.sin(p.life * 12) * 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 6, p.y - 4 + flap); ctx.lineTo(p.x + 6, p.y - 4 + flap); ctx.closePath();
        ctx.fill();
        p.x += p.vx * 0.016; p.y += p.vy * 0.016;
      }
    } else if (f.type === 'shadow') {
      const prog = clamp(f.t / f.dur, 0, 1);
      const a = Math.sin(prog * Math.PI) * 0.5;
      ctx.fillStyle = `rgba(8,6,12,${a})`;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, 26, 40, 0, 0, TAU); ctx.fill();
    } else if (f.type === 'wanderer') {
      const a = 0.55;
      ctx.fillStyle = `rgba(12,10,16,${a})`;
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, 8, 12, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(f.x, f.y - 9, 5, 0, TAU); ctx.fill();
      // faint lantern glimmer
      ctx.fillStyle = `rgba(255,200,120,${0.5 * (0.5 + Math.sin(f.t * 6) * 0.5)})`;
      ctx.beginPath(); ctx.arc(f.x + (f.vx > 0 ? 6 : -6), f.y - 2, 2, 0, TAU); ctx.fill();
    }
  }

  // Invasion tint
  if (S.invasion) {
    ctx.fillStyle = 'rgba(60,16,16,0.06)';
    ctx.fillRect(0, 0, viewW, viewH);
  }
}