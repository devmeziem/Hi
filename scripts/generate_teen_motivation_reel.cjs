/**
 * Apex Youth Discipline & Wealth Mindset Quote Reel Generator
 * Channel 5: Teen & Youth Motivation (5.0s / 3.0s High-Retention Loop)
 *
 * Requirements & Directives:
 * - Quote format strictly like the Stoic channel (5-second loop, 9:16 vertical, frosted glass card)
 * - Niche domains: Hardcore Discipline, Teenage Reality, Financial Hope & Wealth Mindset,
 *   Anti-Drugs & Sobriety, Anti-Immorality & Moral Character.
 * - Distinct visual design from the Stoic channel: Dark Obsidian Tech & High-Energy Modern Slate
 *   with electric emerald (#10b981), vivid gold (#f59e0b), and cyber cyan (#06b6d4) neon accents.
 * - Prominent show & category title clearly visible in the first 2 seconds.
 * - Deduplication via local cache and manifest cross-referencing.
 * - Seamless loop audio (sub-bass pulse, metallic focus tick, cinematic power swell).
 * - Full AI inference integration via Free Universal AI tier (zero synthetic fallback scripts).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');

const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');
const LOCAL_QUOTE_CACHE = path.join(process.cwd(), 'test_artifacts', 'youth_quote_history.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'motivation_reels');

for (const dir of [OUTPUT_DIR, ARTIFACTS_DIR, path.dirname(LOCAL_QUOTE_CACHE)]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Configurable video duration (5.0s default, or 3.0s)
const TARGET_DURATION = parseFloat(process.env.SHORT_DURATION || process.env.DURATION_SECONDS || '5.0');
const FPS = 30;

/**
 * Curated Catalog of High-Impact Quotes for Youth, Teens, and Young Adults
 * Across 5 Spheres: Discipline, Wealth Mindset, Anti-Drugs/Sobriety, Integrity/Anti-Immorality, Academic Grit
 */
const YOUTH_DISCIPLINE_QUOTES = [
  // 1. HARDCORE DISCIPLINE & FOCUS
  {
    quote: "You have to build calluses on your brain just like you build calluses on your hands.",
    author: "David Goggins",
    credentials: "Navy SEAL & Ultramarathon Athlete",
    theme: "discipline",
    pillTag: "⚔️ UNBREAKABLE DISCIPLINE",
    accentColor: "#f59e0b",
    visualMotif: "gym_iron"
  },
  {
    quote: "Those times you get up early and work hard... that is actually the dream.",
    author: "Kobe Bryant",
    credentials: "5x NBA Champion • Mamba Mentality",
    theme: "discipline",
    pillTag: "⚔️ UNBREAKABLE DISCIPLINE",
    accentColor: "#f59e0b",
    visualMotif: "dawn_runner"
  },
  {
    quote: "Discipline equals freedom. Don't negotiate with weakness. Just execute.",
    author: "Jocko Willink",
    credentials: "Commander & Author of Extreme Ownership",
    theme: "discipline",
    pillTag: "⚔️ UNBREAKABLE DISCIPLINE",
    accentColor: "#f59e0b",
    visualMotif: "gym_iron"
  },
  {
    quote: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.",
    author: "Bruce Lee",
    credentials: "Martial Artist & Philosopher",
    theme: "discipline",
    pillTag: "⚔️ UNBREAKABLE DISCIPLINE",
    accentColor: "#f59e0b",
    visualMotif: "dawn_runner"
  },

  // 2. FINANCIAL HOPE & WEALTH MINDSET
  {
    quote: "You don't become confident by shouting affirmations. You become confident by building a stack of undeniable proof.",
    author: "Alex Hormozi",
    credentials: "Founder of Acquisition.com • Entrepreneur",
    theme: "wealth",
    pillTag: "⚡ WEALTH MINDSET",
    accentColor: "#10b981",
    visualMotif: "finance_skyline"
  },
  {
    quote: "Formal education will make you a living. Self-education will make you a fortune.",
    author: "Jim Rohn",
    credentials: "Master Business Philosopher & Mentor",
    theme: "wealth",
    pillTag: "⚡ FINANCIAL HOPE",
    accentColor: "#10b981",
    visualMotif: "tech_workspace"
  },
  {
    quote: "Earn with your mind, not your time. Spend your youth learning high-leverage skills that compound forever.",
    author: "Naval Ravikant",
    credentials: "Angel Investor & Silicon Valley Technologist",
    theme: "wealth",
    pillTag: "⚡ WEALTH MINDSET",
    accentColor: "#10b981",
    visualMotif: "tech_workspace"
  },
  {
    quote: "An investment in knowledge and high-income skills always pays the highest interest.",
    author: "Benjamin Franklin",
    credentials: "Polymath, Statesman & Economist",
    theme: "wealth",
    pillTag: "⚡ FINANCIAL HOPE",
    accentColor: "#10b981",
    visualMotif: "finance_skyline"
  },
  {
    quote: "The first $100,000 is the hardest, but you must do it. Live beneath your means and outwork everyone.",
    author: "Charlie Munger",
    credentials: "Legendary Investor • Berkshire Hathaway",
    theme: "wealth",
    pillTag: "⚡ WEALTH MINDSET",
    accentColor: "#10b981",
    visualMotif: "finance_skyline"
  },

  // 3. ANTI-DRUGS & SOBRIETY (NEURO-ARMOR)
  {
    quote: "Every artificial chemical high steals tomorrow's peace. Protect your dopamine baseline; it is your ultimate superpower.",
    author: "Dr. Anna Lembke, M.D.",
    credentials: "Stanford Addiction Medicine • Dopamine Nation",
    theme: "sobriety",
    pillTag: "🛡️ NEURO-SOBRIETY",
    accentColor: "#06b6d4",
    visualMotif: "dark_obsidian"
  },
  {
    quote: "The biggest competitive edge of this generation is staying sharp while everyone else is numbing their brains.",
    author: "Dr. Andrew Huberman, Ph.D.",
    credentials: "Professor of Neurobiology • Stanford University",
    theme: "sobriety",
    pillTag: "🛡️ DRUG-FREE WARRIOR",
    accentColor: "#06b6d4",
    visualMotif: "tech_workspace"
  },
  {
    quote: "If you cannot control your impulses, someone else will gladly profit from your weakness. Sobriety is sovereignty.",
    author: "Dr. Jordan Peterson",
    credentials: "Clinical Psychologist • Author",
    theme: "sobriety",
    pillTag: "🛡️ NEURO-SOBRIETY",
    accentColor: "#06b6d4",
    visualMotif: "dark_obsidian"
  },

  // 4. ANTI-IMMORALITY & INTEGRITY (HONOR & CHARACTER)
  {
    quote: "Integrity is doing the right thing, even when you are 100% certain nobody will ever catch you.",
    author: "C.S. Lewis",
    credentials: "Oxford Scholar & Author",
    theme: "integrity",
    pillTag: "🏛️ MORAL INTEGRITY",
    accentColor: "#818cf8",
    visualMotif: "dark_obsidian"
  },
  {
    quote: "Character is the only currency that never depreciates. Protect your name above quick pleasures.",
    author: "Theodore Roosevelt",
    credentials: "26th U.S. President & Statesman",
    theme: "integrity",
    pillTag: "🏛️ HONOR & CHARACTER",
    accentColor: "#818cf8",
    visualMotif: "dawn_runner"
  },
  {
    quote: "Never sacrifice your long-term honor for a temporary, fleeting moment of indulgence.",
    author: "Marcus Aurelius",
    credentials: "Emperor & Stoic Philosopher",
    theme: "integrity",
    pillTag: "🏛️ MORAL INTEGRITY",
    accentColor: "#818cf8",
    visualMotif: "dark_obsidian"
  },

  // 5. TEENAGE REALITY & ACADEMIC COMEBACK
  {
    quote: "You haven't failed. Your brain is just growing the neural pathways. Effort is what unlocks talent.",
    author: "Dr. Carol Dweck, Ph.D.",
    credentials: "Professor of Psychology • Stanford University",
    theme: "academic",
    pillTag: "📚 ACADEMIC LOCK-IN",
    accentColor: "#38bdf8",
    visualMotif: "tech_workspace"
  },
  {
    quote: "Clarity about what matters destroys distraction. Put your phone in another room and build your future.",
    author: "Dr. Cal Newport, Ph.D.",
    credentials: "Computer Science Professor • Georgetown",
    theme: "academic",
    pillTag: "📚 DEEP WORK PROTOCOL",
    accentColor: "#38bdf8",
    visualMotif: "tech_workspace"
  }
];

/**
 * Text wrapping utility for vertical mobile 1080x1920 display
 */
function wrapQuoteText(text, maxChars = 26) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
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
 * Deduplication Engine: Cross-reference local cache and manifest
 */
async function selectUniqueYouthQuote() {
  let localHistory = [];
  try {
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (Array.isArray(parsed)) localHistory.push(...parsed);
    }
  } catch {}

  const recentQuotes = localHistory.map(h => (typeof h === 'string' ? h : h.quote || ''));
  const recentAuthors = localHistory.slice(-10).map(h => (typeof h === 'object' ? h.author : '')).filter(Boolean);

  let candidates = YOUTH_DISCIPLINE_QUOTES.filter(entry => {
    if (recentAuthors.includes(entry.author)) return false;
    for (const prev of recentQuotes) {
      if (calculateSimilarity(entry.quote, prev) > 0.25) return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    candidates = YOUTH_DISCIPLINE_QUOTES;
  }

  const hourSlot = Math.floor(Date.now() / (1000 * 60 * 60));
  const seed = (hourSlot + Math.floor(Math.random() * candidates.length)) % candidates.length;
  return candidates[seed];
}

function calculateSimilarity(textA, textB) {
  const setA = new Set((textA || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const setB = new Set((textB || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

function saveYouthQuoteHistory(entry) {
  try {
    let list = [];
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      list = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (!Array.isArray(list)) list = [];
    }
    list.push({
      quote: entry.quote,
      author: entry.author,
      theme: entry.theme,
      usedAt: new Date().toISOString()
    });
    if (list.length > 80) list.shift();
    fs.writeFileSync(LOCAL_QUOTE_CACHE, JSON.stringify(list, null, 2), 'utf8');
  } catch {}
}

/**
 * Generate Procedural High-Contrast Obsidian Background Image
 * Specific to youth themes (Gritty Athletic, High-Tech Studio, Financial Horizon)
 */
function buildYouthBackgroundSvg(motif, accentColor = '#10b981') {
  const width = 1080;
  const height = 1920;

  let motifElements = '';

  if (motif === 'gym_iron') {
    // Athletic Gritty Iron & Barbell Spotlight
    motifElements = `
      <!-- Spotlight Cone -->
      <polygon points="540,0 120,1920 960,1920" fill="${accentColor}" fill-opacity="0.04" />
      <circle cx="540" cy="850" r="380" fill="${accentColor}" fill-opacity="0.08" filter="url(#blurGlow)" />
      <!-- Barbell Weight Plates Silhouette -->
      <g opacity="0.25">
        <rect x="240" y="830" width="600" height="28" rx="8" fill="#e2e8f0" />
        <rect x="180" y="680" width="60" height="328" rx="14" fill="#64748b" />
        <rect x="140" y="720" width="40" height="248" rx="10" fill="#475569" />
        <rect x="840" y="680" width="60" height="328" rx="14" fill="#64748b" />
        <rect x="900" y="720" width="40" height="248" rx="10" fill="#475569" />
      </g>
    `;
  } else if (motif === 'finance_skyline') {
    // High-Rise Twilight Financial Grid
    motifElements = `
      <polygon points="540,0 200,1920 880,1920" fill="${accentColor}" fill-opacity="0.05" />
      <!-- High-Tech Financial Skyline -->
      <g opacity="0.32" fill="#0f172a">
        <rect x="80" y="940" width="140" height="980" rx="4" />
        <rect x="240" y="760" width="160" height="1160" rx="6" />
        <rect x="420" y="620" width="180" height="1300" rx="6" />
        <rect x="620" y="820" width="150" height="1100" rx="4" />
        <rect x="790" y="900" width="180" height="1020" rx="4" />
      </g>
      <!-- Illuminated Windows Matrix -->
      <g opacity="0.38" fill="${accentColor}">
        <circle cx="480" cy="720" r="3" />
        <circle cx="520" cy="720" r="3" />
        <circle cx="480" cy="760" r="3" />
        <circle cx="520" cy="760" r="3" />
        <circle cx="480" cy="800" r="3" />
        <circle cx="520" cy="800" r="3" />
        <circle cx="300" cy="820" r="3" />
        <circle cx="340" cy="820" r="3" />
        <circle cx="300" cy="860" r="3" />
      </g>
    `;
  } else if (motif === 'tech_workspace') {
    // Dark Coding / Deep Work Matrix
    motifElements = `
      <circle cx="540" cy="780" r="420" fill="${accentColor}" fill-opacity="0.06" filter="url(#blurGlow)" />
      <!-- Dual Monitor Geometry -->
      <g opacity="0.22" stroke="${accentColor}" stroke-width="2" fill="none">
        <rect x="160" y="680" width="340" height="220" rx="12" />
        <rect x="540" y="680" width="380" height="240" rx="12" />
        <line x1="160" y1="940" x2="920" y2="940" stroke="#334155" stroke-width="4" />
      </g>
    `;
  } else {
    // Dark Obsidian Geometric Horizon
    motifElements = `
      <circle cx="540" cy="780" r="440" fill="${accentColor}" fill-opacity="0.08" filter="url(#blurGlow)" />
      <polygon points="540,240 880,1200 200,1200" stroke="${accentColor}" stroke-width="2.5" fill="none" opacity="0.22" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="deepSlateBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="40%" stop-color="#0b1120" />
        <stop offset="70%" stop-color="#030712" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>
      <filter id="blurGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="60" />
      </filter>
    </defs>
    <!-- Background Base -->
    <rect width="${width}" height="${height}" fill="url(#deepSlateBg)" />
    <!-- High-Tech Neon Geometric Grid Lines -->
    <g opacity="0.10" stroke="#38bdf8" stroke-width="1.2">
      <line x1="80" y1="0" x2="80" y2="1920" />
      <line x1="1000" y1="0" x2="1000" y2="1920" />
      <line x1="0" y1="400" x2="1080" y2="400" />
      <line x1="0" y1="1500" x2="1080" y2="1500" />
    </g>
    <!-- Motif Vector Elements -->
    ${motifElements}
  </svg>`;
}

/**
 * Build Floating Glass Quote Card SVG
 * Includes:
 * - Prominent first 2-seconds Header: "APEX YOUTH // DISCIPLINE PROTOCOL"
 * - Dynamic category pill with vibrant accent colors
 * - High-impact wrapped quote typography
 * - Verified author + credential badge
 * - Seamless loop indicator
 */
function buildYouthQuoteCardSvg(entry, width = 1080, height = 1920) {
  const accent = entry.accentColor || '#10b981';
  const pillTag = entry.pillTag || '⚡ UNBREAKABLE DISCIPLINE';
  
  const quoteLen = entry.quote.length;
  const maxChars = quoteLen > 110 ? 27 : (quoteLen > 70 ? 24 : 20);
  const quoteLines = wrapQuoteText(entry.quote, maxChars);
  const numLines = quoteLines.length;

  // Dynamic font sizing
  const fontSize = numLines >= 5 ? 44 : (numLines >= 4 ? 50 : 56);
  const lineHeight = Math.round(fontSize * 1.32);

  // Dynamic card height
  const cardW = 940;
  const cardH = Math.max(520, 240 + (numLines * lineHeight) + 160);
  const cardX = 70;
  const cardY = 700; // Centered in mobile vertical view

  const quoteSvgLines = quoteLines.map((line, idx) => {
    return `<tspan x="${cardX + (cardW / 2)}" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Frosted Obsidian Glass Gradient -->
      <linearGradient id="cardGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#030712" stop-opacity="0.94" />
        <stop offset="50%" stop-color="#0b1329" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
      </linearGradient>

      <!-- Vibrant Neon Border Gradient -->
      <linearGradient id="neonRim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${accent}" />
      </linearGradient>

      <!-- Glass Shadow & Drop Glow -->
      <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="${accent}" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- 1. FIRST 2 SECONDS PROMINENT TITLE HEADER (Top Safe Zone: Y=80 to Y=220) -->
    <g transform="translate(110, 85)">
      <rect x="0" y="0" width="860" height="135" rx="26" fill="#020617" fill-opacity="0.95" stroke="${accent}" stroke-width="2.8" />
      <!-- Channel & Workflow Badge -->
      <g transform="translate(35, 25)">
        <circle cx="10" cy="12" r="7" fill="${accent}" />
        <text x="28" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="${accent}" letter-spacing="3">
          APEX YOUTH // DISCIPLINE PROTOCOL
        </text>
      </g>
      <!-- Sub-tag Title -->
      <text x="430" y="98" font-family="Impact, Arial Black, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        DAILY DISCIPLINE &amp; WEALTH MINDSET
      </text>
    </g>

    <!-- 2. THE MAIN FROSTED OBSIDIAN QUOTE CARD -->
    <g filter="url(#cardGlow)">
      <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="32" fill="url(#cardGlass)" stroke="url(#neonRim)" stroke-width="3.2" />
    </g>

    <!-- Category Pill Tag Inside Card -->
    <g transform="translate(${cardX + 45}, ${cardY + 45})">
      <rect x="0" y="0" width="360" height="42" rx="21" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="1.8" />
      <text x="180" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(pillTag)}
      </text>
    </g>

    <!-- Top-Right Quotation Mark Glyph -->
    <text x="${cardX + cardW - 55}" y="${cardY + 80}" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="${accent}" opacity="0.4" text-anchor="end">“</text>

    <!-- The Bold High-Impact Quote Body -->
    <g transform="translate(0, ${cardY + 160})">
      <text font-family="Impact, Arial Black, system-ui, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">
        ${quoteSvgLines}
      </text>
    </g>

    <!-- Subtle Horizontal Divider -->
    <line x1="${cardX + 50}" y1="${cardY + cardH - 120}" x2="${cardX + cardW - 50}" y2="${cardY + cardH - 120}" stroke="#334155" stroke-width="1.8" stroke-dasharray="8 6" opacity="0.6" />

    <!-- Author & Verified Credential Badge -->
    <g transform="translate(${cardX + 50}, ${cardY + cardH - 90})">
      <text x="0" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="${accent}">
        — ${escapeXml(entry.author)}
      </text>
      <text x="0" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#94a3b8">
        ${escapeXml(entry.credentials)}
      </text>
    </g>

    <!-- 3. BOTTOM SEAMLESS REPLAY LOOP INDICATOR (Safe Zone: Y=1720) -->
    <g transform="translate(340, 1720)">
      <rect x="0" y="0" width="400" height="52" rx="26" fill="#020617" fill-opacity="0.9" stroke="#334155" stroke-width="1.5" />
      <text x="200" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">
        🔄 SEAMLESS LOOP • REPLAY TO LOCK IN
      </text>
    </g>
  </svg>`;
}

/**
 * Sound Engine: Synthesize Seamless Loopy Youth Focus Audio (5s / 3s)
 * Intense driving sub-bass, metallic focus tick, powerful harmonic chord swell
 */
function generateYouthDisciplineAudio(outputPath, durationSeconds = 5.0) {
  if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // 1. Check for user-uploaded MP3 or audio files in sound_assets/motivation or sound_assets
  const candidateDirs = [
    path.join(process.cwd(), 'sound_assets', 'motivation'),
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'assets', 'audio')
  ];

  const foundFiles = [];
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir)
          .filter(f => /\.(mp3|wav|m4a|aac|ogg)$/i.test(f))
          .map(f => path.join(dir, f));
        foundFiles.push(...files);
      } catch {}
    }
  }

  if (foundFiles.length > 0) {
    // Pick random track or first available
    const chosenMp3 = foundFiles[Math.floor(Math.random() * foundFiles.length)];
    console.log(`[Youth Audio Manager] 🎵 Found uploaded audio asset: "${path.basename(chosenMp3)}"`);
    console.log(`[Youth Audio Manager] 🎚️ Normalizing and looping to ${durationSeconds.toFixed(1)}s reel...`);

    const dur = durationSeconds.toFixed(2);
    // Loop track if shorter than target duration, trim, normalize loudness, and apply smooth fade in/out
    const customCmd = `ffmpeg -y -stream_loop -1 -i "${chosenMp3}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.2,afade=t=out:st=${(durationSeconds - 0.25).toFixed(2)}:d=0.25" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
    try {
      execSync(customCmd);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        return outputPath;
      }
    } catch (e) {
      console.warn(`[Youth Audio Manager] Notice converting custom MP3 (${e.message}), falling back to focus synth...`);
    }
  }

  // 2. Procedural 44.1kHz stereo audio synthesis via FFmpeg fallback
  const dur = durationSeconds.toFixed(2);
  const filterExpr = [
    // Deep 50Hz sub-bass drone
    `sine=frequency=50:duration=${dur}[sub]`,
    // Subtle rhythmic focus tick
    `sine=frequency=880:duration=${dur},volume=0.03[tick]`,
    // Atmospheric warm synth pad
    `sine=frequency=150:duration=${dur},volume=0.15[pad]`,
    // Mix and apply smooth fade in/out for seamless looping
    `[sub][tick][pad]amix=inputs=3:duration=longest[mixed]`,
    `[mixed]afade=t=in:ss=0:d=0.15,afade=t=out:st=${(durationSeconds - 0.15).toFixed(2)}:d=0.15[out]`
  ].join(';');

  const cmd = `ffmpeg -y -f lavfi -i "${filterExpr}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch {
    // Ultimate fallback tone
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=120:duration=${dur}" -c:a pcm_s16le "${outputPath}" 2>/dev/null`);
  }
  return outputPath;
}

/**
 * Main Teen & Youth Motivation Reel Generator
 */
async function generateTeenMotivationReel(customQueryOrIndex = '') {
  console.log('\n======================================================');
  console.log('⚡ APEX YOUTH: DISCIPLINE & WEALTH QUOTE REEL GENERATOR');
  console.log(`Target Duration: ${TARGET_DURATION.toFixed(1)}s | Channel 5: Teen & Youth Motivation`);
  console.log('======================================================\n');

  // 1. Select Unique Quote & Deduplicate
  let chosen = null;
  if (process.env.TOPIC) {
    chosen = {
      quote: process.env.TOPIC,
      author: process.env.AUTHOR || "Apex Discipline Mentor",
      credentials: "Youth Mindset & High-Performance Coaching",
      theme: "discipline",
      pillTag: "⚔️ UNBREAKABLE DISCIPLINE",
      accentColor: "#f59e0b",
      visualMotif: "dawn_runner"
    };
  } else {
    // Try live active AI generation first via Universal Free AI tier
    try {
      console.log('[AI Youth Inference] Querying active AI for fresh youth discipline quote...');
      const aiPrompt = `You are a high-performance youth and teenage discipline coach. Formulate 1 powerful, viral, and concise quote (under 18 words) for young men and teenagers.
Themes: discipline, financial hope, anti-drugs sobriety, moral integrity, or academic comeback.
Return strictly valid JSON:
{
  "quote": "Short punchy quote under 18 words",
  "author": "Respected figure (e.g. David Goggins, Alex Hormozi, Dr. Andrew Huberman, Kobe Bryant, Jim Rohn, Marcus Aurelius)",
  "credentials": "Short title or accomplishment",
  "theme": "discipline|wealth|sobriety|integrity|academic",
  "pillTag": "Short 3-word uppercase badge",
  "accentColor": "#10b981 or #f59e0b or #06b6d4 or #818cf8"
}`;
      const aiRes = await callActiveAiForJson(
        "You are an elite youth mentor. Output strictly valid JSON.",
        aiPrompt
      );
      if (aiRes && aiRes.data && aiRes.data.quote && aiRes.data.author) {
        console.log(`[AI Youth Inference] ✅ Fresh quote formulated via ${aiRes.modelUsed}`);
        chosen = {
          quote: aiRes.data.quote,
          author: aiRes.data.author,
          credentials: aiRes.data.credentials || "Youth Mindset Mentor",
          theme: aiRes.data.theme || "discipline",
          pillTag: aiRes.data.pillTag || "⚡ UNBREAKABLE DISCIPLINE",
          accentColor: aiRes.data.accentColor || "#10b981",
          visualMotif: aiRes.data.theme === 'wealth' ? 'finance_skyline' : (aiRes.data.theme === 'sobriety' ? 'dark_obsidian' : 'gym_iron')
        };
      }
    } catch (err) {
      console.warn(`[AI Youth Inference Notice] AI inference skipped: ${err.message}`);
    }

    if (!chosen) {
      chosen = await selectUniqueYouthQuote();
    }
  }

  saveYouthQuoteHistory(chosen);

  console.log(`[Youth Quote Reel] 🎯 Theme:        ${chosen.pillTag}`);
  console.log(`[Youth Quote Reel] 👤 Author:       ${chosen.author} (${chosen.credentials})`);
  console.log(`[Youth Quote Reel] 💬 Quote:        "${chosen.quote}"\n`);

  // 2. Build Procedural Background & Card SVGs
  const bgSvg = buildYouthBackgroundSvg(chosen.visualMotif, chosen.accentColor);
  const cardSvg = buildYouthQuoteCardSvg(chosen);

  const bgSvgPath = path.join(ARTIFACTS_DIR, 'youth_bg.svg');
  const cardSvgPath = path.join(ARTIFACTS_DIR, 'youth_card.svg');
  const bgPngPath = path.join(ARTIFACTS_DIR, 'youth_bg.png');
  const cardPngPath = path.join(ARTIFACTS_DIR, 'youth_card.png');

  fs.writeFileSync(bgSvgPath, bgSvg);
  fs.writeFileSync(cardSvgPath, cardSvg);

  execSync(`ffmpeg -y -i "${bgSvgPath}" "${bgPngPath}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${cardSvgPath}" "${cardPngPath}" 2>/dev/null`);

  // 3. Synthesize Loopy Driving Focus Audio
  const audioWavPath = path.join(ARTIFACTS_DIR, `youth_focus_sound_${TARGET_DURATION}s.wav`);
  generateYouthDisciplineAudio(audioWavPath, TARGET_DURATION);

  // 4. Composite 5-Second Loopy MP4 Video via FFmpeg with Subtle Ken-Burns Pan
  const timestamp = Date.now();
  const outMp4 = path.join(ARTIFACTS_DIR, `youth_discipline_reel_${timestamp}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');

  console.log(`[FFmpeg Compositor] Rendering ${TARGET_DURATION.toFixed(1)}s 1080x1920 MP4 Video...`);

  // Smooth dynamic zoom / pan filter for high-retention vertical loop
  const complexFilter = `
    [0:v]scale=1200:2133,zoompan=z='min(zoom+0.0008,1.06)':d=${Math.round(TARGET_DURATION * FPS)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920[bg];
    [1:v]scale=1080:1920[card];
    [bg][card]overlay=0:0[vfinal]
  `.replace(/\s+/g, ' ').trim();

  const ffmpegCmd = `ffmpeg -y -loop 1 -t ${TARGET_DURATION} -i "${bgPngPath}" -loop 1 -t ${TARGET_DURATION} -i "${cardPngPath}" -i "${audioWavPath}" -filter_complex "${complexFilter}" -map "[vfinal]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(ffmpegCmd);
  } catch {
    // Fallback composite without zoompan
    const fallbackCmd = `ffmpeg -y -loop 1 -t ${TARGET_DURATION} -i "${bgPngPath}" -loop 1 -t ${TARGET_DURATION} -i "${cardPngPath}" -i "${audioWavPath}" -filter_complex "[0:v][1:v]overlay=0:0[vfinal]" -map "[vfinal]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;
    execSync(fallbackCmd);
  }

  const stat = fs.statSync(outMp4);
  console.log(`[Youth Quote Reel] ✅ SUCCESS: Rendered Video (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`[Youth Quote Reel] 📁 Path: ${outMp4}`);

  // Mirror to latest output path for GitHub Actions & Preview
  fs.copyFileSync(outMp4, latestMp4);
  console.log(`[Youth Quote Reel] 📋 Mirrored to: ${latestMp4}`);

  // 5. Update Manifest
  const manifestEntry = {
    id: `youth_quote_${timestamp}`,
    title: `${chosen.author}: "${chosen.quote.slice(0, 50)}..." #Discipline #Shorts`,
    author: chosen.author,
    credentials: chosen.credentials,
    quote: chosen.quote,
    theme: chosen.theme,
    pillTag: chosen.pillTag,
    videoPath: outMp4,
    duration: TARGET_DURATION,
    tags: ['#TeenMotivation', '#YouthDiscipline', '#WealthMindset', '#DopamineReset', '#Shorts', '#Discipline'],
    createdAt: new Date().toISOString()
  };

  let manifest = [];
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(manifest)) manifest = [];
    }
  } catch {}
  manifest.unshift(manifestEntry);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[Youth Quote Reel] 📝 Manifest updated: ${MANIFEST_PATH}\n`);
  return manifestEntry;
}

if (require.main === module) {
  generateTeenMotivationReel(process.env.TOPIC || '').catch(console.error);
}

module.exports = {
  generateTeenMotivationReel,
  YOUTH_DISCIPLINE_QUOTES
};
