#!/usr/bin/env node

/**
 * Cinema Vanguard — Financial Story Documentary Engine (Channel 4)
 *
 * User Mandates:
 * 1. Financial Documentary that is STRICTLY A STORY:
 *    Epic real-life financial crashes, audacious rogue traders, historic bubbles,
 *    Wall Street showdowns, currency battles, and high-stakes financial dramas told as gripping narrative sagas.
 * 2. Narrative Arc:
 *    The Setup -> The Astronomical Rise -> The Turning Point -> The Fatal Collapse -> The Timeless Moral.
 * 3. Voiceover & Audio:
 *    Deep, authoritative documentary narration (EdgeTTS Andrew, -6% rate, -20Hz pitch),
 *    tense financial thriller OST (deep cello, pulse rhythm, dramatic orchestral rise),
 *    and subtle mechanical ticker tape / clock sound effects.
 * 4. Visuals & Motion:
 *    Historical stock floor footage, bank vaults, vintage ledger manuscripts, currency stacks,
 *    and newspaper scans with Ken Burns dynamic pan/zoom and vignette.
 * 5. Subtitles: Word-synced ASS karaoke captions with translucent dark drop-box.
 * 6. Outro: Dark glowing gold aesthetic with CTA "FOLLOW FOR MORE • FINANCIAL STORIES".
 * 7. Publishing: Uploads daily to YouTube Channel 4 (Cinema Vanguard / movie_brand).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { EdgeTTS } = require('node-edge-tts');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const { callActiveAiForJson, queryDuckDuckGo } = require('./topic_discovery_engine.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'financial_story_doc');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 12 Gripping Financial Narrative Stories (Epic Rises, Audacious Heists & Cataclysmic Crashes)
const FINANCIAL_STORY_CATALOG = [
  {
    id: 'south_sea_bubble_newton',
    title: 'How Isaac Newton Lost a Fortune',
    era: '1720 • The South Sea Bubble',
    archiveQuery: 'london south sea bubble 1720 vintage stock certificate royal exchange',
    bgmQuery: 'dark historical financial thriller cello strings slow pulse',
    sfxType: 'ticker',
    scenes: [
      { text: "In 1720, the smartest man on Earth put his life savings into a single British stock.", query: "isaac newton portrait vintage oil painting candle dark" },
      { text: "The South Sea Company promised endless gold from South American slave trade routes.", query: "vintage sailing ship 1700s ocean royal navy london harbor" },
      { text: "Within months, the stock soared eight-fold as lords and peasants pawned their homes.", query: "1700s royal exchange crowd chaotic stock market london" },
      { text: "Newton sold for a huge profit—then greed dragged him back in right at the absolute peak.", query: "vintage gold coins ledger quill pen desk candlelight" },
      { text: "When the bubble burst, Newton lost twenty thousand pounds, admitting: I can calculate the motion of stars, but not the madness of men.", query: "burning stock certificate vintage embers dark desk ashes" }
    ],
    hashtags: ['#FinancialStory', '#IsaacNewton', '#WallStreetHistory', '#Documentary', '#Shorts']
  },
  {
    id: 'soros_broke_bank_of_england',
    title: 'The Man Who Broke the Bank of England',
    era: '1992 • Black Wednesday',
    archiveQuery: 'bank of england london 1992 city trading floor vintage currency',
    bgmQuery: 'tense financial suspense thriller pulse strings piano',
    sfxType: 'clock',
    scenes: [
      { text: "On September 16, 1992, one man went to war against the British Empire central bank.", query: "bank of england exterior historic stone pillars london" },
      { text: "George Soros realized the British pound was artificially propped up by political pride.", query: "vintage 1990s trading floor trader screaming telephone" },
      { text: "He borrowed ten billion dollars in sterling and sold it relentlessly through the night.", query: "british pound sterling banknotes vintage cash money stacks" },
      { text: "The Bank of England spent billions in foreign reserves trying to buy their own currency back.", query: "panicked trader hands on head trading desk monitors 1990s" },
      { text: "By 7 PM, Britain surrendered, devalued the pound, and Soros walked away with one billion dollars in a single day.", query: "london skyline sunset big ben gloomy clouds dramatic" }
    ],
    hashtags: ['#GeorgeSoros', '#BlackWednesday', '#FinanceDocumentary', '#WallStreet', '#Shorts']
  },
  {
    id: 'tulip_mania_amsterdam',
    title: 'When a Flower Cost a Mansion',
    era: '1637 • The Dutch Tulip Mania',
    archiveQuery: 'dutch golden age amsterdam canal historic merchant house tulips',
    bgmQuery: 'dutch golden age historical melancholic classical strings',
    sfxType: 'ticker',
    scenes: [
      { text: "In seventeenth-century Amsterdam, the wealthiest city on Earth lost its collective mind.", query: "vintage red and white striped tulip flower dark moody" },
      { text: "A rare virus created feathered petals on tulip bulbs called the Semper Augustus.", query: "single rare tulip flower macro dark black background" },
      { text: "At its peak, a single bulb traded for twelve acres of land, four fat oxen, and a thousand pounds of cheese.", query: "dutch merchant counting gold coins dark wood table amsterdam" },
      { text: "Futures contracts were drawn on napkins in taverns as sailors traded lifetimes of wages.", query: "vintage tavern candle light ledger parchment tavern amsterdam" },
      { text: "Then, at a routine auction in Haarlem, no buyer raised their hand. In three days, the entire Dutch economy collapsed.", query: "withered dead flower petals falling dark desk gloomy" }
    ],
    hashtags: ['#TulipMania', '#FinancialHistory', '#EconomicCrash', '#Documentary', '#Shorts']
  },
  {
    id: 'nick_leeson_barings_bank',
    title: 'The 28-Year-Old Who Sunk a 200-Year Bank',
    era: '1995 • The Fall of Barings',
    archiveQuery: 'singapore trading desk 1995 simex floor barings bank vintage',
    bgmQuery: 'dark heart racing financial thriller synth bass strings',
    sfxType: 'heartbeat',
    scenes: [
      { text: "Barings Bank funded the Napoleonic Wars and held the personal bank accounts of the Queen.", query: "historic barings bank london vintage facade crest stone" },
      { text: "In 1992, they sent a twenty-five-year-old plasterer son named Nick Leeson to run Singapore.", query: "young trader jacket jacket trading floor shouting 1990s" },
      { text: "When his rookie traders made mistakes, Leeson hid the losses inside an obscure error account: 88888.", query: "computer terminal 1990s green text glowing dark desk" },
      { text: "To recoup the debt, he doubled down on the Tokyo stock market—just before the massive Kobe earthquake struck.", query: "tokyo stock exchange crash red numbers falling monitors" },
      { text: "A two-hundred-and-thirty-three-year-old empire collapsed for one pound, ruined by one man who couldn't admit he lost.", query: "empty bank vault open heavy iron door shadows" }
    ],
    hashtags: ['#NickLeeson', '#BaringsBank', '#RogueTrader', '#FinancialThriller', '#Shorts']
  },
  {
    id: 'black_monday_1987',
    title: 'Black Monday: When Code Crashed Wall Street',
    era: '1987 • The 22.6% Single-Day Plunge',
    archiveQuery: 'wall street 1987 stock crash trading floor chaos ticker tape',
    bgmQuery: 'dark fast financial pulse clock ticking dramatic cello',
    sfxType: 'ticker',
    scenes: [
      { text: "On the morning of October 19, 1987, Wall Street walked into the worst single-day crash in history.", query: "new york stock exchange floor 1987 crowds paper on floor" },
      { text: "New automated computer algorithms had been programmed to protect institutions by selling when prices dipped.", query: "vintage ibm mainframe computer server room blinking lights 1980s" },
      { text: "Instead of hedging, the algorithms triggered an inescapable cascade, selling into each other at lightspeed.", query: "ticker tape pouring onto wall street floor panic 1987" },
      { text: "By 4 PM, five hundred billion dollars vanished into thin air—the Dow plunged twenty-two point six percent in one afternoon.", query: "panicked wall street broker holding head tie loose 1987" },
      { text: "Human panic had met machine precision for the first time, proving market gravity always wins.", query: "wall street bronze bull shadow gloomy sunset rain" }
    ],
    hashtags: ['#BlackMonday', '#WallStreet1987', '#StockMarketCrash', '#Documentary', '#Shorts']
  },
  {
    id: 'enron_mirage_scandal',
    title: 'The Enron Mirage: Anatomy of a Corporate Lie',
    era: '2001 • The Houston Energy Empire',
    archiveQuery: 'enron corporate headquarters houston texas skyscraper tilted e logo',
    bgmQuery: 'chilling corporate suspense ambient pulse dark strings',
    sfxType: 'paper',
    scenes: [
      { text: "In the year 2000, Fortune named Enron the most innovative corporation in America six years in a row.", query: "futuristic glass skyscraper reflective windows corporate greed" },
      { text: "Behind glowing boardroom doors, executives used mark-to-market accounting to book twenty years of fantasy profit on day one.", query: "corporate boardroom dark wood table empty leather chairs" },
      { text: "When deals hemorrhaged cash, they dumped the toxic debt into secret off-balance-sheet shell companies.", query: "paper shredder shredding documents late night office dark" },
      { text: "Top executives quietly cashed out a billion dollars in personal stock while telling employees to invest their pensions.", query: "luxury sports car executive briefcase corporate fraud" },
      { text: "Within twenty-four days, a seventy-billion-dollar giant evaporated into bankruptcy, leaving twenty thousand families penniless.", query: "cardboard box security guard escorting employee empty office" }
    ],
    hashtags: ['#Enron', '#CorporateFraud', '#WallStreetScandal', '#FinanceDocumentary', '#Shorts']
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

function wrapTextToLines(text, maxChars = 28) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Generate Ambient Sound Effect Layer (Mechanical Ticker / Ticking Clock / Heartbeat)
 */
function generateFinancialSfxWav(sfxType, outWavPath, duration = 45.0) {
  let filter = '';
  if (sfxType === 'ticker') {
    // Vintage stock ticker paper rhythm
    filter = `aevalsrc='0.025*sin(2*PI*850*t)*gte(mod(t*3,1),0.85)+0.015*sin(2*PI*1400*t)*gte(mod(t*3,1),0.85)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  } else if (sfxType === 'clock') {
    // Tense relentless countdown clock
    filter = `aevalsrc='0.03*sin(2*PI*1200*t)*gte(mod(t*2,1),0.92)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  } else {
    // Low sub-bass tension heartbeat
    filter = `aevalsrc='0.035*sin(2*PI*55*t)*gte(mod(t,1.8),1.5)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  }

  try {
    execSync(`ffmpeg -y -f lavfi -i "${filter}" -map "[sfx]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${duration.toFixed(2)} "${outWavPath}" 2>/dev/null`);
  } catch {
    execSync(`ffmpeg -y -f lavfi -i "anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.01" -c:a pcm_s16le -ar 44100 -ac 2 -t ${duration.toFixed(2)} "${outWavPath}" 2>/dev/null`);
  }
}

/**
 * Build Word-Synced Karaoke Subtitle File (.ass) with Translucent Backing
 */
function generateFinancialKaraokeAss(wordsWithTimings, totalDuration, outAssPath) {
  const wordsPerLine = 4;
  const rawWords = wordsWithTimings.map(w => w.word);
  const totalMs = Math.round(totalDuration * 1000);
  const msPerWord = rawWords.length > 0 ? totalMs / rawWords.length : 320;

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
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 140));

    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(8, Math.round(msPerWord / 10));
      kLine += `{\\k${wordCs}}${w} `;
    }
    lines.push(`Dialogue: 0,${formatAssTime(chunkStartMs)},${formatAssTime(chunkEndMs)},FinDocKaraoke,,0,0,0,,${kLine.trim()}`);
  }

  // Center-screen karaoke style with translucent obsidian box (Alignment 5)
  const assContent = `[Script Info]
Title: Cinema Vanguard Financial Documentary Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: FinDocKaraoke, Arial, 56, &H00FFFFFF, &H0010B981, &H00000000, &HD0050810, 1, 0, 0, 0, 100, 100, 1.2, 0, 3, 16, 0, 5, 80, 80, 0, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Build Glowing Gold Outro Card SVG (Last Scene CTA: "FOLLOW FOR MORE • FINANCIAL STORIES")
 */
function buildFinancialOutroSvg(width = 1080, height = 1920) {
  const channelWatermark = process.env.YOUTUBE_HANDLE_CH4 || '@CinemaVanguard';
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="outroGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02040a" />
        <stop offset="50%" stop-color="#0a0f1d" />
        <stop offset="100%" stop-color="#010204" />
      </linearGradient>
      <filter id="goldPulse" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#outroGrad)" />

    <!-- Ambient Vignette -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="120" opacity="0.85" />

    <!-- Outer Glowing Gold Frame -->
    <rect x="60" y="80" width="${width - 120}" height="${height - 160}" rx="32" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.45" filter="url(#goldPulse)" />

    <!-- Center Card -->
    <g transform="translate(140, 740)">
      <rect width="800" height="420" rx="28" fill="#090d16" fill-opacity="0.96" stroke="#f59e0b" stroke-width="3" filter="url(#goldPulse)" />

      <!-- Top Badge -->
      <g transform="translate(240, -24)">
        <rect width="320" height="48" rx="24" fill="#f59e0b" />
        <text x="160" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#02040a" text-anchor="middle" letter-spacing="2">
          FINANCIAL STORY ARCHIVE
        </text>
      </g>

      <!-- Glowing CTA Text -->
      <text x="400" y="140" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
        FOLLOW FOR MORE
      </text>

      <text x="400" y="215" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#fde68a" text-anchor="middle" letter-spacing="2">
        EPIC STORIES OF MONEY, POWER & CRASHES
      </text>

      <!-- Bottom Channel Stamp -->
      <g transform="translate(140, 290)">
        <rect width="520" height="56" rx="28" fill="#020617" stroke="#f59e0b" stroke-width="1.6" />
        <text x="260" y="35" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#10b981" text-anchor="middle" letter-spacing="1.5">
          Cinema Vanguard • ${channelWatermark.toUpperCase()} • Daily Stories 🏛️
        </text>
      </g>
    </g>
  </svg>`;
}

/**
 * Build Single Slide Typography Overlay SVG
 */
function buildFinancialSlideSvg(quoteText, eraLabel, sceneNum, totalScenes, width = 1080, height = 1920) {
  const channelWatermark = process.env.YOUTUBE_HANDLE_CH4 || '@CinemaVanguard';
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vignetteTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.0" />
      </linearGradient>
      <linearGradient id="vignetteBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.0" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.92" />
      </linearGradient>
      <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Top Scrim -->
    <rect x="0" y="0" width="${width}" height="280" fill="url(#vignetteTop)" />
    <!-- Bottom Scrim -->
    <rect x="0" y="${height - 480}" width="${width}" height="480" fill="url(#vignetteBottom)" />

    <!-- Header Era Pill (Top) -->
    <g transform="translate(80, 100)" filter="url(#goldGlow)">
      <rect width="920" height="64" rx="32" fill="#020617" fill-opacity="0.88" stroke="#f59e0b" stroke-width="1.8" />
      <rect x="12" y="12" width="240" height="40" rx="20" fill="#f59e0b" />
      <text x="132" y="37" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#02040a" text-anchor="middle" letter-spacing="2">
        SCENE ${sceneNum} OF ${totalScenes}
      </text>
      <text x="890" y="38" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#fde68a" text-anchor="end" letter-spacing="2">
        ${escapeXml(eraLabel.toUpperCase())}
      </text>
    </g>

    <!-- Bottom Channel Watermark Badge -->
    <g transform="translate(80, ${height - 180})">
      <rect width="920" height="52" rx="26" fill="#020617" fill-opacity="0.9" stroke="#f59e0b" stroke-width="1.2" />
      <text x="460" y="32" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#fde68a" letter-spacing="2" text-anchor="middle">
        CINEMA VANGUARD • ${channelWatermark.toUpperCase()} • FINANCIAL STORY
      </text>
    </g>

    <!-- Vintage Film Vignette Edge -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#020617" stroke-width="16" opacity="0.6" />
  </svg>`;
}

/**
 * Main Generator: Build 1 Complete Financial Story Documentary Video (>38s)
 */
async function generateFinancialStoryDocumentary() {
  console.log('\n===============================================================');
  console.log('🏛️ CINEMA VANGUARD: FINANCIAL STORY DOCUMENTARY ENGINE');
  console.log('True Market Dramas • Audacious Trades • Wall Street Sagas');
  console.log('===============================================================\n');

  // 1. Select Deduplicated Financial Story
  const chosenStory = await selectDeduplicatedCandidate(
    'financial_story_doc',
    FINANCIAL_STORY_CATALOG,
    st => st.title,
    st => st.era
  );

  console.log(`[Financial Story Selected]: "${chosenStory.title}" (${chosenStory.era})`);

  // 2. Synthesize Narration via Andrew Voice (slow, reflective documentary pace)
  const fullNarration = chosenStory.scenes.map(s => s.text).join(' ');
  const voiceMp3 = path.join(ARTIFACTS_DIR, `fin_voice_${Date.now()}.mp3`);
  const voiceWav = path.join(ARTIFACTS_DIR, `fin_voice_${Date.now()}.wav`);

  console.log(`[Narration Engine] 🎙️ Synthesizing documentary narration with Andrew Voice (-6% rate, -20Hz pitch)...`);
  let tts = new EdgeTTS({
    voice: 'en-US-AndrewNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '-6%',
    pitch: '-20Hz',
    timeout: 45000
  });
  await tts.ttsPromise(fullNarration, voiceMp3);

  execSync(`ffmpeg -y -i "${voiceMp3}" -ar 44100 -ac 2 -c:a pcm_s16le "${voiceWav}" 2>/dev/null`);
  const durProbe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}"`, { encoding: 'utf8' }).trim();
  const voiceDuration = parseFloat(durProbe) || 40.0;
  // Outro adds 3.5s
  const totalDuration = voiceDuration + 3.5;
  console.log(`[Narration Engine] ✓ Voice synthesized: ${voiceDuration.toFixed(1)}s (Total with Outro: ${totalDuration.toFixed(1)}s)`);

  // 3. AI OST & Sound Effects for Financial Drama
  console.log(`[Audio Sourcing] 🎵 Resolving financial thriller OST for "${chosenStory.bgmQuery}"...`);
  let bgMusicPath = null;
  const fetchedAudio = await searchAndFetchAudio(chosenStory.bgmQuery, { preferredSource: 'openverse', targetDuration: totalDuration });
  if (fetchedAudio && fetchedAudio.localPath && fs.existsSync(fetchedAudio.localPath)) {
    bgMusicPath = fetchedAudio.localPath;
  }

  // Financial Sound Effect Layer (mechanical ticker, clock, heartbeat)
  const sfxWav = path.join(ARTIFACTS_DIR, `sfx_${Date.now()}.wav`);
  generateFinancialSfxWav(chosenStory.sfxType || 'ticker', sfxWav, totalDuration);

  // 4. Word-Level ASS Karaoke Subtitles
  const words = fullNarration.split(/\s+/).filter(Boolean);
  const wordsWithTimings = words.map((w, i) => ({
    word: w,
    start: i * (voiceDuration / words.length),
    end: (i + 1) * (voiceDuration / words.length)
  }));
  const assSubtitlesPath = path.join(ARTIFACTS_DIR, 'fin_karaoke.ass');
  generateFinancialKaraokeAss(wordsWithTimings, voiceDuration, assSubtitlesPath);

  // 5. Visual Media for Each Scene (Images & Mid-Video Clips with Ken Burns Pan/Zoom)
  const sceneCount = chosenStory.scenes.length;
  const secPerScene = voiceDuration / sceneCount;
  const sceneInputs = [];

  for (let i = 0; i < sceneCount; i++) {
    const sc = chosenStory.scenes[i];
    console.log(`[Scene ${i + 1}/${sceneCount}] Sourcing visual for: "${sc.query}"...`);

    let visualPath = null;
    let isVideoClip = false;

    // For middle scene (scene 2 or 3), attempt to fetch real video clip
    if (i === 1 || i === 2) {
      const vid = await searchAndFetchVideo(sc.query, { minDuration: 3, preferredSource: 'pexels' });
      if (vid && vid.localPath && fs.existsSync(vid.localPath)) {
        visualPath = vid.localPath;
        isVideoClip = true;
        console.log(`  -> Sourced on-topic mid-video clip: ${path.basename(visualPath)}`);
      }
    }

    if (!visualPath) {
      let visual = await searchAndFetchImage(sc.query, { preferredSource: 'wikimedia' });
      if (!visual || !visual.localPath || !fs.existsSync(visual.localPath)) {
        visual = await searchAndFetchImage(sc.query, { preferredSource: 'unsplash' });
      }
      visualPath = visual?.localPath || path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790502544405.jpg');
    }

    // Build SVG Overlay with Title Pill & Vignette
    const slideSvg = buildFinancialSlideSvg(sc.text, chosenStory.era, i + 1, sceneCount, 1080, 1920);
    const slideSvgPath = path.join(ARTIFACTS_DIR, `slide_${i}.svg`);
    const slidePngPath = path.join(ARTIFACTS_DIR, `slide_${i}.png`);
    fs.writeFileSync(slideSvgPath, slideSvg);
    execSync(`ffmpeg -y -i "${slideSvgPath}" "${slidePngPath}" 2>/dev/null`);

    // Compile Single Scene MP4
    const sceneMp4 = path.join(ARTIFACTS_DIR, `scene_${i}.mp4`);
    const zoomDirection = i % 2 === 0 ? 'min(zoom+0.0008,1.18)' : 'max(1.18-0.0008*on,1.0)';
    
    if (isVideoClip) {
      // Scale video clip to 1080x1920 vertical & loop if needed
      const filter = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vid];[vid][1:v]overlay=0:0[v]`;
      execSync(`ffmpeg -y -stream_loop 3 -t ${secPerScene.toFixed(2)} -i "${visualPath}" -loop 1 -t ${secPerScene.toFixed(2)} -i "${slidePngPath}" -filter_complex "${filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t ${secPerScene.toFixed(2)} "${sceneMp4}" 2>/dev/null`);
    } else {
      // Ken Burns Pan-and-Zoom on photography
      const filter = `[0:v]scale=1200:2133,zoompan=z='${zoomDirection}':d=${Math.round(secPerScene * 30)}:s=1080x1920:fps=30[bg];[bg][1:v]overlay=0:0[v]`;
      execSync(`ffmpeg -y -loop 1 -t ${secPerScene.toFixed(2)} -i "${visualPath}" -loop 1 -t ${secPerScene.toFixed(2)} -i "${slidePngPath}" -filter_complex "${filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t ${secPerScene.toFixed(2)} "${sceneMp4}" 2>/dev/null`);
    }
    sceneInputs.push(sceneMp4);
  }

  // 6. Glowing Dark Gold Outro Scene (3.5s CTA: "FOLLOW FOR MORE • FINANCIAL STORIES")
  console.log(`[Outro Engine] 🌟 Rendering glowing gold financial outro scene...`);
  const outroDuration = 3.5;
  const outroSvg = buildFinancialOutroSvg(1080, 1920);
  const outroSvgPath = path.join(ARTIFACTS_DIR, 'outro.svg');
  const outroPngPath = path.join(ARTIFACTS_DIR, 'outro.png');
  const outroMp4 = path.join(ARTIFACTS_DIR, 'scene_outro.mp4');
  fs.writeFileSync(outroSvgPath, outroSvg);
  execSync(`ffmpeg -y -i "${outroSvgPath}" "${outroPngPath}" 2>/dev/null`);
  execSync(`ffmpeg -y -loop 1 -t ${outroDuration} -i "${outroPngPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t ${outroDuration} "${outroMp4}" 2>/dev/null`);
  sceneInputs.push(outroMp4);

  // 7. Concatenate Scenes & Apply Karaoke Subtitles
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `financial_story_doc_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'financial_story_doc_latest.mp4');

  const concatListTxt = path.join(ARTIFACTS_DIR, 'doc_scenes.txt');
  fs.writeFileSync(concatListTxt, sceneInputs.map(p => `file '${p}'`).join('\n'));
  const visualConcatMp4 = path.join(ARTIFACTS_DIR, 'doc_visual_concat.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListTxt}" -c copy "${visualConcatMp4}" 2>/dev/null || ffmpeg -y -f concat -safe 0 -i "${concatListTxt}" -c:v libx264 -preset fast -pix_fmt yuv420p "${visualConcatMp4}" 2>/dev/null`);

  // 8. Audio Mix: Voice (1.35x), Sound FX (0.16x), Ducked AI OST (0.15x)
  let audioInputs = `-i "${visualConcatMp4}" -i "${voiceWav}" -i "${sfxWav}" `;
  let audioFilter = `[1:a]volume=1.35,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120[voice]; [2:a]volume=0.16,atrim=0:${totalDuration.toFixed(2)}[sfx]; `;

  if (bgMusicPath && fs.existsSync(bgMusicPath)) {
    audioInputs += `-i "${bgMusicPath}" `;
    audioFilter += `[3:a]volume=0.15,afade=t=in:st=0:d=2.0,afade=t=out:st=${(totalDuration - 2.0).toFixed(2)}:d=2.0,atrim=0:${totalDuration.toFixed(2)}[bgm]; [voice][sfx][bgm]amix=inputs=3:duration=first:dropout_transition=2[a_final]`;
  } else {
    audioFilter += `[voice][sfx]amix=inputs=2:duration=first:dropout_transition=2[a_final]`;
  }

  // Combine video with karaoke subtitles filter
  const finalFilter = `${audioFilter}; [0:v]subtitles=${assSubtitlesPath}[v_sub]`;
  let finalCmd = `ffmpeg -y ${audioInputs} -filter_complex "${finalFilter}" -map "[v_sub]" -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${totalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;

  console.log(`[Compositor Engine] 🎬 Assembling master financial story documentary with karaoke captions...`);
  try {
    execSync(finalCmd);
  } catch (err) {
    console.warn(`[Subtitles Notice] Retrying direct mapping without subtitles filter...`);
    const fallbackCmd = `ffmpeg -y ${audioInputs} -filter_complex "${audioFilter}" -map 0:v -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${totalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;
    execSync(fallbackCmd);
  }

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`\n🎉 [Financial Story Engine] SUCCESS: Rendered Video (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` • Path: ${finalMp4Path}`);
  }

  // 9. Record to Deduplication Service
  await recordPostedCandidate('financial_story_doc', chosenStory.title, chosenStory.era, {
    genre: 'financial_story',
    duration: totalDuration,
    archiveQuery: chosenStory.archiveQuery,
    timestamp
  });

  // 10. Dispatch to YouTube Channel 4 (Cinema Vanguard / movie_brand)
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch4Token = process.env.YOUTUBE_REFRESH_TOKEN_CH4 || process.env.YOUTUBE_REFRESH_TOKEN_MOVIE || process.env.YOUTUBE_REFRESH_TOKEN;

  const viralTitle = `${chosenStory.title} (${chosenStory.era.split('•')[0].trim()}) #Shorts`;
  const viralDesc = `${fullNarration}\n\n🏛️ Era: ${chosenStory.era}\nSource: Archival Financial History & Court Records\n\n#CinemaVanguard #FinancialDocumentary #WallStreet #History #Shorts`;

  if (ch4Token && !isDryRun) {
    console.log(`\n[Documentary Dispatcher] 📤 Uploading to YouTube Channel 4 (Financial Story)...`);
    try {
      await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: chosenStory.hashtags,
        channelId: 'movie_brand'
      });
      console.log(`[Documentary Dispatcher] YouTube upload successful!`);
    } catch (e) {
      console.warn(`[Documentary Dispatcher] YouTube notice:`, e.message);
    }
  }

  return {
    videoPath: finalMp4Path,
    duration: totalDuration,
    title: chosenStory.title,
    genre: 'financial_story'
  };
}

if (require.main === module) {
  generateFinancialStoryDocumentary()
    .then(r => {
      console.log(`\n✓ Financial Story Documentary Completed: "${r.title}" (${r.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error in Financial Story pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateFinancialStoryDocumentary,
  FINANCIAL_STORY_CATALOG
};
