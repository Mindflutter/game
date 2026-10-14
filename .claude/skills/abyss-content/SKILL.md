---
name: abyss-content
description: Use when adding or changing a piece of Abyss game content — an enemy type or enemy behaviour, a mod, a boost, a weapon or its tiers, a piece of equipment, an attribute, a micro-task, a batch, a layer or a scenario — including designing one with Igor before it is built.
---

# Adding content to Abyss

S5 (content) is one procedure run many times, and its exit asks that **adding
the last enemy cost what adding the second did** (`plan.md` → S5). If an
addition needs code
beyond its record and the places below, stop and say so: that is the stage's
finding about the data shape, not something to work around.

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
the fields and the checks that will hold it. Counts to reach: `plan.md` → S5.

| Kind | Table | Doc | Rules it must meet |
|---|---|---|---|
| enemy | `ENEMY_TYPES` | `entities/enemies.md` | A behaviour is a field whose presence switches it on, plus one branch in `step()` (`game/logic.js`) — never a class (D26 (disciplines installed)). A new behaviour also gets its line in `DEBUG_BEHAVIOURS`, the debug setup's words for it (D102 (the debug mode)). A boss or mini-boss has `carries: false` (D88 (the fish glows from the start)). `threat` stays unwritten: S6 adds it to every type at once (D79 (a dive goes from easiest to hardest)). |
| mod | `MODS` | `entities/mods.md` | Differs in kind, not degree, readable in one line (`foundations.md` → genre contract 5). Raises only player fields. Capped (D69 (every mod capped)). |
| boost | `BOOSTS` | `entities/boosts.md` | On when touched, off after `time`; no cap, nothing kept (D86 (boosts)). |
| weapon | `WEAPONS` | `entities/weapons.md` | Three or four `tiers`; combat stats (D83 (the weapon record)). |
| equipment | `EQUIPMENT` | `entities/equipment.md` | Three or four `tiers`; combat stats — body stats are attributes' (D36 (attributes)). |
| attribute | `ATTRIBUTES` | `design.md` → What persists | A body stat; sums with gear, never multiplies (D36 (attributes)). Permanent dash improvements live here (D74 (dash improvements are attributes)). |
| micro-task | `TASKS` | `design.md` → What persists | Mastery, never a quota; pays once per layer, ever (D36 (attributes)). Judged by `met()` when a batch clears. |
| batch, layer | the pools, `STRETCHES`, `LAYERS` | `design.md` → Arrivals, Layers and the plan | A layer owns its pools; no fixed lists (D71 (batches are drawn from pools)). One wave per batch unless the next is telegraphed (glossary → wave). Sized by total hp until S6 (balance). Numbered until named (D89 (layers are numbered until they are named)). |
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
   `HELP_BLURB`, `home` labels. No check reads them.
6. **Every screen drawn from a list it grew** — `home` rows, the cards, the
   readout (`PLAYER_STATS` for any stat it moves). Screenshot it.
7. **Verify**: `npm test` and `index.html?test`, output filtered, both green.
8. **Sweep** (`CLAUDE.md` → Working agreement): `changelog.md`; `design.md` if
   a system changed; `decisions.md` if something was decided; the idea leaves
   `ideas.md` (`docs/README.md` → How an item moves); `roadmap.md` → Health if
   a bot figure moved.
9. **Stop before committing** and say what the commit holds. One addition per
   commit, so its cost is `git show --stat <commit>` — what the exit's
   comparison reads.

## Mistakes that cost an addition

- A mod or boost aimed at a bare `const`: a line of data cannot edit one
  (D34 (mods)).
- A behaviour that needs a second array, a case in another system, or a class.
  The shape was wrong — stop and report it.
- A number copied into prose. The roster holds it; a copy goes stale
  (`docs/README.md` → One home per fact).
- A check written after the code, never seen red.
