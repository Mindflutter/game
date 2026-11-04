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
With D207 (boosts of new kinds) and D208 (Barbs and Lance removed): 25
batches stood through, `npm run measure bars`, ten seeds. Crowds that close
round the diver, D205 (crowds that move like fish): 30. Before them,
`npm run balance`, 2026-11-04, ten seeds, the D199 (the bars, printed)
build: 37 batches past the opening stood through on more than one seed in
ten — 6 in layer 1, 7 in layer 2, 24 in layer 3, up from 12 there; the eel's
slower sway, D187 (the eel's sway slower; its path taken back), unfitted,
the likeliest move. Before:
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

### The Harpoon over the Knife in the mid-to-late game
`npm run balance`, 2026-11-04, ten seeds, the D199 (the bars, printed)
build: no weapon dominating (D127 (the tuned numbers)) fails on "Harpoon over
Knife" — faster by more than 5% and cheaper by more than 10% in hearts over
layers 2 and 3, at no fewer clears (`roadmap.md` → Health). "Harpoon over
Gun", known on purpose since D182 (the Harpoon a railgun), is gone: the eel's
slower sway, D187 (the eel's sway slower; its path taken back), cut the Gun's
layer-3 hearts from 3.45 to 2.04 a fight.

What should happen: no weapon better than another at everything there. Igor,
2026-11-04: "most likely leave as is. i'm quite happy with balance at this
point" (D188 (the list's first five answered)). Left.
