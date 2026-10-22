// Balance measured, not felt (D128): the runners `npm run measure` prints and
// the balance suite checks. Dev-only, like every file here. Every comparison is
// paired: the same seeds on both sides.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { loadGame } from './harness.js';
import { makeDiver } from './bot.js';

// Five unless SEEDS asks for more: a career's kits vary, so a batch's figure
// moves with them, and ten seeds settle what five only hint at.
export const SEEDS = [1, 7, 42, 4471, 90210, 3, 11, 77, 2024, 31337].slice(0, +process.env.SEEDS || 5);
// HP held out of reach, its max too, so hearts lost are counted to the end of
// a fight, and a death read off them: nothing in a fight reads HP but the death
// itself and a heal's ceiling. Counted as it falls, since a Vitality heals.
const OUT = 1e6;

// A dive with a kit: `{ weapon, gear, raised, mods }`, each as the save and the
// cards hold them. The reference kit, the ruler threat is read with, is `{}`.
export function dive(seed, kit = {}) {
  const g = loadGame();
  Object.assign(g.meta, { gear: { ...kit.gear }, raised: { ...kit.raised } });
  g.reset(seed, g.WEAPONS.find(w => w.name === (kit.weapon || 'Gun')));
  for (const m of kit.mods || []) g.takeMod(g.MODS.find(x => x.name === m));
  return g;
}

// Puts the diver at gate `k`, where the next batch arrives.
function atGate(g, k) {
  g.batchIndex = k;
  g.cameraY = g.gateDepth(k);
  g.player.y = g.cameraY + g.ARENA_H / 2;
}

// One gate's fight alone, from full HP: `entry` is a plan entry, `{ layer,
// batch, escorts }`. Returns how long the clear took, the hearts it cost, and
// whether those were more than the diver had.
// `entry` may be a function of the game, for a batch graded with its draws.
export function fight(seed, kit, entry, { stand = false, cap = 300 } = {}) {
  const g = dive(seed, kit);
  if (typeof entry === 'function') entry = entry(g);
  const k = g.plan.findIndex(e => e.layer === entry.layer);
  g.plan[k] = entry;
  atGate(g, k);
  const hp = g.player.hp;
  g.player.hp = g.player.maxHp = OUT;
  const bot = makeDiver(seed, { stand });
  let t = 0, from = null, lost = 0;
  const tick = g.FIXED_DT;
  while (t < cap) {
    const was = g.player.hp;
    bot(g);
    g.update(tick);
    lost += Math.max(0, was - g.player.hp);
    t += tick;
    if (from === null && g.batchIndex > k) from = t;
    if (from !== null && !g.batchLive()) break;
  }
  return { cleared: from !== null && !g.batchLive(), time: from === null ? cap : t - from, lost, died: lost >= hp };
}

// The order a career spends in, Claude's pick: attribute points on the
// cheapest step, Strength first while the weapon carried needs it; then gems
// on the cheapest tier the weapon or the equipment offers, again and again.
function spend(g, weapon) {
  const w = g.WEAPONS.find(x => x.name === weapon);
  for (;;) {
    const need = Object.keys(w.requires || {}).find(a => (g.meta.raised[a] || 0) < w.requires[a]);
    const steps = g.ATTRIBUTES.map(a => [a, (g.meta.raised[a.name] || 0) + 1])
      .sort((a, b) => (a[0].name === need ? -1 : 0) - (b[0].name === need ? -1 : 0) || a[1] - b[1]);
    if (g.points() < steps[0][1]) break;
    g.raise(steps[0][0]);
  }
  if (!g.meta.owned.includes(weapon)) g.pickWeapon(w);
  if (g.meta.carried !== weapon) return;
  for (;;) {
    const next = [w, ...g.EQUIPMENT].map(x => [x, x.tiers[g.meta.gear[x.name] || 0]?.cost])
      .filter(([x, c]) => c !== undefined && c <= g.meta.bank && Object.entries(x.requires || {})
        .every(([a, n]) => (g.meta.raised[a] || 0) >= n))
      .sort((a, b) => a[1] - b[1])[0];
    if (!next) break;
    g.buy(next[0]);
  }
}

// A fresh save diving again and again, each dive its own seed, spending
// between dives. Records each dive, the kit each gate is first reached with --
// the gear expected when its batch is first met -- and how long each layer
// took the first time it was cleared.
export function career(seed, { weapon = 'Gun', dives = 30, cap = 3600 } = {}) {
  const g = loadGame();
  g.meta = g.freshMeta();
  const log = [], firstAt = [], layerTime = [], lastTime = [];
  let firstBuy = null;
  for (let n = 1; n <= dives; n++) {
    const before = JSON.stringify(g.meta.gear);
    g.reset(seed * 1000 + n);
    const bot = makeDiver(seed * 1000 + n);
    let t = 0, from = 0;
    while (t < cap && g.screen !== 'dead' && g.screen !== 'won') {
      const at = g.batchIndex;
      bot(g);
      g.update(g.FIXED_DT);
      t += g.FIXED_DT;
      if (g.batchIndex > at && !firstAt[at]) {
        firstAt[at] = { dive: n, weapon, gear: { ...g.meta.gear }, raised: { ...g.meta.raised },
                        mods: Object.entries(g.modCounts).flatMap(([m, c]) => Array(c).fill(m)) };
      }
      // A layer is done when the next one's first batch is called, or the win.
      const l = g.plan[at - 1]?.layer;
      if (l !== undefined && (g.plan[g.batchIndex - 1]?.layer > l || g.screen === 'won')) {
        if (layerTime[l] === undefined) layerTime[l] = t - from;
        lastTime[l] = t - from;
        from = t;
      }
    }
    if (g.screen === 'playing') g.endDive();
    log.push({ dive: n, end: g.screen, gates: g.batchIndex - (g.batchLive() ? 1 : 0), gems: g.currency, time: t });
    if (g.screen === 'won') break;
    g.screen = 'home';
    spend(g, weapon);
    if (firstBuy === null && JSON.stringify(g.meta.gear) !== before) firstBuy = n;
  }
  const firstLayer = l => firstAt.findIndex((_, k) => g.plan[k]?.layer === l);
  return { log, firstAt, layerTime, lastTime, firstBuy, meta: g.meta,
           reached: g.LAYERS.map((_, l) => firstAt[firstLayer(l)]?.dive) };
}

// ---------- threat ----------
// A fish's threat is one over the count of its type, at its grade, alone, that
// costs the diver one heart at the reference kit: so a batch's threat, the sum
// of its fish's, is about one at the knee where hearts start to go. Hearts
// grow far faster than the count past it, so it is measured there.
const FIT_SEEDS = Array.from({ length: 96 }, (_, i) => 100 + i);
export function hearts(batch, seeds = FIT_SEEDS, kit = {}) {
  const runs = seeds.map(seed => fight(seed, kit, { layer: 0, batch }));
  return mean(runs.map(r => r.lost));
}
export function oneHeart(name, grade, seeds = FIT_SEEDS) {
  const at = n => hearts({ enemies: [[name, n, grade]] }, seeds);
  let lo = 0, hLo = 0, hi = 1, hHi = at(1);
  while (hHi < 1 && hi < 256) { lo = hi; hLo = hHi; hi *= 2; hHi = at(hi); }
  while (hi - lo > 1) {
    const mid = Math.round(Math.sqrt(Math.max(lo, 1) * hi));
    if (mid <= lo || mid >= hi) break;
    const h = at(mid);
    if (h < 1) { lo = mid; hLo = h; } else { hi = mid; hHi = h; }
  }
  return lo + (1 - hLo) / (hHi - hLo || 1) * (hi - lo);
}
function threat(names) {
  const g = loadGame();
  // As `[threat, ...]` lines to paste, the count each came from beside it.
  const rows = (names ? names.split(',') : g.ENEMY_TYPES.map(t => t.name)).map(name => {
    const n = g.GRADES.map((_, i) => oneHeart(name, i + 1));
    return [name, '[' + n.map(x => (1 / x).toFixed(3)).join(', ') + ']', n.map(x => x.toFixed(1)).join(' / ')];
  });
  return table(['type', 'threat', 'one heart at'], rows);
}

// ---------- printing ----------
const fmt = v => (typeof v === 'number' ? +v.toFixed(2) : v);
export function table(head, rows) {
  return ['| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|',
          ...rows.map(r => '| ' + r.map(fmt).join(' | ') + ' |')].join('\n');
}
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;

function bots() {
  const rows = [];
  for (const seed of SEEDS) {
    for (const stand of [false, true]) {
      const g = dive(seed);
      const bot = makeDiver(seed, { stand });
      let t = 0;
      while (t < 3600 && g.screen !== 'dead' && g.screen !== 'won') { bot(g); g.update(g.FIXED_DT); t += g.FIXED_DT; }
      rows.push([seed, stand ? 'standing' : 'diver', g.screen, g.batchIndex, t, g.kills, g.currency]);
    }
  }
  return table(['seed', 'bot', 'end', 'gate', 's', 'kills', 'gems'], rows);
}

async function careers(weapon = 'Gun') {
  const rows = [];
  for (const [n, { career: c }] of (await report(weapon)).entries()) {
    const seed = SEEDS[n];
    rows.push([seed, c.firstBuy, ...c.reached.map(d => d ?? '—'),
               c.log.at(-1).end === 'won' ? c.log.length : '—',
               ...c.layerTime.map((t, l) => (t / 60).toFixed(1) + ' / ' + (c.lastTime[l] / 60).toFixed(1))]);
  }
  // A layer's minutes the first time it was cleared, and the last.
  const layers = loadGame().LAYERS.map((_, l) => 'layer ' + (l + 1));
  return table(['seed', 'first buy after', ...layers.map(L => L + ' at'), 'won at', ...layers.map(L => L + ' min')], rows);
}

export function stretchesOf(g) {
  let k = -1;
  return g.LAYERS.flatMap((L, l) => {
    const top = g.GRADES.findLastIndex(G => G.from <= l + 1) + 1;
    return L.stretches.map((s, i) => {
      if (!s.escorts) k += 1;
      return { l, i, s, top, target: g.THREAT_START * (g.THREAT_RISE ** (k + 1) - 1) / (g.THREAT_RISE - 1) };
    });
  });
}
// As drawPlan() grades it; a lead with each batch its escorts may come from.
const gateEntry = ({ l, s, top, target }, b) => gm => {
  if (!s.escorts) return { layer: l, batch: gm.graded(b, target, top) };
  const lead = gm.ofGrade(s.pool[0], Math.min(l + 1, top));
  return { layer: l, batch: lead, escorts: gm.graded(b, target - gm.batchThreat(lead), top) };
};
// Every pool batch a gate draws from, in the dive's order, with its stretch.
const gateBatches = g => {
  let gate = 0;
  return stretchesOf(g).flatMap(x => {
    const first = gate;
    gate += x.s.draw;
    return (x.s.escorts || x.s.pool).map((b, bi) => ({ ...x, b, bi, first }));
  });
};

// One seed's share of every measure: its career, then each pool batch, and
// each weapon over layers 2 and 3, at the kit that career first met it with.
// Seeds share nothing, so each runs in a worker of its own.
export function seedReport(seed, weapon = 'Gun') {
  const g = loadGame(), c = career(seed, { weapon });
  const gates = gateBatches(g).map(x => {
    const kit = c.firstAt[x.first];
    return kit && { run: fight(seed, kit, gateEntry(x, x.b)),
                    stand: fight(seed, kit, gateEntry(x, x.b), { stand: true, cap: 120 }) };
  });
  return { career: c, gates, weapons: weapon === 'Gun' ? [1, 2].map(l => weaponRuns(g, l, seed, c.firstAt)) : null };
}
function perSeed(task, args) {
  return Promise.all(SEEDS.map(seed => new Promise((resolve, reject) => {
    const w = new Worker(new URL(import.meta.url), { workerData: { measureTask: task, args: [seed, ...args] } });
    w.once('message', resolve);
    w.once('error', reject);
  })));
}
// Once a process: the balance suite's files share it.
const reports = {};
export const report = (weapon = 'Gun') => (reports[weapon] ??= perSeed('seedReport', [weapon]));

// Every pool batch, graded to its stretch, at the kit its first gate is first
// reached with in a career -- one career a seed, its own kit on its own seed --
// beside the standing bot.
export async function pillarRows(weapon = 'Gun', only) {
  const g = loadGame(), seeds = await report(weapon), rows = [];
  gateBatches(g).forEach(({ l, i, s, b, bi }, n) => {
    if (only !== undefined && l !== +only) return;
    const got = seeds.map(r => r.gates[n]).filter(Boolean);
    const runs = got.map(r => r.run), stands = got.map(r => r.stand);
    // A gate no career reached keeps its row, its kits 0, for a check to see.
    rows.push({ l, i, bi, fish: (s.escorts ? s.pool[0].enemies[0][0] + ' + ' : '') + b.enemies.map(e => e.join(' ')).join(', '),
                kits: runs.length, time: mean(runs.map(r => r.time)), max: Math.max(...runs.map(r => r.time)),
                hearts: mean(runs.map(r => r.lost)), lost: runs.filter(r => r.died || !r.cleared).length,
                stood: stands.filter(r => r.cleared && !r.died).length });
  });
  return rows;
}
async function pillars(weapon, only) {
  return table(['layer', 'stretch', '#', 'fish', 'kits', 'clear s', 'max s', 'hearts', 'lost', 'stood'],
    (await pillarRows(weapon, only)).map(r => [r.l + 1, r.i + 1, r.bi + 1, r.fish, r.kits, r.time, r.max, r.hearts, r.lost, r.stood]));
}

// Each weapon at a matched kit: the kit a Gun career first meets a layer with,
// the weapon swapped in at the Gun's tier there, Strength raised if it needs it.
const WEAPON_CAP = 150;
function weaponRuns(g, l, seed, firstAt) {
  const first = g.LAYERS.slice(0, l).reduce((a, L) => a + L.stretches.reduce((x, st) => x + st.draw, 0), 0);
  const ordinary = stretchesOf(g).filter(x => x.l === l && !x.s.escorts);
  const k = firstAt[first];
  return g.WEAPONS.map(w => {
    if (!k) return [];
    const kit = { ...k, weapon: w.name, gear: { ...k.gear, Gun: 0, [w.name]: k.gear.Gun || 0 },
                  raised: { ...k.raised, ...Object.fromEntries(Object.entries(w.requires || {}).map(([a, v]) => [a, Math.max(v, k.raised[a] || 0)])) } };
    // A fight past WEAPON_CAP is lost, so one held up cannot outweigh the rest.
    return ordinary.flatMap(({ s, top, target }) => s.pool.map(b => fight(seed, kit, gm => ({ layer: l, batch: gm.graded(b, target, top) }), { cap: WEAPON_CAP })));
  });
}
// Better beyond what two halves of the seeds disagree by: 5% on time, 10% on
// hearts (Claude's picks), and no fewer clears.
export const dominates = (a, b) => a.time < b.time * 0.95 && a.hearts < b.hearts * 0.9 && a.clears >= b.clears;
// Mid-to-late game is layers 2 and 3 together: a dive carries one weapon
// through both, so one that cannot pass the second never meets the third.
export async function weaponLayers() {
  const g = loadGame(), seeds = await report();
  const [two, three] = [0, 1].map(i => g.WEAPONS.map((w, wi) => {
    const runs = seeds.flatMap(r => r.weapons[i][wi]);
    return { weapon: w.name, time: mean(runs.map(r => r.time)), hearts: mean(runs.map(r => r.lost)),
             clears: runs.filter(r => r.cleared && !r.died).length / runs.length };
  }));
  const both = two.map((r, i) => ({ weapon: r.weapon, time: (r.time + three[i].time) / 2,
                                    hearts: (r.hearts + three[i].hearts) / 2, clears: (r.clears + three[i].clears) / 2 }));
  return { 'layer 2': two, 'layer 3': three, 'layers 2 and 3': both };
}
async function weapons() {
  return Object.entries(await weaponLayers()).map(([name, rows]) => table([name, 'clear s', 'hearts', 'clears', 'dominates'],
    rows.map(r => [r.weapon, r.time, r.hearts, r.clears, rows.filter(x => x !== r && dominates(r, x)).map(x => x.weapon).join(', ') || '—'])))
    .join('\n\n');
}

// ---------- fitting the pools ----------
// Every pool batch rescaled to its stretch's target, its mix of fish kept, and
// written back into game/content.js: in the first layer, grade 1 carries the
// target, so grading has little left to add -- all of it in the first stretch;
// deeper, the fewest fish grading can bring to the target under GRADE_KEEP.
// FIT_FIRST and FIT_REACH are Claude's picks: the share grade 1 carries in the
// first layer, and the margin grading must clear. `npm test` holds the result.
const FIT_FIRST = 0.92, FIT_REACH = 1.02;
function fit() {
  const g = loadGame(), most = n => Math.floor((1 - g.GRADE_KEEP) * n);
  const th = (name, grade) => g.ENEMY_TYPES.find(t => t.name === name).threat[grade - 1];
  const at1 = es => es.reduce((a, [n, c]) => a + c * th(n, 1), 0);
  const reach = (es, top) => es.reduce((a, [n, c]) => a + most(c) * th(n, top) + (c - most(c)) * th(n, 1), 0);
  const scaled = (es, f) => es.map(([n, c]) => [n, Math.max(1, Math.round(c * f))]);
  const rows = [];
  const fitted = stretchesOf(g).filter(x => !x.s.escorts).flatMap(({ l, top, target, s }) => s.pool.map(b => {
    const enough = l > 0 ? es => reach(es, top) >= FIT_REACH * target
      : es => at1(es) >= (target === g.THREAT_START ? 1 : FIT_FIRST) * target;
    // At or under the target past the first stretch: where a step of rounding
    // overshoots it, the last scale under it.
    const under = es => l > 0 || target === g.THREAT_START || at1(es) <= target;
    let f = 0.1 * target / at1(b.enemies), es = scaled(b.enemies, f), last = es;
    for (; !enough(es); es = scaled(b.enemies, f *= 1.01)) last = es;
    if (!under(es)) es = last;
    rows.push([l + 1, target, es.map(e => e.join(' ')).join(', '), es.reduce((a, [, c]) => a + c, 0), at1(es) / target, reach(es, top) / target]);
    return es;
  }));
  const file = new URL('../game/content.js', import.meta.url), src = readFileSync(file, 'utf8');
  const from = src.indexOf('const LAYERS = ['), to = src.indexOf('\n];', from);
  let n = 0;
  const block = src.slice(from, to).replace(/\{ enemies: \[.*?\] \}/g, () =>
    '{ enemies: [' + fitted[n++].map(([name, c]) => `['${name}', ${c}]`).join(', ') + '] }');
  if (n !== fitted.length) throw new Error(`LAYERS holds ${n} pool batches, the pools ${fitted.length}`);
  writeFileSync(file, src.slice(0, from) + block + src.slice(to));
  return table(['layer', 'target', 'fish', 'count', 'grade 1 / target', 'reach / target'], rows);
}

const COMMANDS = { bots, careers, threat, pillars, weapons, fit };
const TASKS = { seedReport };
if (!isMainThread && workerData?.measureTask) parentPort.postMessage(TASKS[workerData.measureTask](...workerData.args));
if (isMainThread && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd = 'bots', ...args] = process.argv.slice(2);
  console.log(await COMMANDS[cmd](...args.map(a => (a.startsWith('{') ? JSON.parse(a) : a))));
}
