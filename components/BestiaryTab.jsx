// BestiaryTab.jsx — the Hunter's Journal bestiary page. Catalogues every
// unique enemy and boss the player has slain. Entries stay hidden as locked
// "???" cards until first defeated, rewarding discovery. Each slain entry
// shows the live model (enemies) or gothic silhouette (bosses), lore, the
// region of first encounter, and the total slain. Boss entries also list the
// Soul ability they reward. Styled as aged parchment to match the Journal.

import React, { useEffect, useState } from 'react';
import EnemyPreview from '@/components/EnemyPreview';
import { Portrait } from '@/components/BossSilhouette';
import { BESTIARY, isDefeated, count, soulFor } from '@/game/Bestiary';

const SERIF = 'ui-serif, Georgia, serif';
const INK = '#2a1e10';
const SEPIA = '#7a5230';
const RED = '#5a1e12';

function EntryCard({ entry, g, onOpen }) {
  const def = isDefeated(g, entry.id);
  if (!def) {
    return (
      <div className="flex flex-col items-center p-2" style={{ background: 'rgba(40,30,15,0.08)', border: '1px solid rgba(80,60,30,0.25)', opacity: 0.8 }}>
        <Portrait type="unknown" dim size={64} />
        <div className="mt-1.5 text-center">
          <div className="text-[13px] leading-tight" style={{ fontFamily: SERIF, color: '#5a4a32' }}>? ? ?</div>
          <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: '#6a5a3a' }}>Undiscovered</div>
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => onOpen(entry.id)} className="flex flex-col items-center p-2 transition-all hover:bg-amber-900/10"
      style={{ background: 'rgba(122,60,30,0.12)', border: `1px solid ${entry.cat === 'boss' ? 'rgba(122,40,30,0.55)' : 'rgba(122,60,30,0.45)'}`, cursor: 'pointer' }}>
      <Preview entry={entry} />
      <div className="mt-1.5 text-center">
        <div className="text-[13px] leading-tight" style={{ fontFamily: SERIF, color: INK }}>{entry.name}</div>
        <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: entry.cat === 'boss' ? RED : SEPIA }}>
          {entry.cat === 'boss' ? '✓ Prey Slain' : `✓ Slain ×${count(g, entry.id)}`}
        </div>
      </div>
    </button>
  );
}

function Preview({ entry }) {
  if (entry.cat === 'boss') return <Portrait type={entry.id} size={64} />;
  // choose a representative body color from the in-game type table
  return (
    <div style={{ width: 70, height: 86 }} className="mx-auto">
      <EnemyPreview type={entry.id} color={previewColor(entry.id)} r={13} size={70} />
    </div>
  );
}

// A representative palette per archetype for the preview (mirrors EnemySystem).
function previewColor(id) {
  const C = {
    townsfolk: '#7a6a5a', villager: '#6b5d54', hound: '#4a3b34', priest: '#8a6f5a', knight: '#56586a',
    crawler: '#52483c', watcher: '#3a4a55', brute: '#43352c',
    knife_villager: '#7a6a5a', torch_villager: '#6a4a3a', heavy_villager: '#6a4a3a', crazed_villager: '#8a5a4a',
    guardian: '#5a5e6a', scholar: '#4a3a5a', ancient_beast: '#3a2a2a', fallen_hunter: '#2a2a34',
    executioner: '#3a1a1a', bell_keeper: '#5a4a2a', librarian: '#3a2a4a',
    void_scholar: '#2a1a4a', rune_guardian: '#3a3a4a', pale_hunter: '#1a1a24', crypt_beast: '#2a1a1a',
    death_brute: '#2a1414', phantom: '#1a2a3a', titan: '#2a2a3a', the_warden: '#3a2a2a',
  };
  return C[id] || '#7a6a5a';
}

export default function BestiaryTab({ game }) {
  const [, force] = useState(0);
  const [selected, setSelected] = useState(null);
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 200); return () => clearInterval(id); }, []);

  const g = game.current;
  const sel = selected ? BESTIARY.find(b => b.id === selected) : null;

  if (!g) return null;
  const def = g.bestiary ? g.bestiary.defeated : new Set();
  const discovered = def.size;
  const total = BESTIARY.length;
  const pct = Math.round((discovered / total) * 100);
  const enemies = BESTIARY.filter(b => b.cat === 'enemy');
  const bosses = BESTIARY.filter(b => b.cat === 'boss');

  if (sel) {
    const soul = sel.cat === 'boss' ? soulFor(sel.id) : null;
    const slain = count(g, sel.id);
    return (
      <div key={'bd-' + sel.id} className="journalPage flex flex-col">
        <button onClick={() => setSelected(null)} className="self-start text-[11px] tracking-[0.25em] uppercase mb-3 hover:underline" style={{ color: SEPIA }}>
          ‹ Return to the Bestiary
        </button>
        <div className="flex gap-4 items-start">
          <div className="shrink-0">
            <div style={{ width: 96, height: 116 }}>
              {sel.cat === 'boss'
                ? <Portrait type={sel.id} size={96} />
                : <EnemyPreview type={sel.id} color={previewColor(sel.id)} r={15} size={116} />}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg leading-tight" style={{ fontFamily: SERIF, color: '#3a1e12' }}>{sel.name}</h3>
            <p className="text-[10px] tracking-[0.25em] uppercase mt-0.5" style={{ color: SEPIA }}>First encountered in {sel.region}</p>
            <p className="text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: RED }}>
              {sel.cat === 'boss' ? '✓ Prey Slain' : `✓ Total Slain — ${slain}`}
            </p>
            {sel.elite && <span className="inline-block mt-1 text-[9px] tracking-widest uppercase px-1.5 py-0.5" style={{ color: '#7a2a1a', border: '1px solid rgba(122,42,26,0.4)' }}>Elite</span>}
            {sel.secret && <span className="inline-block mt-1 ml-1 text-[9px] tracking-widest uppercase px-1.5 py-0.5" style={{ color: '#4a3a6a', border: '1px solid rgba(74,58,106,0.4)' }}>Hidden</span>}
            <p className="text-[13px] italic leading-relaxed mt-2" style={{ fontFamily: SERIF, color: '#3a2a1a' }}>{sel.lore}</p>
            {soul && (
              <div className="mt-3 px-3 py-2" style={{ background: 'rgba(74,40,90,0.10)', border: '1px solid rgba(122,82,160,0.35)' }}>
                <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6a4a8a' }}>Soul Granted</div>
                <div className="text-sm mt-0.5" style={{ fontFamily: SERIF, color: '#2a1e12' }}>{soul.icon} {soul.name} — <b>{soul.ability}</b></div>
                <div className="text-[11px] italic mt-0.5" style={{ color: '#4a3a2a' }}>{soul.desc}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key="bestiary" className="journalPage">
      <div className="text-center mb-4">
        <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: SERIF }}>
          <span>Discovered: <b style={{ color: RED }}>{discovered} / {total}</b></span>
          <span>Completion: <b style={{ color: RED }}>{pct}%</b></span>
        </div>
        <div className="mx-auto mt-2 max-w-sm h-[7px]" style={{ background: 'rgba(40,25,10,0.25)', border: '1px solid rgba(122,82,48,0.5)' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#5a1e12,#9a3a1a,#c06a30)', boxShadow: '0 0 6px rgba(150,60,30,0.5)' }} />
        </div>
      </div>

      <p className="text-center text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: SEPIA }}>The Beasts of the Quarter</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {enemies.map(e => <EntryCard key={e.id} entry={e} g={g} onOpen={setSelected} />)}
      </div>

      <p className="text-center text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: SEPIA }}>The Great Prey</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bosses.map(e => <EntryCard key={e.id} entry={e} g={g} onOpen={setSelected} />)}
      </div>
      <p className="text-center text-[10px] mt-3 tracking-widest uppercase" style={{ color: SEPIA }}>Slay the unknown to record its name</p>
    </div>
  );
}