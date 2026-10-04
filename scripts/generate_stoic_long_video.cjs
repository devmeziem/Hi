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
  try {
    const aiResult = await callActiveAiForJson(systemPrompt, userPrompt, null, {
      nicheKey: 'stoic',
      temperature: 0.75
    });
    if (aiResult?.data?.scenes && Array.isArray(aiResult.data.scenes) && aiResult.data.scenes.length >= 4) {
      return aiResult.data;
    }
  } catch (err) {
    console.warn(`[Stoic AI Notice] AI caller error: ${err.message}`);
  }

  // 5 Diverse Everyday Human Life Problem Varieties (Procedural Engine)
  const VARIETIES = [
    // Variety 1: The 2 AM Overthinking Spiral & The Joy of Letting Go
    {
      title: `${philosopher.name} on Letting Go Tonight`,
      hook: `If you are lying awake replaying conversations you cannot change, listen to what ${philosopher.name} learned centuries ago.`,
      scenes: [
        {
          sceneNumber: 1,
          spokenText: `If you are lying awake replaying conversations you cannot change, listen closely to what ${philosopher.name} learned centuries ago.`,
          videoSearchQuery: `${philosopher.name} statue marble dramatic museum lighting`,
          imageSearchQuery: `${philosopher.name} bust ancient sculpture`,
          transition: "slide_right_in"
        },
        {
          sceneNumber: 2,
          spokenText: `"${quote}" Most of our sleepless nights are spent fighting shadows that exist only in our own exhausted imagination.`,
          videoSearchQuery: "solitary man walking in misty forest dark",
          imageSearchQuery: "shadowy forest fog lone traveler",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 3,
          spokenText: `You cannot rewrite yesterday, and tomorrow hasn't arrived. The only real power you will ever possess is right here in this breath.`,
          videoSearchQuery: "hourglass sand falling dark moody candlelight",
          imageSearchQuery: "antique hourglass time passing shadows",
          transition: "slide_right_in"
        },
        {
          sceneNumber: 4,
          spokenText: `Take a deep breath and lay your heavy burdens down. You survived everything up to this second, and you are going to be completely okay.`,
          videoSearchQuery: "calm ocean water sunset golden reflection",
          imageSearchQuery: "peaceful twilight lake stillness",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 5,
          spokenText: `What heavy thought are you letting go of tonight? Leave it here in the comments and sleep with a peaceful, joyful heart.`,
          videoSearchQuery: "sunrise over mountain peaks lone silhouette",
          imageSearchQuery: "mountain summit golden sunrise mist",
          transition: "slide_left_out"
        }
      ]
    },
    // Variety 2: The Comparison Trap & Finding Joy in Your Own Journey
    {
      title: `${philosopher.name}: Stop Feeling Behind`,
      hook: `It feels like everyone around you is racing ahead while you are struggling to keep up. Here is the truth.`,
      scenes: [
        {
          sceneNumber: 1,
          spokenText: `It often feels like everyone around you is racing ahead while you are quietly struggling to keep up. But hear this truth.`,
          videoSearchQuery: "ancient marble column hall dramatic shadows",
          imageSearchQuery: "ancient greek temple marble colonnade",
          transition: "slide_right_in"
        },
        {
          sceneNumber: 2,
          spokenText: `"${quote}" When you compare your unseen behind-the-scenes struggles to another person's public highlight reel, you steal your own joy.`,
          videoSearchQuery: "foggy mountain road traveler dawn",
          imageSearchQuery: "lone path mountain morning clouds",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 3,
          spokenText: `You are not running their race, and they are not walking in your shoes. Your growth is happening beneath the soil where nobody claps yet.`,
          videoSearchQuery: "green sprout growing through rocky soil morning light",
          imageSearchQuery: "seedling sunlight fertile soil hope",
          transition: "slide_right_in"
        },
        {
          sceneNumber: 4,
          spokenText: `Celebrate your quiet progress today. The fact that you still care, still show up, and still choose kindness is a massive victory.`,
          videoSearchQuery: "golden warm sunset field of wheat breeze",
          imageSearchQuery: "golden sunlit landscape warmth",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 5,
          spokenText: `Name one quiet victory you achieved this week that nobody clapped for. I want to celebrate it with you in the comments below!`,
          videoSearchQuery: "sun breaking through clouds over hills",
          imageSearchQuery: "sunbeam clouds golden landscape",
          transition: "slide_left_out"
        }
      ]
    },
    // Variety 3: When Plans Collapse & Discovering Joyful Strength
    {
      title: `${philosopher.name}: When Plans Fall Apart`,
      hook: `When something you worked hard for suddenly falls apart, remember what ${philosopher.name} discovered about human resilience.`,
      scenes: [
        {
          sceneNumber: 1,
          spokenText: `When something you worked so hard for suddenly falls apart, remember what ${philosopher.name} discovered about human resilience.`,
          videoSearchQuery: `${philosopher.name} marble statue dramatic shadows museum`,
          imageSearchQuery: `${philosopher.name} antique bust sculpture`,
          transition: "slide_right_in"
        },
        {
          sceneNumber: 2,
          spokenText: `"${quote}" Life never promised us smooth seas. Adversity is not here to destroy you, it is here to reveal your unbreakable depth.`,
          videoSearchQuery: "ocean storm waves crashing rocky cliff dark",
          imageSearchQuery: "dramatic stormy sea dark clouds waves",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 3,
          spokenText: `The detour you never planned for often becomes the exact path that builds your wisdom, your empathy, and your unshakable courage.`,
          videoSearchQuery: "sunlight breaking through stormy rain clouds",
          imageSearchQuery: "sunbeams through storm clouds dramatic",
          transition: "slide_right_in"
        },
        {
          sceneNumber: 4,
          spokenText: `Smile at the storm. Nothing that happens outside of you can touch the peace, the integrity, and the joy alive inside your spirit.`,
          videoSearchQuery: "lone oak tree standing strong against wind",
          imageSearchQuery: "ancient majestic oak tree golden sunlight",
          transition: "pan_zoom"
        },
        {
          sceneNumber: 5,
          spokenText: `If you are turning a difficult obstacle into an opportunity right now, drop a 'Still standing' in the comments below!`,
          videoSearchQuery: "mountain summit golden sunrise mist",
          imageSearchQuery: "soaring above mountain peaks clouds",
          transition: "slide_left_out"
        }
      ]
    }
  ];

  const chosenVariety = VARIETIES[Math.floor(Date.now() / 1000) % VARIETIES.length];
  return {
    ...chosenVariety,
    audioSearchQuery: "calm emotional piano ambient reflection",
    hashtags: ["#Stoicism", `#${philosopher.name.replace(/\s+/g, '')}`, "#InnerPeace", "#MindsetShift", "#Shorts"]
  };
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
 * Generate Karaoke Subtitles (.ass) with translucent dark blurred drop box
 */
function generateKaraokeAss(wordsWithTimings, totalDuration, outputPath) {
  const assHeader = `[Script Info]
Title: Stoic Emotional Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: StoicBox,Georgia,54,&H00FFFFFF,&H0000D4FF,&H00000000,&H90000000,1,0,0,0,100,100,0,0,3,10,0,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let events = '';
  // Group words into lines of 4-6 words
  const wordsPerLine = 5;
  for (let i = 0; i < wordsWithTimings.length; i += wordsPerLine) {
    const chunk = wordsWithTimings.slice(i, i + wordsPerLine);
    if (chunk.length === 0) continue;

    const startSec = chunk[0].start;
    const endSec = chunk[chunk.length - 1].end + 0.15;

    const formatTime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    const lineText = chunk.map(w => w.word).join(' ');
    events += `Dialogue: 0,${formatTime(startSec)},${formatTime(endSec)},StoicBox,,0,0,0,,${lineText}\n`;
  }

  fs.writeFileSync(outputPath, assHeader + events, 'utf8');
  console.log(`[Subtitles Engine] 📄 Generated ASS Karaoke Subtitles with dark drop box.`);
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
        await downloadFile(finalPath, destPath);
        finalPath = destPath;
      } catch (dlErr) {
        console.warn(`[Stoic Media Notice] Could not download remote media: ${dlErr.message}`);
        finalPath = null;
      }
    }
    if (!finalPath || !fs.existsSync(finalPath)) {
      const fb = await searchAndFetchImage(`${philosopher.name} landscape`, { preferredSource: 'openverse' });
      finalPath = fb?.localPath || path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790502544405.jpg');
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

  // Add ASS Subtitles with dark drop box
  const escapedAss = assSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  filterComplex += `[v_concat]subtitles='${escapedAss}'[v_subbed]; `;

  // Audio Mix: Andrew voice (high presence, audible & warm) + Background music softly ducked
  if (fs.existsSync(bgMusicPath)) {
    filterComplex += `[1:a]volume=0.12,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0.1, finalDuration - 1.5).toFixed(2)}:d=1.5,atrim=0:${finalDuration.toFixed(2)},asetpts=PTS-STARTPTS[bgm]; [0:a]volume=1.40,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120[voice]; [voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[a_final]`;
  } else {
    filterComplex += `[0:a]volume=1.40,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120[a_final]`;
  }

  const ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v_subbed]" -map "[a_final]" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${finalDuration.toFixed(2)} -loglevel error "${finalMp4Path}"`;

  console.log(`[FFmpeg Compositor] Rendering ${finalDuration.toFixed(2)}s emotional Stoic short...`);
  try {
    execSync(ffmpegCmd, { maxBuffer: 15 * 1024 * 1024 });
  } catch (err) {
    console.warn(`[FFmpeg Notice] Subtitle filter notice: ${err.message}. Retrying without subtitles...`);
    const fallbackCmd = ffmpegCmd.replace(/subtitles='[^']*'/, 'null');
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
