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

15 checks added (104 total, was 89). The load-bearing one is that a paused
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
still see them. Pure move, no behaviour change: 104 browser checks still pass.

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
through the paragraph beneath it. Every one of the 107 checks passed while the
screen was unreadable; a screenshot caught it. `drawHelp()` now derives the
blurb's top from `HELP_KEYS.length`, so the data can grow without the layout
lying. Second time today that a state-only pass hid a visual break -- the first
was the stepped scenario rendering nothing (D42).

107 browser checks pass (was 104: +5 new, −2 deleted). The six Node invariants
are unaffected.

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
guard fires. 108 checks (was 107).

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
(`got 1 shots`). 111 checks (was 108).

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
which is the endless director returning. 119 checks (was 111).

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
deleting the `Lull` line (1). 144 checks, was 119.

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
only it — "hp=5 after passing through it at speed 620". 145 checks, was 144.

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
the enemy white". 151 checks, was 145.

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
arrival guard would have to break on purpose. 165 checks, was 166.

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
171 checks, was 165.

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
mutations. 13 Node tests, was 8. It then caught a real one immediately: this
entry originally spelled out the fake citation used in that first mutation,
and the check flagged its own decision file.

**What this does not cover, stated so it is not mistaken for coverage**:
whether prose is *true*. A check can see that D35 is cited and exists; it
cannot see that the sentence about it is wrong, or that a number went stale.
That stays the sweep's job, and the sweep stays a habit.

## D58 — The descent: a current between gate depths · 2026-09-28
Agreed with Igor in the S2 brainstorm; design in
`superpowers/specs/2026-09-28-s2-descent-design.md`.

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
  history. `decisions.md`, `changelog.md` and `superpowers/` are logs, only
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
`superpowers/specs/2026-10-01-weapon-record-design.md`.

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
