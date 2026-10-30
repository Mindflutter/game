# Bugs

Real issues seen in play: the game doing what it should not, or showing what a
player cannot read. Not an idea (`ideas.md`), not a number to tune (a
balance pass's). A living doc (D112 (bugs get a page of their own)): an issue
stays until the change that fixes it, and that change's commit records the
fix and the check that now holds it.

Each issue says what happens, what should, how to see it — a `?debug=<code>`
URL replays a setup exactly, seed and all (D102 (the debug mode)) — and, once
found, why. A bug gets its root cause and a check that fails on it before any
fix (`code.md` → Verification).

## Open

### `npm run measure fit` drifts on every run
Found 2026-10-30, refitting for a heavier puffer: with nothing changed, each
run moves the pools — layer 1's drifters 7 → 9 → 11 over two runs, a darter
or a drifter off a few layer-2 batches — so the committed pools are not the
fit's output, and a refit for one type rewrites batches it never touched.
Not seen in play: tooling, but every refit meets it.

Why: `fit()` in `tests/measure.js` scales each batch from its *current*
counts and rounds, so the rounding feeds the next run; and the first
stretch (`target === THREAT_START`) has no ceiling, only a floor, so its
batches only grow. What should happen: a refit with nothing changed writes
the same pools.

### A key stays held after it is let go
Igor, 2026-10-28, in the first Sonar play-test: "something broke, i can't
swim up, probably browser window touched, and somehow affected", then "now
i can, it fixed somehow". The recording (`logs/2026-10-28-suit-on/1/`)
shows `KeyS` held from 119.9s to 148.8s with no key-up ever arriving, and no
blur and no Cmd at the moment it stuck: W against a held S cancels out. It
let go at 148.8s, when Cmd and the window losing focus cleared every key, as
`platform/input.js` does on purpose.

What should happen: a key let go is let go. Why the browser sent no key-up is
not found yet. A guess to check: a trackpad gesture or a click on the
window's own frame, which can swallow a key-up without taking the focus. The
next time, Sonar has it on record.
