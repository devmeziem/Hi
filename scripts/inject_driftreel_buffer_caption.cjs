#!/usr/bin/env node
/** Force Driftreel caption from manifest; never redeclare existing consts */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pub = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(pub)) {
  console.warn('[inject-caption] publisher missing');
  process.exit(0);
}

let meta = {
  title: 'Driftreel History',
  era: '',
  excerpt: 'Ancient history and folk tales.'
};
for (const p of [
  path.join(process.cwd(), 'rendered_videos', 'driftreel_manifest.json'),
  path.join(process.cwd(), 'test_artifacts', 'documentary', 'driftreel_manifest.json')
]) {
  try {
    if (fs.existsSync(p)) {
      meta = { ...meta, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
      break;
    }
  } catch (_) {}
}

const title = String(meta.title || meta.episodeTitle || 'Driftreel History').slice(0, 80);
const era = meta.era ? ` · ${meta.era}` : '';
const excerpt = String(meta.excerpt || meta.description || meta.story || 'Ancient history and folk tales.').slice(0, 160);
const caption = `Driftreel · ${title}${era}\n\n${excerpt}...\n\nFollow for more ancient history & folk tales.\n\n#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP`;

let t = fs.readFileSync(pub, 'utf8');
const backup = t;

t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/,?\s*allowComments:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowDuet:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowStitch:\s*(true|false)/g, '');

// Inject once at top of dispatchTikTok body via forcedDriftCaption global in function scope
if (!t.includes('FORCED_DRIFT_CAPTION_MARKER')) {
  // Prepend a helper after requires
  const helper = `
// FORCED_DRIFT_CAPTION_MARKER
function getForcedDriftCaption() {
  return ${JSON.stringify(caption)};
}
`;
  if (t.startsWith('#!')) {
    const lines = t.split('\n');
    let i = 1;
    while (i < lines.length && (lines[i].startsWith('const ') || lines[i].startsWith('/**') || lines[i].startsWith(' *') || lines[i].startsWith('//') || lines[i] === '')) i++;
    lines.splice(i, 0, helper);
    t = lines.join('\n');
  } else {
    t = helper + t;
  }

  // Prefer forced caption when channel is movie_brand — replace caption assignment carefully
  t = t.replace(
    /(channelType === ['"]movie_brand['"][\s\S]{0,4000}?)(\bcaption\s*=\s*)([^;]+;)/,
    '$1$2 (typeof getForcedDriftCaption === "function" ? getForcedDriftCaption() : ($3));'
  );
}

try {
  fs.writeFileSync(pub, t);
  execSync(`node --check "${pub}"`, { stdio: 'pipe' });
  console.log('[inject-caption] Driftreel caption injected:', title);
} catch (e) {
  fs.writeFileSync(pub, backup);
  // Still write caption to env-friendly file for debugging
  fs.writeFileSync('/tmp/drift_caption.txt', caption);
  console.warn('[inject-caption] syntax fail — reverted publisher, caption saved to /tmp:', e.message);
}
