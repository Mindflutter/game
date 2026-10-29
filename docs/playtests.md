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

- [x] `2026-10-28-suit-on` + `2026-10-28-suit-off` — the Suit pair
Each `test.json` holds the exact code; below, `mid` and `late` stand for
the kits' tokens.

- [ ] `2026-10-28-fresh-opening` — layer 1's first three gates, fresh
- [ ] `2026-10-28-puffer-rings` — five puffers at once
- [ ] `2026-10-28-archer-deep` — grade-3 archers behind a screen
- [ ] `2026-10-28-knife-eels` — the Knife against a dozen eels
- [ ] `2026-10-28-harpoon-line` + `2026-10-28-knife-line` — the Harpoon's case
- [ ] `2026-10-28-impact-dash` — the dash as a second weapon
- [ ] `2026-10-28-bulwark-throw` — thrown into the crowd
- [ ] `2026-10-28-boss-cue` — does the boss's stage change read
- [ ] `2026-10-28-boss-lunge-deep` — the last boss, without the Suit

Next to set up, from what these show: the jump from layer 1 to layer 2
("still feel that threat grows fast", `ideas.md`); boosts, once the debug
mode can place one.

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

## Puffer rings

`2026-10-28-puffer-rings` · `L2,G1,S1002,Knife0,darter4,puffer5,`+`mid`
(`mid`, five puffers and four darters) · 1 gate.

**Hypothesis**: puffers killed most in the career's dives 2 and 3, and not
because one ring is hard to read: most puffer hits land while two or more
puffers swell at once, rings overlapping. **Broken by**: most puffer hits
landing with one puffer swelling.

**Measures**: hits by puffer; how many puffers were swelling at each; time.

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

## Impact and the dash

`2026-10-28-impact-dash` · `L1,G3,S1007,Knife0,drifter6,darter10,`+`mid`
with Reflex 3 and Impact 3 · 1 gate.

**Hypothesis**: Impact and Reflex at their caps make the dash a second
weapon — a fifth of the kills or more by dashing, a dash about every 1.5s,
its cooldown spent rather than saved. If not, the two mods differ from the
others in degree only, felt by nobody. **Broken by**: under a tenth of the
kills by dash.

**Measures**: dashes; kills during a dash; the gaps between dashes; time.

## The bulwark's throw

`2026-10-28-bulwark-throw` · `L1,G5,S1008,Knife0,darter8,bulwark3,`+`mid`
(`mid`, three bulwarks and eight darters) · 1 gate.

**Hypothesis**: a bulwark's bite "throws you far" — into the darters: a
bulwark hit is followed by another hit within a second more often than not.
**Broken by**: most bulwark hits followed by none.

**Measures**: hits within a second after each bulwark hit; where the diver
lands; time.

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

## The last boss

`2026-10-28-boss-lunge-deep` · `L3,G6,S1010,Knife2,`+`late`
(`late`, layer 3's boss at grade 3) · 1 gate.

**Hypothesis**: the lunge, 6 of the late kit's 8 HP, decides a late fight on its own:
most lunges dodged, but the one that lands is the fight; the fan and the
escorts barely matter. It feeds the Suit's fix, not a fix of its own.
**Broken by**: the escorts or the fan dealing most of the HP lost.

**Measures**: lunges thrown and landed; HP lost by source; time.
