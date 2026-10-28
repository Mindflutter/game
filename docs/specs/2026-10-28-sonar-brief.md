# Sonar — the play-test system: the brief

Igor, 2026-10-28, after the first logged career (D163 (the career log)): "this
is a good thing to approach balance and more … develop a real-player debug
system that would boost the game development in terms of rapid real player
playthrough data analysis." Name: **Sonar** — a ping out, the echo read back.
This is the brief for the session that designs it; nothing here is decided
past Igor's words.

## Igor's requirements, verbatim

- "quick setup. combine debug mode and this idea. a portion of game is set up
  like in debug - all params are set, batches to play, or a time limit of
  testing certain things. a check runs on these params"
- "gather everything possible - time, kills, exact moments, state of entities
  at each point, take screenshots or series of them if possible, any raw data
  that would contribute to real play analysis"
- "take pauses into account and other menu actions too. like starting over"
- "an agent or a skill that knows how to read raw data, process it and make
  conclusions and decisions based on that. also if necessary, be able to ask
  questions about a certain play, what was tested, interpret the results."
- "same or different agent or skill that gathers the debug setup for a player
  (me), so that the testplay clearly has a purpose, input params and
  measurable results"
- "any time a real play is required, proactively setup this system for the
  player."
- In short: set a play-test up, let it be played smoothly, gather and log
  every metric, then change the game fast — weighing other play-tests and
  other aspects of the game where they conflict.

## What exists

- `npm run play` serves the game at `http://localhost:8765/` and writes
  `logs/career.json` (a dive a line: kit, `bought`, `story` a gate a record)
  and `logs/clock.txt` (D163 (the career log)). The first career's analysis
  is `ideas.md` → The economy and the fights, reworked in S9.
- The debug mode (D102 (the debug mode)): a setup in the address bar —
  layer, gate, seed, grade, gear, mods, fish — replayable; it never touches
  the save.
- The diver bot and `npm run measure` (D128 (the balance suite)) measure the
  same things on a bot; Sonar's numbers should sit beside them.

## Igor's answers, 2026-10-28

- **Where raw data lives**: "repo dir, structure it yourself". Not the save,
  which must stay byte-identical on replay (D70 (the dive, as data)).
- **What a play-test records**: "everything, by the spec and requirements i
  provided. there's no strict pass or fail, it's a way to communicate real
  player experience to you". A test has a purpose and measurable results,
  read by Claude — not a gate the play passes.
- **Agent or skill**: "your way, the most optimized and convenient for you".
  Claude's pick, made in the design.
- **Its own stage**: "i'd say its own stage" — the next stage after S9 (the
  balance rework), or opened beside it; `plan.md` takes it as it opens.
