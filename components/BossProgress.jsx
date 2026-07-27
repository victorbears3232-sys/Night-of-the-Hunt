// BossProgress.jsx — the Guardians of the Hollow Quarter. Tracks
// encounter/defeat progress and shows how many remain before the final hunt
// unlocks. Six Guardians bar the way to the Drowned Sanctum. The secret bosses
// (Hollow Castellan, Cliff Watcher, …) are optional and tracked in the Bestiary,
// not here; the Astral Soul sleeps beyond the Sanctum as the secret true-ending
// reward. Rendered as a tab inside the Hunter's Journal.

import React from 'react';
import { Portrait } from '@/components/BossSilhouette';
import { REQUIRED_GUARDIANS, BOSS_POS } from '@/game/Objectives';

// The six required Guardians — derived from the single shared list
// (Objectives.REQUIRED_GUARDIANS) so the journal always matches the gate
// requirement and the in-world guidance. Optional secret bosses are tracked in
// the Bestiary ("The Prey"), not here.
const GUARDIANS = REQUIRED_GUARDIANS.map(id => ({ id, ...BOSS_POS[id] }));

const SECRET = { id: 'celestial', name: 'The Celestial God', icon: '✦', region: 'The Drowned Sanctum' };

const SERIF = 'ui-serif, Georgia, serif';
const INK = '#2a1e10';
const SEPIA = '#7a5230';
const RED = '#5a1e12';

export default function BossProgress({ game }) {
  const g = game.current;
  if (!g) return null;
  const def = g.defeatedBosses || new Set();
  const enc = g.encounteredBosses || new Set();
  const slain = GUARDIANS.filter(b => def.has(b.id)).length;
  const remaining = GUARDIANS.length - slain;
  const pct = Math.round((slain / GUARDIANS.length) * 100);

  return (
    <div key="bosses" className="journalPage">
      <div className="text-center mb-4">
        <p className="tracking-[0.3em] uppercase text-[10px] mb-1" style={{ color: SEPIA }}>The Guardians of the Hollow Quarter</p>
        <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: SERIF }}>
          <span>Prey Slain: <b style={{ color: RED }}>{slain} / {GUARDIANS.length}</b></span>
          <span>Remaining: <b style={{ color: RED }}>{remaining}</b></span>
        </div>
        <div className="mx-auto mt-2 max-w-sm h-[7px]" style={{ background: 'rgba(40,25,10,0.25)', border: '1px solid rgba(122,82,48,0.5)' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#5a1e12,#9a3a1a,#c06a30)', boxShadow: '0 0 6px rgba(150,60,30,0.5)' }} />
        </div>
        <p className="text-[11px] italic mt-2" style={{ color: '#5a3a1a', fontFamily: SERIF }}>
          {remaining === 0
            ? 'All the Guardians have fallen. The way to the Drowned Sanctum lies open.'
            : `Slay ${remaining} more Guardian${remaining === 1 ? '' : 's'} to open the way to the final hunt.`}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GUARDIANS.map(b => <BossCard key={b.id} b={b} def={def} enc={enc} />)}
      </div>

      <div className="mt-4 p-2.5 flex items-center gap-3" style={{ background: 'rgba(40,20,50,0.10)', border: '1px solid rgba(120,80,160,0.3)' }}>
        <div style={{ width: 52, height: 64 }} className="shrink-0">
          <Portrait type={enc.has(SECRET.id) ? SECRET.id : 'unknown'} dim={!enc.has(SECRET.id)} size={52} />
        </div>
        <div>
          <p className="tracking-[0.3em] uppercase text-[9px]" style={{ color: '#7a5a8a' }}>The Secret · The Ninth Soul</p>
          <div className="text-[13px] leading-tight mt-0.5" style={{ fontFamily: SERIF, color: enc.has(SECRET.id) ? INK : '#5a4a32' }}>
            {enc.has(SECRET.id) ? `${SECRET.icon}  ${SECRET.name}` : '? ? ?'}
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: def.has(SECRET.id) ? '#7a2a1a' : enc.has(SECRET.id) ? SEPIA : '#6a5a3a' }}>
            {def.has(SECRET.id) ? '✓ Slain · Astral Soul' : enc.has(SECRET.id) ? 'Encountered' : 'Beyond the Drowned Sanctum'}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] mt-3 tracking-widest uppercase" style={{ color: SEPIA }}>
        {remaining === 0 ? 'The final hunt awaits beneath the Sanctum' : 'Defeat all the Guardians to reach the finale'}
      </p>
    </div>
  );
}

function BossCard({ b, def, enc }) {
  const isDef = def.has(b.id);
  const isEnc = enc.has(b.id);
  const known = isEnc || isDef;
  return (
    <div className="flex flex-col items-center p-2"
      style={{
        background: isDef ? 'rgba(122,60,30,0.12)' : 'rgba(40,30,15,0.08)',
        border: `1px solid ${isDef ? 'rgba(122,60,30,0.45)' : 'rgba(80,60,30,0.25)'}`,
        opacity: known ? 1 : 0.78,
      }}>
      <div style={{ width: 56, height: 70 }} className="mx-auto">
        <Portrait type={known ? b.id : 'unknown'} dim={!known} size={56} />
      </div>
      <div className="mt-1.5 text-center">
        <div className="text-base leading-tight">{b.icon}</div>
        <div className="text-[12px] leading-tight mt-0.5" style={{ fontFamily: SERIF, color: known ? INK : '#5a4a32' }}>
          {known ? b.name : '? ? ?'}
        </div>
        <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: isDef ? '#7a2a1a' : isEnc ? SEPIA : '#6a5a3a' }}>
          {isDef ? '✓ Slain' : isEnc ? 'Encountered' : 'Undiscovered'}
        </div>
      </div>
    </div>
  );
}