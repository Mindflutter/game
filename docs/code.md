# Writing and checking the code

The rules for touching the code, read whenever a session writes, changes or
verifies it (D131 (CLAUDE.md is an index)). The technical contract —
no runtime dependencies, the `game/` ⁄ `platform/` seam and its names, the
fixed timestep, checks that can fail — is `foundations.md`'s, and is not
repeated here. How each system works is `design.md`; how to run the game, the
suites and the scenarios is the root `README.md`.

## What the browser build is

A 2D action roguelite: dive into a layered abyss, fight hard-gated batches of
sea creatures, surface to spend currency on gear. Open `index.html` — no build
step, no runtime dependencies, no server. (Dev-only test tooling exists in
`package.json`; the game itself loads no libraries.)

It began as a survivors-like auto-shooter. It is not one any more — D28
replaced auto-fire with manual LMB fire, and D27 replaced endless spawning with
gated batches. Anything describing an auto-shooter is describing the prototype.

**The game is made in the browser until the browser stops it** (D154 (the
port waits on the browser's limits), D195 (art in the browser)). The native
port comes when the browser can no longer hold what is built — the frame
rate first. What carries over then is the gameplay logic, the tuned
constants, the data tables, the checks in `tests/` and the art's files —
*not* the canvas code that draws them. So art is files, and the drawing
stays thin; browser-specific polish is still not invested in.

## Constraints beyond the technical contract

- No dependencies, even permitted ones: Igor permitted libraries and they are
  declined on measurement grounds (D30). Revisit only on a **measured**
  failure against the object budget, never on a hunch that it might be slow.
- **Art may be files** (D195 (art in the browser)), held to the frame rate.
  Sound is still synthesised in code. A canvas that has drawn a local file
  cannot be read back over `file://`, so pixel reads — Sonar's pictures,
  `?test` — run over `http://localhost`; and `.gitignore` drops every
  `*.png` until the first asset changes it.
- Double-clicking `index.html` must keep working — so plain `<script>` tags,
  never ES modules (blocked over `file://`). Load order matters.
- **The seam is the port.** `game/` reaches into `platform/` only for the names
  `design.md` lists; every addition is deliberate, never incidental. It grew
  once, for the save: `persist` (D77 (the save; the seam's seventh name)) —
  `game/` decides when, the platform stores the text. The camera did **not**
  grow it: `cameraY` lives in `game/`, `aim` stays in view coordinates, and
  `game/` adds the offset itself (D58). `npm test` loads `game/` with only
  those names stubbed, so a new one breaks the build on any path a test
  drives — a path none drives can still hide one. That is how D44 found the
  seam had quietly become eleven.
- **Key bindings live in `game/content.js`, not `platform/`.** Which key means
  which action is content (D6); reading the keyboard is platform's job.

## Conventions

- **Content is data.** Enemies, weapons, gear, tiers, mods, boosts, batches,
  sounds, menus and options are flat lists of records. Adding one is a line and
  touches no other code. The alpha's content counts are only reachable if
  adding the fifteenth enemy costs what adding the second did. An enemy, mod,
  boost, weapon, piece of equipment, challenge, attribute, layer or batch also
  gets its section in `entities/`, and `npm run docs` writes its rows —
  `npm test` fails until they match the code (D81 — Entity docs, D133 (the
  doc tables write themselves)). Adding any piece of content follows the
  `abyss-content` skill (`.claude/skills/abyss-content/`).
- **Comments amend the code; they never define or contradict it** (D91). The
  code is the source of truth for behaviour, `docs/` the spec for what it must
  do. A comment says why, or what the code cannot say for itself. History,
  quotes and copied numbers belong in `docs/`, cited by decision — never a
  quote of Igor in a comment, tests included.
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
  simulation, invariants and soak. **`index.html?test`** covers only what Node
  cannot: audio peak levels, canvas, real input. `?test` matches exactly, so
  cache-busting query strings won't trigger it.
- `?dev=<name>&seed=<n>` loads a named scenario from `SCENARIOS` (D37) — one
  enemy, one batch, one layer, in isolation. The bot drives the same mechanism.
- `?debug` is the same idea for Igor's hands (D102): a setup screen for the
  place, the fish and the kit, muted until M, never touching the save. An
  issue that carries its `?debug=<code>` URL replays exactly, seed and all.
- Sonar (D164 (Sonar)) is how Igor's play comes back: a play-test replays
  his input on the build he played, so any moment can be read or drawn.
- **Run the checks of what changed**, not the whole suites — the test files
  the change touches, and its new checks, seen failing first. The full runs —
  `npm test`, `index.html?test`, `npm run balance` — happen on Igor's word,
  and what they find goes to `bugs.md`, to be processed apart (D132 (full
  runs on Igor's word)).
- Every behavioural change lands with a check **that fails without it**. A check
  that can only pass proves nothing — verify it by breaking the rule it guards.
- **A bug gets its root cause before its fix**: reproduce it with a failing
  check, find why it happens, then fix it there — never patch the symptom.
- **Before building anything that touches more than one system, list the
  failure cases it could meet** — a save taken partway, a record renamed or
  missing, invulnerability against a new kind of hurt, two new pieces meeting
  on one tick — and pin each with a check in the same change.
- **At the end of a change with several parts, review the whole diff for how
  the parts meet** before calling it done. Per-part checks cannot see two new
  pieces interacting: S5 (content)'s review found a puffer that burst on the
  tick a dash killed it, and paid for both.
- Balance is measured by driving `update()` faster than real time with a
  scripted bot, and reported as numbers, not impressions (D128 — The diver
  bot and the balance suite). `npm run measure <command>` prints the tables,
  and `npm run measure fit` resizes the pools to the threat curve;
  `npm run balance` holds the pillars as checks, slow, so never inside
  `npm test` — run it for any change a fight meets.
- **Game feel is Igor's call and is never asserted.**
- Hard-refresh (Cmd+Shift+R) after edits. Several script files mean a partial
  cache serves a mix of old and new, which produces baffling bugs.
- **Nothing that every session would rewrite is kept, unless a decision or a
  fix sets it** (D123) — no line counts (D92), no check counts, no list of every
  check, no recap of the pass, no figure re-measured with each change. The
  point is no pointless iterations.
