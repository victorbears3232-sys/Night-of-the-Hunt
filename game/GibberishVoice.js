// GibberishVoice.js — a lightweight, file-free "gibberish" NPC voice system.
// Plays short synthesized syllable blips while an NPC's dialogue line is shown,
// in the spirit of Hollow Knight / Animal Crossing / Celeste. Every NPC has a
// distinct timbre, pitch, and speaking speed.
//
// This is a PURELY COSMETIC audio layer. It does not read or alter dialogue
// logic, quest state, NPC behaviour, save data, or any UI — it only makes
// sound while a line is displayed and stops the instant it goes away.
//
// Each interaction speaks for at most ~1.5–2 seconds (capped), then falls silent
// so the player reads in peace. A single lazily-created Web Audio context is
// used; oscillator+filter nodes are short-lived and auto-disconnect after they
// stop, so there are no leaks across many conversations.

let ctx = null;
let master = null;
let sharedCtx = null;
let sharedDest = null;
let enabled = true;

// Route through the game's already-running audio context so the gibberish
// actually plays. A context created lazily inside a post-render effect can
// stay suspended under browser autoplay rules (its currentTime never
// advances, so scheduled oscillators are silent); the game's context was
// unlocked by the initial "Awaken the Hunt" gesture and is already running.
export function attach(audioCtx, dest) {
  sharedCtx = audioCtx || null;
  sharedDest = dest || null;
}

function audio() {
  if (sharedCtx) {
    if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
    return sharedCtx;
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Voice profile fields:
//   basePitch  — centre pitch in Hz
//   pitchRange — ± random pitch variation per syllable
//   speed      — ms between syllables (also sets the ~1.8s speaking cap)
//   wave       — oscillator type (timbre)
//   detune     — cents offset
//   chars      — characters of text per syllable (fewer = more blips)
//   vol        — per-syllable volume (optional, default 0.12)
//   dur        — syllable decay length in s (optional, default 0.11)

// Per-NPC profiles — every character gets their own voice.
const NPC_PROFILES = {
  aldric:  { basePitch: 102, pitchRange: 7,  speed: 136, wave: 'sine',     detune: -5, chars: 6, vol: 0.09, dur: 0.17 }, // mysterious, calm, ancient whisper
  elias:   { basePitch: 116, pitchRange: 13, speed: 98,  wave: 'triangle', detune: -2, chars: 5, vol: 0.11, dur: 0.12 }, // warm, weathered mentor
  mire:    { basePitch: 186, pitchRange: 22, speed: 82,  wave: 'sine',     detune: 6,  chars: 5, vol: 0.10, dur: 0.11 }, // cool, measured scholar
  garrick: { basePitch: 86,  pitchRange: 12, speed: 116, wave: 'sawtooth', detune: -6, chars: 5, vol: 0.10, dur: 0.10 }, // gruff, low smith
  pilgrim: { basePitch: 144, pitchRange: 24, speed: 112, wave: 'sine',     detune: 3,  chars: 5, vol: 0.09, dur: 0.14 }, // airy, old, prayerful
  child:   { basePitch: 284, pitchRange: 55, speed: 64,  wave: 'sine',     detune: 10, chars: 4, vol: 0.08, dur: 0.09 }, // high, bell-like, playful
  mira:    { basePitch: 172, pitchRange: 18, speed: 92,  wave: 'triangle', detune: 5,  chars: 5, vol: 0.10, dur: 0.12 }, // gentle, warm healer
  holt:    { basePitch: 98,  pitchRange: 11, speed: 120, wave: 'sawtooth', detune: -4, chars: 5, vol: 0.09, dur: 0.12 }, // low, quiet smith
  aldous:  { basePitch: 168, pitchRange: 16, speed: 96,  wave: 'sine',     detune: 3,  chars: 5, vol: 0.10, dur: 0.11 }, // measured, dry reader
  maren:   { basePitch: 152, pitchRange: 18, speed: 80,  wave: 'square',   detune: -2, chars: 5, vol: 0.09, dur: 0.09 }, // brisk, cheerful trader
  tailor:  { basePitch: 160, pitchRange: 14, speed: 90,  wave: 'triangle', detune: 1,  chars: 5, vol: 0.10, dur: 0.10 }, // fussy, measured clothier
  pell:    { basePitch: 122, pitchRange: 14, speed: 106, wave: 'sawtooth', detune: -3, chars: 5, vol: 0.10, dur: 0.11 }, // weathered, low trapper
  voss:    { basePitch: 178, pitchRange: 14, speed: 94,  wave: 'sine',     detune: 4,  chars: 5, vol: 0.10, dur: 0.13 }, // noble, measured courtier
};

// Figure-based fallbacks (used only if an NPC has no id-specific profile).
const FIGURE_PROFILES = {
  hunter:     { basePitch: 130, pitchRange: 22, speed: 92,  wave: 'triangle', detune: 0,  chars: 5 },
  scholar:    { basePitch: 178, pitchRange: 30, speed: 78,  wave: 'sine',     detune: 4,  chars: 5 },
  blacksmith: { basePitch: 96,  pitchRange: 16, speed: 108, wave: 'sawtooth', detune: -4, chars: 5 },
  pilgrim:    { basePitch: 150, pitchRange: 28, speed: 100, wave: 'sine',     detune: 2,  chars: 5 },
  healer:     { basePitch: 168, pitchRange: 26, speed: 88,  wave: 'triangle', detune: 5,  chars: 5 },
  child:      { basePitch: 260, pitchRange: 55, speed: 66,  wave: 'sine',     detune: 8,  chars: 4 },
  merchant:   { basePitch: 146, pitchRange: 22, speed: 84,  wave: 'square',   detune: -2, chars: 5 },
};
const DEFAULT_PROFILE = { basePitch: 138, pitchRange: 24, speed: 94, wave: 'triangle', detune: 0, chars: 5 };

let token = 0;

function profileFor(npcId, figure) {
  return (npcId && NPC_PROFILES[npcId]) || (figure && FIGURE_PROFILES[figure]) || DEFAULT_PROFILE;
}

// One short vowel-like syllable: an oscillator through a resonant lowpass with
// a fast attack/decay envelope and a slight downward pitch glide, so each blip
// has a voiced, "spoken" quality rather than a flat beep.
function playSyllable(p) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900 + Math.random() * 1100;
  filter.Q.value = 5 + Math.random() * 4;
  osc.type = p.wave;
  const base = p.basePitch + (Math.random() * 2 - 1) * p.pitchRange;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, base * 0.82), t + 0.09);
  osc.detune.value = p.detune + (Math.random() * 2 - 1) * 7;
  const vol = (p.vol || 0.12) * 2.0;
  const dur = p.dur || 0.11;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sharedDest || master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Speak a line: schedules a short chain of syllable blips spaced by the NPC's
// speed. Total speaking time is capped at ~0.5–0.8s regardless of line length,
// so the voice gives a brief impression of speech and then stops while the
// player keeps reading. Cancelling (stop()/speak() again) bumps the token so
// already-scheduled callbacks no-op — no overlaps, no distortion.
export function speak(npcId, figure, text) {
  stop();
  if (!enabled || !text) return;
  const p = profileFor(npcId, figure);
  // One short vocalization per dialogue page: a brief burst of a few syllables
  // (~0.5–0.8s) that gives the impression of speech, then falls silent while the
  // player reads. Re-triggered by the dialogue component each time a new page
  // appears (speak() first cancels any in-flight clip via stop()).
  const maxByTime = Math.min(8, Math.floor(800 / p.speed));
  const count = Math.max(1, Math.min(Math.round(text.length / p.chars), maxByTime));
  const my = ++token;
  let i = 0;
  const step = () => {
    if (my !== token) return;
    playSyllable(p);
    i++;
    if (i < count) {
      // mostly even pacing, with an occasional longer pause so the rhythm
      // never feels mechanical or repetitive over a long session.
      const gap = p.speed + (Math.random() * 2 - 1) * 18;
      const extra = Math.random() < 0.12 ? p.speed * 0.8 : 0;
      setTimeout(step, gap + extra);
    }
  };
  step();
}

export function stop() { token++; }

export function setEnabled(v) { enabled = !!v; if (!enabled) stop(); }
export function isEnabled() { return enabled; }

export default { speak, stop, attach, setEnabled, isEnabled };