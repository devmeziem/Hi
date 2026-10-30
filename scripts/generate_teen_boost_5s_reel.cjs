#!/usr/bin/env node
/**
 * Teen BOOST 5s loop — TikTok-style quote card (Mind Rush)
 * Matches viral formats: frosted glass card OR clean white type on mood stills.
 * - Line: public/safe seed OR AI-invented (teen norms)
 * - Image: mood-matched stock still
 * - Near-transparent "MIND RUSH" watermark
 * - Soft piano BGM, ~5s, loop-friendly fades
 * - No VO (text + music) for FYP boost retention
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const { searchAndFetchImage, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');

let selectStylePack;
try {
  ({ selectStylePack } = require('./style_rotation_engine.cjs'));
} catch (_) {
  selectStylePack = () => ({ sfxQuery: 'soft piano ambient instrumental no drums', summary: 'fallback' });
}

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_boost_5s');
const HIST = path.join(process.cwd(), 'data', 'teen_boost_history.json');
const DURATION = Math.max(4.5, Math.min(6, parseFloat(process.env.BOOST_DURATION || '5.0') || 5));
const CHANNEL_MARK = process.env.TEEN_WATERMARK || 'Mind Rush';
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const skipBuffer = String(process.env.SKIP_BUFFER || 'false') === 'true' || isDry;

function ensureDirs() {
  for (const d of [OUT, ART, path.dirname(HIST)]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapLines(text, maxChars = 28) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 5);
}

/** Public / safe boost lines — teen norms, no toxicity */
const SEED_SAFE = [
  "Confidence isn't needing everyone to believe in you. It's continuing when they don't.",
  "There's something powerful about being alone because you chose peace, not because nobody wanted you around.",
  "You don't owe anyone a smaller version of yourself.",
  "Rest is not quitting. Rest is how you stay in the fight.",
  "Your pace is not a race. Comparison is the thief of your joy.",
  "The strongest flex is staying kind when the world is loud.",
  "Discipline is choosing what you want most over what you want now.",
  "You can start again without announcing it to anyone.",
  "Protect your energy like it's your last battery percentage.",
  "Growth feels quiet. Noise is often just distraction.",
  "You are allowed to outgrow rooms that only liked the smaller you.",
  "Small consistent steps beat one dramatic restart.",
  "Your future self is watching what you do with today.",
  "Silence is a boundary, not a weakness.",
  "Keep the promise you made to yourself when no one was clapping.",
  "Not everyone will understand your glow-up. Keep going anyway.",
  "Peace is not emptiness. Peace is choosing what no longer drains you.",
  "You don't need a perfect plan. You need the next honest step.",
  "Soft heart. Strong boundaries. That combination wins.",
  "The version of you that is tired is still allowed to try again tomorrow."
];

const MOOD_QUERIES = {
  calm: ['sunlight through forest trees soft haze', 'peaceful morning window light plants', 'misty green woods golden hour'],
  power: ['city skyline at dusk from high window', 'lone runner empty road sunrise', 'mountain ridge storm clearing light'],
  peace: ['quiet bedroom city lights night window', 'ocean horizon soft sunset', 'empty cafe morning light calm'],
  focus: ['study desk notebook soft lamp', 'library aisle soft light books', 'rain on window night bokeh'],
  courage: ['open road fog headlights', 'cliff edge ocean wind', 'stairs upward soft light silhouette']
};

async function inventOrFetchLine(history) {
  try {
    const recent = (history || []).slice(-12).map((h) => h.text).filter(Boolean);
    const data = await callActiveAiForJson({
      system:
        'You write short teen-safe motivational lines for TikTok. No drugs, no self-harm, no dating toxicity, no insults. Warm, strong, clear. Max 22 words. Return JSON only.',
      user: `Write ONE original motivational line for students/teens (ages 13–20).
Rules: hopeful, practical, non-toxic, no medical claims, no politics.
Avoid repeating: ${recent.slice(0, 8).join(' | ') || 'none'}
Return: { "text": "...", "mood": "calm|power|peace|focus|courage", "imageQuery": "stock photo search phrase" }`
    });
    if (data && data.text && String(data.text).split(/\s+/).length <= 28) {
      return {
        text: String(data.text).trim().replace(/^["']|["']$/g, ''),
        mood: data.mood || 'calm',
        imageQuery: data.imageQuery || null,
        source: 'ai'
      };
    }
  } catch (e) {
    console.warn('[Boost] AI line:', e.message);
  }
  // Seed pool with dedup
  const used = new Set((history || []).map((h) => String(h.text || '').toLowerCase().slice(0, 60)));
  const pool = SEED_SAFE.filter((s) => !used.has(s.toLowerCase().slice(0, 60)));
  const pick = (pool.length ? pool : SEED_SAFE)[Math.floor(Math.random() * (pool.length || SEED_SAFE.length))];
  const moodKeys = Object.keys(MOOD_QUERIES);
  const mood = moodKeys[Math.floor(Math.random() * moodKeys.length)];
  return { text: pick, mood, imageQuery: null, source: 'seed' };
}

async function fetchMoodImage(line) {
  const mood = line.mood || 'calm';
  const queries = [];
  if (line.imageQuery) queries.push(line.imageQuery);
  const moodQs = MOOD_QUERIES[mood] || MOOD_QUERIES.calm;
  queries.push(...moodQs);
  queries.push('soft nature sunlight bokeh', 'moody room window city night');

  for (const q of queries) {
    try {
      const img = await searchAndFetchImage(q, {});
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) {
        console.log('[Boost] image', q, path.basename(p));
        return p;
      }
    } catch (_) {}
  }
  const svg = path.join(ART, 'fallback_bg.svg');
  fs.writeFileSync(
    svg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/></svg>`
  );
  const png = path.join(ART, 'fallback_bg.png');
  execSync(`ffmpeg -y -i "${svg}" "${png}" 2>/dev/null`);
  return png;
}

async function fetchSoftBgm() {
  const pack = selectStylePack('teen', Date.now());
  const q = pack.sfxQuery || 'soft piano ambient instrumental no drums';
  try {
    const a = await searchAndFetchAudio(q, DURATION + 2, 'teen');
    const p = a && (a.localPath || a.path);
    if (p && fs.existsSync(p) && fs.statSync(p).size > 4000) return p;
  } catch (_) {}
  const wav = path.join(ART, 'soft_pad.wav');
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=220:duration=${DURATION + 1}" -f lavfi -i "sine=frequency=330:duration=${DURATION + 1}" -filter_complex "[0][1]amix=inputs=2,volume=0.08,afade=t=in:d=0.5,afade=t=out:st=${DURATION - 0.6}:d=0.5" -t ${DURATION + 0.2} "${wav}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
  return wav;
}

/**
 * Layouts matching viral TikTok quote cards:
 * - frost: semi-transparent rounded card (like maywords)
 * - clean: white type + soft shadow on dark mood still (like Ridwan Noir)
 */
function buildOverlaySvg(text, layout = 'frost') {
  const lines = wrapLines(text, 30);
  const lineH = 56;
  const blockH = lines.length * lineH + 56;
  const blockY = Math.round(1920 / 2 - blockH / 2);

  const textDark = lines
    .map((ln, i) => {
      const y = blockY + 44 + i * lineH;
      return `<text x="540" y="${y}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="40" fill="#0f172a" opacity="0.92">${escapeXml(ln)}</text>`;
    })
    .join('\n');

  const textLight = lines
    .map((ln, i) => {
      const y = 700 + i * lineH;
      return `<text x="540" y="${y}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="40" fill="#F8FAFC" opacity="0.96">${escapeXml(ln)}</text>`;
    })
    .join('\n');

  // Frosted glass card — almost transparent white, soft radius
  const frost = `
  <rect x="72" y="${blockY}" width="936" height="${blockH}" rx="32" ry="32" fill="#ffffff" fill-opacity="0.38"/>
  <rect x="72" y="${blockY}" width="936" height="${blockH}" rx="32" ry="32" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.2"/>
  ${textDark}
  <text x="540" y="${blockY + blockH - 16}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#334155" opacity="0.45">@mindrush</text>
`;

  const clean = `
  ${textLight}
`;

  const body = layout === 'clean' ? clean : frost;

  // Near-transparent channel watermark (Mind Rush) — bottom center
  const watermark = `
  <text x="540" y="1768" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" fill="#ffffff" opacity="0.16" letter-spacing="6">${escapeXml(CHANNEL_MARK.toUpperCase())}</text>
  <text x="540" y="1808" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#ffffff" opacity="0.11">mindrush</text>
`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${body}
  ${watermark}
</svg>`;
}

function renderBoost(imagePath, overlayPng, bgmPath, outMp4, styleSeed) {
  const frames = Math.ceil(DURATION * 30);
  const zoom =
    styleSeed % 2 === 0
      ? `zoompan=z='min(1.10,1.0+0.00028*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`
      : `zoompan=z='if(eq(on,1),1.09,max(1.0,1.09-0.00025*on))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`;

  const vf = [
    'scale=1280:2276:force_original_aspect_ratio=increase',
    'crop=1280:2276',
    zoom,
    'eq=contrast=1.06:saturation=0.96',
    'fade=t=in:st=0:d=0.2',
    `fade=t=out:st=${(DURATION - 0.25).toFixed(2)}:d=0.25`
  ].join(',');

  const filter = `[0:v]${vf}[bg];[1:v]scale=1080:1920,format=rgba[ov];[bg][ov]overlay=0:0:format=auto[v]`;
  const af = `[2:a]volume=0.42,afade=t=in:d=0.25,afade=t=out:st=${(DURATION - 0.35).toFixed(2)}:d=0.3,atrim=0:${DURATION.toFixed(2)}[a]`;

  execSync(
    `ffmpeg -y -loop 1 -t ${DURATION.toFixed(2)} -i "${imagePath}" -loop 1 -t ${DURATION.toFixed(2)} -i "${overlayPng}" -stream_loop -1 -i "${bgmPath}" -filter_complex "${filter};${af}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -t ${DURATION.toFixed(2)} "${outMp4}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  ensureDirs();
  console.log('\n=== TEEN BOOST 5s (Mind Rush) ===');

  const history = loadHistory(HIST);
  const line = await inventOrFetchLine(history);
  if (isDuplicate({ title: line.text, text: line.text }, history, { overlapMax: 0.55 })) {
    console.warn('[Boost] near-duplicate line — still rendering with new image');
  }
  console.log('[Boost] line:', line.text);
  console.log('[Boost] mood:', line.mood, 'source:', line.source);

  const imagePath = await fetchMoodImage(line);
  const bgmPath = await fetchSoftBgm();

  // Layout: frost for calm/peace, clean for power/courage/focus-ish dark
  const layout =
    process.env.BOOST_LAYOUT ||
    (['power', 'courage', 'focus'].includes(line.mood) ? 'clean' : 'frost');
  const svg = buildOverlaySvg(line.text, layout);
  const overlaySvg = path.join(ART, 'overlay.svg');
  const overlayPng = path.join(ART, 'overlay.png');
  fs.writeFileSync(overlaySvg, svg);
  execSync(`ffmpeg -y -i "${overlaySvg}" "${overlayPng}" 2>/dev/null`);

  const outMp4 = path.join(OUT, 'teen_boost_5s_latest.mp4');
  const latest = path.join(OUT, 'teen_motivation_latest.mp4');
  const seed = Math.abs(line.text.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  renderBoost(imagePath, overlayPng, bgmPath, outMp4, seed);
  try {
    fs.copyFileSync(outMp4, latest);
  } catch (_) {}

  const sz = fs.statSync(outMp4).size;
  if (sz < 80000) throw new Error('Boost output too small ' + sz);
  console.log('[Boost] OK', outMp4, (sz / 1024).toFixed(0) + 'KB', DURATION + 's', layout);

  const title = line.text.length > 70 ? line.text.slice(0, 67) + '…' : line.text;
  const description = [
    line.text,
    '',
    'A quiet reminder for your day.',
    '',
    '#MindRush #TeenMotivation #Motivation #Shorts #FYP #Discipline #Peace #Mindset',
    '',
    'Not medical or therapy advice — just a nudge toward your next small action.'
  ].join('\n');

  const meta = {
    title,
    description,
    hashtags: ['#MindRush', '#TeenMotivation', '#Motivation', '#Shorts', '#FYP', '#Mindset'],
    text: line.text,
    mood: line.mood,
    layout,
    duration: DURATION,
    format: 'boost_5s_loop',
    watermark: CHANNEL_MARK,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, 'teen_motivation_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(ART, 'latest_meta.json'), JSON.stringify(meta, null, 2));
  saveHistory(HIST, { title: line.text, text: line.text, mood: line.mood });

  if (!isDry && process.env.YOUTUBE_REFRESH_TOKEN) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outMp4,
        title: title.slice(0, 95),
        description,
        tags: meta.hashtags.map((h) => h.replace(/^#/, '')),
        channelId: 'teen_motivation'
      });
    } catch (e) {
      console.warn('[Boost] YouTube:', e.message);
    }
  }

  if (!skipBuffer && !isDry) {
    try {
      execSync('node scripts/publish_buffer_second_tiktok.cjs teen_motivation', {
        stdio: 'inherit',
        env: {
          ...process.env,
          CHANNEL_TARGET: 'teen_motivation',
          BUFFER_TIKTOK_TEEN_CHANNEL_ID:
            process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID || '6ab05677ea19ca0bde9c3ffb',
          TEEN_POST_TITLE: title,
          TEEN_POST_DESCRIPTION: description
        }
      });
    } catch (e) {
      console.warn('[Boost] Buffer:', e.message);
    }
  }

  console.log('[Boost] title:', title);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[Boost] FAIL', e.message);
    process.exit(1);
  });
}

module.exports = { main };
