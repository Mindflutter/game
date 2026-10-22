// Things that must hold for *every* dive, not only the ones a scripted check
// walks through; fast-check shrinks a failure to its smallest case. Each one
// guards a recorded decision (D39).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, SEAM, ticks, ride } from './harness.js';
import { diveReport, makeDiver } from './bot.js';
import { fight } from './measure.js';

// Seed-derived input, so a failing case replays exactly.
function dive(seed, ticks, inputSeed = seed) {
  const g = loadGame();
  g.reset(seed);
  let s = inputSeed >>> 0;
  const next = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < ticks; i++) {
    g.keys.clear();
    if (next() < 0.5) g.keys.add('KeyW');
    if (next() < 0.5) g.keys.add('KeyA');
    if (next() < 0.5) g.keys.add('KeyD');
    if (next() < 0.5) g.keys.add('KeyS');
    if (next() < 0.02) g.justPressed.add('Space');
    if (next() < 0.08) {
      // Cursor exactly on the player, a zero-length aim: `aim` starts where the
      // player does, and random points alone never reach it, leaving the NaN
      // check one that can only pass.
      g.aim.x = g.player.x;
      g.aim.y = g.player.y - g.cameraY;      // aim is in the view (D58)
    } else {
      g.aim.x = next() * 1280;
      g.aim.y = next() * 800;
    }
    g.update(g.FIXED_DT);                  // update() clears justPressed itself
  }
  return g;
}

// Every number the simulation owns, flattened, so one NaN anywhere is caught.
function allNumbers(g) {
  const out = [];
  const take = o => { for (const k in o) if (typeof o[k] === 'number') out.push([k, o[k]]); };
  take(g.player);
  for (const arr of [g.enemies, g.bullets, g.gems, g.drops, g.boosts, g.particles]) {
    for (const e of arr) take(e);
  }
  out.push(['elapsed', g.elapsed], ['shake', g.shake],
           ['currency', g.currency], ['kills', g.kills], ['sinceBoost', g.sinceBoost]);
  return out;
}

describe('the port seam', () => {
  it('game/ loads with nothing but the seven seam names (D18)', () => {
    // An eighth seam name, or any browser API, at load throws here.
    expect(SEAM).toHaveLength(7);
    const g = loadGame();
    expect(typeof g.update).toBe('function');
    expect(typeof g.reset).toBe('function');
    // The fixed-step clock is game/'s (D53), so Node drives the same entry
    // point the browser does instead of calling update() by hand.
    expect(typeof g.advanceBy).toBe('function');
  });

  it('every option runs on the seam alone, both ways (D18)', () => {
    // Loading proves only what runs at load. An option's change() runs on a
    // key press, and nothing else in Node presses one.
    const g = loadGame();
    for (const o of g.OPTIONS) {
      o.change(-1);
      o.change(1);
      o.show();
    }
  });

  it('banks real time into whole fixed steps, capped (D53)', () => {
    const g = loadGame();
    g.reset(1);
    expect(g.advanceBy(0)).toBe(0);
    expect(g.advanceBy(g.FIXED_DT * 2)).toBe(2);
    expect(g.advanceBy(g.FIXED_DT * 0.6)).toBe(0);   // banked, not stretched
    expect(g.advanceBy(g.FIXED_DT * 0.6)).toBe(1);
    g.reset(1);
    expect(g.advanceBy(g.MAX_FRAME_DT)).toBe(g.MAX_FRAME_DT / g.FIXED_DT);   // a whole frame, whole
    g.reset(1);
    // A minute in another tab must not be simulated all at once.
    expect(g.advanceBy(60)).toBe(g.MAX_FRAME_DT / g.FIXED_DT);
  });
});

describe('the bot', () => {
  it('plays a dive and reproduces it exactly from the seed', () => {
    // The bot is the instrument every balance number comes from (D16), so it
    // needs a caller: without one it can rot silently and nothing would say so.
    // Immortal: it dies on the first graded batch (D128), and a ruler
    // needs only to be the same twice. Not '=== 3': that moves with the batch
    // table. It must clear *something*, deterministically.
    const a = diveReport(4471, 3, 180, true);
    expect(a.clearTimes.length).toBeGreaterThan(0);
    expect(diveReport(4471, 3, 180, true)).toEqual(a);
  });

  it('starts from a scenario and records only the fights it plays (D63)', () => {
    // One clear, then the win: a report from the top, or a zero-second "clear"
    // from a scenario's batchIndex not starting at 0, fails one of the two.
    // 600s is headroom over what a starting Gun takes on the last gate.
    const r = diveReport(4471, 2, 600, true, 'last-batch');
    expect(r.clearTimes.length).toBe(1);
    expect(r.won).toBe(true);
  });

  // The diver bot measures S6 (balance): a comparison is paired only if a seed
  // replays exactly and the bot never moves the game's own draws.
  it('replays a fight exactly from its seed (D128)', () => {
    const entry = { layer: 0, batch: { enemies: [['drifter', 8], ['archer', 3]] } };
    const a = fight(7, {}, entry);
    expect(a.cleared).toBe(true);
    expect(fight(7, {}, entry)).toEqual(a);
  });

  it('draws nothing from the game\'s generator (D128)', () => {
    const g = loadGame();
    g.reset(42);
    ride(g);
    const bot = makeDiver(42), was = g.rngState;
    for (let i = 0; i < 300; i++) bot(g);
    expect(g.enemies.length).toBeGreaterThan(0);
    expect(g.rngState).toBe(was);
  });

  it('standing, never swims and never dashes (D128)', () => {
    const g = loadGame();
    g.reset(42);
    const bot = makeDiver(42, { stand: true });
    const moves = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
    for (let i = 0; i < 2400; i++) {
      bot(g);
      expect(moves.some(k => g.keys.has(k) || g.justPressed.has(k))).toBe(false);
      g.update(g.FIXED_DT);
    }
    expect(g.kills).toBeGreaterThan(0);
  });
});

// The dev flags (D102): what they do is game state, checked here.
describe('scenarios (D37)', () => {
  it('place exactly what they name, and a paused queue never gains a fish', () => {
    const g = loadGame();
    expect(g.applyScenario('one-drifter')).toBe(true);
    expect(g.enemies.map(e => e.name)).toEqual(['drifter']);
    expect(g.queuePaused).toBe(true);
    let most = 1;
    for (let i = 0; i < 900; i++) { g.update(1 / 60); most = Math.max(most, g.enemies.length); }
    expect(most).toBe(1);
    expect(g.applyScenario('all-types')).toBe(true);
    expect(g.enemies.map(e => e.name)).toEqual(g.ENEMY_TYPES.filter(t => t.carries !== false).map(t => t.name));
  });

  it('start deep in the queue with it running, and an unknown one says so', () => {
    const g = loadGame();
    expect(g.applyScenario('late-swarm')).toBe(true);
    expect([g.batchIndex, g.queuePaused]).toEqual([5, false]);
    g.immortal = true;
    for (let i = 0; i < 300; i++) g.update(1 / 60);
    expect([g.batchIndex, g.enemies.length > 0]).toEqual([6, true]);
    expect(g.applyScenario('no-such-scenario')).toBe(false);
  });
});

describe('dev flags', () => {
  function hpUnderBulwark(immortal) {
    const g = loadGame();
    g.immortal = immortal;
    g.reset(1);
    g.queuePaused = true;
    g.placeEnemy('bulwark', g.player.x, g.player.y);
    for (let i = 0, n = ticks(g, 2); i < n; i++) g.update(g.FIXED_DT);
    return g.player.hp;
  }

  it('immortal: an enemy on the player does no harm', () => {
    expect(hpUnderBulwark(false)).toBeLessThan(3);   // the control: it does hurt
    expect(hpUnderBulwark(true)).toBe(3);
  });

  it('the damage override: replaces shot damage from the first dive on, and survives Dive again', () => {
    const g = loadGame();
    g.damageOverride = 100;
    g.reset(1);
    expect(g.player.damage).toBe(100);
    g.reset(2);                                        // what Dive again does
    expect(g.player.damage).toBe(100);
    g.damageOverride = 0;
    g.reset(3);
    expect(g.player.damage).toBe(g.WEAPONS[0].damage);
  });
});

describe('invariants that must hold for every dive', () => {
  it('never produces NaN or Infinity, whatever the input (D39)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const bad = allNumbers(dive(seed, 400)).filter(([, v]) => !Number.isFinite(v));
      expect(bad).toEqual([]);
    }), { numRuns: 40 });
  });

  it('keeps hp within [0, maxHp]', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const g = dive(seed, 400);
      expect(g.player.hp).toBeGreaterThanOrEqual(0);
      expect(g.player.hp).toBeLessThanOrEqual(g.player.maxHp);
      for (const e of g.enemies) expect(e.hp).toBeGreaterThan(0);   // D7: swept when dead
    }), { numRuns: 40 });
  });

  it('keeps the player inside the view', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const g = dive(seed, 600);
      expect(g.player.x).toBeGreaterThanOrEqual(0);
      expect(g.player.x).toBeLessThanOrEqual(g.ARENA_W);
      expect(g.player.y).toBeGreaterThanOrEqual(g.cameraY);
      expect(g.player.y).toBeLessThanOrEqual(g.cameraY + g.ARENA_H);
    }), { numRuns: 30 });
  });

  it('replays a dive exactly from its seed (D41)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const trace = () => {
        const g = dive(seed, 300);
        return JSON.stringify([g.enemies.length, g.kills, g.gems.length,
                               g.player.hp, Math.round(g.elapsed * 1000)]);
      };
      expect(trace()).toBe(trace());
    }), { numRuns: 25 });
    // ...and two seeds play two dives, each recorded as the one it used.
    const a = dive(4471, 600, 1), b = dive(9999, 600, 1);   // the same hands
    expect([a.currentSeed, b.currentSeed]).toEqual([4471, 9999]);
    // Where the fish are: the seed's alone, where the diver's moves are the hands'.
    const fish = g => JSON.stringify(g.enemies.map(e => [e.name, Math.round(e.x), Math.round(e.y)]));
    expect(fish(a)).not.toBe(fish(b));
  });

  it('decays on a time base, not a frame base (D15)', () => {
    // Math.pow(x, dt): one second of shake decays the same however it is sliced.
    fc.assert(fc.property(fc.integer({ min: 2, max: 240 }), steps => {
      const decay = n => {
        const g = loadGame();
        g.reset(1);
        g.screen = 'dead';             // step() returns early; shake still fades
        g.shake = 100;
        for (let i = 0; i < n; i++) g.update(1 / n);
        return g.shake;
      };
      const a = decay(60), b = decay(steps);
      // Both decayed one whole second. Allow a hair for float accumulation.
      expect(Math.abs(a - b)).toBeLessThan(0.5);
    }), { numRuns: 25 });
  });
});
