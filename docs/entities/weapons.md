# Weapons

Every weapon: its numbers, its tiers, and how it fires. A weapon is gear —
bought with gems at `home` and kept between dives (`foundations.md` → the
glossary) — fired by holding the left mouse button (D45 (the weapon is
manual)). The tables mirror `WEAPONS` in `game/content.js`, and `npm test`
fails when the two disagree. How firing works is `design.md` → Firing.

Any number are owned and one is carried, chosen on `home`'s Gear screen
between dives and never switched mid-dive (D97 (weapons are owned, and one is
carried)). When a dive starts, the carried weapon's numbers are copied onto the
player, and its tiers apply there — so mods, attributes and the
readout see them like any other stat, and everything adds, nothing multiplies
(D83 (the weapon record)). A weapon left at `home` adds nothing to the dive.

## Roster

| name | fireRate | damage | range | shotSpeed | shotRadius | pierce | cost | at top |
|---|---|---|---|---|---|---|---|---|
| Gun | 2.5 | 1 | 250 | 430 | 4 | 0 | 0 | fireRate 4 |
| Harpoon | 0.8 | 3 | 420 | 950 | 3 | 2 | 150 | fireRate 1, damage 4, pierce 3 |
| Knife | 3 | 2 | 46 | 520 | 18 | 6 | 100 | fireRate 3.75, damage 3, range 58 |

Each weapon's tiers, in the order they are bought:

| name | tier | cost | adds |
|---|---|---|---|
| Gun | 1 | 40 | fireRate +0.5 |
| Gun | 2 | 100 | fireRate +0.5 |
| Gun | 3 | 200 | fireRate +0.5 |
| Harpoon | 1 | 80 | damage +1 |
| Harpoon | 2 | 160 | fireRate +0.2 |
| Harpoon | 3 | 300 | pierce +1 |
| Knife | 1 | 60 | range +12 |
| Knife | 2 | 140 | damage +1 |
| Knife | 3 | 260 | fireRate +0.75 |

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
| `cost` | gems | What owning the weapon costs at `home`; 0 owns it from the start (D97 (weapons are owned, and one is carried)). Owned, it is carried for nothing, and the one carried raises its tiers. |
| `requires` | — | `{ attribute: points }`: the points that must be spent on an attribute before the weapon can be owned (D36 (attributes), D98 (attributes, micro-tasks and what gear requires)) — "heavy gun needs strength 5". Unmet, its row is dim and says what it needs. Scheduling, not scaling. |

Every field is a number every weapon has, so diversity is data: a railgun is a
fast, piercing shot, a slow heavy one is slow and hits hard, and melee is first
tried as a very short, wide, piercing shot — a jab. A weapon gets a behaviour
of its own — a spray of several shots, a real swing — only when its numbers
cannot say it: a field whose presence switches it on, as with the enemies
(D83 (the weapon record)).

## Gun

The starting weapon, owned from the start: a single straight shot along the
cursor while the button is held. Shots keep the direction they were fired in,
so they can miss and sail on into the dark until `range` runs out.

Its tiers add fire rate: the one stat that helps against every enemy, where
damage would be wasted on the one-hit fish that make up most batches (D75 (the
gun's tiers, dash reach, a clean batch)). The prices and the step are Claude's
picks, S6 (balance)'s to tune; the base numbers predate the tiers.

## Harpoon

Slow, long and heavy, through what it hits (D97 (weapons are owned, and one is
carried)): the draft's "extra fast railgun-like type". A shot every second and a
bit, flying fast and far, that hits hard and passes through two fish into a
third — so it wastes damage on the one-hit swarm and lines up the rest. It
requires a point of Strength: heavy gear waits for a strong diver, D36
(attributes)'s own example. Its tiers add damage, then rate, then pierce. Every
number is Claude's pick, S6 (balance)'s to tune.

## Knife

Melee, tried as data first (D83 (the weapon record)): a very short, wide shot
that passes through everything in its arc — a slash that cuts a whole
cluster at once. It trades the
Gun's reach for closeness: you have to be where the fish are. It does not read
as melee — Igor, 2026-10-14: "melee feels like a short range" — so by D83 (the
weapon record) it needs a behaviour of its own; which one is open (`ideas.md` →
Open — from playing S5 (content)). Its tiers add reach, then damage, then rate.
Every number is Claude's pick, S6 (balance)'s to tune.

## Adding one

1. A line in `WEAPONS`: the fields above, and three or four `tiers`.
2. A row in the roster, its rows in the tier table, and a section here under
   its `name`. `npm test` fails until they match the code.
3. Its `cost` is what owning it costs at `home`; 0 owns it from the start.
   A scenario carries it with `weapon:` (`game/content.js` → scenarios), so
   S6 (balance) can measure it alone.
