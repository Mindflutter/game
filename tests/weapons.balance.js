// No weapon strictly dominating another in the mid-to-late game: S6
// (balance)'s exit (D127 (the tuned numbers)), each weapon at matched kits.
import { it, expect } from 'vitest';
import { weaponLayers, dominates } from './measure.js';

it('leaves no weapon better than another at everything over layers 2 and 3', async () => {
  const rows = (await weaponLayers())['layers 2 and 3'];
  const pairs = rows.flatMap(a => rows.filter(b => b !== a && dominates(a, b)).map(b => a.weapon + ' over ' + b.weapon));
  expect(pairs).toEqual([]);
}, 30 * 60e3);
