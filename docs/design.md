# Design — how Abyss works today

Describes the **present**, not the plan. Update it when reality changes.

**The present is partway to the design.** S1 — Combat core has started: the
weapon is manual (D45) and the batch queue and gate are in (D48). Still to come
in S1: one rank per batch with mods at the gate (D34), which removes the
prototype's XP bar and its mid-batch interruption, and the re-derived
`// balance` block. The arena is still fixed — the camera is S2. Nothing here
is a statement of intent.

## What it is

A twin-stick action game in a fixed arena. You move with WASD, aim with the
mouse and **fire by holding the left button** (D45); kills drop motes that are
XP; filling the bar pauses the game and offers three random upgrades — that
interruption is the prototype's, and D34 replaces it. Enemies arrive one gated
**batch** at a time. Every dive ends in death; the current measured times live in
`roadmap.md` → Health, and only there, and **they are void** — they measured an
auto-firing weapon.

## Files

```
index.html              shell: canvas, CSS, eight script tags in load order

game/       content.js  every tuning number + all content tables
            state.js    run state, settings, reset(), openScreen()
            logic.js    step() — spawning, movement, collision, XP
                        ── 654 lines. Survives the port.

platform/   input.js    keyboard + mouse → keys / justPressed / aim
            audio.js    WebAudio synthesis
            render.js   canvas, arena scaling, every draw function
main.js                 frame loop, dt, fps, boot
                        ── 476 lines. Rewritten on the port.

checks.js               the ?test suite → the port's regression tests
```

Line counts are as of 2026-09-19. Regenerate rather than trust them:
`wc -l game/*.js platform/*.js main.js && grep -c console.assert checks.js`.

The platform share is **42%** (476 of 1130). D17 measured 23% on 2026-09-12;
it grew because `render.js` took on the mouse work. This is the number to
watch — CLAUDE.md says not to invest in the canvas layer, and this is what
that rule looks like when it slips.

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
| `aim` | `platform/input.js` | cursor position in world coords |

Exactly six, and **enforced rather than claimed**: `npm test` loads `game/` into
a Node `vm` with only these six stubbed, so reaching for a seventh fails the
build. That check found the seam had quietly grown to eleven — `LEFT`, `RIGHT`,
`GO`, `DASH` and `CLICK` were being read from `platform/input.js`. They now live
in `game/content.js`, because which key means which action is content (D44).

## The frame

```
frame(now)                        main.js
  dt = min(elapsed, 0.05)         capped so tab-switching can't teleport things
  update(dt)                      game/logic.js
    step(dt)                      screen dispatch, then gameplay
    shake fade                    outside step(): step() returns early on menus
    justPressed.clear()
  draw()                          platform/render.js
```

`update` / `draw` are strictly separated: `update` changes numbers, `draw`
reads them. Nothing persists on screen — the arena is repainted every frame.

## Screens

```
title ──Start──> playing ──Esc──> paused ──Quit──> title
                   │ ▲              │
             level │ │ pick         ├──> help ───Esc──> back to caller
                   ▼ │              └──> options ─Esc──> back to caller
                levelup
                   │
                 death ──R──> playing
                       ──Esc──> title
```

The level-up screen takes three inputs for one choice: `A`/`D` or the arrows
move `choiceIndex` (it opens on the middle card), Enter or Space takes the
highlighted one, a click takes the one under the cursor, and `1`/`2`/`3` still
take theirs outright. The mouse only moves the highlight when it has actually
moved — a cursor resting on a card would otherwise overrule the keys every
frame, which is why `lastAimX`/`lastAimY` exist.

The title, pause and options screens work the same way: hover moves the
cursor, a click activates the row, and on options a click cycles the value
exactly as Enter does. Help and the death screen take a click as "go on".
Menu and options rows are full-width bands from `rowRect` in `content.js`.

Mouse buttons ride in `keys` and `justPressed` under codes a keyboard cannot
produce (`'Mouse0'`), so `tapped()` works for either device and the port seam
did not grow a name for clicks. Card rectangles live in `content.js`
(`cardRect`), because the renderer draws them and the logic hit-tests them.

`returnTo` remembers whether help/options was opened from the title or mid-run.
`reset()` sets `screen = 'playing'`, so Start is just `reset()`; boot calls
`reset()` then overrides to `'title'`.

## Systems

**Movement.** Direction from held keys, normalised so diagonals aren't 1.41×
faster, times speed times `dt`. Player clamped to the arena.

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

**Arrivals: the batch queue and the gate** (D27, D48). Enemies come one
**batch** at a time — a record in `BATCHES` naming counts per type — and nothing
new arrives until the batch is dead. Between batches sits a **gate**:
`GATE_PAUSE` (1.2s) of quiet, which is where a mod offer will land (D34). A dive
opens on a gate. `batchIndex` counts batches begun; `gateTimer > 0` means we are
between them. The list cycles when it runs out — finishing a layer is S3.

Enemies still enter 40px outside the arena so they fade in from the dark, with
±15% speed jitter. What is gone: the time-based spawn director, and with it the
speed ramp and the weighted type-unlock roll. **Difficulty is authored per
batch now, not ramped by the clock.**

**Enemy types** (`ENEMY_TYPES`). No unlock times any more — which types appear
is named per batch (D48):

| | radius | hp | speed | xp | role |
|---|---|---|---|---|---|
| drifter | 9 | 1 | 85 | 1 | the baseline swarm |
| darter | 6 | 1 | 190 | 1 | fast enough to punish lazy kiting |
| bulwark | 17 | 6 | 52 | 3 | soaks shots, blocks escape routes |

**The weapon.** A cooldown timer; on expiry it fires along the cursor, but
only if something is inside the ring (`enemyInRange()`). The range is still a
real range — it just no longer picks the target. If nothing is in range the
timer is not reset, so you fire instantly when something arrives rather than
waiting out a cooldown that ticked against an empty screen. Bullets store
velocity once at birth and fly straight — that's why shots can be dodged and
why yours sail past into the dark. Each carries an `id`; enemies remember
`lastHitBy`, so a piercing shot damages any given enemy at most once.

**The dash.** `Space`, in the direction of the held movement keys — never the
cursor, which is usually the direction you least want to travel in. 0.16s at
3.4x speed on a 2.2s cooldown, invulnerable for the dash plus a moment after,
so landing inside what you flew through costs nothing. It pushes a wave ahead
of it: everything within `DASH_REACH` that the dash is facing (`DASH_ARC`, a
156-degree front) takes `player.damage` once and is shoved away at `DASH_PUSH`,
bleeding off per second. The facing is frozen at the dash's start in
`dashDx/dashDy`, so releasing the keys mid-lunge cannot spin the wave. It takes
its id from the bullet id space, so `lastHitBy` stops it hitting the same enemy
twice — the same trick as pierce. Enemies carry `pushX/pushY` for the shove,
their only velocity; everything else about them is a fixed walk toward you.

The player never blinks while dashing even though `hurt` is set, because the
i-frame blink is what made the dash read as a teleport. An afterimage spark each
frame and a ring on landing (`dashEnd`) do the rest.

**Collision.** Brute force, every bullet against every enemy, compared in
**squared** space — `dx*dx + dy*dy < r*r` — which measured 8.3× faster than
`Math.hypot` over 3.2M pairs. Fine to a few hundred per array; spatial grid is
the documented upgrade.

**XP.** Kills drop `xp` motes at the corpse, so the reward sits where the
danger was. Motes within `pickupRange` drift toward you; they expire after 8s,
blinking for the last two. Level cost is geometric: `5 × 1.45^(level−1)`.

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
21 runs. And "it broke sometimes" becomes "it broke on seed 4471".

## Screens must fit

Any screen that stacks rows from a data table derives its positions from
`.length`, never a hardcoded `y`. `render.js` exposes `HINT_Y` (where the
bottom hint sits) and `helpBottom` (where the help screen's last line ends), and
a check asserts one is above the other — adding a row to `HELP_KEYS` once pushed
the list straight through the blurb below while every check passed (D46).

Only the help screen is guarded. Options and the menus stack rows the same way
and are not.

## Scenarios

Named dev setups in `SCENARIOS` (`game/content.js`), loaded by URL (D37, D42):

| URL | Does |
|---|---|
| `?dev=one-drifter` | Loads it **frozen**. Nothing advances until `advance(n)`. |
| `?dev=three-types&play` | Loads it **running**, for watching. |
| `?dev=late-swarm&seed=4471` | Any scenario, on a fixed seed. |

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
| **Node** | `npm test` (`npm run test:watch`) | The seam, and six property-based invariants over generated seeds — no NaN ever, hp bounds, arena bounds, seeded replay, time-based decay. Vitest + fast-check, dev-only. |
| **Browser** | `index.html?test` | The 104 scripted checks, plus what Node cannot reach: audio peak levels, canvas, real `KeyboardEvent`s through `platform/input.js`. |

`tests/harness.js` runs `game/` in a Node `vm`. `let` and `const` at the top of a
classic script are lexical bindings rather than properties of the global object,
so the harness generates accessors to expose state and constants.

**A property test is only as good as its generator.** The no-NaN invariant
initially passed even with a divide-by-zero guard deleted, because the generator
never put the cursor exactly on the player. It now does so 8% of the time. Treat
an invariant as unproven until a deliberate break makes it fail.

## Local server

`python3 serve.py 8222`. Needed only for Playwright, which refuses `file://`.
It forbids caching and is threaded — see D41 for why the stock `http.server`
is not usable here. Double-clicking `index.html` still needs no server at all.

## Balance constants

All in `game/content.js` under `// balance`. These are the real product of the
prototype — they transfer to any port verbatim.

`PLAYER_START` (r 10, speed 260, hp 3, fireRate 2.5, damage 1, range 250,
pierce 0, pickupRange 75) · `IFRAMES 1` · `BULLET_SPEED 430` · `GEM_PULL 300` ·
`GEM_LIFE 8` · `XP_BASE 5` · `XP_GROWTH 1.45` · `ENEMY_JITTER 0.3` ·
`GATE_PAUSE 1.2` · `DASH_SPEED_MUL 3.4` · `DASH_TIME 0.16` ·
`DASH_COOLDOWN 2.2` · `DASH_GRACE 0.15` · `DASH_REACH 40` · `DASH_ARC 0.2` ·
`DASH_END 0.18` · `DASH_PUSH 320` · `PUSH_DRAG 0.02` · `SHAKE_FADE 0.02` ·
`SHAKE_FLOOR 0.15` · `SHAKE_HURT 7` · `SHAKE_DEATH 38`

## Verification

**`index.html?test`** runs the `console.assert` suite in the console
(currently **119** checks — this doc owns that count; `roadmap.md` cites it).
The old figure of 79 was `grep -c`, i.e. *lines containing an assertion*; the
suite now reports what actually **executed**, which is higher because some call
sites sit inside loops. Covering: spawning,
collision, i-frames, bullet range, piercing, gem expiry, XP curve, every screen
transition, cursor wrapping, each option, non-Latin keyboard layouts, shake
settling, frame-rate independence, that every sound is loud enough to hear,
and — since 2026-09-19 — that shots follow the cursor, that the dash's wave
reaches past the body but only forwards and shoves what it hits, and that every
screen answers the mouse as well as the keys.

A check that expects a shot to land must set `aim` itself (`aimAt()`). Four
checks once passed only because the previous check happened to leave the cursor
on the firing line.

**Balance** is measured by driving `update()` faster than real time with a
scripted bot, 21 runs per configuration. The figures live in `roadmap.md` →
Health and only there, along with the caveat that the current bot is a weaker
driver than the pre-mouse-aim one and is comparable only to itself.

**Feel is never asserted** — that judgement is Igor's.

## Gotchas

- **Cache.** Eight files means a hard refresh (⌘⇧R) matters; a partial cache
  gives you a mix of old and new, which produces baffling bugs.
- **`?test` is an exact match** on `location.search === '?test'`, so
  `?v=whatever` cache-busting does not trigger the checks.
- **Time-based decay must use `Math.pow(x, dt)`**, never a per-frame factor.
