# Equipment

Every piece of equipment: its numbers, its tiers, and what it does.
Equipment is gear that is not a weapon — the glossary's suit, mask, flippers
and trinkets (`foundations.md` → **equipment**). Like all gear it is bought
with gems at `home`, kept between dives, and raises combat stats (D36
(attributes)); body stats are attributes'. Each piece advances through three
or four tiers.

The tables mirror `EQUIPMENT` in `game/content.js`, and `npm test` fails when
the two disagree. Every number is Claude's pick (D100 (equipment: the Mask, the
Suit and the Weights)), the Mask's step doubled to one you can see and the prices flattened (D158
(prices in reach, ladders a dive long)).

## Roster

<!-- generated: equipment -->
| name | at top |
|---|---|
| Mask | range 340 |
| Suit | guard 3 |
| Weights | damage 2.5 |
<!-- /generated -->

Each piece's tiers, in the order they are bought:

<!-- generated: equipment:tiers -->
| name | tier | cost | adds |
|---|---|---|---|
| Mask | 1 | 150 | range +30 |
| Mask | 2 | 400 | range +30 |
| Mask | 3 | 900 | range +30 |
| Suit | 1 | 150 | guard +1 |
| Suit | 2 | 550 | guard +1 |
| Suit | 3 | 1200 | guard +1 |
| Weights | 1 | 150 | damage +0.5 |
| Weights | 2 | 500 | damage +0.5 |
| Weights | 3 | 1100 | damage +0.5 |
<!-- /generated -->

**at top** is what every tier bought adds up to; **adds** is what one tier
adds. Both are worked out from the tiers' `apply` by the check.

## Fields

The same shape as a weapon's tiers (`weapons.md`), without the shot.

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the label of its row at `home`. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `tiers` | — | Three or four upgrades, each `{ cost, apply }`: the gems it costs, and what it adds to the player, `p => …`. Applied once per tier owned when a dive starts; gear, attributes and mods all add, nothing multiplies (D36 (attributes), D74 (mods on top of gear and attributes)). |
| `requires` | — | **Reserved** — no piece requires one yet, though `meets()` reads it for any gear (D98 (attributes, micro-tasks and what gear requires)): `{ attribute: steps }`, the steps an attribute must be raised before a tier can be bought (D109 (micro-tasks are ladders; steps cost more as they rise)) — "heavy gun needs strength 5" (D36 (attributes)). Scheduling, not scaling. |

## Mask

You see further, so you shoot further: range, a tier at a time. Worn whatever
weapon is carried, so it lengthens the Knife's slash as much as the Gun's shot.

## Suit

Defence, which D36 (attributes) gives gear: the suit takes the first hit of
every batch, one more a tier (`guard`). A guarded hit costs no HP but still
gives the i-frames and still counts as a hit for `untouched`; a bite, a shot
and a burst are guarded alike. The guard refills as each batch arrives, and a
gold ring around the diver shows one left.

## Weights

Heavier shots hit harder: damage, half a point a tier. It pays against the
tougher fish and never against the one-hit swarm, which already dies to a
single shot.

## Adding one

1. A line in `EQUIPMENT`: `name` and its `tiers`. Whatever a tier raises must
   be a field of the player, so a line of data can reach it.
2. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test`
   fails until they match the code.
3. `home` builds its row from `EQUIPMENT` with nothing else to do, and buying a
   tier writes the save. The `?test` check that `home`'s rows end above the
   hint holds the list as it grows.
