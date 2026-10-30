#!/usr/bin/env node
/**
 * Teen BOOST 5s loop — TikTok-style quote card
 * - Short norm-aligned motivational line (fetched or AI-written)
 * - Mood still image (Pexels/Unsplash/Pixabay) matching the line
 * - Frosted semi-transparent text card OR clean white type
 * - Near-transparent "Mind Rush" watermark
 * - Soft piano BGM, 5.0s, seamless loop-friendly
 * - No VO (music + text only) — max watch retention for FYP boosts
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const { searchAndFetchImage, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson, queryDuckDuckGo } = require('./topic_discovery_engine.cjs');
const { loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');

let selectStylePack;
try {
  ({ selectStylePack } = require('./style_rotation_engine.cjs'));
} catch (_) {
  selectStylePack = () => ({
    sfxQuery: 'soft piano ambient instrumental no drums',
    summary: 'fallback'
  });
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

function httpGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, timeoutMs).then(resolve, reject);
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
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
  "Keep the promise you made to yourself when no one was clapping."
];

async function inventOrFetchLine(history) {
  // Try AI for a fresh line
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
        imageQuery: data.imageQuery || 'peaceful nature soft light'
      };
    }
  } catch (e) {
    console.warn('[Boost] AI line:', e.message);
  }

  // Public-ish seed rotation minus history
  const used = new Set((history || []).map((h) => String(h.text || '').toLowerCase().slice(0, 40)));
  const pool = SEED_SAFE.filter((s) => !used.has(s.toLowerCase().slice(0, 40)));
  const text = (pool.length ? pool : SEED_SAFE)[Math.floor(Math.random() * (pool.length || SEED_SAFE.length))];
  const mood =
    /peace|alone|quiet|silence/i.test(text)
      ? 'peace'
      : /discipline|steps|promise|future/i.test(text)
        ? 'focus'
        : /confidence|strong|power|flex/i.test(text)
          ? 'power'
          : 'calm';
  const imageQuery =
    mood === 'peace'
      ? 'moody bedroom window city night soft light'
      : mood === 'focus'
        ? 'student desk morning light minimal'
        : mood === 'power'
          ? 'sunlight through trees forest mist golden'
          : 'foggy forest soft sunlight calm nature';
  return { text, mood, imageQuery };
}

const MOOD_QUERIES = {
  peace: [
    'moody bedroom window city night',
    'alone looking out window rain',
    'quiet room soft lamp evening',
    'city lights from high window night'
  ],
  power: [
    'sun rays through forest trees',
    'golden hour mountain silhouette',
    'dramatic sky after storm light',
    'sunrise over hills soft fog'
  ],
  calm: [
    'green forest sunlight mist',
    'peaceful lake morning reflection',
    'soft flowers bokeh nature',
    'open road calm sunrise'
  ],
  focus: [
    'notebook pen desk natural light',
    'library aisle soft focus',
    'coffee desk morning productivity',
    'minimal workspace plant window'
  ],
  courage: [
    'person walking path forest alone',
    'bridge fog morning silhouette',
    'ocean horizon storm clearing',
    'trail mountain soft light'
  ]
};

async function fetchMoodImage(line) {
  const queries = [
    line.imageQuery,
    ...(MOOD_QUERIES[line.mood] || MOOD_QUERIES.calm),
    'soft nature bokeh calm'
  ].filter(Boolean);
  for (const q of queries) {
    try {
      const img = await searchAndFetchImage(q, { preferredSource: 'unsplash' });
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) {
        console.log('[Boost] image', q, path.basename(p));
        return p;
      }
    } catch (_) {}
    try {
      const img = await searchAndFetchImage(q, {});
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) return p;
    } catch (_) {}
  }
  // last resort: solid gradient via SVG
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
  // generate soft pad with ffmpeg sine (very quiet)
  const wav = path.join(ART, 'soft_pad.wav');
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=220:duration=${DURATION + 1}" -f lavfi -i "sine=frequency=330:duration=${DURATION + 1}" -filter_complex "[0][1]amix=inputs=2,volume=0.08,afade=t=in:d=0.5,afade=t=out:st=${DURATION - 0.6}:d=0.5" -t ${DURATION + 0.2} "${wav}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
  return wav;
}

/** Build SVG overlay: frosted card + text + Mind Rush watermark */
function buildOverlaySvg(text, layout = 'frost') {
  const lines = wrapLines(text, 30);
  const lineH = 58;
  const blockH = lines.length * lineH + 48;
  const blockY = 1920 / 2 - blockH / 2;
  const textSvg = lines
    .map((ln, i) => {
      const y = blockY + 40 + i * lineH;
      return `<text x="540" y="${y}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="42" fill="#111111" opacity="0.92">${escapeXml(ln)}</text>`;
    })
    .join('\n');

  // Clean white text variant (dark scenes)
  const textLight = lines
    .map((ln, i) => {
      const y = 720 + i * lineH;
      return `<text x="540" y="${y}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="40" fill="#F8FAFC" opacity="0.95" style="filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.55))">${escapeXml(ln)}</text>`;
    })
    .join('\n');

  const frost = `
  <rect x="70" y="${blockY}" width="940" height="${blockH}" rx="28" ry="28" fill="#ffffff" fill-opacity="0.42"/>
  <rect x="70" y="${blockY}" width="940" height="${blockH}" rx="28" ry="28" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5"/>
  ${textSvg}
  <text x="540" y="${blockY + blockH - 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#334155" opacity="0.55">@mindrush</text>
`;

  const clean = `
  ${textLight}
`;

  const body = layout === 'clean' ? clean : frost;

  // Near-transparent channel watermark (Mind Rush)
  const watermark = `
  <text x="540" y="1780" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="36" fill="#ffffff" opacity="0.18" letter-spacing="4">${escapeXml(CHANNEL_MARK.toUpperCase())}</text>
  <text x="540" y="1820" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.12">mindrush</text>
`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${body}
  ${watermark}
</svg>`;
}

function renderBoost(imagePath, overlayPng, bgmPath, outMp4, styleSeed) {
  const frames = Math.ceil(DURATION * 30);
  // Slow Ken Burns for loop-friendly motion
  const zoom =
    styleSeed % 2 === 0
      ? `zoompan=z='min(1.12,1.0+0.00035*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`
      : `zoompan=z='if(eq(on,1),1.1,max(1.0,1.1-0.0003*on))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`;

  const vf = [
    'scale=1280:2276:force_original_aspect_ratio=increase',
    'crop=1280:2276',
    zoom,
    'eq=contrast=1.08:saturation=0.95',
    'fade=t=in:st=0:d=0.25',
    `fade=t=out:st=${(DURATION - 0.3).toFixed(2)}:d=0.3`
  ].join(',');

  const filter = `[0:v]${vf}[bg];[1:v]scale=1080:1920,format=rgba[ov];[bg][ov]overlay=0:0:format=auto[v]`;
  const af = `[2:a]volume=0.45,afade=t=in:d=0.3,afade=t=out:st=${(DURATION - 0.4).toFixed(2)}:d=0.35,atrim=0:${DURATION.toFixed(2)}[a]`;

  execSync(
    `ffmpeg -y -loop 1 -t ${DURATION.toFixed(2)} -i "${imagePath}" -loop 1 -t ${DURATION.toFixed(2)} -i "${overlayPng}" -stream_loop -1 -i "${bgmPath}" -filter_complex "${filter};${af}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 160k -t ${DURATION.toFixed(2)} "${outMp4}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  ensureDirs();
  console.log('\n=== TEEN BOOST 5s LOOP ===');
  console.log('quote card + mood image + Mind Rush watermark + soft BGM\n');

  const history = loadHistory(HIST);
  const line = await inventOrFetchLine(history);
  console.log('[Boost] line:', line.text);
  console.log('[Boost] mood:', line.mood);

  if (isDuplicate({ title: line.text, hook: line.text }, history, { overlapMax: 0.5 })) {
    console.warn('[Boost] near-duplicate — still rendering once');
  }

  const imagePath = await fetchMoodImage(line);
  const bgmPath = await fetchSoftBgm();

  // Alternate frost card vs clean text for variety
  const layout = /peace|alone|night|solitude/i.test(line.text + line.mood) ? 'clean' : 'frost';
  const svgPath = path.join(ART, 'overlay.svg');
  const overlayPng = path.join(ART, 'overlay.png');
  fs.writeFileSync(svgPath, buildOverlaySvg(line.text, layout));
  execSync(`ffmpeg -y -i "${svgPath}" "${overlayPng}" 2>/dev/null`);

  const outMp4 = path.join(OUT, 'teen_motivation_latest.mp4');
  const seed = Math.abs(line.text.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  renderBoost(imagePath, overlayPng, bgmPath, outMp4, seed);

  const sz = fs.statSync(outMp4).size;
  if (sz < 80000) throw new Error('Boost output too small ' + sz);
  console.log('[Boost] OK', outMp4, (sz / 1024).toFixed(0) + 'KB', DURATION + 's', layout);

  const title = line.text.length > 70 ? line.text.slice(0, 67) + '…' : line.text;
  const description = [
    line.text,
    '',
    'A quiet reminder for your day.',
    '',
    `#MindRush #TeenMotivation #Motivation #Shorts #FYP #Discipline #Peace #Mindset`,
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
