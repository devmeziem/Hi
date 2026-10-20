#!/usr/bin/env node
/**
 * Wire live archive research into documentary generator.
 * Uses node --check (not new Function) for syntax validation.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.error('[apply-cinema-research] missing generator');
  process.exit(0);
}

const backup = fs.readFileSync(p, 'utf8');
let t = backup;

if (t.includes('researchAndBuildEpisode') && !t.includes('dynamicDocVault')) {
  console.log('[apply-cinema-research] already live');
  process.exit(0);
}

const NEW_FN = `async function generateDynamicDocumentaryStory() {
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

const markers = ['\nfunction escapeXml', '\nasync function generateDocumentaryVideo'];
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
t = t.split('let bgmVolume = 0.25').join('let bgmVolume = 0.42');
t = t.split('bgmVolume || 0.25').join('bgmVolume || 0.42');

fs.writeFileSync(p, t);
try {
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[apply-cinema-research] OK live research wired');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.error('[apply-cinema-research] syntax fail — restored backup');
  console.error(String(e.stderr || e.message).slice(0, 400));
  process.exit(1);
}
