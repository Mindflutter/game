# Abyss — working docs

Shared reference for Igor and Claude, tracked in git (D40 (docs are tracked)).
A change to them belongs in the same commit as the code it describes.

> **Start with `foundations.md`, then `plan.md`. Every session.**
> Everything else is looked up by question, below — not read front to back.

## Where to look

| To find | Open |
|---|---|
| What a word means; what must stay true until alpha | `foundations.md` |
| Which stage we are in, and what each stage must deliver | `plan.md` |
| The next steps inside the stage, and the measured bot figures | `roadmap.md` |
| How the code works — systems, screens, the save, the tests | `design.md` |
| An enemy: its numbers, role and behaviour | `entities/enemies.md` |
| A mod, or a card that fills in for one | `entities/mods.md` |
| A weapon: its numbers and tiers | `entities/weapons.md` |
| A piece of equipment | `entities/equipment.md` |
| Why something was decided, and what was rejected | `decisions.md` |
| Anything undecided: open questions, parked and declined ideas | `ideas.md` |
| What shipped, and when | `changelog.md` |
| Igor's description of the whole game | `high level design.md` |
| The design and plan of a past stage | `superpowers/` |

`decisions.md` is long. Find an entry by its heading — `grep '^## D'
docs/decisions.md` lists them all — and read that one. D1–D26 describe the
closed prototype, an auto-shooter; the warning at the top of the file says
which of them still hold.

## Living docs and logs

**Living docs** say what is true now, and are edited in place: `foundations.md`,
`plan.md`, `roadmap.md`, `design.md`, `entities/` and `ideas.md`. They carry no
history — no "used to", no struck-through items, no answered questions. When
something stops being true it is rewritten or deleted, and what happened goes
to a log.

**Logs** record what happened, and are only ever appended to: `decisions.md`,
`changelog.md` and `superpowers/`. To reverse a decision, add one that
supersedes it. `high level design.md` is neither — Igor's frozen input, never
edited.

## One home per fact

Every fact has one doc that owns it, and the others link there. A copy is a
fact that will disagree with itself: every stale figure ever found here was a
copy.

| Fact | Its home |
|---|---|
| A term | `foundations.md` → the glossary |
| Which stage is active, and what is next | `plan.md` |
| An entity's numbers, role and behaviour | its doc in `entities/` |
| How a system works — the gate, the descent, the offer, the save | `design.md` |
| Measured bot figures | `roadmap.md` → Health |
| The check count | `design.md` → Verification |
| Line counts and the platform share | `design.md` → Files |
| A decision's reasons | its entry in `decisions.md` |

## What keeps them true

`npm test` checks the docs as well as the game (`tests/docs.test.js`):

- each entity doc's tables match `game/content.js` — every item, every number,
  every card text — and every field of a record is documented, every item has
  its section;
- every `` `NAME value` `` a doc quotes is the constant's real value, and no
  doc that describes the code names a constant the code has lost;
- `design.md`'s list of the diver's starting numbers is complete and true, and
  so are its line counts and platform share;
- the root `README.md` lists every scenario;
- decisions are named, numbered without gaps, cited only if they exist, and the
  newest has a changelog entry;
- this map names every doc, and every doc it — or `CLAUDE.md` — names exists.

What no check can see is whether prose is still true. That is the consistency
sweep's job (`CLAUDE.md` → Working agreement).

## The entity docs

One doc per kind of entity, in `entities/`, all in the same layout (D81
(entity docs, one per kind)):

1. **What it is** — a few lines: the glossary's term, the table it mirrors in
   `game/content.js`, where the mechanism around it is described.
2. **Roster** — one row per item, with every number. The docs check rebuilds it
   from the code, so a wrong number fails `npm test` and the diff shows the
   right table.
3. **Fields** — the record's shape: each field, its unit, what it means.
   A field the code does not have yet is marked **Reserved**, with the stage
   that adds it.
4. **A section per item**, under its `name` — what it is for, how it behaves,
   the decisions behind it, whose numbers they are. The numbers stay in the
   roster.
5. **Adding one** — the steps, and the checks that will hold the new item.

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
                         design.md  +  entities/  +  changelog.md
```

An answered question leaves `ideas.md` in the same step as its decision is
written: the decision is its record. A declined idea stays, under Declined,
with the reason — so it is not proposed again.
