// Lore.js — The central mystery thread of The Hollow Quarter.
// Additive only: returns notes (ancient documents, read via the existing note
// system) and glyphs (non-interactive glowing symbols drawn by WorldEvents).
// Curated to a tight, meaningful set — each document is one piece of the
// puzzle, and reading them now rewards the Hunter (see HuntGame.interact).
//
// The canon (fragmented across documents so the player assembles it):
//   An ancient people ("Those Who Dug") built the city over a sealed shaft to a
//   subterranean force — the Chorus — that answers when sung to. Grand Library
//   scholars learned to Listen and to Sing it into people ("the Tuning"): a
//   discovery that granted insight, then transformation. The Cathedral hid the
//   source and called the diluted form "the Blessing," blessing the water. The
//   Hollow King ordered the digging and the sealing. The Mire Mother sang it
//   into the unborn; Gascoigne Tuned to hunt the Tuned; the Vicar blessed the
//   city's faith with it; the Archivist became the Index of the dead it made.
//   The Sanctuary was built to bury the god the Chorus had become. The plague
//   and the blessing were the same song — the truth everyone hid.

export function buildLore() {
  const notes = [
    // ---- Grand Ancient Library: the beginning of the mystery ----
    { x: 1500, y: 5900, title: 'Research Note — Year of the Listening', text: '"Before the rain, we learned to press our ears to the stone and listen. The deep sang back. We called it the Chorus. We were scholars. We should have stopped at hearing."' },
    { x: 1700, y: 6000, title: 'Forbidden Volume: On the Tuning', text: '"The Chorus could be drawn up, cupped in the throat, and given to another. We called it the Tuning. The Tuned heard more clearly than we did. Then they heard things we could not. Then they became those things."' },
    { x: 2000, y: 6050, title: 'Marginalia — The Index Speaks', text: '"I am the record now. I am every name they wrote. Do not read me aloud. I listen the way they taught me to listen, and I am very hungry to learn your name."' },

    // ---- Cathedral District: the cover-up ----
    { x: 2400, y: 1350, title: "Bishop's Edict — On the Blessing", text: '"Let it be known that the water is blessed, and the blessing is the Church\'s to give. The source beneath is sealed. The Library is sealed. To speak of the Tuning is heresy. Heretics drown."' },
    { x: 2500, y: 1080, title: 'Confession of the Vicar', text: '"I blessed the well because I was told to. I blessed it because I believed. The night the rain began, the water sang. By dawn the children sang with it, and I did not stop them. I am the one who taught the city to drink."' },

    // ---- Crypts / Underground: the source ----
    { x: 1720, y: 1300, title: 'Crypt Inscription — The Sealed Shaft', text: '"Here the Predecessors dug until the stone grew warm and answered. Here we sealed what they found. Do not dig. The god beneath is not dead — it is only sleeping, and it dreams in our voices."' },

    // ---- Boss connections to the past ----
    { x: 3180, y: 1200, title: "Hunter's Note — On the Beasts", text: '"The beasts were men. Gascoigne was a man. They Tuned themselves to hunt the Tuned, and the Chorus took the rest. A blade cuts the flesh. It cannot cut what was sung in. We learned this too late."' },
    { x: 3500, y: 3500, title: "Midwife's Hymn", text: '"I sang the Chorus into the unborn, that they might be born already hearing. The Mire Mother\'s daughters are the water now. I loved them. The water loves them. That was the bargain, and I would make it again."' },
    { x: 4350, y: 4000, title: "The King's Order — To Dig", text: '"Dig. Find the source. Sing it into the guard, that they may guard what sleeps. Sing it into the priest, that he may bless the city. Sing it into the crown, that I may rule what rises. Seal the Library. Bury the god. Say nothing."' },

    // ---- The assembling truth ----
    { x: 4620, y: 3650, title: 'The Truth Beneath', text: '"This is what they hid: the plague and the blessing were the same song. The scholars sang it. The Church blessed it. The King ordered it. The god beneath answered. We asked it to change us, and it did, and we called the changing a curse so we would not have to call it a choice."' },

    // ---- The Night of the Hunt: the central event that binds every district ----
    { x: 1480, y: 1400, title: 'The Night of the Hunt', text: '"They call it the Night of the Hunt now, as if it were a single night. It was every night after the rain turned black. The square drank first. The cathedral blessed the water. The graveyard burned its dead. The library wrote their names. The king ordered the digging. The mother sang to the unborn. The old hunter kept the lantern, and keeps it still. I do not know which of us began it. I know none of us stopped."' },
  ];

  // Non-interactive glowing runes — mystery symbols that brighten as you near.
  const glyphs = [
    { x: 2050, y: 6080, sym: 'chorus', col: '170,110,220' }, // Library dais
    { x: 2450, y: 1260, sym: 'seal',   col: '210,170,90'  }, // Cathedral altar
    { x: 1850, y: 1340, sym: 'seal',   col: '180,140,220' }, // Crypt sealed shaft
    { x: 760,  y: 3050, sym: 'chorus', col: '150,150,180' }, // Necropolis memorial
    { x: 3350, y: 3540, sym: 'eye',    col: '90,200,200'  }, // Sunken Cathedral altar
    { x: 4520, y: 3850, sym: 'crown',  col: '230,200,90'  }, // Overlook throne
    { x: 4800, y: 1280, sym: 'eye',    col: '170,90,200'  }, // Nightmare spire
    { x: 750,  y: 5050, sym: 'chorus', col: '230,180,90'  }, // Sanctuary shrine
  ];

  return { notes, glyphs };
}