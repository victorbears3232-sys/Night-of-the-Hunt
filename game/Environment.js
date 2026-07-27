// Environment.js — monumental gothic atmosphere layer for The Hollow Quarter.
// Pure rendering + ambience. No collision, no gameplay state. Drawn by HuntGame.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// Deterministic RNG so decorations are stable across frames.
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Landmark definitions (monumental, non-colliding silhouettes) ----------
function buildLandmarks(W, H) {
  return [
    // Colossal cathedral looming behind the Cathedral of Floods arena
    { type: 'grandCathedral', x: 3050, y: 1670, w: 1500, h: 1500, twin: true },
    // Bell tower rising beside Ashen Square (seen from hub)
    { type: 'bellTower', x: 1010, y: 360, w: 260, h: 1180 },
    // Clock tower on the far eastern ridge
    { type: 'clockTower', x: 3500, y: 1100, w: 320, h: 1300 },
    // Giant fallen statue collapsed across the hub's southern approach
    { type: 'fallenStatue', x: 360, y: 1760, w: 520, h: 240 },
    // Stone bridge spanning a gorge near the ancient forest
    { type: 'stoneBridge', x: 2450, y: 2120, w: 900, h: 220 },
    // Crumbling castle wall along the northern border
    { type: 'castleWall', x: 1800, y: 360, w: 1400, h: 520 },
    // Burning chapel looming behind the graveyard (Area 2)
    { type: 'burningChapel', x: 3660, y: 1696, w: 900, h: 1000 },
    // Twisted nightmare spire behind the dream (Area 3)
    { type: 'nightmareSpire', x: 4800, y: 1696, w: 760, h: 1500 },
    // ===== Southern continent landmarks =====
    // Colossal cathedral on a distant southern hill, seen across the necropolis
    { type: 'grandCathedral', x: 3800, y: 4460, w: 1500, h: 1500, twin: true },
    // Great bell tower rising over the ruined library
    { type: 'bellTower', x: 2250, y: 4356, w: 260, h: 1100 },
    // Castle wall along the far southern ridge
    { type: 'castleWall', x: 3000, y: 4460, w: 2000, h: 700 },
    // Giant fallen statue collapsed across the necropolis
    { type: 'fallenStatue', x: 700, y: 3520, w: 620, h: 280 },
    // Stone bridge spanning the cliffside ravine
    { type: 'stoneBridge', x: 4500, y: 4000, w: 900, h: 240 },
    // Distant clock tower on the southern ridge
    { type: 'clockTower', x: 4100, y: 4460, w: 300, h: 1200 },
    // Burning chapel behind the abandoned village
    { type: 'burningChapel', x: 700, y: 4380, w: 760, h: 800 },
    // ===== new recognisable landmarks (windmills + enormous trees) =====
    { type: 'windmill', x: 1400, y: 3600, w: 210, h: 380 },   // abandoned village
    { type: 'windmill', x: 3720, y: 2300, w: 200, h: 400 },   // above the old aqueduct
    { type: 'greatTree', x: 1700, y: 2520, w: 440, h: 600 },  // forgotten gardens elder
    { type: 'greatTree', x: 2300, y: 1900, w: 360, h: 500 },  // ancient forest
    { type: 'greatTree', x: 600, y: 2520, w: 360, h: 470 },   // sunken necropolis
    // ===== cathedral silhouettes behind the southern boss lairs =====
    { type: 'grandCathedral', x: 3000, y: 3700, w: 900, h: 1200, twin: true },  // behind the Sunken Cathedral (Mire Mother)
    { type: 'grandCathedral', x: 4100, y: 4380, w: 900, h: 1400, twin: true },  // behind the Overlook Cathedral (Hollow King)
    // ===== The Grand Ancient Library (monumental interior silhouettes) =====
    { type: 'grandShelf', x: 400, y: 5600, w: 700, h: 700 },     // towering archives shelves (west)
    { type: 'grandShelf', x: 2500, y: 5600, w: 500, h: 700 },    // towering study shelves (east)
    { type: 'stainedWindow', x: 1100, y: 4900, w: 1400, h: 700 }, // Great Hall window wall
    { type: 'chandelier', x: 1800, y: 4900, w: 200, h: 200 },      // Great Hall grand chandelier
    { type: 'libraryArch', x: 1300, y: 6360, w: 1000, h: 560 },  // Circular Archive arch
    { type: 'grandShelf', x: 1300, y: 6360, w: 1000, h: 560 },   // Archive towering shelf walls
    // ===== Signature plaza landmarks (each region a memorable place) =====
    { type: 'greatFountain', x: 560, y: 1380, w: 360, h: 200 },     // Hub plaza centerpiece
    { type: 'greatFountain', x: 700, y: 3000, w: 320, h: 190 },     // Necropolis plaza fountain
    { type: 'colossus', x: 2450, y: 820, w: 300, h: 820 },          // Cathedral plaza giant
    { type: 'colossus', x: 4520, y: 3500, w: 280, h: 760 },         // Overlook throne colossus
    { type: 'colossus', x: 750, y: 4700, w: 240, h: 640 },          // Sanctuary entrance colossus
    { type: 'triumphArch', x: 2760, y: 1180, w: 280, h: 560 },      // Cathedral -> Area 2 gate arch
    { type: 'triumphArch', x: 3360, y: 3000, w: 240, h: 480 },      // Sunken Cathedral entrance arch
    { type: 'triumphArch', x: 2480, y: 2140, w: 260, h: 420 },      // Forest -> south passage arch
    { type: 'monumentalStair', x: 700, y: 1700, w: 280, h: 540 },   // Grand Staircase hub -> necropolis
    { type: 'monumentalStair', x: 2100, y: 4356, w: 240, h: 360 },  // Library descent stair
    { type: 'monumentalStair', x: 4480, y: 3460, w: 240, h: 320 },  // Overlook cathedral approach stair
  ];
}

// ---------- Small prop scatter (gameplay-layer storytelling) ----------
const PROP_TYPES = ['tombstone', 'deadTree', 'statue', 'ironFence', 'brokenPillar',
  'coffin', 'altar', 'stoneCross', 'gargoyle', 'banner', 'hangingCage', 'wagon', 'fountain', 'candle'];

function buildProps(W, H) {
  const rng = mulberry(1337);
  const regions = [
    // Hub plaza
    { x: 150, y: 1200, w: 690, h: 460, dens: 14, pool: ['wagon', 'brokenPillar', 'fountain', 'statue', 'ironFence', 'candle', 'tombstone'] },
    // Ashen Square (overgrown, neglected)
    { x: 310, y: 380, w: 610, h: 320, dens: 12, pool: ['tombstone', 'stoneCross', 'deadTree', 'altar', 'candle', 'brokenPillar', 'hangingCage'] },
    // Weeping Alley (narrow — claustrophobic detail)
    { x: 545, y: 380, w: 175, h: 800, dens: 8, pool: ['ironFence', 'candle', 'banner', 'coffin', 'hangingCage', 'hangingChain'] },
    // East corridor
    { x: 1100, y: 1300, w: 400, h: 240, dens: 7, pool: ['brokenPillar', 'candle', 'tombstone', 'wagon', 'ironFence'] },
    // Hollow Crypt (graveyard chapel mood)
    { x: 1660, y: 1120, w: 400, h: 460, dens: 14, pool: ['tombstone', 'coffin', 'altar', 'stoneCross', 'candle', 'gargoyle', 'brokenPillar'] },
    // Cathedral courtyard (ceremonial ruins)
    { x: 2170, y: 840, w: 560, h: 820, dens: 16, pool: ['statue', 'gargoyle', 'brokenPillar', 'altar', 'candle', 'tombstone', 'stoneCross', 'fountain', 'hangingCage'] },
    // Ancient forest (dead trees, overgrown)
    { x: 2170, y: 1780, w: 560, h: 340, dens: 14, pool: ['deadTree', 'stoneCross', 'tombstone', 'brokenPillar', 'candle'] },
    // Area 2 — The Burning Graveyard
    { x: 2880, y: 860, w: 920, h: 820, dens: 20, pool: ['tombstone', 'coffin', 'altar', 'stoneCross', 'candle', 'gargoyle', 'brokenPillar', 'wagon', 'barrel'] },
    // Area 3 — The Nightmare
    { x: 3960, y: 860, w: 1080, h: 820, dens: 18, pool: ['brokenPillar', 'statue', 'altar', 'candle', 'hangingCage', 'tombstone', 'deadTree'] },
    // --- southern continent ---
    { x: 150, y: 2300, w: 1340, h: 1200, dens: 26, pool: ['tombstone', 'coffin', 'altar', 'stoneCross', 'brokenPillar', 'candle', 'gargoyle', 'statue', 'ironFence'] },
    { x: 1520, y: 2220, w: 1260, h: 1480, dens: 18, pool: ['deadTree', 'statue', 'fountain', 'stoneCross', 'candle', 'brokenPillar', 'tombstone'] },
    { x: 2900, y: 2220, w: 980, h: 1480, dens: 14, pool: ['brokenPillar', 'candle', 'wagon', 'coffin', 'ironFence', 'hangingCage'] },
    { x: 3920, y: 2240, w: 1080, h: 1760, dens: 16, pool: ['deadTree', 'stoneCross', 'brokenPillar', 'candle', 'gargoyle', 'statue'] },
    { x: 1620, y: 3740, w: 1280, h: 620, dens: 20, pool: ['brokenPillar', 'candle', 'altar', 'statue', 'gargoyle', 'banner', 'hangingCage', 'coffin'] },
    { x: 150, y: 3540, w: 1340, h: 840, dens: 18, pool: ['wagon', 'coffin', 'tombstone', 'brokenPillar', 'candle', 'ironFence', 'banner', 'stoneCross', 'barrel'] },
    // Sunken Cathedral interior (Mire Mother's lair)
    { x: 3020, y: 3020, w: 720, h: 640, dens: 14, pool: ['brokenPillar', 'altar', 'candle', 'statue', 'gargoyle', 'coffin'] },
    // Overlook Cathedral interior (Hollow King's lair)
    { x: 4120, y: 3520, w: 820, h: 820, dens: 16, pool: ['brokenPillar', 'altar', 'statue', 'gargoyle', 'candle', 'banner', 'tombstone', 'hangingChain'] },
    // ===== The Grand Ancient Library =====
    { x: 420, y: 4920, w: 660, h: 660, dens: 16, pool: ['candle', 'brokenPillar', 'altar', 'coffin', 'tombstone', 'banner'] },
    { x: 1120, y: 4920, w: 1360, h: 660, dens: 18, pool: ['candle', 'brokenPillar', 'statue', 'altar', 'banner', 'gargoyle', 'tombstone', 'hangingChain', 'barrel'] },
    { x: 2520, y: 4920, w: 460, h: 660, dens: 12, pool: ['candle', 'brokenPillar', 'coffin', 'banner', 'altar', 'barrel', 'hangingChain'] },
    { x: 1320, y: 5820, w: 960, h: 520, dens: 14, pool: ['candle', 'brokenPillar', 'altar', 'statue', 'gargoyle', 'banner'] },
  ];
  const props = [];
  for (const r of regions) {
    const n = Math.floor(r.dens);
    for (let i = 0; i < n; i++) {
      const x = r.x + rng() * r.w;
      const y = r.y + rng() * r.h;
      const type = r.pool[Math.floor(rng() * r.pool.length)];
      props.push({ x, y, type, s: 0.8 + rng() * 0.5, seed: Math.floor(rng() * 9999), flip: rng() > 0.5 });
    }
  }
  // A few gargoyles perched on cathedral walls
  for (let i = 0; i < 6; i++) props.push({ x: 2200 + i * 90, y: 860, type: 'gargoyle', s: 1, seed: i * 7, perched: true });
  // Hand-placed signature props — intentional landmarks, not random scatter
  const place = (type, x, y) => props.push({ x, y, type, s: 1, seed: (x * 13 + y) & 4095, flip: false });
  place('well', 560, 1320);
  place('bench', 640, 1440); place('bench', 700, 1290);
  place('shrine', 2450, 1340); place('shrine', 2320, 1980);
  place('crate', 3300, 1320); place('crate', 3380, 1340); place('crate', 3460, 1310);
  place('well', 700, 3700);
  place('rubble', 760, 2700); place('rubble', 900, 3120); place('rubble', 420, 3300);
  place('bench', 2200, 2960); place('bench', 2260, 4080);
  place('crate', 2000, 4060); place('crate', 2600, 4100);
  place('shrine', 750, 5120); place('shrine', 750, 5800);
  place('rubble', 4300, 3700); place('rubble', 4600, 3900);
  place('bench', 4500, 3960);
  place('well', 1800, 5250);
  place('barrel', 1180, 1380); place('barrel', 2800, 1240); place('barrel', 700, 5250);
  place('hangingChain', 632, 760); place('hangingChain', 1800, 5000); place('hangingChain', 2900, 5400);
  return props;
}

// Torch braziers and candle clusters placed along corridors and at plazas.
// Read as warm breadcrumb lights guiding exploration; clusters mark open spaces.
function buildPathLights() {
  const pl = [];
  const ring = (cx, cy, n, rad) => { for (let i = 0; i < n; i++) { const a = (i / n) * TAU - Math.PI / 2; pl.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); } };
  const line = (x0, y0, x1, y1, n) => { for (let i = 1; i < n; i++) pl.push({ x: x0 + (x1 - x0) * (i / n), y: y0 + (y1 - y0) * (i / n) }); };
  // plazas & courtyards (a tight ring reads as an open square)
  ring(560, 1380, 5, 64); ring(620, 560, 4, 48); ring(1850, 1340, 4, 54);
  ring(2450, 1100, 4, 64); ring(2450, 1460, 4, 64); ring(3200, 1260, 4, 58);
  ring(4300, 1280, 4, 62); ring(700, 3000, 5, 68); ring(2200, 2900, 4, 58);
  ring(3400, 3000, 4, 54); ring(4500, 3900, 4, 52); ring(2250, 4050, 4, 56); ring(700, 4000, 4, 52);
  // corridor torches (breadcrumbs along passages)
  line(632, 520, 632, 1100, 5); line(1180, 1380, 1380, 1380, 3);
  line(2820, 1240, 2820, 1320, 3); line(3860, 1240, 3860, 1320, 3);
  line(700, 2500, 700, 3500, 5); line(3100, 2500, 3500, 3300, 4);
  line(4200, 2700, 4600, 3800, 4); line(400, 3900, 1300, 4100, 4);
  ring(3380, 3340, 5, 60); ring(4520, 3850, 5, 70);
  // The Grand Ancient Library
  ring(2100, 4700, 4, 48); ring(1800, 5250, 5, 60); ring(700, 5250, 4, 48); ring(2700, 5250, 4, 48); ring(1800, 6100, 6, 64);
  line(2100, 4880, 1800, 5600, 3); line(1800, 5600, 1800, 5900, 3);
  return pl;
}

export default class Environment {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.landmarks = buildLandmarks(W, H);
    this.props = buildProps(W, H);
    this.pathLights = buildPathLights();
    this.districts = [
      { x: 2160, y: 820, w: 600, h: 880, col: '60,100,160' },     // Cathedral — blue moonlight
      { x: 400, y: 4500, w: 2600, h: 1860, col: '150,100,50' },   // Library — warm candlelight
      { x: 120, y: 2280, w: 1380, h: 1260, col: '50,90,60' },     // Necropolis — green mist
      { x: 4100, y: 3500, w: 860, h: 880, col: '130,40,40' },      // Overlook — crimson
      { x: 2860, y: 820, w: 960, h: 900, col: '120,50,20' },      // Graveyard — ember
      { x: 3940, y: 820, w: 1120, h: 900, col: '90,50,140' },     // Nightmare — cosmic
      { x: 120, y: 3540, w: 1380, h: 860, col: '90,70,50' },      // Village — cold brown
      { x: 1500, y: 2200, w: 1300, h: 1540, col: '60,90,55' },    // Gardens — muted green
      { x: 2900, y: 2200, w: 1000, h: 1540, col: '50,60,75' },    // Aqueduct — damp grey-blue
      { x: 3900, y: 2200, w: 1100, h: 2260, col: '70,70,80' },    // Cliffside — grey
      { x: 60, y: 4400, w: 1440, h: 1960, col: '150,120,60' },    // Sanctuary — warm gold
      { x: 120, y: 360, w: 980, h: 1340, col: '60,55,70' },      // Ashen Square — cold
      { x: 4200, y: 4400, w: 760, h: 1960, col: '170,180,200' },  // Drowned Sanctum — silver mist
    ];
    this.bridges = [
      { x0: 2740, x1: 2860, y0: 1200, y1: 1300, chasmN: 820, chasmS: 1696 },
    ];
    this.sound = null;
    // Ambience particles
    this.crows = [];
    this.leaves = [];
    this.ash = [];
    this.dust = [];
    this.embers = [];
    this.fog = [];
    // Audio scheduler
    this._bellT = 6 + Math.random() * 8;
    this._ravenT = 4 + Math.random() * 6;
    this._windT = 3 + Math.random() * 5;
    this._creakT = 10 + Math.random() * 12;
  }

  setSound(s) { this.sound = s; }

  initParticles(viewW, viewH) {
    this.crows = [];
    this.leaves = [];
    for (let i = 0; i < 26; i++) this.leaves.push(this._newLeaf(viewW, viewH, true));
    this.ash = [];
    for (let i = 0; i < 40; i++) this.ash.push({ x: Math.random() * viewW, y: Math.random() * viewH, vx: -6 - Math.random() * 8, vy: 4 + Math.random() * 10, r: 0.6 + Math.random() * 1.4, a: 0.05 + Math.random() * 0.12 });
    this.embers = [];
    for (let i = 0; i < 14; i++) this.embers.push({ x: Math.random() * viewW, y: Math.random() * viewH, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 14, r: 0.6 + Math.random() * 1.1, life: Math.random() * 4, a: 0.1 + Math.random() * 0.16 });
    this.fog = [];
    for (let i = 0; i < 5; i++) this.fog.push({ x: Math.random() * viewW, y: viewH * 0.3 + Math.random() * viewH * 0.6, r: 130 + Math.random() * 180, vx: 4 + Math.random() * 8, a: 0.03 + Math.random() * 0.045 });
  }

  _newLeaf(viewW, viewH, anywhere) {
    return {
      x: anywhere ? Math.random() * viewW : -20,
      y: anywhere ? Math.random() * viewH : -20 - Math.random() * 80,
      vx: -20 - Math.random() * 30, vy: 26 + Math.random() * 30,
      rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4,
      r: 3 + Math.random() * 3, sway: Math.random() * TAU,
      color: ['#6a4a2a', '#7a3a1a', '#5a3a2a', '#8a5a2a', '#4a2a1a'][Math.floor(Math.random() * 5)],
    };
  }

  update(dt, runtime, viewW, viewH, camera) {
    this.runtime = runtime;
    // leaves
    for (const l of this.leaves) {
      l.sway += dt * 2;
      l.x += l.vx * dt + Math.sin(l.sway) * 14 * dt;
      l.y += l.vy * dt;
      l.rot += l.vr * dt;
      if (l.y > viewH + 30 || l.x < -40) Object.assign(l, this._newLeaf(viewW, viewH, false));
    }
    // ash / dust
    for (const a of this.ash) {
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.y > viewH) { a.y = -4; a.x = Math.random() * viewW; }
      if (a.x < -10) a.x = viewW + 10;
    }
    // embers
    for (const e of this.embers) { e.x += e.vx * dt; e.y += e.vy * dt; e.life += dt; if (e.y < -10) { e.y = viewH + 6; e.x = Math.random() * viewW; } }
    // drifting fog banks
    for (const f of this.fog) { f.x += f.vx * dt; if (f.x - f.r > viewW) f.x = -f.r; }
    // crows
    for (const c of this.crows) {
      c.x += c.vx * dt; c.y += c.vy * dt; c.wing += dt * 10;
      c.life -= dt;
      if (c.life <= 0 || c.x < -60 || c.x > viewW + 60 || c.y < -60) c.dead = true;
    }
    this.crows = this.crows.filter(c => !c.dead);
    // occasionally spawn a crow flock
    if (Math.random() < 0.0016 && this.crows.length < 14) {
      const fromLeft = Math.random() > 0.5;
      const baseY = 40 + Math.random() * (viewH * 0.4);
      const n = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) this.crows.push({
        x: fromLeft ? -40 - i * 30 : viewW + 40 + i * 30,
        y: baseY + (Math.random() - 0.5) * 60,
        vx: (fromLeft ? 1 : -1) * (60 + Math.random() * 40),
        vy: (Math.random() - 0.5) * 14,
        wing: Math.random() * TAU, life: 14,
      });
    }
    // ambient audio scheduling
    if (!this.sound) return;
    this._bellT -= dt; this._ravenT -= dt; this._windT -= dt; this._creakT -= dt;
    if (this._bellT <= 0) { this._bellT = 14 + Math.random() * 22; this.sound.bell(); }
    if (this._ravenT <= 0) { this._ravenT = 6 + Math.random() * 14; this.sound.raven(); }
    if (this._windT <= 0) { this._windT = 5 + Math.random() * 10; this.sound.windGust(); }
    if (this._creakT <= 0) { this._creakT = 12 + Math.random() * 20; this.sound.creak(); }
  }

  // ================= RENDER: SKY (screen space, parallax) =================
  drawSky(ctx, camera, viewW, viewH) {
    // vertical night gradient
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, '#05060a');
    g.addColorStop(0.45, '#0a0d16');
    g.addColorStop(0.8, '#10131c');
    g.addColorStop(1, '#070810');
    ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, viewH);

    // stars (static, faint twinkle)
    const sr = mulberry(42);
    ctx.fillStyle = '#cdd6e8';
    for (let i = 0; i < 90; i++) {
      const sx = sr() * viewW, sy = sr() * viewH * 0.7;
      const tw = 0.3 + 0.5 * Math.abs(Math.sin(this.runtime * 0.8 + i));
      ctx.globalAlpha = tw * 0.5;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    // moon with cold halo (slight parallax)
    const mx = viewW * 0.72 - camera.x * 0.04;
    const my = viewH * 0.22 - camera.y * 0.02;
    const halo = ctx.createRadialGradient(mx, my, 10, mx, my, 180);
    halo.addColorStop(0, 'rgba(180,200,235,0.4)');
    halo.addColorStop(0.4, 'rgba(150,175,220,0.12)');
    halo.addColorStop(1, 'rgba(150,175,220,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, 180, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dfe6f2'; ctx.beginPath(); ctx.arc(mx, my, 46, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c4cee0'; ctx.beginPath(); ctx.arc(mx - 12, my - 8, 14, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 18, my + 10, 9, 0, TAU); ctx.fill();

    // distant mountain ridge (parallax 0.15)
    this._drawRidge(ctx, camera, viewW, viewH, 0.15, viewH * 0.55, '#0c1018', 120, 7);
    // distant city skyline silhouettes (parallax 0.3): a far colossal cathedral + towers
    ctx.save();
    ctx.translate(-camera.x * 0.3, -camera.y * 0.3);
    this._drawDistantCity(ctx, viewW, viewH, camera);
    ctx.restore();
    this._drawRidge(ctx, camera, viewW, viewH, 0.3, viewH * 0.66, '#080a10', 80, 5);
  }

  _drawRidge(ctx, camera, viewW, viewH, par, baseY, color, amp, count) {
    const off = camera.x * par;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let i = 0; i <= count; i++) {
      const x = (i / count) * viewW;
      const seed = Math.sin(i * 12.9 + off * 0.002);
      const y = baseY - amp * 0.5 + seed * amp - (i % 2) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH); ctx.closePath(); ctx.fill();
  }

  _drawDistantCity(ctx, viewW, viewH, camera) {
    // a remote giant cathedral + spires along the horizon
    const baseY = viewH * 0.62;
    ctx.fillStyle = '#0a0d14';
    // long wall
    ctx.fillRect(-200, baseY, viewW + 400, viewH - baseY);
    // towers
    const towers = [0.08, 0.2, 0.36, 0.52, 0.68, 0.84, 0.94];
    for (let i = 0; i < towers.length; i++) {
      const tx = towers[i] * viewW;
      const th = 60 + (i % 3) * 50 + Math.sin(i) * 20;
      ctx.fillRect(tx, baseY - th, 18, th);
      ctx.beginPath(); ctx.moveTo(tx, baseY - th); ctx.lineTo(tx + 9, baseY - th - 22); ctx.lineTo(tx + 18, baseY - th); ctx.closePath(); ctx.fill();
    }
    // colossal cathedral silhouette center-far
    const cx = viewW * 0.5, cw = 220, ch = 240;
    ctx.fillRect(cx - cw / 2, baseY - ch, cw, ch);
    // twin spires
    for (const s of [-1, 1]) {
      const sx = cx + s * (cw * 0.42);
      ctx.fillRect(sx - 14, baseY - ch - 80, 28, 80);
      ctx.beginPath(); ctx.moveTo(sx, baseY - ch - 80); ctx.lineTo(sx - 14, baseY - ch - 80); ctx.lineTo(sx, baseY - ch - 120); ctx.closePath(); ctx.fill();
    }
    // rose window hint
    ctx.fillStyle = 'rgba(150,170,210,0.08)';
    ctx.beginPath(); ctx.arc(cx, baseY - ch * 0.55, 30, 0, TAU); ctx.fill();
  }

  // ================= RENDER: BACKGROUND (world space, monumental) =================
  drawBackground(ctx, camera, viewW, viewH) {
    for (const l of this.landmarks) {
      // cull
      if (l.x + l.w < camera.x - 100 || l.x > camera.x + viewW + 100) continue;
      if (l.y + l.h < camera.y - 100 || l.y > camera.y + viewH + 200) continue;
      switch (l.type) {
        case 'grandCathedral': this._drawGrandCathedral(ctx, l); break;
        case 'bellTower': this._drawBellTower(ctx, l); break;
        case 'clockTower': this._drawClockTower(ctx, l); break;
        case 'fallenStatue': this._drawFallenStatue(ctx, l); break;
        case 'stoneBridge': this._drawStoneBridge(ctx, l); break;
        case 'castleWall': this._drawCastleWall(ctx, l); break;
        case 'burningChapel': this._drawBurningChapel(ctx, l); break;
        case 'nightmareSpire': this._drawNightmareSpire(ctx, l); break;
        case 'windmill': this._drawWindmill(ctx, l); break;
        case 'greatTree': this._drawGreatTree(ctx, l); break;
        case 'grandShelf': this._drawGrandShelf(ctx, l); break;
        case 'stainedWindow': this._drawStainedWindow(ctx, l); break;
        case 'chandelier': this._drawChandelier(ctx, l); break;
        case 'libraryArch': this._drawLibraryArch(ctx, l); break;
        case 'greatFountain': this._drawGreatFountain(ctx, l); break;
        case 'colossus': this._drawColossus(ctx, l); break;
        case 'monumentalStair': this._drawMonumentalStair(ctx, l); break;
        case 'triumphArch': this._drawTriumphArch(ctx, l); break;
      }
    }
  }

  _silhouette(ctx, x, y, w, h, base, top) {
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y + h - 6, w, 6);
  }

  _drawGrandCathedral(ctx, l) {
    const { x, y, w, h } = l;
    // main body
    this._silhouette(ctx, x, y - h, w, h, '#11131a', '#1c2030');
    // roof ridge
    ctx.fillStyle = '#0c0e14';
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y - h - 70); ctx.lineTo(x + w, y - h); ctx.closePath(); ctx.fill();
    // flying buttresses along both flanks
    ctx.strokeStyle = '#171a24'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const by = y - h * 0.3 - i * (h * 0.12);
      ctx.beginPath(); ctx.moveTo(x - 4, by); ctx.quadraticCurveTo(x - 40, by + 30, x - 4, by + 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w + 4, by); ctx.quadraticCurveTo(x + w + 40, by + 30, x + w + 4, by + 60); ctx.stroke();
    }
    // twin frontal towers
    for (const s of [-1, 1]) {
      const tx = x + w / 2 + s * (w * 0.4);
      const tw = 150, th = h * 0.7;
      this._silhouette(ctx, tx - tw / 2, y - th, tw, th, '#141722', '#222636');
      // spire
      ctx.fillStyle = '#0c0e14';
      ctx.beginPath(); ctx.moveTo(tx - tw / 2, y - th); ctx.lineTo(tx, y - th - 140); ctx.lineTo(tx + tw / 2, y - th); ctx.closePath(); ctx.fill();
      // belfry window (faint cold light)
      ctx.fillStyle = 'rgba(150,180,220,0.12)';
      ctx.fillRect(tx - 8, y - th + 40, 16, 36);
    }
    // rose window
    ctx.fillStyle = 'rgba(140,160,200,0.10)';
    ctx.beginPath(); ctx.arc(x + w / 2, y - h * 0.55, 70, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,180,0.18)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + w / 2, y - h * 0.55, 70, 0, TAU); ctx.stroke();
    // row of tall lancet windows glowing faintly
    ctx.fillStyle = 'rgba(170,190,225,0.08)';
    for (let i = 0; i < 7; i++) {
      const wx = x + 120 + i * ((w - 240) / 7);
      ctx.fillRect(wx, y - h * 0.4, 22, h * 0.25);
    }
    // colossal sealed doors
    ctx.fillStyle = '#07080c';
    ctx.fillRect(x + w / 2 - 80, y - 220, 160, 220);
    ctx.strokeStyle = 'rgba(120,100,70,0.4)'; ctx.lineWidth = 4;
    ctx.strokeRect(x + w / 2 - 80, y - 220, 160, 220);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - 220); ctx.lineTo(x + w / 2, y); ctx.stroke();
  }

  _drawBellTower(ctx, l) {
    const { x, y, w, h } = l;
    this._silhouette(ctx, x - w / 2, y - h, w, h, '#141822', '#232838');
    // tapered upper stage
    ctx.fillStyle = '#10131c';
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 20, y - h); ctx.lineTo(x + w / 2 - 20, y - h); ctx.lineTo(x + w / 2 - 40, y - h - 220); ctx.lineTo(x - w / 2 + 40, y - h - 220); ctx.closePath(); ctx.fill();
    // belfry openings (twin arches)
    ctx.fillStyle = 'rgba(170,190,225,0.10)';
    for (const s of [-1, 1]) {
      const bx = x + s * 36;
      ctx.fillRect(bx - 18, y - h - 150, 36, 90);
    }
    // spire
    ctx.fillStyle = '#0c0e14';
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 40, y - h - 220); ctx.lineTo(x, y - h - 380); ctx.lineTo(x + w / 2 - 40, y - h - 220); ctx.closePath(); ctx.fill();
    // hanging bell hint
    ctx.strokeStyle = 'rgba(180,160,120,0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - h - 110, 16, 0, TAU); ctx.stroke();
    // faint window slits
    ctx.fillStyle = 'rgba(150,175,220,0.06)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x - 6, y - 60 - i * 160, 12, 40);
  }

  _drawClockTower(ctx, l) {
    const { x, y, w, h } = l;
    this._silhouette(ctx, x - w / 2, y - h, w, h, '#121620', '#202636');
    // clock face
    const cy = y - h + 120;
    ctx.fillStyle = '#0a0c12'; ctx.beginPath(); ctx.arc(x, cy, 64, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(180,170,130,0.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, cy, 64, 0, TAU); ctx.stroke();
    // hands (slowly rotating)
    const a1 = this.runtime * 0.05, a2 = this.runtime * 0.4;
    ctx.strokeStyle = 'rgba(200,190,150,0.5)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(a1) * 44, cy + Math.sin(a1) * 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(a2) * 30, cy + Math.sin(a2) * 30); ctx.stroke();
    // spire
    ctx.fillStyle = '#0c0e14';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x, y - h - 160); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
  }

  _drawFallenStatue(ctx, l) {
    const { x, y, w } = l;
    // a giant broken figure lying across the street
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);
    ctx.fillStyle = '#1a1d28';
    // torso
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.32, 46, 0, 0, TAU); ctx.fill();
    // head (broken off, separate)
    ctx.beginPath(); ctx.arc(w * 0.4, -10, 36, 0, TAU); ctx.fill();
    // legs
    ctx.fillStyle = '#161922';
    ctx.beginPath(); ctx.moveTo(-w * 0.3, 0); ctx.lineTo(-w * 0.5, 20); ctx.lineTo(-w * 0.48, 40); ctx.lineTo(-w * 0.2, 30); ctx.closePath(); ctx.fill();
    // arm reaching up (broken)
    ctx.strokeStyle = '#1a1d28'; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w * 0.1, -30); ctx.lineTo(w * 0.2, -90); ctx.stroke();
    // moss
    ctx.fillStyle = 'rgba(60,80,50,0.25)';
    ctx.beginPath(); ctx.ellipse(-w * 0.1, 30, 60, 14, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  _drawStoneBridge(ctx, l) {
    const { x, y, w, h } = l;
    ctx.fillStyle = '#161a24';
    ctx.fillRect(x - w / 2, y - h, w, 24);
    // arches
    ctx.fillStyle = '#07080c';
    const arches = 5;
    for (let i = 0; i < arches; i++) {
      const ax = x - w / 2 + 30 + i * ((w - 60) / arches);
      const aw = (w - 60) / arches - 14;
      ctx.beginPath(); ctx.moveTo(ax, y - h + 24); ctx.lineTo(ax, y); ctx.quadraticCurveTo(ax + aw / 2, y - 14, ax + aw, y); ctx.lineTo(ax + aw, y - h + 24); ctx.closePath(); ctx.fill();
    }
    // broken span gap
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + w * 0.1, y - h, 40, 24);
    // rail pillars
    ctx.fillStyle = '#1c2030';
    for (let i = 0; i <= 10; i++) {
      const px = x - w / 2 + 10 + i * ((w - 20) / 10);
      ctx.fillRect(px, y - h - 18, 6, 18);
    }
  }

  _drawCastleWall(ctx, l) {
    const { x, y, w, h } = l;
    this._silhouette(ctx, x, y - h, w, h, '#12161f', '#202636');
    // battlements
    ctx.fillStyle = '#0c0e14';
    for (let bx = x; bx < x + w; bx += 36) ctx.fillRect(bx, y - h - 16, 18, 16);
    // towers along the wall
    for (let i = 0; i < 4; i++) {
      const tx = x + 120 + i * ((w - 240) / 3);
      const th = h * 0.7;
      this._silhouette(ctx, tx - 40, y - th, 80, th, '#161a26', '#262c3c');
      ctx.fillStyle = '#0c0e14';
      ctx.beginPath(); ctx.moveTo(tx - 40, y - th); ctx.lineTo(tx, y - th - 80); ctx.lineTo(tx + 40, y - th); ctx.closePath(); ctx.fill();
    }
    // arrow slits glowing faintly
    ctx.fillStyle = 'rgba(150,175,220,0.06)';
    for (let i = 0; i < 14; i++) ctx.fillRect(x + 30 + i * 90, y - h * 0.5, 6, 30);
  }

  _drawBurningChapel(ctx, l) {
    const { x, y, w, h } = l;
    this._silhouette(ctx, x - w / 2, y - h, w, h, '#1a120c', '#2a1c12');
    ctx.fillStyle = '#120c08';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x, y - h - 90); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    const tx = x + w * 0.32;
    ctx.fillStyle = '#16100a'; ctx.fillRect(tx - 40, y - h - 160, 80, 160);
    ctx.fillStyle = '#0c0806'; ctx.beginPath(); ctx.moveTo(tx - 40, y - h - 160); ctx.lineTo(tx, y - h - 240); ctx.lineTo(tx + 40, y - h - 160); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(220,110,40,0.22)';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - w / 2 + 60 + i * ((w - 120) / 5), y - h * 0.55, 26, h * 0.3);
    ctx.fillStyle = 'rgba(255,150,60,0.3)'; ctx.fillRect(tx - 12, y - h - 120, 24, 50);
    ctx.fillStyle = 'rgba(230,120,40,0.2)'; ctx.beginPath(); ctx.arc(x, y - h * 0.6, 50, 0, TAU); ctx.fill();
  }

  _drawNightmareSpire(ctx, l) {
    const { x, y, w, h } = l;
    ctx.fillStyle = '#160a26';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + 60, y - h * 0.7);
    ctx.lineTo(x - 20, y - h);
    ctx.lineTo(x + 20, y - h);
    ctx.lineTo(x + w / 2 - 60, y - h * 0.7);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#221036'; ctx.fillRect(x - w / 2, y - 6, w, 6);
    ctx.fillStyle = 'rgba(170,110,220,0.3)';
    for (let i = 0; i < 5; i++) {
      const a = this.runtime * 0.3 + i * 1.25;
      const rx = x + Math.cos(a) * (w * 0.5);
      const ry = y - h * 0.6 + Math.sin(a) * 120;
      ctx.beginPath(); ctx.moveTo(rx, ry - 16); ctx.lineTo(rx + 8, ry); ctx.lineTo(rx, ry + 16); ctx.lineTo(rx - 8, ry); ctx.closePath(); ctx.fill();
    }
    const g = ctx.createRadialGradient(x, y - h, 10, x, y - h, 200);
    g.addColorStop(0, 'rgba(190,120,255,0.3)'); g.addColorStop(1, 'rgba(190,120,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - h, 200, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(170,110,220,0.10)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x - 5, y - 120 - i * (h * 0.13), 10, 40);
  }

  // ================= RENDER: PATH LIGHTS (world space, additive beacons) =================
  drawPathLights(ctx, camera, viewW, viewH) {
    // iron posts (source-over)
    ctx.fillStyle = '#15110a';
    for (const t of this.pathLights) {
      if (t.x < camera.x - 20 || t.x > camera.x + viewW + 20 || t.y < camera.y - 20 || t.y > camera.y + viewH + 20) continue;
      ctx.fillRect(t.x - 1, t.y, 2, 6);
    }
    // warm glows (additive)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const t of this.pathLights) {
      if (t.x < camera.x - 40 || t.x > camera.x + viewW + 40 || t.y < camera.y - 40 || t.y > camera.y + viewH + 40) continue;
      const fl = 0.7 + Math.sin(this.runtime * 7 + t.x * 0.05) * 0.3;
      const sw = Math.sin(this.runtime * 1.4 + t.x * 0.04) * 2.2;   // gentle lantern sway
      const lx = t.x + sw;
      const g = ctx.createRadialGradient(lx, t.y - 2, 0, lx, t.y - 2, 32);
      g.addColorStop(0, `rgba(255,170,70,${0.6 * fl})`);
      g.addColorStop(0.5, `rgba(255,130,50,${0.22 * fl})`);
      g.addColorStop(1, 'rgba(255,130,50,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, t.y - 2, 32, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,225,150,${0.9 * fl})`;
      ctx.beginPath(); ctx.arc(lx, t.y - 2, 1.8, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  _drawWindmill(ctx, l) {
    const { x, y, w, h } = l;
    this._silhouette(ctx, x - w / 2, y - h, w, h, '#1a1612', '#2a241c');
    ctx.fillStyle = '#100c08';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x, y - h - 44); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    const hx = x + w * 0.08, hy = y - h * 0.55;
    const a = this.runtime * 0.25;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const aa = a + i * Math.PI / 2;
      ctx.strokeStyle = 'rgba(205,185,140,0.5)'; ctx.lineWidth = 3;
      const ex = hx + Math.cos(aa) * w * 0.62, ey = hy + Math.sin(aa) * w * 0.62;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
      const px = Math.cos(aa + Math.PI / 2), py = Math.sin(aa + Math.PI / 2);
      ctx.strokeStyle = 'rgba(180,160,120,0.22)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex - px * 9, ey - py * 9); ctx.lineTo(ex + px * 9, ey + py * 9); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,180,80,0.12)'; ctx.fillRect(x - 6, y - h * 0.3, 12, 16);
  }

  _drawGreatTree(ctx, l) {
    const { x, y, w, h } = l;
    ctx.fillStyle = '#0a0806';
    ctx.beginPath(); ctx.moveTo(x - w * 0.12, y); ctx.lineTo(x - w * 0.06, y - h * 0.6); ctx.lineTo(x + w * 0.06, y - h * 0.6); ctx.lineTo(x + w * 0.12, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0c1410'; ctx.beginPath(); ctx.arc(x, y - h * 0.7, w * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#101a14'; ctx.beginPath(); ctx.arc(x - w * 0.2, y - h * 0.78, w * 0.28, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w * 0.22, y - h * 0.72, w * 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0a0806'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const bx = x + (i - 2) * w * 0.08; ctx.beginPath(); ctx.moveTo(bx, y - h * 0.6); ctx.lineTo(bx + (i - 2) * 4, y - h * 0.95); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,180,220,0.22)';
    for (let i = 0; i < 6; i++) { const a = this.runtime * 0.2 + i * 1.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * w * 0.4, y - h * 0.8 + Math.sin(a) * w * 0.3, 1.6, 0, TAU); ctx.fill(); }
  }

  _drawGrandShelf(ctx, l) {
    const { x, y, w, h } = l;
    // towering bookshelf wall looming behind the gameplay layer
    this._silhouette(ctx, x, y - h, w, h, '#15120c', '#241c12');
    // shelf horizontals with book spines
    const rows = Math.max(4, Math.floor(h / 90));
    for (let i = 0; i < rows; i++) {
      const ry = y - (i + 1) * (h / rows);
      ctx.fillStyle = '#1a140c'; ctx.fillRect(x, ry, w, 6);
      const r = mulberry(Math.floor(x + ry));
      for (let bx = x + 6; bx < x + w - 6; bx += 10) {
        const bh = 10 + r() * 20;
        ctx.fillStyle = r() > 0.5 ? '#2a1c12' : '#3a2a1a';
        ctx.fillRect(bx, ry - bh, 7, bh);
      }
    }
    // faint candle glows between shelves
    ctx.fillStyle = 'rgba(255,180,80,0.10)';
    for (let i = 0; i < 5; i++) { const cx = x + 40 + i * (w / 5); ctx.beginPath(); ctx.arc(cx, y - h * 0.5, 14, 0, TAU); ctx.fill(); }
  }

  _drawStainedWindow(ctx, l) {
    const { x, y, w, h } = l;
    // tall arched window wall with faint colored glow
    this._silhouette(ctx, x, y - h, w, h, '#12131a', '#1e2030');
    const cols = Math.max(3, Math.floor(w / 160));
    for (let i = 0; i < cols; i++) {
      const wx = x + 30 + i * ((w - 60) / cols);
      const ww = ((w - 60) / cols) - 20;
      const wh = h * 0.8;
      // arched window frame
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(wx, y - wh, ww, wh);
      ctx.beginPath(); ctx.arc(wx + ww / 2, y - wh, ww / 2, Math.PI, 0); ctx.fill();
      // faint stained glow
      const r = mulberry(Math.floor(wx + y));
      const hue = r() > 0.5 ? '170,120,200' : '120,150,200';
      const g = ctx.createLinearGradient(wx, y - wh, wx, y);
      g.addColorStop(0, `rgba(${hue},0.18)`);
      g.addColorStop(1, `rgba(${hue},0.04)`);
      ctx.fillStyle = g;
      ctx.fillRect(wx + 4, y - wh + 6, ww - 8, wh - 10);
      // leading strips
      ctx.strokeStyle = 'rgba(10,11,16,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx + ww / 2, y - wh); ctx.lineTo(wx + ww / 2, y); ctx.moveTo(wx, y - wh * 0.5); ctx.lineTo(wx + ww, y - wh * 0.5); ctx.stroke();
    }
  }

  _drawChandelier(ctx, l) {
    const { x, y, w, h } = l;
    const cx = x + w / 2, cy = y - h * 0.5;
    // chain to the unseen ceiling
    ctx.strokeStyle = 'rgba(20,16,12,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, y - h); ctx.lineTo(cx, cy); ctx.stroke();
    // ring
    ctx.strokeStyle = '#3a2c1a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.5, h * 0.18, 0, 0, TAU); ctx.stroke();
    // candles
    const flick = 0.7 + Math.sin(this.runtime * 6) * 0.3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const ex = cx + Math.cos(a) * w * 0.5, ey = cy + Math.sin(a) * h * 0.18;
      ctx.fillStyle = '#c9a86a'; ctx.fillRect(ex - 1.5, ey - 5, 3, 6);
      const g = ctx.createRadialGradient(ex, ey - 6, 1, ex, ey - 6, 22);
      g.addColorStop(0, `rgba(255,190,90,${0.5 * flick})`); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey - 6, 22, 0, TAU); ctx.fill();
    }
  }

  _drawLibraryArch(ctx, l) {
    const { x, y, w, h } = l;
    // giant stone arch framing the archive
    this._silhouette(ctx, x, y - h, w, h, '#15130e', '#241c14');
    ctx.fillStyle = '#0c0a08';
    ctx.beginPath();
    ctx.moveTo(x + 60, y); ctx.lineTo(x + 60, y - h * 0.6);
    ctx.quadraticCurveTo(x + w / 2, y - h, x + w - 60, y - h * 0.6);
    ctx.lineTo(x + w - 60, y); ctx.closePath(); ctx.fill();
    // faint inner glow
    const g = ctx.createRadialGradient(x + w / 2, y - h * 0.5, 10, x + w / 2, y - h * 0.5, h * 0.5);
    g.addColorStop(0, 'rgba(220,180,90,0.14)'); g.addColorStop(1, 'rgba(220,180,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + w / 2, y - h * 0.5, h * 0.5, 0, TAU); ctx.fill();
  }

  // ================= RENDER: PROPS (world space, gameplay layer) =================
  drawProps(ctx, camera, viewW, viewH) {
    for (const p of this.props) {
      if (p.x < camera.x - 60 || p.x > camera.x + viewW + 60) continue;
      if (p.y < camera.y - 120 || p.y > camera.y + viewH + 60) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.flip) ctx.scale(-1, 1);
      ctx.scale(p.s, p.s);
      // soft contact shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(0, 4, 14, 5, 0, 0, TAU); ctx.fill();
      switch (p.type) {
        case 'tombstone': this._drawTomb(ctx, p.seed); break;
        case 'deadTree': this._drawDeadTree(ctx, p.seed); break;
        case 'statue': this._drawStatue(ctx); break;
        case 'ironFence': this._drawFence(ctx); break;
        case 'brokenPillar': this._drawPillar(ctx); break;
        case 'coffin': this._drawCoffin(ctx); break;
        case 'altar': this._drawAltar(ctx); break;
        case 'stoneCross': this._drawCross(ctx); break;
        case 'gargoyle': this._drawGargoyle(ctx, p.perched); break;
        case 'banner': this._drawBanner(ctx); break;
        case 'hangingCage': this._drawCage(ctx); break;
        case 'wagon': this._drawWagon(ctx); break;
        case 'fountain': this._drawFountain(ctx); break;
        case 'candle': this._drawCandle(ctx); break;
        case 'bench': this._drawBench(ctx); break;
        case 'rubble': this._drawRubble(ctx, p.seed); break;
        case 'shrine': this._drawShrine(ctx); break;
        case 'well': this._drawWell(ctx); break;
        case 'crate': this._drawCrate(ctx); break;
        case 'barrel': this._drawBarrel(ctx); break;
        case 'hangingChain': this._drawHangingChain(ctx, p.seed); break;
      }
      ctx.restore();
    }
  }

  _drawTomb(ctx, seed) {
    const r = mulberry(seed);
    const w = 22 + r() * 8, h = 26 + r() * 10;
    ctx.fillStyle = '#1d2230'; ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = '#262c3c'; ctx.fillRect(-w / 2, -h, w, 4);
    ctx.fillStyle = '#10131c'; ctx.fillRect(-w / 2, -4, w, 4);
    // arched top
    ctx.fillStyle = '#1d2230'; ctx.beginPath(); ctx.arc(0, -h, w / 2, Math.PI, 0); ctx.fill();
    // moss
    ctx.fillStyle = 'rgba(60,80,55,0.3)'; ctx.fillRect(-w / 2, -h * 0.3, w * 0.4, 4);
    // crack
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(2, 0); ctx.stroke();
  }

  _drawDeadTree(ctx, seed) {
    const r = mulberry(seed);
    ctx.strokeStyle = '#0e0c0a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    // trunk
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -40 - r() * 20); ctx.stroke();
    // branches
    const branches = 4 + Math.floor(r() * 3);
    for (let i = 0; i < branches; i++) {
      const by = -20 - r() * 30;
      const ang = (r() - 0.5) * 2;
      const len = 18 + r() * 26;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(Math.cos(ang) * len, by + Math.sin(ang) * len); ctx.stroke();
      // sub-branch
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(Math.cos(ang) * len * 0.6, by + Math.sin(ang) * len * 0.6);
      ctx.lineTo(Math.cos(ang) * len * 0.6 + Math.cos(ang + 0.6) * 12, by + Math.sin(ang) * len * 0.6 + Math.sin(ang + 0.6) * 12); ctx.stroke();
    }
  }

  _drawStatue(ctx) {
    // stone figure on a plinth
    ctx.fillStyle = '#23262f'; ctx.fillRect(-10, -8, 20, 12); // plinth
    ctx.fillStyle = '#2a2e38';
    ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(6, -40); ctx.lineTo(-6, -40); ctx.closePath(); ctx.fill(); // robed body
    ctx.beginPath(); ctx.arc(0, -46, 7, 0, TAU); ctx.fill(); // head
    // arms
    ctx.strokeStyle = '#2a2e38'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-12, -20); ctx.moveTo(6, -34); ctx.lineTo(12, -20); ctx.stroke();
    // weathering
    ctx.fillStyle = 'rgba(50,65,50,0.3)'; ctx.fillRect(-8, -10, 16, 4);
  }

  _drawFence(ctx) {
    ctx.strokeStyle = '#0c0d12'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.stroke(); // rail
    for (let i = -2; i <= 2; i++) {
      const x = i * 11;
      ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x, -18); ctx.stroke(); // post
      ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x - 2, -22); ctx.lineTo(x + 2, -22); ctx.closePath(); ctx.fillStyle = '#0c0d12'; ctx.fill(); // spear tip
    }
  }

  _drawPillar(ctx) {
    ctx.fillStyle = '#1f2330'; ctx.fillRect(-9, -46, 18, 50);
    ctx.fillStyle = '#2a2e3c'; ctx.fillRect(-12, -50, 24, 6); // capital
    ctx.fillStyle = '#161a24'; ctx.fillRect(-10, 0, 20, 6); // base
    // broken top (jagged)
    ctx.fillStyle = '#1f2330';
    ctx.beginPath(); ctx.moveTo(-9, -46); ctx.lineTo(-6, -54); ctx.lineTo(-2, -48); ctx.lineTo(3, -56); ctx.lineTo(7, -47); ctx.lineTo(9, -46); ctx.closePath(); ctx.fill();
    // vines
    ctx.strokeStyle = 'rgba(55,70,45,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-6, -20, -9, -40); ctx.stroke();
  }

  _drawCoffin(ctx) {
    ctx.fillStyle = '#1a1410'; ctx.fillRect(-16, -20, 32, 22);
    ctx.fillStyle = '#241a12'; ctx.fillRect(-16, -20, 32, 4);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.strokeRect(-16, -20, 32, 22);
    ctx.fillStyle = '#4a3a22'; ctx.fillRect(-14, -14, 28, 2); // plank
    // iron banding
    ctx.strokeStyle = '#0c0a08'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(16, -10); ctx.moveTo(-16, -4); ctx.lineTo(16, -4); ctx.stroke();
  }

  _drawAltar(ctx) {
    ctx.fillStyle = '#1d2230'; ctx.fillRect(-18, -18, 36, 22);
    ctx.fillStyle = '#262c3c'; ctx.fillRect(-22, -22, 44, 6); // top slab
    ctx.fillStyle = '#15181f'; ctx.fillRect(-18, 0, 36, 4);
    // cloth with old stain (ritual)
    ctx.fillStyle = 'rgba(120,30,30,0.5)'; ctx.fillRect(-14, -18, 28, 8);
    // candles
    ctx.fillStyle = '#d8d2c0'; ctx.fillRect(-12, -28, 3, 8); ctx.fillRect(9, -28, 3, 8);
    // flames
    const f = 1 + Math.sin(this.runtime * 8) * 0.3;
    ctx.fillStyle = 'rgba(255,180,80,0.8)';
    ctx.beginPath(); ctx.arc(-10.5, -30, 1.6 * f, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(10.5, -30, 1.6 * f, 0, TAU); ctx.fill();
  }

  _drawCross(ctx) {
    ctx.fillStyle = '#20242e';
    ctx.fillRect(-3, -34, 6, 38);
    ctx.fillRect(-12, -24, 24, 6);
    ctx.fillStyle = '#10131c'; ctx.fillRect(-3, 0, 6, 4);
    // moss at base
    ctx.fillStyle = 'rgba(55,70,50,0.35)'; ctx.fillRect(-6, -4, 12, 4);
  }

  _drawGargoyle(ctx, perched) {
    ctx.fillStyle = '#22262f';
    ctx.beginPath(); ctx.ellipse(0, -6, 14, 10, 0, 0, TAU); ctx.fill(); // body
    ctx.beginPath(); ctx.arc(8, -10, 7, 0, TAU); ctx.fill(); // head
    // wings
    ctx.strokeStyle = '#1a1d26'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-22, -22); ctx.lineTo(-16, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-20, -14); ctx.lineTo(-14, 0); ctx.stroke();
    // horns
    ctx.fillStyle = '#1a1d26';
    ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(12, -22); ctx.lineTo(14, -16); ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle = 'rgba(220,80,40,0.8)';
    ctx.beginPath(); ctx.arc(11, -11, 1.2, 0, TAU); ctx.fill();
    if (!perched) { ctx.fillStyle = '#1a1d26'; ctx.fillRect(-2, 2, 4, 8); }
  }

  _drawBanner(ctx) {
    // hanging torn banner from a crossbeam
    ctx.fillStyle = '#2a2018'; ctx.fillRect(-14, -40, 28, 4); // beam
    ctx.fillStyle = '#3a1a1a';
    const sway = Math.sin(this.runtime * 1.5) * 2;
    ctx.beginPath();
    ctx.moveTo(-10, -36); ctx.lineTo(10, -36); ctx.lineTo(10 + sway, -4); ctx.lineTo(6 + sway, -10); ctx.lineTo(2, -4); ctx.lineTo(-6, -12); ctx.lineTo(-10 + sway, -4);
    ctx.closePath(); ctx.fill();
    // emblem (faded)
    ctx.fillStyle = 'rgba(180,150,90,0.25)'; ctx.beginPath(); ctx.arc(sway, -22, 5, 0, TAU); ctx.fill();
  }

  _drawCage(ctx) {
    // hanging cage from above (assume a chain out of view)
    ctx.strokeStyle = '#0c0d12'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, -34); ctx.stroke(); // chain
    ctx.fillStyle = '#10131c'; ctx.fillRect(-8, -34, 16, 4); // top ring
    ctx.strokeStyle = '#1a1c24'; ctx.lineWidth = 1.5;
    // cage bars
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * 3, -30); ctx.lineTo(i * 2, -4); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, -18, 10, 14, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -30); ctx.quadraticCurveTo(0, -32, 9, -30); ctx.stroke();
  }

  _drawWagon(ctx) {
    ctx.fillStyle = '#1a140e';
    ctx.fillRect(-22, -16, 44, 12); // body
    ctx.fillStyle = '#241a10'; ctx.fillRect(-22, -16, 44, 3);
    // broken wheel
    ctx.strokeStyle = '#0c0a06'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-14, 0, 8, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, 2, 6, 0, TAU); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14 + Math.cos(i / 5 * TAU) * 8, Math.sin(i / 5 * TAU) * 8); ctx.stroke(); }
    // crates
    ctx.fillStyle = '#241a10'; ctx.fillRect(2, -24, 12, 10);
  }

  _drawFountain(ctx) {
    ctx.fillStyle = '#1d2230';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, TAU); ctx.fill(); // basin
    ctx.fillStyle = '#10131c'; ctx.beginPath(); ctx.ellipse(0, -2, 18, 5, 0, 0, TAU); ctx.fill(); // water
    ctx.fillStyle = 'rgba(60,90,120,0.4)'; ctx.beginPath(); ctx.ellipse(0, -2, 16, 4, 0, 0, TAU); ctx.fill();
    // central pillar + statue fragment
    ctx.fillStyle = '#2a2e38'; ctx.fillRect(-3, -20, 6, 18);
    ctx.beginPath(); ctx.arc(0, -24, 5, 0, TAU); ctx.fill();
    // trickling water shimmer
    ctx.strokeStyle = 'rgba(120,160,200,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -4); ctx.stroke();
  }

  _drawCandle(ctx) {
    ctx.fillStyle = '#241a10'; ctx.fillRect(-3, -6, 6, 8); // holder
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-1.5, -14, 3, 8); // wax
    const f = 1 + Math.sin(this.runtime * 10 + this.seed) * 0.4;
    // flame glow
    const g = ctx.createRadialGradient(0, -16, 0, 0, -16, 14);
    g.addColorStop(0, 'rgba(255,180,80,0.6)'); g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -16, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,120,0.95)';
    ctx.beginPath(); ctx.ellipse(0, -16, 1.6 * f, 3 * f, 0, 0, TAU); ctx.fill();
  }

  // ================= RENDER: FOREGROUND (screen space, dark silhouettes) =================
  drawForeground(ctx, camera, viewW, viewH) {
    // Overhead arches & bridges crossing above the player (verticality, world space)
    ctx.save();
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    ctx.fillStyle = 'rgba(3,4,8,0.9)';
    const arches = [
      { x: 1290, y: 1260, w: 360 },
      { x: 2450, y: 1760, w: 560 },
      { x: 1800, y: 5600, w: 380 },
      { x: 1100, y: 5250, w: 520 },
    ];
    for (const a of arches) {
      if (a.x - a.w / 2 > camera.x + viewW || a.x + a.w / 2 < camera.x) continue;
      if (a.y < camera.y - 40 || a.y > camera.y + viewH + 40) continue;
      ctx.fillRect(a.x - a.w / 2, a.y - 140, 28, 140);
      ctx.fillRect(a.x + a.w / 2 - 28, a.y - 140, 28, 140);
      ctx.beginPath();
      ctx.moveTo(a.x - a.w / 2, a.y - 140);
      ctx.quadraticCurveTo(a.x, a.y - 230, a.x + a.w / 2, a.y - 140);
      ctx.lineTo(a.x + a.w / 2 - 28, a.y - 140);
      ctx.quadraticCurveTo(a.x, a.y - 205, a.x - a.w / 2 + 28, a.y - 140);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,150,200,0.04)';
      ctx.fillRect(a.x - a.w / 2 + 30, a.y - 135, a.w - 60, 6);
      ctx.fillStyle = 'rgba(3,4,8,0.9)';
    }
    ctx.restore();
    // iron fence rails drifting at the bottom edge (parallax 1.6) — frames the view
    ctx.save();
    ctx.translate(-camera.x * 1.6 % 60, 0);
    ctx.fillStyle = 'rgba(4,5,8,0.85)';
    for (let x = -60; x < viewW + 60; x += 60) {
      ctx.fillRect(x, viewH - 26, 4, 26);
      ctx.beginPath(); ctx.moveTo(x, viewH - 26); ctx.lineTo(x - 4, viewH - 34); ctx.lineTo(x + 4, viewH - 34); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(0, viewH - 6, viewW + 60, 6);
    ctx.restore();

    // bare branches creeping from the top corners
    ctx.strokeStyle = 'rgba(4,5,8,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const sway = Math.sin(this.runtime * 0.6) * 4;
    ctx.save(); ctx.translate(sway, 0);
    this._branch(ctx, 0, 0, 0.6, 90, 4);
    this._branch(ctx, viewW, 0, Math.PI - 0.6, 90, 4);
    ctx.restore();
  }

  _branch(ctx, x, y, ang, len, depth) {
    if (depth <= 0 || len < 6) return;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    ctx.lineWidth = depth;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    this._branch(ctx, ex, ey, ang - 0.4, len * 0.7, depth - 1);
    this._branch(ctx, ex, ey, ang + 0.4, len * 0.7, depth - 1);
  }

  // ================= RENDER: AMBIENCE PARTICLES (screen space) =================
  drawAmbience(ctx, viewW, viewH) {
    // ash / dust motes
    for (const a of this.ash) {
      ctx.fillStyle = `rgba(190,200,220,${a.a})`;
      ctx.fillRect(a.x, a.y, a.r, a.r);
    }
    // drifting fog banks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fog) {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(150,160,180,${f.a})`); g.addColorStop(1, 'rgba(150,160,180,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // warm embers
    for (const e of this.embers) {
      const fl = 0.6 + Math.sin(e.life * 12) * 0.4;
      ctx.fillStyle = `rgba(255,150,70,${e.a * fl})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
    }
    // falling leaves
    for (const l of this.leaves) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.fillStyle = l.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, l.r, l.r * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // crows
    for (const c of this.crows) {
      const w = Math.sin(c.wing) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(8,8,12,0.9)';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.quadraticCurveTo(c.x - 8, c.y - 6 * w, c.x - 14, c.y);
      ctx.lineTo(c.x, c.y + 2);
      ctx.quadraticCurveTo(c.x + 14, c.y, c.x + 8, c.y - 6 * w);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ================= RENDER: LIGHT SHAFTS (screen space, additive) =================
  drawLightShafts(ctx, camera, viewW, viewH) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // world-anchored god rays pouring from great windows / rose windows
    const rays = [
      { x: 3050 + 750, y: 1670 - 1500 * 0.55, w: 130, hue: '150,180,225' },   // grand cathedral rose window
      { x: 3800 + 750, y: 4460 - 1500 * 0.55, w: 130, hue: '150,180,225' },   // southern cathedral rose window
      { x: 1800, y: 4900, w: 150, hue: '230,190,120' },                       // library great hall stained window
      { x: 3660, y: 1696 - 700, w: 110, hue: '255,150,70' },                  // burning chapel glow shaft
      { x: 4800, y: 1696 - 900, w: 110, hue: '170,120,210' },                 // nightmare spire aurora
    ];
    for (const r of rays) {
      if (r.x < camera.x - 240 || r.x > camera.x + viewW + 240) continue;
      if (r.y < camera.y - 500 || r.y > camera.y + viewH + 200) continue;
      const sx = r.x - camera.x, sy = r.y - camera.y;
      const drift = Math.sin(this.runtime * 0.25 + r.x * 0.01) * 16;
      ctx.save();
      ctx.translate(sx + drift, sy);
      ctx.rotate(0.2);
      const g = ctx.createLinearGradient(0, 0, 0, viewH);
      g.addColorStop(0, `rgba(${r.hue},0.11)`);
      g.addColorStop(0.4, `rgba(${r.hue},0.05)`);
      g.addColorStop(1, `rgba(${r.hue},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(-r.w / 2, 0, r.w, viewH * 1.3);
      ctx.restore();
    }
    // ambient drifting moonlight beams (screen space)
    for (let i = 0; i < 2; i++) {
      const drift = Math.sin(this.runtime * 0.2 + i) * 40;
      const bx = viewW * (0.3 + i * 0.35) + drift;
      ctx.save();
      ctx.translate(bx, 0);
      ctx.rotate(0.35);
      const g = ctx.createLinearGradient(0, 0, 0, viewH);
      g.addColorStop(0, 'rgba(150,175,220,0.05)');
      g.addColorStop(0.5, 'rgba(150,175,220,0.025)');
      g.addColorStop(1, 'rgba(150,175,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-40, 0, 80, viewH * 1.4);
      ctx.restore();
    }
    ctx.restore();
  }

  // ================= RENDER: DISTRICT MOOD (per-region color identity) =================
  drawDistrictMood(ctx, camera, viewW, viewH) {
    const cx = camera.x + viewW / 2, cy = camera.y + viewH / 2;
    let dominant = null;
    for (const r of this.districts) if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) { dominant = r; break; }
    // per-region color grade — each visible district carries its own tint, so
    // boundaries read as a shift in mood (cold blue cathedral, amber library,
    // green necropolis, gold sanctuary, silver sanctum) rather than one wash.
    for (const r of this.districts) {
      if (r.x + r.w < camera.x - 40 || r.x > camera.x + viewW + 40) continue;
      if (r.y + r.h < camera.y - 40 || r.y > camera.y + viewH + 40) continue;
      const rx = Math.max(r.x, camera.x), ry = Math.max(r.y, camera.y);
      const rw = Math.min(r.x + r.w, camera.x + viewW) - rx;
      const rh = Math.min(r.y + r.h, camera.y + viewH) - ry;
      if (rw <= 0 || rh <= 0) continue;
      const g = ctx.createLinearGradient(0, ry, 0, ry + rh);
      g.addColorStop(0, `rgba(${r.col},0.10)`);
      g.addColorStop(0.5, `rgba(${r.col},0.17)`);
      g.addColorStop(1, `rgba(${r.col},0.07)`);
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    }
    // gentle focal lift around the player's own district
    if (dominant) {
      const g = ctx.createRadialGradient(cx, cy, viewH * 0.15, cx, cy, viewH * 0.95);
      g.addColorStop(0, `rgba(${dominant.col},0.06)`);
      g.addColorStop(1, `rgba(${dominant.col},0)`);
      ctx.fillStyle = g; ctx.fillRect(camera.x, camera.y, viewW, viewH);
    }
  }

  // ================= RENDER: FLOOR DETAIL (cracked stone, moss, puddles, vines) =================
  drawFloorDetail(ctx, camera, viewW, viewH) {
    const tile = 110;
    const x0 = Math.floor(camera.x / tile) * tile;
    const y0 = Math.floor(camera.y / tile) * tile;
    for (let wx = x0; wx < camera.x + viewW + tile; wx += tile) {
      for (let wy = y0; wy < camera.y + viewH + tile; wy += tile) {
        const r = mulberry(((wx * 73856093) ^ (wy * 19349663)) >>> 0);
        // moss patches (aged architecture reclaiming the stone)
        if (r() > 0.55) {
          ctx.fillStyle = 'rgba(52,74,48,0.22)';
          ctx.beginPath(); ctx.ellipse(wx + r() * tile, wy + r() * tile, 16 + r() * 22, 9 + r() * 12, r() * TAU, 0, TAU); ctx.fill();
          if (r() > 0.5) { ctx.fillStyle = 'rgba(70,92,60,0.16)'; ctx.beginPath(); ctx.ellipse(wx + r() * tile, wy + r() * tile, 10 + r() * 14, 5 + r() * 8, r() * TAU, 0, TAU); ctx.fill(); }
        }
        // puddle with slow ripple
        if (r() > 0.8) {
          const px = wx + r() * tile, py = wy + r() * tile;
          ctx.fillStyle = 'rgba(38,58,80,0.20)'; ctx.beginPath(); ctx.ellipse(px, py, 18 + r() * 16, 8 + r() * 7, 0, 0, TAU); ctx.fill();
          const rr = 4 + ((this.runtime * 12 + wx * 0.3) % 14);
          ctx.strokeStyle = 'rgba(120,160,200,0.16)'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.ellipse(px, py, rr, rr * 0.5, 0, 0, TAU); ctx.stroke();
        }
        // scattered pebbles / debris
        if (r() > 0.5) { ctx.fillStyle = 'rgba(28,30,36,0.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(wx + r() * tile, wy + r() * tile, 2, 1.6); }
        // meandering crack in the flagstone
        if (r() > 0.78) {
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
          ctx.beginPath(); let cxp = wx + r() * tile, cyp = wy + r() * tile; ctx.moveTo(cxp, cyp);
          for (let i = 0; i < 3; i++) { cxp += (r() - 0.5) * 30; cyp += (r() - 0.5) * 30; ctx.lineTo(cxp, cyp); } ctx.stroke();
        }
        // creeping vine trail
        if (r() > 0.85) {
          ctx.strokeStyle = 'rgba(50,70,45,0.35)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); let cxp = wx + r() * tile, cyp = wy + r() * tile; ctx.moveTo(cxp, cyp);
          for (let i = 0; i < 3; i++) { cxp += (r() - 0.5) * 20; cyp += r() * 16; ctx.lineTo(cxp, cyp); } ctx.stroke();
        }
      }
    }
  }

  // ================= RENDER: BRIDGES (flooded canal + stone span) =================
  drawBridges(ctx, camera, viewW, viewH) {
    for (const b of this.bridges) {
      if (b.x1 < camera.x - 60 || b.x0 > camera.x + viewW + 60) continue;
      const cx = (b.x0 + b.x1) / 2;
      const span = b.x1 - b.x0;
      // floodwater flanking the bridge — a drowned canal beneath the span
      this._drawBridgeWater(ctx, b.x0, b.chasmN, span, b.y0 - b.chasmN, true);
      this._drawBridgeWater(ctx, b.x0, b.y1, span, b.chasmS - b.y1, false);
      // mist drifting over the water
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const my = b.chasmN + (i + 1) * ((b.y0 - b.chasmN) / 4);
        const g = ctx.createRadialGradient(cx, my, 8, cx, my, span * 0.7);
        g.addColorStop(0, 'rgba(90,120,150,0.06)'); g.addColorStop(1, 'rgba(90,120,150,0)');
        ctx.fillStyle = g; ctx.fillRect(b.x0, my - 30, span, 60);
      }
      ctx.restore();
      // stone bridge deck
      ctx.fillStyle = '#1a1c24'; ctx.fillRect(b.x0, b.y0, span, b.y1 - b.y0);
      ctx.fillStyle = '#262a36'; ctx.fillRect(b.x0, b.y0, span, 4);
      ctx.fillStyle = '#10121a'; ctx.fillRect(b.x0, b.y1 - 4, span, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let px = b.x0 + 6; px < b.x1; px += 18) ctx.fillRect(px, b.y0, 2, b.y1 - b.y0);
      // underside arch
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.moveTo(b.x0, b.y1); ctx.quadraticCurveTo(cx, b.y1 + 46, b.x1, b.y1); ctx.closePath(); ctx.fill();
      // gargoyles perched at each end of the bridge, watching the water
      this._drawBridgeGargoyle(ctx, b.x0 + 30, b.y0 - 24, Math.PI, false);
      this._drawBridgeGargoyle(ctx, b.x1 - 30, b.y0 - 24, 0, false);
      this._drawBridgeGargoyle(ctx, b.x0 + 30, b.y1 + 24, Math.PI, true);
      this._drawBridgeGargoyle(ctx, b.x1 - 30, b.y1 + 24, 0, true);
    }
  }

  _drawBridgeWater(ctx, x, y, w, h, north) {
    ctx.fillStyle = '#0a131a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0e1c26'; ctx.fillRect(x, y, w, Math.min(46, h));
    ctx.strokeStyle = 'rgba(90,140,170,0.12)'; ctx.lineWidth = 1;
    const off = (this.runtime * 16) % 44;
    for (let ry = y + off; ry < y + h; ry += 44) {
      ctx.beginPath();
      for (let rx = x; rx <= x + w; rx += 12) {
        const yy = ry + Math.sin((rx + this.runtime * 24) * 0.05) * 2;
        if (rx === x) ctx.moveTo(rx, yy); else ctx.lineTo(rx, yy);
      }
      ctx.stroke();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (north) {
      const rg = ctx.createLinearGradient(0, y + h - 36, 0, y + h);
      rg.addColorStop(0, 'rgba(255,170,90,0)'); rg.addColorStop(1, 'rgba(255,170,90,0.12)');
      ctx.fillStyle = rg; ctx.fillRect(x, y + h - 36, w, 36);
    } else {
      const rg = ctx.createLinearGradient(0, y, 0, y + 36);
      rg.addColorStop(0, 'rgba(255,170,90,0.12)'); rg.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = rg; ctx.fillRect(x, y, w, 36);
    }
    ctx.restore();
  }

  _drawBridgeGargoyle(ctx, x, y, facing, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(1, -1);
    ctx.rotate(facing);
    ctx.fillStyle = '#1a1d28'; ctx.fillRect(-11, -6, 22, 8);
    ctx.fillStyle = '#2a2e3c'; ctx.fillRect(-11, -6, 22, 3);
    ctx.fillStyle = '#23262f';
    ctx.beginPath(); ctx.ellipse(0, -18, 13, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -22, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1d26'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-17, -30); ctx.lineTo(-13, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-19, -22); ctx.lineTo(-11, -10); ctx.stroke();
    ctx.fillStyle = '#1a1d26';
    ctx.beginPath(); ctx.moveTo(11, -28); ctx.lineTo(13, -34); ctx.lineTo(15, -28); ctx.closePath(); ctx.fill();
    const fl = 0.6 + Math.sin(this.runtime * 4) * 0.3;
    ctx.fillStyle = `rgba(220,80,40,${fl})`;
    ctx.beginPath(); ctx.arc(12, -23, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  _drawGreatFountain(ctx, l) {
    const { x, y, w, h } = l;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#161a24'; ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h * 0.28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0c0f16'; ctx.beginPath(); ctx.ellipse(0, -2, w / 2 - 12, h * 0.22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(70,110,150,0.3)'; ctx.beginPath(); ctx.ellipse(0, -2, w / 2 - 16, h * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1f2330'; ctx.fillRect(-14, -h * 0.8, 28, h * 0.8);
    ctx.fillStyle = '#2a2e3c'; ctx.fillRect(-16, -h * 0.8, 32, 8);
    ctx.beginPath(); ctx.moveTo(-14, -h * 0.8); ctx.lineTo(0, -h * 0.95); ctx.lineTo(14, -h * 0.8); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 0.6 + Math.sin(this.runtime * 3) * 0.2;
    const g = ctx.createRadialGradient(0, -h * 0.5, 4, 0, -h * 0.5, w * 0.4);
    g.addColorStop(0, `rgba(120,170,210,${0.18 * fl})`); g.addColorStop(1, 'rgba(120,170,210,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -h * 0.5, w * 0.4, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  _drawColossus(ctx, l) {
    const { x, y, w, h } = l;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#1a1d28'; ctx.fillRect(-w * 0.4, -h * 0.18, w * 0.8, h * 0.18);
    ctx.fillStyle = '#23262f'; ctx.fillRect(-w * 0.4, -h * 0.18, w * 0.8, 6);
    ctx.fillStyle = '#1d2030';
    ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.18); ctx.lineTo(-w * 0.22, -h * 0.7); ctx.lineTo(w * 0.22, -h * 0.7); ctx.lineTo(w * 0.3, -h * 0.18); ctx.closePath(); ctx.fill();
    ctx.fillRect(-w * 0.24, -h * 0.78, w * 0.48, h * 0.12);
    ctx.fillStyle = '#23262f'; ctx.beginPath(); ctx.arc(0, -h * 0.84, w * 0.12, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1d2030'; ctx.lineWidth = w * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w * 0.18, -h * 0.74); ctx.lineTo(w * 0.34, -h * 0.92); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w * 0.2, -h * 0.74); ctx.lineTo(-w * 0.28, -h * 0.5); ctx.stroke();
    ctx.fillStyle = 'rgba(55,70,50,0.25)'; ctx.fillRect(-w * 0.3, -h * 0.22, w * 0.6, 6);
    ctx.fillStyle = 'rgba(40,50,40,0.2)'; ctx.beginPath(); ctx.arc(-w * 0.1, -h * 0.5, w * 0.12, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, -h * 0.84, 4, 0, -h * 0.84, w * 0.3);
    g.addColorStop(0, 'rgba(180,200,235,0.14)'); g.addColorStop(1, 'rgba(180,200,235,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -h * 0.84, w * 0.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  _drawMonumentalStair(ctx, l) {
    const { x, y, w, h } = l;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#15181f';
    ctx.fillRect(-w * 0.5, -h, w * 0.16, h);
    ctx.fillRect(w * 0.34, -h, w * 0.16, h);
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const sy = -i * (h / steps);
      const sx = -w * 0.34 + i * (w * 0.04);
      ctx.fillStyle = i % 2 ? '#1a1e28' : '#161a22';
      ctx.fillRect(sx, sy, w * 0.68 - i * (w * 0.08), h / steps);
      ctx.fillStyle = '#232838'; ctx.fillRect(sx, sy, w * 0.68 - i * (w * 0.08), 3);
    }
    ctx.fillStyle = '#1d2030'; ctx.fillRect(-10, -h - 40, 20, 40);
    ctx.beginPath(); ctx.arc(0, -h - 48, 10, 0, TAU); ctx.fill();
    ctx.restore();
  }

  _drawTriumphArch(ctx, l) {
    const { x, y, w, h } = l;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#15181f';
    ctx.fillRect(-w * 0.5, -h, w * 0.22, h);
    ctx.fillRect(w * 0.28, -h, w * 0.22, h);
    ctx.fillRect(-w * 0.5, -h, w, h * 0.18);
    ctx.fillStyle = '#08090c';
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, 0); ctx.lineTo(-w * 0.28, -h * 0.6);
    ctx.quadraticCurveTo(0, -h * 0.82, w * 0.28, -h * 0.6);
    ctx.lineTo(w * 0.28, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(150,170,210,0.06)'; ctx.fillRect(-w * 0.06, -h * 0.78, w * 0.12, 10);
    ctx.fillStyle = 'rgba(180,150,90,0.08)'; ctx.fillRect(-w * 0.5, -h * 0.3, w, 8);
    ctx.restore();
  }

  _drawBench(ctx) {
    ctx.fillStyle = '#1a140e'; ctx.fillRect(-20, -6, 40, 5);
    ctx.fillStyle = '#241a10'; ctx.fillRect(-20, -6, 40, 2);
    ctx.fillStyle = '#120c08'; ctx.fillRect(-18, -1, 4, 8); ctx.fillRect(14, -1, 4, 8);
    ctx.fillStyle = 'rgba(55,70,50,0.3)'; ctx.fillRect(-20, -6, 40, 1);
  }

  _drawRubble(ctx, seed) {
    const r = mulberry(seed);
    ctx.fillStyle = '#1a1d26';
    for (let i = 0; i < 5; i++) { const rx = (r() - 0.5) * 26, ry = -r() * 10, s = 4 + r() * 8; ctx.fillRect(rx - s / 2, ry, s, s * 0.6); }
    ctx.fillStyle = '#23262f';
    for (let i = 0; i < 3; i++) { const rx = (r() - 0.5) * 20, ry = -r() * 6, s = 3 + r() * 5; ctx.fillRect(rx, ry, s, s * 0.5); }
    ctx.fillStyle = 'rgba(80,80,90,0.15)'; ctx.beginPath(); ctx.ellipse(0, 2, 20, 6, 0, 0, TAU); ctx.fill();
  }

  _drawShrine(ctx) {
    ctx.fillStyle = '#1d2230'; ctx.fillRect(-14, -18, 28, 20);
    ctx.fillStyle = '#262c3c'; ctx.fillRect(-16, -22, 32, 6);
    ctx.fillStyle = '#08090c'; ctx.beginPath();
    ctx.moveTo(-9, -2); ctx.lineTo(-9, -14); ctx.quadraticCurveTo(0, -22, 9, -14); ctx.lineTo(9, -2); ctx.closePath(); ctx.fill();
    const f = 0.7 + Math.sin(this.runtime * 8) * 0.3;
    const g = ctx.createRadialGradient(0, -12, 1, 0, -12, 16);
    g.addColorStop(0, `rgba(255,170,80,${0.4 * f})`); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -12, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8d2c0'; ctx.fillRect(-1.5, -14, 3, 4);
  }

  _drawWell(ctx) {
    ctx.fillStyle = '#1a1d28'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#07080c'; ctx.beginPath(); ctx.ellipse(0, -2, 13, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(50,80,110,0.3)'; ctx.beginPath(); ctx.ellipse(0, -2, 11, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a140e'; ctx.fillRect(-13, -20, 3, 20); ctx.fillRect(10, -20, 3, 20);
    ctx.fillStyle = '#241a10'; ctx.beginPath(); ctx.moveTo(-16, -20); ctx.lineTo(0, -30); ctx.lineTo(16, -20); ctx.closePath(); ctx.fill();
  }

  _drawCrate(ctx) {
    ctx.fillStyle = '#241a10'; ctx.fillRect(-9, -12, 18, 14);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.strokeRect(-9, -12, 18, 14);
    ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(9, 2); ctx.moveTo(9, -12); ctx.lineTo(-9, 2); ctx.stroke();
    ctx.fillStyle = '#1a140e'; ctx.fillRect(-9, -12, 18, 2);
  }

  _drawBarrel(ctx) {
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-10, -8, -8, -16); ctx.lineTo(8, -16); ctx.quadraticCurveTo(10, -8, 8, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = '#0c0a06'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(9, -11); ctx.moveTo(-9, -6); ctx.lineTo(9, -6); ctx.stroke();
    ctx.fillStyle = 'rgba(50,70,50,0.28)'; ctx.fillRect(-8, -2, 16, 2);
  }

  _drawHangingChain(ctx, seed) {
    const sw = Math.sin(this.runtime * 1.2 + (seed || 0) * 0.13) * 3;
    ctx.strokeStyle = '#0c0d12'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(sw, -18); ctx.stroke();
    ctx.fillStyle = '#1a1c24';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(sw * (1 - i / 4), -44 + i * 8, 1.8, 3, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#2a2c34'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sw, -12, 4, 0, TAU); ctx.stroke();
    const fl = 0.6 + Math.sin(this.runtime * 8 + (seed || 0)) * 0.3;
    const g = ctx.createRadialGradient(sw, -12, 0, sw, -12, 13);
    g.addColorStop(0, `rgba(255,170,70,${0.45 * fl})`); g.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sw, -12, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,220,150,${0.9 * fl})`; ctx.beginPath(); ctx.arc(sw, -12, 1.6, 0, TAU); ctx.fill();
  }
}