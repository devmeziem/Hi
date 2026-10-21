#!/usr/bin/env node
/** Ensure Buffer FB/IG posts use real video title (no Untitled Video). */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'publish_archie_to_buffer_omnichannel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('BUFFER_TITLE_FIX_V1')) {
  console.log('[buf-title] already');
  process.exit(0);
}
const backup = t;

// Force caption first line = title for FB feed title extraction
if (!t.includes('BUFFER_TITLE_FIX_V1')) {
  t = t.replace(
    'function buildOmnichannelCaption(metadata = {}, service = \'generic\') {',
    `function buildOmnichannelCaption(metadata = {}, service = 'generic') {
  // BUFFER_TITLE_FIX_V1 — FB often shows first line / media title; never leave empty`
  );

  t = t.replace(
    "const cleanTitle = (metadata.title || 'Did You Know? Mind-Blowing Science & Tech Breakdown').trim();",
    "const cleanTitle = String(metadata.title || metadata.topic || 'Archie Explains Science & Tech').replace(/Untitled/gi,'').trim() || 'Archie Explains Science & Tech';"
  );

  // GraphQL input: add title when supported
  t = t.replace(
    'text: caption,',
    `text: caption,
      title: postTitle || cleanTitle || 'Archie Explains',`
  );

  // When posting, always pass postTitle from metadata
  t = t.replace(
    'const caption = buildOmnichannelCaption(metadata, ch.service);',
    `const caption = buildOmnichannelCaption(metadata, ch.service);
    const postTitle = String(metadata.title || cleanTitle || 'Archie Explains').slice(0, 120);`
  );

  // Ensure postToBufferChannel always gets title
  t = t.replace(
    /await postToBufferChannel\(ch, mediaUrl, caption\)/g,
    'await postToBufferChannel(ch, mediaUrl, caption, postTitle)'
  );
  t = t.replace(
    /await postToBufferChannel\(ch, mediaUrl, caption, postTitle\)/g,
    'await postToBufferChannel(ch, mediaUrl, caption, postTitle)'
  );
}

try {
  // soft: if broken syntax later, workflows still work
  fs.writeFileSync(p, t);
  console.log('[buf-title] patched');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[buf-title] fail', e.message);
}
