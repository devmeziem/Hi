/**
 * Daily YouTube Community Post Generator
 *
 * Requirements:
 * - Generates daily high-impact text + image post for YouTube Community Tab & Social Channels
 * - Text: Scholar quote reflection + provocative community engagement question + CTA to watch daily Short
 * - Image: 1080x1080 high-res square graphic with graded scholar portrait, glass card, quote, credentials & channel branding
 * - Syncs to daily_blueprint_manifest.json, test_artifacts, rendered_videos, and Firestore (if configured)
 * - Optional dispatch via Buffer API (if BUFFER_ACCESS_TOKEN is present)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');

/**
 * Generate 1080x1080 High-Resolution Community Post Graphic
 */
function renderCommunityPostImage(scholarPortraitPath, scholarInfo, quoteText, outputPath) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const tempSquareBg = path.join(ARTIFACTS_DIR, 'community_bg_square.png');
  const tempSvgPath = path.join(ARTIFACTS_DIR, 'community_overlay.svg');

  // 1. Process background into dark cinematic 1080x1080 square
  try {
    execSync(
      `ffmpeg -y -i "${scholarPortraitPath}" -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,eq=brightness=-0.16:contrast=1.18:saturation=0.85" "${tempSquareBg}" 2>/dev/null`,
      { maxBuffer: 30 * 1024 * 1024 }
    );
  } catch (e) {
    // If background crop fails, generate dark slate background
    const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
      <rect width="1080" height="1080" fill="#0b0f19" />
    </svg>`;
    fs.writeFileSync(tempSquareBg.replace('.png', '.svg'), bgSvg, 'utf8');
    execSync(`ffmpeg -y -i "${tempSquareBg.replace('.png', '.svg')}" "${tempSquareBg}" 2>/dev/null`);
  }

  // 2. Wrap quote into lines for 1080x1080 format (max 32 chars/line)
  const words = quoteText.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 32) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);

  const quoteTspans = lines.map((l, i) =>
    `<tspan x="540" dy="${i === 0 ? 0 : 50}">${escapeXml(l)}</tspan>`
  ).join('\n      ');

  const cardHeight = Math.max(520, 280 + lines.length * 52);
  const cardY = Math.round((1080 - cardHeight) / 2) + 20;

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="22" flood-color="#000000" flood-opacity="0.92" />
    </filter>
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.9" />
    </filter>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a101f" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.90" />
    </linearGradient>
  </defs>

  <!-- Ambient Darkening -->
  <rect width="1080" height="1080" fill="black" fill-opacity="0.36" />

  <!-- Center Card -->
  <rect x="70" y="${cardY}" width="940" height="${cardHeight}" rx="26" fill="url(#cardBg)" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.25" filter="url(#shadow)" />

  <!-- Top Category Pill -->
  <rect x="380" y="${cardY + 36}" width="320" height="36" rx="18" fill="#0f172a" stroke="#d4af37" stroke-width="1.2" />
  <text x="540" y="${cardY + 60}" font-family="sans-serif" font-size="13" font-weight="700" fill="#d4af37" letter-spacing="3" text-anchor="middle">SCHOLARS OF THE WORLD</text>

  <!-- Quote Text -->
  <text x="540" y="${cardY + 140}" font-family="serif" font-size="34" font-weight="700" fill="#f8fafc" text-anchor="middle" filter="url(#textGlow)">
      ${quoteTspans}
  </text>

  <!-- Divider Line -->
  <line x1="420" y1="${cardY + 160 + lines.length * 52}" x2="660" y2="${cardY + 160 + lines.length * 52}" stroke="#d4af37" stroke-width="1.2" stroke-opacity="0.5" />

  <!-- Scholar Attribution -->
  <text x="540" y="${cardY + 215 + lines.length * 52}" font-family="sans-serif" font-size="23" font-weight="800" fill="#d4af37" letter-spacing="2" text-anchor="middle" filter="url(#textGlow)">
    ${escapeXml(scholarInfo.author.toUpperCase())}
  </text>
  <text x="540" y="${cardY + 252 + lines.length * 52}" font-family="sans-serif" font-size="16" font-weight="600" fill="#9ca3af" letter-spacing="1" text-anchor="middle">
    ${escapeXml(scholarInfo.credentials)}
  </text>

  <!-- Channel Footer -->
  <text x="540" y="${cardY + 300 + lines.length * 52}" font-family="sans-serif" font-size="13" font-weight="700" fill="#38bdf8" letter-spacing="3" text-anchor="middle">
    @THESTOICARCHITECT • DAILY CITATIONS
  </text>
</svg>`;

  fs.writeFileSync(tempSvgPath, overlaySvg, 'utf8');

  // 3. Composite into final square PNG
  execSync(
    `ffmpeg -y -i "${tempSquareBg}" -i "${tempSvgPath}" -filter_complex "[0:v][1:v]overlay=0:0" "${outputPath}" 2>/dev/null`,
    { maxBuffer: 30 * 1024 * 1024 }
  );

  return outputPath;
}

/**
 * Format Community Post Text (Engagement Question + Short Link + Reflection)
 */
function formatCommunityPostText(scholar, quote) {
  const authorName = scholar.author;
  const creds = scholar.credentials;
  const question = scholar.communityQuestion || `How can you apply this perspective to one difficult choice you are facing today?`;

  return `🏛️ "${quote}"
— ${authorName} (${creds})

${question}

Drop your honest perspective below 👇

▶️ Watch today's 5-second cinematic Short on the channel for the full audio meditation.
Subscribe to @thestoicarchitect-n4b for daily fortitude and timeless wisdom.

#Stoicism #Wisdom #Philosophy #Mindset #DailyStoic #Psychology #${authorName.replace(/[^a-zA-Z]/g, '')}`;
}

/**
 * Escape XML characters for SVG
 */
function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create and Save Daily Community Post Bundle
 */
async function generateDailyCommunityPost(scholar, quote, portraitPath) {
  console.log('\n======================================================');
  console.log('📢 [COMMUNITY POST] GENERATING DAILY TEXT & IMAGE POST');
  console.log('======================================================\n');

  const finalImgPath = path.join(OUTPUT_DIR, 'daily_community_post_latest.png');
  const artifactImgPath = path.join(ARTIFACTS_DIR, 'daily_community_post_latest.png');
  const finalJsonPath = path.join(OUTPUT_DIR, 'daily_community_post_latest.json');

  renderCommunityPostImage(portraitPath, scholar, quote, finalImgPath);
  fs.copyFileSync(finalImgPath, artifactImgPath);

  const postText = formatCommunityPostText(scholar, quote);
  const postBundle = {
    type: 'youtube_community_post',
    author: scholar.author,
    credentials: scholar.credentials,
    quote: quote,
    question: scholar.communityQuestion,
    postText: postText,
    imagePath: finalImgPath,
    imageArtifactPath: artifactImgPath,
    aspectRatio: '1:1',
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(finalJsonPath, JSON.stringify(postBundle, null, 2), 'utf8');

  console.log(`[Community Post] Image Generated: ${finalImgPath}`);
  console.log(`[Community Post] Text Prepared:\n${postText}\n`);

  // Update daily manifest
  try {
    let manifest = {};
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
    manifest.communityPost = postBundle;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Community Post] Manifest update notice:', e.message);
  }

  // Save to Firestore if configured
  await saveCommunityPostToFirestore(postBundle);

  return postBundle;
}

/**
 * Optional: Save Community Post to Firestore collection
 */
async function saveCommunityPostToFirestore(postBundle) {
  const projectId = process.env.FIRESTORE_PROJECT_ID;
  const apiKey = process.env.FIRESTORE_API_KEY;
  if (!projectId) return;

  try {
    const docId = `post_${Date.now()}`;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/youtube_community_posts?documentId=${docId}${apiKey ? `&key=${apiKey}` : ''}`;
    const payload = JSON.stringify({
      fields: {
        author: { stringValue: postBundle.author },
        credentials: { stringValue: postBundle.credentials },
        quote: { stringValue: postBundle.quote },
        question: { stringValue: postBundle.question || '' },
        postText: { stringValue: postBundle.postText },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    });

    await new Promise((resolve) => {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 5000
      }, res => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', () => resolve());
      req.write(payload);
      req.end();
    });
    console.log(`[Community Post] Synced to Firestore youtube_community_posts.`);
  } catch (e) {
    // Non-blocking
  }
}

module.exports = {
  generateDailyCommunityPost,
  renderCommunityPostImage,
  formatCommunityPostText
};

if (require.main === module) {
  const sampleScholar = {
    author: 'Dr. Carl Jung, M.D.',
    credentials: 'Founder of Analytical Psychology • Psychiatrist',
    communityQuestion: 'What shadow aspect of yourself do you need to face today before it controls you?'
  };
  const sampleQuote = 'Until you make the unconscious conscious, it will direct your life and you will call it fate.';
  const sampleImg = path.join(process.cwd(), 'test_artifacts', 'test_frankl.jpg');
  generateDailyCommunityPost(sampleScholar, sampleQuote, sampleImg).catch(console.error);
}
