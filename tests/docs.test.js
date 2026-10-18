// Checks on `docs/` itself: the parts of CLAUDE.md's consistency sweep a
// machine can do. A sweep is a habit, and habits fail quietly.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { loadGame } from './harness.js';

const ROOT = new URL('../', import.meta.url);
const src = f => readFileSync(new URL(f, ROOT), 'utf8');
const read = f => src('docs/' + f);
// Every doc, `entities/` included, except `specs/`: a log of designs, kept as
// they were written.
const docNames = readdirSync(new URL('docs/', ROOT), { recursive: true })
  .filter(f => f.endsWith('.md') && !f.startsWith('specs/'));
const ENTITY_DOCS = docNames.filter(f => f.startsWith('entities/'));
// The docs that describe the code, and so may only quote it as it is. Not
// ideas.md, nor the logs -- decisions.md and changelog.md are history and may
// name what a later change removed.
const DESCRIBE_CODE = ['design.md', 'roadmap.md', 'plan.md', 'foundations.md',
                       'README.md', ...ENTITY_DOCS];

const decisions = read('decisions.md');

// The doc must contain `text`. A failed toContain prints the whole doc, which
// buries the one line that matters; this prints only the text it wanted.
const expectIn = (docText, text) =>
  expect(docText.includes(text), 'missing from the doc:\n' + text).toBe(true);

// `## D49 — One rank per batch, mods at the gate · 2026-09-27`
const HEADING = /^## (D\d+) — (.+?)(?: ·|$)/gm;
const declared = new Map(
  [...decisions.matchAll(HEADING)].map(m => [m[1], m[2].trim()]),
);

describe('docs/', () => {
  it('declares every decision with a heading and a name', () => {
    // A bare `## D50` gives citations nothing to name, which is what makes
    // "D35" unreadable in prose.
    const malformed = decisions
      .split('\n')
      .filter(l => /^## D\d+/.test(l) && !/^## D\d+ — .+/.test(l));
    expect(malformed).toEqual([]);
    expect(declared.size).toBeGreaterThan(50);
  });

  it('numbers decisions uniquely and without gaps', () => {
    const numbers = [...declared.keys()].map(d => +d.slice(1)).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(numbers.length);       // no duplicates
    const missing = [];
    for (let n = numbers[0]; n < numbers[numbers.length - 1]; n++) {
      if (!numbers.includes(n)) missing.push('D' + n);
    }
    expect(missing).toEqual([]);
  });

  it('cites no decision that does not exist', () => {
    // A dangling `D57` means either a typo or an entry that was written and
    // then lost -- both of which have happened.
    const dangling = [];
    for (const file of docNames) {
      const body = read(file);
      for (const m of body.matchAll(/\bD(\d+)\b/g)) {
        const id = 'D' + m[1];
        if (!declared.has(id)) dangling.push(file + ' cites ' + id);
      }
    }
    expect([...new Set(dangling)]).toEqual([]);
  });

  it('gives the newest decision a changelog entry', () => {
    // The newest decision is the one most likely to be missing its entry.
    const newest = 'D' + Math.max(...[...declared.keys()].map(d => +d.slice(1)));
    expectIn(read('changelog.md'), newest);
  });

  it('keeps superpowers switched off for this project (D94)', () => {
    const settings = JSON.parse(src('.claude/settings.json'));
    expect(settings.enabledPlugins?.['superpowers@claude-plugins-official']).toBe(false);
  });

  it('calls a challenge a challenge: never by its old name (D110)', () => {
    // The glossary binds docs and code alike (D32). A decision's name in a
    // citation, a quote, a code span or a path may keep the old word; the
    // prose and the code may not. The logs are history, and keep it too.
    const OLD = /micro-?tasks?/i;
    const prose = text => text.replace(/D\d+ \([^)]*\)/g, '').replace(/`[^`]*`/g, '').replace(/"[^"\n]*"/g, '');
    const said = [...docNames.filter(f => f !== 'decisions.md' && f !== 'changelog.md').map(f => ['docs/' + f, read(f)]),
                  ['CLAUDE.md', src('CLAUDE.md')], ['.claude/skills/abyss-content/SKILL.md', src('.claude/skills/abyss-content/SKILL.md')]]
      .filter(([, text]) => OLD.test(prose(text))).map(([f]) => f);
    const coded = [...js('game'), ...js('platform'), 'main.js', 'checks.js'].filter(f => OLD.test(src(f)));
    expect([...said, ...coded]).toEqual([]);
  });

  it('keeps the docs CLAUDE.md tells the reader to open', () => {
    // A doc CLAUDE.md or the map in docs/README.md names must exist, or a cold
    // session is sent somewhere that is not there -- and the other way: a doc
    // the map does not name is a doc nobody looks up.
    const named = text => [...text.matchAll(/`([^`\n]+\.md)`/g)].map(m => m[1]);
    const map = named(read('README.md'));
    const missing = [...map, ...named(src('CLAUDE.md'))]
      .filter(f => !docNames.includes(f) && !existsSync(new URL(f, ROOT)));
    expect(missing).toEqual([]);
    expect(docNames.filter(f => f !== 'README.md' && !map.includes(f))).toEqual([]);
  });
});

// The numbers docs quote about the code, regenerated rather than trusted. The
// scripts are read from the directories, so a new file cannot be left out.
const js = dir => readdirSync(new URL(dir + '/', ROOT)).filter(f => f.endsWith('.js')).map(f => dir + '/' + f);
const GAME = js('game');
const PLATFORM = [...js('platform'), 'main.js'];

describe('numbers the docs quote about the code', () => {
  const design = read('design.md');


  it('quotes the balance constants at their real values', () => {
    // `NAME value` pairs, wherever a doc that describes the code writes one,
    // against `const NAME = value` in content.js. Spaces are ignored:
    // 1 / 120 == 1/120. Only numbers count as values, so `ARENA_W × ARENA_H`
    // is prose, not a quote.
    const content = src('game/content.js');
    const wrong = [];
    for (const f of DESCRIBE_CODE) {
      for (const [, name, value] of read(f).matchAll(/`([A-Z][A-Z0-9_]+) (-?[\d.]+(?: ?\/ ?[\d.]+)?)`/g)) {
        const m = content.match(new RegExp('const ' + name + '\\s*=\\s*([^;]+);'));
        if (!m || m[1].replace(/\s/g, '') !== value.replace(/\s/g, '')) {
          wrong.push(f + ': ' + name + ': doc ' + value + ', code ' + (m ? m[1].trim() : 'missing'));
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('quotes the diver at the start in full, at its real values', () => {
    // `PLAYER_START` (k v, k v, ...) in design.md: every field, in order. The
    // weapon's numbers are not among them -- they are entities/weapons.md's.
    const section = design.slice(design.indexOf('## Balance constants'));
    const listed = section.match(/`PLAYER_START`[^(]*\(([^)]*)\)/)[1]
      .split(',').map(pair => pair.trim().split(/\s+/));
    const want = Object.entries(loadGame().PLAYER_START).map(([k, v]) => [k, String(v)]);
    expect(listed).toEqual(want);
  });

  it('lists every scenario in the README', () => {
    // The README's table is where the scenario URLs are looked up.
    const readme = src('README.md');
    expect(Object.keys(loadGame().SCENARIOS).filter(n => !readme.includes('?dev=' + n + '&')))
      .toEqual([]);
  });

  it('names no constant that the code does not have', () => {
    const words = new Set([...GAME, ...PLATFORM].map(src).join('\n').match(/\w+/g));
    const live = DESCRIBE_CODE.map(read)
      .concat(src('CLAUDE.md'), src('README.md')).join('\n');
    const gone = [...new Set([...live.matchAll(/`([A-Z][A-Z0-9]*_[A-Z0-9_]+)\b/g)].map(m => m[1]))]
      .filter(name => !words.has(name));
    expect(gone).toEqual([]);
  });
});

// ---------- the entity docs ----------
// The entity docs (D81): every table is rebuilt here from the code and must
// appear in its doc verbatim. When one fails, the table it wanted is in the
// diff: paste it in.
describe('the entity docs', () => {
  const g = loadGame();
  const doc = f => read('entities/' + f);
  const cell = v => v === undefined ? '—' : Array.isArray(v) ? v.join(' / ') : String(v);
  const table = (head, rows) => [
    '| ' + head.join(' | ') + ' |',
    '|' + head.map(() => '---').join('|') + '|',
    ...rows.map(r => '| ' + r.map(cell).join(' | ') + ' |'),
  ].join('\n');
  // A table's fields in the order the code first uses them, so a field the
  // code gains is a column the doc must gain.
  const keysOf = records => [...new Set(records.flatMap(Object.keys))];
  const plain = records => keysOf(records)
    .filter(k => records.every(r => r[k] === undefined || typeof r[k] !== 'object' && typeof r[k] !== 'function'));
  // The player a dive starts with: the diver carrying the first weapon, before
  // any tier or attribute -- what every "at max" and "at top" is counted from.
  g.reset(1);
  const START = { ...g.player };
  // The same player carrying weapon `w` instead -- its numbers, as reset() puts them.
  const kit = ({ name, tiers, cost, requires, ...numbers }) => ({ ...START, ...numbers });
  // What `applies` do to `base`, in order: the stats they moved, by how much
  // ("speed +45") or to what ("speed 395").
  const r3 = x => Number(x.toFixed(3));
  const moved = (applies, by, base = START) => {
    const to = { ...base };
    for (const apply of applies) apply(to);
    return Object.keys(to).filter(k => to[k] !== base[k]).map(k => k + ' ' + (by
      ? (to[k] < base[k] ? '-' : '+') + r3(Math.abs(to[k] - base[k]))
      : r3(to[k]))).join(', ');
  };
  const gear = records => {
    const cols = ['name', ...plain(records).filter(k => k !== 'name')];
    return [
      table([...cols, 'at top'], records.map(x =>
        [...cols.map(k => x[k]), moved(x.tiers.map(t => t.apply), false, kit(x))])),
      table(['name', 'tier', 'cost', 'adds'], records.flatMap(x => x.tiers.map((t, i) =>
        [x.name, i + 1, t.cost, moved([t.apply], true, kit(x))]))),
    ];
  };

  // A table per behaviour field -- `lunge`, `spit`, `swing`, ... -- a row per
  // record that has it.
  const behaviourTables = (records, fields) => fields.map(f => {
    const have = records.filter(x => x[f]);
    const sub = keysOf(have.map(x => x[f]));
    return table(['name', ...sub], have.map(x => [x.name, ...sub.map(k => x[f][k])]));
  });

  it('lists every enemy type at its real numbers', () => {
    const cols = plain(g.ENEMY_TYPES);
    expectIn(doc('enemies.md'), table(cols, g.ENEMY_TYPES.map(t => cols.map(k => t[k]))));
    const behaviours = keysOf(g.ENEMY_TYPES).filter(k => !cols.includes(k));
    for (const t of behaviourTables(g.ENEMY_TYPES, behaviours)) expectIn(doc('enemies.md'), t);
  });

  it('lists every mod with what it does and its card text', () => {
    const cols = plain(g.MODS);
    // A weapon mod is counted on the first weapon it fits (D99), the rest on the Gun.
    const base = m => (m.weapons ? kit(g.WEAPONS.find(w => w.name === m.weapons[0])) : START);
    expectIn(doc('mods.md'), table([...cols, 'per pick', 'at max'],
      g.MODS.map(m => [...cols.map(k => m[k]), moved([m.apply], true), moved(Array(m.max).fill(m.apply), false, base(m))])));
  });

  it('lists every boost with what it adds, for how long, and its line', () => {
    // `add` is numbers, so it is read straight off the record (D86).
    const cols = plain(g.BOOSTS);
    const adds = b => Object.entries(b.add)
      .map(([k, v]) => k + ' ' + (v < 0 ? '-' : '+') + r3(Math.abs(v))).join(', ');
    expectIn(doc('boosts.md'), table([...cols, 'adds'],
      g.BOOSTS.map(b => [...cols.map(k => b[k]), adds(b)])));
  });

  it('lists every challenge -- when it is judged, its rungs, what it asks -- and every attribute (D110)', () => {
    const judged = c => ['clear', 'kill', 'end'].find(k => c[k]);
    expectIn(doc('challenges.md'), table(['name', 'judged', 'within', 'rungs', 'the first asks', 'the top asks'],
      g.CHALLENGES.map(c => [c.name, judged(c), c.within, c.rungs, c.ask(c.rungs[0]), c.ask(c.rungs.at(-1))])));
    expectIn(doc('challenges.md'), table(['name', 'a step adds'],
      g.ATTRIBUTES.map(a => [a.name, moved([a.apply], true)])));
  });

  it('lists every weapon and piece of equipment at its real numbers and tiers', () => {
    for (const t of gear(g.WEAPONS)) expectIn(doc('weapons.md'), t);
    // Its behaviours, as the enemies' -- not the shop's `tiers` and `requires`.
    const behaviours = keysOf(g.WEAPONS)
      .filter(k => !plain(g.WEAPONS).includes(k) && k !== 'tiers' && k !== 'requires');
    for (const t of behaviourTables(g.WEAPONS, behaviours)) expectIn(doc('weapons.md'), t);
    for (const t of gear(g.EQUIPMENT)) expectIn(doc('equipment.md'), t);
  });

  it('documents every field the code has, and only those or reserved ones', () => {
    // A field nobody documented, or a documented one the code dropped, is the
    // shape drifting. One the code lacks yet is allowed marked **Reserved**.
    // Every piece of gear has a name and tiers, equipment too.
    const shapes = {
      'enemies.md': keysOf(g.ENEMY_TYPES),
      'mods.md': keysOf(g.MODS),
      'boosts.md': keysOf(g.BOOSTS),
      'weapons.md': keysOf(g.WEAPONS),
      'equipment.md': [...new Set(['name', 'tiers', ...keysOf(g.EQUIPMENT)])],
      'challenges.md': keysOf([...g.CHALLENGES, ...g.ATTRIBUTES]),
    };
    const wrong = [];
    for (const [file, keys] of Object.entries(shapes)) {
      const fields = doc(file).split('\n## Fields\n')[1].split('\n## ')[0];
      const rows = [...fields.matchAll(/^\| `([^`]+)` \|(.*)$/gm)];
      for (const k of keys) {
        if (!rows.some(r => r[1] === k)) wrong.push(file + ': `' + k + '` is not documented');
      }
      for (const [, k, rest] of rows) {
        if (!keys.includes(k) && !rest.includes('**Reserved**')) wrong.push(file + ': `' + k + '` is not in the code');
      }
    }
    expect(wrong).toEqual([]);
  });

  it('gives every item a section, and no section to an item the code lacks', () => {
    // Any other heading has to be one of the layout's own -- `Points` is the
    // rule the challenges and the attributes share (D110).
    const LAYOUT = ['Roster', 'Fields', 'Behaviours', 'Points', 'Adding one'];
    const items = { 'enemies.md': g.ENEMY_TYPES, 'mods.md': g.MODS, 'boosts.md': g.BOOSTS,
                    'weapons.md': g.WEAPONS, 'equipment.md': g.EQUIPMENT,
                    'challenges.md': [...g.CHALLENGES, ...g.ATTRIBUTES] };
    const wrong = [];
    for (const [file, records] of Object.entries(items)) {
      const names = records.map(r => r.name);
      const heads = [...doc(file).matchAll(/^## (.+)$/gm)].map(m => m[1]);
      for (const n of names) if (!heads.includes(n)) wrong.push(file + ': no section for ' + n);
      for (const h of heads) {
        if (!names.includes(h) && !LAYOUT.includes(h)) wrong.push(file + ': a section for ' + h + ', which the code does not have');
      }
    }
    expect(wrong).toEqual([]);
  });
});
