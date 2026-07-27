// LeaderboardMenu.jsx — global rankings of Hunters: by achievements earned, by
// fastest speedrun, or by fewest deaths to clear the game. Shown from the pause
// menu and the title screen. No sign-in required: each browser has a stable
// anonymous identity, and the player can optionally set a display name.

import React, { useEffect, useState } from 'react';
import { getIdentity, setPlayerName } from '@/game/PlayerIdentity';
import { fetchLeaderboard, fetchSpeedruns, fetchDeathRuns, fetchMyDeathRun, fetchLocalDeathRuns } from '@/game/Leaderboard';
import { ACHIEVEMENTS } from '@/game/Achievements';

function fmtTime(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  try { const d = new Date(iso); return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch (e) { return '—'; }
}

export default function LeaderboardMenu() {
  const [identity, setIdentity] = useState(getIdentity);
  const [nameInput, setNameInput] = useState(identity.name);
  const total = ACHIEVEMENTS.length;
  const [tab, setTab] = useState('achievements');
  const [rows, setRows] = useState(null);
  const [mine, setMine] = useState(null);
  const [local, setLocal] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setRows(null);
    if (tab === 'achievements') setRows(await fetchLeaderboard(50));
    else if (tab === 'speedruns') setRows(await fetchSpeedruns(50));
    else {
      const [d, m, loc] = await Promise.all([fetchDeathRuns(50), fetchMyDeathRun(), fetchLocalDeathRuns()]);
      setRows(d); setMine(m); setLocal(loc);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [tab]);

  const saveName = () => {
    setPlayerName(nameInput);
    setIdentity(getIdentity());
    load();
  };

  const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null);
  const myId = identity.id;

  return (
    <div className="flex flex-col">
      <h3 className="text-center text-xl mb-1" style={{ color: '#d8c89a' }}>Hunter's Leaderboard</h3>
      <div className="flex justify-center gap-1.5 mb-3">
        <TabBtn active={tab === 'achievements'} onClick={() => setTab('achievements')}>Achievements</TabBtn>
        <TabBtn active={tab === 'speedruns'} onClick={() => setTab('speedruns')}>Speedruns</TabBtn>
        <TabBtn active={tab === 'deaths'} onClick={() => setTab('deaths')}>Least Deaths</TabBtn>
      </div>

      {/* Optional display name — no account required */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
          maxLength={24}
          placeholder="Your name"
          className="px-2 py-1 text-[12px] bg-black/40 text-center"
          style={{ border: '1px solid rgba(180,140,70,0.5)', color: '#e8d4a0', fontFamily: 'ui-serif, Georgia, serif', width: 150 }}
        />
        <button onClick={saveName}
          className="px-3 py-1 text-[10px] tracking-[0.3em] uppercase transition-colors hover:bg-amber-900/10"
          style={{ color: '#e8d4a0', border: '1px solid rgba(180,140,70,0.5)', fontFamily: 'ui-serif, Georgia, serif' }}>
          Set
        </button>
      </div>

      <div className="flex justify-end mb-2">
        <button onClick={load} className="text-[10px] tracking-[0.25em] uppercase px-3 py-1 transition-colors hover:bg-amber-900/10"
          style={{ color: '#9a8a5a', border: '1px solid rgba(122,82,48,0.35)' }}>Refresh</button>
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1">
        {loading && rows === null ? (
          <p className="text-center text-sm py-8" style={{ color: '#7a6a4a' }}>Gathering the names of Hunters…</p>
        ) : (!rows || rows.length === 0) && !(tab === 'deaths' && local.length > 0) ? (
          <p className="text-center text-sm py-8" style={{ color: '#7a6a4a' }}>
            {tab === 'achievements'
              ? 'No Hunters have recorded their deeds yet. Be the first.'
              : tab === 'speedruns'
                ? 'No speedruns recorded yet. Slay the First Beast to inscribe your time.'
                : 'No completions recorded yet. Slay the First Beast to inscribe your tally.'}
          </p>
        ) : tab === 'achievements' ? (
          <div className="flex flex-col gap-1">
            {rows.map((r, i) => {
              const isMe = r.player_id === myId;
              const ct = r.achievement_count || 0;
              const tt = r.total || total;
              return (
                <div key={r.id} className="flex items-center gap-2.5 px-3 py-2"
                  style={{ border: `1px solid ${isMe ? 'rgba(180,140,70,0.55)' : 'rgba(80,60,40,0.3)'}`, background: isMe ? 'rgba(160,120,50,0.14)' : 'rgba(20,16,14,0.5)' }}>
                  <span className="w-7 text-center text-base">{medal(i) || <span className="text-[12px] font-mono" style={{ color: '#7a6a4a' }}>{i + 1}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ color: isMe ? '#e8d4a0' : '#c9b48a' }}>
                      {r.player_name}
                      {isMe && <span className="ml-2 text-[9px] tracking-widest uppercase" style={{ color: '#b89858' }}>You</span>}
                    </p>
                    <div className="h-1 mt-1" style={{ background: 'rgba(60,50,40,0.6)' }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (ct / tt) * 100)}%`, background: 'linear-gradient(90deg,#5a4a2a,#9a8040)' }} />
                    </div>
                  </div>
                  <span className="text-[12px] font-mono shrink-0" style={{ color: ct >= tt ? '#d4a050' : '#8a7a5a' }}>{ct}/{tt}</span>
                </div>
              );
            })}
          </div>
        ) : tab === 'speedruns' ? (
          <div className="flex flex-col gap-1">
            {rows.map((r, i) => {
              const isMe = r.player_id === myId;
              const t = r.best_time_ms || 0;
              return (
                <div key={r.id} className="flex items-center gap-2.5 px-3 py-2"
                  style={{ border: `1px solid ${isMe ? 'rgba(180,140,70,0.55)' : 'rgba(80,60,40,0.3)'}`, background: isMe ? 'rgba(160,120,50,0.14)' : 'rgba(20,16,14,0.5)' }}>
                  <span className="w-7 text-center text-base">{medal(i) || <span className="text-[12px] font-mono" style={{ color: '#7a6a4a' }}>{i + 1}</span>}</span>
                  <p className="flex-1 min-w-0 text-[13px] truncate" style={{ color: isMe ? '#e8d4a0' : '#c9b48a' }}>
                    {r.player_name}
                    {isMe && <span className="ml-2 text-[9px] tracking-widest uppercase" style={{ color: '#b89858' }}>You</span>}
                  </p>
                  <span className="text-[13px] font-mono shrink-0" style={{ color: i === 0 ? '#d4a050' : '#8a7a5a' }}>{fmtTime(t)}</span>
                </div>
              );
            })}
          </div>
        ) : (() => {
          const dispRows = rows && rows.length > 0
            ? rows
            : local.map((r, i) => ({ id: 'loc_' + i, player_name: r.name, deaths: r.deaths, completion_time_ms: r.timeMs, completed_at: r.completedAt, ng_plus: r.ngPlus, player_id: r.player_id || null }));
          const myLocal = local.find(r => r.player_id === myId) || local[0];
          const bestRun = (mine && mine.completed_at) ? mine : (myLocal ? { deaths: myLocal.deaths, completion_time_ms: myLocal.timeMs, ng_plus: myLocal.ngPlus } : null);
          return (
            <div className="flex flex-col gap-1">
              {bestRun && (
                <div className="mb-2 px-3 py-2 text-center" style={{ border: '1px solid rgba(180,140,70,0.4)', background: 'rgba(160,120,50,0.10)' }}>
                  <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: '#9a8a5a' }}>Your best — </span>
                  <span className="text-[13px] font-mono" style={{ color: '#e8d4a0' }}>{bestRun.deaths ?? 0} deaths</span>
                  <span className="text-[10px] mx-2" style={{ color: '#5a4a3a' }}>·</span>
                  <span className="text-[12px] font-mono" style={{ color: '#8a7a5a' }}>{fmtTime(bestRun.completion_time_ms)}</span>
                  {bestRun.ng_plus && <span className="ml-2 text-[9px] tracking-widest uppercase" style={{ color: '#b48ad6' }}>NG+</span>}
                </div>
              )}
              {dispRows.map((r, i) => {
                const isMe = r.player_id === myId;
                return (
                  <div key={r.id} className="flex items-center gap-2.5 px-3 py-2"
                    style={{ border: `1px solid ${isMe ? 'rgba(180,140,70,0.55)' : 'rgba(80,60,40,0.3)'}`, background: isMe ? 'rgba(160,120,50,0.14)' : 'rgba(20,16,14,0.5)' }}>
                    <span className="w-7 text-center text-base">{medal(i) || <span className="text-[12px] font-mono" style={{ color: '#7a6a4a' }}>{i + 1}</span>}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate" style={{ color: isMe ? '#e8d4a0' : '#c9b48a' }}>
                        {r.player_name}
                        {isMe && <span className="ml-2 text-[9px] tracking-widest uppercase" style={{ color: '#b89858' }}>You</span>}
                        {r.ng_plus && <span className="ml-1.5 text-[9px] tracking-widest uppercase" style={{ color: '#b48ad6' }}>NG+</span>}
                      </p>
                      <p className="text-[10px]" style={{ color: '#5a4a3a' }}>{fmtDate(r.completed_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-mono" style={{ color: i === 0 ? '#d4a050' : '#c9b48a' }}>{r.deaths ?? 0}<span className="text-[9px] ml-1" style={{ color: '#5a4a3a' }}>deaths</span></p>
                      <p className="text-[10px] font-mono" style={{ color: '#7a6a4a' }}>{fmtTime(r.completion_time_ms)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase transition-colors"
      style={{
        color: active ? '#e8d4a0' : '#8a7a5a',
        border: `1px solid ${active ? 'rgba(180,140,70,0.55)' : 'rgba(122,82,48,0.35)'}`,
        background: active ? 'rgba(160,120,50,0.14)' : 'transparent',
        fontFamily: 'ui-serif, Georgia, serif',
      }}>
      {children}
    </button>
  );
}