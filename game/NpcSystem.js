// NpcSystem.js — quest/NPC logic, kept separate from the engine to stay lean.
// Mirrors the MapSystem pattern: pure functions taking the game instance.

import { NPCS, RELICS, CHARM_EFFECTS } from './NPCs.js';
import { recomputeStats } from './Charms.js';
import { arenaLockAt } from './BossArenas.js';

const TAU = Math.PI * 2;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const MAJOR_BOSSES = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist'];

// The effective position of an NPC at its current stage. Quest-giving NPCs who
// roam the wild world relocate to a permanent spot in the Hunter's Nightmare
// hub only after the player next rests at a lantern following their meeting
// (onLanternRest sets movedToHub), so the player can always return to the hub
// to turn in quests, collect rewards, and continue the questline — and the NPC
// feels like it actually traveled there instead of vanishing instantly.
// NPCs without a hubPos (or not yet moved) stay at their stage's world spot.
export function npcStagePos(n) {
  const st = n.def.stages[n.stage];
  if (n.def.hubPos && n.movedToHub) return n.def.hubPos;
  return { x: st.x, y: st.y };
}

// Quest-giving NPCs who have accepted their task relocate to the Hunter's
// Nightmare hub only after the player next rests at a lantern — so they feel
// like they actually traveled, rather than vanishing the instant you say yes.
export function onLanternRest(game) {
  for (const n of game.npcs) {
    if (n.def.hubPos && n.talkedStage >= 0) n.movedToHub = true;
  }
}

export function initNpcs(game) {
  game.npcs = NPCS.map(n => ({ def: n, stage: 0, rewardClaimedStage: -1, talkedStage: -1, talkedProgress: undefined, movedToHub: false }));
  game.relics = RELICS.map(r => ({ ...r, collected: false }));
  game.questItems = new Set();
  game.questLogOpen = false;
  game.paused = false;
}

export function checkAdvance(game, npc) {
  const st = npc.def.stages[npc.stage];
  if (!st.advance) return false;
  if (st.advance.type === 'boss') return game.defeatedBosses.has(st.advance.value);
  if (st.advance.type === 'item') return game.questItems.has(st.advance.value);
  if (st.advance.type === 'discover') return !!(game._enteredAreas && game._enteredAreas.has(st.advance.value));
  if (st.advance.type === 'all') return MAJOR_BOSSES.every(id => game.defeatedBosses.has(id));
  return false;
}

export function advanceNpc(game, npc) {
  npc.stage++;
  const st = npc.def.stages[npc.stage];
  if (st && st.gone && st.leftBehind) {
    game.relics.push({
      id: npc.def.id + '_remains', x: st.x, y: st.y,
      reward: st.leftBehind.reward, label: npc.def.name + "'s Remains",
      color: '#a06ad6', collected: false, remains: true,
    });
  }
  pushQuestState(game);
}

export function updateNpcs(game, dt) {
  for (const n of game.npcs) {
    const st = n.def.stages[n.stage];
    if (!st.advance || st.advanceMode !== 'auto') continue;
    if (n.stage >= n.def.stages.length - 1) continue;
    if (checkAdvance(game, n)) advanceNpc(game, n);
  }
}

function claimReward(game, npc, st) {
  if (npc.rewardClaimedStage === npc.stage) return;
  npc.rewardClaimedStage = npc.stage;
  if (st.reward) applyReward(game, st.reward);
}

export function applyReward(game, reward) {
  const list = Array.isArray(reward) ? reward : [reward];
  const p = game.player;
  for (const r of list) {
    if (r.type === 'hp') { p.hpBonus += r.amount; p.maxHp += r.amount; p.hp += r.amount; }
    else if (r.type === 'stamina') { p.staminaBonus += r.amount; p.maxStamina += r.amount; p.stamina += r.amount; }
    else if (r.type === 'weapon') { p.weaponLvl += r.amount; }
    else if (r.type === 'vials') { p.maxBloodVials += r.amount; p.bloodVials += r.amount; }
    else if (r.type === 'essence') { p.essence += Math.round(r.amount); }
    else if (r.type === 'charm') {
      game._grantCharm(r.id);
      if (r.id === 'shrine_blessing') { p.hpBonus += 30; p.maxHp += 30; p.hp += 30; }
    } else if (r.type === 'passive') { p.passives.add(r.id); }
    game._showMsg('Received: ' + r.label, 2400);
  }
  recomputeStats(game);
  game.sound.levelup();
  game.hooks.onReward && game.hooks.onReward(list);
}

function sendNpcDialog(game, npc, st) {
  const first = npc.talkedStage !== npc.stage;
  npc.talkedStage = npc.stage;
  let intro = null, lines;
  if (typeof st.dialogue === 'function') {
    // Dynamic dialogue (Elias): computed from live game state. The reaction
    // line re-shows only when progress has changed since the last talk, so
    // returning after a new boss defeat greets you with fresh words.
    const d = st.dialogue(game) || {};
    intro = d.intro || null;
    lines = d.lines ? [...d.lines] : [];
    const sig = d.sig !== undefined ? d.sig : (game.defeatedBosses ? game.defeatedBosses.size : 0);
    if (npc.talkedProgress === sig) intro = null; else npc.talkedProgress = sig;
  } else {
    intro = (first && st.intro) ? st.intro : null;
    lines = st.lines ? [...st.lines] : [];
  }
  let out = intro ? [intro, ...lines] : [...lines];
  // Evolving ambient dialogue: a stage may carry a `react(game)` function that
  // returns extra lines computed from the live world (e.g. which Guardians
  // have fallen). This lets an NPC's words shift as the Hunt progresses and
  // lets different NPCs contradict one another about the Night of the Hunt.
  if (typeof st.react === 'function') {
    const r = st.react(game);
    if (r && r.length) out = [...out, ...r];
  }
  // When the NPC has set a task that isn't complete yet, tell the player to return for a reward.
  if (st.advance && !checkAdvance(game, npc)) {
    out = [...out, npc.def.returnLine || 'Return to me when it is done, and your reward will be waiting.'];
  }
  game.hooks.onNpcDialog && game.hooks.onNpcDialog({
    id: npc.def.id, name: npc.def.name, title: npc.def.title,
    color: npc.def.color, figure: npc.def.figure, bio: npc.def.bio,
    lines: out,
    reward: (first && st.reward) ? st.reward : null,
    final: npc.stage >= npc.def.stages.length - 1,
  });
}

export function talkNpc(game, npc) {
  const def = npc.def;
  if (def.outfitShop) {
    game.paused = true;
    game.pauseReason = 'outfit';
    game._outfitNpc = npc;
    game.hooks.onOutfitShop && game.hooks.onOutfitShop({ def, npc });
    game._pushHud();
    return;
  }
  if (def.shop) {
    game.paused = true;
    game.pauseReason = 'shop';
    game._shopNpc = npc;
    game.hooks.onShop && game.hooks.onShop({ def, npc });
    game._pushHud();
    return;
  }
  game.paused = true;
  game.pauseReason = 'dialog';
  const def2 = npc.def;
  let st = def.stages[npc.stage];
  if (st.advance && st.advanceMode !== 'auto' && checkAdvance(game, npc) && npc.stage < def2.stages.length - 1) {
    advanceNpc(game, npc);
    st = def.stages[npc.stage];
  }
  claimReward(game, npc, st);
  const firstTalk = npc.talkedStage !== npc.stage;
  if (firstTalk && typeof st.onTalk === 'function') st.onTalk(game);
  sendNpcDialog(game, npc, st);
  pushQuestState(game);
  game._pushHud();
}

export function closeDialog(game) {
  game.paused = false;
  game.pauseReason = null;
  game.hooks.onNpcDialog && game.hooks.onNpcDialog(null);
}

export function closeShop(game) {
  game.paused = false;
  game.pauseReason = null;
  game._shopNpc = null;
  game.hooks.onShop && game.hooks.onShop(null);
}

export function toggleQuestLog(game) {
  if (!game.questLogOpen && game.inventoryOpen) return;
  if (!game.questLogOpen && game.state !== 'playing' && game.state !== 'bossActive' && game.state !== 'levelup') return;
  game.questLogOpen = !game.questLogOpen;
  game.paused = game.questLogOpen;
  game.pauseReason = game.questLogOpen ? 'questlog' : null;
  game.hooks.onQuestLogToggle && game.hooks.onQuestLogToggle(game.questLogOpen);
  if (game.questLogOpen) { pushQuestState(game); game._pushMapState && game._pushMapState(); }
}

export function closePauseOverlay(game) {
  if (!game.paused) return;
  if (game.pauseReason === 'pause') { game.paused = false; game.pauseReason = null; game.hooks.onPauseToggle && game.hooks.onPauseToggle(false); return; }
  if (game.pauseReason === 'dialog') return closeDialog(game);
  if (game.pauseReason === 'shop') return closeShop(game);
  if (game.pauseReason === 'restwarn') return game.cancelRest();
  if (game.pauseReason === 'lantern') return game.closeLanternRest();
  if (game.pauseReason === 'workshop') return game.closeWorkshop();
  if (game.pauseReason === 'outfit') return game.closeOutfitShop();
  if (game.pauseReason === 'keyReward') return game.dismissKeyReward();
  if (game.pauseReason === 'mapTable') return game.closeMapTable();
  if (game.pauseReason === 'inventory') {
    game.inventoryOpen = false;
    game.paused = false;
    game.pauseReason = null;
    game.hooks.onInventoryToggle && game.hooks.onInventoryToggle(false);
    return;
  }
  if (game.pauseReason === 'questlog') {
    game.questLogOpen = false;
    game.paused = false;
    game.pauseReason = null;
    game.hooks.onQuestLogToggle && game.hooks.onQuestLogToggle(false);
  }
}

// A quest item only exists / is collectible once its NPC quest has been
// accepted — the player has spoken to the NPC at the stage that asks for it.
// Before that the item is neither drawn nor collectible, so a quest can never
// be finished before the player knows it exists.
export function questItemActive(game, itemId) {
  for (const n of game.npcs) {
    const stages = n.def.stages;
    for (let s = 0; s < stages.length; s++) {
      const a = stages[s].advance;
      if (a && a.type === 'item' && a.value === itemId) return n.stage === s && n.talkedStage === s;
    }
  }
  return false;
}

// The NPC whose current quest stage asks for the given quest item (if any).
export function questItemNpc(game, itemId) {
  for (const n of game.npcs) {
    const stages = n.def.stages;
    for (let s = 0; s < stages.length; s++) {
      const a = stages[s].advance;
      if (a && a.type === 'item' && a.value === itemId) return n;
    }
  }
  return null;
}

export function collectRelic(game, r) {
  if (r.collected) return;
  if (r.questItem && !questItemActive(game, r.id)) return;
  r.collected = true;
  if (r.questItem) {
    game.questItems.add(r.id);
    const npc = questItemNpc(game, r.id);
    const name = npc ? npc.def.name : 'the quest giver';
    const where = npc && npc.def.hubPos ? " in the Hunter's Nightmare" : '';
    game._showMsg('Quest Item Retrieved — Return to ' + name + where + '.', 3200);
    game.sound.fragment();
  }
  if (r.reward) applyReward(game, r.reward);
  pushQuestState(game);
  game._pushHud();
}

export function pushQuestState(game) {
  if (!game.hooks.onQuestState) return;
  const quests = game.npcs.map(n => {
    const st = n.def.stages[n.stage];
    if (!st.quest) return null;
    // The main quest line is always visible once introduced and auto-updates as
    // its objective is met — no return trip to the mentor required. Side quests
    // only appear once the hunter has spoken to receive them.
    if (n.def.mainQuest) {
      if (n.talkedStage < 0) return null;
    } else if (n.talkedStage !== n.stage) {
      return null;
    }
    const done = checkAdvance(game, n);
    return {
      npcId: n.def.id, name: n.def.name, title: n.def.title,
      questTitle: st.quest.title, objective: st.quest.objective,
      status: done && st.advanceMode !== 'auto' ? 'return' : 'active',
      mainQuest: !!n.def.mainQuest,
    };
  }).filter(Boolean);
  game.hooks.onQuestState(quests);
}

// ---- charm / passive multipliers ----
// A charm only grants its bonus while equipped (player.equipped, max 3).
const eq = (g, id) => !!(g.player.equipped && g.player.equipped.includes(id));

export function dmgMult(game) {
  let m = 1;
  if (eq(game, 'forge_belt')) m *= 1.15;
  if (eq(game, 'child_charm')) m *= 1.05;
  if (eq(game, 'blood_sigil')) m *= 1.10;
  return m;
}
export function bulletDmgMult(game) {
  let m = 1;
  if (eq(game, 'mire_ring')) m *= 1.12;
  if (eq(game, 'child_charm')) m *= 1.05;
  if (eq(game, 'forbidden_sigil')) m *= 1.05;
  if (eq(game, 'blood_sigil')) m *= 1.10;
  return m;
}
export function arcBonus(game) {
  return (eq(game, 'mire_ring') ? 1 : 0) + (eq(game, 'forbidden_sigil') ? 1 : 0);
}
export function essenceMult(game) {
  let m = 1;
  if (eq(game, 'pilgrim_coin')) m *= 1.10;
  if (eq(game, 'child_charm')) m *= 1.10;
  if (eq(game, 'scholars_fortune')) m *= 1.20;
  return m;
}
export function staminaRegenMult(game) { return eq(game, 'hunter_charm') ? 1.15 : 1; }
export function healMult(game) {
  let m = 1;
  if (eq(game, 'healer_pendant')) m *= 1.25;
  if (eq(game, 'lanterns_grace')) m *= 1.25;
  return m;
}
// ---- new hidden-charm hooks ----
export function reachMult(game) { return eq(game, 'hunters_reach') ? 1.15 : 1; }
export function dodgeDistMult(game) { return eq(game, 'swift_hunter') ? 1.2 : 1; }
export function dodgeIframeBonus(game) { return eq(game, 'swift_hunter') ? 0.09 : 0; }
export function hurtMult(game) {
  let m = 1;
  if (eq(game, 'blood_sigil')) m *= 1.10;
  if (eq(game, 'iron_will')) m *= 0.88;
  return m;
}
export function molotovDmgMult(game) { return eq(game, 'ember_heart') ? 1.30 : 1; }
export function molotovRadiusMult(game) { return eq(game, 'ember_heart') ? 1.25 : 1; }
export function killHealChance(game) { return eq(game, 'executioners_reward') ? 0.18 : 0; }

// ---- rendering ----
export function drawNpcs(game, ctx) {
  for (const n of game.npcs) {
    const st = n.def.stages[n.stage];
    if (st.gone) continue;
    const { x, y } = npcStagePos(n);
    const r = n.def.r;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.7, r, r * 0.4, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.2);
    g.addColorStop(0, 'rgba(200,180,120,0.10)'); g.addColorStop(1, 'rgba(200,180,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill();
    drawNpcFigure(game, ctx, n);
    ctx.restore();
    if (game.player.nearNpc === n) {
      const pulse = 0.5 + Math.sin(game.runtime * 4) * 0.5;
      const bob = Math.sin(game.runtime * 3) * 2;
      const py = y - r - 24 + bob;
      // soft halo
      const g = ctx.createRadialGradient(x, py, 2, x, py, 18);
      g.addColorStop(0, `rgba(232,192,96,${0.45 + pulse * 0.25})`); g.addColorStop(1, 'rgba(232,192,96,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, py, 18, 0, TAU); ctx.fill();
      // diamond prompt
      ctx.fillStyle = '#120e08'; ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, py - 9); ctx.lineTo(x + 8, py); ctx.lineTo(x, py + 9); ctx.lineTo(x - 8, py); ctx.closePath(); ctx.fill(); ctx.stroke();
      // key glyph
      ctx.fillStyle = '#f0d090'; ctx.font = 'bold 10px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('E', x, py + 0.5); ctx.textBaseline = 'alphabetic';
      // ground ring
      ctx.strokeStyle = `rgba(232,192,96,${0.35 + pulse * 0.25})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(x, y, r + 8 + pulse * 2, 0, TAU); ctx.stroke();
    }
  }
}

function drawNpcFigure(game, ctx, n) {
  const r = n.def.r, body = n.def.color, fig = n.def.figure;
  const speaking = game.paused && game.pauseReason === 'dialog' && game.player.nearNpc === n;
  const sway = Math.sin(game.runtime * 1.5 + n.def.x * 0.01) * 1.2
    + (speaking ? Math.sin(game.runtime * 6) * 1.6 : 0);
  ctx.save(); ctx.translate(0, sway);
  if (speaking) ctx.scale(1 + Math.sin(game.runtime * 8) * 0.012, 1 + Math.sin(game.runtime * 8) * 0.012);

  // ---- distinct body silhouettes per figure ----
  if (fig === 'child') {
    // small, pale, floating slightly
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.0, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8ecf2';
    ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#181820';
    ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.55, 1.5, 0, TAU); ctx.arc(r * 0.2, -r * 0.55, 1.5, 0, TAU); ctx.fill();
    // faint glow
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2);
    g.addColorStop(0, 'rgba(200,220,240,0.12)'); g.addColorStop(1, 'rgba(200,220,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2, 0, TAU); ctx.fill();
  } else if (fig === 'blacksmith') {
    // broad-shouldered, thick apron
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 1.3, r * 1.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 1.3, 0, 0, TAU); ctx.fill();
    // leather apron
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-r * 0.7, -r * 0.2, r * 1.4, r * 1.5);
    ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 2; ctx.strokeRect(-r * 0.7, -r * 0.2, r * 1.4, r * 1.5);
    // bald head + soot
    ctx.fillStyle = '#a88868'; ctx.beginPath(); ctx.arc(0, -r * 0.45, r * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40,30,20,0.5)'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.5, r * 0.2, 0, TAU); ctx.fill();
    // beard
    ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.32, 0.2, Math.PI - 0.2); ctx.fill();
  } else if (fig === 'pilgrim') {
    // tall, thin, robed, hooded
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 1.2); ctx.lineTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.5, -r * 0.2); ctx.lineTo(r * 0.8, r * 1.2); ctx.closePath(); ctx.fill();
    // hood
    ctx.fillStyle = '#6a5a3a';
    ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.6, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.3); ctx.lineTo(-r * 0.45, r * 0.1); ctx.lineTo(r * 0.45, r * 0.1); ctx.lineTo(r * 0.6, -r * 0.3); ctx.closePath(); ctx.fill();
    // shadowed face
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.34, 0, TAU); ctx.fill();
    // walking staff
    ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.8, r * 1.3); ctx.lineTo(r * 0.7, -r * 1.4); ctx.stroke();
    ctx.fillStyle = '#8a7a4a'; ctx.beginPath(); ctx.arc(r * 0.7, -r * 1.45, 4, 0, TAU); ctx.fill();
  } else if (fig === 'scholar') {
    // slim robed figure with hood, clutching a book
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 2, r * 0.95, r * 1.35, 0, 0, TAU); ctx.fill();
    // hood
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.6, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.35); ctx.lineTo(-r * 0.5, r * 0.05); ctx.lineTo(r * 0.5, r * 0.05); ctx.lineTo(r * 0.6, -r * 0.35); ctx.closePath(); ctx.fill();
    // old pale face
    ctx.fillStyle = '#c0b8a8'; ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.3, 0, TAU); ctx.fill();
    // spectacles
    ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(-r * 0.13, -r * 0.25, r * 0.1, 0, TAU); ctx.arc(r * 0.13, -r * 0.25, r * 0.1, 0, TAU); ctx.stroke();
    // book clutched to chest
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-r * 0.35, r * 0.1, r * 0.7, r * 0.55);
    ctx.fillStyle = '#d4b060'; ctx.fillRect(-r * 0.3, r * 0.15, r * 0.6, r * 0.45);
    ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, r * 0.15); ctx.lineTo(0, r * 0.6); ctx.stroke();
  } else if (fig === 'hunter') {
    // cloaked retired hunter, tricorn pulled low
    ctx.fillStyle = '#1a140e';
    ctx.beginPath(); ctx.ellipse(0, 3, r * 1.25, r * 1.45, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.2, 0, 0, TAU); ctx.fill();
    // weathered face
    ctx.fillStyle = '#b89878'; ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.38, 0, TAU); ctx.fill();
    // scar
    ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.5); ctx.lineTo(r * 0.2, -r * 0.2); ctx.stroke();
    // tricorn brim
    ctx.fillStyle = '#0c0a08'; ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.95, r * 0.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#15110c'; ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.5, r * 0.22, 0, 0, TAU); ctx.fill();
    // resting blade across back
    ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.2); ctx.lineTo(r * 1.0, -r * 0.5); ctx.stroke();
  } else if (fig === 'healer') {
    // wrapped healer, leaning on a crutch, satchel at hip
    ctx.fillStyle = '#5a3a3a';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 1.05, r * 1.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 1.15, 0, 0, TAU); ctx.fill();
    // head wrap
    ctx.fillStyle = '#b89878'; ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a3a3a'; ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.46, Math.PI, TAU); ctx.fill();
    // satchel
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(r * 0.55, r * 0.35, r * 0.28, r * 0.34, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.4; ctx.stroke();
    // crutch
    ctx.strokeStyle = '#7a6a4a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 1.3); ctx.lineTo(-r * 0.9, -r * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 1.05, -r * 0.7); ctx.lineTo(-r * 0.75, -r * 0.7); ctx.stroke();
  } else if (fig === 'merchant') {
    // hooded trader, satchel at hip, coin pouch in hand
    ctx.fillStyle = '#2a3a24';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 1.1, r * 1.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.92, r * 1.18, 0, 0, TAU); ctx.fill();
    // hood
    ctx.fillStyle = '#3a4a30';
    ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.58, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.32); ctx.lineTo(-r * 0.45, r * 0.05); ctx.lineTo(r * 0.45, r * 0.05); ctx.lineTo(r * 0.55, -r * 0.32); ctx.closePath(); ctx.fill();
    // shadowed face
    ctx.fillStyle = '#3a3a30'; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.3, 0, TAU); ctx.fill();
    // satchel
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(r * 0.5, r * 0.4, r * 0.28, r * 0.34, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 1.4; ctx.stroke();
    // coin pouch in hand, a few glints
    ctx.fillStyle = '#8a6a2a'; ctx.beginPath(); ctx.arc(r * 0.2, r * 0.5, r * 0.18, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.arc(r * 0.16, r * 0.46, 1.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function drawRelics(game, ctx) {
  for (const r of game.relics) {
    if (r.collected) continue;
    if (r.questItem && !questItemActive(game, r.id)) continue;
    if (arenaLockAt(game, r.x, r.y)) continue;
    const bob = Math.sin(game.runtime * 3 + r.x * 0.01) * 3;
    const col = r.color || '#d4b060';
    ctx.save(); ctx.translate(r.x, r.y + bob);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.5; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    if (r.remains) {
      ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, -2); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}