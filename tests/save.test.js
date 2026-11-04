// The save: a dive resumable at any tick, what persists, the settings, and
// every older version migrated.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, die, ride, clearAndWait } from './harness.js';
import { botInput } from './bot.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

describe('the save (D70)', () => {
  // Plays `n` ticks of the bot, kept alive so the dive lasts.
  const play = (g, n) => { for (let i = 0; i < n; i++) { botInput(g); g.update(g.FIXED_DT); } };

  it('restores a dive saved at any tick, which then plays on identically', () => {
    fc.assert(fc.property(seed, fc.integer({ min: 1, max: 4000 }), (s, t) => {
      const a = loadGame();
      a.immortal = true;
      a.reset(s);
      play(a, t);
      a.keys.clear();
      a.justPressed.add('Escape');               // pausing writes the save
      a.update(a.FIXED_DT);
      const b = loadGame();
      b.immortal = true;
      expect(b.loadSave(a.saved)).toBe('');
      b.screen = 'title';
      b.justPressed.add('Enter');                // Continue: straight back in (D90)
      b.update(b.FIXED_DT);
      a.justPressed.add('Escape');               // the one that paused resumes
      a.update(a.FIXED_DT);
      for (const g of [a, b]) play(g, 1500);
      // The whole dive, not a summary: a variable the snapshot forgets shows
      // up here as a difference.
      expect(b.saveText()).toBe(a.saveText());
    }), { numRuns: 12 });
  });

  it('restores a dive saved with a shot in flight and a puffer swelling, which plays on identically', () => {
    const a = loadGame();
    a.reset(7);
    a.queuePaused = true;
    a.placeEnemy('archer', a.player.x + 200, a.player.y);
    a.placeEnemy('puffer', a.player.x - 80, a.player.y);
    a.enemies[0].phaseTime = 2;                  // the archer spits on the first tick
    a.enemies[1].phaseTime = a.enemyType('puffer').fuse.chase;   // the puffer lights at once
    for (let i = 0; i < 30; i++) a.update(a.FIXED_DT);
    expect(a.bullets.some(b => b.evil)).toBe(true);
    expect(a.enemies[1].phase).toBe('fuse');
    const b = loadGame();
    expect(b.loadSave(a.saveText())).toBe('');
    b.screen = b.resumeTo;
    for (const g of [a, b]) for (let i = 0; i < 300; i++) g.update(g.FIXED_DT);
    expect(b.saveText()).toBe(a.saveText());
  });

  it('keeps what persists across a reload, the challenges\' rungs included', () => {
    const g = loadGame();
    g.meta.bank = 123;
    g.meta.gear.Gun = 2;
    g.meta.challenges.untouched = 2;
    g.meta.deepest = 4000;
    g.diveLive = false;
    const h = loadGame();
    expect(h.loadSave(g.saveText())).toBe('');
    expect(h.meta).toEqual(g.meta);
    expect(h.points()).toBe(2);
    expect(h.diveLive).toBe(false);
  });

  it('rejects a save it cannot read, loudly, and changes nothing', () => {
    for (const bad of ['{not json', '{"version":99,"bank":5}', '{"bank":5}', 'null']) {
      const g = loadGame();
      expect(g.loadSave(bad)).not.toBe('');
      expect(g.meta.bank).toBe(0);
    }
    expect(loadGame().loadSave(null)).toBe('');  // nothing saved is not an error
  });

  // Plays on as the bot, and returns every shot seen in flight. A shot with no
  // speed flies off as NaN while the player stays finite, so the shots are
  // what show a save that came back wrong (D83).
  const shotsSeen = (g, n) => {
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      botInput(g);
      g.update(g.FIXED_DT);
      for (const b of g.bullets) seen.add(b);
    }
    return [...seen];
  };
  const finite = b => Number.isFinite(b.x + b.y + b.vx + b.vy + b.r);

  it('loads a save written by the first build of the format, and plays it on', () => {
    // A fixture, committed: every later build must load it or migrate it --
    // "never silently corrupts" is only a check if an old save is on hand.
    const text = readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.meta.bank).toBeGreaterThan(0);
    expect(g.diveLive).toBe(true);
    // v1 kept the shot in constants (D83): its dive comes back with the Gun's
    // shot as it was then, and is written back as the current version.
    expect([g.player.shotSpeed, g.player.shotRadius]).toEqual([430, 4]);
    expect(JSON.parse(g.saveText()).version).toBe(g.freshMeta().version);
    // Its challenges were kept by layer name, then by number (D89), came back
    // as rungs (D109), and meet none of the nine-rung ladders (D152).
    expect(g.meta.challenges).toEqual({});
    expect(g.points()).toBe(0);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(Number.isFinite(g.player.x) && Number.isFinite(g.cameraY)).toBe(true);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('gives a dive saved before bites fish that bite, as their type does now', () => {
    const text = readFileSync(new URL('./fixtures/save-v4.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    const biters = g.enemies.filter(e => g.enemyType(e.name).bite);
    expect(biters.length).toBeGreaterThan(0);
    expect(biters.every(e => e.bite && e.ramp === g.enemyType(e.name).ramp)).toBe(true);
  });

  it('loads a save written by the first build of version 4, and plays it on', () => {
    // Saved mid-batch in layer 2 carrying the Harpoon, with a spit shot in
    // flight, a puffer swelling and the suit's guard up (D95, D97, D100).
    const text = readFileSync(new URL('./fixtures/save-v4.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.meta.carried, g.weaponName, g.guardLeft]).toEqual(['Harpoon', 'Harpoon', 1]);
    expect(g.bullets.some(b => b.evil)).toBe(true);
    expect(g.enemies.some(e => e.phase === 'fuse')).toBe(true);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 5, and plays it on', () => {
    // Saved mid-batch in layer 2: the diver swimming and turned, darters
    // chasing with velocities of their own, a shot in flight (D107).
    const text = readFileSync(new URL('./fixtures/save-v5.json', import.meta.url), 'utf8');
    const saved = JSON.parse(text).dive.player;
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.player.vx, g.player.vy, g.player.facing]).toEqual([saved.vx, saved.vy, saved.facing]);
    expect(g.enemies.filter(e => e.name === 'darter').every(e => e.bite)).toBe(true);   // they bite now (D108)
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 6, and plays it on', () => {
    // Saved mid-batch in layer 3: a fish with its jaws open, eels about, the
    // diver swimming, a shot in flight (D108).
    const text = readFileSync(new URL('./fixtures/save-v6.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.enemies.some(e => e.phase === 'jaws') && g.enemies.some(e => e.touch)).toBe(true);
    // Paid once in layer 3, a rung, then none on the nine-rung ladders (D152);
    // mid-layer and mid-batch, it waits for the next batch's first kill and the
    // next layer's clock (D109).
    expect([g.meta.challenges, g.meta.raised, g.points()]).toEqual([{}, {}, 0]);
    expect([g.tally, g.firstKillAt, g.layerStart]).toEqual([{}, -1, null]);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 7, and plays it on', () => {
    // Saved mid-batch in layer 1 carrying the Harpoon, with streaks running,
    // two recent kills, the batch's first kill taken and the layer's clock on
    // (D109).
    const text = readFileSync(new URL('./fixtures/save-v7.json', import.meta.url), 'utf8');
    const saved = JSON.parse(text).dive;
    const without = (o, k) => Object.fromEntries(Object.entries(o).filter(([x]) => x !== k));   // gone (D152)
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    // Its rungs meet none of the nine-rung ladders, and its steps come back
    // (D152).
    expect([g.meta.challenges, g.meta.raised, g.points()]).toEqual([{}, {}, 0]);
    expect([g.tally, g.killTimes, g.firstKillAt, g.layerStart])
      .toEqual([without(saved.tally, 'footwork'), saved.killTimes, saved.firstKillAt, saved.layerStart]);
    expect(g.muted).toBe(true);                  // its settings too (D113)
    expect(g.incoming).toEqual([]);              // its batch came in whole (D115)
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 8, and plays it on', () => {
    // Saved mid-batch in layer 1, a wave still to come (D115).
    const text = readFileSync(new URL('./fixtures/save-v8.json', import.meta.url), 'utf8');
    const saved = JSON.parse(text).dive;
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.incoming).toEqual(saved.incoming);
    expect(g.incoming.length).toBeGreaterThan(0);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, ticks(g, saved.incoming[0].at - saved.elapsed) + 1);
    expect(g.incoming.length).toBeLessThan(saved.incoming.length);   // and it came
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it("gives a v8 dive's fish and shots in flight a damage of 1, as every hit was then (D118)", () => {
    const saved = JSON.parse(readFileSync(new URL('./fixtures/save-v8.json', import.meta.url), 'utf8'));
    saved.dive.bullets.push({ evil: true, x: 0, y: 0, r: 6, vx: 0, vy: 0, speed: 0,
                              travelled: 0, maxTravel: 100 });
    const g = loadGame();
    const old = ({ damage, knock, ...rest }) => rest;                 // a record as v8 saved it
    const { bite, ...body } = saved.dive.enemies[0];
    // A boss saved mid-fight before its fan (D117), and an eel.
    saved.dive.enemies.push({ ...body, name: 'boss', lunge: old(g.enemyType('boss').lunge) },
                            { ...body, name: 'eel', touch: true, weave: old(g.enemyType('eel').weave) });
    expect(g.loadSave(JSON.stringify(saved))).toBe('');
    const [boss, eel] = g.enemies.slice(-2);
    expect(g.enemies.filter(e => e.bite).map(e => e.bite.damage)).toEqual(Array(g.enemies.length - 2).fill(1));
    expect([boss.lunge.damage, eel.touch.damage]).toEqual([1, 1]);
    expect(eel.weave).toEqual(g.enemyType('eel').weave);             // moves, never hurts
    expect(g.enemies.map(e => Object.keys(e))).toEqual(saved.dive.enemies.map(e => Object.keys(e)));
    expect(g.bullets.filter(b => b.evil).map(b => b.damage)).toEqual([1]);
  });

  it('loads a save written by the first build of version 9, and plays it on', () => {
    // Saved mid-batch in layer 1, an archer's shot in flight carrying its damage (D118).
    const text = readFileSync(new URL('./fixtures/save-v9.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.bullets.filter(b => b.evil).map(b => b.damage)).toEqual([1]);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it("gives a v9 dive's fish their type's knock, an eel's touch its record, a shot in flight none (D122)", () => {
    const saved = JSON.parse(readFileSync(new URL('./fixtures/save-v9.json', import.meta.url), 'utf8'));
    saved.dive.enemies.push({ ...saved.dive.enemies[0], name: 'eel', touch: 2 });    // graded
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(saved))).toBe('');
    const knocks = g.enemies.flatMap(e => Object.entries(e)
      .filter(([, v]) => v && typeof v === 'object' && 'damage' in v).map(([k, v]) => [e.name, k, v.knock]));
    expect(knocks.length).toBeGreaterThan(1);
    expect(knocks).toEqual(knocks.map(([n, k]) => [n, k, g.enemyType(n)[k] ? g.enemyType(n)[k].knock : 0]));
    expect(g.enemies.at(-1).touch).toEqual({ damage: 2, knock: g.enemyType('eel').touch.knock });
    expect(g.bullets.filter(b => b.evil).map(b => b.knock)).toEqual([0]);
    expect(g.player.knock).toBe(g.WEAPONS.find(w => w.name === g.weaponName).knock);
  });

  it('loads a save written by the first build of version 10, and plays it on', () => {
    // Saved mid-fight with every type, an eel's touch a record and an archer's
    // shot in flight carrying its knock (D122).
    const text = readFileSync(new URL('./fixtures/save-v10.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.enemies.find(e => e.touch).touch.knock).toBeGreaterThan(0);
    expect(g.bullets.filter(b => b.evil).map(b => b.knock)).toEqual([g.enemyType('archer').spit.knock]);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it("takes back what a v10 dive's boosts added, gives its diver no splash, and drops every Lance (D125, D208)", () => {
    const load = weaponName => {
      const saved = JSON.parse(readFileSync(new URL('./fixtures/save-v10.json', import.meta.url), 'utf8'));
      const d = saved.dive;
      // Frenzy and Bloom running as they were then: flat, the shot swollen.
      d.player.fireRate += 3;
      d.player.shotRadius += 6;
      Object.assign(d, { weaponName, boosts: [{ name: 'Frenzy', left: 0.5 }, { name: 'Bloom', left: 0.5 }],
                         drops: [{ x: 0, y: d.cameraY, r: 6, boost: 'Lance', life: 3 }] });
      const g = loadGame();
      expect(g.loadSave(JSON.stringify(saved))).toBe('');
      return g;
    };
    expect(load('Harpoon').drops).toEqual([]);
    const g = load('Gun');
    expect(g.drops).toEqual([]);
    expect(g.player.splash).toBe(0);
    g.screen = g.resumeTo;
    g.immortal = true;
    for (let i = 0; i < 120; i++) g.update(g.FIXED_DT);
    expect(g.boosts).toEqual([]);
    expect([g.player.fireRate, g.player.shotRadius]).toEqual([2.5, 4]);
  });

  it('loads a save written by the first build of version 11, and plays it on', () => {
    // Saved mid-batch, Frenzy doubling the Gun and Bloom splashing (D125).
    const text = readFileSync(new URL('./fixtures/save-v11.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.player.fireRate, g.player.splash]).toEqual([5, 24]);
    g.screen = g.resumeTo;
    g.immortal = true;
    for (let i = 0; i < 6 / g.FIXED_DT; i++) g.update(g.FIXED_DT);   // standing, so it touches none
    expect(g.boosts).toEqual([]);
    expect([g.player.fireRate, g.player.splash]).toEqual([2.5, 0]);
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('brings a version 11 save in with its catalogue empty (D146)', () => {
    const text = readFileSync(new URL('./fixtures/save-v11.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.meta.seen, g.met, g.metTime]).toEqual([[], [], 0]);
  });

  it('loads a save written by the first build of version 12, and plays it on', () => {
    // Saved mid-wave, the catalogue's line still up (D146).
    const text = readFileSync(new URL('./fixtures/save-v12.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.meta.seen).toEqual(['drifter', 'darter']);
    expect(g.statusLines().at(-1).text).toBe('CATALOGUE +drifter, darter');
    g.screen = g.resumeTo;
    g.immortal = true;
    for (let i = 0; i < 3 / g.FIXED_DT; i++) g.update(g.FIXED_DT);
    expect(g.statusLines().at(-1).text).not.toContain('CATALOGUE');
    expect(g.meta.seen.slice(0, 2)).toEqual(['drifter', 'darter']);
  });

  it('re-counts a version 12 save\'s rungs on the nine-rung ladders and gives its steps back (D152)', () => {
    const v12 = JSON.parse(readFileSync(new URL('./fixtures/save-v12.json', import.meta.url), 'utf8'));
    Object.assign(v12, { challenges: { untouched: 4, beeline: 2, flurry: 4, swift: 4, footwork: 3 },
                         raised: { Heart: 3 } });
    v12.dive.tally = { untouched: 2, footwork: 5 };
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v12))).toBe('');
    // Ten clean, three glowing first, thirty within two seconds, a layer
    // within four minutes -- slower than the slowest rung now; flurry then
    // cut to its four rungs (D161).
    expect(g.meta.challenges).toEqual({ untouched: 1, beeline: 1, flurry: 4 });
    expect([g.meta.raised, g.points()]).toEqual([{}, 6]);
    expect([g.tally, g.player.dashHits]).toEqual([{ untouched: 2 }, 0]);
  });

  it('loads a save written by the first build of version 13, and plays it on', () => {
    // Saved mid-dash, two fish shoved (D152).
    const text = readFileSync(new URL('./fixtures/save-v13.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.meta.challenges, g.meta.raised, g.player.dashHits]).toEqual([{ untouched: 2, bowling: 1 }, {}, 2]);
    g.screen = g.resumeTo;
    g.immortal = true;
    for (let i = 0; i < 3 / g.FIXED_DT; i++) g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
  });

  it("plays a version 11 dive's plan on ungraded, as it was drawn (D126)", () => {
    const text = readFileSync(new URL('./fixtures/save-v11.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    const next = g.plan[g.batchIndex + 1];
    expect(next.batch.enemies.every(e => e.length === 2)).toBe(true);   // no grade in it
    g.enemies = [];
    g.incoming = [];
    g.spawnBatch(next.batch, next.escorts);
    const fish = [...g.enemies, ...g.incoming];
    expect(fish.length).toBe(next.batch.enemies.reduce((a, [, n]) => a + n, 0));
    for (let i = 0; i < 30 / g.FIXED_DT && g.incoming.length; i++) g.update(g.FIXED_DT);
    expect(g.enemies.every(e => e.grade === 1 && e.maxHp === g.ENEMY_TYPES.find(t => t.name === e.name).hp)).toBe(true);
  });

  it('loads a save written by the first build of version 3, and plays it on', () => {
    // Saved mid-batch with its fish lit and a boost on the floor (D84, D86).
    const text = readFileSync(new URL('./fixtures/save-v3.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.meta.bank).toBeGreaterThan(0);
    expect(g.diveLive).toBe(true);
    expect(g.enemies.filter(e => e.carrier)).toHaveLength(1);
    expect(g.drops.some(d => d.boost)).toBe(true);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 2, and plays it on', () => {
    const text = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.meta.bank).toBeGreaterThan(0);
    expect(g.meta.challenges).toEqual({});          // a rung (D109), none on nine (D152)
    expect(g.diveLive).toBe(true);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });
});

describe('settings, kept with the save (D113)', () => {
  it('keeps the sound off, the volume, the shake and the FPS counter across a reload', () => {
    const g = loadGame();
    Object.assign(g, { muted: true, volume: 0.3, shakeLevel: 0, showFps: true });
    const h = loadGame();
    expect(h.loadSave(g.saveText())).toBe('');
    expect([h.muted, h.volume, h.shakeLevel, h.showFps]).toEqual([true, 0.3, 0, true]);
  });

  it('turns the sound off and on with M, on the title and in play, and writes it at once', () => {
    const g = loadGame();
    g.justPressed.add('KeyM');
    g.update(g.FIXED_DT);
    expect([g.muted, JSON.parse(g.saved).settings.muted]).toEqual([true, true]);
    g.reset(1);
    g.justPressed.add('KeyM');
    g.update(g.FIXED_DT);
    expect([g.muted, JSON.parse(g.saved).settings.muted]).toEqual([false, false]);
  });

  it('writes an option as the Options screen is left', () => {
    const g = loadGame();
    g.openScreen('options');
    g.justPressed.add('ArrowRight');             // the first row, the volume, a notch up
    g.update(g.FIXED_DT);
    g.justPressed.add('Escape');
    g.update(g.FIXED_DT);
    expect(JSON.parse(g.saved).settings.volume).toBe(0.7);
  });

  it('keeps the settings through New game, which erases the progress alone', () => {
    const g = loadGame();
    g.muted = true;
    g.newGame();
    const h = loadGame();
    expect(h.loadSave(g.saved)).toBe('');
    expect(h.muted).toBe(true);
  });

  it('reads a setting it cannot make sense of as its default, and still loads the save', () => {
    const g = loadGame();
    g.meta.bank = 50;
    const save = JSON.parse(g.saveText());
    save.settings = { muted: 'yes', volume: 7, shakeLevel: 99, showFps: 1 };
    const h = loadGame();
    expect(h.loadSave(JSON.stringify(save))).toBe('');
    expect([h.meta.bank, h.muted, h.volume, h.shakeLevel, h.showFps]).toEqual([50, false, 0.6, 2, false]);
  });
});

describe('a v13 save under depth points (D161)', () => {
  it('cuts each ladder to its rungs now, counts a cleared layer\'s gates as depth, and gives the steps back', () => {
    const g = loadGame();
    const v13 = { version: 13, bank: 40, gear: {}, raised: { Heart: 5, Strength: 2 }, deepest: 0, cleared: 1, seen: [],
                  challenges: { untouched: 9, flurry: 3 }, owned: ['Gun'], carried: 'Gun' };
    expect(g.loadSave(JSON.stringify(v13))).toBe('');
    expect([g.meta.challenges, g.meta.raised, g.meta.bank])
      .toEqual([{ untouched: 4, flurry: 3, depth: 6 }, {}, 40]);
  });
});

describe('a dive as Sonar reads it (D164)', () => {
  it('loads a save written by the first build of version 15, and plays it on', () => {
    // Saved at the second gate, the first in the dive's story, a purchase not yet dived on.
    const text = readFileSync(new URL('./fixtures/save-v15.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect([g.story.map(r => r.gate), g.meta.bought]).toEqual([[1, 2], ['Gun 1 (20 gems)']]);
    g.screen = g.resumeTo;
    die(g);
    g.update(g.FIXED_DT);
    expect([g.story.at(-1).died, g.meta.bought]).toEqual([true, []]);
  });

  it('gives a Knife dive of version 15 its arc, where the Mask can widen it (D181)', () => {
    const v15 = JSON.parse(readFileSync(new URL('./fixtures/save-v15.json', import.meta.url), 'utf8'));
    Object.assign(v15.dive, { weaponName: 'Knife' });
    Object.assign(v15.dive.player, { swing: { arc: 60, time: 0.15 }, range: 72, shotRadius: 18 });
    delete v15.dive.player.arc;
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v15))).toBe('');
    expect([g.player.arc, JSON.parse(g.saveText()).version]).toEqual([60, JSON.parse(loadGame().saveText()).version]);
  });

  it('takes back what a v16 dive had of Barbs and Lance, and leaves none of either to find (D208)', () => {
    const v16 = JSON.parse(readFileSync(new URL('./fixtures/save-v15.json', import.meta.url), 'utf8'));
    const d = v16.dive, pierce = d.player.pierce;
    v16.version = 16;
    d.player.pierce += 2 + 4;                    // two Barbs taken, a Lance running
    Object.assign(d, { modCounts: { ...d.modCounts, Barbs: 2 }, choices: ['Fins', 'Barbs', 'Nerve'], choiceIndex: 2,
                       boosts: [{ name: 'Lance', left: 2, add: { pierce: 4 } }, { name: 'Rush', left: 2, add: { speed: 0 } }],
                       drops: [{ x: 0, y: d.cameraY, r: 6, boost: 'Lance', life: 3 }, { x: 0, y: d.cameraY, r: 7, mod: 'Barbs' },
                               { x: 0, y: d.cameraY, r: 6, boost: 'Rush', life: 3 }] });
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v16))).toBe('');
    expect([g.player.pierce, g.modCounts.Barbs, g.choices.map(m => m.name), g.choiceIndex])
      .toEqual([pierce, undefined, ['Fins', 'Nerve'], 1]);
    expect([g.boosts.map(a => a.name), g.drops.map(x => x.boost || x.mod)]).toEqual([['Rush'], ['Rush']]);
  });

  it('gives a v17 dive\'s Reflex and Nerve what they add shrunk, and nothing else moves (D214)', () => {
    const v17 = JSON.parse(readFileSync(new URL('./fixtures/save-v15.json', import.meta.url), 'utf8'));
    const d = v17.dive, cd = d.player.dashCooldown, ifr = d.player.iframes, speed = d.player.speed;
    v17.version = 17;
    Object.assign(d.player, { dashCooldown: cd - 3 * 0.4, iframes: ifr + 2 * 0.3, speed: speed + 45 });
    d.modCounts = { ...d.modCounts, Reflex: 3, Nerve: 2, Fins: 1 };
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v17))).toBe('');
    const S = g.MOD_SHRINK;
    expect(g.player.dashCooldown).toBeCloseTo(cd - 0.4 * (1 + S + S * S), 9);
    expect(g.player.iframes).toBeCloseTo(ifr + 0.3 * (1 + S), 9);
    expect(g.player.speed).toBe(speed + 45);
  });

  it('keeps no career in the save: a v14 save drops its log (D177)', () => {
    const g = loadGame();
    const v14 = { version: 14, bank: 40, gear: {}, raised: {}, challenges: {}, deepest: 0, cleared: 0, seen: [],
                  log: [{ end: 'dead', seed: 7 }], bought: [], owned: ['Gun'], carried: 'Gun' };
    expect(g.loadSave(JSON.stringify(v14))).toBe('');
    expect(['log' in g.meta, 'log' in JSON.parse(g.saveText()), g.meta.bank]).toEqual([false, false, 40]);
    g.reset(7);
    die(g);
    g.update(g.FIXED_DT);
    expect('log' in JSON.parse(g.saveText())).toBe(false);
  });

  it('lists what home bought, in order, with its price, until the next dive ends', () => {
    const g = loadGame();
    g.meta.bank = 1000;
    g.meta.challenges = { depth: 3 };
    const gun = g.WEAPONS[0], knife = g.WEAPONS.find(w => w.name === 'Knife'), heart = g.ATTRIBUTES.find(a => a.name === 'Heart');
    g.buy(gun);
    g.raise(heart);
    g.pickWeapon(knife);
    expect(g.meta.bought).toEqual(['Gun 1 (' + gun.tiers[0].cost + ' gems)', 'Heart 1 (1 point)',
                                   'Knife (' + knife.cost + ' gems)', 'carry Knife']);
    g.reset(7);
    die(g);
    g.update(g.FIXED_DT);
    expect(g.meta.bought).toEqual([]);
  });

  it('tells each gate the dive met: its fish, time, kills, and what hit the diver', () => {
    const g = loadGame();
    g.reset(7);
    g.immortal = true;
    ride(g);
    clearAndWait(g, 0.1);
    ride(g);
    g.immortal = false;
    die(g);
    g.update(g.FIXED_DT);
    const [first, second] = g.story;
    expect(first).toMatchObject({ gate: 1, layer: 1, hits: [] });
    expect(first.fish).toMatch(/^\w+ \d+/);
    expect([first.kills > 0, first.secs >= 0, first.hp > 0]).toEqual([true, true, true]);
    expect(second).toMatchObject({ gate: 2, died: true });
    expect(second.hits.at(-1)).toBe('eel');
  });
});
