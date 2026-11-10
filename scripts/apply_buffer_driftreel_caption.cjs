#!/usr/bin/env node
/**
 * After Buffer publisher is restored from the old good SHA, force:
 * - Driftreel-only captions (no Cinema Vanguard / MovieTrailer / SciFi)
 * - Strip invalid TikTok metadata fields (allowComments, allowDuet, allowStitch)
 * - Keep isAiGenerated: true only
 * Archie/explorer TikTok channel is CORRECT for Driftreel (user confirmed)
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

// 1) movie_brand / documentary caption blocks → Driftreel only
const driftCaption = "`Driftreel · ${docTitle}${docEra}\n\n${storyExcerpt}...\n\nFollow for more ancient history & folk tales.\n\n#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP`";

// Replace common Cinema Vanguard caption templates
t = t.replace(/Cinema Vanguard \/\/ Episode:[^\n`]*/gi, 'Driftreel ·');
t = t.replace(/Cinema Vanguard Documentary/gi, 'Driftreel History');
t = t.replace(/seriesTitle:\s*'Cinema Vanguard'/gi, "seriesTitle: 'Driftreel'");
t = t.replace(/seriesTitle:\s*"Cinema Vanguard"/gi, 'seriesTitle: "Driftreel"');

// Full caption assignment lines for movie_brand / documentary
t = t.replace(
  /caption\s*=\s*`[^`]*#CinemaVanguard[^`]*`;/gs,
  `caption = ${driftCaption};`
);
t = t.replace(
  /caption\s*=\s*`[^`]*#MovieTrailer[^`]*`;/gs,
  `caption = ${driftCaption};`
);

// Broader: any caption that still mentions Cinema Vanguard
t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/#MovieTrailer/g, '#HistoryTok');
t = t.replace(/#SciFi/g, '#AncientHistory');
t = t.replace(/#TikTokMovies/g, '#FolkTale');
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/high-stakes narrative cinema/gi, 'ancient history and folk tales');
t = t.replace(/episodic cinema and documentary series/gi, 'ancient history and folk tales');
t = t.replace(/Follow for more daily episodic cinema and documentary series!/gi, 'Follow for more ancient history and folk tales.');
t = t.replace(/An episodic journey through high-stakes narrative cinema\.*/gi, 'A journey through ancient history and classic folk tales.');

// 2) Strip invalid TikTok metadata fields that Buffer rejects
t = t.replace(/,?\s*allowComments:\s*true/g, '');
t = t.replace(/,?\s*allowDuet:\s*true/g, '');
t = t.replace(/,?\s*allowStitch:\s*true/g, '');
t = t.replace(/,?\s*allowComments:\s*false/g, '');
t = t.replace(/,?\s*allowDuet:\s*false/g, '');
t = t.replace(/,?\s*allowStitch:\s*false/g, '');

// Ensure isAiGenerated stays
if (!t.includes('isAiGenerated: true') && t.includes('metadata')) {
  t = t.replace(
    /(metadata:\s*\{\s*tiktok:\s*\{)/,
    '$1\n        isAiGenerated: true,'
  );
}

if (t === backup) {
  console.log('[buffer-caption] no delta (may need restore first)');
} else {
  try {
    fs.writeFileSync(P, t);
    execSync(`node --check "${P}"`, { stdio: 'pipe' });
    console.log('[buffer-caption] Driftreel captions + clean TikTok metadata OK');
  } catch (e) {
    fs.writeFileSync(P, backup);
    console.warn('[buffer-caption] syntax fail — reverted', e.message);
  }
}
