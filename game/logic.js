// ===== logic =====
// The simulation. Knows nothing about canvas, audio or the DOM.

// ---------- spawning ----------
function enemyType(name) {
  const t = ENEMY_TYPES.find(e => e.name === name);
  if (!t) console.error('no such enemy type: ' + name);
  return t;
}

// Builds the record. Speed is passed in rather than derived, because a batch
// arrival wants jitter while a scenario wants one predictable enemy.
function makeEnemy(t, x, y, speed) {
  enemies.push({ x, y, r: t.r, speed, hp: t.hp, maxHp: t.hp, xp: t.xp,
                 color: t.color, glow: t.glow, lastHitBy: 0,
                 pushX: 0, pushY: 0 });
}

// Somewhere just outside the arena, so arrivals fade in from the dark rather
// than popping into view.
function edgeSpawnPoint() {
  const m = 40;
  const edge = Math.floor(rng() * 4);    // 0 top, 1 right, 2 bottom, 3 left
  if (edge === 0) return { x: rng() * ARENA_W, y: -m };
  if (edge === 1) return { x: ARENA_W + m,     y: rng() * ARENA_H };
  if (edge === 2) return { x: rng() * ARENA_W, y: ARENA_H + m };
  return              { x: -m,                 y: rng() * ARENA_H };
}

// Brings in one batch: every enemy it names, at the edge, with the usual speed
// jitter so a batch does not arrive as a drill squad.
function spawnBatch(batch) {
  for (const [name, count] of batch.enemies) {
    const type = enemyType(name);
    if (!type) continue;
    for (let i = 0; i < count; i++) {
      const { x, y } = edgeSpawnPoint();
      makeEnemy(type, x, y, type.speed * (1 - ENEMY_JITTER / 2 + rng() * ENEMY_JITTER));
    }
  }
}

// Places one named enemy at a known spot, at its nominal speed and no jitter.
// A scenario is for watching one thing behave, so it must not vary.
function placeEnemy(name, x, y) {
  const t = enemyType(name);
  if (t) makeEnemy(t, x, y, t.speed);
}

function spark(x, y, vx, vy, life, r, color, glow) {
  particles.push({ x, y, vx, vy, life, maxLife: life, r, color, glow });
}

// A puff of shrinking sparks thrown in every direction. Purely decorative,
// but it's what makes a kill feel like an event rather than a disappearance.
function burst(x, y, color, glow, count, speed, life = 0.45) {
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const s = speed * (0.3 + rng() * 0.7);
    spark(x, y, Math.cos(a) * s, Math.sin(a) * s, life, 3, color, glow);
  }
}

// Sparks kicked back along the shot, so a hit that doesn't kill still looks
// like it landed.
function hitSparks(e, b) {
  const bs = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
  for (let n = 0; n < 5; n++) {
    const spread = (rng() - 0.5) * 1.6;
    const sp = 70 + rng() * 90;
    spark(e.x, e.y,
          (-b.vx / bs) * sp + Math.cos(spread) * sp * 0.5,
          (-b.vy / bs) * sp + Math.sin(spread) * sp * 0.5,
          0.22, 2.5, '#ffffff', e.glow);
  }
}

// One enemy's death, from whatever killed it -- a shot or a dash. Two callers,
// and duplicating the gem drop is how the two paths quietly drift apart.
function killEnemy(e) {
  e.gone = true;
  kills += 1;
  for (let n = 0; n < e.xp; n++) {
    gems.push({ x: e.x + (rng() - 0.5) * 18,
                y: e.y + (rng() - 0.5) * 18, r: 4, life: GEM_LIFE });
  }
  burst(e.x, e.y, e.color, e.glow, 12 + e.maxHp * 2, 170 + e.maxHp * 14, 0.5);
  sound('kill', 1 - Math.min(0.4, e.maxHp * 0.04));  // bigger things pop lower
}

// Mouse hit-testing. The rectangles come from content.js, so the renderer and
// this agree on where things are without either owning the other's layout.
const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

function cardUnder(x, y) {
  for (let i = 0; i < choices.length; i++) {
    if (inRect(cardRect(i, choices.length), x, y)) return i;
  }
  return -1;
}

// Which row of a menu or the options list is under a point, or -1.
function rowUnder(x, y, n, top) {
  for (let i = 0; i < n; i++) if (inRect(rowRect(i, top), x, y)) return i;
  return -1;
}

// Has the mouse actually moved since the last frame? A cursor left resting on
// a row must not overrule the keys every frame. Called once per frame -- every
// screen below returns early, so exactly one caller runs.
function mouseMoved() {
  const moved = aim.x !== lastAimX || aim.y !== lastAimY;
  lastAimX = aim.x;
  lastAimY = aim.y;
  return moved;
}

function gainXp() {
  xp += 1;
  if (xp < xpNext) return;
  xp -= xpNext;
  level += 1;
  // Geometric, not linear: XP income compounds as you level, so its cost has to.
  xpNext = Math.round(XP_BASE * Math.pow(XP_GROWTH, level - 1));
  choices = rollUpgrades();
  choiceIndex = Math.floor(choices.length / 2);   // start on the middle card
  screen = 'levelup';
  sound('levelA');
  sound('levelB');
}

// ---------- update ----------
// One wrapper so this-frame's key presses are forgotten afterwards, whichever
// way step() returned.
function update(dt) {
  // Arm the trigger only on a button the player has actually released since
  // gameplay began. Every menu screen disarms it, which covers every route into
  // 'playing' -- the title menu, resuming from pause, backing out of options,
  // taking a level-up card -- rather than only the ones we remember to patch.
  if (screen !== 'playing') fireArmed = false;
  else if (!CLICK.some(c => keys.has(c))) fireArmed = true;

  step(dt);
  // Outside step(), because step() returns early on every non-playing screen.
  // Dying sets screen = 'dead' in the same frame it sets shake, so decaying
  // inside the gameplay path left the menus rattling forever.
  // Math.pow(_, dt) rather than a per-frame factor, so the fade takes the same
  // time on a 144Hz screen as on a 60Hz one.
  if (shake > 0) {
    shake *= Math.pow(SHAKE_FADE, dt);
    if (shake < SHAKE_FLOOR) shake = 0;      // otherwise it jitters forever
  }
  justPressed.clear();
}

function step(dt) {
  if (screen === 'title' || screen === 'paused') {
    const items = MENUS[screen].items;
    const hovered = rowUnder(aim.x, aim.y, items.length, MENU_TOP);
    if (mouseMoved() && hovered >= 0) menuIndex = hovered;
    menuIndex = moveCursor(menuIndex, items.length);

    if (tapped(GO)) items[menuIndex].run();
    else if (tapped(CLICK) && hovered >= 0) items[hovered].run();
    else if (justPressed.has('Escape') && screen === 'paused') screen = 'playing';
    return;
  }

  if (screen === 'help') {
    if (justPressed.has('Escape') || tapped(GO) || tapped(CLICK)) screen = returnTo;
    return;
  }

  if (screen === 'options') {
    const hovered = rowUnder(aim.x, aim.y, OPTIONS.length, OPTION_TOP);
    if (mouseMoved() && hovered >= 0) optionIndex = hovered;
    optionIndex = moveCursor(optionIndex, OPTIONS.length);

    if (tapped(LEFT))  OPTIONS[optionIndex].change(-1);
    if (tapped(RIGHT) || tapped(GO)) OPTIONS[optionIndex].change(1);
    if (tapped(CLICK) && hovered >= 0) OPTIONS[hovered].change(1);   // same as Enter
    if (justPressed.has('Escape')) screen = returnTo;
    return;
  }

  if (screen === 'dead') {
    if (justPressed.has('KeyR') || tapped(CLICK)) reset();
    if (justPressed.has('Escape')) { screen = 'title'; menuIndex = 0; }
    return;
  }

  // Picking an upgrade. The whole game is frozen until you choose.
  if (screen === 'levelup') {
    const hovered = cardUnder(aim.x, aim.y);
    if (mouseMoved() && hovered >= 0) choiceIndex = hovered;

    if (tapped(LEFT))  choiceIndex = (choiceIndex + choices.length - 1) % choices.length;
    if (tapped(RIGHT)) choiceIndex = (choiceIndex + 1) % choices.length;

    // Confirm: Enter takes the highlighted card, a click takes the one under
    // the cursor, and the number keys still take theirs outright.
    let taken = -1;
    if (tapped(GO)) taken = choiceIndex;
    if (tapped(CLICK) && hovered >= 0) taken = hovered;
    for (let i = 0; i < choices.length; i++) {
      if (justPressed.has('Digit' + (i + 1)) || justPressed.has('Numpad' + (i + 1))) taken = i;
    }

    if (taken >= 0) {
      choices[taken].apply(player);
      choices = [];
      screen = 'playing';
    }
    return;
  }

  if (justPressed.has('Escape')) { screen = 'paused'; menuIndex = 0; return; }

  elapsed += dt;
  if (player.hurt > 0) player.hurt -= dt;

  // --- move the player ---
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  dy += 1;

  // Holding two keys would otherwise move you 1.41x faster diagonally.
  const len = Math.hypot(dx, dy);
  if (len > 0) { dx /= len; dy /= len; }

  // --- the dash ---
  // Only along the keys you are holding: the mouse is where you shoot, which
  // is usually the direction you least want to travel in.
  if (player.dashCd > 0)  player.dashCd -= dt;
  if (player.dashEnd > 0) player.dashEnd -= dt;
  if (player.dashTime > 0) {
    player.dashTime -= dt;
    if (player.dashTime <= 0) player.dashEnd = DASH_END;   // the wave closing
  }
  if (tapped(DASH) && player.dashCd <= 0 && len > 0) {
    player.dashTime = DASH_TIME;
    player.dashCd = DASH_COOLDOWN;
    player.dashId = ++bulletId;          // one dash hits each enemy once
    player.dashDx = dx;                  // dx/dy are already normalised
    player.dashDy = dy;
    // Invulnerable for the dash plus a moment after, so finishing it inside
    // something you flew through doesn't cost an hp.
    player.hurt = Math.max(player.hurt, DASH_TIME + DASH_GRACE);
    sound('dash');
  }
  const speed = player.speed * (player.dashTime > 0 ? DASH_SPEED_MUL : 1);

  player.x += dx * speed * dt;
  player.y += dy * speed * dt;
  player.x = Math.max(player.r, Math.min(ARENA_W - player.r, player.x));
  player.y = Math.max(player.r, Math.min(ARENA_H - player.r, player.y));

  // An afterimage every frame of the dash. Without it the eye sees the player
  // at one end and then the other, and reads a teleport instead of a move.
  if (player.dashTime > 0) {
    spark(player.x, player.y, 0, 0, 0.22, player.r * 0.85, '#bffcff', '#4ff0ff');
  }

  // --- the gate: one batch at a time, and nothing arrives until it is clear ---
  // This replaces the prototype's spawn director (D27). That director grew
  // arrivals as 1/(1.2 - 0.02t) -- hyperbolic -- against power that grew
  // logarithmically, so the queue diverged and death was arithmetically
  // certain. A batch is a *bounded* queue, so that cannot happen.
  // An empty arena *is* the cleared state, so the beat needs no separate flag:
  // the timer simply runs while nothing is alive.
  if (!queuePaused && enemies.length === 0) {
    breathTimer -= dt;
    if (breathTimer <= 0) {
      // ponytail: the list cycles when it runs out. Finishing a layer is S3.
      // What S3 must undo is not the modulo but the *flatness* -- a layer owns
      // its own batch list. So do not grow BATCHES into a tuned 12-entry list
      // on the assumption those 12 are one layer; that shape will not exist.
      spawnBatch(BATCHES[batchIndex % BATCHES.length]);
      batchIndex += 1;
      breathTimer = GATE_PAUSE;
    }
  }

  // --- the weapon fires while you hold the button, along the cursor ---
  // Manual now (D28): the weapon no longer fires itself. The old "hold the shot
  // unless something is inside the ring" rule went with it -- it existed because
  // an automatic weapon would otherwise empty itself into open water, and with a
  // trigger that is the player's call. The ring is still a real range (D8): a
  // shot still dies at `maxTravel`, so firing at nothing still costs you nothing
  // but the cooldown.
  //
  // Clamped at zero rather than run negative, so holding the button gives an
  // honest rate while the *first* click is always instant.
  player.fireTimer = Math.max(player.fireTimer - dt, 0);
  if (player.fireTimer <= 0 && fireArmed && CLICK.some(c => keys.has(c))) {
    const tx = aim.x - player.x;
    const ty = aim.y - player.y;
    const d = Math.hypot(tx, ty) || 1;   // || 1: cursor exactly on the player
    bullets.push({
      id: ++bulletId,
      x: player.x, y: player.y, r: 4,
      vx: (tx / d) * BULLET_SPEED,
      vy: (ty / d) * BULLET_SPEED,
      pierce: player.pierce,
      travelled: 0,
      maxTravel: player.range,       // the ring means what it says
    });
    player.fireTimer = 1 / player.fireRate;
    sound('shoot');
  }

  // --- move enemies toward the player, and hurt him on contact ---
  for (const e of enemies) {
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.sqrt(ex * ex + ey * ey) || 1;   // || 1 avoids dividing by zero

    e.x += (ex / d) * e.speed * dt + e.pushX * dt;
    e.y += (ey / d) * e.speed * dt + e.pushY * dt;

    // Per second, not per frame: a flat factor would shove 2.4x further on a
    // 144Hz screen, the same trap the particle drag fell into.
    const pd = Math.pow(PUSH_DRAG, dt);
    e.pushX *= pd;
    e.pushY *= pd;

    // The dash's wave: anything within reach that the dash is facing. The dot
    // product is the "facing" test -- ex/ey point from the enemy back to the
    // player, so negating them gives the direction the wave has to agree with.
    if (player.dashTime > 0 && e.lastHitBy !== player.dashId && d < e.r + DASH_REACH &&
        (-ex * player.dashDx - ey * player.dashDy) / d > DASH_ARC) {
      e.lastHitBy = player.dashId;
      e.hp -= player.damage;
      e.flash = 0.07;
      e.pushX = (-ex / d) * DASH_PUSH;     // shoved away from the player
      e.pushY = (-ey / d) * DASH_PUSH;
      burst(e.x, e.y, '#bffcff', '#4ff0ff', 6, 130, 0.3);
      if (e.hp <= 0) killEnemy(e);
    }

    if (d < e.r + player.r && player.hurt <= 0) {
      player.hp -= 1;
      player.hurt = IFRAMES;
      shake = SHAKE_HURT * SHAKE_LEVELS[shakeLevel].mul;
      burst(player.x, player.y, '#bffcff', '#4ff0ff', 16, 190, 0.5);
      sound('hurt');
      if (player.hp <= 0) {
        screen = 'dead';
        shake = SHAKE_DEATH * SHAKE_LEVELS[shakeLevel].mul;
        sound('death');
      }
    }
  }

  // --- move bullets; they die at the edge of your range ---
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.travelled += BULLET_SPEED * dt;
    if (b.travelled >= b.maxTravel) b.gone = true;
  }

  // --- bullets vs enemies ---
  // ponytail: every bullet against every enemy. Fine to a few hundred of each;
  // if it ever chugs, bucket entities into a grid and only compare neighbours.
  for (const b of bullets) {
    if (b.gone) continue;
    for (const e of enemies) {
      if (e.gone) continue;
      // Squared compare: a < b is the same question as a*a < b*b for lengths,
      // and skipping the square root here is 8x faster in the one loop that
      // runs bullets x enemies times every frame.
      const dx = e.x - b.x, dy = e.y - b.y, reach = e.r + b.r;
      if (dx * dx + dy * dy < reach * reach) {
        if (e.lastHitBy === b.id) continue;   // a shot hits each enemy at most once
        e.lastHitBy = b.id;
        e.hp -= player.damage;
        e.flash = 0.07;                       // a white frame or two on impact
        hitSparks(e, b);
        if (e.hp <= 0) killEnemy(e);
        if (b.pierce > 0) { b.pierce -= 1; }
        else { b.gone = true; break; }
      }
    }
  }

  // --- gems drift to you when close, fade out if you never come ---
  for (const g of gems) {
    g.life -= dt;
    if (g.life <= 0) { g.gone = true; continue; }

    const gx = player.x - g.x;
    const gy = player.y - g.y;
    const d = Math.sqrt(gx * gx + gy * gy) || 1;

    if (d < player.pickupRange) {
      g.x += (gx / d) * GEM_PULL * dt;
      g.y += (gy / d) * GEM_PULL * dt;
    }
    if (d < player.r + g.r + 4) {
      g.gone = true;
      sound('gem');
      gainXp();
    }
  }

  // --- sparks fly out, slow down and fade ---
  // Drag has to be per second, not per frame: `vx *= 0.92` every frame would
  // slow sparks 2.4x faster on a 144Hz screen than on a 60Hz one.
  const drag = Math.pow(0.06, dt);      // down to 6% of speed each second
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.life -= dt;
  }

  for (const e of enemies) if (e.flash > 0) e.flash -= dt;

  // Sweep up everything marked during this frame. Never remove things from
  // an array while you are still looping over it.
  enemies = enemies.filter(e => !e.gone);
  bullets = bullets.filter(b => !b.gone);
  gems    = gems.filter(g => !g.gone);
  particles = particles.filter(p => p.life > 0);
}
