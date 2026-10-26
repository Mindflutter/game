# S7 (alpha polish) — design

2026-10-24. S7 (alpha polish): the game made to feel and read like an alpha.
Igor, opening it: "start working on s7". Every call below not quoted from Igor
or a decision is **Claude's**, marked so, and his to reopen. Once built this
spec is history; where it and a decision disagree, the decision wins.

## Taken as settled

- **The stage** — `plan.md` → S7: game feel, among it a fish bumped by the
  shot that hits it; sound; assets only if the condition is hit; UX fixing
  from `ideas.md` → Screens, among it what a tier does; D35 (currency is
  auto-collected)'s `+N`. **Exit**: Igor says it is alpha.
- **Assets wait.** The condition D4 (no assets, ever) waits on is Igor's to
  call, and his note on the shapes says it is not hit: "not saying we must go
  to assets now" (`ideas.md` → Graphics). Until he says otherwise, no asset
  file and no sprite.
- **The dash is not touched.** Igor, 2026-10-21: "leave dash for now,
  discussions needed".
- **Feel is never asserted** (D16 (verification)). A check holds the state a
  feel item keeps — a bump set by a hit, gems summed into one popup — never
  how it looks. Each drawn item is screenshotted before it is called done.
- **Small steps.** One playable item, then stop for Igor to play it.

## The design

### The canvas and the port

D17 (the browser build is a throwaway prototype) says not to invest in the
canvas, and S7 is the stage that draws. Read together, not as a
contradiction: what an item does — when it starts, how long it lasts, what it
shows — is game logic and lives in `game/`, where the port takes it with the
checks; the drawing in `platform/render.js` is the least that shows it. The
port redraws it all.

### The work, in order

Settled items first, so building starts while the open ones are asked.

1. **The drawn bump** — `plan.md`, Igor's word. A fish hit by the diver's
   shot or swing jolts along the hit, drawn over the real knockback of D122
   (knockback). Claude's shape: the body drawn pushed along the hit and
   squashed across it, gone in about 0.1s; a timer and a direction on the
   fish in `game/`, set where the flash is. Fish only: the diver's own knock
   is real since D122 and Igor's to keep or drop; a drawn one for it waits
   for his word.
2. **Bloom's splash, seen** — `bugs.md`. Each fish a splash wounds is shown
   joined to the struck one, and the reach drawn as a ring that fades.
   Claude's shape.
3. **The `+N`** — D35: summed, never one per gem. D35 had Igor pick between
   two built candidates, the corner counter or where the eye is. Gems fly to
   the diver since D78 (gems are pulled to the player), so the eye's
   candidate is now the diver, not the kill — Claude's reading.
4. **What a tier does** — Igor's word. A Weapons or Equipment row says what
   its next tier changes, from what `gearTip()` already works out.
5. **Sound**, with the synthesis there is — a non-goal past it
   (`foundations.md`). Claude's reading of the plan's one word: the moments
   silent today get a voice, each a `SOUNDS` row — a wave arriving (the
   telegraph `ideas.md` → Waves asks about), a batch cleared, the boss
   arriving, the layer end, a fish hit but not killed.
6. **Home from the pause menu** — `ideas.md` → Screens. Ends the dive, its
   gems banked (D67 (currency is kept on death)).
7. **Hints for every fish and pickup** — `ideas.md` → Screens.
8. **`home` shows the diver; gear and attributes stop being lists** —
   `ideas.md` → Screens; reopens D96 and D114 (weapons and equipment on
   screens of their own).
9. **The boss's bar across the top** — `ideas.md` → Health, Claude's lean.
10. **The numbers on mod cards, and the development readout** — `design.md`
    → the status bar: the numbers contradict D34 (mods) on purpose, for
    development, "revisit at S7".

Raised for Igor, not built unless he takes them: a shake when a fish is hit,
and a hitstop on death (`ideas.md` → Suggested). Not S7's unless he moves
them: the pile-up (`ideas.md` → Crowds), music.

### Open, asked one at a time

- 3: which place the `+N` keeps, once both are built.
- 5: answered — Igor, 2026-10-25: "do sounds for all, no music. leave sound
  design out of alpha".
- 6: answered — Igor, 2026-10-26: "do next item, with confirmation".
- 7: where a hint shows — at a fish's first arrival, at `home`, in the help.
- 8: answered — Igor, 2026-10-24: "A". The screens stay; a row says in
  words what its next tier does, and `home` shows the kit, read-only.
  Then, 2026-10-25: "we leave proper ux out of alpha. now - just clarity of
  all player actions" — whether the kit panel stays in S7 is asked when it
  comes up.
- 9: whether the bar moves to the top.
- 10: whether the numbers and the readout stay through alpha.

## Checked against `foundations.md` and `plan.md`

- **Nothing interrupts combat** (the genre contract, 5): the `+N`, the
  hints and the sounds are never modal; a hint mid-dive is a line, not a
  pause.
- **Currency is never chased** (6): the `+N` shows what was collected and
  asks nothing.
- **No mechanic needs more than a sentence** (the pillars): each hint is one.
- **The technical contract**: no dependency and no asset file; sound stays
  synthesis through the seam's `sound`, so the seam does not grow. Splash
  rings and popups are objects under the budget of 500 (D43 (the object
  budget)); the `+N` is summed, so one a moment.
- **Non-goals**: sound design past the synthesis is one, so music stays out.
- **Found**: no contradiction. One smell, D17 against drawing, read above.
