// Stop hook: blocks a reply citing a decision (D58) or a stage (S2) without
// its short name in brackets after it, as CLAUDE.md asks. "D58 — Name", the
// docs' heading form, names it too.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
// One retry: a second block in a row would loop forever on a false positive.
if (input.stop_hook_active) process.exit(0);

const lines = readFileSync(input.transcript_path, 'utf8').trim().split('\n');
const texts = [];
for (let i = lines.length - 1; i >= 0; i--) {
  let e;
  try { e = JSON.parse(lines[i]); } catch { continue; }
  const content = e.message?.content;
  if (e.type === 'user') {
    // Hook feedback and skill expansions arrive mid-turn as `isMeta` user
    // entries; stopping at them would leave the turn's earlier text unchecked.
    if (e.isMeta) continue;
    const isToolResult = Array.isArray(content) && content.some(c => c.type === 'tool_result');
    if (!isToolResult) break;                      // the prompt this reply answers
  } else if (e.type === 'assistant' && Array.isArray(content)) {
    for (const c of content) if (c.type === 'text') texts.unshift(c.text);
  }
}

const bare = [];
const re = /\b([DS]\d+)\b(?!\s*(\(|—))/g;
for (const m of texts.join('\n').matchAll(re)) bare.push(m[1]);

if (bare.length) {
  process.stderr.write(
    'Bare citation(s): ' + [...new Set(bare)].join(', ') + '. Every decision or stage ' +
    'is written with its short name in brackets right after it, e.g. "D58 (the ' +
    'descent)", "S2 (camera and descent)" -- in the TL;DR too. Rewrite the reply.\n');
  process.exit(2);
}
