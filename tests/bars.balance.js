// Every bar of `BARS` (measure.js), measured once by the diver bot and the
// career bot (D128, D199 (the bars, printed)). Slow, so `npm run balance`,
// never `npm test`.
import { it, expect, beforeAll } from 'vitest';
import { barData, BARS } from './measure.js';

let data;
beforeAll(async () => { data = await barData(); }, 30 * 60e3);

for (const b of BARS) it(b.bar, () => expect(b.failing(data)).toEqual([]));
