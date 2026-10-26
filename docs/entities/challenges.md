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
and where its count shows is `design.md` → What persists. The ladders' shape
is D109's; their nine rungs of a point each, and where each sits, D152 (nine
rungs a ladder, a point a rung).

## Roster

<!-- generated: challenges -->
| name | judged | within | rungs | the first asks | the top asks |
|---|---|---|---|---|---|
| untouched | clear | — | 10 / 14 / 18 / 21 / 24 / 26 / 28 / 29 / 30 | clear 10 batches in a row without a hit | clear 30 batches in a row without a hit |
| bowling | — | — | 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 | dash through 4 fish at once | dash through 12 fish at once |
| beeline | clear | — | 3 / 5 / 7 / 9 / 11 / 13 / 15 / 18 / 21 | kill the glowing fish first, 3 batches in a row | kill the glowing fish first, 21 batches in a row |
| flurry | kill | — | 7 / 9 / 11 / 13 / 15 / 18 / 21 / 25 / 30 | kill 7 fish within 2 seconds | kill 30 fish within 2 seconds |
| swift | end | true | 225 / 200 / 180 / 165 / 150 / 140 / 130 / 120 / 110 | clear a layer within 3:45 | clear a layer within 1:50 |
<!-- /generated -->

<!-- generated: attributes -->
| name | a step adds |
|---|---|
| Dash reach | dashSpeed +150 |
| Heart | hp +1, maxHp +1 |
| Strength | dashDamage +1 |
<!-- /generated -->

**judged** is which of `clear`, `kill`, `dash` and `end` the record has.
Every number is Claude's pick. The rungs are sized on the career bot (D50
(the bot measures its own policy)) over fifteen fresh dives of ten-gate
layers: about two rungs on a first dive, about three a dive to the fifth, and
the bot's best, which stops growing by about the eighth, at about half of
every ladder — the rest is for a player's skill (D152 (nine rungs a ladder, a
point a rung)). Dash reach and Strength are the dash's, which waits on its
discussion (`ideas.md`).

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key: the save keeps the rungs earned by it (`challenges`), so renaming one forgets them. The status bar, the lists and the notice show it. |
| `rungs` | a count, or s with `within` | The thresholds, easiest first. A dive's count must reach rung k to pay it — or, `within`, come in at or under it. Nine each. |
| `ask` | — | A rung in one sentence, given its threshold: what the lists and the notice say. |
| `clear` | — | Its presence judges it as each batch of the plan clears: it takes the streak so far and returns it after this batch — one on, or back to 0. |
| `kill` | — | Its presence judges it after each kill in a batch of the plan: it returns the count. |
| `dash` | — | Its presence judges it as a dash shoves a fish of the plan: it returns the count. |
| `end` | — | Its presence judges it at a layer's end: it returns the count — `swift`'s, the layer's time. |
| `within` | — | A rung is a time to beat, not a count to reach. |
| `max` | steps | An attribute's: the steps it stops at. |
| `apply` | — | An attribute's: what one step adds to the diver, applied once for each step raised as a dive starts. |

## untouched

Evasion: batches cleared in a row without a hit. The suit's guard taking one
still counts as a hit (D100 (equipment: the Mask, the Suit and the Weights)).
The top is thirty, a whole dive without a hit.

## bowling

The dash used well: fish one dash shoves, each counted once (D50 (the dash),
D152 (nine rungs a ladder, a point a rung)). The shove needs no Strength, so
the first rung asks only for a crowd met head on. Replaced `footwork`, which
paid for not dashing.

## beeline

Priority: batches in a row whose glowing fish dies first. A batch with no
glowing fish — a lunger's, or any once every mod is capped — neither counts
nor breaks it. A fish killed on the same tick as the glowing one died with it:
one swing, one shot through a line or one dash is one moment. The bot does not
hunt the glowing fish, so it stops near the second rung; a player who does
climbs past it.

## flurry

Aggression: fish killed within `FLURRY_TIME` seconds. Its rungs are what a kit
can do in that time: the starting Gun fires six shots, so rung 1 needs a
seventh kill from a tier, a boost or the dash. The upper rungs need the
Harpoon through a line, the Knife in a crowd, or boosts taken together into
a crowd.

## swift

Speed: a layer cleared within a time, from its first batch arriving to its
boss's clear. A dive begun partway into a layer is not judged on it. Its rungs
are seconds: the bot clears its first layer 1 in about 3:40 and, fully
kitted, in about 2:10.

## Points

- **Every rung pays one point**: a ladder pays 9, the five 45 (D152 (nine
  rungs a ladder, a point a rung)).
- **Step n of an attribute costs n points**: 1, 2, 3, 4, 5, and an attribute
  stops at five. The first step of each is cheap and depth is dear. The 45
  points buy every step of all three — everything bought.
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

1. A line in `CHALLENGES`: `name`, nine `rungs` easiest first, an `ask` that
   reads any of them in one sentence, and one of `clear`, `kill`, `dash` or `end` —
   with `within` if a rung is a time to beat. Mastery, never a quota: a streak
   or one dive's feat, never a running total (D36 (attributes)). It asks
   something no other challenge does.
2. Its rungs sized as these were, on the career bot (above).
3. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test` fails
   until both match the code; `checks.js` measures every rung's line and
   notice against the view.

An attribute:

1. A line in `ATTRIBUTES`: `name`, `max` and `apply` — a body stat, health or the
   dash, never a combat one, which is gear's (D36 (attributes)).
2. A section here under its `name`; `npm run docs` writes its row.
