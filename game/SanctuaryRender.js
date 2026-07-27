// SanctuaryRender.js — draws the Forgotten Sanctuary's landmark and props in
// world space (called from within HuntGame's camera-translated context).
// Kept separate so HuntGame.js stays under its line budget.

const TAU = Math.PI * 2;

export function drawSanctuaryProps(game, ctx) {
  const t = game.runtime;
  for (const p of (game.sanctuaryProps || [])) {
    ctx.save(); ctx.translate(p.x, p.y);
    switch (p.type) {
      case 'shrine': {
        const auraR = 120 + game.defeatedBosses.size * 24;
        const pulse = 0.6 + Math.sin(t * 1.2) * 0.4;
        const gp = ctx.createRadialGradient(0, 6, 8, 0, 6, auraR);
        gp.addColorStop(0, `rgba(232,200,120,${0.22 * pulse})`); gp.addColorStop(1, 'rgba(232,200,120,0)');
        ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(0, 6, auraR, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, 12, 46, 14, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a3428'; ctx.fillRect(-40, -10, 80, 22);
        ctx.fillStyle = '#4a4234'; ctx.fillRect(-44, -14, 88, 8);
        ctx.fillStyle = '#46413a';
        ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(-20, -88); ctx.lineTo(20, -88); ctx.lineTo(26, -14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.fillRect(-26, -14, 52, 6);
        ctx.fillStyle = '#46413a'; ctx.beginPath(); ctx.moveTo(-20, -88); ctx.lineTo(8, -98); ctx.lineTo(20, -88); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(232,200,120,${0.7 + pulse * 0.3})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-4, -40); ctx.lineTo(4, -64); ctx.lineTo(-2, -84); ctx.stroke();
        const cg = ctx.createRadialGradient(0, -52, 2, 0, -52, 32);
        cg.addColorStop(0, `rgba(255,230,150,${0.6 + pulse * 0.3})`); cg.addColorStop(1, 'rgba(255,230,150,0)');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, -52, 32, 0, TAU); ctx.fill();
        for (let i = 0; i < 7; i++) {
          const lift = (t * 16 + i * 26) % 64;
          const ex = Math.sin(t * 0.5 + i) * 11, ey = -42 - lift;
          ctx.fillStyle = `rgba(255,210,120,${0.6 - lift / 64 * 0.6})`;
          ctx.beginPath(); ctx.arc(ex, ey, 1.7, 0, TAU); ctx.fill();
        }
        const bg = ctx.createLinearGradient(0, -92, 0, -170);
        bg.addColorStop(0, `rgba(255,220,140,${0.16 * pulse})`); bg.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = bg; ctx.fillRect(-22, -170, 44, 78);
        break;
      }
      case 'healShrine': {
        const pulse = 0.6 + Math.sin(t * 1.8) * 0.4;
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
        g.addColorStop(0, `rgba(120,220,200,${0.18 * pulse})`); g.addColorStop(1, 'rgba(120,220,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 8, 26, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#34403c'; ctx.fillRect(-20, -6, 40, 14);
        ctx.fillStyle = '#42524c'; ctx.fillRect(-22, -10, 44, 6);
        // kneeling statue
        ctx.fillStyle = '#c9c0a8';
        ctx.beginPath(); ctx.arc(0, -22, 8, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -10, 11, 12, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(150,230,210,${0.6 + pulse * 0.3})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -16, 18 + pulse * 2, 0, TAU); ctx.stroke();
        break;
      }
      case 'mapTable': {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 12, 26, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4a3826'; ctx.fillRect(-22, -2, 44, 12);
        ctx.fillStyle = '#5a4632'; ctx.fillRect(-26, -6, 52, 5);
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-20, 10, 4, 14); ctx.fillRect(16, 10, 4, 14);
        // unrolled map
        ctx.fillStyle = '#c9b890'; ctx.fillRect(-22, -5, 44, 4);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(-16, -3); ctx.lineTo(0, -4); ctx.lineTo(14, -3); ctx.stroke();
        break;
      }
      case 'fountain': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 6, 26, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.beginPath(); ctx.ellipse(0, 2, 24, 16, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a3a40'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 11, 0, 0, TAU); ctx.fill();
        const shimmer = 0.5 + Math.sin(t * 2) * 0.3;
        ctx.fillStyle = `rgba(120,170,180,${shimmer})`; ctx.beginPath(); ctx.ellipse(0, -1, 14, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-4, -14, 8, 12);
        ctx.fillStyle = `rgba(150,200,210,${0.4 + shimmer * 0.3})`;
        ctx.beginPath(); ctx.arc(0, -16, 2.2, 0, TAU); ctx.fill();
        break;
      }
      case 'statue': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 8, 16, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.fillRect(-14, -2, 28, 10);
        ctx.fillStyle = '#46413a'; ctx.fillRect(-12, -2, 24, 4);
        // hooded figure
        ctx.fillStyle = '#5a5448';
        ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-7, -34); ctx.lineTo(7, -34); ctx.lineTo(9, -2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6a6456'; ctx.beginPath(); ctx.arc(0, -34, 6, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.beginPath(); ctx.arc(0, -32, 3.4, 0, TAU); ctx.fill();
        break;
      }
      case 'arch': {
        ctx.strokeStyle = '#3a352c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-26, 16); ctx.lineTo(-26, -12); ctx.quadraticCurveTo(0, -40, 26, -12); ctx.lineTo(26, 16); ctx.stroke();
        ctx.strokeStyle = '#4a443a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-26, 16); ctx.lineTo(-26, -12); ctx.quadraticCurveTo(0, -34, 26, -12); ctx.lineTo(26, 16); ctx.stroke();
        break;
      }
      case 'pillar': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 10, 14, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.fillRect(-9, -64, 18, 74);
        ctx.fillStyle = '#4a4438'; ctx.fillRect(-11, -68, 22, 6); ctx.fillRect(-11, 4, 22, 6);
        ctx.fillStyle = '#52483c'; ctx.fillRect(-9, -64, 18, 2);
        ctx.strokeStyle = 'rgba(20,16,12,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -50); ctx.lineTo(2, -20); ctx.stroke();
        break;
      }
      case 'candle': {
        const fl = 1 + Math.sin(t * 8 + p.x) * 0.18;
        ctx.fillStyle = '#2a2218'; ctx.fillRect(-4, -2, 8, 6);
        ctx.fillStyle = '#e8d9a0'; ctx.fillRect(-3, -8, 6, 7);
        ctx.fillStyle = `rgba(255,170,60,${0.8 + Math.sin(t * 10 + p.x) * 0.2})`;
        ctx.beginPath(); ctx.ellipse(0, -12, 2.2 * fl, 4 * fl, 0, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(0, -12, 1, 0, -12, 18);
        g.addColorStop(0, 'rgba(255,180,80,0.22)'); g.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -12, 18, 0, TAU); ctx.fill();
        break;
      }
      case 'forge': {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, 10, 30, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a241c'; ctx.fillRect(-26, -10, 52, 20);
        ctx.fillStyle = '#3a3024'; ctx.fillRect(-26, -10, 52, 5);
        // chimney
        ctx.fillStyle = '#2a241c'; ctx.fillRect(14, -40, 12, 32);
        // hearth glow
        const glow = 0.5 + Math.sin(t * 5) * 0.3;
        const hg = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        hg.addColorStop(0, `rgba(255,120,40,${0.7 * glow})`); hg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(220,90,30,${glow})`; ctx.fillRect(-10, -4, 20, 8);
        // rising sparks
        for (let i = 0; i < 3; i++) {
          const sp = (t * 30 + i * 20) % 40;
          ctx.fillStyle = `rgba(255,180,60,${0.6 - sp / 40 * 0.6})`;
          ctx.beginPath(); ctx.arc(Math.sin(t * 2 + i) * 4, -8 - sp, 1.4, 0, TAU); ctx.fill();
        }
        break;
      }
      case 'anvil': {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 8, 16, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a2620'; ctx.fillRect(-4, -2, 8, 10);
        ctx.fillStyle = '#3a3630'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(14, -4); ctx.lineTo(10, 0); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4a443c'; ctx.fillRect(-14, -6, 28, 3);
        break;
      }
      case 'weaponRack': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 10, 22, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-16, 6, 32, 5);
        // crossed weapons
        ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(6, -26); ctx.moveTo(12, 8); ctx.lineTo(-6, -26); ctx.stroke();
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-15, 12); ctx.moveTo(12, 8); ctx.lineTo(15, 12); ctx.stroke();
        ctx.fillStyle = '#8a7050'; ctx.fillRect(-3, -28, 6, 5);
        break;
      }
      case 'bookshelf': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-18, 14, 36, 5);
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-18, -34, 36, 48);
        ctx.fillStyle = '#4a3624'; ctx.fillRect(-16, -32, 32, 44);
        const cols = ['#7a3a2a', '#3a5a7a', '#5a7a3a', '#7a6a3a', '#5a3a5a'];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
          ctx.fillStyle = cols[(r * 5 + c) % cols.length];
          ctx.fillRect(-15 + c * 6.4, -30 + r * 10, 5.4, 8);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let r = 0; r < 4; r++) ctx.fillRect(-16, -22 + r * 10, 32, 1.5);
        break;
      }
      case 'relicPedestal': {
        const pulse = 0.6 + Math.sin(t * 2) * 0.4;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 8, 12, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a3428'; ctx.fillRect(-9, -4, 18, 12);
        ctx.fillStyle = '#4a4234'; ctx.fillRect(-11, -8, 22, 5);
        ctx.fillStyle = `rgba(200,150,80,${0.7 + pulse * 0.3})`;
        ctx.beginPath(); ctx.arc(0, -14, 4, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(0, -14, 1, 0, -14, 18);
        g.addColorStop(0, `rgba(232,192,96,${0.3 * pulse})`); g.addColorStop(1, 'rgba(232,192,96,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -14, 18, 0, TAU); ctx.fill();
        break;
      }
      case 'bench': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-14, 8, 28, 4);
        ctx.fillStyle = '#4a3826'; ctx.fillRect(-16, -2, 32, 4);
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-14, 2, 4, 8); ctx.fillRect(10, 2, 4, 8);
        break;
      }
      case 'grave': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 6, 12, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#46413a';
        ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-8, -10); ctx.quadraticCurveTo(0, -18, 8, -10); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a352c'; ctx.fillRect(-1, -8, 2, 8);
        ctx.strokeStyle = 'rgba(80,70,50,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, -4); ctx.stroke();
        break;
      }
      case 'greatTree': {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, 8, 20, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2e22'; ctx.fillRect(-7, -8, 14, 16);
        ctx.strokeStyle = '#3a2e22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-10, -30); ctx.moveTo(0, -8); ctx.lineTo(10, -30);
        ctx.moveTo(0, -14); ctx.lineTo(-14, -34); ctx.moveTo(0, -14); ctx.lineTo(14, -34); ctx.stroke();
        // dead canopy shimmer
        const g = ctx.createRadialGradient(0, -24, 4, 0, -24, 28);
        g.addColorStop(0, 'rgba(60,80,50,0.12)'); g.addColorStop(1, 'rgba(60,80,50,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -24, 28, 0, TAU); ctx.fill();
        break;
      }
      case 'bell': {
        // a great silent bell hung in a stone tower
        ctx.fillStyle = '#2a2418'; ctx.fillRect(-6, -70, 12, 70);   // beam
        ctx.strokeStyle = '#3a3024'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-18, -70); ctx.lineTo(18, -70); ctx.stroke();
        ctx.strokeStyle = '#4a4030'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(0, -40); ctx.stroke();   // rope
        ctx.fillStyle = '#3a3a30';
        ctx.beginPath(); ctx.moveTo(-12, -40); ctx.quadraticCurveTo(-15, -10, 0, -8); ctx.quadraticCurveTo(15, -10, 12, -40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6a6a58'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-12, -40); ctx.quadraticCurveTo(-15, -10, 0, -8); ctx.quadraticCurveTo(15, -10, 12, -40); ctx.stroke();
        ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(0, -6, 3, 0, TAU); ctx.fill();
        // faint ring halo (silent — barely lit)
        const gl = 0.25 + Math.sin(t * 0.7) * 0.1;
        const g = ctx.createRadialGradient(0, -24, 6, 0, -24, 40);
        g.addColorStop(0, `rgba(220,200,150,${0.10 * gl})`); g.addColorStop(1, 'rgba(220,200,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -24, 40, 0, TAU); ctx.fill();
        break;
      }
      case 'stainedglass': {
        const side = p.side || 1;
        ctx.translate(side * 16, 0);
        ctx.fillStyle = '#2a2418'; ctx.fillRect(-4, -36, 8, 72);
        ctx.fillStyle = '#1a140c'; ctx.beginPath(); ctx.moveTo(-4, -36); ctx.quadraticCurveTo(0, -56, 4, -36); ctx.fill();
        const cols = ['#3a5a8a', '#8a3a5a', '#3a8a6a', '#8a6a3a'];
        const glow = 0.5 + Math.sin(t * 1.5 + p.x * 0.01) * 0.2;
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.5 + glow * 0.4;
          ctx.fillRect(-3, -30 + i * 14, 6, 10);
        }
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(0, -10, 2, 0, -10, 40);
        g.addColorStop(0, `rgba(120,160,220,${0.12 + glow * 0.08})`); g.addColorStop(1, 'rgba(120,160,220,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -10, 40, 0, TAU); ctx.fill();
        break;
      }
    }
    ctx.restore();
  }
}