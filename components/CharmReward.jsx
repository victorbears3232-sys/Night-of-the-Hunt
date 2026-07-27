// CharmReward.jsx — cinematic overlay shown when the hunter discovers a new
// charm. "Equip Now" equips it directly into a free slot (or, if all three
// slots are full, opens a small menu to choose which equipped charm to
// replace). "View in Satchel" opens the inventory without auto-equipping.

import React, { useEffect, useState } from 'react';
import { getCharm, RARITY } from '@/game/Charms';

export default function CharmReward({ game, charmId }) {
  const [revealed, setRevealed] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  const g = game.current;
  const p = g && g.player;
  const close = () => g && g.dismissCharmReward(false);
  const viewSatchel = () => g && g.dismissCharmReward(true);
  const doEquip = () => {
    if (!g || !p) return;
    if ((p.equipped || []).length < 3) { g.equipCharmDirect(charmId); g.dismissCharmReward(false); }
    else setReplaceMode(true);
  };
  const doReplace = (oldId) => { g.replaceCharm(charmId, oldId); g.dismissCharmReward(false); };

  useEffect(() => { const t = setTimeout(() => setRevealed(true), 60); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === 'e' || k === ' ') { e.preventDefault(); doEquip(); }
      else if (k === 'escape') { e.preventDefault(); close(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const c = getCharm(charmId);
  if (!c) return null;
  const rarity = RARITY[c.rarity] || { name: 'Charm', color: '#b48ad6' };
  const color = rarity.color || '#b48ad6';

  if (replaceMode && p) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
        <div className="w-full max-w-sm text-center" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
          <p className="tracking-[0.4em] uppercase text-[11px] mb-2" style={{ color }}>No empty charm slot</p>
          <h3 className="text-xl mb-1" style={{ color: '#ece0c4' }}>Replace a Charm</h3>
          <p className="text-stone-400 text-xs italic mb-5">All three slots are filled. Choose which equipped charm to set aside for {c.name}.</p>
          <div className="space-y-2">
            {(p.equipped || []).map(id => {
              const ec = getCharm(id);
              if (!ec) return null;
              return (
                <button key={id} onClick={() => doReplace(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 border transition-colors hover:bg-amber-900/20 text-left"
                  style={{ borderColor: 'rgba(160,140,110,0.5)', color: '#c9b48a' }}>
                  <span className="text-2xl">{ec.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm">{ec.name}</div>
                    <div className="text-[10px] italic" style={{ color: '#8a7a5a' }}>{ec.desc}</div>
                  </div>
                  <span className="text-[9px] tracking-widest uppercase" style={{ color }}>Replace</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setReplaceMode(false)}
            className="mt-5 px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-stone-800/40"
            style={{ color: '#9a8a6a', border: '1px solid rgba(122,100,60,0.4)' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(20,14,24,0.82) 0%, rgba(0,0,0,0.97) 75%)', transition: 'opacity 0.4s ease', opacity: revealed ? 1 : 0 }}>
      <div className="relative w-full max-w-lg text-center" style={{ transition: 'transform 0.5s cubic-bezier(.2,.8,.2,1)', transform: revealed ? 'none' : 'translateY(16px)' }}>
        <p className="tracking-[0.5em] uppercase text-[11px] mb-3" style={{ color, opacity: 0.8 }}>— A Charm Discovered —</p>
        <div className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 116, height: 116, borderRadius: 14, border: `2px solid ${color}`,
            background: `radial-gradient(circle at 42% 38%, ${color}55, #0a0608 70%)`,
            boxShadow: `0 0 50px ${color}77, inset 0 0 30px rgba(0,0,0,0.7)`, fontSize: 52 }}>
          <span style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.9))' }}>{c.icon}</span>
        </div>
        <h2 className="text-3xl mb-1" style={{ color: '#ece0c4', fontFamily: 'ui-serif, Georgia, serif', textShadow: `0 0 20px ${color}55, 0 0 8px rgba(0,0,0,0.9)` }}>{c.name}</h2>
        <p className="tracking-[0.3em] uppercase text-xs mb-5" style={{ color }}>{rarity.name} Charm</p>
        <div className="mx-auto mb-6 h-px w-40" style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />
        <p className="text-stone-300 italic leading-relaxed max-w-md mx-auto mb-8" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{c.desc}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={doEquip}
            className="px-8 py-3 border text-amber-100 tracking-[0.25em] text-xs uppercase transition-all hover:bg-amber-900/30"
            style={{ borderColor: color, boxShadow: `0 0 22px ${color}44`, fontFamily: 'ui-serif, Georgia, serif' }}>
            Equip Now
          </button>
          <button onClick={viewSatchel}
            className="px-8 py-3 border text-stone-200 tracking-[0.25em] text-xs uppercase transition-all hover:bg-stone-800/40"
            style={{ borderColor: 'rgba(160,140,110,0.5)', fontFamily: 'ui-serif, Georgia, serif' }}>
            View in Satchel
          </button>
        </div>
        <p className="text-stone-600 text-[10px] tracking-[0.25em] uppercase mt-5">Enter to equip · Esc to close</p>
      </div>
    </div>
  );
}