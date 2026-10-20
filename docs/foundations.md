# Foundations

**Read this first, every session, before anything else in `docs/`.**

This is the layer that does not change before alpha is complete. If something
here turns out to be wrong, that is a decision — it goes in `decisions.md` as a
superseding entry, and this file is edited in the same step. It is never edited
quietly.

Everything *not* settled lives in `ideas.md`. If you cannot find a rule here,
it is not a rule yet — ask, do not infer.

Source of the design: `high level design.md` (Igor, 2026-09-26). That document
is the frozen input. This one is the working contract derived from it.

---

## Glossary — binding (D32)

The draft uses "level" for two different things and "upgrade" for two more.
These terms are used in docs **and** in code identifiers. Nothing else.

| Term | Means | Not |
|---|---|---|
| **layer** | One section of the abyss you dive into; how many at alpha is in Alpha counts. Unlocked by completing the previous one. | never "level" |
| **dive** | One attempt, start to death or completion. It starts at the top of the first layer and runs on through the layers; completion is clearing the last one — the win (D66, D68). | "run" is its synonym; prefer **dive** |
| **mod** | A dive-scoped power, gone at the end of the dive. A glowing fish carries one in every batch but a boss's or a mini-boss's — kill it and the mod flies to you (D84, D88) — and a layer end offers a pick of **valuable** mods: its own, or an ordinary one at a bigger step (D85). Every mod has a cap (D69). Momentum, not strategy. | never "upgrade" |
| **boost** | A short power a kill drops (D86): switched on by touching it, gone after a few seconds, and gone from the floor if left lying. Not a mod — not counted, no cap, nothing kept. Igor's word. | not a "mod" |
| **gear** | A persistent item bought with currency on the home screen. Weapons, suit, mask, flippers, trinkets. | never "upgrade" |
| **equipment** | Gear that is not a weapon: the suit, mask, flippers and trinkets (D81). Igor's word, and the draft's. | not a weapon — **gear** is both |
| **tier** | One of the purchasable steps a piece of gear advances through; how many is in Alpha counts. | never "level", never "upgrade" |
| **gate** | The depth where a batch waits. The descent stops there — no further in enemies until the batch is cleared, though the water keeps flowing (D27, D58). One of its fish glows from the moment it arrives and carries the batch's mod (D84, D88) — never in a mini-boss's batch, its escorts included (D116). Clearing it opens nothing: the current carries you straight on to the next gate. The layer's last batch is the exception — its clear is the layer end. | not a "wave", not a "batch", not the **layer end** |
| **layer end** | The clear of a layer's last batch — the boss's (D62) — and the bottom the current then carries you to. **Not a gate but a milestone, bigger than one** (D68): it heals you fully, the boss drops a big haul of gems, and it offers a pick of valuable mods — the dive's one pause, ended by Continue (D85) — then the current carries you on into the next layer (D66). The last layer's end offers no pick — there is nothing to go on to — and is the win; its boss still drops its haul. Between layers there is no screen but the pick (D72). The term is Igor's: "or just call it layer end", kept as final (D73). | not a "gate" |
| **boss** | A special enemy type, met in a layer's last batch (D62). It lunges, and spits a fan of shots in turn with the lunge (D64, D117). Its escorts keep coming while it lives — a crowd topped back up to a set size, paying no gems — and die with it, so killing it clears its batch: the **layer end** (D116). | not a "mini-boss" |
| **mini-boss** | A smaller boss: one tougher enemy at an ordinary gate along the layer, leading in its escorts — one ordinary batch, dealt into waves behind it and cleared like any (D116). It lunges like the boss, weaker and slower to wind up, and never spits the boss's fan, so it teaches the boss's tell (D117); it never glows, so its gate pays no mod (D65, D88). | not the "boss" |
| **grade** | How strong a fish arrives: the same fish with its numbers stepped — its hp, its speed, the gems it pays, the damage its attacks take — never its behaviour (D119). Every fish has every grade. Which grade a fish arrives at is the balance system's, never written into a layer or a batch: deeper down, harder grades appear, and a very high grade is never first met in the first layer. Igor's word, "at least for now". | not a "level", not a "tier" |
| **batch** | The gated unit. Cleared before the descent resumes. Contains 1–N enemies — of comparable threat, but for a boss or a mini-boss and its escorts (D116). | not a "wave" |
| **wave** | A spawn group *inside* a batch. **A batch arrives in waves** (D115): the first as the camera reaches the gate, each later one on a clock that does not wait for the arena to empty, its fish trickling in. A batch of one fish is one wave. The boss's escorts are a crowd instead, topped up until it dies (D116). Igor's concern, 2026-09-26, still binds: a batch that keeps refilling reads as "the gate is broken" rather than as a second wave, so a batch must telegraph that more is coming. | not a "batch" |
| **prototype** | The survivors-like auto-shooter this grew out of. A closed phase, not a version of the current game. | not "the game" |
| **home** | The surface screen: shop, the layers unlocked and the depth reached, launch. Every dive starts at the top — there is no layer select (D66). | "base", "backyard" are flavour, not terms |
| **attribute** | A **body** stat raised a **step** at a time by spending attribute points at home, each step a point dearer than the last (D109). Points are earned by in-dive challenges, never bought, and are capped at the source — the ladders hold a finite set of rungs (D36, D109). | not "gear", not a "mod"; a step is not a "tier" |
| **point** | An attribute point (D36): paid by a rung of a challenge, once, ever, and spent at `home` to raise an attribute (D109). Never bought, and it buys no gear. | not currency, not a "mod point" (declined) |
| **challenge** | An in-dive objective that pays attribute points, rewarding **mastery not quotas** — "clear a batch undamaged", never "kill 50 darters" (D36). Each is a ladder of **rungs**, harder up it, each a streak or one dive's feat, earned in any layer (D109). Igor's word (D110). | not an "achievement"; never "micro-task" or "task", its old names |
| **entity** | Any concept the gameplay's mechanics use: a fish, a weapon, a piece of equipment, a mod, a boost, an attribute, a challenge, a layer, a batch, and the diver, though there is one. Every one keeps the diversity rule (D124). Igor's word. | not an **object** |
| **object** | A thing on screen at once: a fish, a shot, a gem, a boost on the floor, a spark. The budget of 500 counts objects (D43). | not an "entity" |

## The genre contract

What this game *is*, stated so a branching session cannot drift off it.

1. **A 2D action roguelite.** Not a survivors-like. That was the prototype
   (D2), and D28 superseded it.
2. **Manual aim and manual fire**, mouse-aimed, LMB-triggered (D20, D28).
   RMB secondary is a later possibility, not a commitment.
3. **The descent is hard-gated by batches** (D27). Motion is smooth between
   gates; the arena locks during one.
4. **Three progression tiers** (D31 — Two-tier progression, D36 — Attributes):
   - `gear` — bought with currency, persists, **combat** stats.
   - `attribute` — earned as points by in-dive challenges, spent freely at
     home, persists, **body** stats.
   - `mod` — carried by a glowing fish in every batch, or picked at a layer
     end; gone at the end of the dive (D84, D85). A `boost` lasts seconds and
     is no tier at all (D86).

   `gear` and `attribute` **sum; they never multiply** (D36). Gear may *require*
   an attribute threshold — that is scheduling, not scaling, and is allowed.
   Attribute points are non-fungible: money cannot buy them and they cannot buy
   gear. That non-fungibility is the entire reason the tier exists.
5. **Nothing interrupts combat** (D33 — Mod offers do not interrupt, D84 —
   Mods are dropped). Mods arrive mid-fight, carried by a glowing fish; the
   one pick sits at a layer end, between layers, never mid-fight — every layer
   end but the last (D85). Mods differ in **kind, not degree** — a pickup has to
   be felt and recognised mid-fight, and the pick must stay a gut read. No modal
   pop-up mid-fight, no XP bar, and no rank (D87).
6. **Combat is the dive's only dynamic system** (D35 — Currency is
   auto-collected). A dive contains fighting, descending, and a pick at each
   layer end. Nothing else. Currency is collected automatically and never
   chased. A boost switches on when touched and cannot be held or stored, so
   grabbing one is positioning inside a fight, not gathering (D86).
   This rules out — without needing a fresh discussion — resource gathering
   mid-dive, mid-dive shops, puzzle or traversal segments, and inventory
   management while diving.
7. **Content is data** (D6 — Content is data, not code). Every enemy, weapon, gear item, mod and batch is a
   record in a flat table. Adding one is a line and touches nothing else. This
   is the property the whole alpha scope depends on — the alpha counts are only
   reachable if adding the fifteenth enemy costs what the second did.
8. **2D, permanently** (D24 — Abyss is 2D, permanently). Not a phase.

## Diversity — the main rule

Igor, 2026-10-20: "diversity is the main rule of the game", and it holds from
the start (D124). Every **entity** keeps these rules; the player's side of each
is Igor's, in quotes.

1. **Readable.** Words and actions map to what happens on screen. "i click
   here now, so that i buy X that does Y so i'd be better on layer N when Z
   enemy arrives"
2. **A new kind keeps the rules at once**, the moment it appears in a design —
   its doc in `entities/` included (D81).
3. **Many.** Every kind reaches its alpha count, below: the borders of an MVP
   that shows the project can go further, changed as the baseline is found.
   "i really have a lot of build and upgrade possibilities, i want to explore
   more. i feel like there's a lot to discover"
4. **Different, always clearly.** Two entities may differ a little or a lot;
   the player always sees how. "i know that right now i got these weapons and
   bonuses and hp etc and i am fighting this guy unlike my previous run where i
   had that setup". Mods still differ in kind, never only in amount (the genre
   contract, 5).
5. **Coupled or not, never contradicting.** Entities may depend on each other;
   a gameplay contradiction the coupling causes is raised and recorded at
   once — Lance on the Harpoon was one (`ideas.md`). "ok this thing looks
   similar but has a slightly different effect, i see it now"
6. **Added without breaking.** A new entity never breaks the gameplay or the
   balance already there: bot dives before and after it hold every pillar
   target (S6 (balance)'s bots). "just tried this new bonus and it improved my
   dive a bit. just met this new enemy and couldnt beat it now, but i got an
   idea and i will kill it in the next run or two"

### Alpha counts

How many of each kind the alpha has: its borders (rule 3). Provisional — a
count changes here, in one line, and nowhere else.

| kind | at alpha | set by |
|---|---|---|
| layer | 3–5 | Igor's draft |
| weapon | 2–3 | Igor's draft |
| equipment | 2–3 | Igor's draft |
| tier, per weapon and per piece of equipment | 3–4 | Igor's draft |
| fish type, the bosses aside | 5–7 | Igor's draft |
| mod | 5–7 | D93 |
| boost | 4–6 | D93 |
| attribute | 3 | D93 |
| challenge | 5 | D109 |
| batch | not set | — |

"Igor's draft" is `high level design.md` → its definition of done.

## Pillars, as things that can be checked

The draft's philosophy section, converted from prose into statements that can
fail. Prose cannot be verified; these can. **The numbers are provisional
targets, validated or replaced at S6** — they exist so that "is this balanced"
has an answer.

| Pillar | Stated as | Target |
|---|---|---|
| Fast-paced | Time to clear one batch | 10–45s |
| Dives are a session, not a sitting | Time to complete one layer; a dive runs until death but can be put down at any point and resumed (D70) | 4–8 min |
| Nothing unbeatable | Every batch is clearable at the gear level expected when it is first met | must hold |
| Nothing trivial | No batch is cleared without the player moving | must hold |
| Relaxed only at home | `home` has no timer, no threat, no fail state | must hold |
| Responsive control | Input to on-screen response | ≤ 2 frames |
| Addictive, not grindy | Dives needed before the first meaningful purchase | ≤ 3 |
| Easy layers stay relevant | A completed layer still rewards a skilled fast clear | must hold |
| Dives differ | Two dives of the same layer draw different batches (D71) | must hold |
| Funny, childish, straightforward | No mechanic needs explaining in more than one sentence | judgement, Igor's |

**Feel is never asserted** (D16). Anything on this list marked "judgement" is
Igor's call and gets no check.

## The technical contract

- **Canvas 2D, zero *runtime* dependencies** (D30, D43). `shadowBlur` is used
  directly, per frame — the offscreen glow cache was cancelled once measurement
  showed glow costs 0.05ms of a 16.7ms frame at the object budget. `index.html`
  loads no libraries and stays double-clickable. Dev-only test tooling (Vitest,
  fast-check — D39) is exempt: it never ships and never loads at runtime.
- **A check that cannot fail is not a check** (D39). The suite counts, groups
  and reports `N passed / M failed`. `console.assert` is banned — it logs and
  continues, which let the old suite print "checks done" over real failures.
- **Every recorded decision gets an invariant guarding it** (D39). A decision
  without a check erodes silently. This is what makes the suite covering; a
  coverage percentage is not.
- **Object budget: 500 objects on screen at once — a *design* limit, not a
  technical one** (D43). Measured 2026-09-27: at 500 objects a whole frame
  costs under 1ms of a 16.7ms budget, and the headroom is roughly 4000. The
  number says how much should be on screen at once, not what the machine can
  bear. Dependencies are revisited only on a measured failure, and there is
  currently no failure to revisit.
- **The `game/` ⁄ `platform/` seam is maintained** (D18, D30, D44). `game/`
  contains zero browser API and reaches across for exactly seven names — the
  seventh, `persist`, is the save's (D77). This is **enforced, not asserted**:
  `npm test` loads `game/` in Node with only those seven stubbed. Every
  addition is deliberate and listed in `design.md`.
- **Fixed timestep for the simulation**, from S1. `FIXED_DT` is 1/120 and the
  frame loop banks leftover time, so every machine simulates the same game.
  Time-based decay still uses `Math.pow(x, dt)`. **Render interpolation was
  dropped** (D53): a shorter tick buys the same smoothness without touching
  every draw call, which is the layer this project does not invest in. Fast
  hitboxes do not rely on the timestep at all — the dash and bullets sweep the
  segment they crossed (D50, D53), so tunneling is impossible at any speed
  rather than merely unlikely at a bounded one.
- **Seeded RNG for every dive**, from S0. Required twice over: for paired
  balance comparisons, and because "dives must differ" is a claim about
  controlled variation, which needs control.
- **Saves carry a `version` field from the first write.** Retrofitting schema
  migration is near-impossible once saves exist, including your own. From its
  first version the save also holds the dive in progress, resumable at any
  point (D70).
- **Difficulty is invariant to window size** (D29). It was a measured bug once;
  a camera is what can silently reintroduce it. It has a check.
- **Checks run two ways**: `index.html?test` in the browser, and headless in
  Node — `game/` has no browser API, so it loads directly, no dependencies.
- **All UI is canvas, and its layout is data** (D38 — The `home` screen is
  canvas). One helper turns a list into rectangles; every screen uses it. Pure
  geometry, so it lives in `game/`, ports, and is checkable — no screen is
  exempt from the verification contract.

## Non-goals before alpha

Named so they stop being re-proposed.

- The native port. After alpha (D17, D30), not during.
- Sprites and real art — **unless** the condition Igor set is hit: enemies
  indistinguishable, layers indistinguishable, or the experience reads as
  visually clumsy. Then it moves to S7 and D4 is revisited.
- Storyline, dialogue, sound design beyond the existing synthesis.
- Enemy elemental weaknesses and resistances. Recorded as a future
  opportunity by the draft itself, explicitly too much for now.
- A second **money** — a fungible drop spent alongside the first. Narrowed by
  D36: attribute points *are* technically a second currency, but non-fungible
  progression points are a different animal and are permitted.
- **Multiplicative interaction between `gear` and `attribute`** (D36). They sum.
  Parked in `ideas.md`, not declined.
- Multiplayer, mobile, touch, controller.
- Shipping: no itch.io page, no store presence.

## What is deliberately still open

Tracked in `ideas.md`, not here. The draft's own `(?)` markers plus what this
contract does not decide: the lost item, what currency is called, whether
collectibles feed stats or story or both, terrain complexity beyond a vertical
shaft. Which attributes exist and what each challenge is was S5 (content)'s,
and is D98, made ladders by D109.
