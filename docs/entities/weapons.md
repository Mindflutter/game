# Weapons

Every weapon: its numbers, its tiers, and how it fires. A weapon is gear —
bought with gems at `home` and kept between dives (`foundations.md` → the
glossary) — fired by holding the left mouse button (D45 (the weapon is
manual)). The tables mirror `WEAPONS` in `game/content.js`, and `npm test`
fails when the two disagree. How firing works is `design.md` → Firing.

Any number are owned and one is carried, chosen on `home`'s Weapons screen
between dives and never switched mid-dive (D97 (weapons are owned, and one is
carried)). When a dive starts, the carried weapon's numbers are copied onto the
player, and its tiers apply there — so mods, attributes and the
readout see them like any other stat, and everything adds, nothing multiplies
(D83 (the weapon record)). A weapon left at `home` adds nothing to the dive.

## Roster

<!-- generated: weapons -->
| name | desc | fireRate | damage | range | shotSpeed | shotRadius | pierce | knock | cost | arc | at top |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Gun | quick, light shots | 2.5 | 1 | 250 | 430 | 4 | 0 | 60 | 0 | — | fireRate 4 |
| Harpoon | few heavy shots, fast, that go through fish | 0.8 | 4 | 420 | 3300 | 3 | 2 | 200 | 90 | — | fireRate 1.2, damage 5, pierce 3 |
| Knife | swings close, cutting several fish at once | 3 | 2 | 60 | — | 18 | 6 | 40 | 60 | 60 | fireRate 3.75, damage 3, range 72 |
<!-- /generated -->

Each weapon's tiers, in the order they are bought:

<!-- generated: weapons:tiers -->
| name | tier | cost | adds |
|---|---|---|---|
| Gun | 1 | 20 | fireRate +0.5 |
| Gun | 2 | 50 | fireRate +0.5 |
| Gun | 3 | 100 | fireRate +0.5 |
| Harpoon | 1 | 35 | damage +1 |
| Harpoon | 2 | 75 | fireRate +0.4 |
| Harpoon | 3 | 145 | pierce +1 |
| Knife | 1 | 30 | range +12 |
| Knife | 2 | 65 | damage +1 |
| Knife | 3 | 135 | fireRate +0.75 |
<!-- /generated -->

The Knife swings rather than shoots (D105 (the Knife swings)): its `swing`,
in seconds; its `arc` is in the roster.

<!-- generated: weapons:swing -->
| name | time |
|---|---|
| Knife | 0.15 |
<!-- /generated -->

**at top** is the weapon with every tier bought; **adds** is what one tier
adds. Both are worked out from the tiers' `apply` by the check.

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key. The save keeps the tiers owned by it, so renaming one orphans what players own. |
| `desc` | — | Its one line on the Weapons screen, what it is, on every row but the carried one's (D143 (every row at home says what it does)). A kind, not a number. |
| `fireRate` | shots/s | Holding the button fires at this rate; the first click after a pause is instant. |
| `damage` | hp | Taken off an enemy's `hp` per hit. |
| `range` | px | A shot that hits nothing dies after flying this far — a real range (D8 (the weapon has a bounded firing range)). A swing's blade reaches this far from the diver's centre. |
| `shotSpeed` | px/s | How fast a shot flies; a swinging weapon has none. Each shot carries its own speed, and its range is counted at it; shots are swept, so no speed tunnels through an enemy (D53 (fixed timestep, and bullets sweep too)). |
| `shotRadius` | px | The shot's hitbox: a hit is the shot's radius plus the enemy's. A swing's blade is as wide, past `range` and past the arc's edges. |
| `knock` | px/s | How hard a hit knocks a fish back, along the shot or the swing (D122 (knockback)): the speed it gives a body the diver's size, less to a heavier one by area — a fish of radius `r` gets `knock × (the diver's r / r)²`. A lunger out of its chase is not knocked. The push fades as the dash's shove does. |
| `pierce` | enemies | Extra enemies a shot passes through. One shot hits any enemy at most once. A swing cuts `pierce` + 1 at most, nearest first. |
| `arc` | degrees | How wide a swing cuts, toward the cursor; a shooting weapon has none. The Mask widens it (D181 (the Mask widens the Knife's cut)). |
| `swing` | — | Its presence is the behaviour: the weapon cuts instead of shooting (D105 (the Knife swings)). Each pull hits every fish whose body reaches into its `arc` at once; the arc is drawn for `time` seconds. No shot, so nothing to miss with or to fly on. |
| `tiers` | — | Three or four upgrades, each `{ cost, apply }`: the gems it costs, and what it adds to the player, `p => …`. Each tier may add something different (D83 (the weapon record)). |
| `cost` | gems | What owning the weapon costs at `home`; 0 owns it from the start (D97 (weapons are owned, and one is carried)). Owned, it is carried for nothing, and the one carried raises its tiers. |
| `requires` | — | `{ attribute: steps }`: the steps an attribute must be raised before the weapon can be owned (D36 (attributes), D98 (attributes, micro-tasks and what gear requires), D109 (micro-tasks are ladders; steps cost more as they rise)) — "heavy gun needs strength 5". Unmet, its row is dim and says what it needs. Scheduling, not scaling. |

Diversity is data: a railgun is a fast, piercing shot, a slow heavy one is
slow and hits hard. A weapon gets a behaviour of its own only when its numbers
cannot say it: a field whose presence switches it on, as with the enemies
(D83 (the weapon record)). The Knife's `swing` is the first — melee tried as a
very short, wide shot read as short range, not melee (D105 (the Knife
swings)).

## Gun

The starting weapon, owned from the start: a single straight shot along the
cursor while the button is held. Shots keep the direction they were fired in,
so they can miss and sail on into the dark until `range` runs out.

Its tiers add fire rate: the one stat that helps against every enemy, where
damage would be wasted on the one-hit fish that make up most batches (D75 (the
gun's tiers, dash reach, a clean batch)). The prices and the step are Claude's
picks, set so every weapon and tier is bought by the win (D162 (the whole
game in fifteen to twenty minutes)); the base numbers predate the tiers.

## Harpoon

Slow, long and heavy, through what it hits (D97 (weapons are owned, and one is
carried)): the draft's "extra fast railgun-like type". A shot every second and a
bit that hits hard and passes through two fish into a third — so it wastes
damage on the one-hit swarm and lines up the rest. The shot crosses its whole
range before a swimming eel leaves the line, so it is aimed straight at a
fish, never ahead of it, and draws as a long streak (D182 (the Harpoon a
railgun)): Igor's "like a true railgun", its speed worked out from the eel. It
requires a step of Strength: heavy gear waits for a strong diver, D36
(attributes)'s own example. Its tiers add damage, then rate, then pierce; at
the top it fires half again as fast as it starts, Igor's "even faster" (D183
(the Harpoon's top fires faster)). Every number is Claude's pick, tuned to
the pillars (D127 (the tuned numbers)).

## Knife

Melee (D105 (the Knife swings)): no shot — each pull of the trigger cuts an arc
toward the cursor, and every fish whose body reaches into it is hit at once,
nearest first, up to its `pierce` + 1. It trades the Gun's reach for closeness:
you have to be where the fish are, and a crowd is where it pays. With Bloom
each cut splashes, as a shot does; Lance is the Gun's own and never comes with
it (D125 (boosts keep each weapon's nature)). Its tiers add reach,
then damage, then rate. Every number is Claude's pick, tuned to the pillars,
but its arc, halved by Igor: "knife arc reduce by half" (D127 (the tuned
numbers)).

## Adding one

1. A line in `WEAPONS`: the fields above, and three or four `tiers`.
2. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test`
   fails until they match the code.
3. Its `cost` is what owning it costs at `home`; 0 owns it from the start.
   A scenario carries it with `weapon:` (`game/content.js` → scenarios), so
   it can be met alone, and `npm run measure weapons` sets it beside the others
   (D128 (the balance suite)).
