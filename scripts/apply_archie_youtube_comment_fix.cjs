#!/usr/bin/env node
/** Skip or soften YouTube first/pinned comments for Archie (and optionally all). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'youtube_channel_dispatcher.cjs');
if (!fs.existsSync(p)) {
  console.warn('[yt-comment] missing dispatcher');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_COMMENT_FIX_V1')) {
  console.log('[yt-comment] already');
  process.exit(0);
}
const backup = t;

// Soft pin: empty string when SKIP_YOUTUBE_PINNED_COMMENT=true
t = t.replace(
  'function formatChannelPinnedComment(channelKey) {',
  `function formatChannelPinnedComment(channelKey) {
  // ARCHIE_COMMENT_FIX_V1
  if (String(process.env.SKIP_YOUTUBE_PINNED_COMMENT || '').toLowerCase() === 'true') {
    return '';
  }`
);

// Better Archie comment if not skipped
t = t.replace(
  /return `📌 What curious tech, AI, or science question should Archie animate next\? Drop your ideas below and follow for more!`;/,
  "return `📌 Archie explains one science or tech fact per short. Follow for the next one.`;"
);

// Do not post empty pinned comments
if (!t.includes('if (dynamicComment && String(dynamicComment).trim())')) {
  t = t.replace(
    'await postPinnedComment(accessToken, videoId, dynamicComment);',
    `if (dynamicComment && String(dynamicComment).trim()) {
      await postPinnedComment(accessToken, videoId, dynamicComment);
    } else {
      console.log('[YouTube Dispatcher] pinned comment skipped');
    }`
  );
}

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[yt-comment] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[yt-comment] reverted', e.message);
}
