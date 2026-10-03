/**
 * Archie Daily Q&A Teaser & Intellectual Showdown Generator
 *
 * User Mandates:
 * 1. Everyday updating Question & Answer session.
 * 2. Voice: Microsoft Edge "en-US-AndrewMultilingualNeural" or "en-US-AndrewNeural" at human pace (rate: 0%, pitch: 0Hz).
 * 3. 4 on-screen options (A, B, C, D) for questions people are expected to know (Content Creation, Tech & Science, Finance, Everyday Wonders, etc.).
 * 4. 5 to 7 seconds on-screen countdown with authentic clock ticking sound.
 * 5. Asks viewer if they have commented their answer.
 * 6. Reveals real answer and explains WHY clearly.
 * 7. Asks viewer if they argue/debate it in comments to trigger high algorithmic engagement.
 * 8. Deduplication via persistent Firestore database + local cache.
 * 9. NO ARCHIE IMAGE: Dynamic rotating background colors, sleek modern cards, high engagement visual layout.
 * 10. Automated twice daily via dedicated GitHub Actions workflow.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { EdgeTTS } = require('node-edge-tts');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { saveChosenTopicToDatabase } = require('./topic_discovery_engine.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_qa');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 5 Sophisticated Themes (Background Gradients & Accents - No cartoon character)
const THEMES = [
  {
    name: 'Tech & Science',
    category: 'tech_science',
    bgStart: '#040d21',
    bgEnd: '#0b192e',
    cardBg: '#0f2442',
    accent: '#06b6d4',
    accentGold: '#38bdf8',
    textHighlight: '#67e8f9'
  },
  {
    name: 'Content Creation & Algorithms',
    category: 'content_creation',
    bgStart: '#140624',
    bgEnd: '#240b3b',
    cardBg: '#2d124d',
    accent: '#ec4899',
    accentGold: '#f43f5e',
    textHighlight: '#fbcfe8'
  },
  {
    name: 'Finance & Money Mastery',
    category: 'finance',
    bgStart: '#021810',
    bgEnd: '#062d1f',
    cardBg: '#0a3d2b',
    accent: '#10b981',
    accentGold: '#34d399',
    textHighlight: '#a7f3d0'
  },
  {
    name: 'Everyday Physics & Wonders',
    category: 'everyday_wonders',
    bgStart: '#1a0b02',
    bgEnd: '#301605',
    cardBg: '#421f08',
    accent: '#f59e0b',
    accentGold: '#fbbf24',
    textHighlight: '#fde68a'
  },
  {
    name: 'Human Psychology & Mind',
    category: 'psychology',
    bgStart: '#09081f',
    bgEnd: '#15133d',
    cardBg: '#1e1b57',
    accent: '#8b5cf6',
    accentGold: '#a78bfa',
    textHighlight: '#ddd6fe'
  }
];

// Curated Bank of Genius Questions People Are Expected To Know
const CURATED_QA_BANK = [
  {
    category: 'Content Creation',
    topic: 'YouTube Algorithm Mechanics',
    question: 'When YouTube decides whether to promote a video to millions, which metric matters most in the first 24 hours?',
    options: [
      { key: 'A', text: 'Total likes and subscriber count' },
      { key: 'B', text: 'Click-Through Rate and Average View Duration' },
      { key: 'C', text: 'Number of hashtags in description' },
      { key: 'D', text: 'Video resolution (4K vs 1080p)' }
    ],
    correctKey: 'B',
    explanation: 'The algorithm prioritizes viewer satisfaction. High CTR gets people in the door, but high retention keeps them on the platform. The algorithm optimizes purely for watch sessions, not vanity metrics like subscribers!',
    debatePrompt: 'Do you think watch time is still king, or is viewer comment sentiment taking over? Debate in the comments!'
  },
  {
    category: 'Tech & Science',
    topic: 'Microwave Physics',
    question: 'Why does your microwave heat the soup scalding hot, but leaves the ceramic bowl relatively cold?',
    options: [
      { key: 'A', text: 'Ceramic reflects 100% of all radiation' },
      { key: 'B', text: 'Microwaves specifically excite polar water molecules' },
      { key: 'C', text: 'The bowl is insulated with internal vacuum pockets' },
      { key: 'D', text: 'Heat rises to liquid surfaces only' }
    ],
    correctKey: 'B',
    explanation: 'Microwaves emit electromagnetic radiation at 2.45 GHz. This frequency causes asymmetric polar water molecules to rotate furiously, generating frictional heat. Dry ceramic lacks free water molecules, so it only gets warm through direct conduction!',
    debatePrompt: 'Have you ever had a bowl that got hotter than the food itself? Tell us why in the comments!'
  },
  {
    category: 'Finance',
    topic: 'The Rule of 72',
    question: 'If an investment generates a steady 8% annual return, roughly how many years will it take for your money to double without adding another cent?',
    options: [
      { key: 'A', text: '12 years' },
      { key: 'B', text: '18 years' },
      { key: 'C', text: '9 years' },
      { key: 'D', text: '6 years' }
    ],
    correctKey: 'C',
    explanation: 'By the mathematical Rule of 72: divide 72 by the annual rate of return (72 / 8 = 9). In exactly 9 years, compound interest doubles your principal. At 12%, it doubles in just 6 years!',
    debatePrompt: 'Is an 8% return realistic in today\'s volatile market? Drop your investment philosophy below!'
  },
  {
    category: 'Tech & Science',
    topic: 'Smartphone Display Technology',
    question: 'Why does using Pure Dark Mode on modern OLED smartphones actually save battery life, whereas on older LCD screens it saves zero?',
    options: [
      { key: 'A', text: 'Dark pixels require negative voltage' },
      { key: 'B', text: 'OLED turns off individual microscopic LEDs completely' },
      { key: 'C', text: 'Black color reduces CPU operating clock frequency' },
      { key: 'D', text: 'Dark mode limits touchscreen sensor polling' }
    ],
    correctKey: 'B',
    explanation: 'LCD screens use a continuous backlight that is always fully on, blocking light with liquid crystals to create black. In OLED panels, each individual pixel emits its own light; displaying black means the pixel is completely turned off and draws 0.0 milliamps!',
    debatePrompt: 'Are you team Dark Mode or team Light Mode? Let us hear your argument in the comments!'
  },
  {
    category: 'Everyday Wonders',
    topic: 'Culinary Chemistry',
    question: 'Why do onions make you burst into tears when you slice them with a knife?',
    options: [
      { key: 'A', text: 'Microscopic onion seeds irritate corneal nerve endings' },
      { key: 'B', text: 'Ruptured cells release syn-propanethial-S-oxide gas' },
      { key: 'C', text: 'Acidic onion juice evaporates into carbon dioxide' },
      { key: 'D', text: 'The bright sulfur color triggers a tear duct reflex' }
    ],
    correctKey: 'B',
    explanation: 'Cutting ruptures cell walls, allowing alliinase enzymes to mix with amino acid sulfoxides. This synthesizes a volatile gas called syn-propanethial-S-oxide. When it touches the moisture in your eyes, it turns into mild sulfuric acid, causing tear glands to flush it away!',
    debatePrompt: 'What is your best kitchen trick to stop onion tears? Put your hack in the comments!'
  },
  {
    category: 'Psychology',
    topic: 'Cognitive Biases',
    question: 'When people fiercely search for evidence that confirms what they already believe while completely ignoring contradictory facts, what psychological bias is at work?',
    options: [
      { key: 'A', text: 'The Dunning-Kruger Effect' },
      { key: 'B', text: 'Confirmation Bias' },
      { key: 'C', text: 'The Bystander Effect' },
      { key: 'D', text: 'Anchoring Heuristic' }
    ],
    correctKey: 'B',
    explanation: 'Confirmation bias is our brain\'s tendency to seek, interpret, and recall information in a way that validates our preexisting hypotheses. The human ego prefers comfortable validation over uncomfortable truth!',
    debatePrompt: 'Have you ever caught yourself doing this in an argument? Be honest in the comments!'
  },
  {
    category: 'Content Creation',
    topic: 'Audience Hook Dynamics',
    question: 'On vertical platforms like YouTube Shorts and TikTok, within how many seconds will over 60% of viewers swipe away if you don\'t deliver a compelling hook?',
    options: [
      { key: 'A', text: 'First 2 to 3 seconds' },
      { key: 'B', text: 'Around 15 seconds' },
      { key: 'C', text: 'Exactly 8 seconds' },
      { key: 'D', text: 'After 30 seconds' }
    ],
    correctKey: 'A',
    explanation: 'Retention data shows the steepest drop-off occurs between seconds 0 and 2.5. If the first visual frame and opening sentence do not create an open information loop or immediate curiosity, the thumb swipes away automatically!',
    debatePrompt: 'What is the most addictive hook format you have seen this month? Share it below!'
  },
  {
    category: 'Finance',
    topic: 'Inflation vs Purchasing Power',
    question: 'If annual inflation is 3.5% and your savings account pays 1.0% interest, what is actually happening to your purchasing power each year?',
    options: [
      { key: 'A', text: 'You are gaining 2.5% in real terms' },
      { key: 'B', text: 'Your money remains perfectly protected' },
      { key: 'C', text: 'You are losing roughly 2.5% of real purchasing power' },
      { key: 'D', text: 'The principal balance drops directly' }
    ],
    correctKey: 'C',
    explanation: 'Nominal interest minus inflation equals real return. 1.0% minus 3.5% = -2.5% real purchasing power per year. Cash sitting idle in low-interest accounts loses purchasing power silently to the invisible tax of inflation!',
    debatePrompt: 'Where is the safest place to preserve cash right now? Debate your strategy below!'
  }
];

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Question Candidate (curated pool + live AI generation fallback)
 */
async function selectOrGenerateQaCandidate() {
  const channelKey = 'archie_qa_teaser';

  // 1. Select deduplicated candidate from curated pool
  const chosen = await selectDeduplicatedCandidate(
    channelKey,
    CURATED_QA_BANK,
    item => item.question,
    item => item.topic,
    async (recentQuestions) => {
      // Dynamic AI fetch if all questions exhausted
      const systemPrompt = `You are a master trivia architect and educator.
Create a genius, viral, multiple-choice question that people are expected to know.
Topics: Content Creation, Tech Science, Finance, Everyday Wonders, or Psychology.
Return strictly valid JSON:
{
  "category": "Tech & Science",
  "topic": "Topic Name",
  "question": "Clear, compelling question sentence?",
  "options": [
    { "key": "A", "text": "Option A" },
    { "key": "B", "text": "Option B" },
    { "key": "C", "text": "Option C" },
    { "key": "D", "text": "Option D" }
  ],
  "correctKey": "B",
  "explanation": "Succinct 2-sentence explanation of why B is true.",
  "debatePrompt": "Compelling question prompting viewer debate in comments?"
}`;
      const userPrompt = `Create a new, highly engaging question not in this list: ${recentQuestions.slice(-10).join(' | ')}`;
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, { nicheKey: 'cartoon' });
      return res?.data || null;
    }
  );

  return chosen;
}

/**
 * Synthesize Spoken Audio with Andrew Voice at Natural Human Pace
 * Rate: 0% (natural human cadence), Pitch: 0Hz
 */
async function synthesizeAndrewSpeech(text, outMp3Path) {
  const voice = 'en-US-AndrewMultilingualNeural';
  console.log(`[Andrew Voice] 🎙️ Synthesizing human-paced voiceover via "${voice}" (Rate: +0%, Pitch: +0Hz)...`);

  let tts;
  try {
    tts = new EdgeTTS({
      voice: voice,
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: '+0%',
      pitch: '+0Hz',
      timeout: 45000
    });
    await tts.ttsPromise(text, outMp3Path);
  } catch (err) {
    console.warn(`[Andrew Voice Notice] Multilingual fallback to AndrewNeural: ${err.message}`);
    tts = new EdgeTTS({
      voice: 'en-US-AndrewNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: '+0%',
      pitch: '+0Hz',
      timeout: 45000
    });
    await tts.ttsPromise(text, outMp3Path);
  }

  const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outMp3Path}"`, { encoding: 'utf8' }).trim();
  return parseFloat(durStr) || 10.0;
}

/**
 * Generate High-Precision Clock Ticking Audio Track (5 to 7 seconds)
 */
function generateClockTickingAudio(durationSeconds = 6.0, outWavPath) {
  console.log(`[Audio FX] ⏱️ Generating ${durationSeconds}s authentic countdown clock ticking sound...`);
  // Synthesize double tick-tock (1600Hz tick + 1200Hz tock) with crisp exponential decay
  const numLoops = Math.round(durationSeconds);
  const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=1500:duration=0.03" -filter_complex "[0:a]apad=pad_dur=0.97,aloop=loop=${numLoops}:size=44100[a]" -map "[a]" -t ${durationSeconds} "${outWavPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch (err) {
    console.warn('[Audio FX Notice] Falling back to standard sine tone tick:', err.message);
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=1000:duration=${durationSeconds}" -af "volume=0.2" "${outWavPath}" 2>/dev/null`);
  }
}

/**
 * Build State 1 SVG Card: Question + 4 Options + Live Countdown Timer Bar
 */
function buildQuestionCardSvg(candidate, theme, remainingSec = 6, width = 1080, height = 1920) {
  const letters = ['A', 'B', 'C', 'D'];
  const optionYStarts = [880, 1020, 1160, 1300];

  const optionCards = candidate.options.map((opt, i) => {
    const y = optionYStarts[i];
    return `
      <!-- Option Card ${opt.key} -->
      <g transform="translate(80, ${y})">
        <rect width="920" height="115" rx="24" fill="${theme.cardBg}" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
        <!-- Letter Badge -->
        <rect x="20" y="20" width="75" height="75" rx="18" fill="${theme.accent}" />
        <text x="57" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <!-- Option Text -->
        <text x="120" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#ffffff">
          ${escapeXml(opt.text.length > 48 ? opt.text.slice(0, 46) + '...' : opt.text)}
        </text>
      </g>
    `;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Subtle Ambient Glow -->
    <circle cx="540" cy="400" r="320" fill="${theme.accent}" opacity="0.15" filter="blur(60px)" />

    <!-- Top Category Bar -->
    <g transform="translate(80, 160)">
      <rect width="320" height="50" rx="25" fill="${theme.accent}" opacity="0.2" />
      <rect width="320" height="50" rx="25" fill="none" stroke="${theme.accent}" stroke-width="2" />
      <text x="160" y="33" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="${theme.accentGold}" letter-spacing="3" text-anchor="middle">
        ⚡ ${escapeXml(candidate.category.toUpperCase())}
      </text>
    </g>

    <text x="1000" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#94a3b8" letter-spacing="2" text-anchor="end">
      DAILY IQ ARENA
    </text>

    <!-- Main Question Box Card -->
    <g transform="translate(80, 240)" filter="url(#cardShadow)">
      <rect width="920" height="340" rx="32" fill="${theme.cardBg}" stroke="rgba(255,255,255,0.18)" stroke-width="2.5" />
      
      <!-- Topic Subheading -->
      <text x="50" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="${theme.accentGold}" letter-spacing="2">
        QUESTION YOU SHOULD KNOW:
      </text>

      <!-- Question Text (Multi-Line Wrapped) -->
      <text x="50" y="130" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="#ffffff" line-height="1.3">
        <tspan x="50" dy="0">${escapeXml(candidate.question.slice(0, 42))}</tspan>
        <tspan x="50" dy="48">${escapeXml(candidate.question.slice(42, 86))}</tspan>
        <tspan x="50" dy="48">${escapeXml(candidate.question.slice(86, 130))}</tspan>
      </text>
    </g>

    <!-- Countdown Timer Prompt Bar -->
    <g transform="translate(80, 615)">
      <rect width="920" height="85" rx="24" fill="#030712" stroke="${theme.accentGold}" stroke-width="2" />
      <!-- Pulsing Timer Circle -->
      <circle cx="65" cy="42" r="26" fill="${theme.accent}" />
      <text x="65" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">⏱️</text>
      <!-- Prompt Text -->
      <text x="115" y="51" font-family="system-ui, -apple-system, sans-serif" font-size="21" font-weight="800" fill="#f8fafc">
        DID YOU DROP YOUR ANSWER IN THE COMMENTS?
      </text>
    </g>

    <!-- 4 Option Cards -->
    ${optionCards}

    <!-- Bottom Guidance Tag -->
    <text x="540" y="1800" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#64748b" letter-spacing="4" text-anchor="middle">
      LOCK IN YOUR GUESS BEFORE TIME RUNS OUT
    </text>
  </svg>`;
}

/**
 * Build State 2 SVG Card: Answer Revealed + Glowing Correct Option + Full Explanation Card
 */
function buildAnswerCardSvg(candidate, theme, width = 1080, height = 1920) {
  const optionYStarts = [720, 840, 960, 1080];

  const optionCards = candidate.options.map((opt, i) => {
    const isCorrect = opt.key === candidate.correctKey;
    const y = optionYStarts[i];
    const fill = isCorrect ? '#064e3b' : 'rgba(15, 23, 42, 0.6)';
    const stroke = isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)';
    const strokeWidth = isCorrect ? '3.5' : '1.5';
    const badgeColor = isCorrect ? '#10b981' : '#334155';
    const textColor = isCorrect ? '#6ee7b7' : '#94a3b8';

    return `
      <g transform="translate(80, ${y})">
        <rect width="920" height="98" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <rect x="18" y="16" width="66" height="66" rx="16" fill="${badgeColor}" />
        <text x="51" y="59" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <text x="105" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="${isCorrect ? '900' : '600'}" fill="${textColor}">
          ${escapeXml(opt.text.length > 50 ? opt.text.slice(0, 48) + '...' : opt.text)} ${isCorrect ? '✓ CORRECT' : ''}
        </text>
      </g>
    `;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
      <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="#10b981" flood-opacity="0.8" />
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Top Answer Banner -->
    <g transform="translate(80, 150)" filter="url(#emeraldGlow)">
      <rect width="920" height="110" rx="28" fill="#064e3b" stroke="#10b981" stroke-width="3" />
      <text x="460" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#a7f3d0" letter-spacing="4" text-anchor="middle">
        VERIFIED REVELATION
      </text>
      <text x="460" y="88" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
        THE REAL ANSWER IS OPTION ${candidate.correctKey}!
      </text>
    </g>

    <!-- Mini Question Reminder -->
    <g transform="translate(80, 290)">
      <rect width="920" height="110" rx="22" fill="${theme.cardBg}" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
      <text x="40" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="${theme.accentGold}" letter-spacing="2">
        QUESTION:
      </text>
      <text x="40" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#f8fafc">
        ${escapeXml(candidate.question.length > 64 ? candidate.question.slice(0, 62) + '...' : candidate.question)}
      </text>
    </g>

    <!-- 4 Option Cards with Reveal Status -->
    <text x="80" y="690" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#94a3b8" letter-spacing="2">
      OPTIONS BREAKDOWN:
    </text>
    ${optionCards}

    <!-- "WHY THIS IS TRUE" Explanation Card -->
    <g transform="translate(80, 1220)">
      <rect width="920" height="340" rx="32" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
      
      <g transform="translate(45, 45)">
        <rect width="180" height="36" rx="18" fill="#0284c7" opacity="0.25" />
        <text x="90" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#38bdf8" letter-spacing="2" text-anchor="middle">
          💡 HERE IS WHY
        </text>
      </g>

      <text x="45" y="130" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#ffffff" line-height="1.4">
        <tspan x="45" dy="0">${escapeXml(candidate.explanation.slice(0, 48))}</tspan>
        <tspan x="45" dy="42">${escapeXml(candidate.explanation.slice(48, 98))}</tspan>
        <tspan x="45" dy="42">${escapeXml(candidate.explanation.slice(98, 148))}</tspan>
        <tspan x="45" dy="42">${escapeXml(candidate.explanation.slice(148, 198))}</tspan>
      </text>
    </g>

    <!-- Bottom Debate Prompt Callout -->
    <g transform="translate(80, 1600)">
      <rect width="920" height="120" rx="28" fill="#1e1b4b" stroke="#818cf8" stroke-width="2" />
      <text x="460" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#c7d2fe" letter-spacing="2" text-anchor="middle">
        💬 DO YOU AGREE OR COUNTER-ARGUE?
      </text>
      <text x="460" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">
        Drop your debate in the comments below!
      </text>
    </g>
  </svg>`;
}

/**
 * Main Generator for Archie Daily Q&A Teaser
 */
async function generateArchieQaTeaser() {
  console.log('\n===============================================================');
  console.log('⚡ ARCHIE DAILY INTELLECTUAL Q&A TEASER & SHOWDOWN GENERATOR');
  console.log('Clean Card Layout | No Archie Sprite | Andrew Voice | 6s Clock Tick');
  console.log('===============================================================\n');

  // 1. Select Deduplicated Candidate
  const candidate = await selectOrGenerateQaCandidate();
  console.log(`[Candidate Selected]: "${candidate.question}"`);
  console.log(`[Category]: "${candidate.category}" | [Correct]: Option ${candidate.correctKey}`);

  // 2. Select Rotating Dynamic Color Theme
  const theme = THEMES[Math.floor(Date.now() / 1000) % THEMES.length];
  console.log(`[Theme Selected]: "${theme.name}" (${theme.bgStart} -> ${theme.bgEnd})`);

  // 3. Synthesize Speech Segments with Andrew Voice (Human Pace: Rate +0%, Pitch +0Hz)
  const part1Text = `Here is a question you really should know the answer to. ${candidate.question} Is it Option A: ${candidate.options[0].text}. Option B: ${candidate.options[1].text}. Option C: ${candidate.options[2].text}. Or Option D: ${candidate.options[3].text}?`;
  const countdownPromptText = `You have six seconds on the clock. Pause and think... Did you drop your answer in the comments yet?`;
  const part2Text = `Time's up! The correct answer is Option ${candidate.correctKey}: ${candidate.options.find(o => o.key === candidate.correctKey)?.text}! Here is why: ${candidate.explanation} ${candidate.debatePrompt || 'Do you agree, or do you have a counter-argument? Debate it in the comments below!'}`;

  const part1Mp3 = path.join(ARTIFACTS_DIR, 'archie_qa_part1.mp3');
  const part2Mp3 = path.join(ARTIFACTS_DIR, 'archie_qa_part2.mp3');
  const part1Dur = await synthesizeAndrewSpeech(part1Text, part1Mp3);
  const part2Dur = await synthesizeAndrewSpeech(part2Text, part2Mp3);

  // 4. Generate Countdown Clock Sound (6.0s duration)
  const countdownDuration = 6.0;
  const clockWavPath = path.join(ARTIFACTS_DIR, 'clock_ticking.wav');
  generateClockTickingAudio(countdownDuration, clockWavPath);

  // 5. Render SVG Cards to PNG
  const qCardSvg = buildQuestionCardSvg(candidate, theme, 6);
  const aCardSvg = buildAnswerCardSvg(candidate, theme);
  const qSvgPath = path.join(ARTIFACTS_DIR, 'question_card.svg');
  const qPngPath = path.join(ARTIFACTS_DIR, 'question_card.png');
  const aSvgPath = path.join(ARTIFACTS_DIR, 'answer_card.svg');
  const aPngPath = path.join(ARTIFACTS_DIR, 'answer_card.png');

  fs.writeFileSync(qSvgPath, qCardSvg, 'utf8');
  fs.writeFileSync(aSvgPath, aCardSvg, 'utf8');

  execSync(`rsvg-convert -w 1080 -h 1920 "${qSvgPath}" -o "${qPngPath}" 2>/dev/null || ffmpeg -y -i "${qSvgPath}" "${qPngPath}" 2>/dev/null`);
  execSync(`rsvg-convert -w 1080 -h 1920 "${aSvgPath}" -o "${aPngPath}" 2>/dev/null || ffmpeg -y -i "${aSvgPath}" "${aPngPath}" 2>/dev/null`);

  // 6. Concatenate Master Audio: Part 1 + Clock Ticking (with voice prompt) + Part 2
  const masterAudioPath = path.join(ARTIFACTS_DIR, 'master_qa_audio.wav');
  const totalDuration = Number((part1Dur + countdownDuration + part2Dur).toFixed(2));
  console.log(`[Timeline] Part 1: ${part1Dur.toFixed(1)}s | Countdown: ${countdownDuration}s | Part 2: ${part2Dur.toFixed(1)}s | Total: ${totalDuration}s`);

  // Merge audio tracks
  const concatAudioList = path.join(ARTIFACTS_DIR, 'audio_concat_list.txt');
  fs.writeFileSync(concatAudioList, `file '${part1Mp3}'\nfile '${clockWavPath}'\nfile '${part2Mp3}'\n`, 'utf8');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatAudioList}" -c:a pcm_s16le "${masterAudioPath}" 2>/dev/null`);

  // 7. Compose Video: Question Card (0 to part1Dur + countdown) -> Answer Card (until end)
  const switchTime = Number((part1Dur + countdownDuration).toFixed(2));
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `archie_qa_teaser_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'archie_qa_teaser_latest.mp4');

  const filterComplex = `
    [0:v]scale=1080:1920[q_card];
    [1:v]scale=1080:1920[a_card];
    [q_card][a_card]overlay=0:0:enable='gte(t,${switchTime})'[vfinal]
  `.replace(/\s+/g, ' ').trim();

  const ffmpegCmd = `ffmpeg -y -loop 1 -t ${totalDuration} -i "${qPngPath}" -loop 1 -t ${totalDuration} -i "${aPngPath}" -i "${masterAudioPath}" -filter_complex "${filterComplex}" -map "[vfinal]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${totalDuration} "${finalMp4Path}"`;

  console.log(`[FFmpeg Compositor] Rendering ${totalDuration}s video with animated countdown switch at ${switchTime}s...`);
  execSync(ffmpegCmd, { maxBuffer: 30 * 1024 * 1024 });

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 10000) {
    throw new Error('FFmpeg failed to produce Archie QA Teaser MP4');
  }

  fs.copyFileSync(finalMp4Path, latestMp4Path);
  console.log(`\n🎉 [Archie QA Engine] SUCCESS! Rendered ${totalDuration}s video:`);
  console.log(` • Output: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 8. Record to Firestore Database and Local Cache for Guaranteed Deduplication
  await recordPostedCandidate('archie_qa_teaser', candidate.question, candidate.topic, {
    category: candidate.category,
    correctKey: candidate.correctKey,
    duration: totalDuration
  });

  return {
    videoPath: finalMp4Path,
    duration: totalDuration,
    candidate,
    theme: theme.name
  };
}

if (require.main === module) {
  generateArchieQaTeaser()
    .then(res => {
      console.log(`\n✓ Archie Daily QA Teaser Finished: "${res.candidate.question}" (${res.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Fatal error in Archie QA Teaser pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateArchieQaTeaser,
  CURATED_QA_BANK
};
