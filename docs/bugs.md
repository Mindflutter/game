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

### A key stays held after it is let go
Igor, 2026-10-28, in the first Sonar play-test: "something broke, i can't
swim up, probably browser window touched, and somehow affected", then "now
i can, it fixed somehow". The recording (`logs/sonar/2026-10-28-suit-on/1/`)
shows `KeyS` held from 119.9s to 148.8s with no key-up ever arriving, and no
blur and no Cmd at the moment it stuck: W against a held S cancels out. It
let go at 148.8s, when Cmd and the window losing focus cleared every key, as
`platform/input.js` does on purpose.

What should happen: a key let go is let go. Why the browser sent no key-up is
not found yet. A guess to check: a trackpad gesture or a click on the
window's own frame, which can swallow a key-up without taking the focus. The
next time, Sonar has it on record.
