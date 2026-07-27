// LanternRest.jsx — the "rest at a lantern" menu. Offers Reflect (level up),
// Satchel (inventory/charms), Travel, and Replay Memories (relive any defeated
// boss as a no-progress practice fight). Main-world lanterns offer travel to the
// Hunter's Nightmare; the hub lantern lists every discovered main-world lantern.

import React, { useState } from 'react';
import { MEMORY_BOSSES } from '@/game/MemorySystem';

export default function LanternRest({ game, info }) {
  const [memOpen, setMemOpen] = useState(false);
  if (!info) return null;
  const g = game.current;
  if (!g) return null;
  const close = () => g.closeLanternRest();
  const reflect = () => g.lanternReflect();
  const satchel = () => g.lanternOpenInventory();
  const defeated = g.defeatedBosses || new Set();
  const memories = MEMORY_BOSSES.filter(b => b.id !== 'final' && defeated.has(b.id));
  const startMemory = (id) => { g.closeLanternRest(); g.startMemory(id); };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.82)' }} onClick={close}>
      <div className="w-full max-w-md border bg-stone-950/95 p-6 md:p-7 animate-rise" onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(200,150,60,0.4)', boxShadow: '0 0 40px rgba(200,150,60,0.12)' }}>
        <div className="text-center mb-5">
          <p className="text-amber-300/60 tracking-[0.4em] uppercase text-xs mb-1">Rest at the Lantern</p>
          <h2 className="text-stone-100 text-lg" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{info.name}</h2>
        </div>

        {memOpen ? (
          <div className="space-y-2">
            <button onClick={() => setMemOpen(false)}
              className="text-amber-200/70 text-[11px] tracking-[0.25em] uppercase mb-1 hover:underline">‹ Back</button>
            {memories.length === 0 ? (
              <p className="text-stone-500 text-xs italic text-center py-4">No memories yet. Slay a great beast to relive the hunt.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {memories.map(b => (
                  <button key={b.id} onClick={() => startMemory(b.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 border border-stone-800 hover:border-amber-700/60 hover:bg-amber-900/10 transition-colors text-left">
                    <span className="text-amber-400/80">↻</span>
                    <div>
                      <div className="text-stone-200 text-sm" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{b.name}</div>
                      <div className="text-stone-500 text-[10px] tracking-widest uppercase">{b.region}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-stone-600 text-[10px] italic text-center pt-1">Memories are practice only — no reward, no effect on the world.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <LRButton onClick={reflect} glyph="✦" title="Reflect" sub="Channel essence to grow stronger (Level Up)" />
            <LRButton onClick={satchel} glyph="❖" title="Satchel" sub="Manage charms & inventory" />
            <LRButton onClick={() => setMemOpen(true)} glyph="↻" title="Replay Memories"
              sub={memories.length ? `Relive ${memories.length} defeated hunt${memories.length === 1 ? '' : 's'}` : 'No memories yet'}
              disabled={memories.length === 0} />

            {info.isHub ? (
              <div className="pt-1">
                <p className="text-amber-200/60 text-[10px] tracking-[0.3em] uppercase mb-1.5 text-center">Travel to a Lantern</p>
                {info.lanterns.length === 0 ? (
                  <p className="text-stone-500 text-xs italic text-center py-2">No lanterns discovered yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {info.lanterns.map((l, i) => (
                      <button key={i} onClick={() => g.travelToWorldLantern(l.x, l.y)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 border border-stone-800 hover:border-amber-700/60 hover:bg-amber-900/10 transition-colors text-left">
                        <span className="text-amber-400/80">🏮</span>
                        <span className="text-stone-200 text-sm" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{l.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <LRButton onClick={() => g.travelToHub()} glyph="☾" title="Travel to the Hunter's Nightmare" sub="Return to the safe haven" />
            )}
          </div>
        )}

        <button onClick={close}
          className="mt-6 w-full py-2.5 text-stone-400 tracking-[0.3em] uppercase text-xs border border-stone-800 hover:border-stone-600 hover:text-stone-200 transition-colors">
          Leave the Lantern
        </button>
      </div>
      <style>{`@keyframes rise { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } } .animate-rise { animation: rise 0.22s ease-out both; }`}</style>
    </div>
  );
}

function LRButton({ onClick, glyph, title, sub, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3 border border-stone-700 hover:border-amber-700/60 hover:bg-amber-900/10 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed">
      <span className="text-amber-400/80 text-lg w-6 text-center">{glyph}</span>
      <div>
        <div className="text-stone-200 text-sm" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{title}</div>
        <div className="text-stone-500 text-[11px] italic">{sub}</div>
      </div>
    </button>
  );
}