# Roadmap

Near-term work **inside the active stage**, plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`. This doc owns *this week*, not the future.

---

## Next

S6 (balance) opened 2026-10-21 (`plan.md`), on the pass before it — from
Igor playing S5 (content), D104 (bodies doubled) to D125 (boosts keep each
weapon's nature) — and is built: the threat system and the grades it chooses
(D126 (threat)), the numbers against the pillars (D127 (the tuned numbers)), the
bots and the balance suite that hold them (D128 (the balance suite)), to
`specs/2026-10-21-s6-balance-design.md`. The dash is held still — Igor: "leave
dash for now, discussions needed". **Next**: Igor's word on how strict the
bars are (`ideas.md` → Open — from S6 (balance)), and his play, which
overrules every bot figure; S6 (balance) closes on his word.

Still open to Igor's feel: the four current numbers (`GATE_SPACING`,
`CURRENT_SPEED`, `CURRENT_CRAWL`, `CURRENT_EASE`), the lunge's, the fan's and
the boss's haul (`entities/enemies.md`), S4's — the Gun's prices and tier step
(`entities/weapons.md`), `GEM_PULL` (`design.md`) — the
mods rework's: the layer end's bigger step (`design.md`), `Mend` as the layer
end's own (`entities/mods.md`), the boost chance, a boost's life on the floor
and `Rush` (`entities/boosts.md`) — and S5 (content)'s: every number of the
archer, the puffer and the eel (`entities/enemies.md`), of the Harpoon and the
Knife (`entities/weapons.md`), of the three pieces of equipment
(`entities/equipment.md`), of Barbs and the three boosts (`entities/mods.md`, `entities/boosts.md`), and
the layers' pools — and this pass's: every challenge's rungs, what a rung pays,
what a step costs and what each attribute's step adds
(`entities/challenges.md`), and the dash's 99px (D111) — all Claude's picks.
The
scenarios that start next to each — one fish of each kind, every ordinary type
in a row, a weapon carried from the top, the second and third layers with a
kit — are in the root `README.md` → Scenarios.

Deliberately not yet: a lively background (post-alpha, in `ideas.md`).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.
**Each bot figure below names the build it was measured on**; one from an
older build is a regression signal for that build only.

- All `?test` checks passing, and `npm test` green.
- **Difficulty, from Igor playing it, 2026-09-27: batches are too easy.**
  "nothing breaks the target, currently batches are very easy to complete."
  This is the number that counts, and the direction is that batches must get
  **harder**. **2026-09-29, the boss: "right now it's very easy for me."**
  S6 (balance) tuned both against the bot's figures below (D127 (the tuned
  numbers)); his play decides whether enough.
- **Balance, the D130 (fish are revealed a type at a time) build, 2026-10-22**
  (D127 (the tuned numbers), D128 (the balance suite), D129 (a gentle first
  layer)): the diver bot, seeds 1, 7, 42, 4471, 90210, 3, 11, 77, 2024, 31337;
  `npm run balance` passes. A floor, never a human's experience (D50 (the bot
  is not a difficulty instrument)).
  - **Careers**, the Gun, spending in Claude's order: won on all ten, at dive
    7–12. First purchase after 1–2 dives. Layer 2 first reached on dive 1–3,
    layer 3 on 6–8. A layer's first clear, printed, no longer a bar: layer 1
    7.1–8.2 min, layer 2 5.3–5.8, layer 3 6.9–8.5.
  - **Every gate at the kit a career first meets it with**: a batch's mean
    clear by layer 36.5 / 33.1 / 36.8s, the slowest 52.9s (layer 3, bulwark
    10, eel 22, puffer 12). Hearts a batch, by layer, 0.56 / 2.29 / 3.03; the
    costliest 8.0, layer 3's bulwark 6, puffer 12, eel 14, lost on 3 seeds of
    10; the most lost, layer 2's archer 8, puffer 12, drifter 10, on 4.
    Standing, the opening's five batches cleared on 7–10 seeds of ten; past
    it, two of layer 3's boss gates on one, the rest on none.
  - **Per weapon**, each at the kit a Gun career first meets layer 2 with,
    the ordinary batches of layers 2 and 3, a fight capped at 150s:

    | | clear s | hearts | clears | layer 2 clear s / hearts | layer 3 clear s / hearts |
    |---|---|---|---|---|---|
    | Gun | 39.8 | 5.09 | 0.77 | 40.26 / 6.02 | 39.35 / 4.17 |
    | Harpoon | 40.7 | 4.92 | 0.75 | 33.66 / 5.21 | 47.74 / 4.63 |
    | Knife | 41.34 | 4.19 | 0.68 | 55.33 / 7.52 | 27.35 / 0.87 |

    None dominates over both layers; in layer 2 the Gun and the Harpoon do
    the Knife, in layer 3 the Knife does both and the Gun does the Harpoon.
  - **Footwork**, five seeds, the ordinary batches at first-met kits: without
    its dash the diver bot loses 0.72 / 4.01 / 5.88 hearts a batch by layer,
    against 0.28 / 2.91 / 3.81 with it, and dies 4% / 17% / 19% of fights
    against 0% / 15% / 4% — short of D127 (the tuned numbers)'s twice in
    layers 2 and 3 (`ideas.md` → Open — from S6 (balance)).
- **Solid bodies** (D120 (bodies are solid)), every pair every tick: 500
  drifters cost 0.44ms a tick in Node, 2026-10-19 — two ticks a frame, about
  0.9ms of 16.7ms. With them, a batch of 34 crowding a standing diver left no
  body's centre inside another in view; the deepest overlap was 0.35 of the smaller
  radius.
- **Simulation rate**: `FIXED_DT` 1/120 since D53, banked by the frame loop.
  Doubling the tick rate costs ~1.1ms of a 16.7ms frame at the 500-object
  budget, from D43's 0.55ms measurement of `update()`.
- **The yardstick is blind to the dash.** `kiteAndShoot` never presses Space, so
  D51's change (dash damage now bought, not free) moved its clear times by
  exactly zero. A bot only measures the mechanics it uses.
- **Difficulty is invariant to window size, with the camera** (D29, D58): seed
  4471 reaches the bottom of the dive in the same time at 1280×800, 1920×1080
  and 3440×1440 alike (stationary, invulnerable, aiming at the first fish),
  driven through real mouse events aimed on a 20px grid that all three scales
  put on whole pixels. The `?test` check requires the three to be identical;
  dropping the input's `/ scale` leaves the two larger windows short of the
  bottom.
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
