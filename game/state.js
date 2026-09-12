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
let optionIndex = 0;        // cursor in the options list
let returnTo = 'title';     // where Esc goes back to from help / options

function reset() {
  player = {
    ...PLAYER_START,
    x: ARENA_W / 2,
    y: ARENA_H / 2,
    hurt: 0,           // seconds of invulnerability left
    fireTimer: 0,      // seconds until the next shot
  };
  enemies = [];
  bullets = [];
  gems = [];
  particles = [];
  elapsed = 0;         // seconds survived
  spawnTimer = 0;
  kills = 0;
  shake = 0;           // pixels of screen shake left
  screen = 'playing';  // a reset run is a running run

  xp = 0;
  xpNext = XP_BASE;
  level = 1;
  choices = [];
}

let volume = 0.6;           // master gain, 0..1
let shakeLevel = 2;         // index into SHAKE_LEVELS
let showFps = false;

function openScreen(name) {
  returnTo = screen;
  screen = name;
  optionIndex = 0;
}
