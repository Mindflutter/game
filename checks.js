// ===== checks =====
// Open index.html?test and read the console. These become the port's regression suite.

// ---------- checks: open index.html?test and look at the console ----------
if (location.search === '?test') {
  const mob = (x, y, over) => Object.assign(
    { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, xp: 1, lastHitBy: 0 }, over);

  for (let i = 0; i < 300; i++) spawnEnemy();
  console.assert(
    enemies.every(e => e.x < 0 || e.x > ARENA_W || e.y < 0 || e.y > ARENA_H),
    'enemies must spawn outside the arena');
  console.assert(
    new Set(enemies.map(e => e.speed)).size > 1,
    'enemies should not all move at the same speed');

  // Enemy types unlock as the run goes on.
  reset();
  elapsed = 0;
  console.assert(
    new Set(Array.from({ length: 50 }, () => pickEnemyType().name)).size === 1,
    'only drifters at the start of a run');
  elapsed = 60;
  const seen = new Set(Array.from({ length: 400 }, () => pickEnemyType().name));
  console.assert(seen.size === ENEMY_TYPES.length,
    'every type should appear later, saw: ' + [...seen].join(','));

  // Walking an enemy into a standing player must cost exactly one hp.
  reset();
  enemies.push(mob(player.x + 200, player.y, { speed: 100, hp: 999, maxHp: 999 }));
  for (let i = 0; i < 150; i++) update(0.016);   // 2.4s: touches once, not twice
  console.assert(player.hp === 2, 'one touch = one hp, got ' + player.hp);

  // The weapon ignores anything beyond its range, and targets the closest.
  reset();
  enemies.push(mob(player.x + player.range + 60, player.y));
  console.assert(nearestEnemy() === null, 'must not target beyond range');
  const close = mob(player.x + 40, player.y);
  enemies.push(close);
  console.assert(nearestEnemy() === close, 'must target the closest enemy in range');

  // A shot dies once it has flown its range, rather than crossing the arena.
  reset();
  bullets.push({ id: ++bulletId, x: 100, y: 400, r: 4, vx: BULLET_SPEED, vy: 0,
                 pierce: 0, travelled: 0, maxTravel: 200 });
  for (let i = 0; i < 40; i++) update(1 / 60);   // long enough to fly 280px
  console.assert(bullets.length === 0, 'shots must expire at the edge of their range');

  // A piercing shot passes through, but only damages each enemy once.
  reset();
  const tank = mob(player.x + 100, player.y, { hp: 3, maxHp: 3 });
  enemies.push(tank);
  player.fireTimer = 999;                        // silence the auto-weapon
  bullets.push({ id: ++bulletId, x: player.x, y: player.y, r: 4,
                 vx: BULLET_SPEED, vy: 0, pierce: 2, travelled: 0, maxTravel: 300 });
  for (let i = 0; i < 30; i++) update(1 / 60);
  console.assert(tank.hp === 2, 'a piercing shot must hit once, hp=' + tank.hp);

  // A tough enemy survives a hit that would kill a drifter.
  reset();
  const big = mob(player.x + 120, player.y, { hp: 6, maxHp: 6, xp: 3 });
  enemies.push(big);
  for (let i = 0; i < 45; i++) update(1 / 60);
  console.assert(big.hp < 6 && kills === 0, 'a bulwark must not die to one shot');

  // Shooting a drifter kills it and drops a gem.
  reset();
  enemies.push(mob(player.x + 150, player.y));
  for (let i = 0; i < 60; i++) update(0.016);    // ~1s
  console.assert(kills === 1, 'expected one kill, got ' + kills);
  console.assert(gems.length === 1, 'a kill must drop a gem');

  // A tougher enemy is worth more gems. Keep it outside pickupRange, or the
  // gems get vacuumed up the moment they drop and there is nothing to count.
  reset();
  enemies.push(mob(player.x + 150, player.y, { hp: 1, maxHp: 6, xp: 3 }));
  for (let i = 0; i < 60; i++) update(0.016);
  console.assert(gems.length === 3, 'xp 3 must drop 3 gems, got ' + gems.length);

  // An ignored gem fades out instead of littering the floor forever.
  reset();
  gems.push({ x: 40, y: 40, r: 4, life: 0.5 });
  for (let i = 0; i < 60; i++) update(1 / 60);
  console.assert(gems.length === 0, 'uncollected gems must expire');

  // Levelling costs more each time, rather than less.
  const costs = [];
  for (let lv = 1; lv <= 6; lv++) costs.push(Math.round(5 * Math.pow(XP_GROWTH, lv - 1)));
  console.assert(costs.every((c, i) => i === 0 || c > costs[i - 1]),
    'xp cost must rise every level: ' + costs.join(','));

  // Collecting the last gem you need levels you up and pauses the game.
  reset();
  xp = xpNext - 1;
  gems.push({ x: player.x, y: player.y, r: 4, life: GEM_LIFE });
  update(0.016);
  console.assert(level === 2 && screen === 'levelup', 'last gem must level you up and pause');
  console.assert(choices.length === 3, 'a level-up offers 3 choices');
  console.assert(new Set(choices).size === 3, 'the 3 choices must be different');

  // Pressing its number applies the upgrade and resumes play.
  const before = player.speed;
  choices = [UPGRADES.find(u => u.name === 'Fins')];
  justPressed.add('Digit1');
  update(0.016);
  console.assert(screen === 'playing' && player.speed > before,
    'picking must apply the upgrade and resume');

  // Sparks appear on a kill, then clean themselves up.
  reset();
  burst(100, 100, '#fff', '#fff', 8, 150, 0.2);
  console.assert(particles.length === 8, 'burst must make 8 sparks');
  for (let i = 0; i < 30; i++) update(1 / 60);   // 0.5s, well past their 0.2s life
  console.assert(particles.length === 0, 'sparks must expire, left ' + particles.length);

  // Spark drag must be per second, not per frame: half a second of flight
  // has to land in the same place at 60fps and at 144fps.
  reset();
  particles.push({ x: 0, y: 0, vx: 200, vy: 0, life: 9, maxLife: 9, r: 3, color: '#fff', glow: '#fff' });
  for (let i = 0; i < 30; i++) update(1 / 60);
  const at60 = particles[0].x;
  reset();
  particles.push({ x: 0, y: 0, vx: 200, vy: 0, life: 9, maxLife: 9, r: 3, color: '#fff', glow: '#fff' });
  for (let i = 0; i < 72; i++) update(1 / 144);
  const at144 = particles[0].x;
  console.assert(Math.abs(at60 - at144) < 1,
    'spark drag must not depend on frame rate: ' + at60.toFixed(2) + ' vs ' + at144.toFixed(2));

  // A hit that doesn't kill must still throw sparks, or damage looks like
  // nothing happened.
  reset();
  const tough = mob(player.x + 90, player.y, { hp: 9, maxHp: 9, xp: 1 });
  enemies.push(tough);
  for (let i = 0; i < 40; i++) update(1 / 60);
  console.assert(tough.hp < 9 && kills === 0, 'setup: it should be hurt but alive');
  console.assert(particles.length > 0, 'a non-lethal hit must throw sparks');

  // Getting hit shakes the screen, and the shake settles back to nothing.
  reset();
  // 15px apart: closer than the radii add up to (9 + 10), so they touch.
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  console.assert(shake > 0, 'a hit must shake the screen');

  // It must ease out, not stop dead: still moving a quarter second later, but
  // well under half of what it started at.
  const hitPeak = shake;
  for (let i = 0; i < 15; i++) update(1 / 60);
  console.assert(shake > 0 && shake < hitPeak * 0.5,
    'shake must ease out, not cut off: ' + hitPeak.toFixed(2) + ' -> ' + shake.toFixed(2));

  enemies.length = 0;            // or it hits again once invulnerability lapses
  for (let i = 0; i < 150; i++) update(1 / 60);
  console.assert(shake === 0, 'shake must reach a still picture, got ' + shake);

  // The fade must take the same time whatever the frame rate.
  reset(); shake = 10;
  for (let i = 0; i < 60; i++) update(1 / 60);
  const fade60 = shake;
  reset(); shake = 10;
  for (let i = 0; i < 144; i++) update(1 / 144);
  console.assert(Math.abs(fade60 - shake) < 0.01,
    'shake fade must not depend on frame rate: ' + fade60 + ' vs ' + shake);

  // Sound is a no-op before the player has pressed anything, not a crash.
  console.assert(audio === null, 'no audio context before a key press');
  sound('shoot');

  // Every binding must work on a non-Latin keyboard. These dispatch real
  // events with the character a Russian (or AZERTY) layout actually produces,
  // while the physical key stays the same.
  reset();
  keys.clear();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ц', code: 'KeyW' }));
  console.assert(keys.has('KeyW'), 'a Russian-layout W must register');
  const yBefore = player.y;
  update(0.1);
  console.assert(player.y < yBefore, 'a Russian-layout W must move the player up');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ц', code: 'KeyW' }));
  console.assert(!keys.has('KeyW'), 'releasing it must stop the player');

  reset();
  screen = 'dead';
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'к', code: 'KeyR' }));
  update(1 / 60);
  console.assert(screen === 'playing', 'a Russian-layout R must restart the game');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'к', code: 'KeyR' }));

  reset();
  screen = 'levelup';
  choices = [UPGRADES.find(u => u.name === 'Fins')];
  const speedBefore = player.speed;
  // '&' is what an unshifted 1 types on a French AZERTY keyboard.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1' }));
  update(1 / 60);
  console.assert(screen === 'playing' && player.speed > speedBefore,
    'an AZERTY-layout 1 must pick the first upgrade');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: '&', code: 'Digit1' }));
  keys.clear();

  // --- screens, menus and options ---
  // tap() presses a key for exactly one frame, the way a real press arrives.
  const tap = code => { justPressed.add(code); update(1 / 60); };

  reset();
  screen = 'title'; menuIndex = 0;
  console.assert(MENUS.title.items[0].label === 'Start', 'first title entry is Start');
  tap('Enter');
  console.assert(screen === 'playing', 'Start must begin a run, got ' + screen);

  tap('Escape');
  console.assert(screen === 'paused', 'Esc in play must open the menu, got ' + screen);
  tap('Escape');
  console.assert(screen === 'playing', 'Esc again must resume, got ' + screen);

  // Help must come back to wherever it was opened from, not always the title.
  screen = 'title'; menuIndex = 1;
  tap('Enter');
  console.assert(screen === 'help', 'title -> help, got ' + screen);
  tap('Escape');
  console.assert(screen === 'title', 'help must return to the title, got ' + screen);

  screen = 'paused'; menuIndex = 1;
  tap('Enter');
  console.assert(screen === 'help', 'pause -> help, got ' + screen);
  tap('Escape');
  console.assert(screen === 'paused', 'help must return to the pause menu, got ' + screen);

  // The cursor wraps at both ends.
  screen = 'title'; menuIndex = 0;
  tap('ArrowUp');
  console.assert(menuIndex === MENUS.title.items.length - 1, 'cursor wraps upward');
  tap('ArrowDown');
  console.assert(menuIndex === 0, 'cursor wraps back down');

  // Holding a key must not scroll the menu: a repeat is not a fresh press.
  screen = 'title'; menuIndex = 0;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', repeat: true }));
  update(1 / 60);
  console.assert(menuIndex === 0, 'key auto-repeat must not move the cursor');

  // Each option changes the thing it claims to.
  screen = 'options'; optionIndex = 0; volume = 0.6;
  tap('ArrowLeft');
  console.assert(Math.abs(volume - 0.5) < 1e-9, 'volume must go down, got ' + volume);
  tap('ArrowRight'); tap('ArrowRight');
  console.assert(Math.abs(volume - 0.7) < 1e-9, 'volume must go up, got ' + volume);
  volume = 0.6;

  screen = 'options'; optionIndex = 1; shakeLevel = 2;
  tap('ArrowLeft');
  console.assert(SHAKE_LEVELS[shakeLevel].name === 'low', 'shake must step down');

  screen = 'options'; optionIndex = 2; showFps = false;
  tap('Enter');
  console.assert(showFps === true, 'fps readout must toggle on');
  tap('Enter');
  console.assert(showFps === false, 'fps readout must toggle off');

  // Dying shakes the screen, and that shake must settle even though the game
  // has stopped updating. The check above never died, so it missed this.
  reset();
  player.hp = 1;
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  console.assert(screen === 'dead', 'setup: that should have killed the player');
  console.assert(shake > 0, 'dying must shake the screen');
  for (let i = 0; i < 150; i++) update(1 / 60);
  console.assert(shake === 0, 'shake must settle on the death screen, got ' + shake);

  // ...and it must not follow you out to the menus either.
  reset();
  player.hp = 1;
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  justPressed.add('Escape');
  update(1 / 60);
  console.assert(screen === 'title', 'setup: Esc should leave to the title');
  for (let i = 0; i < 150; i++) update(1 / 60);
  console.assert(shake === 0, 'the title must not inherit a shake, got ' + shake);

  // "off" has to actually mean off, not merely smaller.
  shakeLevel = 0;
  reset();
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  console.assert(shake === 0, 'shake "off" must not shake at all, got ' + shake);
  shakeLevel = 2;

  // Every sound must actually be loud enough to hear. Render each one offline
  // through the real voice() and measure its peak. This is the check that was
  // missing when every sound shipped 20-30dB too quiet to notice.
  (async () => {
    for (const [name, spec] of Object.entries(SOUNDS)) {
      const off = new OfflineAudioContext(1, 44100, Math.ceil(44100 * (spec.dur + 0.05)));
      voice(off, off.destination, spec, 0);
      const d = (await off.startRendering()).getChannelData(0);
      let peak = 0;
      for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
      console.assert(peak >= 0.15,
        'sound "' + name + '" is too quiet to hear: peak ' + peak.toFixed(3) +
        ' (' + (20 * Math.log10(peak)).toFixed(1) + ' dBFS)');
    }
    console.log('sound level checks done');
  })();

  reset();
  console.log('checks done');
}

requestAnimationFrame(frame);
