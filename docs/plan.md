# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

**S0 — Foundations & spike.** Started 2026-09-26.

Done: docs (`foundations.md`, `plan.md`, D27–D42), the check harness (D39 —
Test stack), `docs/` tracked in git (D40), seeded RNG + `serve.py` (D41),
scenarios + stepped mode (D42). 104 checks passing.
Next: the offscreen glow cache, then the entity-budget spike, then Vitest +
fast-check with the first property-based invariants.
Dropped: a Playwright real-keypress check. `checks.js` already dispatches
`KeyboardEvent`s through `platform/input.js` with Cyrillic and AZERTY character
values against correct physical codes — a stronger test of D12 than a real
keypress on a US layout could be.

## The loop between every stage

Not optional, and not a habit — an explicit step:

1. Decide one thing.
2. Re-read `foundations.md`.
3. List what the decision **interferes with** — constraints it breaks, earlier
   decisions it supersedes, sentences in `design.md` it makes false.
4. Fix those, in the same step.
5. **Validate** the decision: a check that fails without it, a measured number,
   or an explicit "this is feel, Igor's call".
6. Only then continue.

A stage is not finished while the next one has already started.

## Rules for every stage's DoD

Every stage exits on all four:

- **A check that fails without the work.** Verified by breaking the rule it
  guards. A check that can only pass proves nothing.
- **A measured number**, not an impression.
- **Docs updated in the same step** — `changelog.md`, `decisions.md` for
  anything decided, `design.md` for anything whose behaviour changed, and
  whatever this stage made false.
- **Playable.** Every stage ends with something that can be launched and
  played. No stage delivers only infrastructure.

---

## S0 — Foundations & spike

**Entry:** the design draft exists and its load-bearing questions are answered.

**Work:** `foundations.md`, `plan.md`, D27–D37 written. Seeded RNG landed and
routed through every `Math.random()` in `game/`. Offscreen glow cache built and
measured. A throwaway spike driving the entity budget to failure. The
`SCENARIOS` table and `?dev=<name>` loader (D37 — Scenarios), which the bot and
Igor both drive. The test harness fixed and the stack installed (D39 — Test
stack): `check()` replaces `console.assert`, each check resets state, Vitest and
fast-check land as dev dependencies.

**Exit (DoD):**
- The entity budget is a measured fact, not the guess in `foundations.md`:
  N entities at 60fps, stated in `design.md`.
- The same seed replays the same dive, proven by a check.
- Glow via cached blit is measured against `shadowBlur` per frame; the number
  is recorded.
- At least two scenarios load and play in isolation, and the bot selects one by
  name — same mechanism, not a parallel harness (D37).
- The suite **reports pass/fail** and a deliberately broken check makes it say
  so — verified by breaking one (D39).
- The existing 79 checks pass under the new harness, in any order.
- At least one invariant runs as a property test over generated seeds.
- **Zero gameplay change.** The game plays exactly as it did.

**Why first:** the seeded RNG is what makes every later balance claim mean
something, and the glow measurement is what decides whether D30 holds.

## S1 — Combat core: manual fire and the batch gate

**Entry:** S0 exits.

**Work:** In the **existing fixed arena** — no scrolling yet, no camera, no
home. LMB fires. The spawn director is deleted and replaced by a batch queue
with a gate. The `// balance` block is re-derived from scratch (D28 — Manual
fire). The XP curve is deleted and rank becomes one per batch cleared; the mod
pool is **body and comfort only** (D34 — Mods), so mods and manual fire are not
being balanced against each other at the same time.

**Exit (DoD):**
- Three batches clear in sequence; the gate provably blocks progress while a
  batch is non-empty, and provably releases when it empties.
- Fixed timestep in place; a railgun-speed projectile cannot tunnel a thin
  enemy at any `dt` the frame cap allows.
- Bot reports time-to-clear per batch, paired across seeds.
- A mod is offered only at a gate, never mid-batch — checked, not assumed.
- Playable: you fight batches with a mouse and it is recognisably a game.

**The hard part:** this is the genre change. Everything about the prototype's
tuning is void here. Expect this stage to take longer than it looks.

## S2 — The dive: camera and descent

**Entry:** S1 exits.

**Work:** One layer scrolls. Camera follows the descent. Batches gate it
(D27): smooth between, locked during.

**Exit (DoD):**
- One layer traversable top to bottom, gated the whole way.
- Difficulty invariant to window size, **checked** at three window sizes (D29).
- Bot reports time to traverse one layer.
- Playable: you descend, you are stopped, you fight, you continue.

## S3 — One boss, one complete layer

**Entry:** S2 exits.

**Work:** A boss at the bottom with a telegraphed, readable pattern. 2–3
mini-bosses along the way. Layer completion.

**Exit (DoD):**
- The layer can be **finished**, not just survived. First stage that produces a
  game with an ending.
- The boss's tell is readable: a check on telegraph duration, and Igor's
  judgement on whether it reads.
- Bot reports win rate per seed at a stated gear level.
- Playable: a complete, winnable layer.

## S4 — Meta loop skeleton

**Entry:** S3 exits. (The attribute question that used to gate this stage was
answered by D36 — Attributes.)

**Work:** `home` screen. Currency drops. One piece of gear, buyable, with
tiers. One attribute, raisable by spending points. Persistence with a `version`
field, holding owned gear + tiers + points spent + **micro-task counters** from
its first version (D36). Layer select.

**Exit (DoD):**
- The loop closes: dive → earn → buy → dive again, **measurably** stronger.
- Survives a reload. A save written by the previous build still loads, or
  migrates, or is rejected loudly — never silently corrupts.
- Measured: currency earned per dive, and dives needed for the first purchase
  (target ≤ 3, per `foundations.md`).
- At least one micro-task pays an attribute point, and the counter survives a
  reload.
- Playable: the roguelite loop exists with one item in it.

**Note:** the `mod` pool stays entirely generic through here (D31). One
progression system is balanced at a time.

## S5 — Content to the DoD numbers

**Entry:** S4 exits. The data shapes for enemy, weapon, gear and mod are
settled and will not change.

**Work:** 5–7 enemy behaviours, 2–3 weapons, 2–3 gear items, 3–5 layers, 3–4
tiers each. Weapon-scoped mods arrive here if they arrive (D31).

**Exit (DoD):**
- The DoD counts from the draft are met.
- Adding the last enemy cost what adding the second did. If it did not, the
  data shape was wrong and that is the finding.
- Every enemy behaviour has a check on its state transitions.
- Playable: the alpha's content is in.

**This stage is repetition of a settled procedure**, which is where the
`abyss-content` project skill gets written — at the *start* of S5, not before,
because the shapes do not exist until S4 exits.

## S6 — Balance

**Entry:** S5 exits.

**Work:** Paired seeded bot runs per weapon, per layer, per gear level. Every
numeric pillar in `foundations.md` measured and met or revised.

**Exit (DoD):**
- No unbeatable batch. No batch cleared without moving.
- No weapon strictly dominates another in mid-to-late game — measured, per the
  draft's explicit requirement.
- Every provisional target in `foundations.md` is now a measured one.
- Playable: it is balanced, and the numbers say so.

## S7 — Alpha polish

**Entry:** S6 exits.

**Work:** Game feel. Sound. Assets **only if** the condition is hit —
indistinguishable enemies, indistinguishable layers, or visual clumsiness.

**Exit (DoD):** Igor says it is alpha. This is the one stage whose DoD is a
judgement, and that is correct.

---

## If scope has to be cut

From S5's counts and S7. Never from S0. S0–S4 is the critical path to a game
that exists; S5 is volume on top of it.
