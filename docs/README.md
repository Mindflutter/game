# Abyss — working docs

Shared reference for Igor and Claude, tracked in git (D40 (docs are tracked)).
A change to them belongs in the same commit as the code it describes.

> **Start with `foundations.md`, `plan.md` and `working.md`. Every session.**
> Everything else is looked up by question, below — not read front to back.
> `CLAUDE.md` at the root only points here (D131 (CLAUDE.md is an index)).

## Where to look

| To find | Open |
|---|---|
| What a word means; what must stay true until alpha | `foundations.md` |
| Which stage we are in, and what each stage must deliver | `plan.md` |
| How Igor and Claude work: the reply, questions, commits, the consistency sweep | `working.md` |
| The rules for writing and checking code | `code.md` |
| The next steps inside the stage, and the measured bot figures | `roadmap.md` |
| How the code works — systems, screens, the save, the tests | `design.md` |
| An enemy: its numbers, role and behaviour | `entities/enemies.md` |
| A mod | `entities/mods.md` |
| A boost | `entities/boosts.md` |
| A weapon: its numbers and tiers | `entities/weapons.md` |
| A piece of equipment | `entities/equipment.md` |
| A challenge, the points it pays, and the attributes they buy | `entities/challenges.md` |
| A layer, its stretches and the batches in its pools | `entities/layers.md` |
| The diver's numbers at the start | `entities/diver.md` |
| Why something was decided, and what was rejected | `decisions.md` |
| Anything undecided: open questions, parked and declined ideas | `ideas.md` |
| Something broken in the game — a real issue, not an idea | `bugs.md` |
| What shipped, and when | `git log`; before 2026-10-22, `changelog.md` |
| Igor's description of the whole game | `high level design.md` |
| The open stage's design, and its check against `foundations.md` | `specs/`; a closed stage's, `git show 99d79ae:docs/specs/<file>` |

`decisions.md` is long. Find an entry by its heading — `grep '^## D'
docs/decisions.md` lists them all — and read that one. D1–D26 describe the
closed prototype, an auto-shooter; the warning at the top of the file says
which of them still hold.

## Living docs and logs

**Living docs** say what is true now, and are edited in place: `foundations.md`,
`plan.md`, `working.md`, `code.md`, `roadmap.md`, `design.md`, `entities/`,
`ideas.md` and `bugs.md`. They carry no
history — no "used to", no struck-through items, no answered questions. When
something stops being true it is rewritten or deleted, and what happened goes
to a log.

**Logs** record what happened, and are only ever appended to: `decisions.md`,
`changelog.md` — frozen on 2026-10-22, `git log` says what shipped since —
and `specs/`, which holds only the open stage's spec: a closed stage's is
removed, and git keeps it (D134 (lean docs)). To reverse a decision, add one
that supersedes it.

**A decision entry is short** — about fifteen lines: what was decided; why,
in Igor's words; what it supersedes; what guards it. Numbers that are Claude's
picks say so. The reasoning that led there stays in the conversation, not the
entry. `high level design.md` is neither — Igor's frozen input, never
edited.

## One home per fact

Every fact has one doc that owns it, and the others link there. A copy is a
fact that will disagree with itself: every stale figure ever found here was a
copy.

| Fact | Its home |
|---|---|
| A term | `foundations.md` → the glossary |
| Which stage is active, and what is next | `plan.md` |
| A rule for how we work | `working.md` |
| A rule for writing or checking code | `code.md` |
| An entity's numbers, role and behaviour | its doc in `entities/` |
| How a system works — the gate, the descent, the drops, the pick, the save | `design.md` |
| Measured bot figures | `roadmap.md` → Health |
| How many of each kind the alpha has | `foundations.md` → Alpha counts |
| A decision's reasons | its entry in `decisions.md` |
| An open bug | `bugs.md` |

## What keeps them true

`npm test` checks the docs as well as the game (`tests/docs.test.js`):

- each entity doc's tables are as `npm run docs` writes them from
  `game/content.js` — every item, every number, every card text — and every
  field of a record is documented, every item has its section;
- every `` `NAME value` `` a doc quotes is the constant's real value, and no
  doc that describes the code names a constant the code has lost;
- the root `README.md` lists every scenario;
- decisions are named, numbered without gaps, and cited only if they exist;
- every kind of entity is within its alpha count (D124 (diversity, the main
  rule));
- no living doc, nor the code, calls a challenge by its old name (D110
  (challenges));
- no doc quotes how many checks there are (D123 (nothing rewritten every
  session));
- this map names every doc, and every doc it — or `CLAUDE.md` — names exists.

What no check can see is whether prose is still true. That is the consistency
sweep's job (`working.md` → The consistency sweep).

## The entity docs

One doc per kind of entity, in `entities/`, all in the same layout (D81
(entity docs, one per kind)):

1. **What it is** — a few lines: the glossary's term, the table it mirrors in
   `game/content.js`, where the mechanism around it is described.
2. **Roster** — one row per item, with every number. `npm run docs` writes it
   from the code between its markers, `<!-- generated: id -->` and
   `<!-- /generated -->`, and a stale one fails `npm test` (D133 (the doc
   tables write themselves)).
3. **Fields** — the record's shape: each field, its unit, what it means.
   A field the code does not have yet is marked **Reserved**, with the stage
   that adds it.
4. **A section per item**, under its `name` — what it is for, how it behaves,
   the decisions behind it, whose numbers they are. The numbers stay in the
   roster.
5. **Adding one** — the steps, and the checks that will hold the new item.

A doc may add a section for a rule its items share: `entities/challenges.md`'s
**Points**, which also holds the attributes the points buy (D110 (challenges)).

They describe what is in the game. An idea for an enemy or a mod goes to
`ideas.md`, and moves here when it is built.

## How an item moves

```
ideas.md ──decided──> decisions.md ──┬─> foundations.md   (if it is a rule)
                                     └─> plan.md          (if it is work)
                                              │
                                        roadmap.md        (next, inside the stage)
                                              │
                                           built
                                              ▼
                         design.md  +  entities/  +  the commit
```

An answered question leaves `ideas.md` in the same step as its decision is
written: the decision is its record. A declined idea stays, under Declined,
with the reason — so it is not proposed again.
