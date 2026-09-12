# Abyss

A survivors-like auto-shooter. Browser prototype: open `index.html` — no build
step, no dependencies, no server.

**The browser build is a throwaway prototype.** The end goal is a native
executable (Rust or C++) with real graphics; this version gets dropped after
that port. What carries over is the gameplay logic, the tuned constants, the
data tables and the `?test` checks — *not* the rendering. Do not invest in the
canvas layer, a sprite pipeline, or browser-specific polish.

## Read before proposing work

`docs/` is the source of truth. It is **untracked and local only**, so nothing
else in the repo points at it:

`roadmap.md` (what's next, what's blocking) → `decisions.md` (what was decided
and why, incl. rejected options) → `ideas.md` (backlog: open / parked /
declined) → `design.md` (how the code works today) → `changelog.md`.

Check `decisions.md` and `ideas.md` before suggesting anything "new" — it is
probably already there, possibly already declined with a reason.

## Hard constraints

- No dependencies. Nothing installed to run the game.
- No asset files. Everything drawn or synthesised in code.
- Double-clicking `index.html` must keep working — so plain `<script>` tags,
  never ES modules (blocked over `file://`). Load order matters.
- `game/` contains **zero** browser API. It reaches into `platform/` for exactly
  five names: `sound`, `keys`, `justPressed`, `tapped`, `moveCursor`. That seam
  is the port; keep it clean.

## Conventions

- **Content is data.** Upgrades, enemy types, sounds, menus, options are flat
  lists of records. Adding one is a line and touches nothing else.
- **Plain objects in flat arrays.** No classes, no inheritance, no ECS.
- **Input matches `e.code`, never `e.key`** — `e.key` is the character a key
  types, which depends on the keyboard layout.
- **Time-based decay uses `Math.pow(x, dt)`**, never a per-frame factor: a
  per-frame factor runs 2.4x faster on a 144Hz screen.
- **Mark and sweep** — flag dead entities during the loops, `filter()` after.
  Never remove from an array you are iterating.
- **Squared distances** in the per-frame collision loops. No `Math.hypot` there.
- Every tuning number lives in one `// balance` block in `game/content.js`.

## Verification

- `index.html?test` runs the `console.assert` suite; read the browser console.
  It matches `?test` exactly, so cache-busting query strings won't trigger it.
- Every behavioural change lands with a check **that fails without it**. A check
  that can only pass proves nothing — verify it by breaking the rule it guards.
- Balance is measured by driving `update()` faster than real time with a
  scripted bot, and reported as numbers, not impressions.
- **Game feel is Igor's call and is never asserted.**
- Hard-refresh (Cmd+Shift+R) after edits. Eight files means a partial cache
  serves a mix of old and new, which produces baffling bugs.

## Working agreement

- Small steps: one playable change, then stop and explain what changed.
- Explain gamedev concepts, not JavaScript — Igor is an experienced backend
  developer with no prior gamedev experience.
- Commit messages: short subject line only. No body, no attribution trailers.
- Shipping something updates `docs/changelog.md`, and `docs/design.md` if it
  changed how something works.
