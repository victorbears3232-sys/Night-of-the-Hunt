// WeaponSkins.js — cosmetic weapon skins for the Saw Cleaver. Same stats and
// moveset; only the blade's colors (and an optional effect) change. Owned/
// equipped state lives on the player (p.skins Set, p.skin id). The "default" is
// the stock blade. The Nightmare skin is gated behind its boss; the rest are
// bought at the Hunter's Nightmare workshop forge with essence.

export const SKINS = [
  { id: 'default', name: 'Saw Cleaver', price: 0, desc: 'The standard trick blade — folded steel and serrated teeth.',
    steel: '#c9d2e2', steelDark: '#7a8499', serrate: '#9aa6bd', blood: 'rgba(120,20,20,0.5)', handle: '#5a4a3a', pommel: '#9a7a3a' },
  { id: 'bloodstained', name: 'Bloodstained Cleaver', price: 1500, desc: 'Darker steel slick with fresh gore; the teeth run red.',
    steel: '#9a7a6a', steelDark: '#5a3a30', serrate: '#7a5a4a', blood: 'rgba(180,20,20,0.85)', handle: '#3a1810', pommel: '#6a3a1a', effect: 'blood' },
  { id: 'ancient', name: 'Ancient Cleaver', price: 2200, desc: 'Worn old-hunter steel, pitted and proud with age.',
    steel: '#8a8470', steelDark: '#5a5440', serrate: '#6a6450', blood: 'rgba(90,70,40,0.55)', handle: '#3a2a18', pommel: '#6a5a3a', effect: 'rust' },
  { id: 'royal', name: 'Royal Cleaver', price: 4000, desc: "Clean, decorated steel with gilded teeth — a noble order's blade.",
    steel: '#e0e6f0', steelDark: '#9aa0b0', serrate: '#d4a040', blood: 'rgba(120,20,20,0.4)', handle: '#2a1a2a', pommel: '#d4a040', accent: '#d4a040' },
  { id: 'nightmare', name: 'Nightmare Cleaver', price: 10000, desc: 'Corrupted steel that hums with the dream; it bleeds violet.',
    steel: '#7a6aa0', steelDark: '#3a2a5a', serrate: '#b08ad6', blood: 'rgba(150,50,180,0.7)', handle: '#1a1024', pommel: '#a06ad6', accent: '#a06ad6', effect: 'glow',
    unlock: g => g.defeatedBosses && g.defeatedBosses.has('nightmare') },
  { id: 'golden', name: 'Golden Cleaver', price: 12000, desc: "The First Hunter's blade — antique gold etched with the old script. A trophy for the relentless. Cosmetic only.",
    steel: '#c9a23a', steelDark: '#7a5e1c', serrate: '#e0c060', blood: 'rgba(140,20,20,0.5)', handle: '#2a1c0a', pommel: '#e0c060', accent: '#e0c060', legendary: true },
];

export const SKIN_MAP = Object.fromEntries(SKINS.map(s => [s.id, s]));
export function getSkin(id) { return SKIN_MAP[id] || SKIN_MAP['default']; }

export function buy(game, id) {
  const s = getSkin(id); if (!s) return false;
  const p = game.player;
  if (p.skins.has(id)) return false;
  if (s.unlock && !s.unlock(game)) { game._showMsg('That steel is not yet yours to wield.', 1500); return false; }
  if (p.essence < (s.price || 0)) { game._showMsg('Not enough essence.', 1000); return false; }
  p.essence -= (s.price || 0); p.skins.add(id); p.skin = id;
  game.sound.upgradeWeapon(); game._showMsg('Acquired: ' + s.name, 2000); game._pushHud();
  return true;
}

export function equip(game, id) {
  const s = getSkin(id); if (!s || !game.player.skins.has(id)) return false;
  game.player.skin = id; game.sound.equipCharm(); game._pushHud(); return true;
}