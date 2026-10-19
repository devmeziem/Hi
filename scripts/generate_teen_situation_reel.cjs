#!/usr/bin/env node
/**
 * Teen / Apex — situation-led motivation (NOT listicle seeds)
 * Motivation Andrew -5% / -15Hz, BGM 0.32, multi-beat captions, public-style hooks
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, VOICES, loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { TEEN_SITUATION_HOOKS } = require('./public_sources.cjs');
const { TEEN_SCRIPT } = require('./prompts_library.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const HIST = path.join(process.cwd(), 'data', 'teen_topic_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const V = VOICES.motivation;
const BGM = VOLUMES.teen.bgm;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'TeenMotivationBot/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function buildScript() {
  const history = loadHistory(HIST);
  const hooks = [...TEEN_SITUATION_HOOKS].sort(() => Math.random() - 0.5);
  let situation = hooks.find((h) => !isDuplicate({ title: h }, history, { overlapMax: 0.4 })) || hooks[0];

  let script = {
    title: situation,
    hook: situation + '.',
    body: 'That pattern is training you. Change one cue today: put the phone in another room for twenty minutes and finish one hard thing before you scroll.',
    cta: 'Comment LOCK IN if you will try this today.',
    visual_queries: ['teenager studying desk lamp night', 'phone face down wooden table', 'sunrise run empty track']
  };

  try {
    const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
    if (typeof callActiveAiForJson === 'function') {
      const ai = await callActiveAiForJson(TEEN_SCRIPT + `\nSituation seed: ${situation}`);
      if (ai?.hook && ai?.body) {
        script = {
          title: ai.title || situation,
          hook: ai.hook,
          body: ai.body,
          cta: ai.cta || script.cta,
          visual_queries: ai.visual_queries || script.visual_queries
        };
      }
    }
  } catch (e) {
    console.warn('[Teen Situation] AI skip:', e.message);
  }

  saveHistory(HIST, { title: script.title, text: script.hook });
  return script;
}

async function edgeVoice(text, outFile) {
  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  await synthesizeSpeechResilient(text, outFile, {
    voice: V.id,
    rate: V.rate,
    pitch: V.pitch,
    emotionProfile: 'educator',
    timeout: 25000
  });
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
    body += `Dialogue: 0,${fmt(i * slot)},${fmt(Math.min(duration, (i + 1) * slot))},Default,,0,0,0,,{\\an2\\fs44\\b1\\c&H00FFFFFF&\\3c&H000000&\\bord3}${String(line)}\n`;
  });
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,44,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,50,50,110,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${body}`;
}

async function main() {
  for (const d of [OUT, ART, path.dirname(HIST)]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  const script = await buildScript();
  console.log('[Teen Situation]', script.title);

  const narration = [script.hook, script.body, script.cta].join(' ');
  const voicePath = path.join(ART, `v_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `b_${Date.now()}.wav`);
  const imgPath = path.join(ART, `i_${Date.now()}.jpg`);
  const assPath = path.join(ART, `c_${Date.now()}.ass`);
  const outPath = path.join(OUT, 'teen_motivation_latest.mp4');

  const imgs = [
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1080&q=80',
    'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1080&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=1080&q=80'
  ];
  await download(imgs[Math.floor(Math.random() * imgs.length)], imgPath);
  await edgeVoice(narration, voicePath);

  let duration = 28;
  try {
    duration = Math.max(20, Math.min(45, parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, { encoding: 'utf8' }).trim()) + 0.6));
  } catch (_) {}

  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=100:duration=${duration}" -f lavfi -i "sine=frequency=150:duration=${duration}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=700,volume=${BGM}" "${bgmPath}"`,
    { stdio: 'pipe' }
  );

  fs.writeFileSync(
    assPath,
    buildAss([script.hook, script.body.slice(0, 90), script.body.slice(90) || script.cta, script.cta], duration)
  );

  // B&W + Ken Burns + captions + voice + BGM
  const filter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0014,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(duration * 30)}:s=1080x1920:fps=30,hue=s=0,eq=contrast=1.2:brightness=-0.03[v0];[v0]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[1:a]volume=1.5[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );
  console.log('[Teen Situation] OK', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title: script.title.slice(0, 90),
        description: `${script.hook}\n\n${script.body}\n\n${script.cta}\n\n#Discipline #TeenMotivation #Mindset #Shorts`,
        tags: ['#Discipline', '#TeenMotivation', '#Shorts'],
        channelId: 'teen_motivation'
      });
    } catch (e) {
      console.warn('[Teen] YT', e.message);
    }
    try {
      require('child_process').execSync('node scripts/publish_buffer_second_tiktok.cjs', {
        stdio: 'inherit',
        env: { ...process.env, PUBLISH_TARGET: 'teen' }
      });
    } catch (e) {
      console.warn('[Teen] Buffer', e.message);
    }
  } else console.log('[Teen Situation] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
