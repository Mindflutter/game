// A scripted bot, so balance is numbers, not impressions (D16). Deliberately
// weak: for regression it only has to be consistent, and a brilliant bot would
// flatter the balance. See `ideas.md` -> "There are three bots".
import { loadGame } from './harness.js';

// The whole policy: aim at the nearest enemy, hold the trigger, back away.
// Bridged reads cross into the sandbox, so they are hoisted out of the loop.
export function kiteAndShoot(g) {
  const p = g.player;
  const px = p.x, py = p.y;
  // The middle of the *view*: a fixed centre would drag the bot to the top of
  // the layer.
  const cx = g.ARENA_W / 2, cy = g.cameraY + g.ARENA_H / 2;

  let near = null, best = Infinity;
  for (const e of g.enemies) {
    const dx = e.x - px, dy = e.y - py;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) { best = d2; near = e; }
  }

  g.keys.clear();
  if (!near) return;                        // clear() already released the trigger

  g.aim.x = near.x;
  g.aim.y = near.y - g.cameraY;           // aim is in the view, enemies in the world
  g.keys.add(g.CLICK[0]);

  // Retreat, but bias toward the middle rather than cornering ourselves.
  const vx = (px - near.x) + (cx - px) * 0.6;
  const vy = (py - near.y) + (cy - py) * 0.6;
  if (vx < -20) g.keys.add(g.LEFT[1]); else if (vx > 20) g.keys.add(g.RIGHT[1]);
  if (vy < -20) g.keys.add(g.UP[1]);   else if (vy > 20) g.keys.add(g.DOWN[1]);
}

// One tick of the bot's input, without the update: shared by `diveReport` and
// by tests that assert on every tick, so both play the same bot.
export function botInput(g) {
  // Always the first card: a bot choosing at random would build itself
  // differently every dive, and two different dives cannot be compared (D85).
  // Boosts it never seeks (D86), so its numbers stay a floor.
  if (g.screen === 'mods') {
    g.justPressed.add('Digit1');
    g.justPressed.add('Enter');
  } else kiteAndShoot(g);
}

// ---------- the diver bot (D128) ----------
// The balance bot: plays roughly as a player would, from what the screen shows,
// with a player's limits (`ideas.md` -> There are three bots). Its noise comes
// from a generator of its own, so it never moves the game's draws and a seed
// replays exactly. Every limit below is Claude's pick.
const THINK = 0.1;                 // s between decisions: a player's reaction
const LOOK = [0.1, 0.2, 0.3, 0.4]; // s ahead a way is judged by
const SCATTER = 0.04;              // rad, the spread of its aim
const ROOM = 14;                   // px it keeps past an attack's reach
const ATTENTION = 6;               // the nearest fish it watches; the rest go unseen
const LAPSE = 0.1;                 // the share of thoughts it misses, doing as it was
const WAYS = [[0, 0], ...Array.from({ length: 8 }, (_, k) =>
  [Math.round(Math.cos(k * Math.PI / 4)), Math.round(Math.sin(k * Math.PI / 4))])];

function mulberry(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// What a fish costs to be near, as circles round where it will be: the reach
// of its attack, how much that attack takes, and from when.
function dangers(e, p) {
  const near = e.r + p.r + ROOM;
  if (e.bite) return [[near + e.bite.reach, e.bite.damage, 0]];
  // An eel's sway is read as the band it fills, not where it is this instant.
  if (e.touch) return [[near + (e.weave ? e.weave.width : 0), e.touch.damage, 0]];
  if (e.fuse) {
    if (e.phase !== 'fuse') return [[e.fuse.trigger + ROOM, e.fuse.damage * 0.5, 0]];
    return [[e.fuse.blast + p.r + ROOM, e.fuse.damage * 2, e.fuse.time - e.phaseTime]];
  }
  if (e.lunge && e.phase === 'windup' && e.attack !== 'fan') {
    // The lane, as circles along it: where the charge will pass.
    const A = e.lunge, left = A.windup - e.phaseTime;
    return Array.from({ length: 6 }, (_, k) =>
      [near, A.damage, left, e.aimX * A.reach * k / 5, e.aimY * A.reach * k / 5]);
  }
  if (e.lunge) return [[near, e.lunge.damage, 0]];
  return [[near, 0.5, 0]];
}

export function makeDiver(seed, { stand = false } = {}) {
  const rnd = mulberry(seed ^ 0x5bd1e995);
  const s = { clock: 0, keys: [], target: null, turn: 0, last: new Map(), vel: new Map(), dash: false };
  return g => {
    if (g.screen === 'mods') {
      g.justPressed.add('Digit1');
      g.justPressed.add('Enter');
      return;
    }
    if (g.screen !== 'playing') return;
    s.clock -= g.FIXED_DT;
    if (s.clock <= 0) {
      s.clock += THINK;
      if (rnd() >= LAPSE) think(g, s, rnd, stand);
    }
    act(g, s);
  };
}

function think(g, s, rnd, stand) {
  const p = g.player, cam = g.cameraY, W = g.ARENA_W, H = g.ARENA_H;
  const near = e => (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
  const fish = g.enemies.filter(e => !e.gone).sort((a, b) => near(a) - near(b)).slice(0, ATTENTION);
  const shots = g.bullets.filter(b => b.evil && !b.gone);
  // A fish's swim, from where it was a thought ago: what a player reads.
  s.vel = new Map(fish.map(e => {
    const l = s.last.get(e);
    if (l) return [e, [(e.x - l[0]) / THINK, (e.y - l[1]) / THINK]];
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    return [e, [dx / d * e.speed, dy / d * e.speed]];
  }));
  s.last = new Map(fish.map(e => [e, [e.x, e.y]]));

  s.target = pick(p, fish);
  s.turn = gauss(rnd) * SCATTER;
  if (stand) { s.keys = []; s.dash = false; return; }

  const melee = !!p.swing;
  const want = s.target && (melee ? p.range + p.shotRadius + s.target.r - 10 : 0.75 * p.range);
  const boost = g.drops.filter(d => d.boost)
    .map(d => [d, Math.hypot(d.x - p.x, d.y - p.y)]).filter(([, d]) => d < 260)
    .sort((a, b) => a[1] - b[1])[0];
  let best = null;
  for (const [wx, wy] of WAYS) {
    const len = Math.hypot(wx, wy) || 1;
    const ux = wx / len, uy = wy / len;
    const harm = danger(p, fish, shots, s.vel, ux, uy, cam, W, H, LOOK);
    let pull = 0;
    const end = at(p, ux, uy, 0.4);
    if (s.target) {
      const v = s.vel.get(s.target);
      const tx = s.target.x + v[0] * 0.4, ty = s.target.y + v[1] * 0.4;
      pull -= Math.abs(Math.hypot(tx - end[0], ty - end[1]) - want) / 100;
    }
    if (boost) pull -= Math.hypot(boost[0].x - end[0], boost[0].y - end[1]) / 260;
    // A mild pull to the middle, so it is not caught in a corner.
    pull -= Math.hypot(end[0] - W / 2, end[1] - cam - H / 2) / 1200;
    const score = pull - harm * 3;
    if (!best || score > best.score) best = { ux, uy, wx, wy, score, harm };
  }
  s.keys = [];
  if (best.wx < 0) s.keys.push('KeyA'); else if (best.wx > 0) s.keys.push('KeyD');
  if (best.wy < 0) s.keys.push('KeyW'); else if (best.wy > 0) s.keys.push('KeyS');
  // Every way still lands a hit soon: the dash's safe moment is the way out.
  const soon = danger(p, fish, shots, s.vel, best.ux, best.uy, cam, W, H, [0.1, 0.2]);
  s.dash = soon > 0.3 && p.dashCd <= 0 && p.hurt <= 0;
}

// Where the diver will be `t` seconds on, swimming one way from its current
// swim: the average of now and the eased speed then, near enough.
function at(p, ux, uy, t) {
  const k = Math.pow(0.05, t / p.ramp);
  const vx = ux * p.speed + (p.vx - ux * p.speed) * k, vy = uy * p.speed + (p.vy - uy * p.speed) * k;
  return [p.x + (p.vx + vx) / 2 * t, p.y + (p.vy + vy) / 2 * t];
}

function danger(p, fish, shots, vel, ux, uy, cam, W, H, look) {
  let harm = 0;
  for (const t of look) {
    const [x, y] = at(p, ux, uy, t);
    const w = 1 / (1 + 2 * t);
    for (const e of fish) {
      const v = vel.get(e) || [0, 0];
      for (const [R, dmg, from, ox = 0, oy = 0] of dangers(e, p)) {
        if (t < from) continue;
        const dx = e.x + v[0] * t + ox - x, dy = e.y + v[1] * t + oy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) harm += dmg * w * (1 - Math.sqrt(d2) / R);
      }
    }
    for (const b of shots) {
      const R = b.r + p.r + ROOM;
      const dx = b.x + b.vx * t - x, dy = b.y + b.vy * t - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) harm += b.damage * w * (1 - Math.sqrt(d2) / R);
    }
    // The view's edges: room to move is room to live.
    const edge = Math.min(x - p.r, W - p.r - x, y - cam - p.r, cam + H - p.r - y);
    if (edge < 40) harm += 0.05 * (1 - edge / 40);
  }
  return harm;
}

// The fish that threatens most for the time it takes to kill: the glowing one
// first, as a player wants its mod.
function pick(p, fish) {
  let best = null, top = -Infinity;
  // A boss's crowd tops itself up and pays nothing (D116): the boss is the fight.
  const lead = fish.some(e => e.lead);
  for (const e of fish) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    const kill = Math.ceil(e.hp / p.damage) / p.fireRate;
    const reach = p.range + (p.swing ? p.shotRadius : 0) + e.r;
    let worth = (e.spit || e.fuse ? 2 : e.lunge ? 1.5 : 1) * (e.carrier ? 2 : 1) * (e.lead ? 4 : 1) * (lead && e.escort ? 0.5 : 1);
    // A shut shell is seen: shots go elsewhere until it rests (D156).
    if (e.shell && e.phase !== 'rest') worth *= 0.1;
    if (d > reach) worth *= 0.3;
    const score = worth / (kill + d / 400 + 0.2);
    if (score > top) { top = score; best = e; }
  }
  return best;
}

// Every tick: the keys from the last thought, the aim kept on the target ahead
// of its swim, the trigger held while it is in reach.
function act(g, s) {
  const p = g.player;
  g.keys.clear();
  for (const k of s.keys) g.keys.add(k);
  if (s.dash) { g.justPressed.add('Space'); s.dash = false; }
  const e = s.target;
  // A trigger held from the start is never armed (D47): let go once first.
  if (!e || e.gone || !g.fireArmed) return;
  const v = s.vel.get(e) || [0, 0];
  let tx = e.x, ty = e.y;
  if (!p.swing) {
    // Where the shot meets it, at the shot's speed: two passes are near enough.
    for (let i = 0; i < 2; i++) {
      const t = Math.hypot(tx - p.x, ty - p.y) / p.shotSpeed;
      tx = e.x + v[0] * t;
      ty = e.y + v[1] * t;
    }
  }
  const a = Math.atan2(ty - p.y, tx - p.x) + s.turn, d = Math.hypot(tx - p.x, ty - p.y);
  g.aim.x = p.x + Math.cos(a) * d;
  g.aim.y = p.y + Math.sin(a) * d - g.cameraY;
  const reach = p.range + (p.swing ? p.shotRadius : 0) + e.r;
  if (Math.hypot(e.x - p.x, e.y - p.y) <= reach) g.keys.add('Mouse0');
}

// `batchIndex > times.length` means a begun batch is still unrecorded, so the
// quiet beat between batches cannot re-arm the timer. `immortal` is how a
// traverse time is taken: the mortal bot dies before the bottom. A `scenario`
// starts from a named setup (D37), such as the boss fight alone (D63).
export function diveReport(seed, batches = 5, secondsCap = 180, immortal = false, scenario) {
  const g = loadGame();
  if (scenario) g.applyScenario(scenario, seed);
  else g.reset(seed);
  g.immortal = immortal;
  const base = g.batchIndex;

  const TICK = g.FIXED_DT;
  const tickCap = Math.round(secondsCap / TICK);

  const times = [];
  let ticks = 0, seen = 0, startTick = 0;

  while (times.length < batches && ticks < tickCap && g.screen !== 'dead' &&
         g.screen !== 'won') {
    if (g.batchIndex !== seen) { seen = g.batchIndex; startTick = ticks; }
    botInput(g);
    g.update(TICK);                      // update() clears justPressed itself
    ticks++;
    if (g.batchIndex - base > times.length && !g.batchLive()) {
      times.push(+((ticks - startTick) * TICK).toFixed(2));
    }
  }
  return { seed, alive: g.screen !== 'dead', won: g.screen === 'won', ranFor: +(ticks * TICK).toFixed(1),
           hpLeft: g.player.hp, clearTimes: times };
}
