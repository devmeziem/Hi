#!/usr/bin/env node
/**
 * Archie — ONE path: topic image + puppet + Edge TTS + ONE BGM bed + captions.
 * Fails hard if no visual (no solid-color spam).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, VOICES, loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { ARCHIE_TOPIC_SEEDS, fetchWikipediaSummary } = require('./public_sources.cjs');
const { makeBgm } = require('./mix_bgm.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'archie_simple');
const HIST = path.join(process.cwd(), 'data', 'archie_topic_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const BGM_VOL = VOLUMES.archie.bgm;
const VOICE = VOICES.archie;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      https.get(u, { headers: { 'User-Agent': 'ArchieBot/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, n + 1);
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

function findPuppet() {
  const dir = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
  if (!fs.existsSync(dir)) return null;
  const prefer = ['puppet_explain_both.png', 'puppet_point_camera.png', 'puppet_idle.png', 'puppet_open_palms.png'];
  for (const name of prefer) {
    const p = path.join(dir, name);
    if (fs.existsSync(p) && fs.statSync(p).size > 5000) return p;
  }
  const any = fs.readdirSync(dir).find((f) => f.endsWith('.png') && fs.statSync(path.join(dir, f)).size > 5000);
  return any ? path.join(dir, any) : null;
}

async function buildTopic() {
  const history = loadHistory(HIST);
  const seeds = [...ARCHIE_TOPIC_SEEDS].sort(() => Math.random() - 0.5);
  for (const seed of seeds) {
    if (isDuplicate({ title: seed.title }, history, { overlapMax: 0.4, authorWindow: 0 })) continue;
    let body = '';
    let thumb = null;
    try {
      const sum = await fetchWikipediaSummary(seed.wiki);
      if (sum?.extract) body = sum.extract.split('. ').slice(0, 4).join('. ') + '.';
      thumb = sum?.thumbnail || null;
    } catch (_) {}
    if (!body || body.length < 60) {
      body =
        'Your body and the world follow simple rules. When air, light, or temperature change, you feel it — and science can explain that feeling in plain words.';
    }
    const topic = {
      title: seed.title,
      hook: seed.title.includes('?') ? seed.title : seed.title + '?',
      body,
      cta: 'Comment the everyday science question you want next.',
      visual: seed.visual,
      thumb
    };
    saveHistory(HIST, { title: topic.title, text: topic.hook });
    return topic;
  }
  throw new Error('No unique Archie topic');
}

async function edgeVoice(text, outFile) {
  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  await synthesizeSpeechResilient(text, outFile, {
    voice: VOICE.id,
    rate: VOICE.rate,
    pitch: VOICE.pitch,
    emotionProfile: 'educator',
    timeout: 25000
  });
  if (!fs.existsSync(outFile) || fs.statSync(outFile).size < 1000) throw new Error('TTS empty');
}

function buildAss(lines, duration) {
  const slot = duration / lines.length;
  const fmt = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const cs = Math.floor((t % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  let body = '';
  lines.forEach((line, i) => {
    body += `Dialogue: 0,${fmt(i * slot)},${fmt(Math.min(duration, (i + 1) * slot))},Default,,0,0,0,,{\\an2\\fs40\\b1\\c&H00FFFFFF&\\3c&H000000&\\bord3}${String(line).slice(0, 120)}\n`;
  });
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,40,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,50,50,100,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${body}`;
}

async function main() {
  for (const d of [OUT, ART, path.dirname(HIST)]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });

  // Ensure puppets exist
  try {
    execSync('node scripts/build_exact_puppet_shapes.cjs', { stdio: 'pipe' });
  } catch (_) {}

  const topic = await buildTopic();
  console.log('[Archie]', topic.title);

  const puppet = findPuppet();
  if (!puppet) throw new Error('HOLLOW FAIL: no puppet PNG after build');
  console.log('[Archie] puppet', puppet);

  const imgPath = path.join(ART, `bg_${Date.now()}.jpg`);
  let gotImg = false;
  if (topic.thumb) {
    try {
      await download(String(topic.thumb).replace(/\/\d+px-/, '/800px-'), imgPath);
      gotImg = fs.existsSync(imgPath) && fs.statSync(imgPath).size > 8000;
    } catch (_) {}
  }
  if (!gotImg) {
    // Unsplash topic search-ish fixed URLs by keyword bucket
    const stocks = [
      'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1080&q=80',
      'https://images.unsplash.com/photo-1507400492016-b8c1b4a1b4a1?w=1080&q=80',
      'https://images.unsplash.com/photo-1534088568598-e9b9a4a1b4a1?w=1080&q=80',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80'
    ];
    // Prefer reliable Unsplash science/nature
    const reliable = [
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1080&q=80',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1080&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80'
    ];
    try {
      await download(reliable[Math.floor(Math.random() * reliable.length)], imgPath);
      gotImg = fs.existsSync(imgPath) && fs.statSync(imgPath).size > 8000;
    } catch (e) {
      throw new Error('HOLLOW FAIL: no background image — ' + e.message);
    }
  }
  if (!gotImg) throw new Error('HOLLOW FAIL: background image too small');

  const narration = [topic.hook, topic.body, topic.cta].join(' ');
  const voicePath = path.join(ART, `v_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `b_${Date.now()}.wav`);
  const assPath = path.join(ART, `c_${Date.now()}.ass`);
  const outPath = path.join(OUT, `archie_simple_${Date.now()}.mp4`);

  await edgeVoice(narration, voicePath);
  let duration = 25;
  try {
    duration = Math.max(18, Math.min(55, parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, { encoding: 'utf8' }).trim()) + 0.5));
  } catch (_) {}

  makeBgm(bgmPath, duration, BGM_VOL);
  console.log('[Archie] BGM ok', fs.statSync(bgmPath).size);

  fs.writeFileSync(
    assPath,
    buildAss([topic.hook, topic.body.slice(0, 110), topic.body.slice(110, 220) || topic.cta, topic.cta], duration)
  );

  // ONE composite: topic image bg + puppet overlay + captions + voice + bgm
  const filter = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.05:saturation=0.85[bg]`,
    `[1:v]scale=-1:1000[pup]`,
    `[bg][pup]overlay=x=(W-w)/2:y=H-h-40[base]`,
    `[base]ass='${assPath.replace(/'/g, "'\\''")}'[vout]`,
    `[2:a]volume=1.35[a0]`,
    `[3:a]volume=1.0[a1]`,
    `[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`
  ].join(';');

  execSync(
    `ffmpeg -y -loop 1 -t ${duration} -i "${imgPath}" -loop 1 -t ${duration} -i "${puppet}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );

  const sz = fs.statSync(outPath).size;
  if (sz < 200000) throw new Error('HOLLOW FAIL: output too small ' + sz);
  console.log('[Archie] OK', outPath, (sz / 1024).toFixed(0) + 'KB');

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title: `${topic.title} #Shorts`,
        description: `${topic.hook}\n\n${topic.body}\n\n${topic.cta}\n\n#ArchieExplains #ScienceFacts #Shorts`,
        tags: ['#ArchieExplains', '#ScienceFacts', '#Shorts'],
        channelId: 'cartoon_factory'
      });
    } catch (e) {
      console.warn('[Archie] upload', e.message);
    }
  } else console.log('[Archie] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
