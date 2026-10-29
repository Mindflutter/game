// Loads game/ into Node with only the port seam stubbed: the seam check,
// executable. `game/` reaches platform/ for exactly seven names (D18, D77); an
// eighth throws, at load or on any path a test drives.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export const SEAM = ['sound', 'keys', 'justPressed', 'tapped', 'moveCursor', 'aim', 'persist'];

// No TICK constant: every caller has a loaded game in hand, and a copy of
// FIXED_DT is a number that can disagree with itself. Read `g.FIXED_DT`.

// `root` and `extra` for Sonar's replay: a copied build, and platform/sonar.js.
export function loadGame(root = new URL('../', import.meta.url), extra = []) {
  const src = ['game/content.js', 'game/state.js', 'game/logic.js', ...extra]
    .map(f => readFileSync(new URL(f, root), 'utf8'))
    .join('\n;\n');

  const keys = new Set();
  const justPressed = new Set();

  const ctx = {
    // --- the seam ---
    sound: () => {},
    keys,
    justPressed,
    tapped: codes => codes.some(c => justPressed.has(c)),
    moveCursor: (index, _length) => index,             // menus are not under test
    aim: { x: 0, y: 0 },
    // The last text written, as `saved`, for a test to read.
    persist: text => { ctx.saved = text; },
    // --- language builtins the sandbox needs ---
    Math, Object, Array, Set, Map, JSON, Number, String, Boolean, isNaN, isFinite,
    console,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);

  // A top-level `let` is a lexical binding, not a global property, so it is
  // invisible from outside: bridged by generated accessors, not eval.
  const STATE = ['player', 'enemies', 'bullets', 'gems', 'particles',
                 'elapsed', 'kills', 'shake', 'queuePaused', 'batchIndex', 'incoming', 'breathTimer',
                 'cameraY', 'waterY',
                 'currency', 'choices', 'choiceIndex', 'modCounts',
                 'drops', 'boosts', 'banner', 'met', 'metTime', 'sinceBoost',
                 'screen', 'currentSeed', 'bulletId', 'shakeLevel',
                 'immortal', 'damageOverride', 'plan', 'meta', 'diveLive',
                 'notice', 'resumeTo', 'weaponName', 'guardLeft', 'batchHit',
                 'tally', 'killTimes', 'firstKillAt', 'glowAt', 'layerStart',
                 'debugSetup', 'menuIndex', 'muted', 'volume', 'showFps',
                 'fireArmed', 'gemPop', 'offerTimer', 'optionIndex', 'returnTo', 'rngState', 'story'];
  // Constants are `const`, so they get a getter only.
  const CONSTS = ['ARENA_W', 'ARENA_H', 'PLAYER_START', 'ENEMY_TYPES', 'GRADES', 'MODS', 'MINI_BOSS', 'BOSS', 'STAT_NAMES',
                  'SCENARIOS', 'LAYERS', 'GATE_PAUSE', 'FIXED_DT', 'MAX_FRAME_DT',
                  'MOD_OFFER_DELAY', 'MOD_ROWS',
                  'GATE_SPACING', 'CURRENT_SPEED', 'CURRENT_CRAWL',
                  'WAVE_MIN', 'WAVE_MAX', 'WAVE_GAP', 'WAVE_JITTER', 'WAVE_SPREAD',
                  'BOOSTS', 'BOOST_C', 'BOOST_LIFE', 'END_STEP', 'CATALOGUE', 'NOTICE_TIME',
                  'WEAPONS', 'EQUIPMENT', 'ATTRIBUTES', 'CHALLENGES',
                  'MENUS', 'OPTIONS', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'GO', 'DASH', 'CLICK',
                  'DEBUG_COUNTS', 'DEBUG_FISH_MAX', 'DEBUG_BEHAVIOURS', 'ONE_SHOT', 'HELP_BLURB',
                  'DASH_TIME', 'DASH_GRACE', 'BUMP_TIME', 'LEAP_TIME', 'GEM_POP', 'GEM_FLY', 'GEM_BUMP', 'SHAKE_LEVELS', 'MENU_TOP', 'OPTION_TOP', 'HOME_TOP', 'PLAYER_STATS', 'KIT_STATS',
                  'THREAT_START', 'THREAT_RISE', 'GRADE_KEEP', 'batchThreat', 'ofGrade'];

  const bridge = 'Object.defineProperties(globalThis, {' + [
    ...STATE.map(n => `${n}: { get: () => ${n}, set: v => { ${n} = v; }, configurable: true }`),
    ...CONSTS.map(n => `${n}: { get: () => ${n}, configurable: true }`),
  ].join(', ') + '});';

  vm.runInContext(src + '\n;\n' + bridge, ctx, { filename: 'game-bundle.js' });
  return ctx;
}

// Sonar's replay (D164): the game from `root`, a play's copied build, and
// this tree's replay beside it, so every recording reads alike; and the
// platform's real menu cursor, since a recorded play goes through the menus.
export function loadReplay(root) {
  const g = loadGame(root, [new URL('../platform/sonar.js', import.meta.url).href]);
  g.moveCursor = (i, n) => g.tapped(g.UP) ? (i + n - 1) % n : g.tapped(g.DOWN) ? (i + 1) % n : i;
  return g;
}

// ---------- shared by the test files ----------

// In the game's own step, so a test's budget survives a change of FIXED_DT.
export const ticks = (g, seconds) => Math.round(seconds / g.FIXED_DT);

export const play = (g, seconds) => { for (let i = 0, n = ticks(g, seconds); i < n; i++) g.update(g.FIXED_DT); };

// Ticks until `done()` holds or `seconds` pass; whether it came.
export function until(g, seconds, done) {
  for (let i = 0, n = ticks(g, seconds); i < n; i++) {
    g.update(g.FIXED_DT);
    if (done()) return true;
  }
  return false;
}

// A fish of `name` to the diver's right with `gap` px of water between their
// bodies, held where it is but for pushes.
export function fishAt(g, name, gap) {
  g.placeEnemy(name, g.player.x + g.player.r + g.enemyType(name).r + gap, g.player.y);
  const e = g.enemies.at(-1);
  e.speed = 0;
  return e;
}

// An eel on top: the fish that hurts on touch (D108).
export function die(g) {
  g.player.hp = 1;
  g.player.hurt = 0;
  g.placeEnemy('eel', g.player.x, g.player.y);
  g.update(g.FIXED_DT);
  if (g.screen !== 'dead') throw new Error('die(): the diver lived, on ' + g.screen);
}

// Nothing in game/ writes `keys`, so setting `hold` once holds it. Returns the
// camera depth after every tick.
export function ride(g, hold = []) {
  g.keys.clear();
  for (const k of hold) g.keys.add(k);
  const cams = [];
  for (let i = 0, n = ticks(g, 30); i < n && g.enemies.length === 0 && g.screen === 'playing'; i++) {
    g.update(g.FIXED_DT);
    cams.push(g.cameraY);
  }
  return cams;
}

// A fresh game standing at the start of gate `k`'s descent: batch k-1 is
// cleared, the camera is still at its depth, the dive's opening beat is spent.
export function atGate(k) {
  const g = loadGame();
  g.reset(1);
  g.batchIndex = k;
  g.cameraY = g.gateDepth(k - 1);
  g.player.y = g.cameraY + g.ARENA_H / 2;
  g.breathTimer = 0;
  return g;
}

// Through the real death path, its waves still to come brought in first (D115).
export function clearAndWait(g, seconds = 5) {
  for (const f of g.incoming.splice(0)) g.arrive(f.name, f.flags);
  for (const e of [...g.enemies]) g.killEnemy(e);
  for (let i = 0, n = ticks(g, seconds); i < n && g.screen === 'playing'; i++) g.update(g.FIXED_DT);
  return g.screen;
}

// Whether two batches hold the same fish, whatever their grades: a plan's batch
// is its pool's, graded (D126).
const fishOf = b => b.enemies.reduce((m, [name, n]) => ({ ...m, [name]: (m[name] || 0) + n }), {});
export const sameFish = (a, b) => JSON.stringify(Object.entries(fishOf(a)).sort()) === JSON.stringify(Object.entries(fishOf(b)).sort());
