# Movement and bites — design

2026-10-14, in the pass before S6 (balance). Two notes from Igor after playing
S5 (content):

> "we need to have acceleration in movements. right now there is none for
> player and enemies. player must definitely have it, fishes - at least some
> do need it. by acceleration i mean starting movement and reaching the full
> speed after a duration. reversing direction needs a slight amount of time.
> like natural in-water movement."

> "generally, the fish needs to bite. some might still damage on touch, but
> mostly - swim to you, swift bite animation, then damage. would feel way more
> natural. doesnt concern enemies with complex attacks that wouldnt kill on
> touch."

Then, on the dash from a standstill: "a player wont be a circle. it's a person
having a facing direction. it's rotation takes a little bit of time too (this
relates to acceleration as well). so that's you answer for dashing from a
stop." And on the fish: "go with your suggestion. for now, you design the
enemies anyway. remember the solid rule of diversity for all entities and make
your call here."

The shapes quoted are Igor's. Which fish does what, and every number, is
**Claude's call, delegated**, open to Igor to reopen. Once built this spec is
history; where it and a decision disagree, the decision wins.

## Taken as settled

- **The diver accelerates**: full speed after a moment, a reversal takes a
  little time, the feel of water. Igor.
- **Some fish accelerate too** — "at least some". Igor.
- **The diver has a facing that turns over a little time**, and a dash from a
  standstill goes along it. Igor.
- **The dash goes where you move**, at any angle rather than eight: Igor, of
  the open question in `ideas.md` → Should the dash go where you aim — "this
  solves" it. It closes.
- **Most fish bite**: they swim up, wind up where you can see it, then the
  damage lands. Some keep damage on touch. Igor.
- **A fish with an attack of its own stops hurting on touch** — the archer's
  spit, the puffer's burst, the lunge: that attack is its only damage. Claude's
  suggestion, taken by Igor.
- **Diversity**: "enemies are diverse not only in their type variety, but also
  in their behaviour" (`high level design.md`), as mods differ in kind, not
  degree (`foundations.md` → the genre contract, 5).
- **The boss and the mini-boss must differ** — Igor; an item of its own in the
  same pass (`plan.md`), not this spec.

## The design

### 1. Water: a velocity eased toward the one wanted

Today a body moves by `direction × speed × dt`: full speed at once, a turn on
the spot. Now it has a velocity, and each tick that velocity closes on the one
it wants — the held keys for the diver, the chase for a fish — by the same
share of the gap: `RAMP_LEFT`, 5% of a change, is still to go after `ramp`
seconds, worked out with `Math.pow` so it is the same at any tick length (the
code's convention, as `PUSH_DRAG` and `CURRENT_EASE`). That is drag in water: a
start eases up, a release glides to a stop, and a reversal swings through zero
in a fraction of `ramp`, reaching full speed the other way a little after it.
One helper, `ease()`, moves the diver and the fish.

- **The diver's `ramp` is 0.25s**, a field on `PLAYER_START` so a mod or an
  attribute can reach it later.
- **Movement still starts on the very next tick** — only full speed takes time
  — so "responsive control: input to on-screen response ≤ 2 frames" holds.
- **A view edge stops the velocity going into it**, so no speed banks up
  against it. No edge ever pushes the diver: the current carries it with the
  view.
- **A speed change moves the target, not the time**: with `Fins` or `Rush` the
  diver reaches its new top speed in the same `ramp`.

### 2. The diver faces, and the dash goes where it faces

- **`facing`**, an angle, turns toward the held direction the shorter way
  round, `turn` seconds for half a circle — 0.2s — and holds while nothing is
  held. A dive starts facing down, into the abyss.
- **The dash goes along the facing.** Swimming steadily, the facing is where
  you swim, so the dash goes at any angle — Igor's "more than 8"; from a
  standstill it is where you last faced — Igor's answer. Mid-turn it goes where
  the body points, not where the drift still carries: Claude's reading of
  "where you move", since a dash is a swimmer kicking off, and the keys turn
  the body before the water lets go of it.
- **The dash fires from a standstill**: the refusal without a key held goes.
- **A dash ends swimming along it at full swim speed**, so momentum carries out
  of it. The dash's own reach is unchanged (D56 (the dash is a fixed,
  committed lunge)).
- **Drawn**: a mark on the diver from its middle to its rim, where it faces —
  PLACEHOLDER GRAPHICS, the cheapest way to see where a standing dash will go.

### 3. Fish with a ramp

**`ramp` on a fish type** eases its chase as the diver's swim is eased; absent,
the fish turns on the spot as now. The plain chase and the bite (below) read
it. A behaviour that moves the fish its own way — the weave, the archer's band,
the fuse, the lunge — keeps its own movement.

### 4. Bites

**`bite: { reach, windup, rest }`** on a type: its presence is the behaviour,
one branch in `step()`, as with the lunge (D26 (disciplines installed)).

- The fish chases, with its `ramp`. Once its body is within `reach` px of the
  diver's, it stops — easing to a halt with its ramp, so a heavy fish slides —
  and opens its jaws for `windup` seconds: the tell.
- Then they snap shut: a heart, through `hurtPlayer()` like every hurt (D95
  (three enemy behaviours, and one way to be hurt)), **if the diver's body is
  still within `reach`**; nothing if not. Then `rest` seconds before it can bite
  again, chasing meanwhile.
- So the suit's guard, invulnerability after a hit, the dash's and `untouched`
  all treat a bite as they treat any hurt. A fish killed mid-wind-up never
  bites: a dead fish takes no step (D106 (the puffer bursts and comes on
  again)).
- **Drawn**: the jaws as a wedge cut out of the fish's circle, opening toward
  the diver through the wind-up and shut at the snap — PLACEHOLDER GRAPHICS.

### 5. Touch

**A fish hurts on touch only with `touch: true`.** The lunge's charge hurts on
contact inside the lunge's own step, so a lunger winding up or resting is safe
to touch. The archer, the puffer and every biter are harmless to touch.

### 6. The roster, diverse in kind

Each fish asks a different answer of the diver. Every number is Claude's pick,
S6 (balance)'s to tune.

| fish | moves | hurts by | the answer |
|---|---|---|---|
| drifter | ramp 0.6s: a loose turner | a bite — reach 10, wind-up 0.3s, rest 0.8s | back off when its jaws open |
| darter | ramp 0.9s at its high speed: it overshoots | a nip — reach 6, wind-up 0.15s, rest 0.6s | step out of its line; it slides past |
| bulwark | ramp 1.2s: heavy to start and to turn | a chomp — reach 40, wind-up 0.6s, rest 1.2s | stay out of its reach; circle it |
| eel | its sway, no ramp | touch: an electric body | never touch it; shoot it as it sways |
| archer | its band | its spit only | close in, or dodge the shots |
| puffer | its fuse | its burst only | leave the ring; kill it |
| mini-boss, boss | the lunge | the charge only | leave the line |

"Mostly bite": three of the four plain fish bite, and drifters are the bulk of
most batches. The eel keeps touch, the room Igor's "some might still" left — an
eel that shocks is the one fish a player expects to hurt by touch.

### 7. Saves

- **Acceleration takes the save to version 5**: the diver's velocity and
  facing and every fish's velocity are new state. A v4 save loads them at rest,
  facing down.
- **Bites take it to version 6**: a fish keeps the behaviour fields it was made
  with, so a restored dive's fish get their type's fields again — a dive saved
  before bites goes on with fish that bite, rather than with drifters that can
  neither bite nor hurt by touch.

## Checked against foundations.md

- **Genre contract 1, an action roguelite, not a survivors-like**: damage on
  touch is the survivors-like's model; a telegraphed bite is action combat's.
  Strengthened.
- **2, manual aim and fire**: unchanged — the weapon fires at the cursor
  whatever way the diver faces.
- **3, 5, 6**: the gates, nothing modal mid-fight, combat the only dynamic
  system — untouched.
- **7, content is data**: `ramp`, `turn`, `bite` and `touch` are fields; a bite
  is one branch in `step()`; the roster is the table above.
- **Pillars**: responsive control holds (§1). Nothing trivial: a tell rewards
  moving, the opposite of trivial. Nothing unbeatable: every bite can be
  escaped — the darter's nip is the tightest, and its overshoot is the answer.
  One sentence per mechanic: "a fish bites: when its jaws open, get away".
- **The technical contract**: the fixed timestep is unchanged; the easing uses
  `Math.pow` over `dt`; the bite's reach test in the per-tick loop is squared;
  the seam gains no name; no new kind of entity, so the budget is unchanged;
  the save is versioned and migrated.
- **Non-goals**: none touched. The facing mark and the jaws are placeholder
  shapes, not art.

## Checked against plan.md

Before S6 (balance), like the sizes (D104 (bodies doubled)): a ramp changes
what every speed means, and a bite changes what a hit is, so S6 tunes on top
of both. The boss and the mini-boss, made different, follow in the same pass.

## Failure cases, each pinned by a check

1. A tick of input moves the diver — the response — but not at full speed.
2. The same motion at any tick length.
3. A view edge stops the velocity into it, and the diver leaves it at once.
4. A dash from a standstill goes along the facing; a dash holds its frozen
   direction whatever is held; it ends swimming along it at swim speed.
5. Turning goes the shorter way and stops on the held direction.
6. A v4 save loads at rest, facing down, and plays on.
7. `Rush` is reached in the same `ramp`.
8. A fish with a ramp overshoots a sidestep; one without turns at once.
9. A biter killed mid-wind-up never bites; a bite during the dash's
   invulnerability costs nothing; the guard takes a bite; a bite spoils
   `untouched`.
10. A bite lands only within reach at the snap; a biter shoved by the dash
    mid-wind-up bites from where it ends up.
11. Biters, archers and puffers are harmless to touch, the eel is not; the
    boss's charge hurts, its rest does not.
12. A restored dive from before bites has fish that bite.
13. The bot still plays; its figures move, as regression signals.
14. Old checks that assume instant movement, a bite on touch or a dash along
    the keys are rewritten for the new rule, each with its reason.

## Build

1. **Acceleration** — the diver's ramp and facing, the dash along the facing,
   fish ramps, the save to v5. A playable step and a commit.
2. **Bites and touch** — the save to v6. A playable step and a commit.

## What this build supersedes and makes stale

- `ideas.md` → Should the dash go where you aim, instead of where you move? —
  answered: where you move, along the facing.
- The dash "only along the keys you are holding", and its refusal without one.
- Every fish hurting on touch — `design.md`, `entities/enemies.md`. D95 (three
  enemy behaviours, and one way to be hurt)'s one way stands: a bite goes
  through `hurtPlayer()`.
- Every bot figure in `roadmap.md` → Health — already marked as older than
  D104 (bodies doubled).
