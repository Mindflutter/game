// The debug mode (D102). Each failure case it could meet is pinned here: the
// save, the kit, the place, the fish, the code, the keys and every way out.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame, loadReplay, ticks, play, die, until } from './harness.js';

// A game in the debug mode, on its setup screen.
function setup(code = '', seed = 7) {
  const g = loadGame();
  g.openDebug(code, seed);
  expect(g.screen).toBe('debug');
  return g;
}
const press = (g, code) => { g.justPressed.add(code); g.update(g.FIXED_DT); };
const row = (g, label) => g.MENUS.debug.items.findIndex(r => r.label === label);
// The batch's fish: those in, and those its later waves still bring (D115).
// The first layer's gates as a setup code numbers them: the first escorted one
// a mini-boss's, the last the boss's, the one before the mini-boss plain.
const GATES = loadGame().LAYERS[0].stretches.flatMap(s => Array(s.draw).fill(s));
const MINI = GATES.findIndex(s => s.escorts) + 1, BOSS = GATES.length, PLAIN = MINI - 1;
const counted = g => Object.fromEntries([...g.enemies, ...g.incoming].reduce((m, e) => m.set(e.name, (m.get(e.name) || 0) + 1), new Map()));

describe('the save is never touched', () => {
  it('opens on a fresh kit, whatever the save held -- gear, gems or a dive', () => {
    const real = loadGame();
    real.meta.bank = 500;
    real.meta.gear = { Mask: 2 };
    real.reset(3);
    const g = loadGame();
    expect(g.loadSave(real.saveText())).toBe('');
    expect(g.diveLive).toBe(true);
    g.openDebug('', 7);
    expect(g.meta).toEqual(g.freshMeta());
    expect(g.diveLive).toBe(false);
  });

  it('writes nothing: not on pause, not when the dive ends, not when the platform asks', () => {
    const g = setup('L1,G1,S7,Gun0');
    g.debugDive();
    press(g, 'Escape');
    expect(g.screen).toBe('paused');
    g.MENUS.paused.items[0].run();
    g.saveNow();                                 // the page hidden, or closed
    die(g);
    expect(g.saved).toBeUndefined();
  });

  it('the platform saves only through saveNow(), the one place that asks', () => {
    const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
    expect(main).not.toMatch(/persist\(saveText\(\)\)/);
  });
});

describe('the sound', () => {
  it('starts muted -- M turns it on -- and only in the debug mode', () => {
    expect(loadGame().muted).toBe(false);
    expect(setup().muted).toBe(true);
  });
});

describe('the setup reaches the dive', () => {
  it('the kit: the weapon at its tier, equipment, attributes and mods, as a dive from home gives them', () => {
    const g = setup('L1,G1,S7,Harpoon2,Mask1,Suit2,Heart2,Strength1,Fins2,Nerve3');
    g.debugDive();
    const h = loadGame();
    h.meta = { ...h.freshMeta(), carried: 'Harpoon', owned: ['Gun', 'Harpoon', 'Knife'],
               gear: { Harpoon: 2, Mask: 1, Suit: 2 }, raised: { Heart: 2, Strength: 1 } };
    h.reset(7);
    for (const n of ['Fins', 'Fins', 'Nerve', 'Nerve', 'Nerve']) h.takeMod(h.MODS.find(m => m.name === n));
    expect(g.weaponName).toBe('Harpoon');
    expect(g.player).toEqual(h.player);
    expect(g.modCounts).toEqual({ Fins: 2, Nerve: 3 });
  });

  it('the boosts: each laid on the floor beside the diver as many times as set', () => {
    const g = setup('L1,G1,S7,Knife0,Rush2,Bloom1');
    g.debugDive();
    const laid = g.drops.filter(d => d.boost).map(d => d.boost).sort();
    expect(laid).toEqual(['Bloom', 'Rush', 'Rush']);
    for (const d of g.drops) {
      expect(Math.hypot(d.x - g.player.x, d.y - g.player.y)).toBeLessThan(250);
      expect(d.life).toBe(g.BOOST_LIFE);
    }
  });

  it('the place: the chosen layer and gate, the camera at its depth', () => {
    const g = setup('L2,G5,S7,Gun0');
    g.debugDive();
    const b = g.plan.findIndex(e => e.layer === 1) + 4;
    expect(g.batchIndex).toBe(b);
    expect(g.cameraY).toBe(g.gateDepth(b));
  });

  it("its fish arrive in place of the gate's batch -- that gate's alone, the pool untouched", () => {
    const g = setup('L1,G3,S7,Gun0,puffer4,eel2');
    const pools = JSON.stringify(g.LAYERS);
    g.debugDive();
    const b = g.batchIndex;
    for (let i = 0, n = ticks(g, 3); i < n && !g.enemies.length; i++) g.update(g.FIXED_DT);
    expect(counted(g)).toEqual({ puffer: 4, eel: 2 });
    expect(JSON.stringify(g.LAYERS)).toBe(pools);
    const drawn = loadGame();
    drawn.reset(7);
    expect(g.plan[b + 1]).toEqual(drawn.plan[b + 1]);
  });

  it("puts its fish in place of a mini-boss's escorts too (D116)", () => {
    const g = setup(`L1,G${MINI},S7,Gun0,puffer4`);
    g.debugDive();
    const drawn = loadGame();
    drawn.reset(7);
    expect(drawn.plan[g.batchIndex].escorts).toBeDefined();   // an escorted gate
    for (let i = 0, n = ticks(g, 3); i < n && !g.enemies.length; i++) g.update(g.FIXED_DT);
    expect([...g.enemies, ...g.incoming].map(f => f.name)).toEqual(Array(4).fill('puffer'));
  });

  it("says what a gate drew, a mini-boss's escorts and the boss's crowd included (D116)", () => {
    expect(setup(`L1,G${PLAIN},S7`).gateLine()).not.toMatch(/escorted|crowd/);
    expect(setup(`L1,G${MINI},S7`).gateLine()).toMatch(/1 mini-boss, escorted by \d+ \w+/);
    expect(setup(`L1,G${BOSS},S7`).gateLine()).toMatch(/1 boss, its crowd from \d+ \w+/);
  });

  it('no fish set: the gate brings what it drew', () => {
    const g = setup('L1,G3,S7,Gun0');
    g.debugDive();
    const drawn = loadGame();
    drawn.reset(7);
    expect(g.plan).toEqual(drawn.plan);
  });

  it("immortal and one-shot are the setup's, and a setup without them switches them off", () => {
    const g = setup('L1,G1,S7,Gun0,immortal,oneshot');
    g.debugDive();
    expect(g.immortal).toBe(true);
    expect(g.player.damage).toBe(g.ONE_SHOT);
    g.debugSetup.immortal = false;
    g.debugSetup.oneShot = false;
    g.debugDive();
    expect(g.immortal).toBe(false);
    expect(g.player.damage).toBe(g.WEAPONS[0].damage);
  });
});

describe('the code', () => {
  it('round-trips, and writes the place, the seed and the weapon always', () => {
    const g = setup();
    const code = 'L2,G5,S4471,Harpoon2,puffer4,mini-boss1,Mask1,Dash_reach3,Nerve3,immortal,oneshot';
    expect(g.setupCode(g.parseSetup(code))).toBe(code);
    expect(g.setupCode(g.parseSetup('', 9))).toBe('L1,G1,S9,Gun0');
  });

  it('writes a grade only above the first, and holds it within the grades (D119)', () => {
    const g = setup();
    expect(g.setupCode(g.parseSetup('L1,G1,S9,Grade2,Gun0'))).toBe('L1,G1,S9,Grade2,Gun0');
    expect(g.setupCode(g.parseSetup('L1,G1,S9,Grade1,Gun0'))).toBe('L1,G1,S9,Gun0');
    expect(g.parseSetup('Grade99').grade).toBe(g.GRADES.length);
    expect(g.parseSetup('Grade0').grade).toBe(1);
  });

  it('brings its fish at its grade, later waves too, and names the grade (D119)', () => {
    const g = setup('L1,G3,S7,Grade3,Gun0,drifter20,immortal');
    expect(g.gateLine()).toContain('all at grade 3');
    // A drawn batch's own grades, which the plan chose (D126).
    expect(setup('L2,G1,S7').gateLine()).toMatch(/\d+ [\w-]+ (at grade [23]|\(\d+ grade [23])/);
    const t = g.enemyType('drifter'), G = g.GRADES[2];
    expect(g.MENUS.debug.items[row(g, 'drifter')].tip)
      .toContain('hp ' + t.hp * G.hp + ' \u00b7 speed ' + Math.round(t.speed * G.speed));
    g.debugDive();
    until(g, 30, () => !g.incoming.length && g.enemies.length > 0);
    expect(g.incoming).toEqual([]);
    expect(g.enemies.map(e => e.grade)).toEqual(Array(20).fill(3));
  });

  it('brings every fish of the dive at its grade, drawn or chosen, the boss\'s crowd too (D119)', () => {
    const g = setup('L1,G99,S7,Grade2,Gun0,immortal');
    g.debugDive();
    const entries = g.plan.flatMap(p => [...p.batch.enemies, ...(p.escorts ? p.escorts.enemies : [])]);
    expect(entries.every(([, , grade]) => grade === 2)).toBe(true);
    until(g, 30, () => g.enemies.some(e => e.escort));
    expect(g.enemies.some(e => e.name === 'boss') && g.enemies.some(e => e.escort)).toBe(true);
    expect(g.enemies.every(e => e.grade === 2)).toBe(true);
  });

  it('plays on identically from a save taken with graded fish still to come (D119)', () => {
    const a = setup('L1,G3,S7,Grade2,Gun0,drifter20,immortal');
    a.debugDive();
    until(a, 30, () => a.enemies.length > 0);
    expect(a.incoming.length).toBeGreaterThan(0);
    const b = loadGame();
    b.immortal = true;
    expect(b.loadSave(a.saveText())).toBe('');
    b.screen = b.resumeTo;
    for (const g of [a, b]) play(g, 8);
    expect(b.saveText()).toBe(a.saveText());
    expect(b.enemies.length && b.enemies.every(e => e.grade === 2)).toBe(true);
  });

  it('ignores what it cannot name, and holds every value in range', () => {
    const g = setup();
    const s = g.parseSetup('L9,G99,Gun7,Fins9,darter999,Lull3,nonsense', 5);
    expect(s.layer).toBe(g.LAYERS.length - 1);
    expect(s.gate).toBe(g.gatesIn(s.layer) - 1);
    expect(s.counts).toEqual({ Gun: 3, Fins: 9, darter: g.DEBUG_FISH_MAX });
    expect(s.ignored).toEqual(['Lull3', 'nonsense']);
    expect(s.seed).toBe(5);
  });

  it('every name a setup counts reads back as itself', () => {
    const g = loadGame();
    const names = g.DEBUG_COUNTS.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) {
      expect(n).not.toMatch(/\d$|,|_/);
      expect(['L', 'G', 'S', 'immortal', 'oneshot']).not.toContain(n);
    }
  });
});

describe('the keys and the ways out', () => {
  it('R plays the same setup again, the same way, from play and from the end screen', () => {
    const g = setup('L1,G2,S7,Gun0,darter3');
    g.debugDive();
    play(g, 3);
    const first = JSON.stringify({ p: g.player, e: g.enemies });
    press(g, 'KeyR');
    play(g, 3);
    expect(JSON.stringify({ p: g.player, e: g.enemies })).toBe(first);
    die(g);
    press(g, 'KeyR');
    expect(g.screen).toBe('playing');
  });

  it('R and Backspace do nothing outside the debug mode', () => {
    const g = loadGame();
    g.reset(7);
    play(g, 1);
    const at = g.elapsed;
    press(g, 'KeyR');
    press(g, 'Backspace');
    expect(g.screen).toBe('playing');
    expect(g.elapsed).toBeGreaterThan(at);
  });

  it('every way out of a debug dive leads back to the setup, never the title or home', () => {
    const g = setup('L1,G1,S7,Gun0');
    g.debugDive();
    press(g, 'Backspace');
    expect(g.screen).toBe('debug');
    g.debugDive();
    press(g, 'Escape');
    const quit = g.MENUS.paused.items.at(-1);
    expect(quit.label).toBe('Quit to setup');
    quit.run();
    expect(g.screen).toBe('debug');
    g.debugDive();
    press(g, 'Escape');
    g.MENUS.paused.items.find(i => i.label === 'Setup').run();
    g.MENUS.goHome.items[1].run();
    expect(g.screen).toBe('debug');
    g.debugDive();
    die(g);
    const [back, again] = g.MENUS.dead.items;
    expect([again.label, back.label]).toEqual(['Again', 'Setup']);
    again.run();
    expect(g.screen).toBe('playing');
    expect(g.currentSeed).toBe(7);
    die(g);
    back.run();
    expect(g.screen).toBe('debug');
    g.debugDive();
    die(g);
    press(g, 'Escape');
    expect(g.screen).toBe('debug');
  });
});

describe('the setup screen', () => {
  it('has a row for every fish, piece of equipment, attribute, mod and boost', () => {
    const g = setup();
    const labels = g.MENUS.debug.items.map(r => r.label);
    for (const t of [...g.ENEMY_TYPES, ...g.EQUIPMENT, ...g.ATTRIBUTES, ...g.MODS, ...g.BOOSTS]) expect(labels).toContain(t.name);
  });

  it('moves a value with the arrows, five at a time with Shift, and by a click either side of it', () => {
    const g = setup();
    const i = row(g, 'darter');
    g.menuIndex = i;
    press(g, 'ArrowRight');
    expect(g.debugSetup.counts.darter).toBe(1);
    g.keys.add('ShiftLeft');
    press(g, 'ArrowRight');
    g.keys.delete('ShiftLeft');
    expect(g.debugSetup.counts.darter).toBe(6);
    press(g, 'ArrowLeft');
    expect(g.debugSetup.counts.darter).toBe(5);
    const r = g.rectOf(g.MENUS.debug, i);
    const click = x => { g.aim.x = r.x + r.w * x; g.aim.y = r.y + r.h / 2; press(g, 'Mouse0'); };
    click(0.6);
    expect(g.debugSetup.counts.darter).toBe(4);
    click(0.9);
    expect(g.debugSetup.counts.darter).toBe(5);
    click(0.2);                                  // the label: chosen, not changed
    expect(g.debugSetup.counts.darter).toBe(5);
  });

  it('steps round at either end: below nothing is the most, past the most is nothing', () => {
    const g = setup();
    const at = label => g.MENUS.debug.items[row(g, label)];
    at('darter').change(-1);
    expect(g.debugSetup.counts.darter).toBe(g.DEBUG_FISH_MAX);
    at('darter').change(1);
    expect(g.debugSetup.counts.darter).toBe(0);
    g.debugSetup.counts.darter = g.DEBUG_FISH_MAX - 2;
    at('darter').change(5);                      // Shift's five stop at the end first
    expect(g.debugSetup.counts.darter).toBe(g.DEBUG_FISH_MAX);
    at('darter').change(5);
    expect(g.debugSetup.counts.darter).toBe(0);
    at('Layer').change(-1);
    expect(g.debugSetup.layer).toBe(g.LAYERS.length - 1);
    at('Gate').change(-1);
    expect(g.debugSetup.gate).toBe(g.gatesIn(g.debugSetup.layer) - 1);
    at('Gate').change(1);
    expect(g.debugSetup.gate).toBe(0);
    at('Tier').change(-1);
    expect(g.debugSetup.counts.Gun).toBe(g.WEAPONS[0].tiers.length);
    at('Fins').change(-1);
    expect(g.debugSetup.counts.Fins).toBe(g.DEBUG_MOD_MAX);
    at('Weapon').change(-1);
    expect(g.debugSetup.weapon).toBe(g.WEAPONS.at(-1).name);
  });

  it('says what every row is, and what each piece moves -- worked out from the game itself', () => {
    const g = setup();
    const tip = label => g.MENUS.debug.items[row(g, label)].tip;
    for (const item of g.MENUS.debug.items) expect(item.tip, item.label).toMatch(/\w/);
    expect(tip('Mask')).toMatch(/range \+30/);
    g.debugSetup.weapon = 'Knife';
    expect(tip('Mask')).toMatch(/arc \+10/);                 // a cut is not a shot (D181)
    g.debugSetup.weapon = g.WEAPONS[0].name;
    expect(tip('Heart')).toMatch(/max HP \+1/);
    expect(tip('Fins')).toMatch(/speed \+45/);
    expect(tip('darter')).toMatch(/hp 1\b/);
    expect(tip('puffer')).toMatch(/swells/);             // its behaviour, in words
    expect(tip('boss')).toContain(g.DEBUG_BEHAVIOURS.lunge);
    expect(tip('boss')).toContain(g.DEBUG_BEHAVIOURS.fan);
    // Every step a behaviour in words: a `threat` list is a number, not one (D126).
    for (const e of g.ENEMY_TYPES) {
      const steps = tip(e.name).split('   ')[0].slice(e.name.length + 2).split(/; (?:then )?/);
      expect([e.name, steps.every(Boolean)]).toEqual([e.name, true]);
    }
    expect(tip('Strength')).toMatch(/Harpoon/);          // what needs it
    expect(tip('Tier')).toMatch(/fire rate \+0\.5/);      // the carried weapon's tiers
  });

  it('has a line for every behaviour a fish can have', () => {
    const g = loadGame();
    const behaviours = new Set(g.ENEMY_TYPES.flatMap(e => Object.keys(e).filter(k => typeof e[k] === 'object' && !Array.isArray(e[k]))));
    for (const b of behaviours) expect(g.DEBUG_BEHAVIOURS[b], b).toMatch(/\w/);
  });

  it('names what the chosen gate drew, or the fish set in its place', () => {
    const g = setup(`L1,G${MINI},S7,Gun0`);
    expect(g.MENUS.debug.lines[0]).toMatch(/mini-boss/);
    g.debugSetup.counts.eel = 2;
    expect(g.MENUS.debug.lines[0]).toMatch(/2 eel/);
  });

  it('Enter on Dive dives', () => {
    const g = setup();
    g.menuIndex = g.MENUS.debug.items.length - 1;
    press(g, 'Enter');
    expect(g.screen).toBe('playing');
  });
});

describe('a play-test\'s setup (D211)', () => {
  // The mouse resting on a fish row, as Igor's did, then A and a click on it.
  const nudge = g => {
    const r = g.MENUS.debug.items[row(g, 'puffer')], at = g.rowRect(row(g, 'puffer'), g.MENUS.debug.top);
    g.menuIndex = row(g, 'puffer');
    press(g, 'KeyA');
    [g.aim.x, g.aim.y] = [at.x + at.w - 4, at.y + at.h / 2];
    press(g, 'Mouse0');
    return r.value;
  };

  it('is the play-test\'s own: a key or a click on a row changes nothing, where a plain setup steps round', () => {
    const plain = loadReplay();
    plain.openDebug('L1,G1,S1,Gun0', 1);
    expect(nudge(plain)).not.toBe(0);
    const g = loadReplay();
    expect(g.sonarBegin({ debug: 'L1,G1,S1,Gun0' })).toBe('');
    expect(nudge(g)).toBe(0);
    expect(g.setupCode()).toBe('L1,G1,S1,Gun0');
  });
});

