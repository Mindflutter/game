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
- **(b)** Only soften the difficulty curve so dives last 2–3 minutes, giving the
  upgrade system room to compound. Smallest change; a few constants.
- **(c)** Call it done at its current state and go straight to sprites.
- **(d)** Title screen + persistent best score only, no rebalancing.

Igor's read at the time: ~70s dives ending in inevitable death are "bad for a
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

Today every bot dive draws its own spawn sequence, so comparing two builds
compares two *different games* and the spawn noise has to be averaged out with
volume — 21 dives per configuration, and the three force-dash policies still
landed within a couple of seconds of each other (figures in `roadmap.md` →
Health). That is the honest reading of an **unpaired** comparison, not
evidence that the policies are equivalent.

With one seeded RNG per dive, the same seed replays the same spawn sequence, so
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
Persistent unlocks between dives, mod synergies, a reason to replay.
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
line of data. Would need floors on `range` and `fireRate` so a bad dive can't
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

**For the record** — Igor, 2026-09-29: "keeping graphics in mind, enemies and
the player will look significantly bigger with all assets. record for info."
Today the drawn circle *is* the hitbox, so bigger art means either bigger
hitboxes — every radius in the balance block moves — or art that overhangs
what it collides with.

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
- ~~**Screen-by-screen descent vs. smooth motion.**~~ **Answered, 2026-09-28**
  — Igor: "at this point it's answered and settled". Smooth: a current carries
  the camera down the layer; there are no discrete screens. Recorded as D58
  (the descent).
- **After a layer completes:** home, next layer immediately, or choose. Igor
  inclines to choose.
  **How the transition itself plays** is open too — Igor, 2026-09-28, in the
  S2 brainstorm: "an open discussion on how to transition between layers -
  later". S2 ends a layer on a plain "LAYER CLEARED" screen; S3 replaces it.
- **The layer end — design what happens there (todo).** Igor, 2026-09-28:
  "the end of layer is not quite a gate. we need a term for layer end (or just
  call it layer end). we need to design what happens there more thoroughly.
  leave this point for todo." Decided so far (D59): it is not a gate, and it
  offers no mods unless the player goes on to the next layer. Open: the term
  ("layer end" is the working name), what the player sees and does there, and
  where the mods come from when they do go on. **Owned by the layer-to-layer
  design pass after S3** (D60, `plan.md`), together with the two entries above.
- ~~**Is reaching the bottom a win?**~~ **Answered 2026-09-28** — Igor: "ok,
  yes, it's a stop and not a win." The "LAYER CLEARED" screen earns nothing,
  as D58 (the descent) and `plan.md` say, so S3 (one boss, one complete layer)
  is still the first stage with an ending. The heading's wording is the
  friendlier-messages item below.
- **Friendlier end-of-dive messages.** Igor, 2026-09-28, renaming the bottom
  screen to "LAYER CLEARED": "more user-friendy messages we'll do later". The
  end screens show a heading plus a raw stats line today.
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

**The balance bot is Igor's wish, left for now.** Igor, 2026-09-29: "well write
a good bot. nor sure it's worth it, but would be nice and handy to have a bot
mimicking real player's behavior. leave it now if complicated (i assume so)."
It is — threat-field navigation plus dash timing is a project of its own — so
S3 (one boss, one complete layer) measures around the gap instead: the win
rate is taken on the boss fight alone (D63 — the win rate is the boss
fight's).

**Found building S3, 2026-09-29: the kiting bot backs out of its own range.**
Against a lone slow enemy it holds it inside its 250px range 1% to 18% of the
time, so its shots never land — the mini-boss outlasts it for minutes, and the
immortal layer time trebled (figures in `roadmap.md` → Health). Backing off
only while closer than the range, and closing in otherwise, is a few lines —
but it moves every bot baseline. Not taken in S3 — Igor, closing it: "let's
just focus on what the stage DoD says".

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
  being answered. **Note: D35 is decided and not yet implemented** — gems are
  still walked over and still expire at 8s (`design.md` → Currency). D49 kept
  that rather than smuggling S4's work into S1.

- **The mod pool runs short late in a dive, and comfort is down to one.** Four
  of six mods cap (D49, D51, D55) — only Fins and Vitality are unbounded — and
  Mend is the last comfort mod standing, the other two candidates D34 named
  having been killed by D35 and D55 respectively. so a long dive can be offered
  two cards instead of three, and eventually the same two every time. Not a design problem yet — a layer is fifteen batches and S5
  (Content) adds mods — but if a fix is ever wanted before then, the mod-points
  idea below prices repeats instead of banning them.

- **The dash starts harmless and is bought — built as a mod, tier not settled.**
  Igor, 2026-09-27: "land the dash idea, i'm inclined to mod thing, but in some
  aspects can be home screen upgrade too". A lean plus an instruction to ship,
  **not** a decision between `mod` and `gear` — so D51 built the mod (`Impact`,
  `dashDamage` starts at 0) and the tier question stays open here. The
  objection recorded earlier — that this would stop diving into a crowd being a
  play — was answered by keeping the *shove* free and pricing only the wound.
  D56 then made `dashSpeed` a field too, so reach is sellable as `gear`
  whenever that is decided.

- **Can one stat be raised by both a mod and gear?** Opened by D51: `Impact` is
  the first mod with an obvious `gear` twin, per Igor's "in some aspects can be
  home screen upgrade too". If dash damage is buyable at `home` *and* droppable
  as a mod, the two stack within a dive, which is the compounding `foundations.md`
  keeps out of the gear/attribute pair. Options: gear sets the floor and mods
  add to it, gear and mods own disjoint stats, or mods only appear for stats you
  already own a tier of. S4 — Meta loop skeleton has to answer this before the
  shop exists.

- **The dash economy: two of six mods feed one verb.** Igor, 2026-09-27,
  playing D54: "once the dash becomes long, it feels way easier" and "dash
  length + dash damage is the cool build, might want to rebalance". Measured
  numbers live in `roadmap.md` -> Health.

  **Partly fixed by D56.** `Fins` no longer feeds the dash at all — dash reach
  is its own stat and is fixed at 141px — so what remains pointed at the dash
  is `Reflex` (cooldown) and `Impact` (damage), both capped at 3. Peak escape
  power fell from 386 to 141 invulnerable px/s, and the free-invulnerability
  exploit (tap and release) is gone.

  What is still open:
  - **`Reflex` is the real multiplier.** Cooldown 2.2s -> 1.0s doubles dash
    kills/s *and* invulnerability uptime (14% -> 31%). It was never the mod
    Igor named, and it is the one doing the work.
  - **`Impact` beyond x1 is nearly dead.** Drifters and darters have 1hp and
    are the bulk of every batch, so x1 kills as many as x3. Only bulwarks see
    the rest. Dropping its max to 1 until enemies with real hp exist is the
    obvious move and is not taken.
  - **Igor's direction: some dash upgrades belong at `home`** ("for later
    think-thru"). D56 made this *possible* — `dashSpeed` is a field that can be
    sold as `gear` — without deciding it. Dash power is the compounding,
    strategic growth D31 puts in `gear` and keeps out of `mod`s.
  - Caveat on all of it: the probe dashes once, in a fixed direction, from a
    standstill. A human lines the dash up along a crowd, which is where reach
    pays. The D50 lesson applies — where the measurement and Igor's feel
    disagree, his feel wins.

  **S6 — Balance owns the tuning.**

- ~~**Should `Lull` come back?**~~ **Closed by Igor, 2026-09-28: "Lull leave
  out".** D55 removed it, which was Claude's overreach at the time — Igor had
  said "useless *at this point*", a "not yet" rather than a deletion — but the
  outcome is now his. It stays out. The measurement behind it holds: nothing
  reaches a centred player inside a 1.2s window, so an arrival guard has
  nothing to guard against while every enemy walks in from an edge.

- **Fish that arrive from behind the screen.** Igor, 2026-09-27: "make some
  fish appear slowly from 'behind the screen' - still 2d, but adds to the
  overwhelming trick". An arrival that fades and grows in from *depth* rather
  than walking in from an arena edge. Still 2D — the depth is implied by alpha
  and scale, both drawn in code, so D4 (no asset files) is untouched.

  Three reasons it is more than flavour. It is the only arrival that can put
  something *near* you, which is the pressure a fixed arena cannot otherwise
  generate once you learn the edges — measured, nothing reaches a centred
  player inside 2.04s. It makes the arena read as water with a volume rather
  than a box with four doors. And it is the only thing that would give an
  arrival-guard mod a reason to exist — `Lull` is out for good (above), but
  the *slot* reopens if arrivals ever start near the player.

  The risk is the obvious one — something materialising on top of you is
  unfair unless telegraphed, and the fade-in *is* the telegraph, so the tuning
  knob is how long it takes. Belongs with the arrival model rather than with
  enemy behaviour: S5 — Content, or earlier if the fixed arena needs the
  pressure before then.

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
- ~~**Nothing ends a dive.**~~ **Partly answered, D58 (the descent),
  2026-09-28.** The list no longer cycles: a dive ends at the bottom of the
  layer, on a screen that is a stop, not a win. Layer *completion* — the boss,
  and what finishing earns — is still S3. **The boss is in, 2026-09-29** (D62 —
  the boss is the layer's last batch): killing it finishes the layer. What
  finishing earns is the layer-to-layer pass's (D60).

## Open — from the descent (S2)

- **A lively background during batches.** While the camera is locked at a gate
  the water should still move, not sit stationary. Igor, 2026-09-28: "most
  likely done after the alpha, when graphics come". **The flow itself is now
  in** (D58): the current never stops, and specks scrolled by `waterY` keep
  moving through a fight. Those specks and the depth tint are **placeholder
  graphics, to be replaced** — Igor: "if it's a graphics matter, state it and
  document that it's going to be modified later". What stays open is the art.
- **Gems left behind by the descent.** In S2 gems stay where they drop and
  scroll off with the world, so uncollected ones are lost. Igor, 2026-09-28:
  left for the currency stage (S4 — Meta loop skeleton), "it will be reworked
  anyways". D35 (currency is auto-collected) is decided but not implemented;
  implementing it is where this closes.

## Open — from the boss (S3)

- **Normal enemies alongside the boss.** Igor, 2026-09-29: "no one cancels the
  normal enemies along the boss, but let's get the boss finished first". Not
  ruled out, and after the boss itself (D62 — the boss is the layer's last
  batch). When it comes, the glossary's **batch** row — "enemies of comparable
  threat" — no longer fits that batch, since a boss and its escorts are not
  comparable.
- **More boss attacks.** The spit — a fan of slow toxic blobs, from the draft's
  "spitting out dangerous toxins" and "shooting an arc" — and the lunge and
  the spit in turn. Offered alongside the lunge; Igor took the lunge alone
  (D64 — the boss lunges): "we will do enemy polishing later anyways". The
  spit needs enemy projectiles first — see the ranged drifter under "Enemy
  behaviours, not just enemy stats".

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
