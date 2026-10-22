// The boss and the mini-bosses: the lunge, the boss's fan, the layer's shape,
// what a mini-boss's clear pays, and their escorts (D62, D63, D64, D65, D88,
// D116, D117).
// The design is in docs/specs/2026-09-29-s3-boss-design.md.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, sameFish } from './harness.js';

// Wholly inside the view -- the one place a tell can be read.
const inView = (g, e) => e.x - e.r >= 0 && e.x + e.r <= g.ARENA_W &&
                         e.y - e.r >= g.cameraY - 1e-6 &&
                         e.y + e.r <= g.cameraY + g.ARENA_H + 1e-6;

// 40s of walking: one set of held movement keys per 45 ticks. fast-check
// draws it, so a failure shrinks to the simplest walk that shows it.
const walk = fc.array(fc.subarray(['KeyA', 'KeyD', 'KeyW', 'KeyS']),
                      { minLength: 107, maxLength: 107 });

describe('the lunge (D64) and the fan (D117)', () => {
  it('never attacks without a full wind-up, holds its line through it, stays in view without jumping, and takes its attacks in turn', () => {
    fc.assert(fc.property(fc.constantFrom('boss', 'mini-boss'),
                          fc.integer({ min: 0, max: 2 ** 32 - 1 }), walk, (name, seed, steps) => {
      // One lunger alone, and a player kept alive (`immortal`) who walks and
      // never fires, so the fight lasts as long as the test wants.
      const g = loadGame();
      g.immortal = true;
      g.reset(seed);
      g.queuePaused = true;
      g.spawnBatch({ enemies: [[name, 1]] });
      const T = g.enemyType(name);
      // Recorded per tick and asserted once per run: an expect() on every tick
      // was two thirds of this test's cost. Each entry names its tick.
      const bad = [], attacks = [];
      let prev = 'chase', run = 0, aim = null, charges = 0, maxStep = 0;
      for (let i = 0, n = ticks(g, 40); i < n; i++) {
        if (i % 45 === 0) {
          g.keys.clear();
          for (const k of steps[i / 45]) g.keys.add(k);
        }
        const bx = g.enemies[0].x, by = g.enemies[0].y;
        g.update(g.FIXED_DT);
        const e = g.enemies[0];
        // No jumps: a lunger that wound up outside the view and was clamped
        // back in would teleport, and its tell would start off-screen.
        maxStep = Math.max(maxStep, Math.hypot(e.x - bx, e.y - by));
        if (e.phase !== prev) {                    // a step just began
          if (e.phase === 'charge') {
            charges++;
            if (prev !== 'windup' || run * g.FIXED_DT < T.lunge.windup - 1e-9) bad.push(['early charge', i]);
          }
          // Wind-up straight to rest: a fan just flew.
          if (e.phase === 'rest' && prev === 'windup' &&
              (e.attack !== 'fan' || run * g.FIXED_DT < T.fan.windup - 1e-9)) bad.push(['early fan', i]);
          if (e.phase === 'windup') {
            aim = [e.aimX, e.aimY];
            attacks.push(e.attack);
          }
          prev = e.phase;
          run = 0;
        }
        run++;
        if (e.phase === 'windup' && (e.aimX !== aim[0] || e.aimY !== aim[1])) bad.push(['line turned', i]);
        if (e.phase !== 'chase' && !inView(g, e)) bad.push(['out of view', i]);
      }
      expect(bad.slice(0, 3)).toEqual([]);          // the first three are enough to read
      expect(maxStep).toBeLessThanOrEqual(T.lunge.speed * g.FIXED_DT + 1e-9);
      expect(charges).toBeGreaterThan(0);          // or the rest is vacuous
      expect(attacks).toEqual(attacks.map((_, k) => T.fan && k % 2 ? 'fan' : 'lunge'));
      expect(attacks.length).toBeGreaterThan(1);
    }), { numRuns: 20 });
  });

  it('teaches before it tests: the mini-boss winds up longer, is weaker, and only lunges (D65, D117)', () => {
    const g = loadGame();
    const mini = g.enemyType('mini-boss'), boss = g.enemyType('boss');
    expect(mini.lunge.windup).toBeGreaterThan(boss.lunge.windup);
    expect(mini.hp).toBeLessThan(boss.hp);
    expect(mini.fan).toBeUndefined();
    expect(boss.fan).toBeDefined();
  });

  it('spits its fan as the wind-up ends: `count` shots spread evenly across `arc`, centred on the locked line', () => {
    const g = loadGame();
    g.immortal = true;
    g.reset(1);
    g.queuePaused = true;
    g.spawnBatch({ enemies: [['boss', 1]] });
    const e = g.enemies[0], F = e.fan;
    Object.assign(e, { x: g.ARENA_W / 2, y: g.cameraY + 150, phase: 'windup', attack: 'fan',
                       aimX: 0, aimY: 1, phaseTime: F.windup - g.FIXED_DT / 2 });
    g.update(g.FIXED_DT);
    const shots = g.bullets.filter(b => b.evil);
    expect(e.phase).toBe('rest');
    expect(shots).toHaveLength(F.count);
    const step = F.arc * Math.PI / 180 / (F.count - 1);
    shots.map(b => Math.atan2(b.vy, b.vx)).sort((a, b) => a - b)
      .forEach((a, k) => expect(a).toBeCloseTo(Math.PI / 2 + (k - (F.count - 1) / 2) * step));
    for (const b of shots) expect([b.speed, b.r, b.maxTravel, b.damage]).toEqual([F.speed, F.r, F.travel, F.damage]);
  });

  it('costs its damage as its charge reaches the diver (D118)', () => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    g.placeEnemy('mini-boss', g.player.x - 200, g.player.y);
    const e = g.enemies[0];
    Object.assign(e, { x: g.player.x - e.r - g.player.r + 5, phase: 'charge', phaseTime: 0,
                       aimX: 1, aimY: 0, lunge: { ...e.lunge, damage: 2 } });
    g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 2);
  });

  it('brings the boss up from below the view, centred', () => {
    const g = loadGame();
    g.reset(1);
    g.spawnBatch({ enemies: [['boss', 1]] });
    const boss = g.enemies[0];
    expect(boss.x).toBe(g.ARENA_W / 2);
    expect(boss.y - boss.r).toBeGreaterThan(g.cameraY + g.ARENA_H);
  });
});

describe('the layer (D62, D65)', () => {
  const has = name => e => e.batch.enemies.some(([n]) => n === name);

  it('ends every layer on the boss, with two mini-bosses along the way, each escorted from the pool before it', () => {
    // Over a drawn dive (D71), layer by layer: the fixed places hold whatever
    // the pools drew around them. Escorts ride beside the batch (D116), so
    // the batch itself is still the boss or the mini-boss alone.
    const g = loadGame();
    g.reset(1);
    g.LAYERS.forEach((L, l) => {
      const layer = g.plan.filter(e => e.layer === l);
      const escorted = layer.filter(e => e.escorts);
      expect(escorted).toEqual(layer.filter(e => has('mini-boss')(e) || has('boss')(e)));
      escorted.forEach((e, i) => expect(L.stretches[2 * i].pool.some(b => sameFish(b, e.escorts))).toBe(true));
      // At the grade of the layer's number (D126).
      expect(layer.at(-1).batch.enemies).toEqual([['boss', 1, l + 1]]);
      expect(layer.at(-1).end).toBe(true);
      expect(layer.filter(has('mini-boss')).map(e => e.batch.enemies))
        .toEqual([[['mini-boss', 1, l + 1]], [['mini-boss', 1, l + 1]]]);
      expect(layer.slice(0, -1).some(has('boss'))).toBe(false);
      expect(layer.slice(0, -1).some(e => e.end)).toBe(false);
    });
  });

  it('carries no mod on a mini-boss, nor on its escorts, and opens no cards when it dies (D88, D116)', () => {
    const g = loadGame();
    expect(g.applyScenario('mini-boss', 1)).toBe(true);
    ride(g);
    expect(g.enemies.filter(e => e.name === 'mini-boss')).toHaveLength(1);
    expect(g.enemies.length).toBeGreaterThan(1);
    expect(clearAndWait(g, 1)).toBe('playing');
    const held = Object.values(g.modCounts).reduce((a, b) => a + b, 0);
    expect(held + g.drops.filter(d => d.mod).length).toBe(0);
  });
});

describe('escorts (D116)', () => {
  // A dive's first boss or mini-boss, arrived; the diver kept alive and never
  // firing, so the fight lasts as long as the test wants.
  // `last`: the deepest, whose escorts the plan grades (D126).
  const fight = (seed, name, last = false) => {
    const g = loadGame();
    g.immortal = true;
    g.startScenario({ batch: p => p[last ? 'findLastIndex' : 'findIndex'](e => e.batch.enemies.some(([n]) => n === name)) }, seed);
    ride(g);
    return g;
  };
  const play = (g, seconds) => { for (let i = 0, n = ticks(g, seconds); i < n; i++) g.update(g.FIXED_DT); };
  const crowd = g => g.enemies.filter(e => e.escort);
  const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

  it('keeps the boss\'s crowd topped up to its size while the boss lives, from its own mix, never past it', () => {
    fc.assert(fc.property(seed, s => {
      const g = fight(s, 'boss', true);
      const { batch, escorts } = g.plan[g.batchIndex - 1];
      let over = false;
      for (let i = 0, n = ticks(g, 6); i < n; i++) {
        if (i === ticks(g, 3)) for (const e of crowd(g).slice(0, 2)) g.killEnemy(e);   // a gap to fill
        g.update(g.FIXED_DT);
        if (crowd(g).length + g.incoming.length > batch.crowd) over = true;
      }
      expect(over).toBe(false);
      expect(crowd(g)).toHaveLength(batch.crowd);
      // Its fish and their grades, the plan's (D126).
      expect(crowd(g).every(e => escorts.enemies.some(([n, , gr = 1]) => n === e.name && gr === e.grade))).toBe(true);
    }), { numRuns: 10 });
  });

  it('pays no gems for an escort, though one may drop a boost', () => {
    const g = fight(1, 'boss');
    play(g, 3);
    const gems = g.gems.length;
    g.sinceBoost = 1e6;                        // the next roll is certain
    g.killEnemy(crowd(g)[0]);
    expect(g.gems.length).toBe(gems);
    expect(g.drops.filter(d => d.boost)).toHaveLength(1);
  });

  it('takes the crowd with the boss: every escort gone on the tick it dies, none still coming, no boost, then the layer end', () => {
    const g = fight(1, 'boss');
    play(g, 3);
    g.killEnemy(crowd(g)[0]);
    g.update(g.FIXED_DT);                      // its replacement is on its way
    expect(g.incoming.length).toBeGreaterThan(0);
    const gems = g.gems.length, boss = g.enemies.find(e => e.lead);
    g.sinceBoost = 1e6;
    g.killEnemy(boss);
    expect(g.enemies.filter(e => !e.gone)).toEqual([]);
    expect(g.incoming).toEqual([]);
    expect(g.gems.length - gems).toBe(boss.value);   // the haul, and no more
    expect(g.drops.filter(d => d.boost)).toEqual([]);
    expect(clearAndWait(g, 1)).toBe('mods');
  });

  it('brings a mini-boss in first, its escorts dealt into the waves behind it, and holds the gate until every one is dead', () => {
    fc.assert(fc.property(seed, s => {
      const g = fight(s, 'mini-boss');
      const { escorts } = g.plan[g.batchIndex - 1];
      expect(g.enemies.some(e => e.name === 'mini-boss')).toBe(true);
      expect([...g.enemies, ...g.incoming].map(f => f.name).sort())
        .toEqual(['mini-boss', ...escorts.enemies.flatMap(([n, c]) => Array(c).fill(n))].sort());
    }), { numRuns: 10 });
    const g = fight(1, 'mini-boss');
    expect(g.statusLines()[1].text).toContain('fish left');   // a count: no crowd here
    const at = g.batchIndex;
    g.killEnemy(g.enemies.find(e => e.name === 'mini-boss'));
    const gems = g.gems.length, escort = g.enemies.find(e => !e.gone);
    g.killEnemy(escort);
    expect(g.gems.length - gems).toBe(escort.value);   // an ordinary batch's fish: they pay
    play(g, 2);
    expect([g.batchLive(), g.batchIndex]).toEqual([true, at]);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect(g.batchLive()).toBe(false);
  });

  it('plays on identically from a save taken mid-crowd, its newcomers included', () => {
    const a = fight(3, 'boss');
    play(a, 3);
    a.killEnemy(crowd(a)[0]);
    a.update(a.FIXED_DT);
    expect(a.incoming.length).toBeGreaterThan(0);
    const b = loadGame();
    b.immortal = true;
    expect(b.loadSave(a.saveText())).toBe('');
    b.screen = b.resumeTo;
    for (const g of [a, b]) play(g, 5);
    expect(b.saveText()).toBe(a.saveText());
  });

  it('plays on identically from a save taken while the boss winds up a fan (D117)', () => {
    const a = fight(3, 'boss');
    const boss = () => a.enemies.find(e => e.lead);
    for (let i = 0; i < ticks(a, 60) && !(boss().phase === 'windup' && boss().attack === 'fan'); i++) {
      a.update(a.FIXED_DT);
    }
    expect([boss().phase, boss().attack]).toEqual(['windup', 'fan']);
    const b = loadGame();
    b.immortal = true;
    expect(b.loadSave(a.saveText())).toBe('');
    b.screen = b.resumeTo;
    for (const g of [a, b]) play(g, 5);
    expect(b.saveText()).toBe(a.saveText());
  });

  it('takes every shot still flying with the boss, so none lands after the fight is over (D117)', () => {
    const g = fight(1, 'boss');
    play(g, 3);
    const boss = g.enemies.find(e => e.lead);
    Object.assign(boss, { phase: 'windup', attack: 'fan', aimX: 0, aimY: 1, phaseTime: boss.fan.windup });
    g.update(g.FIXED_DT);
    expect(g.bullets.some(b => b.evil && !b.gone)).toBe(true);
    g.killEnemy(boss);
    expect(g.bullets.filter(b => b.evil && !b.gone)).toEqual([]);
  });

  it('meets its bosses alone in a dive saved before escorts', () => {
    const g = loadGame();
    expect(g.loadSave(readFileSync(new URL('./fixtures/save-v8.json', import.meta.url), 'utf8'))).toBe('');
    g.screen = g.resumeTo;
    g.immortal = true;
    const k = g.plan.findIndex(e => e.end);
    expect(g.plan[k].escorts).toBeUndefined();         // as it was saved
    Object.assign(g, { enemies: [], incoming: [], batchIndex: k, cameraY: g.gateDepth(k) });
    g.player.y = g.cameraY + g.ARENA_H / 2;
    ride(g);
    play(g, 4);
    expect(g.enemies.map(e => e.name)).toEqual(['boss']);
    expect(g.incoming).toEqual([]);
  });

  it('brings no crowd to a boss placed by hand, even just past a layer end', () => {
    // The plan's entry behind is a boss's, crowd and all.
    const g = loadGame();
    g.immortal = true;
    g.startScenario({ batch: p => p.findIndex(e => e.end) + 1, spawn: false, enemies: [['boss', 640, 200]] }, 1);
    play(g, 4);
    expect(g.enemies.map(e => e.name)).toEqual(['boss']);
    expect(g.incoming).toEqual([]);
  });

  it('says on the status bar that escorts come until the boss dies, rather than counting them', () => {
    const g = fight(1, 'boss');
    expect(g.statusLines()[1].text).toContain('escorts keep coming until the boss dies');
    expect(g.statusLines()[1].text).not.toContain('fish left');
  });
});
