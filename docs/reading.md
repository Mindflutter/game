# What the books say, applied to Abyss

The most important ideas from the reading on economy and balance, mapped onto
Igor's play report of 2026-10-27 (`ideas.md` → the economy, the bosses, the
archer) and his ask of 2026-10-30, every weapon tried. Ideas only, no verdicts: what to build is decided with Igor.

Sources, cited by short name and page:

- **GB** — Schreiber & Romero, *Game Balance* (2021): ch. 10 Combat, ch. 11
  Progression in PvE Games.
- **GM** — Adams & Dormans, *Game Mechanics: Advanced Game Design* (2012):
  ch. 6 feedback structures, ch. 11 progression mechanisms, appendix B patterns.
- **Cook** — Daniel Cook, [Value chains](https://lostgarden.com/2021/12/12/value-chains/) (2021).
- Web pages, mostly guides and interviews rather than designers' own
  writing, cited by link where used.

"Inference" marks a link to Abyss that the source does not make itself.

## The one idea under all the rest

**Progression cannot fix a core loop that isn't fun.** Grinding is accepted
only when doing more of the loop is a pleasure; rewards that are "not worth it
relative to the time" make players leave bitter (GB 291–2). And grind is not
difficulty: a tedious task is merely time-consuming (GB 255). So the order of
work is the loop first (the dive, the fights), the economy on top of it.

## Perceived difficulty has four knobs

What the player feels = (enemy power + skill challenge) − (player power +
player skill) (GB 255–6):

- **Enemy power**: more HP, damage, speed, count.
- **Skill challenge**: new behaviour, smarter enemies, new kinds of problem.
- **Player power**: stats and gear.
- **Player skill**: grows by itself with play.

Raising only enemy power makes a fight longer, not harder to think about. And
since skill grows on its own, the game must keep getting harder in some way
(GB 257).

## "Dives are long, useless and grindy"

- **Reward spacing.** Long stretches without progress make players feel they
  are "playing it wrong", even when they aren't. Many small gains spread out
  beat one big one (GB 281). Civilization keeps several goals open at once,
  staggered, so one is always a turn or two from done (GB 276–7).
- **Saving up for one big price has no texture:** you can either afford it or
  you can't; there is no resistance curve to feel (GB 280). A big fixed price
  standing in for a strong reward feels grindy (Cook).
- **Short first.** Early levels short, each a little longer (GB 274).
- **Failure should still pay something.** Keeping everything after a death
  softens it, but makes success "a function of time investment more than
  player skill". Modern roguelikes unlock new things on a death or a win
  (FTL), not just numbers (GB 284).
- **Draw the reward timeline.** Put every reward of a dive on a time axis and
  look for gaps (GB 284). Inference: the career bot can print the mean time
  between rewards of each kind.

## "Upgrades feel useless"

- **Options over numbers.** Stat boosts give power. The strong case is an item
  that opens new tactics, such as flying or flinging enemies into each other
  (GB 265–6).
- **Upgrades should be built on the core mechanic.** "If the game is about
  jumping, special jumping abilities should function as keys" (GM 251).
- **Value comes from what an action enables next.** A chain with a missing
  link feels pointless; trace the complaint back to that link (Cook).
  Inference: two of the three attributes, Dash reach and Strength, feed the
  dash, which is held still, and the gear tiers only add to numbers. Points and
  gems may buy little the player can feel.
- **Decide the feel first, then the math.** Settle how many hits a fight
  should take before choosing numbers (GB 226). Inference: an upgrade worth
  buying changes hits-to-kill or hits-to-die visibly.

## "Points are near impossible and don't pay off"

- **Extrinsic rewards can backfire.** A reward for non-trivial "good
  behaviour" can, long term, be antimotivational. Progression works best tied
  to what players already enjoy doing (GB 264).
- **Some styles reward more than others.** Feedback that grows a character
  toward the player's style works only if several styles are viable. Actions
  done often should pay less than rare ones (GM B-33).
- **Mastery feels further away than it is,** so a progress indicator helps
  (GB 255). A reward that is almost complete makes players take risks for it
  (GM 121).
- **Opt-in difficulty that pays.** Pirates! raises your share of the booty when
  you raise the difficulty. Bastion's and Transistor's toggled hazards pay
  extra money and XP, so players seek "their highest acceptable level of
  difficulty" (GB 287). That is mastery paid for without fixed skill gates.

## "Bosses are too easy and annoying"

- **A sponge raises only enemy power.** A foe whose only answer is a lot of HP
  leaves "no room for mastery" (GB 234, 255).
- **Long boss fights come from stages,** choreographed attacks that reveal
  weak points, not from HP. DOOM's Cyberdemon was meant to take two or three
  hits (GB 226–7, 231).
- **Degenerate strategies have to go.** Players optimise risk per kill, not
  fun. If one action works everywhere, the designer removes it or makes it
  the core (GB 245–6). Inference: standing near the boss and firing is that
  action.
- **Enemies as negative space.** Every enemy behaviour implies the player
  behaviour that beats it. Make that answer (1) fun to do, (2) one of several,
  or each enemy's own cool one, and (3) readable from what the enemy visibly
  does (GB 242).
- **The boss tests the layer's new tool.** A Zelda dungeon is built around the
  item won from its mini-boss, and that item beats the boss (GM 258).

## "The archer needs more threat"

- **Behaviour axes:** an attack for each range, a preferred distance (hang
  back or rush), abilities with matching weaknesses, and squad behaviour.
  DOOM's demons are weak alone and flank in groups. Give each enemy one to
  five traits, the most to rare ones (GB 230–2).
- **Make threats fair.** Telegraph them with enough lead time, leave room to
  evade, and let the player see afterwards what they could have done better
  (GB 233).
- **Push back.** Halo's enemies push back as hard as the player pushes, then
  ease off when the player retreats to cover (GB 244).
- **What the player ignores comes back worse.** In Super Crate Box, an enemy
  that reaches the bottom returns faster (GM B-25).

## "Try out and upgrade each weapon"

Igor, 2026-10-30: "for the future game expansion, we need to motivate the
player to try out and upgrade each weapon". Two careers won without ever
buying the Harpoon (`playtests.md` → Igor's first career). Sources beyond
the books are web pages, cited by link.

- **A dominant option is no choice.** Two swords alike but for damage is a
  "choice" with a clear best answer (GB 204–5). Doom Eternal's director built
  its weak points and ammo caps because one gun, Doom 2016's Super Shotgun,
  handled nearly everything, yet "we don't want to force people to use every
  single weapon … you can have your favorites"
  ([PC Gamer](https://www.pcgamer.com/doom-eternals-director-says-the-marauder-is-good-actually),
  [Shacknews](https://www.shacknews.com/article/116635/hell-razer-the-making-of-doom-eternal?page=8)).
  Inference: a reward for trying a weapon fails while one weapon is best at
  everything the player meets.
- **The cost of switching decides what wins.** Where weapons swap at once,
  a pile of specialists beats an all-rounder; make the swap dear and "a single
  general-purpose weapon may end up becoming more powerful than an entire
  suite of situational weapons" (GB 561–2). A specialist chosen before the
  player knows what comes is a blind guess (GB 565–6). Inference: Abyss sets
  the swap at its dearest — one weapon a dive, chosen at `home` before the
  batches are drawn (D97 (weapons are owned, and one is carried)) — so each
  weapon has to be worth a whole dive. Not equal in every fight: equal over
  a dive, with a different set of fights hard or easy, as two characters
  built differently meet "a different set of encounters" (GB 561).
- **A weapon changes how you play, not only how much.** Dead Cells' fifty
  weapons each ask a play of their own: the dagger is weak from the front and
  crits from behind, a sword crits while you are below half health; similar
  weapons were cut as redundant
  ([Game Developer](https://www.gamedeveloper.com/design/designing-each-of-the-50-weapons-in-i-dead-cells-i-to-feel-distinctive)).
  With "Options over numbers" (above): a tier that adds a way to play is felt,
  a tier that adds a number may not change a single hit to kill.
- **Pay for trying, without forcing it.** Hades marks one weapon before a run;
  carrying it pays more Darkness, the currency its powers are bought with.
  Revita does the same with coins or materials. Neither forces the switch;
  both make players "well-rounded with the game's mechanics"
  ([Game Rant](https://gamerant.com/revita-hades-roguelike-roguelite-weapon-diversity-currency-bonus-rotation/)).
- **Progress kept per weapon.** Returnal unlocks a weapon's traits, kept
  forever, by kills with it (10–15 for the first, more for each next,
  [PowerPyx](https://www.powerpyx.com/returnal-how-to-unlock-permanent-weapon-traits/)).
  Nuclear Throne keeps a golden weapon carried through a portal as that
  character's alternative start in later runs; doing so for every character is
  an achievement ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/NuclearThrone)).
  Rogue Company raises a gun's own mastery by challenges set for that gun
  ([Gamepur](https://vip-develop.gamepur.com/?p=216168)). Inference: a kill
  count is a quota, which D36 (attributes) rules out for points; a feat that
  needs the weapon's own nature is not.
- **Experimenting dies when it is dear.** Respec costs set too high made
  players stop trying builds at all; a small cut "led to a significant
  increase in … experimentation"
  ([Wayline](https://www.wayline.io/blog/respec-your-game-respecing-without-restarting),
  [GamesRadar on Path of Exile 2](https://www.gamesradar.com/games/action-rpg/path-of-exile-2-is-dropping-loot-more-generously-but-early-access-players-are-still-being-bankrupt-by-the-action-rpgs-high-respec-costs-why-am-i-being-punished-for-trying-out-things)).
  Inference: a weapon's tiers are its own, so trying a new one mid-career is
  a dive at tier 0 against a kit grown for another.
- **The game should outgrow a weapon.** Dead Cells' curve rises so that
  early weapons stop being enough, and "picks up along the way in order to
  force you to make that choice" (Game Developer, above).

## For the economy's shape

- **Two to four major feedback loops are enough.** Profile each one by speed
  and by return on investment, not just as "positive" or "negative" (GM 118,
  122).
- **A loop that spends income to raise income** (a dynamic engine) feels slow
  at first, then accelerates. It needs friction or escalation against it
  (GM B-4).

## Nova Drift, a game like this one

Igor, 2026-11-04: "analyze nova drift system, it seems like a similar game".
An Asteroids-like roguelite shooter by Chimeric, one developer, out of early
access in 2024: one ship, waves of enemies, a build grown through a run.
Read from guides, wikis and the developer's notes, not played.

What it does:
- **A level-up offers a hand of mods.** "The first mod is always a weapon
  mod, the second a shield, and the third a body type"; every mod after that
  changes one of the three ([guide](https://yuyxxus.pages.dev/posts/nova-drift-s-asteroid-roguelike-elements-explained)).
- **Mods sit in trees.** Taking one opens the next tier; a **super mod**
  needs two mods held, mostly two basic ones, and is not offered until both
  are ([JP wiki](https://seesaawiki.jp/novadrift-jp/d/%B6%AF%B2%BD%A5%E2%A5%B8%A5%E5%A1%BC%A5%EB%28MOD%29),
  [super mods](https://www.mejoress.com/nova-drift-super-mods-unlock-stats/)).
  The developer reshapes the trees between versions — three trees became
  Kinetics, Efficiency and Movement
  ([devlog](https://pixeljam.itch.io/nova-drift/devlog)).
- **Wild mods**: "wildly different buffs and debuffs", stacking each time
  taken, only ever offered at random, one of them able to bring more.
- **Rerolls**, dropped by enemies, replace the hand on offer.
- **Between runs**, every death pays experience to a level of the player's
  own, which unlocks more mods; challenge modes, unlocked by score or by
  missions, make a run harder for more experience — starting at wave 12,
  enemies' weapons and moves shuffled — and stack
  ([review](https://lordsofgaming.net/2025/05/nova-drift-review-a-unique-retro-rogue-lite)).

For Abyss — every line inference:
- **A tree that opens options, not numbers, barely moves the balance**, the
  answer to Igor's "i'm afraid to tweak the whole system" (D188 (the list's
  first five answered)). Nova Drift's level between runs makes no ship
  stronger; it widens what a run can be offered. A development tree here
  could spend points on a kind of thing — an ability, a weapon's top tier
  that adds a way to play, a mod let into the pool — each an option the
  balance already meets as content, rather than a number on the diver
  (`roadmap.md` → Development trees, analysed).
- **A super mod is the mod synergies' shape** (Parked): a combined mod in
  the layer end's pick only once its two parents are held — the one place
  Abyss offers a choice of mods, since fish carry theirs (D84 (mods are
  dropped), D85 (the layer end's pick)).
- **Wild mods are the trade-off mods** (Parked), offered where they can be
  refused: the layer end's pick again, never a fish's drop.
- **A reroll** could be a drop that redraws the layer end's pick.
- **The run's first three picks** — weapon, shield, body — are what
  Abyss settles at `home` with gear: nothing to take.
- **Challenge modes** are points from opt-in difficulty, which Igor
  dropped on 2026-10-31 (`ideas.md` → Declined): not proposed again.

## Studioigor's skills, a studio like this one

Igor, 2026-11-04: "expected outcome: repos analyzed, useful findings
incorporated into our project". Read 2026-11-04: [studioigor-skill](https://github.com/studioigor/studioigor-skill)
(its `SKILL.md`), [game-exp-skills](https://github.com/studioigor/game-exp-skills),
[ref2game](https://github.com/studioigor/ref2game), [3d-to-2d](https://github.com/studioigor/3d-to-2d)
and [studioigor-pipeline](https://github.com/studioigor/studioigor-pipeline),
from their pages; the other twenty-one are games, tutorials and model
comparisons. Ideas only; what to take is Igor's.

What Abyss already does the same way:
- **The human decides taste, the agent finds facts**; every play-tested
  mechanic gets "3–5 things to try" and the player's words verbatim — Sonar
  (D164 (Sonar)) and `playtests.md`.
- **A zero metric is no pass**, and **every defect becomes a check** —
  `code.md` → Verification, and the sonar skill's "a zero is checked before
  it is read".
- **A mechanic in its own test scene** — their *gym*, our debug mode and
  scenarios (D102 (the debug mode)).
- **Never push or publish unasked; the plan on disk** — `working.md`.

What it does that Abyss does not:
- **"The game comes first"**: its status warns when several steps in a row
  went to tests, docs or tooling rather than the game. Inference: Abyss's
  docs outweigh its code, and Igor has called its files "screwed again";
  a counter of the same kind would show the drift as it starts
  (`ideas.md` → The game comes first).
- **A gym has live sliders**: the mechanic's numbers tuned while playing.
  The debug mode sets a place and a kit, never a feel number (`ideas.md` →
  Feel numbers tuned live).
- **A blind A/B round** for what matters most — core feel, the first sixty
  seconds: two builds, unnamed, the player picks one before the key is
  shown. A Sonar play-test of two variants could be played so
  (`ideas.md` → A blind A/B play-test).
- **Agents never grade their own work**: one critic a round against a
  reference bar, not the builder judging. Abyss's bars are the bot's, and
  only Igor's play judges feel (`code.md` → "Game feel is Igor's call").
- **For art** (ref2game, 3d-to-2d): the image is painted, the code moves it —
  "glow, shadows, particles, text and water are never baked into an image";
  an actor is a cut-out rig with two-bone limbs, since "moving a whole
  sprite never counts as animation", its motion measured by a script; and a
  rigged 3D model can be rendered to a sprite sheet in the browser, a tool
  beside the game, not in it. All of it meets D195 (art in the browser)
  (`ideas.md` → Graphics, for its own work).
- **Polish waits on a slice**: "polish applied to a product 40% ready gives
  a beautifully polished 40%" — S9 (the balance rework)'s order already.

## Not read, and why

- **GB ch. 6 (economic systems):** mostly player-driven markets and inflation;
  Abyss has a fixed, single-player economy.
- **GB ch. 4 (curves):** a reference for when there are numbers to set.
- **Game Maker's Toolkit, [Roguelikes, Persistency, and
  Progression](https://amara.org/v/C3BEW):** the transcript sits behind a
  login. GB 271–2 and 284 cover its main point: in a roguelike, skill carries
  across runs, and unlocks give progress without grind.
