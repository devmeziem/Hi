#!/usr/bin/env node
/** Force-replace teen close block: no slogan, no const reassignment. */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');

const helper = `
function pickNaturalClose(problem, scenes) {
  const topic = String(problem || (scenes && scenes[0] && scenes[0].text) || 'this').toLowerCase();
  const pool = [
    'You already know the feeling. The only part that still counts is the next small choice you make when the video ends.',
    'None of this lands unless it shows up in how you handle the next hour.',
    'Keep the insight. Drop the performance. Prove it once, quietly.',
    'If this hit, change one tiny habit tied to it today — not tomorrow.',
    'The clip is free. The discipline is not. You decide which one you leave with.',
    'Hearing it is easy. Living it for ten minutes is the real test.',
    'Stop collecting advice about this. Pick one move and finish it before sleep.',
    'You do not need a bigger speech. You need a smaller, honest next step.',
    'If nothing changes after this, the words were just noise. Make them cost something.',
    'Let the feeling pass. Keep the one decision that would make tomorrow slightly lighter.'
  ];
  if (/sleep|tired|exhaust|night/.test(topic)) pool.unshift('Protect one sleep window tonight. That beats another pep talk.');
  if (/phone|scroll|social|tiktok|instagram/.test(topic)) pool.unshift('Put the phone face down for twenty minutes. That is the experiment.');
  if (/exam|study|school|grade|class/.test(topic)) pool.unshift('Open the notes for fifteen focused minutes. Progress beats another loop.');
  if (/friend|lonely|reject|compare/.test(topic)) pool.unshift('Text one real person, or sit with yourself without performing.');
  if (/money|broke|job|hustle/.test(topic)) pool.unshift('Learn one free skill for thirty minutes. Money stories start with boring practice.');
  const idx = Math.abs(String(topic).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + (Date.now() % 97)) % pool.length;
  return pool[idx];
}
function hardenTeenClose(pkg) {
  if (!pkg || !Array.isArray(pkg.scenes) || !pkg.scenes.length) return pkg;
  const last = pkg.scenes[pkg.scenes.length - 1];
  let text = String(last.text || '').trim()
    .replace(/Motivation on a screen changes nothing by itself[^.]*\.?/gi, '')
    .replace(/Only the next action you take after this video counts\.?/gi, '')
    .replace(/take action[, ]*now\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const generic = !text || /take action|motivation (on a screen|alone)|after (you )?watch|changes nothing/i.test(text) || text.split(/\s+/).length < 8;
  last.text = generic ? pickNaturalClose(pkg.problem, pkg.scenes) : text;
  last.role = 'close';
  return pkg;
}
`;

if (!t.includes('function pickNaturalClose')) {
  const i = t.indexOf('async function buildAiPackage');
  t = i > 0 ? t.slice(0, i) + helper + '\n' + t.slice(i) : helper + t;
}

// Replace the entire success block that forces the slogan
const bad = /if \(data\?\.scenes\?\.length >= 5 && data\.title && data\.scenes\.every\(\(s\) => s\.text && s\.visualQuery\)\) \{[\s\S]*?return data;\s*\}/;
const good = `if (data?.scenes?.length >= 5 && data.title && data.scenes.every((s) => s.text && s.visualQuery)) {
        let pkg = hardenTeenClose(data);
        if (!pkg.bgmQuery) pkg.bgmQuery = 'hopeful cinematic ambient piano soft';
        if (!Array.isArray(pkg.hashtags) || pkg.hashtags.length < 5) {
          pkg.hashtags = ['#MindRush','#TeenMotivation','#Discipline','#LockIn','#StudentMindset','#FYP','#StudyTok','#Shorts'];
        }
        return pkg;
      }`;
if (bad.test(t)) {
  t = t.replace(bad, good);
  console.log('[teen-close] replaced success block');
} else {
  console.log('[teen-close] pattern miss — appending soft note');
}

t = t.replace(
  /The LAST scene MUST teach:[^\n]+/,
  'The LAST scene is a quiet natural close tied to THIS problem. No slogans. No take action now. Sound like a sharp friend.'
);

fs.writeFileSync(p, t);
console.log('[teen-close] done');
