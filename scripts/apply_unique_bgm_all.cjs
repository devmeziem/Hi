#!/usr/bin/env node
/** Runtime soft-wire unique BGM into generators that still use static rotation. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function patch(file, from, to, label) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.log('[unique-bgm-apply] missing', file);
    return;
  }
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('fetchUniqueBgm')) {
    console.log('[unique-bgm-apply]', label, 'already');
    return;
  }
  if (!t.includes(from)) {
    console.log('[unique-bgm-apply]', label, 'marker missing');
    return;
  }
  const backup = t;
  t = t.replace(from, to);
  try {
    fs.writeFileSync(p, t);
    execSync(`node --check "${p}"`, { stdio: 'pipe' });
    console.log('[unique-bgm-apply]', label, 'OK');
  } catch (e) {
    fs.writeFileSync(p, backup);
    console.warn('[unique-bgm-apply]', label, 'reverted', e.message);
  }
}

// Stoic: after synthetic rotate, prefer unique live BGM
patch(
  'scripts/generate_stoic_quote_reel.cjs',
  "soundtrackInfo = generateRotatingSoundtrack(wavPath, effectiveDuration, 'stoic', soundIndex);",
  `soundtrackInfo = generateRotatingSoundtrack(wavPath, effectiveDuration, 'stoic', soundIndex);
    try {
      const { fetchUniqueBgm } = require('./unique_bgm_engine.cjs');
      const ub = await fetchUniqueBgm('stoic', effectiveDuration + 1, null);
      if (ub && ub.localPath && require('fs').existsSync(ub.localPath)) {
        require('fs').copyFileSync(ub.localPath, wavPath);
        soundtrackInfo = { trackName: ub.query || 'Unique Live BGM', audioTag: '🎵 Live unique · ' + String(ub.query || '').slice(0, 36), mood: 'live-unique' };
        console.log('[Stoic BGM] unique live:', ub.query);
      }
    } catch (e) { console.warn('[Stoic BGM] unique fail:', e.message); }`,
  'stoic'
);

// Soft CTA for stoic
(() => {
  const p = path.join(process.cwd(), 'scripts/generate_stoic_quote_reel.cjs');
  if (!fs.existsSync(p)) return;
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes("typeof formatChannelFollowCta === 'function'")) return;
  const backup = t;
  t = t.replace(
    /const initialFollowCta = formatChannelFollowCta\(/g,
    "const initialFollowCta = (typeof formatChannelFollowCta === 'function' ? formatChannelFollowCta("
  );
  // fix closing - fragile; use safer full line if present
  t = backup;
  t = t.replace(
    "const { getSyncedChannelProfile, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');",
    `let getSyncedChannelProfile, formatChannelFollowCta;
try {
  const yd = require('./youtube_channel_dispatcher.cjs');
  getSyncedChannelProfile = typeof yd.getSyncedChannelProfile === 'function' ? yd.getSyncedChannelProfile : async () => ({ handle: '', title: '' });
  formatChannelFollowCta = typeof yd.formatChannelFollowCta === 'function' ? yd.formatChannelFollowCta : () => '';
} catch (_) {
  getSyncedChannelProfile = async () => ({ handle: '', title: '' });
  formatChannelFollowCta = () => '';
}`
  );
  if (t === backup) {
    console.log('[unique-bgm-apply] stoic CTA pattern missing');
    return;
  }
  try {
    fs.writeFileSync(p, t);
    execSync(`node --check "${p}"`, { stdio: 'pipe' });
    console.log('[unique-bgm-apply] stoic CTA soft OK');
  } catch (e) {
    fs.writeFileSync(p, backup);
    console.warn('[unique-bgm-apply] stoic CTA revert');
  }
})();

// Teen resolveBgm — wrap with unique engine first
patch(
  'scripts/generate_teen_situation_reel.cjs',
  "console.log('[Teen] BGM search:', query);",
  `console.log('[Teen] BGM search:', query);
  try {
    const { fetchUniqueBgm } = require('./unique_bgm_engine.cjs');
    const ub = await fetchUniqueBgm('teen', durationSec + 1, query);
    if (ub && ub.localPath && fs.existsSync(ub.localPath)) {
      console.log('[Teen] unique BGM:', ub.query);
      return ub.localPath;
    }
  } catch (e) { console.warn('[Teen] unique BGM fail', e.message); }`,
  'teen'
);

// Cinema after bgmQuery resolve
patch(
  'scripts/generate_documentary_movie_reel.cjs',
  'const fetchedAudio = await searchAndFetchAudio(chosenEpisode.bgmQuery, { preferredSource: \'openverse\', targetDuration: totalDuration });',
  `let fetchedAudio = null;
  try {
    const { fetchUniqueBgm } = require('./unique_bgm_engine.cjs');
    const ub = await fetchUniqueBgm('cinema', totalDuration + 2, chosenEpisode.bgmQuery);
    if (ub && ub.localPath) fetchedAudio = { localPath: ub.localPath, source: 'unique-bgm' };
  } catch (e) { console.warn('[Cinema] unique BGM fail', e.message); }
  if (!fetchedAudio) fetchedAudio = await searchAndFetchAudio(chosenEpisode.bgmQuery, { preferredSource: 'openverse', targetDuration: totalDuration });`,
  'cinema'
);

console.log('[unique-bgm-apply] done');
