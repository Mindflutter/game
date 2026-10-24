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
numbers)): past the first layer, grade 1 carries most of a batch's target, so
the batches grow in fish down the dive (D137 (batches grow from seconds to a
minute and a half)). The fish arrive a type at a time, in order of their threat (D130
(fish are revealed a type at a time)). No layer sets the grade its fish arrive
at (D119 (grades: the same fish, stronger)).

## Roster

<!-- generated: layers -->
| name | color | stretches |
|---|---|---|
| Layer 1 | 12 / 23 / 39 | 3 of pool 1 · mini-boss with pool 1 · 2 of pool 2 · mini-boss with pool 2 · 2 of pool 3 · boss with pool 3 |
| Layer 2 | 24 / 12 / 40 | 3 of pool 1 · mini-boss with pool 1 · 2 of pool 2 · mini-boss with pool 2 · 2 of pool 3 · boss with pool 3 |
| Layer 3 | 8 / 32 / 28 | 3 of pool 1 · mini-boss with pool 1 · 2 of pool 2 · mini-boss with pool 2 · 2 of pool 3 · boss with pool 3 |
<!-- /generated -->

The bosses' batches, one fish each, escorted from the pool before them (D116
(bosses bring escorts)):

<!-- generated: layers:bosses -->
| fish | crowd |
|---|---|
| mini-boss 1 | — |
| boss 1 | 4 |
<!-- /generated -->

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

<!-- generated: layers:1 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 0.05 | drifter 9, darter 3 | 0.05 | 0.23 |
| 1 | 0.05 | drifter 7, darter 5 | 0.05 | 0.22 |
| 1 | 0.05 | drifter 6, darter 6 | 0.05 | 0.21 |
| 1 | 0.05 | darter 7, drifter 5 | 0.05 | 0.2 |
| 1 | 0.05 | darter 9, drifter 3 | 0.05 | 0.19 |
| 2 | 0.14 | archer 5, drifter 11 | 0.13 | 0.37 |
| 2 | 0.14 | archer 7, darter 4 | 0.14 | 0.25 |
| 2 | 0.14 | archer 6, drifter 4, darter 4 | 0.13 | 0.31 |
| 2 | 0.14 | archer 7, drifter 4 | 0.14 | 0.28 |
| 2 | 0.14 | archer 5, darter 5, drifter 5 | 0.13 | 0.32 |
| 3 | 0.3 | bulwark 3, drifter 6, archer 4 | 0.28 | 0.51 |
| 3 | 0.3 | archer 8, bulwark 2, drifter 4, darter 2 | 0.28 | 0.52 |
| 3 | 0.3 | bulwark 3, drifter 3, darter 3, archer 4 | 0.28 | 0.49 |
| 3 | 0.3 | archer 5, bulwark 3, drifter 3 | 0.28 | 0.48 |
| 3 | 0.3 | bulwark 2, darter 5, drifter 5, archer 7 | 0.28 | 0.55 |
<!-- /generated -->

## Layer 2

<!-- generated: layers:2 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 0.59 | drifter 6, archer 6, puffer 3 | 0.37 | 0.9 |
| 1 | 0.59 | darter 5, archer 3, bulwark 2, puffer 2 | 0.36 | 0.8 |
| 1 | 0.59 | puffer 4, drifter 4, archer 3 | 0.39 | 0.94 |
| 1 | 0.59 | drifter 11, darter 5, puffer 3, archer 3 | 0.36 | 1.02 |
| 1 | 0.59 | puffer 5, darter 5 | 0.43 | 1.01 |
| 2 | 1.12 | bulwark 3, archer 4, drifter 5, puffer 5 | 0.68 | 1.55 |
| 2 | 1.12 | puffer 8, darter 7 | 0.68 | 1.6 |
| 2 | 1.12 | archer 5, puffer 7, drifter 6 | 0.68 | 1.6 |
| 2 | 1.12 | bulwark 3, puffer 6, drifter 6 | 0.7 | 1.64 |
| 2 | 1.12 | drifter 8, archer 3, bulwark 3, puffer 5 | 0.67 | 1.6 |
| 3 | 2.06 | bulwark 7, puffer 10, drifter 9 | 1.28 | 2.95 |
| 3 | 2.06 | archer 4, darter 8, puffer 11, bulwark 4 | 1.24 | 2.8 |
| 3 | 2.06 | puffer 14, archer 6, darter 7 | 1.26 | 2.89 |
| 3 | 2.06 | bulwark 4, archer 6, darter 8, puffer 11 | 1.27 | 2.86 |
| 3 | 2.06 | drifter 9, puffer 14, archer 8 | 1.31 | 3.07 |
<!-- /generated -->

## Layer 3

<!-- generated: layers:3 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 3.76 | eel 18, drifter 18, archer 9 | 2.28 | 7.96 |
| 1 | 3.76 | eel 18, archer 13, darter 16 | 2.34 | 7.9 |
| 1 | 3.76 | eel 13, puffer 8, archer 9 | 2.28 | 6.96 |
| 1 | 3.76 | puffer 12, drifter 14, eel 10, archer 6 | 2.27 | 6.76 |
| 1 | 3.76 | eel 18, archer 13 | 2.27 | 7.62 |
| 2 | 6.82 | bulwark 12, eel 28, archer 12 | 4.14 | 13.08 |
| 2 | 6.82 | eel 25, puffer 15, darter 18 | 4.14 | 13.08 |
| 2 | 6.82 | archer 17, eel 34 | 4.17 | 14.14 |
| 2 | 6.82 | bulwark 8, puffer 17, eel 20 | 4.15 | 12.13 |
| 2 | 6.82 | drifter 33, eel 33, archer 17 | 4.18 | 14.6 |
| 3 | 12.33 | bulwark 18, eel 40, puffer 22 | 7.46 | 22.3 |
| 3 | 12.33 | archer 23, eel 61, darter 15 | 7.41 | 25.41 |
| 3 | 12.33 | puffer 29, eel 42, archer 19 | 7.46 | 22.74 |
| 3 | 12.33 | bulwark 14, archer 18, eel 55 | 7.44 | 24.33 |
| 3 | 12.33 | drifter 16, eel 49, puffer 22 | 7.43 | 24.06 |
<!-- /generated -->

## Adding one

1. A layer: a line `layer(name, color, [a, b, c])` in `LAYERS`, three pools of
   batches, and `layer()` gives it the shape every layer shares. A batch: a line
   in a pool, naming only types in `ENEMY_TYPES`, written as the mix of fish
   it should be; `npm run measure fit` sizes its counts to its stretch.
2. Its section here; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test` fails
   until they match the code, and holds the count of layers to
   `foundations.md` → Alpha counts.
