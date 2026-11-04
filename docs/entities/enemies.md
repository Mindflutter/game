# Enemies

Every enemy type: its numbers, what it is for, and how it behaves. The tables
mirror `ENEMY_TYPES` in `game/content.js`, and `npm test` fails when the two
disagree. Which enemies a dive meets, and how many at once, is the batches'
business: `game/content.js` → batches and layers.

True of every type: its body is solid — the diver cannot swim through it, nor
another fish sit inside it, and the lighter of two is pushed further (D120
(bodies are solid)); it hurts only by its attack, each attack costing its own
`damage` (D118 (hits vary in damage)) and knocking the diver back by its own
`knock` (D122 (knockback)), then the player's i-frames — a guard charge takes
a hit whole, its knock too; the diver's hits knock it back in turn, the
heavier by area less; the dash passes through it and shoves it, and hurts it once `dashDamage` is bought (D51
(the dash is bought)); and it drops its `value` in gems when it dies, which are
pulled to the player (D78 (gems are pulled to the player)).

## Roster

<!-- generated: enemies -->
| name | r | hp | speed | ramp | value | desc | color | glow | against | carries | enters |
|---|---|---|---|---|---|---|---|---|---|---|---|
| drifter | 18 | 1 | 85 | 0.6 | 1 | slow, and bites when its jaws open | #e8446e | #ff1e5a | — | — | — |
| darter | 12 | 1 | 190 | 0.9 | 1 | small and quick, bites fast | #ffb648 | #ff8a00 | — | — | — |
| bulwark | 34 | 6 | 52 | 1.2 | 3 | big, slow and tough; its bite throws you far | #a05cff | #7b2fff | — | — | — |
| archer | 16 | 2 | 75 | — | 2 | keeps its distance and spits | #5aa9ff | #1f6fff | — | — | — |
| puffer | 22 | 3 | 125 | — | 2 | chases you, swells up close, then bursts: get out of its ring | #ffee58 | #ffc800 | — | — | — |
| eel | 14 | 2 | 130 | — | 2 | weaves as it swims, and touching it hurts | #38f2c0 | #00c896 | — | — | — |
| lionfish | 20 | 3 | 30 | 0.8 | 2 | come into its ring and its spines fly out to it: strike from outside, or get out in time | #ffe9dc | #ff5a3c | Knife | — | — |
| mini-boss | 52 | 10 | 90 | — | 10 | winds up, lunges a long way, then rests: hit it then | #e2ff8a | #c6ff3c | — | false | — |
| boss | 84 | 30 | 80 | — | 40 | lunges and fans out shots, open only as it rests, fiercer as it is hurt; its escorts keep coming until it dies | #c8ff3c | #9dff00 | — | false | bottom |
<!-- /generated -->

Each behaviour's numbers, a table per behaviour field. `bite`:

<!-- generated: enemies:bite -->
| name | reach | windup | rest | damage | knock |
|---|---|---|---|---|---|
| drifter | 10 | 0.3 | 0.8 | 1 | 240 |
| darter | 6 | 0.15 | 0.6 | 1 | 180 |
| bulwark | 20 | 0.3 | 1.2 | 1 | 420 |
<!-- /generated -->

`lunge`:

<!-- generated: enemies:lunge -->
| name | chase | windup | speed | reach | rest | damage | knock |
|---|---|---|---|---|---|---|---|
| mini-boss | 1 | 1.2 | 780 | 450 | 1.5 | 2 | 600 |
| boss | 1 | 0.8 | 780 | 450 | 1.5 | 4 | 600 |
<!-- /generated -->

`fan`:

<!-- generated: enemies:fan -->
| name | chase | windup | reach | rest | count | arc | speed | r | travel | damage | knock |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boss | 1 | 0.6 | 450 | 1.5 | 7 | 90 | 160 | 9 | 600 | 1 | 150 |
<!-- /generated -->

`spit`:

<!-- generated: enemies:spit -->
| name | range | every | speed | r | travel | damage | knock |
|---|---|---|---|---|---|---|---|
| archer | 240 | 2 | 210 | 6 | 420 | 1 | 150 |
<!-- /generated -->

`fuse`:

<!-- generated: enemies:fuse -->
| name | chase | trigger | time | blast | damage | knock |
|---|---|---|---|---|---|---|
| puffer | 1.5 | 90 | 0.5 | 110 | 2 | 480 |
<!-- /generated -->

`weave`:

<!-- generated: enemies:weave -->
| name | width | rate |
|---|---|---|
| eel | 50 | 0.5 |
<!-- /generated -->

`touch`:

<!-- generated: enemies:touch -->
| name | damage | knock |
|---|---|---|
| eel | 1 | 240 |
<!-- /generated -->

`spines`:

<!-- generated: enemies:spines -->
| name | reach | delay | regrow | count | speed | r | damage | knock |
|---|---|---|---|---|---|---|---|---|
| lionfish | 80 | 0.4 | 1 | 12 | 400 | 2 | 1 | 300 |
<!-- /generated -->

`shell`:

<!-- generated: enemies:shell -->
| name | takes |
|---|---|
| mini-boss | 0 |
| boss | 0 |
<!-- /generated -->

`stages`:

<!-- generated: enemies:stages -->
| name | rounds |
|---|---|
| boss | lunge / lunge,fan / lunge,lunge,fan |
<!-- /generated -->

Every number is Claude's pick: the lungers' (D64 (the boss lunges)), the
boss's fan (D117 (the boss's fan)), the boss's `value` (D68 (the layer end is
a milestone)), every type S5 (content) brought (D95 (three enemy behaviours,
and one way to be hurt)), and the ramps and bites (D107 (the diver swims and
faces; fish with a ramp), D108 (fish bite)) — the puffer's, the mini-boss's
and the boss's tuned to the pillars (D127 (the tuned numbers)), the boss's
`hp` raised again with the longer dive (D137 (batches grow from seconds to a
minute and a half)), and the lionfish's (D171 (the lionfish)).

## Grades

The same fish, stronger (D119 (grades)): a grade changes its numbers, never
its behaviour. Grade 1 is the type as written; each step multiplies `hp`,
`speed` and `value`, and adds to every attack's `damage` and to `touch`. Every
type has every grade, so a new type needs nothing here but its threat at
each (below). Which grade a fish arrives at is the plan's, drawn from the
seed: each batch is graded up to its stretch's threat (D126 (threat)), and
`from` is the first layer a grade arrives in, so the first layer never meets
the top one. The debug mode's Grade row sets one. A graded fish shows its
grade as a small number on its body, above the first — Igor: "circles enlarge
enemies visually"; PLACEHOLDER GRAPHICS. The steps are Claude's picks, tuned
to the pillars (D127 (the tuned numbers)).

<!-- generated: grades -->
| grade | hp | speed | value | damage | from |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 1 | 0 | 1 |
| 2 | 1.25 | 1.1 | 2 | 1 | 1 |
| 3 | 1.5 | 1.2 | 3 | 2 | 2 |
<!-- /generated -->

## Threat

What a fish costs, in hearts (D126 (threat)): one over the number of it, at
that grade and alone, that costs the diver bot one heart, at the reference kit
— the Gun, no gear, no mods, no steps. A batch's threat is its fish's summed.
Measured by `npm run measure threat`; the numbers are the fit, rounded — but
the archer's, twice the fit: the bot dodges shots a player cannot (D157 (the
archer counts twice what the bot measures)); and the puffer's, 1.4 times the
fit: the bot steps out of a burst a player is caught in (D167 (the puffer
counts more, and gates carry fewer)).

<!-- generated: enemies:threat -->
| name | grade 1 | grade 2 | grade 3 |
|---|---|---|---|
| drifter | 0.004 | 0.021 | 0.026 |
| darter | 0.004 | 0.014 | 0.018 |
| bulwark | 0.053 | 0.085 | 0.101 |
| archer | 0.034 | 0.056 | 0.064 |
| puffer | 0.113 | 0.183 | 0.258 |
| eel | 0.114 | 0.239 | 0.4 |
| lionfish | 0.021 | 0.033 | 0.047 |
| mini-boss | 0.386 | 0.452 | 0.5 |
| boss | 0.906 | 0.946 | 0.992 |
<!-- /generated -->

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key: batches and scenarios name the type by it. |
| `hp` | damage | What it takes to kill, against the weapon's `damage` per hit. A wounded enemy carries a bar over its body (D121 (only a hit blinks; a hurt fish carries a bar)). |
| `speed` | px/s | How fast it swims at the player. A batch arrival spreads it by `ENEMY_JITTER 0.3` — ±15%; a scenario places it at exactly this. |
| `r` | px | Body radius, and the hitbox: the circle drawn is what collides. |
| `ramp` | s | Eases its chase as the diver's swim is eased (D107 (the diver swims and faces; fish with a ramp)): seconds to full speed, near enough, and to turn — so it overshoots a sidestep. Absent, it turns on the spot. Only the plain chase reads it; a behaviour that moves the fish its own way keeps its own movement. |
| `value` | gems | Dropped on death. Times its grade's `value`. Whether an enemy drops at all is a balance lever (D78 (gems are pulled to the player)); every kill drops, and the prices carry the economy (D127 (the tuned numbers)). |
| `desc` | — | Its line in the catalogue (D146 (the catalogue)), once it is first met: what it does, in words. |
| `enters` | — | Where a batch brings it in. Absent: just outside a random edge of the view. `bottom`: below the view, centred. |
| `color` | hex | Body colour. Placeholder graphics (D4 (no assets, ever)). |
| `glow` | hex | Glow colour, the same placeholder. |
| `carries` | — | `false`: never the glowing fish that carries its batch's mod (D88 (the fish glows from the start)) — the boss and the mini-boss. Absent: it can be. |
| `bite` | — | Its presence is the behaviour: the type bites (D108 (fish bite)). Holds the numbers in its table above: within `reach` px, body to body, it stops and opens its jaws for `windup` seconds, bites if the diver is still within `reach`, then chases `rest` seconds before it can bite again. |
| `touch` | — | Its presence is the behaviour: its body hurts on contact — the eel's. Holds its `damage` and its `knock`, as every attack (D118 (hits vary in damage), D122 (knockback)). A fish without it hurts only by its attack (D108 (fish bite)). |
| `spines` | — | Its presence is the behaviour: a diver whose body comes within `reach` px of its own cocks them; `delay` seconds later `count` of them fly out from its centre to the ring of that reach as enemy shots of radius `r` at `speed` px/s, stinging only the diver one touches (D176 (the spines sting by touch)), and regrow over `regrow` seconds before they can cock again (D174 (the lionfish fires its spines)). Holds its `damage` and its `knock`, as every attack. |
| `lunge` | — | Its presence is the behaviour: the type lunges instead of only chasing (D64 (the boss lunges)). Holds the timings in the table above: `chase` seconds before a wind-up may start, `windup` and `rest` in seconds, the charge's `speed` in px/s and its `reach` in px. |
| `fan` | — | A lunger's second attack (D117 (the boss's fan)), taken where its `stages` name it; read only beside a `lunge`. Holds the numbers in its table above: the lunge's `chase`, `windup`, `reach` and `rest`, then `count` shots spread evenly across `arc` degrees, each of radius `r` px flying at `speed` px/s for `travel` px. |
| `shell` | — | Its presence is the behaviour: a lunger's shell, shut but in the `rest` after each attack — the opening (D156 (the boss's shell and stages)). Shut, a hit, a cut or the dash deals `takes` of its damage, and none glances off with a clink. |
| `stages` | — | A lunger's stages (D156 (the boss's shell and stages)): `rounds`, one per stage, each the attacks it takes in turn. Each stage holds an even share of its hp, and a new one starts its round from the top. Without it a lunger only lunges. |
| `spit` | — | Its presence is the behaviour: the type keeps its distance and spits (D95 (three enemy behaviours, and one way to be hurt)). Holds the numbers in its table above: it closes to `range` px and holds its ground (D159 (the archer holds its ground)); it spits every `every` seconds, a shot of radius `r` px flying at `speed` px/s for `travel` px. |
| `fuse` | — | Its presence is the behaviour: the type swells, bursts and chases on (D95 (three enemy behaviours, and one way to be hurt), D106 (the puffer bursts and comes on again)). Holds the numbers in its table above: after chasing for at least `chase` seconds, within `trigger` px it stops and swells for `time` seconds, then bursts, reaching `blast` px, and chases again. |
| `weave` | — | Its presence is the behaviour: the type sways as it closes in (D95 (three enemy behaviours, and one way to be hurt)). Holds the numbers in its table above: `width` px either side of its heading, `rate` sways a second. |
| `against` | — | The weapon the type is built against (D171 (the lionfish)). Its `threat`, measured with the Gun, cannot price it, so the pools bring it where it counters that weapon, past the threat order (D130 (fish are revealed a type at a time)). Absent: it keeps the order. |
| `threat` | hearts | One number per grade, in the table above: what one of it costs the diver bot at the reference kit (D126 (threat)). A batch's threat is the sum, and what the plan grades it by. A new type is measured once and joins. |

## Behaviours

A behaviour is a field whose presence switches it on, plus one branch in the
enemy loop (`step()` in `game/logic.js`) and its step function — never a
class (D26 (disciplines installed)). S5 (content) brings five to seven.

**Chase** — a type without a behaviour field: swims straight at the player at
its `speed`, eased by its `ramp`. The dash's shove and the knock of a hit
(D122 (knockback)) are its only other motion.
Today every type has a behaviour; the plain fish bite.

**Bite** — chase, open the jaws, bite, rest (`biteStep()`, D108 (fish bite)).
It chases until its body is within `reach` px of the player's, then stops —
easing to a halt with its `ramp`, so a heavy fish slides — and holds its jaws
open for `windup` seconds: the tell, a dark wedge toward the player. They snap
shut for its `damage` if the player is still within `reach`, and on water if not,
the body leaping at the player as they do — to its body, or to the reach's end
(D141 (the bite leaps)); then it chases on, `rest` seconds before it can bite again. A dash's shove
mid-wind-up moves it, and it bites from where it ends up. In one sentence:
when the jaws open, get away.

**Touch** — a fish with `touch` costs that much on contact: the eel's
electric body. Every other fish hurts only by its attack — a bite, a spit, a
burst, or the lunge's charge (D108 (fish bite)).

**Spines** — a fish with `spines` fires them (`spinesStep()`): a diver whose
body comes within their `reach` of its own cocks them, and `delay` later they
fly out to the ring of that reach, whoever has left by then, as `count`
enemy shots: one that touches the diver costs its `damage`, knocked along its
flight, and one that misses costs nothing (D176 (the spines sting by
touch)), the puffer's burst hurting by area instead; bare, they regrow over
`regrow` before they can cock again (D174 (the lionfish fires its spines)).
It swims on meanwhile. A hit on it costs nothing, and the dash's
invulnerability takes the sting, so a dash that deals damage — bought, D51
(the dash is bought, and the offer waits for the death) — kills it unhurt.
It drifts, and its reach passes the Knife's cut, which the Mask never
lengthens, so the Knife comes in, cuts, and gets out within the delay (D175
(the lionfish drifts, its circle past the Knife's cut), D180 (the Mask
lengthens a shot, not a cut)). It is drawn spiked, the spines bristling as they cock; the
ring of its reach fades in as the diver nears it and brightens inside, and
the spines fly out to it, each drawn where it can sting, and regrow (D173
(the sting is drawn, the ring kept)). In one sentence: strike it from
outside its ring, or get out before its spines fly.

**Lunge** — chase, wind up, charge, rest, then chase again (`lungeStep()`).
It chases the nearest point to the player where its body fits in view, so a
player at an edge cannot keep it half out (D120 (bodies are solid)). After
`chase` seconds, within `reach` of the player and wholly inside the view,
it stops and winds up for `windup` seconds with its line locked at where the
player was. That is the tell: it swells, glows harder and lays a lane as wide
as its radius along the line. Then it charges along the line at `speed`, for
`reach` px — or, where the edge of the view comes first, to the edge in the
same time, slower, never cut short (D201 (a lunge toward the edge takes its
whole time)), though never below `LUNGE_SLOWEST` of its speed, so right by the
edge it reaches the edge sooner rather than crawl (D213 (a lunge's least
speed)) — and rests for `rest` seconds — the opening. The charge is its attack: contact costs its `damage` while it
charges, and only then (D108 (fish bite)). From the wind-up to the end of its
rest no body pushes it, so its lane holds (D120 (bodies are solid)). From the wind-up on, the view holds it, so a charge never takes the
fight off screen. In one sentence, per the pillar: when it swells, get out of
its line.

**Fan** — the lunge's turn-about (`lungeStep()`, D117 (the boss's fan)). A
lunger with a `fan` takes it where its `stages` name it (D156 (the boss's
shell and stages)): that wind-up ends in shots rather than a charge. It chases, stands and winds up as
for a lunge, by the fan's own numbers, with its line locked at where the
player was — but the tell lays down `count` lines, spread evenly across `arc`
degrees around that line and each as wide as a shot. As the wind-up ends it
spits a shot along every line — a shot like the spit's, for the fan's
`damage` — and rests.
When the boss dies, every enemy shot still flying goes with it (D116 (bosses
bring escorts)): the fight is over. In one sentence: when it lays down many
lines, slip between them.

**Spit** — keep the distance, and spit (`spitStep()`). It closes to its
`range` and holds there, never swimming away from the diver (D159 (the
archer holds its ground)).
While within range and wholly inside the view it spits a shot at where the
player is, every `every` seconds; one outside the view comes in first, so a
shot always comes from a fish you can see. A shot flies straight for its
`travel` and costs its `damage` where it meets the player — the shot carries
it, so it lands for what it was fired with — but never touches a fish, and the dash's
invulnerability lets it through unspent. In one sentence: the blue ones spit,
so keep moving.

**Fuse** — chase, swell, burst, chase again (`fuseStep()`, D106 (the puffer
bursts and comes on again)). It chases as a lunger does, to the nearest point
where its body fits in view. Once it has chased for `chase` seconds — since it
arrived, or since its last burst — within `trigger` of the player and wholly
inside the view, it stops and swells for `time` seconds — the tell: it puffs
up and draws the ring its burst will reach — then bursts, costing its `damage`
if the player is inside `blast`, and chases on. The dash's shove still moves it,
which is the answer to one. It outlives every burst, so only killing it ends
it, and pays like any fish; a burst pays nothing. In one sentence: when it
swells, get out of its ring — and kill it before it comes back.

**Weave** — chase, swaying (`weaveStep()`). It swims at the player like a
chaser while swaying across its heading, `width` px either side at `rate`
sways a second, so a shot aimed where it is misses where it will be. The sway
keeps its own clock from the moment it arrives, so a batch's eels sway in
step, as a school. In one sentence: lead your shots.

## drifter

The baseline swarm: slow and fragile, the enemy every other type is measured
against. Bites (D108 (fish bite)): a short wind-up and a small reach, and it
turns loosely — back off when its jaws open.

## darter

Small and fast: fast enough to punish lazy kiting. Nips (D108 (fish bite)):
the quickest wind-up and the smallest reach, at a speed its ramp turns slowly
— step out of its line, and it slides past.

## bulwark

Big, slow and tough: soaks shots and blocks escape routes. Chomps (D108 (fish
bite)): a long reach and a slow wind-up, and heavy to start and to turn — stay
out of its reach, or circle it.

## archer

Keeps its distance and spits slow shots (D95 (three enemy behaviours, and
one way to be hurt)): it punishes standing still and kiting in a straight line,
the dominant play while everything only chased. Its range sits under the
Gun's, so the starting weapon can always answer it. The draft's "avoiding the
player and shooting from a distance", named for the archerfish, which spits
at its prey. Harmless to touch: only its spit hurts (D108 (fish bite)).

## puffer

Swims at you, stops for a moment, bursts, and comes on again (D95 (three
enemy behaviours, and one way to be hurt), D106 (the puffer bursts and comes
on again)): the draft's "exploding after a short time". Igor's shape: "chases,
stops for a brief moment, explodes quickly, continues chasing". It gives a
batch a fish that must die first, and makes standing your ground in a crowd
cost; waiting one out no longer clears it. Harmless to touch: only its burst
hurts (D108 (fish bite)). Every number is Claude's pick, tuned to the
pillars (D127 (the tuned numbers)).

## eel

Closes in on a sway (D95 (three enemy behaviours, and one way to be hurt)):
the draft's "moving in a peculiar way". Fast and slippery, it asks you to aim
where it will be, not where it is. Its body shocks: the one fish that hurts on
touch, and it never bites (D108 (fish bite)) — never touch it.

## lionfish

Spined and slow, and harmless while you keep out of its ring (D174 (the
lionfish fires its spines)): come in and, a moment later, its spines fly out
to the ring, stinging you if one touches you (D176 (the spines sting by
touch)); then they regrow, and it
fires again if you stay. It drifts (D175 (the lionfish drifts, its circle
past the Knife's cut)), so a weapon that fights from afar never needs to
meet it, and the Knife must go to it, dart in, cut, and get out before they
fly — never a stand in the crowd around it. Unlike the puffer, which hunts
you, stops and swells, and bursts once a fuse over its whole ring, it drifts
on through its tell, fires each time it regrows, and hurts only where a
spine lands.
The eel's opposite: the eel punishes a shot that cannot aim, the lionfish a
blade that stays close. Named for the fish whose spines sting.

## mini-boss

A smaller boss (D65 (a mini-boss is a smaller boss)): it lunges like the boss,
weaker and slower to wind up, and shelled the same way, so it teaches the
boss's tell and its opening where the stakes are low (D156 (the boss's shell
and stages)). It only lunges: the fan is what the boss adds at the bottom (D117
(the boss's fan)). It leads in its escorts at an ordinary gate: one ordinary batch from
the pool before it, dealt into the waves behind it and cleared like any (D116
(bosses bring escorts)). Neither it nor its escorts glow, so its gate pays no
mod (D88 (the fish glows from the start)) — Igor: "remove glow from
mini-bosses". It arrives from a random edge like any batch —
how a mini-boss arrives was left unsettled by D65 (a mini-boss is a smaller
boss).

## boss

The layer's last batch (D62 (the boss is the layer's last batch)); killing it
is the layer end. It rises from
below the view, centred — Igor: "The boss swims in from the bottom". Lunges,
with a shorter wind-up than the mini-boss, and spits a fan (D117 (the boss's
fan)) — the one attack the mini-bosses never showed. Shelled, it is hurt only
in the rest after an attack, and it fights in stages, a third of its hp each:
lunges; a lunge and a fan in turn; two lunges to a fan. A stage cannot be
skipped — each needs an opening of its own (D156 (the boss's shell and
stages)). In one sentence: dodge, then hit it while it rests. Its `value` is the layer end's big
haul of gems (D68 (the layer end is a milestone)). It never glows: the layer
end's pick pays its batch (D85 (the layer end's pick), D88 (the fish glows
from the start)). Its escorts are a crowd (D116 (bosses bring escorts)):
topped back up to `BOSS_CROWD` while it lives, drawn from one batch of the
layer's last pool, graded with it, paying no gems, and dying with it.

## Adding one

1. A line in `ENEMY_TYPES`, with the fields above. A new behaviour is a new
   field plus its branch in the enemy loop, and a check on its state
   transitions in `tests/enemies.test.js` — and its line in
   `DEBUG_BEHAVIOURS`, which says what it does on the debug setup's tip (D102
   (the debug mode)).
2. Its `threat`, measured: `npm run measure threat <name>` prints the line to
   paste (D126 (threat)).
3. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); a new
   behaviour's table needs its markers placed first, where it belongs.
   `npm test` fails until they match the code.
4. To meet it in a dive, a batch in a layer's pool names it
   (`game/content.js` → batches). A scenario can place it alone.
