// LowHealthFx.js — the creeping-blood death's-edge warning.
// A smoothed, gothic low-health system: a dark blood vignette that intensifies
// as the Hunter's health falls below 40%, realistic edge blood splatters, a
// heartbeat-synced camera pulse and colour desaturation below 20%, and deep
// edge-darkening near death (max at ~10%). The center stays clear for combat
// and everything fades out over about a second when the player heals above 40%.
// Drives the synthesized heartbeat, breathing and ambient ducking in SoundBank
// via updateLowHealth().

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Deterministic corner/edge blood-splatter blobs (stable across frames so the
// blood reads as smeared-on rather than flickering noise).
const SPATTERS = [];
(function initSplatters() {
  const step = (s) => { s = (s * 1103515245 + 12345) & 0x7fffffff; return [s, s / 0x7fffffff]; };
  for (let i = 0; i < 16; i++) {
    let s = i * 9301 + 49297, r;
    [s, r] = step(s); const edge = Math.floor(r * 4);
    [s, r] = step(s); const along = 0.04 + r * 0.42;
    [s, r] = step(s); const depth = 0.55 + r * 0.4;
    [s, r] = step(s); const rad = 30 + r * 50;
    [s, r] = step(s); const drip = r > 0.55;
    SPATTERS.push({ edge, along, depth, rad, drip });
  }
})();

// Called every frame from the engine update loop, before early-returns, so the
// effect always fades out cleanly even when paused/dead/transitioning.
export function updateLowHealth(game, dt) {
  const p = game.player;
  let target = 0;
  if (p && (game.state === 'playing' || game.state === 'bossActive') && !game.paused) {
    const ratio = p.hp / p.maxHp;
    if (ratio < 0.4) target = clamp((0.4 - ratio) / 0.3, 0, 1);   // 0 at 40%, 1 at 10%
  }
  if (!game._lowHealth) game._lowHealth = 0;
  // smooth ~1s fade toward the target (healing feels good, never a hard cut)
  game._lowHealth += (target - game._lowHealth) * Math.min(1, dt * 2.2);
  if (game._lowHealth < 0.01) game._lowHealth = 0;
  const I = game._lowHealth;
  // heartbeat-synced camera pulse value (subtle vertical throb), used by the
  // engine's camera translate so the screen "beats" with the audio below ~20%.
  let beat = 0;
  if (I > 0.667) {
    const period = 1.15 - I * 0.6;
    const ph = (game.runtime % period) / period;
    beat = ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI)
      : (ph < 0.34 ? Math.sin(((ph - 0.18) / 0.16) * Math.PI) * 0.55 : 0);
    beat *= clamp((I - 0.667) / 0.333, 0, 1);
  }
  game._lowHealthBeat = beat;
  if (game.sound && game.sound.updateLowHealth) game.sound.updateLowHealth(I);
}

export function drawLowHealth(game, ctx) {
  const I = game._lowHealth || 0;
  if (I <= 0.01) return;
  const w = game.viewW, h = game.viewH;
  const cx = w / 2, cy = h / 2;
  const inner = Math.min(w, h) * 0.34;
  const outer = Math.max(w, h) * 0.74;
  const t = game.runtime;

  // Colour desaturation below ~20% health — the world bleaches toward grey.
  // Uses the 'saturation' blend so it tints the whole scene without blocking it.
  const desat = clamp((I - 0.667) / 0.333, 0, 1);
  if (desat > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = desat * 0.42;
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Creeping blood vignette at the edges — center stays clear for combat.
  const a = I * 0.55;
  const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  g.addColorStop(0, 'rgba(58,6,6,0)');
  g.addColorStop(0.55, `rgba(58,6,6,${a * 0.35})`);
  g.addColorStop(0.85, `rgba(40,4,6,${a * 0.75})`);
  g.addColorStop(1, `rgba(20,2,4,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Realistic blood splatters clinging to the outer frame — they grow + thicken
  // as health falls. Kept at the periphery so the center is never obstructed.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const grow = clamp(I * 1.3, 0, 1);
  for (const s of SPATTERS) {
    let ex, ey;
    if (s.edge === 0) { ex = s.along * w; ey = s.depth * h * 0.16; }
    else if (s.edge === 1) { ex = (1 - s.along) * w; ey = s.depth * h * 0.16; }
    else if (s.edge === 2) { ex = s.depth * w * 0.14; ey = s.along * h; }
    else { ex = w - s.depth * w * 0.14; ey = (1 - s.along) * h; }
    const r = s.rad * (0.4 + grow * 0.7);
    const sa = I * (0.14 + 0.07 * Math.sin(t * 0.5 + s.edge));
    const tg = ctx.createRadialGradient(ex, ey, 2, ex, ey, r);
    tg.addColorStop(0, `rgba(72,8,10,${sa})`);
    tg.addColorStop(0.7, `rgba(50,6,8,${sa * 0.5})`);
    tg.addColorStop(1, 'rgba(40,4,6,0)');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    if (s.drip && grow > 0.4) {
      ctx.fillStyle = `rgba(50,6,8,${sa * 0.6})`;
      ctx.fillRect(ex - 1.5, ey, 3, r * 0.85 * grow);
    }
  }
  ctx.restore();

  // Heartbeat pulse below ~20% — a lub-dub throb synced to the audio + camera.
  const pulseStrength = clamp((I - 0.667) / 0.333, 0, 1);
  if (pulseStrength > 0) {
    const period = 1.15 - I * 0.6;
    const ph = (t % period) / period;
    const beat = ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI)
      : (ph < 0.34 ? Math.sin(((ph - 0.18) / 0.16) * Math.PI) * 0.55 : 0);
    const pa = beat * pulseStrength * 0.32;
    if (pa > 0.001) {
      const pg = ctx.createRadialGradient(cx, cy, inner * 0.6, cx, cy, outer);
      pg.addColorStop(0, 'rgba(120,10,12,0)');
      pg.addColorStop(0.7, `rgba(120,10,12,${pa * 0.4})`);
      pg.addColorStop(1, `rgba(120,8,12,${pa})`);
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Deep edge darkening near death — the world closing in (max at ~10% health).
  const dark = clamp((I - 0.8) / 0.2, 0, 1);
  if (dark > 0) {
    const dg = ctx.createRadialGradient(cx, cy, inner * 0.8, cx, cy, outer * 1.05);
    dg.addColorStop(0, 'rgba(0,0,0,0)');
    dg.addColorStop(1, `rgba(0,0,0,${dark * 0.55})`);
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, w, h);
  }
}