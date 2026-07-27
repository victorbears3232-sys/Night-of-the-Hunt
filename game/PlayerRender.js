// PlayerRender.js — detailed gothic hunter rendering (canvas 2D, world-space).
// Layered, animated hunter: tattered long coat over vest and shirt, belt with
// buckle and pouch, gloves, heavy boots, high scarf/collar, wide weathered hat
// shadowing the face. Carries a properly proportioned Saw Cleaver with idle,
// walk, dodge, charge, swing (ease-out, combo-directional trails) and a brutal
// cinematic visceral finishing strike. Kept original in spirit, gritty in feel.

import { getOutfit } from './Outfits.js';
import { getSkin } from './WeaponSkins.js';

let CURRENT_SKIN = null;

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - (1 - t) * (1 - t);

const COAT = '#1c1820';
const COAT_SHADE = '#13101a';
const COAT_LINING = '#3a1a1a';
const VEST = '#2a2630';
const SHIRT = '#4a4438';
const BELT = '#5a3a1e';
const BUCKLE = '#9a7a3a';
const BOOT = '#15100c';
const GLOVE = '#241c14';
const SKIN = '#b89878';
const HAT = '#0c0a10';
const HAT_BRIM = '#16121c';
const STEEL = '#c9d2e2';
const STEEL_DARK = '#7a8499';
const SERRATE = '#9aa6bd';


export function drawPlayer(game, ctx) {
  const p = game.player;
  const t = game.runtime;
  const r = p.r;
  const hurt = p.hurtFlash > 0;
  const staggered = p.staggered > 0;

  ctx.save();
  ctx.translate(p.x, p.y);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.8, r * 1.15, r * 0.42, 0, 0, TAU); ctx.fill();

  // dodge roll — tumbling with trailing afterimages
  if (p.dodge) {
    const roll = p.dodge.t / p.dodge.dur;
    for (let i = 1; i <= 4; i++) {
      ctx.globalAlpha = 0.13 * (1 - i / 5);
      ctx.fillStyle = '#cfd6e6';
      ctx.beginPath(); ctx.arc(-p.dodge.dir.x * i * 10, -p.dodge.dir.y * i * 10, r * (1 - i * 0.07), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.rotate(roll * Math.PI * 4);
    ctx.scale(0.92, 0.86);
  }

  // visceral lunge — a quick forward dash into the grab, then settle back
  if (p.visceraling) {
    const vp = clamp(p.visceraling.t / p.visceraling.dur, 0, 1);
    const lunge = vp < 0.3 ? easeOut(vp / 0.3) * 7 : 7 * (1 - easeOut((vp - 0.3) / 0.7));
    ctx.translate(Math.cos(p.facing) * lunge, Math.sin(p.facing) * lunge);
  }

  // stagger — dazed wobble + slump
  if (staggered) {
    ctx.rotate(Math.sin(t * 22) * 0.09);
    ctx.translate(0, 2.5);
  }

  // motion state
  const k = game.keys;
  const moving = !p.dodge && !p.visceraling && p.staggered <= 0 &&
    (k['w'] || k['a'] || k['s'] || k['d'] || k['arrowup'] || k['arrowdown'] || k['arrowleft'] || k['arrowright']);
  const step = moving ? Math.sin(t * 9) : 0;
  const bob = p.dodge ? 0 : (p.visceraling ? 0 : (moving ? Math.abs(Math.sin(t * 9)) * 1.1 : Math.sin(t * 1.8) * 0.7));
  ctx.translate(0, -bob);

  const o = getOutfit(p.outfit);
  CURRENT_SKIN = getSkin(p.skin);
  const P = o.palette || {};
  const COAT_P = P.coat || COAT, COAT_SHADE_P = P.coatShade || COAT_SHADE;
  const VEST_P = P.vest || VEST, SHIRT_P = P.shirt || SHIRT, COAT_LINING_P = P.coatLining || COAT_LINING;
  const HAT_P = P.hat || HAT, HAT_BRIM_P = P.hatBrim || HAT_BRIM;
  const ACCENT = o.accent || BUCKLE;
  const coatCol = hurt ? '#7a2a2a' : COAT_P;
  const coatShade = hurt ? '#5a1a1a' : COAT_SHADE_P;
  const vestCol = staggered ? '#9aa0ff' : VEST_P;

  // heavy boots with walk swing
  const swing = step * 3.2;
  ctx.fillStyle = BOOT;
  ctx.fillRect(-4.5 - swing * 0.5, r * 0.45, 4.5, 9);
  ctx.fillRect(-5 - swing * 0.5, r * 0.45 + 7, 7, 3.4);
  ctx.fillRect(0 + swing * 0.5, r * 0.45, 4.5, 9);
  ctx.fillRect(-2 + swing * 0.5, r * 0.45 + 7, 7, 3.4);

  // long tattered coat
  ctx.save();
  ctx.rotate(moving ? Math.sin(t * 9) * 0.05 : Math.sin(t * 1.8) * 0.03);
  ctx.fillStyle = coatShade;
  ctx.beginPath();
  ctx.moveTo(-r * 1.05, -r * 0.15);
  ctx.quadraticCurveTo(-r * 1.28, r * 0.85, -r * 0.85, r * 1.45);
  const hem = 7;
  for (let i = 0; i < hem; i++) {
    const f = i / (hem - 1);
    const hx = -r * 0.85 + f * r * 1.7;
    const hy = r * 1.45 + (i % 2 ? -3.5 : 4) + Math.sin(t * 2 + i) * 0.6;
    ctx.lineTo(hx, hy);
  }
  ctx.quadraticCurveTo(r * 1.28, r * 0.85, r * 1.05, -r * 0.15);
  ctx.closePath(); ctx.fill();
  // tattered lining peeking through the hem
  ctx.fillStyle = COAT_LINING_P;
  for (let i = 0; i < hem - 1; i++) {
    const f = (i + 0.5) / (hem - 1);
    const hx = -r * 0.85 + f * r * 1.7;
    ctx.fillRect(hx - 1.1, r * 1.25, 2.2, 4.5);
  }
  ctx.fillStyle = coatCol;
  ctx.beginPath(); ctx.ellipse(0, r * 0.08, r * 1.05, r * 1.0, 0, 0, TAU); ctx.fill();
  ctx.restore();

  // layered vest + shirt (open coat front)
  ctx.fillStyle = vestCol;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.2); ctx.lineTo(r * 0.5, -r * 0.2);
  ctx.lineTo(r * 0.38, r * 0.7); ctx.lineTo(-r * 0.38, r * 0.7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = SHIRT_P;
  ctx.fillRect(-r * 0.13, -r * 0.2, r * 0.26, r * 0.92);

  // belt, buckle, pouch
  ctx.fillStyle = BELT; ctx.fillRect(-r * 0.92, r * 0.33, r * 1.84, 3);
  ctx.fillStyle = ACCENT; ctx.fillRect(-2.2, r * 0.31, 4.4, 5);
  ctx.fillStyle = BELT; ctx.fillRect(r * 0.56, r * 0.4, 4, 5.5);
  // holstered pistol — visible at the hip when not drawn/firing
  if (!(p.firing > 0)) {
    ctx.save(); ctx.translate(-r * 0.62, r * 0.36); ctx.rotate(-0.3);
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, -3, 11, 6);
    ctx.fillStyle = '#1a1410'; ctx.fillRect(2, -2.5, 3.5, 5);
    ctx.restore();
  }

  // high collar / scarf
  ctx.fillStyle = coatCol;
  ctx.beginPath(); ctx.ellipse(0, -r * 0.34, r * 0.55, r * 0.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2626';
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.42); ctx.quadraticCurveTo(0, -r * 0.05, r * 0.42, -r * 0.42);
  ctx.lineTo(r * 0.42, -r * 0.28); ctx.quadraticCurveTo(0, r * 0.02, -r * 0.42, -r * 0.28); ctx.closePath(); ctx.fill();
  ctx.fillRect(r * 0.18, -r * 0.28, 3, 9);

  // head: shadowed beneath the brim, only faint eyes visible (or a beak mask)
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.4, 0, TAU); ctx.fill();
  if (o.mask === 'beak') {
    ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.42, r * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1c12'; ctx.beginPath(); ctx.moveTo(-r * 0.13, -r * 0.42); ctx.lineTo(r * 0.13, -r * 0.42); ctx.lineTo(0, -r * 0.10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d4a040'; ctx.beginPath(); ctx.arc(-r * 0.16, -r * 0.56, 1.4, 0, TAU); ctx.arc(r * 0.16, -r * 0.56, 1.4, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(10,8,12,0.72)';
    ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(200,170,90,${0.45 + Math.sin(t * 4) * 0.2})`;
    ctx.beginPath(); ctx.arc(-r * 0.13, -r * 0.52, 1, 0, TAU); ctx.arc(r * 0.13, -r * 0.52, 1, 0, TAU); ctx.fill();
  }

  // hat + weapon: oriented to facing
  ctx.save();
  ctx.rotate(p.facing);
  ctx.fillStyle = HAT_BRIM_P;
  ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.62, r * 1.0, r * 0.46, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = HAT_P;
  ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.8, r * 0.5, r * 0.34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a1a'; ctx.fillRect(-r * 0.46, -r * 0.72, r * 1.0, 2);
  drawWeapon(ctx, p, r, t);
  ctx.restore();

  if (staggered) {
    // dazed motes circling above the hat
    ctx.fillStyle = `rgba(200,200,255,${0.6 + Math.sin(t * 8) * 0.3})`;
    for (let i = 0; i < 3; i++) { const a = t * 3 + i * (TAU / 3); ctx.beginPath(); ctx.arc(Math.cos(a) * 12, -r * 1.5 + Math.sin(a) * 4, 2, 0, TAU); ctx.fill(); }
  }
  ctx.restore();

  // lock-on reticle
  if (p.locked && p.locked.alive) {
    const tg = p.locked;
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r + 8 + Math.sin(t * 6) * 2, 0, TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + t;
      ctx.beginPath();
      ctx.moveTo(tg.x + Math.cos(a) * (tg.r + 12), tg.y + Math.sin(a) * (tg.r + 12));
      ctx.lineTo(tg.x + Math.cos(a) * (tg.r + 18), tg.y + Math.sin(a) * (tg.r + 18));
      ctx.stroke();
    }
  }
}

function drawWeapon(ctx, p, r, t) {
  const s = p.swing;
  const sword = p.mode === 'sword';
  const handleX = r * 0.55;
  const SK = CURRENT_SKIN || {};

  // off-hand pistol — drawn and firing with a muzzle flash (else it stays holstered)
  if (p.firing > 0) {
    ctx.save();
    ctx.rotate(-0.7); ctx.translate(r * 0.2, -r * 0.45);
    ctx.fillStyle = '#2a2218'; ctx.fillRect(0, -1.5, 12, 3);
    ctx.fillStyle = '#1a1410'; ctx.fillRect(-3, -2.5, 4, 5);
    const fa = clamp(p.firing / 0.25, 0, 1);
    ctx.fillStyle = `rgba(255,220,120,${0.7 * fa})`; ctx.beginPath(); ctx.arc(13, 0, 4 * fa + 1, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,180,80,${0.4 * fa})`; ctx.beginPath(); ctx.arc(15, 0, 6 * fa + 1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // gloved hand on the grip
  ctx.fillStyle = GLOVE;
  ctx.beginPath(); ctx.arc(handleX - 1, 0, 3.2, 0, TAU); ctx.fill();
  // wrapped grip
  ctx.strokeStyle = SK.handle || '#5a4a3a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(handleX, 0); ctx.stroke();
  // pommel
  ctx.fillStyle = SK.pommel || BUCKLE; ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
  // crossguard
  ctx.strokeStyle = SK.steelDark || STEEL_DARK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(handleX - 1, -3.2); ctx.lineTo(handleX - 1, 3.2); ctx.stroke();

  // ---- Visceral finishing strike: wind back, brutal chop, recover ----
  if (p.visceraling) {
    const v = p.visceraling;
    const vp = clamp(v.t / v.dur, 0, 1);
    let rot, len = sword ? 42 : 56;
    if (vp < 0.25) {            // cock the cleaver back for the kill
      const k = easeOut(vp / 0.25);
      rot = lerp(0.2, -1.5, k);
      len += k * 6;
    } else if (vp < 0.55) {     // the strike — a fast downward chop
      const k = easeOut((vp - 0.25) / 0.30);
      rot = lerp(-1.5, 1.15, k);
      len += 6;
    } else {                    // ease back to guard
      const k = easeOut((vp - 0.55) / 0.45);
      rot = lerp(1.15, 0.2, k);
    }
    ctx.rotate(rot);
    drawCleaver(ctx, handleX, len, sword, true);
    // gory trail through the chop
    if (vp >= 0.25 && vp < 0.66) {
      const ta = clamp((vp - 0.25) / 0.41, 0, 1);
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255,170,150,${0.55 * (1 - ta)})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, r + len * 0.7, rot - 1.2, rot); ctx.stroke();
      ctx.strokeStyle = `rgba(200,50,30,${0.45 * (1 - ta)})`;
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(0, 0, r + len * 0.7, rot - 1.0, rot); ctx.stroke();
    }
    return;
  }

  // charging a heavy blow: blade cocked back, building light
  if (p.charging && !s) {
    const c = clamp(p.chargeTime / 0.55, 0, 1);
    ctx.rotate(-0.55 - c * 0.35);
    const len = sword ? 40 : 52;
    drawCleaver(ctx, handleX, len, sword, c >= 0.95);
    if (c >= 0.95) {
      ctx.fillStyle = `rgba(255,220,140,${0.45 + Math.sin(t * 10) * 0.2})`;
      ctx.beginPath(); ctx.arc(handleX + len * 0.5, 0, 6, 0, TAU); ctx.fill();
    }
    return;
  }

  if (!s) {
    drawCleaver(ctx, handleX, sword ? 30 : 46, sword, false);
    return;
  }

  const prog = clamp(s.t / s.dur, 0, 1);
  const eased = easeOut(prog);                 // snappy launch, weighted settle
  const dir = s.dir || 1;                       // combos alternate direction
  const startA = -s.arc / 2 * dir;
  const endA = s.arc / 2 * dir;
  ctx.rotate(lerp(startA, endA, eased));
  const len = sword ? 40 : (s.type === 'transform' ? 56 : 58) + (s.charged ? 8 : 0);
  drawCleaver(ctx, handleX, len, sword, s.charged);

  // tapered motion trail that fades through the swing
  const trailA = 0.42 * (1 - prog);
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(210,225,255,${trailA})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, r + len * 0.7, startA, endA); ctx.stroke();
  if (s.charged || s.type === 'heavy') {
    ctx.strokeStyle = `rgba(255,220,150,${0.45 * (1 - prog)})`;
    ctx.lineWidth = 4 + (s.charged ? 2 : 0);
    ctx.beginPath(); ctx.arc(0, 0, r + len * 0.7, startA, endA); ctx.stroke();
    // bright leading edge chasing the blade tip
    const lead = lerp(startA, endA, eased);
    ctx.strokeStyle = `rgba(255,244,210,${0.5 * (1 - prog)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r + len * 0.72, lead - 0.32, lead + 0.05); ctx.stroke();
  }
}

// Saw Cleaver: folded = chunky cleaver, extended = long saw spear. Colors follow
// the equipped weapon skin (CURRENT_SKIN), set in drawPlayer.
function drawCleaver(ctx, x0, len, folded, charged) {
  const h = folded ? 11 : 8;
  const SK = CURRENT_SKIN || {};
  const steel = charged ? '#ffe6a8' : (SK.steel || STEEL);
  const steelDark = SK.steelDark || STEEL_DARK;
  const serrate = charged ? '#ffd27a' : (SK.serrate || SERRATE);
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(x0, -h * 0.5);
  ctx.lineTo(x0 + len - 4, -h * 0.5);
  ctx.lineTo(x0 + len, 0);
  ctx.lineTo(x0 + len - 4, h * 0.5);
  ctx.lineTo(x0, h * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = steelDark; ctx.lineWidth = 1.5; ctx.stroke();
  // fuller groove
  ctx.strokeStyle = 'rgba(120,130,150,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 2, -h * 0.18); ctx.lineTo(x0 + len - 6, -h * 0.18); ctx.stroke();
  // serrated teeth on the cutting edge
  ctx.fillStyle = serrate;
  const teeth = Math.max(4, Math.floor(len / (folded ? 4.5 : 5.5)));
  const tw = len / teeth;
  for (let i = 0; i < teeth; i++) {
    const tx = x0 + i * tw;
    ctx.beginPath();
    ctx.moveTo(tx, h * 0.5);
    ctx.lineTo(tx + tw, h * 0.5);
    ctx.lineTo(tx + tw * 0.5, h * 0.5 + 4);
    ctx.closePath(); ctx.fill();
  }
  // blood / wear tint from the skin
  ctx.fillStyle = SK.blood || 'rgba(120,20,20,0.5)';
  ctx.fillRect(x0 + len * 0.25, -h * 0.5 + 2, len * 0.45, 2);
  if (SK.effect === 'glow') {
    ctx.strokeStyle = 'rgba(160,120,220,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, -h * 0.5); ctx.lineTo(x0 + len - 4, -h * 0.5); ctx.stroke();
  } else if (SK.effect === 'blood') {
    ctx.fillStyle = 'rgba(160,16,16,0.6)';
    ctx.fillRect(x0 + len * 0.5, -h * 0.5, len * 0.3, h);
  } else if (SK.effect === 'rust') {
    ctx.fillStyle = 'rgba(70,50,30,0.4)';
    ctx.fillRect(x0 + len * 0.15, -h * 0.5 + 4, len * 0.25, 2);
    ctx.fillRect(x0 + len * 0.6, h * 0.5 - 5, len * 0.2, 2);
  }
}