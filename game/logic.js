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
  enemies.push({ x, y, r: t.r, speed, hp: t.hp, maxHp: t.hp, value: t.value,
                 color: t.color, glow: t.glow, lastHitBy: 0,
                 pushX: 0, pushY: 0,
                 // A lunger's step (D64) and how long it has been on it; the
                 // line it locks, aimX/aimY, is set when it winds up. Chasers
                 // carry these and never touch them.
                 lunge: t.lunge, phase: 'chase', phaseTime: 0 });
}

// Somewhere just outside the view, so arrivals fade in from the dark rather
// than popping into view. In view coordinates; the caller adds the camera.
// The boss rises from below, centred -- Igor, "The boss swims in from the
// bottom" -- before any draw from the seed, so no other arrival moves.
function edgeSpawnPoint(t) {
  const m = 40;
  if (t.enters === 'bottom') return { x: ARENA_W / 2, y: ARENA_H + m + t.r };
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
      const { x, y } = edgeSpawnPoint(type);
      makeEnemy(type, x, cameraY + y, type.speed * (1 - ENEMY_JITTER / 2 + rng() * ENEMY_JITTER));
    }
  }
}

// Places one named enemy at a known spot, at its nominal speed and no jitter.
// A scenario is for watching one thing behave, so it must not vary.
function placeEnemy(name, x, y) {
  const t = enemyType(name);
  if (t) makeEnemy(t, x, y, t.speed);
}

// Where `o` would sit held inside the view, to its own radius: the view is a
// fixed window onto the world, `cameraY` from the top. Returns the pair rather
// than moving `o`, so "is it wholly inside?" is the same call.
function viewClamp(o) {
  return [Math.max(o.r, Math.min(ARENA_W - o.r, o.x)),
          Math.max(cameraY + o.r, Math.min(cameraY + ARENA_H - o.r, o.y))];
}

// ---------- the lunge ----------
// The boss's attack, and the mini-boss's (D64, D65): chase, wind up, charge,
// rest -- then chase again. The wind-up is the tell: the lunger stands and
// swells with its line drawn, and the line is fixed when the wind-up *starts*,
// at where the player was, which is what makes "get out of its line" possible.
// It winds up only wholly inside the view, so the tell is always seen, and from
// then on the view holds it: a charge that left the view would take the fight
// with it. The rest is the opening. Moves the lunger itself, the dash's push
// included.
function lungeStep(e, ux, uy, d, dt) {
  const L = e.lunge;
  e.phaseTime += dt;
  let vx = 0, vy = 0;
  if (e.phase === 'chase') {
    vx = ux * e.speed;
    vy = uy * e.speed;
    const [cx, cy] = viewClamp(e);          // nothing to clamp: wholly inside
    if (e.phaseTime >= L.chase && d < L.reach && cx === e.x && cy === e.y) {
      e.phase = 'windup';
      e.phaseTime = 0;
      e.aimX = ux;
      e.aimY = uy;
    }
  } else if (e.phase === 'windup') {
    if (e.phaseTime >= L.windup) { e.phase = 'charge'; e.phaseTime = 0; }
  } else if (e.phase === 'charge') {
    vx = e.aimX * L.speed;
    vy = e.aimY * L.speed;
  } else if (e.phaseTime >= L.rest) {        // resting: the opening
    e.phase = 'chase';
    e.phaseTime = 0;
  }
  e.x += vx * dt + e.pushX * dt;
  e.y += vy * dt + e.pushY * dt;
  if (e.phase === 'chase') return;
  const [x, y] = viewClamp(e);
  if (e.phase === 'charge' && (x !== e.x || y !== e.y || e.phaseTime * L.speed >= L.reach)) {
    e.phase = 'rest';
    e.phaseTime = 0;
  }
  e.x = x;
  e.y = y;
}

// How far a point is from a line segment. Needed because a fast-moving hitbox
// tested only where it *landed* skips whatever it crossed on the way: the dash
// covers `player.dashSpeed * dt` in a frame, and a bullet `b.speed * dt` —
// neither of which the reach knows about.
// Bullets had the same hole (430px/s is 21.5px on a 20fps frame against a
// darter's 10px reach), and have swept their path too since D53.
// **Squared**, because both callers are per-frame collision loops and the
// bullet one is the hot one -- `dx*dx + dy*dy < r*r` measured 8.3x faster than
// `Math.hypot` over 3.2M pairs, and that rule does not stop applying because
// the shape became a capsule.
function segDistanceSq(px, py, ax, ay, bx, by) {
  const sx = bx - ax, sy = by - ay;
  const len2 = sx * sx + sy * sy;
  // t is how far along the segment the closest point sits, clamped to its ends
  // so the shape is a capsule and not an infinite line.
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * sx + (py - ay) * sy) / len2)) : 0;
  const dx = px - (ax + t * sx), dy = py - (ay + t * sy);
  return dx * dx + dy * dy;
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
  for (let n = 0; n < e.value; n++) {
    gems.push({ x: e.x + (rng() - 0.5) * 18,
                y: e.y + (rng() - 0.5) * 18, r: 4 });
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

// A batch just died. This is the whole of in-dive progression (D34): one rank
// per batch cleared, and the mod offer lands here and nowhere else.
//
// Why here rather than on an XP bar filling: the bar filled mid-fight, which
// meant the offer interrupted combat -- forbidden by D33, and Igor's stated
// requirement rather than a preference. The gate is already a non-combat beat
// that the player earned, so nothing has to be paused to make room for it. It
// also deletes the curve: the tunable is "how many mods per layer", which is
// arithmetic, instead of an income integral.
function clearBatch() {
  // Not at the layer end (D59): the clear of a layer's last batch is not a
  // gate, so it pays nothing -- no rank ("let it stay on 11"), no mods, no Mend.
  // Mods come back only if the player goes on to the next layer, which does not
  // exist yet; how that works is open (ideas.md -> the layer end).
  // Enemies placed by hand -- a scenario's (D37), a check's -- belong to no
  // batch of the plan: they pay a gate's rank and cards, and nothing that
  // belongs to a layer.
  const entry = plan[batchIndex - 1];
  if (entry) {
    // Micro-tasks first, so the layer end's heal cannot read as a clean batch.
    // Each pays once per layer, ever (D36): kept in what persists, not the dive.
    const layer = LAYERS[entry.layer].name;
    for (const t of TASKS) {
      if (meta.tasks[layer]?.[t.name] || !t.met()) continue;
      meta.tasks[layer] = { ...meta.tasks[layer], [t.name]: 1 };
      notice = t.desc + ': ' + t.points + (t.points === 1 ? ' point' : ' points');
      noticeTime = NOTICE_TIME;
    }
    // The layer end is a milestone (D68): a full heal, and the layer counts as
    // cleared at `home` from now on, whatever the rest of the dive does.
    if (entry.end) {
      player.hp = player.maxHp;
      meta.cleared = Math.max(meta.cleared, entry.layer + 1);
    }
  }
  // The last layer's end pays no rank and no mods -- nothing to go on to
  // (D68). The current carries you to the bottom, which is the win.
  if (batchIndex >= plan.length) return;
  rank += 1;
  // A comfort mod is a standing effect rather than a stat, so it acts here.
  if (player.mendOnClear) {
    player.hp = Math.min(player.maxHp, player.hp + player.mendOnClear);
  }
  // The cards do not come up on the same frame as the kill. The last enemy is
  // still bursting -- `killEnemy` throws sparks that live 0.5s -- and dimming
  // the arena over them reads as a jump cut rather than as a reward. The rank
  // is banked now; the offer arrives once the death has played.
  offerTimer = MOD_OFFER_DELAY;
}

// What a mod would actually change, worked out by applying it to a copy of the
// player and diffing the numbers (D52). Derived from `apply` itself rather than
// written on the record, so a card can never advertise a number the mod does
// not deliver, and adding a mod still costs exactly one line.
function modPreview(mod) {
  // A filler -- no `max` -- is not a mod (D69): the gems card pays into the
  // dive, not the player, so "applying it to a copy" would pay for real.
  if (!mod.max) return [];
  const after = { ...player };
  mod.apply(after);
  return Object.keys(after)
    .filter(k => typeof after[k] === 'number' && after[k] !== player[k])
    .map(k => ({ stat: k, from: player[k], to: after[k] }));
}

// The beat is over: roll the mods and hand them over.
function openModOffer() {
  choices = rollMods();     // never empty: the fillers take any card (D69)
  choiceIndex = Math.floor(choices.length / 2);   // start on the middle card
  screen = 'mods';
  sound('rankA');
  sound('rankB');
}

// A mod taken -- from the cards, or from a scenario's kit. Counted, so the
// next roll can refuse it once it is at its max; a filler has no max, is not a
// mod and is never counted (D69).
function takeMod(mod) {
  mod.apply(player);
  if (mod.max) modCounts[mod.name] = (modCounts[mod.name] || 0) + 1;
}

// ---------- home ----------
// Attribute points to spend: what the micro-tasks paid, less what is spent.
// Derived every time, so the two can never disagree (D36).
function points() {
  let earned = 0;
  for (const done of Object.values(meta.tasks)) {
    for (const t of TASKS) if (done[t.name]) earned += t.points;
  }
  return earned - Object.values(meta.spent).reduce((a, b) => a + b, 0);
}

// The next tier's cost, or undefined at the top -- where `canBuy` is false,
// since no bank is `>= undefined`. `home` dims the row by the same test.
const nextCost = g => g.tiers[meta.gear[g.name] || 0];
const canBuy = g => meta.bank >= nextCost(g);

// Both write the save at once: a purchase is never undone by a closed tab.
function buy(g) {
  if (!canBuy(g)) return;
  meta.bank -= nextCost(g);
  meta.gear[g.name] = (meta.gear[g.name] || 0) + 1;
  persist(saveText());
}

function raise(a) {
  if (points() <= 0) return;
  meta.spent[a.name] = (meta.spent[a.name] || 0) + 1;
  persist(saveText());
}

// Death or the win: the dive's gems are banked however it ended (D67), the
// depth it reached is kept, and the dive is gone from the save (D70).
function endDive() {
  meta.bank += currency;
  meta.deepest = Math.max(meta.deepest, cameraY);
  diveLive = false;
  persist(saveText());
}

// Every way onto a menu screen, so none can leave the cursor past the end of
// a shorter menu than the one before.
function openMenu(name) {
  screen = name;
  menuIndex = 0;
}

// ---------- the clock ----------
// The simulation advances in whole FIXED_DT steps and nothing else, whatever
// the display is doing (D53). Leftover time is banked, so a 60Hz screen runs
// two ticks a frame and a 144Hz screen runs one or none, and both simulate the
// same game at the same rate.
//
// Why it matters beyond smoothness: with a variable `dt` every collision test
// samples at a distance that depends on the player's frame rate, so the same
// dive is a different game on a slow machine.
//
// This lives in `game/` rather than in the frame loop because it is a property
// of the *simulation*, not of the browser: `main.js` is rewritten on the port
// and would have to re-derive it, and a check of it there would be a check of
// a throwaway file. Returns the tick count so a check can prove the banking.
let accumulator = 0;

function advanceBy(elapsed) {
  // Capped before it is banked, so time spent in another tab is discarded
  // rather than queued up and simulated all at once.
  accumulator += Math.min(elapsed, MAX_FRAME_DT);
  let ticks = 0;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
    ticks++;
  }
  return ticks;
}

// ---------- the descent ----------
// Batch `k` waits at this depth (D58); `k = plan.length` is the bottom of the
// last layer. The layers stack in one tall strip (D72), so depth keeps adding
// up across them and this needs no layer at all.
function gateDepth(k) {
  return k * GATE_SPACING;
}

// The dive's batches, drawn from its seed (D71): each stretch of each layer
// draws its count from its pool, never the same batch twice. The layer's last
// entry is its end. Called by reset() before anything else draws, so the plan
// is the first thing a seed decides.
function drawPlan() {
  const out = [];
  LAYERS.forEach((layer, l) => {
    for (const s of layer.stretches) {
      for (const batch of drawDistinct(s.pool, s.draw)) out.push({ layer: l, batch });
    }
    out[out.length - 1].end = true;
  });
  return out;
}

// Which layer a depth is in: that of the next batch waiting at or below it,
// or the last layer past the bottom. The renderer asks, for the water's colour
// (D72). Here rather than there, because it is the dive's geometry and ports.
function layerAt(y) {
  return (plan.find((_, k) => gateDepth(k) >= y) ?? plan[plan.length - 1]).layer;
}

// ---------- update ----------
// One wrapper so this-frame's key presses are forgotten afterwards, whichever
// way step() returned.
function update(dt) {
  // Arm the trigger only on a button the player has actually released since
  // gameplay began. Every menu screen disarms it, which covers every route into
  // 'playing' -- the title menu, resuming from pause, backing out of options,
  // taking a mod card -- rather than only the ones we remember to patch.
  if (screen !== 'playing') fireArmed = false;
  else if (!CLICK.some(c => keys.has(c))) fireArmed = true;

  const cameraFrom = cameraY;
  step(dt);
  // The water never stops (D58). Outside step() for the same reason as the
  // shake below: step() returns early on every screen but play, and the water
  // must keep flowing behind the mod cards and under the death and layer-end
  // screens. The menus alone freeze it -- pause is the player stepping out.
  // Its speed eases up while the camera travels and down to a drift otherwise,
  // on a time base, and the background scrolls by `waterY`.
  if (!MENUS[screen] && screen !== 'help' && screen !== 'options') {
    const target = cameraY > cameraFrom ? CURRENT_SPEED : CURRENT_CRAWL;
    current += (target - current) * (1 - Math.pow(CURRENT_EASE, dt));
    waterY += current * dt;
  }
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
  const menu = MENUS[screen];
  if (menu) {
    const items = menu.items;
    const hovered = rowUnder(aim.x, aim.y, items.length, menu.top);
    if (mouseMoved() && hovered >= 0) menuIndex = hovered;
    menuIndex = moveCursor(menuIndex, items.length);

    if (tapped(GO)) items[menuIndex].run();
    else if (tapped(CLICK) && hovered >= 0) items[hovered].run();
    else if (justPressed.has('Escape') && menu.back) menu.back();
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

  // Both ends of a dive take the same keys: eaten, or the last layer won.
  // Either way the gems are already banked (D67), so R diving again at once
  // skips nothing but the shop; everything else goes `home` (D66).
  if (screen === 'dead' || screen === 'won') {
    if (justPressed.has('KeyR')) reset();
    else if (justPressed.has('Escape') || tapped(GO) || tapped(CLICK)) openMenu('home');
    return;
  }

  // Esc pauses from play and from the mod cards alike -- the only two screens
  // that reach this line -- and Resume goes back to whichever it was. Pausing
  // writes the save: it is the moment a dive is most likely put down (D70).
  if (justPressed.has('Escape')) {
    resumeTo = screen;
    openMenu('paused');
    persist(saveText());
    return;
  }

  // Picking a mod. The arena is empty -- this only opens on a cleared batch --
  // so freezing until you choose interrupts nothing (D33).
  if (screen === 'mods') {
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
      takeMod(choices[taken]);
      choices = [];
      screen = 'playing';
    }
    return;
  }

  elapsed += dt;
  if (player.hurt > 0) player.hurt -= dt;
  if (noticeTime > 0) noticeTime -= dt;

  // --- the gate: one batch at a time, and nothing arrives until it is clear ---
  // This replaces the prototype's spawn director (D27). That director grew
  // arrivals as 1/(1.2 - 0.02t) -- hyperbolic -- against power that grew
  // logarithmically, so the queue diverged and death was arithmetically
  // certain. A batch is a *bounded* queue, so that cannot happen.
  // An empty arena *is* the cleared state, so the beat needs no separate flag:
  // the timer simply runs while nothing is alive.
  // `else if`, so a pending offer holding the queue is structural rather than a
  // condition someone can drop: the two phases of the beat cannot both run.
  if (offerTimer > 0) {
    offerTimer -= dt;
    if (offerTimer <= 0) openModOffer();
  } else if (!queuePaused && enemies.length === 0) {
    // Each batch waits at its own depth. Once the last one is cleared, the same
    // arithmetic points one gate further: the bottom of the last layer.
    const target = gateDepth(batchIndex);
    // Only a dive's opening beat counts down now; every later batch waits on
    // the descent instead, which is a beat of its own.
    if (breathTimer > 0) breathTimer -= dt;
    if (cameraY < target) {
      // The current carries the camera down, clamped at the next depth so a
      // batch always finds you *at* it, and carries the player with it --
      // otherwise the view would outrun them and its top edge would drag them
      // like a wall. Swimming moves you within the view, never the view.
      cameraY = Math.min(target, cameraY + current * dt);
      player.y += current * dt;
    }
    else if (breathTimer <= 0) {
      // Past the last batch the target is the bottom of the last layer. The
      // last batch is its boss (D62), so reaching the bottom is the win (D68);
      // the dive is banked at the end of this tick.
      if (batchIndex >= plan.length) screen = 'won';
      else {
        // ponytail: one flat list is one layer, the boss last (D62). A second
        // layer needs not a longer list but the *layer* -- a layer owns its own
        // batch list. So do not grow BATCHES into a tuned multi-layer list;
        // that shape will not exist.
        spawnBatch(plan[batchIndex].batch);
        batchHit = false;
        batchIndex += 1;
      }
    }
  }

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
    player.dashCd = player.dashCooldown;
    player.dashId = ++bulletId;          // one dash hits each enemy once
    player.dashDx = dx;                  // dx/dy are already normalised
    player.dashDy = dy;
    // Invulnerable for the dash plus a moment after, so finishing it inside
    // something you flew through doesn't cost an hp.
    player.hurt = Math.max(player.hurt, DASH_TIME + DASH_GRACE);
    sound('dash');
  }
  // A dash is committed. Travel follows the direction frozen when it started,
  // not the keys held right now -- otherwise mid-dash input steers the lunge,
  // holding the opposite key reverses it (and the wave then faces the way you
  // came, so it hits nothing), and *releasing* the keys stops you dead while
  // `dashTime` runs on, which is a free 0.31s of invulnerability for standing
  // still. Only `dashDx/dashDy` used to be frozen; now the movement is too.
  const dashing = player.dashTime > 0;
  const speed = dashing ? player.dashSpeed : player.speed;
  const mx = dashing ? player.dashDx : dx;
  const my = dashing ? player.dashDy : dy;

  // Where the dash's wave is measured from. Kept before the move and after the
  // clamp is applied below, so the segment is the distance actually travelled
  // rather than the distance asked for.
  const fromX = player.x, fromY = player.y;

  player.x += mx * speed * dt;
  player.y += my * speed * dt;
  // To the view, not the world: the world is a tall strip and the camera moves.
  [player.x, player.y] = viewClamp(player);

  // An afterimage every frame of the dash. Without it the eye sees the player
  // at one end and then the other, and reads a teleport instead of a move.
  if (player.dashTime > 0) {
    spark(player.x, player.y, 0, 0, 0.22, player.r * 0.85, '#bffcff', '#4ff0ff');
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
    // `aim` is in the view (platform's job, D22); the world sits `cameraY`
    // below it. Converted here, where it is read, not once in input.js: aim is
    // only written on mousemove while the camera moves every descent tick, so
    // a world-space aim would go stale under a still cursor -- and the menus
    // and cards hit-test it in view space.
    const ty = aim.y + cameraY - player.y;
    const d = Math.hypot(tx, ty) || 1;   // || 1: cursor exactly on the player
    bullets.push({
      id: ++bulletId,
      x: player.x, y: player.y, r: 4,
      vx: (tx / d) * BULLET_SPEED,
      vy: (ty / d) * BULLET_SPEED,
      speed: BULLET_SPEED,           // its own speed, so range is measured at
                                     // the speed it actually flies (D53)
      pierce: player.pierce,
      travelled: 0,
      maxTravel: player.range,       // the ring means what it says
    });
    player.fireTimer = 1 / player.fireRate;
    sound('shoot');
  }

  // --- move enemies toward the player, and hurt him on contact ---
  // Both of these are the same for every enemy this frame, so they are worked
  // out once rather than per entity -- `pd` the same way the particle drag
  // below already does it.
  const pd = Math.pow(PUSH_DRAG, dt);   // per second, not per frame: a flat
                                        // factor would shove 2.4x further on a
                                        // 144Hz screen
  for (const e of enemies) {
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.sqrt(ex * ex + ey * ey) || 1;   // || 1 avoids dividing by zero

    if (e.lunge) lungeStep(e, ex / d, ey / d, d, dt);   // the boss's kind (D64)
    else {
      e.x += (ex / d) * e.speed * dt + e.pushX * dt;
      e.y += (ey / d) * e.speed * dt + e.pushY * dt;
    }

    e.pushX *= pd;
    e.pushY *= pd;

    // The dash's wave: anything within reach of the line the dash swept this
    // frame, in the direction it is facing.
    //
    // Swept, not sampled at the landing point: a dash moves
    // `player.dashSpeed * dt` per frame, which on a 20fps frame is 44px against
    // a 49px reach — and was 105px back when `Fins` still fed dash speed, so it
    // stepped clean over its own hitbox and connected on 27% of the positions
    // an enemy could occupy. The worst case was an enemy *right next to you*,
    // in front before the step and behind after, so the facing test never saw
    // it in range at all.
    //
    // Facing is judged from where the frame started, for the same reason: an
    // enemy the dash swept through must not count as "behind me" merely because
    // the step overshot it.
    // Everything below is inside the guard on purpose: a dash lasts DASH_TIME
    // out of every `dashCooldown`, so computing the wave for every enemy on
    // every tick throws ~93% of it away -- and `Math.hypot` in this loop is
    // banned outright, which the pre-guard version quietly reintroduced.
    if (dashing && e.lastHitBy !== player.dashId) {
      const dashReach = e.r + DASH_REACH;
      const fx = e.x - fromX, fy = e.y - fromY;
      const dot = fx * player.dashDx + fy * player.dashDy;
      // The facing cone, squared: `dot / |f| > DASH_ARC` is the same question
      // as `dot > 0 && dot^2 > DASH_ARC^2 * |f|^2`, without the square root or
      // the divide. Same 156-degree front, no sqrt in a per-frame loop.
      if (segDistanceSq(e.x, e.y, fromX, fromY, player.x, player.y) < dashReach * dashReach &&
          dot > 0 && dot * dot > DASH_ARC * DASH_ARC * (fx * fx + fy * fy)) {
        e.lastHitBy = player.dashId;
        // The shove is the dash's baseline and is never bought: scattering a
        // crowd is what makes diving into one a play rather than a mistake,
        // and that has to survive `dashDamage` being zero.
        e.pushX = (-ex / d) * DASH_PUSH;   // shoved away from the player
        e.pushY = (-ey / d) * DASH_PUSH;
        burst(e.x, e.y, '#bffcff', '#4ff0ff', 6, 130, 0.3);
        // Damage is bought and starts at zero (D51). The white flash reads as
        // "that hurt", so it must not fire on a dash that only pushed.
        if (player.dashDamage > 0) {
          e.hp -= player.dashDamage;
          e.flash = 0.07;
          if (e.hp <= 0) killEnemy(e);
        }
      }
    }

    if (d < e.r + player.r && player.hurt <= 0 && !immortal) {
      player.hp -= 1;
      player.hurt = player.iframes;
      batchHit = true;
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
    // The bullet's own speed, not BULLET_SPEED. The same today because every
    // bullet flies at BULLET_SPEED, and the DoD's "railgun-speed projectile"
    // is one that will not -- a range counted at the wrong speed gives it the
    // wrong range.
    b.travelled += b.speed * dt;
    if (b.travelled >= b.maxTravel) b.gone = true;
  }

  // --- bullets vs enemies ---
  // ponytail: every bullet against every enemy. Fine to a few hundred of each;
  // if it ever chugs, bucket entities into a grid and only compare neighbours.
  for (const b of bullets) {
    if (b.gone) continue;
    // Where this frame's flight began. Derived rather than stored: the bullet
    // is never clamped, so the start is exactly where the step came from --
    // unlike the player, who is clamped to the arena and therefore needs a
    // remembered `fromX`/`fromY`.
    const ax = b.x - b.vx * dt, ay = b.y - b.vy * dt;
    for (const e of enemies) {
      if (e.gone) continue;
      // Swept against the segment the bullet crossed this frame, not the point
      // it reached — the same defect D50 found in the dash. A fixed timestep
      // bounds the step but does not bound bullet *speed*, and the DoD names a
      // railgun: at 6000px/s a shot covers 50px per tick against a darter's
      // 10px reach and would pass clean through it.
      //
      // Still squared: skipping the square root is 8x faster in the one loop
      // that runs bullets x enemies every frame.
      const reach = e.r + b.r;
      if (segDistanceSq(e.x, e.y, ax, ay, b.x, b.y) < reach * reach) {
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

  // --- gems fly to you, from anywhere, and never fade (D35) ---
  // Nothing can be stranded, so nothing expires: not by the edge of a ring,
  // and not by the descent carrying you away from where they dropped.
  for (const g of gems) {
    const gx = player.x - g.x;
    const gy = player.y - g.y;
    const d = Math.sqrt(gx * gx + gy * gy) || 1;

    g.x += (gx / d) * GEM_PULL * dt;
    g.y += (gy / d) * GEM_PULL * dt;
    if (d < player.r + g.r + 4) {
      g.gone = true;
      sound('gem');
      // Money, not XP (D34). The dive's takings, banked at `home` when the
      // dive ends however it ends (D67).
      currency += 1;
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
  const wasFighting = enemies.length > 0;
  enemies = enemies.filter(e => !e.gone);
  // The batch died this frame. `screen === 'playing'` because a frame can both
  // kill the last enemy and kill the player, and the death screen outranks a
  // rank-up -- without it, dying on the final shot hands you a mod card.
  if (wasFighting && enemies.length === 0 && screen === 'playing') clearBatch();
  bullets = bullets.filter(b => !b.gone);
  gems    = gems.filter(g => !g.gone);
  particles = particles.filter(p => p.life > 0);
  // A dive that ended this tick is banked last, after every gem the tick paid
  // -- a gem caught on the frame you die is yours (D67). Every later tick on
  // the end screen returns early above, so this runs once.
  if (screen === 'dead' || screen === 'won') endDive();
}
