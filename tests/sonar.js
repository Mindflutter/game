// `npm run sonar` (S10): reads play-tests back by replaying them.
//   npm run sonar                     the play-tests, and their plays
//   npm run sonar <id>                replays every play: report.md, events.jsonl, timeline.jsonl
//   npm run sonar <id> <play> <tick>  the whole state at one tick
// Each play replays on the build copied beside it, so it is the game Igor played.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadReplay, ticks } from './harness.js';
import { table } from './measure.js';

const SONAR = fileURLToPath(new URL('../logs/sonar/', import.meta.url));
const URL_AT = (id, play, tick) => `http://localhost:8765/logs/sonar/${id}/${play}/build/index.html?replay&at=${tick}`;
const plays = id => readdirSync(join(SONAR, id)).filter(f => /^\d+$/.test(f) && existsSync(join(SONAR, id, f, 'input.jsonl')))
                                                 .sort((a, b) => a - b);
const lines = (id, play) => readFileSync(join(SONAR, id, play, 'input.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const r1 = n => Math.round(n * 10) / 10;
const clock = ms => Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');

const game = (id, play) => loadReplay(pathToFileURL(join(SONAR, id, play, 'build') + '/'));

// Every moment of a play, found by watching the state change tick by tick.
function read(id, play) {
  const g = game(id, play), rec = lines(id, play);
  const events = [], timeline = [], dives = [];
  let wall = 0, frame = null, p = null, end = 'left';
  const at = (tick, kind, more) => events.push({ tick, secs: r1(tick * g.FIXED_DT), wall: clock(wall), dive: r1(g.elapsed ?? 0),
                                                 n: dives.length + 1, kind, ...more });
  const held = {}, perSec = ticks(g, 1);
  const look = () => ({
    screen: g.screen, story: g.story, gates: g.story.length, open: g.story.at(-1), hp: g.player?.hp,
    hits: g.story.at(-1)?.hits?.length || 0, boosts: g.story.at(-1)?.boosts?.length || 0,
    dashes: g.story.at(-1)?.dashes || 0, mods: { ...g.modCounts }, bought: g.meta.bought.length,
    fish: new Set(g.enemies || []), live: g.diveLive, cleared: g.story.filter(r => 'secs' in r).length,
    elapsed: g.elapsed, kills: g.kills,
  });
  // A gate the dive left open -- a debug dive closes none -- closed as the game would.
  const close = (story, s) => {
    const r = story.at(-1);
    if (r && !('secs' in r)) Object.assign(r, { secs: r1(s.elapsed - r.at), hp: s.hp, kills: s.kills - r.kills, open: true });
    return story;
  };
  const offs = g.sonarReplay(rec, Infinity, (tick, f) => {
    if (f !== frame) {
      frame = f;
      wall += f.ms;
      for (const e of f.e || []) at(tick, 'window', { what: e });
      // A key held ten seconds is a moment: a key-up the browser lost looks like this.
      if (f.k) {
        for (const k of f.k) held[k] ??= wall;
        for (const k of Object.keys(held)) {
          if (f.k.includes(k)) continue;
          if (!/^(Mouse|Meta)/.test(k) && wall - held[k] >= 10000) at(tick, 'held', { key: k, for: r1((wall - held[k]) / 1000) + 's' });
          delete held[k];
        }
      }
    }
    const n = look();
    if (p) {
      if (n.screen !== p.screen) at(tick, 'screen', { from: p.screen, to: n.screen });
      if (n.screen === 'dead' || n.screen === 'won') end = n.screen;
      if (n.story !== p.story) {
        if (p.story.length) dives.push({ play, story: close(p.story, p), end });
        end = 'left';
      }
      if (n.story === p.story) {
        if (n.gates > p.gates) at(tick, 'gate', { gate: n.open.gate, layer: n.open.layer, fish: n.open.fish });
        if (n.cleared > p.cleared) {
          const r = n.story.findLast(s => 'secs' in s);
          at(tick, r.died ? 'died' : 'cleared', { gate: r.gate, secs: r.secs, hp: r.hp });
        }
      }
      for (const e of p.fish) if (!n.fish.has(e) && e.gone) at(tick, 'kill', { fish: e.name + (e.grade > 1 ? '@' + e.grade : '') });
      if (n.hp < p.hp) at(tick, 'hit', { by: n.hits > p.hits ? n.open.hits.at(-1) : undefined, hp: n.hp, lost: p.hp - n.hp });
      if (n.hp > p.hp && n.live === p.live) at(tick, 'heal', { hp: n.hp });
      if (n.boosts > p.boosts) at(tick, 'boost', { name: n.open.boosts.at(-1) });
      if (n.dashes > p.dashes) at(tick, 'dash');
      for (const [m, c] of Object.entries(n.mods)) if (c > (p.mods[m] || 0)) at(tick, 'mod', { name: m });
      if (n.bought > p.bought) at(tick, 'buy', { what: g.meta.bought.at(-1) });
    }
    p = n;
    if (tick % perSec === 0) {
      timeline.push({ tick, wall: clock(wall), screen: g.screen, dive: r1(g.elapsed ?? 0), batch: g.batchIndex, gems: g.currency,
                      camera: Math.round(g.cameraY ?? 0),
                      diver: g.player && { x: Math.round(g.player.x), y: Math.round(g.player.y), hp: g.player.hp, maxHp: g.player.maxHp },
                      fish: (g.enemies || []).map(e => [e.name, e.grade, Math.round(e.hp), Math.round(e.x), Math.round(e.y)]) });
    }
  });
  if (g.story.length) dives.push({ play, story: close(g.story, look()), end: g.diveLive ? 'playing' : end });
  const total = rec.slice(1).reduce((a, l) => a + l.n, 0);
  return { play, head: rec[0], offs, perSec, ticks: total, wall, events, timeline, dives,
           hitches: rec.filter(l => l.ms > 50).length, done: events.find(e => e.kind === 'window' && e.what === 'done') };
}

// Time on each screen, from the screen changes.
function screens(r) {
  const out = {};
  let from = 0, on = r.events.find(e => e.kind === 'screen')?.from ?? 'title';
  for (const e of [...r.events.filter(e => e.kind === 'screen'), { tick: r.ticks, to: null }]) {
    out[on] = (out[on] || 0) + (e.tick - from) / r.perSec;
    from = e.tick;
    on = e.to;
  }
  return Object.entries(out).map(([s, t]) => s + ' ' + r1(t) + 's').join(', ');
}

// Where a replay is off, so a reader can tell what past it still holds.
function replayCell(r) {
  const [first] = r.offs, on = [...new Set(r.offs.map(o => o.screen))];
  return first ? `**${r.offs.length} probes off, from tick ${first.tick}, on ${on.join(', ')}**` : 'exact';
}

// A row a dive: its time, the hits and what took them, the HP, the layers, the bosses, the pauses.
const diveRow = (r, d, i) => {
  const ev = r.events.filter(e => e.n === i + 1), sum = k => d.story.reduce((a, s) => a + (k(s) || 0), 0);
  const hits = ev.filter(e => e.kind === 'hit'), last = d.story.at(-1);
  const layers = [...new Set(d.story.map(s => s.layer))].map(l => {
    const gs = d.story.filter(s => s.layer === l), lg = gs.at(-1);
    return 'L' + l + ' ' + Math.round(lg.at + lg.secs - gs[0].at) + 's';
  }).join(', ');
  let pausedTicks = 0, from = null;
  for (const e of ev.filter(e => e.kind === 'screen')) {
    if (e.to === 'paused') from = e.tick;
    else if (e.from === 'paused' && from !== null) { pausedTicks += e.tick - from; from = null; }
  }
  return [r.play, i + 1, d.end, r1(last.at + last.secs) + 's', d.story.length, layers,
          d.story.filter(s => s.fish.startsWith('boss')).map(s => s.secs + 's').join(', '), sum(s => s.hits.length),
          sum(s => s.guarded), hits.reduce((a, e) => a + e.lost, 0), hits.length ? Math.min(...hits.map(e => e.hp)) : '-',
          ev.filter(e => e.kind === 'screen' && e.to === 'paused').length + ', ' + r1(pausedTicks / r.perSec) + 's'];
};

const gateRow = (r, d, i, s) => [r.play, i + 1 + ' ' + d.end, s.gate, s.layer, s.fish, s.secs + (s.died ? ' died' : s.open ? ' open' : ''),
  s.hits.length + (s.hits.length ? ' (' + s.hits.join(', ') + ')' : ''), s.guarded || 0, s.hp, s.kills,
  s.shots || 0, s.dashes || 0, (s.boosts || []).join(', '), (s.mods || []).join(', ')];

function report(id) {
  const test = JSON.parse(readFileSync(join(SONAR, id, 'test.json'), 'utf8'));
  const reads = plays(id).map(play => read(id, play));
  const md = ['# Sonar: ' + id, '', '**Purpose**: ' + test.purpose, '', '**Start**: `' + JSON.stringify(test.start).slice(0, 200) + '`',
              '**Limit**: `' + JSON.stringify(test.limit || null) + '`', '', '**Play**: ' + (test.play || ''), ''];
  if (test.measures) md.push('**Measures**:', ...test.measures.map(m => '- ' + m), '');
  md.push('## Plays', '', table(['play', 'wall', 'ticks', 'screens', 'dives', 'limit met', 'hitches >50ms', 'replay'],
    reads.map(r => [r.play, clock(r.wall), r.ticks, screens(r), r.dives.length, r.done ? r.done.wall : 'no', r.hitches, replayCell(r)])));
  md.push('', '## Dives', '', table(['play', 'dive', 'end', 'dive time', 'gates', 'layers', 'bosses', 'hits', 'guarded', 'HP lost', 'lowest HP', 'pauses'],
    reads.flatMap(r => r.dives.map((d, i) => diveRow(r, d, i)))));
  md.push('', '## Dives, a row a gate', '', table(['play', 'dive', 'gate', 'layer', 'fish', 'secs', 'hits (by)', 'guarded', 'hp', 'kills', 'shots', 'dashes', 'boosts', 'mods'],
    reads.flatMap(r => r.dives.flatMap((d, i) => d.story.map(s => gateRow(r, d, i, s))))));

  md.push('', '## Moments', '', 'Pauses, menus, deaths, buys, the window away, and every hit; each with its replay.', '');
  for (const r of reads) {
    md.push('### Play ' + r.play, '');
    for (const e of r.events.filter(e => !['kill', 'dash', 'boost'].includes(e.kind))) {
      const { tick, secs, wall, dive, n, kind, ...more } = e;
      md.push(`- ${wall} (tick ${tick}, dive ${dive}s) **${kind}** ${Object.entries(more).filter(([, v]) => v !== undefined).map(([k, v]) => k + ' ' + v).join(', ')} — [replay](${URL_AT(id, r.play, tick)})`);
    }
    md.push('');
  }
  writeFileSync(join(SONAR, id, 'report.md'), md.join('\n') + '\n');
  writeFileSync(join(SONAR, id, 'events.jsonl'), reads.flatMap(r => r.events.map(e => JSON.stringify({ play: r.play, ...e }))).join('\n') + '\n');
  writeFileSync(join(SONAR, id, 'timeline.jsonl'), reads.flatMap(r => r.timeline.map(t => JSON.stringify({ play: r.play, ...t }))).join('\n') + '\n');
  console.log('logs/sonar/' + id + '/report.md: ' + reads.length + ' plays, ' + reads.flatMap(r => r.dives).length + ' dives' +
              reads.filter(r => r.offs.length).map(r => '; play ' + r.play + ': ' + replayCell(r).replace(/\*/g, '')).join(''));
}

const [id, play, tick] = process.argv.slice(2);
if (!id) {
  for (const t of existsSync(SONAR) ? readdirSync(SONAR).filter(f => existsSync(join(SONAR, f, 'test.json'))) : []) {
    console.log(t + ': ' + plays(t).length + ' plays -- ' + JSON.parse(readFileSync(join(SONAR, t, 'test.json'), 'utf8')).purpose);
  }
} else if (play === undefined) report(id);
else {
  const g = game(id, play);
  const offs = g.sonarReplay(lines(id, play), Number(tick));
  console.log(JSON.stringify({ offs, screen: g.screen, meta: g.meta, dive: g.diveLive ? g.snapshot() : null }, null, 1));
  console.log('drawn: ' + URL_AT(id, play, tick));
}
