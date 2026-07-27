// Achievements.js — milestone tracking, in-game trophy toasts, analytics, and
// external logging (queued + retried in the background). Pure helpers on a
// HuntGame instance `g`. Per-frame cost is just a throttled condition sweep.

import { base44 } from '@/api/base44Client';
import { CHARM_DEFS } from './Charms.js';
import { OUTFITS } from './Outfits.js';
import * as Bestiary from './Bestiary.js';

export const GAME_VERSION = '1.0.0';
const SAVE_KEY = 'hunt_achievements_v1';
const QUEUE_KEY = 'hunt_ach_queue_v1';

const TOTAL_CHARMS = CHARM_DEFS.length;
const MAJOR = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist', 'hollow_castellan'];   // required story Guardians (Cliff Watcher is optional, tracked via its own achievement)
const SECRET_AREAS = ['sanctuary', 'final'];
const QUEST_NPCS = ['aldric', 'mire', 'garrick', 'pilgrim', 'mira', 'child'];
const ALL_QUEST_NPCS = ['aldric', 'mire', 'garrick', 'pilgrim', 'mira', 'child', 'holt', 'aldous', 'elias'];

function questDone(g, id) {
  if (!g.npcs) return false;
  const n = g.npcs.find(x => x.def.id === id);
  return !!n && n.stage >= n.def.stages.length - 1;
}
const restLanterns = g => (g.world && g.world.lanterns ? g.world.lanterns.filter(l => l.rest) : []);
const chests = g => (g.world && g.world.chests ? g.world.chests : []);

export const ACHIEVEMENTS = [
  // ---- Beast Hunts ----
  { id: 'first_blood',       cat: 'boss',  icon: '🩸', title: 'First Blood',            desc: 'Defeat your first major boss',         check: g => MAJOR.some(b => g.defeatedBosses.has(b)) },
  { id: 'boss_vicar',        cat: 'boss',  icon: '💧', title: 'The Shroud Lifted',      desc: 'Defeat The Drowned Vicar',              check: g => g.defeatedBosses.has('vicar') },
  { id: 'boss_gascoigne',    cat: 'boss',  icon: '🔥', title: "Father's Rest",          desc: 'Defeat Father Lucian Veyr',             check: g => g.defeatedBosses.has('gascoigne') },
  { id: 'boss_nightmare',    cat: 'boss',  icon: '🌙', title: "Dream's End",            desc: 'Defeat The Nightmare',                  check: g => g.defeatedBosses.has('nightmare') },
  { id: 'boss_mire',         cat: 'boss',  icon: '🌊', title: 'Clear Water',            desc: 'Defeat The Mire Mother',                check: g => g.defeatedBosses.has('mire') },
  { id: 'boss_hollow_king',  cat: 'boss',  icon: '👑', title: 'The Crown Falls',        desc: 'Defeat The Hollow King',                check: g => g.defeatedBosses.has('hollow_king') },
  { id: 'boss_archivist',    cat: 'boss',  icon: '📖', title: 'Index Closed',           desc: 'Defeat The Archivist',                  check: g => g.defeatedBosses.has('archivist') },
  { id: 'beast_slayer',      cat: 'boss',  icon: '🐗', title: 'Beast Slayer',          desc: 'Defeat every major boss',
    check: g => MAJOR.every(b => g.defeatedBosses.has(b)),
    progress: g => ({ cur: MAJOR.filter(b => g.defeatedBosses.has(b)).length, max: MAJOR.length, label: 'Guardians' }) },
  { id: 'boss_final',        cat: 'boss',  icon: '🩸', title: 'Nightmare Conquered',    desc: 'Defeat the final boss — Elias, the First Beast', check: g => g.defeatedBosses.has('final') },
  { id: 'secret_wraith',     cat: 'boss',  icon: '👻', title: 'The Shade Unremembered', desc: 'Defeat the hidden Pale Wraith in the Forgotten Gardens', check: g => g.defeatedBosses.has('pale_wraith') },
  { id: 'boss_winter',       cat: 'boss',  icon: '❄️', title: 'The Frost Lifted',        desc: 'Defeat The Winter Hierophant in the Frostbound Cathedral', check: g => g.defeatedBosses.has('winter_hierophant') },
  { id: 'boss_castellan',    cat: 'boss',  icon: '🏰', title: 'The Keep Falls',          desc: 'Defeat The Hollow Castellan in the Forgotten Castle', check: g => g.defeatedBosses.has('hollow_castellan') },
  { id: 'boss_wailing',      cat: 'boss',  icon: '🌲', title: 'Silence in the Wood',     desc: 'Defeat The Wailing Mother in the Whispering Wood', check: g => g.defeatedBosses.has('wailing_mother') },
  { id: 'boss_cliff',        cat: 'boss',  icon: '🪨', title: 'The Cliff Goes Quiet',    desc: 'Defeat The Cliff Watcher on the Cliffside Walk', check: g => g.defeatedBosses.has('cliff_watcher') },
  { id: 'boss_guardian',     cat: 'boss',  icon: '🔒', title: 'The Last Lock Broken',   desc: 'Descend into the Forgotten Underworld and defeat The Last Warden', check: g => g.defeatedBosses.has('under_guardian') },

  // ---- Exploration ----
  { id: 'hub_unlock',        cat: 'explore', icon: '🏮', title: 'The Hunt Begins',       desc: "Reach the Hunter's Nightmare", check: g => !!(g._enteredAreas && g._enteredAreas.has('hub')) },
  { id: 'first_lantern',     cat: 'explore', icon: '🕯️', title: 'Guided by Light',      desc: 'Activate your first lantern',  check: g => !!(g.visitedLanterns && g.visitedLanterns.size >= 1) },
  { id: 'all_lanterns',      cat: 'explore', icon: '🔦', title: 'Beacon Hunter',        desc: 'Activate every lantern',
    check: g => !!(g.visitedLanterns && g.visitedLanterns.size >= restLanterns(g).length && restLanterns(g).length > 0),
    progress: g => ({ cur: g.visitedLanterns ? g.visitedLanterns.size : 0, max: restLanterns(g).length, label: 'Lanterns' }) },
  { id: 'first_fragment',    cat: 'explore', icon: '📜', title: 'First Chart',         desc: 'Acquire your first Map Fragment', check: g => !!(g.collectedFragments && g.collectedFragments.size >= 1) },
  { id: 'all_fragments',     cat: 'explore', icon: '🗺️', title: 'Cartographer',        desc: 'Collect every Map Fragment',
    check: g => !!(g.fragments && g.collectedFragments && g.fragments.length > 0 && g.collectedFragments.size >= g.fragments.length),
    progress: g => ({ cur: g.collectedFragments ? g.collectedFragments.size : 0, max: g.fragments ? g.fragments.length : 0, label: 'Fragments' }) },
  { id: 'discover_sanctuary',cat: 'explore', icon: '⛩️', title: 'The Forgotten Sanctuary', desc: 'Discover the Forgotten Sanctuary', check: g => !!(g._enteredAreas && g._enteredAreas.has('sanctuary')) },
  { id: 'discover_sanctum',  cat: 'explore', icon: '🏛️', title: 'The Drowned Sanctum', desc: 'Enter the Drowned Sanctum', check: g => !!(g._enteredAreas && g._enteredAreas.has('final')) },
  { id: 'north_explorer',    cat: 'explore', icon: '🧊', title: 'Into the North', desc: 'Discover every region of the northern expansion',
    check: g => !!(g._enteredAreas && ['frost_cath', 'castle', 'whisper_wood', 'ash_catacombs'].every(id => g._enteredAreas.has(id))),
    progress: g => { const ids = ['frost_cath', 'castle', 'whisper_wood', 'ash_catacombs']; return { cur: ids.filter(id => g._enteredAreas && g._enteredAreas.has(id)).length, max: 4, label: 'Regions' }; } },
  { id: 'explorer',          cat: 'explore', icon: '🧭', title: 'Explorer',             desc: 'Discover every major area',
    check: g => !!(g._enteredAreas && g.regions && g._enteredAreas.size >= g.regions.length),
    progress: g => ({ cur: g._enteredAreas ? g._enteredAreas.size : 0, max: g.regions ? g.regions.length : 0, label: 'Areas' }) },
  { id: 'no_stone',          cat: 'explore', icon: '🔍', title: 'No Stone Unturned',    desc: 'Find every secret area',
    check: g => SECRET_AREAS.every(id => g._enteredAreas && g._enteredAreas.has(id)),
    progress: g => ({ cur: SECRET_AREAS.filter(id => g._enteredAreas && g._enteredAreas.has(id)).length, max: SECRET_AREAS.length, label: 'Secrets' }) },
  { id: 'treasure',          cat: 'explore', icon: '📦', title: 'Treasure Hunter',      desc: 'Open every hidden chest',
    check: g => { const c = chests(g); return c.length > 0 && c.every(ch => ch.opened); },
    progress: g => { const c = chests(g); return { cur: c.filter(ch => ch.opened).length, max: c.length, label: 'Chests' }; } },

  // ---- Mastery ----
  { id: 'first_charm',       cat: 'mastery', icon: '💎', title: 'Charm Collector',      desc: 'Find your first charm', check: g => !!(g.player && g.player.charms && g.player.charms.size >= 1) },
  { id: 'all_charms',        cat: 'mastery', icon: '💍', title: 'Relic Hunter',         desc: 'Collect every charm',
    check: g => !!(g.player && g.player.charms && g.player.charms.size >= TOTAL_CHARMS),
    progress: g => ({ cur: g.player && g.player.charms ? g.player.charms.size : 0, max: TOTAL_CHARMS, label: 'Charms' }) },
  { id: 'all_outfits',       cat: 'mastery', icon: '🧥', title: 'Master of the Hunt',  desc: 'Collect every hunter outfit',
    check: g => !!(g.player && g.player.outfits && g.player.outfits.size >= OUTFITS.length),
    progress: g => ({ cur: g.player && g.player.outfits ? g.player.outfits.size : 0, max: OUTFITS.length, label: 'Outfits' }) },
  { id: 'first_upgrade',     cat: 'mastery', icon: '⚒️', title: "Blacksmith's Apprentice", desc: 'Upgrade a weapon for the first time', check: g => !!(g.player && g.player.weaponLvl >= 1) },
  { id: 'upgrades_5',        cat: 'mastery', icon: '🔥', title: 'Forged in Blood',      desc: 'Reach 5 total weapon upgrades',
    check: g => !!(g.player && g.player.weaponLvl >= 5),
    progress: g => ({ cur: Math.min(g.player ? g.player.weaponLvl : 0, 5), max: 5, label: 'Upgrades' }) },
  { id: 'weapon_max',        cat: 'mastery', icon: '⚔️', title: 'Master Craftsman',      desc: 'Fully upgrade a weapon (+10)',
    check: g => !!(g.player && g.player.weaponLvl >= 10),
    progress: g => ({ cur: g.player ? g.player.weaponLvl : 0, max: 10, label: 'Upgrades' }) },
  { id: 'first_visceral',    cat: 'mastery', icon: '🗡️', title: 'The Killing Blow',     desc: 'Perform your first Visceral Attack', check: g => !!(g.achStats && g.achStats.viscerals >= 1) },
  { id: 'level_10',          cat: 'mastery', icon: '⭐', title: "Hunter's Resolve",     desc: 'Reach Hunter Level 10',
    check: g => !!(g.player && g.player.level >= 10),
    progress: g => ({ cur: Math.min(g.player ? g.player.level : 1, 10), max: 10, label: 'Level' }) },
  { id: 'slayer_100',        cat: 'mastery', icon: '💀', title: 'The Cull',             desc: 'Defeat 100 enemies',
    check: g => !!(g.achStats && g.achStats.kills >= 100),
    progress: g => ({ cur: Math.min(g.achStats ? g.achStats.kills : 0, 100), max: 100, label: 'Enemies' }) },
  { id: 'memory',            cat: 'mastery', icon: '🪞', title: "Hunter's Memory",      desc: 'Replay your first boss through Memories', check: g => !!(g.achStats && g.achStats.memories >= 1) },
  { id: 'master_hunter',     cat: 'mastery', icon: '📕', title: 'Master Hunter',        desc: "Complete the Hunter's Journal — defeat every unique enemy and boss",
    check: g => Bestiary.isComplete(g),
    progress: g => { const p = Bestiary.progress(g); return { cur: p.cur, max: p.max, label: 'Entries' }; } },

  // ---- Questlines ----
  { id: 'quest_aldric',      cat: 'quest', icon: '📜', title: 'The Badge Returns',     desc: "Complete Aldric's questline",      check: g => questDone(g, 'aldric') },
  { id: 'quest_mire',        cat: 'quest', icon: '📜', title: 'Forbidden Knowledge',   desc: "Complete Sister Mire's questline", check: g => questDone(g, 'mire') },
  { id: 'quest_garrick',     cat: 'quest', icon: '📜', title: 'Master Smith',          desc: "Complete Garrick's questline",     check: g => questDone(g, 'garrick') },
  { id: 'quest_pilgrim',     cat: 'quest', icon: '📜', title: 'The Pilgrim Arrives',   desc: "Complete the Pilgrim's pilgrimage", check: g => questDone(g, 'pilgrim') },
  { id: 'quest_mira',        cat: 'quest', icon: '📜', title: 'Healer Restored',       desc: "Complete Mira's questline",        check: g => questDone(g, 'mira') },
  { id: 'quest_child',       cat: 'quest', icon: '📜', title: 'The First Prayer',      desc: "Complete the Pale Child's questline", check: g => questDone(g, 'child') },
  { id: 'quest_all',         cat: 'quest', icon: '🏆', title: 'The Quarter Remembers', desc: 'Complete every NPC questline', check: g => ALL_QUEST_NPCS.every(id => questDone(g, id)) },

  // ---- Legend ----
  { id: 'ng_plus_clear',     cat: 'meta', icon: '🔱', title: 'The Eternal Hunt', desc: 'Complete the game in New Game+', check: g => !!(g.defeatedBosses && g.defeatedBosses.has('final') && g.ngPlus) },
  { id: 'true_hunt',         cat: 'meta', icon: '✦', title: 'The True Hunt',  desc: 'Unlock the secret ending — slay the Celestial God', check: g => !!g.trueEnding },
  { id: 'completionist',     cat: 'meta', icon: '👑', title: 'Completionist',  desc: 'Earn every achievement',
    check: g => !!(g.achievements && g.achievements.earned.size >= ACHIEVEMENTS.length - 1),
    progress: g => ({ cur: g.achievements ? g.achievements.earned.size : 0, max: ACHIEVEMENTS.length - 1, label: 'Earned' }) },
];

// ---- persistence helpers ----
function loadJSON(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
function persist(g) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      earned: Array.from(g.achievements.earned),
      dates: g.achievements.dates || {},
      stats: g.achStats,
      profileId: g.profileId,
      sent: Array.from(g._achSent),
    }));
  } catch (e) { /* storage unavailable — earned achievements still live in-memory this session */ }
}
function persistQueue(g) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(g._achQueue)); } catch (e) {} }
function makeProfileId() {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

// ---- lifecycle ----
export function init(g) {
  const saved = loadJSON(SAVE_KEY) || {};
  g.achievements = { earned: new Set(saved.earned || []), dates: saved.dates || {} };
  g.achStats = saved.stats || { kills: 0, viscerals: 0, memories: 0 };
  // backfill any missing stat fields for older saves
  g.achStats.kills = g.achStats.kills || 0;
  g.achStats.viscerals = g.achStats.viscerals || 0;
  g.achStats.memories = g.achStats.memories || 0;
  g.profileId = saved.profileId || makeProfileId();
  g._achSent = new Set(saved.sent || []);
  g._achQueue = loadJSON(QUEUE_KEY) || [];
  persist(g);
  startFlush(g);
}

export function checkAll(g) {
  if (!g.achievements || !g.player) return;
  for (const a of ACHIEVEMENTS) {
    if (g.achievements.earned.has(a.id)) continue;
    let met = false;
    try { met = !!a.check(g); } catch (e) { met = false; }
    if (met) unlock(g, a);
  }
}

function unlock(g, a) {
  g.achievements.earned.add(a.id);
  g.achievements.dates[a.id] = new Date().toISOString();
  persist(g);
  if (g.hooks && g.hooks.onAchievement) g.hooks.onAchievement({ id: a.id, title: a.title, desc: a.desc, icon: a.icon, cat: a.cat });
  if (g.sound && g.sound.achievement) { try { g.sound.achievement(); } catch (e) {} }
  try { base44.analytics && base44.analytics.track({ eventName: 'achievement_earned', properties: { achievement_id: a.id, achievement_title: a.title, category: a.cat } }); } catch (e) {}
  enqueueLog(g, a);
}

// ---- external logging (queued + retried; resilient to offline / missing backend) ----
function enqueueLog(g, a) {
  g._achQueue.push({
    achievementId: a.id, achievementName: a.title, achievementDescription: a.desc,
    timestamp: new Date().toISOString(), playerId: g.profileId, gameVersion: GAME_VERSION,
  });
  persistQueue(g);
  flushQueue(g);
}

let flushTimer = null;
let onlineBound = false;
function startFlush(g) {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => flushQueue(g), 30000);
  if (!onlineBound) { onlineBound = true; try { window.addEventListener('online', () => flushQueue(g)); } catch (e) {} }
  flushQueue(g);
}

let flushing = false;
async function flushQueue(g) {
  if (flushing) return;
  if (!g._achQueue || g._achQueue.length === 0) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  flushing = true;
  try {
    while (g._achQueue.length > 0) {
      const entry = g._achQueue[0];
      if (g._achSent && g._achSent.has(entry.achievementId)) { g._achQueue.shift(); persistQueue(g); continue; }
      try {
        await base44.functions.invoke('logAchievement', entry);
        g._achSent.add(entry.achievementId);
        persist(g);
        g._achQueue.shift();
        persistQueue(g);
      } catch (e) {
        break;
      }
    }
  } finally { flushing = false; }
}