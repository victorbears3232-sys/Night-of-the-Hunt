// Shop.jsx — Maren's trade counter in the Sanctuary. Spend essence on
// consumables and permanent conveniences; stock expands as prey are slain.

import React, { useEffect, useState } from 'react';

const ITEMS = [
  { id: 'vial', name: "Hunter's Draught", desc: '+1 draught', price: 60, effect: 'vials', amount: 1, unlock: () => true },
  { id: 'bullets', name: 'Quicksilver x5', desc: '+5 bullets', price: 50, effect: 'bullets', amount: 5, unlock: () => true },
  { id: 'molotov', name: 'Molotov', desc: '+3 molotovs', price: 70, effect: 'molotovs', amount: 3, unlock: () => true },
  { id: 'vial5', name: 'Bundle of Draughts', desc: '+5 draughts', price: 280, effect: 'vials', amount: 5, unlock: g => g.defeatedBosses.has('vicar') },
  { id: 'bullets20', name: 'Quicksilver Cache', desc: '+20 bullets', price: 220, effect: 'bullets', amount: 20, unlock: g => g.defeatedBosses.has('gascoigne') },
  { id: 'maxvial', name: 'Draught Belt', desc: '+1 Max Draughts (permanent)', price: 420, effect: 'maxvials', amount: 1, unlock: g => g.defeatedBosses.has('mire') },
];

export default function Shop({ game, shop }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 120);
    return () => clearInterval(id);
  }, []);

  if (!shop || !game.current) return null;
  const g = game.current;
  const p = g.player;
  const close = () => g.closeShop();
  const buy = (item) => g.buyItem(item);
  const available = ITEMS.filter(it => it.unlock(g));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.82)' }} onClick={close}>
      <div className="w-full max-w-lg border bg-stone-950/95 p-6 md:p-8 animate-rise"
        onClick={e => e.stopPropagation()}
        style={{ borderColor: (shop.def.color || '#6a8a5a') + '66', boxShadow: `0 0 40px ${shop.def.color || '#6a8a5a'}22` }}>
        <div className="text-center mb-5">
          <p className="text-amber-300/60 tracking-[0.4em] uppercase text-xs mb-1">The Sanctuary Trade</p>
          <h2 className="text-stone-100 text-xl">{shop.def.name} — {shop.def.title}</h2>
          <p className="text-stone-500 text-xs italic mt-1">{shop.def.intro || shop.def.bio}</p>
        </div>

        <div className="flex items-center justify-between px-3 py-2 mb-3 border border-stone-800 bg-black/40">
          <span className="text-stone-400 text-[10px] tracking-widest uppercase">Your essence</span>
          <span className="text-amber-300 font-mono text-sm">{Math.floor(p.essence)}</span>
        </div>

        <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
          {available.map(it => {
            const afford = p.essence >= it.price;
            return (
              <button key={it.id} disabled={!afford} onClick={() => buy(it)}
                className={`w-full flex items-center justify-between px-4 py-3 border transition-all
                  ${afford ? 'border-stone-700 hover:border-amber-700/60 hover:bg-amber-900/10 cursor-pointer' : 'border-stone-800 opacity-45 cursor-not-allowed'}`}>
                <div className="text-left">
                  <div className="text-stone-200 text-sm">{it.name}</div>
                  <div className="text-stone-600 text-[11px]">{it.desc}</div>
                </div>
                <span className={`font-mono text-xs ${afford ? 'text-amber-300' : 'text-stone-600'}`}>{it.price} ✦</span>
              </button>
            );
          })}
          {available.length <= 2 && (
            <p className="text-stone-600 text-[11px] italic text-center pt-2">Slay the Quarter's prey to expand my stock.</p>
          )}
        </div>

        <button onClick={close}
          className="mt-6 w-full py-2.5 text-stone-400 tracking-[0.3em] uppercase text-xs border border-stone-800 hover:border-stone-600 hover:text-stone-200 transition-colors">
          Leave the Counter
        </button>

        <style>{`@keyframes rise { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } } .animate-rise { animation: rise 0.25s ease-out both; }`}</style>
      </div>
    </div>
  );
}