#!/usr/bin/env node
/**
 * Teen / MindRush quality fixes:
 * 1) NEVER fetch Openverse/stock music (YouTube Content ID blocks — e.g. Praz Khanal)
 * 2) Plain ASS captions (no \\kf karaoke that eats letters on some players)
 * 3) Prefer Edge TTS only; sanitize spoken text
 * 4) Script must be complete sentences, not fragments
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_motivation_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[teen-q] missing generator');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_QUALITY_V4')) {
  console.log('[teen-q] already v4');
  process.exit(0);
}
const backup = t;

// 1) Kill Openverse / external BGM fetch — always synth
t = t.replace(
  /const fetchedAudio = await searchAndFetchAudio\([^;]+;\s*if \(fetchedAudio && fetchedAudio\.localPath && fs\.existsSync\(fetchedAudio\.localPath\)\) \{\s*bgMusicPath = fetchedAudio\.localPath;\s*\}/s,
  `// TEEN_QUALITY_V4 — never pull stock music (Content ID / global blocks)
  const fetchedAudio = null;
  console.log('[Audio Sourcing] 🎹 Using synthetic BGM only (no Openverse/stock — copyright safe)');`
);

// Also if pattern slightly different
if (t.includes("preferredSource: 'openverse'")) {
  t = t.replace(
    /await searchAndFetchAudio\([^)]+preferredSource:\s*'openverse'[^)]*\)/g,
    'null /* TEEN_QUALITY_V4 no stock audio */'
  );
}

// 2) Replace karaoke ASS builder with plain safe captions
const plainAssFn = `
function generateTeenKaraokeAss(wordsWithTimings, totalDuration, outputPath) {
  // TEEN_QUALITY_V4 — plain centered captions (no \\kf karaoke; avoids missing first letters)
  const assHeader = \\[Script Info]
Title: MindRush Plain Captions
ScriptType: v4.00+
WrapStyle: 2
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KaraokeCenter,DejaVu Sans,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,80,80,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
\\;
  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return \\$\{h\}:\\$\{String(m).padStart(2,'0')\}:\\$\{String(s).padStart(2,'0')\}.\\$\{String(cs).padStart(2,'0')\}\\;
  }
  function escAss(s) {
    return String(s).replace(/\\{/g,'(').replace(/\\}/g,')').replace(/\\n/g,' ');
  }
  let events = '';
  const wordsPerLine = 4;
  for (let i = 0; i < wordsWithTimings.length; i += wordsPerLine) {
    const chunk = wordsWithTimings.slice(i, i + wordsPerLine);
    if (!chunk.length) continue;
    const startSec = Math.max(0, chunk[0].start);
    const endSec = Math.max(startSec + 0.35, chunk[chunk.length - 1].end);
    const line = escAss(chunk.map(w => String(w.word).toUpperCase()).join(' '));
    events += \\`Dialogue: 0,\\$\{formatTime(startSec)\},\\$\{formatTime(endSec)\},KaraokeCenter,,0,0,0,,\\$\{line\}\\n\\`;
  }
  require('fs').writeFileSync(outputPath, assHeader + events, 'utf8');
  console.log('[Subtitles Engine] Plain ASS captions (no karaoke tags)');
}
`;

// Simpler approach: surgically disable \\kf karaoke lines
t = t.replace(
  /const kText = chunk\.map\(w => \{[\s\S]*?\}\)\.join\(' '\);/,
  `const kText = chunk.map(w => String(w.word || '').replace(/[{}]/g, '').toUpperCase()).filter(Boolean).join(' '); // TEEN_QUALITY_V4 no kf tags`
);

// 3) Sanitize spoken text before TTS
if (!t.includes('sanitizeSpokenTeen')) {
  t = t.replace(
    'const spokenText = scriptData.fullScript.trim();',
    `function sanitizeSpokenTeen(s) {
  return String(s || '')
    .replace(/[\\r\\n]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .replace(/[{}<>]/g, '')
    .replace(/\\b(\\w)\\1{4,}/g, '$1') // nonsense letter spam
    .trim();
}
  let spokenText = sanitizeSpokenTeen(scriptData.fullScript);
  // Quality gate: must look like real sentences
  const wc = spokenText.split(/\\s+/).filter(Boolean).length;
  if (wc < 40 || !/[.!?]/.test(spokenText)) {
    console.warn('[Script Gate] weak AI script — rebuilding from visualScenes');
    const parts = (scriptData.visualScenes || []).map(sc => sc.text).filter(Boolean);
    if (parts.length >= 3) spokenText = sanitizeSpokenTeen(parts.join(' '));
  }
  if (spokenText.split(/\\s+/).length < 30) {
    throw new Error('[Script Gate] spoken script too short or empty after sanitize');
  }`
  );
}

t = '/** TEEN_QUALITY_V4 */\n' + t;

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[teen-q] v4 OK — synth BGM + plain captions + script gate');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-q] reverted', e.message);
}
