// Mods from drops (D84, D85, D86, D87, D88). Designed in
// docs/specs/2026-10-12-mods-from-drops-design.md.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, atGate } from './harness.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

const held = g => Object.values(g.modCounts).reduce((a, b) => a + b, 0);
// Every mod a batch has paid so far: taken, or still flying in.
const paid = g => held(g) + g.drops.filter(d => d.mod).length;
// The ordinary mods a fish can carry: not a layer end's own, and fitting the
// weapon carried (D99).
const ordinary = g => g.MODS.filter(m => !m.end && g.fits(m));
// Every number a mod or boost moves: the readout's and the hearts, as
// dive.test.js holds them to be.
const STATS = [...loadGame().PLAYER_STATS.map(s => s.stat), 'hp', 'maxHp'];
const stats = p => STATS.map(k => p[k]);

// The dive's first layer end, its boss arrived, the diver kept alive.
function atLayerEnd() {
  const end = atGate(0).plan.findIndex(e => e.end);
  const g = atGate(end);
  g.immortal = true;
  ride(g);
  return g;
}

// A drifter at (x, y) killed with the boost chance forced to certainty, so a
// boost drops where it died. A second drifter is left alive in the corner,
// because the kill that empties the arena never drops one.
function boostAt(g, x, y) {
  g.queuePaused = true;
  g.immortal = true;
  g.placeEnemy('drifter', x, y);
  const victim = g.enemies.at(-1);
  g.placeEnemy('drifter', 60, g.cameraY + 60);
  g.sinceBoost = Math.ceil(1 / g.BOOST_C) - 1;
  g.killEnemy(victim);
  return g.drops.at(-1);
}

describe('a glowing fish carries the batch\'s mod (D84)', () => {
  it('lights one fish of every ordinary batch, from the moment it arrives', () => {
    // From the moment the batch arrives, not partway through the fight (D88).
    fc.assert(fc.property(seed, s => {
      const g = loadGame();
      g.reset(s);
      g.immortal = true;
      ride(g);                                     // the dive's first batch, just arrived
      const lit = g.enemies.filter(e => e.carrier);
      expect(lit).toHaveLength(1);
      expect(g.enemyType(lit[0].name).carries).not.toBe(false);
      while (g.enemies.length) { g.killEnemy(g.enemies[0]); g.update(g.FIXED_DT); }
      expect(paid(g)).toBe(1);                     // one mod, the batch's
    }), { numRuns: 25 });
  });

  it('never lights a mini-boss: its gate pays no mod', () => {
    // A mini-boss never glows, so its gate pays no mod (D88).
    const g = loadGame();
    g.immortal = true;
    expect(g.applyScenario('mini-boss', 1)).toBe(true);
    ride(g);
    expect(g.enemies.some(e => e.carrier)).toBe(false);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect(paid(g)).toBe(0);
  });

  it('never lights the boss: the layer end\'s pick pays it', () => {
    const g = atLayerEnd();
    const boss = g.enemies[0];
    expect(boss.carrier).toBeFalsy();
    expect(clearAndWait(g)).toBe('mods');
    expect(paid(g)).toBe(0);
  });

  it('drops the batch\'s mod even when everything left dies in one tick', () => {
    fc.assert(fc.property(seed, s => {
      const g = loadGame();
      g.reset(s);
      ride(g);
      for (const e of [...g.enemies]) g.killEnemy(e);
      g.update(g.FIXED_DT);
      expect(g.drops.filter(d => d.mod)).toHaveLength(1);
    }), { numRuns: 15 });
  });

  it('flies the mod to you from wherever it fell, then counts it, applies it and names it', () => {
    const g = loadGame();
    g.reset(1);
    g.immortal = true;
    ride(g);
    for (const e of [...g.enemies]) g.killEnemy(e);   // where they arrived: outside the view
    for (let i = 0, n = ticks(g, 3); i < n && !held(g); i++) g.update(g.FIXED_DT);
    expect(held(g)).toBe(1);
    const [name] = Object.keys(g.modCounts);
    expect(g.banner).toContain(name);
    // The same diver with the mod's own step applied by hand.
    const fresh = loadGame();
    fresh.reset(1);
    fresh.MODS.find(m => m.name === name).apply(fresh.player);
    expect(stats(g.player)).toEqual(stats(fresh.player));
  });

  it('names what a mod moves on its pickup line in words, never by the code\'s keys', () => {
    const g = loadGame();
    for (const m of g.MODS) {
      g.reset(1);
      const moved = g.modPreview(m);
      g.collectMod(m.name);
      for (const { stat, from, to } of moved) {
        expect(g.STAT_NAMES[stat], stat).toBeTruthy();
        expect(g.banner).toContain(g.STAT_NAMES[stat] + ' ' + from + ' → ' + +to.toFixed(2));
      }
    }
  });

  it('names a pickup on its own line, never over a challenge\'s', () => {
    // A clean first batch pays the "untouched" challenge as it clears (D109), while
    // its mod is still flying in: the two lines must not overwrite each other.
    const g = loadGame();
    g.reset(1);
    g.immortal = true;
    ride(g);
    for (const e of [...g.enemies]) g.killEnemy(e);
    g.update(g.FIXED_DT);                          // the clear: the challenge pays
    const paid = g.notice;
    expect(paid).not.toBe('');
    for (let i = 0, n = ticks(g, 3); i < n && !held(g); i++) g.update(g.FIXED_DT);
    expect(held(g)).toBe(1);
    expect(g.notice).toBe(paid);
    expect(g.banner).toContain(Object.keys(g.modCounts)[0]);
  });

  it('lights no fish once every ordinary mod is at its cap', () => {
    const g = loadGame();
    g.reset(1);
    g.immortal = true;
    for (const m of ordinary(g)) g.modCounts[m.name] = m.max;
    const before = held(g);
    ride(g);
    expect(g.enemies.some(e => e.carrier)).toBe(false);
    while (g.enemies.length) { g.killEnemy(g.enemies[0]); g.update(g.FIXED_DT); }
    expect(paid(g)).toBe(before);
  });

  it('carries nothing on a fish placed by hand', () => {
    // A scenario's lone drifter belongs to no batch (D37).
    const g = loadGame();
    expect(g.applyScenario('one-drifter', 1)).toBe(true);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect(paid(g)).toBe(0);
  });
});

describe('weapon mods (D99)', () => {
  const barbs = g => g.MODS.find(m => m.name === 'Barbs');

  it('never deals one for a weapon not carried, by a fish or on a card', () => {
    const g = loadGame();
    g.reset(1);                                  // carrying the Gun
    for (let m; (m = g.drawCarried()); ) {
      expect(m.name).not.toBe('Barbs');
      g.takeMod(m);
    }
    for (let s = 0; s < 30; s++) {
      g.reset(s);
      expect(g.rollValuable().map(m => m.name)).not.toContain('Barbs');
    }
  });

  it('deals one like any mod, up to its cap, while a weapon it fits is carried', () => {
    const g = loadGame();
    g.applyScenario('harpoon', 1);
    const names = [];
    for (let m; (m = g.drawCarried()); ) { names.push(m.name); g.takeMod(m); }
    expect(names.filter(n => n === 'Barbs')).toHaveLength(barbs(g).max);
    expect(g.player.pierce).toBe(g.WEAPONS.find(w => w.name === 'Harpoon').pierce + barbs(g).max);
  });
});

describe('which mod a fish carries (D84)', () => {
  // Every mod a dive's fish would carry, drawn and taken until none is left.
  const deal = s => {
    const g = loadGame();
    g.reset(s);
    const out = [];
    for (let m = g.drawCarried(); m; m = g.drawCarried()) {
      out.push(m.name);
      g.takeMod(m);
    }
    return out;
  };

  it('deals every ordinary mod once before any comes again, up to the caps', () => {
    const g = loadGame();
    const ord = ordinary(g);
    fc.assert(fc.property(seed, s => {
      const names = deal(s);
      expect(names).toHaveLength(ord.reduce((n, m) => n + m.max, 0));
      // A round is spent once every mod still under its cap has come in it.
      const counts = {};
      let round = new Set();
      for (const n of names) {
        const open = ord.filter(m => (counts[m.name] || 0) < m.max).map(m => m.name);
        if (open.every(x => round.has(x))) round = new Set();
        expect(round.has(n)).toBe(false);
        round.add(n);
        counts[n] = (counts[n] || 0) + 1;
      }
      expect(names.some(n => g.MODS.find(m => m.name === n).end)).toBe(false);
    }), { numRuns: 20 });
  });

  it('deals the same mods from the same seed', () => {
    fc.assert(fc.property(seed, s => { expect(deal(s)).toEqual(deal(s)); }), { numRuns: 10 });
  });

  // One slot left in the whole pool: every ordinary mod at its cap but the
  // last, one short. A batch is killed at once, so its fish's mod drops.
  const lastSlot = () => {
    const g = loadGame();
    g.reset(1);
    g.immortal = true;
    for (const m of ordinary(g)) g.modCounts[m.name] = m.max;
    const last = ordinary(g).at(-1);
    g.modCounts[last.name] = last.max - 1;
    return g;
  };
  const killAll = g => { for (const e of [...g.enemies]) g.killEnemy(e); g.update(g.FIXED_DT); };

  it('counts a mod still in the air as held: no fish lights for a slot it has taken', () => {
    // Lit, that fish would die with nothing left to draw.
    const g = lastSlot();
    ride(g);
    killAll(g);
    const inAir = g.drops.find(d => d.mod);
    inAir.x = -5000;                             // a long flight: still in the air
    ride(g);                                     // when the next batch arrives
    expect(g.drops).toContain(inAir);
    expect(g.enemies.some(e => e.carrier)).toBe(false);
    inAir.x = g.player.x;
    inAir.y = g.player.y;
    g.update(g.FIXED_DT);                        // it lands
    expect(() => killAll(g)).not.toThrow();
  });

  it('never hands the last slot of a mod out twice', () => {
    const g = lastSlot();
    ride(g);
    killAll(g);
    const inAir = g.drops.find(d => d.mod);
    inAir.x = -5000;                             // still in the air...
    ride(g);
    expect(g.drops).toContain(inAir);
    killAll(g);                                  // ...as the next batch dies
    for (const d of g.drops) { d.x = g.player.x; d.y = g.player.y; }
    g.update(g.FIXED_DT);
    for (const m of g.MODS) expect(g.modCounts[m.name] || 0).toBeLessThanOrEqual(m.max);
  });

  it('counts a mod still in the air when the layer end deals its cards', () => {
    const g = loadGame();
    g.reset(1);
    const x = ordinary(g)[0];
    for (const m of g.MODS) g.modCounts[m.name] = m.max;
    g.modCounts[x.name] = x.max - g.END_STEP;    // room for one card of it...
    g.drops.push({ x: 0, y: 0, r: 7, mod: x.name });   // ...but one is on its way
    expect(g.rollValuable().map(c => c.name)).not.toContain(x.name);
  });
});

describe('the layer end\'s pick (D85)', () => {
  const cardsWith = setup => {
    const g = loadGame();
    g.reset(7);
    setup(g);
    return g.rollValuable();
  };

  it('offers three valuable mods on a fresh dive, its own and the ordinary ones', () => {
    const g = loadGame();
    const pool = new Set();
    for (let s = 1; s <= 40; s++) {
      g.reset(s);
      const cards = g.rollValuable();
      expect(cards).toHaveLength(3);
      expect(new Set(cards.map(c => c.name)).size).toBe(3);
      for (const c of cards) pool.add(c.name);
    }
    // A mix of both kinds (D85).
    expect([...pool].some(n => g.MODS.find(m => m.name === n).end)).toBe(true);
    expect([...pool].some(n => !g.MODS.find(m => m.name === n).end)).toBe(true);
  });

  it('never offers an ordinary mod without room for the bigger step', () => {
    const cards = cardsWith(g => {
      for (const m of ordinary(g)) g.modCounts[m.name] = m.max - 1;   // one short of the cap
    });
    expect(cards.every(c => c.end)).toBe(true);
  });

  it('never offers one of its own past its cap, and offers nothing with everything capped', () => {
    const own = cardsWith(g => {
      for (const m of g.MODS.filter(m => m.end)) g.modCounts[m.name] = m.max;
    });
    expect(own.some(c => c.end)).toBe(false);
    expect(cardsWith(g => { for (const m of g.MODS) g.modCounts[m.name] = m.max; })).toEqual([]);
  });

  it('marks a card on a click or a number, and takes the marked one on Continue', () => {
    const g = atLayerEnd();
    expect(clearAndWait(g)).toBe('mods');
    expect(g.choices).toHaveLength(3);
    expect(g.choiceIndex).toBe(1);                          // opens on the middle card
    const at = r => { g.aim.x = r.x + r.w / 2; g.aim.y = r.y + r.h / 2; };
    at(g.cardRect(0, 3));
    g.update(g.FIXED_DT);
    expect(g.choiceIndex).toBe(1);                          // passing over a card marks nothing
    g.justPressed.add('Mouse0');
    g.update(g.FIXED_DT);
    expect([g.screen, g.choiceIndex]).toEqual(['mods', 0]); // a click marks
    g.justPressed.add('Digit3');
    g.update(g.FIXED_DT);
    expect([g.screen, g.choiceIndex]).toEqual(['mods', 2]); // and so does a number
    const chosen = g.choices[2], had = g.modCounts[chosen.name] || 0, cam = g.cameraY;
    for (let i = 0, n = ticks(g, 3); i < n; i++) g.update(g.FIXED_DT);
    expect([g.screen, g.cameraY]).toEqual(['mods', cam]);   // the current waits for Continue
    at(g.continueRect());
    g.justPressed.add('Mouse0');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
    // The layer end's own mods come once, an ordinary one at the bigger step.
    expect(g.modCounts[chosen.name]).toBe(had + (chosen.end ? 1 : g.END_STEP));
  });

  it('takes the marked card on Enter, and Continue alone when nothing is left', () => {
    const g = atLayerEnd();
    expect(clearAndWait(g)).toBe('mods');
    const chosen = g.choices[1];
    g.justPressed.add('Enter');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
    expect(g.modCounts[chosen.name]).toBe(chosen.end ? 1 : g.END_STEP);
    const h = atLayerEnd();
    for (const m of h.MODS) h.modCounts[m.name] = m.max;
    expect(clearAndWait(h)).toBe('mods');
    expect(h.choices).toEqual([]);
    h.justPressed.add('Enter');
    h.update(h.FIXED_DT);
    expect(h.screen).toBe('playing');
  });
});

describe('boosts (D86)', () => {
  it('grows the chance with every kill: never 1/C kills apart, and seldom two in a row', () => {
    const gaps = [];
    for (let s = 1; s <= 30; s++) {
      const g = loadGame();
      g.reset(s);
      g.queuePaused = true;
      for (let i = 0; i < 201; i++) {
        g.placeEnemy('drifter', 100 + (i % 20) * 50, g.cameraY + 100 + Math.floor(i / 20) * 50);
      }
      let last = 0;
      for (let k = 1; k <= 200; k++) {                       // the 201st is never killed
        const n = g.drops.length;
        g.killEnemy(g.enemies[k - 1]);
        if (g.drops.length > n) { gaps.push(k - last); last = k; }
      }
    }
    expect(gaps.length).toBeGreaterThan(100);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(Math.ceil(1 / loadGame().BOOST_C));
    // A flat chance at the same rate drops back to back about one time in
    // eight; a chance that starts small and grows, about one in fifty.
    expect(gaps.filter(x => x === 1).length / gaps.length).toBeLessThan(0.06);
  });

  it('never drops one from the kill that ends the batch -- only empties the arena, and it may', () => {
    const lone = waves => {
      const g = loadGame();
      g.reset(1);
      g.queuePaused = true;
      g.incoming = waves;
      g.placeEnemy('drifter', 100, g.cameraY + 100);
      g.sinceBoost = Math.ceil(1 / g.BOOST_C);               // certain, but for the rule
      g.killEnemy(g.enemies[0]);
      return g.drops;
    };
    expect(lone([])).toHaveLength(0);
    // A wave still to come: the fight goes on, so the boost has a use (D115).
    expect(lone([{ name: 'drifter', at: 99 }])).toHaveLength(1);
    const h = loadGame();
    h.reset(1);
    expect(boostAt(h, 100, h.cameraY + 100).boost).toBeTruthy();   // with a fish left, it drops
  });

  it('leaves a boost where it fell, and lets it go after its life', () => {
    const g = loadGame();
    g.reset(1);
    const b = boostAt(g, 1100, g.cameraY + 700);
    const where = [b.x, b.y], base = stats(g.player);
    for (let i = 0, n = ticks(g, g.BOOST_LIFE - 0.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.drops.filter(d => d.boost).map(d => [d.x, d.y])).toEqual([where]);
    for (let i = 0, n = ticks(g, 0.2); i < n; i++) g.update(g.FIXED_DT);
    expect(g.drops.filter(d => d.boost)).toHaveLength(0);
    expect(stats(g.player)).toEqual(base);
  });

  it('adds its numbers on a touch, takes them back after its time, and restarts on a second', () => {
    const g = loadGame();
    g.reset(1);
    const base = { ...g.player };
    const name = boostAt(g, g.player.x, g.player.y).boost;
    const b = g.BOOSTS.find(x => x.name === name);
    const on = () => Object.keys(b.add).map(k => g.player[k] - base[k]);
    g.update(g.FIXED_DT);                                    // touched where it fell
    expect(on()).toEqual(Object.values(b.add));
    expect(g.banner).toContain(name);
    for (let i = 0, n = ticks(g, b.time / 2); i < n; i++) g.update(g.FIXED_DT);
    boostAt(g, g.player.x, g.player.y);                      // the same boost again
    g.update(g.FIXED_DT);
    expect(on()).toEqual(Object.values(b.add));              // added once, not twice
    for (let i = 0, n = ticks(g, b.time * 0.75); i < n; i++) g.update(g.FIXED_DT);
    expect(on()).toEqual(Object.values(b.add));              // past the first's end: restarted
    for (let i = 0, n = ticks(g, b.time * 0.5); i < n; i++) g.update(g.FIXED_DT);
    expect(on().every(v => Math.abs(v) < 1e-9)).toBe(true); // and gone
  });

  it('puts every boost\'s numbers on with a touch and takes them back after its time', () => {
    const g = loadGame();
    for (const b of g.BOOSTS) {
      g.reset(1);
      g.queuePaused = true;
      const base = { ...g.player };
      g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: b.name, life: g.BOOST_LIFE });
      g.update(g.FIXED_DT);
      expect(Object.keys(b.add).map(k => g.player[k] - base[k])).toEqual(Object.values(b.add));
      for (let i = 0, n = ticks(g, b.time + 0.05); i < n; i++) g.update(g.FIXED_DT);
      expect(Object.keys(b.add).every(k => Math.abs(g.player[k] - base[k]) < 1e-9)).toBe(true);
    }
  });

  it('names a boost in words true of the weapon carried: no shots for the Knife', () => {
    const g = loadGame();
    const touch = (b, setup) => {
      setup();
      g.queuePaused = true;
      g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: b.name, life: g.BOOST_LIFE });
      g.update(g.FIXED_DT);
      return g.banner;
    };
    for (const b of g.BOOSTS) {
      expect(touch(b, () => g.reset(1))).toContain(b.desc);              // the Gun shoots
      expect(touch(b, () => g.applyScenario('knife', 1))).not.toMatch(/shot|fire/);
    }
  });

  it('holds a boost\'s time while the game is paused', () => {
    const g = loadGame();
    g.reset(1);
    const name = boostAt(g, g.player.x, g.player.y).boost;   // one drop, whichever it is
    const b = g.BOOSTS.find(x => x.name === name);
    const k = Object.keys(b.add)[0], base = g.player[k];
    g.update(g.FIXED_DT);
    const boosted = g.player[k];
    expect(boosted).toBe(base + b.add[k]);
    g.justPressed.add('Escape');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('paused');
    for (let i = 0, n = ticks(g, b.time * 2); i < n; i++) g.update(g.FIXED_DT);
    g.justPressed.add('Escape');                             // resume
    g.update(g.FIXED_DT);
    expect(g.player[k]).toBe(boosted);
    for (let i = 0, n = ticks(g, b.time); i < n; i++) g.update(g.FIXED_DT);
    expect(g.player[k]).toBe(base);
  });
});

describe('the mods themselves', () => {
  it('are each body, comfort, or a weapon mod naming real weapons, under names of their own (D99)', () => {
    const g = loadGame();
    const scoped = m => m.scope === 'body' || m.scope === 'comfort' ||
      m.scope === 'weapon' && m.weapons?.length > 0 && m.weapons.every(n => g.WEAPONS.some(w => w.name === n));
    expect(g.MODS.filter(m => !scoped(m)).map(m => m.name)).toEqual([]);
    expect(new Set(g.MODS.map(m => m.name)).size).toBe(g.MODS.length);
  });

  it('each move no more stats than a card has rows for', () => {
    const g = loadGame();
    g.reset();
    expect(g.MODS.filter(m => g.modPreview(m).length > g.MOD_ROWS).map(m => m.name)).toEqual([]);
  });

  it('preview exactly what taking one does, without doing it (D52)', () => {
    const g = loadGame();
    g.reset();
    const fins = g.MODS.find(m => m.name === 'Fins');
    const speed = g.player.speed;
    const preview = g.modPreview(fins);
    expect(g.player.speed).toBe(speed);        // previewing applies nothing
    fins.apply(g.player);
    expect(preview).toHaveLength(1);
    expect([preview[0].stat, preview[0].to]).toEqual(['speed', g.player.speed]);
  });

  it('are counted and applied when taken from a card -- Mend\'s effect too -- and gone with the dive', () => {
    const g = loadGame();
    g.reset();
    g.screen = 'mods';
    g.choices = [g.MODS.find(m => m.name === 'Mend')];
    g.choiceIndex = 0;
    g.justPressed.add('Enter');
    g.update(0.016);
    expect([g.modCounts.Mend, g.player.mendOnClear]).toEqual([1, 1]);
    g.reset();                                 // mods are dive-scoped (D34)
    expect(g.modCounts).toEqual({});
  });
});

describe('rank is retired (D87)', () => {
  it('keeps no rank in the dive or in the save', () => {
    const g = loadGame();
    g.reset(1);
    ride(g);
    clearAndWait(g, 0.5);
    expect(JSON.parse(g.saveText()).dive).not.toHaveProperty('rank');
  });
});

describe('the save, version 3 (D84)', () => {
  it('keeps the glowing fish across a save, and it still drops its mod', () => {
    const a = loadGame();
    a.reset(3);
    a.immortal = true;
    ride(a);                                     // arrived, its fish lit
    const b = loadGame();
    b.immortal = true;
    expect(b.loadSave(a.saveText())).toBe('');
    b.screen = b.resumeTo;
    const which = b.enemies.findIndex(e => e.carrier);
    expect(which).toBe(a.enemies.findIndex(e => e.carrier));
    expect(which).toBeGreaterThanOrEqual(0);
    b.killEnemy(b.enemies[which]);
    b.update(b.FIXED_DT);
    expect(paid(b)).toBe(1);
  });

  const fixture = v => JSON.parse(readFileSync(new URL('./fixtures/save-v' + v + '.json', import.meta.url), 'utf8'));

  it('brings a v2 dive saved with the cards up back with the marked card taken', () => {
    const v2 = fixture(2);
    Object.assign(v2.dive, { at: 'mods', choices: ['Fins', 'Reflex', 'Nerve'], choiceIndex: 1 });
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v2))).toBe('');
    expect(g.modCounts.Reflex).toBe(1);
    expect(g.player.dashCooldown).toBeCloseTo(v2.dive.player.dashCooldown - 0.4);
    expect(g.resumeTo).toBe('playing');
    const saved = JSON.parse(g.saveText());
    expect(saved.version).toBe(g.freshMeta().version);
    expect(saved.dive).not.toHaveProperty('rank');
  });
});
