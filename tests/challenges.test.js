// Challenge ladders (D109, D110).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadGame, ticks, play, ride, clearAndWait, atGate } from './harness.js';

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
    at.meta.challenges.marksman = at.CHALLENGES.find(c => c.name === 'marksman').rungs.length;   // the Gun's own topped: flurry pays alone
    while (at.enemies.length < second) at.placeEnemy('drifter', at.player.x + 300, at.player.y);
    for (const e of [...at.enemies]) at.killEnemy(e);
    expect(at.meta.challenges.flurry).toBe(2);        // two rungs at once: a point each
    expect(at.notice).toBe('flurry: kill ' + second + ' fish within 2 seconds \u2014 2 points');
  });

  // A dive at its first batch carrying `weapon`, the batch's own fish out of the way.
  const armed = weapon => {
    const g = loadGame();
    g.meta.carried = weapon;
    g.reset(1);
    g.immortal = true;
    ride(g);
    for (const e of g.enemies) e.x += 3000;
    g.queuePaused = true;
    return g;
  };
  const line = (g, n, gap) => Array.from({ length: n }, (_, i) =>
    (g.placeEnemy('drifter', g.player.x + 60 + i * gap, g.player.y), Object.assign(g.enemies.at(-1), { hp: 1, maxHp: 1 })));
  const fire = (g, over = {}) => {
    const p = g.player;
    g.bullets.push(Object.assign({ id: ++g.bulletId, x: p.x, y: p.y, r: p.shotRadius, vx: p.shotSpeed, vy: 0,
                                   speed: p.shotSpeed, pierce: p.pierce, travelled: 0, maxTravel: p.range }, over));
    play(g, 1);
  };

  it('pays the Knife for the fish one cut kills, and no other weapon (D206)', () => {
    const g = armed('Knife');
    const n = rung(g, 'sweep', 2);
    const fish = Array.from({ length: n }, (_, i) =>
      (g.placeEnemy('drifter', g.player.x + g.player.r + 19, g.player.y + (i - (n - 1) / 2) * 6), g.enemies.at(-1)));
    for (const e of fish) Object.assign(e, { hp: 1, maxHp: 1, speed: 0 });
    g.player.splash = 0;
    g.player.pierce = n;
    g.aim.x = g.player.x + 400;
    g.aim.y = g.player.y - g.cameraY;
    g.fireArmed = true;
    g.keys.add('Mouse0');
    g.update(g.FIXED_DT);
    g.keys.delete('Mouse0');
    expect(fish.every(e => e.gone)).toBe(true);
    expect([g.meta.challenges.sweep, g.meta.challenges.skewer, g.meta.challenges.marksman]).toEqual([2, undefined, undefined]);
  });

  it('pays the Harpoon for the fish one harpoon kills, and not the Gun for the same shot (D206)', () => {
    const paid = weapon => {
      const g = armed(weapon);
      line(g, rung(g, 'skewer', 2), 40);
      fire(g, { pierce: 9, maxTravel: 400 });
      return g.meta.challenges.skewer;
    };
    expect([paid('Harpoon'), paid('Gun')]).toEqual([2, undefined]);
  });

  it('pays the Gun for kills in a row, and a shot that strikes nothing starts it again (D206)', () => {
    const g = armed('Gun');
    g.tally.marksman = rung(g, 'marksman', 1) - 1;
    line(g, 1, 0);
    fire(g);
    expect([g.tally.marksman, g.meta.challenges.marksman]).toEqual([rung(g, 'marksman', 1), 1]);
    fire(g, { vx: 0, vy: -g.player.shotSpeed });   // into the open water
    expect(g.tally.marksman).toBe(0);
  });

  it('shows each weapon\'s ladder on one line, and only the carried one\'s in the dive (D206)', () => {
    const g = armed('Harpoon');
    g.meta.challenges = { sweep: 1 };
    const own = g.challengeLines().filter(l => l.startsWith('weapons'));
    expect(own).toEqual(['weapons   Gun ○○○○   Harpoon ○○○○   Knife ●○○○   with the Harpoon: ' +
                         g.CHALLENGES.find(c => c.name === 'skewer').ask(rung(g, 'skewer', 1))]);
    const status = g.statusLines().find(l => l.text.startsWith('challenges')).text;
    expect([status.includes('skewer'), status.includes('sweep'), status.includes('marksman')]).toEqual([true, false, false]);
  });

  it('lets challenges paying on one tick share the notice', () => {
    const g = fighting(0);
    g.tally = { untouched: rung(g, 'untouched', 1) - 1, beeline: rung(g, 'beeline', 1) - 1 };
    clearAndWait(g, 0.1);                        // all at once: clean, and the glowing fish first
    expect(g.notice).toBe('depth, untouched, beeline \u2014 3 points');   // and the first gate (D161)
  });

  it('tops each streak within what one dive holds (D158, D161)', () => {
    const g = loadGame();
    g.reset(1);
    const top = name => g.CHALLENGES.find(c => c.name === name).rungs.at(-1);
    expect(top('untouched')).toBeLessThanOrEqual(g.plan.length);
    expect(top('beeline')).toBeLessThanOrEqual(g.plan.filter(e => !e.escorts).length);
  });

  it('times a layer from its first batch to its boss, and pays every rung it beats', () => {
    const g = diving(1);
    const boss = g.plan.findIndex(e => e.end);
    ride(g);
    expect(g.layerStart).toBe(g.elapsed);
    for (let i = 0; i < boss; i++) { clearAndWait(g, 0.1); ride(g); }
    g.layerStart = g.elapsed - 115;              // 1:55 in
    expect(clearAndWait(g, 1)).toBe('mods');     // the boss down, the layer end's cards
    expect([g.meta.challenges.swift, g.layerStart]).toEqual([2, null]);   // within 2:15 and 2:00, not 1:50
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
    g.meta.challenges = { untouched: 4, beeline: 1 };
    const lines = g.challengeLines();
    expect(lines).toHaveLength(g.CHALLENGES.filter(c => !c.weapon).length + 2);
    expect(lines).toContain('untouched   ●●●●   every rung earned');
    expect(lines).toContain('beeline   ●○○○   kill the glowing fish first, ' + rung(g, 'beeline', 2) + ' batches in a row');
    expect(lines).toContain('bowling   ○○○○   dash through ' + rung(g, 'bowling', 1) + ' fish at once');
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

describe('depth pays points (D161)', () => {
  const diving = s => { const g = loadGame(); g.reset(s); g.immortal = true; return g; };
  const depth = g => g.meta.challenges.depth || 0;

  it('pays a point for each gate a dive first clears deeper than any before, once ever', () => {
    const g = diving(1);
    ride(g);
    clearAndWait(g, 0.1);
    expect(depth(g)).toBe(1);
    expect(g.notice).toContain('depth');
    g.reset(2);
    g.immortal = true;
    ride(g);
    clearAndWait(g, 0.1);                        // the same gate again pays nothing
    expect(depth(g)).toBe(1);
  });

  it('has a rung at every gate, and needs the challenges too to buy every step', () => {
    const g = diving(1);
    const all = g.ATTRIBUTES.reduce((a, x) => a + x.max * (x.max + 1) / 2, 0);
    const rungs = g.CHALLENGES.map(c => c.rungs.length);
    expect(g.CHALLENGES.find(c => c.name === 'depth').rungs).toEqual(g.plan.map((_, k) => k + 1));
    expect(all).toBeGreaterThan(rungs[0]);
    expect(all).toBeLessThanOrEqual(rungs.reduce((a, n) => a + n, 0));
  });
});
