#!/usr/bin/env node
/** When all AI providers fail, allow structured package instead of hard throw. */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[teen-soft] missing');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_SOFT_FALLBACK_PACKAGE')) {
  console.log('[teen-soft] already');
  process.exit(0);
}
const old = "throw new Error('Teen AI package failed after retries — refusing hardcoded script');";
if (!t.includes(old)) {
  console.log('[teen-soft] throw not found');
  process.exit(0);
}
const neu = `// TEEN_SOFT_FALLBACK_PACKAGE
  console.warn('[Teen AI] all providers failed — using structured dynamic package');
  const topic = (typeof problem !== 'undefined' && problem) || (typeof selected !== 'undefined' && selected) || {};
  const title = topic.title || topic.problem || 'Discipline when nobody is watching';
  const body =
    'Most people wait for motivation. The ones who move treat action like a schedule. ' +
    title +
    '. Start smaller than your pride wants. Finish one locked task before you scroll. ' +
    'Motivation does not change your life — the action you take after this video does.';
  return {
    spokenScript: body,
    hook: String(title).slice(0, 80),
    scenes: [
      { onScreen: 'START SMALL', visualQuery: 'teen studying desk night', seconds: 6 },
      { onScreen: 'LOCK ONE TASK', visualQuery: 'checklist notebook focus', seconds: 6 },
      { onScreen: 'ACTION > HYPE', visualQuery: 'sunrise walk alone', seconds: 6 },
      { onScreen: 'YOUR MOVE', visualQuery: 'student walking campus', seconds: 6 }
    ],
    hashtags: ['#MindRush', '#TeenMotivation', '#Discipline', '#LockIn', '#StudentMindset', '#Shorts'],
    source: 'soft_fallback'
  };`;
t = t.replace(old, neu);
fs.writeFileSync(p, t);
console.log('[teen-soft] patched');
