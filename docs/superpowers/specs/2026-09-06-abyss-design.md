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
  what makes the genre work. Implemented by seeding `nearestEnemy`'s search
  distance with `player.range` instead of `Infinity`.
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
5. More enemy types, more upgrades, tuning the difficulty curve.
6. Juice: screen shake, hit flash, particles, WebAudio beeps.

## Known balance problems (input to step 5)

Measured by a scripted bot run at step 4:

- Spawn rate outruns kill rate. At 66s there were 95 enemies alive against 98
  killed, so the field fills faster than it can be cleared.
- Gems go uncollected. Late in a run the XP earned is stranded in territory
  too dangerous to re-enter, so levelling stalls exactly when it is needed.

## Deferred

Sprites, menus, save data, mobile input, multiple levels. Step 6's juice will
do more for how the game feels than step 5's content will.
