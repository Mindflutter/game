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

## Next, inside S1

S0 closed 2026-09-27; its three items (seeded RNG, the glow cache — cancelled
by measurement, and the entity-budget spike) all landed and are recorded in
`plan.md` → S0 and in D41/D43.

Nothing is queued. Every S1 item has landed and Igor has confirmed the fight
("the fight feel better now", 2026-09-27, on D54's batches). The stage is ready
to close; S2 — The dive: camera and descent is next, and opening it is Igor's
call.

Not in S1, deliberately: the camera and the scrolling descent (S2), and
anything to do with `home` or spending currency (S4).

## Standing constraints

Now in `foundations.md` → The technical contract, and not duplicated here.
Two changes worth flagging since they reverse what this section used to say:
dependencies are *permitted* but declined on measurement grounds (D30), and
the arena stops being fixed at S2 (D29).

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
- **Bot survival: it no longer dies.** All five seeds finish eight batches with
  4–8 hp against a start of 3, where the same bot died at ~38s before mods
  existed. Consistent with Igor's read, and with Mend and Vitality being strong.
- The 38.7 / 37.8 / 36.6s survival figures (2026-09-19) are **gone, not stale**:
  they measured an auto-firing weapon with an XP curve, neither of which exists.
- Difficulty is consistent across window sizes (70.6 / 55.0 / 63.0s at
  1280×800, 1920×1080, 3440×1440). That figure is from the auto-fire build too,
  so treat it as "the property held once", not as a current number. It must
  survive the camera at S2 and has a check there (D29).
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
