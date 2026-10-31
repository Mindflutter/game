---
name: igor-said
description: Use when a session lacks what Igor said about a subject — a lean, a reason, an answer the docs only paraphrase or never caught, his words on a mechanic, a past correction — to search his own messages in this project's past sessions and bring in what fits. Also when Igor asks "what did I say about X", or says he does not remember something.
---

# What Igor said

The docs hold what was settled, with his words where a decision needed them.
What they lose: a lean never recorded, the question an answer was given to,
a word the docs strengthened or softened. Every past session of this project
is on disk; this skill searches his typed messages in them.

```bash
node .claude/skills/igor-said/search.mjs "<regex>" [--before] [--max N]
```

Case-insensitive, oldest first, the last 40 unless `--max` says otherwise.
`--before` adds the end of the reply each message answered — needed when
he answered with "ok" or "yes", or chose from options. Only his typed words:
tool results, system reminders, pasted text, subagents and compaction
summaries are skipped.

## When

- The docs do not say why, or say it in Claude's words, and it matters to
  the answer — before asking Igor something he may have said already
  (`working.md` → never re-ask a settled answer).
- An idea's origin is unclear, or Igor does not remember it.
- A term, a feel or a preference he named once that no doc caught.

Not for what the docs settle: a decision, a rule, a number. Docs outrank
the history — what he said before a decision is superseded by it.

## Bringing it in — only if it fits

- **Search narrow first**: a phrase or two words of his, not a whole topic.
  Grep the output (`| grep -i -A3 <word>`), never dump hundreds of messages
  into the context.
- **Fits** means: on the subject, not superseded by a later message or a
  decision, and changing the answer. Anything else is left out, unsaid.
- **Quote him exactly, dated**, as the docs do — his words keep their
  strength (`working.md` → Questions and uncertainty). A lean found in the
  history is still a lean.
- **Something worth keeping** — an unrecorded lean, a reason a decision
  lacks — goes where it belongs (`ideas.md`, the decision's doc), said so
  in the reply. A decision entry is never edited for it: decisions are a log.
- The current session is searched too; a message from it is already in
  context.
