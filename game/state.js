// ===== state: everything a dive owns, so restarting is one call =====

// ---------- game state ----------
let player, enemies, bullets, gems, drops, particles;
let gemPop = { n: 0, left: 0, flyN: 0, fly: 0, bump: 0 };   // the +N (D35): gems summed over the diver, then flown to the counter
let elapsed, kills, shake;
let queuePaused = false;    // a scenario can stop the batch queue (D37)

// `batchIndex` counts batches begun and never resets in a dive, so it is also
// how many are cleared. `breathTimer` is only the quiet beat before the first
// batch (GATE_PAUSE); "at a gate" is `batchLive()`.
let batchIndex = 0;
let breathTimer = 0;

// The batch's fish still to come (D115): `{ name, at }`, soonest first, `at`
// on `elapsed`.
let incoming = [];

function batchLive() { return enemies.length > 0 || incoming.length > 0; }

// The dive's batches, drawn from its seed as it starts (D71): `{ layer, batch }`
// per gate, each layer's last marked `end`. Entry k waits at `gateDepth(k)`.
let plan = [];

// Hit, or dashed, since the batch arrived: `untouched` and `footwork` (D109).
let batchHit = false;
let batchDashed = false;
// Hits the suit can still take this batch (D100).
let guardLeft = 0;
// The challenges' counts (D109): streaks by name, recent kill times for
// `flurry`, the batch's first kill and glowing fish's death for `beeline`, the
// layer's start for `swift` -- null until each happens, or for a layer begun
// partway.
let tally = {};
let killTimes = [];
let firstKillAt = null;
let glowAt = null;
let layerStart = null;

// A challenge paying out, shown `noticeTime` more seconds.
let notice = '';
let noticeTime = 0;
// Rungs paid this tick, so two paying at once share the notice (D109). Emptied
// as each tick begins, so never saved.
let paidNow = [];
// A pickup, named as it lands (D84, D86), on its own line so a mod flying in
// cannot write over the challenge its clear just paid.
let banner = '';
let bannerTime = 0;

// Begun and not yet ended: what the save writes as the dive in progress (D70),
// and what makes the title's Start a Continue.
let diveLive = false;

// How far down the world the top of the view sits. A dive lives in world
// coordinates; only `aim` and the HUD are in the view.
let cameraY = 0;
// The current (D58), never zero, and how far the water has flowed: the camera
// holds in a fight, the background scrolls by `waterY` regardless.
let current = 0;
let waterY = 0;

// Armed only once the button is seen released: a menu reads a click as an
// edge, the weapon as held, so one click would also fire into the dive (D47).
let fireArmed = false;

// The carried weapon (D83, D97); its numbers are on the player.
let weaponName = '';

// `currency` is the dive's takings; `modCounts` how often each mod was taken,
// so a capped one is never drawn; `choices` the layer end's cards (D85).
let currency, choices, modCounts;

// Seconds until the layer end's cards, from the boss's death, so the death
// finishes playing first.
let offerTimer = 0;

// Mods dealt this round: none again until every uncapped one has come.
let modRound = [];
// Boosts running, `{ name, left }`, and kills since one dropped (D86).
let boosts = [];
let sinceBoost = 0;

// 'title' | 'home' | 'weapons' | 'equipment' | 'attributes' | 'playing' | 'mods' |
// 'paused' | 'help' | 'options' | 'dead' | 'won' | 'goHome' | 'newGame' | 'debug'
let screen = 'title';
let menuIndex = 0;          // cursor in whichever menu is up
let choiceIndex = 0;        // the marked card at a layer end (D85)
let lastAimX = 0, lastAimY = 0;   // so a still mouse doesn't fight the arrows
let optionIndex = 0;
let returnTo = 'title';     // where Esc goes back to from help / options
let resumeTo = 'playing';   // where the pause menu and the title's Continue
                            // go back to: play, or the layer end's cards

// ---------- randomness ----------
// Every random number in a dive comes from here, so a seed replays the dive
// exactly. mulberry32: tiny, fast, fine for gameplay, not for cryptography.
let rngState = 0;
let currentSeed = 0;

function seedRng(seed) {
  currentSeed = seed >>> 0;
  rngState = currentSeed;
}

// Choosing a seed is the one draw outside the seeded sequence.
function newSeed() {
  return (Math.random() * 0x100000000) >>> 0;
}

function rng() {
  rngState = (rngState + 0x6D2B79F5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function drawDistinct(pool, n) {
  const left = [...pool], out = [];
  while (out.length < n && left.length) {
    out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  }
  return out;
}

// `weapon`: home's choice (D97), the first if the save names one that is gone.
function reset(seed, weapon = WEAPONS.find(w => w.name === meta.carried) || WEAPONS[0]) {
  seedRng(seed === undefined ? newSeed() : seed);
  // First, before anything else draws: the whole dive's batches (D71).
  plan = drawPlan();
  // The weapon's numbers go onto the player, where mods and the readout find them.
  const shot = shotOf(weapon);
  weaponName = weapon.name;
  player = {
    ...PLAYER_START,
    ...shot,
    x: ARENA_W / 2,
    y: ARENA_H / 2,
    vx: 0,             // the swim's velocity, eased toward the keys (D107)
    vy: 0,
    facing: Math.PI / 2,   // where the body points, a dash's way; down, into the abyss
    hurt: 0,           // seconds of invulnerability left after a hit: it blinks
    safe: 0,           // seconds of the dash's invulnerability left: no blink (D121)
    fireTimer: 0,      // seconds until the next shot
    dashTime: 0,       // seconds of dash left, 0 when not dashing
    dashCd: 0,         // seconds until the dash is ready again
    dashId: 0,         // shares the bullet id space, so one dash hits an
                       // enemy at most once (same trick as pierce)
    dashDx: 1,         // direction the wave faces, frozen at the dash's start
    dashDy: 0,         // so letting go of the keys can't spin it
    dashEnd: 0,        // seconds of the closing ring left
  };
  // What persists, added once (D36): the carried weapon's and the equipment's
  // tiers, each attribute's steps. Mods add on top; nothing multiplies.
  for (const g of [weapon, ...EQUIPMENT]) {
    for (let i = 0; i < (meta.gear[g.name] || 0); i++) g.tiers[i].apply(player);
  }
  for (const a of ATTRIBUTES) for (let i = 0; i < (meta.raised[a.name] || 0); i++) a.apply(player);
  if (damageOverride > 0) player.damage = damageOverride;   // a dev flag
  guardLeft = player.guard;
  enemies = [];
  bullets = [];
  gems = [];
  drops = [];
  particles = [];
  gemPop = { n: 0, left: 0, flyN: 0, fly: 0, bump: 0 };
  elapsed = 0;         // seconds survived
  kills = 0;
  queuePaused = false;
  batchIndex = 0;
  incoming = [];
  breathTimer = GATE_PAUSE;
  cameraY = 0;         // every dive starts at the top of the first layer (D66)
  current = CURRENT_CRAWL;
  waterY = 0;
  fireArmed = false;     // a click that started the dive is not a shot
  bulletId = 0;        // or two dives with the same seed hand out different ids
  shake = 0;           // pixels of screen shake left
  screen = 'playing';

  currency = 0;
  offerTimer = 0;
  modRound = [];
  boosts = [];
  sinceBoost = 0;
  accumulator = 0;     // no banked time carried into a new dive
  choices = [];
  modCounts = {};
  choiceIndex = 0;
  batchHit = false;
  batchDashed = false;
  tally = {};
  killTimes = [];
  firstKillAt = null;
  glowAt = null;
  layerStart = null;
  notice = '';
  noticeTime = 0;
  paidNow = [];
  banner = '';
  bannerTime = 0;
  diveLive = true;
}

function shotOf({ name, tiers, cost, requires, ...shot }) {
  return shot;
}

function applyScenario(name, seed) {
  const s = SCENARIOS[name];
  if (!s) return false;
  startScenario(s, seed);
  return true;
}

function startScenario(s, seed) {
  reset(seed, WEAPONS.find(w => w.name === s.weapon));
  // `!== undefined`, or `batch: 0` is unreachable. Camera and player start at
  // the batch's depth, or a deep scenario would descend all the way first.
  const b = typeof s.batch === 'function' ? s.batch(plan) : s.batch;
  if (b !== undefined) {
    batchIndex = b;
    cameraY = gateDepth(b);
    player.y = cameraY + ARENA_H / 2;
  }
  for (const name of s.kit || []) takeMod(MODS.find(m => m.name === name));
  if (s.spawn === false) queuePaused = true;
  // Scenario positions are in the view, so they hold at any depth.
  for (const [type, x, y] of s.enemies || []) placeEnemy(type, x, cameraY + y);
}

// ---------- what persists ----------
// Everything that outlives a dive (D31, D36, D67). Points available are
// derived (`points()`), never stored, so they cannot disagree with the rungs.
// An unknown `version` is rejected loudly, never guessed at.
const SAVE_VERSION = 11;
// Weapons cost nothing to own from the start, and the first is carried (D97).
function freshMeta() {
  return { version: SAVE_VERSION, bank: 0, gear: {}, raised: {}, challenges: {},
           deepest: 0, cleared: 0,
           owned: WEAPONS.filter(w => !w.cost).map(w => w.name), carried: WEAPONS[0].name };
}
let meta = freshMeta();

// ---------- the dive, as data (D70) ----------
// A copy of these variables is the dive, and plays on exactly (D70). Every
// variable a dive owns must be here: tests/save.test.js diverges on one missed.
// Cards hold functions, so they go by name; `at` is where play resumes.
function snapshot() {
  return { player, enemies, bullets, gems, drops, particles, elapsed, kills, shake,
           queuePaused, batchIndex, incoming, breathTimer, cameraY, current, waterY,
           fireArmed, currency, modCounts, offerTimer, choiceIndex,
           choices: choices.map(c => c.name), accumulator, rngState,
           currentSeed, bulletId, plan, batchHit, notice, noticeTime,
           banner, bannerTime, modRound, boosts, sinceBoost, weaponName, guardLeft,
           batchDashed, tally, killTimes, firstKillAt, glowAt, layerStart,
           at: screen === 'playing' || screen === 'mods' ? screen : resumeTo };
}

function restore(d) {
  ({ player, enemies, bullets, gems, drops, particles, elapsed, kills, shake,
     queuePaused, batchIndex, incoming, breathTimer, cameraY, current, waterY,
     fireArmed, currency, modCounts, offerTimer, choiceIndex,
     accumulator, rngState, currentSeed, bulletId, plan, batchHit, notice,
     noticeTime, banner, bannerTime, modRound, boosts, sinceBoost, weaponName,
     guardLeft, batchDashed, tally, killTimes, firstKillAt, glowAt, layerStart } = d);
  choices = d.choices.map(n => MODS.find(m => m.name === n));
  resumeTo = d.at;
  diveLive = true;
}

// The settings sit beside what persists, so New game keeps them (D113).
function saveText() {
  return JSON.stringify({ ...meta, settings: { volume, muted, shakeLevel, showFps },
                          dive: diveLive ? snapshot() : null });
}

// One version at a time; what each step makes up for is `design.md` → The save.
function migrate(s) {
  if (s && s.version === 1) {
    if (s.dive) s.dive.player = { shotSpeed: 430, shotRadius: 4, ...s.dive.player };
    s.version = 2;
  }
  if (s && s.version === 2) {
    const d = s.dive;
    if (d) {
      const marked = d.at === 'mods' && MODS.find(m => m.name === d.choices[d.choiceIndex]);
      if (marked) {
        marked.apply(d.player);
        d.modCounts[marked.name] = (d.modCounts[marked.name] || 0) + 1;
      }
      delete d.rank;
      Object.assign(d, { at: 'playing', choices: [], offerTimer: 0, drops: [], boosts: [],
                         sinceBoost: 0, modRound: [], banner: '', bannerTime: 0 });
    }
    const was = ['The Shelf', 'The Drop'];
    s.tasks = Object.fromEntries(Object.entries(s.tasks || {})
      .map(([k, v]) => [was.includes(k) ? was.indexOf(k) : k, v]));
    s.version = 3;
  }
  if (s && s.version === 3) {
    Object.assign(s, { owned: ['Gun'], carried: 'Gun' });
    if (s.dive) {
      Object.assign(s.dive, { weaponName: 'Gun', guardLeft: 0, batchTime: 0, batchDashed: false });
      s.dive.player.guard = 0;
    }
    s.version = 4;
  }
  if (s && s.version === 4) {
    if (s.dive) {
      Object.assign(s.dive.player, { vx: 0, vy: 0, facing: Math.PI / 2 });
      for (const e of s.dive.enemies) Object.assign(e, { vx: 0, vy: 0 });
    }
    s.version = 5;
  }
  if (s && s.version === 5) {
    if (s.dive) {
      for (const e of s.dive.enemies) {
        const t = enemyType(e.name);
        if (t) Object.assign(e, behaviourOf(t));
      }
    }
    s.version = 6;
  }
  if (s && s.version === 6) {
    const paid = Object.values(s.tasks || {});
    s.challenges = Object.fromEntries(['untouched', 'swift', 'footwork']
      .map(name => [name, paid.filter(l => l[name]).length]).filter(([, n]) => n));
    delete s.tasks;
    delete s.spent;
    s.raised = {};
    if (s.dive) {
      delete s.dive.batchTime;
      Object.assign(s.dive, { tally: {}, killTimes: [], firstKillAt: -1, glowAt: null, layerStart: null });
    }
    s.version = 7;
  }
  if (s && s.version === 7) {
    if (s.dive) s.dive.incoming = [];
    s.version = 8;
  }
  if (s && s.version === 8) {
    if (s.dive) {
      // Onto the attacks a fish has: a boss saved before its fan still only lunges.
      for (const e of s.dive.enemies) {
        const t = enemyType(e.name) || {};
        for (const [k, v] of Object.entries(e)) if (v && typeof v === 'object' && t[k] && 'damage' in t[k]) v.damage = 1;
        if (e.touch) e.touch = 1;
      }
      for (const b of s.dive.bullets) if (b.evil) b.damage = 1;
    }
    s.version = 9;
  }
  if (s && s.version === 9) {
    const d = s.dive;
    if (d) {
      // A fish knocks as its type does now (D122), an eel's touch its record
      // like every attack's; a shot already fired, as fired: not at all.
      for (const e of d.enemies) {
        const t = enemyType(e.name) || {};
        if (typeof e.touch === 'number') e.touch = { damage: e.touch };
        for (const [k, v] of Object.entries(e)) {
          if (v && typeof v === 'object' && 'damage' in v) v.knock = t[k] ? t[k].knock : 0;
        }
      }
      for (const b of d.bullets) if (b.evil) b.knock = 0;
      d.player.knock = (WEAPONS.find(w => w.name === d.weaponName) || WEAPONS[0]).knock;
    }
    s.version = 10;
  }
  if (s && s.version === 10) {
    const d = s.dive;
    if (d) {
      // What each boost added then, so one running comes off as it went on (D125).
      const was = { Rush: { speed: 200 }, Frenzy: { fireRate: 3 }, Lance: { pierce: 4 }, Bloom: { shotRadius: 6 } };
      for (const a of d.boosts) a.add = was[a.name];
      d.drops = d.drops.filter(x => x.boost !== 'Lance' || d.weaponName === 'Gun');
      d.player.splash = 0;
    }
    s.version = 11;
  }
  return s;
}

// '' when loaded or nothing to load; otherwise why it was refused, having
// changed nothing, so the caller can keep the text aside.
function loadSave(text) {
  if (text === null || text === undefined) return '';
  let s;
  try { s = migrate(JSON.parse(text)); } catch { return 'the save could not be read'; }
  if (!s || s.version !== SAVE_VERSION) {
    return 'the save is version ' + (s && s.version) + ', this build reads ' + SAVE_VERSION;
  }
  const { dive, settings = {}, ...kept } = s;
  meta = { ...freshMeta(), ...kept };
  // An odd setting keeps its default rather than refusing the save: a
  // preference is not worth the progress beside it.
  if (typeof settings.muted === 'boolean') muted = settings.muted;
  if (typeof settings.showFps === 'boolean') showFps = settings.showFps;
  if (typeof settings.volume === 'number' && settings.volume >= 0 && settings.volume <= 1) volume = settings.volume;
  if (Number.isInteger(settings.shakeLevel) && SHAKE_LEVELS[settings.shakeLevel]) shakeLevel = settings.shakeLevel;
  if (dive) restore(dive);
  return '';
}

let volume = 0.6;           // master gain, 0..1
let muted = false;          // M flips it (platform/audio.js); the debug mode starts muted (D102)
let shakeLevel = 2;         // index into SHAKE_LEVELS
let showFps = false;

// Dev flags (D102), set by the debug setup, the tests and the bot. Not part of a
// dive, so reset() leaves them and they survive Dive again.
let immortal = false;       // nothing can hurt the player
let damageOverride = 0;     // above 0, every shot does this much

// Set by `?debug` at boot and never unset; while set, nothing is saved.
let debugSetup = null;

function openScreen(name) {
  returnTo = screen;
  screen = name;
  optionIndex = 0;
}
