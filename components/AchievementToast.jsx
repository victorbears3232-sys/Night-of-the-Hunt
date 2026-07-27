// AchievementToast.jsx — a PlayStation-trophy-inspired notification that slides
// in from the top-right, holds ~3.6s, then slides out. Multiple achievements
// queue and display one at a time so they never overlap. Imperative API:
//   const ref = useRef(); ... ref.current.push({ id, title, desc, icon })

import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DISPLAY_MS = 3600;

const AchievementToast = React.forwardRef(function AchievementToast(_, ref) {
  const [active, setActive] = useState(null);
  const queue = useRef([]);
  const showing = useRef(false);
  const timer = useRef(null);

  const showNext = () => {
    const next = queue.current.shift();
    if (!next) { showing.current = false; return; }
    setActive(next);
    timer.current = setTimeout(() => setActive(null), DISPLAY_MS);
  };

  useImperativeHandle(ref, () => ({
    push(a) {
      queue.current.push({ ...a, key: Date.now() + Math.random() });
      if (!showing.current) { showing.current = true; showNext(); }
    },
  }));

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none select-none" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
      <AnimatePresence onExitComplete={showNext}>
        {active && (
          <motion.div
            key={active.key}
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28, mass: 0.8 }}
            className="w-[300px] flex items-stretch border border-amber-700/50 bg-stone-950/95 overflow-hidden"
            style={{ boxShadow: '0 10px 32px rgba(0,0,0,0.75), 0 0 18px rgba(200,160,90,0.18)' }}
          >
            {/* Icon panel */}
            <div className="flex items-center justify-center w-14 shrink-0" style={{ background: 'linear-gradient(160deg, rgba(200,160,90,0.20), rgba(40,30,20,0.6))' }}>
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(220,180,90,0.6))' }}>{active.icon}</span>
            </div>
            {/* Text */}
            <div className="flex flex-col justify-center px-3 py-2.5 flex-1 min-w-0">
              <p className="text-amber-300/70 text-[9px] tracking-[0.35em] uppercase mb-0.5">Achievement Earned</p>
              <p className="text-stone-100 text-sm leading-tight mb-0.5 truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{active.title}</p>
              <p className="text-stone-400 text-[11px] leading-snug">{active.desc}</p>
            </div>
            {/* Gold accent edge */}
            <div className="w-[3px] shrink-0" style={{ background: 'linear-gradient(180deg, #d4a050, #8a6020)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AchievementToast;