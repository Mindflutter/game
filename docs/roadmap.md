# Roadmap

Near-term work **inside the active stage**, plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`. This doc owns *this week*, not the future.

---

## Next

S5 (content) closed 2026-10-14 (`plan.md`): the archer, the puffer and the eel,
the Harpoon and the Knife, three pieces of equipment, Heart and Strength, swift
and footwork, Barbs and three boosts, three layers (D93–D103), built to the
`abyss-content` skill and `specs/2026-10-13-s5-content-design.md`; then, from
Igor playing it, the debug mode (root `README.md` → Debug mode) and New game.
Every design call in it is Claude's, delegated, and open. **Next**, before
S6 (balance), the notes from playing S5 (content) that move the numbers it
tunes — Igor, 2026-10-14: "if no questions for me, start working". Done: the
status bar, the two wordings, the sizes (D104 (bodies doubled)) and the Knife's
swing (D105 (the Knife swings)), the puffer that comes on again (D106 (the
puffer bursts and comes on again)), the swim and the facing (D107 (the diver
swims and faces; fish with a ramp)), fish that bite (D108 (fish bite)),
challenges as ladders (D109 (micro-tasks are ladders; steps cost more as they
rise), D110 (challenges)), the shorter dash (D111 (the dash a third
shorter)) and weapons and equipment on screens of their own (D114 (weapons and
equipment on screens of their own)), batches arriving in waves (D115
(batches arrive in waves)) and escorts for the boss and the mini-boss — the
boss's a crowd that keeps coming until it dies (D116 (bosses bring escorts)).
Next: the boss and the mini-boss made different in what they do (`plan.md` →
Active stage) — both still lunge alone, and more attacks wait in `ideas.md` →
Open — from the boss (S3); enemy grades are proposed for this pass too, Igor
to confirm (`ideas.md` → Pace). Each is discussed one at a time.

Still open to Igor's feel: the four current numbers (`GATE_SPACING`,
`CURRENT_SPEED`, `CURRENT_CRAWL`, `CURRENT_EASE`), the lunge's and the boss's
haul (`entities/enemies.md`), S4's — the Gun's prices and tier step
(`entities/weapons.md`), `GEM_PULL` (`design.md`) — the
mods rework's: the layer end's bigger step (`design.md`), `Mend` as the layer
end's own (`entities/mods.md`), the boost chance, a boost's life on the floor
and `Rush` (`entities/boosts.md`) — and S5 (content)'s: every number of the
archer, the puffer and the eel (`entities/enemies.md`), of the Harpoon and the
Knife (`entities/weapons.md`), of the three pieces of equipment
(`entities/equipment.md`), of Barbs and the three boosts (`design.md`), and
the layers' pools — and this pass's: every challenge's rungs, what a rung pays,
what a step costs and what each attribute's step adds
(`entities/challenges.md`), and the dash's 99px (D111) — all Claude's picks.
The
scenarios that start next to each — one fish of each kind, every ordinary type
in a row, a weapon carried from the top, the second and third layers with a
kit — are in the root `README.md` → Scenarios.

Deliberately not yet: balance fine-tuning — Igor, closing S3: "i suggest we
leave all balance fine-tuning for later"; S6 — Balance owns it, the threat
system for enemies included (Igor, 2026-09-30: "is it part of balance? yes").
A lively background (post-alpha, in `ideas.md`).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.
**Each bot figure below names the build it was measured on**, and those from
before D104 (bodies doubled) — the diver and the fish twice the radius since —
are a regression signal for their build only. S6 (balance) measures afresh.

- All `?test` checks passing, and `npm test` green (count in `design.md` →
  Verification).
- **Difficulty, from Igor playing it, 2026-09-27: batches are too easy.**
  "nothing breaks the target, currently batches are very easy to complete."
  This is the number that counts, and the direction is that batches must get
  **harder**. **2026-09-29, the boss: "right now it's very easy for me."**
  Tuning is left for later, per Igor — S6 (balance) owns it.
- **Time to clear a batch**, bot, 5 seeds (1, 7, 42, 4471, 90210), 8 batches
  each, after D49: mean 16.1s, range 3.4–99.7s, 35 clears, the long tail all in
  the two bulwark batches. **Do not read this as difficulty** (D50). The bot
  kites and never commits, so against 6hp it measures its own policy, not the
  batch; Igor clears the same batches easily. These figures are a **regression
  signal** — comparable to themselves across builds and seeds, and silent on
  whether a human is challenged.
- **Simulation rate**: `FIXED_DT` 1/120 since D53, banked by the frame loop.
  Doubling the tick rate costs ~1.1ms of a 16.7ms frame at the 500-entity
  budget, from D43's 0.55ms measurement of `update()`.
- **The bot is blind to the dash.** `kiteAndShoot` never presses Space, so
  D51's change (dash damage now bought, not free) moved its clear times by
  exactly zero. A bot only measures the mechanics it uses.
- **Bot survival: the mortal bot dies on every seed.** Seeds 1, 7, 42, 4471,
  90210: on the pre-S2 commit (`04fac4c`) after 3, 7, 3, 3 and 3 clears — most
  likely since D54's hp-sized batches; on the S2 build after 3, 3, 5, 5 and 3;
  on the S3 build after 4, 3, 4, 6 and 3 — seed 1 does not die but sits at the
  first mini-boss until the 1800s cap (the boss fight, below). The S4 figures
  are the meta loop's, below. Not a difficulty reading (D50) — Igor still
  finds batches easy — but it means **the mortal bot cannot reach the bottom**.
- **Time to traverse one layer** — S2 and S3 figures, **not re-measured on the
  S4 build**, where a dive is two layers drawn from pools (S2 DoD, D58), immortal bot — `diveReport(seed,
  Infinity, 1800, true)`, 5 seeds. On the S2 build all reached the bottom:
  307.6 / 815.0 / 434.5 / 409.0 / 412.4s, mean 475.7s (7.9 min). **On the S3
  build: 1800 (the cap — seed 1 never kills the first mini-boss) / 1180.7 /
  1183.6 / 820.4 / 763.2s.** That jump is the bot, not the layer: against a
  lone slow enemy it backs out of its own range (the boss fight, below). Igor
  clears batches far faster, so a human layer is likely well under the 4–8 min
  pillar — which is S6's problem.
- **Difficulty is invariant to window size, with the camera** (D29, D58): seed
  4471 reaches the bottom of the dive — three layers — in the same time at 1280×800,
  1920×1080 and 3440×1440 alike (stationary, invulnerable, aiming at the first
  fish), driven through real mouse events aimed on a 20px grid that all three
  scales put on whole pixels — measured 2026-10-18, with escorts (D116
  (bosses bring escorts)): 1035.55s at all three. The `?test` check requires the three to be identical; dropping the
  input's `/ scale` leaves the two larger windows short of the bottom. With
  waves, before escorts, 1010.34s on 2026-10-17; with bites, before waves,
  844.46s on 2026-10-14. Before
  bites the aim went to the nearest whole pixel and the check allowed 2%:
  811.02 / 809.82 / 802.58s on 2026-10-13; on the build with mods from drops,
  two layers, 562.24s at all three; on the S3 build, one layer, 296.34s; on the
  S2 layer, dropping `/ scale` failed it at 217.03 / 228.71 / 227.51.
- **The boss fight** (S3 DoD, D63), at the starting kit — no gear, no mods —
  from `last-batch`, seeds 1, 7, 42, 4471, 90210, timed from the scenario's
  start, 300s cap; re-measured 2026-10-18 with escorts (D116 (bosses bring
  escorts)) and, for comparison, on the build just before them (`480c4f5`).
  Mortal: **0 of 5 won** either way; with the crowd it dies after 13.5 / 8.3 /
  18.3 / 35.3 / 8.9s, before it after 26.4 / 22.0 / 25.4 / 21.9 / 25.2s.
  Immortal, it kills the boss in 156.1 / 174.2 / 110.5 / 135.7 / 183.4s, before
  in 78.8 / 66.1 / 76.0 / 66.0 / 69.5s: the bot shoots the nearest fish, and
  the crowd keeps one nearer than the boss. **The mini-boss**, from
  `mini-boss`: 0 of 5 won with escorts, dying after 102.4 / 70.3 / 18.7 / 61.9
  / 82.4s; before, 0 of 5, dying after 58.3 / 111.8 / 68.2 / 49.0s and seed
  4471 alive at the cap. Immortal, 103.6 / 86.7 / cap / 116.6 / 101.3s, before
  90.4 / 144.0 / 104.2 / cap / 81.3s. The plan draws the escorts, so a seed's
  dive differs between the two builds. **Why the lone fights were slow**:
  against a lone slow enemy the kiting bot holds it inside its own 250px range
  1% (seed 7) to 18% (seed 4471) of the time — it backs out of range, so its
  shots never land, and backs straight along the lunge's line, so the charges
  do (measured 2026-10-13). A measure of the bot's policy, not of the boss
  (D50); Igor's playthrough decides whether the layer is winnable.
- **The meta loop** (S4 DoD), re-measured 2026-10-18 on the build with escorts
  (D116 (bosses bring escorts)) — mortal bot, seeds 1, 7, 42, 4471, 90210,
  from the top, each a whole dive or 1800s of one — and, for comparison, on the
  build just before them, with waves (D115 (batches arrive in waves)):

  | | gates cleared | gems | mean gates | mean gems |
  |---|---|---|---|---|
  | starting gun | 4 / 9 / 9 / 4 / 4 | 72 / 169 / 207 / 72 / 70 | 6.0 | 118.0 |
  | gun tier 1 | 4 / 5 / 4 / 4 / 4 | 72 / 72 / 80 / 72 / 70 | 4.2 | 73.2 |
  | starting gun, before escorts | 4 / 4 / 4 / 4 / 4 | 56 / 54 / 62 / 58 / 54 | 4.0 | 56.8 |
  | gun tier 1, before escorts | 4 / 4 / 4 / 4 / 9 | 56 / 54 / 62 / 58 / 145 | 5.0 | 75.0 |

  **Seven dives of ten die at the fifth gate, the first mini-boss**; before
  escorts, nine — the mini-boss alone was a lunger the kiting bot could not
  kill (the boss fight, above). Its escorts keep the bot fighting near it, and
  two dives get past it to the second; they pay gems too, which is most of the
  rise. So the table measures the bot against the mini-boss more than the
  batches or the gun: "measurably stronger" (S4 DoD) does not show at all on
  this build. On
  2026-10-13, before the swim and bites (D107, D108), the same seeds cleared
  3.2 and 8.0 gates on average, getting past it. **Dives to the first
  purchase: 1** (target ≤ 3) — every seed banks more than the first tier's 40.
  **Layer 2**, from `layer-2` (a kit of fifteen mods, the starting gun): dies
  after 4 / 6 / 4 / 4 / 4 clears, banking 96–138 gems; before escorts at its
  first mini-boss after 4 on every seed, banking 80–84. **Layer 3**, from
  `layer-3` (sixteen mods): dies after 1 / 3 / 3 / 0 / 1 clears, banking
  27–106; before escorts 2 / 2 / 1 / 1 / 2, banking 36–70. **Waves make the bot's fights easier, not harder**: with today's batch
  sizes they put fewer fish on screen at once than a batch arriving whole did,
  which is what layer 3 and seed 1 show. The bot never seeks a boost (D86) —
  it takes one only by swimming over it — so these figures are a floor. Bot
  policy as ever (D50): Igor finds batches easy.
- **Per weapon** (S5 (content), D97), mortal bot from the top through the
  `harpoon` and `knife` scenarios, seeds as above: the **Harpoon** clears 0 / 3
  / 0 / 0 / 1 gates, the **Knife** 2 at every seed — the Knife as a short
  shot, before D105 (the Knife swings). A floor that says more about the bot
  than the weapons: it backs away from the nearest fish, so a melee weapon
  lands only on what reaches it, and a shot a second and a bit is
  overkill on the one-hit swarm the bot aims at first. S6 (balance) measures
  per weapon (`plan.md` → S6) and needs a bot that closes in for the Knife.
- **Arrival timing** (D55): from a batch spawning, the first enemy reaches a
  centred player in 2.04s at the earliest, 3.21s on average. Edged, 0.27s;
  cornered, 0.22s. This is what killed the `Lull` mod and what Igor's
  "fish from behind the screen" idea would change.
- **The dash build, measured 2026-09-27** on the 141px dash — before D111 (the
  dash a third shorter) made it 99px, so both tables are a regression signal
  for that build only (D54 batches, batch 8 — 32 enemies, all 1hp — after 3s
  of closing in; the gun kills 2.5/s, single target):

  | build | killed per dash | kills/s | vs the gun |
  |---|---|---|---|
  | Impact ×1 | 7.0 | 3.2 | 1.3x |
  | Impact ×3 | 7.0 | 3.2 | 1.3x |
  | Impact ×1 + Fins ×10 | 6.3 | 2.9 | 1.2x |
  | Impact ×1 + Reflex ×3 | 6.7 | 6.7 | 2.7x |

  And what the dash buys defensively — invulnerable travel per second, and the
  share of the time you are untouchable:

  | build | dash px | cooldown | invuln px/s | invuln uptime |
  |---|---|---|---|---|
  | base | 141 | 2.2s | 64 | 14% |
  | Fins ×10 | 141 | 2.2s | 64 | 14% |
  | Reflex ×3 | 141 | 1.0s | 141 | 31% |
  | Fins ×10 + Reflex ×3 | 141 | 1.0s | 141 | 31% |

  Dash reach does not ride on `player.speed` (D56), so `Reflex` is the only
  mod that raises escape power, and it caps at 3. **The Fins ×10 rows cannot be
  reached** — every mod caps at 3 (D69 (every mod capped)) — and stay as
  measured, as the proof that `Fins` does not feed the dash. The Dash reach
  attribute (D75) is not measured in these tables.

  Caveat as ever: the probe dashes once from a standstill in a fixed direction,
  so it cannot see a human lining the dash up along a crowd. It is a weak
  instrument on the same axis the bot is (D50). Analysis in `ideas.md` → the
  dash economy.
- Open bugs are `bugs.md`'s.
- `index.html` over `file://` is **unverified by Claude** — Playwright refuses
  `file://` URLs, so everything has been tested over `http://localhost`. Igor
  should confirm double-click still works. Low risk, never actually run.
