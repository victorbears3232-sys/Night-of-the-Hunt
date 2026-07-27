// MapSystem.js — fog-of-war, map-fragment charting, and world-map state.
// Pure helpers operating on a HuntGame instance `g`. Keeps HuntGame.js focused on combat.
//
// Design: walking reveals only a small local fog-of-war trail (for the mini-map
// and immediate orientation). A region is NOT charted on the world map simply by
// entering it — only collecting that region's Map Fragment unveils it. Collected
// fragments persist across reloads via localStorage.

import { arenaLockAt } from './BossArenas.js';

const TAU = Math.PI * 2;
const SAVE_KEY = 'hunt_map_v1';

export function updateDiscovery(g) {
  const p = g.player;
  const S = g.sectorSize;
  const cx = Math.floor(p.x / S), cy = Math.floor(p.y / S);
  let changed = false;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const key = (cx + dx) + ',' + (cy + dy);
    if (!g.revealed.has(key)) { g.revealed.add(key); changed = true; }
  }
  // Entering a new region still announces its name (atmosphere + chime), but
  // does NOT chart it — only a Map Fragment can reveal a region on the world map.
  const pr = g.regions.find(r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (pr) {
    if (!g._enteredAreas) g._enteredAreas = new Set();
    if (!g._enteredAreas.has(pr.id)) {
      g._enteredAreas.add(pr.id);
      if (g.showAreaTitle) g.showAreaTitle(pr.name);
      changed = true;
    }
  }
  if (changed) pushMapState(g);
}

export function collectFragment(g, f) {
  f.collected = true;
  g.collectedFragments.add(f.id);
  // A fragment charts one or more adjacent regions — a whole territory at once,
  // so every discovery feels significant. (Single-region fragments use `region`.)
  const ids = f.regions || (f.region ? [f.region] : []);
  const revealedRegions = [];
  for (const id of ids) {
    const r = g.regions.find(rr => rr.id === id);
    if (!r) continue;
    const S = g.sectorSize;
    const x0 = Math.floor(r.x / S), x1 = Math.floor((r.x + r.w) / S);
    const y0 = Math.floor(r.y / S), y1 = Math.floor((r.y + r.h) / S);
    for (let sx = x0; sx <= x1; sx++) for (let sy = y0; sy <= y1; sy++) g.revealed.add(sx + ',' + sy);
    if (!g.discoveredRegions.has(r.id)) g.discoveredRegions.add(r.id);
    revealedRegions.push(r);
  }
  // a single grand unveil sweep spanning the whole newly charted territory
  if (revealedRegions.length) {
    let bx = Infinity, by = Infinity, bx2 = -Infinity, by2 = -Infinity;
    for (const r of revealedRegions) { bx = Math.min(bx, r.x); by = Math.min(by, r.y); bx2 = Math.max(bx2, r.x + r.w); by2 = Math.max(by2, r.y + r.h); }
    g._mapRevealAnim = { x: bx, y: by, w: bx2 - bx, h: by2 - by, t0: performance.now() };
  }
  g._burst(f.x, f.y, '#d4b870', 34, 200);
  g.camera.shake = Math.max(g.camera.shake, 6);
  if (g.sound.fragment) g.sound.fragment();
  if (g.sound.fragmentDiscovery) g.sound.fragmentDiscovery();
  saveMap(g);
  pushMapState(g);
  // Cinematic discovery: pause the Hunt and surface the dedicated screen until
  // the player chooses to continue. The hook carries the territory's name,
  // description, and the regions to preview.
  g.paused = true;
  g.pauseReason = 'fragment';
  g._fragmentDiscovery = {
    name: f.name || (revealedRegions[0] && revealedRegions[0].name) || 'A Forgotten Corner',
    desc: f.desc || 'A weathered piece of parchment revealing another forgotten corner of the kingdom.',
    hint: f.hint || '',
    regionNames: revealedRegions.map(r => r.name),
    regionIds: ids,
    x: f.x, y: f.y,
  };
  g.hooks.onFragmentDiscovery && g.hooks.onFragmentDiscovery(g._fragmentDiscovery);
}

export function pushMapState(g) {
  if (!g.hooks.onMapState) return;
  g.hooks.onMapState({
    regions: g.regions,
    revealed: Array.from(g.revealed),
    fragments: g.fragments.map(f => ({ id: f.id, region: f.region, regions: f.regions || (f.region ? [f.region] : []), x: f.x, y: f.y, collected: !!f.collected, hint: f.hint, name: f.name })),
    discoveredRegions: Array.from(g.discoveredRegions),
    defeatedBosses: Array.from(g.defeatedBosses),
    lanterns: g.visitedLanterns ? Array.from(g.visitedLanterns.values()) : [],
    revealAnim: g._mapRevealAnim || null,
    deathMarker: g.deathMarker || null,
  });
}

// ---- persistence: collected map fragments survive a page reload ----
export function saveMap(g) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ fragments: Array.from(g.collectedFragments) })); } catch (e) {}
}
export function loadPersistedMap(g) {
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return; }
  if (!data || !Array.isArray(data.fragments)) return;
  for (const id of data.fragments) {
    const f = g.fragments.find(ff => ff.id === id);
    if (!f || f.collected) continue;
    f.collected = true;
    g.collectedFragments.add(id);
    const ids = f.regions || (f.region ? [f.region] : []);
    for (const id of ids) {
      const r = g.regions.find(rr => rr.id === id);
      if (!r) continue;
      const S = g.sectorSize;
      const x0 = Math.floor(r.x / S), x1 = Math.floor((r.x + r.w) / S);
      const y0 = Math.floor(r.y / S), y1 = Math.floor((r.y + r.h) / S);
      for (let sx = x0; sx <= x1; sx++) for (let sy = y0; sy <= y1; sy++) g.revealed.add(sx + ',' + sy);
      if (!g.discoveredRegions.has(r.id)) g.discoveredRegions.add(r.id);
    }
  }
}

// Draws uncollected map fragments as glowing sealed scrolls on a stone plinth.
export function drawFragments(g, ctx) {
  for (const f of g.fragments) {
    if (f.collected) continue;
    if (f.inChest) continue;   // a fragment tucked inside a chest is drawn as the chest, not a scroll
    if (arenaLockAt(g, f.x, f.y)) continue;
    const pulse = 0.6 + Math.sin(g.runtime * 3 + f.x * 0.01) * 0.4;
    // plinth
    ctx.fillStyle = '#2a2620'; ctx.fillRect(f.x - 8, f.y - 2, 16, 6);
    ctx.fillStyle = '#3a3328'; ctx.fillRect(f.x - 8, f.y - 4, 16, 2);
    // scroll body
    ctx.fillStyle = '#e8d9a0'; ctx.fillRect(f.x - 5, f.y - 14, 10, 13);
    ctx.fillStyle = '#c9a86a'; ctx.fillRect(f.x - 5, f.y - 14, 10, 2);
    ctx.fillRect(f.x - 5, f.y - 3, 10, 2);
    // wax seal
    ctx.fillStyle = '#a83232'; ctx.beginPath(); ctx.arc(f.x, f.y - 7, 3, 0, TAU); ctx.fill();
    // warm glow
    const grd = ctx.createRadialGradient(f.x, f.y - 7, 2, f.x, f.y - 7, 28);
    grd.addColorStop(0, `rgba(255,210,130,${0.32 * pulse})`); grd.addColorStop(1, 'rgba(255,210,130,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(f.x, f.y - 7, 28, 0, TAU); ctx.fill();
    if (g.player.nearFragment === f) {
      ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y - 6, 22 + Math.sin(g.runtime * 4) * 2, 0, TAU); ctx.stroke();
    }
  }
}