---
name: abyss-tidy
description: Use when Igor asks for a cleanup, a tidy or a doc sweep of the whole project, when a stage closes, or when the docs, memory or skills read bloated, stale or contradictory — to throw away what bloats the context, find and raise contradictions, and keep every doc and file where it belongs. Not the consistency sweep that ends every change (`docs/working.md`); this is the whole tree at once.
---

# Tidy: the docs lean, true and in their place

The consistency sweep (`docs/working.md`) keeps one change honest. Docs
still rot between changes: a living doc grows a history, a fact gets a
second home, an answered question stays open, a memory line goes stale.
This pass is the whole tree at once. The rules it enforces are already
written — `docs/README.md` (living docs and logs, one home per fact, how an
item moves), `docs/working.md`, `docs/code.md`, D123 (nothing rewritten
every session), D134 (lean docs), D165 (play-tests in one file, the logs
disposable). This skill is how to apply them in one go. They outrank it.

Medium effort fits it (`working.md` → The reply). Keep the plan and the
findings in the scratch space from the first step (D169 (a task runs until
only Igor's answers are left)).

## What costs the most

Context is spent first by what loads every session: `CLAUDE.md`, the
memory index and its files, `foundations.md`, `plan.md`, `working.md`, and
the user-level `~/.claude/` rules. Then by what is read most:
`roadmap.md` → Next, `ideas.md`, `bugs.md`, `design.md`. A line cut there
saves more than ten in `decisions.md`, which is read by heading. Measure
first — `wc -l` on each — and spend the effort in that order.

## The passes

Read by heading and by grep, a section at a time — never a whole long doc
into the context (`decisions.md` above all).

1. **History in a living doc.** `foundations.md`, `plan.md`, `working.md`,
   `code.md`, `roadmap.md`, `design.md`, `entities/`, `ideas.md`,
   `reading.md`, `bugs.md`, `playtests.md` say what is true now. Look for
   narration — "since", "was", "used to", "no longer", a chain of what was
   built in order — and rewrite it to the present, citing the decisions
   instead of retelling them. `roadmap.md` → Next drifts into a history of
   the stage first; it says what is next, and what is done is the
   decisions'.
2. **Answered and finished items.** An `ideas.md` question a decision
   answered leaves it; a fixed bug leaves `bugs.md`; an idea Igor declined
   moves under Declined with his reason; a played play-test's reading is
   concluded in `playtests.md`, not reopened.
3. **One home per fact.** A number, a list or a rule written in two docs:
   keep it in its home (`docs/README.md` → One home per fact), cite it from
   the other. Measured bot figures live only in `roadmap.md` → Health.
4. **Contradictions.** Walk `foundations.md` and `plan.md` against the
   living docs, the skills, `CLAUDE.md`, the root `README.md` and the
   in-game text: a rule stated two ways; a superseded decision still cited
   as current (`grep -n 'Supersedes' docs/decisions.md` lists them); a term
   off the glossary; a file, command, constant or check a doc names that is
   gone. `npm run docs` and `npx vitest run tests/docs.test.js` catch the
   mechanical part; the prose is read.
5. **Logs stay logs.** `decisions.md` and `changelog.md` are appended to,
   never trimmed or reworded — a wrong one is superseded by a new decision.
   `specs/` holds only the open stages' specs; a closed stage's leaves, and
   git keeps it (D134 (lean docs)).
6. **Memory and skills.** Each memory file: still true, not something the
   docs already say, not a duplicate of another; the index one line each.
   Each skill and `CLAUDE.md`: every file, command and rule it names still
   exists and still holds. The user-level `~/.claude/rules/` are written
   for another project and collide here (`working.md` → Skills and
   plugins): raise what they cost, never edit them unasked.
7. **The tree.** Committed files are only what is required, flat (D165);
   `git status --ignored` for strays. `logs/` is disposable, but a play is
   only replayable while it is kept: list the old plays and their size,
   and delete only on Igor's word.

## What is done, and what is raised

- **Done and reported**: an unambiguous stale fact (a count, a renamed
  constant, a dead link), history rewritten to the present with nothing
  lost, a fact's copy replaced by a citation, an answered item moved out.
  Each with its evidence, one line: what it was, why it is dead weight.
- **Raised, never done alone**: anything that needs a judgement — two docs
  that disagree on what is true, a rule that looks wrong, a decision that
  looks dead, Igor's words that seem stale. One question at a time
  (`working.md` → Questions and uncertainty). Igor's quotes are never cut
  from where they are a decision's reason.
- **Never deleted unasked**: a code comment, a decision, a play's log.

## Ending

`npx vitest run tests/docs.test.js` passes; the diff is reread whole for a
fact lost along the way. The reply lists every finding — done, or the one
question it waits on — and stops before the commit (`working.md` →
Commits). Something the pass found by hand twice is worth a check in
`tests/docs.test.js`: propose it.
