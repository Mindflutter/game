# Enemies

Every enemy type: its numbers, what it is for, and how it behaves. The tables
mirror `ENEMY_TYPES` in `game/content.js`, and `npm test` fails when the two
disagree. Which enemies a dive meets, and how many at once, is the batches'
business: `game/content.js` → batches and layers.

True of every type: it hurts on contact — one heart, then the player's
i-frames; the dash shoves it, and hurts it once `dashDamage` is bought (D51
(the dash is bought)); and it drops its `value` in gems when it dies, which are
pulled to the player (D78 (gems are pulled to the player)).

## Roster

| name | r | hp | speed | value | color | glow | carries | enters |
|---|---|---|---|---|---|---|---|---|
| drifter | 18 | 1 | 85 | 1 | #e8446e | #ff1e5a | — | — |
| darter | 12 | 1 | 190 | 1 | #ffb648 | #ff8a00 | — | — |
| bulwark | 34 | 6 | 52 | 3 | #a05cff | #7b2fff | — | — |
| archer | 16 | 2 | 75 | 2 | #5aa9ff | #1f6fff | — | — |
| puffer | 22 | 3 | 95 | 2 | #ffee58 | #ffc800 | — | — |
| eel | 14 | 2 | 130 | 2 | #38f2c0 | #00c896 | — | — |
| mini-boss | 52 | 24 | 70 | 5 | #e2ff8a | #c6ff3c | false | — |
| boss | 84 | 60 | 60 | 30 | #c8ff3c | #9dff00 | false | bottom |

Each behaviour's numbers, a table per behaviour field. `lunge`:

| name | chase | windup | speed | reach | rest |
|---|---|---|---|---|---|
| mini-boss | 1 | 1.5 | 780 | 450 | 1.2 |
| boss | 1 | 1 | 780 | 450 | 1.2 |

`spit`:

| name | range | near | every | speed | r | travel |
|---|---|---|---|---|---|---|
| archer | 240 | 170 | 2 | 210 | 6 | 420 |

`fuse`:

| name | trigger | time | blast |
|---|---|---|---|
| puffer | 90 | 1.2 | 110 |

`weave`:

| name | width | rate |
|---|---|---|
| eel | 50 | 0.9 |

Every number is S6 (balance)'s to tune. Marked in the code as Claude's picks:
the lungers' numbers (D64 (the boss lunges)), the boss's `value` (D68 (the
layer end is a milestone)), and every type S5 (content) brought (D95 (three
enemy behaviours, and one way to be hurt)).

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key: batches and scenarios name the type by it. |
| `hp` | damage | What it takes to kill, against the weapon's `damage` per hit. A wounded enemy is drawn smaller. |
| `speed` | px/s | How fast it swims at the player. A batch arrival spreads it by `ENEMY_JITTER 0.3` — ±15%; a scenario places it at exactly this. |
| `r` | px | Body radius, and the hitbox: the circle drawn is what collides. |
| `value` | gems | Dropped on death. Whether an enemy drops at all is S6 (balance)'s lever (D78 (gems are pulled to the player)); today every kill drops its `value`. |
| `enters` | — | Where a batch brings it in. Absent: just outside a random edge of the view. `bottom`: below the view, centred. |
| `color` | hex | Body colour. Placeholder graphics (D4 (no assets, ever)). |
| `glow` | hex | Glow colour, the same placeholder. |
| `carries` | — | `false`: never the glowing fish that carries its batch's mod (D88 (the fish glows from the start)) — the boss and the mini-boss. Absent: it can be. |
| `lunge` | — | Its presence is the behaviour: the type lunges instead of only chasing (D64 (the boss lunges)). Holds the timings in the table above: `chase` seconds before a wind-up may start, `windup` and `rest` in seconds, the charge's `speed` in px/s and its `reach` in px. |
| `spit` | — | Its presence is the behaviour: the type keeps its distance and spits (D95 (three enemy behaviours, and one way to be hurt)). Holds the numbers in its table above: it closes to `range` px and backs off inside `near` px; it spits every `every` seconds, a shot of radius `r` px flying at `speed` px/s for `travel` px. |
| `fuse` | — | Its presence is the behaviour: the type swells, then bursts (D95 (three enemy behaviours, and one way to be hurt)). Holds the numbers in its table above: within `trigger` px it stops and swells for `time` seconds, then bursts, reaching `blast` px. |
| `weave` | — | Its presence is the behaviour: the type sways as it closes in (D95 (three enemy behaviours, and one way to be hurt)). Holds the numbers in its table above: `width` px either side of its heading, `rate` sways a second. |
| `threat` | — | **Reserved** for S6 (balance): the type's threat number, from which a batch's threat is computed (D79 (a dive goes from easiest to hardest)). Not in the code; S6 adds it to every type at once, so S5 (content) writes its enemies on a shape that will not change (D80 (entity docs and mods from drops come first)). |

## Behaviours

A behaviour is a field whose presence switches it on, plus one branch in the
enemy loop (`step()` in `game/logic.js`) and its step function — never a
class (D26 (disciplines installed)). S5 (content) brings five to seven.

**Chase** — every type without a behaviour field: swims straight at the player
at its `speed`. The dash's shove is its only other motion.

**Lunge** — chase, wind up, charge, rest, then chase again (`lungeStep()`).
After `chase` seconds, within `reach` of the player and wholly inside the view,
it stops and winds up for `windup` seconds with its line locked at where the
player was. That is the tell: it swells, glows harder and lays a lane as wide
as its radius along the line. Then it charges along the line at `speed`, for
`reach` px or to the edge of the view, and rests for `rest` seconds — the
opening. From the wind-up on, the view holds it, so a charge never takes the
fight off screen. In one sentence, per the pillar: when it swells, get out of
its line.

**Spit** — keep the distance, and spit (`spitStep()`). It closes to its
`range`, backs off inside `near` — never out of the view — and holds between.
While within range and wholly inside the view it spits a shot at where the
player is, every `every` seconds; one outside the view comes in first, so a
shot always comes from a fish you can see. A shot flies straight for its
`travel` and costs a heart where it meets the player — the same hurt as a
bite, through `hurtPlayer()` — but never touches a fish, and the dash's
invulnerability lets it through unspent. In one sentence: the blue ones spit,
so keep moving.

**Fuse** — chase, swell, burst (`fuseStep()`). Within `trigger` of the player
and wholly inside the view, it stops and swells for `time` seconds — the tell:
it puffs up and draws the ring its burst will reach — then bursts, costing a
heart if the player is inside `blast`. The dash's shove still moves it, which
is the answer to one. Shot before it bursts, it dies like any fish. A burst is
not a kill: no gems, no boost and nothing counted toward one, and a glowing
puffer that bursts takes its batch's mod with it. In one sentence: when it
swells, shoot it or get out of its ring.

**Weave** — chase, swaying (`weaveStep()`). It swims at the player like a
chaser while swaying across its heading, `width` px either side at `rate`
sways a second, so a shot aimed where it is misses where it will be. The sway
keeps its own clock from the moment it arrives, so a batch's eels sway in
step, as a school. In one sentence: lead your shots.

## drifter

The baseline swarm: slow and fragile, the enemy every other type is measured
against. Chases.

## darter

Small and fast: fast enough to punish lazy kiting. Chases.

## bulwark

Big, slow and tough: soaks shots and blocks escape routes. Chases.

## archer

Keeps its distance and spits slow shots (D95 (three enemy behaviours, and
one way to be hurt)): it punishes standing still and kiting in a straight line,
the dominant play while everything only chased. Its range sits under the
Gun's, so the starting weapon can always answer it. The draft's "avoiding the
player and shooting from a distance", named for the archerfish, which spits
at its prey.

## puffer

Swims at you, swells, and bursts (D95 (three enemy behaviours, and one way
to be hurt)): the draft's "exploding after a short time". It gives a batch a
fish that must die first, and makes standing your ground in a crowd cost. Only
a fish you shoot pays, so a burst is gems and a mod thrown away.

## eel

Closes in on a sway (D95 (three enemy behaviours, and one way to be hurt)):
the draft's "moving in a peculiar way". Fast and slippery, it asks you to aim
where it will be, not where it is.

## mini-boss

A smaller boss (D65 (a mini-boss is a smaller boss)): it lunges like the boss,
weaker and slower to wind up, so it teaches the boss's tell where the stakes
are low. Always alone, in a batch of its own at an ordinary gate. It never
glows, so its gate pays no mod (D88 (the fish glows from the start)) — Igor:
"remove glow from mini-bosses". It arrives from a random edge like any batch —
how a mini-boss arrives was left unsettled by D65 (a mini-boss is a smaller
boss).

## boss

Alone in the layer's last batch, which is otherwise a normal batch (D62 (the
boss is the layer's last batch)); clearing it is the layer end. It rises from
below the view, centred — Igor: "The boss swims in from the bottom". Lunges,
with a shorter wind-up than the mini-boss. Its `value` is the layer end's big
haul of gems (D68 (the layer end is a milestone)). It never glows: the layer
end's pick pays its batch (D85 (the layer end's pick), D88 (the fish glows
from the start)). Normal enemies alongside it,
and more attacks, wait in `ideas.md`.

## Adding one

1. A line in `ENEMY_TYPES`, with the fields above. A new behaviour is a new
   field plus its branch in the enemy loop, and a check on its state
   transitions in `tests/enemies.test.js` — and its line in
   `DEBUG_BEHAVIOURS`, which says what it does on the debug setup's tip (D102
   (the debug mode)).
2. A row in the roster — and in its behaviour's table, if it has one — and a
   section here under its `name`. `npm test` fails until both match the code.
3. To meet it in a dive, a batch in a layer's pool names it
   (`game/content.js` → batches). A scenario can place it alone.
