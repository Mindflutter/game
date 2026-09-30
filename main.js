// ===== main =====
// The frame loop and boot.

// ---------- the loop ----------
let last = performance.now();
let fps = 60;

// All this layer does with time is measure it. Banking it into fixed steps is
// `advanceBy()` in game/logic.js, because the fixed timestep is a property of
// the simulation and has to survive the port -- this file does not.
function frame(now) {
  const elapsed = (now - last) / 1000;
  last = now;
  if (elapsed > 0) fps += (1 / elapsed - fps) * 0.1;   // smoothed, or unreadable

  advanceBy(elapsed);
  draw();
  requestAnimationFrame(frame);
}

// ---------- boot ----------
// Query params are platform business: game/ never reads a URL, so the seed is
// passed in as an argument. ?seed=<n> replays an exact dive, with a scenario
// (?dev=); without it, a fresh random seed is chosen and recorded in
// currentSeed. A dive begun from `home` always draws a fresh seed.
const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? undefined : Number(seedParam) >>> 0;
const devScenario = params.get('dev');

// Dev flags, combinable with everything above and with each other: &immortal
// (nothing hurts you) and &damage=<n> (every shot does n; a bare &damage is
// 100, one shot for anything in the game). Set before the first reset(), which
// is what applies the damage, and every later reset() applies it again.
immortal = params.has('immortal');
if (params.has('damage')) damageOverride = Number(params.get('damage')) || 100;

// Silent whenever the game is being *driven* rather than played: `?test` runs
// unattended, and `?dev=` scenarios are what Playwright drives. Neither should
// make noise on the machine running them.
//
// This does not weaken the audio checks. They synthesise each sound in an
// `OfflineAudioContext` and measure its peak there (checks.js), which never
// reaches the speakers and never touches this gain. The headless bot has no
// audio at all -- `sound` is stubbed at the seam.
const driven = params.has('test') || devScenario !== null;
if (driven) volume = 0;

// ---------- the save ----------
// The seam's seventh name (D70): game/ decides *when* to save and hands over
// the text; keeping it is this layer's job, rewritten on the port. A driven
// game never writes -- every ?test check and every scenario plays dives, and
// not one of them may land on top of the player's real save.
const SAVE_KEY = 'abyss-save';
function persist(text) {
  if (driven) return;
  try { localStorage.setItem(SAVE_KEY, text); }
  catch (e) { console.error('the save could not be written', e); }
}

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
  // No reset(): the game opens on the title with no dive, which is simply the
  // state's own starting values (game/state.js). Only Dive or Continue begin one.
  // Loading runs the other way across the seam, so it needs no name. A save
  // this build refuses is copied aside before anything can overwrite it, and
  // the title says why -- loudly, never silently lost. A driven game reads no
  // save either: ?test would otherwise check the player's gear, not the game's.
  let stored = null;
  if (!driven) {
    try { stored = localStorage.getItem(SAVE_KEY); } catch (e) { /* no storage: a fresh start */ }
  }
  saveError = loadSave(stored);
  if (saveError) {
    console.error('save rejected: ' + saveError);
    try { localStorage.setItem(SAVE_KEY + '-rejected', stored); } catch (e) { /* said on screen anyway */ }
  }
}

// The other moments a dive is put down (D70): the tab hidden, the page closed.
// game/ writes on pause, on a purchase and when a dive ends.
window.addEventListener('pagehide', () => persist(saveText()));
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(saveText()); });

// Advances the simulation by n fixed ticks, then draws once. The bot and the
// checks use this instead of waiting for wall-clock time.
// NOT named step(): game/logic.js already owns step(dt) as the simulation's own
// per-frame function, and shadowing it from here recursed infinitely.
function advance(n = 1) {
  for (let i = 0; i < n; i++) update(FIXED_DT);
  draw();
}

// A stepped scenario never starts the frame loop, so nothing would ever paint:
// it would load as a black screen and read as broken. Draw the opening frame
// once, then wait to be advanced.
if (stepped) advance(0);
