#!/usr/bin/env node
/**
 * Archie LIVE — science + tech explainer shorts
 * Hook → one fact → takeaway | short B-roll | full-VO lipsync | bold outline captions (no black box)
 * YouTube CH3 + Buffer FB/IG handled by workflow
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const { EdgeTTS } = require('node-edge-tts');
const { callActiveAiForJson, queryDuckDuckGo, discoverAndSelectTopicViaActiveAi, saveChosenTopicToDatabase } = require('./topic_discovery_engine.cjs');
const { searchAndFetchImage, searchAndFetchVideo } = require('./universal_media_fetcher.cjs');
const { fetchUniqueBgm } = require('./unique_bgm_engine.cjs');

const ARTIFACTS = path.join(process.cwd(), 'test_artifacts', 'archie_live');
const RENDERED = path.join(process.cwd(), 'rendered_videos');
const HIST = path.join(process.cwd(), 'data', 'archie_topic_history.json');
const PUPPET = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
for (const d of [ARTIFACTS, RENDERED, path.dirname(HIST)]) fs.mkdirSync(d, { recursive: true });

const TOPIC_BANK = [
  // science
  { title: 'why ice is slippery', lane: 'science' },
  { title: 'why onions make you cry', lane: 'science' },
  { title: 'how microwave ovens heat food', lane: 'science' },
  { title: 'why the sky is blue', lane: 'science' },
  { title: 'how soap cleans grease', lane: 'science' },
  { title: 'why batteries die', lane: 'science' },
  { title: 'why phone screens crack from corners', lane: 'science' },
  // tech
  { title: 'why phones get hot while charging', lane: 'tech' },
  { title: 'how WiFi reaches through walls', lane: 'tech' },
  { title: 'why SSD storage is faster than hard drives', lane: 'tech' },
  { title: 'how noise cancellation headphones work', lane: 'tech' },
  { title: 'why dark mode saves battery on OLED', lane: 'tech' },
  { title: 'how QR codes store data', lane: 'tech' },
  { title: 'why airplane mode exists', lane: 'tech' },
  { title: 'how Bluetooth pairs devices', lane: 'tech' },
  { title: 'why software updates fix security holes', lane: 'tech' }
];

function loadHist() {
  try {
    const j = JSON.parse(fs.readFileSync(HIST, 'utf8'));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
function saveHist(entry) {
  const h = loadHist();
  h.push({ ...entry, at: new Date().toISOString() });
  fs.writeFileSync(HIST, JSON.stringify(h.slice(-180), null, 2));
}
function isDup(title, hist) {
  const n = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!n) return true;
  for (const h of hist.slice(-50)) {
    const p = String(h.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (p === n) return true;
    const A = new Set(n.split(' ').filter((w) => w.length > 3));
    const B = new Set(p.split(' ').filter((w) => w.length > 3));
    let hit = 0;
    for (const w of A) if (B.has(w)) hit++;
    if (A.size && hit / Math.max(A.size, B.size) >= 0.5) return true;
  }
  return false;
}
function httpGet(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieBot/5.0' }, timeout: timeoutMs }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(httpGet(res.headers.location, timeoutMs));
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      });
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
async function wikiExtract(title) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=0&explaintext=1&titles=' +
    encodeURIComponent(title) +
    '&format=json&utf8=1';
  try {
    const j = JSON.parse(await httpGet(url));
    const page = Object.values(j?.query?.pages || {})[0];
    if (!page || page.missing) return null;
    const extract = String(page.extract || '').trim();
    if (extract.length < 100) return null;
    return { title: page.title, extract: extract.slice(0, 3200) };
  } catch {
    return null;
  }
}
async function findRealLifeExample(topicTitle) {
  const q = `${topicTitle} real life example OR explained simply OR everyday`;
  let hits = [];
  try {
    hits = (await queryDuckDuckGo(q, 6)) || [];
  } catch (_) {}
  return hits
    .map((h) => ({ title: h.title || '', snippet: String(h.snippet || h.body || '').slice(0, 280) }))
    .filter((h) => h.snippet.length > 40);
}
async function enrichTopic(topicTitle) {
  const notes = [];
  const wiki = await wikiExtract(topicTitle);
  if (wiki) notes.push({ source: 'wikipedia', title: wiki.title, text: wiki.extract });
  try {
    const ddg = (await queryDuckDuckGo(topicTitle + ' how it works explained', 5)) || [];
    for (const r of ddg) notes.push({ source: 'duckduckgo', title: r.title, text: r.snippet || r.body || '' });
  } catch (_) {}
  return { wiki, notes };
}
async function pickTopic(hist) {
  if (process.env.TEST_TOPIC) return { title: process.env.TEST_TOPIC, lane: 'mixed', category: 'ScienceTech' };
  // Prefer bank rotation (controlled quality)
  const shuffled = [...TOPIC_BANK].sort(() => Math.random() - 0.5);
  for (const t of shuffled) {
    if (!isDup(t.title, hist)) return { title: t.title, lane: t.lane, category: t.lane === 'tech' ? 'Tech' : 'Science' };
  }
  for (let i = 0; i < 3; i++) {
    try {
      const discovery = await discoverAndSelectTopicViaActiveAi('cartoon');
      const t = discovery?.chosenTopic;
      if (t?.title && !isDup(t.title, hist)) return { ...t, lane: 'mixed' };
    } catch (e) {
      console.warn('[Archie] AI topic', e.message);
    }
  }
  throw new Error('Archie: no unique topic');
}

function defaultHashtags(lane) {
  const base = ['#ArchieExplains', '#Shorts', '#LearnOnYouTube', '#DidYouKnow', '#FYP'];
  if (lane === 'tech') return ['#TechExplained', '#TechTok', '#HowItWorks', ...base];
  if (lane === 'science') return ['#ScienceFacts', '#ScienceTok', '#HowItWorks', ...base];
  return ['#ScienceFacts', '#TechExplained', '#HowItWorks', ...base];
}

async function buildScript(topic, example, enrich) {
  const lane = topic.lane || 'mixed';
  const system = `You are Archie, animated science AND tech explainer for teens.
Return STRICT JSON only.
spokenScript 95-130 words:
1) HOOK (1 sentence) curiosity gap using the real example.
2) TEACH (2-4 sentences) simple cause→effect a 14-year-old gets.
3) TAKEAWAY (1 sentence) the one fact to remember.
4) Soft CTA half-sentence — no comment bait, no "comment below".
learningObjective: short phrase.
No quiz multi-questions. One fact only.
JSON: title, description, spokenScript, learningObjective, visualKeywords (3-5), bgmQuery, studio ("black"|"white"), hashtags, lane.`;
  const user = `LANE: ${lane}
TOPIC: ${topic.title}
EXAMPLE: ${example.title}: ${example.snippet}
RESEARCH:
${enrich.notes
    .slice(0, 6)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${String(n.text).slice(0, 280)}`)
    .join('\n')}`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await callActiveAiForJson(system, user, null, { nicheKey: 'cartoon', temperature: 0.55 + a * 0.05 });
      const d = res?.data || res;
      if (d?.spokenScript && d?.title) {
        d.lane = d.lane || lane;
        d.hashtags = Array.isArray(d.hashtags) && d.hashtags.length ? d.hashtags : defaultHashtags(d.lane);
        // strip comment-bait from description
        d.description = String(d.description || '')
          .split('\n')
          .filter((l) => !/comment below|drop your|leave a comment|what should i cover/i.test(l))
          .join('\n');
        if (!d.description.includes('#')) d.description += '\n\n' + d.hashtags.join(' ');
        if (!d.learningObjective) d.learningObjective = `Understand ${topic.title}`;
        return d;
      }
    } catch (e) {
      console.warn('[Archie AI]', e.message);
    }
  }
  const tags = defaultHashtags(lane);
  const teach = String(enrich.wiki?.extract || example.snippet).slice(0, 300);
  return {
    title: `${lane === 'tech' ? 'Tech' : 'Science'}: ${String(topic.title).slice(0, 55)}`,
    learningObjective: `Understand ${topic.title}`,
    description: `Archie explains ${topic.title} in under a minute.\nReal-world example included.\n\n${tags.join(' ')}`,
    spokenScript: `Did you know this about ${topic.title}? Real example: ${example.snippet.slice(0, 90)}. ${teach} Takeaway: once you see how ${topic.title} works, you notice it everywhere. Save this if it helped.`,
    visualKeywords: [topic.title, lane === 'tech' ? 'smartphone technology close up' : 'science experiment', example.title].slice(0, 3),
    bgmQuery: lane === 'tech' ? 'soft tech ambient pulse' : 'curious science underscore',
    studio: Math.random() > 0.5 ? 'black' : 'white',
    hashtags: tags,
    lane
  };
}

function studioSvg(mode, w = 1080, h = 1920) {
  if (mode === 'black') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a0a0f"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
}

/** Cinema-style center captions: bold white + bright outline, NO black box (BorderStyle 1 outline only) */
function buildAssCaptions(text, durationSec) {
  const words = String(text).replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
  const totalMs = Math.max(1000, Math.round(durationSec * 1000));
  const msPer = words.length ? totalMs / words.length : 300;
  const fmt = (ms) => {
    const cs = Math.floor((ms % 1000) / 10);
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const lines = [];
  const chunk = 3;
  for (let i = 0; i < words.length; i += chunk) {
    const slice = words.slice(i, i + chunk);
    const t0 = Math.round(i * msPer);
    const t1 = Math.round(Math.min(totalMs, (i + slice.length) * msPer));
    // \bord4 + yellow-cyan friendly outline; Primary white; no opaque box
    lines.push(
      `Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,{\bord4\shad0\fsp1}${slice.join(' ')}`
    );
  }
  // PrimaryColour white, OutlineColour cyan-ish (visible on light & dark), BorderStyle 1 = outline only
  return `[Script Info]
Title: Archie Bold Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,72,&H00FFFFFF,&H000000FF,&H0000F0FF,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,5,50,50,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function ttsToWav(text, outWav) {
  const voice = process.env.ARCHIE_VOICE || 'en-US-AndrewNeural';
  const mp3 = outWav.replace(/\.wav$/i, '.mp3');
  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = new EdgeTTS({
        voice,
        lang: 'en-US',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        rate: '-3%',
        pitch: '-5Hz'
      });
      await tts.ttsPromise(text, mp3);
      if (fs.existsSync(mp3) && fs.statSync(mp3).size > 1000) {
        execSync(`ffmpeg -y -i "${mp3}" -ar 44100 -ac 2 "${outWav}" 2>/dev/null`);
        return outWav;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`[Archie TTS] attempt ${attempt}:`, e.message);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr || new Error('Edge TTS failed');
}
function durOf(file) {
  try {
    return Math.max(3, parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`, { encoding: 'utf8' })) || 20);
  } catch {
    return 20;
  }
}
function puppet(name) {
  const p = path.join(PUPPET, name);
  return fs.existsSync(p) ? p : null;
}
function runFfmpeg(cmd, label) {
  const log = path.join(ARTIFACTS, `ff_${label}.log`);
  try {
    execSync(cmd + ` 2>"${log}"`, { stdio: 'pipe' });
  } catch (e) {
    let err = e.message;
    try {
      err = fs.readFileSync(log, 'utf8').slice(-900);
    } catch (_) {}
    throw new Error(`${label}: ${err}`);
  }
}

async function renderArchieHeavy({ script, voiceWav, brollPath, bgmPath }) {
  const voiceDur = durOf(voiceWav);
  const total = voiceDur + 0.6;
  const fps = 30;
  const frames = Math.ceil(total * fps);
  const studioMode = script.studio === 'black' ? 'black' : 'white';
  const bgSvg = path.join(ARTIFACTS, 'studio.svg');
  const bgPng = path.join(ARTIFACTS, 'studio.png');
  fs.writeFileSync(bgSvg, studioSvg(studioMode));
  runFfmpeg(`ffmpeg -y -i "${bgSvg}" "${bgPng}"`, 'studio_png');

  const idle = puppet('puppet_idle.png') || puppet('puppet_talking.png');
  const talk = puppet('puppet_talking.png') || idle;
  const talk2 = puppet('puppet_explain_both_talk.png') || puppet('puppet_open_palms_talk.png') || talk;
  const point = puppet('puppet_point_camera.png') || puppet('puppet_point_up_right.png') || idle;
  const open = puppet('puppet_open_palms.png') || idle;
  if (!idle) throw new Error('No puppet assets');

  const mixed = path.join(ARTIFACTS, `mix_${Date.now()}.wav`);
  if (!bgmPath || !fs.existsSync(bgmPath)) throw new Error('Archie requires unique BGM');
  runFfmpeg(
    `ffmpeg -y -i "${voiceWav}" -stream_loop -1 -i "${bgmPath}" -filter_complex "[0:a]volume=1.55[v];[1:a]volume=0.95,atrim=0:${total.toFixed(2)},afade=t=in:d=0.35,afade=t=out:st=${Math.max(0.3, total - 0.8).toFixed(2)}:d=0.6[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[a]" -t ${total.toFixed(2)} "${mixed}"`,
    'mix_audio'
  );

  // SHORT B-roll: max ~4.5s, mid video only
  const brollMax = Math.min(4.5, parseFloat(process.env.BROLL_MAX_SEC || '4.5') || 4.5);
  const brollStart = Math.max(2.0, voiceDur * 0.32);
  const brollEnd = Math.min(voiceDur - 1.0, brollStart + brollMax);

  // Gesture phases tied to VO
  const g1 = Math.max(1.8, voiceDur * 0.18); // hook: point + lipsync
  const g2 = Math.max(g1 + 2, voiceDur * 0.55); // teach: talk flip
  // rest: open + lipsync until VO ends, then idle

  const baseMp4 = path.join(ARTIFACTS, 'pass_base.mp4');
  runFfmpeg(
    `ffmpeg -y -loop 1 -t ${total.toFixed(2)} -i "${bgPng}" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "[0:v]scale=1080:1920,zoompan=z='min(1.0+0.00003*on,1.04)':d=${frames}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*0.35':s=1080x1920:fps=${fps},format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} "${baseMp4}"`,
    'pass_base'
  );

  let sceneMp4 = baseMp4;
  if (brollPath && fs.existsSync(brollPath) && brollEnd > brollStart + 1.2) {
    const withBroll = path.join(ARTIFACTS, 'pass_broll.mp4');
    const isVid = /\.(mp4|mov|webm)$/i.test(brollPath);
    const bIn = isVid ? `-stream_loop -1 -i "${brollPath}"` : `-loop 1 -t ${total.toFixed(2)} -i "${brollPath}"`;
    runFfmpeg(
      `ffmpeg -y -i "${baseMp4}" ${bIn} -filter_complex "[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${(brollMax - 0.3).toFixed(2)}:d=0.25[br];[0:v][br]overlay=0:0:enable='between(t,${brollStart.toFixed(2)},${brollEnd.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${withBroll}"`,
      'pass_broll'
    );
    sceneMp4 = withBroll;
  }

  // Lipsync entire speaking window + body phase changes
  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');
  const gestCmd = `ffmpeg -y -i "${sceneMp4}" -loop 1 -t ${total.toFixed(2)} -i "${point}" -loop 1 -t ${total.toFixed(2)} -i "${talk}" -loop 1 -t ${total.toFixed(2)} -i "${talk2}" -loop 1 -t ${total.toFixed(2)} -i "${open}" -loop 1 -t ${total.toFixed(2)} -i "${idle}" -filter_complex "[1:v]scale=-1:1100,format=rgba[point];[2:v]scale=-1:1100,format=rgba[talk];[3:v]scale=-1:1100,format=rgba[talk2];[4:v]scale=-1:1100,format=rgba[open];[5:v]scale=-1:1100,format=rgba[idle];[0:v][point]overlay=x=(W-w)/2:y=H-h-40:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*6),2),0)'[a];[a][talk]overlay=x=(W-w)/2:y=H-h-40:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*6),2),1)'[b];[b][talk]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*7),2),0)'[c];[c][talk2]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*7),2),1)'[d];[d][open]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*6),2),0)'[e];[e][talk]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*6),2),1)'[f];[f][idle]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${voiceDur.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${gestMp4}"`;
  runFfmpeg(gestCmd, 'pass_gestures');

  const assPath = path.join(ARTIFACTS, 'archie_caps.ass');
  fs.writeFileSync(assPath, buildAssCaptions(script.spokenScript, voiceDur));
  const assEsc = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const capMp4 = path.join(ARTIFACTS, 'pass_caps.mp4');
  runFfmpeg(
    `ffmpeg -y -i "${gestMp4}" -vf "ass='${assEsc}'" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${capMp4}"`,
    'pass_captions'
  );

  const out = path.join(RENDERED, `archie_live_${Date.now()}.mp4`);
  const latest = path.join(RENDERED, 'archie_latest.mp4');
  runFfmpeg(
    `ffmpeg -y -i "${capMp4}" -i "${mixed}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -t ${total.toFixed(2)} "${out}"`,
    'pass_mux'
  );

  if (!fs.existsSync(out) || fs.statSync(out).size < 20000) throw new Error('Archie heavy render empty');
  fs.copyFileSync(out, latest);
  fs.copyFileSync(out, path.join(RENDERED, 'archie_tech_fact_latest.mp4'));
  console.log(
    '[Archie] OK',
    (fs.statSync(out).size / 1024 / 1024).toFixed(2),
    'MB |',
    script.lane || 'mixed',
    '| learn:',
    script.learningObjective,
    `| broll ${brollStart.toFixed(1)}-${brollEnd.toFixed(1)}s (max ${brollMax}s)`
  );
  return { out, latest, total };
}

async function main() {
  console.log('\n=== ARCHIE SCIENCE+TECH EXPLAINER (short B-roll, bold captions, YT+Buffer) ===\n');
  const hist = loadHist();
  let topic = null;
  let example = null;
  let enrich = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    topic = await pickTopic(hist);
    console.log('[Archie] topic:', topic.title, `(${topic.lane || 'mixed'})`);
    const examples = await findRealLifeExample(topic.title);
    if (!examples.length) {
      console.warn('[Archie] no example — skip');
      continue;
    }
    example = examples[0];
    enrich = await enrichTopic(topic.title);
    if (!(enrich.wiki || (enrich.notes && enrich.notes.length))) {
      console.warn('[Archie] thin research — skip');
      continue;
    }
    break;
  }
  if (!topic || !example) throw new Error('Archie: could not lock topic with example');

  const script = await buildScript(topic, example, enrich);
  console.log('[Archie] title:', script.title);
  console.log('[Archie] learn:', script.learningObjective);
  console.log('[Archie] tags:', (script.hashtags || []).join(' '));

  let broll = null;
  for (const kw of script.visualKeywords || []) {
    try {
      const v = await searchAndFetchVideo(kw, { preferredSource: 'pexels' });
      if (v?.localPath && fs.existsSync(v.localPath)) {
        broll = v.localPath;
        break;
      }
    } catch (_) {}
    try {
      const im = await searchAndFetchImage(kw, { preferredSource: 'unsplash' });
      if (im?.localPath && fs.existsSync(im.localPath)) {
        broll = im.localPath;
        break;
      }
    } catch (_) {}
  }

  const voiceWav = path.join(ARTIFACTS, `voice_${Date.now()}.wav`);
  await ttsToWav(script.spokenScript, voiceWav);
  const voiceDur = durOf(voiceWav);
  const bgm = await fetchUniqueBgm('archie', voiceDur + 2, script.bgmQuery || null);
  if (!bgm?.localPath) throw new Error('Archie unique BGM failed');

  const rendered = await renderArchieHeavy({
    script,
    voiceWav,
    brollPath: broll,
    bgmPath: bgm.localPath
  });

  const meta = {
    title: script.title,
    description: script.description,
    learningObjective: script.learningObjective,
    spokenScript: script.spokenScript,
    hashtags: script.hashtags,
    lane: script.lane || topic.lane,
    topic: topic.title,
    example: example.title,
    bgmQuery: bgm.query,
    videoPath: rendered.latest,
    duration: rendered.total,
    studio: script.studio,
    composite: 'explainer-lipsync-short-broll-bold-caps',
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(RENDERED, 'archie_latest_meta.json'), JSON.stringify(meta, null, 2));
  saveHist({ title: topic.title, postTitle: script.title, lane: meta.lane, learn: script.learningObjective, bgm: bgm.query });
  try {
    await saveChosenTopicToDatabase(topic, 'cartoon', 'ArchieTeach');
  } catch (_) {}
  console.log('[Archie] ready for YouTube CH3 + Buffer FB/IG');
  return meta;
}

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Archie failed:', e.message);
    process.exit(1);
  });
}
module.exports = { main };
