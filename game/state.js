// ===== state =====
// Everything a dive owns, plus the settings the options screen edits.

// ---------- game state ----------
// Everything a dive owns lives here, so restarting is one call.
let player, enemies, bullets, gems, particles;
let elapsed, kills, shake;
let queuePaused = false;    // a scenario can stop the batch queue (D37)

// Where the batch queue stands (D27). `batchIndex` counts batches *begun* and
// never resets within a dive, so it is also how many have been cleared.
//
// `breathTimer` is NOT a gate flag: a **gate** is the whole stretch where the
// descent is stopped, fight included, so "at a gate" is `enemies.length > 0`.
// Since S2 it counts only the quiet beat before a dive's *first* batch
// (GATE_PAUSE); every later batch waits on the descent instead (D58). Naming it
// `gateTimer` inverted the glossary and would have had S2's camera moving while
// locked.
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

// A line of text shown for a moment over play, and how many seconds it has
// left: a micro-task paying out. The layer's name needs no state -- it is
// derived from the plan and the camera.
let notice = '';
let noticeTime = 0;

// A dive is under way: begun, and not yet ended by death or the win. What the
// save writes as the dive in progress (D70), and what turns the title's Start
// into Continue.
let diveLive = false;

// The camera (S2): how far down the world the top of the view sits. Everything
// in a dive lives in world coordinates; only `aim` and the HUD are in the view.
let cameraY = 0;
// The current (D58): its speed, which is never zero, and how far the water has
// flowed. The camera holds during a fight; the water does not -- `waterY` is
// what the background scrolls by, so the flow shows while nothing else moves.
let current = 0;
let waterY = 0;

// The trigger is armed only once the button has been seen released. A menu
// reads a click as an edge (justPressed) while the weapon reads it as a held
// state (keys), so without this one physical click is read twice -- clicking
// Start fired a shot into the dive it had just begun.
let fireArmed = false;

// In-dive progress, reset every dive (D34). One rank per batch cleared -- there
// is no XP bar and no curve, so `rank` is simply how many batches you have put
// down. `currency` is the dive's takings; spending them at `home` is S4.
// `modCounts` is how many times each mod has been taken, which is what lets the
// roll refuse one that is already maxed.
let rank, currency, choices, modCounts;

// Seconds until the mod cards appear, counting from the last enemy dying.
// `> 0` means "a batch is cleared and the offer is coming" -- the death gets to
// finish playing before the game asks you to read three cards.
let offerTimer = 0;

// Which screen we're on. Replaces the old `paused` and `dead` flags, which
// could contradict each other; now there is exactly one answer at a time.
// 'title' | 'home' | 'playing' | 'mods' | 'paused' | 'help' | 'options' | 'dead' | 'won'
let screen = 'title';
let menuIndex = 0;          // cursor in the title / pause menu
let choiceIndex = 0;        // highlighted mod card
let lastAimX = 0, lastAimY = 0;   // so a still mouse doesn't fight the arrows
let optionIndex = 0;        // cursor in the options list
let returnTo = 'title';     // where Esc goes back to from help / options
let resumeTo = 'playing';   // where the pause menu resumes: play, or the mod
                            // cards it was opened over

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
// repeats goes through here: the mod cards and the dive's plan (D71).
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
function reset(seed) {
  seedRng(seed === undefined ? (Math.random() * 0x100000000) >>> 0 : seed);
  // First, before anything else draws: the whole dive's batches (D71).
  plan = drawPlan();
  player = {
    ...PLAYER_START,
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
  // What persists, added to the start (D36): each gear tier and each point
  // applied once. Mods add on top as they are picked; nothing multiplies.
  for (const g of GEAR) for (let i = 0; i < (meta.gear[g.name] || 0); i++) g.apply(player);
  for (const a of ATTRIBUTES) for (let i = 0; i < (meta.spent[a.name] || 0); i++) a.apply(player);
  if (damageOverride > 0) player.damage = damageOverride;   // a dev flag
  enemies = [];
  bullets = [];
  gems = [];
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

  rank = 0;            // one per batch cleared, so a fresh dive has none
  currency = 0;
  offerTimer = 0;      // no offer pending on a fresh dive
  accumulator = 0;     // no banked time carried into a new dive
  choices = [];
  modCounts = {};      // mods are dive-scoped: last dive's picks do not carry
  choiceIndex = 0;
  batchHit = false;
  notice = '';
  noticeTime = 0;
  diveLive = true;
}

// Loads a named scenario from SCENARIOS (D37). Starts from a clean reset, so a
// scenario is a dive like any other -- just one that was set up rather than
// spawned into. Returns false for an unknown name so the caller can complain.
function applyScenario(name, seed) {
  const s = SCENARIOS[name];
  if (!s) return false;
  reset(seed);
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
  // A stated kit: taken as picks, one rank each, as if earned on the way down.
  for (const name of s.kit || []) {
    takeMod(MODS.find(m => m.name === name));
    rank += 1;
  }
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
const SAVE_VERSION = 1;
function freshMeta() {
  return { version: SAVE_VERSION, bank: 0, gear: {}, spent: {}, tasks: {},
           deepest: 0, cleared: 0 };
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
  return { player, enemies, bullets, gems, particles, elapsed, kills, shake,
           queuePaused, batchIndex, breathTimer, cameraY, current, waterY,
           fireArmed, rank, currency, modCounts, offerTimer, choiceIndex,
           choices: choices.map(c => c.name), accumulator, rngState,
           currentSeed, bulletId, plan, batchHit, notice, noticeTime,
           at: screen === 'playing' || screen === 'mods' ? screen : resumeTo };
}

// The reverse. The dive comes back paused -- a resumed dive opens on the
// pause screen, not mid-swing (D70) -- so Continue lands on the menu.
function restore(d) {
  ({ player, enemies, bullets, gems, particles, elapsed, kills, shake,
     queuePaused, batchIndex, breathTimer, cameraY, current, waterY,
     fireArmed, rank, currency, modCounts, offerTimer, choiceIndex,
     accumulator, rngState, currentSeed, bulletId, plan, batchHit, notice,
     noticeTime } = d);
  choices = d.choices.map(n => [...MODS, ...FILLERS].find(m => m.name === n));
  resumeTo = d.at;
  diveLive = true;
}

// The whole save, as text: what persists, plus the dive if one is under way.
function saveText() {
  return JSON.stringify({ ...meta, dive: diveLive ? snapshot() : null });
}

// Reads a save back. Returns '' when it loaded -- or when there was nothing
// to load -- and otherwise why it was refused, having changed nothing: the
// caller keeps the refused text aside and says so on screen, so a save is
// never silently lost or silently half-read.
function loadSave(text) {
  if (text === null || text === undefined) return '';
  let s;
  try { s = JSON.parse(text); } catch { return 'the save could not be read'; }
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
// and they survive R. Nothing in the game itself ever turns them on.
let immortal = false;       // nothing can hurt the player
let damageOverride = 0;     // above 0, every shot does this much

function openScreen(name) {
  returnTo = screen;
  screen = name;
  optionIndex = 0;
}
