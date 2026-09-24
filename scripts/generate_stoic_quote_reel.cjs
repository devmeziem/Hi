/**
 * Stoic & Psychology Impact Quote Reel Generator (Channel 2: The Stoic Architect)
 *
 * Implements exact visual aesthetic from user reference screenshots:
 * - High Psychological Impact quotes (Machiavelli, Schopenhauer, Jung, Greene, Nietzsche, Dostoevsky, Freud, Kafka, Aurelius, Seneca, Epictetus, Sun Tzu, Pascal, Gracián, Kierkegaard, Frankl)
 * - Zero-Pill Discipline: No clunky cardboard boxes or generic pill buttons.
 * - Feathered cinematic dark vignette background preserving full portrait visibility.
 * - Elegant Georgia serif typography with drop-shadow glow and warm amber quotation mark.
 * - Minimalist dashed author attribution and refined academic/historical credentials.
 * - Subtle ambient audio credit: "Hans Zimmer · S.T.A.Y." style deep psychological soundscapes.
 * - Slow hypnotic Ken Burns zoom pushing into the thinker's face.
 * - Curated viral hashtags (#stoic #stoicism #psychology #mindset #motivation #quotes #wisdom #philosophy #shorts #darkpsychology #power #humanbehavior).
 * - Full deduplication via Firestore and local cache.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { getSyncedChannelProfile, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { resolveChannelAudio } = require('./audio_asset_manager.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const { CURATED_PSYCHOLOGY_QUOTES, VIRAL_PSYCHOLOGY_TAGS, generatePsychologyViralTitle } = require('./stoic_psychology_vault.cjs');

const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');
const LOCAL_QUOTE_CACHE = path.join(process.cwd(), 'stoic_quote_history.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const PORTRAITS_DIR = path.join(ARTIFACTS_DIR, 'scholar_portraits');

// Configurable video duration (5.0s default, or 3.0s)
const TARGET_DURATION = parseFloat(process.env.SHORT_DURATION || process.env.DURATION_SECONDS || '5.0');
const FPS = 30;
const TOTAL_FRAMES = Math.round(TARGET_DURATION * FPS);

const WORLD_SCHOLARS_QUOTES = CURATED_PSYCHOLOGY_QUOTES;

/**
 * Public Search: Resolve Scholar Portrait Image from Wikipedia / Wikimedia Commons
 * Prioritizes direct high-res Wikimedia URLs, falls back to Wikipedia REST API, then Pollinations FLUX.
 */
async function resolveScholarPortrait(scholar) {
  if (!fs.existsSync(PORTRAITS_DIR)) fs.mkdirSync(PORTRAITS_DIR, { recursive: true });

  const safeName = scholar.wikiSearch || scholar.author.replace(/[^a-zA-Z0-9]/g, '_');
  const portraitPath = path.join(PORTRAITS_DIR, `${safeName}.jpg`);

  // Check cached image first
  if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 10000) {
    console.log(`[Scholar Portrait] Using cached portrait for ${scholar.author}`);
    return portraitPath;
  }

  console.log(`[Scholar Portrait] Sourcing portrait for: "${scholar.author}"...`);

  let fetchedUrl = scholar.directUrl || null;

  // If no direct URL, query Wikipedia REST API summary
  if (!fetchedUrl) {
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scholar.wikiSearch)}`;
      const pageData = await new Promise((resolve) => {
        const req = https.get(summaryUrl, {
          headers: {
            'User-Agent': 'VoxamScholarBot/2.0 (educational citation video creator; contact@voxam.ai)',
            'Accept': 'application/json'
          },
          timeout: 8000
        }, res => {
          let raw = '';
          res.on('data', chunk => { raw += chunk; });
          res.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });

      if (pageData) {
        if (pageData.originalimage && pageData.originalimage.source && !pageData.originalimage.source.endsWith('.svg')) {
          fetchedUrl = pageData.originalimage.source;
        } else if (pageData.thumbnail && pageData.thumbnail.source) {
          fetchedUrl = pageData.thumbnail.source.replace(/\/\d+px-/, '/1080px-');
        }
      }
    } catch (err) {
      console.warn(`[Scholar Portrait] Wikipedia summary notice: ${err.message}`);
    }
  }

  // Secondary Wikipedia query search if needed
  if (!fetchedUrl) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scholar.author + ' portrait philosopher')}&prop=pageimages&pithumbsize=1080&format=json`;
      const searchData = await new Promise((resolve) => {
        const req = https.get(searchUrl, {
          headers: {
            'User-Agent': 'VoxamScholarBot/2.0 (educational citation video creator; contact@voxam.ai)',
            'Accept': 'application/json'
          },
          timeout: 8000
        }, res => {
          let raw = '';
          res.on('data', chunk => { raw += chunk; });
          res.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });

      const pages = searchData?.query?.pages || {};
      for (const pid of Object.keys(pages)) {
        if (pages[pid]?.thumbnail?.source) {
          fetchedUrl = pages[pid].thumbnail.source;
          break;
        }
      }
    } catch (err) {
      console.warn(`[Scholar Portrait] Wikipedia search fallback notice: ${err.message}`);
    }
  }

  // Download image if URL was resolved
  if (fetchedUrl) {
    try {
      console.log(`[Scholar Portrait] Downloading verified public portrait: ${fetchedUrl.slice(0, 70)}...`);
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(portraitPath);
        const req = https.get(fetchedUrl, {
          headers: {
            'User-Agent': 'VoxamScholarBot/2.0 (educational citation video creator; contact@voxam.ai)'
          },
          timeout: 10000
        }, res => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, r2 => {
              r2.pipe(file);
              file.on('finish', () => { file.close(resolve); });
            }).on('error', reject);
            return;
          }
          res.pipe(file);
          file.on('finish', () => { file.close(resolve); });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')); });
      });

      if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 5000) {
        console.log(`[Scholar Portrait] Successfully fetched portrait (${(fs.statSync(portraitPath).size / 1024).toFixed(1)} KB)`);
        return portraitPath;
      }
    } catch (err) {
      console.warn(`[Scholar Portrait] Image download notice: ${err.message}`);
    }
  }

  // Fallback 1: Pollinations FLUX high-fidelity chiaroscuro portrait
  console.log(`[Scholar Portrait] Rendering photorealistic cinematic chiaroscuro portrait for ${scholar.author}...`);
  const aiPrompt = encodeURIComponent(`Cinematic 9:16 vertical 8k photorealistic dark portrait of ${scholar.author}, ${scholar.credentials}, dramatic chiaroscuro side lighting, dark obsidian textured stone background, classical philosopher atmosphere, moody film grain, masterpiece`);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=1080&height=1920&model=flux&nologo=true`;

  try {
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(portraitPath);
      const req = https.get(pollinationsUrl, { timeout: 12000 }, res => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => { file.close(resolve); });
        } else {
          reject(new Error(`AI generation returned HTTP ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('AI image timeout')); });
    });

    if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 10000) {
      console.log(`[Scholar Portrait] AI likeness rendered successfully.`);
      return portraitPath;
    }
  } catch (e) {
    console.warn(`[Scholar Portrait] AI generation notice: ${e.message}`);
  }

  // Fallback 2: Classical dark slate scholar silhouette
  console.log(`[Scholar Portrait] Generating classical dark slate scholar silhouette...`);
  const fallbackSvgPath = path.join(PORTRAITS_DIR, `${safeName}_fallback.svg`);
  const fallbackPngPath = path.join(PORTRAITS_DIR, `${safeName}_fallback.png`);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#050814" />
        <stop offset="30%" stop-color="#0f172a" />
        <stop offset="70%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#020408" />
      </linearGradient>
      <radialGradient id="scholarAura" cx="50%" cy="38%" r="45%">
        <stop offset="0%" stop-color="#d4af37" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)" />
    <circle cx="540" cy="720" r="420" fill="url(#scholarAura)" />
    <path d="M 540 460 C 470 460, 420 520, 420 600 C 420 680, 460 740, 540 740 C 620 740, 660 680, 660 600 C 660 520, 610 460, 540 460 Z" fill="#1e293b" fill-opacity="0.7" />
    <path d="M 330 920 C 330 780, 410 750, 540 750 C 670 750, 750 780, 750 920 C 750 960, 330 960, 330 920 Z" fill="#1e293b" fill-opacity="0.75" />
    <line x1="120" y1="0" x2="120" y2="1920" stroke="#334155" stroke-width="1.5" stroke-opacity="0.3" />
    <line x1="960" y1="0" x2="960" y2="1920" stroke="#334155" stroke-width="1.5" stroke-opacity="0.3" />
  </svg>`;

  fs.writeFileSync(fallbackSvgPath, svgContent, 'utf8');
  execSync(`ffmpeg -y -i "${fallbackSvgPath}" "${fallbackPngPath}" 2>/dev/null`);
  return fallbackPngPath;
}

/**
 * Wrap text into clean lines (max 26 chars/line for vertical mobile 1080x1920 display)
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

/**
 * Escape XML for SVG
 */
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate 5-Second / 3-Second Loopy YouTube Short / TikTok Reel
 */
async function generateStoic5sVideo() {
  console.log('\n======================================================');
  console.log(`🏛️  [PSYCHOLOGY & STOIC REEL] GENERATING DAILY ${TARGET_DURATION.toFixed(1)}s VIDEO`);
  console.log('======================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // 1. Select Unique Scholar & Quote with Anti-Spam Cross-Runner Deduplication
  const chosen = await selectDeduplicatedCandidate('stoic', WORLD_SCHOLARS_QUOTES, q => q.quote, q => q.author);
  console.log(`[Quote Reel] Scholar:      ${chosen.author}`);
  console.log(`[Quote Reel] Credentials:  ${chosen.credentials}`);
  console.log(`[Quote Reel] Concept:      ${chosen.psychologicalConcept || chosen.theme}`);
  console.log(`[Quote Reel] Quote:        "${chosen.quote}"\n`);

  // 2. Resolve Scholar Portrait via Direct/Wikipedia/AI
  const portraitPath = await resolveScholarPortrait(chosen);

  // 3. Resolve Seamless Loopy Audio from sound_assets/stoic/
  const wavPath = path.join(ARTIFACTS_DIR, `scholar_mystery_sound_${TARGET_DURATION}s.wav`);
  resolveChannelAudio('stoic', TARGET_DURATION, wavPath);

  // 4. Prepare High-Contrast Caption Overlay with ZERO-PILL DISCIPLINE
  // Matching user's screenshots:
  // - Feathered dark vignette background (seamless blend into portrait)
  // - Large golden quote mark “
  // - Georgia bold serif typography with glow shadow
  // - Refined accent line
  // - Clean author attribution: - Niccolò Machiavelli
  // - Subtitle credentials
  // - Audio tag indicator
  const quoteLen = chosen.quote.length;
  const maxChars = quoteLen > 110 ? 27 : (quoteLen > 65 ? 24 : 21);
  const quoteLines = wrapQuoteText(chosen.quote, maxChars);
  const numLines = quoteLines.length;

  let fontSize = 48;
  let lineHeight = 66;
  let authorFontSize = 29;
  let credFontSize = 17;

  if (numLines <= 2) {
    fontSize = 52;
    lineHeight = 72;
    authorFontSize = 30;
    credFontSize = 18;
  } else if (numLines === 3) {
    fontSize = 46;
    lineHeight = 64;
    authorFontSize = 28;
    credFontSize = 17;
  } else if (numLines === 4) {
    fontSize = 40;
    lineHeight = 56;
    authorFontSize = 26;
    credFontSize = 16;
  } else {
    fontSize = 35;
    lineHeight = 48;
    authorFontSize = 24;
    credFontSize = 15;
  }

  const quoteTspans = quoteLines.map((line, idx) =>
    `<tspan x="540" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('\n        ');

  // Exact vertical calculation strictly within safe area (safe from YouTube/TikTok bottom & top controls)
  // Total quote block height
  const quoteBlockHeight = (numLines - 1) * lineHeight;
  // Desired center baseline around Y=1040 (upper edge of lower half)
  const quoteStartY = Math.max(860, 1080 - Math.round(quoteBlockHeight / 2) - 40);
  const quoteBottomY = quoteStartY + quoteBlockHeight;
  const dividerY = quoteBottomY + 36;
  const authorY = dividerY + 44;
  const credY = authorY + 32;
  const soundTagY = credY + 38;

  const overlaySvgPath = path.join(ARTIFACTS_DIR, 'quote_overlay.svg');
  const overlayPngPath = path.join(ARTIFACTS_DIR, 'quote_overlay.png');

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.9" />
      </filter>
      <linearGradient id="cinematicVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.45" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.84" />
        <stop offset="85%" stop-color="#01040f" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.98" />
      </linearGradient>
    </defs>

    <!-- Subtle Cinematic Vignette Background (No Box / Zero-Pill) -->
    <rect x="0" y="660" width="1080" height="1260" fill="url(#cinematicVignette)" />

    <!-- Stylized Elegant Quotation Mark -->
    <text x="540" y="${quoteStartY - 45}" font-family="Georgia, serif" font-size="82" font-weight="900" fill="#f59e0b" fill-opacity="0.85" text-anchor="middle" filter="url(#textGlow)">“</text>

    <!-- Complete High-Contrast Quote Text (All lines rendered in prestige Georgia serif) -->
    <text x="540" y="${quoteStartY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
        ${quoteTspans}
    </text>

    <!-- Accent Divider Bar -->
    <line x1="430" y1="${dividerY}" x2="650" y2="${dividerY}" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.85" />

    <!-- Scholar Name Attribution: e.g. - Niccolò Machiavelli -->
    <text x="540" y="${authorY}" font-family="system-ui, -apple-system, sans-serif" font-size="${authorFontSize}" font-weight="800" fill="#f8fafc" letter-spacing="1.5" text-anchor="middle" filter="url(#textGlow)">
      - ${escapeXml(chosen.author)}
    </text>

    <!-- Exact Credentials / Field of Scholarship -->
    <text x="540" y="${credY}" font-family="system-ui, -apple-system, sans-serif" font-size="${credFontSize}" font-weight="600" fill="#cbd5e1" letter-spacing="0.8" text-anchor="middle" filter="url(#textGlow)">
      ${escapeXml(chosen.credentials)}
    </text>

    <!-- Soundtrack Tag Reference (like TikTok/Reels audio attribution) -->
    <text x="540" y="${soundTagY}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" letter-spacing="1.2" text-anchor="middle">
      🎵 Hans Zimmer · S.T.A.Y. (Ambient Interstellar Chords)
    </text>
  </svg>`;

  fs.writeFileSync(overlaySvgPath, overlaySvg, 'utf8');

  // Convert SVG to PNG
  try {
    if (fs.existsSync(overlayPngPath)) fs.unlinkSync(overlayPngPath);
    let rasterized = false;
    try {
      execSync(`rsvg-convert -w 1080 -h 1920 "${overlaySvgPath}" -o "${overlayPngPath}" 2>/dev/null`);
      rasterized = fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 2000;
    } catch (_) {}

    if (!rasterized) {
      try {
        execSync(`convert -background none -density 150 "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
        rasterized = fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 2000;
      } catch (_) {}
    }

    if (!rasterized) {
      execSync(`ffmpeg -y -i "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
    }
  } catch (err) {
    console.warn('[Quote Reel] SVG rasterizer notice:', err.message);
  }

  const finalMp4Path = path.join(OUTPUT_DIR, 'stoic_quote_5s_latest.mp4');
  const artifactMp4Path = path.join(ARTIFACTS_DIR, 'stoic_quote_5s_latest.mp4');

  console.log(`[Quote Reel] Compositing ${TARGET_DURATION}s seamless loop video with cinematic Ken Burns camera panning...`);

  const overlayInput = (fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 1000) ? overlayPngPath : overlaySvgPath;

  // Determine dynamic pan direction (smooth Left->Right or Right->Left based on scholar/quote)
  const isPanRight = (chosen.quote.length % 2 === 0);
  const panXFormula = isPanRight
    ? `(iw-iw/zoom)*(0.18+0.64*(on/${TOTAL_FRAMES}))`
    : `(iw-iw/zoom)*(0.82-0.64*(on/${TOTAL_FRAMES}))`;

  // Ken Burns formula: 1280x2276 canvas allows 200px horizontal panning margin, smoothly sliding across scholar's face
  const filterComplex = [
    `[0:v]scale=1280:2276:force_original_aspect_ratio=increase,crop=1280:2276,zoompan=z='1.08+0.0006*on':d=${TOTAL_FRAMES}:x='${panXFormula}':y='(ih-ih/zoom)*0.24':s=1080x1920:fps=${FPS},eq=brightness=-0.04:contrast=1.14:saturation=0.90,vignette=PI/4.5[bg]`,
    `[1:v]scale=1080:1920[ov]`,
    `[bg][ov]overlay=0:0,format=yuv420p[v]`
  ].join(';');

  const ffmpegCmd = `ffmpeg -y -loglevel error -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${overlayInput}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 2:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}"`;

  try {
    execSync(ffmpegCmd, { maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    console.warn('[Quote Reel] Primary filter complex notice, falling back to safe pan overlay:', err.message);
    const fallbackCmd = `ffmpeg -y -loglevel error -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${overlayInput}" -i "${wavPath}" -filter_complex "[0:v]scale=1180:2098:force_original_aspect_ratio=increase,crop=1180:2098,zoompan=z='1.06':d=${TOTAL_FRAMES}:x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.2':s=1080x1920:fps=${FPS},eq=brightness=-0.06:contrast=1.12[bg];[1:v]scale=1080:1920[ov];[bg][ov]overlay=0:0[v]" -map "[v]" -map 2:a -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}"`;
    execSync(fallbackCmd, { maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  }

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 10000) {
    throw new Error('FFmpeg failed to produce 5-second quote reel MP4');
  }

  fs.copyFileSync(finalMp4Path, artifactMp4Path);
  await saveQuoteHistory(chosen);
  await recordPostedCandidate('stoic', chosen.quote, chosen.author, { theme: chosen.theme, duration: TARGET_DURATION });

  // 5. Format Viral Title, Description, and Targeted Hashtags
  const viralTitle = generatePsychologyViralTitle(chosen);
  const initialFollowCta = formatChannelFollowCta('motivation_stoicism', process.env.YOUTUBE_HANDLE_CH2 || process.env.YOUTUBE_HANDLE_STOIC || '');
  const viralTagsString = VIRAL_PSYCHOLOGY_TAGS.join(' ');

  const viralDescription = `"${chosen.quote}"
- ${chosen.author}
${chosen.credentials}

🧠 Psychological Concept: ${chosen.psychologicalConcept || 'Human Nature & Sovereignty'}
💬 Question: ${chosen.communityQuestion || 'How does this apply to your life today?'}

${initialFollowCta}

${viralTagsString}`;

  const fileSizeMb = (fs.statSync(finalMp4Path).size / 1024 / 1024).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🚀 [Quote Reel] SUCCESS! ${TARGET_DURATION.toFixed(1)}s Scholar Video Rendered:`);
  console.log(`📹 Video File:  ${finalMp4Path} (${fileSizeMb} MB)`);
  console.log(`⏱️  Duration:    Exactly ${TARGET_DURATION.toFixed(1)}s (${TOTAL_FRAMES} frames @ 30 FPS)`);
  console.log(`📜 Scholar:     ${chosen.author}`);
  console.log(`🎓 Reference:   ${chosen.credentials}`);
  console.log(`🏷️  Tags:        ${viralTagsString}`);
  console.log(`======================================================\n`);

  // Update daily blueprint manifest
  try {
    let manifest = { videos: [] };
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(manifest.videos)) manifest.videos = [];
    }
    manifest.videos.push({
      type: 'scholar_quote_reel_5s',
      title: viralTitle,
      description: viralDescription,
      quote: chosen.quote,
      author: chosen.author,
      credentials: chosen.credentials,
      theme: chosen.theme,
      duration: TARGET_DURATION,
      videoPath: finalMp4Path,
      loopable: true,
      publishedAt: new Date().toISOString()
    });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  } catch (e) {
    console.warn('[Quote Reel] Manifest sync notice:', e.message);
  }

  // 7. Publish to YouTube as 5s Viral Short (Channel 2: The Stoic Architect)
  const isDryRun = process.env.DRY_RUN === 'true';
  const clientId = process.env.YOUTUBE_CLIENT_ID_CH2 || process.env.YOUTUBE_CLIENT_ID_STOIC || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_CH2 || process.env.YOUTUBE_CLIENT_SECRET_STOIC || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN_STOIC || process.env.YOUTUBE_REFRESH_TOKEN_STOICISM || (process.env.ALLOW_SHARED_YOUTUBE_TOKEN === 'true' ? process.env.YOUTUBE_REFRESH_TOKEN : '');

  if (clientId && clientSecret && refreshToken && !isDryRun) {
    try {
      console.log(`\n[Quote Reel] 📤 Publishing 5s Stoic Quote Reel to YouTube Shorts (Channel 2: The Stoic Architect)...`);
      await uploadQuoteReelToYouTube(finalMp4Path, viralTitle, viralDescription, [
        'stoic', 'stoicism', 'psychology', 'mindset', 'motivation', 'quotes', 'wisdom', 'philosophy', 'shorts', 'darkpsychology', 'power', chosen.author.replace(/[^a-zA-Z0-9]/g, '')
      ]);
    } catch (err) {
      console.warn(`[Quote Reel] YouTube upload notice: ${err.message}`);
    }
  } else if (isDryRun) {
    console.log(`[Quote Reel] ℹ️ Dry Run mode enabled — video saved locally for review without live YouTube upload.`);
  } else {
    console.log(`[Quote Reel] ℹ️ Channel 2 (The Stoic Architect) credentials not provided in environment.`);
  }

  return finalMp4Path;
}

/**
 * Save Chosen Quote to Local Cache
 */
async function saveQuoteHistory(entry) {
  try {
    let localHistory = [];
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      localHistory = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (!Array.isArray(localHistory)) localHistory = [];
    }
    localHistory.push({
      quote: entry.quote,
      author: entry.author,
      credentials: entry.credentials,
      theme: entry.theme,
      usedAt: new Date().toISOString()
    });
    if (localHistory.length > 100) localHistory.shift();
    fs.writeFileSync(LOCAL_QUOTE_CACHE, JSON.stringify(localHistory, null, 2), 'utf8');
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Upload 5s video to YouTube via OAuth2 resumable upload (Channel 2: The Stoic Architect)
 */
async function uploadQuoteReelToYouTube(videoFilePath, title, description, tags = []) {
  const clientId = process.env.YOUTUBE_CLIENT_ID_CH2 || process.env.YOUTUBE_CLIENT_ID_STOIC;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_CH2 || process.env.YOUTUBE_CLIENT_SECRET_STOIC;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN_STOIC;

  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  }).toString();

  const tokenRes = await new Promise((resolve) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(postData);
    req.end();
  });

  if (!tokenRes.access_token) {
    throw new Error('Failed to obtain YouTube OAuth2 access token: ' + (tokenRes.error_description || tokenRes.error || 'unknown'));
  }

  const accessToken = tokenRes.access_token;

  let activeDescription = description;
  try {
    const synced = await getSyncedChannelProfile(accessToken);
    if (synced && synced.handle) {
      console.log(`[Stoic Upload] 🔄 Synced channel profile: "${synced.title}" (${synced.handle})`);
      const dynamicFollow = formatChannelFollowCta('motivation_stoicism', synced.handle, synced.title);
      activeDescription = description.replace(/🏛️ Follow [^\n]+/, dynamicFollow);
    }
  } catch (e) {}

  const metadata = JSON.stringify({
    snippet: {
      title: title.slice(0, 100),
      description: activeDescription,
      tags: tags.slice(0, 15),
      categoryId: '27'
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  });

  const uploadInitReq = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4'
    }
  });

  const uploadUrl = await new Promise((resolve, reject) => {
    uploadInitReq.on('response', (res) => {
      if (res.headers.location) resolve(res.headers.location);
      else reject(new Error('Missing resumable upload Location header'));
    });
    uploadInitReq.on('error', reject);
    uploadInitReq.write(metadata);
    uploadInitReq.end();
  });

  const fileStream = fs.createReadStream(videoFilePath);
  const uploadReq = https.request(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': fs.statSync(videoFilePath).size
    }
  });

  await new Promise((resolve, reject) => {
    uploadReq.on('response', (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) resolve();
      else reject(new Error(`YouTube video upload failed with HTTP ${res.statusCode}`));
    });
    uploadReq.on('error', reject);
    fileStream.pipe(uploadReq);
  });

  console.log('[Stoic Upload] ✅ 5s Video published successfully to YouTube Shorts!');
}

module.exports = {
  generateStoic5sVideo,
  resolveScholarPortrait,
  WORLD_SCHOLARS_QUOTES
};

if (require.main === module) {
  generateStoic5sVideo().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
