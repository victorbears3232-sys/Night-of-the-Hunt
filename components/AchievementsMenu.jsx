// AchievementsMenu.jsx — the Hunter's record of deeds. Shown from the pause
// menu. Lists every achievement (locked ones stay visible to entice exploration)
// with name, description, unlock date, and live progress for multi-step goals.

import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '@/game/Achievements';

const CATEGORIES = [
  { id: 'boss', label: 'Beast Hunts' },
  { id: 'explore', label: 'Exploration' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'quest', label: 'Questlines' },
  { id: 'meta', label: 'Legend' },
];

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function AchievementsMenu({ game }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const g = game.current;
  const earned = (g && g.achievements && g.achievements.earned) || new Set();
  const dates = (g && g.achievements && g.achievements.dates) || {};
  const total = ACHIEVEMENTS.length;
  const earnedCount = earned.size;

  return (
    <div className="flex flex-col">
      <h3 className="text-center text-xl mb-1" style={{ color: '#d8c89a' }}>Achievements</h3>
      <p className="text-center text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: '#7a5a3a' }}>
        {earnedCount} / {total} Earned
      </p>
      <div className="w-full h-1 mb-4" style={{ background: 'rgba(80,60,30,0.35)' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(earnedCount / total) * 100}%`, background: 'linear-gradient(90deg,#8a6020,#d4a050)' }} />
      </div>

      <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
        {CATEGORIES.map(cat => {
          const items = ACHIEVEMENTS.filter(a => a.cat === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-1.5" style={{ color: '#6a4a2a' }}>— {cat.label} —</p>
              <div className="flex flex-col gap-1.5">
                {items.map(a => {
                  const isEarned = earned.has(a.id);
                  let prog = null;
                  if (!isEarned && a.progress) { try { prog = a.progress(g); } catch (e) { prog = null; } }
                  return (
                    <div key={a.id} className="flex items-stretch gap-2.5 px-2.5 py-2 transition-colors"
                      style={{ border: `1px solid ${isEarned ? 'rgba(180,140,70,0.45)' : 'rgba(80,60,40,0.3)'}`, background: isEarned ? 'rgba(160,120,50,0.10)' : 'rgba(20,16,14,0.5)' }}>
                      <div className="flex items-center justify-center w-9 shrink-0"
                        style={{ background: isEarned ? 'linear-gradient(160deg, rgba(200,160,90,0.22), rgba(40,30,20,0.5))' : 'rgba(30,24,20,0.6)' }}>
                        <span className="text-lg" style={{ filter: isEarned ? 'drop-shadow(0 0 5px rgba(220,180,90,0.6))' : 'grayscale(1) opacity(0.5)' }}>{a.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[13px] leading-tight truncate" style={{ color: isEarned ? '#e8d4a0' : '#9a8a6a', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{a.title}</p>
                          <span className="text-[9px] tracking-[0.2em] uppercase shrink-0" style={{ color: isEarned ? '#b89858' : '#5a4a3a' }}>
                            {isEarned ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug mt-0.5" style={{ color: '#8a7a5a' }}>{a.desc}</p>
                        {isEarned ? (
                          <p className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: '#6a5a3a' }}>{fmtDate(dates[a.id])}</p>
                        ) : prog && prog.max > 0 ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1" style={{ background: 'rgba(60,50,40,0.6)' }}>
                              <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (prog.cur / prog.max) * 100)}%`, background: 'linear-gradient(90deg,#5a4a2a,#9a8040)' }} />
                            </div>
                            <span className="text-[9px] font-mono shrink-0" style={{ color: '#7a6a4a' }}>{Math.min(prog.cur, prog.max)}/{prog.max} {prog.label}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}