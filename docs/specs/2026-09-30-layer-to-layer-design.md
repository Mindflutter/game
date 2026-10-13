# The layer-to-layer pass · design

**Closed 2026-09-30** — Igor: "wrap up and commit".

Decided with Igor, 2026-09-29 and 2026-09-30, in the design pass D60
(layer-to-layer logic gets a design pass of its own) set between S3 and S4.
The decisions are D66–D72 in `decisions.md`; where this file and they disagree,
they win. This file ties them together and holds the check against
`foundations.md` that the pass's exit asks for. Once built, what it describes
moves into `design.md` and this file is history.

## The loop, in one paragraph

Every dive starts at the top of the first layer. You fight down it batch by
batch, each clear paying a rank and a pick of three mods. A layer's boss is a
milestone: a gate's rank and mods, a full heal and a big haul of gems — and
the current carries you straight on into the next layer, with no screen
between. Rank and mods carry all the way down. Death sends you `home` with
every gem you collected; clearing the last layer wins the game. At `home` you
spend, see the layers you have unlocked and how deep you got, and dive again
from the top. A dive can be put down at any moment and picked up exactly there.

## Decided by Igor

- **D66 (the dive runs on through the layers).** "let's make it a proper
  roguelite for alpha. yes, you go on. yes, death sends you to the start.
  unlocking layers + what depth you reached is visualised on home screen. ranks
  go all the way through the dive, the dive definition doesnt change." No layer
  select; the vessel is parked in `ideas.md`.
- **D67 (currency is kept on death).** "of course you keep currency."
- **D68 (the layer end is a milestone).** "bigger than defeating a batch";
  the full heal and the boss's haul of gems — "agreed"; "you clear the last
  layer - you won the game".
- **D70 (a dive can be saved at any point).** "ideally, you could save at any
  point. if difficult, leave for later" — not difficult here, so now.

## Claude's calls, delegated

- **D69 (mods across a whole dive)** — "you decide, my requirement is make it
  consistent and diverse, generic baseline": one rank per batch still, every
  mod capped (1 or 3), gems then a heart fill an offer the pool cannot, the
  pool grows to cover a full dive.
- **D71 (batches are drawn from pools)** — "fill the gaps", under a
  requirement settled from the start: hand-made batches of comparable threat
  (hp, as D54 sized them) in pools per stretch of a layer, drawn from the
  dive's seed; the mini-bosses and the boss keep fixed places.
- **D72 (between layers there is no screen)** — "fill the gaps": the layer end
  plays over moving water, the mod pick its one pause; the abyss is one tall
  strip, so depth adds up; "LAYER CLEARED" becomes the win screen; after a win,
  diving again works as always.
- **Inside D70**: a resumed dive opens on the pause screen, and the dive is
  written when the game pauses and when the page is hidden or closed.

## Checked against `foundations.md`, `plan.md` and the source design

**Glossary.** The dive, rank, mod, home and layer end rows were edited in the
same step as D66, D68, D69 and D72. The rest hold: a **layer** still unlocks by
completing the one before it — the dive reaches it that way, and unlocking now
reveals it at `home`; a **batch** is still enemies of comparable threat, and
D71 extends comparable threat to the batches a stretch can draw; an
**attribute** is still capped at the source, since passing a layer every dive
adds no tasks to it; gate, boss and mini-boss are unchanged.

**Genre contract.** Hard gates (3) are untouched. Mods at a gate *or a layer
end* (4, 5) — edited. "A dive contains fighting, descending, and one
one-second mod pick. Nothing else" (6) holds: the heal and the gems are handed
over, not chosen, there is no screen between layers (D72), and a resumed dive
opens on pause, outside play. Content is data (7): a layer is a record, its
pools lists of batch records (D71).

**Pillars.**
- *Dives are a session, not a sitting* — the one real friction: a dive now
  runs until death, 12–40 min at alpha. Resolved by D70: it can be put down
  anywhere. The name and the 4–8 min per layer target stand.
- *Dives differ* — unmet today, every dive drawing the same fifteen batches.
  D71 is its mechanism, due by alpha.
- *Easy layers stay relevant* — every dive passes through them (D66).
- *Addictive, not grindy* — D67 keeps every dive paying; S4 (meta loop
  skeleton) measures the dives to a first purchase against ≤ 3.
- *Nothing unbeatable at the gear level expected when first met* — the kit
  expected at a deep layer now includes the mods from the layers above. S6
  (balance) states that kit per layer and measures against it.
- *Relaxed only at home*, *fast-paced*, *responsive control* — untouched.
- *One sentence per mechanic* — "you dive until you die or win, and your gems
  are yours" holds.

**Technical contract.** Every batch draw comes from the dive's seed (D71's
check). Saves carry `version` from the first write and, from their first
version, the dive in progress (D70) — added to the contract. The seam grows
with S4's save, deliberately, and `design.md` lists the names when they land.
Window-size invariance is untouched. `home`'s layer display is canvas, like
every screen.

**Non-goals.** No second money — the gem card pays the same money. No
storyline — the win screen needs none, and the lost item stays open. The
native port — the dive's snapshot lives in `game/`, so it ports.

**The source design.** "after a level is complete — main screen or next level
immediately or choose (?). inclined to choose" — answered: the next layer
(D66). "whether to choose a level on dive start or always start from the
beginning — i'd allow to choose" — superseded: always the beginning (D66).
"levels are hidden until unlocked" — holds, as display. "passing through
simpler levels fast ... may reward the player" — still open in `ideas.md`, and
easier now that every dive passes them.

**`plan.md`.** S4's entry — this pass done — is met on Igor's approval. S4
grows: it now carries the dive's loop across two layers as well as the meta
loop. S5 (content) carries the pools' content and a mod pool that covers a
full dive.

## Friction points, each with an owner

1. **S4 is now the largest stage.** Owner: its implementation plan, which
   builds the dive's loop first — `home` displays what that loop produces.
2. **Deep layers against stacked mods.** Owner: S6 (balance), which states the
   expected kit per layer.
3. **D69's pool-covers-a-dive check cannot pass on six mods.** Owner: S5
   (content), which grows the pool; until then the gems and the heart fill in.
4. **The bot measures one layer from a scenario** (D63 (the win rate is the
   boss fight's)). A dive across layers needs scenarios that start at a layer
   with a stated kit. Owner: S4, with the second layer.
5. **True today, stale once built**: the comment in `game/logic.js` that points
   at this pass; the help screen's "a rank and a pick of three mods, until the
   layer ends", which a second layer makes false (in-game text, so its new
   wording goes to Igor); and `roadmap.md`'s dash table rows at Fins ×10, which
   D69's cap rules out. Owner: the build that changes each.

## Left open, deliberately (in `ideas.md`)

The lost item; friendlier end-screen wording; what might follow a win after
alpha; the vessel; timed fast clears of the easy layers.
