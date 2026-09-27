// ===== main =====
// The frame loop and boot.

// ---------- the loop ----------
let last = performance.now();
let fps = 60;
function frame(now) {
  // Seconds since the previous frame. Capped, so that switching tabs
  // for a minute doesn't teleport everything across the screen.
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.1;    // smoothed, or it's unreadable

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// ---------- boot ----------
// Query params are platform business: game/ never reads a URL, so the seed is
// passed in as an argument. ?seed=<n> replays an exact dive; without it, a
// fresh random seed is chosen and recorded in currentSeed.
const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? undefined : Number(seedParam) >>> 0;
const devScenario = params.get('dev');

// A stepped scenario deliberately does NOT start the frame loop: nothing moves
// until step() asks it to. That is what makes a scenario inspectable -- read the
// state and it is still the state you set up -- and it is how the bot drives the
// game faster than real time. Add &play to watch it run live instead.
const stepped = devScenario !== null && !params.has('play');

if (devScenario !== null) {
  if (!applyScenario(devScenario, seed)) {
    console.error('no such scenario: "' + devScenario + '". Known: ' +
                  Object.keys(SCENARIOS).join(', '));
  }
} else {
  reset(seed);
  screen = 'title';     // reset() leaves us playing; the game opens on the menu
}

// Advances the simulation by n fixed ticks, then draws once. The bot and the
// checks use this instead of waiting for wall-clock time.
// NOT named step(): game/logic.js already owns step(dt) as the simulation's own
// per-frame function, and shadowing it from here recursed infinitely.
function advance(n = 1) {
  for (let i = 0; i < n; i++) update(1 / 60);
  draw();
}

// A stepped scenario never starts the frame loop, so nothing would ever paint:
// it would load as a black screen and read as broken. Draw the opening frame
// once, then wait to be advanced.
if (stepped) advance(0);
