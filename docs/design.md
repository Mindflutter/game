# Design — how Abyss works today

The **present**: how the systems fit together, and what the code cannot say
for itself — why it is shaped so, and the traps it has met. It is not a
retelling of the code, which is short and the source of truth (D134 (lean
docs)). Each enemy, mod, boost, weapon and piece of equipment, its numbers and
behaviour, is its doc in `entities/`.

## What it is

A twin-stick action game, diving down through **layers** — three at present.
You move with WASD, aim with the mouse and **fire by holding the left button**
(D45). The dive stops at each gate depth while a **batch** is alive — no
further in enemies, though the water keeps flowing. One fish of each ordinary
batch glows and carries its **mod**, which flies to you when it dies (D84,
D88). A mini-boss leads in a batch as escorts; the boss's escorts are a crowd
that keeps coming until it dies (D116). Kills drop gems, which fly to you (D35),
and **boosts**, short powers you touch before they fade (D86). A current
carries you down to the next batch (D58). A layer's boss is its **layer end**:
a full heal, a haul of gems and a pick of valuable mods — the dive's one pause
(D68, D85). A dive ends in death or in the win at the bottom of the last
layer; then `home`, where gems buy gear and the points challenges pay raise
attributes, and the kit beside the rows shows what the next dive starts with
(D147 (home shows the kit)).

## Files

```
index.html              shell: canvas, CSS, the script tags in load order

game/       content.js  every tuning number + all content tables
            state.js    dive state, what persists (meta), reset(), the save
            logic.js    step(), the plan, home's buying, the debug setup
                        ── Survives the port.

platform/   input.js    keyboard + mouse → keys / justPressed / aim
            audio.js    WebAudio synthesis
            render.js   canvas, view scaling, the camera, every draw function
            sonar.js    the play-test recorder, and the replay it is read by
main.js                 frame loop, boot, the save's storage
                        ── Rewritten on the port.

checks.js               the ?test suite: only what a browser can check (D39)
```

Plain `<script>` tags, not modules, so `file://` works; load order is
documented in `index.html`.

### The port seam

`game/` reaches into `platform/` for exactly these names, and `npm test` loads
it with only these stubbed (`foundations.md` → The technical contract):

| Name | Owner | Rust/C++ equivalent |
|---|---|---|
| `sound(name, pitch)` | `platform/audio.js` | any audio crate/lib |
| `keys` | `platform/input.js` | a held-key set |
| `justPressed` | `platform/input.js` | an edge-triggered set |
| `tapped(codes)` | `platform/input.js` | trivial helper |
| `moveCursor(i, len)` | `platform/input.js` | trivial helper |
| `aim` | `platform/input.js` | cursor position in **view** coords, in whole 1/256ths of a pixel so every window size reads one point alike (D122); `game/` adds `cameraY` |
| `persist(text)` | `main.js` | write a string to a file / the platform's storage |

`persist` (D77): `game/` decides *when* the save is written and builds the
text, through `saveNow()`; keeping it is the platform's. Loading needs no
name — `main.js` reads the text at boot and calls `loadSave()`. Under `?test`,
`?dev=` and the debug mode nothing is loaded or written, so no check ever
touches a player's save.

Mouse buttons ride in `keys` and `justPressed` as codes a keyboard cannot
produce (`'Mouse0'`), so clicks needed no new name. Which key means which
action is content, in `game/content.js` (D44): the seam once grew to eleven
names by reading key constants from `platform/`, found only when a test drove
that path.

## The frame

```
frame(now)                 main.js — measures how long a frame took
  advanceBy(elapsed)       game/logic.js — banks time into whole ticks,
                           capped at MAX_FRAME_DT, so a minute in another
                           tab is dropped and catch-up is at most 6 ticks
    update(FIXED_DT) ×0..6 step(), then the shake fade, then justPressed.clear()
  draw()                   platform/render.js — every frame
```

**One tick length, `FIXED_DT` 1/120** (D53): the same dive plays identically
at 60Hz and 144Hz. No render interpolation — the picture is at most 8ms stale,
which is why the tick is 1/120, not 1/60. The clock lives in `game/`, not
`main.js`, so the port keeps it and Node drives the same entry point the
browser does. `update` changes numbers, `draw` only reads them.

The shake fade and the water run in `update()`, outside `step()`, because
`step()` returns early on every screen but play.

## Screens

```
title ──Start──> home ──Dive──> playing ──Esc──> paused ──Quit──> title
  │ (a dive saved:              │ ▲              │ (the dive stays saved)
  │  Continue ──> playing)      │ │ Continue     ├──> help ───Esc──> back to caller
  │                             │ │              ├──> catalogue ─Esc──> back to caller
  │                    layer end▼ │              └──> options ─Esc──> back to caller
  │                           mods
  │                             │
  └──<──Esc── home <──Go home── dead ──Dive again──> playing
              │ ▲              won
              │ └──Back / Esc── weapons, equipment, attributes
              └──Weapons, Equipment, Attributes──┘
home ──Catalogue──> catalogue ──Esc──> home     (D146)

title ──New game──> newGame ──Erase everything and start──> home     (D103)
                      └──Cancel / Esc──> title

paused ──Go home──> goHome ──End the dive──> home (banked, as at any end)   (D145)
                      └──Cancel / Esc──> paused

?debug ──> debug ──Dive / R──> playing ──Backspace──> debug     (D102)
             ▲                   └──Esc──> paused ──Quit to setup──> debug
             └──Setup / Esc── dead, won ──Again / R──> playing
```

A screen is a menu exactly when `MENUS` has an entry for it; `step()`
dispatches on it, and every way onto one is `openMenu()`. Anything that
depends on state is a getter — Start or Continue, a price, a dim row — so a
menu is data. Row rectangles come from `rowRect`/`rectOf()` in `content.js`,
for the renderer and the hit-test alike. The water freezes on menus, help and
options, except a menu that `flows` — the end screens (D58).

The traps the screens have met:
- **A click is read twice** — a menu reads it as an edge, the weapon as held —
  so the trigger is **armed** (D47): it counts only once the button has been
  seen released in play.
- **The layer end's cards** (D85) are marked, then taken on Continue; a cursor
  passing over a card marks nothing, since on its way down to Continue it
  crosses them.
- **The end screens open on Go home** (D90), so a stray Enter or Space — Space
  is the dash — does what any key did before; it is their top row, since a
  newcomer clicks the first (D184 (Go home on top)). Their Go home carries a red dot,
  and the gems and points banked, when they can buy something at `home`
  (D172 (the end screen marks what home can buy)).
- **`home`'s rows run in the order a newcomer needs them** — the Suit above
  the Mask, Heart above Dash reach (D185 (the rows a newcomer needs first)):
  a newcomer buys the top row first, tier after tier.
- **`home` exists only between dives** (D76): with a dive saved, Start reads
  Continue and goes back to it (`resumeTo`), so the shop never meets a dive in
  progress.
- **New game** (D103) opens on Cancel, so Enter and Esc erase nothing; it
  writes a fresh save, keeping the settings.

## Systems

**Movement — in water** (D107). The diver's and a chasing fish's velocity ease
toward where they want to go in `ease()`, `Math.pow` over `dt`, so a start
eases up, a release glides and a reversal swings through at any tick length;
movement still begins on the next tick. The diver's `facing` turns toward the
held keys and holds when they are let go — it aims the dash. The diver is
clamped to the **view**, `ARENA_W × ARENA_H` from `cameraY` (D58).

**Firing.** Manual (D45) and armed (D47, above). The cooldown is clamped at
zero, not let run negative, so holding gives an honest `fireRate` and the
first click after a pause is instant. Every number of the shot is the carried
weapon's, copied onto the player (D83). A weapon with a `swing` cuts every fish
in its arc at once instead (D105). A shot's hit and a cut both end in `hit()`,
which also splashes while Bloom runs (D125 (boosts keep each weapon's
nature)); a splash wounds nothing further, so a crowd cannot chain.

**Arrivals: the batch queue and the gate** (D27, D115). Nothing of the next
batch arrives until this one is dead. A batch arrives in **waves**: shuffled,
dealt into waves of `WAVE_MIN`–`WAVE_MAX`, the first whole and the rest
waiting in `incoming` on a schedule; an empty arena brings the next wave at
once. The batch lives while `batchLive()` — fish in the arena or still to
come — so the gate waits for the last wave. Batch `k` waits at
`gateDepth(k)`; past the last, the same arithmetic points at the bottom.
Fish enter just outside the view, past its edge by the whole body (D104), so
they fade in from the dark.

**Escorts** (D116). A mini-boss's or the boss's plan entry also holds
`escorts`, drawn from the pool before it. A mini-boss's are dealt into the
waves behind it. The boss arrives alone as `lead`, and while it lives
`incoming` is topped up to its `crowd`, each newcomer an `escort` paying no
gems; the boss's kill clears them all before the boost roll, so it drops no
boost. The marks ride on the fish, so the save needed no new version.

**Layers and the plan** (D66, D71, D72). `layer()` builds a layer from its pools and
its own draws: each stretch's batches, then a mini-boss escorted from that
pool, the last pool's closed by the boss — today one batch a stretch, six
gates (D155 (six gates a layer)). `reset()` draws the whole dive first,
before anything else takes from the seed, so a seed is a dive: `drawPlan()`
draws each stretch's batches without repeats into the flat `plan` and grades
each up to its stretch's threat (D126 (threat), D129 (a gentle first layer)),
never past the layer's top grade nor past `GRADE_KEEP` of a type left at
grade 1. The pools reveal the fish a type at a time, in order of their threat
(D130 (fish are revealed a type at a time)), but for a fish built against one
weapon, which comes where it counters it (D171 (the lionfish)). The abyss is one tall strip
(D72): depth adds up across layers, and the bottom is `plan.length`. The layer
end heals, pays the boss's haul and opens the pick; the last layer's end
carries you to the bottom, the win (D68).

**The descent** (D58). While a batch lives the camera holds; the **current
never stops** — `waterY` flows on, at `CURRENT_CRAWL` under a fight and the
end screens, so the water moves while the fight holds still. Cleared, the
current carries the camera and the diver to the next gate, about two seconds
away, whatever the player does: swimming moves you within the view, never the
view. The gate block runs before the player moves, so the clamp sees this
tick's camera. Difficulty is authored per batch, not ramped by the clock.

**Enemies.** Each tick a fish chases, or steps by its behaviour field — the
fields and what they do are `entities/enemies.md`. Then `separate()` makes
bodies solid (D120): overlapping pairs pushed apart by area, at most
`BODY_PUSH` a second; a dashing diver is not pushed, nor a lunger out of its
chase, so it keeps its lane. A fish that attacks only wholly in view chases
`towardInView()`, or one pinning the diver at an edge would never attack. A
grade (D119) is a `GRADES` step on copies of the type's records — `hp`,
`speed`, `value` multiplied, each attack's `damage` raised; it rides with each
fish into `incoming`, and a fish saved without one is grade 1.

**Bullets** fly straight from their birth velocity, so shots can be dodged.
Each has an `id`, and a fish remembers `lastHitBy`, so a piercing shot — and
the dash, which takes its id from the same space — hurts a fish once. An enemy
shot is a bullet with `evil` (D95), spent only by a hit that lands.

**The dash** (D50, D51, D56). Along the facing, never the cursor — usually the
way you least want to go. **Committed**: the direction is frozen at its start,
so input cannot turn, reverse or stop it; letting go was once a free 0.31s of
invulnerability. Invulnerable for the dash and a moment after, on its own
timer, `player.safe`, so it never blinks as a hit does (D121). It shoves
everything in front of the line it swept this tick, judged from where the tick
started — otherwise something it swept through reads as behind it. **The shove
is free, the wound is bought** (D51): scattering a crowd has to work from the
start, and the white flash shows only with damage, since a flash on a harmless
push is a lie. Its reach is `dashSpeed × DASH_TIME`, and nothing a dive picks
up lengthens it — `dashSpeed` is not a multiple of `speed`, so `Fins` does not
feed it (D56).

**Collision.** Brute force in **squared** space — 8.3× faster than
`Math.hypot` over 3.2M pairs; a spatial grid is the next step if it is ever
needed. The bullet and the dash are **swept**: `segDistanceSq()` tests the
segment crossed this tick, not the end point, so nothing tunnels at any speed
(D50, D53).

**Mods: the glowing fish and the layer end's pick** (D84, D85, D87, D88).
There is no rank and no XP. As a batch arrives `light()` marks one fish
`carrier`, never in a batch a `carries: false` type leads; its mod drops into
`drops` — apart from `gems` — and flies to you. `drawCarried()` deals every
ordinary mod still under its cap once before any comes again, and caps count a
mod still flying (`held()`): nothing stops it landing. With every ordinary mod
capped, no fish lights. Clearing a layer end waits `MOD_OFFER_DELAY` before
the cards, because cards on the kill's frame read as a jump cut (D51); a
pending offer holds the descent until Continue. If one tick kills the boss and
the diver, death wins. Weapon mods are dealt only while a weapon they fit is
carried (`fits()`, D99), every mod is capped (D69), and `takeMod()` is the one
place a mod is applied. Mods add on top of gear and attributes, never
multiplying (D74); anything a mod raises is a field on `player`, not a
`const`.

**Boosts** (D86). The chance on a kill is `BOOST_C` times the kills since the
last boost, and the kill that empties the arena never drops one — it would
fade behind you as the current carried you on. Which boost is a seeded draw
from those that fit the weapon (D125). Touched, a boost puts its `add` and its
`percent` of the diver's numbers on, and remembers what it added, to take back
exactly that when it ends; touched again it restarts its clock. Its clock runs
only in play, and it never moves `hp`, which could not be taken back cleanly.

**Currency.** Every kill drops its `value` in gems, times its grade's, and
every gem flies to you from anywhere and never fades (D35, D78), so nothing is
stranded by the descent. `endDive()` banks the dive's gems last in the tick, so
a gem caught on the frame you die is yours (D67). Nothing names the currency:
its name is open in `ideas.md`.

**What persists** (D31, D36, D75). `meta` holds the bank, gear tiers, attribute
steps, challenge rungs, the deepest depth, the layers cleared and the weapons
owned and carried. Points are **derived** — rungs earned, a point each,
less steps raised, step n costing n (D109, D152) — never stored. `reset()` builds the diver
as `PLAYER_START` carrying the weapon, plus each tier, equipment and attribute
step; mods then add on top. All sums. A weapon is owned, then carried (D97);
`requires` on gear schedules it behind attribute steps, it never scales (D36,
D98). A challenge's streak lives in `tally` for the dive and is judged on a
clear, a kill, a dash's shove or a layer end (D109, D110, D152); a fish placed by hand belongs to no
batch and counts for nothing. Buying and raising write the save at once.

**The save** (D70, D77). `saveText()` is `meta`, the settings beside it — so
New game keeps them (D113) — and the dive in progress, `snapshot()`: every
variable a dive owns, the RNG's state included, so a dive resumes on the exact
tick. `loadSave()` changes nothing on a save it cannot read, and `main.js`
copies the text aside under `abyss-save-rejected`. Written on pause, a
purchase, a dive's end and when the page is hidden; never in the debug mode.
`migrate()` brings an older save up one version at a time, each step under
the decision that made it; `tests/fixtures/save-v1.json` onward, each written
by the first build of its version, must load in every later build.

**Damage** (D95, D118, D121, D122). Every hurt goes through `hurtPlayer()`:
the i-frames and the dash's `safe`, `immortal`, the shake, death, and the
suit's guard, which takes a whole hit instead of HP, refilled at the layer
end with the heal (D100, D179). Without the i-frames a touching eel drains 3 HP in 50ms.

**Knockback** (D122). A hit pushes a fish by the weapon's `knock`, scaled by
body size the way bodies push each other, onto the same `pushX`/`pushY` the
dash's shove uses, fading by `PUSH_DRAG`.

**The bump** (D140). A fish the diver's shot or swing hits is drawn jolted
along the hit and flattened along it, by `BUMP_SIZE` of its radius, easing
back over `BUMP_TIME`. Drawn only, so a lunger on its line jolts too; the
diver has none, and a hit that kills shows the death instead.

**Sound.** One oscillator and an envelope per sound, as data; no audio files.
A master gain and a compressor keep a dozen kills from clipping. The context
starts on the first key press, and the HUD says why a silent game is silent.
Every moment of a dive has one (D144 (every moment of a dive has a sound)):
the shot, a hit, a kill, a gem, the dash, being hurt, guarded and dying, a wave
arriving and a batch led by a mini-boss or the boss, a batch cleared and a
layer's end, a mod, a boost, and the fish's own attacks.

## Randomness

Every random number in a dive comes from `rng()` — mulberry32, seeded — so a
seed replays a dive exactly (D41): two balance runs can be of the *same* dive,
and "it broke sometimes" becomes "it broke on seed 4471". The one
`Math.random()` in `game/` picks a seed when none is given. `main.js` passes
`?seed=` to a scenario; a dive from `home` always draws a fresh one.

## The status bar and the readout

`statusLines()` in `content.js` builds the status bar, so its text ports and a
check reads it — hp, guard, gems less the `+N` still on its way to them
(D142 (the +N)), the weapon, the layer and gate, fish left,
mods and boosts, each challenge's count against its next rung — then, in the
debug mode only (D148 (the readout only in the debug mode)), the
**development readout**, `PLAYER_STATS` (D52); last, for `NOTICE_TIME`, what
was just added to the catalogue (D146 (the catalogue)). Each readout entry
names its field, so a check proves every stat a mod or boost moves is on
screen (D99). A card and the pickup line show what a mod changes by applying
it to a copy of the player (`modPreview()`), so neither can advertise what
`apply` does not do. The numbers on cards go beyond D34 (mods)'s words, and
stay through alpha (D148).

## Screens must fit

Rows stacked from a table take their positions from `.length`, never a fixed
`y` — adding a row to `HELP_KEYS` once ran the list through the blurb while
every check passed (D46). The browser suite holds help, the catalogue, the mod cards (their
descriptions inside the card, D49), the layer end's hint, `home`'s layer list
and rows, and every menu's rows above the hint.

## Scenarios and the debug mode

`SCENARIOS` (D37, D42) — the URLs are the root `README.md`'s. `?dev=<name>`
loads one **frozen**, advanced only by `advance(n)`, which runs n fixed ticks
with no wall clock — what the tests and the bot drive; `&play` runs it live. A
scenario never reads or writes the save. `immortal` and `damageOverride`
survive Dive again; no URL sets them.

The debug mode (D102) is a menu of value rows built from the tables. Its setup
is text, `setupCode()` and `parseSetup()`, kept in the address bar, so a URL
replays it exactly. `debugDive()` plays it through a stand-in `meta`, so
`reset()` applies the setup as a dive from `home` would; the boosts it sets
lie in a row beside the diver at the start, up to `DEBUG_BOOST_MAX 3` of
each, as a fish's drop would with `BOOST_LIFE 6` seconds to touch them (D198
(boosts in the debug mode)). Every tip is worked
out by `modPreview()` on the diver a dive starts with, so a tip cannot state a
number the game does not deliver.

## Sonar

A play-test (D164 (Sonar)) records what `game/` reads from the player — a
line a frame that ran a tick: its tick count, wall-clock ms, and the aim,
held keys and presses when they changed — plus every seed `newSeed()` draws,
which `platform/sonar.js` wraps. `sonarReplay()` feeds the lines back to
`update()` a tick at a time, the presses to a frame's first tick, as live, and
compares a probe each second. `game/` is untouched, and the recorder sets no
game state: a limit met only draws the corner tag, or the play would not
replay — and no draw may either, so `gateLine()` puts back the randomness it
reseeds. `npm run play` copies the build beside each play, and the game
replays on that copy — in Node for `npm run sonar`, in the browser for
`?replay&at=<tick>`.

## Performance, measured

Chrome, 3440x1440 (scale 1.8), 60fps budget 16.7ms, 2026-09-27 (D43):

| Load | `draw()` | of which glow | `update()` |
|---|---|---|---|
| 250 objects | 0.10ms | 0.02ms | — |
| 500 objects | 0.20ms | 0.05ms | 0.55ms @ 100k pair checks |
| 1000 objects | 0.58ms | 0.33ms | 1.22ms @ 400k pairs |
| 2000 objects | 2.72ms | 2.18ms | 3.67ms @ 1.6M pairs |

A snapshot of one machine; re-measure with a stepped scenario before trusting
it.

## Tests and measuring

Which suite covers what, and how to run each, is the root `README.md` and
`code.md` → Verification. What the code does not show:

- **`tests/harness.js` runs `game/` in a Node `vm`.** `let` and `const` at a
  classic script's top are not properties of the global object, so the
  harness generates accessors for state and constants.
- **A property test is only as good as its generator.** The no-NaN invariant
  passed with a divide-by-zero guard deleted, because the cursor was never
  exactly on the player; it now is 8% of the time.
- **A check that expects a shot to land sets `aim` itself** (`fireAt()`):
  four once passed only because the check before left the cursor on the line.
- **Driven runs are silent**: `?test` and `?dev=` boot at volume 0, the debug
  mode muted. The audio checks measure peaks in an `OfflineAudioContext`, so
  muting weakens none; the options check restores the volume it booted with —
  a hardcoded 0.6 once un-muted the rest of the suite.
- **Three bots** (`tests/bot.js`, D128 (the balance suite)): `kiteAndShoot`,
  the regression yardstick, comparable only to itself; the diver bot, which
  plays from what the screen shows with a player's limits and its own random
  generator, so it never moves the game's draws; and the standing bot.
  `tests/measure.js` holds the runners, one worker thread a seed, and
  `npm run measure fit` writes the pools' counts to the threat curve.
  `BARS` there is every bar `npm run balance` holds, each naming what breaks
  it; `npm run measure bars` prints them, the suite checks them (D199 (the
  bars, printed)). The figures live in `roadmap.md` → Health and only there.

## Balance constants

All in `game/content.js` under `// balance`: the real product of the
prototype, carried to any port verbatim. The entities' numbers are their docs'
in `entities/`; the rest are here, and `npm test` holds them to the code.

`RAMP_LEFT 0.05` ·
`GEM_PULL 600` · `NOTICE_TIME 2.5` · `ENEMY_JITTER 0.3` ·
`GATE_PAUSE 1.2` · `GATE_SPACING 400` · `CURRENT_SPEED 200` ·
`CURRENT_CRAWL 30` · `CURRENT_EASE 0.05` · `MOD_OFFER_DELAY 0.6` ·
`END_STEP 2` · `BOOST_C 0.02` ·
`BOOST_LIFE 6` · `FLURRY_TIME 2` · `FIXED_DT 1/120` ·
`MAX_FRAME_DT 0.05` · `DASH_TIME 0.16` ·
`DASH_GRACE 0.15` · `DASH_REACH 40` · `DASH_ARC 0.2` ·
`DASH_END 0.18` · `DASH_PUSH 320` · `PUSH_DRAG 0.02` · `SHAKE_FADE 0.02` ·
`SHAKE_FLOOR 0.15` · `SHAKE_HURT 7` · `SHAKE_DEATH 38`. The challenges'
and the attributes' numbers are `entities/challenges.md`'s.
