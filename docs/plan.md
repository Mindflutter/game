# Plan

The stages, their entry and exit conditions, and which one is active. This is
the only doc that says **"we are here"**.

Read `foundations.md` first. This file says what to do next; that one says what
must stay true while doing it.

---

## Active stage

S8 (the economy: gems and points), opened 2026-10-26 on Igor's word: "close
s7, check plan and ideas, decompose into tasks, start working on what can be
done". S7 (alpha polish) closed the same day (D150 (S7 closes)). Its design
is `specs/2026-10-26-s8-economy-design.md`.
Where things stand is `roadmap.md` → Next.

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

Their designs, where a stage had one, are kept in git, not the tree (D134
(lean docs)): `git show 99d79ae:docs/specs/<file>` reads one, and S6
(balance)'s is `git show 11ba1ad:docs/specs/2026-10-21-s6-balance-design.md`, S7 (alpha
polish)'s `git show 6661b7c:docs/specs/2026-10-24-s7-alpha-polish-design.md`. Where one disagrees with a decision,
the decision wins.

## S8 — The economy: gems and points

**Entry:** S7 exits.

**Work:** From Igor's play of the alpha, 2026-10-26: "point upgrades come
easy, at first run i earned 12 points, reached mid layer 2. i couldnt get
enough gems for any purchase, except a gun upgrade. gotta do something with
upgrade system. really major issue. maybe even rework the whole gem&points
system, very imbalanced. footwork still makes no sense" (`ideas.md` → Open —
from playing alpha). In order:

1. **Done. The economy measured as it stands** — what a fresh save earns, gems and
   points, dive by dive and gate by gate, against every price and step: the
   figures any rework is judged by. Claude's; needs no decision.
2. **Done, D152 (nine rungs a ladder, a point a rung). The shape, with
   Igor** — retune or rework: how gems and points are each
   earned and what each buys; `footwork` reworked or dropped; the challenge
   rungs on ten-gate layers (`ideas.md` → Open — from S6 (balance)). Igor's
   decisions, one question at a time.
3. **Built, D152. The spec**, checked against `foundations.md`, then built and
   tuned, the careers measuring it. Left: Igor's play of a fresh save.

Beside it, small: the bulwark's bite as quick as the other fish's, built
(D151 (the bulwark bites as quick as the drifter)). The figures, before and
after, are `roadmap.md` → Health.

**Exit (DoD):** Igor plays a fresh save and says gems and points are in
balance, and the career bot's figures agree.

---

## If scope has to be cut

From S7. Never from S0. S0–S4 is the critical path to a game that exists; S5,
the volume on top of it, is in.
