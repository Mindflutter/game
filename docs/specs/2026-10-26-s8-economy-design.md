# S8 (the economy: gems and points) — design

2026-10-26. S8 (the economy: gems and points): what gems and points earn and
buy, re-paced. Igor, opening it: "close s7, check plan and ideas, decompose
into tasks, start working on what can be done"; on the shape: "proceed with
recommended". Every call below not quoted from Igor or a decision is
**Claude's**, marked so, and his to reopen. Once built this spec is history;
where it and a decision disagree, the decision wins.

## Taken as settled

- **The problem**, Igor playing the alpha: "point upgrades come easy, at
  first run i earned 12 points, reached mid layer 2. i couldnt get enough gems
  for any purchase, except a gun upgrade. gotta do something with upgrade
  system. really major issue. maybe even rework the whole gem&points system,
  very imbalanced. footwork still makes no sense".
- **The shape: two currencies, both re-paced** — Igor took the recommended of
  three (two re-paced, one currency, points every dive). Gems buy gear,
  points buy attributes, as D36 (attributes) and D109 (micro-tasks are
  ladders; steps cost more as they rise) have them: points come only from
  challenges, gems buy no points, a challenge is a visible, deliberate ladder,
  and no point takes "TOO MUCH grind".
- **The pillar it answers to**: "Addictive, not grindy" — the first
  meaningful purchase within three dives (`foundations.md` → Pillars).

## The economy as it stands

Measured 2026-10-26 (`roadmap.md` → Health): five fresh saves, ten dives each,
the diver bot with the Gun.

- **Gems come late.** A first dive earns 99–723, enough for the Gun's first
  tier (240) and sometimes the Mask's (400). A dive to the last gate earns
  about 2,500, four to six times as much. Every tier of the Gun and the
  equipment, 15,280 gems, is bought by the ninth or tenth dive; after that,
  nothing is left to buy.
- **Points come early and stop.** The challenges pay 50 points ever: rung k
  pays k, four rungs each, five challenges. A first dive earns 5–23 of them;
  by the fifth, 32–39; then only the top rungs remain, and they pay out
  rarely. A step of an attribute costs its number (step n costs n points), so
  attributes stop growing by about the fifth dive.
- The two run on opposite curves: points front-loaded and capped, gems
  back-loaded and growing with depth.

## Open, asked one at a time

1. **The career's length** — answered, Igor, 2026-10-26: "do recommended".
   About 15 dives until everything is bought, gems and points running out
   together, around when a good player first wins a dive; every dive on the
   way pays for something in both.
2. **A first dive** — answered with the first: the Gun's first tier and a step
   or two of an attribute; about half the kit by the fifth dive.
3. **When everything is bought** — answered, Igor, 2026-10-26: "recommended".
   Gems keep no use: the career is done when the kit is, and what is left
   stays in the bank. A use for them is new content, past this stage
   (`ideas.md` → a second currency).
4. **Points across the career** — answered, Igor, 2026-10-26: "recommended".
   Longer ladders, about nine rungs a challenge, each a little harder, the
   first harder than today's; every rung pays one point; each attribute gets a
   ceiling, so "everything bought" exists. About 2 points a first dive, then
   about 3 a dive, about 45 over the career.
5. **`footwork`** — answered, Igor, 2026-10-26: "recommended to all", as the
   rest below. Replaced by a challenge that pays for dashing well.
6. **The rungs on ten-gate layers** — answered with the fourth: the new
   ladders are sized on today's dive, ten gates a layer.
7. **The gems' curve.** Igor asked, 2026-10-26: "planning to make purchases
   cheaper?"; taken as recommended: the total stays about the same —
   about 31,000 gems by the fifteenth dive on the bot's figures, against 25,280
   for everything — and the curve changes: cheaper first tiers, dearer top
   ones, gems growing less steeply with depth only if prices alone fall short.

## The design

- **Five challenges**, `footwork` replaced by **`bowling`** — "dash through N
  fish at once": the fish one dash shoves, each counted once, as the dash
  already hits each fish once (D50). A ladder like the rest, in any layer, a
  hand-placed fish counting for none. The name is Claude's.
- **Nine rungs a challenge, each paying one point**: 45 points ever. Each
  rung a little harder than the one under it, the first harder than today's.
  Sized on the career bot (`roadmap.md` → Health) to about 2 rungs a first
  dive and about 3 a dive after, the top rungs past the bot, for a player's
  skill. Numbers, Claude's.
- **Each attribute stops at five steps**; step n still costs n points, so the
  three attributes' fifteen steps cost the 45 the ladders pay.
- **Gems: the curve, the total a little up.** First tiers cheaper, so a first
  dive buys two or three things; top tiers dearer, so everything — all three
  weapons, their tiers and the equipment — is bought around the fifteenth
  dive, the kit of one weapon by about the ninth. Everything costs 30,650,
  from 25,280. Gems per depth unchanged: the prices alone fit. Numbers,
  Claude's, from the career bot.
- **The save goes to version 13**: `footwork`'s rungs go; every other
  ladder's rungs are re-counted by the threshold its old top rung marked, so
  an old easy rung below the new first pays none; every step comes back as
  points, and the player raises again at `home`.
- **Shown as now**: nine badges a ladder under the Attributes screen's rows
  and the pause menu's, each next rung's ask, the header saying a point a
  rung; an attribute at its top reads so.
- **Built** as D152 (nine rungs a ladder, a point a rung); the figures are
  `roadmap.md` → Health.

## Checked against `foundations.md` and `plan.md`

- **Addictive, not grindy** (≤ 3 dives to the first meaningful purchase): a
  first dive buys two or three things — the stage's point.
- **Easy layers stay relevant**: `swift` still pays a fast clear of any
  layer.
- **No mechanic needs more than a sentence**: `bowling` is one.
- **The glossary**: a point is still paid by a rung, once, ever; a step is
  still a point dearer than the last; a challenge still rewards mastery, not
  quotas — `bowling` counts one dash's feat, never a running total.
- **Alpha counts**: five challenges and three attributes, unchanged.
- **Three tiers, summed** (rule 4): gear and attributes still sum; points
  still buy no gear and gems no points.
- **`plan.md`**: the stage's three tasks; the exit is Igor's play and the
  career bot's figures.
- **Found**: no contradiction.
