#!/usr/bin/env node
/**
 * After Buffer publisher restore, force Driftreel-only captions WITHOUT breaking scope.
 * Bug fixed: previous version injected ${docTitle} outside the movie_brand branch scope.
 * Also strips invalid TikTok metadata fields Buffer rejects.
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

// Safe string replacements only — never inject bare ${docTitle} into wrong scope
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

// If a previous bad patch left a broken caption = `Driftreel · ${docTitle}...` that references
// variables only defined in another branch, rewrite movie_brand caption block safely.
// Look for the movie_brand caption assignment and force a safe template using variables
// that exist in that branch (meta.title / seriesTitle / etc).
if (t.includes('docTitle is not defined') || /caption\s*=\s*`Driftreel · \$\{docTitle\}/.test(t)) {
  t = t.replace(
    /caption\s*=\s*`Driftreel · \$\{docTitle\}[^`]*`;/g,
    "caption = `Driftreel · ${(meta && (meta.title || meta.episodeTitle)) || (typeof seriesTitle !== 'undefined' ? seriesTitle : 'History')}\n\n${(meta && (meta.excerpt || meta.description || meta.story)) || 'Ancient history and folk tales.'}\n\nFollow for more ancient history & folk tales.\n\n#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP`;"
  );
}

// Broader: any remaining template that uses docTitle in movie_brand path without defining it
// Fix by ensuring docTitle is defined before caption use in movie_brand branch
if (t.includes('channelType === \'movie_brand\'') || t.includes('channelType === "movie_brand"')) {
  // Inject safe locals right after movie_brand target resolution if missing
  if (!t.includes('// DRIFT_CAPTION_SAFE_LOCALS')) {
    t = t.replace(
      /(} else if \(channelType === ['"]movie_brand['"]\) \{[\s\S]*?targetChannel\s*=\s*resolveTargetChannel[^;]+;)/,
      `$1\n    // DRIFT_CAPTION_SAFE_LOCALS\n    const docTitle = (typeof meta !== 'undefined' && meta && (meta.title || meta.episodeTitle)) || path.basename(videoPath || 'driftreel', '.mp4').replace(/[_-]+/g, ' ');\n    const docEra = (typeof meta !== 'undefined' && meta && meta.era) ? (' · ' + meta.era) : '';\n    const storyExcerpt = (typeof meta !== 'undefined' && meta && (meta.excerpt || meta.description || meta.story)) || 'Ancient history and folk tales.';\n    const docChannelRef = 'Driftreel';`
    );
  }
}

// Same for documentary / driftreel branch if present
if ((t.includes("'documentary'") || t.includes("'driftreel'")) && !t.includes('// DRIFT_DOC_SAFE_LOCALS')) {
  t = t.replace(
    /(if \(channelType === ['"]driftreel['"][\s\S]{0,200}?targetChannel\s*=\s*resolveTargetChannel[^;]+;)/,
    `$1\n    // DRIFT_DOC_SAFE_LOCALS\n    const docTitle = (meta && (meta.title || meta.episodeTitle)) || 'Driftreel History';\n    const docEra = (meta && meta.era) ? (' · ' + meta.era) : '';\n    const storyExcerpt = (meta && (meta.excerpt || meta.description || meta.story)) || 'Ancient history and folk tales.';\n    const docChannelRef = 'Driftreel';`
  );
}

// Force final movie_brand caption to Driftreel hashtags if still old style
t = t.replace(
  /#Documentary #DarkHistory #TrueCrime #Mystery #ShortFilm #Cinematic #StoryTime #TikTokMovies #Drama #FYP #Shorts/g,
  '#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP'
);

// Strip invalid TikTok metadata
t = t.replace(/,?\s*allowComments:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowDuet:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowStitch:\s*(true|false)/g, '');

if (!t.includes('isAiGenerated: true') && t.includes('metadata')) {
  t = t.replace(/(metadata:\s*\{\s*tiktok:\s*\{)/, '$1\n        isAiGenerated: true,');
}

if (t === backup) {
  console.log('[buffer-caption] no delta');
} else {
  try {
    fs.writeFileSync(P, t);
    execSync(`node --check "${P}"`, { stdio: 'pipe' });
    console.log('[buffer-caption] Driftreel captions + safe locals + clean metadata OK');
  } catch (e) {
    fs.writeFileSync(P, backup);
    console.warn('[buffer-caption] syntax fail — reverted', e.message);
  }
}
