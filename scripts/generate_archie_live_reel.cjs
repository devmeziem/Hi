#!/usr/bin/env node
/**
 * Archie LIVE — heavy multi-pass composite ONLY (no simple single-puppet path).
 * Research → real example → AI script → unique BGM → VO → B-roll + gestures + lipsync.
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
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieBot/3.1' }, timeout: timeoutMs }, (res) => {
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
  return hits
    .map((h) => ({ title: h.title || '', snippet: String(h.snippet || h.body || '').slice(0, 280) }))
    .filter((h) => h.snippet.length > 40);
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
    'bioluminescence animals',
    'piezoelectric effect',
    'superhydrophobic surfaces',
    'ferrofluid magnetic',
    'optical fiber total internal reflection',
    'graphene conductivity'
  ];
  for (const s of seeds.sort(() => Math.random() - 0.5)) {
    if (!isDup(s, hist)) return { title: s, category: 'Science' };
  }
  throw new Error('Archie: no unique topic');
}
async function buildScript(topic, example, enrich) {
  const system = `You are Archie, friendly animated science explainer.
Return STRICT JSON only.
spokenScript 90-140 words. Start Did-you-know or curiosity question using the real-life example. End short CTA.
title max 70 chars. description 2-4 sentences + hashtags.
visualKeywords 3-5 phrases. bgmQuery 3-6 words. studio "black" or "white".
JSON:{"title":"...","description":"...","spokenScript":"...","visualKeywords":["..."],"bgmQuery":"...","studio":"white","hashtags":["#Archie","#Science","#Shorts"]}`;
  const user = `TOPIC: ${topic.title}\nEXAMPLE: ${example.title}: ${example.snippet}\nRESEARCH:\n${enrich.notes
    .slice(0, 6)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${String(n.text).slice(0, 280)}`)
    .join('\n')}`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await callActiveAiForJson(system, user, null, { nicheKey: 'cartoon', temperature: 0.6 + a * 0.05 });
      const d = res?.data || res;
      if (d?.spokenScript && d?.title) return d;
    } catch (e) {
      console.warn('[Archie AI]', e.message);
    }
  }
  return {
    title: `Did you know? ${String(topic.title).slice(0, 50)}`,
    description: `${example.snippet.slice(0, 180)}\n\n#Archie #Science #DidYouKnow #Shorts`,
    spokenScript: `Did you know this about ${topic.title}? ${example.snippet.slice(0, 120)} ${String(enrich.wiki?.extract || '').slice(0, 280)} That is why this matters in everyday life. Save this if you learned something new.`,
    visualKeywords: [topic.title, example.title, 'science laboratory'].slice(0, 3),
    bgmQuery: 'curious science ambient documentary',
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
      err = fs.readFileSync(log, 'utf8').slice(-800);
    } catch (_) {}
    throw new Error(`${label}: ${err}`);
  }
}

/**
 * HEAVY multi-pass only:
 * 1) studio base with Ken Burns
 * 2) mid B-roll with pan under timeline
 * 3) gesture + lipsync puppet layers
 * 4) mux mixed VO+BGM
 */
async function renderArchieHeavy({ script, voiceWav, brollPath, bgmPath }) {
  const voiceDur = durOf(voiceWav);
  const total = voiceDur + 1.2;
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

  // Mix VO + unique BGM (BGM required)
  const mixed = path.join(ARTIFACTS, `mix_${Date.now()}.wav`);
  if (bgmPath && fs.existsSync(bgmPath)) {
    runFfmpeg(
      `ffmpeg -y -i "${voiceWav}" -stream_loop -1 -i "${bgmPath}" -filter_complex "[0:a]volume=1.5[v];[1:a]volume=1.0,atrim=0:${total.toFixed(2)},afade=t=in:d=0.5,afade=t=out:st=${Math.max(0.5, total - 1).toFixed(2)}:d=0.8[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[a]" -t ${total.toFixed(2)} "${mixed}"`,
      'mix_audio'
    );
  } else {
    throw new Error('Archie requires unique BGM path');
  }

  const midStart = Math.min(Math.max(3, voiceDur * 0.25), 8);
  const midEnd = Math.min(Math.max(midStart + 4, voiceDur * 0.7), voiceDur - 0.8);
  const hookEnd = Math.min(3.5, voiceDur * 0.18);
  const talkEnd = midStart;

  // PASS 1 — studio base
  const baseMp4 = path.join(ARTIFACTS, 'pass_base.mp4');
  runFfmpeg(
    `ffmpeg -y -loop 1 -t ${total.toFixed(2)} -i "${bgPng}" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "[0:v]scale=1080:1920,zoompan=z='min(1.0+0.00004*on,1.06)':d=${frames}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*0.35':s=1080x1920:fps=${fps},format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} "${baseMp4}"`,
    'pass_base'
  );

  // PASS 2 — mid B-roll (optional)
  let sceneMp4 = baseMp4;
  if (brollPath && fs.existsSync(brollPath)) {
    const withBroll = path.join(ARTIFACTS, 'pass_broll.mp4');
    const isVid = /\.(mp4|mov|webm)$/i.test(brollPath);
    const bIn = isVid ? `-i "${brollPath}"` : `-loop 1 -t ${total.toFixed(2)} -i "${brollPath}"`;
    runFfmpeg(
      `ffmpeg -y -i "${baseMp4}" ${bIn} -filter_complex "[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(1.08+0.00006*on,1.18)':d=${frames}:x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.4':s=1080x1920:fps=${fps},format=yuv420p,fade=t=in:st=${midStart.toFixed(2)}:d=0.4,fade=t=out:st=${(midEnd - 0.4).toFixed(2)}:d=0.4[br];[0:v][br]overlay=0:0:enable='between(t,${midStart.toFixed(2)},${midEnd.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${withBroll}"`,
      'pass_broll'
    );
    sceneMp4 = withBroll;
  }

  // PASS 3 — heavy gestures + lipsync (multiple puppet layers)
  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');
  const gestCmd = `ffmpeg -y -i "${sceneMp4}" -loop 1 -t ${total.toFixed(2)} -i "${point}" -loop 1 -t ${total.toFixed(2)} -i "${talk}" -loop 1 -t ${total.toFixed(2)} -i "${talk2}" -loop 1 -t ${total.toFixed(2)} -i "${open}" -loop 1 -t ${total.toFixed(2)} -i "${idle}" -filter_complex "[1:v]scale=-1:1120,format=rgba[point];[2:v]scale=-1:1120,format=rgba[talk];[3:v]scale=-1:1120,format=rgba[talk2];[4:v]scale=-1:1120,format=rgba[open];[5:v]scale=-1:1120,format=rgba[idle];[0:v][point]overlay=x=(W-w)/2:y=H-h-50:enable='lt(t,${hookEnd.toFixed(2)})'[s1];[s1][talk]overlay=x=(W-w)/2:y=H-h-50:enable='gte(t,${hookEnd.toFixed(2)})*lt(t,${talkEnd.toFixed(2)})*eq(mod(floor(t*6),2),0)'[s2];[s2][talk2]overlay=x=(W-w)/2:y=H-h-50:enable='gte(t,${hookEnd.toFixed(2)})*lt(t,${talkEnd.toFixed(2)})*eq(mod(floor(t*6),2),1)'[s3];[s3][open]overlay=x=(W-w)/2:y=H-h-50:enable='gte(t,${midEnd.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})'[s4];[s4][idle]overlay=x=(W-w)/2:y=H-h-50:enable='gte(t,${voiceDur.toFixed(2)})'[v]" -map "[v]" -map 0:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${gestMp4}"`;
  runFfmpeg(gestCmd, 'pass_gestures');

  // PASS 4 — replace audio with VO+BGM mix
  const out = path.join(RENDERED, `archie_live_${Date.now()}.mp4`);
  const latest = path.join(RENDERED, 'archie_latest.mp4');
  runFfmpeg(
    `ffmpeg -y -i "${gestMp4}" -i "${mixed}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -t ${total.toFixed(2)} "${out}"`,
    'pass_mux'
  );

  if (!fs.existsSync(out) || fs.statSync(out).size < 20000) throw new Error('Archie heavy render empty');
  fs.copyFileSync(out, latest);
  fs.copyFileSync(out, path.join(RENDERED, 'archie_tech_fact_latest.mp4'));
  console.log('[Archie HEAVY] OK', (fs.statSync(out).size / 1024 / 1024).toFixed(2), 'MB — gestures+lipsync+broll+unique BGM');
  return { out, latest, total };
}

async function main() {
  console.log('\n=== ARCHIE LIVE HEAVY (research → unique BGM → multi-pass gestures) ===\n');
  const hist = loadHist();
  let topic = null;
  let example = null;
  let enrich = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    topic = await pickTopic(hist);
    console.log('[Archie] topic:', topic.title);
    const examples = await findRealLifeExample(topic.title);
    if (!examples.length) {
      console.warn('[Archie] no real-life example — skip');
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
    spokenScript: script.spokenScript,
    hashtags: script.hashtags,
    topic: topic.title,
    example: example.title,
    bgmQuery: bgm.query,
    videoPath: rendered.latest,
    duration: rendered.total,
    studio: script.studio,
    composite: 'heavy-multipass',
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(RENDERED, 'archie_latest_meta.json'), JSON.stringify(meta, null, 2));
  saveHist({ title: topic.title, postTitle: script.title, example: example.title, bgm: bgm.query });
  try {
    await saveChosenTopicToDatabase(topic, 'cartoon', 'ArchieLiveHeavy');
  } catch (_) {}
  console.log('[Archie] ready for Buffer FB/IG');
  return meta;
}

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Archie heavy failed:', e.message);
    process.exit(1);
  });
}
module.exports = { main };
