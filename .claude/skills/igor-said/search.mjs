// Igor's own messages in this project's past sessions, matching a pattern:
//   node .claude/skills/igor-said/search.mjs <regex> [--before] [--max N]
// --before adds the end of Claude's reply each message answered.
import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const max = Number(args[args.indexOf('--max') + 1]) || 40;
const pattern = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--max');
if (!pattern) { console.error('usage: search.mjs <regex> [--before] [--max N]'); process.exit(1); }
const re = new RegExp(pattern, 'i');
const root = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');
const dir = join(homedir(), '.claude', 'projects', root.replace(/[^a-zA-Z0-9]/g, '-'));

const textOf = c => typeof c === 'string' ? c
  : Array.isArray(c) ? c.filter(p => p.type === 'text').map(p => p.text).join('\n') : '';
// What the harness wraps around or injects into a turn is not Igor's.
const typed = t => t.replace(/<(system-reminder|local-command-\w+|command-\w+|pasted_content)[^>]*>[\s\S]*?<\/\1>/g, '').trim();

const hits = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  let said = '';
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.isSidechain || o.isCompactSummary || o.isMeta) continue;
    if (o.type === 'assistant') { const t = textOf(o.message?.content); if (t.trim()) said = t; continue; }
    if (o.type !== 'user' || o.toolUseResult) continue;
    const t = typed(textOf(o.message?.content));
    if (t && re.test(t)) hits.push({ at: o.timestamp, session: f.slice(0, 8), text: t, said });
  }
}
// A resumed session carries its parent's messages again.
const seen = new Set();
hits.sort((a, b) => a.at.localeCompare(b.at));
hits.splice(0, hits.length, ...hits.filter(h => !seen.has(h.at + h.text) && seen.add(h.at + h.text)));
for (const h of hits.slice(-max)) {
  console.log('── ' + h.at.slice(0, 16).replace('T', ' ') + ' · ' + h.session);
  if (flag('--before') && h.said) console.log('  Claude: …' + h.said.slice(-400).replace(/\s+/g, ' '));
  console.log('  Igor: ' + (h.text.length > 1200 ? h.text.slice(0, 1200) + ' …' : h.text));
}
console.log(hits.length + ' messages' + (hits.length > max ? ', the last ' + max + ' shown' : ''));
