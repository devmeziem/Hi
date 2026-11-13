#!/usr/bin/env node
/**
 * After Buffer publisher restore, force Driftreel-only captions WITHOUT redeclaring locals.
 * Uses var / assignment so we never hit "Identifier has already been declared".
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const P = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(P)) {
  console.warn('[buffer-caption] publisher missing');
  process.exit(0);
}

let t = fs.readFileSync(P, 'utf8');
const backup = t;

t = t.replace(/Cinema Vanguard \/\/ Episode:/gi, 'Driftreel ·');
t = t.replace(/Cinema Vanguard Documentary/gi, 'Driftreel History');
t = t.replace(/seriesTitle:\s*'Cinema Vanguard'/gi, "seriesTitle: 'Driftreel'");
t = t.replace(/seriesTitle:\s*"Cinema Vanguard"/gi, 'seriesTitle: "Driftreel"');
t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/#MovieTrailer/g, '#HistoryTok');
t = t.replace(/#SciFi/g, '#AncientHistory');
t = t.replace(/#TikTokMovies/g, '#FolkTale');
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/high-stakes narrative cinema/gi, 'ancient history and folk tales');
t = t.replace(/episodic cinema and documentary series/gi, 'ancient history and folk tales');
t = t.replace(/Follow for more daily episodic cinema and documentary series!/gi, 'Follow for more ancient history and folk tales.');
t = t.replace(/An episodic journey through high-stakes narrative cinema\.+/gi, 'A journey through ancient history and classic folk tales.');

t = t.replace(
  /#Documentary #DarkHistory #TrueCrime #Mystery #ShortFilm #Cinematic #StoryTime #TikTokMovies #Drama #FYP #Shorts/g,
  '#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP'
);

t = t.replace(/,?\s*allowComments:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowDuet:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowStitch:\s*(true|false)/g, '');

if (!t.includes('isAiGenerated: true') && t.includes('metadata')) {
  t = t.replace(/(metadata:\s*\{\s*tiktok:\s*\{)/, '$1\n        isAiGenerated: true,');
}

if (t === backup) {
  console.log('[buffer-caption] branding/metadata only (or no delta)');
} else {
  try {
    fs.writeFileSync(P, t);
    execSync(`node --check "${P}"`, { stdio: 'pipe' });
    console.log('[buffer-caption] Driftreel branding + clean metadata OK');
  } catch (e) {
    fs.writeFileSync(P, backup);
    console.warn('[buffer-caption] syntax fail — reverted', e.message);
  }
}
