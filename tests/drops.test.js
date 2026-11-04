// Mods from drops (D84, D85, D86, D87, D88).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, atGate } from './harness.js';

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });

const held = g => Object.values(g.modCounts).reduce((a, b) => a + b, 0);
// Every mod a batch has paid so far: taken, or still flying in.
const paid = g => held(g) + g.drops.filter(d => d.mod).length;
// The ordinary mods a fish can carry: not a layer end's own.
const ordinary = g => g.MODS.filter(m => !m.end);
// Every number a mod or boost moves: the readout's and HP, as
// dive.test.js holds them to be.
const STATS = [...loadGame().PLAYER_STATS.map(s => s.stat), 'hp', 'maxHp'];
const stats = p => STATS.map(k => p[k]);
// What a boost adds to diver `p`, read off its record: `add` as it stands, and
// `percent` of the diver's own number (D125).
const adds = (b, p) => ({ ...b.add,
  ...Object.fromEntries(Object.entries(b.percent || {}).map(([k, v]) => [k, p[k] * v / 100])) });

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
// `name` makes it that boost, whatever the seed draws.
function boostAt(g, x, y, name) {
  g.queuePaused = true;
  g.immortal = true;
  g.placeEnemy('drifter', x, y);
  const victim = g.enemies.at(-1);
  g.placeEnemy('drifter', 60, g.cameraY + 60);
  g.sinceBoost = Math.ceil(1 / g.BOOST_C) - 1;
  g.killEnemy(victim);
  if (name) g.drops.at(-1).boost = name;
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
    // A clean batch pays the "untouched" challenge as it clears (D109), while
    // its mod is still flying in: the two lines must not overwrite each other.
    const g = loadGame();
    g.reset(1);
    g.plan[0] = { layer: 0, batch: { enemies: [['drifter', g.WAVE_MIN]] } };   // one wave
    g.immortal = true;
    g.tally.untouched = g.CHALLENGES.find(c => c.name === 'untouched').rungs[0] - 1;
    ride(g);
    for (const e of [...g.enemies]) g.killEnemy(e);
    g.update(g.FIXED_DT);                          // the clear: the challenge pays
    expect(g.notice).toMatch(/untouched/);
    const paid = g.notice;
    expect(paid).not.toBe('');
    for (let i = 0, n = ticks(g, 3); i < n && !held(g); i++) g.update(g.FIXED_DT);
    expect(held(g)).toBe(1);
    expect(g.notice).toBe(paid);
    expect(g.banner).toContain(Object.keys(g.modCounts)[0]);
  });

  it('carries nothing on a fish placed by hand', () => {
    // A scenario's lone drifter belongs to no batch (D37).
    const g = loadGame();
    expect(g.applyScenario('one-drifter', 1)).toBe(true);
    expect(clearAndWait(g, 1)).toBe('playing');
    expect(paid(g)).toBe(0);
  });
});

describe('which mod a fish carries (D84)', () => {
  // The first mods a dive's fish would carry, drawn and taken: more than a
  // whole dive's, and past every cap there was before D209.
  const DEALT = 40;
  const deal = s => {
    const g = loadGame();
    g.reset(s);
    const out = [];
    for (let m = g.drawCarried(); m && out.length < DEALT; m = g.drawCarried()) {
      out.push(m.name);
      g.takeMod(m);
    }
    return out;
  };

  it('deals every ordinary mod once before any comes again, with no cap to stop it (D209)', () => {
    const g = loadGame();
    const ord = ordinary(g);
    fc.assert(fc.property(seed, s => {
      const names = deal(s);
      expect(names).toHaveLength(DEALT);
      // A round is spent once every mod still under its cap has come in it.
      const counts = {};
      let round = new Set();
      for (const n of names) {
        const open = ord.filter(m => (counts[m.name] || 0) < (m.max ?? Infinity)).map(m => m.name);
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

  it('never offers one of its own past its cap', () => {
    const own = cardsWith(g => {
      for (const m of g.MODS.filter(m => m.end)) g.modCounts[m.name] = m.max;
    });
    expect(own.some(c => c.end)).toBe(false);
    expect(own).toHaveLength(3);                 // the uncapped ones fill the cards (D209)
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

  it('takes the marked card on Enter', () => {
    const g = atLayerEnd();
    expect(clearAndWait(g)).toBe('mods');
    const chosen = g.choices[1];
    g.justPressed.add('Enter');
    g.update(g.FIXED_DT);
    expect(g.screen).toBe('playing');
    expect(g.modCounts[chosen.name]).toBe(chosen.end ? 1 : g.END_STEP);
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

  it('adds its numbers on a touch, takes them back after its time, and adds its time on a second (D204)', () => {
    const g = loadGame();
    g.reset(1);
    const base = { ...g.player };
    const name = boostAt(g, g.player.x, g.player.y).boost;
    const b = g.BOOSTS.find(x => x.name === name);
    const want = adds(b, base);
    const on = () => Object.keys(want).map(k => g.player[k] - base[k]);
    g.update(g.FIXED_DT);                                    // touched where it fell
    expect(on()).toEqual(Object.values(want));
    expect(g.banner).toContain(name);
    for (let i = 0, n = ticks(g, b.time / 2); i < n; i++) g.update(g.FIXED_DT);
    boostAt(g, g.player.x, g.player.y, name);                // the same boost again
    g.update(g.FIXED_DT);
    expect(on()).toEqual(Object.values(want));               // added once, not twice
    for (let i = 0, n = ticks(g, b.time * 1.3); i < n; i++) g.update(g.FIXED_DT);
    expect(on()).toEqual(Object.values(want));               // half its life left, and a whole one more
    for (let i = 0, n = ticks(g, b.time * 0.3); i < n; i++) g.update(g.FIXED_DT);
    expect(on().every(v => Math.abs(v) < 1e-9)).toBe(true); // and gone
  });

  it('adds a boost\'s time to its own clock only, with no ceiling (D204)', () => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    const [a, c] = g.BOOSTS;
    const touch = name => {
      g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: name, life: g.BOOST_LIFE });
      g.update(g.FIXED_DT);
    };
    touch(a.name);
    touch(c.name);
    const left = name => g.boosts.find(x => x.name === name).left;
    const [mine, other] = [left(a.name), left(c.name)];
    for (let k = 0; k < 4; k++) touch(a.name);
    expect(left(a.name)).toBeCloseTo(mine + 4 * a.time - 4 * g.FIXED_DT, 6);
    expect(left(c.name)).toBeCloseTo(other - 4 * g.FIXED_DT, 6);
  });

  it('puts every boost\'s numbers on with a touch, with every weapon it fits, and takes them back after its time', () => {
    // A share of the weapon's own number, so each keeps its pace (D125).
    const g = loadGame();
    for (const w of g.WEAPONS) {
      for (const b of g.BOOSTS) {
        g.reset(1, w);
        g.queuePaused = true;
        const base = { ...g.player }, want = adds(b, base);
        g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: b.name, life: g.BOOST_LIFE });
        g.update(g.FIXED_DT);
        expect(Object.keys(want).map(k => g.player[k] - base[k])).toEqual(Object.values(want));
        for (let i = 0, n = ticks(g, b.time + 0.05); i < n; i++) g.update(g.FIXED_DT);
        expect(Object.keys(want).every(k => Math.abs(g.player[k] - base[k]) < 1e-9)).toBe(true);
      }
    }
  });

  it('keeps the weapons in their order: a boost adds to no weapon\'s number, only raises one by a share (D125)', () => {
    const g = loadGame();
    const numbers = [...new Set(g.WEAPONS.flatMap(w => Object.keys(w)
      .filter(k => typeof w[k] === 'number' && k !== 'cost')))];
    for (const b of g.BOOSTS) {
      expect(Object.keys(b.add || {}).filter(k => numbers.includes(k))).toEqual([]);
      // A share of nothing is nothing: only of a number every weapon has --
      // or of the diver's own, which no weapon carries.
      for (const k in b.percent) if (numbers.includes(k)) expect(g.WEAPONS.filter(w => !(w[k] > 0)).map(w => w.name)).toEqual([]);
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

  // Touched where the diver stands, nothing arriving.
  const touched = name => {
    const g = loadGame();
    g.reset(1);
    g.queuePaused = true;
    g.immortal = true;
    g.drops.push({ x: g.player.x, y: g.player.y, r: 6, boost: name, life: g.BOOST_LIFE });
    g.update(g.FIXED_DT);
    return [g, g.BOOSTS.find(b => b.name === name)];
  };

  it('jolts the water round the diver three times a touch, the first at once: fish in its reach are hurt, none beyond (D207)', () => {
    const [g, b] = touched('Jolt');
    const P = b.pulse;
    g.player.fireTimer = 999;
    g.placeEnemy('drifter', g.player.x + g.player.r + 18 + P.reach - 4, g.player.y);
    g.placeEnemy('drifter', g.player.x - g.player.r - 18 - P.reach - 30, g.player.y);
    const [near, far] = g.enemies;
    for (const e of [near, far]) Object.assign(e, { hp: 99, maxHp: 99, speed: 0 });
    const at = [near.x, near.y];
    for (let i = 0, n = ticks(g, b.time + 1); i < n; i++) { g.update(g.FIXED_DT); [near.x, near.y] = at; }
    expect([99 - near.hp, 99 - far.hp]).toEqual([3 * P.damage, 0]);
    expect(g.particles.some(p => p.ring !== undefined)).toBe(false);   // and done
  });

  it('throws spines every way three times a touch, the first at once, none of them the weapon\'s shot (D207)', () => {
    const [g, b] = touched('Urchin');
    const S = b.spines, thrown = new Set();
    g.player.fireTimer = 999;
    g.tally.marksman = 5;
    const first = g.bullets.filter(x => !x.weapon);
    expect(first).toHaveLength(S.count);                                     // at once
    const a = first.map(x => Math.atan2(x.vy, x.vx)).sort((p, q) => p - q);
    const gaps = a.map((x, i) => (i ? x - a[i - 1] : x + 2 * Math.PI - a.at(-1)));
    expect(Math.max(...gaps)).toBeCloseTo(2 * Math.PI / S.count, 6);         // all the way round, evenly
    for (let i = 0, n = ticks(g, 5); i < n; i++) {
      g.update(g.FIXED_DT);
      for (const x of g.bullets) if (!x.weapon) thrown.add(x.id);
    }
    expect(thrown.size + first.length - first.filter(x => thrown.has(x.id)).length).toBe(3 * S.count);
    expect(g.tally.marksman).toBe(5);                                        // a spine that misses is no miss
  });

  it('holds a boost\'s time while the game is paused', () => {
    const g = loadGame();
    g.reset(1);
    const name = boostAt(g, g.player.x, g.player.y).boost;   // one drop, whichever it is
    const b = g.BOOSTS.find(x => x.name === name);
    const want = adds(b, g.player);
    const k = Object.keys(want)[0], base = g.player[k];
    g.update(g.FIXED_DT);
    const boosted = g.player[k];
    expect(boosted).toBe(base + want[k]);
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
  it('are each body or comfort, none a weapon\'s own, under names of their own (D99, D208)', () => {
    const g = loadGame();
    const scoped = m => m.scope === 'body' || m.scope === 'comfort';
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
