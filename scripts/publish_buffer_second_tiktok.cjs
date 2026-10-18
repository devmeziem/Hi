/**
 * EMERGENCY RESTORE for publish_buffer_second_tiktok.cjs
 * Writes patched source under scripts/ (NOT test_artifacts) so relative requires resolve.
 * Cinema must never resolve to bonesceo/teen.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GOOD_REF = 'a00c9e83c801f94513ff002978558c5ee8c113bf';
const SCRIPTS_DIR = __dirname;
const CACHE = path.join(SCRIPTS_DIR, '_restored_buffer_pub_src.cjs');
const PATCHED = path.join(SCRIPTS_DIR, '_patched_buffer_pub_run.cjs');

function ensureRestored() {
  if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 15000) return CACHE;
  try {
    execSync(`git show ${GOOD_REF}:scripts/publish_buffer_second_tiktok.cjs > "${CACHE}"`, {
      stdio: 'pipe',
      cwd: path.join(SCRIPTS_DIR, '..')
    });
    if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 15000) return CACHE;
  } catch (_) {}
  try {
    execSync(
      `curl -sL "https://raw.githubusercontent.com/devmeziem/Hi/${GOOD_REF}/scripts/publish_buffer_second_tiktok.cjs" -o "${CACHE}"`,
      { stdio: 'pipe' }
    );
  } catch (_) {}
  if (!fs.existsSync(CACHE) || fs.statSync(CACHE).size < 15000) {
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
fs.writeFileSync(PATCHED, source, 'utf8');

delete require.cache[PATCHED];
const mod = require(PATCHED);
module.exports = mod;

if (require.main === module) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, [PATCHED, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status || 0);
}
