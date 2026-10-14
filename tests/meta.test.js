// The dive through the layers, `home`'s economy, and the save -- built in S4
// (meta loop skeleton), designed in
// docs/specs/2026-09-30-s4-meta-loop-design.md. Each test names
// the decision it guards.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, atGate, die } from './harness.js';
import { botInput } from './bot.js';

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

  // `slow` puts a batch past `swift`'s time, so these clears pay `untouched` alone.
  const slow = g => { g.batchTime = 1e6; };

  it('pays a point for a clean batch, once per layer, and spends it on reach', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    slow(g);
    clearAndWait(g, 0.1);                        // the first batch, untouched
    expect(g.points()).toBe(1);
    expect(g.notice).not.toBe('');
    ride(g);
    g.notice = '';
    slow(g);
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
    g.placeEnemy('eel', g.player.x, g.player.y);       // a real touch: the eel's (D108)
    g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 1);
    slow(g);
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

  it('keeps gear and attributes on screens of their own, left by Back or Esc (D96)', () => {
    const g = loadGame();
    g.openMenu('home');
    const row = (menu, label) => g.MENUS[menu].items.find(i => i.label === label);
    expect(g.MENUS.home.items.map(i => i.label)).toEqual(['Dive', 'Gear', 'Attributes', 'Help', 'Options']);
    row('home', 'Gear').run();
    expect(g.screen).toBe('gear');
    expect(g.MENUS.gear.items.some(i => i.label.startsWith('Gun'))).toBe(true);
    g.justPressed.add('Escape');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('home');
    row('home', 'Attributes').run();
    expect(g.screen).toBe('attributes');
    expect(g.MENUS.attributes.items.some(i => i.label.startsWith('Dash reach'))).toBe(true);
    row('attributes', 'Back').run();
    expect(g.screen).toBe('home');
  });

  it('keeps a layer\'s micro-tasks by its number, whatever it is called', () => {
    // Layers are numbered until they are named (D89): renaming one must not
    // forget what it has already paid, on the save or on `home`.
    const g = loadGame();
    g.reset(1);
    ride(g);
    slow(g);
    clearAndWait(g, 0.1);                        // a clean first batch: the task pays
    expect(g.points()).toBe(1);
    g.LAYERS[0].name = 'Somewhere Else';
    g.reset(2);
    ride(g);
    g.notice = '';
    slow(g);
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
    expect(JSON.parse(g.saveText()).version).toBe(g.freshMeta().version);
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
    g.screen = g.resumeTo;
    g.immortal = true;
    const shots = shotsSeen(g, 600);
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
    g.EQUIPMENT.push({ name: 'Charm', tiers: [{ cost: 0, apply: p => { p.iframes += 1; } }] });
    g.meta.gear.Charm = 1;
    g.reset(1);
    expect([g.player.pierce, g.player.damage, g.player.range]).toEqual([w.pierce + 1, w.damage, w.range]);
    expect(g.player.iframes).toBe(g.PLAYER_START.iframes + 1);
  });
});

describe('owning and carrying weapons (D97)', () => {
  // A second weapon for the test alone, with a tier of its own.
  const spear = g => {
    const w = { ...g.WEAPONS[0], name: 'Spear', fireRate: 9, cost: 50,
                tiers: [{ cost: 10, apply: p => { p.damage += 5; } }] };
    g.WEAPONS.push(w);
    return w;
  };
  const gun = g => g.WEAPONS.find(w => w.name === 'Gun');

  it('starts owning and carrying the Gun, which a dive then carries', () => {
    const g = loadGame();
    expect([g.meta.owned, g.meta.carried]).toEqual([['Gun'], 'Gun']);
    g.reset(1);
    expect(g.weaponName).toBe('Gun');
    expect(g.player.fireRate).toBe(gun(g).fireRate);
  });

  it('owns a weapon for its gems and carries it at once; carrying an owned one is free', () => {
    const g = loadGame();
    const w = spear(g);
    g.pickWeapon(w);                             // 0 gems owns nothing
    expect([g.meta.owned, g.meta.carried]).toEqual([['Gun'], 'Gun']);
    g.meta.bank = 80;
    g.pickWeapon(w);
    expect([g.meta.owned, g.meta.carried, g.meta.bank]).toEqual([['Gun', 'Spear'], 'Spear', 30]);
    g.pickWeapon(gun(g));
    expect([g.meta.carried, g.meta.bank]).toEqual(['Gun', 30]);
    expect(JSON.parse(g.saved).carried).toBe('Gun');   // written at once
  });

  it('raises the carried weapon\'s tier from its row, and a dive carries its numbers alone', () => {
    const g = loadGame();
    const w = spear(g);
    g.meta.bank = 60;
    g.pickWeapon(w);                             // owned and carried
    g.pickWeapon(w);                             // its first tier
    expect([g.meta.gear.Spear, g.meta.bank]).toEqual([1, 0]);
    g.reset(1);
    expect([g.weaponName, g.player.fireRate, g.player.damage]).toEqual(['Spear', 9, gun(g).damage + 5]);
    g.pickWeapon(gun(g));
    g.reset(2);                                  // the Spear left at home adds nothing
    expect([g.weaponName, g.player.fireRate, g.player.damage]).toEqual(['Gun', gun(g).fireRate, gun(g).damage]);
  });

  it('carries the Gun when the save names a weapon that is not there', () => {
    const g = loadGame();
    g.meta.carried = 'Trident';
    g.reset(1);
    expect(g.weaponName).toBe('Gun');
    expect(g.player.fireRate).toBe(gun(g).fireRate);
  });

  it('lets a scenario name the weapon carried, whatever home chose', () => {
    const g = loadGame();
    spear(g);
    g.SCENARIOS.probe = { weapon: 'Spear', spawn: false };
    g.applyScenario('probe', 1);
    expect([g.weaponName, g.player.fireRate, g.meta.carried]).toEqual(['Spear', 9, 'Gun']);
  });

  it('keeps the weapon carried with a saved dive', () => {
    const a = loadGame();
    spear(a);
    a.meta.owned.push('Spear');
    a.meta.carried = 'Spear';
    a.reset(1);
    const b = loadGame();
    spear(b);
    expect(b.loadSave(a.saveText())).toBe('');
    expect([b.weaponName, b.meta.carried, b.meta.owned]).toEqual(['Spear', 'Spear', ['Gun', 'Spear']]);
  });

  it('migrates a version 3 save to owning and carrying the Gun', () => {
    const g = loadGame();
    const text = readFileSync(new URL('./fixtures/save-v3.json', import.meta.url), 'utf8');
    expect(g.loadSave(text)).toBe('');
    expect([g.meta.version, g.meta.owned, g.meta.carried, g.weaponName])
      .toEqual([g.freshMeta().version, ['Gun'], 'Gun', 'Gun']);   // migrated all the way
  });
});

describe('the weapons (D97)', () => {
  const row = (g, name) => g.MENUS.gear.items.find(i => i.label.startsWith(name + ' '));
  // Fishes in a line to the diver's right, `gap` px apart, and one shot fired
  // at them: the trigger arms on a released button, then the held one fires.
  const lineAndFire = (g, n, gap) => {
    g.queuePaused = true;
    for (let i = 1; i <= n; i++) g.placeEnemy('drifter', g.player.x + 60 + i * gap, g.player.y);
    g.update(g.FIXED_DT);
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    return g.bullets.find(b => !b.evil);
  };

  // The Knife's swing (D105): fish at `dist` px from the diver at `deg`
  // degrees off the aim, then one swing aimed straight right.
  const swingAt = (g, fish) => {
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    g.immortal = true;
    for (const [name, dist, deg] of fish) {
      const a = deg * Math.PI / 180;
      g.placeEnemy(name, g.player.x + Math.cos(a) * dist, g.player.y + Math.sin(a) * dist);
    }
    for (const e of g.enemies) e.speed = 0;                 // held where placed
    g.update(g.FIXED_DT);
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    return g;
  };
  const knife = g => g.WEAPONS.find(w => w.name === 'Knife');

  it('the Knife swings: no shot, and every fish in its arc is cut at once', () => {
    const g = loadGame();
    const half = knife(g).swing.arc / 2;
    swingAt(g, [['drifter', 50, 0], ['drifter', 50, half - 5], ['drifter', 50, -(half - 5)],
                ['drifter', 50, 180]]);                       // behind: untouched
    expect(g.bullets.filter(b => !b.evil)).toEqual([]);
    expect(g.kills).toBe(3);
    expect(g.enemies.map(e => Math.round(e.x - g.player.x))).toEqual([-50]);
  });

  it('cuts a fish its body reaches into, and none further', () => {
    const g = loadGame();
    const w = knife(g), r = g.enemyType('drifter').r;
    const reach = w.range + w.shotRadius + r;
    swingAt(g, [['drifter', reach - 1, 0], ['drifter', reach + 1, 40]]);
    expect(g.kills).toBe(1);
    const h = loadGame();
    swingAt(h, [['drifter', 60, w.swing.arc / 2 + 10]]);       // its body overlaps the edge
    expect(h.kills).toBe(1);
  });

  it('cuts pierce + 1 fish at most, nearest first', () => {
    const g = loadGame();
    const n = knife(g).pierce + 1;
    const fish = Array.from({ length: n + 2 }, (_, i) => ['drifter', 30 + i * 6, i % 2 ? 20 : -20]);
    swingAt(g, fish);
    expect(g.kills).toBe(n);
    const left = g.enemies.map(e => Math.round(Math.hypot(e.x - g.player.x, e.y - g.player.y)));
    expect(left.sort()).toEqual(fish.slice(n).map(f => f[1]));
  });

  it('swings again only after its cooldown', () => {
    const g = loadGame();
    swingAt(g, [['bulwark', 50, 0]]);
    const hp = g.enemies[0].hp;
    expect(hp).toBe(g.enemyType('bulwark').hp - g.player.damage);
    g.keys.add('Mouse0');
    for (let i = 0, n = Math.floor(1 / g.player.fireRate / g.FIXED_DT) - 2; i < n; i++) g.update(g.FIXED_DT);
    expect(g.enemies[0].hp).toBe(hp);
    for (let i = 0; i < 4; i++) g.update(g.FIXED_DT);
    expect(g.enemies[0].hp).toBe(hp - g.player.damage);
  });

  it('the Harpoon waits for a point of Strength, and its row says so', () => {
    const g = loadGame();
    g.meta.bank = 1000;
    expect(row(g, 'Harpoon').label).toContain('needs Strength 1');
    expect(row(g, 'Harpoon').dim).toBe(true);
    row(g, 'Harpoon').run();
    expect(g.meta.owned).toEqual(['Gun']);
    g.meta.tasks[0] = { untouched: 1 };
    g.raise(g.ATTRIBUTES.find(a => a.name === 'Strength'));
    expect(row(g, 'Harpoon').label).not.toContain('needs');
    expect(row(g, 'Harpoon').dim).toBe(false);
    row(g, 'Harpoon').run();
    expect([g.meta.owned, g.meta.carried]).toEqual([['Gun', 'Harpoon'], 'Harpoon']);
  });

  it('the Harpoon fires a slow, long shot that goes through two fish into a third', () => {
    const g = loadGame();
    expect(g.applyScenario('harpoon', 1)).toBe(true);
    expect(g.weaponName).toBe('Harpoon');
    const w = g.WEAPONS.find(x => x.name === 'Harpoon');
    const b = lineAndFire(g, 4, 30);
    expect([b.speed, b.maxTravel, b.pierce]).toEqual([w.shotSpeed, w.range, w.pierce]);
    for (let i = 0; i < 60; i++) g.update(g.FIXED_DT);
    expect(g.kills).toBe(w.pierce + 1);
  });
});

describe('equipment (D100)', () => {
  // A dive with `tiers` of each named piece bought, nothing arriving.
  const wearing = (pieces, seed = 1) => {
    const g = loadGame();
    Object.assign(g.meta.gear, pieces);
    g.reset(seed);
    g.queuePaused = true;
    return g;
  };

  it('puts each piece\'s tiers on the diver: the mask\'s reach, the weights\' damage, the suit\'s guard', () => {
    const g = wearing({ Mask: 2, Weights: 3, Suit: 1 });
    const gun = g.WEAPONS[0];
    expect([g.player.range, g.player.damage, g.player.guard]).toEqual([gun.range + 60, gun.damage + 1.5, 1]);
  });

  it('takes the first hit of a batch on the suit: no heart, the i-frames, the batch marked hit', () => {
    const g = wearing({ Suit: 1 });
    expect(g.guardLeft).toBe(1);
    g.placeEnemy('eel', g.player.x, g.player.y);       // it hurts on touch (D108)
    g.update(g.FIXED_DT);
    expect([g.player.hp, g.guardLeft, g.batchHit]).toEqual([g.player.maxHp, 0, true]);
    expect(g.player.hurt).toBeGreaterThan(0);
    for (let i = 0, n = ticks(g, g.player.iframes + 0.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 1);   // the next one is a heart
  });

  it('guards a spit shot like a bite, and spends the shot', () => {
    const g = wearing({ Suit: 1 });
    g.placeEnemy('archer', g.player.x + 200, g.player.y);
    g.enemies[0].phaseTime = 2;
    for (let i = 0, n = ticks(g, 1.1); i < n; i++) g.update(g.FIXED_DT);
    expect([g.player.hp, g.guardLeft]).toEqual([g.player.maxHp, 0]);
    expect(g.bullets.filter(b => b.evil)).toHaveLength(0);
  });

  it('refills the guard as each batch arrives', () => {
    const g = loadGame();
    g.meta.gear.Suit = 2;
    g.reset(1);
    g.guardLeft = 0;
    ride(g);                                     // the first batch arrives
    expect(g.enemies.length).toBeGreaterThan(0);
    expect(g.guardLeft).toBe(2);
  });

  it('keeps the guard left with a saved dive', () => {
    const a = wearing({ Suit: 3 });
    a.guardLeft = 1;
    const b = loadGame();
    expect(b.loadSave(a.saveText())).toBe('');
    expect([b.guardLeft, b.player.guard]).toEqual([1, 3]);
  });
});

describe('attributes and requirements (D98)', () => {
  const mini = g => g.plan.findIndex(e => e.batch.enemies.some(([n]) => n === 'mini-boss'));
  // The first batch of gate `k` arrived, the diver kept alive.
  const fighting = k => { const g = atGate(k); g.immortal = true; ride(g); return g; };

  it('pays swift for a batch cleared inside its time, and not after', () => {
    const quick = fighting(0);
    quick.batchHit = true;                       // so only swift can pay
    for (let i = 0, n = ticks(quick, 1); i < n; i++) quick.update(quick.FIXED_DT);
    clearAndWait(quick, 0.1);
    expect(quick.meta.tasks[0]).toEqual({ swift: 1 });
    const late = fighting(0);
    late.batchHit = true;
    for (let i = 0, n = ticks(late, 10.5); i < n; i++) late.update(late.FIXED_DT);
    clearAndWait(late, 0.1);
    expect(late.meta.tasks[0]).toBe(undefined);
  });

  it('pays footwork for a mini-boss beaten without a dash, and not with one, or for any other batch', () => {
    const k = mini(atGate(0));
    const clean = fighting(k);
    clean.batchHit = true;
    clean.batchTime = 1e6;                       // so only footwork can pay
    clearAndWait(clean, 0.1);
    expect(clean.meta.tasks[0]).toEqual({ footwork: 1 });
    const dashed = fighting(k);
    dashed.keys.add('KeyD');
    dashed.justPressed.add('Space');
    dashed.update(dashed.FIXED_DT);
    expect(dashed.batchDashed).toBe(true);
    dashed.batchHit = true;
    dashed.batchTime = 1e6;
    clearAndWait(dashed, 0.1);
    expect(dashed.meta.tasks[0]).toBe(undefined);
    const ordinary = fighting(1);
    ordinary.batchHit = true;
    ordinary.batchTime = 1e6;
    clearAndWait(ordinary, 0.1);
    expect(ordinary.meta.tasks[0]).toBe(undefined);
  });

  it('keeps a batch\'s clock and its dash with a saved dive', () => {
    const a = fighting(0);
    Object.assign(a, { batchTime: 4.5, batchDashed: true });
    const b = loadGame();
    expect(b.loadSave(a.saveText())).toBe('');
    expect([b.batchTime, b.batchDashed]).toEqual([4.5, true]);
  });

  const attr = (g, name) => g.ATTRIBUTES.find(a => a.name === name);
  const earn = (g, n) => { for (let l = 0; l < n; l++) g.meta.tasks[l] = { untouched: 1 }; };

  it('raises a heart with Heart, full, and the dash\'s wound with Strength', () => {
    const g = loadGame();
    earn(g, 2);
    g.raise(attr(g, 'Heart'));
    g.raise(attr(g, 'Strength'));
    g.reset(1);
    expect([g.player.maxHp, g.player.hp]).toEqual([g.PLAYER_START.maxHp + 1, g.PLAYER_START.hp + 1]);
    expect(g.player.dashDamage).toBe(g.PLAYER_START.dashDamage + 1);
  });

  it('owns or buys nothing that requires more points than are spent, and takes no gems', () => {
    const g = loadGame();
    const w = { ...g.WEAPONS[0], name: 'Spear', cost: 10, requires: { Strength: 1 }, tiers: [] };
    const piece = { name: 'Belt', requires: { Heart: 2 }, tiers: [{ cost: 10, apply: p => { p.damage += 1; } }] };
    g.WEAPONS.push(w);
    g.EQUIPMENT.push(piece);
    g.meta.bank = 100;
    g.pickWeapon(w);
    g.buy(piece);
    expect([g.meta.owned, g.meta.gear.Belt, g.meta.bank]).toEqual([['Gun'], undefined, 100]);
    earn(g, 3);
    g.raise(attr(g, 'Strength'));
    g.raise(attr(g, 'Heart'));
    g.buy(piece);                                // Heart 1 of the 2 it needs
    expect(g.meta.gear.Belt).toBe(undefined);
    g.raise(attr(g, 'Heart'));
    g.pickWeapon(w);
    g.buy(piece);
    expect([g.meta.owned, g.meta.gear.Belt, g.meta.bank]).toEqual([['Gun', 'Spear'], 1, 80]);
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
    within('micro-tasks', g.TASKS.length, 3, 3);
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
    expect(g.meta.tasks).toEqual({});
  });
});

describe('a new game (D103)', () => {
  // A player with something to lose -- gems, gear, a point, a layer cleared --
  // back on the title in the middle of a dive, all of it saved.
  function invested() {
    const g = loadGame();
    Object.assign(g.meta, { bank: 300, gear: { Mask: 2 }, spent: { Heart: 1 },
                            tasks: { 0: { untouched: 1 } }, cleared: 1, deepest: 4000 });
    g.reset(5);
    g.saveNow();
    g.openMenu('title');
    return g;
  }
  const press = (g, code) => { g.justPressed.add(code); g.update(g.FIXED_DT); };
  const newGame = g => g.MENUS.title.items.at(-1);

  it("is the title's last row, and asks first, Cancel marked", () => {
    const g = invested();
    expect(newGame(g).label).toBe('New game');
    newGame(g).run();
    expect(g.screen).toBe('newGame');
    expect(g.MENUS.newGame.items[0].label).toBe('Cancel');
  });

  it('erases nothing on a stray Enter, nor on Esc', () => {
    const g = invested();
    const kept = JSON.stringify(g.meta), disk = g.saved;
    newGame(g).run();
    press(g, 'Enter');
    expect(g.screen).toBe('title');
    newGame(g).run();
    press(g, 'Escape');
    expect(g.screen).toBe('title');
    expect(JSON.stringify(g.meta)).toBe(kept);
    expect(g.diveLive).toBe(true);
    expect(g.saved).toBe(disk);
  });

  it('erases everything once confirmed -- what persists, the dive and the save -- and starts at home', () => {
    const g = invested();
    newGame(g).run();
    g.MENUS.newGame.items[1].run();
    expect(g.screen).toBe('home');
    expect(g.meta).toEqual(g.freshMeta());
    expect(g.diveLive).toBe(false);
    const reloaded = loadGame();
    expect(reloaded.loadSave(g.saved)).toBe('');
    expect(reloaded.meta).toEqual(reloaded.freshMeta());
    expect(reloaded.diveLive).toBe(false);
    g.openMenu('title');
    expect(g.MENUS.title.items[0].label).toBe('Start');
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
    expect(text(g)).toContain(g.enemies.length + ' fish left');
  });

  it('shows the weapon and its tier, the guard left, the mods held and the layer\'s tasks', () => {
    const g = loadGame();
    g.meta.gear.Gun = 2;
    g.meta.tasks[0] = { swift: 1 };
    g.reset(1);
    g.player.guard = 2;
    g.guardLeft = 1;
    g.modCounts = { Impact: 2 };
    const t = text(g);
    expect(t).toContain('Gun tier 2');
    expect(t).toContain('GUARD 1/2');
    expect(t).toContain('Impact ×2');
    expect(t).toContain('swift ✓');
    expect(t).toContain('untouched –');
  });
});
