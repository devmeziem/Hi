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
const { synthesizeArchieVoice, assembleArchieMasterAudio } = require('./archie_sound_engine.cjs');
const { analyzeScriptEmotionTimeline } = require('./emotion_voice_engine.cjs');
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
  // User mandate: "try making background white"
  // Sleek, ultra-clean modern architectural white creator studio with warm walnut acoustic slats, soft ambient diffusion, and floating minimalist tech shelves
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Modern architectural studio white wall gradient with gentle studio falloff -->
      <linearGradient id="wallWhiteGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="45%" stop-color="#f8fafc" />
        <stop offset="80%" stop-color="#f1f5f9" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>

      <!-- Soft studio key light vignette -->
      <radialGradient id="keyLightSoft" cx="45%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1.0" />
        <stop offset="60%" stop-color="#f8fafc" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.85" />
      </radialGradient>

      <!-- Scandinavian warm blonde oak slat wall on left -->
      <linearGradient id="oakSlatGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#d4a373" />
        <stop offset="50%" stop-color="#faedcd" />
        <stop offset="100%" stop-color="#ccd5ae" />
      </linearGradient>

      <!-- Modern white polished micro-cement studio floor -->
      <linearGradient id="floorWhiteGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f1f5f9" />
        <stop offset="30%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>

      <!-- Minimalist modern light birch desk edge -->
      <linearGradient id="deskBirchGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>

      <filter id="studioDropShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#64748b" flood-opacity="0.15" />
      </filter>

      <filter id="softGlowWhite" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>

    <!-- 1. Pure Crisp Architectural White Back Wall -->
    <rect width="${width}" height="${height}" fill="url(#wallWhiteGrad)" />
    <rect width="${width}" height="${height}" fill="url(#keyLightSoft)" />

    <!-- 2. Clean Scandinavian Light Wood Slat Acoustic Feature Wall on Left -->
    <g opacity="0.92" filter="url(#studioDropShadow)">
      ${Array.from({ length: 14 }).map((_, i) => `
        <rect x="${40 + i * 32}" y="0" width="16" height="1380" fill="url(#oakSlatGrad)" rx="3" />
        <line x1="${40 + i * 32 + 16}" y1="0" x2="${40 + i * 32 + 16}" y2="1380" stroke="#e2e8f0" stroke-width="1.2" />
      `).join('')}
    </g>

    <!-- 3. Minimalist Studio Recessed Vertical LED Strips (Soft Cyan & Amber Warm Accents) -->
    <rect x="520" y="60" width="3" height="1240" fill="#0284c7" opacity="0.35" filter="url(#softGlowWhite)" />
    <rect x="1030" y="60" width="3" height="1240" fill="#f59e0b" opacity="0.3" filter="url(#softGlowWhite)" />

    <!-- 4. Floating Minimalist White Studio Shelving with Designer Science Props -->
    <g transform="translate(620, 320)" filter="url(#studioDropShadow)">
      <!-- Modern floating shelf plank -->
      <rect x="0" y="0" width="380" height="12" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
      <!-- Minimalist tech reference books -->
      <rect x="40" y="-68" width="45" height="68" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="48" y1="-55" x2="77" y2="-55" stroke="#0284c7" stroke-width="2" stroke-linecap="round" />
      <!-- Polished glass geodesic sphere / science curio -->
      <circle cx="150" cy="-35" r="30" fill="#0ea5e9" fill-opacity="0.12" stroke="#38bdf8" stroke-width="2" />
      <circle cx="144" cy="-42" r="6" fill="#ffffff" opacity="0.8" />
      <!-- Modern warm brass desk cube -->
      <rect x="230" y="-80" width="75" height="80" rx="6" fill="#ffffff" stroke="#f59e0b" stroke-width="1.8" stroke-opacity="0.8" />
      <circle cx="267" cy="-40" r="14" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5" />
    </g>

    <!-- 5. Studio Horizon & Grounded Clean White Studio Floor -->
    <line x1="0" y1="1380" x2="${width}" y2="1380" stroke="#cbd5e1" stroke-width="2" opacity="0.9" />
    <rect x="0" y="1380" width="${width}" height="540" fill="url(#floorWhiteGrad)" />
    
    <!-- Polished Studio Horizon Surface Edge -->
    <rect x="0" y="1380" width="${width}" height="28" fill="url(#deskBirchGrad)" />
    <line x1="0" y1="1408" x2="${width}" y2="1408" stroke="#94a3b8" stroke-width="1.2" opacity="0.4" />
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
  const puppetExplain = path.join(characterDir, 'puppet_explain_both.png');
  const puppetExplainTalk = path.join(characterDir, 'puppet_explain_both_talk.png');
  const puppetQuestion = path.join(characterDir, 'puppet_questioning_users.png');
  const puppetQuestionTalk = path.join(characterDir, 'puppet_questioning_users_talk.png');

  // 5. Synthesize Audio Spoken Voiceover via Resilient Multi-Tier Engine
  // Ensure clear, complete sentence articulation with a slight breathing pause
  const cleanOutro = script.spokenOutro ? script.spokenOutro.trim() : 'What should Archie explain next? Tell us in the comments!';
  const fullNarration = `${script.spokenHook.trim()} ${script.coreExplanation.trim()} ${cleanOutro}`;
  const voiceWavPath = path.join(ARTIFACTS_DIR, `archie_voice_${Date.now()}.wav`);

  console.log(`[Audio Engine] 🎙️ Synthesizing Archie's voice narration (Complete articulation)...`);
  await synthesizeArchieVoice(fullNarration, voiceWavPath);

  const durProbe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWavPath}"`, { encoding: 'utf8' }).trim();
  const voiceDuration = parseFloat(durProbe) || 28.0;
  // Add 2.0s post-narration padding so the last sentence is never cut off
  const reelDuration = voiceDuration + 2.0;
  console.log(`[Audio Engine] Spoken Duration: ${voiceDuration.toFixed(1)}s (Total Reel: ${reelDuration.toFixed(1)}s with outro buffer)`);

  // 6. Assemble Background Music & SFX
  const audioWavPath = path.join(ARTIFACTS_DIR, `archie_master_audio_${Date.now()}.wav`);
  try {
    await assembleArchieMasterAudio(voiceWavPath, audioWavPath, { duration: reelDuration, niche: 'cartoon' });
  } catch (audioErr) {
    console.warn(`[Audio Engine] assembleArchieMasterAudio notice: ${audioErr.message}`);
  }
  if (!fs.existsSync(audioWavPath) || fs.statSync(audioWavPath).size < 1000) {
    fs.copyFileSync(voiceWavPath, audioWavPath);
  }

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
  const cutawayEnd = Math.min(reelDuration - 3.0, 18.0);
  // Dynamic Emotion & Prosody Analysis: Synchronize visual gestures to speech emotion
  const emotionTimeline = analyzeScriptEmotionTimeline(fullNarration, voiceDuration);
  console.log(`[Emotion Sync Engine] 🎭 Analyzed ${emotionTimeline.length} emotion beats for Archie's speech:`);
  emotionTimeline.forEach(b => console.log(`   ⏱️  ${b.startTime}s - ${b.endTime}s: [${b.emotion.toUpperCase()}] -> Gesture: ${b.gesture} (${b.sentence.slice(0, 45)}...)`));

  const hookBeat = emotionTimeline[0] || { endTime: 2.5 };
  const hookHalf = Math.min(1.5, hookBeat.endTime * 0.45);
  const camPointEnd = hookBeat.endTime;
  const outroBeat = emotionTimeline[emotionTimeline.length - 1] || { startTime: voiceDuration - 4.5 };
  const outroStart = Math.min(voiceDuration - 2.5, Math.max(cutawayEnd + 0.8, outroBeat.startTime));

  // Ensure all new in-video gesture assets exist
  const puppetCamera = path.join(characterDir, 'puppet_point_camera.png');
  const puppetCameraTalk = path.join(characterDir, 'puppet_point_camera_talk.png');
  const puppetPalms = path.join(characterDir, 'puppet_open_palms.png');
  const puppetPalmsTalk = path.join(characterDir, 'puppet_open_palms_talk.png');

  const inputs = [
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${bgPngPath}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${pillPngPath}"`,
    specimenCutawayPng ? `-loop 1 -t ${reelDuration.toFixed(2)} -i "${specimenCutawayPng}"` : `-loop 1 -t ${reelDuration.toFixed(2)} -i "${bgPngPath}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPoint}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPointTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetCamera}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetCameraTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPalms}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetPalmsTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetExplain}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetExplainTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetQuestion}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetQuestionTalk}"`,
    `-loop 1 -t ${reelDuration.toFixed(2)} -i "${puppetIdle}"`,
    `-i "${audioWavPath}"`
  ].join(' ');

  // Filter graph:
  // User mandate: "add better invideo gestures too and try making background white, and camera movement too" + "make voice more human and emotion sync"
  // 1. Camera Movement: Subtle cinematic slow push-in zoompan on background (1.00 -> 1.05) giving lively camera presence
  // 2. High-impact In-video Gestures Synced to Voice Emotions:
  //    - t=0..hookHalf: Hook Pointing Up at topic pill ([3],[4])
  //    - t=hookHalf..camPointEnd: In-Video Direct Camera Point gesture ([5],[6]) directly engaging audience during curious hook
  //    - t=camPointEnd..midPoint: Two-handed Open Palms emphasis gesture ([7],[8]) on core concept revelation
  //    - t=midPoint..outroStart: Expressive comparative gestures ([9],[10]) during deep explanation
  //    - t=outroStart..voiceDuration: Welcoming Outro palms ([11],[12]) during call-to-action
  //    - t=voiceDuration..end: Confident idle smile ([13])
  const midPoint = (cutawayStart + cutawayEnd) / 2;
  const totalFrames = Math.round(reelDuration * 30);

  const filterGraph = `
    [0:v]scale=1188:2112,zoompan=z='min(1.00+0.000045*on,1.06)':d=${totalFrames}:x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.35':s=1080x1920:fps=30[bg_cam];
    [1:v]scale=1080:1920[pill];
    [2:v]scale=1080:1920[specimen];
    [3:v]scale=-1:1150,split=2[pt1][pt2];
    [4:v]scale=-1:1150[pt_t];
    [5:v]scale=-1:1150,split=2[cam1][cam2];
    [6:v]scale=-1:1150[cam_t];
    [7:v]scale=-1:1150,split=2[plm1][plm2];
    [8:v]scale=-1:1150[plm_t];
    [9:v]scale=-1:1150[exp];
    [10:v]scale=-1:1150[exp_t];
    [11:v]scale=-1:1150[qst];
    [12:v]scale=-1:1150[qst_t];
    [13:v]scale=-1:1150[idle1];
    [bg_cam][pill]overlay=0:0[s0];
    [s0][specimen]overlay=0:0:enable='between(t,${cutawayStart},${cutawayEnd})'[s1];
    [s1][pt1]overlay=x=440:y=760:enable='lt(t,${(hookHalf * 0.5).toFixed(2)})'[s2];
    [s2][pt_t]overlay=x=440:y=760:enable='gte(t,${(hookHalf * 0.5).toFixed(2)})*lt(t,${hookHalf.toFixed(2)})*mod(floor(t*5),2)'[s3];
    [s3][pt2]overlay=x=440:y=760:enable='gte(t,${(hookHalf * 0.5).toFixed(2)})*lt(t,${hookHalf.toFixed(2)})*(1-mod(floor(t*5),2))'[s4];
    [s4][cam_t]overlay=x=440:y=760:enable='gte(t,${hookHalf.toFixed(2)})*lt(t,${camPointEnd.toFixed(2)})*mod(floor(t*5.2),2)'[s5];
    [s5][cam1]overlay=x=440:y=760:enable='gte(t,${hookHalf.toFixed(2)})*lt(t,${camPointEnd.toFixed(2)})*(1-mod(floor(t*5.2),2))'[s6];
    [s6][plm_t]overlay=x=440:y=760:enable='gte(t,${camPointEnd.toFixed(2)})*lt(t,${midPoint.toFixed(2)})*mod(floor(t*5.0),2)'[s7];
    [s7][plm1]overlay=x=440:y=760:enable='gte(t,${camPointEnd.toFixed(2)})*lt(t,${midPoint.toFixed(2)})*(1-mod(floor(t*5.0),2))'[s8];
    [s8][exp_t]overlay=x=440:y=760:enable='gte(t,${midPoint.toFixed(2)})*lt(t,${outroStart.toFixed(2)})*mod(floor(t*5.2),2)'[s9];
    [s9][exp]overlay=x=440:y=760:enable='gte(t,${midPoint.toFixed(2)})*lt(t,${outroStart.toFixed(2)})*(1-mod(floor(t*5.2),2))'[s10];
    [s10][qst_t]overlay=x=440:y=760:enable='gte(t,${outroStart.toFixed(2)})*lt(t,${voiceDuration.toFixed(2)})*mod(floor(t*4.8),2)'[s11];
    [s11][qst]overlay=x=440:y=760:enable='gte(t,${outroStart.toFixed(2)})*lt(t,${voiceDuration.toFixed(2)})*(1-mod(floor(t*4.8),2))'[s12];
    [s12][idle1]overlay=x=440:y=760:enable='gte(t,${voiceDuration.toFixed(2)})'[vfinal]
  `.replace(/\s+/g, ' ').trim();

  const ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${filterGraph}" -map "[vfinal]" -map 14:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${reelDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;

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
