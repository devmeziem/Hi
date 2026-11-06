#!/usr/bin/env node
/** Soft caps: teen/fin/drift ~40-45s, stoic short stays short, long form left alone. */
const fs = require('fs');
const path = require('path');

const notes = [];
function touchEnvExample() {
  // Document for workflows
  notes.push('Set TARGET_DURATION_SEC=45 or MAX_VIDEO_SEC=45 in workflow env');
}

// Patch fin listicle if overlong voice
const fin = path.join(process.cwd(), 'scripts', 'generate_fin_listicle_short.cjs');
if (fs.existsSync(fin)) {
  let t = fs.readFileSync(fin, 'utf8');
  if (!t.includes('SOCIAL_CAP_45')) {
    t = t.replace(
      /const vDur = Math\.min\(58,/
      'const vDur = Math.min(45, // SOCIAL_CAP_45'
    );
    fs.writeFileSync(fin, t);
    notes.push('fin listicle capped 45s');
  }
}

const teen = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (fs.existsSync(teen)) {
  let t = fs.readFileSync(teen, 'utf8');
  if (!t.includes('SOCIAL_CAP_45') && t.includes('probeDuration')) {
    // soft note only — hard trim often elsewhere
    t = 'process.env.TEEN_MAX_SEC = process.env.TEEN_MAX_SEC || "45"; // SOCIAL_CAP_45\n' + t;
    fs.writeFileSync(teen, t);
    notes.push('teen env max 45');
  }
}

touchEnvExample();
console.log('[social-caps]', notes.join('; ') || 'ok');
