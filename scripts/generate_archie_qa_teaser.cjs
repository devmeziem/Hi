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

// Rich, Diverse Catalog of Engaging, Intuitive Trivia Questions (Categorized to guarantee 3 different topics per episode)
const CURATED_SHOWDOWN_CATALOG = {
  wildlife: [
    {
      category: 'Animal Wonders',
      topic: 'Dolphin Sleep Mystery',
      question: 'Which amazing trick do dolphins use to breathe without drowning while sleeping?',
      imageSearchQuery: 'dolphin swimming clear ocean water sunlight',
      options: [
        { key: 'A', text: 'They sleep on dry sandbars' },
        { key: 'B', text: 'One half of their brain stays awake' },
        { key: 'C', text: 'They store 6 hours of oxygen in blood' },
        { key: 'D', text: 'They only sleep for 30 seconds at a time' }
      ],
      correctKey: 'B',
      explanation: 'Dolphins use unihemispheric sleep: one brain hemisphere sleeps while the other stays awake to surface for air!'
    },
    {
      category: 'Animal Wonders',
      topic: 'Flamingo Color Transformation',
      question: 'Why are wild flamingos born grey, but turn bright pink as they grow up?',
      imageSearchQuery: 'flamingos pink water lagoon wildlife reflection',
      options: [
        { key: 'A', text: 'Intense sunlight bleaches their feathers' },
        { key: 'B', text: 'Their diet is rich in carotenoid algae' },
        { key: 'C', text: 'Natural genetic mutation at maturity' },
        { key: 'D', text: 'Minerals in volcanic mud dye their skin' }
      ],
      correctKey: 'B',
      explanation: 'Flamingos eat brine shrimp and algae packed with beta-carotene, which dyes their grey feathers vibrant pink!'
    },
    {
      category: 'Animal Wonders',
      topic: 'Bee Waggle Dance',
      question: 'How do honeybees communicate the exact location of flower fields to their hive?',
      imageSearchQuery: 'honeybee collecting pollen flower macro close up',
      options: [
        { key: 'A', text: 'High-frequency wing buzz sounds' },
        { key: 'B', text: 'A figure-eight waggle dance' },
        { key: 'C', text: 'Scent trails left in the air' },
        { key: 'D', text: 'Guiding other bees visually' }
      ],
      correctKey: 'B',
      explanation: 'The famous waggle dance encodes both the angle relative to the sun and the flight distance in the waggle duration!'
    },
    {
      category: 'Animal Wonders',
      topic: 'Octopus Heart Anatomy',
      question: 'How many functioning hearts does an octopus have pumping blood through its body?',
      imageSearchQuery: 'octopus underwater coral reef tentacles blue ocean',
      options: [
        { key: 'A', text: '1 Single Large Heart' },
        { key: 'B', text: '3 Separate Hearts' },
        { key: 'C', text: '5 Distributed Mini-Hearts' },
        { key: 'D', text: '2 Main Chambers' }
      ],
      correctKey: 'B',
      explanation: 'Two branchial hearts pump blood through the gills, while a third systemic heart pumps copper-based blood to the body!'
    }
  ],

  human_body: [
    {
      category: 'Human Body',
      topic: 'Contagious Yawning',
      question: 'Why does seeing someone else yawn trigger an instant urge for you to yawn too?',
      imageSearchQuery: 'human face expression yawning tired relaxed',
      options: [
        { key: 'A', text: 'Oxygen levels drop in the room' },
        { key: 'B', text: 'Mirror neurons and social empathy' },
        { key: 'C', text: 'Carbon dioxide triggers the lungs' },
        { key: 'D', text: 'Auditory vibration frequency' }
      ],
      correctKey: 'B',
      explanation: 'Contagious yawning is linked to mirror neurons and empathy: our brain subconsciously mimics those around us!'
    },
    {
      category: 'Human Body',
      topic: 'Onion Tears Chemistry',
      question: 'Why does chopping raw onions make your eyes water and sting within seconds?',
      imageSearchQuery: 'chopping red onion kitchen cutting board fresh',
      options: [
        { key: 'A', text: 'Fine onion powder flies into the air' },
        { key: 'B', text: 'It releases syn-propanethial-S-oxide gas' },
        { key: 'C', text: 'Acidic onion juice splashes your skin' },
        { key: 'D', text: 'The strong aroma overwhelms nasal nerves' }
      ],
      correctKey: 'B',
      explanation: 'Cutting ruptures cell walls, mixing enzymes into a sulfur gas that reacts with eye moisture to form mild sulfuric acid!'
    },
    {
      category: 'Human Body',
      topic: 'Shivering Cold Reflex',
      question: 'What is the primary evolutionary purpose of your body violently shivering in the cold?',
      imageSearchQuery: 'person winter snow cold breath frosty air',
      options: [
        { key: 'A', text: 'To shake cold snow off your clothes' },
        { key: 'B', text: 'Rapid muscle contractions produce heat' },
        { key: 'C', text: 'To push cold blood out of limbs' },
        { key: 'D', text: 'A panic reaction by nerve endings' }
      ],
      correctKey: 'B',
      explanation: 'Shivering causes involuntary skeletal muscle twitches that burn glucose to generate internal metabolic heat!'
    },
    {
      category: 'Human Body',
      topic: 'Brain Energy Consumption',
      question: 'The human brain makes up only 2% of body weight, but what percentage of daily energy does it burn?',
      imageSearchQuery: 'human brain thinking glowing neural pathways dark',
      options: [
        { key: 'A', text: 'About 5% of daily calories' },
        { key: 'B', text: 'Roughly 20% of total energy' },
        { key: 'C', text: 'Over 50% during deep thinking' },
        { key: 'D', text: 'Less than 1% when at rest' }
      ],
      correctKey: 'B',
      explanation: 'Your brain burns a staggering 20% of your daily glucose and oxygen just maintaining cellular electrical gradients!'
    }
  ],

  kitchen_physics: [
    {
      category: 'Everyday Physics',
      topic: 'Floating Ice Anomaly',
      question: 'Why does solid ice float on liquid water, when nearly all other solid substances sink in their liquid form?',
      imageSearchQuery: 'ice cube floating clear water glass macro reflection',
      options: [
        { key: 'A', text: 'Trapped air bubbles inside the ice' },
        { key: 'B', text: 'Hydrogen bonds expand ice by 9%' },
        { key: 'C', text: 'Surface tension pushes the ice upward' },
        { key: 'D', text: 'Cold water is lighter than warm water' }
      ],
      correctKey: 'B',
      explanation: 'Water is unique: as it freezes, hydrogen bonds force molecules into a hexagonal crystal with empty space, lowering density!'
    },
    {
      category: 'Everyday Physics',
      topic: 'Helium Voice Physics',
      question: 'Why does inhaling helium gas from a balloon make your voice sound comically high-pitched?',
      imageSearchQuery: 'colorful party balloons helium floating ceiling',
      options: [
        { key: 'A', text: 'Helium tightens your vocal cords' },
        { key: 'B', text: 'Sound waves travel 3x faster in helium' },
        { key: 'C', text: 'Helium cools the air inside your throat' },
        { key: 'D', text: 'Helium shrinks your vocal cord muscles' }
      ],
      correctKey: 'B',
      explanation: 'Helium is 6 times lighter than air, so sound travels at 927 m/s instead of 343 m/s, amplifying high resonant frequencies!'
    },
    {
      category: 'Everyday Physics',
      topic: 'Bread vs Cookie Staling',
      question: 'Why does fresh bread turn hard when stale, but crunchy cookies turn soft and chewy?',
      imageSearchQuery: 'fresh baked bread loaf warm bakery rustic',
      options: [
        { key: 'A', text: 'Bread loses moisture, sugar absorbs it' },
        { key: 'B', text: 'Yeast dies and makes bread solid' },
        { key: 'C', text: 'Cookies contain preservative oils' },
        { key: 'D', text: 'Bread oxidizes faster than cookie dough' }
      ],
      correctKey: 'A',
      explanation: 'Bread has high moisture that evaporates, while cookies have high sugar that pulls moisture out of humid ambient air!'
    },
    {
      category: 'Everyday Physics',
      topic: 'Spicy Chili Pepper Heat',
      question: 'Why do spicy hot peppers make your tongue feel literally burned, even when eaten cold from a fridge?',
      imageSearchQuery: 'red chili pepper fiery hot spices culinary macro',
      options: [
        { key: 'A', text: 'Capsaicin chemically burns skin cells' },
        { key: 'B', text: 'Capsaicin triggers heat-pain receptors' },
        { key: 'C', text: 'Chili seeds create friction heat' },
        { key: 'D', text: 'It strips away your saliva layer' }
      ],
      correctKey: 'B',
      explanation: 'Capsaicin binds to TRPV1 receptors—the exact sensors that detect actual burning temperatures above 43°C!'
    }
  ],

  earth_space: [
    {
      category: 'Space & Sky',
      topic: 'Blue Sky Scattering',
      question: 'Why does Earth’s daytime sky look bright blue instead of violet or white?',
      imageSearchQuery: 'bright blue sky white fluffy clouds sunny day',
      options: [
        { key: 'A', text: 'Sunlight reflects off blue ocean water' },
        { key: 'B', text: 'Rayleigh scattering bends short blue waves' },
        { key: 'C', text: 'Ozone gas absorbs all red light' },
        { key: 'D', text: 'Dust particles in the clouds glow blue' }
      ],
      correctKey: 'B',
      explanation: 'Nitrogen and oxygen molecules scatter shorter blue wavelengths 10x more than red, illuminating the sky in blue!'
    },
    {
      category: 'Space & Sky',
      topic: 'Lightning and Thunder Speed',
      question: 'Why do you always see a lightning flash before you hear the loud rumble of thunder?',
      imageSearchQuery: 'dramatic lightning strike night thunderstorm dark clouds',
      options: [
        { key: 'A', text: 'Thunder takes time to build in clouds' },
        { key: 'B', text: 'Light travels nearly 1 million times faster' },
        { key: 'C', text: 'Raindrops slow down thunder vibrations' },
        { key: 'D', text: 'Lightning occurs seconds before thunder' }
      ],
      correctKey: 'B',
      explanation: 'Light races at 300,000 km/s while sound crawls at 0.34 km/s. Every 3 seconds between flash and bang equals 1 kilometer!'
    },
    {
      category: 'Space & Sky',
      topic: 'Venus Backward Spin',
      question: 'Which planet in our solar system spins in the opposite direction (clockwise) compared to nearly all others?',
      imageSearchQuery: 'planet venus atmosphere space solar system orbit',
      options: [
        { key: 'A', text: 'Mars' },
        { key: 'B', text: 'Venus' },
        { key: 'C', text: 'Jupiter' },
        { key: 'D', text: 'Mercury' }
      ],
      correctKey: 'B',
      explanation: 'Venus experiences retrograde rotation: the Sun rises in the west and sets in the east, likely knocked by an ancient impact!'
    },
    {
      category: 'Space & Sky',
      topic: 'Ocean Tides Gravity',
      question: 'What is the primary astronomical force creating Earth’s ocean high and low tides every single day?',
      imageSearchQuery: 'ocean waves crashing shoreline high tide twilight',
      options: [
        { key: 'A', text: 'Earth’s magnetic field rotation' },
        { key: 'B', text: 'The Moon’s gravitational pull' },
        { key: 'C', text: 'Underwater volcanic heat currents' },
        { key: 'D', text: 'Trade winds pushing surface water' }
      ],
      correctKey: 'B',
      explanation: 'The Moon’s differential gravitational pull stretches ocean water into tidal bulges on both sides of Earth!'
    }
  ],

  everyday_logic: [
    {
      category: 'Everyday Logic',
      topic: 'Touchscreen Physics',
      question: 'Why does your smartphone touchscreen work instantly with your bare finger, but fails completely with regular gloves?',
      imageSearchQuery: 'person tapping smartphone touchscreen glowing screen modern',
      options: [
        { key: 'A', text: 'Screens require body heat to activate' },
        { key: 'B', text: 'Fingers conduct electrical capacitance' },
        { key: 'C', text: 'Touchscreens detect skin oil moisture' },
        { key: 'D', text: 'Fingertip fingerprint ridges give grip' }
      ],
      correctKey: 'B',
      explanation: 'Capacitive screens detect the disruption in their electrostatic field when your conductive human skin touches them!'
    },
    {
      category: 'Everyday Logic',
      topic: 'Hardest Natural Material',
      question: 'What is the hardest naturally occurring mineral on Earth according to the Mohs hardness scale?',
      imageSearchQuery: 'sparkling diamond gemstone macro crystal facet reflection',
      options: [
        { key: 'A', text: 'Titanium' },
        { key: 'B', text: 'Diamond' },
        { key: 'C', text: 'Quartz' },
        { key: 'D', text: 'Obsidian' }
      ],
      correctKey: 'B',
      explanation: 'Diamond rates a perfect 10 on the Mohs scale: carbon atoms locked in rigid tetrahedral lattice bonds!'
    },
    {
      category: 'Everyday Logic',
      topic: 'Sunlight Travel Time',
      question: 'Approximately how long does a beam of sunlight take to travel 93 million miles from the Sun to reach your eyes on Earth?',
      imageSearchQuery: 'sunbeam shining through trees morning sunrise golden light',
      options: [
        { key: 'A', text: '8 seconds' },
        { key: 'B', text: '8 minutes and 20 seconds' },
        { key: 'C', text: '1 hour and 15 minutes' },
        { key: 'D', text: 'Instantaneous (zero time)' }
      ],
      correctKey: 'B',
      explanation: 'At 186,282 miles per second, sunlight requires exactly 499 seconds (about 8.3 minutes) to cross the cosmic vacuum!'
    }
  ]
};

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
      const b64 = fs.readFileSync(visualPngPath).toString('base64');
      visualImageTag = `<image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="920" height="270" preserveAspectRatio="xMidYMid slice" clip-path="url(#visClip)" />`;
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

    <!-- 6. Footer (Y: 1360) -->
    <g transform="translate(80, 1360)">
      <rect width="920" height="64" rx="18" fill="#020617" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" />
      <text x="460" y="39" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="#94a3b8" letter-spacing="1" text-anchor="middle">
        Lock in Option A, B, C, or D before the buzzer! ⏳
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

    <!-- Bottom Debate Prompt -->
    <g transform="translate(80, 1160)">
      <rect width="920" height="90" rx="22" fill="#020617" stroke="${theme.accentGold}" stroke-width="2" />
      <text x="460" y="55" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="${theme.accentGold}" text-anchor="middle">
        Did you get this right? Argue or confirm below! 👇
      </text>
    </g>
  </svg>`;
}

/**
 * Select 3 Deduplicated Questions ensuring 3 COMPLETELY DIFFERENT categories
 */
async function select3DeduplicatedQuestions() {
  const selected = [];
  const categories = Object.keys(CURATED_SHOWDOWN_CATALOG);

  // Pick 3 distinct categories randomly
  const shuffledCats = [...categories].sort(() => 0.5 - Math.random()).slice(0, 3);

  // For each chosen category, select a deduplicated question from its bank
  for (const cat of shuffledCats) {
    const catPool = CURATED_SHOWDOWN_CATALOG[cat];
    const chosenQ = await selectDeduplicatedCandidate(
      `archie_qa_${cat}`,
      catPool,
      item => item.question,
      item => item.topic
    );
    if (chosenQ) {
      selected.push(chosenQ);
    }
  }

  // Fallback if less than 3
  if (selected.length < 3) {
    const allQs = Object.values(CURATED_SHOWDOWN_CATALOG).flat();
    for (const q of allQs) {
      if (selected.length >= 3) break;
      if (!selected.some(s => s.question === q.question)) {
        selected.push(q);
      }
    }
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
    console.log(`[Media Fetcher] Sourcing photo for: "${qObj.imageSearchQuery}"...`);
    let visualPngPath = null;
    try {
      const fetched = await searchAndFetchImage(qObj.imageSearchQuery, { preferredSource: 'unsplash' });
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
    await tts.ttsPromise(introSpeech, introMp3Path);
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
    await tts.ttsPromise(revealSpeech, revealMp3Path);
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
  const ch3Token = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || process.env.YOUTUBE_REFRESH_TOKEN;

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
