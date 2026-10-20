#!/usr/bin/env node
/**
 * Fin Blueprint — Education shorts (students / under-25)
 * Types: skill | trap | income (Nigeria-first free/cheap starts)
 * Pure education + context links to xenvest.name.ng / lanecash.name.ng
 * Disclaimer in every description when needed
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'fin_edu');
const DEDUP = path.join(process.cwd(), 'data', 'fin_income_dedup.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const slotMode = String(process.env.FIN_SLOT_MODE || process.env.VIDEO_MODE || 'skill').toLowerCase();

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

const DISCLAIMER =
  'Educational content only — not financial advice. Results vary. Never pay upfront fees to strangers promising guaranteed returns. Verify every opportunity yourself.';

/** Free / cheap legal skill & trap lessons — Nigeria-first where marked */
const LESSONS = [
  // —— SKILLS (free / near-free) ——
  {
    id: 'skill_track_3days',
    type: 'skill',
    capital: 'free',
    region: 'global',
    title: 'Free money skill: track spending for 3 days',
    beats: [
      'You do not need capital to start getting control of money.',
      'For three days write every spend in your phone notes — even small ones.',
      'Circle only one leak you can cut without pain.',
      'Move that amount to a separate savings pocket the same day.'
    ],
    cta: 'Start the three-day note today — action beats motivation.',
    link: null,
    tags: ['#MoneySkills', '#Students', '#Budget', '#SaveMoney', '#Shorts', '#Nigeria']
  },
  {
    id: 'skill_one_line_offer',
    type: 'skill',
    capital: 'free',
    region: 'nigeria',
    title: 'Free skill: write a one-line offer students can sell',
    beats: [
      'One clear offer beats a perfect website.',
      'Write: I help X do Y in Z time — example: I help classmates fix phone storage in thirty minutes.',
      'Send it to ten people who already know you — WhatsApp is enough.',
      'Price small, deliver fast, ask for one honest testimonial.'
    ],
    cta: 'Send the one-line offer before the day ends.',
    link: null,
    tags: ['#SideHustle', '#Students', '#Freelance', '#Nigeria', '#Shorts']
  },
  {
    id: 'skill_price_time',
    type: 'skill',
    capital: 'free',
    region: 'global',
    title: 'Free skill: price your time before you undercharge',
    beats: [
      'Undercharging is a silent leak.',
      'List what the task takes in hours including chat and revisions.',
      'Pick a minimum you will not go below this month.',
      'Say the number calmly — if they walk away, you protected your time.'
    ],
    cta: 'Write your minimum rate in your notes app now.',
    link: null,
    tags: ['#Freelancing', '#Students', '#MoneySkills', '#Shorts']
  },
  {
    id: 'skill_library_free',
    type: 'skill',
    capital: 'free',
    region: 'global',
    title: 'Legal free hack: learn a skill with free public resources',
    beats: [
      'You do not need a paid course to start a basic skill.',
      'Pick one skill: Canva layouts, Excel basics, or clear writing.',
      'Use free official docs, YouTube education channels, or library Wi‑Fi practice blocks.',
      'Prove it with one small sample you can show — not a certificate stack.'
    ],
    cta: 'Block one focused practice hour this week.',
    link: null,
    tags: ['#Learn', '#FreeSkills', '#Students', '#Shorts']
  },
  {
    id: 'skill_airtime_budget',
    type: 'skill',
    capital: 'cheap',
    region: 'nigeria',
    title: 'Cheap habit: separate airtime and data from savings',
    beats: [
      'Mixing airtime and savings hides the real leak.',
      'Create two pockets in your mind or wallet: spend and save.',
      'Top up only from the spend pocket.',
      'Even two hundred naira moved weekly trains the muscle.'
    ],
    cta: 'Split spend and save before your next top-up.',
    link: 'lanecash',
    tags: ['#Nigeria', '#Students', '#SaveMoney', '#MoneyHabits', '#Shorts']
  },
  {
    id: 'skill_invest_basics_only',
    type: 'skill',
    capital: 'free',
    region: 'global',
    title: 'Free skill: understand investing words before you put money',
    beats: [
      'Investing starts with vocabulary, not with sending money to a stranger.',
      'Learn what risk, return, and time horizon mean in plain English.',
      'Never buy what you cannot explain to a friend in one minute.',
      'Practice the idea first — capital comes after clarity.'
    ],
    cta: 'Explain one investing word to yourself out loud today.',
    link: 'xenvest',
    tags: ['#InvestingBasics', '#Students', '#FinancialLiteracy', '#Shorts']
  },
  // —— TRAPS ——
  {
    id: 'trap_guaranteed_returns',
    type: 'trap',
    capital: 'free',
    region: 'nigeria',
    title: 'Trap: anyone promising guaranteed high returns',
    beats: [
      'Guaranteed high returns are a classic student trap.',
      'Real investments can lose money — that is normal risk.',
      'If they rush you on WhatsApp and ask for upfront fees, walk away.',
      'Your defense is slow questions and zero urgency.'
    ],
    cta: 'If it sounds guaranteed and urgent, it is not for you.',
    link: null,
    tags: ['#ScamAwareness', '#Nigeria', '#Students', '#MoneySafety', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'trap_pay_to_work',
    type: 'trap',
    capital: 'free',
    region: 'global',
    title: 'Trap: pay-to-work and fake agent fees',
    beats: [
      'Real jobs rarely ask you to pay before you earn.',
      'Fake agents sell hope with registration fees.',
      'Ask for a written role, company footprint, and time to verify.',
      'No clear employer trail means no payment from you.'
    ],
    cta: 'Never pay to start a job you have not verified.',
    link: null,
    tags: ['#JobScam', '#Students', '#MoneySafety', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'trap_lifestyle_flex',
    type: 'trap',
    capital: 'free',
    region: 'global',
    title: 'Trap: copying flex lifestyles on a student budget',
    beats: [
      'Online flex is not a money plan.',
      'Compare your real week: fees, food, data — not someone else highlights.',
      'One quiet savings win beats a public purchase for status.',
      'Protect your future self from today’s performance.'
    ],
    cta: 'Skip one status spend this week on purpose.',
    link: null,
    tags: ['#MoneyMindset', '#Students', '#SaveMoney', '#Shorts']
  },
  // —— NIGERIA-FIRST EARNING (cheap/free start) ——
  {
    id: 'earn_campus_skill',
    type: 'income',
    capital: 'free',
    region: 'nigeria',
    title: 'Nigeria-first: sell a campus skill with zero capital',
    beats: [
      'Start where trust already exists — your campus or street.',
      'Pick a skill you already do: typing, phone setup, photo edits, tutoring one subject.',
      'Offer a fixed small price and a clear delivery time.',
      'Five honest deliveries beat twenty empty plans.'
    ],
    cta: 'Name the skill and message three people today.',
    link: 'lanecash',
    tags: ['#Nigeria', '#CampusHustle', '#Students', '#SideIncome', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'earn_content_repurpose',
    type: 'income',
    capital: 'free',
    region: 'nigeria',
    title: 'Free start: turn school notes into simple paid help',
    beats: [
      'If you already rewrite notes, package that help.',
      'Offer clear summaries or exam revision maps for one course you finished.',
      'Keep it original — never sell pirated materials or leaked papers.',
      'Legal help only: your own explanations and study structure.'
    ],
    cta: 'Draft one revision map for a course you know well.',
    link: null,
    tags: ['#Students', '#Nigeria', '#StudyTok', '#SideIncome', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'earn_micro_service',
    type: 'income',
    capital: 'cheap',
    region: 'nigeria',
    title: 'Cheap start: one micro-service with phone data only',
    beats: [
      'Many micro-services need data, not a shop.',
      'Examples: form filling help, basic design on free Canva, voice-over practice for small creators.',
      'State price, timeline, and what is not included.',
      'Deliver once, collect feedback, then raise price slowly.'
    ],
    cta: 'Pick one micro-service and write the offer text.',
    link: 'lanecash',
    tags: ['#Nigeria', '#Freelance', '#Students', '#SideIncome', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'earn_global_localized',
    type: 'income',
    capital: 'free',
    region: 'global',
    title: 'Global idea, local truth: freelance writing samples',
    beats: [
      'Global platforms favor proof, not hopes.',
      'Write three short samples in niches you understand — student life, local reviews, simple how-tos.',
      'Account for payment rails and fees before you celebrate a client.',
      'Start with portfolio quality — paid work follows proof.'
    ],
    cta: 'Finish one sample this week, not ten half ideas.',
    link: null,
    tags: ['#Freelance', '#Writing', '#Students', '#RemoteWork', '#Shorts'],
    needDisclaimer: true
  },
  {
    id: 'earn_no_scam_crypto',
    type: 'trap',
    capital: 'free',
    region: 'nigeria',
    title: 'Trap: “send crypto / gift cards to unlock money”',
    beats: [
      'If someone asks you to send value to unlock a larger sum, stop.',
      'Gift cards and crypto send-outs are common recovery scams.',
      'Banks and platforms will not ask you this way for prizes.',
      'Protect classmates — share the pattern, not the panic.'
    ],
    cta: 'Save this pattern so you recognize it fast.',
    link: null,
    tags: ['#ScamAwareness', '#Nigeria', '#Students', '#MoneySafety', '#Shorts'],
    needDisclaimer: true
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
  const cutoff = Date.now() - 45 * 24 * 3600 * 1000;
  data.used = (data.used || []).filter((x) => x.ts > cutoff);
  fs.writeFileSync(DEDUP, JSON.stringify(data, null, 2));
}

function pickLesson() {
  const d = loadDedup();
  const recent = new Set((d.used || []).map((x) => x.id));
  let pool = LESSONS.filter((l) => !recent.has(l.id));
  if (!pool.length) pool = LESSONS.slice();

  // Prefer type by slot
  const want =
    slotMode.includes('trap')
      ? 'trap'
      : slotMode.includes('income') || slotMode.includes('earn')
        ? 'income'
        : 'skill';
  let typed = pool.filter((l) => l.type === want);
  if (!typed.length) typed = pool.filter((l) => l.type === 'skill');
  if (!typed.length) typed = pool;

  // Prefer nigeria then free capital
  typed.sort((a, b) => {
    const score = (x) => (x.region === 'nigeria' ? 2 : 0) + (x.capital === 'free' ? 1 : 0);
    return score(b) - score(a);
  });
  const chosen = typed[Math.floor(Math.random() * Math.min(3, typed.length))] || typed[0];
  d.used = d.used || [];
  d.used.push({ id: chosen.id, ts: Date.now(), title: chosen.title, type: chosen.type });
  saveDedup(d);
  return chosen;
}

function linkLine(lesson) {
  if (lesson.link === 'xenvest') {
    return 'When you study investing basics further, a learning-friendly tool reference: https://xenvest.name.ng — education first, not a promise of returns.';
  }
  if (lesson.link === 'lanecash') {
    return 'For simple money-flow practice ideas, see https://lanecash.name.ng — only if it fits the skill you just learned.';
  }
  return '';
}

function buildDescription(lesson) {
  const steps = lesson.beats.map((b, i) => `${i + 1}. ${b}`).join('\n');
  const parts = [
    lesson.beats[0],
    '',
    steps,
    '',
    lesson.cta,
    '',
    linkLine(lesson),
    lesson.needDisclaimer || lesson.type === 'income' || lesson.type === 'trap' ? DISCLAIMER : DISCLAIMER,
    '',
    (lesson.tags || []).join(' ')
  ];
  return parts.filter((p, i, arr) => p !== '' || arr[i - 1] !== '').join('\n').trim();
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) =>
      https
        .get(u, { headers: { 'User-Agent': 'FinBlueprintBot/2.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location);
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        })
        .on('error', reject);
    get(url);
  });
}

async function edgeTtsOnly(text, outMp3) {
  try {
    const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
    await synthesizeSpeechResilient(text, outMp3, {
      voice: 'en-US-AndrewNeural',
      rate: '-5%',
      pitch: '-10Hz',
      emotionProfile: 'educator',
      timeout: 25000
    });
    if (fs.existsSync(outMp3) && fs.statSync(outMp3).size > 1000) return;
  } catch (e) {
    console.warn('[Fin Edu] resilient TTS:', e.message);
  }
  let EdgeTTS;
  try {
    EdgeTTS = require('node-edge-tts').EdgeTTS || require('node-edge-tts');
  } catch (_) {
    throw new Error('node-edge-tts required');
  }
  for (let a = 1; a <= 3; a++) {
    try {
      const tts = new EdgeTTS({
        voice: 'en-US-AndrewNeural',
        lang: 'en-US',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        rate: '-5%',
        pitch: '-10Hz',
        timeout: 25000
      });
      await tts.ttsPromise(text, outMp3);
      if (fs.existsSync(outMp3) && fs.statSync(outMp3).size > 1000) return;
    } catch (e) {
      console.warn('[Fin Edu] TTS attempt', a, e.message);
      await new Promise((r) => setTimeout(r, 1200 * a));
    }
  }
  throw new Error('Edge TTS failed');
}

function escapeAss(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

function buildAss(beats, cta, durationSec) {
  const chunks = [...beats, cta].filter(Boolean);
  const each = durationSec / chunks.length;
  const fmt = (t) => {
    const cs = Math.floor((t % 1) * 100);
    const s = Math.floor(t) % 60;
    const m = Math.floor(t / 60) % 60;
    const h = Math.floor(t / 3600);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const lines = chunks.map((text, i) => {
    const t0 = i * each;
    const t1 = Math.min(durationSec, (i + 1) * each);
    return `Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,${escapeAss(text)}`;
  });
  return `[Script Info]
Title: Fin Edu
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,58,&H00FFFFFF,&H000000FF,&H0000E0FF,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,5,50,50,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function main() {
  console.log('\n=== Fin Education short | mode=', slotMode, '===\n');
  const lesson = pickLesson();
  console.log('[Fin Edu] picked', lesson.id, lesson.type, lesson.capital, lesson.region);
  console.log('[Fin Edu] title', lesson.title);

  const narration = [...lesson.beats, lesson.cta].join(' ');
  const stamp = Date.now();
  const voicePath = path.join(ART, `voice_${stamp}.mp3`);
  const imgPath = path.join(ART, `img_${stamp}.jpg`);
  const bgmPath = path.join(ART, `bgm_${stamp}.wav`);
  const assPath = path.join(ART, `cap_${stamp}.ass`);
  const outPath = path.join(OUT, 'fin_education_latest.mp4');
  const outAlias = path.join(OUT, 'fin_income_latest.mp4');

  const imgs = [
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1080&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80'
  ];
  try {
    await download(imgs[Math.floor(Math.random() * imgs.length)], imgPath);
  } catch (e) {
    console.warn('[Fin Edu] image download failed, solid bg', e.message);
    execSync(
      `ffmpeg -y -f lavfi -i color=c=0x0f172a:s=1080x1920:d=1 -frames:v 1 "${imgPath}"`,
      { stdio: 'pipe' }
    );
  }

  await edgeTtsOnly(narration, voicePath);
  console.log('[Fin Edu] TTS OK', fs.statSync(voicePath).size);

  let duration = 28;
  try {
    const probe = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, {
      encoding: 'utf8'
    }).trim();
    duration = Math.max(18, Math.min(48, parseFloat(probe) + 0.6));
  } catch (_) {}

  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=120:duration=${duration}" -f lavfi -i "sine=frequency=180:duration=${duration}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=700,volume=0.06" "${bgmPath}"`,
    { stdio: 'pipe' }
  );

  fs.writeFileSync(assPath, buildAss(lesson.beats, lesson.cta, duration), 'utf8');
  const assEsc = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");

  const filter = [
    `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(duration * 30)}:s=1080x1920:fps=30[vbase]`,
    `[vbase]ass='${assEsc}'[vout]`,
    `[1:a]volume=1.2[a0]`,
    `[2:a]volume=1.0[a1]`,
    `[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`
  ].join(';');

  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -shortest -pix_fmt yuv420p -t ${duration} "${outPath}"`,
    { stdio: 'inherit' }
  );
  fs.copyFileSync(outPath, outAlias);
  fs.writeFileSync(
    path.join(OUT, 'fin_education_meta.json'),
    JSON.stringify(
      {
        title: lesson.title,
        description: buildDescription(lesson),
        type: lesson.type,
        capital: lesson.capital,
        region: lesson.region,
        tags: lesson.tags,
        link: lesson.link,
        id: lesson.id
      },
      null,
      2
    )
  );
  console.log('[Fin Edu] Rendered', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      const res = await uploadYouTubeShort({
        videoPath: outPath,
        title: lesson.title.slice(0, 95),
        description: buildDescription(lesson),
        tags: (lesson.tags || []).map((t) => String(t).replace(/^#/, '')),
        channelId: 'finance_saas'
      });
      console.log('[Fin Edu] YouTube', res?.id || res);
    } catch (e) {
      console.warn('[Fin Edu] Upload notice:', e.message);
    }
  } else {
    console.log('[Fin Edu] DRY_RUN — no upload');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
