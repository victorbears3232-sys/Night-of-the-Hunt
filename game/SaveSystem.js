// SaveSystem.js — persistent save/load of the full Hunt progress (localStorage).
// Saves player location, stats, weapon + upgrades, charms, outfits, skins,
// lanterns discovered, bosses defeated, NPC quest progress, opened chests, map
// fragments, and endgame flags. Achievements persist separately via
// Achievements.js. Silent no-op when storage is unavailable.

import { recomputeStats } from './Charms.js';

const SAVE_KEY = 'hunt_save_v1';

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

export function saveGame(g) {
  try {
    if (!g || !g.player) return;
    const p = g.player;
    const save = {
      v: 1, ts: Date.now(),
      player: {
        x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, stamina: p.stamina, maxStamina: p.maxStamina,
        level: p.level, essence: p.essence, needed: p.needed,
        vit: p.vit, end: p.end, str: p.str, skl: p.skl, arc: p.arc,
        mode: p.mode, weaponLvl: p.weaponLvl, skin: p.skin || 'default',
        bloodVials: p.bloodVials, maxBloodVials: p.maxBloodVials,
        bullets: p.bullets, maxBullets: p.maxBullets,
        molotovs: p.molotovs, maxMolotovs: p.maxMolotovs, shards: p.shards || 0,
        charms: [...p.charms], equipped: [...(p.equipped || [])], passives: [...(p.passives || [])],
        outfits: [...p.outfits], skins: [...(p.skins || ['default'])],
        outfit: p.outfit, hpBonus: p.hpBonus || 0, staminaBonus: p.staminaBonus || 0,
        souls: [...(p.souls || [])], fury: p.fury || 0,
        rallyHp: p.rallyHp || 0, rallyTimer: p.rallyTimer || 0,
        keys: [...(p.keys || [])],
      },
      defeatedBosses: [...g.defeatedBosses],
      encounteredBosses: [...g.encounteredBosses],
      openGates: [...g.openGates],
      collectedFragments: [...g.collectedFragments],
      discoveredRegions: [...g.discoveredRegions],
      visitedLanterns: [...g.visitedLanterns.entries()].map(([k, v]) => [k, v]),
      readNotes: [...(g.readNotes || [])],
      chestsOpened: (g.world && g.world.chests ? g.world.chests.filter(c => c.opened).map(c => `${c.x},${c.y}`) : []),
      lastLantern: g.lastLantern,
      npcs: (g.npcs || []).map(n => ({ id: n.def.id, stage: n.stage, talkedStage: n.talkedStage || 0, rewardClaimedStage: n.rewardClaimedStage ?? -1, movedToHub: !!n.movedToHub })),
      flags: {
        finalGateOpened: !!g.finalGateOpened, eliasFinalTalked: !!g.eliasFinalTalked,
        _allSlain: !!g._allSlain, _hubIntroDone: !!g._hubIntroDone, _finalRevealedOnce: !!g._finalRevealedOnce,
        sealBroken: !!g.sealBroken, trueEnding: !!g.trueEnding,
        _celestialRevealedOnce: !!g._celestialRevealedOnce, _celestialDefeated: !!g._celestialDefeated,
      },
      runDeaths: g.runDeaths || 0,
      deathMarker: g.deathMarker || null,
      ngPlus: !!g.ngPlus,
      gameCompleted: !!g.gameCompleted,
      bestiary: g.bestiary ? { defeated: Array.from(g.bestiary.defeated), counts: g.bestiary.counts } : { defeated: [], counts: {} },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) { /* storage full / unavailable — progress still lives in-memory this session */ }
}

export function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; }
}

export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// Whether the player has ever cleared the final boss (persists across NG+ resets
// so the title screen can unlock New Game+ and the Leaderboards).
export function hasCompleted() {
  try { return localStorage.getItem('hunt_completed_v1') === '1'; } catch (e) { return false; }
}
export function markCompleted() { try { localStorage.setItem('hunt_completed_v1', '1'); } catch (e) {} }

// Whether the current save file is a New Game+ run (for the title-screen badge).
export function saveIsNgPlus() {
  const s = loadSave();
  return !!(s && s.ngPlus);
}

export function applySave(g, save) {
  if (!save || !save.player) return false;
  const p = g.player, sp = save.player;
  Object.assign(p, {
    x: sp.x, y: sp.y, hp: sp.hp, maxHp: sp.maxHp, stamina: sp.stamina, maxStamina: sp.maxStamina,
    level: sp.level, essence: sp.essence, needed: sp.needed,
    vit: sp.vit, end: sp.end, str: sp.str, skl: sp.skl, arc: sp.arc,
    mode: sp.mode || 'sword', weaponLvl: sp.weaponLvl || 0, skin: sp.skin || 'default',
    bloodVials: sp.bloodVials ?? 5, maxBloodVials: sp.maxBloodVials ?? 20,
    bullets: sp.bullets ?? 20, maxBullets: sp.maxBullets ?? 20,
    molotovs: sp.molotovs ?? 5, maxMolotovs: sp.maxMolotovs ?? 10, shards: sp.shards || 0,
    hpBonus: sp.hpBonus || 0, staminaBonus: sp.staminaBonus || 0,
    outfit: sp.outfit || 'hunter_garb', locked: null, dodge: null, swing: null, visceraling: null,
    staggered: 0, recovering: 0, charging: 0, invuln: 1.5, nearNpc: null, comboCount: 0, comboTimer: 0,
    rallyHp: sp.rallyHp || 0, rallyTimer: sp.rallyTimer || 0,
  });
  p.charms = new Set(sp.charms || []);
  p.equipped = sp.equipped || [];
  p.passives = new Set(sp.passives || []);
  p.outfits = new Set(sp.outfits || ['hunter_garb']);
  p.skins = new Set(sp.skins || ['default']);
  p.souls = new Set(sp.souls || []);
  // legacy: the old 'iron' soul (charge-interrupt immunity) was reworked into
  // 'instinct' (Hunter's Instinct). Migrate old saves so the benefit carries over.
  if (p.souls.has('iron')) { p.souls.delete('iron'); p.souls.add('instinct'); }
  p.fury = sp.fury || 0;
  p.keys = new Set(sp.keys || []);
  recomputeStats(g);

  g.defeatedBosses = new Set(save.defeatedBosses || []);
  g.encounteredBosses = new Set(save.encounteredBosses || []);
  g.openGates = new Set(save.openGates || []);
  g.collectedFragments = new Set(save.collectedFragments || []);
  g.discoveredRegions = new Set(save.discoveredRegions || ['hub']);
  g.visitedLanterns = new Map(save.visitedLanterns || []);
  g.readNotes = new Set(save.readNotes || []);
  g.lastLantern = save.lastLantern || null;

  // restore fragment + chest states
  (g.fragments || []).forEach(f => { f.collected = g.collectedFragments.has(f.id); });
  const opened = new Set(save.chestsOpened || []);
  (g.world && g.world.chests ? g.world.chests : []).forEach(c => { if (opened.has(`${c.x},${c.y}`)) c.opened = true; });

  // restore NPC quest progress
  if (g.npcs && save.npcs) {
    for (const ns of save.npcs) {
      const n = g.npcs.find(x => x.def.id === ns.id);
      if (n) { n.stage = ns.stage || 0; n.talkedStage = ns.talkedStage || 0; n.rewardClaimedStage = ns.rewardClaimedStage ?? -1; n.movedToHub = !!ns.movedToHub; }
    }
  }

  if (save.flags) {
    g.finalGateOpened = save.flags.finalGateOpened;
    g.eliasFinalTalked = save.flags.eliasFinalTalked;
    g._allSlain = save.flags._allSlain;
    g._hubIntroDone = save.flags._hubIntroDone;
    g._finalRevealedOnce = save.flags._finalRevealedOnce;
    g.sealBroken = !!save.flags.sealBroken;
    g.trueEnding = !!save.flags.trueEnding;
    g._celestialRevealedOnce = !!save.flags._celestialRevealedOnce;
    g._celestialDefeated = !!save.flags._celestialDefeated;
  }
  g.runDeaths = save.runDeaths || 0;
  g.deathMarker = save.deathMarker || null;
  g.ngPlus = !!save.ngPlus;
  g.gameCompleted = !!save.gameCompleted;
  g.bestiary = { defeated: new Set((save.bestiary && save.bestiary.defeated) || []), counts: (save.bestiary && save.bestiary.counts) || {} };
  return true;
}