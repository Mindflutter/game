# Play-tests

Every Sonar play-test (D164 (Sonar)): what it supposes, whether it has been
played, and what it showed. A living doc, and the one home of a play-test's
outcome — what a reading concludes is written here in the response that
reads it, so no session loses it. The raw plays stay in `logs/sonar/<id>/`,
ignored by git, and replay any time with `npm run sonar <id>`; each
play-test's setup, `test.json`, is kept in git beside them.

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

Each `test.json` holds the exact code; below, `mid` and `late` stand for
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

- [ ] `2026-10-29-knife-deep` + `gun-deep` + `harpoon-deep` — three
  weapons, one late batch
- [ ] `2026-10-29-unit-puffers` — the threat unit by hand
- [ ] `2026-10-29-dash-on-purpose` — the dash as a second weapon, used
- [ ] `2026-10-29-layer-jump` — layer 1's end into layer 2

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
