#!/usr/bin/env node
/**
 * Fin Blueprint — Education shorts (students / under-25)
 * Modes: concept | skill | trap | plan | income
 * Teaching arc: definition → real-life example → types/options → minimum to start → action → disclaimer
 * SEO-friendly titles/descriptions; natural links to xenvest.name.ng / lanecash.name.ng
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'fin_edu');
const DEDUP = path.join(process.cwd(), 'data', 'fin_income_dedup.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
let slotMode = String(process.env.FIN_SLOT_MODE || process.env.VIDEO_MODE || 'auto').toLowerCase();

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

const DISCLAIMER =
  'Educational content only — not financial advice. Markets and income can go up or down. Never send money to strangers promising guaranteed returns. Verify everything yourself.';

const LESSONS = [
  // —— CONCEPTS (teach keyword properly) ——
  {
    id: 'concept_what_is_crypto',
    type: 'concept',
    title: 'What is crypto? Simple definition students actually need',
    keyword: 'cryptocurrency',
    beats: [
      'Crypto is digital value stored on a shared public ledger called a blockchain.',
      'Real-life picture: like a group notebook everyone can read, but almost nobody can secretly erase a line.',
      'Types you will hear: Bitcoin is often treated like digital gold; stablecoins try to track a currency; other coins are projects with different risks.',
      'Minimum to start learning: zero naira — read definitions and never buy under pressure.',
      'If someone promises guaranteed profit from crypto on WhatsApp, that is a red flag, not a lesson.'
    ],
    cta: 'Learn the word first. Buying can wait.',
    tags: ['#CryptoBasics', '#Students', '#FinancialLiteracy', '#Nigeria', '#Shorts', '#MoneyEducation'],
    needDisclaimer: true,
    link: 'xenvest'
  },
  {
    id: 'concept_what_is_budget',
    type: 'concept',
    title: 'What a budget really is (not a punishment)',
    keyword: 'budget',
    beats: [
      'A budget is a written plan for your money before the month spends it for you.',
      'Real-life example: you list school data, food, and transport — then decide the leftovers.',
      'Types: zero-based means every naira has a job; 50-30-20 splits needs, wants, and savings as a starting map.',
      'Minimum to start: phone notes and three categories today.',
      'A budget does not make you poor — untracked spending does.'
    ],
    cta: 'Open notes and name three money buckets now.',
    tags: ['#Budget', '#Students', '#MoneySkills', '#FinancialLiteracy', '#Shorts'],
    needDisclaimer: false,
    link: null
  },
  {
    id: 'concept_interest',
    type: 'concept',
    title: 'Interest explained: why debt grows and savings can grow',
    keyword: 'interest',
    beats: [
      'Interest is the price of borrowed money — or the reward for lending or saving.',
      'Real-life: a loan can add extra cost each month; a savings balance can earn a small reward depending on the product.',
      'Types: simple interest on the original amount; compound interest on amount plus past interest.',
      'Minimum to start: read the rate and the fees before you sign anything.',
      'High interest with pressure is a warning, not a flex.'
    ],
    cta: 'Next offer you see — ask for the rate in writing.',
    tags: ['#Interest', '#Debt', '#Savings', '#Students', '#FinancialLiteracy', '#Shorts'],
    needDisclaimer: true,
    link: null
  },
  {
    id: 'concept_inflation',
    type: 'concept',
    title: 'Inflation in plain English: why prices feel heavier',
    keyword: 'inflation',
    beats: [
      'Inflation means the same money buys less over time when prices rise.',
      'Real-life: transport and food can climb while your allowance stays flat.',
      'It is not always one villain — supply, demand, currency pressure, and costs all play roles.',
      'Minimum response skill: track two recurring costs for a month so you see the change clearly.',
      'Awareness beats panic posts.'
    ],
    cta: 'Write last month vs this month for one cost you pay weekly.',
    tags: ['#Inflation', '#Nigeria', '#Students', '#FinancialLiteracy', '#Shorts'],
    needDisclaimer: false,
    link: null
  },
  // —— PLAN style (if I were in this situation) ——
  {
    id: 'plan_5_moves_student',
    type: 'plan',
    title: 'If I were a student with little money: 5 moves this week',
    keyword: 'student money plan',
    beats: [
      'One: list every income and every must-pay cost — clarity first.',
      'Two: cut one optional spend and move that amount to a separate savings pocket.',
      'Three: pick one free skill you can offer on campus or online.',
      'Four: refuse any deal that needs upfront fees for guaranteed profit.',
      'Five: review the plan every Sunday for ten minutes — consistency beats intensity.'
    ],
    cta: 'Do move one before tonight ends.',
    tags: ['#StudentMoney', '#MoneyPlan', '#Nigeria', '#FinancialLiteracy', '#Shorts'],
    needDisclaimer: true,
    link: 'lanecash'
  },
  {
    id: 'plan_first_10k',
    type: 'plan',
    title: 'If I only had a small amount to protect: what I would do first',
    keyword: 'emergency buffer',
    beats: [
      'I would not start with complex products.',
      'First job of money is survival — a small emergency buffer for real needs.',
      'I would separate spending money from buffer money so I do not touch it by habit.',
      'I would learn definitions before I buy anything sold with hype.',
      'I would treat urgency and guaranteed returns as exit signs.'
    ],
    cta: 'Separate one small buffer today — even if it is tiny.',
    tags: ['#EmergencyFund', '#Students', '#MoneySafety', '#Shorts', '#Nigeria'],
    needDisclaimer: true,
    link: 'xenvest'
  },
  // —— SKILLS ——
  {
    id: 'skill_track_3days',
    type: 'skill',
    title: 'Free money skill: track every spend for 3 days',
    keyword: 'spending tracker',
    beats: [
      'You do not need capital to start control.',
      'For three days write every spend in phone notes — even small ones.',
      'Circle one leak you can cut without pain.',
      'Move that amount to a savings pocket the same day.'
    ],
    cta: 'Start the three-day note today.',
    tags: ['#MoneySkills', '#Budget', '#Students', '#Shorts', '#Nigeria'],
    needDisclaimer: false,
    link: null
  },
  {
    id: 'skill_one_line_offer',
    type: 'skill',
    title: 'Free skill: write a one-line offer you can sell',
    keyword: 'side hustle offer',
    beats: [
      'One clear offer beats a perfect website.',
      'Write: I help X do Y in Z time.',
      'Example: I help classmates free phone storage in thirty minutes.',
      'Send it to ten people who already know you.'
    ],
    cta: 'Send the one-line offer before the day ends.',
    tags: ['#SideHustle', '#Students', '#Freelance', '#Nigeria', '#Shorts'],
    needDisclaimer: true,
    link: 'lanecash'
  },
  // —— TRAPS ——
  {
    id: 'trap_guaranteed_returns',
    type: 'trap',
    title: 'Trap: guaranteed returns and urgent WhatsApp investments',
    keyword: 'investment scam',
    beats: [
      'Real markets do not guarantee smooth private profits to strangers online.',
      'Urgency plus secrecy plus upfront payment is a classic trap pattern.',
      'Ask slow questions. Demand written terms. Walk away when they rush you.',
      'Your defense is patience and verification.'
    ],
    cta: 'If it is guaranteed and urgent, it is not for you.',
    tags: ['#ScamAwareness', '#Nigeria', '#Students', '#MoneySafety', '#Shorts'],
    needDisclaimer: true,
    link: null
  },
  {
    id: 'trap_pay_to_work',
    type: 'trap',
    title: 'Trap: pay-to-work and fake agent fees',
    keyword: 'job scam',
    beats: [
      'Real jobs rarely ask you to pay before you earn.',
      'Fake agents sell hope with registration fees.',
      'Ask for a written role and a company you can verify.',
      'No clear employer trail means no payment from you.'
    ],
    cta: 'Never pay to start a job you have not verified.',
    tags: ['#JobScam', '#Students', '#MoneySafety', '#Shorts'],
    needDisclaimer: true,
    link: null
  },
  // —— INCOME ——
  {
    id: 'earn_campus_skill',
    type: 'income',
    title: 'Nigeria-first: sell a campus skill with near-zero capital',
    keyword: 'campus hustle',
    beats: [
      'Start where trust already exists — campus or street.',
      'Pick a skill you already do: typing, phone setup, photo edits, tutoring.',
      'Offer a fixed small price and clear delivery time.',
      'Five honest deliveries beat twenty empty plans.'
    ],
    cta: 'Name the skill and message three people today.',
    tags: ['#Nigeria', '#CampusHustle', '#Students', '#SideIncome', '#Shorts'],
    needDisclaimer: true,
    link: 'lanecash'
  }
];

function loadDedup() {
  try {
    return JSON.parse(fs.readFileSync(DEDUP, 'utf8'));
  } catch {
    return { used: [] };
  }
}
function saveDedup(d) {
  d.used = (d.used || []).slice(-80);
  fs.writeFileSync(DEDUP, JSON.stringify(d, null, 2));
}

function pickLesson() {
  const d = loadDedup();
  const recent = new Set((d.used || []).map((x) => x.id));
  let pool = LESSONS.filter((x) => !recent.has(x.id));
  if (!pool.length) pool = LESSONS.slice();

  // Route by mode
  const mode = slotMode === 'auto' || !slotMode ? null : slotMode;
  if (mode === 'skill') pool = pool.filter((x) => x.type === 'skill' || x.type === 'plan') || pool;
  if (mode === 'trap') pool = pool.filter((x) => x.type === 'trap') || pool;
  if (mode === 'income') pool = pool.filter((x) => x.type === 'income') || pool;
  if (mode === 'concept' || mode === 'teach') pool = pool.filter((x) => x.type === 'concept' || x.type === 'plan') || pool;
  // Default mix: prefer concept/plan more often for teaching
  if (!mode || mode === 'auto') {
    const hour = new Date().getUTCHours();
    const prefer =
      hour % 5 === 0 ? 'concept' : hour % 5 === 1 ? 'plan' : hour % 5 === 2 ? 'skill' : hour % 5 === 3 ? 'trap' : 'income';
    const typed = pool.filter((x) => x.type === prefer);
    if (typed.length) pool = typed;
  }

  const item = pool[Math.floor(Math.random() * pool.length)];
  d.used.push({ id: item.id, at: new Date().toISOString(), type: item.type });
  saveDedup(d);
  return item;
}

function linkLine(link) {
  if (link === 'xenvest') return 'Learn more long-term thinking tools at xenvest.name.ng when you are ready.';
  if (link === 'lanecash') return 'For practical hustle structure ideas see lanecash.name.ng — still verify everything yourself.';
  return '';
}

function buildSeoDescription(item) {
  const lines = [];
  lines.push(item.title);
  lines.push('');
  lines.push(`Keyword focus: ${item.keyword}`);
  lines.push('');
  lines.push(...item.beats);
  lines.push('');
  lines.push(item.cta);
  const l = linkLine(item.link);
  if (l) {
    lines.push('');
    lines.push(l);
  }
  if (item.needDisclaimer !== false) {
    lines.push('');
    lines.push(DISCLAIMER);
  }
  lines.push('');
  lines.push((item.tags || []).join(' '));
  // Algo-friendly extras
  lines.push('');
  lines.push('Subscribe for practical money education for students and young adults.');
  return lines.join('\n').slice(0, 4800);
}

function buildSpoken(item) {
  return [...item.beats, item.cta].join(' ');
}

function edgeTts(text, outWav) {
  const voices = ['en-US-AndrewNeural', 'en-US-GuyNeural', 'en-GB-RyanNeural'];
  const voice = process.env.FIN_VOICE || voices[0];
  const rate = process.env.FIN_RATE || '+0%';
  const pitch = process.env.FIN_PITCH || '-5Hz';
  try {
    execSync(
      `npx --yes edge-tts --voice ${voice} --rate=${rate} --pitch=${pitch} --text ${JSON.stringify(text)} --write-media ${JSON.stringify(outWav)}`,
      { stdio: 'pipe', timeout: 120000 }
    );
    return fs.existsSync(outWav) && fs.statSync(outWav).size > 1000;
  } catch {
    return false;
  }
}

function renderVideo(item, wav) {
  const mp4 = path.join(OUT, 'fin_education_latest.mp4');
  const title = item.title.replace(/:/g, '\\:').replace(/'/g, "'\\''").slice(0, 60);
  // Clean vertical card — keyword on screen
  const vf = [
    `color=c=0x0b1220:s=1080x1920:d=1`,
    `drawbox=x=60:y=200:w=960:h=400:color=0x12203a:t=fill`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='FIN BLUEPRINT':fontsize=36:fontcolor=0x38bdf8:x=(w-text_w)/2:y=240`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${title}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=320:text_align=center`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Education not advice':fontsize=28:fontcolor=0x94a3b8:x=(w-text_w)/2:y=520`
  ];
  // duration from wav
  let dur = 28;
  try {
    const pr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${wav}"`, {
      encoding: 'utf8'
    });
    dur = Math.max(12, Math.min(58, parseFloat(pr) || 28));
  } catch {}
  const cmd = `ffmpeg -y -f lavfi -i color=c=0x0b1220:s=1080x1920:d=${dur.toFixed(2)} -i "${wav}" -vf "drawbox=x=40:y=160:w=1000:h=520:color=0x12203a@0.95:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='FIN BLUEPRINT':fontsize=34:fontcolor=0x38bdf8:x=(w-text_w)/2:y=200,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${title}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=280" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${mp4}"`;
  execSync(cmd, { stdio: 'pipe' });
  return { mp4, dur };
}

async function main() {
  const item = pickLesson();
  console.log('[Fin Edu]', item.type, item.title);
  const spoken = buildSpoken(item);
  const wav = path.join(ART, 'voice.mp3');
  if (!edgeTts(spoken, wav)) {
    // silent fallback tone
    execSync(`ffmpeg -y -f lavfi -i sine=f=440:d=12 -c:a libmp3lame "${wav}"`, { stdio: 'pipe' });
  }
  const { mp4, dur } = renderVideo(item, wav);
  const description = buildSeoDescription(item);
  const meta = {
    title: item.title.slice(0, 95),
    description,
    tags: (item.tags || []).map((t) => t.replace(/^#/, '')),
    type: item.type,
    keyword: item.keyword,
    videoPath: mp4,
    duration: dur,
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, 'fin_education_latest_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(OUT, 'fin_latest_meta.json'), JSON.stringify(meta, null, 2));
  console.log('[Fin Edu] OK', mp4, 'dur', dur);
  console.log(JSON.stringify({ title: meta.title, type: item.type, keyword: item.keyword }, null, 2));

  // Optional YouTube soft upload
  if (!isDry && process.env.SKIP_YT !== '1') {
    try {
      const yt = require('./youtube_channel_dispatcher.cjs');
      if (typeof yt.uploadYouTubeShort === 'function') {
        const r = await yt.uploadYouTubeShort({
          videoPath: mp4,
          title: meta.title,
          description: meta.description,
          tags: meta.tags,
          channelId: 'finance_saas'
        });
        console.log('[Fin Edu] YT', r);
      }
    } catch (e) {
      console.warn('[Fin Edu] YT soft-fail', e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
