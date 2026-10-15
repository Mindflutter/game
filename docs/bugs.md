# Bugs

Real issues seen in play: the game doing what it should not, or showing what a
player cannot read. Not an idea (`ideas.md`), not a number to tune (S6
(balance)'s). A living doc (D112 (bugs get a page of their own)): an issue
stays until the change that fixes it, and that change's `changelog.md` entry
records the fix and the check that now holds it.

Each issue says what happens, what should, how to see it — a `?debug=<code>`
URL replays a setup exactly, seed and all (D102 (the debug mode)) — and, once
found, why. A bug gets its root cause and a check that fails on it before any
fix (`CLAUDE.md` → Verification).

## Open

### Stats named in code words

- **Seen**: Igor, 2026-10-15: "iframes wording is confusing".
- **What happens**: a mod's card and its pickup line name each stat it moves by
  its key in the code — `iframes 1 → 1.3` for `Nerve`, and so `dashCooldown`,
  `shotRadius`, `mendOnClear`, `fireRate`. The development readout under the
  status bar abbreviates the same stats — `ifr`, `dashcd`, `size` — though it
  is to be trimmed or dropped before alpha (D52 (the development readout)).
- **Should**: words a player reads without help — no mechanic needs explaining
  in more than one sentence (`foundations.md` → Pillars).
- **Repro**: a layer end's cards in any dive, or a glowing fish's mod as it
  lands — `Nerve`'s line reads `iframes`.
- **Cause**: `modPreview()` returns stat keys, and the cards and the pickup
  line print them as they are; `PLAYER_STATS`' labels are abbreviations.

### Boost lines speak of shots while the Knife swings

- **Seen**: Igor, 2026-10-15: "what's "your shots swell", knife doesnt have
  shots or fires".
- **What happens**: touching `Bloom`, `Frenzy` or `Lance` while carrying the
  Knife says "your shots swell", "you fire much faster", "your shots go
  through" — though the Knife neither shoots nor fires. Each still works on the
  blade: `Bloom` makes it reach further, `Frenzy` swings faster, `Lance` lets one
  swing cut more fish (D105 (the Knife swings)).
- **Should**: a line that is true of the weapon carried.
- **Repro**: carry the Knife — `?debug=L1,G1,S1,Knife0` — and touch any of the
  three when a kill drops one.
- **Cause**: a boost's `desc` is one line, written for shots (D99 (weapon mods,
  and more boosts)) a day before the Knife became a swing; D105 (the Knife
  swings) kept the boosts working on the blade but not their words.
