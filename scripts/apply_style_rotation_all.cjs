#!/usr/bin/env node
/**
 * Wire style_rotation_engine + force visual FX into Teen, Stoic, Driftreel, Archie.
 * Shebang-safe: never prepend above #!
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function injectRequireAfterShebang(source, requireLine) {
  if (!source || source.includes("style_rotation_engine")) return source;
  const lines = source.split('\n');
  if (lines[0] && lines[0].startsWith('#!')) {
    let i = 1;
    if (lines[i] === '') i++;
    lines.splice(i, 0, requireLine);
    return lines.join('\n');
  }
  return requireLine + '\n' + source;
}

function patch(rel, fn) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) {
    console.warn('[style-rot] missing', rel);
    return;
  }
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(p, after);
    console.log('[style-rot] patched', rel);
  } else console.log('[style-rot] ok', rel);
}

const REQUIRE_LINE =
  "const { selectStylePack, buildRotatingAss, SFX_QUERIES, VISUAL_FX } = require('./style_rotation_engine.cjs');";

// Repair shebangs first
try {
  execSync('node scripts/fix_shebang_headers.cjs', { stdio: 'inherit' });
} catch (_) {}

patch('scripts/generate_teen_situation_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE_LINE);
  if (!t.includes('STYLE_ROTATION_PACK') && t.includes("console.log('[Teen] title:'")) {
    t = t.replace(
      "console.log('[Teen] title:', pack.title);",
      `const STYLE_ROTATION_PACK = selectStylePack('teen', pack.title || pack.problem || Date.now());
  console.log('[Teen] style:', STYLE_ROTATION_PACK.summary);
  console.log('[Teen] title:', pack.title);
  pack.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;
  process.env.TEEN_VOICE = STYLE_ROTATION_PACK.voice.voice;
  process.env.TEEN_RATE = STYLE_ROTATION_PACK.voice.rate;
  process.env.TEEN_PITCH = STYLE_ROTATION_PACK.voice.pitch;`
    );
  }
  if (t.includes('function buildCinemaStyleAss') && !t.includes('return buildRotatingAss')) {
    t = t.replace(
      /function buildCinemaStyleAss\([\s\S]*?\n\}\n/,
      `function buildCinemaStyleAss(fullText, duration) {
  const pack = (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK)
    ? STYLE_ROTATION_PACK
    : selectStylePack('teen', fullText || Date.now());
  return buildRotatingAss(fullText, duration, pack);
}

`
    );
  }
  return t;
});

patch('scripts/generate_stoic_quote_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE_LINE);
  if (!t.includes('[Stoic] style:') && t.includes('[Quote Reel]')) {
    t = t.replace(
      /console\.log\(`\[Quote Reel\] Scholar:[^`]*`\);/,
      `const STYLE_ROTATION_PACK = selectStylePack('stoic', (typeof chosen !== 'undefined' && (chosen.quote || chosen.text)) || Date.now());
  console.log('[Stoic] style:', STYLE_ROTATION_PACK.summary);
  console.log('[Quote Reel] Scholar');
`
    );
  }
  return t;
});

patch('scripts/generate_documentary_movie_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE_LINE);
  if (!t.includes('[Driftreel] style:') && t.includes('generateDynamicDocumentaryStory')) {
    t = t.replace(
      /const story = await generateDynamicDocumentaryStory\(\);/,
      `const story = await generateDynamicDocumentaryStory();
  const STYLE_ROTATION_PACK = selectStylePack('driftreel', (story && (story.title || story.hook)) || Date.now());
  console.log('[Driftreel] style:', STYLE_ROTATION_PACK.summary);
  if (story) story.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;`
    );
  }
  return t;
});

patch('scripts/generate_archie_live_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE_LINE);
  if (!t.includes('archie_v2_compositor') && t.includes('async function renderArchieHeavy')) {
    t = t.replace(
      /async function renderArchieHeavy\([\s\S]*?\n\}\n/,
      `async function renderArchieHeavy(args) {
  try {
    const { composeArchieV2 } = require('./archie_v2_compositor.cjs');
    const text =
      (args.script && (args.script.voiceover || args.script.script || args.script.narration)) ||
      args.scriptText ||
      '';
    const seed = (args.script && args.script.title) || text || Date.now();
    const r = await composeArchieV2({
      voiceWav: args.voiceWav,
      scriptText: typeof text === 'string' ? text : JSON.stringify(text),
      brollPath: args.brollPath,
      bgmPath: args.bgmPath,
      seed,
      studio: (args.script && args.script.studio) || 'black',
      outPath: path.join(process.cwd(), 'rendered_videos', 'archie_latest.mp4')
    });
    return r.outPath;
  } catch (e) {
    console.warn('[Archie] v2 failed:', e.message);
    throw e;
  }
}

`
    );
  }
  return t;
});

try {
  execSync('node scripts/apply_force_visual_fx_rotation.cjs', { stdio: 'inherit' });
} catch (e) {
  console.warn('[style-rot] visual fx pass:', e.message);
}

try {
  execSync('node scripts/fix_shebang_headers.cjs', { stdio: 'inherit' });
} catch (_) {}

console.log('[style-rot] done');
