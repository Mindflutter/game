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

const DOCS = new URL('../docs/', import.meta.url);
const read = f => readFileSync(new URL(f, DOCS), 'utf8');
const docNames = readdirSync(DOCS).filter(f => f.endsWith('.md'));

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
