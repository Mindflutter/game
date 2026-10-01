# Weapons

Every weapon: its numbers, its tiers, and how it fires. A weapon is gear —
bought with gems at `home` and kept between dives (`foundations.md` → the
glossary) — fired by holding the left mouse button (D45 (the weapon is
manual)). How firing works is `design.md` → Firing.

**There is no weapon record yet.** The one weapon, the Gun, is not a line in a
table: its numbers are fields of `PLAYER_START`, its shot speed is a constant,
and its tiers are the `GEAR` record named `Gun`. So a second weapon cannot be
added as a line today. Settling the record — what a weapon is as data, how one
is owned and equipped, its tiers, where weapon-scoped mods attach — is open
(`plan.md` → Before S5). The tables below are checked against those three
places, and `npm test` fails when they disagree.

## Roster

| name | fireRate | damage | range | pierce | tiers | per tier | at top |
|---|---|---|---|---|---|---|---|
| Gun | 2.5 | 1 | 250 | 0 | 40 / 100 / 200 | fireRate +0.5 | fireRate 4 |

**tiers** are the gems each tier costs, in order; **per tier** is what one
tier adds; **at top** is the stat with every tier bought. Every shot flies at
`BULLET_SPEED 430`, the same for any weapon today.

## Fields

| Field | Unit | Where today | Meaning |
|---|---|---|---|
| `name` | — | `GEAR` | The key. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `fireRate` | shots/s | `PLAYER_START` | Holding the button fires at this rate; the first click after a pause is instant. |
| `damage` | hp | `PLAYER_START` | Taken off an enemy's `hp` per hit. |
| `range` | px | `PLAYER_START` | A shot that hits nothing dies after flying this far — a real range (D8 (the weapon has a bounded firing range)). |
| `pierce` | enemies | `PLAYER_START` | Extra enemies a shot passes through. One shot hits any enemy at most once. |
| `BULLET_SPEED` | px/s | a constant | How fast a shot flies. Each shot carries its own speed, and its range is counted at it, so a faster weapon's range still means what it says (D53 (fixed timestep, and bullets sweep too)). |
| `tiers` | gems | `GEAR` | What each tier costs, in order. Three or four tiers to a piece of gear (`foundations.md` → **tier**). |
| `apply` | — | `GEAR` | What one tier adds to the player, `p => …`. Applied once per tier owned when a dive starts, under the mods, which add on top and never multiply (D74 (mods on top of gear and attributes)). |

The shot's own radius — its hitbox — is a literal in `game/logic.js`, not a
number in the balance block.

## Gun

The starting weapon, and the only one: a single straight shot along the
cursor while the button is held. Shots keep the direction they were fired in,
so they can miss and sail on into the dark until `range` runs out. Always
carried — there is nothing to swap it for.

Its tiers add fire rate: the one stat that helps against every enemy, where
damage would be wasted on the one-hit fish that make up most batches (D75 (the
gun's tiers, dash reach, a clean batch)). The prices and the step are Claude's
picks, S6 (balance)'s to tune; the base numbers predate the tiers.

## Adding one

Not a line yet: it needs the weapon record (above). Until then a weapon's
numbers are `PLAYER_START` fields, its shot speed `BULLET_SPEED`, and its tiers
a `GEAR` record — one weapon's worth of each.
