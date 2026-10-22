# How Igor and Claude work

The working agreement: how a session starts, what a reply looks like, how
questions are asked and answered, when to commit, and the consistency sweep
that ends every change. Read every session, with `foundations.md` and
`plan.md` (D131 (CLAUDE.md is an index)). How the code is written and checked
is `code.md`.

## Starting a session

`foundations.md` first, then `plan.md`. The rest is looked up by question
through the map, `README.md` — not read front to back.

Check `decisions.md` and `ideas.md` before suggesting anything "new" — it is
probably already there, possibly already declined with a reason. Use the
glossary's words exactly: **layer, dive, mod, boost, gear, tier, grade, batch,
wave, home, attribute, challenge, entity**. Never "level" or "upgrade" — each
meant two things in the draft, which is why they are banned (D32) — never
"micro-task", the old name of a challenge (D110), and never "entity" for a
thing on screen: that is an object (D124).

`high level design.md` is Igor's source description. Frozen input, not a
working doc.

## The reply

- **Every response ends with a `TL;DR` section** — at the bottom, never the
  top. Not a one-line recap: a short block saying what was done, what it means,
  and what is now open or blocked, readable on its own by someone who skips the
  rest. Concise but actionable. Every response, including short ones. No
  standing "not committed" line — Igor, 2026-09-29: "no need to state "not
  committed" section every time in tldr. other sections are very useful". It
  appears only when the commit itself is the open point.
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
- Explain gamedev concepts, not JavaScript — Igor is an experienced backend
  developer with no prior gamedev experience.
- Small steps: one playable change, then stop and explain what changed.

## Questions and uncertainty

- **One question per response.** Not four. Igor has to hold the whole context
  to answer, and a wall of simultaneous decisions is expensive for a human in a
  way it is not for a model. Ask the most load-bearing one, act on assumptions
  elsewhere, and say which assumptions.
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
- **A comment from Igor is acted on at once only if both hold**: the change is
  minimal, and it directly concerns the current conversation. Anything else is
  recorded where it can be picked up later — `bugs.md`, `plan.md`, `ideas.md`,
  or wherever it belongs — with his words, and said so in the reply. Igor,
  2026-10-19: "pick a proper place so that we can come back to it any time
  later".

## Stage-sized work

**Stage-sized work gets a spec, a plan and a progress log.** The spec says
what gets built and checks it against `foundations.md` and `plan.md`; it is
kept, in `specs/`, as the design record decisions point to. The plan orders
the tasks, each with its checks, and the log records each task as it is done;
both are scaffolding, kept in the session's scratch space so the work survives
a compacted context, and never in the repo — once built, the code, its checks,
the changelog and the decisions say it all.

## Commits

- **Stop before every commit and say so.** Stage nothing, commit nothing, until
  Igor has had the chance to run `/simplify` on the working tree. Say what is
  about to be committed and wait. This applies even when the work is verified
  and the message is written — being finished is not permission to commit.
- Commit messages: short subject line only. No body, no attribution trailers.
- After a squash or rebase, re-check the changelog: it cites commits, and
  rewriting history turns its entries into fiction.

## The consistency sweep

**Every change ends with the consistency sweep. It is part of the change,
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
   `entities/` for any enemy, mod, boost, weapon, piece of equipment,
   challenge or attribute that changed — the check holds its numbers, never
   its prose; `plan.md` if a stage moved; `ideas.md` if an open question
   closed — the answered item leaves it; `bugs.md` when a bug is found, and
   when its fix lands — the fixed issue leaves it. A living doc keeps no
   history (`README.md`).
3. **`foundations.md`** — if a rule changed, it is a decision: edit here and
   record it in `decisions.md` in the same step, never quietly.
4. **`CLAUDE.md`, this doc and `code.md`** — they make factual claims (the
   seam, the suites, the constraints) and they go stale. *Missed: `CLAUDE.md`
   claimed six seam names while the code used eleven.*
5. **In-game text** — `HELP_KEYS`, `HELP_BLURB`, menu labels, option names,
   mod descriptions. Prose inside `game/content.js` describes behaviour
   and no check can read it. *Missed: the help still said the weapon fires
   itself, a full change after it stopped doing so.*
6. **Layout coupled to data** — adding a row to any table can push a fixed
   `y` through the text below it. Positions must be derived from
   `.length`, never hardcoded. *Missed: the help list ran straight through
   its own blurb while every check passed.*
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

**Every measured number lives in exactly one doc.** Bot survival times, for
one. A number copied into a second file is a number that will disagree with
itself — every stale figure found so far was a copy. Cite the owning doc
instead: survival times are `roadmap.md` → Health, and nowhere else. The same
holds for every fact — `README.md` → One home per fact lists the owners.

## Skills and plugins

`CLAUDE.md`, this doc, `code.md`, `foundations.md` and `plan.md` outrank every
skill and plugin that loads here. Igor, 2026-09-28, after a skill's
options-and-rulings style reopened a settled answer: "make it respect all the
strict rules, foundations and plan". Where a step below collides with a rule
here, the rule wins, and nothing needs asking.

**superpowers is not used here** — switched off for this project in
`.claude/settings.json` (D94 — Superpowers dropped). What it gave that the
rules did not already say is now in them: failure cases listed before
building, the whole change reviewed at the end, a root cause before a fix
(`code.md` → Verification), and a spec, plan and log for stage-sized work
(above). The user-level CLAUDE.md in `~/.claude/` has a trigger table naming
two of its skills; here they mean these rules — a bug gets its root cause and
a failing check before any fix, and a new design gets `foundations.md` and
`plan.md` checked first and its open questions asked, one at a time.
Subagents only when Igor picks them; work happens in place, in this checkout.

- **ponytail.** Its lone `assert` self-check and "trivial one-liners need no
  test" yield to *every behavioural change lands with a check that fails
  without it*, in `tests/` or `checks.js`. "Code first, three lines" and
  "default rather than stall" govern code only — never the TL;DR, the gamedev
  explanation, or a design question.
- **disciplines** (`game-ai`, `game-feel`). The concept, not the shape: a state
  machine is a `behavior` field plus a branch, never state classes (D26 —
  disciplines installed); juice is S7 (alpha polish) work.
- **Global rules** in `~/.claude/rules/` are written for a Python backend.
  Where one collides with these docs — "a constant lives next to its one
  consumer" against the single `// balance` block — these docs win.
- **abyss-content** (`.claude/skills/abyss-content/`) is the procedure for
  adding any piece of content.
