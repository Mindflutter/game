// `npm run play` (D163): the game at http://localhost:8765/, every dive's end
// writing the career so far, a dive a line, to logs/career.json, and the wall
// clock it came in at to logs/clock.txt -- the save holds no clock.
// `/?sonar=<id>` plays the play-test `<id>` of tests/playtests.json (S10): each
// page load is a play of its own, logs/<id>/<n>/, its build copied beside what
// it records, so it replays on the code it was played on. Nothing is cached:
// across several script tags a stale one runs a mix of old and new files.
import { createServer } from 'node:http';
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFile, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8765;
const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const LOGS = join(root, 'logs'), TESTS = join(root, 'tests', 'playtests.json');
const BUILD = ['index.html', 'main.js', 'checks.js', 'game', 'platform'];
const NAME = /^[\w.-]+$/;
mkdirSync(LOGS, { recursive: true });

function sonarPage(id, res) {
  const dir = join(LOGS, id), setup = JSON.parse(readFileSync(TESTS, 'utf8'))[id];
  if (!NAME.test(id) || !setup) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('no play-test "' + id + '" in tests/playtests.json');
  }
  const seg = (existsSync(dir) ? readdirSync(dir).filter(f => /^\d+$/.test(f)).length : 0) + 1;
  for (const f of BUILD) cpSync(join(root, f), join(dir, String(seg), 'build', f), { recursive: true });
  const test = { ...setup, id, seg }, save = test.start.save;
  // The page takes a save start as text, or null for a fresh one.
  if ('save' in test.start) test.start = { save: save === 'fresh' ? null : typeof save === 'string' ? save : JSON.stringify(save) };
  const html = readFileSync(join(root, 'index.html'), 'utf8').replace('<script src="game/content.js">',
    '<script>const SONAR_TEST = ' + JSON.stringify(test) + ';</script>\n<script src="game/content.js">');
  res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
  res.end(html);
  console.log('sonar: ' + id + ', play ' + seg);
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c).on('end', () => {
      const [, id, seg] = url.pathname.match(/^\/sonar\/([\w.-]+)\/(\d+)$/) || [];
      if (id) {
        mkdirSync(join(LOGS, id, seg), { recursive: true });
        appendFileSync(join(LOGS, id, seg, 'input.jsonl'), body);
        return res.end();
      }
      const n = JSON.parse(body).length;
      writeFileSync(join(root, 'logs', 'career.json'), body);
      appendFileSync(join(root, 'logs', 'clock.txt'), new Date().toISOString() + ' ' + n + ' dives\n');
      console.log('logged: ' + n + ' dives');
      res.end();
    });
    return;
  }
  if (url.pathname === '/' && url.searchParams.has('sonar')) return sonarPage(url.searchParams.get('sonar'), res);
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  readFile(join(root, path === '/' ? 'index.html' : path), (err, data) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': TYPES[extname(path)] || 'text/html', 'Cache-Control': 'no-store' });
    res.end(err ? 'not found' : data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('play at http://localhost:' + PORT + '/ -- every dive goes to logs/career.json;' +
                                              ' a play-test at /?sonar=<id>'));
