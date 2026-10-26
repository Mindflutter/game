// Challenge ladders (D109, D110).
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
  const rung = (g, name, k) => g.CHALLENGES.find(c => c.name === name).rungs[k - 1];

  it('counts clean batches in a row, pays each rung once, ever, and starts again after a hit -- the guard\'s too', () => {
    const g = diving(1);
    g.tally.untouched = rung(g, 'untouched', 2) - 2;
    cleanBatches(g, 2);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([rung(g, 'untouched', 2), 2]);   // two at once
    ride(g);
    g.immortal = false;
    g.player.guard = 1;
    g.guardLeft = 1;
    g.hurtPlayer({ damage: 1, knock: 0 }, 0, 0); // the suit takes it: still a hit
    expect(g.player.hp).toBe(g.player.maxHp);
    g.immortal = true;
    clearAndWait(g, 0.1);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([0, 2]);
    g.reset(2);                                  // the next dive: the streak is new, the rungs kept
    cleanBatches(g, 1);
    expect([g.tally.untouched, g.meta.challenges.untouched]).toEqual([1, 2]);
    expect(g.notice).not.toContain('untouched');
  });

  it('counts the fish one dash shoves, each once, and starts again with the next dash', () => {
    const g = fighting(0);
    const n = rung(g, 'bowling', 1);
    for (let i = 0; i < n; i++) g.placeEnemy('drifter', g.player.x + 30 + i * 12, g.player.y);
    const dash = () => {
      g.player.facing = 0;
      g.player.dashCd = 0;
      g.justPressed.add('Space');
      for (let i = 0, t = ticks(g, g.DASH_TIME); i < t; i++) g.update(g.FIXED_DT);
    };
    dash();
    expect(g.player.dashHits).toBeGreaterThanOrEqual(n);
    expect(g.meta.challenges.bowling).toBe(1);
    for (const e of g.enemies) e.x += 2000;      // nothing in reach of the next
    dash();
    expect([g.player.dashHits, g.meta.challenges.bowling]).toEqual([0, 1]);
  });

  it('counts a glowing fish killed first -- or on the same tick as the first -- and starts again after another first', () => {
    const same = fighting(0);
    same.tally.beeline = rung(same, 'beeline', 1) - 1;
    same.killEnemy(same.enemies.find(e => !e.carrier));
    same.killEnemy(same.enemies.find(e => e.carrier));   // the same tick: together
    clearAndWait(same, 0.1);
    expect([same.tally.beeline, same.meta.challenges.beeline]).toEqual([rung(same, 'beeline', 1), 1]);
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
    const first = rung(g, 'flurry', 1), second = rung(g, 'flurry', 2);
    while (g.enemies.length < 2 * first) g.placeEnemy('drifter', g.player.x + 300, g.player.y);
    const kill = n => { for (const e of g.enemies.filter(x => !x.gone).slice(0, n)) g.killEnemy(e); };
    kill(first - 1);
    for (let i = 0, n = ticks(g, 2.1); i < n; i++) g.update(g.FIXED_DT);
    expect(g.statusLines().map(l => l.text).join()).toContain('flurry 0/' + first);   // the bar forgets too
    kill(first - 1);                             // the first ones gone from the window
    expect([g.meta.challenges.flurry, g.killTimes.length]).toEqual([undefined, first - 1]);   // and the save
    kill(1);
    expect(g.meta.challenges.flurry).toBe(1);
    const at = fighting(0);
    while (at.enemies.length < second) at.placeEnemy('drifter', at.player.x + 300, at.player.y);
    for (const e of [...at.enemies]) at.killEnemy(e);
    expect(at.meta.challenges.flurry).toBe(2);        // two rungs at once: a point each
    expect(at.notice).toBe('flurry: kill ' + second + ' fish within 2 seconds \u2014 2 points');
  });

  it('lets challenges paying on one tick share the notice', () => {
    const g = fighting(0);
    g.tally = { untouched: rung(g, 'untouched', 1) - 1, beeline: rung(g, 'beeline', 1) - 1 };
    clearAndWait(g, 0.1);                        // all at once: clean, and the glowing fish first
    expect(g.notice).toBe('untouched, beeline \u2014 2 points');
  });

  it('times a layer from its first batch to its boss, and pays every rung it beats', () => {
    const g = diving(1);
    const boss = g.plan.findIndex(e => e.end);
    ride(g);
    expect(g.layerStart).toBe(g.elapsed);
    for (let i = 0; i < boss; i++) { clearAndWait(g, 0.1); ride(g); }
    g.layerStart = g.elapsed - 190;              // 3:10 in
    expect(clearAndWait(g, 1)).toBe('mods');     // the boss down, the layer end's cards
    expect([g.meta.challenges.swift, g.layerStart]).toEqual([2, null]);   // within 3:45 and 3:20, not 3:00
  });

  it('never times a layer the dive began partway into', () => {
    const g = loadGame();
    expect(g.applyScenario('mini-boss', 1)).toBe(true);
    g.immortal = true;
    for (let i = 0; i < 20 && g.screen === 'playing'; i++) { ride(g); clearAndWait(g, 0.1); }
    expect(g.screen).toBe('mods');
    expect(g.meta.challenges.swift).toBe(undefined);
  });

  it('keeps every count with a saved dive', () => {
    const a = fighting(0);
    a.player.dashHits = 3;
    Object.assign(a, { tally: { untouched: 4, beeline: 1 }, killTimes: [a.elapsed],
                       firstKillAt: a.elapsed, glowAt: null, layerStart: 1.5 });
    const b = loadGame();
    expect(b.loadSave(a.saveText())).toBe('');
    expect([b.player.dashHits, b.tally, b.killTimes, b.firstKillAt, b.glowAt, b.layerStart])
      .toEqual([3, { untouched: 4, beeline: 1 }, [a.elapsed], a.elapsed, null, 1.5]);
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
    g.meta.challenges = { untouched: 9, beeline: 1 };
    const lines = g.challengeLines();
    expect(lines).toHaveLength(g.CHALLENGES.length + 1);
    expect(lines).toContain('untouched   ●●●●●●●●●   every rung earned');
    expect(lines).toContain('beeline   ●○○○○○○○○   kill the glowing fish first, ' + rung(g, 'beeline', 2) + ' batches in a row');
    expect(lines).toContain('bowling   ○○○○○○○○○   dash through ' + rung(g, 'bowling', 1) + ' fish at once');
    expect([g.MENUS.attributes.challenges, g.MENUS.paused.challenges]).toEqual([true, true]);
  });

  it('turns a v6 save\'s tasks into rungs and its steps back into points, keeping what it carries', () => {
    const v6 = JSON.parse(readFileSync(new URL('./fixtures/save-v6.json', import.meta.url), 'utf8'));
    Object.assign(v6, { tasks: { 0: { untouched: 1, swift: 1 }, 1: { untouched: 1, footwork: 1 } },
                        spent: { Heart: 3, Strength: 1 }, owned: ['Gun', 'Harpoon'], carried: 'Harpoon' });
    const g = loadGame();
    expect(g.loadSave(JSON.stringify(v6))).toBe('');
    // Its rungs come to v7 as { untouched: 2, swift: 1, footwork: 1 }; none of
    // them meets a rung of the nine-rung ladders (D152).
    expect(g.meta.challenges).toEqual({});
    expect([g.meta.raised, g.points()]).toEqual([{}, 0]);
    expect([g.meta.owned, g.meta.carried]).toEqual([['Gun', 'Harpoon'], 'Harpoon']);
    g.reset(1);
    expect(g.weaponName).toBe('Harpoon');
  });
});
