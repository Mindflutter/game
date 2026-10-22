// Checks on `docs/` itself: the parts of the consistency sweep a
// machine can do. A sweep is a habit, and habits fail quietly.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { loadGame } from './harness.js';
import { docTables, marked, keysOf } from './doctables.js';

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
                       'code.md', 'working.md', 'README.md', ...ENTITY_DOCS];

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

  it('holds every kind to its alpha count (D124)', () => {
    const g = loadGame();
    const bosses = [g.MINI_BOSS, g.BOSS].flatMap(b => b.enemies.map(([name]) => name));
    const counted = {
      layer: [g.LAYERS.length],
      weapon: [g.WEAPONS.length],
      equipment: [g.EQUIPMENT.length],
      'tier, per weapon and per piece of equipment': [...g.WEAPONS, ...g.EQUIPMENT].map(t => t.tiers.length),
      'fish type, the bosses aside': [g.ENEMY_TYPES.filter(t => !bosses.includes(t.name)).length],
      mod: [g.MODS.length],
      boost: [g.BOOSTS.length],
      attribute: [g.ATTRIBUTES.length],
      challenge: [g.CHALLENGES.length],
    };
    const table = read('foundations.md').split('### Alpha counts')[1].split('\n## ')[0];
    const rows = [...table.matchAll(/^\| ([^|]+?) \| (\d+)(?:–(\d+))? \|/gm)].map(m => [m[1], +m[2], +(m[3] ?? m[2])]);
    expect(rows.map(([kind]) => kind).sort()).toEqual(Object.keys(counted).sort());
    expect(rows.flatMap(([kind, lo, hi]) => counted[kind].filter(n => n < lo || n > hi).map(n => kind + ' ' + n)))
      .toEqual([]);
  });

  it('quotes no count of checks, not even in the logs (D123)', () => {
    // What a change added stays: "15 checks added" is the change, not the suite.
    const COUNT = /(?<![\w.-])\**\d+\**\s+(?:[\w`?]+\s+)?(?:checks|tests)\b(?! added)/;
    const files = [...readdirSync(new URL('docs/', ROOT), { recursive: true })
      .filter(f => f.endsWith('.md')).map(f => 'docs/' + f),
                   'CLAUDE.md', 'README.md', '.claude/skills/abyss-content/SKILL.md'];
    expect(files.filter(f => COUNT.test(src(f)))).toEqual([]);
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
// The entity docs (D81): every number table is built from the code and written
// between its markers by `npm run docs` (D133); a stale one fails here.
describe('the entity docs', () => {
  const g = loadGame();
  const doc = f => read('entities/' + f);
  const tables = docTables(g);

  it('holds every number table as the code makes it -- `npm run docs` writes them', () => {
    const stale = tables.filter(t => marked(t.doc).get(t.id) !== t.text).map(t => t.doc + ': ' + t.id);
    expect(stale).toEqual([]);
  });

  it('marks no table the code does not make', () => {
    const ids = new Set(tables.map(t => t.doc + ': ' + t.id));
    const orphans = ENTITY_DOCS.flatMap(f => [...marked(f).keys()].map(id => f + ': ' + id))
      .filter(x => !ids.has(x));
    expect(orphans).toEqual([]);
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
      'diver.md': keysOf([g.PLAYER_START]),
      'layers.md': keysOf([...g.LAYERS, ...g.LAYERS.flatMap(l => l.stretches),
                           ...g.LAYERS.flatMap(l => l.stretches.flatMap(x => x.pool))]),
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
    // rule the challenges and the attributes share (D110), `Grades` and
    // `Threat` every fish's (D119, D126).
    const LAYOUT = ['Roster', 'Grades', 'Threat', 'Fields', 'Behaviours', 'Points', 'Adding one'];
    const items = { 'enemies.md': g.ENEMY_TYPES, 'mods.md': g.MODS, 'boosts.md': g.BOOSTS,
                    'weapons.md': g.WEAPONS, 'equipment.md': g.EQUIPMENT,
                    'challenges.md': [...g.CHALLENGES, ...g.ATTRIBUTES], 'layers.md': g.LAYERS };
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
