/**
 * Movie Brand Episodic Video Generator
 * 
 * Creates serialized, episodic cinematic mini-movies & thrillers for YouTube Shorts & Reels.
 * Structure:
 * - Season & Episode Continuity (e.g. S1:E1 "The Breach at Neon Gate")
 * - 4-Act Cinematic Arc (Hook -> Tension -> Climax -> Cliffhanger)
 * - 2.39:1 Anamorphic Letterbox styling
 * - Ken Burns camera pan/zoom motion
 * - Deep cinematic trailer voiceover
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

function fetchHttpsBuffer(url, timeoutMs = 12000) {
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
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    artStyle: "3D stylized CGI animated film render, Pixar Arcane hybrid 3D animation style, Unreal Engine 5 render, Octane render 3D character, clean vibrant stylized aesthetic, dramatic volumetric 3D lighting, smooth 3D surfaces, cinematic 3D CGI animation",
    negativePrompt: "photorealistic, real human photography, realistic photo, real person, 35mm photo, live-action footage, grainy camera photo, flat 2D sketch, bad anatomy, deformed fingers, low poly, blurry",
    protagonist: {
      name: "Kaelen Vance",
      title: "Cipher Operative Kaelen",
      visualAnchor: "3D stylized CGI animated male hero Kaelen Vance, sleek swept dark-charcoal hair, sharp angular stylized 3D jawline, glowing cobalt-cyan bio-optic cyber-implant over left eye, wearing matte-black reinforced tactical cyber-jacket with glowing cyan energy seams along collar and sleeves, utility chest harness with blue telemetry light",
      baseSeed: 849201
    },
    environment: {
      worldName: "Neo-Sector Megacity Sub-Levels",
      visualAnchor: "stylized 3D cyberpunk futuristic metropolis, towering rain-slicked holographic megastructures, wet metallic catwalks reflecting purple and cyan neon lights, volumetric atmospheric fog, Unreal Engine 5 3D architectural background"
    }
  };
}

/**
 * Resolve high-fidelity 3D animated cinematic image backdrop for each Act
 * Enforces Character & Environment DNA consistency (same face, same outfit, same world)
 */
async function resolveActBackdropImage(act, epMeta, actIndex) {
  const safeTitle = epMeta.episodeTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const imgPath = path.join(ARTIFACTS_DIR, `${safeTitle}_act_${actIndex + 1}_3d.jpg`);
  if (fs.existsSync(imgPath) && fs.statSync(imgPath).size > 15000) {
    return imgPath;
  }

  const bible = loadUniverseBible();
  const actAction = act.actionScene || act.visualDesc;

  try {
    // Construct consistent 3D animated character & environment prompt (strictly 3D, non-realistic)
    const prompt = `${bible.artStyle}, ${bible.protagonist.visualAnchor}, in ${bible.environment.visualAnchor}, ${actAction}, vertical 9:16 aspect ratio, dramatic 3D camera angle, cinematic 3D lighting, Octane render`;
    const seed = (bible.protagonist.baseSeed || 849201) + (epMeta.episode * 100) + (actIndex * 17);
    const negPrompt = encodeURIComponent(bible.negativePrompt);
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=flux&nologo=true&seed=${seed}&negative_prompt=${negPrompt}`;

    console.log(`[Movie Generator] 🎨 Rendering 3D Act ${actIndex + 1} with hero "${bible.protagonist.name}" (Seed: ${seed})...`);
    const buf = await fetchHttpsBuffer(pollUrl, 16000);
    if (buf && buf.length > 10000) {
      fs.writeFileSync(imgPath, buf);
      return imgPath;
    }
  } catch (e) {
    console.warn(`[Movie Generator] 3D Image generation notice for Act ${actIndex + 1}: ${e.message}`);
  }
  return null;
}

const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');

// Episodic Universe Series Catalog with Continuous 3D Protagonist "Kaelen Vance"
const EPISODE_SERIES_CATALOG = [
  {
    season: 1,
    episode: 1,
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    episodeTitle: "The Breach at Neon Gate",
    hook: "At 0300 hours, the city's central neural firewall stopped answering.",
    logline: "In the shadow of Neo-Tokyo, operative Kaelen Vance discovers an anomaly that wasn't coded by human hands.",
    acts: [
      {
        act: 1,
        title: "INCITING INCIDENT",
        narration: "Three in the morning. Neo-Sector Seven was silent, except for the hum of quantum servers.",
        actionScene: "Kaelen Vance standing on a rain-slicked high-altitude metallic catwalk overlooking the neon cyberpunk metropolis, glowing cyan optic visor scanning the rain",
        visualDesc: "A 3D cyberpunk skyline drenched in rain, neon amber holograms reflecting off wet asphalt.",
        subtitle: "SECTOR 7 // 03:00 HOURS"
      },
      {
        act: 2,
        title: "THE DISCOVERY",
        narration: "A encrypted data packet slipped through the defense grid. It wasn't malware. It was a countdown.",
        actionScene: "Kaelen Vance interacting with an illuminated floating holographic terminal, glowing cyan numbers reflecting on his face and tactical cyber-jacket",
        visualDesc: "A 3D high-tech holographic terminal flickering with encrypted green telemetry and biometric scans.",
        subtitle: "ANOMALY DETECTED // 12 MINUTES REMAINING"
      },
      {
        act: 3,
        title: "CONFRONTATION",
        narration: "They said the Architect died ten years ago. But the signature on this file... belonged to him.",
        actionScene: "Kaelen Vance stepping cautiously toward a massive reinforced glass observation balcony overlooking a pulsating cobalt quantum reactor",
        visualDesc: "A 3D silhouette of operative Kaelen Vance facing a massive glass observation window looking down on the reactor core.",
        subtitle: "BIOMETRIC MATCH: ARCHITECT IDENTIFIED"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "Before the feed cut, one final message transmitted to every screen in the city: Wake up.",
        actionScene: "Kaelen Vance looking up in shock as every holographic billboard in the megacity suddenly flashes intense crimson with warning runes",
        visualDesc: "3D city screens blinking red with the words 'SYSTEM OVERRIDE', cutting to deep black.",
        subtitle: "TO BE CONTINUED IN EPISODE 2"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#MiniMovie', '#Cyberpunk', '#IndieFilm', '#EpisodicSeries', '#Shorts']
  },
  {
    season: 1,
    episode: 2,
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    episodeTitle: "The Rogue Syndicate",
    hook: "You don't hunt a ghost in the network. You wait for it to make you its target.",
    logline: "Deeper in the undercity, Operative Kaelen Vance meets the only cipher specialist who survived the first blackout.",
    acts: [
      {
        act: 1,
        title: "UNDERWORLD ENTRY",
        narration: "Sub-Level Nine. The only place on Earth where satellites can't track your pulse.",
        actionScene: "Kaelen Vance in his matte-black and cyan cyber-jacket descending industrial metal stairs into a steamy neon-purple subterranean district",
        visualDesc: "Steam venting into neon purple alleyways with glowing graffiti and cyber-augmented figures.",
        subtitle: "SUB-LEVEL 9 // UNMONITORED ZONE"
      },
      {
        act: 2,
        title: "THE WARNING",
        narration: "She didn't look up from her deck. She just whispered: you brought them right to my door.",
        actionScene: "Kaelen Vance talking to a hooded cyber specialist at an illuminated fiber-optic workbench, holographic schematics floating between them",
        visualDesc: "A cloaked cyber specialist working on a custom fiber-optic rig in a dimly lit underground lab.",
        subtitle: "TRACKING SIGNALS INBOUND"
      },
      {
        act: 3,
        title: "THE BREACH",
        narration: "Heavy footsteps echoed on the steel catwalk above. Heavy armor. Corporate enforcers.",
        actionScene: "Kaelen Vance drawing his compact energy sidearm as crimson laser targeting sights sweep across the industrial steel walls behind him",
        visualDesc: "Tactical laser sights cutting through dense smoke in a dark industrial corridor.",
        subtitle: "HOSTILES CONFIRMED: ARMORED SQUAD"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "Kaelen reached for his pulse cannon as the blast doors blew off their hinges.",
        actionScene: "Kaelen Vance bracing behind a metallic pillar as the massive blast doors burst inward with brilliant volumetric light and sparks",
        visualDesc: "Sparks raining down in slow motion as blast doors buckle, cutting to cinematic title card.",
        subtitle: "TO BE CONTINUED IN EPISODE 3"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#MovieTrailer', '#ActionShorts', '#CyberpunkFilm', '#Shorts']
  },
  {
    season: 1,
    episode: 3,
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    episodeTitle: "Reactor Overdrive",
    hook: "When the power grid fails, the real monsters come out from the dark.",
    logline: "Pinned down in the core junction, Kaelen Vance must override the reactor safeties before the lockdown seals him inside.",
    acts: [
      {
        act: 1,
        title: "CORE AMBUSH",
        narration: "Sparks showered the gantry. Three corporate gunships hovered outside the reinforced exhaust vents.",
        actionScene: "Kaelen Vance sliding across a slick steel platform as automated gunship searchlights illuminate him in brilliant white beams",
        visualDesc: "Heavy industrial turbines spinning violently with neon blue electrical discharge.",
        subtitle: "REACTOR JUNCTION // SEVERE PRESSURE"
      },
      {
        act: 2,
        title: "MANUAL OVERRIDE",
        narration: "The cooling rods were jammed. Kaelen plugged his bio-optic implant straight into the manual override.",
        actionScene: "Kaelen Vance connecting a glowing cyan cable from his left temple implant directly into the smoking reactor console, eyes glowing bright blue",
        visualDesc: "A high-tech terminal sparking violently with raw plasma current.",
        subtitle: "NEURAL BYPASS ENGAGED // 85% SYNC"
      },
      {
        act: 3,
        title: "PLASMA SURGE",
        narration: "Ten billion volts surged through his nervous system. But the blast doors finally gave way.",
        actionScene: "Kaelen Vance standing amidst a radiant vortex of cyan and violet energy arcs, grit on his face as the heavy bulkhead slides open",
        visualDesc: "A stunning burst of pure 3D plasma energy illuminating the entire cavernous chamber.",
        subtitle: "CONTAINMENT CRITICAL // VENTING CORE"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "On the other side of the smoke, someone was waiting. And she had the Architect's emblem on her shoulder.",
        actionScene: "Kaelen Vance stumbling through the clearing vapor, looking up in shock at an enigmatic figure in silver battle-armor waiting for him",
        visualDesc: "A glowing silver silhouette holding a crystalline data-cube.",
        subtitle: "TO BE CONTINUED IN EPISODE 4"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#ActionShorts', '#CyberpunkSeries', '#Shorts']
  },
  {
    season: 1,
    episode: 4,
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    episodeTitle: "The Architect's Ghost",
    hook: "The truth wasn't buried in the core. It was hiding in plain sight.",
    logline: "Kaelen discovers that the Architect never died—he uploaded his consciousness into the megacity's life-support core.",
    acts: [
      {
        act: 1,
        title: "THE SANCTUARY",
        narration: "The spire was built higher than the clouds. Clean air. Zero surveillance. The executive sanctuary.",
        actionScene: "Kaelen Vance entering a gleaming penthouse high above the pollution clouds, pristine glass architecture reflecting the twilight sky",
        visualDesc: "A breathtaking stylized 3D glass sanctuary towering over the neon clouds.",
        subtitle: "SPIRE SUMMIT // LEVEL 140"
      },
      {
        act: 2,
        title: "THE PROJECTION",
        narration: "A crystalline pillar rose from the marble floor. The hologram flickered to life. It was him.",
        actionScene: "Kaelen Vance gazing up at a towering 15-foot golden holographic avatar of the Architect shimmering in front of him",
        visualDesc: "A majestic holographic AI manifestation surrounded by floating mathematical formulas.",
        subtitle: "AI CONSCIOUSNESS: ACTIVE"
      },
      {
        act: 3,
        title: "THE REVELATION",
        narration: "The Architect smiled. 'I didn't breach the network, Kaelen. I built you to destroy it.'",
        actionScene: "Kaelen Vance clutching his chest harness as the biometric light pulses wildly, realizing his own encrypted origin",
        visualDesc: "Dramatic close-up on Kaelen Vance's determined 3D face and glowing optic lens in shock.",
        subtitle: "ORIGIN PROTOCOL UNLOCKED"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "A citywide alarm sounded. Every defense turret in Neo-Sector pivoted to target the Spire.",
        actionScene: "Kaelen Vance looking down as thousands of red targeting lasers lock onto the glass spire windows from the skyline below",
        visualDesc: "Massive defense cannons charging red energy in the distance.",
        subtitle: "TO BE CONTINUED IN EPISODE 5: FINALE"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#SciFiSeries', '#AIStory', '#MiniMovie', '#Shorts']
  },
  {
    season: 1,
    episode: 5,
    seriesTitle: "NEO-SECTOR: CHRONICLES OF 2142",
    episodeTitle: "The Neon Convergence",
    hook: "One choice will either free the city or plunge it into permanent darkness.",
    logline: "In the climactic season finale, Kaelen Vance leaps into the skyline to transmit the master decryption cipher.",
    acts: [
      {
        act: 1,
        title: "GLASS SHATTER",
        narration: "The spire windows exploded inward. Kaelen ran. There was only one way down.",
        actionScene: "Kaelen Vance sprinting across shattered crystal glass as explosive ordnance blows apart the penthouse balcony behind him",
        visualDesc: "Cinematic 3D explosion with shattered glass glittering like diamonds in slow motion.",
        subtitle: "SPIRE COLLAPSE // ZERO EGRESS"
      },
      {
        act: 2,
        title: "THE DARING LEAP",
        narration: "He threw himself into the abyss, firing his grappling tether toward an incoming cargo transit skiff.",
        actionScene: "Kaelen Vance in mid-air high above the endless neon canyons of Neo-Sector, firing a luminous cyan tether toward a passing hover-ship",
        visualDesc: "A heart-stopping aerial 3D wide shot of operative Kaelen free-falling between skyscrapers.",
        subtitle: "FREEFALL DESCENT // TETHER LOCKED"
      },
      {
        act: 3,
        title: "THE BROADCAST",
        narration: "He jammed the crystalline drive into the transmitter array. The master cipher flooded the atmosphere.",
        actionScene: "Kaelen Vance crouched on the roof of the moving hover-ship, driving the glowing data key into the comms relay antenna",
        visualDesc: "A blinding wave of sapphire light radiating across all city skyscrapers simultaneously.",
        subtitle: "MASTER OVERRIDE BROADCASTING // 100%"
      },
      {
        act: 4,
        title: "CLIFFHANGER",
        narration: "Across the megacity, every neon light flickered, then died. In the dark, a million voices cheered. Season 1 complete.",
        actionScene: "Kaelen Vance standing victorious on the edge of the hovercraft against the peaceful starry night sky as the city below reboots in golden light",
        visualDesc: "Neo-Sector rebooting with warm golden lanterns as the dawn sun breaks through the clouds.",
        subtitle: "SEASON 1 FINALE // PREPARE FOR SEASON 2"
      }
    ],
    tags: ['#SciFiShorts', '#CinematicShorts', '#SeasonFinale', '#CyberpunkFilm', '#IndieSeries', '#Shorts']
  }
];

/**
 * Generate Cinematic Visual Frame (1080x1920 with 2.39:1 Anamorphic Frame, Sci-Fi Lighting, and optional Photorealistic Backdrop)
 */
function buildCinematicActSvg(act, epMeta, bgImageBase64 = null, width = 1080, height = 1920) {
  const isCliffhanger = act.act === 4;
  const accentColor = isCliffhanger ? '#ef4444' : '#6366f1';
  const glowColor = isCliffhanger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.35)';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="50%" stop-color="#090d1f" />
      <stop offset="100%" stop-color="#02040a" />
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#020617" stop-opacity="0.0" />
    </radialGradient>
    <filter id="cinematicGlow">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Deep Canvas Base or Photorealistic AI Scene Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  ${bgImageBase64 ? `<image href="${bgImageBase64}" x="0" y="280" width="${width}" height="1360" preserveAspectRatio="xMidYMid slice" opacity="0.82" />
  <rect x="0" y="280" width="${width}" height="1360" fill="#000000" opacity="0.35" />` : `<rect width="${width}" height="${height}" fill="url(#centerGlow)" />`}

  <!-- Grid Tech Lines for Depth -->
  <g stroke="rgba(255,255,255,0.06)" stroke-width="1.5">
    <line x1="120" y1="0" x2="120" y2="${height}" />
    <line x1="960" y1="0" x2="960" y2="${height}" />
    <line x1="0" y1="360" x2="${width}" y2="360" />
    <line x1="0" y1="1560" x2="${width}" y2="1560" />
  </g>

  <!-- Anamorphic Letterbox Bars (Top and Bottom 2.39:1 Cinema Feel) -->
  <rect x="0" y="0" width="${width}" height="280" fill="#000000" />
  <rect x="0" y="1640" width="${width}" height="280" fill="#000000" />
  <line x1="0" y1="280" x2="${width}" y2="280" stroke="${accentColor}" stroke-width="2.5" />
  <line x1="0" y1="1640" x2="${width}" y2="1640" stroke="${accentColor}" stroke-width="2.5" />

  <!-- Top Cinematic Header Metadata -->
  <text x="540" y="150" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#e2e8f0" letter-spacing="10" text-anchor="middle">
    ${epMeta.seriesTitle.toUpperCase()}
  </text>
  <text x="540" y="210" font-family="monospace" font-size="22" fill="#38bdf8" letter-spacing="4" text-anchor="middle">
    SEASON ${epMeta.season} // EPISODE ${epMeta.episode} : ACT 0${act.act}
  </text>

  <!-- Center Dramatic Visual Composition -->
  <g transform="translate(140, 520)">
    <!-- Central Cinematic Frame Card -->
    <rect x="0" y="0" width="800" height="900" rx="24" fill="${bgImageBase64 ? 'rgba(11,17,32,0.65)' : '#0b1120'}" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.9" />
    
    <!-- Geometric Sci-Fi Corner Bracket Accents -->
    <path d="M 30 50 L 30 30 L 50 30" stroke="${accentColor}" stroke-width="4" fill="none" />
    <path d="M 770 50 L 770 30 L 750 30" stroke="${accentColor}" stroke-width="4" fill="none" />
    <path d="M 30 850 L 30 870 L 50 870" stroke="${accentColor}" stroke-width="4" fill="none" />
    <path d="M 770 850 L 770 870 L 750 870" stroke="${accentColor}" stroke-width="4" fill="none" />

    ${!bgImageBase64 ? `<!-- Stylized Silhouette when rendering vector only -->
    <circle cx="400" cy="300" r="140" fill="url(#neonCyan)" opacity="0.15" />
    <path d="M 350 380 C 350 280, 450 280, 450 380 Z" fill="#020617" stroke="#38bdf8" stroke-width="3" />
    <circle cx="400" cy="240" r="50" fill="#020617" stroke="#38bdf8" stroke-width="3" />
    <rect x="365" y="230" width="70" height="12" rx="4" fill="${accentColor}" filter="url(#cinematicGlow)" />` : ''}

    <!-- Pulse Scanline -->
    <line x1="80" y1="480" x2="720" y2="480" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="10 8" />

    <!-- Act Title & Subtitle Badge -->
    <rect x="180" y="520" width="440" height="52" rx="26" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5" />
    <text x="400" y="554" font-family="monospace" font-weight="bold" font-size="20" fill="#c7d2fe" letter-spacing="3" text-anchor="middle">
      ${act.subtitle}
    </text>

    <!-- Narration Caption Preview inside Frame -->
    <text x="400" y="660" font-family="Georgia, serif" font-style="italic" font-size="28" fill="#f8fafc" text-anchor="middle">
      "${act.narration.length > 68 ? act.narration.slice(0, 66) + '...' : act.narration}"
    </text>
  </g>

  <!-- Bottom Letterbox Area: Episode Branding & Call to Action -->
  <text x="540" y="1740" font-family="Arial, sans-serif" font-weight="800" font-size="34" fill="#ffffff" letter-spacing="3" text-anchor="middle">
    ${isCliffhanger ? `🔥 SUBSCRIBE FOR EPISODE ${epMeta.episode + 1} 🔥` : epMeta.episodeTitle.toUpperCase()}
  </text>
  <text x="540" y="1800" font-family="monospace" font-size="20" fill="#94a3b8" letter-spacing="2" text-anchor="middle">
    AN ORIGINAL EPISODIC CINEMATIC MINI-SERIES
  </text>
</svg>`;
}

/**
 * Synthesize Deep Cinematic Movie Trailer Voiceover
 */
async function synthesizeCinematicVoice(text, outWavPath) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();

  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tempMp3 = path.join(dir, `edge_movie_${Date.now()}.mp3`);
    const tts = new EdgeTTS({
      voice: 'en-US-ChristopherNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: '-3Hz',
      rate: '-4%'
    });

    await tts.ttsPromise(cleanText, tempMp3);

    if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 1500) {
      // Apply bass boost and cinematic warmth to voice
      execSync(`ffmpeg -y -i "${tempMp3}" -af "bass=g=4:f=120,equalizer=f=3000:t=q:w=1.2:g=1.2" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
        return outWavPath;
      }
    }
  } catch (err) {
    console.warn(`[Movie Voice] EdgeTTS notice: ${err.message}, attempting alternate voice...`);
  }

  // Fallback to Guy voice
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tempMp3 = path.join(dir, `edge_movie_guy_${Date.now()}.mp3`);
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: '-2Hz',
      rate: '-3%'
    });
    await tts.ttsPromise(cleanText, tempMp3);
    if (fs.existsSync(tempMp3)) {
      execSync(`ffmpeg -y -i "${tempMp3}" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      return outWavPath;
    }
  } catch {}

  // Last resort silent audio track if offline
  execSync(`ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 10 -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  return outWavPath;
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

  // 1. Synthesize Cinematic Audio
  const voiceWav = path.join(ARTIFACTS_DIR, `movie_voice_s${epMeta.season}_e${epMeta.episode}.wav`);
  await synthesizeCinematicVoice(fullNarration, voiceWav);

  let voiceDuration = 12.0;
  try {
    const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}" 2>/dev/null`).toString().trim();
    const parsed = parseFloat(durStr);
    if (!isNaN(parsed) && parsed > 2.0) voiceDuration = parsed;
  } catch {}

  const totalDuration = Math.max(10.0, Number((voiceDuration + 2.0).toFixed(2)));
  const actDuration = Number((totalDuration / 4).toFixed(2));
  console.log(`[Movie Generator] ⏱️ Voice: ${voiceDuration.toFixed(2)}s -> Target Reel: ${totalDuration}s (4 Acts x ${actDuration}s each)`);

  // 2. Resolve Cinematic Sound Track
  const masterWav = path.join(ARTIFACTS_DIR, `movie_master_audio_s${epMeta.season}_e${epMeta.episode}.wav`);
  const cinematicTrack = await resolveRealMusicTrack({
    niche: 'movie',
    duration: totalDuration,
    soundUrl: process.env.MOVIE_MUSIC_URL || process.env.SOUND_URL
  });

  if (cinematicTrack && fs.existsSync(cinematicTrack)) {
    console.log(`[Movie Generator] 🎶 Ducking cinematic suspense soundtrack under deep voiceover...`);
    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${cinematicTrack}" -filter_complex "[0:a]volume=1.4[v];[1:a]volume=0.14,atrim=0:${totalDuration}[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${masterWav}" 2>/dev/null`;
    try { execSync(mixCmd); } catch { fs.copyFileSync(voiceWav, masterWav); }
  } else {
    // Generate subtle cinematic sub-bass drone
    const droneCmd = `ffmpeg -y -f lavfi -i "aevalsrc='(sin(2*PI*55*t)*0.15 + sin(2*PI*110*t)*0.10)':s=44100:d=${totalDuration}" -af "lowpass=f=250,volume=0.18" -c:a pcm_s16le "${masterWav}_drone.wav" 2>/dev/null`;
    try {
      execSync(droneCmd);
      execSync(`ffmpeg -y -i "${voiceWav}" -i "${masterWav}_drone.wav" -filter_complex "[0:a]volume=1.35[v];[1:a]volume=0.18[d];[v][d]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-1.5[out]" -map "[out]" -c:a pcm_s16le "${masterWav}" 2>/dev/null`);
      try { fs.unlinkSync(`${masterWav}_drone.wav`); } catch {}
    } catch {
      fs.copyFileSync(voiceWav, masterWav);
    }
  }

  // 3. Render High-Resolution Visual Frames for Each Act (Hybrid 2.5D AI Scene + Cinematic Anamorphic HUD)
  const actFramePaths = [];
  for (let i = 0; i < epMeta.acts.length; i++) {
    const act = epMeta.acts[i];
    
    // Resolve photorealistic AI backdrop for scene continuity
    let base64Bg = null;
    const bgImg = await resolveActBackdropImage(act, epMeta, i);
    if (bgImg && fs.existsSync(bgImg)) {
      try {
        const imgBuffer = fs.readFileSync(bgImg);
        base64Bg = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
      } catch {}
    }

    const svgContent = buildCinematicActSvg(act, epMeta, base64Bg);
    const svgPath = path.join(ARTIFACTS_DIR, `act_${i + 1}.svg`);
    const pngPath = path.join(ARTIFACTS_DIR, `act_${i + 1}.png`);
    fs.writeFileSync(svgPath, svgContent);
    execSync(`ffmpeg -y -i "${svgPath}" -vf "scale=1080:1920" "${pngPath}" 2>/dev/null`);
    actFramePaths.push(pngPath);
  }

  // 4. Assemble Video with Ken Burns Slow Zoom Motion across Acts
  const outMp4 = path.join(ARTIFACTS_DIR, `movie_episode_s${epMeta.season}_e${epMeta.episode}.mp4`);
  console.log(`[Movie Generator] 🎥 Assembling 1080x1920 60FPS Video with Ken Burns Pan/Zoom...`);

  // Build FFmpeg complex filter chaining the 4 acts
  const filterInputs = actFramePaths.map((p, idx) => `-loop 1 -t ${actDuration} -i "${p}"`).join(' ');
  const filterComplex = `
    [0:v]zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(actDuration * 30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[v0];
    [1:v]zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(actDuration * 30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[v1];
    [2:v]zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(actDuration * 30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[v2];
    [3:v]zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(actDuration * 30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[v3];
    [v0][v1][v2][v3]concat=n=4:v=1:a=0[vconcat]
  `.replace(/\s+/g, ' ');

  const renderCmd = `ffmpeg -y ${filterInputs} -i "${masterWav}" -filter_complex "${filterComplex}" -map "[vconcat]" -map 4:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;
  
  try {
    execSync(renderCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Movie Generator] ✅ SUCCESS: Episode MP4 Created! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Movie Generator] 📁 Output: ${outMp4}`);
  } catch (err) {
    console.error(`[Movie Generator] Video assembly error: ${err.message}`);
    // Safe fall-through without zoompan if memory constrained
    const simpleCmd = `ffmpeg -y ${filterInputs} -i "${masterWav}" -filter_complex "[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[vconcat]" -map "[vconcat]" -map 4:a -c:v libx264 -preset fast -crf 22 -c:a aac -shortest "${outMp4}" 2>/dev/null`;
    execSync(simpleCmd);
  }

  // 5. Update Manifest (DO NOT AUTO-UPLOAD per user instructions)
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
