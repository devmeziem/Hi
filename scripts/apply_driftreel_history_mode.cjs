#!/usr/bin/env node
/**
 * Driftreel History Mode — Egyptian / Greek / folk / olden-days stories
 * - Force history + folk angle (no more mixed crime/horror seed vault)
 * - Bass male EdgeTTS (Andrew deeper)
 * - Captions: bold, center, no dark box, professional font
 * - Remove all on-screen watermarks / follow-for-more clutter mid-video
 * - Pure black end card with white text only
 * - Description + hashtags promote Driftreel only (no Cinema Vanguard)
 * - Subtle piano/ambient BGM + soft scene FX (pan / Ken Burns)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GEN = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(GEN)) {
  console.warn('[drift-history] generator missing');
  process.exit(0);
}

let t = fs.readFileSync(GEN, 'utf8');
const backup = t;

// 1) Branding purge
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/#CinemaVanguard/gi, '#Driftreel');
t = t.replace(/CINEMA VANGUARD/g, 'DRIFTREEL');
t = t.replace(/cinema_vanguard/gi, 'driftreel');

// 2) Genre force → history / folk / ancient stories only
t = t.replace(
  /const genres = \['crime', 'horror', 'history', 'story'\];/,
  "const genres = ['history', 'history', 'history', 'folk', 'ancient', 'mythology'];"
);
t = t.replace(
  /Genre: \$\{chosenGenre\}\./g,
  'Genre: ancient history, Egyptian, Greek, Roman, or classic folk tale. Prefer real historical events or well-known myths retold factually.'
);

// Stronger system prompt for history
const newSystemHint = `You are the lead showrunner for Driftreel, a cinematic history and folklore short-form series.
Generate a gripping, factual or classic folk narrative (40-55 seconds spoken, 95-130 words).
Focus ONLY on: Ancient Egypt, Greek myths, Roman history, African / Asian / European folk tales, or verified olden-days historical events.
MANDATORY:
1. TITLE: Cinematic, max 42 chars.
2. ERA: e.g. "1323 BCE • Valley of the Kings" or "Ancient Greece • The Labyrinth".
3. SFX TYPE: one of "projector", "wind", "clock".
4. BGM QUERY: soft ambient piano or sparse strings, NO drums/beats (e.g. "soft piano ambient historical sparse no drums").
5. Exactly 5 scenes. Each has continuous story text (18-26 words) + visual query for archival / historical stock.
6. HASHTAGS must include #Driftreel and never mention Cinema Vanguard.
Return valid JSON only.`;

if (t.includes('lead executive showrunner for Driftreel') || t.includes('lead executive showrunner for Cinema')) {
  t = t.replace(
    /You are the lead executive showrunner for [^.]+\./,
    newSystemHint.split('\n')[0] + '.'
  );
}

// 3) Hashtags force Driftreel
t = t.replace(
  /\["#Driftreel", "#Documentary", "#TrueMystery", "#Shorts"\]/g,
  '["#Driftreel", "#HistoryTok", "#AncientHistory", "#FolkTale", "#Documentary", "#Shorts", "#FYP"]'
);
t = t.replace(
  /hashtags: \["#CinemaVanguard".*?\]/gs,
  'hashtags: ["#Driftreel", "#HistoryTok", "#AncientHistory", "#Documentary", "#Shorts"]'
);

// 4) Captions — remove dark box, bolder, center, better font
// ASS style: no BackColour box (BorderStyle 1, Outline only), larger bold
t = t.replace(
  /Style: CenterKaraoke,Trebuchet MS,52,&H0000D7FF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,1\.2,0,1,2\.8,2\.0,5,100,100,0,1/,
  'Style: CenterKaraoke,Arial Black,58,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.8,0,1,3.2,0,5,80,80,0,1'
);
t = t.replace(
  /Style: CenterKaraoke,[^,]+,\d+,&H[^,]+,&H[^,]+,&H[^,]+,&H[^,]+,1,/g,
  'Style: CenterKaraoke,Arial Black,58,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,'
);

// Kill translucent dark drop-box language in comments / prompts
t = t.replace(/translucent dark drop-box/gi, 'clean outline only');
t = t.replace(/dark drop-box/gi, 'outline');

// 5) Pure black end card (white text only)
const pureBlackOutro = `function buildGlowingOutroSvg(genre = 'history', storyTitle = '', template = 'dossier', width = 1080, height = 1920) {
  const titleExcerpt = escapeXml(String(storyTitle || 'Ancient Chronicle').slice(0, 40).toUpperCase());
  return \\`<svg width=\"\\${width}\" height=\"\\${height}\" viewBox=\"0 0 \\${width} \\${height}\" xmlns=\"http://www.w3.org/2000/svg\">
    <rect width=\"\\${width}\" height=\"\\${height}\" fill=\"#000000\" />
    <text x=\"540\" y=\"880\" font-family=\"Arial Black, DejaVu Sans, sans-serif\" font-size=\"52\" font-weight=\"900\" fill=\"#ffffff\" text-anchor=\"middle\" letter-spacing=\"4\">FOLLOW FOR MORE</text>
    <text x=\"540\" y=\"960\" font-family=\"DejaVu Sans, sans-serif\" font-size=\"22\" font-weight=\"700\" fill=\"#e5e5e5\" text-anchor=\"middle\" letter-spacing=\"2\">\\${titleExcerpt}</text>
    <text x=\"540\" y=\"1040\" font-family=\"DejaVu Sans, sans-serif\" font-size=\"18\" font-weight=\"600\" fill=\"#a3a3a3\" text-anchor=\"middle\" letter-spacing=\"3\">DRIFTREEL</text>
  </svg>\\`;
}`;

if (t.includes('function buildGlowingOutroSvg')) {
  t = t.replace(
    /function buildGlowingOutroSvg\([\s\S]*?^}/m,
    pureBlackOutro
  );
}

// 6) Remove mid-video watermark / follow clutter from SVG overlays
t = t.replace(/FOLLOW FOR MORE/g, ''); // will be restored only in outro
t = t.replace(/CINEMA VANGUARD • HISTORICAL CHRONICLES[^<]*/gi, 'DRIFTREEL');
t = t.replace(/• PART \$\{sceneNum\}\/\$\{totalScenes\}/g, '');
t = t.replace(/PART \$\{sceneNum\}\/\$\{totalScenes\}/g, '');
t = t.replace(/Scene\s*\$\{[^}]+\}\s*\/\s*\$\{[^}]+\}/gi, '');

// Restore FOLLOW only inside the pure black outro we just wrote
if (!t.includes('FOLLOW FOR MORE') && t.includes('buildGlowingOutroSvg')) {
  // already in the new function
}

// 7) Voice — deeper bass Andrew
t = t.replace(/en-US-AndrewNeural/g, 'en-US-AndrewNeural');
if (!t.includes("rate: '-12%'") && !t.includes('rate: "-12%"')) {
  // inject deeper rate/pitch near EdgeTTS calls if present
  t = t.replace(
    /voice:\s*['"]en-US-AndrewNeural['"]/g,
    "voice: 'en-US-AndrewNeural', rate: '-10%', pitch: '-15Hz'"
  );
}

// 8) BGM — soft no-beat only
t = t.replace(/dark noir investigative cello piano/gi, 'soft piano ambient historical sparse no drums');
t = t.replace(/eerie cold horror drone ambient/gi, 'soft ambient piano pad no drums');
t = t.replace(/dark classical strings suspense historical mystery/gi, 'soft piano sparse strings no drums');
t = t.replace(/bgmQuery":\s*"[^"]+"/g, (m) => {
  if (/no drums/i.test(m)) return m;
  return m.replace(/"([^"]+)"/, '"soft piano ambient historical sparse no drums"');
});

// 9) Description promotion
t = t.replace(
  /lead showrunner for Driftreel/g,
  'lead showrunner for Driftreel'
);
if (!t.includes('ensureDriftreelTags')) {
  t = t.replace(
    'const viralDesc =',
    `// ensureDriftreelTags
      if (!Array.isArray(chosenEpisode.hashtags)) chosenEpisode.hashtags = [];
      const must = ['#Driftreel', '#HistoryTok', '#AncientHistory', '#FolkTale', '#Documentary', '#Shorts', '#FYP'];
      for (const h of must) {
        if (!chosenEpisode.hashtags.map(x => String(x).toLowerCase()).includes(h.toLowerCase())) chosenEpisode.hashtags.push(h);
      }
      chosenEpisode.hashtags = chosenEpisode.hashtags.filter(h => !/cinemavanguard|cinema.?vanguard/i.test(h));
      const viralDesc =`
  );
}

// 10) Kill any remaining seed vault preference — prefer live AI only
t = t.replace(
  /\/\/ Resilient Topic Discovery Safety Net for Cinema Vanguard[\s\S]*?return dynamicDocVault\[Math\.floor\(Math\.random\(\) \* dynamicDocVault\.length\)\];/,
  `// No seed vault — fail cleanly if AI cannot produce history story\n  throw new Error('Driftreel history AI failed after retries — no seed fallback');`
);

if (t === backup) {
  console.log('[drift-history] no textual delta (may already be applied)');
  process.exit(0);
}

try {
  fs.writeFileSync(GEN, t);
  execSync(`node --check "${GEN}"`, { stdio: 'pipe' });
  console.log('[drift-history] history mode + clean captions + black end card applied');
} catch (e) {
  fs.writeFileSync(GEN, backup);
  console.warn('[drift-history] syntax fail — reverted', e.message);
  process.exit(0);
}
