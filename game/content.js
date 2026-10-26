// ===== content: every tuning number and content table =====

// ---------- the view ----------
// A fixed view whatever the window, so difficulty does not depend on the
// monitor (D29). The world is a tall strip; the view sits `cameraY` down it.
const ARENA_W = 1280;
const ARENA_H = 800;

// ---------- balance ----------
// Every number that decides how the game plays: what transfers to a port
// as-is. What a mod, boost, tier or attribute raises is a field, never a bare
// `const`, which a line of data cannot edit (D34). The weapon's numbers join
// these as a dive starts (D83).
const PLAYER_START = {
  r: 20,             // radius, in pixels
  speed: 260,        // pixels per second
  ramp: 0.25,        // seconds to swim up to full speed, or glide to a stop (D107)
  turn: 0.2,         // seconds to turn round, half a circle (D107)
  hp: 3,
  maxHp: 3,
  iframes: 1,        // seconds of invulnerability after a hit
  dashCooldown: 2.2, // seconds before you can dash again
  dashSpeed: 620,    // px/s while dashing -- its own number, not a multiple of
                     // `speed`, so swim speed never lengthens the dash (D56)
  mendOnClear: 0,    // hp healed per batch cleared -- a comfort mod grants it
  dashDamage: 0,     // pure movement until bought (D51); it always shoves
  guard: 0,          // hits a batch can take without losing HP -- the suit's (D100)
  splash: 0,         // px from a struck fish's body that its hit wounds too -- Bloom's (D125)
};

const DASH_TIME      = 0.16;  // seconds of dash
const DASH_GRACE     = 0.15;  // extra invulnerability after it, so you don't
                              // land inside the enemy you just flew through
// A wave ahead of the dash: everything within reach AND in front of it.
const DASH_REACH     = 40;    // px past an enemy's own radius
const DASH_ARC       = 0.2;   // cos of the half-angle: 0.2 is a 156-degree front
const DASH_END       = 0.18;  // seconds of the ring that closes the dash
const DASH_PUSH      = 320;   // px/s the wave shoves an enemy outward...
const PUSH_DRAG      = 0.02;  // ...with this fraction of it left after a second
const BUMP_TIME      = 0.1;   // seconds a hit fish's body is drawn jolted along the hit: Claude's pick...
const BUMP_SIZE      = 0.15;  // ...by this share of its radius, flattened along it as much
const LEAP_TIME      = 0.08;  // seconds a biter's drawn leap takes out, and as long back: Claude's pick
const SPLASH_SHOW    = 0.3;   // seconds Bloom's ring shows a splash's reach: Claude's pick
const BODY_PUSH      = 600;   // px/s at most that overlapping bodies part (D120): Claude's pick
// Water (D107): the share of a change of speed still to go after a body's
// `ramp` seconds -- so `ramp` is its time to full speed, near enough.
const RAMP_LEFT      = 0.05;

// Fast enough to outrun the swimming diver (D35, D78). Claude's pick.
const GEM_PULL       = 600;   // px/s a gem flies toward you
const GEM_POP        = 1;     // seconds the +N holds over the diver after its last gem: Claude's pick
const GEM_FLY        = 0.25;  // seconds it then takes to fly to the counter: Claude's pick
const GEM_BUMP       = 0.15;  // seconds the counter's number swells as it lands: Claude's pick
const ENEMY_JITTER   = 0.3;   // spread of speeds around a type's nominal speed
const GATE_PAUSE     = 1.2;   // seconds of quiet before a dive's first batch;
                              // later ones wait on the descent
// Waves (D115). Claude's picks.
const WAVE_MIN       = 5;     // fish in a wave, drawn between these two
const WAVE_MAX       = 10;
const WAVE_GAP       = 4;     // seconds from one wave's start to the next's...
const WAVE_JITTER    = 0.4;   // ...give or take this share of it
const WAVE_SPREAD    = 2;     // seconds a later wave's fish trickle in over
// The boss's crowd, topped up to this while it lives (D116). Claude's pick.
const BOSS_CROWD     = 4;
// Threat through a dive (D126): the first ordinary stretch's, and the ratio by
// which what each next one adds grows -- so a dive eases in, then compounds as
// its mods and a career's gear do.
// A batch's threat, at the reference kit, is about the hearts it costs at the
// knee (`entities/enemies.md` -> Threat). Claude's picks, tuned by careers of
// dives (D127).
const THREAT_START   = 0.05;
const THREAT_RISE    = 1.8;
// The share of each type in a batch that grading leaves at grade 1, so a deep
// batch still shows its lower grades. Claude's pick.
const GRADE_KEEP     = 1 / 5;
// The descent (D58). Claude's picks.
const GATE_SPACING   = 400;   // world px between gate depths: about two seconds
                              // of travel at CURRENT_SPEED
const CURRENT_SPEED  = 200;   // px/s between batches
const CURRENT_CRAWL  = 30;    // px/s during a fight: the water still flows
const CURRENT_EASE   = 0.05;  // fraction of the speed change still left after
                              // one second -- eases up after a clear, down on
                              // an arrival, never a jolt
// The one step size (D53). 1/120, not 1/60: with no render interpolation the
// step size is the smoothness.
const FIXED_DT       = 1 / 120;
// The longest frame the simulation believes: a minute away must not teleport
// everything, and it bounds the catch-up, so a slow frame cannot spiral.
const MAX_FRAME_DT   = 0.05;
const NOTICE_TIME    = 2.5;   // seconds a challenge's, a pickup's or the catalogue's line stays
                              // up. Claude's pick
const MOD_OFFER_DELAY = 0.6;  // seconds between the boss dying and the layer
                              // end's cards appearing: the kill burst lives
                              // 0.5s, and cards on top of it read as a jump cut
// What a dive picks up (D84, D85, D86). Claude's picks.
const END_STEP       = 2;     // picks at once: an ordinary mod on a layer end's card
// A boost's chance on the Nth kill since the last one is BOOST_C x N -- the
// pseudo-random distribution Dota uses: never more than 1 / BOOST_C kills
// apart, and seldom two in a row.
const BOOST_C        = 0.02;
const BOOST_LIFE     = 6;     // seconds a boost lies where it fell, then it is gone
const FLURRY_TIME    = 2;     // seconds within which `flurry` counts kills (D109).
                              // Claude's pick

let bulletId = 0;           // so a piercing shot can't hit the same enemy twice

// ---------- settings ----------
const SHAKE_LEVELS = [
  { name: 'off',    mul: 0 },
  { name: 'low',    mul: 0.5 },
  { name: 'normal', mul: 1 },
];
const SHAKE_FADE  = 0.02;   // fraction of the shake still left after one second
const SHAKE_FLOOR = 0.15;   // below a fifth of a pixel, snap to a still picture
const SHAKE_HURT  = 7;      // px, taking a hit
const SHAKE_DEATH = 38;     // px, dying

// ---------- sound ----------
// Oscillators with fading envelopes, no audio files. `vol` is peak amplitude,
// 0..1: under about 0.15 a blip is inaudible on laptop speakers, as ?test holds.
const SOUNDS = {
  shoot:  { freq: 680,  dur: 0.05, type: 'square',   vol: 0.20, slide: 0.55 },
  dash:   { freq: 520,  dur: 0.18, type: 'triangle', vol: 0.30, slide: 0.32 },
  kill:   { freq: 200,  dur: 0.11, type: 'sawtooth', vol: 0.32, slide: 0.45 },
  gem:    { freq: 1150, dur: 0.05, type: 'sine',     vol: 0.22, slide: 1.3  },
  hurt:   { freq: 110,  dur: 0.28, type: 'sawtooth', vol: 0.55, slide: 0.4  },
  death:  { freq: 70,   dur: 0.90, type: 'sawtooth', vol: 0.60, slide: 0.3  },
  modA:   { freq: 520,  dur: 0.09, type: 'triangle', vol: 0.40, slide: 1    },
  modB:   { freq: 780,  dur: 0.16, type: 'triangle', vol: 0.35, slide: 1.25 },
  boost:  { freq: 440,  dur: 0.14, type: 'square',   vol: 0.25, slide: 1.8  },
  spit:   { freq: 330,  dur: 0.08, type: 'triangle', vol: 0.30, slide: 1.5  },
  pop:    { freq: 150,  dur: 0.22, type: 'square',   vol: 0.40, slide: 0.5  },
  guard:  { freq: 880,  dur: 0.12, type: 'square',   vol: 0.30, slide: 0.6  },
  hit:    { freq: 240,  dur: 0.06, type: 'triangle', vol: 0.30, slide: 0.7  },
  wave:   { freq: 300,  dur: 0.35, type: 'sine',     vol: 0.35, slide: 1.4  },
  lead:   { freq: 90,   dur: 0.70, type: 'sawtooth', vol: 0.45, slide: 1.2  },
  clear:  { freq: 660,  dur: 0.20, type: 'sine',     vol: 0.35, slide: 1.5  },
  layer:  { freq: 440,  dur: 0.50, type: 'triangle', vol: 0.40, slide: 2    },
};

// ---------- mods ----------
// Documented in docs/entities/mods.md, held to it by `npm test`. A `desc`
// reads as a sentence, not a stat line: a pickup must be recognised mid-fight.
const MODS = [
  { name: 'Fins',     scope: 'body',    desc: 'you swim faster', max: 6,
    apply: p => p.speed += 45 },
  { name: 'Vitality', scope: 'body',    desc: '1 more max HP, it comes full', max: 6,
    apply: p => { p.maxHp += 1; p.hp += 1; } },
  { name: 'Reflex',   scope: 'body',    desc: 'the dash comes back sooner', max: 3,
    apply: p => p.dashCooldown -= 0.4 },
  { name: 'Nerve',    scope: 'body',    desc: 'hits leave you safe longer', max: 3,
    apply: p => p.iframes += 0.3 },
  { name: 'Impact',   scope: 'body',    desc: 'the dash wounds what it throws', max: 3,
    apply: p => p.dashDamage += 1 },
  { name: 'Mend',     scope: 'comfort', desc: '1 HP back each batch', max: 1,
    end: true, apply: p => p.mendOnClear = 1 },
  { name: 'Barbs',    scope: 'weapon',  desc: 'harpoons go through one more', max: 3,
    weapons: ['Harpoon'], apply: p => p.pierce += 1 },
];

// Words a player reads, never the code's key. A check holds every stat a mod
// moves to a name here.
const STAT_NAMES = {
  speed: 'swim speed', maxHp: 'max HP', hp: 'HP', dashCooldown: 'dash cooldown',
  iframes: 'safe after a hit', dashDamage: 'dash damage', mendOnClear: 'HP back each batch',
  pierce: 'pierce', range: 'range', damage: 'damage', fireRate: 'fire rate', guard: 'guard',
  dashSpeed: 'dash speed',
};
// The numbers `home` shows the next dive starting with (D147), and their units.
// A check holds every stat a tier or a step moves to being here.
const KIT_STATS = [['maxHp', ''], ['guard', ''], ['damage', ''], ['fireRate', '/s'], ['range', ''],
                   ['pierce', ''], ['speed', ''], ['dashSpeed', ''], ['dashCooldown', 's'], ['dashDamage', '']];

// ---------- boosts ----------
// Documented in docs/entities/boosts.md, held to it by `npm test`. `add` and
// `percent` are numbers, not a function, so they can be taken back -- and so
// never move `hp`. A boost every weapon gets keeps the weapons in their order
// (D125): it adds to no weapon's number, only raises one by `percent`.
const BOOSTS = [
  { name: 'Rush',   desc: 'you swim much faster',  time: 5, add: { speed: 200 } },
  { name: 'Frenzy', desc: 'you fire much faster',  swingDesc: 'you swing much faster',
    time: 5, percent: { fireRate: 100 } },
  { name: 'Lance',  desc: 'your shots go through', weapons: ['Gun'],
    time: 5, add: { pierce: 4 } },
  { name: 'Bloom',  desc: 'your shots splash',     swingDesc: 'your cuts splash',
    time: 6, add: { splash: 24 } },
];

// ---------- gear, attributes, challenges ----------
// What persists, spent at `home` (D31, D36): everything sums, mods on top,
// nothing multiplies. The save keys them by `name`, so renaming one orphans
// what players own. Claude's picks.

// Documented in docs/entities/weapons.md, held to it by `npm test`.
const WEAPONS = [
  { name: 'Gun', desc: 'quick, light shots', fireRate: 2.5, damage: 1, range: 250, shotSpeed: 430, shotRadius: 4, pierce: 0, knock: 60, cost: 0,
    tiers: [{ cost: 240,  apply: p => p.fireRate += 0.5 },
            { cost: 800, apply: p => p.fireRate += 0.5 },
            { cost: 1600, apply: p => p.fireRate += 0.5 }] },
  // The draft's railgun (D97), needing Strength (D98).
  { name: 'Harpoon', fireRate: 0.8, damage: 4, range: 420, shotSpeed: 950, shotRadius: 3, pierce: 2, knock: 200,
    desc: 'slow, heavy shots that go through fish', cost: 1200, requires: { Strength: 1 },
    tiers: [{ cost: 640,  apply: p => p.damage += 1 },
            { cost: 1280, apply: p => p.fireRate += 0.2 },
            { cost: 2400, apply: p => p.pierce += 1 }] },
  // Melee (D105): it reaches `range` plus `shotRadius`, and `pierce` caps a
  // swing at pierce + 1 fish, nearest first.
  { name: 'Knife', fireRate: 3, damage: 2, range: 60, shotRadius: 18, pierce: 6, knock: 40,
    desc: 'swings close, cutting several fish at once', swing: { arc: 60, time: 0.15 }, cost: 800,
    tiers: [{ cost: 480,  apply: p => p.range += 12 },
            { cost: 1120, apply: p => p.damage += 1 },
            { cost: 2080, apply: p => p.fireRate += 0.75 }] },
];

// Combat numbers only; body stats are attributes' (D36). Documented in
// docs/entities/equipment.md.
const EQUIPMENT = [
  { name: 'Mask',    tiers: [{ cost: 400,  apply: p => p.range += 15 },
                             { cost: 960, apply: p => p.range += 15 },
                             { cost: 1920, apply: p => p.range += 15 }] },
  { name: 'Suit',    tiers: [{ cost: 720,  apply: p => p.guard += 1 },
                             { cost: 1600, apply: p => p.guard += 1 },
                             { cost: 3040, apply: p => p.guard += 1 }] },
  { name: 'Weights', tiers: [{ cost: 560,  apply: p => p.damage += 0.5 },
                             { cost: 1200, apply: p => p.damage += 0.5 },
                             { cost: 2240, apply: p => p.damage += 0.5 }] },
];

// Uncapped here: the challenges' finite rungs cap them at the source (D36).
// Step n costs n points (D109).
const ATTRIBUTES = [
  { name: 'Dash reach', apply: p => p.dashSpeed += 150 },
  { name: 'Heart',      apply: p => { p.maxHp += 1; p.hp += 1; } },
  { name: 'Strength',   apply: p => p.dashDamage += 1 },
];

// What a ladder's first n rungs pay, and an attribute's first n steps cost (D109).
const tri = n => n * (n + 1) / 2;

// Judged at one moment: `clear` takes the streak and returns it after the
// batch just cleared, `kill` counts after a kill, `end` reads a layer at its
// end. With `within`, a rung is a time to beat (D109). Claude's picks.
const CHALLENGES = [
  { name: 'untouched', rungs: [1, 3, 6, 10],
    ask: n => (n === 1 ? 'clear a batch without a hit' : 'clear ' + n + ' batches in a row without a hit'),
    clear: n => (batchHit ? 0 : n + 1) },
  { name: 'footwork',  rungs: [3, 6, 10, 15],
    ask: n => 'clear ' + n + ' batches in a row without dashing',
    clear: n => (batchDashed ? 0 : n + 1) },
  // A batch with no glowing fish neither counts nor breaks it. A kill on the
  // glowing fish's tick ties with it: one swing or dash is one moment.
  { name: 'beeline',   rungs: [1, 3, 5, 8],
    ask: n => (n === 1 ? 'kill a glowing fish before the rest of its batch'
                       : 'kill the glowing fish first, ' + n + ' batches in a row'),
    clear: n => (glowAt === null ? n : glowAt === firstKillAt ? n + 1 : 0) },
  { name: 'flurry',    rungs: [6, 12, 20, 30],
    ask: n => 'kill ' + n + ' fish within ' + FLURRY_TIME + ' seconds',
    kill: () => killTimes.filter(t => elapsed - t <= FLURRY_TIME).length },
  // A dive begun partway into a layer has no start for it: not judged.
  { name: 'swift',     rungs: [480, 360, 300, 240], within: true,
    ask: s => 'clear a layer within ' + s / 60 + ' minutes',
    end: () => (layerStart === null ? Infinity : elapsed - layerStart) },
];

// ---------- the development readout ----------
// To be trimmed before alpha (D52). `stat` names the player field, so a check
// proves everything a mod or boost changes is shown; `hp` and `maxHp` are the
// status bar's `HP 3/4`.
const PLAYER_STATS = [
  { stat: 'speed',        label: 'spd',     read: p => Math.round(p.speed) },
  { stat: 'range',        label: 'rng',     read: p => Math.round(p.range) },
  { stat: 'fireRate',     label: 'rate',    read: p => p.fireRate.toFixed(2) + '/s' },
  { stat: 'damage',       label: 'dmg',     read: p => p.damage },
  { stat: 'pierce',       label: 'pierce',  read: p => p.pierce },
  { stat: 'shotRadius',   label: 'size',    read: p => p.shotRadius },
  { stat: 'splash',       label: 'splash',  read: p => p.splash },
  { stat: 'knock',        label: 'knock',   read: p => p.knock },
  { stat: 'dashDamage',   label: 'dashdmg', read: p => p.dashDamage },
  { stat: 'dashCooldown', label: 'dashcd',  read: p => p.dashCooldown.toFixed(1) + 's' },
  { stat: 'iframes',      label: 'ifr',     read: p => p.iframes.toFixed(2) + 's' },
  { stat: 'mendOnClear',  label: 'mend',    read: p => p.mendOnClear },
];

// ---------- the status bar ----------
// One entry a row, so a line added here moves the rest down.
function statusLines() {
  // The batch shown is the one being fought, or between gates the one ahead.
  const entry = plan[Math.max(0, batchLive() ? batchIndex - 1 : batchIndex)] || plan.at(-1);
  const lead = enemies.find(e => e.lead);
  const layer = plan.filter(e => e.layer === entry.layer);
  const mods = Object.entries(modCounts).map(([name, n]) => name + ' ×' + n);
  return [
    { bold: true, color: '#d8f6ff',
      text: 'HP ' + player.hp + '/' + player.maxHp +
            (player.guard ? '   GUARD ' + guardLeft + '/' + player.guard : '') +
            // What is still on its way is not counted yet, unless the dive is over.
            '   GEMS ' + (currency - (screen === 'dead' || screen === 'won' ? 0 : gemPop.n + gemPop.flyN)) +
            '   ' + weaponName + ' tier ' + (meta.gear[weaponName] || 0) },
    { color: '#9ef7ff',
      text: LAYERS[entry.layer].name + '   batch ' + (layer.indexOf(entry) + 1) + '/' + layer.length +
            // Fish to come count, so an arena that fills again reads as a wave,
            // not a broken gate (D115). A crowd has only its end (D116).
            (lead ? '   escorts keep coming until the ' + lead.name + ' dies' :
             batchLive() ? '   ' + (enemies.length + incoming.length) + ' fish left' +
                           (incoming.length ? ' (' + incoming.length + ' coming)' : '') : '') +
            '   ' + elapsed.toFixed(1) + 's   ' + kills + ' killed' },
    { color: '#ffe9a8',
      text: 'mods ' + (mods.join('  ') || 'none') +
            boosts.map(b => '   ' + b.name + ' ' + b.left.toFixed(1) + 's').join('') },
    { color: '#a8ffd8', text: 'challenges ' + CHALLENGES.map(challengeStatus).join('   ') },
    { color: '#4d7a8a', small: true,
      text: PLAYER_STATS.map(s => s.label + ' ' + s.read(player)).join('   ') },
    ...(metTime > 0 ? [{ bold: true, color: '#ffd27a', text: 'CATALOGUE +' + met.join(', ') }] : []),
  ];
}

const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function challengeStatus(c) {
  const k = meta.challenges[c.name] || 0;
  if (k === c.rungs.length) return c.name + ' ' + '●'.repeat(k);
  const now = c.clear ? (tally[c.name] || 0) : (c.kill || c.end)(), rung = c.rungs[k];
  return c.name + ' ' + (c.within ? (now === Infinity ? '–' : clock(now)) + '/' + clock(rung) : now + '/' + rung);
}

const CHALLENGE_LINE = 24;
const challengesTop = menu => menu.top + menu.items.length * ROW_STEP + 10;
function challengeLines() {
  return ['Challenges pay the points, each rung once, in any layer', ...CHALLENGES.map(c => {
    const k = meta.challenges[c.name] || 0;
    return c.name + '   ' + '●'.repeat(k) + '○'.repeat(c.rungs.length - k) + '   ' +
           (k < c.rungs.length ? c.ask(c.rungs[k]) + '  —  ' + (k + 1) + (k ? ' points' : ' point')
                               : 'every rung earned');
  })];
}

// Full-width bands on the text baseline, so the mouse hits a row anywhere.
const ROW_W = 420, ROW_H = 38, ROW_STEP = 46;
const MENU_TOP = 380, OPTION_TOP = 300;
function rowRect(i, top) {
  return { x: ARENA_W / 2 - ROW_W / 2, y: top + i * ROW_STEP - 26, w: ROW_W, h: ROW_H };
}
function rectOf(menu, i) {
  return menu.rect ? menu.rect(i) : rowRect(i, menu.top);
}

// The renderer draws the cards and the logic hit-tests them, so their numbers
// belong to neither. A check measures descriptions against `CARD_PAD`.
const CARD_W = 220, CARD_H = 186, CARD_GAP = 24, CARD_PAD = 12;
// A check holds every mod to this many rows, so a third stat fails the suite
// instead of falling off the card.
const MOD_ROWS = 2;
function cardRect(i, n) {
  const totalW = n * CARD_W + (n - 1) * CARD_GAP;
  return { x: ARENA_W / 2 - totalW / 2 + i * (CARD_W + CARD_GAP),
           y: ARENA_H / 2 - CARD_H / 2, w: CARD_W, h: CARD_H };
}

function continueRect() {
  const c = cardRect(0, 1);
  return { x: ARENA_W / 2 - CARD_W / 2, y: c.y + c.h + 20, w: CARD_W, h: ROW_H };
}

// Taken, or flying to you: a draw that skipped a mod in flight would deal the
// last slot under a cap again before it lands.
function held(m) {
  return (modCounts[m.name] || 0) + drops.filter(d => d.mod === m.name).length;
}

function fits(m) { return !m.weapons || m.weapons.includes(weaponName); }

function carriable() {
  return MODS.filter(m => !m.end && fits(m) && held(m) < m.max);
}

// Every ordinary mod once before any comes again. `null` once all are capped,
// and no fish glows: the easiest answer while caps are balance's (D84).
function drawCarried() {
  const open = carriable();
  if (!open.length) return null;
  let fresh = open.filter(m => !modRound.includes(m.name));
  if (!fresh.length) {
    modRound = [];
    fresh = open;
  }
  const m = drawDistinct(fresh, 1)[0];
  modRound.push(m.name);
  return m;
}

const cardStep = m => (m.end ? 1 : END_STEP);

function rollValuable() {
  return drawDistinct(MODS.filter(m => fits(m) && held(m) + cardStep(m) <= m.max), 3);
}

// ---------- key bindings ----------
// Content, not platform: which key means what is the game's call (D44).
// Always `e.code`, never `e.key` (D12).
const UP    = ['ArrowUp', 'KeyW'];
const DOWN  = ['ArrowDown', 'KeyS'];
const LEFT  = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const GO    = ['Enter', 'NumpadEnter', 'Space'];
const DASH  = ['Space'];
const CLICK = ['Mouse0'];
const FAST  = ['ShiftLeft', 'ShiftRight'];   // held: a value row moves five at a time
const MUTE  = ['KeyM'];                       // the sound off or on, on every screen (D113)
// The debug mode's own (D102).
const DEBUG_AGAIN = ['KeyR'];
const DEBUG_SETUP = ['Backspace'];

// ---------- batches ----------
// Sized by threat (D126): a batch's at grade 1 at or under its stretch's
// target, at the layer's top grade past it. Claude's picks.
const MINI_BOSS = { enemies: [['mini-boss', 1]] };
const BOSS      = { enemies: [['boss', 1]], crowd: BOSS_CROWD };

// ---------- layers ----------
// A layer owns its batches (D71): stretches, each a pool and how many to
// `draw`. A mini-boss or the boss is a stretch whose pool holds one batch, so
// their places need no special case. `color` is the water at its top:
// PLACEHOLDER GRAPHICS (D72), Claude's picks. Numbered until named (D89).
const layer = (name, color, [a, b, c]) => ({ name, color, stretches: [
  { draw: 3, pool: a }, { draw: 1, pool: [MINI_BOSS], escorts: a },
  { draw: 2, pool: b }, { draw: 1, pool: [MINI_BOSS], escorts: b },
  { draw: 2, pool: c }, { draw: 1, pool: [BOSS], escorts: c },
] });
const LAYERS = [
  layer('Layer 1', [12, 23, 39], [
    [{ enemies: [['drifter', 9], ['darter', 3]] },
     { enemies: [['drifter', 7], ['darter', 5]] },
     { enemies: [['drifter', 6], ['darter', 6]] },
     { enemies: [['darter', 7], ['drifter', 5]] },
     { enemies: [['darter', 9], ['drifter', 3]] }],
    [{ enemies: [['archer', 5], ['drifter', 11]] },
     { enemies: [['archer', 7], ['darter', 4]] },
     { enemies: [['archer', 6], ['drifter', 4], ['darter', 4]] },
     { enemies: [['archer', 7], ['drifter', 4]] },
     { enemies: [['archer', 5], ['darter', 5], ['drifter', 5]] }],
    [{ enemies: [['bulwark', 3], ['drifter', 6], ['archer', 4]] },
     { enemies: [['archer', 8], ['bulwark', 2], ['drifter', 4], ['darter', 2]] },
     { enemies: [['bulwark', 3], ['drifter', 3], ['darter', 3], ['archer', 4]] },
     { enemies: [['archer', 5], ['bulwark', 3], ['drifter', 3]] },
     { enemies: [['bulwark', 2], ['darter', 5], ['drifter', 5], ['archer', 7]] }],
  ]),
  layer('Layer 2', [24, 12, 40], [
    [{ enemies: [['drifter', 6], ['archer', 6], ['puffer', 3]] },
     { enemies: [['darter', 5], ['archer', 3], ['bulwark', 2], ['puffer', 2]] },
     { enemies: [['puffer', 4], ['drifter', 4], ['archer', 3]] },
     { enemies: [['drifter', 11], ['darter', 5], ['puffer', 3], ['archer', 3]] },
     { enemies: [['puffer', 5], ['darter', 5]] }],
    [{ enemies: [['bulwark', 3], ['archer', 4], ['drifter', 5], ['puffer', 5]] },
     { enemies: [['puffer', 8], ['darter', 7]] },
     { enemies: [['archer', 5], ['puffer', 7], ['drifter', 6]] },
     { enemies: [['bulwark', 3], ['puffer', 6], ['drifter', 6]] },
     { enemies: [['drifter', 8], ['archer', 3], ['bulwark', 3], ['puffer', 5]] }],
    [{ enemies: [['bulwark', 7], ['puffer', 10], ['drifter', 9]] },
     { enemies: [['archer', 4], ['darter', 8], ['puffer', 11], ['bulwark', 4]] },
     { enemies: [['puffer', 14], ['archer', 6], ['darter', 7]] },
     { enemies: [['bulwark', 4], ['archer', 6], ['darter', 8], ['puffer', 11]] },
     { enemies: [['drifter', 9], ['puffer', 14], ['archer', 8]] }],
  ]),
  layer('Layer 3', [8, 32, 28], [
    [{ enemies: [['eel', 18], ['drifter', 18], ['archer', 9]] },
     { enemies: [['eel', 18], ['archer', 13], ['darter', 16]] },
     { enemies: [['eel', 13], ['puffer', 8], ['archer', 9]] },
     { enemies: [['puffer', 12], ['drifter', 14], ['eel', 10], ['archer', 6]] },
     { enemies: [['eel', 18], ['archer', 13]] }],
    [{ enemies: [['bulwark', 12], ['eel', 28], ['archer', 12]] },
     { enemies: [['eel', 25], ['puffer', 15], ['darter', 18]] },
     { enemies: [['archer', 17], ['eel', 34]] },
     { enemies: [['bulwark', 8], ['puffer', 17], ['eel', 20]] },
     { enemies: [['drifter', 33], ['eel', 33], ['archer', 17]] }],
    [{ enemies: [['bulwark', 18], ['eel', 40], ['puffer', 22]] },
     { enemies: [['archer', 23], ['eel', 61], ['darter', 15]] },
     { enemies: [['puffer', 29], ['eel', 42], ['archer', 19]] },
     { enemies: [['bulwark', 14], ['archer', 18], ['eel', 55]] },
     { enemies: [['drifter', 16], ['eel', 49], ['puffer', 22]] }],
  ]),
];

// ---------- scenarios ----------
// Named dev setups (D37), `?dev=<name>`: README.md -> Scenarios.
const SCENARIOS = {
  'one-drifter': { spawn: false, enemies: [['drifter', 900, 400]] },
  'one-archer':  { spawn: false, enemies: [['archer', 1100, 400]] },
  'one-puffer':  { spawn: false, enemies: [['puffer', 1000, 400]] },
  'one-eel':     { spawn: false, enemies: [['eel', 1150, 400]] },
  'harpoon':     { weapon: 'Harpoon' },
  'knife':       { weapon: 'Knife' },
  'all-types':   { spawn: false,
                   get enemies() {
                     const t = ENEMY_TYPES.filter(e => e.carries !== false);
                     return t.map((e, i) => [e.name, ARENA_W * (i + 1) / (t.length + 1), 220]);
                   } },
  'late-swarm':  { batch: 5 },
  // `batch` may be a function of the drawn plan (D71): a place known only once drawn.
  'last-batch':  { batch: plan => plan.length - 1 },
  'mini-boss':   { batch: plan => plan.findIndex(e => e.batch.enemies[0][0] === 'mini-boss') },
  // A kit for the top of the layer: three of each ordinary mod but two of
  // Impact (D84), and the layer end's Mend (D85). Claude's picks.
  'layer-2':     { batch: plan => plan.findIndex(e => e.layer === 1),
                   kit: ['Fins', 'Fins', 'Fins', 'Vitality', 'Vitality', 'Vitality',
                         'Reflex', 'Reflex', 'Reflex', 'Nerve', 'Nerve', 'Nerve',
                         'Impact', 'Impact', 'Mend'] },
  // Three of each ordinary mod, and the first layer end's Mend. Claude's pick.
  'layer-3':     { batch: plan => plan.findIndex(e => e.layer === 2),
                   kit: ['Fins', 'Fins', 'Fins', 'Vitality', 'Vitality', 'Vitality',
                         'Reflex', 'Reflex', 'Reflex', 'Nerve', 'Nerve', 'Nerve',
                         'Impact', 'Impact', 'Impact', 'Mend'] },
};

// ---------- enemy types ----------
// Documented in docs/entities/enemies.md, held to it by `npm test`.
const ENEMY_TYPES = [
  // The plain fish bite (D108). Claude's picks.
  { name: 'drifter', r: 18, hp: 1, speed: 85,  ramp: 0.6, value: 1, threat: [0.004, 0.021, 0.026],
    desc: 'slow, and bites when its jaws open',
    color: '#e8446e', glow: '#ff1e5a',
    bite: { reach: 10, windup: 0.3, rest: 0.8, damage: 1, knock: 240 } },
  { name: 'darter',  r: 12, hp: 1, speed: 190, ramp: 0.9, value: 1, threat: [0.004, 0.014, 0.018],
    desc: 'small and quick, bites fast',
    color: '#ffb648', glow: '#ff8a00',
    bite: { reach: 6, windup: 0.15, rest: 0.6, damage: 1, knock: 180 } },
  { name: 'bulwark', r: 34, hp: 6, speed: 52,  ramp: 1.2, value: 3, threat: [0.062, 0.091, 0.125],
    desc: 'big, slow and tough; its bite throws you far',
    color: '#a05cff', glow: '#7b2fff',
    bite: { reach: 20, windup: 0.6, rest: 1.2, damage: 1, knock: 420 } },
  // The archer (D95). Its `range` sits under the Gun's, so the starting weapon
  // can always answer it. Claude's picks.
  { name: 'archer',  r: 16, hp: 2, speed: 75,  value: 2, threat: [0.017, 0.028, 0.032],
    desc: 'keeps its distance and spits',
    color: '#5aa9ff', glow: '#1f6fff',
    spit: { range: 240, near: 170, every: 2, speed: 210, r: 6, travel: 420, damage: 1, knock: 150 } },
  // The puffer (D95, D106). Claude's picks.
  { name: 'puffer',  r: 22, hp: 3, speed: 125, value: 2, threat: [0.081, 0.131, 0.184],
    desc: 'chases you, swells up close, then bursts: get out of its ring',
    color: '#ffee58', glow: '#ffc800',
    fuse: { chase: 1.5, trigger: 90, time: 0.5, blast: 110, damage: 2, knock: 480 } },
  // The eel (D95), the one fish that hurts on touch (D108). Claude's picks.
  { name: 'eel',     r: 14, hp: 2, speed: 130, value: 2, threat: [0.114, 0.239, 0.400],
    desc: 'weaves as it swims, and touching it hurts',
    color: '#38f2c0', glow: '#00c896',
    weave: { width: 50, rate: 0.9 },
    touch: { damage: 1, knock: 240 } },
  // The boss, and the mini-boss that rehearses its lunge (D62, D64, D65).
  // Neither glows (D88). Claude's picks.
  { name: 'mini-boss', r: 52, hp: 20, speed: 90, value: 5, threat: [0.315, 0.404, 0.452], carries: false,
    desc: 'winds up, then lunges a long way',
    color: '#e2ff8a', glow: '#c6ff3c',
    lunge: { chase: 1, windup: 1.2, speed: 780, reach: 450, rest: 0.9, damage: 2, knock: 600 } },
  // The boss's `value` is the layer end's big haul of gems (D68); its `fan`,
  // D117's. Claude's picks.
  { name: 'boss',      r: 84, hp: 100, speed: 80, value: 30, threat: [0.879, 0.921, 0.961], carries: false,
    desc: 'lunges, fans out shots, and its escorts keep coming until it dies',
    color: '#c8ff3c', glow: '#9dff00', enters: 'bottom',
    lunge: { chase: 1, windup: 0.8, speed: 780, reach: 450, rest: 0.9, damage: 4, knock: 600 },
    fan:   { chase: 1, windup: 0.6, reach: 450, rest: 0.9,
             count: 7, arc: 90, speed: 160, r: 9, travel: 600, damage: 1, knock: 150 } },
];

// Behaviour records, whose presence is the behaviour (D26), so a new one costs
// nothing where fish are made; plus `ramp` (D107). `threat` is a list, not one.
const behaviourOf = t => ({ ramp: t.ramp,
  ...Object.fromEntries(Object.entries(t).filter(([, v]) => typeof v === 'object' && !Array.isArray(v))) });

// What the catalogue can hold (D146): every fish, then every boost, each with
// its line, filled in as each is first met.
const CATALOGUE = [...ENEMY_TYPES, ...BOOSTS];

// Grades (D119): the same fish, stronger -- its numbers, never its behaviour.
// Grade 1 is the type as written; a step multiplies `hp`, `speed` and `value`
// and adds to every attack's `damage`. Which grade a fish arrives at is the
// plan's (`drawPlan()`), never deeper than its layer allows: `from` is the
// first layer a grade arrives in -- the first never meets the top one (D119).
// Claude's picks.
const GRADES = [
  { hp: 1, speed: 1,   value: 1, damage: 0, from: 1 },
  { hp: 1.25, speed: 1.1, value: 2, damage: 1, from: 1 },
  { hp: 1.5,  speed: 1.2, value: 3, damage: 2, from: 2 },
];

// Derived from how many layers `home` lists, or a fifth would run into the rows.
const HOME_LAYERS_TOP = 310, HOME_LINE = 26;
const HOME_TOP = HOME_LAYERS_TOP + LAYERS.length * HOME_LINE + 40;

// ---------- the debug mode ----------
// `?debug` (D102). Its rows are built from the tables, so new content joins it
// with nothing to write.
const ONE_SHOT         = 100;   // damage that kills anything here in one shot
const DEBUG_FISH_MAX   = 50;    // of one type in the setup's batch: Claude's pick
const DEBUG_STEPS_MAX  = 9;     // of one attribute: Claude's pick
// A fish's tip: one line per behaviour field, which `npm test` asks for.
const DEBUG_BEHAVIOURS = {
  chase: 'swims straight at you',
  spit:  'keeps its distance and spits shots at you',
  bite:  'opens its jaws when it is close, then bites \u2014 get out of reach',
  fuse:  'swells when you come close, bursts and comes on again \u2014 step out of its ring',
  weave: 'sways side to side as it comes \u2014 aim where it will be',
  lunge: 'winds up, then lunges along its line \u2014 step aside',
  fan:   'spits a fan of shots \u2014 slip between them',
  touch: 'hurts to touch',
};
// `of` marks a cap that is the game's own, shown beside the count.
const DEBUG_COUNTS = [
  ...ENEMY_TYPES.map(e => ({ name: e.name, col: 1, max: DEBUG_FISH_MAX, tip: () => fishTip(e, debugSetup.grade) })),
  ...EQUIPMENT.map(g => ({ name: g.name, col: 2, max: g.tiers.length, of: true, tip: () => gearTip(g) })),
  ...ATTRIBUTES.map(a => ({ name: a.name, col: 2, max: DEBUG_STEPS_MAX, tip: () => stepTip(a) })),
  ...MODS.map(m => ({ name: m.name, col: 3, max: m.max, of: true, tip: () => modTip(m) })),
  ...WEAPONS.map(w => ({ name: w.name, max: w.tiers.length, of: true })),
];
// A weapon mod enters a dive only with a weapon it fits (D99); otherwise dim.
const countRow = c => ({
  label: c.name,
  col: c.col,
  get value() { const n = debugSetup.counts[c.name] || 0; return c.of ? n + ' / ' + c.max : n; },
  get dim() { const m = MODS.find(x => x.name === c.name); return !!m?.weapons && !m.weapons.includes(debugSetup.weapon); },
  get tip() { return c.tip(); },
  change: d => { debugSetup.counts[c.name] = wrapStep(debugSetup.counts[c.name] || 0, d, c.max); },
});

// Dive sits under the tallest column, so new content pushes it down; the
// browser suite holds it above the hint.
const DEBUG_COLS = ['WHERE', 'FISH', 'DIVER', 'MODS'];
const DEBUG_TOP = 236, DEBUG_STEP = 32, DEBUG_COL_W = 280;
const debugColX = c => ARENA_W * (2 * c + 1) / (2 * DEBUG_COLS.length);
function debugBottom() {
  const items = MENUS.debug.items;
  return DEBUG_TOP + DEBUG_STEP * Math.max(...DEBUG_COLS.map((_, c) => items.filter(r => r.col === c).length));
}
function debugRect(i) {
  const items = MENUS.debug.items, r = items[i];
  if (r.col === undefined) return { x: ARENA_W / 2 - ROW_W / 2, y: debugBottom() + 70, w: ROW_W, h: 30 };
  const k = items.slice(0, i).filter(x => x.col === r.col).length;
  return { x: debugColX(r.col) - DEBUG_COL_W / 2, y: DEBUG_TOP + k * DEBUG_STEP - 22, w: DEBUG_COL_W, h: 30 };
}
// The label half moves nothing; ‹ lowers and › raises, either side of the value.
function clickStep(r, x) {
  return x < r.x + r.w / 2 ? 0 : x < r.x + r.w * 3 / 4 ? -1 : 1;
}

// ---------- menus ----------
// A screen is a menu exactly when it has an entry here: `step()` asks
// `MENUS[screen]`, and the water stops on every menu but one that `flows`.
// What depends on state is a getter, so the renderer reads every field alike.
//
// Go home opens marked (`endDive()`), so a stray Enter or Space -- the dash --
// never starts a dive.
const END_TOP = ARENA_H / 2 + 100;
const GO_HOME = { get label() { return debugSetup ? 'Setup' : 'Go home'; },
                  run: () => openMenu(debugSetup ? 'debug' : 'home') };
const BACK_HOME = { label: 'Back', run: () => openMenu('home') };
const needs = g => (meets(g) ? '' : '   needs ' +
  Object.entries(g.requires).map(([a, n]) => a + ' ' + n).join(', '));
const tierLabel = g => {
  const t = meta.gear[g.name] || 0, cost = nextCost(g);
  // What the next tier changes, in words (D143).
  return 'tier ' + t + (cost === undefined ? ', the top' : ' → ' + (t + 1) + '   ' +
    moves(g.tiers[t].apply, WEAPONS.find(w => w.name === meta.carried)) + '   ' + cost + ' gems');
};
const END_MENU = {
  top: END_TOP,
  flows: true,
  back: GO_HOME.run,
  items: [{ get label() { return debugSetup ? 'Again' : 'Dive again'; },
            run: () => (debugSetup ? debugDive() : reset()) }, GO_HOME],
};

const MENUS = {
  title: {
    heading: 'ABYSS',
    sub: 'something small, in very deep water',
    top: MENU_TOP,
    items: [
      // With a dive under way, Start is Continue, straight back in (D76, D90).
      { get label() { return diveLive ? 'Continue' : 'Start'; },
        run: () => { if (diveLive) screen = resumeTo; else openMenu('home'); } },
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
      // Last, away from the cursor, and behind a warning (D103).
      { label: 'New game', run: () => openMenu('newGame') },
    ],
  },
  // Cancel first, so a stray Enter cancels (D103).
  newGame: {
    heading: 'NEW GAME',
    get sub() {
      return 'This erases your save for good: gems, gear, attributes, challenges and depth' +
             (diveLive ? ', and the dive in progress.' : '.');
    },
    warn: true,
    top: MENU_TOP,
    back: () => openMenu('title'),
    items: [
      { label: 'Cancel', run: () => openMenu('title') },
      { label: 'Erase everything and start', run: () => newGame() },
    ],
  },
  // Ending a dive by choice (D145): banked as any end (D67), asked first, as
  // a new game is.
  goHome: {
    heading: 'END THE DIVE?',
    get sub() { return 'The dive ends here. Its ' + currency + ' gems are kept.'; },
    warn: true,
    top: MENU_TOP,
    back: () => openMenu('paused'),
    items: [
      { label: 'Cancel', run: () => openMenu('paused') },
      { label: 'End the dive', run: () => { endDive(); GO_HOME.run(); } },
    ],
  },
  dead: END_MENU,
  won: END_MENU,
  paused: {
    heading: 'PAUSED',
    sub: '',
    // No sub, so its rows rise two rows into the room, and the challenges
    // under them stay clear of the hint.
    top: MENU_TOP - 2 * ROW_STEP,
    challenges: true,
    back: () => { screen = resumeTo; },
    items: [
      { label: 'Resume',        run: () => { screen = resumeTo; } },
      { label: 'Help',          run: () => openScreen('help') },
      { label: 'Catalogue',     run: () => openScreen('catalogue') },
      { label: 'Options',       run: () => openScreen('options') },
      { get label() { return GO_HOME.label; }, run: () => openMenu('goHome') },
      // Pausing saved the dive, and the title offers it back. The debug mode
      // saved nothing (D102).
      { get label() { return debugSetup ? 'Quit to setup' : 'Quit to title'; },
        run: () => openMenu(debugSetup ? 'debug' : 'title') },
    ],
  },
  home: {
    heading: 'HOME',
    // Depth in metres, at 10 world px to the metre: flavour, Claude's pick --
    // the world has no unit of its own.
    get sub() {
      const p = points();
      return meta.bank + ' gems      ' + p + (p === 1 ? ' point' : ' points') +
             '      deepest ' + Math.round(meta.deepest / 10) + 'm';
    },
    // Unlocked layers by name, the next as ???, the rest hidden (D66).
    get lines() {
      return LAYERS.slice(0, meta.cleared + 2).map((layer, l) => l > meta.cleared
        ? { text: '???', locked: true }
        : { text: layer.name + (l < meta.cleared ? '   cleared' : '') });
    },
    // What the next dive starts with (D147), read-only: what is carried and
    // owned, dim while unbought, then the numbers it all adds up to.
    get kit() {
      const w = WEAPONS.find(x => x.name === meta.carried) || WEAPONS[0], p = kitted(w);
      const tier = g => 'tier ' + (meta.gear[g.name] || 0);
      return [
        { name: w.name, value: tier(w) },
        ...EQUIPMENT.map(g => ({ name: g.name, value: tier(g), dim: !meta.gear[g.name] })),
        ...ATTRIBUTES.map(a => ({ name: a.name, value: String(meta.raised[a.name] || 0), dim: !meta.raised[a.name] })),
        null,
        ...KIT_STATS.map(([stat, unit]) => ({ name: STAT_NAMES[stat], value: +p[stat].toFixed(2) + unit })),
      ];
    },
    top: HOME_TOP,
    back: () => openMenu('title'),
    // What it sells is a screen deeper (D96, D114): on one, it would run
    // through the hint.
    items: [
      { label: 'Dive', run: () => reset() },             // every dive from the top (D66)
      { label: 'Weapons',    run: () => openMenu('weapons') },
      { label: 'Equipment',  run: () => openMenu('equipment') },
      { label: 'Attributes', run: () => openMenu('attributes') },
      { label: 'Catalogue',  run: () => openScreen('catalogue') },
      { label: 'Help',    run: () => openScreen('help') },
      { label: 'Options', run: () => openScreen('options') },
    ],
  },
  weapons: {
    heading: 'WEAPONS',
    get sub() { return meta.bank + ' gems'; },
    top: MENU_TOP,
    back: BACK_HOME.run,
    items: [
      ...WEAPONS.map(w => ({
        get label() {
          if (meta.carried === w.name) return w.name + '   equipped   ' + tierLabel(w);
          return w.name + '   ' + w.desc + (meta.owned.includes(w.name)
            ? '   tier ' + (meta.gear[w.name] || 0) + '   equip'
            : '   buy & equip   ' + w.cost + ' gems' + needs(w));
        },
        get dim() {
          return meta.carried === w.name ? !canBuy(w) : !meta.owned.includes(w.name) && !canOwn(w);
        },
        run: () => pickWeapon(w) })),
      BACK_HOME,
    ],
  },
  equipment: {
    heading: 'EQUIPMENT',
    get sub() { return meta.bank + ' gems'; },
    top: MENU_TOP,
    back: BACK_HOME.run,
    items: [
      ...EQUIPMENT.map(g => ({
        get label() { return g.name + '   ' + tierLabel(g) + needs(g); },
        get dim() { return !canBuy(g); },
        run: () => buy(g) })),
      BACK_HOME,
    ],
  },
  attributes: {
    heading: 'ATTRIBUTES',
    get sub() {
      const p = points();
      return p + (p === 1 ? ' point' : ' points') + ' to spend      each step costs a point more than the last';
    },
    top: MENU_TOP,
    back: BACK_HOME.run,
    challenges: true,                  // where points come from, under the rows (D109)
    items: [
      ...ATTRIBUTES.map(a => ({
        get label() {
          const n = meta.raised[a.name] || 0;
          return a.name + '   ' + n + ' → ' + (n + 1) + '   ' +
                 moves(a.apply, WEAPONS.find(w => w.name === meta.carried)) + '   ' + (n + 1) + (n ? ' points' : ' point');
        },
        get dim() { return points() < (meta.raised[a.name] || 0) + 1; },
        run: () => raise(a) })),
      BACK_HOME,
    ],
  },
  // No `back`: the title is not part of the debug mode's flow.
  debug: {
    heading: 'DEBUG',
    get sub() {
      return setupCode() + (debugSetup.ignored.length ? '      ignored: ' + debugSetup.ignored.join(', ') : '');
    },
    get lines() { return [gateLine()]; },
    rect: debugRect,
    items: [
      { label: 'Layer', col: 0, tip: 'Layer: where the dive starts; every layer draws from pools of its own',
        get value() { return debugSetup.layer + 1 + ' / ' + LAYERS.length; },
        change: d => {
          debugSetup.layer = wrapStep(debugSetup.layer, d, LAYERS.length - 1);
          clampSetup(debugSetup);                // its gate, held inside the new layer
        } },
      { label: 'Gate', col: 0, tip: "Gate: which of the layer's gates it starts at; the line above says what that gate drew",
        get value() { return debugSetup.gate + 1 + ' / ' + gatesIn(debugSetup.layer); },
        change: d => { debugSetup.gate = wrapStep(debugSetup.gate, d, gatesIn(debugSetup.layer) - 1); } },
      { label: 'Seed', col: 0, tip: "Seed: the dive's dice; one seed draws the same dive every time, and a change draws a new one",
        get value() { return debugSetup.seed; },
        change: () => { debugSetup.seed = newSeed(); } },
      { label: 'Immortal', col: 0, tip: 'Immortal: hits land and show, but take no HP',
        get value() { return debugSetup.immortal ? 'on' : 'off'; },
        change: () => { debugSetup.immortal = !debugSetup.immortal; } },
      { label: 'One-shot', col: 0, tip: 'One-shot: every shot does ' + ONE_SHOT + ' damage, enough for anything',
        get value() { return debugSetup.oneShot ? 'on' : 'off'; },
        change: () => { debugSetup.oneShot = !debugSetup.oneShot; } },
      { label: 'Grade', col: 1, tip: 'Grade: how strong every fish of the dive arrives; the same fish, stronger numbers',
        get value() { return debugSetup.grade + ' / ' + GRADES.length; },
        change: d => { debugSetup.grade = wrapStep(debugSetup.grade - 1, d, GRADES.length - 1) + 1; } },
      ...DEBUG_COUNTS.filter(c => c.col === 1).map(countRow),
      { label: 'Weapon', col: 2, get value() { return debugSetup.weapon; },
        get tip() { return weaponTip(WEAPONS.find(w => w.name === debugSetup.weapon)); },
        change: d => {
          const i = WEAPONS.findIndex(w => w.name === debugSetup.weapon);
          debugSetup.weapon = WEAPONS[wrapStep(i, d, WEAPONS.length - 1)].name;
        } },
      { label: 'Tier', col: 2,
        get tip() { return weaponTiersTip(WEAPONS.find(w => w.name === debugSetup.weapon)); },
        get value() {
          const w = DEBUG_COUNTS.find(c => c.name === debugSetup.weapon);
          return (debugSetup.counts[w.name] || 0) + ' / ' + w.max;
        },
        change: d => {
          const w = DEBUG_COUNTS.find(c => c.name === debugSetup.weapon);
          debugSetup.counts[w.name] = wrapStep(debugSetup.counts[w.name] || 0, d, w.max);
        } },
      ...DEBUG_COUNTS.filter(c => c.col === 2).map(countRow),
      ...DEBUG_COUNTS.filter(c => c.col === 3).map(countRow),
      { label: 'Dive', tip: 'Dive: plays this setup; R plays it again from any screen', run: () => debugDive() },
    ],
  },
};

const OPTIONS = [
  { label: 'Volume',
    show: () => Math.round(volume * 100) + '%',
    change: d => {
      volume = Math.max(0, Math.min(1, Math.round((volume + d * 0.1) * 10) / 10));
      sound('gem');                       // so you hear what you just set
    } },
  { label: 'Screen shake',
    show: () => SHAKE_LEVELS[shakeLevel].name,
    change: d => {
      shakeLevel = Math.max(0, Math.min(SHAKE_LEVELS.length - 1, shakeLevel + d));
    } },
  { label: 'Show FPS',
    show: () => (showFps ? 'on' : 'off'),
    change: () => { showFps = !showFps; } },
];

const HELP_KEYS = [
  ['Move',           'W A S D   or   arrow keys'],
  ['Aim',            'mouse'],
  ['Shoot or swing', 'hold left mouse button'],
  ['Dash',           'Space'],
  ['Choose a mod',   'arrows, click or 1 2 3,  then Enter or Continue'],
  ['Mute sound',     'M'],
  ['Menu / back',    'Esc'],
  ['Menus',          'mouse, or arrows + Enter'],
];

const HELP_BLURB = [
  'Hold the left mouse button to shoot along whatever you point at; the Knife swings there.',
  'Shots die at the edge of the ring, so range is a real range.',
  'Space dashes where you face: through the swarm unharmed, shoving it aside.',
  'One batch at a time, coming in waves; clear it all and the current takes you down to the next.',
  'Things you kill drop gems. They come to you on their own, and are yours to keep.',
  'Kill the glowing fish for a mod. Grab boosts before they fade. A boss\'s escorts come until it dies; then it heals you and offers a pick.',
  'Fish bite: when the jaws open, get away. Some spit; a puffer that swells is about to burst.',
  'Challenges pay the points for attributes, a rung at a time: see them under Attributes, or pause.',
];
