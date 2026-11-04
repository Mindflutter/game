// The entity docs' number tables (D133), built from the code. `npm run docs`
// writes each between its markers -- `<!-- generated: id -->` and
// `<!-- /generated -->` -- and tests/docs.test.js fails on one that is stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadGame } from './harness.js';

const ROOT = new URL('../docs/', import.meta.url);
const cell = v => v === undefined ? '—' : Array.isArray(v) ? v.join(' / ') : String(v);
const table = (head, rows) => [
  '| ' + head.join(' | ') + ' |',
  '|' + head.map(() => '---').join('|') + '|',
  ...rows.map(r => '| ' + r.map(cell).join(' | ') + ' |'),
].join('\n');
// A table's fields in the order the code first uses them, so a field the code
// gains is a column the doc gains.
export const keysOf = records => [...new Set(records.flatMap(Object.keys))];
const plain = records => keysOf(records)
  .filter(k => records.every(r => r[k] === undefined || typeof r[k] !== 'object' && typeof r[k] !== 'function'));
const r2 = x => Number(x.toFixed(2));
const r3 = x => Number(x.toFixed(3));

// Every table, as { doc, id, text }.
export function docTables(g = loadGame()) {
  // The player a dive starts with: the diver carrying the first weapon, before
  // any tier or attribute -- what every "at max" and "at top" is counted from.
  g.reset(1);
  const START = { ...g.player };
  const kit = ({ name, tiers, cost, requires, ...numbers }) => ({ ...START, ...numbers });
  // What `applies` do to `base`, in order: the stats they moved, by how much
  // ("speed +45") or to what ("speed 395").
  const moved = (applies, by, base = START) => {
    const to = { ...base };
    for (const apply of applies) apply(to);
    return Object.keys(to).filter(k => to[k] !== base[k]).map(k => k + ' ' + (by
      ? (to[k] < base[k] ? '-' : '+') + r3(Math.abs(to[k] - base[k]))
      : r3(to[k]))).join(', ');
  };
  const gear = (doc, records) => {
    const cols = ['name', ...plain(records).filter(k => k !== 'name')];
    const id = doc.slice(0, -3);
    return [
      { doc, id, text: table([...cols, 'at top'], records.map(x =>
        [...cols.map(k => x[k]), moved(x.tiers.map(t => t.apply), false, kit(x))])) },
      { doc, id: id + ':tiers', text: table(['name', 'tier', 'cost', 'adds'], records.flatMap(x => x.tiers.map((t, i) =>
        [x.name, i + 1, t.cost, moved([t.apply], true, kit(x))]))) },
    ];
  };
  // A table per behaviour field -- `lunge`, `spit`, `swing`, ... -- a row per
  // record that has it.
  const behaviours = (doc, records, fields) => fields.map(f => {
    const have = records.filter(x => x[f]);
    const sub = keysOf(have.map(x => x[f]));
    return { doc, id: doc.slice(0, -3) + ':' + f, text: table(['name', ...sub], have.map(x => [x.name, ...sub.map(k => x[f][k])])) };
  });

  const enemyCols = plain(g.ENEMY_TYPES);
  const gradeCols = Object.keys(g.GRADES[0]);
  const modCols = plain(g.MODS);
  const boostCols = plain(g.BOOSTS);
  // `add` and `percent` are numbers, so they are read straight off the record (D86, D125).
  const sign = v => (v < 0 ? '-' : '+') + r3(Math.abs(v));
  const adds = b => [...Object.entries(b.add || {}).map(([k, v]) => k + ' ' + sign(v)),
                     ...Object.entries(b.percent || {}).map(([k, v]) => k + ' ' + sign(v) + '%'),
                     ...(b.pulse ? ['every ' + b.pulse.every + 's, ' + b.pulse.damage + ' to each fish within ' + b.pulse.reach + ' px'] : []),
                     ...(b.spines ? ['every ' + b.spines.every + 's, ' + b.spines.count + ' spines of ' + b.spines.damage + ' over ' + b.spines.range + ' px'] : [])].join(', ');
  const judged = c => ['clear', 'kill', 'dash', 'end', 'strike'].find(k => c[k]);
  const diverCols = Object.keys(g.PLAYER_START);

  const fish = b => b.enemies.map(([n, c]) => n + ' ' + c).join(', ');
  const pools = l => [...new Set(l.stretches.filter(x => !x.escorts).map(x => x.pool))];
  // A pool's target, the batch's threat at grade 1 and at the layer's top:
  // what grading works between.
  let k = -1;
  const targets = new Map(g.LAYERS.flatMap(l => l.stretches.filter(x => !x.escorts)
    .map(x => [x.pool, r2(g.THREAT_START * (g.THREAT_RISE ** (++k + 1) - 1) / (g.THREAT_RISE - 1))])));
  const top = l => g.GRADES.findLastIndex(G => G.from <= g.LAYERS.indexOf(l) + 1) + 1;
  const stretches = l => l.stretches.map(x => x.escorts
    ? x.pool[0].enemies[0][0] + ' with pool ' + (pools(l).indexOf(x.escorts) + 1)
    : x.draw + ' of pool ' + (pools(l).indexOf(x.pool) + 1)).join(' · ');

  return [
    { doc: 'enemies.md', id: 'enemies', text: table(enemyCols, g.ENEMY_TYPES.map(t => enemyCols.map(c => t[c]))) },
    ...behaviours('enemies.md', g.ENEMY_TYPES, keysOf(g.ENEMY_TYPES).filter(c => !enemyCols.includes(c) && c !== 'threat')),
    // A number per grade (D126).
    { doc: 'enemies.md', id: 'enemies:threat', text: table(['name', ...g.GRADES.map((_, i) => 'grade ' + (i + 1))],
      g.ENEMY_TYPES.map(t => [t.name, ...t.threat])) },
    { doc: 'enemies.md', id: 'grades', text: table(['grade', ...gradeCols], g.GRADES.map((G, i) => [i + 1, ...gradeCols.map(c => G[c])])) },
    { doc: 'mods.md', id: 'mods', text: table([...modCols, 'per pick', 'at max'],
      g.MODS.map(m => [...modCols.map(c => m[c]), moved([m.apply], true), (m.max ? moved(Array(m.max).fill(m.apply), false, START) : '—')])) },
    { doc: 'boosts.md', id: 'boosts', text: table([...boostCols, 'adds'],
      g.BOOSTS.map(b => [...boostCols.map(c => b[c]), adds(b)])) },
    { doc: 'challenges.md', id: 'challenges', text: table(['name', 'judged', 'within', 'rungs', 'the first asks', 'the top asks'],
      g.CHALLENGES.map(c => [c.name, judged(c), c.within, c.rungs, c.ask(c.rungs[0]), c.ask(c.rungs.at(-1))])) },
    { doc: 'challenges.md', id: 'attributes', text: table(['name', 'a step adds'], g.ATTRIBUTES.map(a => [a.name, moved([a.apply], true)])) },
    { doc: 'diver.md', id: 'diver', text: table(diverCols, [diverCols.map(c => g.PLAYER_START[c])]) },
    { doc: 'layers.md', id: 'layers', text: table(['name', 'color', 'stretches'], g.LAYERS.map(l => [l.name, l.color, stretches(l)])) },
    { doc: 'layers.md', id: 'layers:bosses', text: table(['fish', 'crowd'], [g.MINI_BOSS, g.BOSS].map(b => [fish(b), b.crowd])) },
    ...g.LAYERS.map((l, i) => ({ doc: 'layers.md', id: 'layers:' + (i + 1), text: table(['pool', 'target', 'fish', 'threat', 'at top'],
      pools(l).flatMap((p, n) => p.map(b => [n + 1, targets.get(p), fish(b), r2(g.batchThreat(b)), r2(g.batchThreat(g.ofGrade(b, top(l))))]))) })),
    ...gear('weapons.md', g.WEAPONS),
    // Its behaviours, as the enemies' -- not the shop's `tiers` and `requires`.
    ...behaviours('weapons.md', g.WEAPONS, keysOf(g.WEAPONS)
      .filter(c => !plain(g.WEAPONS).includes(c) && c !== 'tiers' && c !== 'requires')),
    ...gear('equipment.md', g.EQUIPMENT),
  ].map(t => ({ ...t, doc: 'entities/' + t.doc }));
}

export const MARKED = /<!-- generated: (.+?) -->\n([\s\S]*?)\n<!-- \/generated -->/g;
const read = doc => readFileSync(new URL(doc, ROOT), 'utf8');
// What each doc holds between its markers, by id.
export const marked = doc => new Map([...read(doc).matchAll(MARKED)].map(m => [m[1], m[2]]));

// Writes every table between its markers. A table with no marker in its doc is
// a new one: where it goes is a human's call, so it is reported, not placed.
function write() {
  const missing = [];
  for (const [doc, tables] of Object.entries(Object.groupBy(docTables(), t => t.doc))) {
    const text = read(doc), byId = new Map(tables.map(t => [t.id, t.text]));
    const have = marked(doc);
    missing.push(...tables.filter(t => !have.has(t.id)).map(t => doc + ': no marker for ' + t.id));
    writeFileSync(new URL(doc, ROOT), text.replace(MARKED, (all, id) =>
      byId.has(id) ? `<!-- generated: ${id} -->\n${byId.get(id)}\n<!-- /generated -->` : all));
  }
  if (missing.length) {
    console.error(missing.join('\n') + '\nAdd `<!-- generated: id -->` and `<!-- /generated -->` where each belongs, then run again.');
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) write();
