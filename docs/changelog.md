# Changelog

What actually shipped, newest first. Commit hashes are in this repo's history.

---

## 2026-09-30

**The layer-to-layer pass closes** (D73)
Igor: "layer end is ok, wrap up and commit". "Layer end" is the final term
(D73 ("layer end" is the term)); the glossary drops "working". A last sweep
found one contradiction of Claude's making and fixed it: the glossary said the
last layer's end "pays nothing", while every boss drops its gems (D35
(currency is auto-collected)) — now no rank and no mods, the haul still lands,
and D68 (the layer end is a milestone) says so. Logged for the build: the help
screen's "a rank and a pick of three mods, until the layer ends" goes false
with a second layer, and its new wording is Igor's. `plan.md`: no active
stage; S4 (meta loop skeleton) is next, its entry met.

**Layer-to-layer pass: the gaps filled, checked, planned** (D71, D72)
Docs only. Asked how batches vary between dives, Igor: "settled when we
started. batches are never the same, but are balanced in difficulty ... why
are you even asking? check docs, check other sessions, fill the gaps". Batches
are drawn from pools — hand-made batches of comparable threat per stretch of a
layer, from the dive's seed; by alpha no layer is a fixed list (D71 (batches
are drawn from pools)). Between layers there is no screen: the mod pick is the
layer end's one pause, and "LAYER CLEARED" becomes the win screen (D72
(between layers there is no screen)). The design and its check against
`foundations.md`: `superpowers/specs/2026-09-30-layer-to-layer-design.md`.
`plan.md`'s S4 (meta loop skeleton) now carries the dive's loop across two
layers as well as the meta loop, and S5 (content) the pools and a mod pool
that covers a full dive. `foundations.md`, `ideas.md` and `roadmap.md` follow.

**A dive can be saved at any point** (D70 (a dive can be saved at any point))
Docs only. Igor: "ideally, you could save at any point. if difficult, leave
for later". It is not difficult here — a dive is plain data and its randomness
one number — so the dive in progress joins the save from its first version in
S4 (meta loop skeleton) and resumes exactly, with no rollback. The session
pillar keeps its name; `foundations.md`'s pillar row, technical contract and
open list follow, with `ideas.md`, `plan.md` and `roadmap.md`.

**Layer-to-layer pass: the dive runs on through the layers** (D66–D69)
Docs only — nothing is built. The pass (D60 (layer-to-layer logic gets a
design pass of its own)) opened on what follows a layer, and Igor settled it:
"let's make it a proper roguelite for alpha. yes, you go on. yes, death sends
you to the start." Every layer end but the last goes on, death restarts the
dive from the top, there is no layer select — `home` shows the layers unlocked
and the depth reached — and rank and mods carry through the dive (D66 (the
dive runs on through the layers)). Currency is kept on death (D67 (currency is
kept on death)). The layer end is a milestone: a gate's rank and mods, a full
heal and a big haul of gems from the boss; clearing the last layer wins the
game (D68 (the layer end is a milestone)). How mods work across a dive was
Claude's call, at Igor's request — "consistent and diverse, generic baseline":
one rank per batch still, every mod capped, gems and a heart fill any card the
pool cannot, and the pool grows with the dive (D69 (mods across a whole
dive)). The vessel — a bought ride down to a depth — is parked in `ideas.md`.
`foundations.md` follows in the same step: the dive, rank, mod, home and layer
end rows, the genre contract's mod lines, and what is still open. `plan.md`
drops layer select from S4 (meta loop skeleton). Still open in the pass: the
session pillar, what a layer is, the transition, and what follows the win.

## 2026-09-29

**S3 — One boss, one complete layer closed.** Igor: "wrap up s3", having
played it: "right now it's very easy for me. but: i suggest we leave all
balance fine-tuning for later. let's just focus on what the stage DoD says."
Every exit condition is met. Balance goes to S6 — Balance; the bot's
range-keeping, escorts for the boss and more boss attacks wait in `ideas.md`.
Next is the layer-to-layer design pass (D60), before S4.

**Cleanup after `/simplify`**
Four review passes (reuse, simplification, efficiency, altitude) over the S3
(one boss, one complete layer) diff. No behaviour change: whole-layer bot
dives, mortal dives, both lunger fights and a tick trace of each lunger replay
byte-identical before and after, and six rule-breaking mutations still fail
their tests. One pause entry covers play and the mod cards (`resumeTo =
screen`); the boss's entrance moved into `edgeSpawnPoint`, on its margin;
`viewClamp()` is the view box for the player and the lungers alike;
`travelled` went, since it was always the charge's time × speed; lungers no
longer seed an aim they overwrite. Tests keep the player alive one way — the
`immortal` flag — instead of also pinning `hurt`; `ticks`, `ride` and
`clearAndWait` moved into `harness.js`; the lunge's property test asserts once
per run instead of every tick, and draws its walk from fast-check so a failure
shrinks; a mini-boss arrival assertion that could not fail was removed.
Skipped: a shared base for the two lunge records (it breaks the flat-record
convention), and the `?test` window-size check's own keep-alive, which is
outside this diff.

**Pause from the mod cards** — Igor: "cannot invoke pause from mod screen -
fix now". Esc pauses over the cards as it does in play, and Resume — or Esc
again — brings the same cards back: the pause menu remembers which screen
opened it (`resumeTo`). A test failed first (Esc left the cards up) and fails
again if the menu's Resume goes back to play; 38 Node tests.

**Recorded: art will be bigger** — Igor: "enemies and the player will look
significantly bigger with all assets. record for info." In `ideas.md` →
Sprites and real art, with what it means for the hitboxes.

**S3 built: the boss, two mini-bosses, a layer that can be finished**
Igor: "just write a plan for yourself and implement immediately, natively. i
want s3 done now, then i will check". Built to the approved design, as
D62–D65 say. The layer is fifteen batches: D54's twelve, a lone mini-boss
after batches 4 and 8, and the boss last, rising from below the view, centred.
Both lunge — chase, wind up with the line locked, charge, rest — through one
`lungeStep()` and a `lunge` field on the type; the chasers' movement is
untouched. The wind-up swells the body and lays a lane along the line
(placeholder graphics). Killing the boss is the layer end, so "LAYER CLEARED"
is now an ending. New scenario `mini-boss`; `last-batch` is the boss. The bot
can start from a scenario (D63). Every number of the lunge is Claude's pick.

Checks: `tests/boss.test.js` (five tests — the tell, as a property over seeds
and both lungers, is the S3 exit's telegraph check) and a bot test, each
verified by breaking what it guards; 37 Node tests, `?test` 174. The
window-size check now plays the whole layer, boss included — identical at all
three sizes. Three comments reworded: two Igor approved, and the layer-end one,
which this build made false ("a stop, not a win … S3 owns endings").

Measured (`roadmap.md` → Health): the bot wins 0 of 5 boss fights and 1 of 5
mini-boss fights at the starting kit. That is the bot: against a lone slow
enemy it backs out of its own range. The plan, with the design at its head:
`superpowers/plans/2026-09-29-s3-boss.md`.

**The TL;DR drops its standing "not committed" line** — Igor: "no need to
state "not committed" section every time in tldr. other sections are very
useful". `CLAUDE.md` says so; the line appears only when the commit is the
open point.

**Dev flags: `&immortal` and `&damage=<n>`**
Igor: "give me also dev urls for big damage and invincibility. also
instructions how to combine these args". Both ride on any URL, with a scenario
or without, and survive R: `main.js` reads them, and they live in game state
that `reset()` leaves alone. A bare `&damage` is 100 — Claude's pick, one shot
for anything. Two Node tests, each verified by breaking its rule: 31 tests.
`design.md` and `README.md` explain how to combine arguments. The same sweep
found both files stale on scenarios, fixed: `design.md` still named the
`elapsed` field, `spawnPaused` and the ramp — all gone or renamed when the
batch queue replaced the spawn director (D48) — and `README.md` still called
`late-swarm` "a minute in" and lacked `last-batch`.

**A mini-boss is a smaller boss** (D65)
Igor: "agreed". A mini-boss is one tougher enemy in a batch of its own at an
ordinary gate: it lunges like the boss, weaker and slower to wind up, so it
rehearses the boss's tell, and its gate pays a rank and mods. The glossary
gains a **mini-boss** row and loses it from the list of what is still open.
Agreed with it: "LAYER CLEARED" becomes the real ending once the boss dies.
Corrected with it — Igor: "The boss swims in from the bottom", not from a
random edge like other batches. Design only.

**The boss lunges** (D64)
Igor: "boss does (a). we will do enemy polishing later anyways". It drifts
after you, stops and swells while a line shows its path, charges along it, and
rests where it lands — the wind-up is the tell, the rest is the opening. The
spit and a mixed pattern wait in `ideas.md`. Design only; the numbers will be
Claude's picks.

**The boss is the layer's last batch** (D62)
Igor: "yes. normal batch, with just a special type of enemy sets". The boss is
an enemy type held by the layer's last batch, so its clear is the layer end,
and the batch before it pays a rank and mods like any gate. The glossary gains
a **boss** row; `docs/README.md`'s copy of the term list gains it too, along
with **layer end**, which it had missed since S2 (camera and descent). Normal
enemies alongside the boss are not ruled out — "let's get the boss finished
first" — and wait in `ideas.md`. Design only; no code yet.

**The win rate is the boss fight's** (D63)
Igor, on how to measure it: "no idea, you decide". Claude's call: the bot
fights the boss from the `last-batch` scenario at the starting kit, five
seeds, and also reports how far it gets from the top. A human-like bot is
Igor's wish, left in `ideas.md` — "leave it now if complicated".

**Three stale comments fixed** — Igor: "comment edit: OK". The batch table's
peak was 38 enemies, not 32; bullets already sweep their path since D53
(fixed timestep, bullets sweep); and "both" comfort mods had been one since
D55 (`Lull` removed) — now written without a count. No behaviour change.

**S3 — One boss, one complete layer opened.** Igor: "proceed with s3". It
opens with its design, because the glossary has no row for a boss or a
mini-boss and `foundations.md` leaves what a mini-boss is open. No code yet;
both suites green at the start.

**Skills and plugins yield to the project rules**
Igor: "make sure that loaded plugins and skills do not mess up project rules
(looking at superpowers here)". `CLAUDE.md` gained a *Skills and plugins*
section: each skill step that collides with a rule here, and the rule that
wins — nothing committed before `/simplify`, a two-way reading asked rather
than picked, small steps over continuous execution, a check that fails
without the change over ponytail's lone assert, a state machine as a field and
a branch rather than classes. It also records S2 (camera and descent)'s two
misreadings, both a word made stronger than Igor said it: "slows down" built
as a stop, and "the descent stops" read as camera mechanics.

## 2026-09-28

**S2 — The dive: camera and descent closed.** Igor: "commit and finalize s2".
Four decisions, D58 (the descent) through D61 ("dive", not "run"). The checks
closed three exit conditions; the fourth, playable, was Igor's call. S3 — One
boss, one complete layer is next, and the layer-to-layer design pass (D60)
sits between S3 and S4.

**Cleanup after `/simplify`**
Four review passes (reuse, simplification, efficiency, altitude) over the S2
(camera and descent) code. No behaviour change: five whole-layer bot dives and
a scripted descent replay byte-identical before and after, and every rule the
descent tests guard was broken once more to confirm they still fail. The water
now moves once, in `update()`, instead of in three screen branches; its dead
camera argument is gone; `descend()` is inlined; `gateDepth()` replaces the
depth formula repeated in three files; `edgeSpawnPoint` is back in view
coordinates. Tests share the bot's own input step, measure in seconds rather
than a hardcoded 120 ticks, and assert once instead of on every tick. The hook
no longer stops at system messages it mistook for the prompt. Two waits in
`?test` now pass through `runAlive`'s stopped-simulation check: 174 checks.

**"Dive", not "run"** (D61)
Igor: "run -> dive". The help screen says "Restart a dive"; `foundations.md`
calls a mod dive-scoped and the pillar **Dives differ**; two lines of
`design.md` and nine code comments follow, then — Igor: "all runs to dives,
consistency" — seventeen more across `checks.js`, `design.md`, `ideas.md` and
`plan.md`. History (`decisions.md`, this file) keeps its wording. Wording only
— no behaviour change. It surfaced one stale fact, fixed: `design.md` said
balance is measured over 21 runs per configuration; it has been the same five
seeds, paired, since D41 (seeded RNG).

**Layer-to-layer logic gets its own design pass** (D60)
Igor: "a design pass of its own after S3". `plan.md` has it as an unnumbered
section between S3 (one boss, one complete layer) and S4 (meta loop
skeleton); the open questions stay in `ideas.md` until then. S4 now waits for
it — its entry is S3 exits and the pass done — and Claude reminds Igor to open
the conversation when S3 closes. Its outcome, in Igor's words: "decision,
checks against foundations, ready plan".

**The water never stops outside pause**
Igor: "The water freezes under the mod cards - it should not", then "flow under
death and the layer end, and freeze under pause, confirmed". Play still waits
on the pick and stops on the end screens; the water drifts on behind all three,
at the fight-time speed. Pause alone freezes it, and `update()` moves the
water once, outside `step()`. D58 (the descent) says so; each screen has a test that fails
if the water stops there, and the end-screen test also fails if the water
rushes on at travel speed. Node 30 tests.

**No mods at the layer end** (D59)
The last batch of a layer pays no rank and offers no mods — Igor: "let it stay
on 11" — and the current goes straight on to "LAYER CLEARED". The layer end is not a gate, and the glossary
now says so — the gate row is reworded to describe what happens at a gate.
The help screen says it too, in Igor's approved wording: "Every batch cleared
is a rank and a pick of three mods, until the layer ends."
Also closed, from the S2 review: a test that pausing mid-descent freezes the
camera and the water from the first tick (fails with Escape handled after the
gate block), and the D29 window-size check now plays the whole layer rather
than four gates, in 100ms (figures in `roadmap.md` → Health). Node 28 tests.

**S2 — The descent** (D58)
One layer now scrolls. A current carries the camera and the player between
gate depths about two seconds apart, and never stops: during a fight the camera
and the batch hold while the water keeps flowing, slower. The current is
independent of the player. After the twelfth batch the dive ends on a "LAYER
CLEARED" screen (Igor's wording) — a stop, not a win. Specks carried by the water and a depth
tint are the only canvas work, and both are placeholder graphics.
`?dev=last-batch&play` starts at the last batch, for seeing the layer's end.
Reworked the same day on Igor's play: the first build braked to a dead stop,
took ~12s between batches, ran "way too fast", and let swimming down hurry the
current; its dim screens also left bright bands down the letterbox margins.
Node 26 tests (was 13: +10 in `tests/descent.test.js`, +3 in
`tests/docs.test.js` that regenerate the line counts, platform share and
balance constants `design.md` quotes, and fail on a doc naming a constant the
code no longer has); `?test` 173 checks,
including the margin dim and the D29 check, which plays seed 4471 to gate 4 at
1280×800, 1920×1080 and 3440×1440 through real mouse events and needs them to
agree (figures in `roadmap.md` → Health). Verified by breaking each rule: no
clamp at the depth, aim or arrivals ignoring the camera, the camera moving
mid-batch, a flow that fades to nothing, the bottom one batch late, and the
input scaling dropped. Measuring the traverse time found that the mortal bot
dies before the bottom on every seed — and did on the pre-S2 commit too, so
`roadmap.md`'s "it no longer dies" was already stale. The help screen's dash
line said it "hurts" the swarm, false since D51 (the dash is bought); it says
"shove" now. A project Stop hook now refuses any reply that cites a decision or
stage without its name.

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
