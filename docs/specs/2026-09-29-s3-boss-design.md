# S3 — One boss, one complete layer — design

2026-09-29. S3 had no spec of its own: this design was the head of its plan,
approved in chat, and is kept here as written when the plan went (D94
(superpowers dropped)). The record is `changelog.md` and D62–D65; where this
and a decision disagree, the decision wins.

## The design

Settled by Igor: D62 (the boss is the layer's last batch), D64 (the boss
lunges), D65 (a mini-boss is a smaller boss); D63 (the win rate is the boss
fight's) is Claude's call, delegated. Parts 1–3 below were presented and
approved ("approved", "looks right", "everything else looks ok"); the help-line
proposal was declined — Igor: "help screen doesnt need this trivial
explanation".

**1. The layer's shape.** D54's twelve batches stay as they are. A mini-boss
batch goes after batch 4 and another after batch 8, and the boss is last: 15
batches, 14 ranks. Each holds its lunger alone. The boss rises from the bottom,
centred (Igor: "The boss swims in from the bottom"); mini-bosses arrive from a
random edge like any batch. Mini-boss ~24 hp, boss ~60 hp — 10s and 24s of pure
shooting at the flat 2.5 hp/s. New scenario `mini-boss`; `last-batch` becomes
the boss.

**2. The lunge.** Chase (slower than the player) → wind-up (stands and swells,
a faint lane shows its path; the line is fixed when the wind-up starts, aimed
where the player was) → charge (along the line at ~3× the player's speed, for
~450px or to the view's edge) → rest (still, the opening) → chase. Boss wind-up
1.0s, mini-boss 1.5s; rest 1.2s. Contact costs a heart like any enemy. The dash
shoves and wounds it like anything else. No health bar.

**3. The ending, the measurement, the checks.** The boss's clear is the layer
end — no rank, no mods (D59) — and "LAYER CLEARED" becomes the real ending.
The bot fights the boss (`last-batch`) and the mini-boss (`mini-boss`) alone,
mortal, starting kit, five seeds; plus how far it gets from the top. The two
`logic.js` comments that promise S3 a layer-owned batch list are reworded
(approved), keeping the `ponytail:` marker.

**Claude's picks** (to be marked in code and docs): every number in 1–2 — hp,
radius, chase speed, the chase minimum before a wind-up (1.0s), wind-up, charge
speed 780px/s, reach 450px, rest, `value`, colours; placing the mini-bosses
after batches 4 and 8; the boss's spawn point (bottom centre, 40px + its
radius below the view); winding up only when fully inside the view.
