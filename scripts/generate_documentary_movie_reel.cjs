#!/usr/bin/env node

/**
 * Historical, Horror, Crime & Story Documentary Reel Engine (Cinema Vanguard)
 *
 * User Mandates:
 * 1. Multi-Niche Coverage: Horror, Crime, History, and captivating Mystery/Survival Story documentaries.
 * 2. Visuals: Strong on-topic images and mid-video clips (from Pexels, Pixabay, Wikimedia, Unsplash)
 *    with resilient fallback to Cloudinary / curated high-impact assets.
 * 3. Cinematic Motion: Ken Burns dynamic zooming (zoom-in / zoom-out alternating) and smooth panning.
 * 4. Subtitles: Synchronized karaoke subtitles (.ass) with translucent dark drop-box for 100% readability.
 * 5. Audio: Atmospheric narration (EdgeTTS Andrew), genre-tailored AI OST soundtrack,
 *    and movie-type sound effects (eerie tension drone for horror, dark noir cello for crime,
 *    35mm projector flutter for history, dramatic strings for story).
 * 6. Outro Scene: Dark aesthetic with glowing neon/gold accent and CTA caption "FOLLOW FOR MORE".
 * 7. Automation: Scheduled daily release to YouTube Channel 4 (Cinema Vanguard).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { EdgeTTS } = require('node-edge-tts');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'documentary');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 16 Diverse Archival Documentaries spanning Horror, Crime, History & Survival Stories
const DOCUMENTARY_CATALOG = [
  // 1. HORROR / UNEXPLAINED
  {
    id: 'mary_celeste_ghost_ship',
    genre: 'horror',
    title: 'The Ghost Ship of the Atlantic',
    era: '1872 • Ghost Ship Disappearance',
    archiveQuery: 'ghost ship wooden sailboat stormy dark ocean mist',
    bgmQuery: 'dark eerie horror tension atmospheric ambient cello',
    sfxType: 'creak',
    scenes: [
      { text: "In December 1872, a brigantine was spotted drifting silently off the Azores.", query: "vintage sailing ship drifting calm dark ocean fog" },
      { text: "Boarding sailors found untouched meals, intact cargo, and absolute silence.", query: "wooden ship dining table empty plates dark cabin" },
      { text: "The captain, his wife, and all seven crewmen had vanished into thin air.", query: "empty ship helm wheel creaking dark stormy night" },
      { text: "No struggle. No distress call. Only an open hatch and the howling wind.", query: "dark ship hull creaking ocean deep waters night" },
      { text: "The ocean holds thousands of mysteries, but Mary Celeste remains its greatest ghost.", query: "abandoned sailing ship silhouette stormy sunset horizon" }
    ],
    hashtags: ['#HorrorDocumentary', '#MaryCeleste', '#GhostShip', '#Unexplained', '#Documentary', '#Shorts']
  },
  {
    id: 'dyatlov_pass_incident',
    genre: 'horror',
    title: 'The Dyatlov Pass Mystery',
    era: '1959 • Ural Mountains Tragedy',
    archiveQuery: 'snow blizzard dark mountain tent abandoned winter urals',
    bgmQuery: 'cold wind dark horror drone eerie ambient cello',
    sfxType: 'wind',
    scenes: [
      { text: "In the freezing winter of 1959, nine skilled hikers hiked into the Ural Mountains.", query: "snowy mountain blizzard wilderness lone hikers expedition" },
      { text: "Weeks later, searchers found their tent slashed open—from the inside.", query: "shredded canvas tent in snow blizzard cold mountain" },
      { text: "Footprints showed they fled barefoot into minus thirty-degree blizzard conditions.", query: "bare footprints in deep snow dark winter forest" },
      { text: "Several bodies were found with blunt trauma matching the force of a car crash.", query: "gloomy pine forest dark winter fog mysterious shadows" },
      { text: "To this day, what terror drove them out into the lethal cold remains unsolved.", query: "lone snowy mountain peak ominous dark storm clouds" }
    ],
    hashtags: ['#DyatlovPass', '#UnsolvedMystery', '#HorrorDocumentary', '#History', '#Shorts']
  },

  // 2. CRIME / HEISTS
  {
    id: 'db_cooper_sky_heist',
    genre: 'crime',
    title: 'The Skyjacking of D.B. Cooper',
    era: '1971 • Unsolved Aviation Mystery',
    archiveQuery: 'vintage boeing 727 airplane dark stormy night rain',
    bgmQuery: 'dark crime noir investigative suspense cello piano',
    sfxType: 'rain',
    scenes: [
      { text: "On Thanksgiving Eve 1971, a man in a business suit hijacked Flight 305.", query: "vintage 1970s airliner cabin passenger silhouette black tie" },
      { text: "He demanded two hundred thousand dollars in cash and four parachutes.", query: "stacks of vintage hundred dollar bills leather briefcase" },
      { text: "Somewhere over southwest Washington in freezing rain, he lowered the rear stairs.", query: "boeing 727 aft stairs descending in dark storm flight" },
      { text: "He leaped into the pitch-black night sky and disappeared into the wilderness.", query: "man parachuting dark stormy rain clouds night silhouette" },
      { text: "Despite five decades of FBI investigation, D.B. Cooper was never seen again.", query: "fbi agent vintage files noir detective dark desk light" }
    ],
    hashtags: ['#DBCooper', '#TrueCrime', '#HeistDocumentary', '#UnsolvedCrime', '#Shorts']
  },
  {
    id: 'gardner_museum_art_heist',
    genre: 'crime',
    title: 'The Gardner Museum Art Heist',
    era: '1990 • The $500 Million Theft',
    archiveQuery: 'empty museum frame art gallery dark shadows night',
    bgmQuery: 'tense noir suspense piano dark cello crime strings',
    sfxType: 'clock',
    scenes: [
      { text: "Midnight in Boston, 1990. Two men dressed as police officers buzzed the museum gate.", query: "dark historic museum facade iron gates night streetlamp" },
      { text: "Within eighty-one minutes, they walked out with thirteen masterworks of art.", query: "rembrandt vermeer painting empty picture frame wall" },
      { text: "Masterpieces by Vermeer, Rembrandt, and Degas were ruthlessly sliced from their frames.", query: "empty golden picture frame hanging on dark gallery wall" },
      { text: "Today, half a billion dollars in stolen paintings remain unaccounted for.", query: "empty picture frame spotlight dark art museum security" },
      { text: "The museum still leaves the empty frames hanging on the walls, waiting for their return.", query: "lone visitor looking at empty picture frame dark museum" }
    ],
    hashtags: ['#ArtHeist', '#TrueCrime', '#UnsolvedMystery', '#CrimeDocumentary', '#Shorts']
  },

  // 3. HISTORY / EPOCHS
  {
    id: 'apollo_11_silent_moon',
    genre: 'history',
    title: 'The Unheard Apollo Transmissions',
    era: '1969 • Cold War Space Age',
    archiveQuery: 'apollo 11 astronaut moon surface lunar module nasa',
    bgmQuery: 'cinematic deep space ambient drone slow strings',
    sfxType: 'projector',
    scenes: [
      { text: "In July 1969, humanity left its home planet for the first time.", query: "saturn v rocket launch apollo 11 smoke flames" },
      { text: "When the lunar module touched down, only 25 seconds of fuel remained.", query: "apollo 11 lunar module eagle landing dust moon" },
      { text: "Neil Armstrong and Buzz Aldrin stood in complete, eerie silence.", query: "astronaut footprint on lunar soil moon surface shadow" },
      { text: "Looking back, Earth was a fragile blue marble suspended in total darkness.", query: "earthrise from moon surface apollo blue planet" },
      { text: "We traveled 240,000 miles to explore the moon, but truly discovered ourselves.", query: "apollo 11 astronaut helmet visor reflection earth" }
    ],
    hashtags: ['#Documentary', '#Apollo11', '#NASA', '#SpaceHistory', '#History', '#Shorts']
  },
  {
    id: 'library_of_alexandria_scrolls',
    genre: 'history',
    title: 'The Lost Scrolls of Alexandria',
    era: '3rd Century BC • Hellenistic Egypt',
    archiveQuery: 'ancient library scroll parchment manuscripts ruins marble',
    bgmQuery: 'ancient contemplative strings melancholic ambient flute',
    sfxType: 'projector',
    scenes: [
      { text: "Over two thousand years ago, an empire dreamed of collecting all human knowledge.", query: "ancient papyrus scroll library manuscripts dust" },
      { text: "Every ship entering Alexandria harbor was stripped of its books to be copied.", query: "ancient greek library marble columns scroll shelves" },
      { text: "Half a million papyrus scrolls held the lost science of the ancient world.", query: "ancient astronomical chart astrolabe papyrus map" },
      { text: "Then, over centuries of fire and neglect, the great library vanished.", query: "ancient library ruins burning embers shadows dust" },
      { text: "We do not mourn the lost paper, but the questions humanity forgot how to ask.", query: "ancient marble scholar bust contemplative shadow" }
    ],
    hashtags: ['#Documentary', '#AncientHistory', '#Alexandria', '#LostKnowledge', '#History', '#Shorts']
  },

  // 4. STORY / SURVIVAL & DISCOVERY
  {
    id: 'shackleton_endurance_ice',
    genre: 'story',
    title: 'Shackleton: The Impossible Survival',
    era: '1915 • Imperial Trans-Antarctic Expedition',
    archiveQuery: 'wooden ship trapped in antarctic pack ice winter snow',
    bgmQuery: 'dramatic orchestral survival strings emotional cello rise',
    sfxType: 'wind',
    scenes: [
      { text: "In 1915, Sir Ernest Shackleton ship Endurance was crushed by Antarctic pack ice.", query: "vintage wooden ship trapped in antarctic ice pack" },
      { text: "Stranded on drifting ice floes, twenty-eight men faced certain starvation.", query: "polar expedition team camping on antarctic sea ice" },
      { text: "Shackleton and five men sailed eight hundred miles in a tiny twenty-foot lifeboat.", query: "small wooden lifeboat battling giant frozen ocean waves" },
      { text: "Against hurricane winds and towering seas, they navigated by compass and raw willpower.", query: "dramatic stormy ocean waves polar iceberg mist" },
      { text: "After five hundred days of pure ice and terror, not a single life was lost.", query: "polar rescue ship arriving through melting antarctic ice" }
    ],
    hashtags: ['#Shackleton', '#SurvivalStory', '#HeroicAge', '#HistoryDocumentary', '#Shorts']
  },
  {
    id: 'voyager_golden_record',
    genre: 'story',
    title: 'The Golden Record to the Stars',
    era: '1977 • Interstellar Space Mission',
    archiveQuery: 'voyager golden record spacecraft deep space stars',
    bgmQuery: 'voyager space ambient synthesizer contemplative strings',
    sfxType: 'projector',
    scenes: [
      { text: "In 1977, NASA launched a golden phonograph record into deep space.", query: "voyager golden record gold disc phonograph cover" },
      { text: "It carried whale songs, human heartbeats, and music by Bach and Chuck Berry.", query: "sound waves audio waveform frequencies visual space" },
      { text: "Carl Sagan called it a bottle cast into the cosmic ocean.", query: "voyager spacecraft deep space distant star galaxy" },
      { text: "Today, Voyager 1 has crossed into the cold dark interstellar medium.", query: "interstellar space cosmic dust stars deep universe" },
      { text: "Long after our sun burns out, humanity voice will still drift among the stars.", query: "golden record drifting deep space cosmos galaxies" }
    ],
    hashtags: ['#Documentary', '#Voyager', '#CarlSagan', '#Space', '#Astronomy', '#Shorts']
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
 * Generate Sound Effect Layer according to movie type
 */
function generateSoundEffectWav(sfxType, outWavPath, duration = 45.0) {
  let filter = '';
  if (sfxType === 'creak') {
    // Horror nautical creak + low thud
    filter = `aevalsrc='0.02*sin(2*PI*40*t)+0.015*sin(2*PI*82*t)+0.008*sin(2*PI*12*t)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  } else if (sfxType === 'rain') {
    // Crime rain ambience
    filter = `anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.025,lowpass=f=2200,highpass=f=250[sfx]`;
  } else if (sfxType === 'wind') {
    // Horror / Survival wind drone
    filter = `anoisesrc=d=${duration.toFixed(2)}:c=brown:a=0.03,lowpass=f=600[sfx]`;
  } else if (sfxType === 'clock') {
    // Crime investigative ticking
    filter = `aevalsrc='0.03*sin(2*PI*1000*t)*gte(mod(t*2,1),0.9)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  } else {
    // Projector flutter default
    filter = `aevalsrc='0.02*sin(2*PI*48*t)+0.015*sin(2*PI*96*t)':s=44100:d=${duration.toFixed(2)}[motor]; anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.015[hiss]; [motor][hiss]amix=inputs=2[sfx]`;
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
function generateDocumentaryKaraokeAss(wordsWithTimings, totalDuration, outAssPath) {
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
    lines.push(`Dialogue: 0,${formatAssTime(chunkStartMs)},${formatAssTime(chunkEndMs)},DocKaraoke,,0,0,0,,${kLine.trim()}`);
  }

  // MarginV: 560 puts subtitles safely above bottom UI
  const assContent = `[Script Info]
Title: Driftreel Archival Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: DocKaraoke, Arial, 56, &H00FFFFFF, &H0038BDF8, &H00000000, &HD0050810, 1, 0, 0, 0, 100, 100, 1.2, 0, 3, 16, 0, 5, 80, 80, 0, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Build Glowing Dark Outro Card SVG (Last Scene CTA: "FOLLOW FOR MORE")
 */
function buildGlowingOutroSvg(genre = 'history', width = 1080, height = 1920) {
  const glowTheme = {
    horror: { border: '#ef4444', text: '#fca5a5', badge: 'HAUNTING ARCHIVES' },
    crime: { border: '#38bdf8', text: '#7dd3fc', badge: 'UNSOLVED CASEFILE' },
    history: { border: '#fbbf24', text: '#fde68a', badge: 'HISTORICAL ARCHIVE' },
    story: { border: '#a855f7', text: '#d8b4fe', badge: 'CHRONICLE OF MANKIND' }
  }[genre] || { border: '#fbbf24', text: '#fde68a', badge: 'HISTORICAL ARCHIVE' };

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="outroGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02040a" />
        <stop offset="50%" stop-color="#070c18" />
        <stop offset="100%" stop-color="#010204" />
      </linearGradient>
      <filter id="neonPulse" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#outroGrad)" />

    <!-- Ambient Vignette -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="120" opacity="0.8" />

    <!-- Outer Glowing Frame -->
    <rect x="60" y="80" width="${width - 120}" height="${height - 160}" rx="32" fill="none" stroke="${glowTheme.border}" stroke-width="2" opacity="0.5" filter="url(#neonPulse)" />

    <!-- Center Card -->
    <g transform="translate(140, 740)">
      <rect width="800" height="420" rx="28" fill="#050811" fill-opacity="0.96" stroke="${glowTheme.border}" stroke-width="3" filter="url(#neonPulse)" />

      <!-- Top Genre Badge -->
      <g transform="translate(250, -24)">
        <rect width="300" height="48" rx="24" fill="${glowTheme.border}" />
        <text x="150" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#02040a" text-anchor="middle" letter-spacing="2">
          ${glowTheme.badge}
        </text>
      </g>

      <!-- Glowing CTA Text -->
      <text x="400" y="140" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
        FOLLOW FOR MORE
      </text>

      <text x="400" y="215" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="${glowTheme.text}" text-anchor="middle" letter-spacing="2">
        DARK ARCHIVAL MYSTERIES & CRIME
      </text>

      <!-- Bottom Channel Stamp -->
      <g transform="translate(140, 290)">
        <rect width="520" height="56" rx="28" fill="#020617" stroke="${glowTheme.border}" stroke-width="1.6" />
        <text x="260" y="35" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="1.5">
          Driftreel • @driftreel • Daily Mysteries 🔍
        </text>
      </g>
    </g>
  </svg>`;
}

/**
 * Build Single Slide Typography Overlay SVG
 */
function buildDocumentarySlideSvg(quoteText, eraLabel, sceneNum, totalScenes, genre = 'history', width = 1080, height = 1920) {
  const accentColor = genre === 'horror' ? '#ef4444' : (genre === 'crime' ? '#38bdf8' : '#fbbf24');

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
      <filter id="cinematicGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Top Scrim -->
    <rect x="0" y="0" width="${width}" height="280" fill="url(#vignetteTop)" />
    <!-- Bottom Scrim -->
    <rect x="0" y="${height - 480}" width="${width}" height="480" fill="url(#vignetteBottom)" />

    <!-- Header Era Pill (Top) -->
    <g transform="translate(80, 100)" filter="url(#cinematicGlow)">
      <rect width="920" height="64" rx="32" fill="#020617" fill-opacity="0.85" stroke="${accentColor}" stroke-width="1.8" />
      <rect x="12" y="12" width="230" height="40" rx="20" fill="${accentColor}" />
      <text x="127" y="37" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#020617" text-anchor="middle" letter-spacing="2">
        SCENE ${sceneNum} OF ${totalScenes}
      </text>
      <text x="890" y="38" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#f8fafc" text-anchor="end" letter-spacing="2">
        ${escapeXml(eraLabel.toUpperCase())}
      </text>
    </g>

    <!-- Bottom Channel Watermark Badge -->
    <g transform="translate(80, ${height - 180})">
      <rect width="920" height="52" rx="26" fill="#020617" fill-opacity="0.9" stroke="${accentColor}" stroke-width="1.2" />
      <text x="460" y="32" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#f8fafc" letter-spacing="2" text-anchor="middle">
        DRIFTREEL • @driftreel • ARCHIVAL DOCUMENTARY
      </text>
    </g>

    <!-- 35mm Vignette Border Edge -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#020617" stroke-width="18" opacity="0.6" />
  </svg>`;
}

/**
 * Main Generator: Build 1 Complete Documentary Video (>35s)
 */
async function generateDocumentaryVideo() {
  console.log('\n===============================================================');
  console.log('🏛️ CINEMA VANGUARD: MULTI-GENRE ARCHIVAL DOCUMENTARY ENGINE');
  console.log('Horror • Crime • History • Story | AI OST | Karaoke Subtitles');
  console.log('===============================================================\n');

  // 1. Select Deduplicated Episode across Horror, Crime, History, and Story
  const chosenEpisode = await selectDeduplicatedCandidate(
    'documentary_movie',
    DOCUMENTARY_CATALOG,
    ep => ep.title,
    ep => ep.era
  );

  console.log(`[Documentary Selected]: "${chosenEpisode.title}" [${chosenEpisode.genre.toUpperCase()}] (${chosenEpisode.era})`);

  // 2. Synthesize Narration via Andrew Voice (slow, reflective documentary pace)
  const fullNarration = chosenEpisode.scenes.map(s => s.text).join(' ');
  const voiceMp3 = path.join(ARTIFACTS_DIR, `doc_voice_${Date.now()}.mp3`);
  const voiceWav = path.join(ARTIFACTS_DIR, `doc_voice_${Date.now()}.wav`);

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
  const voiceDuration = parseFloat(durProbe) || 38.0;
  // Outro adds 3.5s
  const totalDuration = voiceDuration + 3.5;
  console.log(`[Narration Engine] ✓ Voice synthesized: ${voiceDuration.toFixed(1)}s (Total with Outro: ${totalDuration.toFixed(1)}s)`);

  // 3. AI OST & Sound Effects tailored to Movie Type
  console.log(`[Audio Sourcing] 🎵 Resolving cinematic OST for "${chosenEpisode.bgmQuery}"...`);
  let bgMusicPath = null;
  const fetchedAudio = await searchAndFetchAudio(chosenEpisode.bgmQuery, { preferredSource: 'openverse', targetDuration: totalDuration });
  if (fetchedAudio && fetchedAudio.localPath && fs.existsSync(fetchedAudio.localPath)) {
    bgMusicPath = fetchedAudio.localPath;
  }

  // Genre Sound Effect Layer (e.g. creak for horror, rain for crime, projector for history, wind for story)
  const sfxWav = path.join(ARTIFACTS_DIR, `sfx_${Date.now()}.wav`);
  generateSoundEffectWav(chosenEpisode.sfxType || 'projector', sfxWav, totalDuration);

  // 4. Word-Level ASS Karaoke Subtitles
  const words = fullNarration.split(/\s+/).filter(Boolean);
  const wordsWithTimings = words.map((w, i) => ({
    word: w,
    start: i * (voiceDuration / words.length),
    end: (i + 1) * (voiceDuration / words.length)
  }));
  const assSubtitlesPath = path.join(ARTIFACTS_DIR, 'doc_karaoke.ass');
  generateDocumentaryKaraokeAss(wordsWithTimings, voiceDuration, assSubtitlesPath);

  // 5. Visual Media for Each Scene (Images & Mid-Video Clips with Ken Burns Pan/Zoom)
  const sceneCount = chosenEpisode.scenes.length;
  const secPerScene = voiceDuration / sceneCount;
  const sceneInputs = [];

  for (let i = 0; i < sceneCount; i++) {
    const sc = chosenEpisode.scenes[i];
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
    const slideSvg = buildDocumentarySlideSvg(sc.text, chosenEpisode.era, i + 1, sceneCount, chosenEpisode.genre, 1080, 1920);
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

  // 6. Glowing Dark Outro Scene (3.5s CTA: "FOLLOW FOR MORE")
  console.log(`[Outro Engine] 🌟 Rendering glowing dark outro scene with CTA...`);
  const outroDuration = 3.5;
  const outroSvg = buildGlowingOutroSvg(chosenEpisode.genre, 1080, 1920);
  const outroSvgPath = path.join(ARTIFACTS_DIR, 'outro.svg');
  const outroPngPath = path.join(ARTIFACTS_DIR, 'outro.png');
  const outroMp4 = path.join(ARTIFACTS_DIR, 'scene_outro.mp4');
  fs.writeFileSync(outroSvgPath, outroSvg);
  execSync(`ffmpeg -y -i "${outroSvgPath}" "${outroPngPath}" 2>/dev/null`);
  execSync(`ffmpeg -y -loop 1 -t ${outroDuration} -i "${outroPngPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t ${outroDuration} "${outroMp4}" 2>/dev/null`);
  sceneInputs.push(outroMp4);

  // 7. Concatenate Scenes & Apply Karaoke Subtitles
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `documentary_movie_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'documentary_latest.mp4');

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

  console.log(`[Compositor Engine] 🎬 Assembling master documentary video with karaoke captions...`);
  try {
    execSync(finalCmd);
  } catch (err) {
    console.warn(`[Subtitles Notice] Retrying direct mapping without subtitles filter...`);
    const fallbackCmd = `ffmpeg -y ${audioInputs} -filter_complex "${audioFilter}" -map 0:v -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${totalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;
    execSync(fallbackCmd);
  }

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    const driftreelLatestArtifact = path.join(ARTIFACTS_DIR, 'driftreel_documentary_latest.mp4');
    const driftreelLatestRendered = path.join(RENDERED_DIR, 'driftreel_documentary_latest.mp4');
    fs.copyFileSync(finalMp4Path, driftreelLatestArtifact);
    fs.copyFileSync(finalMp4Path, driftreelLatestRendered);

    // Save manifest for Driftreel TikTok Publisher
    const driftreelManifest = {
      title: chosenEpisode.title,
      genre: chosenEpisode.genre,
      era: chosenEpisode.era,
      narration: fullNarration,
      hashtags: chosenEpisode.hashtags,
      videoPath: finalMp4Path,
      timestamp
    };
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'driftreel_manifest.json'), JSON.stringify(driftreelManifest, null, 2));
    fs.writeFileSync(path.join(RENDERED_DIR, 'driftreel_manifest.json'), JSON.stringify(driftreelManifest, null, 2));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'documentary_manifest.json'), JSON.stringify(driftreelManifest, null, 2));

    console.log(`\n🎉 [Documentary Engine] SUCCESS: Rendered Video for TikTok Driftreel (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` • Path: ${finalMp4Path}`);
    console.log(` • Driftreel Target: ${driftreelLatestRendered}`);
  }

  // 9. Record to Deduplication Service
  await recordPostedCandidate('driftreel', chosenEpisode.title, chosenEpisode.era, {
    genre: chosenEpisode.genre,
    duration: totalDuration,
    archiveQuery: chosenEpisode.archiveQuery,
    timestamp
  });
  await recordPostedCandidate('documentary_movie', chosenEpisode.title, chosenEpisode.era, {
    genre: chosenEpisode.genre,
    duration: totalDuration,
    archiveQuery: chosenEpisode.archiveQuery,
    timestamp
  });

  console.log(`\n[Driftreel TikTok Engine] 📱 Crime, Horror & Archival Documentary ready for TikTok Buffer dispatch.`);

  return {
    videoPath: finalMp4Path,
    duration: totalDuration,
    title: chosenEpisode.title,
    genre: chosenEpisode.genre
  };
}

if (require.main === module) {
  generateDocumentaryVideo()
    .then(r => {
      console.log(`\n✓ Archival Documentary Pipeline Completed: "${r.title}" (${r.genre}) (${r.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error in Documentary pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateDocumentaryVideo,
  DOCUMENTARY_CATALOG
};
