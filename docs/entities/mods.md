# Mods

Every mod: what it does, its numbers and its card text. The table mirrors
`MODS` in `game/content.js`, and `npm test` fails when the two disagree.

A mod is a dive-scoped power, gone at the end of the dive. A glowing fish
carries one in every batch but a boss's or a mini-boss's, and a layer end
offers a pick of valuable mods.
Momentum, not strategy (`foundations.md` → the glossary). How a fish lights
up, what it carries and how the pick works is `design.md` → Mods: the glowing
fish and the layer end's pick.

## Roster

| name | scope | desc | max | end | per pick | at max |
|---|---|---|---|---|---|---|
| Fins | body | you swim faster | 3 | — | speed +45 | speed 395 |
| Vitality | body | one more heart, it comes full | 3 | — | hp +1, maxHp +1 | hp 6, maxHp 6 |
| Reflex | body | the dash comes back sooner | 3 | — | dashCooldown -0.4 | dashCooldown 1 |
| Nerve | body | hits leave you safe longer | 3 | — | iframes +0.3 | iframes 1.9 |
| Impact | body | the dash wounds what it throws | 3 | — | dashDamage +1 | dashDamage 3 |
| Mend | comfort | a heart back each batch | 1 | true | mendOnClear +1 | mendOnClear 1 |
| Barbs | weapon | harpoons go through one more | 3 | — | pierce +1 | pierce 5 |

**per pick** is what taking it once changes; **at max** is the stat after
`max` of them, from the starting kit — the diver carrying the Gun, or for a
weapon mod the first weapon it fits, before any tier or attribute. Both are worked out from `apply` by the check, so they
cannot advertise a number the mod does not deliver. A layer end's card gives an
ordinary mod `END_STEP 2` picks at once. Every number is S6 (balance)'s to tune.

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key and the card's title. A saved dive keeps its mods, the cards on offer and the round of fish-carried mods by name, and a scenario's kit names them, so renaming one breaks all three. |
| `scope` | — | `body`: a stat of the diver, worth the same whatever weapon is carried. `comfort`: feel and friction, near-zero balance risk. `weapon`: a mod that fits only some weapons, named in `weapons` (D31 (two-tier progression), D99 (weapon mods, and more boosts)). It changes the carried weapon's numbers on the player like any mod. A check holds every mod to these three, and a weapon mod to naming real weapons. |
| `desc` | — | The card's one line, and the pickup line's. A kind, not a degree: a pickup has to be felt and recognised mid-fight (D34 (mods), D84 (mods are dropped)). A check holds it inside the card's width. |
| `max` | picks | How many times one dive can take it (D69 (every mod capped)): a switch caps at 1, anything that stacks at 3. No fish carries a mod at its max, and no layer end offers one without room for what its card gives. Where the caps sit is S6 (balance)'s. |
| `end` | — | `true` marks one of the layer end's own mods (D85 (the layer end's pick)): offered only on its cards, once a card, and never carried by a fish. Without it the mod is ordinary — carried by fish, and on a layer end's card at the bigger step, `END_STEP` picks at once. |
| `weapons` | — | The weapons a `weapon`-scoped mod fits, by name (D83 (the weapon record)): it is dealt — by a glowing fish or on a layer end's card — only while one of them is carried (D99 (weapon mods, and more boosts)). |
| `apply` | — | What one pick does to the player, `p => …`. It adds on top of gear and attributes and never multiplies (D74 (mods on top of gear and attributes)). The "from → to" rows on a card and on the pickup line are worked out from it, at most `MOD_ROWS 2` of them. |

## Fins

Swim speed. It does not lengthen the dash: dash reach has been its own stat
since D56 (the dash is a fixed, committed lunge).

## Vitality

One more heart, and it arrives full.

## Reflex

The dash comes back sooner. The real multiplier on the dash — both its kills
and its invulnerable uptime grow with it (measured in `roadmap.md` → Health,
the dash build; the analysis is `ideas.md` → the dash economy).

## Nerve

Longer invulnerability after a hit.

## Impact

The dash wounds what it throws. The dash always shoves; hurting what it shoves
is bought, a point of `dashDamage` a pick (D51 (the dash is bought)). `body`
rather than `weapon`, because the dash is weapon-agnostic. Past its first pick
it matters only against enemies with more than one hit point.

## Mend

Comfort, and the first of the layer end's own mods (D85 (the layer end's
pick)): a heart back each time a batch is cleared, never past full. Claude's
pick for the first valuable mod — the one switch in the pool, and "a heart back
each batch" reads as worth a double step. A standing effect rather than a stat
— `clearBatch()` reads `mendOnClear`. The last layer's end pays nothing, Mend
included (D68 (the layer end is a milestone)).

## Barbs

The first weapon mod (D99 (weapon mods, and more boosts)): the Harpoon's shot
goes through one more fish a pick. A mod of the Harpoon's own kind — it
already passes through two — so it is dealt only while the Harpoon is carried;
with the Gun or the Knife no fish carries it and no card offers it. Its
numbers are Claude's picks, S6 (balance)'s to tune.

## Adding one

1. A line in `MODS`: `name`, `scope`, `desc`, `max`, `apply` — and `end: true`
   for one of the layer end's own, written to be worth about a double step of
   an ordinary mod, since the two kinds share the layer end's cards (D85 (the
   layer end's pick)). Anything a mod raises must be a field of
   `PLAYER_START`, not a bare constant — a line of data cannot edit a `const`
   (D34 (mods)).
2. A row in the roster and a section here under its `name`. `npm test` fails
   until both match the code.
3. The checks that then hold it: a unique name, `scope` body or comfort — or
   weapon, naming real weapons in `weapons` — `max`
   an integer of at least 1, the card text inside the card, at most `MOD_ROWS`
   stats moved — and every stat it moves shown on the development readout
   (`PLAYER_STATS`), so a new stat needs its line there.

Ideas for more wait in `ideas.md` → Mod ideas.
