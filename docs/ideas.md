# Ideas, wishes, proposals

The inbox. Nothing here is committed to. Status is one of:
**open** (live, undecided) · **parked** (agreed direction, not now) ·
**declined** (decided against — kept so we don't re-litigate it).

---

## Open — needs a decision before work continues

### What does "finished standalone" mean?
**Status: VOID, 2026-09-26.** Not answered — dissolved. `high level design.md`
replaced the standalone with a full roguelite, so all four options below are
answers to a question nobody is asking. Kept only so the reasoning is not
re-derived. See `plan.md` for what replaced it.

Original text follows, for the record:

Options put forward:
- **(a)** Win condition at ~3 minutes, plus title screen and saved best time.
  Turns it from an endless demo into a game with a beginning, middle and end.
- **(b)** Only soften the difficulty curve so runs last 2–3 minutes, giving the
  upgrade system room to compound. Smallest change; a few constants.
- **(c)** Call it done at its current state and go straight to sprites.
- **(d)** Title screen + persistent best score only, no rebalancing.

Igor's read at the time: ~70s runs ending in inevitable death are "bad for a
standalone map, but really promising for a rogue-like experience". Part of (d)
has since shipped (title screen) — the best-score half has not.

~~**Do not pick one of these unilaterally.**~~ Moot.

### Should the dash go where you aim, instead of where you move?
**Status: open, and the reasoning changed under D28.** The whole "it re-couples
the two axes mouse aim exists to separate" argument assumed *auto*-fire — that
the cursor was a lazy pointer you could leave anywhere. With manual fire the
cursor is already where your attention is, every shot, so aiming the dash there
costs much less than it did. Re-argue this at S1, not before. Raised by Igor
2026-09-19 after the force dash landed. D20
rejected aim-direction, but that was when the dash was pure escape; D23 gave it
a directional damage wave, which weakens the original reasoning.

**For:** the mouse is continuous where WASD is 8-way, so you could thread a gap
at 30 degrees; the wave and the weapon would point the same way; and you could
dash while standing still, which `len > 0` currently forbids outright.

**Against:** it re-couples the two axes mouse aim exists to separate — escaping
would mean first pointing the cursor away from what you are shooting, at the
worst possible moment. Cursor position is often stale (wherever the last enemy
died) whereas a held key is always deliberate. And a dash perpendicular to your
travel reads as a jerk rather than as acceleration.

**The argument that only appeared after D23:** two facings are coverage, not a
flaw. The dash clears the path ahead while the gun covers the retreat, so you
threaten two arcs instead of one. Unifying them narrows what you control.

**Claude's recommendation:** keep movement-direction, and take only the cheap
half — dash toward the cursor *when no movement key is held*. That kills the
stationary dead case without touching the escape use. Two lines.

Offered and not taken up yet: putting all three (movement / aim / hybrid)
behind a constant in the balance block so the choice can be played rather than
argued. Feel is Igor's call (D16).

### Seeded RNG for the bot, so balance comparisons are paired
**Status: DONE 2026-09-27, D41.** Landed in S0. The cost estimate below was
right about the scattered call sites — 14 of them — and wrong to call it "not
free": the whole change took one pass. Raised 2026-09-20 while evaluating the
`procedural-gen` skill, which is where the gap surfaced.

Today every bot run draws its own spawn sequence, so comparing two builds
compares two *different games* and the spawn noise has to be averaged out with
volume — 21 runs per configuration, and the three force-dash policies still
landed within a couple of seconds of each other (figures in `roadmap.md` →
Health). That is the honest reading of an **unpaired** comparison, not
evidence that the policies are equivalent.

With one seeded RNG per run, the same seed replays the same spawn sequence, so
two policies can be run against **identical** conditions and compared pairwise.
Same effort, far more statistical power: differences under a second become
detectable instead of drowning. It also makes a bug reproducible, which today
it is not.

Cost: a small LCG or xorshift plus routing every `Math.random()` in `logic.js`
through it. Not free — the call sites are scattered — but it is the one change
that makes every future balance claim sharper, so it pays back per measurement.
Affects D16.

---

## Parked — agreed direction, deliberately not now

### Roguelite meta-progression
**Absorbed — this is the game now, 2026-09-26.** No longer a parked item; it is
the subject of `high level design.md` and S4. Kept for Igor's original framing.
Persistent unlocks between runs, mod synergies, a reason to replay.
Igor: "not designing the big strategy here yet, but take a note, I'll probably
go there at some point." Explicitly a later *phase*, after the standalone ships
and after the sprite work. See `decisions.md` → "Browser build is a throwaway
prototype".

### Enemy behaviours, not just enemy stats
**Absorbed into S5, 2026-09-26** — this is now scheduled work, not a backlog
item, and the draft expands it from 2 behaviours to 5–7. Kept for the reasoning
and the two worked examples. **Agreed 2026-09-19.** Igor: "good idea... we're gonna go with more enemy types
and perks definitely." Supersedes the old "more enemy types is one line" bullet,
which was true of the table and misleading about the game: every type runs the
same chase loop in `logic.js`, so three types pose one question at three
difficulties. The arena only ever asks "how far away are they".

Two behaviours that each ask something new, one branch each in the enemy loop:
- **Charger** — stops, telegraphs ~0.5s, then lunges in a straight line.
  Punishes standing still, rewards reading the tell. Adds a *timing* decision.
- **Ranged drifter** — stops at range and fires a slow projectile. Punishes
  kiting in a straight line, which is the dominant strategy today. Adds a
  *cover and angle* decision.

Cost: a `behavior` field on the type record plus a branch in the movement loop.
Enemy projectiles reuse the existing `bullets[]` shape with an `evil` flag —
not a second array.

### Trade-off mods
**Still parked, and now cheaper.** D31's `scope`/`apply(player, weapon)` shape
makes a trade-off mod the same one-line record it always was. Revisit at S5.
Originally: **Parked 2026-09-19** — Igor: "reject now, save for the future ideas." Not
declined, deliberately not next.

All seven upgrades are strictly good, so the level-up screen is "pick the
biggest number" rather than a choice. `apply` already supports the fix with no
code change — `p => { p.damage += 2; p.fireRate *= 0.7; }` — so each one is a
line of data. Would need floors on `range` and `fireRate` so a bad run can't
drive them to zero. Related to *Upgrade synergies* below, but much cheaper:
synergies need interactions, trade-offs need only a second field.

### Mod synergies
**Renamed per D32** (was "upgrade synergies"). Mods that interact rather than just add — Pierce multiplying with Power, a
"shots split on kill" that scales with fire rate. This is what makes players
plan a *build* instead of picking the biggest number, and it's the highest-value
lever if the roguelite phase happens.

### Sprites and real art
Deliberately deferred until **after** the port, not before. Graphics is
precisely the part that does not survive a port — every line of canvas work is
in the ~370 lines that get rewritten. Placeholder shapes already answer the
question art has to answer here (can you tell a darter from a bulwark at a
glance), and "does it look good" can only usefully be asked in the engine you
are shipping in.

### Port to a native executable
**Reaffirmed as post-alpha by D30**, after the question was reopened on
2026-09-26 and answered "still throwaway". Rust or C++, dropping the browser
build afterwards. Candidate frameworks, from
closest-to-a-literal-port outward: **macroquad** (Rust) and **raylib** (C/C++)
are near 1:1 with the current canvas code; **Bevy** (Rust, ECS) is a redesign
rather than a port; **Godot** is the pragmatic answer if "performant engine" is
the real goal. See `decisions.md` for what makes the port cheap.

Known friction in Rust specifically: methods on `self` called while iterating
`self.enemies` won't borrow-check. Fix by looping on indices or collecting
events and applying them after the loop. `nearestEnemy()` returns
`Option<usize>`, not a reference.

### Settings persistence (localStorage)
~6 lines. Volume and screen shake currently reset on every reload. Igor:
"no local storage yet" (2026-09-12) — not rejected, just not now.

### TypeScript
Revisit at port time, not before. A build step would cost the double-click
workflow, which is the whole reason the prototype is in a browser. The no-build
middle ground is `// @ts-check` plus JSDoc, which the IDE type-checks with the
real TypeScript compiler.

### Spatial grid for collision
Current collision is brute-force O(n²). **Measured trigger, D43 (2026-09-27):**
500 enemies x 200 bullets (100k pair checks) costs 0.55ms of a 16.7ms frame;
2000 x 800 (1.6M pairs) costs 3.67ms. Revisit above roughly **1500 enemies with
600 bullets live** — far past anything the design calls for. Until then, bucket
nothing. Marked with a `ponytail:` comment at the site.

---

## Open — from the design draft's own `(?)` markers

Igor marked these undecided in `high level design.md`. None needs deciding now.
Recorded here so they are not silently decided by accident.

- **The lost item.** What you dropped in the pool. Trivial, per the humorous
  vibe. Drives the title, which is also subject to change.
- **Screen-by-screen descent vs. smooth motion.** Igor inclines to smooth.
  Partly settled by D27: motion is smooth *between* gates. Whether the gated
  segments are discrete screens is still open.
- **After a layer completes:** home, next layer immediately, or choose. Igor
  inclines to choose.
- **Collectibles found in a dive:** feed player stats, the story, or both.
- ~~**Do attributes exist at all?**~~ **Answered by D36 (Attributes),
  2026-09-27.** They exist as a second persistent tier: micro-tasks pay points,
  spent freely at home on body stats. Non-fungibility is what justified keeping
  the tier. Still open downstream: *which* attributes exist, and what each
  micro-task is — both are S5 (Content) work.
- **What the currency is called** — shells, coloured stones, coins.
- **Whether weapons stay inside the sea theme** or are free to be weird.
- **Terrain beyond a vertical shaft** — cliffs and caverns are left possible,
  deliberately not now.

## There are three bots, not one

Raised 2026-09-27 when Igor asked whether a bot could play the game. It can —
one already does (D16) — but conflating three different jobs is why the current
bot's numbers are hard to trust. Open work; `roadmap.md` → Health notes that
every existing bot figure goes void at S1 (Combat core), because manual fire
(D28) means the bot now needs aim, fire, dash **and** movement policies where it
previously needed only movement.

| Job | How good must it be | Shape |
|---|---|---|
| **Regression yardstick** | Consistency matters, skill does not. A *dumb* deterministic bot is better than a strong one — you want a fixed ruler, not a good player. | Scripted policy. Exists. |
| **Balance measurement** | Must play roughly like the intended player, or the numbers do not transfer. This is where today's bot fails: `roadmap.md` says it is "only comparable to itself". | Threat-field navigation: danger gradient from enemy positions and velocities, move down it, aim at highest-value target, dash when cornered. The `disciplines:game-ai` steering material covers this. |
| **Exploit finder** | Should *optimise*, not imitate. Its job is to find the cheese — "stand in this corner, never move, win" — which is exactly the balance bug worth catching. | Lookahead search. Viable **because** the game is deterministic after S0: fork the sim, roll out candidate actions, pick the best. |

**Declined:** a learned/RL bot. Needs a training harness and compute, and would
be a research project that teaches nothing about this game.

**The trap worth naming:** a bot that plays *well* actively misleads. If it
clears a batch with frame-perfect dodging no human can perform, difficulty gets
over-tuned. Bot numbers are a **floor** on difficulty, never a measure of human
experience. All three bots drive scenarios via D37, never their own harness.

## Mod ideas — a running list

Open collection, Igor invited more (2026-09-27). Nothing here is committed. Per
D34 (Mods) each must be readable in one line and differ in **kind** from its
neighbours, not in degree. Comfort mods carry the width of the pool (D35).

**body** — weapon-agnostic stats, identical value whatever you brought:
- move speed
- max HP
- dash cooldown
- i-frame duration

**comfort** — feel and friction, near-zero balance risk:
- **more valuable enemy loot** — Igor, 2026-09-27. See the balance note in D35:
  this is the one family whose effect outlives the dive, so it must be measured
  per campaign, not per dive.
- heal on batch clear
- brief invulnerability when a gate opens

**weapon** — waits for S5 (Content), per D31's `scope` field.

## Recorded future opportunities, explicitly not now

- ~~**`home` screen in HTML/CSS rather than canvas.**~~ **Decided by D38 (The
  `home` screen is canvas), 2026-09-27** — canvas, because its UI is checkable by
  `?test` where HTML's is not, and because two-technology integration fails
  invisibly where hand-rolled layout fails visibly. Layout becomes data via one
  small helper. Revisit only if the gear list needs scrolling and tooltips.

- **Multiplicative interaction between `gear` and `attribute`.** Parked by D36,
  not declined. Igor's framing is right — one character, every progression feeds
  it — and the door is deliberately left open. The reason to wait: additive
  systems give power ∝ (a+b), which a linear intuition can track; multiplicative
  give a×b, so the ceiling grows quadratically and the gap between an optimised
  and a naive build explodes, forcing balance to target the product's maximum
  and making ordinary builds feel weak. Revisit only after S6 (Balance) has the
  additive version measured, so there is a baseline to compare against.

- **Mod points — better mods cost more.** Igor, 2026-09-26: "let's make mods
  shine by adding mod points later on". Instead of three free picks, a rank-up
  grants points and each mod has a cost, so a strong mod is a real trade
  against two weak ones. This is the cleanest answer to two of Igor's own
  pitfalls at once — it prices stacking, and it slows effective power growth
  without slowing rank-ups. Not now: it needs the generic mod pool balanced
  first (S1 — Combat core through S4 — Meta loop skeleton), because a cost
  curve on top of an unbalanced pool is two unknowns multiplied.
- ~~**What happens when a gate owes several mod picks at once.**~~
  **Resolved by D34 (Mods), 2026-09-27** — one rank per batch cleared means
  rank-ups happen only at gates, so a gate can never owe more than one pick.
  The question was an artefact of the XP bar and died with it.
- ~~**Do gems still expire, now that they are currency?**~~ **Closed by D35
  (Currency is auto-collected), 2026-09-27** — auto-collection means nothing can
  be stranded, so nothing needs to expire. The question dissolved rather than
  being answered.

- **Elemental weaknesses and resistances** — certain enemies weak or resistant
  to certain weapon types. The draft itself calls this too much for the initial
  stage and records it only as an opportunity. Listed in `foundations.md` as a
  non-goal before alpha.
- **RMB secondary attack.** Possible per the draft, not committed.
- **Weapon-scoped mods** — the #3 half of D31. Reachable without a rewrite by
  design; arrives at S5 or not at all.
- **Timed fast clears of completed layers** rewarding the player, so easy
  layers do not go obsolete. In `foundations.md` as a pillar, unimplemented.
- **A second currency** — a fancy shell worth a lot. After alpha.

## Open — from the batch work

- **Every dive draws the same batches.** `BATCHES` is a fixed list, so two dives
  of the same layer are identical — which contradicts the `foundations.md`
  pillar "two dives of the same layer draw different batches". The deleted
  `weight`/`from` fields solved this for *types*; the batch-level version is a
  different mechanism (pick from a pool of batches of comparable threat, per the
  draft's Hades reference). Needed before S6 (Balance) means anything, since
  measuring one fixed sequence is not measuring the game.
- **Nothing ends a dive.** The batch list cycles, so a dive is endless, just
  gated. Layer completion is S3 — noting it so the cycling is not mistaken for
  a decision.

## Suggested but not yet discussed

- **Guard the other screens against overflow.** D46 gave the help screen a check
  that its content ends above the hint. Options and the menus stack rows from
  tables the same way and have no such guard. Generalising means every screen
  reporting its own extent, which is more machinery than one bug justifies —
  worth doing when a second screen actually overflows, not before.

- **Shake when enemies take damage** (currently only when *you* take damage).
  Offered 2026-09-12 when Igor asked for "slight shake on damage received";
  he meant the player. Never confirmed either way.
- **Hitstop on death** — a few frames of freeze before the death shake. The
  other classic ingredient of an "epic" death besides the shake itself.
- **Music.** Would need either a generated loop or an audio file, and a file
  would break the "no assets, ever" rule that has held so far.
- **Mobile / touch input.** Not considered at all yet.

---

## Declined

### Difficulty option in the options menu
Offered as one of four candidate options 2026-09-12; Igor chose Volume, Screen
shake and Show FPS instead. Reason it's expensive: Easy/Normal/Hard is only
meaningful with real balance work behind each setting, measured per setting
with the bot — much more than the other three cost.

### ES modules for the file split
Declined 2026-09-12 in favour of plain `<script>` tags. ES modules are blocked
over `file://` by CORS, so double-click-to-play would have died and every test
would need a server running. The explicit import graph isn't worth that in a
prototype that gets deleted after the port.

### A bundler (Vite / esbuild)
Same decision. Hot reload is genuinely nicer, but it costs `node_modules`, a
build step and config to learn — tooling learned instead of gamedev, for a
prototype whose successor is written in Rust.

### Shipping the browser version
No itch.io page, no favicon, no meta tags, no "make it shippable" polish. The
browser build is scaffolding. (Worth knowing anyway: Vampire Survivors was
originally an HTML5/Phaser game and sold millions before its Unity port — the
browser *can* be a shipping target. It just isn't this project's target.)
