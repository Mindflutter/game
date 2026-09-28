# S2 — The dive: camera and descent · design

Agreed with Igor in the S2 brainstorm, 2026-09-28. **Partly superseded the
same day, on Igor's play** — the current never stops (it slows during a fight
and only the water moves), batches are ~2s apart, not ~12s, and swimming does **not** speed the current up. D58 in
`decisions.md` is the current record; where this file disagrees, D58 wins. This is the design brief for
S2 (plan.md); once implemented, what it describes moves into `design.md` and
the decisions into `decisions.md`, and this file is history.

## Intent

One layer scrolls. The dive stops at every batch and moves between them
(D27 — Batches are hard-gated), so a layer reads as dynamic and action-like
rather than a room you wait in. Exit conditions are plan.md's S2 DoD:
traversable top to bottom, window-size invariance checked at three sizes
(D29), a bot-measured traverse time, playable.

## Settled by Igor in the brainstorm

- **The current moves the dive, on its own.** After a batch dies the descent
  starts by itself; the player does not have to trigger it. **Swimming down
  speeds it up.** Igor: "it starts on its own, the player can speed it up.
  complies with the idea that layers must be dynamic and action-like".
- **No net, no visible floor** under a gate.
- **The bottom of the layer is an end screen** with the time taken, R to dive
  again (option (a)). S3 replaces it with the boss and layer completion.

## 1. The descent

- **World and view.** The world is a tall vertical strip; the view is a fixed
  1280×800 window onto it at depth `cameraY`. Player, enemies, bullets, gems
  and particles live in world coordinates. The view is still letterbox-scaled
  exactly as today, so it is the same size in world units on every window —
  which is what keeps difficulty invariant to window size (D29).
- **The cycle after a batch dies:** mod offer (unchanged) → the current eases
  in → cruises → eases out to a stop exactly at the next gate depth → the batch
  arrives.
- **The hint is the ease-in.** The current's first second is slow enough that
  it only makes the water specks creep upward. No separate hint phase or state.
- **Swimming down speeds it up.** Below a line in the view, the camera follows
  the player down faster than the current. No new key — it is `S`. It still
  eases out at the gate, so the camera cannot overshoot a batch.
- **The current carries you.** The top edge of the view pushes the player
  down. The player is always clamped inside the view.
- **Arrivals** come in from the edges of the *view* at the gate, as today.
- **The gate is structural.** The camera does not move while
  `enemies.length > 0`.
- **`GATE_PAUSE` becomes the travel.** Today the 1.2s breath (D48 — The batch
  queue and the gate) is what separates a mod pick from the next batch; after
  S2 the descent is. The first batch of a dive still arrives after
  `GATE_PAUSE` at depth 0, so a dive still opens calm; every later batch
  arrives the moment the camera stops. Claude's pick.

## 2. The bottom of the layer

`BATCHES` (12 entries — twelve is Claude's pick, D54, so the layer's length is too) stops cycling. After the 12th batch the current carries
the player one more stretch to the bottom and stops; a **"THE BOTTOM"** screen
shows the time taken, R dives again — shaped like the death screen. This is
the bot's traverse-time end signal.

`BATCHES` stays a flat list. A layer owning its own batch list is S3's shape
(the `ponytail:` comment at the spawn site already says so).

## 3. What is drawn

Bare minimum — the canvas layer is throwaway.

- **Water specks**: a sparse world-fixed field, positions derived from their
  grid cell (no entities, no state), so camera motion shows as specks
  streaming upward. Hashed from the cell, **never drawn from `rng()`** — a
  draw call consuming the dive's seeded sequence would make the same seed
  replay a different dive depending on what was on screen.
- **Depth tint**: the background darkens slightly with depth.
- **The bottom screen**, from section 2.
- World draws are translated by `-cameraY`; the HUD is not.

## 4. Code shape

- `cameraY` and the descent state live in `game/`.
- `aim` stays in view coordinates (platform's job); `game/` converts with
  `+ cameraY` where it reads it. **No new seam name** (the port seam stays six).
- The bot (`tests/bot.js`) sets `aim` from enemy world positions; it must
  subtract `cameraY`.
- Scenarios place enemies in view coordinates at `cameraY = 0`, so they keep
  working unchanged.

## 5. Checks and the measured number

Each check is verified by breaking the rule it guards.

**Node (Vitest):**
- The camera does not move while a batch is alive — property over seeds (D27).
- The camera stops exactly at the gate depth, never past it, including while
  swimming down.
- Swimming down reaches the next gate sooner than drifting.
- The player never leaves the view.
- A shot fired at a non-zero `cameraY` flies at the cursor (aim conversion).
- After the last batch comes the bottom screen, not another batch.

**Browser `?test`:**
- The same seed, driven by the bot at three window sizes, gives the same
  traverse time (D29).

**Measured:** bot time to traverse one layer, 5 seeds (1, 7, 42, 4471, 90210),
recorded in `roadmap.md` → Health and nowhere else.

Existing checks that assume a fixed arena (edge spawns, scenario positions) are
updated, not deleted.

## Claude's picks — not derived, not final

Starting values, measured by the bot and open to Igor's feel:

| Number | Pick | Why this value |
|---|---|---|
| gate spacing | 1600px (two views) | long enough to read as travel |
| cruise speed | 400px/s | ~4s between gates |
| ease in / ease out | ~1s each | the ease-in doubles as the hint |
| swim-down line | 60% of view height | below centre, above the edge |

## Checked against `foundations.md`, `plan.md` and the source design

Read against all three on 2026-09-28. No rule is changed by this design; four
points of friction, each resolved or owned:

- **Genre contract 6 — currency is never chased (D35).** Gems lost to the
  descent contradict it. The contradiction predates S2: D35 is decided and
  unimplemented, so gems are already chased today. S2 makes the cost visible,
  it does not create it. Owned by S4 (Meta loop skeleton), per Igor.
- **plan.md S3 is "the first stage that produces a game with an ending".** The
  S2 bottom screen must not pre-empt that: it is a **stop, not a win** — no
  completion, no unlock, no reward, only the time taken. plan.md's S2 work
  line gets a sentence saying so when S2 lands.
- **Pillar: a layer takes 4–8 min.** Projected from `roadmap.md` → Health
  clear times plus ~4s of travel per gate, one layer of today's 12 batches
  comes in around or under the 4 min floor. Not an S2 defect — the targets are provisional
  until S6 (Balance) — but the traverse time S2 measures is the first real
  number against this pillar, and should be read as such.
- **Seeded RNG for every dive.** Held by keeping the specks off `rng()`
  (section 3).

Holds unchanged: the glossary (no "level", no "upgrade"; "view" and "current"
are new plain words, not terms), the port seam at six names, the fixed
timestep, window-size invariance (D29), nothing interrupting combat (D33), 2D
permanently (D24), and the source design's "i'd pick smooth" and "a simple
vertical design".

## Left open, deliberately (logged in `ideas.md`)

- **A lively background during batches** — Igor: "most likely done after the
  alpha, when graphics come". Not S2.
- **Gems left behind by the descent.** They stay world-fixed and scroll off,
  lost. Igor: left for the currency stage (S4), which reworks it anyway.
- **How to transition between layers** — Igor: "an open discussion ... later".
  Joins the existing "after a layer completes" entry.
