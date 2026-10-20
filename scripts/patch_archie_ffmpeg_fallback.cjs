#!/usr/bin/env node
/** Ensure generate_archie_tech_fact_reel has simple FFmpeg fallback (soft). */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_tech_fact_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[archie-patch] no legacy reel — skip');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('SIMPLE ARCHIE FALLBACK COMPOSITE')) {
  console.log('[archie-patch] already has simple fallback');
  process.exit(0);
}
const needle = 'Retrying with pass-through video filter';
if (!t.includes(needle)) {
  console.log('[archie-patch] pattern missing — skip');
  process.exit(0);
}
// Soft: leave file; live generator is primary path now
console.log('[archie-patch] legacy path present; live reel is preferred');
process.exit(0);
