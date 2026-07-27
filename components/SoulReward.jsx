// SoulReward.jsx — cinematic overlay shown when the hunter absorbs a main
// boss's Soul. Fades the screen, reveals the soul's icon, name, ability and
// description, and requires the player to press Continue before the Hunt resumes.

import React, { useEffect, useState } from 'react';

export default function SoulReward({ game, soul }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 60); return () => clearTimeout(t); }, []);

  const cont = () => { game.current && game.current.dismissSoulReward(); };

  useEffect(() => {
    const onKey = (e) => { const k = e.key.toLowerCase(); if (k === 'enter' || k === 'e' || k === ' ' || k === 'escape') { e.preventDefault(); cont(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(20,12,24,0.82) 0%, rgba(0,0,0,0.97) 75%)', transition: 'opacity 0.4s ease', opacity: revealed ? 1 : 0 }}>
      <div className="relative w-full max-w-lg text-center" style={{ transition: 'transform 0.5s cubic-bezier(.2,.8,.2,1)', transform: revealed ? 'none' : 'translateY(16px)' }}>
        <p className="tracking-[0.5em] uppercase text-[11px] mb-3" style={{ color: soul.color, opacity: 0.8 }}>— Soul Acquired —</p>
        <div className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 132, height: 132, borderRadius: '50%',
            border: `2px solid ${soul.color}`,
            background: `radial-gradient(circle at 42% 38%, ${soul.color}66, #0a0608 70%)`,
            boxShadow: `0 0 60px ${soul.color}88, inset 0 0 40px rgba(0,0,0,0.7)`, fontSize: 64 }}>
          <span style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.9))' }}>{soul.icon}</span>
        </div>
        <h2 className="text-3xl md:text-4xl mb-1" style={{ color: '#ece0c4', fontFamily: 'ui-serif, Georgia, serif', textShadow: `0 0 22px ${soul.color}55, 0 0 8px rgba(0,0,0,0.9)` }}>{soul.name}</h2>
        <p className="tracking-[0.35em] uppercase text-sm mb-5" style={{ color: soul.color }}>{soul.ability}</p>
        <div className="mx-auto mb-7 h-px w-40" style={{ background: `linear-gradient(90deg, transparent, ${soul.color}88, transparent)` }} />
        <p className="text-stone-300 italic leading-relaxed max-w-md mx-auto mb-8" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{soul.desc}</p>
        <p className="text-stone-500 text-[10px] tracking-[0.3em] uppercase mb-4">This power is permanent — it cannot be unequipped.</p>
        <button onClick={cont}
          className="px-12 py-3.5 border text-amber-100 tracking-[0.3em] text-sm uppercase transition-all hover:bg-amber-900/30"
          style={{ borderColor: soul.color, boxShadow: `0 0 28px ${soul.color}44`, fontFamily: 'ui-serif, Georgia, serif' }}>
          Continue
        </button>
      </div>
    </div>
  );
}