// ===== checks =====
// Open index.html?test and read the console. These become the port's regression suite.

// ---------- checks: open index.html?test and look at the console ----------
if (location.search === '?test') {
  const mob = (x, y, over) => Object.assign(
    { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, xp: 1, lastHitBy: 0,
      pushX: 0, pushY: 0 }, over);

  // The weapon fires along the cursor now, so every check that expects a shot
  // to land has to say where the cursor is. Inheriting whatever the previous
  // check left behind is how a few of these used to pass by luck.
  const aimAt = e => { aim.x = e.x; aim.y = e.y; };

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

  // The weapon still ignores anything beyond its range -- it just no longer
  // picks the target (D20).
  reset();
  enemies.push(mob(player.x + player.range + 60, player.y));
  console.assert(!enemyInRange(), 'must not fire at anything beyond range');
  enemies.push(mob(player.x + 40, player.y));
  console.assert(enemyInRange(), 'must fire once something is inside the ring');

  // Shots go where the mouse points, NOT at the nearest enemy. The enemy is
  // planted to the left and the cursor put to the right, so the old
  // nearest-enemy weapon fails this with vx < 0.
  reset();
  enemies.push(mob(player.x - 60, player.y));
  aim.x = player.x + 500;
  aim.y = player.y;
  player.fireTimer = 0;
  update(1 / 60);
  console.assert(bullets.length === 1 && bullets[0].vx > 0,
    'a shot must fly toward the cursor, vx=' + (bullets[0] && bullets[0].vx));

  // A dash passes through an enemy, hurts it exactly once, and costs no hp.
  reset();
  const dashed = mob(player.x + 60, player.y, { hp: 5, maxHp: 5 });
  enemies.push(dashed);
  player.fireTimer = 999;                        // silence the weapon
  keys.add('KeyD');
  justPressed.add('Space');
  for (let i = 0; i < 20; i++) update(1 / 60);   // longer than DASH_TIME
  console.assert(dashed.hp === 4,
    'a dash must hit each enemy exactly once, hp=' + dashed.hp);
  console.assert(player.hp === 3,
    'a dash must pass through unharmed, hp=' + player.hp);

  // The wave reaches past the player's body. This one sits 30px beyond the far
  // end of the dash -- never touched, but well inside the wave.
  reset();
  player.fireTimer = 999;
  const ahead = mob(player.x + 171, player.y, { hp: 5, maxHp: 5 });
  enemies.push(ahead);
  const aheadX = ahead.x;
  keys.add('KeyD');
  justPressed.add('Space');
  for (let i = 0; i < 20; i++) update(1 / 60);
  console.assert(ahead.hp === 4, 'the wave must reach past the body, hp=' + ahead.hp);
  console.assert(ahead.x > aheadX + 10,
    'the wave must shove what it hits, moved ' + (ahead.x - aheadX).toFixed(1));
  keys.delete('KeyD');

  // ...but only forwards. This one is the same 30px away, behind the dash, so
  // a wave that ignored direction would catch it.
  reset();
  player.fireTimer = 999;
  const behind = mob(player.x - 30, player.y, { hp: 5, maxHp: 5 });
  enemies.push(behind);
  keys.add('KeyD');
  justPressed.add('Space');
  for (let i = 0; i < 20; i++) update(1 / 60);
  console.assert(behind.hp === 5, 'the wave must not hit backwards, hp=' + behind.hp);
  keys.delete('KeyD');

  // The dash closes with a ring, rather than just stopping.
  console.assert(player.dashEnd > 0, 'a finished dash must leave its closing ring');

  // A dash leaves an afterimage trail, so it reads as travel, not a teleport.
  // Only the trail is stationary -- every burst spark is thrown outwards, so
  // this can't pass on the sparks from the enemy it just hit.
  console.assert(particles.some(p => p.vx === 0 && p.vy === 0),
    'a dash must leave an afterimage trail');

  // ...and it cannot be spent again until the cooldown has run.
  justPressed.add('Space');
  update(1 / 60);
  console.assert(player.dashTime <= 0, 'no second dash inside the cooldown');
  keys.delete('KeyD');

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
  aimAt(big);
  for (let i = 0; i < 45; i++) update(1 / 60);
  console.assert(big.hp < 6 && kills === 0, 'a bulwark must not die to one shot');

  // Shooting a drifter kills it and drops a gem.
  reset();
  const drifter = mob(player.x + 150, player.y);
  enemies.push(drifter);
  aimAt(drifter);
  for (let i = 0; i < 60; i++) update(0.016);    // ~1s
  console.assert(kills === 1, 'expected one kill, got ' + kills);
  console.assert(gems.length === 1, 'a kill must drop a gem');

  // A tougher enemy is worth more gems. Keep it outside pickupRange, or the
  // gems get vacuumed up the moment they drop and there is nothing to count.
  reset();
  const rich = mob(player.x + 150, player.y, { hp: 1, maxHp: 6, xp: 3 });
  enemies.push(rich);
  aimAt(rich);
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
  console.assert(choiceIndex === 1, 'a level-up opens on the middle card');

  // Arrows move the highlight and wrap; Enter takes the highlighted card.
  // The stubs record which one was applied, so taking the wrong card fails.
  let picked = -1;
  const stubs = () => [0, 1, 2].map(i =>
    ({ name: 'c' + i, desc: '', apply: () => { picked = i; } }));
  choices = stubs();
  choiceIndex = 1;
  aim.x = 0;                 // cursor parked off the cards, so that hover
  aim.y = 0;                 // cannot steer what the keys are being tested on
  justPressed.add('ArrowRight');
  update(0.016);
  console.assert(choiceIndex === 2, 'right arrow must move the highlight');
  // D and A steer the cards as well as the arrows do -- the hand is already on
  // WASD, and reaching for the arrows to pick an upgrade is the whole
  // complaint that put the mouse and Enter here.
  justPressed.add('KeyD');
  update(0.016);
  console.assert(choiceIndex === 0, 'D must move the highlight, and wrap');
  justPressed.add('KeyA');
  update(0.016);
  console.assert(choiceIndex === 2, 'A must wrap back the other way');
  // Ending on card 2 -- neither the card it opened on nor the first one, so
  // an Enter that ignored the highlight could not pass this by accident.
  justPressed.add('Enter');
  update(0.016);
  console.assert(picked === 2 && screen === 'playing',
    'Enter must take the highlighted card, took ' + picked);

  // Clicking a card takes that card, whatever the arrows had highlighted.
  screen = 'levelup';
  picked = -1;
  choices = stubs();
  choiceIndex = 1;
  const c2 = cardRect(2, 3);
  aim.x = c2.x + c2.w / 2;
  aim.y = c2.y + c2.h / 2;
  justPressed.add('Mouse0');
  update(0.016);
  console.assert(picked === 2 && screen === 'playing',
    'a click must take the card under the cursor, took ' + picked);

  // A still mouse must not overrule the arrows -- the cursor is left sitting
  // on card 2 from the click above.
  screen = 'levelup';
  choices = stubs();
  choiceIndex = 0;
  update(0.016);
  console.assert(choiceIndex === 0, 'a still cursor must not move the highlight');
  // ...and the level-up is left open, for the number-key check below.

  // Pressing its number applies the upgrade and resumes play.
  const before = player.speed;
  choices = [UPGRADES.find(u => u.name === 'Fins')];
  justPressed.add('Digit1');
  update(0.016);
  console.assert(screen === 'playing' && player.speed > before,
    'picking must apply the upgrade and resume');

  // --- menus take the mouse as well as the keys ---
  // Hovering a row moves the cursor to it, and a click runs that row. The
  // title's third item is Options, so a click there must land on that screen.
  reset();
  screen = 'title';
  menuIndex = 0;
  const optRow = rowRect(2, MENU_TOP);
  aim.x = optRow.x + optRow.w / 2;
  aim.y = optRow.y + optRow.h / 2;
  update(0.016);
  console.assert(menuIndex === 2, 'hovering a menu row must highlight it');
  justPressed.add('Mouse0');
  update(0.016);
  console.assert(screen === 'options', 'clicking a menu row must run it');

  // A cursor left sitting on a row must not fight the keys.
  screen = 'title';
  menuIndex = 0;
  update(0.016);
  console.assert(menuIndex === 0, 'a still cursor must not move the menu cursor');

  // Clicking an options row cycles it, exactly as Enter does.
  screen = 'options';
  const fpsRow = rowRect(OPTIONS.length - 1, OPTION_TOP);
  aim.x = fpsRow.x + fpsRow.w / 2;
  aim.y = fpsRow.y + fpsRow.h / 2;
  const fpsWas = showFps;
  justPressed.add('Mouse0');
  update(0.016);
  console.assert(showFps !== fpsWas, 'clicking an options row must change it');
  showFps = fpsWas;

  // Click dismisses the help screen, and restarts from the death screen.
  screen = 'help';
  returnTo = 'title';
  justPressed.add('Mouse0');
  update(0.016);
  console.assert(screen === 'title', 'a click must leave the help screen');

  screen = 'dead';
  justPressed.add('Mouse0');
  update(0.016);
  console.assert(screen === 'playing', 'a click must restart from the death screen');

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
  aimAt(tough);
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
