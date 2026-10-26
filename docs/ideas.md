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
  fan like the boss's (D117 (the boss's fan)), lands where the
  diver will be or covers a spread.
- **A shooter that flees.** Igor, 2026-10-15: "escaping range-shooting
  enemies". The archer already backs off inside its band (D95); one that runs
  from the diver and shoots as it goes would make the player chase.
- **A fish that pulls you in.** Igor, 2026-10-22: "a guy that opens mouth and
  pulls you in. motivates to escape and resist by swimming away from the
  pull". Every fish now comes to the diver or shoots at it; this one moves the
  diver, so the answer is to swim against it.

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

**Tooling**

- **Unity's tooling, assessed** — Port to a native executable, above.

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

**The dash**

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
  would have to hold them back; and `footwork` would pay for not dashing with
  no dash to use. Open: whether, and what opens it — gear, a step, a layer, a
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

- **`footwork`, reworked or dropped.** Igor, 2026-10-24: "footwork is
  generally questionable thing, as it forces the player to withdraw an
  essential ability. i'd rework it or drop completely." It pays for batches
  cleared without dashing; D127 (the tuned numbers)'s bar on it left with S6
  (balance)'s close (D139 (S6 closes)). Open: what it becomes, or whether it
  goes. Igor, 2026-10-26, playing alpha: "footwork still makes no sense".
  **Home**: S8 (the economy: gems and points).
- **Challenge rungs on the shorter dive.** The ladders were sized on fifteen
  gates a layer (D109 (micro-tasks are ladders; steps cost more as they
  rise)); ten since D137 (batches grow from seconds to a minute and a half),
  so a dive has 30 gates and 21 glowing batches, and every streak's rung is
  harder to meet than its rate says — `footwork`'s top, fifteen batches, a
  layer and a half. Open:
  re-size them to the new shape, or keep them. **Home**: S8 (the economy:
  gems and points); the rungs are Claude's picks either way.
- **Gates a layer, layer by layer.** Igor, 2026-10-24, setting ten for every
  layer (D137 (batches grow from seconds to a minute and a half)): "may change
  to different value for layers later". **Home**: a later balance pass.
- **One boss for three layers.** The kit a career meets the boss with grows
  about three times over the dive; the boss grows half again, by its grade. At
  `hp` 100 (D137 (batches grow from seconds to a minute and a half)) the bot
  takes about 63s on layer 1's boss and loses it on up to half the seeds,
  about 110s on layer 2's and 49s on layer 3's; at 55 it was cleared standing
  still in layer 3. Open: whether each layer's boss should grow in a way of
  its own. Claude's, not raised yet. **Home**: open.
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

- **Gems and points, out of balance — a major issue.** "point upgrades come
  easy, at first run i earned 12 points, reached mid layer 2. i couldnt get
  enough gems for any purchase, except a gun upgrade. gotta do something with
  upgrade system. really major issue. maybe even rework the whole gem&points
  system, very imbalanced." Points come from challenge rungs
  (D109 (micro-tasks are ladders; steps cost more as they rise)), gems from
  kills (D78 (gems are pulled to the player)); the prices were halved once
  (D136 (prices halved)).
  On a first dive the points outrun what they buy and the gems fall short of
  every price but the Gun's first tier (240). Open: retune, or rework the
  upgrade system, gems and points together. **Home**: S8 (the economy: gems
  and points).

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

### The boss's bar across the top
Claude's lean: the boss's and the mini-boss's bar across the top of the view,
where 100 hp of progress reads, instead of the small bar over the body every
hurt fish carries (D121 (only a hit blinks; a hurt fish carries a bar)). Igor,
2026-10-26: "health bar stays".

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
