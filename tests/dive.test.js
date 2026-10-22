// The dive through the layers: batches drawn from pools, the layer end and on
// into the next, mods and gems across a whole dive, the status bar. Designed
// in docs/specs/2026-09-30-s4-meta-loop-design.md.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, ticks, ride, clearAndWait, atGate, die } from './harness.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

// Marks the first card, whatever it is, and presses Continue (D85).
function pick(g) {
  g.justPressed.add('Digit1');
  g.justPressed.add('Enter');
  g.update(g.FIXED_DT);
}

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
          expect(drawn.every(e => e.layer === l && st.pool.includes(e.batch))).toBe(true);
          expect(new Set(drawn.map(e => e.batch)).size).toBe(st.draw);
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

  it('offers Dive again and Go home after a death, with Go home marked', () => {
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
    const again = g => g.rowRect(0, g.MENUS.dead.top);
    const g = dead();
    expect(click(g, 10, 10)).toBe('dead');       // a click off the buttons does nothing
    const r = again(g);
    expect(click(g, r.x + r.w / 2, r.y + r.h / 2)).toBe('playing');
  });
});

describe('the content stage\'s counts (D93)', () => {
  it('holds the counts S5 (content) asks for', () => {
    const g = loadGame();
    const within = (what, n, lo, hi) => expect([what, n >= lo && n <= hi]).toEqual([what, true]);
    const behaviour = t => Object.keys(t).find(k => typeof t[k] === 'object') ?? 'chase';
    within('behaviours', new Set(g.ENEMY_TYPES.map(behaviour)).size, 5, 7);
    within('ordinary types', g.ENEMY_TYPES.filter(t => t.carries !== false).length, 5, 7);
    within('weapons', g.WEAPONS.length, 2, 3);
    within('equipment', g.EQUIPMENT.length, 2, 3);
    within('layers', g.LAYERS.length, 3, 5);
    for (const x of [...g.WEAPONS, ...g.EQUIPMENT]) within(x.name + ' tiers', x.tiers.length, 3, 4);
    within('mods', g.MODS.length, 5, 7);
    within('boosts', g.BOOSTS.length, 4, 6);     // Rush and 3-5 new
    within('challenges', g.CHALLENGES.length, 5, 5);   // five since D109
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
    const k = atGate(0).plan.findIndex(e => e.layer === 1);
    const g = atGate(k);
    const inLayer = g.plan.filter(e => e.layer === 1).length;
    expect(text(g)).toContain(g.LAYERS[1].name + '   batch 1/' + inLayer);   // the one ahead
    expect(text(g)).not.toContain('fish left');
    ride(g);
    expect(text(g)).toContain(g.LAYERS[1].name + '   batch 1/' + inLayer);   // the one fought
    const coming = g.incoming.length;
    expect(coming).toBeGreaterThan(0);
    expect(text(g)).toContain((g.enemies.length + coming) + ' fish left (' + coming + ' coming)');
    // Between waves the arena is empty, and the bar still says the batch is on (D115).
    g.enemies = [];
    expect(text(g)).toContain(g.LAYERS[1].name + '   batch 1/' + inLayer);
    expect(text(g)).toContain(coming + ' fish left (' + coming + ' coming)');
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
    expect(t).toContain('swift ●●●●');            // every rung earned (D109)
    expect(t).toContain('untouched 2/3');         // the streak against its next rung
    expect(t).toContain('flurry 0/6');
  });
});
