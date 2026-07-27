// LevelUpNotice.jsx — a small top-right notification that slides in when the
// hunter has amassed enough essence to reflect and grow stronger. Auto-hides
// after ~3.5s. Keyed by notice.id so each newly-reached level re-triggers it.
// Sits just below the weapon-upgrade notice so the two never overlap.

import React, { useEffect, useState } from 'react';

export default function LevelUpNotice({ notice, onDone }) {
  const [phase, setPhase] = useState('in'); // in | hold | out

  useEffect(() => {
    if (!notice) return;
    setPhase('in');
    const t1 = setTimeout(() => setPhase('hold'), 320);
    const t2 = setTimeout(() => setPhase('out'), 3300);
    const t3 = setTimeout(() => onDone && onDone(), 3850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [notice && notice.id]);

  if (!notice) return null;

  const transform = phase === 'in' ? 'translateX(120%)' : 'translateX(0)';
  return (
    <div style={{
      position: 'absolute', top: 140, right: 16, zIndex: 30,
      transform, opacity: phase === 'out' ? 0 : 1,
      transition: 'transform 0.4s cubic-bezier(.2,.8,.2,1), opacity 0.5s ease',
      maxWidth: 280, pointerEvents: 'none',
    }}>
      <div className="px-4 py-3 border" style={{
        background: 'linear-gradient(135deg, rgba(28,22,38,0.96), rgba(16,12,22,0.97))',
        borderColor: 'rgba(170,130,220,0.55)',
        boxShadow: '0 0 22px rgba(170,130,220,0.25)',
        fontFamily: 'ui-serif, Georgia, serif',
      }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-purple-300 text-base">✦</span>
          <span className="text-purple-200 tracking-[0.18em] uppercase text-[11px] font-semibold">Level Up Available</span>
        </div>
        <p className="text-stone-400 text-[10px] italic leading-tight">Rest at a lantern to reflect and grow stronger.</p>
      </div>
    </div>
  );
}