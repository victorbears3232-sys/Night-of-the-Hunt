// Journal.jsx — the Hunter's Journal. Opens with the 'L' key (engine pauses).
// Four tabs: Map, The Prey (beasts & bosses slain), Satchel (inventory/charms),
// and Quests. Styled as aged parchment in a gothic frame.

import React, { useEffect, useState } from 'react';
import { MapCanvas } from '@/game/WorldMap';
import { InventoryPanel } from '@/components/Inventory';
import BestiaryTab from '@/components/BestiaryTab';
import BossProgress from '@/components/BossProgress';

const TABS = [
  { id: 'map', label: 'Map' },
  { id: 'bosses', label: 'Bosses' },
  { id: 'prey', label: 'The Prey' },
  { id: 'inventory', label: 'Satchel' },
  { id: 'quests', label: 'Quests' },
];

export default function Journal({ game, quests, mapState }) {
  const [tab, setTab] = useState('map');
  const [enlarged, setEnlarged] = useState(false);
  const [travelTarget, setTravelTarget] = useState(null);

  const close = () => game.current && game.current.toggleQuestLog();

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === '[') setTab(t => TABS[Math.max(0, TABS.findIndex(x => x.id === t) - 1)].id);
      if (k === ']') setTab(t => TABS[Math.min(TABS.length - 1, TABS.findIndex(x => x.id === t) + 1)].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const corner = 'absolute w-4 h-4 border-amber-900/40';
  const pageStyle = {
    background: 'linear-gradient(135deg,#e6d9b2,#cdb88a 55%,#d4c39a 100%)',
    color: '#2a1e10',
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.86)' }} onClick={close}>
      <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-[3px]" style={{ background: 'linear-gradient(#3a2a1a,#1a1208)', boxShadow: '0 0 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(160,120,50,0.25)' }}>
          <div className="p-1" style={{ border: '1px solid rgba(160,120,50,0.35)' }}>
            <div className="relative p-5 md:p-7 max-h-[90vh] overflow-y-auto" style={pageStyle}>
              <span className={corner} style={{ top: 6, left: 6, borderTop: '2px solid', borderLeft: '2px solid' }} />
              <span className={corner} style={{ top: 6, right: 6, borderTop: '2px solid', borderRight: '2px solid' }} />
              <span className={corner} style={{ bottom: 6, left: 6, borderBottom: '2px solid', borderLeft: '2px solid' }} />
              <span className={corner} style={{ bottom: 6, right: 6, borderBottom: '2px solid', borderRight: '2px solid' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 50px rgba(90,60,20,0.25)' }} />

              {/* header */}
              <div className="text-center mb-3">
                <p className="tracking-[0.45em] uppercase text-[11px]" style={{ color: '#7a5230' }}>Hunter's Journal</p>
                <h2 className="text-xl md:text-2xl tracking-wide" style={{ color: '#3a1e12', fontFamily: 'ui-serif, Georgia, serif' }}>
                  {tab === 'bosses' && 'The Guardians'}
                  {tab === 'prey' && 'The Prey'}
                  {tab === 'quests' && 'Undertakings'}
                  {tab === 'map' && 'The World Chart'}
                  {tab === 'inventory' && "The Hunter's Satchel"}
                </h2>
              </div>

              {/* tab bar */}
              <div className="flex items-center justify-center gap-1 mb-4">
                <TabArrow dir="left" onClick={() => setTab(t => TABS[Math.max(0, TABS.findIndex(x => x.id === t) - 1)].id)} />
                <div className="flex overflow-x-auto" style={{ border: '1px solid rgba(122,82,48,0.4)' }}>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-3 md:px-5 py-1.5 text-xs tracking-[0.25em] uppercase transition-colors whitespace-nowrap shrink-0"
                      style={{
                        fontFamily: 'ui-serif, Georgia, serif',
                        background: tab === t.id ? 'rgba(122,60,30,0.18)' : 'transparent',
                        color: tab === t.id ? '#5a1e12' : '#7a5230',
                        fontWeight: tab === t.id ? 700 : 400,
                        borderRight: t.id === 'map' ? 'none' : '1px solid rgba(122,82,48,0.3)',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <TabArrow dir="right" onClick={() => setTab(t => TABS[Math.min(TABS.length - 1, TABS.findIndex(x => x.id === t) + 1)].id)} />
              </div>

              {/* content */}
              {tab === 'bosses' && <BossProgress game={game} />}

              {tab === 'prey' && <BestiaryTab game={game} />}

              {tab === 'quests' && (
                <div key="quests" className="journalPage">
                  {(!quests || quests.length === 0) ? (
                    <p className="text-center text-sm italic py-8" style={{ color: '#7a5230' }}>No undertakings weigh upon you yet. Seek the people of the Quarter.</p>
                  ) : (
                    <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                      {quests.map(q => {
                        const ret = q.status === 'return';
                        return (
                          <div key={q.npcId} className="px-4 py-3" style={{ background: 'rgba(40,25,10,0.1)', border: '1px solid rgba(122,82,48,0.35)' }}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ fontFamily: 'ui-serif, Georgia, serif', color: '#2a1e10' }}>{q.questTitle}</span>
                              <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: ret ? '#9a3a1a' : '#7a5230' }}>{ret ? 'Return to complete' : 'In progress'}</span>
                            </div>
                            <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: '#7a5230' }}>{q.name} — {q.title}</p>
                            <p className="text-xs italic" style={{ color: '#3a2a1a' }}>{q.objective}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'inventory' && (
                <div key="inventory" className="journalPage">
                  <InventoryPanel game={game} />
                </div>
              )}

              {tab === 'map' && (
                <div key="map" className="journalPage">
                  <p className="text-center text-[11px] italic mb-2" style={{ color: '#5a3a1a', fontFamily: 'ui-serif, Georgia, serif' }}>
                    Click the chart to unfold the full map.
                  </p>
                  <div onClick={() => setEnlarged(true)} className="relative cursor-zoom-in" title="Unfold the full chart">
                    <MapCanvas game={game} mapState={mapState}
                      height="min(640px, calc(92vh - 300px))" interactive={false} />
                    <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                      <span className="text-[10px] tracking-[0.3em] uppercase px-2 py-0.5"
                        style={{ color: '#5a1e12', background: 'rgba(230,217,178,0.85)', border: '1px solid rgba(122,82,48,0.4)' }}>
                        ⤢ Unfold
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* footer */}
              <button onClick={close}
                className="mt-5 w-full py-2.5 text-[11px] tracking-[0.35em] uppercase transition-colors"
                style={{ fontFamily: 'ui-serif, Georgia, serif', color: '#7a5230', border: '1px solid rgba(122,82,48,0.4)' }}>
                Close Journal (L / M)
              </button>
            </div>
          </div>
        </div>
      </div>

      {enlarged && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4 animate-unfold"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,12,8,0.82) 0%, rgba(0,0,0,0.96) 80%)' }}
          onClick={(e) => { e.stopPropagation(); setEnlarged(false); }}>
          <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(1000px, calc(100vw - 48px))' }}>
            <div className="text-center mb-2">
              <p className="text-amber-200/80 tracking-[0.4em] uppercase text-xs">The Hollow Quarter</p>
              <p className="text-stone-500 text-[10px] tracking-widest uppercase">Unfolded by the Hunter's own hand</p>
            </div>
            <div className="p-[3px]" style={{ background: 'linear-gradient(#3a2a1a,#1a1208)', boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
              <div className="p-1" style={{ border: '1px solid rgba(160,120,50,0.35)' }}>
                <MapCanvas game={game} mapState={mapState}
                  height="calc(100vh - 240px)"
                  onTravel={(l) => setTravelTarget(l)}
                  interactive />
              </div>
            </div>
            {travelTarget && (
              <div className="absolute inset-0 z-10 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setTravelTarget(null)}>
                <div className="max-w-xs w-full p-6 text-center" onClick={(e) => e.stopPropagation()}
                  style={{ background: 'linear-gradient(135deg,#e6d9b2,#cdb88a 55%,#d4c39a 100%)', border: '1px solid rgba(160,120,50,0.5)', boxShadow: '0 0 40px rgba(0,0,0,0.85)' }}>
                  <h3 className="text-base mb-1" style={{ fontFamily: 'ui-serif, Georgia, serif', color: '#3a1e12' }}>
                    Travel to {travelTarget.name || 'the Lantern'}?
                  </h3>
                  <p className="text-xs italic mb-5" style={{ color: '#3a2a1a' }}>The light will bear you there. Defeated prey will return to their posts.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setTravelTarget(null)} className="px-4 py-2 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-amber-900/10" style={{ color: '#7a5230', border: '1px solid rgba(122,82,48,0.4)' }}>Cancel</button>
                    <button onClick={() => { const l = travelTarget; setTravelTarget(null); setEnlarged(false); if (game.current) game.current.fastTravel(l.x, l.y); }}
                      className="px-4 py-2 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-amber-900/20" style={{ color: '#5a1e12', border: '1px solid rgba(122,60,30,0.6)', background: 'rgba(122,60,30,0.18)' }}>Travel</button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 w-full">
              <span className="text-stone-500 text-[10px] tracking-widest uppercase">Click a visited lantern ◎ to be borne there by the light</span>
              <button onClick={() => setEnlarged(false)}
                className="text-amber-200/80 hover:text-amber-200 border border-amber-900/40 px-4 py-1.5 text-[11px] tracking-[0.3em] uppercase transition-colors"
                style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
                Fold the Map (M)
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes journalPageIn { from { opacity: 0; transform: translateY(10px) rotateX(4deg); } to { opacity: 1; transform: none; } }
        .journalPage { animation: journalPageIn 0.34s cubic-bezier(0.2,0.7,0.3,1); transform-origin: top center; }
        @keyframes unfold { from { opacity: 0; transform: scale(0.82) rotateX(6deg); } to { opacity: 1; transform: none; } }
        .animate-unfold { animation: unfold 0.45s cubic-bezier(0.2,0.7,0.3,1); transform-origin: center; }
      `}</style>
    </div>
  );
}

function TabArrow({ dir, onClick }) {
  return (
    <button onClick={onClick} className="px-2 py-1 text-lg transition-colors hover:opacity-100"
      style={{ color: '#7a5230', opacity: 0.7 }} title={dir === 'left' ? 'Previous ( [ )' : 'Next ( ] )'}>
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}