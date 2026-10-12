// ===== content =====
// Every tuning number and every content table. No behaviour, no browser.

// ---------- the view ----------
// The game always sees a 1280x800 window onto the world, whatever the window
// size, so difficulty doesn't depend on your monitor (D29). Since S2 the world
// is a tall strip and this is the camera's view of it, `cameraY` from the top.
// We scale the view up to fill the window. Any leftover margin is painted the
// same colour as the water, so the letterboxing is invisible.
const ARENA_W = 1280;
const ARENA_H = 800;

// ---------- balance ----------
// Every number that decides how the game plays, in one place. These are the
// real product of this prototype: the rendering gets rewritten on any port,
// these transfer as-is.
// Anything a mod can raise has to be a field here rather than a bare constant,
// which is why the dash cooldown and the i-frames moved in (D34): a mod is a
// line of data, and a line of data cannot edit a `const`.
// The diver alone: the weapon's numbers join these when a dive starts, from
// the one it carries (`WEAPONS`, D83).
const PLAYER_START = {
  r: 10,             // radius, in pixels
  speed: 260,        // pixels per second
  hp: 3,
  maxHp: 3,
  iframes: 1,        // seconds of invulnerability after a hit
  dashCooldown: 2.2, // seconds before you can dash again
  dashSpeed: 884,    // px/s while dashing -- its OWN number, not a multiple of
                     // `speed`. It used to be speed x 3.4, which meant every
                     // `Fins` lengthened the lunge and a late dive crossed a
                     // third of the arena untouchable (D56)
  mendOnClear: 0,    // hp healed per batch cleared -- a comfort mod grants it
  dashDamage: 0,     // the dash starts as pure movement (D51). It always shoves;
                     // hurting what it shoves is bought, never free
};

// The dash. Short, offensive, and on a long enough leash that spending it is a
// decision: you pass through the swarm unharmed and hurt everything you touch,
// so diving into a crowd is a play rather than a mistake.
const DASH_TIME      = 0.16;  // seconds of dash -- about 140px of travel
const DASH_GRACE     = 0.15;  // extra invulnerability after it, so you don't
                              // land inside the enemy you just flew through
// The dash pushes a wave ahead of it rather than only hitting what it bumps
// into: everything within reach AND in front of the direction of travel.
const DASH_REACH     = 40;    // px past an enemy's own radius -- vs 10 for the body
const DASH_ARC       = 0.2;   // cos of the half-angle: 0.2 is a 156-degree front
const DASH_END       = 0.18;  // seconds of the ring that closes the dash
const DASH_PUSH      = 320;   // px/s the wave shoves an enemy outward...
const PUSH_DRAG      = 0.02;  // ...bleeding to 2% per second, so about 80px

// Gems fly to you from wherever they drop, and never fade (D35): currency is
// collected automatically and never chased. 600 rather than the old 300, which
// was a pull *inside* a 75px pickup ring -- from across the view it has to
// outrun a swimming player (260px/s, more with Fins). Claude's pick.
const GEM_PULL       = 600;   // px/s a gem flies toward you
const ENEMY_JITTER   = 0.3;   // spread of speeds around a type's nominal speed
const GATE_PAUSE     = 1.2;   // seconds of quiet before a dive's FIRST batch, so
                              // a dive opens calm. Every later batch waits on the
                              // descent instead (S2), which is its own beat.
// The descent (S2, D58). The world is a tall strip; each batch waits at its own
// depth and a current carries the view from one to the next. The current never
// stops -- it only slows while a batch is fought, when the camera holds and
// only the water moves. All four are Claude's picks, not derived -- the bot
// measures them, Igor's feel judges them.
const GATE_SPACING   = 400;   // world px between gate depths: ~2s of travel.
                              // Igor, 2026-09-28: "only a couple of seconds
                              // between batches" (was 1600, ~12s)
const CURRENT_SPEED  = 200;   // px/s between batches
const CURRENT_CRAWL  = 30;    // px/s during a fight: the water still flows
const CURRENT_EASE   = 0.05;  // fraction of the speed change still left after
                              // one second -- eases up after a clear, down on
                              // an arrival, never a jolt
// The simulation's one and only step size (D53). Everything that drives
// `update()` uses it: the frame loop's accumulator, `advance()`, and the bot.
// 1/120 rather than 1/60 because there is no render interpolation — the picture
// is drawn wherever the last tick left things, so the step size *is* the
// smoothness, and 8ms of stale position is invisible where 17ms is not.
const FIXED_DT       = 1 / 120;
// The longest real frame the simulation will believe in. Caps tab-switching
// (a minute away must not teleport everything) and doubles as the catch-up
// bound: at most MAX_FRAME_DT / FIXED_DT = 6 ticks per frame, so a slow frame
// cannot spiral into simulating forever.
const MAX_FRAME_DT   = 0.05;
const NOTICE_TIME    = 2.5;   // seconds a micro-task's line stays up. Claude's pick
const MOD_OFFER_DELAY = 0.6;  // seconds between the boss dying and the layer
                              // end's cards appearing. The kill burst lives
                              // 0.5s, so anything shorter drops the offer on top
                              // of the death it is rewarding: a jump cut.
// What a dive picks up (D84, D85, D86). Every number is Claude's pick, S6's.
const END_STEP       = 2;     // picks at once: an ordinary mod on a layer end's card
// A boost's chance on the Nth kill since the last one is BOOST_C x N -- the
// pseudo-random distribution Dota uses: about one boost every 8.5 kills, never
// more than 50 apart, and seldom two in a row.
const BOOST_C        = 0.02;
const BOOST_LIFE     = 6;     // seconds a boost lies where it fell, then it is gone

let bulletId = 0;           // so a piercing shot can't hit the same enemy twice

// ---------- settings ----------
const SHAKE_LEVELS = [
  { name: 'off',    mul: 0 },
  { name: 'low',    mul: 0.5 },
  { name: 'normal', mul: 1 },
];
// Shake eases out exponentially: a hard linear stop reads as the picture
// being switched off, an exponential tail reads as the water settling.
const SHAKE_FADE  = 0.02;   // fraction of the shake still left after one second
const SHAKE_FLOOR = 0.15;   // below a fifth of a pixel, snap to a still picture
const SHAKE_HURT  = 7;      // px, taking a hit
const SHAKE_DEATH = 38;     // px, dying -- a real slam, it only happens once

// ---------- sound ----------
// Every sound is an oscillator and a fading volume envelope. No audio files.
// `vol` is peak amplitude, 0..1. Anything under about 0.15 is inaudible on
// laptop speakers for a short blip -- the ?test checks hold us to that.
const SOUNDS = {
  shoot:  { freq: 680,  dur: 0.05, type: 'square',   vol: 0.20, slide: 0.55 },
  dash:   { freq: 520,  dur: 0.18, type: 'triangle', vol: 0.30, slide: 0.32 },
  kill:   { freq: 200,  dur: 0.11, type: 'sawtooth', vol: 0.32, slide: 0.45 },
  gem:    { freq: 1150, dur: 0.05, type: 'sine',     vol: 0.22, slide: 1.3  },
  hurt:   { freq: 110,  dur: 0.28, type: 'sawtooth', vol: 0.55, slide: 0.4  },
  death:  { freq: 70,   dur: 0.90, type: 'sawtooth', vol: 0.60, slide: 0.3  },
  modA:   { freq: 520,  dur: 0.09, type: 'triangle', vol: 0.40, slide: 1    },
  modB:   { freq: 780,  dur: 0.16, type: 'triangle', vol: 0.35, slide: 1.25 },
  boost:  { freq: 440,  dur: 0.14, type: 'square',   vol: 0.25, slide: 1.8  },
};

// ---------- mods ----------
// A dive-scoped power, gone at the end of the dive: carried by a glowing fish
// in every batch (D84), or picked from valuable mods at a layer end (D85).
// Just data: adding one is a line here and nothing else.
// Documented in docs/entities/mods.md -- `npm test` holds it here.
//
// `scope` is **body** or **comfort**, and nothing else until S5 — Content.
// Weapon-scoped mods are deliberately absent: "+35% fire rate" is meaningless on
// a melee weapon and "+1 damage" is huge on a railgun and nothing on a spray
// gun, so a weapon mod cannot be balanced before the weapons exist. Body and
// comfort mods are weapon-agnostic by construction, which is what makes them
// the safe starting pool — and it keeps S1 from balancing mods and manual fire
// against each other at once. The prototype's Rapid Fire, Power, Reach and
// Pierce were all weapon mods; they went here.
//
// Mods differ in **kind, not degree**: a pickup has to be felt and recognised
// in the middle of a fight, and the layer end's pick stays a gut read. That is
// why the descriptions read as sentences and not as stat lines.
//
// `max` is how many times one mod can be taken. It exists so the draws can
// refuse a mod that is already maxed, which is the only way a bounded stat (a
// cooldown has a floor of zero) stays honest. Since D69 every mod has one -- a
// switch caps at 1, anything that stacks at 3 -- so a dive's power has a
// ceiling that deep layers can be tuned against. Where the caps sit is S6's.
//
// `end` marks one of the layer end's own mods (D85): offered only on its cards,
// never carried by a fish. An ordinary mod reaches those cards too, at the
// bigger step, END_STEP picks at once.
//
// Two mods D34 named are deliberately absent: pickup radius and a currency
// magnet. D35 was recorded hours later and auto-collects currency, which leaves
// both of them with nothing to do — building either now would be building a
// husk. Every mod can max out, so a long dive runs the pool short; then no fish
// glows (D84), and more mods is S5 — Content, not a reason to pad the pool here.
const MODS = [
  { name: 'Fins',     scope: 'body',    desc: 'you swim faster', max: 3,
    apply: p => p.speed += 45 },
  { name: 'Vitality', scope: 'body',    desc: 'one more heart, it comes full', max: 3,
    apply: p => { p.maxHp += 1; p.hp += 1; } },
  { name: 'Reflex',   scope: 'body',    desc: 'the dash comes back sooner', max: 3,
    apply: p => p.dashCooldown -= 0.4 },
  { name: 'Nerve',    scope: 'body',    desc: 'hits leave you safe longer', max: 3,
    apply: p => p.iframes += 0.3 },
  { name: 'Impact',   scope: 'body',    desc: 'the dash wounds what it throws', max: 3,
    apply: p => p.dashDamage += 1 },
  { name: 'Mend',     scope: 'comfort', desc: 'a heart back each batch', max: 1,
    end: true, apply: p => p.mendOnClear = 1 },
];

// ---------- boosts ----------
// A short power a kill drops (D86): switched on by touching it, gone after
// `time` seconds, and gone from the floor after BOOST_LIFE if nobody touches
// it. Not a mod -- not counted, no cap, nothing kept. `add` is numbers rather
// than a function so it can be taken back when the time runs out; for the same
// reason a boost never moves `hp`. Touching one already running restarts its
// clock and adds nothing more.
// Documented in docs/entities/boosts.md -- `npm test` holds it here.
const BOOSTS = [
  { name: 'Rush', desc: 'you swim much faster, for a moment', time: 5, add: { speed: 200 } },
];

// ---------- gear, attributes, micro-tasks ----------
// What persists between dives, spent at `home` (D31, D36). Each is a line of
// data whose `apply` raises the player -- once per point held, or once per
// tier, each tier its own (D83) -- so the second item costs what the first
// did. All three sum with each other and with mods, which add on top during a
// dive; nothing multiplies (D36, and Igor, 2026-09-30: "mods on top of
// gear/equipment/stats").
//
// The save keys them by `name`, so renaming one orphans what players own.
//
// Every number here is Claude's pick, S6's to tune: the gun's +0.5 shots/s and
// 40 / 100 / 200 gems, dash reach's +150px/s (141 -> 165 -> 189px of dash),
// one point per task.

// `gear` -- bought with gems, combat stats: the weapons, then the equipment.
// Each tier is `{ cost, apply }`, in the order they are bought.
//
// A weapon is the shot a dive fires (D83): `fireRate` shots per second,
// `damage` a hit, gone after `range` px, flying at `shotSpeed` px/s with a
// `shotRadius` hitbox, through `pierce` extra enemies. A dive carries one and
// copies these onto the player, where mods, attributes and the readout find
// them -- so a railgun, or a jab that is a short fat shot, is a line here.
// Documented in docs/entities/weapons.md -- `npm test` holds it here.
const WEAPONS = [
  { name: 'Gun', fireRate: 2.5, damage: 1, range: 250, shotSpeed: 430, shotRadius: 4, pierce: 0,
    tiers: [{ cost: 40,  apply: p => p.fireRate += 0.5 },
            { cost: 100, apply: p => p.fireRate += 0.5 },
            { cost: 200, apply: p => p.fireRate += 0.5 }] },
];

// Equipment: gear that is not a weapon (D81). None yet -- S5 (content)'s.
// Documented in docs/entities/equipment.md -- `npm test` holds it here.
const EQUIPMENT = [];

// `attribute` -- body stats, raised by points that only micro-tasks pay.
// Uncapped at the spending end: a layer holds a finite set of tasks, so the
// cap is at the source (D36). Dash improvements live here, not in gear -- D36
// names "dash" a body stat.
const ATTRIBUTES = [
  { name: 'Dash reach', apply: p => p.dashSpeed += 150 },
];

// `micro-task` -- mastery, never a quota (D36). Judged when a batch clears;
// each pays its `points` once per layer, ever. `met()` reads the dive's state
// at that moment.
const TASKS = [
  { name: 'untouched', desc: 'clear a batch without taking a hit', points: 1,
    met: () => !batchHit },
];

// ---------- the development readout ----------
// Every player number worth watching while the game is being built, as a flat
// list so adding a stat is a line (D52). These are *development* numbers: Igor
// wants to see what his character actually is, and the whole block is expected
// to be dropped or trimmed before alpha. `read` returns a string or a number.
// `stat` names the player field, which is what lets a check prove the readout
// is complete: anything a mod can change must be shown, or the number Igor is
// watching silently stops covering the thing that moved. `hp` and `maxHp` are
// the exception, drawn as `HP 3/4` on the line above; the check names them.
const PLAYER_STATS = [
  { stat: 'speed',        label: 'spd',     read: p => Math.round(p.speed) },
  { stat: 'range',        label: 'rng',     read: p => Math.round(p.range) },
  { stat: 'fireRate',     label: 'rate',    read: p => p.fireRate.toFixed(2) + '/s' },
  { stat: 'damage',       label: 'dmg',     read: p => p.damage },
  { stat: 'pierce',       label: 'pierce',  read: p => p.pierce },
  { stat: 'dashDamage',   label: 'dashdmg', read: p => p.dashDamage },
  { stat: 'dashCooldown', label: 'dashcd',  read: p => p.dashCooldown.toFixed(1) + 's' },
  { stat: 'iframes',      label: 'ifr',     read: p => p.iframes.toFixed(2) + 's' },
  { stat: 'mendOnClear',  label: 'mend',    read: p => p.mendOnClear },
];

// Menu and options rows: one full-width band per entry, anchored on the text
// baseline the renderer draws at, so the mouse can hit a row anywhere along it
// rather than only on the glyphs.
const ROW_W = 420, ROW_H = 38, ROW_STEP = 46;
const MENU_TOP = 380, OPTION_TOP = 300;
function rowRect(i, top) {
  return { x: ARENA_W / 2 - ROW_W / 2, y: top + i * ROW_STEP - 26, w: ROW_W, h: ROW_H };
}

// Where the three mod cards sit, in arena coordinates. The renderer draws
// these and the logic hit-tests the mouse against them, so the numbers belong
// to neither of them.
// `CARD_PAD` is the margin a description must leave on each side. The renderer
// centres the text and so cannot notice it overflowing; the check measures
// against this.
const CARD_W = 220, CARD_H = 186, CARD_GAP = 24, CARD_PAD = 12;
// How many "stat from -> to" rows a card has room for. A check holds the mod
// pool to this, so a mod that moves a third stat fails the suite rather than
// dropping a number off the bottom of the card.
const MOD_ROWS = 2;
function cardRect(i, n) {
  const totalW = n * CARD_W + (n - 1) * CARD_GAP;
  return { x: ARENA_W / 2 - totalW / 2 + i * (CARD_W + CARD_GAP),
           y: ARENA_H / 2 - CARD_H / 2, w: CARD_W, h: CARD_H };
}

// The layer end's Continue (D85), under the cards: a card is marked, and taken
// here. Derived from the cards' box, so moving them moves it.
function continueRect() {
  const c = cardRect(0, 1);
  return { x: ARENA_W / 2 - CARD_W / 2, y: c.y + c.h + 20, w: CARD_W, h: ROW_H };
}

// The ordinary mods still under their caps: what a fish can carry (D84).
function carriable() {
  return MODS.filter(m => !m.end && (modCounts[m.name] || 0) < m.max);
}

// The mod a glowing fish carries: every ordinary mod once before any comes
// again -- a round, dealt from the seed and refilled when spent, the way
// Tetris deals its pieces -- and none past its cap. `null` once every one is
// capped, and then no fish lights up: caps are balance's question, and that is
// the easiest answer until S6 (Igor, 2026-10-12).
function drawCarried() {
  const open = carriable();
  if (!open.length) return null;
  let fresh = open.filter(m => !modRound.includes(m.name));
  if (!fresh.length) {
    modRound = [];
    fresh = open;
  }
  const m = drawDistinct(fresh, 1)[0];
  modRound.push(m.name);
  return m;
}

// How many picks a layer end's card gives (D85): one of its own mods once, an
// ordinary one at the bigger step.
const cardStep = m => (m.end ? 1 : END_STEP);

// The layer end's cards: up to three valuable mods, distinct, from one pool --
// its own mods and the ordinary ones, each only with room under its cap for
// what the card gives. Fewer when the pool runs short; none at all leaves only
// Continue.
function rollValuable() {
  return drawDistinct(MODS.filter(m => (modCounts[m.name] || 0) + cardStep(m) <= m.max), 3);
}

// ---------- key bindings ----------
// Which physical key means which action. Content, not platform: the game decides
// that dashing is Space, while reading the keyboard is platform's job. Keeping
// them here is what holds the port seam at exactly seven names -- `game/` used to
// reach across for these as well, which a headless load in Node caught.
//
// Always `e.code` (the physical key), never `e.key` (the character it types) --
// see D12. On a Russian layout WASD type ц/ф/ы/в; on AZERTY they are ZQSD.
const UP    = ['ArrowUp', 'KeyW'];
const DOWN  = ['ArrowDown', 'KeyS'];
const LEFT  = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const GO    = ['Enter', 'NumpadEnter', 'Space'];
const DASH  = ['Space'];
const CLICK = ['Mouse0'];

// ---------- batches ----------
// A batch is the gated unit (D27): it arrives, you clear it, and only then does
// the next one come. Counts per enemy type; where they enter is the arena edge,
// picked from the dive's seed. Adding a batch is a line.
//
// These sizes are NOT tuned. D28 invalidated every balance constant when the
// weapon became manual, and there is no point deriving new ones until the queue
// they feed exists -- which is what this is. Tuning is the next step.
// **Re-derived from scratch, D54.** The first set was never tuned -- D48 said
// so at the time -- and Igor playing it confirmed they were trivial. The
// arithmetic says why: the weapon does `fireRate x damage` = 2.5 hp/s and
// **nothing in the mod pool raises damage** (D34 -- the pool is body and
// comfort), so a dive's kill rate is flat. To occupy the 10-45s a batch is
// supposed to take, a batch has to hold 25-112 hp. The old ones held 3-15,
// i.e. 1.2-6.0s of shooting: every one of them was under target, and no
// amount of enemy *placement* was going to fix a factor of five.
//
// These are sized on hp first. Real clears run longer than the raw figure,
// because approaching, missing and kiting are not shooting -- so the low end
// is deliberately under 25.
//
//  #   composition                        hp   shooting time
//  1   10 drifter                         10   4.0s
//  2   16 drifter                         16   6.4s
//  3   12 drifter + 6 darter              18   7.2s
//  4   14 darter                          14   5.6s
//  -   1 mini-boss                        24   9.6s
//  5   2 bulwark + 12 drifter             24   9.6s
//  6   18 drifter + 8 darter              26  10.4s
//  7   3 bulwark + 10 darter              28  11.2s
//  8   20 drifter + 12 darter             32  12.8s
//  -   1 mini-boss                        24   9.6s
//  9   4 bulwark + 16 drifter             40  16.0s
// 10   18 darter + 16 drifter             34  13.6s
// 11   5 bulwark + 18 drifter + 8 darter  56  22.4s
// 12   6 bulwark + 20 drifter + 12 darter 68  27.2s
//  -   1 boss                             60  24.0s
//
// Twelve, because D34 sizes a layer at about twelve gates and therefore twelve
// mods. The peak is 38 simultaneous enemies, against a design budget of 500.
// S3 added the rows marked `-`: a mini-boss after batches 4 and 8, and the
// boss as the layer's last batch (D62, D65) -- fifteen in all. Where the
// mini-bosses sit is Claude's pick.
//
// S4 (D71): the table above is now three **pools**, one per stretch between
// the mini-bosses, and a dive draws four of each from its seed. Each pool got
// one batch more than it draws, sized into its stretch's hp band -- Claude's
// picks, marked `new` below: 14, 26 and 42 hp. S5 fills the pools out.
const STRETCH_1 = [
  { enemies: [['drifter', 10]] },
  { enemies: [['drifter', 16]] },
  { enemies: [['drifter', 12], ['darter', 6]] },
  { enemies: [['darter', 14]] },
  { enemies: [['drifter', 8], ['darter', 6]] },                  // new, 14 hp
];
const STRETCH_2 = [
  { enemies: [['bulwark', 2], ['drifter', 12]] },
  { enemies: [['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 3], ['darter', 10]] },
  { enemies: [['drifter', 20], ['darter', 12]] },
  { enemies: [['bulwark', 1], ['drifter', 14], ['darter', 6]] }, // new, 26 hp
];
const STRETCH_3 = [
  { enemies: [['bulwark', 4], ['drifter', 16]] },
  { enemies: [['darter', 18], ['drifter', 16]] },
  { enemies: [['bulwark', 5], ['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 6], ['drifter', 20], ['darter', 12]] },
  { enemies: [['bulwark', 3], ['darter', 14], ['drifter', 10]] }, // new, 42 hp
];
const MINI_BOSS = { enemies: [['mini-boss', 1]] };
const BOSS      = { enemies: [['boss', 1]] };

// ---------- layers ----------
// A layer is a record that owns its batches (D71): a run of **stretches**,
// each a pool and how many to `draw` from it. One shape for all of them -- a
// mini-boss or the boss is a stretch whose pool holds one batch and draws one,
// so their fixed places need no special case. The last stretch's batch is the
// layer end (D68).
//
// `color` is the water at the top of the layer, darkening to the same
// near-black at its bottom. PLACEHOLDER GRAPHICS (D72): the colour and the
// name are the cheapest way to say "a new layer" until art exists.
//
// The second layer is the first one's stretches under its own name and colour
// -- a placeholder until S5 gives it content of its own. The colours are
// Claude's picks; the layers are numbered until they are named (D89) -- Igor,
// 2026-10-12: "make it layer 1 & 2, we'll come up with namings later".
const STRETCHES = [
  { draw: 4, pool: STRETCH_1 },
  { draw: 1, pool: [MINI_BOSS] },
  { draw: 4, pool: STRETCH_2 },
  { draw: 1, pool: [MINI_BOSS] },
  { draw: 4, pool: STRETCH_3 },
  { draw: 1, pool: [BOSS] },
];
const LAYERS = [
  { name: 'Layer 1', color: [12, 23, 39], stretches: STRETCHES },
  { name: 'Layer 2', color: [24, 12, 40], stretches: STRETCHES },
];

// ---------- scenarios ----------
// Named dev setups (D37). `?dev=<name>` loads one in isolation so a single
// thing can be watched; add `&play` to run it live instead of frozen. The bot
// selects the same entries by name, so there is no separate test harness.
// Adding one is a line.
const SCENARIOS = {
  // One enemy, nothing else arriving. For watching a single behaviour.
  'one-drifter': { spawn: false, enemies: [['drifter', 900, 400]] },
  // All three types at once, at known spots, for telling them apart at a glance.
  'three-types': { spawn: false, enemies: [['drifter', 300, 260],
                                          ['darter',  980, 260],
                                          ['bulwark', 640, 660]] },
  // The queue several batches in, for eyeballing density and pressure. It used
  // to mean "a minute into the dive", which stopped meaning anything when the
  // time-based spawn director was deleted (D48) -- density is authored per
  // batch now, so a later batch is the only way to be deeper in.
  'late-swarm':  { batch: 5 },
  // The last batch, then the bottom of the layer -- for seeing how a layer
  // ends without playing all of it. Derived, so it follows the dive's length.
  // Since S3 the last batch is the boss (D62); since S4 it is the last layer's,
  // so reaching the bottom is the win. `batch` may be a function of the dive's
  // drawn plan (D71), since where things sit is only known once it is drawn.
  'last-batch':  { batch: plan => plan.length - 1 },
  // The first mini-boss (D65), alone. Derived the same way.
  'mini-boss':   { batch: plan => plan.findIndex(e => e.batch === MINI_BOSS) },
  // The top of the second layer, with the kit a dive would carry there:
  // fourteen mods carried by the first layer's glowing fish -- every ordinary
  // mod three times but one, whose third the round had not reached (D84); here
  // Impact -- and the layer end's pick, Mend (D85). The picks are Claude's,
  // stated so the bot measures layer 2 against a known kit without fighting
  // down the first (friction point 4 of the layer-to-layer spec).
  'layer-2':     { batch: plan => plan.findIndex(e => e.layer === 1),
                   kit: ['Fins', 'Fins', 'Fins', 'Vitality', 'Vitality', 'Vitality',
                         'Reflex', 'Reflex', 'Reflex', 'Nerve', 'Nerve', 'Nerve',
                         'Impact', 'Impact', 'Mend'] },
};

// ---------- enemy types ----------
// Documented in docs/entities/enemies.md -- `npm test` holds it to this table.
// Also just data. Which types appear, and how many, is now named per batch
// (D48) -- the `weight` and `from` fields that let the deleted spawn director
// roll a type by unlock time went with it.
// `value` is how much currency it drops. It was `xp` until D34 deleted the XP
// curve -- the drop is money now, and money is spent at `home` (S4), not here.
// What the currency is *called* is still open (`ideas.md`), which is why nothing
// in the code names it.
const ENEMY_TYPES = [
  { name: 'drifter', r: 9,  hp: 1, speed: 85,  value: 1,
    color: '#e8446e', glow: '#ff1e5a' },
  { name: 'darter',  r: 6,  hp: 1, speed: 190, value: 1,
    color: '#ffb648', glow: '#ff8a00' },
  { name: 'bulwark', r: 17, hp: 6, speed: 52,  value: 3,
    color: '#a05cff', glow: '#7b2fff' },
  // The lungers (S3): the boss, and the mini-boss that rehearses it (D62, D64,
  // D65). They chase, then stop and wind up with their line showing, charge
  // along it and rest. `lunge` holds the timings -- `chase` seconds before a
  // wind-up may start, `windup` and `rest` in seconds, the charge's `speed`
  // in px/s and its `reach` in px -- and its presence is the behaviour. Every
  // number here is Claude's pick. The boss rises from below the view, centred:
  // Igor, "The boss swims in from the bottom".
  // Neither lunger ever glows (D88): `carries: false` keeps a batch's mod off
  // them. Igor, 2026-10-12: "remove glow from mini-bosses" -- and the boss's
  // batch is paid by the layer end's pick (D85).
  { name: 'mini-boss', r: 26, hp: 24, speed: 70, value: 5, carries: false,
    color: '#e2ff8a', glow: '#c6ff3c',
    lunge: { chase: 1, windup: 1.5, speed: 780, reach: 450, rest: 1.2 } },
  // The boss's `value` is the layer end's haul (D68): "a big haul of gems".
  // 30 is Claude's pick; S6 owns it.
  { name: 'boss',      r: 42, hp: 60, speed: 60, value: 30, carries: false,
    color: '#c8ff3c', glow: '#9dff00', enters: 'bottom',
    lunge: { chase: 1, windup: 1.0, speed: 780, reach: 450, rest: 1.2 } },
];

// `home` (D38): its layer list sits between the heading and the rows, one
// line per layer at most, so where the rows start is derived from how many
// layers there are -- a fixed top would let a fifth layer run into them.
const HOME_LAYERS_TOP = 326, HOME_LINE = 26;
const HOME_TOP = HOME_LAYERS_TOP + LAYERS.length * HOME_LINE + 40;

// ---------- menus ----------
// Same trick as mods and enemy types: a list of entries, so adding one
// is a line and nothing else changes. Anything that depends on state -- a
// label, a sub-line, `dim` (a row that cannot be taken right now), `home`'s
// `lines` -- is a getter, so the renderer reads every one the same way. `top`
// is where the rows start, which the renderer and the hit-test share; `back`
// is what Esc does, on a menu that has one. A screen is a menu exactly when it
// has an entry here -- `step()` asks `MENUS[screen]` -- and the water stops on
// every menu but one that `flows`.
// The end of a dive, either way it ends -- eaten, or the last layer won: Dive
// again or Go home (D90). Igor, 2026-10-12: "make it dive again + go home
// buttons choice". A menu like any other, except that the water keeps flowing
// under it (`flows`, D58). Go home opens marked (`endDive()`): a stray Enter
// or Space -- Space is the dash -- does what any key did before, and diving
// again is a choice.
const END_TOP = ARENA_H / 2 + 100;
const GO_HOME = { label: 'Go home', run: () => openMenu('home') };
const END_MENU = {
  top: END_TOP,
  flows: true,
  back: GO_HOME.run,
  items: [{ label: 'Dive again', run: () => reset() }, GO_HOME],
};

const MENUS = {
  title: {
    heading: 'ABYSS',
    sub: 'something small, in very deep water',
    top: MENU_TOP,
    items: [
      // `home` lives between dives only (D76): with a dive under way, Start is
      // Continue and goes straight back into it, where it was (D90).
      { get label() { return diveLive ? 'Continue' : 'Start'; },
        run: () => { if (diveLive) screen = resumeTo; else openMenu('home'); } },
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
    ],
  },
  dead: END_MENU,
  won: END_MENU,
  paused: {
    heading: 'PAUSED',
    sub: '',
    top: MENU_TOP,
    back: () => { screen = resumeTo; },
    items: [
      { label: 'Resume',        run: () => { screen = resumeTo; } },
      { label: 'Help',          run: () => openScreen('help') },
      { label: 'Options',       run: () => openScreen('options') },
      // The dive stays saved -- pausing wrote it -- and the title offers it back.
      { label: 'Quit to title', run: () => openMenu('title') },
    ],
  },
  home: {
    heading: 'HOME',
    // Depth in metres: 10 world px to the metre, so a gate is 40m down.
    // Flavour, and Claude's pick -- the world has no unit of its own.
    get sub() {
      const p = points();
      return meta.bank + ' gems      ' + p + (p === 1 ? ' point' : ' points') +
             '      deepest ' + Math.round(meta.deepest / 10) + 'm';
    },
    // The layers, one line each (D66): an unlocked one by name, with whether
    // it has been cleared and which micro-tasks it has paid; the next locked
    // one as ???; the rest hidden -- "levels are hidden until unlocked", the
    // source design. Unlocked means the one before it was cleared.
    get lines() {
      return LAYERS.slice(0, meta.cleared + 2).map((layer, l) => l > meta.cleared
        ? { text: '???', locked: true }
        : { text: layer.name + (l < meta.cleared ? '   cleared' : '') + '   ' +
                  TASKS.map(t => t.name + (meta.tasks[l]?.[t.name] ? ' \u2713' : ' \u2013'))
                       .join('   ') });
    },
    top: HOME_TOP,
    back: () => openMenu('title'),
    items: [
      { label: 'Dive', run: () => reset() },             // every dive from the top (D66)
      // Every weapon's tiers, then every piece of equipment's.
      // ponytail: every weapon listed and upgradable; owning one first, and
      // choosing which to carry, come with the second weapon (S5, D83).
      ...[...WEAPONS, ...EQUIPMENT].map(g => ({
        get label() {
          const t = meta.gear[g.name] || 0, cost = nextCost(g);
          return g.name + '   tier ' + t + (cost === undefined ? ', the top'
            : ' \u2192 ' + (t + 1) + '   ' + cost + ' gems');
        },
        get dim() { return !canBuy(g); },
        run: () => buy(g) })),
      ...ATTRIBUTES.map(a => ({
        get label() {
          const n = meta.spent[a.name] || 0;
          return a.name + '   ' + n + ' \u2192 ' + (n + 1) + '   1 point';
        },
        get dim() { return points() <= 0; },
        run: () => raise(a) })),
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
    ],
  },
};

const OPTIONS = [
  { label: 'Volume',
    show: () => Math.round(volume * 100) + '%',
    change: d => {
      volume = Math.max(0, Math.min(1, Math.round((volume + d * 0.1) * 10) / 10));
      if (master) master.gain.value = volume;
      sound('gem');                       // so you hear what you just set
    } },
  { label: 'Screen shake',
    show: () => SHAKE_LEVELS[shakeLevel].name,
    change: d => {
      shakeLevel = Math.max(0, Math.min(SHAKE_LEVELS.length - 1, shakeLevel + d));
    } },
  { label: 'Show FPS',
    show: () => (showFps ? 'on' : 'off'),
    change: () => { showFps = !showFps; } },
];

const HELP_KEYS = [
  ['Move',           'W A S D   or   arrow keys'],
  ['Aim',            'mouse'],
  ['Shoot',          'hold left mouse button'],
  ['Dash',           'Space'],
  ['Choose a mod',   'arrows, click or 1 2 3,  then Enter or Continue'],
  ['Mute sound',     'M'],
  ['Menu / back',    'Esc'],
  ['Menus',          'mouse, or arrows + Enter'],
];

const HELP_BLURB = [
  'Hold the left mouse button to shoot, along whatever you point at.',
  'Shots die at the edge of the ring, so range is a real range.',
  'Space dashes: you pass through the swarm unharmed, and shove it aside.',
  'One batch at a time; clear it and the current takes you down to the next.',
  'Things you kill drop gems. They come to you on their own, and are yours to keep.',
  'Kill the glowing fish for a mod. Grab boosts before they fade. A boss heals, then offers a pick.',
];
