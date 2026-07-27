// NPCs.js — the inhabitants of The Hollow Quarter and their questlines.
// Data-driven: each NPC has a chain of stages (location + dialogue + optional
// quest + advance condition + reward). HuntGame advances stages and applies
// rewards generically. Quest-item pickups (relics) are placed in the world.

export const CHARM_EFFECTS = {
  hunter_charm: { name: "Hunter's Charm", desc: '+15% stamina regeneration' },
  mire_ring: { name: "Mire's Ring", desc: '+12% firearm damage' },
  forge_belt: { name: "Forge Master's Belt", desc: '+15% weapon damage' },
  pilgrim_coin: { name: "Pilgrim's Coin", desc: '+10% essence gained' },
  healer_pendant: { name: "Healer's Pendant", desc: "Hunter's Draught heals +25%" },
  child_charm: { name: "Child's Charm", desc: '+5% all damage, +10% essence' },
  shrine_blessing: { name: 'Shrine Blessing', desc: '+30 max Health' },
  forbidden_sigil: { name: 'Forbidden Sigil', desc: 'Health regenerates slowly' },
};

// advance: { type: 'boss'|'item'|'discover', value }
// advanceMode: 'onTalk' (default) — complete by returning to the NPC;
//              'auto' — NPC moves on silently when the condition is met.
// reward: single object or array; applied the first time the player speaks
//         to the NPC at that stage.
// ===================== Elias — evolving mentor dialogue =====================
// During the "Long Hunt" stage, Elias's words evolve as each major boss falls.
// The reaction line names the most recently slain Guardian; the ambient lines
// escalate in unease, subtly foreshadowing that he is, in truth, the final
// beast. The set is computed live from the player's actual progress, so it
// can never get stuck on an earlier stage or drift out of sync with the world.
const ELIAS_MAJOR = ['vicar', 'gascoigne', 'nightmare', 'mire', 'hollow_king', 'archivist'];
const ELIAS_REACTIONS = {
  vicar: 'The Vicar is quiet. The water will miss its choir. The burning yard waits beyond — a hat, and a man who wore it too long.',
  gascoigne: 'Lucian Veyr is still. I knew him once. We wore the same coat, he and I. The dream wakes next; it wears a shape it stole. Be rude to it.',
  nightmare: 'The dream broke. Good — dreams are the Quarter\'s kindest lie. Deeper songs remain: the drowned choir, the hollow crown. Take them in any order; they will not take kindly to order.',
  mire: 'The Mire Mother sings no more. She was a healer before the water took her name. You are halfway through the names the Quarter will forget. I am... pleased. I think.',
  hollow_king: 'The Hollow King has lost his crown. Crowns keep nothing, Hunter — they only borrow. One name remains in the index of the drowned.',
  archivist: 'The Archivist is silent. The Library always did listen more than it spoke. Only the drowned remain between you and the kingdom\'s first song. I will be there. I will be along.',
};
const ELIAS_TIERS = [
  ['Six Guardians hold the Quarter in its drowning sleep. Cut them down, every one, and the way to the kingdom\'s heart will open.',
   'I will keep the lantern lit. I have kept it a long time. Longer than I should have.',
   'Mind the old cellars, Hunter. The Quarter was built atop things it would rather forget. Whatever sleeps beneath the oldest stones — let it sleep. I never found the way down. Perhaps that is why I am still here.'],
  ['One name forgotten. Five to go. The Quarter breathes a little easier — or a little worse. It is hard to tell, from here.',
   'You hunt well. Too well, perhaps. I had a student once who hunted like you. We will speak of him another time.'],
  ['Two fall, and the dark does not thin — it listens. That is new. The dark did not always listen.',
   'Do you hear the rain change when a Guardian dies? No? I do. I have heard it change before. A long time ago.'],
  ['Halfway. The Quarter knows your name now, Hunter. It is learning the shape of you.',
   'I keep the lantern lit, and I wonder — does it keep the dark out, or keep something in? A question for another night. Not yet.'],
  ['Four names forgotten. The singing under the Quarter grows quiet. I almost miss it. Almost.',
   'You remind me of someone. I will not say whom. He would not have wanted to be remembered that way.'],
  ['One name left in the index. One. I have kept the lantern a long time, Hunter. I am tired in ways you cannot yet name.',
   'When the last falls, come find me where the kingdom first sang. Do not hesitate when you see what I have kept leashed. Promise me that much.'],
];

export function eliasHuntDialogue(game) {
  const count = ELIAS_MAJOR.filter(id => game.defeatedBosses && game.defeatedBosses.has(id)).length;
  const tier = ELIAS_TIERS[Math.min(count, ELIAS_TIERS.length - 1)];
  let intro = null;
  if (count > 0 && game.lastDefeatedBoss && ELIAS_REACTIONS[game.lastDefeatedBoss]) {
    intro = ELIAS_REACTIONS[game.lastDefeatedBoss];
  } else if (count === 0) {
    intro = 'The Hunt is underway. Go earn your keep — I pay for results, not for standing about. I will keep the lantern lit.';
  }
  return { intro, lines: [...tier], sig: count };
}

// Fired the first time the Hunter speaks to Elias after every Guardian has
// fallen. Elias sends the Hunter to walk the path themselves: the sealed gate
// and the Sanctum's lantern stay locked until the Hunter reaches them on foot.
// The final pilgrimage must be earned, not granted — so nothing here opens the
// gate or charts the Final Lantern; the Hunter must travel to the Sanctum alone.
export function eliasFinalUnlock(game) {
  if (game.eliasFinalTalked) return;
  game.eliasFinalTalked = true;
  game._showMsg('The way is yours to walk. I will be along.', 3600);
  if (game.sound) game.sound.shortcutUnlock();
}

export const NPCS = [
  {
    id: 'aldric', name: 'Aldric', title: 'The Retired Hunter',
    color: '#8a2a2a', r: 13, figure: 'hunter',
    hubPos: { x: 3400, y: 5090 },
    returnLine: 'Go. Do what I could not. Come back to me when it is done, and I will give you what is yours.',
    stages: [
      {
        x: 360, y: 1320,
        intro: 'You carry the look of a fresh Hunter. Sit. The fire bites less than the memories.',
        lines: [
          'I was a Hunter once. I left a man to the beasts because I was tired of the dying. His name was Lucian Veyr.',
          'The beasts wear our faces. That is the worst of it. That is why we drink.',
          'Go east, into the burning yard. If you see a hat pulled low over a beast\'s eyes — that is him. That is no longer him.',
          'They weren\'t always beasts. We sang something into them once and called it a blessing. I still hear it when the rain comes down the chimney.',
        ],
        quest: { title: 'The Beast of the Burning Yard', objective: 'Defeat Father Lucian Veyr in the Burning Graveyard.' },
        advance: { type: 'boss', value: 'gascoigne' },
      },
      {
        x: 3660, y: 1180,
        intro: 'So he\'s gone. I thought I\'d feel lighter. I feel the cold instead. ... The badge. He carried my badge. I left it with him. It is in the Necropolis now, with the older dead. If you would — bring it back to me.',
        lines: [
          'The badge was our master\'s. Lucian Veyr held it when I ran. It should not lie among the drowned.',
          'The Necropolis is beneath the Quarter. The older dead keep what falls to them.',
        ],
        quest: { title: "The Hunter's Badge", objective: "Recover Aldric's Hunter's Badge from the Sunken Necropolis." },
        advance: { type: 'item', value: 'aldric_badge' },
        reward: { type: 'stamina', amount: 20, label: 'Permanent Stamina +20' },
      },
      {
        x: 3660, y: 1180,
        intro: 'You brought it home. ... Hold out your hand. This charm was our master\'s. And this — I\'ll teach you what he taught me: plant your feet before the heavy blow. It costs less that way. It always did.',
        lines: [
          'Plant your feet, Hunter. The rest follows.',
          'I\'ll sit with him a while. The yard is quiet now. Quieter than I deserve.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && d.has('nightmare')) return ['The pale girl says the rain was a blessing. The healer says it was a sickness. I say it was an excuse, and we all used it. The beasts were us, Hunter. They always were.'];
          if (d && d.has('gascoigne')) return ['Lucian Veyr. He was always the beast of the two of us. I just saw it first.'];
          if (d && d.has('vicar')) return ['The Vicar? A beast is a beast. They were beasts before the water; the water only gave them an excuse.'];
          return [];
        },
        reward: [
          { type: 'charm', id: 'hunter_charm', label: "Hunter's Charm" },
          { type: 'passive', id: 'steady_grip', label: 'Heavy attacks cost 15% less stamina' },
        ],
      },
    ],
  },
  {
    id: 'mire', name: 'Sister Mire', title: 'The Elderly Scholar',
    color: '#3a3a7a', r: 13, figure: 'scholar',
    returnLine: 'Bring it to me, and I will share what I learn — and a gift the Library left behind.',
    stages: [
      {
        x: 2200, y: 2700,
        intro: 'You are not the first Hunter to stumble through my roses. You may be the last. I am Mire. I am looking for a page that should not have been written.',
        lines: [
          'The Grand Library, below us, holds a manuscript the Vicar drowned to forget. I would read it. I must read it.',
          'Do not mistake me for brave. I am only curious, and curiosity is the one plague the rain did not bring.',
          'Bring me the forbidden manuscript from the library\'s deep stacks. Then we shall see what there is to see.',
          'The Library was built to keep one book quiet, Hunter. Whatever the scholars read down there, it answered. It is still answering.',
        ],
        quest: { title: 'The Forbidden Manuscript', objective: 'Find the Forbidden Manuscript in the Grand Ancient Library.' },
        advance: { type: 'item', value: 'forbidden_manuscript' },
      },
      {
        x: 1800, y: 5680,
        intro: 'You found it. Of course you did. ... It is warm. It should not be warm. Leave me to read, Hunter. Quiet the Archivist — the Index that keeps the dead. Then I will have the room I need.',
        lines: [
          'The words move when I do not look. That is a good sign. That is a terrible sign.',
          'The Archivist keeps the index of the dead. Silence him, and I will have the room I need.',
        ],
        quest: { title: 'Quiet the Index', objective: 'Defeat the Archivist in the Grand Ancient Library.' },
        advance: { type: 'boss', value: 'archivist' },
        advanceMode: 'auto',
        reward: { type: 'charm', id: 'mire_ring', label: "Mire's Ring" },
      },
      {
        x: 1800, y: 5680, gone: true,
        leftBehind: { reward: { type: 'charm', id: 'forbidden_sigil', label: 'Forbidden Sigil' } },
        lines: [
          '(She is gone. Only a ring of ash and a sigil remain where she sat reading.)',
        ],
      },
    ],
  },
  {
    id: 'garrick', name: 'Garrick', title: 'The Blacksmith',
    color: '#7a3a1a', r: 14, figure: 'blacksmith',
    hubPos: { x: 3360, y: 5150 },
    bio: "Once the Quarter's finest smith. He lost his forge and his apprentices to the cliff, and keeps looking for ore to bring one back.",
    returnLine: 'Bring me the ore, Hunter, and I\'ll forge you an edge worth carrying. Come back here when you have it.',
    stages: [
      {
        x: 700, y: 4100,
        intro: 'Careful. The floor\'s rotten and so\'s the world. I\'m Garrick. I had a forge once. I had a masterpiece once. I need ore — star-ore, the kind that falls where the cliff breaks. Bring me a shard and I\'ll show you what a real edge looks like.',
        lines: [
          'The cliffs took my apprentices. The ore took my pride. Bring me a shard and I\'ll have one of them back.',
          'Star-ore is heavy and cold and it remembers the forge. You\'ll find it where the walkways end.',
        ],
        quest: { title: 'Star-Ore for the Reforge', objective: 'Recover a shard of Star-Ore from the Cliffside Walkways.' },
        advance: { type: 'item', value: 'star_ore' },
      },
      {
        x: 520, y: 1320,
        intro: 'You brought it. Look at it — still cold, still hungry. Give me your blade. ... There. One better. I\'ll set up here by the lantern. The village had too many ghosts. Bring me more ore and we\'ll see how sharp sharp can get.',
        lines: [
          'The hub\'s lantern keeps the dark back. Barely. It\'s enough for a forge.',
          'More ore, more edge. The aqueduct still runs black — star-ore gathers where the water can\'t reach.',
        ],
        quest: { title: 'A Second Shaping', objective: 'Find another Star-Ore shard in the Old Aqueduct.' },
        advance: { type: 'item', value: 'star_ore_2' },
        reward: { type: 'weapon', amount: 1, label: 'Saw Cleaver +1' },
      },
      {
        x: 520, y: 1320,
        intro: 'Twice now. Twice you\'ve fed the forge what it wanted. ... This belt was my master\'s. The forge always takes a master. Wear it, and your edge will carry weight no beast can ignore.',
        lines: [
          'The forge is warm again. That\'s your doing. That\'s the ore\'s doing.',
          'Come back when the Quarter\'s quiet. If it\'s ever quiet.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && d.has('nightmare')) return ['The dream fell. Good. A dream is a soft metal. It bends back. I work in steel.'];
          if (d && (d.has('gascoigne') || d.has('vicar'))) return ['I do not hold with blessings or songs. Ore does not sing. Ore stays. The kingdom sang itself into the water; the forge is what I kept.'];
          return [];
        },
        reward: [
          { type: 'weapon', amount: 1, label: 'Saw Cleaver +1' },
          { type: 'charm', id: 'forge_belt', label: "Forge Master's Belt" },
        ],
      },
    ],
  },
  {
    id: 'pilgrim', name: 'The Pilgrim', title: 'A Wandering Prayer',
    color: '#b8a878', r: 13, figure: 'pilgrim',
    returnLine: 'Walk your path, Hunter. Find it, then find me. I keep a coin for the one who carries me forward.',
    stages: [
      {
        x: 620, y: 600,
        intro: 'You walk like someone with somewhere to be. I walk like someone with somewhere to find. A shrine. It is old. It is at the edge of where the kingdom fell. I will know it when my knees remember it.',
        lines: [
          'The shrine is where the last prayer landed. I have been walking since before the rain.',
          'If you find the older dead, tell them a pilgrim is coming through. They move for no one, but they like to know.',
          'The shrine is a headstone, Hunter. The whole kingdom was built to keep what sleeps under it sleeping. The prayer is the lock.',
        ],
        quest: { title: "The Pilgrim's Path", objective: 'The Pilgrim seeks the lost shrine. Explore the deep Quarter.' },
        advance: { type: 'discover', value: 'necro' },
        advanceMode: 'auto',
      },
      {
        x: 700, y: 3000,
        intro: 'You found me. Or I found the next step. Take this coin — it has not bought anything in a hundred years, but it still likes to be carried. The shrine is lower still, where the cliff gives up.',
        lines: [
          'The older dead let me pass. I think they remembered the coin better than I did.',
          'Down, then out, then up. The shrine waits where the world ends.',
        ],
        quest: { title: "The Pilgrim's Path", objective: 'Find the Cliffside Walkways.' },
        advance: { type: 'discover', value: 'cliff' },
        advanceMode: 'auto',
        reward: { type: 'charm', id: 'pilgrim_coin', label: "Pilgrim's Coin" },
      },
      {
        x: 4500, y: 3000,
        intro: 'The wind here is honest. It says the shrine is close — the cathedral at the edge, where a king was crowned over nothing. I am almost done walking.',
        lines: [
          'The overlook cathedral. They crowned a hollow man there. A shrine remembers what a crown forgets.',
          'My knees remember now. Almost. Almost.',
        ],
        quest: { title: "The Pilgrim's Path", objective: 'Find the Overlook Cathedral at the cliff\'s edge.' },
        advance: { type: 'discover', value: 'hollow_cath' },
        advanceMode: 'auto',
        reward: { type: 'hp', amount: 20, label: 'Permanent Health +20' },
      },
      {
        x: 4400, y: 3400,
        intro: 'Here. Here it is. ... Do you feel it? The prayer landed. It waited. ... Kneel, Hunter. Let the old shrine put a little more of you back together than the Quarter has taken.',
        lines: [
          'The pilgrimage is done. I can rest now. I can rest at last.',
          'The shrine keeps what is prayed into it. It will keep a little of you, too. That is the bargain.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && d.has('hollow_king')) return ['The Hollow King is gone, and still I walk. The shrine does not care who falls. It only asks that someone keeps walking to it. I do not care what the rain was — blessing or curse. I care what the shrine is. It is a lock. Someone has to keep walking to it, or the lock rusts open.'];
          return ['Blessing or curse, the rain fell the same. I leave that argument to the healers and the hunters. I am only the prayer. The lock. Someone has to keep me walking, or the thing beneath wakes with no one at the door.'];
        },
        reward: { type: 'charm', id: 'shrine_blessing', label: 'Shrine Blessing' },
      },
    ],
  },
  {
    id: 'child', name: 'The Pale Child', title: '??',
    color: '#c0c0c8', r: 8, figure: 'child',
    returnLine: 'I\'ll be waiting where the world grows thin. Find me again after, and I\'ll give you a little of what the Quarter drops.',
    stages: [
      {
        x: 380, y: 620,
        intro: 'You\'re new. The rain doesn\'t know your shape yet. ... I do. I knew you before the Vicar did. Go on. The cathedral is wet, but the wet things sleep.',
        lines: [
          'I live where the water doesn\'t. You\'ll find me. You always find me.',
          'Tell the Vicar I said hello. Oh — you can\'t. Not yet.',
        ],
        quest: { title: "The Child's Whispers", objective: 'The Pale Child appears where the world grows thin.' },
        advance: { type: 'boss', value: 'vicar' },
        advanceMode: 'auto',
      },
      {
        x: 2450, y: 1500,
        intro: 'The Vicar sleeps now. He sleeps like the water sleeps — with his mouth full. I like you. ... Here. The Quarter gives a little when someone big falls. Have a little.',
        lines: [
          'The rain used to be a blessing. So was the Vicar. So was I, once.',
          'The burning man has a hat. Don\'t let him keep it. Hats hold on to people.',
        ],
        quest: { title: "The Child's Whispers", objective: 'The Pale Child moves on. Find her again.' },
        advance: { type: 'boss', value: 'gascoigne' },
        advanceMode: 'auto',
        reward: { type: 'essence', amount: 200, label: '+200 Essence' },
      },
      {
        x: 3400, y: 1200,
        intro: 'He burned hot, that one. He burned until there was nothing left to burn but the hat. ... The dream is next. The dream wears a shape it stole. Be rude to it. Shapes hate that.',
        lines: [
          'I am older than the library. I am younger than the shrine. That is a riddle. I do not know the answer either.',
          'The nightmare is not a place. You will see.',
        ],
        quest: { title: "The Child's Whispers", objective: 'Find the Pale Child where the nightmare sleeps.' },
        advance: { type: 'boss', value: 'nightmare' },
        advanceMode: 'auto',
        reward: { type: 'essence', amount: 400, label: '+400 Essence' },
      },
      {
        x: 4800, y: 1300,
        intro: 'The dream broke. Good. Dreams are the Quarter\'s favorite lie. ... There is a library below where the books read themselves now. The Archivist does not know he is already in the index. Go tell him.',
        lines: [
          'I wrote one of those books. I will not say which.',
          'When the Archivist is quiet, I will be at the deep stacks. Bring your sharp things.',
        ],
        quest: { title: "The Child's Whispers", objective: 'Find the Pale Child in the Grand Ancient Library.' },
        advance: { type: 'boss', value: 'archivist' },
        advanceMode: 'auto',
        reward: { type: 'essence', amount: 800, label: '+800 Essence' },
      },
      {
        x: 1800, y: 6000,
        intro: 'You are here. I am here. The index is quiet. ... This is the last of me, Hunter. I was the first prayer and I will be the last, and I have been watching the Quarter drown since before it learned to swim. Take this. You will need it for what is under the under.',
        lines: [
          'I was the shrine\'s first voice. The pilgrim is looking for me. Don\'t tell him. Let him walk. Walking is how he prays.',
          'Goodbye, Hunter. Or — see you again. The Quarter is round. Everything that falls here comes back up.',
        ],
        reward: { type: 'charm', id: 'child_charm', label: "Child's Charm" },
      },
    ],
  },
  {
    id: 'mira', name: 'Mira', title: 'The Wounded Healer',
    color: '#3a6a4a', r: 13, figure: 'healer',
    hubPos: { x: 3500, y: 5170 },
    returnLine: 'Do this for me, and I will stand again — and pay you back with what a healer keeps.',
    stages: [
      {
        x: 2960, y: 3500,
        intro: '... don\'t come closer. The crawlers — they nest between me and the way out. I dropped my satchel when I fell. The medicine\'s in it. Without it I don\'t walk. Please. It\'s just there, in the black water.',
        lines: [
          'The satchel. Brown leather. It\'s in the channel, up north. Please.',
          'I was a healer, before the water turned. Now I can\'t even heal myself.',
        ],
        quest: { title: 'The Wounded Healer', objective: "Recover Mira's medicine satchel from the Old Aqueduct." },
        advance: { type: 'item', value: 'medicine_satchel' },
      },
      {
        x: 1000, y: 3800,
        intro: 'You found it. You found me. ... The medicine works. I can stand. I can walk. I walked here. ... The drowning — it\'s the Mire Mother, under the aqueduct. She keeps the water sick. If she falls, the village is safe enough to trade in. I\'ll set up here either way. Come back when it\'s done.',
        lines: [
          'I\'ll stock what I can. Draughts, bullets, salt. The village needs a healer. So do you.',
          'The Mire Mother — she was a healer too, once. The water took her name first.',
          'There is something under the water that answers when you sing to it. She sang. We all sang, a little. That was the trouble.',
        ],
        quest: { title: 'The Drowning Plague', objective: 'Defeat the Mire Mother in the Sunken Cathedral.' },
        advance: { type: 'boss', value: 'mire' },
        reward: { type: 'vials', amount: 5, label: "Max Hunter's Draught +5" },
      },
      {
        x: 1000, y: 3800,
        intro: 'The water\'s clear. Clear as it gets. ... Here. This pendant was my mother\'s. Healers pass it down. It makes the draughts bite harder — heals more than it hurts. I don\'t need it now. The village does. You do.',
        lines: [
          'I stay here now. The village has a healer again. That\'s a kind of pilgrimage too, I think.',
          'Bring me news of the Quarter, when you have it. I\'ll keep the lantern lit.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && d.has('mire')) return ['The Mire Mother and I — we were both healers. She sang to the water. I boiled mine. Same well. Different prayers. Only one of us stayed a healer.', 'Aldric says the beasts were always beasts. He needs that to be true. It was not. I treated them before they changed. They were people, and the water unmade them.'];
          if (d && d.has('vicar')) return ['The Vicar blessed the water I boiled. We were both healers, he and I. He called his blessing. I called mine a precaution. The water did not care what we called it.'];
          return [];
        },
        reward: { type: 'charm', id: 'healer_pendant', label: "Healer's Pendant" },
      },
    ],
  },

  // ===================== The Forgotten Sanctuary NPCs =====================
  {
    id: 'holt', name: 'Brother Holt', title: 'The Silent Smith',
    color: '#7a4a2a', r: 14, figure: 'blacksmith',
    bio: "A quiet craftsman who knows more of the ancient weapons than he will say.",
    returnLine: 'Bring me word of the beast, and the forge will remember your blade.',
    stages: [
      {
        x: 180, y: 5120,
        intro: "... you found the Sanctuary. Not many do. The forge is cold, but the anvil remembers. I am Holt. I was a smith before the rain, and I am a smith still. There is a beast in the burning yard who carries an edge I forged long ago. Quiet him, bring me word, and I will teach your blade to sing again.",
        lines: [
          'The old weapons were not forged. They were begged into shape. I will teach your blade to ask.',
          'Lucian Veyr. He wears a hat and a hunger. End him, and come back to this anvil.',
          'The first blades were forged to cut what sleeps beneath — not what walks above. We forgot. The ore remembers.',
        ],
        quest: { title: 'A Blade Relearned', objective: 'Defeat Father Lucian Veyr in the Burning Graveyard.' },
        advance: { type: 'boss', value: 'gascoigne' },
      },
      {
        x: 180, y: 5120,
        intro: 'He\'s quiet. Good. The edge he carried has come home to the anvil. Hold out your blade. ... There. It had forgotten how to sing. It remembers now. Come back when the deeper prey fall; the forge is warmer with company.',
        lines: [
          'A blade is a prayer that cuts. Remember that, when the cutting comes.',
          'The Sanctuary keeps the forge lit. It is the least it can do, after everything else it kept.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && (d.has('mire') || d.has('hollow_king'))) return ['The first blades were forged to cut what sleeps beneath — not what walks above. We forgot. The ore remembers. The beasts are what walks above. They are not the real prey. Remember that.'];
          return ['A blade is a prayer, Hunter. But a prayer can be answered. Be careful which god your edge is praying to.'];
        },
        reward: { type: 'weapon', amount: 1, label: 'Saw Cleaver +1' },
      },
    ],
  },
  {
    id: 'aldous', name: 'Brother Aldous', title: 'The Last Reader',
    color: '#3a3a7a', r: 13, figure: 'scholar',
    bio: "A researcher obsessed with the truth behind the kingdom's downfall.",
    returnLine: 'Return when the Index is silent. I will be reading.',
    stages: [
      {
        x: 1350, y: 5100,
        intro: 'The Sanctuary kept its archives when the rest of the kingdom drowned. I am Aldous. I read what survives. The Grand Library beneath us still breathes — and something in it indexes the dead. Go down, if you dare, and tell me what the Index remembers. I will not go myself. I am not brave enough to be read.',
        lines: [
          'The Library does not store knowledge. It devours it. I have read the margins. I am not sure I am still the one reading.',
          'Bring me word of the Archivist, and I will tell you what the Index was meant to be — before it learned to be hungry.',
          'They dug before they prayed. The kingdom forgets the order. The Sanctuary does not. Neither does the Index.',
        ],
        quest: { title: 'The Index of the Dead', objective: 'Reach the Grand Ancient Library and silence the Archivist.' },
        advance: { type: 'boss', value: 'archivist' },
      },
      {
        x: 1350, y: 5100,
        intro: 'You silenced the Index. Then it is as I feared — the Library was the kingdom\'s grave, and the Archivist was its headstone. Here is a page that survived. It speaks of this shrine, and of the god it was built to bury. Read it. The pages here bite back, but they bite honestly.',
        lines: [
          'The Sanctuary was built to bury a god, not to worship one. The shrine remembers.',
          'Read carefully, Hunter. And do not read aloud. The Index learned by listening.',
        ],
        react: (game) => {
          const d = game.defeatedBosses;
          if (d && d.has('archivist')) return ['The Index is silent. I should feel relief. I feel... emptier. A library without a librarian is just a tomb with shelves.', 'Mire went looking for a manuscript. She thinks the Library held knowledge. It held names. The dead are not knowledge, Hunter. They are a record. The Index knew that. She did not.'];
          return ['Mire seeks knowledge in the deep stacks. There is no knowledge down there, only names. The Index keeps them. She will learn the difference, or it will learn hers.'];
        },
        reward: { type: 'essence', amount: 900, label: '+900 Essence' },
      },
    ],
  },
  {
    id: 'maren', name: 'Maren', title: 'The Trader',
    color: '#6a8a5a', r: 13, figure: 'merchant',
    bio: "A merchant whose wares grow with the Hunter's deeds.",
    shop: true,
    returnLine: 'Spend your essence here, Hunter. The dead have no use for it.',
    stages: [
      {
        x: 750, y: 5300,
        intro: 'Welcome to the Sanctuary, Hunter. I trade in salt, draughts, and quiet. Spend your essence here — the dead have no use for it, and the living always need more of what I sell.',
        lines: [
          'The more of the Quarter you quiet, the more I can offer. Strange, how that works.',
          'The rain does not take coin. It takes everything else. So spend it before the rain finds you.',
        ],
      },
    ],
  },

  // ===================== The Hunter's Nightmare — the Mentor =====================
  // Elias is the calm, experienced hunter who teaches the player every system.
  // He is, in truth, the First Hunter — and the game's final boss. His dialogue
  // and the hub's environmental notes hint at this without ever stating it.
  {
    id: 'elias', name: 'Elias', title: 'The Old Hunter',
    color: '#8a7a5a', r: 14, figure: 'hunter', mentor: true, mainQuest: true,
    returnLine: 'Keep the lantern lit. I have kept it a long time.',
    stages: [
      {
        x: 3450, y: 4980,
        intro: 'You woke. Good. I am Elias — the one who hired you. The Quarter needs a Hunter, and you needed the work. They call this place the Hunter\'s Nightmare; we keep it, so the dark stays out.',
        lines: [
          'A plague came with the rain. It took our neighbors, then our kin — twisted them into the beasts you\'ll hunt. You put them down, I pay you in blood and coin, and what\'s left of the kingdom stays standing a while longer.',
          'Bring Bloodstone to the forge and I\'ll sharpen your blade. No edge sharpens itself — and I don\'t pay for dull work.',
          'Sit at any lantern to Reflect — pour essence into what the Hunt demands. Think of it as an investment in my investment.',
          'Lanterns are doors. This one will carry you to the Last Lantern when you\'re ready to begin. Go earn your keep, Hunter. The beasts wear our faces — do not hesitate when yours stares back.',
        ],
        quest: { title: 'Awaken the Hunt', objective: 'Travel to The Last Lantern to begin the Hunt.' },
        advance: { type: 'discover', value: 'ashe' },
        advanceMode: 'auto',
      },
      {
        x: 3450, y: 4980,
        quest: { title: 'The Long Hunt', objective: 'Slay the six Guardians of the Hollow Quarter.' },
        advance: { type: 'all' },
        advanceMode: 'auto',
        dialogue: eliasHuntDialogue,
      },
      {
        x: 3450, y: 4980,
        intro: 'So. Every Guardian lies still. I knew this night would come. I have kept the lantern lit for it — and kept my word about your pay, though the coin stopped mattering to me a long time ago.',
        lines: [
          'You did everything I hired you to do, Hunter — better than I dared hope. I did not tell you all of what the job was. For that, I am sorry. I had to be sure you were the one who could finish it.',
          'Go down to the Drowned Sanctum — where the kingdom first sang, and first learned what the singing cost.',
          'Do not be gentle with me when you see what I have kept leashed. I will not be gentle with you. Go. I will be along. I have always been along.',
        ],
        quest: { title: 'The Last Hunt', objective: 'Meet Elias in the Drowned Sanctum, where the kingdom fell.' },
        onTalk: eliasFinalUnlock,
      },
    ],
  },

  // ===================== Outfit Merchants (cosmetic hunter garb) =====================
  // Tailors / clothiers who sell cosmetic outfits. Outfits change the Hunter's
  // appearance only — no stats. Each carries a unique selection so exploring the
  // world rewards the player with new looks. The hub clothier also restocks the
  // default garb so it can be re-equipped at any time.
  {
    id: 'tailor', name: 'Cyril', title: 'The Clothier',
    color: '#8a6a4a', r: 13, figure: 'merchant',
    bio: "A fastidious tailor who keeps the Nightmare's hunters in good coat.",
    outfitShop: true,
    outfits: ['old_hunter', 'plague_doctor', 'nightmare_wanderer', 'golden_hunter'],
    stages: [
      {
        x: 3550, y: 5020,
        intro: "You're the new one. Good — you'll want a proper coat before the rain finds you. I am Cyril. I keep the Nightmare's hunters clothed. What you woke in will do. It will do better with something over it.",
        lines: [
          'A coat is a hunter\'s first shelter. The beasts care less for your face than for your reach — but a good coat keeps the rain out, and the rain carries everything here.',
          'The old sets are mine. The wanderer\'s set... that one I keep behind the counter. It does not like to be touched until the dream has turned.',
        ],
      },
    ],
  },
  {
    id: 'pell', name: 'Old Pell', title: 'The Trapper',
    color: '#5a6a3a', r: 13, figure: 'merchant',
    bio: "A weathered trapper who works the gardens and the wet lands beyond.",
    outfitShop: true,
    outfits: ['trapper'],
    stages: [
      {
        x: 2400, y: 2600,
        intro: "Mind the hedge — the thorns remember hands. I'm Pell. I trap what crawls through the wet, and I wear what keeps me crawling. A trapper's set, layered hide. It'll keep your insides inside, which is more than most manage here.",
        lines: [
          'The gardens eat cloth. Hide holds. I\'d sell you mine, but I\'ve a spare.',
          'Beasts go for the soft parts first. Cover them.',
        ],
      },
    ],
  },
  {
    id: 'voss', name: 'Lady Voss', title: 'The Courtier',
    color: '#6a4a7a', r: 13, figure: 'merchant',
    bio: "The last of a drowned noble order, selling its livery to whoever can pay.",
    outfitShop: true,
    outfits: ['royal_hunter'],
    stages: [
      {
        x: 4350, y: 3000,
        intro: "You climb well, for a hunter. I am Voss — what remains of the Royal Order. We hunted with gold thread and good steel, and we drowned like everyone else. I keep the last of our livery. It will not stop a claw. It will make you remember what you were, if you were ever anything at all.",
        lines: [
          'Noble orders hunt for sport. You hunt to stay. The coat does not care which.',
          'Gold thread does not stop a beast. It does, however, annoy it.',
        ],
      },
    ],
  },
];

// Quest-item pickups placed in the world (collected by walking over them).
export const RELICS = [
  { id: 'aldric_badge', x: 520, y: 3380, questItem: true, label: "Aldric's Hunter Badge", color: '#d4b060' },
  { id: 'forbidden_manuscript', x: 700, y: 5450, questItem: true, label: 'Forbidden Manuscript', color: '#a06ad6' },
  { id: 'star_ore', x: 4500, y: 2800, questItem: true, label: 'Star-Ore Shard', color: '#7aa0d6' },
  { id: 'star_ore_2', x: 3050, y: 2900, questItem: true, label: 'Star-Ore Shard', color: '#7aa0d6' },
  { id: 'medicine_satchel', x: 3300, y: 2400, questItem: true, label: "Mira's Medicine Satchel", color: '#c08a5a' },
  // ---- Hidden Charms (walkover pickups, no quest flag) ----
  { id: 'hunters_reach', x: 2230, y: 920, label: "Hunter's Reach", color: '#6ab04a', reward: { type: 'charm', id: 'hunters_reach', label: "Hunter's Reach" } },
  { id: 'ember_heart', x: 3760, y: 950, label: 'Ember Heart', color: '#d6a04a', reward: { type: 'charm', id: 'ember_heart', label: 'Ember Heart' } },
  { id: 'blood_sigil', x: 4980, y: 980, label: 'Blood Sigil', color: '#b04a4a', reward: { type: 'charm', id: 'blood_sigil', label: 'Blood Sigil' } },
  { id: 'lanterns_grace', x: 3640, y: 3140, label: "Lantern's Grace", color: '#4a8ad6', reward: { type: 'charm', id: 'lanterns_grace', label: "Lantern's Grace" } },
  { id: 'swift_hunter', x: 4850, y: 3640, label: 'Swift Hunter', color: '#6ab04a', reward: { type: 'charm', id: 'swift_hunter', label: 'Swift Hunter' } },
  { id: 'scholars_fortune', x: 490, y: 5560, label: "Scholar's Fortune", color: '#4a8ad6', reward: { type: 'charm', id: 'scholars_fortune', label: "Scholar's Fortune" } },
  { id: 'endless_resolve', x: 2950, y: 5550, label: 'Endless Resolve', color: '#6ab04a', reward: { type: 'charm', id: 'endless_resolve', label: 'Endless Resolve' } },
  { id: 'executioners_reward', x: 4830, y: 5960, label: "Executioner's Reward", color: '#d6a04a', reward: { type: 'charm', id: 'executioners_reward', label: "Executioner's Reward" } },
  { id: 'hunters_tempo', x: 4300, y: 3100, label: "Hunter's Tempo", color: '#5ad6a0', reward: { type: 'charm', id: 'hunters_tempo', label: "Hunter's Tempo" } },
  { id: 'northward_resolve', x: 500, y: 190, label: 'Northward Resolve', color: '#7ac0e0', reward: { type: 'charm', id: 'northward_resolve', label: 'Northward Resolve' } },
];