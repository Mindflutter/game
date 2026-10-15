# Ideas, wishes, proposals

The inbox: everything undecided, and nothing here is committed to. Status is
one of: **open** (live, undecided) · **parked** (agreed direction, not now) ·
**declined** (decided against — kept so we don't re-litigate it).

An item leaves this file in the same step as a decision answers it, or when it
is built: the decision, or the changelog, is its record from then on.

---

## Open — needs a decision before work continues

Nothing waits on a decision.

---

## Parked — agreed direction, deliberately not now

### Trade-off mods
**Still parked, and now cheaper.** D31's `scope`/`apply(player, weapon)` shape
makes a trade-off mod the same one-line record it always was.
Originally: **Parked 2026-09-19** — Igor: "reject now, save for the future ideas." Not
declined, deliberately not next. Kept parked through the mods rework (Igor,
2026-10-12: "ok"): since D84 (mods are dropped) nobody chooses a fish's mod, so
a trade-off it carried would be a curse you cannot refuse. A boost is the shape
that fits — touched or left alone, the choice is the player's (D86 (boosts)).

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
rewritten. Placeholder shapes answer whether a darter can be told from a
bulwark at a glance, but Igor finds them hard to follow (Open — from playing
S5 (content) → Graphics, below), and "does it look good" can only usefully be
asked in the engine you are shipping in.

**For the record** — Igor, 2026-09-29: "keeping graphics in mind, enemies and
the player will look significantly bigger with all assets. record for info."
Today the drawn circle *is* the hitbox, so bigger art means either bigger
hitboxes — every radius in the balance block moves — or art that overhangs
what it collides with. D104 (bodies doubled) took the first, before S6
(balance): the hitboxes grew with the circles.

### Port to a native executable
**Reaffirmed as post-alpha by D30**, after the question was reopened on
2026-09-26 and answered "still throwaway". Rust or C++, dropping the browser
build afterwards. Candidate frameworks, from
closest-to-a-literal-port outward: **macroquad** (Rust) and **raylib** (C/C++)
are near 1:1 with the current canvas code; **Bevy** (Rust, ECS) is a redesign
rather than a port; **Godot** is the pragmatic answer if "performant engine" is
the real goal. See `decisions.md` for what makes the port cheap.

**Unity, assessed 2026-10-14.** Igor: "i heard that unity is good for 2d games
too, and it has a cli and you got the plugins, can you assess the tooling?"
C#, so not the Rust or C++ above. Its agent tooling became real in 2026: the
Unity CLI — in beta, `1.0.0-beta.10` on 2026-09-22, no release date — runs
edit-mode and play-mode tests in batch mode, runs C# inside a running Editor
without a recompile (`unity eval`), drives development builds, and has an MCP
mode; Unity's own Claude Code plugin (2026-09-09, Unity 6 and later) installs
it with Unity's skills, 2D and tilemaps among them. Rough edges, from third-party
reports: a domain reload breaks the MCP session, a modal dialog stalls an
agent, the Editor sometimes needs focus before it recompiles, and a call costs
about 0.8s. Unity Personal is free under $200K of revenue and funding a year.
What carries over would port well: `game/` to C# nearly line for line, the
tables as plain C# data, the checks to the Unity Test Framework. What would
not: scenes and prefabs are the Editor's files, worked through the Editor
rather than as text. Against the list above, Godot keeps everything as text,
runs headless and needs no account; macroquad and raylib are code alone and
leave the art pipeline to be built. Claude's read: strong for real 2D graphics,
weaker than Godot for an agent working in text, and moving fast — so assessed
again at the port, after alpha.

Known friction in Rust specifically: methods on `self` called while iterating
`self.enemies` won't borrow-check. Fix by looping on indices or collecting
events and applying them after the loop. `nearestEnemy()` returns
`Option<usize>`, not a reference.

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

**weapon** — fits only the weapons it names (D99 (weapon mods, and more
boosts)); the first, Barbs, is built.

## Fish ideas — a running list

Open collection, from Igor's playtesting. Nothing here is committed. Each must
ask the player for a different answer than the fish already in the game —
diverse in behaviour, not only in type (`high level design.md`). The fish that
exist are `entities/enemies.md`; an idea moves there when it is built.

- **A fish that dashes.** Igor, 2026-10-15. The lunge is a dash, but only the
  boss and the mini-boss have it (D64 (the lunge)); an ordinary fish with a
  short, quick one — a smaller tell, more often — would be new.
- **A fish whose shots arc.** Igor, 2026-10-15. The archer's spit flies
  straight (D95 (three enemy behaviours, and one way to be hurt)); a lob, or a
  fan like the boss's spit idea (More boss attacks, below), lands where the
  diver will be or covers a spread.
- **A shooter that flees.** Igor, 2026-10-15: "escaping range-shooting
  enemies". The archer already backs off inside its band (D95); one that runs
  from the diver and shoots as it goes would make the player chase.

## Recorded future opportunities, explicitly not now

- **Multiplicative interaction between `gear` and `attribute`.** Parked by D36,
  not declined. Igor's framing is right — one character, every progression feeds
  it — and the door is deliberately left open. The reason to wait: additive
  systems give power ∝ (a+b), which a linear intuition can track; multiplicative
  give a×b, so the ceiling grows quadratically and the gap between an optimised
  and a naive build explodes, forcing balance to target the product's maximum
  and making ordinary builds feel weak. Revisit only after S6 (Balance) has the
  additive version measured, so there is a baseline to compare against.

- **Comfort is down to one mod.** `Mend` is the last comfort mod standing: of
  the three D34 (mods) named, D35 (currency is auto-collected) left the
  currency magnet nothing to do and `Lull` is declined (below). Since D85 (the
  layer end's pick) it is one of the layer end's own, so no fish carries a
  comfort mod at all. Not a design problem yet — S5 (content) designs the pool,
  5–7 mods (D93 (the content stage's counts)) — but comfort is meant to carry
  the pool's width.

- **The dash economy: two mods and an attribute feed one verb.** Igor, 2026-09-27,
  playing D54: "once the dash becomes long, it feels way easier" and "dash
  length + dash damage is the cool build, might want to rebalance". Measured
  numbers live in `roadmap.md` -> Health. `Fins` does not feed the dash
  (D56 (the dash is a fixed, committed lunge)), so what points at it is
  `Reflex` (cooldown) and `Impact` (damage), both capped at 3, and the Dash
  reach and Strength attributes at `home` (D75 (the gun's tiers, dash reach, a
  clean batch), D98 (attributes, micro-tasks and what gear requires)).

  What is still open:
  - **`Reflex` is the real multiplier.** At its max it roughly doubles both
    dash kills per second and invulnerable uptime (`roadmap.md` → Health, the
    dash build). It was never the mod Igor named, and it is the one doing the
    work.
  - **`Impact` beyond x1 is nearly dead.** Drifters and darters have 1hp and
    are the bulk of every batch, so x1 kills as many as x3. Only bulwarks see
    the rest — and since S5 (content), the archers, puffers and eels, with two
    and three hit points. Dropping its max to 1 until enemies with real hp exist is the
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
  spit can use the enemy shots the archer brought (D95 (three enemy
  behaviours, and one way to be hurt)).

## Open — raised during S4 (meta loop skeleton)

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

## Open — raised before S5 (content)

- **Mod caps: removed, or bigger — S6 (balance)'s.** 5–7 mods (D93 (the
  content stage's counts)) at today's caps hold at most 19 picks, and a dive of
  3–5 layers lights 36–60 fish — twelve a layer — so the pool runs dry
  by the second layer and every fish after that stays dark. Igor, 2026-10-13:
  "i dont feel like limiting mods is a problem now. we can remove the limit
  entirely and see how it affects balance. or bigger caps, yes. dont really
  matter at this point". Until then the caps stand (D69 (every mod capped)).
  Removing them would reopen the glossary's "every mod has a cap" in
  `foundations.md`.

## Open — from playing S5 (content)

Igor, 2026-10-14, after playing the stage's build: "they dont necessarily need
to be addressed within s5, so your job will be to also categorize them and
record properly. we gotta discuss all the details within each comment ofc - not
necessarily within s5 or this session." Each note keeps his words. **Home** is
where Claude proposes it be built: a proposal, unconfirmed until the note is
discussed.

**Tooling**

- **Unity's tooling, assessed** — Port to a native executable, above.

**Screens**

- **`home` shows the character; gear and attributes stop being lists.** "gear
  & attributes submenus are really hard to use. on home screen i want to see
  the character - what's equipped, what weapon is on, attrs, tiers. submenus
  could be dropdown on home screen for example. all with buttons and clear ux,
  currently theres one row per item with an arrow. refer to classics for tier
  up." Reopens D96 (gear and attributes on screens of their own), Claude's
  delegated call. What `home` shows and how a tier is bought carry over to the
  port; the drawing does not, and the canvas gets no investment (D17 (the
  browser build is a throwaway prototype)), so how much is built here is part
  of the question. **Home**: S7 (alpha polish)'s UX fixing.
- **Home from the pause menu.** "ability to go home from pause". `home` exists
  only between dives (D76 (`home` exists only between dives)), so this ends the
  dive, its gems banked as at any end (D67 (currency is kept on death)). Kin to
  New game on the title (D103 (new game erases the save, after a warning)),
  which erases everything; this would end the dive alone. Open: whether it
  asks first. **Home**: S7 (alpha polish)'s UX fixing.
- **Hints for every fish and pickup.** "no hints for entities at all - think
  player perspective again". The help's one line on the fish covers the archer
  and the puffer; a mod or boost is named with its line as it lands; nothing
  says what a fish does when it is first met. Bound by the genre contract —
  nothing modal mid-fight (5) — and by the pillar that no mechanic needs more
  than a sentence. Open: where a hint shows — at a fish's first arrival, at
  `home`, in the help. **Home**: S7 (alpha polish)'s UX fixing.
- **Weapons and equipment on screens of their own.** Igor, 2026-10-15: "we
  need to split weapons and gear. confusing to see in one place". The Gear
  screen lists the three weapons and the three pieces of equipment together
  (D96 (gear and attributes on screens of their own)); in the glossary both are
  gear, so the split is Weapons and Equipment. Kin to `home` showing the
  character, above, which may replace both screens. **Home**: proposed, the
  next small step — cheap, and asked for; Igor to confirm.

**The dash**

- **Locked at the start?** Igor, 2026-10-15, with the dash cut by a third (D111
  (the dash a third shorter)): "maybe dash shouldnt be available at the start?"
  A lean. What it would touch: the dash is the second verb since D20 (mouse aim
  and an offensive dash); until it opens, the Dash reach and Strength
  attributes and the `Reflex` and `Impact` mods would buy nothing, so a draw
  would have to hold them back; and `footwork` would pay for not dashing with
  no dash to use. Open: whether, and what opens it — gear, a step, a layer, a
  challenge's rung. **Home**: open.
- **`footwork` must be a feat.** Igor, 2026-10-15, asked whether a player who
  never dashes should earn it: "never dashing needs to be justified - being
  fast enough to avoid most of enemies. i'd say yes, it all comes to balance."
  So `footwork` stays any run of batches without a dash (D109 (micro-tasks are
  ladders; steps cost more as they rise)), and staying clear of most fish
  without one has to take skill. **Home**: S6 (balance), his "it all comes to
  balance".

**Health**

- **Bars, hearts, and hits worth more than one.** Igor, 2026-10-15: "should
  enemies have hp bars? shouls the player? damage exceeding 1?" Open, for
  discussion. Today a hurt fish only shrinks, to 70% of its size near death, so
  the boss's 60 hp show little progress; the diver's hearts are `HP 3/3` text
  in the corner; every hurt costs exactly one heart, through one path (D95
  (three enemy behaviours, and one way to be hurt)); and the player's damage
  already runs past one — the Knife's 2, the Harpoon's 3, the Weights' half a
  point a tier. Claude's lean, unconfirmed:
  - **Fish**: a small bar over any fish of more than 1 hp, once hurt, and a
    bar across the top for the boss and the mini-boss. One-hit fish stay bare,
    so a swarm stays readable. It is also how a stronger version of a fish
    (Pace, below) would read as tougher. A ring round the body was Claude's
    first lean; Igor: "Health rings probably wont work on real assets well" —
    a ring hugs a circle, and a sprite has no clean edge to hug, where a bar
    over any shape works.
  - **The diver**: hearts, not a bar — read at a glance, every hit counts, one
    sentence to explain. A bar earns its place when damage varies widely or
    armour cuts it by a share, and neither is planned. Drawn as hearts where
    the eye is, rather than as text in the corner.
  - **Hits worth more than one heart**, for the heavy attacks — the boss's
    charge, the puffer's burst — so a heavy attack weighs more, and S6
    (balance)'s threat system gets a lever: how often a fish lands, times how
    much. With three hearts a two-heart hit is most of a life, so it comes with
    more hearts at the start, or halves.

  Igor, on the two-heart hit: "2-heart hits, i suggest possible, but not sure
  if fits current enemy model" — a lean, the fit open. In the code it would be
  an amount on each attack's record, passed through the one path every hurt
  takes; in the design it suits the attacks with a long tell — the lunge, the
  burst — rather than the swarm's bites, which stay at one.

  **Home**: proposed — the size of a hit is a shape for this pass, its numbers
  S6 (balance)'s; the drawing after Igor's word.

**The stage's content**

- **The eel is hard to hit** — "a problem of schematic circles, not necessarily
  a bad design." Its behaviour stands; it goes with the graphics, below.
- **The archer works** — "shooting enemies are quite good atm. just a positive
  commentary". Its behaviour stands; its numbers stay S6 (balance)'s.
- **The puffer still feels clumsy.** Igor, 2026-10-15, playing the build with
  D106 (the puffer bursts and comes on again): "exploding guy still feels
  clumsy. maybe acceleration or making it faster would help." A lean, given
  "for balance". What there is to turn: its `speed` (`entities/enemies.md`),
  and a ramp, which D107 (the diver swims and faces; fish with a ramp) gave
  the plain chasers but not the puffer — it chases at full speed from its
  first tick and stops dead to swell. A D107 ramp would make it smoother but
  slower off the mark, not quicker, and changes its step rather than adding a
  line to `game/content.js`. Open: which acceleration — that ramp, or a
  puffer that gathers pace as it chases. **Home**: S6 (balance), his "for
  balance".
- **The Knife's arc halved.** Igor, 2026-10-15: "knife arc reduce by half" —
  120° to 60°, from D105 (the Knife swings)'s pick, given "for balance".
  **Home**: S6 (balance), his "for balance".
- **Swimming through biters costs nothing.** Igor, 2026-10-15: "balance
  issue: i can freely swim thru red & purple enemies without a bite. not
  necessarily always bad, but need to be addressed". The drifter and the
  bulwark: since D108 (fish bite) no fish but the eel hurts on touch, and a
  bite lands only if the diver is still in reach as the jaws shut — 0.3s and
  0.6s after they open — and a diver at full swim is through and out by then.
  Ways to address it, none chosen: bodies the diver cannot pass through, so a
  crowd is a wall and the dash the way through it; contact that slows the
  swim; a snap at once when the diver is inside a fish's body. **Home**:
  proposed — whether bodies are solid is a shape for this pass, its numbers
  S6 (balance)'s; Igor calls it balance, so his to place.

**Graphics**

- **Shapes hard to follow.** "start thinking towards graphics. not saying we
  must go to assets now, but: 1 schematically circles and squares are ok, but
  hard to follow". Not the condition D4 (no assets, ever) waits on: "not saying
  we must go to assets now". The sizes, his second point, were settled before
  S6 (balance) by D104 (bodies doubled). Open: what makes the shapes easier to
  follow, and when.
- **References for each fish and entity.** "image or even gif references for
  enemy types and other entities? too early?" Claude: not too early to collect,
  since they feed the sizes and shapes above; kept as links in the docs, not
  image files (D4 (no assets, ever)). Open: whether to start now.

**Pace**

- **Waves: a push to clear fast.** Igor, 2026-10-15, playtesting: "we need to
  start working on waves. for me the game feels to easy and predictable, i
  dont feel overwhelmed at any point, bosses are easy. here's the point: we
  gotta push the player to clear the enemies fast, because new ones are
  constantly coming (remember the prototype). but - waves must be hard to
  guess, so distribute the enemy spawn into a period of time. it's the
  rogulite - you are dead at some point, but most likely you go FURTHER next
  time and are rewarded for it. so a sense of nervous rush and inevitability
  should come to a player, but not scare him away - motivate istead. and this
  sense is postponed each dive, if you play equally good that is." His
  reference for being overwhelmed: Crimsonland.

  Against what is settled, read for what it means in the game:
  - **It fits D27 (batches are hard-gated)** if a batch stays a bounded queue
    that gates the descent, its fish arriving spread over time, on a clock
    rather than on the last clear — so a slow clear meets the next arrivals
    still fighting. D27 retired the prototype's director because arrivals grew
    without bound and death came at a fixed time whatever the player did; a
    bounded batch on a clock cannot diverge. An endless stream inside a gate
    would supersede D27.
  - **One tension, with the glossary's wave**: a multi-wave batch "must
    telegraph that more is coming". "Hard to guess" can be *when, where and
    what*, while *that* more is coming still shows.
  - **Inevitability postponed by playing well** is the dive's rising threat
    (D79 (a dive goes from easiest to hardest)) and S6 (balance)'s threat
    system: death comes where the threat outgrows the kit, and gear moves that
    point deeper.
  - Kin: fish that arrive from behind the screen, above — arrivals near the
    diver, the fade-in their telegraph.
  - **Crimsonland**: its Survival is the prototype's shape — an endless stream
    on a shortening timer, death certain. Its Quests are nearer this: a finite,
    scripted list of spawns on a timeline, the quest over when all are dead. A
    review's complaint: fish spawning on top of the player unwarned.

  Open: what a wave is — its size, its clock, where it enters — and how it
  reads. **Home**: proposed, this pass before S6 (balance), since it changes
  what a batch is, and the threat system measures batches.

- **Stronger versions of the same fish.** Igor, 2026-10-15: "enemies should
  have levels of their own. same behavior but different attrs. this way we can
  reach more diversity, higher layers & batches may get the same enemies as the
  first ones, but stronger". It is D79 (a dive goes from easiest to hardest)'s
  rise "in numbers and in enemy types" given a third axis: a drifter deep down
  is a tougher drifter. It meets S6 (balance)'s threat system, which gives a
  number per enemy type — each version would carry its own. The word needs
  choosing: "level" is banned (D32 (the glossary)), and "tier" is gear's.
  Open: the word, how many versions, what changes between them — hp, speed,
  bite, size — and how a batch names one. **Home**: proposed, this pass with
  waves, since both change what a batch is; Igor to confirm.

## Suggested but not yet discussed

- **A rank only play can earn.** Claude, 2026-10-01, in the mods rework, when
  Igor asked whether rank "could be something more": a meter that climbs with
  clean, fast clears, drops when you are hit, and raises the odds or the worth
  of what fish and kills drop — as Isaac's devil rooms reward a floor without
  damage. Not taken with D87 (rank is retired): it is a system of its own, and
  it snowballs — good players get stronger still. If it comes, it is the place
  the "easy layers stay relevant" pillar's fast clears could pay into.

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

### Mod points — better mods cost more
Igor, 2026-09-26: "let's make mods shine by adding mod points later on" —
instead of three free picks, a rank-up granting points and each mod a cost, so
a strong mod is a real trade against two weak ones. **Moot since D84 (mods are
dropped) and D87 (rank is retired)**: no rank pays points, and a fish's mod is
not chosen. Declined in the mods rework, Igor, 2026-10-12: "ok".

### A "finished standalone"
Void since 2026-09-26, not answered: the question of what would finish the
survivors-like prototype dissolved when `high level design.md` replaced it with
a full roguelite (`plan.md`). Its four options — a win at three minutes, a
softer curve, straight to sprites, a best score — answered a question nobody
asks any more.
