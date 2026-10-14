# Boosts

Every boost: what it adds, for how long, and its line. The table mirrors
`BOOSTS` in `game/content.js`, and `npm test` fails when the two disagree.

A boost is a short power a kill drops (D86 (boosts)): switched on by touching
it, gone after a few seconds, and gone from the floor if left lying. Not a mod
— not counted, no cap, nothing kept (`foundations.md` → the glossary). When one
drops and how it runs is `design.md` → Mods: the glowing fish and the layer
end's pick, its **Boosts** paragraph.

## Roster

| name | desc | time | adds |
|---|---|---|---|
| Rush | you swim much faster | 5 | speed +200 |
| Frenzy | you fire much faster | 5 | fireRate +3 |
| Lance | your shots go through | 5 | pierce +4 |
| Bloom | your shots swell | 6 | shotRadius +6 |

**adds** is read straight off `add`. Every number is Claude's pick, S6
(balance)'s to tune.

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the first word of the pickup line. A saved dive keeps the boosts running and those on the floor by name. |
| `desc` | — | Its one line, shown as it is touched. A kind, not a degree, like a mod's. |
| `time` | s | How long it runs once touched. Touched again while it runs, the clock restarts; nothing stacks. |
| `add` | — | What it adds to the player while it runs, `{ stat: amount }` — numbers, not a function, so the same amounts come off when `time` runs out. It adds on top of everything else and never multiplies (D74 (mods on top of gear and attributes)). Never `hp`, which could not be taken back cleanly. |

## Rush

Swim much faster, for five seconds. The first boost, Claude's pick: a body
stat, so it fits every weapon, and one that is felt at once. The new ones'
numbers are Claude's picks too (D99 (weapon mods, and more boosts)).

## Frenzy

Fire much faster, for five seconds (D99 (weapon mods, and more boosts)). The
weapon's own number, so it helps every weapon, the slow Harpoon most of all.

## Lance

Your shots go through four more fish, for five seconds (D99 (weapon mods, and
more boosts)): a crowd turns into a line to shoot down.

## Bloom

Your shots swell, for six seconds (D99 (weapon mods, and more boosts)): a wider
shot is an easier hit, and the readout shows it as `size`. A shot keeps the
size it was fired at.

## Adding one

1. A line in `BOOSTS`: `name`, `desc`, `time`, `add`. Anything it adds must be a
   field of the player — `PLAYER_START`, or the carried weapon's numbers —
   since it is added to and taken back off the player.
2. A row in the roster and a section here under its `name`. `npm test` fails
   until both match the code.
3. Every stat it moves shown on the development readout (`PLAYER_STATS`), so
   the change can be watched while it runs.
