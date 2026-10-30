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

**Where it starts to hurt**, looked for with the diver bot first
(2026-10-29, eight seeds a setup): with the `late` kit, layer 3's deepest
ordinary batch costs it 0.3 HP, and five times the batch, 113 fish at
grade 3, still under a heart — no count the debug mode can set reaches the
knee. The same batch and kit with the Gun or the Harpoon instead costs it
hearts, and some dives (Three weapons, one late batch, below). So the next
play-tests ask what the bot says it is — the weapon — rather than climbing
counts.
Still to set up: boosts, once the debug mode can place one.

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
lunge is 4 and a point a grade (5, then 6), every other attack 1–3. What to
change is open: `ideas.md` → The economy and the fights.

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
