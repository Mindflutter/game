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
and death was certain (see `design.md` → What those constants add up to). A
batch is a **bounded** queue. The divergence cannot occur. The whole class of
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
pick made the suite report `1 of 89 checks FAILED`. Restored: 89 pass. Also
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
