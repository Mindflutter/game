# Sonar — the play-test system: the design

S10 (Sonar), opened 2026-10-28 beside S9 (the balance rework) on Igor's word —
"i'd say its own stage". The requirements are the brief's
(`specs/2026-10-28-sonar-brief.md`), verbatim; this is how they are met. Igor,
as it was designed: "if any server or additional setup would help with sonar,
please do that. i only need clear cli commands to launch it".

## The idea: record the input, replay the rest

The game is deterministic: fixed ticks (D53 (fixed timestep)), one seeded RNG
(D41 (seeded RNG)), and a dive that is plain data (D70 (a dive can be saved at
any point)). So a play is fully described by **what the player fed in** — the
three names the seam reads, `keys`, `justPressed` and `aim`, frame by frame,
and the seed each new dive draws. Everything else — every fish's position and
HP at every tick, every kill, hit and pause, a picture of any moment — is
rebuilt afterwards by replaying it. Recording costs the play nothing, and
nothing has to be guessed in advance about what is worth recording: Igor's
"gather everything possible" is met by construction.

A replay is only exact on the build it was recorded on, so the server copies
the served files — `index.html`, `main.js`, `checks.js`, `game/`,
`platform/` — beside the recording when the play-test opens. Uncommitted work
is the usual case when Igor plays (`working.md` → Commits), so a commit hash
would not do.

## The parts

**A play-test** — a record of `tests/playtests.json`, under its id, written by Claude:

```json
{ "id": "2026-10-28-archer", "purpose": "...", "start": { "debug": "L1,G3,S4471,archer4" },
  "limit": { "gates": 3 }, "play": "...what to do and look at...", "measures": ["..."] }
```

- `start`: `{ "debug": "<code>" }` — the debug mode's setup (D102 (the debug
  mode)) — or `{ "save": "fresh" }`, or `{ "save": <a save's text> }` for a
  career from a given state. A play-test never reads or writes Igor's own
  save: a save start keeps its own slot, `abyss-sonar-<id>`, so a reload
  carries on where it was.
- `limit`: `{ "gates": n }` cleared, `{ "secs": n }` of play, `{ "dives": n }`
  ended, or none. Reaching it **changes nothing in the game** — the corner tag
  says done; a game state the platform set would not replay. There is no pass
  or fail (Igor: "it's a way to communicate real player experience to you").
- `play` and `measures`: prose — what Igor does, and what the reading looks at.

**The server** — `npm run play`, the same one command (D163 (the career
log)). `http://localhost:8765/?sonar=<id>` serves the game with the
play-test written into the page, copies the build, and takes the recording
as it comes, every two seconds and as the page closes. Every page load is a
**segment**, `<n>/input.jsonl` with its build beside it, starting from its
own state: a reload, Igor starting over, is recorded as one. Under a
play-test the career log is not sent: the segments hold all of it.

**The recorder** — `platform/sonar.js`, inert without a play-test, so a
double-clicked `index.html` is unchanged. A segment's first line is its
start; then a line a frame that ran a tick: the ticks it ran, its wall-clock
milliseconds, the aim, and the keys and presses when they changed, the seeds
it drew, the window going hidden or out of focus — and once a second a probe,
a few numbers of the state, so a replay that has gone off its recording says
so at the tick it did. The corner tag — `SONAR <id> · 2/3 gates` — tells Igor
it is recording and when the limit is met.

**The reading** — `npm run sonar <id>`: replays every segment in Node from
its copied build, checks the probes, and writes beside the recording:

- `report.md` — the play-test, then each segment: wall time, time on each
  screen, and whether its replay holds, every probe checked; a row a dive
  (its time, each layer's, the bosses', hits, guarded, HP lost, the lowest
  HP, the dashes, the presses too early and the dash's kills, the lunges and
  the boss hits, pauses); a row a gate (fish, time, hits and by what, guarded, HP,
  kills, shots, dashes, boosts, mods); every pause, restart, buy and key
  held ten seconds; and replay links for the moments that matter.
- `events.jsonl` — every moment, at its tick, game time and wall time: a
  screen changed (pause, resume, a menu, death, the win, the pick, a debug
  restart), a gate arrived or cleared, a kill (the fish and grade, and
  whether the dash dealt it), a dash or a press too early for one, a hit
  taken (by what, HP after, the puffers swelling), a fish's attack as it
  starts (a lunge, a fan, a puffer's fuse, a boss's stage), a mod, a boost,
  a buy, the window away and back.
- `timeline.jsonl` — the state each second: the diver, every fish (name,
  grade, HP, place), the camera, the batch, the gems.

`npm run sonar <id> <seg> <tick>` prints the whole state at one tick, for a
question about a moment. **A screenshot of any moment** is the replay drawn
in the browser:
`http://localhost:8765/logs/<id>/<seg>/build/index.html?replay&at=<tick>`
— the copied build, so it draws what Igor saw. Igor can open one too.
`npm run sonar` alone lists the play-tests.

**The skill** — `.claude/skills/sonar/`: a skill, not an agent (Igor: "your
way") — it runs in the session that has the docs and the code in hand, and
subagents are only Igor's call (`working.md` → Skills and plugins). It holds
both halves Igor asked for: **setting a play-test up** — a purpose, the
start, the limit, what to do, what is measured, the link, given whenever a
change needs Igor's play — and **reading one back** — the report, the moments
drawn, conclusions weighed against the other play-tests, the bot's numbers
(D128 (the balance suite)) and the docs, and answering Igor's questions about
a play.

## Claude's picks, open to Igor

- The plays in `logs/<id>/`, ignored by git like the career log and safe to
  delete; the setups in one committed file (D165 (play-tests in one file)).
  What a reading concludes goes to the docs, where it is kept.
- Pictures are drawn on replay, never taken during play: free to the play,
  and any moment, after the fact.
- A probe each second; segments sent every two seconds.

## Failure cases, each pinned by a check

- A frame that ran no tick still keeps its presses for the next frame
  (`justPressed` is cleared only by `update()`): a replay feeds it there.
- A frame that ran several ticks gives its presses to the first alone.
- A dive's seed is drawn at random: recorded as drawn, fed back in order.
- The Node replay and the browser disagreeing (two engines' maths), or the
  build copied wrong: the probes name the first tick off.
- A reload mid-dive: a new segment from the slot's saved text.
- The platform touching game state outside the inputs: the limit only draws.
- A draw changing game state, which a replay never draws: the debug screen's
  line reseeded the randomness every frame, and now puts it back.

## Against foundations and the plan

- **The seam** stays at seven names: `game/` is untouched; the recorder
  reads the seam's own input names from `platform/`.
- **Technical contract**: no runtime dependency, `index.html` still
  double-clickable, the save never touched (D70 (a dive can be saved at any
  point), D102 (the debug mode)), and every check counted.
- **Genre contract and pillars**: nothing interrupts combat and no fail state
  is added — the limit only draws a tag; `home` stays relaxed.
- **Glossary**: Sonar is tooling, not gameplay, and adds no term to it;
  "play-test" in prose, never bare "test", which is the browser suite's
  `?test`.
- **The career log** (D163 (the career log)): a play-test from a save is a
  logged career with everything else besides. Proposed to Igor, once Sonar
  has carried a career: retire `meta.log` and `career.json`, the story in the
  save with them.
- **The plan**: S10 (Sonar) is opened beside S9 (the balance rework), which
  stays active; S9's next steps are read through Sonar.
- **The working rules**: "a change that needs Igor's play comes with its
  `?debug=` link" becomes: with a play-test link.
