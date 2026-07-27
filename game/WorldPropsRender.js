// WorldPropsRender.js — world-space prop drawing (lanterns, lore notes, chests)
// extracted from HuntGame.js to keep the engine file under the line limit.
// Pure draws; the caller has already applied the world camera transform.

const TAU = Math.PI * 2;

export function drawLanterns(game, ctx) {
  for (const l of game.world.lanterns) {
    if (l.lockedBoss && !game.defeatedBosses.has(l.lockedBoss)) continue;
    const flick = 1 + Math.sin(game.runtime * (4 + l.flicker * 3) + l.x) * 0.06 * l.flicker;
    if (l.rest) {
      // tall stone lamp post (checkpoint)
      ctx.fillStyle = '#2a2418';
      ctx.fillRect(l.x - 3, l.y - 44, 6, 44);
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(l.x - 7, l.y - 50, 14, 8);
      ctx.fillStyle = '#ffce6b';
      ctx.beginPath(); ctx.arc(l.x, l.y - 46, 5 * flick, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(l.x - 2, l.y - 4, 4, 10);
      ctx.fillStyle = '#ffce6b';
      ctx.beginPath(); ctx.arc(l.x, l.y - 8, 4 * flick, 0, TAU); ctx.fill();
    }
    l._flick = flick;
  }
}

export function drawNotes(game, ctx) {
  for (const n of game.world.notes) {
    ctx.fillStyle = '#c9b890';
    ctx.fillRect(n.x - 5, n.y - 6, 10, 12);
    ctx.fillStyle = '#8a7a52';
    ctx.fillRect(n.x - 5, n.y - 6, 10, 2);
    if (game.player.nearNote === n) {
      ctx.strokeStyle = '#e8d9a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 16 + Math.sin(game.runtime * 4) * 2, 0, TAU); ctx.stroke();
    }
  }
}

export function drawChests(game, ctx) {
  for (const c of game.world.chests) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 8, 16, 6, 0, 0, TAU); ctx.fill();
    const accent = c.type === 'weapon' ? '#d4a040' : c.type === 'essence' ? '#a06ad6' : c.type === 'vials' ? '#c04040' : c.type === 'charm' ? '#b48ad6' : '#d4b040';
    ctx.fillStyle = c.opened ? '#15100a' : '#2a1c12';
    ctx.fillRect(-14, -8, 28, 16);
    if (c.opened) {
      ctx.fillStyle = '#1a120a';
      ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-16, -16); ctx.lineTo(16, -16); ctx.lineTo(14, -8); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(-14, -14, 28, 6);
      ctx.fillStyle = accent; ctx.fillRect(-3, -12, 6, 5);
    }
    ctx.strokeStyle = c.opened ? '#3a2a1a' : accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-10, 8); ctx.moveTo(10, -14); ctx.lineTo(10, 8); ctx.stroke();
    if (!c.opened && game.player.nearChest === c) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 22 + Math.sin(game.runtime * 4) * 2, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
}