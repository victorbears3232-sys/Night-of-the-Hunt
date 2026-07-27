// EnemyRender.js — per-type enemy figure rendering, extracted from HuntGame to
// keep the engine file lean. Each function draws one enemy silhouette in the
// facing-rotated, translated context the caller has already prepared. Pure
// draws; only reads game.runtime for animation.

import * as EnemySys from './EnemySystem.js';

const TAU = Math.PI * 2;

export function drawEnemyFigure(game, ctx, e, staggered) {
  let body = e.color;
  if (e.hitFlash > 0) body = '#fff';
  if (staggered) body = '#9aa0ff';
  if (EnemySys.drawEnemyFigure(game, ctx, e, staggered)) return;
  const r = e.r;
  switch (e.type) {
    case 'hound': drawHound(game, ctx, r, body, staggered); break;
    case 'priest': drawPriest(game, ctx, r, body, staggered); break;
    case 'knight': drawKnight(game, ctx, r, body, staggered); break;
    case 'crawler': drawCrawler(game, ctx, r, body, staggered); break;
    case 'watcher': drawWatcher(game, ctx, r, body, staggered); break;
    case 'brute': drawBrute(game, ctx, r, body, staggered); break;
    default: drawBeastfolk(game, ctx, r, body, staggered); break;
  }
}

function drawBeastfolk(game, ctx, r, body, staggered) {
  const t = game.runtime; const sway = Math.sin(t * 2) * 1.2;
  ctx.save(); ctx.translate(0, sway);
  ctx.fillStyle = staggered ? '#9aa0ff' : '#241e18';
  ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 1.2, r * 1.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#180f0a';
  ctx.beginPath(); ctx.moveTo(-r * 1.1, r * 0.9);
  for (let i = 0; i <= 6; i++) { const x = -r * 1.1 + (i / 6) * r * 2.2; ctx.lineTo(x, r * 1.0 + (i % 2 ? r * 0.5 : r * 0.2)); }
  ctx.lineTo(r * 1.1, r * 0.9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 1.1, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.3); ctx.lineTo(r * 0.7, r * 0.3); ctx.stroke();
  ctx.fillStyle = '#8a7050'; ctx.fillRect(-2, r * 0.28, 4, 4);
  ctx.fillStyle = staggered ? '#9aa0ff' : '#1a140e';
  ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.3, r * 0.62, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#3a3028';
  ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.5, r * 0.55, Math.PI, TAU); ctx.fill();
  const eg = 0.5 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(220,160,40,${eg})`;
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.32, 1.6, 0, TAU); ctx.arc(r * 0.42, -r * 0.3, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#2a2620';
  ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.2); ctx.lineTo(r * 0.95, -r * 0.05); ctx.lineTo(r * 0.5, r * 0.15); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.7); ctx.lineTo(-r * 0.3, -r * 1.05); ctx.lineTo(r * 0.15, -r * 0.72); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.3); ctx.lineTo(r * 1.35, -r * 0.1); ctx.stroke();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#7a8499'; ctx.beginPath(); ctx.moveTo(r * 1.05, -r * 0.25); ctx.lineTo(r * 1.4, -r * 0.05); ctx.lineTo(r * 1.0, r * 0.1); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHound(game, ctx, r, body, staggered) {
  const t = game.runtime; const l = Math.sin(t * 8) * r * 0.08;
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 1.35, r * 0.78, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#1a100c'; ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.7, i * r * 0.3); ctx.lineTo(r * 0.4, i * r * 0.3 + 2); ctx.stroke(); }
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#2a1a14'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.1, r * 0.4 + i * 4, -0.6, 0.6); ctx.stroke(); }
  ctx.strokeStyle = body; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.6); ctx.lineTo(-r * 0.9 + l, -r * 1.15);
  ctx.moveTo(r * 0.3, -r * 0.6); ctx.lineTo(r * 0.4 - l, -r * 1.15);
  ctx.moveTo(-r * 0.8, r * 0.6); ctx.lineTo(-r * 0.9 - l, r * 1.15);
  ctx.moveTo(r * 0.3, r * 0.6); ctx.lineTo(r * 0.4 + l, r * 1.15);
  ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.55, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 1.2, -r * 0.25); ctx.lineTo(r * 1.75, 0); ctx.lineTo(r * 1.2, r * 0.25); ctx.closePath(); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#1a0606'; ctx.beginPath(); ctx.ellipse(r * 1.4, r * 0.12, r * 0.12, r * 0.08, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#2a1812';
  ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.5); ctx.lineTo(r * 0.5, -r * 1.05); ctx.lineTo(r * 1.0, -r * 0.55); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.9, r * 0.35); ctx.lineTo(r * 0.65, r * 0.95); ctx.lineTo(r * 1.1, r * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r * 0.85, 0, r * 0.5, -0.8, 0.8); ctx.stroke();
  ctx.fillStyle = '#8a8a94'; for (let i = -1; i <= 1; i++) { const ca = i * 0.5; ctx.beginPath(); ctx.moveTo(r * 0.85 + Math.cos(ca) * r * 0.5, Math.sin(ca) * r * 0.5); ctx.lineTo(r * 0.85 + Math.cos(ca) * r * 0.64, Math.sin(ca) * r * 0.64 - 2); ctx.lineTo(r * 0.85 + Math.cos(ca) * r * 0.5 + 2, Math.sin(ca) * r * 0.5); ctx.closePath(); ctx.fill(); }
  const eg = 0.6 + Math.sin(t * 6) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(228,64,14,${eg})`; ctx.beginPath(); ctx.arc(r * 1.0, -r * 0.15, 1.8, 0, TAU); ctx.fill();
}

function drawPriest(game, ctx, r, body, staggered) {
  const t = game.runtime; const sway = Math.sin(t * 1.5) * 1.4;
  ctx.save(); ctx.translate(0, sway);
  ctx.fillStyle = staggered ? '#9aa0ff' : '#241c14';
  ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(r * 1.0, r * 1.1); ctx.lineTo(-r * 1.0, r * 1.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.85, r * 1.05); ctx.lineTo(-r * 0.85, r * 1.05); ctx.closePath(); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#15100a';
  ctx.beginPath(); ctx.moveTo(-r, r * 1.0);
  for (let i = 0; i <= 6; i++) { const x = -r + (i / 6) * r * 2; ctx.lineTo(x, r * 1.05 + (i % 2 ? r * 0.35 : r * 0.12)); }
  ctx.lineTo(r, r * 1.0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#c9a86a'; ctx.fillRect(-1.5, -r * 0.1, 3, r * 0.5); ctx.fillRect(-r * 0.18, -r * 0.05, r * 0.36, 3);
  ctx.fillStyle = staggered ? '#9aa0ff' : '#1c1814'; ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#3a3028'; ctx.beginPath(); ctx.arc(0, -r * 0.45, r * 0.55, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#0a0604'; ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r * 0.32, r * 0.4, 0, 0, TAU); ctx.fill();
  const eg = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(255,184,74,${eg})`;
  ctx.beginPath(); ctx.arc(-r * 0.13, -r * 0.28, 1.8, 0, TAU); ctx.arc(r * 0.13, -r * 0.28, 1.8, 0, TAU); ctx.fill();
  const sw = Math.sin(t * 2) * r * 0.15;
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 1.0); ctx.lineTo(r * 0.55 + sw, r * 0.5); ctx.stroke();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#5a4a2a'; ctx.beginPath(); ctx.arc(r * 0.55 + sw, r * 0.6, r * 0.16, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = `rgba(196,122,58,${0.3 + eg * 0.3})`; ctx.beginPath(); ctx.ellipse(r * 0.55 + sw, r * 0.42, r * 0.1, r * 0.25, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawKnight(game, ctx, r, body, staggered) {
  const t = game.runtime;
  ctx.fillStyle = staggered ? '#9aa0ff' : '#3a3e4a';
  ctx.beginPath(); ctx.ellipse(-r * 0.25, 0, r * 0.5, r * 0.9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#6a7280'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#8a7050'; ctx.beginPath(); ctx.arc(-r * 0.25, 0, r * 0.14, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#5a606a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.25, -r * 0.7); ctx.lineTo(-r * 0.25, r * 0.7); ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(r * 0.15, r * 0.05, r * 0.95, r * 1.15, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#2a2d38'; ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(r * 0.15 + i * r * 0.3, -r * 0.3); ctx.lineTo(r * 0.15 + i * r * 0.3, r * 0.7); ctx.stroke(); }
  ctx.fillStyle = staggered ? '#9aa0ff' : '#5a1a1a';
  ctx.beginPath(); ctx.moveTo(r * 0.15 - r * 0.35, -r * 0.1); ctx.lineTo(r * 0.15 + r * 0.35, -r * 0.1); ctx.lineTo(r * 0.15 + r * 0.2, r * 0.9); ctx.lineTo(r * 0.15, r * 0.7); ctx.lineTo(r * 0.15 - r * 0.2, r * 0.9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(-r * 0.55, -r * 0.45, r * 0.3, r * 0.35, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#4a4e5a'; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.35, r * 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0a10'; ctx.fillRect(r * 0.3, -r * 0.4, r * 0.5, 3);
  const eg = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(220,60,60,${eg})`; ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.385, 1.8, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#8a3a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.8); ctx.lineTo(r * 0.3, -r * 1.35 + Math.sin(t * 3) * 2); ctx.stroke();
  ctx.strokeStyle = '#7a6a5a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.6, r * 0.2); ctx.lineTo(r * 1.7, -r * 0.15); ctx.stroke();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#aab4c8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(r * 0.75, r * 0.12); ctx.lineTo(r * 1.7, -r * 0.15); ctx.stroke();
  ctx.strokeStyle = '#d4a040'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(r * 0.45, 0); ctx.lineTo(r * 0.75, r * 0.35); ctx.stroke();
}

function drawCrawler(game, ctx, r, body, staggered) {
  const t = game.runtime; const wig = Math.sin(t * 10) * 0.1;
  ctx.strokeStyle = body; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + wig;
    const bx = Math.cos(a) * r * 0.6, by = Math.sin(a) * r * 0.6;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(Math.cos(a + 0.2) * r * 1.5, Math.sin(a + 0.2) * r * 1.5); ctx.stroke();
  }
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#1a1410'; ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.4, -r * 0.7); ctx.lineTo(i * r * 0.4, r * 0.7); ctx.stroke(); }
  ctx.fillStyle = staggered ? '#9aa0ff' : '#3a3328'; ctx.beginPath(); ctx.arc(r * 0.7, 0, r * 0.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#d8d0c0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 1.05, -r * 0.2); ctx.lineTo(r * 1.5, -r * 0.4); ctx.moveTo(r * 1.05, r * 0.2); ctx.lineTo(r * 1.5, r * 0.4); ctx.stroke();
  const eg = 0.6 + Math.sin(t * 7) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(220,40,40,${eg})`;
  ctx.beginPath(); ctx.arc(r * 0.8, -r * 0.15, 1.6, 0, TAU); ctx.arc(r * 0.95, 0, 1.6, 0, TAU); ctx.arc(r * 0.8, r * 0.15, 1.6, 0, TAU); ctx.fill();
}

function drawWatcher(game, ctx, r, body, staggered) {
  const t = game.runtime;
  ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3 + Math.sin(t * 1.5 + i) * 0.2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7);
    ctx.stroke();
    ctx.fillStyle = staggered ? '#9aa0ff' : '#5acfd6'; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7, 2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, TAU); ctx.fill();
  const cg = 0.5 + Math.sin(t * 3) * 0.5;
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.2);
  g.addColorStop(0, staggered ? 'rgba(154,160,255,0.6)' : `rgba(90,207,214,${0.4 * cg})`); g.addColorStop(1, 'rgba(90,207,214,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#d8f4f8'; ctx.beginPath(); ctx.ellipse(r * 0.25, 0, r * 0.5, r * 0.36, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#0a1a1c'; ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#fff' : `rgba(180,240,250,${cg})`; ctx.beginPath(); ctx.arc(r * 0.38, -r * 0.05, r * 0.06, 0, TAU); ctx.fill();
}

function drawBrute(game, ctx, r, body, staggered) {
  const t = game.runtime;
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 1.2, r * 1.15, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#1a1008'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.2, r * 0.4); ctx.moveTo(r * 0.1, -r * 0.4); ctx.lineTo(r * 0.4, r * 0.2); ctx.stroke();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.2); ctx.lineTo(r * 0.7, r * 0.3); ctx.moveTo(-r * 0.7, r * 0.2); ctx.lineTo(r * 0.9, -r * 0.1); ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(-r * 0.8, -r * 0.3, r * 0.45, r * 0.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#2a2018'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.4, r * 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#1a0a06'; ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.15, r * 0.3, r * 0.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.05); ctx.lineTo(r * 0.8, r * 0.15); ctx.lineTo(r * 0.6, r * 0.05); ctx.closePath(); ctx.fill();
  const eg = 0.6 + Math.sin(t * 5) * 0.4;
  ctx.fillStyle = staggered ? '#fff' : `rgba(228,64,0,${eg})`; ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.45, 2.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = staggered ? '#9aa0ff' : '#1a0a06'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.6); ctx.lineTo(r * 0.25, -r * 0.3); ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.4); ctx.lineTo(r * 1.6, -r * 0.6); ctx.stroke();
  ctx.fillStyle = staggered ? '#9aa0ff' : '#7a8499'; ctx.beginPath(); ctx.moveTo(r * 1.3, -r * 0.95); ctx.lineTo(r * 1.7, -r * 0.3); ctx.lineTo(r * 1.35, -r * 0.2); ctx.lineTo(r * 1.0, -r * 0.8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 1.5; ctx.stroke();
}