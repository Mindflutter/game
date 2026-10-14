// The debug mode (D102 (the debug mode)): `?debug` opens a setup screen in
// place of the title -- where, which fish, the diver's kit -- and plays it with
// sound, never reading or writing the save. Each failure case it could meet is
// pinned here: the save, the kit, the place, the fish, the code, the keys and
// every way out.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame, ticks } from './harness.js';

// A game in the debug mode, on its setup screen.
function setup(code = '', seed = 7) {
  const g = loadGame();
  g.openDebug(code, seed);
  expect(g.screen).toBe('debug');
  return g;
}
const play = (g, seconds) => { for (let i = 0, n = ticks(g, seconds); i < n; i++) g.update(g.FIXED_DT); };
const press = (g, code) => { g.justPressed.add(code); g.update(g.FIXED_DT); };
const row = (g, label) => g.MENUS.debug.items.findIndex(r => r.label === label);
const counted = g => Object.fromEntries(g.enemies.reduce((m, e) => m.set(e.name, (m.get(e.name) || 0) + 1), new Map()));

// Kills the player where they stand, as meta.test.js does.
function die(g) {
  g.player.hp = 1;
  g.player.hurt = 0;
  g.placeEnemy('eel', g.player.x, g.player.y);
  g.update(g.FIXED_DT);
  expect(g.screen).toBe('dead');
}

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
    const g = setup('L1,G1,S7,Harpoon2,Mask1,Suit2,Heart2,Strength1,Fins2,Barbs3');
    g.debugDive();
    const h = loadGame();
    h.meta = { ...h.freshMeta(), carried: 'Harpoon', owned: ['Gun', 'Harpoon', 'Knife'],
               gear: { Harpoon: 2, Mask: 1, Suit: 2 }, spent: { Heart: 2, Strength: 1 } };
    h.reset(7);
    for (const n of ['Fins', 'Fins', 'Barbs', 'Barbs', 'Barbs']) h.takeMod(h.MODS.find(m => m.name === n));
    expect(g.weaponName).toBe('Harpoon');
    expect(g.player).toEqual(h.player);
    expect(g.modCounts).toEqual({ Fins: 2, Barbs: 3 });
  });

  it('the place: the chosen layer and gate, the camera at its depth', () => {
    const g = setup('L2,G7,S7,Gun0');
    g.debugDive();
    const b = g.plan.findIndex(e => e.layer === 1) + 6;
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

  it('no fish set: the gate brings what it drew', () => {
    const g = setup('L1,G3,S7,Gun0');
    g.debugDive();
    const drawn = loadGame();
    drawn.reset(7);
    expect(g.plan).toEqual(drawn.plan);
  });

  it('a weapon mod that does not fit the weapon carried is not taken, and its row says so', () => {
    const g = setup('L1,G1,S7,Gun0,Barbs3');
    expect(g.MENUS.debug.items[row(g, 'Barbs')].dim).toBe(true);
    g.debugDive();
    expect(g.modCounts.Barbs).toBeUndefined();
    expect(g.player.pierce).toBe(g.WEAPONS[0].pierce);
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
    const code = 'L2,G7,S4471,Harpoon2,puffer4,mini-boss1,Mask1,Dash_reach3,Barbs3,immortal,oneshot';
    expect(g.setupCode(g.parseSetup(code))).toBe(code);
    expect(g.setupCode(g.parseSetup('', 9))).toBe('L1,G1,S9,Gun0');
  });

  it('ignores what it cannot name, and holds every value in range', () => {
    const g = setup();
    const s = g.parseSetup('L9,G99,Gun7,Fins9,darter999,Lull3,nonsense', 5);
    expect(s.layer).toBe(g.LAYERS.length - 1);
    expect(s.gate).toBe(g.gatesIn(s.layer) - 1);
    expect(s.counts).toEqual({ Gun: 3, Fins: 3, darter: g.DEBUG_FISH_MAX });
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
    die(g);
    const [again, back] = g.MENUS.dead.items;
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
  it('has a row for every fish, piece of equipment, attribute and mod', () => {
    const g = setup();
    const labels = g.MENUS.debug.items.map(r => r.label);
    for (const t of [...g.ENEMY_TYPES, ...g.EQUIPMENT, ...g.ATTRIBUTES, ...g.MODS]) expect(labels).toContain(t.name);
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
    expect(g.debugSetup.counts.Fins).toBe(g.MODS.find(m => m.name === 'Fins').max);
    at('Weapon').change(-1);
    expect(g.debugSetup.weapon).toBe(g.WEAPONS.at(-1).name);
  });

  it('says what every row is, and what each piece moves -- worked out from the game itself', () => {
    const g = setup();
    const tip = label => g.MENUS.debug.items[row(g, label)].tip;
    for (const item of g.MENUS.debug.items) expect(item.tip, item.label).toMatch(/\w/);
    expect(tip('Mask')).toMatch(/range \+30/);
    expect(tip('Heart')).toMatch(/maxHp \+1/);
    expect(tip('Fins')).toMatch(/speed \+45/);
    expect(tip('darter')).toMatch(/hp 1\b/);
    expect(tip('puffer')).toMatch(/swells/);             // its behaviour, in words
    expect(tip('Strength')).toMatch(/Harpoon/);          // what needs it
    expect(tip('Tier')).toMatch(/fireRate \+0\.5/);      // the carried weapon's tiers
  });

  it("says why a weapon mod is dim: it goes only with another weapon", () => {
    const g = setup('L1,G1,S7,Gun0');
    const barbs = () => g.MENUS.debug.items[row(g, 'Barbs')].tip;
    expect(barbs()).toMatch(/carry the Harpoon/);
    g.debugSetup.weapon = 'Harpoon';
    expect(barbs()).not.toMatch(/carry the Harpoon/);
  });

  it('has a line for every behaviour a fish can have', () => {
    const g = loadGame();
    const behaviours = new Set(g.ENEMY_TYPES.flatMap(e => Object.keys(e).filter(k => typeof e[k] === 'object')));
    for (const b of behaviours) expect(g.DEBUG_BEHAVIOURS[b], b).toMatch(/\w/);
  });

  it('names what the chosen gate drew, or the fish set in its place', () => {
    const g = setup('L1,G5,S7,Gun0');
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
