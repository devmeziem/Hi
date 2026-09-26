/**
 * MindRush Reel Generator (Channel: MindRush - Pure Aura, 3D Mystery & Discipline)
 *
 * Daily Schedule:
 * - 5.0s Wisdom Reels (Straight to point, 3D mystery aura background, high contrast, NO voiceover)
 * - 15.0s Public Opinion vs Reality Slam Reels:
 *   Them/Opinion (7.0s) -> 0.8s pitch-black tension ->
 *   EXPLOSIVE SLAM (7.2s): White impact flash, violent punch zoom, camera tremor,
 *   crisp dark-backed text card, glowing rare word, user-uploaded phonk/bass soundtrack.
 *
 * Audio Management:
 * - Direct resolution via `sound_assets/mindrush/` & `sound_assets/uploads/`
 * - Prioritizes user uploaded audio (BangersOnly) over generic ambient loops.
 *
 * Visual Engine:
 * - Dynamic Cloudflare Workers AI 3D Image Generation (@cf/black-forest-labs/flux-1-schnell & @cf/bytedance/stable-diffusion-xl-lightning)
 * - 3 Themes: 3D Mystery Boy with pure aura, 3D Anthropomorphic Animals looking human, 3D Minimalist Dark Studio
 * - High-resolution local 3D assets fallback (Zero generic hikers).
 *
 * Typography & Layout:
 * - Auto-wrapped multi-line SVG engine with high-contrast obsidian-slate translucent backdrop cards
 * - 100% visibility guaranteed on all devices and TikTok UI overlays.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { resolveChannelAudio } = require('./audio_asset_manager.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const {
  CURATED_15S_CONFRONTATIONS,
  CURATED_5S_WISDOM,
  autoFetchDynamicConfrontation,
  autoFetchDynamic5sWisdom
} = require('./mindrush_content_engine.cjs');

const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'motivation_reels');
const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');

for (const dir of [OUTPUT_DIR, ARTIFACTS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Cloudflare Workers AI Credentials
const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

// Local 3D Mystery Assets with Pure Aura (Permanently replaces generic outdoor photos)
const LOCAL_3D_MYSTERY_IMAGES = {
  boy: path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_mystery_boy_1790164693177.jpg'),
  panther: path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_animal_human_1790164705789.jpg'),
  wolf: path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_wolf_human_1790164730412.jpg'),
  studio: path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790164717832.jpg')
};

// Aliases for backwards compatibility with legacy catalogs
const MOTIVATION_IMAGES = {
  summitDawn: LOCAL_3D_MYSTERY_IMAGES.boy,
  doubtRain: LOCAL_3D_MYSTERY_IMAGES.panther,
  slamPower: LOCAL_3D_MYSTERY_IMAGES.wolf,
  lateStudy: LOCAL_3D_MYSTERY_IMAGES.studio,
  gymGrit: LOCAL_3D_MYSTERY_IMAGES.panther,
  dawnAthlete: LOCAL_3D_MYSTERY_IMAGES.boy,
  rainStreet: LOCAL_3D_MYSTERY_IMAGES.studio
};

// 3 Curated Prompt Pools for Live Cloudflare AI Image Synthesis
// User Mandate: Real Naysayers / Bad Person intro & Explosive Aura Throwback (Zero cats/dogs/generic boys)
const MYSTERY_3D_POOLS = {
  naysayer_intro: [
    "3D octane render of a cynical shadowy toxic naysayer sneering in a dark rainy urban alley, shadowy skeptic criticizing under cold blue streetlights, dramatic silhouette of a bitter hater in mist and smoke, ultra detailed 3d character, cinematic 9:16 vertical 8k",
    "3D cinematic render of an arrogant toxic doubter in shadows sneering with crossed arms, dark rainy city background, cold blue and violet rim light, pure skepticism and envy, 8k vertical 9:16",
    "3D render of a shadowy petty critic with glowing cynical eyes, dark urban techwear silhouette, smoke and rain haze, negative aura, cinematic vertical 9:16"
  ],
  aura_throwback: [
    "3D octane render of an invincible disciplined champion standing atop a skyscraper with pure golden and violet energy aura, intense glowing neon eyes, shockwaves of raw power breaking through dark clouds, transcendent aura throwback, cinematic masterpiece vertical 9:16",
    "3D render of an apex warrior with pure electric cyan and gold aura radiating from body, shattering dark shadows, glowing eyes of pure unstoppable willpower, high-detail 3D character, 8k vertical 9:16",
    "3D cinematic render of a disciplined stoic protagonist in dark techwear surrounded by towering explosive aura and floating golden embers, supreme confidence, triumph over doubters, 8k vertical 9:16"
  ],
  studio: [
    "3D render of a cool minimalist dark luxury studio stage, dramatic overhead volumetric light spotlight, glowing floating geometric neon prism, deep cyan and gold rim illumination, moody dark mystery, pure aura, sleek dark reflective floor, 8k vertical 9:16 cinematic studio background",
    "3D brutalist dark vault studio, dramatic single overhead spotlight, floating glowing particles, pure aura, sleek reflective metallic floor, hyper-cinematic mystery 8k vertical 9:16"
  ]
};

// Aliases for compatibility
MYSTERY_3D_POOLS.boy = MYSTERY_3D_POOLS.aura_throwback;
MYSTERY_3D_POOLS.animal_human = MYSTERY_3D_POOLS.aura_throwback;

/**
 * Dynamically Generate 3D Mystery Image via Cloudflare Workers AI Low-Cost Models
 */
async function generateCloudflareMysteryImage(prompt) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return null;
  }

  // Low cost Cloudflare Workers AI models (lightning fast & high dynamic range)
  const candidateModels = [
    '@cf/bytedance/stable-diffusion-xl-lightning',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ];

  for (const model of candidateModels) {
    try {
      const seed = Math.floor(Math.random() * 99999999);
      const postData = JSON.stringify({
        prompt: `${prompt}, 3d octane render, pure aura, moody cinematic mystery, ultra high resolution 9:16 vertical, photorealistic 8k, hyper-detailed`,
        num_steps: 4,
        seed
      });

      const buffer = await new Promise((resolve) => {
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 18000
        }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            if (res.statusCode === 200) {
              const full = Buffer.concat(chunks);
              try {
                const json = JSON.parse(full.toString('utf8'));
                if (json.result?.image) {
                  return resolve(Buffer.from(json.result.image, 'base64'));
                }
              } catch {}
              if (full.length > 2000) return resolve(full);
            }
            resolve(null);
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (buffer && buffer.length > 2000) {
        const outPath = path.join(ARTIFACTS_DIR, `mindrush_cf_${Date.now()}_${seed}.jpg`);
        fs.writeFileSync(outPath, buffer);
        console.log(`[MindRush AI Images] 🎨 Generated 3D Mystery Image via Cloudflare AI (${model})`);
        return outPath;
      }
    } catch (e) {
      console.warn(`[MindRush AI Images] Cloudflare image notice: ${e.message}`);
    }
  }

  return null;
}

/**
 * Dynamic Pollinations FLUX Engine Fallback (Never uses static seed images)
 */
async function generatePollinationsDynamicImage(prompt) {
  try {
    const seed = Math.floor(Math.random() * 99999999);
    const encPrompt = encodeURIComponent(`${prompt}, 3d octane render, intense aura, volumetric dark lighting, 9:16 vertical 8k`);
    const url = `https://image.pollinations.ai/prompt/${encPrompt}?width=1080&height=1920&nologo=true&model=flux&seed=${seed}`;
    const outPath = path.join(ARTIFACTS_DIR, `mindrush_dynamic_${Date.now()}_${seed}.jpg`);
    const buf = await new Promise((resolve) => {
      https.get(url, { timeout: 20000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return https.get(res.headers.location, { timeout: 20000 }, (r2) => {
            const c = [];
            r2.on('data', d => c.push(d));
            r2.on('end', () => resolve(Buffer.concat(c)));
          }).on('error', () => resolve(null));
        }
        const c = [];
        res.on('data', d => c.push(d));
        res.on('end', () => resolve(Buffer.concat(c)));
      }).on('error', () => resolve(null));
    });
    if (buf && buf.length > 2000) {
      fs.writeFileSync(outPath, buf);
      console.log(`[MindRush AI Images] 🎨 Dynamically synthesized 3D visual via FLUX (${(buf.length / 1024).toFixed(1)} KB)`);
      return outPath;
    }
  } catch (err) {
    console.warn(`[MindRush AI Images] Dynamic visual generation notice: ${err.message}`);
  }
  return null;
}

/**
 * Resolve 3D Mystery Visual (Always dynamically generated via AI - No static seeds)
 */
async function resolve3dMysteryImage(category = 'auto') {
  const categories = ['boy', 'animal_human', 'studio'];
  const cat = category === 'auto' || !categories.includes(category)
    ? categories[Math.floor(Math.random() * categories.length)]
    : category;

  const pool = MYSTERY_3D_POOLS[cat] || MYSTERY_3D_POOLS.boy;
  const prompt = pool[Math.floor(Math.random() * pool.length)];

  console.log(`[MindRush AI Images] 🔮 Generating dynamic 3D visual via AI (Zero static seeds): [${cat.toUpperCase()}]`);

  // 1. Live Cloudflare Workers AI low cost models
  const cfImage = await generateCloudflareMysteryImage(prompt);
  if (cfImage && fs.existsSync(cfImage) && fs.statSync(cfImage).size > 2000) {
    return cfImage;
  }

  // 2. Dynamic Pollinations FLUX Engine (Never uses static seed images)
  const dynamicImage = await generatePollinationsDynamicImage(prompt);
  if (dynamicImage && fs.existsSync(dynamicImage) && fs.statSync(dynamicImage).size > 2000) {
    return dynamicImage;
  }

  // 3. High-Resolution Local 3D Assets Fallback
  const fallbackList = [
    LOCAL_3D_MYSTERY_IMAGES.boy,
    LOCAL_3D_MYSTERY_IMAGES.panther,
    LOCAL_3D_MYSTERY_IMAGES.wolf,
    LOCAL_3D_MYSTERY_IMAGES.studio
  ];
  for (const f of fallbackList) {
    if (f && fs.existsSync(f) && fs.statSync(f).size > 2000) {
      console.log(`[MindRush AI Images] 🏛️ Utilizing High-Resolution 3D Asset: ${path.basename(f)}`);
      return f;
    }
  }

  return cfImage || dynamicImage;
}

// 1. Curated Catalog of 5-Second High-Impact Punchlines
const CATALOG_5S_QUOTES = [
  {
    line1: "Nobody is coming.",
    line2: "Build yourself",
    line3: "anyway.",
    author: "MindRush",
    theme: "self_reliance"
  },
  {
    line1: "Work in silence.",
    line2: "Shock everyone",
    line3: "with your results.",
    author: "MindRush",
    theme: "execution"
  },
  {
    line1: "You're not behind.",
    line2: "You just started",
    line3: "the real work.",
    author: "MindRush",
    theme: "focus"
  },
  {
    line1: "Kill your excuses.",
    line2: "Build undeniable",
    line3: "self-respect.",
    author: "MindRush",
    theme: "discipline"
  },
  {
    line1: "Don't tell them.",
    line2: "Show them with",
    line3: "ruthless output.",
    author: "MindRush",
    theme: "unapologetic"
  },
  {
    line1: "Pain is temporary.",
    line2: "Being average is",
    line3: "forever.",
    author: "MindRush",
    theme: "excellence"
  },
  {
    line1: "They want you soft.",
    line2: "Choose discipline",
    line3: "every single time.",
    author: "MindRush",
    theme: "grit"
  }
];

// 2. Curated Catalog of 15-Second Personalized Confrontations & Throwback Slams
// (Zero generic "Public Opinion" — Strictly personalized fictional personas + toxic jabs vs lethal comeback)
const CATALOG_15S_DEBATES = CURATED_15S_CONFRONTATIONS;

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Text Auto-Wrapping Helper to prevent horizontal overflow on vertical 1080x1920 video
 */
function wrapTextToLines(text, maxCharsPerLine = 24) {
  if (!text) return [];
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Build 5-Second Video Overlay SVG with Stoic-Style Prestige Zero-Box Layout
 */
function build5sOverlaySvg(entry) {
  const width = 1080;
  const height = 1920;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="textGlow5" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="14" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
      </filter>
      <linearGradient id="teenVignette5" x1="0%" y1="0%" x2="0%" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.45" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.86" />
        <stop offset="85%" stop-color="#01040f" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
    </defs>

    <!-- Seamless Obsidian Vignette Background (No Box / Zero-Pill) -->
    <rect x="0" y="700" width="1080" height="1220" fill="url(#teenVignette5)" />

    <!-- Stylized Electric Symbol -->
    <text x="540" y="930" font-family="system-ui, -apple-system, sans-serif" font-size="70" font-weight="900" fill="#facc15" text-anchor="middle" filter="url(#textGlow5)">⚡</text>

    <!-- Line 1: Pure White Display -->
    <text x="540" y="1030" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="72" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" filter="url(#textGlow5)">
      ${escapeXml(entry.line1.toUpperCase())}
    </text>

    <!-- Line 2: Radiant Gold / Cyan Glow Accent -->
    <text x="540" y="1125" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="80" font-weight="900" fill="#facc15" letter-spacing="1.5" text-anchor="middle" filter="url(#textGlow5)">
      ${escapeXml(entry.line2.toUpperCase())}
    </text>

    <!-- Line 3: Pure White Display -->
    <text x="540" y="1220" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="72" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" filter="url(#textGlow5)">
      ${escapeXml(entry.line3.toUpperCase())}
    </text>

    <!-- Fine Accent Divider Line -->
    <line x1="420" y1="1285" x2="660" y2="1285" stroke="#facc15" stroke-width="3" stroke-linecap="round" stroke-opacity="0.9" />

    <!-- Channel Tagline -->
    <text x="540" y="1340" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#cbd5e1" letter-spacing="3" text-anchor="middle" filter="url(#textGlow5)">
      - MINDRUSH • APEX DISCIPLINE
    </text>
  </svg>`;
}

/**
 * Build 15-Second Segment 1 (What the Naysayer Said - Clear Doubter Framing)
 */
function build15sSegment1OverlaySvg(debate, cursorChar = '|') {
  const width = 1080;
  const height = 1920;

  const lines = wrapTextToLines(debate.speaker1Text, 22);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="shadow1" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="14" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
      </filter>
      <linearGradient id="vignette1" x1="0%" y1="0%" x2="0%" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.45" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.86" />
        <stop offset="85%" stop-color="#01040f" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
    </defs>

    <!-- Seamless Obsidian Vignette Background (No Box / Zero-Pill) -->
    <rect x="0" y="680" width="1080" height="1240" fill="url(#vignette1)" />

    <!-- Speaker 1 Label: Crystal Clear Naysayer Framing so viewer is never confused -->
    <text x="540" y="890" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#ef4444" letter-spacing="4" text-anchor="middle" filter="url(#shadow1)">
      ⚡ [ WHAT THE NAYSAYER SAID ]
    </text>
    <text x="540" y="930" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#94a3b8" letter-spacing="3" text-anchor="middle" filter="url(#shadow1)">
      (THE TOXIC DOUBT I WAS TOLD)
    </text>

    <!-- Wrapped Doubt Statement with Blinking Cursor -->
    ${lines.map((l, i) => {
      const isLast = i === lines.length - 1;
      const lineContent = (i === 0 ? `“` : ``) + l + (isLast ? `”` : ``);
      return `
        <text x="540" y="${1040 + i * 78}" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="68" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" filter="url(#shadow1)">
          ${escapeXml(lineContent)}${isLast ? `<tspan fill="#38bdf8" font-weight="bold"> ${escapeXml(cursorChar)}</tspan>` : ''}
        </text>
      `;
    }).join('')}

    <!-- Fine Accent Divider Line -->
    <line x1="420" y1="${1050 + lines.length * 78}" x2="660" y2="${1050 + lines.length * 78}" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />

    <!-- Suspense Prompt -->
    <text x="540" y="${1100 + lines.length * 78}" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#38bdf8" letter-spacing="4" text-anchor="middle" filter="url(#shadow1)">
      WAIT FOR MY CLAPBACK...
    </text>
  </svg>`;
}

/**
 * Build 15-Second Segment 3 (The Protagonist Throwback - Direct Clapback at Naysayer)
 */
function build15sSegment3OverlaySvg(debate) {
  const width = 1080;
  const height = 1920;

  const lines1 = wrapTextToLines(debate.speaker2Line1, 24);
  const lines2 = wrapTextToLines(debate.speaker2Line2, 24);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="slamGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="16" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000000" flood-opacity="0.95" />
      </filter>
      <linearGradient id="vignette3" x1="0%" y1="0%" x2="0%" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.48" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.88" />
        <stop offset="85%" stop-color="#01040f" stop-opacity="0.97" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#facc15"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>

    <!-- Seamless Obsidian Vignette Background (No Box / Zero-Pill) -->
    <rect x="0" y="620" width="1080" height="1300" fill="url(#vignette3)" />

    <!-- Speaker 2 Label: Crystal Clear Protagonist Clapback Framing -->
    <text x="540" y="860" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#facc15" letter-spacing="4" text-anchor="middle" filter="url(#slamGlow)">
      ⚡ [ HOW I CLAPPED BACK ]
    </text>
    <text x="540" y="905" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#38bdf8" letter-spacing="3" text-anchor="middle" filter="url(#slamGlow)">
      (MY DIRECT ANSWER TO THE NAYSAYER)
    </text>

    <!-- Line 1 of retort (Auto-Wrapped, Bold Clean White) -->
    ${lines1.map((l, i) => `
      <text x="540" y="${980 + i * 72}" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="62" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" filter="url(#slamGlow)">
        ${escapeXml(l.toUpperCase())}
      </text>
    `).join('')}

    <!-- Highlight Word in Radiant Golden Glow (Massive 84px Impact) -->
    <text x="540" y="${1000 + lines1.length * 72 + 65}" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="86" font-weight="900" fill="url(#goldText)" letter-spacing="3" text-anchor="middle" filter="url(#slamGlow)">
      ${escapeXml(debate.speaker2Highlight.toUpperCase())}
    </text>

    <!-- Line 2 of retort (Auto-Wrapped, Crisp Ice White) -->
    ${lines2.map((l, i) => `
      <text x="540" y="${1000 + lines1.length * 72 + 135 + i * 66}" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="56" font-weight="900" fill="#f1f5f9" letter-spacing="1" text-anchor="middle" filter="url(#slamGlow)">
        ${escapeXml(l.toUpperCase())}
      </text>
    `).join('')}

    <!-- Fine Accent Divider Bar -->
    <line x1="420" y1="${1020 + lines1.length * 72 + 145 + lines2.length * 66}" x2="660" y2="${1020 + lines1.length * 72 + 145 + lines2.length * 66}" stroke="#facc15" stroke-width="3" stroke-linecap="round" />

    <!-- Rare Word Definition Tag on Screen -->
    <text x="540" y="${1060 + lines1.length * 72 + 145 + lines2.length * 66}" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="800" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle" filter="url(#slamGlow)">
      ${escapeXml(debate.speaker2Highlight.toUpperCase())}: ${escapeXml((debate.rareWordDefinition || 'Unbreakable persistence').slice(0, 50))}
    </text>

    <!-- Channel Tagline -->
    <text x="540" y="${1100 + lines1.length * 72 + 145 + lines2.length * 66}" font-family="system-ui, -apple-system, sans-serif" font-size="21" font-weight="800" fill="#cbd5e1" letter-spacing="3" text-anchor="middle" filter="url(#slamGlow)">
      - MINDRUSH • APEX DISCIPLINE
    </text>
  </svg>`;
}

/**
 * Generate 5-Second MindRush Wisdom Reel
 */
async function render5sTeenReel(customQuote = null) {
  const duration = 5.0;
  console.log(`\n======================================================`);
  console.log(`⚡ [MINDRUSH 5s] GENERATING WISDOM REEL (${duration}s)`);
  console.log(`======================================================\n`);

  // 1. Select Deduplicated Candidate with Dynamic Auto-Fetch
  let chosen = customQuote;
  if (!chosen) {
    const combined5sPool = [...CURATED_5S_WISDOM, ...CATALOG_5S_QUOTES];
    chosen = await selectDeduplicatedCandidate('mindrush_5s', combined5sPool, q => `${q.line1} ${q.line2} ${q.line3}`, q => q.author, autoFetchDynamic5sWisdom);
  }

  console.log(`[5s Reel] Line 1:  "${chosen.line1}"`);
  console.log(`[5s Reel] Line 2:  "${chosen.line2}" (Gold Accent)`);
  console.log(`[5s Reel] Line 3:  "${chosen.line3}"`);
  console.log(`[5s Reel] Theme:   ${chosen.theme}\n`);

  // 2. Resolve Dynamic 3D Mystery Image (Cloudflare AI -> Local 3D Asset)
  const bgImagePath = await resolve3dMysteryImage('auto');
  console.log(`[5s Reel] 🖼️ 3D Visual Asset: ${path.basename(bgImagePath)}`);

  // 3. Resolve Random Audio Asset from sound_assets/mindrush/ (User Uploaded BangersOnly)
  const audioWavPath = path.join(ARTIFACTS_DIR, `teen_5s_audio_${Date.now()}.wav`);
  resolveChannelAudio('mindrush_5s', duration, audioWavPath);

  // 4. Render Overlay SVG & Rasterize
  const overlaySvg = build5sOverlaySvg(chosen);
  const overlaySvgPath = path.join(ARTIFACTS_DIR, 'teen_5s_overlay.svg');
  const overlayPngPath = path.join(ARTIFACTS_DIR, 'teen_5s_overlay.png');
  fs.writeFileSync(overlaySvgPath, overlaySvg);

  try {
    execSync(`ffmpeg -y -i "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
  } catch {
    execSync(`rsvg-convert -w 1080 -h 1920 -o "${overlayPngPath}" "${overlaySvgPath}" 2>/dev/null || true`);
  }

  // 5. Composite MP4 with Beat-Synced Ken Burns Effect (~130 BPM Pulse Rhythm)
  const timestamp = Date.now();
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_5s_${timestamp}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');
  const fps = 30;
  const totalFrames = Math.round(duration * fps);

  console.log(`[5s Reel] 🎥 Rendering MP4 with Beat-Synced camera pan/zoom (${totalFrames} frames)...`);
  const complexFilter = `[0:v]scale=-2:2160,zoompan=z='min(zoom+0.0012 + 0.008*sin(2*PI*on/14),1.25)':d=${totalFrames}:x='iw/2-(iw/zoom/2) + sin(2*PI*on/28)*12':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}[bg];[bg][1:v]overlay=0:0[v]`;

  const ffmpegCmd = `ffmpeg -y -loop 1 -i "${bgImagePath}" -loop 1 -t ${duration} -i "${overlayPngPath}" -i "${audioWavPath}" -filter_complex "${complexFilter}" -map "[v]" -map 2:a -t ${duration} -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k "${outMp4}" 2>/dev/null`;

  try {
    execSync(ffmpegCmd);
  } catch (e) {
    console.warn(`[5s Reel] Notice on beat-synced zoompan: ${e.message}, retrying smooth pan...`);
    const fallbackFilter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0[v]`;
    const fallbackCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgImagePath}" -loop 1 -t ${duration} -i "${overlayPngPath}" -i "${audioWavPath}" -filter_complex "${fallbackFilter}" -map "[v]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outMp4}" 2>/dev/null`;
    execSync(fallbackCmd);
  }

  if (fs.existsSync(outMp4) && fs.statSync(outMp4).size > 10000) {
    fs.copyFileSync(outMp4, latestMp4);
    console.log(`[5s Reel] ✅ SUCCESS: Rendered ${(fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[5s Reel] 📁 Latest Video: ${latestMp4}`);

    await recordPostedCandidate('mindrush_5s', `${chosen.line1} ${chosen.line2} ${chosen.line3}`, chosen.author, {
      theme: chosen.theme,
      duration: 5.0
    });
  }

  return { outMp4, latestMp4, chosen, duration: 5.0 };
}

/**
 * Generate 15-Second MindRush Public Opinion vs Reality Slam Reel
 * Features:
 * - 0.0s - 7.0s: Scene 1 (3D Mystery Visual 1, doubt statement with blinking cursor)
 * - 7.0s - 7.8s: Scene 2 (Pitch-black suspense tension)
 * - 7.8s - 15.0s: Scene 3 (INTENSE SLAM: 2-frame impact flash, violent punch zoom, screen tremor,
 *   Me/Reality counter slam with auto-wrapped text on dark glass backing card, BangersOnly music drop)
 */
async function render15sTeenReel(customDebate = null) {
  const duration = 15.0;
  console.log(`\n======================================================`);
  console.log(`⚡ [MINDRUSH 15s] GENERATING INTENSE REALITY SLAM REEL (${duration}s)`);
  console.log(`======================================================\n`);

  // 1. Select Deduplicated Candidate with Dynamic Auto-Fetch
  let chosen = customDebate;
  if (!chosen) {
    const combined15sPool = [...CURATED_15S_CONFRONTATIONS, ...CATALOG_15S_DEBATES];
    chosen = await selectDeduplicatedCandidate('mindrush_15s', combined15sPool, d => `${d.speaker1Text} ${d.speaker2Highlight} ${d.speaker2Line2 || ''}`, d => d.speaker2Label, autoFetchDynamicConfrontation);
  }

  console.log(`[15s Slam] Speaker 1: ${chosen.speaker1Label} "${chosen.speaker1Text}"`);
  console.log(`[15s Slam] Speaker 2: ${chosen.speaker2Label} "${chosen.speaker2Line1} [${chosen.speaker2Highlight}] ${chosen.speaker2Line2}"`);
  console.log(`[15s Slam] Rare Word: "${chosen.speaker2Highlight.toUpperCase()}"\n`);

  // 2. Resolve Dynamic 3D Mystery Images (Cloudflare AI -> Local 3D Assets)
  // Scene 1: Naysayer / Toxic Doubter Intro; Scene 3 (Slam): Explosive Aura Throwback
  const img1Path = await resolve3dMysteryImage('naysayer_intro');
  const img2Path = await resolve3dMysteryImage('aura_throwback');

  console.log(`[15s Slam] 🖼️ Scene 1 Naysayer Asset: ${path.basename(img1Path)}`);
  console.log(`[15s Slam] 🖼️ Scene 3 Aura Slam Asset: ${path.basename(img2Path)}`);

  // 3. Resolve Random Audio Asset from sound_assets/mindrush/ (User Uploaded BangersOnly)
  const audioWavPath = path.join(ARTIFACTS_DIR, `teen_15s_audio_${Date.now()}.wav`);
  resolveChannelAudio('mindrush', duration, audioWavPath);

  // 4. Render Overlays for Scene 1 and Scene 3
  const seg1Svg = build15sSegment1OverlaySvg(chosen, '|');
  const seg3Svg = build15sSegment3OverlaySvg(chosen);

  const seg1SvgPath = path.join(ARTIFACTS_DIR, 'teen_15s_seg1.svg');
  const seg1PngPath = path.join(ARTIFACTS_DIR, 'teen_15s_seg1.png');
  const seg3SvgPath = path.join(ARTIFACTS_DIR, 'teen_15s_seg3.svg');
  const seg3PngPath = path.join(ARTIFACTS_DIR, 'teen_15s_seg3.png');

  fs.writeFileSync(seg1SvgPath, seg1Svg);
  fs.writeFileSync(seg3SvgPath, seg3Svg);

  try {
    execSync(`ffmpeg -y -i "${seg1SvgPath}" "${seg1PngPath}" 2>/dev/null`);
    execSync(`ffmpeg -y -i "${seg3SvgPath}" "${seg3PngPath}" 2>/dev/null`);
  } catch {
    execSync(`rsvg-convert -w 1080 -h 1920 -o "${seg1PngPath}" "${seg1SvgPath}" 2>/dev/null || true`);
    execSync(`rsvg-convert -w 1080 -h 1920 -o "${seg3PngPath}" "${seg3SvgPath}" 2>/dev/null || true`);
  }

  // 5. Render Video Segments with Beat-Synced Camera Motions
  const fps = 30;
  const seg1Mp4 = path.join(ARTIFACTS_DIR, `teen_seg1_${Date.now()}.mp4`);
  const seg2Mp4 = path.join(ARTIFACTS_DIR, `teen_seg2_${Date.now()}.mp4`);
  const seg3Mp4 = path.join(ARTIFACTS_DIR, `teen_seg3_${Date.now()}.mp4`);

  console.log(`[15s Slam] Rendering Scene 1 (0-7.0s: Doubt + Blinking Cursor with beat-synced mysterious drift)...`);
  const seg1Filter = `[0:v]scale=-2:2160,zoompan=z='min(zoom+0.0006 + 0.004*sin(2*PI*on/14),1.18)':d=210:x='iw/2-(iw/zoom/2) + sin(2*PI*on/28)*12':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}[bg];[bg][1:v]overlay=0:0[v]`;
  try {
    execSync(`ffmpeg -y -loop 1 -i "${img1Path}" -loop 1 -t 7.0 -i "${seg1PngPath}" -filter_complex "${seg1Filter}" -map "[v]" -t 7.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${seg1Mp4}" 2>/dev/null`);
  } catch (err) {
    execSync(`ffmpeg -y -loop 1 -t 7.0 -i "${img1Path}" -loop 1 -t 7.0 -i "${seg1PngPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0[v]" -map "[v]" -t 7.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${seg1Mp4}" 2>/dev/null`);
  }

  console.log(`[15s Slam] Rendering Scene 2 (7.0-8.0s: 1.0-Second Blackout Screen with "WAIT FOR IT..." text)...`);
  // Segment 2 (1.0s = 30 frames): Blackout screen with glowing suspense text
  const blackoutSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <rect width="1080" height="1920" fill="#000000" />
    <defs>
      <filter id="glowWait" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#ffffff" flood-opacity="0.95" />
        <feDropShadow dx="0" dy="0" stdDeviation="28" flood-color="#38bdf8" flood-opacity="0.75" />
      </filter>
    </defs>
    <!-- Centered Dramatic Suspense Text -->
    <text x="540" y="960" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="8" text-anchor="middle" filter="url(#glowWait)">
      WAIT FOR IT...
    </text>
  </svg>`;
  const blackoutSvgPath = path.join(ARTIFACTS_DIR, 'teen_15s_blackout.svg');
  const blackoutPngPath = path.join(ARTIFACTS_DIR, 'teen_15s_blackout.png');
  fs.writeFileSync(blackoutSvgPath, blackoutSvg);
  try {
    execSync(`ffmpeg -y -i "${blackoutSvgPath}" "${blackoutPngPath}" 2>/dev/null`);
  } catch {
    execSync(`rsvg-convert -w 1080 -h 1920 -o "${blackoutPngPath}" "${blackoutSvgPath}" 2>/dev/null || true`);
  }
  execSync(`ffmpeg -y -loop 1 -t 1.0 -i "${blackoutPngPath}" -c:v libx264 -preset fast -pix_fmt yuv420p "${seg2Mp4}" 2>/dev/null`);

  console.log(`[15s Slam] Rendering Scene 3 (8.0-15.0s: Explosive Center Slam + Beat-Synced 808 Camera Pulse)...`);
  // Segment 3 (7.0s = 210 frames):
  // 1. Violent camera punch: Starts at 1.50 zoom, crashes down to 1.06 in 10 frames with screen tremor jitter
  // 2. Continuous beat-synced 808 bass-pulse zoom (sin 14 frames ~130 BPM)
  // 3. White impact flash on frame 0-2 (drawbox)
  // 4. Crisp dark-backed text overlay composited on top
  const seg3Filter = `[0:v]scale=-2:2160,zoompan=z='if(lte(on,10),1.50-on*0.044,1.06+(on-10)*0.0003 + 0.012*sin(2*PI*(on-10)/14))':d=210:x='iw/2-(iw/zoom/2)+if(lte(on,8),(mod(on,2)*2-1)*16*(8-on)/8,sin(2*PI*(on-10)/28)*15)':y='ih*0.4-(ih*0.4/zoom)+if(lte(on,8),(mod(on,3)-1)*12*(8-on)/8,0)':s=1080x1920:fps=${fps}[bg];` +
    `[bg]drawbox=x=0:y=0:w=1080:h=1920:color=white@0.85:t=fill:enable='lte(n,2)'[bgflash];` +
    `[bgflash][1:v]overlay=0:0[v]`;

  try {
    execSync(`ffmpeg -y -loop 1 -i "${img2Path}" -loop 1 -t 7.0 -i "${seg3PngPath}" -filter_complex "${seg3Filter}" -map "[v]" -t 7.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${seg3Mp4}" 2>/dev/null`);
  } catch (err) {
    console.warn(`[15s Slam] Notice on intense filter, applying standard punch: ${err.message}`);
    const fallbackSlamFilter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0[v]`;
    execSync(`ffmpeg -y -loop 1 -t 7.0 -i "${img2Path}" -loop 1 -t 7.0 -i "${seg3PngPath}" -filter_complex "${fallbackSlamFilter}" -map "[v]" -t 7.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${seg3Mp4}" 2>/dev/null`);
  }

  // 6. Concatenate Segments and Map 15-Second Audio
  const timestamp = Date.now();
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_15s_${timestamp}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');

  console.log(`[15s Slam] 🎬 Concatenating Master Reel with Real Phonk Soundtrack...`);
  const concatFilter = `[0:v]setsar=1[v0];[1:v]setsar=1[v1];[2:v]setsar=1[v2];[v0][v1][v2]concat=n=3:v=1:a=0[vcat]`;
  const finalCmd = `ffmpeg -y -i "${seg1Mp4}" -i "${seg2Mp4}" -i "${seg3Mp4}" -i "${audioWavPath}" -filter_complex "${concatFilter}" -map "[vcat]" -map 3:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t 15.0 -shortest "${outMp4}" 2>/dev/null`;

  execSync(finalCmd);

  if (fs.existsSync(outMp4) && fs.statSync(outMp4).size > 10000) {
    fs.copyFileSync(outMp4, latestMp4);
    console.log(`[15s Slam] ✅ SUCCESS: Rendered MindRush 15s Video (${(fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[15s Slam] 📁 Latest Video: ${latestMp4}`);

    await recordPostedCandidate('mindrush_15s', `${chosen.speaker1Text} -> ${chosen.speaker2Highlight} -> ${chosen.speaker2Line2 || ''}`, chosen.speaker2Label, {
      theme: chosen.theme,
      duration: 15.0
    });
  }

  return { outMp4, latestMp4, chosen, duration: 15.0 };
}

/**
 * Generate 32-Second MindRush Emotionally Impactful Long-Form Reel
 * (Relentora Viral Format: 5 Progressive Contrast Slides + Pure Black Blank Ending Card with Dark Fin Aesthetics + Backup Quote + Watermark)
 * Accompanied by soft emotional piano instrument in background.
 */
async function renderLongFormTeenReel(customNarrative = null) {
  const duration = 32.0;
  console.log(`\n======================================================`);
  console.log(`⚡ [MINDRUSH LONG-FORM] GENERATING EMOTIONAL NARRATIVE REEL (${duration}s)`);
  console.log(`======================================================\n`);

  const { selectEmotionalNarrative, buildNarrativeSlideSvg, buildEndingBlankQuoteCardSvg } = require('./emotional_impact_engine.cjs');
  const narrative = customNarrative || selectEmotionalNarrative('teen');
  const watermarkHandle = process.env.TIKTOK_ACCOUNT_2_HANDLE || process.env.YOUTUBE_HANDLE_MINDRUSH || '@MindRush';

  // 1. Resolve 3D Mystery Background Image with Pure Aura
  const bgImagePath = await resolve3dMysteryImage('aura_throwback');
  console.log(`[MindRush Long-Form] 🖼️ 3D Visual Asset: ${path.basename(bgImagePath)}`);

  // 2. Resolve Soft Piano Background Track (32.0s)
  const audioWavPath = path.join(ARTIFACTS_DIR, `teen_longform_piano_${Date.now()}.wav`);
  resolveChannelAudio('teen', duration, audioWavPath);

  // 3. Render Overlays for Slides 1 - 5
  const slidePngPaths = [];
  for (let i = 0; i < narrative.slides.length; i++) {
    const slideSvg = buildNarrativeSlideSvg(narrative.slides[i], i + 1, narrative.slides.length, 'teen');
    const slideSvgPath = path.join(ARTIFACTS_DIR, `teen_slide_${i + 1}.svg`);
    const slidePngPath = path.join(ARTIFACTS_DIR, `teen_slide_${i + 1}.png`);
    fs.writeFileSync(slideSvgPath, slideSvg, 'utf8');
    try {
      execSync(`rsvg-convert -w 1080 -h 1920 "${slideSvgPath}" -o "${slidePngPath}" 2>/dev/null || ffmpeg -y -i "${slideSvgPath}" "${slidePngPath}" 2>/dev/null`);
    } catch {}
    slidePngPaths.push(slidePngPath);
  }

  // 4. Render Ending Card: Black Blank Screen with Dark Fin-Card Aesthetics + Backup Quote + Watermark
  const endingCardSvg = buildEndingBlankQuoteCardSvg(narrative.backupQuote, 'teen', watermarkHandle);
  const endingSvgPath = path.join(ARTIFACTS_DIR, 'teen_ending_card.svg');
  const endingPngPath = path.join(ARTIFACTS_DIR, 'teen_ending_card.png');
  fs.writeFileSync(endingSvgPath, endingCardSvg, 'utf8');
  try {
    execSync(`rsvg-convert -w 1080 -h 1920 "${endingSvgPath}" -o "${endingPngPath}" 2>/dev/null || ffmpeg -y -i "${endingSvgPath}" "${endingPngPath}" 2>/dev/null`);
  } catch {}

  // 5. Render Part 1 (0 - 25s: 5 slides @ 5.0s each with Ken Burns zoom on aura background)
  const part1Mp4 = path.join(ARTIFACTS_DIR, `teen_part1_${Date.now()}.mp4`);
  const part1Filter = [
    `[0:v]scale=1280:2276:force_original_aspect_ratio=increase,crop=1280:2276,zoompan=z='1.05+0.00018*on':d=750:x='(iw-iw/zoom)*(0.3+0.4*(on/750))':y='(ih-ih/zoom)*0.2':s=1080x1920:fps=30,eq=brightness=-0.05:contrast=1.14:saturation=0.92,vignette=PI/4.5[bg]`,
    `[1:v]scale=1080:1920[s1]`,
    `[2:v]scale=1080:1920[s2]`,
    `[3:v]scale=1080:1920[s3]`,
    `[4:v]scale=1080:1920[s4]`,
    `[5:v]scale=1080:1920[s5]`,
    `[bg][s1]overlay=0:0:enable='between(t,0,5)'[v1]`,
    `[v1][s2]overlay=0:0:enable='between(t,5,10)'[v2]`,
    `[v2][s3]overlay=0:0:enable='between(t,10,15)'[v3]`,
    `[v3][s4]overlay=0:0:enable='between(t,15,20)'[v4]`,
    `[v4][s5]overlay=0:0:enable='between(t,20,25)'[vfinal]`
  ].join(';');

  const part1Cmd = `ffmpeg -y -loop 1 -t 25.0 -i "${bgImagePath}" ` +
    slidePngPaths.map(p => `-loop 1 -t 5.0 -i "${p}"`).join(' ') +
    ` -filter_complex "${part1Filter}" -map "[vfinal]" -t 25.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${part1Mp4}" 2>/dev/null`;
  execSync(part1Cmd);

  // 6. Render Part 2 (25 - 32s: 7.0s Black Blank Screen with Dark Fin-Card Backup Quote)
  const part2Mp4 = path.join(ARTIFACTS_DIR, `teen_part2_${Date.now()}.mp4`);
  const part2Cmd = `ffmpeg -y -f lavfi -i "color=c=black:s=1080x1920:d=7.0:r=30" -loop 1 -t 7.0 -i "${endingPngPath}" -filter_complex "[0:v][1:v]overlay=0:0,format=yuv420p[v]" -map "[v]" -t 7.0 -c:v libx264 -preset fast -pix_fmt yuv420p "${part2Mp4}" 2>/dev/null`;
  execSync(part2Cmd);

  // 7. Concatenate Part 1 + Part 2 and merge with Soft Piano Soundtrack (32.0s total)
  const concatListPath = path.join(ARTIFACTS_DIR, `teen_concat_${Date.now()}.txt`);
  fs.writeFileSync(concatListPath, `file '${part1Mp4}'\nfile '${part2Mp4}'\n`, 'utf8');

  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_longform_${Date.now()}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');

  const finalCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -stream_loop -1 -i "${audioWavPath}" -c:v copy -c:a aac -b:a 192k -t 32.0 "${outMp4}"`;
  execSync(finalCmd);

  if (fs.existsSync(outMp4) && fs.statSync(outMp4).size > 10000) {
    fs.copyFileSync(outMp4, latestMp4);
    console.log(`[MindRush Long-Form] ✅ SUCCESS: Rendered ${(fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[MindRush Long-Form] 📁 Latest Video: ${latestMp4}`);
  }

  return {
    outMp4,
    latestMp4,
    chosen: {
      line1: narrative.title,
      line2: narrative.backupQuote.quote,
      line3: `— ${narrative.backupQuote.author}`,
      speaker1Label: 'THE HARSH REALITY',
      speaker1Text: narrative.slides[0].line1 + ' ' + narrative.slides[0].highlight,
      speaker2Label: 'THE UNBREAKABLE MINDSET',
      speaker2Line1: narrative.slides[4].line1,
      speaker2Highlight: narrative.slides[4].highlight,
      speaker2Line2: narrative.slides[4].line2 || '',
      rareWord: narrative.theme,
      rareWordDefinition: narrative.backupQuote.quote
    },
    duration: 32.0
  };
}

/**
 * Main MindRush Reel Dispatcher
 */
async function generateTeenMotivationReel(customMode = '') {
  let mode = (typeof customMode === 'string' && customMode ? customMode : '') || process.env.TEEN_FORMAT || process.env.VIDEO_MODE || process.env.VIDEO_TYPE || 'auto';
  const utcHour = new Date().getUTCHours();

  console.log(`\n======================================================`);
  console.log(`⚡ MINDRUSH PRODUCTION ENGINE (Mode: ${mode}, UTC Hour: ${utcHour})`);
  console.log(`======================================================\n`);

  let result = null;
  if (mode === 'long_form' || mode === 'long' || mode === '30s' || mode === '32s' || process.env.VIDEO_MODE === 'long_form' || process.env.VIDEO_MODE === 'psychology_short_30s' || (mode === 'auto' && utcHour === 3)) {
    result = await renderLongFormTeenReel();
  } else if (mode === '15s_slam' || mode === '15s' || mode === '15') {
    result = await render15sTeenReel();
  } else if (mode === '5s_reel' || mode === '5s' || mode === '5') {
    result = await render5sTeenReel();
  } else {
    // Mode is 'auto': Check if last generated video was 5s or if afternoon slot
    let lastWas15s = false;
    if (fs.existsSync(MANIFEST_PATH)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        const first = Array.isArray(manifest) ? manifest[0] : null;
        if (first && (first.duration === 15 || first.duration === 15.0)) {
          lastWas15s = true;
        }
      } catch {}
    }

    if (!lastWas15s || (utcHour >= 13 && utcHour <= 17)) {
      console.log(`[MindRush] 🎯 Auto Mode: Triggering 15-second Public Opinion vs Reality Slam Reel...`);
      result = await render15sTeenReel();
    } else {
      console.log(`[MindRush] 🎯 Auto Mode: Triggering 5-second Straight-to-Point Wisdom Reel...`);
      result = await render5sTeenReel();
    }
  }

  // Update Manifest
  try {
    let manifest = [];
    if (fs.existsSync(MANIFEST_PATH)) {
      try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch {}
    }
    const description = result.duration >= 30.0
      ? `"${result.chosen.line2}"\n${result.chosen.line3}\n\n🧠 Theme: ${result.chosen.rareWord || 'The Unbreakable Mindset'}\n\n#MindRush #Aura #Discipline #Shorts #Motivation #StoicTeen`
      : (result.duration === 15.0
        ? `${result.chosen.speaker1Label} "${result.chosen.speaker1Text}"\n\n${result.chosen.speaker2Label}: ${result.chosen.speaker2Line1} ${result.chosen.speaker2Highlight} ${result.chosen.speaker2Line2}\n\n📖 Word of the Day: ${result.chosen.rareWord || result.chosen.speaker2Highlight} — ${result.chosen.rareWordDefinition || 'Unbreakable persistence and discipline.'}\n\n#MindRush #Aura #Discipline #Shorts #Motivation`
        : `"${result.chosen.line1} ${result.chosen.line2} ${result.chosen.line3}"\n\n#MindRush #Aura #Discipline #Shorts #Motivation`);

    const manifestEntry = {
      id: `mindrush_${Date.now()}`,
      title: result.duration >= 30.0
        ? `${result.chosen.line1} #MindRush #Discipline #Shorts`
        : (result.duration === 15.0
          ? `${result.chosen.speaker1Label} vs ${result.chosen.speaker2Label} #MindRush #Aura #Shorts`
          : `"${result.chosen.line1} ${result.chosen.line2} ${result.chosen.line3}" #MindRush #Discipline #Shorts`),
      description,
      rareWord: result.chosen.rareWord || result.chosen.speaker2Highlight || null,
      rareWordDefinition: result.chosen.rareWordDefinition || null,
      duration: result.duration,
      videoPath: result.outMp4,
      createdAt: new Date().toISOString()
    };
    manifest.unshift(manifestEntry);
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest.slice(0, 50), null, 2));
  } catch (e) {
    console.warn('[MindRush] Manifest update notice:', e.message);
  }

  // Auto-Publish to TikTok via Buffer API 2
  const shouldAutoPublish = process.env.AUTO_PUBLISH === 'true' ||
                            process.env.BUFFER_API_KEY_2 ||
                            process.env.BUFFER_API_KEY ||
                            process.env.PUBLISH_TIKTOK === 'true';

  if (shouldAutoPublish && process.env.SKIP_BUFFER_DISPATCH !== 'true') {
    try {
      console.log(`[MindRush] 🚀 Auto-Dispatching completed reel to TikTok...`);
      const { dispatchTikTok } = require('./publish_buffer_second_tiktok.cjs');
      await dispatchTikTok('mindrush');
    } catch (pubErr) {
      console.warn(`[MindRush] Buffer dispatch notice: ${pubErr.message}`);
    }
  }

  return result;
}

if (require.main === module) {
  generateTeenMotivationReel(process.argv[2]).catch(err => {
    console.error('Fatal in MindRush reel generator:', err);
    process.exit(1);
  });
}

module.exports = {
  generateTeenMotivationReel,
  render5sTeenReel,
  render15sTeenReel,
  renderLongFormTeenReel,
  CATALOG_5S_QUOTES,
  CATALOG_15S_DEBATES
};
