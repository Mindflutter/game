// S4 (meta loop skeleton): the dive through the layers, `home`'s economy, and
// the save. Each test guards a line of
// docs/superpowers/specs/2026-09-30-s4-meta-loop-design.md and the decision
// it names; each was verified by breaking the rule it guards.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, atGate } from './harness.js';
import { botInput } from './bot.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

// Takes the first card, whatever it is, and plays on one tick.
function pick(g) {
  g.justPressed.add('Digit1');
  g.update(g.FIXED_DT);
}

// Kills the player where they stand: one heart left and a bulwark on top.
function die(g) {
  g.player.hp = 1;
  g.player.hurt = 0;
  g.placeEnemy('bulwark', g.player.x, g.player.y);
  g.update(g.FIXED_DT);
  expect(g.screen).toBe('dead');
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
  it('goes on from a layer end: a full heal, a rank, the cards, then the next layer\'s batch', () => {
    const end = atGate(0).plan.findIndex(e => e.end);
    const g = atGate(end);
    g.rank = end;
    g.modCounts = { Fins: 1 };
    ride(g);                                  // the boss arrives
    expect(g.plan[g.batchIndex - 1].end).toBe(true);
    g.player.hp = 1;
    expect(clearAndWait(g)).toBe('mods');     // the cards, as at any gate
    expect(g.player.hp).toBe(g.player.maxHp); // the heal
    expect(g.rank).toBe(end + 1);             // and the rank
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

  it('starts layer 2 from its scenario with the kit it names', () => {
    const g = loadGame();
    expect(g.applyScenario('layer-2', 1)).toBe(true);
    const kit = g.SCENARIOS['layer-2'].kit;
    expect(g.plan[g.batchIndex].layer).toBe(1);
    expect(g.plan[g.batchIndex - 1].end).toBe(true);
    expect(Object.values(g.modCounts).reduce((a, b) => a + b, 0)).toBe(kit.length);
    expect(g.rank).toBe(kit.length);
    expect(g.player.speed).toBeGreaterThan(g.PLAYER_START.speed);
  });
});

describe('mods across a whole dive (D69)', () => {
  it('never passes a cap, and offers three cards while any mod is under its cap', () => {
    const g = loadGame();
    fc.assert(fc.property(seed, s => {
      g.reset(s);
      g.player.hp = 1;
      for (let i = 0; i < 40; i++) {           // more picks than every cap allows
        const cards = g.rollMods();
        const open = g.MODS.some(m => (g.modCounts[m.name] || 0) < m.max);
        if (open) expect(cards).toHaveLength(3);
        else expect(cards.map(c => c.name)).toEqual(['Gems', 'Heart']);
        expect(new Set(cards.map(c => c.name)).size).toBe(cards.length);
        g.takeMod(cards[Math.floor(i * 7919 % cards.length)]);
        for (const m of g.MODS) expect(g.modCounts[m.name] || 0).toBeLessThanOrEqual(m.max);
      }
    }), { numRuns: 20 });
  });

  it('caps every mod', () => {
    expect(loadGame().MODS.every(m => Number.isInteger(m.max) && m.max >= 1)).toBe(true);
  });

  it('pays the gems card when taken, never when previewed, and counts no filler', () => {
    const g = loadGame();
    g.reset(1);
    const gems = g.FILLERS.find(f => f.name === 'Gems');
    expect(g.modPreview(gems)).toEqual([]);
    expect(g.currency).toBe(0);
    g.takeMod(gems);
    expect(g.currency).toBe(g.FILLER_GEMS);
    g.player.hp = 1;
    g.takeMod(g.FILLERS.find(f => f.name === 'Heart'));
    expect(g.player.hp).toBe(2);
    expect(g.modCounts).toEqual({});
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

  it('goes home from the death screen, and R dives again at once', () => {
    for (const [key, to] of [['Enter', 'home'], ['KeyR', 'playing']]) {
      const g = loadGame();
      g.reset(1);
      g.queuePaused = true;
      die(g);
      g.justPressed.add(key);
      g.update(g.FIXED_DT);
      expect(g.screen).toBe(to);
    }
  });
});

describe('home: gear, points, micro-tasks (D31, D36)', () => {
  const gun = g => g.WEAPONS.find(x => x.name === 'Gun');
  const reach = g => g.ATTRIBUTES.find(x => x.name === 'Dash reach');

  it('buys a tier only with the gems for it, adds it to every dive, and stops at the top', () => {
    const g = loadGame();
    g.buy(gun(g));
    expect(g.meta.gear).toEqual({});             // 0 gems buys nothing
    g.meta.bank = 1000;
    g.buy(gun(g));
    expect(g.meta.bank).toBe(1000 - gun(g).tiers[0].cost);
    g.reset(1);
    expect(g.player.fireRate).toBeCloseTo(gun(g).fireRate + 0.5);
    for (let i = 0; i < 5; i++) g.buy(gun(g));
    expect(g.meta.gear.Gun).toBe(gun(g).tiers.length);
    expect(g.meta.bank).toBe(1000 - gun(g).tiers.reduce((a, t) => a + t.cost, 0));
    expect(JSON.parse(g.saved).gear.Gun).toBe(gun(g).tiers.length);   // written at once
  });

  it('pays a point for a clean batch, once per layer, and spends it on reach', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    expect(clearAndWait(g)).toBe('mods');        // the first batch, untouched
    expect(g.points()).toBe(1);
    expect(g.notice).not.toBe('');
    pick(g);
    ride(g);
    g.notice = '';
    clearAndWait(g);                             // a second clean batch, same layer
    expect(g.points()).toBe(1);
    expect(g.notice).toBe('');                   // and nothing announced twice
    g.raise(reach(g));
    g.raise(reach(g));                           // the second has nothing to spend
    expect(g.points()).toBe(0);
    expect(g.meta.spent['Dash reach']).toBe(1);
    g.reset(2);
    expect(g.player.dashSpeed).toBe(g.PLAYER_START.dashSpeed + 150);
  });

  it('pays no point for a batch that landed a hit', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    g.placeEnemy('bulwark', g.player.x, g.player.y);   // a real touch
    g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 1);
    expect(clearAndWait(g)).toBe('mods');
    expect(g.points()).toBe(0);
  });

  it('opens on the title with no dive, goes `home` between dives, and Continue with one under way', () => {
    const g = loadGame();                        // as the game boots: nothing reset
    expect(g.screen).toBe('title');
    expect(g.MENUS.title.items[0].label).toBe('Start');
    g.justPressed.add('Enter');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('home');
    g.justPressed.add('Escape');                 // home's `back`
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('title');
    g.justPressed.add('Enter');
    g.update(g.FIXED_DT);
    g.justPressed.add('Enter');                  // the Dive row
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
    g.screen = 'title';
    expect(g.MENUS.title.items[0].label).toBe('Continue');
  });
});

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
      b.justPressed.add('Enter');                // Continue
      b.update(b.FIXED_DT);
      for (const g of [a, b]) {                  // resume, and play on
        g.justPressed.add('Escape');
        g.update(g.FIXED_DT);
        play(g, 1500);
      }
      // The whole dive, not a summary: a variable the snapshot forgets shows
      // up here as a difference.
      expect(b.saveText()).toBe(a.saveText());
    }), { numRuns: 12 });
  });

  it('keeps what persists across a reload, micro-task counters included', () => {
    const g = loadGame();
    g.meta.bank = 123;
    g.meta.gear.Gun = 2;
    g.meta.tasks['The Shelf'] = { untouched: 1 };
    g.meta.deepest = 4000;
    g.diveLive = false;
    const h = loadGame();
    expect(h.loadSave(g.saveText())).toBe('');
    expect(h.meta).toEqual(g.meta);
    expect(h.points()).toBe(1);
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
    expect(JSON.parse(g.saveText()).version).toBe(2);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(Number.isFinite(g.player.x) && Number.isFinite(g.cameraY)).toBe(true);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });

  it('loads a save written by the first build of version 2, and plays it on', () => {
    const text = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
    const g = loadGame();
    expect(g.loadSave(text)).toBe('');
    expect(g.meta.bank).toBeGreaterThan(0);
    expect(g.diveLive).toBe(true);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
  });
});

describe('the weapon record (D83)', () => {
  // Fires one shot to the right, as the player would: the trigger arms on a
  // released button, then the held button fires.
  const fire = g => {
    g.update(g.FIXED_DT);
    g.aim.x = g.player.x + 100;
    g.aim.y = g.player.y - g.cameraY;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    return g.bullets[g.bullets.length - 1];
  };

  it('puts the carried weapon on the player, and fires every shot on its numbers', () => {
    // A railgun is a line of data only if nothing about a shot is a constant.
    const g = loadGame();
    const w = g.WEAPONS[0];
    Object.assign(w, { fireRate: 7, damage: 3, range: 120, shotSpeed: 900, shotRadius: 9, pierce: 2 });
    g.reset(1);
    for (const k of ['fireRate', 'damage', 'range', 'shotSpeed', 'shotRadius', 'pierce']) {
      expect(g.player[k]).toBe(w[k]);
    }
    const b = fire(g);
    expect([b.speed, b.r, b.maxTravel, b.pierce]).toEqual([900, 9, 120, 2]);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(900);
  });

  it('gives each tier its own cost and effect, and counts only the carried weapon\'s', () => {
    const g = loadGame();
    const w = g.WEAPONS[0];
    w.tiers = [{ cost: 10, apply: p => { p.pierce += 1; } },
               { cost: 20, apply: p => { p.damage += 2; } }];
    g.meta.bank = 25;
    g.buy(w);
    g.buy(w);                                    // 15 left, the second costs 20
    expect([g.meta.gear[w.name], g.meta.bank]).toEqual([1, 15]);
    // A second weapon, upgraded but left at home, adds nothing to the dive;
    // equipment, worn by its owner whatever is carried, does.
    g.WEAPONS.push({ ...w, name: 'Spear', tiers: [{ cost: 0, apply: p => { p.range += 1000; } }] });
    g.meta.gear.Spear = 1;
    g.EQUIPMENT.push({ name: 'Mask', tiers: [{ cost: 0, apply: p => { p.iframes += 1; } }] });
    g.meta.gear.Mask = 1;
    g.reset(1);
    expect([g.player.pierce, g.player.damage, g.player.range]).toEqual([w.pierce + 1, w.damage, w.range]);
    expect(g.player.iframes).toBe(g.PLAYER_START.iframes + 1);
  });
});

describe('enemies placed by hand (D37)', () => {
  it('clears a scenario\'s lone enemy like a gate, with no layer to pay into', () => {
    // ?dev=one-drifter&play: no batch has arrived, so no plan entry is current.
    const g = loadGame();
    expect(g.applyScenario('one-drifter', 1)).toBe(true);
    expect(clearAndWait(g)).toBe('mods');
    expect(g.rank).toBe(1);
    expect(g.meta.tasks).toEqual({});
  });
});
