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
    { x, y, r: 9, speed: 0, hp: 1, maxHp: 1, value: 1, lastHitBy: 0,
      pushX: 0, pushY: 0 }, over);

  // A bullet, built the way the weapon builds one. Five checks hand-rolled this
  // literal; when bullets gained `speed` (D53) every one of them would have
  // computed NaN travel and flown forever, because `NaN >= maxTravel` is false.
  const shot = (over = {}) => {
    const b = Object.assign({ id: ++bulletId, x: player.x, y: player.y, r: player.shotRadius,
                              vx: player.shotSpeed, vy: 0, pierce: 0,
                              travelled: 0, maxTravel: 300 }, over);
    b.speed = Math.hypot(b.vx, b.vy);
    bullets.push(b);
    return b;
  };

  // Hold right, tap Space, run the dash out, release. Six checks wrote this by
  // hand and two of them had already forgotten the release, which is the drift
  // a copy-pasted fixture always produces.
  const dashRight = (ticks = 20, dt = 1 / 60) => {
    keys.add('KeyD');
    justPressed.add('Space');
    for (let i = 0; i < ticks; i++) update(dt);
    keys.delete('KeyD');
  };

  // The weapon fires along the cursor now, so every check that expects a shot
  // to land has to say where the cursor is. Inheriting whatever the previous
  // check left behind is how a few of these used to pass by luck.
  // Point at something and pull the trigger. Since D28 the weapon is manual, so
  // aiming alone fires nothing -- every check that wants a shot must hold
  // 'Mouse0', which is how a mouse button reaches the game (D22).
  // A real press is always preceded by a frame with the button up, which is
  // what arms the trigger (D47). These helpers start mid-press, so they assert
  // that precondition instead of simulating it. The arming logic itself is
  // exercised by its own check, further down.
  const holdFire = () => { fireArmed = true; keys.add('Mouse0'); };
  const fireAt = e => { aim.x = e.x; aim.y = e.y; holdFire(); };
  const ceaseFire = () => keys.delete('Mouse0');

  // Runs the simulation with the player kept invulnerable. An unattended player
  // dies in seconds, and step() returns early on the death screen -- so any
  // check that lets time pass is otherwise liable to measure a *stopped* game
  // and pass for the wrong reason. That happened to the gate checks below.
  // `until` stops it early -- a batch arriving, say -- and still ends on the
  // same oracle, so a caller that waits cannot skip it.
  const runAlive = (n, until = () => false) => {
    for (let i = 0; i < n && !until(); i++) { player.hurt = player.iframes; update(1 / 60); }
    // The oracle lives here, not at the call sites. A check that lets time pass
    // while the sim has quietly stopped passes for the wrong reason -- that
    // happened once already (D48), and relying on each caller to remember the
    // assertion is the same discipline that failed then.
    check(screen === 'playing',
      'runAlive: the simulation stopped (screen ' + screen + ') -- anything measured after this is meaningless');
  };
  // Long enough to clear the gate whatever GATE_PAUSE is tuned to, and no
  // longer -- a hardcoded frame count both wastes ticks and goes quietly wrong
  // the first time that constant moves.
  const pastGate = () => runAlive(Math.ceil(GATE_PAUSE * 60) + 3);
  // Later gates wait on the descent (S2), not GATE_PAUSE: ride the current until
  // something arrives. Bounded, so a camera that never arrives fails instead of
  // hanging the suite.
  const arrived = () => enemies.length > 0;

  // --- arrivals ---
  reset(1);
  spawnBatch({ enemies: [['drifter', 6], ['darter', 6], ['bulwark', 6]] });
  check(enemies.length === 18, 'a batch must bring exactly what it names, got ' + enemies.length);
  check(enemies.every(e => e.x < 0 || e.x > ARENA_W || e.y < 0 || e.y > ARENA_H),
    'enemies must arrive outside the arena');
  check(new Set(enemies.map(e => e.speed)).size > 1,
    'arrivals must not all move at the same speed');

  // Every batch must name types that exist, in counts that mean something. This
  // is the check the "content is data" convention implies for any data table:
  // a typo here would just make the game quietly easier.
  const named = LAYERS.flatMap(l => l.stretches.flatMap(st => st.pool)).flatMap(b => b.enemies);
  check(named.every(([name]) => ENEMY_TYPES.some(t => t.name === name)),
    'every batch must name a real enemy type, unknown: ' +
    named.filter(([n]) => !ENEMY_TYPES.some(t => t.name === n)).map(([n]) => n).join(','));
  check(named.every(([, count]) => Number.isInteger(count) && count >= 1),
    'every batch count must be a positive integer');

  // --- the gate (D27) ---
  // The whole point: nothing new arrives until the current batch is dead. An
  // endless spawn director passes none of this.
  reset(1);
  check(enemies.length === 0 && breathTimer > 0, 'a dive must open on the beat, not mid-fight');
  pastGate();                                      // wait out the opening gate
  check(enemies.length > 0 && batchIndex === 1, 'the first batch must arrive, batchIndex ' + batchIndex);

  const firstBatchSize = enemies.length;
  runAlive(600);                                   // ten seconds of not killing
  check(enemies.length === firstBatchSize && batchIndex === 1,
    'nothing may arrive while a batch lives: ' + enemies.length + ' enemies, batchIndex ' + batchIndex);

  // Clear it by hand and the gate opens, then the next batch comes.
  enemies = [];
  runAlive(1);
  check(cameraY > 0, 'clearing a batch must start the descent before the next');
  check(batchIndex === 1, 'the next batch must not arrive during the gate');
  runAlive(60 * 30, arrived);
  check(batchIndex === 2 && enemies.length > 0, 'the gate must release the next batch');

  // A third in a row, which is S1's definition of done. Continues the sequence
  // above rather than restarting it -- the only new information is one more
  // clear, and re-walking the whole path costs ~250 sim ticks to learn nothing.
  enemies = [];
  runAlive(1);
  runAlive(60 * 30, arrived);
  check(batchIndex === 3, 'three batches must clear in sequence, got ' + batchIndex);

  // --- window size (D29) ---
  // The same seed, played through the real mouse path at three window sizes,
  // must reach the bottom of the dive in the same time. The window reaches the
  // game only through `aim`, so aim arrives as mousemove events in *client*
  // pixels -- the letterbox conversion, and the camera on top of it, are what is
  // under test. The whole dive -- S2's DoD said "one layer", and since S4
  // (D66) a dive runs on through every layer, so that is the whole of it.
  const traverse = (w, h) => {
    resize(w, h);
    reset(4471);
    // The cap grows with the dive: a layer takes ~290s here, so 450s each is
    // headroom, and a third layer does not fail this for a reason that has
    // nothing to do with window size.
    for (let i = 0; i < LAYERS.length * 450 / FIXED_DT && screen !== 'won'; i++) {
      player.hurt = player.iframes;
      if (screen === 'mods') justPressed.add('Digit1');
      else if (enemies.length) {
        const e = enemies[0];
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: offX + e.x * scale, clientY: offY + (e.y - cameraY) * scale }));
        holdFire();
      } else ceaseFire();
      update(FIXED_DT);                          // update() clears justPressed
    }
    ceaseFire();
    return screen === 'won' ? elapsed : -1;
  };
  const traverseFrom = performance.now();
  const sizes = [[1280, 800], [1920, 1080], [3440, 1440]].map(([w, h]) => traverse(w, h));
  resize();                                            // back to the real window
  check(sizes.every(t => t > 0), 'D29: every window size must reach the bottom: ' + sizes.join(', '));
  // Within 2%, not exact: a synthetic MouseEvent carries whole client pixels,
  // so aim can land up to a pixel off, which can shift a kill by a tick. A
  // window-size bug moves it by far more.
  check(Math.max(...sizes) - Math.min(...sizes) <= 0.02 * Math.min(...sizes),
    'D29: difficulty must not depend on window size, times ' + sizes.map(t => t.toFixed(2)).join(' / '));
  console.log('D29 times to the bottom: ' + sizes.map(t => t.toFixed(2)).join(' / ') +
              ' (check took ' + Math.round(performance.now() - traverseFrom) + 'ms)');

  // --- the dim reaches the letterbox (D58) ---
  // The water tint paints the margin too, so a dim screen has to cover it as
  // well -- a dim clipped to the view left bright bands down the sides of the
  // mod screen. A window wider than 16:10, so there is a side margin to read.
  resize(1800, 800);
  reset(1);
  screen = 'mods';
  draw();
  const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
  const margin = px(5, 790);
  const inside = px(Math.round(offX) + 5, 790);
  resize();
  check(margin.every((c, i) => Math.abs(c - inside[i]) <= 2),
    'a dim screen must darken the margin as much as the view: margin ' + margin + ', view ' + inside);

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
  queuePaused = true;            // nothing must arrive and muddy the result
  ceaseFire();
  enemies.push(mob(player.x + 60, player.y, { speed: 0 }));   // inside the ring
  aim.x = player.x + 200; aim.y = player.y;
  for (let i = 0; i < 120; i++) update(1 / 60);  // two seconds of not shooting
  check(bullets.length === 0 && kills === 0,
    'no trigger, no shot -- got ' + bullets.length + ' bullets, ' + kills + ' kills');

  // Firing into open water is allowed now: the old "hold the shot unless
  // something is in range" rule was a crutch for a weapon that fired itself.
  reset(1);
  queuePaused = true;
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
  queuePaused = true;            // or the idle player dies mid-wait and step()
                                 // returns early -- which made this check flaky
  for (let i = 0; i < 300; i++) update(1 / 60);   // five seconds, trigger up
  check(player.fireTimer === 0, 'fireTimer must not run negative while idle, got ' + player.fireTimer);
  holdFire();
  update(1 / 60);
  check(bullets.length === 1, 'the first shot after a wait must be immediate');

  // Held, the rate is the rate: ~fireRate shots per second, not one per frame.
  // reset() zeroes bulletId, so it counts this dive's shots directly.
  reset(1);
  queuePaused = true;
  holdFire();
  aim.x = player.x + 300; aim.y = player.y;
  for (let i = 0; i < 60; i++) update(1 / 60);
  check(Math.abs(bulletId - player.fireRate) <= 1,
    'one second held must fire about ' + player.fireRate + ' shots, got ' + bulletId);
  ceaseFire();

  // The dash starts as pure movement (D51): it throws what it passes through
  // and does not wound it. Damage is bought, never free.
  const impact = MODS.find(m => m.name === 'Impact');
  reset();
  const shoved = mob(player.x + 60, player.y, { hp: 5, maxHp: 5 });
  enemies.push(shoved);
  player.fireTimer = 999;                        // silence the weapon
  const shovedX = shoved.x;
  dashRight();   // 20 ticks, longer than DASH_TIME
  check(shoved.hp === 5,
    'an unbought dash must not wound what it throws, hp=' + shoved.hp);
  check(shoved.x > shovedX + 10,
    'an unbought dash must still shove, moved ' + (shoved.x - shovedX).toFixed(1));
  check(!shoved.flash,
    'a dash that did no damage must not flash the enemy white');
  check(player.hp === 3,
    'a dash must pass through unharmed, hp=' + player.hp);

  // ...and with Impact it wounds, exactly once, by exactly what was bought.
  reset();
  impact.apply(player);
  const dashed = mob(player.x + 60, player.y, { hp: 5, maxHp: 5 });
  enemies.push(dashed);
  player.fireTimer = 999;
  dashRight();
  check(dashed.hp === 4,
    'a bought dash must hit each enemy exactly once, hp=' + dashed.hp);

  // Two Impacts wound for two, so the mod stacks rather than just switching on.
  reset();
  impact.apply(player);
  impact.apply(player);
  const twice = mob(player.x + 60, player.y, { hp: 5, maxHp: 5 });
  enemies.push(twice);
  player.fireTimer = 999;
  dashRight();
  check(twice.hp === 3, 'two Impacts must wound for two, hp=' + twice.hp);

  // The wave reaches past the player's body. This one sits 30px beyond the far
  // end of the dash -- never touched, but well inside the wave.
  reset();
  impact.apply(player);                          // hp is the oracle, so buy it
  player.fireTimer = 999;
  const ahead = mob(player.x + 171, player.y, { hp: 5, maxHp: 5 });
  enemies.push(ahead);
  const aheadX = ahead.x;
  dashRight();
  check(ahead.hp === 4, 'the wave must reach past the body, hp=' + ahead.hp);
  check(ahead.x > aheadX + 10,
    'the wave must shove what it hits, moved ' + (ahead.x - aheadX).toFixed(1));

  // ...but only forwards. This one is the same 30px away, behind the dash, so
  // a wave that ignored direction would catch it.
  reset();
  impact.apply(player);
  player.fireTimer = 999;
  const behind = mob(player.x - 30, player.y, { hp: 5, maxHp: 5 });
  enemies.push(behind);
  dashRight();
  check(behind.hp === 5, 'the wave must not hit backwards, hp=' + behind.hp);

  // The dash closes with a ring, rather than just stopping.
  check(player.dashEnd > 0, 'a finished dash must leave its closing ring');

  // A dash leaves an afterimage trail, so it reads as travel, not a teleport.
  // Only the trail is stationary -- every burst spark is thrown outwards, so
  // this can't pass on the sparks from the enemy it just hit.
  check(particles.some(p => p.vx === 0 && p.vy === 0),
    'a dash must leave an afterimage trail');

  // ...and it cannot be spent again until the cooldown has run. The movement
  // key has to be held: a dash also needs a direction, so without one this
  // passed because `len === 0` blocked it, never testing the cooldown at all.
  keys.add('KeyD');
  justPressed.add('Space');
  update(1 / 60);
  check(player.dashCd > 0 && player.dashTime <= 0,
    'no second dash inside the cooldown, cd=' + player.dashCd.toFixed(2));
  keys.delete('KeyD');

  // A fast dash must not step over its own hitbox. The wave reaches 40px past
  // an enemy's radius, but the dash covers speed x 3.4 x dt in a frame and
  // `Fins` raises speed with no cap -- so a point test taken once a frame
  // teleports past whatever it crossed. Eight Fins on a 20fps frame steps 105px
  // against a 49px reach, and this enemy is in front before the step and behind
  // after it, which is why the old test never saw it at all. Igor hit this:
  // "dash ... sometimes doesnt deal damage".
  reset();
  impact.apply(player);
  player.fireTimer = 999;
  const fins = MODS.find(m => m.name === 'Fins');
  for (let i = 0; i < 8; i++) fins.apply(player);
  const swept = mob(player.x + 30, player.y, { hp: 5, maxHp: 5 });
  enemies.push(swept);
  dashRight(8, 0.05);                            // the slowest frame dt allows
  check(swept.hp === 4,
    'a fast dash must hit what it sweeps through, not step over it: hp=' +
    swept.hp + ' after passing through it at speed ' + player.speed);

  // Dash length is its own stat and does not ride on `player.speed` (D56).
  // Igor, twice: "once the dash becomes long, it feels way easier" and then
  // "dash length still increases over time or mod upgrades". It did: the dash
  // moved at speed x 3.4, `Fins` raises speed with no cap, so ten of them took
  // the lunge from 141px to 402px -- a third of the arena, untouchable.
  // Exactly the dash's own length in ticks, derived: one tick more and the
  // measurement picks up ordinary walking after the lunge ends.
  const DASH_TICKS = Math.floor(DASH_TIME / FIXED_DT);
  const dashDistance = extraFins => {
    reset();
    queuePaused = true;
    keys.clear();
    player.fireTimer = 999;
    for (let i = 0; i < extraFins; i++) fins.apply(player);
    const x0 = player.x;
    keys.add('KeyD');
    justPressed.add('Space');
    for (let i = 0; i < DASH_TICKS; i++) update(FIXED_DT);
    keys.clear();
    return player.x - x0;
  };
  const bare = dashDistance(0), finned = dashDistance(8);
  check(Math.abs(bare - finned) < 1,
    'Fins must not lengthen the dash: ' + bare.toFixed(1) + 'px bare vs ' +
    finned.toFixed(1) + 'px with eight');
  check(bare > 100, 'a dash must still cover ground, ' + bare.toFixed(1) + 'px');

  // A dash is a committed lunge. The direction is taken when it starts and live
  // input cannot steer it -- Igor: "it's possible to change direction during
  // the dash". Three ways it was steerable, all from travel following the keys
  // while only the *wave* was frozen: switching keys turned the lunge, holding
  // the opposite key reversed it (and then the wave faced the way you came, so
  // it hit nothing), and releasing everything stopped you dead while dashTime
  // ran on -- a free 0.31s of invulnerability for standing still.
  const dashAndSwitch = to => {
    reset();
    queuePaused = true;
    keys.clear();                     // or this case inherits the last one's key
    player.fireTimer = 999;
    const x0 = player.x, y0 = player.y;
    keys.add('KeyD');
    justPressed.add('Space');
    update(FIXED_DT);                 // committed to +x on this frame
    keys.clear();
    if (to) keys.add(to);
    for (let i = 1; i < DASH_TICKS; i++) update(FIXED_DT);
    keys.clear();
    return { dx: player.x - x0, dy: player.y - y0 };
  };
  const straight = dashAndSwitch('KeyD');
  check(straight.dx > 100 && Math.abs(straight.dy) < 1,
    'a dash held straight must travel its length, moved ' + straight.dx.toFixed(1));
  for (const [key, label] of [['KeyW', 'turn it'], ['KeyA', 'reverse it'],
                              [null, 'stop it by letting go']]) {
    const r = dashAndSwitch(key);
    check(Math.abs(r.dx - straight.dx) < 1 && Math.abs(r.dy) < 1,
      'mid-dash input must not ' + label + ': moved ' +
      r.dx.toFixed(1) + ',' + r.dy.toFixed(1) +
      ' instead of ' + straight.dx.toFixed(1) + ',0');
  }



  // A shot dies once it has flown its range, rather than crossing the arena.
  reset();
  shot({ x: 100, y: 400, maxTravel: 200 });
  for (let i = 0; i < 40; i++) update(1 / 60);   // long enough to fly 280px
  check(bullets.length === 0, 'shots must expire at the edge of their range');

  // A piercing shot passes through, but only damages each enemy once.
  reset();
  const tank = mob(player.x + 100, player.y, { hp: 3, maxHp: 3 });
  enemies.push(tank);
  player.fireTimer = 999;                        // silence the auto-weapon
  shot({ pierce: 2 });
  for (let i = 0; i < 30; i++) update(1 / 60);
  check(tank.hp === 2, 'a piercing shot must hit once, hp=' + tank.hp);

  // A tough enemy survives a hit that would kill a drifter.
  reset();
  const big = mob(player.x + 120, player.y, { hp: 6, maxHp: 6, value: 3 });
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
  // In flight or already in the purse: gems fly to you from the drop (D35).
  check(gems.length + currency === 1, 'a kill must drop a gem');
  ceaseFire();

  // A tougher enemy is worth more gems. Counted in flight and in the purse
  // together, since they fly to you the moment they drop (D35).
  reset();
  const rich = mob(player.x + 150, player.y, { hp: 1, maxHp: 6, value: 3 });
  enemies.push(rich);
  fireAt(rich);
  for (let i = 0; i < 60; i++) update(0.016);
  check(gems.length + currency === 3, 'a value of 3 must drop 3 gems, got ' + (gems.length + currency));
  ceaseFire();

  // A gem nowhere near you still reaches you: it flies to you from anywhere
  // and never fades (D35). This replaced "uncollected gems must expire" --
  // there is nothing uncollected any more.
  reset();
  queuePaused = true;
  gems.push({ x: 40, y: cameraY + 40, r: 4 });
  runAlive(180);
  check(gems.length === 0 && currency === 1, 'a far gem must fly to you and pay, currency ' + currency);

  // A gem is money now, not XP (D34). Collecting one must pay the purse and
  // must not rank you up -- the XP bar that did is deleted.
  reset();
  gems.push({ x: player.x, y: player.y, r: 4 });
  update(0.016);
  check(currency === 1, 'a collected gem must pay currency, got ' + currency);
  check(rank === 0 && choices.length === 0 && screen === 'playing',
    'money must not rank you up: rank ' + rank + ', screen ' + screen);

  // --- one rank per batch, and the offer lands at the gate (D33, D34) ---
  // Two enemies killed one at a time, so this can see that the offer waits for
  // the *batch* and not for a kill. That is the rule D33 exists for: the
  // prototype threw the cards up the instant the bar filled, mid-fight.
  reset();
  const pair = [mob(player.x + 150, player.y), mob(player.x - 150, player.y)];
  enemies.push(...pair);
  fireAt(pair[0]);
  for (let i = 0; i < 60; i++) update(1 / 60);
  check(kills === 1 && enemies.length === 1, 'the first of the two must die');
  check(rank === 0 && screen === 'playing' && choices.length === 0,
    'a kill mid-batch must not rank you up or offer a mod (D33)');

  fireAt(pair[1]);
  for (let i = 0; i < 60 && enemies.length; i++) update(1 / 60);
  ceaseFire();
  check(enemies.length === 0 && rank === 1,
    'clearing the batch must rank you up exactly once, rank ' + rank);

  // The rank is banked on the kill, but the cards wait for the death to finish
  // playing (D51). Igor: "batch cleared comes too fast, last enemy just
  // eliminated ... feels unnatural". The kill burst lives 0.5s.
  check(screen === 'playing' && offerTimer > 0,
    'the offer must not land on the frame of the kill: screen ' + screen +
    ', offerTimer ' + offerTimer);
  check(choices.length === 0, 'no cards exist yet during the beat');

  // Then it opens. Stops the tick it does: the cursor is still parked on the
  // enemy it just shot, which is over a card, and one more frame of hover would
  // move the highlight before the check below could read where it opened.
  for (let i = 0; i < Math.ceil(MOD_OFFER_DELAY * 60) + 3 && screen === 'playing'; i++) {
    update(1 / 60);
  }
  check(screen === 'mods', 'the beat must then offer mods, screen ' + screen);
  check(choices.length === 3, 'a gate offers 3 mods, got ' + choices.length);
  check(new Set(choices).size === 3, 'the 3 mods must be different');
  check(choiceIndex === 1, 'the offer opens on the middle card');

  // Nothing arrives behind the cards. The offer sits inside the beat, so an
  // offer that let the clock run would hand the next batch a free approach.
  const heldAt = batchIndex;
  for (let i = 0; i < 300; i++) update(1 / 60);
  check(batchIndex === heldAt && enemies.length === 0 && screen === 'mods',
    'nothing may arrive while the offer is open: batch ' + batchIndex);

  // The pool is body and comfort only until S5 -- Content (D34). A weapon mod
  // cannot be balanced before the weapons exist: "+1 damage" is huge on a
  // railgun and nothing on a spray gun.
  check(MODS.every(m => m.scope === 'body' || m.scope === 'comfort'),
    'every mod must be body or comfort, found: ' +
    MODS.filter(m => m.scope !== 'body' && m.scope !== 'comfort')
        .map(m => m.name + '/' + m.scope).join(','));
  check(new Set(MODS.map(m => m.name)).size === MODS.length,
    'two mods must not share a name');

  // A mod already maxed is never offered (D34). Max out every capped mod and it
  // must drop out of the roll -- 40 rolls, because one proves nothing.
  reset();
  for (const m of MODS) if (m.max) modCounts[m.name] = m.max;
  const rolled = [];
  for (let i = 0; i < 40; i++) rolled.push(...rollMods());
  check(rolled.length > 0 && rolled.every(m => !m.max),
    'a maxed mod must not be offered: ' +
    [...new Set(rolled.filter(m => m.max).map(m => m.name))].join(','));

  // ...and taking one is what counts it, which is what the roll above reads.
  reset();
  screen = 'mods';
  choices = [MODS.find(m => m.name === 'Mend')];
  justPressed.add('Digit1');
  update(0.016);
  check(modCounts.Mend === 1, 'taking a mod must count it, got ' + modCounts.Mend);
  check(player.mendOnClear === 1, 'Mend must grant its effect');

  // The two comfort mods are standing effects, not stat bumps, so each needs a
  // check of its own: that the card was taken proves nothing about what it does.
  reset();
  player.mendOnClear = 1;
  player.hp = 1;
  const wounded = mob(player.x + 150, player.y);
  enemies.push(wounded);
  fireAt(wounded);
  for (let i = 0; i < 60; i++) update(1 / 60);
  check(rank === 1 && player.hp === 2, 'Mend must heal on the clear, hp ' + player.hp);

  // ...and not past the maximum, which is the guard a bare `hp += 1` misses.
  screen = 'playing';
  player.hp = player.maxHp;
  const another = mob(player.x + 150, player.y);
  enemies.push(another);
  fireAt(another);
  for (let i = 0; i < 60; i++) update(1 / 60);
  ceaseFire();
  check(player.hp === player.maxHp,
    'Mend must not heal past the maximum, hp ' + player.hp + '/' + player.maxHp);

  // A batch arrives with no grace period. This used to be half of a pair
  // checking the `Lull` mod; the mod is gone (D55) but the default it contrasted
  // with is still the rule, and it is what a re-added arrival guard would have
  // to break deliberately.
  reset();
  for (let i = 0; i < Math.ceil(GATE_PAUSE / FIXED_DT) + 3; i++) update(FIXED_DT);
  check(enemies.length > 0 && player.hurt <= 0,
    'a batch must arrive with no grace, hurt ' + player.hurt);

  // A frame that kills the last enemy *and* the player is a death, not a
  // rank-up. Without the guard the mod cards bury the death screen.
  reset();
  player.hp = 1;
  player.hurt = 0;
  const fatal = mob(player.x, player.y, { speed: 0 });
  enemies.push(fatal);
  shot({ vx: 0, maxTravel: 100 });      // already on top of it; no travel needed
  update(1 / 60);
  check(kills === 1 && enemies.length === 0, 'the last enemy must still have died');
  check(screen === 'dead', 'dying on the last kill must show death, not a card: ' + screen);
  check(rank === 0, 'a dive that ends on its last kill grants no rank, rank ' + rank);

  // Arrows move the highlight and wrap; Enter takes the highlighted card.
  // The stubs record which one was applied, so taking the wrong card fails.
  let picked = -1;
  const stubs = () => [0, 1, 2].map(i =>
    ({ name: 'c' + i, desc: '', apply: () => { picked = i; } }));
  screen = 'mods';
  choices = stubs();
  choiceIndex = 1;
  aim.x = 0;                 // cursor parked off the cards, so that hover
  aim.y = 0;                 // cannot steer what the keys are being tested on
  justPressed.add('ArrowRight');
  update(0.016);
  check(choiceIndex === 2, 'right arrow must move the highlight');
  // D and A steer the cards as well as the arrows do -- the hand is already on
  // WASD, and reaching for the arrows to pick a mod is the whole
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
  screen = 'mods';
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
  screen = 'mods';
  choices = stubs();
  choiceIndex = 0;
  update(0.016);
  check(choiceIndex === 0, 'a still cursor must not move the highlight');
  // ...and the offer is left open, for the number-key check below.

  // Pressing its number applies the mod and resumes play.
  const before = player.speed;
  choices = [MODS.find(u => u.name === 'Fins')];
  justPressed.add('Digit1');
  update(0.016);
  check(screen === 'playing' && player.speed > before,
    'picking must apply the mod and resume');

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

  // Click dismisses the help screen, and goes home from the death screen (D66).
  screen = 'help';
  returnTo = 'title';
  justPressed.add('Mouse0');
  update(0.016);
  check(screen === 'title', 'a click must leave the help screen');

  screen = 'dead';
  justPressed.add('Mouse0');
  update(0.016);
  check(screen === 'home', 'a click must go home from the death screen, got ' + screen);

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
  const tough = mob(player.x + 90, player.y, { hp: 9, maxHp: 9, value: 1 });
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
  screen = 'mods';
  choices = [MODS.find(u => u.name === 'Fins')];
  const speedBefore = player.speed;
  // '&' is what an unshifted 1 types on a French AZERTY keyboard.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1' }));
  update(1 / 60);
  check(screen === 'playing' && player.speed > speedBefore,
    'an AZERTY-layout 1 must pick the first mod');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: '&', code: 'Digit1' }));
  keys.clear();

  // --- screens, menus and options ---
  // tap() presses a key for exactly one frame, the way a real press arrives.
  const tap = code => { justPressed.add(code); update(1 / 60); };

  reset();
  diveLive = false;              // between dives: the title offers Start
  screen = 'title'; menuIndex = 0;
  check(MENUS.title.items[0].label === 'Start', 'first title entry is Start');
  tap('Enter');
  check(screen === 'home', 'Start must go home between dives, got ' + screen);
  tap('Enter');
  check(screen === 'playing', 'Dive must begin a dive, got ' + screen);

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

  // Each option changes the thing it claims to. The volume is put back to what
  // the run started with, not to 0.6 -- `?test` boots muted, and restoring a
  // hardcoded 0.6 un-muted the rest of the suite, which is the noise Igor asked
  // to stop. `change()` also plays a sound to preview the new level, so this
  // check is itself a speaker if it leaves the volume up.
  const bootVolume = volume;
  screen = 'options'; optionIndex = 0; volume = 0.6;
  tap('ArrowLeft');
  check(Math.abs(volume - 0.5) < 1e-9, 'volume must go down, got ' + volume);
  tap('ArrowRight'); tap('ArrowRight');
  check(Math.abs(volume - 0.7) < 1e-9, 'volume must go up, got ' + volume);
  volume = bootVolume;
  if (master) master.gain.value = volume;

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
  check(screen === 'home', 'setup: Esc should leave for home');
  for (let i = 0; i < 150; i++) update(1 / 60);
  check(shake === 0, 'home must not inherit a shake, got ' + shake);

  // "off" has to actually mean off, not merely smaller.
  shakeLevel = 0;
  reset();
  enemies.push(mob(player.x + 15, player.y, { speed: 0, hp: 999, maxHp: 999 }));
  update(1 / 60);
  check(shake === 0, 'shake "off" must not shake at all, got ' + shake);
  shakeLevel = 2;

  // A click the menu consumed must not also reach the weapon. The menu reads
  // the edge (justPressed) while the weapon reads the held state (keys), so one
  // physical click was being read twice: clicking Start fired a shot into the
  // dive it had just begun. Since S4 the click is on `home`'s Dive row.
  reset(1);
  screen = 'home';
  menuIndex = 0;
  aim.x = ARENA_W / 2; aim.y = HOME_TOP;      // over the Dive row
  keys.add('Mouse0'); justPressed.add('Mouse0');
  update(1 / 60);                              // the menu takes the click
  check(screen === 'playing', 'setup: clicking Dive must begin a dive, got ' + screen);
  queuePaused = true;
  for (let i = 0; i < 10; i++) update(1 / 60); // ...and the button is still down
  check(bullets.length === 0 && bulletId === 0,
    'a click the menu ate must not fire the weapon, got ' + bulletId + ' shots');

  // Releasing and pressing again is a fresh click, and that one does fire.
  keys.delete('Mouse0');
  update(1 / 60);
  keys.add('Mouse0');
  update(1 / 60);
  check(bulletId === 1, 'a fresh press after release must fire, got ' + bulletId);
  ceaseFire();

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

  // `home` stacks its layer list above its rows and its rows above the hint,
  // both from tables (LAYERS, WEAPONS, EQUIPMENT, ATTRIBUTES). Drawn with every layer shown
  // -- the tallest the list gets -- so a sixth layer or a third gear item fails
  // here rather than running text through text.
  // Read from the layout's own owners: the lines from `MENUS.home.lines`, drawn
  // `HOME_LINE` apart from `HOME_LAYERS_TOP`, the rows from `rowRect()`.
  const metaWas = meta;
  meta = { ...freshMeta(), cleared: LAYERS.length };
  const listEnd = HOME_LAYERS_TOP + (MENUS.home.lines.length - 1) * HOME_LINE;
  const firstRow = rowRect(0, HOME_TOP), lastRow = rowRect(MENUS.home.items.length - 1, HOME_TOP);
  meta = metaWas;
  check(listEnd < firstRow.y - 4,
    'home: the layer list must end above the rows, list ends at ' + listEnd +
    ', rows start at ' + firstRow.y);
  check(lastRow.y + lastRow.h < HINT_Y - 10,
    'home: the rows must end above the hint, rows end at ' + (lastRow.y + lastRow.h) +
    ', hint at ' + HINT_Y);

  // The same rule sideways: a mod description is prose in a fixed-width box, and
  // the renderer centres it, so it cannot notice one running off the edge. Two
  // of them did, and every check passed while the cards were unreadable.
  const widest = widestModDesc();
  check(widest <= CARD_W - CARD_PAD * 2,
    'a mod description must fit its card: widest is ' + Math.round(widest) +
    'px, the card allows ' + (CARD_W - CARD_PAD * 2) + 'px');

  // ...and downwards. The cards grew from 140 to 186 tall when the numbers went
  // on them (D52); another row would put them through the hint below.
  // Read from cardRect(), which owns the card's box, so moving the cards moves
  // this check with them instead of leaving it measuring the old place.
  const cardsEnd = cardRect(0, 3).y + CARD_H;
  check(cardsEnd < MOD_HINT_Y - 10,
    'the mod cards must end above the hint: cards end at ' + cardsEnd +
    ', hint sits at ' + MOD_HINT_Y);

  // ...and sideways is not the only way a card overflows. Every mod must fit
  // inside the rows the card draws, or a number silently falls off the bottom.
  const tooTall = MODS.filter(m => modPreview(m).length > MOD_ROWS);
  check(tooTall.length === 0,
    'a mod must move at most ' + MOD_ROWS + ' stats, over: ' +
    tooTall.map(m => m.name + ' (' + modPreview(m).length + ')').join(','));

  // --- the fixed timestep (D53) ---
  // S1's DoD: "a railgun-speed projectile cannot tunnel a thin enemy at any dt
  // the frame cap allows". A fixed step bounds dt but not bullet *speed*, so
  // the shot is swept like the dash. 6000px/s is 50px per tick against a
  // darter's 10px reach -- a point test flies straight through.
  // +325, not +300: at 6000px/s the bullet samples every 50px from the player,
  // so an enemy at +300 sits *exactly* on a sample and a point test hits it by
  // arithmetic luck. Placed mid-step, halfway between two samples, it is the
  // case that actually tunnels.
  reset();
  queuePaused = true;
  const thin = mob(player.x + 325, player.y, { r: 6, hp: 5, maxHp: 5 });
  enemies.push(thin);
  shot({ vx: 6000, maxTravel: 900 });   // railgun speed: 50px per fixed tick
  for (let i = 0; i < 20 && thin.hp === 5; i++) update(FIXED_DT);
  check(thin.hp === 4, 'a railgun-speed shot must not tunnel a thin enemy, hp=' + thin.hp);

  // A shot's range is the distance it actually covered, at its own speed --
  // not the carried weapon's speed x time, which a faster shot outruns.
  reset();
  queuePaused = true;
  shot({ x: 100, y: 400, vx: 2000, maxTravel: 200 });
  for (let i = 0; i < 40 && bullets.length; i++) update(FIXED_DT);
  check(bullets.length === 0,
    'a fast shot must still die at its own range, not at its weapon\'s speed');

  // The clock banks leftover time rather than stretching a tick to fit the
  // frame. A 60Hz frame is two ticks at 1/120, a 144Hz frame is one or none,
  // and the remainder carries -- which is what makes both simulate the same
  // game. `advanceBy` returns its tick count so this can read it, not infer it.
  reset();
  check(advanceBy(0) === 0, 'no elapsed time must run no ticks');
  check(advanceBy(FIXED_DT * 2) === 2, 'a 60Hz frame must run two ticks at 1/120');
  check(advanceBy(FIXED_DT * 0.6) === 0, 'a part-tick must run nothing yet...');
  check(advanceBy(FIXED_DT * 0.6) === 1, '...and the banked remainder must then fire');
  // The cap is inside advanceBy now, so it is reachable: a frame that claims a
  // whole minute passed must still simulate only MAX_FRAME_DT of it, or coming
  // back to a tab would run the dive forward all at once.
  reset();
  check(advanceBy(MAX_FRAME_DT) === MAX_FRAME_DT / FIXED_DT,
    'a full frame must run its whole budget of ticks');
  reset();
  check(advanceBy(60) === MAX_FRAME_DT / FIXED_DT,
    'a minute away from the tab must still only advance the capped budget');

  // --- the development readout (D52) ---
  // Every stat a mod can move must be on screen, or the readout quietly stops
  // covering the thing that changed. Derived from the mods themselves, so
  // adding a mod that touches a new field fails here rather than going unseen.
  reset();
  // hp/maxHp are the exception: they are the `HP 3/4` on the line above.
  const shown = PLAYER_STATS.map(s => s.stat).concat(['hp', 'maxHp']);
  const unshown = [...new Set(MODS.flatMap(m => modPreview(m).map(c => c.stat)))]
    .filter(k => !shown.includes(k));
  check(unshown.length === 0,
    'every stat a mod changes must be in PLAYER_STATS, missing: ' + unshown.join(','));
  check(PLAYER_STATS.every(s => s.stat in player),
    'every PLAYER_STATS entry must name a real player field: ' +
    PLAYER_STATS.filter(s => !(s.stat in player)).map(s => s.stat).join(','));

  // The preview is computed from `apply`, so it cannot advertise a number the
  // mod does not deliver. Check it against actually taking the mod.
  reset();
  const preview = modPreview(fins);
  fins.apply(player);
  check(preview.length === 1 && preview[0].stat === 'speed' &&
        preview[0].to === player.speed,
    'a mod preview must match what taking it does: previewed ' +
    JSON.stringify(preview) + ', speed is now ' + player.speed);
  // ...and it must not have changed the player just by being previewed.
  reset();
  const speedUnpreviewed = player.speed;
  modPreview(fins);
  check(player.speed === speedUnpreviewed,
    'previewing a mod must not apply it, speed ' + player.speed);

  // Mods are dive-scoped (D34): last dive's picks must not carry into the next.
  modCounts.Fins = 2;
  reset();
  check(Object.keys(modCounts).length === 0,
    'a new dive must start with no mods held, got ' + JSON.stringify(modCounts));

  // ---------- scenarios ----------
  // A scenario must set up exactly what it names and nothing else, or it is not
  // isolation. The load-bearing one is "no new arrivals": without it a scenario
  // is just a normal dive with a head start.
  check(applyScenario('one-drifter'), 'a known scenario must load');
  check(enemies.length === 1, 'one-drifter must place exactly one enemy, got ' + enemies.length);
  check(enemies[0].hp === 1 && enemies[0].r === 9, 'one-drifter must place a drifter');
  check(queuePaused === true, 'a scenario with spawn:false must pause the queue');
  let mostSeen = enemies.length;
  for (let i = 0; i < 900; i++) { update(1 / 60); mostSeen = Math.max(mostSeen, enemies.length); }
  check(mostSeen === 1, 'a paused scenario must never gain an enemy, peaked at ' + mostSeen);

  check(applyScenario('three-types'), 'three-types must load');
  check(enemies.length === 3, 'three-types must place three enemies, got ' + enemies.length);
  check(new Set(enemies.map(e => e.r)).size === 3, 'three-types must place three different types');

  check(applyScenario('late-swarm'), 'late-swarm must load');
  check(batchIndex === 5, 'late-swarm must start deep in the queue, got batch ' + batchIndex);
  check(queuePaused === false, 'a scenario without spawn:false must keep the queue running');
  runAlive(300);
  check(enemies.length > 0 && batchIndex === 6, 'late-swarm must bring a batch');

  check(applyScenario('no-such-scenario') === false, 'an unknown scenario must report failure');

  // advance() is the stepped-mode driver: exactly n ticks, no wall clock at all.
  applyScenario('one-drifter');
  const steppedFrom = elapsed;
  advance(30);
  // Derived from FIXED_DT, not from a hardcoded 1/60: this check asserted the
  // old step size and failed the moment D53 changed it, which is the right
  // failure but the wrong reason to have to edit a test.
  check(Math.abs(elapsed - steppedFrom - 30 * FIXED_DT) < 1e-9,
    'advance(30) must move exactly 30 fixed ticks, moved ' + (elapsed - steppedFrom));

  // ?test is not a scenario, so the frame loop must still run normally here.
  check(stepped === false, '?test must not be stepped');

  // ---------- determinism ----------
  // The same seed must replay the same dive. Every balance number from here on
  // rests on this: without it, comparing two builds compares two different
  // games, which is why the old measurements needed 21 dives per configuration
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
