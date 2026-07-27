// SubmitScore — public, anonymous leaderboard submission endpoint.
// Runs as the service role (bypassing RLS) so players never need to sign in.
// All inputs are validated/sanitized server-side and implausible values are
// rejected, so the boards cannot be trivially exploited (e.g. 0-death / 0-time
// submissions). Direct SDK writes to the entity are blocked by RLS, forcing
// every score through this function.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const TOTAL_MAX = 200;
const MIN_TIME_MS = 120000;     // 2 minutes — no real completion can be faster
const MAX_TIME_MS = 86400000;    // 24 hours
const MAX_DEATHS = 9999;

function cleanName(raw) {
  const s = String(raw || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return s.slice(0, 24) || 'Hunter';
}
function cleanId(raw) {
  return String(raw || '').trim().slice(0, 64);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const playerId = cleanId(body.player_id);
    const playerName = cleanName(body.player_name);
    const kind = body.kind;
    if (!playerId) return Response.json({ error: 'missing player_id' }, { status: 400 });
    if (!['achievements', 'speedrun', 'deathrun'].includes(kind)) {
      return Response.json({ error: 'invalid kind' }, { status: 400 });
    }
    const total = Math.max(1, Math.min(TOTAL_MAX, Math.floor(Number(body.total) || 36)));

    const existing = await base44.asServiceRole.entities.LeaderboardEntry.filter({ player_id: playerId });
    const rec = existing && existing[0] ? existing[0] : null;
    const now = new Date().toISOString();
    let patch = {};
    let create = null;

    if (kind === 'achievements') {
      const count = Math.max(0, Math.min(TOTAL_MAX, Math.floor(Number(body.count) || 0)));
      const earnedIds = String(body.earned_ids || '').slice(0, 4000);
      if (rec) {
        if (count > (rec.achievement_count || 0) || rec.player_name !== playerName || rec.total !== total) {
          patch = { player_name: playerName, achievement_count: count, earned_ids: earnedIds, total };
        }
      } else {
        create = { player_name: playerName, player_id: playerId, achievement_count: count, total, earned_ids: earnedIds };
      }
    } else if (kind === 'speedrun') {
      const timeMs = Math.floor(Number(body.time_ms) || 0);
      if (timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS) {
        return Response.json({ error: 'implausible time' }, { status: 400 });
      }
      if (rec) {
        const best = rec.best_time_ms;
        if (!best || timeMs < best) patch = { player_name: playerName, best_time_ms: timeMs };
        else if (rec.player_name !== playerName) patch = { player_name: playerName };
      } else {
        create = { player_name: playerName, player_id: playerId, best_time_ms: timeMs, achievement_count: 0, total, earned_ids: '' };
      }
    } else { // deathrun
      const deaths = Math.max(0, Math.min(MAX_DEATHS, Math.floor(Number(body.deaths) || 0)));
      const timeMs = Math.floor(Number(body.time_ms) || 0);
      const ngPlus = !!body.ng_plus;
      if (timeMs && (timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS)) {
        return Response.json({ error: 'implausible time' }, { status: 400 });
      }
      if (rec) {
        const hasRun = !!rec.completed_at;
        const cur = rec.deaths ?? 0;
        const better = !hasRun || deaths < cur || (deaths === cur && timeMs && (!rec.completion_time_ms || timeMs < rec.completion_time_ms));
        if (better) patch = { player_name: playerName, deaths, completion_time_ms: timeMs || 0, completed_at: now, ng_plus: ngPlus };
        else if (rec.player_name !== playerName) patch = { player_name: playerName };
      } else {
        create = { player_name: playerName, player_id: playerId, deaths, completion_time_ms: timeMs || 0, completed_at: now, ng_plus: ngPlus, achievement_count: 0, total, earned_ids: '' };
      }
    }

    let row = rec;
    if (create) row = await base44.asServiceRole.entities.LeaderboardEntry.create(create);
    else if (Object.keys(patch).length) row = await base44.asServiceRole.entities.LeaderboardEntry.update(rec.id, patch);

    return Response.json({ ok: true, row });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});