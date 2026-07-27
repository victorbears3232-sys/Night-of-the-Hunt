// WorldMap.jsx — clean, icon-driven world map with fog-of-war, live player marker,
// smooth zoom/pan, and click-to-fast-travel. Region names are the only text on the
// chart itself; everything else is an intuitive icon. The render core lives in
// <MapCanvas>, which sizes itself to its container so it can be embedded as a page
// of the Hunter's Journal (or shown fullscreen). <WorldMap> is the standalone
// fullscreen overlay wrapper around <MapCanvas>.

import React, { useEffect, useRef, useState } from 'react';
import { getNextObjective } from './Objectives.js';

export const WORLD_W = 5100;
export const WORLD_H = 6400;
export const SECTOR = 280;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const secKey = (x, y) => Math.floor(x / SECTOR) + ',' + Math.floor(y / SECTOR);

export const LANDMARKS = [
  { x: 1010, y: 420, type: 'bellTower' },
  { x: 620, y: 560, type: 'well' },
  { x: 1850, y: 1340, type: 'crypt' },
  { x: 2450, y: 1100, type: 'cathedral' },
  { x: 3500, y: 1080, type: 'clockTower' },
  { x: 3660, y: 1620, type: 'chapel' },
  { x: 4800, y: 1500, type: 'spire' },
  { x: 360, y: 1820, type: 'statue' },
  { x: 2450, y: 2060, type: 'bridge' },
  { x: 2300, y: 1880, type: 'greatTree' },
  { x: 700, y: 3200, type: 'statue' },
  { x: 1400, y: 3600, type: 'windmill' },
  { x: 3720, y: 2300, type: 'windmill' },
  { x: 1700, y: 2500, type: 'greatTree' },
  { x: 2250, y: 3900, type: 'library' },
  { x: 4500, y: 3900, type: 'overlook' },
  { x: 3400, y: 2900, type: 'arch' },
  { x: 700, y: 1900, type: 'staircase' },
  { x: 3380, y: 3340, type: 'cathedral' },
  { x: 4520, y: 3850, type: 'cathedral' },
  { x: 1800, y: 5200, type: 'library' },
  { x: 1800, y: 6100, type: 'cathedral' },
  { x: 750, y: 5120, type: 'cathedral' },
];

export const BOSSES = [
  { x: 2450, y: 1260, id: 'vicar' },
  { x: 3660, y: 1260, id: 'gascoigne' },
  { x: 4800, y: 1280, id: 'nightmare' },
  { x: 3380, y: 3340, id: 'mire' },
  { x: 4520, y: 3850, id: 'hollow_king' },
  { x: 1800, y: 6100, id: 'archivist' },
  { x: 4550, y: 6100, id: 'final' },
];

export const PATH = [[440, 1380], [1290, 1420], [1850, 1340], [2450, 1260], [2920, 1280], [3660, 1260], [3980, 1280], [4800, 1280]];
export const PATH_SOUTH = [[440, 1380], [700, 1900], [700, 3000], [700, 3500], [2250, 4050]];
export const PATH_DEEP = [[2250, 4050], [2600, 3700], [3000, 3400], [3380, 3340], [4000, 3600], [4520, 3850]];
export const PATH_LIBRARY = [[2100, 4380], [2100, 4700], [1800, 5250], [1800, 5900], [1800, 6100]];

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParchment(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const r = rng(909);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#dccaa2'); g.addColorStop(0.5, '#cdb78a'); g.addColorStop(1, '#bda778');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    const x = r() * w, y = r() * h, rad = 40 + r() * 160;
    const sg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    sg.addColorStop(0, `rgba(110,80,40,${0.06 + r() * 0.08})`); sg.addColorStop(1, 'rgba(110,80,40,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(60,40,20,0.05)';
  for (let i = 0; i < 1400; i++) ctx.fillRect(r() * w, r() * h, 1, 1);
  const eg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
  eg.addColorStop(0, 'rgba(40,24,10,0)'); eg.addColorStop(1, 'rgba(30,18,8,0.55)');
  ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h);
  return cv;
}

// ---- Icon drawing (all centered at origin, drawn at base ~10px, scaled by k) ----
function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

function drawLanternIcon(ctx, x, y, k, t) {
  const gl = 0.55 + Math.sin(t * 3) * 0.3;
  const g = ctx.createRadialGradient(x, y, 0, x, y, 11 * k);
  g.addColorStop(0, `rgba(255,180,70,${0.5 * gl})`); g.addColorStop(1, 'rgba(255,180,70,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 11 * k, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 1.3; ctx.fillStyle = '#f0b050';
  ctx.beginPath();
  ctx.moveTo(-3, -1); ctx.lineTo(-2, -5); ctx.lineTo(2, -5); ctx.lineTo(3, -1);
  ctx.lineTo(2, 3); ctx.lineTo(-2, 3); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe6b0'; ctx.beginPath(); ctx.arc(0, -1, 1.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7a4a1a'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -7.5); ctx.stroke();
  ctx.restore();
}

function drawBossIcon(ctx, x, y, k, slain, t) {
  if (!slain) {
    const gl = 0.35 + Math.sin(t * 4) * 0.3;
    ctx.strokeStyle = `rgba(200,50,30,${gl})`; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(x, y, 8 * k, 0, TAU); ctx.stroke();
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const col = slain ? 'rgba(96,86,74,0.85)' : 'rgba(178,40,30,0.95)';
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -1, 4.2, 0, TAU); ctx.fill();
  ctx.fillStyle = slain ? 'rgba(22,20,18,0.7)' : 'rgba(20,4,4,0.92)';
  ctx.beginPath(); ctx.arc(-1.6, -1.4, 1.15, 0, TAU); ctx.arc(1.6, -1.4, 1.15, 0, TAU); ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(-2.2, 2, 4.4, 1.7);
  ctx.fillStyle = slain ? 'rgba(22,20,18,0.7)' : 'rgba(20,4,4,0.92)';
  ctx.fillRect(-1.5, 2, 0.6, 1.7); ctx.fillRect(-0.3, 2, 0.6, 1.7); ctx.fillRect(0.9, 2, 0.6, 1.7);
  if (slain) {
    ctx.strokeStyle = 'rgba(140,50,40,0.95)'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(-5.5, -5.5); ctx.lineTo(5.5, 5.5); ctx.stroke();
  }
  ctx.restore();
}

function drawObjectiveMarker(ctx, x, y, k, t) {
  const gl = 0.5 + Math.sin(t * 3) * 0.35;
  ctx.strokeStyle = `rgba(220,160,50,${gl})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x, y, 11 * k, 0, TAU); ctx.stroke();
  ctx.strokeStyle = `rgba(255,200,90,${gl * 0.55})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, TAU); ctx.stroke();
  const g = ctx.createRadialGradient(x, y, 0, x, y, 14 * k);
  g.addColorStop(0, `rgba(255,200,90,${0.5 * gl})`); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#fff4d0'; ctx.strokeStyle = '#9a6a20'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawDeathIcon(ctx, x, y, k, t) {
  const gl = 0.45 + Math.sin(t * 3) * 0.35;
  ctx.strokeStyle = `rgba(170,40,40,${gl})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x, y, 10 * k, 0, TAU); ctx.stroke();
  const g = ctx.createRadialGradient(x, y, 0, x, y, 12 * k);
  g.addColorStop(0, `rgba(200,40,40,${0.5 * gl})`); g.addColorStop(1, 'rgba(200,40,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#b03030'; ctx.beginPath(); ctx.arc(0, -0.5, 4.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(20,4,4,0.95)'; ctx.beginPath(); ctx.arc(-1.6, -1, 1.1, 0, TAU); ctx.arc(1.6, -1, 1.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a0a0a'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4.5, -5); ctx.lineTo(4.5, 5); ctx.moveTo(4.5, -5); ctx.lineTo(-4.5, 5); ctx.stroke();
  ctx.restore();
}

function drawNpcIcon(ctx, x, y, k, merchant) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const col = merchant ? '#5a8a4a' : '#7088a8';
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -3, 1.9, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3.2, 4); ctx.lineTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(3.2, 4); ctx.closePath(); ctx.fill();
  if (merchant) {
    ctx.strokeStyle = '#c9a040'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(3.6, -3.4, 1.9, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#e0c060'; ctx.beginPath(); ctx.arc(3.6, -3.4, 0.85, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawObjectiveIcon(ctx, x, y, k, t) {
  const gl = 0.45 + Math.sin(t * 3) * 0.35;
  ctx.strokeStyle = `rgba(200,150,50,${gl})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, 9 * k, 0, TAU); ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#e8d9a0'; ctx.fillRect(-2.6, -4, 5.2, 8);
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(-2.6, -4, 5.2, 1.4); ctx.fillRect(-2.6, 2.6, 5.2, 1.4);
  ctx.fillStyle = '#a83232'; ctx.beginPath(); ctx.arc(0, -0.4, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawPlayerIcon(ctx, x, y, k, t, facing) {
  const gl = 0.4 + Math.sin(t * 3) * 0.3;
  ctx.strokeStyle = `rgba(200,60,40,${0.5 * gl})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, 9 * k, 0, TAU); ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.rotate(facing);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.moveTo(6 * k, 0); ctx.lineTo(-3 * k, -4 * k); ctx.lineTo(-1 * k, 0); ctx.lineTo(-3 * k, 4 * k); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill();
}

function drawLockIcon(ctx, x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = 'rgba(140,110,180,0.7)'; ctx.fillStyle = 'rgba(140,110,180,0.45)'; ctx.lineWidth = 1.4;
  ctx.fillRect(-2.6, -1, 5.2, 5);
  ctx.strokeRect(-2.6, -1, 5.2, 5);
  ctx.beginPath(); ctx.arc(0, -1, 2.3, Math.PI, 0); ctx.stroke();
  ctx.restore();
}

function drawCompass(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(50,34,18,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(120,34,22,0.85)';
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-3.4, 2); ctx.lineTo(3.4, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(50,34,18,0.4)';
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-3.4, -2); ctx.lineTo(3.4, -2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Point-of-interest landmark glyphs (origin-centered, scaled by k).
function drawPoi(ctx, x, y, k, type) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = 'rgba(40,26,14,0.8)'; ctx.fillStyle = 'rgba(40,26,14,0.8)';
  ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (type) {
    case 'cathedral':
      ctx.strokeRect(-5, -7, 10, 9);
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -14); ctx.lineTo(-4, -7); ctx.lineTo(4, -7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -17); ctx.stroke(); break;
    case 'bellTower':
      ctx.strokeRect(-3, -8, 6, 10);
      ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(0, -13); ctx.lineTo(3, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,80,40,0.5)'; ctx.beginPath(); ctx.arc(0, -5, 1.6, 0, TAU); ctx.fill(); break;
    case 'clockTower':
      ctx.strokeRect(-3, -8, 6, 10);
      ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(0, -12); ctx.lineTo(3, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -4, 2, 0, TAU); ctx.stroke(); break;
    case 'bridge':
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(0, -6, 8, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-8, 5); ctx.moveTo(0, -3); ctx.lineTo(0, 5); ctx.moveTo(8, 2); ctx.lineTo(8, 5); ctx.stroke(); break;
    case 'windmill':
      ctx.fillRect(-2, -6, 4, 9);
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-6, -8); ctx.moveTo(0, -4); ctx.lineTo(6, 0);
      ctx.moveTo(0, -4); ctx.lineTo(-6, 0); ctx.moveTo(0, -4); ctx.lineTo(6, -8); ctx.stroke(); break;
    case 'greatTree':
      ctx.fillRect(-1.5, -3, 3, 6);
      ctx.beginPath(); ctx.arc(0, -6, 5, 0, TAU); ctx.fill(); break;
    case 'spire':
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-3, 2); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -15); ctx.stroke(); break;
    case 'chapel':
      ctx.strokeRect(-5, -3, 10, 6);
      ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(0, -9); ctx.lineTo(5, -3); ctx.closePath(); ctx.fill(); break;
    case 'statue':
      ctx.fillRect(-1, -8, 2, 8);
      ctx.beginPath(); ctx.arc(0, -9, 2, 0, TAU); ctx.fill(); break;
    case 'crypt':
      ctx.strokeRect(-5, -3, 10, 6);
      ctx.beginPath(); ctx.arc(0, -3, 5, Math.PI, 0); ctx.stroke(); break;
    case 'well':
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-6, -5); ctx.lineTo(6, -5); ctx.lineTo(4, 0); ctx.stroke(); break;
    case 'staircase':
      ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(-3, -1); ctx.lineTo(0, -3); ctx.lineTo(3, -1); ctx.lineTo(6, 3); ctx.stroke(); break;
    case 'arch':
      ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-6, -2); ctx.quadraticCurveTo(0, -9, 6, -2); ctx.lineTo(6, 4); ctx.stroke(); break;
    case 'library':
      ctx.strokeRect(-5, -4, 10, 8);
      ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(0, -8); ctx.lineTo(5, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,40,0.6)'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke(); break;
    case 'overlook':
      ctx.beginPath(); ctx.moveTo(-7, 3); ctx.lineTo(-2, -5); ctx.lineTo(2, -2); ctx.lineTo(7, -6); ctx.lineTo(7, 3); ctx.closePath(); ctx.stroke(); break;
  }
  ctx.restore();
}

export function MapCanvas({ game, mapState, onTravel, height = 420, className, interactive = true }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const fitRef = useRef({ sc: 0, offX: 0, offY: 0 });
  const viewRef = useRef({ scale: 0, offX: 0, offY: 0 });
  const dragRef = useRef(null);
  const hoverRef = useRef(null);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const [size, setSize] = useState({ w: 320, h: 260 });
  const [zoomPct, setZoomPct] = useState(100);

  const syncZoomLabel = () => {
    const f = fitRef.current; const v = viewRef.current;
    if (f.sc) setZoomPct(Math.round((v.scale / f.sc) * 100));
  };

  // Fit-to-container sizing.
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current; if (!wrap) return;
      const aspect = WORLD_W / WORLD_H;
      const availW = wrap.clientWidth || 320;
      const availH = wrap.clientHeight || 260;
      let w = availW, h = w / aspect;
      if (h > availH) { h = availH; w = h * aspect; }
      if (w > availW) { w = availW; h = w / aspect; }
      setSize({ w: Math.max(120, Math.floor(w)), h: Math.max(100, Math.floor(h)) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [height]);

  // Compute fit transform and (re)center view whenever size changes.
  useEffect(() => {
    const sc = Math.min(size.w / WORLD_W, size.h / WORLD_H);
    const offX = (size.w - WORLD_W * sc) / 2;
    const offY = (size.h - WORLD_H * sc) / 2;
    fitRef.current = { sc, offX, offY };
    viewRef.current = { scale: sc, offX, offY };
    setZoomPct(100);
  }, [size]);

  const zoomAt = (cx, cy, factor) => {
    const f = fitRef.current; const v = viewRef.current;
    if (!f.sc) return;
    const wx = (cx - v.offX) / v.scale, wy = (cy - v.offY) / v.scale;
    const ns = clamp(v.scale * factor, f.sc, f.sc * 6);
    viewRef.current = { scale: ns, offX: cx - wx * ns, offY: cy - wy * ns };
    syncZoomLabel();
  };
  const zoomCenter = (factor) => zoomAt(size.w / 2, size.h / 2, factor);
  const resetView = () => { const f = fitRef.current; viewRef.current = { scale: f.sc, offX: f.offX, offY: f.offY }; syncZoomLabel(); };

  const onWheel = (e) => {
    if (!interactive) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    zoomAt(cx, cy, e.deltaY < 0 ? 1.18 : 1 / 1.18);
  };

  const onDown = (e) => {
    if (!interactive) return;
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false, ox: viewRef.current.offX, oy: viewRef.current.offY };
  };
  const onMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (d.moved) viewRef.current = { ...viewRef.current, offX: d.ox + dx, offY: d.oy + dy };
  };
  const onUp = (e) => {
    const d = dragRef.current; dragRef.current = null;
    if (!d || d.moved) return;
    // treat as click → fast travel
    const v = viewRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const wx = (e.clientX - rect.left - v.offX) / v.scale;
    const wy = (e.clientY - rect.top - v.offY) / v.scale;
    const lanterns = (mapStateRef.current && mapStateRef.current.lanterns) || [];
    let best = null, bd = 55 * 55;
    for (const l of lanterns) {
      const dd = (l.x - wx) * (l.x - wx) + (l.y - wy) * (l.y - wy);
      if (dd < bd) { bd = dd; best = l; }
    }
    if (best && onTravel) onTravel(best);
  };
  const onCanvasMove = (e) => {
    if (!interactive) return;
    const v = viewRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const wx = (e.clientX - rect.left - v.offX) / v.scale;
    const wy = (e.clientY - rect.top - v.offY) / v.scale;
    const lanterns = (mapStateRef.current && mapStateRef.current.lanterns) || [];
    let best = null, bd = 55 * 55;
    for (const l of lanterns) { const dd = (l.x - wx) * (l.x - wx) + (l.y - wy) * (l.y - wy); if (dd < bd) { bd = dd; best = l; } }
    hoverRef.current = best;
    if (canvasRef.current) canvasRef.current.style.cursor = best ? 'pointer' : 'grab';
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Keyboard zoom (+ / − / 0) and arrow-key pan for the interactive map.
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === '+' || k === '=') { e.preventDefault(); zoomCenter(1.2); }
      else if (k === '-' || k === '_') { e.preventDefault(); zoomCenter(1 / 1.2); }
      else if (k === '0') { e.preventDefault(); resetView(); }
      else if (k === 'arrowleft') { e.preventDefault(); viewRef.current = { ...viewRef.current, offX: viewRef.current.offX + 64 }; }
      else if (k === 'arrowright') { e.preventDefault(); viewRef.current = { ...viewRef.current, offX: viewRef.current.offX - 64 }; }
      else if (k === 'arrowup') { e.preventDefault(); viewRef.current = { ...viewRef.current, offY: viewRef.current.offY + 64 }; }
      else if (k === 'arrowdown') { e.preventDefault(); viewRef.current = { ...viewRef.current, offY: viewRef.current.offY - 64 }; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, size]);

  // Render loop.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size.w * dpr; cv.height = size.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const parchment = buildParchment(size.w, size.h);
    const nx = Math.ceil(WORLD_W / SECTOR), ny = Math.ceil(WORLD_H / SECTOR);

    let raf;
    const render = () => {
      const v = viewRef.current;
      const S = v.scale, offX = v.offX, offY = v.offY;
      ctx.drawImage(parchment, 0, 0);

      const ms = mapStateRef.current || {};
      const revealed = new Set(ms.revealed || []);
      const regions = ms.regions || [];
      const fragments = ms.fragments || [];
      const discovered = new Set(ms.discoveredRegions || []);
      const defeated = new Set(ms.defeatedBosses || []);
      const visitedLanterns = ms.lanterns || [];
      const MAJOR_BOSSES = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist', 'hollow_castellan'];   // The Cliff Watcher is optional — not required to chart the Sanctum
      const allDefeated = MAJOR_BOSSES.every(id => defeated.has(id));

      // Regions are charted only by their Map Fragment — uncharted land stays dark.
      const regionAt = (wx, wy) => regions.find(rr => wx >= rr.x && wx <= rr.x + rr.w && wy >= rr.y && wy <= rr.y + rr.h);
      const chartedAt = (wx, wy) => { const r = regionAt(wx, wy); return !!(r && (discovered.has(r.id) || (r.id === 'final' && allDefeated))); };
      for (let cx = 0; cx < nx; cx++) for (let cy = 0; cy < ny; cy++) {
        const ccx = (cx + 0.5) * SECTOR, ccy = (cy + 0.5) * SECTOR;
        const x = offX + cx * SECTOR * S, y = offY + cy * SECTOR * S;
        const w = SECTOR * S + 1, h = SECTOR * S + 1;
        const r = regionAt(ccx, ccy);
        if (r && (discovered.has(r.id) || (r.id === 'final' && allDefeated))) {
          ctx.fillStyle = r.color; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = '#241c12'; ctx.globalAlpha = 0.9; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
        }
      }

      // Region borders + the ONLY text on the map: region names (kept small and
      // de-duplicated so adjacent/overlapping regions never stack labels).
      const drawnLabels = [];
      const labelFont = clamp(10 * Math.sqrt(S / fitRef.current.sc), 9, 13);
      for (const r of regions) {
        if (!discovered.has(r.id) && !(r.id === 'final' && allDefeated)) continue;
        const x = offX + r.x * S, y = offY + r.y * S, w = r.w * S, h = r.h * S;
        ctx.strokeStyle = 'rgba(40,26,14,0.5)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, w, h);
        const lx = x + w / 2, ly = y + h / 2;
        let overlap = false;
        for (const dl of drawnLabels) { if (Math.hypot(dl.x - lx, dl.y - ly) < labelFont * 3.2) { overlap = true; break; } }
        if (overlap) continue;
        ctx.fillStyle = 'rgba(36,22,10,0.82)';
        ctx.font = `italic ${labelFont}px ui-serif, Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.fillText(r.name, lx, ly);
        drawnLabels.push({ x: lx, y: ly });
      }
      // Sealed final region: dashed outline + lock icon, no text.
      const finR = regions.find(r => r.id === 'final');
      if (finR && !allDefeated) {
        const x = offX + finR.x * S, y = offY + finR.y * S, w = finR.w * S, h = finR.h * S;
        ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(70,50,100,0.55)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
        drawLockIcon(ctx, x + w / 2, y + h / 2 - 12, clamp(1.4 * Math.sqrt(S / fitRef.current.sc), 1, 2.4));
        ctx.fillStyle = 'rgba(200,170,120,0.85)';
        ctx.textAlign = 'center';
        const fs = clamp(11 * Math.sqrt(S / fitRef.current.sc), 9, 15);
        ctx.font = `italic ${fs}px ui-serif, Georgia, serif`;
        ctx.fillText('Defeat All Guardians', x + w / 2, y + h / 2 + 14);
        if (finR.gate) {
          const gx = offX + finR.gate.x * S, gy = offY + finR.gate.y * S;
          ctx.fillStyle = 'rgba(150,110,60,0.85)'; ctx.fillRect(gx - 6, gy - 9, 12, 18);
          ctx.strokeStyle = 'rgba(90,60,30,0.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(gx - 6, gy - 9, 12, 18);
          ctx.beginPath(); ctx.moveTo(gx, gy - 9); ctx.lineTo(gx, gy + 9); ctx.stroke();
        }
      }
      ctx.textAlign = 'left';

      const t = performance.now() / 1000;
      const zoom = S / (fitRef.current.sc || S);
      const iz = clamp(8 * Math.sqrt(zoom), 7, 18); // icon base radius in screen px
      const k = iz / 8;

      // Trails.
      const drawTrail = (pts) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(80,52,26,0.4)'; ctx.lineWidth = clamp(1.2 * Math.sqrt(zoom), 1, 2.4); ctx.setLineDash([4, 4]);
        ctx.beginPath(); let started = false;
        for (let i = 0; i < pts.length; i++) {
          const [wx, wy] = pts[i];
          if (!chartedAt(wx, wy)) { started = false; continue; }
          const sx = offX + wx * S, sy = offY + wy * S;
          if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
        }
        ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      };
      drawTrail(PATH); drawTrail(PATH_SOUTH); drawTrail(PATH_DEEP); drawTrail(PATH_LIBRARY);

      // Points of interest (landmarks) — icons only, no labels.
      for (const lm of LANDMARKS) {
        if (!chartedAt(lm.x, lm.y)) continue;
        drawPoi(ctx, offX + lm.x * S, offY + lm.y * S, k, lm.type);
      }

      // Collected map fragments (POI stars).
      for (const f of fragments) {
        if (!f.collected) continue;
        if (!chartedAt(f.x, f.y)) continue;
        ctx.fillStyle = '#caa238';
        drawStar(ctx, offX + f.x * S, offY + f.y * S, 4.5 * k);
      }

      // Hidden charm pickups (POI, revealed only).
      const g = game.current;
      if (g && g.relics) {
        for (const r of g.relics) {
          if (r.collected || r.questItem) continue;
          if (!chartedAt(r.x, r.y)) continue;
          ctx.fillStyle = (r.color || '#6ab04a');
          drawStar(ctx, offX + r.x * S, offY + r.y * S, 3.4 * k);
        }
      }

      // Slain Guardians — a quiet record of prey already felled.
      for (const b of BOSSES) {
        if (!defeated.has(b.id)) continue;
        drawBossIcon(ctx, offX + b.x * S, offY + b.y * S, k, true, t);
      }

      // NPCs / merchants — at their current stage position, only when revealed.
      if (g && g.npcs) {
        for (const n of g.npcs) {
          const st = n.def.stages[n.stage];
          if (!st || st.gone) continue;
          if (!chartedAt(st.x, st.y)) continue;
          drawNpcIcon(ctx, offX + st.x * S, offY + st.y * S, k, !!n.def.shop);
        }
      }

      // The single next required objective — the only guiding marker on the chart.
      {
        const obj = g && getNextObjective(g);
        if (obj && chartedAt(obj.x, obj.y)) drawObjectiveMarker(ctx, offX + obj.x * S, offY + obj.y * S, k, t);
      }

      // Death bloodstain — dropped essence awaiting recovery (always shown).
      {
        const dm = ms.deathMarker;
        if (dm) drawDeathIcon(ctx, offX + dm.x * S, offY + dm.y * S, k, t);
      }

      // Visited rest lanterns — fast-travel points (clickable).
      for (const l of visitedLanterns) {
        drawLanternIcon(ctx, offX + l.x * S, offY + l.y * S, k, t);
      }
      // Hover highlight on the lantern under the cursor.
      const h = hoverRef.current;
      if (h) {
        const hx = offX + h.x * S, hy = offY + h.y * S;
        ctx.strokeStyle = 'rgba(255,228,140,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(hx, hy, 11 * k + 4, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,228,140,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(hx, hy, 11 * k + 9, 0, TAU); ctx.stroke();
      }

      // Player location.
      const p = g && g.player;
      if (p) {
        drawPlayerIcon(ctx, offX + p.x * S, offY + p.y * S, k, t, p.facing || 0);
      }

      // Map Fragment unveil animation — a golden sweep expands over the newly
      // charted region, then fades, the moment a fragment is collected.
      const ra = ms.revealAnim;
      if (ra) {
        const e = (performance.now() - ra.t0) / 1000;
        if (e < 1.8) {
          const a = Math.max(0, 1 - e / 1.8);
          const fx = offX + ra.x * S, fy = offY + ra.y * S, fw = ra.w * S, fh = ra.h * S;
          const cxr = fx + fw / 2, cyr = fy + fh / 2;
          const rad = Math.max(1, Math.max(fw, fh) * 0.75 * Math.min(1, e / 1.2));
          ctx.save();
          ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
          const rg = ctx.createRadialGradient(cxr, cyr, 0, cxr, cyr, rad);
          rg.addColorStop(0, `rgba(255,232,160,${0.6 * a})`);
          rg.addColorStop(0.7, `rgba(220,180,90,${0.22 * a})`);
          rg.addColorStop(1, 'rgba(220,180,90,0)');
          ctx.fillStyle = rg; ctx.fillRect(fx, fy, fw, fh);
          ctx.strokeStyle = `rgba(255,220,140,${0.7 * a})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cxr, cyr, rad, 0, TAU); ctx.stroke();
          ctx.restore();
        }
      }

      // Frame border.
      ctx.strokeStyle = 'rgba(50,34,18,0.6)'; ctx.lineWidth = 3;
      ctx.strokeRect(offX - 4, offY - 4, WORLD_W * S + 8, WORLD_H * S + 8);

      // Compass rose (icon only).
      drawCompass(ctx, offX + WORLD_W * S - 34, offY + 30);

      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [size, game]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={wrapRef} style={{ width: '100%', height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas ref={canvasRef} style={{ width: size.w, height: size.h, cursor: interactive ? 'grab' : 'pointer', touchAction: 'none' }}
          className="block"
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onCanvasMove}
        />
      </div>
      {interactive ? (
        <div className="flex items-center justify-between gap-2 mt-1.5" style={{ width: size.w, margin: '0 auto' }}>
          <Legend />
          <div className="flex items-center gap-1">
            <MapBtn onClick={() => zoomCenter(1 / 1.25)} label="Zoom out">−</MapBtn>
            <span className="text-stone-500 text-[9px] font-mono w-9 text-center tabular-nums">{zoomPct}%</span>
            <MapBtn onClick={() => zoomCenter(1.25)} label="Zoom in">+</MapBtn>
            <MapBtn onClick={resetView} label="Reset view">⤢</MapBtn>
          </div>
        </div>
      ) : (
        <Legend />
      )}
    </div>
  );
}

function MapBtn({ onClick, label, children }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="w-6 h-6 flex items-center justify-center border border-amber-900/40 text-amber-200/80 text-sm leading-none hover:bg-amber-900/20 hover:border-amber-700/60 transition-colors">
      {children}
    </button>
  );
}

function Legend() {
  const item = (node, label) => (
    <span className="inline-flex items-center gap-1 text-stone-500 text-[9px] tracking-widest uppercase">
      {node}{label}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {item(<Glyph lantern />, 'lantern')}
      {item(<Glyph quest />, 'next objective')}
      {item(<Glyph bossSlain />, 'slain')}
      {item(<Glyph npc />, 'npc')}
      {item(<Glyph merchant />, 'merchant')}
      {item(<Glyph star />, 'fragment')}
      {item(<Glyph death />, 'lost essence')}
      {item(<Glyph player />, 'you')}
    </div>
  );
}

function Glyph({ lantern, boss, bossSlain, npc, merchant, quest, star, player, death }) {
  return (
    <svg width="13" height="13" viewBox="-7 -7 14 14" className="shrink-0">
      {lantern && <><circle cx="0" cy="0" r="6" fill="rgba(255,180,70,0.25)" /><polygon points="-3,-1 -2,-4 2,-4 3,-1 2,2 -2,2" fill="#f0b050" stroke="#7a4a1a" strokeWidth="0.6" /></>}
      {boss && <><circle cx="0" cy="-0.5" r="4" fill="rgba(178,40,30,0.95)" /><circle cx="-1.6" cy="-1" r="1.1" fill="#140404" /><circle cx="1.6" cy="-1" r="1.1" fill="#140404" /></>}
      {bossSlain && <><circle cx="0" cy="-0.5" r="4" fill="rgba(96,86,74,0.85)" /><line x1="-5" y1="-5" x2="5" y2="5" stroke="rgba(140,50,40,0.95)" strokeWidth="1.4" /></>}
      {npc && <><circle cx="0" cy="-3" r="1.9" fill="#7088a8" /><polygon points="-3.2,4 -2,0 2,0 3.2,4" fill="#7088a8" /></>}
      {merchant && <><circle cx="-1" cy="-3" r="1.7" fill="#5a8a4a" /><polygon points="-4,3.5 -2.6,0 0.6,0 2,3.5" fill="#5a8a4a" /><circle cx="3.4" cy="-3.2" r="1.9" fill="none" stroke="#c9a040" strokeWidth="0.9" /><circle cx="3.4" cy="-3.2" r="0.8" fill="#e0c060" /></>}
      {quest && <><circle cx="0" cy="0" r="6" fill="none" stroke="rgba(220,160,50,0.8)" strokeWidth="0.9" /><polygon points="0,-5 4,0 0,5 -4,0" fill="#fff4d0" stroke="#9a6a20" strokeWidth="0.5" /></>}
      {star && <polygon points="0,-5 1.4,-1.6 5,-1.6 2,0.8 3,5 0,2.6 -3,5 -2,0.8 -5,-1.6 -1.4,-1.6" fill="#caa238" />}
      {player && <><circle cx="0" cy="0" r="6" fill="none" stroke="rgba(200,60,40,0.5)" strokeWidth="0.9" /><polygon points="5,0 -2.5,-3.5 -1,0 -2.5,3.5" fill="#c0392b" /></>}
      {death && <><circle cx="0" cy="-0.5" r="4" fill="#b03030" /><circle cx="-1.6" cy="-1" r="1.1" fill="#140404" /><circle cx="1.6" cy="-1" r="1.1" fill="#140404" /><line x1="-4" y1="-4" x2="4" y2="4" stroke="#5a0a0a" strokeWidth="0.9" /><line x1="4" y1="-4" x2="-4" y2="4" stroke="#5a0a0a" strokeWidth="0.9" /></>}
    </svg>
  );
}

export default function WorldMap({ game, mapState, onClose }) {
  const [travelTarget, setTravelTarget] = useState(null);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.82)' }} onClick={onClose}>
      <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-2">
          <p className="text-amber-200/80 tracking-[0.4em] uppercase text-xs">The Hollow Quarter</p>
        </div>
        <div style={{ width: 'min(1000px, calc(100vw - 48px))' }}>
          <MapCanvas game={game} mapState={mapState} height="min(780px, calc(100vh - 200px))"
            onTravel={(l) => setTravelTarget(l)} />
        </div>
        <button onClick={onClose}
          className="mt-3 text-amber-200/70 hover:text-amber-200 border border-amber-900/40 px-4 py-1.5 text-[11px] tracking-[0.3em] uppercase transition-colors"
          style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
          Close (M)
        </button>
        {travelTarget && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setTravelTarget(null)}>
            <div className="max-w-xs w-full p-6 text-center" onClick={(e) => e.stopPropagation()}
              style={{ background: 'rgba(18,12,16,0.97)', border: '1px solid rgba(160,120,50,0.45)', boxShadow: '0 0 40px rgba(0,0,0,0.85)' }}>
              <h3 className="text-base mb-1 text-amber-100" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>Travel to {travelTarget.name || 'the Lantern'}?</h3>
              <p className="text-xs italic mb-5 text-stone-400">The light will bear you there. Defeated prey will return to their posts.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setTravelTarget(null)} className="px-4 py-2 text-[11px] tracking-[0.25em] uppercase text-stone-300 border border-stone-700 hover:bg-stone-800/40 transition-colors">Cancel</button>
                <button onClick={() => { const l = travelTarget; setTravelTarget(null); if (game.current) game.current.fastTravel(l.x, l.y); }} className="px-4 py-2 text-[11px] tracking-[0.25em] uppercase text-amber-100 border border-amber-700/60 hover:bg-amber-900/30 transition-colors">Travel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}