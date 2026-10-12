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
  r: 10,             // radius, in pixels
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
// A dive-scoped power: carried by a glowing fish (D84, D88), or picked at a
// layer end (D85). Every field is documented in docs/entities/mods.md, and
// `npm test` holds the two together.
//
// `scope` is body or comfort only until S5 (content): a weapon mod cannot be
// balanced before the weapons exist -- "+1 damage" is huge on a railgun and
// nothing on a spray gun.
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
];

// ---------- boosts ----------
// A short power a kill drops (D86); documented in docs/entities/boosts.md, held
// to this table by `npm test`. `add` is numbers rather than a function so it
// can be taken back when the time runs out -- and for the same reason a boost
// never moves `hp`.
const BOOSTS = [
  { name: 'Rush', desc: 'you swim much faster, for a moment', time: 5, add: { speed: 200 } },
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
// cap is at the source (D36). Dash improvements live here, not in gear (D74).
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

// The ordinary mods still under their caps: what a fish can carry (D84).
function carriable() {
  return MODS.filter(m => !m.end && (modCounts[m.name] || 0) < m.max);
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
  return drawDistinct(MODS.filter(m => (modCounts[m.name] || 0) + cardStep(m) <= m.max), 3);
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

// ---------- batches ----------
// A batch is the gated unit (D27): counts per enemy type, arriving at the edges
// of the view, and nothing else arrives until it is dead. Each stretch between
// the mini-bosses is a pool a dive draws from (D71). They are sized on total hp
// (D54) until S6's threat number replaces it (D79) -- untuned placeholders.
const STRETCH_1 = [
  { enemies: [['drifter', 10]] },
  { enemies: [['drifter', 16]] },
  { enemies: [['drifter', 12], ['darter', 6]] },
  { enemies: [['darter', 14]] },
  { enemies: [['drifter', 8], ['darter', 6]] },
];
const STRETCH_2 = [
  { enemies: [['bulwark', 2], ['drifter', 12]] },
  { enemies: [['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 3], ['darter', 10]] },
  { enemies: [['drifter', 20], ['darter', 12]] },
  { enemies: [['bulwark', 1], ['drifter', 14], ['darter', 6]] },
];
const STRETCH_3 = [
  { enemies: [['bulwark', 4], ['drifter', 16]] },
  { enemies: [['darter', 18], ['drifter', 16]] },
  { enemies: [['bulwark', 5], ['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 6], ['drifter', 20], ['darter', 12]] },
  { enemies: [['bulwark', 3], ['darter', 14], ['drifter', 10]] },
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
// The second layer is the first one's stretches under its own name and colour,
// a placeholder until S5 gives it content of its own. The colours are Claude's
// picks; the layers are numbered until they are named (D89).
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
};

// ---------- enemy types ----------
// Documented in docs/entities/enemies.md -- `npm test` holds it to this table.
// What the currency `value` pays in is still unnamed (`ideas.md`), which is
// why nothing in the code names it.
const ENEMY_TYPES = [
  { name: 'drifter', r: 9,  hp: 1, speed: 85,  value: 1,
    color: '#e8446e', glow: '#ff1e5a' },
  { name: 'darter',  r: 6,  hp: 1, speed: 190, value: 1,
    color: '#ffb648', glow: '#ff8a00' },
  { name: 'bulwark', r: 17, hp: 6, speed: 52,  value: 3,
    color: '#a05cff', glow: '#7b2fff' },
  // The lungers: the boss, and the mini-boss that rehearses it (D62, D64, D65).
  // `lunge` holds the timings, and its presence is the behaviour. Neither ever
  // glows (D88): `carries: false` keeps a batch's mod off them. Claude's picks.
  { name: 'mini-boss', r: 26, hp: 24, speed: 70, value: 5, carries: false,
    color: '#e2ff8a', glow: '#c6ff3c',
    lunge: { chase: 1, windup: 1.5, speed: 780, reach: 450, rest: 1.2 } },
  // The boss's `value` is the layer end's big haul of gems (D68).
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
// A list of entries, so adding one is a line. Anything that depends on state --
// a label, a sub-line, `dim` (a row that cannot be taken right now), `home`'s
// `lines` -- is a getter, so the renderer reads every one the same way. `top`
// is where the rows start, which the renderer and the hit-test share; `back`
// is what Esc does, on a menu that has one. A screen is a menu exactly when it
// has an entry here -- `step()` asks `MENUS[screen]` -- and the water stops on
// every menu but one that `flows`.
//
// The end of a dive, either way it ends: Dive again or Go home (D90). The water
// keeps flowing under it (D58). Go home opens marked (`endDive()`), so a stray
// Enter or Space -- Space is the dash -- never starts a dive by accident.
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
    items: [
      { label: 'Dive', run: () => reset() },             // every dive from the top (D66)
      // Every weapon's tiers, then every piece of equipment's.
      // ponytail: every weapon listed and upgradable; owning one first, and
      // choosing which to carry, come with the second weapon (S5, D83).
      ...[...WEAPONS, ...EQUIPMENT].map(g => ({
        get label() {
          const t = meta.gear[g.name] || 0, cost = nextCost(g);
          return g.name + '   tier ' + t + (cost === undefined ? ', the top'
            : ' → ' + (t + 1) + '   ' + cost + ' gems');
        },
        get dim() { return !canBuy(g); },
        run: () => buy(g) })),
      ...ATTRIBUTES.map(a => ({
        get label() {
          const n = meta.spent[a.name] || 0;
          return a.name + '   ' + n + ' → ' + (n + 1) + '   1 point';
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
