#!/usr/bin/env node
/** Reject telegraphic / incomplete Fin AI scripts; require full sentences + 5 concrete moves. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_fin_income_short.cjs');
if (!fs.existsSync(p)) {
  console.warn('[fin-quality] missing');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('FIN_COMPLETE_LESSON_V1')) {
  console.log('[fin-quality] already');
  process.exit(0);
}
const backup = t;

const helper = `
function assertFinScriptComplete(ai) {
  // FIN_COMPLETE_LESSON_V1
  const spoken = String(ai.spokenScript || ai.spoken || '').replace(/\s+/g, ' ').trim();
  const words = spoken.split(/\s+/).filter(Boolean);
  if (words.length < 45) {
    throw new Error('Fin script too short (' + words.length + ' words) — refusing incomplete lesson');
  }
  // must look like sentences
  if ((spoken.match(/[.!?]/g) || []).length < 3) {
    throw new Error('Fin script lacks full sentences');
  }
  const badBits = [/\\btypes zero-based\\b/i, /\\bdata food transport\\b/i, /; types /i, /start with phone notes three/i];
  for (const re of badBits) {
    if (re.test(spoken)) throw new Error('Fin script looks telegraphic/broken');
  }
  return spoken;
}
`;

if (!t.includes('assertFinScriptComplete')) {
  t = t.replace(
    /(const \{ execSync \} = require\('child_process'\);)/,
    "$1\n" + helper
  );
  if (!t.includes('assertFinScriptComplete')) {
    t = helper + '\n' + t;
  }
}

// Hook after AI returns
if (t.includes('ai.spokenScript') && !t.includes('assertFinScriptComplete(ai)')) {
  t = t.replace(
    /(const ai = [\s\S]{0,200}?spokenScript[\s\S]{0,120}?;)/,
    '$1\n  assertFinScriptComplete(ai);'
  );
  // alternate: before edgeTts
  t = t.replace(
    /if \(!\(await edgeTts\(ai\.spokenScript/,
    'assertFinScriptComplete(ai);\n  if (!(await edgeTts(ai.spokenScript'
  );
  t = t.replace(
    /if \(!edgeTts\(ai\.spokenScript/,
    'assertFinScriptComplete(ai);\n  if (!edgeTts(ai.spokenScript'
  );
}

// Strengthen prompt fragment if present
t = t.replace(
  /spokenScript must be/gi,
  'spokenScript must be 80-160 words, full spoken sentences, 5 concrete student money moves with examples, never telegraphic lists without verbs, spokenScript must be'
);

t = '/** FIN_COMPLETE_LESSON_V1 */\n' + t;

try {
  fs.writeFileSync(p, t);
  execSync('node --check "' + p + '"', { stdio: 'pipe' });
  console.log('[fin-quality] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[fin-quality] reverted', e.message);
}
