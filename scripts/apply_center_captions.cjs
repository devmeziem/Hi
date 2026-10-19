#!/usr/bin/env node
/** Patch cinema karaoke ASS style + line breaks for center bold readable captions */
const fs = require('fs');
const path = require('path');

const targets = [
  'scripts/generate_documentary_movie_reel.cjs',
  'scripts/generate_fin_quote_live_reel.cjs'
];

for (const rel of targets) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  let n = 0;

  if (rel.includes('documentary')) {
    const next = t.replace(
      /const wordsPerLine = 3;/, 
      'const wordsPerLine = 4; // center-safe chunks'
    );
    if (next !== t) { t = next; n++; }

    // Force center alignment 5, bold, margins, outline
    const styleRe =
      /Style: CenterKaraoke,[^\n]+/;
    const style =
      'Style: CenterKaraoke,DejaVu Sans,48,&H00FFFFFF,&H0000D7FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,70,70,60,1';
    if (styleRe.test(t)) {
      t = t.replace(styleRe, style);
      n++;
    }

    // Multi-line center: insert \\N every wordsPerLine in kf builder — already chunks
  }

  if (rel.includes('fin_quote')) {
    // Ensure ASS uses an5 center mid-screen
    if (t.includes('\\an8')) {
      t = t.replace(/\\an8/g, '\\an5');
      n++;
    }
    t = t.replace(/pos\(540,\$\{1450/g, 'pos(540,${900');
    t = t.replace(/pos\(540,\$\{1450 \+ lines\.length \* 70\}/g, 'pos(540,${900 + lines.length * 70}');
  }

  if (n) {
    fs.writeFileSync(p, t);
    console.log('[center-captions] patched', rel, n);
  } else {
    console.log('[center-captions] no change', rel);
  }
}
