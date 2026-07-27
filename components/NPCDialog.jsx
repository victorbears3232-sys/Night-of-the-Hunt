// NPCDialog.jsx — one line at a time, with a Next prompt to advance.
// Rendered when the engine fires onNpcDialog. Closing unpauses the game.

import React, { useState, useEffect, useCallback } from 'react';
import GibberishVoice from '@/game/GibberishVoice';

const FIGURE_GLYPH = {
  hunter: '🗡',
  scholar: '📜',
  blacksmith: '⚒',
  pilgrim: '⛪',
  healer: '✚',
  child: '☾',
};

export default function NPCDialog({ game, dialog }) {
  const [index, setIndex] = useState(0);

  // Reset to first line whenever a new conversation starts.
  useEffect(() => { setIndex(0); }, [dialog && dialog.id, dialog && dialog.lines && dialog.lines.length]);

  // Cosmetic gibberish voice: play synthesized syllables while a line is shown,
  // and stop the instant the line changes or the conversation closes. This
  // only makes sound — it touches no dialogue logic, state, or rendering.
  useEffect(() => {
    if (!dialog || !dialog.lines || dialog.lines.length === 0) { GibberishVoice.stop(); return; }
    // Use the game's already-unlocked audio context so the voice actually
    // plays (a lazily-created context inside a post-render effect can stay
    // suspended under browser autoplay rules).
    const g = game.current;
    if (g && g.sound && g.sound.ctx) GibberishVoice.attach(g.sound.ctx, g.sound.master);
    const line = dialog.lines[index];
    if (line) GibberishVoice.speak(dialog.id, dialog.figure, line);
    return () => GibberishVoice.stop();
  }, [dialog, index]);

  const close = useCallback(() => game.current && game.current.closeDialog(), [game]);
  const total = dialog ? dialog.lines.length : 0;
  const isLast = index >= total - 1;

  const advance = useCallback(() => {
    if (!game.current) return;
    if (isLast) { close(); }
    else setIndex((i) => i + 1);
  }, [isLast, close, game]);

  // Keyboard: E / Enter / Space advances; Escape closes the whole conversation.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'e' || k === 'enter' || k === ' ' || k === 'spacebar') {
        e.preventDefault();
        e.stopPropagation();
        advance();
      } else if (k === 'escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [dialog, advance, close]);

  if (!dialog || total === 0) return null;
  const line = dialog.lines[index];
  const accent = dialog.color || '#8a7a5a';

  return (
    <div className="absolute inset-0 z-40 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={isLast ? close : advance}>
      <div className="w-full max-w-2xl border bg-stone-950/95 p-6 md:p-8 relative animate-rise"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: accent + '66', boxShadow: `0 0 40px ${accent}22` }}>
        {/* header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2"
            style={{ borderColor: accent, background: `radial-gradient(circle at 40% 35, ${accent}, #0c0a0a)` }}>
            <span className="text-2xl opacity-80" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}>
              {FIGURE_GLYPH[dialog.figure] || '·'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-stone-100 text-xl md:text-2xl tracking-wide">{dialog.name}</h2>
            {dialog.title && <p className="text-amber-300/60 text-[11px] tracking-[0.3em] uppercase">{dialog.title}</p>}
            {dialog.bio && index === 0 && <p className="text-stone-500 text-xs italic mt-1">{dialog.bio}</p>}
          </div>
          <div className="text-stone-600 text-[10px] tracking-widest uppercase shrink-0">
            {index + 1}/{total}
          </div>
        </div>

        {/* the single spoken line */}
        <div className="min-h-[4.5rem] flex items-center mb-6">
          <p key={index} className="text-stone-300 text-sm md:text-base leading-relaxed italic animate-fadeLine">
            “{line}”
          </p>
        </div>

        {/* reward notice shows on the final line */}
        {isLast && dialog.reward && (
          <div className="mb-5 px-4 py-3 border border-amber-800/40 bg-amber-900/10 animate-fadeLine">
            <p className="text-amber-300/80 text-[10px] tracking-[0.3em] uppercase mb-1">Received</p>
            <p className="text-amber-200/90 text-sm">
              {(Array.isArray(dialog.reward) ? dialog.reward : [dialog.reward]).map(r => r.label).join(' · ')}
            </p>
          </div>
        )}

        {/* footer prompt */}
        <div className="flex items-center justify-between">
          <span className="text-stone-600 text-[10px] tracking-widest uppercase">
            {isLast ? '— farewell —' : '— press E to continue —'}
          </span>
          <button onClick={isLast ? close : advance}
            className="px-6 py-2 border border-amber-800/50 text-amber-200/80 tracking-[0.3em] text-xs uppercase hover:bg-amber-900/20 transition-colors">
            {isLast ? 'End' : 'Next ▸'}
          </button>
        </div>

        <style>{`
          @keyframes fadeLine { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .animate-fadeLine { animation: fadeLine 0.35s ease-out both; }
          @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
          .animate-rise { animation: rise 0.25s ease-out both; }
        `}</style>
      </div>
    </div>
  );
}