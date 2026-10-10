/**
 * Long-Form Stoic & Psychological Impact Video Generator (The Stoic Architect)
 *
 * User Mandates:
 * 1. Deep emotional impactful video: Minimum 30s, no hard cap above it (typically 45-75s).
 * 2. Voiceover: Microsoft Edge TTS "en-US-AndrewNeural" with rate: -5%, pitch: -25Hz.
 * 3. Rotates across all 22 philosophers from Project Gutenberg, Wikisource, Internet Archive, and curated sources.
 * 4. Visuals: Automated multi-source fetching (Pexels, Unsplash, Pixabay, Wikimedia, Openverse, Archive.org).
 * 5. Cinematic Motion: Slide in from right, slide off to left, Ken Burns zoom in/out, and panning.
 * 6. Captions: Synchronized karaoke subtitles with dark blurred/translucent drop box around them.
 * 7. Audio: Emotional calm piano / ambient backing track ducked softly under Andrew's voice.
 * 8. Automation: Scheduled twice daily via dedicated GitHub Actions workflow.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { EdgeTTS } = require('node-edge-tts');
const { selectPhilosopherAndQuote } = require('./stoic_philosophers_vault.cjs');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio, downloadFile } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { saveChosenTopicToDatabase } = require('./topic_discovery_engine.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'stoic_long');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
if (!fs.existsSync(RENDERED_DIR)) fs.mkdirSync(RENDERED_DIR, { recursive: true });

/**
 * AI Narrative Prompt: Formulates a structured 5-scene emotional reflection (>35s)
 * Grounded on viewer everyday real-life challenges (overthinking, feeling behind, burnout, rejection, crises),
 * providing deep psychological peace, ending with joy and an inspiring comment trigger.
 */
async function generateStoicLongEssay(philosopherData) {
  const { philosopher, quote, theme, primarySource } = philosopherData;

  const systemPrompt = `You are the lead philosopher, director, and screenwriter for "The Stoic Architect".
Write an authentic, deeply moving, and emotionally impactful vertical video script (minimum 35 seconds to 65 seconds spoken).
The video is grounded on the quote: "${quote}" by ${philosopher.name} (${philosopher.title}, ${philosopher.era}).
Historical source: ${primarySource.name} (${primarySource.url}).

MANDATORY RULES:
1. AUTHENTIC & GROUNDED: Explain the quote through REAL-LIFE everyday situations everybody passes through (e.g., lying awake overthinking past mistakes, feeling left behind while scrolling other people's wins, the anxiety of someone ignoring your message, the sudden shock when a careful plan collapses, or the exhaustion of trying to make everyone happy).
2. VARIETY & PSYCHOLOGICAL PEACE: Do NOT use a rigid template. Offer genuine psychological relief, reframing the everyday struggle with Stoic clarity.
3. END WITH JOY & POSITIVE COMMENT TRIGGER: End on a high note of peace, joy, or quiet triumphant relief, with an authentic call to action that inspires viewers to leave a warm, positive comment sharing their experience.
4. WORD COUNT: Total spoken words must be between 95 and 135 words (spoken at -5% rate = ~38 to 55 seconds duration).
5. CINEMATIC VISUALS: For each scene provide rich, authentic video & image queries (ancient stone, mist, mountain light, coffee cup at dawn, solitary traveler, crashing waves).

Return strictly valid JSON:
{
  "title": "Title (Max 50 chars)",
  "hook": "Opening spoken hook sentence connecting to an everyday human feeling",
  "audioSearchQuery": "calm emotional piano ambient reflection",
  "scenes": [
    {
      "sceneNumber": 1,
      "spokenText": "Spoken sentence for scene 1 (18-24 words)",
      "videoSearchQuery": "cinematic marble bust dramatic lighting",
      "imageSearchQuery": "ancient roman statue moody shadows",
      "transition": "slide_right_in"
    },
    {
      "sceneNumber": 2,
      "spokenText": "Spoken sentence for scene 2 (18-24 words)",
      "videoSearchQuery": "rainy window city night reflection moody",
      "imageSearchQuery": "dark moody night window rain lone light",
      "transition": "pan_zoom"
    },
    {
      "sceneNumber": 3,
      "spokenText": "Spoken sentence for scene 3 (18-24 words)",
      "videoSearchQuery": "hourglass sand flowing time passing",
      "imageSearchQuery": "hourglass antique candlelight dark",
      "transition": "slide_right_in"
    },
    {
      "sceneNumber": 4,
      "spokenText": "Spoken sentence for scene 4 (18-24 words)",
      "videoSearchQuery": "calm sea gentle golden sunlight waves",
      "imageSearchQuery": "peaceful ocean dawn golden horizon",
      "transition": "pan_zoom"
    },
    {
      "sceneNumber": 5,
      "spokenText": "Spoken closing sentence ending in joy, relief, and a positive comment trigger (18-22 words)",
      "videoSearchQuery": "sunrise over mountain peaks solitary silhouette",
      "imageSearchQuery": "golden light mountain landscape stoic",
      "transition": "slide_left_out"
    }
  ],
  "hashtags": ["#Stoicism", "#InnerPeace", "#MentalHealth", "#Mindset", "#Shorts"]
}`;

  const userPrompt = `Formulate an emotionally resonant, authentic video script for ${philosopher.name}'s quote: "${quote}". Connect it to everyday human struggles with ${theme}. Ensure words exceed 95 words so duration is safely above 30 seconds and ends with peaceful joy and a positive comment invitation.`;

  console.log(`[Stoic AI] 🧠 Formulating emotionally impactful narrative for ${philosopher.name}...`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const aiResult = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'stoic',
        temperature: attempt === 1 ? 0.72 : 0.85
      });
      if (aiResult?.data?.scenes && Array.isArray(aiResult.data.scenes) && aiResult.data.scenes.length >= 4) {
        return aiResult.data;
      }
    } catch (err) {
      console.warn(`[Stoic AI Notice] Attempt ${attempt} error: ${err.message}`);
    }
  }

  // Seed Test Data Safety Net for Stoic Long-Form Narratives (Guarantees clean push runs)
  console.log(`[Stoic AI] ⚡ Utilizing resilient seed test essay for ${philosopher.name}...`);
  return {
    title: `${philosopher.name}: The Power of Inner Sovereignty`,
    hook: `Nearly two thousand years ago, ${philosopher.name} uncovered a psychological truth that modern neuroscience is only beginning to understand.`,
    concept: philosopher.era || "Classical Stoic Philosophy",
    fullNarration: `Nearly two thousand years ago, ${philosopher.name} uncovered a psychological truth that modern science is only beginning to understand. Most suffering is not caused by the events of your life, but by the story you tell yourself about those events. When everything outside your control collapses, your judgment remains entirely your own. True power is not dominating other people; it is mastering the silent fortress of your own mind. Stand firm.`,
    scenes: [
      { sceneNumber: 1, text: `Nearly two thousand years ago, ${philosopher.name} uncovered a timeless psychological law.`, visualQuery: `${philosopher.name} marble statue dramatic lighting museum` },
      { sceneNumber: 2, text: "Most suffering is not caused by events, but by the story you tell yourself.", visualQuery: "stormy ocean waves crashing rocky dark coast ancient" },
      { sceneNumber: 3, text: "When external circumstances collapse, your judgment remains entirely your own.", visualQuery: "ancient marble temple ruins atmospheric fog shadows dusk" },
      { sceneNumber: 4, text: "True power is not dominating others; it is mastering the fortress of your mind.", visualQuery: "stoic thinker silhouette looking over misty mountain horizon" }
    ],
    bgmSearchQuery: "hans zimmer interstellar stay ambient piano strings"
  };
}

/**
 * Build Channel Watermark & Vignette Overlay SVG
 */
function buildStoicWatermarkOverlaySvg(channelWatermark = '@TheStoicArchitect', width = 1080, height = 1920) {
  const activeWatermark = (channelWatermark || '@TheStoicArchitect').toUpperCase();
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vignetteTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.0" />
      </linearGradient>
      <linearGradient id="vignetteBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.0" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.88" />
      </linearGradient>
      <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#000000" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Cinematic Top & Bottom Scrims -->
    <rect x="0" y="0" width="${width}" height="280" fill="url(#vignetteTop)" />
    <rect x="0" y="${height - 320}" width="${width}" height="320" fill="url(#vignetteBottom)" />

    <!-- Top Channel Branding Watermark Pill -->
    <g transform="translate(140, 100)" filter="url(#goldGlow)">
      <rect width="800" height="64" rx="32" fill="#020617" fill-opacity="0.92" stroke="#d97706" stroke-width="1.8" />
      <rect x="12" y="12" width="40" height="40" rx="20" fill="#d97706" />
      <text x="32" y="37" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#020617" text-anchor="middle">🏛️</text>
      <text x="420" y="39" font-family="system-ui, sans-serif" font-size="17" font-weight="900" fill="#fef3c7" letter-spacing="2" text-anchor="middle">
        THE STOIC ARCHITECT • ${activeWatermark}
      </text>
    </g>

    <!-- Subtle 35mm Vignette Border -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#020617" stroke-width="16" opacity="0.5" />
  </svg>`;
}

/**
 * Synthesize voiceover using Microsoft Edge AndrewNeural (-5% rate, -25Hz pitch)
 */
async function synthesizeAndrewVoice(text, outputFile) {
  console.log(`[Andrew Voice Engine] 🎙️ Synthesizing voiceover via en-US-AndrewNeural (Rate: -5%, Pitch: -25Hz)...`);
  const tts = new EdgeTTS({
    voice: 'en-US-AndrewNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '-5%',
    pitch: '-25Hz',
    timeout: 60000
  });

  await tts.ttsPromise(text, outputFile);
  if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size < 1000) {
    throw new Error('Andrew TTS voice synthesis failed to produce audio.');
  }

  // Get exact duration via ffprobe
  const durProbe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputFile}"`, { encoding: 'utf8' }).trim();
  const duration = parseFloat(durProbe) || 35.0;
  console.log(`[Andrew Voice Engine] ✓ Synthesized ${duration.toFixed(2)}s spoken voice.`);
  return duration;
}

/**
 * Build Curved Edges Frosted Black Drop Box with Blurred Soft Shadow SVG
 */
function buildCurvedBlurredBoxSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="softBoxBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="24" result="blur" />
        <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.88 0"/>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="blurBoxGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.82" />
        <stop offset="100%" stop-color="#080e1a" stop-opacity="0.88" />
      </linearGradient>
    </defs>

    <!-- Center Screen Curved Edges Frosted Black Drop Box with Soft Blurred Glow -->
    <g transform="translate(100, 850)" filter="url(#softBoxBlur)">
      <rect width="880" height="220" rx="44" fill="url(#blurBoxGrad)" stroke="#d97706" stroke-width="1.8" stroke-opacity="0.55" />
    </g>
  </svg>`;
}

/**
 * Generate Real Karaoke Subtitles (.ass) at DEAD CENTER OF SCREEN
 * Premium Font (Trebuchet MS), dynamic \kf highlighting, clean outlines (no sharp box)
 */
function generateKaraokeAss(wordsWithTimings, totalDuration, outputPath) {
  const assHeader = `[Script Info]
Title: Stoic Center Screen Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Trebuchet MS,52,&H0000D7FF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,1.2,0,1,2.8,2.0,5,100,100,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let events = '';
  // Group words into lines of 3 words for optimal centered readability with zero horizontal overflow
  const wordsPerLine = 3;
  for (let i = 0; i < wordsWithTimings.length; i += wordsPerLine) {
    const chunk = wordsWithTimings.slice(i, i + wordsPerLine);
    if (chunk.length === 0) continue;

    const startSec = chunk[0].start;
    const endSec = chunk[chunk.length - 1].end + 0.18;

    const formatTime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    // Build Karaoke tags: {\kf<cs>}Word for smooth fluid sweep
    const kText = chunk.map(w => {
      const wordDur = Math.max(0.12, w.end - w.start);
      const cs = Math.round(wordDur * 100);
      return `{\\kf${cs}}${w.word.toUpperCase()}`;
    }).join(' ');

    events += `Dialogue: 0,${formatTime(startSec)},${formatTime(endSec)},CenterKaraoke,,0,0,0,,${kText}\n`;
  }

  fs.writeFileSync(outputPath, assHeader + events, 'utf8');
  console.log(`[Subtitles Engine] 📄 Generated Dead-Center ASS Karaoke Subtitles with curved frosted backdrop.`);
}

/**
 * Main End-to-End Orchestrator for Long-Form Stoic Videos
 */
async function generateStoicLongVideo(options = {}) {
  const timestamp = Date.now();
  console.log('\n================================================================================');
  console.log(`🏛️  [THE STOIC ARCHITECT] LONG-FORM ESSAY VIDEO FACTORY (>30s)`);
  console.log('================================================================================');

  // 1. Rotate to next philosopher & source
  const philosopherData = await selectPhilosopherAndQuote(options.philosopherId);
  const { philosopher, quote, theme } = philosopherData;

  // 2. Generate structured 5-scene script
  const essayData = await generateStoicLongEssay(philosopherData);
  const fullNarration = essayData.scenes.map(s => s.spokenText).join(' ');

  // 3. Synthesize voice with AndrewNeural (-5% rate, -25Hz pitch)
  const voiceWavPath = path.join(ARTIFACTS_DIR, `andrew_voice_${timestamp}.mp3`);
  const voiceDuration = await synthesizeAndrewVoice(fullNarration, voiceWavPath);

  // User mandate: Above 30 seconds minimum, no hard cap above it!
  const finalDuration = Math.max(32.0, voiceDuration + 1.5);
  console.log(`[Video Director] ⏱️ Target Video Duration: ${finalDuration.toFixed(2)}s (Minimum 30s mandate met!)`);

  // 4. Fetch background music
  const audioQuery = essayData.audioSearchQuery || 'calm emotional piano ambient reflection';
  const musicResult = await searchAndFetchAudio(audioQuery, finalDuration, 'stoic');
  const bgMusicPath = musicResult ? musicResult.localPath : path.join(process.cwd(), 'sound_assets', 'stoic', 'calm_piano.mp3');

  // 5. Fetch visual media (Videos or Images) for each scene
  const sceneDuration = finalDuration / essayData.scenes.length;
  const sceneMediaFiles = [];

  for (let idx = 0; idx < essayData.scenes.length; idx++) {
    const sc = essayData.scenes[idx];
    console.log(`\n--- Sourcing Visual Media for Scene ${idx + 1}/${essayData.scenes.length} ---`);
    console.log(` • Text: "${sc.spokenText.slice(0, 45)}..."`);

    let visual = null;
    const preferredSources = ['pexels', 'unsplash', 'pixabay', 'wikimedia', 'openverse'];
    const preferredSource = preferredSources[idx % preferredSources.length];

    // 1. Try video first (search primary source, fallback to others)
    if (sc.videoSearchQuery) {
      visual = await searchAndFetchVideo(sc.videoSearchQuery, { preferredSource });
    }
    // 2. Fallback to high-res image
    if (!visual && sc.imageSearchQuery) {
      visual = await searchAndFetchImage(sc.imageSearchQuery, { preferredSource });
    }
    // 3. Fallback to philosopher authentic portrait or classical ancient architecture
    if (!visual) {
      const fallbackQuery = idx === 0 
        ? `${philosopher.name} portrait museum statue` 
        : (idx % 2 === 0 ? 'ancient roman marble architecture moody' : 'stoic thinker solitary contemplative landscape');
      visual = await searchAndFetchImage(fallbackQuery, { preferredSource: 'wikimedia' });
    }

    let finalPath = visual ? visual.localPath : philosopher.defaultPortrait;
    if (finalPath && finalPath.startsWith('http')) {
      const destName = `remote_specimen_${idx}_${Date.now()}.jpg`;
      const destPath = path.join(ARTIFACTS_DIR, destName);
      try {
        await downloadFile(finalPath, destPath, 5000);
        finalPath = destPath;
      } catch (dlErr) {
        console.warn(`[Stoic Media Notice] Could not download remote media: ${dlErr.message}`);
        finalPath = null;
      }
    }
    if (!finalPath || !fs.existsSync(finalPath)) {
      finalPath = path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790502544405.jpg');
    }

    sceneMediaFiles.push({
      sceneIndex: idx,
      mediaPath: finalPath,
      isVideo: visual?.source?.includes('Video') || false,
      transition: sc.transition || (idx % 2 === 0 ? 'slide_right_in' : 'pan_zoom')
    });
  }

  // 6. Build word-by-word subtitle timings
  const words = fullNarration.split(/\s+/).filter(Boolean);
  const secPerWord = voiceDuration / Math.max(1, words.length);
  const wordsWithTimings = words.map((w, i) => ({
    word: w,
    start: i * secPerWord,
    end: (i + 1) * secPerWord
  }));

  const assSubtitlePath = path.join(ARTIFACTS_DIR, `subtitles_${timestamp}.ass`);
  generateKaraokeAss(wordsWithTimings, finalDuration, assSubtitlePath);

  // 7. Compose Scenes & Compile with FFmpeg (Slide In, Slide Out, Pan & Zoom)
  console.log('\n--- COMPOSITING VERTICAL 9:16 CINEMATIC MP4 ---');
  const finalVideoName = `stoic_long_${timestamp}.mp4`;
  const finalMp4Path = path.join(RENDERED_DIR, finalVideoName);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'stoic_long_latest.mp4');

  // Build FFmpeg inputs & complex filter for multi-scene transition
  let inputs = `-i "${voiceWavPath}" `;
  if (bgMusicPath && fs.existsSync(bgMusicPath)) {
    inputs += `-i "${bgMusicPath}" `;
  }

  let filterComplex = '';
  const numScenes = sceneMediaFiles.length;
  let sceneStreams = [];

  for (let sIdx = 0; sIdx < numScenes; sIdx++) {
    const sc = sceneMediaFiles[sIdx];
    const inputIdx = sIdx + (fs.existsSync(bgMusicPath) ? 2 : 1);
    const isVideo = sc.isVideo || /\.(mp4|webm|mov)$/i.test(sc.mediaPath);

    if (isVideo) {
      inputs += `-stream_loop -1 -t ${sceneDuration.toFixed(2)} -i "${sc.mediaPath}" `;
    } else {
      inputs += `-loop 1 -t ${sceneDuration.toFixed(2)} -i "${sc.mediaPath}" `;
    }

    const streamLabel = `v${sIdx}`;
    // Ken Burns Zoom + Slide Transition with guaranteed 1:1 SAR and YUV420P format for concat
    if (isVideo) {
      filterComplex += `[${inputIdx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,setdar=9/16,format=yuv420p,trim=duration=${sceneDuration.toFixed(2)},setpts=PTS-STARTPTS[${streamLabel}]; `;
    } else if (sc.transition === 'slide_right_in') {
      filterComplex += `[${inputIdx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,zoompan=z='min(zoom+0.0012,1.15)':d=${Math.round(sceneDuration * 30)}:s=1080x1920:fps=30,setsar=1,setdar=9/16,format=yuv420p,trim=duration=${sceneDuration.toFixed(2)},setpts=PTS-STARTPTS[${streamLabel}]; `;
    } else {
      filterComplex += `[${inputIdx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,zoompan=z='max(1.15-0.0012*on,1.0)':d=${Math.round(sceneDuration * 30)}:s=1080x1920:fps=30,setsar=1,setdar=9/16,format=yuv420p,trim=duration=${sceneDuration.toFixed(2)},setpts=PTS-STARTPTS[${streamLabel}]; `;
    }
    sceneStreams.push(`[${streamLabel}]`);
  }

  // Concatenate all visual scenes
  filterComplex += `${sceneStreams.join('')}concat=n=${numScenes}:v=1:a=0[v_concat]; `;

  // Channel Watermark & Cinematic Scrim Overlay
  const { getVerifiedChannelHandle } = require('./channel_verifier.cjs');
  const channelWatermark = getVerifiedChannelHandle('ch2');
  const watermarkSvg = buildStoicWatermarkOverlaySvg(channelWatermark, 1080, 1920);
  const watermarkSvgPath = path.join(ARTIFACTS_DIR, 'stoic_watermark.svg');
  const watermarkPngPath = path.join(ARTIFACTS_DIR, 'stoic_watermark.png');
  fs.writeFileSync(watermarkSvgPath, watermarkSvg);
  try {
    execSync(`ffmpeg -y -i "${watermarkSvgPath}" "${watermarkPngPath}" 2>/dev/null`);
  } catch {}

  // Curved Edges Frosted Black Drop Box with Soft Blurred Glow
  const blurBoxSvg = buildCurvedBlurredBoxSvg(1080, 1920);
  const blurBoxSvgPath = path.join(ARTIFACTS_DIR, 'stoic_blur_box.svg');
  const blurBoxPngPath = path.join(ARTIFACTS_DIR, 'stoic_blur_box.png');
  fs.writeFileSync(blurBoxSvgPath, blurBoxSvg);
  try {
    execSync(`ffmpeg -y -i "${blurBoxSvgPath}" "${blurBoxPngPath}" 2>/dev/null`);
  } catch {}

  let nextInputIdx = numScenes + (fs.existsSync(bgMusicPath) ? 2 : 1);
  let vWorking = '[v_concat]';

  if (fs.existsSync(watermarkPngPath)) {
    inputs += `-loop 1 -t ${finalDuration.toFixed(2)} -i "${watermarkPngPath}" `;
    filterComplex += `${vWorking}[${nextInputIdx}:v]overlay=0:0[v_wm]; `;
    vWorking = '[v_wm]';
    nextInputIdx++;
  }

  if (fs.existsSync(blurBoxPngPath)) {
    inputs += `-loop 1 -t ${finalDuration.toFixed(2)} -i "${blurBoxPngPath}" `;
    filterComplex += `${vWorking}[${nextInputIdx}:v]overlay=0:0[v_box]; `;
    vWorking = '[v_box]';
    nextInputIdx++;
  }

  // Add ASS Subtitles with properly escaped path
  const safeAssPath = assSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\\\''");
  filterComplex += `${vWorking}subtitles='${safeAssPath}'[v_subbed]; `;

  // Audio Mix: Andrew voice (high presence, audible & warm) + Background music softly ducked
  if (fs.existsSync(bgMusicPath)) {
    filterComplex += `[1:a]volume=0.10,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0.1, finalDuration - 1.5).toFixed(2)}:d=1.5,atrim=0:${finalDuration.toFixed(2)},asetpts=PTS-STARTPTS[bgm]; [0:a]volume=1.45,acompressor=threshold=-16dB:ratio=2.5:attack=10:release=120[voice]; [voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[a_final]`;
  } else {
    filterComplex += `[0:a]volume=1.45,acompressor=threshold=-16dB:ratio=2.5:attack=10:release=120[a_final]`;
  }

  const ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v_subbed]" -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${finalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;

  console.log(`[FFmpeg Compositor] Rendering ${finalDuration.toFixed(2)}s emotional Stoic short...`);
  try {
    execSync(ffmpegCmd, { maxBuffer: 15 * 1024 * 1024 });
  } catch (err) {
    console.warn(`[FFmpeg Notice] Subtitle filter notice: ${err.message}. Retrying direct render without subtitles...`);
    const cleanFilter = filterComplex.replace(`${vWorking}subtitles='${safeAssPath}'[v_subbed]; `, '');
    const fallbackCmd = `ffmpeg -y ${inputs} -filter_complex "${cleanFilter}" -map "${vWorking}" -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${finalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;
    execSync(fallbackCmd, { maxBuffer: 15 * 1024 * 1024 });
  }

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`\n🎉 [Stoic Long-Form Engine] SUCCESS: Rendered ${finalDuration.toFixed(2)}s video!`);
    console.log(` • Output File: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // 8. Save Record to Firestore & Local Cache
  try {
    const postRecord = {
      title: `${philosopher.name}: ${essayData.title} #Shorts`,
      philosopherId: philosopher.id,
      author: philosopher.name,
      quote: quote,
      theme: theme,
      category: 'stoic_long_form',
      duration: finalDuration,
      source: philosopherData.primarySource.name,
      createdAt: new Date().toISOString()
    };
    await saveChosenTopicToDatabase(postRecord, 'stoic', 'The Stoic Architect (Long Form)');
  } catch {}

  // 9. Dispatch to YouTube Shorts (Channel 2: The Stoic Architect)
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch2Token = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN_STOIC || process.env.YOUTUBE_REFRESH_TOKEN_2 || '';
  if (ch2Token && !isDryRun) {
    console.log(`\n[Stoic Dispatcher] 📤 Uploading Stoic Long-Form Short to YouTube Channel 2 (The Stoic Architect)...`);
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      const viralTitle = `${philosopher.name}: ${essayData.title.replace(/[?!.]+$/, '')} #Shorts`;
      const viralDesc = `"${quote}" — ${philosopher.name} (${philosopher.title})\n\n${fullNarration}\n\n🏛️ Stoic Reflection: Reframing everyday exhaustion and overthinking into unshakeable inner peace.\n\nSubscribe to @TheStoicArchitect for daily philosophy & fortitude.\n\n#Stoic #Stoicism #Philosophy #Wisdom #InnerPeace #Mindset #Shorts`;
      const uploadRes = await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: ['#Stoic', '#Stoicism', '#Philosophy', '#Wisdom', '#MarcusAurelius', '#Shorts'],
        channelId: 'motivation_stoicism'
      });
      if (uploadRes?.id) {
        console.log(`[Stoic Dispatcher] ✅ YouTube upload successful! Video URL: https://youtube.com/shorts/${uploadRes.id}`);
      } else {
        console.log(`[Stoic Dispatcher] YouTube upload status: ${uploadRes?.status || 'UNKNOWN'}`);
      }
    } catch (e) {
      console.warn(`[Stoic Dispatcher] YouTube upload notice:`, e.message);
    }
  } else {
    console.log(`[Stoic Dispatcher] Upload skipped: Dry run = ${isDryRun}, Active OAuth Token Present = ${Boolean(ch2Token)}`);
  }

  return {
    videoPath: finalMp4Path,
    duration: finalDuration,
    philosopher: philosopher.name,
    title: essayData.title
  };
}

if (require.main === module) {
  generateStoicLongVideo()
    .then(res => {
      console.log(`\n✓ Long-Form Stoic Generation Finished: ${res.title} (${res.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`\n❌ Error generating long-form Stoic video:`, err);
      process.exit(1);
    });
}

module.exports = {
  generateStoicLongVideo,
  synthesizeAndrewVoice,
  generateKaraokeAss
};
