# Layers

Every layer and the batches it draws from: a layer is one section of the
abyss, a batch the fish one gate holds (`foundations.md` → **layer**,
**batch**). How a dive draws its plan from them, and how a batch arrives, is
`design.md` → Arrivals, Escorts, Layers and the plan.

The tables mirror `LAYERS`, `MINI_BOSS` and `BOSS` in `game/content.js`, and
`npm test` fails when the two disagree. A batch is sized by its total hp — the
**hp** column, each type's `hp` times its count — until S6 (balance)'s threat
number (D54 (the batches, re-derived from scratch), D79 (a dive goes from
easiest to hardest)). Every batch is Claude's pick. No layer sets the grade its
fish arrive at (D119 (grades: the same fish, stronger)).

## Roster

| name | color | stretches |
|---|---|---|
| Layer 1 | 12 / 23 / 39 | 4 of pool 1 · mini-boss with pool 1 · 4 of pool 2 · mini-boss with pool 2 · 4 of pool 3 · boss with pool 3 |
| Layer 2 | 24 / 12 / 40 | 4 of pool 1 · mini-boss with pool 1 · 4 of pool 2 · mini-boss with pool 2 · 4 of pool 3 · boss with pool 3 |
| Layer 3 | 8 / 32 / 28 | 4 of pool 1 · mini-boss with pool 1 · 4 of pool 2 · mini-boss with pool 2 · 4 of pool 3 · boss with pool 3 |

The bosses' batches, one fish each, escorted from the pool before them (D116
(bosses bring escorts)):

| fish | crowd |
|---|---|
| mini-boss 1 | — |
| boss 1 | 6 |

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | Shown as the current carries you into it. Numbered until named (D89 (layers are numbered until they are named)). |
| `color` | RGB | The water at the layer's top, darkening to near-black at its end. PLACEHOLDER GRAPHICS (D72 (between layers there is no screen)). |
| `stretches` | — | The layer's gates in order, each `{ draw, pool }`. `layer()` builds every layer in the one shape the roster shows. |
| `draw` | batches | How many batches the stretch takes from its pool, never one twice (D71 (batches are drawn from pools)). |
| `pool` | — | The batches a stretch draws from. A mini-boss's or the boss's holds its one batch. |
| `escorts` | — | A mini-boss's or the boss's stretch only: the pool its escorts are drawn from, one batch. |
| `enemies` | — | A batch's fish, each `[type, count]`, or `[type, count, grade]` — grade 1 without one (D119 (grades: the same fish, stronger)). |
| `crowd` | fish | The boss's batch only: how many escorts it keeps topped up to while it lives. |

## Layer 1

| pool | fish | hp |
|---|---|---|
| 1 | drifter 10 | 10 |
| 1 | drifter 16 | 16 |
| 1 | drifter 12, darter 6 | 18 |
| 1 | darter 14 | 14 |
| 1 | drifter 8, darter 6 | 14 |
| 2 | bulwark 2, drifter 12 | 24 |
| 2 | drifter 18, darter 8 | 26 |
| 2 | bulwark 3, darter 10 | 28 |
| 2 | drifter 20, darter 12 | 32 |
| 2 | bulwark 1, drifter 14, darter 6 | 26 |
| 3 | bulwark 4, drifter 16 | 40 |
| 3 | archer 4, drifter 16, darter 6 | 30 |
| 3 | bulwark 5, drifter 18, darter 8 | 56 |
| 3 | archer 5, bulwark 3, drifter 14 | 42 |
| 3 | bulwark 3, darter 14, drifter 10 | 42 |

## Layer 2

| pool | fish | hp |
|---|---|---|
| 1 | drifter 14, archer 3 | 20 |
| 1 | darter 12, archer 4 | 20 |
| 1 | puffer 4, drifter 12 | 24 |
| 1 | drifter 18, darter 6 | 24 |
| 1 | puffer 3, darter 10 | 19 |
| 2 | bulwark 3, archer 4, drifter 10 | 36 |
| 2 | puffer 6, darter 12 | 30 |
| 2 | archer 6, puffer 4 | 24 |
| 2 | bulwark 2, puffer 5, drifter 14 | 41 |
| 2 | drifter 20, archer 5 | 30 |
| 3 | bulwark 5, puffer 6, drifter 12 | 60 |
| 3 | archer 8, darter 16 | 32 |
| 3 | puffer 10, archer 4 | 38 |
| 3 | bulwark 4, archer 6, darter 10 | 46 |
| 3 | drifter 24, puffer 6, archer 4 | 50 |

## Layer 3

| pool | fish | hp |
|---|---|---|
| 1 | eel 8, drifter 14 | 30 |
| 1 | eel 6, archer 4, darter 8 | 28 |
| 1 | eel 10, puffer 3 | 29 |
| 1 | puffer 6, drifter 16, eel 4 | 42 |
| 1 | eel 12 | 24 |
| 2 | bulwark 4, eel 10, archer 4 | 52 |
| 2 | eel 8, puffer 6, darter 10 | 44 |
| 2 | archer 8, eel 8 | 32 |
| 2 | bulwark 3, puffer 8, eel 6 | 54 |
| 2 | drifter 20, eel 10, archer 4 | 48 |
| 3 | bulwark 6, eel 12, puffer 6 | 78 |
| 3 | archer 10, eel 10, darter 10 | 50 |
| 3 | puffer 10, eel 10, archer 4 | 58 |
| 3 | bulwark 5, archer 6, eel 8, drifter 12 | 70 |
| 3 | drifter 24, darter 12, eel 8, puffer 4 | 64 |

## Adding one

1. A layer: a line `layer(name, color, [a, b, c])` in `LAYERS`, three pools of
   batches, and `layer()` gives it the shape every layer shares. A batch: a line
   in a pool, naming only types in `ENEMY_TYPES`.
2. Its row in the roster and its section here, with its batches. `npm test`
   fails until they match the code, and holds the count of layers to
   `foundations.md` → Alpha counts.
