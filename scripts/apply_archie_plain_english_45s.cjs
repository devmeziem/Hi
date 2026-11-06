#!/usr/bin/env node
/**
 * Archie quality:
 * - Plain English only (no jargon / nonsense AI filler)
 * - Hard cap ~45s social length
 * - Prefer heavy compositor when v2 loses character
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[archie-plain] missing');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_PLAIN_ENGLISH_45S')) {
  console.log('[archie-plain] already');
  process.exit(0);
}

const marker = '// ARCHIE_PLAIN_ENGLISH_45S\n';

// Strengthen system prompt if present
t = t.replace(
  /spokenScript 95-130 words:/,
  'spokenScript 70-100 words MAX (about 40-45 seconds when spoken):'
);

if (!t.includes('PLAIN ENGLISH ONLY')) {
  t = t.replace(
    /JSON: title, description, spokenScript/,
    `PLAIN ENGLISH ONLY — explain like a smart 15-year-old.
No jargon, no buzzwords, no filler, no "in conclusion", no fake science words.
One clear fact + one real example + one takeaway. If you cannot explain simply, rewrite.
JSON: title, description, spokenScript`
  );
}

// Inject jargon detector + rewrite before return of AI package
if (!t.includes('function isArchieJargon')) {
  const helper = `
${marker}function isArchieJargon(text) {
  const s = String(text || '').toLowerCase();
  if (s.length < 40) return true;
  const bad = [/paradigm/, /synergy/, /leverage the/, /holistic/, /quantum realm/, /multiverse of/, /in today's digital age/, /it is important to note/, /delve into/, /tapestry/, /landscape of/, /cutting-edge solutions/, /revolutionize/, /game-changer/, /unlock the power/, /as an ai/, /language model/];
  let hits = 0;
  for (const r of bad) if (r.test(s)) hits++;
  // too many long words
  const words = s.split(/\s+/).filter(Boolean);
  const long = words.filter(w => w.length > 12).length;
  if (long > words.length * 0.25) hits++;
  return hits >= 2;
}
function sanitizeArchieScript(d, topic, example, enrich) {
  if (!d || typeof d !== 'object') d = {};
  let spoken = String(d.spokenScript || '');
  if (isArchieJargon(spoken) || !spoken.trim()) {
    const title = String(topic?.title || d.title || 'this idea').slice(0, 80);
    const ex = String(example?.snippet || example?.title || '').slice(0, 100);
    const teach = String(enrich?.wiki?.extract || '').slice(0, 160);
    spoken = 'Here is a simple fact about ' + title + '. ' +
      (ex ? ('For example, ' + ex + '. ') : '') +
      (teach ? (teach + ' ') : '') +
      'The takeaway is simple: once you notice this, you start seeing it in real life. That is the whole point.';
    d.spokenScript = spoken;
    d._sanitized = true;
    console.warn('[Archie] sanitized jargon / weak script');
  }
  // hard length for ~45s speech
  const words = String(d.spokenScript).split(/\s+/).filter(Boolean);
  if (words.length > 110) {
    d.spokenScript = words.slice(0, 100).join(' ');
  }
  return d;
}
`;
  // insert before buildScript or after requires
  const idx = t.indexOf('async function buildScript');
  if (idx > 0) t = t.slice(0, idx) + helper + t.slice(idx);
  else t = helper + t;
}

// wrap AI success return
t = t.replace(
  /if \(d\?\.spokenScript && d\?\.title\) \{([\s\S]*?)return d;\s*\}/,
  `if (d?.spokenScript && d?.title) {$1
        d = sanitizeArchieScript(d, topic, example, enrich);
        if (isArchieJargon(d.spokenScript)) continue;
        return d;
      }`
);

// Prefer heavy renderer (character visible) — soft swap v2 first order
if (t.includes('composeArchieV2') && !t.includes('FORCE_ARCHIE_HEAVY')) {
  t = t.replace(
    /let rendered;[\s\S]*?console\.log\('\[Archie\] used v2 compositor'\);[\s\S]*?rendered = await renderArchieHeavy\(\{ script, voiceWav, brollPath: broll, bgmPath: bgm\.localPath \}\);\s*\}/,
    `let rendered;
  // FORCE_ARCHIE_HEAVY: character on screen is required; v2 only if heavy fails
  try {
    rendered = await renderArchieHeavy({ script, voiceWav, brollPath: broll, bgmPath: bgm && bgm.localPath });
    console.log('[Archie] used heavy compositor (character)');
  } catch (e) {
    console.warn('[Archie] heavy failed, trying v2:', e.message);
    const { composeArchieV2 } = require('./archie_v2_compositor.cjs');
    const _txt = (script && (script.spokenScript || script.voiceover)) || '';
    const v2 = await composeArchieV2({ voiceWav, scriptText: String(_txt), brollPath: broll, bgmPath: bgm && bgm.localPath, seed: (script && script.title) || Date.now(), studio: (script && script.studio) || 'black', outPath: path.join(RENDERED, 'archie_latest.mp4') });
    rendered = { out: v2.outPath, latest: v2.outPath, total: v2.duration };
  }`
  );
}

// Cap final duration if possible after render
if (!t.includes('ARCHIE_MAX_SEC')) {
  t = t.replace(
    /fs\.writeFileSync\(path\.join\(RENDERED, 'archie_latest_meta\.json'\)/,
    `// ARCHIE_MAX_SEC ~45 for social
  try {
    const maxSec = parseFloat(process.env.ARCHIE_MAX_SEC || '45') || 45;
    if (rendered && rendered.total > maxSec + 1 && rendered.out && fs.existsSync(rendered.out)) {
      const trimmed = path.join(RENDERED, 'archie_latest_45.mp4');
      execSync('ffmpeg -y -i "' + rendered.out + '" -t ' + maxSec + ' -c copy "' + trimmed + '"', { stdio: 'pipe' });
      if (fs.existsSync(trimmed) && fs.statSync(trimmed).size > 10000) {
        fs.copyFileSync(trimmed, rendered.out);
        rendered.total = maxSec;
        console.log('[Archie] trimmed to', maxSec, 's');
      }
    }
  } catch (e) { console.warn('[Archie] trim soft-fail', e.message); }
  fs.writeFileSync(path.join(RENDERED, 'archie_latest_meta.json')`
  );
}

fs.writeFileSync(p, t);
console.log('[archie-plain] patched');
