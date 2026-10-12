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

// Marks the first card, whatever it is, and presses Continue (D85).
function pick(g) {
  g.justPressed.add('Digit1');
  g.justPressed.add('Enter');
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
    // Igor, 2026-10-12: "make it dive again + go home buttons choice" (D90).
    // Go home is marked, so a stray Enter or Space -- Space is the dash -- does
    // what any key did before; diving again is a choice.
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
    clearAndWait(g, 0.1);                        // the first batch, untouched
    expect(g.points()).toBe(1);
    expect(g.notice).not.toBe('');
    ride(g);
    g.notice = '';
    clearAndWait(g, 0.1);                        // a second clean batch, same layer
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
    clearAndWait(g, 0.1);
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
    g.justPressed.add('Enter');                  // Continue: straight back into the dive,
    g.update(g.FIXED_DT);                        // not onto its pause menu (D90)
    expect(g.screen).toBe('playing');
  });

  it('keeps a layer\'s micro-tasks by its number, whatever it is called', () => {
    // Layers are numbered until they are named (D89): renaming one must not
    // forget what it has already paid, on the save or on `home`.
    const g = loadGame();
    g.reset(1);
    ride(g);
    clearAndWait(g, 0.1);                        // a clean first batch: the task pays
    expect(g.points()).toBe(1);
    g.LAYERS[0].name = 'Somewhere Else';
    g.reset(2);
    ride(g);
    g.notice = '';
    clearAndWait(g, 0.1);                        // a clean batch of the renamed layer
    expect(g.points()).toBe(1);                  // pays nothing: the task is still done
    expect(g.notice).toBe('');
    expect(g.MENUS.home.lines[0].text).toContain('Somewhere Else');
    expect(g.MENUS.home.lines[0].text).toContain('\u2713');
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

  it('keeps what persists across a reload, micro-task counters included', () => {
    const g = loadGame();
    g.meta.bank = 123;
    g.meta.gear.Gun = 2;
    g.meta.tasks[0] = { untouched: 1 };
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
    expect(JSON.parse(g.saveText()).version).toBe(3);
    // Its micro-tasks were kept by layer name; they come back by number (D89).
    expect(g.meta.tasks).toEqual({ 0: { untouched: 1 } });
    expect(g.points()).toBe(1);
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
    expect(Number.isFinite(g.player.x) && Number.isFinite(g.cameraY)).toBe(true);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(finite)).toBe(true);
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
    expect(g.meta.tasks).toEqual({ 0: { untouched: 1 } });   // by number now (D89)
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
    // A gate opens no cards (D85), so play simply goes on.
    const g = loadGame();
    expect(g.applyScenario('one-drifter', 1)).toBe(true);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect(g.meta.tasks).toEqual({});
  });
});
