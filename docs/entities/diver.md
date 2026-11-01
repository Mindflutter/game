# The diver

The player's body: one, rebuilt at the top of every dive (`foundations.md` →
**entity**). `reset()` builds it as `PLAYER_START`, plus the carried weapon's
numbers (`weapons.md`), each gear tier owned (`weapons.md`, `equipment.md`) and
each attribute step (`challenges.md`); mods add on top as the dive goes
(`mods.md`), and a boost for its seconds (`boosts.md`). How it swims, dashes
and is hurt is `design.md`.

The table mirrors `PLAYER_START` in `game/content.js`, and `npm test` fails
when the two disagree.

## Roster

<!-- generated: diver -->
| r | speed | ramp | turn | hp | maxHp | iframes | dashCooldown | dashSpeed | mendOnClear | dashDamage | guard | splash |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 260 | 0.25 | 0.2 | 3 | 3 | 1 | 2.2 | 620 | 0 | 0 | 0 | 0 |
<!-- /generated -->

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `r` | px | Its radius: what touches it, and what it pushes (D120 (bodies are solid)). |
| `speed` | px/s | Full swim speed. |
| `ramp` | s | To swim up to full speed, or glide to a stop (D107 (the diver swims and faces; fish with a ramp)). |
| `turn` | s | To turn round, half a circle (D107 (the diver swims and faces; fish with a ramp)). |
| `hp` | HP | What it has left; at 0 the dive ends. A hit costs its attack's `damage` (D118 (hits vary in damage)). |
| `maxHp` | HP | The most it heals to. |
| `iframes` | s | Safe after a hit, blinking (D121 (only a hit blinks; a hurt fish carries a bar)). |
| `dashCooldown` | s | Before it can dash again. |
| `dashSpeed` | px/s | While dashing: its own number, so swim speed never lengthens the dash (D56 (the dash is a fixed, committed lunge)). Its reach is `dashSpeed × DASH_TIME` (D111 (the dash a third shorter)). |
| `mendOnClear` | HP | Healed per batch cleared; `Mend` grants it (`mods.md`). |
| `dashDamage` | damage | What a dash does to each fish it passes: none until bought (D51 (the dash is bought)). It always shoves. |
| `guard` | hits | Hits a layer can take without losing HP, refilled at the layer end with the heal — the Suit's (D100 (equipment: the Mask, the Suit and the Weights), D179 (the guard lasts a layer)). |
| `splash` | px | How far from a struck fish's body its hit wounds the fish beside it too: none but while Bloom runs (D125 (boosts keep each weapon's nature)). |

## Adding a field

A field in `PLAYER_START` and its row in Fields — `npm test` fails until they
match. Whatever a mod, a boost, a tier or an attribute raises must be a field
here, so a line of data can reach it, and the readout shows it through
`PLAYER_STATS`.
