#!/usr/bin/env node
/**
 * Ensure youtube_channel_dispatcher has containsSyntheticMedia=true
 * Soft-fail only.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'youtube_channel_dispatcher.cjs');
if (!fs.existsSync(p)) {
  console.warn('[restore-yt] missing dispatcher — skip');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');

// If file was corrupted to placeholder, pull from known-good raw URL
if (t.trim() === 'PLACEHOLDER' || t.length < 500 || !t.includes('uploadToYouTube')) {
  console.warn('[restore-yt] dispatcher looks broken — attempting restore from known-good commit');
  try {
    execSync(
      'curl -fsSL "https://raw.githubusercontent.com/devmeziem/Hi/83207db00681b9b9ccacc2d5a016e3ef0aa38c01/scripts/youtube_channel_dispatcher.cjs" -o scripts/youtube_channel_dispatcher.cjs',
      { stdio: 'pipe' }
    );
    t = fs.readFileSync(p, 'utf8');
    console.log('[restore-yt] restored from 83207db');
  } catch (e) {
    console.warn('[restore-yt] restore failed (non-fatal):', e.message);
    process.exit(0);
  }
}

if (t.includes('containsSyntheticMedia')) {
  console.log('[restore-yt] AI flag already present');
  process.exit(0);
}

const old = `status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }`;
const neu = `status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        containsSyntheticMedia: true
      }`;

if (!t.includes(old)) {
  console.warn('[restore-yt] status block pattern not found — skip');
  process.exit(0);
}

const backup = t;
t = t.replace(old, neu);
fs.writeFileSync(p, t);
try {
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[restore-yt] containsSyntheticMedia=true set');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[restore-yt] syntax fail — reverted (non-fatal)');
}
