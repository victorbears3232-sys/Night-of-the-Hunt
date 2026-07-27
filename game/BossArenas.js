// BossArenas.js — shared boss-arena bounds + a helper that tells whether a world
// point sits inside an arena whose boss has not yet been defeated. Used to keep
// collectibles (map fragments, chests, relics, lore notes) hidden until the
// arena's boss is slain, so fights stay free of distractions and rewards only
// appear once the prey is downed. Bounds mirror the arenas defined in
// HuntGame._spawnBoss / SecretBosses.DEFS.

export const BOSS_ARENAS = {
  vicar:       { minX: 2184, maxX: 2716, minY: 844,  maxY: 1652 },
  gascoigne:   { minX: 3420, maxX: 3800, minY: 880,  maxY: 1620 },
  nightmare:   { minX: 4520, maxX: 5040, minY: 860,  maxY: 1640 },
  mire:        { minX: 3040, maxX: 3700, minY: 3040, maxY: 3660 },
  hollow_king: { minX: 4140, maxX: 4920, minY: 3540, maxY: 4340 },
  archivist:   { minX: 1340, maxX: 2260, minY: 5840, maxY: 6320 },
  final:       { minX: 4220, maxX: 4880, minY: 5920, maxY: 6270 },
  pale_wraith: { minX: 2500, maxX: 2880, minY: 3300, maxY: 3680 },
  winter_hierophant: { minX: 1140, maxX: 1860, minY: 100, maxY: 440 },
  hollow_castellan: { minX: 2920, maxX: 3200, minY: 300, maxY: 600 },
  wailing_mother: { minX: 3740, maxX: 3980, minY: 120, maxY: 420 },
  cliff_watcher: { minX: 4520, maxX: 4920, minY: 2260, maxY: 2560 },
};

// Returns the boss type whose (undefeated) arena contains the point, else null.
// Once a boss is defeated its arena unlocks and collectibles reappear.
export function arenaLockAt(game, x, y) {
  for (const type in BOSS_ARENAS) {
    if (game.defeatedBosses && game.defeatedBosses.has(type)) continue;
    const a = BOSS_ARENAS[type];
    if (x >= a.minX && x <= a.maxX && y >= a.minY && y <= a.maxY) return type;
  }
  return null;
}