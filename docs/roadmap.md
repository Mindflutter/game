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

## Next, inside S0

In order. Nothing here changes how the game plays (that is S0's DoD).

1. **Seeded RNG.** One seeded generator per dive, routed through every
   `Math.random()` in `game/`. A check proving the same seed replays the same
   sequence. This is the prerequisite for every balance number from here on.
2. **Offscreen glow cache.** Pre-render each glowing shape once, blit it per
   frame. Measure against the current `shadowBlur` path and record both
   numbers — D30 rests on this measurement, so it decides whether "no
   dependencies" holds.
3. **Entity budget spike.** Throwaway. Drive entity count to failure and
   replace the provisional 500 in `foundations.md` with the measured figure.

Not in S0, deliberately: anything that changes gameplay. Manual fire and the
batch gate are S1.

## Standing constraints

Now in `foundations.md` → The technical contract, and not duplicated here.
Two changes worth flagging since they reverse what this section used to say:
dependencies are *permitted* but declined on measurement grounds (D30), and
the arena stops being fixed at S2 (D29).

## Health of the thing right now

This section owns the measured bot figures. Nothing else quotes them.

- All `?test` checks passing (count in `design.md` → Verification).
- Bot survival: 38.7s not dashing, 37.8s dashing away, 36.6s dashing into the
  crowd (21 runs each, 2026-09-19, after the force dash). The old 44.7–63.9s /
  median 55.2s figure is **stale** — that bot had no aim or dash policy, so it
  no longer describes the game. The current bot is a weaker driver than the old
  one and is only comparable to itself.
- **All of the above goes void at S1.** D28 replaces auto-fire with manual
  fire, which invalidates every balance constant and every bot policy built on
  them. The bot needs a firing policy it does not have. Establishing a bot
  worth trusting as a baseline was already open work; it is now blocking S1's
  DoD.
- Difficulty is consistent across window sizes (70.6 / 55.0 / 63.0s at
  1280×800, 1920×1080, 3440×1440). This property must survive the camera at
  S2 and has a check there (D29).
- No known bugs.
- `index.html` over `file://` is **unverified by Claude** — Playwright refuses
  `file://` URLs, so everything has been tested over `http://localhost`. Igor
  should confirm double-click still works. Low risk, never actually run.
