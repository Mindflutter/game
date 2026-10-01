# Equipment

Every piece of equipment: its numbers, its tiers, and what it does.
Equipment is gear that is not a weapon — the glossary's suit, mask, flippers
and trinkets (`foundations.md` → **equipment**). Like all gear it is bought
with gems at `home`, kept between dives, and raises combat stats (D36
(attributes)); body stats are attributes'. Each piece advances through three
or four tiers.

**None exists yet.** S5 (content) adds two or three (`plan.md` → S5). The tables
mirror `EQUIPMENT` in `game/content.js`, and `npm test` fails when the two
disagree.

## Roster

| name | at top |
|---|---|

Each piece's tiers, in the order they are bought:

| name | tier | cost | adds |
|---|---|---|---|

**at top** is what every tier bought adds up to; **adds** is what one tier
adds. Both are worked out from the tiers' `apply` by the check.

## Fields

The same shape as a weapon's tiers (`weapons.md`), without the shot.

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the label of its row at `home`. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `tiers` | — | Three or four upgrades, each `{ cost, apply }`: the gems it costs, and what it adds to the player, `p => …`. Applied once per tier owned when a dive starts; gear, attributes and mods all add, nothing multiplies (D36 (attributes), D74 (mods on top of gear and attributes)). |
| `requires` | — | **Reserved** (D36 (attributes)): an attribute threshold a piece may require before it can be bought — "heavy gun needs strength 5". Scheduling, not scaling. Not in the code; it lands with S5 (content)'s gear. |

## Adding one

1. A line in `EQUIPMENT`: `name` and its `tiers`. Whatever a tier raises must
   be a field of the player, so a line of data can reach it.
2. A row in the roster, its rows in the tier table, and a section here under
   its `name`. `npm test` fails until they match the code.
3. `home` builds its row from `EQUIPMENT` with nothing else to do, and buying a
   tier writes the save. The `?test` check that `home`'s rows end above the
   hint holds the list as it grows.
