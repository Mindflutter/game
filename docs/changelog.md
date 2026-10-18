# Changelog

What actually shipped, newest first. Commit hashes are in this repo's history.

---

## 2026-10-18

**The browser suite holds only what a browser can check** (D39 (the test
stack))
`checks.js` kept the game's logic checks from before the Node suite existed —
152 of its 199, which every change had to keep in step twice. Each one now
lives in Node or was dropped for a Node test that already guards the same
rule, proven by breaking the rule and watching that test fail: the trigger,
shots, the dash, gems, touch, Mend and the layer end's timing in
`tests/combat.test.js`; menus, the cards' keys, options, shake and sparks in
`tests/screens.test.js`; the gate in sequence, the mods' own records,
scenarios and the readout beside their kin. The browser suite keeps 47: sound,
canvas and every screen fitting, real keyboard and mouse events, the menu
cursor, the window sizes, the stepped driver. Two moved checks had stopped
testing what they said: the dash's wave reaching past the body, since the
bodies doubled (D104 (bodies doubled)), and the dash sweeping rather than
stepping over a fish, at today's dash speed. The old suite passed with either
rule broken. Both now fail when it is. CLAUDE.md's line on what carries to
the port names the checks in `tests/`.

---

## 2026-10-17

**Batches arrive in waves** (D115 (batches arrive in waves))
A batch no longer arrives whole. Its fish are shuffled and dealt into waves:
the first comes as the camera reaches the gate, each later one about 4s after
the one before, its fish trickling in over 2s, so a slow clear meets the next
arrivals still fighting — Igor: "we gotta push the player to clear the enemies
fast, because new ones are constantly coming". An empty arena calls the next
fish at once. The gate still holds until the last wave is dead (D27 (batches
are hard-gated)), and the status bar counts the fish still to come —
`17 fish left (12 coming)`, and the help says a batch comes in waves. The shape and the numbers are Claude's picks. A
boost may now drop from the kill that empties the arena between waves. The
save is version 8. Checks: the first wave whole and every fish once; each later
fish at its own moment; an empty arena calling the next; the gate held and
nothing paid between waves; the clear once, on the last wave's last fish; the
waves held under pause; the boost rule; the status bar; the v8 fixture.


**Weapons and equipment on screens of their own** (D114 (weapons and equipment
on screens of their own))
`home`'s Gear row is now two, Weapons and Equipment, each a screen holding only
its own rows — Igor: "we need to split weapons and gear. confusing to see in
one place". The rows' names and order are Claude's. Checks: `home`'s rows, each
screen holding only its own and left by Back or Esc; every screen whose Back
leads `home` draws as its menu, since one `render.js` does not name falls
through to the dive's field.

**Fixed: stats named in code words**
A mod's card and its pickup line name what it moves in words — Nerve's reads
`safe after a hit 1 → 1.3`, not `iframes` — from `STAT_NAMES` in
`game/content.js`, printed by one `statLine()` the two now share; the words are
Claude's picks. The development readout and the debug setup's tips keep the
code's names: both are tools for building the game, and the readout is to be
trimmed or dropped before alpha (D52 (the development readout)). Checks: every
stat a mod moves has a name, and its pickup line prints it; every line of a
card, its numbers too, fits the card.

**Fixed: boost lines speak of shots while the Knife swings**
With the Knife, Frenzy says "you swing much faster", Lance "each swing cuts
more fish" and Bloom "your blade grows": a boost's `swingDesc`, its line while
the weapon carried swings (D105 (the Knife swings)). Claude's words. Check: no
boost's line speaks of shots or fire while the Knife is carried, and the Gun
keeps the lines it had.

**Recorded: a bug** — boost lines speak of shots while the Knife is carried
(`bugs.md`).

**Recorded: swimming through biters costs nothing**
Igor's balance note, in `ideas.md` → The stage's content, with the ways it
could be addressed — none chosen.

**Settings are kept** (D113 (settings are kept with the save))
The sound off or on, the volume, the screen shake and the FPS counter now
survive a reload and New game, written as M is pressed or Options is left. Not
a bug — it was parked "until local storage", which the save has been since.
M's key moved from `platform/audio.js` into `game/`, where key bindings belong.

**Recorded**: in `ideas.md`, whether the dash is locked at the start, why
`footwork` must be a feat (S6 (balance)'s), weapons and equipment on screens of
their own, stronger versions of the same fish, three fish ideas — one that
dashes, one whose shots arc, a shooter that flees — and, for discussion, health
bars and hits worth more than one heart.

**Bugs get a page** (D112 (bugs get a page of their own))
`bugs.md`, for real issues seen in play, each with what happens, what should,
how to see it and why. Its first: stats named in code words — `iframes` on a
mod's card. Nothing recorded before was a bug, so nothing moved.

**The dash a third shorter** (D111 (the dash a third shorter))
`dashSpeed` 884 to 620: the starting dash covers 99px, not 141, in the same
0.16s, so its invulnerability is unchanged. Dash reach's steps add the same
+150px/s, now 99, 123 and 147px.

**Challenges, with a doc of their own** (D110 (challenges))
Micro-tasks are called challenges, Igor's word, in the code, the save and on
every screen; a check now fails on the old name in any living doc or the code.
`entities/challenges.md` holds the challenges, the points they pay and the
attributes the points buy, its tables held to the code like every entity doc's;
the attributes' numbers moved there from `design.md`.

**Micro-tasks are ladders** (D109 (micro-tasks are ladders; steps cost more as
they rise))
Five tasks, each a different skill, each a ladder of four rungs that pay once,
ever, in any layer: `untouched` (clean batches in a row), `footwork` (batches
without a dash), `beeline` (the glowing fish killed first), `flurry` (kills in
two seconds) and `swift` (a layer against the clock). Rung k pays k points;
step n of an attribute costs n. The Attributes screen and the pause menu list
every task with a badge per rung earned and what the next asks and pays; the
status bar counts each live, and tasks paying on one tick share the notice.
`home`'s layer list loses its task marks; the help gains a line. The rungs are
sized from the dive's shape and the bot, as a floor
(`specs/2026-10-15-micro-task-ladders-design.md`). The save goes to version 7:
a v6 save's tasks become rungs, its steps come back as points, and the batch's
clock, read only by the old `swift`, is gone. Found on the way: the help's last
line could sit on its hint while its layout check passed; the check now asks
for a line's height, and the key list starts higher.

**Recorded: waves, and micro-tasks opened**
Igor's note from playtesting — the game too easy and predictable, waves to
push a fast clear — in `ideas.md` → Pace, with Crimsonland as his reference.
What micro-tasks pay is opened for discussion with how attributes grow; the
tasks themselves stay.

**Recorded: two notes for balance**
In `ideas.md` → Open — from playing S5 (content), in Igor's words, both for
S6 (balance): the puffer still feels clumsy, faster or with acceleration
maybe, which acceleration open; and the Knife's arc halved.

## 2026-10-14

**Cleanup after `/simplify`**
Four review passes (reuse, simplification, efficiency, altitude) over the
day's diff, S5 (content) through bites. No behaviour change: the window-size
check's three dives take 844.46s before and after, and every check passes.
`swing()` works each fish's distance out once; the enemy loop works the
direction to the diver out once, for every behaviour, the chase and the dash's
shove; the status bar's one-use `statusEntry` is inlined; the save's migration
finds a type with `enemyType()`; the eel's comments are one paragraph. In the
tests, `play()` and `die()` are one copy each, in `harness.js`, and the entity
docs check builds every behaviour's table — a fish's or a weapon's — with one
helper.

**Fish bite** (D108 (fish bite))
The drifter, the darter and the bulwark swim up, stop, open their jaws — a
dark wedge toward you — and bite a heart only if you are still in reach: the
drifter a short bite, the darter a quick nip it slides past, the bulwark a slow
chomp with a long reach. The eel's body shocks: it is the one fish that hurts
on touch. The archer, the puffer and the lungers hurt only by their attack —
the boss's body is safe except while it charges. The save goes to version 6,
and a dive saved before bites has fish that bite. Found on the way: the
window-size check now aims on a grid every tested scale puts on whole pixels
and requires identical dives, since hovering fish made a fraction of a pixel
send dives apart; and version 5 now has its fixture.

**The diver swims in water, and faces** (D107 (the diver swims and faces; fish
with a ramp))
Movement eases now: a quarter second to full speed, a glide to a stop when you
let go, and a reversal that swings through. The diver has a facing, drawn as a
mark, that turns toward the keys — a fifth of a second for half a circle — and
the dash goes along it: at any angle, and from a standstill too. Out of a dash
the swim carries on along it. Drifters, darters and bulwarks ease their chase
the same way, each its own weight, so they overshoot a sidestep. The save goes
to version 5. Found on the way: `design.md` quoted 191 browser checks where the
suite runs 194.

**The puffer bursts and comes on again** (D106 (the puffer bursts and comes on
again))
It chases, stops for half a second, bursts, and chases on — it no longer dies
in its own burst, so a batch of puffers has to be killed, not waited out. After
arriving and after every burst it chases at least 1.5s before it can light
again. Found on the way: a fish cut down by the Knife's swing was still stepped
that tick, so a puffer cut as its fuse ran out burst after death; a dead fish
now takes no step.

**The Knife swings** (D105 (the Knife swings))
No shot any more: each pull cuts an arc toward the cursor, 120° wide, and every
fish whose body reaches into it is hit at once — nearest first, up to its
pierce + 1. The wedge is drawn as it cuts. Its reach is 56 plus the blade's
width, so Bloom lengthens it and Lance lets it cut more. The help says the Knife
swings.

**Bodies doubled** (D104 (bodies doubled))
The diver and every fish are twice the radius — a drifter 18, the boss 84 —
from Igor's note that everything is small. The field, speeds and ranges are
unchanged; shots, gems and pickups keep their size. A fish now arrives past
the edge by its whole body, so a mini-boss no longer pops in half-visible.

**The status bar shows everything; two wordings fixed** (Igor's notes from
playing S5 (content))
The bar over a dive grows from one line to five, each its own colour: hp, the
suit's guard, gems and the weapon carried with its tier, in bold; the layer,
the batch within it, the fish left, time and kills; the mods held and the
boosts running; the layer's micro-tasks; then the development readout (D52
(the development readout)), dimmed. Its text is built in `game/`
(`statusLines()`), so it ports and a check reads it. A weapon's row on the
Gear screen says *buy & equip*, *equip* and *equipped* in place of *own it*,
*carry it* and *carried* — what each does is unchanged (D97 (weapons are
owned, and one is carried)). The boosts' lines lose ", for a moment" — cut,
not replaced with the seconds: Claude's pick, since the bar now shows each
boost's seconds left.

**S5 (content) closes** (D93–D103)
Igor: "close s5". Its definition of done, met: the counts — five behaviours,
three weapons, three pieces of equipment, three layers with pools of their
own, three tiers each; seven mods, four boosts with `Rush`, three micro-tasks
and three attributes (D93 (the content stage's counts)) — held by a check;
adding the last enemy, the eel, cost less than the puffer before it; every
behaviour checked on its state transitions; no layer a fixed list; playable —
Igor played it, and his fourteen notes are in `ideas.md` → Open — from playing
S5 (content). Two were built inside the stage: the debug mode (D102 (the debug
mode)) and New game (D103 (new game erases the save, after a warning)). The
five proposed for S5 (content) are now proposed for before S6 (balance), which
opens on Igor's word.

**New game, behind a warning** (D103 (new game erases the save, after a
warning))
The title's last row, New game, opens a warning in red — what it erases:
gems, gear, attributes, micro-tasks, depth, and any dive in progress — with
Cancel marked, so Enter and Esc erase nothing. Erase everything and start
writes a fresh save and opens `home`. It brings forward the New game D90
(Continue goes straight back in) left to S7 (alpha polish).

**The URL flags `&immortal` and `&damage` are gone** (D102 (the debug mode))
Igor: "yes, remove redundant". The debug mode's rows do their job, and the
tests and the bot set immortality and the damage override directly. The
debug mode now starts muted — "silence debug by default" — and M turns the
sound on: the mute moved into `game/` state, beside the volume.

**The debug mode** (D102 (the debug mode))
`?debug` opens a setup screen in place of the title: the layer and gate, which
fish and how many, the weapon and its tier, equipment, attributes and mods,
immortal, one-shot and the seed — four columns built from the tables. Dive
plays it; R plays it again from any screen, Backspace goes back to it, and
every way out of a debug dive leads there. A value comes round at either end.
Every row has a tip under the columns — what it is and what it changes, worked
out from the records, so Barbs, dim with the Gun, says it goes with the
Harpoon. The save is never read or
written: every save now asks `saveNow()`, the platform's included, and it
writes nothing in the debug mode. The setup travels as a code the address bar
keeps — `?debug=L2,G7,S4471,Harpoon2,puffer4` — so an issue carrying the URL
replays exactly. Menus gained rows that hold a value, and grids of their own.
The first of Igor's notes from playing S5 (content) to be built.

**Recorded: Igor's notes from playing S5 (content)**
Each in `ideas.md` → Open — from playing S5 (content), in his words, with the
home Claude proposes for it: a debug mode, the screens, the stage's fish and
the Knife, graphics, and what micro-tasks pay. Unity is assessed for the port,
beside the other candidates. The Knife does not read as melee to Igor, so by
D83 (the weapon record) it needs a behaviour of its own (`entities/weapons.md`).
`ideas.md` lost its last two line counts (D92 (no line counts in the docs)).

## 2026-10-13

**Specs to `docs/specs/`, plans dropped** (D94 (superpowers dropped))
Igor: "do something with superpowers dir". The specs are kept — decisions and
tests point to them for a stage's design and its check against
`foundations.md` — and moved to `docs/specs/`. The plans went: build
scaffolding, stale once built (git keeps them). S3 (one boss, one complete
layer) had no spec, so its plan's design part is kept as one. `CLAUDE.md` now
keeps a stage's plan and log in the session's scratch space, never the repo.

**Superpowers dropped** (D94 (superpowers dropped))
Igor: "yes drop it". The superpowers plugin is switched off for this project in
`.claude/settings.json`, and a docs check keeps it so. What it gave that the
rules did not already say is now in `CLAUDE.md`: failure cases listed before
building, the whole change reviewed at the end, a root cause before any fix,
and a spec, plan and log for stage-sized work. Its collision list is gone from
"Skills and plugins", which keeps ponytail, disciplines and the global rules.

**Three layers, each with pools of its own** (D101 (three layers, each with
pools of its own))
A third layer, in deep teal, and every layer now draws from pools of its own:
the first meets the archer in its last stretch, the second brings the puffer,
the third the eel, with everything mixed by the end. Fifteen gates a layer, as
before. A `layer-3` scenario starts its top. The counts S5 (content) asks for
are now held by a check. A boost check that drew a fresh boost inside a
`find()` — invisible while `Rush` was the only one — draws once now, and
measures the boost it got.

**Two micro-tasks: swift and footwork** (D98 (attributes, micro-tasks and what
gear requires))
Beside `untouched`: **swift** pays a point for a batch cleared within 10
seconds of arriving, **footwork** for a mini-boss beaten without dashing — each
once per layer, ever, like the first. `home`'s layer lines show all three. The
dive keeps `batchTime` and `batchDashed`, saved.

**Three boosts: Frenzy, Lance and Bloom** (D99 (weapon mods, and more boosts))
Kills now drop four kinds of boost: `Rush` as before, **Frenzy** (fire much
faster), **Lance** (your shots go through four more fish) and **Bloom** (your
shots swell). The readout shows the shot's `size`, and its check now covers
what boosts move as well as mods. The diver's shots are drawn as wide as they
hit, so a swollen shot — and the Knife's slash — looks its size.

**Equipment: the Mask, the Suit and the Weights** (D100 (equipment: the Mask,
the Suit and the Weights))
The first equipment, three tiers each on the Gear screen: the **Mask** reaches
further, the **Weights** hit harder, and the **Suit** takes the first hit of
every batch — one more a tier — shown as a gold ring around the diver. A
guarded hit costs no heart but still counts against `untouched`. New sound,
`guard`; the diver gains `guard`, and the dive `guardLeft`, saved.

**Barbs, the first weapon mod** (D99 (weapon mods, and more boosts))
The seventh mod: the Harpoon's shot goes through one more fish a pick. A weapon
mod is dealt — by a fish or on a layer end's card — only while a weapon it fits
is carried, so with the Gun or the Knife it never comes.

**The Knife** (D97 (weapons are owned, and one is carried))
The third weapon, melee tried as data: three slashes a second, each a very
short, wide shot that cuts through everything in its arc — you have to be among
the fish. 100 gems. Tiers: reach, damage, rate. Whether it reads as melee is
Igor's call. The `knife` scenario dives carrying it.

**The Harpoon** (D97 (weapons are owned, and one is carried))
The second weapon: slow, long and heavy — a shot every second and a bit that
flies fast and far, hits for three and passes through two fish into a third.
It costs 150 gems and needs a point of Strength, so a fresh diver earns one
first. Tiers: damage, rate, pierce. The `harpoon` scenario dives carrying it.

**Heart and Strength; gear that requires an attribute** (D98 (attributes,
micro-tasks and what gear requires))
Two attributes join Dash reach: **Heart**, one more heart, and **Strength**,
which makes the dash hurt what it shoves. Gear can now require points spent on
an attribute — `requires: { Strength: 1 }` — and until they are, its row is dim,
says what it needs, and takes no gems.

**Weapons are owned, and one is carried** (D97 (weapons are owned, and one is
carried))
A weapon's row on the Gear screen now owns it for its gems — and carries it at
once — carries an owned one for nothing, or raises the tier of the one you
carry. The Gun costs nothing and is owned from the start. A scenario can name
the weapon a dive carries (`weapon:`), for S6 (balance) to measure each. The
save is version 4: a v3 save owns and carries the Gun. Two fixture checks that
pinned the version as a literal 3 now read the build's own.

**Gear and Attributes, a screen deeper** (D96 (gear and attributes on screens of
their own))
`home` is now Dive, Gear, Attributes, Help and Options: the weapons and the
equipment sit on a Gear screen with your gems, the attributes on an Attributes
screen with your points, each left by Back or Esc. A dozen rows on one screen
would have run through the hint. The browser suite now holds every menu's rows
above the hint, so `ideas.md`'s "guard the other screens against overflow" is
done for the menus.

**The archer, and enemy shots** (D95 (three enemy behaviours, and one way to be
hurt))
The first of S5 (content)'s behaviours: a blue fish that keeps its distance and
spits a slow shot at you every two seconds, only while it is in range and in
sight. Enemy shots are `bullets[]` entries marked `evil` — they cost a heart
where they meet you and never touch a fish — and a bite and a shot now hurt
through one function, `hurtPlayer()`. `makeEnemy()` copies every behaviour field
a type has and the docs check builds a table per behaviour, so the next one
costs neither. `all-types` replaces `three-types`. New: `tests/enemies.test.js`;
`entities/enemies.md` gains the archer, the spit and a table per behaviour.

**The puffer** (D95 (three enemy behaviours, and one way to be hurt))
A yellow fish that swims at you, stops near you and swells for a second with
its blast ring drawn, then bursts — a heart if you are inside the ring. Shoot
it first, or shove it away with the dash. A burst pays nothing: no gems, no
boost, and a glowing puffer's mod is lost. A new sound, `pop`, and a help
line: "Some fish spit from afar; a puffer that swells is about to burst."

**The eel** (D95 (three enemy behaviours, and one way to be hurt))
A teal fish that closes in swaying side to side, so you have to lead your
shots. Five behaviours now — chase, lunge, spit, fuse, weave — on six ordinary
types and the two lungers.

**S5 (content) opens; the `abyss-content` skill** (D80 (entity docs and mods
from drops come first))
Igor, both requirements before S5 built: "all ready, start working". The pass
before it closes into `plan.md`'s table of closed stages, its section gone —
its history is here, on 2026-10-01 and 2026-10-12. The stage's first step, as
`plan.md` set it: `.claude/skills/abyss-content/SKILL.md`, the procedure every
addition follows — what a piece is settled with Igor first, where each kind's
record, doc and rules are, the build order from a red check to the stop
before committing, one addition per commit so its cost can be read off
`git show --stat`. `CLAUDE.md`'s "Content is data" points to it. Written
without the subagent pressure tests `writing-skills` asks for — subagents are
Igor's to pick — so the first addition under it is its test.

**S5 (content) gets counts: mods, boosts, micro-tasks, attributes** (D93 (the
content stage's counts))
Igor, after asking whether S5 was ready: "include in s5: design and add 5-7
mods and 3-5 boosts", then "add total of 3 micro-tasks to the plan in s5" and
"add 3 attributes along with micro-tasks". `plan.md` → S5, in its work and its
exit: 5–7 mods in total, 3–5 new boosts beside `Rush`, three micro-tasks and
three attributes in total. Its exit loses "the mod pool covers
a full dive" — 5–7 mods at today's caps cannot — and whether the caps go or
grow is open in `ideas.md`, S6 (balance)'s. `ideas.md`'s comfort note no
longer has S5 growing the pool. Docs only; nothing in the code changed.

## 2026-10-12

**No line counts in the docs** (D92)
Igor: "remove line count from docs, updates frequently and no one needs this
info". Gone from `design.md` → Files with the platform share, their ratio, and
its history; the test that held them to the code went too.

**Two fixes from the cloud review** (D84, D18)
A mod still flying to you was not counted against its cap, so its last slot
could be dealt again before it landed: the next batch lit a fish for it, and
that fish's death crashed the game with nothing left to draw — or, if it died
first, the mod went one past its cap. Both draws now count a mod in the air as
held (`held()`); three tests in `tests/drops.test.js`. And the Volume option
reached for platform's gain node, `master` — an eighth name past the seam that
no test drove. `sound()` now sets the gain from `volume` itself, and a test
drives every option on the seam alone; the docs' "an eighth name breaks the
build" now says it holds on paths a test drives.

**Comments amend the code** (D91)
Igor: "comments must not define or contradict the codebase, but amend it".
Every comment in the code and the tests read against its code: history,
quotes, dates and copied numbers out, contradictions fixed — 16 files, 242
lines fewer, no code changed (checked against the last commit with comments
ignored). The convention is in `CLAUDE.md`. Also: a failed docs check now
prints only the text it wanted, not the whole doc it searched (`expectIn` in
`tests/docs.test.js`). The platform share in `design.md` rose two points, all
of it `game/`'s comments.

**Mods from drops: a glowing fish, the layer end's pick, boosts; rank retired**
(D84–D90)
The second requirement before S5 (content) (D80 (entity docs and mods from
drops come first)). Opened 2026-10-01 as a discussion — research into how a
dozen games hand out power mid-run, three shapes — and Igor chose: "go with
B". Then, building it: "good to go … implement with no interruption"; and,
having played it, a round of corrections (D88–D90). Design, research and its
check against `foundations.md`:
`specs/2026-10-12-mods-from-drops-design.md` — its fish lighting
up partway through a fight is superseded (D88).

- **Gates**: no pick and no pause. One fish of each batch glows from the moment
  it arrives — a gold ring — never a boss or a mini-boss, and carries the
  batch's mod, drawn from a round of the ordinary mods under their caps;
  killed, it drops the mod, which flies to you and is named on a pickup line of
  its own (D84 (mods are dropped), D88 (the fish glows from the start)). A
  mini-boss's gate pays no mod. With every ordinary mod capped, no fish glows.
  The gems and heart fill cards are gone.
- **The layer end**: the one pause. Up to three valuable cards — `Mend`, now
  the layer end's own, or an ordinary mod at ×2 — one marked by a click, its
  number or the arrows, taken by Continue or Enter (D85 (the layer end's pick)).
- **Boosts**: kills drop them, more likely with every kill since the last,
  never from the arena's last. One lies where it fell for 6s, blinking out;
  touched, it adds its numbers for its time — `Rush`, speed +200 for 5s
  (D86 (boosts)). New entity doc: `entities/boosts.md`.
- **Rank** is gone from the state, the HUD, the cards and the end screens
  (D87 (rank is retired)).
- **The layers are Layer 1 and Layer 2** until they are named, and a layer's
  micro-tasks are kept by its number (D89 (layers are numbered until they are
  named)).
- **Continue goes straight back into a saved dive**, and **a dive ends on two
  buttons, Dive again and Go home** — Go home marked, R gone (D90 (Continue
  goes straight back in)). A New game beside Continue waits for S7 (alpha
  polish). **point** joins the glossary: an attribute point.
- **The save is version 3**: a v2 dive loses its rank and, saved with the cards
  up, takes the card it had marked; its micro-tasks move from layer names to
  numbers. `tests/fixtures/save-v3.json` joins the other two.

Found while building, and fixed: a pickup and a clean batch's micro-task wrote
over each other on one line — the pickup got a line of its own; the cards'
screen stopped reading the mouse, so the next menu took a still cursor for a
moved one — it reads it again, marking nothing. The help blurb's new line ran
4px into its hint — two lines became one.

Docs: the glossary (**rank** gone, **boost** and **point** new; mod, gate,
layer end, mini-boss rewritten) and the genre contract's points 4–6; `design.md`;
`entities/mods.md` (the `end` field, no fill cards); the docs map; `plan.md`;
`ideas.md` (the answered item out, mod points declined, a rank only play can
earn suggested); `roadmap.md`'s bot figures re-measured; `CLAUDE.md`'s glossary
words; `entities/enemies.md`'s `carries`. Checks: `tests/drops.test.js`, new;
the offer checks in `tests/` and `checks.js` rewritten for a gate that opens
nothing, a layer end that marks and continues and an end screen of two
buttons; 31 deliberate breaks, each caught.

## 2026-10-01

**The weapon record: a line of data, one carried per dive** (D83)
Igor: "design weapon record", then "approved" — the rest of the first
requirement before S5 (content). The Gun is the first line of `WEAPONS`: its
rate, damage, range and pierce left `PLAYER_START`, `BULLET_SPEED` became its
`shotSpeed` and the shot radius hard-coded in `game/logic.js` its
`shotRadius`. A dive copies the carried weapon's numbers onto the player, then
its tiers — each now its own `{ cost, apply }` — and the equipment's;
`GEAR`, left with the equipment, is `EQUIPMENT`. The save is version 2: a v1
dive's player gains the Gun's shot as it was, 430 and 4, as it loads — the
first migration — and `tests/fixtures/save-v2.json` joins the v1 fixture.
Owning a weapon and choosing which to carry come with the second, in S5
(content); weapon mods name the weapons they fit, superseding D31 (two-tier
progression)'s second argument to `apply`. Design and its check against
`foundations.md`: `specs/2026-10-01-weapon-record-design.md`.
`entities/weapons.md` is now an ordinary entity doc, its tiers a table.
Nothing changes in play.

**Entity docs, and the docs reorganised around a map** (D81, D82)
Igor, having read it: "ok, commit". The first requirement before S5
(content) (D80 (entity docs and mods from drops come first)). Igor's goal:
docs for weapons, mods, enemies and equipment — "includes currently
implemented, easily scalable for more", "all the relevant meta for each item:
naming, numbers, descriptions" — micro-tasks left out, and `docs/` organised so
"everything can be easily found, files arent bloated with obsolete or
excessive info, and files are always in sync". On the layout: "do without
review".

New: `docs/entities/` — `enemies.md`, `mods.md`, `weapons.md`, `equipment.md`,
each a roster with every number, the record's fields, a section per item and
how to add one; `threat` reserved for S6 (balance); "equipment" in the
glossary (D81 (entity docs, one per kind)). `docs/README.md` rewritten as the
map — living docs and logs, one home per fact — and `CLAUDE.md` now reads
`foundations.md` and `plan.md`, then looks the rest up (D82 (the docs map)).

Trimmed: `ideas.md` from 621 lines to 413, answered items out; `plan.md` from
426 to 133, the closed stages one table and D35's `+N` popup carried to S7
(alpha polish); `roadmap.md`, the superseded phases and the constraints
pointer; `design.md`, what the entity docs own, the dash's history and four
stale statements. The root `README.md` regained the `layer-2` scenario and
fixed two stale rows. `game/content.js`: four comment lines pointing at the
docs.

Checks: `tests/docs.test.js` gains the entity docs — rosters rebuilt from the
code, fields, sections — the map, every `NAME value` quote in a doc that
describes the code, the diver's starting numbers in `design.md`, and the
README's scenarios. 21 deliberate breaks, each caught by the check meant to
catch it. **Not done**: the weapon record — the Gun is not a record yet, so a
second weapon is not a line.

## 2026-09-30

**Two false comments removed** — Igor: "fix them already". In `game/logic.js`:
the `ponytail:` note on `BATCHES`, whose debt S4 (meta loop skeleton) paid — a
layer owns its batches (D71 (batches are drawn from pools)); and `clearBatch`'s
D59 (no mods at the layer end) paragraph, which D68 (the layer end is a
milestone) had made false. The last layer's line now cites both. And the
entity-docs session gains a job, Igor: "yes" — it settles the weapon record,
which does not exist yet, and reserves the enemies' `threat` field, so S5
(content) starts on final shapes (D80 (before S5: entity docs, mods from
drops)).

**S4 (meta loop skeleton) closes; two requirements come before S5** (D80)
Igor: "yes, close s4 and commit after cleanup", the playable exit his call —
"if you ask if it's ok at current stage, yes it is". `/simplify` ran four
reviewers over the stage's code; applied: one seeded draw without repeats
(`drawDistinct`) for the mod cards and the plan; menus found by `MENUS[screen]`,
with `back` for Esc and one `openMenu()`, so `home` now freezes the water like
every menu; `home`'s layer lines built in `game/` (`MENUS.home.lines`) and only
printed by the renderer; fillers marked by having no `max`, so their cards no
longer read "held 0"; the Gun row dimmed by the same `canBuy` that `buy()`
checks; boot without a throwaway dive, the title's no-dive state being the
state's own defaults; `saveError` moved to the renderer that shows it; `atGate`
shared from the harness; nine unused harness names dropped; the window-size
check's cap scaled by the number of layers; `meta.test.js` loading one game per
property rather than one per case. One check added: Esc on `home` returns to
the title. Every refactored rule broken again, all ten caught. Then Igor set
two requirements before S5 (content), each its own session: a markdown doc for
every game entity, and mods reworked from a choice into enemy drops (D80
(before S5: entity docs, mods from drops)). Raised: S5 (content)'s entry also
needs a weapon record, which does not exist.

**Gems go to the player; dives go from easiest to hardest** (D78, D79)
Docs only. Igor answered the two things S4 (meta loop skeleton)'s sweep
raised. Gems: "dropped by enemies (sometimes it should not - balance),
autocollected by pulling towards a player" — what was built; D35 (currency is
auto-collected) is amended to match, and whether an enemy drops at all becomes
a balance lever (D78 (gems are pulled to the player)). The `+N` popup D35
promised is feel, left for S7 (alpha polish). Batches: "all dives go from
easiest to hardest. what it means is a question of balance" (D79 (a dive goes
from easiest to hardest)). Claude read that as "every batch harder than the
last" and opened a design pass on batch difficulty; Igor corrected both the
same day — "OVERALL gradual increase in threat", "some later batches might be
easier", and the threat system for enemies "is part of balance", so S6
(balance) builds it, in the direction he chose (a threat number per enemy
type). D79 now says so; `plan.md`'s S6 (balance) carries the work. Queued for
a later session: strict reference docs, one per enemy, gear piece and mod.

**S4 (meta loop skeleton) built — awaiting Igor's play and close** (D74–D77)
Igor opened the stage ("kick off with s4"), settled its two questions — mods
add on top of gear and attributes, which he had already answered (D74 (mods on
top; dash improvements are attributes)) — agreed the content (D75 (the gun's
tiers, dash reach, a clean batch)), approved the design in three parts, and
said "just plan for yourself and implement". Design:
`specs/2026-09-30-s4-meta-loop-design.md`.

Built: a layer is a record of stretches with pools, and a dive draws its whole
`plan` from its seed (D71); a second layer, the first one's content under its
own name and colour; the layer end pays a rank, the cards, a full heal and the
boss's haul of 30, and the last one is the win (D68); every mod capped, gems
and a heart filling an offer (D69); gems that come to you from anywhere and
never fade; `home` between dives only (D76), with the gun's three tiers, dash
reach and the "untouched" micro-task; a versioned save holding the dive in
progress, written on pause, purchase, dive end and page hide, refused loudly
and kept aside when unreadable, with `persist` as the seam's seventh name
(D70, D77). `BATCHES`, `GEM_LIFE` and `pickupRange` are gone; `GEM_PULL` is
600. Checks: `tests/meta.test.js` new, 59 Node tests and 178 `?test` checks
pass, every new rule broken once to see its check fail — 24 breaks, 23 in
Node and `home`'s layout in `?test`, all caught, one only after its test was
tightened. Found and fixed on the way: killing a
scenario's hand-placed enemy crashed (`?dev=one-drifter&play`), and a gem
caught on the frame of death was not banked. **Raised, not fixed**: D35
(currency is auto-collected) says gems fly to the *counter* with a debounced
`+N` and a random value; S4 built "they fly to you" from its spec's reading.
Measured in `roadmap.md` → Health: two dives to the first purchase; the gun's
first tier roughly triples the gates the bot clears.

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
`foundations.md`: `specs/2026-09-30-layer-to-layer-design.md`.
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
enemy it backs out of its own range. The design:
`specs/2026-09-29-s3-boss-design.md`.

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
