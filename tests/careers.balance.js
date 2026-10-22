// The pillars a career is held to (foundations.md -> Pillars): a fresh save
// diving and spending until the win, one a seed (D127).
import { describe, it, expect, beforeAll } from 'vitest';
import { report, SEEDS } from './measure.js';

let runs;
beforeAll(async () => { runs = (await report()).map(r => r.career); }, 30 * 60e3);

describe('a career', () => {
  it('wins', () => {
    expect(runs.map(c => c.log.at(-1).end)).toEqual(SEEDS.map(() => 'won'));
  });

  it('makes its first purchase within three dives (Addictive, not grindy)', () => {
    expect(runs.map(c => c.firstBuy).filter(n => n === null || n > 3)).toEqual([]);
  });
});
