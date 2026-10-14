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
  enemies.push({ name: t.name, x, y, r: t.r, speed, hp: t.hp, maxHp: t.hp, value: t.value,
                 color: t.color, glow: t.glow, lastHitBy: 0,
                 pushX: 0, pushY: 0, vx: 0, vy: 0,
                 // Its behaviour (`behaviourOf`). Then the step it is on and for
                 // how long, which each behaviour reads its own way -- a lunger
                 // also locks its line, aimX/aimY, as it winds up; chasers
                 // never touch them.
                 ...behaviourOf(t),
                 phase: 'chase', phaseTime: 0 });
}

// Somewhere just outside the view, so arrivals fade in from the dark rather
// than popping into view. In view coordinates; the caller adds the camera.
// The boss rises from below, centred, before any draw from the seed, so no
// other arrival moves.
function edgeSpawnPoint(t) {
  const m = 40 + t.r;                    // past the edge by the whole body
  if (t.enters === 'bottom') return { x: ARENA_W / 2, y: ARENA_H + m };
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

// Water (D107): a body's velocity closes on the one it wants by the same share
// every tick -- RAMP_LEFT of a change still to go after `ramp` seconds -- so a
// start eases up, a release glides and a reversal swings through. Math.pow
// keeps it the same at any tick length. No ramp, no easing: it turns at once.
function ease(b, wantX, wantY, ramp, dt) {
  const k = ramp ? Math.pow(RAMP_LEFT, dt / ramp) : 0;
  b.vx = wantX + (b.vx - wantX) * k;
  b.vy = wantY + (b.vy - wantY) * k;
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
    if (d < e.r + player.r) hurtPlayer();     // the charge is its attack (D108)
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

// ---------- the spit ----------
// The archer's (D95): it closes to its range, backs off inside `near`, and
// holds between. While within range and wholly in the view it spits at where
// the diver is, `every` seconds -- so a shot always comes from a fish you can
// see, and one outside the view comes in first. Backing off never leaves the
// view. `phaseTime` is the time since its last spit.
function spitStep(e, ux, uy, d, dt) {
  const S = e.spit;
  const [cx, cy] = viewClamp(e);
  const seen = cx === e.x && cy === e.y;
  const way = !seen || d > S.range ? 1 : d < S.near ? -1 : 0;
  e.x += ux * e.speed * way * dt + e.pushX * dt;
  e.y += uy * e.speed * way * dt + e.pushY * dt;
  if (way < 0) [e.x, e.y] = viewClamp(e);
  e.phaseTime += dt;
  if (seen && d <= S.range && e.phaseTime >= S.every) {
    e.phaseTime = 0;
    bullets.push({ evil: true, x: e.x, y: e.y, r: S.r, vx: ux * S.speed, vy: uy * S.speed,
                   speed: S.speed, travelled: 0, maxTravel: S.travel });
    sound('spit');
  }
}

// ---------- the fuse ----------
// The puffer's (D95, D106): it chases for at least `chase` seconds; then,
// within `trigger` of the diver and wholly in the view -- so the tell is
// always seen -- it stops and swells for `time` seconds and bursts, costing a
// heart within `blast`, and chases on. The dash's shove still moves it, which
// is the answer to one. It outlives its burst, so a burst pays nothing: only
// a fish you kill does.
function fuseStep(e, ux, uy, d, dt) {
  const F = e.fuse;
  e.phaseTime += dt;
  if (e.phase === 'chase') {
    const [cx, cy] = viewClamp(e);
    if (e.phaseTime >= F.chase && d < F.trigger && cx === e.x && cy === e.y) {
      e.phase = 'fuse';
      e.phaseTime = 0;
    } else {
      e.x += ux * e.speed * dt;
      e.y += uy * e.speed * dt;
    }
  }
  e.x += e.pushX * dt;
  e.y += e.pushY * dt;
  if (e.phase === 'fuse' && e.phaseTime >= F.time) {
    e.phase = 'chase';
    e.phaseTime = 0;
    const bx = player.x - e.x, by = player.y - e.y, reach = F.blast + player.r;
    if (bx * bx + by * by < reach * reach) hurtPlayer();
    burst(e.x, e.y, e.color, e.glow, 24, 260, 0.45);
    sound('pop');
  }
}

// ---------- the bite ----------
// The plain fish's (D108): it chases, eased by its `ramp`, until its body is
// within `reach` of the diver's; then it stops -- easing to a halt, so a heavy
// fish slides -- and holds its jaws open for `windup` seconds, the tell. They
// snap shut on a heart if the diver is still within `reach`, else on water,
// and it chases on, `rest` seconds before it can bite again.
function biteStep(e, ux, uy, d, dt) {
  const B = e.bite;
  e.phaseTime += dt;
  if (e.phase === 'jaws') {
    ease(e, 0, 0, e.ramp, dt);
    if (e.phaseTime >= B.windup) {
      if (d - e.r - player.r <= B.reach) hurtPlayer();
      e.phase = 'rest';
      e.phaseTime = 0;
    }
  } else {
    ease(e, ux * e.speed, uy * e.speed, e.ramp, dt);
    if (e.phase === 'rest' && e.phaseTime >= B.rest) { e.phase = 'chase'; e.phaseTime = 0; }
    if (e.phase === 'chase' && d - e.r - player.r <= B.reach) { e.phase = 'jaws'; e.phaseTime = 0; }
  }
  e.x += (e.vx + e.pushX) * dt;
  e.y += (e.vy + e.pushY) * dt;
}

// ---------- the weave ----------
// The eel's (D95): it closes in like a chaser while swaying across its
// heading, `width` px either side at `rate` sways a second -- so a shot aimed
// where it is misses where it will be. `phaseTime` is the sway's clock, so a
// batch's eels sway in step, as a school.
function weaveStep(e, ux, uy, d, dt) {
  const w = 2 * Math.PI * e.weave.rate;
  const side = e.weave.width * w * Math.cos(w * (e.phaseTime += dt));   // the sway's speed
  e.x += (ux * e.speed - uy * side + e.pushX) * dt;
  e.y += (uy * e.speed + ux * side + e.pushY) * dt;
}

// The one way the diver is hurt -- a bite, a shot, a burst (D95). Nothing while
// the i-frames or the dash's invulnerability run, or while `immortal`;
// otherwise the i-frames, the batch marked as hit for `untouched`, and a heart
// -- or the suit's guard, while it has one left this batch (D100). Returns
// whether it landed, so a shot that did not is not spent.
function hurtPlayer() {
  if (player.hurt > 0 || immortal) return false;
  player.hurt = player.iframes;
  batchHit = true;
  if (guardLeft > 0) {
    guardLeft -= 1;
    burst(player.x, player.y, '#fff1b8', '#ffc400', 14, 170, 0.4);
    sound('guard');
    return true;
  }
  player.hp -= 1;
  shake = SHAKE_HURT * SHAKE_LEVELS[shakeLevel].mul;
  burst(player.x, player.y, '#bffcff', '#4ff0ff', 16, 190, 0.5);
  sound('hurt');
  if (player.hp <= 0) {
    screen = 'dead';
    shake = SHAKE_DEATH * SHAKE_LEVELS[shakeLevel].mul;
    sound('death');
  }
  return true;
}

// How far a point is from a line segment, squared. A fast hitbox tested only
// where it *landed* skips whatever it crossed on the way, so the dash and
// bullets test the segment they swept this frame (D50, D53). Squared, because
// both callers are per-frame collision loops: no square root.
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

// The Knife's cut (D105): everything in the arc toward (ux, uy) at once, no
// shot. A fish counts if its body reaches into the blade's sweep -- out to
// `range` plus the blade's own `shotRadius`, and past the arc's edge by as
// much. Nearest first, pierce + 1 at most. Runs once per pull, so it has no
// per-tick loop to keep squared.
function swing(ux, uy) {
  const half = player.swing.arc * Math.PI / 360;
  const cut = enemies.filter(e => {
    if (e.gone) return false;
    const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
    const body = e.r + player.shotRadius;
    if (d > player.range + body) return false;
    const off = Math.acos(Math.max(-1, Math.min(1, (dx * ux + dy * uy) / (d || 1))));
    return d <= body || off <= half + Math.asin(Math.min(1, body / d));
  }).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
    .slice(0, player.pierce + 1);
  for (const e of cut) {
    e.hp -= player.damage;
    e.flash = 0.07;
    hitSparks(e, { vx: ux, vy: uy });
    if (e.hp <= 0) killEnemy(e);
  }
  player.swingLeft = player.swing.time;      // what the renderer draws
  player.swingX = ux;
  player.swingY = uy;
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

// One enemy's death, from whatever killed it -- a shot, a swing or a dash.
// Three callers, and duplicating the gem drop is how the paths quietly drift
// apart.
function killEnemy(e) {
  e.gone = true;
  kills += 1;
  for (let n = 0; n < e.value; n++) {
    gems.push({ x: e.x + (rng() - 0.5) * 18,
                y: e.y + (rng() - 0.5) * 18, r: 4 });
  }
  if (e.carrier) dropMod(e);
  // A boost, perhaps (D86): the chance is BOOST_C for every kill since the last
  // one dropped, so it grows until it is certain. Never from the kill that
  // empties the arena -- it would only fade behind you while the current
  // carried you on -- though that kill still counts toward the next.
  sinceBoost += 1;
  if (enemies.some(x => !x.gone) && rng() < BOOST_C * sinceBoost) {
    drops.push({ x: e.x, y: e.y, r: 6, boost: drawDistinct(BOOSTS, 1)[0].name, life: BOOST_LIFE });
    sinceBoost = 0;
  }
  burst(e.x, e.y, e.color, e.glow, 12 + e.maxHp * 2, 170 + e.maxHp * 14, 0.5);
  sound('kill', 1 - Math.min(0.4, e.maxHp * 0.04));  // bigger things pop lower
}

// ---------- what kills drop besides gems (D84, D86) ----------
// The batch's mod, where its glowing fish died. It flies to you like a gem and
// never fades: it is yours for the dive.
function dropMod(e) {
  drops.push({ x: e.x, y: e.y, r: 7, mod: drawCarried().name });
}

// A batch of the plan has just arrived: one of its fish glows from the start
// and carries the batch's mod (D84, D88) -- never a boss or a mini-boss, whose
// type says `carries: false`, and none once every ordinary mod is capped.
function light() {
  const can = enemies.filter(e => enemyType(e.name).carries !== false);
  if (can.length && carriable().length) drawDistinct(can, 1)[0].carrier = true;
}

// A mod reaching you: taken, and named on the pickup line with what it
// changed -- the numbers stay in sight, as on the cards (D52).
function collectMod(name) {
  const m = MODS.find(x => x.name === name);
  const moved = modPreview(m);
  takeMod(m);
  banner = m.name + ' \u2014 ' + m.desc + moved.map(c =>
    '   ' + c.stat + ' ' + +c.from.toFixed(2) + ' \u2192 ' + +c.to.toFixed(2)).join('');
  bannerTime = NOTICE_TIME;
  sound('modA');
  sound('modB');
}

// A boost touched: its numbers go on, and come off when its time runs out.
// Touched again while it runs, its clock restarts and nothing more is added.
function startBoost(name) {
  const b = BOOSTS.find(x => x.name === name);
  const on = boosts.find(x => x.name === name);
  if (on) on.left = b.time;
  else {
    for (const k in b.add) player[k] += b.add[k];
    boosts.push({ name, left: b.time });
  }
  banner = b.name + ' \u2014 ' + b.desc;
  bannerTime = NOTICE_TIME;
  sound('boost');
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
// a row must not overrule the keys every frame. Every screen with a cursor --
// the menus, options, the layer end's cards -- calls it once a frame.
function mouseMoved() {
  const moved = aim.x !== lastAimX || aim.y !== lastAimY;
  lastAimX = aim.x;
  lastAimY = aim.y;
  return moved;
}

// A batch just died: pay the micro-tasks and Mend, and at a layer end the heal
// and the pick of valuable mods (D85) -- the dive's one pause. A gate's own mod
// rode in on its glowing fish (D84).
function clearBatch() {
  // The batch just cleared is the plan's entry before `batchIndex`. Enemies
  // placed by hand before the first batch -- a scenario's (D37) -- have none:
  // they pay Mend, and nothing that belongs to a layer.
  const entry = plan[batchIndex - 1];
  if (entry) {
    // Micro-tasks first, so the layer end's heal cannot read as a clean batch.
    // Each pays once per layer, ever (D36): kept in what persists, not the
    // dive, under the layer's number -- its name is a placeholder (D89).
    const layer = entry.layer;
    for (const t of TASKS) {
      if (meta.tasks[layer]?.[t.name] || !t.met(entry)) continue;
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
  // The last layer's end pays no pick and no Mend -- nothing to go on to
  // (D59, narrowed by D68). The current carries you to the bottom, the win.
  if (batchIndex >= plan.length) return;
  // A comfort mod is a standing effect rather than a stat, so it acts here.
  if (player.mendOnClear) {
    player.hp = Math.min(player.maxHp, player.hp + player.mendOnClear);
  }
  // The layer end's cards do not come up on the same frame as the kill. The
  // boss is still bursting -- `killEnemy` throws sparks that live 0.5s -- and
  // dimming the arena over them reads as a jump cut rather than as a reward;
  // the offer arrives once the death has played (D51).
  if (entry && entry.end) offerTimer = MOD_OFFER_DELAY;
}

// What a mod would actually change, worked out by applying it to a copy of the
// player and diffing the numbers (D52). Derived from `apply` itself rather than
// written on the record, so a card can never advertise a number the mod does
// not deliver, and adding a mod still costs exactly one line.
// `n` picks of it at once: a layer end's card gives an ordinary mod at the
// bigger step (D85), and its numbers say so. `base` is the diver it is worked
// out on: the one in play, or the debug setup's (D102) before any dive.
function modPreview(mod, n = 1, base = player) {
  const after = { ...base };
  for (let i = 0; i < n; i++) mod.apply(after);
  return Object.keys(after)
    .filter(k => typeof after[k] === 'number' && after[k] !== base[k])
    .map(k => ({ stat: k, from: base[k], to: after[k] }));
}

// The beat is over: deal the layer end's cards (D85), the middle one marked.
// With every mod capped there are none, and Continue alone goes on.
function openModOffer() {
  choices = rollValuable();
  choiceIndex = Math.floor(choices.length / 2);
  screen = 'mods';
  sound('modA');
  sound('modB');
}

// A mod taken -- carried in by a fish, from a layer end's card, or from a
// scenario's kit. Counted, so the draws can refuse it once it is at its max.
function takeMod(mod) {
  mod.apply(player);
  modCounts[mod.name] = (modCounts[mod.name] || 0) + 1;
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
const nextCost = g => g.tiers[meta.gear[g.name] || 0]?.cost;
const canBuy = g => meets(g) && meta.bank >= nextCost(g);
// Whether the points spent on each attribute a piece of gear requires reach
// it (D36, D98): scheduling, not scaling -- it changes when, never how much.
const meets = g => Object.entries(g.requires || {}).every(([a, n]) => (meta.spent[a] || 0) >= n);

// A weapon's row at `home` (D97): owning one costs its gems and carries it at
// once, one owned is carried for nothing, and the one carried raises its tier.
// Every write saves at once: a purchase is never undone by a closed tab.
const canOwn = w => meets(w) && meta.bank >= w.cost;
function pickWeapon(w) {
  if (meta.carried === w.name) return buy(w);
  if (!meta.owned.includes(w.name)) {
    if (!canOwn(w)) return;
    meta.bank -= w.cost;
    meta.owned.push(w.name);
  }
  meta.carried = w.name;
  saveNow();
}

function buy(g) {
  if (!canBuy(g)) return;
  meta.bank -= nextCost(g);
  meta.gear[g.name] = (meta.gear[g.name] || 0) + 1;
  saveNow();
}

function raise(a) {
  if (points() <= 0) return;
  meta.spent[a.name] = (meta.spent[a.name] || 0) + 1;
  saveNow();
}

// Death or the win: the dive's gems are banked however it ended (D67), the
// depth it reached is kept, and the dive is gone from the save (D70).
function endDive() {
  meta.bank += currency;
  meta.deepest = Math.max(meta.deepest, cameraY);
  diveLive = false;
  menuIndex = END_MENU.items.indexOf(GO_HOME);   // the end screen opens on Go home (D90)
  saveNow();
}

// Every save goes through here, the platform's own too -- the tab hidden, the
// page closed -- since game/ decides when (D77). Never in the debug mode
// (D102): its meta is the setup's, and the save on disk is the player's.
function saveNow() {
  if (!debugSetup) persist(saveText());
}

// Every way onto a menu screen, so none can leave the cursor past the end of
// a shorter menu than the one before.
function openMenu(name) {
  screen = name;
  menuIndex = 0;
}

// A new game (D103): what persists and any dive under way, gone for good --
// the save written fresh, which is what clearing it means here -- then
// `home`, as on a first launch.
function newGame() {
  meta = freshMeta();
  diveLive = false;
  saveNow();
  openMenu('home');
}

// ---------- the debug mode ----------
// `?debug` (D102) opens its setup screen in place of the title, on a fresh
// meta and muted until M: main.js reads no save for it, and `saveNow()` writes
// none. `code` is a setup's, from the URL -- empty for a bare `?debug`.
function openDebug(code, seed) {
  debugSetup = parseSetup(code, seed);
  meta = freshMeta();
  diveLive = false;
  muted = true;
  openMenu('debug');
}

// A setup as text, for the address bar and an issue: tokens of a name and a
// number -- a name's spaces as underscores -- and two flags, comma-separated.
// The layer, gate, seed and the weapon carried are always written, the rest
// only when set: `L2,G7,S4471,Harpoon2,puffer4,Dash_reach1,immortal`.
function setupCode(s = debugSetup) {
  const token = (name, n) => name.replace(/ /g, '_') + n;
  return ['L' + (s.layer + 1), 'G' + (s.gate + 1), 'S' + s.seed,
          token(s.weapon, s.counts[s.weapon] || 0),
          ...DEBUG_COUNTS.filter(c => c.col !== undefined && s.counts[c.name] > 0)
                         .map(c => token(c.name, s.counts[c.name])),
          ...(s.immortal ? ['immortal'] : []), ...(s.oneShot ? ['oneshot'] : [])].join(',');
}

// The reverse, from whatever the URL holds. What it cannot name -- a typo, a
// record renamed since -- is kept in `ignored` and shown, never guessed at,
// and every number is held in range. Without an `S`, the seed given or a
// fresh one.
function parseSetup(code, seed = newSeed()) {
  const s = { layer: 0, gate: 0, seed, immortal: false, oneShot: false,
              weapon: WEAPONS[0].name, counts: {}, ignored: [] };
  for (const token of (code || '').split(',').filter(Boolean)) {
    const [, word, digits] = token.match(/^(.*?)(\d*)$/);
    const name = word.replace(/_/g, ' '), n = Number(digits);
    if (token === 'immortal') s.immortal = true;
    else if (token === 'oneshot') s.oneShot = true;
    else if (!digits) s.ignored.push(token);
    else if (name === 'L') s.layer = n - 1;
    else if (name === 'G') s.gate = n - 1;
    else if (name === 'S') s.seed = n >>> 0;
    else if (DEBUG_COUNTS.some(c => c.name === name)) {
      s.counts[name] = n;
      if (WEAPONS.some(w => w.name === name)) s.weapon = name;
    }
    else s.ignored.push(token);
  }
  return clampSetup(s);
}

// Every number of a setup held in range: a layer that exists, a gate in it,
// and each count between nothing and its cap.
function clampSetup(s) {
  const within = (n, max) => Math.max(0, Math.min(max, n));
  s.layer = within(s.layer, LAYERS.length - 1);
  s.gate = within(s.gate, gatesIn(s.layer) - 1);
  for (const c of DEBUG_COUNTS) if (c.name in s.counts) s.counts[c.name] = within(s.counts[c.name], c.max);
  return s;
}

// A setup row's step (D102): at one end, a step past it comes round to the
// other; anywhere else it moves, and stops at the end -- so Shift's five reach
// the end before they come round.
function wrapStep(n, d, max) {
  if (d < 0 && n <= 0) return max;
  if (d > 0 && n >= max) return 0;
  return Math.max(0, Math.min(max, n + d));
}

// How many gates a layer has: what its stretches draw, each held to its pool.
function gatesIn(l) {
  return LAYERS[l].stretches.reduce((n, st) => n + Math.min(st.draw, st.pool.length), 0);
}

// The setup's own batch, `[type, count]` like any other, in the table's order;
// empty when no fish is set, and the gate brings what it drew.
function setupFish(s) {
  return ENEMY_TYPES.filter(e => s.counts[e.name] > 0).map(e => [e.name, s.counts[e.name]]);
}

// The setup screen's line under its columns: what the chosen gate drew on this
// seed, and the fish set in its place. It draws the plan as a dive does, which
// reseeds the randomness -- harmless here, since every dive reseeds it.
function gateLine() {
  const s = debugSetup, fish = setupFish(s);
  seedRng(s.seed);
  const drawn = drawPlan();
  const list = batch => batch.map(([name, n]) => n + ' ' + name).join(', ');
  return LAYERS[s.layer].name + ', gate ' + (s.gate + 1) + ': ' +
         list(drawn[drawn.findIndex(e => e.layer === s.layer) + s.gate].batch.enemies) +
         (fish.length ? '   →   in its place: ' + list(fish) : '');
}

// The setup's tips (D102): the line under its columns for the marked row --
// what the row is, and what a piece moves. Worked out from the records and
// their `apply`, as the mod cards' numbers are (D52), so a tip cannot tell a
// number the game does not deliver; counted on the diver a dive starts with,
// carrying the setup's weapon.
const signed = n => (n < 0 ? '-' : '+') + +Math.abs(n).toFixed(2);
function moves(apply, w = WEAPONS.find(x => x.name === debugSetup.weapon)) {
  return modPreview({ apply }, 1, { ...PLAYER_START, ...shotOf(w) })
    .map(c => c.stat + ' ' + signed(c.to - c.from)).join(', ');
}
const needsLine = g => (g.requires ? '   owning it needs ' +
  Object.entries(g.requires).map(([a, n]) => a + ' ' + n).join(', ') : '');
function fishTip(e) {
  const kind = Object.keys(e).find(k => typeof e[k] === 'object');
  return e.name + ': ' + DEBUG_BEHAVIOURS[kind || 'chase'] +
         (e.enters === 'bottom' ? '; rises from below' : '') +
         (e.carries === false ? '; never glows, so carries no mod' : '') +
         (e.touch ? '; hurts to touch' : '') +
         '   hp ' + e.hp + ' \u00b7 speed ' + e.speed + ' \u00b7 ' + e.value + (e.value === 1 ? ' gem' : ' gems');
}
// Tier by tier -- or once, when every tier moves the same.
function tiersTip(g, w) {
  const each = g.tiers.map(t => moves(t.apply, w));
  return each.every(m => m === each[0]) ? each[0] + ' a tier, ' + each.length + ' tiers'
                                        : each.map((m, i) => 'tier ' + (i + 1) + ': ' + m).join('  \u00b7  ');
}
function gearTip(g) {
  return g.name + ': ' + tiersTip(g) + needsLine(g);
}
function pointTip(a) {
  const by = [...WEAPONS, ...EQUIPMENT].filter(g => g.requires?.[a.name]);
  return a.name + ': ' + moves(a.apply) + ' a point' +
         by.map(g => '   owning the ' + g.name + ' needs ' + g.requires[a.name]).join('');
}
function modTip(m) {
  const only = m.weapons && ' the ' + m.weapons.join(' or the ');
  return m.name + ': ' + m.desc + ' \u2014 ' +
         moves(m.apply, m.weapons ? WEAPONS.find(w => w.name === m.weapons[0]) : undefined) +
         ' a pick, up to ' + m.max +
         (!only ? '' : m.weapons.includes(debugSetup.weapon) ? '   with' + only + ' only' : '   carry' + only + ' to take it') +
         (m.end ? "   a layer end's own" : '');
}
function weaponTip(w) {
  return w.name + ': ' + Object.entries(shotOf(w)).map(([k, v]) => k + ' ' + v).join(' \u00b7 ') + needsLine(w);
}
function weaponTiersTip(w) {
  return w.name + "'s " + tiersTip(w, w);
}

// The setup, played: from its screen, and by R or Again from any. Its kit
// stands in for what persists -- a fresh meta holding the setup's gear and
// points -- so reset() applies them exactly as a dive from home would. Its
// fish take the gate's place in a copy of the plan's entry, never in the pool
// the entry was drawn from.
function debugDive() {
  const s = debugSetup, n = name => s.counts[name] || 0;
  const weapon = WEAPONS.find(w => w.name === s.weapon);
  meta = { ...freshMeta(), carried: weapon.name, owned: WEAPONS.map(w => w.name),
           gear: Object.fromEntries([weapon, ...EQUIPMENT].map(g => [g.name, n(g.name)])),
           spent: Object.fromEntries(ATTRIBUTES.map(a => [a.name, n(a.name)])) };
  immortal = s.immortal;
  damageOverride = s.oneShot ? ONE_SHOT : 0;
  startScenario({
    batch: drawn => drawn.findIndex(e => e.layer === s.layer) + s.gate,
    // A weapon mod only with a weapon it fits (D99), as a fish carries it.
    kit: MODS.filter(m => !m.weapons || m.weapons.includes(weapon.name))
             .flatMap(m => Array(n(m.name)).fill(m.name)),
  }, s.seed);
  const fish = setupFish(s);
  if (fish.length) plan[batchIndex] = { ...plan[batchIndex], batch: { enemies: fish } };
}

// ---------- the clock ----------
// The simulation advances in whole FIXED_DT steps and nothing else, whatever
// the display is doing (D53): leftover time is banked, so every machine
// simulates the same game -- with a variable `dt`, every collision test would
// sample at a distance set by the frame rate. In `game/` rather than the frame
// loop because it is the simulation's, and ports. Returns the tick count so a
// check can prove the banking.
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
  // gameplay began. Every non-playing screen disarms it, which covers every
  // route into 'playing' rather than only the ones we remember to patch.
  if (screen !== 'playing') fireArmed = false;
  else if (!CLICK.some(c => keys.has(c))) fireArmed = true;

  const cameraFrom = cameraY;
  step(dt);
  // The water never stops (D58). Outside step(), which returns early on every
  // screen but play: the water keeps flowing behind the layer end's cards and
  // under the end screens. Menus freeze it, except a menu that `flows` -- pause
  // is the player stepping out. Its speed eases up while the camera travels and
  // down to a drift otherwise, and the background scrolls by `waterY`.
  if ((!MENUS[screen] || MENUS[screen].flows) && screen !== 'help' && screen !== 'options') {
    const target = cameraY > cameraFrom ? CURRENT_SPEED : CURRENT_CRAWL;
    current += (target - current) * (1 - Math.pow(CURRENT_EASE, dt));
    waterY += current * dt;
  }
  // Outside step() for the same reason: a death sets the shake on its last
  // playing tick, and it must still settle on the screens after. Math.pow(_, dt)
  // rather than a per-frame factor, so the fade takes the same time at any
  // frame rate.
  if (shake > 0) {
    shake *= Math.pow(SHAKE_FADE, dt);
    if (shake < SHAKE_FLOOR) shake = 0;      // otherwise it jitters forever
  }
  justPressed.clear();
}

function step(dt) {
  // The debug mode's two keys, on every screen (D102): the same setup again --
  // on its own screen, the first time -- and back to that screen.
  if (debugSetup && tapped(DEBUG_AGAIN)) return debugDive();
  if (debugSetup && tapped(DEBUG_SETUP) && screen !== 'debug') return openMenu('debug');

  const menu = MENUS[screen];
  if (menu) {
    const items = menu.items;
    const hovered = items.findIndex((_, i) => inRect(rectOf(menu, i), aim.x, aim.y));
    if (mouseMoved() && hovered >= 0) menuIndex = hovered;
    menuIndex = moveCursor(menuIndex, items.length);

    // A row holding a value moves with the arrows, five at a time with Shift;
    // Enter steps it up, and a click steps it toward the side clicked.
    const item = items[menuIndex], by = FAST.some(k => keys.has(k)) ? 5 : 1;
    if (item.change && tapped(LEFT)) item.change(-by);
    else if (item.change && tapped(RIGHT)) item.change(by);
    else if (tapped(GO)) item.run ? item.run() : item.change(by);
    else if (tapped(CLICK) && hovered >= 0) {
      const h = items[hovered], d = h.change && clickStep(rectOf(menu, hovered), aim.x);
      if (!h.change) h.run();
      else if (d) h.change(d * by);
    }
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

  // Esc pauses from play and from the mod cards alike -- the only two screens
  // that reach this line -- and Resume goes back to whichever it was. Pausing
  // writes the save: it is the moment a dive is most likely put down (D70).
  if (justPressed.has('Escape')) {
    resumeTo = screen;
    openMenu('paused');
    saveNow();
    return;
  }

  // The layer end's pick (D85). The arena is empty -- the boss is dead -- so
  // holding play until you choose interrupts nothing (D33). A card is marked by
  // a click, its number or the arrows, and you can switch; Continue, or Enter,
  // takes the marked one and the current carries you on. A cursor passing over
  // a card marks nothing: on its way down to Continue it crosses the cards.
  if (screen === 'mods') {
    const n = choices.length;
    if (n && tapped(LEFT))  choiceIndex = (choiceIndex + n - 1) % n;
    if (n && tapped(RIGHT)) choiceIndex = (choiceIndex + 1) % n;
    // Read every frame though it marks nothing here: a cursor resting where
    // the pick left it must not read as moved on the next menu's first frame.
    mouseMoved();
    const clicked = tapped(CLICK);
    const hovered = cardUnder(aim.x, aim.y);
    if (clicked && hovered >= 0) choiceIndex = hovered;
    for (let i = 0; i < n; i++) {
      if (justPressed.has('Digit' + (i + 1)) || justPressed.has('Numpad' + (i + 1))) choiceIndex = i;
    }
    if (tapped(GO) || (clicked && inRect(continueRect(), aim.x, aim.y))) {
      const m = choices[choiceIndex];
      if (m) for (let k = 0; k < cardStep(m); k++) takeMod(m);
      choices = [];
      screen = 'playing';
    }
    return;
  }

  elapsed += dt;
  batchTime += dt;
  if (player.hurt > 0) player.hurt -= dt;
  if (noticeTime > 0) noticeTime -= dt;
  if (bannerTime > 0) bannerTime -= dt;
  // Boosts run on play's clock: the pause and the layer end's pick hold them,
  // since every other screen returns above (D86).
  for (const a of boosts) {
    a.left -= dt;
    if (a.left > 0) continue;
    const add = BOOSTS.find(x => x.name === a.name).add;
    for (const k in add) player[k] -= add[k];
    a.gone = true;
  }
  boosts = boosts.filter(a => !a.gone);

  // --- the gate: one batch at a time, and nothing arrives until it is clear ---
  // (D27). An empty arena *is* the cleared state, so the beat needs no flag of
  // its own. `else if`, so a pending offer holding the queue is structural
  // rather than a condition someone can drop.
  if (offerTimer > 0) {
    offerTimer -= dt;
    if (offerTimer <= 0) openModOffer();
  } else if (!queuePaused && enemies.length === 0) {
    // Each batch waits at its own depth. Once the last one is cleared, the same
    // arithmetic points one gate further: the bottom of the last layer.
    const target = gateDepth(batchIndex);
    // Only a dive's opening beat counts down; every later batch waits on the
    // descent instead, which is a beat of its own.
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
        spawnBatch(plan[batchIndex].batch);
        light();
        batchHit = false;
        guardLeft = player.guard;
        batchTime = 0;
        batchDashed = false;
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

  // The body turns toward the keys held, the shorter way round, `turn`
  // seconds a half circle, and holds its facing when they are let go (D107).
  if (len > 0) {
    const want = Math.atan2(dy, dx) - player.facing;
    const gap = Math.atan2(Math.sin(want), Math.cos(want));
    const step = Math.PI / player.turn * dt;
    const f = player.facing + Math.max(-step, Math.min(step, gap));
    player.facing = Math.atan2(Math.sin(f), Math.cos(f));
  }

  // --- the dash ---
  // Along the facing (D107): where you swim, or from a standstill where you
  // last faced -- never the mouse, which is where you shoot, usually the way
  // you least want to travel.
  if (player.dashCd > 0)  player.dashCd -= dt;
  if (player.dashEnd > 0) player.dashEnd -= dt;
  if (player.dashTime > 0) {
    player.dashTime -= dt;
    if (player.dashTime <= 0) player.dashEnd = DASH_END;   // the wave closing
  }
  if (tapped(DASH) && player.dashCd <= 0) {
    player.dashTime = DASH_TIME;
    player.dashCd = player.dashCooldown;
    player.dashId = ++bulletId;          // one dash hits each enemy once
    player.dashDx = Math.cos(player.facing);
    player.dashDy = Math.sin(player.facing);
    // Invulnerable for the dash plus a moment after, so finishing it inside
    // something you flew through doesn't cost an hp.
    player.hurt = Math.max(player.hurt, DASH_TIME + DASH_GRACE);
    batchDashed = true;
    sound('dash');
  }
  // A dash is committed (D56). Travel follows the direction frozen when it
  // started, not the keys held now -- otherwise mid-dash input steers it,
  // holding the opposite key reverses it (and the wave then faces the way you
  // came), and *releasing* the keys stops you dead while `dashTime` runs on:
  // free invulnerability for standing still.
  // Out of it, the swim carries on along it at full swim speed (D107).
  const dashing = player.dashTime > 0;
  if (dashing) {
    player.vx = player.dashDx * player.speed;
    player.vy = player.dashDy * player.speed;
  } else {
    ease(player, dx * player.speed, dy * player.speed, player.ramp, dt);
  }

  // Where the dash's wave is measured from. Kept before the move and after the
  // clamp is applied below, so the segment is the distance actually travelled
  // rather than the distance asked for.
  const fromX = player.x, fromY = player.y;

  player.x += (dashing ? player.dashDx * player.dashSpeed : player.vx) * dt;
  player.y += (dashing ? player.dashDy * player.dashSpeed : player.vy) * dt;
  // To the view, not the world: the world is a tall strip and the camera moves.
  // An edge stops the swim going into it, so no speed banks up against it
  // (D107). No edge ever pushes: the current carries the diver with the view.
  const [cx, cy] = viewClamp(player);
  if (cx !== player.x) player.vx = 0;
  if (cy !== player.y) player.vy = 0;
  [player.x, player.y] = [cx, cy];

  // An afterimage every frame of the dash. Without it the eye sees the player
  // at one end and then the other, and reads a teleport instead of a move.
  if (player.dashTime > 0) {
    spark(player.x, player.y, 0, 0, 0.22, player.r * 0.85, '#bffcff', '#4ff0ff');
  }

  // --- the weapon fires while you hold the button, along the cursor (D28) ---
  // A shot dies at `maxTravel`: the ring is a real range (D8). The cooldown is
  // clamped at zero rather than run negative, so holding the button gives an
  // honest rate while the *first* click is always instant.
  player.fireTimer = Math.max(player.fireTimer - dt, 0);
  if (player.swingLeft > 0) player.swingLeft -= dt;
  if (player.fireTimer <= 0 && fireArmed && CLICK.some(c => keys.has(c))) {
    const tx = aim.x - player.x;
    // `aim` is in the view (platform's job, D22); the world sits `cameraY`
    // below it. Converted here, where it is read, not once in input.js: aim is
    // only written on mousemove while the camera moves every descent tick, so
    // a world-space aim would go stale under a still cursor -- and the menus
    // and cards hit-test it in view space.
    const ty = aim.y + cameraY - player.y;
    const d = Math.hypot(tx, ty) || 1;   // || 1: cursor exactly on the player
    if (player.swing) swing(tx / d, ty / d);
    else bullets.push({
      id: ++bulletId,
      x: player.x, y: player.y, r: player.shotRadius,
      vx: (tx / d) * player.shotSpeed,
      vy: (ty / d) * player.shotSpeed,
      speed: player.shotSpeed,       // its own speed, so range is measured at
                                     // the speed it actually flies (D53)
      pierce: player.pierce,
      travelled: 0,
      maxTravel: player.range,       // the ring means what it says
    });
    player.fireTimer = 1 / player.fireRate;
    sound('shoot');
  }

  // --- move enemies toward the diver, and hurt the diver on contact ---
  // The drag is the same for every enemy this frame, so it is worked out once.
  const pd = Math.pow(PUSH_DRAG, dt);   // per second, not per frame: a flat
                                        // factor would shove 2.4x further on a
                                        // 144Hz screen
  for (const e of enemies) {
    if (e.gone) continue;                  // cut down by a swing this tick: no step, no bite
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.sqrt(ex * ex + ey * ey) || 1;   // || 1 avoids dividing by zero

    if (e.lunge) lungeStep(e, ex / d, ey / d, d, dt);   // the boss's kind (D64)
    else if (e.spit) spitStep(e, ex / d, ey / d, d, dt);
    else if (e.fuse) fuseStep(e, ex / d, ey / d, d, dt);
    else if (e.weave) weaveStep(e, ex / d, ey / d, d, dt);
    else if (e.bite) biteStep(e, ex / d, ey / d, d, dt);
    else {
      ease(e, (ex / d) * e.speed, (ey / d) * e.speed, e.ramp, dt);   // D107
      e.x += (e.vx + e.pushX) * dt;
      e.y += (e.vy + e.pushY) * dt;
    }

    e.pushX *= pd;
    e.pushY *= pd;

    // The dash's wave: anything within reach of the line the dash swept this
    // frame, in the direction it is facing (D50). Swept, not sampled at the
    // landing point, so a fast step cannot carry the dash past an enemy; facing
    // is judged from where the frame started, so an enemy the step overshot does
    // not count as "behind". All of it inside the guard: a dash is up a small
    // share of the time, and this loop runs every tick.
    if (dashing && e.lastHitBy !== player.dashId) {
      const dashReach = e.r + DASH_REACH;
      const fx = e.x - fromX, fy = e.y - fromY;
      const dot = fx * player.dashDx + fy * player.dashDy;
      // The facing cone, squared: `dot / |f| > DASH_ARC` is the same question
      // as `dot > 0 && dot^2 > DASH_ARC^2 * |f|^2`, without the square root or
      // the divide.
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

    // Touch hurts only where the body does -- the eel's; every other fish
    // hurts by its attack: a bite, a spit, a burst, a charge (D108).
    if (e.touch && d < e.r + player.r) hurtPlayer();
  }

  // --- move bullets; they die at the edge of your range ---
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // The bullet's own speed, set by the weapon that fired it (D83): the
    // DoD's "railgun-speed projectile" and a jab fly at different speeds, and
    // a range counted at the wrong speed gives it the wrong range.
    b.travelled += b.speed * dt;
    if (b.travelled >= b.maxTravel) b.gone = true;
  }

  // --- bullets vs enemies ---
  // ponytail: every bullet against every enemy. Fine to a few hundred of each;
  // if it ever chugs, bucket entities into a grid and only compare neighbours.
  for (const b of bullets) {
    if (b.gone || b.evil) continue;              // an enemy's shot never hits a fish
    // Where this frame's flight began. Derived rather than stored: the bullet
    // is never clamped, so the start is exactly where the step came from --
    // unlike the player, who is clamped to the arena and therefore needs a
    // remembered `fromX`/`fromY`.
    const ax = b.x - b.vx * dt, ay = b.y - b.vy * dt;
    for (const e of enemies) {
      if (e.gone) continue;
      // Swept against the segment the bullet crossed this frame, not the point
      // it reached (D53): a fixed step bounds the step, not a bullet's speed.
      // Squared: this is the loop that runs bullets x enemies every tick.
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

  // --- enemy shots vs the diver (D95) ---
  // Swept like every fast hitbox (D53). Spent only by a hit that lands, so the
  // dash's invulnerability passes through them as it passes through fish.
  for (const b of bullets) {
    if (b.gone || !b.evil) continue;
    const reach = player.r + b.r;
    if (segDistanceSq(player.x, player.y, b.x - b.vx * dt, b.y - b.vy * dt, b.x, b.y) < reach * reach &&
        hurtPlayer()) b.gone = true;
  }

  // --- gems fly to you, from anywhere, and never fade (D35, D78) ---
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
      // The dive's takings, banked at `home` when the dive ends however it
      // ends (D67).
      currency += 1;
    }
  }

  // --- what kills drop besides gems (D84, D86) ---
  // A mod flies to you like a gem, from anywhere, and never fades: it is yours
  // for the dive. A boost lies where it fell, and is gone unless touched
  // before its life runs out.
  for (const d of drops) {
    const dx = player.x - d.x;
    const dy = player.y - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d.mod) {
      d.x += (dx / dist) * GEM_PULL * dt;
      d.y += (dy / dist) * GEM_PULL * dt;
    } else if ((d.life -= dt) <= 0) {
      d.gone = true;
      continue;
    }
    if (dist < player.r + d.r + 4) {
      d.gone = true;
      if (d.mod) collectMod(d.mod);
      else startBoost(d.boost);
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
  // kill the last enemy and kill the player, and the death screen outranks the
  // clear -- without it, dying on the boss's last hit heals you and hands you
  // the layer end's cards.
  if (wasFighting && enemies.length === 0 && screen === 'playing') clearBatch();
  bullets = bullets.filter(b => !b.gone);
  gems    = gems.filter(g => !g.gone);
  drops   = drops.filter(d => !d.gone);
  particles = particles.filter(p => p.life > 0);
  // A dive that ended this tick is banked last, after every gem the tick paid
  // -- a gem caught on the frame you die is yours (D67). Every later tick on
  // the end screen returns early above, so this runs once.
  if (screen === 'dead' || screen === 'won') endDive();
}
