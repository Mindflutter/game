# What the books say, applied to Abyss

The most important ideas from the reading on economy and balance, mapped onto
Igor's play report of 2026-10-27 (`ideas.md` → the economy, the bosses, the
archer). Ideas only, no verdicts: what to build is decided with Igor.

Sources, cited by short name and page:

- **GB** — Schreiber & Romero, *Game Balance* (2021): ch. 10 Combat, ch. 11
  Progression in PvE Games.
- **GM** — Adams & Dormans, *Game Mechanics: Advanced Game Design* (2012):
  ch. 6 feedback structures, ch. 11 progression mechanisms, appendix B patterns.
- **Cook** — Daniel Cook, [Value chains](https://lostgarden.com/2021/12/12/value-chains/) (2021).

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

## For the economy's shape

- **Two to four major feedback loops are enough.** Profile each one by speed
  and by return on investment, not just as "positive" or "negative" (GM 118,
  122).
- **A loop that spends income to raise income** (a dynamic engine) feels slow
  at first, then accelerates. It needs friction or escalation against it
  (GM B-4).

## Not read, and why

- **GB ch. 6 (economic systems):** mostly player-driven markets and inflation;
  Abyss has a fixed, single-player economy.
- **GB ch. 4 (curves):** a reference for when there are numbers to set.
- **Game Maker's Toolkit, [Roguelikes, Persistency, and
  Progression](https://amara.org/v/C3BEW):** the transcript sits behind a
  login. GB 271–2 and 284 cover its main point: in a roguelike, skill carries
  across runs, and unlocks give progress without grind.
