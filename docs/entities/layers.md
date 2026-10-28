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
minute and a half)), at the flatter rise of D162 (the whole game in fifteen
to twenty minutes). The fish arrive a type at a time, in order of their threat (D130
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
| 1 | 0.05 | drifter 10, darter 3 | 0.05 | 0.25 |
| 1 | 0.05 | drifter 8, darter 5 | 0.05 | 0.24 |
| 1 | 0.05 | drifter 7, darter 7 | 0.06 | 0.25 |
| 1 | 0.05 | darter 8, drifter 5 | 0.05 | 0.22 |
| 1 | 0.05 | darter 10, drifter 3 | 0.05 | 0.2 |
| 2 | 0.13 | archer 2, drifter 7 | 0.1 | 0.26 |
| 2 | 0.13 | archer 2, darter 7 | 0.1 | 0.21 |
| 2 | 0.13 | archer 2, drifter 6, darter 2 | 0.1 | 0.27 |
| 2 | 0.13 | archer 2, drifter 7 | 0.1 | 0.26 |
| 2 | 0.13 | archer 2, darter 2, drifter 5 | 0.1 | 0.25 |
| 3 | 0.26 | bulwark 2, drifter 11, archer 3 | 0.25 | 0.57 |
| 3 | 0.26 | archer 4, bulwark 1, drifter 7, darter 1 | 0.22 | 0.47 |
| 3 | 0.26 | bulwark 2, drifter 10, darter 2, archer 3 | 0.26 | 0.58 |
| 3 | 0.26 | archer 4, bulwark 1, drifter 4 | 0.21 | 0.39 |
| 3 | 0.26 | bulwark 1, darter 2, drifter 6, archer 5 | 0.26 | 0.52 |
<!-- /generated -->

## Layer 2

<!-- generated: layers:2 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 0.46 | drifter 4, archer 4, puffer 2 | 0.31 | 0.73 |
| 1 | 0.46 | darter 4, archer 2, bulwark 2, puffer 2 | 0.35 | 0.77 |
| 1 | 0.46 | puffer 3, drifter 3, archer 3 | 0.36 | 0.82 |
| 1 | 0.46 | drifter 8, darter 3, puffer 3, archer 3 | 0.39 | 1.01 |
| 1 | 0.46 | puffer 4, darter 4 | 0.34 | 0.81 |
| 2 | 0.79 | bulwark 2, archer 2, drifter 4, puffer 4 | 0.51 | 1.17 |
| 2 | 0.79 | puffer 6, darter 5 | 0.51 | 1.19 |
| 2 | 0.79 | archer 4, puffer 4, drifter 4 | 0.48 | 1.1 |
| 2 | 0.79 | bulwark 2, puffer 5, drifter 5 | 0.53 | 1.25 |
| 2 | 0.79 | drifter 6, archer 2, bulwark 2, puffer 4 | 0.52 | 1.22 |
| 3 | 1.31 | bulwark 4, puffer 7, drifter 6 | 0.8 | 1.85 |
| 3 | 1.31 | archer 3, darter 4, puffer 7, bulwark 3 | 0.84 | 1.85 |
| 3 | 1.31 | puffer 9, archer 3, darter 4 | 0.85 | 1.92 |
| 3 | 1.31 | bulwark 2, archer 3, darter 4, puffer 7 | 0.79 | 1.75 |
| 3 | 1.31 | drifter 4, puffer 8, archer 4 | 0.8 | 1.83 |
<!-- /generated -->

## Layer 3

<!-- generated: layers:3 -->
| pool | target | fish | threat | at top |
|---|---|---|---|---|
| 1 | 2.15 | eel 10, drifter 10, archer 4 | 1.32 | 4.52 |
| 1 | 2.15 | eel 9, archer 7, darter 8 | 1.3 | 4.19 |
| 1 | 2.15 | eel 7, puffer 5, archer 5 | 1.37 | 4.04 |
| 1 | 2.15 | puffer 6, drifter 7, eel 6, archer 3 | 1.3 | 3.88 |
| 1 | 2.15 | eel 10, archer 7 | 1.38 | 4.45 |
| 2 | 3.5 | bulwark 6, eel 14, archer 6 | 2.12 | 6.59 |
| 2 | 3.5 | eel 13, puffer 8, darter 9 | 2.17 | 6.83 |
| 2 | 3.5 | archer 8, eel 17 | 2.21 | 7.31 |
| 2 | 3.5 | bulwark 4, puffer 9, eel 11 | 2.19 | 6.46 |
| 2 | 3.5 | drifter 16, eel 16, archer 8 | 2.16 | 7.33 |
| 3 | 5.64 | bulwark 8, eel 19, puffer 10 | 3.4 | 10.25 |
| 3 | 5.64 | archer 10, eel 27, darter 6 | 3.44 | 11.55 |
| 3 | 5.64 | puffer 13, eel 19, archer 8 | 3.49 | 10.5 |
| 3 | 5.64 | bulwark 6, archer 8, eel 25 | 3.44 | 11.12 |
| 3 | 5.64 | drifter 7, eel 23, puffer 10 | 3.46 | 11.22 |
<!-- /generated -->

## Adding one

1. A layer: a line `layer(name, color, [a, b, c])` in `LAYERS`, three pools of
   batches, and `layer()` gives it the shape every layer shares. A batch: a line
   in a pool, naming only types in `ENEMY_TYPES`, written as the mix of fish
   it should be; `npm run measure fit` sizes its counts to its stretch.
2. Its section here; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test` fails
   until they match the code, and holds the count of layers to
   `foundations.md` → Alpha counts.
