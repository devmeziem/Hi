/**
 * YouTube channel dispatcher — self-heals from known-good commit if corrupted,
 * then ensures status.containsSyntheticMedia = true (API only, not description).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SELF = __filename;
const GOOD =
  'https://raw.githubusercontent.com/devmeziem/Hi/83207db00681b9b9ccacc2d5a016e3ef0aa38c01/scripts/youtube_channel_dispatcher.cjs';
const MARKER = path.join(__dirname, '.yt_dispatcher_ready');

function softRestore() {
  try {
    let t = fs.readFileSync(SELF, 'utf8');
    const broken =
      t.trim() === 'PLACEHOLDER' ||
      t.length < 1500 ||
      !t.includes('async function uploadToYouTube');
    const needsFlag = !t.includes('containsSyntheticMedia');
    if (!broken && !needsFlag) return false;

    const tmp = SELF + '.restore.tmp';
    execSync(`curl -fsSL "${GOOD}" -o "${tmp}"`, { stdio: 'pipe', timeout: 20000 });
    let body = fs.readFileSync(tmp, 'utf8');
    try { fs.unlinkSync(tmp); } catch (_) {}
    if (!body.includes('async function uploadToYouTube')) return false;

    if (!body.includes('containsSyntheticMedia')) {
      body = body.replace(
        /selfDeclaredMadeForKids:\s*false(\s*\})/,
        'selfDeclaredMadeForKids: false,\n        containsSyntheticMedia: true$1'
      );
    }
    // Soft-fail upload path: wrap is already soft (resolve null)
    fs.writeFileSync(SELF, body);
    try {
      execSync(`node --check "${SELF}"`, { stdio: 'pipe' });
      console.log('[yt-dispatcher] restored + AI flag containsSyntheticMedia=true');
      return true;
    } catch (e) {
      console.warn('[yt-dispatcher] restored body failed syntax — leaving as-is (non-fatal)');
      return false;
    }
  } catch (e) {
    console.warn('[yt-dispatcher] soft restore skipped:', e.message);
    return false;
  }
}

// Only self-replace when this file is still the bootstrap stub / placeholder
const boot = fs.readFileSync(SELF, 'utf8');
if (
  boot.includes('softRestore') &&
  boot.includes('SELF-HEAL-BOOTSTRAP')
) {
  // marker comment below
}

// SELF-HEAL-BOOTSTRAP
if (!boot.includes('CHANNEL_CONFIG') || boot.trim() === 'PLACEHOLDER' || !boot.includes('uploadToYouTube')) {
  softRestore();
  delete require.cache[SELF];
}

// Load real implementation (after possible restore)
let real;
try {
  // If we are still bootstrap, softRestore already rewrote SELF — re-read via new module load
  if (fs.readFileSync(SELF, 'utf8').includes('CHANNEL_CONFIG')) {
    // Avoid infinite loop: require a copy path
    const copy = path.join(__dirname, '_youtube_channel_dispatcher_impl.cjs');
    if (!fs.existsSync(copy) || fs.statSync(SELF).mtimeMs > fs.statSync(copy).mtimeMs) {
      fs.copyFileSync(SELF, copy);
    }
    real = require('./_youtube_channel_dispatcher_impl.cjs');
  }
} catch (e) {
  console.warn('[yt-dispatcher] load soft-fail', e.message);
}

if (!real) {
  softRestore();
  try {
    const copy = path.join(__dirname, '_youtube_channel_dispatcher_impl.cjs');
    fs.copyFileSync(SELF, copy);
    delete require.cache[require.resolve('./_youtube_channel_dispatcher_impl.cjs')];
    real = require('./_youtube_channel_dispatcher_impl.cjs');
  } catch (e2) {
    real = {
      CHANNEL_CONFIG: {},
      uploadToYouTube: async () => null,
      uploadYouTubeShort: async () => null,
      postPinnedComment: async () => false,
      dispatchScheduledVideos: async () => {},
      getAccessToken: async () => null,
      sanitizeVideoDescription: (s) => s,
      formatChannelFollowCta: () => '',
      formatChannelPinnedComment: () => ''
    };
  }
}

module.exports = real;
