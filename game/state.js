// ===== state =====
// Everything a dive owns, plus the settings the options screen edits.

// ---------- game state ----------
// Everything a dive owns lives here, so restarting is one call.
let player, enemies, bullets, gems, drops, particles;
let elapsed, kills, shake;
let queuePaused = false;    // a scenario can stop the batch queue (D37)

// Where the batch queue stands (D27). `batchIndex` counts batches *begun* and
// never resets within a dive, so it is also how many have been cleared.
//
// `breathTimer` counts only the quiet beat before a dive's *first* batch
// (GATE_PAUSE); every later batch waits on the descent (D58). It is not a gate
// flag: a gate is the whole stretch where the descent is stopped, fight
// included, so "at a gate" is `enemies.length > 0`.
let batchIndex = 0;
let breathTimer = 0;

// The dive's batches, drawn whole from its seed when it starts (D71): one
// entry per gate, `{ layer, batch }`, the last of each layer marked `end`.
// The abyss is one tall strip (D72), so entry k waits at `gateDepth(k)`
// whichever layer it belongs to, and the bottom is `plan.length`.
let plan = [];

// Whether the player has taken a hit since the current batch arrived -- what
// the "untouched" micro-task reads when the batch clears (D36).
let batchHit = false;
// Hits the suit can still take this batch (D100): `player.guard`, refilled as
// each batch arrives.
let guardLeft = 0;
// Seconds since the current batch arrived, and whether the diver has dashed
// since: what `swift` and `footwork` read when it clears (D98).
let batchTime = 0;
let batchDashed = false;

// A line of text shown for a moment over play, and how many seconds it has
// left: a micro-task paying out. The layer's name needs no state -- it is
// derived from the plan and the camera.
let notice = '';
let noticeTime = 0;
// The same for a pickup -- a mod or a boost, named as it lands (D84, D86) --
// on a line of its own, so a batch's mod flying in cannot write over the
// micro-task its clear just paid.
let banner = '';
let bannerTime = 0;

// A dive is under way: begun, and not yet ended by death or the win. What the
// save writes as the dive in progress (D70), and what turns the title's Start
// into Continue.
let diveLive = false;

// The camera: how far down the world the top of the view sits. Everything
// in a dive lives in world coordinates; only `aim` and the HUD are in the view.
let cameraY = 0;
// The current (D58): its speed, which is never zero, and how far the water has
// flowed. The camera holds during a fight; the water does not -- `waterY` is
// what the background scrolls by, so the flow shows while nothing else moves.
let current = 0;
let waterY = 0;

// The trigger is armed only once the button has been seen released. A menu
// reads a click as an edge (justPressed) while the weapon reads it as a held
// state (keys), so without this one physical click is read twice: the click
// that starts a dive would also fire into it (D47).
let fireArmed = false;

// The carried weapon's name: what the dive fires (D83), and which weapon mods
// fit it (D97). Its numbers are on the player.
let weaponName = '';

// In-dive progress, reset every dive. `currency` is the dive's takings, spent
// at `home`. `modCounts` is how many times each mod has been taken, which is
// what lets the draws refuse one that is already maxed. `choices` is the layer
// end's cards (D85).
let currency, choices, modCounts;

// Seconds until the layer end's cards appear, counting from the boss dying.
// `> 0` means "the layer is cleared and the offer is coming" -- the death gets
// to finish playing before the game asks you to read three cards.
let offerTimer = 0;

// The ordinary mods dealt in the current round, by name: none comes again until
// every one still under its cap has come once (`drawCarried()`).
let modRound = [];
// The boosts running, `{ name, left }` with `left` in seconds, and the kills
// since a boost last dropped -- the chance of the next grows with it (D86).
let boosts = [];
let sinceBoost = 0;

// Which screen we're on: one variable, so there is exactly one answer at a time.
// 'title' | 'home' | 'gear' | 'attributes' | 'playing' | 'mods' | 'paused' |
// 'help' | 'options' | 'dead' | 'won'
let screen = 'title';
let menuIndex = 0;          // cursor in whichever menu is up
let choiceIndex = 0;        // the marked card at a layer end (D85)
let lastAimX = 0, lastAimY = 0;   // so a still mouse doesn't fight the arrows
let optionIndex = 0;        // cursor in the options list
let returnTo = 'title';     // where Esc goes back to from help / options
let resumeTo = 'playing';   // where the pause menu and the title's Continue
                            // go back to: play, or the layer end's cards

// ---------- randomness ----------
// Every random number in a dive comes from here, seeded, so the same seed
// replays the same dive exactly. That is what lets two balance measurements be
// of the *same* game instead of two different ones, and it turns "it broke
// sometimes" into "it broke on seed 4471".
//
// mulberry32: 32 bits of state, one multiply-xor-shift round. Tiny, fast, and
// statistically fine for gameplay -- this is not cryptography.
let rngState = 0;
let currentSeed = 0;

function seedRng(seed) {
  currentSeed = seed >>> 0;
  rngState = currentSeed;
}

function rng() {
  rngState = (rngState + 0x6D2B79F5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// `n` distinct picks from `pool`, in the order drawn -- fewer if it runs out.
// A copy, so the splicing doesn't wreck the table. Every seeded draw without
// repeats goes through here.
function drawDistinct(pool, n) {
  const left = [...pool], out = [];
  while (out.length < n && left.length) {
    out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  }
  return out;
}

// The one deliberate exception: *choosing* a seed is not part of the
// deterministic sequence, so an unseeded dive picks one at random. A port does
// the same with whatever its language offers.
// `weapon` is the one home chose (D97) -- or the first, when the save names
// one that is gone -- unless a scenario names another.
function reset(seed, weapon = WEAPONS.find(w => w.name === meta.carried) || WEAPONS[0]) {
  seedRng(seed === undefined ? (Math.random() * 0x100000000) >>> 0 : seed);
  // First, before anything else draws: the whole dive's batches (D71).
  plan = drawPlan();
  // The diver, carrying a weapon: its numbers go onto the player, where mods,
  // attributes and the readout find them (D83).
  const { name, tiers, cost, requires, ...shot } = weapon;
  weaponName = name;
  player = {
    ...PLAYER_START,
    ...shot,
    x: ARENA_W / 2,
    y: ARENA_H / 2,
    hurt: 0,           // seconds of invulnerability left
    fireTimer: 0,      // seconds until the next shot
    dashTime: 0,       // seconds of dash left, 0 when not dashing
    dashCd: 0,         // seconds until the dash is ready again
    dashId: 0,         // shares the bullet id space, so one dash hits an
                       // enemy at most once (same trick as pierce)
    dashDx: 1,         // direction the wave faces, frozen at the dash's start
    dashDy: 0,         // so letting go of the keys can't spin it
    dashEnd: 0,        // seconds of the closing ring left
  };
  // What persists, added to the start (D36): each tier of the carried weapon
  // and of the equipment, and each point, applied once. A weapon left at home
  // adds nothing. Mods add on top during the dive; nothing multiplies.
  for (const g of [weapon, ...EQUIPMENT]) {
    for (let i = 0; i < (meta.gear[g.name] || 0); i++) g.tiers[i].apply(player);
  }
  for (const a of ATTRIBUTES) for (let i = 0; i < (meta.spent[a.name] || 0); i++) a.apply(player);
  if (damageOverride > 0) player.damage = damageOverride;   // a dev flag
  guardLeft = player.guard;
  enemies = [];
  bullets = [];
  gems = [];
  drops = [];
  particles = [];
  elapsed = 0;         // seconds survived
  kills = 0;
  queuePaused = false;   // scenarios switch this on; normal play never does
  batchIndex = 0;
  breathTimer = GATE_PAUSE;   // a dive opens on the beat, so it starts calm
  cameraY = 0;         // every dive starts at the top of the first layer (D66)
  current = CURRENT_CRAWL;   // the water is already moving when a dive opens
  waterY = 0;
  fireArmed = false;     // a click that started the dive is not a shot
  bulletId = 0;        // or two dives with the same seed hand out different ids
  shake = 0;           // pixels of screen shake left
  screen = 'playing';  // a reset dive is a running dive

  currency = 0;
  offerTimer = 0;      // no offer pending on a fresh dive
  modRound = [];
  boosts = [];
  sinceBoost = 0;
  accumulator = 0;     // no banked time carried into a new dive
  choices = [];
  modCounts = {};      // mods are dive-scoped: last dive's picks do not carry
  choiceIndex = 0;
  batchHit = false;
  batchTime = 0;
  batchDashed = false;
  notice = '';
  noticeTime = 0;
  banner = '';
  bannerTime = 0;
  diveLive = true;
}

// Loads a named scenario from SCENARIOS (D37). Starts from a clean reset, so a
// scenario is a dive like any other -- just one that was set up rather than
// spawned into. Returns false for an unknown name so the caller can complain.
function applyScenario(name, seed) {
  const s = SCENARIOS[name];
  if (!s) return false;
  reset(seed, WEAPONS.find(w => w.name === s.weapon));
  // `!== undefined`, or `batch: 0` would be unreachable. The camera starts at
  // that batch's depth, or a deep scenario would first descend the whole way.
  // The player moves with it, or a stepped scenario draws them off-screen.
  // A function of the plan where the batch is only known once drawn (D71).
  const b = typeof s.batch === 'function' ? s.batch(plan) : s.batch;
  if (b !== undefined) {
    batchIndex = b;
    cameraY = gateDepth(b);
    player.y = cameraY + ARENA_H / 2;
  }
  // A stated kit: taken as picks, as if picked up on the way down.
  for (const name of s.kit || []) takeMod(MODS.find(m => m.name === name));
  if (s.spawn === false) queuePaused = true;
  // Scenario positions are in the view, so they hold at any depth.
  for (const [type, x, y] of s.enemies || []) placeEnemy(type, x, cameraY + y);
  return true;
}

// ---------- what persists ----------
// Everything that outlives a dive (D31, D36, D67): the gems banked, gear tiers
// and attribute points held -- keyed by name -- the micro-tasks done per layer,
// the deepest the camera has been and how many layers have been cleared. Points
// *available* are derived (`points()`), never stored, so they cannot disagree
// with the tasks that paid them.
//
// `version` from the first write (foundations.md -> The technical contract). A
// save this build does not know is rejected loudly, never guessed at.
const SAVE_VERSION = 4;
// Weapons cost nothing to own from the start, and the first is carried (D97).
function freshMeta() {
  return { version: SAVE_VERSION, bank: 0, gear: {}, spent: {}, tasks: {},
           deepest: 0, cleared: 0,
           owned: WEAPONS.filter(w => !w.cost).map(w => w.name), carried: WEAPONS[0].name };
}
let meta = freshMeta();

// ---------- the dive, as data (D70) ----------
// A dive is plain numbers in plain objects, its randomness one 32-bit number,
// and it runs in fixed ticks -- so a copy of these variables *is* the dive,
// and a restored one plays on exactly as it would have. Every variable a dive
// owns must be here: the save-and-restore property check (tests/meta.test.js)
// diverges on any that is missed.
// The mod cards on offer hold functions, so they are saved by name; `at` is
// the screen play resumes to, since the pause menu may be what is showing.
function snapshot() {
  return { player, enemies, bullets, gems, drops, particles, elapsed, kills, shake,
           queuePaused, batchIndex, breathTimer, cameraY, current, waterY,
           fireArmed, currency, modCounts, offerTimer, choiceIndex,
           choices: choices.map(c => c.name), accumulator, rngState,
           currentSeed, bulletId, plan, batchHit, notice, noticeTime,
           banner, bannerTime, modRound, boosts, sinceBoost, weaponName, guardLeft,
           batchTime, batchDashed,
           at: screen === 'playing' || screen === 'mods' ? screen : resumeTo };
}

// The reverse. The dive comes back to `resumeTo`, the screen it was on, and
// the title's Continue goes straight there (D90).
function restore(d) {
  ({ player, enemies, bullets, gems, drops, particles, elapsed, kills, shake,
     queuePaused, batchIndex, breathTimer, cameraY, current, waterY,
     fireArmed, currency, modCounts, offerTimer, choiceIndex,
     accumulator, rngState, currentSeed, bulletId, plan, batchHit, notice,
     noticeTime, banner, bannerTime, modRound, boosts, sinceBoost, weaponName,
     guardLeft, batchTime, batchDashed } = d);
  choices = d.choices.map(n => MODS.find(m => m.name === n));
  resumeTo = d.at;
  diveLive = true;
}

// The whole save, as text: what persists, plus the dive if one is under way.
function saveText() {
  return JSON.stringify({ ...meta, dive: diveLive ? snapshot() : null });
}

// Brings an older save up to this version, or leaves it alone, one version at
// a time. v1 kept the shot in constants, so a v1 dive's player has no shot
// speed or radius: it gets the Gun's as they were then, 430 and 4 (D83).
// v2 picked a mod at every gate and counted a rank (D84, D87): a v2 dive comes
// back with its rank dropped, and with nothing dropped or running yet; the
// batch it was in has no fish lit. Saved with the cards up, it takes the card
// it had marked -- a gems or heart card, gone since, gives nothing -- and an
// offer still on its way is dropped. v2 kept a layer's micro-tasks by its
// name, v3 by its number (D89): these were the names then. v3 had one weapon,
// carried by every dive: a v3 save owns and carries the Gun (D97), its diver
// wears no suit (D100), and its batch's clock starts as it loads (D98).
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
  return s;
}

// Reads a save back. Returns '' when it loaded -- or when there was nothing
// to load -- and otherwise why it was refused, having changed nothing: the
// caller keeps the refused text aside and says so on screen, so a save is
// never silently lost or silently half-read.
function loadSave(text) {
  if (text === null || text === undefined) return '';
  let s;
  try { s = migrate(JSON.parse(text)); } catch { return 'the save could not be read'; }
  if (!s || s.version !== SAVE_VERSION) {
    return 'the save is version ' + (s && s.version) + ', this build reads ' + SAVE_VERSION;
  }
  const { dive, ...kept } = s;
  meta = { ...freshMeta(), ...kept };
  if (dive) restore(dive);
  return '';
}

let volume = 0.6;           // master gain, 0..1
let shakeLevel = 2;         // index into SHAKE_LEVELS
let showFps = false;

// Dev flags, set from the URL by main.js: `&immortal` and `&damage=<n>`. Like
// the settings above they are not part of a dive, so reset() leaves them alone
// and they survive Dive again. Nothing in the game itself ever turns them on.
let immortal = false;       // nothing can hurt the player
let damageOverride = 0;     // above 0, every shot does this much

function openScreen(name) {
  returnTo = screen;
  screen = name;
  optionIndex = 0;
}
