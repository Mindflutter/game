// `npm run play` (D163): the game at http://localhost:8765/, every dive's end
// writing the career so far, a dive a line, to logs/career.json, and the wall
// clock it came in at to logs/clock.txt -- the save holds no clock.
import { createServer } from 'node:http';
import { appendFileSync, mkdirSync, readFile, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8765;
const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
mkdirSync(join(root, 'logs'), { recursive: true });

createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c).on('end', () => {
      const n = JSON.parse(body).length;
      writeFileSync(join(root, 'logs', 'career.json'), body);
      appendFileSync(join(root, 'logs', 'clock.txt'), new Date().toISOString() + ' ' + n + ' dives\n');
      console.log('logged: ' + n + ' dives');
      res.end();
    });
    return;
  }
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  readFile(join(root, path === '/' ? 'index.html' : path), (err, data) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': TYPES[extname(path)] || 'text/html' });
    res.end(err ? 'not found' : data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('play at http://localhost:' + PORT + '/ -- every dive goes to logs/career.json'));
