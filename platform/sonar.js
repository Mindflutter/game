// ===== Sonar: the play-test recorder and its replay (S10) =====
// The game is deterministic, so a play is what the player fed in -- the seam's
// keys, justPressed and aim, a frame at a time -- and the seeds new dives drew;
// a replay rebuilds everything else (specs/2026-10-28-sonar-design.md). The
// replay half is pure, so tests/ loads it beside game/.

// Every seed a dive draws, recorded as drawn and fed back in order on replay.
let sonarFeed = null;
let sonarDrawn = [];
const drawSeed = newSeed;
newSeed = () => {
  const s = sonarFeed ? sonarFeed.shift() : drawSeed();
  sonarDrawn.push(s);
  return s;
};

// A few numbers of the state, so a replay gone off its recording says where.
// No diver until the first dive.
const sonarProbe = () => [rngState, Math.round(player?.x * 256), Math.round(player?.y * 256),
                          player?.hp, kills, enemies?.length, screen].join(' ');

function sonarBegin(start) {
  if (!('debug' in start)) return loadSave(start.save);
  openDebug(start.debug, start.seed);
  return '';
}

// Plays a segment -- its start, then a line a frame -- up to tick `at`, calling
// `onTick(tick, frame)` after each. Returns every probe that differs, with the
// screen the recording was on.
function sonarReplay(lines, at = Infinity, onTick = () => {}) {
  const [head, ...frames] = lines, offs = [];
  sonarFeed = lines.flatMap(l => l.s || []);
  sonarBegin(head.start);
  [aim.x, aim.y] = head.a;
  let tick = 0, held = head.k;
  for (const f of frames) {
    if (f.a) [aim.x, aim.y] = f.a;
    if (f.k) held = f.k;
    keys.clear();
    for (const k of held) keys.add(k);
    justPressed.clear();
    for (const k of f.j || []) justPressed.add(k);
    // update() clears justPressed, so a frame's presses reach its first tick alone, as live.
    for (let i = 0; i < f.n; i++) {
      if (tick >= at) return offs;
      update(FIXED_DT);
      onTick(++tick, f);
    }
    if (f.c && sonarProbe() !== f.c) offs.push({ tick, screen: f.c.split(' ').at(-1) });
  }
  return offs;
}

// ---------- the recorder ----------
// Lines a frame that ran a tick: `n` ticks, `ms` of wall clock, and `a` aim,
// `k` held keys, `j` presses, `s` seeds, `e` window events, `c` a probe, each
// only when it has something. A frame that ran no tick is dropped: its presses
// stay in justPressed for the next one, as update() leaves them. Each line is
// text from the moment it is written, so a send that fails costs nothing to retry.
let sonar = null;
let sonarTag = '';
const SONAR_PROBE_TICKS = Math.round(1 / FIXED_DT);
const SONAR_SEND_MS = 2000;

function sonarRecorder(start, test = {}, head = {}) {
  const error = sonarBegin(start), [what, n] = Object.entries(test.limit || {})[0] || [];
  sonar = { id: test.id || '', what, n, tick: 0, k: JSON.stringify([...keys]), a: aim.x + ' ' + aim.y, events: [],
            closed: 0, cleared: 0, played: 0, dives: 0, live: diveLive, done: false,
            out: [JSON.stringify({ ...head, start, s: sonarDrawn.splice(0), a: [aim.x, aim.y], k: [...keys] })] };
  return error;
}

// The frame loop's one call: the frame's ticks, recorded.
function sonarFrame(elapsed) {
  const j = sonar && [...justPressed], ticks = advanceBy(elapsed);
  if (!sonar || ticks === 0) return;
  const r = sonar, line = { n: ticks, ms: Math.round(elapsed * 1000) };
  const a = aim.x + ' ' + aim.y, k = JSON.stringify([...keys]);
  if (a !== r.a) { line.a = [aim.x, aim.y]; r.a = a; }
  if (k !== r.k) { line.k = [...keys]; r.k = k; }
  if (j.length) line.j = j;
  if (sonarDrawn.length) line.s = sonarDrawn.splice(0);
  if (r.events.length) line.e = r.events.splice(0);
  if (Math.floor((r.tick + ticks) / SONAR_PROBE_TICKS) > Math.floor(r.tick / SONAR_PROBE_TICKS)) line.c = sonarProbe();
  r.tick += ticks;
  r.out.push(JSON.stringify(line));
  sonarProgress(ticks);
}

// The limit only draws: a game state the platform set would not replay.
function sonarProgress(ticks) {
  const r = sonar, closed = story.filter(g => 'secs' in g && !g.died).length;
  r.cleared += Math.max(0, closed - r.closed);
  r.closed = closed;
  if (screen === 'playing') r.played += ticks * FIXED_DT;
  if (r.live && !diveLive) r.dives += 1;
  r.live = diveLive;
  const has = { gates: r.cleared, secs: Math.floor(r.played), dives: r.dives }[r.what];
  if (r.what && has >= r.n && !r.done) { r.done = true; r.events.push('done'); }
  sonarTag = 'SONAR ' + r.id + (r.what ? ' · ' + (r.done ? 'done — tell Claude' : has + '/' + r.n + ' ' + r.what) : '');
}

// The browser's half: what the window did, and the lines sent to `npm run
// play` as they come and as the page closes. Lines leave the queue only once
// the server has them: a gap would not replay.
function sonarRecord(test, start) {
  const error = sonarRecorder(start, test, { sonar: test.id, window: [innerWidth, innerHeight], wall: new Date().toISOString() });
  const url = '/sonar/' + test.id + '/' + test.seg, text = lines => lines.join('\n') + '\n';
  let flying = 0;
  setInterval(() => {
    if (flying || !sonar.out.length) return;
    flying = sonar.out.length;
    fetch(url, { method: 'POST', body: text(sonar.out.slice(0, flying)) })
      .then(r => { if (r.ok) sonar.out.splice(0, flying); })
      .catch(() => console.error('sonar: the recording waits for npm run play'))
      .finally(() => { flying = 0; });
  }, SONAR_SEND_MS);
  window.addEventListener('pagehide', () => {
    if (sonar.out.length > flying) navigator.sendBeacon(url, text(sonar.out.slice(flying)));
  });
  document.addEventListener('visibilitychange', () => sonar.events.push(document.hidden ? 'hidden' : 'shown'));
  window.addEventListener('blur', () => sonar.events.push('blur'));
  window.addEventListener('focus', () => sonar.events.push('focus'));
  sonarProgress(0);
  return error;
}
