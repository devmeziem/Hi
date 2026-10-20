#!/usr/bin/env node
/**
 * Archie LIVE reel — no seed vault
 * 1) Discover daily topic
 * 2) Real-life example required (skip topic if none)
 * 3) Enrich via Wikipedia + DuckDuckGo
 * 4) AI script (hook/did-you-know, body, outro) + visual + SFX + BGM keywords
 * 5) Black OR white studio, mid B-roll with pan under VO, gestures + lipsync
 * 6) Soft FFmpeg: try richer composite → simple always works
 * 7) Title/description + dedup history
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const { EdgeTTS } = require('node-edge-tts');
const { callActiveAiForJson, queryDuckDuckGo, discoverAndSelectTopicViaActiveAi, saveChosenTopicToDatabase } = require('./topic_discovery_engine.cjs');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');

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
    if (!p) continue;
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
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieBot/3.0' }, timeout: timeoutMs }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(httpGet(res.headers.location, timeoutMs));
        }
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
  const q = `${topicTitle} real life example OR real-world application OR case study`;
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
  const examples = hits
    .map((h) => ({
      title: h.title || '',
      snippet: String(h.snippet || h.body || '').slice(0, 280)
    }))
    .filter((h) => h.snippet.length > 40);
  return examples;
}

async function enrichTopic(topicTitle) {
  const notes = [];
  const wiki = await wikiExtract(topicTitle);
  if (wiki) notes.push({ source: 'wikipedia', title: wiki.title, text: wiki.extract });
  try {
    const ddg = (await queryDuckDuckGo(topicTitle + ' explained science facts', 5)) || [];
    for (const r of ddg) notes.push({ source: 'duckduckgo', title: r.title, text: r.snippet || r.body || '' });
  } catch (_) {}
  return { wiki, notes };
}

async function pickTopic(hist) {
  if (process.env.TEST_TOPIC) {
    return { title: process.env.TEST_TOPIC, category: 'Science' };
  }
  for (let i = 0; i < 5; i++) {
    try {
      const discovery = await discoverAndSelectTopicViaActiveAi('cartoon');
      const t = discovery?.chosenTopic;
      if (t?.title && !isDup(t.title, hist)) return t;
    } catch (e) {
      console.warn('[Archie] topic attempt', i + 1, e.message);
    }
  }
  // last resort: wiki random science page via search
  const seeds = [
    'bioluminescence animals',
    'piezoelectric effect',
    'superhydrophobic surfaces',
    'ferrofluid magnetic',
    'thermite reaction safety',
    'optical fiber total internal reflection',
    'graphene conductivity',
    'sonic boom physics'
  ];
  for (const s of seeds.sort(() => Math.random() - 0.5)) {
    if (!isDup(s, hist)) return { title: s, category: 'Science' };
  }
  throw new Error('Archie: no unique topic');
}

async function buildScript(topic, example, enrich) {
  const system = `You are Archie, a friendly animated science explainer for teens/young adults.
Return STRICT JSON only.
Rules:
1. spokenScript: 90-140 words continuous VO. Start with a Did-you-know OR curiosity question using the real-life example. Explain clearly. End with a short actionable/outro CTA (save/share).
2. title: max 70 chars, YouTube/TikTok friendly.
3. description: 2-4 sentences + 5 hashtags. No spam.
4. visualKeywords: 3-5 concrete search phrases for mid-video B-roll.
5. bgmQuery: 3-6 word upbeat or curious instrumental search.
6. sfxQuery: optional short whoosh/click style query.
7. studio: "black" or "white" only.
JSON:{
  "title":"...",
  "description":"...",
  "spokenScript":"...",
  "visualKeywords":["..."],
  "bgmQuery":"curious science ambient chill",
  "sfxQuery":"soft whoosh transition",
  "studio":"white",
  "hashtags":["#Archie","#Science","#Shorts"]
}`;
  const user = `TOPIC: ${topic.title}
REAL-LIFE EXAMPLE (must use in intro):
${example.title}: ${example.snippet}

RESEARCH:
${enrich.notes
  .slice(0, 6)
  .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${String(n.text).slice(0, 280)}`)
  .join('\n')}

Write the package.`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await callActiveAiForJson(system, user, null, { nicheKey: 'cartoon', temperature: 0.6 + a * 0.05 });
      const d = res?.data || res;
      if (d?.spokenScript && d?.title && Array.isArray(d.visualKeywords) && d.visualKeywords.length) return d;
    } catch (e) {
      console.warn('[Archie AI]', e.message);
    }
  }
  // minimal non-seed synthesis from research
  return {
    title: `Did you know? ${String(topic.title).slice(0, 50)}`,
    description: `${example.snippet.slice(0, 180)}\n\n#Archie #Science #DidYouKnow #Shorts`,
    spokenScript: `Did you know this about ${topic.title}? ${example.snippet.slice(0, 120)} ${String(enrich.wiki?.extract || '').slice(0, 280)} That is why this matters in everyday life. Save this if you learned something new.`,
    visualKeywords: [topic.title, example.title, 'science laboratory close up'].slice(0, 3),
    bgmQuery: 'curious upbeat science ambient',
    sfxQuery: 'soft whoosh',
    studio: Math.random() > 0.5 ? 'black' : 'white',
    hashtags: ['#Archie', '#Science', '#DidYouKnow', '#Shorts']
  };
}

function studioSvg(mode, w = 1080, h = 1920) {
  if (mode === 'black') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a0a0f"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><rect x="80" y="160" width="920" height="4" fill="#22d3ee" opacity="0.35"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><rect x="80" y="160" width="920" height="4" fill="#0ea5e9" opacity="0.4"/></svg>`;
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
    const o = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`,
      { encoding: 'utf8' }
    );
    return Math.max(3, parseFloat(o) || 20);
  } catch {
    return 20;
  }
}

function puppet(name) {
  const p = path.join(PUPPET, name);
  return fs.existsSync(p) ? p : null;
}

async function renderArchie({ script, voiceWav, brollPath, bgmPath }) {
  const voiceDur = durOf(voiceWav);
  const total = voiceDur + 1.2;
  const studioMode = script.studio === 'black' ? 'black' : 'white';
  const bgSvg = path.join(ARTIFACTS, 'studio.svg');
  const bgPng = path.join(ARTIFACTS, 'studio.png');
  fs.writeFileSync(bgSvg, studioSvg(studioMode));
  execSync(`ffmpeg -y -i "${bgSvg}" "${bgPng}" 2>/dev/null`);

  const idle = puppet('puppet_idle.png') || puppet('puppet_talking.png');
  const talk = puppet('puppet_talking.png') || idle;
  const point = puppet('puppet_point_camera.png') || puppet('puppet_point_up_right.png') || idle;
  const open = puppet('puppet_open_palms.png') || idle;
  if (!idle) throw new Error('No puppet assets — run build_exact_puppet_shapes first');

  // Mix VO + BGM
  const mixed = path.join(ARTIFACTS, `mix_${Date.now()}.wav`);
  if (bgmPath && fs.existsSync(bgmPath)) {
    execSync(
      `ffmpeg -y -i "${voiceWav}" -stream_loop -1 -i "${bgmPath}" -filter_complex "[0:a]volume=1.45[v];[1:a]volume=0.28,atrim=0:${total.toFixed(2)}[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[a]" -t ${total.toFixed(2)} "${mixed}" 2>/dev/null`
    );
  } else {
    execSync(`ffmpeg -y -i "${voiceWav}" -t ${total.toFixed(2)} "${mixed}" 2>/dev/null`);
  }

  const out = path.join(RENDERED, `archie_live_${Date.now()}.mp4`);
  const latest = path.join(RENDERED, 'archie_latest.mp4');
  const fps = 30;
  const frames = Math.ceil(total * fps);
  const midStart = Math.min(voiceDur * 0.28, 6);
  const midEnd = Math.min(voiceDur * 0.72, voiceDur - 1);

  // --- Heavy-ish but bounded composite (≤8 inputs) ---
  try {
    let inputs = `-loop 1 -t ${total.toFixed(2)} -i "${bgPng}" `;
    inputs += `-loop 1 -t ${total.toFixed(2)} -i "${idle}" `;
    inputs += `-loop 1 -t ${total.toFixed(2)} -i "${talk}" `;
    inputs += `-loop 1 -t ${total.toFixed(2)} -i "${point}" `;
    inputs += `-loop 1 -t ${total.toFixed(2)} -i "${open}" `;
    let next = 5;
    let brollIdx = -1;
    if (brollPath && fs.existsSync(brollPath)) {
      const isVid = /\.(mp4|mov|webm)$/i.test(brollPath);
      if (isVid) inputs += `-i "${brollPath}" `;
      else inputs += `-loop 1 -t ${total.toFixed(2)} -i "${brollPath}" `;
      brollIdx = next++;
    }
    inputs += `-i "${mixed}" `;
    const audioIdx = next;

    let fc = `[0:v]scale=1080:1920,zoompan=z='min(1.0+0.00003*on,1.04)':d=${frames}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}[bg];`;
    fc += `[1:v]scale=-1:1080[idle];[2:v]scale=-1:1080[talk];[3:v]scale=-1:1080[point];[4:v]scale=-1:1080[open];`;
    if (brollIdx >= 0) {
      fc += `[${brollIdx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(1.05+0.00005*on,1.15)':d=${frames}:x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.4':s=1080x1920:fps=${fps}[broll];`;
      fc += `[bg][broll]overlay=0:0:enable='between(t\,${midStart.toFixed(2)}\,${midEnd.toFixed(2)})'[base];`;
    } else {
      fc += `[bg]copy[base];`;
    }
    // lipsync-ish talk blink + gesture windows
    fc += `[base][point]overlay=x=(W-w)/2:y=H-h-40:enable='lt(t\,${Math.min(4, voiceDur * 0.2).toFixed(2)})'[s1];`;
    fc += `[s1][talk]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t\,${Math.min(4, voiceDur * 0.2).toFixed(2)})*lt(t\,${midStart.toFixed(2)})*mod(floor(t*5)\,2)'[s2];`;
    fc += `[s2][idle]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t\,${Math.min(4, voiceDur * 0.2).toFixed(2)})*lt(t\,${midStart.toFixed(2)})*(1-mod(floor(t*5)\,2))'[s3];`;
    fc += `[s3][open]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t\,${midEnd.toFixed(2)})*lt(t\,${voiceDur.toFixed(2)})'[s4];`;
    fc += `[s4][idle]overlay=x=(W-w)/2:y=H-h-40:enable='gte(t\,${voiceDur.toFixed(2)})'[vfinal]`;

    const cmd = `ffmpeg -y ${inputs} -filter_complex "${fc}" -map "[vfinal]" -map ${audioIdx}:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${total.toFixed(2)} "${out}" 2>/dev/null`;
    console.log('[Archie] trying gesture+lipsync composite...');
    execSync(cmd);
  } catch (e) {
    console.warn('[Archie] rich composite failed → simple fallback:', e.message.slice(0, 120));
    const simple = `ffmpeg -y -loop 1 -t ${total.toFixed(2)} -i "${bgPng}" -loop 1 -t ${total.toFixed(2)} -i "${talk || idle}" -i "${mixed}" -filter_complex "[0:v]scale=1080:1920,zoompan=z='min(1.0+0.00004*on,1.05)':d=${frames}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}[bg];[1:v]scale=-1:1100[pup];[bg][pup]overlay=x=(W-w)/2:y=H-h-60[vfinal]" -map "[vfinal]" -map 2:a -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${total.toFixed(2)} "${out}" 2>/dev/null`;
    execSync(simple);
  }

  if (!fs.existsSync(out) || fs.statSync(out).size < 8000) throw new Error('Archie render produced empty file');
  fs.copyFileSync(out, latest);
  // also name used by buffer publisher
  fs.copyFileSync(out, path.join(RENDERED, 'archie_tech_fact_latest.mp4'));
  console.log('[Archie] OK', (fs.statSync(out).size / 1024 / 1024).toFixed(2), 'MB');
  return { out, latest, total };
}

async function main() {
  console.log('\n=== ARCHIE LIVE REEL (research → script → VO → B-roll → gestures) ===\n');
  const hist = loadHist();

  let topic = null;
  let example = null;
  let enrich = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    topic = await pickTopic(hist);
    console.log('[Archie] topic:', topic.title);
    const examples = await findRealLifeExample(topic.title);
    if (!examples.length) {
      console.warn('[Archie] no real-life example — skip topic');
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
  if (!topic || !example) throw new Error('Archie: could not lock topic with real-life example');

  const script = await buildScript(topic, example, enrich);
  console.log('[Archie] title:', script.title);

  // media
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

  let bgm = null;
  try {
    const a = await searchAndFetchAudio(script.bgmQuery || 'curious science ambient', {});
    if (a?.localPath) bgm = a.localPath;
  } catch (_) {}

  const voiceWav = path.join(ARTIFACTS, `voice_${Date.now()}.wav`);
  await ttsToWav(script.spokenScript, voiceWav);

  const rendered = await renderArchie({ script, voiceWav, brollPath: broll, bgmPath: bgm });

  const meta = {
    title: script.title,
    description: script.description,
    spokenScript: script.spokenScript,
    hashtags: script.hashtags,
    topic: topic.title,
    example: example.title,
    videoPath: rendered.latest,
    duration: rendered.total,
    studio: script.studio,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(RENDERED, 'archie_latest_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(ARTIFACTS, 'latest_fact.json'), JSON.stringify(meta, null, 2));

  saveHist({ title: topic.title, postTitle: script.title, example: example.title });
  try {
    await saveChosenTopicToDatabase(topic, 'cartoon', 'ArchieLive');
  } catch (_) {}

  console.log('[Archie] meta saved; ready for Buffer FB/IG');
  return meta;
}

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Archie live failed:', e.message);
    process.exit(1);
  });
}

module.exports = { main };
