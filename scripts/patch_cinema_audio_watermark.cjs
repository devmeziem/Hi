#!/usr/bin/env node
/**
 * Cinema pre-flight patches — SAFE (no broken regex / no SyntaxError).
 * - Soften default BGM volume upward if still low in generator
 * - Strip a few watermark brand strings if present
 * Never fails the workflow.
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[cinema-patch] generator missing — skip');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');
let n = 0;

function sub(from, to) {
  if (t.includes(from)) {
    t = t.split(from).join(to);
    n++;
  }
}

sub('let bgmVolume = 0.25', 'let bgmVolume = 0.42');
sub('bgmVolume || 0.25', 'bgmVolume || 0.42');
sub('FOLLOW FOR MORE', 'THE END');
sub('CINEMA VANGUARD • ARCHIVAL INVESTIGATION', '');
sub('CINEMA VANGUARD', '');

// Ensure story path uses live research module (no seed vault)
if (!t.includes("require('./cinema_archive_research.cjs')")) {
  const oldStart = 'async function generateDynamicDocumentaryStory() {';
  if (t.includes(oldStart)) {
    // Replace entire function body with research wrapper — handled by apply script if present
    console.log('[cinema-patch] research hook not yet inlined — apply_cinema_live_research will run');
  }
}

if (n > 0) {
  fs.writeFileSync(p, t);
  console.log('[cinema-patch] applied', n, 'edits');
} else {
  console.log('[cinema-patch] no edits needed');
}
process.exit(0);
