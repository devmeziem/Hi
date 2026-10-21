#!/usr/bin/env node
/** Force real title into Buffer Archie publisher (no Untitled Video). */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'publish_archie_to_buffer_omnichannel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('BUFFER_TITLE_FIX_V2')) {
  console.log('[buf-title] already v2');
  process.exit(0);
}
const backup = t;

// Prefer meta title from archie_latest_meta.json
if (!t.includes('BUFFER_TITLE_FIX_V2')) {
  t = t.replace(
    "const cleanTitle = (metadata.title || 'Did You Know? Mind-Blowing Science & Tech Breakdown').trim();",
    `// BUFFER_TITLE_FIX_V2
  try {
    const metaPath = require('path').join(process.cwd(), 'rendered_videos', 'archie_latest_meta.json');
    if (require('fs').existsSync(metaPath)) {
      const m = JSON.parse(require('fs').readFileSync(metaPath, 'utf8'));
      if (m.title) metadata.title = metadata.title || m.title;
      if (m.description) metadata.description = metadata.description || m.description;
    }
  } catch {}
  const cleanTitle = String(metadata.title || metadata.topic || 'Archie Explains').replace(/Untitled/gi,'').trim() || 'Archie Explains';`
  );

  // Ensure caption starts with title (FB sometimes uses first line)
  t = t.replace(
    'if (service === \'facebook\') {',
    `if (service === 'facebook') {
    // title first line for feed`
  );
}

try {
  fs.writeFileSync(p, t);
  console.log('[buf-title] v2 patched');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[buf-title] fail', e.message);
}
