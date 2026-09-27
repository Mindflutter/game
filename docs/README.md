# Abyss — working docs

Shared reference for Igor and Claude, **tracked in git** since 2026-09-27
(D40 — Docs are tracked). They hold the whole game design, so they are versioned
and backed up like the code — and a change to them belongs in the same commit as
the code it describes.

> **Start with `foundations.md`. Every session, before anything else.**
> If you are reading this file hoping for the entry point: it is that one.

## Which file for what

| File | Holds | Rule |
|---|---|---|
| `foundations.md` | The layer that does not change before alpha: the binding glossary, the genre contract, the pillars as checkable statements, the technical contract, the non-goals | **Read first.** Changing it is a decision — it gets a `decisions.md` entry in the same step, never a quiet edit. |
| `plan.md` | Stages S0–S7, their entry conditions and definitions of done | **The only file that says "we are here."** A stage does not start with an unmet entry condition. |
| `high level design.md` | Igor's source description of the whole game | Frozen input, not a working doc. Its `(?)` markers are tracked in `ideas.md`. |
| `roadmap.md` | Near-term work *inside* the active stage, plus build health | Owns the measured bot figures, and nothing else quotes them. |
| `decisions.md` | What we decided and **why**, including what we rejected | Append-only. Never silently reverse an entry — add one that supersedes it. **D1–D26 describe the closed prototype; see the warning at the top.** |
| `ideas.md` | Wishes, proposals, parked questions, declined items | The inbox. Anything undecided goes here. Nothing here is committed to. |
| `design.md` | How the code works **today** | Describes the present, never the plan. It currently lags the design — the code is still the prototype. |
| `changelog.md` | Dated record of what actually shipped | Newest first. It cites commits, so re-check it after a squash or rebase. |

## How an item moves

```
ideas.md ──decided──> decisions.md ──┬─> foundations.md   (if it is a rule)
                                     └─> plan.md          (if it is work)
                                              │
                                        roadmap.md        (next, inside the stage)
                                              │
                                           built
                                              ▼
                                  design.md  +  changelog.md
```

A rejected idea stays in `ideas.md` marked **declined**, with the reason.
Deleting it loses the fact that we already thought about it — which is exactly
the context these docs exist to preserve.

## Two rules that keep this from rotting

1. **Docs update with the change, in the same step.** Not as a cleanup pass.
   Updating means grepping for what the change made **false** and fixing that
   *before* appending anything new. Docs that contradict themselves are worse
   than no docs.
2. **Every measured number lives in exactly one file**, cited from the others.
   Every stale figure ever found here was a copy.

## Vocabulary

Binding (D32). In docs **and** in code identifiers: `layer`, `dive`, `rank`,
`mod`, `gear`, `tier`, `batch`, `wave`, `gate`, `home`, `attribute`,
`micro-task`, `prototype`. Never "level" or "upgrade" — each meant two different
things in the source draft, which is why both are banned. Full table in
`foundations.md`.
