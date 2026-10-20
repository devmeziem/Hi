#!/usr/bin/env node
/**
 * Teen situation reel — 4 scenes (hook / truth / action / CTA)
 * Live visuals: Pexels video preferred, Unsplash/Pixabay stills fallback
 * Motivation Andrew Edge TTS + BGM + Cinema-style center karaoke captions
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { VOLUMES, VOICES } = require('./content_system_shared.cjs');
const { TEEN_SITUATION_HOOKS } = require('./public_sources.cjs');
const { makeBgm } = require('./mix_bgm.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const skipBuffer = String(process.env.SKIP_BUFFER || 'false') === 'true' || isDry;
const VOICE = VOICES.motivation || { id: 'en-US-AndrewNeural', rate: '-5%', pitch: '-15Hz' };
const BGM = (VOLUMES.teen && VOLUMES.teen.bgm) || 0.32;

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1080&q=80',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1080&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1080&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1080&q=80',
  'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1080&q=80'
];

function pickScript() {
  const hooks = TEEN_SITUATION_HOOKS || [
    'You keep unlocking your phone with no reason',
    'You say you will start tomorrow every night',
    'You study after scrolling for an hour',
    'You quit the hard task the moment it feels boring',
    'You check grades more than you practice'
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  return {
    title: hook.slice(0, 70),
    scenes: [
      {
        role: 'hook',
        text: hook + '.',
        query: 'teenager phone screen night room dark moody'
      },
      {
        role: 'truth',
        text:
          'That habit is training your brain to run from hard things. Every unlock teaches delay.',
        query: 'student stress homework desk laptop focus'
      },
      {
        role: 'action',
        text:
          'Today you do one uncomfortable task first. No scrolling until it is done. Discipline is not a feeling. It is a decision you repeat.',
        query: 'teenager studying writing notebook discipline'
      },
      {
        role: 'cta',
        text: 'Save this and do the hard thing in the next ten minutes.',
        query: 'young athlete training motivation sunrise'
      }
    ]
  };
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
Title: Teen Motivation Cinema-Style Karaoke
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

function downloadHttp(url, dest) {
  const https = require('https');
  const http = require('http');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith('http://') ? http : https;
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      lib
        .get(u, { headers: { 'User-Agent': 'TeenBot/1.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return get(res.headers.location, n + 1);
          }
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        })
        .on('error', reject);
    };
    get(url);
  });
}

async function fetchSceneVisual(query, index) {
  const destBase = path.join(ART, `scene_${index}`);
  let mediaFetcher = null;
  try {
    mediaFetcher = require('./universal_media_fetcher.cjs');
  } catch (_) {}

  // Prefer short vertical-ish video clip
  if (mediaFetcher && mediaFetcher.searchAndFetchVideo) {
    try {
      const vid = await mediaFetcher.searchAndFetchVideo(query, {
        minDuration: 3,
        preferredSource: 'pexels'
      });
      if (vid && (vid.localPath || vid.path) && fs.existsSync(vid.localPath || vid.path)) {
        const p = vid.localPath || vid.path;
        console.log(`[Teen] scene ${index + 1} video:`, path.basename(p));
        return { type: 'video', path: p };
      }
    } catch (e) {
      console.warn(`[Teen] video fetch fail s${index + 1}:`, e.message);
    }
  }

  // Still image via API
  if (mediaFetcher && mediaFetcher.searchAndFetchImage) {
    for (const src of ['unsplash', 'pexels', 'pixabay']) {
      try {
        const img = await mediaFetcher.searchAndFetchImage(query, { preferredSource: src });
        const p = img && (img.localPath || img.path);
        if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) {
          console.log(`[Teen] scene ${index + 1} image (${src}):`, path.basename(p));
          return { type: 'image', path: p };
        }
      } catch (e) {
        console.warn(`[Teen] image ${src} fail s${index + 1}:`, e.message);
      }
    }
  }

  // Hardcoded Unsplash fallback (always works)
  const url = FALLBACK_IMGS[(Date.now() + index * 17) % FALLBACK_IMGS.length];
  const dest = destBase + '_fallback.jpg';
  await downloadHttp(url, dest);
  console.log(`[Teen] scene ${index + 1} fallback still`);
  return { type: 'image', path: dest };
}

function renderSceneClip(visual, durationSec, outMp4, sceneIndex) {
  const frames = Math.max(30, Math.ceil(durationSec * 30));
  const zoom = sceneIndex % 2 === 0 ? "min(zoom+0.0015,1.14)" : "if(eq(on,1),1.12,max(zoom-0.0012,1.0))";
  if (visual.type === 'video') {
    // Scale+crop vertical, loop if short, mute source audio (we use VO+BGM)
    const vf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,eq=contrast=1.08:saturation=0.9`;
    execSync(
      `ffmpeg -y -stream_loop 2 -t ${durationSec.toFixed(2)} -i "${visual.path}" -an -vf "${vf}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  } else {
    const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,eq=contrast=1.12:saturation=0.85`;
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
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const script = pickScript();
  console.log('[Teen] 4-scene build | hook:', script.scenes[0].text.slice(0, 60));

  const voicePath = path.join(ART, 'voice.mp3');
  const bgmPath = path.join(ART, 'bgm.wav');
  const assPath = path.join(ART, 'cap.ass');
  const outPath = path.join(OUT, 'teen_motivation_latest.mp4');
  const concatList = path.join(ART, 'scenes.txt');

  const spoken = script.scenes.map((s) => s.text).join(' ');
  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  await synthesizeSpeechResilient(spoken, voicePath, {
    voice: VOICE.id,
    rate: VOICE.rate,
    pitch: VOICE.pitch
  });

  let voiceDur = 22;
  try {
    voiceDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  const totalDuration = Math.max(20, Math.min(48, voiceDur + 0.4));
  const sceneCount = script.scenes.length; // 4
  const secPerScene = totalDuration / sceneCount;
  console.log(`[Teen] voice=${voiceDur.toFixed(1)}s total=${totalDuration.toFixed(1)}s scenes=${sceneCount} (~${secPerScene.toFixed(1)}s each)`);

  makeBgm(bgmPath, totalDuration, BGM);
  fs.writeFileSync(assPath, buildCinemaStyleAss(spoken, totalDuration));
  console.log('[Teen] captions: cinema CenterKaraoke');

  const sceneMp4s = [];
  for (let i = 0; i < sceneCount; i++) {
    const sc = script.scenes[i];
    console.log(`[Teen] Scene ${i + 1}/4 (${sc.role}) query="${sc.query}"`);
    const visual = await fetchSceneVisual(sc.query, i);
    const sceneMp4 = path.join(ART, `scene_${i}.mp4`);
    renderSceneClip(visual, secPerScene, sceneMp4, i);
    sceneMp4s.push(sceneMp4);
    console.log(`[Teen] Scene ${i + 1} ok`, (fs.statSync(sceneMp4).size / 1024).toFixed(0) + 'KB');
  }

  fs.writeFileSync(
    concatList,
    sceneMp4s.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  );
  const concatRaw = path.join(ART, 'concat_raw.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "${concatRaw}"`,
    { stdio: 'pipe' }
  );

  const assEsc = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const filter = `[0:v]ass='${assEsc}'[vout];[1:a]volume=1.45[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  execSync(
    `ffmpeg -y -i "${concatRaw}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${totalDuration.toFixed(2)} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );

  const sz = fs.statSync(outPath).size;
  if (sz < 250000) throw new Error('HOLLOW FAIL: output small ' + sz);
  console.log('[Teen] OK 4-scene', outPath, (sz / 1024).toFixed(0) + 'KB');

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
