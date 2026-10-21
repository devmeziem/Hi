#!/usr/bin/env node
/**
 * Archie static FB/IG — ZERO AI
 * Formats inspired by high-engagement science pages:
 *  - quiz: question + A/B/C/D (answer only in caption)
 *  - challenge: one big question + short options
 *  - quote: scientist line on dark bar (short)
 *  - news: photo + ONE bold claim line
 * Image stays scannable; teaching depth lives in caption.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const ART = path.join(process.cwd(), 'test_artifacts');
const OUT_DIR = path.join(ART, 'infocards');
const HIST = path.join(process.cwd(), 'data', 'archie_static_history.json');
const LATEST_PNG = path.join(ART, 'infocard_latest.png');
const MANIFEST = path.join(ART, 'infocard_manifest.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(HIST), { recursive: true });

const BANK = [
  // QUIZ
  {
    id: 'quiz_schrodinger',
    format: 'quiz',
    lane: 'science',
    title: 'Wave equation for electrons',
    question: 'Which scientist developed the wave equation for electrons?',
    options: ['Schrödinger', 'Dalton', 'Rutherford', 'Bohr'],
    answer: 'A',
    answerText: 'Schrödinger — his equation describes how electron waves behave.',
    captionExtra: 'Quantum ideas start simple: particles can act like waves.',
    tags: ['#ScienceQuiz', '#Physics', '#ArchieExplains', '#DidYouKnow']
  },
  {
    id: 'quiz_event_horizon',
    format: 'quiz',
    lane: 'science',
    title: 'Black hole event horizon',
    question: 'What happens when something crosses a black hole’s event horizon?',
    options: [
      'It can no longer escape the black hole’s gravity',
      'It instantly turns into a star',
      'It travels faster than light and escapes',
      'It becomes invisible forever to everyone'
    ],
    answer: 'A',
    answerText: 'A — past the event horizon, escape needs faster-than-light speed.',
    captionExtra: 'From outside, light from deeper in cannot climb out to us.',
    tags: ['#SpaceScience', '#BlackHoles', '#ArchieExplains', '#ScienceQuiz']
  },
  {
    id: 'quiz_wifi',
    format: 'quiz',
    lane: 'tech',
    title: 'What Wi-Fi actually is',
    question: 'Wi-Fi signals are best described as…',
    options: ['Radio waves', 'Sound waves', 'Gravity waves', 'Visible laser beams only'],
    answer: 'A',
    answerText: 'A — Wi-Fi is radio. Walls and distance absorb or bounce it.',
    captionExtra: 'That is why a metal cabinet kills signal fast.',
    tags: ['#TechQuiz', '#WiFi', '#ArchieExplains']
  },
  {
    id: 'quiz_soap',
    format: 'quiz',
    lane: 'science',
    title: 'How soap cleans',
    question: 'Soap lifts grease mainly because its molecules…',
    options: [
      'Have water-loving and oil-loving ends',
      'Destroy all bacteria instantly',
      'Turn oil into pure water',
      'Heat the water above boiling'
    ],
    answer: 'A',
    answerText: 'A — soap bridges oil and water so grease can rinse away.',
    captionExtra: 'Friction + time still matter.',
    tags: ['#ScienceQuiz', '#Chemistry', '#ArchieExplains']
  },
  // CHALLENGE / NEWS claim
  {
    id: 'news_quantum_error',
    format: 'news',
    lane: 'tech',
    title: 'Quantum error challenge',
    claim: 'Fragile quantum bits are the big reliability problem — better protection could change everything.',
    hook: 'Quantum computers fail easily when their bits get disturbed.',
    fact: 'Researchers explore new ways to protect quantum information (including exotic states of matter) so error rates drop.',
    takeaway: 'The race is not only speed — it is stability.',
    tags: ['#Quantum', '#TechNews', '#ArchieExplains']
  },
  {
    id: 'news_ssd',
    format: 'news',
    lane: 'tech',
    title: 'Why SSDs feel instant',
    claim: 'No spinning disk. No moving head. That is why SSDs feel so fast.',
    hook: 'Upgrading storage often feels like a new computer.',
    fact: 'Hard drives mechanically seek data. SSDs read flash memory with no moving parts, so random access is much quicker.',
    takeaway: 'Speed is architecture — not only capacity.',
    tags: ['#TechExplained', '#Computers', '#ArchieExplains']
  },
  // QUOTES (public classic lines)
  {
    id: 'quote_bohr',
    format: 'quote',
    lane: 'science',
    title: 'Niels Bohr',
    quote: 'No phenomenon is a phenomenon until it is an observed phenomenon.',
    who: 'Niels Bohr',
    captionExtra:
      'Bohr helped shape quantum theory. Observation and measurement sit at the center of how we talk about the quantum world.',
    tags: ['#Physics', '#ScienceQuotes', '#ArchieExplains']
  },
  {
    id: 'quote_feynman',
    format: 'quote',
    lane: 'science',
    title: 'Richard Feynman',
    quote: 'What I cannot create, I do not understand.',
    who: 'Richard Feynman',
    captionExtra: 'A sharp test for learning: if you can rebuild the idea simply, you understand it.',
    tags: ['#ScienceQuotes', '#Learn', '#ArchieExplains']
  },
  {
    id: 'quote_einstein',
    format: 'quote',
    lane: 'science',
    title: 'Albert Einstein',
    quote: 'The important thing is not to stop questioning.',
    who: 'Albert Einstein',
    captionExtra: 'Curiosity is a skill. Keep the next question ready.',
    tags: ['#ScienceQuotes', '#Curiosity', '#ArchieExplains']
  }
];

function loadHist() {
  try {
    return JSON.parse(fs.readFileSync(HIST, 'utf8'));
  } catch {
    return { used: [] };
  }
}
function saveHist(h) {
  h.used = (h.used || []).slice(-120);
  fs.writeFileSync(HIST, JSON.stringify(h, null, 2));
}
function pickItem() {
  const h = loadHist();
  const recent = new Set((h.used || []).map((x) => x.id));
  let pool = BANK.filter((x) => !recent.has(x.id));
  if (!pool.length) pool = BANK.slice();
  // Prefer format rotation by hour
  const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);
  const prefer = hour % 3 === 0 ? 'quiz' : hour % 3 === 1 ? 'quote' : 'news';
  const forced = (process.env.CARD_FORMAT || '').toLowerCase();
  const want = forced || prefer;
  let typed = pool.filter((x) => x.format === want);
  if (!typed.length) typed = pool;
  const item = typed[Math.floor(Math.random() * typed.length)];
  h.used.push({ id: item.id, at: new Date().toISOString(), format: item.format });
  saveHist(h);
  return item;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, n) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > n) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildCaption(item) {
  const tags = (item.tags || []).join(' ');
  if (item.format === 'quiz') {
    return [
      item.question,
      '',
      ...item.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`),
      '',
      `Answer: ${item.answerText}`,
      item.captionExtra || '',
      '',
      '— Archie',
      '',
      tags
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (item.format === 'quote') {
    return [`“${item.quote}”`, `— ${item.who}`, '', item.captionExtra || '', '', '— Archie', '', tags]
      .filter(Boolean)
      .join('\n');
  }
  // news
  return [item.hook, '', item.fact, '', 'Takeaway: ' + item.takeaway, '', '— Archie', '', tags]
    .filter(Boolean)
    .join('\n');
}

function quizSvg(item) {
  const qLines = wrap(item.question, 34);
  const qTs = qLines
    .map((ln, i) => `<tspan x="540" dy="${i === 0 ? 0 : 42}">${escapeXml(ln)}</tspan>`)
    .join('');
  const opts = item.options
    .map((o, i) => {
      const letter = String.fromCharCode(65 + i);
      const y = 620 + i * 110;
      return `
  <rect x="80" y="${y}" width="920" height="90" rx="18" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <circle cx="130" cy="${y + 45}" r="28" fill="#0ea5e9"/>
  <text x="130" y="${y + 54}" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="28" font-weight="700" fill="#fff">${letter}</text>
  <text x="180" y="${y + 54}" font-family="DejaVu Sans, Arial" font-size="28" fill="#0f172a">${escapeXml(o.slice(0, 40))}</text>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#f0f9ff"/>
  <rect x="24" y="24" width="1032" height="1302" rx="28" fill="none" stroke="#0284c7" stroke-width="8"/>
  <text x="80" y="100" font-family="DejaVu Sans, Arial" font-size="26" font-weight="700" fill="#0369a1">ARCHIE · SCIENCE QUIZ</text>
  <text x="540" y="200" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="40" font-weight="700" fill="#0f172a">${qTs}</text>
  <rect x="120" y="360" width="840" height="160" rx="20" fill="#e0f2fe"/>
  <text x="540" y="455" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="28" fill="#0369a1">Pick A · B · C · D</text>
  ${opts}
  <text x="540" y="1280" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="24" fill="#64748b">Answer in the caption ↓</text>
</svg>`;
}

function quoteSvg(item) {
  const lines = wrap(`“${item.quote}”`, 28);
  const ts = lines
    .map((ln, i) => `<tspan x="540" dy="${i === 0 ? 0 : 48}">${escapeXml(ln)}</tspan>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0b1220"/>
  <rect x="0" y="780" width="1080" height="570" fill="#000000"/>
  <text x="540" y="880" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="36" fill="#f8fafc">${ts}</text>
  <text x="540" y="1150" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="30" fill="#67e8f9">— ${escapeXml(item.who)}</text>
  <text x="80" y="80" font-family="DejaVu Sans, Arial" font-size="24" fill="#22d3ee">ARCHIE</text>
</svg>`;
}

function newsSvg(item) {
  const lines = wrap(item.claim, 30);
  const ts = lines
    .map((ln, i) => `<tspan x="540" dy="${i === 0 ? 0 : 44}">${escapeXml(ln)}</tspan>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#g)"/>
  <circle cx="540" cy="420" r="160" fill="#0b1220" stroke="#38bdf8" stroke-width="5"/>
  <text x="540" y="440" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="56" font-weight="700" fill="#38bdf8">⚛</text>
  <rect x="0" y="900" width="1080" height="450" fill="#000000" opacity="0.85"/>
  <text x="540" y="1000" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="34" font-weight="700" fill="#ffffff">${ts}</text>
  <text x="80" y="80" font-family="DejaVu Sans, Arial" font-size="24" fill="#67e8f9">ARCHIE · ${escapeXml(item.lane.toUpperCase())}</text>
</svg>`;
}

function renderSvg(item) {
  if (item.format === 'quiz') return quizSvg(item);
  if (item.format === 'quote') return quoteSvg(item);
  return newsSvg(item);
}

async function main() {
  const item = pickItem();
  console.log(`[Archie Static] format=${item.format} id=${item.id}`);
  const svgPath = path.join(OUT_DIR, `${item.id}.svg`);
  const pngPath = path.join(OUT_DIR, `${item.id}.png`);
  fs.writeFileSync(svgPath, renderSvg(item));
  execSync(`ffmpeg -y -i "${svgPath}" -vf scale=1080:1350 "${pngPath}"`, { stdio: 'pipe' });
  fs.copyFileSync(pngPath, LATEST_PNG);
  const caption = buildCaption(item);
  const manifest = {
    id: item.id,
    title: item.title,
    format: item.format,
    category: item.lane,
    pngPath: LATEST_PNG,
    fbCaption: caption + '\n\nEducational · Archie Explains',
    igCaption: caption,
    tags: item.tags,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log('[Archie Static] OK', item.format, item.title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
