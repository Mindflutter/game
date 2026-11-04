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
Igor, 2026-10-31: "probably the bot being too good. i havent had that
feeling when playing myself" — a lean; a bot that plays like him would tell
(`ideas.md` → A bot that plays like Igor), and this waits on it (D189 (the
list's next five answered)).

### The Harpoon over the Gun in the mid-to-late game
Known on purpose, D182 (the Harpoon a railgun): `npm run measure weapons`
on its build and D183 (the Harpoon's top fires faster)'s, ten seeds, reads the Harpoon faster by more than 5% and
cheaper by more than 10% in hearts than the Gun over layers 2 and 3, at no
fewer clears (`roadmap.md` → Health), so `npm run balance`'s no weapon
dominating (D127 (the tuned numbers)) fails on "Harpoon over Gun". Not run
whole; on Igor's word (D132 (full runs on Igor's word)).

What should happen: no weapon better than another at everything there.
Why: the Gun's slow shot misses the eel's sway most — four of every five of its
layer-3 hits are eels'. The eel's sway is slower since D187 (the eel's sway
slower; its path taken back), measured unfitted before it was built: it
halves the late Gun's eel hits and nearly doubles its hearts where a career
meets layer 3 (`roadmap.md` → Health). Whether the bar holds now is not
measured; on Igor's word (D132 (full runs on Igor's word)).
