# Weapons

Every weapon: its numbers, its tiers, and how it fires. A weapon is gear —
bought with gems at `home` and kept between dives (`foundations.md` → the
glossary) — fired by holding the left mouse button (D45 (the weapon is
manual)). The tables mirror `WEAPONS` in `game/content.js`, and `npm test`
fails when the two disagree. How firing works is `design.md` → Firing.

A dive carries one weapon. When it starts, the weapon's numbers are copied
onto the player, and its tiers apply there — so mods, attributes and the
readout see them like any other stat, and everything adds, nothing multiplies
(D83 (the weapon record)). A weapon left at `home` adds nothing to the dive.

## Roster

| name | fireRate | damage | range | shotSpeed | shotRadius | pierce | at top |
|---|---|---|---|---|---|---|---|
| Gun | 2.5 | 1 | 250 | 430 | 4 | 0 | fireRate 4 |

Each weapon's tiers, in the order they are bought:

| name | tier | cost | adds |
|---|---|---|---|
| Gun | 1 | 40 | fireRate +0.5 |
| Gun | 2 | 100 | fireRate +0.5 |
| Gun | 3 | 200 | fireRate +0.5 |

**at top** is the weapon with every tier bought; **adds** is what one tier
adds. Both are worked out from the tiers' `apply` by the check.

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `fireRate` | shots/s | Holding the button fires at this rate; the first click after a pause is instant. |
| `damage` | hp | Taken off an enemy's `hp` per hit. |
| `range` | px | A shot that hits nothing dies after flying this far — a real range (D8 (the weapon has a bounded firing range)). |
| `shotSpeed` | px/s | How fast a shot flies. Each shot carries its own speed, and its range is counted at it; shots are swept, so no speed tunnels through an enemy (D53 (fixed timestep, and bullets sweep too)). |
| `shotRadius` | px | The shot's hitbox: a hit is the shot's radius plus the enemy's. |
| `pierce` | enemies | Extra enemies a shot passes through. One shot hits any enemy at most once. |
| `tiers` | — | Three or four upgrades, each `{ cost, apply }`: the gems it costs, and what it adds to the player, `p => …`. Each tier may add something different (D83 (the weapon record)). |
| `cost` | gems | **Reserved** (D83 (the weapon record)): what owning the weapon costs — 0 for one owned from the start. Built with the second weapon in S5 (content), with the choice of which to carry, made at `home`. |
| `requires` | — | **Reserved** (D36 (attributes)): an attribute threshold — "heavy gun needs strength 5". Scheduling, not scaling. Lands with S5 (content)'s gear. |

Every field is a number every weapon has, so diversity is data: a railgun is a
fast, piercing shot, a slow heavy one is slow and hits hard, and melee is first
tried as a very short, wide, piercing shot — a jab. A weapon gets a behaviour
of its own — a spray of several shots, a real swing — only when its numbers
cannot say it: a field whose presence switches it on, as with the enemies
(D83 (the weapon record)).

## Gun

The starting weapon, and the only one: a single straight shot along the
cursor while the button is held. Shots keep the direction they were fired in,
so they can miss and sail on into the dark until `range` runs out.

Its tiers add fire rate: the one stat that helps against every enemy, where
damage would be wasted on the one-hit fish that make up most batches (D75 (the
gun's tiers, dash reach, a clean batch)). The prices and the step are Claude's
picks, S6 (balance)'s to tune; the base numbers predate the tiers.

## Adding one

1. A line in `WEAPONS`: the fields above, and three or four `tiers`.
2. A row in the roster, its rows in the tier table, and a section here under
   its `name`. `npm test` fails until they match the code.
3. Until the second weapon brings owning and choosing (S5 (content)), the
   first line of `WEAPONS` is the one every dive carries.
