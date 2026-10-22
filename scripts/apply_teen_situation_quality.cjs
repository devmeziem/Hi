#!/usr/bin/env node
/** Patch generate_teen_situation_reel.cjs: no stock BGM, no karaoke kf, script sanitize */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_SIT_QUALITY_V1')) {
  console.log('[teen-sit-q] already');
  process.exit(0);
}
const backup = t;

// Replace resolveBgm to synthetic only
const newResolveBgm = `
async function resolveBgm(query, durationSec) {
  // TEEN_SIT_QUALITY_V1 — NEVER fetch Openverse/stock music (YouTube Content ID blocks globally)
  console.log('[Teen] BGM synthetic only (copyright-safe). ignored query:', query);
  const out = path.join(ART, 'teen_synth_bgm.wav');
  const d = Math.max(12, Number(durationSec) || 30);
  // Soft ambient pad — original synth, not a library track
  const expr = "(0.08*sin(2*PI*130.81*t)+0.06*sin(2*PI*164.81*t)+0.05*sin(2*PI*196*t)+0.04*sin(2*PI*246.94*t))*exp(-0.15*mod(t,3))";
  execSync(
    'ffmpeg -y -f lavfi -i "aevalsrc=' + "'" + expr + "':s=44100:d=" + d.toFixed(2) + '" -af "volume=0.35,afade=t=in:st=0:d=1.2,afade=t=out:st=' + (d - 1.5).toFixed(2) + ':d=1.4" -c:a pcm_s16le "' + out + '"',
    { stdio: 'pipe' }
  );
  if (!fs.existsSync(out) || fs.statSync(out).size < 1000) {
    execSync('ffmpeg -y -f lavfi -i "sine=f=220:d=' + d.toFixed(2) + '" -af volume=0.05 "' + out + '"', { stdio: 'pipe' });
  }
  return out;
}
`;

if (t.includes('async function resolveBgm')) {
  t = t.replace(/async function resolveBgm\([\s\S]*?\n\}\n\nfunction renderSceneClip/, newResolveBgm + '\nfunction renderSceneClip');
} else {
  console.warn('[teen-sit-q] resolveBgm not found');
}

// Kill \\kf karaoke — plain uppercase words only
t = t.replace(
  /kLine \+= `\{\\kf\$\{wordCs\}\}\$\{String\(w\)\.toUpperCase\(\)\} `;/g,
  "kLine += String(w).replace(/[{}]/g, '').toUpperCase() + ' '; // TEEN_SIT_QUALITY_V1 no kf"
);

// Safer ASS style: bottom-center Alignment 2, no BorderStyle 3 box eating glyphs
t = t.replace(
  /Style: CenterKaraoke,DejaVu Sans,48,&H00FFFFFF,&H0000D7FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,70,70,60,1/,
  'Style: CenterKaraoke,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,80,80,180,1'
);

// Sanitize spoken before TTS
if (t.includes('const spoken = spokenParts.join') && !t.includes('TEEN_SIT_QUALITY_V1_SANITIZE')) {
  t = t.replace(
    'const spoken = spokenParts.join(\' \');',
    `const spoken = spokenParts.join(' ')
    .replace(/[\\r\\n]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .replace(/[{}<>]/g, '')
    .trim(); // TEEN_SIT_QUALITY_V1_SANITIZE
  if (spoken.split(/\\s+/).length < 25) throw new Error('Teen script too short after sanitize');`
  );
}

t = '/** TEEN_SIT_QUALITY_V1 */\n' + t;
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[teen-sit-q] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-sit-q] reverted', e.message);
}
