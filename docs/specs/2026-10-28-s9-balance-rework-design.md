# S9 (the balance rework) — design

2026-10-28. S9 (the balance rework): the dive, the fights and the economy,
reworked from Igor's play of D152 (nine rungs a ladder, a point a rung)'s
build. Igor: "tell me when it's safe to start a new session on full balance
rework". Every call below not quoted from Igor or a decision is **Claude's**,
marked so, and his to reopen. Once built this spec is history; where it and a
decision disagree, the decision wins.

## Taken as settled

- **The problem**, Igor, 2026-10-27 (`ideas.md` → Open — from playing alpha):
  "dives are long and useless and grindy, exactly the grind i wanted to
  avoid. impossible to quickly earn gems for upgrades, upgrades feel useless,
  points are near to impossible to get and the dont really pay off. bosses
  are too easy and annoying - you just stand near and fire until its huge hp
  numbers are gone. archer needs to have more threat."
- **Read first, then rework.** The reading is `reading.md`, mapped onto each
  complaint. Its main point: progression cannot fix a core loop that isn't
  fun. So the order is **the dive and the fights first, then the economy**.
  The order is Claude's; Igor took the stage on it.
- **A good full dive takes about 10 minutes**, top to the last boss. Igor: "10
  min is fine, let's keep it minimal. make sure it is still scalable". The
  split, about **2 / 3 / 5 minutes** by layer, is Claude's.
- **Fewer gates, the same fights.** Every stretch draws one batch instead of
  3 / 2 / 2: **6 gates a layer** (a batch, a mini-boss, a batch, a mini-boss,
  a batch, the boss). Igor took the recommended option over "ten gates, every
  fight half as long". D137 (batches grow from seconds to a minute and a
  half)'s curve stays: first batches 10–15s, the deepest about a minute and
  more. Estimate, on the bot's D137 figures with today's bosses: about 2.5 +
  4.5 + 5.5 minutes. The boss rework below is what brings it to about 10.
- **Scalable: each layer's shape is its own data.** Today one helper,
  `layer()` in `game/content.js`, gives every layer the same stretches and
  draws. Each layer will carry its own draws, so layers can differ in length
  and more can be added without code. Claude's call, and Igor's own
  "may change to different value for layers later" (D137).

## What this changes elsewhere

- **`foundations.md` → Pillars, "Dives are a session, not a sitting"**: its
  target is "4–8 min" a layer. A 10-minute dive makes it about **2–5 min**.
  The amendment follows from Igor's answer; it is written when the shape is
  built.
- **D137 (batches grow from seconds to a minute and a half)'s "ten gates a
  layer"** is superseded. The decision for this build names it.
- **`tests/dive.test.js`** guards ten gates a layer; that guard changes with
  the build.
- **The economy's figures in `roadmap.md` → Health** were measured on 30 gates
  a dive. With 18, every gem and point figure moves. They are re-measured
  with the career probe before the economy is reworked.

## Open, asked one at a time

In this order, Claude's. Each answer goes into this spec before it is built.
Built on Igor's "complete everything according to what you learned from the
book": 1 as D156 (the boss's shell and stages); 2 as D157 (the archer counts
twice what the bot measures), Igor's meaning being that the archer was
already the hardest; 3 as D158 (prices in reach, ladders a dive long). Points
from opt-in difficulty and the dash are not built.

1. **The boss.** "you just stand near and fire until its huge hp numbers are
   gone". The reading: a sponge raises only enemy power, long boss fights
   come from stages, and standing near and firing is a degenerate strategy to
   remove (`reading.md` → Bosses). The shape needs settling: stages, what
   makes standing near cost, how many hits. The boss's line in
   `foundations.md` → the glossary may change with it.
2. **The archer.** "archer needs to have more threat". The reading: threat
   comes from behaviour — preferred distance, squad behaviour, an attack per
   range, a fair telegraph (`reading.md` → The archer).
3. **The economy**, on the 10-minute dive. The reading points at upgrades
   that open play rather than add numbers, rewards spaced close, no big
   fixed prices, and points from opt-in difficulty rather than fixed skill
   gates (`reading.md` → Dives, Upgrades, Points). Two attributes feed the
   dash, which is held still ("leave dash for now, discussions needed"), so
   the dash's discussion may come with it.

Not in this stage unless Igor brings it in: Bloom's splash without a hit,
one boss for three layers, a boost extending every boost (`ideas.md`).

## Where a new session starts

1. Read `foundations.md`, `plan.md` and `working.md` as every session does,
   then this spec and `reading.md`.
2. **The first build**: each layer's own draws, and 6 gates a layer. Then the
   docs it touches (`entities/layers.md`, `design.md`, the pillar), and the
   checks of what changed (D132 (test runs)). `npm run balance` and the career
   probe need Igor's word.
3. Then question 1, the boss.

## The new target, 2026-10-28

Igor, after playing the S9 build: "the whole game should be finishable in
10-15 min and all upgrades need to be purchased … not suggesting to dump all
and start from scratch". Asked which clock: **from New game to the win**,
deaths included; then "maybe 20 min ok, 10 is too short really" — about
15–20. Claude's derivation, not built yet:

- A mid-to-high skilled career (D160 (a layer-1 dive buys a thing every
  two)) of about four or five dives: deaths in layers 1 and 2, then the win.
- **The winning dive about 7 minutes**, layers about 1.5 / 2.5 / 3: the
  threat curve flatter, the deepest batch about 45s, not 90s.
- **Every tier bought by the win**: gem flow several times Igor's 75 a
  dive — fish paying more rather than prices near zero.
- **Points**, "earned god knows how": Igor took **depth + challenges** —
  every gate cleared for the first time ever pays a point (18 in the game),
  and the challenge ladders stay on top as extra points for skill, with fewer
  rungs each. Changes `foundations.md` → the glossary's **attribute** and
  **point** ("earned by in-dive challenges") and the genre contract, 4.
- Changes `foundations.md` → Pillars: "Fast-paced" (to about 90s) and "Dives
  are a session" (2–5 min a layer), and D137 (batches grow from seconds to a
  minute and a half)'s curve.

## Checked against `foundations.md` and `plan.md`

- **The pillar on layer time** conflicts, as above; amended with the build.
- **The descent is hard-gated by batches** (D27): unchanged.
- **Content is data** (D6): each layer's shape becomes data, which keeps it.
- **"Fast-paced"**: 10–15s to about 90s, unchanged by fewer gates.
- **"Addictive, not grindy"**: the first meaningful purchase within three
  dives. It is re-measured with the economy, since a dive now pays less.
- **The glossary's gate, mini-boss and layer end**: unchanged; a layer still
  has mini-bosses before its boss.
