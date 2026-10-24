# S6 (balance) — design

2026-10-21. S6 (balance): the game balanced, and the numbers saying so. Igor,
opening it: "start s6, no interruptions unless critical questions to me". So
every call below that is not quoted from Igor or a decision is **Claude's
call, delegated** — made to keep going, recorded for Igor to reopen, never
presented as his. Every number is either **measured**, and says by what, or
**Claude's pick**, and says so. Once built this spec is history; where it and a
decision disagree, the decision wins.

## Taken as settled

- **The stage** — `plan.md` → S6: paired seeded bot dives per weapon, per
  layer, per gear level; every numeric pillar measured and met or revised; the
  threat system for enemies; every batch measured against its stretch and each
  layer against the kit expected there, the mods from the layers above
  included (D66 (the dive runs on through the layers)); which enemies drop
  gems a lever (D78 (gems are pulled to the player)); grades the system's.
  **Exit**: no unbeatable batch, no batch cleared without moving; no weapon
  strictly dominating another in mid-to-late game, measured; every provisional
  target in `foundations.md` a measured one; balanced, and the numbers say so.
- **The threat system's direction** is Igor's — approach A: a threat number per
  enemy type, a batch's threat computed from its enemies, measurement
  correcting the numbers (D79 (a dive goes from easiest to hardest)). Threat
  rises **overall and gradually**, "not linear, some later batches might be
  easier", "in numbers and in enemy types" — never a rule that each batch is
  harder than the last.
- **Grades are the system's** (D119 (grades: the same fish, stronger)): never
  written into a layer or a batch; deeper, harder grades appear; "extremely
  high-grade enemy cant be on the first layer"; batches "different but equally
  challenging at any given batch/wave"; each type at each grade its own threat
  number.
- **Pools stay hand-made and drawn** (D71 (batches are drawn from pools)): a
  stretch's batches of comparable threat; the mini-bosses and the boss in
  fixed places.
- **Bot numbers are a floor** (D50 (the bot is not a difficulty instrument)):
  a bot that plays too well flatters nothing and over-tunes everything. The
  balance bot is Igor's wish — "would be nice and handy to have a bot
  mimicking real player's behavior" (D63 (the win rate is the boss fight's)) —
  sized in `ideas.md` → There are three bots.
- **Igor's notes for S6** (`ideas.md`): batches "very easy" (2026-09-27), the
  boss "very easy" (2026-09-29); `footwork` must take skill — "it all comes to
  balance"; hits worth more than one, sized here; the puffer "clumsy. maybe
  acceleration or making it faster"; "make bosses & mini bosses quicker";
  "knife arc reduce by half"; mod caps — "remove the limit entirely … or
  bigger caps, yes. dont really matter at this point"; the boss's crowd
  "according to the balance for current batch"; the splash on many-hit
  weapons (D125 (boosts keep each weapon's nature)).
- **The dash is not touched.** Igor, 2026-10-21: "leave dash for now,
  discussions needed". Its lock and its shove stay open, and with them every
  number that feeds it — the dash's own, `Reflex`, `Impact`, Strength, Dash
  reach. S6 measures with the dash as it is and changes none of it; the dash
  economy's tuning (`ideas.md`) waits for that discussion.

## The design

### 1. Three bots

`ideas.md` → There are three bots names three jobs. This stage builds the two
it needs, in `tests/bot.js`, beside the one that exists.

- **`kiteAndShoot` stays** — the regression yardstick, unchanged, so every
  check that plays it keeps its meaning.
- **The diver bot** — the balance bot, playing roughly as a player would, with
  only what the screen shows:
  - **Moves by danger.** Every tenth of a second it scores the eight ways the
    keys can swim, and standing: each fish's body and attack reach, every enemy
    shot, a fusing puffer's blast and a winding-up lunger's lane, looked at
    over the next 0.4s along that way; the edges of the view; against the pull
    of where its weapon wants it — a shooter at three quarters of its range
    from its target, the Knife just inside its blade's reach.
  - **Shoots what matters.** The target is the fish that threatens most for
    the time it takes to kill — the glowing fish first, as a player wants its
    mod — aimed ahead of its swim at the shot's speed. The trigger is held
    while the target is in reach.
  - **Dashes to escape.** When every way still lands a hit, and the dash is
    ready, it dashes — the dash as it is, along the facing.
  - **Grabs a boost** lying near and safe, as a player would; the old bot never
    did (D86 (boosts)).
  - **Human limits**, Claude's picks: it re-plans only every 0.1s, its aim
    scatters by a few degrees, and its noise comes from a generator of its
    own, seeded with the dive — so a seed replays exactly, and the game's own
    draws are untouched by it.
  - **At a layer end** it takes the first card, as the old bot does (D85 (the
    layer end's pick)), so two dives of a seed are built alike.
- **The standing bot** — the diver bot that never swims and never dashes. It
  is the "nothing trivial" instrument: a batch it clears is a batch cleared
  without moving. The cheapest form of the exploit finder; the lookahead
  search stays in `ideas.md`.

### 2. Measuring

`tests/measure.js`, run as `npm run measure`, prints tables. Dev tooling, like
the suites; nothing in it ships. Every comparison is **paired**: the same
seeds on both sides.

- **A batch alone**: any pool batch at any kit, the diver bot from full HP —
  how long to clear, hearts lost (HP held out of reach, so the count is not cut
  short by a death), and whether it died (real HP). The standing bot likewise.
- **A layer** from its top, with a kit, mortal.
- **A career**: a fresh save diving again and again, spending by a fixed
  order — the carried weapon's tiers, then the equipment's, cheapest first;
  attribute points on the cheapest step — until the win or a cap. It measures
  dives to the first purchase, and **the kit when each layer is first
  reached**: what "the gear level expected when it is first met" means here.
- **The reference kit** — the Gun, no gear, no mods, no steps: the fixed
  ruler threat is read with.

### 3. Threat

- **A fish's threat is hearts**: what the diver bot loses to it, at the
  reference kit, measured. Each type has one number per grade, `threat` on its
  record — a line of data, so a new type is measured once and joins.
- **A batch's threat is computed from its fish.** Its form — a plain sum, or
  one that grows faster than the count, as a crowd does — is chosen by fitting
  measured batches, and recorded with the fit.
- **Measurement corrects the numbers**: every pool batch measured at the
  reference kit against its computed threat; the per-type numbers refitted
  until the computed threat predicts the measured one.

### 4. Threat rises through a dive; grades are the system's

- **The dive's curve**: each ordinary stretch of the dive has a target threat,
  rising by a constant step from the first stretch to the last — two
  constants in the balance block, so a fourth layer extends it with no new
  number. Claude's picks, tuned by measurement. It replaces the hp bands D71
  (batches are drawn from pools) sized stretches by.
- **A drawn batch is graded up to its target**: fish by fish, drawn from the
  seed, one grade at a time, until the batch's threat reaches the target's
  band. So two batches of a stretch are different and equally challenging, and
  deeper stretches meet harder grades.
- **Which grade a depth allows** is on the grade: a fish may arrive at grade 3
  only from the second layer on, so the first layer never meets it.
- **The mini-boss and the boss** arrive at the grade of their layer's number;
  their escorts are graded as their pool's stretch is.
- **The plan holds the grades**, drawn before anything else, so a saved dive
  plays on with them; an older save's plan is ungraded and plays as before.

### 5. The numbers

**Targets**, Claude's picks unless a pillar's — the diver bot, at the kit the
career reaches each layer with:

| what | target | from |
|---|---|---|
| time to clear a batch | 10–45s | pillar, Fast-paced |
| time to clear a layer | 4–8 min | pillar, Dives are a session |
| every pool batch, from full HP | cleared on every seed | pillar, Nothing unbeatable |
| every pool batch, standing | not cleared | pillar, Nothing trivial |
| dives to the first purchase | ≤ 3 | pillar, Addictive, not grindy |
| hearts lost per batch, through a layer | rising overall | D79 (a dive goes from easiest to hardest) |
| each weapon, layers 2 and 3, matched kits | none better on time, hearts lost and completion at once | the stage's DoD |

**Levers**: the pools' batches, the waves, every fish's numbers (Igor's notes
among them), what each attack costs — Claude's lean: the attacks with a long
tell above the bites — the grade steps, the mod caps (bigger, so
`foundations.md`'s "every mod has a cap" holds), which fish pay gems and the
gear's prices, the Knife's arc at 60°, the bosses quicker, the puffer.
**Not a lever**: the dash.

### 6. A balance suite

`npm run balance` runs the measured DoD as checks — slow, so apart from
`npm test`, which stays quick. Each target above is a check that fails when it
breaks. It is also what `foundations.md` → Diversity, rule 6 asks for: bot
dives before and after a new entity, every pillar target held.

`npm test` gains the fast checks: every type a threat at every grade; every
pool batch at or under its stretch's target and able to reach it; a drawn
plan's batches in their bands; no grade before its layer; the curve rising;
the bots reproducible.

## Failure cases, each pinned by a check

1. **A save taken partway**: a v11 dive's plan is ungraded and must play on as
   it was; a graded plan saved and loaded must play on identically.
2. **A type with no threat**, or none at a grade → a check fails.
3. **A pool batch too hot for its stretch**, or unable to reach its target at
   the grades its layer allows → a check fails.
4. **The `mini-boss` scenario finds its batch by identity**, which a graded
   copy breaks → found by its fish.
5. **The boss's crowd** draws escorts from the graded batch, grades and all.
6. **The bots must not touch the game's RNG**, or a paired comparison is not
   paired → a bot's dive replays exactly, and its game draws match a dive
   without it up to the first input.
7. **Grading draws from the seed first thing**, so every draw after it in a
   seed moves: checks pinned to a seed's exact draws are re-read, never
   blindly re-pinned.

## Checked against foundations.md

**Glossary.** "Stretch" is already a doc word (`entities/layers.md`), not a
game term; "threat" is a number, not a term. No "level", no "upgrade".

**Genre contract.** (3) The gate is untouched. (4) Gear and attributes still
sum; the career spends them, never multiplies them. (5) Nothing new
interrupts combat. (7) Content is data: a threat is a field, the curve two
constants, a grade's depth a field on the grade.

**Diversity.** Rule 4: batches drawn and graded are different and equally
challenging — Igor's words for grades. Rule 6 becomes a suite.

**Pillars.** All measured, each with an owner in `roadmap.md` → Health; one a
measured target cannot meet is revised there and in `foundations.md`, as a
decision. "Responsive control ≤ 2 frames" is a check on the tick, not a bot
figure. "Funny, childish, straightforward" stays Igor's judgement.

**Technical contract.** The bots and the measuring are dev-only, in `tests/`;
`index.html` loads nothing new; the seam keeps its seven names; every dive
stays seeded, and the bots draw from their own generator.

**Non-goals.** No new money, no art, nothing multiplies.

### Friction points

1. **The bot is the ruler, so its skill sets the difficulty.** A bot better
   than a player makes the game too hard; worse, too easy — and Igor already
   finds it easy. Its limits are Claude's picks, stated where they are set;
   Igor's play overrules any figure.
2. **The expected kit is measured by a career that spends by a fixed order.**
   A player who buys differently meets a layer with another kit. The order is
   Claude's pick.
3. **The dash is held still** while everything around it moves; when its
   discussion lands, the balance suite says what it moved.

## What this build supersedes and makes stale

- **D71 (batches are drawn from pools)**: "comparable threat is hp" — the hp
  bands give way to threat.
- **D119 (grades)**'s placeholders: the steps, sized here.
- **`entities/layers.md`**: the hp column becomes threat.
- **`roadmap.md` → Health**: the bot figures, measured afresh.
- **`foundations.md`**: "provisional targets" become measured ones.
- **`ideas.md`**: the notes this stage settles leave it.

## As built

Where the build left the design above, the decisions say what was built: D126
(threat), D127 (the tuned numbers), D128 (the balance suite). In short:

- **A layer has ten gates**, not fifteen: three batches, then two, then two
  (D137 (batches grow from seconds to a minute and a half)); twelve before it.
- **A batch's threat is a plain sum**; no crowd term was needed at the knee.
- **A mini-boss's stretch** shares the target of the stretch before it, and
  its escorts — the boss's too — are graded to what is left once the lead's
  threat is taken.
- **The diver bot** gained two limits: it watches only the six nearest fish,
  and misses one thought in ten.
- **The kit a gate is first met with** is read per gate, off the career's dive
  that first reaches it; the career raises attributes before it buys.
- **The bars** read the pillars across seeds — most seeds, one in ten — and
  weapons over layers 2 and 3 together.
  Claude's picks, open to Igor (`ideas.md` → Open — from S6 (balance)).
- **The kiting yardstick** dies on the first graded batch, so the soak plays
  it immortal.
- **Gem drops were not moved**; the prices were.
- **Retuned after Igor's play**, D129 (a gentle first layer) and D130 (fish
  are revealed a type at a time): the curve adds a little more each stretch
  from a small start, the dive starts at grade 1, a fifth of each type stays
  at grade 1, the pools are fitted by `npm run measure fit`, the fish arrive a
  type at a time and the opening may be cleared standing; completion time
  left the bars.
- **Reshaped after his play again**, D137 (batches grow from seconds to a
  minute and a half): a dive's batches grow from about 10s to about 70s on the
  bot's clock, and from a dozen fish to about ninety, with ten gates a layer.

## Build

The plan and its progress log are build scaffolding, kept outside the repo.
Nothing is committed before Igor's `/simplify`.
