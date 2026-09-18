/**
 * Movie Brand Episodic Video Generator
 * 
 * Creates serialized, episodic cinematic mini-movies & thrillers for YouTube Shorts & Reels.
 * Structure:
 * - Season & Episode Continuity (Series: PROTOCOL ZERO: THE GHOST VAULT)
 * - 4-Act Cinematic Arc (Inciting Incident -> Discovery -> Confrontation -> Cliffhanger)
 * - 2.39:1 Anamorphic Letterbox styling
 * - Ken Burns camera pan/zoom motion
 * - Deep cinematic trailer voiceover with karaoke word boundary timing
 * - Curved-corner black drop box captions with ash-gray inactive and brilliant white active karaoke highlight
 * - Multi-model image generation (Cloudflare Workers AI + Pollinations FLUX)
 * - Cinematic suspense soundtrack with professional ducking
 * 
 * NOTE: Uploading is explicitly disabled by default so you can review the video creations first.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { resolveRealMusicTrack } = require('./audio_asset_manager.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'movie_episodes');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  try { fs.mkdirSync(ARTIFACTS_DIR, { recursive: true }); } catch {}
}

const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

function fetchHttpsBuffer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttpsBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP Status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

/**
 * Load Persistent Movie Universe & Character Bible
 */
function loadUniverseBible() {
  const biblePath = path.join(process.cwd(), 'movie_universe_bible.json');
  try {
    if (fs.existsSync(biblePath)) {
      return JSON.parse(fs.readFileSync(biblePath, 'utf8'));
    }
  } catch {}
  return {
    seriesId: "ghost_vault_protocol",
    seriesTitle: "PROTOCOL ZERO: THE GHOST VAULT",
    genre: "Cinematic Sci-Fi Thriller / Episodic Mini-Movie",
    artStyle: "Cinematic stylized film render, Unreal Engine 5 aesthetic, volumetric steam, dramatic shadows, sharp metallic reflections, high detail vertical 9:16 frame",
    negativePrompt: "photorealistic, real human photography, blurry, low quality, deformed anatomy, oversaturated colors, flat drawing, bad hands, distorted faces",
    protagonist: {
      name: "Dax Mercer",
      role: "Deep Subterranean Salvage Diver",
      baseSeed: 741829,
      visualAnchor: "Rugged male operative Dax Mercer, short dark cropped hair, weathered jawline, wearing a heavy charcoal-gray hydraulic pressure suit, reinforced titanium chest armor, glowing blue telemetry scanner over right eye, holding a high-powered halogen exploration torch"
    },
    environment: {
      worldName: "Sub-Level 14 Flooded Industrial Tunnels",
      visualAnchor: "Massive flooded underground railway tunnels, deep black water, rusted steel beams, dripping concrete ceiling, emergency strobe lights softly glowing in the dark, dense atmospheric mist"
    }
  };
}

/**
 * Cloudflare Workers AI Image Generation (Black Forest Labs Flux-1-Schnell or SDXL)
 */
async function generateCloudflareImage(prompt, seed = 741829) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return null;
  }
  const candidateModels = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/bytedance/stable-diffusion-xl-lightning',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ];

  for (const model of candidateModels) {
    try {
      const payloadObj = {
        prompt: `${prompt}, vertical 9:16 aspect ratio, cinematic lighting, photorealistic octane render, 8k resolution`,
        steps: model.includes('flux') ? 4 : (model.includes('lightning') ? 4 : 20),
        seed
      };
      const postData = JSON.stringify(payloadObj);

      const resBuffer = await new Promise((resolve) => {
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 20000
        }, (resp) => {
          const chunks = [];
          resp.on('data', c => chunks.push(c));
          resp.on('end', () => {
            const buf = Buffer.concat(chunks);
            if (resp.statusCode === 200) {
              try {
                const json = JSON.parse(buf.toString('utf8'));
                if (json.result?.image) {
                  return resolve(Buffer.from(json.result.image, 'base64'));
                }
              } catch {}
              if (buf.length > 5000) return resolve(buf);
            }
            resolve(null);
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (resBuffer && resBuffer.length > 8000) {
        console.log(`[Movie Generator] 🎨 Generated Act backdrop via Cloudflare AI (${model})`);
        return resBuffer;
      }
    } catch {}
  }
  return null;
}

/**
 * Resolve high-fidelity cinematic image backdrop for each Act
 * Enforces Character & Environment DNA consistency (same face, same suit, same flooded tunnel world)
 */
async function resolveActBackdropImage(act, epMeta, actIndex) {
  const safeTitle = epMeta.episodeTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const imgPath = path.join(ARTIFACTS_DIR, `${safeTitle}_act_${actIndex + 1}_3d.jpg`);
  if (fs.existsSync(imgPath) && fs.statSync(imgPath).size > 15000) {
    return imgPath;
  }

  // Check in src/assets/images for existing generated assets
  const assetDir = path.join(process.cwd(), 'src', 'assets', 'images');
  if (fs.existsSync(assetDir)) {
    const files = fs.readdirSync(assetDir);
    const keywords = [
      act.title.toLowerCase().split(' ')[0],
      actIndex === 0 ? 'descent' : actIndex === 1 ? 'vault' : actIndex === 2 ? 'footprints' : 'slam',
      'dax'
    ];
    for (const kw of keywords) {
      const match = files.find(f => f.toLowerCase().includes(kw) && f.endsWith('.jpg'));
      if (match) {
        const found = path.join(assetDir, match);
        try { fs.copyFileSync(found, imgPath); return imgPath; } catch {}
      }
    }
  }

  const bible = loadUniverseBible();
  const actAction = act.actionScene || act.visualDesc;
  const seed = (bible.protagonist?.baseSeed || 741829) + (epMeta.episode * 100) + (actIndex * 17);
  const prompt = `${bible.artStyle}, ${bible.protagonist.visualAnchor}, in ${bible.environment.visualAnchor}, ${actAction}, vertical 9:16 aspect ratio, dramatic cinematic camera angle, cinematic volumetric lighting, sharp focus`;

  // 1. Try Cloudflare Workers AI if credentials exist
  try {
    const cfBuf = await generateCloudflareImage(prompt, seed);
    if (cfBuf && cfBuf.length > 8000) {
      fs.writeFileSync(imgPath, cfBuf);
      return imgPath;
    }
  } catch {}

  // 2. Pollinations FLUX Engine fallback
  try {
    const negPrompt = encodeURIComponent(bible.negativePrompt || 'blurry, low quality');
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=flux&nologo=true&seed=${seed}&negative_prompt=${negPrompt}`;

    console.log(`[Movie Generator] 🎨 Rendering Act ${actIndex + 1} with protagonist "${bible.protagonist.name}" (Seed: ${seed})...`);
    const buf = await fetchHttpsBuffer(pollUrl, 18000);
    if (buf && buf.length > 10000) {
      fs.writeFileSync(imgPath, buf);
      return imgPath;
    }
  } catch (e) {
    console.warn(`[Movie Generator] Image generation notice for Act ${actIndex + 1}: ${e.message}`);
  }
  return null;
}

const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');

// Protocol Zero: The Ghost Vault - 3 Full Consecutive Episodes
const EPISODE_SERIES_CATALOG = [
  {
    season: 1,
    episode: 1,
    seriesTitle: "PROTOCOL ZERO: THE GHOST VAULT",
    episodeTitle: "Sub-Level 14",
    hook: "Forty feet under the city, the storm water had reached the upper rails.",
    logline: "Deep subterranean salvage diver Dax Mercer discovers that an abandoned cold war vault beneath the city subway is not empty.",
    acts: [
      {
        act: 1,
        title: "THE FLOODED DESCENT",
        narration: "Forty feet under the city. The storm water had reached the upper rails.",
        actionScene: "Dax Mercer in heavy charcoal-gray hydraulic pressure suit descending a rusted ladder into pitch-black flooded subway tracks, bright halogen torch cutting through heavy subterranean mist",
        visualDesc: "Massive flooded concrete railway tunnels, dark murky water reflecting flickering emergency worklights.",
        subtitle: "SUB-LEVEL 14 // FLOOD WATER RISING"
      },
      {
        act: 2,
        title: "UNSEALED BULKHEAD",
        narration: "Dax Mercer adjusted his helmet light. The metal hatch was unsealed. Someone was already inside.",
        actionScene: "Dax Mercer shining his halogen beam upon a massive vault bulkhead with heavy hydraulic locks freshly torched open, fresh molten metal dripping into black water",
        visualDesc: "A reinforced blast door with severed hydraulic cables, steam hissing into the dark passage.",
        subtitle: "ANOMALY: VAULT BULKHEAD COMPROMISED"
      },
      {
        act: 3,
        title: "THE SHADOWED TRACKS",
        narration: "Footprints in the gray silt led into the maintenance tunnel. Fresh footprints.",
        actionScene: "Dax Mercer raising his right-eye blue telemetry scanner, pointing his exploration torch down wet industrial tracks where heavy boot prints disturb the silt",
        visualDesc: "High-contrast dark tunnel, glowing blue scanner grid projecting across wet railway ties.",
        subtitle: "TRACKING SIGNATURE: UNKNOWN OPERATIVE"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "Behind him, the heavy steel door slammed shut. The water level began to rise.",
        actionScene: "Dax Mercer whipping around in shock as the heavy steel vault door slams into place with massive hydraulic clank, water rushing through iron floor grates",
        visualDesc: "Massive steel blast door locking tight with water churning violently at Dax Mercer's boots.",
        subtitle: "WARNING: CHAMBER SEALED // AIR LOSS IMMINENT"
      }
    ],
    tags: ['#SciFiShorts', '#GhostVault', '#MiniMovie', '#SurvivalThriller', '#EpisodicSeries', '#Shorts']
  },
  {
    season: 1,
    episode: 2,
    seriesTitle: "PROTOCOL ZERO: THE GHOST VAULT",
    episodeTitle: "The Signal in the Dark",
    hook: "You don't hear footsteps in a flooded vault. You feel the vibration in the steel.",
    logline: "Trapped in the lower drainage canal, Dax Mercer tracks a pulsing beacon that shouldn't exist.",
    acts: [
      {
        act: 1,
        title: "PRESSURE CHAMBER",
        narration: "The water was waist-deep now. Dax had twenty minutes of oxygen remaining.",
        actionScene: "Dax Mercer wading through dark waist-high flood water, glowing blue scanner blinking critical warnings, halogen torch illuminating leaking steam pipes overhead",
        visualDesc: "Narrow industrial aqueduct filled with dark water, dripping concrete ceiling with electrical conduits.",
        subtitle: "OXYGEN RESERVE: 20 MINUTES"
      },
      {
        act: 2,
        title: "THE PULSING BEACON",
        narration: "His scanner picked up a low-frequency radio signal. It was pulsing every three seconds.",
        actionScene: "Dax Mercer holding his left arm scanner to his helmet, tracking a rhythmic blue digital pulse coming from behind a reinforced steel mesh barrier",
        visualDesc: "A military-grade communications antenna glowing with rhythmic teal indicators in a submerged server alcove.",
        subtitle: "FREQUENCY DETECTED: 440 KHZ PULSE"
      },
      {
        act: 3,
        title: "THE ENCOUNTER",
        narration: "A second beam of light cut across the dark water. Someone was standing on the gantry above.",
        actionScene: "Dax Mercer taking cover behind a rusted iron pillar as a piercing halogen spotlight from the upper catwalk sweeps across the flooded surface",
        visualDesc: "A hooded operative standing on a high industrial gantry, holding a tactical suppressed carbine.",
        subtitle: "VISUAL CONTACT: UNIDENTIFIED HOSTILE"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "The stranger raised a weapon and fired. Dax dropped under the freezing water as steel sparked overhead.",
        actionScene: "Dax Mercer submerging beneath the black water as high-velocity rounds impact the iron pillar above, creating bursts of white sparks and smoke",
        visualDesc: "Underwater POV looking up through ripples as muzzle flashes illuminate the dark tunnel roof.",
        subtitle: "TO BE CONTINUED IN EPISODE 3"
      }
    ],
    tags: ['#SciFiShorts', '#ActionShorts', '#ThrillerSeries', '#GhostVault', '#MiniMovie', '#Shorts']
  },
  {
    season: 1,
    episode: 3,
    seriesTitle: "PROTOCOL ZERO: THE GHOST VAULT",
    episodeTitle: "The Core Chamber",
    hook: "The city above was sleeping. The machine below was just waking up.",
    logline: "Surfacing in the central vault room, Dax Mercer discovers what the hostile team is trying to extract.",
    acts: [
      {
        act: 1,
        title: "SURFACING",
        narration: "Dax surfaced inside a massive dry chamber. Concrete walls reinforced with lead.",
        actionScene: "Dax Mercer pulling himself up out of the flood basin onto a dry metal platform, water cascading off his titanium armor onto the diamond-plate steel floor",
        visualDesc: "Enormous subterranean bunker chamber with blast-resistant lead-lined walls and industrial generators.",
        subtitle: "BUNKER LEVEL 1: LEAD-LINED REINFORCEMENT"
      },
      {
        act: 2,
        title: "THE GHOST REACTOR",
        narration: "In the center stood a cylindrical titanium reactor. It had been running untouched for fifty years.",
        actionScene: "Dax Mercer shining his halogen beam across a towering 30-foot cylindrical titanium containment vessel with steady blue cooling fluid circulating in glass pipes",
        visualDesc: "Massive cold-war era nuclear turbine humming with steady blue luminescent coolant.",
        subtitle: "CORE STATUS: CONTINUOUS OPERATION (50 YEARS)"
      },
      {
        act: 3,
        title: "THE EXTRACTION",
        narration: "The intruder wasn't planting explosives. She was downloading the city's power grid master key.",
        actionScene: "Dax Mercer peering from behind a generator bank at the rogue operative plugging a military terminal into the reactor's primary data console",
        visualDesc: "Holographic telemetry streaming rapidly across multiple portable tactical screens.",
        subtitle: "TELEMETRY: MASTER GRID CIPHER EXTRACTION"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "She turned toward him, pulled off her tactical mask, and whispered: 'Dax? You were supposed to be dead.'",
        actionScene: "The operative lowering her tactical helmet to reveal a recognizable face with scarred cheek, staring straight at Dax Mercer in sheer disbelief",
        visualDesc: "Dramatic close-up on the operative's face as the reactor core pulses with blinding blue light.",
        subtitle: "TO BE CONTINUED IN SEASON 1 EPISODE 4"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#SciFiThriller', '#GhostVault', '#IndieFilm', '#Shorts']
  }
];

/**
 * Format milliseconds into ASS timestamp: H:MM:SS.cs
 */
function formatAssTimestamp(ms) {
  const totalSec = Math.max(0, ms) / 1000;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Build High-Impact Word-by-Word Karaoke Subtitles
 * - Centered in safe zone (MarginV 480: above YouTube handle/title/remix UI, below visual focal center)
 * - Crisp White text with bold black outline and vivid Gold/Amber highlight
 * - ZERO empty background boxes
 * - Elegant Title Hook card during first 2.5 seconds that fades out
 */
function generateKaraokeAss(words, outAssPath, epMeta, fallbackText = '', targetDurationSec = 15) {
  let cleanWords = (words || []).map(w => ({
    text: String(w.part || '').replace(/[\r\n\t]/g, '').trim(),
    startMs: Math.round(w.start),
    endMs: Math.round(w.end)
  })).filter(w => w.text.length > 0);

  // Guarantee subtitles: If word timestamps were empty, synthesize from narration text
  if (cleanWords.length === 0 && fallbackText) {
    const rawWords = fallbackText.split(/\s+/).filter(w => w.length > 0);
    const totalMs = Math.max(8000, targetDurationSec * 1000 - 1500);
    const msPerWord = totalMs / Math.max(1, rawWords.length);
    cleanWords = rawWords.map((word, idx) => ({
      text: word,
      startMs: Math.round(idx * msPerWord + 300),
      endMs: Math.round((idx + 1) * msPerWord + 250)
    }));
  }

  const lines = [];
  const wordsPerLine = 3;

  for (let i = 0; i < cleanWords.length; i += wordsPerLine) {
    const chunk = cleanWords.slice(i, i + wordsPerLine);
    if (chunk.length === 0) continue;
    const startMs = Math.max(0, chunk[0].startMs - 40);
    const endMs = chunk[chunk.length - 1].endMs + 180;
    let textK = '';
    for (const w of chunk) {
      const durCs = Math.max(8, Math.round((w.endMs - w.startMs) / 10));
      textK += `{\\k${durCs}}${w.text} `;
    }
    lines.push(`Dialogue: 0,${formatAssTimestamp(startMs)},${formatAssTimestamp(endMs)},MovieKaraoke,,0,0,0,,${textK.trim()}`);
  }

  // Add subtle hook title card at the top during first 2.5s only
  const titleLine = epMeta ? `Dialogue: 0,0:00:00.00,0:00:02.50,TitleCard,,0,0,0,,{\\fad(200,400)}${epMeta.seriesTitle.toUpperCase()} • EPISODE ${epMeta.episode}` : '';

  const assContent = `[Script Info]
Title: Protocol Zero Cinematic Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: MovieKaraoke, Liberation Sans, 52, &H0000D7FF, &H00FFFFFF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 1.4, 0, 1, 4.2, 2.0, 2, 80, 80, 480, 1
Style: TitleCard, Liberation Sans, 26, &H00E2E8F0, &H00E2E8F0, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 2.5, 0, 1, 2.0, 1.0, 8, 40, 40, 140, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${titleLine}
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Synthesize Natural Broadcast Voiceover + Word Timing Metadata
 * Uses default pitch (+0Hz) and natural speed for crisp, human speech
 */
async function synthesizeCinematicVoiceWithTiming(text, outWavPath, outAssPath, epMeta) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const tempMp3 = path.join(dir, `edge_movie_${Date.now()}.mp3`);
  const tempJson = `${tempMp3}.json`;

  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tts = new EdgeTTS({
      voice: 'en-US-ChristopherNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      saveSubtitles: true
    });

    await tts.ttsPromise(cleanText, tempMp3);

    if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 1500) {
      // Clean broadcast audio filter: warm highpass + presence + normalization
      execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=80,lowpass=f=8500,loudnorm=I=-15:TP=-1.5:LRA=9" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);

      let words = [];
      if (fs.existsSync(tempJson)) {
        try {
          words = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
        } catch {}
      }
      generateKaraokeAss(words, outAssPath, epMeta, cleanText);

      try { fs.unlinkSync(tempMp3); fs.unlinkSync(tempJson); } catch {}
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch (err) {
    console.warn(`[Movie Voice] EdgeTTS notice: ${err.message}, attempting Guy voice...`);
  }

  // Fallback to Guy voice
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      saveSubtitles: true
    });
    await tts.ttsPromise(cleanText, tempMp3);
    if (fs.existsSync(tempMp3)) {
      execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=80,lowpass=f=8500,loudnorm=I=-15:TP=-1.5:LRA=9" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      let words = [];
      if (fs.existsSync(tempJson)) {
        try { words = JSON.parse(fs.readFileSync(tempJson, 'utf8')); } catch {}
      }
      generateKaraokeAss(words, outAssPath, epMeta, cleanText);
      try { fs.unlinkSync(tempMp3); fs.unlinkSync(tempJson); } catch {}
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch {}

  // Safe fallback voiceover synthesis using espeak or standard audio
  try {
    execSync(`espeak -v en-us+m3 -s 130 -w "${outWavPath}" "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`);
    if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
      generateKaraokeAss([], outAssPath, epMeta, cleanText, 15);
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch {}

  // Last resort audio track
  execSync(`ffmpeg -y -f lavfi -i "sine=frequency=110:duration=15" -af "volume=0.01" -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  generateKaraokeAss([], outAssPath, epMeta, cleanText, 15);
  return { success: true, wavPath: outWavPath, assPath: outAssPath };
}

/**
 * Generate Warm Cinematic Orchestral Drone + Low Heartbeat Pulse
 * Harmonically rich C-minor chord with zero harsh sine waves
 */
function generateWarmCinematicSoundtrack(duration, outWavPath) {
  const padPath = `${outWavPath}_pad.wav`;
  const pulsePath = `${outWavPath}_pulse.wav`;

  // 1. Warm harmonic pad (C1 55Hz, C2 110Hz, Eb2 155.6Hz, G2 196Hz) lowpassed at 320Hz
  const padCmd = `ffmpeg -y -f lavfi -i "aevalsrc='(sin(2*PI*55*t)*0.22 + sin(2*PI*110*t)*0.16 + sin(2*PI*155.56*t)*0.10 + sin(2*PI*196*t)*0.08)':s=44100:d=${duration}" -af "lowpass=f=320,afade=t=in:ss=0:d=1.0,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(2)}:d=1.5,volume=0.12" -c:a pcm_s16le "${padPath}" 2>/dev/null`;
  
  // 2. Soft cinematic heartbeat / low throb at 60 bpm (1.0 Hz)
  const pulseCmd = `ffmpeg -y -f lavfi -i "aevalsrc='pow(max(0,sin(2*PI*1.0*t)),8)*0.25*sin(2*PI*58.0*t)':s=44100:d=${duration}" -af "lowpass=f=180,afade=t=in:ss=0:d=1.0,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(2)}:d=1.5,volume=0.14" -c:a pcm_s16le "${pulsePath}" 2>/dev/null`;

  try {
    execSync(padCmd);
    execSync(pulseCmd);
    execSync(`ffmpeg -y -i "${padPath}" -i "${pulsePath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
    try { fs.unlinkSync(padPath); fs.unlinkSync(pulsePath); } catch {}
    return outWavPath;
  } catch {
    try { fs.unlinkSync(padPath); fs.unlinkSync(pulsePath); } catch {}
    return null;
  }
}

/**
 * Main Video Generator for Movie Episode
 */
async function generateMovieEpisode(episodeIndex = 0) {
  console.log('\n======================================================');
  console.log('🎬 CINEMA VANGUARD: EPISODIC MOVIE REEL GENERATOR');
  console.log('======================================================\n');

  const epMeta = EPISODE_SERIES_CATALOG[episodeIndex % EPISODE_SERIES_CATALOG.length];
  console.log(`[Movie Generator] 📽️ Production Series: "${epMeta.seriesTitle}"`);
  console.log(`[Movie Generator] 🎞️ Episode ${epMeta.episode}: "${epMeta.episodeTitle}"`);

  // Build full narration script
  const fullNarration = epMeta.acts.map(a => a.narration).join(' ');
  console.log(`[Movie Generator] 🎙️ Narration Script (${fullNarration.length} chars)`);

  // 1. Synthesize Natural Voiceover + Word Boundary Karaoke ASS
  const voiceWav = path.join(ARTIFACTS_DIR, `movie_voice_s${epMeta.season}_e${epMeta.episode}.wav`);
  const subtitleAss = path.join(ARTIFACTS_DIR, `movie_karaoke_s${epMeta.season}_e${epMeta.episode}.ass`);
  await synthesizeCinematicVoiceWithTiming(fullNarration, voiceWav, subtitleAss, epMeta);

  let voiceDuration = 12.0;
  try {
    const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}" 2>/dev/null`).toString().trim();
    const parsed = parseFloat(durStr);
    if (!isNaN(parsed) && parsed > 2.0) voiceDuration = parsed;
  } catch {}

  const totalDuration = Math.max(10.0, Number((voiceDuration + 1.8).toFixed(2)));
  const actDuration = Number((totalDuration / epMeta.acts.length).toFixed(2));
  console.log(`[Movie Generator] ⏱️ Voice: ${voiceDuration.toFixed(2)}s -> Target Reel: ${totalDuration}s (${epMeta.acts.length} Acts x ${actDuration}s each)`);

  // 2. Build Warm, Deep Cinematic Soundtrack
  const masterWav = path.join(ARTIFACTS_DIR, `movie_master_audio_s${epMeta.season}_e${epMeta.episode}.wav`);
  const soundtrackWav = path.join(ARTIFACTS_DIR, `soundtrack_s${epMeta.season}_e${epMeta.episode}.wav`);
  
  // Check for real music track first
  let musicFile = await resolveRealMusicTrack({
    niche: 'movie',
    duration: totalDuration,
    soundUrl: process.env.MOVIE_MUSIC_URL || process.env.SOUND_URL
  });

  if (!musicFile || !fs.existsSync(musicFile)) {
    musicFile = generateWarmCinematicSoundtrack(totalDuration, soundtrackWav);
  }

  if (musicFile && fs.existsSync(musicFile)) {
    console.log(`[Movie Generator] 🎶 Ducking warm soundtrack under crystal-clear voiceover...`);
    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${musicFile}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.09,atrim=0:${totalDuration}[m];[v][m]amix=inputs=2:duration=first,loudnorm=I=-15:TP=-1.5:LRA=9[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${masterWav}" 2>/dev/null`;
    try { execSync(mixCmd); } catch { fs.copyFileSync(voiceWav, masterWav); }
  } else {
    fs.copyFileSync(voiceWav, masterWav);
  }

  // 3. Resolve Real 9:16 High-Resolution Images for Each Act
  const actImages = [];
  for (let i = 0; i < epMeta.acts.length; i++) {
    const act = epMeta.acts[i];
    const bgImg = await resolveActBackdropImage(act, epMeta, i);
    if (bgImg && fs.existsSync(bgImg) && fs.statSync(bgImg).size > 10000) {
      actImages.push(bgImg);
      console.log(`[Movie Generator] 🖼️ Act ${i + 1} Image: ${path.basename(bgImg)} (${(fs.statSync(bgImg).size / 1024).toFixed(1)} KB)`);
    } else {
      console.warn(`[Movie Generator] Act ${i + 1} image missing, using fallback...`);
      // Fallback: check other act images
      const fallback = actImages.length > 0 ? actImages[0] : null;
      if (fallback) actImages.push(fallback);
    }
  }

  if (actImages.length < epMeta.acts.length) {
    throw new Error(`Insufficient act images for episode ${epMeta.episode}`);
  }

  // 4. Assemble Full-Frame 1080x1920 Video with Distinct Cinematic Camera Choreography
  const outMp4 = path.join(ARTIFACTS_DIR, `movie_episode_s${epMeta.season}_e${epMeta.episode}.mp4`);
  console.log(`[Movie Generator] 🎥 Assembling Clean Full-Frame 1080x1920 Video (No Clutter, Dynamic Camera, Karaoke Captions)...`);

  const actFrames = Math.round(actDuration * 30);
  const escapedAss = subtitleAss.replace(/\\/g, '/').replace(/:/g, '\\:');

  // Input flags for the 4 act images
  const inputArgs = actImages.map(img => `-loop 1 -t ${actDuration} -i "${img}"`).join(' ');
  const audioInputIndex = actImages.length;

  // Cinematic choreography per act:
  // Act 1 (Descent): Smooth push-in down toward character
  // Act 2 (Bulkhead): Slow tilt down from ceiling to glowing locks
  // Act 3 (Tracks): Smooth forward tracking pan along railway
  // Act 4 (Door Slam): Dramatic tension punch-in / snap zoom
  const filterComplex = `
    [0:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,setsar=1,zoompan=z='min(zoom+0.0016,1.22)':x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih/zoom*0.35)':d=${actFrames}:s=1080x1920:fps=30,format=yuv420p[v0];
    [1:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,setsar=1,zoompan=z='min(zoom+0.0012,1.16)':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(on/${actFrames})':d=${actFrames}:s=1080x1920:fps=30,format=yuv420p[v1];
    [2:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,setsar=1,zoompan=z='min(zoom+0.0014,1.18)':x='(iw-iw/zoom)*(on/${actFrames})':y='ih*0.45-(ih/zoom*0.45)':d=${actFrames}:s=1080x1920:fps=30,format=yuv420p[v2];
    [3:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,setsar=1,zoompan=z='min(zoom+0.0028,1.28)':x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih/zoom*0.35)':d=${actFrames}:s=1080x1920:fps=30,format=yuv420p[v3];
    [v0][v1][v2][v3]concat=n=4:v=1:a=0[vconcat];
    [vconcat]ass='${escapedAss}'[vout]
  `.replace(/\s+/g, ' ');

  const renderCmd = `ffmpeg -y ${inputArgs} -i "${masterWav}" -filter_complex "${filterComplex}" -map "[vout]" -map ${audioInputIndex}:a -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k -movflags +faststart -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(renderCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Movie Generator] ✅ SUCCESS: Episode MP4 Created! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Movie Generator] 📁 Output: ${outMp4}`);
  } catch (err) {
    console.error(`[Movie Generator] Video assembly notice: ${err.message}, running standard render...`);
    const fallbackComplex = `
      [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[v0];
      [1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[v1];
      [2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[v2];
      [3:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[v3];
      [v0][v1][v2][v3]concat=n=4:v=1:a=0[vconcat];
      [vconcat]ass='${escapedAss}'[vout]
    `.replace(/\s+/g, ' ');
    const fallbackCmd = `ffmpeg -y ${inputArgs} -i "${masterWav}" -filter_complex "${fallbackComplex}" -map "[vout]" -map ${audioInputIndex}:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -movflags +faststart -shortest "${outMp4}" 2>/dev/null`;
    execSync(fallbackCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Movie Generator] ✅ Fallback render complete! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // 6. Update Manifest (DO NOT AUTO-UPLOAD per user instructions)
  const manifestEntry = {
    id: `movie_s${epMeta.season}_e${epMeta.episode}_${Date.now()}`,
    seriesTitle: epMeta.seriesTitle,
    episodeTitle: epMeta.episodeTitle,
    season: epMeta.season,
    episode: epMeta.episode,
    videoPath: outMp4,
    narration: fullNarration,
    duration: totalDuration,
    tags: epMeta.tags,
    youtubeUploadStatus: "PENDING_REVIEW (Upload hold enabled)",
    createdAt: new Date().toISOString()
  };

  let manifest = [];
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
  } catch {}
  manifest.unshift(manifestEntry);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[Movie Generator] 📝 Manifest logged to ${MANIFEST_PATH}`);
  console.log(`[Movie Generator] ⏸️ UPLOAD STATUS: HELD FOR REVIEW (Ready for your approval before live publishing)\n`);

  return manifestEntry;
}

if (require.main === module) {
  let targetIndex = 0;
  const rawInput = process.env.EPISODE_INDEX;

  if (rawInput === undefined || rawInput === '' || rawInput === 'auto') {
    // Auto-advance sequentially: check manifest for the last produced episode and select the next one
    try {
      if (fs.existsSync(MANIFEST_PATH)) {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        if (Array.isArray(manifest) && manifest.length > 0 && manifest[0].episode) {
          const lastEpisode = manifest[0].episode;
          targetIndex = lastEpisode % EPISODE_SERIES_CATALOG.length;
          console.log(`[Movie Runner] 🔄 Auto-Advancement: Last episode was Ep ${lastEpisode}. Advancing to Episode index ${targetIndex} (Ep ${EPISODE_SERIES_CATALOG[targetIndex].episode}).`);
        }
      }
    } catch (e) {
      console.warn(`[Movie Runner] Notice checking previous manifest: ${e.message}`);
    }
  } else {
    targetIndex = parseInt(rawInput, 10);
    if (isNaN(targetIndex)) targetIndex = 0;
  }

  generateMovieEpisode(targetIndex).catch(console.error);
}

module.exports = {
  generateMovieEpisode,
  loadUniverseBible,
  EPISODE_SERIES_CATALOG
};
