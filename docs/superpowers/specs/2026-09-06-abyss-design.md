# Abyss — design

Survivors-like auto-shooter. Browser, plain canvas, single file.

## Context

Owner's first game, zero prior gamedev experience. Goal is "find out if I
enjoy this", not "ship a product". Commitment is minimal and bursty, so every
step must be independently playable and explained as it lands.

## Decisions

- **One file, `game.html`.** Inline HTML/CSS/JS, opened via `file://`. No
  server, no build step, no dependencies. Split into ES modules only when the
  file passes ~500 lines and becomes annoying to navigate.
- **Plain JavaScript, not TypeScript.** TS needs a compile step, which would
  cost the `file://` double-click workflow. Revisit at the same time as the
  module split; `// @ts-check` plus JSDoc is the no-build middle ground.
- **No assets.** Circles drawn with `ctx.arc`, glow via `ctx.shadowBlur`,
  HUD via `ctx.fillText`. Deep-sea palette: near-black background,
  bioluminescent cyan player, dim red-violet enemies. Sound is generated in
  code with WebAudio later; no audio files, ever.
- **Plain objects in flat arrays.** `player`, `enemies[]`, `bullets[]`,
  `gems[]`, `particles[]`. No classes, no ECS.
- **Upgrades are data**, an array of `{name, desc, apply(state)}`, so adding
  one is an appended list entry rather than a change to the weapon system.
  This is the only deliberate architecture decision in the project.
- **The weapon has a firing range** (`player.range`), drawn as a faint ring.
  Unlimited range made the game a screen-clearing sniper exercise with no
  tension; a bounded radius forces enemies to enter the player's space and is
  what makes the genre work. It is a real range, not a detection range: shots
  track distance travelled and die at the ring, so the ring means what it says.
- **Fixed 1280x800 logical arena**, scaled to fill the window. Difficulty used
  to depend on monitor size -- a bot died at 61s on 1280x800 and survived past
  200s at full HP on 3440x1440, same code. The leftover margin is painted the
  same near-black as the background, so the letterboxing is invisible.
- **Enemy types are data**, like upgrades: a list of stat blocks with a weight
  and an unlock time, picked by weighted random. Adding one is a line.
- **Brute-force O(n^2) collision.** Fine to ~500 entities; spatial grid is the
  documented upgrade path when it chugs.
- **Verification is playing it.** Pure logic gets `console.assert` checks
  behind a `?test` URL param. Balance is measured by driving the game through
  Playwright with a scripted bot; game *feel* is judged by the owner only.

## Build order

Each step is playable on its own.

1. Canvas, glowing player circle, WASD movement.                    <- DONE
2. Enemies spawn off-screen, chase, contact damage, death screen.   <- DONE
3. Weapon auto-fires at nearest enemy; enemies die.                 <- DONE
4. Firing range, XP gems, level bar, level-up with 3 upgrades.      <- DONE
5. Enemy types, fixed arena, real bullet range, expiring gems, XP curve. <- DONE
6. Juice: screen shake, hit flash, particles, WebAudio beeps.        <- DONE

## Balance, as measured

All numbers from a scripted flee-bot driving update() faster than real time.

Fixed since step 4:

- Difficulty no longer depends on window size: 70.6s / 55.0s / 63.0s at
  1280x800, 1920x1080 and 3440x1440 (was 61s -> 200s+).
- Levelling no longer accelerates. Seconds per level went from
  27, 8.8, 8.6, 5.6, 8.5, 5.0, 4.9 to a flatter spread, via a geometric
  xpNext curve (5 * 1.45^(level-1)).
- Stranded gems fell from 40-67 on the floor at death to 4-20, via an 8s
  gem lifetime that blinks out.

Current state: five bot runs died at 51.6-59.3s, level 5-6. Tight enough that
tuning changes are measurable.

## After the six steps

Owner's plan, in order:

1. Finish this standalone at small scope.
2. Experiment with sprites and more complex rendering.
3. Roguelite meta-progression -- persistent unlocks between runs, upgrade
   synergies. Deliberately deferred: the endless escalation that makes a
   standalone arcade build feel unfinished is exactly what a run-based
   roguelite wants.

Playtest at step 5: ~70s survival over three tries. Read as too punishing for
a standalone with no ending, promising as a roguelite run length.

## Deferred

Sprites, menus, save data, mobile input, multiple levels.
