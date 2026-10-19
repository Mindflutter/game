# Knockback — design

2026-10-19, in the pass before S6 (balance). Igor, after playing solid bodies
(D120 (bodies are solid)), first as a note: "we need to add a small bounce off
(for fish and for player both maybe?) for a hit to feel more naturally. like
visual representation of impact along with player blinking". Then, on what he
had seen: "i meant bump after bite" — and on the shot bump: "drawn bump stays
for s7, real knockback - design and implement now".

The bump he saw after a bite was solid bodies at work: a biter rests, swims
back into the diver, and a heavy one shoves it; a darter is too light to.
Nothing knocked anything.

## Taken as settled

- **Real knockback, now**: a hit moves what it hits, in the simulation, so it
  changes the fight. Igor's word.
- **The drawn bump stays in S7 (alpha polish)** — a jolt that settles back,
  over the top of this (`plan.md`).
- **For the diver, a lean** — "both maybe?" — and "bump after bite" names the
  diver's case. Built, and left open to his word after playing.

## The design

**Every hit carries a `knock`** — the shape, settled now; the numbers are
S6 (balance)'s.

- **The diver's hits knock fish.** Each weapon has a `knock`, onto the player
  with its other numbers. A shot knocks each fish it hits along its travel; a
  swing, each fish it cuts along the swing. The knock goes into the fish's
  `push`, the velocity the dash's shove already uses, decaying by `PUSH_DRAG`,
  and **adds**, so a stream of shots stacks.
- **By area, as bodies are** (D120 (bodies are solid)): `knock` is the speed
  it gives a body the diver's size; a fish of radius `r` gets
  `knock × (diver r / r)²`. A darter flies, a bulwark rocks, the boss barely
  moves. **A lunger out of its chase is not knocked**: its lane is its tell
  (D64 (the boss lunges)) — the same weight that bodies use.
- **Fish's hits knock the diver.** Every attack record has a `knock`: the
  bite, the spit, the burst, the charge, the fan — and the eel's touch, which
  becomes a record, `{ damage, knock }`, like every other attack. The knock
  adds to the diver's swim velocity, away from the fish or along the shot, and
  the swim's own ramp (D107 (the diver swims and faces)) eases it off. No new
  field on the diver, and the edge and the bodies stop it as they stop a swim.
- **A hit that does not land does not knock**: i-frames, the dash's grace.
  **The guard takes the knock too** — it takes a hit whole (D118 (hits vary in
  damage)). **Immortal is knocked** — the hit lands and shows (D121 (only a hit
  blinks; a hurt fish carries a bar)).
- **The readout** gains `knock` among the player's numbers.

**Numbers, Claude's picks**, sized against the fish's speeds so firing slows a
crowd and never holds it:

| hit | knock (px/s) | moves |
|---|---|---|
| Gun | 60 | a puffer 13px a shot, a bulwark 5px |
| Harpoon | 200 | a puffer 42px, a bulwark 18px |
| Knife | 40 | a bulwark 4px — a melee weapon pushing out of its own reach is a weaker one |
| drifter's bite | 240 | the diver 20px |
| darter's bite | 180 | 15px |
| bulwark's bite | 420 | 35px |
| spit, fan shot | 150 | 12px |
| puffer's burst | 480 | 40px |
| charge (mini-boss, boss) | 600 | 50px |
| eel's touch | 240 | 20px, off the eel |

A fish's push decays to `PUSH_DRAG` (2%) in a second, so it travels about a
quarter of its knock in px; the diver's eases with its 0.25s ramp, about a
twelfth.

## Checked against foundations.md

- **Nothing trivial — no batch cleared without moving**: the risk. A knock
  strong enough, at a fire rate high enough, holds a crowd off a diver who
  stands still. At these numbers the Gun firing without pause slows a puffer
  by a third and a bulwark by a quarter, and every drifter and darter dies to
  its first shot unknocked. S6 (balance) measures it with the rest.
- **Funny, childish, straightforward**: one sentence — a hit pushes what it
  hits.
- **Content is data**: a field on each record; a new weapon or attack names
  its knock and nothing else changes.
- **Fixed timestep, seeded RNG, the seam**: no randomness, no browser API.
- **Saves carry a version**: v10 — a saved fish's attacks knock as its type's
  do now, an eel's touch becomes its record, a shot in flight knocks nothing,
  the diver takes its weapon's knock.

## Checked against plan.md

The pass holds "what changes the meaning of a number before the numbers are
tuned"; real knockback does — crowd pressure, kiting, what each weapon is
worth. The drawn bump stays where Igor put it, in S7 (alpha polish).

## Failure cases, each pinned by a check

- A shot knocks a fish along its travel, a lighter one further; a piercing
  shot each fish it passes.
- A lunger winding up is not knocked off its lane.
- A swing knocks each fish it cuts.
- A bite knocks the diver away from the biter — a darter's too; an enemy shot
  along its travel; a charge, a burst, an eel's touch away from the fish.
- No knock through i-frames or the dash's grace; none when the guard takes
  the hit; a knock on an immortal diver.
- A diver knocked at an edge stays in view.
- Every attack and every weapon has a whole knock of at least 0.
- A v9 save loads: its fish knock as their type's, its eel's touch a record,
  its shots in flight knock nothing, its diver its weapon's knock.
- The entity docs list every knock.
