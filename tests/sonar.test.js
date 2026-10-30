// Sonar (S10): a play recorded through the recorder replays to the same game,
// tick for tick -- the property every reading of a play-test stands on.
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { loadReplay } from './harness.js';
import { read } from './sonar.js';
import PLAYTESTS from './playtests.json' with { type: 'json' };

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
const human = seed => {
  let r = seed;
  const rand = () => ((r = (r * 1103515245 + 12345) >>> 0) / 0x100000000);
  return (g, i, press) => {
    if (rand() < 0.5) { g.aim.x = Math.round(rand() * g.ARENA_W * 256) / 256; g.aim.y = Math.round(rand() * g.ARENA_H * 256) / 256; }
    if (rand() < 0.05) { const k = MOVES[Math.floor(rand() * 4)]; g.keys.has(k) ? g.keys.delete(k) : press(k); }
    if (rand() < 0.1) g.keys.has('Mouse0') ? g.keys.delete('Mouse0') : press('Mouse0');
    if (g.screen !== 'playing' && rand() < 0.05) { press('Enter'); g.keys.delete('Enter'); }
    if (g.screen === 'playing' && rand() < 0.003) { press('Escape'); g.keys.delete('Escape'); }
    if (g.debugSetup && rand() < 0.002) { press('KeyR'); g.keys.delete('KeyR'); }
    return rand() * 0.035;
  };
};

// `drive(g, i, press)` sets frame i's input and returns its length in seconds.
function record(start, frames, drive) {
  const g = loadReplay();
  // A dive's seed, the game's one unseeded draw, pinned so every run records
  // the same play; the replay's stays free, so it must take the recorded one.
  let q = 1;
  own(g, 'Math').random = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 0x100000000);
  const press = code => { g.keys.add(code); g.justPressed.add(code); };
  g.sonarRecorder(start);
  if (g.debugSetup) press('KeyR');
  let played = 0;
  for (let i = 0; i < frames; i++) {
    g.sonarFrame(drive(g, i, press));
    if (g.screen === 'playing') played += 1;
  }
  return { g, lines: own(g, 'sonar').out.map(l => JSON.parse(l)), played };
}

function replay(lines, at) {
  const g = loadReplay();
  return { g, offs: g.sonarReplay(lines, at) };
}

describe('Sonar replays a recorded play exactly (S10)', () => {
  const fresh = record({ save: null }, 6000, human(1)), debug = record({ debug: 'L1,G2,S4471,darter6', seed: 9 }, 6000, human(2));

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

describe('Sonar reads a play back (S10)', () => {
  // The mini-boss's gate, never firing, Space twice a second and the diver
  // swimming side to side: some presses dash, the rest come too soon, and
  // every fish that dies is the dash's.
  const { lines } = record({ debug: 'L1,G2,S4471,Impact3,immortal', seed: 9 }, 2400, (g, i, press) => {
    if (i % 60 === 0) { g.keys.delete('KeyA'); g.keys.delete('KeyD'); press(i % 120 ? 'KeyA' : 'KeyD'); }
    if (i % 30 === 0) press('Space');
    else g.keys.delete('Space');
    return 1 / 60;
  });
  const { events } = read(loadReplay(), lines, '1');
  const count = kind => events.filter(e => e.kind === kind).length;
  const presses = lines.slice(1).filter(l => l.j?.includes('Space')).length;

  it('a press of the dash either dashes or comes too soon, and the two add up to the presses in play', () => {
    expect(count('dash')).toBeGreaterThan(0);
    expect(count('early-dash')).toBeGreaterThan(0);
    // The first press is R's frame, on the setup screen: no dash there to start.
    expect(count('dash') + count('early-dash')).toBe(presses - 1);
  });

  it('a fish the dash killed is marked so', () => {
    const kills = events.filter(e => e.kind === 'kill');
    expect(kills.length).toBeGreaterThan(0);
    expect(kills.every(e => e.dash)).toBe(true);
  });

  it("the mini-boss's lunges are read as they start", () => {
    expect(count('lunge')).toBeGreaterThan(0);
  });

  it("a dash is its own dive's: the next dive's shots, numbered afresh, are not taken for it", () => {
    // Dashes that wound nothing for 30s, R, then the Gun held down at the nearest fish.
    const { lines: two } = record({ debug: 'L1,G1,S4471,Gun0,drifter30,Reflex3,immortal', seed: 9 }, 3600, (g, i, press) => {
      if (i < 1800) i % 30 ? g.keys.delete('Space') : press('Space');
      else if (i === 1800) press('KeyR');
      else if (i === 1801) g.keys.delete('KeyR');
      else if (i === 1830) press('Mouse0');   // the Gun fires once the button was up in play
      const p = g.player, [e] = (g.enemies || []).filter(e => !e.gone)
        .sort((a, b) => (a.x - p.x) ** 2 + (a.y - p.y) ** 2 - (b.x - p.x) ** 2 - (b.y - p.y) ** 2);
      if (e) [g.aim.x, g.aim.y] = [e.x, e.y - g.cameraY];
      return 1 / 60;
    });
    const { events: read2 } = read(loadReplay(), two, '1');
    const kills = read2.filter(e => e.kind === 'kill');
    expect(read2.filter(e => e.kind === 'dash').length).toBeGreaterThan(10);
    expect(kills.length).toBeGreaterThan(0);
    expect(kills.filter(e => e.dash)).toEqual([]);
  });
});

describe('the play-tests (D165 (play-tests in one file))', () => {
  it.each(Object.entries(PLAYTESTS))('%s has its purpose, start and play, and a setup the game reads whole', (_, t) => {
    expect(t.purpose && t.play && t.start).toBeTruthy();
    if (!('debug' in t.start)) return;
    const g = loadReplay();
    g.openDebug(t.start.debug);
    expect(g.debugSetup.ignored).toEqual([]);
  });
});
