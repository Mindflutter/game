// The boss and the mini-bosses: the lunge, the layer's shape, and what a
// mini-boss's clear pays (D62, D63, D64, D65, D88). The design is in
// docs/specs/2026-09-29-s3-boss-design.md.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, ticks, ride, clearAndWait } from './harness.js';

// Wholly inside the view -- the one place a tell can be read.
const inView = (g, e) => e.x - e.r >= 0 && e.x + e.r <= g.ARENA_W &&
                         e.y - e.r >= g.cameraY - 1e-6 &&
                         e.y + e.r <= g.cameraY + g.ARENA_H + 1e-6;

// 40s of walking: one set of held movement keys per 45 ticks. fast-check
// draws it, so a failure shrinks to the simplest walk that shows it.
const walk = fc.array(fc.subarray(['KeyA', 'KeyD', 'KeyW', 'KeyS']),
                      { minLength: 107, maxLength: 107 });

describe('the lunge (D64)', () => {
  it('never charges without a full wind-up, holds its line through it, and stays in view without jumping', () => {
    fc.assert(fc.property(fc.constantFrom('boss', 'mini-boss'),
                          fc.integer({ min: 0, max: 2 ** 32 - 1 }), walk, (name, seed, steps) => {
      // One lunger alone, and a player kept alive (&immortal) who walks and
      // never fires, so the fight lasts as long as the test wants.
      const g = loadGame();
      g.immortal = true;
      g.reset(seed);
      g.queuePaused = true;
      g.spawnBatch({ enemies: [[name, 1]] });
      const L = g.enemyType(name).lunge;
      // Recorded per tick and asserted once per run: an expect() on every tick
      // was two thirds of this test's cost. Each entry names its tick.
      const bad = [];
      let prev = 'chase', run = 0, aim = null, charges = 0, maxStep = 0;
      for (let i = 0, n = ticks(g, 40); i < n; i++) {
        if (i % 45 === 0) {
          g.keys.clear();
          for (const k of steps[i / 45]) g.keys.add(k);
        }
        const bx = g.enemies[0].x, by = g.enemies[0].y;
        g.update(g.FIXED_DT);
        const e = g.enemies[0];
        // No jumps: a lunger that wound up outside the view and was clamped
        // back in would teleport, and its tell would start off-screen.
        maxStep = Math.max(maxStep, Math.hypot(e.x - bx, e.y - by));
        if (e.phase !== prev) {                    // a step just began
          if (e.phase === 'charge') {
            charges++;
            if (prev !== 'windup' || run * g.FIXED_DT < L.windup - 1e-9) bad.push(['early charge', i]);
          }
          if (e.phase === 'windup') aim = [e.aimX, e.aimY];
          prev = e.phase;
          run = 0;
        }
        run++;
        if (e.phase === 'windup' && (e.aimX !== aim[0] || e.aimY !== aim[1])) bad.push(['line turned', i]);
        if (e.phase !== 'chase' && !inView(g, e)) bad.push(['out of view', i]);
      }
      expect(bad.slice(0, 3)).toEqual([]);          // the first three are enough to read
      expect(maxStep).toBeLessThanOrEqual(L.speed * g.FIXED_DT + 1e-9);
      expect(charges).toBeGreaterThan(0);          // or the rest is vacuous
    }), { numRuns: 20 });
  });

  it('teaches before it tests: the mini-boss winds up longer, and is weaker (D65)', () => {
    const g = loadGame();
    const mini = g.enemyType('mini-boss'), boss = g.enemyType('boss');
    expect(mini.lunge.windup).toBeGreaterThan(boss.lunge.windup);
    expect(mini.hp).toBeLessThan(boss.hp);
  });

  it('brings the boss up from below the view, centred', () => {
    const g = loadGame();
    g.reset(1);
    g.spawnBatch({ enemies: [['boss', 1]] });
    const boss = g.enemies[0];
    expect(boss.x).toBe(g.ARENA_W / 2);
    expect(boss.y - boss.r).toBeGreaterThan(g.cameraY + g.ARENA_H);
  });
});

describe('the layer (D62, D65)', () => {
  const has = name => e => e.batch.enemies.some(([n]) => n === name);

  it('ends every layer on the boss, alone, with two lone mini-bosses along the way', () => {
    // Over a drawn dive (D71), layer by layer: the fixed places hold whatever
    // the pools drew around them.
    const g = loadGame();
    g.reset(1);
    g.LAYERS.forEach((_, l) => {
      const layer = g.plan.filter(e => e.layer === l);
      expect(layer.at(-1).batch.enemies).toEqual([['boss', 1]]);
      expect(layer.at(-1).end).toBe(true);
      expect(layer.filter(has('mini-boss')).map(e => e.batch.enemies))
        .toEqual([[['mini-boss', 1]], [['mini-boss', 1]]]);
      expect(layer.slice(0, -1).some(has('boss'))).toBe(false);
      expect(layer.slice(0, -1).some(e => e.end)).toBe(false);
    });
  });

  it('carries no mod on a mini-boss, and opens no cards when it dies (D88)', () => {
    const g = loadGame();
    expect(g.applyScenario('mini-boss', 1)).toBe(true);
    ride(g);
    expect(g.enemies.map(e => e.maxHp)).toEqual([g.enemyType('mini-boss').hp]);
    expect(clearAndWait(g, 1)).toBe('playing');
    const held = Object.values(g.modCounts).reduce((a, b) => a + b, 0);
    expect(held + g.drops.filter(d => d.mod).length).toBe(0);
  });
});
