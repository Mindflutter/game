// Checks on `docs/` itself.
//
// Everything else in this suite checks the game. Nothing checked the docs, and
// on 2026-09-28 three separate corruptions had gone unnoticed: an idea of
// Igor's deleted outright by a bad splice, a decision that never got its
// changelog entry although it was reported as written, and decisions cited by
// bare number so a reader could not tell what they said.
//
// The consistency sweep in CLAUDE.md is supposed to prevent all of this, but a
// sweep is a habit and habits fail quietly. These are the parts of it a machine
// can do.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { loadGame } from './harness.js';

// One reader for the whole repo; `read` is the docs/ view of it.
const ROOT = new URL('../', import.meta.url);
const src = f => readFileSync(new URL(f, ROOT), 'utf8');
const read = f => src('docs/' + f);
// Every doc, `entities/` included, except `superpowers/`: its specs and plans
// are a log of past stages, kept as they were written.
const docNames = readdirSync(new URL('docs/', ROOT), { recursive: true })
  .filter(f => f.endsWith('.md') && !f.startsWith('superpowers/'));
const ENTITY_DOCS = docNames.filter(f => f.startsWith('entities/'));
// The docs that describe the code, and so may only quote it as it is. Not
// ideas.md, nor the logs -- decisions.md and changelog.md are history and may
// name what a later change removed.
const DESCRIBE_CODE = ['design.md', 'roadmap.md', 'plan.md', 'foundations.md',
                       'README.md', ...ENTITY_DOCS];

const decisions = read('decisions.md');

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
    // D56 was written, reported as documented, and had no changelog entry at
    // all -- a string replace that silently matched nothing. The newest
    // decision is the one most likely to be missing its entry.
    const newest = 'D' + Math.max(...[...declared.keys()].map(d => +d.slice(1)));
    expect(read('changelog.md')).toContain(newest);
  });

  it('keeps the docs CLAUDE.md tells the reader to open', () => {
    // The read order is load-bearing: a cold session is told to open these in
    // sequence, so a renamed or deleted file sends it somewhere that is not
    // there. `high level design.md` is Igor's frozen source, never edited.
    // The map in docs/README.md is held to the same rule, and the other way
    // too: a doc it does not name is a doc nobody looks up.
    const named = text => [...text.matchAll(/`([^`\n]+\.md)`/g)].map(m => m[1]);
    const map = named(read('README.md'));
    const missing = [...map, ...named(src('CLAUDE.md'))]
      .filter(f => !docNames.includes(f) && !existsSync(new URL(f, ROOT)));
    expect(missing).toEqual([]);
    expect(docNames.filter(f => f !== 'README.md' && !map.includes(f))).toEqual([]);
  });
});

// The numbers docs quote about the code, regenerated rather than trusted.
// CLAUDE.md says "every number the docs quote about the code is regenerable";
// these regenerate them. Added 2026-09-28 after a sweep that only grepped for
// what each change was *expected* to break left a stale count behind.
// The same files CLAUDE.md's `wc -l game/*.js platform/*.js main.js` counts,
// read from the directories so a new file cannot be silently left out.
const lineCount = files => files.reduce((n, f) => n + src(f).split('\n').length - 1, 0);
const js = dir => readdirSync(new URL(dir + '/', ROOT)).filter(f => f.endsWith('.js')).map(f => dir + '/' + f);
const GAME = js('game');
const PLATFORM = [...js('platform'), 'main.js'];

describe('numbers the docs quote about the code', () => {
  const design = read('design.md');

  it('quotes the real line counts and platform share', () => {
    const game = lineCount(GAME), platform = lineCount(PLATFORM);
    expect(design).toContain('── ' + game + ' lines. Survives the port.');
    expect(design).toContain('── ' + platform + ' lines. Rewritten on the port.');
    const share = Math.round(100 * platform / (game + platform));
    expect(design).toContain('The platform share is **' + share + '%** (' + platform +
                             ' of ' + (game + platform) + ')');
  });

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
    // The README's table is where Igor finds the URLs; it had lost `layer-2`
    // a stage after the scenario was added.
    const readme = src('README.md');
    expect(Object.keys(loadGame().SCENARIOS).filter(n => !readme.includes('?dev=' + n + '&')))
      .toEqual([]);
  });

  it('names no constant that the code does not have', () => {
    // The living docs only; decisions.md and changelog.md are history and may
    // name what a later change removed.
    const words = new Set([...GAME, ...PLATFORM].map(src).join('\n').match(/\w+/g));
    const live = DESCRIBE_CODE.map(read)
      .concat(src('CLAUDE.md'), src('README.md')).join('\n');
    const gone = [...new Set([...live.matchAll(/`([A-Z][A-Z0-9]*_[A-Z0-9_]+)\b/g)].map(m => m[1]))]
      .filter(name => !words.has(name));
    expect(gone).toEqual([]);
  });
});

// ---------- the entity docs ----------
// One doc per kind of entity in docs/entities/ (D81): every item, its numbers
// and what it is for. The numbers are copies of game/content.js, and a copy is
// a number that will disagree with itself -- so every table is rebuilt here
// from the code and must appear in its doc verbatim. When one fails, the table
// it wanted is in the diff: paste it in.
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
  const kit = ({ name, tiers, ...numbers }) => ({ ...START, ...numbers });
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
  // A piece of gear's roster and its tiers, one row a tier.
  const gear = records => {
    const cols = ['name', ...plain(records).filter(k => k !== 'name')];
    return [
      table([...cols, 'at top'], records.map(x =>
        [...cols.map(k => x[k]), moved(x.tiers.map(t => t.apply), false, kit(x))])),
      table(['name', 'tier', 'cost', 'adds'], records.flatMap(x => x.tiers.map((t, i) =>
        [x.name, i + 1, t.cost, moved([t.apply], true, kit(x))]))),
    ];
  };

  it('lists every enemy type at its real numbers', () => {
    const cols = plain(g.ENEMY_TYPES);
    expect(doc('enemies.md')).toContain(table(cols, g.ENEMY_TYPES.map(t => cols.map(k => t[k]))));
    const lungers = g.ENEMY_TYPES.filter(t => t.lunge);
    const timing = keysOf(lungers.map(t => t.lunge));
    expect(doc('enemies.md')).toContain(table(['name', ...timing],
      lungers.map(t => [t.name, ...timing.map(k => t.lunge[k])])));
  });

  it('lists every mod with what it does and its card text', () => {
    const cols = plain(g.MODS);
    expect(doc('mods.md')).toContain(table([...cols, 'per pick', 'at max'],
      g.MODS.map(m => [...cols.map(k => m[k]), moved([m.apply], true), moved(Array(m.max).fill(m.apply))])));
  });

  it('lists every boost with what it adds, for how long, and its line', () => {
    // `add` is numbers, so it is read straight off the record (D86).
    const cols = plain(g.BOOSTS);
    const adds = b => Object.entries(b.add)
      .map(([k, v]) => k + ' ' + (v < 0 ? '-' : '+') + r3(Math.abs(v))).join(', ');
    expect(doc('boosts.md')).toContain(table([...cols, 'adds'],
      g.BOOSTS.map(b => [...cols.map(k => b[k]), adds(b)])));
  });

  it('lists every weapon and piece of equipment at its real numbers and tiers', () => {
    for (const t of gear(g.WEAPONS)) expect(doc('weapons.md')).toContain(t);
    for (const t of gear(g.EQUIPMENT)) expect(doc('equipment.md')).toContain(t);
  });

  it('documents every field the code has, and only those or reserved ones', () => {
    // The record's shape is what S5 (content) writes its content on, so a
    // field nobody documented -- or a documented one the code dropped -- is
    // the shape drifting. A field the code does not have yet is allowed only
    // marked **Reserved**, for the stage that adds it. Every piece of gear has
    // a name and tiers, which is all the shop reads -- equipment too, before
    // any exists.
    const shapes = {
      'enemies.md': keysOf(g.ENEMY_TYPES),
      'mods.md': keysOf(g.MODS),
      'boosts.md': keysOf(g.BOOSTS),
      'weapons.md': keysOf(g.WEAPONS),
      'equipment.md': [...new Set(['name', 'tiers', ...keysOf(g.EQUIPMENT)])],
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
    // Any other heading has to be one of the layout's own.
    const LAYOUT = ['Roster', 'Fields', 'Behaviours', 'Adding one'];
    const items = { 'enemies.md': g.ENEMY_TYPES, 'mods.md': g.MODS, 'boosts.md': g.BOOSTS,
                    'weapons.md': g.WEAPONS, 'equipment.md': g.EQUIPMENT };
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
