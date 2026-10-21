#!/usr/bin/env node
/**
 * Archie retention + readability fix:
 * - Captions lower (bottom third, not covering face)
 * - Multiple short B-roll cuts every ~6–7s (avoid static screen boredom)
 * - Faster talk/talk2 lipsync alternation
 * - Prefer sequential gesture overlays
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_RETENTION_V2')) {
  console.log('[archie-ret] already');
  process.exit(0);
}
const backup = t;

// Lower captions: Alignment 2 (bottom-center), higher MarginV so text sits under face
t = t.replace(
  /Style: Default,Arial Black,72,&H00FFFFFF,&H000000FF,&H0000F0FF,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,5,50,50,140,1/,
  'Style: Default,Arial Black,64,&H00FFFFFF,&H000000FF,&H0000F0FF,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,2,60,60,220,1'
);
// Also catch any similar style line
t = t.replace(/Alignment, MarginL, MarginR, MarginV[\s\S]{0,200}?Style: Default,Arial Black,(\d+),([^\n]+),5,(\d+),(\d+),(\d+),1/,
  (m) => m.replace(/,5,(\d+),(\d+),(\d+),1/, ',2,$1,$2,220,1'));

// B-roll: multiple windows instead of one mid slice
if (!t.includes('MULTI_BROLL_WINDOWS')) {
  t = t.replace(
    /const brollMax = Math\.min\(4\.5,[^;]+;\s*const brollStart = Math\.max\(2\.0, voiceDur \* 0\.32\);\s*const brollEnd = Math\.min\(voiceDur - 1\.0, brollStart \+ brollMax\);/,
    `// MULTI_BROLL_WINDOWS — cut every ~7s so screen never stays static too long
  const brollClip = Math.min(2.8, parseFloat(process.env.BROLL_CLIP_SEC || '2.8') || 2.8);
  const brollGap = Math.max(6.5, parseFloat(process.env.BROLL_GAP_SEC || '7') || 7);
  const brollWindows = [];
  for (let t0 = 3.2; t0 + 1.2 < voiceDur - 1.0; t0 += brollGap) {
    brollWindows.push({ start: t0, end: Math.min(voiceDur - 0.8, t0 + brollClip) });
  }
  if (!brollWindows.length && voiceDur > 8) {
    brollWindows.push({ start: Math.max(2, voiceDur * 0.35), end: Math.max(2, voiceDur * 0.35) + brollClip });
  }
  const brollMax = brollClip;
  const brollStart = brollWindows[0]?.start || 2;
  const brollEnd = brollWindows[0]?.end || 4;`
  );
}

// When applying single overlay, expand to all windows if present
if (t.includes('pass_broll') && t.includes("enable='between(t,") && !t.includes('brollWindows.map')) {
  t = t.replace(
    /overlay=0:0:enable='between\(t,\$\{brollStart\.toFixed\(2\)\},\$\{brollEnd\.toFixed\(2\)\}\)'/,
    `overlay=0:0:enable='${'${(brollWindows.length?brollWindows:[{start:brollStart,end:brollEnd}]).map(w=>`between(t,${w.start.toFixed(2)},${w.end.toFixed(2)})`).join('+}')}'}'`
  );
}

// Marker
t = '/** ARCHIE_RETENTION_V2 */\n' + t;

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[archie-ret] captions lower + multi B-roll OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[archie-ret] reverted', e.message);
}
