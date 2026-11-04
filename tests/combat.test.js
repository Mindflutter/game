// The fight itself: the trigger, shots, the dash, touch, gems, and what a
// clear or a death does on the tick it lands.
import { describe, it, expect } from 'vitest';
import { loadGame, play, until, fishAt, atGate, clearAndWait, ride } from './harness.js';

// A fish that hurts on touch (D108): these checks are about touch, i-frames
// and the dash, not any one attack.
const mob = (x, y, over) => Object.assign(
  { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, value: 1, lastHitBy: 0,
    pushX: 0, pushY: 0, vx: 0, vy: 0, touch: { damage: 1, knock: 0 } }, over);

// A bullet, built the way the weapon builds one, so no check hand-rolls a
// literal that misses a field -- a bullet without `speed` would fly forever,
// since `NaN >= maxTravel` is false.
const shot = (g, over = {}) => {
  const b = Object.assign({ id: ++g.bulletId, weapon: true, x: g.player.x, y: g.player.y, r: g.player.shotRadius,
                            vx: g.player.shotSpeed, vy: 0, pierce: 0,
                            travelled: 0, maxTravel: 300 }, over);
  b.speed = Math.hypot(b.vx, b.vy);
  g.bullets.push(b);
  return b;
};

// A real press arms the trigger with a frame up first (D47); these start
// mid-press, so they arm it.
const holdFire = g => { g.fireArmed = true; g.keys.add('Mouse0'); };
const fireAt = (g, e) => { g.aim.x = e.x; g.aim.y = e.y; holdFire(g); };
const run = (g, n, dt = 1 / 60) => { for (let i = 0; i < n; i++) g.update(dt); };

// A fresh dive, the queue stopped so nothing arrives and muddies the result.
const quiet = (seed = 1) => {
  const g = loadGame();
  g.reset(seed);
  g.queuePaused = true;
  return g;
};

// Face right, hold right, tap Space, run the dash out, release -- in one
// place, so no check forgets the release. A dash goes along the facing (D107).
const dashRight = (g, ticks = 20, dt = 1 / 60) => {
  g.player.facing = 0;
  g.keys.add('KeyD');
  g.justPressed.add('Space');
  run(g, ticks, dt);
  g.keys.delete('KeyD');
};
const mod = (g, name) => g.MODS.find(m => m.name === name);

describe('the trigger (D28, D47)', () => {
  it('fires nothing without the trigger, even with a fish in the ring', () => {
    const g = quiet();
    g.enemies.push(mob(g.player.x + 60, g.player.y));
    g.aim.x = g.player.x + 200; g.aim.y = g.player.y;
    run(g, 120);
    expect([g.bullets.length, g.kills]).toEqual([0, 0]);
  });

  it('fires toward the cursor, not at the nearest fish', () => {
    // The fish to the left, the cursor to the right: a weapon aiming at the
    // nearest fish fires left.
    const g = quiet();
    g.enemies.push(mob(g.player.x - 60, g.player.y));
    g.aim.x = g.player.x + 500; g.aim.y = g.player.y;
    holdFire(g);
    g.update(1 / 60);
    expect(g.bullets).toHaveLength(1);
    expect(g.bullets[0].vx).toBeGreaterThan(0);
  });

  it('fires into open water: nothing need be in range', () => {
    const g = quiet();
    g.aim.x = g.player.x + 300; g.aim.y = g.player.y;
    holdFire(g);
    g.update(1 / 60);
    expect(g.bullets).toHaveLength(1);
  });

  it('banks no shots while the trigger is up, and the first after a wait is immediate', () => {
    const g = quiet();
    run(g, 300);
    expect(g.player.fireTimer).toBe(0);
    holdFire(g);
    g.update(1 / 60);
    expect(g.bullets).toHaveLength(1);
  });

  it('fires about fireRate shots a second when held, not one a frame', () => {
    const g = quiet();
    holdFire(g);
    g.aim.x = g.player.x + 300; g.aim.y = g.player.y;
    run(g, 60);
    expect(Math.abs(g.bulletId - g.player.fireRate)).toBeLessThanOrEqual(1);
  });

  it('never fires on a click a menu took, only on a fresh press after it', () => {
    // The menu reads the edge (justPressed) and the weapon the held state
    // (keys), so one physical click could be read twice. This one is on
    // `home`'s Dive row.
    const g = loadGame();
    g.reset(1);
    g.screen = 'home';
    g.menuIndex = 0;
    g.aim.x = g.ARENA_W / 2; g.aim.y = g.HOME_TOP;
    g.keys.add('Mouse0'); g.justPressed.add('Mouse0');
    g.update(1 / 60);
    expect(g.screen).toBe('playing');
    g.queuePaused = true;
    run(g, 10);                                // the button still down
    expect([g.bullets.length, g.bulletId]).toEqual([0, 0]);
    g.keys.delete('Mouse0');
    g.update(1 / 60);
    g.keys.add('Mouse0');
    g.update(1 / 60);
    expect(g.bulletId).toBe(1);
  });
});

describe('shots', () => {
  it('die once they have flown their range', () => {
    const g = loadGame();
    g.reset();
    shot(g, { x: 100, y: 400, maxTravel: 200 });
    run(g, 40);                                // long enough to fly 280px
    expect(g.bullets).toHaveLength(0);
  });

  it('die at their own range at their own speed, not the weapon\'s', () => {
    const g = quiet();
    shot(g, { x: 100, y: 400, vx: 2000, maxTravel: 200 });
    for (let i = 0; i < 40 && g.bullets.length; i++) g.update(g.FIXED_DT);
    expect(g.bullets).toHaveLength(0);
  });

  it('pierce, hitting each fish once', () => {
    const g = loadGame();
    g.reset();
    const tank = mob(g.player.x + 100, g.player.y, { hp: 3, maxHp: 3 });
    g.enemies.push(tank);
    g.player.fireTimer = 999;                  // silence the weapon
    shot(g, { pierce: 2 });
    run(g, 30);
    expect(tank.hp).toBe(2);
  });

  it('never tunnel a thin fish at railgun speed (D53)', () => {
    // 6000px/s is 50px a tick against a 6px fish. Placed at +325, halfway
    // between two samples: at +300 a point test would hit it by arithmetic luck.
    const g = quiet();
    const thin = mob(g.player.x + 325, g.player.y, { r: 6, hp: 5, maxHp: 5 });
    g.enemies.push(thin);
    shot(g, { vx: 6000, maxTravel: 900 });
    for (let i = 0; i < 20 && thin.hp === 5; i++) g.update(g.FIXED_DT);
    expect(thin.hp).toBe(4);
  });

  it('leave a tough fish alive, hurt, and throw sparks off it', () => {
    // A hit that does not kill must still show, or damage looks like nothing.
    const g = loadGame();
    g.reset();
    const tough = mob(g.player.x + 90, g.player.y, { hp: 9, maxHp: 9 });
    g.enemies.push(tough);
    fireAt(g, tough);
    until(g, 1, () => tough.hp < 9);
    expect(tough.hp < 9 && g.kills === 0).toBe(true);
    expect(g.particles.length).toBeGreaterThan(0);
  });

  it('kill a one-hit fish, which drops its value in gems', () => {
    // In flight or already in the purse: gems fly to you from the drop (D35).
    for (const value of [1, 3]) {
      const g = loadGame();
      g.reset();
      const fish = mob(g.player.x + 150, g.player.y, { maxHp: 6, value });
      g.enemies.push(fish);
      fireAt(g, fish);
      run(g, 60, 0.016);
      expect(g.kills).toBe(1);
      expect(g.gems.length + g.currency).toBe(value);
    }
  });
});

describe('touch and gems', () => {
  it('costs its touch once for a fish walking into a standing diver, not twice (D118)', () => {
    const g = loadGame();
    g.reset();
    g.enemies.push(mob(g.player.x + 200, g.player.y, { speed: 100, hp: 999, maxHp: 999, touch: { damage: 2, knock: 0 } }));
    run(g, 150, 0.016);                        // 2.4s: touches once, not twice
    expect(g.player.hp).toBe(g.player.maxHp - 2);
  });

  it('pays a collected gem into the purse and opens nothing (D34)', () => {
    const g = loadGame();
    g.reset();
    g.gems.push({ x: g.player.x, y: g.player.y, r: 4 });
    g.update(0.016);
    expect(g.currency).toBe(1);
    expect([g.choices.length, g.screen]).toEqual([0, 'playing']);
  });
});

describe('the +N (D35)', () => {
  const pay = (g, n) => {
    for (let i = 0; i < n; i++) g.gems.push({ x: g.player.x, y: g.player.y, r: 4 });
    g.update(g.FIXED_DT);
  };

  it('sums a run of gems into one, held a while after the last, then starts again from one', () => {
    const g = quiet();
    pay(g, 3);
    expect([g.currency, g.gemPop.n]).toEqual([3, 3]);
    play(g, g.GEM_POP / 2);
    pay(g, 1);                                   // the hold starts again
    play(g, g.GEM_POP / 2 + 0.05);
    expect(g.gemPop.n).toBe(4);
    play(g, g.GEM_POP / 2);
    expect(g.gemPop.n).toBe(0);
    pay(g, 1);
    expect(g.gemPop.n).toBe(1);
  });

  it('flies to the counter when its hold ends; the counter holds it back until it lands, then bumps', () => {
    const g = quiet();
    pay(g, 3);
    expect(g.statusLines()[0].text).toContain('GEMS 0 ');
    play(g, g.GEM_POP + 0.01);
    expect([g.gemPop.n, g.gemPop.flyN]).toEqual([0, 3]);
    expect(g.statusLines()[0].text).toContain('GEMS 0 ');
    play(g, g.GEM_FLY);
    expect(g.gemPop.flyN).toBe(0);
    expect(g.gemPop.bump).toBeGreaterThan(0);
    expect(g.statusLines()[0].text).toContain('GEMS 3 ');
  });

  it('shows every gem at once when the dive ends mid-flight', () => {
    const g = quiet();
    pay(g, 3);
    g.screen = 'dead';
    expect(g.statusLines()[0].text).toContain('GEMS 3 ');
  });
});

describe('what the dive sounds like', () => {
  const ear = g => { const heard = []; g.sound = n => heard.push(n); return heard; };

  it('thuds on a hit that does not kill, and only kills on one that does', () => {
    const g = quiet();
    const heard = ear(g);
    const e = fishAt(g, 'bulwark', 100);
    g.hit(e);
    expect(heard).toEqual(['hit']);
    heard.length = 0;
    e.hp = g.player.damage;
    g.hit(e);
    expect(heard).toEqual(['kill']);
  });

  it('calls each wave once as it arrives, and a batch led by a mini-boss or the boss with its own', () => {
    const g = quiet();
    g.immortal = true;
    const heard = ear(g);
    g.spawnBatch({ enemies: [['drifter', 30]] });
    expect(heard).toEqual(['wave']);
    const later = g.incoming.filter(f => f.first).length;
    expect(later).toBeGreaterThanOrEqual(2);
    play(g, 30);
    expect(heard.filter(n => n === 'wave').length).toBe(1 + later);
    const h = quiet();
    const heardH = ear(h);
    h.spawnBatch({ enemies: [['boss', 1]] }, { enemies: [['drifter', 10]] });
    expect(heardH).toEqual(['lead']);
  });

  it('rings a batch cleared, and a layer\'s end its own way', () => {
    const plan = atGate(1).plan;
    for (const end of [false, true]) {
      const g = atGate(plan.findIndex(e => !!e.end === end) + 1);
      const heard = ear(g);
      g.spawnBatch(g.plan[g.batchIndex - 1].batch);
      clearAndWait(g, 0.1);
      expect(heard).toContain(end ? 'layer' : 'clear');
      expect(heard).not.toContain(end ? 'clear' : 'layer');
    }
  });
});

describe('the dash (D50, D51, D56)', () => {
  it('throws what it passes through without wounding it until bought, and the diver comes through whole', () => {
    const g = loadGame();
    g.reset();
    const shoved = mob(g.player.x + 60, g.player.y, { hp: 5, maxHp: 5 });
    g.enemies.push(shoved);
    g.player.fireTimer = 999;
    const x0 = shoved.x;
    dashRight(g);                              // 20 ticks, longer than DASH_TIME
    expect(shoved.hp).toBe(5);
    expect(shoved.x).toBeGreaterThan(x0 + 10);
    expect(shoved.flash).toBeFalsy();          // no damage, no white flash
    expect(g.player.hp).toBe(3);
  });

  it('wounds each fish once with Impact, by as many as were bought', () => {
    for (const n of [1, 2]) {
      const g = loadGame();
      g.reset();
      for (let i = 0; i < n; i++) mod(g, 'Impact').apply(g.player);
      const fish = mob(g.player.x + 60, g.player.y, { hp: 5, maxHp: 5 });
      g.enemies.push(fish);
      g.player.fireTimer = 999;
      dashRight(g);
      expect(fish.hp).toBe(5 - n);
    }
  });

  it('reaches past the body with its wave, and shoves what it hits -- forwards only', () => {
    const at = dx => {
      const g = loadGame();
      g.reset();
      mod(g, 'Impact').apply(g.player);        // hp is the oracle, so buy it
      g.player.fireTimer = 999;
      const x = dx(g);
      const fish = mob(x, g.player.y, { hp: 5, maxHp: 5 });
      g.enemies.push(fish);
      dashRight(g);
      return { g, fish, x };
    };
    // 40px past where the dash ends -- its last 60Hz tick carries it a little
    // beyond dashSpeed x DASH_TIME: out of the bodies' reach (9 + 20) but
    // inside the wave's (9 + DASH_REACH).
    const ahead = at(g => g.player.x + Math.ceil(g.DASH_TIME * 60) * g.player.dashSpeed / 60 + 40);
    expect(ahead.fish.hp).toBe(4);
    expect(ahead.fish.x).toBeGreaterThan(ahead.x + 10);
    const behind = at(g => g.player.x - 30);
    expect(behind.fish.hp).toBe(5);
    // It closes with a ring, and leaves an afterimage trail -- stationary
    // sparks, which a hit's outward burst never is.
    expect(behind.g.player.dashEnd).toBeGreaterThan(0);
    expect(behind.g.particles.some(p => p.vx === 0 && p.vy === 0)).toBe(true);
    // ...and cannot go again inside its cooldown.
    behind.g.justPressed.add('Space');
    behind.g.update(1 / 60);
    expect(behind.g.player.dashCd).toBeGreaterThan(0);
    expect(behind.g.player.dashTime).toBeLessThanOrEqual(0);
  });

  it('hits what it sweeps through, never stepping over it (D50)', () => {
    // A dash ten times today's speed on the slowest frame: 300px a step, the
    // fish halfway along the first -- ahead of the step's start, 150px behind
    // its end, past the wave's reach. A point test taken once a frame misses it.
    const g = loadGame();
    g.reset();
    mod(g, 'Impact').apply(g.player);
    g.player.fireTimer = 999;
    g.player.dashSpeed = 6000;
    const swept = mob(g.player.x + 150, g.player.y, { hp: 5, maxHp: 5 });
    g.enemies.push(swept);
    dashRight(g, 8, 0.05);
    expect(swept.hp).toBe(4);
  });

  it('covers its own length, which Fins does not stretch (D56)', () => {
    // Exactly the dash's own ticks: one more picks up ordinary swimming.
    const distance = fins => {
      const g = quiet();
      g.player.fireTimer = 999;
      for (let i = 0; i < fins; i++) mod(g, 'Fins').apply(g.player);
      const x0 = g.player.x;
      g.player.facing = 0;
      g.keys.add('KeyD');
      g.justPressed.add('Space');
      run(g, Math.floor(g.DASH_TIME / g.FIXED_DT), g.FIXED_DT);
      return { moved: g.player.x - x0, length: g.player.dashSpeed * g.DASH_TIME };
    };
    const bare = distance(0), finned = distance(8);
    expect(Math.abs(bare.moved - finned.moved)).toBeLessThan(1);
    expect(bare.moved).toBeGreaterThan(bare.length * 0.9);
  });

  it('is a committed lunge: nothing held mid-dash turns, reverses or stops it (D56)', () => {
    // Letting go stopping it would be free invulnerability for standing still.
    const dash = to => {
      const g = quiet();
      g.player.fireTimer = 999;
      const x0 = g.player.x, y0 = g.player.y;
      g.player.facing = 0;
      g.keys.add('KeyD');
      g.justPressed.add('Space');
      g.update(g.FIXED_DT);                    // committed to +x on this frame
      g.keys.clear();
      if (to) g.keys.add(to);
      run(g, Math.floor(g.DASH_TIME / g.FIXED_DT) - 1, g.FIXED_DT);
      return { dx: g.player.x - x0, dy: g.player.y - y0, length: g.player.dashSpeed * g.DASH_TIME };
    };
    const straight = dash('KeyD');
    expect(straight.dx).toBeGreaterThan(straight.length * 0.9);
    expect(Math.abs(straight.dy)).toBeLessThan(1);
    for (const key of ['KeyW', 'KeyA', null]) {
      const r = dash(key);
      expect(Math.abs(r.dx - straight.dx)).toBeLessThan(1);
      expect(Math.abs(r.dy)).toBeLessThan(1);
    }
  });

  it('is safe through its grace, without the blink a hit has (D121)', () => {
    const g = quiet();
    g.player.fireTimer = 999;
    g.justPressed.add('Space');
    run(g, Math.floor((g.DASH_TIME + g.DASH_GRACE) / g.FIXED_DT) - 1, g.FIXED_DT);
    expect(g.player.hurt).toBeLessThanOrEqual(0);           // nothing blinks
    const bite = { damage: 1, knock: 0 };
    expect(g.hurtPlayer(bite, 0, 0)).toBe(false);           // and nothing lands
    run(g, 3, g.FIXED_DT);
    expect(g.hurtPlayer(bite, 0, 0)).toBe(true);
  });
});

describe('the clear and the death, on the tick they land', () => {
  it('brings a batch in with no grace: the diver is open from its first tick (D55)', () => {
    const g = loadGame();
    g.reset();
    run(g, Math.ceil(g.GATE_PAUSE / g.FIXED_DT) + 3, g.FIXED_DT);
    expect(g.enemies.length).toBeGreaterThan(0);
    expect(g.player.hurt).toBeLessThanOrEqual(0);
  });

  it('heals 1 HP with Mend on a clear, never past the maximum', () => {
    const clear = hp => {
      const g = loadGame();
      g.reset();
      g.player.mendOnClear = 1;
      g.player.hp = hp;
      const fish = mob(g.player.x + 150, g.player.y);
      g.enemies.push(fish);
      fireAt(g, fish);
      run(g, 60);
      return g.player;
    };
    expect(clear(1).hp).toBe(2);
    const full = clear(3);
    expect(full.hp).toBe(full.maxHp);
  });

  it('dies, rather than ending the layer, on a tick that kills the boss and the diver', () => {
    // Without the guard the layer end heals you and its cards bury the death.
    const g = loadGame();
    g.reset();
    g.batchIndex = g.plan.findIndex(e => e.end) + 1;
    g.player.hp = 1;
    g.player.hurt = 0;
    // Bodies are solid (D120), so it can only press against the diver.
    const x = g.player.x + g.player.r + 7;
    g.enemies.push(mob(x, g.player.y));
    shot(g, { x, vx: 0, maxTravel: 100 });     // already on top of it
    g.update(1 / 60);
    expect([g.kills, g.enemies.length]).toEqual([1, 0]);
    expect(g.screen).toBe('dead');
    expect(g.player.hp).toBeLessThanOrEqual(0);
    expect(g.offerTimer).toBeLessThanOrEqual(0);
  });

  it('ends the dive at 0 HP, not below, on a hit bigger than the HP left (D118)', () => {
    const g = quiet();
    g.player.hp = 1;
    g.enemies.push(mob(g.player.x, g.player.y, { touch: { damage: 3, knock: 0 } }));
    g.update(1 / 60);
    expect([g.screen, g.player.hp]).toEqual(['dead', 0]);
  });

  it('opens the layer end\'s cards once the boss\'s death has played, and nothing arrives behind them (D51)', () => {
    const g = loadGame();
    g.reset();
    g.batchIndex = g.plan.findIndex(e => e.end) + 1;   // the boss's batch is the one fought
    const boss = mob(g.player.x + 150, g.player.y);
    g.enemies.push(boss);
    fireAt(g, boss);
    for (let i = 0; i < 60 && g.enemies.length; i++) g.update(1 / 60);
    g.keys.delete('Mouse0');
    expect([g.enemies.length, g.screen, g.choices.length]).toEqual([0, 'playing', 0]);
    expect(g.offerTimer).toBeGreaterThan(0);
    for (let i = 0; i < Math.ceil(g.MOD_OFFER_DELAY * 60) + 3 && g.screen === 'playing'; i++) g.update(1 / 60);
    expect(g.screen).toBe('mods');
    expect(new Set(g.choices).size).toBe(3);
    const at = g.batchIndex;
    run(g, 300);
    expect([g.batchIndex, g.enemies.length, g.screen]).toEqual([at, 0, 'mods']);
  });
});

describe("the suit's guard (D179)", () => {
  const end = atGate(0).plan.findIndex(e => e.end);
  // The diver comes to gate k with one guard of three left.
  const arrive = k => {
    const g = atGate(k);
    g.player.guard = 3;
    g.guardLeft = 1;
    ride(g);
    return g.guardLeft;
  };

  it('lasts the layer: no gate along it, the boss\'s included, refills it', () => {
    expect(Array.from({ length: end + 1 }, (_, k) => arrive(k))).toEqual(Array(end + 1).fill(1));
  });

  it('comes back whole at the layer end, with the heal', () => {
    const g = atGate(end);
    g.player.guard = 3;
    ride(g);                                  // the boss arrives
    g.guardLeft = 0;
    g.player.hp = 1;
    expect(clearAndWait(g)).toBe('mods');
    expect([g.player.hp, g.guardLeft]).toEqual([g.player.maxHp, 3]);
  });
});

describe('knockback (D122)', () => {
  it('knocks a fish along the shot that hits it, a lighter one further', () => {
    const moved = name => {
      const g = quiet();
      const e = fishAt(g, name, 100);
      e.hp = e.maxHp = 99;
      const [x, y] = [e.x, e.y];
      shot(g);
      play(g, 0.5);
      return [e.x - x, Math.abs(e.y - y)];
    };
    const [puffer, sideways] = moved('puffer'), [bulwark] = moved('bulwark');
    expect(puffer).toBeGreaterThan(bulwark);
    expect(bulwark).toBeGreaterThan(0);
    expect(sideways).toBeLessThan(0.5);
  });

  it('knocks every fish a piercing shot passes through', () => {
    const g = quiet();
    const fish = [fishAt(g, 'puffer', 80), fishAt(g, 'puffer', 160)];
    for (const e of fish) e.hp = e.maxHp = 99;
    const xs = fish.map(e => e.x);
    shot(g, { pierce: 1 });
    play(g, 0.75);
    fish.forEach((e, i) => expect(e.x).toBeGreaterThan(xs[i]));
  });

  it('never knocks a lunger off its line once it winds up (D64)', () => {
    const g = quiet();
    const e = fishAt(g, 'mini-boss', 130);
    delete e.shell;                              // so the shot lands (D156)
    Object.assign(e, { phase: 'windup', attack: 'lunge', aimX: -1, aimY: 0, phaseTime: 0 });
    const at = [e.x, e.y];
    shot(g, { vx: 4000 });
    play(g, 0.05);
    expect(e.hp).toBeLessThan(e.maxHp);
    expect([e.x, e.y]).toEqual(at);
  });

  it('knocks a fish along the swing that cuts it', () => {
    const g = loadGame();
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    const e = fishAt(g, 'puffer', 20);
    e.hp = e.maxHp = 99;
    const x = e.x;
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    holdFire(g);
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    play(g, 0.25);
    expect(e.hp).toBeLessThan(99);
    expect(e.x).toBeGreaterThan(x);
  });

  // Every way a fish hurts, set to land from the diver's right: the knock
  // carries the diver left, away, at about its strength.
  const HITS = [
    ["a drifter's bite", g => fishAt(g, 'drifter', 5), e => e.bite],
    ["a darter's bite", g => fishAt(g, 'darter', 3), e => e.bite],
    ["a bulwark's bite", g => fishAt(g, 'bulwark', 20), e => e.bite],
    ["an archer's shot", g => Object.assign(fishAt(g, 'archer', 160), { phaseTime: 99 }), e => e.spit],
    ["a puffer's burst", g => Object.assign(fishAt(g, 'puffer', 40), { phase: 'fuse', phaseTime: 0 }), e => e.fuse],
    ['a charge', g => Object.assign(fishAt(g, 'mini-boss', -5),
      { phase: 'charge', attack: 'lunge', aimX: -1, aimY: 0, phaseTime: 0 }), e => e.lunge],
    ["an eel's touch", g => fishAt(g, 'eel', -3), e => e.touch],
  ];
  for (const [what, place, record] of HITS) {
    it(`knocks the diver away with ${what}, at about its strength`, () => {
      const g = quiet();
      g.immortal = true;
      const k = record(place(g)).knock;
      expect(until(g, 5, () => g.batchHit)).toBe(true);
      expect(g.player.vx).toBeLessThan(-0.5 * k);
    });
  }

  it('knocks the diver only when the hit lands, immortal or not', () => {
    const knocked = setup => {
      const g = quiet();
      setup(g);
      fishAt(g, 'eel', -3);
      g.update(g.FIXED_DT);
      g.update(g.FIXED_DT);
      return g.player.vx < -10;
    };
    expect([knocked(g => { g.player.hurt = 10; }), knocked(g => { g.player.safe = 10; }),
            knocked(g => { g.guardLeft = 1; }), knocked(g => { g.immortal = true; })])
      .toEqual([false, false, false, true]);
  });

  it('holds a knocked diver in view at an edge', () => {
    const g = quiet();
    g.immortal = true;
    g.player.x = g.player.r;
    Object.assign(fishAt(g, 'puffer', 40), { phase: 'fuse', phaseTime: 0 });
    play(g, 1);
    expect(g.batchHit).toBe(true);
    expect(g.player.x).toBeGreaterThanOrEqual(g.player.r);
  });
});

// The drawn bump (S7): state only, as feel is never asserted (D16).
describe('the bump', () => {
  it('jolts a fish along the shot that hits it, for a moment', () => {
    const g = quiet();
    const e = fishAt(g, 'puffer', 100);
    e.hp = e.maxHp = 99;
    shot(g);
    expect(until(g, 1, () => e.hp < 99)).toBe(true);
    expect(e.bump).toBeGreaterThan(0);
    expect(e.bumpX).toBeCloseTo(1);
    expect(e.bumpY).toBeCloseTo(0);
    play(g, g.BUMP_TIME + 0.02);
    expect(e.bump).toBeLessThanOrEqual(0);
  });

  it('neither jolts nor moves a shut shell: the hit glances off (D156)', () => {
    const g = quiet();
    const e = fishAt(g, 'mini-boss', 130);
    const at = [e.x, e.y];
    shot(g, { vx: 4000 });
    play(g, 0.05);
    expect([e.bump || 0, e.hp, e.x, e.y]).toEqual([0, e.maxHp, ...at]);
  });

  it('jolts a lunger the hit cannot knock off its line', () => {
    const g = quiet();
    const e = fishAt(g, 'mini-boss', 130);
    delete e.shell;                              // so the shot lands (D156)
    Object.assign(e, { phase: 'windup', attack: 'lunge', aimX: -1, aimY: 0, phaseTime: 0 });
    shot(g, { vx: 4000 });
    play(g, 0.05);
    expect(e.bump).toBeGreaterThan(0);
  });

  it('jolts the fish a swing cuts', () => {
    const g = loadGame();
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    const e = fishAt(g, 'puffer', 20);
    e.hp = e.maxHp = 99;
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    holdFire(g);
    g.update(g.FIXED_DT);
    expect(e.bump).toBeGreaterThan(0);
    expect(e.bumpX).toBeGreaterThan(0.9);
  });
});

describe('the splash (D125)', () => {
  // Bloom touched, so the diver splashes as a dive's would.
  const bloom = g => {
    g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: 'Bloom', life: g.BOOST_LIFE });
    g.update(g.FIXED_DT);
    expect(g.player.splash).toBeGreaterThan(0);
  };

  it('wounds the fish beside the one a shot hits, without knocking it, and spreads no further', () => {
    const hurt = splashing => {
      const g = quiet();
      g.immortal = true;
      if (splashing) bloom(g);
      g.player.fireTimer = 999;                  // silence the weapon
      const gap = g.BOOSTS.find(b => b.name === 'Bloom').add.splash - 2;
      // Beside the struck fish, inside its splash; and beside that one, out of it.
      const struck = mob(g.player.x + 100, g.player.y, { hp: 9, maxHp: 9 });
      const beside = mob(struck.x, struck.y + 18 + gap, { hp: 9, maxHp: 9 });
      const next = mob(struck.x, beside.y + 18 + gap, { hp: 9, maxHp: 9 });
      g.enemies.push(struck, beside, next);
      shot(g);
      run(g, 30);
      return [struck, beside, next].map(e => [9 - e.hp, e.pushX !== 0 || e.pushY !== 0]);
    };
    expect(hurt(false)).toEqual([[1, true], [0, false], [0, false]]);
    expect(hurt(true)).toEqual([[1, true], [1, false], [0, false]]);
  });

  // The bug "Bloom's splash cannot be seen": a ring at the struck fish, as
  // wide as the splash reaches, so what it touches is what it wounds.
  it('shows where it lands and how far, on every hit, and never without Bloom', () => {
    const rings = splashing => {
      const g = quiet();
      g.immortal = true;
      if (splashing) bloom(g);
      g.player.fireTimer = 999;
      const struck = mob(g.player.x + 100, g.player.y, { hp: 9, maxHp: 9 });
      g.enemies.push(struck);
      shot(g);
      expect(until(g, 1, () => struck.hp < 9)).toBe(true);
      return g.particles.filter(p => p.ring !== undefined)
        .map(p => [p.x, p.y, p.ring, p.r - struck.r - g.player.splash]);
    };
    expect(rings(false)).toEqual([]);
    const [ring, ...more] = rings(true);
    expect(more).toEqual([]);
    expect(ring[2]).toBe(9);                                 // from the struck body's edge...
    expect(ring[3]).toBe(0);                                 // ...out to the splash's reach
  });

  it('splashes a shot that hits nothing where its range ends, and one that hit, never again there (D203)', () => {
    const ends = struckFirst => {
      const g = quiet();
      g.immortal = true;
      bloom(g);
      g.player.fireTimer = 999;
      const b = shot(g, { maxTravel: 300 });
      const end = mob(b.x + 300, b.y + 9 + g.player.splash - 2, { hp: 9, maxHp: 9 });   // by the range's end
      g.enemies.push(end);
      if (struckFirst) g.enemies.push(mob(b.x + 100, b.y, { hp: 9, maxHp: 9 }));
      run(g, 60);
      return 9 - end.hp;
    };
    expect(ends(false)).toBe(1);
    expect(ends(true)).toBe(0);
  });

  it('splashes a cut that meets nothing just past its reach (D203)', () => {
    const g = loadGame();
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    g.immortal = true;
    bloom(g);
    const reach = g.player.range + g.player.shotRadius;
    const past = mob(g.player.x + reach + 9 + g.player.splash - 2, g.player.y, { hp: 9, maxHp: 9 });
    g.enemies.push(past);
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    holdFire(g);
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    expect(9 - past.hp).toBe(g.player.damage);
  });

  it('wounds a fish that swims into the ring while it shows, and none twice (D212)', () => {
    const g = quiet();
    g.immortal = true;
    bloom(g);
    g.player.fireTimer = 999;
    const struck = mob(g.player.x + 100, g.player.y, { hp: 9, maxHp: 9 });
    const late = mob(struck.x, struck.y + 200, { hp: 9, maxHp: 9 });     // out of reach as it lands
    const stays = mob(struck.x, struck.y + 9 + 9 + g.player.splash - 4, { hp: 9, maxHp: 9 });
    g.enemies.push(struck, late, stays);
    shot(g);
    expect(until(g, 1, () => struck.hp < 9)).toBe(true);
    expect(late.hp).toBe(9);
    late.y = stays.y;                                                       // in, the ring still showing
    late.x = struck.x + 4;
    g.update(g.FIXED_DT);
    run(g, 60);
    expect([9 - late.hp, 9 - stays.hp]).toEqual([1, 1]);
  });

  it('kills through the one path: a fish its splash killed is not cut again, and pays once', () => {
    const g = loadGame();
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    g.immortal = true;
    bloom(g);
    // Three in the blade's way, nearly touching: the nearest's cut splashes the others dead.
    const x = g.player.x + g.player.r + 9 + 10;
    const fish = [-20, 0, 20].map(dy => mob(x, g.player.y + dy));
    g.enemies.push(...fish);
    const [kills, paid] = [g.kills, g.gems.length + g.currency];
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    holdFire(g);
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    expect(fish.every(e => e.gone)).toBe(true);
    expect([g.kills - kills, g.gems.length + g.currency - paid]).toEqual([3, 3]);
  });
});
