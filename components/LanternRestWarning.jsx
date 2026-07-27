// LanternRestWarning.jsx — confirmation shown when the hunter chooses to rest at
// a lantern. Makes the consequence of resting explicit before committing:
// resting restores health and healing items, but every defeated non-boss enemy
// returns to its post. "Rest" performs the rest and opens the lantern menu;
// "Leave" cancels without resting.

import React from 'react';

export default function LanternRestWarning({ game, info }) {
  if (!info) return null;
  const g = game.current;
  if (!g) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.82)' }}>
      <div className="w-full max-w-sm border bg-stone-950/95 p-6 animate-rise text-center"
        style={{ borderColor: 'rgba(200,150,60,0.4)', boxShadow: '0 0 40px rgba(200,150,60,0.12)', fontFamily: 'ui-serif, Georgia, serif' }}>
        <p className="text-amber-300/60 tracking-[0.4em] uppercase text-xs mb-2">Rest at the Lantern</p>
        <h2 className="text-stone-100 text-lg mb-4">{info.name}</h2>
        <p className="text-stone-300 text-sm leading-relaxed mb-5 italic">
          Resting will restore your health and healing items, but all defeated non-boss enemies will return.
        </p>
        <div className="flex gap-2.5">
          <button onClick={() => g.cancelRest()}
            className="flex-1 py-3 tracking-[0.25em] uppercase text-xs transition-colors hover:bg-stone-800/40"
            style={{ color: '#9a8a6a', border: '1px solid rgba(122,100,60,0.4)' }}>Leave</button>
          <button onClick={() => g.confirmRest()}
            className="flex-1 py-3 tracking-[0.25em] uppercase text-xs transition-colors hover:bg-amber-900/20"
            style={{ color: '#e8d4a0', border: '1px solid rgba(180,140,70,0.55)', background: 'rgba(160,120,50,0.12)' }}>Rest</button>
        </div>
      </div>
      <style>{`@keyframes rise { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } } .animate-rise { animation: rise 0.22s ease-out both; }`}</style>
    </div>
  );
}