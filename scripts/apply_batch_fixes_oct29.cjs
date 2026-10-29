#!/usr/bin/env node
/**
 * Batch fixes 2026-10-29
 * - Stoic long: inject uploadYouTubeShort require
 * - Archie: soft-fail gestures (skip filtergraph crash)
 * - Stoic shell-fix: skip if rotation helpers present
 * - Teen Buffer: prefer TEEN_POST_TITLE / TEEN_POST_DESCRIPTION
 * Does NOT touch Driftreel channel mapping.
 */
const fs = require('fs');
const path = require('path');

function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function write(p, t) {
  fs.writeFileSync(p, t);
  console.log('[batch] wrote', path.relative(process.cwd(), p));
}

// ---------- 1) Stoic long YouTube upload ----------
{
  const p = path.join(process.cwd(), 'scripts', 'generate_stoic_long_video.cjs');
  let t = read(p);
  if (t && !t.includes('INJECT_YT_UPLOAD_FIX')) {
    // Ensure patchSource injects require before upload call in restored body
    if (!t.includes('uploadYouTubeShort is provided by youtube_channel_dispatcher')) {
      t = t.replace(
        'function patchSource(src) {
  let text = src;',
        `function patchSource(src) {
  let text = src;
  // INJECT_YT_UPLOAD_FIX: old restore calls uploadYouTubeShort without import
  if (!text.includes("require('./youtube_channel_dispatcher") && text.includes('uploadYouTubeShort')) {
    text = text.replace(
      /const uploadRes = await uploadYouTubeShort\(/,
      "const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');\n      const uploadRes = await uploadYouTubeShort("
    );
    if (!text.includes("require('./youtube_channel_dispatcher")) {
      text = "const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');\n" + text;
    }
  }
`
      );
      write(p, t);
    }
  } else if (t) {
    console.log('[batch] stoic long already has upload fix marker or missing');
  }
}

// Direct hard patch on wrapper every run via string ops if patchSource block exists
{
  const p = path.join(process.cwd(), 'scripts', 'generate_stoic_long_video.cjs');
  let t = read(p);
  if (t && t.includes('uploadYouTubeShort') && !t.includes("youtube_channel_dispatcher.cjs');\n      const uploadRes")) {
    // Add post-require injection right before require(PATCHED)
    if (!t.includes('INJECT_YT_UPLOAD_RUNTIME')) {
      t = t.replace(
        'source = patchSource(source);
fs.writeFileSync(PATCHED, source, \'utf8\');',
        `source = patchSource(source);
// INJECT_YT_UPLOAD_RUNTIME
if (source.includes('uploadYouTubeShort') && !source.includes("require('./youtube_channel_dispatcher")) {
  source = source.replace(
    /const uploadRes = await uploadYouTubeShort\(/,
    "const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');\\n      const uploadRes = await uploadYouTubeShort("
  );
}
fs.writeFileSync(PATCHED, source, 'utf8');`
      );
      // Fix escaped newlines if broken
      t = t.replace(
        "require('./youtube_channel_dispatcher.cjs');\\\\n      const uploadRes",
        "require('./youtube_channel_dispatcher.cjs');\n      const uploadRes"
      );
      write(p, t);
      console.log('[batch] stoic long runtime inject');
    }
  }
}

// ---------- 2) Archie soft-fail gestures ----------
{
  const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
  let t = read(p);
  if (t && t.includes("runFfmpeg(gestCmd, 'pass_gestures')") && !t.includes('SOFT_GESTURE_FAIL')) {
    t = t.replace(
      "runFfmpeg(gestCmd, 'pass_gestures');",
      `try {
    runFfmpeg(gestCmd, 'pass_gestures');
  } catch (ge) {
    // SOFT_GESTURE_FAIL: continue without puppet overlay (filtergraph stream mismatch)
    console.warn('[Archie] gestures skipped:', ge.message.slice(0, 180));
    try { fs.copyFileSync(sceneMp4, gestMp4); } catch (_) {
      try { fs.copyFileSync(baseMp4, gestMp4); } catch (e2) { throw ge; }
    }
  }`
    );
    write(p, t);
    console.log('[batch] Archie soft gesture fail');
  } else if (t && t.includes('SOFT_GESTURE_FAIL')) {
    console.log('[batch] Archie soft gesture already present');
  }
}

// ---------- 3) Stoic shell-fix: do not revert rotation helpers ----------
{
  const p = path.join(process.cwd(), 'scripts', 'fix_stoic_shell_quote.cjs');
  let t = read(p);
  if (t && !t.includes('SKIP_IF_ROTATION')) {
    const guard = `// SKIP_IF_ROTATION
const targetCheck = path.join(process.cwd(), 'scripts', 'generate_stoic_quote_reel.cjs');
if (fs.existsSync(targetCheck) && fs.readFileSync(targetCheck, 'utf8').includes('normalizeStoicQuote')) {
  console.log('[stoic-fix] skip — anti-spam rotation helpers present');
  process.exit(0);
}
`;
    if (t.includes("for (const rel of [")) {
      t = t.replace("for (const rel of [", guard + "for (const rel of [");
      write(p, t);
      console.log('[batch] stoic shell-fix skip guard');
    }
  }
}

// ---------- 4) Buffer publisher: use TEEN_POST_TITLE when set ----------
{
  const p = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
  let t = read(p);
  if (!t) {
    console.log('[batch] no buffer publisher');
  } else if (t.includes('async function postToTikTok')) {
    // Real publisher body present
    if (!t.includes('TEEN_POST_TITLE') || !t.includes('process.env.TEEN_POST_TITLE')) {
      // Try inject after caption build patterns
      if (t.includes('Clean User-Facing Caption') || t.includes('caption') || t.includes('text:')) {
        const inject = `
// Prefer env titles from generators (teen/stoic)
function preferEnvCaption(fallback) {
  const title = (process.env.TEEN_POST_TITLE || process.env.POST_TITLE || '').trim();
  const desc = (process.env.TEEN_POST_DESCRIPTION || process.env.POST_DESCRIPTION || '').trim();
  if (title && desc) return title + '\\n\\n' + desc;
  if (title) return title + (fallback ? '\\n\\n' + fallback : '');
  if (desc) return desc;
  return fallback || '';
}
`;
        if (!t.includes('function preferEnvCaption')) {
          t = inject + t;
          // Common assignment patterns
          t = t.replace(
            /let caption = ([^;]+);/,
            'let caption = preferEnvCaption($1);'
          );
          t = t.replace(
            /const caption = ([^;]+);/,
            'const caption = preferEnvCaption($1);'
          );
          write(p, t);
          console.log('[batch] buffer caption env prefer');
        }
      }
    }
  } else {
    // Bootstrap only — patch restore() to inject after download
    if (!t.includes('TEEN_CAPTION_PATCH')) {
      t = t.replace(
        "fs.writeFileSync(SELF, body);",
        `// TEEN_CAPTION_PATCH
  if (!body.includes('preferEnvCaption')) {
    body = "function preferEnvCaption(fallback) {\\n  const title = (process.env.TEEN_POST_TITLE || process.env.POST_TITLE || '').trim();\\n  const desc = (process.env.TEEN_POST_DESCRIPTION || process.env.POST_DESCRIPTION || '').trim();\\n  if (title && desc) return title + '\\n\\n' + desc;\\n  if (title) return title + (fallback ? '\\n\\n' + fallback : '');\\n  if (desc) return desc;\\n  return fallback || '';\\n}\\n" + body;
    body = body.replace(/let caption = ([^;]+);/, 'let caption = preferEnvCaption($1);');
    body = body.replace(/const caption = ([^;]+);/, 'const caption = preferEnvCaption($1);');
  }
  // Drop invalid TikTok metadata fields Buffer rejects
  body = body.replace(/,?\\s*allowComments\\s*:\\s*true/g, '');
  body = body.replace(/,?\\s*allowDuet\\s*:\\s*true/g, '');
  body = body.replace(/,?\\s*allowStitch\\s*:\\s*true/g, '');
  fs.writeFileSync(SELF, body);`
      );
      write(p, t);
      console.log('[batch] buffer bootstrap caption patch');
    }
  }
}

console.log('[batch] done');
