# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

None. S8 (the economy: gems and points) closed 2026-10-26 (D153 (the economy stage closes));
the next stage waits on Igor's choice. Where things stand is `roadmap.md` →
Next.

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
| S6 — Balance | 2026-10-24 | The threat system and the grades it chooses, the diver bot and the balance suite, the numbers tuned to the pillars and the bars that hold them, fish revealed a type at a time, ten gates a layer with batches growing from seconds to a minute and a half, cheaper gear | D126–D139 |
| S7 — Alpha polish | 2026-10-26 | The alpha, on Igor's word: the drawn bump, the bite's leap, Bloom's ring, the `+N` flown to the counter, every row at home saying what it does, a sound for every moment, Go home from the pause menu, the catalogue, the kit on `home`, the readout only in the debug mode | D140–D150 |
| S8 — The economy: gems and points | 2026-10-26 | Nine rungs a ladder of a point each, `bowling` for `footwork`, attributes with a top, cheap first tiers and dear tops, the career bot measuring it; the balance verdict waits on more play | D151–D153 |

Their designs, where a stage had one, are kept in git, not the tree (D134
(lean docs)): `git show 99d79ae:docs/specs/<file>` reads one, and S6
(balance)'s is `git show 11ba1ad:docs/specs/2026-10-21-s6-balance-design.md`, S7 (alpha
polish)'s `git show 6661b7c:docs/specs/2026-10-24-s7-alpha-polish-design.md`. Where one disagrees with a decision,
the decision wins.

## If scope has to be cut

From S7. Never from S0. S0–S4 is the critical path to a game that exists; S5,
the volume on top of it, is in.
