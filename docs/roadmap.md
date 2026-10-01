# Roadmap

Near-term work **inside the active stage**, plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`. This doc owns *this week*, not the future.

---

## Next

No stage is active: what comes next, and where each requirement before S5
(content) stands, is `plan.md` → Active stage and Before S5.

Still open to Igor's feel: the four current numbers (`GATE_SPACING`,
`CURRENT_SPEED`, `CURRENT_CRAWL`, `CURRENT_EASE`), the lunge's and the boss's
haul (`entities/enemies.md`), and S4's — the Gun's prices and tier step
(`entities/weapons.md`), the gems card (`entities/mods.md`), dash reach and
`GEM_PULL` (`design.md`) — all Claude's picks. The scenarios that start
next to each — a lunger, the second layer with a kit — are in the root
`README.md` → Scenarios.

Deliberately not yet: balance fine-tuning — Igor, closing S3: "i suggest we
leave all balance fine-tuning for later"; S6 — Balance owns it, the threat
system for enemies included (Igor, 2026-09-30: "is it part of balance? yes").
A lively background (post-alpha, in `ideas.md`).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.

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
  4471 reaches the bottom of the dive — both layers since S4 — in 578.00 /
  578.00 / 578.00s at 1280×800, 1920×1080 and 3440×1440 (stationary, immortal,
  aiming at the first enemy), driven through real mouse events. On the S3
  build, one layer: 296.34s at all three. A `?test` check
  holds it within 2%; on the S2 layer, dropping the input's `/ scale` failed it
  at 217.03 / 228.71 / 227.51.
- **The boss fight** (S3 DoD, D63), mortal bot at the starting kit — no gear,
  no mods — from `last-batch`, seeds 1, 7, 42, 4471, 90210: **0 of 5 won**; it
  dies after 24.6 / 28.1 / 24.7 / 25.1 / 26.4s. Immortal, it kills the boss in
  92.3 / 105.1 / 93.3 / 94.4 / 99.3s. **The mini-boss**, from `mini-boss`: 1 of
  5 won (seed 1, 122.2s, 2 hp left); three seeds time out at 300s alive, one
  dies at 22.5s. **Why**: against a lone slow enemy the kiting bot holds it
  inside its own 250px range 1% (seed 7) to 18% (seed 4471) of the time — it
  backs out of range, so its shots never land, and backs straight along the
  lunge's line, so the charges do. A measure of the bot's policy, not of the
  boss (D50); Igor's playthrough decides whether the layer is winnable.
- **The meta loop** (S4 DoD), measured 2026-09-30 — mortal bot, seeds 1, 7, 42,
  4471, 90210, from the top, each a whole dive:

  | | gates cleared | gems banked | mean gates | mean gems |
  |---|---|---|---|---|
  | starting gun | 0 / 4 / 0 / 5 / 1 | 10 / 54 / 11 / 79 / 29 | 2.0 | 36.6 |
  | gun tier 1 | 0 / 5 / 7 / 12 / 9 | 11 / 72 / 133 / 266 / 145 | 6.6 | 125.4 |

  **Dives to the first purchase: 2** (target ≤ 3) — seeds 1 then 7 bank 64
  against the first tier's 40. **Measurably stronger**: the same seeds, tier 1
  against the starting gun, clear 3.3× the gates. Seeds 1 and 42 die in their
  first batch because their dive opens on 14 darters (D71 draws the opener
  from stretch 1's pool; `ideas.md` → Open — raised during S4) — before S4 every
  dive opened on 10 drifters and the bot died after 3–7 clears. **Layer 2**,
  from `layer-2` (a kit of fifteen mods, the starting gun): dies after 8 / 10 /
  11 / 10 / 10 clears, banking 215–312 gems — it never reaches layer 2's boss.
  Bot policy as ever (D50): Igor finds batches easy.
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

  Dash reach does not ride on `player.speed` (D56), so `Reflex` is the only
  mod that raises escape power, and it caps at 3. **The Fins ×10 rows cannot be
  reached** — every mod caps at 3 (D69 (every mod capped)) — and stay as
  measured, as the proof that `Fins` does not feed the dash. The Dash reach
  attribute (D75), 165 and 189px at one and two points, is not measured in
  these tables.

  Caveat as ever: the probe dashes once from a standstill in a fixed direction,
  so it cannot see a human lining the dash up along a crowd. It is a weak
  instrument on the same axis the bot is (D50). Analysis in `ideas.md` → the
  dash economy.
- No known bugs.
- `index.html` over `file://` is **unverified by Claude** — Playwright refuses
  `file://` URLs, so everything has been tested over `http://localhost`. Igor
  should confirm double-click still works. Low risk, never actually run.
