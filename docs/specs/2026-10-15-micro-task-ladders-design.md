# Micro-task ladders — design

2026-10-15, in the pass before S6 (balance): what micro-tasks pay, and how
attributes grow. Igor's note from playing S5 (content), 2026-10-14:

> "micro-tasks are absolutely unclear now. think player perspective: "i need
> to boost my attrs, ok i need some points, what are those? ok, i just randomly
> completed some task and for some reason i got a point. how do i earn more?""

Opened for discussion 2026-10-15 (`ideas.md` kept the questions until this
spec). Igor: "micro tasks are not going away, because it's a nice idea and it
feels good for the achiever type of gamers. could they be easy at the start and
gradually grow in complexity? like "1-3-5-10 batches without dash" (just an
example)". Offered Claude's lean — points stay, a task visible before it pays,
deliberate, laddered, each rung a streak or one dive's feat and never a running
total, a badge beside the point, no new currency: "i like your lean, do that",
and of grind: "the rule still holds, i just need to point out that in roguelite
a lot of repetition happens anyway, cant avoid it. just so that there is not
TOO MUCH grind for the sake of one damn point." Then, of where a ladder can be
climbed and of the example's numbers: "it was an example. calculate it for the
best balance. go your way, invent more microtasks, ladders, make it clear and
earnable, implement".

The shapes quoted are Igor's. Which tasks, every rung, what a rung pays and
what a step costs are **Claude's call, delegated**, open to Igor to reopen.
Once built this spec is history; where it and a decision disagree, the
decision wins.

## Taken as settled

- **Points stay what micro-tasks pay**, and nothing else pays them: money
  cannot buy them (D36 (attributes)). No new currency. Igor.
- **The tasks stay.** Igor.
- **A task is visible before it pays**, and **deliberate**: the player knows
  what counts and sees it counting. Claude's lean, taken.
- **Each task is a ladder**: easy at the start, harder up it; each rung a
  streak or one dive's feat, never a running total. Igor's ask, Claude's lean.
- **A rung can be earned in any layer** — "go your way", of the choice between
  a ladder climbed anywhere and one rung a layer.
- **A badge beside the point.** Claude's lean, taken.
- **Mastery, not quotas, still holds** — repetition is the genre's, but no rung
  asks too much of it for its points. Igor.
- **More tasks.** Igor: "invent more microtasks".

## The design

### 1. Five tasks, five skills

Each asks a different thing of the player, as the fish do (`high level
design.md`: diversity in behaviour, not only in type):

| task | the skill | what counts | rungs |
|---|---|---|---|
| **untouched** | evasion | batches cleared in a row without a hit — the suit's guard taking it still counts as one | 1, 3, 6, 10 |
| **footwork** | restraint | batches cleared in a row without dashing | 3, 6, 10, 15 |
| **beeline** | priority | batches in a row whose glowing fish dies first | 1, 3, 5, 8 |
| **flurry** | aggression | fish killed within `FLURRY_TIME` — 2 seconds | 6, 12, 20, 30 |
| **swift** | speed | a layer cleared within a time, from its first batch arriving to its boss's clear | 8, 6, 5, 4 minutes |

`untouched` keeps its rung 1 as the old task. `footwork` widens from one
mini-boss to any run of batches — Igor's example's kind. `swift` moves from a
batch to a layer, since a batch's time is mostly the draw's: the pools hold ten
drifters and thirty-odd fish alike. `beeline` and `flurry` are new.

**A streak lives for the dive.** A hit, or a dash, breaks it, and the next
batch starts it again — a retry costs a batch, not a dive. The dive's end ends
it. **beeline** skips a batch with no glowing fish — a lunger's, or any once
every mod is capped — neither counting it nor breaking the streak. A fish
killed in the same tick as the glowing one died with it, not before: one swing
or one dash is one moment.

### 2. How the rungs were sized

**The dive's shape**: fifteen batches a layer, forty-five a dive; twelve of a
layer's carry a glowing fish.

**A streak's rungs** are set by how hard a player must play to expect one
within a dive. At a per-batch success rate `p`, the batches expected before a
first streak of `n` are `(p^-n − 1) / (1 − p)`. Solving for one dive:

| rung | untouched — within 45 batches | beeline — within 36 glowing |
|---|---|---|
| 1 | any | any |
| 3 | 32% of batches clean | 34% glowing fish first |
| 5 | — | 57% |
| 6 | 62% | — |
| 8 | — | 75% |
| 10 | 79% | — |

So each rung marks a level of play, and a player at that level meets it in
about a dive. Below it, it is out of reach rather than a grind; above it, it
comes within the dive. The top rung asks a good player for about a dive; a
fifteen-streak would have asked 89% clean, three dives at 80%, which is the
grind Igor ruled out.

**footwork's rate is a choice**, not luck: a player decides not to dash. What
makes a streak hard is fighting without the escape, so its rungs follow the
dive: three batches, a stretch and its mini-boss (six), two of each (ten), a
whole layer with its boss (fifteen).

**swift walks the pillar** — a layer in 4–8 minutes (`foundations.md`) — from
its slow end to its fast end. Layer 1 holds about 442 hp of fish; the starting
Gun, never pausing and never missing, needs about three minutes of fire, and
the current between gates about half a minute more. A perfect layer 1 with the
starting kit is about four minutes, the top rung. Gear brings it nearer.

**flurry is what a kit can do in two seconds.** The starting Gun fires six
shots in that time, so rung 1 is every shot a kill, or any help. Twelve needs a
tier, a boost, the Harpoon through a line, or the Knife in a crowd. Twenty and
thirty ask for boosts taken together into a crowd.

**The bot, measured** (2026-10-15, five seeds, made unkillable by hp so hits
still count): a floor, never a target (D50 (the bot measures its own policy)).
Starting Gun: hit in 69–73% of batches, its best clean streak 2–4, glowing fish
first by chance in 0–7%, its best two seconds 6–17 kills — 17 under Frenzy and
Lance together — and a layer in 13–21 minutes. Gun at the top tier: 17–30 kills
in two seconds, layers in 10–16 minutes. Harpoon: 19–29 kills, layers in 6–8.5
minutes. A human player is better on every one of these; Igor finds batches
easy.

### 3. What a rung pays, what a step costs

- **Rung `k` of a ladder pays `k` points**: 1, 2, 3, 4 — the harder the rung,
  the more it pays, so the top of a ladder is worth its effort. A ladder pays
  10; five pay 50.
- **An attribute's step `n` costs `n` points**: 1, 2, 3, … — the first step of
  each is cheap and depth is dear, the classic rising price. Fifty points buy
  five steps of every attribute (45), or nine of one: the nine steps one
  attribute could take before, when nine points bought a step each. The
  ceiling stays where it was; the road to it is longer and pays more often.
- Both are one sum, `tri(n) = n(n + 1) / 2`. Points held are `tri` of every
  ladder's rungs less `tri` of every attribute's steps — derived, never stored,
  as before.
- **A requirement counts steps**: the Harpoon's Strength 1 is still the first
  step, one point.
- An attribute stays uncapped where it is raised: the ladders hold a finite set
  of rungs, so the cap is at the source (D36 (attributes)), now per rung rather
  than per layer.

### 4. Seeing them

- **The Attributes screen** lists every task under its rows, one line each: its
  name, a badge per rung earned (● earned, ○ to go), and the next rung — what it
  asks and what it pays — or "every rung earned". You go there wanting to
  raise an attribute; it says where points come from.
- **The pause menu** shows the same lines, mid-dive.
- **The status bar's task line** counts live: each task's streak, its kills in
  the last two seconds, or the layer's clock, against its next rung —
  `untouched 2/3`, `swift 1:42/8:00`. A hit or a dash puts the count back to
  0, where the player sees it.
- **A rung paid** names itself and its points on the notice line: "untouched:
  clear 3 batches in a row without a hit — 2 points".
- **`home`'s layer list** loses its task marks: a task no longer belongs to a
  layer.
- **The help** gains a line saying what tasks pay and where they are listed.

### 5. Saves — version 7

- `tasks` holds rungs earned per task, by name: `{ untouched: 2, … }`.
- `spent` becomes **`raised`**: steps per attribute. Once a step costs more
  than a point, "points spent" would be a lie.
- The dive gains the streaks (`tally`), the recent kills' times (`killTimes`),
  the batch's first kill and its glowing fish's death (`firstKillAt`, `glowAt`)
  and the layer's start (`layerStart`).
- **v6 to v7**: each old task becomes as many rungs of the task of its name as
  the layers it was paid in — so points are kept, and grow under the new pay.
  Every attribute step comes back as points to spend: the prices changed, and a
  v6 save's steps would cost more than it holds. An owned weapon stays owned
  and carried, its next tier waiting on its requirement.
- **A v6 dive** plays on with no streaks, its batch's first kill unknown — so
  that batch cannot pay `beeline` — and its layer's clock not running, so
  `swift` waits for the next layer.

## Checked against foundations.md

- **The glossary changes, by decision**: a `point` is paid by a rung, once,
  ever — no longer once per layer; an `attribute` is capped at the source by the
  ladders' finite rungs and raised a step at a time, each a point dearer; a
  `micro-task` is a ladder of rungs. `rung` and `step` join the glossary's
  words; neither is "level" nor "upgrade", and `tier` stays gear's.
- **The genre contract, 4**: attributes are still earned as points by in-dive
  micro-tasks and spent at home, non-fungible; gear and attributes still sum.
  Holds.
- **5, nothing interrupts combat**: a rung paid is a notice line, never a
  pop-up. Holds.
- **6, combat is the only dynamic**: every task asks something of the fight;
  nothing is gathered. Holds.
- **7, content is data**: a task is a record — its rungs, what it asks, and the
  moment it is judged. Adding a sixth is a line. Holds.
- **Pillars**: *easy layers stay relevant* gains a mechanism — `swift` pays a
  skilled fast clear of any layer, the first included. *Addictive, not grindy*:
  rung 1 of most ladders comes in a first dive or two; the tops are sized to a
  dive at their level of play. *One sentence*: every rung's ask is one.
- **The technical contract**: the save's version goes to 7 with its migration;
  the seam is untouched; no new randomness; the task lines' layout is derived
  from the menus' lengths, with a check.
- **Non-goals**: no second money. Holds.

## Checked against plan.md

The active pass lists "what micro-tasks pay" among Igor's notes before S6
(balance). This is it. The shapes — ladders, rising pay, rising price — settle
now; every number stays S6 (balance)'s to tune. Waves (`ideas.md` → Pace) will
change what a batch's and a layer's time mean, so `swift`'s minutes and
`flurry`'s counts move with them.

## Failure cases, each pinned by a check

1. A streak counts each batch cleared clean and breaks on a hit — a guard's
   too — or a dash.
2. Several rungs crossed at once — a swing that kills twelve, a fast layer —
   pay each, once, and the notice names the highest.
3. A rung earned never pays again: in the same dive, the next, or after a save.
4. `beeline`: a batch without a glowing fish neither counts nor breaks; the
   glowing fish dying in the same tick as the first kill counts; another fish
   first breaks it.
5. `swift`: the clock starts at the layer's first batch and stops at its boss;
   a dive begun partway into a layer does not judge it.
6. `flurry`: kills older than two seconds drop out; dash and swing kills count;
   a fish placed by hand pays nothing.
7. A dive saved mid-streak plays on identically (the save-and-restore property
   check, given the new variables).
8. v6 to v7: points kept, steps returned, the Harpoon still owned and carried,
   points never below zero; the v6 fixture loads and plays on.
9. Points are `tri` of rungs less `tri` of steps; a step is refused while it
   costs more than is held.
10. A requirement counts steps.
11. The debug mode's kit sets steps, and saves nothing.
12. The task lines end above the hint on both screens, and every line fits the
    view's width.

## Build

1. `game/content.js`: `TASKS` as ladders, `FLURRY_TIME`, the task lines,
   the status bar's line, the Attributes and pause screens, the help line.
2. `game/state.js`: the save at version 7, `raised`, the dive's new variables,
   the migration.
3. `game/logic.js`: judging on a clear, a kill and a layer end; paying rungs;
   `points()`, `raise()`, `meets()`.
4. `platform/render.js`: the task lines under a menu's rows.
5. Checks: `tests/meta.test.js` and `checks.js`; the v7 fixture.
6. The sweep: `decisions.md`, `foundations.md`, `design.md`, `changelog.md`,
   `ideas.md`, `plan.md`, `roadmap.md`, memory.

## What this build supersedes and makes stale

- D36 (attributes)'s cap "per layer": the cap at the source stays, held by the
  ladders' rungs.
- D98 (attributes, micro-tasks and what gear requires)'s three tasks, each a
  point once per layer, `swift` within `SWIFT_TIME`, and a step a point.
- The glossary's `point` and `attribute`, and its `micro-task`.
- `home`'s task marks on its layer list.
