// BossIntro.js — the per-boss cinematic entrance sequence, extracted from
// HuntGame.js so the engine file stays lean. Pure function on a game instance.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

export function updateBossIntro(game, dt) {
  const b = game.boss;
  b.introT += dt;
  const p = clamp(b.introT / b.introDur, 0, 1);
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t;
  switch (b.introStyle) {
    case 'drop': {                                      // drops from the ceiling
      b._introAlpha = 1;
      if (p < 0.46) b.y = b._y0 - 1500;
      else if (p < 0.56) b.y = lerp(b._y0 - 1500, b._y0, eIn((p - 0.46) / 0.10));
      else b.y = b._y0;
      if (!b._landed && p >= 0.55) {
        b._landed = true; game.camera.shake = Math.max(game.camera.shake, 16); game.sound.bossRoar();
        game._burst(b.x, b._y0, '#3a2418', 30, 240);
        for (let i = 0; i < 16; i++) { const a = rand(0, TAU); game.particles.push({ x: b.x + Math.cos(a) * 20, y: b._y0, vx: Math.cos(a) * rand(60, 220), vy: -rand(60, 200), life: rand(0.5, 1.1), max: 1.1, r: rand(2, 5), color: '#3a2418' }); }
      }
      break;
    }
    case 'fog': {                                        // emerges from the fog
      b._introAlpha = clamp(p / 0.5, 0, 1);
      b.y = lerp(b._y0 + 160, b._y0, eOut(clamp(p / 0.7, 0, 1)));
      if (Math.random() < 0.4) { const a = rand(0, TAU), d = rand(40, 120); game.particles.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d * 0.5, vx: Math.cos(a) * 20, vy: Math.sin(a) * 10, life: rand(0.8, 1.6), max: 1.6, r: rand(8, 20), color: 'rgba(140,150,170,0.10)' }); }
      if (!b._roared && p >= 0.55) { b._roared = true; game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 8); }
      break;
    }
    case 'throne': {                                     // rises from his throne
      b._introAlpha = clamp(p / 0.3, 0, 1);
      b.y = lerp(b._y0 + 18, b._y0, eOut(clamp(p / 0.8, 0, 1)));
      if (!b._roared && p >= 0.6) { b._roared = true; game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 6); }
      break;
    }
    case 'books': {                                       // materializes amid swirling books
      b._introAlpha = clamp((p - 0.1) / 0.5, 0, 1);
      b.y = b._y0;
      if (!b._roared && p >= 0.7) { b._roared = true; game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 6); }
      break;
    }
    case 'cosmic': {                                      // forms from the cosmic pool
      b._introAlpha = clamp(p / 0.45, 0, 1);
      b.y = lerp(b._y0 + 80, b._y0, eOut(clamp(p / 0.7, 0, 1)));
      if (Math.random() < 0.5) { const a = rand(0, TAU), d = rand(30, 100); game.particles.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, life: rand(0.6, 1.2), max: 1.2, r: rand(1.5, 3.5), color: '#b06ad6' }); }
      if (!b._roared && p >= 0.6) { b._roared = true; game.sound.bossRoar(); }
      break;
    }
    case 'maw': {                                         // rises from the drowning water
      b._introAlpha = clamp(p / 0.5, 0, 1);
      b.y = lerp(b._y0 + 420, b._y0, eOut(clamp(p / 0.75, 0, 1)));
      if (Math.random() < 0.4) { const a = rand(0, TAU), d = rand(30, 90); game.particles.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d * 0.4, vx: 0, vy: -rand(20, 60), life: rand(0.6, 1.2), max: 1.2, r: rand(2, 5), color: 'rgba(60,140,150,0.5)' }); }
      if (!b._roared && p >= 0.6) { b._roared = true; game.sound.bossRoar(); game.camera.shake = Math.max(game.camera.shake, 6); }
      break;
    }
    default: {
      b._introAlpha = clamp(p / 0.3, 0, 1);
      b.y = lerp(b._y0 + b.riseY, b._y0, eOut(clamp(p / 0.8, 0, 1)));
      if (!b._roared && p >= 0.6) { b._roared = true; game.sound.bossRoar(); }
    }
  }
  if (b.introT >= b.introDur) {
    b.y = b._y0; b.x = b._x0; b._introAlpha = 1;
    game.state = 'bossActive';
    game.hooks.onState && game.hooks.onState('bossActive');
    b.state = 'chase'; b.stateT = 0;
    game.sound.startBossTheme(b.type);
    game.hooks.onBossHp && game.hooks.onBossHp(b.hp, b.maxHp);
    game._showMsg(b.introMsg, 1800);
  }
}