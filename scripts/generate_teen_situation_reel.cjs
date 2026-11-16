#!/usr/bin/env node
/**
 * Teen Motivation — LIVE ONLY (no lesson bank, no script seeds)
 * 1) Live search youth problems (DDG / news)
 * 2) AI writes unique script from that problem (fail if AI fails — no hardcoded script)
 * 3) Fresh visual queries every scene; ban recently used query strings
 * 4) Rotate media sources + random page so the same car/street clip cannot dominate
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson, queryDuckDuckGo, queryGoogleNewsRss } = require('./topic_discovery_engine.cjs');
const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const HIST = path.join(process.cwd(), 'data', 'teen_topic_history.json');
const VISUAL_HIST = path.join(process.cwd(), 'data', 'teen_visual_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

function ensureDirs() {
  for (const d of [OUT, ART, path.dirname(HIST)]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function loadJson(p, fallback) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  return fallback;
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function httpGetText(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(
        url,
        {
          headers: {
            'User-Agent': 'MindRushBot/3.0 (education)',
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

async function discoverYouthProblems(history) {
  const queries = [
    'teenagers school stress burnout 2025 2026',
    'youth social media comparison anxiety students',
    'high school sleep homework pressure',
    'teen peer pressure identity friendship',
    'students procrastination exam fear',
    'young people first job money stress',
    'teen self doubt sports academics',
    'adolescent loneliness friendship drift',
    'student phone addiction focus',
    'teenagers family expectations pressure'
  ];
  // Prefer a query not recently used
  const recentQ = new Set((history || []).map((h) => h.searchQuery).filter(Boolean));
  const pool = queries.filter((q) => !recentQ.has(q));
  const q = (pool.length ? pool : queries)[Math.floor(Math.random() * (pool.length || queries.length))];
  console.log('[Teen] live search:', q);

  let ddg = [];
  try {
    ddg = (await queryDuckDuckGo(q, 8)) || [];
  } catch (e) {
    console.warn('[Teen] DDG:', e.message);
  }
  let news = [];
  try {
    news = (await queryGoogleNewsRss('teenagers OR youth OR students stress OR anxiety OR pressure', 8)) || [];
  } catch (e) {
    console.warn('[Teen] news:', e.message);
  }
  if (!ddg.length) {
    try {
      const html = await httpGetText('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q));
      const blocks = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) || [];
      for (const b of blocks.slice(0, 6)) {
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
  return { query: q, results: pack.slice(0, 12) };
}

async function buildAiPackage(discovery, history, bannedVisuals) {
  const recentTitles = (history || [])
    .slice(-25)
    .map((h) => h.title || h.problem || '')
    .filter(Boolean);
  const recentProblems = (history || [])
    .slice(-25)
    .map((h) => h.problem || '')
    .filter(Boolean);

  const systemPrompt = `You write short-form TikTok motivation for teens 14-19.
Return STRICT JSON only. No markdown.

Rules:
- Ground the script in ONE real problem from the live search results (or a clearly common youth problem if results are thin).
- NEVER reuse these recent titles: ${recentTitles.join(' | ') || 'none'}
- NEVER reuse these recent problems: ${recentProblems.join(' | ') || 'none'}
- 95-120 spoken words across exactly 5 scenes.
- Firm, respectful, not cringe, not medical advice. No "take action now", no "stop scrolling".
- Each scene visualQuery must be UNIQUE and CONCRETE (different subjects). Ban these visual phrases if they appear: ${bannedVisuals.slice(-40).join(' | ') || 'none'}
- Prefer varied real-world teen visuals: classroom, notebook, bus window, sports field, kitchen table, rainy window, library aisle, phone screen glow, empty hallway, sunrise commute — NOT the same vintage car street every time.
- Optional one-line historical or cultural flavor is fine; do NOT force Popeye/Felix/cartoon framing every episode.
- bgmQuery: soft instrumental, no drums/lyrics.
- title under 70 chars, unique.
- description 2 lines + soft Mind Rush CTA.
- hashtags include #MindRush #TeenMotivation #FYP #Shorts

JSON:
{
  "problem": "one line",
  "title": "...",
  "description": "...",
  "hashtags": ["#MindRush", "#TeenMotivation", "#FYP", "#Shorts"],
  "bgmQuery": "soft piano ambient hopeful sparse no drums",
  "scenes": [
    { "role": "hook", "text": "...", "visualQuery": "unique stock search" },
    { "role": "tension", "text": "...", "visualQuery": "..." },
    { "role": "truth", "text": "...", "visualQuery": "..." },
    { "role": "apply", "text": "...", "visualQuery": "..." },
    { "role": "close", "text": "...", "visualQuery": "..." }
  ]
}`;

  const userPrompt = `Live discovery query: ${discovery.query}

Search results:
${discovery.results.map((r, i) => `${i + 1}. [${r.source}] ${r.title} — ${r.snippet}`).join('\n') || '(sparse — pick a realistic common teen problem)'}

Nonce for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2, 8)}
Build a fresh package now.`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'teen_motivation',
        temperature: 0.78 + attempt * 0.04
      });
      const data = res?.data || res;
      if (data?.scenes?.length >= 5 && data.title && data.scenes.every((s) => s.text && s.visualQuery)) {
        data.scenes = data.scenes.slice(0, 5);
        // Reject if title collides hard
        const tLow = String(data.title).toLowerCase();
        if (recentTitles.some((rt) => rt.toLowerCase() === tLow || (rt.length > 12 && tLow.includes(rt.toLowerCase().slice(0, 18))))) {
          console.warn('[Teen] AI title collided with history — retry');
          continue;
        }
        // Diversify visual queries if AI reused banned ones
        const diversifiers = [
          'classroom empty desks morning light',
          'teenager notebook handwriting close up',
          'city bus window rain reflection',
          'sports field evening practice',
          'library aisle books soft light',
          'kitchen table homework lamp',
          'phone screen glow dark room',
          'school hallway lockers',
          'sunrise commute street empty',
          'park bench backpack afternoon'
        ];
        data.scenes.forEach((s, i) => {
          const v = String(s.visualQuery || '').toLowerCase();
          const banned = bannedVisuals.some((b) => v.includes(String(b).toLowerCase().slice(0, 24)));
          const sameAsPrev = data.scenes.slice(0, i).some((p) => String(p.visualQuery).toLowerCase() === v);
          if (banned || sameAsPrev || v.length < 10) {
            s.visualQuery = diversifiers[(i + Date.now()) % diversifiers.length] + ' candid documentary';
          }
        });
        if (!data.bgmQuery || /drum|beat|phonk|trap/i.test(data.bgmQuery)) {
          data.bgmQuery = 'soft piano ambient hopeful sparse no drums';
        }
        return data;
      }
    } catch (e) {
      console.warn(`[Teen AI] attempt ${attempt}:`, e.message);
    }
  }
  throw new Error('Teen AI failed — refusing seeded script fallback');
}

function buildAss(fullText, duration) {
  const words = String(fullText).replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
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
Title: Teen Live Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Arial Black,52,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.5,0,1,3.2,0,5,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function resolveVisual(query, index, usedPaths) {
  const sources = ['pexels', 'pixabay', 'unsplash', 'wikimedia'];
  // rotate preferred source by scene + time
  const rot = (index + Math.floor(Date.now() / 60000)) % sources.length;
  const ordered = sources.slice(rot).concat(sources.slice(0, rot));

  // Try video first on alternate scenes
  if (index % 2 === 0) {
    for (const src of ordered) {
      try {
        const vid = await searchAndFetchVideo(query, {
          minDuration: 3,
          preferredSource: src,
          page: 1 + ((index + Date.now()) % 3)
        });
        const p = vid && (vid.localPath || vid.path);
        if (p && fs.existsSync(p) && fs.statSync(p).size > 30000 && !usedPaths.has(p)) {
          usedPaths.add(p);
          console.log(`[Teen] scene ${index + 1} VIDEO ${src}`, path.basename(p));
          return { type: 'video', path: p };
        }
      } catch (_) {}
    }
  }

  for (const src of ordered) {
    try {
      const img = await searchAndFetchImage(query, {
        preferredSource: src,
        page: 1 + ((index * 2 + Date.now()) % 4)
      });
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000 && !usedPaths.has(p)) {
        usedPaths.add(p);
        console.log(`[Teen] scene ${index + 1} IMAGE ${src}`, path.basename(p));
        return { type: 'image', path: p };
      }
    } catch (_) {}
  }

  // Last resort: different solid colors per scene (never reuse one stock fallback clip)
  const colors = ['0x0f172a', '0x1e293b', '0x111827', '0x1a1a2e', '0x16213e'];
  const fallback = path.join(ART, `fb_${index}_${Date.now()}.png`);
  execSync(
    `ffmpeg -y -f lavfi -i color=c=${colors[index % colors.length]}:s=1080x1920:d=1 -frames:v 1 "${fallback}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
  usedPaths.add(fallback);
  return { type: 'image', path: fallback };
}

function renderScene(visual, durationSec, outMp4, sceneIndex) {
  const frames = Math.max(30, Math.ceil(durationSec * 30));
  const zoom =
    sceneIndex % 2 === 0
      ? "min(zoom+0.0015,1.12)"
      : "if(eq(on,1),1.12,max(zoom-0.0012,1.0))";
  // Rotate look: not always B&W
  const looks = [
    'eq=contrast=1.12:saturation=0.9',
    'hue=s=0,eq=contrast=1.15:brightness=0.02',
    'eq=contrast=1.08:saturation=1.05:brightness=0.01',
    'eq=contrast=1.1:saturation=0.75'
  ];
  const look = looks[sceneIndex % looks.length];
  if (visual.type === 'video') {
    execSync(
      `ffmpeg -y -stream_loop 2 -t ${durationSec.toFixed(2)} -i "${visual.path}" -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,${look}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  } else {
    execSync(
      `ffmpeg -y -loop 1 -t ${durationSec.toFixed(2)} -i "${visual.path}" -vf "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,${look}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  }
}

function softPiano(outWav, duration) {
  const d = duration.toFixed(2);
  const filter = `aevalsrc='0.035*sin(2*PI*130.81*t)+0.03*sin(2*PI*164.81*t)+0.025*sin(2*PI*196*t)':s=44100:d=${d}[p]; anoisesrc=d=${d}:c=pink:a=0.006[n]; [p][n]amix=inputs=2,lowpass=f=850,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(2)}:d=1.5[out]`;
  execSync(
    `ffmpeg -y -f lavfi -i "${filter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${d} "${outWav}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
}

async function main() {
  ensureDirs();
  console.log('\n=== TEEN LIVE (no seed bank) ===');
  const history = loadJson(HIST, []);
  const visualHist = loadJson(VISUAL_HIST, []);
  const bannedVisuals = visualHist.slice(-60);

  const discovery = await discoverYouthProblems(history);
  const pack = await buildAiPackage(discovery, history, bannedVisuals);

  console.log('[Teen] problem:', pack.problem);
  console.log('[Teen] title:', pack.title);

  const spoken = pack.scenes.map((s) => s.text).join(' ');
  const voicePath = path.join(ART, `voice_${Date.now()}.mp3`);
  await synthesizeSpeechResilient(spoken, voicePath, {
    voice: process.env.TEEN_VOICE || 'en-US-AndrewNeural',
    rate: process.env.TEEN_RATE || '-8%',
    pitch: process.env.TEEN_PITCH || '-18Hz',
    emotionProfile: 'motivation'
  });

  let voiceDur = 36;
  try {
    voiceDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  const totalDuration = Math.min(Math.max(voiceDur + 0.5, 32), 42);
  const sceneCount = 5;
  const secPer = totalDuration / sceneCount;

  let bgmPath = null;
  try {
    const a = await searchAndFetchAudio(pack.bgmQuery, totalDuration, 'teen');
    if (a?.localPath && fs.existsSync(a.localPath)) bgmPath = a.localPath;
  } catch (_) {}
  if (!bgmPath) {
    bgmPath = path.join(ART, `bgm_${Date.now()}.wav`);
    softPiano(bgmPath, totalDuration);
  }

  const assPath = path.join(ART, `cap_${Date.now()}.ass`);
  fs.writeFileSync(assPath, buildAss(spoken, totalDuration));

  const usedPaths = new Set();
  const clips = [];
  const usedQueries = [];
  for (let i = 0; i < sceneCount; i++) {
    const sc = pack.scenes[i];
    console.log(`[Teen] scene ${i + 1}: ${sc.visualQuery}`);
    usedQueries.push(sc.visualQuery);
    const visual = await resolveVisual(sc.visualQuery, i, usedPaths);
    const out = path.join(ART, `sc_${i}_${Date.now()}.mp4`);
    renderScene(visual, secPer, out, i);
    clips.push(out);
  }

  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(list, clips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const silent = path.join(ART, 'silent.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${list}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 "${silent}"`,
    { stdio: 'pipe' }
  );

  const finalMp4 = path.join(OUT, 'teen_motivation_latest.mp4');
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  const filter = `[1:a]volume=1.5[vo];[2:a]volume=0.32,afade=t=in:st=0:d=0.8,afade=t=out:st=${(totalDuration - 1.2).toFixed(2)}:d=1.0[bg];[vo][bg]amix=inputs=2:duration=longest[a];[0:v]subtitles='${escapedAss}'[v]`;
  execSync(
    `ffmpeg -y -i "${silent}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -t ${totalDuration.toFixed(2)} "${finalMp4}"`,
    { stdio: 'pipe' }
  );

  const meta = {
    title: pack.title,
    description: pack.description,
    hashtags: pack.hashtags,
    problem: pack.problem,
    searchQuery: discovery.query,
    duration: totalDuration,
    mode: 'live_no_seed'
  };
  fs.writeFileSync(path.join(OUT, 'teen_motivation_meta.json'), JSON.stringify(meta, null, 2));

  history.push({
    title: pack.title,
    problem: pack.problem,
    searchQuery: discovery.query,
    at: new Date().toISOString()
  });
  saveJson(HIST, history.slice(-100));

  const nextVis = visualHist.concat(usedQueries).slice(-120);
  saveJson(VISUAL_HIST, nextVis);

  console.log(`[Teen] done "${pack.title}" ${totalDuration.toFixed(1)}s LIVE`);
  if (isDry) console.log('[Teen] dry run — no publish');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
