// The descent (D58): the camera, the current, the gate depths and the bottom.
// Designed in docs/specs/2026-09-28-s2-descent-design.md.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loadGame, ticks, ride, clearAndWait, atGate } from './harness.js';
import { botInput } from './bot.js';

// How far the water flows in one second, after `settle` seconds for its speed
// to ease. The player is kept alive, so a fight can be measured too; on the
// menu and end screens the keep-alive does nothing.
function flowFrom(g, settle = 3) {
  g.immortal = true;
  const tick = () => g.update(g.FIXED_DT);
  for (let i = 0, n = ticks(g, settle); i < n; i++) tick();
  const from = g.waterY;
  for (let i = 0, n = ticks(g, 1); i < n; i++) tick();
  return g.waterY - from;
}

describe('the descent', () => {
  it('never moves the camera while a batch lives, and does move it between (D27)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const g = loadGame();
      g.reset(seed);
      // The first violation is recorded and asserted once, after the loop: an
      // expect() on every tick was half this test's cost and caught nothing more.
      let moved = false, bad = null;
      g.immortal = true;                       // the bot kept alive
      for (let i = 0, n = ticks(g, 60); i < n && g.batchIndex < 4 && !bad; i++) {
        botInput(g);                           // the bot's own tick
        const fighting = g.batchLive(), frozen = g.screen === 'mods';
        const before = g.cameraY;
        g.update(g.FIXED_DT);
        if ((fighting || frozen) && g.cameraY !== before) bad = { tick: i, from: before, to: g.cameraY };
        // The player never leaves the view, however the camera moves.
        if (g.player.y < g.cameraY || g.player.y > g.cameraY + g.ARENA_H) {
          bad = { tick: i, playerY: g.player.y, cameraY: g.cameraY };
        }
        if (g.cameraY !== before) moved = true;
      }
      expect(bad).toBeNull();
      // Without this the freeze above passes on a camera that never moves at all.
      expect(moved).toBe(true);
    }), { numRuns: 5 });
  });

  it('opens on a quiet beat, then holds each batch until it is dead -- three in a row (D27)', () => {
    // Kept alive by hand rather than `immortal`, so the fish still swarm.
    const g = loadGame();
    g.reset(1);
    const run = (n, until = () => false) => {
      for (let i = 0; i < n && !until(); i++) { g.player.hurt = g.player.iframes; g.update(1 / 60); }
      expect(g.screen).toBe('playing');
    };
    expect(g.enemies.length === 0 && g.breathTimer > 0).toBe(true);
    run(Math.ceil(g.GATE_PAUSE * 60) + 3);
    expect(g.enemies.length > 0 && g.batchIndex === 1).toBe(true);
    const size = g.enemies.length + g.incoming.length;
    run(600);                                  // ten seconds of not killing
    expect([g.enemies.length + g.incoming.length, g.batchIndex]).toEqual([size, 1]);
    for (const k of [2, 3]) {
      g.enemies = [];
      g.incoming = [];
      run(1);
      expect(g.cameraY).toBeGreaterThan(g.gateDepth(k - 2));   // the descent begins...
      expect(g.batchIndex).toBe(k - 1);                       // ...before the next arrives
      run(60 * 30, () => g.enemies.length > 0);
      expect([g.batchIndex, g.enemies.length > 0]).toEqual([k, true]);
    }
  });

  it('keeps the water flowing during a fight -- the current never stops', () => {
    // "Descent stops" means no further in enemies; the water still moves. Only
    // the background shows it (graphics, D58), so this reads the flow, not the camera.
    const g = loadGame();
    g.reset(1);
    ride(g);                                     // the first batch arrives
    expect(g.enemies.length).toBeGreaterThan(0);
    const cam = g.cameraY;
    // Three seconds in, then one more measured: a flow that merely decays
    // toward zero would still "increase every tick", so this demands a speed.
    const flow = flowFrom(g);
    expect(g.enemies.length).toBeGreaterThan(0);  // still the same fight
    expect(flow).toBeGreaterThanOrEqual(0.5 * g.CURRENT_CRAWL);
    expect(g.cameraY).toBe(cam);                  // the fight itself does not move
  });

  it('brings the next batch a couple of seconds after the last one is cleared', () => {
    // A couple of seconds between batches (D58).
    const g = atGate(1);
    expect(ride(g).length * g.FIXED_DT).toBeLessThanOrEqual(3);
  });

  it('stops exactly at the gate depth, never past it, swimming or not', () => {
    for (const hold of [[], ['KeyS']]) {
      const g = atGate(1);
      const cams = ride(g, hold);
      expect(Math.max(...cams)).toBe(g.gateDepth(1));
      expect(g.cameraY).toBe(g.gateDepth(1));
      expect(g.enemies.length).toBeGreaterThan(0);   // and the batch arrived there
    }
  });

  it('runs the current independently of the player -- swimming does not hurry it', () => {
    // The current is independent of the player (D58).
    const idle = ride(atGate(1)).length;
    const swim = ride(atGate(1), ['KeyS']).length;
    expect(swim).toBe(idle);
  });

  it('fires at the cursor wherever the camera is', () => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;                  // no descent, no arrivals: just the shot
    g.cameraY = 5000;
    g.player.x = 640;
    g.player.y = 5400;
    g.aim.x = 840;                         // view coords: 200px right of the player,
    g.aim.y = 400;                         // level with it (5400 - 5000)
    g.update(g.FIXED_DT);                  // a frame with the button up arms it (D47)
    g.keys.add(g.CLICK[0]);
    g.update(g.FIXED_DT);
    expect(g.bullets).toHaveLength(1);
    expect(g.bullets[0].vx).toBeGreaterThan(0);
    expect(Math.abs(g.bullets[0].vy)).toBeLessThan(1e-9);
  });

  it('ends the dive at the bottom of the last layer, not in another batch -- and dives again', () => {
    const n = atGate(0).plan.length;            // drawn at reset; one length for all
    const g = atGate(n);
    ride(g);
    expect(g.screen).toBe('won');                 // the win (D68)
    expect(g.enemies).toHaveLength(0);
    expect(g.cameraY).toBe(g.gateDepth(n));
    // Reaching the bottom pays nothing of its own.
    expect(g.modCounts).toEqual({});
    const again = g.rowRect(0, g.MENUS.won.top);  // the Dive again button (D90)
    g.aim.x = again.x + again.w / 2;
    g.aim.y = again.y + again.h / 2;
    g.justPressed.add('Mouse0');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
    expect(g.cameraY).toBe(0);
  });

  it('starts a deep scenario with the player in the view, before any tick', () => {
    // A stepped scenario is inspected as set up (D37), so "the clamp fixes it on
    // the first tick" is not good enough: the player would be drawn off-screen.
    const g = loadGame();
    g.applyScenario('late-swarm', 1);
    expect(g.cameraY).toBeGreaterThan(0);
    expect(g.player.y).toBeGreaterThanOrEqual(g.cameraY);
    expect(g.player.y).toBeLessThanOrEqual(g.cameraY + g.ARENA_H);
  });

  it('opens no cards between batches, nor at the last layer end', () => {
    // Mods are dropped, never offered at a gate (D84); the layer end keeps its
    // pick (D85) -- but not the last one: "you clear the last layer - you won
    // the game" (D68).
    const mid = loadGame();
    mid.reset(1);
    ride(mid);                                  // the first batch arrives
    expect(clearAndWait(mid, 1)).toBe('playing');
    expect(mid.choices).toEqual([]);
    // ?dev=last-batch&play -- the scenario for seeing the dive's end without
    // playing all of it -- is the way in.
    const last = loadGame();
    expect(last.applyScenario('last-batch', 1)).toBe(true);
    ride(last);                                 // the last batch arrives
    expect(last.batchIndex).toBe(last.plan.length);
    expect(clearAndWait(last)).toBe('won');     // straight on, no cards
  });

  it('keeps the water flowing behind the mod cards while play waits', () => {
    // The water flows on behind the layer end's cards (D58, D85).
    const g = atGate(atGate(0).plan.findIndex(e => e.end));
    ride(g);                                    // the boss arrives
    expect(clearAndWait(g, 2)).toBe('mods');
    const cam = g.cameraY, px = g.player.x, py = g.player.y;
    const flow = flowFrom(g, 0);                // one second, no pick
    expect(g.screen).toBe('mods');              // still waiting on the pick
    expect(flow).toBeGreaterThanOrEqual(0.5 * g.CURRENT_CRAWL);
    expect([g.cameraY, g.player.x, g.player.y]).toEqual([cam, px, py]);   // play is frozen
  });

  it('keeps the water flowing under the death screen and the layer end, at a drift', () => {
    // The water flows under death and the layer end and freezes under pause
    // (D58). Easing down to the fight-time drift is Claude's call: the descent
    // is over there, so the water should not rush on.
    const dead = loadGame();
    dead.reset(1);
    ride(dead);
    dead.screen = 'dead';
    const bottom = atGate(dead.plan.length);
    ride(bottom);
    expect(bottom.screen).toBe('won');
    for (const g of [dead, bottom]) {
      const flow = flowFrom(g);
      expect(flow).toBeGreaterThanOrEqual(0.5 * g.CURRENT_CRAWL);  // never still
      expect(flow).toBeLessThan(0.5 * g.CURRENT_SPEED);            // but a drift
    }
  });

  it('freezes the camera and the water while paused, from the first tick', () => {
    // Escape must take effect before the camera moves or the water flows, or a
    // paused dive still descends for a tick.
    const g = atGate(1);
    for (let i = 0, n = ticks(g, 0.5); i < n; i++) g.update(g.FIXED_DT);   // mid-descent
    const cam = g.cameraY, water = g.waterY;
    expect(cam).toBeGreaterThan(0);
    g.justPressed.add('Escape');
    for (let i = 0, n = ticks(g, 1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.screen).toBe('paused');
    expect(g.cameraY).toBe(cam);
    expect(g.waterY).toBe(water);
  });

  it('pauses from the mod cards, and resumes back to the same cards', () => {
    // Pause works from the layer end's cards, and Resume returns to them -- by
    // Esc or by the menu -- not to play.
    const g = atGate(atGate(0).plan.findIndex(e => e.end));
    ride(g);                                    // the layer end's boss (D85)
    expect(clearAndWait(g)).toBe('mods');
    const cards = g.choices.map(m => m.name).join();
    for (const resume of ['Escape', 'Enter']) {        // Esc, and the menu's Resume
      g.justPressed.add('Escape');
      g.update(g.FIXED_DT);
      expect(g.screen).toBe('paused');
      g.justPressed.add(resume);
      g.update(g.FIXED_DT);
      expect(g.screen).toBe('mods');
      expect(g.choices.map(m => m.name).join()).toBe(cards);
    }
  });

  it('brings arrivals in at the edges of the view, wherever the camera is', () => {
    const g = loadGame();
    g.reset(1);
    g.cameraY = 5000;
    g.spawnBatch({ enemies: [['drifter', 40]] });
    for (const f of g.incoming.splice(0)) g.arrive(f.name);   // its later waves too (D115)
    expect(g.enemies).toHaveLength(40);
    expect(new Set(g.enemies.map(e => e.speed)).size).toBeGreaterThan(1);   // not a drill squad
    for (const e of g.enemies) {
      const outside = e.x < 0 || e.x > g.ARENA_W ||
                      e.y < g.cameraY || e.y > g.cameraY + g.ARENA_H;
      expect(outside).toBe(true);
      expect(e.y).toBeGreaterThan(g.cameraY - 100);
      expect(e.y).toBeLessThan(g.cameraY + g.ARENA_H + 100);
    }
  });
});

// Waves (D115): a batch arrives a wave at a time, on a clock that does not wait
// for the last one to die, and its gate holds until the last wave is dead.
describe('waves', () => {
  const BIG = { enemies: [['drifter', 30], ['bulwark', 5]] };
  // A batch brought in by hand, mid-layer, with the queue stopped behind it
  // and the diver kept alive and still, so nothing dies unless a test kills it.
  const arrived = (batch = BIG, seed = 1) => {
    const g = loadGame();
    g.reset(seed);
    g.immortal = true;
    g.queuePaused = true;
    g.spawnBatch(batch);
    return g;
  };
  const counts = list => list.reduce((c, n) => ({ ...c, [n]: (c[n] || 0) + 1 }), {});

  it('brings the first wave whole and keeps the rest to come -- every fish once', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), seed => {
      const g = arrived(BIG, seed);
      expect(g.enemies.length).toBeGreaterThanOrEqual(g.WAVE_MIN);
      expect(g.enemies.length).toBeLessThanOrEqual(g.WAVE_MAX);
      expect(counts([...g.enemies, ...g.incoming].map(f => f.name))).toEqual({ drifter: 30, bulwark: 5 });
    }), { numRuns: 20 });
    expect(arrived({ enemies: [['boss', 1]] }).incoming).toEqual([]);   // one fish, one wave
  });

  it('brings each later fish at its own moment, whether or not the first wave is dead', () => {
    const g = arrived();
    const first = g.enemies.length, due = g.incoming.map(f => f.at);
    // The schedule: the second wave no sooner than one short gap, the last no
    // later than every gap long plus its trickle.
    const waves = Math.ceil(35 / g.WAVE_MIN);
    expect(due[0]).toBeGreaterThanOrEqual(g.WAVE_GAP * (1 - g.WAVE_JITTER));
    expect(due.at(-1)).toBeLessThanOrEqual((waves - 1) * g.WAVE_GAP * (1 + g.WAVE_JITTER) + g.WAVE_SPREAD);
    let bad = null;
    for (let i = 0, n = ticks(g, due.at(-1)) + 1; i < n && !bad; i++) {
      g.update(g.FIXED_DT);
      const want = first + due.filter(t => t <= g.elapsed).length;
      if (g.enemies.length !== want) bad = { at: g.elapsed, have: g.enemies.length, want };
    }
    expect(bad).toBeNull();
    expect(g.enemies.length).toBe(35);                          // all in, none killed
  });

  it('trickles a wave\'s fish in one at a time rather than all on one tick', () => {
    const at = arrived().incoming.map(f => f.at);
    expect(new Set(at).size).toBe(at.length);
  });

  it('calls the next fish at once when the arena empties, the rest moved up with it', () => {
    const g = arrived();
    const gaps = g.incoming.slice(1).map((f, i) => f.at - g.incoming[i].at);
    const left = g.incoming.length;
    for (const e of [...g.enemies]) g.killEnemy(e);
    g.update(g.FIXED_DT);                                       // swept: the arena is empty
    g.update(g.FIXED_DT);
    expect(g.enemies.length).toBeGreaterThan(0);
    expect(g.incoming.length).toBeLessThan(left);
    const now = g.incoming.slice(1).map((f, i) => f.at - g.incoming[i].at);
    expect(now).toEqual(gaps.slice(gaps.length - now.length).map(x => expect.closeTo(x, 9)));
  });

  it('holds the gate and pays nothing between waves; clears once, on the last wave\'s last fish', () => {
    const g = loadGame();
    g.reset(1);
    g.immortal = true;
    ride(g);
    expect(g.incoming.length).toBeGreaterThan(0);
    const k = g.batchIndex, cam = g.cameraY;
    let cleared = 0;
    for (let i = 0, n = ticks(g, 60); i < n && g.batchIndex === k; i++) {
      const lastWave = g.incoming.length === 0;
      for (const e of [...g.enemies]) g.killEnemy(e);
      g.update(g.FIXED_DT);
      if (g.tally.untouched) {
        cleared += 1;
        expect(lastWave).toBe(true);
        break;
      }
      expect(g.cameraY).toBe(cam);
    }
    expect(cleared).toBe(1);
  });

  it('holds the waves while paused', () => {
    const g = arrived();
    g.queuePaused = false;
    const left = g.incoming.map(f => f.at);
    g.justPressed.add('Escape');
    for (let i = 0, n = ticks(g, 30); i < n; i++) g.update(g.FIXED_DT);
    expect(g.screen).toBe('paused');
    expect(g.incoming.map(f => f.at)).toEqual(left);
  });
});
