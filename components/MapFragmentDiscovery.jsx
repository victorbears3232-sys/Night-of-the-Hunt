// MapFragmentDiscovery.jsx — the cinematic overlay shown when a Map Fragment is
// charted. Pauses the Hunt, reveals the fragment as a glowing sealed scroll,
// announces the territory by name, and shows a zoomed preview of the newly
// revealed corner of the world map. The player presses Continue to resume.

import React, { useEffect, useRef, useState } from 'react';

export default function MapFragmentDiscovery({ game, info, mapState }) {
  const [revealed, setRevealed] = useState(false);
  const iconRef = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setRevealed(true), 80); return () => clearTimeout(t); }, [info]);

  const cont = () => { game.current && game.current.dismissFragmentDiscovery(); };

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === 'e' || k === ' ' || k === 'escape') { e.preventDefault(); cont(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The sealed scroll — the fragment's own artwork, gently floating and glowing.
  useEffect(() => {
    const cv = iconRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = 128; cv.width = S * dpr; cv.height = S * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf; const t0 = performance.now();
    const render = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, S, S);
      const cx = S / 2, cy = S / 2 + Math.sin(t * 1.6) * 3;
      const pulse = 0.6 + Math.sin(t * 2) * 0.3;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
      g.addColorStop(0, `rgba(255,210,130,${0.5 * pulse})`); g.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 0.8) * 0.04);
      ctx.fillStyle = '#e8d9a0'; ctx.fillRect(-28, -36, 56, 72);
      ctx.fillStyle = '#c9a86a'; ctx.fillRect(-28, -36, 56, 6); ctx.fillRect(-28, 30, 56, 6);
      ctx.strokeStyle = 'rgba(90,70,40,0.5)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { const yy = -20 + i * 9; ctx.beginPath(); ctx.moveTo(-20, yy); ctx.lineTo(20, yy); ctx.stroke(); }
      const sg = ctx.createRadialGradient(0, -2, 1, 0, -2, 13);
      sg.addColorStop(0, '#c04040'); sg.addColorStop(1, '#7a1818');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, -2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,200,0.55)'; ctx.beginPath(); ctx.arc(-3.5, -5.5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 5); ctx.moveTo(-8, -2); ctx.lineTo(8, -2); ctx.stroke();
      ctx.restore();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // A zoomed preview of the newly revealed territory: charted land in dim
  // pigment, the freshly uncovered regions swept with a golden radial glow.
  useEffect(() => {
    const cv = prevRef.current; if (!cv || !mapState) return;
    const ctx = cv.getContext('2d'); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const PW = 256, PH = 176; cv.width = PW * dpr; cv.height = PH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const regions = mapState.regions || [];
    const revealedIds = new Set(info.regionIds || []);
    const newRegions = regions.filter(r => revealedIds.has(r.id));
    if (newRegions.length === 0) return;
    let bx = Infinity, by = Infinity, bx2 = -Infinity, by2 = -Infinity;
    for (const r of newRegions) { bx = Math.min(bx, r.x); by = Math.min(by, r.y); bx2 = Math.max(bx2, r.x + r.w); by2 = Math.max(by2, r.y + r.h); }
    const pad = Math.max(bx2 - bx, by2 - by) * 0.35 + 140;
    bx -= pad; by -= pad; bx2 += pad; by2 += pad;
    const bw = bx2 - bx, bh = by2 - by;
    const scale = Math.min(PW / bw, PH / bh);
    const offX = (PW - bw * scale) / 2 - bx * scale;
    const offY = (PH - bh * scale) / 2 - by * scale;
    const toS = (wx, wy) => ({ x: offX + wx * scale, y: offY + wy * scale });
    const discovered = new Set(mapState.discoveredRegions || []);
    let raf; const t0 = performance.now();
    const render = () => {
      const e = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, PW, PH);
      const bg = ctx.createLinearGradient(0, 0, PW, PH);
      bg.addColorStop(0, '#2a2218'); bg.addColorStop(1, '#15100a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, PW, PH);
      for (const r of regions) {
        if (r.x + r.w < bx || r.x > bx2 || r.y + r.h < by || r.y > by2) continue;
        const isNew = revealedIds.has(r.id);
        if (!isNew && !discovered.has(r.id)) continue;
        const m = toS(r.x, r.y);
        ctx.globalAlpha = isNew ? 0.85 : 0.4;
        ctx.fillStyle = r.color || '#4a4438';
        ctx.fillRect(m.x, m.y, r.w * scale, r.h * scale);
        if (isNew) {
          const a = Math.max(0, 1 - e / 1.6);
          const cx = m.x + r.w * scale / 2, cy = m.y + r.h * scale / 2;
          const rad = Math.max(1, Math.max(r.w, r.h) * scale * 0.75 * Math.min(1, e / 0.9));
          const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          rg.addColorStop(0, `rgba(255,232,160,${0.55 * a})`); rg.addColorStop(0.7, `rgba(220,180,90,${0.22 * a})`); rg.addColorStop(1, 'rgba(220,180,90,0)');
          ctx.fillStyle = rg; ctx.fillRect(m.x, m.y, r.w * scale, r.h * scale);
          ctx.strokeStyle = `rgba(255,220,140,${0.3 + 0.5 * a})`; ctx.lineWidth = 1.5;
          ctx.strokeRect(m.x, m.y, r.w * scale, r.h * scale);
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(232,212,160,0.85)'; ctx.textAlign = 'center';
      ctx.font = 'italic 10px ui-serif, Georgia, serif';
      const drawnLbl = [];
      for (const r of newRegions) { const m = toS(r.x + r.w / 2, r.y + r.h / 2); let dup = false; for (const d of drawnLbl) { if (Math.hypot(d.x - m.x, d.y - m.y) < 30) { dup = true; break; } } if (dup) continue; ctx.fillText(r.name, m.x, m.y); drawnLbl.push(m); }
      const p = game.current && game.current.player;
      if (p && p.x >= bx && p.x <= bx2 && p.y >= by && p.y <= by2) {
        const m = toS(p.x, p.y);
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(m.x, m.y, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(230,200,120,0.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(p.facing || 0) * 8, m.y + Math.sin(p.facing || 0) * 8); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(150,112,54,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, PW - 2, PH - 2);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [info, mapState, game]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(28,20,12,0.86) 0%, rgba(0,0,0,0.97) 75%)', transition: 'opacity 0.4s ease', opacity: revealed ? 1 : 0 }}>
      <div className="relative w-full max-w-lg text-center" style={{ transition: 'transform 0.5s cubic-bezier(.2,.8,.2,1)', transform: revealed ? 'none' : 'translateY(16px)' }}>
        <p className="tracking-[0.5em] uppercase text-[11px] mb-3" style={{ color: '#caa238', opacity: 0.85 }}>— Map Fragment Acquired —</p>
        <canvas ref={iconRef} style={{ width: 128, height: 128 }} className="mx-auto mb-2" />
        <h2 className="text-3xl md:text-4xl mb-1" style={{ color: '#ece0c4', fontFamily: 'ui-serif, Georgia, serif', textShadow: '0 0 22px rgba(202,162,56,0.5), 0 0 8px rgba(0,0,0,0.9)' }}>{info.name}</h2>
        {(info.regionNames && info.regionNames.length > 0) && (
          <p className="tracking-[0.3em] uppercase text-[11px] mb-4" style={{ color: '#9a8a5a' }}>{info.regionNames.join(' · ')}</p>
        )}
        <div className="mx-auto mb-4 h-px w-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(202,162,56,0.7), transparent)' }} />
        <p className="text-stone-300 italic leading-relaxed max-w-md mx-auto mb-5" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{info.desc}</p>
        <div className="mx-auto mb-5" style={{ width: 256, boxShadow: '0 0 30px rgba(0,0,0,0.7)' }}>
          <canvas ref={prevRef} style={{ width: 256, height: 176 }} className="block" />
        </div>
        {info.hint && <p className="text-stone-500 text-[10px] tracking-[0.25em] uppercase mb-5">Found — {info.hint}</p>}
        <button onClick={cont}
          className="px-12 py-3.5 border text-amber-100 tracking-[0.3em] text-sm uppercase transition-all hover:bg-amber-900/30"
          style={{ borderColor: '#caa238', boxShadow: '0 0 28px rgba(202,162,56,0.3)', fontFamily: 'ui-serif, Georgia, serif' }}>
          Continue
        </button>
        <p className="text-stone-600 text-[10px] tracking-[0.3em] uppercase mt-3">Press Enter to continue</p>
      </div>
    </div>
  );
}