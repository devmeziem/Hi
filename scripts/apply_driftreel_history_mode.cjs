#!/usr/bin/env node
/**
 * HARD Driftreel history mode — must run LAST before generate.
 * - Egyptian / Greek / folk / olden-days only
 * - ASS captions: Arial Black, white, NO dark box (BackColour transparent, BorderStyle 1)
 * - Kill Cinema Vanguard branding everywhere in generator
 * - Pure black end card with white text only
 * - Soft piano BGM, no drums
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

// === Branding purge ===
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/#CinemaVanguard/gi, '#Driftreel');
t = t.replace(/CINEMA VANGUARD/g, 'DRIFTREEL');
t = t.replace(/cinema_vanguard/gi, 'driftreel');
t = t.replace(/CINEMA VANGUARD • HISTORICAL CHRONICLES[^\n<"]*/gi, 'DRIFTREEL');
t = t.replace(/CINEMA VANGUARD • ARCHIVAL INVESTIGATION[^\n<"]*/gi, 'DRIFTREEL');
t = t.replace(/DRIFTREEL • ARCHIVAL INVESTIGATION/gi, 'DRIFTREEL');
t = t.replace(/DRIFTREEL • HISTORICAL CHRONICLES/gi, 'DRIFTREEL');

// === Force history / folk / ancient genres only ===
t = t.replace(
  /const genres = \[[^\]]+\];/,
  "const genres = ['history', 'history', 'folk', 'ancient', 'mythology', 'egypt', 'greece'];"
);

// Strong system prompt override
const historyPrompt = `You are the lead showrunner for Driftreel. Generate a gripping factual or classic folk narrative (40-55 seconds spoken, 95-130 words). ONLY Ancient Egypt, Greek myths, Roman history, African/Asian/European folk tales, or verified olden-days historical events. TITLE max 42 chars. ERA like \\"1323 BCE • Valley of the Kings\\". SFX one of projector|wind|clock. BGM QUERY must be soft piano ambient historical sparse no drums. Exactly 5 scenes each with text 18-26 words and visual query. HASHTAGS must include #Driftreel and never CinemaVanguard. JSON only.`;

t = t.replace(
  /You are the lead executive showrunner for [^.]+\./g,
  'You are the lead showrunner for Driftreel. Focus on Ancient Egypt, Greek myths, Roman history, or classic folk tales only.'
);
t = t.replace(
  /Genre: \$\{chosenGenre\}\./g,
  'Genre: ancient history / Egyptian / Greek / folk tale only.'
);

// Kill seed vault — prefer fail over spam
if (t.includes('dynamicDocVault')) {
  t = t.replace(
    /\/\/ Resilient Topic Discovery Safety Net[\s\S]*?return dynamicDocVault\[Math\.floor\(Math\.random\(\) \* dynamicDocVault\.length\)\];/,
    `// No seed vault — history AI must succeed\n  throw new Error('Driftreel history AI failed — no seed fallback');`
  );
}

// === ASS captions: NO black box, bold white Arial Black, center ===
// Style line: BackColour must be &H00000000 (fully transparent), BorderStyle 1 (outline only)
t = t.replace(
  /Style: CenterKaraoke,[^\n]+/g,
  'Style: CenterKaraoke,Arial Black,58,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.6,0,1,3.5,0,5,70,70,0,1'
);
t = t.replace(/translucent dark drop-box/gi, 'clean outline only');
t = t.replace(/dark drop-box/gi, 'outline');
t = t.replace(/with Translucent Backing/gi, 'clean outline');

// Title in ASS
t = t.replace(/Title: [^
]+Unified Archival Karaoke/g, 'Title: Driftreel History Karaoke');

// === Pure black end card ===
if (t.includes('function buildGlowingOutroSvg')) {
  const pureBlack = `function buildGlowingOutroSvg(genre = 'history', storyTitle = '', template = 'dossier', width = 1080, height = 1920) {
  const titleExcerpt = escapeXml(String(storyTitle || 'Ancient Chronicle').slice(0, 40).toUpperCase());
  return \`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#000000"/>
    <text x="540" y="880" font-family="Arial Black, DejaVu Sans, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">FOLLOW FOR MORE</text>
    <text x="540" y="960" font-family="DejaVu Sans, sans-serif" font-size="22" font-weight="700" fill="#e5e5e5" text-anchor="middle" letter-spacing="2">${titleExcerpt}</text>
    <text x="540" y="1040" font-family="DejaVu Sans, sans-serif" font-size="18" font-weight="600" fill="#a3a3a3" text-anchor="middle" letter-spacing="3">DRIFTREEL</text>
  </svg>`;
}`;
  t = t.replace(/function buildGlowingOutroSvg\([\s\S]*?\n\}/m, pureBlack);
}

// Remove PART N/M and mid-video watermark labels from SVG overlays
t = t.replace(/\s*•\s*PART \$\{sceneNum\}\/\$\{totalScenes\}/g, '');
t = t.replace(/PART \$\{sceneNum\}\/\$\{totalScenes\}/g, '');
t = t.replace(/Scene\s*\$\{[^}]+\}\s*\/\s*\$\{[^}]+\}/gi, '');

// BGM soft no drums
t = t.replace(/dark noir investigative cello piano/gi, 'soft piano ambient historical sparse no drums');
t = t.replace(/eerie cold horror drone ambient/gi, 'soft ambient piano pad no drums');
t = t.replace(/dark classical strings suspense historical mystery/gi, 'soft piano sparse strings no drums');

// Hashtags force
t = t.replace(
  /\["#Driftreel", "#Documentary", "#TrueMystery", "#Shorts"\]/g,
  '["#Driftreel", "#HistoryTok", "#AncientHistory", "#FolkTale", "#Documentary", "#Shorts", "#FYP"]'
);
t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/#MovieTrailer/g, '#Driftreel');
t = t.replace(/#SciFi/g, '#HistoryTok');

if (t === backup) {
  console.log('[drift-history] no textual delta');
} else {
  try {
    fs.writeFileSync(GEN, t);
    execSync(`node --check "${GEN}"`, { stdio: 'pipe' });
    console.log('[drift-history] HARD history + no black-box captions + black end card OK');
  } catch (e) {
    fs.writeFileSync(GEN, backup);
    console.warn('[drift-history] syntax fail — reverted', e.message);
  }
}
