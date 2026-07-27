// KeyReward.jsx — the cinematic overlay shown when the hunter obtains the
// Forgotten Gate Key from a chest in The Nightmare. Pauses the Hunt (like a
// map fragment discovery) and surfaces a reward card with a Continue button,
// matching the style of the other reward screens.

import React, { useEffect, useState } from 'react';

export default function KeyReward({ game, info }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 60); return () => clearTimeout(t); }, []);

  const cont = () => game.current && game.current.dismissKeyReward();

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === 'e' || k === ' ' || k === 'escape') { e.preventDefault(); cont(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!info) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(28,20,12,0.86) 0%, rgba(0,0,0,0.97) 75%)', transition: 'opacity 0.4s ease', opacity: revealed ? 1 : 0 }}>
      <div className="relative w-full max-w-lg text-center" style={{ transition: 'transform 0.5s cubic-bezier(.2,.8,.2,1)', transform: revealed ? 'none' : 'translateY(16px)' }}>
        <p className="tracking-[0.5em] uppercase text-[11px] mb-3" style={{ color: '#caa238', opacity: 0.85 }}>— Key Acquired —</p>
        <div className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 116, height: 116, borderRadius: 14, border: '2px solid #caa238',
            background: 'radial-gradient(circle at 42% 38%, #caa23855, #0a0608 70%)',
            boxShadow: '0 0 50px #caa23877, inset 0 0 30px rgba(0,0,0,0.7)', fontSize: 52 }}>
          <span style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.9))' }}>🗝️</span>
        </div>
        <h2 className="text-3xl mb-1" style={{ color: '#ece0c4', fontFamily: 'ui-serif, Georgia, serif', textShadow: '0 0 22px rgba(202,162,56,0.5), 0 0 8px rgba(0,0,0,0.9)' }}>{info.name}</h2>
        <div className="mx-auto mb-6 h-px w-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(202,162,56,0.7), transparent)' }} />
        <p className="text-stone-300 italic leading-relaxed max-w-md mx-auto mb-8" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{info.desc}</p>
        <button onClick={cont}
          className="px-12 py-3.5 border text-amber-100 tracking-[0.3em] text-sm uppercase transition-all hover:bg-amber-900/30"
          style={{ borderColor: '#caa238', boxShadow: '0 0 28px rgba(202,162,56,0.3)', fontFamily: 'ui-serif, Georgia, serif' }}>
          Continue
        </button>
        <p className="text-stone-600 text-[10px] tracking-[0.3em] uppercase mt-3">Press Enter to continue</p>
      </div>
    </div>
  );
}