# Boosts

Every boost: what it adds, for how long, and its line. The table mirrors
`BOOSTS` in `game/content.js`, and `npm test` fails when the two disagree.

A boost is a short power a kill drops (D86 (boosts)): switched on by touching
it, gone after a few seconds, and gone from the floor if left lying. Not a mod
— not counted, no cap, nothing kept (`foundations.md` → the glossary). When one
drops and how it runs is `design.md` → Mods: the glowing fish and the layer
end's pick, its **Boosts** paragraph.

**A boost keeps each weapon's nature** (D125 (boosts keep each weapon's
nature)). One that any weapon can get adds to no weapon's number — it raises
one only by a `percent` of it, so every weapon gains the same share and the
weapons stay in the order they were; it is tuned once, not once per weapon. A
boost that means something only on one weapon is that weapon's own, dropped
only while it is carried, as a weapon mod is dealt (D99 (weapon mods, and more
boosts)).

## Roster

<!-- generated: boosts -->
| name | desc | time | swingDesc | for | adds |
|---|---|---|---|---|---|
| Rush | you swim much faster | 5 | — | any | speed +200 |
| Frenzy | you fire much faster | 5 | you swing much faster | any | fireRate +100% |
| Lance | your shots go through | 5 | — | Gun | pierce +4 |
| Bloom | your shots splash | 6 | your cuts splash | any | splash +36 |
<!-- /generated -->

**for** is read off `weapons`, **adds** off `add` and `percent`. Every number
is Claude's pick, held by `npm run balance` (D127 (the tuned numbers)).

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key, and the first word of the pickup line. A saved dive keeps the boosts running and those on the floor by name. |
| `desc` | — | Its one line, shown as it is touched. A kind, not a degree, like a mod's. |
| `swingDesc` | — | Its line instead while the weapon carried swings rather than shoots — the Knife (D105 (the Knife swings)) — for a `desc` that speaks of shots. Left out, `desc` serves every weapon. |
| `weapons` | — | The weapons it is dropped for, as a weapon mod's are dealt; left out, every weapon. |
| `time` | s | How long it runs once touched. Touched again while it runs, its clock grows by `time` again, with no ceiling; its numbers are not added twice, and no other boost's clock moves (D204 (a boost touched again adds its time)). |
| `add` | — | What it adds to the player while it runs, `{ stat: amount }` — numbers, not a function, so the same amounts come off when `time` runs out. It adds on top of everything else (D74 (mods on top of gear and attributes)). Never `hp`, which could not be taken back cleanly, and — for a boost every weapon gets — never a weapon's number. |
| `percent` | % | What it raises by a share while it runs, `{ stat: percent }` of the player's own number as it is touched — a weapon's number every weapon has above zero, since a share of nothing is nothing. What it added runs with it and is what comes off. |

## Rush

Swim much faster, for five seconds. The first boost, Claude's pick: a body
stat, so it fits every weapon, and one that is felt at once.

## Frenzy

Fire twice as fast, for five seconds: the weapon's own rate doubled, so the
slow Harpoon is still the slowest while it runs (D125 (boosts keep each
weapon's nature)). Raised by a flat number it squeezed every weapon into one
band. With the Knife it swings twice as fast, and says so.

## Lance

The Gun's own: its shots go through four more fish, for five seconds — a crowd
turns into a line to shoot down. The Harpoon and the Knife already go through
fish, so on them it would only be more of the same, and it never drops for them
(D125 (boosts keep each weapon's nature)).

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

## Adding one

1. A line in `BOOSTS`: `name`, `desc`, `time`, and `add` or `percent` — and
   `swingDesc` if `desc` speaks of shots, which the Knife does not fire.
   Anything it adds must be a field of the player — `PLAYER_START`, or the
   carried weapon's numbers — since it is added to and taken back off the
   player. Moving a weapon's number, it is a `percent` of one every weapon has,
   or it names its `weapons`; `npm test` holds this.
2. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test`
   fails until both match the code.
3. Every stat it moves shown on the development readout (`PLAYER_STATS`), so
   the change can be watched while it runs.
