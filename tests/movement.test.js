// Movement in water (D107): the diver's swim eased toward the held keys, its
// facing and the dash along it, and the fish that ease their chase. Designed
// in docs/specs/2026-10-14-movement-and-bites-design.md.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame } from './harness.js';

// A diver alone in the middle of the view, nothing arriving.
function still() {
  const g = loadGame();
  g.reset(1);
  g.queuePaused = true;
  return g;
}
// Holds `codes` for `seconds`, in ticks of `dt`.
const hold = (g, codes, seconds, dt = g.FIXED_DT) => {
  g.keys.clear();
  for (const c of codes) g.keys.add(c);
  for (let i = 0, n = Math.round(seconds / dt); i < n; i++) g.update(dt);
};
// The signed angle from `a` to `b`, the shorter way round.
const gap = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

describe('the diver in water (D107)', () => {
  it('moves on the first tick of a key, but reaches full speed only after its ramp', () => {
    const g = still();
    const x = g.player.x;
    hold(g, ['KeyD'], g.FIXED_DT);
    expect(g.player.x).toBeGreaterThan(x);       // the response, at once
    expect(g.player.vx).toBeLessThan(g.player.speed * 0.2);
    hold(g, ['KeyD'], g.player.ramp);
    expect(g.player.vx).toBeGreaterThan(g.player.speed * 0.95);
  });

  it('glides to a stop when let go, and swings through a reversal', () => {
    const g = still();
    hold(g, ['KeyD'], 1);
    const x = g.player.x;
    hold(g, [], g.FIXED_DT);
    expect(g.player.x).toBeGreaterThan(x);       // still gliding
    hold(g, [], g.player.ramp);
    expect(Math.abs(g.player.vx)).toBeLessThan(g.player.speed * 0.051);
    hold(g, ['KeyD'], 1);
    hold(g, ['KeyA'], g.FIXED_DT);
    expect(g.player.vx).toBeGreaterThan(0);      // still carried right
    hold(g, ['KeyA'], g.player.ramp);
    expect(g.player.vx).toBeLessThan(-g.player.speed * 0.5);
  });

  it('swims the same at any tick length', () => {
    const [a, b] = [still(), still()];
    hold(a, ['KeyD'], 0.2, 1 / 120);
    hold(b, ['KeyD'], 0.2, 1 / 60);
    expect(b.player.vx).toBeCloseTo(a.player.vx, 6);
  });

  it('reaches a raised top speed in the same ramp', () => {
    const g = still();
    g.player.speed += 200;                       // as Rush adds it
    hold(g, ['KeyD'], g.player.ramp);
    expect(g.player.vx).toBeGreaterThan(g.player.speed * 0.95);
  });

  it('banks no speed against a view edge, and leaves it at once', () => {
    const g = still();
    g.player.x = g.player.r + 1;
    hold(g, ['KeyA'], 0.5);
    expect([g.player.x, g.player.vx]).toEqual([g.player.r, 0]);
    hold(g, ['KeyD'], g.FIXED_DT);
    expect(g.player.x).toBeGreaterThan(g.player.r);
  });
});

describe('the facing and the dash (D107)', () => {
  it('starts a dive facing down, turns toward the keys the shorter way, and holds', () => {
    const g = still();
    expect(g.player.facing).toBeCloseTo(Math.PI / 2, 9);
    const step = Math.PI / g.player.turn * g.FIXED_DT;
    hold(g, ['KeyD'], g.FIXED_DT);
    expect(g.player.facing).toBeCloseTo(Math.PI / 2 - step, 9);
    hold(g, ['KeyD'], g.player.turn / 2);
    expect(g.player.facing).toBeCloseTo(0, 9);   // and stops on it
    hold(g, [], 0.5);
    expect(g.player.facing).toBeCloseTo(0, 9);
    g.player.facing = 3;                         // past the left, below it
    hold(g, ['KeyW'], g.FIXED_DT);               // up is the shorter way through the left
    expect(Math.abs(gap(g.player.facing, -Math.PI / 2))).toBeCloseTo(Math.abs(gap(3, -Math.PI / 2)) - step, 9);
  });

  it('dashes along its facing, from a standstill too, and comes out swimming along it', () => {
    const g = still();
    g.player.facing = Math.PI;                   // facing left, nothing held
    const x = g.player.x;
    g.justPressed.add('Space');
    g.update(g.FIXED_DT);
    expect(g.player.dashTime).toBeGreaterThan(0);
    expect(g.player.dashDx).toBeCloseTo(-1, 9);
    expect(g.player.dashDy).toBeCloseTo(0, 9);
    while (g.player.dashTime > 0) g.update(g.FIXED_DT);
    expect(g.player.x).toBeLessThan(x);
    expect(g.player.vx).toBeLessThan(-g.player.speed * 0.8);   // momentum carries
  });
});

describe('fish with a ramp (D107)', () => {
  // A darter swimming at the diver; then the diver sidesteps in one tick.
  const sidestep = ramp => {
    const g = still();
    g.immortal = true;
    g.placeEnemy('darter', g.player.x + 300, g.player.y);
    const e = g.enemies[0];
    if (ramp === undefined) delete e.ramp;
    hold(g, [], 1);
    g.player.y += 150;
    g.update(g.FIXED_DT);
    return Math.abs(gap(Math.atan2(e.vy, e.vx), Math.atan2(g.player.y - e.y, g.player.x - e.x)));
  };

  it('overshoots a sidestep with a ramp, and turns at once without one', () => {
    expect(sidestep('darter')).toBeGreaterThan(0.5);
    expect(sidestep(undefined)).toBeLessThan(1e-6);
  });
});

describe('the save (D107)', () => {
  it('loads a version 4 save at rest, facing down', () => {
    const text = readFileSync(new URL('./fixtures/save-v4.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.player.vx, g.player.vy, g.player.facing]).toEqual([0, 0, Math.PI / 2]);
    expect(g.enemies.every(e => e.vx === 0 && e.vy === 0)).toBe(true);
  });
});
