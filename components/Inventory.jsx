// Inventory.jsx — The Hunter's Satchel. Shows weapons, consumables, key
// items, quest items, and charms. Charms use exactly 3 equip slots; owned
// but unequipped charms give no bonus. Keyboard/controller navigable.
// InventoryPanel is embedded in the Journal; Inventory is the standalone overlay.

import React, { useEffect, useState } from 'react';
import { CHARM_DEFS, getCharm, RARITY } from '@/game/Charms';
import { SOULS } from '@/game/Souls';

const RING = { common: '#9a9a9a', uncommon: '#6ab04a', rare: '#4a8ad6', legendary: '#d6a04a' };
const INK = '#2a1e10', ACC = '#7a5230', RED = '#5a1e12';

// Collected keys (gate keys, etc.). Display-only metadata for the Satchel; the
// player's owned keys live in p.keys (a Set of key ids). Keys are kept permanently
// (using one to open a gate does not consume it), so this list only ever grows.
const KEY_DEFS = {
  forgotten_gate_key: { name: 'Forgotten Gate Key', icon: '🗝️', desc: 'Unlocks the sealed iron gate in the Forgotten Northwest.' },
};

function CharmBadge({ id, size = 42, dim }) {
  const c = getCharm(id);
  if (!c) return null;
  const ring = RING[c.rarity];
  return (
    <div style={{ width: size, height: size, border: `2px solid ${ring}`, borderRadius: 10,
      background: `radial-gradient(circle at 40% 35%, ${ring}40, #1a140e)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.46,
      opacity: dim ? 0.5 : 1, boxShadow: dim ? 'none' : `0 0 8px ${ring}55` }}>
      <span style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.85))' }}>{c.icon}</span>
    </div>
  );
}

export function InventoryPanel({ game }) {
  const [, force] = useState(0);
  const [sel, setSel] = useState(0);
  const [soulSel, setSoulSel] = useState(null);
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 150); return () => clearInterval(id); }, []);
  const g = game.current;
  const p = g && g.player;

  useEffect(() => {
    const onKey = (e) => {
      if (!p) return;
      const k = e.key.toLowerCase();
      const owned = [...p.charms].filter(id => { const c = getCharm(id); return c ? c.slot : true; });
      const max = Math.max(0, owned.length - 1);
      if (k === 'arrowleft') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      else if (k === 'arrowright') { e.preventDefault(); setSel(s => Math.min(max, s + 1)); }
      else if (k === 'arrowup') { e.preventDefault(); setSel(s => Math.max(0, s - 4)); }
      else if (k === 'arrowdown') { e.preventDefault(); setSel(s => Math.min(max, s + 4)); }
      else if (k === 'enter') { e.preventDefault(); if (owned[sel]) g.toggleCharm(owned[sel]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, sel]);

  if (!p) return null;
  const owned = [...p.charms];
  const equipped = p.equipped || [];
  const slotted = owned.filter(id => { const c = getCharm(id); return c ? c.slot : true; });
  const permanent = owned.filter(id => { const c = getCharm(id); return c ? !c.slot : false; });
  const selId = slotted[sel];
  const questRelics = (g.relics || []).filter(r => r.questItem && r.collected);
  const card = { background: 'rgba(40,25,10,0.08)', border: '1px solid rgba(122,82,48,0.35)' };

  return (
    <div style={{ color: INK, fontFamily: 'ui-serif, Georgia, serif' }}>
      <div className="text-center mb-4">
        <p className="tracking-[0.4em] uppercase text-[11px]" style={{ color: ACC }}>The Hunter's Satchel</p>
        <h2 className="text-xl md:text-2xl" style={{ color: '#3a1e12' }}>Inventory</h2>
      </div>

      <Section title="Boss Souls — Permanently Active">
        <div className="flex gap-3 justify-center mb-3 flex-wrap">
          {SOULS.map(s => {
            const owned = !!(p.souls && p.souls.has(s.id));
            const isSel = soulSel === s.id;
            return (
              <button key={s.id} onClick={() => owned && setSoulSel(isSel ? null : s.id)}
                className="flex flex-col items-center transition-transform"
                style={{ cursor: owned ? 'pointer' : 'default', transform: isSel ? 'scale(1.08)' : 'none' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  border: `2px solid ${owned ? s.color : 'rgba(122,82,48,0.3)'}`,
                  background: owned ? `radial-gradient(circle at 40% 35%, ${s.color}55, #1a140e)` : 'rgba(40,25,10,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  opacity: owned ? 1 : 0.4,
                  boxShadow: owned ? `0 0 12px ${s.color}66` : 'none',
                }}>
                  <span style={{ filter: owned ? 'drop-shadow(0 0 4px rgba(0,0,0,0.85))' : 'grayscale(1)' }}>{s.icon}</span>
                </div>
                <span className="text-[8px] tracking-widest uppercase mt-1" style={{ color: owned ? s.color : ACC }}>{owned ? 'Awakened' : '—'}</span>
              </button>
            );
          })}
        </div>
        {soulSel ? (() => {
          const s = SOULS.find(x => x.id === soulSel);
          return (
            <div className="px-3 py-2" style={card}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span className="font-semibold" style={{ color: s.color }}>{s.name}</span>
                <span className="text-[9px] tracking-widest uppercase ml-auto" style={{ color: ACC }}>{s.ability}</span>
              </div>
              <p className="text-[12px] italic" style={{ color: '#3a2a1a' }}>{s.desc}</p>
              <p className="text-[10px] mt-1" style={{ color: ACC }}>↳ Always active — cannot be unequipped.</p>
            </div>
          );
        })() : (
          <p className="text-center text-[10px] italic" style={{ color: ACC }}>Defeat the six Guardians to awaken their Souls. Each grants a permanent ability.</p>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        {/* LEFT: possessions */}
        <div className="space-y-4">
          <Section title="Weapons">
            <div className="px-3 py-2" style={card}>
              <div className="flex justify-between"><span className="font-semibold">Saw Cleaver</span><span style={{ color: ACC }}>{p.mode === 'sword' ? 'Cleaver' : 'Scythe'} +{p.weaponLvl}</span></div>
              <div className="text-[11px] italic" style={{ color: '#3a2a1a' }}>A trick blade that unfolds from cleaver to scythe. Slay prey to sharpen it further.</div>
            </div>
          </Section>

          <Section title="Consumables">
            <div className="grid grid-cols-3 gap-2">
              <Consumable icon="🩸" name="Draught" count={p.bloodVials} max={p.maxBloodVials} desc="Restore health [V]" />
              <Consumable icon="🔩" name="Bullets" count={p.bullets} max={p.maxBullets} desc="Quicksilver [R]" />
              <Consumable icon="🔥" name="Molotovs" count={p.molotovs} max={p.maxMolotovs} desc="Thrown fire [G]" />
            </div>
          </Section>

          <Section title="Key Items">
            <div className="space-y-1.5">
              <KeyItem icon="◆" name={`Bloodstone Shards (${p.shards || 0})`} desc="Forge material pried from beasts and chests. Reinforce the Saw Cleaver at the Hunter's Nightmare workshop." />
              <KeyItem icon="🗺️" name={`Map Fragments (${g.collectedFragments ? g.collectedFragments.size : 0})`} desc="Pieces of the Hollow Quarter chart — each restores part of the world map." />
              <KeyItem icon="📜" name={`Lore Notes (${g.readNotes ? g.readNotes.size : 0})`} desc="Recovered inscriptions. Each one deepens your Insight." />
              {permanent.map(id => { const c = getCharm(id); return <KeyItem key={id} icon={c.icon} name={c.name} desc={c.desc} />; })}
            </div>
          </Section>

          {(p.keys && p.keys.size > 0) && (
            <Section title="Keys">
              <div className="space-y-1.5">
                {[...p.keys].map(kId => {
                  const kd = KEY_DEFS[kId] || { name: kId, icon: '🗝️', desc: 'A key pried from the Quarter.' };
                  return <KeyItem key={kId} icon={kd.icon} name={kd.name} desc={kd.desc} />;
                })}
              </div>
            </Section>
          )}

          {questRelics.length > 0 && (
            <Section title="Quest Items">
              <div className="space-y-1.5">
                {questRelics.map(r => <KeyItem key={r.id} icon="✦" name={r.label} desc="Carried for the people of the Quarter." />)}
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT: charms */}
        <div>
          <Section title="Charms — 3 Slots">
            <div className="flex gap-2 mb-3 justify-center">
              {[0, 1, 2].map(i => {
                const id = equipped[i];
                return (
                  <button key={i} onClick={() => id && g.toggleCharm(id)} title={id ? (getCharm(id) || {}).name : 'Empty slot'}
                    className="flex flex-col items-center transition-transform hover:scale-105"
                    style={{ opacity: id ? 1 : 0.45 }}>
                    {id ? <CharmBadge id={id} size={48} /> : <div style={{ width: 48, height: 48, border: '2px dashed rgba(122,82,48,0.5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACC, fontSize: 18 }}>·</div>}
                    <span className="text-[9px] tracking-widest uppercase mt-1" style={{ color: id ? RED : ACC }}>{id ? 'Equipped' : 'Empty'}</span>
                  </button>
                );
              })}
            </div>

            {slotted.length === 0 ? (
              <p className="text-center text-xs italic py-3" style={{ color: ACC }}>No charms yet. Explore the Quarter to find them.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {slotted.map((id, i) => {
                  const c = getCharm(id);
                  const isEq = equipped.includes(id);
                  const isSel = i === sel;
                  const blocked = !isEq && equipped.length >= 3;
                  return (
                    <button key={id} onClick={() => g.toggleCharm(id)}
                      className="flex flex-col items-center p-1 transition-all"
                      style={{
                        background: isEq ? 'rgba(122,60,30,0.18)' : isSel ? 'rgba(122,82,48,0.15)' : 'transparent',
                        border: `1px solid ${isEq ? RING[c.rarity] : 'rgba(122,82,48,0.25)'}`,
                        outline: isSel ? `2px solid ${RING[c.rarity]}` : 'none',
                        cursor: 'pointer',
                      }}>
                      <CharmBadge id={id} size={38} dim={blocked} />
                      <span className="text-[8px] mt-0.5 leading-tight text-center" style={{ color: isEq ? RED : INK }}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selId && (
              <div className="mt-3 px-3 py-2" style={card}>
                <div className="flex items-center gap-2 mb-1">
                  <CharmBadge id={selId} size={30} />
                  <span className="font-semibold">{getCharm(selId).name}</span>
                  <span className="text-[9px] tracking-widest uppercase ml-auto" style={{ color: RING[getCharm(selId).rarity] }}>{RARITY[getCharm(selId).rarity].name}</span>
                </div>
                <p className="text-[12px] italic" style={{ color: '#3a2a1a' }}>{getCharm(selId).desc}</p>
                <p className="text-[10px] mt-1" style={{ color: ACC }}>↳ {getCharm(selId).source}</p>
              </div>
            )}
            <p className="text-[10px] text-center mt-2 tracking-widest uppercase" style={{ color: ACC }}>↑↓←→ navigate · Enter equip/unequip</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (<div><p className="text-[10px] tracking-[0.3em] uppercase mb-1.5" style={{ color: ACC }}>{title}</p>{children}</div>);
}
function Consumable({ icon, name, count, max, desc }) {
  return (
    <div className="px-2 py-2 text-center" style={{ background: 'rgba(40,25,10,0.08)', border: '1px solid rgba(122,82,48,0.35)' }}>
      <div className="text-xl">{icon}</div>
      <div className="text-[10px] font-semibold" style={{ color: INK }}>{count}/{max}</div>
      <div className="text-[8px] uppercase tracking-wider" style={{ color: ACC }}>{name}</div>
      <div className="text-[8px] italic mt-0.5" style={{ color: '#5a4a32' }}>{desc}</div>
    </div>
  );
}
function KeyItem({ icon, name, desc }) {
  return (
    <div className="flex gap-2 items-start px-2 py-1.5" style={{ background: 'rgba(40,25,10,0.06)', border: '1px solid rgba(122,82,48,0.25)' }}>
      <span className="text-lg">{icon}</span>
      <div><div className="text-[12px] font-semibold" style={{ color: INK }}>{name}</div><div className="text-[10px] italic" style={{ color: '#5a4a32' }}>{desc}</div></div>
    </div>
  );
}

export default function Inventory({ game }) {
  const g = game.current;
  const close = () => g && g.closeInventory();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.86)' }} onClick={close}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 md:p-6" onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(135deg,#e6d9b2,#cdb88a 55%,#d4c39a 100%)', color: '#2a1e10',
          boxShadow: '0 0 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(160,120,50,0.25)', border: '1px solid rgba(160,120,50,0.4)' }}>
        <InventoryPanel game={game} />
        <button onClick={close} className="mt-5 w-full py-2.5 text-[11px] tracking-[0.35em] uppercase"
          style={{ fontFamily: 'ui-serif, Georgia, serif', color: '#7a5230', border: '1px solid rgba(122,82,48,0.4)' }}>
          Close Satchel (Tab / Esc)
        </button>
      </div>
    </div>
  );
}