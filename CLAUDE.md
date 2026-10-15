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
(D40 — Docs are tracked). Every session, first:

1. **`foundations.md`** — the layer that does not change before alpha. The
   binding glossary, the genre contract, the pillars as checkable statements,
   the technical contract, the non-goals. **Read it first, every session.**
2. **`plan.md`** — the stages S0–S7 (plus the passes between them), their
   definitions of done, and which one is active. The only doc that says "we
   are here".

Then look the rest up by question, not front to back: **`docs/README.md`** is
the map (D82 — The docs map). Next steps and bot figures are `roadmap.md`; how
the code works, `design.md`; every enemy, mod, boost, weapon, piece of
equipment, challenge and attribute, `docs/entities/`; why something was decided,
`decisions.md`, found by its heading; what is undecided, `ideas.md`; what
shipped, `changelog.md`.
`high level design.md` is Igor's source description. Frozen input, not a
working doc.

Check `decisions.md` and `ideas.md` before suggesting anything "new" — it is
probably already there, possibly already declined with a reason. Use the
glossary's words exactly: **layer, dive, mod, boost, gear, tier, batch, wave,
home, attribute, challenge**. Never "level" or "upgrade" — each meant two things in the
draft, which is why they are banned (D32) — and never "micro-task", the old name
of a challenge (D110).

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
  `tapped`, `moveCursor`, `aim`, `persist`. That seam is the port; keep it
  clean. It grew once, for the save: `persist` (D77 (the save; the seam's
  seventh name)) — `game/` decides when, the platform stores the text. Every
  addition is deliberate and listed in `design.md`, never incidental. The camera did **not** grow it: `cameraY` lives in `game/`, `aim`
  stays in view coordinates, and `game/` adds the offset itself (D58). **`npm test` enforces this**: `tests/harness.js` loads
  `game/` with only those seven stubbed, so an eighth name breaks the build on
  any path a test drives — a path none drives can still hide one. That is how
  D44 found the seam had quietly become eleven.
- **Key bindings live in `game/content.js`, not `platform/`.** Which key means
  which action is content (D6); reading the keyboard is platform's job.
- Do not invest in the canvas layer. The offscreen glow cache that used to be
  the sanctioned exception was **cancelled** by D43 — measurement showed glow
  costs 0.05ms of a 16.7ms frame, so there was nothing to fix. The rule now
  stands unqualified.

## Conventions

- **Content is data.** Enemies, weapons, gear, tiers, mods, boosts, batches, sounds,
  menus and options are flat lists of records. Adding one is a line and touches
  no other code. The alpha's content counts are only reachable if adding the
  fifteenth enemy costs what adding the second did. An enemy, mod, boost, weapon,
  piece of equipment, challenge or attribute also gets its row and section in `docs/entities/` —
  `npm test` fails until they match the code (D81 — Entity docs). Adding any
  piece of content follows the `abyss-content` skill
  (`.claude/skills/abyss-content/`).
- **Comments amend the code; they never define or contradict it** (D91). The
  code is the source of truth for behaviour, `docs/` the spec for what it must
  do. A comment says why, or what the code cannot say for itself. History,
  quotes and copied numbers belong in `docs/`, cited by decision.
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
- `?debug` is the same idea for Igor's hands (D102): a setup screen for the
  place, the fish and the kit, muted until M, never touching the save. An
  issue that carries its `?debug=<code>` URL replays exactly, seed and all.
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
  scripted bot, and reported as numbers, not impressions.
- **Game feel is Igor's call and is never asserted.**
- Hard-refresh (Cmd+Shift+R) after edits. Several script files mean a partial
  cache serves a mix of old and new, which produces baffling bugs.
- Every number the docs quote about the code is regenerable, and they quote no
  line counts (D92). **The check count is whatever the suite reports**, not a
  grep — `grep -c` counts lines containing an assertion,
  which undercounts because some call sites sit inside loops.

## Working agreement

- **Every response ends with a `TL;DR` section** — at the bottom, never the
  top. Not a one-line recap: a short block saying what was done, what it means,
  and what is now open or blocked, readable on its own by someone who skips the
  rest. Concise but actionable. Every response, including short ones. No
  standing "not committed" line — Igor, 2026-09-29: "no need to state "not
  committed" section every time in tldr. other sections are very useful". It
  appears only when the commit itself is the open point.
- **Uncertainty is never resolved by documenting it.** Two rules, one each way:
  - **Claude is unsure → ask before writing it down.** Not after. A decision
    entry is a record of something settled; writing one to resolve your own
    doubt launders a guess into project history. This applies to the numbers
    too — an invented constant, a cap, a delay — which get marked as Claude's
    pick, not presented as derived.
  - **Igor is unsure → it is an open question, and it goes in `ideas.md`.**
    "I'm inclined to", "might", "maybe", "for later", "at this point" are
    leans, not decisions. Do not round them up. A lean plus an instruction to
    ship means *build it and leave the question open*, never *the question is
    closed*.

  **Every little aspect gets this treatment, whether or not it seems
  important.** The failure is always the same shape and never feels like a
  failure at the time: evidence is in hand, the call looks obvious, so Claude
  makes it and records it as settled. Recorded, 2026-09-28, after four
  instances in one stage — reading "for later think-thru" as covering a bug
  fix, "i'm inclined to mod thing" as a chosen tier, "useless at this point"
  as "delete it", and an example in D34 as a sizing decision.

  S2 (camera and descent) added a sibling shape, twice: a word *strengthened*
  rather than a lean rounded up. "Slows down on the next batch" was built as a
  dead stop. D27 (batches are hard-gated)'s "the descent stops" was read as
  camera mechanics when it means *no further in enemies* — the water keeps
  flowing — and was then presented back as a foundations reversal, with
  options on an answer Igor had already given. **Igor's words keep their exact
  strength** ("slows" is not "stops"), and a rule is read for what it means in
  the game before anything is called a contradiction.

- **One question per response.** Not four. Igor has to hold the whole context
  to answer, and a wall of simultaneous decisions is expensive for a human in a
  way it is not for a model. Ask the most load-bearing one, act on assumptions
  elsewhere, and say which assumptions.
- **Keep responses short.** Long analyses are hard to process. Put the detail
  in the docs, where it can be re-read, and keep the message to what Igor has
  to act on now.
- **Always name a stage or decision, never just its number.** A number alone
  means nothing without opening a file. In prose and in chat, put the short
  name in brackets: **"D28 (manual fire)"**, "S1 (combat core)". In `docs/`
  headings the em-dash form stays: `## D28 — Manual fire via LMB`.
  **Enforced, not remembered**: a Stop hook (`.claude/hooks/check-citations.mjs`,
  wired in `.claude/settings.json`) refuses any reply with a bare `D<n>` or
  `S<n>` — added 2026-09-28 after Igor asked for this a fourth time.
- Small steps: one playable change, then stop and explain what changed.
- **Stage-sized work gets a spec, a plan and a progress log.** The spec says
  what gets built and checks it against `foundations.md` and `plan.md`; it is
  kept, in `docs/specs/`, as the design record decisions point to. The plan
  orders the tasks, each with its checks, and the log records each task as it
  is done; both are scaffolding, kept in the session's scratch space so the
  work survives a compacted context, and never in the repo — once built, the
  code, its checks, the changelog and the decisions say it all.
- Explain gamedev concepts, not JavaScript — Igor is an experienced backend
  developer with no prior gamedev experience.
- **Stop before every commit and say so.** Stage nothing, commit nothing, until
  Igor has had the chance to run `/simplify` on the working tree. Say what is
  about to be committed and wait. This applies even when the work is verified
  and the message is written — being finished is not permission to commit.
- Commit messages: short subject line only. No body, no attribution trailers.
- **Every change ends with the consistency sweep. It is part of the change,
  never a separate request.** Igor should never have to ask "did you update the
  docs?" — if he does, the change was not finished. Grep for what the change
  made **false** and fix that *before* appending anything new; docs that
  contradict themselves are worse than no docs.

  The sweep covers all seven surfaces, in this order. Four of them have been
  missed for real, which is why they are listed rather than implied:
  1. **The checks themselves** — `checks.js` and `tests/`. A check asserting
     the old behaviour is not a failing test, it is a *wrong* test, and deleting
     one needs the same justification as writing one. *Missed: a check still
     asserted a scenario's old definition a full change after it was redefined.*
  2. **`docs/`** — `changelog.md` always; `decisions.md` for anything decided,
     reopened or superseded; `design.md` for anything whose behaviour changed;
     `docs/entities/` for any enemy, mod, boost, weapon, piece of equipment,
     challenge or attribute that changed — the check holds its numbers, never
     its prose; `plan.md` if a stage moved; `ideas.md` if an open question
     closed — the answered item leaves it. A living doc keeps no history
     (`docs/README.md`).
  3. **`foundations.md`** — if a rule changed, it is a decision: edit here and
     record it in `decisions.md` in the same step, never quietly.
  4. **`CLAUDE.md`** — it makes factual claims (the seam is seven names, the
     suites, the constraints) and they go stale. *Missed: it claimed six seam
     names while the code used eleven.*
  5. **In-game text** — `HELP_KEYS`, `HELP_BLURB`, menu labels, option names,
     mod descriptions. Prose inside `game/content.js` describes behaviour
     and no check can read it. *Missed: the help still said the weapon fires
     itself, a full change after it stopped doing so.*
  6. **Layout coupled to data** — adding a row to any table can push a fixed
     `y` through the text below it. Positions must be derived from
     `.length`, never hardcoded. *Missed: the help list ran straight through
     its own blurb while all 107 checks passed.*
  7. **Memory** (`~/.claude/projects/.../memory/`) — it is auto-loaded before
     any file is read, so a stale line there misleads the next session first.

  **Anything the sweep finds that contradicts, or merely smells, is raised
  immediately** — stated in that same response and opened as a discussion
  with Igor, not silently fixed, not parked in a note, not saved for later.
  Igor, 2026-09-28: "you do something - you check docs. something contradicts
  or looks smelly - you immediately state it and open a discussion with me."
  Fixing an unambiguous stale fact (a count, a renamed constant) is fine, but
  it is still *reported*; anything that needs a judgement waits for Igor.

  **Then look at it.** State checks are blind to a blank screen and to
  overlapping text — both have happened. If a change touches anything drawn,
  screenshot it before claiming done.
- **Every measured number lives in exactly one doc.** Check counts, bot
  survival times. A number copied into a second
  file is a number that will disagree with itself — every stale figure found
  so far was a copy. Cite the owning doc instead: survival times are
  `roadmap.md` → Health, and nowhere else. The same holds for every fact —
  `docs/README.md` → One home per fact lists the owners.
- After a squash or rebase, re-check the changelog: it cites commits, and
  rewriting history turns its entries into fiction.

## Skills and plugins

This file, `foundations.md` and `plan.md` outrank every skill and plugin that
loads here. Igor, 2026-09-28, after a skill's options-and-rulings style
reopened a settled answer: "make it respect all the strict rules, foundations
and plan". Where a step below collides with a rule here, the rule wins, and
nothing needs asking.

**superpowers is not used here** — switched off for this project in
`.claude/settings.json` (D94 — Superpowers dropped). What it gave that this
file did not already say is now in it: failure cases listed before building,
the whole change reviewed at the end, a root cause before a fix
(Verification), and a spec, plan and log for stage-sized work (Working
agreement). The user-level CLAUDE.md in `~/.claude/` has a trigger table
naming two of its skills; here they mean this file's rules — a bug gets its
root cause and a failing check before any fix, and a new design gets
`foundations.md` and `plan.md` checked first and its open questions asked, one
at a time. Subagents only when Igor picks them; work happens in place, in this
checkout.

- **ponytail.** Its lone `assert` self-check and "trivial one-liners need no
  test" yield to *every behavioural change lands with a check that fails
  without it*, in `tests/` or `checks.js`. "Code first, three lines" and
  "default rather than stall" govern code only — never the TL;DR, the gamedev
  explanation, or a design question.
- **disciplines** (`game-ai`, `game-feel`). The concept, not the shape: a state
  machine is a `behavior` field plus a branch, never state classes (D26 —
  disciplines installed); juice is S7 (alpha polish) work.
- **Global rules** in `~/.claude/rules/` are written for a Python backend.
  Where one collides with this file — "a constant lives next to its one
  consumer" against the single `// balance` block — this file wins.
