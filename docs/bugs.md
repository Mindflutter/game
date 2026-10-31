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

### Nothing trivial fails across all three layers
`npm run balance`, 2026-10-30, the D168 (the guard lasts two gates) build:
the standing bot clears 30 batches past the opening on more than one seed in
ten — layer 1's third and fifth stretches, layer 2's first four, layer 3's
first six. Not new: `npm run balance` on the D162 (the whole game in
fifteen to twenty minutes) build, run again in a worktree, stands 26 in seven
stretches; the three stretches in `roadmap.md` → Health are `npm run
measure pillars`'s five seeds. D167 (the puffer counts more, and gates carry
fewer) made it 27 and D168 (the guard lasts two gates) 30; the guard back to
one gate on the lionfish's build changes none. Refitting the pools with the fit fixed grows layer 1's archer stretch
from 7 drifters to 13, and the standing bot still clears it; the count fell
to 17, but only layer 1 changed, so the rest of the fall is the careers' kits
moving. The refit was not kept. With the lionfish (D171 (the lionfish)) in
four of layer 3's batches, 21 — 7, 2 and 12 by layer: layers 1 and 2 did
not change, so their move too is the careers'.

What should happen: a batch past the opening is not cleared by standing
still (`foundations.md` → the pillars, Nothing trivial). Not found yet:
whether the guard's second gate or the fewer fish do it.

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

Once more since, harmless: `AltLeft`, held 57s in
`logs/2026-10-29-layer-jump/1/`, pressed as the window took the focus after
the play was done, and let go at the next blur.
