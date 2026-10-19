// The fight itself: the trigger, shots, the dash, touch, gems, and what a
// clear or a death does on the tick it lands.
import { describe, it, expect } from 'vitest';
import { loadGame } from './harness.js';

// A fish that hurts on touch (D108): these checks are about touch, i-frames
// and the dash, not any one attack.
const mob = (x, y, over) => Object.assign(
  { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, value: 1, lastHitBy: 0,
    pushX: 0, pushY: 0, vx: 0, vy: 0, touch: 1 }, over);

// A bullet, built the way the weapon builds one, so no check hand-rolls a
// literal that misses a field -- a bullet without `speed` would fly forever,
// since `NaN >= maxTravel` is false.
const shot = (g, over = {}) => {
  const b = Object.assign({ id: ++g.bulletId, x: g.player.x, y: g.player.y, r: g.player.shotRadius,
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
    run(g, 40);
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
    g.enemies.push(mob(g.player.x + 200, g.player.y, { speed: 100, hp: 999, maxHp: 999, touch: 2 }));
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
    g.enemies.push(mob(g.player.x, g.player.y, { touch: 3 }));
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
