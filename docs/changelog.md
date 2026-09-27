# Changelog

What actually shipped, newest first. Commit hashes are in this repo's history.

---

## 2026-09-27

**`073a3ef` Track docs and CLAUDE.md in git**
D40. Reverses `10b3b96` and `002a562`. The docs now hold 40 decisions, the
glossary, the genre contract and the S0–S7 plan — the part that survives the
port, which D17 calls the real deliverable — so keeping them untracked while
versioning the throwaway `index.html` was backwards. `node_modules/` added to
`.gitignore` ahead of D39's dev dependencies.

**S0 — Foundations & spike: the check harness**
D39's first item. `console.assert` is gone from `checks.js`; a `check()` that
counts feeds a single `report()` printing `N passed / M failed`. Two defects
fixed: the suite could not fail (a failed `console.assert` logs and continues),
and its final `console.log('checks done')` ran *before* the async sound checks
had even started, so it never described them. `report()` now runs once, last,
after the awaits.

**Verified by breaking it**: one check inverted → `1 of 86 checks FAILED` in red
with the failure listed; reverted → `86 checks passed`. Also confirmed `?test`
still matches exactly — `?test&cachebust=1` correctly ran nothing.

**S0 — Foundations & spike: seeded RNG**
D41. mulberry32 in `game/state.js`; all 14 `Math.random()` sites in `game/` now
call `rng()`. `reset(seed)` reseeds, `main.js` passes `?seed=<n>` in so `game/`
stays browser-free, and `currentSeed` records what was used. Fixed a latent hole:
`reset()` never cleared `bulletId`, so same-seed dives handed out different ids.
Three determinism checks added (89 total, was 86), **verified by putting one
`Math.random()` back** → `1 of 89 checks FAILED`.

**S0 — Foundations & spike: scenarios and stepped mode**
D42, implementing D37. `?dev=<name>` loads a named setup from `SCENARIOS` and
holds it frozen; `&play` runs it live; `advance(n)` steps exactly n ticks. Three
scenarios to start: `one-drifter`, `three-types`, `late-swarm`. `spawnEnemy()`
split into `makeEnemy()` + `placeEnemy()` so a scenario can put a named type at
a known spot at nominal speed. 15 checks added (104 total, was 89).

Two bugs caught while building it: naming the stepper `step()` shadowed
`logic.js`'s own `step(dt)` and recursed infinitely, and a stepped scenario
never painted because the frame loop is what calls `draw()` — it loaded as a
black screen with every state check passing.

Added `serve.py`: the stock `http.server` caches (so the browser ran a mix of old
and new files for most of an hour) and is single-threaded (so a keep-alive
connection blocked the `curl` checking on it). Also added an `error` listener to
`checks.js` so a mid-suite throw still reports instead of ending ambiguously.

The count moved 79 → 86 with no checks added: 79 was `grep -c` counting *lines*,
86 is what actually executes. `design.md` owns the figure.

---

## 2026-09-19

**`bff155c` Mouse aim, force dash, mouse on every screen**
Squashed from four commits on `mouse-aim-dash` (kept at `54313cf` for the
step-by-step). Decisions D20–D23.

*Aiming.* The weapon fires along the cursor instead of at the nearest enemy,
still holding fire until something is inside the ring. A fading dashed line
runs to the edge of the ring with a small crosshair at the end.
`nearestEnemy()` deleted, its range half kept as `enemyInRange()`; the kill
path extracted to `killEnemy()` now that shots and dashes both reach it. The
port seam grew to six names with `aim`.

*The dash.* `Space`, 0.16s at 3.4x speed on a 2.2s cooldown, invulnerable, and
it pushes a wave ahead of it: 40px of reach instead of 10, limited to a
156-degree front, damaging once per enemy per dash and shoving what it hits
~80px away. An arc while it runs, a ring that expands and fades when it lands,
an afterimage trail throughout. Enemies gained `pushX/pushY`, their first
velocity. The dash never was a teleport — the i-frame blink was hiding it.

*Input.* Every screen takes mouse and keys. The level-up opens on the middle
card and takes `A`/`D`, arrows, Enter, click, or the number keys; title, pause
and options take hover and clicks; help and death take a click as "go on".
Mouse buttons ride in `keys`/`justPressed` as `'Mouse0'`, so clicks cost the
seam nothing.

79 checks passing, up from 47. Every new one was verified to fail with the rule
it guards broken. Four *older* checks were found passing by luck — they
expected shots to hit while never setting `aim`, inheriting whatever the
previous check left behind — and now place the cursor explicitly.

Bot, 21 runs per configuration: 38.7s not dashing, 37.8s dashing away, 36.6s
dashing into the crowd. No power creep. Dashing away gains nothing, because
the wave then faces away from everything — the payoff is for turning into the
crowd. The old 55.2s baseline predates aim and dash and no longer applies.

---

## 2026-09-12

**`6026c00` Split into `game/` and `platform/` along the port seam**
One 1186-line `game.html` became `index.html` plus eight `.js` files. `game/`
(505 lines) has zero browser API — verified by grep — and reaches into
`platform/` (370 lines) for five names. Plain `<script>` tags, so double-click
still works. `game.html` removed.

**`512d08b` Simplify pass**
Three copies of "dim the arena" collapsed into `dimArena(alpha)`. The particle
literal existed twice; now one `spark()` used by both callers. Hit-spark code
extracted out of the collision loop into `hitSparks()`. Every tuning number
moved into one `// balance` block, including ones hiding inline and inside
`reset()`. Collision switched to squared-distance comparison — measured 8.3×
faster than `Math.hypot` over 3.2M pairs. Net +23 lines, 13 of them comments;
the win is the hot loop and one place to tune, not line count.

**`8c4d5c4` Death shake 13 → 38px.** Death now hits 5.4× harder than a normal
hit, was 1.9×. Fade curve untouched, so both still settle at the same moment.

**`aad3ba2`** Upgrade screen heading shows "LEVEL UP" instead of the level
number. The number is still in the HUD behind the dim.

**`76df73d` Shake eases out exponentially.** Linear decay ran at near-full
strength then stopped dead, reading as the picture being switched off. Hit
shake 6 → 7px. Also: the damage shake already existed, but at 0.11s it was
invisible — this made it perceptible rather than adding a new effect.

**`c899af6` Fix: shake never settled once the game stopped updating.** It stuck
at 10.08px forever through the death screen, the title and every menu, because
the decay lived inside the gameplay path of `step()`, below the early returns,
while `draw()` applied the translate on every screen. Moved to the `update()`
wrapper. The existing check had missed it by never letting the player die.

**`4d398e4` Title screen, pause menu, help and options.** One `screen` variable
replacing `paused`/`dead`; `justPressed` added for edge-triggered menu input,
which also deleted a `keys.delete()` hack. Options: volume, screen shake,
show FPS.

**`804dd6f` Fix: movement and hotkeys on non-Latin keyboard layouts.** Input
matched `e.key` (the character typed) instead of `e.code` (the physical key), so
on a Russian layout WASD type ц/ф/ы/в and were ignored entirely. R and M were
broken too, and 1/2/3 would have been broken on AZERTY.

## 2026-09-08

**`e586b36` Tune juice.** Screen shake roughly halved. Sparks on *every* hit,
not just kills — shooting a 6 HP bulwark had looked like nothing was happening.

**`d4737ce` Fix: sound was inaudible.** Every sound shipped 20–30 dB below
normal game SFX level; the three heard most often were the three quietest.
Sounds became a data table, gained a master bus with a compressor, and a check
that renders each one offline and asserts it peaks above 0.15 — verified to
fail at the old amplitude.

**`1026fa2` Step 6: juice.** Particles, screen shake, hit flash, and sound
generated in code with WebAudio. No audio files.

## 2026-09-07

**`6681785` Step 5.** Fixed 1280×800 arena (difficulty had depended on monitor
size), three enemy types on timed unlocks, real bullet range, expiring gems,
geometric XP curve.

**`289fd55` Step 4.** Firing range, XP gems, level-up pause with three random
upgrades. The point at which it became a game rather than a tech demo.

**`783b8fb` Step 3.** Auto-firing weapon; bullets store velocity once and fly
straight, so they can be dodged.

**`acf3776` Step 2.** Enemies spawn off-screen and chase; contact damage behind
i-frames; death and restart.

**`0d4a6b3`** Design spec and `.gitignore`.

## 2026-09-06

**`6d114bf` Initial commit.** Canvas, a glowing circle, WASD movement.
