// MemorySystem.js — Boss Memories replay. Lets the Hunter relive any major
// boss encounter from the Journal without affecting the world: snapshots
// player + world state, recreates the boss arena, runs the fight with the
// player's current equipment, suppresses all rewards, and restores
// everything (returning the player to where they opened the Journal) when
// the memory ends. HuntGame only adds thin dispatch hooks.

// Defeated bosses appear in the Journal's Boss Memories tab. `px/py` is the
// player's spawn spot inside the original arena (near, but not on, the boss).
export const MEMORY_BOSSES = [
  { id: 'vicar', name: 'The Drowned Vicar', region: 'Cathedral of Floods', silhouette: 'vicar', px: 2450, py: 1500,
    lore: '"He blessed the well, certain the black water was mercy. When the children began to sing in voices not their own, he did not stop the choir — he led it. The Cathedral drowned with its congregation still kneeling, and the blessing never stopped flowing."' },
  { id: 'gascoigne', name: 'Father Lucian Veyr', region: 'The Burning Graveyard', silhouette: 'gascoigne', px: 3660, py: 1500,
    lore: '"A hunter who hunted hunters, until the hunt began to sing in him. He came to the graveyard swearing the beasts feared fire, and walked among the embers as though they were his children. The beast beneath the coat had been waiting far longer than the man."' },
  { id: 'nightmare', name: 'The Nightmare', region: 'The Nightmare', silhouette: 'nightmare', px: 4800, py: 1500,
    lore: '"It wore the dream like a skin, and the dream wore the faces of the drowned. To slay it was to wake a city that did not know it had been sleeping — and to learn that waking and drowning are the same act, performed in different water."' },
  { id: 'mire', name: 'The Mire Mother', region: 'The Sunken Cathedral', silhouette: 'mire', px: 3380, py: 3500,
    lore: '"She sang the Chorus into the unborn, that they might enter the world already hearing. Her daughters are the water now, and the water loves them. The cathedral she kept still stands, and still it listens for the next verse."' },
  { id: 'hollow_king', name: 'The Hollow King', region: 'The Overlook Cathedral', silhouette: 'hollow_king', px: 4520, py: 4100,
    lore: '"He ordered the digging and the sealing, the singing and the blessing, the crowning and the burying. He ruled what rose — and what rose ate his throne from beneath him. The crown still rests where he left it; no hand has found the courage to lift it."' },
  { id: 'archivist', name: 'The Archivist', region: 'The Grand Ancient Library', silhouette: 'archivist', px: 1800, py: 6220,
    lore: '"He learned to Listen, and then to Sing, and then to remember every word the Library had ever held. He became the Index of the dead the Chorus had made — and the Index is very hungry to learn your name. Do not read him aloud."' },
  { id: 'final', name: 'The First Voice', region: 'The Drowned Sanctum', silhouette: 'final', px: 4550, py: 6200,
    lore: '"It was the first prayer, and the first to be answered. When the singing began it never stopped — it only sank beneath the water, and waited to be sung again. To stand before it is to hear every verse at once, and to know that the silence after is the oldest thing in the Quarter."' },
];

function snapshotPlayer(game) {
  const p = game.player;
  const s = {};
  for (const k in p) s[k] = (p[k] instanceof Set) ? new Set(p[k]) : p[k];
  return s;
}

function restorePlayer(game, s) {
  const p = game.player;
  for (const k in s) p[k] = (s[k] instanceof Set) ? new Set(s[k]) : s[k];
  // reset transient combat state so the return is clean
  p.dodge = null; p.swing = null; p.visceraling = null; p.locked = null;
  p.staggered = 0; p.recovering = 0; p.charging = 0; p.chargeTime = 0; p.firing = 0;
  p.invuln = 1.8; p.hurtFlash = 0; p.comboCount = 0; p.comboTimer = 0; p.transformQueued = false;
  p.healAnim = 0; p.footstep = 0; p.bloodlust = 0;
  p.nearLantern = false; p.nearNote = null; p.nearChest = null; p.nearNpc = null;
  p.nearGate = false; p.nearFragment = null; p.nearMapTable = false;
}

export function startMemory(game, type) {
  if (game._memory) return;
  const def = MEMORY_BOSSES.find(b => b.id === type);
  if (!def) return;
  // close the journal and unpause so the fight can run
  game.questLogOpen = false; game.paused = false; game.pauseReason = null;
  game.hooks.onQuestLogToggle && game.hooks.onQuestLogToggle(false);
  // snapshot world + player (the world stays exactly as it was)
  game._mem = {
    player: snapshotPlayer(game),
    enemies: game.enemies, boss: game.boss,
    projectiles: game.projectiles, pickups: game.pickups, particles: game.particles,
    damageNumbers: game.damageNumbers, shockwaves: game.shockwaves, bloodStains: game.bloodStains,
    returnState: (game.state === 'bossActive') ? 'bossActive' : 'playing',
  };
  game.enemies = []; game.projectiles = []; game.pickups = []; game.particles = [];
  game.damageNumbers = []; game.shockwaves = []; game.bloodStains = []; game.boss = null;
  const p = game.player;
  p.x = def.px; p.y = def.py;
  p.dodge = null; p.swing = null; p.visceraling = null; p.locked = null;
  p.staggered = 0; p.recovering = 0; p.charging = 0; p.firing = 0; p.hurtFlash = 0;
  p.invuln = 1.6; p.nearGate = false;
  game.camera.x = p.x - game.viewW / 2; game.camera.y = p.y - game.viewH / 2;
  if (game.achStats) game.achStats.memories = (game.achStats.memories || 0) + 1;
  game._memory = true;
  game._memFade = 1; game._memFadeDir = -1;   // fade in from black
  game._memPendingRestore = false;
  game._spawnBoss(type);                      // recreates the encounter (intro + arena)
}

export function endMemory(game, victory) {
  if (!game._memory || game._memPendingRestore) return;
  game.boss = null;                            // dissolve the memory
  game.projectiles = [];
  game.player.invuln = 3;
  if (victory) game.sound.victory();
  game._showMsg(victory ? 'The memory fades. You return to yourself.' : 'The memory overwhelms you — but you return.', 2400);
  game._memPendingRestore = true;
  game._memFadeDir = 1;                        // fade to black, then restore
}

function restore(game) {
  const m = game._mem;
  if (!m) return;
  game.enemies = m.enemies; game.boss = m.boss;
  game.projectiles = m.projectiles; game.pickups = m.pickups; game.particles = m.particles;
  game.damageNumbers = m.damageNumbers; game.shockwaves = m.shockwaves; game.bloodStains = m.bloodStains;
  restorePlayer(game, m.player);
  game.state = m.returnState;
  game.hooks.onState && game.hooks.onState(m.returnState);
  game.camera.x = game.player.x - game.viewW / 2; game.camera.y = game.player.y - game.viewH / 2;
  game._memory = false; game._mem = null;
  game._memFade = 1; game._memFadeDir = -1;    // fade back in at the return spot
  if (m.boss) {
    game.hooks.onBossIntro && game.hooks.onBossIntro(m.boss.name);
    game.hooks.onBossHp && game.hooks.onBossHp(m.boss.hp, m.boss.maxHp);
  } else {
    game.hooks.onBossEnd && game.hooks.onBossEnd();
  }
  game._pushHud();
}

export function updateFade(game, dt) {
  if (game._memFadeDir === 0 || game._memFadeDir === undefined) return;
  const sp = 1.7;
  game._memFade += game._memFadeDir * sp * dt;
  if (game._memFadeDir < 0 && game._memFade <= 0) { game._memFade = 0; game._memFadeDir = 0; }
  else if (game._memFadeDir > 0 && game._memFade >= 1) {
    game._memFade = 1; game._memFadeDir = 0;
    if (game._memPendingRestore) { game._memPendingRestore = false; restore(game); }
  }
}

export function drawFade(game, ctx) {
  if (!game._memFade || game._memFade <= 0.001) return;
  ctx.fillStyle = `rgba(0,0,0,${Math.min(1, game._memFade)})`;
  ctx.fillRect(0, 0, game.viewW, game.viewH);
}