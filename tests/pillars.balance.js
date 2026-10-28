// The pillars a batch is held to (foundations.md -> Pillars), measured by the
// diver bot at the kit each gate is first met with (D127). Slow, so
// `npm run balance`, never `npm test`.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame } from './harness.js';
import { pillarRows, SEEDS } from './measure.js';

let rows;
beforeAll(async () => { rows = await pillarRows(); }, 30 * 60e3);
const named = r => `layer ${r.l + 1}, stretch ${r.i + 1}, #${r.bi + 1}: ${r.fish}`;

describe('every batch at the kit it is first met with', () => {
  it('measures every gate on every seed', () => {
    expect(rows.filter(r => r.kits < SEEDS.length).map(named)).toEqual([]);
  });

  it('is cleared on most seeds (Nothing unbeatable)', () => {
    expect(rows.filter(r => r.lost > r.kits / 2).map(named)).toEqual([]);
  });

  it('is cleared standing on no more than one seed in ten, past the opening (Nothing trivial)', () => {
    // One in ten is Claude's pick: the standing bot that clears one comes out
    // with a sliver of HP, luck rather than a way to play. The opening is the
    // stretches holding only the types the dive opens with.
    const g = loadGame(), types = s => s.pool.flatMap(b => b.enemies.map(([n]) => n));
    const first = new Set(types(g.LAYERS[0].stretches[0]));
    const opening = r => types(g.LAYERS[r.l].stretches[r.i]).every(n => first.has(n));
    expect(rows.filter(r => !opening(r) && r.stood > r.kits / 10).map(named)).toEqual([]);
  });

  it('takes seconds at the start of a dive and over a minute at its deepest (D137)', () => {
    // The bot's clock, which runs ahead of a player's: 15s and 60s are
    // Claude's picks for its share of the 10-15s start and the ~90s end.
    const ordinary = rows.filter(r => r.i % 2 === 0);
    const at = (l, i) => ordinary.filter(r => r.l === l && r.i === i).reduce((a, r, _, rs) => a + r.time / rs.length, 0);
    const last = ordinary.at(-1);
    expect(at(0, 0)).toBeLessThan(15);
    expect(at(last.l, last.i)).toBeGreaterThan(30);   // about 45s (D162)
  });

  it('costs more hearts deeper, overall rather than every step (D79)', () => {
    const layers = Object.values(Object.groupBy(rows, r => r.l)).map(rs => rs.reduce((a, r) => a + r.hearts, 0) / rs.length);
    expect(layers.at(-1)).toBeGreaterThan(layers[0]);
    // A dip is allowed, not a fall: each layer costs at least 0.9 of the one above.
    expect(layers.every((h, l) => h >= 0.9 * (layers[l - 1] ?? 0))).toBe(true);
  });
});
