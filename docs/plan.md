# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

**The pass before S6 (balance): from playing S5 (content).** S5 (content)
closed 2026-10-14 — Igor: "close s5" — and his notes from playing it opened
this pass the same day: "if no questions for me, start working". It holds
what S6 (balance) would otherwise tune twice — what changes the meaning of a
number before the numbers are tuned:

- Igor's notes from playing S5 (content) proposed for before S6 (balance)
  (`ideas.md` → Open — from playing S5 (content)). What challenges pay is
  settled: ladders (D109 (micro-tasks are ladders; steps cost more as they
  rise)), `specs/2026-10-15-micro-task-ladders-design.md`.
- **Movement with acceleration and a facing, and fish that bite** — Igor,
  2026-10-14: `specs/2026-10-14-movement-and-bites-design.md`.
- **The boss and the mini-boss made different** — Igor, 2026-10-14:
  "mini-boss and boss have one kind of behavior. we need to make them
  different. this would belong to a completed s5, naturally we have to do it
  outside of it, so plan that too." Built as D117 (the boss's fan).


Where it stands is `roadmap.md` → Next. **S6 — Balance** follows; its entry,
S5 exiting, is met, and it opens on Igor's word.

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
| S4 — Meta loop skeleton | 2026-09-30 | Two layers drawn from pools, the layer end and the win, every mod capped, `home` with the gun's tiers and dash reach, a challenge, the versioned save | D74–D79 |
| Before S5 — two requirements | 2026-10-13 | A doc for every kind of entity, held to the code; the weapon record; mods dropped by a glowing fish, the layer end's pick, boosts, rank retired | D80–D92 |
| S5 — Content to the DoD numbers | 2026-10-14 | The archer, the puffer and the eel; the Harpoon and the Knife, owned and carried; three pieces of equipment, Heart and Strength, swift and footwork; Barbs and three boosts; three layers with pools of their own — and, from playing it, the debug mode and New game | D93–D103 |

Their designs, where a stage had one, are in `specs/` — history; where one
disagrees with a decision, the decision wins.

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
the player)). **Grades** (D119 (grades)) are the system's too: each type at
each grade its own threat number, and the grade a fish arrives at the
system's choice — Igor, 2026-10-19: "you go further - more difficult enemies
appear. ofc, first time you meet for example extremely high-grade enemy cant
be on the first layer. this is about balancing the batches and waves.
remember, they are different but equally challenging at any given batch/wave
in the game".

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
UX fixing.
D35's `+N` popup over collected gems is feel, and waits here, unbuilt (D78
(gems are pulled to the player)).

**Exit (DoD):** Igor says it is alpha. This is the one stage whose DoD is a
judgement, and that is correct.

---

## If scope has to be cut

From S7. Never from S0. S0–S4 is the critical path to a game that exists; S5,
the volume on top of it, is in.
