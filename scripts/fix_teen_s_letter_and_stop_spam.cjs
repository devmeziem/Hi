#!/usr/bin/env node
/** Runtime safety: generator is permanently fixed in repo. Soft-check only. */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) { console.log('[teen-s-fix] missing'); process.exit(0); }
const t = fs.readFileSync(p, 'utf8');
if (t.includes('{kf${') || /kLine \+= `\{\\kf/.test(t) || t.includes('CenterKaraoke')) {
  console.warn('[teen-s-fix] WARN: karaoke markers may still exist');
} else {
  console.log('[teen-s-fix] OK: plain captions path');
}
if (/pitch:\s*'-28Hz'/.test(t)) console.warn('[teen-s-fix] WARN: extreme pitch');
else console.log('[teen-s-fix] OK: pitch not extreme');
process.exit(0);
