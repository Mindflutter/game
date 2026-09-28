# Changelog

What actually shipped, newest first. Commit hashes are in this repo's history.

---

## 2026-09-28

**Driven runs are muted**
Igor: "mute the game when testing with bot / playwright". `?test` and `?dev=`
now boot at `volume = 0`. The audio checks are untouched — they measure peaks
in an `OfflineAudioContext` that never reaches the speakers, and all eight pass
muted. Also fixed the options check, which restored a hardcoded 0.6 and so
un-muted the rest of the suite behind its own back; it restores the boot volume
now.

**S1 — Combat core closed.** Igor: "close s1, s2 coming in a different
session". All DoD bullets met; `plan.md` records no active stage. Eleven
decisions, D45 (the weapon is manual) through D56 (the dash is a fixed,
committed lunge), plus D57 (docs gets its own checks).

**`docs/` gets its own checks**
D57, asked for by Igor after three corruptions in one day went unnoticed: an
idea of his deleted by a bad splice, D56's changelog entry silently never
written, and decisions cited as bare numbers. `tests/docs.test.js` checks that
every decision has a name, that numbering is gapless, that no doc cites a
decision that does not exist, that the newest decision reached the changelog,
and that the docs `CLAUDE.md` names still exist. Verified by breaking each.
13 Node tests, was 8. It cannot check whether prose is *true* — that stays the
consistency sweep's job.

**`Lull` stays out, and five misreadings corrected**
Igor: "Lull leave out" — D55's removal is confirmed, though the removal itself
was Claude's overreach at the time ("useless *at this point*" was a "not yet",
not a delete). An audit for the same error found four more: D34's 12-batch
*example* cited as if it sized a layer, an unmarked design call (the dash's
free shove), invented constants presented as derived (the mod caps,
`MOD_OFFER_DELAY`), and `foundations.md` amended without asking (D53 dropping
render interpolation). All now marked in `decisions.md` as Claude's picks.

The audit also found that **Igor's "fish from behind the screen" idea had been
deleted** from `ideas.md` — an index-splice edit during the D56 write-up wiped
everything between two anchors. Restored, and `git diff` confirms nothing else
was lost. No check covers `ideas.md`, so nothing would have caught it.

`CLAUDE.md` gained the rule all of this points at: Claude unsure → ask before
documenting; Igor unsure → it is an open question and goes in `ideas.md`. Leans
("inclined to", "might", "at this point", "for later") are never rounded up
into decisions.

**Fix: the dash is a fixed, committed lunge**
D56, two bugs from Igor. **Dash length no longer rides on `player.speed`** —
`DASH_SPEED_MUL` is gone and `player.dashSpeed` (884px/s) is its own field, so
`Fins` stops lengthening the lunge. Measured: flat 141px at every Fins count,
where it ran 141 → 402px; peak escape falls from 386 to 141 invulnerable px/s.
The root-cause fix rather than capping Fins, and it makes dash reach a stat
that can be sold at `home` later.

**Live input can no longer steer a dash.** Travel followed the keys held this
frame while only the wave's facing was frozen, so switching keys turned the
lunge, holding the opposite key reversed it (wave facing backwards, hitting
nothing), and *releasing* everything stopped you dead after 7px while
`dashTime` ran on — a free 0.31s of invulnerability for standing still, 31%
uptime with three `Reflex`. Travel now follows the frozen direction.

Verified by breaking both. 171 checks, was 165. Two of the new checks were
themselves wrong first: one looped on `dashTime > 0` before the dash had
started so it never ran, and one inherited the previous case's held key and
dashed diagonally, which nearly read as a game bug.

## 2026-09-27

**`Lull` removed: a mod that paid for being cornered**
D55, from Igor playing D54's batches — "gate safety mod is useless at this
point". Measured across 12 batches and 3 seeds: with the player centred, **0 of
36** arrivals reach them inside the 1.2s guard (earliest contact 2.04s). It
only fires when you are edged or cornered — 29 and 35 of 36 — so it rewarded
the position the game is trying to punish. Removed with `player.gateGuard` and
its readout row. The pool is six and comfort is down to one, since two of D34's
three comfort candidates are now dead (the currency magnet by D35, this by
measurement). Recorded with the condition that revives it: arrivals that begin
near the player, which is Igor's "fish from behind the screen" idea, now in
`ideas.md`. 165 checks, was 166.

**S1 — Combat core: the batches, re-derived from scratch**
D54, closing the last S1 work item. Igor played it: batches were "very easy".
The arithmetic says why — the weapon does 2.5 hp/s and no mod raises damage
(D34), so a 10–45s batch needs 25–112 hp. The old batches held **3 to 15**,
i.e. 1.2–6.0s of shooting. Every one was under target by a factor of five.
Twelve batches now, sized on hp, ramping 10 → 68 hp; peak 38 simultaneous
enemies against a 500 budget. Bot went from surviving every seed to dying on
four of five — direction, not verdict (D50). Enemy hp, speed and movement
untouched: behaviours are S5.

**S1 — Combat core: fixed timestep, and bullets sweep too**
D53, S1's last DoD item. `FIXED_DT` is 1/120 and `stepFixed()` banks leftover
time, so every machine simulates the same game whatever its refresh rate. Render
interpolation is **not** built and `foundations.md` is amended: a shorter tick
buys the same smoothness without touching every draw call, 8ms of stale picture
against 17ms, for ~1.1ms of a 16.7ms frame. Bullets now sweep their path like
the dash — a fixed step bounds `dt` but not bullet speed, and the DoD names a
railgun; measured, the old point test tunneled a darter on 9% of positions.
A shot's range is now the distance it actually covered.

Verified by breaking all three. One check had to be fixed rather than trusted:
the railgun enemy sat exactly on a sample boundary, so a point test hit it by
luck and the check could only pass. Also fixed a bot bug this exposed — its run
budget was counted in ticks, so halving the step halved every dive.

**The development readout: show the numbers**
D52, Igor's request. A second HUD line built from `PLAYER_STATS`, and every mod
card now shows the change it makes and how many you hold. The change is computed
by applying the mod to a copy of the player, so a card cannot advertise a number
the mod does not deliver. A check proves every stat a mod can move is on screen.
This is why `Impact` offered twice looked like a bug — five of seven mods stack
and the card was identical on a repeat. Partially overrides D34 on presentation,
deliberately and only for development.

166 checks, was 151. `npm test` 8, was 7.

**S1 — Combat core: the dash is bought, and the offer waits for the death**
D51, both from Igor playing D50. `player.dashDamage` starts at 0 and the new
`Impact` mod (body, max 3) buys it — the dash still moves, grants i-frames and
**always shoves**, because scattering a crowd is what makes diving into one a
play; only the wound is priced. The hit flash is gated on damage too, since a
flash on a push that did nothing is a lie. Seven mods now, and this is the first
with an obvious `gear` twin for S4, per Igor's "can be home screen upgrade too".

The mod cards no longer land on the frame of the kill: the kill burst lives
0.5s and the offer was dimming the arena over it. `MOD_OFFER_DELAY` (0.6s) holds
the offer — and the batch queue — until the death has played. The rank is still
banked on the kill.

151 checks, was 145. Verified by breaking both: opening on the kill frame fails
2, restoring free dash damage fails 6. The bot's numbers are unchanged, because
it has no dash policy and cannot see either change (D50).

**Fix: the dash stepped over its own hitbox**
D50, from Igor playing the D49 build. The dash's wave was a point test with a
fixed 40px reach taken once a frame, while the dash covers
`player.speed * 3.4 * dt` — and `Fins` raises speed with no cap. So its range
grew all dive (147px at 0 Fins, 402px at 10) and it flew straight through
enemies: 54% of positions connected at 8 Fins on a 30fps frame, 27% at 20fps,
worst of all against an enemy right next to you. Now swept along the segment
travelled, with facing judged from where the frame started. 100% at every speed
and frame time tested. 145 checks, was 144, verified by restoring the point test.

Bullets have the same hole — measured at 9% of shots passing through a darter
at the 20fps `dt` cap, clean at 30fps and above — and are deliberately left for
the fixed timestep, S1's last DoD item.

**Correction: the bot is not a difficulty instrument.** D49 called the bulwark
batches too slow at 24–99.7s. Igor played it: batches are *too easy*. The bot
kites and never commits, so the figure measured the bot, not the batch. Bot
clear-times are a regression signal only (D50).

Also: the `Vitality` card said "already full", which reads as a promise of full
health; it only means the new heart arrives filled.

**S1 — Combat core: one rank per batch, mods at the gate**
D49, implementing D33 and D34. The XP bar is deleted. Clearing a batch raises
`rank` by one and offers three mods; nothing is offered mid-batch, which is the
comfort requirement D33 exists for. The mod pool is six, body and comfort only —
Fins, Vitality, Reflex, Nerve, Mend, Lull — and a check refuses any other
`scope`, so a weapon mod cannot be added by reflex before S5 — Content.

Removed as husks: `gainXp`, `xp`, `xpNext`, `level`, `XP_BASE`, `XP_GROWTH`, the
geometric curve, the XP bar across the top of the screen, and the prototype's
four weapon upgrades. `IFRAMES` and `DASH_COOLDOWN` became `player.iframes` and
`player.dashCooldown` — a mod is a line of data and a line of data cannot edit a
`const`. Gems are money: `ENEMY_TYPES.xp` is `.value` and collecting one pays
`currency`, which buys nothing until S4.

Two mods D34 named were **not** built: pickup radius and a currency magnet. D35
auto-collects currency and leaves both with nothing to do, so they would have
been husks with a known expiry date. Recorded as a correction to D34.

**Verified by breaking it**: five mutations, each failing exactly its own
checks — ranking up per kill instead of per batch (5 failures), dropping the
death-outranks-rank-up guard (2), ignoring a mod's `max` (1), healing without
the clamp (1), deleting `Lull` (1). 144 checks, was 119.

Two mod descriptions overflowed their cards — caught by looking at the screen,
not by a check, because the renderer centres the text. Shortened and guarded:
`widestModDesc()` measures the pool and a check holds it inside the card.

**Measured**, and it is a finding: bot, 5 seeds, 8 batches, mean 16.1s per batch
but a 3.4–99.7s range. The bulwark batches take 24–99.7s against a 10–45s
target, because no mod raises damage any more and the bulwark's 6hp was tuned
against a weapon that compounded. The `// balance` block is next in S1 and now
has a number to aim at. Figures live in `roadmap.md` → Health.

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

**S1 — Combat core: the batch queue and the gate**
D48, implementing D27. The spawn director is deleted. Enemies arrive one batch
at a time from `BATCHES`, and nothing new comes until the batch is dead;
`GATE_PAUSE` is the quiet beat between them. This is the point of the genre
change: the old director grew arrivals hyperbolically against logarithmic power,
so death was arithmetically certain — a bounded queue makes that impossible.

Removed as husks: `spawnEnemy`, `pickEnemyType`, `spawnTimer`, `SPAWN_FIRST`,
`SPAWN_QUICKEN`, `SPAWN_FASTEST`, `ENEMY_RAMP`, and `weight`/`from` on
`ENEMY_TYPES`. `pickEnemyType` was kept alive only by its own checks.

Exposed a check that passed vacuously: "nothing arrives while a batch lives"
held because the unattended player died and the simulation stopped. Gate checks
now run with the player kept alive and assert the screen is still `playing`.
Verified by breaking the gate — four failures, "45 enemies, batchIndex 9".

Bot: mean 14.1s per batch over 5 seeds (range 4.5–35.9s), truncated because the
prototype's level-up screen still interrupts. 119 checks (was 111).
`late-swarm` redefined to start at batch 5; scenarios gained a `batch` field.

**Fix: clicking Start fired the weapon**
D47. A menu reads a click as an edge, the weapon reads it as a held state, so
one physical click was read twice — the click that began a run also fired into
it. Regression from D45. Fixed in `update()`, which every screen passes through:
menus disarm the trigger and it re-arms only on a frame with the button
released. That covered two more routes nobody had reported — taking a level-up
card and restarting from the death screen. Verified at 10/60/150/400ms holds.
Test written first and failed for the right reason. 111 checks (was 108).

**The consistency sweep, made concrete**
D46. CLAUDE.md now names the six surfaces a change can leave stale instead of
saying "update the docs", with the three that have actually been missed marked
as such. The layout-vs-data one is now a check: `render.js` exposes `HINT_Y` and
`helpBottom`, and the suite asserts the help screen ends above the hint —
verified by padding `HELP_KEYS` until it overflows. 108 checks (was 107).

**S1 — Combat core: the weapon is manual**
D45, implementing D28. Shots leave while `Mouse0` is held, along the cursor.
`enemyInRange()` and the "hold fire unless something is in range" rule are
deleted — that rule only ever existed to stop an automatic weapon shooting at
open water. The cooldown is clamped at zero so the first click after a pause is
instant rather than banking shots.

Seven existing checks turned out to depend on auto-fire; they now pull the
trigger. Holding `Mouse0` then leaked into a later check and broke the
bullet-range assertion — held input is shared mutable state like any other.
Five new checks; auto-fire fails four of them, verified by putting it back.
107 checks (was 104: +5, −2 deleted).

Balance untouched on purpose: no point tuning `fireRate` against a spawn
director that batches will delete.

Also: the in-game help still claimed the weapon fires itself and listed no
shoot key — caught while writing the README, not by any check. Fixing it added
a row, which pushed the key list through the blurb below it because that text
started at a hardcoded y; `drawHelp()` now derives its position from
`HELP_KEYS.length`. Added a root `README.md`: how to run the game, both test
suites, and the scenarios.

**S0 — Foundations & spike: Node test stack, and a seam that was wrong**
D44. Vitest + fast-check as dev-only dependencies; `npm test` runs six
property-based invariants over generated seeds. `tests/harness.js` loads `game/`
in a Node `vm` with only the six seam names stubbed — D18's grep made executable.

It found the seam had been **eleven names, not six**, since 2026-09-12: `LEFT`,
`RIGHT`, `GO`, `DASH` and `CLICK` were read from `platform/input.js`. Fixed by
moving all seven binding constants into `game/content.js` — which key means which
action is content (D6) — rather than by correcting the docs. Pure move; 104
browser checks unchanged.

Each invariant verified by breaking it. One was a fraud: deleting a `|| 1`
divide-by-zero guard passed all six, because the generator never aimed exactly
at the player. Generator fixed, break now caught.

**S0 — Foundations & spike: performance measured, glow cache cancelled**
D43. No code written — the measurement said not to. At the 500-entity budget on
a 3440x1440 screen a whole frame costs under 1ms of 16.7ms, and `shadowBlur`
specifically costs 0.05ms. D30 had claimed, unmeasured, that glow was "two
orders of magnitude costlier than a plain fill" and the real bottleneck; it is
neither. The offscreen cache is cancelled and CLAUDE.md's sanctioned exception
for it removed. D30's *conclusion* (no dependencies) is strengthened: Canvas 2D
is not merely adequate here, it is idle.

Entity budget reclassified as a design limit rather than a technical one —
measured headroom is ~4000 entities. The spatial grid in `ideas.md` gains a
measured trigger (~1500 enemies with 600 bullets) instead of a hunch.

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

**Cleanup pass (`/simplify`, four angles)**
Quality only, no behaviour change; 165 checks and `npm test` 8 throughout, and
both sweeps re-verified by reverting them to point tests (2 failures, exactly
theirs). The findings worth naming:

- **The fixed-timestep clock moved into `game/`.** `stepFixed()` lived in
  `main.js`, which is rewritten on the port — so the mechanism behind "every
  machine simulates the same game" would have been re-derived from scratch, and
  its check was testing a throwaway file. It is `advanceBy()` in `game/logic.js`
  now, owning the accumulator, the cap (`MAX_FRAME_DT`, previously a bare `0.05`
  literal in three places and outside the `// balance` block) and the tick
  count. Node drives the same entry point the browser does, and the frame-cap
  branch is reachable from a check for the first time — it was unreachable
  inside `frame()`.
- **Two `Math.hypot` calls were reintroduced into per-frame loops**, which
  CLAUDE.md bans outright and which the `segDistanceSq` comment cites in its own
  defence. The dash's `fx/fy/hypot` setup also ran for *every* enemy on *every*
  tick while being read only during a dash — ~93% waste. Now behind its guard,
  with the facing cone compared squared (no sqrt, no divide), and `dashing` and
  `Math.pow(PUSH_DRAG, dt)` hoisted out of the enemy loop.
- **Bullets stopped carrying `px`/`py`.** Unlike the player they are never
  clamped, so the swept segment's start is exactly `b.x - b.vx * dt` — two
  fields and a per-bullet hypot for something already derivable. They carry
  `speed` instead, which is what the range measurement actually wanted.
- **`TICK` in the harness was a hand-copy of `FIXED_DT` with a test to notice
  when they disagreed.** Every caller already had a loaded game, so the copy
  and its guard are gone — deletion, not a guard, was the answer.
- Removed: `modStack()` (one caller), `cardBottom()` (restated what `cardRect`
  owns, in the wrong file), `STATS_SHOWN_ELSEWHERE` (a content constant no
  content read), a mutable `hudY` that was always 70, and `CARD_DESC_FONT`
  moved to `platform/` — a CSS string means nothing in the layer that ports.
- **A renderer `.slice(0, 2)` was a symptom patch**: it silently dropped a third
  change-row. Replaced by `MOD_ROWS` and a check over the pool.
- `checks.js`: five hand-rolled bullet literals became one `shot()` helper —
  every one would have computed `NaN` travel once bullets gained `speed` — and
  six copy-pasted dash setups became `dashRight()`, two of which had already
  drifted and forgotten to release the key.
- **Found a check that could not fail**: "no second dash inside the cooldown"
  ran with no movement key held, so `len === 0` blocked the dash and the
  cooldown was never tested. It holds the key now and asserts `dashCd > 0`.

Skipped, with reasons: moving `PLAYER_STATS` wholesale to `platform/` (a real
seam argument, but it is a content table and the call is Igor's); reusing
`drawHint()` on the mod screen (moves the hint 216px and recolours it — a
visible change, not a refactor); deleting the five stat rows no mod can move
(Igor asked for those numbers by name, range included); and making the beat
total `GATE_PAUSE` rather than `GATE_PAUSE + MOD_OFFER_DELAY` (a feel change,
so Igor's).
