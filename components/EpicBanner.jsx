import React, { useEffect, useRef } from 'react';

// EpicBanner.jsx — a slow, dramatic full-screen story banner that fades in,
// holds, and fades out over ~5s. Used for pivotal story beats (e.g. when the
// last Guardian falls and the world shifts). Self-timing; calls onDone after.
export default function EpicBanner({ message, onDone }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const id = setTimeout(() => doneRef.current && doneRef.current(), 5400);
    return () => clearTimeout(id);
  }, [message]);

  const lines = (message || '').split('\n');
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none epic-banner">
      <div className="text-center px-6">
        <div className="mx-auto mb-5 h-px w-28 epic-line" style={{ background: 'linear-gradient(90deg,transparent,rgba(200,160,90,0.7),transparent)' }} />
        {lines.map((ln, i) => (
          <p key={i} className="text-stone-200 tracking-[0.18em] text-lg md:text-2xl leading-relaxed"
            style={{ fontFamily: 'ui-serif, Georgia, serif', textShadow: '0 0 24px rgba(0,0,0,0.97), 0 0 14px rgba(120,20,20,0.45)' }}>
            {ln}
          </p>
        ))}
        <div className="mx-auto mt-5 h-px w-28 epic-line" style={{ background: 'linear-gradient(90deg,transparent,rgba(200,160,90,0.7),transparent)' }} />
      </div>
      <style>{`
        @keyframes epicFade { 0% { opacity: 0; } 18% { opacity: 1; } 82% { opacity: 1; } 100% { opacity: 0; } }
        .epic-banner { animation: epicFade 5s ease-in-out forwards; }
        @keyframes epicLine { 0% { transform: scaleX(0); opacity: 0; } 24% { transform: scaleX(1); opacity: 1; } 82% { opacity: 1; } 100% { opacity: 0; } }
        .epic-line { transform-origin: center; animation: epicLine 5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}