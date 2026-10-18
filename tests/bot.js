// A scripted bot, so balance is numbers, not impressions (D16). Deliberately
// weak: for regression it only has to be consistent, and a brilliant bot would
// flatter the balance. See `ideas.md` -> "There are three bots".
import { loadGame } from './harness.js';

// The whole policy: aim at the nearest enemy, hold the trigger, back away.
// Bridged reads cross into the sandbox, so they are hoisted out of the loop.
export function kiteAndShoot(g) {
  const p = g.player;
  const px = p.x, py = p.y;
  // The middle of the *view*: a fixed centre would drag the bot to the top of
  // the layer.
  const cx = g.ARENA_W / 2, cy = g.cameraY + g.ARENA_H / 2;

  let near = null, best = Infinity;
  for (const e of g.enemies) {
    const dx = e.x - px, dy = e.y - py;
    const d2 = dx * dx + dy * dy;
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

// One tick of the bot's input, without the update: shared by `diveReport` and
// by tests that assert on every tick, so both play the same bot.
export function botInput(g) {
  // Always the first card: a bot choosing at random would build itself
  // differently every dive, and two different dives cannot be compared (D85).
  // Boosts it never seeks (D86), so its numbers stay a floor.
  if (g.screen === 'mods') {
    g.justPressed.add('Digit1');
    g.justPressed.add('Enter');
  } else kiteAndShoot(g);
}

// `batchIndex > times.length` means a begun batch is still unrecorded, so the
// quiet beat between batches cannot re-arm the timer. `immortal` is how a
// traverse time is taken: the mortal bot dies before the bottom. A `scenario`
// starts from a named setup (D37), such as the boss fight alone (D63).
export function diveReport(seed, batches = 5, secondsCap = 180, immortal = false, scenario) {
  const g = loadGame();
  if (scenario) g.applyScenario(scenario, seed);
  else g.reset(seed);
  g.immortal = immortal;
  const base = g.batchIndex;

  const TICK = g.FIXED_DT;
  const tickCap = Math.round(secondsCap / TICK);

  const times = [];
  let ticks = 0, seen = 0, startTick = 0;

  while (times.length < batches && ticks < tickCap && g.screen !== 'dead' &&
         g.screen !== 'won') {
    if (g.batchIndex !== seen) { seen = g.batchIndex; startTick = ticks; }
    botInput(g);
    g.update(TICK);                      // update() clears justPressed itself
    ticks++;
    if (g.batchIndex - base > times.length && !g.batchLive()) {
      times.push(+((ticks - startTick) * TICK).toFixed(2));
    }
  }
  return { seed, alive: g.screen !== 'dead', won: g.screen === 'won', ranFor: +(ticks * TICK).toFixed(1),
           hpLeft: g.player.hp, clearTimes: times };
}
