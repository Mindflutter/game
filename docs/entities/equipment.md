# Equipment

Every piece of equipment: its numbers, its tiers, and what it does.
Equipment is gear that is not a weapon — the glossary's suit, mask, flippers
and trinkets (`foundations.md` → **equipment**). Like all gear it is bought
with gems at `home`, kept between dives, and raises combat stats (D36
(attributes)); body stats are attributes'. Each piece advances through three
or four tiers.

The tables mirror `EQUIPMENT` in `game/content.js`, and `npm test` fails when
the two disagree. Every number is Claude's pick, S6 (balance)'s to tune (D100
(equipment: the Mask, the Suit and the Weights)).

## Roster

| name | at top |
|---|---|
| Mask | range 340 |
| Suit | guard 3 |
| Weights | damage 2.5 |

Each piece's tiers, in the order they are bought:

| name | tier | cost | adds |
|---|---|---|---|
| Mask | 1 | 50 | range +30 |
| Mask | 2 | 120 | range +30 |
| Mask | 3 | 240 | range +30 |
| Suit | 1 | 90 | guard +1 |
| Suit | 2 | 200 | guard +1 |
| Suit | 3 | 380 | guard +1 |
| Weights | 1 | 70 | damage +0.5 |
| Weights | 2 | 150 | damage +0.5 |
| Weights | 3 | 280 | damage +0.5 |

**at top** is what every tier bought adds up to; **adds** is what one tier
adds. Both are worked out from the tiers' `apply` by the check.

## Fields

The same shape as a weapon's tiers (`weapons.md`), without the shot.

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the label of its row at `home`. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `tiers` | — | Three or four upgrades, each `{ cost, apply }`: the gems it costs, and what it adds to the player, `p => …`. Applied once per tier owned when a dive starts; gear, attributes and mods all add, nothing multiplies (D36 (attributes), D74 (mods on top of gear and attributes)). |
| `requires` | — | **Reserved** — no piece requires one yet, though `meets()` reads it for any gear (D98 (attributes, micro-tasks and what gear requires)): `{ attribute: points }`, the points that must be spent on an attribute before a tier can be bought — "heavy gun needs strength 5" (D36 (attributes)). Scheduling, not scaling. |

## Mask

You see further, so you shoot further: range, a tier at a time. Worn whatever
weapon is carried, so it lengthens the Knife's slash as much as the Gun's shot.

## Suit

Defence, which D36 (attributes) gives gear: the suit takes the first hit of
every batch, one more a tier (`guard`). A guarded hit costs no heart but still
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
2. A row in the roster, its rows in the tier table, and a section here under
   its `name`. `npm test` fails until they match the code.
3. `home` builds its row from `EQUIPMENT` with nothing else to do, and buying a
   tier writes the save. The `?test` check that `home`'s rows end above the
   hint holds the list as it grows.
