#!/usr/bin/env node
/**
 * Archie static FB/IG — quiz / quote / news
 * Visual: real photo background (Unsplash/Picsum) + short on-image text (bottom third)
 * Optional AI only for choosing SHORT screen text (not required)
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
  {
    id: 'quiz_schrodinger',
    format: 'quiz',
    title: 'Wave equation for electrons',
    question: 'Which scientist developed the wave equation for electrons?',
    options: ['Schrödinger', 'Dalton', 'Rutherford', 'Bohr'],
    answer: 'A',
    answerText: 'A — Schrödinger. His equation describes electron waves.',
    screenText: 'Who wrote the electron wave equation?',
    photo: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1080&q=80',
    tags: ['#ScienceQuiz', '#Physics', '#ArchieExplains']
  },
  {
    id: 'quiz_event_horizon',
    format: 'quiz',
    title: 'Black hole event horizon',
    question: 'What happens past a black hole event horizon?',
    options: [
      'Escape needs faster-than-light speed',
      'It becomes a star',
      'It exits as light',
      'Time freezes for everyone else'
    ],
    answer: 'A',
    answerText: 'A — nothing escapes to the outside universe without FTL.',
    screenText: 'Cross an event horizon — then what?',
    photo: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1080&q=80',
    tags: ['#SpaceScience', '#BlackHoles', '#ArchieExplains']
  },
  {
    id: 'news_ssd',
    format: 'news',
    title: 'Why SSDs feel instant',
    claim: 'No spinning disk. No moving head. That is the speed.',
    hook: 'Upgrading storage often feels like a new computer.',
    fact: 'Hard drives seek mechanically. SSDs read flash with no moving parts.',
    takeaway: 'Architecture beats raw capacity marketing.',
    screenText: 'Why SSDs feel instant',
    photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&q=80',
    tags: ['#TechExplained', '#Computers', '#ArchieExplains']
  },
  {
    id: 'quote_bohr',
    format: 'quote',
    title: 'Niels Bohr',
    quote: 'No phenomenon is a phenomenon until it is an observed phenomenon.',
    who: 'Niels Bohr',
    captionExtra: 'Observation sits at the center of quantum conversation.',
    screenText: 'Observed — or not a phenomenon?',
    photo: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1080&q=80',
    tags: ['#ScienceQuotes', '#Physics', '#ArchieExplains']
  },
  {
    id: 'news_wifi',
    format: 'news',
    title: 'Why walls kill Wi-Fi',
    claim: 'Wi-Fi is radio. Dense walls eat the signal.',
    hook: 'Your router is not broken — materials absorb radio.',
    fact: 'Concrete, metal, and water weaken indoor Wi-Fi fast.',
    takeaway: 'Place the router open and central when you can.',
    screenText: 'Why walls kill Wi-Fi',
    photo: 'https://images.unsplash.com/photo-1544197150-b99a580b7e1c?w=1080&q=80',
    tags: ['#WiFi', '#TechExplained', '#ArchieExplains']
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
  h.used = (h.used || []).slice(-80);
  fs.writeFileSync(HIST, JSON.stringify(h, null, 2));
}
function pick() {
  const h = loadHist();
  const recent = new Set((h.used || []).map((x) => x.id));
  let pool = BANK.filter((x) => !recent.has(x.id));
  if (!pool.length) pool = BANK.slice();
  const item = pool[Math.floor(Math.random() * pool.length)];
  h.used.push({ id: item.id, at: new Date().toISOString() });
  saveHist(h);
  return item;
}

function httpGet(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieStatic/3.0' }, timeout: 15000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(httpGet(res.headers.location));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

function caption(item) {
  const tags = (item.tags || []).join(' ');
  if (item.format === 'quiz') {
    return [item.question, '', ...item.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`), '', `Answer: ${item.answerText}`, '', '— Archie', '', tags].join('\n');
  }
  if (item.format === 'quote') {
    return [`“${item.quote}”`, `— ${item.who}`, '', item.captionExtra || '', '', '— Archie', '', tags].join('\n');
  }
  return [item.hook, '', item.fact, '', 'Takeaway: ' + item.takeaway, '', '— Archie', '', tags].join('\n');
}

async function main() {
  const item = pick();
  console.log('[static]', item.format, item.title);
  const photoPath = path.join(OUT_DIR, `bg_${item.id}.jpg`);
  let buf = await httpGet(item.photo);
  if (!buf || buf.length < 5000) {
    buf = await httpGet('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&q=80');
  }
  if (buf && buf.length > 5000) fs.writeFileSync(photoPath, buf);
  else {
    execSync(`ffmpeg -y -f lavfi -i color=c=0x0f172a:s=1080x1350:d=1 -frames:v 1 "${photoPath}"`, {
      stdio: 'pipe'
    });
  }

  const screen = (item.screenText || item.title).slice(0, 42).replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const png = path.join(OUT_DIR, `${item.id}.png`);
  const vf = [
    'scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350',
    'drawbox=x=0:y=1080:w=1080:h=270:color=black@0.55:t=fill',
    "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='ARCHIE':fontsize=24:fontcolor=0x67e8f9:x=48:y=1110",
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${screen}':fontsize=36:fontcolor=white:x=48:y=1170`
  ].join(',');
  execSync(`ffmpeg -y -i "${photoPath}" -vf "${vf}" -frames:v 1 "${png}"`, { stdio: 'pipe' });
  fs.copyFileSync(png, LATEST_PNG);

  const cap = caption(item);
  const title = item.title;
  const manifest = {
    id: item.id,
    title,
    format: item.format,
    pngPath: LATEST_PNG,
    fbCaption: `${title}\n\n${cap}`,
    igCaption: `${title}\n\n${cap}`,
    tags: item.tags,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log('[static] OK photo+bottom text', title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
