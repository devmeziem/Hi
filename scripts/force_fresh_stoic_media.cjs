#!/usr/bin/env node
/**
 * Pre-step for Stoic 5s: force variety so consecutive runs don't reuse
 * the same portrait file name / same BGM slice start.
 * Does not invent quotes — only clears stale portrait cache variants older than keepN.
 */
const fs = require('fs');
const path = require('path');

const portraits = path.join(process.cwd(), 'test_artifacts', 'scholar_portraits');
const keepNewest = 12;

if (fs.existsSync(portraits)) {
  const files = fs
    .readdirSync(portraits)
    .filter((f) => /\.(jpg|png|jpeg|webp)$/i.test(f))
    .map((f) => {
      const p = path.join(portraits, f);
      return { p, m: fs.statSync(p).mtimeMs };
    })
    .sort((a, b) => b.m - a.m);
  // Keep newest keepNewest, delete older so next resolve must re-fetch
  files.slice(keepNewest).forEach((f) => {
    try {
      fs.unlinkSync(f.p);
      console.log('[stoic-fresh] removed old portrait cache', path.basename(f.p));
    } catch (_) {}
  });
  console.log('[stoic-fresh] portrait files kept', Math.min(files.length, keepNewest));
} else {
  console.log('[stoic-fresh] no portrait cache yet');
}

// Nudge env for audio offset variety
process.env.STOIC_AUDIO_OFFSET_SEED = String(Date.now() % 100000);
console.log('[stoic-fresh] STOIC_AUDIO_OFFSET_SEED', process.env.STOIC_AUDIO_OFFSET_SEED);
