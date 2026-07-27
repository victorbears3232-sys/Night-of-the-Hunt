// Aftermath.js — makes a defeated boss feel like it changed the world.
// On boss defeat: clears the arena's lingering minor enemies (the "fog of
// creatures" lifts), records the cleared arena, and (via drawTint) lets warm
// light bleed back into cleared arenas so the dark recedes there. Doorways /
// hidden paths are opened by the engine's _onBossDefeated gate calls.

const ARENAS = {
  vicar:       { minX: 2184, maxX: 2716, minY: 844,  maxY: 1652 },
  gascoigne:   { minX: 3420, maxX: 3800, minY: 880,  maxY: 1620 },
  nightmare:   { minX: 4520, maxX: 5040, minY: 860,  maxY: 1640 },
  mire:        { minX: 3040, maxX: 3700, minY: 3040, maxY: 3660 },
  hollow_king: { minX: 4140, maxX: 4920, minY: 3540, maxY: 4340 },
  archivist:   { minX: 1340, maxX: 2260, minY: 5840, maxY: 6320 },
  final:       { minX: 4220, maxX: 4880, minY: 5920, maxY: 6270 },
  };

export function markCleared(game, b) {
  if (!game.clearedArenas) game.clearedArenas = [];
  const A = ARENAS[b.type];
  if (!A) return;
  if (game.clearedArenas.some(a => a.id === b.type)) return;
  game.clearedArenas.push({ id: b.type, ...A });
  // The arena goes quiet: remove the minor enemies lingering inside it.
  game.enemies = game.enemies.filter(e =>
    !(e.alive && e.x > A.minX && e.x < A.maxX && e.y > A.minY && e.y < A.maxY)
  );
}

// Screen-space: a soft warm light returns over each cleared arena (the dark
// recedes where the boss fell). Called after the lighting pass.
export function drawTint(game, ctx) {
  const arr = game.clearedArenas;
  if (!arr || !arr.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const A of arr) {
    const cx = (A.minX + A.maxX) / 2 - game.camera.x;
    const cy = (A.minY + A.maxY) / 2 - game.camera.y;
    const rad = Math.max(A.maxX - A.minX, A.maxY - A.minY) / 2 + 140;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    g.addColorStop(0, 'rgba(255,180,90,0.10)');
    g.addColorStop(0.6, 'rgba(255,160,80,0.05)');
    g.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}