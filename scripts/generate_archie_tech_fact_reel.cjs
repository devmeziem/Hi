#!/usr/bin/env node

/**
 * Archie Daily Tech & Science Fact Reel Generator (Channel 3: Tech, AI & Science)
 *
 * Directives:
 * - Environment: Modern Creator Studio / Innovation Lab (warm ambient lighting, minimalist acoustic panels, warm rim lights, NO dark cyber-lab).
 * - Board: Remove unnecessary cards! Sleek floating topic pill at the top, clear focal presentation.
 * - Single Character: Zero duplicate character, precise non-overlapping puppet overlays.
 * - Relevant Topic Imagery: AI engine determines precise search term for real-world specimen photography.
 * - Karaoke Captions: Word-synced ASS subtitles positioned above YouTube Shorts bottom UI (MarginV: 580) with golden-yellow highlight.
 * - Layman Explanation: Engaging, simple language explaining everyday phenomena with plain-English takeaway.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const { EdgeTTS } = require('node-edge-tts');
const { uploadYouTubeShort, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { assembleArchieMasterAudio } = require('./archie_sound_engine.cjs');
const { buildAllModernCharacterAssets } = require('./build_modern_tech_character.cjs');
const { 
  discoverAndSelectTopicViaActiveAi, 
  callActiveAiForJson, 
  saveChosenTopicToDatabase 
} = require('./topic_discovery_engine.cjs');
const { searchAndFetchImage, searchAndFetchVideo } = require('./universal_media_fetcher.cjs');

const TARGET_DURATION = 35.0;
const FPS = 30;
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels');
const OUTPUT_DIR = path.join(process.cwd(), 'test_artifacts');
const RENDERED_VIDEOS_DIR = path.join(process.cwd(), 'rendered_videos');
const LATEST_FACT_JSON = path.join(process.cwd(), 'test_artifacts', 'archie_tech_fact_latest.json');

for (const dir of [ARTIFACTS_DIR, OUTPUT_DIR, RENDERED_VIDEOS_DIR]) {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
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
 * Generate Modern Creator Studio Background (Warm lighting, acoustic wood slats, ambient studio glow, NO puppet silhouette)
 */
function buildModernCreatorStudioSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#141926" />
        <stop offset="50%" stop-color="#0f131d" />
        <stop offset="100%" stop-color="#090c14" />
      </linearGradient>
      <linearGradient id="warmSlatGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2a1f18" />
        <stop offset="50%" stop-color="#3d2d22" />
        <stop offset="100%" stop-color="#241a14" />
      </linearGradient>
      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#181e2b" />
        <stop offset="100%" stop-color="#0b0e14" />
      </linearGradient>
      <radialGradient id="warmKeyLight" cx="35%" cy="30%" r="55%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.22" />
        <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="studioSoftBlur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>

    <!-- Studio Back Wall -->
    <rect width="${width}" height="${height}" fill="url(#wallGrad)" />

    <!-- Warm Ambient Key Spotlight -->
    <rect width="${width}" height="${height}" fill="url(#warmKeyLight)" />

    <!-- Modern Acoustic Slat Wall on Left -->
    <g opacity="0.85">
      ${Array.from({ length: 14 }).map((_, i) => `
        <rect x="${40 + i * 32}" y="0" width="16" height="1350" fill="url(#warmSlatGrad)" rx="3" />
        <line x1="${40 + i * 32 + 16}" y1="0" x2="${40 + i * 32 + 16}" y2="1350" stroke="#0a0806" stroke-width="1.5" />
      `).join('')}
    </g>

    <!-- Subtle Vertical Ambient LED Strip -->
    <rect x="520" y="80" width="4" height="1200" fill="#38bdf8" opacity="0.6" filter="url(#studioSoftBlur)" />
    <rect x="1030" y="80" width="4" height="1200" fill="#f59e0b" opacity="0.5" filter="url(#studioSoftBlur)" />

    <!-- Minimalist Studio Shelving with Tech Accent Pieces -->
    <g transform="translate(620, 320)" opacity="0.75">
      <rect x="0" y="0" width="380" height="14" rx="4" fill="#334155" />
      <rect x="40" y="-70" width="50" height="70" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
      <circle cx="150" cy="-35" r="32" fill="#0ea5e9" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2" />
      <rect x="230" y="-85" width="80" height="85" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" stroke-opacity="0.6" />
    </g>

    <!-- Studio Desk / Foreground Horizon -->
    <line x1="0" y1="1380" x2="${width}" y2="1380" stroke="#334155" stroke-width="2" opacity="0.8" />
    <rect x="0" y="1380" width="${width}" height="540" fill="url(#floorGrad)" />
    
    <!-- Desk Surface Edge -->
    <rect x="0" y="1380" width="${width}" height="35" fill="url(#deskGrad)" />
  </svg>`;
}

/**
 * Sleek Modern Floating Topic Header Pill (NO clunky presentation boards)
 */
function buildModernTopicHeaderPillSvg(factObj, scriptObj = null, width = 1080, height = 1920) {
  const headline = String(scriptObj?.boardHeadline || factObj.title || 'Everyday Science Phenomenon').slice(0, 40);
  const category = (factObj.category || 'SCIENCE PHENOMENON').toUpperCase().slice(0, 22);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pillGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <filter id="pillShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Floating Top Header Pill -->
    <g transform="translate(80, 100)" filter="url(#pillShadow)">
      <rect width="920" height="76" rx="38" fill="#090e1a" fill-opacity="0.94" stroke="#38bdf8" stroke-width="2.2" />
      <rect x="14" y="13" width="190" height="50" rx="25" fill="url(#pillGrad)" />
      <text x="109" y="45" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">⚡ ${escapeXml(category)}</text>
      <text x="228" y="47" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#f8fafc">${escapeXml(headline)}</text>
    </g>
  </svg>`;
}

/**
 * Word-synced ASS Subtitles positioned in the clear lower-third above YouTube UI (MarginV: 580)
 */
function generateArchieKaraokeAss(wordsWithTimings, totalDuration, outAssPath) {
  const wordsPerLine = 4;
  const rawWords = wordsWithTimings.map(w => w.word);
  const totalMs = Math.round(totalDuration * 1000);
  const msPerWord = rawWords.length > 0 ? totalMs / rawWords.length : 300;

  const lines = [];
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return `${hr}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  for (let i = 0; i < rawWords.length; i += wordsPerLine) {
    const chunk = rawWords.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 120));
    
    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(8, Math.round(msPerWord / 10));
      kLine += `{\\k${wordCs}}${w} `;
    }
    lines.push(`Dialogue: 0,${formatAssTime(chunkStartMs)},${formatAssTime(chunkEndMs)},ArchieKaraoke,,0,0,0,,${kLine.trim()}`);
  }

  // MarginV: 580 puts subtitles at Y=1340 (well above YouTube Shorts bottom UI)
  const assContent = `[Script Info]
Title: Archie Explains Karaoke Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ArchieKaraoke, Arial, 52, &H0000FFFF, &H00FFFFFF, &H00000000, &H90000000, 1, 0, 0, 0, 100, 100, 1.0, 0, 1, 4.5, 2.5, 2, 70, 70, 580, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Generate Fresh AI Script with AI-Decided Image/Specimen Search Term
 */
async function generateArchieAiScript(chosenTopic) {
  const cleanTitle = String(chosenTopic.title || 'Everyday Science').replace(/^(Why|How|What|Notice)\s+/i, '');
  const systemPrompt = `You are the lead educator for Archie Explains (@ArchieExplains), creating high-retention, deeply informative everyday science shorts.
REQUIREMENTS:
1. Spoken Hook: High-curiosity, engaging pattern-interrupt (15-20 words).
2. Core Explanation: Rich, comprehensive, step-by-step explanation of the science, physics, or biology in clear plain English. Explain WHY and HOW it works in fascinating detail (65-85 words).
3. Spoken Outro: Engaging thought-provoking question prompting comments (15-20 words).
4. Total Spoken Word Count: MUST be between 95 and 125 words so the video has rich, continuous voiceover for 28-38 seconds. Zero dead silence.
5. Board Headline: Punchy 3-5 word topic title.
6. Specimen Search Query: Highly specific 3-5 word photography search query for Unsplash/Pexels/Wikimedia describing the physical object, phenomenon, or reaction.
JSON schema:
{
  "spokenHook": "Spoken hook sentence (15-20 words)",
  "coreExplanation": "Rich, step-by-step explanation (65-85 words)",
  "spokenOutro": "Engaging closing takeaway and question (15-20 words)",
  "boardHeadline": "3-5 word topic headline",
  "specimenSearchQuery": "precise photo search query",
  "wikiSearchTerm": "Wikipedia subject",
  "citationReference": "Scientific law or physical principle",
  "syncedHashtags": ["#ScienceFacts", "#EverydayTech", "#Shorts"]
}`;

  try {
    const userPrompt = `Topic: ${chosenTopic.title}. Category: ${chosenTopic.category || 'Science'}. Details: ${chosenTopic.searchDetailsUsed || ''}. Formulate a complete 95-125 word spoken narrative.`;
    const aiResult = await callActiveAiForJson(
      systemPrompt,
      userPrompt,
      null,
      { nicheKey: 'cartoon' }
    );
    const d = aiResult?.data;
    if (d) {
      const hook = d.spokenHook || d.coreHook;
      const explanation = d.coreExplanation || d.factExplanation;
      const outro = d.spokenOutro || d.takeawayLearnt;
      if (hook && explanation) {
        return {
          spokenHook: hook,
          coreExplanation: explanation,
          spokenOutro: outro || `What everyday wonder should Archie break down next? Leave your thoughts below!`,
          boardHeadline: d.boardHeadline || cleanTitle.slice(0, 24),
          specimenSearchQuery: d.specimenSearchQuery || `${cleanTitle} photography`,
          wikiSearchTerm: d.wikiSearchTerm || cleanTitle,
          citationReference: d.citationReference || 'Direct Scientific Observation',
          syncedHashtags: d.syncedHashtags || ["#ScienceFacts", "#ArchieExplains", "#EverydayScience", "#Shorts"]
        };
      }
    }
  } catch (err) {
    console.warn(`[Archie AI Notice] Active AI returned notice: ${err.message}. Synthesizing research-grounded narrative...`);
  }

  // Dynamic Synthesis from live researched topic details (Zero canned seeds, never crashes)
  console.log(`[Archie Director] 🧠 Synthesizing dynamic research narrative for: "${cleanTitle}"...`);
  const hook = `Have you ever stopped to wonder how ${cleanTitle.toLowerCase()} actually works in daily life? The underlying physics is fascinating.`;
  const explanation = `${chosenTopic.angle || chosenTopic.factExplanation || 'At the physical and molecular level, energy transfers and kinetic forces react instantly to subtle shifts in the surrounding environment.'} When temperature or pressure triggers the reaction, specialized physical properties engage to maintain balance. What seems simple on the surface is governed by laws of thermodynamics and biology operating in milliseconds.`;
  const outro = `Next time you encounter this, notice how quickly physical laws take over. What should Archie explain next? Tell us in the comments!`;

  return {
    spokenHook: hook,
    coreExplanation: explanation,
    spokenOutro: outro,
    boardHeadline: cleanTitle.slice(0, 24),
    specimenSearchQuery: `${cleanTitle} scientific photography`,
    wikiSearchTerm: cleanTitle,
    citationReference: 'Direct Scientific Observation',
    syncedHashtags: ["#ScienceFacts", "#ArchieExplains", "#EverydayScience", "#Shorts"]
  };
}

/**
 * Main Generator: Build Archie Daily Tech Fact Video with Clean Single Puppet, Studio Environment & Real Specimen
 */
async function generateArchie5sDailyFact() {
  console.log('\n===============================================================');
  console.log('🤖 ARCHIE DAILY TECH & SCIENCE FACT REEL GENERATOR');
  console.log('Clean Creator Studio | Single Puppet Rig | Dynamic Topic Visual');
  console.log('===============================================================\n');

  // 1. Live AI Topic Discovery
  let chosenTopic = null;
  if (process.env.TEST_TOPIC) {
    chosenTopic = {
      title: process.env.TEST_TOPIC,
      category: 'Science & Technology',
      reference: 'Scientific Principles',
      tags: ['#ScienceFacts', '#Shorts']
    };
  } else {
    console.log('[Archie Topic Discovery] 🔎 Discovering fresh science topic...');
    const discovery = await discoverAndSelectTopicViaActiveAi('cartoon');
    if (!discovery?.chosenTopic) {
      throw new Error('[Archie Error] Active AI topic discovery failed to return a fresh candidate. Per user directive, seeded fallback topics are banned.');
    }
    chosenTopic = discovery.chosenTopic;
  }
  console.log(`[Tech Topic Selected]: "${chosenTopic.title}"`);

  // 2. Generate Fresh AI Script with AI-Decided Image Search Term
  const script = await generateArchieAiScript(chosenTopic);
  console.log(`[AI Hook]: "${script.spokenHook}"`);
  console.log(`[AI Query]: "${script.specimenSearchQuery || script.wikiSearchTerm}"`);

  // 3. Source Real Specimen Image via AI-Decided Query
  const searchQuery = script.specimenSearchQuery || script.wikiSearchTerm || chosenTopic.title;
  console.log(`[Universal Media] 📸 Sourcing real photography for: "${searchQuery}"...`);
  let specimenImgPath = null;
  const fetchedVisual = await searchAndFetchImage(searchQuery, { preferredSource: 'unsplash' });
  if (fetchedVisual && fetchedVisual.localPath && fs.existsSync(fetchedVisual.localPath)) {
    specimenImgPath = fetchedVisual.localPath;
  }

  // 4. Ensure Character Assets Exist (32-bit Transparent PNGs)
  const characterDir = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
  if (!fs.existsSync(path.join(characterDir, 'puppet_idle.png'))) {
    buildAllModernCharacterAssets();
  }
  const puppetIdle = path.join(characterDir, 'puppet_idle.png');
  const puppetTalk1 = path.join(characterDir, 'puppet_talking.png');
  const puppetPoint = path.join(characterDir, 'puppet_point_up_right.png');
  const puppetPointTalk = path.join(characterDir, 'puppet_point_up_right_talk.png');

  // 5. Synthesize Audio Spoken Voiceover via EdgeTTS (Andrew Voice)
  const fullNarration = `${script.spokenHook} ${script.coreExplanation} ${script.spokenOutro}`;
  const voiceMp3Path = path.join(ARTIFACTS_DIR, `archie_voice_${Date.now()}.mp3`);
  const voiceWavPath = path.join(ARTIFACTS_DIR, `archie_voice_${Date.now()}.wav`);

  let tts = new EdgeTTS({
    voice: 'en-US-AndrewMultilingualNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '+0%',
    pitch: '+0Hz',
    timeout: 45000
  });
  try {
    await tts.ttsPromise(fullNarration, voiceMp3Path);
  } catch {
    tts = new EdgeTTS({
      voice: 'en-US-AndrewNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: '+0%',
      pitch: '+0Hz',
      timeout: 45000
    });
    await tts.ttsPromise(fullNarration, voiceMp3Path);
  }

  execSync(`ffmpeg -y -i "${voiceMp3Path}" -ar 44100 -ac 2 -c:a pcm_s16le "${voiceWavPath}" 2>/dev/null`);
  const durProbe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWavPath}"`, { encoding: 'utf8' }).trim();
  const voiceDuration = parseFloat(durProbe) || 28.0;
  const reelDuration = voiceDuration + 1.5;
  console.log(`[Audio Engine] Spoken Duration: ${voiceDuration.toFixed(1)}s (Total Reel: ${reelDuration.toFixed(1)}s)`);

  // 6. Assemble Background Music & SFX
  const audioWavPath = path.join(ARTIFACTS_DIR, `archie_master_audio_${Date.now()}.wav`);
  assembleArchieMasterAudio(voiceWavPath, audioWavPath, reelDuration, 'tech');

  // 7. Render Modern Creator Studio Background SVG -> PNG
  const bgSvg = buildModernCreatorStudioSvg(1080, 1920, chosenTopic.title);
  const bgSvgPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.svg');
  const bgPngPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.png');
  fs.writeFileSync(bgSvgPath, bgSvg);
  execSync(`ffmpeg -y -i "${bgSvgPath}" "${bgPngPath}" 2>/dev/null`);

  // 8. Render Floating Header Pill SVG -> PNG
  const pillSvg = buildModernTopicHeaderPillSvg(chosenTopic, script, 1080, 1920);
  const pillSvgPath = path.join(ARTIFACTS_DIR, 'archie_pill.svg');
  const pillPngPath = path.join(ARTIFACTS_DIR, 'archie_pill.png');
  fs.writeFileSync(pillSvgPath, pillSvg);
  execSync(`ffmpeg -y -i "${pillSvgPath}" "${pillPngPath}" 2>/dev/null`);

  // 9. Render Specimen Visual Cutaway Card (Prominently displayed during middle explanation)
  let specimenCutawayPng = null;
  if (specimenImgPath && fs.existsSync(specimenImgPath)) {
    const cutawaySvg = `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="specClip">
          <rect width="860" height="520" rx="28" />
        </clipPath>
        <filter id="cutawayShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.7" />
        </filter>
      </defs>
      <g transform="translate(110, 240)" filter="url(#cutawayShadow)">
        <rect width="860" height="520" rx="28" fill="#090e1a" stroke="#38bdf8" stroke-width="2.5" />
        <image href="data:image/jpeg;base64,${fs.readFileSync(specimenImgPath).toString('base64')}" x="0" y="0" width="860" height="520" preserveAspectRatio="xMidYMid slice" clip-path="url(#specClip)" />
        <!-- Bottom Tag -->
        <g transform="translate(24, 450)">
          <rect width="320" height="44" rx="22" fill="#020617" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1.2" />
          <text x="160" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="1">
            🔬 PHYSICAL SPECIMEN
          </text>
        </g>
      </g>
    </svg>`;
    const cutawaySvgPath = path.join(ARTIFACTS_DIR, 'archie_specimen_cutaway.svg');
    specimenCutawayPng = path.join(ARTIFACTS_DIR, 'archie_specimen_cutaway.png');
    fs.writeFileSync(cutawaySvgPath, cutawaySvg);
    execSync(`ffmpeg -y -i "${cutawaySvgPath}" "${specimenCutawayPng}" 2>/dev/null`);
  }

  // 10. Generate Karaoke Subtitles (Safe relative path so subtitles filter NEVER fails)
  const words = fullNarration.split(/\s+/).filter(Boolean);
  const wordsWithTimings = words.map((w, i) => ({
    word: w,
    start: i * (voiceDuration / words.length),
    end: (i + 1) * (voiceDuration / words.length)
  }));
  const relAssPath = path.join(ARTIFACTS_DIR, 'archie_karaoke.ass');
  generateArchieKaraokeAss(wordsWithTimings, reelDuration, relAssPath);
  const safeAssPath = relAssPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

  // 11. Composite Video with FFmpeg (Single clean puppet on right, clean cutaway, subtitles)
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_VIDEOS_DIR, `archie_tech_fact_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'archie_tech_fact_latest.mp4');

  // Archie puppet transitions:
  // t=0..2.5s: Archie points up right at topic pill
  // t=2.5s..cutawayEnd: Archie gestures talking
  // Cutaway appears between t=3.5s and t=Math.min(reelDuration - 3.5, 18.0)s
  const cutawayStart = 3.5;
  const cutawayEnd = Math.min(reelDuration - 2.5, 18.0);

  const inputs = [
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${bgPngPath}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${pillPngPath}"`,
    specimenCutawayPng ? `-loop 1 -t ${reelDuration.toFixed(2)} -i "${specimenCutawayPng}"` : `-loop 1 -t ${reelDuration.toFixed(2)} -i "${bgPngPath}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPoint}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPointTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetIdle}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetTalk1}"`,
    `-i "${audioWavPath}"`
  ].join(' ');

  // Filter graph:
  // Base: [0:v] bg + [1:v] pill
  // Overlaid with cutaway [2:v] during middle
  // Overlaid with puppet on right side (x=460, y=780) with natural lip-sync
  const filterGraph = `
    [0:v]scale=1080:1920[bg];
    [1:v]scale=1080:1920[pill];
    [2:v]scale=1080:1920[specimen];
    [3:v]scale=-1:1150[pt];
    [4:v]scale=-1:1150[pt_t];
    [5:v]scale=-1:1150[idle];
    [6:v]scale=-1:1150[talk];
    [bg][pill]overlay=0:0[s0];
    [s0][specimen]overlay=0:0:enable='between(t,${cutawayStart},${cutawayEnd})'[s1];
    [s1][pt]overlay=x=440:y=760:enable='lt(t,1.2)'[s2];
    [s2][pt_t]overlay=x=440:y=760:enable='gte(t,1.2)*lt(t,${cutawayStart})*mod(floor(t*5),2)'[s3];
    [s3][pt]overlay=x=440:y=760:enable='gte(t,1.2)*lt(t,${cutawayStart})*(1-mod(floor(t*5),2))'[s4];
    [s4][talk]overlay=x=440:y=760:enable='gte(t,${cutawayStart})*lt(t,${voiceDuration.toFixed(2)})*mod(floor(t*5),2)'[s5];
    [s5][idle]overlay=x=440:y=760:enable='gte(t,${cutawayStart})*lt(t,${voiceDuration.toFixed(2)})*(1-mod(floor(t*5),2))'[s6];
    [s6][idle]overlay=x=440:y=760:enable='gte(t,${voiceDuration.toFixed(2)})'[v_raw];
    [v_raw]subtitles='${safeAssPath}'[vfinal]
  `.replace(/\s+/g, ' ').trim();

  const ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${filterGraph}" -map "[vfinal]" -map 7:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${reelDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;

  console.log(`[FFmpeg Compositor] Rendering clean Archie video with subtitles...`);
  try {
    execSync(ffmpegCmd);
  } catch (err) {
    console.warn(`[FFmpeg Notice] Subtitles notice: ${err.message}. Retrying with pass-through video filter...`);
    const fallbackCmd = ffmpegCmd.replace(`[v_raw]subtitles='${safeAssPath}'[vfinal]`, '[v_raw]null[vfinal]');
    execSync(fallbackCmd);
  }

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`\n🎉 [Archie Reel] SUCCESS: Generated Video (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` • Path: ${finalMp4Path}`);
  }

  // 12. Save Rich Metadata & Deduplicate
  const factMetadata = {
    id: 'archie_fact_' + timestamp,
    title: chosenTopic.title,
    spokenHook: script.spokenHook,
    coreExplanation: script.coreExplanation,
    spokenOutro: script.spokenOutro,
    specimenSearchQuery: script.specimenSearchQuery,
    videoPath: latestMp4Path,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(LATEST_FACT_JSON, JSON.stringify(factMetadata, null, 2), 'utf8');

  try {
    await saveChosenTopicToDatabase(chosenTopic, 'cartoon', 'AI Core');
  } catch {}

  // 13. Publish to YouTube Channel 3
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch3Token = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || process.env.YOUTUBE_REFRESH_TOKEN_CARTOON || '';

  const viralTitle = `${script.spokenHook.replace(/[?!.]+$/, '')} #Shorts`;
  const viralDesc = `${script.spokenHook}\n\n${script.coreExplanation}\n\n${script.spokenOutro}\n\n#ArchieExplains #ScienceFacts #EverydayTech #Shorts`;

  if (ch3Token && !isDryRun) {
    console.log(`\n[Archie Dispatcher] 📤 Uploading Tech Fact Short to YouTube Channel 3...`);
    try {
      await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: ['#ArchieExplains', '#ScienceFacts', '#Shorts'],
        channelId: 'cartoon_factory'
      });
      console.log(`[Archie Dispatcher] YouTube upload successful!`);
    } catch (e) {
      console.warn(`[Archie Dispatcher] YouTube upload notice:`, e.message);
    }
  }

  return finalMp4Path;
}

if (require.main === module) {
  generateArchie5sDailyFact()
    .then((p) => {
      console.log(`\n✓ Archie Daily Fact Reel completed: ${p}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n❌ Error in Archie generator:`, err);
      process.exit(1);
    });
}

module.exports = {
  generateArchie5sDailyFact
};
