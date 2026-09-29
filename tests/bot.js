// A scripted bot, so balance is reported as numbers rather than impressions
// (D16). It drives the seam directly -- keys, aim, the mouse button -- and runs
// as fast as Node will go, not at wall-clock speed.
//
// It is deliberately a weak, simple driver: for regression it only has to be
// *consistent*, and a bot that plays brilliantly would flatter the balance and
// make everything look too easy. See `ideas.md` -> "There are three bots".
import { loadGame } from './harness.js';

// Aim at the nearest enemy, hold the trigger, and back away from it. That is
// the whole policy.
//
// `g.player`, `g.ARENA_W` and friends are vm-bridged accessors, not plain
// properties -- every read crosses into the sandbox. They are hoisted out of
// the loop because this runs ~10k times per dive with ~9 enemies each.
export function kiteAndShoot(g) {
  const p = g.player;
  const px = p.x, py = p.y;
  // The middle of the *view*, in world space: the camera moves (S2), and a
  // centre fixed at 400 would drag the bot to the top of the layer.
  const cx = g.ARENA_W / 2, cy = g.cameraY + g.ARENA_H / 2;

  let near = null, best = Infinity;
  for (const e of g.enemies) {
    const dx = e.x - px, dy = e.y - py;
    const d2 = dx * dx + dy * dy;          // squared: we only ever compare
    if (d2 < best) { best = d2; near = e; }
  }

  g.keys.clear();
  if (!near) return;                        // clear() already released the trigger

  g.aim.x = near.x;
  g.aim.y = near.y - g.cameraY;           // aim is in the view, enemies in the world
  g.keys.add(g.CLICK[0]);

  // Retreat, but bias toward the middle rather than cornering ourselves.
  const vx = (px - near.x) + (cx - px) * 0.6;
  const vy = (py - near.y) + (cy - py) * 0.6;
  if (vx < -20) g.keys.add(g.LEFT[1]); else if (vx > 20) g.keys.add(g.RIGHT[1]);
  if (vy < -20) g.keys.add(g.UP[1]);   else if (vy > 20) g.keys.add(g.DOWN[1]);
}

// Plays one dive and reports how long each batch took to clear.
//
// `batchIndex > times.length` is the "a begun batch is still unrecorded" test,
// so no separate timing flag is needed: once a clear is pushed the condition is
// false, which is what stops the timer re-arming during the quiet beat when the
// arena is legitimately empty.
// `secondsCap` is wall-clock *game* time, not ticks: a tick budget silently
// halved every dive when D53 moved the step from 1/60 to 1/120.
//
// `immortal` keeps the bot alive, which is how the S2 traverse time is taken:
// the mortal bot dies on every seed before the bottom, and a layer it cannot
// finish has no traverse time to report. `scenario` starts it from a named
// setup instead of the top (D37) -- how the boss fight is measured alone (D63).
// A scenario can start deep in the list, so batches count from where it began.
// One tick of the bot's input, without the update: shared by `diveReport` and
// by tests that assert on every tick, so both play the same bot.
export function botInput(g) {
  // Every cleared batch offers three mods (D34), and the dive does not resume
  // until one is taken -- so the bot has to pick. It always takes the first
  // card rather than rolling: a bot that chose at random would build itself
  // differently every dive, and two dives that are not the same dive cannot
  // be compared.
  if (g.screen === 'mods') g.justPressed.add('Digit1');
  else kiteAndShoot(g);
}

export function diveReport(seed, batches = 5, secondsCap = 180, immortal = false, scenario) {
  const g = loadGame();
  if (scenario) g.applyScenario(scenario, seed);
  else g.reset(seed);
  g.immortal = immortal;                   // the &immortal flag, set once
  const base = g.batchIndex;

  const TICK = g.FIXED_DT;               // the game's own step, not a copy
  const tickCap = Math.round(secondsCap / TICK);

  const times = [];
  let ticks = 0, seen = 0, startTick = 0;

  while (times.length < batches && ticks < tickCap && g.screen !== 'dead' &&
         g.screen !== 'bottom') {
    if (g.batchIndex !== seen) { seen = g.batchIndex; startTick = ticks; }
    botInput(g);
    g.update(TICK);                      // update() clears justPressed itself
    ticks++;
    if (g.batchIndex - base > times.length && g.enemies.length === 0) {
      times.push(+((ticks - startTick) * TICK).toFixed(2));
    }
  }
  return { seed, alive: g.screen !== 'dead', reachedBottom: g.screen === 'bottom', ranFor: +(ticks * TICK).toFixed(1),
           hpLeft: g.player.hp, clearTimes: times };
}
