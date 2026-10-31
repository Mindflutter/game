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

**A logged play-test** (D163 (the career log)): `npm run play`, then
`http://localhost:8765/`. Every dive's end writes the career so far, a dive a
line, to `logs/career.json` (ignored by git): seed, how it ended, time, gates
cleared, gems, kills, mods, the kit and points it ended with, what `home`
bought before it, in order and with its price, and its story —
every gate met, with its fish, arrival, time, hits and what dealt them, the
guard, HP, kills, shots, dashes, boosts and mod. `logs/clock.txt` has the wall
clock each dive came in at. Its save is its own — the browser keeps one per
address.

**A Sonar play-test** (D164 (Sonar)): Claude writes one and gives its link;
you run `npm run play` and open `http://localhost:8765/?sonar=<id>`. The
corner tag says it is recording and when its limit is met. Every play is
recorded whole — reload or play it again and that is a play of its own — and
your save is never touched. Claude reads it with `npm run sonar <id>`; a
moment of it is drawn at `…/logs/<id>/<play>/build/index.html?replay&at=<tick>`.

## Run the tests

Two suites, because they reach different things, and the balance checks beside them.

### Node — logic, invariants, the port seam

```bash
npm install     # once
npm test        # one run, well under a second
npm run test:watch
```

Property-based invariants over generated seeds: no `NaN` ever, hp stays in
bounds, the player stays in the view, a dive replays exactly from its seed, and
decay is time-based rather than frame-based. It also loads `game/` with only the
seven port-seam names stubbed, so reaching for an eighth fails the build on any
path a test drives.

### Balance — the pillars, measured

```bash
npm run measure careers   # or bots, threat, pillars, weapons: tables
npm run measure weapons L3,Knife2,Mask3   # each weapon at a kit written as a debug code
npm run measure fit       # resizes every pool batch to the threat curve; `fit 3`, layer 3 alone
npm run docs              # writes the entity docs' number tables from the code
npm run balance           # the pillars as checks, ten seeds, under a minute
```

A diver bot plays every gate at the kit a career first meets it with, and the
checks hold the pillars in `docs/foundations.md` (D128 — The diver bot and the
balance suite). Each seed runs in a worker thread of its own. The figures are
`docs/roadmap.md` → Health.

`test:watch` is the one to leave open while editing `game/`.

### Browser — the scripted checks

```bash
npm run play
```

Then open **`http://localhost:8765/index.html?test`** and read the console. The
last line is the verdict: `N checks passed` in green, or `N of M checks FAILED`
in red with each failure listed under it.

This suite covers what Node cannot reach — audio levels, canvas, and real
keyboard events through the input layer, including non-Latin layouts.

> `?test` is matched **exactly**, so `?test&anything` deliberately runs nothing.
> That keeps a cache-busting query string from firing the suite by accident.

> Hard-refresh (**Cmd+Shift+R**) after editing. The play server forbids caching, but
> several script tags mean a stale one serves a mix of old and new files, which
> produces baffling bugs.

## Debug mode

For playtesting by hand: **`index.html?debug`** opens a setup screen in place
of the title — the layer and gate, which fish and how many, the grade every fish of the dive arrives at, the weapon and its
tier, equipment, attributes and mods, immortal, one-shot and the seed. Pick
with the arrows or the mouse (Shift moves a value by five, and past either end
a value comes round to the other), then Dive.

In a debug dive, **R** plays the same setup again and **Backspace** goes back
to the setup screen; the pause menu and the end screens lead there too. It
starts muted — **M** turns the sound on — and it never reads or writes your
save.

The address bar keeps the setup as a code — `index.html?debug=L2,G7,S4471,Harpoon2,puffer4`
— so a URL pasted into an issue replays it exactly, seed and all. The fish set
replace the chosen gate's batch; the dive then runs on as drawn. The bright line
under the columns is the marked row's tip: what it is and what it changes —
a fish's behaviour and numbers, what a tier, point or pick adds, and why a row
is dim (Barbs goes only with the Harpoon).

## Scenarios

Named setups for looking at one thing at a time, on the same server:

| URL | What you get |
|---|---|
| `index.html?dev=one-drifter&play` | One enemy, nothing else arriving |
| `index.html?dev=one-archer&play` | One archer, nothing else arriving |
| `index.html?dev=one-puffer&play` | One puffer, nothing else arriving |
| `index.html?dev=one-eel&play` | One eel, nothing else arriving |
| `index.html?dev=one-lionfish&play` | One lionfish, nothing else arriving, carrying the Knife |
| `index.html?dev=harpoon&play` | A dive from the top, carrying the Harpoon |
| `index.html?dev=knife&play` | A dive from the top, carrying the Knife |
| `index.html?dev=all-types&play` | Every ordinary enemy type, in a row |
| `index.html?dev=late-swarm&play` | Several batches into the dive |
| `index.html?dev=mini-boss&play` | The first mini-boss, and its escorts |
| `index.html?dev=last-batch&play` | The last layer's boss and its crowd, then the bottom — the win |
| `index.html?dev=layer-2&play` | The top of the second layer, carrying a kit of fifteen mods |
| `index.html?dev=layer-3&play` | The top of the third layer, carrying a kit of sixteen mods |
| `…&seed=4471` | Any of the above as an exact, repeatable dive |

To combine arguments, the first goes after `?` and every later one after `&`,
in any order: `index.html?dev=last-batch&play&seed=4471`. `?test` is the one
exception — it runs only when it is the whole query. Immortality and one-shot
damage are rows of the debug mode's setup.

Drop `&play` and the scenario loads **frozen** — nothing advances until you call
`advance(30)` in the console. That is how the tests and the bot drive the game
faster than real time.

Scenarios are data in `game/content.js`; adding one is a line, and its row
here — `npm test` fails on a scenario this table does not list.

## Layout

```
index.html     the shell: canvas and the script tags, in load order
game/          the simulation. Zero browser API. This is what survives a port.
platform/      input, audio, canvas. Rewritten on a port.
main.js        frame loop and boot
checks.js      the browser suite
tests/         the Node suite, the bot, the play server, Sonar's reader and its play-tests
logs/          the career log and Sonar's plays: ignored by git, safe to delete
docs/          design, decisions, plan, every enemy, mod, boost, weapon and piece
               of equipment -- start at foundations.md; docs/README.md
               says where everything else is
```

`game/` reaches into `platform/` for exactly seven names — the seventh,
`persist`, is the save's (D77). That seam is the
eventual port to a native executable, and `npm test` enforces it.

## Dependencies

**The game has none.** `index.html` loads no libraries and never will while the
current measurements hold. The only dependencies are Vitest and fast-check, used
by the Node suite and never shipped.
