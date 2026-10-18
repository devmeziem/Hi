#!/usr/bin/env node
/**
 * Fin Blueprint — Small Income Teaching Short (Channel 1)
 * - Edge TTS via node-edge-tts / tts_resilient_engine (NO espeak, NO npx edge-tts CLI)
 * - Multi-beat ASS captions, Ken Burns, BGM under voice
 * - 30-day lesson dedup
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts');
const DEDUP = path.join(process.cwd(), 'data', 'fin_income_dedup.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

const LESSONS = [
  {
    id: 'first_5k_naira',
    title: 'How to make your first $50 without capital',
    beats: [
      'You do not need money to start making money.',
      'Pick one skill you already use every week.',
      'Offer it to five people today.',
      'Price small. Deliver fast. Ask for one testimonial.'
    ],
    cta: 'Comment START if you will try this week.',
    tags: ['#SideHustle', '#MakeMoney', '#SmallBusiness', '#Income', '#Shorts']
  },
  {
    id: 'stop_leak',
    title: 'The small spend that blocks your savings',
    beats: [
      'Wealth starts when the leaks stop.',
      'Track every small daily spend for three days.',
      'Cut only one leak — not everything at once.',
      'Move that amount to a separate wallet today.'
    ],
    cta: 'What is your biggest small leak? Comment it.',
    tags: ['#SaveMoney', '#MoneyTips', '#Budget', '#Wealth', '#Shorts']
  },
  {
    id: 'one_client',
    title: 'Get one paying client this week',
    beats: [
      'One client beats a perfect plan.',
      'Write a one-line offer: what you do and for whom.',
      'Send it to ten people who already trust you.',
      'Follow up once. Then deliver if they say yes.'
    ],
    cta: 'Comment CLIENT if you send the message today.',
    tags: ['#Freelance', '#Clients', '#Income', '#Hustle', '#Shorts']
  },
  {
    id: 'skill_stack',
    title: 'The skill stack that pays faster than certificates',
    beats: [
      'Clients buy results, not paper.',
      'Combine one technical skill with clear communication.',
      'Show a before-and-after example, even a small one.',
      'Post it where buyers already look.'
    ],
    cta: 'Which two skills can you combine? Comment both.',
    tags: ['#Skills', '#Career', '#Income', '#Learn', '#Shorts']
  },
  {
    id: 'risk_small',
    title: 'Take a small risk before a big dream',
    beats: [
      'Big goals fail when small tests never start.',
      'Define a test you can finish in seven days.',
      'Cap the cost so a loss will not hurt you.',
      'Write what you will learn either way.'
    ],
    cta: 'Comment TEST if you run a seven-day experiment.',
    tags: ['#Mindset', '#Entrepreneur', '#Risk', '#Money', '#Shorts']
  },
  {
    id: 'daily_offer',
    title: 'Post one offer every day for seven days',
    beats: [
      'Visibility compounds faster than perfection.',
      'Write the same clear offer in plain language.',
      'Post it where your buyers already spend time.',
      'Reply to every serious message the same day.'
    ],
    cta: 'Comment DAY1 if you will post your offer today.',
    tags: ['#Hustle', '#Sales', '#Income', '#Consistency', '#Shorts']
  }
];

function loadDedup() {
  try {
    if (fs.existsSync(DEDUP)) return JSON.parse(fs.readFileSync(DEDUP, 'utf8'));
  } catch (_) {}
  return { used: [] };
}
function saveDedup(data) {
  fs.mkdirSync(path.dirname(DEDUP), { recursive: true });
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  data.used = (data.used || []).filter((x) => x.ts > cutoff);
  fs.writeFileSync(DEDUP, JSON.stringify(data, null, 2));
}
function pickLesson() {
  const d = loadDedup();
  const recent = new Set((d.used || []).map((x) => x.id));
  const pool = LESSONS.filter((l) => !recent.has(l.id));
  const chosen = (pool.length ? pool : LESSONS)[Math.floor(Math.random() * (pool.length || LESSONS.length))];
  d.used = d.used || [];
  d.used.push({ id: chosen.id, ts: Date.now(), title: chosen.title });
  saveDedup(d);
  return chosen;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => https.get(u, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location);
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
    get(url);
  });
}

async function edgeTtsOnly(text, outMp3) {
  // Prefer project resilient engine (Tier-1 = node-edge-tts)
  try {
    const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
    await synthesizeSpeechResilient(text, outMp3, {
      voice: 'en-US-AndrewNeural',
      rate: '-5%',
      pitch: '-10Hz',
      emotionProfile: 'educator',
      timeout: 20000
    });
    if (fs.existsSync(outMp3) && fs.statSync(outMp3).size > 1000) return;
  } catch (e) {
    console.warn('[Fin Income] resilient TTS notice:', e.message);
  }
  // Direct node-edge-tts
  let EdgeTTS;
  try {
    EdgeTTS = require('node-edge-tts').EdgeTTS || require('node-edge-tts');
  } catch (_) {
    throw new Error('node-edge-tts not installed — Edge TTS required');
  }
  const tts = new EdgeTTS({
    voice: 'en-US-AndrewNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    rate: '-5%',
    pitch: '-10Hz',
    timeout: 20000
  });
  await tts.ttsPromise(text, outMp3);
  if (!fs.existsSync(outMp3) || fs.statSync(outMp3).size < 1000) {
    throw new Error('Edge TTS produced empty audio');
  }
}

function escapeAss(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\N');
}

function buildAss(beats, cta, durationSec) {
  const lines = [...beats, cta];
  const slot = durationSec / lines.length;
  let body = '';
  lines.forEach((line, i) => {
    const t0 = i * slot;
    const t1 = Math.min(durationSec, (i + 1) * slot);
    const fmt = (t) => {
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);
      const cs = Math.floor((t % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };
    body += `Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,{\\an2\\fs46\\b1\\c&H00FFFFFF&\\3c&H000000&\\bord3\\shad2}${escapeAss(line)}\n`;
  });
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,46,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,60,60,120,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${body}`;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const lesson = pickLesson();
  console.log('[Fin Income]', lesson.title);

  const narration = [...lesson.beats, lesson.cta].join(' ');
  const voicePath = path.join(ART, `fin_income_voice_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `fin_income_bgm_${Date.now()}.wav`);
  const imgPath = path.join(ART, `fin_income_bg_${Date.now()}.jpg`);
  const assPath = path.join(ART, `fin_income_${Date.now()}.ass`);
  const outPath = path.join(OUT, 'fin_income_latest.mp4');

  const imgs = [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&q=80',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80'
  ];
  await download(imgs[Math.floor(Math.random() * imgs.length)], imgPath);

  await edgeTtsOnly(narration, voicePath);
  console.log('[Fin Income] Edge TTS OK', fs.statSync(voicePath).size, 'bytes');

  let duration = 28;
  try {
    const probe = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, { encoding: 'utf8' }).trim();
    duration = Math.max(18, Math.min(45, parseFloat(probe) + 0.8));
  } catch (_) {}

  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=110:duration=${duration}" -f lavfi -i "sine=frequency=165:duration=${duration}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=800,volume=0.07" "${bgmPath}"`,
    { stdio: 'pipe' }
  );

  fs.writeFileSync(assPath, buildAss(lesson.beats, lesson.cta, duration), 'utf8');

  const filter = [
    `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0015,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(duration * 30)}:s=1080x1920:fps=30,eq=brightness=-0.04:saturation=0.9[vbase]`,
    `[vbase]ass='${assPath.replace(/'/g, "'\\''")}'[vout]`,
    `[1:a]volume=1.15[a0]`,
    `[2:a]volume=1.0[a1]`,
    `[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`
  ].join(';');

  const cmd = `ffmpeg -y -loop 1 -i "${imgPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -shortest -pix_fmt yuv420p -t ${duration} "${outPath}"`;
  console.log('[Fin Income] Rendering...');
  execSync(cmd, { stdio: 'inherit' });
  console.log('[Fin Income] Rendered', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      if (typeof uploadYouTubeShort === 'function') {
        const desc = `${lesson.beats[0]}\n\n${lesson.beats.slice(1).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${lesson.cta}\n\n${lesson.tags.join(' ')}`;
        const res = await uploadYouTubeShort({
          videoPath: outPath,
          title: lesson.title,
          description: desc,
          tags: lesson.tags,
          channelId: 'finance_saas'
        });
        console.log('[Fin Income] Upload', res?.id || res);
      }
    } catch (e) {
      console.warn('[Fin Income] Upload notice:', e.message);
    }
  } else {
    console.log('[Fin Income] DRY_RUN — no upload');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
