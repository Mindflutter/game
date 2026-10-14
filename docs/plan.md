# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

**S5 — Content to the DoD numbers**, opened 2026-10-13: Igor, with both
requirements before it built, "all ready, start working". Its first step is the
`abyss-content` project skill, which every addition then follows; the next
steps inside the stage are `roadmap.md` → Next.

## Closed stages

What each delivered, in one line. How each was closed — its definition of
done, met, and Igor's word on it — is `changelog.md` on the closing date, and
the decisions listed say why.

| Stage | Closed | Delivered | Decisions |
|---|---|---|---|
| S0 — Foundations & spike | 2026-09-27 | These docs, the check harness, seeded RNG, scenarios, the entity budget measured, the Node test stack | D27–D44 |
| S1 — Combat core | 2026-09-28 | Manual fire, the batch queue and gate, one rank per batch with mods at the gate, the swept and bought dash, the fixed timestep | D45–D57 |
| S2 — The dive: camera and descent | 2026-09-28 | A layer that scrolls under a camera, a current between gate depths that never stops | D58–D61 |
| S3 — One boss, one complete layer | 2026-09-29 | The boss as the layer's last batch, two mini-bosses, the lunge — a layer that can be finished | D62–D65 |
| The layer-to-layer design pass | 2026-09-30 | How a dive runs on through the layers — decided, checked against `foundations.md`, planned | D66–D73 |
| S4 — Meta loop skeleton | 2026-09-30 | Two layers drawn from pools, the layer end and the win, every mod capped, `home` with the gun's tiers and dash reach, a micro-task, the versioned save | D74–D79 |
| Before S5 — two requirements | 2026-10-13 | A doc for every kind of entity, held to the code; the weapon record; mods dropped by a glowing fish, the layer end's pick, boosts, rank retired | D80–D92 |

Their designs, where a stage had one, are in `specs/` — history; where one
disagrees with a decision, the decision wins.

## S5 — Content to the DoD numbers

**Entry:** S4 exits, and both requirements before S5 are done (D80). Met
2026-10-13. The data shapes for enemy, weapon, gear and mod are settled and
will not change.

**Work:** 5–7 enemy behaviours, 2–3 weapons, 2–3 pieces of equipment, 3–5 layers —
each with its own pools of batches (D71) — and 3–4 tiers each. Mods, boosts,
micro-tasks and attributes are designed and added to counts of their own (D93
(the content stage's counts)): 5–7 mods in total (six exist today), 3–5 new
boosts beside `Rush`, and three micro-tasks and three attributes in total (one
of each exists today).
Weapon-scoped mods arrive here if they arrive (D31). The second weapon brings
owning one and choosing which to carry at `home`, and a scenario that names
the weapon carried, so S6 (balance) can measure each (D83).

**Exit (DoD):**
- The DoD counts from the draft are met, and Igor's own (D93 (the content
  stage's counts)): 5–7 mods, 4–6 boosts with `Rush`, three micro-tasks, three
  attributes.
- Adding the last enemy cost what adding the second did. If it did not, the
  data shape was wrong and that is the finding.
- Every enemy behaviour has a check on its state transitions.
- No layer is a fixed list (D71).
- Playable: the alpha's content is in.

**This stage is repetition of a settled procedure**, which is where the
`abyss-content` project skill gets written — at the *start* of S5, not before,
because the shapes do not exist until S4 exits.

## S6 — Balance

**Entry:** S5 exits.

**Work:** Paired seeded bot dives per weapon, per layer, per gear level. Every
numeric pillar in `foundations.md` measured and met or revised. **The threat
system for enemies** — Igor, 2026-09-30: "develop a complex mathematical system
for enemies that impact the game and player feel … is it part of balance? yes"
— in the direction he chose: a threat number per enemy type, a batch's threat
computed from its enemies, measurement correcting the numbers, and threat
rising overall and gradually through a dive (D79 (a dive goes from easiest to
hardest)); it replaces the hp bands D71 (batches are drawn from pools) sized
stretches by. Every batch measured against its stretch, and each layer against
the kit expected there — the mods from the layers above included (D66). Which
enemies drop gems, and how many, is a lever here too (D78 (gems are pulled to
the player)).

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
UX fixing, the first item Igor's, 2026-10-12: "no new game, just continue -
leave that for ux fixing, pick a later stage that fits most" — with a dive
saved, the title offers only Continue, and a New game beside it would abandon
that dive (D90 (Continue goes straight back in)).
D35's `+N` popup over collected gems is feel, and waits here, unbuilt (D78
(gems are pulled to the player)).

**Exit (DoD):** Igor says it is alpha. This is the one stage whose DoD is a
judgement, and that is correct.

---

## If scope has to be cut

From S5's counts and S7. Never from S0. S0–S4 is the critical path to a game
that exists; S5 is volume on top of it.
