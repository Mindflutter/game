// The ordinary enemies' behaviours beyond the chase (D95), each checked on its
// state transitions. The lunge's are in boss.test.js.
import { describe, it, expect } from 'vitest';
import { loadGame, ticks, play, fishAt } from './harness.js';

// One fish of `name`, `dist` px straight right of a diver standing in the
// middle of the view, nothing else arriving and nothing fired.
function alone(name, dist, seed = 1) {
  const g = loadGame();
  g.reset(seed);
  g.queuePaused = true;
  g.placeEnemy(name, g.player.x + dist, g.player.y);
  expect(g.enemies.length).toBe(1);
  return g;
}
const distance = (g, e) => Math.hypot(e.x - g.player.x, e.y - g.player.y);
const shots = g => g.bullets.filter(b => b.evil);
const inView = (g, e) => e.x - e.r >= 0 && e.x + e.r <= g.ARENA_W &&
                         e.y - e.r >= g.cameraY && e.y + e.r <= g.cameraY + g.ARENA_H;

describe('a mark where a fish is about to come in (D202)', () => {
  it('stands on the edge nearest a fish not yet in view, pointing in, clearer as it nears, and goes as it enters', () => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    g.enemies.length = 0;
    g.placeEnemy('drifter', g.ARENA_W + 40 + 18, g.cameraY + 300);   // where an arrival starts
    const e = g.enemies[0];
    const [far] = g.arrivalMarks();
    expect(far.x).toBeLessThan(g.ARENA_W);                          // on the edge, inside the view
    expect(far.x).toBeGreaterThan(g.ARENA_W - 40);
    expect(far.y).toBeCloseTo(e.y, 6);                               // beside the fish
    expect([far.ux, far.uy]).toEqual([-1, 0]);                       // pointing in
    e.x -= 30;
    const [near] = g.arrivalMarks();
    expect(near.k).toBeGreaterThan(far.k);
    e.x = g.ARENA_W - 10;                                            // its body in view
    expect(g.arrivalMarks()).toEqual([]);
  });
});

describe('the archer (spit)', () => {
  const spit = () => loadGame().enemyType('archer').spit;

  it('closes in from beyond its range, and spits only once within it', () => {
    const S = spit();
    const g = alone('archer', S.range + 160);
    const e = g.enemies[0];
    e.phaseTime = S.every;                       // ready the moment it is in range
    let spatAt = null;
    for (let i = 0, n = ticks(g, 6); i < n && spatAt === null; i++) {
      const before = distance(g, e);
      g.update(g.FIXED_DT);
      if (shots(g).length) spatAt = before;
      else expect(distance(g, e)).toBeLessThan(before);
    }
    expect(spatAt).not.toBeNull();
    expect(spatAt).toBeLessThanOrEqual(S.range);
  });

  it('holds between near and its range, spitting every `every` seconds at the diver', () => {
    const S = spit();
    const g = alone('archer', S.range - 40);
    g.immortal = true;                           // so its shots fly on and can be counted
    const e = g.enemies[0], x = e.x, seen = new Set();
    for (let i = 0, n = ticks(g, 2 * S.every + 0.1); i < n; i++) {
      g.update(g.FIXED_DT);
      expect(e.x).toBe(x);                       // holding: no swimming of its own
      for (const b of shots(g)) seen.add(b);
    }
    expect(seen.size).toBe(2);
    for (const b of seen) {                      // aimed straight back at the diver
      expect(b.vx).toBeCloseTo(-S.speed);
      expect(b.vy).toBeCloseTo(0);
    }
  });

  it('holds its ground as the diver closes in: it never swims away (D159)', () => {
    const g = alone('archer', 60);
    const e = g.enemies[0], at = [e.x, e.y];
    g.player.safe = 99;
    play(g, 1);
    expect([e.x, e.y]).toEqual(at);
  });

  it('comes into the view before it spits, though already in range', () => {
    const S = spit();
    const g = alone('archer', 0);
    g.player.x = g.ARENA_W - 150;
    const e = g.enemies[0];
    e.x = g.ARENA_W + 50;                        // in range, but out of sight
    e.phaseTime = S.every;
    const before = distance(g, e);
    g.update(g.FIXED_DT);
    expect(shots(g).length).toBe(0);
    expect(distance(g, e)).toBeLessThan(before);
    for (let i = 0, n = ticks(g, 3); i < n && !shots(g).length; i++) g.update(g.FIXED_DT);
    expect(shots(g).length).toBe(1);
    expect(inView(g, e)).toBe(true);
  });

  it('costs its damage with a shot that reaches the diver, and the shot is spent (D118)', () => {
    const S = spit();
    const g = alone('archer', S.range - 20);
    const e = g.enemies[0];
    Object.assign(e, { phaseTime: S.every, spit: { ...S, damage: 2 } });
    play(g, (S.range - 20) / S.speed + 0.1);
    expect(g.player.hp).toBe(g.player.maxHp - 2);
    expect(shots(g).length).toBe(0);
  });

  it('lets a shot through the i-frames and the dash\'s invulnerability, unspent', () => {
    const S = spit();
    for (const timer of ['hurt', 'safe']) {
      const g = alone('archer', S.range - 20);
      g.enemies[0].phaseTime = S.every;
      g.player[timer] = 10;
      play(g, (S.range - 20) / S.speed + 0.1);
      expect(g.player.hp).toBe(g.player.maxHp);
      expect(shots(g).length).toBe(1);
    }
  });

  it('spends a shot on an immortal diver, the hit shown and no HP taken (D121)', () => {
    const S = spit();
    const g = alone('archer', S.range - 20);
    g.enemies[0].phaseTime = S.every;
    g.immortal = true;
    play(g, (S.range - 20) / S.speed + 0.1);
    expect([g.player.hp, shots(g).length, g.batchHit]).toEqual([g.player.maxHp, 0, true]);
    expect(g.player.hurt).toBeGreaterThan(0);    // it blinks
  });

  it('never hits a fish, and its shot dies at its travel', () => {
    const S = spit();
    const g = alone('archer', S.range - 20);
    g.immortal = true;
    g.placeEnemy('bulwark', g.player.x + 60, g.player.y);   // in the line of fire
    g.enemies[0].phaseTime = S.every;
    g.update(g.FIXED_DT);
    const first = shots(g)[0];
    play(g, S.travel / S.speed + 0.05);
    expect(g.enemies[1].hp).toBe(g.enemies[1].maxHp);
    expect(g.bullets).not.toContain(first);
  });
});

describe('the puffer (fuse)', () => {
  const fuse = () => loadGame().enemyType('puffer').fuse;
  // A puffer `dist` px from the diver that has already chased its fill, so it
  // lights as soon as it is near enough.
  const ready = dist => {
    const g = alone('puffer', dist);
    g.enemies[0].phaseTime = fuse().chase;
    return g;
  };

  it('chases until within its trigger and wholly in the view, then stops and swells', () => {
    const F = fuse();
    const g = ready(F.trigger + 200);
    const e = g.enemies[0];
    let at = null;
    for (let i = 0, n = ticks(g, 6); i < n && e.phase !== 'fuse'; i++) {
      at = distance(g, e);
      g.update(g.FIXED_DT);
    }
    expect(e.phase).toBe('fuse');
    expect(at).toBeLessThan(F.trigger);
    expect(inView(g, e)).toBe(true);
    const x = e.x, y = e.y;
    play(g, F.time / 2);
    expect([e.x, e.y]).toEqual([x, y]);          // swelling, it swims no more
    e.pushX = 300;                               // but the dash's shove still moves it
    g.update(g.FIXED_DT);
    expect(e.x).toBeGreaterThan(x);
  });

  it('bursts after its time, costing its damage inside the blast and nothing outside it, and lives on', () => {
    const F = fuse();
    const near = ready(F.trigger - 10);
    near.enemies[0].fuse = { ...F, damage: 2 };
    play(near, F.time + 0.05);
    expect(near.enemies.map(e => [e.phase, e.hp])).toEqual([['chase', near.enemies[0].maxHp]]);
    expect(near.player.hp).toBe(near.player.maxHp - 2);
    const far = ready(F.trigger - 10);
    far.update(far.FIXED_DT);                    // the fuse is lit
    far.player.x -= F.blast;                     // and the diver steps out of the ring
    play(far, F.time);
    expect(far.enemies[0].phase).toBe('chase');  // it burst
    expect(far.player.hp).toBe(far.player.maxHp);
  });

  it('swims on after a burst, and lights again only once it has chased for its time', () => {
    const F = fuse();
    const g = ready(F.trigger - 10);
    g.immortal = true;
    play(g, F.time + 0.02);
    const e = g.enemies[0];
    expect(e.phase).toBe('chase');
    const d0 = distance(g, e);
    play(g, F.chase - 0.1);
    expect(e.phase).toBe('chase');               // inside its trigger all along, and unlit
    expect(distance(g, e)).toBeLessThan(d0);     // closing in
    play(g, 0.2);
    expect(e.phase).toBe('fuse');
  });

  it('dies like any fish when shot while it swells, and never bursts', () => {
    const g = ready(fuse().trigger - 10);
    g.update(g.FIXED_DT);                        // lit, and the trigger seen released
    g.player.damage = 100;
    const e = g.enemies[0];
    g.aim.x = e.x;
    g.aim.y = e.y - g.cameraY;
    g.keys.add(g.CLICK[0]);
    play(g, 0.5);
    expect(g.kills).toBe(1);
    expect(g.currency + g.gems.length).toBe(e.value);
    expect(g.player.hp).toBe(g.player.maxHp);
  });

  it('cut down by a swing on the tick its fuse runs out, it never bursts', () => {
    const F = fuse();
    const g = loadGame();
    expect(g.applyScenario('knife', 1)).toBe(true);
    g.queuePaused = true;
    g.placeEnemy('puffer', g.player.x + 50, g.player.y);
    const e = g.enemies[0];
    g.update(g.FIXED_DT);                        // the trigger seen released
    Object.assign(e, { phase: 'fuse', phaseTime: F.time - g.FIXED_DT / 2, hp: 1 });
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);                        // the swing and the fuse's end, one tick
    expect(g.kills).toBe(1);
    expect(g.player.hp).toBe(g.player.maxHp);
  });

  it('a dash that kills it on the tick it bursts counts one kill, paid once', () => {
    const F = fuse();
    const g = ready(40);                         // inside the dash wave's reach
    g.update(g.FIXED_DT);                        // lit
    const e = g.enemies[0];
    e.phaseTime = F.time - g.FIXED_DT / 2;       // it bursts on the next tick
    Object.assign(g.player, { dashDamage: 100, hurt: 1, facing: 0 });   // facing it (D107)
    g.justPressed.add('Space');                  // and the dash's wave meets it then
    g.update(g.FIXED_DT);
    expect(g.enemies.length).toBe(0);
    expect([g.kills, g.currency + g.gems.length]).toEqual([1, e.value]);
  });

  it('pays nothing for a burst, and keeps the mod it carries', () => {
    const g = ready(fuse().trigger - 10);
    g.placeEnemy('bulwark', 60, 60);            // so the burst is not the arena's last
    g.enemies[0].carrier = true;
    g.sinceBoost = 1 / g.BOOST_C;               // a kill now would be sure to drop one
    play(g, fuse().time + 0.05);
    expect(g.enemies.map(e => [e.name, e.phase, !!e.carrier]))
      .toEqual([['puffer', 'chase', true], ['bulwark', 'chase', false]]);
    expect(g.kills).toBe(0);
    expect(g.gems.length + g.drops.length).toBe(0);
    expect(g.sinceBoost).toBe(1 / g.BOOST_C);
  });
});

describe('the eel (weave)', () => {
  it('closes in swaying to one side and then the other, within its width, once a sway', () => {
    const W = loadGame().enemyType('eel').weave;
    const g = alone('eel', 600);
    g.immortal = true;
    const e = g.enemies[0], y0 = g.player.y, d0 = distance(g, e);
    const side = () => e.y - y0;                 // across the line it swims along
    play(g, 0.25 / W.rate);
    const first = side();                        // a quarter sway: out to one side
    play(g, 0.5 / W.rate);
    const second = side();                       // three quarters: out to the other
    expect(Math.abs(first)).toBeGreaterThan(W.width * 0.8);
    expect(Math.abs(second)).toBeGreaterThan(W.width * 0.8);
    expect(Math.sign(second)).toBe(-Math.sign(first));
    expect(Math.max(Math.abs(first), Math.abs(second))).toBeLessThan(W.width * 1.1);
    expect(distance(g, e)).toBeLessThan(d0);
  });
});

describe('the lionfish (spines)', () => {
  const spines = () => loadGame().enemyType('lionfish').spines;
  const near = (gap, scenario) => {
    const g = loadGame();
    if (scenario) g.applyScenario(scenario, 1);
    else g.reset(1);
    g.queuePaused = true;
    g.enemies.length = 0;
    return [g, fishAt(g, 'lionfish', gap)];
  };

  const flying = g => g.bullets.filter(b => b.spine && !b.gone);

  it('cocks its spines when the diver comes into its ring, and after its delay fires twelve out to the ring, one stinging it (D174, D176)', () => {
    const S = spines();
    const [g, e] = near(S.reach - 2);
    play(g, S.delay - 0.05);
    expect([e.phase, flying(g).length]).toEqual(['cock', 0]);
    play(g, 0.1);
    expect([e.phase, flying(g).length, g.player.hp]).toEqual(['bare', 12, g.player.maxHp]);
    expect(flying(g).every(b => b.maxTravel === e.r + S.reach)).toBe(true);
    play(g, (e.r + S.reach) / S.speed);
    expect([flying(g).length, g.player.hp]).toEqual([0, g.player.maxHp - S.damage]);
  });

  it('stings only by a spine that touches: a diver in the ring between two goes untouched (D176)', () => {
    const S = spines();
    const [g, e] = near(S.reach - 2);
    const d = e.r + S.reach - 5, a = Math.PI / 12;                // halfway between two, by the rim
    Object.assign(e, { x: g.player.x - d * Math.cos(a), y: g.player.y - d * Math.sin(a) });
    play(g, S.delay + (e.r + S.reach) / S.speed + 0.05);
    expect([e.phase, g.player.hp]).toEqual(['bare', g.player.maxHp]);
  });

  it('flies them once cocked, whoever has left the ring, and cocks again only regrown (D174)', () => {
    const S = spines();
    const [g, e] = near(S.reach - 2);
    play(g, S.delay / 2);
    g.player.x -= 200;
    play(g, S.delay / 2 + 0.05);
    expect([e.phase, flying(g).length]).toEqual(['bare', 12]);
    play(g, (e.r + S.reach) / S.speed);
    expect(g.player.hp).toBe(g.player.maxHp);
    g.player.x += 200;
    play(g, S.regrow - 0.1 - (e.r + S.reach) / S.speed);
    expect(e.phase).toBe('bare');
    play(g, 0.15);
    expect(e.phase).toBe('cock');
  });

  it('stings nothing through the dash, which kills it', () => {
    const [g] = near(10);
    Object.assign(g.player, { dashDamage: 100, facing: 0 });     // facing it (D107)
    g.justPressed.add('Space');
    play(g, 0.3);
    expect([g.kills, g.player.hp]).toEqual([1, g.player.maxHp]);
  });

  it('takes a Knife cut from inside its ring, the diver out again before the spines fly; the cut stings nothing (D175)', () => {
    const S = spines();
    const g0 = loadGame(), w = g0.WEAPONS.find(x => x.name === 'Knife'), r = g0.PLAYER_START.r;
    const blade = w.range + w.shotRadius - r;
    expect(S.reach).toBeGreaterThan(blade);
    const [g, e] = near(blade - 2, 'knife');
    g.update(g.FIXED_DT);
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);
    expect([e.hp < e.maxHp, g.player.hp, e.phase]).toEqual([true, g.player.maxHp, 'cock']);
    g.keys.delete('Mouse0');
    g.keys.add('KeyA');                                            // away from it
    play(g, S.delay + (e.r + S.reach) / S.speed);
    expect([e.phase, g.player.hp]).toEqual(['bare', g.player.maxHp]);
  });
});

describe('the bite (D108)', () => {
  const bite = name => loadGame().enemyType(name).bite;
  // A fish whose body is `gap` px from the diver's, held where it is, so only
  // its jaws move.
  const at = (gap, name = 'drifter') => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    return [g, fishAt(g, name, gap)];
  };

  it('chases until its body is within reach, then stops and opens its jaws', () => {
    const B = bite('drifter');
    const g = alone('drifter', 300);
    const e = g.enemies[0];
    let gap = null;
    for (let i = 0, n = ticks(g, 6); i < n && e.phase !== 'jaws'; i++) {
      gap = distance(g, e) - e.r - g.player.r;
      g.update(g.FIXED_DT);
    }
    expect(e.phase).toBe('jaws');
    expect(gap).toBeLessThanOrEqual(B.reach);
    const v = Math.hypot(e.vx, e.vy);
    play(g, B.windup / 2);
    expect(Math.hypot(e.vx, e.vy)).toBeLessThan(v);   // easing to a halt
  });

  it('snaps its damage off a diver still in reach, and nothing off one that got away', () => {
    const B = bite('drifter');
    const [near, e] = at(B.reach - 2);
    e.bite = { ...B, damage: 2 };
    near.update(near.FIXED_DT);
    expect(e.phase).toBe('jaws');
    play(near, B.windup + 0.02);
    expect([near.player.hp, e.phase]).toEqual([near.player.maxHp - 2, 'rest']);
    const [far, f] = at(B.reach - 2);
    far.update(far.FIXED_DT);                    // the jaws open
    far.player.x -= B.reach + 20;                // and the diver gets away
    play(far, B.windup + 0.02);
    expect([far.player.hp, f.phase]).toEqual([far.player.maxHp, 'rest']);   // it snapped on water
  });

  // The leap is drawn (D141): state only, as feel is never asserted (D16).
  it('leaps at the diver on the snap and back, as far as the gap, never past its reach', () => {
    const B = bite('bulwark');
    const snapAt = (g, e) => {
      g.update(g.FIXED_DT);
      expect([e.phase, g.biteLeap(e)]).toEqual(['jaws', 0]);
      let before = 0;
      while (e.phase === 'jaws') { before = g.biteLeap(e); g.update(g.FIXED_DT); }
      return before;
    };
    const [g, e] = at(B.reach / 2, 'bulwark');
    expect(snapAt(g, e)).toBeGreaterThan(0);              // on its way out
    expect(g.biteLeap(e)).toBeCloseTo(B.reach / 2, 0);    // at the diver's body on the snap
    play(g, g.LEAP_TIME + 0.02);
    expect(g.biteLeap(e)).toBe(0);                        // and home again
    const [far, f] = at(B.reach / 2, 'bulwark');
    far.update(far.FIXED_DT);
    far.player.x -= 100;                                  // got away: it leaps into water
    snapAt(far, f);
    expect(far.biteLeap(f)).toBeCloseTo(B.reach, 5);
  });

  // Igor, 2026-10-15: "i can freely swim thru red & purple enemies without a
  // bite" -- the drifter and the bulwark (D120).
  for (const name of ['drifter', 'bulwark']) {
    it(`stops a diver swimming at full speed into a ${name}, and bites it`, () => {
      const [g, e] = at(150, name);
      g.player.vx = g.player.speed;                // already at full swim
      g.keys.add('KeyD');
      let past = false;
      for (let i = 0, n = ticks(g, 1.5); i < n; i++) {
        g.update(g.FIXED_DT);
        past ||= g.player.x > e.x;
      }
      expect(past).toBe(false);
      expect(g.player.hp).toBeLessThan(g.player.maxHp);
    });
  }

  it('rests before it can bite again', () => {
    const B = bite('drifter');
    const [g, e] = at(B.reach - 2);
    e.bite.knock = 0;                            // the rest alone, not a chase back
    play(g, B.windup + 0.02);
    expect(g.player.hp).toBe(g.player.maxHp - 1);
    g.player.hurt = 0;                           // no invulnerability to hide behind
    play(g, B.rest - 0.05);
    expect([g.player.hp, e.phase]).toEqual([g.player.maxHp - 1, 'rest']);
    g.player.hurt = 0;
    play(g, 0.1 + B.windup);
    expect(g.player.hp).toBe(g.player.maxHp - 2);
  });

  it('never bites once dead, nor through invulnerability', () => {
    const B = bite('drifter');
    const [g, e] = at(B.reach - 2);
    g.update(g.FIXED_DT);
    e.phaseTime = B.windup - g.FIXED_DT / 2;     // it would snap this tick
    g.killEnemy(e);
    g.update(g.FIXED_DT);
    expect(g.player.hp).toBe(g.player.maxHp);
    const [h, f] = at(B.reach - 2);
    h.player.hurt = 1;                           // as in a dash
    play(h, B.windup + 0.02);
    expect([h.player.hp, f.phase]).toEqual([h.player.maxHp, 'rest']);
  });

  it('bites from where a shove leaves it', () => {
    const B = bite('drifter');
    const [g, e] = at(B.reach - 2);
    g.update(g.FIXED_DT);                        // the jaws open
    e.pushX = 400;                               // and the dash shoves it off
    play(g, B.windup + 0.02);
    expect(g.player.hp).toBe(g.player.maxHp);
  });

  it('hurts on touch only with touch: the eel; every other fish only by its attack', () => {
    const touched = (name, set = {}) => {
      const g = loadGame();
      g.reset(1);
      g.queuePaused = true;
      g.placeEnemy(name, g.player.x, g.player.y);      // right on the diver
      Object.assign(g.enemies[0], set);
      g.update(g.FIXED_DT);
      return g.player.maxHp - g.player.hp;
    };
    const names = ['drifter', 'darter', 'bulwark', 'archer', 'puffer', 'eel', 'mini-boss', 'boss'];
    expect(names.map(n => [n, touched(n)])).toEqual(names.map(n => [n, n === 'eel' ? 1 : 0]));
    const charge = { aimX: 1, aimY: 0 };
    expect(['charge', 'windup', 'rest'].map(phase => touched('mini-boss', { ...charge, phase }) > 0))
      .toEqual([true, false, false]);            // the lunge hurts only as it charges
  });
});

describe('arrivals', () => {
  it('every fish arrives wholly outside the view, whatever its size, on every edge', () => {
    const g = loadGame();
    g.reset(1);
    const bad = [];
    for (const t of g.ENEMY_TYPES) {
      for (let i = 0; i < 40; i++) {
        const p = g.edgeSpawnPoint(t);
        const inside = p.x + t.r > 0 && p.x - t.r < g.ARENA_W && p.y + t.r > 0 && p.y - t.r < g.ARENA_H;
        if (inside) bad.push([t.name, Math.round(p.x), Math.round(p.y)]);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('damage (D118)', () => {
  // Every attack as [type, behaviour, record]; weave only moves a fish, and
  // the shell and the stages only shape when it can be hurt and how it attacks.
  const attacks = g => g.ENEMY_TYPES.flatMap(t => Object.entries(t)
    .filter(([k, v]) => typeof v === 'object' && !Array.isArray(v) && !['weave', 'shell', 'stages'].includes(k)).map(([k, v]) => [t.name, k, v]));

  it('gives every attack a whole damage of at least 1', () => {
    const g = loadGame();
    expect(attacks(g).length).toBeGreaterThan(0);
    expect(attacks(g).filter(([, , v]) => !(Number.isInteger(v.damage) && v.damage >= 1))).toEqual([]);
  });

  it('gives every hit a whole knock of at least 0: every attack, every weapon (D122)', () => {
    const g = loadGame();
    const hits = [...attacks(g), ...g.WEAPONS.map(w => [w.name, 'weapon', w])];
    expect(hits.filter(([, , v]) => !(Number.isInteger(v.knock) && v.knock >= 0))).toEqual([]);
  });
});

describe('grades (D119)', () => {
  // A fish of type `t` at `grade`, standing in the middle, nothing else about.
  const made = (g, t, grade) => g.makeEnemy(t, g.player.x, g.player.y, t.speed, grade);

  it('makes grade 1 the type as written, and every step whole in damage', () => {
    const g = loadGame();
    expect(g.GRADES[0]).toEqual({ hp: 1, speed: 1, value: 1, damage: 0, from: 1 });
    for (const G of g.GRADES) expect(Number.isInteger(G.damage) && G.damage >= 0).toBe(true);
  });

  it('steps every number a grade names and nothing else, leaving the type alone', () => {
    const g = loadGame();
    g.reset(1);
    const types = JSON.stringify(g.ENEMY_TYPES);
    for (const t of g.ENEMY_TYPES) {
      const base = made(g, t, 1);
      g.GRADES.forEach((G, i) => {
        const e = made(g, t, i + 1);
        expect(Object.keys(e)).toEqual(Object.keys(base));          // the same behaviour
        expect([e.grade, e.hp, e.maxHp, e.speed, e.value])
          .toEqual([i + 1, t.hp * G.hp, t.hp * G.hp, t.speed * G.speed, Math.round(t.value * G.value)]);
        for (const [k, v] of Object.entries(t)) {
          if (typeof v === 'object' && 'damage' in v) expect(e[k]).toEqual({ ...v, damage: v.damage + G.damage });
          else if (typeof v === 'object' && !Array.isArray(v)) expect(e[k]).toEqual(v);
        }
      });
    }
    expect(JSON.stringify(g.ENEMY_TYPES)).toBe(types);
  });
});

