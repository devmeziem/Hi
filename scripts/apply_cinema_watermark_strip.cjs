#!/usr/bin/env node
/** Strip remaining Cinema Vanguard watermarks + force Driftreel titles in generator + any SVG drawtext. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const targets = [
  'scripts/generate_documentary_movie_reel.cjs',
  'scripts/apply_cinema_driftreel_fix.cjs'
];
for (const rel of targets) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  const backup = t;
  const pairs = [
    [/Cinema Vanguard/gi, 'Driftreel'],
    [/#CinemaVanguard/gi, '#Driftreel'],
    [/CinemaVanguard/gi, 'Driftreel'],
    [/CINEMA VANGUARD/g, 'DRIFTREEL'],
    [/cinema_vanguard/g, 'driftreel'],
    [/drawtext=[^"']*Cinema[^"']*/gi, (m) => m.replace(/Cinema[^:]*/gi, 'Driftreel')]
  ];
  for (const [a, b] of pairs) t = t.replace(a, b);
  // Remove common watermark overlay blocks if present
  t = t.replace(/drawtext=[^\[,]*text='?CINEMA[^'\[,]*/gi, "drawtext=text=''");
  t = t.replace(/text='Cinema Vanguard'/gi, "text='Driftreel'");
  if (t !== backup) {
    try {
      fs.writeFileSync(p, t);
      if (rel.endsWith('.cjs')) execSync(`node --check "${p}"`, { stdio: 'pipe' });
      console.log('[cinema-wm] cleaned', rel);
    } catch (e) {
      fs.writeFileSync(p, backup);
      console.warn('[cinema-wm] revert', rel, e.message);
    }
  } else {
    console.log('[cinema-wm] no change', rel);
  }
}
