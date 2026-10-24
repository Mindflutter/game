# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

**S6 — Balance**, opened 2026-10-21 — Igor: "start s6, no interruptions
unless critical questions to me". Its design is
`specs/2026-10-21-s6-balance-design.md`. The dash is held still while it runs
— Igor, the same day: "leave dash for now, discussions needed". Built: D126
(threat) to D130 (fish are revealed a type at a time), every exit item met on
the diver bot's figures; D137 (batches grow from seconds to a minute and a
half) reshaped the dive on his first play of it. It closes on Igor's word —
how strict the bars are, `footwork`, and his play.
Where it stands is `roadmap.md` → Next.

## Closed stages

What each delivered, in one line. How each was closed — its definition of
done, met, and Igor's word on it — is `changelog.md` on the closing date, up
to 2026-10-22, when it was frozen, and the decision closing it after; the
decisions listed say why.

| Stage | Closed | Delivered | Decisions |
|---|---|---|---|
| S0 — Foundations & spike | 2026-09-27 | These docs, the check harness, seeded RNG, scenarios, the object budget measured, the Node test stack | D27–D44 |
| S1 — Combat core | 2026-09-28 | Manual fire, the batch queue and gate, one rank per batch with mods at the gate, the swept and bought dash, the fixed timestep | D45–D57 |
| S2 — The dive: camera and descent | 2026-09-28 | A layer that scrolls under a camera, a current between gate depths that never stops | D58–D61 |
| S3 — One boss, one complete layer | 2026-09-29 | The boss as the layer's last batch, two mini-bosses, the lunge — a layer that can be finished | D62–D65 |
| The layer-to-layer design pass | 2026-09-30 | How a dive runs on through the layers — decided, checked against `foundations.md`, planned | D66–D73 |
| S4 — Meta loop skeleton | 2026-09-30 | Two layers drawn from pools, the layer end and the win, every mod capped, `home` with the gun's tiers and dash reach, a challenge, the versioned save | D74–D79 |
| Before S5 — two requirements | 2026-10-13 | A doc for every kind of entity, held to the code; the weapon record; mods dropped by a glowing fish, the layer end's pick, boosts, rank retired | D80–D92 |
| S5 — Content to the DoD numbers | 2026-10-14 | The archer, the puffer and the eel; the Harpoon and the Knife, owned and carried; three pieces of equipment, Heart and Strength, swift and footwork; Barbs and three boosts; three layers with pools of their own — and, from playing it, the debug mode and New game | D93–D103 |
| The pass before S6 — from playing S5 | 2026-10-21 | Bodies doubled, the Knife's swing, the puffer's burst, swimming with a facing, fish that bite, challenges as ladders, waves, escorts, the boss's fan, hits that vary, grades, solid bodies, knockback, boosts that keep each weapon's nature | D104–D125 |

Their designs, where a stage had one, are kept in git, not the tree (D134
(lean docs)): `git show 99d79ae:docs/specs/<file>` reads one. Where one disagrees with a decision,
the decision wins.

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
- No unbeatable batch. No batch past the opening cleared without moving
  (D130 (fish are revealed a type at a time)).
- No weapon strictly dominates another in mid-to-late game — measured, per the
  draft's explicit requirement.
- Every provisional target in `foundations.md` is now a measured one.
- Playable: it is balanced, and the numbers say so.

## S7 — Alpha polish

**Entry:** S6 exits.

**Work:** Game feel — among it a fish bumped by the shot that hits it (Igor,
2026-10-19: "shooting causes bump - actually a good idea, put in the plan";
`ideas.md` → Feel). Sound. Assets **only if** the condition is hit —
indistinguishable enemies, indistinguishable layers, or visual clumsiness.
UX fixing — `ideas.md` → Screens, among it what a tier does for the player
(Igor, 2026-10-19).
D35's `+N` popup over collected gems is feel, and waits here, unbuilt (D78
(gems are pulled to the player)).

**Exit (DoD):** Igor says it is alpha. This is the one stage whose DoD is a
judgement, and that is correct.

---

## If scope has to be cut

From S7. Never from S0. S0–S4 is the critical path to a game that exists; S5,
the volume on top of it, is in.
