// QuestLog.jsx — the hunter's journal. Rendered when the engine fires
// onQuestLogToggle (the 'L' key). Closing calls toggleQuestLog again, which
// clears the pause and hides the overlay.

import React from 'react';

export default function QuestLog({ game, quests }) {
  if (!quests || quests.length === 0) return null;

  const close = () => game.current && game.current.toggleQuestLog();

  const statusLabel = (s) => s === 'return'
    ? { t: 'Return to complete', c: 'text-amber-300/80' }
    : { t: 'In progress', c: 'text-stone-400' };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={close}>
      <div className="w-full max-w-lg border border-amber-900/40 bg-stone-950/95 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 40px rgba(180,140,80,0.08)' }}>
        <div className="text-center mb-5">
          <p className="text-amber-300/60 tracking-[0.4em] uppercase text-xs mb-1">Hunter's Journal</p>
          <h2 className="text-stone-100 text-xl tracking-wide">Active Undertakings</h2>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {quests.map((q) => {
            const s = statusLabel(q.status);
            return (
              <div key={q.npcId} className="border border-stone-800/60 bg-black/30 px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-stone-200 text-sm font-semibold">{q.questTitle}</span>
                  <span className={`text-[10px] tracking-widest uppercase ${s.c}`}>{s.t}</span>
                </div>
                <p className="text-amber-300/50 text-[10px] tracking-widest uppercase mb-1">{q.name} — {q.title}</p>
                <p className="text-stone-400 text-xs italic">{q.objective}</p>
              </div>
            );
          })}
        </div>

        <button onClick={close}
          className="mt-6 w-full py-2.5 text-stone-400 tracking-[0.3em] uppercase text-xs border border-stone-800 hover:border-stone-600 hover:text-stone-200 transition-colors">
          Close Journal (L)
        </button>
      </div>
    </div>
  );
}