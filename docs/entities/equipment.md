# Equipment

Every piece of equipment: its numbers, its tiers, and what it does.
Equipment is gear that is not a weapon — the glossary's suit, mask, flippers
and trinkets (`foundations.md` → **equipment**). Like all gear it is bought
with gems at `home`, kept between dives, and raises combat stats (D36
(attributes)); body stats are attributes'. Each piece advances through three
or four tiers.

**None exists yet.** S5 (content) adds two or three (`plan.md` → S5). The roster
mirrors the `GEAR` records that are not weapons — today every `GEAR` record is
the Gun's (`weapons.md`) — and `npm test` fails when the two disagree.

## Roster

| name | tiers | per tier | at top |
|---|---|---|---|

**tiers** are the gems each tier costs, in order; **per tier** is what one
tier adds; **at top** is the stat with every tier bought.

## Fields

A `GEAR` record — the same shape the Gun's tiers use.

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the label of its row at `home`. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `tiers` | gems | What each tier costs, in order; how many there are is how many tiers it has. |
| `apply` | — | What one tier adds to the player, `p => …`. Applied once per tier owned when a dive starts; gear, attributes and mods all add, nothing multiplies (D36 (attributes), D74 (mods on top of gear and attributes)). |
| `requires` | — | **Reserved** (D36 (attributes)): an attribute threshold a piece may require before it can be bought — "heavy gun needs strength 5". Scheduling, not scaling. Not in the code; it lands with S5 (content)'s gear. |

## Adding one

1. A line in `GEAR`: `name`, `tiers`, `apply`. Whatever it raises must be a
   field of `PLAYER_START`, so a line of data can reach it.
2. A row in the roster and a section here under its `name`. `npm test` fails
   until both match the code.
3. `home` builds its row from `GEAR` with nothing else to do, and buying a tier
   writes the save. The `?test` check that `home`'s rows end above the hint
   holds the list as it grows.
