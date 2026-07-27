// Objectives.js — the single "next required major objective" system.
// Drives both the in-world guiding beam and the world-map marker so the player
// is pointed at exactly one goal at a time: the next story step or the next
// Guardian to slay. Optional bosses, NPC quests and exploration are left
// unmarked on purpose — the player finds those by exploring.

import { GATE } from './FinalRegion.js';

// The six required Guardians of the Hollow Quarter. This single list is the
// source of truth shared with Endgame (the sealed-gate requirement) and the
// Hunter's Journal (BossProgress), so the in-world guidance, the gate, and the
// journal always agree on what "all Guardians slain" means — and the final
// area is never directed to before every required Guardian has fallen.
// Secret bosses (Hollow Castellan, Cliff Watcher, Pale Wraith, …) are optional
// and are deliberately NOT tracked here.
export const REQUIRED_GUARDIANS = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist'];

export const BOSS_POS = {
  vicar: { x: 2450, y: 1260, name: 'The Drowned Vicar', icon: '💧', region: 'Cathedral of Floods' },
  gascoigne: { x: 3660, y: 1260, name: 'Father Lucian Veyr', icon: '🔥', region: 'The Burning Graveyard' },
  nightmare: { x: 4800, y: 1280, name: 'The Nightmare', icon: '🌙', region: 'The Nightmare' },
  mire: { x: 3380, y: 3340, name: 'The Mire Mother', icon: '🌊', region: 'The Sunken Cathedral' },
  hollow_king: { x: 4520, y: 3850, name: 'The Hollow King', icon: '👑', region: 'The Overlook Cathedral' },
  archivist: { x: 1800, y: 6100, name: 'The Archivist', icon: '📖', region: 'The Grand Ancient Library' },
};

export function getNextObjective(game) {
  const elias = game.npcs && game.npcs.find(n => n.def.mentor);
  // The Hunt has not yet begun: rest at the hub lantern to be borne out into it.
  if (elias && elias.stage === 0) {
    const h = game.hubInfo;
    return { x: h.lantern.x, y: h.lantern.y, name: "The Hunter's Nightmare", kind: 'travel', label: 'Rest at the lantern to begin the Hunt' };
  }
  // The Long Hunt: the first Guardian not yet slain, in the intended order.
  for (const id of REQUIRED_GUARDIANS) {
    if (!game.defeatedBosses.has(id)) {
      const b = BOSS_POS[id];
      return { x: b.x, y: b.y, name: b.name, kind: 'boss', bossId: id, label: 'Slay ' + b.name };
    }
  }
  // Every Guardian lies still: the way to the kingdom's heart.
  return { x: GATE.x, y: GATE.y, name: 'The Drowned Sanctum', kind: 'final', label: 'Enter the Drowned Sanctum' };
}

// In-world beacon. A tall golden beam when the objective is on screen, or an
// edge chevron pointing toward it when it lies beyond view. Drawn in screen
// space (after lighting) so it stays visible through darkness and fog.
export function drawObjectiveBeam(game, ctx) {
  if (game.state !== 'playing') return;
  const obj = getNextObjective(game);
  if (!obj) return;
  const t = game.runtime;
  const sx = obj.x - game.camera.x;
  const sy = obj.y - game.camera.y;
  const vw = game.viewW, vh = game.viewH;
  const onScreen = sx > -40 && sx < vw + 40 && sy > -250 && sy < vh + 40;
  const pulse = 0.6 + Math.sin(t * 2) * 0.25;

  if (onScreen) {
    const g = ctx.createLinearGradient(sx, sy - 240, sx, sy + 8);
    g.addColorStop(0, 'rgba(255,210,120,0)');
    g.addColorStop(0.5, `rgba(255,200,110,${0.22 * pulse})`);
    g.addColorStop(1, 'rgba(255,180,80,0.04)');
    ctx.fillStyle = g; ctx.fillRect(sx - 9, sy - 240, 18, 248);
    const gg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 46);
    gg.addColorStop(0, `rgba(255,205,110,${0.5 * pulse})`); gg.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(sx, sy, 46, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const e = (t * 0.5 + i * 0.33) % 1;
      ctx.globalAlpha = (1 - e) * 0.6; ctx.fillStyle = '#ffce6b';
      ctx.beginPath(); ctx.arc(sx + Math.sin(t * 2 + i) * 5, sy - e * 70, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff4d0'; ctx.strokeStyle = '#9a6a20'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx, sy - 7); ctx.lineTo(sx + 5, sy); ctx.lineTo(sx, sy + 7); ctx.lineTo(sx - 5, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    const cx = vw / 2, cy = vh / 2;
    const dx = sx - cx, dy = sy - cy;
    const ang = Math.atan2(dy, dx);
    const margin = 56;
    const halfW = vw / 2 - margin, halfH = vh / 2 - margin;
    const tt = Math.min(halfW / (Math.abs(dx) || 0.001), halfH / (Math.abs(dy) || 0.001));
    const ex = cx + dx * tt, ey = cy + dy * tt;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
    ctx.strokeStyle = `rgba(255,205,110,${0.5 + pulse * 0.3})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,205,110,0.9)';
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}