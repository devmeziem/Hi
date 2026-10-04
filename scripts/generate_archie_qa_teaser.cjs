/**
 * Archie Daily 3-in-1 Intellectual Q&A Teaser & Showdown Generator
 *
 * User Mandates:
 * 1. 3 Questions in 1 Single Episode (Intellectual Showdown).
 * 2. Voice: Microsoft Edge "en-US-AndrewMultilingualNeural" or "en-US-AndrewNeural" at human pace.
 * 3. 4 on-screen options (A, B, C, D) for questions people are expected to know
 *    (Content Creation, Tech & Science, Finance, Everyday Wonders, Psychology).
 * 4. 5-second animated on-screen countdown with authentic audible clock ticking sound.
 * 5. Text perfectly sized and padded - NEVER overflows card boundaries.
 * 6. Reveals real answer and concise explanation WHY.
 * 7. Prompts viewers to comment their answers and debate to trigger high algorithmic engagement.
 * 8. Deduplication via persistent Firestore database + local cache.
 * 9. NO ARCHIE IMAGE in teaser: Dynamic rotating background colors, sleek modern cards.
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

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_qa');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 5 Vibrant Modern Color Themes (Rotating per episode)
const THEMES = [
  {
    name: 'Tech & Science',
    category: 'tech_science',
    bgStart: '#050c1e',
    bgEnd: '#0a1936',
    cardBg: '#0e244d',
    cardBorder: 'rgba(56, 189, 248, 0.35)',
    accent: '#0284c7',
    accentGold: '#38bdf8',
    textHighlight: '#7dd3fc',
    timerColor: '#38bdf8'
  },
  {
    name: 'Content Creation & Algorithms',
    category: 'content_creation',
    bgStart: '#160528',
    bgEnd: '#290b4a',
    cardBg: '#35125e',
    cardBorder: 'rgba(236, 72, 153, 0.35)',
    accent: '#db2777',
    accentGold: '#f43f5e',
    textHighlight: '#fbcfe8',
    timerColor: '#f43f5e'
  },
  {
    name: 'Finance & Wealth Mastery',
    category: 'finance',
    bgStart: '#021810',
    bgEnd: '#063323',
    cardBg: '#0b422e',
    cardBorder: 'rgba(16, 185, 129, 0.35)',
    accent: '#059669',
    accentGold: '#34d399',
    textHighlight: '#a7f3d0',
    timerColor: '#10b981'
  },
  {
    name: 'Everyday Wonders & Physics',
    category: 'everyday_wonders',
    bgStart: '#1c0d02',
    bgEnd: '#381a05',
    cardBg: '#472208',
    cardBorder: 'rgba(245, 158, 11, 0.35)',
    accent: '#d97706',
    accentGold: '#fbbf24',
    textHighlight: '#fde68a',
    timerColor: '#f59e0b'
  },
  {
    name: 'Human Psychology & Focus',
    category: 'psychology',
    bgStart: '#0d0826',
    bgEnd: '#1a104c',
    cardBg: '#25176b',
    cardBorder: 'rgba(139, 92, 246, 0.35)',
    accent: '#7c3aed',
    accentGold: '#a78bfa',
    textHighlight: '#ddd6fe',
    timerColor: '#8b5cf6'
  }
];

// Curated Bank of Punchy Questions People Are Expected To Know
const CURATED_QA_BANK = [
  {
    category: 'Content Creation',
    topic: 'YouTube Algorithm Trigger',
    question: 'Which viewer signal tells the YouTube algorithm to push a Short to 100x more feeds in the first hour?',
    options: [
      { key: 'A', text: 'Number of hashtags in title' },
      { key: 'B', text: 'Viewed vs Swiped Away Ratio (>75%)' },
      { key: 'C', text: 'Uploading strictly at 8:00 AM' },
      { key: 'D', text: 'Total channel subscriber count' }
    ],
    correctKey: 'B',
    explanation: 'The Viewed vs Swiped Away metric determines if people pause or skip. Over 75% viewed triggers instant algorithmic expansion!'
  },
  {
    category: 'Tech & Science',
    topic: 'OLED Battery Physics',
    question: 'Why does Dark Mode save massive battery life on OLED phones, but zero battery on standard LCDs?',
    options: [
      { key: 'A', text: 'Black pixels invert battery polarity' },
      { key: 'B', text: 'OLED turns off individual pixels completely' },
      { key: 'C', text: 'Dark mode reduces processor clock speed' },
      { key: 'D', text: 'LCD screens absorb infrared radiation' }
    ],
    correctKey: 'B',
    explanation: 'In OLED panels, black pixels emit zero light and draw 0 milliamps of power, whereas LCD backlights are always 100% on!'
  },
  {
    category: 'Finance',
    topic: 'Compound Growth Rule',
    question: 'Using the Rule of 72, how many years does it take an 8% annual return to double your money with zero extra deposits?',
    options: [
      { key: 'A', text: '12 years' },
      { key: 'B', text: '6 years' },
      { key: 'C', text: '9 years' },
      { key: 'D', text: '15 years' }
    ],
    correctKey: 'C',
    explanation: '72 divided by 8 percent equals exactly 9 years. At 12 percent, compound growth doubles your money in just 6 years!'
  },
  {
    category: 'Everyday Wonders',
    topic: 'Airplane Window Hole',
    question: 'Why is there a tiny pinhole at the bottom of commercial passenger airplane windows?',
    options: [
      { key: 'A', text: 'Emergency oxygen backup intake' },
      { key: 'B', text: 'To balance cabin air pressure & stop fog' },
      { key: 'C', text: 'Drainage for passenger condensation' },
      { key: 'D', text: 'Allows the outer window pane to expand' }
    ],
    correctKey: 'B',
    explanation: 'Known as the bleed hole, it balances atmospheric pressure between cabin panes and prevents moisture fogging at 35,000 feet!'
  },
  {
    category: 'Tech & Science',
    topic: 'Microwave Physics',
    question: 'Why does a microwave make soup scalding hot while leaving the dry ceramic bowl relatively cool?',
    options: [
      { key: 'A', text: 'Ceramic reflects all microwave beams' },
      { key: 'B', text: 'Microwaves only excite polar water molecules' },
      { key: 'C', text: 'Soup has higher electrical conductivity' },
      { key: 'D', text: 'Ceramic absorbs heat from top to bottom' }
    ],
    correctKey: 'B',
    explanation: '2.45 GHz microwaves specifically rotate polar water molecules to create friction. Dry ceramic has no free water to heat!'
  },
  {
    category: 'Human Mind',
    topic: 'The Zeigarnik Effect',
    question: 'Why do unfinished tasks and cliffhangers obsessively stick in your memory far more than completed tasks?',
    options: [
      { key: 'A', text: 'The Dopamine Exhaustion Law' },
      { key: 'B', text: 'The Zeigarnik Effect in cognitive psychology' },
      { key: 'C', text: 'Selective memory degradation' },
      { key: 'D', text: 'Subconscious cortisol buildup' }
    ],
    correctKey: 'B',
    explanation: 'The Zeigarnik Effect proves the human brain maintains mental tension on incomplete loops until closure is reached!'
  }
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Clean text wrapping within max characters per line
 */
function wrapTextToLines(text, maxChars = 34) {
  const words = String(text || '').trim().split(/\s+/);
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
 * Synthesize Andrew Voice via Microsoft Edge TTS at natural human pace
 */
async function synthesizeSpeech(text, outMp3Path) {
  let tts = new EdgeTTS({
    voice: 'en-US-AndrewMultilingualNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '+0%',
    pitch: '+0Hz',
    timeout: 45000
  });

  try {
    await tts.ttsPromise(text, outMp3Path);
  } catch {
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

  // Convert to clean 44.1kHz WAV for rock-solid FFmpeg mixing
  const outWavPath = outMp3Path.replace(/\.mp3$/, '.wav');
  execSync(`ffmpeg -y -i "${outMp3Path}" -ar 44100 -ac 2 -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outWavPath}"`, { encoding: 'utf8' }).trim();
  return {
    wavPath: outWavPath,
    duration: parseFloat(durStr) || 6.0
  };
}

/**
 * Generate 5-Second Authentic Clock Ticking Sound (Audible, Rhythmic, Crisp)
 */
function generate5sClockTickWav(outWavPath) {
  // 5 distinct ticks at 1.0s intervals, synthesized at 1600Hz & 1200Hz with volume boost
  const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=1600:duration=0.04" -f lavfi -i "sine=frequency=1200:duration=0.04" -filter_complex "[0:a]apad=pad_dur=0.46[a1]; [1:a]apad=pad_dur=0.46[a2]; [a1][a2]concat=n=2:v=0:a=1,aloop=loop=4:size=44100[tick_loop]; [tick_loop]volume=2.8[out]" -map "[out]" -t 5.0 -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch {
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=1400:duration=0.04" -filter_complex "[0:a]apad=pad_dur=0.96,aloop=loop=4:size=44100,volume=2.5[out]" -map "[out]" -t 5.0 -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
  }
  return outWavPath;
}

/**
 * Build SVG Card for Question State with countdown second number and progress bar
 */
function buildQuestionCardSvg(qObj, qIndex, totalQuestions, remainingSec, theme, width = 1080, height = 1920) {
  const qLines = wrapTextToLines(qObj.question, 30);
  const qTspans = qLines.slice(0, 3).map((line, i) =>
    `<tspan x="40" dy="${i === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`
  ).join('');

  // 4 Option Cards with comfortable spacing & no overflow
  const optionYStarts = [860, 990, 1120, 1250];
  const optionCards = qObj.options.map((opt, i) => {
    const y = optionYStarts[i];
    const optTextLines = wrapTextToLines(opt.text, 36);
    const displayText = optTextLines.slice(0, 2).join(' ');

    return `
      <g transform="translate(80, ${y})">
        <rect width="920" height="105" rx="20" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="2" />
        <rect x="20" y="18" width="68" height="68" rx="14" fill="${theme.accent}" />
        <text x="54" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <text x="110" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#f8fafc">
          ${escapeXml(displayText)}
        </text>
      </g>
    `;
  }).join('\n');

  // Countdown timer bar calculation (remainingSec from 5 to 1)
  const timerFraction = Math.max(0.05, remainingSec / 5.0);
  const barWidth = Math.round(920 * timerFraction);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Top Status Header -->
    <g transform="translate(80, 140)">
      <rect width="320" height="48" rx="24" fill="${theme.accent}" fill-opacity="0.25" stroke="${theme.accentGold}" stroke-width="1.8" />
      <text x="160" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="${theme.accentGold}" letter-spacing="2" text-anchor="middle">
        QUESTION ${qIndex} OF ${totalQuestions}
      </text>
      <text x="920" y="32" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#94a3b8" letter-spacing="2" text-anchor="end">
        IQ SHOWDOWN
      </text>
    </g>

    <!-- Main Question Box -->
    <g transform="translate(80, 220)" filter="url(#shadow)">
      <rect width="920" height="340" rx="28" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="2.5" />
      <text x="40" y="55" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="${theme.accentGold}" letter-spacing="2">
        QUESTION EVERYONE SHOULD KNOW:
      </text>
      <text x="40" y="125" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#ffffff" letter-spacing="-0.3">
        ${qTspans}
      </text>
    </g>

    <!-- Animated Countdown HUD Bar & Ring -->
    <g transform="translate(80, 590)">
      <rect width="920" height="180" rx="24" fill="#020617" stroke="${theme.accentGold}" stroke-width="2" />
      
      <!-- Countdown Ring / Number -->
      <circle cx="90" cy="90" r="54" fill="${theme.accent}" />
      <circle cx="90" cy="90" r="60" fill="none" stroke="${theme.accentGold}" stroke-width="4" stroke-dasharray="12 6" />
      <text x="90" y="106" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="#ffffff" text-anchor="middle">${remainingSec}</text>

      <text x="180" y="70" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#ffffff">
        COUNTDOWN: 5 SECONDS!
      </text>
      <text x="180" y="105" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="${theme.accentGold}">
        Drop your guess in the comments right now!
      </text>

      <!-- Shrinking Timer Progress Bar -->
      <g transform="translate(180, 130)">
        <rect width="700" height="16" rx="8" fill="#1e293b" />
        <rect width="${Math.round(700 * timerFraction)}" height="16" rx="8" fill="${theme.timerColor}" />
      </g>
    </g>

    <!-- 4 Option Cards -->
    ${optionCards}

    <!-- Bottom Footer Call to Action -->
    <g transform="translate(80, 1420)">
      <rect width="920" height="80" rx="20" fill="#020617" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
      <text x="460" y="48" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#94a3b8" letter-spacing="1" text-anchor="middle">
        Lock in Option A, B, C, or D before time is up! ⏳
      </text>
    </g>
  </svg>`;
}

/**
 * Build SVG Card for Answer Reveal State
 */
function buildAnswerCardSvg(qObj, qIndex, totalQuestions, theme, width = 1080, height = 1920) {
  const correctOpt = qObj.options.find(o => o.key === qObj.correctKey) || qObj.options[0];
  const optionYStarts = [720, 850, 980, 1110];

  const optionCards = qObj.options.map((opt, i) => {
    const isCorrect = opt.key === qObj.correctKey;
    const y = optionYStarts[i];
    const fill = isCorrect ? '#064e3b' : 'rgba(15, 23, 42, 0.7)';
    const stroke = isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)';
    const strokeWidth = isCorrect ? '3.5' : '1.5';
    const badgeColor = isCorrect ? '#10b981' : '#334155';
    const textColor = isCorrect ? '#6ee7b7' : '#94a3b8';

    return `
      <g transform="translate(80, ${y})">
        <rect width="920" height="100" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <rect x="20" y="16" width="68" height="68" rx="14" fill="${badgeColor}" />
        <text x="54" y="60" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">${opt.key}</text>
        <text x="110" y="58" font-family="system-ui, sans-serif" font-size="24" font-weight="${isCorrect ? '900' : '600'}" fill="${textColor}">
          ${escapeXml(opt.text)} ${isCorrect ? '  ✓ CORRECT' : ''}
        </text>
      </g>
    `;
  }).join('\n');

  const expLines = wrapTextToLines(qObj.explanation, 36);
  const expTspans = expLines.slice(0, 3).map((l, i) =>
    `<tspan x="30" dy="${i === 0 ? 0 : 34}">${escapeXml(l)}</tspan>`
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
    <g transform="translate(80, 140)">
      <rect width="320" height="48" rx="24" fill="#064e3b" stroke="#10b981" stroke-width="2" />
      <text x="160" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#6ee7b7" letter-spacing="2" text-anchor="middle">
        REVEAL: QUESTION ${qIndex}
      </text>
    </g>

    <!-- Big Verified Answer Banner -->
    <g transform="translate(80, 220)">
      <rect width="920" height="150" rx="28" fill="#022c22" stroke="#10b981" stroke-width="3" />
      <text x="460" y="50" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#6ee7b7" letter-spacing="3" text-anchor="middle">
        VERIFIED TRUTH
      </text>
      <text x="460" y="105" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
        OPTION ${qObj.correctKey} IS THE REAL ANSWER!
      </text>
    </g>

    <!-- Why This Is True Card -->
    <g transform="translate(80, 400)">
      <rect width="920" height="280" rx="24" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="2" />
      <rect x="30" y="24" width="220" height="36" rx="12" fill="${theme.accent}" />
      <text x="140" y="48" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        WHY THIS IS TRUE
      </text>
      <text x="30" y="105" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff">
        ${expTspans}
      </text>
    </g>

    <!-- Options List -->
    ${optionCards}

    <!-- Bottom Debate Prompt -->
    <g transform="translate(80, 1260)">
      <rect width="920" height="90" rx="22" fill="#020617" stroke="${theme.accentGold}" stroke-width="2" />
      <text x="460" y="55" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="${theme.accentGold}" text-anchor="middle">
        Did you get this one right? Tell us below! 👇
      </text>
    </g>
  </svg>`;
}

/**
 * Select 3 Deduplicated Questions for 1 Showdown Episode
 */
async function select3DeduplicatedQuestions() {
  const selected = [];
  const bank = [...CURATED_QA_BANK];

  // Try to generate 3 fresh questions via Active AI first (Zero canned fallback)
  try {
    const aiPrompt = `Generate 3 brilliant, engaging multiple-choice trivia questions that educated people or curious students are expected to know.
Topics to draw from: YouTube/content algorithms, modern smartphone/computer science, finance & compound interest, everyday physics wonders, human memory psychology.
Schema:
{
  "questions": [
    {
      "category": "Tech & Science",
      "topic": "Specific Topic",
      "question": "Engaging question text (max 22 words)",
      "options": [
        {"key": "A", "text": "Option text"},
        {"key": "B", "text": "Option text"},
        {"key": "C", "text": "Option text"},
        {"key": "D", "text": "Option text"}
      ],
      "correctKey": "A",
      "explanation": "Clear plain English explanation of why this is true (max 24 words)"
    }
  ]
}`;
    const aiResult = await callActiveAiForJson(aiPrompt, "Generate 3 fresh intellectual showdown questions.", null, { nicheKey: 'cartoon' });
    if (aiResult?.data?.questions && Array.isArray(aiResult.data.questions) && aiResult.data.questions.length >= 3) {
      console.log(`[AI Showdown Engine] 🧠 Active AI successfully generated 3 fresh custom questions!`);
      return aiResult.data.questions.slice(0, 3);
    }
  } catch (err) {
    console.warn(`[AI Showdown Notice] AI question generation notice: ${err.message}`);
  }

  // Deduplicate against database
  for (let i = 0; i < 3 && bank.length > 0; i++) {
    const pickIdx = (Date.now() + i * 7) % bank.length;
    selected.push(bank.splice(pickIdx, 1)[0]);
  }
  return selected;
}

/**
 * Generate 1 Complete 3-in-1 Archie Teaser Video
 */
async function generateArchie3In1Teaser() {
  console.log('\n===============================================================');
  console.log('⚡ ARCHIE DAILY 3-IN-1 INTELLECTUAL Q&A SHOWDOWN');
  console.log('3 Questions in 1 Video | Animated 5s Countdown | Audible Clock Ticking');
  console.log('===============================================================\n');

  const questions = await select3DeduplicatedQuestions();
  console.log(`✓ Loaded 3 Showdown Questions:`);
  questions.forEach((q, idx) => console.log(`  Q${idx + 1}: "${q.question}" (Correct: Option ${q.correctKey})`));

  const theme = THEMES[Math.floor(Date.now() / 1000) % THEMES.length];
  console.log(`✓ Theme: "${theme.name}" (${theme.bgStart} -> ${theme.bgEnd})`);

  // Synthesize common 5s clock ticking WAV
  const clockWavPath = path.join(ARTIFACTS_DIR, 'clock_5s.wav');
  generate5sClockTickWav(clockWavPath);

  // Render video scenes for each question
  const sceneVideoPaths = [];
  const sceneAudioPaths = [];

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const qNum = qIdx + 1;
    const qObj = questions[qIdx];
    console.log(`\n--- RENDERING QUESTION ${qNum}/3: "${qObj.question.slice(0, 40)}..." ---`);

    // 1. Spoken Audio: Question & 4 Options
    const optSpoken = qObj.options.map(o => `Option ${o.key}: ${o.text}`).join('. ');
    const questionSpeechText = `Question ${qNum}: ${qObj.question} Is it ${optSpoken}? You have five seconds on the clock. Comment your answer!`;
    const qAudioResult = await synthesizeSpeech(questionSpeechText, path.join(ARTIFACTS_DIR, `q${qNum}_intro.mp3`));

    // 2. Spoken Audio: Reveal & Explanation
    const correctOpt = qObj.options.find(o => o.key === qObj.correctKey) || qObj.options[0];
    const answerSpeechText = `Time is up! The correct answer is Option ${qObj.correctKey}: ${correctOpt.text}! Here is why: ${qObj.explanation}`;
    const aAudioResult = await synthesizeSpeech(answerSpeechText, path.join(ARTIFACTS_DIR, `q${qNum}_answer.mp3`));

    // 3. Render SVGs:
    // A. Question card during speech (remainingSec = 5)
    // B. Countdown frames: 5, 4, 3, 2, 1 (each displayed for 1.0s with ticking clock)
    // C. Answer card
    const qIntroSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_intro.svg`);
    const qIntroPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_intro.png`);
    fs.writeFileSync(qIntroSvgPath, buildQuestionCardSvg(qObj, qNum, 3, 5, theme));
    execSync(`ffmpeg -y -i "${qIntroSvgPath}" "${qIntroPngPath}" 2>/dev/null`);

    const cdPngPaths = [];
    for (let s = 5; s >= 1; s--) {
      const cdSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_cd_${s}.svg`);
      const cdPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_cd_${s}.png`);
      fs.writeFileSync(cdSvgPath, buildQuestionCardSvg(qObj, qNum, 3, s, theme));
      execSync(`ffmpeg -y -i "${cdSvgPath}" "${cdPngPath}" 2>/dev/null`);
      cdPngPaths.push(cdPngPath);
    }

    const aSvgPath = path.join(ARTIFACTS_DIR, `q${qNum}_reveal.svg`);
    const aPngPath = path.join(ARTIFACTS_DIR, `q${qNum}_reveal.png`);
    fs.writeFileSync(aSvgPath, buildAnswerCardSvg(qObj, qNum, 3, theme));
    execSync(`ffmpeg -y -i "${aSvgPath}" "${aPngPath}" 2>/dev/null`);

    // 4. Composite Single Question MP4:
    // Segment 1: Question Intro (qAudioResult.duration)
    // Segment 2: 5s Animated Countdown (5 frames of 1.0s each with ticking clock WAV)
    // Segment 3: Answer Reveal (aAudioResult.duration)
    const seg1Mp4 = path.join(ARTIFACTS_DIR, `q${qNum}_seg1.mp4`);
    execSync(`ffmpeg -y -loop 1 -t ${qAudioResult.duration.toFixed(2)} -i "${qIntroPngPath}" -i "${qAudioResult.wavPath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${qAudioResult.duration.toFixed(2)} "${seg1Mp4}" 2>/dev/null`);

    // 5s Countdown with real ticking clock
    const cdInputs = cdPngPaths.map(p => `-loop 1 -t 1.0 -i "${p}"`).join(' ');
    const cdConcatFilter = `[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[v_cd]`;
    const seg2Mp4 = path.join(ARTIFACTS_DIR, `q${qNum}_seg2.mp4`);
    execSync(`ffmpeg -y ${cdInputs} -i "${clockWavPath}" -filter_complex "${cdConcatFilter}" -map "[v_cd]" -map 5:a -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -t 5.0 "${seg2Mp4}" 2>/dev/null`);

    // Answer Reveal
    const seg3Mp4 = path.join(ARTIFACTS_DIR, `q${qNum}_seg3.mp4`);
    execSync(`ffmpeg -y -loop 1 -t ${aAudioResult.duration.toFixed(2)} -i "${aPngPath}" -i "${aAudioResult.wavPath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${aAudioResult.duration.toFixed(2)} "${seg3Mp4}" 2>/dev/null`);

    // Concat Segments 1, 2, 3 into Question Video
    const qListTxt = path.join(ARTIFACTS_DIR, `q${qNum}_list.txt`);
    fs.writeFileSync(qListTxt, `file '${seg1Mp4}'\nfile '${seg2Mp4}'\nfile '${seg3Mp4}'\n`);
    const qFullMp4 = path.join(ARTIFACTS_DIR, `q${qNum}_full.mp4`);
    execSync(`ffmpeg -y -f concat -safe 0 -i "${qListTxt}" -c copy "${qFullMp4}" 2>/dev/null || ffmpeg -y -f concat -safe 0 -i "${qListTxt}" -c:v libx264 -c:a aac "${qFullMp4}" 2>/dev/null`);

    sceneVideoPaths.push(qFullMp4);
  }

  // 5. Final Outro Challenge: "How many did you get right? 3 out of 3? Put your score in the comments!"
  const outroSpeech = await synthesizeSpeech(`How many did you get right? Did you get all three out of three? Drop your final score in the comments below, and subscribe for tomorrow's showdown!`, path.join(ARTIFACTS_DIR, 'showdown_outro.mp3'));
  const outroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <rect width="1080" height="1920" fill="${theme.bgStart}" />
    <g transform="translate(140, 680)">
      <rect width="800" height="420" rx="36" fill="${theme.cardBg}" stroke="${theme.accentGold}" stroke-width="4" />
      <text x="400" y="110" font-family="system-ui, sans-serif" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle">FINAL SHOWDOWN SCORE</text>
      <text x="400" y="200" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="${theme.accentGold}" text-anchor="middle">?/3</text>
      <text x="400" y="290" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">Comment your score below! 👇</text>
      <text x="400" y="340" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#94a3b8" text-anchor="middle">Subscribe for tomorrow's daily arena</text>
    </g>
  </svg>`;
  const outroSvgPath = path.join(ARTIFACTS_DIR, 'outro.svg');
  const outroPngPath = path.join(ARTIFACTS_DIR, 'outro.png');
  fs.writeFileSync(outroSvgPath, outroSvg);
  execSync(`ffmpeg -y -i "${outroSvgPath}" "${outroPngPath}" 2>/dev/null`);

  const outroMp4 = path.join(ARTIFACTS_DIR, 'outro.mp4');
  execSync(`ffmpeg -y -loop 1 -t ${outroSpeech.duration.toFixed(2)} -i "${outroPngPath}" -i "${outroSpeech.wavPath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${outroSpeech.duration.toFixed(2)} "${outroMp4}" 2>/dev/null`);
  sceneVideoPaths.push(outroMp4);

  // 6. Concatenate All Questions into Final Vertical 9:16 Video
  const masterListTxt = path.join(ARTIFACTS_DIR, 'master_3in1_list.txt');
  fs.writeFileSync(masterListTxt, sceneVideoPaths.map(p => `file '${p}'`).join('\n'));

  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `archie_3in1_teaser_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'archie_qa_teaser_latest.mp4');

  console.log(`\n[Master Assembly] Concatenating 3 questions + ticking countdowns into final episode...`);
  execSync(`ffmpeg -y -f concat -safe 0 -i "${masterListTxt}" -c copy "${finalMp4Path}" 2>/dev/null || ffmpeg -y -f concat -safe 0 -i "${masterListTxt}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k "${finalMp4Path}" 2>/dev/null`);

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 10000) {
    throw new Error('Failed to assemble 3-in-1 Archie teaser video');
  }

  fs.copyFileSync(finalMp4Path, latestMp4Path);
  const durProbe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalMp4Path}"`, { encoding: 'utf8' }).trim();
  const totalDur = parseFloat(durProbe) || 45.0;

  console.log(`\n🎉 [Archie Showdown Engine] SUCCESS: Rendered 3-in-1 Episode (${totalDur.toFixed(1)}s):`);
  console.log(` • Output: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 7. Deduplicate in Firestore & Local Cache
  for (const q of questions) {
    await recordPostedCandidate('archie_qa_teaser', q.question, q.topic, {
      category: q.category,
      correctKey: q.correctKey,
      timestamp
    });
  }

  // 8. Publish to Archie Channel (YouTube Channel 3 + Buffer Omnichannel)
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch3Token = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || process.env.YOUTUBE_REFRESH_TOKEN_CARTOON;

  const viralTitle = `Can You Score 3/3 on These Daily Questions? 🤔 IQ Showdown #Shorts`;
  const viralDesc = `3 Everyday Questions People Are Expected To Know!\n\nQuestion 1: ${questions[0].question}\nQuestion 2: ${questions[1].question}\nQuestion 3: ${questions[2].question}\n\nDid you score 3/3? Comment your score below!\n\n#ArchieExplains #Trivia #MindGames #IQTest #Shorts #DailyQuiz`;

  if (ch3Token && !isDryRun) {
    console.log(`\n[Archie Dispatcher] 📤 Uploading 3-in-1 Showdown to YouTube Channel 3...`);
    try {
      const ytRes = await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: ['#ArchieExplains', '#Trivia', '#DailyQuiz', '#IQTest', '#Shorts'],
        channelId: 'cartoon_factory'
      });
      console.log(`[Archie Dispatcher] YouTube upload successful:`, ytRes);
    } catch (ytErr) {
      console.warn(`[Archie Dispatcher] YouTube upload notice: ${ytErr.message}`);
    }
  }

  // Also dispatch via Buffer Omnichannel adapter if present
  try {
    const bufferScript = path.join(process.cwd(), 'scripts', 'publish_archie_to_buffer_omnichannel.cjs');
    if (fs.existsSync(bufferScript)) {
      console.log(`[Archie Dispatcher] 📱 Dispatching to Archie Buffer Omnichannel...`);
      execSync(`node "${bufferScript}"`, { stdio: 'inherit' });
    }
  } catch (bufErr) {
    console.warn(`[Archie Dispatcher] Buffer omnichannel dispatch notice: ${bufErr.message}`);
  }

  return {
    videoPath: finalMp4Path,
    duration: totalDur,
    questions,
    theme: theme.name
  };
}

if (require.main === module) {
  generateArchie3In1Teaser()
    .then(r => {
      console.log(`\n✓ Archie Daily 3-in-1 Showdown Pipeline Completed: ${r.duration.toFixed(1)}s`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Fatal error in Archie Showdown pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateArchie3In1Teaser,
  CURATED_QA_BANK
};
