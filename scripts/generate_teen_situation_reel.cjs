#!/usr/bin/env node
/**
 * Teen / Youth Motivation — LIVE global pipeline (no hardcoded scripts/media/BGM)
 *
 * Flow:
 * 1) DuckDuckGo + Google News: common public teen/youth daily problems
 * 2) Optional public quote that fits the problem (Wikiquote / AI selection)
 * 3) Active AI writes TTS script + cinema-style caption words +
 *    visual keywords + BGM keywords + title/description/hashtags
 * 4) Always ends with a UNIQUE "motivation alone is not enough — action is" close
 * 5) Engine searches Pexels/Unsplash/Pixabay/Openverse for clips+stills+audio
 * 6) Stitch with fade in/out + Ken Burns pan/zoom + bold Andrew VO + cinema karaoke
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const { VOLUMES, VOICES, loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson, queryDuckDuckGo, queryGoogleNewsRss } = require('./topic_discovery_engine.cjs');
const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const HIST = path.join(process.cwd(), 'data', 'teen_topic_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const skipBuffer = String(process.env.SKIP_BUFFER || 'false') === 'true' || isDry;

// Very bold motivation voice
const VOICE = {
  id: (VOICES.motivation && VOICES.motivation.id) || 'en-US-AndrewNeural',
  rate: '-10%',
  pitch: '-28Hz'
};
const BGM_VOL = (VOLUMES.teen && VOLUMES.teen.bgm) || 0.34;
const VOICE_VOL = (VOLUMES.teen && VOLUMES.teen.voice) || 1.55;

function ensureDirs() {
  for (const d of [OUT, ART, path.dirname(HIST)]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function httpGetText(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(
        url,
        {
          headers: {
            'User-Agent': 'TeenMotivationBot/2.0 (education; github.com/devmeziem)',
            Accept: 'text/html,application/json,*/*'
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(httpGetText(res.headers.location, timeoutMs));
          }
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', () => resolve(''));
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

/** Live public discovery of teen / youth daily problems */
async function discoverYouthProblems() {
  const queries = [
    'teenagers common daily problems school stress',
    'youth mental health everyday struggles students',
    'teen social media comparison anxiety',
    'high school students sleep homework pressure',
    'young people peer pressure identity struggle'
  ];
  const q = queries[Math.floor(Math.random() * queries.length)];
  console.log('[Teen] Live search:', q);

  let ddg = [];
  try {
    ddg = (await queryDuckDuckGo(q, 6)) || [];
  } catch (e) {
    console.warn('[Teen] DDG notice:', e.message);
  }

  let news = [];
  try {
    news = (await queryGoogleNewsRss('teenagers OR youth stress OR "student anxiety" OR "peer pressure"', 6)) || [];
  } catch (e) {
    console.warn('[Teen] News notice:', e.message);
  }

  // DuckDuckGo HTML fallback
  if (!ddg.length) {
    try {
      const html = await httpGetText('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q));
      const blocks = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) || [];
      for (const b of blocks.slice(0, 5)) {
        const snippet = b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (snippet.length > 40) ddg.push({ title: snippet.slice(0, 90), snippet });
      }
    } catch (_) {}
  }

  const pack = [];
  for (const r of ddg) {
    pack.push({
      source: 'duckduckgo',
      title: String(r.title || '').slice(0, 140),
      snippet: String(r.snippet || r.body || r.title || '').slice(0, 280)
    });
  }
  for (const r of news) {
    pack.push({
      source: 'google_news',
      title: String(r.title || '').slice(0, 140),
      snippet: String(r.snippet || r.title || '').slice(0, 280)
    });
  }

  console.log('[Teen] discovery hits:', pack.length);
  return { query: q, results: pack.slice(0, 10) };
}

/** Try Wikiquote-ish public lines related to courage / discipline / youth (clean only) */
async function fetchFittingPublicQuotes(problemHint) {
  const pages = ['Courage', 'Discipline', 'Education', 'Youth', 'Self-control', 'Work'];
  const page = pages[Math.floor(Math.random() * pages.length)];
  try {
    const url =
      'https://en.wikiquote.org/w/api.php?action=parse&page=' +
      encodeURIComponent(page) +
      '&prop=wikitext&format=json&formatversion=2';
    const raw = await httpGetText(url);
    const j = JSON.parse(raw);
    const wt = (j.parse && j.parse.wikitext) || '';
    const quotes = [];
    const re = /["\u201C]([^"\u201D]{40,180})["\u201D]/g;
    let m;
    while ((m = re.exec(wt)) && quotes.length < 12) {
      let q = m[1]
        .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\{\{[^}]+\}\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (/https?:|interview with|quoted in|isbn/i.test(q)) continue;
      if ((q.match(/\s+/g) || []).length < 5) continue;
      quotes.push({ quote: q, authorPage: page });
    }
    console.log('[Teen] public quotes pool:', quotes.length, 'from', page);
    return quotes;
  } catch (e) {
    console.warn('[Teen] quote fetch:', e.message);
    return [];
  }
}

/**
 * AI package: problem pick + optional quote + TTS scenes + visual/BGM keywords + SEO
 * Must include unique "action > motivation" close every time.
 */
async function buildAiPackage(discovery, quotes, history) {
  const systemPrompt = `You write short-form TikTok/YouTube motivation for teens 14-19.
Return STRICT JSON only. No markdown.

Rules:
- Firm, respectful, never cringe, never preachy, never medical advice.
- Pick ONE real youth problem grounded in the live search snippets.
- Optionally use ONE short public quote if it truly fits; else set quote to null.
- Spoken script total 90-140 words across 4 scenes (hook, truth, action, close).
- The LAST scene MUST teach: motivation alone and watching a video do NOT create physical change — only the viewer's next real-world action does. Phrase it freshly every time, tied to THIS topic (never copy a fixed slogan).
- visualQueries: 4 concrete stock search phrases (people/places/objects matching each scene).
- bgmQuery: 4-7 word instrumental mood search (no lyrics words like "rap vocals").
- title under 70 chars, situation-led.
- description 2-4 lines for YouTube/TikTok + soft CTA.
- hashtags: 8-12 including #MindRush #TeenMotivation #Discipline #FYP #Shorts

JSON schema:
{
  "problem": "one line problem",
  "quote": { "text": "...", "attribution": "..." } | null,
  "title": "...",
  "description": "...",
  "hashtags": ["#..."],
  "bgmQuery": "cinematic hopeful piano ambient youth",
  "scenes": [
    { "role": "hook", "text": "spoken words", "visualQuery": "stock search" },
    { "role": "truth", "text": "...", "visualQuery": "..." },
    { "role": "action", "text": "...", "visualQuery": "..." },
    { "role": "close", "text": "...action over motivation...", "visualQuery": "..." }
  ]
}`;

  const userPrompt = `Live discovery query: ${discovery.query}

Search results:
${discovery.results
  .map((r, i) => `${i + 1}. [${r.source}] ${r.title} — ${r.snippet}`)
  .join('\n') || '(sparse results — invent a realistic common teen problem from general public knowledge)'}

Candidate public quotes (optional):
${quotes.slice(0, 6).map((q, i) => `${i + 1}. "${q.quote}" (${q.authorPage})`).join('\n') || '(none)'}

Avoid repeating these recent hooks/titles:
${(history || [])
  .slice(-15)
  .map((h) => h.title || h.problem || '')
  .filter(Boolean)
  .join(' | ') || 'none'}

Build the package now.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'teen_motivation',
        temperature: 0.7 + attempt * 0.05
      });
      const data = res?.data || res;
      if (data?.scenes?.length >= 4 && data.title && data.scenes.every((s) => s.text && s.visualQuery)) {
        // Guarantee action > motivation language somewhere in close
        const close = data.scenes[data.scenes.length - 1];
        const closeText = String(close.text || '');
        if (!/action|do the|what you do|after (you )?watch|not enough|doesn't change|will not change/i.test(closeText)) {
          close.text =
            closeText.replace(/\.?\s*$/, '') +
            ' Motivation on a screen changes nothing by itself. Only the next action you take after this video counts.';
        }
        if (!data.bgmQuery) data.bgmQuery = 'hopeful cinematic ambient piano soft drums';
        if (!Array.isArray(data.hashtags) || data.hashtags.length < 5) {
          data.hashtags = [
            '#MindRush',
            '#TeenMotivation',
            '#Discipline',
            '#LockIn',
            '#StudentMindset',
            '#FYP',
            '#StudyTok',
            '#Shorts'
          ];
        }
        return data;
      }
    } catch (e) {
      console.warn(`[Teen AI] attempt ${attempt}:`, e.message);
    }
  }
  throw new Error('Teen AI package failed after retries — refusing hardcoded script');
}

function buildCinemaStyleAss(fullText, duration) {
  const words = String(fullText)
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const wordsPerLine = 4;
  const totalMs = Math.round(duration * 1000);
  const msPerWord = words.length > 0 ? totalMs / words.length : 320;

  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return `${hr}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 140));
    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(8, Math.round(msPerWord / 10));
      kLine += `{\kf${wordCs}}${String(w).toUpperCase()} `;
    }
    lines.push(
      `Dialogue: 0,${formatAssTime(chunkStartMs)},${formatAssTime(chunkEndMs)},CenterKaraoke,,0,0,0,,${kLine.trim()}`
    );
  }

  return `[Script Info]
Title: Teen Cinema Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,DejaVu Sans,48,&H00FFFFFF,&H0000D7FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,70,70,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function resolveVisual(query, index) {
  // Prefer short video clip
  try {
    const vid = await searchAndFetchVideo(query, { minDuration: 3, preferredSource: 'pexels' });
    const p = vid && (vid.localPath || vid.path);
    if (p && fs.existsSync(p) && fs.statSync(p).size > 30000) {
      console.log(`[Teen] scene ${index + 1} VIDEO`, path.basename(p), vid.source || '');
      return { type: 'video', path: p };
    }
  } catch (e) {
    console.warn(`[Teen] video s${index + 1}:`, e.message);
  }

  for (const src of ['unsplash', 'pexels', 'pixabay']) {
    try {
      const img = await searchAndFetchImage(query, { preferredSource: src });
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) {
        console.log(`[Teen] scene ${index + 1} IMAGE (${src})`, path.basename(p));
        return { type: 'image', path: p };
      }
    } catch (e) {
      console.warn(`[Teen] image ${src} s${index + 1}:`, e.message);
    }
  }
  throw new Error('No live visual for scene ' + (index + 1) + ' query=' + query);
}

async function resolveBgm(query, durationSec) {
  console.log('[Teen] BGM search:', query);
  try {
    const audio = await searchAndFetchAudio(query, durationSec, 'teen');
    const p = audio && (audio.localPath || audio.path);
    if (p && fs.existsSync(p) && fs.statSync(p).size > 5000) {
      console.log('[Teen] BGM source:', audio.source || 'search', path.basename(p));
      return p;
    }
  } catch (e) {
    console.warn('[Teen] BGM search fail:', e.message);
  }
  // Second attempt softer query
  try {
    const audio = await searchAndFetchAudio('ambient cinematic soft piano hopeful', durationSec, 'teen');
    const p = audio && (audio.localPath || audio.path);
    if (p && fs.existsSync(p) && fs.statSync(p).size > 5000) return p;
  } catch (_) {}
  throw new Error('No live BGM found — refusing hardcoded bed');
}

/** Render one scene with pan/zoom + fade in/out */
function renderSceneClip(visual, durationSec, outMp4, sceneIndex) {
  const fade = Math.min(0.45, durationSec / 6);
  const frames = Math.max(30, Math.ceil(durationSec * 30));
  const zoomExpr =
    sceneIndex % 2 === 0
      ? "min(zoom+0.0016,1.15)"
      : "if(eq(on,1),1.14,max(zoom-0.0013,1.0))";

  if (visual.type === 'video') {
    const vf = [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'setsar=1',
      'fps=30',
      'eq=contrast=1.1:saturation=0.92',
      `fade=t=in:st=0:d=${fade.toFixed(2)}`,
      `fade=t=out:st=${(durationSec - fade).toFixed(2)}:d=${fade.toFixed(2)}`
    ].join(',');
    execSync(
      `ffmpeg -y -stream_loop 3 -t ${durationSec.toFixed(2)} -i "${visual.path}" -an -vf "${vf}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  } else {
    const vf = [
      'scale=1200:2133:force_original_aspect_ratio=increase',
      'crop=1200:2133',
      `zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
      'eq=contrast=1.12:saturation=0.88',
      `fade=t=in:st=0:d=${fade.toFixed(2)}`,
      `fade=t=out:st=${(durationSec - fade).toFixed(2)}:d=${fade.toFixed(2)}`
    ].join(',');
    execSync(
      `ffmpeg -y -loop 1 -t ${durationSec.toFixed(2)} -i "${visual.path}" -vf "${vf}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  }
  if (!fs.existsSync(outMp4) || fs.statSync(outMp4).size < 20000) {
    throw new Error('scene render failed ' + outMp4);
  }
}

async function main() {
  ensureDirs();
  console.log('\n=== TEEN LIVE GLOBAL PIPELINE ===');
  console.log('discovery → quote → AI script/keywords → live media/BGM → fade/pan stitch\n');

  const history = loadHistory(HIST);
  const discovery = await discoverYouthProblems();
  const quotes = await fetchFittingPublicQuotes(
    (discovery.results[0] && discovery.results[0].title) || 'discipline'
  );

  const pack = await buildAiPackage(discovery, quotes, history);
  if (isDuplicate({ title: pack.title, hook: pack.problem }, history, { overlapMax: 0.42 })) {
    console.warn('[Teen] near-duplicate title vs history — continuing with AI package (AI already saw history)');
  }

  console.log('[Teen] problem:', pack.problem);
  console.log('[Teen] title:', pack.title);
  if (pack.quote && pack.quote.text) {
    console.log('[Teen] quote:', pack.quote.text.slice(0, 80), '—', pack.quote.attribution || '');
  }

  // Spoken: optional quote lead-in + scene texts
  const spokenParts = [];
  if (pack.quote && pack.quote.text) {
    spokenParts.push(String(pack.quote.text).trim());
    if (pack.quote.attribution) spokenParts.push(String(pack.quote.attribution).trim());
  }
  for (const s of pack.scenes) spokenParts.push(String(s.text).trim());
  const spoken = spokenParts.join(' ');

  const voicePath = path.join(ART, `voice_${Date.now()}.mp3`);
  console.log('[Teen] bold TTS', VOICE.id, VOICE.rate, VOICE.pitch);
  await synthesizeSpeechResilient(spoken, voicePath, {
    voice: VOICE.id,
    rate: VOICE.rate,
    pitch: VOICE.pitch
  });

  let voiceDur = 24;
  try {
    voiceDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  const totalDuration = Math.max(22, Math.min(55, voiceDur + 0.35));
  const sceneCount = pack.scenes.length;
  const secPerScene = totalDuration / sceneCount;
  console.log(`[Teen] voice=${voiceDur.toFixed(1)}s total=${totalDuration.toFixed(1)}s scenes=${sceneCount}`);

  const bgmPath = await resolveBgm(pack.bgmQuery, totalDuration);

  const assPath = path.join(ART, `cap_${Date.now()}.ass`);
  fs.writeFileSync(assPath, buildCinemaStyleAss(spoken, totalDuration));
  console.log('[Teen] captions: cinema CenterKaraoke');

  const sceneMp4s = [];
  for (let i = 0; i < sceneCount; i++) {
    const sc = pack.scenes[i];
    console.log(`[Teen] Scene ${i + 1}/${sceneCount} (${sc.role}) visual="${sc.visualQuery}"`);
    const visual = await resolveVisual(sc.visualQuery, i);
    const sceneMp4 = path.join(ART, `scene_${i}_${Date.now()}.mp4`);
    renderSceneClip(visual, secPerScene, sceneMp4, i);
    sceneMp4s.push(sceneMp4);
    console.log(`[Teen] Scene ${i + 1} ok`, (fs.statSync(sceneMp4).size / 1024).toFixed(0) + 'KB');
  }

  const concatList = path.join(ART, 'scenes.txt');
  fs.writeFileSync(
    concatList,
    sceneMp4s.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  );
  const concatRaw = path.join(ART, `concat_${Date.now()}.mp4`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "${concatRaw}"`,
    { stdio: 'pipe' }
  );

  const outPath = path.join(OUT, 'teen_motivation_latest.mp4');
  const assEsc = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const filter = [
    `[0:v]ass='${assEsc}'[vout]`,
    `[1:a]volume=${VOICE_VOL.toFixed(2)},acompressor=threshold=-18dB:ratio=2.2:attack=8:release=100[a0]`,
    `[2:a]volume=${BGM_VOL.toFixed(2)},afade=t=in:st=0:d=1.2,afade=t=out:st=${(totalDuration - 1.5).toFixed(2)}:d=1.5,atrim=0:${totalDuration.toFixed(2)}[a1]`,
    `[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`
  ].join(';');

  execSync(
    `ffmpeg -y -i "${concatRaw}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k -t ${totalDuration.toFixed(2)} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );

  const sz = fs.statSync(outPath).size;
  if (sz < 280000) throw new Error('HOLLOW FAIL output small ' + sz);
  console.log('[Teen] OK', outPath, (sz / 1024).toFixed(0) + 'KB');

  // Persist SEO + history for publisher / next dedup
  const meta = {
    title: pack.title,
    description:
      String(pack.description || '') +
      '\n\n' +
      (pack.hashtags || []).join(' '),
    hashtags: pack.hashtags,
    problem: pack.problem,
    quote: pack.quote || null,
    bgmQuery: pack.bgmQuery,
    discoveryQuery: discovery.query,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(ART, 'latest_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(OUT, 'teen_motivation_meta.json'), JSON.stringify(meta, null, 2));

  history.push({ title: pack.title, problem: pack.problem, at: meta.createdAt });
  saveHistory(HIST, history);

  // Optional YouTube if credentials present
  if (!isDry && process.env.YOUTUBE_REFRESH_TOKEN) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title: pack.title.slice(0, 95),
        description: meta.description,
        tags: (pack.hashtags || []).map((h) => h.replace(/^#/, '')),
        channelId: 'teen_motivation'
      });
    } catch (e) {
      console.warn('[Teen] YouTube:', e.message);
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
          TEEN_POST_TITLE: pack.title,
          TEEN_POST_DESCRIPTION: meta.description
        }
      });
    } catch (e) {
      console.warn('[Teen] Buffer', e.message);
    }
  } else {
    console.log('[Teen] publish deferred / dry');
  }

  console.log('[Teen] title:', pack.title);
  console.log('[Teen] hashtags:', (pack.hashtags || []).join(' '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
