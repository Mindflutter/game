# Layers

Every layer and the batches it draws from: a layer is one section of the
abyss, a batch the fish one gate holds (`foundations.md` → **layer**,
**batch**). How a dive draws its plan from them, and how a batch arrives, is
`design.md` → Arrivals, Escorts, Layers and the plan.

The tables mirror `LAYERS`, `MINI_BOSS` and `BOSS` in `game/content.js`, and
`npm test` fails when the two disagree. A batch is sized by its threat (D126
(threat)): **target** is its stretch's, which the plan grades a drawn batch up
to; **threat** is its fish's at grade 1, **at top** all of them at the highest
grade the layer allows — so a batch sits at or under its target and can reach
it under `GRADE_KEEP`, and `npm test` fails one that cannot; the dive's first
stretch meets its target at grade 1, so it grades nothing (D129 (a gentle first
layer)). A mini-boss or the boss comes at its layer's grade, and its escorts
are graded to what is left of the target. Every batch's mix of fish is
Claude's pick, its counts fitted by `npm run measure fit` (D127 (the tuned
numbers)). The fish arrive a type at a time, in order of their threat (D130
(fish are revealed a type at a time)). No layer sets the grade its fish arrive
at (D119 (grades: the same fish, stronger)).

## Roster

| name | color | stretches |
|---|---|---|
| Layer 1 | 12 / 23 / 39 | 3 of pool 1 · mini-boss with pool 1 · 3 of pool 2 · mini-boss with pool 2 · 3 of pool 3 · boss with pool 3 |
| Layer 2 | 24 / 12 / 40 | 3 of pool 1 · mini-boss with pool 1 · 3 of pool 2 · mini-boss with pool 2 · 3 of pool 3 · boss with pool 3 |
| Layer 3 | 8 / 32 / 28 | 3 of pool 1 · mini-boss with pool 1 · 3 of pool 2 · mini-boss with pool 2 · 3 of pool 3 · boss with pool 3 |

The bosses' batches, one fish each, escorted from the pool before them (D116
(bosses bring escorts)):

| fish | crowd |
|---|---|
| mini-boss 1 | — |
| boss 1 | 4 |

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

| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 0.2 | drifter 38, darter 13 | 0.2 | 0.98 |
| 1 | 0.2 | drifter 31, darter 19 | 0.2 | 0.92 |
| 1 | 0.2 | drifter 28, darter 22 | 0.2 | 0.9 |
| 1 | 0.2 | darter 29, drifter 21 | 0.2 | 0.85 |
| 1 | 0.2 | darter 36, drifter 14 | 0.2 | 0.8 |
| 2 | 0.48 | archer 18, drifter 35 | 0.45 | 1.24 |
| 2 | 0.48 | archer 20, darter 26 | 0.44 | 0.92 |
| 2 | 0.48 | archer 15, drifter 24, darter 24 | 0.45 | 1.26 |
| 2 | 0.48 | archer 23, drifter 14 | 0.45 | 0.94 |
| 2 | 0.48 | archer 19, darter 16, drifter 16 | 0.45 | 1.09 |
| 3 | 0.87 | bulwark 9, drifter 15, archer 11 | 0.81 | 1.44 |
| 3 | 0.87 | archer 22, bulwark 6, drifter 13, darter 5 | 0.82 | 1.51 |
| 3 | 0.87 | bulwark 8, drifter 10, darter 8, archer 14 | 0.81 | 1.44 |
| 3 | 0.87 | archer 16, bulwark 8, drifter 9 | 0.8 | 1.36 |
| 3 | 0.87 | bulwark 7, darter 12, drifter 10, archer 17 | 0.81 | 1.49 |

## Layer 2

| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 1.42 | drifter 12, archer 11, puffer 6 | 0.72 | 1.77 |
| 1 | 1.42 | darter 13, archer 7, bulwark 4, puffer 4 | 0.74 | 1.69 |
| 1 | 1.42 | puffer 8, drifter 9 | 0.68 | 1.71 |
| 1 | 1.42 | drifter 23, darter 10, puffer 5 | 0.54 | 1.7 |
| 1 | 1.42 | puffer 8, darter 13 | 0.7 | 1.71 |
| 2 | 2.19 | bulwark 6, archer 7, drifter 11, puffer 8 | 1.18 | 2.73 |
| 2 | 2.19 | puffer 13, darter 12 | 1.1 | 2.61 |
| 2 | 2.19 | archer 8, puffer 12, drifter 10 | 1.15 | 2.72 |
| 2 | 2.19 | bulwark 5, puffer 9, drifter 12 | 1.09 | 2.59 |
| 2 | 2.19 | drifter 13, archer 6, bulwark 6, puffer 8 | 1.17 | 2.75 |
| 3 | 3.26 | bulwark 9, puffer 14, drifter 12 | 1.74 | 4.01 |
| 3 | 3.26 | archer 6, darter 11, puffer 15, bulwark 6 | 1.73 | 3.9 |
| 3 | 3.26 | puffer 19, archer 8, darter 10 | 1.72 | 3.93 |
| 3 | 3.26 | bulwark 6, archer 8, darter 12, puffer 15 | 1.77 | 3.98 |
| 3 | 3.26 | drifter 12, puffer 18, archer 11 | 1.69 | 3.98 |

## Layer 3

| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 4.77 | eel 14, drifter 14, archer 7 | 1.77 | 6.19 |
| 1 | 4.77 | eel 14, archer 10, darter 13 | 1.82 | 6.15 |
| 1 | 4.77 | eel 12, puffer 7, archer 8 | 2.07 | 6.34 |
| 1 | 4.77 | puffer 10, drifter 14, eel 9, archer 5 | 1.98 | 5.96 |
| 1 | 4.77 | eel 14, archer 10 | 1.77 | 5.92 |
| 2 | 6.88 | bulwark 8, eel 18, archer 8 | 2.68 | 8.46 |
| 2 | 6.88 | eel 16, puffer 10, darter 12 | 2.68 | 8.46 |
| 2 | 6.88 | archer 10, eel 20 | 2.45 | 8.32 |
| 2 | 6.88 | bulwark 6, puffer 12, eel 14 | 2.94 | 8.56 |
| 2 | 6.88 | drifter 19, eel 19, archer 10 | 2.41 | 8.41 |
| 3 | 9.83 | bulwark 10, eel 22, puffer 12 | 4.1 | 12.26 |
| 3 | 9.83 | archer 11, eel 29, darter 7 | 3.52 | 12.08 |
| 3 | 9.83 | puffer 15, eel 22, archer 10 | 3.89 | 11.88 |
| 3 | 9.83 | bulwark 7, archer 9, eel 27 | 3.67 | 11.96 |
| 3 | 9.83 | drifter 8, eel 24, puffer 11 | 3.66 | 11.83 |

## Adding one

1. A layer: a line `layer(name, color, [a, b, c])` in `LAYERS`, three pools of
   batches, and `layer()` gives it the shape every layer shares. A batch: a line
   in a pool, naming only types in `ENEMY_TYPES`, written as the mix of fish
   it should be; `npm run measure fit` sizes its counts to its stretch.
2. Its row in the roster and its section here, with its batches. `npm test`
   fails until they match the code, and holds the count of layers to
   `foundations.md` → Alpha counts.
