// MiniMap.jsx — a true miniature of the full world map (fog-of-war).
// Bottom-right HUD element. Renders the entire world fixed in a gothic ring:
// explored terrain tinted by region, the actual wall layout, roads, landmarks,
// region boundaries, discovered lanterns (distinct flame), boss marks, and the
// player's position + facing. Unexplored areas stay dark. Detail is filtered by
// the fog-of-war so the layout of undiscovered regions remains hidden.

import React, { useEffect, useRef } from 'react';
import { SECTOR, secKey, BOSSES, WORLD_W, WORLD_H, LANDMARKS, PATH, PATH_SOUTH, PATH_DEEP, PATH_LIBRARY } from '@/game/WorldMap';

const D = 180;
const TAU = Math.PI * 2;

export default function MiniMap({ game, mapState }) {
  const cvRef = useRef(null);
  const stateRef = useRef(mapState);
  stateRef.current = mapState;

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = D * dpr; cv.height = D * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const R = D / 2;
    const scale = (D - 10) / Math.hypot(WORLD_W, WORLD_H);
    const offX = R - (WORLD_W * scale) / 2;
    const offY = R - (WORLD_H * scale) / 2;
    const toM = (wx, wy) => ({ x: offX + wx * scale, y: offY + wy * scale });
    const nx = Math.ceil(WORLD_W / SECTOR), ny = Math.ceil(WORLD_H / SECTOR);
    const TRAILS = [PATH, PATH_SOUTH, PATH_DEEP, PATH_LIBRARY];

    let raf;
    const render = () => {
      const g = game.current;
      ctx.clearRect(0, 0, D, D);
      ctx.save();
      ctx.beginPath(); ctx.arc(R, R, R - 2, 0, TAU); ctx.clip();

      // dim parchment base
      const bg = ctx.createRadialGradient(R, R, 10, R, R, R);
      bg.addColorStop(0, '#2a2218'); bg.addColorStop(1, '#15100a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, D, D);

      const ms = stateRef.current;
      const revealed = new Set((ms && ms.revealed) || []);
      const regions = (ms && ms.regions) || [];
      const discovered = new Set((ms && ms.discoveredRegions) || []);
      const t = performance.now() / 1000;

      // explored terrain (region-tinted); unexplored stays dark
      for (let cx = 0; cx < nx; cx++) for (let cy = 0; cy < ny; cy++) {
        if (!revealed.has(cx + ',' + cy)) continue;
        const ccx = (cx + 0.5) * SECTOR, ccy = (cy + 0.5) * SECTOR;
        const r = regions.find(rr => ccx >= rr.x && ccx <= rr.x + rr.w && ccy >= rr.y && ccy <= rr.y + rr.h);
        const m = toM(cx * SECTOR, cy * SECTOR);
        ctx.fillStyle = r ? r.color : '#4a4438';
        ctx.globalAlpha = 0.55;
        ctx.fillRect(m.x, m.y, SECTOR * scale + 1, SECTOR * scale + 1);
      }
      ctx.globalAlpha = 1;

      // region boundaries (discovered only)
      ctx.strokeStyle = 'rgba(40,28,16,0.5)'; ctx.lineWidth = 1;
      for (const r of regions) {
        if (!discovered.has(r.id)) continue;
        const m = toM(r.x, r.y);
        ctx.strokeRect(m.x, m.y, r.w * scale, r.h * scale);
      }

      // roads / trails (revealed segments only)
      ctx.save(); ctx.strokeStyle = 'rgba(120,86,46,0.45)'; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
      for (const pts of TRAILS) {
        ctx.beginPath(); let started = false;
        for (let i = 0; i < pts.length; i++) {
          const [wx, wy] = pts[i];
          if (!revealed.has(secKey(wx, wy))) { started = false; continue; }
          const m = toM(wx, wy);
          if (!started) { ctx.moveTo(m.x, m.y); started = true; } else ctx.lineTo(m.x, m.y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();

      // the actual wall layout (only in explored ground)
      if (g && g.world) {
        for (const w of g.world.walls) {
          if (!revealed.has(secKey(w.x + w.w / 2, w.y + w.h / 2))) continue;
          const m = toM(w.x, w.y);
          if (w.gate) {
            const open = g.openGates && g.openGates.has(w.gate);
            ctx.strokeStyle = open ? 'rgba(120,200,120,0.75)' : 'rgba(200,70,50,0.85)';
            ctx.lineWidth = 1.3;
          } else if (w.parapet) {
            ctx.strokeStyle = 'rgba(160,130,86,0.55)'; ctx.lineWidth = 0.8;
          } else {
            ctx.strokeStyle = 'rgba(24,18,10,0.85)'; ctx.lineWidth = 0.9;
          }
          ctx.beginPath();
          if (w.w >= w.h) { const y = m.y + (w.h * scale) / 2; ctx.moveTo(m.x, y); ctx.lineTo(m.x + w.w * scale, y); }
          else { const x = m.x + (w.w * scale) / 2; ctx.moveTo(x, m.y); ctx.lineTo(x, m.y + w.h * scale); }
          ctx.stroke();
        }
      }

      // recognizable landmarks
      for (const lm of LANDMARKS) {
        if (!revealed.has(secKey(lm.x, lm.y))) continue;
        const m = toM(lm.x, lm.y);
        drawMiniLandmark(ctx, m.x, m.y, lm.type);
      }

      // discovered lanterns / checkpoints — distinct flame
      const visited = (ms && ms.lanterns) || [];
      for (const l of visited) {
        const m = toM(l.x, l.y);
        const gl = 0.7 + Math.sin(t * 4) * 0.3;
        ctx.fillStyle = `rgba(255,180,70,${0.32 * gl})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, 5.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f2b65a';
        ctx.beginPath(); ctx.moveTo(m.x, m.y - 3.4); ctx.quadraticCurveTo(m.x + 2.8, m.y, m.x, m.y + 2.2); ctx.quadraticCurveTo(m.x - 2.8, m.y, m.x, m.y - 3.4); ctx.fill();
        ctx.strokeStyle = 'rgba(90,50,16,0.85)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(m.x - 2.2, m.y + 2.2); ctx.lineTo(m.x + 2.2, m.y + 2.2); ctx.stroke();
      }

      // boss marks (revealed)
      const defeated = new Set((ms && ms.defeatedBosses) || []);
      for (const b of BOSSES) {
        if (!revealed.has(secKey(b.x, b.y))) continue;
        const m = toM(b.x, b.y);
        ctx.strokeStyle = defeated.has(b.id) ? 'rgba(120,200,120,0.8)' : 'rgba(200,60,50,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(m.x - 2.6, m.y - 2.6); ctx.lineTo(m.x + 2.6, m.y + 2.6); ctx.moveTo(m.x + 2.6, m.y - 2.6); ctx.lineTo(m.x - 2.6, m.y + 2.6); ctx.stroke();
      }

      // player — location + facing
      const p = g && g.player;
      if (p) {
        const m = toM(p.x, p.y);
        ctx.strokeStyle = 'rgba(200,60,40,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(m.x, m.y, 5 + Math.sin(t * 3) * 1.5, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(m.x, m.y, 2.6, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(230,200,120,0.9)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(p.facing || 0) * 7, m.y + Math.sin(p.facing || 0) * 7); ctx.stroke();
      }

      ctx.restore();

      // subtle gothic ring
      ctx.strokeStyle = 'rgba(150,112,54,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(R, R, R - 2, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(R, R, R - 4, 0, TAU); ctx.stroke();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [game]);

  return (
    <div className="absolute bottom-4 right-4 z-20 pointer-events-none"
      style={{ width: D, height: D, filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.8))' }}>
      <canvas ref={cvRef} style={{ width: D, height: D }} className="block" />
    </div>
  );
}

function drawMiniLandmark(ctx, x, y, type) {
  ctx.fillStyle = 'rgba(40,26,14,0.85)';
  ctx.strokeStyle = 'rgba(40,26,14,0.85)';
  ctx.lineWidth = 0.8;
  switch (type) {
    case 'cathedral':
      ctx.fillRect(x - 1.6, y - 1, 3.2, 3);
      ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x, y - 3.6); ctx.lineTo(x + 1.7, y - 1); ctx.closePath(); ctx.fill(); break;
    case 'statue':
      ctx.fillRect(x - 0.6, y - 2.6, 1.2, 3); ctx.beginPath(); ctx.arc(x, y - 2.9, 1.1, 0, TAU); ctx.fill(); break;
    case 'bridge':
      ctx.beginPath(); ctx.moveTo(x - 3, y + 1.5); ctx.quadraticCurveTo(x, y - 2.2, x + 3, y + 1.5); ctx.stroke(); break;
    case 'bellTower': case 'clockTower': case 'spire':
      ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 1.7, y + 1.5); ctx.lineTo(x + 1.7, y + 1.5); ctx.closePath(); ctx.fill(); break;
    case 'greatTree': case 'tree':
      ctx.beginPath(); ctx.arc(x, y - 1, 2.3, 0, TAU); ctx.fill(); break;
    case 'well':
      ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.stroke(); break;
    case 'crypt': case 'chapel': case 'library':
      ctx.fillRect(x - 2, y - 1, 4, 2.4); break;
    case 'windmill':
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, TAU); ctx.fill(); break;
    case 'arch':
      ctx.beginPath(); ctx.moveTo(x - 2.2, y + 1.5); ctx.quadraticCurveTo(x, y - 2.6, x + 2.2, y + 1.5); ctx.stroke(); break;
    case 'staircase':
      ctx.beginPath(); ctx.moveTo(x - 2.6, y + 1.5); ctx.lineTo(x - 1, y); ctx.lineTo(x + 1, y - 1); ctx.lineTo(x + 2.6, y + 1.5); ctx.stroke(); break;
    case 'overlook':
      ctx.beginPath(); ctx.moveTo(x - 2.6, y + 1.5); ctx.lineTo(x, y - 2.2); ctx.lineTo(x + 2.6, y + 1.5); ctx.closePath(); ctx.stroke(); break;
    default:
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
  }
}