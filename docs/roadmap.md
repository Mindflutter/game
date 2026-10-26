# Roadmap

Near-term work **inside the active stage**, plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`. This doc owns *this week*, not the future.

---

## Next

S6 (balance) closed 2026-10-24 (D139 (S6 closes)): the threat system and the
grades it chooses (D126 (threat)), the numbers against the pillars (D127 (the
tuned numbers)), the bots and the balance suite that hold them (D128 (the
balance suite)), and the dive reshaped on Igor's play (D129 (a gentle first
layer), D130 (fish are revealed a type at a time), D137 (batches grow from
seconds to a minute and a half)). S7 (alpha polish) closed 2026-10-26, the
alpha on Igor's word (D150 (S7 closes)). **Now**: S8 (the economy: gems and
points), its tasks in `plan.md`; first, the economy measured as it stands.
The dash is held still — Igor: "leave dash for now, discussions needed".

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
(`entities/challenges.md`), and the dash's 99px (D111) — and S7 (alpha
polish)'s: the bump's (`design.md`), the leap's and the bulwark's reach
(`entities/enemies.md`), the splash's ring (`entities/boosts.md`), the `+N`'s hold,
flight and bump (D142 (the +N)), every sound's voice (D144 (every moment of a
dive has a sound)), each fish's catalogue line (D146 (the catalogue)), the numbers `home`'s kit
shows (D147 (home shows the kit)) — all
Claude's picks.
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
- **The economy, the D150 (S7 closes) build, 2026-10-26** — S8 (the economy:
  gems and points)'s first figures: five fresh saves (seeds 1–5) of ten dives
  each, the diver bot carrying the Gun and spending as `tests/measure.js` does,
  points into the cheapest step, gems into the cheapest tier.
  - **The first dive** reaches gate 6–19 of 30 (four of five in layer 2),
    earns 99–723 gems and 5–23 points — of the 50 the challenges pay ever. It
    buys the Gun's first tier and, on three seeds of five, the Mask's.
  - **Points** reach 32–39 by the fifth dive and stop: the top rungs pay none
    of the last 11–18 in ten dives. Attributes stop growing from then.
  - **Gems** grow with depth: about 2,500 a dive to the last gate, four to six
    times the first dive's. Every tier of the Gun and the equipment, 15,280
    gems, is bought by the ninth or tenth dive; then gems pile up unspent.
  - The bot reaches the last gate from the fifth to the eighth dive and loses
    the last boss every time after.
  - Igor's own first dive, for scale: mid layer 2, 12 points, the Gun's first
    tier the only purchase.
- **Difficulty, from Igor playing it, 2026-09-27: batches are too easy.**
  "nothing breaks the target, currently batches are very easy to complete."
  This is the number that counts, and the direction is that batches must get
  **harder**. **2026-09-29, the boss: "right now it's very easy for me."**
  S6 (balance) tuned both against the bot's figures below (D127 (the tuned
  numbers)); his play decides whether enough.
- **Balance, the D137 (batches grow from seconds to a minute and a half)
  build, 2026-10-24** (D127 (the tuned numbers), D128 (the balance suite)):
  the diver bot, seeds 1, 7, 42, 4471, 90210, 3, 11, 77, 2024, 31337;
  `npm run balance` passes. A floor, never a human's experience (D50 (the bot
  is not a difficulty instrument)).
  - **Careers**, the Gun, spending in Claude's order: won on all ten, at dive
    4–6. First purchase after 1–2 dives. Layer 2 first reached on dive 1–2,
    layer 3 on 2–4. A layer's first clear, printed: layer 1 3.4–4.0 min,
    layer 2 3.6–6.2, layer 3 7.0–9.3. At the win it holds Gun 2–3 and each
    piece of equipment at 1–2: 5–9 of the 12 tiers.
  - **Every gate at the kit a career first meets it with**: the ordinary
    stretches' mean clear 9.7 / 13.3 / 18.1s in layer 1, 16.3 / 23.6 / 38.3s
    in layer 2, 41.9 / 57.9 / 69.9s in layer 3; the mini-bosses' 18–55s; the
    bosses' 63.5 / 109.5 / 49.1s. Hearts a batch, by layer, 0.50 / 1.57 /
    4.82; the costliest 8.2, layer 3's bulwark 14, archer 18, eel 55. The most
    lost, on 4 seeds of 10: layer 1's boss with archer 8, bulwark 2, drifter
    4, darter 2, and layer 2's archer 4, darter 8, puffer 11, bulwark 4.
    Standing, the opening cleared on every seed; past it, three gates on
    one seed, the rest on none.
  - **Per weapon**, each at the kit a Gun career first meets layer 2 with,
    the ordinary batches of layers 2 and 3, a fight capped at 150s:

    | | clear s | hearts | clears | layer 2 clear s / hearts | layer 3 clear s / hearts |
    |---|---|---|---|---|---|
    | Gun | 43.5 | 5.67 | 0.73 | 26.39 / 1.84 | 60.62 / 9.51 |
    | Harpoon | 42.48 | 4.45 | 0.73 | 23.02 / 2.14 | 61.94 / 6.76 |
    | Knife | 45.26 | 3.5 | 0.74 | 44.4 / 3.81 | 46.12 / 3.19 |

    None dominates over both layers; in layer 2 the Gun and the Harpoon do
    the Knife, in layer 3 the Knife does both.
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
