# Play-tests

Every Sonar play-test (D164 (Sonar)): what it supposes, whether it has been
played, and what it showed. A living doc, and the one home of a play-test's
outcome — what a reading concludes is written here in the response that
reads it, so no session loses it. Every play-test's setup is a record in
`tests/playtests.json`; the plays are in `logs/<id>/`, ignored by git and
safe to delete, and replay any time with `npm run sonar <id>` while kept.

Igor plays one with `npm run play`, then `http://localhost:8765/?sonar=<id>`.
Short ones first: one or two gates, a minute or two, each a claim the play
can bear out or break. A hypothesis is Claude's, and says what would break
it; an outcome is one human's play, a direction and never a measurement —
replay it, or pair it, before a change leans on it.

## The kits

From Igor's first career (D163 (the career log)): what a diver carries at
each point of it — gear and steps from `home`, and the mods a dive there had
picked up by then. The Suit is left out, so it hides nothing (the Suit pair).

| kit | debug tokens | HP | from |
|---|---|---|---|
| fresh | `Gun0` | 3 | dive 1 |
| mid | `Knife0,Dash_reach1,Heart2,Strength2,Reflex1,Nerve1,Impact1,Mend1` | 5 | dive 2, its mods by layer 2 |
| late | `Knife2,Mask3,Weights2,Dash_reach3,Heart3,Strength3,Fins1,Vitality2,Reflex3,Nerve1,Impact1,Mend1` | 8 | the winning dive less the Suit, its mods by layer 3 |

## The roadmap

`tests/playtests.json` holds each exact code; below, `mid` and `late` stand for
the kits' tokens.

- [x] `2026-10-28-suit-on` + `2026-10-28-suit-off` — the Suit pair
- [x] `2026-10-28-fresh-opening` — layer 1's first three gates, fresh
- [x] `2026-10-28-puffer-rings` — five puffers at once
- [x] `2026-10-28-archer-deep` — grade-3 archers behind a screen
- [x] `2026-10-28-knife-eels` — the Knife against a dozen eels
- [x] `2026-10-28-harpoon-line` + `2026-10-28-knife-line` — the Harpoon's case
- [x] `2026-10-28-impact-dash` — the dash as a second weapon
- [x] `2026-10-28-bulwark-throw` — thrown into the crowd
- [x] `2026-10-28-boss-cue` — does the boss's stage change read
- [x] `2026-10-28-boss-lunge-deep` — the last boss, without the Suit

**What the short ten showed**, 2026-10-29: with the career's kits, at the
places in a dive they were carried, every one was easy — Igor: "all felt
quite easy". Four hits in twelve gates; fifteen lunges thrown by bosses and
mini-bosses, none landed. Most hypotheses broke because nothing hurt enough
to tell what hurts: the next play-tests have to find where it starts to.

- [x] `2026-10-29-knife-deep` + `gun-deep` + `harpoon-deep` — three
  weapons, one late batch
- [x] `2026-10-29-unit-puffers` — the threat unit by hand, past the unit
- [x] `2026-10-30-unit-puffers-12` — the threat unit by hand, at the unit
- [x] `2026-10-29-dash-on-purpose` — the dash as a second weapon, used
- [x] `2026-10-29-layer-jump` — layer 1's end into layer 2
- [x] `2026-10-30-puffer-learned` + `2026-10-30-unit-puffers-12` again — the puffer, learned
- [x] `2026-10-30-puffers-fewer` + `2026-10-30-eels-deep` — fewer puffers, layer 2 and layer 3
- [x] `2026-10-30-deep-reshaped` — `gun-deep`'s batch with half its puffers
- [x] `2026-10-30-unit-puffers-9` — the puffer's new unit
- [x] `2026-10-30-layer2-whole` — layer 2 whole, fewer puffers
- [x] `2026-10-30-layer2-dive3` — layer 2 with dive 3's kit
- [x] `2026-10-30-career` — a whole career, after the puffer
- [x] `2026-10-30-suit-pairs` — layer 3 with the guard lasting two gates
- [x] `2026-10-30-lionfish` — the short Knife among lionfish and eels
- [x] `2026-10-30-lionfish` again, the ring redrawn, + `2026-10-30-lionfish-mask` — the same gate with the Mask
- [x] `2026-10-31-new-player` — a session from New game, by someone new to the game
- [x] `2026-10-31-lionfish-fires` — the lionfish drifting and firing its spines by itself, the short Knife
- [x] `2026-10-31-lion-knife` + `lion-gun` + `lion-harpoon` — three weapons, layer 3's deepest lionfish batch
- [x] `2026-10-31-lion-knife-short` — the same batch, the Knife's cut its own
- [x] `2026-10-31-suit-layer` + `suit-layer-gun` — layer 3 with the guard lasting a layer, the Knife then the Gun
- [x] `2026-10-31-career` — a whole career, the guard a layer and the Knife short
- [x] `2026-11-01-harpoon-early` + `gun-early` — layer 1's opening, the fast Harpoon then the Gun
- [x] `2026-11-01-harpoon-late` — layer 3 with the Harpoon at its top
- [x] `2026-11-01-harpoon-top` — the two gates that ended `harpoon-late`, the top firing faster
- [x] `2026-10-31-new-player` again — the next newcomer, the death screen's dot in
- [x] `2026-10-31-new-player` a third time — the third newcomer
- [x] `2026-11-02-eel-path` — the Gun among 27 eels, their way drawn ahead
- [x] `2026-11-02-eel-slow` — the same gate, the eels swaying slower

**Where it starts to hurt**, looked for with the diver bot first
(2026-10-29, eight seeds a setup): with the `late` kit, layer 3's deepest
ordinary batch costs it 0.3 HP, and five times the batch, 113 fish at
grade 3, still under a heart — no count the debug mode can set reaches the
knee. The same batch and kit with the Gun or the Harpoon instead costs it
hearts, and some dives (Three weapons, one late batch, below). So the next
play-tests ask what the bot says it is — the weapon — rather than climbing
counts.

**The lunge, over every play** (2026-10-30, the eleven plays a boss or a
mini-boss lunged in, replayed): 165 lunges, 82 the bosses' and 83 the
mini-bosses'; 2 landed, both bosses'. None was dashed through — the diver
was off the line. Mostly without trying: the line is fixed as the wind-up
starts (D64 (the boss lunges)), and a diver going on the way it swam as the
wind-up began, the screen's edges aside, would have taken 30 of the 165;
standing still, all 165. 158 began with the diver moving. A swim across the
line leaves it in 0.4s from the boss's and 0.28s from the mini-boss's; their
wind-ups are 0.8s and 1.2s. "When it swells, get out of its line" is done
four times in five before the swell is read. Left as it is, for now:
D188 (the list's first five answered).

## The Suit pair — played

**Asks**: how much of the winning dive's stroll is the Suit's? The same
whole dive, seed and batches, the winning kit (`late` with Suit 3), played
with the Suit and then without.

**Outcome**, 2026-10-28 — one play each, suit-off second and so knowing the
batches:

| | Suit 3 | no Suit |
|---|---|---|
| ended | won, 309s | won, 288s |
| hits | 18, 14 guarded | 5 |
| HP lost | 6 | 11 |
| lowest HP | 3 | 2 |

Not a heart lost before layer 3 in either, but for the layer-2 boss's lunge
(5 of 7 HP, without the Suit). **The Suit is not what makes the last dive
easy**: it lets a careless play off, 18 hits against 5. The kit does — Igor:
"knife is a really cool weapon, many enemies get oneshot, all dangers easy
to avoid, the one huge danger is multi-hp damage from boss". The boss's
lunge is 4 and a point a grade (5, then 6), every other attack 1–3. Left
as it is: D188 (the list's first five answered).

## Fresh opening

`2026-10-28-fresh-opening` · `L1,G1,S1001,Gun0` · 3 gates: an ordinary one,
the first mini-boss, the next ordinary one.

**Hypothesis**: a fresh diver clears each of the three in 10–15s, the
"fast-paced" pillar's start, and takes the mini-boss's first lunge but
dodges the ones after: the mini-boss is there to teach the lunge's tell
(the glossary's mini-boss). **Broken by**: a gate over 25s, or lunges
landing as often late in the fight as early.

**Measures**: time a gate; hits and what dealt them; the mini-boss's lunges
thrown and landed, in order.

**Outcome**, 2026-10-29 — **broken, the easy way**: 14.9s, 23.0s (the
mini-boss) and 11.0s, inside the 25s bar but the mini-boss's over 15s; not
a hit taken, and the mini-boss threw five lunges and landed none — there was
no first lunge to learn from. Igor is no fresh player any more: this
measures the game's floor for him, not a newcomer's.

## Puffer rings

`2026-10-28-puffer-rings` · `L2,G1,S1002,Knife0,darter4,puffer5,`+`mid`
(`mid`, five puffers and four darters) · 1 gate.

**Hypothesis**: puffers killed most in the career's dives 2 and 3, and not
because one ring is hard to read: most puffer hits land while two or more
puffers swell at once, rings overlapping. **Broken by**: most puffer hits
landing with one puffer swelling.

**Measures**: hits by puffer; how many puffers were swelling at each; time.

**Outcome**, 2026-10-29 — **broken, thinly**: 11.3s, two hits — a darter
and one puffer — and no hit landed with two puffers swelling (one swelling
at the first, none at the second). Five puffers at once never overlapped
on him; one sample, two hits.

## Archers deep

`2026-10-28-archer-deep` · `L3,G1,S1003,Grade3,Knife2,drifter6,archer8,`+`late`
(`late`, eight archers and six drifters, every fish at grade 3) · 1 gate.

**Hypothesis**: archers past layer 1, never yet played (`ideas.md`), are the
hardest ordinary batch for the Knife: it must cross their 240px to reach
them, so most hits are shots taken while closing in, not bites. **Broken
by**: the drifters dealing most of the hits, or the gate cleared with one
hit or none.

**Measures**: hits by archer and by drifter; the diver's distance to the
nearest archer at each shot taken; time.

**Outcome**, 2026-10-29 — **broken**: 14.9s and not a hit, eight grade-3
archers and six grade-3 drifters, five dashes. The late kit crosses the
archers' range freely.

## The Knife against eels

`2026-10-28-knife-eels` · `L3,G1,S1004,Knife2,eel12,`+`late`
(`late`, twelve eels) · 1 gate.

**Hypothesis**: an eel hurts on touch and the Knife cuts at 72px, so eels
are the Knife's natural enemy — they cost a hit for every three or four
killed, more than any other fish costs the late kit (five eel hits at the
last boss, in suit-on). If so, it is a coupling to raise by the diversity
rule's fifth (coupled, never contradicting). **Broken by**: twelve eels for
two hits or fewer.

**Measures**: eel hits per eel killed; time.

**Outcome**, 2026-10-29 — **broken**: twelve eels for one hit, 12.5s. Eels
are no special enemy of the Knife on their own; suit-on's five eel hits came
at the last boss, in its crowd.

## The Harpoon's case

`2026-10-28-harpoon-line` · `L2,G1,S1005,Harpoon2,drifter8,bulwark3,`+`mid`,
then `2026-10-28-knife-line` · `L2,G1,S1005,Knife2,drifter8,bulwark3,`+`mid`
— the same gate and seed, `mid` but for the weapon, each at tier 2 · 1 gate
each, the Harpoon first.

**Hypothesis**: nobody buys the Harpoon (the career never did) because on a
mixed batch it is slower than the Knife; it only pays against a line of tough
fish, three bulwarks lined up. **Broken by**: the Harpoon clearing faster
than the Knife, or as fast with fewer hits.

**Measures**: time; hits; kills per shot (a pierce that pays shows as two or
more a shot); each bulwark's time to die.

**Outcome**, 2026-10-29 — **broken**: the Harpoon 14.4s and no hit, the
Knife 12.7s and one (a bulwark's). The Harpoon kept up, about a shot a kill
(11 shots, 11 kills, the bulwarks taking two each), and picked up Barbs on
the way. Being slower is not why the career never bought it — its price
(90 gems) or its never being tried are left.

## Impact and the dash

`2026-10-28-impact-dash` · `L1,G3,S1007,Knife0,drifter6,darter10,`+`mid`
with Reflex 3 and Impact 3 · 1 gate.

**Hypothesis**: Impact and Reflex at their caps make the dash a second
weapon — a fifth of the kills or more by dashing, a dash about every 1.5s,
its cooldown spent rather than saved. If not, the two mods differ from the
others in degree only, felt by nobody. **Broken by**: under a tenth of the
kills by dash.

**Measures**: dashes; kills during a dash; the gaps between dashes; time.

**Outcome**, 2026-10-29 — **not tested**: the recording holds no Space
press at all, every other key there, so no dash to count. Sixteen fish fell
to the Knife in 12.1s, no hit taken. The dash is not unused — the other nine
plays dashed 31 times — but this one gate says nothing about Impact and
Reflex either way.

## The bulwark's throw

`2026-10-28-bulwark-throw` · `L1,G5,S1008,Knife0,darter8,bulwark3,`+`mid`
(`mid`, three bulwarks and eight darters) · 1 gate.

**Hypothesis**: a bulwark's bite "throws you far" — into the darters: a
bulwark hit is followed by another hit within a second more often than not.
**Broken by**: most bulwark hits followed by none.

**Measures**: hits within a second after each bulwark hit; where the diver
lands; time.

**Outcome**, 2026-10-29 — **not tested**: no bulwark landed a bite, so
there was no throw to follow. 14.1s, no hit taken.

## The boss's cue

`2026-10-28-boss-cue` · `L1,G6,S1009,Knife0,`+`mid`
(`mid`, layer 1's boss as drawn) · 1 gate.

**Hypothesis**: the boss's stage change goes unread — "sound and burst
didnt make a difference" (`ideas.md`): hits gather in the three seconds
after each stage change, the fiercer stage arriving unseen. **Broken by**:
no more hits after a change than at any other time. Igor's word on whether
he saw it counts as much.

**Measures**: the boss's stage at each tick; hits by what, and how soon
after a change; its burst at the screen's edge.

**Outcome**, 2026-10-29 — **half held**: the boss changed stage twice
(11.0s and 20.7s into the play) and threw six lunges and one fan; Igor:
"no changes noticed in the boss". Unread, as supposed — but it cost
nothing: not a hit in the whole fight, 25.5s. The stages are not felt,
at this kit, in any way.

## The last boss

`2026-10-28-boss-lunge-deep` · `L3,G6,S1010,Knife2,`+`late`
(`late`, layer 3's boss at grade 3) · 1 gate.

**Hypothesis**: the lunge, 6 of the late kit's 8 HP, decides a late fight on its own:
most lunges dodged, but the one that lands is the fight; the fan and the
escorts barely matter. It feeds the Suit's fix, not a fix of its own.
**Broken by**: the escorts or the fan dealing most of the HP lost.

**Measures**: lunges thrown and landed; HP lost by source; time.

**Outcome**, 2026-10-29 — **broken**: four lunges thrown, none landed,
two stage changes, no hit taken at all; layer 3's boss at grade 3 died in
16.4s. The lunge decides nothing when it never lands.

## Three weapons, one late batch

`2026-10-29-knife-deep` · `L3,G5,S2001,Grade2,Knife2,archer8,puffer13,eel19,`
+`late` less its Knife, then the same with `Gun2` (`gun-deep`) and
`Harpoon2` (`harpoon-deep`) · 1 gate each, the Knife first.

A real layer-3 batch of its deepest ordinary stretch, at the grade a dive
meets it at. The bot: the Knife 0.3 HP lost, no death, about 27s; the Gun
5.0 and two deaths of eight, about 37s; the Harpoon 5.0 and three, about
40s. At this kit the Knife swings 162px — 72 and the Mask's 90 — for 4 a
cut, through seven fish.

**Hypothesis**: the bot's gap is the weapons', not the bot's aim: Igor takes
no heart with the Knife and two or more with each of the Gun and the
Harpoon. The Knife goes first, while the batch is unknown, so knowing it
helps only the other two. **Broken by**: the Gun and the Harpoon costing him
a heart or less each — the gap is then the bot's — or the Knife costing as
much as they do.

**Measures**: time; hits by what, HP lost, lowest HP; shots and kills.

**Outcome**, 2026-10-30 — **held, mostly**: the gap is the weapons'. The
Knife cost 2 HP of 6, one eel's touch, 23.7s; the Gun 4, an eel and an
archer, 26.5s; the Harpoon 4, two archers, 31.4s. No death. Against the
bot's 0.3, 5.0 and 5.0, the Gun and the Harpoon cost Igor about what they
cost it, the Knife more — one hit, where none was the guess. Faster than
the bot each time (27s, 37s, 40s). With the Gun and the Harpoon the dash
was a weapon unasked: 9 and 8 of the 40 kills, a fifth, at Strength 3 and
Impact 1; with the Knife, two dashes and none.

## The threat unit by hand

`2026-10-29-unit-puffers` · `L2,G1,S2004,Gun0,puffer25` · 1 gate.

A fish's threat is the hearts it costs the bot alone, with the Gun and
nothing bought (D126 (threat)); every batch of the dive is sized in it. By
that, 25 puffers cost two hearts of three, and on this setup the bot loses
2.8 and dies on six seeds of eight.

**Hypothesis**: Igor's hands are worth at least twice the bot's in the
threat's own unit: he loses one heart or none. **Broken by**: two hearts or
a death.

**Measures**: HP lost, lowest HP, or the death and when; hits by puffer and
how many swelling at each; time.

**Outcome**, 2026-10-30 — **broken: dead in 8.7s**, three kills of 25, two
hits. At 5.3–7.2s five puffers swelled round Igor within 0.4s of each other
from every side, their rings overlapping; the first burst took two hearts
(7.5s, 14 alive), the next the last one (8.7s). Both hit at the ring's edge,
the diver's body just inside: fair, the diver is drawn at the size that is
hit. The bot dies the same way, later: six seeds of eight, at 12–17s, each
with 12–18 puffers alive. So the play-test was set past the unit, not at
it — the unit is one heart, 1/0.081 ≈ 12 puffers, and 25 is twice that: the
sum says two hearts, the bot and Igor say a death. A puffer crowd costs more
than its fish summed, because their bursts come together (D167 (the puffer
counts more, and gates carry fewer)). The Gun at tier 0 kills one in 1.2s,
so the crowd grows while it is fought. Played again at the unit: `2026-10-30-unit-puffers-12`.

## The threat unit by hand, at the unit

`2026-10-30-unit-puffers-12` · `L2,G1,S2004,Gun0,puffer12` · 1 gate.

The unit itself: 12 puffers cost the bot one heart by the sum (0.97) and
0.75 measured, no deaths in eight seeds, about 15.6s.

**Hypothesis**: Igor loses one heart or none, as the bot does. **Broken
by**: two hearts or a death — then the unit is set wrong for a human, not
only past it.

**Measures**: as `unit-puffers`.

**Outcome**, 2026-10-30 — **broken: dead in 13.1s**, seven kills of 12, two
hits, each a single puffer — no crowd this time; the bot loses 0.75 here and
never dies. Both hits run the same way: the puffer swells with Igor 90px off,
he swims on at full speed round it rather than away, and only turns away in
the last 0.15–0.2s; at the burst his centre is 110.5px from the puffer —
past the drawn ring, 110 — and the burst lands, because it reaches the
diver's edge (110 + his radius, 20). By the eye he was out; by the rule he
was 20px short. The ring starts faint (`platform/render.js`, a fifth of its
full strength), which fits the late turn. The bot reads the true reach, and
turns within 0.1s. Proposed: a burst that hurts only a centre inside the ring, and
the ring strong from its first tick. Igor: no — guide lines may go with real
art, and the player adapts (D166 (the puffer's burst stays; guide lines are
no promise)). So the reading stands as one human's first meeting with the
burst's true reach: the unit is not shown wrong by it.

## The dash, used

`2026-10-29-dash-on-purpose` · `impact-dash`'s code again · 1 gate.

`impact-dash` was played without a press of Space, so it said nothing; the
dash there recharges in 1.0s and wounds for 5 — Impact 3 and Strength 2 —
which kills any fish of the gate in one. This time Igor dashes into the
fish whenever it is ready.

**Hypothesis**: as `impact-dash` had it — a fifth of the kills or more by
dash, a dash about every 1.5s. **Broken by**: under a tenth of the kills by
dash. A play that dashed but shows no dash would be the recorder's fault,
not the play's.

**Measures**: dashes, the presses too early, kills by dash; the gaps
between dashes; time.

**Outcome**, 2026-10-30 — **held on kills, broken on pace**: 3 of 16 kills
by dash, about a fifth; but five dashes in 13.7s, one in 2.7s against 1.0s
of recharge, and one press too early. One hit, a darter. The dash is
reached for as a weapon — here and in `gun-deep` and `harpoon-deep` — but
about half as often as it is ready.

## Layer 1's end into layer 2

`2026-10-29-layer-jump` · `L1,G5,S2006,`+`mid` · 4 gates: layer 1's last
ordinary gate and its boss, the pick, layer 2's first two.

Igor, before D162 (the whole game in fifteen to twenty minutes) flattened
the rise: "still feel that threat grows fast" (`ideas.md`). Layer 2 brings
the puffer, the first new fish since the archer and the bulwark. The bot,
with this kit, loses 0, 0.5, 0.1 and 0.4 HP over the four.

**Hypothesis**: what reads as a jump is the puffer, not more hurt: layer 2's
two gates take no more hits than layer 1's two, and most of theirs are by
puffers. **Broken by**: layer 2's two taking twice layer 1's hits or more.

**Measures**: time, hits by what and HP lost, a gate; layer 1's two against
layer 2's two; the first hits by a puffer.

**Outcome**, 2026-10-30 — **broken on hurt, held on its cause**: layer 1's
two gates took two hits, 2 HP, both archers — the boss lunged ten times and
never landed; layer 2's two took four, 7 HP, three of them puffer bursts.
Gate 8 — the mini-boss with puffers — left Igor on 1 HP of 5, where the bot
loses 0.4. So the jump is the puffer, and it hurts more than the bot says.
Taken with the two `unit-puffers` deaths: the puffer costs Igor far more
than it costs the bot, which reads the burst's true reach and turns in
0.1s. Its threat, measured by the bot, is a floor (D128 (the balance
suite)); by D166 (the puffer's burst stays; guide lines are no promise)
Igor learns its reach, so the next plays with puffers show whether the gap
closes before any number moves.

## The puffer, learned

`2026-10-30-puffer-learned` · `L2,G1,S2006,`+`mid` · 2 gates: the very
batches `layer-jump` met in layer 2 — 3 puffers among 14 fish, then the
mini-boss with 4 puffers and 4 darters. Then `unit-puffers-12` played again.

The puffer cost Igor three of layer 2's four hits and both `unit-puffers`
deaths, where the bot loses little: it reads the burst's true reach. By D166
(the puffer's burst stays; guide lines are no promise) the player learns it.
The bot, from this start over eight seeds: 0.5 HP a gate, no death.

**Hypothesis**: knowing the reach closes most of the gap — one puffer hit or
none across the two gates (three before), and `unit-puffers-12` survived.
**Broken by**: two puffer hits or more again, or a second death at the
unit — then the puffer costs a human more than its threat says, and its
number moves.

**Measures**: hits by what and HP lost, a gate; at each puffer hit the
diver's distance and which way he was swimming; time.

**Outcome**, 2026-10-30 — **broken, while learning**. `puffer-learned`: 5 HP
lost (7 before), an archer and one puffer a gate; gate 8 again ended on 1
HP of 5; 40.2s for the two. `unit-puffers-12` again: dead again, but at
16.9s with 10 kills of 12 (11.9s, 7 before). The edge of the ring is
learned — no hit came at it now — and three of the four puffer hits came
with two or three puffers swelling at once, the way out of one ring the way
into the next; the fourth, standing nearly still by the mini-boss. So the
puffer costs Igor more than its threat says, and what costs it is their
bursts together. So it counts more now, and gates carry about half the
puffers (D167 (the puffer counts more, and gates carry fewer)).

## Fewer puffers

`2026-10-30-puffers-fewer` · `puffer-learned`'s code · 2 gates;
`2026-10-30-eels-deep` · `L3,G5,S2001,`+`late` with `Gun2`, its batch drawn
· 1 gate.

D167 (the puffer counts more, and gates carry fewer) halved the pools'
puffers and grew their other fish. Layer 2's opening now draws 2 puffers
among 17 fish, then the mini-boss with 3 puffers and 5 darters — 3 and 4
before. Layer 3's deepest gate draws 5 puffers and 27 eels, graded
(five careers had the stretch heavier for the bot; ten showed that was its
spread). The bot from these starts: 0 and 1.1 HP; 1.9 HP of 6 and about 40s.

**Hypothesis**: layer 2's two cost Igor two hearts or fewer, at most one by a
puffer (5 and 7 before); the deep gate costs him no more than `gun-deep`'s
4 HP. **Broken by**: a puffer hit in each gate again — the cut was not
enough — or the deep gate costing 5 HP or a death: the eels took what the
puffers gave.

**Measures**: hits by what and HP lost, a gate; eels against puffers in the
deep gate; time.

**Outcome**, 2026-10-30 — **held in layer 2, broken in layer 3**.
`puffers-fewer`: 4 HP lost (5 and 7 before), one puffer hit (two and three),
an archer the other; 37.1s. `eels-deep`: 6 HP lost, the most of the deep
plays (`gun-deep` 4), three eel hits and one puffer; 31.7s, 40 kills — the
batch had grown eels where the puffers went (27, from 23). So the cut works
on the puffer, and the eels took what it freed. D167 (the puffer counts
more, and gates carry fewer) was redone the same day: layer 3's puffer
batches keep their eels, and grow their other fish instead.

## The deep batch, reshaped

`2026-10-30-deep-reshaped` · `L3,G5,S2004,`+`late` with `Gun2`, drawn ·
1 gate.

`gun-deep`'s batch as D167 (the puffer counts more, and gates carry fewer)
left it, drawn and graded: 7 puffers, 19 eels, 14 archers — 13, 19 and 8
before. The bot, from this start: 2.9 HP of 6 a run, one death in eight,
about 37s.

**Hypothesis**: no worse than `gun-deep`: 4 HP or fewer, and fewer puffer
hits than eel hits. **Broken by**: 5 HP or a death — then the archers took
what the puffers gave, and the deep gate wants a lighter target, not
another mix.

**Measures**: HP lost and lowest; hits by what; time.

**Outcome**, 2026-10-30 — **broken**: 8 HP lost of 9, down to 1; five hits,
four by archers (1–2 each), one grade-3 eel for 3; no puffer hit; 34.2s, 40
kills. The archers took what the puffers gave. Read with care: `gun-deep`
held every fish at grade 2, and this batch is graded as a dive grades it —
6 of its fish at grade 3, the eel that hit for 3 among them. Igor's three
deep gates, one each: 4, 6 and 8 HP, never a death; the bot's from the
same starts 5.0, 1.9 and 2.9.
Igor, on the 1–4 HP a deep gate leaves: "it's fine, keep the deep gate as
is".

## The puffer's new unit

`2026-10-30-unit-puffers-9` · `L2,G1,S2004,Gun0,puffer9` · 1 gate.

D167 (the puffer counts more, and gates carry fewer) made 9 puffers one
heart by the threat, not 12. The bot loses nothing to them, 12s, eight runs
of eight. Igor died to 12 twice.

**Hypothesis**: the threat now reads Igor: one burst at most, 2 HP, no death.
**Broken by**: a death — the puffer still costs him more than it counts,
though no pool gate holds more than 7 now.

**Measures**: as `unit-puffers`.

**Outcome**, 2026-10-30 — **held**: one burst, 2 HP, with three swelling;
cleared in 13.2s, all nine. At 9 the threat now reads Igor; at 12 he died
twice.

## Layer 2 whole

`2026-10-30-layer2-whole` · `L2,G1,S2010,`+`mid` · 6 gates: a batch, a
mini-boss, a batch, a mini-boss, a batch, the boss — 17 puffers in all, 1
to 5 a gate. A seed Igor has not played.

The puffer was the jump from layer 1 (`layer-jump`), and D167 cut it; D162
(the whole game in fifteen to twenty minutes) wants a layer in two to four
minutes. The bot, eight runs: 0 HP for the first four gates, about 1.75 at
the fifth (5 puffers, 6 archers, 7 darters), dead twice at the boss; about
3:25 for the layer.

**Hypothesis**: the layer is hard at its end and not before: Igor loses at
most a heart a gate before the boss, under half of it to puffers, and the
layer takes 2–4 minutes. **Broken by**: puffers again the most of his hits,
or a death before the boss.

**Measures**: time a gate and the layer; hits by what and HP lost a gate;
puffer hits against the rest; deaths.

**Outcome**, 2026-10-30 — **broken: dead twice before the boss**. Two dives
in one play: dead at the first gate, 15.9s — a grade-3 archer's spit for 3
of 5, then a grade-2's for 2 — and at the third, 48.2s — a grade-2 puffer's
burst for 3, then a bulwark's throw. Five hits, one by a puffer: the cut
held. What killed is grades: +1 and +2 to a hit (D119 (grades)) against 5
HP, two hits a death. The bot lost nothing to the first four gates. Read
against Igor's own career, the hypothesis was wrong, not the layer: his dive
2 carried this very kit and died at gate 8, layer 2's second; dive 3 died at
its boss; dive 4 won. A dive-2 kit is not meant to clear layer 2 — the
career's deaths are its shape (D162 (the whole game in fifteen to twenty
minutes)). Played again with dive 3's kit: `layer2-dive3`.

## Layer 2 with dive 3's kit

`2026-10-30-layer2-dive3` ·
`L2,G1,S2011,Gun1,Suit3,Dash_reach2,Heart3,Strength3,Nerve1,Reflex3,Fins1`
· 6 gates: layer 2 whole, on a seed Igor has not played.

Igor's dive 3 entered layer 2 with this — the Gun at tier 1, the Suit at
3, Heart and Strength at 3, its mods by then — sat on 1 HP from gate 8 on,
and died at the boss, whose gate held 9 puffers that hit it three times.
D167 (the puffer counts more, and gates carry fewer) halved them: this
seed's boss comes with 4 puffers, 4 archers, 5 darters and 4 bulwarks. The
bot, eight runs: no heart lost anywhere, about 2:45 for the layer.

**Hypothesis**: the dive-3 kit now gets through layer 2, the boss too —
where it died before — and not on 1 HP all the way. **Broken by**: a death
in layer 2 again.

**Measures**: time a gate and the layer; hits by what, guarded, HP lost a
gate; the boss gate's hits.

**Outcome**, 2026-10-30 — **held, and then some**: layer 2 cleared, boss
and all, in 3:33, not a heart lost — four hits, every one taken by the
Suit's guard, one of them a puffer's; the boss lunged 30 times and landed
none, its two hits on him guarded too; 73.8s at its gate. 56 dashes, 11
kills by them. Igor's dive 3 died here, on 1 HP from gate 8. Read with
care: another seed, and a day of play-tests behind his hands — the puffer
cut is one of three things that moved. Within D162 (the whole game in
fifteen to twenty minutes)'s two to four minutes a layer.

## Igor's first career

Read from the career log (D163 (the career log)), before Sonar, 2026-10-28,
on the D161 (depth pays points) and D162 (the whole game in fifteen to
twenty minutes) build: won on dive 4, 17 minutes by the wall clock (14
diving, 3 at `home`) — on target.

- **The winning dive was a stroll**: 5.5 minutes, no heart lost — all 11
  hits taken by the guard. Suit 3 (210 gems, a guard of 3 a batch) took 18
  of dive 3's 22 hits too. Answered by D168 (the guard lasts two gates).
- **Not everything bought**: no Harpoon, Gun 1 of 3, Knife and Weights 2 of
  3; 9 of 12 steps (26 points earned, 30 to buy all); 1039 gems unspent at
  the end, 1017 of them the winning dive's own: it began with 22, against
  750 gems of gear unbought. The skill ladders paid 8 of 20 — depth paid 18.
- Killed by archers (dive 1) and puffers (dives 2, 3: most killing hits).
  Gates 10–40s; the bosses 11–39s with his kit.
- Before it, three fresh dives, 2026-10-28: 135s and 78 gems, 150s and 75
  gems, then dead at the second mini-boss with 40 gems; points only on the
  first — about a tenth of what the career bot earns, and the economy set on
  it (D160 (a layer-1 dive buys a thing every two)). The mini-boss "good";
  layer 1's boss 75s, layer 3's 60s "hard but good". Late game,
  `?debug=L3,G4,S3351240973,Knife3,Mask3,Suit3`: "absolutely nailed it in
  42s, gameplay felt really good".

## A whole career, after the puffer

`2026-10-30-career` · `{ "save": "fresh" }` · to the win, or 30 minutes.

Igor's first career (D163 (the career log)) won on dive 4 in about 14
minutes of dives: dead at gate 4, 8 and 11, then the win. Since then the
puffer counts more and gates carry half as many (D167 (the puffer counts
more, and gates carry fewer)), and a dive-3 kit cleared layer 2 without a
heart lost (`layer2-dive3`). The career bot wins on dive 2 or 3, before the
change and after. Igor now knows the game far better than on his first
career, which this play cannot take apart from the change.

**Hypothesis**: still a roguelite's shape — two deaths or more before the
win, 15 to 20 minutes in all (D162 (the whole game in fifteen to twenty
minutes)). **Broken by**: a win on dive 1 or 2, or under 12 minutes — the
game is then too short for a player who knows it.

**Measures**: dives to the win and where each ended; minutes a dive and in
all; what was bought before each; hits by what, a layer.

**Outcome**, 2026-10-30 — **held**: won on dive 4, at 15:21 on the wall
clock (12.2 minutes diving); dead at layer 1's boss (dive 1, the Gun, an
archer then the boss's lunge for 3), at gate 5 (dive 2, the Knife from
here on), at layer 3's first gate (dive 3, four hits). Igor: "overall feels
good, but i gained guard and hp bonuses which allowed me to take a lot of
damage and not die".

- **The Suit won it.** Bought 1 before dive 3, 2 and 3 before dive 4: a
  guard of 3 a gate, refilled at each. Dive 4 took 18 hits and the guard
  took 16; HP 6 to 8 by Heart 3 and three Vitality, and nothing healed it —
  no Mend. Unguarded, those 18 hits are 18 HP or more. Only one gate of 18
  saw more than three hits (the deepest ordinary, five, all archers). The
  same as the first career (Igor's first career).
- **Bought by the win**: the Knife to 2, the Suit and the Mask to 3, the
  Weights to 1, Heart, Strength and Dash reach to 3; never the Harpoon, the
  Gun not past 0. 1198 gems unspent — 1070 of them the winning dive's own.
  It began with 128, against 825 gems of gear still unbought.
- **Mods**, dive 4: Reflex 3, Impact 3, Vitality 3, Fins 2, Nerve 2 — the
  dash's (84 dashes, 5 kills by them). Boosts: Rush, Frenzy and Bloom, the
  Knife's three.
- **The bosses**: 12s (dive 1's, which killed), then 21s, 21s, 12s, 22s and
  13s; 20 lunges in dive 4, none landed. Igor: "boss is hardly a challenge,
  just time-consuming sometimes. escort enemies help to keep it dynamic".
- **Weapons**: "knife is my favorite, harpoon feels like a redundant weapon
  now". The bot agrees on both (`npm run measure weapons`): over layers 2
  and 3 the Knife the quickest and the safest, 22.8s and 0.6 hearts a
  batch, and better than the Gun on both; the Harpoon 29.1s and 1.4,
  better than neither. Careers by weapon (`npm run measure careers <w>`):
  the Gun and the Knife win on dive 2 or 3, the Harpoon too but a minute
  slower in layer 3.

## The guard, two gates long

`2026-10-30-suit-pairs` ·
`L3,G1,S2012,Knife2,Mask3,Suit3,Weights1,Dash_reach3,Heart3,Strength3,Reflex3,Impact3,Vitality2,Fins2,Nerve2`
· 6 gates: layer 3 whole, with the winning dive's gear and mods, 8 HP.

D168 (the guard lasts two gates): the winning dive's 16 guarded hits of 18
would have let about four more through. The bot, eight runs: not a hit
taken, about 2:05 for the layer — it does not see this.

**Hypothesis**: tense, not lost: Igor ends layer 3 on 1 to 4 HP, alive.
**Broken by**: a death (too much) or 6 HP or more left (still a stroll).

**Measures**: hits by what, guarded or not, a gate; HP after each gate and
the lowest; time; deaths.

**Outcome**, 2026-10-31 — **broken: still a stroll**. Layer 3 whole in
2:34 of play, the boss in 15.7s, no death: 6 hits — eel 2, archer 3,
lionfish 1 — every one guarded, not a heart lost; 9 HP of 9 at the end
(Vitality picked on the way). Hits by gate 0, 0, 2, 1, 2, 1: two gates
never brought more than the guard's three, so lasting two gates took
nothing a careful play let through. Gate 17 is `lion-knife`'s batch by its counts
(19 lionfish, 22 eels, 5 puffers, its grades mixed as a dive draws them):
cleared in 32s, 2 hits, both guarded — where `lion-knife`, the same Knife
without the Suit, every fish at grade 2, died in 28s.

## The lionfish, against a short Knife

`2026-10-30-lionfish` ·
`L3,G3,S3013,Knife2,Weights2,Dash_reach3,Heart3,Strength3,Fins1,Vitality2,Reflex3,Nerve1,Impact1,Mend1`
· 1 gate: layer 3's third, 13 lionfish, 13 eels and 6 archers, with `late`
less the Mask, 8 HP.

D171 (the lionfish): a hit landing on it while the diver is within 40 px of
its body stings. Less the Mask, the Knife cuts to 70 px, so a clean cut is
taken from its last 30. The bot keeps to that exactly: eight runs, 24s, not
a heart lost, no sting. Its cost to the Knife in the bot's careers is the cut
held while a lionfish is near, and the eels coming in meanwhile
(`roadmap.md` → Health); with the Mask the cut outreaches the spines, and
the bot's 22s change nothing.

**Hypothesis**: a player pays where the bot does not — some stings, or eels
let in while waiting for a clean cut — and loses at least a heart. Igor can
tell the stinging fish apart, and sees the ring before the sting.
**Broken by**: no sting and no heart lost (the spines cost a player nothing
here either), or a death (too much for a kit this strong); or stings Igor
did not see coming.

**Measures**: hits by what — lionfish, eels, archers; HP after the gate;
time; lionfish killed by a cut and by the dash; dashes; deaths.

**Outcome**, 2026-10-30, play 1 — **the stings held, the death broke it**:
dead at 32.2s with 6 of 32 fish left, 8 HP in five hits — the lionfish
twice, 1 each, the second the death; the eels twice, 2 and 3 (grades 2 and
3); an archer once. Seven dashes, two kills by them. The bot: 24s, nothing
lost, no sting. One sting followed a dash that stopped 11 px from a
lionfish without touching it; the other was a cut from 37 px, 3 inside the
reach. The ring showed only once the diver was inside, the tick before the
sting (`replay&at=4065`): it could not warn, so it was redrawn the same day
to fade in over the last 60 px and brighten inside — Claude's, placeholder
graphics. Igor said "played", nothing more. One play cannot say whether the
eels' 5 HP came from waiting for a clean cut or from the short blade:
`knife-eels`, with the Mask, took one eel hit for twelve eels. Next: this
gate again with the ring redrawn, and with the Mask.

**Outcome**, 2026-10-31, play 2, the ring redrawn — **held**: cleared in
33.2s with 3 of 8 HP, 5 lost in four hits — the lionfish twice, 1 each; a
grade-3 eel once, 2; an archer once. The bot: 24s, nothing lost, no sting.
14 cuts landed on lionfish, 13 of them kills: 9 clean, from 41 to 68 px, and
5 from inside the 40 — at 24, at 35, and one cut through three at 0, 7 and
39, whose stings fell in the blink after the second hit. No lionfish met the
dash: 7 dashes, one kill, not a lionfish's. Before each sting the ring had
shown 0.29–0.34s, and the diver stood inside the reach 0.09–0.15s. The
trigger was held through two of them, 3.3s and 4.3s, a cut every third of a
second whatever came near; the first followed a press as a lionfish crossed
the ring's outer edge, 102 px off — the cut fired at once, short of the
Knife's 70, and the next, a third of a second on, met it at 24. Over both
plays, 27 cuts on lionfish, 7 inside the reach, 4 of them hits. Igor said
"played", nothing of the ring: whether he saw the stings coming is his to
say. Asked, Igor: "you need to keep rings and draw stings" — D173
(the sting is drawn, the ring kept).

**Outcome**, 2026-10-31, play 3, the sting drawn — dead at 19.9s, 8 HP in
six hits: eels five times, the lionfish once. 4 cuts on lionfish, 2 clean
(47 and 60 px), 2 from inside the reach (12 and 10 px), the second in the
blink of the first. The one sting that landed was drawn — three spines,
about 40 px, from a fish the cut had killed, under the cut's wedge, the
death burst and the hurt sparks. Igor: "i dont see stings off the
lionfish". Redrawn the same day as a star out to the ring of the reach.

**Outcome**, 2026-10-31, play 4, the star — 16.8s, four hits, all eels, 7
HP lost; an 87s pause. 3 cuts on lionfish, all inside the reach (23, 3 and 0
px), each in the blink after an eel's bite: no sting landed, so the star,
drawn only for one that did, never showed. Igor: "stings never come off the
fish. they need to fly up to the red circle and the regrow". Redrawn: every
hit flies the spines off to the ring, and they regrow (D173 (the sting is
drawn, the ring kept)).

## The lionfish, against a long Knife

`2026-10-30-lionfish-mask` ·
`L3,G3,S3013,Knife2,Mask3,Weights2,Dash_reach3,Heart3,Strength3,Fins1,Vitality2,Reflex3,Nerve1,Impact1,Mend1`
· 1 gate: `lionfish`'s gate with `late` whole, the Mask's 90 px on the cut,
8 HP.

The bot: eight runs, 22s, an archer's hit in one, no sting. With the Mask
the cut reaches about 160 px and the spines 40, so the bot reads the
lionfish as costing the late Knife nothing — the lead D171 (the lionfish)
leaves to something else (`roadmap.md` → Health).

**Hypothesis**: no sting, and far less lost than in `lionfish` — about
`knife-eels`' one hit. **Broken by**: stings, or HP lost near
`lionfish`'s: then the lionfish costs a player the late Knife's lead too,
which the bot cannot show.

**Measures**: as `lionfish`'s; set beside its plays.

**Outcome**, 2026-10-31 — **held**: cleared in 23.5s, no hit at all. 14 cuts
on lionfish, all clean, from 58 to 141 px, 13 of them kills; 5 dashes, one
kill, not a lionfish's. The bot: 22s, an archer's hit in one run of eight.
Beside `lionfish`'s plays — dead, and 5 HP lost — the Mask's reach takes the
whole cost away, for a player as for the bot: the late Knife's lead is
untouched by the lionfish, and still needs something other than a fish
(`roadmap.md` → Health). A 46s pause mid-gate. Igor said "played".

## A new player's session

`2026-10-31-new-player` · `{ "save": "fresh" }` · no limit: until they win
or want to stop.

Every play so far is Igor's, who now knows the game far better than on his
first career (`career`: won on dive 4, 12.2 minutes diving, the Suit's
guard carrying the last). The career bot wins on dive 2 or 3. Only a player
new to the game can test the bars no bot holds: no mechanic needing more
than a sentence (Funny, childish, straightforward — Igor's judgement); the
first buy within three dives (Addictive, not grindy); the whole game in 15
to 20 minutes (D162 (the whole game in fifteen to twenty minutes)). And the
open question of every weapon tried and raised (`ideas.md`): does a
newcomer leave the Gun, and for which?

**Hypothesis**: they find shooting, the dash and buying at home unaided; buy
within three dives; carry a second weapon before the session ends; and win
in more dives than Igor's four, within about 30 minutes of diving — or,
without a win, are still diving when the session ends.
**Broken by**: a mechanic they could not find or needed explained (Igor's
word, and the input: a dive with no Space pressed is checked against the
others before it is read); no buy by dive 3; one weapon throughout; a stop
before layer 3 that is not a choice to end; or a win in three dives or
fewer.

**Measures**: from the title to the first dive, and what was opened first;
the first dive — the trigger held, the dash pressed, how it ended; where
each dive ended and by what, minutes a dive and in all, the win; what was
bought before each dive, and the first buy's dive; the weapon each dive,
each bought or raised; hits by what, a layer; pauses and menus, and how
long; lionfish stings in layer 3 (D171 (the lionfish)); where and when they
stopped.

**Outcome**, 2026-10-31 — **broken**: no win, 11 dives in 28 minutes, 14.7 of
them diving, every one dead in layer 1 — at gate 1 once, gate 2 three times,
3 once, 4 four times, 5 once, and the boss once (dive 10, 46s). Igor:
"played".

- **Found**: shooting on the first dive, 23 shots in its 10s; moving only on
  the second — the first stood where it began, shooting, and moved only as
  the bites knocked it (the timeline, a sample a second). The dash late:
  Space first pressed on dive 3, used in earnest on dive 10 (7 dashes, a
  kill); 13 in all, 4 more pressed too early. Home late: dives 2, 3, 4, 6
  and 7 began from the death screen's Dive again; the first visit came after
  dive 4, with 119 gems and 4 points banked. After dive 7, home every time.
- **Bought**: after dive 4, the Knife and its first tier, 90 gems, then the
  Gun carried again within a second; the Knife never dived. The Mask to 3;
  the Gun to 3; with points, Dash reach to 3 and Strength 1 — dive 4's 4
  points sat 12 minutes, after 68s on the attributes screen. Never Heart, so
  3 HP all session; never the Harpoon, the Suit or the Weights.
- **Hits**, 32: darters 17, archers 7, the mini-boss 4, drifters 3, the boss
  1. The first dive ended at gate 1 in 10s, three darter bites. The bot rates
  a grade-1 darter 0.004 hearts (`entities/enemies.md` → Threat), and the
  balance suite finds layer 1 cleared standing.
- **Time**: 2 minutes on the title before the first dive; 5 on the death
  screens, 28s a death; 4 in home's screens.
- **Against the others**: the career bot wins on dive 2 or 3; Igor's first
  career won on dive 4 after 14 minutes of diving. At the same 14.7 minutes
  this player had not left layer 1. One player, one session: it shows a
  newcomer can be walled in layer 1, not how many are. What it opens is in
  `ideas.md` → A new player's first session.
- CapsLock, on for four minutes, showed as a held key; it is a toggle, and
  Sonar no longer reports it. The tab stayed open on the title afterwards,
  still recording.

## The next newcomer, with the dot

`2026-10-31-new-player` again, a play of its own: one play-test for every
newcomer — Igor, 2026-10-31: "it should be the same for all, just played
multiple times". Needs someone who has not played.

D172 (the end screen marks what home can buy): the death screen's Go home
now carries a red dot, and the gems and points banked, when something at
`home` can be bought. `new-player`'s newcomer dived again after five of the
first seven deaths, and first went home with 119 gems and 4 points banked.

**Hypothesis**: every death with the dot showing is followed by Go home, and
a buy follows the first one. **Broken by**: Dive again taken with the dot
showing; a visit home with the dot and nothing bought.

**Measures**: each death — the dot or not, Go home or Dive again; the dive
of the first buy, and what was bought before each; the first dive's moving,
shooting and dashing; where each dive ended and by what; minutes a dive and
in all; the weapon each dive; hits by what, a layer; where and when they
stopped. Set beside the first newcomer's.

Set up 2026-11-01 — Igor: "setup a new player career test". Since the
first newcomer, besides the dot: the guard lasts a layer, D179 (the guard
lasts a layer); the Mask widens the Knife's cut, D181 (the Mask widens the
Knife's cut); the Harpoon shoots faster, D182 (the Harpoon a railgun). The
record now reads guarded hits and the Harpoon's dives too.

**Outcome**, 2026-11-01 — play 2, a newcomer's (Igor: "previous play was
another person"). **The dot: broken, then held**. 32:48 on the clock, 24.1 minutes diving, 13 dives — the first left
after 3s, back to the title and New game — and no win; the deepest, layer
3's third gate (dive 12). Layer 1 walled eight dives: deaths at gates 2, 5,
2, 2, 3, 1, 5, then twice at its boss; dive 11 was the first through it.
- **The dot** showed at ten of the twelve deaths. The first four, it
  showing, were Dive again; from the fifth on, every death went home, and
  every visit with the dot showing bought something. The first newcomer
  dived again after five of the first seven.
- **The first buy** came after the fifth death, before dive 7 — not within
  three dives, as with the first newcomer. On each screen the first buys
  were its top row, tier after tier within a second: Mask 1 to 3, Dash reach
  1 to 3, Gun 1 and 2. The first newcomer's were the same rows. Heart came
  before dive 11, the Suit (1 to 3) before dive 12.
- **Weapons**: the Gun through dive 12, raised to 3 by dive 10. Before dive
  13, with 738 gems banked, the Knife and the Harpoon bought and raised to
  the top in ten seconds; dive 13 carried the Knife and died at layer 2's
  boss. The Harpoon never dived. Igor: "knife changes gameplay, which is
  good. all good in general".
- **Hits**: layer 1, 32 — archer 14, darter 7, drifter 6, bulwark 3, the
  mini-boss and the boss one each; layer 2, 12, archers 5; layer 3, 6, eels
  4. No lionfish sting. With the Suit: 6 of dive 12's 14 hits guarded, 6 of
  dive 13's 11.
- **The dash**: once in dive 2, then 4, 1, 1, 1, 0, 7, 3 and 4; 15 and 30 in
  dives 11 and 12, where the run went deepest.

Against the hypothesis every newcomer is read by (A new player's session):
no buy by dive 3, broken; a second weapon carried, held, on the last dive;
no win in 24 minutes of diving, layer 3 reached. Whether the stop after
dive 13 was a choice, and what was found unaided, is Igor's to say. What it
opens is `ideas.md` → A new player's first session.

## The third newcomer

`2026-10-31-new-player` a third time, play 3, 2026-11-02 — Igor: "a new
player test, old link if it works". The same record, hypothesis and
measures as The next newcomer, with the dot. A save start keeps one slot
for every play, so the page opened on play 2's last save; New game at 0:07
made the first dive fresh.

**Outcome**, 2026-11-02. 25.2 minutes diving; the clock's 80:00 holds
idle stretches, expected (Igor). 10 dives, two of them left from the pause menu
(17s and 1.4s), and no win; the deepest, layer 3's fifth gate (dive 10),
one gate short of the last boss. Layer 1 walled the first seven: deaths at
its boss, then gates 3, 2, 5 and its boss again; dive 8 was the first
through it. The newcomer, through Igor: "cool variety of enemies, disliked
the eels :)".
- **The first dive** reached layer 1's boss in 245s, 4 hits, 6 dashes, and
  died to an archer. The darter walled nothing: 4 of layer 1's 29 hits.
- **The dot: broken again, the same way.** It showed at the first four
  deaths — 92 gems and 7 points banked at the first, nothing bought — and
  each was Dive again. Home was first found from the pause menu, after
  dive 2 and again after dive 6; from death 7 on, every death went home.
- **The first buy** before dive 3, within three dives: the Knife carried,
  Mask 1, Suit 1. The top row first again — Mask before the Suit, Dash reach
  1 before Heart — but Heart 1 to 3 followed in two seconds, before dive 7.
- **Weapons**: the Gun for dives 1 and 2, never raised; the Knife for dives
  3 to 9; before dive 10 the Harpoon, bought and raised to 3 at once —
  the first newcomer to dive with it, and that dive went deepest.
- **Hits**: layer 1, 29 — archer 18, darter 4, drifter 3, bulwark 3, the
  mini-boss 1; layer 2, 9 — archer 7, puffer 2; layer 3, 10 — eel 8, archer 2,
  the killing one an eel's. No lionfish met. Guarded with the Suit: 2, 4, 6
  and 8 in dives 7 to 10. Archers dealt five of the eight deaths.
- **The dash**: 6 in the first dive, then 1, 0, 7, 5, and 17 to 19 in
  dives 8 to 10, with 5 to 6 dash kills each.

Against the hypothesis every newcomer is read by (A new player's session):
a buy by dive 3, held; more than one weapon, held, all three; no win in 25
minutes of diving, layer 3 reached on dive 10, as the second newcomer's.
Three newcomers now agree on two things: the dot is passed at the first
deaths, and the top row is bought first. Two of three were hurt most by the
archer in layer 1, not the darter. In layer 3 the eel lands most of the
hits, as in Igor's own plays. Built from it: Go home on the end screens'
top row, D184 (Go home on top); the Suit and Heart on `home`'s, D185 (the
rows a newcomer needs first); the eel's sway slower, D187 (the eel's sway
slower; its path taken back). The next newcomer's play reads the first two.

## The lionfish fires its spines

`2026-10-31-lionfish-fires` · `lionfish`'s code and gate: layer 3's third,
15 lionfish, 15 eels and 6 archers since D176 (the spines sting by touch),
14 and 14 before, the short Knife (`late` less the Mask), 8 HP · 1 gate.

D174 (the lionfish fires its spines), D175 (the lionfish drifts, its circle
past the Knife's cut), D176 (the spines sting by touch): the lionfish
drifts; a diver whose body touches its red circle cocks its spines,
bristling, and 0.4s later twelve fly out to the circle, stinging only where
one touches; bare, they regrow over 1s. A hit on it stings nothing. The
circle reaches 80 px, the Knife's cut 70: the Knife darts in, cuts, and gets
out within the 0.4s. The bot, darting in: all 8 seeds cleared, 33.4s, a
quarter of a heart lost, to the lionfish.

**Hypothesis**: Igor darts in, cuts, and is out as the spines bristle: fewer
lionfish stings than `lionfish`'s plays, the gate cleared. **Broken by**:
stings he did not see coming, or lionfish he could not get at — the dart
too tight for a hand.

**Measures**: hits by what, and lionfish stings; each time a lionfish cocked
on the diver, fired with the diver inside or already out; cuts on lionfish;
HP after the gate, time, deaths.

**Play 1**, 2026-10-31, the D175 (the lionfish drifts, its circle past the
Knife's cut) build: dead in the gate at 19s, 8 HP to 0 over 5 hits — 3
lionfish stings, then 2 archer spits. 6 lionfish cocked on the diver: 3
fired with him out, 3 with his body over the circle, two of those with his
centre outside it, 109 and 115 px from the fish against the circle's 100 —
5 and 11 px of overlap. 6 cuts on lionfish, all from inside the circle, 5
kills. Igor: "it damages although i get off the range. fix", then "spikes
should do the damage, not the fact that i'm in the circle". **Broke**: the
stings he took for out were the circle's rule, not the spines; D176 (the
spines sting by touch) makes each spine a shot. Play it again on the D176
build. A second dive in the same tab, still that build: dead at 15.1s, 4
hits — eels twice, the lionfish twice.

**Play 2**, 2026-10-31, the D176 (the spines sting by touch) build — dead in
the gate at 22.5s, 16 of 36 fish killed, 8 HP over 6 hits: eels three
times for 5 HP (2, 2, 1), archers twice, the lionfish once. 5 lionfish
cocked on the diver: 3 fired with him out, one with him on the rim (centre
103 px against the circle's 100), untouched, and one with him deep in (51
px), stung 0.06s after. 6 wounds on lionfish, 5 cuts and a dash, 4 kills.
**Half held**: lionfish stings fell, 3 and 2 a dive before to 1, and the one
that landed was earned; the gate was not cleared — the eels again, as in
`lionfish` plays 1, 3 and 4. The bot clears it in 33.1s, nothing lost: a
hand pays the short Knife's eels, the bot does not. Igor said nothing
against the stings.

## Three weapons among lionfish

`2026-10-31-lion-knife` · `L3,G5,S2002,Grade2,Knife2,lionfish19,eel22,puffer5,`
+`late` less its Knife, then the same with `Gun2` (`lion-gun`) and
`Harpoon2` (`lion-harpoon`) · 1 gate each, the Knife first.

Igor, 2026-10-31, on the Knife leading layer 3: "dont know if it's even
true". Three weapons, one late batch played the Knife at 2 HP against 4 and
4, before the lionfish (D171 (the lionfish) to D176 (the spines sting by
touch)); since, the bot's late-kit Knife still loses almost nothing in
layer 3 where the Gun loses hearts (`roadmap.md` → Health, the lionfish
firing its spines). This is layer 3's deepest batch with the most lionfish,
the fish meant to answer the Knife (D170 (the Knife's lead closes by the
fish it meets)).

**Hypothesis**: the Knife still leads for Igor: it costs him half or less of
what the Gun and the Harpoon each do. The Knife goes first, while the batch
is unknown, so knowing it helps only the other two. **Broken by**: the
Knife costing as much as either — the lionfish then evens it for a human,
whatever the bot says.

**Measures**: time; hits by what, HP lost, lowest HP; shots, cuts and
kills; lionfish stings; dashes.

**Outcome**, 2026-10-31 — **the Knife leads, held; and the batch killed all
three**. Every play died, 4 hits and 8 HP each: the Knife after 28.1s, 37
kills of 46 fish, 51 cuts; the Gun after 19.4s, 18 kills, 64 shots, 7 of
them the dash's; the Harpoon after 19.2s, 18 kills, 16 shots, 6 the dash's.
Of the 12 hits, 11 were eels, 1 a lionfish's spine. HP cannot part them;
kills and time can — the Knife killed twice what either did and lasted half
as long again. Igor: "insane aoe damage in a huge arc, fast repeating
swings, enemies die in batches easily. especially helpful against the
annoying green ones that have hardly predictable trajectory (for a human
player). that's your answer. gun & harpoon simply suck at these batches".
Against the bot, whose late-kit Knife loses almost nothing in layer 3
(`roadmap.md` → Health): every fish at grade 2 and no Suit make this
harder than its real gate — `suit-pairs` cleared the same counts with the
Suit — but the eel the bot reads, a human does not.

## The Knife's own reach

`2026-10-31-lion-knife-short` · `lion-knife`'s code (Three weapons among
lionfish) · 1 gate.

D180 (the Mask lengthens a shot, not a cut): the Knife's cut is 72 px at
Mask 3, not 162 — inside the lionfish's ring, as D175 (the lionfish drifts,
its circle past the Knife's cut) meant it. The Gun and the Harpoon are as
they were, so `lion-gun` and `lion-harpoon` stand as the comparison. The bot
reads the Knife barely changed (`roadmap.md` → Health); Igor's words named
the arc first.

**Hypothesis**: the Knife still leads, by less: it kills fewer than
`lion-knife`'s 37 of 46 and more than the Gun's and the Harpoon's 18, and
more of its hits are spines. **Broken by**: 18 kills or fewer — the arc was
all of the lead, and D180 took it — or 37 or more: the arc was not the lead,
and the eel is all of it. Igor knows the batch now, which helps this play.

**Measures**: time; kills of the 46; hits by what, HP lost, lowest HP; cuts;
lionfish stings; dashes.

**Outcome**, 2026-11-01 — **broken: the arc was not the lead**. Dead after
37.5s, 41 kills of 46 — more than `lion-knife`'s 37 in 28.1s, against the
Gun's and the Harpoon's 18 — 4 hits, 8 HP: eel, eel, eel, a lionfish's
spine. 64 cuts, 3 dashes. The batch known helped this play, so it cannot
say the short cut does better; it can say the short cut does no worse.
The bot agrees (`roadmap.md` → Health): the lead is the eel's. Igor, on
the Mask giving the Knife nothing: "a big no-no. this fucks up game design
fundamentally. make some small improvement at least" — answered by D181
(the Mask widens the Knife's cut).

## The guard, a layer long

`2026-10-31-suit-layer` · `suit-pairs`' code (The guard, two gates long),
then the same with `Gun2` (`suit-layer-gun`) · 6 gates each, the Knife
first.

D179 (the guard lasts a layer): the Suit's three come back only at the
layer end. On `suit-pairs`' hits — by gate 0, 0, 2, 1, 2, 1 — three would
have come through, all in the last two gates; the shorter cut, D180 (the
Mask lengthens a shot, not a cut), adds to them. Driven in Node: a guard
spent at gate 1 stays spent through all six gates and comes back whole at
the layer end. The bot does not see it (`roadmap.md` → Health).

**Hypothesis**: the Knife's layer is tense, not lost: alive at the end on 1
to 5 HP, the guard spent before the boss. The Gun's costs about twice the
Knife's HP, most of it to eels. **Broken by**: for the Knife, a death (too
much) or 6 HP or more left (still a stroll); for the Gun, no more lost than
the Knife — the gap is then the lion batch's, every fish at grade 2, not a
real layer's. The Gun plays second, the layer known.

**Measures**: hits by what, guarded or not, a gate; HP after each gate and
the lowest; the gate the last guard went; time a gate and the layer; deaths.

**Outcome**, 2026-11-01 — **broken: a death, both**. The Knife died at the
layer's third gate after 73s: no hit at the first, two eels guarded at
the second, then six at the third — the last guard on the first, and
archers for 3 and 2, eels for 1 and 1, a lionfish's spine for 2: 9 HP. The
Gun went further, dead at the fourth gate after 103s: 9 hits, 3 guarded,
6 of the 9 eels'. On `suit-pairs`' rule the Knife's third gate would have
refilled the guard and left it on about 5 HP. So the Gun lost no more than
the Knife in a real layer: the gap is the lion batch's, every fish at
grade 2. Igor, of all three: "otherwise - pretty solid gameplay". One play
each; the careers say what the guard a layer does to a dive
(A whole career, the guard a layer long).

## A whole career, the guard a layer long

`2026-10-31-career` · `{ "save": "fresh" }` · to the win, or 30 minutes.

Both of Igor's careers won on the Suit (A whole career, after the puffer):
dive 4, about 12 minutes of dives, 16 of the winning dive's 18 hits
guarded. The guard now lasts a layer, D179 (the guard lasts a layer), and
the Knife carried there cuts at its own reach, D180 (the Mask lengthens a
shot, not a cut). The career bot still wins on dive 2 or 3 (`roadmap.md` →
Health); Igor knows the game better each career, which this play cannot
take apart from the change.

**Hypothesis**: still a roguelite's shape — two deaths or more before the
win, 15 to 20 minutes in all (D162 (the whole game in fifteen to twenty
minutes)) — and the winning dive loses HP in layer 3. **Broken by**: a win
on dive 1 or 2, or under 12 minutes; no win in 30 minutes; or a winning
dive that loses no HP.

**Measures**: dives to the win and where each ended; minutes a dive and in
all; what was bought before each; hits by what, guarded or not, a layer; the
winning dive's HP lost a layer, and the lowest.

**Outcome**, 2026-10-31, on the D180 build — **broken: no win in 28
minutes**. Played straight after `suit-layer-gun`, and stopped: 50 minutes
on the clock, 28.1 diving, 7 dives, the sixth left at once. Igor: "didnt
with the career", then "leave that, too time consuming". Each dive went
deeper than the one before but one: dead at layer 2's third gate and fifth
(the Gun), its boss (the Knife), layer 3's fifth (Knife 3), its fourth,
and its fifth again (Harpoon 3, all its tiers bought for the dive).
- **Bought**: Heart 1 to 3, Strength 1 and 2, Dash reach 1 and 2 and the
  Suit 1 to 3 before dive 2; the Weights to 3 and the Knife before dive 3,
  the Knife to 3 before dive 4; the Mask to 3 before dive 5; the Harpoon
  to 3 before dive 7.
- **The guard** took 4 of dive 2's 9 hits, 6 of 12, 9 of 16, 7 of 12 and 5
  of 11. The layer-3 hits that cost HP: eels 7, archers 7, a bulwark and a
  puffer.
- **Layer 3's fifth gate** — the lion batch's counts — killed every run that
  reached it: dives 4 and 7 here, and `harpoon-late` on the D182 (the
  Harpoon a railgun) build. On the D168 (the guard lasts two gates) build,
  `suit-pairs` cleared it in 32s, both hits guarded.

Igor's careers before won on dive 4 in about 12 minutes of diving. With
the guard lasting a layer and the Knife short, his ran past D162 (the whole
game in fifteen to twenty minutes)'s bar with no win. The Knife's cut
widened and the Harpoon's shot since, D181 (the Mask widens the Knife's
cut) and D182, each ease it; neither has been played over a career. Igor,
2026-11-01: a whole career only when absolutely necessary.

## The Harpoon, aimed straight

`2026-11-01-harpoon-early` · `L1,G1,S1001,Harpoon0`, then the same with
`Gun0` (`gun-early`) · 3 gates each — `fresh-opening`'s, the Harpoon first.
`2026-11-01-harpoon-late` · `suit-layer`'s code with `Harpoon3` · 6 gates.

D182 (the Harpoon a railgun): its shot flies at 3300 px/s, not 950, so a
fish is hit where it is aimed at. Igor: "hard to use in early game
(aiming) … still couldnt beat the game at it max stats". The bot, which
aims ahead perfectly, finds the Harpoon a little slower than the Gun in
layer 1 and better than it in layer 3 (`roadmap.md` → Health); a human
gains more from a shot that needs no aiming ahead. In `suit-layer` the Knife
died at the layer's third gate, the Gun at its fourth (The guard, a layer
long).

**Hypothesis**: early, the Harpoon clears the three gates in no more than
half again the Gun's time, at no more hits, and kills at least one fish a
shot — it passes through. Late, it goes at least as far as the Gun did, the
fourth gate, and fewer of its hits are eels'. **Broken by**: early, more
than half again the Gun's time, or fewer kills than shots — aiming still
fails; late, a death before the fourth gate — it still does not fit the
late game.

**Measures**: time a gate; shots and kills a gate; hits by what, guarded or
not; HP after each gate and the lowest; deaths.

**Outcome**, 2026-11-01 — **early held; late held on depth, broke on the
eel**. Igor: "feels much better. but at high tier i think its fire rate
should be even faster" — so D183 (the Harpoon's top fires faster).
- **Early**: the Harpoon cleared the three gates in 53.5s — 16.2, 19.3 and
  12.2 — not a hit taken, 36 kills for 33 shots. The Gun, played after it,
  in 56.8s — 14.3, 25.4 and 11.3 — one darter's hit, 36 kills for 89
  shots. Faster than the Gun, where the bot has it 27% slower (`roadmap.md`
  → Health): the shot that needs no aiming ahead is worth more to a human.
- **Late**: dead at the layer's fifth gate, the lion batch, after 157s —
  a gate further than `suit-layer`'s Gun, which died at the fourth after
  103s. Gates 31.7, 39, 29.1 and 35.7s; HP 8, 8, 9, 5, then 0 eleven
  seconds into the fifth. Hits: 7, eels' 5 — half the Gun's 6 were eels' —
  the first three guarded. The guard went at the fourth gate; an eel's
  bite and an archer's shot there, 3 and 1 HP, and two eel bites at the
  fifth, 3 and 2, ended it.
- The lion batch — layer 3's fifth gate by its counts — has ended every
  run on this kit that reached it since D179 (the guard lasts a layer)
  (A whole career, the guard a layer long).

## The Harpoon at the top, firing faster

`2026-11-01-harpoon-top` · `harpoon-late`'s code from the fourth gate,
`L3,G4,…` · 2 gates: the same two batches that ended it, the mini-boss's
and the lion batch, with the guard whole (in `harpoon-late` one was left).

D183 (the Harpoon's top fires faster): at the top it fires 1.2 a second,
not 1. The bot's Harpoon at the `late` kit clears layer 3's gates 8%
faster at about half the hearts (`roadmap.md` → Health).

**Hypothesis**: both gates cleared, the fourth in less than
`harpoon-late`'s 35.7s, and Igor finds the rate right. **Broken by**: a
death in the lion batch again, or "still slow" — then the rate is not what
the late Harpoon lacks.

**Measures**: time a gate; shots and kills a gate; hits by what, guarded or
not; HP after each gate and the lowest; deaths.

**Outcome**, 2026-11-01 — **broken: dead in the lion batch again**. Igor:
"played", nothing on the rate. The fourth gate in 37.9s, not faster than
35.7; 31 kills for 33 shots; 4 hits, 3 guarded, HP 7 of 8. Dead 20.2s
into the lion batch — 11.1 in `harpoon-late` — after three hits, 3, 3 and
1 HP.
- **Every hit was an eel's**, 7 of 7; in `harpoon-late` 5 of 7. Each bite
  read came from an eel touching the diver, up to six on screen, with the
  dash ready.
- The bot's Harpoon is rarely bitten by an eel at the `late` kit
  (`roadmap.md` → Health); Igor's lost all 8 HP to them in a gate and a
  half. The rate does not close it: what the late Harpoon
  lacks against a human is the eel's sway, as the Gun's does (`ideas.md` →
  Every weapon tried and raised).

## The eel's path

`2026-11-02-eel-path` · `L3,G5,S2001,`+`late` with `Gun2`, the batch set to
27 eels and 8 archers · one gate.

D186 (the eel's path drawn ahead): each eel draws its way over the next
`WEAVE_AHEAD 0.6` seconds. `eels-deep`, the same gate and kit with 27 eels
and 5 puffers: 6 HP lost, three of the hits eels' (Fewer puffers).

**Hypothesis**: aiming at the line's end, the Gun hits eels it missed, so
they land fewer hits than in `eels-deep`, and Igor says the line helped.
**Broken by**: as many eel hits or more, or "didn't notice it" or "too
much".

**Measures**: hits by eels against archers, HP lost, the lowest HP or the
death; shots fired and eels killed, shots a kill; time; dashes.

**Outcome**, 2026-11-02 — **broken**. Cleared in 24s, 3 HP lost — 2 eel
hits, 1 archer's, against `eels-deep`'s 6 HP, 3 eels' — and 7 dashes. One
play; the numbers say fewer hits, and Igor's feel says the opposite:
"horrible idea, drawn path confuses even more. slowing them down is ok".
Taken back, the sway slowed instead: D187 (the eel's sway slower; its path
taken back).

## The slower eel

`2026-11-02-eel-slow` · the same setup as The eel's path, one gate, the
eels swaying 0.5 times a second, not 0.9 (D187 (the eel's sway slower; its
path taken back)).

**Hypothesis**: a shot can lead the slower sway, so the eels land fewer
hits than in `eels-deep`, and Igor says they read. **Broken by**: as many
eel hits, or "still unpredictable"; or "too easy now".

**Measures**: hits by eels against archers, HP lost, the lowest HP or the
death; shots fired and eels killed; time; dashes. Set beside `eels-deep`
and `eel-path`.

**Outcome**, 2026-11-02 — **held on feel**. Igor: "feels good, just about
right". Cleared in 27s, 4 HP lost, every hit an eel's — no fewer than
`eels-deep`'s 3 or `eel-path`'s 2 — and 9 dashes with 8 dash kills. The
hits did not fall; what changed is that the sway reads. One play; the
sway stays as D187 (the eel's sway slower; its path taken back) built it.

