// EndCredits.jsx — the open-ended ending sequence shown after the final boss.
// Mysterious, deliberately unresolved; returns the Hunter to the Sanctuary so
// the world stays open for continued exploration.

import React from 'react';

export default function EndCredits({ game, visible }) {
  if (!visible) return null;
  const trueEnd = !!(game && game.current && game.current.trueEnding);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(22,16,32,0.86) 0%, rgba(0,0,0,0.97) 80%)' }}>
      <p className="text-purple-200/70 tracking-[0.5em] uppercase text-xs mb-4 animate-pulse">{trueEnd ? 'The True Hunt' : 'Nightmare Slain'}</p>
      <h2 className="text-4xl md:text-5xl text-stone-200 mb-6" style={{ textShadow: trueEnd ? '0 0 36px rgba(200,170,255,0.7)' : '0 0 30px rgba(170,120,220,0.5)' }}>
        {trueEnd ? 'The Celestial God' : 'The First Voice'}
      </h2>
      {trueEnd ? (
        <>
          <p className="text-stone-300 italic max-w-lg leading-relaxed mb-3">
            "The Sleeping Sky wakes. The One Beneath rises through the stone it was buried beneath, and the kingdom remembers why its first kings dug so deep, and kept so quiet. The Hunter set it free — and the Hunter is the only one left who knows the cost."
          </p>
          <p className="text-purple-300/70 text-xs max-w-md mb-10">
            The Hollow Quarter endures. The sky above it is no longer the sky it was. Perhaps that was always the mercy the kingdom could not afford.
          </p>
        </>
      ) : (
        <>
          <p className="text-stone-400 italic max-w-lg leading-relaxed mb-3">
            "The song that drowned a city falls silent at last. The water recedes, or does not. The Quarter keeps its secrets. Somewhere a lantern still burns — and the Hunter wakes, or does not."
          </p>
          <p className="text-stone-600 text-xs max-w-md mb-10">
            The Hollow Quarter endures. What the Chorus was, no living voice remembers. Perhaps that is mercy.
          </p>
        </>
      )}
      <div className="text-stone-500 text-[11px] tracking-widest uppercase mb-10 space-y-1.5">
        <p>The Hollow Quarter</p>
        <p className="text-stone-600">{trueEnd ? 'A Hunter\'s True Tale' : 'A Hunter\'s Tale'}</p>
      </div>
      <p className="text-stone-500 text-xs italic mb-6">{trueEnd ? 'The true hunt ends — or it begins anew.' : 'The Hunt is over — or it begins anew.'}</p>
      <div className="flex flex-col gap-3 items-center">
        <button onClick={() => game.current && game.current.finishEnding()}
          className="px-10 py-3 border border-amber-700/50 text-amber-200/90 tracking-[0.3em] text-sm uppercase hover:bg-amber-900/20 transition-all"
          style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
          Continue the Hunt
        </button>
        <button onClick={() => game.current && game.current.beginNewGamePlus()}
          className="px-10 py-3 border border-purple-500/60 text-purple-200 tracking-[0.3em] text-sm uppercase hover:bg-purple-900/30 hover:border-purple-400 transition-all"
          style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
          Begin New Game+
        </button>
      </div>
    </div>
  );
}