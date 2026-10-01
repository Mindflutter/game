# The weapon record — design

2026-10-01. Proposed by Claude in chat, approved by Igor ("approved"). The
decision is D83 (the weapon record); this spec holds its check against
`foundations.md` and the build. History once built — where the two disagree,
the decision wins.

Asked of the session by D80 (entity docs and mods from drops come first): what
a weapon is as data, how one is owned and equipped, its tiers, and where
weapon-scoped mods attach.

## Taken as settled

- Weapons are gear: bought at `home`, kept between dives (the glossary).
- Each has upgrades of its own — "each weapon may have upgrading branches of
  its own" — and the player invests in the one that suits their style: "the
  player has a possibility to choose and put more upgrades to the one that fits
  his combat style preference" (`high level design.md`).
- Nothing is managed mid-dive (the genre contract, 6).
- A piece of gear may require an attribute — "heavy gun needs strength 5"
  (D36 (attributes)).

## The design

1. **A weapon is a line in `WEAPONS`**: `name`; the shot — `fireRate`,
   `damage`, `range`, `shotSpeed`, `shotRadius`, `pierce`; its own `tiers`.
   The Gun is the first line: its numbers leave `PLAYER_START`,
   `BULLET_SPEED` becomes its `shotSpeed`, and the shot radius hard-coded in
   `game/logic.js` becomes its `shotRadius`. `GEAR`, left with the equipment,
   is renamed `EQUIPMENT`.
2. **Owned and carried**: any number owned, one carried per dive, chosen at
   `home` between dives; no switching mid-dive. With one weapon there is
   nothing to choose, so it is built with the second, in S5 (content): a `cost`
   to own one — the Gun's is 0 — and the carried weapon's name in the save.
   Both are reserved in `entities/weapons.md` until then.
3. **Tiers**: each tier its own `cost` and `apply`, so a railgun's first can
   add rate and its second pierce. Equipment shares the shape.
4. **The carried weapon's numbers sit on the player** for the dive: copied when
   it starts, then its tiers, the equipment's tiers and the attribute points
   apply, and mods add on top. Mods, attributes, the readout and `&damage` work
   unchanged; everything adds, nothing multiplies.
5. **Weapon mods** are ordinary mods with `scope: 'weapon'` and a list of the
   weapons they fit, `weapons` — reserved until S5 (content) writes one. This
   supersedes D31 (two-tier progression)'s second argument to `apply`: with the
   numbers on the player there is no weapon to pass. How mods arrive is the
   mods-from-drops session's.
6. **Melee is first tried as data**: a very short, wide, piercing shot — a
   jab. A behaviour of its own only if that does not read as melee; Igor's
   call, in S5 (content).
7. **The save goes to version 2**: a v1 dive's player lacks a shot speed and
   radius, and gains the Gun's as they were in v1 — 430 and 4 — on load. The
   v1 fixture keeps loading; a v2 fixture joins it.

## Checked against foundations.md

**Glossary.** *gear*, *equipment*: a weapon is gear, equipment the rest — the
two tables. *tier*: three or four steps a piece of gear advances through —
each weapon's own, as before. *mod*: a weapon mod is a mod, capped like any.
*home*: the choice of weapon is made there, the one relaxed place. Nothing new
needs a term: "carried" is plain English, not a second word for a glossary one.

**Genre contract.** (2) LMB fires the carried weapon; the RMB secondary stays a
possibility — see friction 2. (4) Gear raises combat stats, adds to attributes
and mods, never multiplies; `requires` stays reserved for S5 (content).
(5, 6) Choosing happens at `home` only, so nothing interrupts combat and
nothing is managed mid-dive. (7) Content is data: this makes it true of
weapons, which until now it was not.

**Pillars.** One sentence explains it — pick a weapon at `home`; its upgrades
are its own. "No weapon strictly dominates" is S6 (balance)'s to measure, per
weapon.

**Technical contract.** The save is versioned, and this is its first migration.
Bullets are swept, so any `shotSpeed` is safe. The seam does not grow. `home`'s
rows come from the tables, and its fit check holds them as they grow.

**Non-goals.** Elemental weaknesses are not in the record. Gear and attributes
still sum.

**Plan.** S5 (content)'s entry asks for the weapon shape settled: this is it.

### Friction points

1. **D31 (two-tier progression)'s `apply(player, weapon)`** — never built, and
   superseded by point 5. Resolved by D83 (the weapon record).
2. **An RMB secondary** would need numbers of its own: the player holds one
   weapon's. Not committed; noted on its idea in `ideas.md`. Owner: whoever
   takes RMB up.
3. **Choosing in the bot and the scenarios.** S6 (balance) measures per weapon,
   so a scenario must be able to name the weapon carried. Owner: S5 (content),
   with the carried weapon's name.
4. **`home` with several weapons** — buying one, choosing it, and its tiers.
   Owner: S5 (content), with the second weapon.

## Build

1. Tests first, each failing without the work: the carried weapon's numbers
   reach the player and every shot; tiers of their own, the carried weapon's
   only; a v1 dive migrates and fires finite shots; a v2 fixture loads; the
   weapons and equipment docs rebuilt from the new tables.
2. `game/content.js`: `WEAPONS` with the Gun; `EQUIPMENT`; `PLAYER_START`
   without the Gun's numbers; no `BULLET_SPEED`; `home`'s rows from both
   tables.
3. `game/state.js`: `reset()` copies the carried weapon; tiers apply by their
   own `apply`; `SAVE_VERSION` 2 and the migration.
4. `game/logic.js`: shots from `player.shotSpeed` and `player.shotRadius`; the
   next tier's `cost`.
5. `checks.js` and the harness: the renamed tables.
6. Docs: `entities/weapons.md` and `equipment.md` as ordinary entity docs;
   `mods.md`'s reserved `weapons`; `design.md`; `plan.md`; `ideas.md`; D83;
   the changelog.
