# Design — how Abyss works today

Describes the **present**, not the plan: how the systems work. Update it when
reality changes. Nothing here is a statement of intent. What each stage built
is `plan.md` → Closed stages; each enemy, mod, weapon and piece of equipment —
its numbers and behaviour — is its doc in `entities/`.

## What it is

A twin-stick action game, diving down through **layers** — two at present. You
move with WASD, aim with the mouse and **fire by holding the left button**
(D45). The dive stops at each gate depth while a **batch** is alive — no
further in enemies, though the water keeps flowing. One fish of each batch
glows from the moment it arrives — never a boss or a mini-boss — and carries
the batch's **mod**, which flies to you when it dies (D84, D88). Kills also drop **boosts**, short powers you touch before they fade
(D86). Then a current carries you down to the next batch, about two seconds
away and independent of anything the player does (D58). A layer's boss is its
**layer end**: a full heal, a haul of gems and a pick of valuable mods — the
dive's one pause, ended by Continue (D68, D85) — and the current carries you on
into the next layer (D66). Kills drop gems, which fly to you (D35) and are
banked when the dive ends. A dive ends in
death, or in the win at the bottom of the last layer; then `home`, where gems
buy gun tiers and micro-task points raise dash reach. The measured times live
in `roadmap.md` → Health, and only there.

## Files

```
index.html              shell: canvas, CSS, eight script tags in load order

game/       content.js  every tuning number + all content tables
            state.js    dive state, what persists (meta), reset(), the
                        snapshot and the save text
            logic.js    step() — arrivals, the gate, the descent, movement,
                        collision; the plan; home's buying and banking;
                        the debug mode's setup
                        ── Survives the port.

platform/   input.js    keyboard + mouse → keys / justPressed / aim
            audio.js    WebAudio synthesis
            render.js   canvas, view scaling, the camera, every draw function
main.js                 frame loop, dt, fps, boot, the save's storage
                        ── Rewritten on the port.

checks.js               the ?test suite → the port's regression tests
```

Plain `<script>` tags, not modules, so `file://` works. **Load order matters**
and is documented in `index.html`.

### The port seam

`game/` contains no `ctx.`, `canvas`, `document.`, `window.`, `AudioContext` or
`addEventListener` — verified by grep, not assumed. It reaches into `platform/`
for exactly seven names:

| Name | Owner | Rust/C++ equivalent |
|---|---|---|
| `sound(name, pitch)` | `platform/audio.js` | any audio crate/lib |
| `keys` | `platform/input.js` | a held-key set |
| `justPressed` | `platform/input.js` | an edge-triggered set |
| `tapped(codes)` | `platform/input.js` | trivial helper |
| `moveCursor(i, len)` | `platform/input.js` | trivial helper |
| `aim` | `platform/input.js` | cursor position in **view** coords; `game/` adds `cameraY` |
| `persist(text)` | `main.js` | write a string to a file / the platform's storage |

`persist` is S4's, and deliberate (D77): `game/` decides *when* the save is
written and builds the text; keeping it is the platform's. Loading goes the
other way — `main.js` reads the stored text at boot and calls `loadSave()` — so
it needs no name. Under `?test` and `?dev=` it is a no-op, and nothing is
loaded either, so no check ever reads or overwrites a player's save. Every
write asks `saveNow()` in `game/` — `main.js`'s own on a hidden or closed page
included — and it writes nothing in the debug mode (D102 (the debug mode)),
which loads nothing either.

Exactly seven, and **enforced rather than claimed**: `npm test` loads `game/`
into a Node `vm` with only these seven stubbed, so reaching for an eighth fails
the build — on any path a test drives. A path none drives can still hide one:
the Volume option reached for platform's gain node until a test drove every
option. That check found the seam had quietly grown to eleven — `LEFT`, `RIGHT`,
`GO`, `DASH` and `CLICK` were being read from `platform/input.js`. They now live
in `game/content.js`, because which key means which action is content (D44).

## The frame

```
frame(now)                        main.js -- only measures how long a frame took
  advanceBy(elapsed)              game/logic.js: banks time into whole ticks
    min(elapsed, MAX_FRAME_DT)    a minute in another tab is discarded, and the
                                  same cap bounds catch-up to 6 ticks
    update(FIXED_DT)  x0..6       0 ticks on a fast frame, 2 on a 60Hz one
      step(FIXED_DT)              screen dispatch, then gameplay
      shake fade                  outside step(): step() returns early on menus
      justPressed.clear()
  draw()                          platform/render.js -- every frame, regardless
```

**The simulation runs at `FIXED_DT` (1/120) and nothing else** (D53). Leftover
time is banked in an accumulator, so the same dive plays identically on a 60Hz
and a 144Hz machine — with a variable `dt`, every collision test sampled at a
distance set by the player's frame rate. There is no render interpolation: the
picture is drawn wherever the last tick left things, at most 8ms stale, which
is why the step is 1/120 rather than 1/60.

The clock lives in **`game/`**, not in the frame loop. A fixed timestep is a
property of the simulation, so putting the accumulator in `main.js` would have
meant the port re-deriving it and its check testing a file that gets thrown
away. `main.js` now measures elapsed time and hands it over; `advanceBy()`
owns the banking, the cap and the tick count, Node drives the same entry point
the browser does, and the invariant guarding D53 runs in both suites.

`update` / `draw` are strictly separated: `update` changes numbers, `draw`
reads them. Nothing persists on screen — the arena is repainted every frame.

## Screens

```
title ──Start──> home ──Dive──> playing ──Esc──> paused ──Quit──> title
  │ (a dive saved:              │ ▲              │ (the dive stays saved)
  │  Continue ──> playing)      │ │ Continue     ├──> help ───Esc──> back to caller
  │                    layer end▼ │              └──> options ─Esc──> back to caller
  │                           mods
  │                             │
  └──<──Esc── home <──Go home── dead ──Dive again──> playing
              │ ▲              won
              │ └──Back / Esc── gear, attributes
              └──Gear, Attributes──┘

title ──New game──> newGame ──Erase everything and start──> home     (D103)
                      └──Cancel / Esc──> title

?debug ──> debug ──Dive / R──> playing ──Backspace──> debug     (D102)
             ▲                   └──Esc──> paused ──Quit to setup──> debug
             └──Setup / Esc── dead, won ──Again / R──> playing
```

The mod screen is the layer end's pick (D85): a card is marked, then taken on
Continue. `A`/`D` or the arrows move the mark, `choiceIndex` (it opens on the
middle card), and a click on a card or its number `1`/`2`/`3` marks that card;
you can switch freely. Continue — the button under the cards, `continueRect()`
— or Enter or Space takes the marked one. A cursor passing over a card marks
nothing, since on its way down to Continue it crosses the cards; the screen
still reads `mouseMoved()` every frame, so the next menu does not mistake a
still cursor for a moved one (`lastAimX`/`lastAimY`). With nothing left to
offer, only Continue shows. Esc pauses here as it does in play, and Resume — or
Esc again — brings the same cards back: the pause menu returns to whichever
screen opened it (`resumeTo`).

The title, pause, `home` and options screens work the same way: hover moves the
cursor, a click activates the row, and on options a click cycles the value
exactly as Enter does. A screen is a menu exactly when `MENUS` has an entry for
it — `step()` dispatches on `MENUS[screen]` — and the water freezes on menus,
help and options, except a menu that `flows`. Anything that depends on state is a getter: the title's
first row reads Start or Continue, `home`'s rows their prices, `dim` greys a
row that cannot be taken, and `home.lines` are its layer lines. Each menu names
its own `top`, and `back` is what Esc does on the ones that have it (pause
resumes, `home` goes to the title, gear and attributes go `home`).
**`home` sells a screen deeper** (D96): its rows are Dive, Gear, Attributes,
Help and Options; Gear lists the weapons and the equipment with the gems to
spend, Attributes the attributes with the points, and each ends on a Back row.
The browser suite holds every menu's rows above the hint. Every way onto a menu is `openMenu()`,
which also resets the cursor.
Help takes a click as "go on". The end screens — `dead` and `won` — are one
menu, `END_MENU`, under one draw function: **Dive again** and **Go home**, Go
home opening marked so a stray Enter or Space — Space is the dash — does what
any key did before, and a click only takes the button under it (D90). It
`flows`: the water drifts on under it (D58). `won` is reached only by killing
the last layer's boss (D68).
Menu and options rows are full-width bands from `rowRect` in `content.js`; a
menu with a grid of its own names it as `rect` — the debug setup's
`debugRect` — and `rectOf()` reads either, for the renderer and the hit-test
alike. A row with `change(d)` holds a value (the debug setup's): the arrows
move it, five at a time with Shift, Enter steps it up, and a click on either
side of it moves it that way (`clickStep()`); a step past either end comes
round to the other (`wrapStep()`).

**`home` exists only between dives** (D76). With a dive under way the title's
Start reads Continue and goes straight back into it, to `resumeTo` — play, or
the layer end's cards (D90); `home` is out of reach
until the dive ends, so the shop never meets a dive in progress.

**New game** is the title's last row (D103). It opens `newGame`, a warning in
red — its sub-line names what goes, the dive in progress among it when there
is one — with Cancel marked, so Enter and Esc erase nothing. Erase everything
and start runs `newGame()`: a fresh `meta`, no dive, a fresh save written
through `saveNow()` — which is what clearing it means, with one save kept —
then `home`.

Mouse buttons ride in `keys` and `justPressed` under codes a keyboard cannot
produce (`'Mouse0'`), so `tapped()` works for either device and the port seam
did not grow a name for clicks. Card rectangles live in `content.js`
(`cardRect`), because the renderer draws them and the logic hit-tests them.

`returnTo` remembers whether help/options was opened from the title or mid-dive.
`reset()` sets `screen = 'playing'` and `diveLive`, so `home`'s Dive row is just
`reset()`. Boot does not reset: the state's own starting values are the title
with no dive, and the water shows the first layer's colour until a plan exists;
`main.js` only loads the save.

## Systems

**Movement — in water** (D107). Direction from held keys, normalised so
diagonals aren't 1.41× faster; the diver's velocity eases toward it times
`player.speed` in `ease()`, with `RAMP_LEFT` of a change still to go after
`player.ramp` seconds — `Math.pow` over `dt`, so a start eases up, a release
glides to a stop and a reversal swings through, the same at any tick length.
Movement still begins on the next tick; only full speed takes time. A raised
speed is reached in the same `ramp`. The body's `facing` turns toward the held
keys the shorter way round, `player.turn` seconds a half circle, and holds when
they are let go; a dive starts facing down. Player clamped to the **view**,
which is `ARENA_W × ARENA_H` from `cameraY` down (D58); an edge stops the
velocity going into it. A fish with a `ramp` eases its chase through the same
`ease()`, so it overshoots a sidestep (`entities/enemies.md`).

**Firing.** Manual since D45, and **armed** since D47: the trigger only counts
once the button has been seen released while playing, and every non-playing
screen disarms it. Without that, the click that picks *Start* is still held on
the first gameplay frame and fires a shot — a menu reads a click as an edge,
the weapon reads it as a held state, so one click was being read twice. While `Mouse0` is held and the cooldown has
elapsed, a shot leaves along the cursor and dies at `player.range` (D8). The
cooldown is clamped at zero rather than allowed to run negative, so holding the
button gives an honest `fireRate` while the first click after a pause is always
instant. Every number of the shot — rate, damage, range, speed, hitbox,
pierce — is the carried weapon's, on the player (D83): `entities/weapons.md`.
A weapon with a `swing` fires no shot (D105): `swing()` cuts, at once, every
fish whose body reaches into the arc toward the cursor, nearest first, and
leaves `swingLeft` on the player for the renderer to draw the wedge.

**Arrivals: the batch queue and the gate** (D27, D48, D54). Enemies come one
**batch** at a time — a record naming counts per type — and nothing new arrives
until the batch is dead. D54 sized the batches on total hp: nothing a dive
picks up raises damage, so hp *is* the clock. Each type arrives where its
`enters` says (`entities/enemies.md`) — the boss from below the view, centred,
everything else at a random edge. Batch `k` of the dive waits at depth `k × GATE_SPACING`; a dive opens with
`GATE_PAUSE` (1.2s) of quiet before the first, and every later batch arrives the
moment the camera reaches its depth. `batchIndex` counts batches begun. The
list does not cycle: past the last batch the same arithmetic points at the
bottom.

**Layers and the plan** (D66, D71, D72). A layer is a record in `LAYERS`: a
name, a water colour and a run of **stretches**, each `{ draw, pool }`. One
shape for all of them — a mini-boss or the boss is a stretch whose pool holds
one batch and draws one. Three layers, each with pools and batches of its own
(D101), all in one shape that `layer()` builds: four from a pool of five, a
mini-boss, four of five, a mini-boss, four of five, the boss — fifteen gates a
layer. They meet the fish in turn: the archer in the first layer's last
stretch, the puffer from the second, the eel in the third, with every type
mixed by its end. The pools are sized by total hp, growing down the dive, until
S6 (balance)'s threat number — Claude's picks.

`reset()` draws the whole dive first thing, before anything else takes from the
seed: `drawPlan()` walks every stretch of every layer and takes `draw` batches
from its pool with `drawDistinct()` — the seeded draw without repeats the mod
cards use too — into the flat `plan` of `{ layer, batch }`,
the last of each layer marked `end`. The abyss is one tall strip (D72), so
entry `k` waits at `gateDepth(k)` whatever layer it is in, depth adds up across
layers, and the bottom is `plan.length`. The layer end heals fully, drops the
boss's haul (its `value`) and opens the pick of valuable mods (D85); the last
layer's end opens no pick and the current carries you to the bottom, which is
`won` (D68). `layerAt(y)` tells the renderer which
layer a depth is in: the water takes that layer's `color` at its top and
darkens to near-black at its end, and the layer's name shows while the current
carries you into it — placeholder graphics, both (D72).

**The descent** (D58). The world is a tall strip and the view is a fixed
1280×800 window onto it at `cameraY`. While a batch lives the camera does not
move — "at a gate" is `enemies.length > 0` — but the **current never stops**:
`current` eases (by `CURRENT_EASE`, on a time base) toward `CURRENT_SPEED`
while travelling and toward `CURRENT_CRAWL` otherwise, and `waterY` advances by
it every tick. The background scrolls by `waterY`, so the water flows through a
fight while the fight itself holds still — and behind the mod cards and under
the death and layer-end screens too, where play stops but the water drifts on
at `CURRENT_CRAWL`. `update()` moves it, once, outside `step()` — the same
reason the shake decays there: `step()` returns early on every screen but
play. The menus alone freeze it; pause is the player stepping out of the game.
Once a batch is cleared — and, at a layer end, its pick taken — the gate block
carries the camera and the player down at `current`, clamped to the next depth
(`gateDepth()`), about two seconds away. The current is independent
of the player: swimming moves you within the view, never the view. Reaching depth
`plan.length × GATE_SPACING` opens the `won` screen. The gate block runs
before the player moves, so the clamp always sees this tick's camera.

Enemies enter just outside the **view**, past its edge by the whole body
(D104), so they fade in from the dark, each at its type's speed spread by
`ENEMY_JITTER`. Difficulty is authored per batch,
not ramped by the clock.

**Enemies** (`ENEMY_TYPES`). Every type — its numbers, its role and its
behaviour, a chase or one of its own — is `entities/enemies.md`; which types a
batch holds is named per batch (D48). Each tick the enemy loop moves every
enemy toward the player, or steps it by its behaviour field (`lungeStep()`;
`spitStep()`, `fuseStep()` and `weaveStep()`, D95), adds the dash's shove, and costs the
player a heart on contact. `makeEnemy()` copies every behaviour field a type
has.

**Bullets** store velocity once at birth and fly straight — that's why shots can
be dodged and why yours sail past into the dark. Each carries an `id`; enemies
remember `lastHitBy`, so a piercing shot damages any given enemy at most once.
An enemy's shot is a bullet with `evil: true` (D95): it skips the fish, sweeps
its segment against the player, and is spent only by a hit that lands.

**The dash.** `Space`, along the facing (D107) — where you swim, or from a
standstill where you last faced — never the cursor, which is usually the
direction you least want to travel in. It ends with the swim carrying on along
it at full swim speed. 0.16s at
`player.dashSpeed` (884px/s) on a `player.dashCooldown` (2.2s) leash,
invulnerable for the dash plus a moment after, so landing inside what you flew
through costs nothing. **Committed**: travel follows the direction frozen when
it started, so live input cannot turn it, reverse it, or stop it by letting go
(D56) — the last of those was a free 0.31s of invulnerability for standing
still. It
pushes a wave ahead of it: everything within `DASH_REACH` of **the line it swept
this frame** that the dash is facing (`DASH_ARC`, a 156-degree front) is shoved
away at `DASH_PUSH`, bleeding off per second, and takes `player.dashDamage` —
which is **0 until bought** (D51).
The facing is frozen at the dash's start in `dashDx/dashDy`, so releasing the
keys mid-lunge cannot spin the wave, and it is judged from where the frame
started — otherwise something the dash swept through would read as "behind me"
purely because the step overshot it (D50).

**The shove is free; the wound is bought** (D51). `dashDamage` starts at 0 and
the `Impact` mod buys it a point at a time. The push is never gated: scattering
a crowd is what makes diving into one a play rather than a mistake, and that has
to work at tier 0. The white hit flash *is* gated, because a flash reads as
"that hurt" and firing it on a harmless push is a lie.

Dash reach is `dashSpeed × DASH_TIME` — 141px at the start — and nothing a
dive picks up lengthens it: `dashSpeed` is its own field, not a multiple of
`speed`, so `Fins` does not feed it (D56). Only the Dash reach attribute does,
at `home` (D75). The dash takes
its id from the bullet id space, so `lastHitBy` stops it hitting the same enemy
twice — the same trick as pierce. Enemies carry `pushX/pushY` for the shove,
their only velocity; everything else about them is a fixed walk toward you,
or a lunger's step (D64).

The player never blinks while dashing even though `hurt` is set, because the
i-frame blink is what made the dash read as a teleport. An afterimage spark each
frame and a ring on landing (`dashEnd`) do the rest.

**Collision.** Brute force, every bullet against every enemy, compared in
**squared** space — which measured 8.3× faster than `Math.hypot` over 3.2M
pairs. Fine to a few hundred per array; a spatial grid is the documented next
step.

Both fast hitboxes are **swept**, not sampled: `segDistanceSq()` measures an
enemy against the segment the bullet or the dash crossed this frame, rather
than the point it ended on (D50, D53). A point test misses whatever it stepped
over, which is a function of speed, and speed is not bounded — a railgun is
named in S1's own definition of done. The squared form is used because these
are the per-frame loops and that rule does not lapse because the shape became a
capsule.

**Mods: the glowing fish and the layer end's pick** (D84, D85, D87, D88).
There is no rank, no XP bar and no curve. When a batch of the plan arrives,
`light()` picks one of its fish at random and marks it `carrier` — the gold
ring, from the start. Never a type with `carries: false`, the boss and the
mini-boss: a mini-boss's gate pays no mod, and the boss's batch is paid by its
pick. Enemies placed by hand belong to no batch and carry nothing. Each enemy
keeps its type's `name`, which is how `light()` reads `carries`. Killing the carrier drops its mod into `drops` —
kept apart from `gems`, since currency has nothing to do with mods — and it
flies to you at `GEM_PULL` and never fades. `collectMod()` takes it and names
it on the pickup line, `banner`, with its numbers from `modPreview()` — a line
of its own, so it never writes over a micro-task's `notice`.

Which mod a fish carries is `drawCarried()`'s: an ordinary mod — not one of the
layer end's own, `end` — still under its cap, every one once before any comes
again. `modRound` holds the round, which refills once every mod still open has
come in it. Both draws, this and the layer end's, measure the cap with
`held()`, which counts a mod still flying to you: nothing stops it landing, so
its slot is taken the moment it drops. With every ordinary mod capped it returns nothing and no fish
lights: the easiest answer while caps are balance's question (Igor,
2026-10-12).

Clearing a batch pays the micro-tasks and `Mend` (`mendOnClear`). At a layer
end it also starts `offerTimer` at `MOD_OFFER_DELAY`, because the boss's kill
burst lives 0.5s and cards landing on the frame of the kill read as a jump cut
(D51). When it expires, `openModOffer()` deals `rollValuable()` — up to three
distinct mods, each with room under its cap for what its card gives
(`cardStep()`): one of the layer end's own once, an ordinary one `END_STEP`
picks at once — and opens the `mods` screen, the middle card marked. That is
the dive's one pause, and a pending offer holds the batch queue, so the descent
waits for Continue. The last layer's end pays neither Mend nor a pick (D59,
narrowed by D68). If the same frame kills the boss and the player, the death
screen wins: `clearBatch()` is guarded by `screen === 'playing'`.

The pool — every mod, its cap and its card — is `entities/mods.md`. It is
**body and comfort**, and **weapon mods** dealt only while a weapon they fit
is carried — `fits()`, read by both draws (D99) — and **every mod is capped**
(D69).
`takeMod()` is the one place a mod is applied and counted: a fish's, a card's
(`cardStep()` times), a scenario's kit. Mods are dive-scoped: `reset()` clears
them. They add on top of gear and attributes, never multiplying (D74).

Anything a mod raises is a field on `player` rather than a `const` — that is why
`iframes` and `dashCooldown` live in `PLAYER_START`.

**Boosts** (D86). Every kill counts toward the next boost in `sinceBoost`; the
chance on the next kill is `BOOST_C × sinceBoost`, and a boost dropping starts
the count again. The kill that empties the arena never drops one. Which boost
is a seeded draw from `BOOSTS` (`entities/boosts.md`). It lies in `drops` where
it fell, unpulled, for `BOOST_LIFE` seconds, blinking over the last of them
(`BOOST_BLINK` in `render.js`), and touching it runs `startBoost()`: its `add`
goes onto the player and `{ name, left }` into `boosts`. Touched again while it
runs, its clock restarts and nothing more is added. Each tick of play counts
`left` down and takes `add` off at zero, so the pause and the layer end's pick
hold it. A boost never moves `hp`, which could not be taken back cleanly.

**Currency.** Kills drop gems at the corpse, and every gem flies to you at
`GEM_PULL` from wherever it dropped and never fades — nothing can be stranded,
by distance or by the descent (D35, as amended by D78). Every kill drops its
`value` in gems today; whether an enemy drops at all is a balance lever, S6's
(D78). D35's `+N` popup is not built — feel, S7's. Collecting one adds to the dive's
`currency`. When the dive ends, however it ends, `endDive()` banks it into
`meta.bank` (D67) — last in the tick, after every gem that tick paid, so a gem
caught on the frame you die is yours. Nothing in the code names the currency,
because what it is called is still open in `ideas.md`.

**What persists** (D31, D36, D75). `meta` in `state.js`: `version`, `bank`,
`gear` (tiers owned, by name), `spent` (attribute points spent, by name),
`tasks` (per layer number, the micro-tasks it has paid — numbers, since the
names are placeholders, D89), `deepest` (the deepest
camera depth reached, shown in metres at 10px each) and `cleared` (layers
cleared, which is what unlocks the next at `home`), `owned` (the weapons owned,
by name) and `carried` (the one a dive carries, D97). Points available are
**derived** — `points()`, earned from `tasks` less `spent` — never stored.
`reset(seed, weapon)` builds the player as `PLAYER_START` carrying `weapon` —
the one `carried` names, or the first if the save names one that is gone, or a
scenario's — its numbers copied on (D83) and its name kept as `weaponName`,
plus each tier of that weapon and of the equipment,
plus each attribute point; mods then add on top as they are picked up. All sums. A weapon
left at `home` adds nothing.

- `WEAPONS` and `EQUIPMENT`: the gear for sale, a tier at a time, by name
  (`entities/`). `buy()` refuses what the bank cannot pay, and past the top
  tier. A weapon is owned first: `pickWeapon()` owns one for its `cost` and
  carries it at once, carries an owned one for nothing, and raises the tier of
  the one carried (D97). What costs nothing is owned from the start.
- `ATTRIBUTES`: **Dash reach**, each point +150px/s of `dashSpeed`, 141 → 165 →
  189px of dash; **Heart**, each point one more heart, full; **Strength**, each
  point +1 `dashDamage` — the dash hurts what it shoves (D98). `raise()` refuses
  without a point.
- `requires` on any piece of gear: `{ attribute: points }`. `meets()` holds it
  against the points spent; unmet, `canOwn()` and `canBuy()` refuse, the row is
  dim and says what it needs. Scheduling, not scaling (D36, D98).
- `TASKS`, each paying 1 point once per layer, ever (D98): **untouched** — a
  batch cleared with `batchHit` still false; **swift** — a batch cleared within
  `SWIFT_TIME 10` seconds of arriving (`batchTime`); **footwork** — a mini-boss
  beaten without a dash (`batchDashed`), its batch known by its fish so a
  restored plan still matches. `met(entry)` reads the dive and the plan entry
  just cleared. Judged in `clearBatch()` before the layer end's heal; the
  payout shows as a line (`notice`, for `NOTICE_TIME`) over play. Enemies
  placed by hand (a scenario's) belong to no plan entry and pay no task.

All the numbers are Claude's picks, S6's to tune. Buying and raising write the
save at once.

**The save** (D70, D77). `saveText()` is `meta` plus `dive`: `snapshot()` when a
dive is under way (`diveLive`), else `null`. `snapshot()` copies every variable
a dive owns — the player, every entity array (`drops` among them), the plan,
the queue, camera, current and water, the timers, currency, `modCounts`, the
mod round, the boosts running and `sinceBoost`, `weaponName`, `guardLeft`,
`batchTime` and `batchDashed`, the RNG's
state and `bulletId` — with the offered cards by name and `at`, the screen play resumes
to. `restore()` is the reverse and leaves `resumeTo` set, so Continue goes
straight back to it (D90). `loadSave(text)` returns `''` when it loaded or found nothing,
and otherwise a reason, having changed nothing; `main.js` then copies the text
aside under `abyss-save-rejected` and the title says why. Written through
`saveNow()` on pause, on a purchase, when a dive ends, and — asked by `main.js`
— when the page is hidden or closed; never in the debug mode. `SAVE_VERSION` is 4. `migrate()` brings an older save up
one version at a time as it loads: a v1 dive's player gains the Gun's shot
speed and radius as they were then (D83); a v2 dive loses its rank, starts with
nothing dropped or running and no fish lit in the batch it was in, and — saved
with the cards up — takes the card it had marked (D84); a v2 save's
micro-tasks move from the layers' old names to their numbers (D89); a v3 save
owns and carries the Gun, and its dive carries it with no guard and its
batch's clock starting as it loads (D97, D98, D100).
`tests/fixtures/save-v1.json`, `save-v2.json`, `save-v3.json` and `save-v4.json`, each written
by the first build of its version, must all load in every later build.

**Damage.** Contact, an enemy's shot or a burst costs 1 HP behind 1s of
invulnerability, during which the player blinks — without the i-frames a
touching enemy drains 3 HP in 50ms. Every hurt goes through `hurtPlayer()`
(D95): `immortal`, the i-frames, `batchHit`, the shake and death in one place
— and the suit's guard, which takes the hit instead of a heart while
`guardLeft` lasts, refilled to `player.guard` as each batch arrives (D100).

**Feel.** Hit flash (0.07s white), sparks kicked back along the shot on every
hit, a bigger burst on kills sized by enemy toughness, screen shake (7px on a
hit, 38px on death) easing out exponentially to a still picture at ~2s.

**Sound.** Every sound is one oscillator plus a volume envelope, defined as
data (`freq, dur, type, vol, slide`). No audio files. Routed through a master
gain and a compressor so a dozen simultaneous kills don't clip. The context is
built on the first real key press and resumed on later ones; the HUD reports
its state so a silent game can say why it's silent.

## Randomness

Every random number in a dive comes from `rng()` in `game/state.js` — mulberry32,
seeded, so the same seed replays the same dive exactly (D41). `reset(seed)`
reseeds; `currentSeed` records what was used. `main.js` reads `?seed=<n>` off the
URL and passes it to a scenario (`?dev=`), because `game/` never touches a
browser API; a dive begun from `home` always draws a fresh seed.

The one `Math.random()` left in `game/` is in `reset()`, choosing a seed when
none is given — that choice is outside the deterministic sequence.

Why it matters: two balance measurements can now be of the *same* dive instead of
two different ones, so a difference under a second is visible without averaging
21 dives. And "it broke sometimes" becomes "it broke on seed 4471".

## The development readout

Two on-screen readouts exist to be looked at while building, not to ship
(D52). Igor: "i'd always show all relevant numbers at least at the development
stage."

`PLAYER_STATS` (`content.js`) is a flat list of the player numbers worth
watching, drawn dimmed as the status bar's last line (below); the fps line
shifts below the bar from its `.length` rather than a hardcoded `y`. Each entry names the player field as
well as its label, which is what lets a check prove the list is **complete**:
every stat any mod or boost can change must be on screen, computed from the
tables, so a new one touching a new field fails the suite rather than going
unwatched (D99).

## The status bar

What a diver reads mid-fight, top-left, one line per kind, built by
`statusLines()` in `content.js` — so its text ports, and a check reads it —
and drawn by the renderer one row per entry, each in its own colour: hp, the
suit's guard left (only with a suit), gems and the carried weapon with its tier,
in bold; the layer, the batch within it — the one fought, or between gates the
one ahead — the fish left, time and kills; the mods held and the boosts
running with their seconds left (D86); the layer's micro-tasks, ✓ once paid;
then the development readout, above. Built from Igor's note, 2026-10-14:
"missing info for the status bar during dive, make sure to add everything" —
how it looks is Claude's.

Each mod card shows the change it makes and how many are held, and so does the
pickup line when a fish's mod reaches you (D84). `modPreview(mod, n)` applies
the mod `n` times to a copy of the player and diffs the numbers, so neither can
advertise something `apply` does not do — the alternative, a written-out
`preview` per record, is a second source of truth. The card reads held/max
straight from `modCounts`. Without this a repeated card was identical to a
fresh one, and four of the six mods stack.

This is instrumentation and it partly contradicts D34 (mods), which wants no
numbers on a card. Scoped to development on purpose; revisit at S7.

## Screens must fit

Any screen that stacks rows from a data table derives its positions from
`.length`, never a hardcoded `y`. `render.js` exposes `HINT_Y` (where the
bottom hint sits) and `helpBottom` (where the help screen's last line ends), and
a check asserts one is above the other — adding a row to `HELP_KEYS` once pushed
the list straight through the blurb below while every check passed (D46).

The same rule sideways: a mod description is prose in a fixed-width card, and
the renderer centres it, so it cannot notice one overflowing. `widestModDesc()`
measures the pool at `CARD_DESC_FONT` and a check holds it inside
`CARD_W - 2 × CARD_PAD`. Two descriptions were over when it was written (D49),
which is how it was found — from a screenshot, not from a check.

The layer end's cards, Continue and its hint stack downwards from
`cardRect()` and `continueRect()`, and a check holds the hint inside the view:
taller cards push all three down (D85).

Help, the mod cards and `home` are guarded — `home` twice: its layer list
(`MENUS.home.lines`, with every layer shown) ends above its rows, and its rows,
read from `rowRect()`, above the hint; `HOME_TOP` is derived from
`LAYERS.length`. Every menu's rows are held above the hint too, wherever
`rectOf()` puts them — the gear and attribute lists (D96) and the debug
setup's grid (D102) grow from tables. Options stacks its rows the same way and
is not.

## Scenarios

Named dev setups in `SCENARIOS` (`game/content.js`), loaded by URL (D37, D42).
Every scenario and the URL for it, and how to combine arguments, are in the
root `README.md` → Scenarios. `?dev=<name>` loads one **frozen** —
nothing advances until `advance(n)` — and `&play` runs it live.

`applyScenario(name, seed)` looks the record up and `startScenario(s, seed)`
plays it — the debug mode's setup goes through it too. It resets, then applies
the record: `batch` to start
at that batch's depth — a number, or a function of the drawn plan where the
place is only known once drawn — `spawn: false` to stop new arrivals
(`queuePaused`), a list of `[type, x, y]` placed in the view at nominal speed
with no jitter, and a `kit` of mod names taken as picks. An
unknown name logs the known ones and does not throw. A scenario never reads or
writes the save.

The two dev flags, `immortal` and `damageOverride`, survive Dive again: the
debug mode's setup sets them at every dive, and the tests and the bot set them
directly; `reset()` leaves them alone and re-applies the damage. No URL sets
them. `?test` runs only as the whole query.

`advance(n)` runs exactly n fixed ticks and draws once — no wall clock involved.
This is what the bot drives, and the same entries it selects by name, so there
is no separate test harness. Adding a scenario is a line.

## The debug mode

For playtesting by hand (D102): `?debug` boots into `openDebug(code, seed)`
instead of the title — a fresh `meta`, no dive, no save read, muted until M —
and the `debug` screen, a menu of value rows in four columns built from the tables
(`DEBUG_COUNTS`: the fish, equipment, attributes, mods and each weapon's tier,
each with its cap). `debugSetup` holds the setup, and stays set for the
session: while it is, `saveNow()` writes nothing.

A setup is text too: `setupCode()` writes it — `L2,G7,S4471,Harpoon2,puffer4`,
the layer, gate, seed and weapon always, the rest only when set — and
`parseSetup()` reads it back, keeping what it cannot name in `ignored`, shown on
the screen, and holding every number in range (`clampSetup()`). `main.js`
keeps the address bar on `?debug=<code>` as the setup changes, so the URL
replays it exactly.

`debugDive()` plays it: a `meta` standing in for what persists — the setup's
gear, the carried weapon's tier and the points — so `reset()` applies them as a
dive from `home` would; the setup's immortal and one-shot; then
`startScenario()` to the chosen gate, with the mods as its kit — a weapon mod
only with a weapon it fits. Fish set in the setup replace that gate's batch in
a copy of its plan entry, never in the pool; the dive then runs on as drawn.
`gateLine()` says on the screen what the gate drew and what replaces it, and
under it the marked row's `tip` says what the row is and what it moves:
`fishTip()` from a fish's behaviour field — its words in `DEBUG_BEHAVIOURS`,
one line per behaviour — and its numbers; `gearTip()`, `pointTip()`,
`modTip()` and the weapon's from what each tier, point or pick moves, worked
out by `modPreview()` on the diver a dive starts with (`shotOf()` gives the
carried weapon's numbers), so a tip cannot state a number the game does not
deliver. A check holds every tip inside the view's width.

`DEBUG_AGAIN` (R) plays the setup again from any screen, and `DEBUG_SETUP`
(Backspace) goes back to it; neither does anything outside the debug mode.
The pause menu's quit and the end screens' two buttons — Again and Setup
there — lead back to the setup too, never to the title or `home`.

## Performance, measured

Chrome, 3440x1440 (scale 1.8), 60fps budget 16.7ms, 2026-09-27 (D43):

| Load | `draw()` | of which glow | `update()` |
|---|---|---|---|
| 250 entities | 0.10ms | 0.02ms | — |
| 500 entities | 0.20ms | 0.05ms | 0.55ms @ 100k pair checks |
| 1000 entities | 0.58ms | 0.33ms | 1.22ms @ 400k pairs |
| 2000 entities | 2.72ms | 2.18ms | 3.67ms @ 1.6M pairs |

At the design budget of 500 a whole frame is under 1ms — about 5% of 16.7ms.
`shadowBlur` is used directly per frame; the offscreen cache was cancelled
because it would have saved 0.3% of a frame at the cost of a radius
quantisation scheme and resize invalidation.

Re-measure with a stepped scenario before trusting these; they are a snapshot of
one machine.

## Tests

Two suites (D39, D44).

| | Command | Covers |
|---|---|---|
| **Node** | `npm test` (`npm run test:watch`) | The seam, property-based invariants over generated seeds — no NaN ever, hp bounds, view bounds, seeded replay, time-based decay — the descent (`tests/descent.test.js`: the camera never moves while a batch lives but the water keeps flowing, the next batch is under 3s away, the camera stops exactly at each depth, swimming does not hurry the current, no cards open between batches nor at the last layer end, the water flows behind the layer end's cards and drifts under the death and layer-end screens, pausing freezes the camera and the water, aim and arrivals follow the camera, the dive ends at the bottom and its Dive again dives), the boss (`tests/boss.test.js`: a lunger never charges without a full wind-up, holds its line through it and stays in the view without jumping; the mini-boss winds up longer and is weaker; the boss rises from below, centred; every layer ends on the boss with two lone mini-bosses along the way; a mini-boss carries no mod and opens no cards), S4 (`tests/meta.test.js`: the plan — same seed same batches, two seeds different, every batch from its own pool and never twice, pools larger than their draws; going on through a layer end with a heal and the cards, then the next layer with nothing between; the boss's haul; the `layer-2` kit; no mod past its cap, whatever the fish carry and the layer ends offer; every gem reaching the player; death banking the gems; `home`, buying, points and the micro-task; a layer's micro-tasks kept by number through a rename; Continue going straight back into the dive; New game asking first, and erasing everything only once confirmed (D103); the death screen's Dive again and Go home, Go home marked, a click off them doing nothing; a hand-placed enemy paying no task; the save restored at any tick playing on identically, meta round-tripping, bad saves refused, the v1 to v4 fixtures loading and firing finite shots, a dive saved with a shot in flight and a puffer swelling playing on identically), mods from drops (`tests/drops.test.js`: one fish lit as every ordinary batch arrives, never a mini-boss or the boss, the mod dropped even when the batch dies at once, flying in, counted, applied and named on a line of its own, nothing lit once every ordinary mod is capped, every ordinary mod once a round and the same from the same seed; the layer end's three valuable cards, none without room for its step, a click or a number marking, Continue or Enter taking; boosts never 1/C kills apart and seldom back to back, never from the arena's last kill, left where they fell and gone after their life, added on a touch and taken back after their time, restarted not stacked, held by the pause, every boost on and off; weapon mods dealt only for a weapon they fit; no rank in the save; a v2 dive saved with the cards up taking its marked card, the glowing fish kept across a save — D84–D88), the weapon record (`tests/meta.test.js`: the carried weapon's numbers on the player and on every shot, tiers of their own, a weapon left at home adding nothing — D83), S5 (content) (`tests/enemies.test.js`: the archer closing, holding, backing off, coming into view before it spits and spitting on its cadence, its shot costing a heart or passing invulnerability unspent, never hitting a fish, dying at its travel; the puffer lighting near and in view, still but for the shove, bursting on time inside its ring and not outside and chasing on, lighting again only after its chase, dying like any fish when shot, never bursting once cut down, paying nothing for a burst (D106); the eel swaying one way and the other within its width while closing in — D95; `tests/meta.test.js`: Gear and Attributes screens; owning, carrying and the carried weapon's tiers, a missing weapon falling back, a scenario's weapon; Heart, Strength and requirements; the Harpoon and the Knife; the Mask, the Weights and the suit's guard; swift and footwork; every layer's own pools, every type met; the counts — D93, D96–D101; the status bar naming the layer and the batch within it, the fish left, the weapon and its tier, the guard, the mods and the tasks), the debug mode (`tests/debug.test.js`: muted from the start, and only there; a fresh kit whatever the save held, nothing saved on pause, at a dive's end or when the platform asks, `main.js` saving only through `saveNow()`; the kit, the place and the fish as set, the pool untouched, a weapon mod that does not fit left out, the flags switched by the setup; the code round-tripping, ignoring what it cannot name, holding every value in range; R replaying the same dive and inert outside the debug mode; every way out leading to the setup; the rows built from the tables and moved by keys and clicks — D102), movement in water (`tests/movement.test.js`: moving on the first tick but at full speed only after the ramp, a glide and a reversal that swings through, the same swim at any tick length, a raised speed in the same ramp, no speed banked against an edge, the facing turning the shorter way and holding, the dash along it from a standstill with the swim carrying on, a fish with a ramp overshooting a sidestep, a v4 save at rest — D107), the bot starting from a scenario, the dev flags, and the docs (D57) — among them the entity docs' tables against `game/content.js` (D81) and the map in `docs/README.md` (D82). Vitest + fast-check, dev-only. |
| **Browser** | `index.html?test` | The scripted checks (count under Verification), plus what Node cannot reach: audio peak levels, canvas, real `KeyboardEvent`s through `platform/input.js`, and the same seed played to the bottom of the dive at three window sizes through real `MouseEvent`s (D29). |

`tests/harness.js` runs `game/` in a Node `vm`. `let` and `const` at the top of a
classic script are lexical bindings rather than properties of the global object,
so the harness generates accessors to expose state and constants.

**A property test is only as good as its generator.** The no-NaN invariant
initially passed even with a divide-by-zero guard deleted, because the generator
never put the cursor exactly on the player. It now does so 8% of the time. Treat
an invariant as unproven until a deliberate break makes it fail.

## Driven runs are silent

`?test` and any `?dev=` scenario boot with `volume = 0`: those are the URLs
Playwright drives, and a driven run should not make noise on the machine
running it. Playing the game normally — no query string — is unaffected. The
debug mode is played by hand, so it is muted rather than silenced: `muted`
starts set, and M, as anywhere, turns the sound on (D102).

It does not weaken the audio checks. They synthesise each sound in an
`OfflineAudioContext` and measure its peak there, which never reaches the
speakers and never reads the live master gain; all eight still pass muted. The
headless bot has no audio at all, since `sound` is stubbed at the seam.

The one trap: the options check drives the volume control, and `change()`
plays a sound to preview the new level. It restores whatever the run booted
with rather than a hardcoded 0.6 — the hardcode silently un-muted the whole
remainder of the suite.

## Local server

`python3 serve.py 8222`. Needed only for Playwright, which refuses `file://`.
It forbids caching and is threaded — see D41 for why the stock `http.server`
is not usable here. Double-clicking `index.html` still needs no server at all.

## Balance constants

All in `game/content.js` under `// balance`. These are the real product of the
prototype — they transfer to any port verbatim. The entities' numbers — the
weapons' among them — are in their docs in `entities/`; the rest are here, and
`npm test` holds them to the code.

`PLAYER_START`, the diver (r 20, speed 260, ramp 0.25, turn 0.2, hp 3, maxHp 3,
iframes 1, dashCooldown 2.2, dashSpeed 884, mendOnClear 0, dashDamage 0,
guard 0) · `RAMP_LEFT 0.05` ·
`GEM_PULL 600` · `NOTICE_TIME 2.5` · `ENEMY_JITTER 0.3` ·
`GATE_PAUSE 1.2` · `GATE_SPACING 400` · `CURRENT_SPEED 200` ·
`CURRENT_CRAWL 30` · `CURRENT_EASE 0.05` · `MOD_OFFER_DELAY 0.6` ·
`END_STEP 2` · `BOOST_C 0.02` ·
`BOOST_LIFE 6` · `FIXED_DT 1/120` ·
`MAX_FRAME_DT 0.05` · `DASH_TIME 0.16` ·
`DASH_GRACE 0.15` · `DASH_REACH 40` · `DASH_ARC 0.2` ·
`DASH_END 0.18` · `DASH_PUSH 320` · `PUSH_DRAG 0.02` · `SHAKE_FADE 0.02` ·
`SHAKE_FLOOR 0.15` · `SHAKE_HURT 7` · `SHAKE_DEATH 38` · and the tables
the entity docs do not cover: `ATTRIBUTES` (Dash reach: +150px/s a point;
Heart: +1 heart; Strength: +1 dash damage) ·
`TASKS` (untouched, swift, footwork: 1 point a layer each).

## Verification

**`index.html?test`** runs the suite in the console (currently **194** checks —
this doc owns that count; `roadmap.md` cites it). It is what actually
**executed** — more than `grep -c` finds, because some call sites sit inside
loops.
Covering: arrivals and the gate, collision, i-frames, bullet range, piercing,
gems flying to you from anywhere, every screen transition, cursor wrapping, each option, non-Latin
keyboard layouts, shake settling, frame-rate independence, that every sound is
loud enough to hear, that shots follow the cursor, that the dash's wave reaches
past the body but only forwards and shoves what it hits, that every screen
answers the mouse as well as the keys, that a fast dash hits what it sweeps
through rather than stepping over it (D50), that the dash shoves for free but
only wounds once bought and never flashes an enemy it did not hurt, that a
gate opens no cards (D84) while the layer end's offer waits out the boss's
death before it appears (D51), that the offer freezes the queue behind it, that
every mod is body, comfort, or a weapon mod naming real weapons, that a mod without room for its card is
not offered, that a click or a number marks a card and Continue takes it (D85),
and that each comfort mod does what its card says. Since D58: that the next batch waits
on the descent and arrives at its own depth, and that the same seed reaches
the bottom of the dive in the same time at 1280×800, 1920×1080 and 3440×1440, driven through
real mouse events (D29), and that a dim screen darkens the letterbox margin as
much as the view. Since S4: that Start goes `home` between dives and Dive
begins one, that `home`'s layer list and rows fit, and — since D90 — that a
click on the death screen takes only the button under it, and that a
Russian-layout W moves its cursor to Dive again. Since S5 (content): that every
menu's rows end above the hint, that every stat a mod or a boost moves is on
the readout, and that `all-types` places one of every ordinary type.

A check that expects a shot to land must set `aim` itself (`aimAt()`). Four
checks once passed only because the previous check happened to leave the cursor
on the firing line.

**Balance** is measured by driving `update()` faster than real time with a
scripted bot, on the same five seeds per configuration, paired (D41). The
figures live in `roadmap.md` → Health and only there, along with the caveat that the current bot is a weaker
driver than the pre-mouse-aim one and is comparable only to itself.

**Feel is never asserted** — that judgement is Igor's.

## Gotchas

- **Cache.** Eight files means a hard refresh (⌘⇧R) matters; a partial cache
  gives you a mix of old and new, which produces baffling bugs.
- **`?test` is an exact match** on `location.search === '?test'`, so
  `?v=whatever` cache-busting does not trigger the checks.
- **Time-based decay must use `Math.pow(x, dt)`**, never a per-frame factor.
