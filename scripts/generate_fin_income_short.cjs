#!/usr/bin/env node
/**
 * Fin Blueprint — Small Income / Practical Teaching Short (Channel 1)
 * ~25–40s, voice + emotional BGM, problem-led SEO title, strong dedup.
 * Zero-AI capable: uses curated teaching cards (no quota required).
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
    title: 'How to make your first ₦5,000 without capital',
    hook: 'You do not need money to start making money.',
    points: [
      'Pick one skill you already use every week — writing, phone repair tips, or local errands.',
      'Offer it to five people in your area or online group today.',
      'Price small, deliver fast, ask for one testimonial.'
    ],
    cta: 'Comment START if you will try this this week.',
    tags: ['#SideHustle', '#MakeMoney', '#Nigeria', '#SmallBusiness', '#Shorts']
  },
  {
    id: 'stop_leak',
    title: 'The ₦500 leak that blocks your savings',
    hook: 'Wealth starts when the leaks stop.',
    points: [
      'List every small daily spend for three days.',
      'Cut only one leak — not everything at once.',
      'Move that amount to a separate wallet the same day.'
    ],
    cta: 'What is your biggest small leak? Comment it.',
    tags: ['#SaveMoney', '#MoneyTips', '#Budget', '#Wealth', '#Shorts']
  },
  {
    id: 'one_client',
    title: 'Get one paying client this week',
    hook: 'One client beats a perfect plan.',
    points: [
      'Write a one-line offer: what you do and for whom.',
      'Send it to ten people who already trust you.',
      'Follow up once. Then deliver if they say yes.'
    ],
    cta: 'Comment CLIENT if you are sending the message today.',
    tags: ['#Freelance', '#Clients', '#Income', '#Hustle', '#Shorts']
  },
  {
    id: 'skill_stack',
    title: 'The skill stack that pays faster than certificates',
    hook: 'Employers and clients buy results, not paper.',
    points: [
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
    hook: 'Big goals fail when small tests never start.',
    points: [
      'Define a test you can finish in seven days.',
      'Cap the cost so a loss will not hurt you.',
      'Write what you will learn either way.'
    ],
    cta: 'Comment TEST if you will run a seven-day experiment.',
    tags: ['#Mindset', '#Entrepreneur', '#Risk', '#Money', '#Shorts']
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
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (r2) => { r2.pipe(file); file.on('finish', () => file.close(resolve)); }).on('error', reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
  const lesson = pickLesson();
  console.log('[Fin Income]', lesson.title);

  const narration = [lesson.hook, ...lesson.points, lesson.cta].join(' ');
  const voicePath = path.join(ART, `fin_income_voice_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `fin_income_bgm_${Date.now()}.mp3`);
  const imgPath = path.join(ART, `fin_income_bg_${Date.now()}.jpg`);
  const outPath = path.join(OUT, 'fin_income_latest.mp4');

  // Image from public Unsplash (city work / money adjacent, free)
  const imgs = [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&q=80',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&q=80'
  ];
  try {
    await download(imgs[Math.floor(Math.random() * imgs.length)], imgPath);
  } catch (e) {
    console.warn('image download', e.message);
    // solid dark fallback via ffmpeg later
  }

  // Voice: Edge TTS Andrew slightly authoritative
  try {
    execSync(`npx --yes edge-tts --voice en-US-AndrewNeural --rate=-5% --pitch=-10Hz --text ${JSON.stringify(narration)} --write-media "${voicePath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('edge-tts failed, trying espeak');
    execSync(`espeak-ng -v en-us -s 140 -w "${voicePath.replace(/\.mp3$/, '.wav')}" ${JSON.stringify(narration)}`, { stdio: 'inherit' });
  }

  // Soft BGM under voice (sine bed) if no external track
  try {
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=220:duration=40" -af "volume=0.04" "${bgmPath}" 2>/dev/null`, { stdio: 'pipe' });
  } catch (_) {}

  const hasImg = fs.existsSync(imgPath) && fs.statSync(imgPath).size > 1000;
  const voice = fs.existsSync(voicePath) ? voicePath : voicePath.replace(/\.mp3$/, '.wav');
  const titleEsc = lesson.title.replace(/:/g, '\\:').replace(/'/g, "'\\''");

  // Simple vertical video: image + ken burns + centered title card feel via drawtext
  const vf = hasImg
    ? `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.05:saturation=0.85,drawtext=text='${titleEsc.slice(0, 42)}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h*0.72:shadowcolor=black:shadowx=2:shadowy=2`
    : `color=c=0x0a0a12:s=1080x1920:d=35,drawtext=text='${titleEsc.slice(0, 42)}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2`;

  const bgmArg = fs.existsSync(bgmPath) ? `-i "${bgmPath}"` : '';
  const filter = fs.existsSync(bgmPath)
    ? `-filter_complex "[1:a]volume=1.0[a0];[2:a]volume=0.18[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]"`
    : `-map 0:v -map 1:a`;

  const imgInput = hasImg ? `-loop 1 -i "${imgPath}"` : `-f lavfi -i color=c=0x0a0a12:s=1080x1920:d=35`;
  const cmd = `ffmpeg -y ${imgInput} -i "${voice}" ${bgmArg} -vf "${vf}" ${filter} -c:v libx264 -tune stillimage -c:a aac -b:a 128k -shortest -pix_fmt yuv420p -t 40 "${outPath}"`;
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });

  console.log('[Fin Income] Rendered', outPath);
  console.log('[Fin Income] SEO Title:', lesson.title);
  console.log('[Fin Income] Tags:', lesson.tags.join(' '));

  // Optional YouTube upload via existing dispatcher if present
  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      if (typeof uploadYouTubeShort === 'function') {
        const desc = `${lesson.hook}\n\n${lesson.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${lesson.cta}\n\n${lesson.tags.join(' ')}`;
        const res = await uploadYouTubeShort({
          videoPath: outPath,
          title: lesson.title,
          description: desc,
          tags: lesson.tags,
          channelId: 'finance_saas'
        });
        console.log('[Fin Income] Upload result', res?.id || res);
      }
    } catch (e) {
      console.warn('[Fin Income] Upload skipped/notice:', e.message);
    }
  } else {
    console.log('[Fin Income] DRY_RUN — no upload');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
