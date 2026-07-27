// Charms.js — definitions for every collectable charm and the equip-slot
// helpers. A hunter may own any number of charms but only 3 are equipped
// (active) at once. shrine_blessing is a permanent blessing (no slot).

export const RARITY = {
  common: { name: 'Common', color: '#9a9a9a' },
  uncommon: { name: 'Uncommon', color: '#6ab04a' },
  rare: { name: 'Rare', color: '#4a8ad6' },
  legendary: { name: 'Legendary', color: '#d6a04a' },
};

export const CHARM_DEFS = [
  // ---- quest charms (existing questline rewards) ----
  { id: 'hunter_charm', name: "Hunter's Charm", rarity: 'uncommon', icon: '🎯', desc: '+15% stamina regeneration.', slot: true, source: "Aldric's questline" },
  { id: 'mire_ring', name: "Mire's Ring", rarity: 'rare', icon: '💍', desc: '+12% firearm damage.', slot: true, source: "Sister Mire's questline" },
  { id: 'forge_belt', name: "Forge Master's Belt", rarity: 'rare', icon: '🔨', desc: '+15% weapon damage.', slot: true, source: "Garrick's questline" },
  { id: 'pilgrim_coin', name: "Pilgrim's Coin", rarity: 'uncommon', icon: '🪙', desc: '+10% essence gained.', slot: true, source: "The Pilgrim's questline" },
  { id: 'healer_pendant', name: "Healer's Pendant", rarity: 'rare', icon: '✚', desc: "Hunter's Draught restores +25% health.", slot: true, source: "Mira's questline" },
  { id: 'child_charm', name: "Child's Charm", rarity: 'legendary', icon: '🌙', desc: '+5% all damage, +10% essence.', slot: true, source: "The Pale Child's questline" },
  { id: 'forbidden_sigil', name: 'Forbidden Sigil', rarity: 'rare', icon: '🔯', desc: 'Health regenerates slowly.', slot: true, source: "Sister Mire's remains" },
  { id: 'shrine_blessing', name: 'Shrine Blessing', rarity: 'uncommon', icon: '⛩️', desc: '+30 maximum Health (permanent).', slot: false, source: "The Pilgrim's shrine" },
  // ---- hidden charms (new — found through exploration & combat) ----
  { id: 'hunters_reach', name: "Hunter's Reach", rarity: 'uncommon', icon: '🗡️', desc: 'Increases melee weapon range by 15%.', slot: true, source: "Drowned Vicar's cathedral" },
  { id: 'ember_heart', name: 'Ember Heart', rarity: 'rare', icon: '🔥', desc: 'Molotovs deal 30% more damage and have a larger blast radius.', slot: true, source: 'The Burning Graveyard' },
  { id: 'blood_sigil', name: 'Blood Sigil', rarity: 'rare', icon: '🩸', desc: '+10% damage dealt, but +10% damage taken.', slot: true, source: 'The Nightmare' },
  { id: 'lanterns_grace', name: "Lantern's Grace", rarity: 'rare', icon: '🏮', desc: 'Healing items restore 25% more health.', slot: true, source: 'The Sunken Cathedral' },
  { id: 'swift_hunter', name: 'Swift Hunter', rarity: 'uncommon', icon: '💨', desc: 'Longer dodge distance and a few extra invincibility frames.', slot: true, source: 'The Overlook Cathedral' },
  { id: 'scholars_fortune', name: "Scholar's Fortune", rarity: 'rare', icon: '📖', desc: 'Enemies grant 20% more essence.', slot: true, source: 'The Library secret archive' },
  { id: 'endless_resolve', name: 'Endless Resolve', rarity: 'uncommon', icon: '💪', desc: 'Increases maximum stamina by 20%.', slot: true, source: 'The Grand Ancient Library' },
  { id: 'executioners_reward', name: "Executioner's Reward", rarity: 'rare', icon: '🪓', desc: 'Defeating an enemy has a chance to restore some health.', slot: true, source: 'The Drowned Sanctum' },
  { id: 'iron_will', name: 'Iron Will', rarity: 'legendary', icon: '🛡️', desc: 'Take 12% less damage from all sources.', slot: true, source: "The Castellan's sealed treasury" },
  { id: 'hunters_tempo', name: "Hunter's Tempo", rarity: 'rare', icon: '⚡', desc: '+15% attack speed and +10% maximum stamina.', slot: true, source: 'The Cliffside Walkways' },
  { id: 'northward_resolve', name: 'Northward Resolve', rarity: 'legendary', icon: '🏔️', desc: 'Increases maximum stamina by 30%.', slot: true, source: 'The Forgotten Northwest' },
];

export const HIDDEN_CHARMS = ['hunters_reach', 'ember_heart', 'blood_sigil', 'lanterns_grace', 'swift_hunter', 'scholars_fortune', 'endless_resolve', 'executioners_reward', 'iron_will', 'hunters_tempo', 'northward_resolve'];

export function getCharm(id) { return CHARM_DEFS.find(c => c.id === id); }
export function rarityColor(r) { return (RARITY[r] || RARITY.common).color; }

// Recompute derived stats after an equip change or level-up.
// Currently: maximum stamina (Endless Resolve) scales off the base value.
export function recomputeStats(game) {
  const p = game.player;
  if (!p) return;
  // Endurance upgrades grant 30% less max stamina than before (8 → 5.6 per level).
  const base = 100 + (p.end - 10) * 5.6 + (p.staminaBonus || 0);
  p.baseMaxStamina = base;
  let m = 1;
  if (p.equipped && p.equipped.includes('endless_resolve')) m *= 1.2;
  if (p.equipped && p.equipped.includes('hunters_tempo')) m *= 1.10;
  if (p.equipped && p.equipped.includes('northward_resolve')) m *= 1.30;
  p.maxStamina = Math.floor(base * m);
  if (p.stamina > p.maxStamina) p.stamina = p.maxStamina;
}