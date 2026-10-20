#!/usr/bin/env node
/**
 * Replaces generateDynamicDocumentaryStory() in documentary generator
 * with live archive research (no seed vault).
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.error('missing generator');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');

const NEW_FN = `async function generateDynamicDocumentaryStory() {
  // LIVE open-source research only — Wikipedia + DDG + News + AI script. NO seed vault.
  const { researchAndBuildEpisode } = require('./cinema_archive_research.cjs');
  const episode = await researchAndBuildEpisode();
  if (!episode || !Array.isArray(episode.scenes) || episode.scenes.length < 5) {
    throw new Error('Cinema: live research returned insufficient scenes (need 5–10)');
  }
  // Cap at 10 scenes for runtime
  if (episode.scenes.length > 10) episode.scenes = episode.scenes.slice(0, 10);
  return episode;
}`;

const start = t.indexOf('async function generateDynamicDocumentaryStory()');
if (start < 0) {
  console.log('[apply-cinema-research] function not found');
  process.exit(0);
}

// Find next function after story fn (escapeXml or generateDocumentaryVideo)
let end = t.indexOf('\nfunction escapeXml', start);
if (end < 0) end = t.indexOf('\nasync function generateDocumentaryVideo', start);
if (end < 0) {
  console.error('[apply-cinema-research] cannot find end of story function');
  process.exit(1);
}

t = t.slice(0, start) + NEW_FN + '\n\n' + t.slice(end);

// Soften YT description to append disclaimer if not present
if (t.includes('const viralDesc =') && !t.includes('Disclaimer: This short is an educational')) {
  t = t.replace(
    /const viralDesc = `([^`]+)`/,
    (m, body) => {
      if (body.includes('Disclaimer')) return m;
      return (
        'const viralDesc = `' +
        body +
        '\n\nDisclaimer: Educational dramatization from public records. Harmful events may be described with “allegedly” / non-graphic wording. Verify primary sources.`'
      );
    }
  );
}

// Prefer episode.description when present for YouTube
if (t.includes('const viralDesc =') && t.includes('chosenEpisode.title')) {
  t = t.replace(
    /const viralDesc = `[^`]+`;/,
    `const viralDesc = (chosenEpisode.description || (fullNarration + '\n\n🏛️ Era: ' + chosenEpisode.era + '\nGenre: ' + String(chosenEpisode.genre||'').toUpperCase())) + '\n\n#CinemaVanguard #Documentary #Shorts';`
  );
}

fs.writeFileSync(p, t);
console.log('[apply-cinema-research] generateDynamicDocumentaryStory → live archive research');
