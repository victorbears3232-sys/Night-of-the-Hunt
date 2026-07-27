// Leaderboard.js — anonymous leaderboard sync. No sign-in is required: a stable
// per-browser player identity (PlayerIdentity.js) attributes scores across
// sessions. All writes go through the SubmitScore backend function (service
// role), which validates inputs server-side, so the boards can't be trivially
// exploited. Reads use the public entity SDK (RLS read is open) and silently
// fall back to a local browser leaderboard when the network/app is offline.

import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS } from './Achievements';
import { getIdentity } from './PlayerIdentity';

const TOTAL = ACHIEVEMENTS.length;

let inflight = null;
let pending = null;

async function submit(payload) {
  try { await base44.functions.invoke('SubmitScore', payload); }
  catch (e) { /* offline / unavailable — local fallback remains */ }
}

export async function syncMyScore(earnedIds) {
  earnedIds = earnedIds || [];
  const id = getIdentity();
  const payload = { player_id: id.id, player_name: id.name, kind: 'achievements', count: earnedIds.length, earned_ids: earnedIds.join(','), total: TOTAL };
  if (inflight) { pending = payload; return; }
  try {
    inflight = submit(payload);
    await inflight;
  } finally {
    inflight = null;
    if (pending) { const p = pending; pending = null; submit(p); }
  }
}

export async function syncSpeedrun(timeMs) {
  if (!timeMs || timeMs <= 0) return;
  const id = getIdentity();
  await submit({ player_id: id.id, player_name: id.name, kind: 'speedrun', time_ms: timeMs });
}

export async function syncDeathRun({ deaths, timeMs, ngPlus }) {
  const id = getIdentity();
  await submit({ player_id: id.id, player_name: id.name, kind: 'deathrun', deaths: deaths || 0, time_ms: timeMs || 0, ng_plus: !!ngPlus });
}

export async function fetchLeaderboard(limit = 50) {
  try {
    return await base44.entities.LeaderboardEntry.list('-achievement_count', limit);
  } catch (e) { return []; }
}

export async function fetchSpeedruns(limit = 50) {
  try {
    return await base44.entities.LeaderboardEntry.filter({ best_time_ms: { $gt: 0 } }, 'best_time_ms', limit);
  } catch (e) { return []; }
}

// Least Deaths: sorted by fewest deaths, ties broken by faster completion time.
export async function fetchDeathRuns(limit = 50) {
  try {
    const all = await base44.entities.LeaderboardEntry.list(null, 200);
    const rows = (all || []).filter(r => !!r.completed_at);
    rows.sort((a, b) => (a.deaths || 0) - (b.deaths || 0) || (a.completion_time_ms || 0) - (b.completion_time_ms || 0));
    return rows.slice(0, limit);
  } catch (e) { return []; }
}

export async function fetchMyDeathRun() {
  const id = getIdentity();
  try {
    const rows = await base44.entities.LeaderboardEntry.filter({ player_id: id.id });
    return rows && rows[0] ? rows[0] : null;
  } catch (e) { return null; }
}

// Local fallback leaderboard (offline / not available) — one record per
// completion, kept in the browser. Shown when the online board is empty.
const LOCAL_KEY = 'hunt_death_runs_v1';
export function recordLocalDeathRun({ deaths, timeMs, ngPlus }) {
  try {
    const id = getIdentity();
    const runs = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    runs.push({ player_id: id.id, name: id.name, deaths: deaths || 0, timeMs: timeMs || 0, ngPlus: !!ngPlus, completedAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(runs));
  } catch (e) {}
}
export function fetchLocalDeathRuns() {
  try {
    const runs = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    runs.sort((a, b) => (a.deaths || 0) - (b.deaths || 0) || (a.timeMs || 0) - (b.timeMs || 0));
    return runs;
  } catch (e) { return []; }
}