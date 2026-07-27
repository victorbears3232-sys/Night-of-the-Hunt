// EnemyPreview.jsx — a self-contained canvas that renders a single enemy as a
// high-quality, slowly-turning model preview, reusing the exact in-game
// artwork (EnemyRender.drawEnemyFigure). Used by the Bestiary so every entry
// shows the real foe the player faced, not a generic icon.

import { useEffect, useRef } from 'react';
import { drawEnemyFigure } from '@/game/EnemyRender';

export default function EnemyPreview({ type, color = '#7a6a5a', r = 13, size = 120 }) {
  const ref = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const e = { type, r, color, state: 'idle', facing: 0, hitFlash: 0, x: 0, y: 0 };
    const game = { runtime: 0 };
    const t0 = performance.now();

    const render = () => {
      const t = (performance.now() - t0) / 1000;
      game.runtime = t;
      ctx.clearRect(0, 0, size, size);
      // soft pedestal glow
      const g = ctx.createRadialGradient(size / 2, size * 0.62, 2, size / 2, size * 0.62, size * 0.5);
      g.addColorStop(0, 'rgba(120,90,50,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size * 0.56);
      // gently face slightly toward the viewer and breathe
      const turn = Math.sin(t * 0.5) * 0.18;
      ctx.rotate(turn);
      drawEnemyFigure(game, ctx, e, false);
      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, [type, color, r, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="block" />;
}