// ===== main: the frame loop and boot =====

let last = performance.now();
let fps = 60;

// Only measures time: banking it into fixed steps is game/'s `advanceBy()`,
// since the fixed timestep has to survive the port and this file does not.
function frame(now) {
  const elapsed = (now - last) / 1000;
  last = now;
  if (elapsed > 0) fps += (1 / elapsed - fps) * 0.1;   // smoothed, or unreadable

  advanceBy(elapsed);
  draw();
  showSetup();
  requestAnimationFrame(frame);
}

// The debug setup lives in the address bar (D102), so a pasted URL replays it.
// Some browsers refuse to rewrite a file:// address; the code is on screen too.
let shownCode = '';
function showSetup() {
  if (!debugSetup || setupCode() === shownCode) return;
  shownCode = setupCode();
  try { history.replaceState(null, '', '?debug=' + shownCode); } catch (e) { /* on screen anyway */ }
}

// Query params are platform business: game/ never reads a URL, so the seed is
// passed in.
const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? undefined : Number(seedParam) >>> 0;
const devScenario = params.get('dev');
// `?debug` (D102): its setup screen in place of the title.
const debugCode = params.get('debug');

// Silent when driven rather than played: `?test` and `?dev=` scenarios. The
// audio checks measure offline (checks.js), never through this gain.
const driven = params.has('test') || devScenario !== null;
if (driven) volume = 0;

// The seam's seventh name (D77): game/ says when, and this layer keeps the
// text. A driven game never writes, or a check would land on the real save.
const SAVE_KEY = 'abyss-save';
// Served by `npm run play` (D163): the career goes back to it as it grows.
const logging = location.port === '8765';
let logged = -1;
function persist(text) {
  if (driven) return;
  try { localStorage.setItem(SAVE_KEY, text); }
  catch (e) { console.error('the save could not be written', e); }
  if (logging && meta.log.length !== logged) {
    logged = meta.log.length;
    fetch('/', { method: 'POST', body: '[\n' + meta.log.map(d => JSON.stringify(d)).join(',\n') + '\n]\n' })
      .catch(() => console.error('the log was not sent'));
  }
}

// A stepped scenario starts no frame loop: nothing moves until advance() moves
// it, so its state can be read as set, and the bot runs faster than real time.
// &play runs it live.
const stepped = devScenario !== null && !params.has('play');

if (devScenario !== null) {
  if (!applyScenario(devScenario, seed)) {
    console.error('no such scenario: "' + devScenario + '". Known: ' +
                  Object.keys(SCENARIOS).join(', '));
  }
} else if (debugCode !== null) {
  // The save is the player's: the debug mode never reads or writes it.
  openDebug(debugCode, seed);
} else {
  // No reset(): the title with no dive is the state's starting values. A save
  // this build refuses is copied aside before anything can overwrite it. A
  // driven game reads none, or ?test would check the player's gear.
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

// The other moments a dive is put down (D70). `saveNow()` writes nothing in
// the debug mode (D102).
window.addEventListener('pagehide', () => saveNow());
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

// n fixed ticks, then one draw: how the bot and the checks skip wall-clock
// time. Not named step(), which would shadow game/logic.js's.
function advance(n = 1) {
  for (let i = 0; i < n; i++) update(FIXED_DT);
  draw();
}

// A stepped scenario never starts the loop, so draw its opening frame once, or
// it loads black and reads as broken.
if (stepped) advance(0);
