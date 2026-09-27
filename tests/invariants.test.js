// Property-based invariants: things that must hold for *every* dive, not just
// the handful a scripted check happens to walk through. fast-check generates
// the seeds and the input, and shrinks a failure to its smallest case.
//
// Each one guards a recorded decision (D39). A decision without a check erodes
// silently, and that is what this file is for.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, SEAM } from './harness.js';

const TICK = 1 / 60;

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
      g.aim.y = g.player.y;
    } else {
      g.aim.x = next() * 1280;
      g.aim.y = next() * 800;
    }
    g.update(TICK);
    g.justPressed.clear();
  }
  return g;
}

// Every number the simulation owns, flattened, so one NaN anywhere is caught.
function allNumbers(g) {
  const out = [];
  const take = o => { for (const k in o) if (typeof o[k] === 'number') out.push([k, o[k]]); };
  take(g.player);
  for (const arr of [g.enemies, g.bullets, g.gems, g.particles]) for (const e of arr) take(e);
  out.push(['elapsed', g.elapsed], ['shake', g.shake], ['xp', g.xp], ['kills', g.kills]);
  return out;
}

describe('the port seam', () => {
  it('game/ loads with nothing but the six seam names (D18)', () => {
    // Executable version of design.md's grep. If game/ ever reaches for a
    // seventh name, or any browser API, this throws.
    expect(SEAM).toHaveLength(6);
    const g = loadGame();
    expect(typeof g.update).toBe('function');
    expect(typeof g.reset).toBe('function');
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

  it('keeps the player inside the arena', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const g = dive(seed, 600);
      expect(g.player.x).toBeGreaterThanOrEqual(0);
      expect(g.player.x).toBeLessThanOrEqual(g.ARENA_W);
      expect(g.player.y).toBeGreaterThanOrEqual(0);
      expect(g.player.y).toBeLessThanOrEqual(g.ARENA_H);
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
