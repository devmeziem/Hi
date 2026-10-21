#!/usr/bin/env node
/**
 * Archie static FB/IG — ZERO AI
 *
 * Design rule (user feedback):
 * - Image is mostly visual (photo or clean brand frame)
 * - ON IMAGE: at most 1 short title line (+ tiny brand mark)
 * - FULL fact + takeaway live in the CAPTION, not stacked on the image
 * - Rotate: branded (clean frame) ↔ photo + minimal title bar
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
fs.mkdirSync(ART, { recursive: true });

const FACT_BANK = [
  {
    id: 'phone_heat_charge',
    lane: 'tech',
    title: 'Why phones get hot charging',
    hook: 'Did you know phone heat while charging is physics — not random bad luck?',
    fact: 'Charging pushes current through resistance in the battery and circuits. That resistance turns some energy into heat. Fast charge + a warm room stack the effect.',
    takeaway: 'Charge cooler, and pull a thick case if it runs hot.',
    keywords: 'smartphone charging',
    tags: ['#TechExplained', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'onion_cry',
    lane: 'science',
    title: 'Why onions make you cry',
    hook: 'Onions do not attack your eyes — a gas does.',
    fact: 'Cutting releases sulfur compounds that form a gas. That gas hits your eyes and triggers tears as a defense response.',
    takeaway: 'Chill the onion first to slow the reaction.',
    keywords: 'onion kitchen',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'sky_blue',
    lane: 'science',
    title: 'Why the sky looks blue',
    hook: 'The sky is not painted blue — light is scattered.',
    fact: 'Sunlight hits air molecules. Shorter blue wavelengths scatter more than red, so daytime sky often looks blue from the ground.',
    takeaway: 'Sunsets go red because the path is longer and blue is scattered away.',
    keywords: 'blue sky',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'wifi_walls',
    lane: 'tech',
    title: 'Why Wi-Fi dies through walls',
    hook: 'Wi-Fi is radio. Walls eat some of it.',
    fact: 'Signals are absorbed and reflected by concrete, metal, and water. Distance plus obstacles cut strength fast indoors.',
    takeaway: 'A central open router beats a metal cabinet corner.',
    keywords: 'wifi router',
    tags: ['#TechExplained', '#WiFi', '#ArchieExplains']
  },
  {
    id: 'ssd_vs_hdd',
    lane: 'tech',
    title: 'Why SSDs feel faster',
    hook: 'Speed is not only more gigabytes.',
    fact: 'Hard drives spin a disk and move a head. SSDs use flash with no moving parts, so random access is much quicker.',
    takeaway: 'An SSD upgrade often feels like a new laptop.',
    keywords: 'computer ssd',
    tags: ['#TechExplained', '#Computers', '#ArchieExplains']
  },
  {
    id: 'soap_grease',
    lane: 'science',
    title: 'How soap lifts grease',
    hook: 'Water alone slides off oil. Soap bridges them.',
    fact: 'Soap has a water-loving end and an oil-loving end. It surrounds grease so water can rinse it away.',
    takeaway: 'Time + friction + soap beats cold water alone.',
    keywords: 'soap bubbles hands',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'dark_mode_oled',
    lane: 'tech',
    title: 'Dark mode and OLED battery',
    hook: 'Dark mode is not magic on every screen.',
    fact: 'On OLED, black pixels stay off. Large black areas use less power than bright white. LCD backlights stay on either way.',
    takeaway: 'Biggest savings: OLED + dark UI + lower brightness.',
    keywords: 'phone dark mode',
    tags: ['#TechExplained', '#OLED', '#ArchieExplains']
  },
  {
    id: 'microwave_heat',
    lane: 'science',
    title: 'How microwaves heat food',
    hook: 'Microwaves do not make food radioactive.',
    fact: 'They excite water molecules so the water vibrates and warms the food. Dry spots heat unevenly because there is less water.',
    takeaway: 'Stir mid-way so heat spreads more evenly.',
    keywords: 'microwave kitchen',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'qr_codes',
    lane: 'tech',
    title: 'How QR codes store data',
    hook: 'Those squares are a 2D barcode with error repair.',
    fact: 'Modules encode data. Finder patterns lock orientation. Error correction lets a damaged code still scan.',
    takeaway: 'High contrast and a steady camera beat zooming from far away.',
    keywords: 'qr code phone',
    tags: ['#TechExplained', '#QRCode', '#ArchieExplains']
  },
  {
    id: 'static_shock',
    lane: 'science',
    title: 'Why static shocks happen',
    hook: 'That zap is charge evening out — fast.',
    fact: 'Friction can move electrons onto you. Touch metal and the charge jumps; you feel a small shock.',
    takeaway: 'Dry air makes shocks more common.',
    keywords: 'metal door handle',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'bluetooth_pair',
    lane: 'tech',
    title: 'How Bluetooth pairing works',
    hook: 'Pairing is a short handshake, then nearby radio.',
    fact: 'Devices exchange keys and open a low-power radio link meant for short range — not long distance.',
    takeaway: 'Distance and interference drop quality before the app is broken.',
    keywords: 'wireless earbuds',
    tags: ['#TechExplained', '#Bluetooth', '#ArchieExplains']
  },
  {
    id: 'ice_slippery',
    lane: 'science',
    title: 'Why ice is slippery',
    hook: 'Ice is not just smooth glass.',
    fact: 'Pressure and a thin water-like surface layer cut friction under your shoe.',
    takeaway: 'Soft textured soles grip better than hard smooth ones.',
    keywords: 'ice winter',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
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
function pickFact() {
  const h = loadHist();
  const recent = new Set((h.used || []).map((x) => x.id));
  let pool = FACT_BANK.filter((f) => !recent.has(f.id));
  if (!pool.length) pool = FACT_BANK.slice();
  const item = pool[Math.floor(Math.random() * pool.length)];
  h.used.push({ id: item.id, at: new Date().toISOString(), title: item.title });
  saveHist(h);
  return item;
}
function resolveStyle() {
  const forced = (process.env.CARD_STYLE || '').toLowerCase();
  if (forced === 'branded' || forced === 'photo') return forced;
  const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);
  return hour >= 12 ? 'photo' : 'branded';
}

function httpGet(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieStatic/2.0' }, timeout: 12000 }, (res) => {
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

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Caption carries the teaching — image stays light */
function buildCaptions(item, style) {
  const tags = (item.tags || []).join(' ');
  const body = [
    item.hook,
    '',
    item.fact,
    '',
    'Takeaway: ' + item.takeaway,
    '',
    '— Archie',
    '',
    tags
  ].join('\n');
  return {
    fbCaption: body + '\n\nScience & tech · explained simply.',
    igCaption: body,
    style
  };
}

/** Branded: clean frame, ONLY title on image — no paragraph blocks */
function brandedSvgMinimal(item) {
  const title = escapeXml(item.title.slice(0, 40));
  const lane = escapeXml(item.lane.toUpperCase());
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="540" cy="520" r="180" fill="#0f172a" stroke="#22d3ee" stroke-width="6"/>
  <text x="540" y="540" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="64" font-weight="700" fill="#22d3ee">A</text>
  <text x="540" y="780" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#94a3b8">ARCHIE · ${lane}</text>
  <text x="540" y="880" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="44" font-weight="700" fill="#f8fafc">${title}</text>
  <text x="540" y="980" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#67e8f9">Read the caption ↓</text>
</svg>`;
}

async function renderBranded(item) {
  // Do NOT call the old dense infocard factory (too much text on image)
  const svgPath = path.join(OUT_DIR, `static_${item.id}.svg`);
  const pngPath = path.join(OUT_DIR, `static_${item.id}.png`);
  fs.writeFileSync(svgPath, brandedSvgMinimal(item));
  execSync(`ffmpeg -y -i "${svgPath}" -vf scale=1080:1350 "${pngPath}"`, { stdio: 'pipe' });
  fs.copyFileSync(pngPath, LATEST_PNG);
  const caps = buildCaptions(item, 'branded');
  const manifest = {
    id: item.id,
    title: item.title,
    category: item.lane,
    style: 'branded',
    design: 'minimal_on_image',
    pngPath: LATEST_PNG,
    fbCaption: caps.fbCaption,
    igCaption: caps.igCaption,
    tags: item.tags,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  return manifest;
}

async function fetchPhoto(keywords) {
  const dest = path.join(OUT_DIR, `photo_${Date.now()}.jpg`);
  const urls = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1080&q=80',
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1080&q=80'
  ];
  for (const u of urls) {
    const buf = await httpGet(u);
    if (buf && buf.length > 8000) {
      fs.writeFileSync(dest, buf);
      return dest;
    }
  }
  execSync(`ffmpeg -y -f lavfi -i color=c=0x0f172a:s=1080x1350:d=1 -frames:v 1 "${dest}"`, {
    stdio: 'pipe'
  });
  return dest;
}

/** Photo-led: almost full photo; thin bottom bar with SHORT title only */
async function renderPhotoOverlay(item) {
  const photo = await fetchPhoto(item.keywords);
  const pngPath = path.join(OUT_DIR, `photo_card_${item.id}.png`);
  // Escape for ffmpeg drawtext
  const title = item.title
    .slice(0, 36)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "'\\''");
  const vf = [
    'scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350',
    // thin bar only — not half the frame
    'drawbox=x=0:y=1180:w=1080:h=170:color=black@0.55:t=fill',
    "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='ARCHIE':fontsize=22:fontcolor=0x22d3ee:x=48:y=1205",
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${title}':fontsize=34:fontcolor=white:x=48:y=1255`
  ].join(',');
  execSync(`ffmpeg -y -i "${photo}" -vf "${vf}" -frames:v 1 "${pngPath}"`, { stdio: 'pipe' });
  fs.copyFileSync(pngPath, LATEST_PNG);
  const caps = buildCaptions(item, 'photo');
  const manifest = {
    id: item.id,
    title: item.title,
    category: item.lane,
    style: 'photo',
    design: 'photo_plus_short_title',
    pngPath: LATEST_PNG,
    fbCaption: caps.fbCaption,
    igCaption: caps.igCaption,
    tags: item.tags,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  const style = resolveStyle();
  const item = pickFact();
  console.log(`[Archie Static] style=${style} topic=${item.title} lane=${item.lane}`);
  console.log('[Archie Static] design=minimal on-image text; full fact in caption');
  let manifest;
  if (style === 'photo') {
    try {
      manifest = await renderPhotoOverlay(item);
    } catch (e) {
      console.warn('[static] photo failed → branded', e.message);
      manifest = await renderBranded(item);
    }
  } else {
    manifest = await renderBranded(item);
  }
  console.log('[Archie Static] OK', manifest.style, manifest.design, manifest.title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
