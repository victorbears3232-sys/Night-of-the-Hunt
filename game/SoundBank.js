// SoundBank.js — the audio soul of The Night of the Hunt.
// Fully synthesized (no external assets). Three layers:
//   1. MUSIC  — per-area ambient beds + per-boss orchestral themes, crossfaded.
//   2. WORLD — a scheduled environmental ambience (bells, wind, creaks, drips,
//              thunder, ravens, chains, distant screams, fire, debris) per area.
//   3. SFX   — heavy combat impacts, parries, viscerals, per-type enemy attack
//              & death cues, surface footsteps, lantern hum, and UI feedback.
// Audio is gated behind a user gesture (init()); the engine waits quietly
// until the Hunter awakens, then breathes life into the Quarter.

const TAU = Math.PI * 2;
const mtof = (root, semi) => root * Math.pow(2, semi / 12);

// ---- Per-area ambient configuration ----
// root: pad root frequency; pad: semitone offsets for the drone chord;
// motif: a slow melodic fragment (semitone offsets) the area hums to itself;
// tempo: seconds between motif notes; filter: pad lowpass cutoff;
// env: which environmental sounds drift through this place; surface: footsteps.
// bed: a continuous, very-low ambient texture unique to each region (fire
// rumble, water hiss, wind, rustling leaves, a cavern hum, a void shimmer) —
// gives every area its own living atmosphere beneath the music.
const AREAS = {
  hub:          { root: 174.6, pad: [0, 7, 12],    padType: 'sine',     filter: 620, vol: 0.34, motif: [0, 7, 12, 7, 3, 0],  tempo: 2.6, motifType: 'sine',     env: ['bell', 'windGust', 'creak'], surface: 'stone', calm: true, bed: 'cavern' },
  ashe:          { root: 196.0, pad: [0, 3, 7],    padType: 'sine',     filter: 680, vol: 0.30, motif: [0, 3, 7, 3, 0, -2],  tempo: 2.2, motifType: 'triangle', env: ['bell', 'creak', 'raven', 'windGust'], surface: 'stone', bed: 'cavern' },
  crypt:         { root: 146.8, pad: [0, 3, 7],    padType: 'sine',     filter: 480, vol: 0.30, motif: [0, -2, 3, 0, -5],  tempo: 2.4, motifType: 'sine',     env: ['drip', 'chain', 'creak', 'drip'], surface: 'stone', bed: 'cavern' },
  cathedral:     { root: 220.0, pad: [0, 4, 7, 12], padType: 'sine',     filter: 720, vol: 0.32, motif: [0, 4, 7, 12, 7, 4],  tempo: 2.3, motifType: 'sine',     env: ['bell', 'drip', 'windGust', 'bell'], surface: 'stone', bed: 'cavern' },
  forest:        { root: 164.8, pad: [0, 7, 12],   padType: 'sine',     filter: 700, vol: 0.26, motif: [0, 3, 7, 5, 0],     tempo: 2.5, motifType: 'triangle', env: ['raven', 'windGust', 'creak'], surface: 'grass', bed: 'leaves' },
  grave:         { root: 207.7, pad: [0, 3, 6],    padType: 'sawtooth', filter: 540, vol: 0.28, motif: [0, -1, 3, 0, -2],  tempo: 1.9, motifType: 'square',   env: ['fireCrackle', 'distantScream', 'debris', 'fireCrackle'], surface: 'dirt', bed: 'fire' },
  nightmare:     { root: 233.1, pad: [0, 5, 7, 11], padType: 'sine',    filter: 980, vol: 0.28, motif: [12, 11, 7, 5, 3, 0], tempo: 2.0, motifType: 'sine', env: ['drip', 'distantScream', 'chain', 'drip'], surface: 'stone', cosmic: true, bed: 'void' },
  necro:         { root: 130.8, pad: [0, 3, 7],    padType: 'sine',     filter: 440, vol: 0.30, motif: [0, -2, 3, -5, 0],  tempo: 2.6, motifType: 'sine',     env: ['drip', 'chain', 'creak', 'raven'], surface: 'stone', bed: 'cavern' },
  village:       { root: 185.0, pad: [0, 3, 7],    padType: 'sine',     filter: 600, vol: 0.28, motif: [0, 3, 5, 3, 0, -3], tempo: 2.3, motifType: 'triangle', env: ['creak', 'windGust', 'raven'], surface: 'wood', bed: 'cavern' },
  gardens:       { root: 174.6, pad: [0, 4, 7, 12], padType: 'sine',    filter: 720, vol: 0.24, motif: [0, 4, 7, 4, 0],    tempo: 2.7, motifType: 'sine',     env: ['windGust', 'raven', 'drip'], surface: 'grass', bed: 'leaves' },
  library:       { root: 220.0, pad: [0, 4, 7, 11], padType: 'triangle', filter: 880, vol: 0.26, motif: [7, 11, 12, 11, 7, 4], tempo: 2.2, motifType: 'sine', env: ['creak', 'chain', 'fireCrackle'], surface: 'wood', bed: 'cavern' },
  aqueduct:      { root: 138.6, pad: [0, 3, 7],    padType: 'sine',     filter: 500, vol: 0.28, motif: [0, 3, 0, -2, 3],  tempo: 2.4, motifType: 'triangle', env: ['drip', 'windGust', 'creak', 'drip'], surface: 'water', bed: 'water' },
  cliff:         { root: 155.6, pad: [0, 7, 12],   padType: 'sine',     filter: 640, vol: 0.26, motif: [0, 7, 3, 0, -2],   tempo: 2.3, motifType: 'triangle', env: ['windGust', 'debris', 'raven', 'windGust'], surface: 'stone', bed: 'wind' },
  mire_cath:     { root: 164.8, pad: [0, 3, 7, 10], padType: 'sine',    filter: 560, vol: 0.28, motif: [0, -2, 3, 0, -5],  tempo: 2.4, motifType: 'sine',     env: ['drip', 'thunder', 'chain', 'drip'], surface: 'water', bed: 'water' },
  hollow_cath:   { root: 196.0, pad: [0, 7, 12, 15], padType: 'sine',   filter: 760, vol: 0.30, motif: [0, 7, 12, 7, 3, 0], tempo: 2.2, motifType: 'sine',  env: ['bell', 'windGust', 'creak'], surface: 'stone', bed: 'cavern' },
  sanctuary:     { root: 174.6, pad: [0, 4, 7, 12], padType: 'sine',    filter: 640, vol: 0.30, motif: [0, 4, 7, 4, 0],    tempo: 2.6, motifType: 'sine',     env: ['bell', 'windGust', 'creak'], surface: 'stone', calm: true, bed: 'cavern' },
  final_region:  { root: 110.0, pad: [0, 3, 7, 10], padType: 'sine',    filter: 520, vol: 0.32, motif: [0, 3, 7, 3, 0, -5], tempo: 2.8, motifType: 'sine',     env: ['bell', 'distantScream', 'windGust', 'chain'], surface: 'stone', bed: 'void' },
  // The default ambient bed — a calm, dark-fantasy drone that plays in any area
  // without a unique ambience. Quiet and very slow so it never competes with
  // area-specific music or boss themes; memorable but never demanding.
  default:        { root: 146.8, pad: [0, 7, 12],   padType: 'sine',     filter: 480, vol: 0.20, motif: [0, 7, 5, 0, -2, 3], tempo: 3.4, motifType: 'sine',     env: ['windGust', 'drip', 'creak'], surface: 'stone', calm: true, bed: 'cavern' },
};

// ---- Per-boss theme configuration ----
// Each theme is a small orchestra: a drone pad (the chord), a melodic motif
// (the boss's "voice"), and an optional soaring lead that awakens in Phase 2+.
// The final boss carries the most emotional, memorable motif in the game.
const BOSSES = {
  vicar:       { root: 174.6, pad: [0, 3, 7],     padType: 'sine',     filter: 680, vol: 0.36, motif: [0, 3, 7, 12, 7, 3, 0],    tempo: 1.9, motifType: 'triangle', lead: false, water: true },
  gascoigne:   { root: 196.0, pad: [0, 3, 10],    padType: 'sawtooth', filter: 880, vol: 0.34, motif: [0, 3, 5, 3, 0, -2, 0],   tempo: 1.4, motifType: 'square',   lead: true, aggressive: true },
  nightmare:   { root: 233.1, pad: [0, 5, 7, 11],  padType: 'sine',     filter: 1050, vol: 0.32, motif: [12, 11, 7, 5, 3, 0, 11], tempo: 1.7, motifType: 'sine',   lead: true, cosmic: true },
  mire:        { root: 164.8, pad: [0, 3, 7, 10], padType: 'sine',     filter: 600, vol: 0.34, motif: [0, -2, 3, 0, -5, 0],    tempo: 1.7, motifType: 'triangle', lead: false, water: true },
  hollow_king: { root: 130.8, pad: [0, 7, 12],    padType: 'sawtooth', filter: 820, vol: 0.36, motif: [0, 7, 12, 7, 3, 0, -5],  tempo: 1.3, motifType: 'square',   lead: true, regal: true },
  archivist:   { root: 220.0, pad: [0, 4, 7, 11], padType: 'triangle', filter: 980, vol: 0.32, motif: [7, 11, 12, 11, 7, 4, 7], tempo: 1.5, motifType: 'sine',   lead: true },
  final:       { root: 196.0, pad: [0, 3, 7, 10, 14], padType: 'sine', filter: 900, vol: 0.40, motif: [0, 3, 7, 12, 10, 7, 3, 0, -2, -5], tempo: 2.1, motifType: 'sine', lead: true, choir: true, emotional: true },
};

// Name-keyword fallback so unknown region ids still get a fitting bed.
function areaFromName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('nightmare') || n.includes('hub') || n.includes('sanctuary') || n.includes('haven')) return 'hub';
  if (n.includes('grave') || n.includes('burn')) return 'grave';
  if (n.includes('nightmare')) return 'nightmare';
  if (n.includes('crypt') || n.includes('necro') || n.includes('tomb')) return 'necro';
  if (n.includes('cathedral') || n.includes('flood')) return 'cathedral';
  if (n.includes('forest') || n.includes('garden')) return 'forest';
  if (n.includes('library') || n.includes('archive') || n.includes('book')) return 'library';
  if (n.includes('aqueduct') || n.includes('mire') || n.includes('sunken')) return 'mire_cath';
  if (n.includes('cliff') || n.includes('overlook')) return 'cliff';
  if (n.includes('village')) return 'village';
  if (n.includes('final') || n.includes('sanctum') || n.includes('voice') || n.includes('beast')) return 'final_region';
  if (n.includes('ashe') || n.includes('square')) return 'ashe';
  return 'default';
}

export default class SoundBank {
  constructor() {
    this.ctx = null; this.master = null; this.musicBus = null; this.muted = false;
    this._area = null; this._areaCfg = null;
    this._pad = null; this._motifTimer = null; this._motifIdx = 0;
    this._envTimer = null;
    this._bossTheme = false; this._bossPhase = 1; this._bossCfg = null;
    this._bossPad = null; this._bossLead = null; this._bossMotifTimer = null; this._bossIdx = 0;
    this._lanternHum = null;
    this._heartTimer = null; this._heartIntensity = 0;
    this._breathTimer = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0;
      this.musicFilter = this.ctx.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 2200;
      this.musicBus.connect(this.musicFilter); this.musicFilter.connect(this.master);
      this.musicBus.gain.setTargetAtTime(1, this.ctx.currentTime, 1.0);   // music fades up gently
    } catch (e) { /* no audio */ }
  }
  now() { return this.ctx ? this.ctx.currentTime : 0; }
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.5; return this.muted; }

  // ===================== CORE SYNTH PRIMITIVES =====================
  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0, dest = null) {
    if (!this.ctx || this.muted) return;
    const t = this.now() + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(1, freq), t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // A sustained, slowly-released tone — used for melodic motifs & pads.
  chime(freq, dur, type, vol, dest) {
    if (!this.ctx || this.muted) return;
    const t = this.now();
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = Math.max(1, freq);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
    o.connect(f); f.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur, vol = 0.2, filterFreq = 1200, delay = 0, type = 'lowpass') {
    if (!this.ctx || this.muted) return;
    const t = this.now() + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }
  // Wet squelch for flesh strikes and viscerals.
  flesh(vol = 0.14) {
    this.noise(0.10, vol, 380);
    this.tone(220, 0.08, 'sawtooth', vol * 0.5, 120);
  }
  // Delayed, quieter retrigger — a sense of cavernous space around every blow.
  _echo(fn, delay) {
    if (!this.ctx || this.muted) return;
    setTimeout(() => { try { fn(); } catch (e) {} }, Math.round(delay * 1000));
  }

  // ===================== AMBIENT MUSIC ENGINE =====================
  setArea(id, name) {
    if (!this.ctx) return;
    if (this._bossTheme) { this._area = id; this._areaCfg = AREAS[id] || AREAS[areaFromName(name)]; return; } // don't interrupt a boss
    const cfg = AREAS[id] || AREAS[areaFromName(name)] || AREAS.default;
    if (this._area === id && this._areaCfg) return;            // already playing this area
    this._area = id; this._areaCfg = cfg;
    this._stopPad();
    this._clearMotif(); this._clearEnv();
    this._pad = this._startPad(cfg, false);
    this._motifLoop();
    this._envLoop();
  }

  _startPad(cfg, isBoss) {
    if (!this.ctx) return null;
    const bus = this.musicBus;
    const g = this.ctx.createGain(); g.gain.value = 0; g.connect(bus);
    const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.value = cfg.filter || 700; filter.Q.value = 0.8;
    filter.connect(g);
    const voices = [];
    const pad = cfg.pad || [0, 7, 12];
    for (let i = 0; i < pad.length; i++) {
      const o = this.ctx.createOscillator(); o.type = cfg.padType || 'sine';
      o.frequency.value = mtof(cfg.root, pad[i]);
      o.detune.value = (Math.random() * 8 - 4);
      const vg = this.ctx.createGain(); vg.gain.value = (cfg.vol || 0.3) / pad.length * 1.4;
      o.connect(vg); vg.connect(filter); o.start(); voices.push(o);
    }
    // slow breathing LFO on the filter — the music never sits perfectly still
    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06 + Math.random() * 0.04;
    const lg = this.ctx.createGain(); lg.gain.value = (cfg.filter || 700) * 0.3;
    lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
    g.gain.setTargetAtTime(cfg.vol || 0.3, this.ctx.currentTime, 1.4);
    const bed = this._startBed(cfg.bed);
    return { g, filter, voices, lfo, bed };
  }
  _stopPad() {
    const p = this._pad; if (!p) return;
    try {
      p.g.gain.setTargetAtTime(0, this.now(), 0.8);
      if (p.bed) { try { if (p.bed.g) p.bed.g.gain.setTargetAtTime(0, this.now(), 0.6); if (p.bed.g2) p.bed.g2.gain.setTargetAtTime(0, this.now(), 0.6); p.bed.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); } catch (e) {} }
      setTimeout(() => { try { p.voices.forEach(o => o.stop()); p.lfo.stop(); } catch (e) {} }, 1600);
    } catch (e) {}
    this._pad = null;
  }
  // A continuous, very-low ambient texture unique to each region — a filtered
  // noise bed (fire rumble, water hiss, wind, rustling leaves, a cavern hum, a
  // void shimmer) with an optional low drone and a slow gain LFO, so every area
  // breathes its own atmosphere beneath the music. Torn down with the pad.
  _startBed(type) {
    if (!this.ctx || !type) return null;
    const t = this.now();
    const cfgs = {
      fire:   { f: 320,  q: 0.7, vol: 0.022, type: 'lowpass',  lfo: 0.08, lfoAmt: 0.010, drone: 0 },
      water:  { f: 2400, q: 0.4, vol: 0.018, type: 'bandpass', lfo: 0,    lfoAmt: 0,     drone: 0 },
      wind:   { f: 520,  q: 0.5, vol: 0.022, type: 'bandpass', lfo: 0.06, lfoAmt: 0.012, drone: 0 },
      leaves: { f: 1400, q: 0.7, vol: 0.016, type: 'bandpass', lfo: 0.15, lfoAmt: 0.008, drone: 0 },
      cavern: { f: 160,  q: 0.45, vol: 0.015, type: 'lowpass',  lfo: 0.045, lfoAmt: 0.005, drone: 0 },
      void:   { f: 300,  q: 0.5, vol: 0.020, type: 'bandpass', lfo: 0.05, lfoAmt: 0.010, drone: 55 },
    };
    const c = cfgs[type] || cfgs.cavern;
    const len = Math.floor(this.ctx.sampleRate * 3);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = c.type; f.frequency.value = c.f; f.Q.value = c.q;
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(this.musicBus); g.gain.setTargetAtTime(c.vol, t, 1.5); src.start(t);
    const nodes = [src];
    let g2 = null;
    if (c.drone > 0) { const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = c.drone; o2.detune.value = 4; g2 = this.ctx.createGain(); g2.gain.value = 0; g2.gain.setTargetAtTime(c.vol * 0.7, t, 1.5); o2.connect(g2); g2.connect(this.musicBus); o2.start(t); nodes.push(o2); }
    if (c.lfo > 0) { const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = c.lfo; const lg = this.ctx.createGain(); lg.gain.value = c.lfoAmt; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); nodes.push(lfo); }
    return { nodes, g, g2 };
  }
  _clearMotif() { if (this._motifTimer) { clearTimeout(this._motifTimer); this._motifTimer = null; } this._motifIdx = 0; }
  _clearEnv() { if (this._envTimer) { clearTimeout(this._envTimer); this._envTimer = null; } }

  _motifLoop() {
    if (!this.ctx || this._bossTheme || !this._areaCfg) return;
    const cfg = this._areaCfg;
    const note = cfg.motif[this._motifIdx % cfg.motif.length];
    this._motifIdx++;
    const f = mtof(cfg.root, note);
    // calm areas: soft & warm; tense areas: thinner, slower
    const vol = cfg.calm ? 0.10 : 0.07;
    const dur = cfg.calm ? 2.6 : 2.0;
    this.chime(f, dur, cfg.motifType || 'sine', vol, this.musicBus);
    if (cfg.calm && Math.random() < 0.4) this.chime(f * 2, dur * 0.8, 'sine', vol * 0.5, this.musicBus); // gentle octave shimmer
    const interval = cfg.tempo * 1000 * (0.75 + Math.random() * 0.5);
    this._motifTimer = setTimeout(() => this._motifLoop(), interval);
  }

  _envLoop() {
    if (!this.ctx || this._bossTheme || !this._areaCfg) return;
    const list = this._areaCfg.env || ['windGust'];
    const fn = this[list[Math.floor(Math.random() * list.length)]];
    if (fn) try { fn.call(this); } catch (e) {}
    const interval = 2400 + Math.random() * 4200;
    this._envTimer = setTimeout(() => this._envLoop(), interval);
  }

  // ===================== BOSS THEMES =====================
  startBossTheme(bossType) {
    if (!this.ctx || this.muted || this._bossTheme) return;
    this._bossTheme = true; this._bossPhase = 1;
    this._bossCfg = BOSSES[bossType] || BOSSES.vicar;
    this._clearMotif(); this._clearEnv(); this._stopPad();      // silence the world, the boss sings
    this._bossPad = this._startPad(this._bossCfg, true);
    this._bossIdx = 0;
    this._bossMotifLoop();
  }
  setBossPhase(phase) {
    if (!this.ctx || !this._bossTheme) return;
    if (phase <= this._bossPhase) return;
    this._bossPhase = phase;
    const p = this._bossPad; if (!p) return;
    // brighten, intensify — the theme opens up as the beast grows desperate
    try { p.filter.frequency.setTargetAtTime((this._bossCfg.filter || 800) * (phase >= 3 ? 1.5 : 1.25), this.now(), 0.6); } catch (e) {}
    if (!this._bossLead && this._bossCfg.lead) this._addBossLead();
    if (phase >= 3 && this._bossCfg.emotional) this._addBossLead(2); // a second soaring voice for the final reckoning
    this.bossPhase();   // the low impact swell that marks the shift
  }
  _addBossLead(octave = 1) {
    if (!this.ctx) return;
    const cfg = this._bossCfg;
    const o = this.ctx.createOscillator(); o.type = cfg.choir ? 'sine' : (cfg.regal ? 'triangle' : 'sawtooth');
    o.frequency.value = mtof(cfg.root, 12 * octave);
    o.detune.value = 6;
    const g = this.ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(cfg.vol * 0.5, this.now(), 1.0);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = (cfg.filter || 800) * 1.6;
    o.connect(f); f.connect(g); g.connect(this.musicBus); o.start();
    // slow vibrato
    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 4.5;
    const lg = this.ctx.createGain(); lg.gain.value = 4; lfo.connect(lg); lg.connect(o.frequency); lfo.start();
    this._bossLead = this._bossLead || { nodes: [] };
    this._bossLead.nodes.push({ o, g, lfo });
  }
  _bossMotifLoop() {
    if (!this.ctx || !this._bossTheme || !this._bossCfg) return;
    const cfg = this._bossCfg;
    const motif = cfg.motif;
    const note = motif[this._bossIdx % motif.length];
    this._bossIdx++;
    const phase = this._bossPhase;
    const f = mtof(cfg.root, note);
    const vol = (cfg.emotional ? 0.16 : 0.12) * (phase >= 2 ? 1.15 : 1);
    const dur = cfg.emotional ? 2.4 : 1.8;
    this.chime(f, dur, cfg.motifType || 'sine', vol, this.musicBus);
    // the final boss's voice is a slow, mournful choir — octave doubles for weight
    if (cfg.choir) { this.chime(f * 0.5, dur * 1.1, 'sine', vol * 0.7, this.musicBus); this.chime(f * 2, dur * 0.9, 'sine', vol * 0.4, this.musicBus); }
    // a quiet harmony a third above in phase 2+ — dissonance thickens
    if (phase >= 2 && !cfg.choir) this.chime(mtof(cfg.root, note + 3), dur * 0.8, cfg.motifType, vol * 0.5, this.musicBus);
    const mul = phase >= 3 ? 0.62 : phase >= 2 ? 0.8 : 1.0;
    const interval = cfg.tempo * 1000 * mul * (0.85 + Math.random() * 0.3);
    this._bossMotifTimer = setTimeout(() => this._bossMotifLoop(), interval);
  }
  stopBossTheme() {
    if (!this._bossTheme) return;
    this._bossTheme = false; this._bossPhase = 1;
    if (this._bossMotifTimer) { clearTimeout(this._bossMotifTimer); this._bossMotifTimer = null; }
    // fade & tear down boss pad + leads
    const p = this._bossPad;
    if (p) try { p.g.gain.setTargetAtTime(0, this.now(), 0.6); setTimeout(() => { try { p.voices.forEach(o => o.stop()); p.lfo.stop(); } catch (e) {} }, 1200); } catch (e) {}
    this._bossPad = null;
    if (this._bossLead) { const L = this._bossLead; L.nodes.forEach(n => { try { n.g.gain.setTargetAtTime(0, this.now(), 0.6); setTimeout(() => { try { n.o.stop(); n.lfo.stop(); } catch (e) {} }, 1200); } catch (e) {} }); this._bossLead = null; }
    // restore the world's ambient voice
    if (this._areaCfg) { this._pad = this._startPad(this._areaCfg, false); this._motifLoop(); this._envLoop(); }
  }

  // ===================== FOOTSTEPS (surface-aware) =====================
  footstep(area) {
    if (!this.ctx || this.muted) return;
    const cfg = AREAS[area] || AREAS.ashe;
    const s = cfg.surface || 'stone';
    const v = 0.85 + Math.random() * 0.3;   // subtle volume/pitch variation so steps never feel mechanical
    if (s === 'wood') { this.noise(0.06, 0.06 * v, 500 * v); this.tone(180 * v, 0.05, 'sine', 0.04 * v, 120 * v); }
    else if (s === 'grass') { this.noise(0.05, 0.04 * v, 1400); this.tone(120 * v, 0.04, 'sine', 0.03 * v, 90 * v); }
    else if (s === 'dirt') { this.noise(0.07, 0.07 * v, 300); this.tone(110 * v, 0.05, 'sine', 0.04 * v, 80 * v); }
    else if (s === 'water') { this.noise(0.05, 0.05 * v, 2200); this.tone(420 * v, 0.04, 'sine', 0.03 * v, 700 * v); }
    else { this.noise(0.05, 0.07 * v, 2600); this.tone(140 * v, 0.04, 'sine', 0.045 * v, 110 * v); }   // stone: click + soft thud
  }

  // ===================== LANTERN HUM =====================
  startLanternHum() {
    if (!this.ctx || this.muted || this._lanternHum) return;
    const t = this.now();
    // A soft, flickering flame breath — filtered noise with a slow flicker LFO.
    // (The old steady 110Hz sine was the repetitive hum heard near every rest
    //  lantern — constantly on in the Hunter's Nightmare hub, where the hunter
    //  stands beside it. This natural texture keeps the lantern alive without a
    //  constant pitched drone.)
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 640; f.Q.value = 0.5;
    const rg = this.ctx.createGain(); rg.gain.value = 0; rg.gain.setTargetAtTime(0.020, t, 0.8);
    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 3.2;
    const lg = this.ctx.createGain(); lg.gain.value = 0.012; lfo.connect(lg); lg.connect(rg.gain);
    src.connect(f); f.connect(rg); rg.connect(this.master); src.start(); lfo.start();
    this._lanternHum = { src, rg, lfo };
  }
  stopLanternHum() {
    const h = this._lanternHum; if (!h) return;
    try {
      h.rg.gain.setTargetAtTime(0, this.now(), 0.5);
      setTimeout(() => { try { h.src.stop(); h.lfo.stop(); } catch (e) {} }, 900);
    } catch (e) {}
    this._lanternHum = null;
  }

  // ===================== ENVIRONMENTAL AMBIENCE =====================
  bell() {
    if (!this.ctx || this.muted) return;
    const partials = [180, 270, 360, 540];
    partials.forEach((f, i) => this.tone(f, 2.4 - i * 0.3, 'sine', 0.07 - i * 0.012, null, i * 0.02));
    this.tone(120, 3.0, 'sine', 0.05, 90, 0.05);
  }
  raven() { this.tone(220, 0.18, 'sawtooth', 0.06, 180); this.tone(180, 0.22, 'sawtooth', 0.05, 150, 0.05); }
  windGust() { this.noise(2.6, 0.05, 500); this.noise(2.0, 0.035, 300, 0.2); }
  creak() { this.tone(140, 0.5, 'sawtooth', 0.04, 90); this.tone(95, 0.6, 'sawtooth', 0.03, 70, 0.1); }
  drip() { this.tone(880, 0.12, 'sine', 0.08, 660); this.noise(0.05, 0.03, 3000); }
  thunder() { this.noise(2.2, 0.12, 220); this.tone(48, 1.6, 'sine', 0.08, 30, 0.1); this.noise(1.6, 0.07, 140, 0.4); }
  distantScream() { this.tone(320, 0.7, 'sawtooth', 0.05, 180); this.tone(260, 0.8, 'sawtooth', 0.04, 140, 0.1); this.noise(0.6, 0.03, 1200, 0.05); }
  chain() { this.noise(0.5, 0.05, 4200); this.tone(620, 0.08, 'square', 0.03, 700); this.tone(540, 0.1, 'square', 0.03, 600, 0.12); }
  debris() { this.noise(0.5, 0.10, 900); this.tone(90, 0.3, 'sawtooth', 0.06, 50); this.noise(0.3, 0.06, 1600, 0.15); }
  fireCrackle() { for (let i = 0; i < 6; i++) this.noise(0.06, 0.05, 2400 + Math.random() * 1600, i * 0.07); this.tone(70, 0.4, 'sawtooth', 0.03, 50); }
  torchFlicker() { this.noise(0.4, 0.04, 1200); this.tone(140, 0.3, 'sawtooth', 0.025, 120); }

  // ===================== COMBAT SFX =====================
  swing() {
    const v = 1 + (Math.random() * 2 - 1) * 0.12;   // pitch/volume jitter so repeated swings never feel identical
    this.noise(0.20, 0.16 * v, 2400 * (0.9 + Math.random() * 0.2)); this.noise(0.10, 0.09 * v, 1200, 0.02);
    this.tone(520 * v, 0.10, 'triangle', 0.05 * v, 880 * v);
    if (Math.random() < 0.35) this.noise(0.16, 0.04, 3600, 0.06);   // occasional airy whoosh tail
  }
  heavySwing() {
    const v = 1 + (Math.random() * 2 - 1) * 0.10;
    this.noise(0.34, 0.26 * v, 1500 * (0.92 + Math.random() * 0.16)); this.noise(0.18, 0.13 * v, 700, 0.03);
    this.tone(150 * v, 0.22, 'sawtooth', 0.10 * v, 70 * v); this.tone(90, 0.18, 'sine', 0.06 * v, 60, 0.02);
  }
  // Weapon-on-flesh impact — layered for weight: a thud, a wet tear, a steel
  // shriek, and a cavernous echo. `weight` (0.8..2.4) lets heftier foes thud
  // deeper and harder than common enemies, so a brute lands heavier than a villager.
  hit(heavy = false, weight = 1) {
    const w = Math.max(0.8, Math.min(2.4, weight));
    const f = (heavy ? 90 : 130) / Math.sqrt(w);
    const vol = (heavy ? 0.36 : 0.28) * (0.85 + (w - 1) * 0.25);
    this.noise(heavy ? 0.18 : 0.12, vol, heavy ? 500 : 750);
    this.flesh((heavy ? 0.16 : 0.10) * (0.9 + (w - 1) * 0.2));
    this.tone(f, (heavy ? 0.16 : 0.10) * (0.8 + w * 0.1), 'square', (heavy ? 0.14 : 0.10) * (0.9 + (w - 1) * 0.15), f * 0.5);
    if (heavy || w > 1.4) this.tone(60 / Math.sqrt(w), 0.22, 'sine', 0.10 * (0.8 + (w - 1) * 0.2), 40 / Math.sqrt(w), 0.01);  // sub-thud for heavy/hefty
    this._echo(() => this.noise(0.08, 0.08, 500), 0.09);
  }
  // A boss impact — heavier and more resonant than any common foe: a deep sub
  // thud, a metallic ring, and a longer echo so great beasts feel truly weighty.
  bossHit(heavy = false) {
    this.hit(heavy, 2.2);
    this.tone(48, 0.28, 'sine', 0.14, 32, 0.01);             // deep sub
    this.tone(320, 0.18, 'triangle', 0.07, 180, 0.02);       // metallic ring
    this._echo(() => { this.tone(70, 0.20, 'sine', 0.08, 44); this.noise(0.10, 0.06, 600); }, 0.12);
  }
  crit() {
    this.tone(2400, 0.05, 'square', 0.18, 3400); this.tone(1800, 0.08, 'triangle', 0.12, 1200);
    this.noise(0.05, 0.12, 5000); this.flesh(0.10);
    this._echo(() => this.tone(1500, 0.06, 'triangle', 0.06, 1200), 0.07);
  }
  parry() {
    this.tone(1900, 0.07, 'square', 0.20, 2700); this.tone(2500, 0.10, 'triangle', 0.14, 1700);
    this.noise(0.05, 0.10, 5000);
    this.tone(880, 0.5, 'sine', 0.08, 660, 0.02);            // resonant ring tail — the satisfying "ping"
    this.tone(1320, 0.45, 'sine', 0.05, 990, 0.04);
    this.tone(70, 0.18, 'sine', 0.10, 48, 0.01);             // a low boom for weight
    this._echo(() => this.tone(1500, 0.06, 'triangle', 0.06, 1200), 0.07);
  }
  // The visceral — the most satisfying strike in the game: a deep beast-boom, a
  // wet tear, a steel shriek, a resonant ring, and a triumphant finish shimmer.
  visceral() {
    this.tone(70, 0.40, 'sawtooth', 0.26, 42); this.tone(120, 0.30, 'square', 0.14, 60, 0.02);
    this.noise(0.42, 0.34, 480); this.flesh(0.22); this.tone(1600, 0.10, 'triangle', 0.10, 600, 0.04);
    this.tone(660, 0.6, 'sine', 0.09, 495, 0.05);            // resonant ring
    this._echo(() => { this.tone(60, 0.30, 'sine', 0.10, 40); this.noise(0.18, 0.10, 400); }, 0.10);
    this._echo(() => { this.tone(988, 0.4, 'sine', 0.06, 1318); this.tone(1318, 0.3, 'sine', 0.04, 1568); }, 0.16);  // finish shimmer
  }
  visceralCharge() { this.tone(140, 0.18, 'sawtooth', 0.08, 220); this.noise(0.14, 0.05, 900); }
  // An enemy recoils — a staggered, metallic gasp.
  stagger() { this.tone(520, 0.10, 'triangle', 0.10, 300); this.noise(0.08, 0.07, 1800); this.flesh(0.06); }
  dodge() { this.noise(0.14, 0.10, 2000); this.tone(300, 0.06, 'sine', 0.04, 540); }
  transform() { this.tone(300, 0.25, 'sawtooth', 0.1, 600); this.noise(0.2, 0.12, 1000); }
  shot() { this.noise(0.10, 0.26, 3000); this.tone(820, 0.06, 'square', 0.09, 200); this._echo(() => this.noise(0.05, 0.06, 2200), 0.06); }
  hurt() { this.tone(210, 0.26, 'sawtooth', 0.18, 64); this.noise(0.16, 0.22, 600); this.flesh(0.10); }
  // A molotov's fiery detonation — a sharp boom, a roaring low whoosh, and crackling embers.
  explosion() {
    if (!this.ctx || this.muted) return;
    this.tone(70, 0.5, 'sawtooth', 0.26, 38);
    this.noise(0.5, 0.30, 500);
    this.tone(120, 0.4, 'square', 0.12, 60, 0.04);
    this.noise(0.3, 0.16, 1200, 0.08);
    this._echo(() => this.noise(0.25, 0.14, 420), 0.06);
    for (let i = 0; i < 5; i++) this.noise(0.06, 0.05, 2200 + Math.random() * 1400, 0.12 + i * 0.05);
  }

  // ---- Per-enemy-type attack & death cues ----
  enemyAttack(type) {
    if (!this.ctx || this.muted) return;
    switch (type) {
      case 'hound': case 'ancient_beast': case 'crypt_beast':       // beastly lunge — a guttural whoosh
        this.noise(0.18, 0.14, 700); this.tone(120, 0.14, 'sawtooth', 0.08, 70); break;
      case 'priest': case 'scholar': case 'void_scholar':            // a chanted cast
        this.tone(330, 0.30, 'sine', 0.07, 494); this.tone(247, 0.30, 'sine', 0.06, 370, 0.05); this.noise(0.3, 0.03, 1600); break;
      case 'knight': case 'guardian': case 'rune_guardian':          // heavy steel draw
        this.tone(160, 0.18, 'sawtooth', 0.07, 110); this.noise(0.16, 0.08, 2200); break;
      case 'brute': case 'heavy_villager': case 'executioner': case 'death_brute': case 'titan': case 'the_warden':
        this.noise(0.30, 0.18, 500); this.tone(90, 0.20, 'sawtooth', 0.10, 50); break;  // a ponderous heave
      case 'watcher': case 'phantom':                                // an eerie whine before the bolt
        this.tone(660, 0.30, 'sine', 0.05, 990); this.noise(0.2, 0.03, 3000); break;
      case 'bell_keeper': case 'librarian':                          // a ritual chime/rustle
        this.tone(880, 0.18, 'sine', 0.06, 660); this.noise(0.2, 0.04, 2400); break;
      case 'fallen_hunter': case 'pale_hunter':                      // a swift steel whisper
        this.noise(0.14, 0.10, 3000); this.tone(420, 0.06, 'triangle', 0.05, 600); break;
      default:                                                       // knife / townsfolk / villager / crawler — a quick swish
        this.noise(0.14, 0.09, 2600); this.tone(380, 0.05, 'triangle', 0.04, 520); break;
    }
  }
  enemyDeath(type) {
    if (!this.ctx || this.muted) return;
    switch (type) {
      case 'hound':
        this.tone(300, 0.30, 'sawtooth', 0.12, 90); this.tone(180, 0.30, 'sawtooth', 0.08, 60, 0.05); this.flesh(0.10); break;
      case 'priest': case 'scholar': case 'void_scholar':
        this.tone(440, 0.5, 'sine', 0.08, 220); this.tone(330, 0.5, 'sine', 0.06, 165, 0.08); this.noise(0.4, 0.04, 1800); break; // ethereal fade
      case 'knight': case 'guardian': case 'rune_guardian':
        this.noise(0.30, 0.16, 1400); this.tone(160, 0.30, 'sawtooth', 0.10, 80); this.tone(1200, 0.06, 'square', 0.06, 700); break; // armor collapse + clang
      case 'brute': case 'executioner': case 'death_brute': case 'titan': case 'the_warden':
        this.tone(70, 0.5, 'sawtooth', 0.20, 40); this.noise(0.5, 0.22, 380); this.flesh(0.18); this.tone(50, 0.4, 'sine', 0.12, 30, 0.1); break; // heavy thud
      case 'watcher': case 'phantom':
        this.tone(520, 0.6, 'sine', 0.08, 130); this.noise(0.4, 0.05, 2400); break; // a dissipating wail
      case 'bell_keeper': case 'librarian':
        this.tone(660, 0.4, 'sine', 0.07, 330); this.tone(990, 0.4, 'sine', 0.05, 495, 0.06); this.noise(0.3, 0.06, 1800); break;
      case 'ancient_beast': case 'crypt_beast':
        this.tone(90, 0.5, 'sawtooth', 0.18, 45); this.noise(0.45, 0.18, 420); this.flesh(0.16); break;
      case 'fallen_hunter': case 'pale_hunter':
        this.tone(200, 0.4, 'sawtooth', 0.10, 80); this.noise(0.25, 0.12, 800); this.tone(140, 0.3, 'sine', 0.06, 90, 0.08); break;
      default:
        this.tone(160, 0.30, 'sawtooth', 0.14, 60); this.flesh(0.16); this.noise(0.20, 0.16, 420); this._echo(() => this.tone(80, 0.20, 'sine', 0.06, 50), 0.08); break;
    }
  }

  // ===================== BOSS CINEMATIC CUES =====================
  bossRoar() { this.tone(70, 1.2, 'sawtooth', 0.3, 40); this.noise(1.0, 0.3, 400); this.tone(110, 1.0, 'square', 0.12, 55, 0.1); this.tone(48, 1.4, 'sine', 0.10, 32, 0.06); this._echo(() => this.tone(60, 0.5, 'sine', 0.08, 40), 0.3); }
  bossPhase() { this.tone(55, 1.4, 'sawtooth', 0.28, 38); this.noise(1.2, 0.25, 600, 0.2); this.tone(110, 0.8, 'square', 0.10, 73, 0.1); this._echo(() => this.tone(73, 0.5, 'sine', 0.07, 48), 0.25); }
  death() { this.tone(330, 1.2, 'sawtooth', 0.18, 50); this.tone(220, 1.4, 'sine', 0.12, 30, 0.2); this.tone(110, 1.6, 'sine', 0.08, 55, 0.1); }
  victory() { [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.14, null, i * 0.18)); this.tone(196, 1.2, 'sine', 0.07, 147, 0.1); this.tone(1318, 0.8, 'sine', 0.05, 1568, 0.5); }
  // A charm discovered — a bright rising arpeggio with a warm low anchor and a
  // shimmering tail; feels distinctly more rewarding than a common pickup.
  charmFind() {
    if (!this.ctx || this.muted) return;
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.7 - i * 0.08, 'sine', 0.11 - i * 0.012, null, i * 0.11));
    this.tone(261, 1.0, 'sine', 0.06, 196, 0.04);
    this.tone(392, 0.9, 'triangle', 0.04, 294, 0.08);
    this.tone(1568, 0.5, 'sine', 0.03, 1976, 0.3);
    this._echo(() => this.tone(1046, 0.3, 'sine', 0.04, 1568), 0.18);
  }
  // A boss's soul absorbed — the most portentous reward in the game: a low
  // boom, a swelling major chord, and an ascending sparkle that crowns the kill.
  soulReward() {
    if (!this.ctx || this.muted) return;
    this.tone(55, 2.0, 'sawtooth', 0.26, 42, 0.05);
    [330, 415, 494, 622, 784, 988].forEach((f, i) => this.tone(f, 1.8 - i * 0.14, 'sine', 0.13 - i * 0.012, null, 0.2 + i * 0.16));
    this.tone(988, 1.4, 'sine', 0.07, 1318, 0.5);
    this.tone(1568, 1.0, 'sine', 0.04, 1976, 0.7);           // ascending sparkle
    this.noise(0.5, 0.06, 1200, 0.1);
  }
  // Solemn slow bell + low drone for area-discovery title cards.
  areaTitle() {
    if (!this.ctx || this.muted) return;
    this.tone(98, 2.6, 'sine', 0.07, 88, 0.02);
    this.tone(147, 2.4, 'sine', 0.05, 138, 0.04);
    [196, 294, 392, 587].forEach((f, i) => this.tone(f, 2.2 - i * 0.3, 'sine', 0.06 - i * 0.012, null, 0.04 + i * 0.03));
    this.tone(1175, 1.6, 'sine', 0.025, 988, 0.12);
  }

  // ===================== UI & FEEDBACK =====================
  essence() { this.tone(880, 0.12, 'sine', 0.1, 1320); this.tone(1320, 0.18, 'sine', 0.08, 1760, 0.06); }
  loot() { this.tone(660, 0.10, 'triangle', 0.08, 990); this.tone(990, 0.16, 'sine', 0.07, 1320, 0.06); this.noise(0.08, 0.04, 2400); }
  heal() { this.tone(523, 0.18, 'sine', 0.12, 784); this.tone(784, 0.3, 'sine', 0.09, 1046, 0.1); this.noise(0.2, 0.06, 500); }
  levelup() { [440, 554, 659, 880, 1109].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.12, null, i * 0.11)); this.tone(220, 0.8, 'sine', 0.06, 165, 0.05); this.tone(1318, 0.5, 'sine', 0.05, 1568, 0.28); }
  // A warm, comforting chime + a low hum + a soft flame settle — resting at the lantern.
  lantern() {
    this.tone(523, 0.6, 'sine', 0.09, 784); this.tone(659, 0.8, 'sine', 0.07, 988, 0.1); this.tone(784, 1.0, 'sine', 0.05, 1175, 0.2);
    this.tone(130, 1.4, 'sine', 0.06, 98, 0.05);
    this.noise(0.5, 0.015, 600, 0.05);                      // soft flame settle
  }
  equipCharm() { this.tone(523, 0.08, 'triangle', 0.08, 784); this.tone(784, 0.16, 'sine', 0.07, 1046, 0.04); this.tone(1046, 0.14, 'sine', 0.04, 1318, 0.08); this.noise(0.06, 0.03, 3000); }
  upgradeWeapon() { this.tone(330, 0.12, 'sawtooth', 0.08, 220); this.tone(660, 0.2, 'sine', 0.07, 990, 0.08); this.tone(990, 0.3, 'sine', 0.06, 1320, 0.16); this.tone(1320, 0.24, 'sine', 0.04, 1760, 0.22); this.noise(0.1, 0.04, 4000); }
  discover() { this.tone(659, 0.22, 'sine', 0.09, 988); this.tone(988, 0.3, 'sine', 0.06, 1175, 0.08); this.tone(1318, 0.24, 'sine', 0.03, 1568, 0.14); }
  // A trophy earned — a warm rising arpeggio with a triumphant top note and a
  // gentle underpinning; communicates a real milestone, never harsh.
  achievement() {
    if (!this.ctx || this.muted) return;
    this.tone(659, 0.5, 'sine', 0.11, 880, 0.0);
    this.tone(988, 0.7, 'sine', 0.09, 1175, 0.14);
    this.tone(1318, 0.6, 'sine', 0.06, 1568, 0.22);         // triumphant top note
    this.tone(247, 1.0, 'sine', 0.06, 196, 0.06);
    this.tone(494, 0.8, 'triangle', 0.04, 392, 0.10);        // warm underpinning
  }
  fragment() { this.tone(196, 0.5, 'sine', 0.05, 147, 0.02); this.tone(523, 0.18, 'sine', 0.1, 784); this.tone(784, 0.22, 'sine', 0.09, 1046, 0.08); this.tone(1046, 0.4, 'sine', 0.07, 1568, 0.16); this.tone(1318, 0.3, 'sine', 0.04, 1568, 0.22); this.noise(0.12, 0.05, 2400); }
  // A grand discovery chord — the moment a Map Fragment is charted and a new
  // corner of the kingdom opens. A warm low anchor under a rising major sweep.
  fragmentDiscovery() {
    if (!this.ctx || this.muted) return;
    this.tone(55, 2.0, 'sine', 0.10, 44, 0.02);
    [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, 1.4 - i * 0.12, 'sine', 0.10 - i * 0.012, null, 0.06 + i * 0.10));
    this.tone(1175, 1.0, 'sine', 0.05, 1568, 0.42);
    this.noise(0.4, 0.05, 1600, 0.08);
  }
  questComplete() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.10, null, i * 0.14)); this.tone(261, 0.9, 'sine', 0.05, 196, 0.04); }
  shortcutUnlock() { this.tone(196, 0.5, 'sawtooth', 0.10, 147); this.noise(0.4, 0.10, 700); this.tone(98, 0.8, 'sine', 0.07, 73, 0.1); }
  openChest() { this.tone(2400, 0.04, 'square', 0.05, 1800); this.noise(0.34, 0.09, 1100); this.tone(170, 0.5, 'sawtooth', 0.07, 90); this.noise(0.12, 0.06, 2600, 0.06); this.tone(660, 0.16, 'triangle', 0.04, 880, 0.08); this.noise(0.10, 0.05, 520, 0.10); }
  // A rewarding "treasure acquired" cue — a warm rising chime that follows a
  // chest's opening, so every discovery ends in a small flourish of accomplishment.
  treasure() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.5 - i * 0.06, 'sine', 0.09 - i * 0.012, null, i * 0.09)); this.tone(392, 0.7, 'sine', 0.05, 294, 0.04); this.tone(1318, 0.4, 'sine', 0.035, 1568, 0.22); this._echo(() => this.tone(988, 0.3, 'sine', 0.04, 1318), 0.16); }
  // Bloodstone Shards — weapon upgrade material. A crystalline ring with a low
  // mineral weight, distinct from common essence so forge-fuel feels significant.
  shard() { this.tone(988, 0.18, 'triangle', 0.08, 1318); this.tone(1318, 0.26, 'sine', 0.07, 1760, 0.06); this.tone(494, 0.4, 'sine', 0.05, 370, 0.02); this.tone(247, 0.5, 'sine', 0.04, 185, 0.04); this.noise(0.08, 0.03, 4000); }
  // ---- Breakable-object cues: material-specific shatters, satisfying but never
  // loud/dramatic. Each bursts, then a faint echo for a sense of the space. ----
  breakWood() { this.noise(0.16, 0.10, 1400); this.tone(220, 0.12, 'sawtooth', 0.06, 120); this.noise(0.10, 0.06, 600, 0.05); this._echo(() => this.noise(0.08, 0.05, 900), 0.05); }
  breakStone() { this.noise(0.18, 0.10, 900); this.tone(160, 0.14, 'triangle', 0.06, 90); this.tone(420, 0.08, 'square', 0.03, 300, 0.02); this._echo(() => this.noise(0.10, 0.05, 700), 0.06); }
  breakPottery() { this.noise(0.14, 0.09, 2600); this.tone(660, 0.10, 'triangle', 0.05, 990); this.noise(0.10, 0.05, 1600, 0.04); this._echo(() => this.noise(0.08, 0.04, 2200), 0.05); }
  breakBone() { this.tone(320, 0.10, 'square', 0.06, 200); this.noise(0.12, 0.07, 1800); this.tone(180, 0.12, 'triangle', 0.04, 120, 0.03); this._echo(() => this.noise(0.08, 0.04, 2200), 0.05); }
  breakGlass() { this.tone(2400, 0.10, 'triangle', 0.06, 3400); this.noise(0.12, 0.08, 5000); this.tone(1800, 0.08, 'sine', 0.04, 2600, 0.03); this._echo(() => this.noise(0.08, 0.05, 6000), 0.05); }
  menuOpen() { this.tone(330, 0.10, 'sine', 0.06, 392); this.noise(0.08, 0.03, 2000); this.tone(494, 0.06, 'sine', 0.025, 392, 0.03); }
  menuClose() { this.tone(392, 0.10, 'sine', 0.06, 330); this.tone(294, 0.06, 'sine', 0.025, 247, 0.03); }
  // A mystical charging tone that swells, then dissolves into silence as the world shifts.
  teleport() {
    this.tone(523, 0.9, 'sine', 0.07, 1046); this.tone(784, 1.0, 'sine', 0.06, 1568, 0.1);
    this.noise(1.0, 0.05, 1200); this.tone(440, 1.2, 'sine', 0.05, 220, 0.2);
    this._echo(() => this.tone(1175, 0.4, 'sine', 0.03, 1568), 0.2);  // lingering shimmer
  }
  blockClang() { this.tone(2400, 0.06, 'square', 0.18, 1800); this.tone(1200, 0.08, 'triangle', 0.1); this.noise(0.05, 0.12, 4000); }
  slam() { this.tone(58, 0.4, 'sawtooth', 0.3, 30); this.noise(0.3, 0.25, 220); }
  summon() { this.tone(440, 0.3, 'sine', 0.1, 880); this.tone(660, 0.4, 'sine', 0.08, 220, 0.05); }
  beastRoar() { this.tone(90, 0.5, 'sawtooth', 0.2, 50); this.noise(0.4, 0.2, 400); }
  charge() { this.tone(180, 0.25, 'sawtooth', 0.12, 240); this.noise(0.2, 0.08, 800); }

  // ===================== LOW-HEALTH HEARTBEAT =====================
  // A deep, slow lub-dub that quickens and loudens as the Hunter nears death.
  // Driven each frame by updateLowHealth(intensity 0..1); stops when it fades,
  // so healing above 40% silences it cleanly.
  updateLowHealth(intensity) {
    if (!this.ctx) return;
    intensity = Math.max(0, Math.min(1, intensity));
    this._heartIntensity = intensity;
    // Duck + muffle the ambient music at very low health so the heartbeat
    // becomes the player's primary focus. Ramps back smoothly when healing.
    const now = this.ctx.currentTime;
    try { this.musicBus.gain.setTargetAtTime(1 - intensity * 0.5, now, 0.3); } catch (e) {}
    if (this.musicFilter) { try { this.musicFilter.frequency.setTargetAtTime(2200 - intensity * 1500, now, 0.3); } catch (e) {} }
    if (this.muted) {
      if (this._heartTimer) { clearTimeout(this._heartTimer); this._heartTimer = null; }
      if (this._breathTimer) { clearTimeout(this._breathTimer); this._breathTimer = null; }
      return;
    }
    if (intensity > 0.04 && !this._heartTimer) this._heartLoop();
    else if (intensity <= 0.04 && this._heartTimer) { clearTimeout(this._heartTimer); this._heartTimer = null; }
    // Heavy breathing only at critical health (below ~20%).
    if (intensity > 0.5 && !this._breathTimer) this._breathLoop();
    else if (intensity <= 0.5 && this._breathTimer) { clearTimeout(this._breathTimer); this._breathTimer = null; }
  }
  _heartLoop() {
    if (!this.ctx || this.muted) { this._heartTimer = null; return; }
    const i = this._heartIntensity || 0;
    if (i <= 0.04) { this._heartTimer = null; return; }
    const vol = 0.09 + i * 0.15;
    this._thump(60, vol, 0);            // lub
    this._thump(70, vol * 0.7, 0.16);   // dub
    const interval = 1150 - i * 600;   // faster as death nears (1.15s -> 0.55s)
    this._heartTimer = setTimeout(() => this._heartLoop(), interval);
  }
  _thump(freq, vol, delay) {
    if (!this.ctx || this.muted) return;
    const t = this.now() + delay;
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.22);
    // a soft body-thud noise layer for weight
    const len = Math.floor(this.ctx.sampleRate * 0.12);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const ng = this.ctx.createGain(); ng.gain.value = vol * 0.5;
    src.connect(f); f.connect(ng); ng.connect(this.master);
    src.start(t);
  }

  // ===================== CRITICAL-HEALTH BREATHING =====================
  // Heavy hunter breathing at critical health — a filtered, enveloped noise
  // swell (inhale/exhale) that quickens as death nears. Routed to the master
  // bus so the ambient ducking above never silences it.
  _breathLoop() {
    if (!this.ctx || this.muted) { this._breathTimer = null; return; }
    const i = this._heartIntensity || 0;
    if (i <= 0.5) { this._breathTimer = null; return; }
    const vol = 0.03 + (i - 0.5) * 0.12;
    this._breath(vol);
    const interval = 3400 - (i - 0.5) * 1700;   // 3.4s -> ~2.55s as i -> 1
    this._breathTimer = setTimeout(() => this._breathLoop(), interval);
  }
  _breath(vol) {
    if (!this.ctx || this.muted) return;
    const t = this.now();
    const dur = 1.2;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) {
      const e = k < len * 0.5 ? (k / (len * 0.5)) : (1 - (k - len * 0.5) / (len * 0.5));
      d[k] = (Math.random() * 2 - 1) * e * 0.8;   // rise (inhale) then fall (exhale)
    }
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 460; bp.Q.value = 0.8;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(this.master);
    src.start(t);
  }
}