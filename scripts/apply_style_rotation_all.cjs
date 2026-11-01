#!/usr/bin/env node
/**
 * Wire style_rotation_engine into Teen, Stoic, Driftreel, Archie.
 * Shebang-safe injects. Archie: try v2 first, never delete native heavy render.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function injectRequireAfterShebang(source, requireLine) {
  if (!source || source.includes('style_rotation_engine')) return source;
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

// Archie: wrap call site to prefer v2, fall back to native heavy — do NOT replace renderArchieHeavy body
patch('scripts/generate_archie_live_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE_LINE);
  // Widen puppet search roots in-source
  if (t.includes("cartoon_character_assets', 'exact_puppet'") && !t.includes('comparison_puppet')) {
    t = t.replace(
      "const PUPPET = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');",
      `const PUPPET_DIRS = [
  path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet'),
  path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet')
];
const PUPPET = PUPPET_DIRS.find((d) => fs.existsSync(d)) || PUPPET_DIRS[0];`
    );
  }
  if (!t.includes('ARCHIE_V2_WRAPPER') && t.includes('await renderArchieHeavy(')) {
    t = t.replace(
      /const rendered = await renderArchieHeavy\(\{([\s\S]*?)\}\);/,
      `// ARCHIE_V2_WRAPPER
  let rendered;
  try {
    const { composeArchieV2 } = require('./archie_v2_compositor.cjs');
    const text =
      (script && (script.voiceover || script.spokenScript || script.script || script.narration)) ||
      '';
    const v2 = await composeArchieV2({
      voiceWav,
      scriptText: typeof text === 'string' ? text : JSON.stringify(text),
      brollPath: typeof brollPath !== 'undefined' ? brollPath : undefined,
      bgmPath: typeof bgmPath !== 'undefined' ? bgmPath : undefined,
      seed: (script && script.title) || text || Date.now(),
      studio: (script && script.studio) || 'black',
      outPath: path.join(process.cwd(), 'rendered_videos', 'archie_latest.mp4')
    });
    rendered = { out: v2.outPath, latest: v2.outPath, total: v2.duration };
    console.log('[Archie] used v2 compositor');
  } catch (e) {
    console.warn('[Archie] v2 failed, falling back to heavy:', e.message);
    rendered = await renderArchieHeavy({$1});
  }`
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
