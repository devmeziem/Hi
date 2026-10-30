#!/usr/bin/env node
/**
 * Force every scene plate to use style_rotation_engine visualFx (+ fade).
 * Teen / Stoic / Driftreel. Idempotent.
 */
const fs = require('fs');
const path = require('path');

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
  // Rotate across VISUAL_FX pool using scene index so multi-scene videos aren't identical plates
  const pool = VISUAL_FX || [];
  const fx = pool[(sceneIndex + (pack.visualFx ? pool.findIndex((x) => x.id === pack.visualFx.id) : 0)) % pool.length] || pack.visualFx;
  let core = (fx && fx.vf) || "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
  // For short scenes, zoompan d=1 chains are unsafe — prefer scale/crop + mild eq when duration < 4s
  if (durationSec < 4 && /zoompan/.test(core)) {
    core = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.12:saturation=0.9';
  }
  // B&W bias for teen if style pack picked bw_grain or old_tv already includes hue
  if (!/hue=s=0/.test(core) && (fx.id === 'bw_grain' || fx.id === 'old_tv')) {
    /* already in vf */
  } else if (!/hue=s=0/.test(core) && sceneIndex % 3 === 0) {
    core += ',hue=s=0';
  }
  return core + ",fade=t=in:st=0:d=" + fade.toFixed(2) + ",fade=t=out:st=" + Math.max(0.1, durationSec - fade).toFixed(2) + ":d=" + fade.toFixed(2);
}

function renderSceneClip(visual, durationSec, outMp4, sceneIndex) {
  const vf = resolveTeenVisualVf(durationSec, sceneIndex);
  if (visual.type === 'video') {
    execSync(
      'ffmpeg -y -stream_loop 3 -t ' +
        durationSec.toFixed(2) +
        ' -i "' +
        visual.path +
        '" -an -vf "' +
        vf +
        '" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 -t ' +
        durationSec.toFixed(2) +
        ' "' +
        outMp4 +
        '"',
      { stdio: 'pipe' }
    );
  } else {
    // Images: prefer kenburns from pack; fallback safe zoompan
    const frames = Math.max(30, Math.ceil(durationSec * 30));
    let imgVf = vf;
    if (!/zoompan/.test(imgVf) && !/crop=1080:1920/.test(imgVf)) {
      imgVf =
        "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0014,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=" +
        frames +
        ':s=1080x1920:fps=30,' +
        vf;
    }
    execSync(
      'ffmpeg -y -loop 1 -t ' +
        durationSec.toFixed(2) +
        ' -i "' +
        visual.path +
        '" -vf "' +
        imgVf +
        '" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 -t ' +
        durationSec.toFixed(2) +
        ' "' +
        outMp4 +
        '"',
      { stdio: 'pipe' }
    );
  }
  if (!fs.existsSync(outMp4) || fs.statSync(outMp4).size < 20000) {
    throw new Error('scene render failed ' + outMp4);
  }
  console.log('[Teen] scene FX', sceneIndex + 1, (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK.visualFx && STYLE_ROTATION_PACK.visualFx.id) || 'rot');
}
`;

// ---- Teen ----
patch('scripts/generate_teen_situation_reel.cjs', (t) => {
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE + '\n' + t;
  } else if (!t.includes('VISUAL_FX')) {
    t = t.replace(
      "require('./style_rotation_engine.cjs')",
      "require('./style_rotation_engine.cjs')".replace(
        "{ selectStylePack, buildRotatingAss, SFX_QUERIES }",
        '{ selectStylePack, buildRotatingAss, SFX_QUERIES, VISUAL_FX }'
      )
    );
    if (!t.includes('VISUAL_FX')) {
      t = t.replace(
        /const \{([^}]+)\} = require\('\.\/style_rotation_engine\.cjs'\);/,
        (m, inner) =>
          inner.includes('VISUAL_FX')
            ? m
            : `const {${inner}, VISUAL_FX} = require('./style_rotation_engine.cjs');`
      );
    }
  }
  if (!t.includes('function resolveTeenVisualVf')) {
    if (t.includes('function renderSceneClip(visual, durationSec, outMp4, sceneIndex)')) {
      t = t.replace(
        /function renderSceneClip\(visual, durationSec, outMp4, sceneIndex\) \{[\s\S]*?\n\}\n/,
        TEEN_RENDER + '\n'
      );
    }
  }
  // Ensure STYLE pack is created early
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
  // ASS rotation
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

// ---- Stoic quote reel ----
patch('scripts/generate_stoic_quote_reel.cjs', (t) => {
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE + '\n' + t;
  }
  if (!t.includes('[Stoic] style:')) {
    // inject near main generation after quote chosen
    const markers = [
      "console.log('[Quote Reel] Scholar:",
      'console.log(`[Quote Reel] Scholar:',
      "console.log(\"[Quote Reel] Scholar:"
    ];
    for (const m of markers) {
      if (t.includes(m) || t.includes('[Quote Reel] Scholar')) {
        t = t.replace(
          /console\.log\(`?\[Quote Reel\] Scholar:[^\n]+\n?/,
          `const STYLE_ROTATION_PACK = selectStylePack('stoic', (typeof chosen !== 'undefined' && (chosen.quote || chosen.text)) || Date.now());
  console.log('[Stoic] style:', STYLE_ROTATION_PACK.summary);
  console.log('[Quote Reel] Scholar');
`
        );
        break;
      }
    }
    if (!t.includes('[Stoic] style:')) {
      // append near first async function main
      t = t.replace(
        /async function main\(\) \{/,
        `async function main() {
  // style pack set later when quote known
`
      );
    }
  }
  // Replace common static kenburns with pack-driven vf helper
  if (!t.includes('function resolveStoicVisualVf')) {
    const helper = `
function resolveStoicVisualVf(durationSec) {
  const pack = (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK)
    ? STYLE_ROTATION_PACK
    : selectStylePack('stoic', Date.now());
  let core = (pack.visualFx && pack.visualFx.vf) || "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hue=s=0";
  if (!/hue=s=0/.test(core)) core += ',hue=s=0';
  const fade = Math.min(0.35, durationSec / 8);
  return core + ',fade=t=in:st=0:d=' + fade.toFixed(2);
}
`;
    t = helper + t;
  }
  // Soft-swap hard-coded scale=1080:1920,hue=s=0 patterns used as sole vf
  t = t.replace(
    /scale=1080:1920,hue=s=0/g,
    "' + ((typeof resolveStoicVisualVf === 'function' ? resolveStoicVisualVf(5) : 'scale=1080:1920,hue=s=0')) + '"
  );
  // That replace can break strings — be more careful: only if FORCE_STOIC_VIZ not present
  if (t.includes("resolveStoicVisualVf(5) : 'scale=1080:1920") && t.includes("' + ((typeof")) {
    // revert aggressive replace if it looks broken - redo cleaner
    t = t.replace(
      /' \+ \(\(typeof resolveStoicVisualVf === 'function' \? resolveStoicVisualVf\(5\) : 'scale=1080:1920,hue=s=0'\)\) \+ '/g,
      'scale=1080:1920,hue=s=0'
    );
  }
  // Inject at ffmpeg image loops if present
  if (t.includes('-loop 1') && t.includes('-vf') && !t.includes('FORCE_STOIC_PACK_VF')) {
    t = t.replace(
      /-vf "scale=1080:1920/g,
      '-vf "' + (typeof resolveStoicVisualVf==="function"?resolveStoicVisualVf(5):"scale=1080:1920') + '/*BROKEN*/'
    );
    // undo if broken
    if (t.includes('/*BROKEN*/')) {
      t = t.replace(
        /-vf "' \+ \(typeof resolveStoicVisualVf==="function"\?resolveStoicVisualVf\(5\):"scale=1080:1920'\) \+ '\/\*BROKEN\*\'//g,
        '-vf "scale=1080:1920'
      );
    }
  }
  return t;
});

// ---- Driftreel documentary ----
patch('scripts/generate_documentary_movie_reel.cjs', (t) => {
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE + '\n' + t;
  }
  if (!t.includes('function resolveDriftVisualFilter')) {
    const helper = `
function resolveDriftVisualFilter(secPerScene, sceneIndex) {
  const pack = (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK)
    ? STYLE_ROTATION_PACK
    : selectStylePack('driftreel', String(sceneIndex) + Date.now());
  const pool = typeof VISUAL_FX !== 'undefined' ? VISUAL_FX : (pack && pack.visualFx ? [pack.visualFx] : []);
  const fx = pool[(sceneIndex + sceneIndex) % Math.max(1, pool.length)] || pack.visualFx;
  let core = (fx && fx.vf) || 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
  // Documentary look: prefer archival grain / mild B&W often
  if (sceneIndex % 2 === 0 && !/hue=s=0/.test(core) && !/noise=/.test(core)) {
    core += ',hue=s=0.25,eq=contrast=1.15';
  }
  console.log('[Driftreel] scene FX', sceneIndex + 1, (fx && fx.id) || 'default');
  return core;
}
`;
    t = helper + t;
  }
  // Replace fixed scale filter fragments used in scene loops
  if (t.includes('[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vid]') && !t.includes('resolveDriftVisualFilter')) {
    // already have helper; replace pattern
  }
  if (t.includes('[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vid]')) {
    t = t.replace(
      /\[0:v\]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920\[vid\]/g,
      "[0:v]" + "' + resolveDriftVisualFilter(secPerScene, sceneIdx || 0) + '" + "[vid]"
    );
    // Fix if that created broken JS — use template differently
  }
  // Safer: replace the whole filter assignment lines
  t = t.replace(
    /const filter = `\[0:v\]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920\[vid\];\[vid\]\[1:v\]overlay=0:0\[v\]`;/g,
    "const filter = '[0:v]' + resolveDriftVisualFilter(secPerScene, typeof sceneIndex !== 'undefined' ? sceneIndex : 0) + '[vid];[vid][1:v]overlay=0:0[v]';"
  );
  t = t.replace(
    /const filter = `\[0:v\]scale=1200:2133,zoompan=z='\$\{zoomDirection\}':d=\$\{Math\.round\(secPerScene \* 30\)\}:s=1080x1920:fps=30\[bg\];\[bg\]\[1:v\]overlay=0:0\[v\]`;/g,
    "const filter = '[0:v]' + resolveDriftVisualFilter(secPerScene, typeof sceneIndex !== 'undefined' ? sceneIndex : 0) + '[bg];[bg][1:v]overlay=0:0[v]';"
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
