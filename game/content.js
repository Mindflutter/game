// ===== content =====
// Every tuning number and every content table. No behaviour, no browser.

// ---------- the arena ----------
// The game always plays out in a 1280x800 world, whatever the window size,
// so difficulty doesn't depend on your monitor. We scale that world up to
// fill the window. Any leftover margin is the same near-black as the
// background, so the letterboxing is invisible.
const ARENA_W = 1280;
const ARENA_H = 800;

// ---------- balance ----------
// Every number that decides how the game plays, in one place. These are the
// real product of this prototype: the rendering gets rewritten on any port,
// these transfer as-is.
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
};

// The dash. Short, offensive, and on a long enough leash that spending it is a
// decision: you pass through the swarm unharmed and hurt everything you touch,
// so diving into a crowd is a play rather than a mistake.
const DASH_SPEED_MUL = 3.4;   // times normal speed while dashing
const DASH_TIME      = 0.16;  // seconds of dash -- about 140px of travel
const DASH_COOLDOWN  = 2.2;   // seconds before you can dash again
const DASH_GRACE     = 0.15;  // extra invulnerability after it, so you don't
                              // land inside the enemy you just flew through
// The dash pushes a wave ahead of it rather than only hitting what it bumps
// into: everything within reach AND in front of the direction of travel.
const DASH_REACH     = 40;    // px past an enemy's own radius -- vs 10 for the body
const DASH_ARC       = 0.2;   // cos of the half-angle: 0.2 is a 156-degree front
const DASH_END       = 0.18;  // seconds of the ring that closes the dash
const DASH_PUSH      = 320;   // px/s the wave shoves an enemy outward...
const PUSH_DRAG      = 0.02;  // ...bleeding to 2% per second, so about 80px

const IFRAMES        = 1;     // seconds of invulnerability after a hit
const BULLET_SPEED   = 430;   // pixels per second
const GEM_PULL       = 300;   // how fast gems fly to you once in range
const GEM_LIFE       = 8;     // seconds before an uncollected gem fades out
const XP_BASE        = 5;     // motes needed for level 2
const XP_GROWTH      = 1.45;  // each level costs this much more than the last
const SPAWN_FIRST    = 1.2;   // seconds between spawns at the start of a run
const SPAWN_QUICKEN  = 0.02;  // ...shortening by this much per second survived
const SPAWN_FASTEST  = 0.15;  // ...but never below this
const ENEMY_RAMP     = 0.006; // enemies spawn this much faster-moving per second
const ENEMY_JITTER   = 0.3;   // spread of speeds around a type's nominal speed

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
  levelA: { freq: 520,  dur: 0.09, type: 'triangle', vol: 0.40, slide: 1    },
  levelB: { freq: 780,  dur: 0.16, type: 'triangle', vol: 0.35, slide: 1.25 },
};

// ---------- upgrades ----------
// Just data. Adding one is a new line here and nothing else.
const UPGRADES = [
  { name: 'Rapid Fire', desc: '+35% fire rate',        apply: p => p.fireRate *= 1.35 },
  { name: 'Power',      desc: '+1 damage',             apply: p => p.damage += 1 },
  { name: 'Reach',      desc: '+70 firing range',      apply: p => p.range += 70 },
  { name: 'Fins',       desc: '+45 move speed',        apply: p => p.speed += 45 },
  { name: 'Pierce',     desc: 'shots pass through +1', apply: p => p.pierce += 1 },
  { name: 'Lure',       desc: '+45 pickup range',      apply: p => p.pickupRange += 45 },
  { name: 'Vitality',   desc: '+1 max HP, heal 1',     apply: p => { p.maxHp += 1; p.hp += 1; } },
];

// Menu and options rows: one full-width band per entry, anchored on the text
// baseline the renderer draws at, so the mouse can hit a row anywhere along it
// rather than only on the glyphs.
const ROW_W = 420, ROW_H = 38, ROW_STEP = 46;
const MENU_TOP = 380, OPTION_TOP = 300;
function rowRect(i, top) {
  return { x: ARENA_W / 2 - ROW_W / 2, y: top + i * ROW_STEP - 26, w: ROW_W, h: ROW_H };
}

// Where the three upgrade cards sit, in arena coordinates. The renderer draws
// these and the logic hit-tests the mouse against them, so the numbers belong
// to neither of them.
const CARD_W = 220, CARD_H = 140, CARD_GAP = 24;
function cardRect(i, n) {
  const totalW = n * CARD_W + (n - 1) * CARD_GAP;
  return { x: ARENA_W / 2 - totalW / 2 + i * (CARD_W + CARD_GAP),
           y: ARENA_H / 2 - CARD_H / 2, w: CARD_W, h: CARD_H };
}

function rollUpgrades() {
  const pool = UPGRADES.slice();       // a copy, so we don't wreck the original
  const out = [];
  while (out.length < 3 && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

// ---------- enemy types ----------
// Also just data. Each one unlocks partway into a run and is picked by weight,
// so the swarm gets more varied the longer you last.
const ENEMY_TYPES = [
  { name: 'drifter', r: 9,  hp: 1, speed: 85,  xp: 1, weight: 6, from: 0,
    color: '#e8446e', glow: '#ff1e5a' },
  { name: 'darter',  r: 6,  hp: 1, speed: 190, xp: 1, weight: 3, from: 25,
    color: '#ffb648', glow: '#ff8a00' },
  { name: 'bulwark', r: 17, hp: 6, speed: 52,  xp: 3, weight: 2, from: 50,
    color: '#a05cff', glow: '#7b2fff' },
];

// ---------- menus ----------
// Same trick as upgrades and enemy types: a list of entries, so adding one
// is a line and nothing else changes.
const MENUS = {
  title: {
    heading: 'ABYSS',
    sub: 'something small, in very deep water',
    items: [
      { label: 'Start',   run: () => reset() },          // reset() starts the run
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
  ['Dash',           'Space'],
  ['Choose upgrade', 'arrows + Enter,  click,  or 1 2 3'],
  ['Restart a run',  'R'],
  ['Mute sound',     'M'],
  ['Menu / back',    'Esc'],
  ['Menus',          'mouse, or arrows + Enter'],
];

const HELP_BLURB = [
  'Your weapon fires by itself, along whatever your mouse points at,',
  'whenever anything is inside the ring.',
  'Space dashes: you pass through the swarm unharmed, and hurt it.',
  'Things you kill drop green motes. Walk over them to gain XP.',
  'Motes fade after eight seconds, so the reward sits where the danger was.',
  'Fill the bar, take one of three upgrades, and see how long you last.',
];
