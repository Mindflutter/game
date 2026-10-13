# S4 — Meta loop skeleton · design

**Built and closed 2026-09-30 — history now.** The record is `changelog.md`
and D74–D80. Where this file and a decision disagree, the decision wins: D78
(gems are pulled to the player) amends what it says about D35, and D79 (a dive
goes from easiest to hardest) came after it.

**Approved in chat, 2026-09-30**, in three parts — Igor: "approved" to each.
Once built, what this describes moves into `design.md` and this file is
history; where it and `decisions.md` disagree, the decisions win.

The stage as `plan.md` has it: the dive's loop across two layers first, then
`home` and the save — `home` shows what the dive produces.

## Settled before the design

- **Mods stack on top of gear and attributes, added, never multiplied.** Igor,
  2026-09-30: "mods on top of gear/equipment/stats, havent we agreed on that?"
  — the answer to `ideas.md`'s "can one stat be raised by both a mod and
  gear?". Claude asked it again when it should have acted on it. Recorded as a
  decision in the build's sweep; the `ideas.md` entry closes.
- **Permanent dash improvements are attributes.** D36 (attributes) lists "dash"
  among the body stats; `Reflex` and `Impact` keep adding on top. Claude's
  reading of D36, stated to Igor and not corrected. Closes the dash-tier
  question in `ideas.md`.
- **S4's content** — Igor, "agreed": the gear is the gun, in tiers of fire
  rate; the attribute is dash reach; the micro-task is "clear a batch without
  taking a hit".

## Part 1 — The dive through the layers

**A layer is a record.** `LAYERS` in `game/content.js` replaces `BATCHES`:

```js
{ name, color, stretches: [ { draw: 4, pool: [batch, …] }, { draw: 1, pool: [miniBoss] }, … ] }
```

One shape for every stretch. A mini-boss or the boss is a stretch whose pool
holds one batch and draws one — no separate "fixed" case. Layer 1 keeps
today's order: 4 batches, mini-boss, 4, mini-boss, 4, boss — fifteen gates.

**Pools hold more than they draw** (D71 (batches are drawn from pools)). One
new batch per ordinary stretch, sized to that stretch's hp band the way D54
(the batches, re-derived) sized them — three new lines. S5 (content) fills
the pools out.

**The whole dive is drawn at reset.** The seed draws every batch of every
layer once, into a flat per-dive list (`plan`), each entry carrying its layer
and whether it is that layer's end. `batchIndex` indexes it and
`gateDepth(k) = k × GATE_SPACING` is unchanged, because the abyss is one tall
strip (D72 (between layers there is no screen)). The list is plain data, so
the save carries it as is.

**Layer 2** is layer 1's stretches under its own name and colour — a
placeholder until S5 (content). Crossing into it, the water takes its colour
and its name shows for a moment: placeholder graphics, per D72.

**The layer end** (D68 (the layer end is a milestone)): the boss's clear pays
a rank and the three cards, heals fully, and drops the boss's haul — the
boss's `value`, raised from 10 to 30. The last layer's end pays no rank and no
mods; the current carries you to the bottom, and the **win screen** replaces
"LAYER CLEARED".

**Every mod capped** (D69 (every mod capped)): Fins and Vitality get `max: 3`.
An offer the pool cannot fill takes a **gems card** (10 gems), then a **heart
card** (a heart back); neither is a mod, neither is counted. An offer is never
empty, so `openModOffer`'s "every mod maxed, the gate passes" branch is
deleted.

**Scenarios with a kit.** `layer-2` starts the dive at layer 2's first gate
with a stated kit — a list of mod names applied as if picked — so the bot
measures layer 2 without fighting down layer 1 (friction point 4 of the
layer-to-layer spec). `last-batch` and `mini-boss` derive their gate from the
plan instead of `BATCHES`.

## Part 2 — `home` and the economy

**Gems collect themselves** (D35 (currency is auto-collected)). Every gem flies
to the player from the moment it drops; `GEM_LIFE` and expiry go, and nothing
is lost to the descent (the S2 (camera and descent) leftover closes).
`pickupRange` is left with nothing to do and goes, with its readout row. A
dive's gems are banked when it ends — death or win (D67 (currency is kept on
death)).

**`home` exists only between dives.** Title → Start goes to `home`; with a
dive saved, Start reads **Continue** and resumes it onto the pause screen (D70
(a dive can be saved at any point)). A suspended dive cannot reach `home`, so
the shop never meets one — no mid-dive shop, and no "bought a tier, nothing
changed". Death and the win lead to `home`; **R** on the death screen still
dives again at once, since the gems are already banked.

**What `home` shows** — canvas rows from the one layout helper (D38 (the
`home` screen is canvas)): gems and unspent points; each unlocked layer by name
with its micro-task done or not, the next locked one as `???`, the rest hidden;
the deepest depth reached across dives. Rows: **Dive**, **Gun**, **Dash
reach**, Help, Options. Enter or click buys; an unaffordable row is dimmed.

**Gear: the gun.** Tier 0 is the starting kit; three tiers are bought, each
+0.5 shots/s (2.5 → 4.0), at 40 / 100 / 200 gems. A gear record is
`{ name, tiers: [{ cost }], apply }` — the mod's shape — so the second item is
a line.

**Attribute: dash reach.** Each point +150 px/s of `dashSpeed`: reach 141 →
165 → 189 px. Points come only from micro-tasks; two layers of one task each
cap it at two, as D36 (attributes) requires.

**Micro-task: clear a batch without taking a hit.** One point, once per layer,
ever — kept per layer in the save. When it pays, a short line of text shows,
the kind the layer name uses. Known and accepted: on layer 1 it will usually
pay on the first batch, which is nearer a gift than mastery; S5 (content) can
make tasks harder.

**Order of addition**: `PLAYER_START`, plus gear tiers, plus attribute points,
at reset; mods on top as they are picked. All sums.

## Part 3 — The save, the checks, the numbers

**One JSON document** in local storage:

```js
{ version: 1, bank, gear: { Gun: n }, spent: { reach: n },
  tasks: { <layer>: { untouched: 1 } }, deepest, cleared, dive }
```

Available points are derived — earned from `tasks` minus `spent` — never
stored, so they cannot disagree. `dive` is `null` between dives.

**The dive snapshot.** `game/` gains `snapshot()` and `restore()`: player,
enemies, bullets, gems, particles, the plan, rank, `modCounts`, camera,
current, every timer, and the RNG's state. Offered cards are saved by name.

**Written** on pause, when the page is hidden or closed, at a dive's end, and
on every purchase.

**The seam grows by one name: `persist(text)`.** `game/` decides when;
storing is `platform/`'s. Loading runs the other way — `main.js` hands the
stored text to `game/` at boot — so it needs no name. The seam becomes seven.

**Versioning.** A save that does not parse, or whose version this build does
not know, is **rejected loudly**: a line on the title screen, the bad text
copied aside under its own key so the next write cannot destroy it, and a
fresh start. A v1 save is committed as a test fixture, so every later build
must load it or migrate it.

**Checks**, each verified by breaking the rule it guards:

| Guards | Check |
|---|---|
| D71 (batches are drawn from pools) | same seed, same plan; two seeds, different plans; every drawn batch from its stretch's pool, never twice |
| D66, D72 (on through the layers; no screen between) | layer 1's end opens only the cards, then layer 2's first batch arrives; rank, mods and depth carry |
| D68 (the layer end is a milestone) | full heal, a rank, the cards and the haul; the last layer's end pays no rank or cards and shows the win |
| D69 (every mod capped) | over a whole dive no mod passes its cap, and every offer holds three cards |
| D35, D67 (auto-collected; kept on death) | every dropped gem is collected; death banks them |
| D70 (a dive can be saved at any point) | saved and restored at a random tick plays on identically — a property over seeds and ticks |
| The save | survives a reload; a bad version is rejected loudly; the v1 fixture loads |
| The shop and points | no buying past the bank or the top tier; the micro-task pays once per layer, never after a hit, and survives a reload |
| Layout coupled to data | `home`'s rows end above the bottom of the view |
| The seam | the harness stubs seven names, `persist` the seventh |

**Measured, into `roadmap.md` → Health**: gems per dive; dives to the first
purchase (target ≤ 3); "measurably stronger" — the bot on the same seeds with
the gun at tier 0 and tier 1, gates reached; and layer 2 from its scenario.

**Looked at**: screenshots of `home`, a layer crossing and the win screen.

## Claude's picks

Every number here goes into the `// balance` block marked as Claude's, owned by
S6 (balance): the three new batches; the haul (30); the gems card (10); the
gun's +0.5 and 40 / 100 / 200; dash reach's +150 px/s; one point per task;
layer 2's colour and name; `layer-2`'s kit. Also Claude's, approved as design:
the plan drawn whole at reset, `home` only between dives, the save written on
purchase as well as D70's two moments, and `persist` as the seam's name.

## Checked against `foundations.md` and `plan.md`

**Glossary** — layer, dive, rank, mod, gear, tier, attribute, micro-task, home
and layer end are used as defined. `home` shows "shop, the layers unlocked and
the depth reached, launch": built as that.

**Genre contract** — mods at a gate or a layer end (4, 5): unchanged. "A dive
contains fighting, descending, and one one-second mod pick" (6): the gems and
heart cards are picks on the same screen; the micro-task's line is a notice,
not a choice; auto-collection is D35. Gear and attribute sum (4): yes, and mods
sum on top. Content is data (7): layers, gear and tasks are records.

**Pillars** — *relaxed only at home*: `home` has no timer and no fail state.
*Addictive, not grindy*: measured, ≤ 3. *Dives differ*: D71's check. *One
sentence per mechanic*: "gems fly to you and buy a faster gun"; "a clean batch
earns a point per layer".

**Technical contract** — `version` from the first write, and the dive in it
from the first version (D70). The seam grows by one, deliberately: the
contract's "exactly six names" and `CLAUDE.md`'s count change in the same
step. Window-size invariance: untouched.

**`plan.md`'s S4 exit, item by item** — on through two layers with rank and
mods (D66, D72 checks); the layer end heals and pays (D68); death returns
`home` with the gems (D67); the win (D68); two seeds differ, one repeats
(D71); caps and three cards (D69); save and restore at a random tick (D70);
dive → earn → buy → stronger (measured); survives a reload, a bad save
rejected loudly (the fixture); gems per dive and dives to a first purchase
(measured); a micro-task pays and its counter survives a reload; playable.

## Friction and stale text, each with an owner

1. **In-game text, wording to Igor at build time**: `HELP_BLURB`'s "They are
   money, and they fade in eight seconds" and "…a pick of three mods, until
   the layer ends"; the win screen's words; the task's notice.
2. **Comments this build makes false** — the `ponytail:` note on `BATCHES` in
   `game/logic.js` (a layer owning its list is exactly what lands), and
   `clearBatch`'s D59 comment. Existing comments are not removed without
   asking: raised with Igor at build time.
3. **`roadmap.md`'s dash table rows at Fins ×10**, which D69's cap rules out —
   corrected in the sweep.
4. **Decisions to record in the sweep**: mods on top (Igor's); the S4 content
   picks; `home` only between dives; the save format and the seventh seam
   name.

## Left open (in `ideas.md`)

Mods as drops, never offered — Igor's idea, for discussion after S4; the
harder micro-tasks; what the currency is called; friendlier end-screen wording.
