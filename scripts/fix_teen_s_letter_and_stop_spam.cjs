#!/usr/bin/env node
/**
 * HARD FIX for Teen:
 * 1) Letter S disappearing — caused by ASS {\\kf} karaoke + BorderStyle box clipping
 *    → replace with plain ASS, no override tags at all, Alignment 2, BorderStyle 1
 * 2) TTS sounding like it skips S — pitch was -28Hz (too extreme); clamp to -5Hz max depth
 * 3) Stock BGM still fetched — force synthetic only
 * 4) Do not touch posting here; workflow disables schedule/auto publish
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[teen-s-fix] missing generator');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_S_LETTER_FIX_V3')) {
  console.log('[teen-s-fix] already V3');
  process.exit(0);
}
const backup = t;

// 1) Pitch / rate — never extreme (sibilants die at -28Hz)
t = t.replace(/pitch:\s*'[^']*'/g, "pitch: '-5Hz'");
t = t.replace(/rate:\s*'[^']*'/g, "rate: '-4%'");
t = t.replace(/pitch:\s*"[^"]*"/g, 'pitch: "-5Hz"');

// 2) Replace entire buildCinemaStyleAss with safe plain version (no kf, no braces in text)
const plainAss = `
function buildCinemaStyleAss(fullText, duration) {
  // TEEN_S_LETTER_FIX_V3 — zero ASS override tags (no kf/k/b/i). Preserves every letter including S.
  function esc(s) {
    return String(s)
      .replace(/\\u0000/g, '')
      .replace(/[\\{\\}]/g, '') // braces only — NEVER strip A-Z letters
      .replace(/[\\r\\n]+/g, ' ')
      .replace(/[ \\t]+/g, ' ')
      .trim();
  }
  const words = esc(fullText).split(' ').filter(Boolean).map((w) => w.toUpperCase());
  const wordsPerLine = 4;
  const totalMs = Math.round(Math.max(8, Number(duration) || 30) * 1000);
  const msPerWord = words.length ? totalMs / words.length : 300;
  const fmt = (ms) => {
    const t = Math.max(0, Math.floor(ms));
    const cs = Math.floor((t % 1000) / 10);
    const sec = Math.floor(t / 1000) % 60;
    const min = Math.floor(t / 60000) % 60;
    const hr = Math.floor(t / 3600000);
    return hr + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const a = Math.round(i * msPerWord);
    const b = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 200));
    // Plain dialogue text — commas and S letters intact
    lines.push('Dialogue: 0,' + fmt(a) + ',' + fmt(b) + ',PlainCap,,0,0,0,,' + chunk.join(' '));
  }
  return [
    '[Script Info]',
    'Title: MindRush Plain',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: PlainCap,DejaVu Sans,44,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,60,60,220,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    lines.join('\\n')
  ].join('\\n');
}
`;

if (/function buildCinemaStyleAss\(/.test(t)) {
  t = t.replace(/function buildCinemaStyleAss\([\s\S]*?\n\}(?=\n)/, plainAss.trim() + '\n');
}

// 3) Nuke any remaining {\\kf or {\\k tags in file
t = t.replace(/\{\\kf\d+\}/g, '');
t = t.replace(/\{\\k\d+\}/g, '');
t = t.replace(/kLine \+= `\{\\kf[^`]+`/g, "kLine += String(w).toUpperCase() + ' '");

// 4) resolveBgm → synth only
if (/async function resolveBgm\(/.test(t)) {
  t = t.replace(
    /async function resolveBgm\([\s\S]*?\n\}/,
    `async function resolveBgm(query, durationSec) {
  console.log('[Teen] BGM synthetic only (no stock / no Content ID)');
  const out = path.join(ART, 'teen_synth_bgm.wav');
  const d = Math.max(12, Number(durationSec) || 30);
  try {
    execSync(
      'ffmpeg -y -f lavfi -i "sine=f=196:d=' +
        d.toFixed(2) +
        '" -af "volume=0.04,afade=t=in:st=0:d=1,afade=t=out:st=' +
        (d - 1.2).toFixed(2) +
        ':d=1" -c:a pcm_s16le "' +
        out +
        '"',
      { stdio: 'pipe' }
    );
  } catch (e) {
    execSync('ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ' + d.toFixed(2) + ' "' + out + '"', {
      stdio: 'pipe'
    });
  }
  return out;
}`
  );
}

// 5) Guard spoken text: never run a regex that deletes letter S
// Remove any accidental .replace(/s+/g  if a bad patch introduced it
t = t.replace(/\.replace\(\/s\+\/g,\s*' '\)/g, ".replace(/\\s+/g, ' ')");
t = t.replace(/\.replace\(\/s\/gi?,\s*''\)/g, '/* removed bad S-strip */');

t = '/** TEEN_S_LETTER_FIX_V3 */\n' + t;

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[teen-s-fix] V3 OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-s-fix] REVERTED', e.message);
  process.exit(1);
}
