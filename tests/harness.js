// Loads game/ into Node with nothing but the port seam stubbed out.
//
// This is not a convenience: it is the seam check, executable. `game/` is
// supposed to contain zero browser API and reach into platform/ for exactly
// seven names (D18) -- the seventh, `persist`, is S4's save. If that ever stops being true, this throws -- which is a stronger
// guarantee than the grep design.md used to rely on.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The seven names, and only the seven.
export const SEAM = ['sound', 'keys', 'justPressed', 'tapped', 'moveCursor', 'aim', 'persist'];

// No TICK constant here on purpose. It used to be a copy of the game's
// FIXED_DT with a test to notice when the two disagreed, but every caller
// already has a loaded game in hand -- so the deeper answer was to delete the
// copy, not to guard it. Read `g.FIXED_DT`.

export function loadGame() {
  const src = ['game/content.js', 'game/state.js', 'game/logic.js']
    .map(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8'))
    .join('\n;\n');

  const keys = new Set();
  const justPressed = new Set();

  const ctx = {
    // --- the seam ---
    sound: () => {},                                   // audio is platform's job
    keys,
    justPressed,
    tapped: codes => codes.some(c => justPressed.has(c)),
    moveCursor: (index, _length) => index,             // menus are not under test
    aim: { x: 0, y: 0 },
    // Storing is platform's job; here the last text written is kept on the
    // context, as `saved`, so a test can read what the game would have stored.
    persist: text => { ctx.saved = text; },
    // --- language builtins the sandbox needs ---
    Math, Object, Array, Set, Map, JSON, Number, String, Boolean, isNaN, isFinite,
    console,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);

  // `let` at the top level of a script becomes a lexical binding, not a property
  // of the global object, so `enemies` and friends are invisible from outside.
  // Bridge them with accessors generated from the names, rather than eval.
  const STATE = ['player', 'enemies', 'bullets', 'gems', 'particles',
                 'elapsed', 'kills', 'shake', 'queuePaused', 'batchIndex', 'breathTimer',
                 'cameraY', 'waterY',
                 'rank', 'currency', 'choices', 'choiceIndex', 'modCounts',
                 'screen', 'currentSeed', 'bulletId', 'shakeLevel',
                 'immortal', 'damageOverride', 'plan', 'meta', 'diveLive',
                 'notice', 'resumeTo'];
  // Constants are `const`, so they get a getter only.
  const CONSTS = ['ARENA_W', 'ARENA_H', 'PLAYER_START', 'ENEMY_TYPES', 'MODS',
                  'SCENARIOS', 'LAYERS', 'GATE_PAUSE', 'FIXED_DT', 'MAX_FRAME_DT',
                  'MOD_OFFER_DELAY', 'MOD_ROWS',
                  'GATE_SPACING', 'CURRENT_SPEED', 'CURRENT_CRAWL',
                  'FILLERS', 'FILLER_GEMS', 'WEAPONS', 'EQUIPMENT', 'ATTRIBUTES',
                  'MENUS', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'GO', 'DASH', 'CLICK'];

  const bridge = 'Object.defineProperties(globalThis, {' + [
    ...STATE.map(n => `${n}: { get: () => ${n}, set: v => { ${n} = v; }, configurable: true }`),
    ...CONSTS.map(n => `${n}: { get: () => ${n}, configurable: true }`),
  ].join(', ') + '});';

  vm.runInContext(src + '\n;\n' + bridge, ctx, { filename: 'game-bundle.js' });
  return ctx;
}

// ---------- shared by the test files ----------

// Ticks for `seconds` of game time, in the game's own step: a hardcoded 120
// is exactly the budget D53 once halved without anyone noticing.
export const ticks = (g, seconds) => Math.round(seconds / g.FIXED_DT);

// Ticks until a batch arrives or the screen changes, holding `hold` the whole
// way -- nothing in game/ writes `keys`, so setting them once holds them.
// Returns the camera depth after every tick.
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

// Kills the batch through the real death path, then plays on until the screen
// changes -- the mod offer, or the layer end -- or `seconds` run out.
export function clearAndWait(g, seconds = 5) {
  for (const e of [...g.enemies]) g.killEnemy(e);
  for (let i = 0, n = ticks(g, seconds); i < n && g.screen === 'playing'; i++) g.update(g.FIXED_DT);
  return g.screen;
}
