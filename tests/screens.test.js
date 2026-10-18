// The screens and what they answer to -- menus, the cards' keys, options --
// and the picture's own motion: shake and sparks. Moved from the browser
// suite, which keeps only what Node cannot check (D39): the menu cursor's
// arrows are platform's (`moveCursor`), so they stay there.
import { describe, it, expect } from 'vitest';
import { loadGame } from './harness.js';

const fresh = () => {
  const g = loadGame();
  g.reset();
  return g;
};
// A key pressed for exactly one frame, the way a real press arrives.
const tap = (g, code) => { g.justPressed.add(code); g.update(1 / 60); };
const run = (g, n, dt = 1 / 60) => { for (let i = 0; i < n; i++) g.update(dt); };
const at = (g, r) => { g.aim.x = r.x + r.w / 2; g.aim.y = r.y + r.h / 2; };
// A fish on the diver that cannot die, so it hurts until it is taken away.
const leech = g => g.enemies.push({ x: g.player.x + 15, y: g.player.y, r: 9, speed: 0, hp: 999, maxHp: 999,
                                    value: 1, lastHitBy: 0, pushX: 0, pushY: 0, vx: 0, vy: 0, touch: true });

describe('menus', () => {
  it('opens the pause menu on Esc in play, and resumes on Esc again', () => {
    const g = fresh();
    tap(g, 'Escape');
    expect(g.screen).toBe('paused');
    tap(g, 'Escape');
    expect(g.screen).toBe('playing');
  });

  it('brings Help back to wherever it was opened from', () => {
    const g = fresh();
    for (const from of ['title', 'paused']) {
      g.screen = from; g.menuIndex = 1;
      tap(g, 'Enter');
      expect(g.screen).toBe('help');
      tap(g, 'Escape');
      expect(g.screen).toBe(from);
    }
    g.screen = 'help';
    g.returnTo = 'title';
    tap(g, 'Mouse0');                          // a click leaves it too
    expect(g.screen).toBe('title');
  });

  it('marks a row under a moving cursor and runs it on a click; a still cursor leaves the keys alone', () => {
    const g = fresh();
    g.screen = 'title';
    g.menuIndex = 0;
    at(g, g.rowRect(2, g.MENU_TOP));           // the title's third row: Options
    g.update(0.016);
    expect(g.menuIndex).toBe(2);
    tap(g, 'Mouse0');
    expect(g.screen).toBe('options');
    g.screen = 'title';
    g.menuIndex = 0;
    g.update(0.016);                           // the cursor has not moved since
    expect(g.menuIndex).toBe(0);
  });

  it('changes each option by the arrows, Enter, or a click on its row', () => {
    const g = fresh();
    const volume = g.volume;
    g.screen = 'options'; g.optionIndex = 0; g.volume = 0.6;
    tap(g, 'ArrowLeft');
    expect(g.volume).toBeCloseTo(0.5, 9);
    tap(g, 'ArrowRight'); tap(g, 'ArrowRight');
    expect(g.volume).toBeCloseTo(0.7, 9);
    g.volume = volume;
    g.screen = 'options'; g.optionIndex = 1; g.shakeLevel = 2;
    tap(g, 'ArrowLeft');
    expect(g.SHAKE_LEVELS[g.shakeLevel].name).toBe('low');
    g.screen = 'options'; g.optionIndex = 2; g.showFps = false;
    tap(g, 'Enter');
    expect(g.showFps).toBe(true);
    tap(g, 'Enter');
    expect(g.showFps).toBe(false);
    at(g, g.rowRect(g.OPTIONS.length - 1, g.OPTION_TOP));
    tap(g, 'Mouse0');
    expect(g.showFps).toBe(true);
  });
});

describe('the mod cards\' keys (D85)', () => {
  it('moves the mark with the arrows and with A and D, wrapping, and Enter takes the marked card', () => {
    // Stubs record which card was taken, so taking the wrong one fails.
    const g = fresh();
    let picked = -1;
    g.screen = 'mods';
    g.choices = [0, 1, 2].map(i => ({ name: 'c' + i, desc: '', max: 9, end: true, apply: () => { picked = i; } }));
    g.choiceIndex = 1;
    g.aim.x = 0; g.aim.y = 0;                  // parked off the cards
    tap(g, 'ArrowRight');
    expect(g.choiceIndex).toBe(2);
    tap(g, 'KeyD');
    expect(g.choiceIndex).toBe(0);
    tap(g, 'KeyA');
    expect(g.choiceIndex).toBe(2);
    // Card 2: neither the one it opened on nor the first, so an Enter that
    // ignored the mark could not pass by accident.
    tap(g, 'Enter');
    expect([picked, g.screen]).toEqual([2, 'playing']);
  });
});

describe('shake', () => {
  it('shakes on a hit, eases out rather than cutting off, and settles to a still picture', () => {
    const g = fresh();
    leech(g);
    g.update(1 / 60);
    const peak = g.shake;
    expect(peak).toBeGreaterThan(0);
    run(g, 15);
    expect(g.shake > 0 && g.shake < peak * 0.5).toBe(true);
    g.enemies.length = 0;                      // or it hits again once invulnerability lapses
    run(g, 150);
    expect(g.shake).toBe(0);
  });

  it('settles on the death screen, and never follows you home', () => {
    const g = fresh();
    g.player.hp = 1;
    leech(g);
    g.update(1 / 60);
    expect(g.screen).toBe('dead');
    expect(g.shake).toBeGreaterThan(0);
    run(g, 150);
    expect(g.shake).toBe(0);
    const h = fresh();
    h.player.hp = 1;
    leech(h);
    h.update(1 / 60);
    tap(h, 'Escape');
    expect(h.screen).toBe('home');
    run(h, 150);
    expect(h.shake).toBe(0);
  });

  it('does not shake at all when set off', () => {
    const g = loadGame();
    g.shakeLevel = 0;
    g.reset();
    leech(g);
    g.update(1 / 60);
    expect(g.shake).toBe(0);
  });
});

describe('sparks', () => {
  it('make as many as asked, and clean themselves up', () => {
    const g = fresh();
    g.burst(100, 100, '#fff', '#fff', 8, 150, 0.2);
    expect(g.particles).toHaveLength(8);
    run(g, 30);                                // 0.5s, past their 0.2s life
    expect(g.particles).toHaveLength(0);
  });

  it('drag per second, not per frame: the same flight at 60 and at 144 frames a second', () => {
    const flight = (n, dt) => {
      const g = fresh();
      g.particles.push({ x: 0, y: 0, vx: 200, vy: 0, life: 9, maxLife: 9, r: 3, color: '#fff', glow: '#fff' });
      run(g, n, dt);
      return g.particles[0].x;
    };
    expect(Math.abs(flight(30, 1 / 60) - flight(72, 1 / 144))).toBeLessThan(1);
  });
});
