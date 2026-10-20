#!/usr/bin/env node
/**
 * Replaces generateDynamicDocumentaryStory() with live archive research.
 * Does NOT touch other strings (previous viralDesc rewrite caused SyntaxError).
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.error('[apply-cinema-research] missing generator');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');

// Already wired?
if (
  t.includes("require('./cinema_archive_research.cjs')") &&
  t.includes('researchAndBuildEpisode') &&
  !t.includes('dynamicDocVault')
) {
  console.log('[apply-cinema-research] already live — skip');
  process.exit(0);
}

const NEW_FN = `async function generateDynamicDocumentaryStory() {
  // LIVE open-source research only — Wikipedia + DDG + News + AI script. NO seed vault.
  const { researchAndBuildEpisode } = require('./cinema_archive_research.cjs');
  const episode = await researchAndBuildEpisode();
  if (!episode || !Array.isArray(episode.scenes) || episode.scenes.length < 5) {
    throw new Error('Cinema: live research returned insufficient scenes (need 5-10)');
  }
  if (episode.scenes.length > 10) episode.scenes = episode.scenes.slice(0, 10);
  return episode;
}`;

const start = t.indexOf('async function generateDynamicDocumentaryStory()');
if (start < 0) {
  console.error('[apply-cinema-research] story function not found');
  process.exit(1);
}

// End at next top-level function after the story fn
const markers = ['\nfunction escapeXml', '\nasync function generateDocumentaryVideo', '\nfunction buildAss'];
let end = -1;
for (const m of markers) {
  const i = t.indexOf(m, start + 10);
  if (i > start && (end < 0 || i < end)) end = i;
}
if (end < 0) {
  console.error('[apply-cinema-research] cannot find end of story function');
  process.exit(1);
}

t = t.slice(0, start) + NEW_FN + '\n' + t.slice(end);

// Safe volume bumps only (no multiline template surgery)
t = t.split('let bgmVolume = 0.25').join('let bgmVolume = 0.42');
t = t.split('bgmVolume || 0.25').join('bgmVolume || 0.42');

fs.writeFileSync(p, t);

// Verify parse
try {
  require('vm').runInNewContext('false'); // noop
  new Function(t); // syntax check
  console.log('[apply-cinema-research] OK — live research wired, syntax valid');
} catch (e) {
  console.error('[apply-cinema-research] SYNTAX FAIL after patch:', e.message);
  process.exit(1);
}
