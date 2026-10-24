# Challenges and points

Every challenge: when it is judged, its rungs and what they ask; and every
attribute the points buy, with what a step adds. The tables mirror
`CHALLENGES` and `ATTRIBUTES` in `game/content.js`, and `npm test` fails when
they disagree.

A **challenge** is an in-dive objective that pays attribute points, rewarding
mastery, never quotas (`foundations.md` → the glossary). Each is a ladder of
**rungs**, harder up it, each a streak or one dive's feat, and any layer can
earn any rung (D109 (micro-tasks are ladders; steps cost more as they rise),
D110 (challenges)). A **point** is what a rung pays, spent at `home` to raise an
**attribute** — a body stat — a **step** at a time. How a challenge is judged
and where its count shows is `design.md` → What persists; why each rung sits
where it does, in full, is the ladders' spec, kept in git:
`git show 99d79ae:docs/specs/2026-10-15-micro-task-ladders-design.md`.

## Roster

<!-- generated: challenges -->
| name | judged | within | rungs | the first asks | the top asks |
|---|---|---|---|---|---|
| untouched | clear | — | 1 / 3 / 6 / 10 | clear a batch without a hit | clear 10 batches in a row without a hit |
| footwork | clear | — | 3 / 6 / 10 / 15 | clear 3 batches in a row without dashing | clear 15 batches in a row without dashing |
| beeline | clear | — | 1 / 3 / 5 / 8 | kill a glowing fish before the rest of its batch | kill the glowing fish first, 8 batches in a row |
| flurry | kill | — | 6 / 12 / 20 / 30 | kill 6 fish within 2 seconds | kill 30 fish within 2 seconds |
| swift | end | true | 480 / 360 / 300 / 240 | clear a layer within 8 minutes | clear a layer within 4 minutes |
<!-- /generated -->

<!-- generated: attributes -->
| name | a step adds |
|---|---|
| Dash reach | dashSpeed +150 |
| Heart | hp +1, maxHp +1 |
| Strength | dashDamage +1 |
<!-- /generated -->

**judged** is which of `clear`, `kill` and `end` the record has. Every number
is Claude's pick, none tuned by S6 (balance): Dash reach and Strength are
the dash's, which waits on its discussion (`ideas.md`), and the rungs are
sized on fifteen gates a layer, not the ten a layer has (D137 (batches grow
from seconds to a minute and a half)) — open, `ideas.md` → Challenge rungs on the shorter dive.

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key: the save keeps the rungs earned by it (`challenges`), so renaming one forgets them. The status bar, the lists and the notice show it. |
| `rungs` | a count, or s with `within` | The thresholds, easiest first. A dive's count must reach rung k to pay it — or, `within`, come in at or under it. Four each. |
| `ask` | — | A rung in one sentence, given its threshold: what the lists and the notice say. |
| `clear` | — | Its presence judges it as each batch of the plan clears: it takes the streak so far and returns it after this batch — one on, or back to 0. |
| `kill` | — | Its presence judges it after each kill in a batch of the plan: it returns the count. |
| `end` | — | Its presence judges it at a layer's end: it returns the count — `swift`'s, the layer's time. |
| `within` | — | A rung is a time to beat, not a count to reach. |
| `apply` | — | An attribute's: what one step adds to the diver, applied once for each step raised as a dive starts. |

## untouched

Evasion: batches cleared in a row without a hit. The suit's guard taking one
still counts as a hit (D100 (equipment: the Mask, the Suit and the Weights)).
Its first rung is a single clean batch, D36 (attributes)'s own example. The
others mark how cleanly a player plays: 3, 6 and 10 are each expected within
a dive of fifteen-gate layers at 32%, 62% and 79% of batches clean, so the top
asks a good player for about a dive, never several; a dive's layers have
ten (above).

## footwork

Restraint: batches cleared in a row without dashing. Not dashing is a choice,
not luck, so its rungs follow the dive's shape, sized on fifteen gates a
layer: three batches, then six, ten, and fifteen — more than the ten a layer
has (above). Whether it stays is open: it asks the player to give up the
dash (`ideas.md` → `footwork`, reworked or dropped).

## beeline

Priority: batches in a row whose glowing fish dies first. A batch with no
glowing fish — a lunger's, or any once every mod is capped — neither counts
nor breaks it. A fish killed on the same tick as the glowing one died with it:
one swing, one shot through a line or one dash is one moment. 3, 5 and 8 are
each expected within thirty-six glowing batches at 34%, 57% and 75% — a dive
of fifteen-gate layers; a dive has twenty-one (above).

## flurry

Aggression: fish killed within `FLURRY_TIME` seconds. Its rungs are what a kit
can do in that time: the starting Gun fires six shots, so rung 1 is every one
a kill, or any help. Twelve needs a tier, a boost, the Harpoon through a line
or the Knife in a crowd; twenty and thirty, boosts taken together into a
crowd.

## swift

Speed: a layer cleared within a time, from its first batch arriving to its
boss's clear. A dive begun partway into a layer is not judged on it. Its rungs
are seconds, walking the pillar of a layer in 4–8 minutes (`foundations.md` →
Pillars) from its slow end to its fast end: a perfect layer 1 with the starting
kit is about four minutes.

## Points

- **Rung k of a ladder pays k points**: 1, 2, 3, 4. A harder rung pays more, so
  the top of a ladder is worth its effort. A ladder pays 10, the five 50.
- **Step n of an attribute costs n points**: 1, 2, 3, and on. The first step of
  each is cheap and depth is dear. Fifty points buy five steps of every
  attribute, or nine of one.
- Points held are what the rungs paid less what the steps cost — derived, never
  stored. Only challenges pay them: money cannot buy them, and they buy no gear
  (D36 (attributes)). A piece of gear may require steps of an attribute
  (`requires`, D98 (attributes, micro-tasks and what gear requires)).

## Dash reach

Each step lengthens the dash: 99px at none, 123 at one, 147 at two (D75 (the
gun's tiers, dash reach, a clean batch), D111 (the dash a third shorter)). The
only thing that does: nothing a dive picks up lengthens it (D56 (the dash is a
fixed, committed lunge)).

## Heart

Each step 1 more max HP, given full (D98 (attributes, micro-tasks and what
gear requires)).

## Strength

Each step makes the dash hurt what it shoves (D98 (attributes, micro-tasks and
what gear requires)). The Harpoon requires the first.

## Adding one

A challenge:

1. A line in `CHALLENGES`: `name`, four `rungs` easiest first, an `ask` that
   reads any of them in one sentence, and one of `clear`, `kill` or `end` —
   with `within` if a rung is a time to beat. Mastery, never a quota: a streak
   or one dive's feat, never a running total (D36 (attributes)). It asks
   something no other challenge does.
2. Its rungs sized as these were: each expected within about a dive at the
   level of play it marks (the spec, above).
3. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test` fails
   until both match the code; `checks.js` measures every rung's line and
   notice against the view.

An attribute:

1. A line in `ATTRIBUTES`: `name` and `apply` — a body stat, health or the
   dash, never a combat one, which is gear's (D36 (attributes)).
2. A section here under its `name`; `npm run docs` writes its row.
