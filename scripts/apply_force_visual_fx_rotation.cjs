#!/usr/bin/env node
/**
 * Force every scene plate to use style_rotation_engine visualFx (+ fade).
 * Shebang-safe injects.
 */
const fs = require('fs');
const path = require('path');

function injectRequireAfterShebang(source, requireLine) {
  if (!source) return source;
  if (source.includes("style_rotation_engine")) {
    // ensure VISUAL_FX in import
    if (!source.includes('VISUAL_FX')) {
      source = source.replace(
        /const \{([^}]+)\} = require\('\.\/style_rotation_engine\.cjs'\);/,
        (m, inner) =>
          inner.includes('VISUAL_FX')
            ? m
            : `const {${inner.trim()}, VISUAL_FX} = require('./style_rotation_engine.cjs');`
      );
    }
    return source;
  }
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
    console.warn('[viz-fx] missing', rel);
    return;
  }
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(p, after);
    console.log('[viz-fx] patched', rel);
  } else console.log('[viz-fx] ok', rel);
}

const REQUIRE =
  "const { selectStylePack, buildRotatingAss, VISUAL_FX } = require('./style_rotation_engine.cjs');";

const TEEN_RENDER = `
function resolveTeenVisualVf(durationSec, sceneIndex) {
  const pack =
    typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK
      ? STYLE_ROTATION_PACK
      : selectStylePack('teen', String(sceneIndex) + Date.now());
  const fade = Math.min(0.45, durationSec / 6);
  const pool = VISUAL_FX || [];
  const fx = pool[(sceneIndex + (pack.visualFx ? pool.findIndex((x) => x.id === pack.visualFx.id) : 0)) % Math.max(1, pool.length)] || pack.visualFx;
  let core = (fx && fx.vf) || "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
  if (durationSec < 4 && /zoompan/.test(core)) {
    core = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.12:saturation=0.9';
  }
  if (!/hue=s=0/.test(core) && sceneIndex % 3 === 0) core += ',hue=s=0';
  return core + ",fade=t=in:st=0:d=" + fade.toFixed(2) + ",fade=t=out:st=" + Math.max(0.1, durationSec - fade).toFixed(2) + ":d=" + fade.toFixed(2);
}

function renderSceneClip(visual, durationSec, outMp4, sceneIndex) {
  const vf = resolveTeenVisualVf(durationSec, sceneIndex);
  if (visual.type === 'video') {
    execSync(
      'ffmpeg -y -stream_loop 3 -t ' + durationSec.toFixed(2) + ' -i "' + visual.path + '" -an -vf "' + vf + '" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 -t ' + durationSec.toFixed(2) + ' "' + outMp4 + '"',
      { stdio: 'pipe' }
    );
  } else {
    const frames = Math.max(30, Math.ceil(durationSec * 30));
    let imgVf = vf;
    if (!/zoompan/.test(imgVf) && !/crop=1080:1920/.test(imgVf)) {
      imgVf = "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0014,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=" + frames + ':s=1080x1920:fps=30,' + vf;
    }
    execSync(
      'ffmpeg -y -loop 1 -t ' + durationSec.toFixed(2) + ' -i "' + visual.path + '" -vf "' + imgVf + '" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 -t ' + durationSec.toFixed(2) + ' "' + outMp4 + '"',
      { stdio: 'pipe' }
    );
  }
  if (!fs.existsSync(outMp4) || fs.statSync(outMp4).size < 20000) throw new Error('scene render failed ' + outMp4);
  console.log('[Teen] scene FX', sceneIndex + 1, (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK.visualFx && STYLE_ROTATION_PACK.visualFx.id) || 'rot');
}
`;

patch('scripts/generate_teen_situation_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE);
  if (!t.includes('function resolveTeenVisualVf') && t.includes('function renderSceneClip(visual, durationSec, outMp4, sceneIndex)')) {
    t = t.replace(/function renderSceneClip\(visual, durationSec, outMp4, sceneIndex\) \{[\s\S]*?\n\}\n/, TEEN_RENDER + '\n');
  }
  if (!t.includes("[Teen] style:") && t.includes("console.log('[Teen] title:'")) {
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
  t = injectRequireAfterShebang(t, REQUIRE);
  return t;
});

patch('scripts/generate_documentary_movie_reel.cjs', (t) => {
  t = injectRequireAfterShebang(t, REQUIRE);
  if (!t.includes('function resolveDriftVisualFilter')) {
    const helper = `
function resolveDriftVisualFilter(secPerScene, sceneIndex) {
  const pack = (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK)
    ? STYLE_ROTATION_PACK
    : selectStylePack('driftreel', String(sceneIndex) + Date.now());
  const pool = typeof VISUAL_FX !== 'undefined' ? VISUAL_FX : (pack && pack.visualFx ? [pack.visualFx] : []);
  const fx = pool[(sceneIndex) % Math.max(1, pool.length)] || pack.visualFx;
  let core = (fx && fx.vf) || 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
  if (sceneIndex % 2 === 0 && !/hue=s=0/.test(core) && !/noise=/.test(core)) {
    core += ',hue=s=0.25,eq=contrast=1.15';
  }
  console.log('[Driftreel] scene FX', sceneIndex + 1, (fx && fx.id) || 'default');
  return core;
}
`;
    // insert helper after requires block
    const lines = t.split('\n');
    let insertAt = 0;
    for (let i = 0; i < Math.min(40, lines.length); i++) {
      if (lines[i].startsWith('const ') || lines[i].startsWith('#!/') || lines[i].startsWith('/**') || lines[i].startsWith(' *') || lines[i].trim() === '') {
        insertAt = i + 1;
      } else break;
    }
    // safer: after first function or after requires
    t = t.replace(
      /(const .+ = require\(.+\);\n)+/,
      (m) => m + helper
    );
    if (!t.includes('function resolveDriftVisualFilter')) {
      t = injectRequireAfterShebang(t, helper.trim().split('\n')[0] ? '' : '');
      // append near top after shebang inject already done
      const ls = t.split('\n');
      let idx = 1;
      while (idx < ls.length && (ls[idx].startsWith('const ') || ls[idx].startsWith('/**') || ls[idx].startsWith(' *') || ls[idx] === '')) idx++;
      ls.splice(idx, 0, helper);
      t = ls.join('\n');
    }
  }
  t = t.replace(
    /const filter = `\[0:v\]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920\[vid\];\[vid\]\[1:v\]overlay=0:0\[v\]`;/g,
    "const filter = '[0:v]' + resolveDriftVisualFilter(secPerScene, typeof sceneIndex !== 'undefined' ? sceneIndex : 0) + '[vid];[vid][1:v]overlay=0:0[v]';"
  );
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

console.log('[viz-fx] done');
