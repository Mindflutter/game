# Decisions

Append-only. Each entry: what was decided, why, and what was rejected. To
reverse one, add a new entry that supersedes it rather than editing history.

> ## READ THIS BEFORE D1
>
> **D1–D26 describe the *prototype*: a survivors-like auto-shooter in a fixed
> arena with an auto-firing weapon.** That genre is closed. D2, D9 and D10 are
> superseded outright. Reading them as current intent is the single easiest way
> to build the wrong thing.
>
> The game is now a **2D action roguelite** — manual LMB fire, hard-gated
> batches, a scrolling dive, and meta-progression. That starts at
> **"Phase 2 — the full game"**, just before D27.
>
> Many D1–D26 entries are still live and load-bearing — D3 (glow on black),
> D4 (no assets), D5 (plain objects in flat arrays), D6 (content is data),
> D7 (mark and sweep), D12 (`e.code`), D15 (`Math.pow(x, dt)`),
> D16 (verification), D17/D18 (the port seam), D24 (2D permanently). The
> superseded ones say so in the entry that replaced them.
>
> **If you have not read `foundations.md`, stop and read it first.** It is the
> settled contract; this file is the reasoning behind it.

---

## D1 — Prototype in the browser, not in Rust · 2026-09-06
Zero prior gamedev experience, and the stated goal was "find out if I like
this". A browser canvas is an engine already installed, with no toolchain, no
build step and F5 iteration. Installing a Rust toolchain to discover you'd
rather be gardening is the expensive way to learn that.

**Rejected:** Godot (a whole editor to learn first), LÖVE/pygame (an install
before the first pixel), Rust + macroquad (compile times during the phase where
iteration speed matters most).

## D2 — Survivors-like auto-shooter · 2026-09-06
Chosen from four pitches. No level design, no animation, and circles genuinely
look fine, so the art budget is zero. The core loop is ~150 lines and every
addition afterwards is a self-contained 20-line win — the right dopamine shape
for finding out whether you enjoy the work.

**Rejected:** Breakout (fixed scope, done once it works), one-button endless
(so small it wouldn't answer the question), falling-sand toy (a toy, no win or
lose condition).

## D3 — Deep-sea theme · 2026-09-06
Picked for a mechanical reason, not an aesthetic one: canvas has a built-in
drop shadow, so on a near-black background a plain circle becomes a glowing
creature for two lines of code. The theme makes the zero-asset constraint look
deliberate instead of cheap. It also made letterboxing invisible later (D9).

## D4 — No assets, ever · 2026-09-06
Everything is `ctx.arc`, `ctx.fillText`, and sound generated in code. No image
files, no audio files. Sprites are deferred past the port (see `ideas.md`).

## D5 — Plain objects in flat arrays · 2026-09-06
`enemies[]`, `bullets[]`, `gems[]`, `particles[]`, each holding plain objects.
No classes, no inheritance, no ECS. Those exist to solve problems this project
doesn't have — and this shape is what makes the port near-mechanical (D17).

## D6 — Content is data, not code · 2026-09-06, extended since
`UPGRADES`, `ENEMY_TYPES`, `SOUNDS`, `MENUS`, `OPTIONS`, `HELP_KEYS` are all
flat lists of records. Adding an upgrade, an enemy, a sound, a menu entry or an
option is **one line** and touches nothing else. Started as the single
deliberate architecture decision in the project; every later system copied it.

## D7 — Mark-and-sweep removal · 2026-09-07
Dead entities are flagged during the loops and removed afterwards with
`filter()`. Removing from an array mid-iteration skips the next element, which
produces enemies that survive being shot, rarely and unreproducibly.

## D8 — The weapon has a bounded firing range · 2026-09-07
Unlimited range made the game a screen-clearing sniper exercise with no
tension. A bounded radius forces enemies into the player's space. Implemented
by seeding `nearestEnemy()`'s search distance with `player.range` rather than
`Infinity` — one line does both jobs.

**Extended 2026-09-12:** it is a *real* range, not a detection range. Shots
track distance travelled and die at the ring, so the drawn ring means exactly
what it shows.

## D9 — Fixed 1280×800 logical arena, scaled to the window · 2026-09-12
Difficulty used to depend on monitor size: the same bot died at 61s on
1280×800 and survived past 200s at full HP on 3440×1440, because spawn rate was
fixed while kiting room was not. The arena is now a constant world scaled to
fill the window, and the letterbox margin is painted the same near-black as the
background, so it's invisible.

**Rejected:** scaling spawn rate with window area (works, but difficulty still
varies subtly); a camera with an unbounded world (genre-authentic, but loses
the cornering tension and is a bigger change).

## D10 — Geometric XP curve · 2026-09-12
`xpNext = 5 × 1.45^(level−1)`. The old linear `5 + level×3` grew by a flat +3
while XP income compounded, so levels got *cheaper* in real terms: measured
seconds per level were 27, 8.8, 8.6, 5.6, 8.5, 5.0, 4.9.

## D11 — Gems expire after 8 seconds · 2026-09-12
They blink for their last two. Before this, 40–67 gems were left lying on the
floor at death — stranded XP in territory too dangerous to re-enter, which was
clutter rather than a decision. Now it's use-it-or-lose-it.

## D12 — Input is matched on `e.code`, never `e.key` · 2026-09-12
`e.key` is the character a key *types*, which depends on the layout — on a
Russian layout WASD type ц/ф/ы/в, so the game silently ignored them. `e.code`
is the physical key. This also does the right thing on AZERTY, where those four
keys are labelled ZQSD, which is what French players already use.

## D13 — One `screen` variable · 2026-09-12
Replaced the `paused` and `dead` booleans, which could contradict each other.
`title | playing | levelup | paused | help | options | dead` — exactly one
answer at a time, so "what does Esc do right now" is a lookup.

## D14 — Two input sets: held vs. just-pressed · 2026-09-12
`keys` holds what is currently down (right for movement); `justPressed` holds
what went down this frame, ignoring OS auto-repeat (right for menus, or holding
Down flies through the list). Cleared at the end of every `update()`. This also
deleted a `keys.delete('Digit1')` hack that existed only to fake edge detection.

## D15 — Screen shake eases out exponentially · 2026-09-12
`shake *= Math.pow(SHAKE_FADE, dt)` with a floor that snaps to zero. Linear
decay ran at near-full strength and then stopped dead, which reads as the
picture being switched off rather than settling. Because the fade is a fixed
*proportion* per second, amplitude can be tuned without changing how long it
lasts — a 7px hit and a 38px death both come to rest at the same moment.

Anything time-based uses `Math.pow(_, dt)`, never a per-frame factor: a
per-frame factor runs 2.4× faster on a 144Hz screen. This bit the particle drag
once and is now pinned by a check.

## D16 — Verification: `?test` checks plus a Playwright bot · ongoing
`console.assert` checks behind `?test` cover the logic. Balance is measured by
driving `update()` faster than real time with a scripted bot and reporting
survival distributions. **Game feel is Igor's call and is never asserted.**

A check that can only pass proves nothing: the sound-level check was verified
to fail at the old amplitude, and the shake check was found weak precisely
because it never let the player die.

## D17 — The browser build is a throwaway prototype · 2026-09-12
The end goal is a native executable with real graphics; the browser version
gets dropped after that port. So the deliverable of this phase is **not
`index.html`** — it is the settled design, the tuned constants, the data
tables, and the `?test` checks, which become the port's regression suite.

Measured: only ~23% of the code is platform-bound.

## D18 — `game/` vs `platform/` split, plain scripts · 2026-09-12
The port seam made physical. `game/` contains zero browser API and reaches
across for exactly five names: `sound`, `keys`, `justPressed`, `tapped`,
`moveCursor`. Loaded as plain `<script>` tags, not ES modules, so
double-clicking `index.html` still works.

**Rejected:** ES modules, a bundler — see `ideas.md` → Declined.

## D19 — No settings persistence yet · 2026-09-12
Volume and shake reset on reload. Igor's explicit call. ~6 lines whenever it's
wanted.

## D20 — Mouse aim and an offensive dash · 2026-09-19
The weapon no longer picks its target. It still fires by itself, and still only
when something is inside the ring, but it fires along the cursor. `Space`
dashes: 0.16s at 3.4x speed on a 2.2s cooldown, invulnerable throughout, and it
damages everything it passes through for `player.damage`, once each.

Why: the player had exactly one continuous decision — where to stand. Aim adds
a second, and the dash adds a spent resource with a timing decision attached.
Auto-*attack* is untouched, which is what makes it a survivors-like; Brotato
and Deep Rock Survivor aim the same way.

The dash is offensive by Igor's call — escape *and* damage, so diving into a
crowd is a play rather than only a mistake. It reuses two existing mechanisms
rather than adding any: `player.hurt` is already the i-frame timer, and the
dash takes an id from the bullet id space so `lastHitBy` stops it hitting the
same enemy twice — the same trick pierce uses.

**This takes the port seam from five names to six** — `aim` joins `sound`,
`keys`, `justPressed`, `tapped`, `moveCursor`, superseding the count in D18.
The conversion from screen to arena pixels stays on the platform side, so
`game/` still sees only world coordinates and still has zero browser API.

**Rejected:** dashing toward the cursor (the cursor is where the enemies are,
so it dashes *into* them — the point of splitting aim from movement is running
one way while shooting the other); firing constantly with no enemy in range
(simpler, but 2.5 shots/second of sound for a whole run, and it drops the
silence that makes a spawn audible); a custom crosshair (the OS cursor already
shows where you aim).

**Deleted:** `nearestEnemy()`, and the check that it targeted the closest
enemy. Its range half survives as `enemyInRange()`, so D8 is still pinned.

**Measured:** with a bot that kites, aims at the nearest enemy and dashes when
crowded, survival medians 38.5s with the dash and 39.0s without — inside the
noise. A dumb dash policy is worth nothing, which is the intended shape: the
ability pays out on timing, not on possession. The documented 55.2s baseline
predates aim and dash and no longer applies; that bot had no policy for either.

## D21 — Aim feedback, level-up input, and the dash that read as a teleport · 2026-09-19
Three follow-ups to D20, all from playing it.

**A dashed aim line** from the player to the edge of the ring, fading as it
goes, with a crosshair at the end. Auto-fire along a cursor is guesswork
without it: the ring says how far, the line says where.

**The level-up screen takes mouse and arrows.** Reaching for `1`/`2`/`3` and
then back to WASD mid-run is uncomfortable, which is the whole complaint. It
now opens on the middle card; `A`/`D` or the arrows move the highlight, Enter
or Space takes it, and a click takes the card under the cursor. The numbers
still work — they cost one line and some players will prefer them.

The mouse buttons go into the existing `keys`/`justPressed` sets under
`'Mouse0'`, a code no keyboard can emit, so `tapped()` serves both devices and
**the seam stays at six names**. Card geometry moved to `cardRect()` in
`content.js`, since the renderer draws the cards and the logic hit-tests them;
it could honestly live in neither.

**The dash was not a teleport, it was a blink.** It always moved at 3.4x over
0.16s — about 140px, ten frames of travel. But it sets `player.hurt` for the
i-frames, and the renderer blinks the player while `hurt > 0`, so the player
winked out mid-flight and reappeared at the far end. The fix is to suppress the
blink while `dashTime > 0` and leave an afterimage spark each frame of the
dash, not to change the speed. Tuning the numbers would have chased a
rendering bug with balance changes.

**Also:** the dash sound was retuned from a rising sine to a falling triangle.
It was audible — the sound-level check covers every entry in `SOUNDS` and
always passed — but a rising blip does not read as a dash.

**Rejected:** mouse support for the title and pause menus, for now. Those
screens have no WASD to switch back from, so they do not have the problem that
motivated this. The machinery is in place if it is wanted (`ideas.md`).

## D22 — The mouse works on every screen · 2026-09-19
Supersedes D21's "rejected: mouse support for the title and pause menus, for
now". Igor: "allover mouse & keyboard integration is good."

Hovering a row on the title, pause or options screen moves the cursor to it; a
click runs it. On options a click cycles the value forward, which is what Enter
already did, so there is no new verb to learn. A click dismisses help and
restarts from the death screen. Every keyboard path is untouched.

Rows are full-width bands (`rowRect` in `content.js`, 420x38 anchored on the
text baseline), so the mouse hits a row anywhere along it rather than only on
the glyphs. The renderer draws from the same constants it hit-tests against,
so the band cannot drift from the label. Still six names at the seam.

The "has the mouse actually moved" guard from D21 became `mouseMoved()`, now
that three screens need it. Exactly one screen path runs per frame, so it stays
a once-per-frame call despite looking like shared state.

**Found while doing it:** four older checks only passed because `aim` happened
to be left pointing at the enemy by whichever check ran before them — an
accident of ordering that appeared the moment mouse aim landed. They now place
the cursor explicitly with `aimAt()`. A check that depends on inherited state
is a check that will lie to you later.

## D23 — The dash is a force dash · 2026-09-19
Igor: "dash must larger damage radius, a sort of wave in front and a slight
finishing animation... so like it's a force dash."

The dash now pushes a wave ahead of it instead of only hurting what it bumps
into. Three parts:

- **Reach.** `d < e.r + DASH_REACH` (40px) rather than `e.r + player.r` (10px),
  so the wave clears a lane rather than threading a needle.
- **A front, not a circle.** The dot product of the enemy's direction against
  the dash's must beat `DASH_ARC` (0.2, a 156-degree front). The direction is
  frozen at the dash's start in `dashDx/dashDy`, so releasing the keys
  mid-lunge cannot spin the wave around.
- **Force.** A hit is shoved `DASH_PUSH` (320px/s) directly away from the
  player, bleeding off at `Math.pow(PUSH_DRAG, dt)` — about 80px of travel.
  Enemies carry `pushX/pushY` for this; it is the first velocity they have
  ever had, since they otherwise walk straight at you at a fixed speed.

Visually: an arc at the edge of the reach while the dash runs, brightest at
the start, and a ring that expands and fades over `DASH_END` (0.18s) when it
lands — the "slight finishing animation", so the lunge finishes rather than
merely stops.

**Measured**, 21 runs per configuration with the same bot: no dash 38.7s, dash
away from danger 37.8s, dash into the nearest enemy 36.6s. All within a couple
of seconds. The force dash is not a power creep at bot level — and dashing
*away* gains nothing at all, because the wave then faces away from everything.
That is the intended shape: the reward is for turning into the crowd, which is
a read a fleeing bot cannot make. Whether it is *fun* is Igor's call, per D16.

**Also:** the aim crosshair was too big (ring 7px, ticks out to 15). Now 3.5px
with ticks to 10, so it marks the spot without pulling the eye off the enemies.

## D24 — Abyss is 2D, permanently · 2026-09-19
Not a phase, not a prototype simplification. Igor: 2D "is not gonna change."
Recorded because it is a *constraint*, and constraints that live only in
someone's head get re-litigated every time the port comes up.

What it settles, for the port and for everything after it:
- **Unreal is out.** 2D is a bolt-on there.
- **Unity is oversized.** A GB-scale editor, C#, a scene graph and `.meta`
  files, to replace 476 lines of canvas drawing that uses maybe 5% of it.
- **Godot is not a port, it is a rewrite** into a scene-graph, node-and-signal
  paradigm. It would throw away the six-name seam and most of what makes the
  port cheap. It stays the answer only if "performant engine" ever becomes the
  real goal — and per D17 and the measurements, performance is not the
  problem.
- **macroquad (Rust) / raylib (C/C++) remain the target**, and 2D being fixed
  is *why*: both are near 1:1 with what `render.js` already does — a frame
  loop and immediate-mode draw calls. Nothing to learn but syntax.

## D25 — Surveyed the agent-tooling ecosystem; installed nothing · 2026-09-19
312 plugins across the three configured marketplaces, plus the wider
ecosystem. Recorded so this survey is not repeated.

- **Official catalog: nothing for gameplay design or balance.** Closest are
  `math-olympiad` (competition proofs, not applied probability) and
  `playground` (single-file HTML explorers with sliders — genuinely a fit for
  balance tuning *later*, and dependency-free, so it does not violate D4).
- **`rust-analyzer-lsp` / `clangd-lsp`** are worth exactly one line of setup,
  on port day. Useless before the first `.rs`/`.cpp` file exists.
- **`gamedev-skills/awesome-gamedev-agent-skills`** (third-party, Apache-2.0,
  73 skills, installable in slices) is the only real gamedev option. Of it:
  the `disciplines` slice (15, engine-neutral — `game-feel`, `game-ai`,
  `procedural-gen`) is the only part worth considering, and `game-feel` mostly
  *confirms* D15 and the parked hitstop idea rather than teaching anything.
  Engine, genre and workflow slices are all ruled out.
- **The `roguelike` genre skill does not apply.** It is about *traditional*
  roguelikes — Berlin Interpretation, turn scheduler, grid movement,
  field-of-view, BSP dungeon generation. Abyss is a **survivors-like**, which
  shares the word "roguelite" with that genre and nothing else. Searching for
  "roguelike design" returns dungeon-generation material this project will
  never use. Worth knowing before looking again.
- **No game-balance skill exists anywhere** in 385 surveyed skills. It is the
  least-covered discipline in the ecosystem.

**Rejected:** installing the `disciplines` slice now. Third-party instruction
files, GDScript/C#/Python samples that do not transfer to plain JS, and real
per-session context cost, to confirm decisions already made. Revisit when
enemy behaviours are actually being built.

## D26 — Installed the `disciplines` skills; supersedes D25's rejection · 2026-09-20
D25 rejected this a day earlier on three grounds. Two were wrong on
inspection, so the decision flipped rather than being argued again.

- **The context-cost objection was wrong.** Skill bodies load lazily; only the
  ~15 frontmatter descriptions stand in context, about 1.5k tokens, not the
  29k the full set weighs on disk.
- **The "already covered" objection was too broad.** Reading all fifteen
  rather than judging by name found two with real value:
  - **`game-ai`** — its seek/**arrive** steering is exactly the parked ranged
    drifter (stop *at* range rather than overshoot), and its own rule, "2–5
    states → FSM, not a behavior tree", sizes the charger's `approach →
    telegraph → lunge → recover` correctly.
  - **`procedural-gen`** — not for noise or dungeons, which this game has no
    use for, but for seeded deterministic RNG. It surfaced a real gap in the
    D16 bot methodology; see `ideas.md` → Seeded RNG.
- **Durability was the argument missed entirely.** The skills fire in future
  sessions where the analysis behind this entry is no longer in context.

The remaining twelve are inert here: no camera (D9), no physics engine, no
shaders, no dialogue, no assets (D4), menus already data-driven (D6), input
already better handled (D12/D14), and performance is not a problem.

**Standing caveats.** Third-party (Apache-2.0, version-pinned, validator, not
Anthropic-vetted). Every code sample is GDScript/C#/Python, so patterns
transfer and code does not — notably **`game-ai`'s FSM is class-based state
objects, which violates D5**. Take the concept, reject the shape: a `behavior`
field plus a branch, as `ideas.md` already specifies.

**Unchanged from D25:** the engine, genre and workflow slices stay out, and
the `roguelike` genre skill is still the wrong genre for a survivors-like.

---

# Phase 2 — the full game

D27 onward come from `high level design.md` and the session of 2026-09-26.
Several reverse founding decisions; each says which.

## D27 — Batches are hard-gated; the descent stops · 2026-09-26
The dive halts at an encounter, the arena locks, and motion resumes only once
the batch is cleared. Smooth scrolling happens *between* gates, not during
them. Hades-shaped, per the reference in the design draft.

Chosen over: a soft gate (scroll slows at chokepoints — keeps constant motion
but makes "defeated" fuzzy, and a fuzzy gate cannot be asserted); no gate at
all (waves you outrun — cheapest, but it is the survivors-like we are leaving);
gating only at bosses (fewer stops, but then regular batches carry no stakes).

**This deletes the spawn director**, and that is the point. The prototype's
balance failure was mathematical: arrivals grew as `1/(1.2 − 0.02t)` —
hyperbolic — while power grew logarithmically in kills, so the queue diverged
and death was certain. The numbers, computed 2026-09-27 before any of it was
deleted: arrivals ran at `1/(1.2 − 0.02t)` spawns/sec — 0.83 at the start,
6.67 by t=52.5s where `SPAWN_FASTEST` clamped, so **eight times the rate in 52
seconds, doubling in the last 7.5**. Weighted mean enemy HP was `21/11 ≈ 1.91`,
so holding the line at the clamp needed ~12.7 DPS against a starting 2.5 — a
**5.1× growth in 52 seconds** — while the geometric XP curve bought about seven
ranks, of which maybe four offered a damage pick. Clearing that bar was
possible on a good draw, having spent every pick on damage. Most runs lost.

A batch is a **bounded** queue. The divergence cannot occur. The whole class of
problem is retired rather than tuned around.

## D28 — Manual fire via LMB; supersedes D2's auto-shooter · 2026-09-26
The weapon no longer fires itself. The game is a twin-stick action roguelite,
not a survivors-like. D2 is superseded; D20's mouse aim survives and is now
half of a complete manual scheme.

**Every balance constant in the prototype is invalidated by this.** Auto-fire
and manual fire are different games: fire rate stops being a pure throughput
number and becomes a skill expression, damage-per-shot starts mattering more
than damage-per-second, and the player's attention budget becomes a real
resource. The `// balance` block is re-derived from scratch at S1, not adjusted.

It is also what makes the design's weapon variety possible at all — melee and
a railgun are meaningless without a trigger.

## D29 — Vertical scrolling dive with a camera; supersedes D9 · 2026-09-26
The fixed 1280×800 arena becomes a camera following a descent. D9's *reason*
outlives its implementation and is promoted to a requirement: difficulty must
stay invariant to window size. That was a real measured bug once — the same bot
died at 61s on 1280×800 and survived past 200s on 3440×1440 — and a camera is
exactly the change that can silently reintroduce it. It gets a check.

## D30 — Browser stays throwaway; dependencies permitted but declined · 2026-09-26
Reaffirms D17 after the question was reopened: alpha is built in the browser
and ported afterwards, so the `game/` ⁄ `platform/` seam keeps being maintained
as it grows. The seam costs effort every stage; that cost is accepted
deliberately rather than by inertia.

Dependencies were explicitly permitted by Igor this session ("libs, frameworks,
all the needed stuff is absolutely allowed") and are **still declined**, on
measurement grounds rather than principle:

- The real bottleneck is `ctx.shadowBlur`, not Canvas 2D. It is a per-draw
  gaussian blur, roughly two orders of magnitude costlier than a plain fill,
  and it is the entire visual identity from D3.
- The fix is ~20 lines and no dependency: render each glowing shape **once** to
  an offscreen canvas at startup, then `drawImage` the cached bitmap. Canvas 2D
  handles thousands of `drawImage` calls per frame. Per-frame cost becomes
  one-time cost, the look is unchanged, and D4 survives — generated at runtime,
  not an asset file.
- PixiJS/WebGL buys 10k+ sprites, which is capacity with no use here, in the
  one layer D17 calls throwaway. Phaser is worse: it would own the game loop
  and entity model — replacing the code we are *keeping*.

**Revisit only on a measured failure against the stated entity budget**, not on
a feeling that it might be slow.

## D31 — Two-tier progression, built extension-ready · 2026-09-26
Persistent gear bought with currency on the home screen, **and** run-scoped
picks that reset every dive. Both, as the draft specifies.

Igor's read: option #1 now, #3 (run-scoped picks tied to the equipped weapon)
is more interesting but multiplies the balance surface by the weapon count, and
#2 (persistent only) is safest. Resolution: **take #1, and make #3 reachable
without a rewrite.**

The mechanism costs one parameter. A run-scoped pick is a data record with a
`scope` field — `player` for a generic stat buff, `weapon` for one that
modifies the equipped weapon — and its `apply` receives both the player and the
equipped weapon from day one. Generic picks ignore the weapon argument. Adding
weapon-scoped picks later is then *content*, not surgery, exactly as D6
intends.

Sequencing keeps the danger contained: the pick pool stays **entirely generic
through S1–S4** so one progression system is balanced at a time. Weapon-scoped
picks arrive at S5, when weapons actually exist, per weapon, measured. If the
balance surface proves unmanageable there, we stop at #1 having lost nothing.

## D32 — Fixed vocabulary; the glossary is binding · 2026-09-26
`high level design.md` uses "level" for both a section of the abyss and an
in-run XP level, "upgrade" for both a shop purchase and a run-scoped pick, and
"batch"/"wave" interchangeably. Sessions drift on vocabulary before they drift
on design, and two sessions using "level" differently will produce
incompatible work without either noticing.

`foundations.md` fixes the terms — **layer, rank, mod, gear, batch, wave, dive,
run** — and they are binding in docs *and* in code identifiers. Renaming later
costs a sweep of both.

## D33 — Mod offers do not interrupt combat · 2026-09-26
The prototype paused the game and threw up three cards the instant the XP bar
filled. Igor, 2026-09-26: that must not happen — a comfort requirement, not a
preference.

**The gate already provides the moment.** D27 (Batch-gated descent) stops the
descent whenever a batch is cleared, which is a natural, earned, non-combat
beat. Mod offers land there. No modal, no mid-fight pause, no decision made
while something is swimming at you.

Consequence worth naming: ranking up mid-batch must therefore *bank* the choice
rather than present it, so a dive can arrive at a gate owing more than one mod
pick. That is a queue, and it needs a rule for what happens if the gate offers
three picks at once. Open, filed in `ideas.md`.

**Igor's stated pitfalls with the whole mod concept**, recorded because they are
the right worries and should be answered by measurement at S1 and S6 rather
than by argument now: stacking duplicates of the same mod, balance shifting
under compounding mods, and ranking up too fast so mods arrive faster than the
player can weigh them. None is decided here. Each becomes a check or a measured
number.

## D34 — Mods: a lightweight choice, one per gate · 2026-09-27
Settles the mod system after brainstorming. Igor: "let it be a lightweight
choice. makes it diverse, slightly unpredictable."

**Mods are a choice, deliberately a shallow one.** Three offers, chosen in about
a second. A choice survives rather than an automatic grant because the pillar
"two dives of the same layer draw different batches" wants variety, and a grant
has none. But it is explicitly *not* a build decision — heavy thinking belongs
at `home` (Igor, 2026-09-26), so `gear` carries strategy and mods carry
momentum.

**Mods differ in kind, not degree.** "Shots pierce" vs "you move faster" vs
"heal 1" is a gut read. "+15% fire rate" vs "+2 damage" is arithmetic, and
arithmetic is the heavy thinking the dive must not contain. One short line per
mod, no number the player must compare across categories. Never two mods that
do the same thing by different means; never offer one already maxed.

**One rank per batch cleared. The XP curve is deleted — supersedes D10.**
Under D27 (Batch-gated descent) XP stops being a stream and arrives in lumps,
one per batch, so the tunable is "how many mods per layer", not a curve.
`XP_BASE`, `XP_GROWTH` and the geometric curve go. A 12-batch layer grants 12
mods; balancing becomes arithmetic instead of integration.

This also **supersedes the banked-picks consequence recorded in D33**. Rank-ups
now happen only at gates, so a gate can never owe more than one pick and the
queue rule D33 asked for is not needed.

**Gems become currency, not XP.** Two drop systems collapse into one, and the
drop flows to `home`, which is where the design wants the thinking. Open
consequence: D11 made gems expire after 8 seconds to stop stranded XP piling
up in unsafe territory. Expiring *money* is a harsher proposition. Unresolved,
filed in `ideas.md`.

**The starting pool is body and comfort mods only.**
- **body** — weapon-agnostic: move speed, max HP, dash cooldown, pickup radius,
  i-frame duration. Identical value whatever weapon was brought.
- **comfort** — heal on batch clear, brief invulnerability at a gate, currency
  magnet. Near-zero balance risk, high feel.
- **weapon** mods wait for S5 — Content, per D31's `scope` field.

Reasoning, which reverses what D31 called safe: a "generic" mod touching weapon
stats is *not* safe once weapons are diverse. "+15% fire rate" is meaningless on
melee; "+2 damage" is huge on a railgun and negligible on a spray weapon. Body
and comfort mods are weapon-agnostic by construction, so they are the genuinely
safe start — and they keep S1 (Combat core) from balancing mods and manual fire
at the same time.

**Still parked:** multi-rank mods. A mod costing two ranks is a mod costing two
points, so that is the mod-points idea in `ideas.md` and it waits for the flat
pool to be balanced first.

## D35 — Currency is auto-collected; combat is the dive's only dynamic · 2026-09-27
Gems drop, fly to the counter on their own, and show a `+N`. No chasing, no
pickup radius, no stranded money.

**Why it is right here, and would have been wrong in the prototype.** The
gem-chase existed to pull a kiting player back into danger — necessary when you
could run forever. Under D27 (Batch-gated descent) you cannot leave: clearing
the batch is mandatory, so enemies already are the reason to move. The
gem-chase is redundant pressure, and removing it takes friction out of a dive
that is meant to be fast.

**Closes the D11 gem-expiry question rather than deciding it.** Nothing can be
stranded, so nothing needs to expire.

**One source of randomness, not two.** A threatening enemy *always* drops;
only the value is random. Drop-chance × value-variance is two dice on one
reward, and a batch that rolls badly pays nothing for reasons the player cannot
see — which reads as a stingy game, not as variance. This follows the draft's
own "depending on their level of threat".

**Popups are debounced.** Batches run one to tens of enemies; ten simultaneous
`+1`s is combat spam, which is what D33 (Mod offers do not interrupt) exists to
prevent. One aggregated `+7` beats seven `+1`s.

**Where the `+N` appears is a feel call, unasserted** (D16). Two candidates get
built and Igor picks: at the corner counter, or at the kill position where the
eye already is. A gem flying to the corner pulls attention off the fight, which
is how you die — but it also reads as "money in the bank". Looking beats
arguing.

**Combat is the dive's only dynamic system.** Igor, 2026-09-27: "a combat is
the real focus and the only real dynamic". Promoted to the genre contract in
`foundations.md`. It rules out, without further discussion: resource gathering
during a dive, mid-dive shops, puzzle or traversal segments, inventory
management while diving. A dive contains fighting, descending, and one
one-second mod pick. Nothing else.

**Supersedes part of D34 (Mods):** pickup radius leaves the body-mod pool,
along with `pickupRange`, `GEM_PULL` and the `Lure` upgrade. That leaves four
body mods — move speed, max HP, dash cooldown, i-frame duration — which is too
thin to offer three from without near-total repetition. Per Igor's own
follow-up, **comfort mods carry the width of the pool**; weapon mods still wait
for S5 (Content).

**Balance note on currency mods specifically.** Igor's first suggestion is
"more valuable enemy loot", which is weapon-agnostic and therefore safe in the
sense D34 means. But it is the one mod family whose effect **crosses the dive
boundary**: the mod vanishes at the end of the dive, the money it earned does
not. So a currency mod is strictly stronger across a campaign than a stat mod
of nominally equal power, and it cannot be balanced by looking at a single dive.
It needs a per-campaign measurement at S6 (Balance), not a per-dive one.

## D36 — Attributes: a second persistent tier, spent at home · 2026-09-27
Settles the provisional tier and **closes the entry condition on S4 (Meta loop
skeleton)**. Igor's proposal, 2026-09-27: micro-tasks in a layer earn attribute
points; the player spends them freely on the character at home.

**Why the tier survives rather than collapsing into currency.** Attribute
points are **non-fungible** — money cannot buy them and they cannot buy gear.
That is the whole justification: it is the one thing `gear` structurally could
not do. A player cannot grind cash to skip ahead. Spending at home also puts a
real decision where the design wants thinking to live.

**The cap is on earning, not spending.** The draft said attributes are capped;
"spend freely" pulls the other way. They reconcile if a layer contains a finite
set of micro-tasks, so points are limited by how far the player has got.
Progression is gated by layer exactly as Igor originally intended, "spend
freely" stays literally true, and there is no per-attribute cap logic to write.

**Attributes and gear touch different axes and SUM. They never multiply.**
- `gear` → combat: weapons, damage, defence.
- `attribute` → body: health, speed, dash, i-frames.

Igor's objection is accepted in principle — one character, every progression
feeds it — so the rule is not "the systems must not touch", it is **"the
systems must not multiply"**. Two additive systems give power ∝ (a+b): bounded,
and a designer's linear intuition tracks it. Two multiplicative systems give
a×b, so the ceiling grows quadratically and the gap between an optimised and a
naive build explodes; balancing then targets the product's maximum and makes
every ordinary build feel weak. Hard to walk back once content depends on it.
**Multiplicative interaction is parked** (`ideas.md`), not declined.

**Requirements are adopted, and are not multiplication.** A gear item may
require an attribute threshold — "heavy gun needs strength 5". This changes no
number; it changes *when* a thing becomes accessible. It is scheduling, not
scaling, and it is balance-*positive*: it stops a player equipping late-game
gear the moment they can afford it, which is a classic way a shop breaks a game.
It also gives attributes a build decision flat stat-adds cannot — dump into one
attribute to unlock, or spread for survivability.

Cost: a `requires` field on a gear record. Content data, not save data — a save
holds owned gear, tiers and points spent, never the gear *definitions* — so it
does not touch the S4 schema and can land at S5 (Content) with the weapons.

**Micro-tasks reward mastery, not quotas.** "Clear a batch without taking
damage", "reach the bottom under N seconds", "beat the mini-boss without
dashing" — not "kill 50 darters". A quota creates a farming incentive, which
fights both D35 (combat is the dive's only dynamic) and the draft's own stated
wish to avoid grinding. Same reward feel, no incentive to play repetitively.

**Amends a non-goal.** `foundations.md` listed "a second currency" as a
non-goal. Attribute points are technically a second currency, so that non-goal
is narrowed to a second *money* — a fungible drop spent alongside the first.
A non-fungible progression point is a different animal and is now permitted.

**Requires persistent micro-task tracking.** Counters survive across dives, so
they are in the S4 save schema from its first version.

## D37 — Scenarios: named dev setups, shared with the bot · 2026-09-27
Igor asked for isolated playtesting — one enemy, one batch, one layer — for
convenience during development. Adopted, and scoped into S0 (Foundations &
spike) because it is a tool that makes every later stage measurable and changes
no gameplay.

**Scenarios are data, like everything else** (D6). A `SCENARIOS` table in
`game/content.js`; each entry is a named set of overrides — which layer, which
batch, which enemy types, what gear and attributes the player starts with, which
seed. Adding one is a line.

Loaded by URL: `?dev=<name>`, optionally `&seed=<n>`. **Not `?test`** — that
param is matched exactly so cache-busting strings cannot trigger it, and that
property must not be weakened.

**The important part: one mechanism, two consumers.** The bot needs to drive
specific setups to measure balance, and Igor needs to drive them to playtest.
These are the same requirement. Building a debug menu *and* a bot harness would
be building the thing twice — the bot selects a scenario by name exactly as a
human does.

Harmless in a shared build: query-param gated, so nobody reaches it by accident,
and no separate build is needed to strip it.

**Rejected:** an in-game debug menu (more UI to build, and unusable by the bot);
hard-coded test entry points (not data, so every new case is a code change);
a separate dev build (two artefacts to keep in sync, and the alpha must stay a
single shareable thing).

## D38 — The `home` screen is canvas, with layout as data · 2026-09-27
Decided early rather than at S4, since nothing depends on it and Igor's stated
priority settles the trade: "i value robustness and stability over the
development speed."

HTML/CSS would have been roughly a day's work against several, because the
browser supplies layout, text wrapping, scrolling and hover for free. Declined
anyway, on two robustness grounds that outweigh the speed:

**1. Canvas UI is checkable by the same oracle as the rest of the game.**
Hit-testing a rectangle is pure geometry, so it lives in `game/` and `?test` can
assert "a click here selects gear row 3" exactly as it asserts collision or
i-frames. HTML hit-testing belongs to the browser: outside the port seam,
untouchable by the assertion suite. `foundations.md` requires every behavioural
change to land with a check that fails without it — an HTML `home` would be the
only part of the game exempt. That is a hole in the verification contract, not a
trade inside it.

**2. The two options fail in different kinds of way.** Hand-rolled layout fails
**visibly and locally** — a row is misaligned, a hover box is three pixels off.
Seen immediately, fixed small, cannot spread. Two-technology integration fails
**invisibly and globally** — focus on the wrong layer, an overlay that does not
scale at 3440px, the shop still up during a dive on some path. That second class
is what bit this project at D9, where window-size difficulty drift was invisible
and found only by measuring. Robustness prefers **fewer systems even at the cost
of more code**, because more code fails where it can be seen.

Also weighed: the look is glow-on-black (D3), which a canvas `home` inherits for
free and an HTML one only reproduces after styling work — which would have eaten
much of the time saved. And the port stays a *translation* of worked-out layout
arithmetic rather than a *redesign* of a screen with none.

**The cost is accepted and mitigated.** Hand-rolled layout arithmetic is a
bug farm, so it is not written as arithmetic scattered across screens: **layout
is data**, produced by one small helper that turns a list into rectangles and is
used by every screen. Pure geometry, so it lives in `game/` and ports. ~30
lines. Layout bugs then concentrate in one checkable function. This is D6
(Content is data) applied to UI, and it removes most of HTML's advantage.

**Revisit only if** the gear list outgrows a screen and needs scrolling,
tooltips and comparison views — at which point hand-written layout stops being
reasonable and this entry gets superseded rather than stretched.

**Not Claude's to verify:** whether the screen *looks* right. A screenshot shows
that things are placed, not that they are placed well. Igor's eye, per D16.

## D39 — Test stack: Vitest + fast-check, dev-only · 2026-09-27
Signed off by Igor 2026-09-27. First dependencies the repo has ever had, and
the first `package.json` / `node_modules`.

**This does not violate "no dependencies."** That constraint (D1, CLAUDE.md) is
about *running the game*: `index.html` stays a double-clickable page loading zero
libraries. Test tooling never ships and never loads at runtime. The constraint is
unchanged, not bent.

**Two defects in the existing suite, fixed first.**
1. **It cannot fail.** `checks.js` uses `console.assert`, which logs and
   continues — no count, no exit code — and the file ends with
   `console.log('checks done')`, which prints whether or not assertions failed.
   The suite can rot silently while appearing to pass. Replaced with a `check()`
   that counts, groups by name, and ends in `N passed / M failed` or shouts.
   ~15 lines, no dependency. **Highest-value fix in the whole test story.**
2. **Order dependence.** Checks mutate shared game state, and the file already
   documents the consequence: *"Inheriting whatever the previous check left
   behind is how a few of these used to pass by luck."* Each check gets a clean
   reset.

**Why these tools.** fast-check is the clear leader for property-based testing
in JS (~10.4M weekly downloads, own types, integrates with every runner). Vitest
is the 2026 recommendation for new projects; `node:test` is zero-dependency but
lacks watch mode and snapshots, and watch mode matters because the simulation
and invariant layers are re-run constantly. The install-free fallback —
`node:test` plus hand-rolled generators — was offered and declined: ~80% of the
ergonomics for no `node_modules`.

**Two suites, split by what each environment can do.**
- **Node (Vitest):** logic units, deterministic simulation, invariants, soak.
  `game/` has no browser API, so it loads directly.
- **Browser (`?test`):** platform-level only — audio peak levels, canvas,
  real input. Node cannot check these.

**The organising principle: every recorded decision gets an invariant guarding
it.** A decision without a check is a decision that will silently erode, and
this is what makes a suite *covering* in a way a coverage percentage never is.
Starting list, each tied to its decision:
- A gate never opens while enemies are alive — **D27**
- A mod is never offered mid-batch — **D33**
- Rank increases only at a gate — **D34**
- Currency never decreases during a dive — **D35**
- Power is a **sum** of gear and attributes, never a product — **D36**
- Difficulty invariant across window sizes — **D29**
- Entity count never exceeds the budget — foundations
- HP always within `[0, maxHp]`; no position, velocity or stat is ever `NaN` or
  `Infinity`. Sounds trivial, matters most: a single `NaN` propagates silently
  through arithmetic and corrupts everything downstream. Property tests find it
  in seconds.

**Determinism is what makes any of this work.** Seeded RNG (S0) and fixed
timestep (S1) were chosen for balance-measurement reasons; they are also the
prerequisite for deterministic simulation testing. Consequence worth naming:
once fully deterministic, balance stops being statistical and becomes exact —
"seed 4471, batch 3 → cleared at tick 1094", not a distribution over 21 runs.

**Rejected:** screenshot diffing. The visuals are motion and glow, so pixel
comparison is brittle and cries wolf. "The screen is not black and nothing
threw" is the useful visual check; finer is not worth it.

**Deferred:** replay/golden snapshot tests. Excellent once a stage stabilises,
noise during active design — every intentional change churns the snapshots. Added
per stage at its exit, not during it.

## D40 — `docs/` and `CLAUDE.md` are tracked in git · 2026-09-27
Reverses commits `10b3b96` ("Move working docs out of git") and `002a562`
("Keep CLAUDE.md local too"). Both were right at the time and are wrong now.

**Why they were right.** In September the docs were a prototype's scratch notes.
Keeping them out of the repo kept the deliverable clean, and losing them would
have cost little.

**Why that inverted.** They now hold 40 decisions, the binding glossary, the
genre contract and the whole S0–S7 plan — everything that survives the port,
which D17 says is the actual deliverable of this phase. `index.html` is the
throwaway; `docs/` is not. Keeping the durable part untracked and the disposable
part versioned was exactly backwards, and there was no backup and no history for
either file.

**Second benefit, and the one that matters day to day:** the working agreement
requires docs to change in the same step as the code. Now they can change in the
same *commit*, so a diff shows the reasoning alongside the behaviour and the
changelog's commit citations actually resolve.

`.gitignore` keeps `.idea/`, `*.png`, and now `node_modules/` ahead of D39's
dev dependencies.

**Not reversed:** `high level design.md` stays as it is — Igor's frozen source
description, tracked now but still an input, not a working doc.

## D41 — Seeded RNG, and a dev server that cannot cache · 2026-09-27
First code of S0 (Foundations & spike). Closes the `ideas.md` item raised on
2026-09-20.

**mulberry32 in `game/state.js`.** 32 bits of state, one multiply-xor-shift
round; tiny, fast, statistically fine for gameplay. All 14 `Math.random()` call
sites in `game/` now go through `rng()`. A dive's seed is run state, which is why
it lives in `state.js` rather than in a file of its own, and `reset()` reseeds.

**The seam did not grow.** Reading a URL is a browser API, so `game/` never does
it: `main.js` parses `?seed=<n>` and passes it as an argument to `reset(seed)`.
Platform calling into `game/` is the existing direction, so this adds nothing to
the six names.

**One deliberate `Math.random()` survives**, in `reset()`, to *choose* a seed
when none is given. Choosing a seed is not part of the deterministic sequence; a
port does the same with whatever its language offers.

**Fixed a latent determinism hole found on the way:** `reset()` never cleared
`bulletId`, so two dives on the same seed handed out different bullet ids. Now
reset with everything else.

**Verified by breaking it** — a single `Math.random()` put back at the spawn-edge
pick made the suite report `1 of N checks FAILED`. Restored: all pass. Also
confirmed independently outside the suite that seed 777 replays identically and
differs from 778.

**`serve.py`** replaces `python3 -m http.server` for local testing. Two things
the stock server gets wrong here, both of which cost real time today:
- **It caches.** Across eight script tags the browser then runs a mix of old and
  new files — exactly the "baffling bugs" CLAUDE.md warns about. A human presses
  Cmd+Shift+R; Claude cannot, so the server sends `no-store` instead.
- **It is single-threaded**, so a browser holding a keep-alive connection blocks
  every other request, including the `curl` used to check on it. `serve.py` is
  threaded and speaks HTTP/1.0 so nothing hogs a worker.

Honest note: the stale content on the original port was never fully explained —
`http.server` reads from disk per request, so it should not have served an old
file. A fresh port with the new server resolved it, and the failure mode is
designed out rather than diagnosed.

**Also added, unplanned:** an `error` listener in `checks.js` so a throw partway
through still calls `report()`. Previously a mid-suite throw skipped reporting
entirely — loud in the console, but silent about whether the suite passed. It
caught a real case within minutes of being written.

## D42 — Scenarios implemented: stepped by default, `&play` to watch · 2026-09-27
Implements D37 (Scenarios). Four choices worth recording.

**Stepped is the default; `&play` opts into live.** `?dev=<name>` loads a
scenario and **does not start the frame loop** — nothing advances until
`advance(n)` asks it to. That is what makes a scenario inspectable: read the
state and it is still the state you set up. It is also how the bot will drive
the game faster than wall-clock time, so this is one mechanism serving both,
not debug-only scaffolding. `?dev=<name>&play` runs it live, which is the mode
Igor wants for eyeballing.

**A placed enemy gets its nominal speed — no jitter, no ramp.** `spawnEnemy()`
applies `ENEMY_JITTER` and `ENEMY_RAMP` because a random arrival should vary;
`placeEnemy()` deliberately does not, because a scenario exists to watch one
thing behave and must not vary. Verified: the drifter moves exactly 85px per
simulated second, its table speed.

**`advance()`, not `step()`.** `game/logic.js` already owns `step(dt)` as the
simulation's per-frame function. Naming the stepper `step(n)` in `main.js`
shadowed it — `main.js` loads later — so `update()` called the stepper, which
called `update()`, and the suite died with a stack overflow after four checks.
Renamed. The glossary (D32) governs game vocabulary; this is the same hazard in
code, and `design.md` documented `step()` all along.

**A stepped scenario draws its opening frame.** Without the loop nothing ever
paints, so `?dev=three-types` loaded as a black screen and read as broken. One
`advance(0)` at boot. **Only a screenshot caught this** — every state assertion
passed while the page showed nothing, which is a fair warning about what
state-only checking cannot see.

`spawnPaused` gates the spawn timer and is `false` after every `reset()`, so
normal play is untouched — S0's "zero gameplay change" holds.

15 checks added. The load-bearing one is that a paused
scenario never gains an enemy; without it a scenario is just a normal dive with
a head start.

## D43 — The glow cache is cancelled; the entity budget is measured · 2026-09-27
S0's performance item. The work was **not done**, because measuring first showed
it was unnecessary. This supersedes the technical premise of D30 (Browser stays
throwaway) while leaving its conclusion intact.

**What D30 claimed, unmeasured:** that `ctx.shadowBlur` is "a per-draw gaussian
blur, roughly two orders of magnitude costlier than a plain fill", that it is
"the real bottleneck", and that an offscreen sprite cache was "the single
highest-leverage technical change available". That was asserted from memory, not
measured. It is wrong.

**Measured**, Chrome via Playwright, 3440x1440 (scale 1.8), 60fps budget 16.7ms:

| Load | `draw()` | glow's share | `update()` |
|---|---|---|---|
| 250 entities | 0.10ms | 0.02ms | — |
| **500 entities** (the stated budget) | **0.20ms** | **0.05ms** | **0.55ms** (500 enemies x 200 bullets, 100k pair checks) |
| 1000 entities | 0.58ms | 0.33ms | 1.22ms (400k pairs) |
| 2000 entities | 2.72ms | 2.18ms | 3.67ms (1.6M pairs) |

At the stated budget the whole frame costs **under 1ms, about 5% of 16.7ms**.
Glow specifically costs 0.05ms — not two orders of magnitude, not a bottleneck,
not worth caching. An offscreen cache would have added a quantisation scheme for
continuously-shrinking particle radii and a resize-invalidation path, to save
0.3% of a frame.

**Consequences.**
- **The glow cache is cancelled.** CLAUDE.md's "sanctioned exception" for it is
  removed; the plain "do not invest in the canvas layer" rule now stands
  unqualified.
- **D30's conclusion is strengthened, not weakened.** Dependencies stay out with
  a better argument than before: Canvas 2D is not merely adequate, it is idle.
  PixiJS would buy headroom over headroom.
- **The 500-entity budget is not a binding constraint.** Measured headroom is
  roughly 4000 entities before a frame approaches 16.7ms. The budget stays as a
  *design* limit — how many things should be on screen at once — rather than a
  technical one. `foundations.md` says so now.
- **The spatial grid stays parked** (`ideas.md`), now with a measured trigger
  instead of a feeling: revisit above ~1500 enemies with ~600 bullets live.

**Two false readings caught on the way**, both from not checking that the
measurement measured anything: the first `update()` run showed cost *falling*
as entities rose, because the player died instantly in a crowd of 500 and
`step()` early-returns on the death screen; the second showed a flat 0.2ms
because bullets expire on contact, so the quadratic loop had no pairs. Numbers
that improve as load increases are a bug in the measurement, not a result.

## D44 — Node test stack landed; the port seam was 11 names, not 6 · 2026-09-27
Last item of S0 (Foundations & spike). Implements D39 (Test stack).

**Vitest 5 + fast-check 4, dev-only.** `package.json` is `type: module` and
`private`, with `npm test` and `npm run test:watch`. The game is untouched:
`index.html` still loads plain `<script>` tags and no libraries, and nothing in
`node_modules` ever reaches a browser. `type: module` affects only how Node
treats `.js`, and the game never goes through Node.

**`tests/harness.js` loads `game/` into a Node `vm` with the six seam names
stubbed and nothing else.** This is not a convenience — it is D18's seam check
made executable, and stronger than the grep `design.md` relied on.

**It immediately proved the documented seam false.** `game/` reached across for
**eleven** names, not six: the six, plus `LEFT`, `RIGHT`, `GO`, `DASH` and
`CLICK` from `platform/input.js`. CLAUDE.md, `design.md`, `foundations.md` and
D18 had all said six since 2026-09-12.

**Fixed by moving, not by re-documenting.** All seven binding constants (`UP`,
`DOWN`, `LEFT`, `RIGHT`, `GO`, `DASH`, `CLICK`) moved to `game/content.js`.
Which key means which action is *content* — the game decides dashing is Space,
while reading a keyboard is platform's job — so this is D6 applied, and it makes
the seam genuinely six. `content.js` loads first, so `input.js` and `render.js`
still see them. Pure move, no behaviour change: every browser check still passes.

**Six invariants, each guarding a decision**: the seam loads (D18); no NaN or
Infinity ever (D39); hp within `[0, maxHp]` and no dead enemy survives a sweep
(D7); the player stays inside the arena; a dive replays from its seed (D41); and
decay is time-based, not frame-based (D15).

**Verified by breaking each, and one of them was a fraud.** Replacing
`Math.pow(SHAKE_FADE, dt)` with a per-frame `0.94` failed the D15 property and
shrank to a two-step counterexample. But removing a `|| 1` divide-by-zero guard
— the exact bug the guard exists for — **passed all six**, because the input
generator picked random aim points and never put the cursor exactly on the
player. A property test is only as good as its generator, and an unexercised
edge case makes an invariant a check that can only pass. The generator now aims
at the player 8% of the time; the same break is then caught, with the failing
seed named.

`aim` starts at the arena centre, which is where the player starts, so that
degenerate case is not exotic — it is the state at boot.

## D45 — The weapon is manual · 2026-09-27
First code of S1 (Combat core), implementing D28 (Manual fire). The weapon no
longer fires itself: a shot leaves while `Mouse0` is held and the cooldown has
elapsed, along the cursor, dying at `player.range` as before.

**`enemyInRange()` is deleted, and with it the hold-fire rule.** "Do not shoot
unless something is inside the ring" existed because an automatic weapon would
otherwise empty itself into open water; with a trigger, that is the player's
call. Firing at nothing now costs a cooldown, which is the honest price. The two
checks that asserted the old rule were deleted rather than adapted — they
guarded behaviour deliberately removed, not a bug that might return.

**The cooldown is clamped at zero, not left to run negative.** Otherwise a long
pause banks shots and the first click empties several at once. Clamped, the
first click after any wait is instant and the held rate is honest — which is
the difference between a responsive trigger and a sticky one.

**Seven existing checks silently depended on auto-fire** — a fair measure of how
deep it was baked in. They now pull the trigger through `fireAt()`. And holding
`Mouse0` promptly leaked into a later, unrelated check, breaking the
bullet-range assertion: held input is shared mutable state exactly like any
other, which is the order-dependence D39 named, met in the wild. Each firing
block now releases the trigger.

**Five new checks**, and an auto-firing weapon fails four of them: no trigger
means no shot; firing with nothing in range is allowed; the cooldown never runs
negative while idle; the first shot after a wait is immediate; one second held
fires about `fireRate` shots. Verified by putting auto-fire back.

**Balance is deliberately untouched.** D28 says every constant is invalidated,
and they are — but there is no point tuning `fireRate` against a spawn director
that the batch queue is about to delete. The `// balance` block is re-derived
once batches exist, later in S1.

**Four of the five new checks were flaky, and I wrote them that way.** They let
time pass after a bare `reset()` — which since D41 draws a *random* seed — so
the unattended player sometimes died mid-wait, `step()` returned early, and the
result turned on the roll. One run passed, the next failed the same check. They
now use `reset(1)` with `spawnPaused = true`, and the suite was run five times
in a row clean to confirm. The lesson is the obvious one arriving late: a check
that lets the simulation run needs a seed and a quiet arena, or it is measuring
the weather.

**Verified by playing it**, not only by assertion: real mouse and keys through
`platform/input.js` gave 0 shots idle, 2 shots in 700ms held (`fireRate` 2.5, so
correct), movement and aim tracking, and 0 shots after release.

**The in-game help was left false, and only writing the README caught it.**
`HELP_BLURB` still said "Your weapon fires by itself", and `HELP_KEYS` had no
entry for shooting at all. Both fixed. This is the rule about fixing what a
change made *false* failing on in-game text rather than on docs — the same
failure mode, a file I did not think to grep.

**Adding that row then broke the help screen's layout**, because `HELP_BLURB`
started at a hardcoded `y` that assumed eight key rows. The list ran straight
through the paragraph beneath it. Every check passed while the
screen was unreadable; a screenshot caught it. `drawHelp()` now derives the
blurb's top from `HELP_KEYS.length`, so the data can grow without the layout
lying. Second time today that a state-only pass hid a visual break -- the first
was the stepped scenario rendering nothing (D42).

Five browser checks new, two deleted. The Node invariants are unaffected.

## D46 — The consistency sweep is part of every change · 2026-09-27
Igor: "check and update everything every time a change is made -- i dont want a
separate prompt for double checking code and docs consistency."

The rule already existed in CLAUDE.md and kept failing, so restating it a fifth
time was not the answer. What failed was always the *scope*: `docs/` got swept
and the other surfaces did not. CLAUDE.md now names all six, with the three that
have actually been missed called out as such — `CLAUDE.md`'s own factual claims
(it said six seam names while the code used eleven), **in-game text** (the help
still said the weapon fires itself long after D45), and **layout coupled to data
length** (adding one help row pushed the list through the blurb beneath it).

**Surface 5 is now executable.** `HINT_Y` and `helpBottom` are exposed from
`render.js`, and a check asserts the help screen ends above the hint. Verified
by padding `HELP_KEYS` with eight rows: `helpBottom` 975 against a limit of 726,
guard fires.

**Surfaces 4 and 6 stay human.** No check can read prose and decide it still
describes the behaviour, and memory lives outside the repo. Those are caught by
the discipline or not at all — which is why the rule ends with "then look at
it": a screenshot, because a state pass is blind to a blank screen and to
overlapping text, and both have now happened.

**Other screens carry the same hazard** — options and the menus stack rows from
tables too, and only the help screen is guarded. Filed in `ideas.md`; not worth
generalising until a second screen actually overflows.

## D47 — A click a menu consumed is not a shot · 2026-09-27
Bug, reported by Igor: clicking **Start** fired the weapon into the run it had
just begun. Introduced by D45 (The weapon is manual) — before it, a held button
meant nothing during play.

**Root cause: one physical click read twice.** A menu acts on the *edge*
(`justPressed`), the weapon acts on the *held state* (`keys`), and nothing
marked the click as spent. Holding the button across the transition — which any
click longer than one frame does — left it held on the first gameplay frame, and
the weapon obliged.

**Fixed at the funnel, not the symptom.** `update()` runs every frame whatever
the screen, so the rule lives there: any non-playing screen disarms the trigger,
and it re-arms only on a frame where the button is seen *released*. The weapon
requires `fireArmed`.

That covers **every** click-driven route into gameplay rather than the one that
was reported. Verified on three: the title Start row, taking a level-up card,
and clicking the death screen to restart. Two of those were broken too and
nobody had noticed; patching the title menu would have left them.

**Severity was higher than the report suggested.** Igor judged the 120ms hold in
the first reproduction "too long", but real clicks fall in roughly 80–150ms and
anything over one frame (~17ms) triggered it. Verified fixed at 10, 60, 150 and
400ms.

**Nine existing checks broke, correctly.** They called `holdFire()` and went
straight to a held button with no released frame first — which no real press
does, since a press is always preceded by not-pressed. The helpers now assert
that precondition (`fireArmed = true`) rather than pretend to simulate it, and
the arming logic gets its own check that exercises the real path: a menu click
fires nothing, then a release and a fresh press fires exactly one shot.

**Test written before the fix**, and it failed for the right reason
(`got 1 shots`).

## D48 — The batch queue and the gate · 2026-09-27
S1 (Combat core), implementing D27. **The spawn director is deleted.** Enemies
arrive one batch at a time, and nothing new comes until the batch is dead.

**What replaced what.** `BATCHES` in `content.js` is a list of records naming
counts per enemy type; `GATE_PAUSE` (1.2s) is the quiet beat between them.
State carries `batchIndex` (batches begun, never reset within a dive) and
`gateTimer` (>0 means we are between batches). A dive opens on a gate, so it
starts calm rather than mid-fight.

**Why this is the whole point of the genre change.** The director grew arrivals
as `1/(1.2 - 0.02t)` — hyperbolic — against power that grew logarithmically in
kills, so the queue diverged and death was arithmetically certain (see
`design.md`). A batch is a **bounded** queue. The divergence is impossible,
which retires the entire class of problem rather than tuning around it.

**Husks removed, since the director they served is gone:** `spawnEnemy()`,
`pickEnemyType()`, `spawnTimer`, `SPAWN_FIRST`, `SPAWN_QUICKEN`,
`SPAWN_FASTEST`, `ENEMY_RAMP`, and the `weight` / `from` fields on
`ENEMY_TYPES`. `pickEnemyType` was alive only because its own two checks called
it — a closed loop — and those checks tested time-based type unlocks, a rule
that no longer exists. Difficulty is authored per batch now, not ramped by the
clock.

**A check was passing vacuously and the gate work exposed it.** "Nothing may
arrive while a batch lives" held because the unattended player died at ~10s and
`step()` returns early on the death screen — the arena was frozen, not gated.
Checks that let time pass now use `runAlive()`, which keeps the player
invulnerable so the simulation actually runs, and assert `screen === 'playing'`
so the same trap cannot recur silently.

**Verified by breaking it**: dropping the `enemies.length === 0` condition —
the gate's one job — fails four checks, reporting "45 enemies, batchIndex 9",
which is the endless director returning.

**Measured**, bot, 5 seeds, clears truncated at the first level-up: mean 14.1s
per batch, range 4.5–35.9s. `foundations.md` wants 10–45s, so this is roughly
in range already — but it is not tuned, and the sample is short for the reason
below.

**Known intermediate state.** The prototype's XP bar and level-up screen still
run, so a dive is still interrupted mid-batch — exactly what D33 forbids and
D34 replaces with one rank per batch and mods offered at the gate. That is the
next step, and it is why the bot stalls at `screen = levelup` after two or three
batches. Deliberate: batches and mods are two systems, and verifying them
together would verify neither.

**Cleanup pass** (`/simplify`, all four angles; two needed a second run after a
session limit). The two findings worth naming:

- **`gateTimer` was named the inverse of the binding glossary.** `foundations.md`
  defines a **gate** as "the point where the descent stops until the batch is
  cleared" — the whole locked stretch, fight included. `gateTimer > 0` meant the
  opposite: arena quiet, batch dead. S2's camera would have read
  `if (gateTimer > 0) stopDescent()`, which is natural and exactly backwards.
  Renamed `breathTimer`, for the quiet beat it actually counts, and "at a gate"
  is simply `enemies.length > 0`. D32 made the glossary binding in *code
  identifiers* to prevent precisely this, and it still happened.
- **The gate had a flag that the arena already answered.** `gateTimer > 0` was
  equivalent to `enemies.length === 0` during unpaused play, so the countdown
  now just runs while nothing is alive. Twelve lines and three nesting levels
  became five and one, and the `gateTimer = 0` clamp and the `= 0.01` "fire next
  tick" sentinel both vanished with it. `late-swarm` gets the real 1.2s beat it
  exists to show, instead of skipping it.

Also: `spawnPaused` → `queuePaused` (it gates the queue, and "spawn" named the
deleted director); `runAlive`'s `screen === 'playing'` oracle moved *inside* the
runner, since it sat at 2 of 6 call sites and forgetting one silently reopens
the vacuous-pass trap this entry records; `BATCHES` gained a validity check,
having been asserted nowhere — a typo there just makes the game quietly easier;
`if (s.batch !== undefined)`, so `batch: 0` is reachable; the "three in a row"
check continues the sequence instead of re-walking it; and the bot lost a flag
derivable from `batchIndex > times.length`.

Rejected: inlining `edgeSpawnPoint` (arrival *position* and arrival *policy* are
separate concerns — that separation is what let the policy be deleted wholesale)
and flattening `BATCHES` records to bare arrays (D33/D34 fields are coming).
A phase enum was considered and deferred to S3, when a boss makes
`enemies.length === 0` an unsound clear-signal.

Earlier in the same pass: one `enemyType(name)` helper replaces the lookup-and-complain that
`spawnBatch` and `placeEnemy` had each written out; `GATE_PAUSE` moved into the
single `// balance` block where CLAUDE.md says every tuning number lives; the
dead `s.elapsed` scenario branch removed; `TICK` exported from the harness
instead of declared twice; the harness's `run()` deleted, since both consumers
hand-roll their loop and it had no callers; the bot hoists its vm-bridged reads
out of the per-enemy loop and uses the bridged key bindings rather than
hardcoded codes; `pastGate()` derives its wait from `GATE_PAUSE` instead of a
hardcoded 120 frames. The bot also gained a test — it is the instrument every
balance number comes from and had no caller, so nothing would have noticed it
rotting.

**Also:** `late-swarm` was redefined. It meant "a minute into the run", which
stopped meaning anything once time no longer drove density; it now starts at
batch 5. Scenarios gained a `batch` field.

## D49 — One rank per batch, mods at the gate · 2026-09-27
S1 (Combat core), implementing D33 and D34. **The XP bar is deleted.** Rank is
one per batch cleared, and the three-mod offer lands in the beat after the
batch dies — the only moment the dive is not combat.

**What replaced what.** `gainXp()`, `xp`, `xpNext`, `level`, `XP_BASE`,
`XP_GROWTH` and the geometric curve are gone. `clearBatch()` fires from the
one place that can tell a batch died — the sweep, when a non-empty enemy list
becomes empty — and raises `rank`, rolls three mods and opens the `mods` screen.
State carries `rank`, `currency` and `modCounts`. The screen formerly called
`levelup` is `mods`, which is the word the glossary has (D32).

**Why the sweep and not the kill.** Ranking up inside `killEnemy()` is one line
shorter and wrong: it is exactly the prototype's rule, an offer per event rather
than per gate, and D33 forbids it. The sweep is the only place that knows the
*batch* is finished rather than an enemy. A check kills two enemies one at a
time and asserts nothing is offered for the first.

**A frame can kill the last enemy and the player at once**, so `clearBatch()` is
guarded by `screen === 'playing'`. Without it, dying on your last shot buries
the death screen under three mod cards, and the dive that just ended awards a
rank. Found by writing the check, not by playing.

**The pool is six mods, body and comfort only** (D34): Fins, Vitality, Reflex,
Nerve (body), Mend, Lull (comfort). `scope` is on every record and a check
refuses anything that is not `body` or `comfort`, which is what stops a weapon
mod being added by reflex before S5 — Content.

**Two mods D34 named were not built, and that is a correction to D34.** Pickup
radius and a currency magnet were in its body/comfort list; D35 (Currency is
auto-collected) was recorded hours later the same day and leaves both with
nothing to do. Building them now would be building husks with a known expiry.
The prototype's `Lure` went with them. `pickupRange` stays as a player stat,
because gems still have to be walked over until D35 is implemented.

**Anything a mod raises has to be a field, not a `const`.** `IFRAMES` and
`DASH_COOLDOWN` moved into `PLAYER_START` as `iframes` and `dashCooldown`. A mod
is a line of data and a line of data cannot edit a `const`; the numbers did not
move out of the one `// balance` block, they moved within it.

**`max` and `modCounts` answer Igor's stacking pitfall from D33.** A mod with a
`max` drops out of the roll once it is there. **The cap values are Claude's
picks** — D34 requires that a maxed mod is not offered, and says nothing about
where the ceilings sit. Reflex and Nerve at 3 (a cooldown has a floor of zero),
Mend and Lull at 1. Consequence worth naming: a
long dive can exhaust the capped mods and be offered two cards instead of three.
That is a content shortage, fixed by S5 — Content, not by padding the pool now.

**Gems are money.** `ENEMY_TYPES.xp` is `ENEMY_TYPES.value`, collecting one adds
to `currency`, and nothing in the code names the currency, because what it is
called is still open in `ideas.md`. It buys nothing until S4 — Meta loop
skeleton; the counter exists so the drop is not a lie.

**The bot now takes a mod**, always the first card. Random picks would build a
different character every dive and two dives that are not the same dive cannot
be compared. This is what unblocks S1's "bot reports time-to-clear per batch":
the level-up screen used to stop it dead after two or three batches (D48).

**Verified by breaking it**, five mutations, each failing exactly what it should
and nothing else: ranking up in `killEnemy()` instead of the sweep (5 failures,
including "a kill mid-batch must not rank you up"), dropping the
`screen === 'playing'` guard (2), `rollMods` ignoring `max` (1, naming all four
capped mods), `Mend` healing without the `Math.min` clamp (1, "hp 4/3"), and
deleting the `Lull` line (1).

**Two mod descriptions ran off their cards**, found by screenshotting the
screen rather than by any check — the renderer centres the text, so nothing in
the state can see it overflow. Shortened, and guarded: `widestModDesc()` in
`render.js` measures the pool and a check holds it inside `CARD_W - 2 ×
CARD_PAD`. It only works in the browser suite, because `measureText` is canvas —
which is precisely the split D39 draws between the two suites. Verified by
putting the long description back: "widest is 217px, the card allows 196px".
This is the second time the "layout coupled to data" surface has caught
something after every state check passed (D46 was the first).

**Measured, and the finding is that the bulwark batches are now unclearable in
target time.** Bot, 5 seeds, 8 batches: mean 16.1s per batch, range 3.4–99.7s.
`foundations.md` wants 10–45s. Batches 5 and 7 — the ones with bulwarks — run
24–99.7s and two seeds hit the 180s cap. The cause is arithmetic and was
predictable: a bulwark has 6hp, the weapon does 1 damage at 2.5 shots/s, and
**no mod in the pool raises damage any more**, so a dive's kill speed is now
flat where the prototype's compounded. The bulwark's 6hp was tuned against a
weapon that grew. This is not a bug in the mods; it is the balance block being
void, which is the next item in S1 and now has a number attached to it.

The bot also stopped dying: all five seeds survive all eight batches with 4–8 hp
left, against a start of 3. Mend and Vitality are doing that, and it says the
comfort mods are strong rather than that the game is easy — the same bot died at
~38s before mods existed.

## D50 — The dash sweeps its path; the bot is not a difficulty instrument · 2026-09-27
Two findings from Igor playing the D49 build. Neither was visible to the suite,
and one of them makes last session's headline measurement wrong.

**The dash stepped over its own hitbox.** Igor: "dash became longer, sometimes
doesnt deal damage" and then, precisely, "dash extends its range over time".
Both are the same root cause, and he is right on both counts.

The dash moves `player.speed * DASH_SPEED_MUL * dt` in a frame and its wave was
a **point** test with a fixed 40px reach, taken once per frame. Two things grow
that step and nothing bounded either: `Fins` raises `player.speed` with **no
`max`**, and `dt` stretches on a slow frame.

- *Range*: 147px of travel at 0 Fins, **402px at 10**. Exactly what Igor saw,
  and `Fins` is now 1 of only 6 mods, so it is drawn constantly. D49 made a
  pre-existing coupling far more visible by deleting the weapon mods around it.
- *Misses*: measured by placing a drifter at every 1px along the path. At 8
  Fins the dash connected on **54%** of positions at 30fps and **27%** at
  20fps. The worst case is the one that reads as broken — an enemy *right next
  to you*, which is in front before the step and behind after it, so the facing
  test never saw it in range at all. Diving into a crowd is the move the dash
  exists for, and it was the move most likely to do nothing.

**Fixed by sweeping, not by sampling.** `segDistance()` gives the distance from
a point to the segment the player crossed this frame, so the wave is a capsule
along the travel rather than a circle at the landing point. Facing is judged
from where the frame *started*, for the same reason: something the dash swept
through must not count as "behind me" because the step overshot it. Hit rate is
now 100% at every Fins count and every `dt` tested; the only remaining misses
are enemies genuinely beyond the dash's reach.

**Verified by breaking it**: restoring the point test fails the new check and
only it — "hp=5 after passing through it at speed 620".

**Bullets have the same hole and it is not fixed here.** 430px/s is 21.5px on a
20fps frame against a darter's 10px reach; measured, that is 9% of shots passing
through a darter at the `dt` cap and nothing at 30fps or better
(`roadmap.md` → Health). Milder than the dash was, but the same defect. That is S1's remaining DoD item (the
fixed timestep), and `segDistance()` is written so it has a second caller
waiting. Note that a fixed timestep alone would *not* have fixed the dash: at 8
Fins a 1/60 step is still 35px, which still left a gap at 20–35px.

**The bot is not an instrument for "is this hard".** D49 reported the bulwark
batches at 24–99.7s against a 10–45s target and called that the balance brief.
Igor played the same build: "nothing breaks the target, currently batches are
very easy to complete". **Igor is right and the measurement was misread.** The
bot kites and never commits, so it takes an age to chew through 6hp — the number
measured *the bot's policy*, not the batch's difficulty. A human closes and
kills it. What the figure actually says is that the bot is a weak driver, which
`roadmap.md` already warned in one line and D49 then ignored.

Consequence, recorded so it is not re-learned: **bot clear-times are a
regression signal, not a difficulty signal.** They are comparable to themselves
across seeds and builds and say nothing about whether a human is challenged.
Until an "exploit finder" bot exists (`ideas.md` — There are three bots),
difficulty is Igor's call, measured by him playing. The direction of travel is
now the opposite of D49's: batches need to get **harder**, not the bulwark
weaker.

**Also fixed:** the `Vitality` card read "one more heart, already full", which
Igor read as a promise that he would be at full health — it only means the new
heart arrives filled. Now "one more heart, it comes full". The mod grants
`maxHp += 1; hp += 1`, which is unchanged; only the sentence was wrong.

## D51 — The dash is bought, and the offer waits for the death · 2026-09-27
Two changes from Igor playing D50. One is his design call, one is a feel bug he
reported precisely enough to fix without discussion.

### The dash starts as pure movement

Igor, 2026-09-27: "dash dealing damage might be off at the start, then upgraded
at home or thru mods ... i'm inclined to mod thing, but in some aspects can be
home screen upgrade too." A lean and an instruction to ship, not a decision
between the two tiers: built as a mod now, with `gear` left open in
`ideas.md`.

`player.dashDamage` starts at **0**. The new `Impact` mod (`body`, max 3) buys
it a point at a time. The dash still costs nothing to own: it moves, it grants
i-frames, and **it always shoves**. Only the wound is bought.

**The shove is deliberately not part of the purchase — Claude's call, not
asked.** Scattering a crowd is
what makes diving into one a play rather than a mistake, and that has to
survive `dashDamage` being zero — otherwise a tier-0 dash is just a dodge and
the whole "offensive dash" idea (D14) is gone until you pay for it. The white
hit flash *is* gated on damage, because a flash reads as "that hurt" and firing
it on a push that did nothing is a lie the renderer tells.

**Why it fits.** The dash had nowhere to grow except "further and faster",
which is the coupling that caused D50 — `Fins` made its range balloon because
range was the only axis it had. Damage is a second axis and it is priced. It
also removes a chunk of free damage from the opening minute, which is the part
Igor says is too easy, so it pushes in the direction the balance work wants.

`scope: 'body'`, not `weapon`: the dash is weapon-agnostic by construction, so
this does not breach D34's "no weapon mods before S5". Seven mods now.

**Marked for S4** — Meta loop skeleton: this is the first mod with an obvious
`gear` twin, per Igor's "can be home screen upgrade too". Whether a stat can be
raised by *both* a mod and gear is not decided and is the question S4 has to
answer; filed in `ideas.md`.

### The offer waits for the death to finish

Igor: "batch cleared (mods screen) comes too fast, last enemy just eliminated.
at least wait for its animation to complete, feels unnatural atm."

Correct, and measurable: `killEnemy` throws a burst that lives **0.5s**, and
the cards were dimming the arena over it on the same frame as the kill. The
reward landed on top of the thing it was rewarding.

The rank is still banked on the kill; only the *offer* waits.
`MOD_OFFER_DELAY` (0.6s — Claude's pick, just past the 0.5s burst; a feel
number, so Igor's to move) counts down in `offerTimer`, and
`openModOffer()` rolls the cards when it expires. A pending offer also holds the
batch queue, so tuning `GATE_PAUSE` below the delay cannot land the next batch
before the cards appear.

**Verified by breaking both**: opening the offer on the kill frame fails "the
offer must not land on the frame of the kill" and "no cards exist yet during
the beat"; restoring free dash damage fails six, including "an unbought dash
must not wound what it throws" and "a dash that did no damage must not flash
the enemy white".

**The bot cannot see either change.** Its clear times are byte-identical before
and after, because `kiteAndShoot` never presses Space — it has no dash policy
at all. Consistent with D50: the bot is a regression signal, and it is blind to
any mechanic it does not use. Worth remembering before trusting it on the dash.

## D52 — The development readout: show the numbers · 2026-09-27
Igor, 2026-09-27: "i'd always show all relevant numbers at least at the
development stage. might be dropped later, but i'd like to know what my current
numbers are (speed, range, mod level, increase in mod screen)."

**Two readouts, both derived from data rather than written out.**

`PLAYER_STATS` in `content.js` is a flat list of the player numbers worth
watching; the HUD draws a second line from it, and the fps line below shifts on
its own rather than needing a new hardcoded `y`. Adding a stat is a line.

Each entry carries `stat` (the player field) as well as `label`, which buys a
check worth more than the readout itself: **every stat any mod can change must
appear in the list**, computed from the mods, so adding a mod that touches a new
field fails the suite instead of quietly going unwatched.

On the cards, `modPreview(mod)` applies the mod to a *copy* of the player and
diffs the numbers. The card therefore cannot advertise a number the mod does not
deliver — the alternative, a `preview` string on each record, is a second source
of truth that drifts from `apply` the first time someone edits one and not the
other. `modStack(mod)` reports held/max alongside it.

**This answers a real confusion, not just a preference.** Igor, on being offered
`Impact` twice: "the dash mod offered multiple times - what does that mean?
damge grows?" It does — +1 each, capped at 3 — but the card was identical on a
repeat, and five of the seven mods stack. A repeated offer looked like a bug.

**It partially overrides D34 (mods) on presentation.** D34 says mods differ in
kind not degree and carry no number to compare, because arithmetic is the heavy
thinking a dive must not contain. The stat lines put arithmetic back on the
cards. Deliberate and **scoped to development**: Igor's own framing is "might be
dropped later". D34's rule stands for the shipped game; this is instrumentation,
and the sentence at the top of each card is still the thing you read in a
second. Revisit at S7 — Alpha polish.

Cards grew 140 -> 186px tall to hold it, so `MOD_HINT_Y` and `cardBottom()` are
exposed and a check holds one above the other — the same guard the help screen
got in D46, added because the same class of bug was one row away.

## D53 — Fixed timestep, and bullets sweep too · 2026-09-27
S1's last DoD item: "fixed timestep in place; a railgun-speed projectile cannot
tunnel a thin enemy at any `dt` the frame cap allows." Both halves, because the
first does not deliver the second.

**The timestep.** `FIXED_DT` is 1/120 and `stepFixed()` in `main.js` banks
leftover time, so a 60Hz screen runs two ticks a frame and a 144Hz screen runs
one or none. The existing 0.05s cap on elapsed time doubles as the catch-up
bound — six ticks — so a slow frame cannot spiral. Before this, every collision
test sampled at a distance set by the player's frame rate: the same dive was a
different game on a slower machine.

**1/120 rather than 1/60, and no render interpolation.**
`foundations.md` asked for "fixed timestep with render interpolation". The
interpolation is **not** built, and this supersedes that clause. **Amending
`foundations.md` was Claude's call and Igor was not asked** — the file is the
layer that does not change before alpha, so that was a question to put to him,
not one to settle with a measurement. Reversible: if judder shows on real
hardware, interpolation is the answer. Interpolation
means storing a previous position for every entity and lerping in every draw
call — work in `render.js`, the layer CLAUDE.md says not to invest in, to buy
smoothness that a shorter tick buys more cheaply. At 1/120 the picture is at
most 8ms stale, against 17ms at 1/60, and D43 measured `update()` at 0.55ms for
500 entities, so doubling the rate costs ~1.1ms of a 16.7ms frame. If judder
ever shows up on real hardware, interpolation is the answer and this entry is
what to reopen.

**Bullets sweep, like the dash.** A fixed step bounds `dt`; it does not bound
bullet *speed*, and the DoD names a railgun. At 6000px/s a shot covers 50px per
tick against a darter's 10px reach. `segDistanceSq()` — the squared form, since
this is the hot loop and D5's 8.3x measurement still applies — tests the segment
the bullet crossed. Measured before the fix: bullets tunneled a darter on 9% of
positions at the old 20fps `dt` cap.

Also: a shot's range is now the distance it actually covered rather than
`BULLET_SPEED x dt`. Identical today because every bullet flies at
`BULLET_SPEED`, and wrong the moment one does not — which "railgun" implies.

**Verified by breaking it.** Reverting bullets to a point test fails the railgun
check; measuring range at `BULLET_SPEED` fails its own; replacing the
accumulator with `update(elapsed)` fails four. One check had to be *fixed* first
rather than trusted: the railgun enemy originally sat at +300, exactly on a
50px sample boundary, so a point test hit it by arithmetic luck and the check
could only pass. Moved to +325, mid-step.

`advance(30)` asserted `30 / 60` and broke when the step changed — the right
failure, but it now derives from `FIXED_DT`. `tests/harness.js` keeps its own
`TICK` because the bot needs a step size before a game is loaded; a copied
number gets a check, and `invariants.test.js` asserts the two agree.

**A bug this exposed in the bot**: `diveReport`'s budget was counted in *ticks*,
so halving the step silently halved every dive. It is seconds now.

## D54 — The batches, re-derived from scratch · 2026-09-27
The S1 work item D28 (manual fire) named, and the last of the stage. Igor,
having played it: "nothing breaks the target, currently batches are very easy
to complete."

**The old batches were not slightly small, they were a factor of five small.**
The weapon does `fireRate x damage` = 2.5 hp/s, and **nothing in the mod pool
raises damage** — D34 made the pool body and comfort only, so a dive's kill rate
is flat where the prototype's compounded. A batch that should occupy 10-45s
therefore has to hold 25-112 hp. The old set held **3 to 15**, i.e. 1.2s to 6.0s
of shooting. Every single batch was under target, and no amount of placement or
pacing was going to cover a factor of five. This is why D49's reading of the bot
was wrong in both directions at once: the bot's 24-99.7s said "too slow" about
batches that were arithmetically trivial.

**Twelve batches now, sized on hp**, ramping 10 -> 68 hp (4.0s -> 27.2s of
shooting). Twelve is **Claude's pick, not a derived number**: D34 uses "a
12-batch layer grants 12 mods" to illustrate that balancing became arithmetic,
and this entry originally cited that as if it sized a layer. It does not. How
long a layer is has not been decided. The low end is deliberately under 25 hp, because approaching,
missing and kiting are not shooting and real clears run longer than the raw
figure. Peak 38 simultaneous enemies against a design budget of 500 (D43);
screenshotted at batch 12 and still readable, types still distinguishable.

**Bot, as a regression signal only** (D50): it went from surviving all eight
batches on all five seeds to **dying on four of five**, clears 6.0-63.3s, mean
18.7s. That says the change is large and in the intended direction. It does not
say the result is right — the bot kites, never commits and never dashes, so it
is the wrong instrument for this question by construction. **Igor's playthrough
is the oracle**, and this is a first pass keyed to arithmetic, not a finished
tuning.

Deliberately **not** changed: enemy hp, speed and radius, and anything about how
enemies move. Igor asked to confirm the scope and it is confirmed — behaviours
are S5 — Content, boss patterns are S3. Difficulty here is composition and
count, which is data.

## D55 — `Lull` is removed: a mod that pays for being cornered · 2026-09-27
Igor, 2026-09-27, having played D54's batches: "gate safety mod is useless at
this point - enemies arrive from screen sides, it wears off before any enemy
can harm the player."

**Removing it was Claude's call, and it overreached** — Igor said "useless **at
this point**" and, in the same message, proposed the arrival change that would
make it useful again, which reads as "not yet", not "delete it". The
measurement below is sound; it did not license the deletion.

**Igor confirmed the outcome on 2026-09-28: "Lull leave out".** So the mod
stays gone — but by his decision, not by the measurement, and the process
failure is recorded here rather than tidied away.

The measurement makes it worse than useless. Seconds from a batch
arriving to the first enemy that can touch a standing player, across all 12
batches and 3 seeds:

| player is | earliest contact | arrivals inside the 1.2s guard |
|---|---|---|
| at the centre | 2.04s | **0 of 36** |
| near the top edge | 0.27s | 29 of 36 |
| in a corner | 0.22s | 35 of 36 |

**It cannot fire where a competent player stands, and only pays out when you
are cornered.** That is not a weak mod, it is an *anti-aligned* one: it rewards
the position the game is trying to punish, against the `foundations.md` pillar
"no batch is cleared without the player moving". Widening the guard past 2.04s
would make it fire everywhere, but it would then be two and a half seconds of
invulnerability per gate protecting against a threat that was never there.

Removed, with `player.gateGuard`, its `PLAYER_STATS` row and the spawn-time
line that applied it. The pool is six: Fins, Vitality, Reflex, Nerve, Impact
(body) and Mend (comfort) — **comfort is down to one**, since D34 named three
comfort candidates and two are now dead: the currency magnet by D35
(auto-collection leaves it nothing to do) and this one by measurement. No
replacement invented; a thin pool is filed in `ideas.md`, not patched by
guessing.

**The condition that brings it back is recorded**, because this is a good mod
against a different arrival model: enemies that appear *near or inside* the
arena rather than walking in from an edge. Igor proposed exactly that in the
same message (`ideas.md` — "fish that arrive from behind the screen"). If that
lands, an arrival guard becomes meaningful and this entry is what to reopen.

One of its two checks stayed. "A batch arrives with no grace" was the control
half of the pair, and it is still the rule — it is precisely what a re-added
arrival guard would have to break on purpose.

## D56 — The dash is a fixed, committed lunge · 2026-09-28
Two bugs from Igor, both in the dash, both fixed at the root.

### Dash length no longer rides on `player.speed`

Igor: "dash length still increases over time or mod upgrades - this hasnt been
addressed at all." Fair: D50 measured it, `ideas.md` recorded it, and S6 was
told to own it — but he had already said it made the game feel easier, so
filing it was under-delivering on a reported problem. Filed twice is a fix.

The dash moved at `player.speed * DASH_SPEED_MUL`, so every `Fins` lengthened
it: 141px at none, 402px at ten, a third of the arena crossed untouchable.
**`DASH_SPEED_MUL` is deleted and `player.dashSpeed` (884 px/s) is its own
field in `PLAYER_START`.** Dash length is now constant at 141px at every `Fins`
count, measured, and the peak escape figure falls from 386 to 141 invulnerable
px/s — the remaining growth is `Reflex` alone, which is the honest one because
it is capped.

This is the root-cause fix rather than capping `Fins`, and it is what Igor's
own direction needs: dash reach is now a *stat that can be sold* (`gear` at S4)
instead of a side effect of a movement mod. `Fins` still earns its place — base
speed 260 against a darter's 190 is a 70px/s margin, and each Fins adds 45 to
it, which is kiting room rather than dash reach.

### The dash is committed: live input cannot steer it

Igor: "it's possible to change direction during the dash." True, and worse than
reported. Travel used the keys held *this frame* while only the wave's facing
(`dashDx/dashDy`) was frozen, so:

| mid-dash input | what happened |
|---|---|
| switch keys | the lunge turned — 142px in the new direction |
| hold the opposite key | the lunge **reversed**, and the wave then faced the way you came, so it hit nothing |
| release everything | you stopped dead after 7px while `dashTime` ran on |

The last is the serious one: a free `DASH_TIME + DASH_GRACE` = **0.31s of
invulnerability for standing still**, on a 2.2s cooldown — or 1.0s with three
`Reflex`, which is 31% uptime. Tap and release was strictly better than dashing.

Travel now follows `dashDx/dashDy` like the wave always did. A dash is a
commitment, which is what `design.md` already claimed and what makes "diving
into a crowd is a play" mean anything. The reversal case also explains part of
the older "sometimes doesn't deal damage": a reversed dash pointed its wave
backwards.

**Verified by breaking both**: restoring live-input travel fails the three
steering checks; putting dash speed back on `player.speed` fails the Fins one.

**Two defects were in my own checks, not the game**, and both are the same trap
this suite keeps falling into. `dashDistance` tested `player.dashTime > 0` as
its loop condition *before* the dash had started, so it never ran a tick and
reported 0px. `dashAndSwitch` never cleared `keys` on entry, so each case
inherited the key the previous one left held — the "reverse" case dashed
diagonally because `KeyW` was still down, and I nearly read that as a game bug.
Both helpers now clear input on entry and drive exactly `DASH_TICKS`, derived
from `DASH_TIME / FIXED_DT`, so no measurement includes a post-dash walking
tick.

## D57 — `docs/` gets its own checks · 2026-09-28
Igor, 2026-09-28: "why docs has no check? can you add the check?"

Because every check until now was about the game. `docs/` was held together by
the consistency sweep (D46 — The consistency sweep is part of every change),
which is a habit — and habits fail quietly. Three corruptions got through in a
single day, none of them visible to anyone reading the files:

- an idea of Igor's (fish arriving from behind the screen) **deleted outright**
  by an index-splice edit that ran between two anchors and took everything in
  between;
- D56 (the dash is a fixed, committed lunge) written to `decisions.md` and
  **never given a changelog entry**, because a string replace matched nothing
  and failed silently — then reported as documented;
- decisions cited as bare numbers, so "D35" told the reader nothing. Igor had
  to ask three times what it meant.

`tests/docs.test.js` now covers the mechanical parts of the sweep:

1. every decision has a `## D<n> — <name>` heading, so there is a name to cite;
2. decision numbers are unique and gapless — a gap is an entry that was lost;
3. no doc cites a `D<n>` that does not exist;
4. the newest decision appears in `changelog.md` — the exact failure D56 hit;
5. the seven docs `CLAUDE.md` tells a cold session to open all still exist.

**Verified by breaking it**: a citation of a decision that was never written,
a stripped decision name, and the newest decision removed from the changelog
each fail their own check and no others — four failures across three
mutations. It then caught a real one immediately: this
entry originally spelled out the fake citation used in that first mutation,
and the check flagged its own decision file.

**What this does not cover, stated so it is not mistaken for coverage**:
whether prose is *true*. A check can see that D35 is cited and exists; it
cannot see that the sentence about it is wrong, or that a number went stale.
That stays the sweep's job, and the sweep stays a habit.

## D58 — The descent: a current between gate depths · 2026-09-28
Agreed with Igor in the S2 brainstorm; design in
`specs/2026-09-28-s2-descent-design.md`.

**The current moves the dive, on its own, and never stops.** After a batch is
cleared and a mod is taken, the current speeds up and carries the camera — and
the player with it — down to the next batch's depth, about two seconds away.
The player does not have to trigger it. Igor: "it starts on its own ...
complies with the idea that layers must be dynamic and action-like".

**The current is independent of the player.** The first build let swimming
down pull the camera faster, from Igor's "the player can speed it up"; he
reversed it the same day: "revert the player speeding up current, it was a
wrong assumtion. current must be independent." Swimming moves you within the
view, never the view.

**During a fight the current slows, it does not stop.** Igor, 2026-09-28: "the
current never stops, it just slows down during a fight", and "descent stops
means we dont go further in terms of enemies, but background flows. it's water
after all". So D27's stopped descent is about *enemies*: the camera and every
entity hold, nothing drifts into the batch, and only the water keeps moving.
That flow is **graphics** — specks scrolled by `waterY` — and is a placeholder
to be replaced with real art later (`ideas.md` → A lively background). It keeps
flowing behind the mod cards as well — play waits on the pick, the water does
not. Igor: "The water freezes under the mod cards - it should not". It drifts
under the death and layer-end screens too, and freezes only under pause — Igor:
"flow under death and the layer end, and freeze under pause, confirmed". Under
those end screens it eases down to the fight-time drift rather than rushing on
at travel speed: Claude's call. Igor's
standing rule behind it: "it's all about dynamics, something is always
happening during a layer pass".

**Only a couple of seconds between batches.** Igor: "it takes forever to reach
the next batch, fix this. only a couple of seconds between batches please."
The first version took ~12s gate to gate.

**Smooth, not screens.** This answers the draft's own open question
("screen - down - screen" or "smooth constant motion", "i'd pick smooth").
Igor, 2026-09-28: "at this point it's answered and settled".

**The world is a tall strip under a fixed view.** `cameraY` in `game/`; the
view stays 1280×800 world units at every window size, so difficulty stays
invariant to it (D29). `aim` stays in view coordinates and `game/` adds
`cameraY` where it reads it — not once in `input.js`, because `aim` is only
written on mousemove while the camera moves every descent tick, so a
world-space aim would go stale under a still cursor, and the menus and cards
hit-test it in view space. The port seam stays six names either way.

**The layer ends at the bottom — a stop, not a win.** After the last batch the
current carries you one more stretch and a "LAYER CLEARED" screen (Igor's
wording; first built as "THE BOTTOM") shows the time,
R to dive again. No reward, no unlock: S3 is still the first stage with an
ending. The layer is the twelve `BATCHES`, and twelve is Claude's pick (D54),
so the layer's length is too.

**`GATE_PAUSE` now only opens a dive.** Every later batch waits on the descent,
which is a beat of its own.

**Claude's picks, not derived**: `GATE_SPACING` 400px (~2s of travel),
`CURRENT_SPEED` 200px/s, `CURRENT_CRAWL` 30px/s, `CURRENT_EASE` 0.05 (the share
of a speed change left after a second). The first
picks were 1600px and 400px/s with a brake to a dead stop; Igor found them "way
too fast" and too far apart. The bot measures them; feel is Igor's.

**Rejected**: a descent the player has to trigger by swimming down (Claude's
lean — Igor chose automatic, for pace); a visible net or floor under each gate
that bursts when the batch dies (Igor: "i dont want a net"); a current that
brakes to a dead stop at each batch (the first build — Igor: "the current never
stops"); swimming down to hurry the current (the first build — Igor: "current
must be independent"); leaving the batch list cycling (the layer would have no bottom, and S2's DoD needs one).

**Left open, in `ideas.md`**: a lively background during batches (Igor: "most
likely done after the alpha"); gems left behind by the descent (Igor: left for
S4, "it will be reworked anyways"); how one layer transitions to the next.

**Guarded by**: `tests/descent.test.js` — the camera never moves while a batch
lives (property over seeds), the water still flows at a real speed three
seconds into a fight, the next batch arrives within 3s of a clear, the camera
stops exactly at each depth, swimming does not change when the next batch
arrives, aim and arrivals follow the camera, and the layer ends at the bottom,
reachable through the `last-batch` scenario; and the `?test` D29 check — the same seed reaches the bottom in
the same time at three window sizes through real mouse events. Each verified by
breaking the rule it guards.

## D59 — No mods at the layer end; the layer end is not a gate · 2026-09-28
Igor, 2026-09-28, as a high-level decision: "no mods should be offered at
layer's end, unless a player goes on to the next one. this is a high-level
decision. the end of layer is not quite a gate. we need a term for layer end
(or just call it layer end). we need to design what happens there more
thoroughly. leave this point for todo."

**Decided.** Clearing a layer's last batch offers no mods: the current carries
you straight on to the "LAYER CLEARED" screen of D58 (the descent). Mods at the
layer end come only if the player goes on to the next layer — which does not
exist yet, so today the answer is never. This narrows D49 (one rank per batch,
mods at the gate), which offered on every clear.

**The layer end is not a gate**, so the glossary gets its own row for it, under
Igor's working name "layer end". The **gate** row is reworded in the same step
(Igor: "you can reword the gate, but clarify also what happens there"): its
old "the dive's one non-combat beat" became literally false once D58's current
carried you between batches, so it now says what happens there — the batch
waits at its depth, the water keeps flowing, the clear pays a rank and three
mods, and the pick is the dive's one pause.

**No rank for it either.** The first build still banked a rank for the last
batch — Claude's call, flagged; Igor, asked: "let it stay on 11". Twelve
batches, eleven ranks: the clear of a layer's last batch is the layer end and
pays nothing — no rank, no mods, no `Mend`. The glossary's rank row says so.

**Left open, in `ideas.md`**: the term itself, and what happens at the layer
end.

**Guarded by**: `tests/descent.test.js` — "pays a rank and mods between
batches, but neither at the layer end", which failed before each change: first
with the cards opening at the bottom, then with the last batch paying rank 1.

**Out of S2 (camera and descent), and recorded as a todo**: the layer-to-layer
logic — Igor: "we must work thru layer-to-layer logic in detail out of s2".
`ideas.md` holds it under the layer end, the transition, and what follows a
layer; D60 gives it a design pass of its own after S3.

## D60 — Layer-to-layer logic gets a design pass of its own, after S3 · 2026-09-28
Igor, 2026-09-28: "we must work thru layer-to-layer logic in detail out of s2",
and, asked which stage should own it, "a design pass of its own after S3".

S3 (one boss, one complete layer) delivers the first layer with an ending; the
pass that follows works out what lies between layers — what happens at the
layer end (D59 (no mods at the layer end) settles only its rank and mods), what
follows a layer, and how the transition plays. Until then the questions stay
open in `ideas.md`. The pass sits in `plan.md` between S3 and S4 (meta loop
skeleton) as an unnumbered section, so no stage number moves and no citation
breaks.

**Chosen over**: working it out inside S3, or in a pass before S3 — the two
options Claude offered.

**S4 (meta loop skeleton) waits for it.** Its entry is now S3 exits *and* this
pass done. Claude's suggestion, Igor: "yes". S4 builds `home`, layer select
and the first save format; "home, the next layer, or a choice?" decides when a
player sees `home`, what a dive spans and what the save records, and a save
format changed after its first write needs a migration. With one layer S4
could only build "layer end → home" anyway, so the gate costs a conversation,
not a stall.

**Reminder**: when S3 closes, Claude reminds Igor to open this conversation
before S4 — Igor: "remind me to open a conversation about it after s3 / before
s4". Kept in `plan.md` and in memory.

**Its outcome**, Igor: "decision, checks against foundations, ready plan" —
the answers recorded as decisions, the design checked against `foundations.md`,
and a ready plan.

## D61 — "Dive", not "run", for one attempt at a layer · 2026-09-28
Igor, 2026-09-28: "run -> dive", then "sweep all 13 to \"dive\"". The glossary
already said "run" is a synonym and to prefer **dive** (D32 — the glossary is
binding); the help screen still said "Restart a run", and the word was still
used for a dive across the docs and the code.

Swept: the help screen's key list ("Restart a dive"); in `foundations.md` the
mod row ("dive-scoped"), the pillar **Dives differ** (was "Runs differ") and
the technical contract's quote of it; two lines of `design.md`; nine code
comments in `game/state.js` and `game/content.js`. Claude counted thirteen when
asking; there were fourteen, all swept.

Then, Igor: "all runs to dives, consistency" — seventeen more across
`checks.js` (comments and two check messages), `design.md`, `ideas.md` and
`plan.md`, the bot's measured runs among them, since each is a dive the bot
plays. `decisions.md` and `changelog.md` keep their old wording: they are
history, and append-only.

"Run" stays where it means something else: the verb, a test or suite run, a
driven page session, and the `run:` action keys in the menu tables. The
glossary's **dive** row is unchanged — "run" is its synonym, **dive** is
preferred. Making it 'never "run"', like "level" and "upgrade", was offered and
declined — Igor: "no".

## D62 — The boss is the layer's last batch · 2026-09-29
S3 (one boss, one complete layer). Claude asked whether the boss is the
layer's last batch — a batch like any other, whose clear is the layer end — or
a fight waiting at the bottom, after the layer end. Igor: "yes. normal batch,
with just a special type of enemy sets. no one cancels the normal enemies along
the boss, but let's get the boss finished first."

**Decided.** The boss is an enemy type, and the layer's last batch holds it.
That batch is a normal batch in every other way: it waits at the last gate
depth, the camera holds while it lives, and its clear is the layer end — no
rank and no mods (D59). The batch before it pays a rank and three mods like
any gate, so the player meets the boss with every mod the layer pays.

This answers the draft's "main boss at the bottom (end of the level)" without
a new rule: the gate already locks the arena for a fight, which is what a boss
fight needs.

**Left open, in `ideas.md`**: normal enemies fighting alongside the boss.
"No one cancels" them, so they are not ruled out; "let's get the boss finished
first" puts them after it. When they come they collide with the glossary's
**batch** row — "enemies of comparable threat", from the draft — since a boss
and its escorts are not comparable. That is for then.

**Glossary**: a **boss** row in `foundations.md`, in the same step.

**Guarded by**: `tests/boss.test.js` — the layer ends on the boss, alone —
and `descent.test.js`'s "neither at the layer end", which now plays the boss's
batch.

## D63 — The win rate is the boss fight's, at the starting kit · 2026-09-29
The S3 (one boss, one complete layer) exit asks the bot for a "win rate per
seed at a stated gear level". Igor, asked how: "no idea, you decide" — so this
is **Claude's call**, delegated, and open to Igor to reopen.

The problem it answers: the mortal bot dies after three to five batches
(`roadmap.md` → Health), so a win rate from the top of the layer is zero on
every seed. That number would be about the bot, not the layer (D50).

**Decided, by Claude:**
- **The win rate is the boss fight's.** The bot starts at the layer's last
  batch — the boss's (D62) — through the `last-batch` scenario (D37). Mortal,
  the usual five seeds; each reports won or lost, time to kill, and hp left.
- **The stated gear level is the starting kit**: no gear, since none exists
  before S4 (meta loop skeleton), and no mods. That is the weakest the boss can
  ever be met with, so a win proves the layer can be finished. A loss says
  nothing about a human (D50); Igor's playthrough decides then.
- **The whole layer is still reported**, from the top, on the same seeds: how
  many batches the bot clears before it dies. That keeps "the bot cannot reach
  the boss" in view rather than hidden behind the isolated figure.

**Not taken: a better bot.** Igor: "well write a good bot. nor sure it's worth
it, but would be nice and handy to have a bot mimicking real player's
behavior. leave it now if complicated (i assume so)." It is: `ideas.md` →
"There are three bots" sizes it as threat-field navigation plus dash timing,
which is a project of its own. It waits there.

**Guarded by**: `tests/invariants.test.js` — the bot starts from a scenario and
records only the fights it plays; without counting from the scenario's batch,
it logged a zero-second clear at tick one.

## D64 — The boss lunges · 2026-09-29
S3 (one boss, one complete layer). Claude offered three attacks from the
draft's own list, cheapest first: the lunge, the spit (a fan of slow toxic
blobs), and both in turn. Igor: "boss does (a). we will do enemy polishing
later anyways".

**Decided.** The boss drifts after the player, stops, and winds up — it
swells while a faint line shows the path it is about to take — then charges
straight along that line and rests where it lands. Then again. The wind-up is
the tell the S3 exit asks for; the rest is the opening, the moment to shoot
it. In one sentence, per the pillar: when it swells, get out of its line.

Nothing new under the hood: a `lunge` field on the enemy record — the
behaviour, holding its own timings — and one branch in the enemy loop,
stepping chase → wind-up → charge → rest: the concept of a state machine
without its classes (D26 — disciplines installed).
Every other enemy still only chases; behaviours for them are S5 (content).

**The numbers are Claude's picks**, still to be chosen and marked as such: the
wind-up's length, the charge's speed and reach, the rest, the boss's hp and
size. The bot measures them; Igor's feel judges them.

**Not taken now**: the spit, which needs enemy projectiles that do not exist
yet, and both attacks in turn. Waiting in `ideas.md`, not declined — "we will
do enemy polishing later anyways".

**Guarded by**: `tests/boss.test.js`, over seeds and both lungers — no charge
without a full wind-up, the line fixed through it, and from the wind-up on the
lunger inside the view without jumping. That is the S3 exit's "a check on
telegraph duration". Each part verified by breaking it.

## D65 — A mini-boss is a smaller boss · 2026-09-29
S3 (one boss, one complete layer). The draft asks for "2-3 mini-bosses along
the way" and `foundations.md` left the term open. Claude offered three
readings: a smaller boss in a batch of its own, a big chaser in a batch of its
own, or an elite inside a normal batch — leaning to the first. Igor:
"agreed", to that lean and to two of the three assumptions stated with it; the
third was corrected in the same breath (below).

**Decided.** A mini-boss is a batch of its own at an ordinary gate, holding one
tougher enemy that lunges like the boss (D64 — the boss lunges) but is weaker
and slower to wind up. Its gate pays a rank and three mods like any other.

Why this one: a game teaches a danger somewhere safe before it tests it
somewhere hard. The mini-bosses rehearse the boss's tell at low stakes, so by
the bottom the player already knows what a swell means. It costs one enemy
record and no new behaviour. The big chaser was cheaper but taught nothing
about the boss; the elite in a normal batch was the "normal enemies alongside"
shape Igor had put after the boss (D62 — the boss is the layer's last batch).

**Agreed with it**: killing the boss's batch leads to the existing "LAYER
CLEARED" screen, which becomes the layer's real ending, wording unchanged until
the friendlier-messages pass; and the boss's numbers are Claude's picks, marked
as such. **Corrected with it**: Claude assumed the boss swims in from a random
edge like any batch. Igor: "The boss swims in from the bottom". That is said of
the boss; how a mini-boss arrives is not settled by it.

**Glossary**: a **mini-boss** row, and "what mini-bosses are" leaves the list of
what is still open, both in `foundations.md` in the same step.

**Guarded by**: `tests/boss.test.js` — two lone mini-bosses along the layer,
winding up longer and weaker than the boss, whose clear pays a rank and mods;
and the boss rising from below the view, centred.

## D66 — The dive runs on through the layers; death restarts it from the top · 2026-09-30
The layer-to-layer design pass (D60 (layer-to-layer logic gets a design pass
of its own)). What follows a layer — home, the next layer, or a choice (the
draft: "inclined to choose") — answered by Igor, 2026-09-30: "let's make it a
proper roguelite for alpha. yes, you go on. yes, death sends you to the start.
unlocking layers + what depth you reached is visualised on home screen. ranks
go all the way through the dive, the dive definition doesnt change."

**Decided.**
- **Every layer end but the last goes on.** The current carries you into the
  next layer; there is no way home from a layer end. A dive ends in death, or
  in the win at the last layer's end (D68 (the layer end is a milestone)).
- **Death sends you home, and every dive starts at the top of the first
  layer.** Igor, a message earlier: "what if you cant start from a level, but
  rather always start from the very beginning". There is **no layer select**,
  which supersedes the draft's "i'd allow to choose".
- **`home` shows progress instead of offering a choice**: the layers unlocked
  and the depth reached. A layer still unlocks by completing the one before
  it; unlocking reveals it at `home` rather than making it selectable.
- **Rank and mods carry through the whole dive**, and reset when it ends, as
  the glossary always said.
- **The dive keeps its definition** — one attempt, start to death or
  completion — and loses only the words "at a layer", which a dive spanning
  layers made false. That is Claude's reading of "the dive definition doesnt
  change", stated to Igor and not corrected.

**Why.** Igor: "risky? might be, but i see the game as thrilling and dynamic.
losing momentum is bad i think." And, turning down Claude's "always home for
alpha, add going on later": "i'm ok with redoing the desgin afterwards, but i
think fundamentals are better settled earlier". It also fits the premise — one
descent after the thing you dropped — and gives balance one path: every layer
is met by a player who swam through the ones above it.

**Chosen over**: always home — every layer end returns you home, and each layer
balances on its own (Claude's "simplest for alpha"; Igor: it "kinda cuts the
thrill"); a choice at the layer end, home or on, with the ranks cashed out as
currency on the way home and forfeited by death (Claude's earlier lean — a real
gamble, but a second decision inside the dive, against the genre contract's
"nothing else"); layer select, free as the draft had it, or bought as a vessel
that rides you down to a depth (Igor's idea: "record as idea, not doing now" —
parked in `ideas.md`).

**Known costs, with owners.** The top layers are replayed every dive, and
`BATCHES` gives every dive the same fifteen — what a layer is, a fixed list or
a pool it draws from, is now this pass's question. A dive cannot be stopped
short of dying, so the pillar "dives are a session, not a sitting" needs new
words — this pass too. The mod pool was sized for one layer — D69 (mods across
a whole dive).

**S4 (meta loop skeleton) builds no layer select**; `plan.md` says so.

**Glossary**: the **dive**, **rank**, **mod** and **home** rows in
`foundations.md`, in the same step.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — going on from a layer end opens only the cards, then the
next layer's batch arrives with rank, mods and depth carried; `tests/descent.test.js`
— the dive ends at the bottom of the last layer; death goes `home`, R dives
again (both suites).

## D67 — Currency is kept on death · 2026-09-30
Claude had carried it as its own suggestion, waiting on Igor's word. Igor:
"dont know why still pending, of course you keep currency."

**Decided.** The gems a dive collects are kept however it ends, death
included. Death costs a dive its momentum — rank and mods — never its money.
It is also the floor under the pillar "addictive, not grindy": a new player
dies mid-layer often, and every dive still pays.

Why it was pending: nothing had decided what death costs, and the working
agreement makes Claude's picks wait for Igor.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — death banks the dive's gems, a gem caught on the frame
of death included.

## D68 — The layer end is a milestone; clearing the last layer wins the game · 2026-09-30
Igor, 2026-09-30: "essentially, layer end becomes a milestone in the dive,
bigger than defeating a batch." On Claude's lean for what makes it bigger: "a
full heal plus a big haul of gems from the boss - agreed". And: "you clear the
last layer - you won the game".

**Decided.** Every layer end but the last:
- **pays what a gate pays** — one rank and three mods. This is the exception
  D59 (no mods at the layer end) already wrote in, "unless a player goes on to
  the next one", and under D66 (the dive runs on through the layers) every
  layer but the last goes on;
- **heals you fully**, so a harder layer starts fair and momentum does not turn
  into a slide — Slay the Spire heals you after every act's boss;
- **pays a big haul of gems from the boss**, so reaching the milestone pays
  even if the next layer kills you, and D67 (currency is kept on death) keeps
  it. The haul is the boss's own drop, so the last layer's boss drops it too.

Then the current carries you on into the next layer. How that plays is still
open — this pass.

**The last layer's end is the win.** No rank and no mods: there is nothing to
go on to. Its boss's haul still lands. What follows a win is not designed (`ideas.md`).

**Narrows D59 (no mods at the layer end)**: its rule now holds for the last
layer only.

**Claude's picks, left to the build and to S6 (balance)**: how big "big" is.
The boss's `value` is 10 today, a drifter's 1.

**Glossary**: the **layer end** and **rank** rows, and the genre contract's
"neither at the layer end", in `foundations.md`, in the same step.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — the layer end heals fully and pays a rank and the cards,
the boss's haul is its `value` (30) and more than three times any other drop;
`tests/descent.test.js` — the last layer's end pays neither and shows the win.

## D69 — Mods across a whole dive: every mod capped, an offer that never runs dry · 2026-09-30
D66 (the dive runs on through the layers) carries rank through the whole dive,
and one rank per batch (D34 (mods)) was sized for one layer. A layer is fifteen
batches, fourteen ranks; a full dive of 3–5 layers pays some 45–75. The pool is
six mods, four of them capped, and those caps add up to ten picks: once they
are taken, every gate offers the same two cards, Fins and Vitality, both
unbounded, and a deep player stacks hearts and speed without limit.

Igor, asked how mods should work across a dive: "you decide, my requirement is
make it consistent and diverse, generic baseline." **Claude's call,
delegated**, and open to Igor to reopen, as D63 (the win rate is the boss
fight's) was.

**Decided, by Claude:**
1. **One rank per batch, all the way down.** The rate D34 (mods) set,
   unchanged; only the total grows with the layers.
2. **Every mod has a cap: a switch caps at 1, anything that stacks at 3.**
   That is what the four capped mods already do; Fins and Vitality lose their
   exemption. A dive's power then has a ceiling, so deep layers are tuned
   against a known number — D34's "balancing becomes arithmetic", kept across
   a whole dive. The 3 is Claude's pick and S6 (balance) may move it; the rule
   stays.
3. **The offer never runs dry.** Mods fill the three cards first; a handful of
   gems, then a heart back, fill any card the pool cannot. Neither is a mod —
   no cap, nothing carried. Momentum with nowhere left to go becomes money or
   health, as in Vampire Survivors once everything is maxed. With every mod
   capped the offer is those two alone; rule 4 keeps a full dive from getting
   there.
4. **The pool grows with the dive.** S5 (content) sizes it so the caps cover a
   full dive's ranks with three cards to spare, so the gems and the heart are a
   safety net, not the late dive. That is computable from the tables, so it
   becomes a check.

**Consistent**: one rule for every mod, none exempt. **Diverse**: the pool is
sized to the dive, so offers stay varied to the bottom. **Generic baseline**:
all four rules are about the mod record, never about a particular mod, so
weapon-scoped mods (D31 (two-tier progression)), due at S5 (content), arrive as
data.

**Rejected**: fewer ranks — one per layer, or per mini-boss (it undoes the rate
D34 settled with Igor, to solve a pool that is simply too small); diminishing
returns on repeats (arithmetic inside the pick, which D34 keeps out of the
dive); caps that grow with depth (a second rule doing the first one's job).

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — every mod has a cap; over forty picks no mod passes it,
every offer holds three cards while any mod is under its cap and the gems and
the heart otherwise; the gems card pays only when taken, and no filler is
counted. The pool-covers-a-dive check waits for S5 (content), which grows the
pool — six mods cannot cover thirty ranks.

## D70 — A dive can be saved at any point · 2026-09-30
Igor, asked whether a dive can be put down at a layer end and picked up later:
"ideally, you could save at any point. if difficult, leave for later".

**It is not difficult here, so it is not left for later.** Save-anywhere is
usually the hard kind of save: game objects hold references to engine things —
textures, physics bodies, callbacks — that cannot be written to a file. A dive
here is plain numbers in plain objects (D5 (plain objects in flat arrays)),
about twenty-five variables; its randomness is one 32-bit number (D41 (seeded
RNG)); and it runs in fixed ticks (D53 (fixed timestep)). So a dive is a text
document, and a restored one plays on exactly as it would have. The one field
that is not plain data, the offered mod cards, is saved by name.

**Decided.**
- A dive can be put down at any moment and resumes exactly where it was. No
  rollback: quitting neither loses nor farms anything, and closing the page
  cannot undo a death.
- Death and the win end the dive and delete it from the save.
- The dive in progress is part of the save **from its first version**, which
  S4 (meta loop skeleton) writes. A dive saved by an older build is rejected
  loudly — the dive is dropped, everything persistent kept — as the technical
  contract requires.
- **Claude's picks**: a resumed dive opens on the pause screen, not
  mid-swing; it is written when the game pauses and when the page is hidden or
  closed.

**The session pillar keeps its name.** A dive runs until death (D66 (the dive
runs on through the layers)), but it can be put down anywhere, so play still
fits a session; the pillar's target — 4–8 min a layer — is unchanged.

**Supersedes Claude's two proposals**: quitting as death, and resuming from the
last layer end with everything since rolled back.

**The seam**: `game/` gains the snapshot and its restore, which port; storing
the text is `platform/`'s, rewritten on the port. The names cross with the
rest of S4 (meta loop skeleton)'s save and are listed in `design.md` then.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — a dive saved at a random tick (a property over seeds and
ticks), restored in a fresh game through Continue, plays on 1500 ticks to the
same whole save text as the one never interrupted; what persists round-trips;
bad saves are refused; the v1 fixture loads. Verified by making `restore()`
forget the RNG, and the current: both diverge.

## D71 — Batches are drawn from pools, never a fixed list · 2026-09-30
The mechanism for a requirement settled from the start: `foundations.md`'s
pillar "Dives differ — two dives of the same layer draw different batches"; the
draft's "level runs must not look the same on every dive"; and Igor,
2026-09-27: "the batches are concrete now? randomized batches coming later?",
answered then as "pick whole batches of comparable threat from a pool". Claude
asked it again on 2026-09-30 as an open choice, and Igor: "settled when we
started. batches are never the same, but are balanced in difficulty. right now
the batches are hardcoded. when alpha is complete they shouldnt be. why are you
even asking? check docs, check other sessions, fill the gaps". **The mechanism
is Claude's call, delegated.**

**Decided, by Claude:**
- **A layer is a record that owns its batches** — as the code's note on
  `BATCHES` already says it must.
- **A layer is a run of stretches, each with a pool.** A stretch holds a few
  hand-made batches of comparable threat, more than it has gates, and a dive
  draws one per gate from the dive's seed, never the same batch twice. The
  order is shaped: the stretches get harder down the layer.
- **Comparable threat is hp, as D54 (the batches, re-derived from scratch)
  sized them**: a stretch's batches sit in one band of total hp — seconds of
  shooting — so any draw is as hard as any other. The bot measures clears per
  batch and flags one outside its band; S6 (balance) owns the tuning.
- **The mini-bosses and the boss keep fixed places.** The mini-bosses rehearse
  the boss's tell and the boss tests it (D65 (a mini-boss is a smaller boss)),
  and the rehearsal has to come first.
- **Hand-made, not generated.** Every batch stays a line of data, tuned and
  measured one by one, as the draft pictures a batch: "a number of enemies that
  have a very similar strength". Rejected: assembling each batch from a threat
  budget — more variety for less writing, less control over what a fight is.
- **Where**: the shape in S4 (meta loop skeleton), which builds the second
  layer; the pools' content in S5 (content). **By alpha no layer is a fixed
  list.**

**Why Claude asked, so it is not repeated**: the requirement was settled and
only its mechanism was open — and a mechanism under a settled requirement is
Claude's to fill. The 2026-09-27 exchange had already named it.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — the same seed draws the same plan, two seeds different
ones; every drawn batch comes from its own stretch's pool, never twice; every
ordinary pool holds more than it draws; `tests/boss.test.js` — every layer ends
on its boss with two lone mini-bosses.

## D72 — Between layers there is no screen; the win has one · 2026-09-30
The pass's last two questions: how the transition plays — Igor, 2026-09-28:
"an open discussion on how to transition between layers - later" — and what
follows the win (D68 (the layer end is a milestone)). Filled by Claude under
the same instruction, "fill the gaps", from what the docs already settle:
smooth, not screens (D58 (the descent)); Igor's "it's all about dynamics,
something is always happening during a layer pass"; and the mod pick as the
dive's one pause.

**Decided, by Claude:**
- **The layer end plays over moving water.** The boss dies, the heal and its
  haul of gems land, the three mod cards open as at any gate — the one pause —
  and the current carries you on down. The water takes the next layer's colour
  and its name shows for a moment; its first batch arrives like any other. No
  screen and no click between layers.
- **The abyss is one tall strip.** The next layer starts where the last one
  ended, so depth keeps adding up — the depth `home` shows (D66 (the dive runs
  on through the layers)).
- **"LAYER CLEARED" becomes the win screen**, shown only at the last layer's
  end: the dive's numbers, then `home`. Its wording is the friendlier-messages
  item in `ideas.md`.
- **After a win**, `home` shows every layer cleared, and diving again works as
  always — from the top, for gems and micro-tasks. Nothing new unlocks at
  alpha.

**Graphics, and placeholders** — Igor's rule, "if it's a graphics matter, state
it and document that it's going to be modified later": the colour change and
the name are the cheapest way to say "a new layer" until art exists.

**Guarded by** (built in S4 (meta loop skeleton), 2026-09-30):
`tests/meta.test.js` — from a layer end, no screen but the cards, and the next
layer's first batch within the usual travel; depth only grows; the win shows
only at the last layer's end (`tests/descent.test.js`). The colour and the name
are graphics, and not asserted.

## D73 — "Layer end" is the term · 2026-09-30
D59 (no mods at the layer end) put it in the glossary under Igor's working
name — "we need a term for layer end (or just call it layer end)". Asked at the
close of the layer-to-layer pass whether to keep it, Igor: "layer end is ok".

**Decided.** **Layer end** is the term, final, and binding like the rest of the
glossary (D32 (fixed vocabulary)). The glossary row drops "working".

**Guarded by**: nothing — it is a word. The glossary is what holds it.

## D74 — Mods add on top of gear and attributes; dash improvements are attributes · 2026-09-30
The first question S4 (meta loop skeleton) opened with, from `ideas.md`: can
one stat be raised by both a mod and gear? Igor, 2026-09-30: "mods on top of
gear/equipment/stats, havent we agreed on that?"

**Decided, by Igor.** A persistent tier — gear or attribute — sets where a dive
starts; mods add on top as they are picked. Everything is added, nothing
multiplied (D36 (attributes)), and D69 (every mod capped) bounds what the mods
can add. `reset()` builds the player as `PLAYER_START`, plus each gear tier,
plus each attribute point, and `takeMod()` adds from there.

**Permanent dash improvements are attributes**, not gear — Claude's reading of
D36, which lists "dash" among the body stats, stated to Igor and not corrected.
`Reflex` and `Impact` keep adding on top. Closes `ideas.md`'s dash-tier
question, which D51 (the dash is bought) left open.

**Why Claude asked, so it is not repeated**: the answer was never written down
— `ideas.md` still listed the question as open, and D31 (two-tier progression)
only implies it — but Igor had given it, and a settled answer is acted on.

**Rejected** (the options `ideas.md` carried): gear and mods on disjoint stats —
every current mod is a body stat, which is what attributes raise, so it would
leave attributes nothing; mods offered only for a stat you own a tier of — a
rule to explain, and mods hidden from a new player.

**Guarded by**: nothing yet, honestly — no stat is raised by both today (the gun
raises `fireRate`, reach `dashSpeed`, and no mod touches either). The first
stat that is gets a check that the mod adds to the floor.

## D75 — S4's content: the gun's tiers, dash reach, a clean batch · 2026-09-30
`plan.md` asks S4 (meta loop skeleton) for one gear item, one attribute and one
micro-task. Claude proposed; Igor: "agreed".

**Decided.**
- **Gear — the gun**: three bought tiers of +0.5 shots/s each (2.5 → 4.0), at
  40 / 100 / 200 gems. A combat stat, as D36 (attributes) puts weapons in gear,
  and one that helps against every enemy; damage would be wasted on the 1-hp
  fish that make up most batches.
- **Attribute — dash reach**: each point +150px/s of `dashSpeed`, 141 → 165 →
  189px of dash. Igor: "some dash upgrades belong at home"; D56 (dash reach is
  its own stat) made reach a field for this.
- **Micro-task — untouched**: clear a batch without taking a hit — D36's own
  first example. 1 point, once per layer, ever; two layers cap the attribute at
  two points, the cap at the source D36 asks for.

**Every number is Claude's pick**, marked in `game/content.js`, S6's (balance)
to tune. Known and accepted: on layer 1 the task will usually pay on the first
batch — nearer a gift than mastery; S5 (content) can make tasks harder.

**Guarded by**: `tests/meta.test.js` — a tier is bought only with the gems for
it, adds +0.5 to every later dive and stops at the top; a clean batch pays one
point, once per layer, announced once; a batch that landed a hit pays nothing;
the point raises reach on the next dive.

## D76 — `home` exists only between dives · 2026-09-30
Claude's design for S4 (meta loop skeleton), approved by Igor in the spec's
part 2 ("approved").

**Decided.** Title → Start goes to `home`; with a dive under way Start reads
**Continue** and opens that dive's pause menu (D70 (a dive can be saved at any
point)). A suspended dive cannot reach `home`, so the shop never meets one.
Death and the win both lead `home`; R on either end screen dives again at once,
since the gems are already banked (D67 (currency is kept on death)). Pause's
"Quit to title" keeps the dive saved, and the title offers it back.

**Why.** A shop reachable from a suspended dive is either a mid-dive shop —
ruled out by the genre contract (6) — or a purchase that changes nothing until
the dive after next, which reads as a bug. Keeping `home` between dives makes
both impossible rather than handled.

**Guarded by**: `tests/meta.test.js` — Start goes `home` between dives and reads
Continue with one under way; death goes `home`, R dives again; `checks.js` —
the same through real keys, and a click on the death screen goes `home`.

## D77 — The save: one versioned document; `persist` is the seam's seventh name · 2026-09-30
How S4 (meta loop skeleton) keeps D70 (a dive can be saved at any point) and
the technical contract's "saves carry a `version` field from the first write".
Claude's design, approved by Igor in the spec's part 3 ("approved").

**Decided.**
- **One JSON document**: `version`, `bank`, `gear`, `spent`, `tasks`,
  `deepest`, `cleared`, and `dive` — the snapshot, or `null` between dives.
  Points available are derived from `tasks` less `spent`, never stored.
- **Written** on pause, on every purchase, when a dive ends, and when the page
  is hidden or closed. A dive's gems are banked last in the tick it ends.
- **Refused loudly**: a save that does not parse, or whose version this build
  does not know, changes nothing; the title says why, and the text is copied
  aside under `abyss-save-rejected` before anything can overwrite it.
- **A fixture keeps it honest**: `tests/fixtures/save-v1.json`, written by the
  first build of the format, must load in every later build — or be migrated.
- **The seam grows by one name, `persist(text)`** (D18 (the port seam)).
  `game/` decides when and builds the text; storing it is the platform's.
  Loading runs the other way, so it needs no name. The seam is seven.
- **A driven game neither reads nor writes the save** — `?test` and `?dev=`
  would otherwise overwrite a player's save, or check the player's gear instead
  of the game's.

**Guarded by**: `tests/invariants.test.js` — the harness stubs exactly seven
names; `tests/meta.test.js` — the D70 property, the round trip, the refusals,
the fixture. Seen in a browser, 2026-09-30: pause, reload, Continue resumes the
same dive at the same moment; a version-7 save is refused on the title and
kept aside.

## D78 — Gems are pulled to the player; whether an enemy drops is balance's · 2026-09-30
Raised by Claude in S4 (meta loop skeleton)'s sweep: D35 (currency is
auto-collected) sends gems to the *counter*, while the build pulls them to the
player — the S4 spec had paraphrased D35 without reading it. Igor, asked to
choose: "it is dropped by enemies (sometimes it should not - balance),
autocollected by pulling towards a player, what else you want from me?"

**Decided, by Igor. Amends D35 on two points:**
- **Gems are pulled towards the player**, from wherever they drop — not flown
  to the counter. `GEM_PULL` stays (600, Claude's pick), which D35 had deleted.
  This is what S4 built.
- **Whether an enemy drops at all is a balance lever** — "sometimes it should
  not". D35's "a threatening enemy *always* drops; only the value is random" no
  longer binds; which enemies drop, how often and how much is S6 (balance)'s.

**Unchanged from D35**: collection is automatic, with no pickup radius and no
expiry, and combat is the dive's only dynamic. D35's debounced `+N` popup still
stands, unbuilt: it is feel, which `CLAUDE.md` puts in S7 (alpha polish), and
its placement is still Igor's pick when it is built — Claude's reading of that
rule, stated to Igor.

**Guarded by**: `tests/meta.test.js` — every gem reaches the player from
anywhere and none fades; `checks.js` — a far gem flies to you and pays. The
drop rule has no check until S6 (balance) writes one.

## D79 — A dive goes from easiest to hardest; what that means is balance's · 2026-09-30
Raised by Claude in S4 (meta loop skeleton): since D71 (batches are drawn from
pools) a dive can open on stretch 1's 14 darters, where the bot dies at once.
Igor: "all dives go from easiest to hardest. what it means is a question of
balance. right now the batches are hard coded and are shitty because of that -
you know no level of difficulty, we havent settled how batches grow
balance-wise."

**Decided, by Igor**, and clarified the same day: threat rises **overall and
gradually** through a dive — "difficulty growth is not linear, some later
batches might be easier, but OVERALL gradual increase in threat happens anyway.
roguelite, remember?" It grows "naturally, in numbers and in enemy types". No
rule that every batch is harder than the one before it.

**Claude over-read it first.** This entry's first version, and the design Claude
then opened ("every ordinary batch at least as hard as the one before"), turned
"easiest to hardest" into a strict per-batch rule — the strengthened-word
failure `CLAUDE.md` records. Corrected here the same day.

**The measure is S6 (balance)'s.** Igor chose its direction — approach A: a
threat number on each enemy type, a batch's threat computed from its enemies,
measurement correcting the numbers — and placed the work: "develop a complex
mathematical system for enemies that impact the game and player feel - yes, of
course. is it part of balance? yes." Until then D71 (batches are drawn from
pools)'s hp bands stand in. Claude's further rules — a 1.25 spread per pool,
bands that never overlap, easiest-first within a stretch — were not approved
and are not decided.

**Today is fine for this stage.** Igor: "it's very hard to assess the flow with
three primitive enemies. if you ask if it's ok at current stage, yes it is."
The second layer repeating the first is a placeholder S5 (content) replaces.

**Guarded by**: nothing yet — the check comes with S6 (balance)'s measure.


## D80 — Before S5: a doc for every game entity, and mods reworked into enemy drops · 2026-09-30
Igor, 2026-09-30, closing S4 (meta loop skeleton): "write two big requirements
before s5: 1. md docs for every game entity. the structure of docs is better
and agents know exactly where to look for info. every entity doc has a
sensible layout with tables & naming 2. mods rework from choice to enemy drops
(from ideas) these are two big tasks, i'll do them in separate sessions".

**Decided, by Igor.**
- **Entity docs**: a markdown doc for every game entity — each enemy, gear
  piece and mod at least ("a set of md files with strict documentation of each
  enemy, each gear piece and each mod, so that there is always reference",
  earlier the same day) — with a sensible layout, tables and naming, so an
  agent knows exactly where to look.
- **Mods from enemy drops**: mods stop being a choice and become drops from
  enemies — the idea `ideas.md` carries as "Mods as drops, never offered".
- **Both come before S5 (content)**, each in its own session. `plan.md` puts
  them between S4 and S5 without renumbering.
- **The entity docs also settle the weapon record and reserve the enemy
  `threat` field** — S5 (content)'s entry asks for final data shapes, and there
  is no weapon record yet, while S6 (balance)'s threat number (D79 (a dive goes
  from easiest to hardest)) would add a field to every enemy. Claude's
  proposal; Igor: "yes".

**Not decided**: everything inside each session — the docs' layout and where
they live; how drops work, pseudo-random or not, permanent or temporary, and
what becomes of rank, the caps and the fill cards. Until the rework session
lands, the mod pick stands as `foundations.md` has it (the glossary's **mod**,
**rank**, **gate** and **layer end** rows; the genre contract, 4–6), with D33
(mod offers do not interrupt), D34 (mods), D49 (one rank per batch, mods at the
gate), D68 (the layer end is a milestone) and D69 (every mod capped) — that
session supersedes what it changes, in the same step as it edits
`foundations.md`.

**Guarded by**: nothing yet — both are work to come. Each session brings its
own checks.

## D81 — Entity docs: one per kind, held to the code · 2026-10-01
The first requirement before S5 (content) (D80 (entity docs and mods from drops
come first)). Igor set the session's goal: "create doc files for: weapons,
mods, enemies, equipment - includes currently implemented, easily scalable for
more - contains all the relevant meta for each item: naming, numbers,
descriptions - documenting special tasks - i'll see how that works out, lets
leave them out of scope now". Mid-session: "layout and location for the entity
docs - do without review".

**Decided — Claude's call, delegated by that answer.**
- **Where**: `docs/entities/`, a doc per kind — `enemies.md`, `mods.md`,
  `weapons.md`, `equipment.md`. A kind per doc rather than an item per doc:
  at the alpha's counts each kind stays one readable table, and a table is
  where items get compared.
- **The layout**, the same in every one (`docs/README.md` → The entity docs):
  what the kind is; a roster holding every number; the record's fields, a
  reserved one marked; a section per item; how to add one.
- **Held to the code, not trusted.** `tests/docs.test.js` rebuilds each roster
  from `game/content.js` and requires it word for word, requires every field
  of a record to be documented and every documented one to exist or be marked
  reserved, and requires a section for every item and none for an item that
  is gone.
- **An entity's behaviour lives in its doc**: the chase and the lunge are in
  `enemies.md`. `design.md` keeps the systems around the entities — the gate,
  the offer, the descent, the save — and gave up its enemy table, its mod
  list, the lunge and the Gun's numbers.
- **`threat` is reserved** in `enemies.md`, as D80 asked: S6 (balance) fills
  it, on every type at once.
- **"Equipment" joins the glossary**: gear that is not a weapon. It is Igor's
  word in the goal and the draft's ("2-3 weapons, 2-3 equipment items"); the
  glossary had no word for it, and `plan.md`'s "2–3 gear items" beside "2–3
  weapons" read two ways, since gear includes weapons.

**Left out, by Igor**: micro-tasks, "special tasks". Not asked for, so not
written either: attributes, layers and batches — `design.md` and
`game/content.js` hold them.

**Not decided**: the weapon record — what a weapon is as data, how one is
owned and equipped, its tiers, where weapon-scoped mods attach — which D80
also gave this session. `weapons.md` documents the Gun as it stands, spread
over `PLAYER_START`, `BULLET_SPEED` and a `GEAR` record, and says so.

**Guarded by**: `tests/docs.test.js` → the entity docs, five checks, each seen
to fail on a broken doc before it passed.

## D82 — The docs map: living docs and logs, one home per fact · 2026-10-01
Igor's goal for the same session: "organize docs/ structure for me and yourself
so that everything can be easily found, files arent bloated with obsolete or
excessive info, and files are always in sync and consistency with each other
and the codebase".

**Decided — Claude's call, under that goal.**
- **`docs/README.md` is the map**: a table from a question to the doc that
  answers it. A session reads `foundations.md` and `plan.md`, then looks the
  rest up — `CLAUDE.md`'s seven-doc reading order goes, since no session reads
  `decisions.md` whole to start work.
- **Living docs and logs.** `foundations.md`, `plan.md`, `roadmap.md`,
  `design.md`, `entities/` and `ideas.md` say what is true now and carry no
  history. `decisions.md`, `changelog.md` and `specs/` are logs, only
  ever appended to.
- **One home per fact**; the map lists the homes.
- **Applied now.** `ideas.md` lost every item a decision had answered — the
  decision is its record — and `Lull` and the void "finished standalone"
  question moved under Declined. `plan.md`'s closed stages became one table;
  their definitions of done stay in the changelog, and the one item they still
  carried, D35's `+N` popup, went to S7 (alpha polish). `roadmap.md` lost the
  superseded phases and the standing-constraints pointer. `design.md` lost
  what `entities/` now owns, a history of the dash, and four stale statements:
  bullets "still open in S1", dash reach "fixed at 141px", `Fins` "uncapped",
  and `segDistance()`, since renamed. The root `README.md` had lost the
  `layer-2` scenario.
- **Not changed**: `decisions.md` and `changelog.md`, however long. They are
  logs; rewriting them would make them fiction.

**Guarded by**: `tests/docs.test.js` — the map names every doc, and every doc
it or `CLAUDE.md` names exists; every `NAME value` quote in a doc that
describes the code is the constant's real value; `design.md`'s list of the
diver's starting numbers is complete and true; the root `README.md` lists
every scenario.

## D83 — The weapon record: a line of data, one carried per dive · 2026-10-01
The rest of the first requirement before S5 (content) (D80 (entity docs and
mods from drops come first)): what a weapon is as data, how one is owned and
equipped, its tiers, and where weapon-scoped mods attach. Igor: "design weapon
record"; Claude proposed seven points, and Igor: "approved". The design and its
check against `foundations.md`:
`specs/2026-10-01-weapon-record-design.md`.

**Taken as settled**: weapons are gear (the glossary); each has upgrades of
its own, and the player invests in the one that suits them
(`high level design.md`); nothing is managed mid-dive (the genre contract, 6).

**Decided — Claude's design, approved by Igor.**
- **A weapon is a line in `WEAPONS`**: `name`; the shot — `fireRate`,
  `damage`, `range`, `shotSpeed`, `shotRadius`, `pierce`; its own `tiers`. The
  Gun is the first line: `BULLET_SPEED` became its `shotSpeed`, and the shot
  radius hard-coded in `game/logic.js` its `shotRadius`. `GEAR`, left with the
  equipment, is `EQUIPMENT`.
- **Owned and carried**: any number owned, one carried per dive, chosen at
  `home` between dives, never switched mid-dive. Built with the second weapon,
  in S5 (content) — a `cost` to own one, the carried weapon's name in the save
  — and reserved in `entities/weapons.md` until then. Today the first line is
  carried.
- **Tiers of their own**: each `{ cost, apply }`, so one tier can add rate and
  the next pierce. Equipment shares the shape.
- **The carried weapon's numbers sit on the player** for the dive: copied when
  it starts, then its tiers and the equipment's, the attribute points, and the
  mods on top — all adding. A weapon left at `home` adds nothing.
- **Weapon mods are ordinary mods** with `scope: 'weapon'` and a list of the
  weapons they fit, `weapons` — reserved until S5 (content) writes one.
  **Supersedes the mechanism of D31 (two-tier progression)**: `apply` does not
  receive the weapon, since with its numbers on the player there is nothing to
  pass. D31's `scope` stands.
- **Melee is first tried as data**: a very short, wide, piercing shot. A
  behaviour of its own only if that does not read as melee — Igor's call, in
  S5 (content).
- **The save is version 2**, its first migration: a v1 dive's player gains the
  Gun's shot as it was then, 430 and 4, as it loads. The v1 fixture still
  loads, and a v2 fixture joins it.

**Left open, with owners**: an RMB secondary would need numbers of its own
(`ideas.md`). A scenario that names the weapon carried, for S6 (balance)'s
per-weapon measurement, and `home` with several weapons both come with the
second weapon, in S5 (content).

**Guarded by**: `tests/meta.test.js` — the carried weapon's numbers reach the
player and every shot; each tier its own cost and effect, and a weapon left at
home adds nothing; the v1 fixture migrated and the v2 fixture loaded, both
firing finite shots. `tests/docs.test.js` — `entities/weapons.md` and
`equipment.md` rebuilt from the tables.

## D84 — Mods are dropped: a glowing fish carries each batch's mod · 2026-10-12
The second requirement before S5 (content) (D80 (entity docs and mods from drops
come first)): "mods rework from choice to enemy drops". Opened 2026-10-01 as a
discussion — Igor: "throw your ideas about mods becoming drop-pickable instead
of chosen … look up in the web for similar mechanics, evaluate possible
transition from our current state". Claude researched how a dozen games hand
out power mid-run and offered three shapes: A, the pick becomes a drop; B, A
plus temporary boosts; C, a stream from every kill, Risk of Rain 2's. Igor,
2026-10-12: "go with B". The design, the research and its check against
`foundations.md`: `specs/2026-10-12-mods-from-drops-design.md`.

**Decided.**
- **A glowing fish carries each batch's mod.** When a batch of the plan
  arrives, a point between a third and two thirds of its total health is drawn
  (`GLOW_FROM`, `GLOW_TO`); the first time what is left of the batch falls to
  it, one living fish lights up. Igor: "ok for glow, comes randomly in the
  middle" — Claude's reading, stated in the spec and not corrected: a fish
  already in the batch lights up, no extra fish arrives. A batch of one — the
  mini-boss — lights up partway through its own health. If everything left dies
  in one tick, one of those carries it anyway: a batch's mod is never lost.
- **No carrier in a layer end's batch**: the layer end's pick pays it (D85 (the
  layer end's pick)). Enemies placed by hand belong to no batch and carry
  nothing.
- **The mod flies to you like a gem and never expires** — it lasts the rest of
  the dive. Igor, on "some of them permanent": "yes i meant exactly this" — for
  the rest of the dive, never past it.
- **Which mod**: an ordinary mod still under its cap, every one once before any
  comes again — a round, dealt from the seed. Claude's call, delegated.
- **Caps**: unchanged, every mod still capped (D69 (every mod capped)). Igor:
  "cap is a question of balance. we are shifting towards a game where caps are
  hard to decide at this point. make the easiest implementation now." So when
  nothing is left to draw, no fish glows.
- **The fill cards are deleted**, the gems card and the heart. Igor: "currency
  is a spendable entity, used on home screen. not related to mods or boosts."
  Drops live in an array of their own, apart from `gems`, for the same reason.
- **A pickup is named on a line of its own**, `banner`, under the micro-tasks'
  `notice`. The spec said `notice`; the build found a clean batch's task and
  its mod land together, and one would overwrite the other.
- **The save is version 3**, its second migration: a v2 dive loses its rank,
  starts with nothing dropped or running and no fish left to light in the batch
  it was in, and — saved with the cards up — takes the card it had marked.
  `tests/fixtures/save-v3.json` joins the other two.

**Supersedes** the pick at every gate: D33 (mod offers do not interrupt) keeps
its rule — nothing interrupts combat — and loses its gate; D34 (mods) loses
"one per gate" and the choice; D49 (one rank per batch, mods at the gate)
entire; rules 1 and 3 of D69 (every mod capped) — one rank per batch, and the
offer that never runs dry. D51 (the dash is bought, and the offer waits for the
death)'s delay now waits only for the boss's death. D69's rule 4 — the pool
grows so its caps cover a full dive — stands, now counting the fish of a dive
and the layer ends' cards.

**Why.** Igor's original questions, 2026-09-30: "would it allow more variety to
mod system? would it make the game feel more dynamic and more understandable?"
Drops take "momentum, not strategy" (D34 (mods)) all the way: no reading at a
gate, power arriving mid-fight, and the gate's pause gone — Igor's "something is
always happening during a layer pass". The count stays one per batch, so a
layer still pays a known number of mods and balance stays arithmetic; only
which mod arrives is random.

**Chosen over**: A, the pick become a drop with nothing else (no temporary
power, the frequent layer missing); C, a stream of small drops from every kill
(single pickups too small to feel, and every rate re-derived).

**Guarded by**: `tests/drops.test.js` — one fish lit per batch between a third
and two thirds of its health; a mini-boss partway through its own; none in a
layer end's batch; the mod dropped when the batch dies at once; flown in,
counted, applied and named on its own line; nothing lit once every ordinary mod
is capped, or when a batch is emptied by hand; every ordinary mod once a round,
the same from the same seed; the v2 migration; a batch's point kept across a
save. `tests/meta.test.js` — no mod past its cap, whatever the fish carry and
the layer ends offer; the v3 fixture. `tests/boss.test.js`,
`tests/descent.test.js` — a gate opens no cards. `checks.js` — the same, by
real shots. 22 deliberate breaks, each caught. Added after the cloud review of
2026-10-12 found the last slot under a cap dealt twice — a mod still in the air
was not counted: in `tests/drops.test.js`, a mod in the air counted as held —
no fish lit for the slot it has taken, no slot handed out twice, no card for it.

## D85 — The layer end's pick: valuable mods, then Continue · 2026-10-12
Igor, on Claude's "the dive has no pause": "not quite, layer end does have a
pause". What fills it: "make it a choice of valuable mods, with a continue
button after being chosen". What makes one valuable — its own mods, or
ordinary ones at a bigger step: "both good. for a player, they must be
somewhat similar. go with a mix of both." And: "clicking a card only marks it,
so you can switch until you press Continue, yes to that".

**Decided.**
- **Up to three cards, from one pool**: the layer end's own mods (`end`), once
  a card, and the ordinary ones at a bigger step, `END_STEP` picks at once —
  2, Claude's pick. Each only with room under its cap for what its card gives;
  fewer cards when the pool runs short, and none leaves only Continue.
- **"Somewhat similar"**, in Claude's reading: the same card and the same look,
  and about the same worth — one of the layer end's own is written to be worth
  about a double step.
- **The first of its own is `Mend`** — Claude's pick: the one switch in the
  pool, and "a heart back each batch" reads as valuable. It no longer rides on a
  fish.
- **A card is marked, then taken on Continue.** A click, its number or the
  arrows mark one, and you can switch; Continue — a button under the cards — or
  Enter takes the marked one, and the current carries you on. It opens with
  the middle card marked, so Enter alone is still a one-second pick. A cursor
  passing over a card marks nothing: the build found that on its way down to
  Continue it crosses the cards, and would switch the mark.
- **The last layer's end has no pick** — the win, as D68 (the layer end is a
  milestone) has it.

**Amends** D68 (the layer end is a milestone) — "a gate's rank and three mods"
becomes the pick of valuable mods — and D72 (between layers there is no
screen): the pick, ended by Continue, is still the only thing between layers.

**Guarded by**: `tests/drops.test.js` — three valuable cards on a fresh dive,
of both kinds; none without room for its step; none of its own past its cap,
none at all with everything capped; a passing cursor marks nothing, a click
and a number mark, the current waits, Continue and Enter take, an ordinary mod
at the bigger step. `checks.js` — the offer waits out the boss's death, three
cards, the middle marked, a click marks and Continue takes, by real input.

## D86 — Boosts: short powers dropped by kills · 2026-10-12
Igor, 2026-10-01, opening the discussion: "some can be temporary boosts", and
"the may behave like gems used to in the prototype - disappear after a while".
Shape B (D84 (mods are dropped)) has them; "boost" is his word, and the
glossary's from now on. On whether D35 (currency is auto-collected) — "never
chased" — binds them: "currency is a spendable entity, used on home screen. not
related to mods or boosts."

**Decided.**
- **A boost is not a mod**: not counted, no cap, nothing kept. It lasts
  seconds, so it is no progression tier.
- **When one drops**: the chance on the Nth kill since the last boost is
  `BOOST_C` × N — the pseudo-random distribution Dota uses. 0.02, Claude's pick:
  about one every 8.5 kills, never more than 50 apart, seldom two in a row.
  Never from the kill that empties the arena — it would fade behind you while
  the current carried you on; that kill still counts toward the next.
- **On the floor** it is not pulled to you: it lies where it fell for
  `BOOST_LIFE` (6s, Claude's pick), blinking at the end, then it is gone — the
  prototype's gems (D11 (gems expire after 8 seconds)).
- **Touched**, it switches on at once — never held for later, which the genre
  contract (6) rules out — and adds its numbers for its `time`. Touched again
  while it runs, its clock restarts and nothing stacks. The pause and the layer
  end's pick hold its clock. Its effect is numbers, `add`, not a function, so
  it can be taken back; for the same reason it never moves `hp`.
- **The first boost is `Rush`**: speed +200 for 5s. Claude's pick; S5 (content)
  writes more.
- **The bot never seeks one**; it touches one only by swimming over it, so its
  figures stay a floor (D50 (the dash sweeps its path; the bot is not a
  difficulty instrument)).

**Glossary**: the **boost** row, in `foundations.md`, with the genre contract's
point 6 — grabbing one is positioning inside a fight, not gathering.

**Guarded by**: `tests/drops.test.js` — never 1/C kills apart and seldom back to
back, over 30 seeds; never from the arena's last kill; left where it fell and
gone after its life; its numbers on with a touch and off after its time; a
second touch restarting, not stacking; held while paused. `tests/invariants.test.js`
— no NaN in drops or boosts.

## D87 — Rank is retired · 2026-10-12
Igor, 2026-10-01: "ranks dont make sense anymore? just a number of completed
batches or waves? could it be something more or just leave em?" Claude's
answer: a rank was one batch cleared, every batch must be cleared, so it only
repeated the depth; its one job was paying for the pick, which D84 (mods are
dropped) ends. Igor, 2026-10-12, asked whether it retires: "yes".

**Decided.** `rank` leaves the state, the HUD — `BATCH n` already shows the
same count — the cards' heading, the end screens, the save (version 3 drops it)
and the glossary. A scenario's kit is taken as picks, with no rank.

**Not taken**: a rank that only play can earn — a meter that climbs with clean,
fast clears, drops when you are hit and raises the drop odds, as Isaac's devil
rooms reward a floor without damage. A system of its own, and it snowballs:
good players get stronger still. Filed in `ideas.md`, Claude's suggestion, not
discussed.

**Guarded by**: `tests/drops.test.js` — no rank in the dive's save.

## D88 — The fish glows from the start, and never a boss or a mini-boss · 2026-10-12
Igor, playing D84 (mods are dropped): "glow must appear on the enemy from the
start, not in the middle of a fight", and "remove glow from mini-bosses".

**Decided.**
- **One fish of each batch glows from the moment the batch arrives** and carries
  its mod; killing it drops the mod, as before. The health point a fish lit up
  at, `GLOW_FROM` and `GLOW_TO`, is gone, and with it the per-tick check and the
  save's `glowAt`.
- **A boss or a mini-boss never glows**: their types carry `carries: false`, so
  a mini-boss's gate pays no mod, and the boss's batch stays paid by the layer
  end's pick (D85 (the layer end's pick)). The layer end's own rule for its
  batch went with it: the boss is that batch.
- Which fish, and which mod it carries, is still drawn from the dive's seed.

**Supersedes** D84 (mods are dropped)'s "partway through" — the lighting point
and the batch of one lighting up partway through its own health — and its
"no carrier in a layer end's batch", now the boss's own `carries: false`.

**Claude misread it first.** Igor's earlier "ok for glow, comes randomly in the
middle" was read as *the glow* coming in the middle of the fight; the spec
stated the reading and Igor approved the spec, but it was the reading, not
his intent, that got built. The same shape as the strengthened-word failure
`CLAUDE.md` records: a reading stated in passing is not a question asked.

**Guarded by**: `tests/drops.test.js` — one fish lit as every ordinary batch
arrives, never a type that does not carry; no glow on a mini-boss and no mod
from its gate; none on the boss; the glowing fish kept across a save.
`tests/boss.test.js` — a mini-boss's clear pays no mod and opens no cards.

## D89 — Layers are numbered until they are named · 2026-10-12
Igor: "what's "the shelf" and "the drop"? make it layer 1 & 2, we'll come up
with namings later".

**Decided.**
- The layers are **Layer 1** and **Layer 2** until they get names.
- **A layer's micro-tasks are kept by its number, not its name** — Claude's
  call, under "we'll come up with namings later": kept by name, every renaming
  would forget what a layer had paid, or need a migration of its own. The save
  stays version 3 — not yet committed when this changed — and its migration
  moves a v2 save's tasks from the old names to their numbers. Supersedes
  D77 (the save)'s "`tasks` per layer name".
- The stretches both layers share are `STRETCHES`, no longer named after the
  first layer.

**Guarded by**: `tests/meta.test.js` — a layer renamed keeps the task it paid,
on the save and on `home`; the v1 and v2 fixtures come back with their task
under layer 1's number.

## D90 — Continue goes straight back in; a dive ends on Dive again or Go home · 2026-10-12
Igor, playing: "esc -> quit to title -> resume -> stays in paused. works but
is unnatural." And: "on death, restart a dive wording is obsolete i think.
make it dive again + go home buttons choice".

**Decided.**
- **The title's Continue resumes the dive where it was** — in play, or on the
  layer end's cards — not on its pause menu. Supersedes Claude's pick in D70
  (a dive can be saved at any point), "a resumed dive opens on the pause
  screen", and D76 (`home` exists only between dives)'s "opens that dive's
  pause menu".
- **Both end screens offer two buttons, Dive again and Go home**, answering the
  keys and the mouse like any menu; a click anywhere else does nothing. R is
  gone, with the help's "Restart a dive" row. Death and the win share the
  screen, so the win gets the buttons too — Claude's call.
- **Go home opens marked** — Claude's call: Space is also the dash, and a stray
  Enter or Space now does what any key did before, so diving again is always a
  choice, never an accident.
- The water keeps flowing under them (D58 (the descent)): they are menus that
  `flows`.

**Not now** — Igor, the same message: "no new game, just continue - leave that
for ux fixing, pick a later stage that fits most". A New game beside Continue,
to abandon a saved dive, is in `plan.md` → S7 (alpha polish).

**Guarded by**: `tests/meta.test.js` — Continue puts the dive straight back in
play; after a death, Enter goes home, a click on Dive again dives, a click off
the buttons does nothing; the D70 property, now resuming through Continue.
`tests/descent.test.js` — the win's Dive again. `checks.js` — the same by real
clicks and a Russian-layout W.

## D91 — Comments amend the code; they never define or contradict it · 2026-10-12
Igor, 2026-10-12: "go through comments in code and verify they only explain
essential parts. comments must not define or contradict the codebase, but
amend it. codebase is the source of truth for behaviour, md files are the docs
and specs for what it must implement".

**Decided, by Igor.** The code is the source of truth for behaviour; `docs/`
is the spec for what it must implement; a comment amends the code — it never
defines behaviour the code does not have, and never contradicts it.

**Claude's reading of "only essential parts"**, applied in the pass the same
day and open to Igor: a comment keeps the *why* — a constraint, a gotcha, a
trade-off — and what the code cannot say for itself, pointing at the
decision that owns the rest. It drops history ("used to", "since S2", what a
past build measured), quotes and dates — `decisions.md` holds them — and
numbers copied from elsewhere, which go stale. Units on a constant, `ponytail:`
notes and Claude's-pick markers stay.

**The pass.** Every comment in `game/`, `platform/`, `main.js`, `checks.js`,
`tests/` and the citation hook was read against its code; 16 files changed,
242 lines fewer. A checker compared each file with its last commit, comments
ignored — oxc reprints both without them — so the pass changed no code. It
found comments that contradicted the code: a cursor documented as the title
and pause menus' that drives every menu; "they survive R" after R was gone; a
header claiming "no browser" over a volume option that touches `master`; the
save cited to D70 (a dive can be saved at any point) where `persist` is D77
(the save; the seam's seventh name); "LAYER CLEARED" named as the win's
heading, which is "ABYSS CLEARED"; a swept-dash check describing a dash speed
of "speed x 3.4", gone since D56 (the dash is a fixed, committed lunge); a
stepped scenario waiting on `step()` where it is `advance()`; and a function's
comment sitting above the wrong function.

**Guarded by**: nothing mechanical can read whether prose is true — that stays
the consistency sweep's (`CLAUDE.md`). The convention is in `CLAUDE.md` →
Conventions.

## D92 — No line counts in the docs · 2026-10-12
Igor, 2026-10-12: "remove line count from docs, updates frequently and no one
needs this info".

**Decided, by Igor.** The docs quote no line counts, and no test holds them to
the code.

**Claude's reading**, open to Igor: the platform share in `design.md` → Files
goes with them — it is the two counts' ratio, moved with every edit, and
needed the same regenerating. D17 (the browser build is a throwaway
prototype)'s one measurement stays, as its record. `CLAUDE.md`'s rule against
investing in the canvas layer stands without a number to watch.

## D93 — The content stage's counts: mods, boosts, micro-tasks, attributes · 2026-10-13
Igor, 2026-10-13, after asking whether S5 (content) was ready: "include in s5:
design and add 5-7 mods and 3-5 boosts". Asked whether those are new or
totals: "total 5–7 mods and 3–5 boosts new". Then: "mods & boosts go into the
plan", "add total of 3 micro-tasks to the plan in s5", and "add 3 attributes
along with micro-tasks".

**Decided, by Igor.** S5 (content) designs and adds, to counts:
- **5–7 mods in total.** Six exist today: five ordinary, and `Mend`.
- **3–5 new boosts** beside `Rush` — four to six in all.
- **Three micro-tasks in total.** One exists today, `untouched`.
- **Three attributes in total.** One exists today, `Dash reach`. "In total"
  is Claude's reading of "along with micro-tasks", open to Igor.

Which ones, and what each does, is the stage's design work.

**Supersedes** D69 (every mod capped)'s rule 4, as D84 (mods are dropped)
restated it: the pool no longer grows until its caps cover a full dive, and
the stage's exit no longer asks it to. A layer has twelve ordinary batches,
so 3–5 layers light 36–60 fish, and 5–7 mods at today's caps hold at most 19
picks. Shown that, Igor: "i dont feel like limiting mods is a problem now. we
can remove the limit entirely and see how it affects balance. or bigger caps,
yes. dont really matter at this point" — a lean, so the caps stand as D69
(every mod capped) set them, and the question is open in `ideas.md`, S6
(balance)'s.

**Guarded by**: nothing yet — the counts are S5 (content)'s work, and its exit
counts them.

## D94 — Superpowers dropped · 2026-10-13
Igor, after S5 (content) was built: "would you perform better or worse if we
dump superpowers from this project completely? considering all md files that
exist to guard the project rules". Claude's answer: slightly better, once the
few habits it gave that the project's own rules did not say move into
`CLAUDE.md` — four of the six of its skills loaded while building S5 (content)
were mostly overridden, and every collision is a place the wrong side can win,
as it had twice. Igor: "yes drop it".

**Decided, by Igor.**
- **The superpowers plugin is switched off for this project**, in
  `.claude/settings.json` (`enabledPlugins`), and stays on wherever else Igor
  uses it.
- **What it gave moves into `CLAUDE.md`**: failure cases listed before
  building anything that touches more than one system, the whole change
  reviewed at the end for how its parts meet, a root cause and a failing check
  before any fix (Verification), and a spec, a plan and a progress log for
  stage-sized work (Working agreement). The "Skills and plugins" section keeps
  ponytail, disciplines and the global rules, and says what the global trigger
  table's two superpowers rows mean here.
- **Specs are kept, in `docs/specs/`; plans are not kept.** Amended the same
  day — Igor: "do something with superpowers dir. you find its specs and plans
  useful or overengineered?" Claude's answer: the specs are useful — the
  decisions and the tests point to them for a stage's design and its check
  against `foundations.md` — and the plans over-engineered: build scaffolding
  that goes stale the moment it is built, one of them mostly code since
  rewritten. So the specs moved to `docs/specs/`, the plans went (git keeps
  them), and S3 (one boss, one complete layer), which had no spec, kept its
  plan's design part as one. A stage's plan and log live in the session's
  scratch space from now on.

**Guarded by**: `tests/docs.test.js` — `.claude/settings.json` keeps
superpowers switched off.

## D95 — Three enemy behaviours, and one way to be hurt · 2026-10-13
Igor, opening S5 (content): "start S5, dont interrupt unless there are major
contradictions with the plan". The stage asks for five to seven enemy
behaviours, and two existed — the chase and the lunge. **Claude's call,
delegated**, open to Igor to reopen. The design and its check against
`foundations.md`: `specs/2026-10-13-s5-content-design.md`.

**Decided, by Claude.**
- **The archer spits** (`spit`): it closes to its range, backs off inside
  `near` and holds between; while within range and wholly in the view it
  spits a slow shot at where the player is, every `every` seconds. Its range
  sits under the Gun's, so the starting weapon can always answer it. The
  draft's "avoiding the player and shooting from a distance", and `ideas.md`'s
  parked ranged fish.
- **The puffer bursts** (`fuse`): it chases; within `trigger` and wholly in
  the view it stops and swells for `time` seconds — the tell, its blast ring
  drawn — then bursts, costing a heart within `blast`. The dash's shove still
  moves it. Shot first, it dies like any fish. **A burst is not a kill**: no
  gems, no boost, nothing counted, and a glowing puffer that bursts takes its
  batch's mod with it — only a fish you shoot pays. The draft's "exploding
  after a short time".
- **The eel weaves** (`weave`): it closes in like a chaser while swaying
  across its heading, `width` px either side at `rate` sways a second, so a
  shot aimed where it is misses where it will be. The draft's "moving in a
  peculiar way". A batch's eels sway in step, as a school — nothing drawn
  from the seed.
- **Enemy shots live in `bullets[]` with `evil: true`** — not a second array.
  They fly and die at their `travel`, sweep their segment against the player
  (D53 (fixed timestep, and bullets sweep too)), never touch a fish, and are
  spent only by a hit that lands.
- **One way to be hurt**: a bite, a shot and a burst all go through `hurtPlayer()` —
  the i-frames and the dash's invulnerability, `&immortal`, `batchHit`, the
  shake, death.
- **What a behaviour costs**: `makeEnemy()` copies every behaviour field a
  type has, and the docs check builds a table per behaviour field, so the next
  behaviour costs its field, its step function, one branch, its checks, its
  doc and a scenario.
- **`all-types` replaces `three-types`**: every ordinary type in a row, read
  from the table, so a new type joins it.

**Answers** `ideas.md`'s parked "Enemy behaviours, not just enemy stats" — five
behaviours by alpha, its ranged fish the archer — which leaves it.

**Guarded by**: `tests/enemies.test.js` — the archer closes in, holds, backs
off without leaving the view, comes into the view before it spits, and spits
at its cadence at the player; a shot costs a heart and is spent, passes the
dash's invulnerability and `&immortal` unspent, never hits a fish and dies at
its travel; the puffer lights only near and in view, holds still but for the
shove, bursts on time inside its ring and not outside, dies like any fish when
shot, and pays nothing for a burst — not even when a wounding dash meets it on
the tick it bursts; the eel sways out to one side and then the
other, within its width, once a sway, while closing in. `tests/meta.test.js` — a dive saved with a
shot in flight and a puffer swelling plays on identically. `tests/docs.test.js`
— a table per behaviour field. `checks.js` —
`all-types` places every ordinary type.

## D96 — Gear and attributes on screens of their own · 2026-10-13
S5 (content) brings three weapons, three pieces of equipment and three
attributes (D93 (the content stage's counts)), and with Dive, Help and Options
that is a dozen rows: on one `home` screen they run through the hint.
**Claude's call, delegated** (Igor: "start S5, dont interrupt unless there are
major contradictions with the plan"), open to Igor to reopen.

**Decided, by Claude.**
- **`home` holds Dive, Gear, Attributes, Help and Options.** Gear lists the
  weapons and the equipment, with the gems to spend; Attributes lists the
  attributes, with the points. Each ends on a Back row, and Esc goes `home`.
- **They are `MENUS` entries**, so the screens stay data (D38 (the `home`
  screen is canvas, with layout as data)) and reachable only from `home`, so
  only between dives (D76 (`home` exists only between dives)).
- **Every menu's rows are held above the hint** in the browser suite, not
  `home`'s alone — the gear and attribute lists grow from tables. This answers
  `ideas.md`'s "guard the other screens against overflow" for the menus.

**Guarded by**: `tests/meta.test.js` — `home`'s rows, Gear and Attributes
opened and left by Esc and by Back. `checks.js` — every menu's last row ends
above the hint.

## D97 — Weapons are owned, and one is carried · 2026-10-13
D83 (the weapon record) settled the shape — any number owned, one carried per
dive, chosen at `home` between dives and never switched mid-dive; a `cost` to
own one and the carried weapon's name in the save — and left the building to
the second weapon, in S5 (content). Where it left a choice, **Claude's call,
delegated** (Igor: "start S5, dont interrupt unless there are major
contradictions with the plan"), open to Igor to reopen.

**Decided, by Claude.**
- **A weapon's row on the Gear screen does one thing at a time**: not owned —
  own it for its `cost`, and it is carried at once; owned — carry it, for
  nothing; carried — raise its tier. One sentence: choose a weapon to carry
  it, choose the one you carry to raise its tier.
- **What costs nothing is owned from the start** — the Gun — and the first
  weapon is carried. A save that names a weapon no longer there carries the
  first.
- **The dive keeps the carried weapon's name**, `weaponName`, beside its
  numbers on the player, for the weapon mods to read.
- **A scenario names the weapon it carries** with `weapon:`, whatever `home`
  chose, so S6 (balance) can measure each weapon alone.
- **The save is version 4**: a v3 save owns and carries the Gun.
- **The second weapon is the Harpoon**: slow, long and heavy, through what it
  hits — the draft's railgun — and it requires a point of Strength (D98
  (attributes, micro-tasks and what gear requires)).
- **The third is the Knife**: melee tried as data, as D83 (the weapon record)
  has it — a very short, wide shot that passes through everything in its arc.
  Whether it reads as melee is Igor's call.

**Guarded by**: `tests/meta.test.js` — the Gun owned and carried from the
start; owning for gems and carrying at once, carrying an owned one for free;
the carried weapon's tier raised from its row, and a dive carrying its numbers
alone; a missing weapon falling back to the first; a scenario's weapon; the
weapon kept with a saved dive; a v3 save migrated; the Harpoon's row waiting
for Strength, and its shot through two fish into a third; the Knife's one
swing cutting a cluster and reaching no further.

## D98 — Attributes, micro-tasks and what gear requires · 2026-10-13
D93 (the content stage's counts) asks for three attributes and three
micro-tasks in total, and D36 (attributes) adopted gear that requires an
attribute threshold, to land with S5 (content)'s gear. Which ones, and how a
requirement reads, is **Claude's call, delegated** (Igor: "start S5, dont
interrupt unless there are major contradictions with the plan"), open to Igor
to reopen.

**Decided, by Claude.**
- **The attributes**: `Dash reach` (kept), **Heart** — one more heart, full —
  and **Strength** — the dash hurts what it shoves, +1 `dashDamage` a point.
  Body stats, as D36 (attributes) has them: health and the dash; permanent
  dash improvements are attributes (D74 (dash improvements are attributes)).
- **`requires` is `{ attribute: points }`** on any piece of gear, met by the
  points spent on each. Unmet, the piece cannot be owned or bought, its row is
  dim and says what it needs, and nothing is taken.
- **The micro-tasks**: `untouched` (kept), **swift** — clear a batch within
  `SWIFT_TIME` seconds of its arrival — and **footwork** — beat a mini-boss
  without dashing, D36 (attributes)'s own example. Mastery, never a quota; each
  pays a point once per layer, ever. `met()` is handed the plan entry cleared,
  and footwork knows a mini-boss's batch by its fish, so a restored dive's copy
  of the plan still matches.

**Settles** `foundations.md`'s open "which attributes exist and what each
micro-task is", S5 (content)'s by its own words, in the same step.

**Guarded by**: `tests/meta.test.js` — Heart and Strength reach the diver;
nothing that requires more points than are spent is owned or bought, and no
gems are taken until it is met; swift paid inside its time and not after;
footwork paid for a mini-boss beaten without a dash, not with one and not for
another batch; the batch's clock and dash kept with a saved dive. Three older
checks of `untouched` put their batch past swift's time, so they still read
`untouched` alone.

## D99 — Weapon mods, and more boosts · 2026-10-13
D93 (the content stage's counts) asks for 5–7 mods in total and 3–5 new
boosts beside `Rush`; D83 (the weapon record) reserved weapon mods — ordinary
mods with `scope: 'weapon'` and the `weapons` they fit — for when the weapons
exist. Which, and how one is dealt, is **Claude's call, delegated** (Igor:
"start S5, dont interrupt unless there are major contradictions with the
plan"), open to Igor to reopen.

**Decided, by Claude.**
- **The seventh mod is the first weapon mod, Barbs**: the Harpoon's shot goes
  through one more fish a pick, three at most. Six mods stand as they were.
- **A weapon mod is dealt only while a weapon it fits is carried**, by a fish
  and on a layer end's card alike — `fits()`, read by both draws. Carrying the
  Gun or the Knife, Barbs never comes.
- **Three boosts join `Rush`**, each a different kind on the weapon's own
  numbers, so they serve every weapon: **Frenzy** — fire much faster —
  **Lance** — your shots go through — and **Bloom** — your shots swell. The
  readout gains the shot's size, since every stat a mod or a boost moves is
  shown.

**Guarded by**: `tests/drops.test.js` — carrying the Gun, no fish carries
Barbs and no card offers it; carrying the Harpoon it is dealt up to its cap.
`checks.js` — every mod is body, comfort, or a weapon mod naming real
weapons, and every stat a mod or a boost moves is on the readout.
`tests/drops.test.js` — every boost on with a touch and off after its time.
`tests/docs.test.js` — a weapon mod's numbers counted on its weapon.

## D100 — Equipment: the Mask, the Suit and the Weights · 2026-10-13
S5 (content) asks for two or three pieces of equipment, three or four tiers
each, and D36 (attributes) gives gear the combat stats — weapons, damage,
defence — and attributes the body ones. Which pieces, and what defence is,
is **Claude's call, delegated** (Igor: "start S5, dont interrupt unless there
are major contradictions with the plan"), open to Igor to reopen.

**Decided, by Claude.**
- **Three pieces, three tiers each**: the **Mask** (range), the **Weights**
  (damage) and the **Suit** (defence). Worn whatever weapon is carried.
- **Defence is a guard**: the suit takes the first hit of every batch, one
  more a tier — `player.guard`, and `guardLeft` refilled to it as each batch
  arrives. A guarded hit costs no heart but gives the i-frames and counts as a
  hit for `untouched`; bites, shots and bursts are guarded alike, inside
  `hurtPlayer()`. A gold ring shows a guard left. Hearts stay body —
  attributes' and mods' — so defence is a different thing from health.

**Guarded by**: `tests/meta.test.js` — each piece's tiers on the diver; the
suit taking a batch's first hit without a heart, with the i-frames and the hit
marked; a shot guarded like a bite and spent; the guard refilled on arrival
and kept with a saved dive. `tests/docs.test.js` — `entities/equipment.md`
rebuilt from the table.

## D101 — Three layers, each with pools of its own · 2026-10-13
S5 (content) asks for 3–5 layers, each with its own pools of batches (D71
(batches are drawn from pools, never a fixed list)); the second layer was the
first's stretches under another name. How many, and what they hold, is
**Claude's call, delegated** (Igor: "start S5, dont interrupt unless there are
major contradictions with the plan"), open to Igor to reopen.

**Decided, by Claude.**
- **Three layers**, the count's floor: each keeps the one shape — four from a
  pool, a mini-boss, four, a mini-boss, four, the boss — around three pools of
  its own, so no batch is shared between layers.
- **They meet the fish in turn**: the archer in the first layer's last
  stretch, the puffer from the second, the eel in the third, every type mixed
  by its end. The first layer's first two stretches are as they were.
- **Sized by total hp**, growing down the dive, until S6 (balance)'s threat
  number (D79 (a dive goes from easiest to hardest)). The same mini-boss and
  boss end every layer; a boss per layer is not decided.
- **Layer 3's water is a deep teal**, and a `layer-3` scenario starts its top
  with the kit a dive would carry there.

**Guarded by**: `tests/meta.test.js` — no pool or batch shared between
layers, every enemy type met in one; the `layer-3` scenario; the counts S5
(content) asks for, held from here on (D93 (the content stage's counts)).

## D102 — The debug mode · 2026-10-14
Igor, after playing S5 (content): "i need a debug mode better than url params.
like: launch with a single debug param, then a game in debug mode opens. thru
the ui, i can choose layer, number of enemies, types etc. (pretty much
everything that's in url params now + whatever you may come up with). the
point is to quickly choose a configuration where i can playtest components
isolated or combined, and create issues that concern only a certain aspect of
the game." Claude's default — a setup screen for the place, the fish and the
diver's kit, played with sound, the save never touched, a key to restart and
one to return, the setup as a short code for an issue — he took as offered:
"do the debug mode".

**Decided, by Igor**, as offered:
- **`?debug` opens a setup screen in place of the title**: layer and gate,
  which fish and how many; the weapon and its tier, the equipment, the
  attributes and the mods; immortal, one-shot damage and the seed. Dive plays
  it.
- **The save is never read or written**: `main.js` loads none for it, and
  every save — the platform's on a hidden tab or a closed page included — goes
  through `saveNow()`, which writes nothing in the debug mode.
- **It starts muted**, and M turns the sound on — Igor, once it was built:
  "silence debug by default". The mute moved into `game/` state beside the
  volume, so the debug mode can set it.
- **The URL flags `&immortal` and `&damage` are gone** — Igor: "yes, remove
  redundant". He was their only user, and the setup's rows now do their job;
  the tests and the bot set immortality and the damage override directly.
- **A value comes round at either end** — Igor: "arrow in debug setup must
  rotate around all values (0, press left, gets max - and vice versa)". Claude's
  reading of Shift's five: they stop at the end, and the next step comes round.
- **One key plays the same setup again, from any screen, and one goes back to
  the setup screen.**
- **The setup is a short code**, `?debug=<code>`, so an issue that carries it
  replays exactly, seed and all.

**Claude's picks inside it**, open to Igor:
- The keys: **R** again, **Backspace** back. Neither does anything outside the
  debug mode.
- The code: tokens of a name and a number, comma-separated — `L2,G7,S4471,
  Harpoon2,puffer4,Dash_reach1,immortal` — the layer, gate, seed and weapon
  always, the rest only when set. A token it cannot name is shown as ignored,
  never guessed at, and every number is held in range. The address bar
  follows the setup as it changes, so the URL is the code.
- The screen: four columns — where, fish, diver, mods — built from the
  tables, so a new fish, mod or piece of gear joins it with nothing to write.
  The arrows move a value, Shift by five, and a click either side of it; a
  line under the columns says what the chosen gate drew, and what replaces it.
- **Every row has a tip**, on the line under that: what the marked row is and
  what it moves. Igor, after Barbs sat dim with no reason given: "would it be
  easy to add tooltips for each entity in debug? i havent learned what impacts
  what just yet". A tip is worked out from the records — a fish's behaviour
  and numbers, what each tier, point or pick moves, as the mod cards' numbers
  are (D52 (the development readout)), what needs an attribute, which weapon a
  weapon mod goes with — so it cannot state a number the game does not
  deliver. The one hand-written part is a line per behaviour,
  `DEBUG_BEHAVIOURS`, which a new behaviour must add; `npm test` says so.
- The fish set replace the chosen gate's batch alone; the dive then runs on
  as drawn. A weapon mod goes in only with a weapon it fits (D99 (weapon mods,
  and more boosts)), as a fish would carry it.
- Out of a debug dive, every way leads back to the setup: the pause menu's
  quit, and the end screens' two buttons, read Again and Setup.
- Up to 50 of one fish and 9 points on one attribute; the rest are the game's
  own caps.

**Guarded by**: `tests/debug.test.js` — a fresh kit whatever the save held,
nothing written on pause, at a dive's end or when the platform asks, and
`main.js` saving only through `saveNow()`; muted from the start, and only in
the debug mode; a tip on every row, its numbers worked out from the game, a
dim weapon mod saying why, a line for every behaviour; the kit, the place and the fish
reaching the dive as set, the pool untouched; a weapon mod that does not fit
left out; the flags switched by the setup; the code round-tripping, ignoring
what it cannot name and holding every value in range; R replaying the same
dive and doing nothing outside the debug mode; every way out leading to the
setup; the rows built from the tables, and moved by keys and clicks.
`checks.js` — the setup's grid ends above the hint.

## D103 — New game erases the save, after a warning · 2026-10-14
Igor: "add the ability to clear cache and start a new game with a warning -
this applies to main game screen". D90 (Continue goes straight back in) had
left a New game beside Continue to S7 (alpha polish), as a way to abandon a
saved dive; this brings it forward as a fresh start.

**Decided, by Igor.** The title offers a new game, which clears the save and
starts over, and warns before it does.

**Claude's picks**, open to Igor:
- **New game is the title's last row**, always there, away from where the
  cursor starts.
- **Its screen says what goes** — gems, gear, attributes, micro-tasks and
  depth, and the dive in progress if there is one — in red, and offers Cancel,
  marked, and Erase everything and start. Esc and a stray Enter cancel.
- **Confirming writes a fresh save**, which is what clearing it means here:
  the platform keeps one save, so the seam needs no new name. `home` follows,
  as on a first launch.
- A save once refused and kept aside stays aside: the one copy the game
  promises never to lose.

**Guarded by**: `tests/meta.test.js` — New game the title's last row, asking
first with Cancel marked; Enter and Esc erasing nothing, the save on disk
unchanged; confirming leaving a fresh meta, no dive, `home`, the title back to
Start, and a save that loads fresh. `checks.js` — its rows above the hint.

## D104 — Bodies doubled · 2026-10-14
Igor, playing S5 (content): "the sizes of all entities are small. when we go
to graphics, direct transition would be impossible (small fishes, small guy,
you get it)". Settled before S6 (balance), so it tunes numbers at the sizes
they keep (`ideas.md` → Sprites and real art). Igor, asked how: "just go on".

**Decided, by Claude**, open to Igor's feel:
- **The bodies grow, the field does not.** The diver's and every fish's radius
  doubles — the drawn circle is still the hitbox. The view stays 1280×800, and
  speeds, ranges, the dash's reach past a body, the lunge, the archer's band,
  the puffer's trigger and blast stay as they were. Scaling those too would
  only zoom in: a smaller field, fish arriving sooner, a different game.
- **×2** is Claude's pick, chosen by eye from screenshots: the diver 40px
  across, a drifter 36, the boss 168.
- **Shots, a fish's spit, gems and pickups keep their size**: they are not the
  fish or the diver Igor named.
- **A fish arrives past the edge by its whole body** on every side, as the
  boss already did, so a big one never pops in half-visible.
- A dive saved before this keeps the old sizes until it ends: a restored dive
  is the dive as it was.

**Guarded by**: `tests/enemies.test.js` — every fish arrives wholly outside the
view. The radii themselves are held by `tests/docs.test.js` against
`entities/enemies.md` and `design.md`'s diver.

## D105 — The Knife swings · 2026-10-14
Igor, playing S5 (content): "melee feels like a short range. maybe make it an
arc, like a swing". D83 (the weapon record) had tried melee as data first — a
very short, wide shot — and said a weapon gets a behaviour of its own once its
numbers cannot say it. Igor, offered the swing: "do the Knife as a swing".

**Decided, by Igor.** The Knife swings: no shot; each pull cuts an arc toward
the cursor and hits what is in it at once.

**Claude's picks**, open to Igor:
- **`swing` is a field whose presence is the behaviour**, as with the
  enemies: `{ arc, time }` — the arc's width in degrees, and how long it is
  drawn. 120° and 0.15s.
- **The Knife's other numbers keep a meaning**, so every boost still does
  something on it: `range` is the blade's reach from the diver's centre and
  `shotRadius` its width — a fish counts if its body reaches into the sweep, as
  far as a shot that size would touch — so Bloom lengthens the blade; `pierce`
  caps a swing at `pierce` + 1 fish, nearest first, so Lance cuts more. Its
  `shotSpeed` is gone: nothing flies.
- **`range` 56**, from 46: with D104 (bodies doubled) the blade reaches as far
  past the diver's body as the old shot did past the old one.
- The wedge is drawn, fading; no sound of its own — the shot's, until S7
  (alpha polish).

**Guarded by**: `tests/meta.test.js` — no shot, every fish in the arc cut at
once and none behind; a body reaching into the blade's edge cut, one past it
not; pierce + 1 at most, nearest first; another swing only after the cooldown.
`tests/docs.test.js` — the `swing` table against `entities/weapons.md`.

## D106 — The puffer bursts and comes on again · 2026-10-14
Igor, playing S5 (content): "the exploding enemy is really easy to avoid and
it kills itself". Swelling for 1.2s it was easy to step away from, and the
burst removed it, so a batch of puffers cleared itself if waited out. Asked
what makes it a threat: "chases, stops for a brief moment, explodes quickly,
continues chasing. go".

**Decided, by Igor.** The puffer chases, stops briefly, bursts quickly, and
chases on: it outlives its burst. This supersedes the part of D95 (three enemy
behaviours, and one way to be hurt) where the puffer dies in its burst, and
with it "a glowing puffer that bursts takes its batch's mod with it". The rest
of D95 stands: the tell, the trigger only wholly in the view, the shove, a
burst through `hurtPlayer()`, and a burst paying nothing.

**Claude's picks**, open to Igor:
- **The stop is 0.5s**, from 1.2s: the brief moment, and the game's quickest
  tell — the boss winds up for 1.0s. Out of the ring from inside the trigger
  takes the diver about 0.15s at the starting speed, which leaves a human's
  reaction time and little more.
- **It chases at least 1.5s before it can light** — after it arrives and after
  every burst — a new `chase` field, the lunge's word for the same rule. Without
  it a diver inside the trigger takes a burst every half second.
- `trigger` and `blast` stay as they were (D104 (bodies doubled)).

**Found on the way**: a fish cut down by the Knife's swing (D105 (the Knife
swings)) was still stepped that tick — the swing kills before the fish move —
so a puffer cut on the tick its fuse ran out burst after its death. A dead fish
now takes no step: the guard sits at the top of the enemy loop, not after the
step.

**Guarded by**: `tests/enemies.test.js` — bursting on time, inside the ring
and not outside, and living on; swimming on after a burst and lighting again
only after its chase; dying like any fish when shot; never bursting when cut
down on the tick its fuse runs out; a dash that kills it as it bursts counting
one kill; a burst paying nothing and the glowing puffer keeping its mod.

## D107 — The diver swims and faces; fish with a ramp · 2026-10-14
Igor, after playing S5 (content): "we need to have acceleration in movements.
right now there is none for player and enemies. player must definitely have it,
fishes - at least some do need it. by acceleration i mean starting movement and
reaching the full speed after a duration. reversing direction needs a slight
amount of time. like natural in-water movement. as a bonus, this solves #15,
the dash goes where you move, but becomes more than 8 discrete directions" —
#15 being the open question of whether the dash should go where you aim. On a
dash from a standstill: "a player wont be a circle. it's a person having a
facing direction. it's rotation takes a little bit of time too (this relates
to acceleration as well). so that's you answer for dashing from a stop." The
design and its check against `foundations.md`:
`specs/2026-10-14-movement-and-bites-design.md`.

**Decided, by Igor.**
- The diver accelerates: full speed after a moment, a reversal takes a little
  time, as in water. Some fish too.
- The diver has a facing, and turning it takes a little time; a dash from a
  standstill goes along it.
- The dash goes where you move, at any angle: D20 (mouse aim and an offensive
  dash)'s movement over aim stands, no longer held to eight directions. The
  open question in `ideas.md` closes.

**Claude's picks**, open to Igor:
- **Water**: a velocity eased toward the one wanted, `RAMP_LEFT` — 5% — of a
  change still to go after `ramp` seconds, over `dt` with `Math.pow`. It is
  drag: a release glides, and a reversal swings through zero in under a
  quarter of `ramp`. The diver's `ramp` is 0.25s, and a raised speed is reached
  in the same time.
- **The facing** turns at 0.2s a half circle, the shorter way, and holds when
  no key is; a dive starts facing down, into the abyss.
- **The dash goes along the facing**, always: swimming steadily it is where you
  swim, and mid-turn it is where the body points rather than where the drift
  still carries. It fires from a standstill.
- **A dash ends with the swim carrying on along it** at full swim speed; its
  own reach is unchanged (D56 (the dash is a fixed, committed lunge)).
- **A view edge stops the velocity going into it.** No edge pushes the diver:
  the current carries it with the view.
- **Fish ramps**: the drifter 0.6s, the darter 0.9s, the bulwark 1.2s — the
  plain chasers, each its own weight. The archer, the puffer, the eel and the
  lungers move their own way, without one.
- **Drawn**: a mark from the diver's middle to its rim, where it faces.
- **The save goes to version 5**: a v4 dive loads its diver and fish at rest,
  the diver facing down.

**Supersedes** the dash along the keys held, and its refusal with none held.

**Guarded by**: `tests/movement.test.js` — moving on the first tick of a key
but at full speed only after the ramp; a glide, and a reversal that swings
through; the same swim at any tick length; a raised speed reached in the same
ramp; no speed banked against an edge; the facing turning the shorter way and
holding; a dash along the facing from a standstill, the swim carrying on after
it; a fish with a ramp overshooting a sidestep, one without turning at once; a
v4 save loading at rest, facing down. `checks.js` — the dash's checks face the
diver before they dash.

## D108 — Fish bite · 2026-10-14
Igor, after playing S5 (content): "generally, the fish needs to bite. some
might still damage on touch, but mostly - swim to you, swift bite animation,
then damage. would feel way more natural. doesnt concern enemies with complex
attacks that wouldnt kill on touch." Asked whether those stop hurting on touch
too, and on the rest: "go with your suggestion. for now, you design the enemies
anyway. remember the solid rule of diversity for all entities and make your
call here." The design and its check against `foundations.md`:
`specs/2026-10-14-movement-and-bites-design.md`.

**Decided, by Igor.**
- Most fish bite: they swim up, wind up where you can see it, and the damage
  follows. Some keep damage on touch.
- A fish with an attack of its own — the archer's spit, the puffer's burst, the
  lunge — hurts only by that attack: Claude's suggestion, taken.

**Claude's call, delegated** — the roster diverse in kind, each fish asking a
different answer:
- **The drifter bites**: reach 10px, a 0.3s wind-up, 0.8s before the next —
  back off when its jaws open.
- **The darter nips**: reach 6px, 0.15s, 0.6s, at a speed its ramp turns
  slowly — step out of its line, and it slides past.
- **The bulwark chomps**: reach 40px, 0.6s, 1.2s, heavy to start and to turn —
  stay out of its reach, or circle it.
- **The eel shocks**: `touch: true`, the one fish that hurts on contact, and it
  never bites — never touch it.
- **A bite**: `bite: { reach, windup, rest }`, its presence the behaviour. It
  chases until its body is within `reach` of the diver's, stops — easing to a
  halt, so a heavy fish slides — and holds its jaws open for `windup` seconds,
  drawn as a dark wedge toward the diver. They snap shut on a heart only if the
  diver is still within `reach`; then `rest` seconds of chasing. Through
  `hurtPlayer()` like every hurt, so the guard, invulnerability and
  `untouched` treat it as they treat any hurt (D95 (three enemy behaviours, and
  one way to be hurt)).
- **The lunge's charge hurts on contact**; a lunger winding up or resting is
  harmless to touch.
- **The save goes to version 6**: a fish keeps the behaviour it was made with,
  so a restored dive's fish get their type's again, and fish saved before bites
  bite.
- No sound of its own for a bite: the hurt's, until S7 (alpha polish).

**Supersedes** every fish hurting on touch, the prototype's rule; D95 (three
enemy behaviours, and one way to be hurt)'s one way stands.

**Found on the way.** The window-size check of D29 (vertical scrolling dive with
a camera — difficulty invariant to window size) aimed at the first fish through
whole client pixels, so each window size aimed a different fraction of a pixel
off. While fish sat on the diver that was harmless; once they hover around it,
one grazing shot sent the dive another way — 861 / 839 / 861s, past its 2%.
It now aims on a 20 view-px grid that all three scales put on whole pixels, and
requires the three dives to be identical; without the input's `/ scale` it
still fails. And version 5 never got its fixture: `save-v5.json` is now written
by the version 5 build, beside `save-v6.json`.

**Guarded by**: `tests/enemies.test.js` — chasing into reach, then stopping
with the jaws open; a heart off a diver still in reach, nothing off one that
got away; the rest before the next bite; no bite once dead, nor through
invulnerability; a shoved biter biting from where it ends up; touch hurting
only for the eel, and a lunger only as it charges. `tests/meta.test.js` — a v4
dive's fish given their type's bite and ramp; the v5 and v6 fixtures loading
and playing on. `checks.js` — the window-size check exact; its hand-built fish
hurt on touch.

## D109 — Micro-tasks are ladders; steps cost more as they rise · 2026-10-15
Igor, after playing S5 (content): "micro-tasks are absolutely unclear now …
how do i earn more?". Discussed 2026-10-15 with how attributes grow; he took
Claude's lean — "i like your lean, do that" — then left the rest to Claude:
"calculate it for the best balance. go your way, invent more microtasks,
ladders, make it clear and earnable, implement". The design, its sizing and its
check against `foundations.md`: `specs/2026-10-15-micro-task-ladders-design.md`.

**Decided, by Igor.**
- Points stay what micro-tasks pay, and only they pay them (D36 (attributes)).
  No new currency, and gems buy no points.
- The tasks stay: "micro tasks are not going away".
- A task is visible before it pays, deliberate, and a ladder — easy at the
  start, harder up it — each rung a streak or one dive's feat, never a running
  total; a badge beside the point.
- Any layer can earn any rung ("go your way", over one rung a layer).
- Mastery, not quotas, still holds; "just so that there is not TOO MUCH grind
  for the sake of one damn point".

**Claude's call, delegated**, open to Igor:
- **Five tasks, five skills**: `untouched` (batches in a row without a hit —
  the guard's too) 1, 3, 6, 10; `footwork` (batches in a row without dashing)
  3, 6, 10, 15; `beeline` (batches in a row whose glowing fish dies first — a
  batch with none skipped, a fish killed on the same tick counted together)
  1, 3, 5, 8; `flurry` (fish within `FLURRY_TIME`, 2 seconds) 6, 12, 20, 30;
  `swift` (a layer from its first batch to its boss) within 8, 6, 5 and 4
  minutes. A streak lives for the dive; a broken one starts again on the next
  batch.
- **Sized by the dive's shape**: a streak's rung marks the per-batch rate at
  which it is expected within a dive — 32%, 62%, 79% clean for `untouched`'s 3,
  6, 10; `swift` walks the pillar's 4–8 minutes; `flurry` follows what a kit
  can do in two seconds. The bot measured as a floor (D50 (the bot measures its
  own policy)).
- **Rung k pays k points; step n of an attribute costs n.** A ladder pays 10,
  all five 50 — nine steps of one attribute, the ceiling one attribute had
  before. A requirement counts steps.
- **Shown** under the Attributes screen's rows and the pause menu's, a badge
  per rung earned and the next rung's ask and pay; live on the status bar; a
  rung paid on the notice line, tasks paying on one tick sharing it. `home`'s
  layer list loses its task marks. The help gains a line.
- **The save goes to version 7**: `tasks` by name, rungs earned; `spent`
  becomes `raised`, steps; a v6 task becomes as many rungs as the layers it
  paid in, and every v6 step comes back as points. The batch's clock, which
  only the old `swift` read, is gone.

**Supersedes** D36 (attributes)'s cap per layer — the cap at the source stays,
held by the ladders' rungs — and D98 (attributes, micro-tasks and what gear
requires)'s three tasks, a point each once per layer, `swift` within
`SWIFT_TIME`, and a step a point; D93 (the content stage's counts)'s three
micro-tasks become five. The glossary's `point`, `attribute` and `micro-task`
change with it, and `rung` and `step` join it.

**Found on the way**: the help screen's last line could sit on its hint while
the layout check passed — ten pixels between baselines is less than a line's
height. The check now asks for a line's height, and the key list starts higher.

**Guarded by**: `tests/meta.test.js` — a clean streak paying each rung once,
ever, broken by a hit and by the guard's; a dash breaking `footwork`; the
glowing fish first, or on the same tick, and a batch without one skipped;
kills dropping out of the two seconds, on the bar and in the save, and several
rungs at once; tasks sharing the notice; a layer timed to its boss, and none
begun partway; a fish placed by hand counting for nothing; step n priced at n;
the task lines; every count kept with a saved dive; a v6 save's tasks as rungs
and its steps as points, the Harpoon still carried; the v7 fixture. `checks.js`
— the task lines above the hint, every line and notice inside the view, the
help a line's height above its hint.

## D110 — Micro-tasks are challenges, with a doc of their own · 2026-10-15
Igor, after D109 (micro-tasks are ladders; steps cost more as they rise): "lets
make an md for micro tasks and points, similar to other entities. but lets
rename micro tasks to challenges or suggest something."

**Decided, by Igor.** A doc for them and the points, laid out as the entity
docs are (D81 (entity docs, one per kind)), and a new name.

**Claude's call**, open to Igor:
- **The name is his: challenges.** The word a player reads without help, and
  the one games use for exactly this. The glossary's `micro-task` becomes
  `challenge`; the old names, "micro-task" and "task", are retired as "level"
  was (D32 (the glossary)).
- **Renamed everywhere it is live**: the code — `CHALLENGES`, `challengeLines()`
  and the rest — the save's key, `challenges`, and every word on screen. The
  save stays at version 7: D109 (micro-tasks are ladders; steps cost more as
  they rise)'s version had not shipped, so it takes the new key from the start,
  and a v6 save's `tasks` migrate straight to it.
- **One doc, `entities/challenges.md`**, holding the challenges, the points they
  pay and the attributes the points buy — the attributes move out of
  `design.md`, so their numbers have one home, and a `Points` section holds the
  rule both sides share. `design.md` keeps how each is judged.

**Guarded by**: `tests/docs.test.js` — the doc's tables rebuilt from
`CHALLENGES` and `ATTRIBUTES`, every field and item documented, and the old
name absent from every living doc and from the code, citations, quotes and
code spans aside. `tests/meta.test.js` — no screen, line or notice the player
reads says "task".

## D111 — The dash a third shorter · 2026-10-15
Igor, playing: "basic dash is too long. reduce by about 30%."

**Decided, by Igor**: the starting dash about 30% shorter.

**Claude's picks**, open to Igor:
- **`dashSpeed` 884 to 620** — 141px of dash to 99. The dash's time stays 0.16s,
  so its invulnerability and its feel of a committed lunge stay as D56 (the
  dash is a fixed, committed lunge) made them; it travels slower instead.
- **Dash reach's step stays +150px/s**, so a step now adds a quarter of the
  dash rather than a sixth: 99, 123, 147px — two steps are about the old dash.

**Supersedes** D56 (the dash is a fixed, committed lunge)'s 884px/s and 141px,
and D75 (the gun's tiers, dash reach, a clean batch)'s 141, 165 and 189px.

**Found on the way**: three of `checks.js`'s dash checks had the old length
written in — a fish placed at 171px, and two floors of 100px — and failed on
the shorter dash. They read the length off the diver now, so S6 (balance) can
retune it.

**Guarded by**: `tests/docs.test.js` — `design.md`'s starting diver at its real
numbers. The dash's checks read its length off the diver, so they hold at any
length.

## D112 — Bugs get a page of their own · 2026-10-15
Igor: "i also think that a page for bugs is needed, so that you could record it
there as i notice em - not the ideas, but real issues. move some existing
there. or is it premature?"

**Decided, by Igor**: `bugs.md`, for real issues seen in play.

**Claude's call**, open to Igor:
- **Not premature**: playing is now where problems come from, and the debug
  mode already makes an issue carry its own replay (D102 (the debug mode)). His
  note the same day, "iframes wording is confusing", is the first entry.
- **A living doc**: an issue stays until the change that fixes it, which puts
  the fix and the check that now holds it in `changelog.md`. Each says what
  happens, what should, how to see it — a `?debug=` URL where one helps — and,
  once found, why.
- **Nothing moved there**: every note recorded so far is a design question, a
  balance number or the graphics, each working as built. They stay in
  `ideas.md`. `roadmap.md` → Health cites the page instead of saying "no known
  bugs".

**Guarded by**: `tests/docs.test.js` — the docs map names `bugs.md`, and every
doc `CLAUDE.md` names exists.

## D113 — Settings are kept with the save · 2026-10-15
Igor, playing: "possibly bug: save muted state". Not a bug by the docs: keeping
the settings was parked in `ideas.md` since 2026-09-12 — "Volume and screen
shake currently reset on every reload", Igor: "no local storage yet" — an
agreed direction, deliberately not then. Its reason went with D77 (the save):
there has been a save in local storage since. His note is the "now".

**Decided, by Igor**: the settings survive a reload.

**Claude's call**, open to Igor:
- **All four**: the sound off or on, the volume, the screen shake and the FPS
  counter — the parked item's whole direction, not the mute alone.
- **Beside what persists, not in it**, so New game, which erases the progress,
  keeps them. The save stays at version 7, still unshipped; a save without
  them loads with the defaults.
- **A setting the save cannot read keeps its default**, and the save still
  loads: a preference is not worth refusing the progress beside it.
- **Written as M is pressed and as the Options screen is left**, as well as at
  every save already — and never in the debug mode, which still starts muted.
- **M's key moves into `game/`** (`MUTE`): D102 (the debug mode) moved the
  mute's state there, but its key stayed in `platform/audio.js`, against
  `CLAUDE.md`'s rule that key bindings are content. `game/` now reads it on
  every screen and decides to save, as D77 (the save) has it decide.

**Guarded by**: `tests/meta.test.js` — all four kept across a reload; M on the
title and in play, written at once; an option written as Options is left; New
game keeping them; an unreadable setting read as its default with the save
still loading; the v7 fixture loading its settings.

## D114 — Weapons and equipment on screens of their own · 2026-10-15
Igor, 2026-10-15: "we need to split weapons and gear. confusing to see in one
place" — recorded as a proposal, then taken when offered as the next step:
"Weapons/Equipment split". It supersedes D96 (gear and attributes on screens of
their own)'s one Gear screen; the rest of D96 stands.

**Decided, by Igor**: the weapons and the equipment are on screens of their
own. Both are gear in the glossary, so the screens are Weapons and Equipment.

**Claude's call**, open to Igor:
- **`home` holds Dive, Weapons, Equipment, Attributes, Help and Options**, in
  that order: what you fight with, what you wear, what you are.
- **Each screen holds only its own rows**, with the gems to spend, and ends on
  a Back row; Esc goes `home`. A weapon's row does what D97 (weapons are owned,
  and one is carried) says, unchanged.

Still open, in `ideas.md`: whether `home` shows the character, which may
replace all three screens.

**Guarded by**: `tests/meta.test.js` — `home`'s rows; Weapons, Equipment and
Attributes opened and left by Esc and by Back, each holding only its own.
`checks.js` — every screen whose Back leads `home` draws as its menu; every
menu's rows end above the hint.

## D115 — Batches arrive in waves · 2026-10-17
Igor, 2026-10-15, playtesting: "we need to start working on waves. for me the
game feels to easy and predictable, i dont feel overwhelmed at any point ...
we gotta push the player to clear the enemies fast, because new ones are
constantly coming ... but - waves must be hard to guess, so distribute the
enemy spawn into a period of time." On 2026-10-17, offered waves before the
boss and the mini-boss made different, since a boss's escorts would arrive the
same way: "go ahead".

**Decided, by Igor**: a batch's fish arrive spread over time, on a clock that
does not wait for the arena to empty, so a slow clear meets the next arrivals
still fighting. The glossary's **wave** row changes with it: one batch was one
wave by default; now a batch arrives in several, and the telegraph it asked of
any multi-wave batch is kept.

**It keeps D27 (batches are hard-gated)**: a batch is still a bounded queue
that gates the descent — the camera holds until its last wave is dead, and
nothing of the next batch arrives before. What D27 retired was arrivals
without end, growing faster than the player could; a batch's waves end with
its count.

**Claude's calls**, open to Igor:
- **The shape.** A batch's fish are shuffled and dealt into waves of
  `WAVE_MIN`–`WAVE_MAX`. The first wave arrives whole as the camera reaches the
  gate, as a batch did. Each later one starts `WAVE_GAP` after the one before,
  give or take `WAVE_JITTER` of it, and its fish trickle in, each at its own
  moment within `WAVE_SPREAD`, at random edges. When, how many, which and where
  are all drawn from the seed.
- **An empty arena calls the next fish at once**, and moves the rest of the
  schedule up with it. A fast clear is never left waiting in empty water, so
  it pays in pace (the pillar "easy layers stay relevant"); a slow one meets
  the clock.
- **The numbers**: 5–10 fish a wave, 4s ± 40% between waves, 2s of trickle.
- **The telegraph** is the status bar: `17 fish left (12 coming)` counts the
  fish still to come, so an arena that empties and fills again reads as a
  wave, not a broken gate.
- **The glowing fish is in the first wave** — `light()` picks among the fish
  present as the batch arrives — so it still glows from the moment the batch
  does, and `beeline` asks what it asked.
- **A boost may drop from the kill that empties the arena between waves.**
  The rule it narrows (D86 (boosts)) kept boosts off the arena's last kill
  because the current would carry you past it; between waves the fight goes
  on, so the reason no longer holds. The batch's last kill still drops none.
- A batch of one fish — a mini-boss's, the boss's — is one wave, as before.

**Measured, and against the aim**: with today's batch sizes, waves put fewer
fish on screen at once than a batch arriving whole did, and the kiting bot
lasts longer for it (`roadmap.md` → Health). Overwhelm now comes from how fast
the waves come against how fast you clear, which batch sizes and the clock
set — S6 (balance)'s numbers, or Igor's, from playing it.

**Save**: version 8 holds the fish still to come; a v7 dive has none.

**Guarded by**: `tests/descent.test.js` → waves — the first wave whole and
every fish once; each later fish at its own moment, whether or not the first
wave is dead; a wave's fish on ticks of their own; an empty arena calling the
next at once, the rest moved up; the gate held and nothing paid between waves,
the clear once on the last wave's last fish; the waves held under pause — and
the descent's camera held while a batch lives, waves to come included.
`tests/drops.test.js` — a boost from the kill that empties the arena between
waves, never from the batch's last. `tests/dive.test.js` — the status bar
counting the fish to come, between waves too. `tests/save.test.js` — the v8
fixture playing on and its next fish arriving; the v7 fixture loading with
none to come.

## D116 — Bosses bring escorts; the boss's come until it dies · 2026-10-18
Igor, 2026-10-17: "boss & mini-boss fights should include incoming enemies
according to the balance for current batch. boss fight may change a bit to
endless enemies incoming until the big guy is defeated - keeping the player
fit." Claude offered a shape, and one question: for the boss, a crowd that
refills to a set size as you kill, or fish that keep arriving on a timer
whatever you do. Igor, 2026-10-18: "on boss question go your way".

**Decided, by Igor**: the boss and the mini-boss fight with other fish beside
them. **Delegated to Claude, and open to Igor to reopen**: everything below.
"May change a bit to endless" was a lean; the choice between its two readings
was handed over.

- **The boss's escorts are a crowd that refills.** While the boss lives they
  are topped back up to `BOSS_CROWD`, each newcomer due within `WAVE_SPREAD`
  of the gap opening, drawn at random from one batch the plan draws from the
  layer's last ordinary pool. The boss still arrives alone from below; its
  crowd follows from the edges. Chosen over the stream on a timer: a stream
  that adds whatever the player does is the prototype's death spiral, which
  D27 (batches are hard-gated) retired; a crowd keeps the pressure level.
- **The boss's death ends the fight.** Its escorts die with it on the same
  tick, and none still coming arrives; the layer end follows as it did for a
  boss alone. Mopping up after the boss would be an anticlimax.
- **The crowd pays no gems** — a fight that refills would otherwise be a farm
  to stall on — **but may drop boosts** (D86 (boosts)): a longer fight brings
  more help. The boss's kill, the batch's last, drops none, as any batch's
  last.
- **A mini-boss's escorts are one ordinary batch**, drawn from the pool of the
  stretch before it, dealt into waves behind it (D115 (batches arrive in
  waves)) and cleared like any batch: they pay gems, and the gate holds until
  every one is dead. The mini-boss arrives in the first wave whatever the
  draw. That alone makes the two fights different.
- **Escorts never glow**: a batch a boss or a mini-boss leads carries no mod,
  its escorts included (D88 (the fish glows from the start)).
- **"According to the balance for current batch"** waits for S6 (balance)'s
  threat number (D79 (easiest to hardest, balance's to say)). Until then the
  escorts come from the layer's own pools, at the pools' sizes.
- **The telegraph** — the **wave** row's binding concern, that a batch which
  refills must not read as a broken gate: the status bar says `escorts keep
  coming until the boss dies` in place of a count, which a crowd does not
  have, and so does the help.
- **The numbers**: a crowd of 6; a mini-boss's escorts a whole batch.

**What it amends.** D27 (batches are hard-gated): a batch is still a bounded
queue that gates the descent. The crowd is capped at its size and each
newcomer replaces a kill, so arrivals cannot outgrow the player — the
divergence D27 retired cannot occur — and it ends with the boss rather than
with a count. D62 (the boss is the layer's last batch) and D65 (a mini-boss is
a smaller boss): the boss is no longer alone in its batch, nor a mini-boss
"one tougher enemy in a batch of its own"; and D115 (batches arrive in
waves)'s "a batch of one fish — a mini-boss's, the boss's — is one wave" no
longer describes them. The glossary's **batch** row loses "of comparable
threat", which a boss and its escorts are not, as D62 foresaw; the **boss**
and **mini-boss** rows say what comes with them.

**Debug**: a debug dive's fish take a gate's whole place, escorts included,
and the setup's gate line names the escorts a gate drew (D102 (the debug
mode)).

**Save**: no new version. The marks live on the fish and on the fish to come,
which the save already holds; a dive saved before this has no escorts in its
plan and meets its bosses alone.

**Measured** (`roadmap.md` → Health): the crowd about doubles the immortal
bot's time to kill the boss, and the mortal bot dies sooner; escorts carry two
of five dives past the first mini-boss the bot could not kill alone.

**Guarded by**: `tests/boss.test.js` → escorts — the crowd topped up to its
size from its own mix and never past it; no gems from it, a boost possible;
every escort gone on the boss's death tick, none still coming, no boost, then
the layer end; the mini-boss first, its escorts dealt in behind, the gate held
until every one is dead, a count on the status bar; a save mid-crowd playing
on identically; a v8 dive's bosses alone; no crowd for a boss placed by hand;
the status bar's telegraph. → the layer — every boss and mini-boss escorted
from the pool before it, none of the batch glowing. `tests/debug.test.js` — a
debug gate's fish in place of a mini-boss's escorts; the gate line naming a
mini-boss's escorts and the boss's crowd.

## D117 — The boss's fan, in turn with its lunge · 2026-10-18
The pass before S6 (balance). Igor, 2026-10-14: "mini-boss and boss have one
kind of behavior. we need to make them different." Claude offered three ways:
the boss gains a second attack and the mini-boss stays the lunge alone; the
mini-boss gains an attack of its own and the boss keeps the lunge; or both,
each something different — leaning to the first, so the mini-bosses still
teach what the boss does. Igor, 2026-10-18: "your lean".

**Decided, by Igor**: the boss gains an attack; the mini-boss only lunges.
**Delegated to Claude, and open to Igor to reopen**: which attack, and its
shape.

- **The fan** — the spit parked since D64 (the boss lunges), the draft's
  "spitting out dangerous toxins" and "shooting an arc". The boss chases,
  stands and winds up as for a lunge, its line locked at where the diver was,
  but the tell lays down `count` lines spread across `arc` degrees around it.
  As the wind-up ends a slow shot flies along every line, and the boss rests —
  the opening, as after a charge. In one sentence: when it lays down many
  lines, slip between them.
- **In turn, the lunge first**: lunge, fan, lunge, fan. Fixed, not drawn from
  the seed, so the boss can be read; the lunge first, so the bottom opens on
  what the mini-bosses taught.
- **Its shots are the archer's** (D95 (three enemy behaviours, and one way to
  be hurt)): in `bullets[]`, through `hurtPlayer()`, never touching a fish.
- **The boss's death takes every enemy shot still flying.** D116 (bosses bring
  escorts) made its death the end of the fight; a shot landing after it would
  cost a heart the layer end has just healed. That held already for the
  archers in its crowd, whose shots outlived the boss until now. Asked whether
  those should keep flying, Igor: "all escort dies - motivates to defeat the
  boss faster".
- **A `fan` is a lunger's second attack**, read only beside a `lunge`: one
  step, `lungeStep()`, takes either. A fish that fans alone is `ideas.md` →
  Fish ideas, and would get its own step when it comes.
- **The numbers are Claude's picks**: seven shots across 90°, at 160 px/s —
  slower than the archer's 210 — of radius 9, for 600 px; a 0.8s wind-up, and
  the lunge's chase, reach and rest. 15° between shots leaves the diver room to
  slip through from about 220 px out; nearer, the way out is round the fan's
  side.

**What it amends.** D64 (the boss lunges) did not take the spit, nor both
attacks in turn, "now"; both are taken. D65 (a mini-boss is a smaller boss)
stands: the mini-boss still rehearses the boss's tell, which is now half of
what the boss does. The glossary's **boss** and **mini-boss** rows say so.

**Debug**: the boss's tip names both attacks.

**Save**: no new version. A fish keeps the behaviour it was made with, so a
boss already fighting in a dive saved before this only lunges; one still to
come fans.

**Measured** (`roadmap.md` → Health): the immortal bot takes longer to kill
the boss; the mortal bot still dies before it.

**Guarded by**: `tests/boss.test.js` → the lunge and the fan — over seeds and
both lungers, no charge and no fan without its full wind-up, the line held
through it, in view, the attacks in turn with the lunge first, the mini-boss
only lunging; the fan's count, spread, centre and shots. → escorts — a save
taken mid-wind-up playing on identically; every shot gone on the boss's death.
`tests/debug.test.js` — the boss's tip names both attacks. `checks.js` — every
tip fits the view, which the boss's first did not. Each verified by breaking
it.

## D118 — Hits vary in damage · 2026-10-19
The pass before S6 (balance). Igor, 2026-10-15: "should enemies have hp bars?
shouls the player? damage exceeding 1?"; then, 2026-10-18: "hits worth two
hearts - not limited to two, we are varying damage". Every hurt cost exactly 1
HP, through one path (D95 (three enemy behaviours, and one way to be hurt)),
so the boss's lunge weighed what a drifter's bite did.

**Decided, by Igor.**
- **Each attack deals an amount of its own**, not capped at two.
- **The unit stays.** Claude leaned to half hearts, then to a scale ten times
  finer; Igor: "half hearts is confusing", and "if minimal damage is 1 (which
  it is), then it stays. further on - a question of balance". The smallest hit
  is 1, as every hit was; how much HP the diver has and how much each attack
  takes are S6 (balance)'s. Heart, Vitality and Mend keep their meaning.
- **A guard charge takes one hit whole, whatever its damage.** Igor: "one
  instance of damage maybe?"; Claude agreeing: a charge counts hits while HP
  counts damage, so defence stays a different thing from health (D100
  (equipment)) — a charge that soaked an amount would be HP refilled each
  batch. It takes whatever lands first, so it cannot be saved for the heavy
  hit. Isaac's Holy Mantle is the same rule. Igor, once built: "guard rule ok".
- **HP, not hearts.** Igor: "rename hearts to hp". What the game and the docs
  call the diver's health is HP — Vitality's and Mend's lines say so. The
  attribute keeps its name, Heart, as Strength keeps its.

**Built.** `damage` on every attack's record — `bite`, `spit`, `fuse`, `lunge`,
`fan` — and the eel's `touch` is now its amount rather than `true`. Each
caller passes its own to `hurtPlayer(damage)`; an enemy shot carries its
record's, so it lands for what it was fired with. HP stops at 0. **Every
amount is 1**, so nothing plays differently yet: the amounts are S6
(balance)'s lever, and the threat system's — how often a fish lands, times how
much.

**Not decided here.** The diver's readout — Igor leans to the status bar,
with the diver's look showing its hurt once there are graphics — and bars
over fish: `ideas.md` → Bars, hearts, and hits worth more than one.

**Save**: version 9. Every attack a v8 dive's fish has, and its enemy shots, get
a `damage` of 1, as every hit was then — onto the records a fish was saved
with, so a boss saved before its fan (D117 (the boss's fan)) still only lunges.

**Guarded by**: `tests/enemies.test.js` — every attack a whole damage of at
least 1; the bite, the archer's shot and the burst each taking their own.
`tests/combat.test.js` — a touch taking its own, once; a hit bigger than the
HP left ending the dive at 0. `tests/boss.test.js` — the charge taking its
own; the fan's shots carrying theirs. `tests/home.test.js` — one guard charge
taking a hit of 2 whole. `tests/save.test.js` — a v8 dive's fish and shots at
1; the v9 fixture playing on. Each verified by breaking it.

## D119 — Grades: the same fish, stronger · 2026-10-19
The pass before S6 (balance). Igor, 2026-10-15: "enemies should have levels of
their own. same behavior but different attrs. this way we can reach more
diversity, higher layers & batches may get the same enemies as the first ones,
but stronger" — placed in this pass on 2026-10-18.

**Decided, by Igor.**
- **A grade changes a fish's numbers, never its behaviour**, so every fish's
  tell holds at any grade.
- **The balance system chooses a fish's grade — never a layer, never a
  batch's table.** Claude asked whether a grade came from the layer or was
  named per batch; Igor: "why would "grade" be even tied to any of layer's
  waves or batches? it's a balanced system, you go further - more difficult
  enemies appear. ofc, first time you meet for example extremely high-grade
  enemy cant be on the first layer. this is about balancing the batches and
  waves. remember, they are different but equally challenging at any given
  batch/wave in the game." So choosing grades is S6 (balance)'s threat
  system's (`plan.md` → S6 — Balance), and each type at each grade gets its own
  threat number there.
- **The word is "grade"** — "grade is fine for wording at least for now". It
  joins the glossary; "level" stays banned (D32 (the glossary)) and "tier" is
  gear's.
- **Shown as a small number on the fish.** Claude drew rings, one a grade;
  Igor: "instead of circles, put a small number for grade. circles enlarge
  enemies visually". PLACEHOLDER GRAPHICS.

**Delegated to Claude, and open to Igor to reopen.**
- **One table of steps, `GRADES`, for every fish**: grade 1 is the type as
  written; a step multiplies `hp`, `speed` and `value` and adds to every
  attack's `damage` and to `touch`, whole numbers by D118 (hits vary in
  damage). A new type has every grade at no cost (D6 (content is data)). Three
  steps — ×2 and ×3 hp, ×1.1 and ×1.2 speed, ×2 and ×3 gems, +1 damage — are
  placeholders for S6 (balance) to size.
- **A batch entry carries a grade as its third field** at run time,
  `[type, count, grade]`, grade 1 without one, and each fish takes it into the
  waves. It is how a choice reaches the fish — the balance system's once it
  exists, the debug mode's Grade row until then. Every authored pool stays
  ungraded, so a dive today plays as before.
- **No per-type override of a step.** Claude offered one in the sync, then
  dropped it on building: no type needs it yet, it would read as a behaviour
  everywhere a type's records are walked, and adding it later changes no data
  already written.

**Save**: no new version. A fish saved without a grade is grade 1.

**Guarded by**: `tests/enemies.test.js` → grades — grade 1 the type as written,
every step whole in damage; every type at every grade stepping only the
numbers a grade names, its behaviour the same, the type's own records
untouched. `tests/debug.test.js` — the grade written only above the first and
held within the grades; a setup's fish arriving at its grade in every wave and
named on the gate line; a save taken with graded fish still to come playing on
identically. `tests/docs.test.js` — `entities/enemies.md`'s grades table
against `GRADES`. Each verified by breaking it.

## D120 — Bodies are solid · 2026-10-19
The pass before S6 (balance). Igor, 2026-10-15: "balance issue: i can freely
swim thru red & purple enemies without a bite. not necessarily always bad, but
need to be addressed". Since D108 (fish bite) touching a fish is harmless, and
nothing stopped two bodies overlapping, so a diver at full swim was through a
drifter or a bulwark and out before its jaws shut. Where it belonged — Igor,
2026-10-19: "your choice". **Claude's call, delegated, and open to Igor to
reopen**: this pass, since whether bodies block is a rule of the fight, which
changes what S6 (balance) tunes — bite reach and wind-up, crowd sizes, what the
dash is worth, `footwork`.

**Decided, by Claude.**
- **Every body is solid**, the diver's and every fish's: what overlaps is
  pushed apart after the fish move, the heavier by area moving less — the
  diver shoves a darter aside, a bulwark barely gives, and the boss moves the
  diver. Fish keep apart from each other too, so a crowd stops stacking into
  one blob and becomes a wall.
- **The dash passes through.** It is what the help has always said it does —
  "through the swarm unharmed, shoving it aside" — and now it is the way
  through a crowd. `footwork` (D109 (micro-tasks are ladders; steps cost more
  as they rise)) becomes the feat Igor asked of it.
- **Contact attacks land where bodies meet**: the eel's touch and the lunge's
  charge, judged in the same pass, since bodies pushed apart only ever touch.
- **A lunger out of its chase is not pushed**: its lane is its tell (D64 (the
  boss lunges)). A charge that pins the diver against an edge passes over it.
- **Bodies part at most at `BODY_PUSH`, 600 px/s** — Claude's pick — so a deep
  overlap, a diver let go from under a charge, eases apart instead of jumping.
- **Against an edge the diver holds**, and the fish pressing it takes the whole
  push; no swim banks up against a body, as none does against an edge (D107
  (the diver swims and faces; fish with a ramp)).
- **A fish that attacks only wholly in view chases the nearest point to the
  diver where its body fits in view** — the lunger and the puffer. Found by
  the boss's property check, on a rare draw: kept off
  at its radius plus the diver's, a boss pinning the diver in a corner sat
  half out of view and never wound up again — a safe spot — and a puffer
  pressing a diver at an edge never lit. Away from the edges, that point is
  the diver.

**Rejected**: contact that slows the swim — fish still stack, and the
slowdown has no tell; a bite at once on any overlap — contact damage again,
which D108 (fish bite) retired.

**Cost**, measured: every pair, every tick, within the budget (`roadmap.md` →
Health); `ideas.md` → Spatial grid for collision is
the way up if it ever is not.

**Guarded by**: `tests/enemies.test.js` → the bite — a diver swimming at full
speed into a drifter, and into a bulwark, never through it and bitten (seen
failing first). `tests/movement.test.js` → bodies — the diver shoving a darter
further than a bulwark; no speed banked against a body; the dash through; the
diver held in view at an edge, the fish taking the push; a lunger not pushed
once it winds up, by the diver or by a fish; no body's centre ever inside
another however a batch crowds the diver; a boss pinning the diver in a corner
still winding up, a puffer pressing it at an edge still lighting.
`tests/combat.test.js` and `tests/boss.test.js` — the touch and the charge
landing on contact. Each verified by breaking it. Two checks that
stacked fish on one spot — a fish on the diver's very centre, drifters 6px
apart under the Knife — were given setups bodies allow, their rules unchanged.

## D121 — Only a hit blinks; a hurt fish carries a bar · 2026-10-19
From Igor playing the pass, 2026-10-19: "blink after dash is really
annoying", "cant see if damage is taken in debug mode when being immortal",
"fish reducing in size, health bars should make it go away".

**Decided.**
- **The dash's invulnerability is its own timer**, `player.safe`, no longer
  the i-frames' `hurt`, and only `hurt` blinks. D21 (the dash that read as a
  teleport) hid the blink while the dash flew; its 0.15s of grace after still
  blinked, every dash. Still safe for `DASH_TIME + DASH_GRACE`, as before.
- **Immortal, a hit lands and shows, and takes no HP**: the blink, the shake,
  the sound, a guard charge, `batchHit`, an enemy shot spent. Before, it
  never landed, so nothing showed. Amends D95 (three enemy behaviours, and
  one way to be hurt) — a shot passed `&immortal` unspent — and the tip of
  D102 (the debug mode)'s row.
- **A hurt fish carries a bar and keeps its size**, Igor's word. Since D120
  (bodies are solid) the shrinking also lied: a fish drawn at 70% held the
  others off at its full body. Claude's picks: a small bar over the body,
  shown only once hurt, so a one-hit fish never carries one; the boss and the
  mini-boss carry the same bar. A bar across the top for them was Claude's
  lean, and stays open (`ideas.md` → Health).

**Not decided**: the pile-up Igor saw, open in `ideas.md` → Crowds.

**Measured**: nothing re-measured. The immortal bot's dives now throw sparks
on a hit, from the seeded stream, so its runs differ from here; each bot
figure names its build (`roadmap.md` → Health).

**Guarded by**: `tests/combat.test.js` → the dash — safe through its grace
with `hurt` never set, and hurt again after. `tests/enemies.test.js` → the
archer — a shot passes the i-frames and the dash's grace unspent, and is spent
on an immortal diver, which blinks with its HP full. `checks.js` — a hurt
fish drawn at its full size, with its bar. Each seen failing against the rule
broken.

## D122 — Knockback: a hit moves what it hits · 2026-10-19
The pass before S6 (balance). Igor, after playing solid bodies (D120 (bodies
are solid)), on the bump he saw — "i meant bump after bite" — and on a shot's:
"drawn bump stays for s7, real knockback - design and implement now". His
note before that, for both: "a small bounce off (for fish and for player both
maybe?)". The bump after a bite was solid bodies: a heavy biter swims back
into the diver after biting and shoves it; a darter is too light to. Designed
in `specs/2026-10-19-knockback-design.md`.

**Decided.**
- **Real knockback, now** — Igor's word. **The drawn bump stays in S7 (alpha
  polish)** (`plan.md`), over the top of this.
- **Every hit carries a `knock`**, in px/s — the shape. Each weapon's, onto
  the player with its other numbers; each attack record's — the bite, the
  spit, the burst, the charge, the fan, and the eel's touch, which becomes a
  record, `{ damage, knock }`, like every attack.
- **The diver's hits knock fish** along the shot, or the swing, into the push
  the dash's shove already uses, fading by `PUSH_DRAG`; knocks add. **By
  area, as bodies are** (D120 (bodies are solid)): a fish of radius `r` gets
  `knock × (diver r / r)²`. **A lunger out of its chase is not knocked** — its
  lane is its tell (D64 (the boss lunges)), the same weight bodies use.
- **Fish's hits knock the diver**, away from the fish or along the shot, onto
  its swim, which its ramp eases off (D107 (the diver swims and faces; fish
  with a ramp)); the edge and the bodies stop it as they stop a swim. The
  diver's is Igor's lean — "both maybe?" — built, and his to keep or drop
  after playing.
- **Only a hit that lands knocks**: none through the i-frames or the dash's
  grace. **The guard takes the knock too** — Claude's pick, as it takes a hit
  whole (D118 (hits vary in damage)). Immortal is knocked: the hit lands and
  shows (D121 (only a hit blinks; a hurt fish carries a bar)).
- **The numbers are Claude's picks**, S6 (balance)'s to tune: the Gun 60, the
  Harpoon 200, the Knife 40; bites 180–420, a shot 150, the burst 480, a
  charge 600, the eel's touch 240 (`docs/entities/`).
- **The aim is read in whole 1/256ths of a view pixel.** The window-size
  check of D29 (difficulty invariant to window size) failed on this change:
  at a 1920×1080 window, scale 1.35, a quarter of its grid aims came back
  from the client-to-view conversion one float ulp off. An ulp of aim never
  moved anything before; a knock carries it into a fish's position, and the
  bodies amplify it over a dive. Rounded at the conversion, every size reads
  one point alike, far below what a hand can aim.
- **Save v10**: a saved fish's attacks knock as its type's do now, an eel's
  touch becomes its record, a shot already in flight knocks nothing, and the
  diver takes its weapon's knock. `tests/fixtures/save-v10.json` is its
  fixture.

**The risk, against a pillar**: "No batch is cleared without the player
moving" (`foundations.md`). Knock strong enough, at a rate high enough,
holds a crowd off a diver who stands still. At these numbers the Gun firing
without pause slows a puffer by about a third and a bulwark by a quarter, and
a drifter and a darter die to their first shot. S6 (balance) measures it.

**Not decided**: the dash's shove. Igor, mid-design: "dash knockback - good
idea, but should be earned. default without it is ok. goes for mechanics and
attrs design". Today every dash shoves — D51 (the dash is bought, and the
offer waits for the death), Claude's call, never asked. Recorded in
`ideas.md` → The dash, for that design; unchanged here.

**Guarded by**: `tests/combat.test.js` → knockback — a shot knocks a fish
along its travel, a puffer further than a bulwark; a piercing shot each fish;
a lunger winding up not at all; a swing along the swing; every way a fish
hurts — three bites, a shot, a burst, a charge, the eel's touch — knocking
the diver away at about its strength; none through the i-frames, the grace or
the guard, and an immortal diver knocked; a knocked diver held in view at an
edge. `tests/enemies.test.js` — every attack and every weapon a whole knock of
at least 0. `checks.js` — the window-size check, failing without the rounding. `tests/save.test.js` — a v9 dive's knocks, its eel's touch and its
shot in flight; the v10 fixture plays on. Each verified by breaking it.
Checks that built the eel's touch as a number now build its record; a bite's
rest, and a hurt fish's sparks, are checked with the knock out of their way;
the crowd check judges bodies in view, where two fish arriving on one spot
past the edge part at the capped rate.

## D123 — Nothing kept that every session rewrites · 2026-10-20
Igor, 2026-10-19, on a sweep that had fixed the browser suite's count in
`design.md`: "i dont want these useless numbers anywhere ever in the project.
who cares how many checks exist at this point in time? can you please wipe out
useless info that gets rewritten anyway?" And 2026-10-20: "anything that
requires rewrites on every session and is not set by a decision or a fix should
be wiped out. the idea is you not doing pointless iterations."

**Decided, by Igor.** A fact the docs would have to rewrite every session, and
that no decision or fix sets, is not kept. D92 (no line counts in the docs) was
the first case. Check counts go everywhere, the logs included.

**Claude's reading**, open to Igor — what it wiped:
- every count of checks and tests, today's or a total in an old changelog or
  decision entry. What one change added or broke is the change, not the suite,
  and stays — "15 checks added", "fails four of them" — as does the suite's
  output format, written `1 of N checks FAILED`;
- `design.md` → Tests' list of every Node check, and Verification's of every
  browser check: each decision names its own guard;
- `roadmap.md` → Next's recap of the pass, decision by decision — the
  decisions and the changelog hold it;
- the window-size check's dive time, re-measured with every change to the fish:
  the check needs the three windows identical, not a figure.

**Guarded by**: `tests/docs.test.js` — no doc, `CLAUDE.md`, the root `README.md`
or the content skill quotes a number of checks or tests. Verified by breaking
it. The rest is a judgement no check can make: `CLAUDE.md`'s sweep's.

## D124 — Diversity, the main rule · 2026-10-20
Igor, 2026-10-20, on the boosts: "again, i'll repeat my generic saying, no
limits there, diversity is the main rule of the game." Shown that it was
nowhere in `foundations.md` — only quoted in D108 (fish bite) — he wrote it
out: "about the diversity, if it's not clear in the rules: it must be from the
start. i might have worded it in high level design somehow vaguely. i'll try to
rephrase it once again to be clear. i added real player positive thoughts
examples in quotes ("") so that you have a better understanding of real-life
scenarios.

- definition. entities are: all game concepts that are included in gameplay
  mechanics. for example: mods, enemies, attrs, boosts, layers etc. even the
  player, despite being a single instance.
- entities are clear to the player in a sense of mapping words and actions to
  whatever happens on screen. "i click here now, so that i buy X that does Y so
  i'd be better on layer N when Z enemy arrives"
- should a new entity appear while designing, it must follow entity rules
  immediately
- ultimately, entities must be many. alpha version has defined numbers that
  act like borders for a project mvp that tests and validates the project can
  go any further. alpha numbers change as we seek for a solid game baseline.
  "i really have a lot of build and upgrade possibilities, i want to explore
  more. i feel like there's a lot to discover"
- entities vary by any degree, radically or not, but the difference is always
  clear to the player. "i know that right now i got these weapons and bonuses
  and hp etc and i am fighting this guy unlike my previous run where i had that
  setup"
- entities may or may not be coupled / dependent on each other, but if a
  gameplay contradiction arises because of coupling, raise and record an issue
  immediately (like in a harpoon shoot-thru example) "ok this thing looks
  similar but has a slightly different effect, i see it now"
- entities are scalable: adding a new one must never break existing gameplay
  or balance. "just tried this new bonus and it improved my dive a bit. just
  met this new enemy and couldnt beat it now, but i got an idea and i will kill
  it in the next run or two""

Then, asked: an "Alpha counts" table, "yes"; and "differences can be small or
large - i meant that".

**Decided, by Igor.** `foundations.md` → Diversity — the main rule: what an
entity is, and six rules every entity keeps — readable; a new kind keeps them
at once; many; different by a little or a lot, always clearly; coupled or not,
never contradicting; added without breaking. The alpha's counts, until now
split between his draft, the glossary and D93 (the content stage's counts),
move into one table there, provisional, changed in one line. "Small or large"
is how big a difference is, so mods keep differing in kind, never only in
amount (the genre contract, 5).

**Claude's reading**, open to Igor — each stated before it was written, none
objected to:
- **The entities**: every kind with a table in `game/content.js` — fish,
  weapons, equipment, mods, boosts, attributes, challenges, layers, batches —
  and the diver. Grades, gates and currency are rules around them.
- **"Entity" freed for it**: the budget of 500 (D43 (the glow cache is
  cancelled; the entity budget is measured)) counts *objects*, things on
  screen, renamed in `foundations.md`, `CLAUDE.md`, `design.md`, `roadmap.md`,
  `plan.md` and the code's one comment. D32 (the glossary is binding) allows a
  word one meaning.
- **A new kind's rules include its doc** in `entities/` (D81 (entity docs)).
- **Rule 6 is checked by bot dives** before and after a new entity, every
  pillar target held — S6 (balance)'s bots.
- **The fish count is types, the bosses aside** — the draft's "5-7 types of
  enemies + bosses". The S5 (content) spec counted "enemy behaviours"
  instead; no decision ever said so, and the slip was Claude's.
- **Five challenges**: D93 (the content stage's counts) asked for three; D109
  (micro-tasks are ladders) made five, under "invent more microtasks".

Layers and their batches got `entities/layers.md` — two kinds in one doc, as
`challenges.md` holds the attributes its challenges pay for — and the diver
`entities/diver.md`, its numbers moved there from `design.md`. Igor: "if you
lean to it. only useful structured info, no bullshit".

**Guarded by**: `tests/docs.test.js` — every kind in the table against the
content tables: a kind outside its range, or a counted kind missing from the
table, fails; and the two new docs held to the code as every entity doc is —
their tables, their fields, a section for every layer. Verified by breaking it.

## D125 — Boosts keep each weapon's nature · 2026-10-20
Igor, 2026-10-20, after playing them: "frenzy cant make all weapons fire at the
same range, rather boost by percentage"; "bloom is a questionable bonus
overall, needs polishing"; "lance and harpoon dont play well together. likely a
balance issue"; and, on all three, "we might want to untie entities to make it
simpler overall and in terms of scalability especially". Shown the arithmetic
— a flat `+3` makes the Gun fire 2.2 times as fast, the Knife twice, the
Harpoon nearly five times; a share doubles each — he said what he was after:
"my call was to balance boosts across different weapon setups. frenzy with
different numbers is fine i guess. or go your way, whatever fits." On Bloom:
"at this point without graphics i dont feel it's boosting anything. visually
bullets are bigger and that's it"; offered a splash, "do the splash".

**Decided, by Claude — delegated** ("go your way, whatever fits"), open to
Igor to reopen:
- **A boost any weapon can get keeps the weapons in their order.** It adds to
  no weapon's number; it may raise one by a share of it, `percent`, worked out
  as it is touched — a number every weapon has above zero, since a share of
  nothing is nothing. Every weapon gains the same share, so the boost is
  tuned once, never once per weapon, and a new weapon needs nothing from it.
- **A boost that means something only on one weapon is that weapon's own**:
  `weapons`, dropped only while one it names is carried, through the `fits()`
  that deals a weapon mod (D99 (weapon mods, and more boosts)).
- **Frenzy** raises the fire rate by 100% — Claude's pick, about what the Gun
  and the Knife gained before; the Harpoon's rate doubles instead of nearly
  quintupling.
- **Lance is the Gun's own.** The Harpoon and the Knife already go through
  fish, so on them it was more of the same — Igor's "same effect" — and a
  share cannot carry it, the Gun's pierce being 0. Its `swingDesc` goes with
  the Knife it can no longer meet. Lance and the Harpoon no longer meet.
- **Running, a boost keeps what it added** and takes exactly that back, so a
  share comes off as it went on.

His earlier lean, a boost that never touches the weapon ("yes i menat that"),
is kept in its aim — tuned once, the same with every weapon — not its letter:
Frenzy touches the weapon's rate, by a share, as his "frenzy with different
numbers is fine" allows.

**Decided, by Igor** ("do the splash"): **Bloom splashes.** While it runs, a
shot's or a swing's hit wounds every fish whose body is within `splash` of the
struck one's, for the hit's damage. Claude's picks, stated with it: `splash`
24px; the splash knocks nothing; a fish it wounds splashes nothing on, so a
crowd cannot chain; it stays a number on the diver, read where a hit lands, so
D86 (boosts)'s "numbers, not a function" holds. Flagged for S6 (balance): a
Harpoon shot through three fish splashes three times, and every fish a Knife
cuts splashes.

**Supersedes in part** D99 (weapon mods, and more boosts): its three boosts on
"the weapon's own numbers, so they serve every weapon" — Frenzy now by a
share, Lance the Gun's, Bloom a splash. `entities/boosts.md`'s "never
multiplies" was Claude's line, citing D74 (mods on top of gear and
attributes), which ruled on mods; it goes. `foundations.md` → Diversity, rule
5, cites this entry for the Lance example in place of `ideas.md`.

**Not decided**: Igor's wider shape — diver, attribute, a weapon's own and
"environmental" boosts — beyond the weapon's own, built here. Claude's
reading, unconfirmed: a diver boost and an attribute boost are one kind, both
the diver's numbers. Kept in `ideas.md`.

**Save**: version 11. A v10 dive's running boosts take back what they added
then, its diver gets `splash: 0`, and a Lance on the floor goes unless the
Gun is carried.

**Guarded by**: `tests/drops.test.js` — every boost on with a touch, with every
weapon it fits, its share of that weapon's own number, and off after its time;
no boost any weapon gets adding to a weapon's number, nor sharing one some
weapon lacks; a weapon's own boost dropped with that weapon only.
`tests/combat.test.js` — a shot's hit wounding the fish beside, unknocked, and
none past it; a Knife cut's splash killing through the one path, no fish cut
after it died, each paid once. `tests/save.test.js` — a v10 dive's Frenzy and
Bloom taken back as they were added, its Lance kept with the Gun only, and
the v11 fixture.

## D126 — Threat: the hearts a batch costs, rising through a dive · 2026-10-21

S6 (balance)'s threat system, in the direction Igor chose: a number per enemy
type, a batch's threat computed from its fish, measurement correcting the
numbers, and threat rising "overall and gradually" (D79 (a dive goes from
easiest to hardest)). Grades are the system's (D119 (grades)): "you go further
- more difficult enemies appear … extremely high-grade enemy cant be on the
first layer … they are different but equally challenging at any given
batch/wave". Opening the stage: "start s6, no interruptions unless critical
questions to me" — so everything below that is not quoted is **Claude's call,
delegated**, open to Igor. Its design is `specs/2026-10-21-s6-balance-design.md`.

- **A fish's threat is hearts.** One over the count of its type, at a grade
  and alone, that costs the diver bot (D128 (the balance suite)) one heart, at
  the reference kit — the Gun, nothing bought, no mods. One number per grade,
  `threat` on the type's record, so a new type is measured once
  (`npm run measure threat`) and joins.
- **A batch's threat is its fish's summed.** Read at the knee, where hearts
  start to go, it is about the hearts the batch costs there; far past it,
  hearts grow faster than the count, which the curve's ratio absorbs. The sum
  is Claude's pick; the spec's crowd term was not built.
- **The dive's curve**: each ordinary stretch, counted through the whole dive,
  has a target `THREAT_START × THREAT_RISE^k` — a ratio, since a dive's mods
  and a career's gear compound. Two constants in the balance block, so a
  fourth layer extends it with no new number. A mini-boss's stretch shares
  the target of the stretch before it.
- **A drawn batch is graded up to its target**, in `drawPlan()`, from the
  seed: one fish and one grade at a time, a step that fits what is left drawn
  first, then the smallest step while it lands nearer the target than
  stopping. So a stretch's batches are different and come to the same threat,
  and deeper stretches meet harder grades.
- **A grade's `from`** is the first layer it arrives in: grade 3 from the
  second, so the first layer never meets the top grade.
- **A mini-boss or the boss** arrives at its layer's number as its grade,
  capped by `from`; its escorts are graded to what is left of the target once
  the lead's threat is taken, so the gate, lead and escorts, comes to the
  stretch's. Escorts whose threat at grade 1 already passes it come ungraded.
- **The boss's crowd** refills from its graded escorts, grades and all, to
  `BOSS_CROWD` as before. That is Claude's reading of Igor's "according to the
  balance for current batch", unconfirmed: the crowd is the batch, sized as
  every batch is, not a number of its own.
- **Pools are sized by threat.** A pool batch's threat at grade 1 is at or
  under its stretch's target, and at the layer's top grade past it, so grading
  can always reach it. `entities/layers.md` shows all three.
- **The save needs no new version.** A plan entry's grade is the third field
  a fish already had (D119 (grades)); a v11 dive's plan, drawn ungraded, plays
  on ungraded.

**Supersedes** D71 (batches are drawn from pools)'s "comparable threat is
hp" — the hp bands, and with them D54 (the batches, re-derived from
scratch)'s sizing on hp — and D119 (grades)'s "until S6 every fish in a dive
is grade 1".

**Guarded by**: `tests/dive.test.js` — every type a threat at every grade,
higher at each; every pool batch at or under its stretch and able to reach
it; every drawn gate graded to its stretch, never past its layer; the top
grade never in the first layer; each stretch's target above the last.
`tests/boss.test.js` — the mini-bosses and the boss at their layer's number,
and the deepest boss's crowd at its escorts' grades. `tests/save.test.js` — a
version 11 dive's plan played on ungraded, as it was drawn.
`tests/debug.test.js` — the gate line naming a drawn batch's grades, and no
fish's tip reading `threat` as a behaviour. `tests/docs.test.js` — the threat
table and every pool's target, threat and threat at top.

## D127 — The numbers S6 tuned, and the bars they are held to · 2026-10-21

What S6 (balance) moved to meet the pillars, measured by the diver bot at the
kit a career first meets each gate with (D128 (the balance suite)). Every
number is **Claude's pick, delegated** — "start s6, no interruptions unless
critical questions to me" — and the figures they produced are `roadmap.md` →
Health. The dash and everything feeding it are untouched — Igor: "leave dash
for now, discussions needed": its numbers, `Reflex`, `Impact`, Strength, Dash
reach.

- **Twelve gates a layer**: a stretch draws three batches from its pool, not
  four. A batch's time follows its threat, so fifteen gates could not meet the
  4–8 minute layer and the 10–45 second batch at once.
- **The curve**: `THREAT_START` 0.55, `THREAT_RISE` 1.4.
- **Grades**: `hp` ×1.25 and ×1.5 (from ×2 and ×3), each attack +1 and +2
  (from +1 and +1); `speed` and `value` as they were; grade 3 from layer 2.
- **Hits worth more than one**, Igor's "damage exceeding 1?": the attacks with
  a long tell — Claude's lean in `ideas.md`, now built. The puffer's burst 2,
  the mini-boss's lunge 2, the boss's 4; bites, spit and the fan stay 1, and
  every grade adds to them all.
- **The puffer faster** — Igor: "maybe acceleration or making it faster would
  help": `speed` 95 to 125. Acceleration is left open.
- **Bosses and mini-bosses quicker** — Igor: "make bosses & mini bosses
  quicker": the mini-boss's `speed` 70 to 90, its lunge's wind-up 1.5 to 1.2s
  and rest 1.2 to 0.9s, `hp` 24 to 20; the boss's `speed` 60 to 80, its
  lunge's wind-up 1.0 to 0.8s, its fan's 0.8 to 0.6s, both rests 1.2 to 0.9s,
  `hp` 60 to 55.
- **The Knife's arc halved** — Igor: "knife arc reduce by half": 120° to 60°,
  its `range` 56 to 60. **The Harpoon's damage** 3 to 4. The Mask's step +30
  to +15 range. The archer is untouched — Igor: "shooting enemies are quite
  good atm".
- **Prices ×40** across every weapon and piece of equipment, the Gun's first
  tier ×30 (1200): graded fish pay double and triple and batches are bigger,
  and at five times the old prices a career still bought everything in two
  dives. Which fish
  drop gems, D78 (gems are pulled to the player)'s lever, is left as it was —
  every kill pays its `value`.
- **Bigger mod caps** — Igor: "bigger caps, yes": `Fins` and `Vitality` 3 to
  6; `Nerve` stays 3; `Reflex` and `Impact` are the dash's. Removing caps is
  left open.
- **The pools**, every batch re-sized by threat, no batch above twelve
  archers.

**The bars**, Claude's readings of the pillars, the open question to Igor:
- **Nothing unbeatable**: no gate lost — died or uncleared — on more than half
  the seeds.
- **Nothing trivial**: no gate cleared by the standing bot on more than one
  seed in ten. The one that clears comes out with a sliver of HP — luck, not a
  way to play.
- **Fast-paced**: each stretch's batches take 10–45s on average; a single
  batch may run past.
- **Dives are a session**: a career's first clear of a layer takes 4–8
  minutes, nine times in ten.
- **Rising**: a batch's hearts, averaged over a layer, higher in the last
  layer than the first, each layer at least 0.9 of the one above — D79 (a dive
  goes from easiest to hardest)'s "some later batches might be easier".
- **No weapon dominating** in the mid-to-late game: over layers 2 and 3
  together — a dive carries one weapon through both — no weapon faster by 5%
  and cheaper by 10% in hearts, with no fewer clears, than another, each at
  the kit a Gun career meets layer 2 with, its tiers the Gun's. Per layer one
  does: the Knife is worse in layer 2, where it chases archers and steps into
  bursts, and better in layer 3, where eels charge onto it.
- **`footwork` takes skill**, Igor's "it all comes to balance": the diver bot
  without its dash loses more than twice the hearts (`roadmap.md` → Health).

**Supersedes in part**: D69 (every mod capped)'s caps for `Fins` and
`Vitality`; the prices of D75 (the gun's tiers, dash reach, a clean batch),
D97 (weapons are owned, and one is carried) and D100 (equipment); the Mask's
step (D100 (equipment)); the Knife's arc (D105 (the Knife swings)); the
lungers' timings and damage (D64 (the boss lunges), D65 (a mini-boss is a
smaller boss), D117 (the boss's fan)); the puffer's speed and burst (D106 (the
puffer bursts and comes on again)); D119 (grades)'s steps.

**Guarded by**: `npm run balance` — every bar above a check but `footwork`,
measured by hand; each was seen failing on a break of what it guards (the
curve raised, the Gun quickened, the boss's hp raised, the gear priced out of
reach). `npm test` holds the
numbers to the entity docs.

## D128 — The diver bot and the balance suite · 2026-10-21

S6 (balance)'s instruments, as the spec set them. Bot figures stay a floor —
D50 (the bot is not a difficulty instrument) stands: Igor's play overrules
any figure. Every limit is Claude's pick.

- **`kiteAndShoot` stays the regression yardstick**, unchanged. Graded
  batches kill it at the first one, so the soak plays it immortal, and the
  descent check waits 180s for it: it kites archers rather than closing on
  them.
- **The diver bot** (`makeDiver` in `tests/bot.js`), the balance bot, playing
  from what the screen shows: every 0.1s it scores the eight ways and
  standing by each fish's reach and attack, every shot, a fusing puffer, a
  lunger's lane, over the next 0.4s, against the pull of where its weapon
  wants it; it shoots the fish that threatens most for the time it takes to
  kill, the glowing one first, aimed ahead; it dashes when every way still
  lands a hit; it takes a boost lying near; at a layer end, the first card.
  Its limits: it watches only the six nearest fish, misses one thought in
  ten, and scatters its aim by a couple of degrees — drawn from a generator of its
  own, so a seed replays exactly and the game's draws are untouched.
- **The standing bot** is the diver bot that never swims and never dashes: a
  gate it clears is a gate cleared without moving.
- **A career** (`tests/measure.js`): a fresh save diving and spending until
  the win — attribute points first, the step its weapon requires before the
  cheapest; then the weapon, if not owned; then, again and again, the cheapest
  tier of the weapon or the equipment it can afford — Claude's order. **The kit
  a gate is first met with** is the career's kit on the dive that first
  reaches it: what "the gear level expected when it is first met" means here.
- **`npm run measure <bots|careers|threat|pillars|weapons|fit>`** prints the
  tables, `fit` rewriting the pools' counts to the curve; each seed is
  measured in a worker thread of its own, and the balance suite's files share
  the one report; **`npm run balance`** runs the bars of D127 (the tuned numbers) as
  checks on ten seeds — slow, so never in `npm test`. It is also what
  `foundations.md` → Diversity, rule 6 asks of a new entity: bot dives before
  and after, every pillar held.

**Guarded by**: `tests/invariants.test.js` and `tests/descent.test.js` for the
yardstick; the balance suite for the rest, each check seen failing.

## D129 — A gentle first layer · 2026-10-22

Igor, 2026-10-21, playing the S6 (balance) build: "first layer already feels
way more complex. maybe need to make a smoother difficulty curve. grade 2 fish
appear immediately from the start - clearly a flaw". Offered a dive that
starts at grade 1 with the first batches near their old size: "i guess B, my
feel is that first death happens +- at batch 3-4. grades higher than 1 must be
quite rare in layer 1 overall. also, havent checked it, but make sure that
lower graders still appear in mid and late game, while keeping batches
balanced". On the time bars: "dont focus on completion time, it's going to be
different for players. focus on enemies and batches instead."

- **The curve compounds what each stretch adds.** Stretch k's target is
  `THREAT_START × (THREAT_RISE^(k+1) − 1) / (THREAT_RISE − 1)`: the first
  stretch's is `THREAT_START`, and each next one adds `THREAT_RISE` times what
  the last added. A ratio of the target itself could not start small without
  leaving the deep layers easy. `THREAT_START` 0.2, `THREAT_RISE` 1.4 —
  Claude's picks.
- **The dive starts at grade 1.** The first stretch's pool batches meet its
  target at grade 1, so it grades nothing; the rest of the first layer's carry
  about nine tenths of theirs (`FIT_FIRST`, Claude's pick), so grades above 1
  stay rare there — a tenth of its fish at most, Claude's reading of "quite
  rare".
- **Every graded batch keeps lower grades.** `GRADE_KEEP` of each type in a
  batch, a fifth, stays at grade 1 however deep — Claude's pick.
- **The pools are fitted, not hand-sized**: each batch is written as its mix
  of fish, and `npm run measure fit` sets its counts — in the first layer to
  carry its target at grade 1, deeper to the fewest fish grading can bring to
  it under `GRADE_KEEP`.
- **`BOSS_CROWD` 4**, from 6: puffer-heavy crowds held the boss's stretches
  far past the rest. **The Knife's reach** stays 60.
- **Completion time is no longer a bar.** The bot's batch and layer times are
  printed by `npm run measure`, never checked: a player's will differ. The
  pillars in `foundations.md` are untouched.
- **"First death happens +- at batch 3-4"** is read as what Igor met on the
  S6 (balance) build, not a target — Claude's reading, unconfirmed.

**Supersedes in part**: D126 (threat)'s curve, a ratio of the target, and its
"every pool batch at or under its target" for the dive's first stretch; D127
(the tuned numbers)'s curve numbers and its Fast-paced and Dives are a session
bars; D116 (bosses bring escorts)'s crowd of 6. **Amends** `foundations.md` →
Pillars: the two times are printed, not held.

**Guarded by**: `tests/dive.test.js` — every pool batch at or under its
stretch and able to reach it under `GRADE_KEEP`, the first stretch at it at
grade 1; a share of each type at grade 1 in every graded batch; the dive
starting at grade 1, grades above it rare in the first layer.
`tests/docs.test.js` — every pool's target. `npm run balance` for the rest.

## D130 — Fish are revealed a type at a time · 2026-10-22

Igor, 2026-10-21: "more difficult enemies appear later in game. hard to do for
a small enemy pool now, but must work for future scaling"; playing the
D129 (a gentle first layer) build, which put every first-layer type in the
first stretch to keep it from being cleared standing: "now i meet all kinds of
enemies at once. it may be balanced, but we must reveal content to player
iteratively". Asked whether the stretches holding only harmless fish may then
be cleared standing still: "opening stretches may be clearable standing
still".

- **A type is first met no earlier than every type below it in threat** at
  grade 1, so a harder fish comes later, and a new type slots in by its
  measured threat.
- **A stretch brings at most one new type, the dive's first two** — Claude's
  picks. The first layer opens on drifters and darters, then archers, then
  bulwarks; the second brings puffers, the third eels.
- **The opening may be cleared standing.** It is the stretches holding only
  the types the dive opens with; the standing bar starts past it.

**Supersedes in part**: D127 (the tuned numbers)'s Nothing trivial bar, for
the opening. **Amends** `foundations.md` → Pillars, Nothing trivial, and
`plan.md`'s exit for S6 (balance), to past the opening.

**Guarded by**: `tests/dive.test.js` — the reveal, over every pool of the
dive; `tests/pillars.balance.js` — the standing bar past the opening.

## D131 — CLAUDE.md is an index · 2026-10-22

Igor: "trim claude.md, delegate all info to a well structured documentation.
main file only points to other files, files read only if required by session".

- **`CLAUDE.md` only points.** Three docs are read every session, before the
  first reply — `foundations.md`, `plan.md`, and `working.md`, since every
  reply follows it; the rest only when the session needs them: `code.md` for
  code, the `abyss-content` skill for content, the root `README.md` to run
  things, `docs/README.md` for everything else.
- **`working.md`** holds how Igor and Claude work: the reply, questions and
  uncertainty, stage-sized work, commits, the consistency sweep, skills and
  plugins. **`code.md`** holds what the browser build is, the constraints
  beyond `foundations.md` → The technical contract, the conventions and
  verification. What `foundations.md` already said — no runtime dependencies,
  the seam, checks that can fail — is cited, not copied.
- The file names and the split are Claude's picks.

**Guarded by**: `tests/docs.test.js` — every doc `CLAUDE.md` or the map
names exists, and the map names every doc.

## D132 — Full runs on Igor's word · 2026-10-22

Igor: "test runs apparently take long (correct me if im wrong). so, only run
tests on new functionality. occasionally, i will tell you to run all, then we
record bugs to be processed separately."

- **A change runs the checks of what it touches**: its test files and its new
  checks, each seen failing first.
- **`npm test`, `index.html?test` and `npm run balance` run whole on Igor's
  word.** What they find goes to `bugs.md`, processed apart from the change
  that was running.

**Guarded by**: nothing a machine can see — it is how the work is done
(`code.md` → Verification).

## D133 — The doc tables write themselves · 2026-10-22

Igor, asked whether the entity docs' number tables could go, the numbers then
living only in `game/content.js`: "numbers need to stay in docs for reference,
it's the tests i dont understand the point of". The point: a table in a doc is
a copy of the code, and the check is what keeps the copy from going stale. The
cost was writing the copy by hand. Offered a command that writes them: "build
npm run docs to write the tables automatically yes".

- **`npm run docs` writes every number table** of `docs/entities/` from the
  code (`tests/doctables.js`), each between its markers, `<!-- generated: id
  -->` and `<!-- /generated -->`, which render as nothing.
- **A table with no marker is reported, not placed**: where a new behaviour's
  table goes in its doc is a human's call.
- **`npm test` fails on a stale table and on a marker the code makes no table
  for**; it builds the tables the same way, from the same module. The table
  checks one per kind go — the stale-table check covers every table at once.

**Guarded by**: `tests/docs.test.js` — both failures, each seen failing on a
break: a number changed in the code, a marker with no table.

## D134 — Lean docs · 2026-10-22

Igor: "the whole game is 2.6k lines of javascript and a ton of docs around
it. can we optimize it without losing important info?", then, to the four
cuts offered: "do all proposed".

- **`changelog.md` is frozen**: `git log` says what shipped, `decisions.md` why.
- **A decision entry is short** — what, why in Igor's words, what it
  supersedes, what guards it; about fifteen lines (`README.md` → Living docs
  and logs).
- **`design.md` keeps what the code cannot say** — the reasons, the traps,
  how systems meet — not a retelling of the code.
- **A closed stage's spec leaves the tree**; `git show 99d79ae:docs/specs/<file>`
  reads one. Only the open stage's stays.

**Supersedes**: D57 (`docs/` gets its own checks)'s check that the newest
decision has a changelog entry, and the sweep's "`changelog.md` always".

**Guarded by**: `tests/docs.test.js` — every doc the map names exists.

## D135 — Reported issues commit at once · 2026-10-24

Igor: "rule: when i report a bug or an issue, commit automatically unless
there are clarifying questions for me".

- **An issue Igor reports is committed as soon as it is recorded**, in
  `bugs.md`, `ideas.md` or wherever it belongs, with no stop for `/simplify`.
- **A question for him about it holds the commit** until he answers.
- **Only the record.** A fix, or any other change, still stops before its
  commit (`working.md` → Commits).

**Guarded by**: nothing a machine can see — it is how the work is done.

## D136 — Prices halved · 2026-10-24

Igor: "i'd focus on currency system. right now it takes too long to earn
enough gems for first upgrades. halve the prices."

- **Every gem price is half what D127 (the tuned numbers) set**: each tier of
  every weapon and piece of equipment, and the Harpoon's and the Knife's own
  price. The Gun's first tier is 600.
- A diver who dies after four batches, about 205 gems a dive, now buys it on
  the third dive, which meets "Addictive, not grindy". Before, it was the
  sixth.
- The opening's size stays open (`ideas.md` → Open — from S6 (balance)).

**Supersedes**: D127 (the tuned numbers)'s prices.

**Guarded by**: `tests/docs.test.js` holds the price tables to the code;
`npm run balance`'s career check holds the first purchase within three dives.

## D137 — Batches grow from seconds to a minute and a half · 2026-10-24

Igor: "first batches take me about 40s … i want first batches to be smaller,
finishable at 10-15s, then gradually become harder, with more enemies. so
like a slowly growing curve from near zero to say 1.5 minutes in latest
batches now (layer 3) … make this change more visible. everything else stays
… tune numbers. alpha must be finishable, player upgrades should be at about
top tier when he reaches the end". Then: "threat follows time
(approximately). make it 10 gates for every layer now". The numbers are
Claude's picks.

- **Ten gates a layer**: three batches, a mini-boss, two, a mini-boss, two,
  the boss.
- **The curve**: `THREAT_START` 0.05, about a dozen drifters and darters;
  `THREAT_RISE` 1.8. The bot clears the first batches in about 10s and the
  deepest ordinary ones in about 70s. Igor took 40s where the bot took 30s, so
  the bot is aimed at about three quarters of his times.
- **More fish, not only higher grades**: past the first layer, grade 1 now
  carries at least 60% of a pool batch's target (`FIT_DEEP`), where it used to
  carry the least it could. Fish per batch go from 12 to about 90.
- **Prices to 0.4×** of D136 (prices halved)'s: the Gun's tiers 240, 800,
  1600.
- **The boss's `hp` 55 to 100.** Its escorts are mostly grade 1 now, so it was
  cleared standing still in layer 3.
- Two of layer 2's first batches and two of layer 1's gained archers: they
  were cleared standing still.
- **The gear at the win**: the career wins on dive 4–6 holding 5–9 of the 12
  tiers, the Gun at 2–3 and each piece of equipment at 1–2. Asked whether
  that is "about top tier": "good enough".

**Supersedes**: D127 (the tuned numbers)'s twelve gates and boss hp, D129 (a
gentle first layer)'s curve numbers and its deeper pools of the fewest fish,
and D136 (prices halved)'s prices. **Amends** `foundations.md` → Pillars,
Fast-paced.

**Guarded by**: `tests/dive.test.js` — ten gates a layer, the dive's deepest
batches five times its first in fish, each layer more than the last;
`tests/pillars.balance.js` — the first batches under 15s, the deepest ordinary
over 60s. Both were seen failing on the old build.

## D138 — The bars stand · 2026-10-24

Asked how strictly the balance suite should hold the pillars, with layer 1's
boss killing a fresh diver on about four seeds in ten: "keep all".

- **The bars stay as D127 (the tuned numbers) set them**: a gate lost on no
  more than half the seeds, cleared standing on no more than one in ten past
  the opening, hearts higher deeper with a dip of a tenth allowed, and no
  weapon dominating over layers 2 and 3 together. D137 (batches grow from
  seconds to a minute and a half)'s time bar stays too.
- **Layer 1's boss is a wall**: a fresh diver often dies there and buys past
  it.

**Supersedes**: nothing; it closes the question D127 left open.

**Guarded by**: `npm run balance`, the bars themselves.

## D139 — S6 closes · 2026-10-24

Igor, on the `footwork` bar: "footwork is generally questionable thing, as it
forces the player to withdraw an essential ability. i'd rework it or drop
completely. wrap up s6, commit and close".

- **S6 (balance) is closed**, on Igor's word. Its exit is met on the diver
  bot's figures under the bars D138 (the bars stand) keeps: no gate lost on
  more than half the seeds, none past the opening cleared standing on more
  than one in ten, no weapon dominating over layers 2 and 3; every pillar in
  `foundations.md` is measured (`roadmap.md` → Health).
- **The `footwork` bar is dropped**: twice the hearts without the dash. The
  `footwork` challenge itself is open, to be reworked or dropped (`ideas.md`).
- **Carried past it, open**: one boss for three layers, the challenge rungs
  on ten-gate layers, gates per layer, the Bloom splash (`bugs.md`), and the
  dash.
- **Its spec leaves the tree** (D134 (lean docs)).

**Supersedes**: D127 (the tuned numbers)'s `footwork` bar.

**Guarded by**: `npm run balance`.

## D140 — The drawn bump · 2026-10-24

S7 (alpha polish)'s first item. Igor: "go ahead with the bump"; the bump
itself was his, kept for this stage by D122 (knockback): "drawn bump stays
for s7".

- **A fish the diver's shot or swing hits is drawn jolted**, over the real
  knock: pushed along the hit and flattened along it, easing back over
  `BUMP_TIME`. Drawn only, so a lunger the knock leaves on its line jolts too.
  A hit that kills shows the death instead: the fish is gone that tick.
- **Fish only.** The diver's knock is real since D122 (knockback) and his to
  keep or drop; a drawn one for it waits for his word. A splash's wound has
  no hit to jolt along, and the dash's shove is its own.
- **The numbers**: `BUMP_TIME` 0.1s, Claude's pick; `BUMP_SIZE` 0.15 of the
  radius, pushed and flattened alike — Igor, after playing Claude's 0.3:
  "halve the bump radius".
- **An open mouth jolts with its body.** Igor: "when fish mouth open, no bump
  happens". The mouth was cut at the body's resting place, over the very edge
  the jolt moves, so a biter hit with its jaws open looked unmoved. It is
  drawn in the body's jolted frame.

**Guarded by**: `tests/combat.test.js` → the bump: a shot's, a swing's and a
pinned lunger's set it along the hit, and it runs out. Seen failing before
it was built, and with the bump set after the lunger's return. `checks.js` —
an open mouth jolts with its body, seen failing on the mouth left at rest.

## D141 — The bite leaps, and the bulwark's reach is halved · 2026-10-25

Igor, playing the bump: "adjust bite range. triggers damage when i'm already
half the fish away. for biting fish it may be good to add a short leap
forward-backward during a bite to feel more natural. do now if the change is
small".

- **The bulwark's `reach` is 20**, from 40 — Claude's pick, half. At 40 a
  body 34 in radius bit across more than half its own width of open water.
  The drifter's 10 and the darter's 6 stand.
- **A biter leaps on its snap**, drawn: over the jaws' last `LEAP_TIME` its
  body stretches at the diver, to the diver's body or to the reach's end,
  whichever is nearer, full on the snap, and back over the rest's first. So
  a bite that lands is seen to touch, and one that misses snaps on water.
  Drawn only: where it bites from and whether it lands are D108 (fish
  bite)'s, unchanged. `LEAP_TIME` 0.08s is Claude's pick.
- **Not re-measured**: a shorter reach makes the bulwark milder, and its
  threat numbers were fitted at 40; `npm run balance` runs on Igor's word
  (D132 (full runs on Igor's word)).

**Supersedes**: D108 (fish bite)'s bulwark reach of 40px.

**Guarded by**: `tests/enemies.test.js` → the bite — it leaps out to the
diver's body on the snap, home after, and only to its reach at a diver who
got away; seen failing before it was built, and with the reach's cap
removed.

## D142 — The +N, summed over the diver, flown to the counter · 2026-10-25

S7 (alpha polish)'s third item: D35 (currency is auto-collected)'s debounced
`+N`, kept for this stage by D78 (gems are pulled to the player). Both of
D35's places were built for Igor to pick; he combined them — Igor,
2026-10-25: "combine both. accumulate gems over player, then swift animation
to status bar with a bump there".

- **Summed, never one per gem** (D35): each gem collected adds one to a
  running `+N` over the diver and starts its hold again, so a fight's stream
  of gems is one climbing number.
- **Then it flies to the counter**: `GEM_POP` after the last gem it leaves
  the diver and speeds up to the status bar's `GEMS`, in `GEM_FLY`; as it
  lands the counter's number swells and settles, in `GEM_BUMP`. A gem
  collected meanwhile starts a new `+N` over the diver.
- **The counter counts it as it lands**: `currency` is the gems collected,
  for the save and the end of the dive; the counter shows it less what is
  still over the diver or in the air — except once the dive is over, when it
  shows all.
- `GEM_POP` 1s, `GEM_FLY` 0.25s, `GEM_BUMP` 0.15s and the swell are Claude's
  picks.

**Guarded by**: `tests/combat.test.js` → the +N — a run of gems summed into
one, held after the last, then from one again; flown to the counter, which
holds it back until it lands and then bumps; all shown once the dive is over.
Each seen failing before it was built, and with the hold not restarting, the
bump not set, and the dive's end not counted.

## D143 — Every row at home says what it does · 2026-10-25

S7 (alpha polish)'s fourth item. Igor, 2026-10-19: "player has no idea what
tier-up means for him"; then, 2026-10-25: "all rows must provide info. i
still feel the menu is a bit clumsy, but we leave proper ux out of alpha. now
- just clarity of all player actions".

- **A tier or a step says what it changes.** A Weapons or Equipment row reads
  `Mask   tier 0 → 1   range +15   400 gems`, an Attributes row
  `Strength   0 → 1   dash damage +1   1 point`: the change sits between the
  step and its price, worked out from the tier or step itself as the debug
  mode's tips are (D102 (the debug mode)), so one added or retuned says so
  with no text to edit. At the top tier nothing follows "the top". HP is full
  before a dive, so a step of max HP says only that.
- **A weapon not carried says what it is**, in its `desc` line: "slow, heavy
  shots that go through fish". The carried weapon's row has its tier to say
  instead.
- **In words** — a stat's name from `STAT_NAMES`, the words the mod cards
  use. The new names (range, damage, fire rate — the Knife's swings too —
  guard, dash speed) and the three weapons' lines are Claude's.
- **The change, not where it ends** — `range +15`, not `range 265 → 280`.
  Claude's.

**Guarded by**: `tests/home.test.js` → says in words what the next tier or
step changes — the Gun's, the Mask's and Heart's rows, the top's, each weapon
not carried showing its line, and every tier and step moving only named
stats. Seen failing before it was built, and with a stat's name, a weapon's
line, and the max-HP-only rule each taken away.

## D144 — Every moment of a dive has a sound · 2026-10-25

S7 (alpha polish)'s fifth item. Asked whether the moments silent until now
should each get a voice, Igor, 2026-10-25: "do sounds for all, no music.
leave sound design out of alpha".

- **Five new `SOUNDS`**, each one oscillator and an envelope as every other:
  `hit` for a fish hit but not killed (a kill keeps its own); `wave` as a
  batch's first fish come and as each later wave's first arrives, once a
  wave; `lead` instead of it for a batch a mini-boss or the boss leads;
  `clear` for a batch cleared; `layer` instead of it for a layer's end, the
  pick's chime following as the cards open.
- **No music, no sound design** past this synthesis, through alpha
  (`foundations.md` → non-goals). Every voice — pitch, length, shape,
  loudness — is Claude's.

**Guarded by**: `tests/combat.test.js` → what the dive sounds like — the hit
and the kill, each wave once and the lead's own, the clear and the layer's
end; each wire seen failing when taken away. `checks.js` holds every sound
loud enough to hear.

## D145 — Home from the pause menu, asked first · 2026-10-26

S7 (alpha polish)'s sixth item. Igor: "ability to go home from pause"; asked
whether it asks first, 2026-10-26: "do next item, with confirmation".

- **Go home**, on the pause menu above Quit to title, ends the dive as any
  end does: its gems banked (D67 (currency is kept on death)), the depth
  counted, the dive out of the save — `home` exists only between dives (D76
  (`home` exists only between dives)). Quit to title still keeps the dive to
  come back to.
- **Asked first**, as a new game is (D103 (new game erases the save, after a
  warning)): END THE DIVE? over the dimmed dive, saying how many gems are
  kept, Cancel marked, so a stray Enter or Esc goes back to the pause menu.
- In the debug mode it leads to the setup, as every way out of a debug dive
  does (D102 (the debug mode)).
- The pause menu's rows rise into the room its missing sub leaves, so the
  challenges under them stay clear of the hint; D146 (the catalogue)'s row
  raised them a second row.

**Guarded by**: `tests/home.test.js` → home from the pause menu — asked
first, Cancel and Esc keep the dive, confirmed it banks and goes home;
`tests/debug.test.js` → every way out of a debug dive. Each path seen failing
when broken. `checks.js` → every menu draws its rows: it watched only the
screens Back leads home from, missed this one drawn as nothing, and now
watches every menu but the setup.

## D146 — The catalogue, filled as things are met · 2026-10-26

S7 (alpha polish)'s seventh item, hints for every fish and pickup. Igor,
2026-10-26: "we need some sort of catalogue which updates on encounter. you
can do a simple version now, maybe a small popup in a status bar saying that
catalogue was updated. since enemy titles and meta are subject to change after
alpha, dont do a complex catalogue now."

- **What it holds**: every fish, then every boost (`CATALOGUE`), each with its
  `desc`, one line of what it does. A fish's line is new; a boost's is the one
  it already lands with. Mods name themselves on their cards; gems and the
  glowing fish stay the help's.
- **Met** the first time ever: a fish as it arrives, a boost as it drops. The
  save keeps the names (`meta.seen`, version 12); a version 11 save starts it
  empty, so what was met before is met again.
- **Said** in the status bar, `CATALOGUE +eel` for `NOTICE_TIME`; things met
  together share the line. Never modal (the genre contract, 5).
- **The screen**, from `home` and the pause menu: every entry in its place,
  what is not met yet `???`, so the list never reshuffles. Words only;
  pictures and animation wait (`ideas.md` → Screens).
- Room for its row: `home`'s layer list moved up under the sub, and the pause
  menu's rows rose a second row.

**Guarded by**: `tests/home.test.js` → the catalogue — every fish and boost
with a line, met once and said a moment, a boost as it drops and the line
started afresh, kept in the save, opened from both menus and left by Esc;
`tests/save.test.js` → version 11 comes in empty, `save-v12.json` loads and
plays on. Each rule seen failing when broken. `checks.js` → the catalogue ends
above the hint, beside the help.

## D147 — Home shows the kit · 2026-10-26

S7 (alpha polish)'s eighth item. Igor, 2026-10-26: "home showing your kit is
absolutely needed in alpha. what's equipped and the numbers so that a player
sees what he's diving with". Read-only, as answered 2026-10-24 ("A"): the
weapons, equipment and attributes screens stay where buying is (D96 (gear and
attributes on screens of their own), D114 (weapons and equipment on screens of
their own)).

- **What it shows**, in a column right of the rows: the carried weapon and
  its tier, each piece of equipment's tier and each attribute's steps, dim
  while unbought; then the numbers the next dive starts with, in words
  (`KIT_STATS`: max HP, guard, damage, fire rate, range, pierce, swim speed,
  dash speed, dash cooldown, dash damage — Claude's pick).
- **The numbers are the dive's own**: `kitted()` builds the diver for both
  `reset()` and `home`, so they cannot disagree.
- Every stat a weapon's tier, equipment's tier or an attribute's step moves is
  in `KIT_STATS`, so whatever is bought shows on `home`.
- `shotOf()` leaves a weapon's `desc` off the diver, as it does its name.

**Guarded by**: `tests/home.test.js` → home shows the kit — what is carried,
dim while unbought, the numbers equal to the diver `reset()` builds; every
stat a tier or step moves is named. Each seen failing when broken.
`checks.js` → the kit, at its widest, sits between the rows and the edge and
ends above the hint.

## D148 — The readout only in the debug mode · 2026-10-26

S7 (alpha polish)'s tenth item: the numbers on mod cards and the development
readout, both left on for development against D34 (mods), "revisit at S7".
Igor, 2026-10-26: "keep card numbers, readout only in debug".

- **The cards and the pickup line keep their numbers** — `swim speed 260 →
  290` beside the words — through alpha: what a pick does, said exactly, as
  `home` now says what a dive starts with (D147 (home shows the kit)). D34's
  "no number the player must compare" gives way here.
- **The readout** (`PLAYER_STATS`, D52) shows only in the debug mode (D102
  (the debug mode)); its rule that every stat a mod or boost moves is on it
  stands, for that mode.

**Guarded by**: `tests/dive.test.js` → the status bar — the readout only in
the debug mode, seen failing when shown always.

## D149 — The catalogue fills on a kill · 2026-10-26

Igor, 2026-10-26, playing alpha: "catalogue should be updated on kill, not
appearance".

- **A fish enters the catalogue when one is first killed**, not as it comes
  in; **a boost when one is first taken**, not as it drops — the same rule
  for both: met is what the diver did, not what it saw.
- The status bar's line, the screen and the save are D146 (the catalogue)'s,
  unchanged.

**Supersedes**: D146 (the catalogue)'s "a fish as it arrives, a boost as it
drops".

**Guarded by**: `tests/home.test.js` → the catalogue — a fish arriving adds
nothing and its kill adds it, a boost dropping adds nothing and taking it adds
it; each seen failing with its meeting taken away.

## D150 — S7 closes · 2026-10-26

Igor, playing its build: "we can call it alpha alright, but:" — gems and
points out of balance, a major issue; then "close s7, check plan and ideas,
decompose into tasks, start working on what can be done".

- **S7 (alpha polish) is closed, and the game is at alpha**, on Igor's word,
  its one exit. Its ten items were each built or decided, D140 (the drawn
  bump) to D148 (the readout only in the debug mode); D149 (the catalogue
  fills on a kill) came from playing it.
- **Not built, Claude's suggestions he did not take up**: a shake when a fish
  is hit and a hitstop on death (`ideas.md` → Suggested).
- **S8 (the economy: gems and points) opens** on the same word, to rework or
  retune what gems and points earn and buy (`plan.md`).
- **Its spec leaves the tree** (D134 (lean docs)).

## D151 — The bulwark bites as quick as the drifter · 2026-10-26

Igor, playing alpha: "purple guy bite should be faster, probably like other
enemies".

- **The bulwark's `windup` is 0.3s**, the drifter's, from 0.6s. Its reach,
  rest and knock stand.
- **Its threat, measured again** (`npm run measure threat bulwark`): 0.053 /
  0.085 / 0.101 by grade, from 0.062 / 0.091 / 0.125. The bot never feels the
  quicker bite — the old one measures 0.053 / 0.083 / 0.102 on the same
  build, since it steps out inside either tell. The drop is D141 (the bite's
  leap)'s: the bulwark's reach changed in S7 (alpha polish)'s first commit and
  its threat was not measured again then.
- **The pools fitted again** (`npm run measure fit`): a batch with bulwarks
  holds a fish or so more, layer by layer (`entities/layers.md`).

**Guarded by**: the threat line and the pools are measured, not picked
(D126 (threat)); `npm run balance` holds the pillars over them, not yet run on
this build.

## D152 — Nine rungs a ladder, a point a rung · 2026-10-26

Igor, playing alpha: "point upgrades come easy, at first run i earned 12
points … i couldnt get enough gems for any purchase, except a gun upgrade …
footwork still makes no sense". Settled with him one question at a time, each
on Claude's recommendation — "do recommended", "recommended", "recommended to
all": a career of about fifteen dives to buy everything, gems and points
running out together; nothing for gems once everything is bought; longer
ladders of a point a rung, attributes with a top; `footwork` replaced by a
challenge for the dash used well. The design and its check against
`foundations.md`, kept in git:
`git show cbbcf62:docs/specs/2026-10-26-s8-economy-design.md`.

**Claude's call, delegated**, open to Igor:
- **Nine rungs a ladder, each paying one point**: 45 ever. Rungs sized on the
  career bot over fifteen fresh dives (D50 (the bot measures its own policy)):
  about 2 rungs on a first dive, about 3 a dive to the fifth, about 22 by the
  fifteenth, where the bot's best stopped growing; the rest is for a player's
  skill. `swift` reads its rungs as minutes and seconds.
- **`bowling` replaces `footwork`**: "dash through N fish at once", the fish one
  dash shoves, each once, 4 to 12; a hand-placed fish counts for none.
- **Each attribute stops at five steps** (`max`): step n still costs n, so the
  fifteen steps cost the 45 points.
- **Prices: cheap first tiers, dear tops.** First tiers 150–250 gems, so the
  bot's first dive buys three things; top tiers 2,600–4,000. Everything — all
  three weapons, their tiers and the equipment — costs 30,650, from 25,280; the
  bot buys its kit by the ninth dive and could buy everything by the
  fourteenth. Gems per depth unchanged: the prices alone fit.
- **The save goes to version 13**: a ladder's rungs re-counted by the old top
  rung's threshold met, `footwork`'s dropped, every step back as points.

**Supersedes** D109 (micro-tasks are ladders; steps cost more as they rise)'s
four rungs, rung k paying k, `footwork`, and attributes without a top; the
rest of D109 stands. Ends `ideas.md`'s `footwork` and the rungs on the
shorter dive.

**Guarded by**: `tests/challenges.test.js` — every rung read from the code,
`bowling` counting one dash; `tests/home.test.js` — an attribute's top;
`tests/save.test.js` — the re-count and the v13 fixture.

## D153 — The economy stage closes · 2026-10-26

Igor, on its build: "hard to say, requires more playtest time. let's move on".

- **S8 (the economy: gems and points) is closed** on his word, its exit — Igor
  saying gems and points are in balance — **not met but deferred**: built as
  D152 (nine rungs a ladder, a point a rung), the career bot's figures
  (`roadmap.md` → Health), the verdict waiting on more play (`ideas.md` → Open
  — from playing alpha).
- **No stage follows yet**: `plan.md` names none past this one; which comes
  next is Igor's.
- **Its spec leaves the tree** (D134 (lean docs)).

## D154 — The port waits on the browser's limits · 2026-10-26

Igor, offered the native port now that alpha is reached (D150 (S7 closes)):
"we continue in the browser. the port is not worth now, we transition when
browser is not enough for implementing all i want".

- **The work goes on in the browser past alpha.** The port comes when
  something Igor wants cannot be built in it — not at a stage boundary.
- **D17 (the browser build is a throwaway prototype) and D30 (browser stays
  throwaway) stand** but for their timing: the build is still the prototype,
  the `game/` ⁄ `platform/` seam is still kept for the port, and the canvas
  still gets no investment beyond what a stage needs.
- **Supersedes** D30's "alpha is built in the browser and ported afterwards"
  as a schedule; `foundations.md` → Non-goals says so.

## D155 — Six gates a layer, each layer's draws its own · 2026-10-28

Igor, on the S9 (the balance rework) spec: "10 min is fine, let's keep it
minimal. make sure it is still scalable", then the recommended option, fewer
gates with the same fights, over "ten gates, every fight half as long".

- **Six gates a layer**: a batch, a mini-boss, a batch, a mini-boss, a batch,
  the boss. Each stretch draws one batch of its pool instead of 3 / 2 / 2.
  The threat targets are per stretch, so every fight keeps its old target.
- **Each layer carries its own draws**: `layer()` takes them as data and
  builds a stretch and its mini-boss for every pool, the last pool's closed by
  the boss — a layer may differ in length, and more pools need no code.
- **A full dive of about 10 minutes**, split about 2 / 3 / 5 by layer —
  Claude's split. `foundations.md` → Pillars, "Dives are a session", goes
  from 4–8 to 2–5 minutes a layer.
- **Supersedes** D137 (batches grow from seconds to a minute and a half)'s ten
  gates a layer; its curve stands. Guarded by `tests/dive.test.js`.

## D156 — The boss's shell and stages · 2026-10-28

Igor: "bosses are too easy and annoying - you just stand near and fire until
its huge hp numbers are gone". Then, on the reading (`reading.md` → Bosses):
"complete everything according to what you learned from the book". The shape
and every number are Claude's.

- **A shell**: the boss and the mini-boss shrug off every shot, cut and dash
  — a clink, and the bot looks elsewhere — but in the rest after each attack,
  the opening, now 1.5s from 0.9s. Standing near and firing does nothing; the
  answer is to dodge, then punish. The mini-boss teaches the opening as it
  teaches the tell.
- **Stages**: the boss fights a round of attacks a stage, an even share of
  its hp each — lunges; a lunge and a fan in turn; two lunges to a fan. No
  wound carries it past a stage's floor, and a new stage shuts it at once, so
  each stage needs an opening of its own however strong the kit.
- **Hp to fit**: the boss 100 to 30, the mini-boss 20 to 10.
- **A fish alive in a saved dive keeps its record**: no shell and no stages, so
  an old boss only lunges; no save version.
- `foundations.md` → the glossary's boss and mini-boss say so.
- **Supersedes** D117 (the boss's fan)'s fan "in turn with every lunge":
  where it fans is now its stages'. Guarded by `tests/boss.test.js`.


## D157 — The archer counts twice what the bot measures · 2026-10-28

Igor: "archer needs to have more threat", then: "i meant that compared to
other enemies archer felt harder to beat". So its `threat` — what the plan
sizes a batch by (D126 (threat)) — was too low, and a batch with archers
came out harder than its stretch. Its behaviour stays.

- **The archer's threat is twice the bot's measure**, [0.034, 0.056, 0.064]:
  Igor's pick of "harder than the drifter and the darter only", which keeps
  it under the bulwark at every grade. The bot reads every shot as it leaves
  the mouth, and at grade 1 hardly a fish touches it, so it cannot see what
  a player does. The one threat set from play, not the fit.
- **The pools refitted** (`npm run measure fit`): about half the archers.
- Guarded by `tests/dive.test.js` (pools under their stretch) and the
  archer's row in `entities/enemies.md` → Threat.

## D158 — Prices in reach, ladders a dive long · 2026-10-28

Igor, 2026-10-27: "impossible to quickly earn gems for upgrades, upgrades
feel useless, points are near to impossible to get". The reading
(`reading.md` → Dives, Upgrades): many small gains over one big price, and an
upgrade the player can feel. The numbers are Claude's.

- **Prices flattened**: a top tier about six times its first, not twenty —
  the Gun 150, 400, 900; all twelve tiers of the Gun and the equipment from
  18,050 gems to about 6,500, what a winning career earns. The career bot
  buys one or two tiers almost every dive and wins on dive 6–8 holding 8–9.
- **The Mask's step 15 to 30**: at the top the Gun reaches 340, far past the
  archer's 240 — a step you can see.
- **Streak ladders fit one dive**, since a dive is 18 gates (D155 (six gates a
  layer)): `untouched` tops at every gate unhit, 18; `beeline` at every
  glowing fish first, 9; `swift` scaled to the shorter layer, 2:15 to 1:05.
  Rungs met in a save stay met. Guarded by `tests/challenges.test.js`.
- **Supersedes** D152 (nine rungs a ladder, a point a rung)'s rungs for
  `untouched`, `beeline` and `swift`, and the prices of D136 (prices halved)
  and D137 (batches grow from seconds to a minute and a half).

## D159 — The archer holds its ground; the mini-boss pays 10 · 2026-10-28

Igor, on his play of S9 (the balance rework): "archer should not escape
player, leave that mechanic for a more advanced enemy", and "miniboss threat
is enough to pay at least 10 gems".

- **The archer closes to its `range` and holds there**, never backing away;
  `near` is gone with the back-off. Running from the diver is kept for a
  fish of its own (`ideas.md` → A shooter that flees). Its threat stays
  D157 (the archer counts twice what the bot measures)'s, not re-measured.
- **The mini-boss's `value` 5 to 10**, times its grade's; the boss's 30 to
  40, so its haul stays over three times any other fish's (D68 (the layer
  end is a milestone)).
- **Supersedes** D95 (three enemy behaviours, and one way to be hurt)'s
  "backs off inside its band". Guarded by `tests/enemies.test.js`.

## D160 — A layer-1 dive buys a thing every two · 2026-10-28

Igor, after three fresh dives that died in layer 1 for 75, 75 and 40 gems
and points only on the first: "every two is fine, depending on skill.
consider me as mid-to-high skilled guy". The bot outearns him about tenfold,
so the economy is set on his play, not the bot's.

- **The target**: a mid-to-high skilled player whose dives die in layer 1
  buys a tier or an attribute step about every two dives.
- **Every first tier 150 gems** — the Suit's from 250, the Weights' from 200.
- **The lowest rungs gentler**, the tops kept: `untouched` from 3 batches,
  `flurry` from 5 kills, `bowling` from 3 fish. Claude's picks, for Igor's
  play to confirm.
- **Supersedes** those prices and rungs of D158 (prices in reach, ladders a
  dive long).

## D161 — Depth pays points · 2026-10-28

Igor: "points are still earned god knows how, so think about mechanics", and
the target "the whole game … finishable in [about 15–20] min and all upgrades
need to be purchased". Asked, he took depth and the challenges together.

- **`depth`, a sixth challenge**: a rung for each gate one dive clears, 18,
  each paid once ever — so the deepest dive yet pays a point a gate past the
  last best. One dive's feat, so the ladder machinery holds it whole.
- **The five others four rungs each**, their bottoms where a dive that dies
  in layer 1 meets them: 38 points in the game.
- **Attributes stop at four steps**, step n still n points: 30 for all.
  More than depth pays, so the win with everything bought takes challenges.
- **Save v14**: a ladder keeps the rungs that still fit, a cleared layer
  counts its six gates as depth, every step comes back as points.
- **Supersedes** D152 (nine rungs a ladder, a point a rung)'s nine rungs
  and D158 (prices in reach, ladders a dive long)'s streak tops of a whole
  dive.

## D162 — The whole game in fifteen to twenty minutes · 2026-10-28

Igor: "at this point the whole game should be finishable in 10-15 min and all
upgrades need to be purchased", then "maybe 20 min ok, 10 is too short
really"; asked, the clock runs from New game to the win, deaths included.
"not suggesting to dump all and start from scratch".

- **A flatter dive**: `THREAT_RISE` 1.8 to 1.6, the pools refitted. The
  deepest ordinary batch about 43s on the bot, not 65; the fights about
  127 / 183 / 233s, a dive of about 9 minutes, and no batch lost on the bot.
  The bosses keep their numbers — Igor found them "hard but good".
- **Every weapon, tier and piece bought by the win**: all gear 1380 gems,
  down from 12150 — more than one dive's 1181, within what dying once in
  each layer banks (1844), which `tests/home.test.js` holds. Fish keep their
  values: each gem is a pickup on screen.
- **The pillars**: a batch grows to about 45s, a layer 2–4 minutes, a dive
  about 8, the game 15–20. The bar on the deepest batch moves from over 60s
  to over 30s.
- **Supersedes** D137 (batches grow from seconds to a minute and a half)'s
  ninety seconds, D158 (prices in reach, ladders a dive long)'s and D160 (a
  layer-1 dive buys a thing every two)'s prices.

## D163 — The career log · 2026-10-28

Igor, asked to note each dive of a play-test: "maybe dump a debug file every
dive? … then i can do playthrough, you analyze", and "keep it in project dir,
easier to cleanup".

- **The save keeps a line a dive** (`meta.log`), written as the dive ends:
  how it ended, seed, time, gates cleared, gems, kills, mods, and the gear,
  steps, rungs, points and bank it ended with. New game empties it. Igor:
  "also record maximum data possible" — so each line carries the dive's
  `story` too, a record a gate from its arrival to the next: fish, time, the
  hits and what dealt them, the guard, HP, kills, shots, dashes, boosts, mod;
  and `bought`, what `home` bought and carried before it, in order, priced.
- **`npm run play` serves the game at `http://localhost:8765/`** and writes
  what it sends back to `logs/career.json`, ignored by git: one command, one
  link, and no way to play there unlogged. A browser cannot write into the
  project on its own; the game still runs from a double-click without it.
  Igor: "make our lives simpler always".
- No clock in the save: a replayed dive must save the same bytes (D70 (the
  dive, as data)). The server stamps each dive's arrival in
  `logs/clock.txt`, so the career's length counts `home` too.

## D164 — Sonar, the play-test system · 2026-10-28

Igor, after the first logged career: "develop a real-player debug system that
would boost the game development in terms of rapid real player playthrough
data analysis", its requirements in `specs/2026-10-28-sonar-brief.md`, and
"its own stage": S10 (Sonar), opened beside S9 (the balance rework). The
design is `specs/2026-10-28-sonar-design.md`.

- **A play is recorded as its input** — the seam's `keys`, `justPressed` and
  `aim` a frame at a time, and the seeds new dives draw — and **replayed** to
  rebuild everything else: every moment, the state at any tick, a picture of
  any of them. The game is deterministic (D53 (fixed timestep), D70 (a dive
  can be saved at any point)), so nothing has to be chosen in advance — Igor:
  "gather everything possible".
- **A play-test** has a purpose, a start (a debug setup or a save, never
  Igor's own), a limit that only draws, and measures; no pass or fail —
  Igor: "it's a way to communicate real player experience to you". Each page
  load is a play of its own, with the build copied beside it; one play-test
  may be played many times — Igor: "the same play may not provide the same
  output".
- **One command** (Igor: "i only need clear cli commands"): `npm run play`,
  then `?sonar=<id>`. `npm run sonar` reads one back.
- **A skill, not an agent** (Igor: "your way"): `.claude/skills/sonar/` sets
  a play-test up whenever a change needs Igor's play, and reads it back.
- **Claude's picks**: the data in `logs/sonar/`, ignored by git; pictures
  drawn on replay, never taken during play; a probe a second, sent every two.

**Guarded by**: `tests/sonar.test.js` — a recorded play, through the menus
and a debug setup, replays to the same game; presses in a frame with no tick;
seeds drawn at random; a replay gone off its recording names the tick; the
limit changes no game state.

## D165 — Play-tests in one file, the logs disposable · 2026-10-30

Igor, on the tree: "what's committed, doesnt need subfolders. logs dir can
contain temporary items to be cleaned up etc. make it simple enough and easy
to navigate. dont create stuff in repo unless required".

- Every play-test's setup is a record of `tests/playtests.json`, under its id
  — one committed file, beside the play server and the reader that use it.
- `logs/` is ignored whole, and safe to delete: the career log, and each
  play-test's plays and reading in `logs/<id>/`.
- One local server, `npm run play`, which forbids caching; `serve.py`, from
  D41 (seeded RNG, and a dev server that cannot cache), is gone: Node answers
  every request on one loop, so a held connection blocks nothing either.

**Supersedes** D164 (Sonar)'s pick of `logs/sonar/<id>/test.json`.

**Guarded by**: `tests/sonar.test.js` — every play-test in the file has its
purpose, start and play, and its debug setup names nothing the game ignores.

## D166 — The puffer's burst stays; guide lines are no promise · 2026-10-30

Two of Igor's deaths to the puffer came with his centre just outside the
drawn ring — the burst reaches the diver's edge, 20px past it — and the ring
starts faint (`playtests.md` → The threat unit by hand, at the unit).
Proposed: a burst hurts only a centre inside the ring, and the ring drawn
strong from its first tick. Igor: "no. and keep in mind that when real images
come, rings and other guide lines might become invisible (not necessarily
tho), and the player will have to adapt".

**Decided, by Igor.** The burst and its ring stay as they are. A guide line —
a ring, a wind-up's stroke — is a prototype's aid, not a promise of where an
attack reaches: real art may drop it, and then the player reads the fish.
A play lost at a guide line's edge is read as the player learning the fish,
not as the game misleading; a fix is never sized to the line.

## D167 — The puffer counts more, and gates carry fewer · 2026-10-30

The puffer cost Igor far more than its threat says: both `unit-puffers`
deaths, three of layer 2's four hits in `layer-jump`, and two puffer hits
again once he knew the burst's reach — then with two or three swelling at
once (`playtests.md` → The puffer, learned). The bot reads the burst's reach
and turns in 0.1s. Offered a puffer that waits to swell while a neighbour
swells, a heavier threat, or more play first, Igor: "i think B is the right
choice here. taking turns would look unnatural". Then, told a heavier
puffer shrinks its gates below layer 1's — against D137 (batches grow from
seconds to a minute and a half)'s "more enemies" — he took the
recommendation: fewer puffers, the gates' fish kept.

- **The puffer's threat is 1.4 times the bot's measure**, [0.113, 0.183,
  0.258]: Claude's pick, the most that keeps it under the eel, which a later
  stretch brings — the rule that harder fish come later. The second threat
  set from play, after D157 (the archer counts twice what the bot measures).
- **Its pool batches keep about half their puffers**, and their other fish
  grow, mix kept — in layer 3 all but the eels, which stay as they were — to
  sit under the stretch and reach it as the fit requires; where half leaves
  too little to reach — puffers with darters only — the fewest puffers that
  keep the batch within half again its fish. Claude's picks. Puffers across
  the pools 136 to 77; a layer-2 batch about 14 fish, up from 13, a layer-1
  one 12. The eels were first grown with the rest, and `eels-deep` cost Igor
  6 HP where `gun-deep` cost 4, three of four hits by eels
  (`playtests.md` → Fewer puffers).
- **Not refitted** by `npm run measure fit`, which drifts on every run
  (`bugs.md`): every other batch is as it was.
- **The bot cannot tell** (`npm run measure pillars`, ten careers): a layer's
  hearts move by several between two runs of the same pools, as careers
  reach it with other kits; layer 3's 25.5 hearts before, 22.9 after.
- `tests/dive.test.js`'s status-bar check reads layer 3's first batch:
  layer 2's no longer comes in waves.

**Guarded by** `tests/dive.test.js` (pools under their stretch and able to
reach it; each layer more fish than the last; harder types later) and the
puffer's row in `entities/enemies.md` → Threat.

## D168 — The guard lasts two gates · 2026-10-30

Igor's second career (`playtests.md` → A whole career, after the puffer)
won on Suit 3 again: the guard took 16 of the winning dive's 18 hits, as it
took all 11 of the first career's; unguarded, those hits were more than his
HP. Igor: "overall feels good, but i gained guard and hp bonuses which
allowed me to take a lot of damage and not die". Offered the guard refilled
every other gate, once a layer, or left: "do your recommended adjustment".

- **The guard refills as the first gate of each pair arrives** — gates 1, 3
  and 5 of a layer — not every gate: Suit 3 takes three hits for two gates.
  Claude's pick. On the winning dive's hits it would have let about four
  more through, most in layer 3: a finish on 1–2 HP, not 5.
- The tiers and prices stand: the Suit still gives one hit a tier.
- The career bot still wins on dive 2 or 3 (`npm run measure careers`).

**Guarded by** `tests/combat.test.js` — the guard refills at the third gate
and the fifth, not the second or the fourth.

## D169 — A task runs until only Igor's answers are left · 2026-10-30

Igor, after asking three times whether everything that needed no input was
done: "if i give you a task, finish the task. do the necessary checks", then
"add a self-check to rules. requirement: reprompt of the same thing doesnt
yield new info or results".

- **Every item in reach is walked before a reply that asks or stops** — the
  task's plan, `roadmap.md` → Next, `bugs.md` → Open, a spec's proposals
  whose time has come — and the part of each that needs no input is done in
  that turn. Its plan and progress log live in the scratch space from the
  first step.
- **The self-check**: were the same prompt sent again, would the next turn
  find anything new? A yes is done before the reply goes out.

**Guarded by**: nothing a machine can see — it is how the work is done
(`working.md` → Questions and uncertainty).

## D170 — The Knife's lead closes by the fish it meets · 2026-10-30

The Knife carries layer 3 at every kit measured — up to seven fish a cut,
nothing to miss (`roadmap.md` → Health, the weapons). Most of the gap is the
eel: it sways, so a shot misses it, and its touch lands on the Gun and the
Harpoon, while the Knife's arc needs no aim. Layer 3 punishes fighting from
afar, and nothing in it fighting up close. Claude offered (a) a fish whose
answer is distance, (b) the Knife cut down, (c) the lead left. Igor: "do
recommended (a) for the knife".

- **The Knife stays as it is.** Layer 3 gets a fish whose answer is
  distance; which fish is open (`ideas.md` → Fish ideas).
- **Not by raising the Gun and the Harpoon**: Igor's winning dives were
  already a stroll (`ideas.md` → The economy and the fights).

**Guarded by**: nothing yet — the fish brings its checks; `npm run measure
weapons <a kit's code>` reads the lead, and what deals each hit.

## D171 — The lionfish · 2026-10-30

D170 (the Knife's lead closes by the fish it meets) wanted a fish whose
answer is distance. Of Claude's three, Igor took the spines always out: "do
(a)", then "make sure it's not impossible to kill with a knife, only harder
then others".

- **Spines**: a hit landing on it — a shot, a cut, a splash — while the
  diver's body is within their `reach` of its own stings the diver for their
  `damage`. Out of that reach a hit costs nothing; the dash's invulnerability
  takes the sting, so a dash that deals damage (D51 (the dash is bought,
  and the offer waits for the death)) kills it unhurt. It chases and has no attack
  of its own.
- **Never out of the Knife's reach**: the spines' reach sits under the
  Knife's shortest cut, so the end of the blade always strikes it unstung.
  Harder for the Knife — never a cut into the crowd round it — not barred.
- **The diver bot reads it** as a player would: it keeps the reach as room,
  and fires nothing that would sting — the cut held while a lionfish is near
  and in its arc. Its threat is measured with that bot.
- **Met first in layer 3, past the threat order.** Its threat, measured with
  the Gun, which barely meets its spines, is the archer's, and would place
  it in layer 1, where the Knife is short and every stretch already brings a
  type. Claude offered it so; Igor: "recommended". A type built against one
  weapon names it in `against`, and the pools bring it where it counters
  that weapon. One new type a stretch still holds: it comes in layer 3's
  second stretch, after the eel's.
- **Four of layer 3's fifteen batches**: it evens the Knife where a Gun
  career meets layer 3, and keeps every weapon from being better than
  another at everything; seven break that. It leaves the late kit's lead —
  the Mask's reach outreaches the spines — to be closed by something else
  (`roadmap.md` → Health).
- Every number is Claude's pick.

**Amends** D130 (fish are revealed a type at a time): a type with `against`
is left out of the threat order.

**Guarded by**: `tests/enemies.test.js` — a hit within the reach stings and
one beyond does not; the dash kills it unstung; a Knife cut from the end of
its shortest reach lands unstung, one from close stings; `tests/dive.test.js`
— the reveal, the threat order but for a type with `against`.

## D172 — The end screen marks what home can buy · 2026-10-31

A new player's session (`playtests.md` → A new player's session): five of
the first seven deaths dived again, and 119 gems and 4 points were banked by
the first visit home. Claude offered the death screen saying what waits
there, and a gentler opening. Igor: "the death screen shows whether any
purchase is available, like a red notification dot or something, optionally
the resources available"; the opening "not needed now".

- **Go home on the death and the win screens carries a red dot** when the
  bank or the points can buy something at `home`: a weapon, a tier of the
  one carried, an equipment tier, an attribute step. Equipping a weapon
  already owned is free, so it is not one.
- **Beside it, what they hold**: "Go home   119 gems, 4 points", either left
  out at none. Without the dot the row reads Go home.
- **Not in a debug dive**, whose save is a throwaway (D102 (the debug
  mode)); and not on the pause menu's Go home, whose bank lacks the dive's
  gems.
- Where the dot sits, its colour and the words are Claude's; placeholder
  graphics.

**Guarded by**: `tests/dive.test.js` — no dot with nothing to buy; the dot
and the gems at the Gun's first tier; the dot and a point at an attribute's
first step; none in a debug dive.

## D173 — The sting is drawn, the ring kept · 2026-10-31

`lionfish`'s second play (`playtests.md` → The lionfish, against a short
Knife): two stings; before each the ring had shown about 0.3s, and one
followed a press as a lionfish crossed the ring's outer edge, the cut firing
short. Claude asked whether the stings were seen coming, and offered the
ring fading in from the cut's reach instead. Igor: "you need to keep rings
and draw stings".

- **The ring stays as drawn** in D171 (the lionfish): fading in over the 60
  px before the reach, bright inside.
- **Every hit flies the spines off**: the twelve leave the fish and fly out
  to the ring of its reach in a fifth of a second, there to vanish, and the
  fish's own regrow over half a second. The ring is how far they fly; a
  diver inside it is stung, as D171 (the lionfish) has it — the rule is
  unchanged, the drawing shows it. Particles, so they fly on from a fish the
  cut killed. Igor: "stings never come off the fish. they need to fly up to
  the red circle and the regrow".
- **Drawn twice before, and lost.** First as three spines from the fish to
  the diver: a sting lands up close — 0 to 39 px in every play — so the
  lines were about 40 px long, from a fish already dead, under the cut's
  wedge, the death burst and the hurt sparks (`lionfish`'s third play; Igor:
  "i dont see stings off the lionfish"). Then as a star out to the ring, but
  still only for a sting that hurt: `lionfish`'s fourth play cut inside the
  reach three times, each in the blink after an eel's bite, and nothing was
  drawn at all.
- **The regrowth is only drawn**: a fish hit again while regrowing flies
  its spines again and stings as ever. Whether a bare fish should be
  harmless is a rule, asked of Igor.
- No rng: drawing it moves no random draw after it.
- Its shape, colour and times are Claude's; placeholder graphics.

**Guarded by**: `tests/enemies.test.js` — twelve spines out to the ring and
the fish left bare, on a hit inside the reach, outside it, and in the blink
of a hit.

## D174 — The lionfish fires its spines · 2026-10-31

Asked what the red ring is for and what should make the spines fly — when
the fish is hit, or by itself — Igor: "i meant (b) from the start. you come
into the ring, after a short delay it fires".

- **A diver in the ring of the reach cocks the spines**; after `delay` they
  fly out to the ring, stinging a diver still inside. Once cocked they fly,
  whoever has left. Bare, they regrow over `regrow`, and cock again only
  regrown.
- **A hit on it stings nothing.** Supersedes D171 (the lionfish)'s sting on
  a hit landing close, and D173 (the sting is drawn, the ring kept)'s spines
  flying on every hit: they fly when they fire, and a bare fish cannot.
- **It swims on through its tell**, the spines bristling as they cock; the
  puffer must chase first, stops and swells, and bursts once a fuse (D106
  (the puffer bursts and comes on again)).
- **The reach stays under the Knife's shortest cut**: the end of its blade
  never enters the ring (Igor, for D171 (the lionfish): "make sure it's not
  impossible to kill with a knife, only harder").
- **The ring is drawn where the spines stop**, the reach past the fish's
  body, so a body touching it is in. It was drawn where the diver's centre
  would be, half a body out, and the spines would have flown into a diver
  they did not sting.
- `delay` 0.4s and `regrow` 1s are Claude's picks, and its threat is
  measured anew; placeholder graphics.

**Guarded by**: `tests/enemies.test.js` — cocked in the ring and stinging
inside after the delay, the spines out to the ring; flying once cocked
though the diver left, cocking again only regrown; the Knife's far-end cut
outside the ring, a hit from inside stinging nothing; the dash killing it
unstung.

## D175 — The lionfish drifts, its circle past the Knife's cut · 2026-10-31

Firing by itself, D174 (the lionfish fires its spines), and chasing, the
lionfish pressed every weapon, the Gun most, and the Knife still dominated
layer 3 at the kit a Gun career meets it with. Claude offered it drifting,
its circle past the short Knife's cut, the one shape measured to single out
the Knife. Igor: "recommended".

- **It drifts**, `speed` 30 against 80: a weapon that fights from afar
  shoots it without meeting its circle.
- **Its `reach` passes the Mask-less Knife's 70 px cut**, 80 against 40, so
  the Knife comes in, cuts, and gets out within the delay. Supersedes D174's
  reach under the Knife's shortest cut; the delay now keeps the Knife's kill
  possible, D171 (the lionfish)'s "not impossible ... only harder".
- **The Knife's bot darts in**: an armed circle costs a blade nothing to
  enter, a cocked one does; a shooting bot keeps out of both. Kept out, the
  Knife's cleared none of `lionfish-fires`' gate in 150s; darting, all eight
  in 31.4s, nothing lost.
- Its threat, measured, falls to 0.022 at grade 1, and the fit adds a fish
  or two to three of its batches. At the kit a Gun career meets layer 3
  with, the Knife 33.3s / 2.65 hearts, the Gun 45.45 / 5.79, the Harpoon
  42.37 / 4.08; the bar holds over layers 2 and 3 (`roadmap.md` → Health).
- `speed` and `reach` are Claude's picks.

**Guarded by**: `tests/enemies.test.js` — the Knife cuts it from inside the
circle and swims out unstung before the spines fly; a delay too short to get
out in fails it.

## D176 — The spines sting by touch · 2026-10-31

In `lionfish-fires`' first play the fired spines stung any diver whose body
overlapped the circle: twice Igor was stung with his diver's centre outside
it, 109 and 115 px from the fish, the circle drawn at 100. Igor: "it damages
although i get off the range. fix", "spikes should do the damage, not the
fact that i'm in the circle", and "that's the whole difference with the
puffer damaging behavior".

- **Each spine is a shot**: the twelve fly out from the fish to the
  circle as enemy shots, the archer's spit's kind, and sting only the diver
  one touches. Supersedes D174 (the lionfish fires its spines)'s sting of
  whatever is inside the circle; coming into the circle still cocks them.
- **The puffer's burst hurts by area, the lionfish's spines by touch**: a
  diver inside the circle between two spines goes unstung.
- Drawn as the shot flies, its tip where it stings, so the sting is seen
  where it lands; replaces D173 (the sting is drawn, the ring kept)'s
  drawn-only flight.
- The spine's `speed` 400 (out to the circle in 0.25s), its `r` 2 and the
  `count` 12 are Claude's picks; its threat, measured, falls to 0.021 at
  grade 1.

**Guarded by**: `tests/enemies.test.js` — a diver on a spine's line is
stung once it arrives, one between two inside the circle is not; stinging
whatever is inside the circle fails both.

## D177 — The career log is retired · 2026-10-31

Claude, 2026-10-28, in S10 (Sonar): a play-test from a save records all the
career log does and more. Igor, 2026-10-31: "Retire the career log - do this
now".

- **The save keeps no career**: `meta.log` is gone, and with it a save that
  grew a line a dive. Version 15; a v14 save loses its log on load.
- **`npm run play` writes only Sonar's plays**: no `logs/career.json`, no
  `logs/clock.txt`. A career to read is a play-test from New game.
- What Sonar reads stays: the dive's `story`, a gate a record, and
  `meta.bought`, what `home` bought since the last dive ended.

**Supersedes** D163 (the career log).

**Guarded by**: `tests/save.test.js` — a v14 save's log is dropped and none
is written again; the version 15 fixture loads and plays on; `bought` lists
each purchase until the next dive ends; the story tells each gate's fish,
time, kills and hits.

## D178 — A cleanup, and Igor's own words · 2026-10-31

Igor: "the cleanup for all docs and keeping all files neat. what i want from
you - a skill that does a cleanup, throws away unneded stuff that bloats
context, checks contradictions, keeps docs organized", and "browse through
certain project sessions, when you lack info on subject, get my messages
from chat history and add it to context IF it fits".

- **`abyss-tidy`**, a skill: the whole tree at once — history out of the
  living docs, answered items out, one home per fact, contradictions raised,
  memory, skills and files checked, the most-loaded context first. It
  applies the rules `docs/README.md` and `working.md` already hold, and adds
  none; what needs a judgement is raised, never done alone.
- **`igor-said`**, a skill: a search of Igor's typed messages in this
  project's past sessions, with the reply each answered. Used when a subject
  needs his words and the docs lack them; only what fits comes in, quoted and
  dated, and the docs still outrank it.

**Guarded by**: nothing; neither changes the game.

## D179 — The guard lasts a layer · 2026-10-31

The guard lasting two gates, D168 (the guard lasts two gates), played: layer
3 whole, "broken: still a stroll" — hits by gate 0, 0, 2, 1, 2, 1, never
more in two gates than the Suit's three (`playtests.md` → The guard, two
gates long). Igor: "fix knife and guard with totally your approach".

- **The guard comes back whole only at the layer end**, with the heal; a
  dive starts with it whole. Suit 3 takes three hits a layer. Claude's pick,
  after the shields of other action roguelites: a hit a room (The Binding
  of Isaac's Holy Mantle), armor that never refills (Enter the Gungeon), a
  shield back after seconds unhurt (Risk of Rain 2). A layer is the
  longest stretch here that already ends in a refill, the heal's.
- On that play's hits it would have let three through, all in the last two
  gates: a careful layer keeps the guard for the boss, a careless one meets
  the boss without it.
- The tiers and prices stand.
- The bot cannot see it: `measure weapons` fights one batch from a whole
  guard, and the career bot is hit too seldom — it still wins on dive 2 or
  3 (`roadmap.md` → Health).

**Supersedes** D168 (the guard lasts two gates)'s refill at the first gate
of each pair.

**Guarded by** `tests/combat.test.js` — no gate along a layer refills it,
the boss's included; the layer end does, with the heal.

## D180 — The Mask lengthens a shot, not a cut · 2026-10-31

Igor played the deepest lionfish batch with each weapon (`playtests.md` →
Three weapons among lionfish), and the Knife led: "insane aoe damage in a
huge arc, fast repeating swings, enemies die in batches easily. especially
helpful against the annoying green ones that have hardly predictable
trajectory (for a human player)". The arc was the Mask's: its +30 a tier
lengthened a cut as much as a shot, and at Mask 3 took the Knife's past the
lionfish's circle, which D175 (the lionfish drifts, its circle past the
Knife's cut) set against the cut without it. Melee pays for its reward by
coming close; a cut that reaches as far as the spines stopped paying.

- **The Mask adds range to the Gun and the Harpoon only**; the Knife's
  reach is its own and its tiers'. While the Knife is carried, the Mask's
  row at `home` and its debug tip say "nothing for the Knife". Claude's
  pick.
- The prices and tiers stand: the Mask is bought for the other weapons.
- The bot's gap does not close by it: at the lion batch's kit its Knife
  loses a little, its Gun and Harpoon nothing (`roadmap.md` → Health). The
  bot reads the rest as the eel's; a slower sway is proposed (`ideas.md` →
  Every weapon tried and raised).

**Guarded by** `tests/home.test.js` — Mask 3 adds 90 to the Gun's and the
Harpoon's range and nothing to the Knife's, and the row says so;
`tests/debug.test.js` — the tip.

## D181 — The Mask widens the Knife's cut · 2026-11-01

D180 (the Mask lengthens a shot, not a cut) left the Mask nothing for the
Knife, and `home` said so. Igor: "nothing for the knife in upgrades - a big
no-no. this fucks up game design fundamentally. make some small improvement
at least". A longer cut cannot be it: the Knife cuts a lionfish from 110 px
centre to centre and its spines sting from 122, so 13 px of reach more —
under half a Mask tier's 30 — puts the cut past the ring again, which D175
(the lionfish drifts, its circle past the Knife's cut) set it inside.
`lion-knife-short` showed the short cut did no worse for Igor
(`playtests.md` → The Knife's own reach).

- **The Mask widens the Knife's arc, 10° a tier** — 60° bare, 90° at Mask
  3: you see wider, so you cut wider. Its reach stays its own and its
  tiers'. The Gun and the Harpoon still get 30 px of range a tier. Claude's
  pick: a step that can be seen, at a third of the area the cut covered
  when the Mask lengthened it.
- The arc is the diver's own number, `arc`, beside `range`, as the shots'
  numbers are: `home` shows it in the kit while the Knife is carried, and
  the Mask's row says "arc +10". The kit's lines close up a pixel, so the
  Knife's longer list still ends above the hint.
- A dive saved before it takes its arc from its weapon (save version 16).
- **Every buy does something for the weapon carried**, Igor's rule from
  this: each tier of every weapon and piece of equipment, and each step of
  every attribute, moves a number whichever weapon is carried.

Supersedes D180's "nothing for the Knife".

**Guarded by** `tests/home.test.js` — Mask 3 adds 30° to the Knife's arc
and no range, and 90 px to the shots; a fish 35° past the bare arc's edge
is cut only by the wider one; every tier and step moves something for each
weapon; `tests/save.test.js` — a version-15 Knife dive loads with its arc.

## D182 — The Harpoon a railgun · 2026-11-01

Igor, having played it: "harpoon: hard to use in early game (aiming), gets a
bit better later via crowd destroying. still couldnt beat the game at it max
stats. not impossible, but hard. doesnt fit game dynamics now. probably
increase fire rate x1.5, increase bullet speed like x3 (my feeling), like a
true railgun".

- **Its shot flies at 3300 px/s, not 950**: across its 420 px range before
  an eel swimming straight across, 130 px/s, leaves the line — 17 px
  between the shot's body and the eel's, so 3212 at least. A fish is hit
  where it is aimed at, never ahead of it; only the eel's sway still moves
  it off (`ideas.md` → Every weapon tried and raised). Claude's pick,
  worked out from the eel: Igor's ×3, 2850, misses it at the range's end.
  A shot draws as 0.035s of its flight, so the Harpoon's is a 115 px
  streak.
- **Its fire rate stands.** With the rate ×1.5 as well, the bot's Harpoon
  is better than the Gun and the Knife at everything over layers 2 and 3,
  and every career the bot plays with it wins on dive 2 (`roadmap.md` →
  Health). The rate waits on Igor's play of the faster shot.
- **It breaks a bar, knowingly.** The faster shot alone makes the bot's
  Harpoon quicker and safer than its Gun over layers 2 and 3 together, so
  no weapon dominating (D127 (the tuned numbers)) fails on "Harpoon over
  Gun" (`bugs.md`); the Gun is still ahead in layer 1 and level in layer 2.
  Kept, because the Gun's loss is the eel's — its slow shot misses the
  sway most — and the slower eel proposed answers it (`ideas.md` → Every
  weapon tried and raised); the bot aims ahead perfectly, and a human
  aiming straight gains more from the faster shot than it does.
- Its `desc`: "few heavy shots, fast, that go through fish".

**Guarded by** `tests/home.test.js` — a shot aimed straight at an eel
crossing 400 px off kills it.

## D183 — The Harpoon's top fires faster · 2026-11-01

Igor, having played D182 (the Harpoon a railgun)'s shot early and late:
"feels much better. but at high tier i think its fire rate should be even
faster".

- **Its rate tier adds 0.4 a shot a second, not 0.2**, so the Harpoon
  bought to the top fires 1.2 a second: Igor's ×1.5 of D182, kept to the
  top, since the start "feels much better" as it is. Claude's pick.
- **It breaks no new bar.** The bot's Harpoon already dominated the Gun
  over layers 2 and 3 (`bugs.md` → The Harpoon over the Gun); it gains a
  little there and does not pass the Knife — 7% under its hearts, the bar
  being 10% — and its careers win on the same dives
  (`roadmap.md` → Health).

**Guarded by** `tests/docs.test.js` — `entities/weapons.md`'s tiers table
against the code.

## D184 — Go home on top · 2026-11-02

Three newcomers' plays (`playtests.md` → The third newcomer): with the dot
showing, the second and the third dived again at their first four deaths,
the first at five of seven. The cursor already opened on Go home (D90);
they clicked, and clicked the top row — Dive again, often within two
seconds — as they buy each screen's top row at `home`.

- **The end screens list Go home first, Dive again under it**, on a death
  and on the win, in the debug mode too (Setup above Again). The cursor
  still opens on Go home. Supersedes the order D90 gave, Claude's pick
  there. A click left over from the fight lands on Go home, which starts
  nothing.
- Claude's call, on Igor's "do all 3 improvements now"; replaces the
  proposal of the cursor on Go home, which was already the case.

**Guarded by** `tests/dive.test.js` — the end screen's rows are Go home,
then Dive again.

## D185 — The rows a newcomer needs first · 2026-11-02

All three newcomers' first buys on each `home` screen were its top row,
tier after tier within a second: the Mask before the Suit, Dash reach
before Heart — a dash barely pressed, and hearts that came late.

- **Equipment lists the Suit, the Mask, the Weights; attributes Heart,
  Dash reach, Strength.** The guard and a heart keep a newcomer alive
  longest, so a top-row buy is the right one. Weapons are unchanged:
  the Gun, carried at the start, is already first.
- The career bot breaks a tie in price by this order too, so its careers
  now buy the Suit and Heart first; its figures in `roadmap.md` → Health
  name their builds.
- Claude's pick, on Igor's "do all 3 improvements now".

**Guarded by** `tests/home.test.js` — the rows a newcomer needs first.

## D186 — The eel's path drawn ahead · 2026-11-02

The third newcomer "disliked the eels": 8 of their 10 layer-3 hits, as 11
of Igor's 12 in the deepest lionfish batch — "hardly predictable
trajectory (for a human player)". The bot aims ahead perfectly, so the
slower sway cost it more and was left (`ideas.md` → Every weapon tried and
raised); what a human lacks is where the eel will be.

- **Each eel draws its way over the next `WEAVE_AHEAD 0.6` seconds**, a
  faint dotted line in its glow: where it swims if the diver holds still,
  stepped as it swims. 0.6s is a Gun shot's flight across its range, so a
  shot aimed at the line's end meets it. Claude's pick.
- A guide line, no promise (D166 (the puffer's burst stays; guide lines
  are no promise)): the diver moving bends it. No number moves, and the bot
  sees nothing new, so no bar moves.

**Guarded by** `tests/enemies.test.js` — the eel ends where its path ended,
the diver holding still, and the path bends with the sway.

## D187 — The eel's sway slower; its path taken back · 2026-11-02

Igor, having played D186 (the eel's path drawn ahead) in `eel-path`:
"horrible idea, drawn path confuses even more. slowing them down is ok".

- **The drawn path is gone**, with its constant and its check. Supersedes
  D186 (the eel's path drawn ahead).
- **The eel sways 0.5 times a second, not 0.9**: the same 50 px either
  side over nearly twice the time, its side speed 160 px/s, not 280 —
  Claude's proposal of 2026-11-01 (`ideas.md` → Every weapon tried and
  raised), left then, built now on Igor's word.
- **Unfitted**: its threat numbers and the pools stand. Measured before it
  was built (`roadmap.md` → Health): the late Gun's eel hits halve, and
  where a career meets layer 3 the bot's Gun loses nearly twice the hearts
  — the bot aims ahead perfectly, so a slower sway only keeps a touching eel
  on it longer. Refitted, the batches hold half again as many eels and a
  dive more gems than all the gear (D162 (the whole game in fifteen to
  twenty minutes)), so not refitted. The bot is a floor, never a human's
  experience (D50 (the bot is not a difficulty instrument)); the balance
  suite runs on Igor's word (D132 (full runs on Igor's word)).

**Guarded by** `tests/docs.test.js` — `entities/enemies.md`'s roster
against the code.
