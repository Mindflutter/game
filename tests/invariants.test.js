// Property-based invariants: things that must hold for *every* dive, not just
// the handful a scripted check happens to walk through. fast-check generates
// the seeds and the input, and shrinks a failure to its smallest case.
//
// Each one guards a recorded decision (D39). A decision without a check erodes
// silently, and that is what this file is for.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, SEAM, ticks } from './harness.js';
import { diveReport } from './bot.js';

// Drives a dive with pseudo-random but seed-derived input, so a failing case
// replays exactly. Returns the game context for inspection.
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
      // The degenerate case the `|| 1` guards exist for: cursor exactly on the
      // player, so the aim vector has zero length. It happens for real -- `aim`
      // starts at the arena centre, which is where the player starts too. A
      // generator that only ever picks random points never reaches it, and then
      // the NaN invariant is a check that can only pass.
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
    // If game/ reaches for an eighth name, or any browser API, at load, this
    // throws. The seventh, `persist`, is the save's: storing text is
    // platform's, deciding when is game's (D77).
    expect(SEAM).toHaveLength(7);
    const g = loadGame();
    expect(typeof g.update).toBe('function');
    expect(typeof g.reset).toBe('function');
    // The fixed-step clock is game/'s (D53), so Node drives the same entry
    // point the browser does instead of calling update() by hand.
    expect(typeof g.advanceBy).toBe('function');
  });

  it('banks real time into whole fixed steps, capped (D53)', () => {
    const g = loadGame();
    g.reset(1);
    expect(g.advanceBy(0)).toBe(0);
    expect(g.advanceBy(g.FIXED_DT * 2)).toBe(2);
    expect(g.advanceBy(g.FIXED_DT * 0.6)).toBe(0);   // banked, not stretched
    expect(g.advanceBy(g.FIXED_DT * 0.6)).toBe(1);
    // A minute in another tab must not be simulated all at once.
    expect(g.advanceBy(60)).toBe(g.MAX_FRAME_DT / g.FIXED_DT);
  });
});

describe('the bot', () => {
  it('plays a dive and reproduces it exactly from the seed', () => {
    // The bot is the instrument every balance number comes from (D16), so it
    // needs a caller: without one it can rot silently and nothing would say so.
    const a = diveReport(4471, 3);
    // Not '=== 3': how many batches a seed reaches depends on the batch table,
    // which S6 will move. What must hold is that the bot clears *something*
    // and does so deterministically.
    expect(a.clearTimes.length).toBeGreaterThan(0);
    expect(diveReport(4471, 3)).toEqual(a);
  });

  it('starts from a scenario and records only the fights it plays (D63)', () => {
    // From the last boss's batch: one clear, then the win. A report that
    // started from the top instead, or logged a zero-second "clear" at tick
    // one because the scenario's batchIndex did not start at 0, fails one of
    // the two.
    const r = diveReport(4471, 2, 300, true, 'last-batch');
    expect(r.clearTimes.length).toBe(1);
    expect(r.won).toBe(true);
  });
});

// The dev flags: `&immortal` and `&damage=<n>` in the URL. main.js reads
// the URL; what the flags *do* is game state, so it is checked here.
describe('dev flags', () => {
  // hp after two seconds with a bulwark parked on the player.
  function hpUnderBulwark(immortal) {
    const g = loadGame();
    g.immortal = immortal;
    g.reset(1);
    g.queuePaused = true;
    g.placeEnemy('bulwark', g.player.x, g.player.y);
    for (let i = 0, n = ticks(g, 2); i < n; i++) g.update(g.FIXED_DT);
    return g.player.hp;
  }

  it('&immortal: an enemy on the player does no harm', () => {
    expect(hpUnderBulwark(false)).toBeLessThan(3);   // the control: it does hurt
    expect(hpUnderBulwark(true)).toBe(3);
  });

  it('&damage: replaces shot damage from the first dive on, and survives R', () => {
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
  });

  it('decays on a time base, not a frame base (D15)', () => {
    // The rule is Math.pow(x, dt), never a per-frame factor -- a per-frame
    // factor runs 2.4x faster on a 144Hz screen. So one second of shake must
    // decay the same amount however finely that second is sliced.
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
