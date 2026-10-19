#!/usr/bin/env node
/** Teen situation reel — Motivation Andrew + BGM. Buffer publish is workflow-owned. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, VOICES } = require('./content_system_shared.cjs');
const { TEEN_SITUATION_HOOKS } = require('./public_sources.cjs');
const { makeBgm } = require('./mix_bgm.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const skipBuffer = String(process.env.SKIP_BUFFER || 'false') === 'true' || isDry;
const VOICE = VOICES.motivation || { id: 'en-US-AndrewNeural', rate: '-5%', pitch: '-15Hz' };
const BGM = (VOLUMES.teen && VOLUMES.teen.bgm) || 0.32;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      https
        .get(u, { headers: { 'User-Agent': 'TeenBot/1.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, n + 1);
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        })
        .on('error', reject);
    };
    get(url);
  });
}

function pickScript() {
  const hooks = TEEN_SITUATION_HOOKS || [
    'You keep unlocking your phone with no reason',
    'You say you will start tomorrow every night'
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const body =
    'That habit is training your brain to run from hard things. ' +
    'Today you do one uncomfortable task first. No scrolling until it is done. ' +
    'Discipline is not a feeling. It is a decision you repeat.';
  const cta = 'Save this and do the hard thing in the next ten minutes.';
  return {
    title: hook.slice(0, 70),
    hook,
    body,
    cta
  };
}

function buildAss(parts, duration) {
  const lines = [];
  const slice = duration / Math.max(parts.length, 1);
  parts.forEach((text, i) => {
    const start = i * slice;
    const end = Math.min(duration, (i + 1) * slice);
    const fmt = (t) => {
      const cs = Math.floor((t % 1) * 100);
      const s = Math.floor(t) % 60;
      const m = Math.floor(t / 60);
      return `0:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };
    const safe = String(text).replace(/\n/g, ' ').slice(0, 90);
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Default,,0,0,0,,{\\an5\\pos(540,960)\\b1}${safe}`);
  });
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,42,&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,60,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const script = pickScript();
  console.log('[Teen]', script.hook);

  const imgPath = path.join(ART, 'bg.jpg');
  const voicePath = path.join(ART, 'voice.mp3');
  const bgmPath = path.join(ART, 'bgm.wav');
  const assPath = path.join(ART, 'cap.ass');
  const outPath = path.join(OUT, 'teen_motivation_latest.mp4');

  const imgs = [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1080&q=80',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1080&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80'
  ];
  await download(imgs[Date.now() % imgs.length], imgPath);

  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  const spoken = `${script.hook}. ${script.body} ${script.cta}`;
  await synthesizeSpeechResilient(spoken, voicePath, {
    voice: VOICE.id,
    rate: VOICE.rate,
    pitch: VOICE.pitch
  });
  const duration = Math.max(18, Math.min(45, 2 + spoken.split(/\s+/).length * 0.38));

  makeBgm(bgmPath, duration, BGM);
  console.log('[Teen] BGM', fs.statSync(bgmPath).size);

  const parts = [script.hook, script.body.slice(0, 100), script.body.slice(100, 200), script.body.slice(200) || script.cta, script.cta];
  fs.writeFileSync(assPath, buildAss(parts.filter(Boolean), duration));

  const filter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(duration * 30)}:s=1080x1920:fps=30,hue=s=0,eq=contrast=1.15[v0];[v0]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[1:a]volume=1.5[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );
  const sz = fs.statSync(outPath).size;
  if (sz < 250000) throw new Error('HOLLOW FAIL: output small');
  console.log('[Teen] OK', outPath, (sz / 1024).toFixed(0) + 'KB');

  // Publish is owned by workflow (CHANNEL_TARGET=teen_motivation + argv)
  if (!skipBuffer && !isDry) {
    try {
      execSync('node scripts/publish_buffer_second_tiktok.cjs teen_motivation', {
        stdio: 'inherit',
        env: {
          ...process.env,
          CHANNEL_TARGET: 'teen_motivation',
          BUFFER_TIKTOK_TEEN_CHANNEL_ID:
            process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID || '6ab05677ea19ca0bde9c3ffb'
        }
      });
    } catch (e) {
      console.warn('[Teen] Buffer', e.message);
    }
  } else {
    console.log('[Teen] publish deferred to workflow / dry');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
