// ===== content =====
// Every tuning number and content table, with the small helpers that read them.

// ---------- the view ----------
// The game sees a fixed 1280x800 view of the world whatever the window size, so
// difficulty does not depend on the monitor (D29). The world is a tall strip;
// the view is `cameraY` from its top.
const ARENA_W = 1280;
const ARENA_H = 800;

// ---------- balance ----------
// Every number that decides how the game plays, in one place: what transfers
// to a port as-is.
// Anything a mod, boost, tier or attribute raises is a field here, not a bare
// `const`: a line of data cannot edit a `const` (D34).
// The diver alone: the carried weapon's numbers join these when a dive starts
// (`WEAPONS`, D83).
const PLAYER_START = {
  r: 20,             // radius, in pixels
  speed: 260,        // pixels per second
  hp: 3,
  maxHp: 3,
  iframes: 1,        // seconds of invulnerability after a hit
  dashCooldown: 2.2, // seconds before you can dash again
  dashSpeed: 884,    // px/s while dashing -- its own number, not a multiple of
                     // `speed`, so swim speed never lengthens the dash (D56)
  mendOnClear: 0,    // hp healed per batch cleared -- a comfort mod grants it
  dashDamage: 0,     // the dash starts as pure movement (D51). It always shoves;
                     // hurting what it shoves is bought, never free
  guard: 0,          // hits a batch can take without a heart -- the suit's (D100)
};

// The dash: short, and on a long enough leash that spending it is a decision.
// You pass through the swarm unharmed and shove it aside, so diving into a
// crowd is a play rather than a mistake.
const DASH_TIME      = 0.16;  // seconds of dash
const DASH_GRACE     = 0.15;  // extra invulnerability after it, so you don't
                              // land inside the enemy you just flew through
// The dash pushes a wave ahead of it rather than only hitting what it bumps
// into: everything within reach AND in front of the direction of travel.
const DASH_REACH     = 40;    // px past an enemy's own radius
const DASH_ARC       = 0.2;   // cos of the half-angle: 0.2 is a 156-degree front
const DASH_END       = 0.18;  // seconds of the ring that closes the dash
const DASH_PUSH      = 320;   // px/s the wave shoves an enemy outward...
const PUSH_DRAG      = 0.02;  // ...with this fraction of it left after a second

// Gems fly to you from wherever they drop and never fade (D35, D78) -- fast
// enough to outrun a swimming player. Claude's pick.
const GEM_PULL       = 600;   // px/s a gem flies toward you
const ENEMY_JITTER   = 0.3;   // spread of speeds around a type's nominal speed
const GATE_PAUSE     = 1.2;   // seconds of quiet before a dive's FIRST batch, so
                              // a dive opens calm; every later batch waits on
                              // the descent instead, which is its own beat
// The descent (D58): each batch waits at its own depth and a current carries
// the view from one to the next. The current never stops -- it only slows
// while a batch is fought. Claude's picks.
const GATE_SPACING   = 400;   // world px between gate depths: about two seconds
                              // of travel at CURRENT_SPEED
const CURRENT_SPEED  = 200;   // px/s between batches
const CURRENT_CRAWL  = 30;    // px/s during a fight: the water still flows
const CURRENT_EASE   = 0.05;  // fraction of the speed change still left after
                              // one second -- eases up after a clear, down on
                              // an arrival, never a jolt
// The simulation's one and only step size (D53): the frame loop's accumulator,
// `advance()` and the bot all step by it. 1/120 rather than 1/60 because there
// is no render interpolation -- the picture is drawn wherever the last tick
// left things, so the step size *is* the smoothness.
const FIXED_DT       = 1 / 120;
// The longest real frame the simulation will believe in. Caps tab-switching
// (a minute away must not teleport everything) and doubles as the catch-up
// bound -- at most MAX_FRAME_DT / FIXED_DT ticks a frame -- so a slow frame
// cannot spiral into simulating forever.
const MAX_FRAME_DT   = 0.05;
const NOTICE_TIME    = 2.5;   // seconds a micro-task's or a pickup's line stays
                              // up. Claude's pick
const MOD_OFFER_DELAY = 0.6;  // seconds between the boss dying and the layer
                              // end's cards appearing: the kill burst lives
                              // 0.5s, and cards on top of it read as a jump cut
// What a dive picks up (D84, D85, D86). Claude's picks, S6's to tune.
const END_STEP       = 2;     // picks at once: an ordinary mod on a layer end's card
// A boost's chance on the Nth kill since the last one is BOOST_C x N -- the
// pseudo-random distribution Dota uses: never more than 1 / BOOST_C kills
// apart, and seldom two in a row.
const BOOST_C        = 0.02;
const BOOST_LIFE     = 6;     // seconds a boost lies where it fell, then it is gone
const SWIFT_TIME     = 10;    // seconds within which a cleared batch pays `swift`
                              // (D98). Claude's pick

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
  spit:   { freq: 330,  dur: 0.08, type: 'triangle', vol: 0.30, slide: 1.5  },
  pop:    { freq: 150,  dur: 0.22, type: 'square',   vol: 0.40, slide: 0.5  },
  guard:  { freq: 880,  dur: 0.12, type: 'square',   vol: 0.30, slide: 0.6  },
};

// ---------- mods ----------
// A dive-scoped power: carried by a glowing fish (D84, D88), or picked at a
// layer end (D85). Every field is documented in docs/entities/mods.md, and
// `npm test` holds the two together.
//
// `scope` is body, comfort or weapon. A weapon mod names the weapons it fits,
// `weapons`, and is dealt only while one of them is carried (D99): "+1
// damage" is huge on a railgun and nothing on a spray gun.
//
// Mods differ in **kind, not degree**: a pickup has to be felt and recognised
// in the middle of a fight, and the layer end's pick stays a gut read -- so the
// descriptions read as sentences, not stat lines.
//
// `max` lets the draws refuse a mod already maxed: it keeps a bounded stat
// honest (a cooldown has a floor of zero) and gives a dive's power a ceiling
// (D69). `end` marks one of the layer end's own: offered only on its cards,
// never carried by a fish.
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
  { name: 'Barbs',    scope: 'weapon',  desc: 'harpoons go through one more', max: 3,
    weapons: ['Harpoon'], apply: p => p.pierce += 1 },
];

// ---------- boosts ----------
// A short power a kill drops (D86); documented in docs/entities/boosts.md, held
// to this table by `npm test`. `add` is numbers rather than a function so it
// can be taken back when the time runs out -- and for the same reason a boost
// never moves `hp`.
const BOOSTS = [
  { name: 'Rush',   desc: 'you swim much faster',  time: 5, add: { speed: 200 } },
  { name: 'Frenzy', desc: 'you fire much faster',  time: 5, add: { fireRate: 3 } },
  { name: 'Lance',  desc: 'your shots go through', time: 5, add: { pierce: 4 } },
  { name: 'Bloom',  desc: 'your shots swell',      time: 6, add: { shotRadius: 6 } },
];

// ---------- gear, attributes, micro-tasks ----------
// What persists between dives, spent at `home` (D31, D36). Each is a line of
// data whose `apply` raises the player -- once per point held, or once per
// tier, each tier its own (D83). Everything sums, with mods on top; nothing
// multiplies (D36, D74).
//
// The save keys them by `name`, so renaming one orphans what players own.
// Every number here is Claude's pick, S6's to tune.

// `gear` -- bought with gems, combat stats: the weapons, then the equipment.
// Each tier is `{ cost, apply }`, in the order they are bought.
//
// A weapon is the shot a dive fires (D83). A dive copies the carried weapon's
// numbers onto the player, where mods, attributes and the readout find them.
// Documented in docs/entities/weapons.md -- `npm test` holds it here.
const WEAPONS = [
  { name: 'Gun', fireRate: 2.5, damage: 1, range: 250, shotSpeed: 430, shotRadius: 4, pierce: 0, cost: 0,
    tiers: [{ cost: 40,  apply: p => p.fireRate += 0.5 },
            { cost: 100, apply: p => p.fireRate += 0.5 },
            { cost: 200, apply: p => p.fireRate += 0.5 }] },
  // Slow, long and heavy, through what it hits: the draft's railgun (D97). Heavy
  // gear waits for a strong diver, so it needs a point of Strength (D98).
  { name: 'Harpoon', fireRate: 0.8, damage: 3, range: 420, shotSpeed: 950, shotRadius: 3, pierce: 2,
    cost: 150, requires: { Strength: 1 },
    tiers: [{ cost: 80,  apply: p => p.damage += 1 },
            { cost: 160, apply: p => p.fireRate += 0.2 },
            { cost: 300, apply: p => p.pierce += 1 }] },
  // Melee (D105): `swing` makes it a blade, not a shot. Each pull cuts at once
  // through the arc toward the cursor -- `arc` degrees wide, drawn for `time`
  // seconds -- out to `range` plus the blade's `shotRadius`, as far as a shot
  // that size would touch; `pierce` caps it at pierce + 1 fish, nearest first.
  { name: 'Knife', fireRate: 3, damage: 2, range: 56, shotRadius: 18, pierce: 6,
    swing: { arc: 120, time: 0.15 }, cost: 100,
    tiers: [{ cost: 60,  apply: p => p.range += 12 },
            { cost: 140, apply: p => p.damage += 1 },
            { cost: 260, apply: p => p.fireRate += 0.75 }] },
];

// Equipment: gear that is not a weapon (D81), raising combat numbers only --
// body stats are attributes' (D36). Documented in docs/entities/equipment.md
// -- `npm test` holds it here.
const EQUIPMENT = [
  // You see further, so you shoot further.
  { name: 'Mask',    tiers: [{ cost: 50,  apply: p => p.range += 30 },
                             { cost: 120, apply: p => p.range += 30 },
                             { cost: 240, apply: p => p.range += 30 }] },
  // Takes the first hit of every batch, one more a tier: the defence D36
  // gives gear.
  { name: 'Suit',    tiers: [{ cost: 90,  apply: p => p.guard += 1 },
                             { cost: 200, apply: p => p.guard += 1 },
                             { cost: 380, apply: p => p.guard += 1 }] },
  // Heavier shots hit harder.
  { name: 'Weights', tiers: [{ cost: 70,  apply: p => p.damage += 0.5 },
                             { cost: 150, apply: p => p.damage += 0.5 },
                             { cost: 280, apply: p => p.damage += 0.5 }] },
];

// `attribute` -- body stats, raised by points that only micro-tasks pay.
// Uncapped at the spending end: a layer holds a finite set of tasks, so the
// cap is at the source (D36). Dash improvements live here, not in gear (D74).
// Gear may require points spent on one (`requires`, D98).
const ATTRIBUTES = [
  { name: 'Dash reach', apply: p => p.dashSpeed += 150 },
  { name: 'Heart',      apply: p => { p.maxHp += 1; p.hp += 1; } },
  { name: 'Strength',   apply: p => p.dashDamage += 1 },
];

// `micro-task` -- mastery, never a quota (D36). Judged when a batch clears;
// each pays its `points` once per layer, ever. `met(entry)` reads the dive's
// state at that moment, and the plan entry just cleared.
const TASKS = [
  { name: 'untouched', desc: 'clear a batch without taking a hit', points: 1,
    met: () => !batchHit },
  { name: 'swift',     desc: 'clear a batch within ' + SWIFT_TIME + ' seconds', points: 1,
    met: () => batchTime <= SWIFT_TIME },
  // A mini-boss's batch is known by its fish, not by identity, so a restored
  // dive's copy of the plan still answers (D98).
  { name: 'footwork',  desc: 'beat a mini-boss without dashing', points: 1,
    met: entry => !batchDashed && entry.batch.enemies.some(([name]) => name === 'mini-boss') },
];

// ---------- the development readout ----------
// The player numbers worth watching while the game is being built (D52); to be
// trimmed or dropped before alpha. `stat` names the player field, which is what
// lets a check prove the readout complete: anything a mod or boost can change
// must be shown. `hp` and `maxHp` are drawn as `HP 3/4` on the line above, and
// the check names them.
const PLAYER_STATS = [
  { stat: 'speed',        label: 'spd',     read: p => Math.round(p.speed) },
  { stat: 'range',        label: 'rng',     read: p => Math.round(p.range) },
  { stat: 'fireRate',     label: 'rate',    read: p => p.fireRate.toFixed(2) + '/s' },
  { stat: 'damage',       label: 'dmg',     read: p => p.damage },
  { stat: 'pierce',       label: 'pierce',  read: p => p.pierce },
  { stat: 'shotRadius',   label: 'size',    read: p => p.shotRadius },
  { stat: 'dashDamage',   label: 'dashdmg', read: p => p.dashDamage },
  { stat: 'dashCooldown', label: 'dashcd',  read: p => p.dashCooldown.toFixed(1) + 's' },
  { stat: 'iframes',      label: 'ifr',     read: p => p.iframes.toFixed(2) + 's' },
  { stat: 'mendOnClear',  label: 'mend',    read: p => p.mendOnClear },
];

// ---------- the status bar ----------
// Everything a diver needs to read mid-fight, one line per kind, top-down: the
// body and the kit, where in the abyss, the mods and boosts, the layer's
// micro-tasks -- then the development readout, dimmed. The renderer draws
// each line at its own colour and weight, one row per entry, so a line added
// here moves the rest down on its own.
// The batch shown is the one being fought, or between gates the one ahead.
const statusEntry = () => plan[Math.max(0, enemies.length ? batchIndex - 1 : batchIndex)] || plan.at(-1);
function statusLines() {
  const entry = statusEntry(), layer = plan.filter(e => e.layer === entry.layer);
  const mods = Object.entries(modCounts).map(([name, n]) => name + ' ×' + n);
  return [
    { bold: true, color: '#d8f6ff',
      text: 'HP ' + player.hp + '/' + player.maxHp +
            (player.guard ? '   GUARD ' + guardLeft + '/' + player.guard : '') +
            '   GEMS ' + currency + '   ' + weaponName + ' tier ' + (meta.gear[weaponName] || 0) },
    { color: '#9ef7ff',
      text: LAYERS[entry.layer].name + '   batch ' + (layer.indexOf(entry) + 1) + '/' + layer.length +
            (enemies.length ? '   ' + enemies.length + ' fish left' : '') +
            '   ' + elapsed.toFixed(1) + 's   ' + kills + ' killed' },
    { color: '#ffe9a8',
      text: 'mods ' + (mods.join('  ') || 'none') +
            boosts.map(b => '   ' + b.name + ' ' + b.left.toFixed(1) + 's').join('') },
    { color: '#a8ffd8',
      text: 'tasks ' + TASKS.map(t => t.name + (meta.tasks[entry.layer]?.[t.name] ? ' ✓' : ' –')).join('   ') },
    // The development readout (D52): what the character actually is, right now.
    { color: '#4d7a8a', small: true,
      text: PLAYER_STATS.map(s => s.label + ' ' + s.read(player)).join('   ') },
  ];
}

// Menu and options rows: one full-width band per entry, anchored on the text
// baseline the renderer draws at, so the mouse can hit a row anywhere along it
// rather than only on the glyphs.
const ROW_W = 420, ROW_H = 38, ROW_STEP = 46;
const MENU_TOP = 380, OPTION_TOP = 300;
function rowRect(i, top) {
  return { x: ARENA_W / 2 - ROW_W / 2, y: top + i * ROW_STEP - 26, w: ROW_W, h: ROW_H };
}
// Where a menu's row `i` sits: in the menu's own grid if it has one, `rect` --
// the debug setup's -- else in the band from its `top`.
function rectOf(menu, i) {
  return menu.rect ? menu.rect(i) : rowRect(i, menu.top);
}

// Where the layer end's cards sit, in arena coordinates. The renderer draws
// them and the logic hit-tests the mouse against them, so the numbers belong
// to neither. `CARD_PAD` is the margin a description must leave on each side:
// the renderer centres the text and cannot notice it overflowing, so a check
// measures against this.
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

// How many of a mod are yours: taken, or dropped and still flying to you.
// Nothing stops a mod in flight reaching you, so every draw counts it, or the
// last slot under a cap is dealt again before it lands.
function held(m) {
  return (modCounts[m.name] || 0) + drops.filter(d => d.mod === m.name).length;
}

// Whether a mod fits the weapon this dive carries (D99): a weapon mod only the
// weapons it names, every other mod any.
function fits(m) { return !m.weapons || m.weapons.includes(weaponName); }

// The ordinary mods still under their caps: what a fish can carry (D84).
function carriable() {
  return MODS.filter(m => !m.end && fits(m) && held(m) < m.max);
}

// The mod a glowing fish carries: every ordinary mod once before any comes
// again -- a round, dealt from the seed and refilled when spent -- and none
// past its cap. `null` once every one is capped, and then no fish glows: the
// easiest answer while caps are balance's question (D84).
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
  return drawDistinct(MODS.filter(m => fits(m) && held(m) + cardStep(m) <= m.max), 3);
}

// ---------- key bindings ----------
// Which physical key means which action. Content, not platform: the game decides
// that dashing is Space, while reading the keyboard is platform's job (D44).
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
const FAST  = ['ShiftLeft', 'ShiftRight'];   // held: a value row moves five at a time
// The debug mode's own (D102), live only in it: the same setup again, from any
// screen, and back to its setup screen.
const DEBUG_AGAIN = ['KeyR'];
const DEBUG_SETUP = ['Backspace'];

// ---------- batches ----------
// A batch is the gated unit (D27): counts per enemy type, arriving at the edges
// of the view, and nothing else arrives until it is dead. Each stretch between
// the mini-bosses is a pool a dive draws from (D71), and each layer has pools
// of its own (D101), meeting the fish in turn: the archer at the end of the
// first, the puffer in the second, the eel in the third. They are sized on
// total hp (D54) until S6's threat number replaces it (D79) -- untuned
// placeholders, Claude's picks.
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
// name are the cheapest way to say "a new layer" until art exists. The
// colours are Claude's picks; the layers are numbered until they are named
// (D89).
//
// Every layer today has the same shape -- four from a pool, a mini-boss, four,
// a mini-boss, four, the boss -- around its own three pools.
const layer = (name, color, [a, b, c]) => ({ name, color, stretches: [
  { draw: 4, pool: a }, { draw: 1, pool: [MINI_BOSS] },
  { draw: 4, pool: b }, { draw: 1, pool: [MINI_BOSS] },
  { draw: 4, pool: c }, { draw: 1, pool: [BOSS] },
] });
const LAYERS = [
  layer('Layer 1', [12, 23, 39], [
    [{ enemies: [['drifter', 10]] },
     { enemies: [['drifter', 16]] },
     { enemies: [['drifter', 12], ['darter', 6]] },
     { enemies: [['darter', 14]] },
     { enemies: [['drifter', 8], ['darter', 6]] }],
    [{ enemies: [['bulwark', 2], ['drifter', 12]] },
     { enemies: [['drifter', 18], ['darter', 8]] },
     { enemies: [['bulwark', 3], ['darter', 10]] },
     { enemies: [['drifter', 20], ['darter', 12]] },
     { enemies: [['bulwark', 1], ['drifter', 14], ['darter', 6]] }],
    [{ enemies: [['bulwark', 4], ['drifter', 16]] },
     { enemies: [['archer', 4], ['drifter', 16], ['darter', 6]] },
     { enemies: [['bulwark', 5], ['drifter', 18], ['darter', 8]] },
     { enemies: [['archer', 5], ['bulwark', 3], ['drifter', 14]] },
     { enemies: [['bulwark', 3], ['darter', 14], ['drifter', 10]] }],
  ]),
  layer('Layer 2', [24, 12, 40], [
    [{ enemies: [['drifter', 14], ['archer', 3]] },
     { enemies: [['darter', 12], ['archer', 4]] },
     { enemies: [['puffer', 4], ['drifter', 12]] },
     { enemies: [['drifter', 18], ['darter', 6]] },
     { enemies: [['puffer', 3], ['darter', 10]] }],
    [{ enemies: [['bulwark', 3], ['archer', 4], ['drifter', 10]] },
     { enemies: [['puffer', 6], ['darter', 12]] },
     { enemies: [['archer', 6], ['puffer', 4]] },
     { enemies: [['bulwark', 2], ['puffer', 5], ['drifter', 14]] },
     { enemies: [['drifter', 20], ['archer', 5]] }],
    [{ enemies: [['bulwark', 5], ['puffer', 6], ['drifter', 12]] },
     { enemies: [['archer', 8], ['darter', 16]] },
     { enemies: [['puffer', 10], ['archer', 4]] },
     { enemies: [['bulwark', 4], ['archer', 6], ['darter', 10]] },
     { enemies: [['drifter', 24], ['puffer', 6], ['archer', 4]] }],
  ]),
  layer('Layer 3', [8, 32, 28], [
    [{ enemies: [['eel', 8], ['drifter', 14]] },
     { enemies: [['eel', 6], ['archer', 4], ['darter', 8]] },
     { enemies: [['eel', 10], ['puffer', 3]] },
     { enemies: [['puffer', 6], ['drifter', 16], ['eel', 4]] },
     { enemies: [['eel', 12]] }],
    [{ enemies: [['bulwark', 4], ['eel', 10], ['archer', 4]] },
     { enemies: [['eel', 8], ['puffer', 6], ['darter', 10]] },
     { enemies: [['archer', 8], ['eel', 8]] },
     { enemies: [['bulwark', 3], ['puffer', 8], ['eel', 6]] },
     { enemies: [['drifter', 20], ['eel', 10], ['archer', 4]] }],
    [{ enemies: [['bulwark', 6], ['eel', 12], ['puffer', 6]] },
     { enemies: [['archer', 10], ['eel', 10], ['darter', 10]] },
     { enemies: [['puffer', 10], ['eel', 10], ['archer', 4]] },
     { enemies: [['bulwark', 5], ['archer', 6], ['eel', 8], ['drifter', 12]] },
     { enemies: [['drifter', 24], ['darter', 12], ['eel', 8], ['puffer', 4]] }],
  ]),
];

// ---------- scenarios ----------
// Named dev setups (D37). `?dev=<name>` loads one in isolation so a single
// thing can be watched; add `&play` to run it live instead of frozen. The bot
// selects the same entries by name, so there is no separate test harness.
// Adding one is a line.
const SCENARIOS = {
  // One enemy, nothing else arriving. For watching a single behaviour.
  'one-drifter': { spawn: false, enemies: [['drifter', 900, 400]] },
  'one-archer':  { spawn: false, enemies: [['archer', 1100, 400]] },
  'one-puffer':  { spawn: false, enemies: [['puffer', 1000, 400]] },
  'one-eel':     { spawn: false, enemies: [['eel', 1150, 400]] },
  // A dive from the top carrying a weapon `home` did not choose (D97): how S6
  // measures each weapon alone.
  'harpoon':     { weapon: 'Harpoon' },
  'knife':       { weapon: 'Knife' },
  // Every ordinary type -- all but the boss and the mini-boss -- in a row,
  // for telling them apart at a glance. Read from the table, so a new type
  // joins it.
  'all-types':   { spawn: false,
                   get enemies() {
                     const t = ENEMY_TYPES.filter(e => e.carries !== false);
                     return t.map((e, i) => [e.name, ARENA_W * (i + 1) / (t.length + 1), 220]);
                   } },
  // The queue several batches in, for eyeballing density and pressure.
  'late-swarm':  { batch: 5 },
  // The last batch -- the last layer's boss -- then the bottom, the win: how a
  // dive ends, without playing all of it. `batch` may be a function of the
  // drawn plan (D71), where a place is only known once it is drawn.
  'last-batch':  { batch: plan => plan.length - 1 },
  // The first mini-boss (D65), alone. Derived the same way.
  'mini-boss':   { batch: plan => plan.findIndex(e => e.batch === MINI_BOSS) },
  // The top of the second layer, with the kit a dive would carry there: what
  // the first layer's glowing fish carried -- every ordinary mod three times
  // but one, here Impact (D84) -- and its layer end's pick, Mend (D85). Claude's
  // picks, so the bot measures layer 2 against a known kit without fighting
  // down the first.
  'layer-2':     { batch: plan => plan.findIndex(e => e.layer === 1),
                   kit: ['Fins', 'Fins', 'Fins', 'Vitality', 'Vitality', 'Vitality',
                         'Reflex', 'Reflex', 'Reflex', 'Nerve', 'Nerve', 'Nerve',
                         'Impact', 'Impact', 'Mend'] },
  // The top of the third, carrying the Gun: every ordinary mod at its cap by
  // then, and the first layer end's Mend; the second's had nothing left to
  // offer. Claude's pick, as above.
  'layer-3':     { batch: plan => plan.findIndex(e => e.layer === 2),
                   kit: ['Fins', 'Fins', 'Fins', 'Vitality', 'Vitality', 'Vitality',
                         'Reflex', 'Reflex', 'Reflex', 'Nerve', 'Nerve', 'Nerve',
                         'Impact', 'Impact', 'Impact', 'Mend'] },
};

// ---------- enemy types ----------
// Documented in docs/entities/enemies.md -- `npm test` holds it to this table.
// What the currency `value` pays in is still unnamed (`ideas.md`), which is
// why nothing in the code names it.
const ENEMY_TYPES = [
  { name: 'drifter', r: 18, hp: 1, speed: 85,  value: 1,
    color: '#e8446e', glow: '#ff1e5a' },
  { name: 'darter',  r: 12, hp: 1, speed: 190, value: 1,
    color: '#ffb648', glow: '#ff8a00' },
  { name: 'bulwark', r: 34, hp: 6, speed: 52,  value: 3,
    color: '#a05cff', glow: '#7b2fff' },
  // The archer keeps its distance and spits (D95). `spit` holds its band --
  // closer than `range`, no closer than `near` -- the seconds between spits,
  // and its shot's speed, radius and `travel`. `range` sits under the Gun's,
  // so the starting weapon can always answer it. Claude's picks.
  { name: 'archer',  r: 16, hp: 2, speed: 75,  value: 2,
    color: '#5aa9ff', glow: '#1f6fff',
    spit: { range: 240, near: 170, every: 2, speed: 210, r: 6, travel: 420 } },
  // The puffer swells, then bursts (D95). `fuse` holds how near it must get to
  // light it, the seconds it swells -- the tell -- and its blast's radius.
  // Claude's picks.
  { name: 'puffer',  r: 22, hp: 3, speed: 95,  value: 2,
    color: '#ffee58', glow: '#ffc800',
    fuse: { trigger: 90, time: 1.2, blast: 110 } },
  // The eel sways as it comes (D95): `weave` holds how far either side, in px,
  // and how many sways a second. Claude's picks.
  { name: 'eel',     r: 14, hp: 2, speed: 130, value: 2,
    color: '#38f2c0', glow: '#00c896',
    weave: { width: 50, rate: 0.9 } },
  // The lungers: the boss, and the mini-boss that rehearses it (D62, D64, D65).
  // `lunge` holds the timings, and its presence is the behaviour. Neither ever
  // glows (D88): `carries: false` keeps a batch's mod off them. Claude's picks.
  { name: 'mini-boss', r: 52, hp: 24, speed: 70, value: 5, carries: false,
    color: '#e2ff8a', glow: '#c6ff3c',
    lunge: { chase: 1, windup: 1.5, speed: 780, reach: 450, rest: 1.2 } },
  // The boss's `value` is the layer end's big haul of gems (D68).
  { name: 'boss',      r: 84, hp: 60, speed: 60, value: 30, carries: false,
    color: '#c8ff3c', glow: '#9dff00', enters: 'bottom',
    lunge: { chase: 1, windup: 1.0, speed: 780, reach: 450, rest: 1.2 } },
];

// `home` (D38): its layer list sits between the heading and the rows, one
// line per layer at most, so where the rows start is derived from how many
// layers there are -- a fixed top would let a fifth layer run into them.
const HOME_LAYERS_TOP = 326, HOME_LINE = 26;
const HOME_TOP = HOME_LAYERS_TOP + LAYERS.length * HOME_LINE + 40;

// ---------- the debug mode ----------
// `?debug` (D102): a setup screen in place of the title, for playtesting a
// piece alone or several together by hand -- where, which fish and how many,
// and the diver's kit. Its rows are built from the tables, so a new fish, mod
// or piece of gear joins it with nothing to write.
const ONE_SHOT         = 100;   // damage that kills anything here in one shot
const DEBUG_FISH_MAX   = 50;    // of one type in the setup's batch: Claude's pick
const DEBUG_POINTS_MAX = 9;     // on one attribute: Claude's pick
// What a fish does, in words, for its tip: one line per behaviour field --
// a new behaviour needs its line, and `npm test` says so -- and `chase` for a
// fish with none. Its numbers come from its record.
const DEBUG_BEHAVIOURS = {
  chase: 'swims straight at you',
  spit:  'keeps its distance and spits shots at you',
  fuse:  'swells when you come close, then bursts \u2014 step out of its ring',
  weave: 'sways side to side as it comes \u2014 aim where it will be',
  lunge: 'winds up, then lunges along its line \u2014 step aside',
};
// Every name a setup counts, with its cap, its column and its tip: the fish in
// its batch, a piece of equipment's tier, an attribute's points, a mod's picks
// -- and every weapon's tier, shown for the one carried. `of` marks a cap that
// is the game's own, worth showing beside the count.
const DEBUG_COUNTS = [
  ...ENEMY_TYPES.map(e => ({ name: e.name, col: 1, max: DEBUG_FISH_MAX, tip: () => fishTip(e) })),
  ...EQUIPMENT.map(g => ({ name: g.name, col: 2, max: g.tiers.length, of: true, tip: () => gearTip(g) })),
  ...ATTRIBUTES.map(a => ({ name: a.name, col: 2, max: DEBUG_POINTS_MAX, tip: () => pointTip(a) })),
  ...MODS.map(m => ({ name: m.name, col: 3, max: m.max, of: true, tip: () => modTip(m) })),
  ...WEAPONS.map(w => ({ name: w.name, max: w.tiers.length, of: true })),
];
// A counted row of the setup. A weapon mod goes into the dive only with a
// weapon it fits (D99), so with another carried its row is dim.
const countRow = c => ({
  label: c.name,
  col: c.col,
  get value() { const n = debugSetup.counts[c.name] || 0; return c.of ? n + ' / ' + c.max : n; },
  get dim() { const m = MODS.find(x => x.name === c.name); return !!m?.weapons && !m.weapons.includes(debugSetup.weapon); },
  get tip() { return c.tip(); },
  change: d => { debugSetup.counts[c.name] = wrapStep(debugSetup.counts[c.name] || 0, d, c.max); },
});

// The setup screen's grid: a column per heading, rows `DEBUG_STEP` apart, and
// the Dive row under the tallest column with the gate's line and the marked
// row's tip between -- so a new fish or mod pushes them down, and the browser
// suite holds them above the hint.
const DEBUG_COLS = ['WHERE', 'FISH', 'DIVER', 'MODS'];
const DEBUG_TOP = 236, DEBUG_STEP = 32, DEBUG_COL_W = 280;
const debugColX = c => ARENA_W * (2 * c + 1) / (2 * DEBUG_COLS.length);
function debugBottom() {
  const items = MENUS.debug.items;
  return DEBUG_TOP + DEBUG_STEP * Math.max(...DEBUG_COLS.map((_, c) => items.filter(r => r.col === c).length));
}
function debugRect(i) {
  const items = MENUS.debug.items, r = items[i];
  if (r.col === undefined) return { x: ARENA_W / 2 - ROW_W / 2, y: debugBottom() + 70, w: ROW_W, h: 30 };
  const k = items.slice(0, i).filter(x => x.col === r.col).length;
  return { x: debugColX(r.col) - DEBUG_COL_W / 2, y: DEBUG_TOP + k * DEBUG_STEP - 22, w: DEBUG_COL_W, h: 30 };
}
// A click on a value row: its left half is the label and moves nothing, then
// ‹ lowers and › raises, either side of the value at three quarters across.
function clickStep(r, x) {
  return x < r.x + r.w / 2 ? 0 : x < r.x + r.w * 3 / 4 ? -1 : 1;
}

// ---------- menus ----------
// A list of entries, so adding one is a line. Anything that depends on state --
// a label, a sub-line, `dim` (a row that cannot be taken right now), `home`'s
// `lines` -- is a getter, so the renderer reads every one the same way. `top`
// is where the rows start, which the renderer and the hit-test share; `back`
// is what Esc does, on a menu that has one. A screen is a menu exactly when it
// has an entry here -- `step()` asks `MENUS[screen]` -- and the water stops on
// every menu but one that `flows`. A row with `change(d)` holds a value that
// the arrows and a click move -- the debug setup's -- and `rect` lays a menu's
// rows out in a grid of its own.
//
// The end of a dive, either way it ends: Dive again or Go home (D90). The water
// keeps flowing under it (D58). Go home opens marked (`endDive()`), so a stray
// Enter or Space -- Space is the dash -- never starts a dive by accident. In
// the debug mode they read Again and Setup, and go there (D102).
const END_TOP = ARENA_H / 2 + 100;
const GO_HOME = { get label() { return debugSetup ? 'Setup' : 'Go home'; },
                  run: () => openMenu(debugSetup ? 'debug' : 'home') };
// The gear and attribute screens' last row, and their Esc (D96).
const BACK_HOME = { label: 'Back', run: () => openMenu('home') };
// What a piece of gear requires and is not yet met (D98), on its row.
const needs = g => (meets(g) ? '' : '   needs ' +
  Object.entries(g.requires).map(([a, n]) => a + ' ' + n).join(', '));
// A piece of gear's tier, and what the next costs.
const tierLabel = g => {
  const t = meta.gear[g.name] || 0, cost = nextCost(g);
  return 'tier ' + t + (cost === undefined ? ', the top' : ' → ' + (t + 1) + '   ' + cost + ' gems');
};
const END_MENU = {
  top: END_TOP,
  flows: true,
  back: GO_HOME.run,
  items: [{ get label() { return debugSetup ? 'Again' : 'Dive again'; },
            run: () => (debugSetup ? debugDive() : reset()) }, GO_HOME],
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
      // Last, away from the cursor, and behind a warning (D103).
      { label: 'New game', run: () => openMenu('newGame') },
    ],
  },
  // A new game erases the save for good, so it says so first, in red, and
  // Cancel is the row a stray Enter takes (D103).
  newGame: {
    heading: 'NEW GAME',
    get sub() {
      return 'This erases your save for good: gems, gear, attributes, micro-tasks and depth' +
             (diveLive ? ', and the dive in progress.' : '.');
    },
    warn: true,
    top: MENU_TOP,
    back: () => openMenu('title'),
    items: [
      { label: 'Cancel', run: () => openMenu('title') },
      { label: 'Erase everything and start', run: () => newGame() },
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
      // The debug mode saved nothing, and goes back to its setup (D102).
      { get label() { return debugSetup ? 'Quit to setup' : 'Quit to title'; },
        run: () => openMenu(debugSetup ? 'debug' : 'title') },
    ],
  },
  home: {
    heading: 'HOME',
    // Depth in metres, at 10 world px to the metre: flavour, Claude's pick --
    // the world has no unit of its own.
    get sub() {
      const p = points();
      return meta.bank + ' gems      ' + p + (p === 1 ? ' point' : ' points') +
             '      deepest ' + Math.round(meta.deepest / 10) + 'm';
    },
    // The layers, one line each (D66): an unlocked one by name, with whether
    // it has been cleared and which micro-tasks it has paid; the next locked
    // one as ???; the rest hidden. Unlocked means the one before it was cleared.
    get lines() {
      return LAYERS.slice(0, meta.cleared + 2).map((layer, l) => l > meta.cleared
        ? { text: '???', locked: true }
        : { text: layer.name + (l < meta.cleared ? '   cleared' : '') + '   ' +
                  TASKS.map(t => t.name + (meta.tasks[l]?.[t.name] ? ' ✓' : ' –'))
                       .join('   ') });
    },
    top: HOME_TOP,
    back: () => openMenu('title'),
    // What it sells lives a screen deeper, gear and attributes each on its
    // own (D96): three weapons, three pieces and three attributes on one
    // screen would run through the hint.
    items: [
      { label: 'Dive', run: () => reset() },             // every dive from the top (D66)
      { label: 'Gear',       run: () => openMenu('gear') },
      { label: 'Attributes', run: () => openMenu('attributes') },
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
    ],
  },
  gear: {
    heading: 'GEAR',
    get sub() { return meta.bank + ' gems'; },
    top: MENU_TOP,
    back: BACK_HOME.run,
    items: [
      // Every weapon -- to own, to carry, or the carried one's tier (D97) --
      // then every piece of equipment's tier.
      ...WEAPONS.map(w => ({
        get label() {
          if (meta.carried === w.name) return w.name + '   equipped   ' + tierLabel(w);
          return w.name + (meta.owned.includes(w.name)
            ? '   tier ' + (meta.gear[w.name] || 0) + '   equip'
            : '   buy & equip   ' + w.cost + ' gems' + needs(w));
        },
        get dim() {
          return meta.carried === w.name ? !canBuy(w) : !meta.owned.includes(w.name) && !canOwn(w);
        },
        run: () => pickWeapon(w) })),
      ...EQUIPMENT.map(g => ({
        get label() { return g.name + '   ' + tierLabel(g) + needs(g); },
        get dim() { return !canBuy(g); },
        run: () => buy(g) })),
      BACK_HOME,
    ],
  },
  attributes: {
    heading: 'ATTRIBUTES',
    get sub() { const p = points(); return p + (p === 1 ? ' point' : ' points') + ' to spend'; },
    top: MENU_TOP,
    back: BACK_HOME.run,
    items: [
      ...ATTRIBUTES.map(a => ({
        get label() {
          const n = meta.spent[a.name] || 0;
          return a.name + '   ' + n + ' → ' + (n + 1) + '   1 point';
        },
        get dim() { return points() <= 0; },
        run: () => raise(a) })),
      BACK_HOME,
    ],
  },
  // The debug mode's setup (D102): its code is the sub-line, the gate's line
  // says what the chosen gate drew -- or the fish set in its place -- and Dive
  // sits under the four columns. Nothing to go back to: the title is not here.
  debug: {
    heading: 'DEBUG',
    get sub() {
      return setupCode() + (debugSetup.ignored.length ? '      ignored: ' + debugSetup.ignored.join(', ') : '');
    },
    get lines() { return [gateLine()]; },
    rect: debugRect,
    items: [
      { label: 'Layer', col: 0, tip: 'Layer: where the dive starts; every layer draws from pools of its own',
        get value() { return debugSetup.layer + 1 + ' / ' + LAYERS.length; },
        change: d => {
          debugSetup.layer = wrapStep(debugSetup.layer, d, LAYERS.length - 1);
          clampSetup(debugSetup);                // its gate, held inside the new layer
        } },
      { label: 'Gate', col: 0, tip: "Gate: which of the layer's gates it starts at; the line above says what that gate drew",
        get value() { return debugSetup.gate + 1 + ' / ' + gatesIn(debugSetup.layer); },
        change: d => { debugSetup.gate = wrapStep(debugSetup.gate, d, gatesIn(debugSetup.layer) - 1); } },
      { label: 'Seed', col: 0, tip: "Seed: the dive's dice; one seed draws the same dive every time, and a change draws a new one",
        get value() { return debugSetup.seed; },
        change: () => { debugSetup.seed = newSeed(); } },
      { label: 'Immortal', col: 0, tip: 'Immortal: nothing can hurt you',
        get value() { return debugSetup.immortal ? 'on' : 'off'; },
        change: () => { debugSetup.immortal = !debugSetup.immortal; } },
      { label: 'One-shot', col: 0, tip: 'One-shot: every shot does ' + ONE_SHOT + ' damage, enough for anything',
        get value() { return debugSetup.oneShot ? 'on' : 'off'; },
        change: () => { debugSetup.oneShot = !debugSetup.oneShot; } },
      ...DEBUG_COUNTS.filter(c => c.col === 1).map(countRow),
      { label: 'Weapon', col: 2, get value() { return debugSetup.weapon; },
        get tip() { return weaponTip(WEAPONS.find(w => w.name === debugSetup.weapon)); },
        change: d => {
          const i = WEAPONS.findIndex(w => w.name === debugSetup.weapon);
          debugSetup.weapon = WEAPONS[wrapStep(i, d, WEAPONS.length - 1)].name;
        } },
      { label: 'Tier', col: 2,
        get tip() { return weaponTiersTip(WEAPONS.find(w => w.name === debugSetup.weapon)); },
        get value() {
          const w = DEBUG_COUNTS.find(c => c.name === debugSetup.weapon);
          return (debugSetup.counts[w.name] || 0) + ' / ' + w.max;
        },
        change: d => {
          const w = DEBUG_COUNTS.find(c => c.name === debugSetup.weapon);
          debugSetup.counts[w.name] = wrapStep(debugSetup.counts[w.name] || 0, d, w.max);
        } },
      ...DEBUG_COUNTS.filter(c => c.col === 2).map(countRow),
      ...DEBUG_COUNTS.filter(c => c.col === 3).map(countRow),
      { label: 'Dive', tip: 'Dive: plays this setup; R plays it again from any screen', run: () => debugDive() },
    ],
  },
};

const OPTIONS = [
  { label: 'Volume',
    show: () => Math.round(volume * 100) + '%',
    change: d => {
      volume = Math.max(0, Math.min(1, Math.round((volume + d * 0.1) * 10) / 10));
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
  ['Shoot or swing', 'hold left mouse button'],
  ['Dash',           'Space'],
  ['Choose a mod',   'arrows, click or 1 2 3,  then Enter or Continue'],
  ['Mute sound',     'M'],
  ['Menu / back',    'Esc'],
  ['Menus',          'mouse, or arrows + Enter'],
];

const HELP_BLURB = [
  'Hold the left mouse button to shoot along whatever you point at; the Knife swings there.',
  'Shots die at the edge of the ring, so range is a real range.',
  'Space dashes: you pass through the swarm unharmed, and shove it aside.',
  'One batch at a time; clear it and the current takes you down to the next.',
  'Things you kill drop gems. They come to you on their own, and are yours to keep.',
  'Kill the glowing fish for a mod. Grab boosts before they fade. A boss heals, then offers a pick.',
  'Some fish spit from afar; a puffer that swells is about to burst.',
];
