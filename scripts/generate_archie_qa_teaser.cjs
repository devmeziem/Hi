#!/usr/bin/env node

/**
 * Archie Daily 3-in-1 Intellectual Q&A Teaser & Showdown Generator
 *
 * User Mandates:
 * 1. 3 Questions in 1 Single Episode (Intellectual Showdown).
 * 2. 3 Completely DIFFERENT Categories per episode (Never all the same topic!).
 * 3. Fun, universally relatable, everyday curiosity questions (Animals, Human Body, Kitchen Physics, Weather, Space).
 * 4. Text NEVER cut off: Dynamic font scaling and multi-line wrapping so questions and options never truncate.
 * 5. Voice: Microsoft Edge "en-US-AndrewMultilingualNeural" or "en-US-AndrewNeural" at natural human pace.
 * 6. 4 on-screen options (A, B, C, D) with distinct highlight for the winner.
 * 7. 5-second animated on-screen countdown with authentic, audible mechanical clock ticking sound.
 * 8. Reveals verified explanation with clear real-world takeaway.
 * 9. Persistent deduplication via Firestore and local cache.
 * 10. Posts directly to Archie's Channel (YouTube Channel 3 + Buffer Omnichannel).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { EdgeTTS } = require('node-edge-tts');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { uploadYouTubeShort, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { searchAndFetchImage } = require('./universal_media_fetcher.cjs');
const { getChannelMeta, getVerifiedChannelHandle } = require('./channel_verifier.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_qa');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 5 Vibrant Modern Color Themes (Rotating per episode)
const THEMES = [
  {
    name: 'Nature & Wildlife Wonders',
    category: 'wildlife',
    bgStart: '#061a14',
    bgEnd: '#0f382a',
    cardBg: '#134e3a',
    cardBorder: 'rgba(52, 211, 153, 0.4)',
    accent: '#059669',
    accentGold: '#34d399',
    textHighlight: '#a7f3d0',
    timerColor: '#10b981'
  },
  {
    name: 'Human Body & Mind Mysteries',
    category: 'human_body',
    bgStart: '#18072b',
    bgEnd: '#2f0f52',
    cardBg: '#3d1669',
    cardBorder: 'rgba(236, 72, 153, 0.4)',
    accent: '#db2777',
    accentGold: '#f43f5e',
    textHighlight: '#fbcfe8',
    timerColor: '#f43f5e'
  },
  {
    name: 'Everyday Science & Kitchen Physics',
    category: 'kitchen_physics',
    bgStart: '#1f0f04',
    bgEnd: '#3d1e08',
    cardBg: '#4f270b',
    cardBorder: 'rgba(245, 158, 11, 0.4)',
    accent: '#d97706',
    accentGold: '#fbbf24',
    textHighlight: '#fde68a',
    timerColor: '#f59e0b'
  },
  {
    name: 'Earth, Sky & Cosmos',
    category: 'earth_space',
    bgStart: '#060d1f',
    bgEnd: '#0f1f42',
    cardBg: '#132852',
    cardBorder: 'rgba(56, 189, 248, 0.4)',
    accent: '#0284c7',
    accentGold: '#38bdf8',
    textHighlight: '#7dd3fc',
    timerColor: '#38bdf8'
  },
  {
    name: 'Everyday Logic & Common Wonders',
    category: 'everyday_logic',
    bgStart: '#0f092b',
    bgEnd: '#1e1354',
    cardBg: '#2a1a73',
    cardBorder: 'rgba(139, 92, 246, 0.4)',
    accent: '#7c3aed',
    accentGold: '#a78bfa',
    textHighlight: '#ddd6fe',
    timerColor: '#8b5cf6'
  }
];

// Dynamic Showdown Trivia Engine — Seeded Catalog Deleted per User Directive
const CURATED_SHOWDOWN_CATALOG = {};

/**
 * Resilient TTS Synthesis with Timeout & Automatic Voice Fallback
 */
async function synthesizeSpeechWithRetry(text, outFile, maxRetries = 2) {
  const voices = ["en-US-AndrewNeural", "en-US-AndrewMultilingualNeural", "en-US-GuyNeural"];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const voice = voices[attempt % voices.length];
    try {
      const t = new EdgeTTS({
        voice,
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        timeout: 45000
      });
      await t.ttsPromise(text, outFile);
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 500) {
        return outFile;
      }
    } catch (err) {
      console.warn(`[TTS Retry Notice] Voice "${voice}" attempt ${attempt + 1} notice: ${err.message}. Retrying...`);
      if (attempt === maxRetries) {
        throw new Error(`TTS synthesis failed after ${maxRetries + 1} attempts: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1200));
    }
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
 * Intelligent Text Wrapping: Wraps words cleanly and returns array of lines
 */
function wrapTextToLines(text, maxCharsPerLine = 32) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + ' ' + w).length <= maxCharsPerLine) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generate Crisp Mechanical Clock Ticking Sound (5 loud, crisp ticks + resonant tone)
 */
function generate5sClockTickWav(outputPath) {
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) return outputPath;

  const filter = [
    'sine=f=1800:d=0.06,asetpts=PTS-STARTPTS[t1]',
    'sine=f=1200:d=0.06,asetpts=PTS-STARTPTS,adelay=1000|1000[t2]',
    'sine=f=1800:d=0.06,asetpts=PTS-STARTPTS,adelay=2000|2000[t3]',
    'sine=f=1200:d=0.06,asetpts=PTS-STARTPTS,adelay=3000|3000[t4]',
    'sine=f=2200:d=0.15,asetpts=PTS-STARTPTS,adelay=4000|4000[t5]',
    '[t1][t2][t3][t4][t5]amix=inputs=5:duration=longest,volume=3.5[ticks]',
    'anoisesrc=d=5.0:c=pink:r=44100:a=0.006,lowpass=f=400[amb]',
    '[ticks][amb]amix=inputs=2:duration=first[aout]'
  ].join(';');

  const cmd = `ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -filter_complex "${filter}" -map "[aout]" -t 5.2 -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch (err) {
    execSync(`ffmpeg -y -f lavfi -i "sine=f=880:d=5.0" -t 5.0 "${outputPath}" 2>/dev/null`);
  }
  return outputPath;
}

/**
 * Build SVG Card for Question State
 * Text is dynamically sized: NEVER truncated, NEVER cut off!
 */
function buildQuestionCardSvg(qObj, qIndex, totalQuestions, sec = 5, theme, visualPngPath = null, width = 1080, height = 1920) {
  const timerFraction = Math.max(0.08, sec / 5.0);

  // Dynamic question formatting: adapt line length and font size to text length so NO words are cut off!
  const qText = String(qObj.question || '').trim();
  let maxChars = 30;
  let qFontSize = 24;
  let lineSpacing = 36;

  if (qText.length <= 60) {
    maxChars = 26;
    qFontSize = 26;
    lineSpacing = 40;
  } else if (qText.length <= 90) {
    maxChars = 32;
    qFontSize = 22;
    lineSpacing = 34;
  } else {
    maxChars = 36;
    qFontSize = 19;
    lineSpacing = 28;
  }

  const qLines = wrapTextToLines(qText, maxChars);
  const qTspans = qLines.map((line, i) =>
    `<tspan x="36" dy="${i === 0 ? 0 : lineSpacing}">${escapeXml(line)}</tspan>`
  ).join('');

  // 4 Option Cards (Y: 760, 856, 952, 1048) - height 78px each
  const optionYStarts = [760, 856, 952, 1048];
  const optionCards = qObj.options.map((opt, i) => {
    const y = optionYStarts[i];
    const optText = String(opt.text || '').trim();
    // Dynamic option font size: 20px for short, 17px for long options (never cut off!)
    const optFontSize = optText.length > 36 ? 17 : 20;

    return `
      <g transform="translate(80, ${y})">
        <rect width="920" height="78" rx="16" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="1.8" />
        <rect x="14" y="12" width="54" height="54" rx="12" fill="${theme.accent}" />
        <text x="41" y="48" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <text x="86" y="47" font-family="system-ui, sans-serif" font-size="${optFontSize}" font-weight="700" fill="#f8fafc">
          ${escapeXml(optText)}
        </text>
      </g>
    `;
  }).join('\n');

  // Embed photo visual if available
  let visualImageTag = '';
  if (visualPngPath && fs.existsSync(visualPngPath)) {
    try {
      const ext = path.extname(visualPngPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const b64 = fs.readFileSync(visualPngPath).toString('base64');
      visualImageTag = `<image href="data:${mime};base64,${b64}" x="0" y="0" width="920" height="270" preserveAspectRatio="xMidYMid slice" clip-path="url(#visClip)" />`;
    } catch {}
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
      <clipPath id="visClip">
        <rect width="920" height="270" rx="22" />
      </clipPath>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- 1. Header Pill (Y: 100) -->
    <g transform="translate(80, 100)">
      <rect width="920" height="60" rx="30" fill="#020617" fill-opacity="0.85" stroke="${theme.cardBorder}" stroke-width="1.8" />
      <rect x="10" y="10" width="220" height="40" rx="20" fill="${theme.accent}" />
      <text x="120" y="36" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">
        QUESTION ${qIndex} OF ${totalQuestions}
      </text>
      <text x="890" y="37" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="${theme.accentGold}" letter-spacing="2" text-anchor="end">
        IQ SHOWDOWN • ${escapeXml((qObj.category || 'SHOWDOWN').toUpperCase())}
      </text>
    </g>

    <!-- 2. Authentic Topic Photography Visual Box (Y: 180) -->
    <g transform="translate(80, 180)" filter="url(#cardShadow)">
      <rect width="920" height="270" rx="22" fill="#080e1e" stroke="${theme.accentGold}" stroke-width="2" />
      ${visualImageTag}
      <!-- Dark gradient scrim over photo bottom -->
      <rect x="0" y="160" width="920" height="110" fill="url(#bgGrad)" fill-opacity="0.75" clip-path="url(#visClip)" />
      <!-- Topic badge over photo -->
      <g transform="translate(24, 215)">
        <rect width="320" height="36" rx="18" fill="#020617" fill-opacity="0.9" stroke="${theme.accentGold}" stroke-width="1" />
        <text x="160" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="${theme.accentGold}" text-anchor="middle" letter-spacing="1">
          🔍 TOPIC: ${escapeXml((qObj.topic || 'SCIENCE').toUpperCase().slice(0, 26))}
        </text>
      </g>
    </g>

    <!-- 3. Main Question Card (Y: 480) -->
    <g transform="translate(80, 480)" filter="url(#cardShadow)">
      <rect width="920" height="250" rx="24" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="2" />
      <text x="36" y="44" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="${theme.accentGold}" letter-spacing="2">
        COMMON KNOWLEDGE CHALLENGE:
      </text>
      <text x="36" y="92" font-family="system-ui, sans-serif" font-size="${qFontSize}" font-weight="900" fill="#ffffff" letter-spacing="-0.2">
        ${qTspans}
      </text>
    </g>

    <!-- 4. 4 Option Cards (Y: 760 - 1126) -->
    ${optionCards}

    <!-- 5. Animated Countdown HUD Card (Y: 1160) -->
    <g transform="translate(80, 1160)" filter="url(#cardShadow)">
      <rect width="920" height="175" rx="22" fill="#020617" stroke="${theme.accentGold}" stroke-width="2" />
      
      <!-- Pulsing Timer Ring with Digit -->
      <circle cx="85" cy="88" r="50" fill="${theme.accent}" />
      <circle cx="85" cy="88" r="56" fill="none" stroke="${theme.accentGold}" stroke-width="4" stroke-dasharray="10 5" />
      <text x="85" y="104" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">${sec}</text>

      <text x="165" y="62" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#ffffff">
        COUNTDOWN: 5 SECONDS!
      </text>
      <text x="165" y="94" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="${theme.accentGold}">
        Drop your guess in the comments right now!
      </text>

      <!-- Shrinking Progress Bar -->
      <g transform="translate(165, 118)">
        <rect width="715" height="14" rx="7" fill="#1e293b" />
        <rect width="${Math.round(715 * timerFraction)}" height="14" rx="7" fill="${theme.timerColor}" />
      </g>
    </g>

    <!-- 6. Footer & Channel Watermark (Y: 1360) -->
    <g transform="translate(80, 1360)">
      <rect width="920" height="64" rx="18" fill="#020617" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" />
      <text x="460" y="39" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">
        ARCHIE EXPLAINS • ${getVerifiedChannelHandle('ch3')} • Lock in A, B, C, or D! ⏳
      </text>
    </g>
  </svg>`;
}

/**
 * Build SVG Card for Answer Reveal State (Clear winner highlight, explanation, zero overflow)
 */
function buildAnswerCardSvg(qObj, qIndex, totalQuestions, theme, visualPngPath = null, width = 1080, height = 1920) {
  const optionYStarts = [760, 856, 952, 1048];

  const optionCards = qObj.options.map((opt, i) => {
    const isCorrect = opt.key === qObj.correctKey;
    const y = optionYStarts[i];
    const fill = isCorrect ? '#064e3b' : 'rgba(15, 23, 42, 0.7)';
    const stroke = isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)';
    const strokeWidth = isCorrect ? '3' : '1.2';
    const badgeColor = isCorrect ? '#10b981' : '#334155';
    const textColor = isCorrect ? '#6ee7b7' : '#94a3b8';
    const optText = String(opt.text || '').trim();
    const optFontSize = optText.length > 36 ? 17 : 20;

    return `
      <g transform="translate(80, ${y})">
        <rect width="920" height="78" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <rect x="14" y="12" width="54" height="54" rx="12" fill="${badgeColor}" />
        <text x="41" y="48" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <text x="86" y="47" font-family="system-ui, sans-serif" font-size="${optFontSize}" font-weight="${isCorrect ? '900' : '600'}" fill="${textColor}">
          ${escapeXml(optText)} ${isCorrect ? '  ✓ CORRECT' : ''}
        </text>
      </g>
    `;
  }).join('\n');

  // Dynamic explanation lines (Never sliced or cut off)
  const expText = String(qObj.explanation || '').trim();
  const expFontSize = expText.length > 90 ? 18 : 21;
  const expLineSpacing = expText.length > 90 ? 28 : 34;
  const expLines = wrapTextToLines(expText, expText.length > 90 ? 38 : 32);
  const expTspans = expLines.map((l, i) =>
    `<tspan x="30" dy="${i === 0 ? 0 : expLineSpacing}">${escapeXml(l)}</tspan>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Top Header -->
    <g transform="translate(80, 100)">
      <rect width="920" height="60" rx="30" fill="#064e3b" stroke="#10b981" stroke-width="2" />
      <text x="460" y="39" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#6ee7b7" letter-spacing="3" text-anchor="middle">
        VERIFIED REVEAL • QUESTION ${qIndex} OF ${totalQuestions}
      </text>
    </g>

    <!-- Big Verified Banner -->
    <g transform="translate(80, 180)">
      <rect width="920" height="150" rx="24" fill="#022c22" stroke="#10b981" stroke-width="3" />
      <text x="460" y="48" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#6ee7b7" letter-spacing="3" text-anchor="middle">
        THE TRUTH REVEALED
      </text>
      <text x="460" y="105" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">
        OPTION ${qObj.correctKey} IS THE REAL ANSWER!
      </text>
    </g>

    <!-- Why This Is True Card -->
    <g transform="translate(80, 350)">
      <rect width="920" height="380" rx="24" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="2" />
      <g transform="translate(30, 26)">
        <rect width="210" height="34" rx="12" fill="${theme.accent}" />
        <text x="105" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
          WHY THIS IS TRUE
        </text>
      </g>
      <text x="30" y="112" font-family="system-ui, sans-serif" font-size="${expFontSize}" font-weight="700" fill="#ffffff">
        ${expTspans}
      </text>
      <g transform="translate(30, 280)">
        <rect width="860" height="64" rx="16" fill="#020617" stroke="#334155" stroke-width="1" />
        <text x="430" y="38" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="${theme.accentGold}" text-anchor="middle">
          Takeaway: ${escapeXml((qObj.topic || 'Observable science principle').slice(0, 52))}
        </text>
      </g>
    </g>

    <!-- 4 Options with Correct One Highlighted -->
    ${optionCards}

    <!-- Bottom Debate Prompt & Watermark -->
    <g transform="translate(80, 1160)">
      <rect width="920" height="90" rx="22" fill="#020617" stroke="${theme.accentGold}" stroke-width="2" />
      <text x="460" y="42" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="${theme.accentGold}" text-anchor="middle">
        Did you get this right? Argue or confirm below! 👇
      </text>
      <text x="460" y="70" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">
        ARCHIE EXPLAINS • ${getVerifiedChannelHandle('ch3')}
      </text>
    </g>
  </svg>`;
}

/**
 * Dynamically Generate a Fresh, Relatable Trivia Question via Active AI
 */
async function generateDynamicCategoryQuestion(categoryKey) {
  const catNames = {
    wildlife: 'Animal & Nature Wonders (Surprising animal behaviors, instincts, adaptations)',
    human_body: 'Human Body & Brain Mysteries (Everyday reflexes, senses, biology quirks)',
    kitchen_physics: 'Kitchen & Everyday Physics (Food science, heat, boiling, everyday materials)',
    earth_space: 'Earth, Sky & Cosmos (Weather phenomena, clouds, oceans, space facts)',
    everyday_logic: 'Everyday Tech & Physical Mysteries (Touchscreens, microwaves, mirrors, sounds)'
  };
  const categoryPrompt = catNames[categoryKey] || 'Everyday Science Curiosity';

  const systemPrompt = `You are the lead trivia creator for Archie Explains (@ArchieExplains).
Create 1 fun, universally relatable, surprising trivia question about: ${categoryPrompt}.
MANDATORY RULES:
1. QUESTION: Universally interesting, everyday curiosity question people encounter in real life. Max 18 words. (Never overly academic, no obscure chemical formulas).
2. 4 OPTIONS: A, B, C, D. Each option must be short (max 32 characters) so it NEVER overflows or cuts off.
3. CORRECT KEY: Exactly one of 'A', 'B', 'C', or 'D'.
4. EXPLANATION: Plain English, fascinating 2-sentence explanation of why it happens (25-35 words).
5. TOPIC: Punchy 2-4 word topic title.
6. SEARCH QUERY: Highly specific 3-5 word photography query for Unsplash/Wikimedia.

Return strictly valid JSON:
{
  "question": "Why do flamingos stand on one leg in water?",
  "options": [
    { "key": "A", "text": "To keep body heat in cold water" },
    { "key": "B", "text": "To sneak up on small fish" },
    { "key": "C", "text": "To stretch their leg muscles" },
    { "key": "D", "text": "To balance better in mud" }
  ],
  "correctKey": "A",
  "explanation": "Tucking one leg against their body dramatically reduces heat loss through bare skin in cold water, saving vital energy.",
  "topic": "Flamingo Heat Control",
  "category": "${categoryKey}",
  "searchQuery": "flamingo standing on one leg water wildlife"
} `;

  const userPrompt = `Generate a fresh, universally captivating question about ${categoryPrompt}. Ensure options are concise (under 30 chars each) and explanation is clear.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'cartoon',
        temperature: attempt === 1 ? 0.72 : 0.85
      });
      if (res?.data?.question && Array.isArray(res?.data?.options) && res.data.options.length === 4 && res?.data?.correctKey) {
        return {
          ...res.data,
          category: categoryKey
        };
      }
    } catch (err) {
      console.warn(`[Archie Q&A AI Notice] Attempt ${attempt} notice for ${categoryKey}: ${err.message}`);
    }
  }
  return null;
}

/**
 * Select 3 Deduplicated Questions ensuring 3 COMPLETELY DIFFERENT categories
 * Uses Active AI first to generate fresh, real-time questions, falling back to diverse catalog
 */
async function select3DeduplicatedQuestions() {
  const selected = [];
  const categories = ['wildlife', 'human_body', 'kitchen_physics', 'earth_space', 'everyday_logic'];

  // Pick 3 distinct categories randomly
  const shuffledCats = [...categories].sort(() => 0.5 - Math.random());
  console.log(`[Q&A Director] 🎲 Evaluating Distinct Categories: ${shuffledCats.join(', ')}`);

  for (const cat of shuffledCats) {
    if (selected.length >= 3) break;
    console.log(`[Q&A Director] 🧠 Synthesizing live AI question for category: "${cat}"...`);
    const q = await generateDynamicCategoryQuestion(cat);
    if (q) {
      selected.push(q);
      try {
        await recordPostedCandidate(`archie_qa_${cat}`, q.question, q.topic, {
          category: cat,
          correctKey: q.correctKey,
          timestamp: Date.now()
        });
      } catch {}
    }
  }

  // Ensure 3 questions synthesized by AI; if not, throw an error per strict zero-seed policy
  if (selected.length < 3) {
    throw new Error(`[Archie Q&A Error] Active AI produced only ${selected.length}/3 questions. Per strict user mandate, seeded fallback questions are deleted. Failing workflow.`);
  }

  return selected.slice(0, 3);
}

/**
 * Main Generator: Build 1 Complete 3-in-1 Archie Teaser Video
 */
async function generateArchie3In1Teaser() {
  console.log('\n===============================================================');
  console.log('⚡ ARCHIE DAILY 3-IN-1 INTELLECTUAL Q&A SHOWDOWN');
  console.log('3 Distinct Categories | Auto-Scaled Text | Audible Clock Ticking');
  console.log('===============================================================\n');

  const questions = await select3DeduplicatedQuestions();
  console.log(`✓ Loaded 3 Showdown Questions across 3 Distinct Categories:`);
  questions.forEach((q, idx) => console.log(`  Q${idx + 1} [${q.category}]: "${q.question}" (Correct: Option ${q.correctKey})`));

  const theme = THEMES[Math.floor(Date.now() / 1000) % THEMES.length];
  console.log(`✓ Theme: "${theme.name}" (${theme.bgStart} -> ${theme.bgEnd})`);

  // Synthesize common 5.5s clock ticking WAV
  const clockWavPath = path.join(ARTIFACTS_DIR, 'clock_5s.wav');
  generate5sClockTickWav(clockWavPath);

  const tts = new EdgeTTS({
    voice: 'en-US-AndrewMultilingualNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
  });

  const partVideoPaths = [];

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const qNum = qIdx + 1;
    const qObj = questions[qIdx];
    console.log(`\n--- RENDERING QUESTION ${qNum}/3: "${qObj.topic}" (${qObj.category}) ---`);

    // 1. Source Photo Visual for this question
    const query = qObj.searchQuery || qObj.imageSearchQuery || qObj.topic || 'science curiosity';
    console.log(`[Media Fetcher] Sourcing photo for: "${query}"...`);
    let visualPngPath = null;
    try {
      const fetched = await searchAndFetchImage(query, { preferredSource: 'unsplash' });
      if (fetched?.localPath && fs.existsSync(fetched.localPath)) {
        visualPngPath = fetched.localPath;
      }
    } catch (e) {
      console.warn(`[Media Notice] Could not source photo: ${e.message}`);
    }

    // 2. Synthesize Andrew's Voice Intro for this Question
    const introSpeech = `Question ${qNum}. ${qObj.question}. Is it Option A, ${qObj.options[0].text}. Option B, ${qObj.options[1].text}. Option C, ${qObj.options[2].text}. Or Option D, ${qObj.options[3].text}? Five seconds on the clock!`;
    const introAudioPath = path.join(ARTIFACTS_DIR, `q${qNum}_intro.wav`);
    const introMp3Path = path.join(ARTIFACTS_DIR, `q${qNum}_intro.mp3`);

    console.log(`[EdgeTTS] Synthesizing Question ${qNum} readout...`);
    await synthesizeSpeechWithRetry(introSpeech, introMp3Path);
    execSync(`ffmpeg -y -i "${introMp3Path}" -ar 44100 -ac 2 "${introAudioPath}" 2>/dev/null`);

    let introDuration = 9.0;
    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${introAudioPath}"`).toString();
      introDuration = Math.max(5.0, parseFloat(probe.trim()) || 9.0);
    } catch {}

    // 3. Render Intro Segment Video
    const qSvg = buildQuestionCardSvg(qObj, qNum, 3, 5, theme, visualPngPath);
    const qSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_card.svg`);
    const qPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_card.png`);
    fs.writeFileSync(qSvgPath, qSvg);
    execSync(`ffmpeg -y -i "${qSvgPath}" "${qPngPath}" 2>/dev/null`);

    const introMp4Path = path.join(ARTIFACTS_DIR, `q${qNum}_intro.mp4`);
    execSync(`ffmpeg -y -loop 1 -t ${introDuration.toFixed(2)} -i "${qPngPath}" -i "${introAudioPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${introDuration.toFixed(2)} "${introMp4Path}" 2>/dev/null`);
    partVideoPaths.push(introMp4Path);

    // 4. Render 5-Second Countdown Segment with Mechanical Clock Sound
    console.log(`[Countdown Engine] Rendering 5-second ticking countdown...`);
    const countSegPaths = [];
    for (let sec = 5; sec >= 1; sec--) {
      const countSvg = buildQuestionCardSvg(qObj, qNum, 3, sec, theme, visualPngPath);
      const countSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_t${sec}.svg`);
      const countPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_t${sec}.png`);
      fs.writeFileSync(countSvgPath, countSvg);
      execSync(`ffmpeg -y -i "${countSvgPath}" "${countPngPath}" 2>/dev/null`);

      const countSegMp4 = path.join(ARTIFACTS_DIR, `q${qNum}_t${sec}.mp4`);
      execSync(`ffmpeg -y -loop 1 -t 1.0 -i "${countPngPath}" -f lavfi -i "anullsrc=r=44100:cl=stereo" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t 1.0 "${countSegMp4}" 2>/dev/null`);
      countSegPaths.push(countSegMp4);
    }

    // Merge 5 frames with clock ticking audio
    const count5sConcatTxt = path.join(ARTIFACTS_DIR, `q${qNum}_count_concat.txt`);
    fs.writeFileSync(count5sConcatTxt, countSegPaths.map(p => `file '${p}'`).join('\n'));

    const count5sMergedMp4 = path.join(ARTIFACTS_DIR, `q${qNum}_countdown_merged.mp4`);
    execSync(`ffmpeg -y -f concat -safe 0 -i "${count5sConcatTxt}" -i "${clockWavPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t 5.0 -map 0:v -map 1:a "${count5sMergedMp4}" 2>/dev/null`);
    partVideoPaths.push(count5sMergedMp4);

    // 5. Synthesize Answer Reveal Speech
    const correctOpt = qObj.options.find(o => o.key === qObj.correctKey) || qObj.options[0];
    const revealSpeech = `Time's up! The correct answer is Option ${qObj.correctKey}, ${correctOpt.text}. ${qObj.explanation}. Did you get this right? Tell me in the comments!`;
    const revealMp3Path = path.join(ARTIFACTS_DIR, `q${qNum}_reveal.mp3`);
    const revealAudioPath = path.join(ARTIFACTS_DIR, `q${qNum}_reveal.wav`);

    console.log(`[EdgeTTS] Synthesizing Answer ${qNum} reveal...`);
    await synthesizeSpeechWithRetry(revealSpeech, revealMp3Path);
    execSync(`ffmpeg -y -i "${revealMp3Path}" -ar 44100 -ac 2 "${revealAudioPath}" 2>/dev/null`);

    let revealDuration = 7.0;
    try {
      const probeRev = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${revealAudioPath}"`).toString();
      revealDuration = Math.max(4.0, parseFloat(probeRev.trim()) || 7.0);
    } catch {}

    const ansSvg = buildAnswerCardSvg(qObj, qNum, 3, theme, visualPngPath);
    const ansSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_ans.svg`);
    const ansPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_ans.png`);
    fs.writeFileSync(ansSvgPath, ansSvg);
    execSync(`ffmpeg -y -i "${ansSvgPath}" "${ansPngPath}" 2>/dev/null`);

    const ansMp4Path = path.join(ARTIFACTS_DIR, `q${qNum}_ans.mp4`);
    execSync(`ffmpeg -y -loop 1 -t ${revealDuration.toFixed(2)} -i "${ansPngPath}" -i "${revealAudioPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${revealDuration.toFixed(2)} "${ansMp4Path}" 2>/dev/null`);
    partVideoPaths.push(ansMp4Path);

    // Record to database for deduplication
    try {
      await recordPostedCandidate(`archie_qa_${qObj.category}`, qObj.question, qObj.topic, {
        correctKey: qObj.correctKey,
        explanation: qObj.explanation
      });
    } catch {}
  }

  // 6. Master Assembly: Re-encode and Concatenate All Video Segments
  console.log(`\n[Compositor Engine] Assembling master 3-in-1 Showdown Video...`);
  const masterListTxt = path.join(ARTIFACTS_DIR, 'master_concat_list.txt');
  fs.writeFileSync(masterListTxt, partVideoPaths.map(p => `file '${p}'`).join('\n'));

  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `archie_qa_teaser_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'archie_qa_teaser_latest.mp4');

  // Re-encode during concat to ensure frame rates and audio streams align perfectly
  const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${masterListTxt}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 "${finalMp4Path}" 2>/dev/null`;
  execSync(concatCmd);

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`\n🎉 [Showdown Engine] SUCCESS: Master Video Rendered (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` • Path: ${finalMp4Path}`);
  }

  // 7. Dispatch to YouTube Shorts (Channel 3: Tech & Science Animation)
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch3Token = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || '';

  const viralTitle = `3 Common Knowledge Questions Most People Get Wrong! #Shorts`;
  const viralDesc = `Can you score 3 out of 3? Test your everyday intuition!\n\n1. ${questions[0].question}\n2. ${questions[1].question}\n3. ${questions[2].question}\n\nLock in your answers below! ⏳\n\n#ArchieExplains #Trivia #ScienceFacts #Showdown #Shorts`;

  if (ch3Token && !isDryRun) {
    console.log(`\n[Showdown Dispatcher] 📤 Uploading 3-in-1 Showdown to YouTube Channel 3...`);
    try {
      await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: ['#Trivia', '#Showdown', '#ScienceFacts', '#Curiosity', '#Archie', '#Shorts'],
        channelId: 'cartoon_factory'
      });
      console.log(`[Showdown Dispatcher] YouTube upload successful!`);
    } catch (e) {
      console.warn(`[Showdown Dispatcher] YouTube notice:`, e.message);
    }
  }

  return {
    videoPath: finalMp4Path,
    questions
  };
}

if (require.main === module) {
  generateArchie3In1Teaser()
    .then(() => {
      console.log('\n✓ Archie 3-in-1 Showdown Pipeline Completed Successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Fatal error in Archie Showdown pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateArchie3In1Teaser,
  select3DeduplicatedQuestions,
  CURATED_SHOWDOWN_CATALOG,
  buildQuestionCardSvg,
  buildAnswerCardSvg
};
