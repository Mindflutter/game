# Design — how Abyss works today

Describes the **present**, not the plan. Update it when reality changes.

**The present is partway to the design.** S1 — Combat core is closed: the
weapon is manual (D45), the batch queue and gate are in (D48), rank and mods
are in (D49), and the simulation runs on a fixed timestep (D53). S2 — The dive
is closed: one layer scrolls under a camera, a current carries you between gate
depths, and the layer ends at the bottom (D58). There is no `home`, no boss and
no layer completion yet. Nothing here is a statement of intent.

## What it is

A twin-stick action game, diving down one **layer**. You move with WASD, aim
with the mouse and **fire by holding the left button** (D45). The dive stops at
each gate depth while a **batch** is alive — no further in enemies, though the
water keeps flowing; clearing one raises your **rank** and offers three **mods**
in the quiet beat that follows, the only pause in a dive (D33, D49). Then a
current carries you down to the next batch, about two seconds away and
independent of anything the player does (D58). Kills drop gems, which are
money and buy nothing yet. A dive ends in death or at the bottom of the layer;
the measured times live in `roadmap.md` → Health, and only there.

## Files

```
index.html              shell: canvas, CSS, eight script tags in load order

game/       content.js  every tuning number + all content tables
            state.js    dive state, settings, reset(), openScreen()
            logic.js    step() — arrivals, the gate, the descent, movement,
                        collision
                        ── 1184 lines. Survives the port.

platform/   input.js    keyboard + mouse → keys / justPressed / aim
            audio.js    WebAudio synthesis
            render.js   canvas, view scaling, the camera, every draw function
main.js                 frame loop, dt, fps, boot
                        ── 658 lines. Rewritten on the port.

checks.js               the ?test suite → the port's regression tests
```

Line counts are as of 2026-09-28. Regenerate rather than trust them:
`wc -l game/*.js platform/*.js main.js`. The check count is whatever the suite
*reports*, never a grep — some call sites sit inside loops.

The platform share is **36%** (658 of 1842). D17 measured 23% on 2026-09-12 and
it was 42% on 2026-09-19; it fell because `game/` grew (the batch queue, mods)
while `platform/` did not, and S2 held it level — the camera is one translate
and the specks, depth tint and margin cover are a few dozen lines. This is the number to watch — CLAUDE.md says not to
invest in the canvas layer, and this is what that rule looks like when it slips.

Plain `<script>` tags, not modules, so `file://` works. **Load order matters**
and is documented in `index.html`.

### The port seam

`game/` contains no `ctx.`, `canvas`, `document.`, `window.`, `AudioContext` or
`addEventListener` — verified by grep, not assumed. It reaches into `platform/`
for exactly six names:

| Name | Owner | Rust/C++ equivalent |
|---|---|---|
| `sound(name, pitch)` | `platform/audio.js` | any audio crate/lib |
| `keys` | `platform/input.js` | a held-key set |
| `justPressed` | `platform/input.js` | an edge-triggered set |
| `tapped(codes)` | `platform/input.js` | trivial helper |
| `moveCursor(i, len)` | `platform/input.js` | trivial helper |
| `aim` | `platform/input.js` | cursor position in **view** coords; `game/` adds `cameraY` |

Exactly six, and **enforced rather than claimed**: `npm test` loads `game/` into
a Node `vm` with only these six stubbed, so reaching for a seventh fails the
build. That check found the seam had quietly grown to eleven — `LEFT`, `RIGHT`,
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
title ──Start──> playing ──Esc──> paused ──Quit──> title
                   │ ▲              │
      batch cleared│ │ pick         ├──> help ───Esc──> back to caller
                   ▼ │              └──> options ─Esc──> back to caller
                 mods
                   │
                 death ──R──> playing
                 bottom       ──Esc──> title
```

The mod screen takes three inputs for one choice: `A`/`D` or the arrows
move `choiceIndex` (it opens on the middle card), Enter or Space takes the
highlighted one, a click takes the one under the cursor, and `1`/`2`/`3` still
take theirs outright. The mouse only moves the highlight when it has actually
moved — a cursor resting on a card would otherwise overrule the keys every
frame, which is why `lastAimX`/`lastAimY` exist.

The title, pause and options screens work the same way: hover moves the
cursor, a click activates the row, and on options a click cycles the value
exactly as Enter does. Help and the two end screens take a click as "go on".
The end screens — `dead` and `bottom` — share one draw function and one input
branch; the bottom is a stop, not a win, and reports only the time (D58).
Menu and options rows are full-width bands from `rowRect` in `content.js`.

Mouse buttons ride in `keys` and `justPressed` under codes a keyboard cannot
produce (`'Mouse0'`), so `tapped()` works for either device and the port seam
did not grow a name for clicks. Card rectangles live in `content.js`
(`cardRect`), because the renderer draws them and the logic hit-tests them.

`returnTo` remembers whether help/options was opened from the title or mid-dive.
`reset()` sets `screen = 'playing'`, so Start is just `reset()`; boot calls
`reset()` then overrides to `'title'`.

## Systems

**Movement.** Direction from held keys, normalised so diagonals aren't 1.41×
faster, times speed times `dt`. Player clamped to the **view**, which is
`ARENA_W × ARENA_H` from `cameraY` down (D58).

**Firing.** Manual since D45, and **armed** since D47: the trigger only counts
once the button has been seen released while playing, and every non-playing
screen disarms it. Without that, the click that picks *Start* is still held on
the first gameplay frame and fires a shot — a menu reads a click as an edge,
the weapon reads it as a held state, so one click was being read twice. While `Mouse0` is held and the cooldown has
elapsed, a shot leaves along the cursor and dies at `player.range` (D8). The
cooldown is clamped at zero rather than allowed to run negative, so holding the
button gives an honest `fireRate` while the first click after a pause is always
instant. There is no longer any "hold the shot unless something is in range"
rule — that existed only to stop an automatic weapon emptying itself into open
water, and `enemyInRange()` was deleted with it.

**Arrivals: the batch queue and the gate** (D27, D48, D54). Enemies come one
**batch** at a time — a record in `BATCHES` naming counts per type — and nothing
new arrives until the batch is dead. Twelve batches, sized on total hp and
ramping 10 to 68 (D54): the weapon does 2.5 hp/s and no mod raises damage, so
hp *is* the clock, and the previous set held 3 to 15 which made every batch
trivial. Batch `k` waits at depth `k × GATE_SPACING`; a dive opens with
`GATE_PAUSE` (1.2s) of quiet before the first, and every later batch arrives the
moment the camera reaches its depth. `batchIndex` counts batches begun. The list
does not cycle: past the last batch the same arithmetic points at the bottom.

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
Once a batch is cleared and the mod is taken, the gate block carries the
camera and the player down at `current`, clamped to the next depth
(`gateDepth()`), about two seconds away. The current is independent
of the player: swimming moves you within the view, never the view. Reaching depth
`BATCHES.length × GATE_SPACING` opens the `bottom` screen. The gate block runs
before the player moves, so the clamp always sees this tick's camera.

Enemies still enter 40px outside the **view** so they fade in from the dark, with
±15% speed jitter. What is gone: the time-based spawn director, and with it the
speed ramp and the weighted type-unlock roll. **Difficulty is authored per
batch now, not ramped by the clock.**

**Enemy types** (`ENEMY_TYPES`). No unlock times any more — which types appear
is named per batch (D48):

| | radius | hp | speed | value | role |
|---|---|---|---|---|---|
| drifter | 9 | 1 | 85 | 1 | the baseline swarm |
| darter | 6 | 1 | 190 | 1 | fast enough to punish lazy kiting |
| bulwark | 17 | 6 | 52 | 3 | soaks shots, blocks escape routes |

`value` is how much currency it drops. It was `xp` until D49.

**Bullets** store velocity once at birth and fly straight — that's why shots can
be dodged and why yours sail past into the dark. Each carries an `id`; enemies
remember `lastHitBy`, so a piercing shot damages any given enemy at most once.

**The dash.** `Space`, in the direction of the held movement keys — never the
cursor, which is usually the direction you least want to travel in. 0.16s at
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
keys mid-lunge cannot spin the wave.

**Swept, not sampled** (D50). The wave used to be a circle at wherever the
player landed that frame, and a dash covers `speed × 3.4 × dt` — which grows,
because `Fins` raises speed with no cap and `dt` stretches on a slow frame. At 8
Fins on a 20fps frame the dash stepped 105px against a 49px reach and flew
through what it should have hit, connecting on 27% of the positions an enemy
could occupy. `segDistance()` measures the enemy against the segment travelled
instead, and facing is judged from where the frame started — otherwise something
the dash swept through reads as "behind me" purely because the step overshot it.
Bullets have the same hole and do not have this fix; that is the fixed timestep,
still open in S1.

**The shove is free; the wound is bought** (D51). `dashDamage` starts at 0 and
the `Impact` mod buys it a point at a time. The push is never gated: scattering
a crowd is what makes diving into one a play rather than a mistake, and that has
to work at tier 0. The white hit flash *is* gated, because a flash reads as
"that hurt" and firing it on a harmless push is a lie.

Dash reach is **fixed at 141px** and does not grow (D56). It used to be
`player.speed × 3.4`, so every `Fins` lengthened it — 141px at none, 402px at
ten, a third of the arena crossed untouchable. `dashSpeed` being its own field
is what makes reach a stat that can be *sold* at `home` later rather than a
side effect of a movement mod. It takes
its id from the bullet id space, so `lastHitBy` stops it hitting the same enemy
twice — the same trick as pierce. Enemies carry `pushX/pushY` for the shove,
their only velocity; everything else about them is a fixed walk toward you.

The player never blinks while dashing even though `hurt` is set, because the
i-frame blink is what made the dash read as a teleport. An afterimage spark each
frame and a ring on landing (`dashEnd`) do the rest.

**Collision.** Brute force, every bullet against every enemy, compared in
**squared** space — which measured 8.3× faster than `Math.hypot` over 3.2M
pairs. Fine to a few hundred per array; a spatial grid is the documented next
step.

Both fast hitboxes are **swept**, not sampled: `segDistanceSq()` measures an
enemy against the segment the bullet or the dash crossed this frame, rather
than the point it ended on. A point test misses whatever it stepped over, which
is a function of speed, and speed is not bounded — `Fins` is uncapped and a
railgun is named in S1's own definition of done. Measured before the fix: the
dash connected on 27% of positions at 8 Fins on a 20fps frame (D50), and
bullets tunneled a darter on 9% (D53). The squared form is used because these
are the per-frame loops and that rule does not lapse because the shape became a
capsule.

**Rank and mods** (D33, D34, D49). There is no XP bar and no curve. Clearing a
batch — the sweep seeing a non-empty enemy list go empty — raises `rank` by one
and starts `offerTimer` at `MOD_OFFER_DELAY`; when that expires,
`openModOffer()` rolls three mods and opens the `mods` screen, the beat between
batches and the only pause in a dive. Not after a layer's last batch: its
clear is the layer end, which is not a gate and pays nothing — no rank, no
mods, no `Mend` (D59) — so twelve batches make eleven ranks, and the current
goes straight on to the bottom. The delay exists because the
kill burst lives 0.5s and the cards were landing on the same frame as the kill,
which read as a jump cut (D51). A pending offer also holds the batch queue, so
the descent cannot start before the offer has been taken. Nothing is offered for a kill, only
for a batch. If the same frame kills the last enemy *and* the player, the death
screen wins: `clearBatch()` is guarded by `screen === 'playing'`.

The pool is six, **body and comfort only** until S5 — Content, because a
weapon mod cannot be balanced before the weapons exist. Body: Fins (speed),
Vitality (+1 max HP, filled), Reflex (dash cooldown, max 3), Nerve (i-frames,
max 3), Impact (dash damage, max 3). Comfort: Mend (a heart per batch cleared,
max 1). `Impact` is `body` rather than `weapon` because the dash is
weapon-agnostic.

Comfort is down to one on purpose. D34 named three candidates; a currency
magnet has nothing to do since D35 auto-collects, and `Lull` — invulnerability
as a batch arrived — was removed by D55 once measurement showed nothing can
reach a centred player inside its 1.2s window, so it only ever paid out to a
cornered one. `modCounts` tracks what has been taken and the roll skips
anything at its `max`, so a late dive can be offered two cards rather than
three. Mods are dive-scoped: `reset()` clears them.

Anything a mod raises is a field on `player` rather than a `const` — that is why
`iframes` and `dashCooldown` live in `PLAYER_START`.

**Currency.** Kills drop gems at the corpse, so the reward sits where the danger
was. Gems within `pickupRange` drift toward you; they expire after 8s, blinking
for the last two, and collecting one adds to `currency`. It buys nothing until
S4 — Meta loop skeleton. D35 (auto-collection, no expiry) is decided and **not
implemented**; what is described here is what the code does. Nothing in the code
names the currency, because what it is called is still open in `ideas.md`.

**Damage.** Contact costs 1 HP behind 1s of invulnerability, during which the
player blinks — without the i-frames a touching enemy drains 3 HP in 50ms.

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
URL and passes it in, because `game/` never touches a browser API.

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
watching, drawn as the HUD's second line; the fps line shifts below it from
`.length` rather than a hardcoded `y`. Each entry names the player field as
well as its label, which is what lets a check prove the list is **complete**:
every stat any mod can change must be on screen, computed from the mods, so a
new mod touching a new field fails the suite rather than going unwatched.

Each mod card shows the change it makes and how many are held.
`modPreview(mod)` applies the mod to a copy of the player and diffs the
numbers, so a card cannot advertise something `apply` does not do — the
alternative, a written-out `preview` per record, is a second source of truth.
`modStack(mod)` gives held/max. Without this a repeated card was identical to a
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

Help and the mod cards are guarded. Options and the menus stack rows the same
way and are not.

## Scenarios

Named dev setups in `SCENARIOS` (`game/content.js`), loaded by URL (D37, D42):

| URL | Does |
|---|---|
| `?dev=one-drifter` | Loads it **frozen**. Nothing advances until `advance(n)`. |
| `?dev=three-types&play` | Loads it **running**, for watching. |
| `?dev=late-swarm&seed=4471` | Any scenario, on a fixed seed. |
| `?dev=last-batch&play` | The layer's last batch, then the bottom — the end without the whole layer. |

`applyScenario(name, seed)` resets, then applies the record: `elapsed` to start
part-way in, `spawn: false` to stop new arrivals (`spawnPaused`), and a list of
`[type, x, y]` placed at nominal speed with no jitter or ramp. An unknown name
logs the known ones and does not throw.

`advance(n)` runs exactly n fixed ticks and draws once — no wall clock involved.
This is what the bot drives, and the same entries it selects by name, so there
is no separate test harness. Adding a scenario is a line.

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
| **Node** | `npm test` (`npm run test:watch`) | The seam, property-based invariants over generated seeds — no NaN ever, hp bounds, view bounds, seeded replay, time-based decay — the descent (`tests/descent.test.js`: the camera never moves while a batch lives but the water keeps flowing, the next batch is under 3s away, the camera stops exactly at each depth, swimming does not hurry the current, the layer end offers no mods, the water flows behind the mod cards and drifts under the death and layer-end screens, pausing freezes the camera and the water, aim and arrivals follow the camera, the layer ends at the bottom), and the docs (D57). Vitest + fast-check, dev-only. |
| **Browser** | `index.html?test` | The scripted checks (count under Verification), plus what Node cannot reach: audio peak levels, canvas, real `KeyboardEvent`s through `platform/input.js`, and the same seed played to the bottom of the layer at three window sizes through real `MouseEvent`s (D29). |

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
running it. Playing the game normally — no query string — is unaffected.

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
prototype — they transfer to any port verbatim.

`PLAYER_START` (r 10, speed 260, hp 3, fireRate 2.5, damage 1, range 250,
pierce 0, pickupRange 75, iframes 1, dashCooldown 2.2, dashSpeed 884,
mendOnClear 0, dashDamage 0) · `BULLET_SPEED 430` · `GEM_PULL 300` ·
`GEM_LIFE 8` · `ENEMY_JITTER 0.3` ·
`GATE_PAUSE 1.2` · `GATE_SPACING 400` · `CURRENT_SPEED 200` ·
`CURRENT_CRAWL 30` · `CURRENT_EASE 0.05` · `MOD_OFFER_DELAY 0.6` · `FIXED_DT 1/120` ·
`MAX_FRAME_DT 0.05` · `DASH_TIME 0.16` ·
`DASH_GRACE 0.15` · `DASH_REACH 40` · `DASH_ARC 0.2` ·
`DASH_END 0.18` · `DASH_PUSH 320` · `PUSH_DRAG 0.02` · `SHAKE_FADE 0.02` ·
`SHAKE_FLOOR 0.15` · `SHAKE_HURT 7` · `SHAKE_DEATH 38`

## Verification

**`index.html?test`** runs the suite in the console (currently **174** checks —
this doc owns that count; `roadmap.md` cites it). The old figure of 79 was
`grep -c`, i.e. *lines containing an assertion*; the suite reports what actually
**executed**, which is higher because some call sites sit inside loops.
Covering: arrivals and the gate, collision, i-frames, bullet range, piercing,
gem expiry, every screen transition, cursor wrapping, each option, non-Latin
keyboard layouts, shake settling, frame-rate independence, that every sound is
loud enough to hear, that shots follow the cursor, that the dash's wave reaches
past the body but only forwards and shoves what it hits, that every screen
answers the mouse as well as the keys, that a fast dash hits what it sweeps
through rather than stepping over it (D50), that the dash shoves for free but
only wounds once bought and never flashes an enemy it did not hurt, that the
offer waits out the death before it appears (D51), and — since D49 — that a rank
arrives per batch and never per kill, that the offer freezes the queue behind it, that the
mod pool is body and comfort only, that a maxed mod is not offered, and that
each comfort mod does what its card says. Since D58: that the next batch waits
on the descent and arrives at its own depth, and that the same seed reaches
the bottom of the layer in the same time at 1280×800, 1920×1080 and 3440×1440, driven through
real mouse events (D29), and that a dim screen darkens the letterbox margin as
much as the view.

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
