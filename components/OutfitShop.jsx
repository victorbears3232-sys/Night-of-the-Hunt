// OutfitShop.jsx — the clothier's atelier. View owned garb, purchase new
// outfits, and equip them to change the Hunter's appearance (cosmetic only).
// Lists every outfit the Hunter already owns (for equipping) plus the
// merchant's unique wares (for purchase).

import React, { useEffect, useState } from 'react';
import { OUTFIT_MAP } from '@/game/Outfits';

export default function OutfitShop({ game, shop }) {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 120); return () => clearInterval(id); }, []);

  if (!shop || !game.current) return null;
  const g = game.current;
  const p = g.player;
  const close = () => g.closeOutfitShop();
  const def = shop.def;

  const ownedIds = [...(p.outfits || [])];
  const saleIds = (def.outfits || []).filter(id => !ownedIds.includes(id));
  const list = [...ownedIds, ...saleIds];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.82)' }} onClick={close}>
      <div className="w-full max-w-lg border bg-stone-950/95 p-6 md:p-8 animate-rise" onClick={e => e.stopPropagation()}
        style={{ borderColor: (def.color || '#8a6a4a') + '66', boxShadow: `0 0 40px ${def.color || '#8a6a4a'}22` }}>
        <div className="text-center mb-5">
          <p className="text-amber-300/60 tracking-[0.4em] uppercase text-xs mb-1">{def.title}</p>
          <h2 className="text-stone-100 text-xl">{def.name}</h2>
          <p className="text-stone-500 text-xs italic mt-1">{def.bio || def.intro}</p>
        </div>

        <div className="flex items-center justify-between px-3 py-2 mb-3 border border-stone-800 bg-black/40">
          <span className="text-stone-400 text-[10px] tracking-widest uppercase">Your essence</span>
          <span className="text-amber-300 font-mono text-sm">{Math.floor(p.essence)}</span>
        </div>

        <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
          {list.map(id => {
            const o = OUTFIT_MAP[id]; if (!o) return null;
            const owned = !!(p.outfits && p.outfits.has(id));
            const equipped = p.outfit === id;
            const unlocked = !o.unlock || o.unlock(g);
            const afford = p.essence >= (o.price || 0);
            const swatch = (o.palette && o.palette.coat) || '#1c1820';
            const accent = o.accent || (o.palette && o.palette.coatLining) || '#7a5230';
            return (
              <div key={id} className={`w-full flex items-center gap-3 px-3 py-3 border ${equipped ? 'border-amber-600/70 bg-amber-900/10' : o.legendary ? 'border-amber-700/40 bg-amber-950/10' : owned ? 'border-stone-700' : 'border-stone-800'}`}>
                <div style={{ width: 34, height: 44, background: swatch, borderTop: `3px solid ${accent}`, borderLeft: `1px solid ${o.palette ? o.palette.hat : '#000'}`, borderRadius: 4, flexShrink: 0, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)' }} />
                <div className="text-left flex-1 min-w-0">
                  <div className="text-stone-200 text-sm flex items-center gap-2">
                    {o.name}
                    {o.legendary && <span className="text-[9px] tracking-widest uppercase" style={{ color: '#e0b040' }}>✦ Legendary</span>}
                    {equipped && <span className="text-amber-300 text-[9px] tracking-widest uppercase">Worn</span>}
                  </div>
                  <div className="text-stone-600 text-[11px] italic leading-tight">{o.desc}</div>
                </div>
                {!unlocked ? (
                  <span className="text-stone-600 text-[9px] tracking-widest uppercase text-right">Locked</span>
                ) : owned ? (
                  <button onClick={() => g.equipOutfit(id)} disabled={equipped}
                    className={`px-3 py-2 text-[10px] tracking-widest uppercase border ${equipped ? 'border-stone-800 text-stone-600 cursor-default' : 'border-amber-700/60 text-amber-100 hover:bg-amber-900/20 cursor-pointer'}`}>
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button onClick={() => g.buyOutfit(id)} disabled={!afford}
                    className={`px-3 py-2 text-[10px] tracking-widest uppercase border whitespace-nowrap ${afford ? 'border-amber-700/60 text-amber-100 hover:bg-amber-900/20 cursor-pointer' : 'border-stone-800 text-stone-600 cursor-not-allowed'}`}>
                    {afford ? `Buy · ${o.price} ✦` : `${o.price} ✦`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={close}
          className="mt-6 w-full py-2.5 text-stone-400 tracking-[0.3em] uppercase text-xs border border-stone-800 hover:border-stone-600 hover:text-stone-200 transition-colors">
          Leave the Atelier
        </button>

        <style>{`@keyframes rise { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } } .animate-rise { animation: rise 0.25s ease-out both; }`}</style>
      </div>
    </div>
  );
}