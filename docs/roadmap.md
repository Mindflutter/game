# Roadmap

Near-term work **inside the active stage**, plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`. This doc no longer owns the future — it owns *this week*.

---

## Superseded, 2026-09-26

Everything this doc used to say about phases is gone, not archived. The
"finished standalone" question that blocked it since 2026-09-08 **is void**:
`high level design.md` replaced the standalone with a full roguelite, so the
four options in `ideas.md` are answering a question nobody is asking any more.
D27–D32 record what replaced them.

The old Phase 1–4 list is superseded by `plan.md` → S0–S7. The old "Phase 4 —
roguelite, its own brainstorm when the time comes" is the brainstorm that
happened.

## Next

S2 — The dive: camera and descent closed 2026-09-28 (`plan.md`). Nothing is
queued: **S3 — One boss, one complete layer** is next, and opening it is
Igor's call. When S3 closes, the layer-to-layer design pass (D60) comes before
S4.

Still open to Igor's feel: the four current numbers (`GATE_SPACING`,
`CURRENT_SPEED`, `CURRENT_CRAWL`, `CURRENT_EASE`), all Claude's picks.
`?dev=last-batch&play` jumps to the end of a layer.

Not in S2, deliberately: the boss and layer completion (S3), anything to do
with `home` or spending currency (S4), a lively background (post-alpha, in
`ideas.md`), and the layer-to-layer logic — Igor: "we must work thru
layer-to-layer logic in detail out of s2"; it gets a design pass of its own
after S3 (D60, `plan.md`), with the questions in `ideas.md` → the layer end.

## Standing constraints

Now in `foundations.md` → The technical contract, and not duplicated here.
Two changes worth flagging since they reverse what this section used to say:
dependencies are *permitted* but declined on measurement grounds (D30), and
the arena stopped being fixed at S2 (D29, D58).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.

- All `?test` checks passing, and `npm test` green (count in `design.md` →
  Verification).
- **Difficulty, from Igor playing it, 2026-09-27: batches are too easy.**
  "nothing breaks the target, currently batches are very easy to complete."
  This is the number that counts, and the direction is that batches must get
  **harder**.
- **Time to clear a batch**, bot, 5 seeds (1, 7, 42, 4471, 90210), 8 batches
  each, after D49: mean 16.1s, range 3.4–99.7s, 35 clears, the long tail all in
  the two bulwark batches. **Do not read this as difficulty** (D50). The bot
  kites and never commits, so against 6hp it measures its own policy, not the
  batch; Igor clears the same batches easily. These figures are a **regression
  signal** — comparable to themselves across builds and seeds, and silent on
  whether a human is challenged.
- ~~**Bullet tunneling**~~ **fixed, D53.** It was measured at 9% of shots
  passing through a darter at the old 20fps `dt` cap. Bullets now sweep their
  path, so tunneling is impossible at any bullet speed — checked at 6000px/s,
  which is 50px per tick against a darter's 10px reach.
- **Simulation rate**: `FIXED_DT` 1/120 since D53, banked by the frame loop.
  Doubling the tick rate costs ~1.1ms of a 16.7ms frame at the 500-entity
  budget, from D43's 0.55ms measurement of `update()`.
- **The bot is blind to the dash.** `kiteAndShoot` never presses Space, so
  D51's change (dash damage now bought, not free) moved its clear times by
  exactly zero. A bot only measures the mechanics it uses.
- **Bot survival: it dies again — and did before S2.** Corrected 2026-09-28.
  This line used to say all five seeds finish eight batches; re-run on the
  pre-S2 commit (`04fac4c`) the mortal bot dies on every seed, after 3, 7, 3, 3
  and 3 clears (seeds 1, 7, 42, 4471, 90210). The claim went stale somewhere
  after D49, most likely with D54's hp-sized batches. On the S2 build it dies
  after 3, 3, 5, 5 and 3 clears. Not a difficulty reading (D50) — Igor still
  finds batches easy — but it means **the mortal bot cannot reach the bottom**.
- **Time to traverse one layer** (S2 DoD, D58), immortal bot — `diveReport(seed,
  Infinity, 1800, true)`, 5 seeds, all reach the bottom, with D58's current as
  reworked (400px gates, 200px/s, independent of the player) and no mods at
  the layer end (D59): **307.6 / 815.0 / 434.5 / 409.0 / 412.4s, mean 475.7s
  (7.9 min)**, of which ~30s is travel and the rest is fighting. At
  the top of the provisional 4–8 min pillar, but it is the kiting bot's clock
  (D50), not a player's; Igor clears batches far faster, so a human layer is
  likely well under 4 min — which is S6's problem, not S2's.
- The 38.7 / 37.8 / 36.6s survival figures (2026-09-19) are **gone, not stale**:
  they measured an auto-firing weapon with an XP curve, neither of which exists.
- **Difficulty is invariant to window size, with the camera** (D29, D58): seed
  4471 reaches the bottom of the layer in 217.03 / 217.03 / 217.03s at
  1280×800, 1920×1080 and 3440×1440 (stationary, immortal, aiming at the first
  enemy), driven through real mouse events. A `?test` check holds it within
  2%; dropping the input's `/ scale` fails it at 217.03 / 228.71 / 227.51.
- **Arrival timing** (D55): from a batch spawning, the first enemy reaches a
  centred player in 2.04s at the earliest, 3.21s on average. Edged, 0.27s;
  cornered, 0.22s. This is what killed the `Lull` mod and what Igor's
  "fish from behind the screen" idea would change.
- **The dash build, measured 2026-09-27** (D54 batches, batch 8 — 32 enemies,
  all 1hp — after 3s of closing in; the gun kills 2.5/s, single target):

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

  Dash reach is flat since D56 — it used to ride on `player.speed`, so the
  bottom row was 386px and 386 invulnerable px/s. `Reflex` is now the only mod
  that raises escape power, and it caps at 3.

  Caveat as ever: the probe dashes once from a standstill in a fixed direction,
  so it cannot see a human lining the dash up along a crowd. It is a weak
  instrument on the same axis the bot is (D50). Analysis in `ideas.md` → the
  dash economy.
- No known bugs.
- `index.html` over `file://` is **unverified by Claude** — Playwright refuses
  `file://` URLs, so everything has been tested over `http://localhost`. Igor
  should confirm double-click still works. Low risk, never actually run.
