# Roadmap

**The to-do list** — every concrete task Claude can take, grouped and
ordered — plus the health of the build.

The stages themselves live in `plan.md`; the rules that outlive them live in
`foundations.md`; what waits on Igor's answer lives in `ideas.md`.

---

## Next

S9 (the balance rework) is active, S10 (Sonar) beside it (`plan.md`); what
S9 has built is its decisions, from D155 (six gates a layer) on, and Sonar's
play-tests and outcomes are `playtests.md`.

The to-do list: concrete tasks Claude can take, grouped and in the order
Claude would take them (D197 (the list's last items; the roadmap is the
to-do list)). Igor reorders. A task done leaves the list with its commit;
what waits on Igor's answer is `ideas.md` → To discuss.

### 2. Fixes

Small, concrete, each its own commit.

- [ ] **Barbs and Lance**, made weapon-free or removed — Claude's choice —
  since mods and boosts are not tied to weapons (D188 (the list's first
  five answered)).

### 3. Feel

What a dive feels like, each to play.

### 4. Content

New things to meet and to earn, each to measure.

- [ ] **A ladder of each weapon's own** — kills while carrying it, at the
  least, paying points (`ideas.md` → Every weapon tried and raised;
  Running lists → Weapon ideas).
- [ ] **Boosts of new kinds**, two or three of Claude's: the diver's own
  numbers for a while, as Rush is, and effects of their own, an explosion
  round the diver or shots every way — a field that switches on one branch,
  where D86 (boosts) holds a boost to numbers (D194 (the list's seventh
  five answered)).
- [ ] **Mod caps removed, and measured** (`ideas.md` → Mod caps:
  removed?) — the glossary's "every mod has a cap" goes with it, if kept;
  `Mend` the last comfort mod, kin under the same "enough variety".

### 5. Analyses, for Igor's decisions

Read and written up, nothing built; each ends in decisions to suggest.

- [ ] **Development trees, analysed**: how a small tree for the character —
  the attributes as one, or a tree of its own — and one for each weapon,
  a top tier that adds a way to play among them, could take the points
  without moving the balance reached (`ideas.md` → Every weapon tried and
  raised; `reading.md` → Nova Drift, a game like this one). An analysis for
  Igor, not a build.
- [ ] **Abilities, analysed** with the development trees: how other games
  do it, fitted to Abyss, with decisions to suggest — Igor's start, an
  ability found at a depth once a game and developed at `home`; the dash
  among them, locked or not, its shove earned; and a thorough check of the
  balance and the mods that feed the dash, `Reflex` and `Impact` among them
  and the right mouse button as an ability's key (`ideas.md` → Abilities,
  the dash among them; the dash economy).
- [ ] **A bot that plays like Igor**: first the play-tests for what his
  plays do not show yet, then the bot fitted to them (`ideas.md` → A bot
  that plays like Igor). The stood bars wait on it (`bugs.md` → Nothing
  trivial fails across all three layers).
- [ ] **Studioigor's skills**, read — https://github.com/studioigor/studioigor-skill
  and his other repos — and what fits the rules here brought in (D196 (the
  list's ninth five answered)).

### 6. Housekeeping

Outside the game.

- [ ] **The backend rules kept out of this project**: the global
  `~/.claude/rules/` and `~/.claude/CLAUDE.md` load into every session here
  and only collide. Loaded by every backend project and nowhere else, from
  one copy, never duplicated — "rules can change" — through whatever Claude
  Code offers for scoping them (D196 (the list's ninth five answered)).

### Igor's to open

When he says.

- [ ] **Graphics**, Igor's to open: the diver's image and animation first,
  in the browser, files allowed (D195 (art in the browser)).

### Standing

Not done once: kept up as the game grows.

- [ ] **The gear left unbought at a win**, measured again as content grows
  — accepted for now (D188 (the list's first five answered)).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.
**Each bot figure below names the build it was measured on**; one from an
older build is a regression signal for that build only.

- All `?test` checks passing, and `npm test` green.
- **The D162 (the whole game in fifteen to twenty minutes) build,
  2026-10-28**, five seeds, `npm run measure pillars`:
  - **Fights per layer**, bot seconds summed: about 127 / 183 / 233 — a dive
    of about 9 minutes; the deepest ordinary batch about 43s. The bosses
    about 47s, 69s and 40s.
  - **Bars failing**: none lost; stood on layer 1's archer stretch (every
    seed), its fifth stretch (2 of 5), layer 2's first (1 of 5) — the bot
    finds layer 1 easier than Igor does.
  - Careers not re-measured: the bot outearns Igor about tenfold, so prices
    are set on his play (D160 (a layer-1 dive buys a thing every two)).
- **The economy, the D152 (nine rungs a ladder, a point a rung) build,
  2026-10-26** — eight fresh saves (seeds 1–8) of fifteen dives each, the
  diver bot carrying the Gun, points into the cheapest step, gems into the
  cheapest tier; medians.
  - **The first dive** reaches gate 18 of 30, earns 656 gems and 2 points, and
    buys three things: the Gun's, the Mask's and the Weights' first tiers.
  - **Points** run 2, 9, 11, 15, 18 over the first five dives, then 19–21 to
    the fifteenth, where the bot's best stops growing — 21 of the 45 ever.
  - **Gems**: half the kit's tiers by the third dive, the kit (the Gun's tiers
    and the equipment, 18,050) by the ninth, enough for everything (30,650) by
    the fourteenth. About 2,500 a dive to the last gate, as before.
  - The bot reaches the last gate from the fifth dive and loses the last boss.
  - **Before**, on the D150 (S7 closes) build: a first dive bought one thing
    and earned 5–23 of 50 points; points stopped by the fifth dive, the kit
    was bought by the tenth. Igor's own first dive: mid layer 2, 12 points,
    the Gun's first tier the only purchase.
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
- **The career bot, the D182 (the Harpoon a railgun) build, 2026-11-01**,
  five seeds, `npm run measure careers <weapon>`: won at dive 2, 2, 2, 3, 3
  with the Gun, 2, 2, 2, 3, 2 with the Harpoon — on the D183 (the
  Harpoon's top fires faster) build too — 2 on every seed with the Knife;
  layer 3 about 3 minutes. The Harpoon before D182: 2, 3, 3, 3, 8.
  The Gun's on the D178 (a cleanup, and Igor's own words) build, the guard
  lasting two gates: 2, 3, 2, 3, 2.
- **The bars, the D199 (the bars, printed) build, 2026-11-04**, ten seeds,
  `npm run balance`: six of eight hold. Nothing trivial fails on 37 batches
  stood through (6 / 7 / 24 by layer), no weapon dominating on "Harpoon over
  Knife" (`bugs.md`).
- **The weapons, the D187 (the eel's sway slower; its path taken back)
  build, 2026-11-04**, at the kit a Gun career first meets each layer with,
  ten seeds, `npm run measure weapons`, clear s / hearts / clears: layer 2
  — the Gun 18.51 / 0.37 / 0.97, the Harpoon 18.37 / 0.42 / 0.94, the Knife
  29.04 / 1.04 / 0.87; layer 3 — the Gun 34.91 / 2.04 / 0.86, the Harpoon
  30.02 / 1.19 / 0.89, the Knife 33.18 / 1.46 / 0.87; the eel 1.21, 0.83 and
  0.33 hits a fight. Over both, the Harpoon dominates the Knife only.
- **The weapons, the D182 (the Harpoon a railgun) build, 2026-11-01**
  (`reading.md` → Try out and upgrade each weapon):
  - **At the fresh kit, layer 1**, ten seeds — `npm run measure weapons
    L1,Knife0`, clear s / hearts: the Gun 11.99 / 0, the Harpoon 15.27 /
    0.05 (15 / 0.03 before D182), the Knife 12.2 / 0.02.
  - **At the kit a Gun career first meets each layer with**, the ordinary
    batches, a fight capped at 150s, ten seeds — `npm run measure weapons`:

    | | clear s | hearts | clears | layer 2 clear s / hearts | layer 3 clear s / hearts |
    |---|---|---|---|---|---|
    | Gun | 28.42 | 1.91 | 0.88 | 18.51 / 0.37 | 38.33 / 3.45 |
    | Harpoon | 24.38 | 1 | 0.92 | 18.37 / 0.42 | 30.39 / 1.57 |
    | Knife | 29.59 | 1.08 | 0.9 | 29.04 / 1.04 | 30.15 / 1.11 |

    The Harpoon dominates the Gun over both layers, breaking D127 (the
    tuned numbers)'s bar, on that build (`bugs.md` → The Harpoon over the
    Knife, for this one). Its row is
    the D183 (the Harpoon's top fires faster) build's; on D182's, 24.96 /
    1.03, its layer 3 31.54 / 1.65; before D182, 29.02 / 1.3 and 39.73 /
    2.21, and the bar held.
    With its rate ×1.5 as well, not built: 19.96 / 0.27, over the Knife
    too. The Gun is the D178 build's to the hundredth; the Knife's layer 3
    there, its cut lengthened by the Mask, 28.62 / 1.08, and widened by it
    (D181 (the Mask widens the Knife's cut)) it moves by hundredths. In layer 3
    the Knife dominates both, its lionfish stings 0.16 a fight; with them
    stinging whatever was inside the circle, D175 (the lionfish drifts, its
    circle past the Knife's cut)'s build, 33.3 / 2.65 and 0.45. With the
    lionfish stinging a hit instead (D171 (the lionfish)) the Knife's layer 3
    was 31.32 / 4.52; with no lionfish, 26.15 / 0.76. In layer 2 the Gun and
    the Harpoon dominate the Knife. The careers' kits move with every
    change to layer 3, layer 2's too.
  - **At the `late` kit** (`playtests.md` → The kits), layer 3's ordinary
    batches, ten seeds, each weapon at the tier of the kit's — `npm run
    measure weapons L3,<the kit's tokens>`, clear s / hearts:

    | the late kit | Knife | Gun | Harpoon |
    |---|---|---|---|
    | the D183 build, tier 2: built | 25.44 / 0.18 | 31.27 / 2.59 | 25.7 / 0.99 |
    | the D182 build, tier 2 | 25.44 / 0.18 | 31.27 / 2.59 | 28.03 / 1.85 |
    | the Knife's own cut, tier 2 | 25.45 / 0.18 | 31.27 / 2.59 | 33.88 / 3.08 |
    | the cut lengthened by the Mask, tier 2 | 22.38 / 0.05 | 31.27 / 2.59 | 33.88 / 3.08 |
    | the Knife's own cut, the eel's sway at 0.5, unfitted: built since D187 | 26.17 / 0.35 | 28.02 / 1.42 | 32.67 / 2.47 |
    | before the lionfish, tier 2 | 21.42 / 0.09 | 30.38 / 2.43 | 34.1 / 2.79 |
    | without the Mask | 23.21 / 0.19 | 28.52 / 2.03 | 34.14 / 2.5 |
    | tier 0, no Weights | 22.47 / 0.13 | 46.14 / 7.86 | 39.38 / 4.66 |
    | tier 3 | 21.25 / 0.07 | 28.77 / 1.71 | 33.96 / 2.69 |

    The first row is the D183 (the Harpoon's top fires faster) build's, the
    second the D182 (the Harpoon a railgun) build's; the next
    three the D180 (the Mask lengthens a shot, not a cut) build's, the second
    of them as that build stood before it; the rest are
    the D168 (the guard lasts two gates) build's. The Knife clears
    every fight and dominates both in every row. **Neither
    the Mask's reach nor its tiers or the Weights put it ahead**: at tier 0
    with no Weights it loses less than the Gun and the Harpoon at tier 3.
    Igor's one late batch puts the gap at about twice, not the bot's tenfold
    and more (`playtests.md` → Three weapons, one late batch).
  - **The lionfish firing its spines** (D174 (the lionfish fires its
    spines)), its circle and its swim varied, layer 3, ten seeds — `npm run
    measure weapons`, clear s / hearts, 2026-10-31:

    | circle, swim | late kit, Knife | late kit, Gun | career kit, Knife | Gun | Harpoon |
    |---|---|---|---|---|---|
    | 80 px, drifting at 30, refitted, stinging by touch: built | 22.79 / 0.03 | 32.15 / 2.19 | 29.4 / 0.92 | 38.84 / 3.27 | 40.04 / 2.44 |
    | the same, stinging all inside the circle | 22.55 / 0 | 31.77 / 2.27 | 33.3 / 2.65 | 45.45 / 5.79 | 42.37 / 4.08 |
    | 40 px, chasing at 80 | 21 / 0.01 | 29.85 / 2.93 | 32.08 / 1.68 | 43.3 / 5.53 | 38.1 / 3.71 |
    | 60 px, chasing | 21.1 / 0.01 | 29.75 / 3.24 | 39.4 / 2.15 | 44.33 / 5.07 | 39.1 / 3.19 |
    | 80 px, chasing | 21.06 / 0.01 | 29.93 / 3.29 | 40.03 / 2.59 | 44.08 / 5.87 | 39.21 / 4.04 |
    | 100 px, chasing | 21.17 / 0.01 | 29.16 / 3.44 | 37.19 / 3.23 | 43.27 / 6.04 | 38.87 / 4.11 |
    | 40 px, drifting at 30 | — | — | 32.88 / 1.53 | 44.69 / 4.63 | 40.16 / 3.51 |
    | 80 px, drifting at 30 | — | — | 49.97 / 2.53 | 44.26 / 5.04 | 40.12 / 3.51 |
    | 80 px, drifting at 15 | — | — | 53.39 / 2.49 | 44.98 / 4.8 | 39.74 / 3.31 |

    Below the first two rows every bot kept out of an armed circle, and the
    Harpoon dominated the Gun over layers 2 and 3 in every one. A lionfish
    that chases presses every weapon, the Gun most, and singles out none.
    One that drifts, its circle past the short Knife's 70 px cut, is met by
    the Knife alone; a bot kept out could not cut it, and cleared none of
    `lionfish-fires`' gate in 150s. Darting in, as a player can, it clears
    them all in 31.4s, and the Knife pays about a heart a layer-3 fight more
    than against the chasing one; stinging only by touch, the spines miss
    most of its darts, and that heart is gone. The late Knife, its cut then about 160 px by the Mask, pays
    nothing in any. The stinging lionfish's figures went with it; Igor's
    plays of it stay in `playtests.md` → The lionfish, against a short
    Knife, and against a long Knife.
  - **Where the hits come from** (the `hits a fight, by` column): in layer 3,
    the eel — the D183 (the Harpoon's top fires faster) build: at the late
    kit 1.06 a fight on the Gun and 0.51 on the Harpoon against 0.02 on the
    Knife; at the kit a Gun career first meets layer 3 with, 1.98 and 0.97
    against 0.33. The Harpoon's were 0.97 and 1.04 before D183, 1.69 and 1.7
    before D182. The eel's sway at 0.5,
    unfitted, halves the late Gun's, to 0.52; at the kit a Gun career meets
    layer 3 with, it raises the Gun's eel hits to 2.44 a fight and its
    hearts to 7.81, and refitted — threat 0.064 / 0.112 / 0.147, layer 3's
    eel batches half again as full — to 2.77 and 6.09. Built unfitted since
    D187 (the eel's sway slower; its path taken back). The eel
    sways, so a shot misses it and its touch lands; the Knife's arc needs no
    aim. In layer 2 the Knife's hits are mostly the puffer's, 0.19 a fight.
    **Not for a hand**: in Igor's short-Knife layer-3 gates, `lionfish` and
    `lionfish-fires`, the eels dealt the most of his hearts in four dives of
    seven and tied in two more, and he cleared one gate in seven
    (`playtests.md`).
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
- `index.html` over `file://`: Igor, 2026-11-04, "works". Playwright refuses
  `file://` URLs, so Claude tests over `http://localhost` only.
