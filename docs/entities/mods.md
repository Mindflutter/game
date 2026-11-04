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

<!-- generated: mods -->
| name | scope | desc | max | end | per pick | at max |
|---|---|---|---|---|---|---|
| Fins | body | you swim faster | 6 | — | speed +45 | speed 530 |
| Vitality | body | 1 more max HP, it comes full | 6 | — | hp +1, maxHp +1 | hp 9, maxHp 9 |
| Reflex | body | the dash comes back sooner | 3 | — | dashCooldown -0.4 | dashCooldown 1 |
| Nerve | body | hits leave you safe longer | 3 | — | iframes +0.3 | iframes 1.9 |
| Impact | body | the dash wounds what it throws | 3 | — | dashDamage +1 | dashDamage 3 |
| Mend | comfort | 1 HP back each batch | 1 | true | mendOnClear +1 | mendOnClear 1 |
<!-- /generated -->

**per pick** is what taking it once changes; **at max** is the stat after
`max` of them, from the starting kit — the diver carrying the Gun, before any
tier or attribute. Both are worked out from `apply` by the check, so they
cannot advertise a number the mod does not deliver. A layer end's card gives an
ordinary mod `END_STEP 2` picks at once. Every number is Claude's pick; the
caps of `Fins` and `Vitality` are tuned to the pillars (D127 (the tuned numbers)),
and the dash's, `Reflex` and `Impact`, wait on its discussion (`ideas.md`).

## Fields

| Field | Unit | Meaning |
|---|---|---|
| `name` | — | The key and the card's title. A saved dive keeps its mods, the cards on offer and the round of fish-carried mods by name, and a scenario's kit names them, so renaming one breaks all three. |
| `scope` | — | `body`: a stat of the diver, worth the same whatever weapon is carried. `comfort`: feel and friction, near-zero balance risk. No mod is a weapon's own: mods stay apart from the weapons (D208 (Barbs and Lance removed)). A check holds every mod to these two. |
| `desc` | — | The card's one line, and the pickup line's. A kind, not a degree: a pickup has to be felt and recognised mid-fight (D34 (mods), D84 (mods are dropped)). A check holds it inside the card's width. |
| `max` | picks | How many times one dive can take it (D69 (every mod capped)): a switch caps at 1, anything that stacks at 3 or 6. No fish carries a mod at its max, and no layer end offers one without room for what its card gives. Where the caps sit is a balance pass's, last set by S6 (balance) (D127 (the tuned numbers)); whether they go is open (`ideas.md`). |
| `end` | — | `true` marks one of the layer end's own mods (D85 (the layer end's pick)): offered only on its cards, once a card, and never carried by a fish. Without it the mod is ordinary — carried by fish, and on a layer end's card at the bigger step, `END_STEP` picks at once. |
| `apply` | — | What one pick does to the player, `p => …`. It adds on top of gear and attributes and never multiplies (D74 (mods on top of gear and attributes)). The "from → to" rows on a card and on the pickup line are worked out from it, at most `MOD_ROWS 2` of them, each stat named in words from `STAT_NAMES`. |

## Fins

Swim speed. It does not lengthen the dash: dash reach has been its own stat
since D56 (the dash is a fixed, committed lunge).

## Vitality

1 more max HP, and it arrives full.

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
pick)): 1 HP back each time a batch is cleared, never past full. Claude's
pick for the first valuable mod — the one switch in the pool, and "1 HP back
each batch" reads as worth a double step. A standing effect rather than a stat
— `clearBatch()` reads `mendOnClear`. The last layer's end pays nothing, Mend
included (D68 (the layer end is a milestone)).

## Adding one

1. A line in `MODS`: `name`, `scope`, `desc`, `max`, `apply` — and `end: true`
   for one of the layer end's own, written to be worth about a double step of
   an ordinary mod, since the two kinds share the layer end's cards (D85 (the
   layer end's pick)). Anything a mod raises must be a field of
   `PLAYER_START`, not a bare constant — a line of data cannot edit a `const`
   (D34 (mods)).
2. A section here under its `name`; `npm run docs` writes its rows from the code (D133 (the doc tables write themselves)); `npm test`
   fails until both match the code.
3. The checks that then hold it: a unique name, `scope` body or comfort, `max`
   an integer of at least 1, the card text inside the card, at most `MOD_ROWS`
   stats moved — and every stat it moves shown on the development readout
   (`PLAYER_STATS`) and named in words in `STAT_NAMES`, for its card and its
   pickup line, so a new stat needs a line in both.

Ideas for more wait in `ideas.md` → Mod ideas.
