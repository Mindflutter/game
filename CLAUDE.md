# Abyss

A 2D action roguelite: dive into a layered abyss, fight hard-gated batches of
sea creatures, surface to spend currency on gear. Browser build: open
`index.html` — no build step, no runtime dependencies, no server. (Dev-only
test tooling exists in `package.json`; the game itself loads no libraries.)

It began as a survivors-like auto-shooter. It is not one any more — D28
replaced auto-fire with manual LMB fire, and D27 replaced endless spawning with
gated batches. Anything describing an auto-shooter is describing the prototype.

**The browser build is a throwaway prototype.** The end goal is a native
executable (Rust or C++) with real graphics; this version gets dropped after
that port. What carries over is the gameplay logic, the tuned constants, the
data tables and the `?test` checks — *not* the rendering. Do not invest in the
canvas layer, a sprite pipeline, or browser-specific polish.

## Read before proposing work

`docs/` is the source of truth, and is **tracked in git** since 2026-09-27
(D40 — Docs are tracked). Read in this order:

1. **`foundations.md`** — the layer that does not change before alpha. The
   binding glossary, the genre contract, the pillars as checkable statements,
   the technical contract, the non-goals. **Read it first, every session.**
2. **`plan.md`** — the stages S0–S7, their definitions of done, and which one
   is active. The only doc that says "we are here".
3. `roadmap.md` — near-term work inside the active stage, and build health.
4. `decisions.md` — what was decided and why, incl. rejected options.
5. `ideas.md` — backlog: open / parked / declined.
6. `design.md` — how the code works today.
7. `changelog.md` — what shipped.

`high level design.md` is Igor's source description. Frozen input, not a
working doc.

Check `decisions.md` and `ideas.md` before suggesting anything "new" — it is
probably already there, possibly already declined with a reason. Use the
glossary's words exactly: **layer, dive, rank, mod, gear, tier, batch, wave,
home, attribute**. Never "level" or "upgrade" — each meant two things in the
draft, which is why they are banned (D32).

## Hard constraints

- No dependencies. Libraries were explicitly *permitted* by Igor and are still
  declined on measurement grounds (D30) — Canvas 2D plus an offscreen glow
  cache covers the stated entity budget. Revisit only on a **measured** failure
  against that budget, never on a hunch that it might be slow.
- No asset files. Everything drawn or synthesised in code. Softened only by the
  condition Igor set: if enemies or layers become indistinguishable, art moves
  to S7 and D4 is revisited.
- Double-clicking `index.html` must keep working — so plain `<script>` tags,
  never ES modules (blocked over `file://`). Load order matters.
- `game/` contains **zero** browser API. It reaches into `platform/` for a
  deliberately short list of names — currently `sound`, `keys`, `justPressed`,
  `tapped`, `moveCursor`, `aim`. That seam is the port; keep it clean. It will
  grow past six (camera, save, mouse buttons); every addition is deliberate and
  listed in `design.md`, never incidental.
- Do not invest in the canvas layer. The one sanctioned exception is the
  offscreen glow cache, which is a performance fix that keeps the D3 look,
  not a rendering investment.

## Conventions

- **Content is data.** Enemies, weapons, gear, tiers, mods, batches, sounds,
  menus and options are flat lists of records. Adding one is a line and touches
  nothing else. The alpha's content counts are only reachable if adding the
  fifteenth enemy costs what adding the second did.
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

- Two suites (D39 — Test stack). **Node/Vitest** covers logic, deterministic
  simulation, invariants and soak — `game/` has no browser API so it loads
  directly. **`index.html?test`** covers only what Node cannot: audio peak
  levels, canvas, real input. `?test` matches exactly, so cache-busting query
  strings won't trigger it.
- **A check that cannot fail is not a check.** The suite counts and reports
  `N passed / M failed`. `console.assert` is banned — it logs and continues,
  which let the old suite print "checks done" over real failures.
- **Every recorded decision gets an invariant guarding it**, or it erodes
  silently. See D39 for the list.
- `?dev=<name>&seed=<n>` loads a named scenario from `SCENARIOS` (D37) — one
  enemy, one batch, one layer, in isolation. The bot drives the same mechanism.
- Every behavioural change lands with a check **that fails without it**. A check
  that can only pass proves nothing — verify it by breaking the rule it guards.
- Balance is measured by driving `update()` faster than real time with a
  scripted bot, and reported as numbers, not impressions.
- **Game feel is Igor's call and is never asserted.**
- Hard-refresh (Cmd+Shift+R) after edits. Several script files mean a partial
  cache serves a mix of old and new, which produces baffling bugs.
- Every number the docs quote about the code is regenerable. Line counts:
  `wc -l game/*.js platform/*.js main.js`. **The check count is whatever the
  suite reports**, not a grep — `grep -c` counts lines containing an assertion,
  which undercounts because some call sites sit inside loops.

## Working agreement

- **Every response ends with a `TL;DR` section** — at the bottom, never the
  top. Not a one-line recap: a short block saying what was done, what it means,
  and what is now open or blocked, readable on its own by someone who skips the
  rest. Concise but actionable. Every response, including short ones.
- **One question per response.** Not four. Igor has to hold the whole context
  to answer, and a wall of simultaneous decisions is expensive for a human in a
  way it is not for a model. Ask the most load-bearing one, act on assumptions
  elsewhere, and say which assumptions.
- **Keep responses short.** Long analyses are hard to process. Put the detail
  in the docs, where it can be re-read, and keep the message to what Igor has
  to act on now.
- **Always name a stage or decision, never just its number.** "S1 — Combat
  core", "D28 — Manual fire", not a bare "S1" or "D28". A number alone means
  nothing without opening a file.
- Small steps: one playable change, then stop and explain what changed.
- Explain gamedev concepts, not JavaScript — Igor is an experienced backend
  developer with no prior gamedev experience.
- Commit messages: short subject line only. No body, no attribution trailers.
- **Docs update with development, in the same step — never as a cleanup pass
  at the end.** Shipping something updates `docs/changelog.md`,
  `docs/decisions.md` for anything decided or reopened, and `docs/design.md`
  if it changed how something works. Updating means grepping for what the
  change made **false** and fixing that first, before appending anything new.
  Docs that contradict themselves are worse than no docs.
- **Every measured number lives in exactly one doc.** Check counts, line
  counts, bot survival times, the port share. A number copied into a second
  file is a number that will disagree with itself — every stale figure found
  so far was a copy. Cite the owning doc instead: survival times are
  `roadmap.md` → Health, and nowhere else.
- After a squash or rebase, re-check the changelog: it cites commits, and
  rewriting history turns its entries into fiction.
