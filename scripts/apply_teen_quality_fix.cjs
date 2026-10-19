#!/usr/bin/env node
/**
 * Teen quality fix (runner-side):
 * - Motivation Andrew: rate -5%, pitch -15Hz
 * - BGM volume 0.14 → 0.32 (audible under voice)
 * - Voice compressor slightly hotter
 */
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'scripts', 'generate_teen_motivation_reel.cjs');
if (!fs.existsSync(target)) {
  console.warn('[teen-quality] target missing');
  process.exit(0);
}

let t = fs.readFileSync(target, 'utf8');
let changes = 0;

if (t.includes("rate: '-4%'") || t.includes('rate: "-4%"')) {
  t = t.replace(/rate:\s*['"]-4%['"]/g, "rate: '-5%'");
  t = t.replace(/pitch:\s*['"]-10Hz['"]/g, "pitch: '-15Hz'");
  changes++;
  console.log('[teen-quality] Motivation Andrew prosody (-5% / -15Hz)');
}

if (t.includes('volume=0.14')) {
  t = t.replace(/volume=0\.14/g, 'volume=0.32');
  changes++;
  console.log('[teen-quality] BGM volume 0.14 → 0.32');
}

if (t.includes('volume=1.4,acompressor')) {
  t = t.replace(/volume=1\.4,acompressor/g, 'volume=1.55,acompressor');
  changes++;
  console.log('[teen-quality] voice hotter');
}

// Prefer tts_resilient if Edge path is thin — inject note only
if (!t.includes('TEEN_QUALITY_PATCH_APPLIED')) {
  t = '/* TEEN_QUALITY_PATCH_APPLIED */\n' + t;
  changes++;
}

fs.writeFileSync(target, t);
console.log('[teen-quality] done, changes=', changes);
