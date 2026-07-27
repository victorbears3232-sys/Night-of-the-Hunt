// SanctuaryMapTable.jsx — the Grand Sanctuary's great map table: a detailed,
// tiltable, rotatable 2.5D chart of the whole Hollow Quarter. Regions paint
// themselves onto the oak as their Map Fragments are found; terrain, castles,
// forests, roads and landmarks render in greater detail than the journal map.

import React, { useEffect, useRef, useState } from 'react';
import { WORLD_W, WORLD_H, LANDMARKS, BOSSES, PATH, PATH_SOUTH, PATH_DEEP, PATH_LIBRARY } from '@/game/WorldMap';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const MAJOR = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist', 'hollow_castellan', 'cliff_watcher'];

function seedRand(seed) {
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- terrain shapes, drawn in world coordinates (tilt/rotate with the table) ----
function drawMountain(ctx, x, y, h) {
  ctx.fillStyle = '#3e3328';
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.75, y); ctx.lineTo(x - h * 0.75, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a4d3c';
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * 0.75, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * 0.2, y - h * 0.6); ctx.lineTo(x + h * 0.2, y - h * 0.6); ctx.closePath(); ctx.fill();
}
function drawTree(ctx, x, y) {
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 2, y - 6, 4, 16);
  ctx.fillStyle = '#243a26'; ctx.beginPath(); ctx.arc(x, y - 14, 16, 0, TAU); ctx.fill();
  ctx.fillStyle = '#34502e'; ctx.beginPath(); ctx.arc(x - 5, y - 18, 11, 0, TAU); ctx.fill();
}
function drawBush(ctx, x, y) {
  ctx.fillStyle = '#34502e'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d65a6a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + (i - 1) * 6, y - 3, 2.4, 0, TAU); ctx.fill(); }
}
function drawCastle(ctx, x, y) {
  ctx.fillStyle = '#4a3d30'; ctx.fillRect(x - 34, y - 24, 68, 44);
  ctx.fillStyle = '#5e4f3c'; ctx.fillRect(x - 34, y - 24, 68, 9);
  ctx.fillStyle = '#3a2e22'; ctx.fillRect(x - 14, y - 62, 28, 62);
  ctx.fillStyle = '#7a3a26'; ctx.beginPath(); ctx.moveTo(x - 16, y - 62); ctx.lineTo(x, y - 84); ctx.lineTo(x + 16, y - 62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3d30'; ctx.fillRect(x - 34, y - 30, 9, 9); ctx.fillRect(x + 25, y - 30, 9, 9);
  ctx.fillStyle = '#120c08'; ctx.fillRect(x - 7, y - 2, 14, 22);
}
function drawCrypt(ctx, x, y) {
  ctx.fillStyle = '#4a4034'; ctx.fillRect(x - 18, y - 16, 36, 22);
  ctx.fillStyle = '#5a4d3c'; ctx.beginPath(); ctx.arc(x, y - 16, 18, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#2a221a'; ctx.lineWidth = 2; ctx.strokeRect(x - 18, y - 16, 36, 22);
}
function drawGrave(ctx, x, y) {
  ctx.fillStyle = '#6a6258'; ctx.fillRect(x - 6, y - 18, 12, 18);
  ctx.beginPath(); ctx.arc(x, y - 18, 6, Math.PI, 0); ctx.fill();
}
function drawHouse(ctx, x, y) {
  ctx.fillStyle = '#5a4a36'; ctx.fillRect(x - 14, y - 12, 28, 18);
  ctx.fillStyle = '#7a3a26'; ctx.beginPath(); ctx.moveTo(x - 16, y - 12); ctx.lineTo(x, y - 26); ctx.lineTo(x + 16, y - 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1208'; ctx.fillRect(x - 4, y - 4, 8, 10);
}
function drawLibrary(ctx, x, y) {
  ctx.fillStyle = '#4a4034'; ctx.fillRect(x - 26, y - 28, 52, 36);
  ctx.fillStyle = '#6a5a48'; ctx.fillRect(x - 26, y - 28, 52, 7);
  ctx.strokeStyle = '#2a221a'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 22 + i * 18, y - 18); ctx.lineTo(x - 22 + i * 18, y + 4); ctx.stroke(); }
}
function drawArch(ctx, x, y) {
  ctx.strokeStyle = '#5a4d3c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x - 16, y + 14); ctx.lineTo(x - 16, y - 10); ctx.quadraticCurveTo(x, y - 30, x + 16, y - 10); ctx.lineTo(x + 16, y + 14); ctx.stroke();
}
function drawEye(ctx, x, y, t) {
  const gl = 0.5 + Math.sin(t * 2) * 0.3;
  ctx.fillStyle = `rgba(150,90,200,${gl})`; ctx.beginPath(); ctx.ellipse(x, y, 26, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a0a1a'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(220,180,255,${gl})`; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, TAU); ctx.fill();
}

function decorateRegion(ctx, r, t) {
  const rng = seedRand(Math.floor(r.x) * 131 + Math.floor(r.y));
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  switch (r.icon) {
    case 'mountain':
      for (let i = 0; i < 6; i++) drawMountain(ctx, r.x + r.w * (0.12 + rng() * 0.76), r.y + r.h * (0.25 + rng() * 0.6), 70 + rng() * 46);
      break;
    case 'tree':
      for (let i = 0; i < 16; i++) drawTree(ctx, r.x + r.w * (0.08 + rng() * 0.84), r.y + r.h * (0.12 + rng() * 0.76));
      break;
    case 'rose':
      for (let i = 0; i < 12; i++) drawBush(ctx, r.x + r.w * (0.1 + rng() * 0.8), r.y + r.h * (0.15 + rng() * 0.7));
      break;
    case 'cathedral':
      drawCastle(ctx, cx, cy);
      break;
    case 'crypt': case 'tomb':
      for (let i = 0; i < 5; i++) drawCrypt(ctx, r.x + r.w * (0.15 + rng() * 0.7), r.y + r.h * (0.2 + rng() * 0.6));
      break;
    case 'grave':
      for (let i = 0; i < 9; i++) drawGrave(ctx, r.x + r.w * (0.1 + rng() * 0.8), r.y + r.h * (0.15 + rng() * 0.75));
      break;
    case 'house':
      for (let i = 0; i < 7; i++) drawHouse(ctx, r.x + r.w * (0.1 + rng() * 0.8), r.y + r.h * (0.2 + rng() * 0.65));
      break;
    case 'book':
      drawLibrary(ctx, cx, cy);
      break;
    case 'arch':
      for (let i = 0; i < 3; i++) drawArch(ctx, r.x + r.w * (0.2 + i * 0.3), r.y + r.h * 0.5);
      break;
    case 'eye':
      drawEye(ctx, cx, cy, t);
      break;
    default:
      ctx.strokeStyle = '#3a3024'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.stroke();
      break;
  }
}

function screenStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}

export default function SanctuaryMapTable({ game, mapState }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef({ scale: 0.17, rot: -0.12, tilt: 0.6 });
  const dragRef = useRef(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const baseScale = 0.17;

  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current; if (!wrap) return;
      setSize({ w: Math.max(320, wrap.clientWidth), h: Math.max(300, wrap.clientHeight) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const setZoom = (f) => { const v = viewRef.current; viewRef.current = { ...v, scale: clamp(v.scale * f, baseScale * 0.55, baseScale * 3.4) }; setZoomPct(Math.round(viewRef.current.scale / baseScale * 100)); };
  const rotate = (d) => { viewRef.current = { ...viewRef.current, rot: viewRef.current.rot + d }; };
  const reset = () => { viewRef.current = { scale: baseScale, rot: -0.12, tilt: 0.6 }; setZoomPct(100); };

  const onWheel = (e) => { e.preventDefault(); setZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); };
  const onDown = (e) => { dragRef.current = { x: e.clientX, y: e.clientY, rot: viewRef.current.rot, tilt: viewRef.current.tilt }; };
  const onMove = (e) => { const d = dragRef.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) < 3) return; viewRef.current = { ...viewRef.current, rot: d.rot + dx * 0.005, tilt: clamp(d.tilt - dy * 0.004, 0.3, 0.95) }; };
  const onUp = () => { dragRef.current = null; };
  useEffect(() => {
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    const render = () => {
      const { scale, rot, tilt } = viewRef.current;
      const w = size.w, h = size.h;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(w, h) * 0.75);
      bg.addColorStop(0, '#3a2a1e'); bg.addColorStop(1, '#120c08');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(70,48,28,0.3)'; ctx.lineWidth = 1;
      for (let i = 0; i < 32; i++) { const y = i * (h / 32); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + Math.sin(i * 1.7) * 5); ctx.stroke(); }

      const ms = mapState || {};
      const regions = ms.regions || [];
      const discovered = new Set(ms.discoveredRegions || []);
      const defeated = new Set(ms.defeatedBosses || []);
      const allDefeated = MAJOR.every(id => defeated.has(id));
      const fragments = ms.fragments || [];
      const lanterns = ms.lanterns || [];
      const charted = (r) => !!(r && (discovered.has(r.id) || (r.id === 'final' && allDefeated)));
      const regionAt = (wx, wy) => regions.find(rr => wx >= rr.x && wx <= rr.x + rr.w && wy >= rr.y && wy <= rr.y + rr.h);
      const chartedAt = (wx, wy) => charted(regionAt(wx, wy));
      const t = performance.now() / 1000;
      const c = Math.cos(rot), s = Math.sin(rot);
      const w2s = (wx, wy) => { const rx = wx - WORLD_W / 2, ry = wy - WORLD_H / 2; return [w / 2 + scale * (rx * c - ry * tilt * s), h / 2 + scale * (rx * s + ry * tilt * c)]; };

      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.rotate(rot); ctx.scale(scale, scale * tilt); ctx.translate(-WORLD_W / 2, -WORLD_H / 2);
      for (const r of regions) { if (charted(r)) { ctx.fillStyle = r.color || '#4a4030'; ctx.globalAlpha = 0.82; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.globalAlpha = 1; } }
      for (const r of regions) { if (charted(r)) decorateRegion(ctx, r, t); }
      const drawRoad = (pts) => { ctx.strokeStyle = 'rgba(228,198,138,0.5)'; ctx.lineWidth = 9; ctx.setLineDash([20, 16]); ctx.beginPath(); let st = false; for (const [wx, wy] of pts) { if (!chartedAt(wx, wy)) { st = false; continue; } if (!st) { ctx.moveTo(wx, wy); st = true; } else ctx.lineTo(wx, wy); } ctx.stroke(); ctx.setLineDash([]); };
      drawRoad(PATH); drawRoad(PATH_SOUTH); drawRoad(PATH_DEEP); drawRoad(PATH_LIBRARY);
      for (const r of regions) { if (charted(r)) { const pulse = 0.45 + Math.sin(t * 1.6 + r.x * 0.01) * 0.2; ctx.strokeStyle = `rgba(244,214,140,${0.25 + pulse * 0.3})`; ctx.lineWidth = 5; ctx.strokeRect(r.x, r.y, r.w, r.h); } }
      ctx.restore();

      for (const lm of LANDMARKS) { if (!chartedAt(lm.x, lm.y)) continue; const [sx, sy] = w2s(lm.x, lm.y); ctx.fillStyle = 'rgba(40,26,14,0.85)'; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, TAU); ctx.fill(); }
      for (const f of fragments) { if (!f.collected || !chartedAt(f.x, f.y)) continue; const [sx, sy] = w2s(f.x, f.y); ctx.fillStyle = '#caa238'; screenStar(ctx, sx, sy, 7); }
      for (const b of BOSSES) { if (!defeated.has(b.id)) continue; const [sx, sy] = w2s(b.x, b.y); ctx.fillStyle = 'rgba(150,70,60,0.9)'; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(200,90,70,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, TAU); ctx.stroke(); }
      for (const l of lanterns) { const [sx, sy] = w2s(l.x, l.y); const gl = 0.5 + Math.sin(t * 3 + l.x * 0.01) * 0.3; const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12); g.addColorStop(0, `rgba(255,180,70,${0.7 * gl})`); g.addColorStop(1, 'rgba(255,180,70,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#f0b050'; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, TAU); ctx.fill(); }
      const p = game.current && game.current.player;
      if (p) { const [sx, sy] = w2s(p.x, p.y); const gl = 0.4 + Math.sin(t * 3) * 0.3; ctx.strokeStyle = `rgba(230,70,50,${0.6 * gl})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 13, 0, TAU); ctx.stroke(); ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.facing || 0); ctx.fillStyle = '#e84030'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, TAU); ctx.fill(); }

      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [size, mapState, game]);

  const close = () => game.current && game.current.closeMapTable();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="text-center mb-2">
        <p className="text-amber-200/80 tracking-[0.45em] uppercase text-xs">The Grand Sanctuary</p>
        <h2 className="text-stone-100 text-lg tracking-wide" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>The Great Map Table</h2>
      </div>
      <div ref={wrapRef} className="relative" style={{ width: 'min(1000px, calc(100vw - 48px))', height: 'min(620px, calc(100vh - 220px))' }}>
        <canvas ref={canvasRef} className="block" style={{ width: size.w, height: size.h, cursor: 'grab', touchAction: 'none' }}
          onWheel={onWheel} onMouseDown={onDown} />
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <Btn onClick={() => setZoom(1.2)} label="Zoom in">+</Btn>
          <Btn onClick={() => setZoom(1 / 1.2)} label="Zoom out">−</Btn>
          <Btn onClick={() => rotate(-0.18)} label="Rotate left">↺</Btn>
          <Btn onClick={() => rotate(0.18)} label="Rotate right">↻</Btn>
          <Btn onClick={reset} label="Reset view">⤢</Btn>
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] tracking-widest uppercase" style={{ color: 'rgba(220,190,140,0.6)' }}>Zoom {zoomPct}% · Drag to rotate &amp; tilt</div>
      </div>
      <button onClick={close} className="mt-3 text-amber-200/70 hover:text-amber-200 border border-amber-900/40 px-5 py-1.5 text-[11px] tracking-[0.3em] uppercase transition-colors" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>Step Away (Esc)</button>
    </div>
  );
}

function Btn({ onClick, label, children }) {
  return <button onClick={onClick} title={label} aria-label={label} className="w-8 h-8 flex items-center justify-center border border-amber-900/50 text-amber-200/80 text-sm leading-none hover:bg-amber-900/30 hover:border-amber-700/60 transition-colors">{children}</button>;
}