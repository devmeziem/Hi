#!/usr/bin/env node
/** Repair unterminated quote / broken ffmpeg shell from prior batch patches.
 * Skips entirely when anti-spam rotation helpers are already on generate_stoic_quote_reel.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetCheck = path.join(process.cwd(), 'scripts', 'generate_stoic_quote_reel.cjs');
if (fs.existsSync(targetCheck) && fs.readFileSync(targetCheck, 'utf8').includes('normalizeStoicQuote')) {
  console.log('[stoic-fix] skip — anti-spam rotation helpers present');
  process.exit(0);
}

for (const rel of [
  'scripts/generate_stoic_quote_reel.cjs',
  'scripts/generate_stoic_5s_reel.cjs',
]) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  const backup = t;
  t = t.replace(/,null(?=,|\[|"|')/g, '');
  t = t.replace(/null,/g, '');
  t = t.replace(/filter_complex\s+["']null["']/g, 'filter_complex "nullsrc=s=1080x1920:d=5,format=yuv420p"');
  t = t.replace(/lo-?fi/gi, 'soft piano ambient');
  t = t.replace(/volume=0\.0\d/g, 'volume=0.45');
  t = t.replace(/volume=0\.1\d/g, 'volume=0.48');
  if (!t.includes('hue=s=0') && t.includes('scale=')) {
    t = t.replace(/scale=1080:1920/g, 'scale=1080:1920,hue=s=0');
  }
  t = t.replace(/-crf\s*\d+/g, '-crf 17');
  try {
    fs.writeFileSync(p, t);
    execSync('node --check "' + p + '"', { stdio: 'pipe' });
    console.log('[stoic-fix]', rel, 'OK');
  } catch (e) {
    fs.writeFileSync(p, backup);
    console.warn('[stoic-fix] reverted', rel, e.message);
  }
}
