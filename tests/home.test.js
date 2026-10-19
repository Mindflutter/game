// `home`'s economy: gear bought with gems, weapons owned and carried,
// equipment, attributes and their points, a new game. Designed in
// docs/specs/2026-09-30-s4-meta-loop-design.md.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait } from './harness.js';

describe('home: gear, points, challenges (D31, D36)', () => {
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

  it('pays a clean batch\'s rung, and spends its point on a step', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    clearAndWait(g, 0.1);                        // the first batch, untouched
    expect(g.meta.challenges.untouched).toBe(1);
    expect(g.notice).toContain('untouched');
    g.meta.challenges = { untouched: 1 };             // its point alone
    g.raise(reach(g));
    g.raise(reach(g));                           // the second step costs 2: nothing left
    expect(g.points()).toBe(0);
    expect(g.meta.raised['Dash reach']).toBe(1);
    g.reset(2);
    expect(g.player.dashSpeed).toBe(g.PLAYER_START.dashSpeed + 150);
  });

  it('pays untouched nothing for a batch that landed a hit', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    g.placeEnemy('eel', g.player.x, g.player.y);       // a real touch: the eel's (D108)
    g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 1);
    clearAndWait(g, 0.1);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([0, undefined]);
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

  it('keeps weapons, equipment and attributes on screens of their own, left by Back or Esc (D96, D114)', () => {
    const g = loadGame();
    g.openMenu('home');
    const row = (menu, label) => g.MENUS[menu].items.find(i => i.label === label);
    // What each row is, its name, without the tier or price after it.
    const names = menu => g.MENUS[menu].items.map(i => i.label.split('   ')[0]);
    expect(g.MENUS.home.items.map(i => i.label))
      .toEqual(['Dive', 'Weapons', 'Equipment', 'Attributes', 'Help', 'Options']);
    row('home', 'Weapons').run();
    expect(g.screen).toBe('weapons');
    expect(names('weapons')).toEqual([...g.WEAPONS.map(w => w.name), 'Back']);
    g.justPressed.add('Escape');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('home');
    row('home', 'Equipment').run();
    expect(g.screen).toBe('equipment');
    expect(names('equipment')).toEqual([...g.EQUIPMENT.map(e => e.name), 'Back']);
    row('equipment', 'Back').run();
    expect(g.screen).toBe('home');
    row('home', 'Attributes').run();
    expect(g.screen).toBe('attributes');
    expect(g.MENUS.attributes.items.some(i => i.label.startsWith('Dash reach'))).toBe(true);
    row('attributes', 'Back').run();
    expect(g.screen).toBe('home');
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
  const row = (g, name) => g.MENUS.weapons.items.find(i => i.label.startsWith(name + ' '));
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

  it('the Harpoon waits for a step of Strength, and its row says so', () => {
    const g = loadGame();
    g.meta.bank = 1000;
    expect(row(g, 'Harpoon').label).toContain('needs Strength 1');
    expect(row(g, 'Harpoon').dim).toBe(true);
    row(g, 'Harpoon').run();
    expect(g.meta.owned).toEqual(['Gun']);
    g.meta.challenges.untouched = 1;
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

  it('takes the first hit of a batch on the suit: no HP, the i-frames, the batch marked hit', () => {
    const g = wearing({ Suit: 1 });
    expect(g.guardLeft).toBe(1);
    g.placeEnemy('eel', g.player.x, g.player.y);       // it hurts on touch (D108)
    g.update(g.FIXED_DT);
    expect([g.player.hp, g.guardLeft, g.batchHit]).toEqual([g.player.maxHp, 0, true]);
    expect(g.player.hurt).toBeGreaterThan(0);
    for (let i = 0, n = ticks(g, g.player.iframes + 0.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 1);   // the next one costs HP
  });

  it('guards a spit shot like a bite, and spends the shot', () => {
    const g = wearing({ Suit: 1 });
    g.placeEnemy('archer', g.player.x + 200, g.player.y);
    g.enemies[0].phaseTime = 2;
    for (let i = 0, n = ticks(g, 1.1); i < n; i++) g.update(g.FIXED_DT);
    expect([g.player.hp, g.guardLeft]).toEqual([g.player.maxHp, 0]);
    expect(g.bullets.filter(b => b.evil)).toHaveLength(0);
  });

  it('takes a hit whole on one charge, whatever its damage (D118)', () => {
    const g = wearing({ Suit: 1 });
    g.placeEnemy('eel', g.player.x, g.player.y);
    g.enemies[0].touch = 2;
    g.update(g.FIXED_DT);
    expect([g.player.hp, g.guardLeft]).toEqual([g.player.maxHp, 0]);
    for (let i = 0, n = ticks(g, g.player.iframes + 0.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp - 2);
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
  const attr = (g, name) => g.ATTRIBUTES.find(a => a.name === name);
  // Points enough, from one ladder's rungs: 1, 3, 6... (D109).
  const earn = (g, rungs) => { g.meta.challenges = { untouched: rungs }; };

  it('raises max HP with Heart, full, and the dash\'s wound with Strength', () => {
    const g = loadGame();
    earn(g, 2);
    g.raise(attr(g, 'Heart'));
    g.raise(attr(g, 'Strength'));
    g.reset(1);
    expect([g.player.maxHp, g.player.hp]).toEqual([g.PLAYER_START.maxHp + 1, g.PLAYER_START.hp + 1]);
    expect(g.player.dashDamage).toBe(g.PLAYER_START.dashDamage + 1);
  });

  it('owns or buys nothing that requires more steps than are raised, and takes no gems', () => {
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

  it('prices step n of an attribute at n points, against what the rungs paid', () => {
    const g = loadGame();
    g.meta.challenges = { untouched: 2, flurry: 1 };   // 1 + 2, and 1
    expect(g.points()).toBe(4);
    const heart = attr(g, 'Heart');
    const row = () => g.MENUS.attributes.items.find(i => i.label.startsWith('Heart'));
    expect(row().label).toContain('0 → 1   1 point');
    g.raise(heart);
    g.raise(heart);                              // 1, then 2
    expect([g.points(), g.meta.raised.Heart]).toEqual([1, 2]);
    expect(row().label).toContain('2 → 3   3 points');
    expect(row().dim).toBe(true);
    g.raise(heart);                              // the third costs 3: refused
    expect([g.points(), g.meta.raised.Heart]).toEqual([1, 2]);
  });
});

describe('a new game (D103)', () => {
  // A player with something to lose -- gems, gear, a point, a layer cleared --
  // back on the title in the middle of a dive, all of it saved.
  function invested() {
    const g = loadGame();
    Object.assign(g.meta, { bank: 300, gear: { Mask: 2 }, raised: { Heart: 1 },
                            challenges: { untouched: 1 }, cleared: 1, deepest: 4000 });
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
