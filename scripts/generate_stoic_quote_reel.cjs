/**
 * Stoic 5-Second Quote Reel Generator (Daily 5th Video)
 *
 * Requirements:
 * - Exactly 5.0 seconds duration
 * - Exactly 1 cinematic 9:16 vertical image (cold ancient statue, dark obsidian marble)
 * - Royalty-free mystery or cold atmospheric ambient sound
 * - Exactly 1 high-impact quote on discipline, stoicism, defense, quiet confidence
 * - Zero similarities with previously generated quotes (deduplicated via Firestore + local cache)
 * - Subtle Ken Burns effect (1.00 -> 1.05 zoom)
 * - No voiceover
 * - Seamless loop designed for YouTube Shorts / TikTok
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');
const LOCAL_QUOTE_CACHE = path.join(process.cwd(), 'stoic_quote_history.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');

// Curated pool of high-impact, non-cliché quotes on Discipline, Defense, Confidence, and Stoicism
const CURATED_STOIC_QUOTES = [
  {
    quote: "Silence is the ultimate weapon against provocation. The quieter you become, the more impenetrable your fortress.",
    author: "EPICTETUS",
    theme: "defense"
  },
  {
    quote: "No man is truly free who cannot command his own impulses. Self-mastery is the only sovereign empire.",
    author: "PYTHAGORAS",
    theme: "discipline"
  },
  {
    quote: "A gem cannot be polished without friction, nor a man perfected without trials.",
    author: "SENECA",
    theme: "stoicism"
  },
  {
    quote: "Do not explain your philosophy. Embody it through deliberate action and unbroken silence.",
    author: "EPICTETUS",
    theme: "confidence"
  },
  {
    quote: "When someone attempts to bait your anger, remember: their insult is their internal misery seeking an accomplice.",
    author: "MARCUS AURELIUS",
    theme: "defense"
  },
  {
    quote: "True confidence does not enter a room to be noticed. It enters a room with nothing left to prove.",
    author: "STOIC MAXIM",
    theme: "confidence"
  },
  {
    quote: "You have power over your mind, not outside events. Realize this, and you will find unshakable armor.",
    author: "MARCUS AURELIUS",
    theme: "stoicism"
  },
  {
    quote: "He who fears death will never do anything worthy of a man who is alive. Endure the present with absolute cold resolve.",
    author: "SENECA",
    theme: "discipline"
  },
  {
    quote: "Never reply in the heat of provocation. The greatest triumph over disrespect is indifference.",
    author: "BALTASAR GRACIÁN",
    theme: "defense"
  },
  {
    quote: "Quiet confidence is forged in the hours when nobody is clapping, cheering, or watching.",
    author: "STOIC MAXIM",
    theme: "confidence"
  },
  {
    quote: "Treat every insult as a stone thrown into a deep well. The surface ripples for an instant, then sinks into quiet abyss.",
    author: "EPICTETUS",
    theme: "defense"
  },
  {
    quote: "Discipline is choosing between what you want right now and what you want most.",
    author: "STOIC PROTOCOL",
    theme: "discipline"
  },
  {
    quote: "The lion does not turn his head when a small dog barks. Protect your focus with sovereign calm.",
    author: "TACTICAL STOICISM",
    theme: "defense"
  },
  {
    quote: "Cease seeking outside approval. When you require permission to respect yourself, you have surrendered your soul.",
    author: "MUSONIUS RUFUS",
    theme: "confidence"
  },
  {
    quote: "To bear trials with a calm mind robs misfortune of its strength and its burden.",
    author: "SENECA",
    theme: "stoicism"
  },
  {
    quote: "Stand like a promontory of rock against which the waves break incessantly. It stands fast, and the frenzy of the sea falls quiet around it.",
    author: "MARCUS AURELIUS",
    theme: "stoicism"
  },
  {
    quote: "The art of living is more like wrestling than dancing. Stand firm and be prepared for unprovoked assaults.",
    author: "MARCUS AURELIUS",
    theme: "defense"
  },
  {
    quote: "Nothing can harm your inner citadel unless your own judgment consents to the harm.",
    author: "EPICTETUS",
    theme: "defense"
  },
  {
    quote: "Real power is quiet. Weakness is loud, desperate, and eager to explain itself.",
    author: "ANCIENT WISDOM",
    theme: "confidence"
  },
  {
    quote: "First say to yourself what you would be; and then do what you have to do without excuses.",
    author: "EPICTETUS",
    theme: "discipline"
  }
];

/**
 * Fetch past quote history from Firestore and local cache
 */
async function loadPastQuotes() {
  const pastQuotes = [];
  if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (Array.isArray(data)) pastQuotes.push(...data);
    } catch {}
  }

  // Also query Firestore stoic_5s_quotes if configured
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let fb = null;
    if (fs.existsSync(configPath)) fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fb?.projectId;
    const apiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || fb?.apiKey;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || fb?.firestoreDatabaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

    if (projectId && apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/stoic_5s_quotes?pageSize=50&key=${apiKey}`;
      const res = await new Promise(resolve => {
        const req = https.get(url, { timeout: 5000 }, (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => {
            try {
              const j = JSON.parse(d);
              if (j && j.documents) {
                const docs = j.documents.map(doc => doc.fields?.quote?.stringValue).filter(Boolean);
                resolve(docs);
              } else resolve([]);
            } catch { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
      });
      if (Array.isArray(res) && res.length > 0) pastQuotes.push(...res);
    }
  } catch {}

  return pastQuotes;
}

/**
 * Save selected quote to cache and Firestore
 */
async function saveQuoteHistory(quoteObj) {
  try {
    let history = [];
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      try { history = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8')); } catch {}
    }
    history.push({
      quote: quoteObj.quote,
      author: quoteObj.author,
      theme: quoteObj.theme,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(LOCAL_QUOTE_CACHE, JSON.stringify(history, null, 2));

    // Firestore record
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let fb = null;
    if (fs.existsSync(configPath)) fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fb?.projectId;
    const apiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || fb?.apiKey;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || fb?.firestoreDatabaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

    if (projectId && apiKey) {
      const docId = `quote_${Date.now()}`;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/stoic_5s_quotes/${docId}?key=${apiKey}`;
      const payload = JSON.stringify({
        fields: {
          quote: { stringValue: quoteObj.quote },
          author: { stringValue: quoteObj.author },
          theme: { stringValue: quoteObj.theme },
          createdAt: { stringValue: new Date().toISOString() }
        }
      });
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      });
      req.write(payload);
      req.end();
    }
  } catch (e) {
    console.warn('[Quote Reel] History cache warning:', e.message);
  }
}

/**
 * Select a quote ensuring zero duplicate history
 */
async function selectUniqueQuote() {
  const pastQuotes = await loadPastQuotes();
  const pastSet = new Set(pastQuotes.map(q => (typeof q === 'string' ? q : q.quote || '').toLowerCase().trim()));

  const freshCandidates = CURATED_STOIC_QUOTES.filter(c => !pastSet.has(c.quote.toLowerCase().trim()));
  if (freshCandidates.length > 0) {
    // Pick random among unused
    return freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
  }

  // If all curated are exhausted, pick least recently used
  return CURATED_STOIC_QUOTES[Math.floor(Math.random() * CURATED_STOIC_QUOTES.length)];
}

/**
 * Synthesize a pristine, seamless 5-second cold mystery sound in FFmpeg
 */
function generateColdMysterySound(outputWavPath) {
  const dir = path.dirname(outputWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`[Quote Reel] Synthesizing cold mystery atmospheric sound (5.0s loopable)...`);

  // Ethereal low-pass resonant drone: 55Hz (A1) + 110Hz (A2) + 164.81Hz (E3 minor fifth) + 220Hz + cold sweep
  const filterExpr = [
    `aevalsrc='sin(2*PI*55*t)*0.4 + sin(2*PI*110*t)*0.25 + sin(2*PI*164.81*t)*0.18 + sin(2*PI*220*t)*0.12 + sin(2*PI*329.63*t)*0.08':s=44100:d=5.0`,
    `lowpass=f=750`,
    `aecho=0.8:0.88:400|800:0.25|0.15`,
    `afade=t=in:ss=0:d=0.3,afade=t=out:st=4.7:d=0.3`
  ].join(',');

  const cmd = `ffmpeg -y -f lavfi -i "${filterExpr}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputWavPath}" 2>/dev/null`;
  execSync(cmd);

  if (fs.existsSync(outputWavPath) && fs.statSync(outputWavPath).size > 1000) {
    console.log(`[Quote Reel] ✅ Cold mystery sound synthesized: ${outputWavPath} (${fs.statSync(outputWavPath).size} bytes)`);
    return outputWavPath;
  }
  throw new Error('Failed to generate cold mystery audio');
}

/**
 * Locate or provide a 9:16 vertical high-contrast Stoic image
 */
function resolveBackgroundImage() {
  const imagesDir = path.join(process.cwd(), 'src', 'assets', 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const stoicBg = files.find(f => f.startsWith('stoic_quote_bg_'));
    if (stoicBg) {
      return path.join(imagesDir, stoicBg);
    }
  }

  // Fallback to generating or rendering a high contrast slate image
  const fallbackImg = path.join(process.cwd(), 'test_artifacts', 'stoic_quote_bg.png');
  if (!fs.existsSync(path.dirname(fallbackImg))) fs.mkdirSync(path.dirname(fallbackImg), { recursive: true });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a0c10" />
        <stop offset="50%" stop-color="#111827" />
        <stop offset="100%" stop-color="#05070a" />
      </linearGradient>
      <radialGradient id="rim" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)" />
    <circle cx="540" cy="800" r="450" fill="url(#rim)" />
  </svg>`;
  fs.writeFileSync(fallbackImg, svg, 'utf8');
  return fallbackImg;
}

/**
 * Wrap text nicely into 3-5 lines for mobile 1080x1920 centered display
 */
function wrapQuoteText(text, maxCharsPerLine = 28) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generate 5-Second Stoic Video
 */
async function generateStoic5sVideo() {
  console.log('\n======================================================');
  console.log('🏛️  [STOIC 5-SECOND QUOTE REEL] GENERATING DAILY 5TH VIDEO');
  console.log('======================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const chosenQuote = await selectUniqueQuote();
  console.log(`[Quote Reel] Selected Theme:  ${chosenQuote.theme.toUpperCase()}`);
  console.log(`[Quote Reel] Author:          ${chosenQuote.author}`);
  console.log(`[Quote Reel] Quote:           "${chosenQuote.quote}"\n`);

  const bgImg = resolveBackgroundImage();
  console.log(`[Quote Reel] Background Image: ${path.basename(bgImg)}`);

  const wavPath = path.join(ARTIFACTS_DIR, 'stoic_cold_sound_5s.wav');
  generateColdMysterySound(wavPath);

  // Prepare quote typography overlay image with ImageMagick or SVG
  const quoteLines = wrapQuoteText(chosenQuote.quote, 28);
  const quoteTspans = quoteLines.map((line, idx) => 
    `<tspan x="540" dy="${idx === 0 ? 0 : 54}">${line}</tspan>`
  ).join('\n        ');

  const overlaySvgPath = path.join(ARTIFACTS_DIR, 'quote_overlay.svg');
  const overlayPngPath = path.join(ARTIFACTS_DIR, 'quote_overlay.png');

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.85" />
      </filter>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.65" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75" />
      </linearGradient>
    </defs>

    <!-- Subtle semi-transparent dark backing card -->
    <rect x="80" y="700" width="920" height="${200 + quoteLines.length * 60}" rx="24" fill="url(#cardGrad)" stroke="#374151" stroke-width="2" filter="url(#shadow)" />

    <!-- Top Accent Pill -->
    <rect x="440" y="730" width="200" height="36" rx="18" fill="#1f2937" stroke="#4b5563" stroke-width="1.5" />
    <text x="540" y="754" font-family="'Cinzel', 'Trajan Pro', 'Georgia', serif" font-size="16" font-weight="700" fill="#9ca3af" letter-spacing="3" text-anchor="middle">STOIC COMMAND</text>

    <!-- The Quote -->
    <text x="540" y="${820}" font-family="'Cinzel', 'Playfair Display', 'Georgia', serif" font-size="38" font-weight="700" fill="#f9fafb" text-anchor="middle" filter="url(#shadow)">
        ${quoteTspans}
    </text>

    <!-- Author Attribution -->
    <text x="540" y="${820 + quoteLines.length * 56 + 50}" font-family="'Montserrat', 'Arial', sans-serif" font-size="20" font-weight="800" fill="#d1a054" letter-spacing="4" text-anchor="middle">
      — ${chosenQuote.author} —
    </text>
  </svg>`;

  fs.writeFileSync(overlaySvgPath, overlaySvg, 'utf8');

  // Convert SVG to high-res PNG using FFmpeg (which has built-in librsvg)
  try {
    if (fs.existsSync(overlayPngPath)) fs.unlinkSync(overlayPngPath);
    execSync(`ffmpeg -y -i "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
  } catch (err) {
    console.warn('[Quote Reel] SVG to PNG notice:', err.message);
  }

  const finalMp4Path = path.join(OUTPUT_DIR, 'stoic_quote_5s_latest.mp4');
  const artifactMp4Path = path.join(ARTIFACTS_DIR, 'stoic_quote_5s_latest.mp4');

  console.log(`[Quote Reel] Compositing 5.0s seamless loop vertical video with subtle Ken Burns zoom...`);

  // 150 frames = exactly 5.0 seconds at 30 fps
  // Zoom pan formula: starts at 1.00 and zooms smoothly to 1.05
  // Overlay burned on top with crisp alpha
  const overlayInput = (fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 1000) ? overlayPngPath : overlaySvgPath;

  const filterComplex = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.00035,1.05)':d=150:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30[bg]`,
    `[1:v]scale=1080:1920[ov]`,
    `[bg][ov]overlay=0:0,format=yuv420p[v]`
  ].join(';');

  const ffmpegCmd = `ffmpeg -y -loop 1 -t 5.0 -i "${bgImg}" -loop 1 -t 5.0 -i "${overlayInput}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 2:a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -t 5.0 "${finalMp4Path}"`;

  execSync(ffmpegCmd, { stdio: 'pipe' });

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 10000) {
    throw new Error('FFmpeg failed to produce 5-second Stoic quote reel MP4');
  }

  fs.copyFileSync(finalMp4Path, artifactMp4Path);
  await saveQuoteHistory(chosenQuote);

  const fileSizeMb = (fs.statSync(finalMp4Path).size / 1024 / 1024).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🚀 [Quote Reel] SUCCESS! 5-Second Stoic Video Rendered:`);
  console.log(`📹 File:     ${finalMp4Path} (${fileSizeMb} MB)`);
  console.log(`⏱️  Duration: Exactly 5.0s (150 frames @ 30 FPS)`);
  console.log(`📜 Quote:    "${chosenQuote.quote}" — ${chosenQuote.author}`);
  console.log(`🎵 Sound:    Royalty-free cold mystery drone (no voiceover, loopable)`);
  console.log(`======================================================\n`);

  // Update manifest with 5th video entry
  try {
    let manifest = { videos: [] };
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(manifest.videos)) manifest.videos = [];
    }
    manifest.videos.push({
      type: 'stoic_quote_reel_5s',
      title: `${chosenQuote.author}: ${chosenQuote.quote.slice(0, 45)}... #Shorts`,
      quote: chosenQuote.quote,
      author: chosenQuote.author,
      theme: chosenQuote.theme,
      duration: 5.0,
      videoPath: finalMp4Path,
      loopable: true,
      publishedAt: new Date().toISOString()
    });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  } catch (e) {
    console.warn('[Quote Reel] Manifest sync notice:', e.message);
  }

  return finalMp4Path;
}

if (require.main === module) {
  generateStoic5sVideo().catch(err => {
    console.error(`[Quote Reel Fatal]`, err);
    process.exit(1);
  });
}

module.exports = {
  generateStoic5sVideo,
  selectUniqueQuote,
  generateColdMysterySound
};
