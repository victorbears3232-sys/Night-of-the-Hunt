// PauseMenu.jsx — the Hunter's PauseMenu. Opens with Esc (engine pauses).
// Gothic dark panel with Resume, Controls, Settings, and Return to Title.
// The engine owns the Esc key (closes this menu); buttons here drive navigation.

import React, { useEffect, useState } from 'react';
import AchievementsMenu from '@/components/AchievementsMenu';
import LeaderboardMenu from '@/components/LeaderboardMenu';
import * as Tutorial from '@/game/Tutorial';

const BINDINGS = [
  ['WASD', 'Move'],
  ['Space', 'Dodge'],
  ['L-Click / J', 'Light attack'],
  ['R-Click / K (hold)', 'Heavy / Charged'],
  ['R', 'Fire pistol (parry)'],
  ['F', 'Transform weapon'],
  ['Q', 'Lock on'],
  ['E', 'Interact / Level up'],
  ['V', 'Draught (heal)'],
  ['Tab', 'Satchel'],
  ['L / M', 'Hunter\'s Journal / Map'],
  ['G', 'Molotov'],
  ['N', 'Mute sound'],
  ['Esc', 'Pause'],
  ['Parry → Light', 'Visceral attack'],
];

export default function PauseMenu({ game }) {
  const [view, setView] = useState('main');
  const [, force] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Keep mute label fresh.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);

  const resume = () => game.current && game.current.closePause();
  const toTitle = () => window.location.reload();

  const toggleMute = () => {
    if (!game.current) return;
    const m = game.current.sound.toggleMute();
    game.current.hooks.onMessage && game.current.hooks.onMessage(m ? 'Sound muted' : 'Sound on', 1200);
    force((n) => n + 1);
  };
  const muted = !!(game.current && game.current.sound && game.current.sound.muted);
  const tutorialEnabled = !!(game.current && game.current.tutorial && game.current.tutorial.enabled);
  const toggleTutorial = () => {
    if (!game.current || !game.current.tutorial) return;
    Tutorial.setEnabled(game.current, !game.current.tutorial.enabled);
    force((n) => n + 1);
  };

  const panel = {
    background: 'linear-gradient(160deg, rgba(18,12,16,0.97), rgba(8,6,10,0.98))',
    border: '1px solid rgba(160,120,50,0.35)',
    boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(160,120,50,0.18)',
    fontFamily: 'ui-serif, Georgia, serif',
  };
  const btn = (label, onClick, danger) => ({
    onClick,
    className: 'group w-full text-left px-5 py-3 tracking-[0.3em] uppercase text-sm transition-colors',
    style: {
      color: danger ? '#a85a3a' : '#c9b48a',
      border: `1px solid ${danger ? 'rgba(140,60,40,0.4)' : 'rgba(122,82,48,0.4)'}`,
      background: 'transparent',
      fontFamily: 'ui-serif, Georgia, serif',
    },
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.78)' }}>
      <div className="relative w-full max-w-md p-6 md:p-8" style={panel}>
        {/* corner flourishes */}
        {['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((c, i) => (
          <span key={i} className={`absolute w-3.5 h-3.5 border-amber-700/40 ${c}`} />
        ))}

        {view === 'main' && !confirmQuit && (
          <div className="flex flex-col items-center">
            <p className="tracking-[0.5em] uppercase text-[11px] mb-1" style={{ color: '#7a5a3a' }}>— Stillness —</p>
            <h2 className="text-2xl md:text-3xl mb-6" style={{ color: '#d8c89a', textShadow: '0 0 18px rgba(180,140,70,0.25)' }}>Paused</h2>
            {game.current && game.current.ngPlus && (
              <p className="-mt-3 mb-5 tracking-[0.4em] uppercase text-[10px]" style={{ color: '#b48ad6' }}>✦ New Game+ ✦</p>
            )}
            <div className="w-full flex flex-col gap-2.5">
              <button {...btn('Resume', resume)} className="btn-primary w-full text-left px-5 py-3 tracking-[0.3em] uppercase text-sm transition-colors"
                style={{ color: '#e8d4a0', border: '1px solid rgba(180,140,70,0.55)', background: 'rgba(160,120,50,0.12)', fontFamily: 'ui-serif, Georgia, serif' }}>
                Resume the Hunt
              </button>
              <button {...btn('Achievements', () => setView('achievements'))}>Achievements</button>
              <button {...btn('Leaderboard', () => setView('leaderboard'))}>Leaderboard</button>
              <button {...btn('Controls', () => setView('controls'))}>Controls</button>
              <button {...btn('Settings', () => setView('settings'))}>Settings</button>
              <button {...btn('Return to Title', () => setConfirmQuit(true), true)}>Return to Title</button>
            </div>
            <p className="mt-5 text-[10px] tracking-[0.35em] uppercase" style={{ color: '#5a4a3a' }}>Press Esc to resume</p>
          </div>
        )}

        {view === 'controls' && (
          <div className="flex flex-col">
            <h3 className="text-center text-xl mb-4" style={{ color: '#d8c89a' }}>Controls</h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 max-h-[52vh] overflow-y-auto pr-1">
              {BINDINGS.map(([k, v]) => (
                <div key={k} className="flex justify-between items-center gap-2 border-b border-amber-900/15 py-1">
                  <span className="text-amber-100/85 font-mono text-[12px]">{k}</span>
                  <span className="text-stone-400 text-[12px] text-right">{v}</span>
                </div>
              ))}
            </div>
            <BackBtn onClick={() => setView('main')} />
          </div>
        )}

        {view === 'settings' && (
          <div className="flex flex-col">
            <h3 className="text-center text-xl mb-5" style={{ color: '#d8c89a' }}>Settings</h3>
            <button onClick={toggleMute}
              className="w-full flex items-center justify-between px-5 py-3 transition-colors"
              style={{ color: '#c9b48a', border: '1px solid rgba(122,82,48,0.4)', fontFamily: 'ui-serif, Georgia, serif' }}>
              <span className="tracking-[0.3em] uppercase text-sm">Sound</span>
              <span className="tracking-[0.25em] uppercase text-xs" style={{ color: muted ? '#a85a3a' : '#8a9a6a' }}>{muted ? 'Muted' : 'On'}</span>
            </button>
            <button onClick={toggleTutorial}
              className="w-full flex items-center justify-between px-5 py-3 mt-2.5 transition-colors"
              style={{ color: '#c9b48a', border: '1px solid rgba(122,82,48,0.4)', fontFamily: 'ui-serif, Georgia, serif' }}>
              <span className="tracking-[0.3em] uppercase text-sm">Tutorial Hints</span>
              <span className="tracking-[0.25em] uppercase text-xs" style={{ color: tutorialEnabled ? '#8a9a6a' : '#a85a3a' }}>{tutorialEnabled ? 'On' : 'Off'}</span>
            </button>
            <p className="text-center text-[10px] mt-4 tracking-widest uppercase" style={{ color: '#5a4a3a' }}>Further settings shall be uncovered in time.</p>
            <BackBtn onClick={() => setView('main')} />
          </div>
        )}

        {view === 'achievements' && (
          <div className="flex flex-col">
            <AchievementsMenu game={game} />
            <BackBtn onClick={() => setView('main')} />
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="flex flex-col">
            <LeaderboardMenu />
            <BackBtn onClick={() => setView('main')} />
          </div>
        )}

        {confirmQuit && (
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xl mb-2" style={{ color: '#d8c89a' }}>Abandon the Hunt?</h3>
            <p className="text-sm italic mb-6 max-w-xs" style={{ color: '#8a7a5a' }}>All unrecorded progress will be lost. The Quarter will not remember you turned away.</p>
            <div className="w-full flex gap-2.5">
              <button onClick={() => setConfirmQuit(false)}
                className="flex-1 py-2.5 tracking-[0.25em] uppercase text-xs transition-colors hover:bg-amber-900/10"
                style={{ color: '#c9b48a', border: '1px solid rgba(122,82,48,0.4)', fontFamily: 'ui-serif, Georgia, serif' }}>Stay</button>
              <button onClick={toTitle}
                className="flex-1 py-2.5 tracking-[0.25em] uppercase text-xs transition-colors hover:bg-red-950/30"
                style={{ color: '#a85a3a', border: '1px solid rgba(140,60,40,0.5)', fontFamily: 'ui-serif, Georgia, serif' }}>Return to Title</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .btn-primary:hover { background: rgba(160,120,50,0.22) !important; }
      `}</style>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="mt-5 w-full py-2.5 text-[11px] tracking-[0.35em] uppercase transition-colors hover:bg-amber-900/10"
      style={{ color: '#7a5a3a', border: '1px solid rgba(122,82,48,0.35)', fontFamily: 'ui-serif, Georgia, serif' }}>
      ‹ Back
    </button>
  );
}