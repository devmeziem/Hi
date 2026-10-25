#!/usr/bin/env node
/**
 * Batch: kill Google TTS fallback, force audible BGM, ken-burns/B&W/zoom effects,
 * Driftreel story-angle + old-TV look, Stoic image diversity + desc cleanup,
 * Fin desc cleanup, Teen motion effects.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function patch(file, fn) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.warn('[skip]', file);
    return;
  }
  let t = fs.readFileSync(p, 'utf8');
  const out = fn(t);
  if (out && out !== t) {
    fs.writeFileSync(p, out);
    try {
      execSync('node --check "' + p + '"', { stdio: 'pipe' });
      console.log('[ok]', file);
    } catch (e) {
      fs.writeFileSync(p, t);
      console.warn('[reverted]', file, e.message);
    }
  } else console.log('[noop]', file);
}

// --- 1) TTS: remove Google Tier 2 / translate fallback ---
patch('scripts/tts_resilient_engine.cjs', (t) => {
  if (t.includes('NO_GOOGLE_TTS_FALLBACK_V1')) return t;
  t = '/** NO_GOOGLE_TTS_FALLBACK_V1 */\n' + t;
  // Disable google translate fetch blocks
  t = t.replace(/async function synthesizeWithGoogle[\s\S]*?^}/m, 'async function synthesizeWithGoogle(){ throw new Error("Google TTS disabled"); }');
  t = t.replace(/Tier 2 Resilient TTS fallback[\s\S]{0,80}/g, 'Google TTS disabled — male Edge only ');
  // If google URL present, short-circuit
  t = t.replace(
    /translate\.google\.com[^'\"`]*/g,
    'DISABLED_GOOGLE_TTS'
  );
  // Force failure instead of soft google success
  t = t.replace(
    /provider:\s*['\"]google[^'\"]*['\"]/gi,
    "provider: 'blocked-google'"
  );
  // Prefer only edge / edge-tts-python
  if (!t.includes('MALE_EDGE_CLI_BEFORE_GOOGLE_V1')) {
    t = t.replace(
      /async function synthesizeSpeechResilient/,
      `async function synthesizeSpeechResilient`
    );
  }
  return t;
});

// --- 2) Audible BGM: volume floor ~0.35-0.5 relative ---
for (const f of [
  'scripts/generate_teen_situation_reel.cjs',
  'scripts/generate_stoic_5s_reel.cjs',
  'scripts/generate_stoic_quote_reel.cjs',
  'scripts/generate_fin_income_short.cjs',
  'scripts/generate_movie_brand_doc.cjs',
  'scripts/apply_unique_bgm_all.cjs',
  'scripts/fix_channel_audio_visual_quality.cjs',
]) {
  patch(f, (t) => {
    if (t.includes('BGM_AUDIBLE_FLOOR_V1')) return t;
    t = t.replace(/volume=0\.0[5-9]/g, 'volume=0.38');
    t = t.replace(/volume=0\.1[0-9]/g, 'volume=0.40');
    t = t.replace(/volume=0\.2[0-4]/g, 'volume=0.42');
    t = t.replace(/bgmVolume\s*=\s*0\.[0-2]\d*/g, 'bgmVolume = 0.42');
    t = t.replace(/BGM_VOL\s*=\s*0\.[0-2]\d*/g, 'BGM_VOL = 0.42');
    t = t.replace(/\* 0\.[0-2]\d* \/\/ bgm/gi, '* 0.42 // bgm');
    // amix dropout
    t = t.replace(/dropout_transition=\d+/g, 'dropout_transition=0');
    return '/** BGM_AUDIBLE_FLOOR_V1 */\n' + t;
  });
}

// --- 3) Teen motion: kenburns / zoom / pan / occasional B&W ---
patch('scripts/generate_teen_situation_reel.cjs', (t) => {
  if (t.includes('TEEN_MOTION_FX_V1')) return t;
  t = '/** TEEN_MOTION_FX_V1 */\n' + t;
  // Prefer zoompan over static + fade
  t = t.replace(/fade=t=in:st=0:d=0\.\d+/g, 'null');
  t = t.replace(/fade=t=out:[^\,\[\]]+/g, 'null');
  if (!t.includes('zoompan=z=')) {
    t = t.replace(
      /scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920/g,
      "scale=1200:2100:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1080x1920:fps=25"
    );
  }
  return t;
});

// --- 4) Stoic: no fade, ken burns, fresh image queries ---
for (const f of ['scripts/generate_stoic_5s_reel.cjs', 'scripts/generate_stoic_quote_reel.cjs']) {
  patch(f, (t) => {
    if (t.includes('STOIC_KENBURNS_V1')) return t;
    t = '/** STOIC_KENBURNS_V1 */\n' + t;
    t = t.replace(/fade=t=in:[^\,]+/g, 'null');
    t = t.replace(/fade=t=out:[^\,\[]+/g, 'null');
    t = t.replace(
      /marble|greek statue|same stock/gi,
      'dramatic sky mountains fog portrait silhouette'
    );
    // diversify default queries
    if (t.includes('imageQuery') || t.includes('searchQuery')) {
      t = t.replace(
        /[\"']stoic[\"']/gi,
        "'atmospheric landscape fog'"
      );
    }
    return t;
  });
}

// --- 5) Driftreel: story angle, no watermark, bold center captions, old TV ---
for (const f of [
  'scripts/generate_movie_brand_doc.cjs',
  'scripts/generate_cinema_vanguard.cjs',
  'scripts/movie_brand_pipeline.cjs',
]) {
  patch(f, (t) => {
    if (!fs.existsSync(path.join(process.cwd(), f)) && !t) return t;
    if (t.includes('DRIFTREEL_STORY_TV_V1')) return t;
    t = '/** DRIFTREEL_STORY_TV_V1 */\n' + t;
    t = t.replace(/watermark/gi, 'no_watermark');
    t = t.replace(/drawtext=.*?Cinema[^:]*:/gi, 'null');
    t = t.replace(/follow for more/gi, '');
    t = t.replace(/scene \d+\/\d+/gi, '');
    // caption style hints
    t = t.replace(/MarginV:\d+/g, 'MarginV:320');
    t = t.replace(/Fontsize:\d+/g, 'Fontsize:72');
    t = t.replace(/Bold:\d/g, 'Bold:1');
    // old TV / bw preference in prompts
    t = t.replace(
      /documentary style/gi,
      'true-crime or untold history story documentary, film grain, occasional black and white, archival mood'
    );
    return t;
  });
}

// --- 6) Description SEO cleaner shared ---
const descHelper = path.join(process.cwd(), 'scripts', 'seo_description_clean.cjs');
if (!fs.existsSync(descHelper)) {
  fs.writeFileSync(
    descHelper,
    `#!/usr/bin/env node
/** Clean spammy engine descriptions for YT/TikTok */
function cleanSeoDescription(raw, extras = {}) {
  let s = String(raw || '');
  s = s.replace(/[\\s\\S]*?(engine|workflow|buffer|dispatch|quota|seed|json)[^\\n]*/gi, '');
  s = s.replace(/#\\w+/g, (m) => m); // keep hashtags
  s = s.replace(/\\n{3,}/g, '\\n\\n').trim();
  const title = extras.title || '';
  const hooks = [
    title,
    extras.hook || '',
    'Watch till the end.',
    extras.disclaimer || '',
  ].filter(Boolean);
  const tags = (extras.hashtags || [])
    .map((h) => (String(h).startsWith('#') ? h : '#' + h))
    .slice(0, 12)
    .join(' ');
  const body = hooks.join('\\n') + (s ? '\\n\\n' + s.slice(0, 500) : '');
  return (body + '\\n\\n' + tags).trim().slice(0, 4000);
}
module.exports = { cleanSeoDescription };
`
  );
  console.log('[ok] seo_description_clean.cjs');
}

// Wire cleaner into fin/stoic if possible
for (const f of [
  'scripts/generate_fin_income_short.cjs',
  'scripts/generate_stoic_5s_reel.cjs',
  'scripts/run_fin_daily_slot.cjs',
]) {
  patch(f, (t) => {
    if (t.includes('seo_description_clean')) return t;
    if (!t.includes('description')) return t;
    t =
      "const { cleanSeoDescription } = require('./seo_description_clean.cjs');\n" + t;
    t = t.replace(
      /description:\s*([^,\n]+)/,
      'description: cleanSeoDescription($1, { title: (typeof title!=="undefined"?title:"") })'
    );
    return t;
  });
}

// --- 7) Kaggle Archie note: same puppet, 3D-like look ---
const kag = path.join(process.cwd(), 'kaggle/ai_clip_worker/ai_clip_worker.ipynb');
if (fs.existsSync(kag)) {
  let nb = fs.readFileSync(kag, 'utf8');
  if (!nb.includes('ARCHIE_SAME_PUPPET_3D_LOOK')) {
    nb = nb.replace(
      'cinematic vertical shot soft light, no text',
      'ARCHIE_SAME_PUPPET_3D_LOOK: 3D stylized cartoon explorer matching existing Archie puppet face colors outfit, consistent character every frame, vertical 9:16, no text'
    );
    fs.writeFileSync(kag, nb);
    console.log('[ok] kaggle archie same-character prompts');
  }
}

console.log('batch done');
