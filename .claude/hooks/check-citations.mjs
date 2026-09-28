// Stop hook: refuse a reply that cites a decision (D58) or a stage (S2) without
// its short name in brackets right after it -- "D58 (the descent)". CLAUDE.md
// asks for this; Igor had to repeat it four times, so it is enforced here
// instead of remembered.
//
// Reads the hook payload on stdin, collects the assistant text written since
// the last real user message, and exits 2 (block, with the reason on stderr)
// on the first bare citation. Docs headings use "D58 — Name"; that form is
// accepted too, since it names the decision.
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
    // Hook feedback, agent reports and skill expansions arrive as `isMeta`
    // user entries mid-turn. They are not the prompt; stopping at them left the
    // turn's earlier text unchecked.
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
