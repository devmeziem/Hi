#!/usr/bin/env node

/**
 * Historical Archival Documentary Video Engine (Channel 4: Archival Documentaries)
 *
 * User Mandates:
 * 1. Public Domain Documentary Archives (Prelinger Archives, Internet Archive, NASA, Library of Congress, Wikimedia Commons).
 * 2. Authentic Atmospheric Soundscapes (35mm film projector flutter, vinyl crackle, deep melancholic cellos, room tone).
 * 3. Deep Cinematic Narration via EdgeTTS (Andrew voice at slow, reflective, authoritative pace).
 * 4. Ken Burns Pan-and-Zoom drift over high-definition historical photographs and motion scans.
 * 5. High-contrast typography with chapter title cards, quotes, and timestamps.
 * 6. Automated Publishing to YouTube Channel 4 and TikTok via Buffer API 2.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { EdgeTTS } = require('node-edge-tts');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'documentary');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// 12 Diverse Historical Archival Episodes (Rotating across humanity's greatest moments)
const ARCHIVAL_DOCUMENTARY_CATALOG = [
  {
    id: 'apollo_11_silent_moon',
    title: 'The Unheard Apollo Transmissions',
    era: '1969 • Cold War Space Age',
    archiveQuery: 'apollo 11 astronaut moon surface lunar module nasa',
    bgmQuery: 'cinematic deep space ambient drone slow strings',
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
    id: 'challenger_deep_abyss',
    title: 'The Silent Abyss: Challenger Deep',
    era: '1960 • Bathyscaphe Trieste',
    archiveQuery: 'deep ocean trench submarine dark underwater abyss',
    bgmQuery: 'deep underwater ambient drone dark sub bass cello',
    scenes: [
      { text: "Seven miles beneath the Pacific waves lies the Challenger Deep.", query: "deep ocean dark underwater abyss blue shadows" },
      { text: "In 1960, two men descended inside seven inches of forged steel.", query: "bathyscaphe trieste deep sea submersible ocean" },
      { text: "At 35,000 feet, the pressure was eight tons per square inch.", query: "deep ocean hydrothermal vent glowing water pressure" },
      { text: "Through the tiny plexiglass window, a single flatfish swam by.", query: "deep sea glowing bioluminescent creature dark ocean" },
      { text: "Life had conquered the deepest darkness long before humanity arrived.", query: "deep sea trench seafloor underwater exploration" }
    ],
    hashtags: ['#Documentary', '#OceanExploration', '#DeepSea', '#History', '#Shorts']
  },
  {
    id: 'library_of_alexandria_scrolls',
    title: 'The Lost Scrolls of Alexandria',
    era: '3rd Century BC • Hellenistic Egypt',
    archiveQuery: 'ancient library scroll parchment manuscripts ruins marble',
    bgmQuery: 'ancient contemplative strings melancholic ambient flute',
    scenes: [
      { text: "Over two thousand years ago, an empire dreamed of collecting all human knowledge.", query: "ancient papyrus scroll library manuscripts dust" },
      { text: "Every ship entering Alexandria harbor was stripped of its books to be copied.", query: "ancient greek library marble columns scroll shelves" },
      { text: "Half a million papyrus scrolls held the lost science of the ancient world.", query: "ancient astronomical chart astrolabe papyrus map" },
      { text: "Then, over centuries of fire and neglect, the great library vanished.", query: "ancient library ruins burning embers shadows dust" },
      { text: "We do not mourn the lost paper, but the questions humanity forgot how to ask.", query: "ancient marble scholar bust contemplative shadow" }
    ],
    hashtags: ['#Documentary', '#AncientHistory', '#Alexandria', '#LostKnowledge', '#History', '#Shorts']
  },
  {
    id: 'industrial_revolution_steam',
    title: 'When Steam Replaced Muscle',
    era: '1888 • Early Industrial Era',
    archiveQuery: 'steam engine industrial revolution 1800s factory iron',
    bgmQuery: 'historical rhythmic cello slow strings brass drone',
    scenes: [
      { text: "For ten thousand years, human civilization moved at the speed of a horse.", query: "vintage steam locomotive train tracks 1800s smoke" },
      { text: "Then, boiling water harnessed inside iron cylinders changed everything.", query: "industrial revolution steam piston iron machine gear" },
      { text: "Millions left quiet farm fields for iron foundries that never slept.", query: "1800s iron foundry steel mill molten metal smoke" },
      { text: "Clocks and whistles began dictating every heartbeat of human daily life.", query: "vintage pocket watch antique gears clockwork" },
      { text: "The modern world was forged in coal dust, steam, and relentless ambition.", query: "industrial cityscape smoke stacks early 1900s skyline" }
    ],
    hashtags: ['#Documentary', '#IndustrialRevolution', '#History', '#SteamAge', '#Shorts']
  },
  {
    id: 'voyager_golden_record',
    title: 'The Golden Record to the Stars',
    era: '1977 • Interstellar Space Mission',
    archiveQuery: 'voyager golden record spacecraft deep space stars',
    bgmQuery: 'voyager space ambient synthesizer contemplative strings',
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
 * Generate 35mm Archival Film Projector Sound Effect (Flutter, hum, subtle mechanical roll)
 */
function generateProjectorSoundEffectWav(outWavPath, duration = 45.0) {
  const filter = `
    aevalsrc='0.02*sin(2*PI*48*t)+0.015*sin(2*PI*96*t)':s=44100:d=${duration.toFixed(2)}[motor];
    anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.015[hiss];
    [motor][hiss]amix=inputs=2:duration=first,volume=1.2[out]
  `.replace(/\s+/g, ' ').trim();
  try {
    execSync(`ffmpeg -y -filter_complex "${filter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${duration.toFixed(2)} "${outWavPath}" 2>/dev/null`);
  } catch {
    execSync(`ffmpeg -y -f lavfi -i "anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.01" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
  }
  return outWavPath;
}

/**
 * Build Elegant Archival Caption Slide SVG (Zero pill, museum typography, deep contrast vignette)
 */
function buildDocumentarySlideSvg(sceneText, eraText, slideIndex, totalSlides, width = 1080, height = 1920) {
  const lines = wrapTextToLines(sceneText, 24);
  const tspans = lines.map((l, i) =>
    `<tspan x="540" dy="${i === 0 ? 0 : 58}">${escapeXml(l)}</tspan>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="docVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.85" />
        <stop offset="20%" stop-color="#020617" stop-opacity="0.30" />
        <stop offset="60%" stop-color="#020617" stop-opacity="0.40" />
        <stop offset="85%" stop-color="#000000" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
      <filter id="docTextShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="1.0" />
      </filter>
    </defs>

    <!-- Top & Bottom Film Vignette Scrim -->
    <rect width="${width}" height="${height}" fill="url(#docVignette)" />

    <!-- Top Header Tag -->
    <g transform="translate(100, 120)">
      <text x="0" y="24" font-family="Georgia, serif" font-size="18" font-weight="700" fill="#f59e0b" letter-spacing="4">
        ARCHIVAL ESSAY • ${escapeXml((eraText || 'HISTORICAL RECORD').toUpperCase())}
      </text>
      <line x1="0" y1="36" x2="880" y2="36" stroke="#f59e0b" stroke-width="1.5" stroke-opacity="0.6" />
    </g>

    <!-- Center-Lower Third Text Box -->
    <g transform="translate(100, 1180)" filter="url(#docTextShadow)">
      <text x="540" y="0" font-family="Georgia, Cambria, serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.3">
        ${tspans}
      </text>
    </g>

    <!-- Bottom Documentary Credit Line -->
    <g transform="translate(100, 1680)">
      <line x1="340" y1="0" x2="540" y2="0" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.8" />
      <text x="440" y="44" font-family="Georgia, serif" font-size="18" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="2">
        CINEMA VANGUARD • PUBLIC DOMAIN ARCHIVES
      </text>
    </g>
  </svg>`;
}

/**
 * Main Generator: Build 1 Complete Archival Documentary Video (>35s)
 */
async function generateDocumentaryVideo() {
  console.log('\n===============================================================');
  console.log('🏛️ CINEMA VANGUARD: HISTORICAL ARCHIVAL DOCUMENTARY ENGINE');
  console.log('Public Domain Vaults | 35mm Projector Sound | Andrew Voiceover');
  console.log('===============================================================\n');

  // Select Deduplicated Episode
  const chosenEpisode = await selectDeduplicatedCandidate(
    'documentary_movie',
    ARCHIVAL_DOCUMENTARY_CATALOG,
    ep => ep.title,
    ep => ep.era
  );

  console.log(`[Documentary Topic Selected]: "${chosenEpisode.title}" (${chosenEpisode.era})`);

  // 1. Synthesize Voiceover Narration via Andrew Voice (slow, reflective documentary pace)
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
  const voiceDuration = parseFloat(durProbe) || 42.0;
  const totalDuration = voiceDuration + 2.0;
  console.log(`[Narration Engine] ✓ Voice synthesized: ${voiceDuration.toFixed(1)}s (Target Reel: ${totalDuration.toFixed(1)}s)`);

  // 2. Sourced Background Ambient Soundscape from Openverse / Freesound
  console.log(`[Audio Sourcing] 🎵 Resolving cinematic documentary background music for "${chosenEpisode.bgmQuery}"...`);
  let bgMusicPath = null;
  const fetchedAudio = await searchAndFetchAudio(chosenEpisode.bgmQuery, { preferredSource: 'openverse', targetDuration: totalDuration });
  if (fetchedAudio && fetchedAudio.localPath && fs.existsSync(fetchedAudio.localPath)) {
    bgMusicPath = fetchedAudio.localPath;
  }

  // Generate 35mm projector sound layer
  const projectorWav = path.join(ARTIFACTS_DIR, `projector_${Date.now()}.wav`);
  generateProjectorSoundEffectWav(projectorWav, totalDuration);

  // 3. Sourced Visual Media for Each Scene (Ken Burns Pan-and-Zoom)
  const sceneCount = chosenEpisode.scenes.length;
  const secPerScene = totalDuration / sceneCount;
  const sceneInputs = [];
  const sceneFilters = [];

  for (let i = 0; i < sceneCount; i++) {
    const sc = chosenEpisode.scenes[i];
    console.log(`[Scene ${i + 1}/${sceneCount}] Sourcing visual for: "${sc.query}"...`);

    let visual = await searchAndFetchImage(sc.query, { preferredSource: 'wikimedia' });
    if (!visual || !visual.localPath || !fs.existsSync(visual.localPath)) {
      visual = await searchAndFetchImage(sc.query, { preferredSource: 'unsplash' });
    }
    const visualPath = visual?.localPath || path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790502544405.jpg');

    // Build SVG Overlay with Text
    const slideSvg = buildDocumentarySlideSvg(sc.text, chosenEpisode.era, i + 1, sceneCount, 1080, 1920);
    const slideSvgPath = path.join(ARTIFACTS_DIR, `slide_${i}.svg`);
    const slidePngPath = path.join(ARTIFACTS_DIR, `slide_${i}.png`);
    fs.writeFileSync(slideSvgPath, slideSvg);
    execSync(`ffmpeg -y -i "${slideSvgPath}" "${slidePngPath}" 2>/dev/null`);

    // Compile Single Scene with Ken Burns Pan-and-Zoom (1080x1920 30fps)
    const sceneMp4 = path.join(ARTIFACTS_DIR, `scene_${i}.mp4`);
    const zoomDirection = i % 2 === 0 ? 'min(zoom+0.0008,1.18)' : 'max(1.18-0.0008*on,1.0)';
    const filter = `[0:v]scale=1200:2133,zoompan=z='${zoomDirection}':d=${Math.round(secPerScene * 30)}:s=1080x1920:fps=30[bg];[bg][1:v]overlay=0:0[v]`;
    execSync(`ffmpeg -y -loop 1 -t ${secPerScene.toFixed(2)} -i "${visualPath}" -loop 1 -t ${secPerScene.toFixed(2)} -i "${slidePngPath}" -filter_complex "${filter}" -map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t ${secPerScene.toFixed(2)} "${sceneMp4}" 2>/dev/null`);
    sceneInputs.push(sceneMp4);
  }

  // 4. Concatenate Scenes & Mix Multi-Track Audio (Voice + Ducked BGM + Projector Flutter)
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `documentary_movie_${timestamp}.mp4`);
  const latestMp4Path = path.join(ARTIFACTS_DIR, 'documentary_latest.mp4');

  const concatListTxt = path.join(ARTIFACTS_DIR, 'doc_scenes.txt');
  fs.writeFileSync(concatListTxt, sceneInputs.map(p => `file '${p}'`).join('\n'));
  const visualConcatMp4 = path.join(ARTIFACTS_DIR, 'doc_visual_concat.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListTxt}" -c copy "${visualConcatMp4}" 2>/dev/null || ffmpeg -y -f concat -safe 0 -i "${concatListTxt}" -c:v libx264 -preset fast -pix_fmt yuv420p "${visualConcatMp4}" 2>/dev/null`);

  // Audio Mix: Voice (1.35x), Projector (0.15x), BGM (0.14x)
  let audioInputs = `-i "${visualConcatMp4}" -i "${voiceWav}" -i "${projectorWav}" `;
  let audioFilter = `[1:a]volume=1.35,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120[voice]; [2:a]volume=0.15,atrim=0:${totalDuration.toFixed(2)}[proj]; `;

  if (bgMusicPath && fs.existsSync(bgMusicPath)) {
    audioInputs += `-i "${bgMusicPath}" `;
    audioFilter += `[3:a]volume=0.14,afade=t=in:st=0:d=2.0,afade=t=out:st=${(totalDuration - 2.0).toFixed(2)}:d=2.0,atrim=0:${totalDuration.toFixed(2)}[bgm]; [voice][proj][bgm]amix=inputs=3:duration=first:dropout_transition=2[a_final]`;
  } else {
    audioFilter += `[voice][proj]amix=inputs=2:duration=first:dropout_transition=2[a_final]`;
  }

  const finalCmd = `ffmpeg -y ${audioInputs} -filter_complex "${audioFilter}" -map 0:v -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -t ${totalDuration.toFixed(2)} "${finalMp4Path}" 2>/dev/null`;
  console.log(`[Compositor Engine] 🎬 Assembling master documentary video...`);
  execSync(finalCmd);

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 10000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`\n🎉 [Documentary Engine] SUCCESS: Rendered Video (${(fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` • Path: ${finalMp4Path}`);
  }

  // 5. Record to Deduplication Service
  await recordPostedCandidate('documentary_movie', chosenEpisode.title, chosenEpisode.era, {
    duration: totalDuration,
    archiveQuery: chosenEpisode.archiveQuery,
    timestamp
  });

  // 6. Dispatch to YouTube Channel 4 / TikTok via Buffer API 2
  const isDryRun = process.env.DRY_RUN === 'true';
  const ch4Token = process.env.YOUTUBE_REFRESH_TOKEN_CH4 || process.env.YOUTUBE_REFRESH_TOKEN_MOVIE || process.env.YOUTUBE_REFRESH_TOKEN;

  const viralTitle = `${chosenEpisode.title} (${chosenEpisode.era.split('•')[0].trim()}) #Shorts`;
  const viralDesc = `${fullNarration}\n\n🏛️ Era: ${chosenEpisode.era}\n📜 Source: Public Domain Historical Archives\n\n#CinemaVanguard #Documentary #History #Shorts`;

  if (ch4Token && !isDryRun) {
    console.log(`\n[Documentary Dispatcher] 📤 Uploading to YouTube Channel 4...`);
    try {
      await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDesc,
        tags: chosenEpisode.hashtags,
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
    title: chosenEpisode.title
  };
}

if (require.main === module) {
  generateDocumentaryVideo()
    .then(r => {
      console.log(`\n✓ Archival Documentary Pipeline Completed: "${r.title}" (${r.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error in Documentary pipeline:', err);
      process.exit(1);
    });
}

module.exports = {
  generateDocumentaryVideo,
  ARCHIVAL_DOCUMENTARY_CATALOG
};
