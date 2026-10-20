#!/usr/bin/env node
/**
 * Archie LIVE HEAVY — teaching-first science shorts
 * Clear hook + one fact the viewer learns + lipsync for full VO + longer B-roll + centered captions
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
  fs.writeFileSync(HIST, JSON.stringify(h.slice(-150), null, 2));
}
function isDup(title, hist) {
  const n = String(title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!n) return true;
  for (const h of hist.slice(-40)) {
    const p = String(h.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (p === n) return true;
    const A = new Set(n.split(' ').filter((w) => w.length > 3));
    const B = new Set(p.split(' ').filter((w) => w.length > 3));
    let hit = 0;
    for (const w of A) if (B.has(w)) hit++;
    if (A.size && hit / Math.max(A.size, B.size) >= 0.45) return true;
  }
  return false;
}
function httpGet(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieBot/4.0' }, timeout: timeoutMs }, (res) => {
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
    if (extract.length < 120) return null;
    return { title: page.title, extract: extract.slice(0, 3500) };
  } catch {
    return null;
  }
}
async function findRealLifeExample(topicTitle) {
  const q = `${topicTitle} real life example OR real-world application OR everyday why`;
  let hits = [];
  try {
    hits = (await queryDuckDuckGo(q, 6)) || [];
  } catch (_) {}
  if (!hits.length) {
    const html = await httpGet('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q));
    const snips = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) || [];
    for (const s of snips.slice(0, 5)) {
      const text = String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 50) hits.push({ title: text.slice(0, 80), snippet: text });
    }
  }
  return hits
    .map((h) => ({ title: h.title || '', snippet: String(h.snippet || h.body || '').slice(0, 280) }))
    .filter((h) => h.snippet.length > 40);
}
async function enrichTopic(topicTitle) {
  const notes = [];
  const wiki = await wikiExtract(topicTitle);
  if (wiki) notes.push({ source: 'wikipedia', title: wiki.title, text: wiki.extract });
  try {
    const ddg = (await queryDuckDuckGo(topicTitle + ' explained simple science', 5)) || [];
    for (const r of ddg) notes.push({ source: 'duckduckgo', title: r.title, text: r.snippet || r.body || '' });
  } catch (_) {}
  return { wiki, notes };
}
async function pickTopic(hist) {
  if (process.env.TEST_TOPIC) return { title: process.env.TEST_TOPIC, category: 'Science' };
  for (let i = 0; i < 5; i++) {
    try {
      const discovery = await discoverAndSelectTopicViaActiveAi('cartoon');
      const t = discovery?.chosenTopic;
      if (t?.title && !isDup(t.title, hist)) return t;
    } catch (e) {
      console.warn('[Archie] topic attempt', i + 1, e.message);
    }
  }
  const seeds = [
    'why ice is slippery',
    'why onions make you cry',
    'how microwave ovens heat food',
    'why the sky is blue',
    'how soap cleans grease',
    'why batteries die'
  ];
  for (const s of seeds.sort(() => Math.random() - 0.5)) {
    if (!isDup(s, hist)) return { title: s, category: 'Science' };
  }
  throw new Error('Archie: no unique topic');
}

async function buildScript(topic, example, enrich) {
  const system = `You are Archie, an animated science teacher for teens.
Return STRICT JSON only.
Goals: the viewer must LEARN one clear fact they can repeat to a friend.
Structure spokenScript (100-140 words):
1) HOOK (1 sentence): surprising question or "Did you know…" using the real-life example.
2) TEACH (2-4 sentences): simple cause→effect explanation a 14-year-old gets.
3) TAKEAWAY (1 sentence): the one fact to remember.
4) Soft CTA (half sentence): save/share if useful — do NOT pad.
Also set learningObjective: one short phrase of what is learned.
JSON keys: title, description, spokenScript, learningObjective, visualKeywords (3-5), bgmQuery, studio ("black"|"white"), hashtags.`;
  const user = `TOPIC: ${topic.title}
REAL EXAMPLE (use in hook): ${example.title}: ${example.snippet}
RESEARCH:
${enrich.notes
    .slice(0, 6)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${String(n.text).slice(0, 300)}`)
    .join('\n')}`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await callActiveAiForJson(system, user, null, { nicheKey: 'cartoon', temperature: 0.55 + a * 0.05 });
      const d = res?.data || res;
      if (d?.spokenScript && d?.title) {
        if (!d.learningObjective) d.learningObjective = `How ${topic.title} works in real life`;
        return d;
      }
    } catch (e) {
      console.warn('[Archie AI]', e.message);
    }
  }
  const teach = String(enrich.wiki?.extract || example.snippet).slice(0, 320);
  return {
    title: `Why ${String(topic.title).slice(0, 48)}?`,
    learningObjective: `Understand ${topic.title} with a real-life example`,
    description: `Learn: ${String(topic.title)}. Real example included.\n\n#Archie #ScienceFacts #DidYouKnow #LearnOnTikTok #Shorts`,
    spokenScript: `Did you know this about ${topic.title}? Here's a real example: ${example.snippet.slice(0, 100)}. ${teach} So the takeaway is simple: ${topic.title} shows up in everyday life once you know what to look for. Save this if you learned something new.`,
    visualKeywords: [topic.title, 'science experiment close up', example.title].slice(0, 3),
    bgmQuery: 'curious soft documentary underscore',
    studio: Math.random() > 0.5 ? 'black' : 'white',
    hashtags: ['#Archie', '#ScienceFacts', '#DidYouKnow', '#LearnOnTikTok', '#Shorts']
  };
}

function studioSvg(mode, w = 1080, h = 1920) {
  if (mode === 'black') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a0a0f"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
}

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
  const chunk = 4;
  for (let i = 0; i < words.length; i += chunk) {
    const slice = words.slice(i, i + chunk);
    const t0 = Math.round(i * msPer);
    const t1 = Math.round(Math.min(totalMs, (i + slice.length) * msPer));
    lines.push(`Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,${slice.join(' ')}`);
  }
  return `[Script Info]
Title: Archie Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,64,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,4,2,5,60,60,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function ttsToWav(text, outWav) {
  const voice = process.env.ARCHIE_VOICE || 'en-US-AndrewNeural';
  const tts = new EdgeTTS({
    voice,
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    rate: '-3%',
    pitch: '-5Hz'
  });
  const mp3 = outWav.replace(/\.wav$/i, '.mp3');
  await tts.ttsPromise(text, mp3);
  execSync(`ffmpeg -y -i "${mp3}" -ar 44100 -ac 2 "${outWav}" 2>/dev/null`);
  return outWav;
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
  const total = voiceDur + 0.8;
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
    `ffmpeg -y -i "${voiceWav}" -stream_loop -1 -i "${bgmPath}" -filter_complex "[0:a]volume=1.55[v];[1:a]volume=1.0,atrim=0:${total.toFixed(2)},afade=t=in:d=0.4,afade=t=out:st=${Math.max(0.4, total - 0.9).toFixed(2)}:d=0.7[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[a]" -t ${total.toFixed(2)} "${mixed}"`,
    'mix_audio'
  );

  // Longer B-roll window (~70% of VO), not a short 5s flash
  const brollStart = Math.max(1.5, voiceDur * 0.12);
  const brollEnd = Math.min(voiceDur - 0.5, voiceDur * 0.88);
  const g1 = Math.max(2.0, voiceDur * 0.22); // hook → point
  const g2 = Math.max(g1 + 2, voiceDur * 0.55); // teach → talk lipsync
  // g2→voiceDur: open palms + lipsync; after voice: idle

  const baseMp4 = path.join(ARTIFACTS, 'pass_base.mp4');
  runFfmpeg(
    `ffmpeg -y -loop 1 -t ${total.toFixed(2)} -i "${bgPng}" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "[0:v]scale=1080:1920,zoompan=z='min(1.0+0.000035*on,1.05)':d=${frames}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*0.35':s=1080x1920:fps=${fps},format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} "${baseMp4}"`,
    'pass_base'
  );

  let sceneMp4 = baseMp4;
  if (brollPath && fs.existsSync(brollPath)) {
    const withBroll = path.join(ARTIFACTS, 'pass_broll.mp4');
    const isVid = /\.(mp4|mov|webm)$/i.test(brollPath);
    const bIn = isVid ? `-stream_loop -1 -i "${brollPath}"` : `-loop 1 -t ${total.toFixed(2)} -i "${brollPath}"`;
    runFfmpeg(
      `ffmpeg -y -i "${baseMp4}" ${bIn} -filter_complex "[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(1.06+0.00005*on,1.16)':d=${frames}:x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.35':s=1080x1920:fps=${fps},format=yuv420p[br];[0:v][br]overlay=0:0:enable='between(t,${brollStart.toFixed(2)},${brollEnd.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${withBroll}"`,
      'pass_broll'
    );
    sceneMp4 = withBroll;
  }

  // Lipsync for FULL speaking window: alternate talk / talk2 while VO plays;
  // gesture changes by phase (point early, open late) but mouth keeps moving
  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');
  const gestCmd = `ffmpeg -y -i "${sceneMp4}" -loop 1 -t ${total.toFixed(2)} -i "${point}" -loop 1 -t ${total.toFixed(2)} -i "${talk}" -loop 1 -t ${total.toFixed(2)} -i "${talk2}" -loop 1 -t ${total.toFixed(2)} -i "${open}" -loop 1 -t ${total.toFixed(2)} -i "${idle}" -filter_complex "[1:v]scale=-1:1100,format=rgba[point];[2:v]scale=-1:1100,format=rgba[talk];[3:v]scale=-1:1100,format=rgba[talk2];[4:v]scale=-1:1100,format=rgba[open];[5:v]scale=-1:1100,format=rgba[idle];[0:v][point]overlay=x=(W-w)/2:y=H-h-40:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*5),2),0)'[a];[a][talk]overlay=x=(W-w)/2:y=H-h-40:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*5),2),1)'[b];[b][talk]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*6),2),0)'[c];[c][talk2]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*6),2),1)'[d];[d][open]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),0)'[e];[e][talk]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),1)'[f];[f][idle]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t,${voiceDur.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${gestMp4}"`;
  runFfmpeg(gestCmd, 'pass_gestures');

  // Captions burn-in (centered, bold)
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
    '[Archie HEAVY] OK',
    (fs.statSync(out).size / 1024 / 1024).toFixed(2),
    'MB | learn:',
    script.learningObjective || 'n/a',
    `| broll ${brollStart.toFixed(1)}-${brollEnd.toFixed(1)}s | lipsync full VO`
  );
  return { out, latest, total };
}

async function main() {
  console.log('\n=== ARCHIE TEACHING REEL (hook → fact → takeaway + lipsync + captions) ===\n');
  const hist = loadHist();
  let topic = null;
  let example = null;
  let enrich = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    topic = await pickTopic(hist);
    console.log('[Archie] topic:', topic.title);
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
    topic: topic.title,
    example: example.title,
    bgmQuery: bgm.query,
    videoPath: rendered.latest,
    duration: rendered.total,
    studio: script.studio,
    composite: 'heavy-lipsync-captions-long-broll',
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(RENDERED, 'archie_latest_meta.json'), JSON.stringify(meta, null, 2));
  saveHist({ title: topic.title, postTitle: script.title, learn: script.learningObjective, bgm: bgm.query });
  try {
    await saveChosenTopicToDatabase(topic, 'cartoon', 'ArchieTeach');
  } catch (_) {}
  console.log('[Archie] ready for Buffer FB/IG');
  return meta;
}

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Archie failed:', e.message);
    process.exit(1);
  });
}
module.exports = { main };
