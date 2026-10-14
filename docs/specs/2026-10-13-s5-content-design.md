# S5 (content) — design

2026-10-13. S5 (content): the alpha's content to the DoD numbers. Igor,
opening it: "start S5, dont interrupt unless there are major contradictions
with the plan". So every call below that is not quoted from Igor or a decision
is **Claude's call, delegated** — made to keep going, recorded for Igor to
reopen, never presented as his. Every number is Claude's pick, S6 (balance)'s
to tune. Once built this spec is history; where it and a decision disagree,
the decision wins.

## Taken as settled

- **The counts** — `plan.md` → S5, D93 (the content stage's counts): 5–7 enemy
  behaviours, 2–3 weapons, 2–3 pieces of equipment, 3–5 layers each with its
  own pools of batches (D71 (batches are drawn from pools)), 3–4 tiers for
  every weapon and piece of equipment, 5–7 mods in total, 3–5 new boosts beside
  `Rush`, three micro-tasks and three attributes in total.
- **The second weapon brings owning one and choosing which to carry at
  `home`**, and a scenario that names the weapon carried (D83 (the weapon
  record)): a `cost` to own one, the carried weapon's name in the save.
- **Melee is first tried as data**: a very short, wide, piercing shot; a
  behaviour of its own only if that does not read as melee — Igor's call
  (D83 (the weapon record)).
- **Weapon mods are ordinary mods** with `scope: 'weapon'` and `weapons`, the
  ones they fit (D83 (the weapon record)).
- **Gear may require an attribute threshold** — "heavy gun needs strength 5";
  scheduling, not scaling (D36 (attributes)). Gear is combat — weapons, damage,
  defence; attributes are body — health, speed, dash, i-frames (D36
  (attributes)); permanent dash improvements are attributes (D74 (dash
  improvements are attributes)).
- **Micro-tasks reward mastery, not quotas** — D36 (attributes)'s examples:
  "clear a batch without taking damage", "reach the bottom under N seconds",
  "beat the mini-boss without dashing".
- **A behaviour is a field whose presence switches it on, plus one branch in
  the enemy loop** — never a class (D26 (disciplines installed)). The parked
  idea's worked example: a ranged fish that stops at range and fires a slow
  projectile, its shots in `bullets[]` with an `evil` flag — not a second
  array (`ideas.md` → Enemy behaviours).
- **The draft's list of behaviours** (`high level design.md` → enemies and
  enemy ai): "simply following and biting, moving in a peculiar way, spitting
  out dangerous toxins, electrifying, dealing damage over time, shooting an
  arc, exploding after a short time, avoiding the player and shooting from a
  distance".
- `threat` stays unwritten: S6 (balance) adds it to every type at once (D79
  (a dive goes from easiest to hardest)). Batches are sized by total hp until
  then. Mod caps are S6 (balance)'s (D93 (the content stage's counts)).

## The design

### 1. Three enemy behaviours: spit, fuse, weave

Five behaviours in all — chase, lunge and these three — on six ordinary types
and the two lungers.

- **The archer** (`spit`) — the archerfish spits at prey. It closes to its
  `range`, backs off inside `near`, holds between, and spits a slow shot at
  where you are every `every` seconds while within range and wholly in the
  view — so a shot always comes from a fish you can see. Its range is under
  the Gun's, so the starting weapon can always answer it. *Why:* every
  ordinary type today only chases, so the arena asks one question — how far
  away are they. The archer punishes standing still and kiting in a line.
- **The puffer** (`fuse`) — swims at you; within `trigger` of you, wholly in
  the view, it stops and swells for `time` seconds — the tell, its `blast`
  ring drawn growing — then bursts, costing a heart if you are inside the
  ring. Shot during the fuse, it dies like any fish. The dash's shove still
  moves it: shoving a swelling puffer away is the counterplay. A burst is not
  a kill: no gems, no boost, no count toward the next — and a glowing puffer
  that bursts takes the batch's mod with it. *Why:* the draft's "exploding
  after a short time", and a reason to kill one thing first.
- **The eel** (`weave`) — closes in swaying side to side across its heading,
  `width` px either side at `rate` sways a second, so a shot aimed where it is
  misses where it will be. A batch of eels sways in step, as a school. *Why:*
  the draft's "moving in a peculiar way"; it asks you to lead your shots.

**Enemy shots** are `bullets[]` entries with `evil: true`. They fly and die at
their travel like any shot, sweep their segment against the diver (D53 (fixed
timestep, and bullets sweep too)), never touch fish, and are untouched by the
diver's shots. The dash's invulnerability passes through them, as it passes
through fish.

**One way to be hurt.** Contact, a shot and a burst all go through one
function, `hurtPlayer()`: the dev flag, the i-frames, the suit's guard (§3),
the micro-task's `batchHit`, the shake, death. Three callers, so one place.

**What a behaviour costs.** A field on the type, its step function, one
`else if` in the enemy loop, its checks, its doc table and a scenario.
`makeEnemy()` copies every behaviour field a type has, and the docs check
builds one table per behaviour field, so neither grows per behaviour. The
DoD's comparison — the second addition against the last — reads the puffer
against the eel; the archer carries the one-off cost of enemy shots.

| type | r | hp | speed | value | colour, glow |
|---|---|---|---|---|---|
| archer | 8 | 2 | 75 | 2 | `#5aa9ff`, `#1f6fff` — blue |
| puffer | 11 | 3 | 95 | 2 | `#ffee58`, `#ffc800` — yellow |
| eel | 7 | 2 | 130 | 2 | `#38f2c0`, `#00c896` — teal |

`spit`: range 240, near 170, every 2, speed 210, r 6, travel 420. `fuse`:
trigger 90, time 1.2, blast 110. `weave`: width 50, rate 0.9.

### 2. Weapons: the Harpoon and the Knife; owning and carrying

| weapon | fireRate | damage | range | shotSpeed | shotRadius | pierce | cost | requires |
|---|---|---|---|---|---|---|---|---|
| Gun | 2.5 | 1 | 250 | 430 | 4 | 0 | 0 | — |
| Harpoon | 0.8 | 3 | 420 | 950 | 3 | 2 | 150 | Strength 1 |
| Knife | 3 | 2 | 46 | 520 | 18 | 6 | 100 | — |

- **The Harpoon** — the draft's "extra fast railgun-like type": slow, long,
  heavy, through what it hits. Tiers: damage +1 (80), fireRate +0.2 (160),
  pierce +1 (300). It requires Strength 1 — D36 (attributes)'s own example.
- **The Knife** — melee as data (D83 (the weapon record)): a very short, wide,
  piercing slash. Tiers: range +12 (60), damage +1 (140), fireRate +0.75
  (260). Whether it reads as melee is Igor's call.
- **Owning and carrying.** `meta.owned` (names) and `meta.carried` (a name).
  The Gun costs 0 and is owned from the start. A weapon's row at `home`: not
  owned — buy it for its `cost`, when its requirement is met, and it is then
  carried; owned — carry it; carried — buy its next tier. One sentence: choose
  a weapon to carry it, choose the one you carry to raise its tier. A dive
  copies the carried weapon (D83 (the weapon record)); the dive remembers its
  name, `weaponName`, for the weapon mods (§5).
- **A scenario names a weapon** with `weapon:` — `harpoon` and `knife` start a
  dive from the top carrying it, so S6 (balance) can measure each.

### 3. Equipment: the Mask, the Suit, the Weights

Three pieces, three tiers each, combat stats only (D36 (attributes)).

- **Mask** — range +30 a tier (50, 120, 240): you see, and shoot, further.
- **Suit** — `guard` +1 a tier (90, 200, 380): the suit takes the first hit of
  every batch, two at tier 2, three at the top. Defence, which D36
  (attributes) gives gear. `guard` is a new field of the diver, 0 at the start;
  `guardLeft` refills to it as each batch arrives. A guarded hit costs no
  heart, still grants the i-frames and still counts as a hit for `untouched`.
  A ring around the diver shows a guard left.
- **Weights** — damage +0.5 a tier (70, 150, 280): your shots hit harder.

### 4. Attributes and micro-tasks; `requires`

- **Attributes**: `Dash reach` (dashSpeed +150, kept), **Heart** (one more
  heart: maxHp +1, hp +1), **Strength** (the dash hurts what it shoves:
  dashDamage +1).
- **Micro-tasks**, each paying one point once per layer, ever: `untouched`
  (kept), **swift** — clear a batch within `SWIFT_TIME` 10 seconds of its
  arrival — and **footwork** — beat a mini-boss without dashing, D36
  (attributes)'s own example. `met()` receives the cleared plan entry;
  footwork knows a mini-boss's batch by its enemies, so a restored dive's copy
  of the plan still matches. The dive gains `batchTime` and `batchDashed`,
  reset as a batch arrives.
- **`requires`** on any gear: `{ attribute: points }`, met by the points spent
  on it. Unmet, the row says what it needs and is dim, and nothing is bought.

### 5. Mods and boosts

- **Barbs** — the one weapon mod, the seventh mod: `scope: 'weapon'`,
  `weapons: ['Harpoon']`, "the harpoon goes through one more", pierce +1, max
  3. A weapon mod is drawn — by a fish or a layer end's card — only while one
  of its weapons is carried.
- **Boosts**: **Frenzy** — you fire much faster, for a moment: fireRate +3 for
  5s; **Lance** — your shots go through, for a moment: pierce +4 for 5s;
  **Bloom** — your shots swell, for a moment: shotRadius +6 for 6s. The
  readout gains `shotRadius`, since every stat a mod or boost moves is shown.

### 6. Layers: three, each with pools of its own

Each keeps today's shape — a stretch, a mini-boss, a stretch, a mini-boss, a
stretch, the boss — with pools of its own: the first layer's last stretch
meets the archer, the second adds the puffer, the third the eel and every type
mixed. Sized by total hp, growing down the dive, until S6 (balance)'s threat.
Layer 3's water is a deep teal, `[8, 32, 28]`. A `layer-3` scenario starts
its top with the kit a dive would carry there.

### 7. `home`: Gear and Attributes screens

`home` holds Dive, Gear, Attributes, Help, Options. Gear lists the weapons and
the equipment with their gems; Attributes lists the attributes with the points
to spend; each has a Back row and Esc. Three weapons, three pieces and three
attributes on one screen would run through the hint. Each is a `MENUS` entry,
so the screens are data (D38 (`home` is canvas, with layout as data)); the
browser check that rows end above the hint covers every menu, not `home`
alone.

### 8. The save goes to version 4

`meta` gains `owned` and `carried`; the dive gains `weaponName`, `batchTime`,
`batchDashed`, `guardLeft`, and its diver `guard`. A v3 save owns and carries
the Gun; a v3 dive carries the Gun with a full clock and no guard.
`tests/fixtures/save-v4.json` joins the others.

### 9. Smaller pieces

- **Scenarios**: `one-archer`, `one-puffer`, `one-eel`; `all-types` — every
  ordinary type in a row, derived from `ENEMY_TYPES` — replaces `three-types`;
  `harpoon`, `knife`, `layer-3`.
- **Sounds**: `spit` and `pop`, the same oscillator synthesis.
- **Help**: one line — "Some fish spit from afar; a puffer that swells is about
  to burst."

## Checked against foundations.md

**Glossary.** New names are the enemies' (archer, puffer, eel), the
behaviours' fields (spit, fuse, weave), the screens' (Gear, Attributes — the
glossary's own words) and a stat (`guard`); none collides with a term. No
"level", no "upgrade".

**Genre contract.**
- (2) Manual aim and fire: the Knife is fired like any weapon.
- (3) Hard-gated batches: enemy shots and bursts change nothing about the
  gate; a batch is clear when its fish are gone.
- (4) Three tiers, summing: the weapons and the equipment raise combat numbers
  (range, damage, the suit's guard), the attributes body ones (hearts, the
  dash); everything adds. The Harpoon's requirement is scheduling.
- (5) Nothing interrupts combat; Barbs differs in kind (pierce).
- (6) Combat stays the only dynamic system: guard, spit and burst are combat.
- (7) Content is data: every piece is a record; a behaviour is a field and a
  branch, which is the shape D26 (disciplines installed) set.

**Pillars.** "Nothing trivial — no batch cleared without moving": the archer
and the puffer make standing still cost. "No mechanic needs explaining in more
than one sentence": each piece above has its sentence. The numeric pillars
are S6 (balance)'s.

**Technical contract.** The seam keeps its seven names — new sounds go through
`sound()`. Enemy shots sweep their segment. The puffer, the archer and the eel
draw nothing from the seed. The save is version 4, migrated. Layout stays data.

**Non-goals.** No art, no elemental weaknesses (an archer's shot is a heart,
like a bite), no second money, nothing multiplies.

### Friction points

1. **The bot cannot play the Knife.** It backs away from the nearest fish, so
   a weapon with a 46px reach never lands. Owner: S6 (balance), which measures
   per weapon (`plan.md` → S6) and needs a bot that closes in.
2. **The archer's range sits under the Gun's** (240 against 250), so the
   kiting bot — and a new player — can always answer one. Claude's call.
3. **The Harpoon needs a point spent on Strength**, so a fresh save cannot own
   it until a micro-task pays. Scheduling, as D36 (attributes) intends.
4. **A glowing puffer that bursts loses the batch's mod.** Kill the glowing
   fish for a mod; a burst is not a kill. Claude's call.
5. **Eight enemy colours on black.** Whether they stay distinguishable is
   Igor's call — the condition that moves art to S7 (alpha polish).
6. **The first layer changes**: its last stretch meets the archer, so the bot
   figures in `roadmap.md` → Health move and are re-measured.
7. **The existing `untouched` test clears a batch at once**, which `swift`
   now also pays: the test counts what was met, not 1.

## What this build supersedes and makes stale

- **Decisions**: D83 (the weapon record)'s "today the first line is carried";
  the S5 halves of D36 (attributes) and D31 (two-tier progression) — which
  attributes and micro-tasks exist, and the first weapon mod — become built.
- **`foundations.md`** → What is deliberately still open: "which attributes
  exist and what each micro-task is" is settled.
- **`ideas.md`**: Enemy behaviours, not just enemy stats (built); which
  attributes exist and what each micro-task is (settled); guard the other
  screens against overflow (built, as the every-menu check); the weapon line of
  Mod ideas.
- **`design.md`**: the enemy loop, the shots, `home`, the save, the balance
  constants, the starting numbers (`guard`), the readout.
- **The entity docs**: every table, and the reserved `cost`, `requires` and
  `weapons` become real.

## Build

The plan and its progress log were build scaffolding, kept outside the repo
(D94 (superpowers dropped)). Nothing is committed before
Igor's `/simplify`; each addition's state is snapshotted as a git tree so its
cost can be read, and so the work can become one commit per addition if Igor
wants it.
