# Abyss

A 2D action roguelite. You dive into a layered abyss, fight sea creatures, and
surface to spend what you found on gear.

Work in progress. The design lives in [`docs/foundations.md`](docs/foundations.md)
— read that first — and the stage we are on is in [`docs/plan.md`](docs/plan.md).

## Run it

**Double-click `index.html`.** No build step, no install, no server. That is a
hard constraint, not a convenience.

WASD or arrows to move, mouse to aim, **hold left mouse to shoot**, `Space` to
dash, `Esc` for the menu.

## Run the tests

Two suites, because they reach different things.

### Node — logic, invariants, the port seam

```bash
npm install     # once
npm test        # one run, well under a second
npm run test:watch
```

Property-based invariants over generated seeds: no `NaN` ever, hp stays in
bounds, the player stays in the view, a dive replays exactly from its seed, and
decay is time-based rather than frame-based. It also loads `game/` with only the
seven port-seam names stubbed, so reaching for an eighth fails the build.

`test:watch` is the one to leave open while editing `game/`.

### Browser — the scripted checks

```bash
python3 serve.py 8222
```

Then open **`http://localhost:8222/index.html?test`** and read the console. The
last line is the verdict: `N checks passed` in green, or `N of M checks FAILED`
in red with each failure listed under it.

This suite covers what Node cannot reach — audio levels, canvas, and real
keyboard events through the input layer, including non-Latin layouts.

> `?test` is matched **exactly**, so `?test&anything` deliberately runs nothing.
> That keeps a cache-busting query string from firing the suite by accident.

> Hard-refresh (**Cmd+Shift+R**) after editing. `serve.py` forbids caching, but
> several script tags mean a stale one serves a mix of old and new files, which
> produces baffling bugs.

## Scenarios

Named setups for looking at one thing at a time, on the same server:

| URL | What you get |
|---|---|
| `index.html?dev=one-drifter&play` | One enemy, nothing else arriving |
| `index.html?dev=three-types&play` | All three enemy types, at known spots |
| `index.html?dev=late-swarm&play` | Several batches into the dive |
| `index.html?dev=mini-boss&play` | The first mini-boss, alone |
| `index.html?dev=last-batch&play` | The boss — the layer's last batch — then the layer end |
| `…&seed=4471` | Any of the above as an exact, repeatable dive |

Two dev flags work on any URL, with a scenario or without, and stay on after
R:

| Flag | What it does |
|---|---|
| `&immortal` | Nothing can hurt you |
| `&damage=<n>` | Every shot does `n` damage; a bare `&damage` is 100, one shot for anything |

To combine them, the first argument goes after `?` and every later one after
`&`, in any order: `index.html?dev=last-batch&play&immortal&damage`. Without a
scenario a flag leads: `index.html?immortal&damage=5`. `?test` is the one
exception — it runs only when it is the whole query.

Drop `&play` and the scenario loads **frozen** — nothing advances until you call
`advance(30)` in the console. That is how the tests and the bot drive the game
faster than real time.

Scenarios are data in `game/content.js`; adding one is a line.

## Layout

```
index.html     the shell: canvas and the script tags, in load order
game/          the simulation. Zero browser API. This is what survives a port.
platform/      input, audio, canvas. Rewritten on a port.
main.js        frame loop and boot
checks.js      the browser suite
tests/         the Node suite
serve.py       local dev server: no caching, threaded
docs/          design, decisions, plan -- start at foundations.md
```

`game/` reaches into `platform/` for exactly seven names — the seventh,
`persist`, is the save's (D77). That seam is the
eventual port to a native executable, and `npm test` enforces it.

## Dependencies

**The game has none.** `index.html` loads no libraries and never will while the
current measurements hold. The only dependencies are Vitest and fast-check, used
by the Node suite and never shipped.
