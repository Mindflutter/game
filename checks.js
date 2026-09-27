// ===== checks =====
// Open index.html?test and read the console. These become the port's regression suite.

// ---------- checks: open index.html?test and look at the console ----------
if (location.search === '?test') {
  // ---------- harness ----------
  // A check that cannot fail is not a check. check() logs and carries
  // on, so this suite used to print "checks done" over real failures -- and it
  // printed it before the async sound checks had even run. check() counts,
  // report() is the only thing that says whether the suite passed, and it runs
  // once, last, after the awaits. An uncaught throw is already loud in the
  // console, so it needs no extra handling here.
  let passed = 0;
  const failures = [];
  const check = (cond, msg) => {
    if (cond) { passed++; return; }
    failures.push(msg);
    console.error('FAIL: ' + msg);
  };
  const report = () => {
    const total = passed + failures.length;
    if (failures.length) {
      console.log('%c' + failures.length + ' of ' + total + ' checks FAILED',
        'color:#f44;font-weight:bold;font-size:14px');
      failures.forEach(f => console.log('  x ' + f));
    } else {
      console.log('%c' + total + ' checks passed',
        'color:#4c4;font-weight:bold;font-size:14px');
    }
  };

  // A throw partway through used to mean no report at all: loud in the console,
  // but silent about whether the suite passed. Caught here so report() always
  // runs and the throw is counted as the failure it is.
  window.addEventListener('error', e => {
    failures.push('SUITE THREW: ' + (e.message || e));
    report();
  });

  const mob = (x, y, over) => Object.assign(
    { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, xp: 1, lastHitBy: 0,
      pushX: 0, pushY: 0 }, over);

  // The weapon fires along the cursor now, so every check that expects a shot
  // to land has to say where the cursor is. Inheriting whatever the previous
  // check left behind is how a few of these used to pass by luck.
  // Point at something and pull the trigger. Since D28 the weapon is manual, so
  // aiming alone fires nothing -- every check that wants a shot must hold
  // 'Mouse0', which is how a mouse button reaches the game (D22).
  const fireAt = e => { aim.x = e.x; aim.y = e.y; keys.add('Mouse0'); };
  const holdFire = () => keys.add('Mouse0');
  const ceaseFire = () => keys.delete('Mouse0');

  for (let i = 0; i < 300; i++) spawnEnemy();
  check(
    enemies.every(e => e.x < 0 || e.x > ARENA_W || e.y < 0 || e.y > ARENA_H),
    'enemies must spawn outside the arena');
  check(
    new Set(enemies.map(e => e.speed)).size > 1,
    'enemies should not all move at the same speed');

  // Enemy types unlock as the run goes on.
  reset();
  elapsed = 0;
  check(
    new Set(Array.from({ length: 50 }, () => pickEnemyType().name)).size === 1,
    'only drifters at the start of a run');
  elapsed = 60;
  const seen = new Set(Array.from({ length: 400 }, () => pickEnemyType().name));
  check(seen.size === ENEMY_TYPES.length,
    'every type should appear later, saw: ' + [...seen].join(','));

  // Walking an enemy into a standing player must cost exactly one hp.
  reset();
  enemies.push(mob(player.x + 200, player.y, { speed: 100, hp: 999, maxHp: 999 }));
  for (let i = 0; i < 150; i++) update(0.016);   // 2.4s: touches once, not twice
  check(player.hp === 2, 'one touch = one hp, got ' + player.hp);

  // The two "hold fire unless something is in range" checks were deleted with
  // D28: that rule existed only because the weapon fired itself. Firing at open
  // water is now allowed and costs the player a cooldown, which is the point.

  // Shots go where the mouse points, NOT at the nearest enemy. The enemy is
  // planted to the left and the cursor put to the right, so the old
  // nearest-enemy weapon fails this with vx < 0.
  reset();
  enemies.push(mob(player.x - 60, player.y));
  aim.x = player.x + 500;
  aim.y = player.y;
  player.fireTimer = 0;
  holdFire();
  update(1 / 60);
  check(bullets.length === 1 && bullets[0].vx > 0,
    'a shot must fly toward the cursor, vx=' + (bullets[0] && bullets[0].vx));
  ceaseFire();

  // --- the weapon is manual (D28) ---
  // The whole genre change in four checks. An auto-firing weapon passes none
  // of them.
  reset(1);
  spawnPaused = true;            // nothing must arrive and muddy the result
  ceaseFire();
  enemies.push(mob(player.x + 60, player.y, { speed: 0 }));   // inside the ring
  aim.x = player.x + 200; aim.y = player.y;
  for (let i = 0; i < 120; i++) update(1 / 60);  // two seconds of not shooting
  check(bullets.length === 0 && kills === 0,
    'no trigger, no shot -- got ' + bullets.length + ' bullets, ' + kills + ' kills');

  // Firing into open water is allowed now: the old "hold the shot unless
  // something is in range" rule was a crutch for a weapon that fired itself.
  reset(1);
  spawnPaused = true;
  enemies.length = 0;
  aim.x = player.x + 300; aim.y = player.y;
  holdFire();
  update(1 / 60);
  check(bullets.length === 1, 'must fire with nothing in range');
  ceaseFire();

  // The first click is instant -- fireTimer is clamped at zero rather than
  // allowed to run negative while the trigger is up, so a long wait does not
  // bank shots, and a fresh click never feels sticky.
  reset(1);
  spawnPaused = true;            // or the idle player dies mid-wait and step()
                                 // returns early -- which made this check flaky
  for (let i = 0; i < 300; i++) update(1 / 60);   // five seconds, trigger up
  check(player.fireTimer === 0, 'fireTimer must not run negative while idle, got ' + player.fireTimer);
  holdFire();
  update(1 / 60);
  check(bullets.length === 1, 'the first shot after a wait must be immediate');

  // Held, the rate is the rate: ~fireRate shots per second, not one per frame.
  // reset() zeroes bulletId, so it counts this run's shots directly.
  reset(1);
  spawnPaused = true;
  holdFire();
  aim.x = player.x + 300; aim.y = player.y;
  for (let i = 0; i < 60; i++) update(1 / 60);
  check(Math.abs(bulletId - PLAYER_START.fireRate) <= 1,
    'one second held must fire about ' + PLAYER_START.fireRate + ' shots, got ' + bulletId);
  ceaseFire();

  // A dash passes through an enemy, hurts it exactly once, and costs no hp.
  reset();
  const dashed = mob(player.x + 60, player.y, { hp: 5, maxHp: 5 });
  enemies.push(dashed);
  player.fireTimer = 999;                        // silence the weapon
  keys.add('KeyD');
  justPressed.add('Space');
  for (let i = 0; i < 20; i++) update(1 / 60);   // longer than DASH_TIME
  check(dashed.hp === 4,
    'a dash must hit each enemy exactly once, hp=' + dashed.hp);
  check(player.hp === 3,
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
  check(ahead.hp === 4, 'the wave must reach past the body, hp=' + ahead.hp);
  check(ahead.x > aheadX + 10,
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
  check(behind.hp === 5, 'the wave must not hit backwards, hp=' + behind.hp);
  keys.delete('KeyD');

  // The dash closes with a ring, rather than just stopping.
  check(player.dashEnd > 0, 'a finished dash must leave its closing ring');

  // A dash leaves an afterimage trail, so it reads as travel, not a teleport.
  // Only the trail is stationary -- every burst spark is thrown outwards, so
  // this can't pass on the sparks from the enemy it just hit.
  check(particles.some(p => p.vx === 0 && p.vy === 0),
    'a dash must leave an afterimage trail');

  // ...and it cannot be spent again until the cooldown has run.
  justPressed.add('Space');
  update(1 / 60);
  check(player.dashTime <= 0, 'no second dash inside the cooldown');
  keys.delete('KeyD');

  // A shot dies once it has flown its range, rather than crossing the arena.
  reset();
  bullets.push({ id: ++bulletId, x: 100, y: 400, r: 4, vx: BULLET_SPEED, vy: 0,
                 pierce: 0, travelled: 0, maxTravel: 200 });
  for (let i = 0; i < 40; i++) update(1 / 60);   // long enough to fly 280px
  check(bullets.length === 0, 'shots must expire at the edge of their range');

  // A piercing shot passes through, but only damages each enemy once.
  reset();
  const tank = mob(player.x + 100, player.y, { hp: 3, maxHp: 3 });
  enemies.push(tank);
  player.fireTimer = 999;                        // silence the auto-weapon
  bullets.push({ id: ++bulletId, x: player.x, y: player.y, r: 4,
                 vx: BULLET_SPEED, vy: 0, pierce: 2, travelled: 0, maxTravel: 300 });
  for (let i = 0; i < 30; i++) update(1 / 60);
  check(tank.hp === 2, 'a piercing shot must hit once, hp=' + tank.hp);

  // A tough enemy survives a hit that would kill a drifter.
  reset();
  const big = mob(player.x + 120, player.y, { hp: 6, maxHp: 6, xp: 3 });
  enemies.push(big);
  fireAt(big);
  for (let i = 0; i < 45; i++) update(1 / 60);
  check(big.hp < 6 && kills === 0, 'a bulwark must not die to one shot');
  ceaseFire();

  // Shooting a drifter kills it and drops a gem.
  reset();
  const drifter = mob(player.x + 150, player.y);
  enemies.push(drifter);
  fireAt(drifter);
  for (let i = 0; i < 60; i++) update(0.016);    // ~1s
  check(kills === 1, 'expected one kill, got ' + kills);
  check(gems.length === 1, 'a kill must drop a gem');
  ceaseFire();

  // A tougher enemy is worth more gems. Keep it outside pickupRange, or the
  // gems get vacuumed up the moment they drop and there is nothing to count.
  reset();
  const rich = mob(player.x + 150, player.y, { hp: 1, maxHp: 6, xp: 3 });
  enemies.push(rich);
  fireAt(rich);
  for (let i = 0; i < 60; i++) update(0.016);
  check(gems.length === 3, 'xp 3 must drop 3 gems, got ' + gems.length);
  ceaseFire();

  // An ignored gem fades out instead of littering the floor forever.
  reset();
  gems.push({ x: 40, y: 40, r: 4, life: 0.5 });
  for (let i = 0; i < 60; i++) update(1 / 60);
  check(gems.length === 0, 'uncollected gems must expire');

  // Levelling costs more each time, rather than less.
  const costs = [];
  for (let lv = 1; lv <= 6; lv++) costs.push(Math.round(5 * Math.pow(XP_GROWTH, lv - 1)));
  check(costs.every((c, i) => i === 0 || c > costs[i - 1]),
    'xp cost must rise every level: ' + costs.join(','));

  // Collecting the last gem you need levels you up and pauses the game.
  reset();
  xp = xpNext - 1;
  gems.push({ x: player.x, y: player.y, r: 4, life: GEM_LIFE });
  update(0.016);
  check(level === 2 && screen === 'levelup', 'last gem must level you up and pause');
  check(choices.length === 3, 'a level-up offers 3 choices');
  check(new Set(choices).size === 3, 'the 3 choices must be different');
  check(choiceIndex === 1, 'a level-up opens on the middle card');

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
  check(choiceIndex === 2, 'right arrow must move the highlight');
  // D and A steer the cards as well as the arrows do -- the hand is already on
  // WASD, and reaching for the arrows to pick an upgrade is the whole
  // complaint that put the mouse and Enter here.
  justPressed.add('KeyD');
  update(0.016);
  check(choiceIndex === 0, 'D must move the highlight, and wrap');
  justPressed.add('KeyA');
  update(0.016);
  check(choiceIndex === 2, 'A must wrap back the other way');
  // Ending on card 2 -- neither the card it opened on nor the first one, so
  // an Enter that ignored the highlight could not pass this by accident.
  justPressed.add('Enter');
  update(0.016);
  check(picked === 2 && screen === 'playing',
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
  check(picked === 2 && screen === 'playing',
    'a click must take the card under the cursor, took ' + picked);

  // A still mouse must not overrule the arrows -- the cursor is left sitting
  // on card 2 from the click above.
  screen = 'levelup';
  choices = stubs();
  choiceIndex = 0;
  update(0.016);
  check(choiceIndex === 0, 'a still cursor must not move the highlight');
  // ...and the level-up is left open, for the number-key check below.

  // Pressing its number applies the upgrade and resumes play.
  const before = player.speed;
  choices = [UPGRADES.find(u => u.name === 'Fins')];
  justPressed.add('Digit1');
  update(0.016);
  check(screen === 'playing' && player.speed > before,
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
  check(menuIndex === 2, 'hovering a menu row must highlight it');
  justPressed.add('Mouse0');
  update(0.016);
  check(screen === 'options', 'clicking a menu row must run it');

  // A cursor left sitting on a row must not fight the keys.
  screen = 'title';
  menuIndex = 0;
  update(0.016);
  check(menuIndex === 0, 'a still cursor must not move the menu cursor');

  // Clicking an options row cycles it, exactly as Enter does.
  screen = 'options';
  const fpsRow = rowRect(OPTIONS.length - 1, OPTION_TOP);
  aim.x = fpsRow.x + fpsRow.w / 2;
  aim.y = fpsRow.y + fpsRow.h / 2;
  const fpsWas = showFps;
  justPressed.add('Mouse0');
  update(0.016);
  check(showFps !== fpsWas, 'clicking an options row must change it');
  showFps = fpsWas;

  // Click dismisses the help screen, and restarts from the death screen.
  screen = 'help';
  returnTo = 'title';
  justPressed.add('Mouse0');
  update(0.016);
  check(screen === 'title', 'a click must leave the help screen');

  screen = 'dead';
  justPressed.add('Mouse0');
  update(0.016);
  check(screen === 'playing', 'a click must restart from the death screen');

  // Sparks appear on a kill, then clean themselves up.
  reset();
  burst(100, 100, '#fff', '#fff', 8, 150, 0.2);
  check(particles.length === 8, 'burst must make 8 sparks');
  for (let i = 0; i < 30; i++) update(1 / 60);   // 0.5s, well past their 0.2s life
  check(particles.length === 0, 'sparks must expire, left ' + particles.length);

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
  check(Math.abs(at60 - at144) < 1,
    'spark drag must not depend on frame rate: ' + at60.toFixed(2) + ' vs ' + at144.toFixed(2));

  // A hit that doesn't kill must still throw sparks, or damage looks like
  // nothing happened.
  reset();
  const tough = mob(player.x + 90, player.y, { hp: 9, maxHp: 9, xp: 1 });
  enemies.push(tough);
  fireAt(tough);
  for (let i = 0; i < 40; i++) update(1 / 60);
  check(tough.hp < 9 && kills === 0, 'setup: it should be hurt but alive');
  check(particles.length > 0, 'a non-lethal hit must throw sparks');
  ceaseFire();

  // Getting hit shakes the screen, and the shake settles back to nothing.
  reset();
  // 15px apart: closer than the radii add up to (9 + 10), so they touch.
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  check(shake > 0, 'a hit must shake the screen');

  // It must ease out, not stop dead: still moving a quarter second later, but
  // well under half of what it started at.
  const hitPeak = shake;
  for (let i = 0; i < 15; i++) update(1 / 60);
  check(shake > 0 && shake < hitPeak * 0.5,
    'shake must ease out, not cut off: ' + hitPeak.toFixed(2) + ' -> ' + shake.toFixed(2));

  enemies.length = 0;            // or it hits again once invulnerability lapses
  for (let i = 0; i < 150; i++) update(1 / 60);
  check(shake === 0, 'shake must reach a still picture, got ' + shake);

  // The fade must take the same time whatever the frame rate.
  reset(); shake = 10;
  for (let i = 0; i < 60; i++) update(1 / 60);
  const fade60 = shake;
  reset(); shake = 10;
  for (let i = 0; i < 144; i++) update(1 / 144);
  check(Math.abs(fade60 - shake) < 0.01,
    'shake fade must not depend on frame rate: ' + fade60 + ' vs ' + shake);

  // Sound is a no-op before the player has pressed anything, not a crash.
  check(audio === null, 'no audio context before a key press');
  sound('shoot');

  // Every binding must work on a non-Latin keyboard. These dispatch real
  // events with the character a Russian (or AZERTY) layout actually produces,
  // while the physical key stays the same.
  reset();
  keys.clear();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ц', code: 'KeyW' }));
  check(keys.has('KeyW'), 'a Russian-layout W must register');
  const yBefore = player.y;
  update(0.1);
  check(player.y < yBefore, 'a Russian-layout W must move the player up');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ц', code: 'KeyW' }));
  check(!keys.has('KeyW'), 'releasing it must stop the player');

  reset();
  screen = 'dead';
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'к', code: 'KeyR' }));
  update(1 / 60);
  check(screen === 'playing', 'a Russian-layout R must restart the game');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'к', code: 'KeyR' }));

  reset();
  screen = 'levelup';
  choices = [UPGRADES.find(u => u.name === 'Fins')];
  const speedBefore = player.speed;
  // '&' is what an unshifted 1 types on a French AZERTY keyboard.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1' }));
  update(1 / 60);
  check(screen === 'playing' && player.speed > speedBefore,
    'an AZERTY-layout 1 must pick the first upgrade');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: '&', code: 'Digit1' }));
  keys.clear();

  // --- screens, menus and options ---
  // tap() presses a key for exactly one frame, the way a real press arrives.
  const tap = code => { justPressed.add(code); update(1 / 60); };

  reset();
  screen = 'title'; menuIndex = 0;
  check(MENUS.title.items[0].label === 'Start', 'first title entry is Start');
  tap('Enter');
  check(screen === 'playing', 'Start must begin a run, got ' + screen);

  tap('Escape');
  check(screen === 'paused', 'Esc in play must open the menu, got ' + screen);
  tap('Escape');
  check(screen === 'playing', 'Esc again must resume, got ' + screen);

  // Help must come back to wherever it was opened from, not always the title.
  screen = 'title'; menuIndex = 1;
  tap('Enter');
  check(screen === 'help', 'title -> help, got ' + screen);
  tap('Escape');
  check(screen === 'title', 'help must return to the title, got ' + screen);

  screen = 'paused'; menuIndex = 1;
  tap('Enter');
  check(screen === 'help', 'pause -> help, got ' + screen);
  tap('Escape');
  check(screen === 'paused', 'help must return to the pause menu, got ' + screen);

  // The cursor wraps at both ends.
  screen = 'title'; menuIndex = 0;
  tap('ArrowUp');
  check(menuIndex === MENUS.title.items.length - 1, 'cursor wraps upward');
  tap('ArrowDown');
  check(menuIndex === 0, 'cursor wraps back down');

  // Holding a key must not scroll the menu: a repeat is not a fresh press.
  screen = 'title'; menuIndex = 0;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', repeat: true }));
  update(1 / 60);
  check(menuIndex === 0, 'key auto-repeat must not move the cursor');

  // Each option changes the thing it claims to.
  screen = 'options'; optionIndex = 0; volume = 0.6;
  tap('ArrowLeft');
  check(Math.abs(volume - 0.5) < 1e-9, 'volume must go down, got ' + volume);
  tap('ArrowRight'); tap('ArrowRight');
  check(Math.abs(volume - 0.7) < 1e-9, 'volume must go up, got ' + volume);
  volume = 0.6;

  screen = 'options'; optionIndex = 1; shakeLevel = 2;
  tap('ArrowLeft');
  check(SHAKE_LEVELS[shakeLevel].name === 'low', 'shake must step down');

  screen = 'options'; optionIndex = 2; showFps = false;
  tap('Enter');
  check(showFps === true, 'fps readout must toggle on');
  tap('Enter');
  check(showFps === false, 'fps readout must toggle off');

  // Dying shakes the screen, and that shake must settle even though the game
  // has stopped updating. The check above never died, so it missed this.
  reset();
  player.hp = 1;
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  check(screen === 'dead', 'setup: that should have killed the player');
  check(shake > 0, 'dying must shake the screen');
  for (let i = 0; i < 150; i++) update(1 / 60);
  check(shake === 0, 'shake must settle on the death screen, got ' + shake);

  // ...and it must not follow you out to the menus either.
  reset();
  player.hp = 1;
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  justPressed.add('Escape');
  update(1 / 60);
  check(screen === 'title', 'setup: Esc should leave to the title');
  for (let i = 0; i < 150; i++) update(1 / 60);
  check(shake === 0, 'the title must not inherit a shake, got ' + shake);

  // "off" has to actually mean off, not merely smaller.
  shakeLevel = 0;
  reset();
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  check(shake === 0, 'shake "off" must not shake at all, got ' + shake);
  shakeLevel = 2;

  // ---------- screens fit ----------
  // Adding a row to HELP_KEYS once pushed the list straight through the blurb
  // below it, and all 107 checks passed while the screen was unreadable. Layout
  // is derived from the data now; this is the guard that keeps it that way.
  openScreen('help');
  draw();
  check(helpBottom < HINT_Y - 10,
    'the help screen must end above the hint: content ends at ' + helpBottom +
    ', hint sits at ' + HINT_Y + ' -- add a row and it overflows');
  screen = 'title';

  // ---------- scenarios ----------
  // A scenario must set up exactly what it names and nothing else, or it is not
  // isolation. The load-bearing one is "no new arrivals": without it a scenario
  // is just a normal dive with a head start.
  check(applyScenario('one-drifter'), 'a known scenario must load');
  check(enemies.length === 1, 'one-drifter must place exactly one enemy, got ' + enemies.length);
  check(enemies[0].hp === 1 && enemies[0].r === 9, 'one-drifter must place a drifter');
  check(spawnPaused === true, 'a scenario with spawn:false must pause spawning');
  let mostSeen = enemies.length;
  for (let i = 0; i < 900; i++) { update(1 / 60); mostSeen = Math.max(mostSeen, enemies.length); }
  check(mostSeen === 1, 'a paused scenario must never gain an enemy, peaked at ' + mostSeen);

  check(applyScenario('three-types'), 'three-types must load');
  check(enemies.length === 3, 'three-types must place three enemies, got ' + enemies.length);
  check(new Set(enemies.map(e => e.r)).size === 3, 'three-types must place three different types');

  check(applyScenario('late-swarm'), 'late-swarm must load');
  check(Math.round(elapsed) === 60, 'late-swarm must start 60s in, got ' + elapsed);
  check(spawnPaused === false, 'a scenario without spawn:false must keep spawning');
  for (let i = 0; i < 300; i++) update(1 / 60);
  check(enemies.length > 0, 'late-swarm must still spawn enemies');

  check(applyScenario('no-such-scenario') === false, 'an unknown scenario must report failure');

  // advance() is the stepped-mode driver: exactly n ticks, no wall clock at all.
  applyScenario('one-drifter');
  const steppedFrom = elapsed;
  advance(30);
  check(Math.abs(elapsed - steppedFrom - 30 / 60) < 1e-9,
    'advance(30) must move exactly 30 ticks, moved ' + (elapsed - steppedFrom));

  // ?test is not a scenario, so the frame loop must still run normally here.
  check(stepped === false, '?test must not be stepped');

  // ---------- determinism ----------
  // The same seed must replay the same dive. Every balance number from here on
  // rests on this: without it, comparing two builds compares two different
  // games, which is why the old measurements needed 21 runs per configuration
  // to see through the spawn noise. This fails the moment a Math.random()
  // survives anywhere in game/.
  const trace = seed => {
    reset(seed);
    const out = [];
    for (let i = 0; i < 600; i++) {
      update(1 / 60);
      out.push(enemies.length, kills, gems.length, bullets.length,
               Math.round(player.hp), Math.round(elapsed * 100));
    }
    return out.join(',');
  };
  const runA = trace(4471);
  const runB = trace(4471);
  const runC = trace(9999);
  check(runA === runB, 'the same seed must replay the same dive exactly');
  check(runA !== runC, 'different seeds must produce different dives');
  check(currentSeed === 9999,
    'reset(seed) must record the seed it used, got ' + currentSeed);

  // Leave the game in a known state before the frame loop gets it. This has to
  // stay synchronous: the loop starts as soon as this block returns, and the
  // sound checks below are async, so deferring the reset would let the loop play
  // out whatever the last check left behind.
  reset();

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
      check(peak >= 0.15,
        'sound "' + name + '" is too quiet to hear: peak ' + peak.toFixed(3) +
        ' (' + (20 * Math.log10(peak)).toFixed(1) + ' dBFS)');
    }
    report();
  })();
}

// A stepped scenario never starts the loop (D37 -- Scenarios): the whole point
// is that nothing advances until step() asks it to.
if (!stepped) requestAnimationFrame(frame);
