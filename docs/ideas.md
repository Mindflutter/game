# Ideas, wishes, proposals

The inbox: everything undecided, and nothing here is committed to. Status is
one of: **open** (live, undecided) · **parked** (agreed direction, not now) ·
**declined** (decided against — kept so we don't re-litigate it).

An item leaves this file in the same step as a decision answers it, or when it
is built: the decision, or the changelog, is its record from then on.

---

## Open — needs a decision before work continues

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

---

## Parked — agreed direction, deliberately not now

### Enemy behaviours, not just enemy stats
**S5 (content)'s work** — five to seven behaviours by alpha (`plan.md` → S5).
**Agreed 2026-09-19.** Igor: "good idea... we're gonna go with more enemy types
and perks definitely." Every type that does not lunge runs the same chase, so
the ordinary types pose one question at three difficulties: the arena only
ever asks "how far away are they". The draft lists more to start from
(`high level design.md` → enemies and enemy ai).

The worked example still waiting, one branch in the enemy loop (the charger
was the other; it became the lunge, D64 (the boss lunges)):
- **Ranged drifter** — stops at range and fires a slow projectile. Punishes
  kiting in a straight line, which is the dominant strategy today. Adds a
  *cover and angle* decision.

Cost: a field on the type record plus a branch in the movement loop, as the
lunge did. Enemy projectiles reuse the existing `bullets[]` shape with an
`evil` flag — not a second array.

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
- **Friendlier end-of-dive messages.** Igor, 2026-09-28, renaming the bottom
  screen to "LAYER CLEARED": "more user-friendy messages we'll do later". The
  end screens show a heading plus a raw stats line today.
- **Collectibles found in a dive:** feed player stats, the story, or both.
- **Which attributes exist, and what each micro-task is.** That the tier
  exists is D36 (attributes); its content is S5 (content) work.
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
The mods that exist are `entities/mods.md`; an idea moves there when it is
built.

**comfort** — feel and friction, near-zero balance risk:
- **more valuable enemy loot** — Igor, 2026-09-27. See the balance note in D35:
  this is the one family whose effect outlives the dive, so it must be measured
  per campaign, not per dive.

**weapon** — waits for S5 (Content), per D31's `scope` field.

## Recorded future opportunities, explicitly not now

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

- **Comfort is down to one mod.** `Mend` is the last comfort mod standing: of
  the three D34 (mods) named, D35 (currency is auto-collected) left the
  currency magnet nothing to do and `Lull` is declined (below). Not a design
  problem yet — S5 (content) grows the pool to cover a whole dive (D69 (every
  mod capped)) — but comfort is meant to carry the pool's width.

- **The dash economy: two of six mods feed one verb.** Igor, 2026-09-27,
  playing D54: "once the dash becomes long, it feels way easier" and "dash
  length + dash damage is the cool build, might want to rebalance". Measured
  numbers live in `roadmap.md` -> Health. `Fins` does not feed the dash
  (D56 (the dash is a fixed, committed lunge)), so what points at it is
  `Reflex` (cooldown) and `Impact` (damage), both capped at 3, and the Dash
  reach attribute at `home` (D75 (the gun's tiers, dash reach, a clean batch)).

  What is still open:
  - **`Reflex` is the real multiplier.** At its max it roughly doubles both
    dash kills per second and invulnerable uptime (`roadmap.md` → Health, the
    dash build). It was never the mod Igor named, and it is the one doing the
    work.
  - **`Impact` beyond x1 is nearly dead.** Drifters and darters have 1hp and
    are the bulk of every batch, so x1 kills as many as x3. Only bulwarks see
    the rest. Dropping its max to 1 until enemies with real hp exist is the
    obvious move and is not taken.
  - Caveat on all of it: the probe dashes once, in a fixed direction, from a
    standstill. A human lines the dash up along a crowd, which is where reach
    pays. The D50 lesson applies — where the measurement and Igor's feel
    disagree, his feel wins.

  **S6 — Balance owns the tuning.**

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
  arrival-guard mod a reason to exist — `Lull` is out for good (Declined), but
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
- **RMB secondary attack.** Possible per the draft, not committed. If it
  comes, it needs numbers of its own: D83 (the weapon record) puts one
  weapon's on the player.
- **Weapon-scoped mods** — the #3 half of D31. They attach as D83 (the weapon
  record) says — a mod naming the weapons it fits, changing their numbers on
  the player — and arrive at S5 or not at all.
- **Timed fast clears of completed layers** rewarding the player, so easy
  layers do not go obsolete. In `foundations.md` as a pillar, unimplemented.
  Since D66 (the dive runs on through the layers) every dive passes through
  them, so they cannot go obsolete; a timed bonus would reward crossing them
  fast on the way down.
- **The vessel — a bought ride down to a depth.** Igor, 2026-09-29: "as an
  idea, there could be a purchasable vessel ship that submerges you to a
  certain depth"; 2026-09-30: "vessel idea - record as idea, not doing now".
  A shortcut, bought at `home`: a dive that starts deeper than the top.
  Spelunky's shortcuts work this way. From the discussion: it works if you
  arrive with the starting kit and no mods, so riding down trades momentum for
  time instead of skipping for free — otherwise it makes the top layers
  pointless; and it goes only as deep as you have cleared. It is also the fix
  waiting if replaying the top layers every dive (D66) turns out boring.
- **A second currency** — a fancy shell worth a lot. After alpha.

## Open — from the descent (S2)

- **A lively background during batches.** While the camera is locked at a gate
  the water should still move, not sit stationary. Igor, 2026-09-28: "most
  likely done after the alpha, when graphics come". **The flow itself is now
  in** (D58): the current never stops, and specks scrolled by `waterY` keep
  moving through a fight. Those specks and the depth tint are **placeholder
  graphics, to be replaced** — Igor: "if it's a graphics matter, state it and
  document that it's going to be modified later". What stays open is the art.

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

## Open — raised during S4 (meta loop skeleton)

- **Mods as drops, never offered — a requirement before S5 since D80 (before
  S5: entity docs, mods from drops).** Igor, 2026-09-30, closing S4: "mods
  rework from choice to enemy drops (from ideas)", its own session. How drops
  work stays open until then. The idea as first raised: Igor, 2026-09-30, a "wild idea" for
  discussion after S4: "mods become random (most likely pseudo-random) drops
  from enemies, never offered, smooth part of the dive, some of them permanent,
  some temporary. would this help with mod vs gear resolution? would it allow
  more variety to mod system? would it make the game feel more dynamic and
  more understandable?" Undecided — a question, not a lean. What it touches,
  so the discussion starts from the docs: D33 (mod offers do not interrupt)
  and D34 (mods), which put the pick at the gate; the genre contract's "one
  one-second mod pick" (4, 5); D69 (every mod capped), whose fill cards exist
  because an offer can run dry; D35 (currency is auto-collected), which a drop
  would ride on; and "permanent" mods, which would cross into what `gear` and
  `attribute` own (D31 (two-tier progression), D36 (attributes)).
- **How batches grow, balance-wise — S6 (balance)'s.** Igor, 2026-09-30:
  "right now the batches are hard coded and are shitty because of that - you
  know no level of difficulty, we havent settled how batches grow
  balance-wise." Then, placing it: "develop a complex mathematical system for
  enemies that impact the game and player feel - yes, of course. is it part of
  balance? yes." Its direction is chosen — approach A, a threat number per
  enemy type, a batch's threat computed from its enemies, measurement
  correcting the numbers — and so is the shape it serves: an overall, gradual,
  non-linear rise, "in numbers and in enemy types" (D79 (a dive goes from
  easiest to hardest)). Everything else is S6's: the system itself, and how
  batches are written against it. D54 (the batches, re-derived) and D71
  (batches are drawn from pools) size by total hp until then, and 14 darters
  against 10 drifters shows hp is not it.

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

### `Lull` — invulnerability as a batch arrives
Igor, 2026-09-28: "Lull leave out". D55 (`Lull` is removed) had taken it out —
Claude's overreach at the time, since Igor had said "useless *at this point*",
a "not yet" rather than a deletion — and the outcome is now his. The
measurement behind it holds: nothing reaches a centred player inside its 1.2s
window, so an arrival guard has nothing to guard against while every enemy
walks in from an edge. The slot reopens only if arrivals ever start near the
player (the fish from behind the screen, above).

### A "finished standalone"
Void since 2026-09-26, not answered: the question of what would finish the
survivors-like prototype dissolved when `high level design.md` replaced it with
a full roguelite (`plan.md`). Its four options — a win at three minutes, a
softer curve, straight to sprites, a best score — answered a question nobody
asks any more.
