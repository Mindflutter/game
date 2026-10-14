// The ordinary enemies' behaviours beyond the chase (D95): each is checked on
// its state transitions, as S5 (content)'s exit asks of every behaviour. The
// lunge's checks are in boss.test.js.
import { describe, it, expect } from 'vitest';
import { loadGame, ticks } from './harness.js';

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
const play = (g, seconds) => { for (let i = 0, n = ticks(g, seconds); i < n; i++) g.update(g.FIXED_DT); };
const distance = (g, e) => Math.hypot(e.x - g.player.x, e.y - g.player.y);
const shots = g => g.bullets.filter(b => b.evil);
const inView = (g, e) => e.x - e.r >= 0 && e.x + e.r <= g.ARENA_W &&
                         e.y - e.r >= g.cameraY && e.y + e.r <= g.cameraY + g.ARENA_H;

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
    const g = alone('archer', (S.near + S.range) / 2);
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

  it('backs off inside near, and never out of the view', () => {
    const S = spit();
    const g = alone('archer', S.near / 2);
    const e = g.enemies[0], before = distance(g, e);
    g.update(g.FIXED_DT);
    expect(distance(g, e)).toBeGreaterThan(before);
    g.player.x = g.ARENA_W - 60;                 // backing off from here runs into the edge
    e.x = g.ARENA_W - 30;
    play(g, 1);
    expect(inView(g, e)).toBe(true);
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

  it('costs a heart with a shot that reaches the diver, and the shot is spent', () => {
    const S = spit();
    const g = alone('archer', S.range - 20);
    g.enemies[0].phaseTime = S.every;
    play(g, (S.range - 20) / S.speed + 0.1);
    expect(g.player.hp).toBe(g.player.maxHp - 1);
    expect(shots(g).length).toBe(0);
  });

  it('lets a shot through the dash\'s invulnerability and immortality, unspent', () => {
    const S = spit();
    for (const guard of ['hurt', 'immortal']) {
      const g = alone('archer', S.range - 20);
      g.enemies[0].phaseTime = S.every;
      if (guard === 'hurt') g.player.hurt = 10; else g.immortal = true;
      play(g, (S.range - 20) / S.speed + 0.1);
      expect(g.player.hp).toBe(g.player.maxHp);
      expect(shots(g).length).toBe(1);
    }
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

  it('bursts after its time, costing a heart inside the blast and nothing outside it, and lives on', () => {
    const F = fuse();
    const near = ready(F.trigger - 10);
    play(near, F.time + 0.05);
    expect(near.enemies.map(e => [e.phase, e.hp])).toEqual([['chase', near.enemies[0].maxHp]]);
    expect(near.player.hp).toBe(near.player.maxHp - 1);
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

describe('the bite (D108)', () => {
  const bite = name => loadGame().enemyType(name).bite;
  // A fish whose body is `gap` px from the diver's, held where it is, so only
  // its jaws move.
  const at = (gap, name = 'drifter') => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    g.placeEnemy(name, g.player.x + g.player.r + g.enemyType(name).r + gap, g.player.y);
    const e = g.enemies[0];
    e.speed = 0;
    return [g, e];
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

  it('snaps a heart off a diver still in reach, and nothing off one that got away', () => {
    const B = bite('drifter');
    const [near, e] = at(B.reach - 2);
    near.update(near.FIXED_DT);
    expect(e.phase).toBe('jaws');
    play(near, B.windup + 0.02);
    expect([near.player.hp, e.phase]).toEqual([near.player.maxHp - 1, 'rest']);
    const [far, f] = at(B.reach - 2);
    far.update(far.FIXED_DT);                    // the jaws open
    far.player.x -= B.reach + 20;                // and the diver gets away
    play(far, B.windup + 0.02);
    expect([far.player.hp, f.phase]).toEqual([far.player.maxHp, 'rest']);   // it snapped on water
  });

  it('rests before it can bite again', () => {
    const B = bite('drifter');
    const [g, e] = at(B.reach - 2);
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
    expect(['charge', 'windup', 'rest'].map(phase => touched('mini-boss', { ...charge, phase })))
      .toEqual([1, 0, 0]);                       // the lunge hurts only as it charges
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
