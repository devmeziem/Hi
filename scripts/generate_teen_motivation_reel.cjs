/**
 * Apex Youth Motivation Reel Generator (Channel 5: Teen & Youth Motivation)
 *
 * Daily Schedule: 3 Posts Daily
 * - 2 Posts of 5.0 Seconds (Straight to point, one image, Ken Burns zoom/pan,
 *   clean bold floating typography matching user reference image, NO voiceover)
 * - 1 Post of 15.0 Seconds (Public opinion/doubt vs reality proof:
 *   Them/Opinion -> 3s break with blinking cursor -> 1s pitch-black screen ->
 *   New image SLAMS out from center carrying the Me/Reality counter with everyday words + 1 rare word, NO voiceover)
 *
 * Audio Management:
 * - 5s sound picked randomly from `sound_assets/motivation_5s/`
 * - 15s sound picked randomly from `sound_assets/motivation_15s/`
 * - Procedural cinematic synthesis fallback if folders are empty
 *
 * Deduplication:
 * - Integrated with Firestore cloud persistent database + local cache + calendar hashing
 *   to ensure ZERO duplicate posts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveChannelAudio } = require('./audio_asset_manager.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');

const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'motivation_reels');
const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');

for (const dir of [OUTPUT_DIR, ARTIFACTS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Visual Image Assets Available
const MOTIVATION_IMAGES = {
  summitDawn: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_summit_dawn_1790064326003.jpg'),
  doubtRain: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_doubt_rain_1790064342836.jpg'),
  slamPower: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_slam_power_1790064359930.jpg'),
  lateStudy: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_late_study_1789986858935.jpg'),
  gymGrit: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_gym_grit_1789986874331.jpg'),
  dawnAthlete: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_dawn_athlete_1789986845460.jpg'),
  rainStreet: path.join(process.cwd(), 'src', 'assets', 'images', 'teen_rain_street_1789986889074.jpg')
};

// 1. Curated Catalog of 5-Second High-Impact Punchlines (3-Line Clean Reference Format)
const CATALOG_5S_QUOTES = [
  {
    line1: "Nobody is coming.",
    line2: "Build yourself",
    line3: "anyway.",
    author: "Apex Protocol",
    imageKey: "summitDawn",
    theme: "self_reliance"
  },
  {
    line1: "Work in silence.",
    line2: "Shock everyone",
    line3: "with your results.",
    author: "Mamba Mentality",
    imageKey: "gymGrit",
    theme: "execution"
  },
  {
    line1: "You're not behind.",
    line2: "You just started",
    line3: "the real work.",
    author: "Youth Resilience",
    imageKey: "lateStudy",
    theme: "focus"
  },
  {
    line1: "Kill your excuses.",
    line2: "Build undeniable",
    line3: "self-respect.",
    author: "Goggins Protocol",
    imageKey: "dawnAthlete",
    theme: "discipline"
  },
  {
    line1: "Disappear for 6 months.",
    line2: "Reappear with a",
    line3: "different life.",
    author: "High Performance",
    imageKey: "summitDawn",
    theme: "transformation"
  },
  {
    line1: "Don't announce it.",
    line2: "Let your discipline",
    line3: "speak for you.",
    author: "Stoic Youth",
    imageKey: "rainStreet",
    theme: "sovereignty"
  },
  {
    line1: "Nobody cares about potential.",
    line2: "Show them the",
    line3: "finished product.",
    author: "Execution Code",
    imageKey: "gymGrit",
    theme: "mastery"
  },
  {
    line1: "Comfort is a trap.",
    line2: "Fall in love",
    line3: "with the friction.",
    author: "Apex Grind",
    imageKey: "dawnAthlete",
    theme: "grit"
  },
  {
    line1: "They want you distracted.",
    line2: "Stay locked in",
    line3: "and sovereign.",
    author: "Focus Protocol",
    imageKey: "lateStudy",
    theme: "focus"
  },
  {
    line1: "One hard year.",
    line2: "Decades of",
    line3: "complete freedom.",
    author: "Wealth Mindset",
    imageKey: "summitDawn",
    theme: "freedom"
  },
  {
    line1: "Stop waiting for mood.",
    line2: "Action creates",
    line3: "motivation.",
    author: "Neuro-Discipline",
    imageKey: "rainStreet",
    theme: "action"
  },
  {
    line1: "Be so good",
    line2: "they can no longer",
    line3: "ignore you.",
    author: "Unbreakable Will",
    imageKey: "slamPower",
    theme: "excellence"
  }
];

// 2. Curated Catalog of 15-Second Public Opinion vs Reality Proofs
// Structure: Doubt -> 3s break with cursor -> 1s black screen -> Image SLAM with Reality Counter
const CATALOG_15S_DEBATES = [
  {
    format: "them_me",
    speaker1Label: "Them:",
    speaker1Text: "You're never going to happen.",
    speaker2Label: "Me:",
    speaker2Line1: "Quietly building an",
    speaker2Highlight: "unassailable",
    speaker2Line2: "reality while you wait for permission.",
    image1Key: "doubtRain",
    image2Key: "summitDawn",
    theme: "unassailable_proof"
  },
  {
    format: "they_said",
    speaker1Label: "They said:",
    speaker1Text: "Nobody works this hard in secret.",
    speaker2Label: "The reality:",
    speaker2Line1: "Compounding",
    speaker2Highlight: "inexorable",
    speaker2Line2: "leverage while you beg for temporary attention.",
    image1Key: "rainStreet",
    image2Key: "slamPower",
    theme: "inexorable_leverage"
  },
  {
    format: "crowd_discipline",
    speaker1Label: "The crowd:",
    speaker1Text: "You think you're better than everyone.",
    speaker2Label: "The discipline:",
    speaker2Line1: "I compete with no one; I am simply eradicating my",
    speaker2Highlight: "recalcitrant",
    speaker2Line2: "weaknesses.",
    image1Key: "doubtRain",
    image2Key: "gymGrit",
    theme: "recalcitrant_weakness"
  },
  {
    format: "public_proof",
    speaker1Label: "Public opinion:",
    speaker1Text: "You're wasting your youth on discipline.",
    speaker2Label: "The proof:",
    speaker2Line1: "Trading cheap dopamine for an",
    speaker2Highlight: "indomitable",
    speaker2Line2: "life you can neither ignore nor replicate.",
    image1Key: "lateStudy",
    image2Key: "summitDawn",
    theme: "indomitable_life"
  },
  {
    format: "doubt_execution",
    speaker1Label: "The doubt:",
    speaker1Text: "Be realistic, that dream is impossible.",
    speaker2Label: "The execution:",
    speaker2Line1: "Stacking undeniable proof until your doubts become completely",
    speaker2Highlight: "obsolete.",
    speaker2Line2: "No excuses.",
    image1Key: "rainStreet",
    image2Key: "slamPower",
    theme: "obsolete_doubt"
  },
  {
    format: "them_me",
    speaker1Label: "Them:",
    speaker1Text: "You changed. You don't hang out anymore.",
    speaker2Label: "Me:",
    speaker2Line1: "Refusing",
    speaker2Highlight: "perfunctory",
    speaker2Line2: "distractions to construct a sovereign future in peace.",
    image1Key: "doubtRain",
    image2Key: "lateStudy",
    theme: "sovereign_peace"
  },
  {
    format: "they_said",
    speaker1Label: "They said:",
    speaker1Text: "You're sacrificing everything for a gamble.",
    speaker2Label: "The reality:",
    speaker2Line1: "Investing in compound skills while you settle for",
    speaker2Highlight: "evanescent",
    speaker2Line2: "internet trends.",
    image1Key: "rainStreet",
    image2Key: "summitDawn",
    theme: "evanescent_trends"
  },
  {
    format: "crowd_discipline",
    speaker1Label: "The crowd:",
    speaker1Text: "Just relax, you're stressing yourself out.",
    speaker2Label: "The discipline:",
    speaker2Line1: "Cultivating unyielding",
    speaker2Highlight: "equanimity",
    speaker2Line2: "while executing the hard work you run away from.",
    image1Key: "doubtRain",
    image2Key: "slamPower",
    theme: "equanimity_grind"
  },
  {
    format: "public_proof",
    speaker1Label: "Public opinion:",
    speaker1Text: "You'll never get rich starting from zero.",
    speaker2Label: "The proof:",
    speaker2Line1: "Mastering high-leverage craftsmanship to render your doubts entirely",
    speaker2Highlight: "superfluous.",
    speaker2Line2: "Watch the execution.",
    image1Key: "lateStudy",
    image2Key: "summitDawn",
    theme: "superfluous_doubts"
  },
  {
    format: "doubt_execution",
    speaker1Label: "The doubt:",
    speaker1Text: "Nobody stays consistent forever.",
    speaker2Label: "The execution:",
    speaker2Line1: "Transforming daily discipline into an",
    speaker2Highlight: "immutable",
    speaker2Line2: "identity rather than a temporary mood.",
    image1Key: "rainStreet",
    image2Key: "slamPower",
    theme: "immutable_identity"
  }
];

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build 5-Second Video Overlay SVG
 * Matching User Uploaded Reference Image:
 * - Upper center placement (Y: 360-580)
 * - Line 1: Bold clean white with drop shadow
 * - Line 2: Bold radiant golden yellow (#facc15)
 * - Line 3: Bold clean white
 * - No heavy boxes or cards — pure cinematic typography floating on photography
 */
function build5sOverlaySvg(entry) {
  const width = 1080;
  const height = 1920;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Deep cinematic drop shadow for pristine legibility over photos -->
      <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.95" />
        <feDropShadow dx="0" dy="14" stdDeviation="28" flood-color="#000000" flood-opacity="0.85" />
      </filter>
    </defs>

    <!-- Top Discreet Brand Watermark (Y=140) -->
    <g transform="translate(540, 140)" filter="url(#cinematicGlow)">
      <text font-family="system-ui, -apple-system, 'SF Pro Display', sans-serif" font-size="20" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="4" opacity="0.85">
        APEX PROTOCOL
      </text>
    </g>

    <!-- Main Bold 3-Line Typography (Upper Center: Y=440 - Y=680) -->
    <g filter="url(#cinematicGlow)" text-anchor="middle">
      <!-- Line 1: Pure White Bold Display -->
      <text x="540" y="460" font-family="system-ui, -apple-system, 'Segoe UI', Impact, Arial Black, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${escapeXml(entry.line1)}
      </text>

      <!-- Line 2: Radiant Golden Yellow Accent (#facc15) -->
      <text x="540" y="555" font-family="system-ui, -apple-system, 'Segoe UI', Impact, Arial Black, sans-serif" font-size="82" font-weight="900" fill="#facc15" letter-spacing="0.5">
        ${escapeXml(entry.line2)}
      </text>

      <!-- Line 3: Pure White Bold Display -->
      <text x="540" y="650" font-family="system-ui, -apple-system, 'Segoe UI', Impact, Arial Black, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${escapeXml(entry.line3)}
      </text>
    </g>

    <!-- Bottom Seamless Loop Indicator (Y=1760) -->
    <g transform="translate(540, 1760)" filter="url(#cinematicGlow)">
      <text font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#e2e8f0" text-anchor="middle" letter-spacing="3" opacity="0.75">
        REPLAY TO LOCK IN • SEAMLESS LOOP
      </text>
    </g>
  </svg>`;
}

/**
 * Build 15-Second Segment 1 (Them / Opinion with Typewriter & Blinking Cursor)
 * Duration: 7.0 seconds
 */
function build15sSegment1OverlaySvg(debate, cursorChar = '|') {
  const width = 1080;
  const height = 1920;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.95" />
      </filter>
    </defs>

    <!-- Top Channel Indicator -->
    <g transform="translate(540, 150)" filter="url(#shadow1)">
      <text font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="4">
        REALITY PROTOCOL
      </text>
    </g>

    <!-- Speaker 1 Label (e.g., "Them:" or "They said:") -->
    <g transform="translate(540, 520)" filter="url(#shadow1)" text-anchor="middle">
      <text font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#94a3b8" letter-spacing="3">
        ${escapeXml(debate.speaker1Label.toUpperCase())}
      </text>

      <!-- The Doubt Statement with Blinking Cursor -->
      <text x="0" y="90" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        “${escapeXml(debate.speaker1Text)}”<tspan fill="#facc15" font-weight="bold"> ${escapeXml(cursorChar)}</tspan>
      </text>
    </g>
  </svg>`;
}

/**
 * Build 15-Second Segment 3 (The Me / Reality Counter Slam)
 * Duration: 7.0 seconds
 */
function build15sSegment3OverlaySvg(debate) {
  const width = 1080;
  const height = 1920;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="slamGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.95" />
        <feDropShadow dx="0" dy="18" stdDeviation="32" flood-color="#000000" flood-opacity="0.85" />
      </filter>
    </defs>

    <!-- Speaker 2 Label (e.g. "ME:" or "THE REALITY:") -->
    <g transform="translate(540, 480)" filter="url(#slamGlow)" text-anchor="middle">
      <!-- Glow Tag Pill -->
      <rect x="-160" y="-45" width="320" height="58" rx="29" fill="#0f172a" fill-opacity="0.9" stroke="#facc15" stroke-width="2.5" />
      <text x="0" y="-8" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="900" fill="#facc15" letter-spacing="4">
        ${escapeXml(debate.speaker2Label.toUpperCase())}
      </text>

      <!-- Line 1 of retort -->
      <text x="0" y="85" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="58" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${escapeXml(debate.speaker2Line1)}
      </text>

      <!-- Rare Highlighted Word in Golden Radiant Glow -->
      <text x="0" y="165" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="74" font-weight="900" fill="#facc15" letter-spacing="1">
        ${escapeXml(debate.speaker2Highlight.toUpperCase())}
      </text>

      <!-- Line 2 of retort -->
      <text x="0" y="245" font-family="system-ui, -apple-system, Impact, Arial Black, sans-serif" font-size="52" font-weight="900" fill="#f1f5f9" letter-spacing="0.5">
        ${escapeXml(debate.speaker2Line2)}
      </text>
    </g>

    <!-- Bottom Authority Tag -->
    <g transform="translate(540, 1760)" filter="url(#slamGlow)">
      <text font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#facc15" text-anchor="middle" letter-spacing="3" opacity="0.85">
        UNDENIABLE EXECUTION • NO REGRETS
      </text>
    </g>
  </svg>`;
}

/**
 * Generate 5-Second Teen Motivation Reel (2 Posts Daily)
 * Features Ken Burns zoom/pan, single photo background, clean bold typography
 */
async function render5sTeenReel(customQuote = null) {
  const duration = 5.0;
  console.log(`\n======================================================`);
  console.log(`⚡ [TEEN REEL 5s] GENERATING STRAIGHT-TO-POINT VIDEO (${duration}s)`);
  console.log(`======================================================\n`);

  // 1. Select Deduplicated Candidate
  let chosen = customQuote;
  if (!chosen) {
    chosen = await selectDeduplicatedCandidate('teen', CATALOG_5S_QUOTES, q => `${q.line1} ${q.line2} ${q.line3}`, q => q.author);
  }

  console.log(`[5s Reel] Line 1:  "${chosen.line1}"`);
  console.log(`[5s Reel] Line 2:  "${chosen.line2}" (Gold Accent)`);
  console.log(`[5s Reel] Line 3:  "${chosen.line3}"`);
  console.log(`[5s Reel] Theme:   ${chosen.theme}\n`);

  // 2. Resolve Background Image
  let bgImagePath = MOTIVATION_IMAGES[chosen.imageKey] || MOTIVATION_IMAGES.summitDawn;
  if (!fs.existsSync(bgImagePath)) {
    bgImagePath = MOTIVATION_IMAGES.summitDawn;
  }
  console.log(`[5s Reel] 🖼️ Photographic Asset: ${path.basename(bgImagePath)}`);

  // 3. Resolve Random Audio Asset from sound_assets/motivation_5s/
  const audioWavPath = path.join(ARTIFACTS_DIR, `teen_5s_audio_${Date.now()}.wav`);
  resolveChannelAudio('motivation_5s', duration, audioWavPath);

  // 4. Render Overlay SVG & Rasterize
  const overlaySvg = build5sOverlaySvg(chosen);
  const overlaySvgPath = path.join(ARTIFACTS_DIR, 'teen_5s_overlay.svg');
  const overlayPngPath = path.join(ARTIFACTS_DIR, 'teen_5s_overlay.png');
  fs.writeFileSync(overlaySvgPath, overlaySvg);

  try {
    execSync(`ffmpeg -y -i "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
  } catch {
    // If ffmpeg direct rasterization fails, rsvg fallback
    execSync(`rsvg-convert -w 1080 -h 1920 -o "${overlayPngPath}" "${overlaySvgPath}" 2>/dev/null || true`);
  }

  // 5. Composite MP4 with Ken Burns Effect
  const timestamp = Date.now();
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_5s_${timestamp}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');
  const fps = 30;
  const totalFrames = Math.round(duration * fps);

  console.log(`[5s Reel] 🎥 Rendering MP4 with Ken Burns zoom/pan...`);
  const complexFilter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0008,1.12)':d=1:x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih*0.35/zoom)':s=1080x1920:fps=${fps}[bg];[bg][1:v]overlay=0:0[v]`;

  const ffmpegCmd = `ffmpeg -y -loop 1 -framerate ${fps} -t ${duration} -i "${bgImagePath}" -loop 1 -framerate ${fps} -t ${duration} -i "${overlayPngPath}" -i "${audioWavPath}" -filter_complex "${complexFilter}" -map "[v]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(ffmpegCmd);
  } catch (e) {
    console.warn(`[5s Reel] Advanced filter warning, using fallback scale overlay: ${e.message}`);
    const fallbackCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgImagePath}" -loop 1 -t ${duration} -i "${overlayPngPath}" -i "${audioWavPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0[v]" -map "[v]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;
    execSync(fallbackCmd);
  }

  if (fs.existsSync(outMp4) && fs.statSync(outMp4).size > 10000) {
    fs.copyFileSync(outMp4, latestMp4);
    console.log(`[5s Reel] ✅ SUCCESS: Rendered ${(fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[5s Reel] 📁 Latest Video: ${latestMp4}`);

    // Record to persistent Firestore deduplication
    await recordPostedCandidate('teen', `${chosen.line1} ${chosen.line2} ${chosen.line3}`, chosen.author, {
      theme: chosen.theme,
      duration: 5.0
    });
  }

  return { outMp4, latestMp4, chosen, duration: 5.0 };
}

/**
 * Generate 15-Second Teen Public Opinion vs Reality Slam Reel (1 Post Daily)
 * Structure:
 * - 0.0s - 7.0s: Scene 1 (Moody background, doubt statement with blinking cursor |)
 * - 7.0s - 8.0s: Scene 2 (Pitch-black screen blackout for 1.0s)
 * - 8.0s - 15.0s: Scene 3 (New image SLAMS out from center carrying the Me counter with everyday words + 1 rare word)
 * - Sound randomly picked from sound_assets/motivation_15s/, NO voiceover
 */
async function render15sTeenReel(customDebate = null) {
  const duration = 15.0;
  console.log(`\n======================================================`);
  console.log(`⚡ [TEEN REEL 15s] GENERATING PUBLIC OPINION VS REALITY SLAM REEL (${duration}s)`);
  console.log(`======================================================\n`);

  // 1. Select Deduplicated Candidate
  let chosen = customDebate;
  if (!chosen) {
    chosen = await selectDeduplicatedCandidate('teen_15s', CATALOG_15S_DEBATES, d => `${d.speaker1Text} ${d.speaker2Highlight}`, d => d.speaker2Label);
  }

  console.log(`[15s Slam] Speaker 1: ${chosen.speaker1Label} "${chosen.speaker1Text}"`);
  console.log(`[15s Slam] Speaker 2: ${chosen.speaker2Label} "${chosen.speaker2Line1} [${chosen.speaker2Highlight}] ${chosen.speaker2Line2}"`);
  console.log(`[15s Slam] Rare Word: "${chosen.speaker2Highlight.toUpperCase()}"\n`);

  // 2. Resolve Images
  const img1Path = MOTIVATION_IMAGES[chosen.image1Key] || MOTIVATION_IMAGES.doubtRain;
  const img2Path = MOTIVATION_IMAGES[chosen.image2Key] || MOTIVATION_IMAGES.slamPower;

  // 3. Resolve Random Audio Asset from sound_assets/motivation_15s/
  const audioWavPath = path.join(ARTIFACTS_DIR, `teen_15s_audio_${Date.now()}.wav`);
  resolveChannelAudio('motivation_15s', duration, audioWavPath);

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

  // 5. Render Video Segments
  const fps = 30;
  const seg1Mp4 = path.join(ARTIFACTS_DIR, `teen_seg1_${Date.now()}.mp4`);
  const seg2Mp4 = path.join(ARTIFACTS_DIR, `teen_seg2_${Date.now()}.mp4`);
  const seg3Mp4 = path.join(ARTIFACTS_DIR, `teen_seg3_${Date.now()}.mp4`);

  console.log(`[15s Slam] Rendering Scene 1 (0-7s: Doubt + Blinking Cursor)...`);
  // Segment 1 (7.0s): Ken Burns drift on image 1
  const seg1Filter = `[0:v]scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0006,1.08)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}[bg];[bg][1:v]overlay=0:0[v]`;
  execSync(`ffmpeg -y -loop 1 -framerate ${fps} -t 7.0 -i "${img1Path}" -loop 1 -framerate ${fps} -t 7.0 -i "${seg1PngPath}" -filter_complex "${seg1Filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p "${seg1Mp4}" 2>/dev/null`);

  console.log(`[15s Slam] Rendering Scene 2 (7-8s: 1-Second Blackout Screen)...`);
  // Segment 2 (1.0s): Pure black screen
  execSync(`ffmpeg -y -f lavfi -i color=c=black:s=1080x1920:d=1.0:r=${fps} -c:v libx264 -preset fast -pix_fmt yuv420p "${seg2Mp4}" 2>/dev/null`);

  console.log(`[15s Slam] Rendering Scene 3 (8-15s: Explosive Center Slam + Retort)...`);
  // Segment 3 (7.0s): Image slams out from center! Fast initial zoom-in scale rush then smooth Ken Burns
  // Slam formula: zooms down from 1.35x to 1.05x in first 20 frames (0.66s), then holds and slowly creeps
  const seg3Filter = `[0:v]scale=1300:2311:force_original_aspect_ratio=increase,crop=1300:2311,zoompan=z='if(lte(on,20),1.35-on*0.015,1.05+(on-20)*0.0003)':d=1:x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih*0.35/zoom)':s=1080x1920:fps=${fps}[bg];[bg][1:v]overlay=0:0[v]`;
  execSync(`ffmpeg -y -loop 1 -framerate ${fps} -t 7.0 -i "${img2Path}" -loop 1 -framerate ${fps} -t 7.0 -i "${seg3PngPath}" -filter_complex "${seg3Filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p "${seg3Mp4}" 2>/dev/null`);

  // 6. Concatenate Segments and Map 15-Second Audio
  const timestamp = Date.now();
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_15s_${timestamp}.mp4`);
  const latestMp4 = path.join(OUTPUT_DIR, 'teen_motivation_latest.mp4');

  console.log(`[15s Slam] 🎬 Concatenating 15-Second Master Reel with Soundtrack...`);
  const concatFilter = `[0:v]setsar=1[v0];[1:v]setsar=1[v1];[2:v]setsar=1[v2];[v0][v1][v2]concat=n=3:v=1:a=0[vcat]`;
  const finalCmd = `ffmpeg -y -i "${seg1Mp4}" -i "${seg2Mp4}" -i "${seg3Mp4}" -i "${audioWavPath}" -filter_complex "${concatFilter}" -map "[vcat]" -map 3:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t 15.0 -shortest "${outMp4}" 2>/dev/null`;

  execSync(finalCmd);

  if (fs.existsSync(outMp4) && fs.statSync(outMp4).size > 10000) {
    fs.copyFileSync(outMp4, latestMp4);
    console.log(`[15s Slam] ✅ SUCCESS: Rendered 15s Video (${(fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[15s Slam] 📁 Latest Video: ${latestMp4}`);

    // Record to persistent Firestore deduplication
    await recordPostedCandidate('teen_15s', `${chosen.speaker1Text} -> ${chosen.speaker2Highlight}`, chosen.speaker2Label, {
      theme: chosen.theme,
      duration: 15.0
    });
  }

  // Cleanup temporary segment blobs
  try {
    if (fs.existsSync(seg1Mp4)) fs.unlinkSync(seg1Mp4);
    if (fs.existsSync(seg2Mp4)) fs.unlinkSync(seg2Mp4);
    if (fs.existsSync(seg3Mp4)) fs.unlinkSync(seg3Mp4);
  } catch {}

  return { outMp4, latestMp4, chosen, duration: 15.0 };
}

/**
 * Main Teen Motivation Dispatcher:
 * Supports:
 * - '5s_reel' -> Renders 5-second punchline
 * - '15s_slam' -> Renders 15-second opinion vs reality slam
 * - 'auto' -> Picks based on UTC hour:
 *      07:00 UTC -> 5s reel
 *      14:00 UTC -> 15s slam reel
 *      21:00 UTC -> 5s reel
 */
async function generateTeenMotivationReel(customMode = '') {
  const mode = (typeof customMode === 'string' && customMode ? customMode : '') || process.env.TEEN_FORMAT || process.env.VIDEO_MODE || process.env.VIDEO_TYPE || 'auto';
  const utcHour = new Date().getUTCHours();

  console.log(`\n======================================================`);
  console.log(`⚡ APEX TEEN MOTIVATION ENGINE (Mode: ${mode}, UTC Hour: ${utcHour})`);
  console.log(`======================================================\n`);

  let result = null;
  if (mode === '15s_slam' || (mode === 'auto' && (utcHour >= 13 && utcHour <= 17))) {
    // Afternoon slot: 15-second Public Opinion vs Reality Slam
    result = await render15sTeenReel();
  } else {
    // Morning or Evening slots: 5-second Straight-to-point reel
    result = await render5sTeenReel();
  }

  // Update Manifest
  try {
    let manifest = [];
    if (fs.existsSync(MANIFEST_PATH)) {
      try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch {}
    }
    const manifestEntry = {
      id: `teen_quote_${Date.now()}`,
      title: result.duration === 15.0
        ? `${result.chosen.speaker1Label} "${result.chosen.speaker1Text}" vs ${result.chosen.speaker2Label} #Shorts #Discipline`
        : `"${result.chosen.line1} ${result.chosen.line2} ${result.chosen.line3}" #Shorts #Discipline`,
      duration: result.duration,
      videoPath: result.outMp4,
      createdAt: new Date().toISOString()
    };
    manifest.unshift(manifestEntry);
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest.slice(0, 50), null, 2));
  } catch (e) {
    console.warn('[Teen Engine] Manifest update notice:', e.message);
  }

  // Automatic Dispatch to TikTok via Buffer API 2 (Matching Movie Workflow)
  const shouldAutoPublish = process.env.AUTO_PUBLISH === 'true' || 
                            process.env.BUFFER_API_KEY_2 || 
                            process.env.BUFFER_API_KEY || 
                            process.env.PUBLISH_TIKTOK === 'true';

  if (shouldAutoPublish && process.env.SKIP_BUFFER_DISPATCH !== 'true') {
    try {
      console.log(`[Teen Engine] 🚀 Auto-Dispatching completed reel to TikTok via Buffer API 2...`);
      const { dispatchTikTok } = require('./publish_buffer_second_tiktok.cjs');
      await dispatchTikTok('teen_motivation');
    } catch (pubErr) {
      console.warn(`[Teen Engine] Buffer dispatch notice: ${pubErr.message}`);
    }
  }

  return result;
}

if (require.main === module) {
  generateTeenMotivationReel().catch(err => {
    console.error('Fatal in teen motivation reel generator:', err);
    process.exit(1);
  });
}

module.exports = {
  generateTeenMotivationReel,
  render5sTeenReel,
  render15sTeenReel,
  CATALOG_5S_QUOTES,
  CATALOG_15S_DEBATES
};
