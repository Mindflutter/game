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
| Layer 1 | 12 / 23 / 39 | 1 of pool 1 · mini-boss with pool 1 · 1 of pool 2 · mini-boss with pool 2 · 1 of pool 3 · boss with pool 3 |
| Layer 2 | 24 / 12 / 40 | 1 of pool 1 · mini-boss with pool 1 · 1 of pool 2 · mini-boss with pool 2 · 1 of pool 3 · boss with pool 3 |
| Layer 3 | 8 / 32 / 28 | 1 of pool 1 · mini-boss with pool 1 · 1 of pool 2 · mini-boss with pool 2 · 1 of pool 3 · boss with pool 3 |
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
| `stretches` | — | The layer's gates in order, each `{ draw, pool }`. `layer()` builds them from the layer's pools and its own draws, as the roster shows (D155 (six gates a layer)). |
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
| 2 | 0.14 | archer 3, drifter 9 | 0.14 | 0.36 |
| 2 | 0.14 | archer 3, darter 9 | 0.14 | 0.29 |
| 2 | 0.14 | archer 3, drifter 7, darter 2 | 0.14 | 0.34 |
| 2 | 0.14 | archer 3, drifter 9 | 0.14 | 0.36 |
| 2 | 0.14 | archer 3, darter 3, drifter 6 | 0.14 | 0.34 |
| 3 | 0.3 | bulwark 2, drifter 15, archer 4 | 0.3 | 0.71 |
| 3 | 0.3 | archer 6, bulwark 1, drifter 10, darter 1 | 0.3 | 0.65 |
| 3 | 0.3 | bulwark 2, drifter 13, darter 2, archer 4 | 0.3 | 0.7 |
| 3 | 0.3 | archer 5, bulwark 2, drifter 6 | 0.3 | 0.58 |
| 3 | 0.3 | bulwark 1, darter 3, drifter 8, archer 6 | 0.3 | 0.63 |
<!-- /generated -->

## Layer 2

<!-- generated: layers:2 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 0.59 | drifter 5, archer 5, puffer 3 | 0.43 | 1 |
| 1 | 0.59 | darter 5, archer 3, bulwark 2, puffer 2 | 0.39 | 0.85 |
| 1 | 0.59 | puffer 3, drifter 3, archer 3 | 0.36 | 0.82 |
| 1 | 0.59 | drifter 9, darter 4, puffer 3, archer 3 | 0.4 | 1.05 |
| 1 | 0.59 | puffer 5, darter 5 | 0.43 | 1.01 |
| 2 | 1.12 | bulwark 3, archer 3, drifter 5, puffer 5 | 0.69 | 1.54 |
| 2 | 1.12 | puffer 8, darter 7 | 0.68 | 1.6 |
| 2 | 1.12 | archer 5, puffer 6, drifter 5 | 0.68 | 1.55 |
| 2 | 1.12 | bulwark 3, puffer 7, drifter 7 | 0.75 | 1.77 |
| 2 | 1.12 | drifter 8, archer 3, bulwark 3, puffer 5 | 0.7 | 1.62 |
| 3 | 2.06 | bulwark 7, puffer 11, drifter 10 | 1.3 | 2.99 |
| 3 | 2.06 | archer 4, darter 7, puffer 11, bulwark 4 | 1.27 | 2.81 |
| 3 | 2.06 | puffer 13, archer 5, darter 6 | 1.25 | 2.82 |
| 3 | 2.06 | bulwark 4, archer 5, darter 7, puffer 11 | 1.3 | 2.87 |
| 3 | 2.06 | drifter 7, puffer 12, archer 7 | 1.24 | 2.84 |
<!-- /generated -->

## Layer 3

<!-- generated: layers:3 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 3.76 | eel 17, drifter 17, archer 8 | 2.28 | 7.75 |
| 1 | 3.76 | eel 16, archer 12, darter 14 | 2.29 | 7.42 |
| 1 | 3.76 | eel 12, puffer 8, archer 9 | 2.32 | 6.85 |
| 1 | 3.76 | puffer 11, drifter 13, eel 10, archer 6 | 2.29 | 6.75 |
| 1 | 3.76 | eel 17, archer 12 | 2.35 | 7.57 |
| 2 | 6.82 | bulwark 11, eel 28, archer 11 | 4.15 | 13.02 |
| 2 | 6.82 | eel 25, puffer 15, darter 18 | 4.14 | 13.08 |
| 2 | 6.82 | archer 16, eel 32 | 4.19 | 13.82 |
| 2 | 6.82 | bulwark 8, puffer 18, eel 21 | 4.28 | 12.52 |
| 2 | 6.82 | drifter 31, eel 31, archer 16 | 4.2 | 14.23 |
| 3 | 12.33 | bulwark 18, eel 41, puffer 22 | 7.41 | 22.27 |
| 3 | 12.33 | archer 22, eel 58, darter 14 | 7.42 | 24.86 |
| 3 | 12.33 | puffer 28, eel 40, archer 18 | 7.44 | 22.3 |
| 3 | 12.33 | bulwark 13, archer 17, eel 54 | 7.42 | 24 |
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
