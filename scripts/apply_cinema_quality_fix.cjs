#!/usr/bin/env node
/** Raise Cinema BGM so underscore is audible under narration. */
const fs = require('fs');
const path = require('path');

const files = [
  'scripts/generate_documentary_movie_reel.cjs',
  'scripts/generate_movie_brand_episode.cjs',
  'scripts/generate_financial_story_documentary.cjs'
];

for (const rel of files) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  let n = 0;
  // common quiet beds
  for (const [a, b] of [
    ['volume=0.08', 'volume=0.26'],
    ['volume=0.10', 'volume=0.28'],
    ['volume=0.12', 'volume=0.28'],
    ['volume=0.14', 'volume=0.30'],
    ['volume=0.15', 'volume=0.30']
  ]) {
    if (t.includes(a)) {
      t = t.split(a).join(b);
      n++;
    }
  }
  if (n) {
    fs.writeFileSync(p, t);
    console.log('[cinema-quality]', rel, 'bumps=', n);
  } else {
    console.log('[cinema-quality]', rel, 'no quiet volumes found');
  }
}
