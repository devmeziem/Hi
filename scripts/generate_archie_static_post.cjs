#!/usr/bin/env node
/**
 * Archie static FB/IG posts — ZERO AI quota
 * Styles rotate: branded SVG card  ↔  photo + text overlay
 * Topics: mixed science + tech from local bank + optional Wiki enrich
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

/** Mixed science + tech — short, postable, no AI */
const FACT_BANK = [
  {
    id: 'phone_heat_charge',
    lane: 'tech',
    title: 'Why phones get hot while charging',
    hook: 'Did you know your phone heats up while charging for a physical reason — not just “bad luck”?',
    fact: 'Charging forces current through resistance in the battery and circuits. That resistance turns some energy into heat. Fast charging and a warm room stack the effect.',
    takeaway: 'Charge in a cooler spot and remove a thick case if it feels too hot.',
    keywords: 'smartphone charging cable close up',
    tags: ['#TechExplained', '#DidYouKnow', '#ArchieExplains', '#Phones']
  },
  {
    id: 'onion_cry',
    lane: 'science',
    title: 'Why onions make you cry',
    hook: 'Onions do not “attack” your eyes — a gas does.',
    fact: 'Cutting an onion releases sulfur compounds that mix and form a gas. That gas reaches your eyes and triggers tears as a defense response.',
    takeaway: 'Chilling the onion first can slow the reaction and mean fewer tears.',
    keywords: 'onion cutting kitchen',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'sky_blue',
    lane: 'science',
    title: 'Why the sky looks blue',
    hook: 'The sky is not painted blue — light is scattered.',
    fact: 'Sunlight hits air molecules. Shorter blue wavelengths scatter more than red, so from the ground the sky often looks blue in daytime.',
    takeaway: 'Sunsets look redder because the light path is longer and more blue is scattered away.',
    keywords: 'blue sky clouds daylight',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'wifi_walls',
    lane: 'tech',
    title: 'Why Wi‑Fi weakens through walls',
    hook: 'Wi‑Fi is radio — walls eat some of it.',
    fact: 'Wi‑Fi signals are absorbed and reflected by dense materials like concrete, metal, and water. Distance and obstacles cut strength fast indoors.',
    takeaway: 'A central router placement beats hiding it in a metal cabinet.',
    keywords: 'wifi router home interior',
    tags: ['#TechExplained', '#WiFi', '#ArchieExplains']
  },
  {
    id: 'ssd_vs_hdd',
    lane: 'tech',
    title: 'Why SSDs feel faster than hard drives',
    hook: 'Speed is not only “more GB.”',
    fact: 'Hard drives spin a disk and move a head. SSDs read flash memory with no moving parts, so random access is much quicker.',
    takeaway: 'Upgrading an old laptop to an SSD often feels like a new machine.',
    keywords: 'computer ssd storage hardware',
    tags: ['#TechExplained', '#Computers', '#ArchieExplains']
  },
  {
    id: 'soap_grease',
    lane: 'science',
    title: 'How soap lifts grease',
    hook: 'Water alone slides off oil — soap bridges them.',
    fact: 'Soap molecules have a water-loving end and an oil-loving end. They surround grease so it can rinse away with water.',
    takeaway: 'Time + friction + soap beats cold water alone on greasy hands.',
    keywords: 'washing hands soap bubbles',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'dark_mode_oled',
    lane: 'tech',
    title: 'Why dark mode can save battery on OLED',
    hook: 'Dark mode is not magic on every screen.',
    fact: 'On OLED, black pixels stay off. Showing large black areas uses less power than bright white pages. LCD backlights stay on either way.',
    takeaway: 'Biggest savings show up on OLED phones with dark UI and lower brightness.',
    keywords: 'phone dark mode screen night',
    tags: ['#TechExplained', '#OLED', '#ArchieExplains']
  },
  {
    id: 'microwave_heat',
    lane: 'science',
    title: 'How microwaves heat food',
    hook: 'Microwaves do not “irradiate” food into being radioactive.',
    fact: 'They excite water molecules so the water vibrates and warms the food. Dry foods heat unevenly because there is less water to absorb energy.',
    takeaway: 'Stirring mid-way helps heat spread more evenly.',
    keywords: 'microwave oven kitchen',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'qr_codes',
    lane: 'tech',
    title: 'How QR codes store data',
    hook: 'Those squares are a 2D barcode with error repair.',
    fact: 'Black and white modules encode data. Finder patterns help cameras lock orientation. Error correction lets a damaged code still scan.',
    takeaway: 'High contrast and a steady camera beat zooming from far away.',
    keywords: 'qr code smartphone scan',
    tags: ['#TechExplained', '#QRCode', '#ArchieExplains']
  },
  {
    id: 'static_shock',
    lane: 'science',
    title: 'Why you get static shocks',
    hook: 'That zap is charge evening out — fast.',
    fact: 'Friction can move electrons onto you. When you touch metal, the charge jumps and you feel a small shock.',
    takeaway: 'Dry air makes shocks more common; humid air leaks charge away slowly.',
    keywords: 'door handle metal hand',
    tags: ['#ScienceFacts', '#DidYouKnow', '#ArchieExplains']
  },
  {
    id: 'bluetooth_pair',
    lane: 'tech',
    title: 'How Bluetooth pairing works',
    hook: 'Pairing is a short secure handshake, then shorter-range radio.',
    fact: 'Devices exchange keys and agree on a link. After that they talk over low-power radio designed for nearby use, not long distance.',
    takeaway: 'Interference and distance drop quality before “the app is broken.”',
    keywords: 'wireless earbuds bluetooth',
    tags: ['#TechExplained', '#Bluetooth', '#ArchieExplains']
  },
  {
    id: 'ice_slippery',
    lane: 'science',
    title: 'Why ice is slippery',
    hook: 'Ice is not just “smooth glass.”',
    fact: 'Pressure and a thin water-like layer at the surface reduce friction under your shoe, so grip fails more easily than on dry pavement.',
    takeaway: 'Soft, textured soles grip better than hard smooth ones on ice.',
    keywords: 'ice frozen lake winter',
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
  // Rotate by UTC hour bucket: morning branded, evening photo (2 slots/day)
  const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);
  if (hour >= 12) return 'photo';
  return 'branded';
}

function httpGet(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(url, { headers: { 'User-Agent': 'ArchieStatic/1.0' }, timeout: 12000 }, (res) => {
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
  const ig = body;
  const fb = body + '\n\nEducational page · science & tech explained simply.';
  return { fbCaption: fb, igCaption: ig, style };
}

function wrapLines(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 8);
}

function brandedSvg(item) {
  const factLines = wrapLines(item.fact, 42);
  const factTspans = factLines
    .map((ln, i) => `<tspan x="540" dy="${i === 0 ? 0 : 36}">${escapeXml(ln)}</tspan>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="48" y="48" width="984" height="1254" rx="32" fill="#111827" stroke="#22d3ee" stroke-width="4"/>
  <text x="540" y="140" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="36" font-weight="700" fill="#22d3ee">ARCHIE EXPLAINS</text>
  <text x="540" y="200" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#94a3b8">${escapeXml(item.lane.toUpperCase())}</text>
  <text x="540" y="280" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="44" font-weight="700" fill="#f8fafc">${escapeXml(item.title.slice(0, 48))}</text>
  <text x="540" y="380" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" fill="#e2e8f0">${escapeXml(item.hook.slice(0, 90))}</text>
  <rect x="100" y="480" width="880" height="520" rx="24" fill="#0b1220" stroke="#334155" stroke-width="2"/>
  <text x="540" y="540" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#f1f5f9">${factTspans}</text>
  <text x="540" y="1080" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#67e8f9">${escapeXml(('Takeaway: ' + item.takeaway).slice(0, 90))}</text>
  <text x="540" y="1240" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#64748b">Save this · share with a curious friend</text>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderBranded(item) {
  // Prefer full Archie infocard factory if available
  try {
    const factory = require('./generate_facebook_instagram_infocard.cjs');
    if (typeof factory.generateDailyInfocard === 'function') {
      const manifest = await factory.generateDailyInfocard();
      // Overwrite captions to short algo style if needed
      const caps = buildCaptions(
        {
          hook: item.hook,
          fact: item.fact,
          takeaway: item.takeaway,
          tags: item.tags
        },
        'branded'
      );
      // keep factory image; merge captions toward short form when FACT bank preferred
      const merged = {
        ...manifest,
        style: 'branded',
        source: 'infocard_factory',
        fbCaption: caps.fbCaption,
        igCaption: caps.igCaption
      };
      // If factory already wrote manifest, replace captions for consistency
      fs.writeFileSync(MANIFEST, JSON.stringify(merged, null, 2));
      return merged;
    }
  } catch (e) {
    console.warn('[static] factory fallback:', e.message);
  }

  const svgPath = path.join(OUT_DIR, `static_${item.id}.svg`);
  const pngPath = path.join(OUT_DIR, `static_${item.id}.png`);
  fs.writeFileSync(svgPath, brandedSvg(item));
  execSync(`ffmpeg -y -i "${svgPath}" -vf scale=1080:1350 "${pngPath}"`, { stdio: 'pipe' });
  fs.copyFileSync(pngPath, LATEST_PNG);
  const caps = buildCaptions(item, 'branded');
  const manifest = {
    id: item.id,
    title: item.title,
    category: item.lane,
    style: 'branded',
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
  const q = encodeURIComponent(keywords || 'science technology');
  // Unsplash source (no key) + picsum fallback
  const urls = [
    `https://source.unsplash.com/1080x1350/?${q}`,
    `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&q=80`,
    `https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&q=80`
  ];
  const dest = path.join(OUT_DIR, `photo_${Date.now()}.jpg`);
  for (const u of urls) {
    try {
      const buf = await httpGet(u);
      if (buf && buf.length > 5000) {
        fs.writeFileSync(dest, buf);
        return dest;
      }
    } catch (_) {}
  }
  // solid fallback
  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0f172a:s=1080x1350:d=1 -frames:v 1 "${dest}"`,
    { stdio: 'pipe' }
  );
  return dest;
}

async function renderPhotoOverlay(item) {
  const photo = await fetchPhoto(item.keywords);
  const pngPath = path.join(OUT_DIR, `photo_card_${item.id}.png`);
  const line1 = item.title.replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const line2 = item.hook.slice(0, 70).replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const line3 = ('Takeaway: ' + item.takeaway).slice(0, 75).replace(/:/g, '\\:').replace(/'/g, "'\\''");
  // Dark gradient bar + bold text
  const vf = [
    `scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350`,
    `drawbox=x=0:y=900:w=1080:h=450:color=black@0.72:t=fill`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='ARCHIE':fontsize=28:fontcolor=0x22d3ee:x=(w-text_w)/2:y=920`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${line1}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=980`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${line2}':fontsize=26:fontcolor=0xe2e8f0:x=(w-text_w)/2:y=1060`,
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${line3}':fontsize=24:fontcolor=0x67e8f9:x=(w-text_w)/2:y=1140`
  ].join(',');
  execSync(`ffmpeg -y -i "${photo}" -vf "${vf}" -frames:v 1 "${pngPath}"`, { stdio: 'pipe' });
  fs.copyFileSync(pngPath, LATEST_PNG);
  const caps = buildCaptions(item, 'photo');
  const manifest = {
    id: item.id,
    title: item.title,
    category: item.lane,
    style: 'photo',
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
  console.log('[Archie Static] OK', manifest.style, manifest.title);
  console.log(JSON.stringify({ id: manifest.id, style: manifest.style, title: manifest.title }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
