// ===== logic =====
// The simulation. Knows nothing about canvas, audio or the DOM.

// ---------- spawning ----------
function spawnEnemy() {
  const m = 40;                                  // how far outside the arena
  const edge = Math.floor(Math.random() * 4);    // 0 top, 1 right, 2 bottom, 3 left
  let x, y;
  if      (edge === 0) { x = Math.random() * ARENA_W;  y = -m; }
  else if (edge === 1) { x = ARENA_W + m;              y = Math.random() * ARENA_H; }
  else if (edge === 2) { x = Math.random() * ARENA_W;  y = ARENA_H + m; }
  else                 { x = -m;                       y = Math.random() * ARENA_H; }

  // Later arrivals swim faster, so kiting stops working on its own.
  const t = pickEnemyType();
  const speed = t.speed * (1 - ENEMY_JITTER / 2 + Math.random() * ENEMY_JITTER) *
                (1 + elapsed * ENEMY_RAMP);
  enemies.push({ x, y, r: t.r, speed, hp: t.hp, maxHp: t.hp, xp: t.xp,
                 color: t.color, glow: t.glow, lastHitBy: 0 });
}

function spark(x, y, vx, vy, life, r, color, glow) {
  particles.push({ x, y, vx, vy, life, maxLife: life, r, color, glow });
}

// A puff of shrinking sparks thrown in every direction. Purely decorative,
// but it's what makes a kill feel like an event rather than a disappearance.
function burst(x, y, color, glow, count, speed, life = 0.45) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    spark(x, y, Math.cos(a) * s, Math.sin(a) * s, life, 3, color, glow);
  }
}

// Sparks kicked back along the shot, so a hit that doesn't kill still looks
// like it landed.
function hitSparks(e, b) {
  const bs = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
  for (let n = 0; n < 5; n++) {
    const spread = (Math.random() - 0.5) * 1.6;
    const sp = 70 + Math.random() * 90;
    spark(e.x, e.y,
          (-b.vx / bs) * sp + Math.cos(spread) * sp * 0.5,
          (-b.vy / bs) * sp + Math.sin(spread) * sp * 0.5,
          0.22, 2.5, '#ffffff', e.glow);
  }
}

// Closest enemy inside firing range, or null if nothing is close enough.
// Seeding the search with the range does both jobs at once. Compared in
// squared space -- we only need the ordering, never the distance itself.
function nearestEnemy() {
  let best = null, bestSq = player.range * player.range;
  for (const e of enemies) {
    const dx = e.x - player.x, dy = e.y - player.y;
    const sq = dx * dx + dy * dy;
    if (sq < bestSq) { bestSq = sq; best = e; }
  }
  return best;
}

function gainXp() {
  xp += 1;
  if (xp < xpNext) return;
  xp -= xpNext;
  level += 1;
  // Geometric, not linear: XP income compounds as you level, so its cost has to.
  xpNext = Math.round(XP_BASE * Math.pow(XP_GROWTH, level - 1));
  choices = rollUpgrades();
  screen = 'levelup';
  sound('levelA');
  sound('levelB');
}

function pickEnemyType() {
  const open = ENEMY_TYPES.filter(t => elapsed >= t.from);
  const total = open.reduce((sum, t) => sum + t.weight, 0);
  let r = Math.random() * total;
  for (const t of open) { r -= t.weight; if (r <= 0) return t; }
  return open[0];
}

// ---------- update ----------
// One wrapper so this-frame's key presses are forgotten afterwards, whichever
// way step() returned.
function update(dt) {
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
    menuIndex = moveCursor(menuIndex, items.length);
    if (tapped(GO)) items[menuIndex].run();
    else if (justPressed.has('Escape') && screen === 'paused') screen = 'playing';
    return;
  }

  if (screen === 'help') {
    if (justPressed.has('Escape') || tapped(GO)) screen = returnTo;
    return;
  }

  if (screen === 'options') {
    optionIndex = moveCursor(optionIndex, OPTIONS.length);
    if (tapped(LEFT))  OPTIONS[optionIndex].change(-1);
    if (tapped(RIGHT) || tapped(GO)) OPTIONS[optionIndex].change(1);
    if (justPressed.has('Escape')) screen = returnTo;
    return;
  }

  if (screen === 'dead') {
    if (justPressed.has('KeyR')) reset();
    if (justPressed.has('Escape')) { screen = 'title'; menuIndex = 0; }
    return;
  }

  // Picking an upgrade. The whole game is frozen until you choose.
  if (screen === 'levelup') {
    for (let i = 0; i < choices.length; i++) {
      const n = String(i + 1);
      if (justPressed.has('Digit' + n) || justPressed.has('Numpad' + n)) {
        choices[i].apply(player);
        choices = [];
        screen = 'playing';
        break;
      }
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

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;
  player.x = Math.max(player.r, Math.min(ARENA_W - player.r, player.x));
  player.y = Math.max(player.r, Math.min(ARENA_H - player.r, player.y));

  // --- spawn new enemies, faster as time goes on ---
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(SPAWN_FASTEST, SPAWN_FIRST - elapsed * SPAWN_QUICKEN);
  }

  // --- the weapon fires itself at whoever is closest, if anyone is in range ---
  player.fireTimer -= dt;
  if (player.fireTimer <= 0) {
    const target = nearestEnemy();
    if (target) {                      // nothing in range? hold the shot
      const tx = target.x - player.x;
      const ty = target.y - player.y;
      const d = Math.hypot(tx, ty) || 1;
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
  }

  // --- move enemies toward the player, and hurt him on contact ---
  for (const e of enemies) {
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.sqrt(ex * ex + ey * ey) || 1;   // || 1 avoids dividing by zero

    e.x += (ex / d) * e.speed * dt;
    e.y += (ey / d) * e.speed * dt;

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
        if (e.hp <= 0) {
          e.gone = true;
          kills += 1;
          for (let n = 0; n < e.xp; n++) {
            gems.push({ x: e.x + (Math.random() - 0.5) * 18,
                        y: e.y + (Math.random() - 0.5) * 18, r: 4, life: GEM_LIFE });
          }
          burst(e.x, e.y, e.color, e.glow, 12 + e.maxHp * 2, 170 + e.maxHp * 14, 0.5);
          sound('kill', 1 - Math.min(0.4, e.maxHp * 0.04));  // bigger things pop lower
        }
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
