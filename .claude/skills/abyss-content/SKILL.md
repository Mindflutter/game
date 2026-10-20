---
name: abyss-content
description: Use when adding or changing a piece of Abyss game content — an enemy type or enemy behaviour, a mod, a boost, a weapon or its tiers, a piece of equipment, an attribute, a challenge, a batch, a layer or a scenario — including designing one with Igor before it is built.
---

# Adding content to Abyss

Adding content is one procedure run many times — S5 (content) built the
alpha's this way — and **adding the last enemy must cost what adding the
second did**. If an addition needs code beyond its record and the places
below, stop and say so: that is a finding about the data shape, not something
to work around.

## 1. Settle what it is — before any code

- **What a piece is, is Igor's.** Propose it in one sentence a player would
  get, say how it differs *in kind* from its neighbours, and wait for Igor's
  pick. One question per response.
- **Look first**: `ideas.md` (Parked, Mod ideas, Declined) and `decisions.md`
  by heading. It may be agreed, parked, or declined with a reason.
- **Its numbers are Claude's picks**, said so in the entity doc, never
  presented as derived. Balance — batch difficulty, `threat`, mod caps — is
  S6 (balance)'s; do not tune here.
- **Glossary words only** (`foundations.md`): never "level" or "upgrade".

## 2. Where each kind lives

Its record is a line in `game/content.js`; its doc's **Adding one** lists
the fields and the checks that will hold it. The alpha's counts were S5
(content)'s, and are met (D93 (the content stage's counts)).

| Kind | Table | Doc | Rules it must meet |
|---|---|---|---|
| enemy | `ENEMY_TYPES` | `entities/enemies.md` | A behaviour is a field whose presence switches it on, plus one branch in `step()` (`game/logic.js`) — never a class (D26 (disciplines installed)). A new behaviour also gets its line in `DEBUG_BEHAVIOURS`, the debug setup's words for it (D102 (the debug mode)). An attack's record carries its `damage` and its `knock`, the record itself passed to `hurtPlayer()` (D118 (hits vary in damage), D122 (knockback)); grades need nothing from a new type — `GRADES` steps every one (D119 (grades)); a behaviour that only moves a fish is left out of `attacks` in `tests/enemies.test.js`. A boss or mini-boss has `carries: false` (D88 (the fish glows from the start)). `threat` stays unwritten: S6 adds it to every type at once (D79 (a dive goes from easiest to hardest)). |
| mod | `MODS` | `entities/mods.md` | Differs in kind, not degree, readable in one line (`foundations.md` → genre contract 5). Raises only player fields. Capped (D69 (every mod capped)). |
| boost | `BOOSTS` | `entities/boosts.md` | On when touched, off after `time`; no cap, nothing kept (D86 (boosts)). |
| weapon | `WEAPONS` | `entities/weapons.md` | Three or four `tiers`; combat stats (D83 (the weapon record)). |
| equipment | `EQUIPMENT` | `entities/equipment.md` | Three or four `tiers`; combat stats — body stats are attributes' (D36 (attributes)). |
| attribute | `ATTRIBUTES` | `entities/challenges.md` | A body stat, raised a step at a time, step n costing n points; sums with gear, never multiplies (D36 (attributes), D109 (micro-tasks are ladders; steps cost more as they rise)). Permanent dash improvements live here (D74 (dash improvements are attributes)). |
| challenge | `CHALLENGES` | `entities/challenges.md` | Mastery, never a quota (D36 (attributes)): a ladder of rungs, each a streak or one dive's feat, earned in any layer, rung k paying k points (D109 (micro-tasks are ladders; steps cost more as they rise)). Judged on a clear, a kill or a layer end. Never called "micro-task" (D110 (challenges)). |
| batch, layer | the pools, `layer()`, `LAYERS` | `entities/layers.md`; how they work, `design.md` → Arrivals, Escorts, Layers and the plan | A layer owns its pools; no fixed lists (D71 (batches are drawn from pools)). A batch arrives in waves, the fish still to come telegraphed (D115 (batches arrive in waves)); a mini-boss's or the boss's stretch names the pool its escorts come from (D116 (bosses bring escorts)). Sized by total hp until S6 (balance). Numbered until named (D89 (layers are numbered until they are named)). |
| scenario | `SCENARIOS` | root `README.md` → Scenarios | One thing in isolation (D37 (scenarios)). |

## 3. Build it — in this order

1. **A check that fails without it.** `tests/` for anything `game/` decides;
   `checks.js` only for canvas, audio or real input. A behaviour gets checks
   on its state transitions — new ones in `tests/enemies.test.js`, the lunge's
   are in `tests/boss.test.js`. Run it red.
2. **The record.** A new tuning constant goes in the `// ---------- balance`
   block.
3. **Its doc row and section.** `npm test` rebuilds the roster from the code
   and shows the right table on a mismatch.
4. **A scenario** if it can be met alone — every new enemy type gets one —
   and its row in the root `README.md`.
5. **Player-facing text**: its `desc`, the pickup line, `HELP_KEYS`,
   `HELP_BLURB`, `home` labels. No check reads them, but for two: a stat a
   mod moves needs its words in `STAT_NAMES`, and a boost whose `desc` speaks
   of shots needs a `swingDesc`, for the Knife.
6. **Every screen drawn from a list it grew** — `home` rows, the cards, the
   readout (`PLAYER_STATS` for any stat it moves). Screenshot it.
7. **Verify**: `npm test` and `index.html?test`, output filtered, both green.
8. **Sweep** (`CLAUDE.md` → Working agreement): `changelog.md`; `design.md` if
   a system changed; `decisions.md` if something was decided; the idea leaves
   `ideas.md` (`docs/README.md` → How an item moves); `roadmap.md` → Health if
   a bot figure moved.
9. **Stop before committing** and say what the commit holds. One addition per
   commit, so its cost is `git show --stat <commit>` — what the cost
   comparison reads.

## Mistakes that cost an addition

- A mod or boost aimed at a bare `const`: a line of data cannot edit one
  (D34 (mods)).
- A behaviour that needs a second array, a case in another system, or a class.
  The shape was wrong — stop and report it.
- A number copied into prose. The roster holds it; a copy goes stale
  (`docs/README.md` → One home per fact).
- A check written after the code, never seen red.
