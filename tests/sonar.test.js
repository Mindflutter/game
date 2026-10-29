// Sonar (S10): a play recorded through the recorder replays to the same game,
// tick for tick -- the property every reading of a play-test stands on.
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { loadReplay } from './harness.js';

const MOVES = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
// The recorder's own `let`s, which the harness does not bridge.
const own = (g, name) => vm.runInContext(name, g);

// What a played game is, the frame loop's banking aside: replay runs whole
// ticks, so `accumulator` is the one number it never has.
const state = g => JSON.stringify({ ...JSON.parse(g.saveText()), dive: g.diveLive && { ...g.snapshot(), accumulator: 0 },
                                    screen: g.screen, probe: own(g, 'sonarProbe()') });

// A human-ish player: frames of uneven length, many running no tick or
// several, the mouse moving, keys held and let go, clicks, Enter to get
// through the menus and, now and then, a pause and a resume.
function record(start, frames, seed) {
  const g = loadReplay();
  let r = seed;
  const rand = () => ((r = (r * 1103515245 + 12345) >>> 0) / 0x100000000);
  const press = code => { g.keys.add(code); g.justPressed.add(code); };
  g.sonarRecorder(start);
  if (g.debugSetup) press('KeyR');
  let played = 0;
  for (let i = 0; i < frames; i++) {
    if (rand() < 0.5) { g.aim.x = Math.round(rand() * g.ARENA_W * 256) / 256; g.aim.y = Math.round(rand() * g.ARENA_H * 256) / 256; }
    if (rand() < 0.05) { const k = MOVES[Math.floor(rand() * 4)]; g.keys.has(k) ? g.keys.delete(k) : press(k); }
    if (rand() < 0.1) g.keys.has('Mouse0') ? g.keys.delete('Mouse0') : press('Mouse0');
    if (g.screen !== 'playing' && rand() < 0.05) { press('Enter'); g.keys.delete('Enter'); }
    if (g.screen === 'playing' && rand() < 0.003) { press('Escape'); g.keys.delete('Escape'); }
    if (g.debugSetup && rand() < 0.002) { press('KeyR'); g.keys.delete('KeyR'); }
    g.sonarFrame(rand() * 0.035);
    if (g.screen === 'playing') played += 1;
  }
  return { g, lines: own(g, 'sonar').out.map(l => JSON.parse(l)), played };
}

function replay(lines, at) {
  const g = loadReplay();
  return { g, offs: g.sonarReplay(lines, at) };
}

describe('Sonar replays a recorded play exactly (S10)', () => {
  const fresh = record({ save: null }, 6000, 1), debug = record({ debug: 'L1,G2,S4471,darter6', seed: 9 }, 6000, 2);

  it.each([
    ['a fresh save, through the menus to a dive of drawn seed', fresh],
    ['a debug setup, restarted with R', debug],
  ])('%s', (_, { g, lines, played }) => {
    expect(played).toBeGreaterThan(500);
    const { g: again, offs } = replay(lines);
    expect(offs).toEqual([]);
    expect(state(again)).toBe(state(g));
  });

  it('a dive launched from the menus draws its seed at random, and the replay gets it back', () => {
    expect(fresh.lines.some(l => l.s?.length)).toBe(true);
  });

  it('a press in a frame that ran no tick reaches the next frame that did', () => {
    const { g, lines } = fresh;
    expect(lines.slice(1).every(l => l.n > 0)).toBe(true);
    // Dropping the presses breaks the replay: they are what it stands on.
    const bare = lines.map((l, i) => (i ? { ...l, j: undefined } : l));
    expect(state(replay(bare).g)).not.toBe(state(g));
  });

  it('a replay gone off its recording names the tick', () => {
    const { lines } = debug;
    const k = lines.findIndex((l, i) => i > 200 && l.c?.endsWith('playing'));
    const moved = lines.map((l, i) => (i === k - 5 ? { ...l, k: ['KeyD', 'KeyS'] } : l));
    const sum = n => lines.slice(1, n + 1).reduce((a, l) => a + l.n, 0);
    const [off] = replay(moved).offs;
    expect(off.tick).toBeGreaterThanOrEqual(sum(k - 5));
    expect(off.tick).toBeLessThanOrEqual(sum(k));
    expect(off.screen).toBe('playing');
  });

  it("the debug screen's drawn line leaves the randomness as it was", () => {
    const g = loadReplay();
    g.openDebug('L1,G2,S4471,darter6', 9);
    const was = [g.rngState, g.currentSeed];
    g.gateLine();
    expect([g.rngState, g.currentSeed]).toEqual(was);
  });

  it('the limit only draws: a recorded play replays the same with its limit met', () => {
    const { g } = debug;
    Object.assign(own(g, 'sonar'), { what: 'secs', n: 1 });
    const before = state(g);
    g.sonarProgress(0);
    expect(own(g, 'sonar').done).toBe(true);
    expect(own(g, 'sonarTag')).toContain('done');
    expect(state(g)).toBe(before);
  });
});
