# Boosts

Every boost: what it adds, for how long, and its line. The table mirrors
`BOOSTS` in `game/content.js`, and `npm test` fails when the two disagree.

A boost is a short power a kill drops (D86 (boosts)): switched on by touching
it, gone after a few seconds, and gone from the floor if left lying. Not a mod
— not counted, no cap, nothing kept (`foundations.md` → the glossary). When one
drops and how it runs is `design.md` → Mods: the glowing fish and the layer
end's pick, its **Boosts** paragraph.

**A boost keeps each weapon's nature** (D125 (boosts keep each weapon's
nature)). It adds to no weapon's number — it raises one only by a `percent` of
it, so every weapon gains the same share and the weapons stay in the order
they were; it is tuned once, not once per weapon. Every boost drops for every
weapon: none is a weapon's own (D208 (Barbs and Lance removed)).

## Roster

<!-- generated: boosts -->
| name | desc | time | swingDesc | adds |
|---|---|---|---|---|
| Rush | you swim much faster | 5 | — | speed +200 |
| Frenzy | you fire much faster | 5 | you swing much faster | fireRate +100% |
| Bloom | your shots splash | 6 | your cuts splash | splash +36 |
| Surge | you dash again sooner | 6 | — | dashCooldown -60% |
| Jolt | the water round you jolts | 5 | — | every 1s, 2 to each fish within 90 px |
| Urchin | spines fly from you every way | 5 | — | every 0.6s, 12 spines of 1 over 240 px |
<!-- /generated -->

**for** is read off `weapons`, **adds** off `add` and `percent`. Every number
is Claude's pick, held by `npm run balance` (D127 (the tuned numbers)).

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the first word of the pickup line. A saved dive keeps the boosts running and those on the floor by name. |
| `desc` | — | Its one line, shown as it is touched. A kind, not a degree, like a mod's. |
| `swingDesc` | — | Its line instead while the weapon carried swings rather than shoots — the Knife (D105 (the Knife swings)) — for a `desc` that speaks of shots. Left out, `desc` serves every weapon. |
| `time` | s | How long it runs once touched. Touched again while it runs, its clock grows by `time` again, with no ceiling; its numbers are not added twice, and no other boost's clock moves (D204 (a boost touched again adds its time)). |
| `add` | — | What it adds to the player while it runs, `{ stat: amount }` — numbers, not a function, so the same amounts come off when `time` runs out. It adds on top of everything else (D74 (mods on top of gear and attributes)). Never `hp`, which could not be taken back cleanly, and — for a boost every weapon gets — never a weapon's number. |
| `pulse` | — | An effect of its own (D207 (boosts of new kinds)): every `every` seconds while it runs, each fish within `reach` px of the diver's body takes `damage` and is knocked away; a ring shows the reach. |
| `spines` | — | An effect of its own (D207 (boosts of new kinds)): every `every` seconds while it runs, `count` spines fly evenly round the diver from a seeded turn — each a shot of its own, `r` px, at `speed` px/s for `range` px, dealing `damage`. They are not the weapon's: a spine that misses breaks no `marksman` streak and splashes nothing at its end, and its kills pay no `skewer` or `sweep`. |
| `percent` | % | What it raises by a share while it runs, `{ stat: percent }` of the player's own number as it is touched — the diver's own, or a weapon's number every weapon has above zero, since a share of nothing is nothing. What it added runs with it and is what comes off. |

## Rush

Swim much faster, for five seconds. The first boost, Claude's pick: a body
stat, so it fits every weapon, and one that is felt at once.

## Frenzy

Fire twice as fast, for five seconds: the weapon's own rate doubled, so the
slow Harpoon is still the slowest while it runs (D125 (boosts keep each
weapon's nature)). Raised by a flat number it squeezed every weapon into one
band. With the Knife it swings twice as fast, and says so.

## Bloom

Your shots splash, for six seconds: a hit wounds every fish whose body is
within `splash` of the struck one's, for the shot's damage — a crowd most of
all (D125 (boosts keep each weapon's nature)). The splash does not knock, and a
fish it wounds splashes nothing on, so a crowd cannot chain. With the Knife each
cut splashes, and a Harpoon shot splashes at every fish it goes through — a
balance pass's to watch. A shot that strikes nothing splashes where its range
ends, and a cut that meets nothing just past its reach (D203 (a miss
splashes too)) — Igor: "i feel like shot splash should happen even if you dont
hit directly"; its `splash` half again as wide since, his "about 1.5". It
replaced a bigger shot, which only decided whether a
shot hit, when nearly every shot hits. Each splash shows its reach: a ring
grows from the struck fish's body out `splash` past it and fades in
`SPLASH_SHOW`, so whatever it touches is what it wounds. Claude's shape and
number.

## Surge

The dash comes back sooner — its cooldown 60% shorter, for six seconds. The
diver's own number, so it fits every weapon and moves none (D207 (boosts of
new kinds)). Claude's.

## Jolt

The water round the diver jolts once a second for five: every fish within
90 px of its body takes 2 and is knocked away, a ring showing how far. Not a
number but an effect (D207 (boosts of new kinds)) — Igor's "an explosion
round the diver". A crowd pressing in is thrown off; a fish that keeps its
distance is untouched. Claude's numbers.

## Urchin

Twelve spines fly from the diver every way, every 0.6 s for five seconds,
each dealing 1 at 240 px — Igor's "shots every way". Its own shots, not the
weapon's, so the Knife throws them too and the Harpoon's gain nothing of its
reach or its damage (D207 (boosts of new kinds)). It hits behind the diver
where the weapon cannot. Claude's numbers.

## Adding one

1. A line in `BOOSTS`: `name`, `desc`, `time`, and `add`, `percent`, `pulse` or `spines` — and
   `swingDesc` if `desc` speaks of shots, which the Knife does not fire.
   Anything it adds must be a field of the player — `PLAYER_START`, or the
   carried weapon's numbers — since it is added to and taken back off the
   player. Moving a weapon's number, it is a `percent` of one every weapon has;
   `npm test` holds this.
2. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test`
   fails until both match the code.
3. Every stat it moves shown on the development readout (`PLAYER_STATS`), so
   the change can be watched while it runs.
