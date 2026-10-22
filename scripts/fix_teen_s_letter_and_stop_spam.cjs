#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) { console.log('[teen-s-fix] missing'); process.exit(0); }
let t = fs.readFileSync(p, 'utf8');
const backup = t;
t = t.replace("pitch: '-28Hz'", "pitch: '-5Hz'");
t = t.replace("rate: '-10%'", "rate: '-4%'");
t = t.replace(
  'kLine += `{\\kf${wordCs}}${String(w).toUpperCase()} `;',
  "kLine += `${String(w).replace(/[{}]/g,'').toUpperCase()} `;"
);
t = t.replace(
  'Style: CenterKaraoke,DejaVu Sans,48,&H00FFFFFF,&H0000D7FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,70,70,60,1',
  'Style: CenterKaraoke,DejaVu Sans,44,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,60,60,220,1'
);
if (!t.includes('TEEN_SYNTH_BGM_INLINE')) {
  t = t.replace(
    "async function resolveBgm(query, durationSec) {\n  console.log('[Teen] BGM search:', query);",
    "async function resolveBgm(query, durationSec) {\n  // TEEN_SYNTH_BGM_INLINE\n  console.log('[Teen] BGM synthetic only');\n  const out = path.join(ART, 'teen_synth_bgm.wav');\n  const d = Math.max(12, Number(durationSec) || 30);\n  try { execSync('ffmpeg -y -f lavfi -i sine=f=196:d=' + d.toFixed(2) + ' -af volume=0.04 \"' + out + '\"', {stdio:'pipe'}); return out; } catch (e) { console.warn(e.message); }\n  console.log('[Teen] BGM search:', query);"
  );
}
if (!t.includes('[Teen] spoken sample')) {
  t = t.replace(
    "const spoken = spokenParts.join(' ');",
    "const spoken = spokenParts.join(' ');\n  console.log('[Teen] spoken sample:', spoken.slice(0, 180));\n  console.log('[Teen] spoken has S?', /s/i.test(spoken));"
  );
}
fs.writeFileSync(p, t);
try {
  execSync('node --check "' + p + '"', { stdio: 'pipe' });
  console.log('[teen-s-fix] OK plain captions + mild pitch + synth BGM');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-s-fix] soft-reverted', e.message);
}
process.exit(0);
