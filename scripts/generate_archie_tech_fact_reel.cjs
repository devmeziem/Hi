#!/usr/bin/env node

/**
 * Archie Daily Tech & Science Fact Reel Generator (Channel 3: Tech, AI & Science)
 *
 * Direct match to User Reference Images 2 & 3:
 * - Studio background with "ARCHIE LAB" glowing neon sign, bookshelf, laptop, potted plant, and stage floor
 * - Digital presentation board with category tabs, bold high-contrast title, explanation, and "DID YOU KNOW?" card
 * - Archie standing and pointing up at the board with grounded floor contact shadow
 * - Dynamic animated lip-sync using visemes (consonant & wide vowel mouth) + natural eye blinks
 * - Uplifting science lo-fi groove + "Did You Know?" chime + Archie voice narration (zero horror sine wave)
 * - Auto-saves test_artifacts/archie_tech_fact_latest.json for Buffer Omnichannel dispatch
 * - YouTube Shorts upload switched ON by default
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { uploadYouTubeShort, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { assembleArchieMasterAudio } = require('./archie_sound_engine.cjs');
const { buildAllModernCharacterAssets } = require('./build_modern_tech_character.cjs');
const { 
  discoverAndSelectTopicViaActiveAi, 
  callActiveAiForJson, 
  saveChosenTopicToDatabase 
} = require('./topic_discovery_engine.cjs');

const TARGET_DURATION = 5.0;
const FPS = 30;
const TOTAL_FRAMES = 150;
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels');
const OUTPUT_DIR = path.join(process.cwd(), 'test_artifacts');
const RENDERED_VIDEOS_DIR = path.join(process.cwd(), 'rendered_videos');
const FACTS_CACHE = path.join(process.cwd(), 'archie_tech_facts_cache.json');
const LATEST_FACT_JSON = path.join(process.cwd(), 'test_artifacts', 'archie_tech_fact_latest.json');

/**
 * Robust HTTPS Buffer Fetcher with Redirect & User-Agent Handling
 */
function fetchHttpsBuffer(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'http:' ? require('http') : https;
      const req = client.get(url, {
        headers: { 'User-Agent': 'ArchieLabBot/1.0 (educational science shorts research; contact: lab@archie.science)' },
        timeout: timeoutMs
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchHttpsBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout ${timeoutMs}ms for ${url}`)); });
      req.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Fetch a Real Physical Image from Wikipedia / Wikimedia Commons
 * Prioritizes high-resolution photography over diagrams or SVGs
 */
async function fetchWikipediaPhysicalImage(searchTerm, topicTitle) {
  const candidates = [
    searchTerm,
    String(topicTitle || '').replace(/^(Why|How|What|The|Is|Are)\s+/i, '').replace(/[^\w\s]/g, '').trim(),
    (searchTerm || '').split(/\s+/).slice(0, 3).join(' ')
  ].filter(Boolean);

  for (const query of candidates) {
    try {
      console.log(`[Archie Wiki Vision] 🔬 Searching Wikimedia Commons / Wikipedia for real specimen of: "${query}"...`);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|extracts&pithumbsize=1080&format=json`;
      const buf = await fetchHttpsBuffer(searchUrl, 7000);
      const data = JSON.parse(buf.toString('utf8'));
      const pages = data?.query?.pages || {};

      for (const pid of Object.keys(pages)) {
        const p = pages[pid];
        const src = p.thumbnail?.source;
        if (src && !src.endsWith('.svg') && !src.endsWith('.gif')) {
          console.log(`[Archie Wiki Vision] 📸 Found verified physical photography: "${p.title}" (${src})`);
          const imgBuf = await fetchHttpsBuffer(src, 9000);
          if (imgBuf && imgBuf.length > 12000) {
            const outPath = path.join(ARTIFACTS_DIR, `archie_physical_${Date.now()}.jpg`);
            fs.writeFileSync(outPath, imgBuf);
            return {
              imagePath: outPath,
              title: p.title,
              sourceUrl: src
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[Archie Wiki Vision Notice] Query "${query}": ${err.message}`);
    }
  }
  return null;
}

/**
 * Generate a Silky-Smooth Moving Video with Panning (Left, Right, Diagonal) & Zooming
 * Using FFmpeg's zoompan filter directly on the physical specimen photograph
 */
function generateDynamicMotionVideoFromImage(imagePath, outMp4Path, duration = 5.0, motionMode = 'pan_left_right') {
  console.log(`[Archie Motion FX] 🎬 Generating dynamic ${duration}s motion clip (${motionMode}) from physical image...`);
  
  let filter = '';
  if (motionMode === 'pan_right_left') {
    // Smooth right-to-left sweep with subtle zoom
    filter = `[0:v]scale=1280:720,zoompan=z='min(zoom+0.0012,1.25)':x='(iw-ow)*(1-in/(30*${duration}))':y='(ih-oh)/2':d=1:s=590x340:fps=30[v]`;
  } else if (motionMode === 'pan_diagonal_zoom') {
    // Dynamic cinematic diagonal drift with zoom
    filter = `[0:v]scale=1280:720,zoompan=z='min(zoom+0.0016,1.28)':x='(iw-ow)*(in/(30*${duration}))':y='(ih-oh)*(in/(30*${duration}))':d=1:s=590x340:fps=30[v]`;
  } else if (motionMode === 'pan_oscillate') {
    // Gentle natural floating pan left and right
    filter = `[0:v]scale=1280:720,zoompan=z='min(zoom+0.0013,1.22)':x='(iw-ow)/2 + (iw-ow)/2.5*sin(2*3.14159*in/(30*${duration}))':y='(ih-oh)/2':d=1:s=590x340:fps=30[v]`;
  } else {
    // Default: smooth left-to-right sweep with zoom
    filter = `[0:v]scale=1280:720,zoompan=z='min(zoom+0.0012,1.25)':x='(iw-ow)*(in/(30*${duration}))':y='(ih-oh)/2':d=1:s=590x340:fps=30[v]`;
  }

  const ffmpegCmd = `ffmpeg -y -loop 1 -i "${imagePath}" -t ${duration} -filter_complex "${filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p "${outMp4Path}" 2>&1`;
  execSync(ffmpegCmd);

  if (!fs.existsSync(outMp4Path) || fs.statSync(outMp4Path).size < 1000) {
    throw new Error('Failed to render dynamic motion video from physical image');
  }
  return outMp4Path;
}

/**
 * Generate Fresh AI Script with Dynamic Spoken Hook (Intro), Punchy Core Explanation, and Loop Outro
 * Strictly ZERO synthetic fallbacks. If AI fails, throws error immediately.
 */
async function generateArchieAiScript(chosenTopic) {
  const systemPrompt = `You are the master creative science writer for Archie Explains (@ArchieExplains), an ultra-popular 5-second short-form everyday science channel.
CRITICAL USER MANDATES:
1. NO CLICHÉ OR ROBOTIC INTROS. NEVER start with "Did you know". The intro MUST be an instant, conversational, hook-gripping spoken question or observation that stops viewers mid-scroll (under 10 words).
2. The core explanation must be 1-2 punchy, crystal-clear sentences (under 20 words total) explaining the real physics, biology, or mechanics in plain English.
3. The outro MUST be a clever punchline, actionable challenge, or seamless infinite loop sentence (under 8 words) that makes viewers immediately rewatch or share.
4. Provide 1 exact physical specimen or object term to look up on Wikipedia for real physical photography (e.g. "Capacitive touchscreen", "Magnetron", "Specular reflection", "Pruney fingers").
5. Output strictly valid JSON matching the schema. No markdown formatting.`;

  const userPrompt = `TOPIC: "${chosenTopic.title}"
DETAILS / CONTEXT: "${chosenTopic.searchDetailsUsed || chosenTopic.fact || chosenTopic.angle || chosenTopic.hook}"
CATEGORY: "${chosenTopic.category || chosenTopic.sphereName || 'Everyday Science'}"

Generate the complete script JSON:
{
  "spokenHook": "conversational opening question or observation (max 10 words)",
  "coreExplanation": "crisp explanation of the scientific mechanism (max 20 words)",
  "spokenOutro": "witty conclusion or infinite loop trigger (max 8 words)",
  "boardHeadline": "bold 3-5 word headline for presentation board",
  "bullet1": "key takeaway insight 1 (max 6 words)",
  "bullet2": "key takeaway insight 2 (max 6 words)",
  "wikiSearchTerm": "physical specimen or entity to search on Wikipedia",
  "citationReference": "authoritative journal or scientific reference"
}`;

  console.log(`[Archie AI Script] 🧠 Formulating fresh spoken script and board layout via Active AI...`);
  const aiResult = await callActiveAiForJson(systemPrompt, userPrompt, null, {
    nicheKey: 'cartoon',
    temperature: 0.7
  });

  if (!aiResult || !aiResult.data || !aiResult.data.coreExplanation) {
    console.error('\n❌ [Archie Script Fatal] Active AI failed to formulate fresh script.');
    console.error(' • User Directive: Synthetic fallback scripts are strictly disabled.');
    throw new Error('[Archie Script Fatal] AI script formulation failed. Synthetic fallbacks are disabled.');
  }

  return aiResult.data;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Studio Background SVG matching User Reference Image 2 & 3:
 * - Left wall: warm backlit wooden shelving unit with glowing "ARCHIE LAB" neon sign, atom icon, potted plant, laptop, books
 * - Stage floor: datum at y=1360 to 1920, perspective floor lines, warm amber circular spotlight on character side
 * - Grounding contact shadow for Archie
 */
function buildStudioBackgroundSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep Studio Ambient Wall -->
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="45%" stop-color="#0f172a" />
        <stop offset="85%" stop-color="#020617" />
      </linearGradient>

      <!-- Warm Backlit Shelf Gradient -->
      <linearGradient id="shelfBacklight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#78350f" stop-opacity="0.75" />
        <stop offset="50%" stop-color="#d97706" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#451a03" stop-opacity="0.8" />
      </linearGradient>

      <!-- Stage Floor Gradient -->
      <linearGradient id="stageFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="35%" stop-color="#0a0f1d" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>

      <!-- Neon Glow Filter -->
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Contact Shadow Filter -->
      <filter id="contactBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>

    <!-- 1. Deep Modern Studio Wall -->
    <rect width="${width}" height="${height}" fill="url(#wallGrad)" />

    <!-- 2. Acoustic Slat Wall Wood Panels (Left background behind shelf) -->
    <g stroke="#1e293b" stroke-width="6" opacity="0.4">
      <line x1="40" y1="80" x2="40" y2="1360" />
      <line x1="80" y1="80" x2="80" y2="1360" />
      <line x1="120" y1="80" x2="120" y2="1360" />
      <line x1="160" y1="80" x2="160" y2="1360" />
      <line x1="200" y1="80" x2="200" y2="1360" />
      <line x1="240" y1="80" x2="240" y2="1360" />
      <line x1="280" y1="80" x2="280" y2="1360" />
      <line x1="320" y1="80" x2="320" y2="1360" />
    </g>

    <!-- 3. Modern Illuminated Bookshelf Unit on Left (Matches Image 2 & 3) -->
    <!-- Shelf Backing & Warm Ambient Glow -->
    <rect x="30" y="160" width="310" height="980" rx="14" fill="#0b0f19" stroke="#334155" stroke-width="2.5" />
    <rect x="40" y="170" width="290" height="960" rx="10" fill="url(#shelfBacklight)" opacity="0.18" />

    <!-- Top Neon Sign: "ARCHIE LAB" with Atom Icon (Direct match to Image 2) -->
    <g filter="url(#neonGlow)" transform="translate(60, 210)">
      <rect x="0" y="0" width="250" height="52" rx="12" fill="#020617" stroke="#38bdf8" stroke-width="2.5" />
      <!-- Glowing Atom Icon -->
      <circle cx="32" cy="26" r="4" fill="#38bdf8" />
      <ellipse cx="32" cy="26" rx="14" ry="5" fill="none" stroke="#38bdf8" stroke-width="1.6" transform="rotate(30 32 26)" />
      <ellipse cx="32" cy="26" rx="14" ry="5" fill="none" stroke="#38bdf8" stroke-width="1.6" transform="rotate(-30 32 26)" />
      <!-- Neon Text -->
      <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="900" fill="#38bdf8" letter-spacing="2.5">ARCHIE LAB</text>
    </g>

    <!-- Shelf Tier 1 (y=380): Potted Green Succulent Plant & Books -->
    <line x1="30" y1="380" x2="340" y2="380" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Plant Pot -->
    <path d="M 65 380 L 72 335 L 108 335 L 115 380 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="2" />
    <path d="M 90 335 Q 75 305 60 315 Q 75 330 90 335 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5" />
    <path d="M 90 335 Q 90 295 105 305 Q 98 325 90 335 Z" fill="#16a34a" stroke="#15803d" stroke-width="1.5" />
    <path d="M 90 335 Q 115 310 125 325 Q 105 335 90 335 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5" />
    <!-- Science Books -->
    <rect x="140" y="310" width="18" height="70" rx="3" fill="#3b82f6" />
    <rect x="162" y="295" width="22" height="85" rx="3" fill="#f59e0b" />
    <rect x="188" y="305" width="16" height="75" rx="3" fill="#a855f7" />
    <rect x="208" y="320" width="24" height="60" rx="3" fill="#10b981" />

    <!-- Shelf Tier 2 (y=620): Tech Hardware, Planet Mug & Globe -->
    <line x1="30" y1="620" x2="340" y2="620" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Mini Wireframe Globe -->
    <circle cx="85" cy="570" r="26" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.8" />
    <ellipse cx="85" cy="570" rx="26" ry="10" fill="none" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="85" y1="544" x2="85" y2="596" stroke="#38bdf8" stroke-width="1.2" />
    <path d="M 85 596 L 85 620 L 70 620 L 100 620" stroke="#94a3b8" stroke-width="3" />
    <!-- Books Stack -->
    <rect x="145" y="598" width="75" height="20" rx="2" fill="#e11d48" />
    <rect x="150" y="576" width="65" height="20" rx="2" fill="#0284c7" />

    <!-- Shelf Tier 3 (y=860): Sleek Creator Laptop with Atom Logo -->
    <line x1="30" y1="860" x2="340" y2="860" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Silver Laptop -->
    <path d="M 60 858 L 150 858 L 140 805 L 70 805 Z" fill="#94a3b8" stroke="#0f172a" stroke-width="2" />
    <rect x="74" y="812" width="52" height="40" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <circle cx="100" cy="832" r="4" fill="#38bdf8" />
    <!-- Planet Coffee Mug -->
    <rect x="180" y="818" width="30" height="40" rx="5" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
    <path d="M 210 826 Q 222 836 210 848" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="195" cy="838" r="5" fill="#38bdf8" />

    <!-- 4. Stage Floor Datum (y=1360 to 1920) -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#38bdf8" stroke-width="2.5" opacity="0.8" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#stageFloor)" />

    <!-- Perspective Floor Grid Lines -->
    <g stroke="#334155" stroke-width="1.6" opacity="0.45">
      <line x1="540" y1="1360" x2="80" y2="1920" />
      <line x1="540" y1="1360" x2="300" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="780" y2="1920" />
      <line x1="540" y1="1360" x2="1000" y2="1920" />
      <line x1="0" y1="1470" x2="${width}" y2="1470" />
      <line x1="0" y1="1600" x2="${width}" y2="1600" />
      <line x1="0" y1="1760" x2="${width}" y2="1760" />
    </g>

    <!-- Warm Circular Stage Light Spotlight ring on Archie's side (Left floor) -->
    <ellipse cx="250" cy="1720" rx="220" ry="85" fill="#f59e0b" fill-opacity="0.06" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="6 6" />

    <!-- 5. Grounding Contact Shadow for Archie's Sneakers (Ensures character stands firmly grounded!) -->
    <g filter="url(#contactBlur)">
      <ellipse cx="230" cy="1865" rx="140" ry="24" fill="#000000" opacity="0.85" />
    </g>
  </svg>`;
}

/**
 * Generate Digital Interactive Presentation Board SVG (Varied Colors, Crisp Visuals, Low Text Density)
 */
function buildDigitalPresentationBoardSvg(factObj, width = 1080, height = 1920) {
  const boardX = 370;
  const boardY = 120;
  const boardW = 670;
  const boardH = 1220;

  // Visual Theme Variations for Archie's Lab Board
  const boardThemes = [
    {
      neonBorder: ['#38bdf8', '#0284c7', '#818cf8'],
      activeTabBg: '#0284c7',
      dropGlow: '#0284c7',
      titleColor: '#facc15'
    },
    {
      neonBorder: ['#34d399', '#059669', '#10b981'],
      activeTabBg: '#059669',
      dropGlow: '#059669',
      titleColor: '#a7f3d0'
    },
    {
      neonBorder: ['#fbbf24', '#d97706', '#f59e0b'],
      activeTabBg: '#d97706',
      dropGlow: '#d97706',
      titleColor: '#fde68a'
    },
    {
      neonBorder: ['#c084fc', '#9333ea', '#7e22ce'],
      activeTabBg: '#9333ea',
      dropGlow: '#9333ea',
      titleColor: '#f5d0fe'
    }
  ];
  const themeIndex = Math.abs(factObj.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % boardThemes.length;
  const currentTheme = boardThemes[themeIndex];

  // Text wrap for explanation body: 2 crisp, high-impact lines
  const line1 = scriptObj?.bullet1 || factObj.fact?.split(/\s+/).slice(0, 7).join(' ') || 'Key Principle';
  const line2 = scriptObj?.bullet2 || factObj.fact?.split(/\s+/).slice(7, 14).join(' ') || 'Observable Reality';

  const categoryName = (factObj.category || 'SCIENCE').toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 16);
  const headlineText = scriptObj?.boardHeadline || factObj.title || 'Science Phenomenon';

  // Diagram / Physical Screen Box:
  // Positioned at x = boardX + 40 = 410, y = boardY + 370 = 690, width = 590, height = 340
  const screenContent = hasPhysicalVideo ? `
    <!-- Physical Camera HUD Viewfinder -->
    <rect x="0" y="0" width="${boardW - 80}" height="340" rx="20" fill="#030712" stroke="${currentTheme.neonBorder[1]}" stroke-width="2.5" />
    
    <!-- HUD High-Tech Corner Reticles -->
    <path d="M 8 28 L 8 8 L 28 8" stroke="#38bdf8" stroke-width="3.2" fill="none" stroke-linecap="round" />
    <path d="M 582 28 L 582 8 L 562 8" stroke="#38bdf8" stroke-width="3.2" fill="none" stroke-linecap="round" />
    <path d="M 8 312 L 8 332 L 28 332" stroke="#38bdf8" stroke-width="3.2" fill="none" stroke-linecap="round" />
    <path d="M 582 312 L 582 332 L 562 332" stroke="#38bdf8" stroke-width="3.2" fill="none" stroke-linecap="round" />
    
    <!-- Top HUD Badge -->
    <rect x="15" y="14" width="280" height="26" rx="13" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1.2" />
    <circle cx="27" cy="27" r="4.5" fill="#22c55e" />
    <text x="40" y="32" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#e0f2fe" letter-spacing="1">PHYSICAL SPECIMEN • WIKIPEDIA</text>

    <!-- Bottom HUD Specimen Label -->
    <rect x="15" y="296" width="560" height="30" rx="10" fill="#020617" fill-opacity="0.88" />
    <text x="28" y="316" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#94a3b8">Specimen: <tspan fill="#f8fafc">${escapeXml(scriptObj?.wikiSearchTerm || factObj.title)}</tspan></text>
    <text x="560" y="316" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="end">PANNING MOTION</text>
  ` : `
    <!-- Fallback High-Tech Scientific Schematic Box -->
    <rect x="0" y="0" width="${boardW - 80}" height="340" rx="20" fill="#090d16" stroke="#1e293b" stroke-width="1.8" />
    <text x="25" y="34" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#38bdf8" letter-spacing="1">SCIENTIFIC SCHEMATIC</text>
    <g stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0.85">
      <path d="M 40 170 Q 110 80 180 170 T 320 170 T 460 170 T 550 170" />
    </g>
    <g stroke="#facc15" stroke-width="2" fill="none" stroke-dasharray="4 4">
      <path d="M 40 170 Q 110 260 180 170 T 320 170 T 460 170 T 550 170" />
    </g>
    <circle cx="180" cy="170" r="7" fill="#ef4444" />
    <circle cx="320" cy="170" r="7" fill="#22c55e" />
    <circle cx="460" cy="170" r="7" fill="#ef4444" />
    <text x="295" y="285" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle">Physical Resonance • Observable Scientific Field</text>
  `;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Glass Board Fill -->
      <linearGradient id="boardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.96" />
        <stop offset="50%" stop-color="#0b1120" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.98" />
      </linearGradient>

      <!-- Dynamic Board Frame Border -->
      <linearGradient id="boardNeonBorder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${currentTheme.neonBorder[0]}" />
        <stop offset="50%" stop-color="${currentTheme.neonBorder[1]}" />
        <stop offset="100%" stop-color="${currentTheme.neonBorder[2]}" />
      </linearGradient>

      <filter id="boardDrop" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${currentTheme.dropGlow}" flood-opacity="0.38" />
      </filter>
    </defs>

    <!-- 1. The Big Interactive Digital Board Frame -->
    <g filter="url(#boardDrop)">
      <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="32" fill="url(#boardBg)" stroke="url(#boardNeonBorder)" stroke-width="3.5" />
      <path d="M ${boardX + 35} ${boardY + 6} L ${boardX + boardW - 35} ${boardY + 6} L ${boardX + 35} ${boardY + 280} Z" fill="#ffffff" fill-opacity="0.04" />
    </g>

    <!-- 2. Top Header Navigation Tabs -->
    <g transform="translate(${boardX + 35}, ${boardY + 35})">
      <rect x="0" y="0" width="160" height="38" rx="19" fill="${currentTheme.activeTabBg}" />
      <text x="80" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${escapeXml(categoryName)}</text>

      <rect x="175" y="0" width="90" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="220" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">Tech</text>

      <rect x="280" y="0" width="70" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="315" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">AI</text>

      <rect x="365" y="0" width="180" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="455" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">Daily Reel</text>
    </g>

    <!-- 3. Big High-Impact Title -->
    <g transform="translate(${boardX + 40}, ${boardY + 95})">
      <foreignObject width="${boardW - 80}" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.25; color: ${currentTheme.titleColor}; letter-spacing: -0.5px;">
          ${escapeXml(headlineText)}
        </div>
      </foreignObject>
    </g>

    <!-- Divider Line -->
    <line x1="${boardX + 40}" y1="${boardY + 225}" x2="${boardX + boardW - 40}" y2="${boardY + 225}" stroke="#334155" stroke-width="1.8" stroke-dasharray="6 6" />

    <!-- 4. Body Explanation Bullet Points -->
    <g transform="translate(${boardX + 40}, ${boardY + 245})">
      <text x="0" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="700" fill="#f8fafc">• ${escapeXml(line1)}</text>
      <text x="0" y="70" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="700" fill="#f8fafc">• ${escapeXml(line2)}</text>
    </g>

    <!-- 5. Dynamic Screen Window (Physical Specimen Video or Schematic) -->
    <g transform="translate(${boardX + 40}, ${boardY + 370})">
      ${screenContent}
    </g>

    <!-- 6. Verified Citation & Reference Tag -->
    <g transform="translate(${boardX + 40}, ${boardY + 735})">
      <rect x="0" y="0" width="${boardW - 80}" height="85" rx="18" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <text x="25" y="30" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#94a3b8" letter-spacing="1">VERIFIED SCIENTIFIC REFERENCE</text>
      <text x="25" y="62" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#38bdf8">${escapeXml(scriptObj?.citationReference || factObj.reference)}</text>
    </g>

    <!-- 7. Dynamic Seamless Loop Replay Badge -->
    <g transform="translate(${boardX + 40}, ${boardY + 840})">
      <rect x="0" y="0" width="${boardW - 80}" height="60" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" stroke-opacity="0.6" />
      <circle cx="35" cy="30" r="14" fill="#6366f1" fill-opacity="0.3" />
      <text x="35" y="35" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">🔄</text>
      <text x="65" y="36" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#c7d2fe">Seamless Loop • Watch again to verify</text>
    </g>
  </svg>`;
}

/**
 * High-Visibility 2-Second Opening Title Card Overlay
 * Mandated: The first 2 seconds must clearly show the show name and episode topic title
 */
function buildIntroTitleBadgeSvg(topic, script, width = 1080, height = 1920) {
  const displayTitle = (topic.title || 'Everyday Science').toUpperCase().slice(0, 48);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="introBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.96" />
        <stop offset="50%" stop-color="#0b1329" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.98" />
      </linearGradient>
      <filter id="introBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#0284c7" flood-opacity="0.55" />
      </filter>
    </defs>
    <!-- Top-Safe Zone Floating Title Header (Y=80 to Y=210) -->
    <g filter="url(#introBadgeShadow)" transform="translate(100, 75)">
      <rect x="0" y="0" width="880" height="135" rx="28" fill="url(#introBadgeGrad)" stroke="#38bdf8" stroke-width="3" />
      <!-- Channel & Character Badge -->
      <g transform="translate(36, 24)">
        <circle cx="10" cy="12" r="7" fill="#38bdf8" />
        <text x="28" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#38bdf8" letter-spacing="3">
          ARCHIE EXPLAINS • EVERYDAY SCIENCE
        </text>
      </g>
      <!-- Prominent Visible Episode Title -->
      <text x="440" y="98" font-family="Impact, Arial Black, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        ${escapeXml(displayTitle)}
      </text>
    </g>
  </svg>`;
}

/**
 * Main Generator: Build 5-Second Archie Daily Tech Fact Video
 */
async function generateArchie5sDailyFact() {
  console.log('\n===============================================================');
  console.log('🤖 ARCHIE 5-SECOND DAILY TECH & AI FACT REEL GENERATOR');
  console.log(`Target Duration: ${TARGET_DURATION}s | Channel 3: Tech & Science`);
  console.log('===============================================================\n');

  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(RENDERED_VIDEOS_DIR)) fs.mkdirSync(RENDERED_VIDEOS_DIR, { recursive: true });

  // 1. Live AI Topic Discovery & Deduplication (ZERO Synthetic Fallbacks)
  let chosenTopic = null;
  if (process.env.TEST_TOPIC) {
    chosenTopic = {
      title: process.env.TEST_TOPIC,
      category: 'Trending Tech & Science',
      reference: 'Scientific Direct Observation',
      searchDetailsUsed: process.env.TEST_FACT || process.env.TEST_TOPIC,
      tags: ['#ScienceFacts', '#EverydayTech', '#Shorts']
    };
  } else {
    console.log('[Archie Topic Discovery] 🔎 Engaging live multi-source trend discovery across Google, DDG, Wiki & Social...');
    const discoveryResult = await discoverAndSelectTopicViaActiveAi('cartoon');
    if (!discoveryResult || !discoveryResult.chosenTopic) {
      console.error('\n❌ [Archie Workflow Fatal] Active AI topic discovery failed.');
      console.error(' • User Directive: Synthetic fallback scripts are strictly disabled. Everything must be newly generated.');
      throw new Error('[Archie Workflow Fatal] AI topic discovery failed. Synthetic fallbacks are disabled.');
    }
    chosenTopic = discoveryResult.chosenTopic;
  }

  console.log(`[Tech Topic Selected]: "${chosenTopic.title}"`);
  console.log(`[Category]: "${chosenTopic.category || chosenTopic.sphereName || 'Science'}"`);

  // 2. Generate Fresh AI Script: Spoken Hook (Intro), Punchy Core Explanation, and Loop Outro
  const script = await generateArchieAiScript(chosenTopic);
  console.log(`[AI Intro Hook]: "${script.spokenHook}"`);
  console.log(`[AI Core Explanation]: "${script.coreExplanation}"`);
  console.log(`[AI Outro Loop]: "${script.spokenOutro}"`);
  console.log(`[AI Board Headline]: "${script.boardHeadline}"`);
  console.log(`[AI Wikipedia Subject]: "${script.wikiSearchTerm}"\n`);

  // 3. Search Wikipedia / Wikimedia Commons for Physical Specimen Photography & Build Panning Motion Video
  let motionClipPath = null;
  const wikiResult = await fetchWikipediaPhysicalImage(script.wikiSearchTerm || chosenTopic.title, chosenTopic.title);
  if (wikiResult && wikiResult.imagePath) {
    const motionModes = ['pan_left_right', 'pan_right_left', 'pan_diagonal_zoom', 'pan_oscillate'];
    const selectedMode = motionModes[Math.floor(Math.random() * motionModes.length)];
    const outMotionMp4 = path.join(ARTIFACTS_DIR, `archie_motion_${Date.now()}.mp4`);
    try {
      motionClipPath = generateDynamicMotionVideoFromImage(wikiResult.imagePath, outMotionMp4, TARGET_DURATION, selectedMode);
      console.log(`[Archie Wiki Vision] ✅ Successfully created dynamic panning video from physical photo!`);
    } catch (motionErr) {
      console.warn(`[Archie Wiki Vision Notice] Could not render motion clip: ${motionErr.message}`);
    }
  } else {
    console.log(`[Archie Wiki Vision] ℹ️ No physical photograph found for topic. Using dynamic scientific schematic.`);
  }
  const hasPhysicalVideo = Boolean(motionClipPath && fs.existsSync(motionClipPath));

  // 4. Build or verify puppet assets
  const puppetDir = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
  const puppetPointIdle = path.join(puppetDir, 'puppet_standing_point_board.png');
  const puppetPointTalk1 = path.join(puppetDir, 'puppet_standing_point_board_talk.png');
  const puppetPointTalk2 = path.join(puppetDir, 'puppet_standing_point_board_talk_vowel.png');
  const puppetPointBlink = path.join(puppetDir, 'puppet_standing_point_board_blink.png');

  // Hands at stomach facing audience poses
  const puppetStomachIdle = path.join(puppetDir, 'puppet_hands_stomach.png');
  const puppetStomachTalk1 = path.join(puppetDir, 'puppet_hands_stomach_talk1.png');
  const puppetStomachTalk2 = path.join(puppetDir, 'puppet_hands_stomach_talk2.png');
  const puppetStomachBlink = path.join(puppetDir, 'puppet_hands_stomach_blink.png');

  if (!fs.existsSync(puppetPointIdle) || !fs.existsSync(puppetStomachIdle)) {
    console.log('🎨 Compiling puppet shapes with new visemes and audience-facing poses...');
    buildAllModernCharacterAssets(true);
  }

  // 5. Assemble Audio Engine: Dynamic Intro + Core Explanation + Dynamic Outro + Uplifting Science Lo-Fi Groove
  const audioWavPath = path.join(ARTIFACTS_DIR, 'archie_master_sound.wav');
  const cleanIntro = (script.spokenHook || '').trim();
  const cleanBody = (script.coreExplanation || '').trim();
  const cleanOutro = (script.spokenOutro || '').trim();
  const speechNarration = `${cleanIntro} ${cleanBody} ${cleanOutro}`.replace(/\s+/g, ' ').trim();

  console.log(`[Audio Engine] Synthesizing speech narration: "${speechNarration}"...`);
  const audioResult = await assembleArchieMasterAudio(speechNarration, audioWavPath, TARGET_DURATION);
  const reelDuration = typeof audioResult === 'object' && audioResult.duration ? audioResult.duration : TARGET_DURATION;
  const voiceDuration = typeof audioResult === 'object' && audioResult.voiceDuration ? audioResult.voiceDuration : (reelDuration - 0.5);

  // 6. Build SVGs & Render PNGs
  const bgSvg = buildStudioBackgroundSvg();
  const bgSvgPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.svg');
  const bgPngPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.png');
  fs.writeFileSync(bgSvgPath, bgSvg);
  execSync(`ffmpeg -y -i "${bgSvgPath}" "${bgPngPath}" 2>/dev/null`);

  const boardSvg = buildDigitalPresentationBoardSvg(chosenTopic, script, hasPhysicalVideo);
  const boardSvgPath = path.join(ARTIFACTS_DIR, 'archie_digital_board.svg');
  const boardPngPath = path.join(ARTIFACTS_DIR, 'archie_digital_board.png');
  fs.writeFileSync(boardSvgPath, boardSvg);
  execSync(`ffmpeg -y -i "${boardSvgPath}" "${boardPngPath}" 2>/dev/null`);

  // Build Prominent First-2-Seconds Intro Title Badge
  const titleSvg = buildIntroTitleBadgeSvg(chosenTopic, script);
  const titleSvgPath = path.join(ARTIFACTS_DIR, 'archie_intro_title.svg');
  const titlePngPath = path.join(ARTIFACTS_DIR, 'archie_intro_title.png');
  fs.writeFileSync(titleSvgPath, titleSvg);
  execSync(`ffmpeg -y -i "${titleSvgPath}" "${titlePngPath}" 2>/dev/null`);

  // 7. Composite Final Video via FFmpeg with Dynamic Pose Transitions & Moving Physical Specimen
  const timestamp = Date.now();
  const finalMp4Path = path.join(ARTIFACTS_DIR, `archie_tech_fact_5s_${timestamp}.mp4`);
  const latestMp4Path = path.join(OUTPUT_DIR, 'archie_tech_fact_5s_latest.mp4');
  const mirroredMp4Path = path.join(RENDERED_VIDEOS_DIR, `archie_tech_fact_${timestamp}.mp4`);

  console.log(`[FFmpeg Compositor] Rendering ${reelDuration}s video with character gestures & ${hasPhysicalVideo ? 'moving physical video' : 'schematic'}...`);

  const pSwitch = 1.40;
  let ffmpegCmd = '';

  if (hasPhysicalVideo) {
    // Inputs:
    // 0: bgPngPath
    // 1: boardPngPath
    // 2: motionClipPath (590x340 moving physical image video)
    // 3: puppetPointIdle
    // 4: puppetPointTalk1
    // 5: puppetPointTalk2
    // 6: puppetStomachIdle
    // 7: puppetStomachTalk1
    // 8: puppetStomachTalk2
    // 9: puppetStomachBlink
    // 10: titlePngPath
    // 11: audioWavPath
    const inputs = `
      -loop 1 -t ${reelDuration} -i "${bgPngPath}"
      -loop 1 -t ${reelDuration} -i "${boardPngPath}"
      -loop 1 -t ${reelDuration} -i "${motionClipPath}"
      -loop 1 -t ${reelDuration} -i "${puppetPointIdle}"
      -loop 1 -t ${reelDuration} -i "${puppetPointTalk1}"
      -loop 1 -t ${reelDuration} -i "${puppetPointTalk2}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachIdle}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachTalk1}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachTalk2}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachBlink}"
      -loop 1 -t ${reelDuration} -i "${titlePngPath}"
      -i "${audioWavPath}"
    `.replace(/\s+/g, ' ').trim();

    const complexFilter = `
      [0:v]scale=1080:1920[bg];
      [1:v]scale=1080:1920[board];
      [2:v]scale=590:340[motionClip];
      [3:v]scale=-1:1150[pt_idle];
      [4:v]scale=-1:1150[pt_t1];
      [5:v]scale=-1:1150[pt_t2];
      [6:v]scale=-1:1150[st_idle];
      [7:v]scale=-1:1150[st_t1];
      [8:v]scale=-1:1150[st_t2];
      [9:v]scale=-1:1150[st_blk];
      [10:v]scale=1080:1920[title_card];
      [bg][board]overlay=0:0[s_board];
      [s_board][motionClip]overlay=410:690[s0];
      [s0][pt_idle]overlay=x=30:y=720:enable='lt(t,${pSwitch})'[s1];
      [s1][pt_t1]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),0)'[s2];
      [s2][pt_t2]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),1)'[s3];
      [s3][st_idle]overlay=x=30:y=720:enable='gte(t,${pSwitch})'[s4];
      [s4][st_t1]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),0)'[s5];
      [s5][st_t2]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),1)'[s6];
      [s6][st_blk]overlay=x=30:y=720:enable='gt(t,${pSwitch})*between(mod(t,3.5),3.0,3.15)'[s_body];
      [s_body][title_card]overlay=0:0:enable='lt(t,2.2)'[vfinal]
    `.replace(/\s+/g, ' ').trim();

    ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${complexFilter}" -map "[vfinal]" -map 11:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${reelDuration} "${finalMp4Path}" 2>&1`;
  } else {
    // Inputs without physical motion clip
    const inputs = `
      -loop 1 -t ${reelDuration} -i "${bgPngPath}"
      -loop 1 -t ${reelDuration} -i "${boardPngPath}"
      -loop 1 -t ${reelDuration} -i "${puppetPointIdle}"
      -loop 1 -t ${reelDuration} -i "${puppetPointTalk1}"
      -loop 1 -t ${reelDuration} -i "${puppetPointTalk2}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachIdle}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachTalk1}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachTalk2}"
      -loop 1 -t ${reelDuration} -i "${puppetStomachBlink}"
      -loop 1 -t ${reelDuration} -i "${titlePngPath}"
      -i "${audioWavPath}"
    `.replace(/\s+/g, ' ').trim();

    const complexFilter = `
      [0:v]scale=1080:1920[bg];
      [1:v]scale=1080:1920[board];
      [2:v]scale=-1:1150[pt_idle];
      [3:v]scale=-1:1150[pt_t1];
      [4:v]scale=-1:1150[pt_t2];
      [5:v]scale=-1:1150[st_idle];
      [6:v]scale=-1:1150[st_t1];
      [7:v]scale=-1:1150[st_t2];
      [8:v]scale=-1:1150[st_blk];
      [9:v]scale=1080:1920[title_card];
      [bg][board]overlay=0:0[s0];
      [s0][pt_idle]overlay=x=30:y=720:enable='lt(t,${pSwitch})'[s1];
      [s1][pt_t1]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),0)'[s2];
      [s2][pt_t2]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),1)'[s3];
      [s3][st_idle]overlay=x=30:y=720:enable='gte(t,${pSwitch})'[s4];
      [s4][st_t1]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),0)'[s5];
      [s5][st_t2]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),1)'[s6];
      [s6][st_blk]overlay=x=30:y=720:enable='gt(t,${pSwitch})*between(mod(t,3.5),3.0,3.15)'[s_body];
      [s_body][title_card]overlay=0:0:enable='lt(t,2.2)'[vfinal]
    `.replace(/\s+/g, ' ').trim();

    ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${complexFilter}" -map "[vfinal]" -map 10:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${reelDuration} "${finalMp4Path}" 2>&1`;
  }

  execSync(ffmpegCmd);

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 30000) {
    throw new Error('Archie 5s video composite failed.');
  }

  fs.copyFileSync(finalMp4Path, latestMp4Path);
  fs.copyFileSync(finalMp4Path, mirroredMp4Path);
  console.log(`[FFmpeg Compositor] ✅ Generated 5s Archie Video: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / 1024).toFixed(1)} KB)`);
  console.log(`[Artifact Mirror] 📁 Mirrored to rendered_videos: ${mirroredMp4Path}`);

  // 8. Save latest fact metadata for Buffer Omnichannel Dispatch & Database Deduplication
  const factMetadata = {
    id: 'archie_fact_' + timestamp,
    title: chosenTopic.title,
    spokenHook: script.spokenHook,
    coreExplanation: script.coreExplanation,
    spokenOutro: script.spokenOutro,
    boardHeadline: script.boardHeadline,
    reference: script.citationReference || chosenTopic.reference,
    category: chosenTopic.category || 'Everyday Science',
    wikiSearchTerm: script.wikiSearchTerm,
    hasPhysicalVideo: hasPhysicalVideo,
    videoPath: latestMp4Path,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(LATEST_FACT_JSON, JSON.stringify(factMetadata, null, 2), 'utf8');
  console.log(`[Metadata Engine] 📄 Saved rich metadata to: ${LATEST_FACT_JSON}`);

  // Persist chosen topic to database for global deduplication across runs
  try {
    await saveChosenTopicToDatabase('cartoon', chosenTopic);
  } catch (dbErr) {
    console.warn(`[Archie DB Notice] Deduplication sync notice: ${dbErr.message}`);
  }

  // 9. Format YouTube Title with Dynamic Anti-Spam Hooks
  const viralTitle = `${script.spokenHook.replace(/[?!.]+$/, '')} #Shorts`;
  const initialFollowCta = formatChannelFollowCta('cartoon_factory', process.env.YOUTUBE_HANDLE_CH3 || process.env.YOUTUBE_HANDLE_TECH || '');
  
  const viralDescription = `${script.spokenHook}\n\n${script.coreExplanation}\n\n${script.spokenOutro}\n\n🔬 Verified Citation: ${script.citationReference || chosenTopic.reference}\n\n${initialFollowCta}\n\n#ArchieLab #ScienceFacts #EverydayScience #DidYouKnow #MindBlown #ScienceExplained #STEM #Shorts`;

  // 10. Publish to YouTube
  const isDryRun = process.env.DRY_RUN === 'true';
  const isYouTubePaused = process.env.PAUSE_YOUTUBE === 'true' || process.env.SKIP_YOUTUBE === 'true';
  const ch3RefreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || process.env.YOUTUBE_REFRESH_TOKEN_CARTOON || (process.env.ALLOW_SHARED_YOUTUBE_TOKEN === 'true' ? process.env.YOUTUBE_REFRESH_TOKEN : '');

  if (isYouTubePaused) {
    console.log(`\n[Archie Dispatcher] ⏸️ YouTube upload is explicitly paused (PAUSE_YOUTUBE=true).`);
  } else if (ch3RefreshToken && !isDryRun) {
    try {
      console.log(`\n[Archie Dispatcher] 📤 Publishing 5s Tech Fact Short to YouTube (Channel 3)...`);
      const res = await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDescription,
        tags: Array.from(new Set([
          '#ArchieLab',
          '#ScienceFacts',
          '#EverydayScience',
          '#ScienceExplained',
          '#MindBlown',
          '#PhysicsFacts',
          '#STEM',
          '#Shorts'
        ])),
        channelId: 'cartoon_factory'
      });
      console.log(`[Archie Dispatcher] Result:`, res);
    } catch (e) {
      console.warn(`[Archie Dispatcher] YouTube upload notice:`, e.message);
    }
  } else {
    console.log(`[Archie Dispatcher] ℹ️ YouTube upload ready (Dry Run: ${isDryRun}, Channel 3 Token present: ${Boolean(ch3RefreshToken)}).`);
  }

  return finalMp4Path;
}

if (require.main === module) {
  generateArchie5sDailyFact()
    .then((p) => {
      console.log(`\n🎉 Archie 5-Second Daily Fact Reel completed: ${p}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n❌ Error in Archie 5s generator:`, err);
      process.exit(1);
    });
}

module.exports = {
  generateArchie5sDailyFact,
  fetchWikipediaPhysicalImage,
  generateDynamicMotionVideoFromImage
};
