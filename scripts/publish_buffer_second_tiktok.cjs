/**
 * EMERGENCY RESTORE for publish_buffer_second_tiktok.cjs
 * Loads known-good publisher from history and enforces:
 * Cinema Vanguard / driftreel MUST NOT resolve to bonesceo / mindrush / teen.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GOOD_REF = 'a00c9e83c801f94513ff002978558c5ee8c113bf';
const CACHE = path.join(process.cwd(), 'test_artifacts', '_restored_buffer_pub.cjs');

function ensureRestored() {
  if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 20000) return CACHE;
  if (!fs.existsSync(path.dirname(CACHE))) fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  try {
    execSync(`git show ${GOOD_REF}:scripts/publish_buffer_second_tiktok.cjs > "${CACHE}"`, { stdio: 'pipe' });
    if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 20000) return CACHE;
  } catch (_) {}
  try {
    execSync(`curl -sL "https://raw.githubusercontent.com/devmeziem/Hi/${GOOD_REF}/scripts/publish_buffer_second_tiktok.cjs" -o "${CACHE}"`, { stdio: 'pipe' });
  } catch (_) {}
  if (!fs.existsSync(CACHE) || fs.statSync(CACHE).size < 20000) {
    throw new Error('Could not restore publish_buffer_second_tiktok.cjs from history.');
  }
  return CACHE;
}

function patchSource(src) {
  let text = src;
  if (!text.includes('nonTeen') && text.includes('const byMovieName = discoveredTikToks.find')) {
    text = text.replace(
      'const byMovieName = discoveredTikToks.find(c => {',
      `const nonTeen = discoveredTikToks.filter(c => {
      const n = ((c.name || '') + ' ' + (c.displayName || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
      return !(n.includes('bonesceo') || n.includes('bones_ceo') || n.includes('mindrush') || n.includes('teenmotivation'));
    });
    const byMovieName = nonTeen.find(c => {`
    );
    text = text.replace(
      `if (discoveredTikToks.length > 0) {
      return discoveredTikToks[0];
    }
    return null;
  }

  // Generic fallback`,
      `if (typeof nonTeen !== 'undefined' && nonTeen.length > 0) {
      return nonTeen[0];
    }
    console.error('[Buffer TikTok Dispatch] HARD FAIL: refusing to post Cinema content to teen/bonesceo channel');
    return null;
  }

  // Generic fallback`
    );
  }
  return text;
}

const restoredPath = ensureRestored();
let source = fs.readFileSync(restoredPath, 'utf8');
source = patchSource(source);
const patchedPath = path.join(process.cwd(), 'test_artifacts', '_patched_buffer_pub.cjs');
fs.writeFileSync(patchedPath, source, 'utf8');

delete require.cache[require.resolve(patchedPath)];
const mod = require(patchedPath);
module.exports = mod;

if (require.main === module) {
  require('child_process').spawnSync(process.execPath, [patchedPath, ...process.argv.slice(2)], { stdio: 'inherit' });
}
