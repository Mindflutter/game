---
name: sonar
description: Use whenever an Abyss change needs Igor's real play — a feel, a balance verdict, a fight, a stretch of a dive or a whole career — to set up a Sonar play-test for him before he plays; and whenever a play-test has been played, to read it back, draw its moments, conclude, and answer Igor's questions about a play.
---

# Sonar: play-tests set up, played, read back

The design is `docs/specs/2026-10-28-sonar-design.md`. A play is recorded as
its input, and a replay rebuilds everything else: every fish at every tick,
every moment, a picture of any of them. Igor's side is one command and one
link; everything else is Claude's.

## Setting one up — whenever a change needs Igor's play

Proactively: a change that needs real play gets a play-test, not a bare
`?debug=` link. A play-test has a purpose, a start, a limit and measurable
results; there is no pass or fail — it carries the player's experience back.

Short beats long: one or two gates that bear a claim out or break it are
worth more than a whole dive, and Igor can play several in a sitting.

1. Pick an id: `<date>-<short-name>`, e.g. `2026-10-28-archer-hold`.
2. Add it to `tests/playtests.json`, a record under its id:
   - `purpose`: the one question the play answers, in plain words.
   - `start`: `{ "debug": "<code>" }` — a debug setup (`README.md` → Debug
     mode), driven in Node first to prove it shows the thing — or
     `{ "save": "fresh" }` for a career from New game, or `{ "save": <a
     save's object or text> }` for a career from a given state (the career
     bot in `tests/bot.js` can build one). Igor's own save is never touched.
   - `limit`: `{ "gates": n }`, `{ "secs": n }`, `{ "dives": n }`, or none.
     Size it to the question: the fewest gates that answer it.
   - `play`: what Igor does and looks at, the way he would say it.
   - `measures`: what the reading will look at — times, hits and by what,
     HP after a gate, deaths, pauses, a fish's behaviour at a moment.
3. Add it to `docs/playtests.md`: a line on the roadmap, unticked, and a
   section — the code, the limit, the **hypothesis** and what would break
   it, the measures. A kit already in its table is named, not copied.
4. Hand it over, in the reply:
   - `npm run play` (if it is not already running), then
     `http://localhost:8765/?sonar=<id>`.
   - What to do, what to watch, what counts as good or bad, how much to
     play; the corner tag says when the limit is met. Playing it again, or
     reloading, is a new play, kept apart and compared.
   - Igor does not take notes; he says "played" and anything he felt.

## Reading one back

1. `npm run sonar <id>` — replays every play, writes `report.md`,
   `events.jsonl` and `timeline.jsonl` beside the recording, and checks
   every probe. Off on the setup screen only, the dives hold; **off in
   play**, the reading is wrong past that tick: say so, never guess over it.
2. Read `report.md` first: the plays; a row a dive (time, layers, bosses,
   hits, guarded, HP lost, lowest HP, dashes with the presses too early for
   one and the dash's kills, lunges and boss hits, pauses); a row a
   gate; and the moments — pauses, menus, restarts, hits, deaths, buys,
   lunges, fans, a boss's stages, the window away, and any
   key held ten seconds (a lost key-up looks like that: check it against
   what Igor said before reading the dive as played).
   Then `events.jsonl` and `timeline.jsonl` with `grep`/`jq` for what the
   measures need; never dump them whole.
3. A moment's whole state: `npm run sonar <id> <play> <tick>`. A picture of
   it: open the moment's replay link (in the report) with Playwright and take
   a screenshot, or evaluate `canvas.toDataURL()` if that times out
   (`abyss-headless-chrome` memory). A series is the link at several ticks.
   Look at the deaths and the worst gates before concluding about them.
4. A measure the report does not print: a short Node script in the
   scratchpad, loading the build the way `tests/sonar.js` does and passing
   an `onTick(tick, frame)` to `sonarReplay`.
5. **Write the outcome into `docs/playtests.md` in the same response**:
   tick the play-test, and under its section the date, the numbers, Igor's
   words, and whether the hypothesis held or broke — the one home of what
   a play-test showed, so no session loses it. What it opens or settles
   goes to `ideas.md` or a decision, pointing there.
6. Conclude in the reply, briefly, in Igor's terms: what the play shows
   against the purpose, with the numbers. Weigh it against the other
   play-tests (`npm run sonar` lists them), the bot's numbers (`npm run
   measure`, `roadmap.md` → Health) and the docs; where they disagree, say
   which and why. One play is one human's dive, not a measurement: say how
   much it can carry. **A zero is checked before it is read**: a thing a
   play never did — no dash, no hit by a fish — is looked for in the input
   itself (the recording's `j` presses: was the key pressed at all?) and in
   the other plays, and is said as that play's, never the game's. *Missed:
   one gate without a press of Space was written up as "the dash is never
   used", while the other nine plays had dashed 31 times.* A hit at a
   guide line's edge — a ring, a wind-up's stroke — is the player learning
   the fish, not the game misleading: guide lines may go with real art
   (D166 (the puffer's burst stays; guide lines are no promise)).
7. Decide what changes, by the working rules: what is Igor's call is asked
   (one question), what is a balance number is Claude's pick and marked so.
   Findings go to the docs that own them (`ideas.md`, `bugs.md`, a
   decision), never only to the chat; the raw data stays in `logs/`.
8. **A play-test the reading calls for is set up in the same response**,
   unasked — a question a play can answer is never only proposed. Igor,
   2026-10-30: "if you come up with new playtests that will contribute to
   better understanding, setup them immediately". A play-test played again
   needs no new record: its next play is kept apart and compared.

## Answering questions about a play

Igor may ask what happened at a moment, why a dive went as it did, or what a
play-test was for. Find the moment in `events.jsonl`, read its state at the
tick, draw it, and answer from what the replay shows, citing the tick and
the replay link so he can look himself.
