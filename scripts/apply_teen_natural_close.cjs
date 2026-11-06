#!/usr/bin/env node
/**
 * Teen closes: no fixed "take action / motivation doesn't change" slogan.
 * Rotate natural, topic-tied endings; strip generic appends.
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[teen-close] missing');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_NATURAL_CLOSE_V2')) {
  console.log('[teen-close] already');
  process.exit(0);
}

const helper = `
// TEEN_NATURAL_CLOSE_V2
function pickNaturalClose(problem, scenes) {
  const topic = String(problem || (scenes && scenes[0] && scenes[0].text) || 'this').toLowerCase();
  const pool = [
    (p) => 'You already know the feeling. The only part that still counts is the next small choice you make when the video ends.',
    (p) => 'None of this lands unless it shows up in how you handle the next hour.',
    (p) => 'Keep the insight. Drop the performance. Prove it once, quietly.',
    (p) => 'If this hit, do not save it for later — change one tiny habit tied to it today.',
    (p) => 'The clip is free. The discipline is not. You decide which one you leave with.',
    (p) => 'Hearing it is easy. Living it for ten minutes is the real test.',
    (p) => 'Stop collecting advice about this. Pick one move and finish it before sleep.',
    (p) => 'You do not need a bigger speech. You need a smaller, honest next step.',
    (p) => 'If nothing changes after this, the words were just noise. Make them cost something.',
    (p) => 'Let the feeling pass. Keep the one decision that would make tomorrow slightly lighter.'
  ];
  // topic-aware variants
  if (/sleep|tired|exhaust|night/.test(topic)) {
    pool.unshift((p) => 'Protect one sleep window tonight. That is more useful than another pep talk.');
  }
  if (/phone|scroll|social|tiktok|instagram/.test(topic)) {
    pool.unshift((p) => 'Put the phone face down for the next twenty minutes. That is the whole experiment.');
  }
  if (/exam|study|school|grade|class/.test(topic)) {
    pool.unshift((p) => 'Open the notes for fifteen focused minutes. Progress beats another motivational loop.');
  }
  if (/friend|lonely|reject|social anxiety|compare/.test(topic)) {
    pool.unshift((p) => 'Text one real person, or sit with yourself without performing. Either is braver than scrolling.');
  }
  if (/money|broke|job|hustle/.test(topic)) {
    pool.unshift((p) => 'Learn one free skill for thirty minutes. Money stories start with boring practice.');
  }
  const idx = Math.abs(String(topic).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + Date.now() % 97) % pool.length;
  return pool[idx](topic);
}
function hardenTeenClose(data) {
  if (!data || !Array.isArray(data.scenes) || !data.scenes.length) return data;
  const last = data.scenes[data.scenes.length - 1];
  let text = String(last.text || '').trim();
  // strip known generic slogans
  text = text
    .replace(/Motivation on a screen changes nothing by itself[^.]*\.?/gi, '')
    .replace(/Only the next action you take after this video counts\.?/gi, '')
    .replace(/take action[, ]*now\.?/gi, '')
    .replace(/motivation alone (and watching a video )?do(es)? NOT create[^.]*\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const looksGeneric = !text || /take action|motivation (on a screen|alone)|after (you )?watch|changes nothing/i.test(text);
  if (looksGeneric || text.split(/\s+/).length < 8) {
    last.text = pickNaturalClose(data.problem, data.scenes);
  } else {
    // keep AI close if it already feels natural and topic-tied
    last.text = text;
  }
  last.role = 'close';
  return data;
}
`;

// inject helper once
if (!t.includes('function pickNaturalClose')) {
  const i = t.indexOf('async function buildAiPackage');
  if (i > 0) t = t.slice(0, i) + helper + '\n' + t.slice(i);
  else t = helper + t;
}

// replace forced slogan append
t = t.replace(
  /const close = data\.scenes\[data\.scenes\.length - 1\];\s*const closeText = String\(close\.text \|\| ''\);\s*if \(!\/action\|do the\|what you do\|after \(you \)\?watch\|not enough\|doesn't change\|will not change\/i\.test\(closeText\)\) \{\s*close\.text =\s*closeText\.replace\(\/\\\.\?\\s\*\$\/, ''\) \+\s*' Motivation on a screen changes nothing by itself\. Only the next action you take after this video counts\.';\s*\}/,
  `data = hardenTeenClose(data);
        const close = data.scenes[data.scenes.length - 1];
        const closeText = String(close.text || '');`
);

// also catch slightly different formatting
if (t.includes('Motivation on a screen changes nothing by itself')) {
  t = t.replace(
    /close\.text\s*=\s*[\s\S]{0,80}Motivation on a screen changes nothing by itself[\s\S]{0,80};/,
    'data = hardenTeenClose(data);'
  );
}

// ensure harden runs before return
if (!t.includes('hardenTeenClose(data)') && t.includes('if (data?.scenes?.length >= 5')) {
  t = t.replace(
    /if \(data\?\.scenes\?\.length >= 5 && data\.title && data\.scenes\.every\(\(s\) => s\.text && s\.visualQuery\)\) \{/,
    `if (data?.scenes?.length >= 5 && data.title && data.scenes.every((s) => s.text && s.visualQuery)) {
        data = hardenTeenClose(data);`
  );
}

// soften system prompt last-scene rule
t = t.replace(
  /The LAST scene MUST teach: motivation alone and watching a video do NOT create physical change — only the viewer's next real-world action does\. Phrase it freshly every time, tied to THIS topic \(never copy a fixed slogan\)\./,
  'The LAST scene is a quiet, natural close tied to THIS problem. No slogans. No "take action now". Sound like a sharp friend, not a coach yelling. Vary the ending every time.'
);

fs.writeFileSync(p, t);
console.log('[teen-close] patched');
