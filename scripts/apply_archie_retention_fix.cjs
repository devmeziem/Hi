#!/usr/bin/env node
/** Lower captions + multi B-roll windows (not one long static hold). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_RETENTION_V3')) {
  console.log('[archie-ret] already v3');
  process.exit(0);
}
const backup = t;

// Force bottom captions (Alignment 2, MarginV 200+)
t = t.replace(
  /Style: Default,Arial Black,\d+,&H00FFFFFF,&H000000FF,&H0000F0FF,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,\d+,\d+,\d+,\d+,1/g,
  'Style: Default,Arial Black,64,&H00FFFFFF,&H000000FF,&H0000F0FF,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,2,60,60,200,1'
);
// Also common style variants
t = t.replace(/,5,50,50,140,1/g, ',2,60,60,200,1');
t = t.replace(/,5,50,50,120,1/g, ',2,60,60,200,1');

// Multi B-roll every ~7s for ~2.5s
if (!t.includes('MULTI_BROLL_V3')) {
  t = t.replace(
    /const brollMax = Math\.min\([^;]+;\s*const brollStart = Math\.max\([^;]+;\s*const brollEnd = Math\.min\([^;]+;/
    ,
    `// MULTI_BROLL_V3
  const brollClip = Math.min(2.6, parseFloat(process.env.BROLL_CLIP_SEC || '2.6') || 2.6);
  const brollGap = Math.max(6.5, parseFloat(process.env.BROLL_GAP_SEC || '7') || 7);
  const brollWindows = [];
  for (let t0 = 3.0; t0 + 1.2 < voiceDur - 1.0; t0 += brollGap) {
    brollWindows.push({ start: t0, end: Math.min(voiceDur - 0.6, t0 + brollClip) });
  }
  if (!brollWindows.length && voiceDur > 8) brollWindows.push({ start: voiceDur * 0.35, end: voiceDur * 0.35 + brollClip });
  const brollMax = brollClip;
  const brollStart = brollWindows[0] ? brollWindows[0].start : 2;
  const brollEnd = brollWindows[0] ? brollWindows[0].end : 4;`
  );

  // enable expression for all windows
  t = t.replace(
    /overlay=0:0:enable='between\(t,\$\{brollStart\.toFixed\(2\)\},\$\{brollEnd\.toFixed\(2\)\}\)'/,
    "overlay=0:0:enable='" +
      '${(brollWindows&&brollWindows.length?brollWindows:[{start:brollStart,end:brollEnd}]).map(w=>`between(t,${Number(w.start).toFixed(2)},${Number(w.end).toFixed(2)})`).join("+")}' + "'"
  );
}

t = '/** ARCHIE_RETENTION_V3 */\n' + t;
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[archie-ret] v3 OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[archie-ret] reverted', e.message);
}
