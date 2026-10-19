// Challenge ladders (D109, D110). Designed in
// docs/specs/2026-10-15-micro-task-ladders-design.md.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, ride, clearAndWait, atGate } from './harness.js';

describe('challenge ladders (D109, D110)', () => {
  const mini = g => g.plan.findIndex(e => e.batch.enemies.some(([n]) => n === 'mini-boss'));
  // The first batch of gate `k` arrived, the diver kept alive.
  const fighting = k => { const g = atGate(k); g.immortal = true; ride(g); return g; };
  // A dive from the top, the diver kept alive.
  const diving = s => { const g = loadGame(); g.reset(s); g.immortal = true; return g; };
  const cleanBatches = (g, n) => { for (let i = 0; i < n; i++) { ride(g); clearAndWait(g, 0.1); } };

  it('counts clean batches in a row, pays each rung once, ever, and starts again after a hit -- the guard\'s too', () => {
    const g = diving(1);
    cleanBatches(g, 3);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([3, 2]);   // rungs 1 and 3
    ride(g);
    g.immortal = false;
    g.player.guard = 1;
    g.guardLeft = 1;
    g.hurtPlayer(1);                             // the suit takes it: still a hit
    expect(g.player.hp).toBe(g.player.maxHp);
    g.immortal = true;
    clearAndWait(g, 0.1);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([0, 2]);
    g.reset(2);                                  // the next dive: the streak is new, the rungs kept
    cleanBatches(g, 1);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([1, 2]);
    expect(g.notice).not.toContain('untouched');
  });

  it('counts batches cleared without a dash, and starts again after one', () => {
    const g = diving(1);
    cleanBatches(g, 3);
    expect(g.meta.challenges.footwork).toBe(1);       // rung 1: three in a row
    ride(g);
    g.keys.add('KeyD');
    g.justPressed.add('Space');
    g.update(g.FIXED_DT);
    expect(g.batchDashed).toBe(true);
    g.keys.clear();
    clearAndWait(g, 0.1);
    expect([g.tally.footwork, g.meta.challenges.footwork]).toEqual([0, 1]);
  });

  it('counts a glowing fish killed first -- or on the same tick as the first -- and starts again after another first', () => {
    const same = fighting(0);
    same.killEnemy(same.enemies.find(e => !e.carrier));
    same.killEnemy(same.enemies.find(e => e.carrier));   // the same tick: together
    clearAndWait(same, 0.1);
    expect([same.tally.beeline, same.meta.challenges.beeline]).toEqual([1, 1]);
    const late = fighting(0);
    late.tally.beeline = 2;
    late.killEnemy(late.enemies.find(e => !e.carrier));
    late.update(late.FIXED_DT);                  // a tick later: too late
    clearAndWait(late, 0.1);
    expect([late.tally.beeline, late.meta.challenges.beeline]).toEqual([0, undefined]);
  });

  it('skips a batch with no glowing fish, neither counting nor breaking the streak', () => {
    const g = fighting(mini(atGate(0)));
    expect(g.enemies.some(e => e.carrier)).toBe(false);
    g.tally.beeline = 2;
    clearAndWait(g, 0.1);
    expect(g.tally.beeline).toBe(2);
  });

  it('counts kills within two seconds, the older dropping out, and pays several rungs at once', () => {
    const g = fighting(0);
    while (g.enemies.length < 14) g.placeEnemy('drifter', g.player.x + 300, g.player.y);
    const kill = n => { for (const e of g.enemies.filter(x => !x.gone).slice(0, n)) g.killEnemy(e); };
    kill(5);
    for (let i = 0, n = ticks(g, 2.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.statusLines().map(l => l.text).join()).toContain('flurry 0/6');   // the bar forgets too
    kill(5);                                     // five in the window, the first five gone from it
    expect([g.meta.challenges.flurry, g.killTimes.length]).toEqual([undefined, 5]);   // and the save
    kill(1);
    expect(g.meta.challenges.flurry).toBe(1);         // six within two seconds
    const at = fighting(0);
    while (at.enemies.length < 12) at.placeEnemy('drifter', at.player.x + 300, at.player.y);
    for (const e of [...at.enemies]) at.killEnemy(e);
    expect(at.meta.challenges.flurry).toBe(2);        // 6 and 12 at once: 1 + 2 points
    expect(at.notice).toBe('flurry: kill 12 fish within 2 seconds \u2014 3 points');
  });

  it('lets challenges paying on one tick share the notice', () => {
    const g = fighting(0);
    clearAndWait(g, 0.1);                        // all at once: clean, and the glowing fish first
    expect(g.notice).toBe('untouched, beeline \u2014 2 points');
  });

  it('times a layer from its first batch to its boss, and pays every rung it beats', () => {
    const g = diving(1);
    const boss = g.plan.findIndex(e => e.end);
    ride(g);
    expect(g.layerStart).toBe(g.elapsed);
    for (let i = 0; i < boss; i++) { clearAndWait(g, 0.1); ride(g); }
    g.layerStart = g.elapsed - 330;              // five and a half minutes in
    expect(clearAndWait(g, 1)).toBe('mods');     // the boss down, the layer end's cards
    expect([g.meta.challenges.swift, g.layerStart]).toEqual([2, null]);   // within 8 and 6, not 5
  });

  it('never times a layer the dive began partway into', () => {
    const g = loadGame();
    expect(g.applyScenario('mini-boss', 1)).toBe(true);
    g.immortal = true;
    for (let i = 0; i < 20 && g.screen === 'playing'; i++) { ride(g); clearAndWait(g, 0.1); }
    expect(g.screen).toBe('mods');
    expect(g.meta.challenges.swift).toBe(undefined);
  });

  it('keeps the batch\'s dash and every count with a saved dive', () => {
    const a = fighting(0);
    Object.assign(a, { batchDashed: true, tally: { untouched: 4, beeline: 1 }, killTimes: [a.elapsed],
                       firstKillAt: a.elapsed, glowAt: null, layerStart: 1.5 });
    const b = loadGame();
    expect(b.loadSave(a.saveText())).toBe('');
    expect([b.batchDashed, b.tally, b.killTimes, b.firstKillAt, b.glowAt, b.layerStart])
      .toEqual([true, { untouched: 4, beeline: 1 }, [a.elapsed], a.elapsed, null, 1.5]);
  });

  it('calls them challenges on every screen, line and notice the player reads (D110)', () => {
    const g = loadGame();
    g.reset(1);
    g.climb(g.CHALLENGES[0], 99);                // a notice, every rung at once
    const menus = ['title', 'home', 'attributes', 'paused', 'newGame'].map(m => g.MENUS[m]);
    const read = [g.notice, ...g.challengeLines(), ...g.statusLines().map(l => l.text), ...g.HELP_BLURB,
                  ...menus.flatMap(m => [m.heading, m.sub, ...m.items.map(i => i.label)])];
    expect(read.filter(line => /\btasks?\b|micro-?tasks?/i.test(line))).toEqual([]);
    expect(read.join('\n')).toContain('Challenges pay the points');
  });

  it('lists every challenge on the Attributes and pause screens: its badges, then its next rung', () => {
    const g = loadGame();
    g.meta.challenges = { untouched: 4, beeline: 1 };
    const lines = g.challengeLines();
    expect(lines).toHaveLength(g.CHALLENGES.length + 1);
    expect(lines).toContain('untouched   ●●●●   every rung earned');
    expect(lines).toContain('beeline   ●○○○   kill the glowing fish first, 3 batches in a row  —  2 points');
    expect(lines).toContain('footwork   ○○○○   clear 3 batches in a row without dashing  —  1 point');
    expect([g.MENUS.attributes.challenges, g.MENUS.paused.challenges]).toEqual([true, true]);
  });

  it('turns a v6 save\'s tasks into rungs and its steps back into points, keeping what it carries', () => {
    const v6 = JSON.parse(readFileSync(new URL('./fixtures/save-v6.json', import.meta.url), 'utf8'));
    Object.assign(v6, { tasks: { 0: { untouched: 1, swift: 1 }, 1: { untouched: 1, footwork: 1 } },
                        spent: { Heart: 3, Strength: 1 }, owned: ['Gun', 'Harpoon'], carried: 'Harpoon' });
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v6))).toBe('');
    expect(g.meta.challenges).toEqual({ untouched: 2, swift: 1, footwork: 1 });
    expect([g.meta.raised, g.points()]).toEqual([{}, 5]);   // it had earned 4
    expect([g.meta.owned, g.meta.carried]).toEqual([['Gun', 'Harpoon'], 'Harpoon']);
    g.reset(1);
    expect(g.weaponName).toBe('Harpoon');
  });
});
