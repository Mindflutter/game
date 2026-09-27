# high level design

### about this draft

a foreword explaining what this document is about, what it covers and what it doesn’t. boundaries of this draft are defined here.

what it has:

- basic coverage of setting, theme and and story take-off
- rules that we are striving to follow
- game structure description
- gameplay and mechanics basics and start-off points
- high-level description of home screen and levels

what it does not cover:

- storyline
- assets and visuals description
- sound design
- concrete item naming
- detailed and in-depth analysis of game mechanics, numbers or percentages

comment on the assets: since the design focuses on gameplay consistency, balance and alpha completeness, meaning that visuals and sounds are not too important. however, if reaching a good balanced playable small game is hard without providing assets (for example, enemies look too similar, levels are indistinguishable, whole experience is visually clumsy), then we will start working on assets. this is going to happen eventually any way, a matter of time and which development stage.

comment on definition of done: a playable version with 3-5 levels, 2-3 weapons, 2-3 equipment items, 5-7 types of enemies + bosses. each weapon & equipment have 3-4 upgrade levels. a simplistic currency system is implemented. all of the above is scalable. 

### the setting & the theme

you play as a diver (a kid), going deeper and deeper into a pit (abyss) with rogue sea creatures, starting from simple fish, down most weird ones as you progress. in a quest to find something valuable that you accidentally dropped say in your backyard pool that happened to be this otherwordly abyss. the lost item (?) would be something trivial, since the overall vibe of the game is humorous, yet with a very serious approach to this quest which makes it funny. the working title of this game is “the abyss”, but it’s subject to change from the serious vibe to something lightweight. detailed story will be developed later, as we are focusing on gameplay design in this draft.

the theme is clear: aquarium, sea, ocean, diving, fish and other water inhabitants. it is a fantasy story, so real creatures are just a baseline here. we are not restricted to real life references, therefore both player related stuff (equipment, perks, upgrades) and enemies are allowed to look, behave and be named as weird as we wish.

### the philosophy

this section is very generic. it’s about player ux, quality of life, game comfortability, involvement and general approach. call it the zen rules if you will. here is a list of fundamental points that we are trying to maintain within the scope of this project. 

- the game is a 2D roguelite
- the game is funny and a bit childish. it does not operate on heavy or complex concepts. it is straightforward.
- the game levels are dynamic and fast-paced. the only relaxed place is the home screen
- player movements are smooth and controlling the player is very responsive
- the game is scalable. it is possible to achieve a small playable version and then build up content and items upon this.
- balance is key in every aspect. nothing unbeatable, nothing too easy relative to a point in the game the player currently is.
- the game is addictive in a good sense. the player must have a desire to progress despite the repetitive gameplay (roguelite philosophy)

### base / home screen / high progressing design

layered in nature, the abyss is divided into parts. we start with 3-5 just for simplicity and being able to reach alpha version completeness. for every next level unlock the current level needs to be completed. it is not easy to reach the next level, as replaying a level is core mechanic of roguelite. levels unlock on a “main screen”. this is the root of gameplay, call it home or backyard with a pool or a garage (nicely fits for items storage). levels are hidden until unlocked. home screen has a function: buying equipment, weapons, upgrades, high-level perks. this is a core rpg-like mechanic of the game. you prepare for a dive there, choose a level and go. whether to choose a level on dive start or always start from the beginning — i’d allow to choose. already completed (thus simpler) levels go well with additional easy grinding, whilst recently unlocked provide a real challenge until the player is well-equipped. later on, passing through simpler levels fast (with certain time limitation) may reward the player and push towards upgrading, while keeping the interest in still going through the simple stage. this way easier levels do not go obsolete so fast.

### what a level is

a section of the pit / abyss that is filled with enemies. enemies either increase in number or grow stronger or new ones appear or all of the above as you dive deeper. you may think of it as initial survivor-like concept — what a game looks like at this point, before the high-level design. it has it’s own way simpler leveling-up system, which is unrelated to main screen and reset every time you enter — just like initial standalone survivor concept has. while going through the level, it is clear that a player moves downwards, since this is a dive. we leave a possibility to make it more sophisticated terrain with cliffs and caverns, but now we focus on a simple vertical design. a generic background animation or a section of a level — a discrete “screen - down - screen” or a smooth constant motion downwards (?). i’d pick smooth. 2-3 mini-bosses along the way, main boss at the bottom (end of the level). after a level is complete — main screen or next level immediately or choose (?). inclined to choose. 

### weapons & perks & upgrades & attributes

the section may be further divided into separate section as the design progresses. this is about player progression on the main screen, levelling up, upgrading weapons & equipment. baseline points here: balance is key, items and upgrades are scalable (we start with few with an ability to add more and more), items are cool, sensible for level progression, desirable to purchase, play an important role in player involvement. progression is slow as per the genre standards, but we’d like to avoid too much grinding too. this is a big part of gameplay design, a lot of work towards balance must be done considering this section.

purchased by spending currency, equipment and weaponry is a variety of items that can be upgraded in various ways. for example, a diving suit, a mask, flippers, all sorts of trinkets around the theme. additionally, there may be constant collectibles found within a level, which contribute either to player stats or to the story or both (?). 

weapons are diverse. there can be melee type weapons, ranged, launching slow projectiles or an extra fast railgun-like type. each weapon may have upgrading branches of its own and it should be clear that in mid to late game there should be no clear separation of superiority of one weapon over the other. instead, the player has a possibility to choose and put more upgrades to the one that fits his combat style preference. it is also possible that later on in the future we can advance to a mechanic that certain enemies are weak or resistant to a certain type of enemies. at the initial stage it feels like too much, so we just record the potential development opportunity. weapons may or may not be strictly related to the game theme. weapons trigger via lmb, later on adding a secondary attack via rmb is possible.

player attributes are personal points from standard rpgs. probably not purchased via currency, but rather earned via achieving micro tasks during a dive. for example, killing a certain enemy type (?) kind may contribute to strength, speed or base damage. once again, balance is key, so attributes need to be capped at some point. for example, cant earn more strength until level 2 is complete. not limited to this.

### enemies and enemy ai

just like weapons, enemies are diverse not only in their type variety, but also in their behaviour. and just like with equipment and weapons, we start with a few basic ones, making it scalable, gradually increasing the variety while maintaining the overall balance. the game theme (sea, ocean, diving) allows us to create a large number of visually different and interesting enemies, but the gameplay point here is their ai / behaviour. potentially i sense a big challenge here, so i suggest a few ideas to start with: simply following and biting, moving in a peculiar way, spitting out dangerous toxins, electrifying, dealing damage over time, shooting an arc, exploding after a short time, avoiding the player and shooting from a distance. the list can go on, but again we start with basic ones. enemy ai might get complicated to implement, so we pull reference from simple platformers, bullet-hell type of 2D games

the number of enemies that can be on screen simultaneously is limited. this is different from initial survivor-like game, where enemies spawn indefinitely. yes, there can be many enemies and the player may (and at some points must) be overwhelmed, but the dive cannot just continue further, until an enemy batch is defeated. actually, a batch of enemies is a good concept here, as it may include one to tens of enemies. check the hades reference, it’s very good here. level runs must not look the same on every dive. surely, at the early stages it will, but we keep in mind this important part of batch dynamics. a batch (or a wave) appearing at the same point on a level is a number of enemies that have a very similar strength or firepower to each other. so, they are different, but they pose a very similar threat to the player at a given point of level progression.

### game currency system

this is about earning money / points / tokens / shells / coloured stones (?). enemies may or may not drop currency depending on their level of threat to the player. a bit of randomness won’t hurt here either. something may pop up along the dive itself as a reward too. we stick to one currency initially, but later on some fancy looking shell might give for example a nice amount of currency. this contributes to rewarding mechanics a lot.

### references

these are just reference points to grasp the idea. 

1. dave the diver is a good reference for the setting and high-level gameplay in a sense of progressing — need to dive to be able to perform activities and upgrades on the surface. in their case it includes cooking, which is far more complicated, of course we completely omit that part.
2. hades 1, 2 for the roguelite game experience and level replayability. also good for enemy balance, meaning that every run is balanced in difficulty, but has slightly different enemy sets (batches). deals with boring repetitions and helps with overall game enjoyment.

