#!/usr/bin/env node
/**
 * TikTok quality pass (2026-10-27):
 * - Captions: dead-center (Alignment 5), Arial Black, bold+italic, NO opaque box
 * - Karaoke \kf: unspoken white → spoken black (invert fill as VO progresses)
 * - Teen: force B&W (hue=s=0), louder soft BGM under voice
 * - Cinema: DELETE 2-story vault; fail if AI fails (no Ghost Blimp / Amber Room)
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const ASS_STYLE_BLOCK = `Style: CenterKaraoke,Arial Black,56,&H00000000,&H00FFFFFF,&H00FFFFFF,&H00000000,-1,-1,0,0,100,100,0.8,-6,1,3.2,0,5,80,80,0,1`;

const ASS_HELPER = `
function buildCenterKaraokeAss(fullText, duration) {
  const words = String(fullText || '').replace(/\\n/g, ' ').split(/\\s+/).filter(Boolean);
  const wordsPerLine = 3;
  const totalMs = Math.max(1000, Math.round(Number(duration) * 1000));
  const msPerWord = words.length > 0 ? totalMs / words.length : 320;
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return hr + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 160));
    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(10, Math.round(msPerWord / 10));
      // karaoke fill: Secondary (white unread) -> Primary (black spoken)
      kLine += '{\\kf' + wordCs + '}' + String(w).toUpperCase() + ' ';
    }
    lines.push('Dialogue: 0,' + formatAssTime(chunkStartMs) + ',' + formatAssTime(chunkEndMs) + ',CenterKaraoke,,0,0,0,,' + kLine.trim());
  }
  return '[Script Info]\\nTitle: Center Karaoke Arial Black\\nScriptType: v4.00+\\nPlayResX: 1080\\nPlayResY: 1920\\nScaledBorderAndShadow: yes\\n\\n[V4+ Styles]\\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\\n' +
    'Style: CenterKaraoke,Arial Black,56,&H00000000,&H00FFFFFF,&H00FFFFFF,&H00000000,-1,-1,0,0,100,100,0.8,-6,1,3.2,0,5,80,80,0,1\\n\\n[Events]\\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\\n' +
    lines.join('\\n') + '\\n';
}
`;

function patchFile(rel, mutator) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.warn('[skip] missing', rel);
    return false;
  }
  const before = fs.readFileSync(p, 'utf8');
  const after = mutator(before);
  if (after === before) {
    console.log('[ok] no text change', rel);
    return true;
  }
  fs.writeFileSync(p, after);
  console.log('[patched]', rel);
  return true;
}

// --- Teen ---
patchFile('scripts/generate_teen_situation_reel.cjs', (t) => {
  // Replace ASS builder body with center karaoke Arial Black, no box
  if (t.includes('function buildCinemaStyleAss')) {
    t = t.replace(
      /function buildCinemaStyleAss\([\s\S]*?\n\}\n/,
      `function buildCinemaStyleAss(fullText, duration) {
  const words = String(fullText)
    .replace(/\\n/g, ' ')
    .split(/\\s+/)
    .filter(Boolean);
  const wordsPerLine = 3;
  const totalMs = Math.round(duration * 1000);
  const msPerWord = words.length > 0 ? totalMs / words.length : 320;
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return \`\${hr}:\${String(min).padStart(2, '0')}:\${String(sec).padStart(2, '0')}.\${String(cs).padStart(2, '0')}\`;
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 160));
    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(10, Math.round(msPerWord / 10));
      kLine += \`{\\kf\${wordCs}}\${String(w).toUpperCase()} \`;
    }
    lines.push(
      \`Dialogue: 0,\${formatAssTime(chunkStartMs)},\${formatAssTime(chunkEndMs)},CenterKaraoke,,0,0,0,,\${kLine.trim()}\`
    );
  }
  // Alignment 5 = exact screen center. BorderStyle 1 = outline only (NO black box).
  // SecondaryColour white (unread) -> PrimaryColour black (spoken karaoke fill).
  // Arial Black bold italic, slight angle, white outline for contrast on B&W.
  return \`[Script Info]
Title: Teen Center Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Arial Black,56,&H00000000,&H00FFFFFF,&H00FFFFFF,&H00000000,-1,-1,0,0,100,100,0.8,-6,1,3.2,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
\${lines.join('\\n')}
\`;
}
`
    );
  }

  // Force B&W on scene renders
  t = t.split("eq=contrast=1.1:saturation=0.92").join('eq=contrast=1.18:saturation=0,hue=s=0');
  t = t.split("eq=contrast=1.12:saturation=0.88").join('eq=contrast=1.2:saturation=0,hue=s=0');

  // Stronger soft BGM (~50% of voice energy)
  t = t.replace(/const BGM_VOL = \(VOLUMES\.teen && VOLUMES\.teen\.bgm\) \|\| 0\.\d+;/, 'const BGM_VOL = (VOLUMES.teen && VOLUMES.teen.bgm) || 0.52;');
  t = t.replace(/const VOICE_VOL = \(VOLUMES\.teen && VOLUMES\.teen\.voice\) \|\| [0-9.]+;/, 'const VOICE_VOL = (VOLUMES.teen && VOLUMES.teen.voice) || 1.45;');

  // Prefer no-beat instrumental BGM queries
  t = t.split("'hopeful cinematic ambient piano soft drums'").join("'soft piano ambient instrumental no drums'");
  t = t.split("'ambient cinematic soft piano hopeful'").join("'soft piano ambient instrumental no beat'");

  // Wider discovery topics (not only school fatigue)
  if (t.includes("teenagers common daily problems school stress")) {
    t = t.replace(
      /const queries = \[[\s\S]*?\];/,
      `const queries = [
    'teen side hustle ideas students',
    'teenagers friendship peer pressure boundaries',
    'youth sports discipline practice habits',
    'students money saving pocket money tips',
    'teen sleep schedule school mornings',
    'young people social media comparison anxiety',
    'high school exam preparation focus tips',
    'teenagers talking to parents conflict',
    'youth identity self confidence growth',
    'student procrastination homework strategies'
  ];`
    );
  }

  // Log quality flags so logs prove apply worked
  if (!t.includes('[Teen] QUALITY: B&W + center ArialBlack karaoke')) {
    t = t.replace(
      "console.log('[Teen] captions: cinema CenterKaraoke');",
      "console.log('[Teen] QUALITY: B&W + center ArialBlack karaoke (no box) + BGM');");"
    );
  }

  return t;
});

// --- Cinema / Driftreel ---
patchFile('scripts/generate_documentary_movie_reel.cjs', (t) => {
  // Kill hardcoded vault — if AI fails, throw (no Ghost Blimp / Amber Room)
  if (t.includes('dynamicDocVault')) {
    t = t.replace(
      /\/\/ Resilient Topic Discovery Safety Net[\s\S]*?return dynamicDocVault\[Math\.floor\(Math\.random\(\) \* dynamicDocVault\.length\)\];/,
      `// NO SEED VAULT — repeating Ghost Blimp / Amber Room kills TikTok novelty.
  throw new Error('Cinema AI failed after retries — refusing hardcoded story vault');`
    );
  }

  // Center karaoke style in documentary ASS if present
  t = t.replace(
    /Style: CenterKaraoke,[^\n]+/,
    ASS_STYLE_BLOCK
  );

  // Soften / remove FOLLOW FOR MORE dominance in outro if string present
  t = t.split("'FOLLOW FOR MORE'").join("'DRIFTREEL'");
  t = t.split('FOLLOW FOR MORE').join('DRIFTREEL');

  // Prefer quieter documentary BGM mix note
  t = t.split('let bgmVolume = 0.25').join('let bgmVolume = 0.38');
  t = t.split('bgmVolume || 0.25').join('bgmVolume || 0.38');

  return t;
});

// Wire wiki research module if present
const wikiPath = path.join(ROOT, 'scripts', 'cinema_wiki_story.cjs');
if (fs.existsSync(wikiPath)) {
  patchFile('scripts/generate_documentary_movie_reel.cjs', (t) => {
    if (t.includes('require(\./cinema_wiki_story')) return t;
    if (!t.includes('async function generateDynamicDocumentaryStory')) return t;
    // Prefer wiki-first path at start of function
    return t.replace(
      'async function generateDynamicDocumentaryStory() {',
      `async function generateDynamicDocumentaryStory() {
  try {
    const { buildWikiDocumentaryEpisode } = require('./cinema_wiki_story.cjs');
    const wikiEp = await buildWikiDocumentaryEpisode();
    if (wikiEp && Array.isArray(wikiEp.scenes) && wikiEp.scenes.length >= 4) {
      console.log('[Documentary] Wikipedia/Commons episode:', wikiEp.title);
      return wikiEp;
    }
  } catch (e) {
    console.warn('[Documentary] wiki path:', e.message);
  }`
    );
  });
}

console.log('[apply_center_karaoke_bw_bgm] done');
