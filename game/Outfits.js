// Outfits.js — cosmetic hunter outfits. Each set is a palette that overrides
// the player render's colors (plus optional features like a beak mask or a
// gold accent). Cosmetic ONLY — no stats. Owned/equipped state lives on the
// player (p.outfits Set, p.outfit id). The "hunter_garb" is the starting set.

export const OUTFITS = [
  {
    id: 'hunter_garb', name: "Hunter's Garb", price: 0,
    desc: 'The worn coat you woke in. A trick blade and a long night.',
    palette: { coat:'#1c1820', coatShade:'#13101a', coatLining:'#3a1a1a', vest:'#2a2630', shirt:'#4a4438', hat:'#0c0a10', hatBrim:'#16121c' },
  },
  {
    id: 'old_hunter', name: 'Old Hunter Set', price: 1200,
    desc: 'Worn leather, oiled and scarred. The classic hunt, the way the first Hunters wore it.',
    palette: { coat:'#3a2a1c', coatShade:'#241a10', coatLining:'#5a3a1a', vest:'#4a3420', shirt:'#6a5a3a', hat:'#1a1208', hatBrim:'#2a1c10' },
  },
  {
    id: 'trapper', name: 'Trapper Set', price: 1800,
    desc: 'Rugged hides layered for surviving beasts. Thick where it matters, light where it must.',
    palette: { coat:'#2a3a24', coatShade:'#1a2418', coatLining:'#4a3a1a', vest:'#3a4a2c', shirt:'#5a4a3a', hat:'#0c1408', hatBrim:'#1a2410' },
  },
  {
    id: 'royal_hunter', name: 'Royal Hunter Set', price: 4000,
    desc: 'Elegant velvet with gold thread — the livery of a noble order, long since drowned.',
    palette: { coat:'#3a1a3a', coatShade:'#241024', coatLining:'#d4a040', vest:'#4a2a4a', shirt:'#6a4a3a', hat:'#1a0a1a', hatBrim:'#2a1430' },
    accent: '#d4a040',
  },
  {
    id: 'plague_doctor', name: 'Plague Doctor Set', price: 2600,
    desc: 'A beaked mask and dark cloak. The Quarter\'s last physicians wore these to the wet wards.',
    palette: { coat:'#1a1410', coatShade:'#0c0a08', coatLining:'#2a2218', vest:'#241c14', shirt:'#3a3026', hat:'#0a0806', hatBrim:'#1a1410' },
    mask: 'beak',
  },
  {
    id: 'nightmare_wanderer', name: 'Nightmare Wanderer Set', price: 10000,
    desc: 'A darker, corrupted weave. It hums faintly when the rain falls, and the rain falls always.',
    palette: { coat:'#1a1424', coatShade:'#0c0814', coatLining:'#4a2a6a', vest:'#241a30', shirt:'#3a2a44', hat:'#08060c', hatBrim:'#141020' },
    accent: '#a06ad6',
    unlock: g => g.defeatedBosses && g.defeatedBosses.has('nightmare'),
  },
  {
    id: 'golden_hunter', name: 'Golden Hunter Set', price: 12000,
    desc: 'A relic of the First Hunters — aged gold leaf laid over blackened steel. The mark of one who has seen the Hunt through to its end. Cosmetic only.',
    palette: { coat:'#3a2e18', coatShade:'#241c0e', coatLining:'#c9a23a', vest:'#4a3a1c', shirt:'#6a5a2a', hat:'#1a1408', hatBrim:'#2a2010' },
    accent: '#c9a23a',
    legendary: true,
  },
  {
    id: 'wraith_shroud', name: 'Wraith Shroud', price: 0,
    desc: 'A ghostly pale weave won from the shade in the gardens. It does not quite hang on the body.',
    palette: { coat: '#c8d4e4', coatShade: '#a8b8cc', coatLining: '#3a4a5a', vest: '#b0c0d4', shirt: '#d8e0ec', hat: '#8a98a8', hatBrim: '#a8b8cc' },
    accent: '#bcd8f0',
    unlock: g => !!(g.player && g.player.outfits && g.player.outfits.has('wraith_shroud')),
  },
  {
    id: 'frostveil_set', name: 'Frostveil Set', price: 0,
    desc: 'A rime-crusted vestment won from the Winter Hierophant. It is cold to the touch, and the cold does not touch back.',
    palette: { coat: '#3a5a78', coatShade: '#244a64', coatLining: '#b8d8ee', vest: '#4a6a88', shirt: '#c8d8e4', hat: '#2a4a68', hatBrim: '#3a5a78' },
    accent: '#b8e8ff',
    unlock: g => !!(g.player && g.player.outfits && g.player.outfits.has('frostveil_set')),
  },
  {
    id: 'castellan_plate', name: "Castellan's Plate", price: 0,
    desc: 'The heraldry of the fallen keep, won from the Hollow Castellan. Heavy, gilded, unyielding — the mark of one who held the line long after the line was gone.',
    palette: { coat: '#3a3a44', coatShade: '#1a1a22', coatLining: '#d4a040', vest: '#2a2a34', shirt: '#6a5a3a', hat: '#222230', hatBrim: '#3a3a44' },
    accent: '#d4a040',
    legendary: true,
    unlock: g => !!(g.player && g.player.outfits && g.player.outfits.has('castellan_plate')),
  },
  {
    id: 'wail_mantle', name: 'Wail Mantle', price: 0,
    desc: 'A tattered moss-furred mantle won from the Wailing Mother. It muffles sound, and sometimes, very faintly, it answers.',
    palette: { coat: '#2a3a24', coatShade: '#16240e', coatLining: '#5a7a3a', vest: '#243a1e', shirt: '#6a7a4a', hat: '#1a2a14', hatBrim: '#2a3a24' },
    accent: '#7aa86a',
    unlock: g => !!(g.player && g.player.outfits && g.player.outfits.has('wail_mantle')),
  },
];

export const OUTFIT_MAP = Object.fromEntries(OUTFITS.map(o => [o.id, o]));
export function getOutfit(id) { return OUTFIT_MAP[id] || OUTFIT_MAP['hunter_garb']; }