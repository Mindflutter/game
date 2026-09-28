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
import { readFileSync, readdirSync } from 'node:fs';

// One reader for the whole repo; `read` is the docs/ view of it.
const ROOT = new URL('../', import.meta.url);
const src = f => readFileSync(new URL(f, ROOT), 'utf8');
const read = f => src('docs/' + f);
const docNames = readdirSync(new URL('docs/', ROOT)).filter(f => f.endsWith('.md'));

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
    for (const f of ['foundations.md', 'plan.md', 'roadmap.md', 'decisions.md',
                     'ideas.md', 'design.md', 'changelog.md',
                     'high level design.md']) {
      expect(docNames).toContain(f);
    }
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
    // `NAME value` pairs from the Balance constants section, against
    // `const NAME = value` in content.js. Spaces are ignored: 1 / 120 == 1/120.
    const section = design.slice(design.indexOf('## Balance constants'));
    const content = src('game/content.js');
    const wrong = [];
    for (const [, name, value] of section.split('\n## ')[0].matchAll(/`([A-Z][A-Z_]+) ([^`]+)`/g)) {
      const m = content.match(new RegExp('const ' + name + '\\s*=\\s*([^;]+);'));
      if (!m || m[1].replace(/\s/g, '') !== value.replace(/\s/g, '')) {
        wrong.push(name + ': doc ' + value + ', code ' + (m ? m[1].trim() : 'missing'));
      }
    }
    expect(wrong).toEqual([]);
  });

  it('names no constant that the code does not have', () => {
    // The living docs only; decisions.md and changelog.md are history and may
    // name what a later change removed.
    const words = new Set([...GAME, ...PLATFORM].map(src).join('\n').match(/\w+/g));
    const live = ['design.md', 'roadmap.md', 'plan.md', 'foundations.md'].map(read)
      .concat(src('CLAUDE.md'), src('README.md')).join('\n');
    const gone = [...new Set([...live.matchAll(/`([A-Z][A-Z0-9]*_[A-Z0-9_]+)\b/g)].map(m => m[1]))]
      .filter(name => !words.has(name));
    expect(gone).toEqual([]);
  });
});
