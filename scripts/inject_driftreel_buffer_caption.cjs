#!/usr/bin/env node
/** Force Driftreel caption text inside restored Buffer publisher without scope bugs */
const fs = require('fs');
const path = require('path');

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

// Strip invalid metadata + old branding
t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/Cinema Vanguard/gi, 'Driftreel');
t = t.replace(/,?\s*allowComments:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowDuet:\s*(true|false)/g, '');
t = t.replace(/,?\s*allowStitch:\s*(true|false)/g, '');

// Inject safe locals at start of movie_brand branch if missing
if (!t.includes('DRIFT_CAPTION_SAFE_LOCALS')) {
  t = t.replace(
    /(} else if \(channelType === ['"]movie_brand['"]\) \{)/,
    `$1\n    // DRIFT_CAPTION_SAFE_LOCALS\n    var docTitle = ${JSON.stringify(title)};\n    var docEra = ${JSON.stringify(era)};\n    var storyExcerpt = ${JSON.stringify(excerpt)};\n    var docChannelRef = 'Driftreel';\n    var forcedDriftCaption = ${JSON.stringify(caption)};`
  );
}

// Prefer forced caption assignment wherever movie_brand sets caption
if (t.includes('forcedDriftCaption')) {
  t = t.replace(
    /(channelType === ['"]movie_brand['"][\s\S]{0,2500}?)(caption\s*=\s*`[^`]*`;)/,
    '$1caption = forcedDriftCaption;'
  );
  // also simple global for any remaining Cinema-style long caption in movie path
  t = t.replace(
    /caption\s*=\s*`[^`]*#MovieTrailer[^`]*`;/g,
    'caption = forcedDriftCaption;'
  );
  t = t.replace(
    /caption\s*=\s*`[^`]*#CinemaVanguard[^`]*`;/g,
    'caption = forcedDriftCaption;'
  );
}

fs.writeFileSync(pub, t);
console.log('[inject-caption] Driftreel caption injected:', title);
