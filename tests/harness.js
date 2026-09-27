// Loads game/ into Node with nothing but the port seam stubbed out.
//
// This is not a convenience: it is the seam check, executable. `game/` is
// supposed to contain zero browser API and reach into platform/ for exactly six
// names (D18). If that ever stops being true, this throws -- which is a stronger
// guarantee than the grep design.md used to rely on.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The six names, and only the six.
export const SEAM = ['sound', 'keys', 'justPressed', 'tapped', 'moveCursor', 'aim'];

// The fixed timestep, in one place. Everything that drives update() uses it.
export const TICK = 1 / 60;

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
                 'xp', 'xpNext', 'level', 'choices', 'choiceIndex',
                 'screen', 'currentSeed', 'bulletId', 'shakeLevel'];
  // Constants are `const`, so they get a getter only.
  const CONSTS = ['ARENA_W', 'ARENA_H', 'PLAYER_START', 'ENEMY_TYPES', 'UPGRADES',
                  'SCENARIOS', 'BATCHES', 'GATE_PAUSE', 'XP_BASE', 'XP_GROWTH',
                  'GEM_LIFE', 'IFRAMES', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'GO', 'DASH', 'CLICK'];

  const bridge = 'Object.defineProperties(globalThis, {' + [
    ...STATE.map(n => `${n}: { get: () => ${n}, set: v => { ${n} = v; }, configurable: true }`),
    ...CONSTS.map(n => `${n}: { get: () => ${n}, configurable: true }`),
  ].join(', ') + '});';

  vm.runInContext(src + '\n;\n' + bridge, ctx, { filename: 'game-bundle.js' });
  return ctx;
}
