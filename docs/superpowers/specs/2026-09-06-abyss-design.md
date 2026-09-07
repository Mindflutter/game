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
- **No assets.** Circles drawn with `ctx.arc`, glow via `ctx.shadowBlur`,
  HUD via `ctx.fillText`. Deep-sea palette: near-black background,
  bioluminescent cyan player, dim red-violet enemies. Sound is generated in
  code with WebAudio later; no audio files, ever.
- **Plain objects in flat arrays.** `player`, `enemies[]`, `bullets[]`,
  `gems[]`, `particles[]`. No classes, no ECS.
- **Upgrades are data**, an array of `{name, desc, apply(state)}`, so adding
  one is an appended list entry rather than a change to the weapon system.
  This is the only deliberate architecture decision in the project.
- **Brute-force O(n^2) collision.** Fine to ~500 entities; spatial grid is the
  documented upgrade path when it chugs.
- **Verification is playing it.** The few pure functions (collision, XP
  threshold, upgrade rolling) get `console.assert` checks behind a `?test`
  URL param.

## Build order

Each step is playable on its own.

1. Canvas, glowing player circle, WASD movement.        <- DONE
2. Enemies spawn off-screen, chase player, deal contact damage; death screen.
3. Weapon auto-fires at nearest enemy; enemies die.  <- game exists here
4. XP gems, level bar, level-up pause offering 3 random upgrades. <- fun here
5. More enemy types, more upgrades, survival timer.
6. Juice: screen shake, hit flash, particles, WebAudio beeps.

## Deferred

Sprites, menus, save data, mobile input, multiple levels, balance passes.
None of it matters before step 4 proves the loop is fun.
