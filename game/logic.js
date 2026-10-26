// ===== logic =====
// The simulation. Knows nothing about canvas, audio or the DOM.

// ---------- spawning ----------
function enemyType(name) {
  const t = ENEMY_TYPES.find(e => e.name === name);
  if (!t) console.error('no such enemy type: ' + name);
  return t;
}

// Speed is passed in: a batch's arrivals jitter, a scenario's must not. A
// graded fish gets copies of its attacks, so its damage leaves the type's alone.
function makeEnemy(t, x, y, speed, grade = 1) {
  const G = GRADES[grade - 1], hp = t.hp * G.hp;
  const behaviour = Object.fromEntries(Object.entries(behaviourOf(t)).map(([k, v]) =>
    [k, typeof v === 'object' && 'damage' in v ? { ...v, damage: v.damage + G.damage } : v]));
  return { name: t.name, grade, x, y, r: t.r, speed: speed * G.speed, hp, maxHp: hp,
           value: Math.round(t.value * G.value),
           color: t.color, glow: t.glow, lastHitBy: 0,
           pushX: 0, pushY: 0, vx: 0, vy: 0,
           ...behaviour,
           phase: 'chase', phaseTime: 0 };
}

// Just outside the view, in view coordinates: the caller adds the camera. The
// boss's place draws nothing from the seed, so it moves no other arrival.
function edgeSpawnPoint(t) {
  const m = 40 + t.r;
  if (t.enters === 'bottom') return { x: ARENA_W / 2, y: ARENA_H + m };
  const edge = Math.floor(rng() * 4);
  if (edge === 0) return { x: rng() * ARENA_W, y: -m };
  if (edge === 1) return { x: ARENA_W + m,     y: rng() * ARENA_H };
  if (edge === 2) return { x: rng() * ARENA_W, y: ARENA_H + m };
  return              { x: -m,                 y: rng() * ARENA_H };
}

// One batch, dealt into waves (D115). With escorts (D116) its own fish lead:
// a mini-boss's escorts follow in the waves, the boss's crowd at the gate.
// An entry's grade (D119) is its third field, and grade 1 when it has none.
const names = b => b.enemies.flatMap(([name, count, grade]) => Array(count).fill({ name, grade }));
function spawnBatch(batch, escorts) {
  const lead = escorts ? names(batch) : [];
  const rest = !escorts ? names(batch) : batch.crowd ? [] : names(escorts);
  const fish = [...lead, ...drawDistinct(rest, rest.length)];
  const size = () => WAVE_MIN + Math.floor(rng() * (WAVE_MAX - WAVE_MIN + 1));
  fish.splice(0, size()).forEach(f => arrive(f.name, batch.crowd && { lead: true }, f.grade));
  sound(escorts ? 'lead' : 'wave');
  let start = elapsed;
  while (fish.length) {
    start += WAVE_GAP * (1 - WAVE_JITTER + rng() * 2 * WAVE_JITTER);
    // `first` calls its wave in as it arrives, once.
    fish.splice(0, size()).forEach((f, i) => incoming.push({ ...f, at: start + rng() * WAVE_SPREAD, first: !i }));
  }
  incoming.sort((a, b) => a.at - b.at);
}

// Jittered, so a wave does not arrive as a drill squad. `flags` mark a crowd's
// lead or escort (D116).
function arrive(name, flags, grade) {
  const type = enemyType(name);
  if (!type) return;
  const { x, y } = edgeSpawnPoint(type);
  meet(name);
  enemies.push(Object.assign(
    makeEnemy(type, x, cameraY + y, type.speed * (1 - ENEMY_JITTER / 2 + rng() * ENEMY_JITTER), grade), flags));
}

// Into the catalogue the first time ever (D146); things met together share the line.
function meet(name) {
  if (meta.seen.includes(name)) return;
  meta.seen.push(name);
  if (metTime <= 0) met = [];
  met.push(name);
  metTime = NOTICE_TIME;
}

// No jitter: a scenario watches one thing behave, so it must not vary.
function placeEnemy(name, x, y) {
  const t = enemyType(name);
  if (t) enemies.push(makeEnemy(t, x, y, t.speed));
}

// Returns the pair rather than moving `o`, so "is it wholly inside?" is the
// same call.
function viewClamp(o) {
  return [Math.max(o.r, Math.min(ARENA_W - o.r, o.x)),
          Math.max(cameraY + o.r, Math.min(cameraY + ARENA_H - o.r, o.y))];
}

// For a fish that attacks only wholly in view: the way to the diver, as near
// as its body fits in view. Bodies are solid (D120), so one pressed half out of
// view against a diver at an edge would never attack again.
function towardInView(e) {
  const [tx, ty] = viewClamp({ x: player.x, y: player.y, r: e.r });
  const dx = tx - e.x, dy = ty - e.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / d, dy / d];
}

// Water (D107): RAMP_LEFT of a change is still to go after `ramp` seconds. No
// ramp, no easing: it turns at once.
function ease(b, wantX, wantY, ramp, dt) {
  const k = ramp ? Math.pow(RAMP_LEFT, dt / ramp) : 0;
  b.vx = wantX + (b.vx - wantX) * k;
  b.vy = wantY + (b.vy - wantY) * k;
}

// ---------- the lunge, and the fan ----------
// The boss's and the mini-boss's (D64, D65, D117). The line is fixed as the
// wind-up starts, which is what makes it dodgeable. It winds up only wholly in
// view, so the tell is seen, and the view holds it after: a charge that left
// would take the fight with it. No `attack` is the lunge, as saved before fans.
function lungeStep(e, ux, uy, d, dt) {
  const fanning = e.phase === 'chase' ? e.fan && e.attack === 'lunge' : e.attack === 'fan';
  const A = fanning ? e.fan : e.lunge;
  e.phaseTime += dt;
  let vx = 0, vy = 0;
  if (e.phase === 'chase') {
    const [wx, wy] = towardInView(e);
    vx = wx * e.speed;
    vy = wy * e.speed;
    const [cx, cy] = viewClamp(e);          // nothing to clamp: wholly inside
    if (e.phaseTime >= A.chase && d < A.reach && cx === e.x && cy === e.y) {
      e.phase = 'windup';
      e.phaseTime = 0;
      e.attack = fanning ? 'fan' : 'lunge';
      e.aimX = ux;
      e.aimY = uy;
    }
  } else if (e.phase === 'windup') {
    if (e.phaseTime >= A.windup) {
      e.phase = fanning ? 'rest' : 'charge';
      e.phaseTime = 0;
      if (fanning) {
        for (const a of fanAims(e)) enemyShot(e, Math.cos(a), Math.sin(a), A);
        sound('spit');
      }
    }
  } else if (e.phase === 'charge') {
    vx = e.aimX * A.speed;
    vy = e.aimY * A.speed;
  } else if (e.phaseTime >= A.rest) {        // resting: the opening
    e.phase = 'chase';
    e.phaseTime = 0;
  }
  e.x += vx * dt + e.pushX * dt;
  e.y += vy * dt + e.pushY * dt;
  if (e.phase === 'chase') return;
  const [x, y] = viewClamp(e);
  if (e.phase === 'charge' && (x !== e.x || y !== e.y || e.phaseTime * A.speed >= A.reach)) {
    e.phase = 'rest';
    e.phaseTime = 0;
  }
  e.x = x;
  e.y = y;
}

function fanAims(e) {
  const F = e.fan, centre = Math.atan2(e.aimY, e.aimX);
  const step = F.arc * Math.PI / 180 / (F.count - 1);
  return Array.from({ length: F.count }, (_, k) => centre + (k - (F.count - 1) / 2) * step);
}

function enemyShot(e, ux, uy, S) {
  bullets.push({ evil: true, x: e.x, y: e.y, r: S.r, vx: ux * S.speed, vy: uy * S.speed,
                 speed: S.speed, travelled: 0, maxTravel: S.travel, damage: S.damage, knock: S.knock });
}

// ---------- the spit ----------
// The archer's (D95). It spits only wholly in view, so a shot always comes
// from a fish you can see. `phaseTime` is the time since its last spit.
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
    enemyShot(e, ux, uy, S);
    sound('spit');
  }
}

// ---------- the fuse ----------
// The puffer's (D95, D106). It fuses only wholly in view, so the tell is seen;
// the dash's shove still moves it, which is the answer to one. It outlives its
// burst, so a burst pays nothing.
function fuseStep(e, ux, uy, d, dt) {
  const F = e.fuse;
  e.phaseTime += dt;
  if (e.phase === 'chase') {
    const [cx, cy] = viewClamp(e);
    if (e.phaseTime >= F.chase && d < F.trigger && cx === e.x && cy === e.y) {
      e.phase = 'fuse';
      e.phaseTime = 0;
    } else {
      const [wx, wy] = towardInView(e);
      e.x += wx * e.speed * dt;
      e.y += wy * e.speed * dt;
    }
  }
  e.x += e.pushX * dt;
  e.y += e.pushY * dt;
  if (e.phase === 'fuse' && e.phaseTime >= F.time) {
    e.phase = 'chase';
    e.phaseTime = 0;
    const bx = player.x - e.x, by = player.y - e.y, reach = F.blast + player.r;
    if (bx * bx + by * by < reach * reach) hurtPlayer(F, ux, uy);
    burst(e.x, e.y, e.color, e.glow, 24, 260, 0.45);
    sound('pop');
  }
}

// ---------- the bite ----------
// The plain fish's (D108). The jaws ease it to a halt, so a heavy fish slides.
function biteStep(e, ux, uy, d, dt) {
  const B = e.bite;
  e.phaseTime += dt;
  if (e.phase === 'jaws') {
    ease(e, 0, 0, e.ramp, dt);
    if (e.phaseTime >= B.windup) {
      if (d - e.r - player.r <= B.reach) hurtPlayer(B, ux, uy);
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

// The drawn leap (D141): over the jaws' last `LEAP_TIME` the body stretches at
// the diver, to its body or to the reach's end, whichever is nearer -- full on
// the snap -- and back over the rest's first. In px from where the fish is.
function biteLeap(e) {
  if (!e.bite) return 0;
  const B = e.bite;
  const k = e.phase === 'jaws' ? 1 - (B.windup - e.phaseTime) / LEAP_TIME
          : e.phase === 'rest' ? 1 - e.phaseTime / LEAP_TIME : 0;
  if (k <= 0) return 0;
  const gap = Math.hypot(player.x - e.x, player.y - e.y) - e.r - player.r;
  return Math.min(1, k) * Math.max(0, Math.min(B.reach, gap));
}

// ---------- the weave ----------
// The eel's (D95): `width` px either side, `rate` sways a second. `phaseTime`
// is the sway's clock, so a batch's eels sway in step, as a school.
function weaveStep(e, ux, uy, d, dt) {
  const w = 2 * Math.PI * e.weave.rate;
  const side = e.weave.width * w * Math.cos(w * (e.phaseTime += dt));   // the sway's speed
  e.x += (ux * e.speed - uy * side + e.pushX) * dt;
  e.y += (uy * e.speed + ux * side + e.pushY) * dt;
}

// The one way the diver is hurt (D95, D100, D118). Returns whether it landed,
// so a shot that did not is not spent. The guard counts hits, not damage, and
// takes the knock too (D122): `hit` is the attack's record, `ux, uy` the way
// it knocks. Immortal, a hit lands and shows but takes no HP (D121).
function hurtPlayer(hit, ux, uy) {
  if (player.hurt > 0 || player.safe > 0) return false;
  player.hurt = player.iframes;
  batchHit = true;
  if (guardLeft > 0) {
    guardLeft -= 1;
    burst(player.x, player.y, '#fff1b8', '#ffc400', 14, 170, 0.4);
    sound('guard');
    return true;
  }
  // Onto the swim, which its ramp eases off (D107).
  player.vx += ux * hit.knock;
  player.vy += uy * hit.knock;
  if (!immortal) player.hp = Math.max(0, player.hp - hit.damage);
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

// ---------- bodies ----------
// Solid (D120): what overlaps is pushed apart, the heavier by area moving less.
// A lunger out of its chase is not pushed at all: its lane is its tell (D64).
// The dash passes through -- that is what it is for.
// ponytail: every pair, O(n^2); ideas.md -> Spatial grid for collision.
const pinned = e => e.lunge && e.phase !== 'chase';
const weight = e => pinned(e) ? 1e12 : e.r * e.r;

// Parting at a capped rate, a deep overlap -- a diver pinned under a charge --
// eases apart instead of jumping.
function separate(dt) {
  const most = BODY_PUSH * dt;
  const live = enemies.filter(e => !e.gone);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, dd = dx * dx + dy * dy;
      if (dd >= min * min) continue;
      const d = Math.sqrt(dd), nx = d ? dx / d : 1, ny = d ? dy / d : 0;
      const wa = weight(a), wb = weight(b), k = (d ? Math.min(min - d, most) : most) / (wa + wb);
      a.x -= nx * k * wb;
      a.y -= ny * k * wb;
      b.x += nx * k * wa;
      b.y += ny * k * wa;
    }
  }
  if (player.dashTime > 0) return;
  // Where the diver meets a fish, a touch lands and so does a charge (D108).
  // An edge holds the diver, so a fish pinning it there takes the whole push.
  for (const e of live) {
    const dx = player.x - e.x, dy = player.y - e.y, min = e.r + player.r, dd = dx * dx + dy * dy;
    if (dd >= min * min) continue;
    const d = Math.sqrt(dd), nx = d ? dx / d : 1, ny = d ? dy / d : 0;
    const overlap = d ? Math.min(min - d, most) : most, we = weight(e);
    if (e.touch) hurtPlayer(e.touch, nx, ny);
    else if (e.phase === 'charge') hurtPlayer(e.lunge, nx, ny);
    const share = overlap * we / (we + player.r * player.r);
    const [x, y] = viewClamp({ x: player.x + nx * share, y: player.y + ny * share, r: player.r });
    const moved = (x - player.x) * nx + (y - player.y) * ny;
    [player.x, player.y] = [x, y];
    const left = pinned(e) ? 0 : overlap - moved;
    e.x -= nx * left;
    e.y -= ny * left;
    // No swim banks up against a body, as against an edge (D107).
    const into = player.vx * nx + player.vy * ny;
    if (into < 0) {
      player.vx -= into * nx;
      player.vy -= into * ny;
    }
  }
}

// A fast hitbox tested only where it landed skips whatever it crossed, so the
// dash and bullets test the segment they swept (D50, D53).
function segDistanceSq(px, py, ax, ay, bx, by) {
  const sx = bx - ax, sy = by - ay;
  const len2 = sx * sx + sy * sy;
  // Clamped to the ends: a capsule, not an infinite line.
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * sx + (py - ay) * sy) / len2)) : 0;
  const dx = px - (ax + t * sx), dy = py - (ay + t * sy);
  return dx * dx + dy * dy;
}

function spark(x, y, vx, vy, life, r, color, glow) {
  particles.push({ x, y, vx, vy, life, maxLife: life, r, color, glow });
}

function burst(x, y, color, glow, count, speed, life = 0.45) {
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const s = speed * (0.3 + rng() * 0.7);
    spark(x, y, Math.cos(a) * s, Math.sin(a) * s, life, 3, color, glow);
  }
}

// The Knife's cut (D105). Runs once per pull, not every tick, so it need not
// keep distances squared.
function swing(ux, uy) {
  const half = player.swing.arc * Math.PI / 360;
  const cut = [];
  for (const e of enemies) {
    if (e.gone) continue;
    const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
    const body = e.r + player.shotRadius;
    if (d > player.range + body) continue;
    const off = Math.acos(Math.max(-1, Math.min(1, (dx * ux + dy * uy) / (d || 1))));
    if (d <= body || off <= half + Math.asin(Math.min(1, body / d))) cut.push([d, e]);
  }
  cut.sort((a, b) => a[0] - b[0]);
  for (const [, e] of cut.slice(0, player.pierce + 1)) {
    if (e.gone) continue;                    // the splash of a nearer cut killed it
    knock(e, ux, uy);
    hitSparks(e, { vx: ux, vy: uy });
    hit(e);
  }
  player.swingLeft = player.swing.time;      // what the renderer draws
  player.swingX = ux;
  player.swingY = uy;
}

// A shot's or a swing's damage. With Bloom running it wounds the fish beside
// the struck one too (D125); a wound never splashes on, so a crowd cannot chain.
function hit(e) {
  wound(e);
  if (e.hp > 0) sound('hit');
  if (!player.splash) return;
  // Its reach, seen: whatever the ring touches, the splash wounds. `ring` is
  // the radius it grows from.
  particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: SPLASH_SHOW, maxLife: SPLASH_SHOW,
                   r: e.r + player.splash, ring: e.r, color: '#eaffff', glow: '#9ef7ff' });
  for (const x of enemies) {
    if (x === e || x.gone) continue;
    const dx = x.x - e.x, dy = x.y - e.y, reach = e.r + x.r + player.splash;
    if (dx * dx + dy * dy < reach * reach) wound(x);
  }
}

function wound(e) {
  e.hp -= player.damage;
  e.flash = 0.07;
  if (e.hp <= 0) killEnemy(e);
}

// A hit knocks a fish along it (D122), as the bodies weigh: the heavier by
// area less, a lunger out of its chase not at all. The drawn bump moves
// nothing, so even a lunger jolts.
function knock(e, ux, uy) {
  e.bump = BUMP_TIME;
  e.bumpX = ux;
  e.bumpY = uy;
  if (pinned(e)) return;
  const k = player.knock * player.r * player.r / weight(e);
  e.pushX += ux * k;
  e.pushY += uy * k;
}

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

// Every death goes through here -- shot, swing or dash -- so the paths cannot
// drift apart.
function killEnemy(e) {
  e.gone = true;
  kills += 1;
  // A fish placed by hand pays no challenge (D109).
  if (plan[batchIndex - 1]) {
    if (firstKillAt === null) firstKillAt = elapsed;
    if (e.carrier) glowAt = elapsed;
    killTimes = [...killTimes.filter(t => elapsed - t <= FLURRY_TIME), elapsed];
    for (const c of CHALLENGES) if (c.kill) climb(c, c.kill());
  }
  // The last lead takes its crowd with it (D116), and every shot: none may land
  // after the layer end heals (D117).
  if (e.lead && !enemies.some(x => x.lead && !x.gone)) {
    for (const x of enemies) {
      if (!x.escort || x.gone) continue;
      x.gone = true;
      burst(x.x, x.y, x.color, x.glow, 12 + x.maxHp * 2, 170 + x.maxHp * 14, 0.5);
    }
    incoming = [];
    for (const b of bullets) if (b.evil) b.gone = true;
  }
  for (let n = 0; n < e.value; n++) {
    gems.push({ x: e.x + (rng() - 0.5) * 18,
                y: e.y + (rng() - 0.5) * 18, r: 4 });
  }
  if (e.carrier) dropMod(e);
  // A boost (D86), never from the kill that ends the batch: it would fade behind
  // you as the current carried you on. Between waves the fight goes on (D115).
  sinceBoost += 1;
  if ((enemies.some(x => !x.gone) || incoming.length) && rng() < BOOST_C * sinceBoost) {
    const boost = drawDistinct(BOOSTS.filter(fits), 1)[0].name;
    drops.push({ x: e.x, y: e.y, r: 6, boost, life: BOOST_LIFE });
    meet(boost);
    sinceBoost = 0;
  }
  burst(e.x, e.y, e.color, e.glow, 12 + e.maxHp * 2, 170 + e.maxHp * 14, 0.5);
  sound('kill', 1 - Math.min(0.4, e.maxHp * 0.04));  // bigger things pop lower
}

// ---------- what kills drop besides gems (D84, D86) ----------
function dropMod(e) {
  drops.push({ x: e.x, y: e.y, r: 7, mod: drawCarried().name });
}

// One fish glows from the start (D84, D88), but not in a batch a boss leads,
// its escorts included (D116).
function light() {
  if (enemies.some(e => enemyType(e.name).carries === false) || !carriable().length) return;
  drawDistinct(enemies, 1)[0].carrier = true;
}

// The pickup line names what it changed, as the cards do (D52).
function collectMod(name) {
  const m = MODS.find(x => x.name === name);
  const moved = modPreview(m);
  takeMod(m);
  banner = m.name + ' \u2014 ' + m.desc + moved.map(c => '   ' + statLine(c)).join('');
  bannerTime = NOTICE_TIME;
  sound('modA');
  sound('modB');
}

// Touched again while it runs, its clock restarts and nothing more is added.
// What it added runs with it, so exactly that comes back off (D125).
function startBoost(name) {
  const b = BOOSTS.find(x => x.name === name);
  const on = boosts.find(x => x.name === name);
  if (on) on.left = b.time;
  else {
    const add = { ...b.add };
    for (const k in b.percent) add[k] = player[k] * b.percent[k] / 100;
    for (const k in add) player[k] += add[k];
    boosts.push({ name, left: b.time, add });
  }
  banner = b.name + ' \u2014 ' + ((player.swing && b.swingDesc) || b.desc);
  bannerTime = NOTICE_TIME;
  sound('boost');
}

const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

function cardUnder(x, y) {
  for (let i = 0; i < choices.length; i++) {
    if (inRect(cardRect(i, choices.length), x, y)) return i;
  }
  return -1;
}

function rowUnder(x, y, n, top) {
  for (let i = 0; i < n; i++) if (inRect(rowRect(i, top), x, y)) return i;
  return -1;
}

// A cursor resting on a row must not overrule the keys every frame. Every
// screen with a cursor calls it once a frame.
function mouseMoved() {
  const moved = aim.x !== lastAimX || aim.y !== lastAimY;
  lastAimX = aim.x;
  lastAimY = aim.y;
  return moved;
}

function clearBatch() {
  // A scenario's hand-placed fish (D37) have no entry: they pay Mend, and
  // nothing that belongs to a layer.
  const entry = plan[batchIndex - 1];
  sound(entry?.end ? 'layer' : 'clear');
  if (entry) {
    // Challenges first, so the layer end's heal cannot read as a clean batch (D109).
    for (const c of CHALLENGES) {
      if (c.clear) climb(c, tally[c.name] = c.clear(tally[c.name] || 0));
      if (c.end && entry.end) climb(c, c.end());
    }
    // A milestone (D68): cleared at `home` whatever the rest of the dive does.
    if (entry.end) {
      layerStart = null;
      player.hp = player.maxHp;
      meta.cleared = Math.max(meta.cleared, entry.layer + 1);
    }
  }
  // The last layer's end pays no pick and no Mend: nothing to go on to (D59, D68).
  if (batchIndex >= plan.length) return;
  // A comfort mod is a standing effect rather than a stat, so it acts here.
  if (player.mendOnClear) {
    player.hp = Math.min(player.maxHp, player.hp + player.mendOnClear);
  }
  // The cards wait for the boss's burst to play: dimming over it reads as a
  // jump cut, not a reward (D51).
  if (entry && entry.end) offerTimer = MOD_OFFER_DELAY;
}

// Derived from `apply` itself (D52), so a card can never advertise a number
// the mod does not deliver. A layer end's card gives `n` picks at once (D85).
function modPreview(mod, n = 1, base = player) {
  const after = { ...base };
  for (let i = 0; i < n; i++) mod.apply(after);
  return Object.keys(after)
    .filter(k => typeof after[k] === 'number' && after[k] !== base[k])
    .map(k => ({ stat: k, from: base[k], to: after[k] }));
}

// Two places at most, so a 0.30000000000000004 cannot reach the screen.
const statLine = c => STAT_NAMES[c.stat] + ' ' + +c.from.toFixed(2) + ' \u2192 ' + +c.to.toFixed(2);

// With every mod capped there are no cards, and Continue alone goes on.
function openModOffer() {
  choices = rollValuable();
  choiceIndex = Math.floor(choices.length / 2);
  screen = 'mods';
  sound('modA');
  sound('modB');
}

function takeMod(mod) {
  mod.apply(player);
  modCounts[mod.name] = (modCounts[mod.name] || 0) + 1;
}

// Every rung `v` now meets pays, once ever, rung k paying k points (D109).
function climb(c, v) {
  const was = meta.challenges[c.name] || 0;
  let k = was;
  while (k < c.rungs.length && (c.within ? v <= c.rungs[k] : v >= c.rungs[k])) k += 1;
  if (k === was) return;
  meta.challenges[c.name] = k;
  // A challenge paying twice in a tick -- a swing's kills -- is one entry.
  let now = paidNow.find(p => p.c === c);
  if (!now) paidNow.push(now = { c, paid: 0 });
  now.paid += tri(k) - tri(was);
  const total = paidNow.reduce((a, p) => a + p.paid, 0);
  notice = (paidNow.length === 1 ? c.name + ': ' + c.ask(c.rungs[k - 1]) : paidNow.map(p => p.c.name).join(', ')) +
           ' \u2014 ' + total + (total === 1 ? ' point' : ' points');
  noticeTime = NOTICE_TIME;
}

// ---------- home ----------
// Derived every time, so paid and spent can never disagree (D36, D109).
function points() {
  return CHALLENGES.reduce((a, c) => a + tri(meta.challenges[c.name] || 0), 0) -
         ATTRIBUTES.reduce((a, x) => a + tri(meta.raised[x.name] || 0), 0);
}

// Undefined at the top, where `canBuy` is false: no bank is `>= undefined`.
const nextCost = g => g.tiers[meta.gear[g.name] || 0]?.cost;
const canBuy = g => meets(g) && meta.bank >= nextCost(g);
// Scheduling, not scaling: it changes when, never how much (D36, D98).
const meets = g => Object.entries(g.requires || {}).every(([a, n]) => (meta.raised[a] || 0) >= n);

// A weapon's row at `home` (D97). Every write saves at once: a purchase is
// never undone by a closed tab.
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
  const step = (meta.raised[a.name] || 0) + 1;
  if (points() < step) return;
  meta.raised[a.name] = step;
  saveNow();
}

// Banked however the dive ended (D67); the dive leaves the save (D70).
function endDive() {
  meta.bank += currency;
  meta.deepest = Math.max(meta.deepest, cameraY);
  diveLive = false;
  menuIndex = END_MENU.items.indexOf(GO_HOME);   // the end screen opens on Go home (D90)
  saveNow();
}

// Every save, the platform's too, since game/ decides when (D77). Never in the
// debug mode (D102): its meta is the setup's, not the player's.
function saveNow() {
  if (!debugSetup) persist(saveText());
}

// Every way onto a menu, so none leaves the cursor past a shorter menu's end.
function openMenu(name) {
  screen = name;
  menuIndex = 0;
}

// A new game (D103): the save written fresh is what clearing it means here.
function newGame() {
  meta = freshMeta();
  diveLive = false;
  saveNow();
  openMenu('home');
}

// ---------- the debug mode ----------
// `?debug` (D102): main.js reads no save for it, and `saveNow()` writes none.
function openDebug(code, seed) {
  debugSetup = parseSetup(code, seed);
  meta = freshMeta();
  diveLive = false;
  muted = true;
  openMenu('debug');
}

// A setup as text, for the address bar and an issue:
// `L2,G7,S4471,Grade2,Harpoon2,puffer4,Dash_reach1,immortal`.
function setupCode(s = debugSetup) {
  const token = (name, n) => name.replace(/ /g, '_') + n;
  return ['L' + (s.layer + 1), 'G' + (s.gate + 1), 'S' + s.seed,
          ...(s.grade > 1 ? ['Grade' + s.grade] : []),
          token(s.weapon, s.counts[s.weapon] || 0),
          ...DEBUG_COUNTS.filter(c => c.col !== undefined && s.counts[c.name] > 0)
                         .map(c => token(c.name, s.counts[c.name])),
          ...(s.immortal ? ['immortal'] : []), ...(s.oneShot ? ['oneshot'] : [])].join(',');
}

// What it cannot name -- a typo, a record renamed since -- is shown in
// `ignored`, never guessed at.
function parseSetup(code, seed = newSeed()) {
  const s = { layer: 0, gate: 0, grade: 1, seed, immortal: false, oneShot: false,
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
    else if (name === 'Grade') s.grade = n;
    else if (DEBUG_COUNTS.some(c => c.name === name)) {
      s.counts[name] = n;
      if (WEAPONS.some(w => w.name === name)) s.weapon = name;
    }
    else s.ignored.push(token);
  }
  return clampSetup(s);
}

function clampSetup(s) {
  const within = (n, max) => Math.max(0, Math.min(max, n));
  s.layer = within(s.layer, LAYERS.length - 1);
  s.gate = within(s.gate, gatesIn(s.layer) - 1);
  s.grade = Math.max(1, Math.min(GRADES.length, s.grade));
  for (const c of DEBUG_COUNTS) if (c.name in s.counts) s.counts[c.name] = within(s.counts[c.name], c.max);
  return s;
}

// Wraps only from the end itself, so Shift's five reach the end before they
// come round.
function wrapStep(n, d, max) {
  if (d < 0 && n <= 0) return max;
  if (d > 0 && n >= max) return 0;
  return Math.max(0, Math.min(max, n + d));
}

function gatesIn(l) {
  return LAYERS[l].stretches.reduce((n, st) => n + Math.min(st.draw, st.pool.length), 0);
}

function setupFish(s) {
  return ENEMY_TYPES.filter(e => s.counts[e.name] > 0).map(e => [e.name, s.counts[e.name]]);
}

// It reseeds the randomness to draw the plan: harmless, since every dive
// reseeds it.
function gateLine() {
  const s = debugSetup, fish = setupFish(s);
  seedRng(s.seed);
  const drawn = drawPlan();
  // A type once, its graded fish counted beside it: a graded batch holds a
  // type at up to three grades.
  const list = batch => Object.entries(Object.groupBy(batch, ([name]) => name)).map(([name, es]) => {
    const n = es.reduce((a, [, c]) => a + c, 0), g = es[0][2] || 1;
    if (es.length === 1) return n + ' ' + name + (g > 1 ? ' at grade ' + g : '');
    const up = es.filter(([, , h = 1]) => h > 1).sort((a, b) => a[2] - b[2]).map(([, c, h]) => c + ' grade ' + h);
    return n + ' ' + name + ' (' + up.join(', ') + ')';
  }).join(', ');
  const { batch, escorts } = drawn[drawn.findIndex(e => e.layer === s.layer) + s.gate];
  return LAYERS[s.layer].name + ', gate ' + (s.gate + 1) + ': ' + list(batch.enemies) +
         (escorts ? (batch.crowd ? ', its crowd from ' : ', escorted by ') + list(escorts.enemies) : '') +
         (fish.length ? '   →   in its place: ' + list(fish) : '') +
         (s.grade > 1 ? '   →   all at grade ' + s.grade : '');
}

// The setup's tips (D102), worked out from `apply` as the cards are (D52), so a
// tip cannot tell a number the game does not deliver.
const signed = n => (n < 0 ? '-' : '+') + +Math.abs(n).toFixed(2);
function moves(apply, w = WEAPONS.find(x => x.name === debugSetup.weapon)) {
  // Before a dive HP is full, so a step of max HP is all that needs saying.
  return modPreview({ apply }, 1, { ...PLAYER_START, ...shotOf(w) }).filter(c => c.stat !== 'hp')
    .map(c => (STAT_NAMES[c.stat] || c.stat) + ' ' + signed(c.to - c.from)).join(', ');
}
const needsLine = g => (g.requires ? '   owning it needs ' +
  Object.entries(g.requires).map(([a, n]) => a + ' ' + n).join(', ') : '');
function fishTip(e, grade) {
  const f = makeEnemy(e, 0, 0, e.speed, grade);
  // A touch is not a step after the others: it hurts all along.
  const kinds = Object.keys(behaviourOf(e)).filter(k => k !== 'ramp' && k !== 'touch');
  return e.name + ': ' + (kinds.length ? kinds : ['chase']).map(k => DEBUG_BEHAVIOURS[k]).join('; then ') +
         (e.enters === 'bottom' ? '; rises from below' : '') +
         (e.carries === false ? '; never glows, so carries no mod' : '') +
         (e.touch ? '; ' + DEBUG_BEHAVIOURS.touch : '') +
         '   hp ' + f.hp + ' \u00b7 speed ' + Math.round(f.speed) + ' \u00b7 ' +
         f.value + (f.value === 1 ? ' gem' : ' gems');
}
function tiersTip(g, w) {
  const each = g.tiers.map(t => moves(t.apply, w));
  return each.every(m => m === each[0]) ? each[0] + ' a tier, ' + each.length + ' tiers'
                                        : each.map((m, i) => 'tier ' + (i + 1) + ': ' + m).join('  \u00b7  ');
}
function gearTip(g) {
  return g.name + ': ' + tiersTip(g) + needsLine(g);
}
function stepTip(a) {
  const by = [...WEAPONS, ...EQUIPMENT].filter(g => g.requires?.[a.name]);
  return a.name + ': ' + moves(a.apply) + ' a step' +
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

// A fresh meta holds the setup's gear and steps, so reset() applies them as a
// dive from home would. Its fish replace a copy of the plan's entry, never the
// pool it was drawn from.
function debugDive() {
  const s = debugSetup, n = name => s.counts[name] || 0;
  const weapon = WEAPONS.find(w => w.name === s.weapon);
  meta = { ...freshMeta(), carried: weapon.name, owned: WEAPONS.map(w => w.name),
           gear: Object.fromEntries([weapon, ...EQUIPMENT].map(g => [g.name, n(g.name)])),
           raised: Object.fromEntries(ATTRIBUTES.map(a => [a.name, n(a.name)])) };
  immortal = s.immortal;
  damageOverride = s.oneShot ? ONE_SHOT : 0;
  startScenario({
    batch: drawn => drawn.findIndex(e => e.layer === s.layer) + s.gate,
    // A weapon mod only with a weapon it fits (D99).
    kit: MODS.filter(m => !m.weapons || m.weapons.includes(weapon.name))
             .flatMap(m => Array(n(m.name)).fill(m.name)),
  }, s.seed);
  // The gate's whole place, escorts included (D116).
  const fish = setupFish(s);
  if (fish.length) plan[batchIndex] = { ...plan[batchIndex], batch: { enemies: fish }, escorts: undefined };
  // Every fish of the dive at the setup's grade (D119), drawn or chosen.
  const graded = b => b && { ...b, enemies: b.enemies.map(([name, count]) => [name, count, s.grade]) };
  if (s.grade > 1) plan = plan.map(p => ({ ...p, batch: graded(p.batch), escorts: graded(p.escorts) }));
}

// ---------- the clock ----------
// Whole FIXED_DT steps only, leftover time banked, so every machine simulates
// the same game (D53). In `game/`, not the frame loop, because it ports.
// Returns the tick count so a check can prove the banking.
let accumulator = 0;

function advanceBy(elapsed) {
  // Capped before it is banked, so time in another tab is dropped, not queued.
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
// `k = plan.length` is the bottom of the last layer (D58). The layers stack in
// one strip (D72), so this needs no layer.
function gateDepth(k) {
  return k * GATE_SPACING;
}

// Drawn from the seed (D71, D116), and graded (D126): each ordinary stretch of
// the dive adds to the last one's threat, a ratio more each time, and every
// batch drawn there is graded up to it. A mini-boss or the boss arrives at its layer's number, its
// escorts graded so the gate, lead and escorts, comes to the stretch's threat.
// reset() calls it before anything else draws, so the plan is the first thing
// a seed decides.
function drawPlan() {
  const out = [];
  let k = -1;
  LAYERS.forEach((layer, l) => {
    const top = GRADES.findLastIndex(g => g.from <= l + 1) + 1;
    for (const s of layer.stretches) {
      if (!s.escorts) k += 1;
      const target = THREAT_START * (THREAT_RISE ** (k + 1) - 1) / (THREAT_RISE - 1);
      for (const batch of drawDistinct(s.pool, s.draw)) {
        const lead = s.escorts && ofGrade(batch, Math.min(l + 1, top));
        out.push(lead
          ? { layer: l, batch: lead, escorts: graded(drawDistinct(s.escorts, 1)[0], target - batchThreat(lead), top) }
          : { layer: l, batch: graded(batch, target, top) });
      }
    }
    out[out.length - 1].end = true;
  });
  return out;
}

// A batch's threat, its fish's summed: about one heart lost at the knee (D126).
const batchThreat = b => b.enemies.reduce((a, [name, n, g = 1]) => a + n * enemyType(name).threat[g - 1], 0);
const ofGrade = (b, g) => ({ ...b, enemies: b.enemies.map(([name, n]) => [name, n, g]) });

// Up to `target`, one fish and one grade at a time, drawn from the seed, never
// past `top`, and never past GRADE_KEEP of a type left at grade 1. A step that
// fits what is left is drawn first; past that, the smallest step, only while it
// lands nearer the target than stopping.
function graded(batch, target, top) {
  const fish = names(batch).map(f => ({ name: f.name, grade: f.grade || 1 }));
  const room = f => f.grade > 1 || fish.filter(x => x.name === f.name && x.grade > 1).length
    < Math.floor((1 - GRADE_KEEP) * fish.filter(x => x.name === f.name).length);
  let left = target - batchThreat(batch);
  while (left > 0) {
    const up = fish.filter(f => f.grade < top && room(f)).map(f => {
      const t = enemyType(f.name).threat;
      return [f, t[f.grade] - t[f.grade - 1]];
    });
    const fits = up.filter(([, d]) => d <= left);
    const least = up.reduce((a, b) => (!a || b[1] < a[1] ? b : a), null);
    const [f, d] = fits.length ? fits[Math.floor(rng() * fits.length)] : least && least[1] < 2 * left ? least : [];
    if (!f) break;
    f.grade += 1;
    left -= d;
  }
  const enemies = [];
  for (const f of fish) {
    const e = enemies.find(([n, , g]) => n === f.name && g === f.grade);
    if (e) e[1] += 1;
    else enemies.push([f.name, 1, f.grade]);
  }
  return { ...batch, enemies };
}

// The renderer asks, for the water's colour (D72); here because it is the
// dive's geometry, and ports.
function layerAt(y) {
  return (plan.find((_, k) => gateDepth(k) >= y) ?? plan[plan.length - 1]).layer;
}

// ---------- update ----------
// So this frame's presses are forgotten whichever way step() returned.
function update(dt) {
  // Armed only by a button released since play began. Every other screen
  // disarms it, which covers every route into play.
  if (screen !== 'playing') fireArmed = false;
  else if (!CLICK.some(c => keys.has(c))) fireArmed = true;

  const cameraFrom = cameraY;
  step(dt);
  // The water never stops (D58): outside step(), which returns early on every
  // screen but play. Menus freeze it, except one that `flows`.
  if ((!MENUS[screen] || MENUS[screen].flows) && screen !== 'help' && screen !== 'options') {
    const target = cameraY > cameraFrom ? CURRENT_SPEED : CURRENT_CRAWL;
    current += (target - current) * (1 - Math.pow(CURRENT_EASE, dt));
    waterY += current * dt;
  }
  // Outside step() too: a death sets the shake on its last playing tick, and it
  // must settle on the screens after.
  if (shake > 0) {
    shake *= Math.pow(SHAKE_FADE, dt);
    if (shake < SHAKE_FLOOR) shake = 0;      // otherwise it jitters forever
  }
  justPressed.clear();
}

function step(dt) {
  // On every screen, and a setting, so written at once (D113).
  if (tapped(MUTE)) {
    muted = !muted;
    saveNow();
  }
  // The debug mode's two keys, on every screen (D102).
  if (debugSetup && tapped(DEBUG_AGAIN)) return debugDive();
  if (debugSetup && tapped(DEBUG_SETUP) && screen !== 'debug') return openMenu('debug');

  const menu = MENUS[screen];
  if (menu) {
    const items = menu.items;
    const hovered = items.findIndex((_, i) => inRect(rectOf(menu, i), aim.x, aim.y));
    if (mouseMoved() && hovered >= 0) menuIndex = hovered;
    menuIndex = moveCursor(menuIndex, items.length);

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

  if (screen === 'help' || screen === 'catalogue') {
    if (justPressed.has('Escape') || tapped(GO) || tapped(CLICK)) screen = returnTo;
    return;
  }

  if (screen === 'options') {
    const hovered = rowUnder(aim.x, aim.y, OPTIONS.length, OPTION_TOP);
    if (mouseMoved() && hovered >= 0) optionIndex = hovered;
    optionIndex = moveCursor(optionIndex, OPTIONS.length);

    if (tapped(LEFT))  OPTIONS[optionIndex].change(-1);
    if (tapped(RIGHT) || tapped(GO)) OPTIONS[optionIndex].change(1);
    if (tapped(CLICK) && hovered >= 0) OPTIONS[hovered].change(1);
    if (justPressed.has('Escape')) {
      saveNow();                     // the settings, as the screen is left (D113)
      screen = returnTo;
    }
    return;
  }

  // Only play and the mod cards reach this line. Pausing saves: it is the moment
  // a dive is most likely put down (D70).
  if (justPressed.has('Escape')) {
    resumeTo = screen;
    openMenu('paused');
    saveNow();
    return;
  }

  // The layer end's pick (D85, D33). Hovering marks nothing: on its way down to
  // Continue the cursor crosses the cards.
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
  paidNow = [];
  if (player.hurt > 0) player.hurt -= dt;
  if (player.safe > 0) player.safe -= dt;
  if (noticeTime > 0) noticeTime -= dt;
  if (bannerTime > 0) bannerTime -= dt;
  if (metTime > 0) metTime -= dt;
  // Boosts run on play's clock: every other screen returns above (D86).
  for (const a of boosts) {
    a.left -= dt;
    if (a.left > 0) continue;
    for (const k in a.add) player[k] -= a.add[k];
    a.gone = true;
  }
  boosts = boosts.filter(a => !a.gone);

  // --- the gate: one batch at a time, nothing until it is clear (D27) ---
  // An empty arena with nothing still to come *is* the cleared state, so it
  // needs no flag. `else if`, so an offer or the waves hold the queue
  // structurally, not by a condition someone can drop. The boss's crowd (D116).
  if (enemies.some(e => e.lead && !e.gone)) {
    const { batch, escorts } = plan[batchIndex - 1];
    const mix = names(escorts);
    for (let n = enemies.filter(e => e.escort && !e.gone).length + incoming.length; n < batch.crowd; n++) {
      incoming.push({ ...mix[Math.floor(rng() * mix.length)], at: elapsed + rng() * WAVE_SPREAD,
                      flags: { escort: true, value: 0 } });
    }
    incoming.sort((a, b) => a.at - b.at);
  }
  if (offerTimer > 0) {
    offerTimer -= dt;
    if (offerTimer <= 0) openModOffer();
  } else if (incoming.length) {
    // Later waves (D115). An empty arena calls the next at once and moves the
    // rest up, so a fast clear is never left waiting.
    if (!enemies.length && incoming[0].at > elapsed) {
      const early = incoming[0].at - elapsed;
      for (const f of incoming) f.at -= early;
    }
    while (incoming.length && incoming[0].at <= elapsed) {
      const f = incoming.shift();
      arrive(f.name, f.flags, f.grade);
      if (f.first) sound('wave');
    }
  } else if (!queuePaused && enemies.length === 0) {
    const target = gateDepth(batchIndex);
    // Only a dive's opening beat counts down; every later batch waits on the
    // descent instead, which is a beat of its own.
    if (breathTimer > 0) breathTimer -= dt;
    if (cameraY < target) {
      // Clamped so a batch always finds you *at* its depth. The diver rides
      // along, or the view's top edge would drag them like a wall.
      cameraY = Math.min(target, cameraY + current * dt);
      player.y += current * dt;
    }
    else if (breathTimer <= 0) {
      // Reaching the bottom is the win (D62, D68), banked at the end of this tick.
      if (batchIndex >= plan.length) screen = 'won';
      else {
        spawnBatch(plan[batchIndex].batch, plan[batchIndex].escorts);
        light();
        batchHit = false;
        guardLeft = player.guard;
        batchDashed = false;
        firstKillAt = null;
        glowAt = null;
        // A layer's first batch starts `swift`'s clock (D109).
        if (plan[batchIndex].layer !== plan[batchIndex - 1]?.layer) layerStart = elapsed;
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

  // `turn` is seconds a half circle (D107).
  if (len > 0) {
    const want = Math.atan2(dy, dx) - player.facing;
    const gap = Math.atan2(Math.sin(want), Math.cos(want));
    const step = Math.PI / player.turn * dt;
    const f = player.facing + Math.max(-step, Math.min(step, gap));
    player.facing = Math.atan2(Math.sin(f), Math.cos(f));
  }

  // --- the dash ---
  // Along the facing, never the mouse: you shoot the way you least want to go
  // (D107).
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
    player.safe = DASH_TIME + DASH_GRACE;
    batchDashed = true;
    sound('dash');
  }
  // A dash is committed (D56): with the keys steering it, letting go would stop
  // you dead in free invulnerability. Out of it, the swim carries on at full
  // speed (D107).
  const dashing = player.dashTime > 0;
  if (dashing) {
    player.vx = player.dashDx * player.speed;
    player.vy = player.dashDy * player.speed;
  } else {
    ease(player, dx * player.speed, dy * player.speed, player.ramp, dt);
  }

  // Kept before the move; the clamp below then makes the segment the distance
  // travelled, not the distance asked for.
  const fromX = player.x, fromY = player.y;

  player.x += (dashing ? player.dashDx * player.dashSpeed : player.vx) * dt;
  player.y += (dashing ? player.dashDy * player.dashSpeed : player.vy) * dt;
  // An edge stops the swim into it, so no speed banks up against it (D107).
  const [cx, cy] = viewClamp(player);
  if (cx !== player.x) player.vx = 0;
  if (cy !== player.y) player.vy = 0;
  [player.x, player.y] = [cx, cy];

  // An afterimage, or the eye reads the dash as a teleport.
  if (player.dashTime > 0) {
    spark(player.x, player.y, 0, 0, 0.22, player.r * 0.85, '#bffcff', '#4ff0ff');
  }

  // --- the weapon fires while you hold the button, along the cursor (D28) ---
  // The cooldown stops at zero, not below, so holding gives an honest rate while
  // the first click is always instant. The ring is a real range (D8).
  player.fireTimer = Math.max(player.fireTimer - dt, 0);
  if (player.swingLeft > 0) player.swingLeft -= dt;
  if (player.fireTimer <= 0 && fireArmed && CLICK.some(c => keys.has(c))) {
    const tx = aim.x - player.x;
    // `aim` is in view coordinates (D22), converted where it is read: it changes
    // only on mousemove, so a world-space aim would go stale as the camera moves.
    const ty = aim.y + cameraY - player.y;
    const d = Math.hypot(tx, ty) || 1;   // || 1: cursor exactly on the player
    if (player.swing) swing(tx / d, ty / d);
    else bullets.push({
      id: ++bulletId,
      x: player.x, y: player.y, r: player.shotRadius,
      vx: (tx / d) * player.shotSpeed,
      vy: (ty / d) * player.shotSpeed,
      speed: player.shotSpeed,
      pierce: player.pierce,
      travelled: 0,
      maxTravel: player.range,
    });
    player.fireTimer = 1 / player.fireRate;
    sound('shoot');
  }

  // --- move enemies toward the diver, and let them attack ---
  const pd = Math.pow(PUSH_DRAG, dt);
  for (const e of enemies) {
    if (e.gone) continue;                  // cut down by a swing this tick: no step, no bite
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.sqrt(ex * ex + ey * ey) || 1;   // || 1 avoids dividing by zero
    const ux = ex / d, uy = ey / d;

    if (e.lunge) lungeStep(e, ux, uy, d, dt);
    else if (e.spit) spitStep(e, ux, uy, d, dt);
    else if (e.fuse) fuseStep(e, ux, uy, d, dt);
    else if (e.weave) weaveStep(e, ux, uy, d, dt);
    else if (e.bite) biteStep(e, ux, uy, d, dt);
    else {
      ease(e, ux * e.speed, uy * e.speed, e.ramp, dt);   // D107
      e.x += (e.vx + e.pushX) * dt;
      e.y += (e.vy + e.pushY) * dt;
    }

    e.pushX *= pd;
    e.pushY *= pd;

    // The dash's wave (D50). Facing is judged from where the frame started, so
    // an enemy the step overshot does not count as behind.
    if (dashing && e.lastHitBy !== player.dashId) {
      const dashReach = e.r + DASH_REACH;
      const fx = e.x - fromX, fy = e.y - fromY;
      const dot = fx * player.dashDx + fy * player.dashDy;
      // `dot / |f| > DASH_ARC`, squared to skip the root and the divide.
      if (segDistanceSq(e.x, e.y, fromX, fromY, player.x, player.y) < dashReach * dashReach &&
          dot > 0 && dot * dot > DASH_ARC * DASH_ARC * (fx * fx + fy * fy)) {
        e.lastHitBy = player.dashId;
        // The shove is never bought: it is what makes diving into a crowd a
        // play, and must survive `dashDamage` being zero.
        e.pushX = -ux * DASH_PUSH;
        e.pushY = -uy * DASH_PUSH;
        burst(e.x, e.y, '#bffcff', '#4ff0ff', 6, 130, 0.3);
        // The flash reads as "that hurt", so not on a dash that only pushed (D51).
        if (player.dashDamage > 0) {
          e.hp -= player.dashDamage;
          e.flash = 0.07;
          if (e.hp <= 0) killEnemy(e);
        }
      }
    }
  }
  separate(dt);

  // --- move bullets; they die at the edge of your range ---
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // The bullet's own speed (D83): counted at another, its range would be wrong.
    b.travelled += b.speed * dt;
    if (b.travelled >= b.maxTravel) b.gone = true;
  }

  // --- bullets vs enemies ---
  // ponytail: every bullet against every enemy. Fine to a few hundred of each;
  // if it ever chugs, bucket objects into a grid and only compare neighbours.
  for (const b of bullets) {
    if (b.gone || b.evil) continue;
    // Derived, not stored: unlike the diver, a bullet is never clamped.
    const ax = b.x - b.vx * dt, ay = b.y - b.vy * dt;
    for (const e of enemies) {
      if (e.gone) continue;
      // Swept (D53): a fixed step bounds the step, not a bullet's speed.
      const reach = e.r + b.r;
      if (segDistanceSq(e.x, e.y, ax, ay, b.x, b.y) < reach * reach) {
        if (e.lastHitBy === b.id) continue;   // a shot hits each enemy at most once
        e.lastHitBy = b.id;
        knock(e, b.vx / b.speed, b.vy / b.speed);
        hitSparks(e, b);
        hit(e);
        if (b.pierce > 0) { b.pierce -= 1; }
        else { b.gone = true; break; }
      }
    }
  }

  // --- enemy shots vs the diver (D95) ---
  // Swept (D53), and spent only by a hit that lands, so i-frames pass through.
  for (const b of bullets) {
    if (b.gone || !b.evil) continue;
    const reach = player.r + b.r;
    if (segDistanceSq(player.x, player.y, b.x - b.vx * dt, b.y - b.vy * dt, b.x, b.y) < reach * reach &&
        hurtPlayer(b, b.vx / b.speed, b.vy / b.speed)) b.gone = true;
  }

  // --- gems fly to you, from anywhere, and never fade (D35, D78) ---
  for (const g of gems) {
    const gx = player.x - g.x;
    const gy = player.y - g.y;
    const d = Math.sqrt(gx * gx + gy * gy) || 1;

    g.x += (gx / d) * GEM_PULL * dt;
    g.y += (gy / d) * GEM_PULL * dt;
    if (d < player.r + g.r + 4) {
      g.gone = true;
      sound('gem');
      currency += 1;
      gemPop.n += 1;
      gemPop.left = GEM_POP;
    }
  }
  if (gemPop.left > 0 && (gemPop.left -= dt) <= 0) {
    gemPop.flyN += gemPop.n;
    gemPop.n = 0;
    gemPop.fly = GEM_FLY;
  }
  if (gemPop.fly > 0 && (gemPop.fly -= dt) <= 0) {
    gemPop.flyN = 0;
    gemPop.bump = GEM_BUMP;
  }
  gemPop.bump = Math.max(0, gemPop.bump - dt);

  // --- what kills drop besides gems (D84, D86) ---
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
  const drag = Math.pow(0.06, dt);      // down to 6% of speed each second
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.life -= dt;
  }

  for (const e of enemies) {
    if (e.flash > 0) e.flash -= dt;
    if (e.bump > 0) e.bump -= dt;
  }

  const wasFighting = batchLive();
  enemies = enemies.filter(e => !e.gone);
  // A frame can kill both the last enemy and the diver: the death outranks the
  // clear, or dying on the boss's last hit would heal you.
  if (wasFighting && !batchLive() && screen === 'playing') clearBatch();
  bullets = bullets.filter(b => !b.gone);
  gems    = gems.filter(g => !g.gone);
  drops   = drops.filter(d => !d.gone);
  particles = particles.filter(p => p.life > 0);
  // Last, so a gem caught on the frame you die is yours (D67). Later ticks on
  // the end screen return above, so this runs once.
  if (screen === 'dead' || screen === 'won') endDive();
}
