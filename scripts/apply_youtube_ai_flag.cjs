#!/usr/bin/env node
/**
 * Soft-patch YouTube uploader: set status.containsSyntheticMedia = true
 * (API metadata only — does NOT change channel descriptions).
 * Safe: skips if already present; never throws hard.
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'scripts/youtube_channel_dispatcher.cjs',
  'scripts/youtube_uploader.cjs',
  'scripts/publish_youtube.cjs'
];

function patchFile(rel) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return { path: rel, skipped: true, reason: 'missing' };
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('containsSyntheticMedia')) {
    return { path: rel, skipped: true, reason: 'already_flagged' };
  }

  let changed = false;

  // Common pattern: status block with selfDeclaredMadeForKids
  const re1 =
    /(status\s*:\s*\{[^}]*selfDeclaredMadeForKids\s*:\s*false)(\s*\})/m;
  if (re1.test(t)) {
    t = t.replace(
      re1,
      "$1,\n        containsSyntheticMedia: true$2"
    );
    changed = true;
  }

  // Alternate: privacyStatus only
  if (!changed) {
    const re2 = /(status\s*:\s*\{[^}]*privacyStatus\s*:\s*['"]public['"])([^}]*\})/m;
    if (re2.test(t) && !t.includes('containsSyntheticMedia')) {
      t = t.replace(
        re2,
        (m, a, b) => a + ',\n        containsSyntheticMedia: true' + b
      );
      changed = true;
    }
  }

  if (!changed) {
    return { path: rel, skipped: true, reason: 'no_status_block' };
  }

  try {
    fs.writeFileSync(p, t);
    require('child_process').execSync(`node --check "${p}"`, { stdio: 'pipe' });
    console.log('[ai-flag] patched', rel);
    return { path: rel, ok: true };
  } catch (e) {
    console.warn('[ai-flag] syntax fail — skip', rel, String(e.message || e).slice(0, 120));
    return { path: rel, skipped: true, reason: 'syntax_fail' };
  }
}

for (const rel of TARGETS) {
  try {
    const r = patchFile(rel);
    if (r.skipped) console.log('[ai-flag]', r.path, r.reason);
  } catch (e) {
    console.warn('[ai-flag] non-fatal', rel, e.message);
  }
}
