#!/usr/bin/env node
/** One-shot: fix saveHistory usage in generate_teen_situation_reel.cjs */
const fs = require('fs');
const p = 'scripts/generate_teen_situation_reel.cjs';
let t = fs.readFileSync(p, 'utf8');
const bad = `history.push({ title: pack.title, problem: pack.problem, at: meta.createdAt });
  saveHistory(HIST, history);`;
const good = `saveHistory(HIST, { title: pack.title, problem: pack.problem, quote: (pack.quote && pack.quote.text) || '' });`;
if (t.includes(bad)) {
  t = t.replace(bad, good);
  fs.writeFileSync(p, t);
  console.log('patched saveHistory');
} else if (t.includes('saveHistory(HIST, history)')) {
  t = t.replace(/history\.push\(\{ title: pack\.title, problem: pack\.problem, at: meta\.createdAt \}\);\s*saveHistory\(HIST, history\);/, good);
  fs.writeFileSync(p, t);
  console.log('patched saveHistory (regex)');
} else {
  console.log('already ok or pattern moved');
}
