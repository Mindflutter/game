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
const PLAYER_START = {
  r: 10,             // radius, in pixels
  speed: 260,        // pixels per second
  hp: 3,
  maxHp: 3,
  fireRate: 2.5,     // shots per second
  damage: 1,
  range: 250,        // how far a shot travels before it dies
  pierce: 0,         // extra enemies a shot passes through
  pickupRange: 75,
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

const BULLET_SPEED   = 430;   // pixels per second
const GEM_PULL       = 300;   // how fast gems fly to you once in range
const GEM_LIFE       = 8;     // seconds before an uncollected coin fades out
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
const MOD_OFFER_DELAY = 0.6;  // seconds between the last enemy dying and the
                              // cards appearing. The kill burst lives 0.5s, so
                              // anything shorter drops the offer on top of the
                              // death it is rewarding and reads as a jump cut.

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
  rankA:  { freq: 520,  dur: 0.09, type: 'triangle', vol: 0.40, slide: 1    },
  rankB:  { freq: 780,  dur: 0.16, type: 'triangle', vol: 0.35, slide: 1.25 },
};

// ---------- mods ----------
// A dive-scoped pick, offered as one of three at a gate and gone at the end of
// the dive (D34). Just data: adding one is a line here and nothing else.
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
// No number the player has to compare across categories: mods differ in **kind,
// not degree**, because arithmetic is the heavy thinking a dive must not
// contain. That is why the descriptions read as sentences and not as stat lines.
//
// `max` is how many times one mod can be taken; absent means no limit. It exists
// so the roll can refuse a mod that is already maxed, which is the only way a
// bounded stat (a cooldown has a floor of zero) stays honest.
//
// Two mods D34 named are deliberately absent: pickup radius and a currency
// magnet. D35 was recorded hours later and auto-collects currency, which leaves
// both of them with nothing to do — building either now would be building a
// husk. Two mods can max out, so a late dive may be offered fewer than three
// cards; more mods is S5 — Content, not a reason to pad the pool here.
const MODS = [
  { name: 'Fins',     scope: 'body',    desc: 'you swim faster',
    apply: p => p.speed += 45 },
  { name: 'Vitality', scope: 'body',    desc: 'one more heart, it comes full',
    apply: p => { p.maxHp += 1; p.hp += 1; } },
  { name: 'Reflex',   scope: 'body',    desc: 'the dash comes back sooner', max: 3,
    apply: p => p.dashCooldown -= 0.4 },
  { name: 'Nerve',    scope: 'body',    desc: 'hits leave you safe longer', max: 3,
    apply: p => p.iframes += 0.3 },
  { name: 'Impact',   scope: 'body',    desc: 'the dash wounds what it throws', max: 3,
    apply: p => p.dashDamage += 1 },
  { name: 'Mend',     scope: 'comfort', desc: 'a heart back each batch', max: 1,
    apply: p => p.mendOnClear = 1 },
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
  { stat: 'pickupRange',  label: 'pickup',  read: p => Math.round(p.pickupRange) },
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

// Three distinct mods, never one that is already maxed (D34). A copy, so the
// splicing doesn't wreck the table. Offers fewer than three rather than
// repeating itself if the pool has run short -- a duplicate card is not a choice.
function rollMods() {
  const pool = MODS.filter(m => (modCounts[m.name] || 0) < (m.max || Infinity));
  const out = [];
  while (out.length < 3 && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// ---------- key bindings ----------
// Which physical key means which action. Content, not platform: the game decides
// that dashing is Space, while reading the keyboard is platform's job. Keeping
// them here is what holds the port seam at exactly six names -- `game/` used to
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
//  5   2 bulwark + 12 drifter             24   9.6s
//  6   18 drifter + 8 darter              26  10.4s
//  7   3 bulwark + 10 darter              28  11.2s
//  8   20 drifter + 12 darter             32  12.8s
//  9   4 bulwark + 16 drifter             40  16.0s
// 10   18 darter + 16 drifter             34  13.6s
// 11   5 bulwark + 18 drifter + 8 darter  56  22.4s
// 12   6 bulwark + 20 drifter + 12 darter 68  27.2s
//
// Twelve, because D34 sizes a layer at about twelve gates and therefore twelve
// mods. The peak is 32 simultaneous enemies, against a design budget of 500.
const BATCHES = [
  { enemies: [['drifter', 10]] },
  { enemies: [['drifter', 16]] },
  { enemies: [['drifter', 12], ['darter', 6]] },
  { enemies: [['darter', 14]] },
  { enemies: [['bulwark', 2], ['drifter', 12]] },
  { enemies: [['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 3], ['darter', 10]] },
  { enemies: [['drifter', 20], ['darter', 12]] },
  { enemies: [['bulwark', 4], ['drifter', 16]] },
  { enemies: [['darter', 18], ['drifter', 16]] },
  { enemies: [['bulwark', 5], ['drifter', 18], ['darter', 8]] },
  { enemies: [['bulwark', 6], ['drifter', 20], ['darter', 12]] },
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
  // ends without playing all of it. Derived, so it follows BATCHES' length.
  'last-batch':  { batch: BATCHES.length - 1 },
};

// ---------- enemy types ----------
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
];

// ---------- menus ----------
// Same trick as mods and enemy types: a list of entries, so adding one
// is a line and nothing else changes.
const MENUS = {
  title: {
    heading: 'ABYSS',
    sub: 'something small, in very deep water',
    items: [
      { label: 'Start',   run: () => reset() },          // reset() starts the dive
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
    ],
  },
  paused: {
    heading: 'PAUSED',
    sub: '',
    items: [
      { label: 'Resume',        run: () => { screen = 'playing'; } },
      { label: 'Help',          run: () => openScreen('help') },
      { label: 'Options',       run: () => openScreen('options') },
      { label: 'Quit to title', run: () => { screen = 'title'; menuIndex = 0; } },
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
  ['Choose a mod',   'arrows + Enter,  click,  or 1 2 3'],
  ['Restart a dive', 'R'],
  ['Mute sound',     'M'],
  ['Menu / back',    'Esc'],
  ['Menus',          'mouse, or arrows + Enter'],
];

const HELP_BLURB = [
  'Hold the left mouse button to shoot, along whatever you point at.',
  'Shots die at the edge of the ring, so range is a real range.',
  'Space dashes: you pass through the swarm unharmed, and shove it aside.',
  'One batch at a time; clear it and the current takes you down to the next.',
  'Things you kill drop gems. They are money, and they fade in eight seconds.',
  'Every batch cleared is a rank and a pick of three mods, until the layer ends.',
];
