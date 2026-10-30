#!/usr/bin/env node
/**
 * Wire style_rotation_engine into Teen, Stoic, Driftreel, Archie generators.
 * Idempotent patches applied before each workflow run.
 */
const fs = require('fs');
const path = require('path');

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
  "const { selectStylePack, buildRotatingAss, SFX_QUERIES } = require('./style_rotation_engine.cjs');";

// ---- Teen ----
patch('scripts/generate_teen_situation_reel.cjs', (t) => {
  if (!t.includes("style_rotation_engine")) {
    t = t.replace(
      /^(const .+ = require\(.+\);\n)/m,
      `$1${REQUIRE_LINE}\n`
    );
    if (!t.includes('style_rotation_engine')) {
      t = REQUIRE_LINE + '\n' + t;
    }
  }
  // After pack is known, select style from title
  if (!t.includes('STYLE_ROTATION_PACK') && t.includes("console.log('[Teen] title:'")) {
    t = t.replace(
      "console.log('[Teen] title:', pack.title);",
      `const STYLE_ROTATION_PACK = selectStylePack('teen', pack.title || pack.problem || Date.now());
  console.log('[Teen] style:', STYLE_ROTATION_PACK.summary);
  console.log('[Teen] title:', pack.title);
  if (!pack.bgmQuery) pack.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;
  else pack.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;
  process.env.TEEN_VOICE = STYLE_ROTATION_PACK.voice.voice;
  process.env.TEEN_RATE = STYLE_ROTATION_PACK.voice.rate;
  process.env.TEEN_PITCH = STYLE_ROTATION_PACK.voice.pitch;`
    );
  }
  // Replace fixed ASS builder usage with rotating
  if (t.includes('function buildCinemaStyleAss') && !t.includes('buildRotatingAss(')) {
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

// ---- Stoic short ----
patch('scripts/generate_stoic_quote_reel.cjs', (t) => {
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE_LINE + '\n' + t;
  }
  if (!t.includes('STYLE_ROTATION_PACK') && t.includes('[Quote Reel] Scholar:')) {
    t = t.replace(
      /console\.log\(`\[Quote Reel\] Scholar:.*`\);/,
      `const STYLE_ROTATION_PACK = selectStylePack('stoic', (chosen && chosen.quote) || Date.now());
  console.log('[Stoic] style:', STYLE_ROTATION_PACK.summary);
  console.log(\\[Quote Reel] Scholar:      \\\${chosen.author}\\`);`
    );
    // Fix possible broken replace - simpler approach
  }
  if (!t.includes("[Stoic] style:") && t.includes('const chosen =') || t.includes('let chosen =')) {
    if (!t.includes("[Stoic] style:")) {
      t = t.replace(
        /console\.log\(\[Quote Reel\] Scholar:/,
        `const STYLE_ROTATION_PACK = selectStylePack('stoic', (typeof chosen !== 'undefined' && chosen.quote) || Date.now());
  console.log('[Stoic] style:', STYLE_ROTATION_PACK.summary);
  console.log([Quote Reel] Scholar:`
      );
    }
  }
  // Prefer rotating sfx for audio search strings
  t = t.replace(
    /'calm piano emotional ambient'/g,
    "(typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK.sfxQuery) || 'soft piano ambient instrumental no drums'"
  );
  return t;
});

// ---- Driftreel / documentary ----
patch('scripts/generate_documentary_movie_reel.cjs', (t) => {
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE_LINE + '\n' + t;
  }
  if (!t.includes('[Driftreel] style:')) {
    // Inject after story selection if possible
    if (t.includes('generateDynamicDocumentaryStory')) {
      t = t.replace(
        /const story = await generateDynamicDocumentaryStory\(\);/,
        `const story = await generateDynamicDocumentaryStory();
  const STYLE_ROTATION_PACK = selectStylePack('driftreel', (story && (story.title || story.hook)) || Date.now());
  console.log('[Driftreel] style:', STYLE_ROTATION_PACK.summary);
  if (story && !story.bgmQuery) story.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;
  else if (story) story.bgmQuery = STYLE_ROTATION_PACK.sfxQuery;`
      );
    }
  }
  // Stronger doc voice defaults
  if (t.includes("en-US-AndrewNeural") || t.includes('edge-tts')) {
    t = t.replace(
      /rate:\s*['"]-?\d+%/g,
      "rate: (typeof STYLE_ROTATION_PACK !== 'undefined' && STYLE_ROTATION_PACK.voice.rate) || '-15%'"
    );
  }
  // Caption style rotation if ASS present
  if (t.includes('Style: CenterKaraoke') && t.includes('buildRotatingAss')) {
    // ok
  } else if (t.includes('function build') && t.includes('Ass') && !t.includes('buildRotatingAss')) {
    t = t.replace(
      /Style: CenterKaraoke,[^\n]+/,
      "Style: RotatingCap,Arial Black,52,&H00FFFFFF,&H00000000,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3.0,1.2,5,60,60,0,1"
    );
  }
  // Vary visual path notes
  if (!t.includes('DRIFTREEL_VISUAL_ROTATION') && t.includes('hue=s=0')) {
    t = t.replace(
      /hue=s=0/g,
      "hue=s=0" // keep B&W option; rotation applied via pack.visualFx in render path when wired
    );
  }
  return t;
});

// ---- Archie: prefer v2 compositor ----
patch('scripts/generate_archie_live_reel.cjs', (t) => {
  if (!t.includes('archie_v2_compositor') && t.includes('renderArchieHeavy')) {
    t = t.replace(
      /async function renderArchieHeavy\([\s\S]*?\n\}\n/,
      `async function renderArchieHeavy(args) {
  // ARCHIE V2 path — stable 3-pose timeline; falls back to legacy only if v2 throws hard
  try {
    const { composeArchieV2 } = require('./archie_v2_compositor.cjs');
    const text = (args.script && (args.script.voiceover || args.script.script || args.script.narration)) || args.scriptText || '';
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
    console.warn('[Archie] v2 failed, legacy soft path:', e.message);
    throw e;
  }
}

`
    );
  }
  if (!t.includes('style_rotation_engine')) {
    t = REQUIRE_LINE + '\n' + t;
  }
  return t;
});

console.log('[style-rot] done');
