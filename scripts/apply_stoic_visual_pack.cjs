#!/usr/bin/env node
/** Rotate Stoic visual grade + zoom; shebang-safe; no TDZ on STYLE_ROTATION_PACK. */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_stoic_quote_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[stoic-viz] missing generator');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');
const before = t;

// Ensure style_rotation_engine is required after shebang
if (!t.includes("style_rotation_engine")) {
  const req =
    "const { selectStylePack, buildRotatingAss, VISUAL_FX } = require('./style_rotation_engine.cjs');\n";
  const lines = t.split('\n');
  if (lines[0] && lines[0].startsWith('#!')) {
    let i = 1;
    if (lines[i] === '') i++;
    lines.splice(i, 0, req.trim());
    t = lines.join('\n');
  } else {
    t = req + t;
  }
}

// Early STYLE_ROTATION_PACK init at start of generateStoic5sVideo (prevents TDZ)
if (t.includes('async function generateStoic5sVideo') && !t.includes('Style pack must be declared before any use')) {
  t = t.replace(
    'async function generateStoic5sVideo(durationOverride = null, customChosen = null, outputFileNameOverride = null) {',
    `async function generateStoic5sVideo(durationOverride = null, customChosen = null, outputFileNameOverride = null) {
  // Style pack must be declared before any use (avoid TDZ from apply patches)
  let STYLE_ROTATION_PACK = { seed: Date.now(), summary: 'default', visualFx: { id: 'default' } };
  try {
    STYLE_ROTATION_PACK = selectStylePack(
      'stoic',
      String((customChosen && (customChosen.quote || customChosen.text)) || Date.now())
    );
  } catch (_) {}
  console.log('[Stoic] style:', STYLE_ROTATION_PACK.summary);`
  );
}

// Remove any TDZ self-reference patterns if present
t = t.replace(
  /const STYLE_ROTATION_PACK = \(typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK\)\s*\?\s*STYLE_ROTATION_PACK\s*:\s*selectStylePack\([^;]+\);/g,
  `let STYLE_ROTATION_PACK = selectStylePack('stoic', Date.now());`
);

// Rotate gradeFilter block
if (t.includes('gradeFilter = `hue=s=0') && !t.includes('STYLE_GRADE_FROM_PACK')) {
  t = t.replace(
    /gradeFilter = `hue=s=0,eq=contrast=1\.32:brightness=-0\.03,vignette=PI\/4\.5`;/,
    `// STYLE_GRADE_FROM_PACK
      const _sp = STYLE_ROTATION_PACK || selectStylePack('stoic', Date.now());
      const grades = [
        'hue=s=0,eq=contrast=1.32:brightness=-0.03,vignette=PI/4.5',
        'hue=s=0,eq=contrast=1.18:brightness=-0.02,vignette=PI/5',
        'eq=contrast=1.2:saturation=0.75:brightness=-0.04,vignette=PI/4',
        'hue=s=0.2,eq=contrast=1.25:brightness=-0.05,noise=alls=8:allf=t',
        'hue=s=0,eq=contrast=1.4:brightness=-0.05',
        'eq=contrast=1.15:saturation=0.55,vignette=PI/3.5',
        'hue=s=0,eq=brightness=-0.08:contrast=1.28',
        'eq=contrast=1.22:saturation=0.9:gamma=1.05',
        'hue=s=0.15,eq=contrast=1.3:brightness=-0.04,vignette=PI/4.5',
        'hue=s=0,eq=contrast=1.1:brightness=0.02'
      ];
      gradeFilter = grades[Math.abs(String(_sp.seed || '').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % grades.length];
      console.log('[Stoic] grade', gradeFilter.slice(0, 40));`
  );
}

// Rotate zoom formulas when fixed strings exist
if (t.includes('zoomFormula') && !t.includes('STYLE_ZOOM_FROM_PACK')) {
  t = t.replace(
    /let zoomFormula = [^;]+;/,
    `// STYLE_ZOOM_FROM_PACK
    const zooms = [
      "1.05+0.00018*on",
      "1.08+0.00022*on",
      "if(eq(on,1),1.12,max(1.0,1.12-0.0002*on))",
      "1.03+0.00015*on",
      "1.1+0.00012*on",
      "min(1.15,1.0+0.00025*on)",
      "1.06+0.0003*on",
      "if(eq(on,1),1.1,max(1.02,1.1-0.00018*on))",
      "1.04+0.0002*on",
      "1.07+0.00016*on"
    ];
    const _zpack = STYLE_ROTATION_PACK || { seed: Date.now() };
    let zoomFormula = zooms[Math.abs(String(_zpack.seed||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % zooms.length];`
  );
}

if (t !== before) {
  fs.writeFileSync(p, t);
  console.log('[stoic-viz] patched');
} else {
  console.log('[stoic-viz] ok');
}
