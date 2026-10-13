# Mods from drops — design

2026-10-12. The second requirement before S5 (content) (D80 (entity docs and
mods from drops come first)): "mods rework from choice to enemy drops". Shape
B was chosen by Igor from three that Claude proposed after research. Igor's
answers are quoted below, and Claude's calls are marked as such. Awaiting
Igor's review. Once built this spec is history; where it and a decision
disagree, the decision wins.

## Taken as settled

Igor's words, from the discussion:

- **Drops, and both kinds.** The original idea (2026-09-30): "mods become
  random (most likely pseudo-random) drops from enemies, never offered, smooth
  part of the dive, some of them permanent, some temporary". **"Permanent"
  means "for the rest of the dive"**: "yes i meant exactly this".
- **Shape B**: "go with B". Lasting mods arrive one per batch. Temporary
  boosts drop from kills, must be touched, and blink out.
- **The layer end keeps a pause**: "not quite, layer end does have a pause".
  It is filled by "a choice of valuable mods, with a continue button after
  being chosen". Valuable means a mix of the layer end's own mods and ordinary
  mods at a bigger step: "both good. for a player, they must be somewhat
  similar. go with a mix of both". "Clicking a card only marks it, so you can
  switch until you press Continue": "yes".
- **Currency stays out of it**: "currency is a spendable entity, used on home
  screen. not related to mods or boosts". So D35 (currency is auto-collected)
  does not bind boosts, and boosts may expire.
- **Rank retires**: "yes".
- **Caps**: "cap is a question of balance. we are shifting towards a game where
  caps are hard to decide at this point. make the easiest implementation now."
- **A glowing fish carries the batch's mod**: "ok for glow, comes randomly in the
  middle".
- **Accepted defaults**:
  - "boost" is the word;
  - picking up the same boost again restarts its timer, and nothing stacks;
  - boosts drop pseudo-randomly, never from a batch's last enemy;
  - mod points moves to Declined;
  - trade-off mods stay parked.

## The design

### 1. A glowing fish carries each batch's mod

- Every batch of the plan has one **carrier**, except a layer end's: the
  boss's batch is paid by the pick instead (point 2).
- When a batch arrives, a point is drawn between a third and two thirds of its
  total health (`GLOW_FROM`, `GLOW_TO`). The first time the batch's remaining
  health falls to that point, one random living fish starts to glow. This is
  Claude's reading of "comes randomly in the middle": a fish already in the
  batch lights up partway through; no extra fish arrives, which would make the
  batch seem to refill, the risk the glossary's **wave** row names.
- One rule covers a batch of one. The mini-boss lights up partway through its
  own health.
- If everything left dies in the tick that crosses the point, one of those
  kills carries it anyway. A batch's mod is never lost.
- The flag is `carrier`, not `glow`, which is already an enemy's colour.
- Killing the carrier drops its mod where it died. The drop flies to you at
  `GEM_PULL`, from anywhere, and never expires. It lives in an array of its own,
  `drops`, not in `gems`, because currency is not related to mods.
- Touching it takes the mod through `takeMod()`. A banner then shows its name,
  its line and its numbers: `notice`, with `modPreview()`'s before and after.
- Enemies placed by hand (a scenario's, a check's) belong to no batch and carry
  nothing.

### 2. The layer end: a pick of valuable mods, then Continue

- The boss dies, and the heal and the haul land, unchanged from D68 (the layer
  end is a milestone). After `MOD_OFFER_DELAY` the cards open with up to three
  **valuable mods**. This is the dive's one pause.
- **Valuable** is a mix of two kinds, drawn as one pool, three distinct:
  - **The layer end's own mods**: a field on the mod record, `end: true`.
    A fish never carries one.
  - **Ordinary mods at a bigger step**: `END_STEP` picks at once, shown as
    "Fins ×2" with the numbers after both steps.
- Both kinds use the same card and the same look. "Somewhat similar", in
  Claude's reading, means they look alike and are worth about the same: a
  layer-end mod is written to be worth about a double step.
- An ordinary mod is offered only if `END_STEP` more picks fit under its cap.
  One of the layer end's own mods is offered only while it is under its cap.
  With fewer left the screen shows fewer cards, and with none, only Continue.
- **Marking, then Continue.** The arrows, a click or 1/2/3 mark a card, and you
  can switch. Continue takes the marked card and the current carries you on;
  it is a button under the cards, or Enter/Space. The screen opens with the
  middle card marked, so Enter alone is still a one-second pick. Esc pauses, as
  now.
- **The first layer-end mod is `Mend`.** It moves off the fish (Claude's pick):
  it is the one switch, and "a heart back each batch" reads as valuable. S5
  (content) writes more.
- **The last layer's end has no pick.** It is the win, unchanged from D68 (the
  layer end is a milestone).

### 3. Which mod a fish carries

- The mod is drawn when the carrier dies, from the ordinary mods still under
  their caps. Every one comes once before any repeats: a round that refills
  when spent, the Tetris bag. The draw is seeded.
- **Caps stay as D69 (every mod capped) has them**, and their values are S6
  (balance)'s. The capped case gets the easiest code: when nothing is left to
  draw, no fish glows.
- **The fill cards go.** `FILLERS` and `FILLER_GEMS` are deleted: a gate has
  no cards, and a layer end shows fewer of them.
- **Known and accepted:** today's pool is too small for a dive. Five ordinary
  mods capped at 3 make fifteen draws, and layer 1 has fourteen glowing fish.
  So layer 2 gets one glowing fish and then none, and the first layer end can
  offer only `Mend`. Growing the pool is S5 (content)'s job (D69 (every mod
  capped), rule 4).

### 4. Boosts

- **A boost** is a short power dropped by a kill. It switches on when touched,
  lasts seconds, and fades if left lying on the floor. It is not a mod: it is
  not counted, has no cap, and is gone when its timer ends.
- **When one drops.** The chance on the Nth kill since the last boost is
  `BOOST_C × N`: the pseudo-random distribution Dota uses. `BOOST_C 0.02`
  means about one boost every 8.5 kills, and never more than 50 kills apart.
  A boost never drops from the kill that empties the arena; that kill still
  counts toward the next one. Which boost drops is a seeded draw from
  `BOOSTS`.
- **On the floor** it stays where it dropped and is not pulled toward you. It
  lasts `BOOST_LIFE`, blinking for the last two seconds, like the prototype's
  gems (D11 (gems expire after 8 seconds)). Touching it switches it on.
- **Switched on**, it adds its numbers to the player, `add: { speed: 200 }`.
  They are plain numbers rather than a function, so they can be taken back
  when its `time` runs out. Picking up the same boost again restarts its timer
  and adds nothing more. It adds on top of everything else and never
  multiplies (D74 (mods add on top of gear and attributes)).
- Its timer runs only in play: the layer-end pick and the pause menu freeze
  it.
- **A boost never moves `hp`**, because that cannot be taken back cleanly.
- **The first boost is `Rush`**, "you swim much faster, for a moment": speed
  +200 for 5s (Claude's pick). S5 (content) writes more.
- Active boosts and their seconds left go on the development readout (D52 (the
  development readout: show the numbers)).

### 5. Rank is retired

`rank` leaves the state, the HUD, the cards' heading, the end screens' line,
the save and the glossary. The HUD keeps `BATCH n`, which already shows the
same count. A scenario's kit is taken as picks, with no rank. The chime the
cards play moves to picking up a mod, and its sounds lose the `rank` name.

### 6. The save goes to version 3

- **Added**: `drops`, `boosts`, the kills since the last boost, the batch's
  glow point and whether it has lit, and the bag's current round. Enemies carry
  `carrier`.
- **Removed**: `rank`.
- **Migration from v2**:
  - `rank` is dropped and the new fields start empty;
  - a dive saved mid-batch counts that batch as already lit, so it has no
    carrier;
  - a dive saved with cards open takes the marked card and resumes play;
  - an offer that was still counting down is dropped.
- v1 passes through v2 on its way to v3. A `save-v3.json` fixture joins the
  other two.

### 7. The bot

- At a layer end it marks the first card and presses Continue.
- It ignores boosts, so its numbers stay a floor (D50 (the dash sweeps its
  path; the bot is not a difficulty instrument)).
- Mods reach it on their own, since drops fly to the player.

### The numbers

Every one is Claude's pick, a placeholder for S6 (balance):

| Constant | Value |
|---|---|
| `GLOW_FROM` | 1/3 |
| `GLOW_TO` | 2/3 |
| `END_STEP` | 2 |
| `BOOST_C` | 0.02 |
| `BOOST_LIFE` | 6s |
| `Rush` | speed +200 for 5s |

## Checked against foundations.md

**Glossary.**
- **mod** is rewritten: a dive-scoped power, gone at the end of the dive. A
  glowing fish carries one in every batch, and valuable ones are picked at a
  layer end. Every mod has a cap. Momentum, not strategy.
- **rank**: its row is deleted. The "never level" ban still stands on the
  **layer** row.
- **gate**: "pays one rank and offers three mods … the dive's one pause" goes.
  Clearing a gate lets the current carry you on.
- **layer end**: "a gate's rank and three mods" becomes a pick of valuable
  mods. It is the dive's one pause, ended by Continue, and the last layer's end
  has no pick.
- **mini-boss**: "its gate pays a rank and mods" becomes: it lights up partway
  through, like any carrier.
- **boost** is a new row.

**Genre contract.**
- **(4)** The mod line says how mods now arrive. Boosts are not a fourth
  progression tier: they last seconds.
- **(5)** Nothing interrupts combat, more so than before: mods arrive
  mid-fight and the one pick sits at the layer end. "Mods differ in kind, not
  degree" stays, for a new reason: a pickup has to be felt and recognised
  mid-fight. The ×2 cards are a mod's own kind at a bigger step, and every card
  shows its numbers.
- **(6)** "One one-second mod pick" becomes "a pick at each layer end".
  Boosts switch on when touched and cannot be held, stored or spent, so they
  are neither inventory nor gathered resources. Grabbing one is positioning
  inside a fight. "Currency is never chased" is untouched; currency is separate
  (Igor).

**Pillars.**
- **Nothing unbeatable.** A dive's kit is now a draw, so S6 (balance)
  measures the bad draws as well as the average. The count is fixed at one per
  batch, so the spread is only in which mods arrive.
- **Dives differ:** more than before.
- **Fast-paced:** gates no longer pause.
- **One sentence:** "kill the glowing fish for a mod; grab boosts before they
  fade."

**Technical contract.**
- Every new roll comes from `rng()`: the glow point, the carrier, the mod, the
  boost roll and which boost.
- Boost timers run in fixed ticks.
- The save stays versioned; this is its second migration.
- The seam does not grow: the banner is `notice`.
- Content stays data: boosts are a table, and layer-end mods are a field.
- The Continue button's place is derived from the card rectangles.

**Non-goals.** No second money. The design also removes a link: the gems card
paid currency, and nothing does that now.

**Plan.** This is item 2 of "Before S5". S5 (content)'s work and exit
mention "the mod pool covers a full dive"; see friction 1.

### Friction points

1. **S5 (content)'s exit check, "the mod pool covers a full dive",** against
   "caps … a question of balance". **Claude's default: keep it, reworded.**
   The ordinary mods' caps cover every glowing fish of a full dive, and every
   layer end can show three cards. The check computes from whatever the caps
   are, so it stays valid when S6 (balance) moves them. If you would rather it
   moved to S6 (balance), say so. Owner: Igor.
2. **Moving `Mend` is a balance shift.** D49 (one rank per batch, mods at the
   gate) measured the comfort mods as strong. Owner: S6 (balance).
3. **The `layer-2` scenario's kit** says "one pick per gate of the first layer
   … fifteen". It becomes what a dive carries there: fourteen fish-carried
   mods and one layer-end pick (Claude's pick). Owner: this build.
4. **The bot is blind to boosts.** Owner: S6 (balance), noted in `roadmap.md`.
   Bot figures taken with the old kit are re-measured.
5. **D72 (between layers there is no screen)**: the layer end's cards were
   "as at any gate"; now they are the only cards, and Continue ends them. There
   is still no screen between layers. Owner: this build's decision.
6. **The parked ideas.** Mod points moves to Declined, because it needs a pick
   to spend on. Trade-off mods stay parked, now reachable as optional boosts.
   Owner: this build.

## What this build supersedes and makes stale

**Decisions** written with the build:
- **Mods are dropped.** Supersedes the pick in D33 (mod offers do not
  interrupt), D34 (mods) and D49 (one rank per batch, mods at the gate).
  D51 (the offer waits for the death)'s delay now applies only at layer ends.
- **The layer end's pick of valuable mods.** Amends D68 (the layer end is a
  milestone) and D72 (between layers there is no screen).
- **Caps and the empty bag.** Supersedes rule 1 ("one rank per batch") and
  rule 3 (the fill cards) of D69 (every mod capped).
- **Boosts.**
- **Rank retired.**

**Docs and the other surfaces of the sweep:**
- `foundations.md`: the glossary rows above, and the genre contract's points
  4–6.
- `design.md`:
  - the screens diagram (the cards open at a layer end, not on "batch cleared");
  - "Rank and mods";
  - the save;
  - a section on boosts.
- `entities/mods.md`: the `end` field; the fill cards' section goes; "About to
  change" goes.
- **`entities/boosts.md`, new.** A boost is not a mod, so it is a kind of its
  own (D81 (entity docs, one per kind)). Its roster is held to `BOOSTS` by
  `npm test`, and the map in `docs/README.md` gains its row.
- `ideas.md`:
  - "Mods as drops" leaves;
  - mod points moves to Declined;
  - the trade-off note;
  - "comfort is down to one" is reworded, since `Mend` now waits for the layer
    end.
- `plan.md`: item 2 is built; S5 (content)'s pool wording follows friction 1.
- `roadmap.md`: the bot figures taken with the fifteen-mod kit.
- `CLAUDE.md`: "an enemy, mod, weapon or piece of equipment … `docs/entities/`"
  gains "boost".
- **In-game text**:
  - `HELP_KEYS`: "Choose a mod" becomes the layer end's keys and Continue;
  - `HELP_BLURB`: the rank line goes, and a line for the glowing fish and the
    boosts is added;
  - the cards' heading: "BATCH CLEARED" and "rank n" become the cleared layer's
    name. This is placeholder wording; the friendlier-messages item in
    `ideas.md` owns it.
- **Layout**: the Continue button's place derives from the cards. The help
  blurb's extra line is held by the existing overflow check.
- **Memory**: the project memory lists "rank" among the glossary terms.

## Build

1. **Checks first.** Each is seen to fail without the work:
   - a batch lights up exactly one carrier once its health passes the point,
     a layer end's batch none;
   - a mini-boss lights up partway through its health;
   - a batch that dies in one tick still drops its mod;
   - the drop flies from anywhere, is taken on contact, counted and announced;
   - once every ordinary mod is capped, no fish glows;
   - the bag deals every ordinary mod once before any repeats, and the same
     seed gives the same sequence;
   - the layer end offers up to three valuable cards, never past a cap;
   - a click marks a card; Continue or Enter takes the marked one; the current
     waits for Continue;
   - a boost drops on the Nth kill with chance C×N, never from the kill that
     empties the arena, and never more than 1/C kills apart;
   - a boost on the floor is not pulled and fades after `BOOST_LIFE`;
   - touching a boost adds its numbers, and they come off after `time`;
   - the same boost again restarts its timer without adding twice;
   - the pick freezes boost timers;
   - `rank` is gone;
   - the save round-trips drops, boosts and the carrier; the D70 (a dive can be
     saved at any point) property holds; v1 and v2 migrate; a v2 dive with
     cards open takes the marked card;
   - the mods and boosts docs are rebuilt from the tables;
   - in the browser: the Continue button and the cards fit on screen and take
     clicks, and the help still fits.
2. **`game/content.js`**:
   - `MODS` gains `end`, and `Mend` sets it;
   - `BOOSTS` with `Rush`;
   - the new constants in the balance block;
   - `FILLERS` deleted;
   - the Continue button's rectangle beside `cardRect`;
   - the help text;
   - the `layer-2` kit.
3. **`game/state.js`**:
   - the new dive variables, with `rank` gone;
   - `reset()`, `snapshot()` and `restore()`;
   - `SAVE_VERSION` 3 and the migration;
   - the kit without rank.
4. **`game/logic.js`**:
   - the glow point at `spawnBatch()`;
   - lighting the carrier each tick;
   - the mod drop and the boost roll in `killEnemy()`;
   - the `drops` loop;
   - boost timers;
   - `clearBatch()` without rank or a gate offer;
   - the layer-end pool;
   - marking and Continue.
5. **`platform/render.js`**:
   - the carrier's glow, the drops and the blinking boosts;
   - the Continue button;
   - the HUD and end screens without rank;
   - the boosts on the readout.

   All of this is placeholder graphics, for S7 (alpha polish).
6. **`checks.js`, `tests/bot.js` and the harness.**
7. **The sweep**: the decisions, the docs and the surfaces listed above, and the
   changelog.
