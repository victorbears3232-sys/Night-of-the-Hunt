// Indicators.js — atmospheric visibility layer for interactive objects.
// World-space, drawn inside the game's world translate. Additive only: adds
// soft glows, floating particles, and small rune icons so interactive objects
// read clearly in the dark without a modern UI overlay. Does not redraw the
// base objects (those are handled by their own draw routines).

import { npcStagePos, questItemActive } from './NpcSystem.js';

const TAU = Math.PI * 2;

function withAlpha(hex, a) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return `rgba(200,180,120,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function drawIndicators(game, ctx) {
  const t = game.runtime;
  const p = game.player;
  if (!game.world) return;

  // ---- Lanterns / checkpoints: strong warm glow + rising embers ----
  for (const l of game.world.lanterns) {
    if (l.rest) label(ctx, l.x, l.y - 64, 'LANTERN', 'rgba(255,210,130,0.92)');
    const lx = l.x, ly = l.y - (l.rest ? 46 : 8);
    const r = l.rest ? 64 : 42;
    const pulse = 0.7 + Math.sin(t * 3 + l.x) * 0.3;
    const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, r);
    g.addColorStop(0, `rgba(255,200,110,${0.5 * pulse})`);
    g.addColorStop(0.6, `rgba(255,180,90,${0.18 * pulse})`);
    g.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, r, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const e = (t * 0.5 + i * 0.33 + l.x * 0.01) % 1;
      const ex = lx + Math.sin(t * 2 + i) * 6;
      const ey = ly - e * 30;
      ctx.globalAlpha = (1 - e) * 0.6;
      ctx.fillStyle = '#ffce6b';
      ctx.beginPath(); ctx.arc(ex, ey, 1.6, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (l.rest) {
      ctx.strokeStyle = `rgba(255,210,130,${0.75 * pulse})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(lx, ly - 30, 5, 0, TAU);
      ctx.moveTo(lx - 7, ly - 30); ctx.lineTo(lx + 7, ly - 30); ctx.stroke();
    }
  }

  // ---- Map fragments: unique violet glow + rising particles + marker ----
  for (const f of (game.fragments || [])) {
    if (f.collected) continue;
    const pulse = 0.6 + Math.sin(t * 2 + f.x) * 0.4;
    const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 40);
    g.addColorStop(0, `rgba(180,150,240,${0.5 * pulse})`);
    g.addColorStop(1, 'rgba(180,150,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 40, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const e = (t * 0.4 + i * 0.25 + f.x * 0.01) % 1;
      const ex = f.x + Math.sin(t * 1.5 + i * 2) * 5;
      const ey = f.y - e * 26;
      ctx.globalAlpha = (1 - e) * 0.7; ctx.fillStyle = '#c8b0ff';
      ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // scroll rune marker
    ctx.strokeStyle = `rgba(200,180,250,${0.7 * pulse})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(f.x, f.y - 26, 4, 0, TAU); ctx.stroke();
    label(ctx, f.x, f.y - 40, 'MAP', 'rgba(200,180,250,0.9)');
  }

  // ---- Relics / quest items / upgrade materials ----
  for (const r of (game.relics || [])) {
    if (r.collected) continue;
    // A quest item only becomes visible (glow + marker + label) once its NPC
    // quest has been accepted — before that there is no pickup icon, no prompt,
    // no glow, and no marker at the location, matching drawRelics' guard.
    if (r.questItem && !questItemActive(game, r.id)) continue;
    const pulse = 0.6 + Math.sin(t * 3 + r.x) * 0.4;
    const col = r.color || '#d4b060';
    const g = ctx.createRadialGradient(r.x, r.y, 2, r.x, r.y, 30);
    g.addColorStop(0, withAlpha(col, 0.5 * pulse));
    g.addColorStop(1, withAlpha(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r.x, r.y, 30, 0, TAU); ctx.fill();
    ctx.strokeStyle = withAlpha(col, 0.85); ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y - 22); ctx.lineTo(r.x + 5, r.y - 17);
    ctx.lineTo(r.x, r.y - 12); ctx.lineTo(r.x - 5, r.y - 17); ctx.closePath(); ctx.stroke();
    label(ctx, r.x, r.y - 34, r.label || 'ITEM', withAlpha(col, 0.9));
  }

  // ---- Notes: faint parchment glow ----
  for (const n of game.world.notes) {
    const pulse = 0.4 + Math.sin(t * 2 + n.x) * 0.2;
    const g = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, 18);
    g.addColorStop(0, `rgba(220,200,150,${0.25 * pulse})`);
    g.addColorStop(1, 'rgba(220,200,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, TAU); ctx.fill();
    label(ctx, n.x, n.y - 22, n.title, 'rgba(230,210,160,0.9)');
  }

  // ---- Chests (unopened): amber/violet glow ----
  for (const c of game.world.chests) {
    if (c.opened) continue;
    const pulse = 0.5 + Math.sin(t * 2.5 + c.x) * 0.4;
    const accent = c.type === 'weapon' ? '#d4a040' : c.type === 'key' ? '#c9a86a' : c.type === 'fragment' ? '#caa238' : c.type === 'shards' ? '#a06ad6' : '#a06ad6';
    const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 28);
    g.addColorStop(0, withAlpha(accent, 0.42 * pulse));
    g.addColorStop(1, withAlpha(accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 28, 0, TAU); ctx.fill();
    label(ctx, c.x, c.y - 24, c.type === 'weapon' ? 'UPGRADE' : c.type === 'essence' ? 'ESSENCE' : c.type === 'vials' ? 'VIALS' : c.type === 'key' ? 'KEY' : c.type === 'fragment' ? 'MAP' : c.type === 'shards' ? 'SHARDS' : 'BULLETS', withAlpha(accent, 0.9));
  }

  // ---- NPCs: soft outline glow + marker above head; speech rune when near ----
  for (const n of (game.npcs || [])) {
    const st = n.def.stages[n.stage];
    if (!st || st.gone) continue;
    const { x, y } = npcStagePos(n);
    const near = p.nearNpc === n;
    const pulse = 0.5 + Math.sin(t * 2.5 + x) * 0.4;
    const col = n.def.color || '#8a7a5a';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 36);
    g.addColorStop(0, withAlpha(col, 0.32 * pulse));
    g.addColorStop(1, withAlpha(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 36, 0, TAU); ctx.fill();
    const iy = y - 36 - Math.sin(t * 3) * 2;
    ctx.globalAlpha = near ? 1 : 0.6;
    ctx.strokeStyle = withAlpha(col, 0.9); ctx.lineWidth = 1.5;
    if (near) {
      ctx.fillStyle = 'rgba(20,16,12,0.9)';
      ctx.beginPath(); ctx.arc(x, iy, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8d9a0'; ctx.font = '11px ui-serif, Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('…', x, iy + 1);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, iy - 5); ctx.lineTo(x + 4, iy); ctx.lineTo(x, iy + 5);
      ctx.lineTo(x - 4, iy); ctx.closePath(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    label(ctx, x, y - 56, n.def.name.toUpperCase(), withAlpha(col, 0.95));
  }
}

// Small floating label, drawn in the dark-fantasy sketch style (no modern UI).
function label(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 9px ui-serif, Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}