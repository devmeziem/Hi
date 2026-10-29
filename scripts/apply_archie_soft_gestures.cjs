#!/usr/bin/env node
/** Soft-fail Archie pass_gestures so render continues without puppet overlay */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('SOFT_GESTURE_FAIL')) {
  console.log('[archie-soft] already applied');
  process.exit(0);
}
const needle = "runFfmpeg(gestCmd, 'pass_gestures');";
if (!t.includes(needle)) {
  console.log('[archie-soft] pattern missing');
  process.exit(0);
}
t = t.replace(
  needle,
  `try {
    runFfmpeg(gestCmd, 'pass_gestures');
  } catch (ge) {
    // SOFT_GESTURE_FAIL — filtergraph stream mismatch; ship video without puppet overlay
    console.warn('[Archie] gestures skipped:', String(ge.message).slice(0, 220));
    const src = (typeof sceneMp4 !== 'undefined' && sceneMp4 && fs.existsSync(sceneMp4)) ? sceneMp4 : baseMp4;
    try { fs.copyFileSync(src, gestMp4); } catch (e2) { throw ge; }
  }`
);
fs.writeFileSync(p, t);
console.log('[archie-soft] applied');
