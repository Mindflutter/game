# Bugs

Real issues seen in play: the game doing what it should not, or showing what a
player cannot read. Not an idea (`ideas.md`), not a number to tune (S6
(balance)'s). A living doc (D112 (bugs get a page of their own)): an issue
stays until the change that fixes it, and that change's commit records the
fix and the check that now holds it.

Each issue says what happens, what should, how to see it — a `?debug=<code>`
URL replays a setup exactly, seed and all (D102 (the debug mode)) — and, once
found, why. A bug gets its root cause and a check that fails on it before any
fix (`code.md` → Verification).

## Open

- **Bloom's splash cannot be seen.** Igor, 2026-10-24: "splash shot should be
  visible". While Bloom runs, a hit also wounds every fish within `splash` of
  the struck one (D125 (boosts keep each weapon's nature)). But the only sign
  of it is the white flash each wounded fish gets, the same flash a direct hit
  gives. Nothing draws the splash itself, so a player cannot tell that Bloom is
  doing anything, or how far it reaches. It should show where it lands, and how
  far. To see it: touch a Bloom in any dive and shoot into a crowd. The debug
  mode cannot set up a boost.
