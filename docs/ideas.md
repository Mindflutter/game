# Ideas, wishes, proposals

The inbox: everything undecided, and nothing here is committed to. Status is
one of: **open** (live, undecided) · **parked** (agreed direction, not now) ·
**declined** (decided against — kept so we don't re-litigate it).

An item leaves this file in the same step as a decision answers it, or when it
is built: the decision, or the commit, is its record from then on.

---

## Open — needs a decision before work continues

Nothing waits on a decision.

---

## Parked — agreed direction, deliberately not now

### A UI for Sonar
Igor, 2026-10-28, as Sonar (D164 (Sonar)) was built: "if you can make a ui
for this, even greater. not required now." A page beside the game to list
the play-tests, read a report and scrub a play's replay tick by tick. What
exists meanwhile: `report.md` and its replay links, one moment each.

### Music
Igor, 2026-10-31: "wont do now, after the graphics maybe". A generated loop
or an audio file, and a file breaks the rule of no assets (`code.md`), as
sprites would.

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
2026-09-26 and answered "still throwaway"; **past alpha, it waits** on the
browser's limits (D154 (the port waits on the browser's limits)). Rust or C++, dropping the browser
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
one already does (D16) — but conflating three different jobs is why the old
bot's numbers were hard to trust. The yardstick and the balance bot are built,
with a standing bot as the cheapest exploit finder (D128 (the balance suite));
the lookahead search is open.

| Job | How good must it be | Shape |
|---|---|---|
| **Regression yardstick** | Consistency matters, skill does not. A *dumb* deterministic bot is better than a strong one — you want a fixed ruler, not a good player. | Scripted policy. Exists. |
| **Balance measurement** | Must play roughly like the intended player, or the numbers do not transfer. | Threat-field navigation: danger gradient from enemy positions and velocities, move down it, aim at highest-value target, dash when cornered. Built: the diver bot (D128 (the balance suite)). |
| **Exploit finder** | Should *optimise*, not imitate. Its job is to find the cheese — "stand in this corner, never move, win" — which is exactly the balance bug worth catching. | Lookahead search. Viable **because** the game is deterministic after S0: fork the sim, roll out candidate actions, pick the best. |

**Declined:** a learned/RL bot. Needs a training harness and compute, and would
be a research project that teaches nothing about this game.

**A bot that plays like Igor.** Igor, 2026-10-31, on the standing bot that
clears batches (`bugs.md` → Nothing trivial fails across all three layers):
"probably the bot being too good. i havent had that feeling when playing
myself. … design a bot that plays like me based on all playtests data". The
balance row's "roughly like the intended player", made measurable: Sonar
holds every play's input, so a scripted bot's knobs — how late it reacts,
how far its aim strays, how often it dashes, how long it stands — can be set
to what Igor's plays show, without the learned bot declined above. Open: the
knobs, and how many plays fit them. It would also answer the stood bars: a
standing bot with Igor's aim either still clears a batch, or the bug was
the bot's. The eel is where the two part most: Igor died in layer 3's
deepest lionfish batch with every weapon, 11 of 12 hits eels, "hardly
predictable trajectory (for a human player)", where the bot's late-kit
Knife loses almost nothing there (`playtests.md` → Three weapons among
lionfish).

**Found building S3, 2026-09-29: the kiting bot backs out of its own range.**
Against a lone slow enemy it holds it inside its 250px range 1% to 18% of the
time, so its shots never land — the mini-boss outlasts it for minutes, and the
immortal layer time trebled, on the S3 build. Backing off
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
boosts)); the first, Barbs, is built. Claude, 2026-10-30, so every weapon has
its own (Every weapon tried and raised):
- **Ricochet**, the Gun's: a shot that kills flies on to the nearest fish.
  The Gun's light shots wasted on nothing, where Barbs lines them up.
- **Parry**, the Knife's: a cut destroys the shots it meets. The Knife's
  weak side, the archer out of reach, answered in its own way.

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
  fan like the boss's (D117 (the boss's fan)), lands where the
  diver will be or covers a spread.
- **A shooter that flees.** Igor, 2026-10-15: "escaping range-shooting
  enemies"; 2026-10-28, taking the archer's back-off away: "leave that
  mechanic for a more advanced enemy". One that runs from the diver and
  shoots as it goes would make the player chase.
- **A fish that pulls you in.** Igor, 2026-10-22: "a guy that opens mouth and
  pulls you in. motivates to escape and resist by swimming away from the
  pull". Every fish now comes to the diver or shoots at it; this one moves the
  diver, so the answer is to swim against it. It brings the diver close, so it
  helps a weapon that fights close: not the fish for D170 (the Knife's lead closes by the fish it meets).
- **Spines that flare and fold.** Claude, 2026-10-30: the lionfish's
  (D171 (the lionfish)) variant, cut while folded.
- **A fish that bursts when it dies.** Claude, same: a beat after its death
  its ring bursts, so killing it close costs unless you leave the ring.
  Unlike the puffer, its own death is the trigger. The bot leaves rings
  almost always, so it may cost the Knife little.
- **A sniper: it aims where you are going.** Claude, 2026-10-28, built on the
  archer by mistake in S9 (the balance rework) and taken back off it: it stops
  for half a second with a thin line locked where the diver will be when the
  shot lands if they keep swimming — always the whole tell — then spits a
  quick shot along it. The answer: turn off the line. Built and checked once,
  as a `spit` with an `aim` field: about a third more threat than the archer
  on the bot, which reads lines at once.
- **A shooter squad that spreads round you.** Claude, same build: each one
  keeps a post on the side of the diver it came in from and follows it, so a
  group surrounds the diver and its shots cross. Weak alone, a threat in a
  squad (`reading.md` → The archer). Could ride on the sniper, or a fish of
  its own.
- **A shelled fish with an opening.** Claude, 2026-10-28, from the boss's
  shell (D156 (the boss's shell and stages)): an ordinary fish whose shell
  takes no hits but after its attack. A small one would teach the boss's
  opening from layer 1.
- **Diverse mini-bosses.** Igor, 2026-10-28: "diverse mini bosses, now at 10
  gates they are almost like normal enemies". One mini-boss type for every
  gate today; each could carry an ability of its own.
- **A fish in stages.** Claude, same: an ordinary tough fish that changes its
  attack as it is hurt — the boss's `stages` on a smaller body.

## Every weapon tried and raised

Igor, 2026-10-30: "for the future game expansion, we need to motivate the
player to try out and upgrade each weapon". The reading is `reading.md` →
Try out and upgrade each weapon, the figures `roadmap.md` → Health, the
weapons. Where it stands:

- **One weapon carries the late game.** At the kit of Igor's winning dive
  the Knife loses a tenth of a heart a layer-3 batch, the Gun and the
  Harpoon two to three; Igor's one late batch, 2 HP against 4 and 4. The
  S6 (balance) bar, no weapon better at everything (D127 (the tuned
  numbers)), is read at the kit a Gun career first meets a layer with,
  and holds there only as an average of a layer each weapon wins. A reward
  for trying a weapon cannot outweigh the one that is best. Most of the
  gap is the eel, whose sway makes shots miss and whose touch lands on the
  Gun and the Harpoon, not the Knife (`roadmap.md` → Health): layer 3
  punishes fighting from afar and nothing in it punishes fighting up
  close. Igor picked closing it so, D170 (the Knife's lead closes by the fish it meets), with the
  lionfish, D171 (the lionfish). In four of layer 3's batches it evens
  the Knife where a Gun career meets layer 3, not at the late kit
  (`roadmap.md` → Health).
  Igor's play of the deepest lionfish batch, 2026-10-31 (`playtests.md` →
  Three weapons among lionfish): the Knife killed twice what the Gun or
  the Harpoon did before all three died, 11 of 12 hits eels. Igor: "insane
  aoe damage in a huge arc, fast repeating swings, enemies die in batches
  easily. especially helpful against the annoying green ones that have
  hardly predictable trajectory (for a human player) … gun & harpoon simply
  suck at these batches". The reach was not it: cut short by D180 (the
  Mask lengthens a shot, not a cut), the Knife killed more of the same
  batch (`playtests.md` → The Knife's own reach), and the Mask widens it
  instead, D181 (the Mask widens the Knife's cut). The lead is aim, which
  the Knife needs none of against a fish a human cannot aim at; the bot
  reads the gap as the eel's too (`roadmap.md` → Health). In a real layer,
  not the lion batch, the Gun went a gate further than the Knife
  (`playtests.md` → The guard, a layer long).
  **Proposed**, Claude's: **the eel's sway slower**, `rate` 0.9 → 0.5 a
  second — its side speed from 280 px/s, twice its swim, to 160, the same
  wave over twice the time, so a shot can lead it. Tried unfitted at the
  lion batch's kit, it nearly halves what the bot's Gun loses a fight, and
  halves its hits by eels (`roadmap.md` → Health). Its threat falls with it, so
  `npm run measure fit` puts more eels in every layer-2 and layer-3 batch
  that holds them, and the balance suite runs on Igor's word (D132
  (full runs on Igor's word)). Igor's late Harpoon: 12 of 14 hits eels',
  touching, the dash ready (`playtests.md` → The Harpoon at the top, firing
  faster).
  **Built and taken back**, 2026-11-01, on Igor's word: at the kit a Gun
  career meets layer 3 with, the slower eel costs the bot more, not less —
  refitted (half again as many eels) or not (`roadmap.md` → Health); its
  threat falls under the puffer's, which D130 (fish are revealed a type at
  a time) forbids, and no two of a tougher body, a wider sway or a harder
  touch lift it back. Refitted, a dive holds more gems than all the gear,
  against D162 (the whole game in fifteen to twenty minutes). What the bot
  cannot say is whether a human reads the slower sway. Igor, 2026-11-01:
  "ok leave it".
  **Home**: left.
- **Not the Knife's tiers**: at the late kit it leads at its first tier
  with no Weights, and without the Mask, above the Gun and the Harpoon at
  their tops
  (`roadmap.md` → Health). Its base shape does it — up to seven fish a
  cut, nothing to miss — and the lead closes by the fish it meets, not by
  the Knife (D170 (the Knife's lead closes by the fish it meets)).
- **Their tiers**: the Gun's three add rate only, so no tier changes
  how many hits a fish takes — a grade-2 drifter takes two at every tier
  without the Weights. The Harpoon kills every fish but the bulwark in one
  hit at nearly every tier, so its tiers past the first change almost
  nothing a player sees. The Knife cuts up to seven at once, with no shot to miss.
- **Nothing pays for trying.** The Harpoon was never bought in two
  careers — Igor, 2026-10-30: "harpoon feels like a redundant weapon
  now"; 2026-11-01, having played it: "hard to use in early game
  (aiming) … still couldnt beat the game at it max stats", answered by
  D182 (the Harpoon a railgun), to play. Not for its Strength: both bought that step before dive 2. And
  the thousand gems left at each win are the winning dive's own: each went
  into it with all but 22 and 128 spent, on the Suit, the Mask and the
  Knife's tiers. The Harpoon loses to buys that make the weapon already
  carried safer; trying it costs its price, then a dive at its first tier
  against a kit grown for another.
- **Proposed**, Claude's: **(1)** the late lead closed — by a fish, as
  picked above — and the bar read at the late kit too; **(2)** a challenge ladder of each
  weapon's own, a feat only its nature allows (Weapon ideas, below), so
  carrying a new weapon pays points and teaches it; **(3)** a top tier that
  adds a way to play, not a number; **(4)** a mod and a boost of each
  weapon's own, so a weapon brings its own drops into the dive. For
  expansion, each new weapon then
  comes with all four: a niche it wins, a ladder, a top tier, its own
  drops. Others weighed: a weapon marked at `home` paying more gems, as
  Hades does — gems are short until the winning dive, whose thousand no
  one spends; a deepest gate shown per weapon on `home` — a record,
  nothing earned; the Harpoon's Strength gate dropped — met before dive 2
  in both careers, so not what keeps it unbought, and the one `requires`
  there is.
**Home**: open, Igor's pick.
A new player (`playtests.md` → A new player's session) bought the Knife
and its first tier, carried the Gun again within a second and never dived
with the Knife; raised the Gun to 3; never bought the Harpoon.

## Weapon ideas — a running list

Open collection, for the weapons to come and the three there are. Each new
weapon asks the player for a different play, not a different number
(`reading.md` → Try out and upgrade each weapon). The weapons that exist are
`entities/weapons.md`; an idea moves there when it is built. All Claude's,
2026-10-30, nothing committed.

**A ladder of each weapon's own** — a challenge only its nature can meet,
paid while it is carried, as `bowling` is the dash's:
- the Gun: kills in a row without a shot missing;
- the Harpoon: fish killed by one harpoon;
- the Knife: fish cut by one swing.

The Harpoon's and the Knife's are judged on a kill, as `bowling` is on a
dash: kills that share one shot. The Gun's needs a miss to be seen, which no
challenge judges yet.

**A top tier that adds a way to play**, as the Knife's `swing` is a field:
- the Gun: a burst of three on the click after a pause;
- the Harpoon: a harpoon that strikes a fish drags it back along the line;
- the Knife: a cut from behind a fish hits twice, Dead Cells' dagger.

**A boost of each weapon's own**, beside Lance, the Gun's:
- the Knife's **Whirl**: the cut goes all the way round;
- the Harpoon's **Tether**: harpoons pull what they hit toward the diver.

**New weapons**, each with a niche it wins and one it loses:
- **the Net**: no damage, a shot that bursts into a net and holds every
  fish inside still for a few seconds — wins against a crowd and runners,
  loses against anything that shoots;
- **the Trident**: three shots in a fan, the boss's own shape in the
  diver's hands — wins against a spread, loses at range;
- **the Charge**: thrown, it sinks and bursts after a delay, the puffer's
  ring in the diver's hands — wins against a crowd that chases, loses
  against quick fish.

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
  comfort mod at all. S5 (content) filled the pool to seven (D93 (the
  content stage's counts)) with none beside it, though comfort is meant to
  carry the pool's width.

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

  **A balance pass owns the tuning**, once the dash is discussed.

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


## Open — raised before S5 (content)

- **Mod caps: removed?** Igor, 2026-10-13: "i dont feel like limiting mods
  is a problem now. we can remove the limit entirely and see how it affects
  balance. or bigger caps, yes. dont really matter at this point". Bigger caps
  are built — `Fins` and `Vitality` at 6 (D127 (the tuned numbers)); the dash's,
  `Reflex` and `Impact`, wait on its discussion. Still open: removing them,
  which would reopen the glossary's "every mod has a cap" in `foundations.md`.

## Open — from playing S5 (content)

Igor, 2026-10-14, after playing the stage's build: "they dont necessarily need
to be addressed within s5, so your job will be to also categorize them and
record properly. we gotta discuss all the details within each comment ofc - not
necessarily within s5 or this session." Each note keeps his words. **Home** is
where Claude proposes it be built: a proposal, unconfirmed until the note is
discussed.

**Screens**

- **`home` shows the character; gear and attributes stop being lists.** "gear
  & attributes submenus are really hard to use. on home screen i want to see
  the character - what's equipped, what weapon is on, attrs, tiers. submenus
  could be dropdown on home screen for example. all with buttons and clear ux,
  currently theres one row per item with an arrow. refer to classics for tier
  up." Reopens D96 (gear and attributes on screens of their own), Claude's
  delegated call, as D114 (weapons and equipment on screens of their own)
  amended it. What `home` shows and how a tier is bought carry over to the
  port; the drawing does not, and the canvas gets no investment (D17 (the
  browser build is a throwaway prototype)), so how much is built here is part
  of the question. **Home**: S7 (alpha polish)'s UX fixing — then Igor,
  2026-10-25, once every row said what it does (D143 (every row at home says
  what it does)): "i still feel the menu is a bit clumsy, but we leave proper
  ux out of alpha. now - just clarity of all player actions". The kit shown
  on `home`, read-only, is built (D147 (home shows the kit)); what is left —
  buying on `home` itself, past lists — is proper UX, past alpha.
- **The catalogue, grown.** Built simple (D146 (the catalogue)): a line of
  words per fish and boost. Igor, 2026-10-26: "ideally the catalogue is the
  place where player can go and check what enemy is, with an image or even
  animation - for later on ideas". Waits until names and meta settle after
  alpha. **Home**: past alpha.

**Abilities, the dash among them**

- **Abilities, a system beside weapons and equipment.** Igor, 2026-10-31,
  asked what "the dash is held" was about: "probably about starting without
  it. which brings me the idea of abilities - a separate system along with
  weapons and equipment. need to think what abilities except dash there
  could possibly be". For discussion; the two dash notes below go into it.
  Open: what abilities there are besides the dash; how one is had (bought,
  opened by a step, found); how many are carried at once, and on which key;
  and whether the dash becomes the first of them. Claude's candidates, each
  a verb no weapon or piece of equipment has: **a pulse** — a ring that
  shoves every fish near the diver away, the crowd answer; **an ink
  cloud** — fish inside lose the diver for a few seconds; **a lure** — a
  bubble the fish chase instead of the diver; **a hook** — a line that pulls
  a fish in, or the diver to a wall. Each would have to differ in kind
  from the dash and the suit's guard (`foundations.md` → Diversity), and a
  new kind needs its glossary word and `entities/` doc at once (D124).
- **The shove, earned.** Igor, 2026-10-19, during knockback (D122
  (knockback)): "dash knockback - good idea, but should be earned. default
  without it is ok. goes for mechanics and attrs design". Today every dash
  shoves what it passes, bought or not — D51 (the dash is bought, and the
  offer waits for the death) made it free, Claude's call, never asked. Open:
  what earns it — an attribute, a mod, gear — and how strong. Kin: the next
  note's lock on the dash itself, and the dash economy under Recorded future
  opportunities. **Home**: the mechanics and attributes design, Igor's
  words; untouched until then. Igor, 2026-10-21, opening S6 (balance): "leave
  dash for now, discussions needed".
- **Locked at the start?** Igor, 2026-10-15, with the dash cut by a third (D111
  (the dash a third shorter)): "maybe dash shouldnt be available at the start?"
  A lean. What it would touch: the dash is the second verb since D20 (mouse aim
  and an offensive dash); until it opens, the Dash reach and Strength
  attributes and the `Reflex` and `Impact` mods would buy nothing, so a draw
  would have to hold them back; and `bowling` would have no dash to count.
  Open: whether, and what opens it — gear, a step, a layer, a
  challenge's rung. **Home**: open — Igor, 2026-10-21: "leave dash for now,
  discussions needed".

**Health**

- **Bars, hearts, and hits worth more than one.** Igor, 2026-10-15: "should
  enemies have hp bars? shouls the player? damage exceeding 1?" Hits vary in
  damage, the unit unchanged, is D118 (hits vary in damage); the amounts are
  D127 (the tuned numbers)'s — the attacks with a long tell above the swarm's bites.
  Still open:
  - **The diver's readout.** Igor, 2026-10-19: "half hearts is confusing.
    either enough hearts or a bar", leaning to "proper hp system"; then, on a
    bar: "honestly i dont know. i think upper status bar would suffice, with a
    player itself changing appearance (for graphics later)". A lean: the
    status bar's `HP` stays the readout, and the diver's look showing its hurt
    waits for the graphics (below).

**The stage's content**

- **The eel is hard to hit** — "a problem of schematic circles, not necessarily
  a bad design." Its behaviour stands; it goes with the graphics, below.
- **The puffer still feels clumsy.** Igor, 2026-10-15, playing the build with
  D106 (the puffer bursts and comes on again): "exploding guy still feels
  clumsy. maybe acceleration or making it faster would help." A lean, given
  "for balance". What there is to turn: its `speed` (`entities/enemies.md`),
  and a ramp, which D107 (the diver swims and faces; fish with a ramp) gave
  the plain chasers but not the puffer — it chases at full speed from its
  first tick and stops dead to swell. A D107 ramp would make it smoother but
  slower off the mark, not quicker, and changes its step rather than adding a
  line to `game/content.js`. Faster is built — D127 (the tuned numbers). Open:
  whether it still wants acceleration, and which — that ramp, or a puffer that
  gathers pace as it chases. **Home**: open, to Igor's play.
- **More kinds of boost.** Igor, 2026-10-20: "more complex idea: there are
  diver boosts, attr boosts, individual weapon boosts, and totally new boosts -
  like an explosion killing nearby, or launches shots in all directions, or
  poisons etc - ideas only, incorporate when appropriate. i'd call them
  environmental. again, i'll repeat my generic saying, no limits there,
  diversity is the main rule of the game." A weapon's own is built — Lance, the
  Gun's (D125 (boosts keep each weapon's nature)). Still open:
  - **diver** and **attribute** — Claude's reading, unconfirmed: one kind, both
    the diver's own numbers — swim speed (Rush's), the dash, an attribute's
    step for a while (`entities/challenges.md`);
  - **environmental**, his word — an effect of its own, not a number: an
    explosion killing what is near, shots in every direction, poison. Code
    rather than numbers, so the first one reopens D86 (boosts)'s "numbers, not
    a function"; Claude's proposal, unconfirmed: a field whose presence
    switches on one branch, as an enemy's behaviour is.
  **Home**: ideas, "incorporate when appropriate"; the kinds as content comes.

**Feel**

- **A bounce on a hit.** Igor, 2026-10-19: "we need to add a small bounce off
  (for fish and for player both maybe?) for a hit to feel more naturally. like
  visual representation of impact along with player blinking". Then: "drawn
  bump stays for s7, real knockback - design and implement now". Real
  knockback is built, both ways (D122 (knockback)), and the drawn bump on a
  fish over the top of it (D140 (the drawn bump)). Still
  open: **the diver's knock** — his "maybe", built so he can play it, his to
  keep or drop. Kin: "Shake when enemies take damage", under Suggested,
  below.
- **The gems' flight to the diver.** Igor, 2026-10-25, as the `+N` came to
  fly to the counter (D142 (the +N)): "maybe the animation from enemy to
  player should go away". A minor open question, his word: the pull stays,
  D78 (gems are pulled to the player), until he says.

**Crowds**

- **Fish pile up.** Igor, 2026-10-19, after playing solid bodies (D120
  (bodies are solid)): "many fish awkwardly pile up because of new physics -
  honestly dont know how to deal. maybe leave for now. they should try to
  surround". Every fish steers for the diver's own centre, so now that bodies
  keep apart, the ones behind queue behind the front ones in a clump or a
  chain. Part of the look was the shrinking — a hurt fish drawn smaller than
  the body holding the others off — gone with D121 (only a hit blinks; a hurt
  fish carries a bar). A lean, not a decision: they should surround. The usual
  way is for each chaser to steer for its own spot on a ring round the diver,
  spread by angle, rather than for the diver itself, so a crowd closes as a
  circle instead of a queue. Igor, 2026-10-22, for todo and discussion: "to
  resolve enemies stacking problem they need to be smart enough to swim
  around each other" — local avoidance: a fish that finds another in its way
  steers past it rather than pushing into it. It and the ring are not the same
  fix — one routes a fish round a body, the other gives each fish its own
  place to go — and could be used alone or together. **Home**: to do, after a
  discussion.
- **A charging boss shoves the crowd.** Igor, 2026-10-20: "bosses dash pushes
  away other enemies (related to other solid-body problems)". From its wind-up
  to the end of its rest a lunger is pushed by nothing, so it keeps its lane
  (D120 (bodies are solid)) — and every fish it meets takes the whole push
  instead, its own escorts included. Even chasing, the boss outweighs a drifter
  by area twenty-two times. Open: what a charge does to the fish in its way.
  **Home**: open, with the pile-up above — Igor ties them together.

**Graphics**

- **Shapes hard to follow.** "start thinking towards graphics. not saying we
  must go to assets now, but: 1 schematically circles and squares are ok, but
  hard to follow". Not the condition D4 (no assets, ever) waits on: "not saying
  we must go to assets now". The sizes, his second point, were settled before
  S6 (balance) by D104 (bodies doubled). The diver's look showing how hurt it
  is joins this — Igor, 2026-10-19, under Bars, hearts, and hits worth more
  than one. Open: what makes the shapes easier to
  follow, and when.
- **References for each fish and entity.** "image or even gif references for
  enemy types and other entities? too early?" Claude: not too early to collect,
  since they feed the sizes and shapes above; kept as links in the docs, not
  image files (D4 (no assets, ever)). Open: whether to start now.

**Pace**

- **Waves: does it overwhelm?** Built as D115 (batches arrive in waves), on
  Claude's shape and numbers — 5–10 fish a wave, 4s ± 40% apart, 2s of
  trickle, an empty arena calling the next. Igor's aim was "a sense of nervous
  rush and inevitability ... not scare him away - motivate instead", with
  Crimsonland as the reference for being overwhelmed. With the batch sizes
  before S6 (balance) the waves put fewer fish on screen at once than a whole
  batch did, and the kiting bot lasted longer for it; the batches of S6 (balance) are bigger
  (D127 (the tuned numbers)). Open, to Igor's play:
  whether it rushes; if not, the levers are the clock and the batch sizes.
  A wave now sounds as it arrives (D144 (every moment of a dive has a
  sound)). Also open: whether that and the status bar's `(12 coming)` are
  telegraph enough, or a wave wants a mark at the edge it enters by; and where waves enter
  — still a random edge, the kin idea being fish from behind the screen,
  above, arriving near the diver with the fade-in as their telegraph.

- **A mark where a fish is about to come in.** Igor, 2026-10-26: "shortly
  before enemy emerges to screen, add a small color indicator at that place
  (optionally flashing). goal: show the player what's coming from where, time
  to avoid if he is close to the screen edge". An idea, not yet built or
  scheduled. It answers the mark at the edge from the note above; how long
  before, what colour (each fish's own, so it says *what* as well as
  *where*), and whether it flashes are open.

- **Escorts: do they feel right?** Built as D116 (bosses bring escorts), Igor
  handing the shape over ("on boss question go your way"): the boss's crowd
  refills to `BOSS_CROWD` while it lives, each newcomer within 2s of the gap, paying no
  gems, dying with the boss; a mini-boss leads in a whole batch from the pool
  before it. Open, to Igor's play: the crowd's size and pace, whether a whole
  batch is too much beside a mini-boss, and whether the crowd should pay
  something after all. "According to the balance for current batch" — built
  as Claude's reading, unconfirmed (D126 (threat)): the crowd refills from its
  graded escorts, so it is the batch, sized as every batch is; its size is 4
  since D129 (a gentle first layer).

## Open — from S6 (balance)

- **One boss for three layers.** The kit a career meets the boss with grows
  about three times over the dive; the boss grows half again, by its grade.
  Shelled and in stages (D156 (the boss's shell and stages)), layer 3's boss
  costs the bot no hearts and is sometimes cleared standing. Open: a boss of
  its own per layer, or deeper stages by layer. Claude's. **Home**: S9.
- **A boost touched extends every boost running.** Igor, 2026-10-23:
  "multiple boost pick can extend the overall effect time", confirmed as this
  reading over a boost adding only to its own clock: Rush running with 2s
  left, Frenzy touched — Frenzy runs its 5s, and Rush gains 5s too. It
  reopens D86 (boosts)'s "touched again while it runs, its clock restarts and
  nothing stacks". Open: what a second touch of the same boost does, and
  whether a clock has a ceiling — Claude's questions, not raised yet.
  **Home**: open, an idea to record.

## Open — from playing alpha

Igor, 2026-10-26, on S7 (alpha polish)'s build: "we can call it alpha
alright, but:" — the first two below. And: "alpha enemies are pretty well
balanced for alpha".

- **Bloom's splash without a hit.** Igor, 2026-10-26: "i feel like shot
  splash should happen even if you dont hit directly". Today a shot splashes
  only where it strikes a fish (D125 (boosts keep each weapon's nature)); a
  miss splashes nothing. Open: where a missed shot splashes — where it ends
  its range, or as it passes a fish within `splash` — and whether a cut's
  splash follows. **Home**: open.

- **The economy and the fights, reworked in S9 (the balance rework) — to
  play.** Igor's 2026-10-27 report ("dives are long and useless and grindy
  … upgrades feel useless, points are near to impossible … bosses are too
  easy … archer") is built as D155 (six gates a layer) to D162 (the whole
  game in fifteen to twenty minutes); the plays since are `playtests.md`,
  the first career among them. Igor: "the whole game should be finishable
  in 10-15 min and all upgrades need to be purchased … points are still
  earned god knows how, so think about mechanics". Open:
  - "still feel that threat grows fast. but maybe false feeling" — flatter
    since D162 (the whole game in fifteen to twenty minutes); to replay.
  - The boss's stage cue: "sound and burst didnt make a difference" — a
    stronger tell, or drop it. And "can hit unshielded max 3 times".
    `boss-cue` (`playtests.md`): "no changes noticed in the boss".
  - "boss burst hitting screen edge, think thru".
  - **What makes a late dive hard**, and the boss's lunge's place among the
    threats. Both careers won on a Suit carrying a careless play, and the
    Suit pair showed the kit, the Knife most, makes the last dive easy
    (`playtests.md`). Igor, 2026-10-30: "boss is hardly a challenge, just
    time-consuming sometimes. escort enemies help to keep it dynamic
    though". The guard lasting two gates, D168 (the guard lasts two
    gates), did not change it: `suit-pairs`, layer 3 whole, every hit
    guarded, no heart lost (`playtests.md` → The guard, two gates long);
    the guard lasts a layer now, D179 (the guard lasts a layer), to play.
    The lunge misses on its own: over every play 2 of 165 landed,
    and a diver who only kept swimming would have taken 30 (`playtests.md`
    → The roadmap, the lunge over every play). Proposed, Claude's: **aim
    ahead** — the line still fixed as the wind-up starts (D64 (the boss
    lunges)), but drawn to where the diver will be if it keeps its way, so
    only a change of course leaves it; or **follow, then fix** — the line
    follows the diver through the swell and fixes a beat before the charge.
  - **The unbought gear.** Each career went into its winning dive with all
    but a few gems spent and over half the gear, by price, unbought; the
    gems left at a win are the winning dive's own (`playtests.md` → Igor's
    first career, A whole career, after the puffer).
  - "would i be able to complete the game as fast if i chose different
    upgrades? i dont know" — the career bot wins on dive 2 or 3 with any
    weapon, the Harpoon a minute slower in layer 3; it cannot say what a
    build without the Suit costs a human.
  **Home**: S9.

- **A new player's first session.** `2026-10-31-new-player`
  (`playtests.md` → A new player's session): eleven dives in 28 minutes,
  none past layer 1; the second newcomer, 13 dives in 24 minutes of diving,
  to layer 3, no win (The next newcomer, with the dot). Three things stood
  in the first's way: the death screen said
  nothing of home — now it does, D172 (the end screen marks what home can
  buy) — and these two:
  - **The opening's darter.** 17 of 32 hits, and the first dive's death at
    gate 1 in 10s, standing where it began: moving came only on the second
    dive. The bot reads its 0.15s wind-up, a newcomer does not.
    Proposals: the dive opens on drifters alone, the darter later — which
    needs a stretch of its own, one new type a stretch (D130 (fish are
    revealed a type at a time)); or its bite slower to read at grade 1.
    Either pulls against Nothing trivial's stood bars (`bugs.md`): the bot
    stands through the layer that walled this player. Igor, 2026-10-31:
    "not needed now". The second newcomer's layer-1 hits were archers' most,
    14 of 32, the darter's 7.
  - **The top row is what is bought.** Both newcomers' first buys on each
    screen were its top row, tier after tier within a second — Mask, Dash
    reach, the Gun — where the cursor starts. So Heart, second among the
    attributes, came late or never, and the points went to a dash barely
    pressed; the Suit, second in equipment, came before dive 12.
    Proposed, Claude's: each screen's rows in the order a newcomer needs
    them — Heart above Dash reach, the Suit above the Mask. **Home**: open,
    Igor's pick.
  - **The dot is passed at first.** The second newcomer dived again at the
    first four deaths with the dot showing, then went home at every one;
    the first, at five of the first seven. Proposed, Claude's: while
    nothing has been bought in a career, the death screen's cursor starts
    on Go home when the dot shows. **Home**: open, Igor's pick.
- **Studioigor's skills.** Igor, 2026-10-28: "check this repo and other
  repos from this guy: https://github.com/studioigor/studioigor-skill … we
  may adapt his skills & knowledge to our development, if they match our
  goal". Open: read them, and adapt what fits the rules here. **Home**: open.

- **Agent housekeeping.** Igor, 2026-10-28: "rename to agents.md required or
  not? is our agent built well? subagents, skills, context optimized?".
  Claude's findings: no rename needed for Claude Code; the global
  `~/.claude/rules/` (Python-backend rules) and the global `CLAUDE.md`
  load into every session here and only collide — about 21 KB, measured
  2026-10-31 in the first `abyss-tidy` pass, against 35 KB for
  `foundations.md` and `working.md` together; a balance pass re-measures by hand what one
  `npm run measure bars` could print. **Home**: open, Igor's pick.

## Suggested but not yet discussed

- **A rank only play can earn.** Claude, 2026-10-01, in the mods rework, when
  Igor asked whether rank "could be something more": a meter that climbs with
  clean, fast clears, drops when you are hit, and raises the odds or the worth
  of what fish and kills drop — as Isaac's devil rooms reward a floor without
  damage. Not taken with D87 (rank is retired): it is a system of its own, and
  it snowballs — good players get stronger still. If it comes, it is the place
  the "easy layers stay relevant" pillar's fast clears could pay into.

---

## Declined

### The boss's bar across the top
Claude's lean: the boss's and the mini-boss's bar across the top of the view,
where 100 hp of progress reads, instead of the small bar over the body every
hurt fish carries (D121 (only a hit blinks; a hurt fish carries a bar)). Igor,
2026-10-26: "health bar stays".

### Points from opt-in difficulty
Claude's, from `reading.md` → Points: hazards taken at `home` before a dive —
the fish a grade up, the guard off, the wind-ups shorter — each adding a
share to the points the dive pays, as Bastion's idols do. Igor, 2026-10-31:
"drop".

### Hitstop on death
Claude's, 2026-09-12, after Igor's "more epic shake on losing": a few frames
of freeze on the killing hit before the death shake. Igor, 2026-10-31:
"dont know what for, drop".

### Shake when a fish is hurt
Claude's, 2026-09-12, when Igor asked for "slight shake on damage received"
— he meant the diver's. Igor, 2026-10-31: "wont do now, can drop".

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
