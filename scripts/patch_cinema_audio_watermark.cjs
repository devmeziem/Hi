#!/usr/bin/env node
/**
 * Cinema post-process patches on generate_documentary_movie_reel.cjs:
 * - Remove CINEMA VANGUARD / channel watermark stamps (keep karaoke captions)
 * - Force audible BGM (higher volume, always synth fallback)
 * - Prefer complete voice+BGM mix
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.error('missing documentary generator');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');
let n = 0;

// 1) Kill brand watermark strings on slides / outro
const kills = [
  [/CINEMA VANGUARD[^<]*/gi, ''],
  [/ARCHIVAL INVESTIGATION/gi, ''],
  [/Cinema Vanguard/g, ''],
  [/@CinemaVanguard/gi, ''],
  [/FOLLOW FOR MORE/g, 'THE END']
];
for (const [re, rep] of kills) {
  const next = t.replace(re, rep);
  if (next !== t) {
    t = next;
    n++;
  }
}

// 2) Raise default BGM volume 0.25 -> 0.42
if (t.includes('let bgmVolume = 0.25')) {
  t = t.replace('let bgmVolume = 0.25', 'let bgmVolume = 0.42');
  n++;
}
if (t.includes('getWorkflowVoiceSettings(\'cinema\').bgmVolume || 0.25')) {
  t = t.replace(
    "getWorkflowVoiceSettings('cinema').bgmVolume || 0.25",
    "Math.max(0.38, getWorkflowVoiceSettings('cinema').bgmVolume || 0.42)"
  );
  n++;
}

// 3) Always synthesize BGM even when openverse returns a path (double-ensure after fetch)
if (t.includes('if (!bgMusicPath || !fs.existsSync(bgMusicPath))')) {
  t = t.replace(
    'if (!bgMusicPath || !fs.existsSync(bgMusicPath)) {
    console.log(`[Audio Sourcing] 🎹 Synthesizing cinematic atmospheric OST (${totalDuration.toFixed(1)}s, ${chosenEpisode.genre})...`);
    const synthBgm = path.join(ARTIFACTS_DIR, `doc_bgm_${Date.now()}.wav`);
    generateCinematicAmbientSoundtrack(synthBgm, totalDuration, chosenEpisode.genre);
    if (fs.existsSync(synthBgm)) bgMusicPath = synthBgm;
  }',
    `// Always layer a guaranteed synth bed (openverse alone is often inaudible / missing)
  {
    console.log('[Audio Sourcing] Synthesizing guaranteed cinematic BGM bed...');
    const synthBgm = path.join(ARTIFACTS_DIR, 'doc_bgm_' + Date.now() + '.wav');
    generateCinematicAmbientSoundtrack(synthBgm, totalDuration, chosenEpisode.genre);
    if (fs.existsSync(synthBgm) && fs.statSync(synthBgm).size > 1000) {
      bgMusicPath = synthBgm;
      console.log('[Audio Sourcing] BGM locked', fs.statSync(synthBgm).size, 'bytes');
    } else if (!bgMusicPath || !fs.existsSync(bgMusicPath)) {
      throw new Error('HOLLOW: no BGM after synth');
    }
  }`
  );
  n++;
}

// 4) Stronger synth chord levels so BGM is audible under voice
t = t.replace(
  /\*0\.20 \+ sin\(2\*PI\*58\.27\*t\)\*0\.16 \+ sin\(2\*PI\*110\*t\)\*0\.10\)/,
  '*0.35 + sin(2*PI*58.27*t)*0.28 + sin(2*PI*110*t)*0.18)'
);
t = t.replace(
  /\*0\.18 \+ sin\(2\*PI\*98\.00\*t\)\*0\.14 \+ sin\(2\*PI\*123\.47\*t\)\*0\.10\)/,
  '*0.32 + sin(2*PI*98.00*t)*0.26 + sin(2*PI*123.47*t)*0.18)'
);
t = t.replace(
  /\*0\.18 \+ sin\(2\*PI\*164\.81\*t\)\*0\.13 \+ sin\(2\*PI\*220\*t\)\*0\.09\)/,
  '*0.32 + sin(2*PI*164.81*t)*0.24 + sin(2*PI*220*t)*0.16)'
);

// 5) Voice slightly lower so BGM reads (1.35 -> 1.15)
if (t.includes('[1:a]volume=1.35')) {
  t = t.replace('[1:a]volume=1.35', '[1:a]volume=1.15');
  n++;
}

// 6) Minimum total duration pad for "complete" feel
if (t.includes('const totalDuration = voiceDuration + 3.5')) {
  t = t.replace(
    'const totalDuration = voiceDuration + 3.5',
    'const totalDuration = Math.max(55, voiceDuration + 5.0) // complete short-doc floor'
  );
  n++;
}

fs.writeFileSync(p, t);
console.log('[patch-cinema] applied changes, markers=', n);
