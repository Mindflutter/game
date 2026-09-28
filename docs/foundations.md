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
| **layer** | One section of the abyss you dive into. 3–5 of them at alpha. Unlocked by completing the previous one. | never "level" |
| **dive** | One attempt at a layer, start to death or completion. | "run" is its synonym; prefer **dive** |
| **rank** | In-dive progress, reset every dive. **One rank per batch cleared** — there is no XP bar and no curve (D34 — Mods) — except a layer's last batch, whose clear is the **layer end** and pays none (D59): a layer of N batches pays N − 1 ranks. | never "level" |
| **mod** | A dive-scoped pick, offered as one of three at a gate, gone at the end of the dive. Momentum, not strategy. | never "upgrade" |
| **gear** | A persistent item bought with currency on the home screen. Weapons, suit, mask, flippers, trinkets. | never "upgrade" |
| **tier** | One of the 3–4 purchasable steps a piece of gear advances through. | never "level", never "upgrade" |
| **gate** | The depth where a batch waits. The descent stops there — no further in enemies until the batch is cleared, though the water keeps flowing (D27, D58). Clearing it pays one rank and offers three mods (D33, D34): the dive's one pause, since play waits on the pick. The layer's last batch is the exception — its clear is the layer end. Then the current carries you on to the next gate. | not a "wave", not a "batch", not the **layer end** |
| **layer end** | The clear of a layer's last batch, and the bottom the current then carries you to. **Not a gate**: it pays no rank and offers no mods — mods only if the player goes on to the next layer (D59). What else happens there is not designed yet — `ideas.md`. The name is Igor's working one: "or just call it layer end". | not a "gate" |
| **batch** | The gated unit. Cleared before the descent resumes. Contains 1–N enemies of comparable threat. | not a "wave" |
| **wave** | A spawn group *inside* a batch. **Default: one batch is one wave.** Multi-wave batches are permitted but are a UX risk — Igor's concern, 2026-09-26: a batch that keeps refilling reads as "the gate is broken" rather than as a second wave. Any multi-wave batch must telegraph that more is coming. | not a "batch" |
| **prototype** | The survivors-like auto-shooter this grew out of. A closed phase, not a version of the current game. | not "the game" |
| **home** | The surface screen: shop, layer select, launch. | "base", "backyard" are flavour, not terms |
| **attribute** | A **body** stat raised by spending attribute points at home. Points are earned by in-dive micro-tasks, never bought, and are capped at the source — a layer holds a finite set of tasks (D36). | not "gear", not a "mod" |
| **micro-task** | An in-dive objective that pays attribute points, rewarding **mastery not quotas** — "clear a batch undamaged", never "kill 50 darters" (D36). | not an "achievement" |

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
   - `attribute` — earned as points by in-dive micro-tasks, spent freely at
     home, persists, **body** stats.
   - `mod` — picked at a gate, gone at the end of the dive.

   `gear` and `attribute` **sum; they never multiply** (D36). Gear may *require*
   an attribute threshold — that is scheduling, not scaling, and is allowed.
   Attribute points are non-fungible: money cannot buy them and they cannot buy
   gear. That non-fungibility is the entire reason the tier exists.
5. **Nothing interrupts combat** (D33 — Mod offers do not interrupt, D34 —
   Mods). One rank per batch cleared and three mods offered at the gate —
   neither at the layer end (D59); chosen in about a second. Mods differ in **kind, not degree** — comparing numbers is
   the heavy thinking the dive must not contain. No modal pop-up mid-fight, and
   no XP bar.
6. **Combat is the dive's only dynamic system** (D35 — Currency is
   auto-collected). A dive contains fighting, descending, and one one-second mod
   pick. Nothing else. Currency is collected automatically and never chased.
   This rules out — without needing a fresh discussion — resource gathering
   mid-dive, mid-dive shops, puzzle or traversal segments, and inventory
   management while diving.
7. **Content is data** (D6 — Content is data, not code). Every enemy, weapon, gear item, mod and batch is a
   record in a flat table. Adding one is a line and touches nothing else. This
   is the property the whole alpha scope depends on — the DoD counts are only
   achievable if adding the fifteenth enemy costs what the second did.
8. **2D, permanently** (D24 — Abyss is 2D, permanently). Not a phase.

## Pillars, as things that can be checked

The draft's philosophy section, converted from prose into statements that can
fail. Prose cannot be verified; these can. **The numbers are provisional
targets, validated or replaced at S6** — they exist so that "is this balanced"
has an answer.

| Pillar | Stated as | Target |
|---|---|---|
| Fast-paced | Time to clear one batch | 10–45s |
| Dives are a session, not a sitting | Time to complete one layer | 4–8 min |
| Nothing unbeatable | Every batch is clearable at the gear level expected when it is first met | must hold |
| Nothing trivial | No batch is cleared without the player moving | must hold |
| Relaxed only at home | `home` has no timer, no threat, no fail state | must hold |
| Responsive control | Input to on-screen response | ≤ 2 frames |
| Addictive, not grindy | Dives needed before the first meaningful purchase | ≤ 3 |
| Easy layers stay relevant | A completed layer still rewards a skilled fast clear | must hold |
| Dives differ | Two dives of the same layer draw different batches | must hold |
| Funny, childish, straightforward | No mechanic needs explaining in more than one sentence | judgement, Igor's |

**Feel is never asserted** (D16). Anything on this list marked "judgement" is
Igor's call and gets no check.

## The technical contract

- **Canvas 2D, zero *runtime* dependencies** (D30, D43). `shadowBlur` is used
  directly, per frame — the offscreen glow cache was cancelled once measurement
  showed glow costs 0.05ms of a 16.7ms frame at the entity budget. `index.html`
  loads no libraries and stays double-clickable. Dev-only test tooling (Vitest,
  fast-check — D39) is exempt: it never ships and never loads at runtime.
- **A check that cannot fail is not a check** (D39). The suite counts, groups
  and reports `N passed / M failed`. `console.assert` is banned — it logs and
  continues, which let the old suite print "checks done" over real failures.
- **Every recorded decision gets an invariant guarding it** (D39). A decision
  without a check erodes silently. This is what makes the suite covering; a
  coverage percentage is not.
- **Entity budget: 500 simultaneous entities — a *design* limit, not a
  technical one** (D43). Measured 2026-09-27: at 500 entities a whole frame
  costs under 1ms of a 16.7ms budget, and the headroom is roughly 4000. The
  number says how much should be on screen at once, not what the machine can
  bear. Dependencies are revisited only on a measured failure, and there is
  currently no failure to revisit.
- **The `game/` ⁄ `platform/` seam is maintained** (D18, D30, D44). `game/`
  contains zero browser API and reaches across for exactly six names. This is
  **enforced, not asserted**: `npm test` loads `game/` in Node with only those
  six stubbed. Every addition is deliberate and listed in `design.md`.
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
  migration is near-impossible once saves exist, including your own.
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
contract does not decide: the lost item, what happens at the **layer end** —
whether it returns you home or offers a choice, and what it looks like (D59
settles only that it offers no mods unless you go on), what currency is called, what mini-bosses are, whether
collectibles feed stats or story or both, **which** attributes exist and what
each micro-task is (the tier itself is settled by D36; its content is S5 work),
terrain complexity beyond a vertical shaft.
