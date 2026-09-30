# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

**None. The layer-to-layer design pass closed 2026-09-30** — Igor: "layer
end is ok, wrap up and commit". S4 — Meta loop skeleton is next, and its entry
is met; it opens with its own questions (`ideas.md`: can one stat be raised by
both a mod and gear, and are dash improvements gear or mods) and a
task-by-task plan, as S3 did.

### The layer-to-layer design pass · closed 2026-09-30

Decided: the dive runs on through the layers and death restarts it from the
top (D66), currency is kept on death (D67), the layer end is a milestone and
clearing the last layer wins the game (D68), every mod is capped across a dive
(D69), a dive can be saved at any point (D70), batches are drawn from pools
(D71), between layers there is no screen (D72), and "layer end" is the term
(D73). The design and its check against `foundations.md`:
`superpowers/specs/2026-09-30-layer-to-layer-design.md` — history now. The
ready plan is S4, S5 and S6 below, re-planned from it.

### S3 — One boss, one complete layer · closed 2026-09-29

Done in S3: the boss is the layer's last batch (D62) and lunges (D64); a
mini-boss is a smaller boss (D65); the win rate is the boss fight's (D63).
Plan, with the design at its head: `superpowers/plans/2026-09-29-s3-boss.md` —
history now.

**Closed 2026-09-29 by Igor: "wrap up s3"**, having played it: "right now it's
very easy for me. but: i suggest we leave all balance fine-tuning for later.
let's just focus on what the stage DoD says."

Carried out of S3, none of it blocking: balance (S6 — Balance), the kiting bot
that backs out of its own range, normal enemies alongside the boss and more
boss attacks (all three in `ideas.md`), and every number of the lunge —
Claude's picks.

### S2 — The dive: camera and descent · closed 2026-09-28

Done in S2: the descent — a current between gate depths that never stops and
is independent of the player (D58); no rank and no mods at the layer end,
which is not a gate (D59); the layer-to-layer logic given a design pass of its
own after S3 (D60); and "dive", not "run" (D61). Design:
`superpowers/specs/2026-09-28-s2-descent-design.md`; plan:
`superpowers/plans/2026-09-28-s2-descent.md` — both history now; where they
disagree with D58, D58 wins.

**Closed 2026-09-28 by Igor: "commit and finalize s2".** The checks closed
three exit conditions; the fourth, playable, was Igor's call.

Carried out of S2, none of it blocking: the gems lost to the descent (S4 —
Meta loop skeleton, with D35), the layer end and everything between layers
(the design pass after S3), a lively background (post-alpha, in `ideas.md`),
and the four current numbers — Claude's picks, still open to Igor's feel.

### S1 — Combat core · closed 2026-09-28

Done in S1: the weapon is manual (D45), the batch queue and gate (D48), one
rank per batch with mods at the gate (D49), the dash sweeps its path (D50), the
dash is bought (D51), the development readout (D52), the fixed timestep with
swept bullets (D53), and the batches re-derived (D54).

**Closed 2026-09-28 by Igor: "close s1, s2 coming in a different session".**
Every DoD bullet was met and Igor confirmed the fight (2026-09-27, on D54's
batches: "the fight feel better now") — the one thing the bot could not judge.

Carried out of S1, none of it blocking: the dash economy rebalance (S6 —
Balance owns it), the `home`-vs-`mod` tier question for dash upgrades (S4 —
Meta loop skeleton), Igor's fish-from-behind-the-screen arrival idea, and the
gate beat running 1.8s rather than 1.2s — Igor, asked, said leave it.

### S0 — Foundations & spike · closed 2026-09-27

Delivered: docs (`foundations.md`, `plan.md`, D27–D44), the check harness
(D39), `docs/` tracked in git (D40), seeded RNG + `serve.py` (D41), scenarios +
stepped mode (D42), measured performance which cancelled the glow cache (D43),
and the Node test stack with six property-based invariants (D44).
Done also: the entity-budget spike, which **cancelled** the glow cache (D43),
and the Node test stack with six property-based invariants (D44).
**Every S0 exit condition is met.** Next session opens S1 — Combat core, which
is where the genre actually changes: manual LMB fire, the batch queue and gate,
and the `// balance` block re-derived from scratch.
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
  done 2026-09-27, D43 — under 1ms per frame at 500 entities, ~4000 of headroom.
- The same seed replays the same dive, proven by a check.
- Glow via cached blit is measured against `shadowBlur` per frame; the number
  is recorded. **Done, and the answer was to cancel the cache** (D43).
- At least two scenarios load and play in isolation, and the bot selects one by
  name — same mechanism, not a parallel harness (D37).
- The suite **reports pass/fail** and a deliberately broken check makes it say
  so — verified by breaking one (D39).
- The existing 79 checks pass under the new harness, in any order.
- At least one invariant runs as a property test over generated seeds. **Done:
  six** (D44), each verified by breaking it.
- **Zero gameplay change.** The game plays exactly as it did.

**Why first:** the seeded RNG is what makes every later balance claim mean
something, and the glow measurement is what decides whether D30 holds.

## S1 — Combat core: manual fire and the batch gate · closed 2026-09-28

**Entry:** S0 exits.

**Work:** In the **existing fixed arena** — no scrolling yet, no camera, no
home. LMB fires. The spawn director is deleted and replaced by a batch queue
with a gate. The `// balance` block is re-derived from scratch (D28 — Manual
fire). The XP curve is deleted and rank becomes one per batch cleared; the mod
pool is **body and comfort only** (D34 — Mods), so mods and manual fire are not
being balanced against each other at the same time.

**Exit (DoD):**
- ~~Three batches clear in sequence; the gate provably blocks progress while a
  batch is non-empty, and provably releases when it empties.~~ Done, D48.
- ~~Fixed timestep in place; a railgun-speed projectile cannot tunnel a thin
  enemy at any `dt` the frame cap allows.~~ Done, D53 — and the tunneling half
  needed swept collision, not just a bounded `dt`.
- ~~Bot reports time-to-clear per batch, paired across seeds.~~ Done, D49 — the
  bot takes a mod now, so it no longer stalls at the offer. The numbers are in
  `roadmap.md` → Health, and they are what says the balance block is next.
- ~~A mod is offered only at a gate, never mid-batch — checked, not assumed.~~
  Done, D49, and verified by ranking up per kill instead: 5 failures.
- ~~Playable: you fight batches with a mouse and it is recognisably a game.~~
  Igor has been playing it since D49.
- ~~**Igor confirms the fight.**~~ Done, 2026-09-27: "the fight feel better
  now", on D54's batches.

**The hard part:** this is the genre change. Everything about the prototype's
tuning is void here. Expect this stage to take longer than it looks.

## S2 — The dive: camera and descent · closed 2026-09-28

**Entry:** S1 exits.

**Work:** One layer scrolls. Camera follows the descent. Batches gate it
(D27): smooth between, locked during. Built as D58 (the descent): a current
between gate depths that never stops and is independent of the player. The
layer ends on a "LAYER CLEARED" screen that is **a stop, not a win** — no reward, no unlock — so S3
below is still the first stage with an ending.

**Exit (DoD):**
- ~~One layer traversable top to bottom, gated the whole way.~~ Done, D58.
- ~~Difficulty invariant to window size, **checked** at three window sizes
  (D29).~~ Done, D58 — a `?test` check plays one seed at all three sizes.
- ~~Bot reports time to traverse one layer.~~ Done, with an immortal bot — the
  mortal one dies before the bottom. Figures in `roadmap.md` → Health.
- ~~Playable: you descend, you are stopped, you fight, you continue.~~ Igor's
  call, made 2026-09-28: "commit and finalize s2".

## S3 — One boss, one complete layer · closed 2026-09-29

**Entry:** S2 exits. Met 2026-09-28.

**Work:** A boss at the bottom with a telegraphed, readable pattern. 2–3
mini-bosses along the way. Layer completion. Built as D62–D65: two mini-bosses
and the boss, each alone in its batch, all lunging.

**Exit (DoD):**
- ~~The layer can be **finished**, not just survived. First stage that produces
  a game with an ending.~~ Built, D62: killing the boss is the layer end, and
  "LAYER CLEARED" the ending.
- ~~The boss's tell is readable: a check on telegraph duration, and Igor's
  judgement on whether it reads.~~ The check is D64's; Igor played it and
  closed the stage.
- ~~Bot reports win rate per seed at a stated gear level. Measured on the boss
  fight, from the `last-batch` scenario, at the starting kit — plus how far the
  bot gets from the top — per D63 (the win rate is the boss fight's).~~ Done;
  figures in `roadmap.md` → Health.
- ~~Playable: a complete, winnable layer.~~ Igor, having played it: "right now
  it's very easy for me".

## Design pass — layer to layer · after S3

Not a numbered stage: it sits between S3 and S4 without renumbering, so no
stage citation changes (D60).

**Entry:** S3 exits — the first layer with an ending exists, so there is
something to go on from. Met 2026-09-29.

**Claude opens it.** When S3 closes, Claude reminds Igor to start this
conversation, before anything of S4 begins. Igor, 2026-09-28: "remind me to
open a conversation about it after s3 / before s4". Opened 2026-09-29,
closed 2026-09-30: D66–D73 decided, the design checked in
`superpowers/specs/2026-09-30-layer-to-layer-design.md`, and S4, S5 and S6
below re-planned from it.

**Work:** the layer-to-layer logic, in detail. Igor, 2026-09-28: "we must work
thru layer-to-layer logic in detail out of s2", then "a design pass of its own
after S3". The questions wait in `ideas.md`: what happens at the layer end —
its term, what the player sees and does, where mods come from when the player
goes on (D59 settles only that it pays no rank and offers no mods otherwise);
what follows a layer — home, the next layer, or a choice (Igor inclines to
choose); and how the transition itself plays.

**Exit:** Igor, 2026-09-28: "decision, checks against foundations, ready
plan" —
- the answers recorded as decisions in `decisions.md`;
- the design checked against `foundations.md`, every friction point resolved or
  given an owner;
- a ready plan.

## S4 — Meta loop skeleton

**Entry:** S3 exits **and** the layer-to-layer design pass above is done
(D60) — S4 builds `home` and the first save format, which that pass's
answers shape. **Met 2026-09-30.** (The attribute question that used to gate this stage was
answered by D36 — Attributes.)

**Work**, in this order — the dive's loop first, because `home` shows what it
produces:
1. **The dive through the layers.** A layer becomes a record of stretches with
   pools of batches, drawn per dive from its seed (D71). A second layer — the
   first one's content under its own colour, a placeholder until S5 — so a
   dive can go on (D66). The layer end as a milestone: a gate's rank and mods,
   a full heal, the boss's haul of gems (D68); no screen between layers, and
   the win screen at the last layer's end (D72). Every mod capped, and gems
   and a heart fill an offer the pool cannot (D69). Scenarios that start at a
   layer with a stated kit, for the bot.
2. **The meta loop.** `home` screen: shop, the layers unlocked and the depth
   reached, launch — no layer select, every dive starts at the top (D66).
   Currency drops, auto-collected (D35) and kept on death (D67). One piece of
   gear, buyable, with tiers. One attribute, raisable by spending points.
   Persistence with a `version` field, holding owned gear + tiers + points
   spent + **micro-task counters** (D36) and the dive in progress, resumable at
   any point (D70) — all from its first version.

**Exit (DoD):**
- A dive goes on from the first layer into the second with rank and mods
  intact; the layer end heals and pays; death returns you `home` with your
  gems; clearing the last layer shows the win.
- Two seeds draw different batches, and one seed the same ones (D71).
- No mod passes its cap, and an offer holds three cards while any mod is under
  its cap (D69).
- A dive saved and restored at a random tick plays on identically (D70).
- The loop closes: dive → earn → buy → dive again, **measurably** stronger.
- Survives a reload. A save written by the previous build still loads, or
  migrates, or is rejected loudly — never silently corrupts.
- Measured: currency earned per dive, and dives needed for the first purchase
  (target ≤ 3, per `foundations.md`).
- At least one micro-task pays an attribute point, and the counter survives a
  reload.
- Playable: the roguelite loop exists with one item in it, across two
  layers.

**Note:** the `mod` pool stays entirely generic through here (D31). One
progression system is balanced at a time.

## S5 — Content to the DoD numbers

**Entry:** S4 exits. The data shapes for enemy, weapon, gear and mod are
settled and will not change.

**Work:** 5–7 enemy behaviours, 2–3 weapons, 2–3 gear items, 3–5 layers —
each with its own pools of batches (D71) — and 3–4 tiers each. Weapon-scoped
mods arrive here if they arrive (D31). The mod pool grows until its caps cover
a full dive (D69).

**Exit (DoD):**
- The DoD counts from the draft are met.
- Adding the last enemy cost what adding the second did. If it did not, the
  data shape was wrong and that is the finding.
- Every enemy behaviour has a check on its state transitions.
- No layer is a fixed list (D71), and the mod pool covers a full dive — its
  check passes (D69).
- Playable: the alpha's content is in.

**This stage is repetition of a settled procedure**, which is where the
`abyss-content` project skill gets written — at the *start* of S5, not before,
because the shapes do not exist until S4 exits.

## S6 — Balance

**Entry:** S5 exits.

**Work:** Paired seeded bot dives per weapon, per layer, per gear level. Every
numeric pillar in `foundations.md` measured and met or revised. Every batch
measured against its stretch's band (D71), and each layer against the kit
expected there — the mods from the layers above included (D66).

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
