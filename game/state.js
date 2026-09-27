// ===== state =====
// Everything a run owns, plus the settings the options screen edits.

// ---------- game state ----------
// Everything a run owns lives here, so restarting is one call.
let player, enemies, bullets, gems, particles;
let elapsed, spawnTimer, kills, shake;
let xp, xpNext, level, choices;

// Which screen we're on. Replaces the old `paused` and `dead` flags, which
// could contradict each other; now there is exactly one answer at a time.
// 'title' | 'playing' | 'levelup' | 'paused' | 'help' | 'options' | 'dead'
let screen = 'title';
let menuIndex = 0;          // cursor in the title / pause menu
let choiceIndex = 0;        // highlighted upgrade card
let lastAimX = 0, lastAimY = 0;   // so a still mouse doesn't fight the arrows
let optionIndex = 0;        // cursor in the options list
let returnTo = 'title';     // where Esc goes back to from help / options

// ---------- randomness ----------
// Every random number in a dive comes from here, seeded, so the same seed
// replays the same dive exactly. That is what lets two balance measurements be
// of the *same* game instead of two different ones, and it turns "it broke
// sometimes" into "it broke on seed 4471".
//
// mulberry32: 32 bits of state, one multiply-xor-shift round. Tiny, fast, and
// statistically fine for gameplay -- this is not cryptography.
let rngState = 0;
let currentSeed = 0;

function seedRng(seed) {
  currentSeed = seed >>> 0;
  rngState = currentSeed;
}

function rng() {
  rngState = (rngState + 0x6D2B79F5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// The one deliberate exception: *choosing* a seed is not part of the
// deterministic sequence, so an unseeded dive picks one at random. A port does
// the same with whatever its language offers.
function reset(seed) {
  seedRng(seed === undefined ? (Math.random() * 0x100000000) >>> 0 : seed);
  player = {
    ...PLAYER_START,
    x: ARENA_W / 2,
    y: ARENA_H / 2,
    hurt: 0,           // seconds of invulnerability left
    fireTimer: 0,      // seconds until the next shot
    dashTime: 0,       // seconds of dash left, 0 when not dashing
    dashCd: 0,         // seconds until the dash is ready again
    dashId: 0,         // shares the bullet id space, so one dash hits an
                       // enemy at most once (same trick as pierce)
    dashDx: 1,         // direction the wave faces, frozen at the dash's start
    dashDy: 0,         // so letting go of the keys can't spin it
    dashEnd: 0,        // seconds of the closing ring left
  };
  enemies = [];
  bullets = [];
  gems = [];
  particles = [];
  elapsed = 0;         // seconds survived
  spawnTimer = 0;
  kills = 0;
  bulletId = 0;        // or two dives with the same seed hand out different ids
  shake = 0;           // pixels of screen shake left
  screen = 'playing';  // a reset run is a running run

  xp = 0;
  xpNext = XP_BASE;
  level = 1;
  choices = [];
  choiceIndex = 0;
}

let volume = 0.6;           // master gain, 0..1
let shakeLevel = 2;         // index into SHAKE_LEVELS
let showFps = false;

function openScreen(name) {
  returnTo = screen;
  screen = name;
  optionIndex = 0;
}
