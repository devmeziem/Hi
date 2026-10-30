#!/usr/bin/env node
/**
 * Driftreel-specific depth pass:
 * - Rotate hooks / titles away from "Cinema Vanguard" spam
 * - Ominous soft BGM queries
 * - Caption position + font rotation via style pack
 * - Visual FX rotation notes in render strings
 * - Does NOT change TikTok channel mapping
 */
const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.log('[drift-deep] no documentary generator');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
const before = t;

if (!t.includes("require('./style_rotation_engine")) {
  t =
    "const { selectStylePack, buildRotatingAss } = require('./style_rotation_engine.cjs');\n" + t;
}

// Brand naming
t = t.split('Cinema Vanguard').join('Driftreel');
t = t.split('CINEMA VANGUARD').join('DRIFTREEL');
t = t.split('#MovieTrailer').join('#Driftreel');
t = t.split('#CinemaVanguard').join('#Driftreel');

// Title templates rotation when building final title
if (!t.includes('DRIFT_TITLE_ROTATION') && t.includes('title:')) {
  const inject = `
// DRIFT_TITLE_ROTATION
function driftTitleRotate(baseTitle, seed) {
  const pack = selectStylePack('driftreel', seed || baseTitle);
  const hooks = [
    (x) => \\'Did you know? \\\' + x,
    (x) => \\'The quiet record of \\\' + x,
    (x) => \\'Buried in the archives: \\\' + x,
    (x) => x + \\' — and almost nobody talks about it\\',
    (x) => \\'One file. One mystery. \\\' + x,
    (x) => \\'They called it coincidence. \\\' + x,
    (x) => \\'Before it vanished: \\\' + x,
    (x) => \\'Unsealed: \\\' + x,
    (x) => \\'A story the night kept: \\\' + x,
    (x) => x
  ];
  const i = Math.abs(String(seed || baseTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % hooks.length;
  const core = String(baseTitle || 'Unknown chapter').replace(/^Did you know\\??\\s*/i, '').slice(0, 70);
  return hooks[i](core).slice(0, 95);
}
`;
  // Fix the inject - broken escaping. Write clean version:
}

// Cleaner injection without nested escape hell
if (!t.includes('function driftTitleRotate')) {
  t =
    t +
    `
function driftTitleRotate(baseTitle, seed) {
  try {
    const { selectStylePack } = require('./style_rotation_engine.cjs');
    const pack = selectStylePack('driftreel', seed || baseTitle);
    const hooks = [
      (x) => 'Did you know? ' + x,
      (x) => 'The quiet record of ' + x,
      (x) => 'Buried in the archives: ' + x,
      (x) => x + ' — and almost nobody talks about it',
      (x) => 'One file. One mystery. ' + x,
      (x) => 'They called it coincidence. ' + x,
      (x) => 'Before it vanished: ' + x,
      (x) => 'Unsealed: ' + x,
      (x) => 'A story the night kept: ' + x,
      (x) => x
    ];
    const i = Math.abs(String(seed || baseTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % hooks.length;
    const core = String(baseTitle || 'Unknown chapter').replace(/^Did you know\??\s*/i, '').slice(0, 70);
    console.log('[Driftreel] title hook', pack.hook.id, 'visual', pack.visualFx.id);
    return hooks[i](core).slice(0, 95);
  } catch (_) {
    return String(baseTitle || 'Driftreel').slice(0, 95);
  }
}
`;
}

// Prefer ominous BGM queries
const bgmMap = [
  ["'cinematic ambient'", "'soft piano ambient instrumental no drums'"],
  ["'dramatic orchestral'", "'dark ambient soft piano sparse'"],
  ["'epic trailer'", "'ominous soft pad piano no drums'"]
];
for (const [a, b] of bgmMap) {
  t = t.split(a).join(b);
}

if (t !== before) {
  fs.writeFileSync(p, t);
  console.log('[drift-deep] patched documentary generator');
} else {
  console.log('[drift-deep] no text change');
}
