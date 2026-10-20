#!/usr/bin/env node
/** Fix repeated action/discipline outros mixed into the end of Teen VO. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[teen-dedupe] missing');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_END_DEDUPE_V1')) {
  console.log('[teen-dedupe] already');
  process.exit(0);
}
const backup = t;

const inject = `
  // TEEN_END_DEDUPE_V1 — one close only; strip repeated action/discipline lines from body
  function sanitizeTeenScenes(scenes) {
    if (!Array.isArray(scenes) || !scenes.length) return scenes;
    const actionRe = /motivation on a screen|only the next action|watching a video (does|will) not|discipline is (what|the)|actions you take after/i;
    const out = scenes.map((s, i) => {
      const isLast = i === scenes.length - 1;
      let text = String(s.text || '').replace(/\s+/g, ' ').trim();
      if (!isLast && actionRe.test(text)) {
        // Remove closing slogans from mid scenes
        text = text
          .split(/(?<=[.!?])\s+/)
          .filter((sent) => !actionRe.test(sent))
          .join(' ')
          .trim();
        if (!text) text = String(s.text || '').split(/[.!?]/)[0] + '.';
      }
      return { ...s, text, role: isLast ? 'close' : s.role };
    });
    // Force a single short unique close (no multi-slogan pileup)
    const last = out[out.length - 1];
    let close = String(last.text || '').replace(/\s+/g, ' ').trim();
    // Keep at most 2 sentences in close
    const sents = close.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sents.length > 2) close = sents.slice(-2).join(' ');
    if (!actionRe.test(close)) {
      close = (close.replace(/\.\s*$/, '') + '. Real change starts after you close this app — one concrete action today.').trim();
    }
    out[out.length - 1] = { ...last, role: 'close', text: close };
    return out;
  }
`;

// Insert helper near top after requires block
if (!t.includes('function sanitizeTeenScenes')) {
  const anchor = 'const VOICE_VOL = (VOLUMES.teen && VOLUMES.teen.voice) || 1.55;';
  if (t.includes(anchor)) {
    t = t.replace(anchor, anchor + '\n' + inject);
  } else {
    t = inject + '\n' + t;
  }
}

// After AI package validated, sanitize scenes
t = t.replace(
  'if (!data.bgmQuery) data.bgmQuery = \'hopeful cinematic ambient piano soft drums\';',
  `data.scenes = sanitizeTeenScenes(data.scenes);
        if (!data.bgmQuery) data.bgmQuery = 'hopeful cinematic ambient piano soft drums';`
);

// Soften forced append that was stacking slogans
t = t.replace(
  /close\.text\s*=\s*[\s\S]*?Only the next action you take after this video counts\.';/,
  `close.role = 'close';
          // single short close — sanitizeTeenScenes will finalize`
);

// Dedupe spoken assembly
t = t.replace(
  'for (const s of pack.scenes) spokenParts.push(String(s.text).trim());\n  const spoken = spokenParts.join(\' \');',
  `pack.scenes = sanitizeTeenScenes(pack.scenes);
  for (const s of pack.scenes) spokenParts.push(String(s.text).trim());
  // collapse accidental repeated sentences
  const spokenRaw = spokenParts.join(' ');
  const seen = new Set();
  const spoken = spokenRaw
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const k = s.toLowerCase().replace(/[^a-z0-9\s]/g, '').slice(0, 80);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join(' ');`
);

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[teen-dedupe] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-dedupe] reverted', e.message);
}
