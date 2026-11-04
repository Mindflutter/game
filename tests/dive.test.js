// The dive through the layers: batches drawn from pools, the layer end and on
// into the next, mods and gems across a whole dive, the status bar.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, ticks, ride, clearAndWait, atGate, die, sameFish } from './harness.js';
import { fitBatch, kitOf } from './measure.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

// Marks the first card, whatever it is, and presses Continue (D85).
function pick(g) {
  g.justPressed.add('Digit1');
  g.justPressed.add('Enter');
  g.update(g.FIXED_DT);
}

// Threat (D126): the dive's ordinary stretches, each with its target
// and the top grade its layer allows. Walked here, not read from the game, so
// the rule is checked rather than copied.
function stretches(g) {
  let k = -1;
  return g.LAYERS.flatMap((L, l) => L.stretches.map(s => {
    if (!s.escorts) k += 1;
    return { l, s, target: g.THREAT_START * (g.THREAT_RISE ** (k + 1) - 1) / (g.THREAT_RISE - 1),
             top: g.GRADES.findLastIndex(G => G.from <= l + 1) + 1 };
  }));
}
const atGrade = (b, grade) => ({ enemies: b.enemies.map(([n, c]) => [n, c, grade]) });
// The most of a type `graded()` may raise: the rest stay at grade 1.
const most = (g, n) => Math.floor((1 - g.GRADE_KEEP) * n);
// Every graded batch of a plan, a gate's or its escorts', its fish counted by type.
const gradedOf = (g, sd) => {
  g.reset(sd);
  return g.plan.flatMap(e => (e.escorts ? [e.escorts] : [e.batch]).map(b =>
    Object.values(Object.groupBy(b.enemies, ([n]) => n))));
};

describe('threat (D126)', () => {
  it('gives every type a threat at every grade, higher at each', () => {
    const g = loadGame();
    for (const t of g.ENEMY_TYPES) {
      expect([t.name, t.threat.length]).toEqual([t.name, g.GRADES.length]);
      expect([t.name, t.threat.every((v, i) => v > (t.threat[i - 1] ?? 0))]).toEqual([t.name, true]);
    }
  });

  it('sits every pool batch at or under its stretch, and able to reach it', () => {
    // At most of each type at the top grade, the rest at grade 1: the most
    // grading can reach. The dive's first stretch meets its target ungraded.
    const g = loadGame();
    for (const { l, s, target, top } of stretches(g)) {
      for (const b of s.escorts ? [] : s.pool) {
        const reach = g.batchThreat({ enemies: b.enemies.flatMap(([n, c]) => [[n, most(g, c), top], [n, c - most(g, c)]]) });
        const under = target === g.THREAT_START ? g.batchThreat(b) >= target : g.batchThreat(b) <= target;
        expect([l, b.enemies, under, reach >= target]).toEqual([l, b.enemies, true, true]);
      }
    }
  });

  it('fits a fitted batch to itself, so a refit with nothing changed writes the same pools', () => {
    const g = loadGame();
    for (const x of stretches(g)) {
      for (const b of x.s.escorts ? [] : x.s.pool) {
        const once = fitBatch(g, b.enemies, x).es;
        expect([x.l, b.enemies, fitBatch(g, once, x).es]).toEqual([x.l, b.enemies, once]);
      }
    }
  });

  it('reads a kit from a debug code, as the play-tests write one', () => {
    expect(kitOf(loadGame(), 'L3,Knife2,Mask3,Strength3,Reflex2,puffer4')).toEqual({ layer: 2,
      kit: { weapon: 'Knife', gear: { Knife: 2, Mask: 3 }, raised: { Strength: 3 }, mods: ['Reflex', 'Reflex'] } });
  });

  it('grows its batches in fish, not only in grade, through six gates a layer (D155)', () => {
    const g = loadGame();
    const fish = s => s.pool.reduce((a, b) => a + b.enemies.reduce((x, [, c]) => x + c, 0), 0) / s.pool.length;
    const ordinary = stretches(g).filter(x => !x.s.escorts);
    const byLayer = g.LAYERS.map((_, l) => {
      const own = ordinary.filter(x => x.l === l);
      return own.reduce((a, x) => a + fish(x.s), 0) / own.length;
    });
    expect(g.LAYERS.map((_, l) => g.gatesIn(l))).toEqual(g.LAYERS.map(() => 6));
    expect(fish(ordinary.at(-1).s)).toBeGreaterThan(3 * fish(ordinary[0].s));   // the flatter curve (D162)
    expect(byLayer.every((n, l) => n > (byLayer[l - 1] ?? 0))).toBe(true);
  });

  it('keeps a share of each type at grade 1 in every graded batch', () => {
    const g = loadGame();
    fc.assert(fc.property(seed, sd => {
      for (const types of gradedOf(g, sd)) {
        for (const es of types) {
          const n = es.reduce((a, [, c]) => a + c, 0);
          const up = es.filter(([, , gr = 1]) => gr > 1).reduce((a, [, c]) => a + c, 0);
          expect([es[0][0], n, up <= most(g, n)]).toEqual([es[0][0], n, true]);
        }
      }
    }), { numRuns: 30 });
  });

  it('starts the dive at grade 1, and keeps grades above it rare in the first layer', () => {
    // Rare is a tenth of the layer's fish, Claude's pick.
    const g = loadGame();
    const draw = g.LAYERS[0].stretches[0].draw;
    let fish = 0, up = 0;
    for (let sd = 1; sd <= 30; sd++) {
      g.reset(sd);
      expect(g.plan.slice(0, draw).flatMap(e => e.batch.enemies).filter(([, , gr = 1]) => gr > 1)).toEqual([]);
      for (const [, c, gr = 1] of g.plan.filter(e => e.layer === 0).flatMap(e => [...e.batch.enemies, ...(e.escorts?.enemies ?? [])])) {
        fish += c;
        if (gr > 1) up += c;
      }
    }
    expect(up / fish).toBeLessThanOrEqual(0.1);
  });

  it('grades every drawn batch to its stretch, never past its layer (D119)', () => {
    const g = loadGame();
    const all = stretches(g);
    fc.assert(fc.property(seed, sd => {
      g.reset(sd);
      let k = 0;
      for (const { s, target, top } of all) {
        for (const e of g.plan.slice(k, k += s.draw)) {
          const fish = [...e.batch.enemies, ...(e.escorts?.enemies ?? [])];
          expect(fish.every(([, , grade]) => grade >= 1 && grade <= top)).toBe(true);
          // The gate, lead and escorts, within half the graded batch's biggest
          // step of the target: what one fish more or less costs.
          const b = s.escorts ? e.escorts : e.batch;
          const step = Math.max(...b.enemies.map(([n]) => {
            const t = g.ENEMY_TYPES.find(x => x.name === n).threat;
            return Math.max(...t.slice(1).map((v, i) => v - t[i]));
          }));
          // Escorts that pass alone what the lead leaves come ungraded.
          const gate = g.batchThreat(e.batch) + (e.escorts ? g.batchThreat(e.escorts) : 0);
          const near = Math.abs(gate - target) <= step / 2 + 1e-9;
          expect(near || gate > target && b.enemies.every(([, , grade]) => grade === 1)).toBe(true);
        }
      }
    }), { numRuns: 30 });
  });

  it('never meets the top grade in the first layer (D119)', () => {
    const g = loadGame();
    expect(g.GRADES.findIndex(G => G.from > 1)).toBeGreaterThan(0);
    fc.assert(fc.property(seed, sd => {
      g.reset(sd);
      const first = g.plan.filter(e => e.layer === 0).flatMap(e => [...e.batch.enemies, ...(e.escorts?.enemies ?? [])]);
      expect(first.every(([, , grade]) => g.GRADES[grade - 1].from <= 1)).toBe(true);
    }), { numRuns: 30 });
  });

  it('rises through the dive: each stretch harder than the last (D79)', () => {
    const g = loadGame();
    g.reset(1);
    let k = 0;
    const means = [];
    for (const { s } of stretches(g)) {
      const drawn = g.plan.slice(k, k += s.draw);
      if (!s.escorts) means.push(drawn.reduce((a, e) => a + g.batchThreat(e.batch), 0) / drawn.length);
    }
    expect(means.every((m, i) => m > (means[i - 1] ?? 0))).toBe(true);
  });

  // One new type a stretch, two to open the dive: Claude's picks.
  it('reveals the fish a type at a time, the harder ones later', () => {
    const g = loadGame(), met = new Set(), threat = n => g.ENEMY_TYPES.find(t => t.name === n).threat[0];
    const brought = stretches(g).filter(x => !x.s.escorts).map(({ s }) => {
      const fresh = [...new Set(s.pool.flatMap(b => b.enemies.map(([n]) => n)))].filter(n => !met.has(n));
      fresh.forEach(n => met.add(n));
      return fresh;
    });
    expect(brought.map((fresh, k) => fresh.length <= (k ? 1 : 2))).not.toContain(false);
    // No type below the threat of one an earlier stretch brought, but those
    // built against a weapon (D171).
    const ordered = n => !g.ENEMY_TYPES.find(t => t.name === n).against;
    expect(brought.every((fresh, k) => fresh.filter(ordered).every(n =>
      brought.slice(0, k).flat().filter(ordered).every(m => threat(m) <= threat(n))))).toBe(true);
  });
});

describe('batches drawn from pools (D71)', () => {
  it('draws the same batches from the same seed, and different ones from two', () => {
    // One game, reset per draw: a plan that leaked from one dive into the
    // next would show here, where a fresh load per draw could not see it.
    const g = loadGame();
    const draw = s => { g.reset(s); return g.plan.map(e => JSON.stringify(e.batch.enemies)); };
    fc.assert(fc.property(seed, seed, (a, b) => {
      fc.pre(a !== b);
      const first = draw(a);
      expect(draw(b)).not.toEqual(first);
      expect(draw(a)).toEqual(first);
    }), { numRuns: 30 });
  });

  it('draws every batch from its own stretch\'s pool, never twice', () => {
    const g = loadGame();
    fc.assert(fc.property(seed, s => {
      g.reset(s);
      let k = 0;
      for (const [l, layer] of g.LAYERS.entries()) {
        for (const st of layer.stretches) {
          const drawn = g.plan.slice(k, k + st.draw);
          k += st.draw;
          // Graded copies (D126): the pool's batch is its fish, any grade.
          const from = drawn.map(e => st.pool.findIndex(b => sameFish(b, e.batch)));
          expect(drawn.every(e => e.layer === l) && from.every(i => i >= 0)).toBe(true);
          expect(new Set(from).size).toBe(st.draw);
        }
      }
      expect(k).toBe(g.plan.length);
    }), { numRuns: 30 });
  });

  it('gives every layer pools and batches of its own, and meets every type in one (D101)', () => {
    const g = loadGame();
    const owner = new Map();
    for (const [l, layer] of g.LAYERS.entries()) {
      for (const st of layer.stretches) {
        if (st.pool.length === 1) continue;      // a mini-boss's or the boss's
        for (const x of [st.pool, ...st.pool]) {
          expect(owner.get(x) ?? l).toBe(l);
          owner.set(x, l);
        }
      }
    }
    const met = new Set(g.LAYERS.flatMap(layer => layer.stretches.flatMap(st =>
      st.pool.flatMap(b => b.enemies.map(([name]) => name)))));
    expect(g.ENEMY_TYPES.filter(t => !met.has(t.name)).map(t => t.name)).toEqual([]);
  });

  it('names only real fish in every batch, each in a count of at least one', () => {
    // Content is data (D6): a typo here would only make the game quietly easier.
    const g = loadGame();
    const named = g.LAYERS.flatMap(l => l.stretches.flatMap(st => st.pool)).flatMap(b => b.enemies);
    expect(named.filter(([name]) => !g.ENEMY_TYPES.some(t => t.name === name))).toEqual([]);
    expect(named.every(([, count]) => Number.isInteger(count) && count >= 1)).toBe(true);
  });

  it('holds more batches in every ordinary pool than it draws', () => {
    // A pool the size of its draw only reshuffles the same batches -- the
    // same batches every dive, which is what D71 exists to end.
    const g = loadGame();
    for (const layer of g.LAYERS) {
      for (const st of layer.stretches) {
        if (st.pool.length > 1) expect(st.pool.length).toBeGreaterThan(st.draw);
      }
    }
  });
});

describe('on through the layers (D66, D68, D72)', () => {
  it('goes on from a layer end: a full heal, the cards, then the next layer\'s batch', () => {
    const end = atGate(0).plan.findIndex(e => e.end);
    const g = atGate(end);
    g.modCounts = { Fins: 1 };
    ride(g);                                  // the boss arrives
    expect(g.plan[g.batchIndex - 1].end).toBe(true);
    g.player.hp = 1;
    expect(clearAndWait(g)).toBe('mods');     // the cards: the layer end's pick
    expect(g.player.hp).toBe(g.player.maxHp); // the heal
    expect(g.meta.cleared).toBe(1);           // the layer counts as cleared
    pick(g);
    const cam = g.cameraY;
    ride(g);                                  // no screen, straight on (D72)
    expect(g.screen).toBe('playing');
    expect(g.enemies.length).toBeGreaterThan(0);
    expect(g.plan[g.batchIndex - 1].layer).toBe(1);
    expect(g.cameraY).toBeGreaterThan(cam);   // depth adds up, never resets
    expect(g.modCounts.Fins).toBeGreaterThanOrEqual(1);   // mods carried
  });

  it('drops the boss\'s big haul', () => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    g.placeEnemy('boss', 100, 100);
    g.killEnemy(g.enemies[0]);
    const haul = g.gems.length;
    const others = g.ENEMY_TYPES.filter(t => t.name !== 'boss').map(t => t.value);
    expect(haul).toBe(g.enemyType('boss').value);
    expect(haul).toBeGreaterThan(3 * Math.max(...others));
  });

  it('starts layer 3 from its scenario with the kit it names', () => {
    const g = loadGame();
    expect(g.applyScenario('layer-3', 1)).toBe(true);
    expect(g.plan[g.batchIndex].layer).toBe(2);
    expect(g.plan[g.batchIndex - 1].end).toBe(true);
    expect(Object.values(g.modCounts).reduce((a, b) => a + b, 0)).toBe(g.SCENARIOS['layer-3'].kit.length);
  });

  it('starts layer 2 from its scenario with the kit it names', () => {
    const g = loadGame();
    expect(g.applyScenario('layer-2', 1)).toBe(true);
    const kit = g.SCENARIOS['layer-2'].kit;
    expect(g.plan[g.batchIndex].layer).toBe(1);
    expect(g.plan[g.batchIndex - 1].end).toBe(true);
    expect(Object.values(g.modCounts).reduce((a, b) => a + b, 0)).toBe(kit.length);
    expect(g.player.speed).toBeGreaterThan(g.PLAYER_START.speed);
  });
});

describe('mods across a whole dive (D69)', () => {
  it('never passes a cap, whatever the fish carry and the layer ends offer', () => {
    // Both ways a mod arrives (D84, D85), mixed, for more mods than every cap
    // allows: a fish's mod, and now and then a layer end's card at its step.
    const g = loadGame();
    fc.assert(fc.property(seed, s => {
      g.reset(s);
      for (let i = 0; i < 40; i++) {
        if (i % 4 === 3) {
          const cards = g.rollValuable();
          const c = cards[i % Math.max(1, cards.length)];
          if (c) for (let k = 0; k < (c.end ? 1 : g.END_STEP); k++) g.takeMod(c);
        } else {
          const m = g.drawCarried();
          if (m) g.takeMod(m);
        }
        for (const m of g.MODS) expect(g.modCounts[m.name] || 0).toBeLessThanOrEqual(m.max);
      }
    }), { numRuns: 20 });
  });

  it('caps every mod', () => {
    expect(loadGame().MODS.every(m => Number.isInteger(m.max) && m.max >= 1)).toBe(true);
  });

});

describe('gems (D35, D67)', () => {
  it('flies every gem to the player from anywhere, and none fades', () => {
    fc.assert(fc.property(seed, s => {
      const g = loadGame();
      g.reset(s);
      g.queuePaused = true;
      // Drops across the whole view and beyond it, as a batch's deaths do.
      for (let i = 0; i < 12; i++) {
        g.placeEnemy('bulwark', (i * 347) % 1500 - 100, g.cameraY + (i * 211) % 1000 - 100);
      }
      for (const e of [...g.enemies]) g.killEnemy(e);
      g.enemies = [];
      const dropped = g.gems.length;
      g.immortal = true;
      // 20s is the failure bound; every gem arrives inside 1.5s.
      for (let i = 0, n = ticks(g, 20); i < n && g.gems.length; i++) g.update(g.FIXED_DT);
      expect(g.gems).toHaveLength(0);
      expect(g.currency).toBe(dropped);
    }), { numRuns: 10 });
  });

  it('banks the dive\'s gems on death, and ends the dive in the save', () => {
    const g = loadGame();
    g.reset(1);
    g.meta.bank = 5;
    g.currency = 17;
    g.queuePaused = true;
    g.gems.push({ x: g.player.x, y: g.player.y, r: 4 });   // caught as you die
    die(g);
    expect(g.currency).toBe(18);
    expect(g.meta.bank).toBe(23);
    expect(g.diveLive).toBe(false);
    expect(JSON.parse(g.saved).dive).toBeNull();
  });

  it('offers Go home and Dive again after a death, with Go home on top and marked', () => {
    // Dive again and Go home (D90). Go home is marked, so a stray Enter or
    // Space -- Space is the dash -- never starts a dive by accident.
    const dead = () => {
      const g = loadGame();
      g.reset(1);
      g.queuePaused = true;
      die(g);
      return g;
    };
    const enter = dead();
    enter.justPressed.add('Enter');
    enter.update(enter.FIXED_DT);
    expect(enter.screen).toBe('home');
    const click = (g, x, y) => {
      g.aim.x = x;
      g.aim.y = y;
      g.justPressed.add('Mouse0');
      g.update(g.FIXED_DT);
      return g.screen;
    };
    // Go home is the top row: a newcomer clicks the first one (D184).
    expect(enter.MENUS.dead.items.map(i => i.label)).toEqual(['Go home', 'Dive again']);
    const again = g => g.rowRect(1, g.MENUS.dead.top);
    const g = dead();
    expect(click(g, 10, 10)).toBe('dead');       // a click off the buttons does nothing
    const r = again(g);
    expect(click(g, r.x + r.w / 2, r.y + r.h / 2)).toBe('playing');
  });

  it('marks Go home when the bank or the points can buy something there, with what they hold (D172)', () => {
    const home = (bank, challenges = {}) => {
      const g = loadGame();
      g.meta.bank = bank;
      g.meta.challenges = challenges;
      g.reset(1);
      g.queuePaused = true;
      die(g);
      return g.MENUS.dead.items[g.menuIndex];
    };
    expect(home(0)).toMatchObject({ label: 'Go home', dot: false });
    expect(home(20)).toMatchObject({ label: 'Go home   20 gems', dot: true });   // the Gun's first tier
    expect(home(0, { depth: 1 })).toMatchObject({ label: 'Go home   1 point', dot: true });
    const g = loadGame();
    g.openDebug('L1,G1,S1,Gun0', 1);
    g.debugDive();
    g.meta.bank = 500;
    g.queuePaused = true;
    die(g);
    expect(g.MENUS.dead.items[g.menuIndex].dot).toBeFalsy();
  });
});

describe('the content stage\'s counts (D93)', () => {
  it('holds the counts S5 (content) asks for', () => {
    const g = loadGame();
    const within = (what, n, lo, hi) => expect([what, n >= lo && n <= hi]).toEqual([what, true]);
    const behaviour = t => Object.keys(t).find(k => typeof t[k] === 'object' && !Array.isArray(t[k])) ?? 'chase';
    within('behaviours', new Set(g.ENEMY_TYPES.map(behaviour)).size, 5, 7);
    within('ordinary types', g.ENEMY_TYPES.filter(t => t.carries !== false).length, 5, 7);
    within('weapons', g.WEAPONS.length, 2, 3);
    within('equipment', g.EQUIPMENT.length, 2, 3);
    within('layers', g.LAYERS.length, 3, 5);
    for (const x of [...g.WEAPONS, ...g.EQUIPMENT]) within(x.name + ' tiers', x.tiers.length, 3, 4);
    within('mods', g.MODS.length, 5, 7);
    within('boosts', g.BOOSTS.length, 4, 6);     // Rush and 3-5 new
    within('challenges', g.CHALLENGES.length, 9, 9);   // five since D109, depth since D161, a weapon's own each since D206
    within('attributes', g.ATTRIBUTES.length, 3, 3);
  });
});

describe('enemies placed by hand (D37)', () => {
  it('clears a scenario\'s lone enemy like a gate, with no layer to pay into', () => {
    // ?dev=one-drifter&play: no batch has arrived, so no plan entry is current.
    // A gate opens no cards (D84), so play simply goes on.
    const g = loadGame();
    expect(g.applyScenario('one-drifter', 1)).toBe(true);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect([g.meta.challenges, g.killTimes]).toEqual([{}, []]);   // not even toward `flurry` (D109)
  });
});

describe('the status bar', () => {
  const text = g => g.statusLines().map(l => l.text).join('\n');

  it('names the layer, the batch within it and the fish left, while fighting and between gates', () => {
    // Layer 3's first batch: big enough to come in waves.
    const k = atGate(0).plan.findIndex(e => e.layer === 2);
    const g = atGate(k);
    const inLayer = g.plan.filter(e => e.layer === 2).length;
    expect(text(g)).toContain(g.LAYERS[2].name + '   batch 1/' + inLayer);   // the one ahead
    expect(text(g)).not.toContain('fish left');
    ride(g);
    expect(text(g)).toContain(g.LAYERS[2].name + '   batch 1/' + inLayer);   // the one fought
    const coming = g.incoming.length;
    expect(coming).toBeGreaterThan(0);
    expect(text(g)).toContain((g.enemies.length + coming) + ' fish left (' + coming + ' coming)');
    // Between waves the arena is empty, and the bar still says the batch is on (D115).
    g.enemies = [];
    expect(text(g)).toContain(g.LAYERS[2].name + '   batch 1/' + inLayer);
    expect(text(g)).toContain(coming + ' fish left (' + coming + ' coming)');
  });

  it('shows the readout only in the debug mode (D148)', () => {
    const g = loadGame();
    g.reset(1);
    expect(text(g)).not.toContain('rng ');
    g.openDebug('', 1);
    g.debugDive();
    expect(text(g)).toContain('rng ' + g.player.range);
  });

  it('shows on the readout every stat a mod or a boost moves, each a real field of the diver (D52)', () => {
    // hp and maxHp are the `HP 3/4` on the line above.
    const g = loadGame();
    g.reset();
    const shown = g.PLAYER_STATS.map(s => s.stat).concat(['hp', 'maxHp']);
    const moved = [...new Set([...g.MODS.flatMap(m => g.modPreview(m).map(c => c.stat)),
                               ...g.BOOSTS.flatMap(b => Object.keys({ ...b.add, ...b.percent }))])];
    expect(moved.filter(k => !shown.includes(k))).toEqual([]);
    expect(g.PLAYER_STATS.filter(s => !(s.stat in g.player)).map(s => s.stat)).toEqual([]);
  });

  it('shows the weapon and its tier, the guard left, the mods held and the challenges\' counts', () => {
    const g = loadGame();
    g.meta.gear.Gun = 2;
    g.meta.challenges = { swift: 4, untouched: 1 };
    g.reset(1);
    g.tally.untouched = 2;
    g.player.guard = 2;
    g.guardLeft = 1;
    g.modCounts = { Impact: 2 };
    const t = text(g);
    expect(t).toContain('Gun tier 2');
    expect(t).toContain('GUARD 1/2');
    expect(t).toContain('Impact ×2');
    const next = name => g.CHALLENGES.find(c => c.name === name).rungs[name === 'untouched' ? 1 : 0];
    expect(t).toContain('swift ●●●●');       // every rung earned (D109)
    expect(t).toContain('untouched 2/' + next('untouched'));   // the streak against its next rung
    expect(t).toContain('flurry 0/' + next('flurry'));
  });
});
