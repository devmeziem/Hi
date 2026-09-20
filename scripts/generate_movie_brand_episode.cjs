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
      name: "Max Vance",
      role: "Renowned Rogue Army Contractor & Infiltration Specialist",
      baseSeed: 741829,
      visualAnchor: "Rugged operative Max Vance, cold calculating steel-gray eyes, dark hair, weathered jawline, wearing a heavy charcoal-gray tactical infiltration suit with reinforced titanium plates, tactical rebreather harness, glowing blue ocular scanner over right eye, gripping a high-intensity combat torch"
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

// Curated mapping of verified 9:16 cinematic visuals per season, episode, and act
const EPISODE_ACT_ASSET_MAP = {
  "1_1": [
    'dax_flooded_descent_1789663014118.jpg',
    'dax_unsealed_vault_1789663029664.jpg',
    'dax_fresh_footprints_1789663048583.jpg',
    'dax_beacon_signal_1789663106713.jpg',
    'dax_vault_door_slam_1789663062803.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_reactor_chamber_1789663136077.jpg',
    'dax_operative_reveal_1789663150046.jpg',
    'dax_flooded_descent_1789663014118.jpg',
    'dax_fresh_footprints_1789663048583.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_vault_door_slam_1789663062803.jpg'
  ],
  "1_2": [
    'dax_vault_door_slam_1789663062803.jpg',
    'dax_flooded_descent_1789663014118.jpg',
    'dax_fresh_footprints_1789663048583.jpg',
    'dax_beacon_signal_1789663106713.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_operative_reveal_1789663150046.jpg',
    'dax_reactor_chamber_1789663136077.jpg',
    'dax_flooded_descent_1789663014118.jpg',
    'dax_unsealed_vault_1789663029664.jpg',
    'dax_beacon_signal_1789663106713.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_vault_door_slam_1789663062803.jpg'
  ],
  "1_3": [
    'dax_reactor_chamber_1789663136077.jpg',
    'dax_operative_reveal_1789663150046.jpg',
    'dax_unsealed_vault_1789663029664.jpg',
    'dax_beacon_signal_1789663106713.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_fresh_footprints_1789663048583.jpg',
    'dax_flooded_descent_1789663014118.jpg',
    'dax_reactor_chamber_1789663136077.jpg',
    'dax_gantry_ambush_1789663121552.jpg',
    'dax_unsealed_vault_1789663029664.jpg',
    'dax_vault_door_slam_1789663062803.jpg',
    'dax_beacon_signal_1789663106713.jpg'
  ]
};

/**
 * Procedurally render a dramatic 1080x1920 cinematic frame if AI backdrops fail
 * Guarantees distinct color palette, atmospheric depth, and HUD overlays per act
 */
function generateProceduralCinematicFrame(act, epMeta, actIndex, outPath) {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const actThemes = [
    { baseColor: '#020617', accentColor: '#06b6d4', glowColor: '#0891b2', title: 'DESCENT', subtitle: 'SUB-LEVEL 14 // WATER LEVEL RISING' },
    { baseColor: '#050b14', accentColor: '#f97316', glowColor: '#ea580c', title: 'BREACH', subtitle: 'BULKHEAD 09 // PLASMA CUT CONFIRMED' },
    { baseColor: '#030712', accentColor: '#38bdf8', glowColor: '#0284c7', title: 'TRACKING', subtitle: 'TELEMETRY // COMBAT BOOT TRACKS' },
    { baseColor: '#030a16', accentColor: '#22d3ee', glowColor: '#0e7490', title: 'TURBINES', subtitle: 'AUX POWER // 12% SYSTEM RESIDUAL' },
    { baseColor: '#040d1a', accentColor: '#38bdf8', glowColor: '#0284c7', title: 'BEACON', subtitle: 'FREQUENCY // 440 KHZ PULSE DETECTED' },
    { baseColor: '#08080c', accentColor: '#a855f7', glowColor: '#9333ea', title: 'SHADOW', subtitle: 'THERMAL SCAN // BIOMETRIC CONTACT' },
    { baseColor: '#0a0d14', accentColor: '#f59e0b', glowColor: '#d97706', title: 'CONDUIT', subtitle: 'POWER DRAIN // 4.8 MEGAWATTS DRAW' },
    { baseColor: '#0b0c16', accentColor: '#06b6d4', glowColor: '#0891b2', title: 'BROADCAST', subtitle: 'DECRYPTED // PROTOCOL ZERO ACTIVE' },
    { baseColor: '#120707', accentColor: '#ef4444', glowColor: '#dc2626', title: 'PRESSURE', subtitle: 'PRESSURE // CRITICAL OVERPRESSURE' },
    { baseColor: '#100a06', accentColor: '#f97316', glowColor: '#ea580c', title: 'TRIPWIRE', subtitle: 'WARNING // CONCEALED EXPLOSIVE' },
    { baseColor: '#0f0505', accentColor: '#dc2626', glowColor: '#b91c1c', title: 'AMBUSH', subtitle: 'LOCK-ON // TARGET ACQUIRED' },
    { baseColor: '#0a0505', accentColor: '#e11d48', glowColor: '#be123c', title: 'CONTAINMENT', subtitle: 'ALERT // CHAMBER SEALED // WATER SURGING' }
  ];
  const theme = actThemes[actIndex % actThemes.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <radialGradient id="tunnelGlow" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${theme.glowColor}" stop-opacity="0.35" />
        <stop offset="60%" stop-color="${theme.baseColor}" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#000000" stop-opacity="1" />
      </radialGradient>
      <linearGradient id="waterShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="70%" stop-color="${theme.accentColor}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="#000000" />
    <rect width="1080" height="1920" fill="url(#tunnelGlow)" />
    
    <!-- Heavy Industrial Subway Beams & Grid -->
    <g stroke="rgba(255,255,255,0.08)" stroke-width="2">
      <line x1="140" y1="0" x2="340" y2="1920" />
      <line x1="940" y1="0" x2="740" y2="1920" />
      <line x1="0" y1="400" x2="1080" y2="400" />
      <line x1="0" y1="800" x2="1080" y2="800" />
      <line x1="0" y1="1200" x2="1080" y2="1200" />
      <line x1="0" y1="1600" x2="1080" y2="1600" />
    </g>

    <!-- Subterranean Water Surface -->
    <rect x="0" y="1100" width="1080" height="820" fill="url(#waterShine)" />

    <!-- Central Tactical Scanner Crosshair -->
    <g transform="translate(540, 720)">
      <circle cx="0" cy="0" r="140" fill="none" stroke="${theme.accentColor}" stroke-width="2.5" stroke-dasharray="14 10" />
      <circle cx="0" cy="0" r="8" fill="${theme.accentColor}" />
      <line x1="-190" y1="0" x2="190" y2="0" stroke="${theme.accentColor}" stroke-width="1.5" stroke-dasharray="6 6" />
      <line x1="0" y1="-190" x2="0" y2="190" stroke="${theme.accentColor}" stroke-width="1.5" stroke-dasharray="6 6" />
    </g>

    <!-- Tactical HUD Banner -->
    <g transform="translate(80, 240)">
      <rect x="0" y="0" width="920" height="80" rx="14" fill="rgba(2,6,23,0.85)" stroke="${theme.accentColor}" stroke-width="2" />
      <text x="36" y="50" font-family="'Courier New', monospace" font-weight="bold" font-size="28" fill="${theme.accentColor}" letter-spacing="3">
        SEC_${actIndex + 1} // ${theme.title}
      </text>
      <text x="884" y="50" font-family="'Courier New', monospace" font-size="20" fill="#94a3b8" text-anchor="end">
        MAX_VANCE // PROTOCOL ZERO
      </text>
    </g>

    <!-- Act Action Description Display -->
    <g transform="translate(80, 1500)">
      <rect x="0" y="0" width="920" height="110" rx="14" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="36" y="44" font-family="'Courier New', monospace" font-size="20" fill="${theme.accentColor}" font-weight="bold">
        STATUS: ${theme.subtitle}
      </text>
      <text x="36" y="80" font-family="sans-serif" font-size="22" fill="#e2e8f0">
        ${act.title.toUpperCase()} • ACT ${actIndex + 1}
      </text>
    </g>
  </svg>`;

  const tempSvgPath = `${outPath}.svg`;
  fs.writeFileSync(tempSvgPath, svg, 'utf8');
  execSync(`ffmpeg -y -i "${tempSvgPath}" -vf "format=yuv420p" "${outPath}" 2>/dev/null`);
  try { fs.unlinkSync(tempSvgPath); } catch {}
  return outPath;
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

  // 1. Direct Curated Asset Mapping (Highest visual quality, 100% character continuity)
  const mapKey = `${epMeta.season}_${epMeta.episode}`;
  const assetDir = path.join(process.cwd(), 'src', 'assets', 'images');
  if (EPISODE_ACT_ASSET_MAP[mapKey] && fs.existsSync(assetDir)) {
    const assetFilename = EPISODE_ACT_ASSET_MAP[mapKey][actIndex];
    if (assetFilename) {
      const candidatePath = path.join(assetDir, assetFilename);
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).size > 20000) {
        try {
          fs.copyFileSync(candidatePath, imgPath);
          console.log(`[Movie Generator] 🎯 Matched curated cinematic asset for Act ${actIndex + 1}: ${assetFilename}`);
          return imgPath;
        } catch {}
      }
    }
  }

  // 2. Keyword fallback in asset directory
  if (fs.existsSync(assetDir)) {
    const files = fs.readdirSync(assetDir);
    const keywords = [
      act.title.toLowerCase().split(' ')[0],
      actIndex === 0 ? 'descent' : actIndex === 1 ? 'vault' : actIndex === 2 ? 'footprints' : 'slam'
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

  // 3. Try Cloudflare Workers AI if credentials exist
  try {
    const cfBuf = await generateCloudflareImage(prompt, seed);
    if (cfBuf && cfBuf.length > 8000) {
      fs.writeFileSync(imgPath, cfBuf);
      return imgPath;
    }
  } catch {}

  // 4. Pollinations FLUX Engine fallback (with strict 14s timeout)
  try {
    const negPrompt = encodeURIComponent(bible.negativePrompt || 'blurry, low quality');
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=flux&nologo=true&seed=${seed}&negative_prompt=${negPrompt}`;

    console.log(`[Movie Generator] 🎨 Rendering Act ${actIndex + 1} with protagonist "${bible.protagonist.name}" (Seed: ${seed})...`);
    const buf = await fetchHttpsBuffer(pollUrl, 14000);
    if (buf && buf.length > 10000) {
      fs.writeFileSync(imgPath, buf);
      return imgPath;
    }
  } catch (e) {
    console.warn(`[Movie Generator] Image generation notice for Act ${actIndex + 1}: ${e.message}`);
  }

  // 5. Guaranteed Procedural Cinematic Frame (NEVER duplicate previous act images!)
  console.log(`[Movie Generator] ⚡ Rendering dedicated procedural cinematic frame for Act ${actIndex + 1}...`);
  return generateProceduralCinematicFrame(act, epMeta, actIndex, imgPath);
}

const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');

// Protocol Zero: The Ghost Vault - 3 Full Consecutive Episodes (12 Scenes x 15s = 180s / 3 Minutes each)
const EPISODE_SERIES_CATALOG = [
  {
    season: 1,
    episode: 1,
    seriesTitle: "PROTOCOL ZERO: THE GHOST VAULT",
    episodeTitle: "Sub-Level 14",
    hook: "The higher the payout, the darker the grave. I was given twenty million dollars and one absolute rule: Never open Vault Door Seven.",
    logline: "Renowned former rogue army contractor Max Vance accepts an off-the-books extraction contract in an abandoned underground research facility, only to discover the forbidden vault door had already been forced open from the inside.",
    acts: [
      {
        act: 1,
        title: "THE ROGUE OPERATIVE",
        cameraMotion: "zoom_in",
        narration: "Before you take a twenty-million-dollar contract from an anonymous handler, remember this: the higher the payout, the darker the grave. I am Max. For twelve brutal years, I was a renowned operative in a rogue army black-ops unit. When a mission had to be erased from existence, they called me. I took the dirty, suicidal jobs nobody else had the stomach for... and I always survived.",
        actionScene: "Max Vance standing in a dark rain-swept industrial alleyway, heavy charcoal-gray tactical infiltration armor, glowing blue ocular scanner over his right eye, cigarette smoke drifting through neon-lit mist",
        visualDesc: "Cinematic high-contrast frame of hardened operative Max Vance, tactical ballistic vest with titanium plates, rain reflections.",
        subtitle: "OPERATIVE: MAX VANCE // RECORD CLASSIFIED"
      },
      {
        act: 2,
        title: "THE MIDNIGHT DELIVERY",
        cameraMotion: "pan_left",
        narration: "Then three nights ago, the delivery arrived at my safehouse door. No return address, no digital footprint. Inside lay a cold titanium courier cylinder, twenty million dollars in untraceable bearer bonds, and a black military data slate stamped with classified ciphers.",
        actionScene: "Close-up of Max Vance's armored gloved hands unsealing a cold titanium courier tube on a weathered steel workbench, cyan biometric light scanning his fingerprints over stacks of black military bonds",
        visualDesc: "High-tech military courier container open on table, glowing cryptographic slate displaying classified dossier.",
        subtitle: "PRIORITY CONTRACT // $20M UNTRACEABLE"
      },
      {
        act: 3,
        title: "THE FORGOTTEN COMPLEX",
        cameraMotion: "pan_right",
        narration: "The work was clear: descend forty feet beneath the metropolis into an abandoned Soviet-era research bunker known as Sub-Level 14. Recover a classified quantum telemetry drive left behind during the 1989 evacuation. But the contract carried one strict directive.",
        actionScene: "Holographic tactical wireframe schematic of subterranean transit lines and forgotten research bunker glowing cyan above Max's table, highlighting a deep subterranean chamber 40 feet underground",
        visualDesc: "Tactical tunnel schematic showing underground levels beneath subway tracks, red route highlighting Sub-Level 14.",
        subtitle: "TARGET // RESEARCH SUB-LEVEL 14"
      },
      {
        act: 4,
        title: "THE CARDINAL RULE",
        cameraMotion: "zoom_out",
        narration: "The encrypted audio was dead and robotic: 'Take the drive, Max. But whatever you do, whatever you hear calling your name through the ventilation shafts, under no circumstances must you ever approach, touch, or open Vault Door Seven.'",
        actionScene: "Encrypted data slate flashing stark crimson warning text: 'RULE ZERO: DO NOT UNLOCK VAULT DOOR 7 UNDER ANY CIRCUMSTANCES', red ambient glow reflecting off Max Vance's cold, calculating expression",
        visualDesc: "Grim warning terminal display, high contrast red emergency lighting illuminating Max's scarred jawline.",
        subtitle: "MANDATE // DO NOT TOUCH VAULT 7"
      },
      {
        act: 5,
        title: "THE FLOODED DESCENT",
        cameraMotion: "pan_left",
        narration: "Midnight storm runoff had flooded the subterranean railway lines when I pried open the maintenance grate beneath Track Four. Stepping down forty feet of rusted iron rungs into freezing waist-deep water, the stench of river silt and chemical coolant filled my rebreather.",
        actionScene: "Max Vance in full charcoal-gray pressurized tactical dive suit descending an iron ladder into pitch-black flooded subway tracks, his halogen combat torch slicing through thick fog and murky runoff water",
        visualDesc: "Massive flooded concrete railway tunnels, dark murky water reflecting flickering emergency worklights.",
        subtitle: "DESCENT // -40FT BELOW TRANSIT GRID"
      },
      {
        act: 6,
        title: "THE SEVERED WIRES",
        cameraMotion: "zoom_in",
        narration: "As my combat boots hit the submerged track bed, my ocular scanner locked onto heavy high-voltage orange conduits humming along the ceiling. This forgotten research facility wasn't dead. Someone had restored auxiliary power hours before I arrived.",
        actionScene: "Max Vance wading through waist-deep murky water, holding his torch toward overhead steel girders where thick orange electrical busbars hum with visible electromagnetic ionization",
        visualDesc: "Industrial power conduits glowing faint amber, moisture sizzling against high-voltage cables above black floodwater.",
        subtitle: "AUXILIARY POWER // 4.8 MEGAWATTS ACTIVE"
      },
      {
        act: 7,
        title: "THE BREACHED THRESHOLD",
        cameraMotion: "pan_right",
        narration: "I waded through the dark current to the containment barrier marking Sector Zero. Stenciled across the peeling steel was Vault Door Seven. But my blood ran cold. The rule had already been broken... the eight-ton blast door was standing wide open.",
        actionScene: "High-contrast shot of Vault Door 7 looming ahead in the cavernous tunnel, its massive three-foot-thick steel door swung ajar into the blackness, dark water rippling outward into the forbidden chamber",
        visualDesc: "Massive steel blast door standing open in pitch black, water swirling through the portal, halogen beam cutting inside.",
        subtitle: "BREACH CONFIRMED // VAULT 7 WIDE OPEN"
      },
      {
        act: 8,
        title: "THE CLAW TRENCHES",
        cameraMotion: "zoom_out",
        narration: "I swept my tactical halogen beam across the frame. The three-foot solid steel locking pins hadn't been picked, and no plasma torch had touched them. The reinforced bulkhead had been violently forced open from the inside... with four-inch claw trenches gouged into the solid iron floor.",
        actionScene: "Max Vance's halogen beam illuminating deep violent gouges in the reinforced titanium floor plating, hydraulic locks sheared outward like twisted tinfoil, green bioluminescent fluid dripping into the black water",
        visualDesc: "Extreme close-up of torn steel edges and massive claw marks etched into solid metal floor plating under water.",
        subtitle: "ANALYSIS // FORCED FROM INSIDE"
      },
      {
        act: 9,
        title: "THE 440 HZ HEARTBEAT",
        cameraMotion: "pan_left",
        narration: "My wrist terminal crackled through static. An encrypted telemetry pulse was transmitting at 440 kilohertz—the exact frequency of an active synthetic bio-neural core. It was pulsing like a massive mechanical heartbeat every three seconds, right inside the open vault.",
        actionScene: "Max raising his armored wrist terminal, displaying a rhythmic audio waveform and biometric proximity radar pulsing with crimson spikes, reflecting in his suit's cobalt eye piece",
        visualDesc: "Submerged communications terminal with glowing cyan indicators, bubbles rising through flooded server racks.",
        subtitle: "AUDIO RADAR // 440 KHZ BIO-SYNTHETIC PULSE"
      },
      {
        act: 10,
        title: "THE POINT OF NO RETURN",
        cameraMotion: "zoom_in",
        narration: "Twenty million dollars. Every survival instinct told me to turn back. But my hand unholstered my suppressed sidearm, and I pushed forward through the black water. The second my boots crossed the threshold of Vault Seven, the floor gave a sickening hydraulic groan.",
        actionScene: "Max Vance stepping across the threshold of Vault 7, suppressed pistol drawn with tactical light aimed forward into cavernous shadows, dark water swirling around his combat boots",
        visualDesc: "Tense medium shot of Max entering the dark chamber, weapon raised, water parting around armored knees.",
        subtitle: "WARNING // POINT OF NO RETURN"
      },
      {
        act: 11,
        title: "THE CONTAINMENT SLAM",
        cameraMotion: "pan_right",
        narration: "Behind me, the ceiling shuddered violently. Massive magnetic locks engaged with a blinding electrical arc. The eight-ton tungsten blast door slammed shut with thunderous, deafening finality, severing my radio link and plunging the corridor into pitch black.",
        actionScene: "Massive blast door crashing down violently behind Max, throwing up a huge wave of black water and blinding electrical sparks, locking into place with deafening pneumatic hissing",
        visualDesc: "Massive steel blast door locking tight with water churning violently, red emergency alarm strobe flashing.",
        subtitle: "CRITICAL // BLAST DOOR SEALED BEHIND"
      },
      {
        act: 12,
        title: "TRAPPED IN SECTOR ZERO",
        cameraMotion: "zoom_in",
        narration: "The drainage pumps suddenly died. Freezing floodwater began surging past my chest. And as my torch flickered back to life, two burning amber optical sensors ignited on the gantry thirty feet above me. The client hadn't hired me to retrieve a drive. I was the live bait.",
        actionScene: "Max Vance submerged to his chest in dark swirling water, looking up with his torch beam illuminated in mist, catching two ominous glowing amber optic lenses staring down from the steel gantry above",
        visualDesc: "Ominous amber glowing eyes staring from overhead shadows, water rising rapidly around Max's armored chest plate.",
        subtitle: "ALERT: TRAPPED WITH THE ENTITY // TO BE CONTINUED IN EPISODE 2"
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
    logline: "Trapped in the rising flood of Sub-Level 14, Max Vance fights his way through submerged aqueducts to uncover the entity and the rogue syndicate that engineered his contract.",
    acts: [
      {
        act: 1,
        title: "SEALED IN THE DEEP",
        cameraMotion: "zoom_in",
        narration: "Trapped beneath eight thousand tons of reinforced granite. The flood water was rising six inches every minute. My rebreather gauge showed eighteen minutes of compressed oxygen before total suffocation.",
        actionScene: "Max Vance submerged up to his chest in dark floodwater, telemetry visor flashing red decompression warnings as water rushes through overhead grates",
        visualDesc: "Subterranean chamber filling with black water, floating industrial debris, halogen torch beam reflecting underwater.",
        subtitle: "DRAINAGE FAILURE // 18 MIN OXYGEN"
      },
      {
        act: 2,
        title: "THE BREACHED GRATE",
        cameraMotion: "pan_left",
        narration: "I unholstered my high-pressure pneumatic plasma torch. Submerging beneath the surface, I sliced through the iron ventilation grate, slipping my armor into the auxiliary drainage intake.",
        actionScene: "Max Vance using a high-intensity pneumatic cutting torch underwater, bright orange sparks illuminating flooded steel ventilation bars",
        visualDesc: "Underwater cutting sparks, molten metal bubbles floating upward, severed iron bars falling into silt.",
        subtitle: "VENTILATION DUCT // AUXILIARY ACCESS"
      },
      {
        act: 3,
        title: "THE COLD CURRENT",
        cameraMotion: "pan_right",
        narration: "The current pulled me violently downstream through the darkness into a subterranean canal built during the Cold War. The velocity slammed my shoulder plates against concrete reinforcement ribs.",
        actionScene: "Max Vance navigating a high-speed underground canal, gripping concrete reinforcement ribs as torrents of dark water push past his suit",
        visualDesc: "Narrow arched aqueduct, fast-moving dark current, concrete walls marked with faded civil defense stencils.",
        subtitle: "CANAL 4 // FLOW VELOCITY 8 KNOTS"
      },
      {
        act: 4,
        title: "THE BLACK RESERVOIR",
        cameraMotion: "zoom_out",
        narration: "I surfaced into an enormous subterranean reservoir. The vaulted ceiling arched fifty feet above, lost in thick sulfurous vapor. Stagnant black water stretched into the void.",
        actionScene: "Max Vance emerging from the calm black surface of an enormous subterranean reservoir, helmet lights casting long beams across the mist",
        visualDesc: "Vast subterranean lake beneath the city, ancient stone retaining walls, silent echoing cavern.",
        subtitle: "RESERVOIR // ATMOSPHERE TOXIC"
      },
      {
        act: 5,
        title: "THE OPERATIVE'S RAFT",
        cameraMotion: "pan_left",
        narration: "Across the glassy water drifted a matte-black tactical Zodiac raft, tied to a submerged pipeline with military paracord. The engine was still warm to the touch.",
        actionScene: "Tactical matte-black Zodiac raft tied to industrial pipe fittings, loaded with pelican cases and satellite transceivers",
        visualDesc: "Black inflatable boat illuminated by green radio status indicators floating on glassy dark water.",
        subtitle: "ASSET DETECTED // TACTICAL ZODIAC"
      },
      {
        act: 6,
        title: "THE SATELLITE UPLINK",
        cameraMotion: "zoom_in",
        narration: "Onboard sat an active phased-array uplink. It was beaming gigabytes of classified telemetry to an offshore syndicate server. The file header read: Protocol Zero - Containment Transfer.",
        actionScene: "Max Vance inspecting a glowing satellite uplink console mounted on the raft, data lines streaming rapidly in green phosphor",
        visualDesc: "Phased-array military satellite dish, blinking data transceivers, encrypted file transfer progress bar.",
        subtitle: "DATA TRANSMISSION // MIL-SAT 7"
      },
      {
        act: 7,
        title: "THE HOSTILE DIVER",
        cameraMotion: "pan_right",
        narration: "A sudden sound of bubbles broke the silence behind me. A black-clad diver wearing military rebreather gear lunged from the deep with a titanium combat knife aimed at my jugular.",
        actionScene: "Hostile diver in black military wetsuit and closed-circuit rebreather bursting from the water, combat knife gleaming in halogen light",
        visualDesc: "Dramatic close combat attack in subterranean water, spray freezing in flashlight glare, knife reflection.",
        subtitle: "PROXIMITY WARNING // HOSTILE DIVER"
      },
      {
        act: 8,
        title: "UNDERWATER STRUGGLE",
        cameraMotion: "zoom_in",
        narration: "We tumbled beneath the surface into zero visibility. I planted my heel against the submerged conduit, twisted his wrist, and ripped his high-pressure oxygen regulator clean off his harness.",
        actionScene: "Underwater CQC struggle, Max Vance wrenching the hostile operative's high-pressure rebreather hose, air bubbles clouding the frame",
        visualDesc: "Violent underwater vortex, tactical knife dropping into the abyss, bubbles illuminated by suit telemetry.",
        subtitle: "CQC // THREAT NEUTRALIZED"
      },
      {
        act: 9,
        title: "THE RECOVERED KEYCARD",
        cameraMotion: "zoom_out",
        narration: "From the diver's tactical vest, I recovered an encrypted biometric keycard stamped with a crimson phoenix emblem. It matched the cipher format on my twenty-million-dollar contract.",
        actionScene: "Close-up of Max Vance's armored glove holding a blackened titanium security card with a laser-etched crimson phoenix insignia",
        visualDesc: "High-security cipher keycard reflecting cyan HUD light, water dripping from carbon-fiber weave vest.",
        subtitle: "ITEM SECURED // PHOENIX CIPHER KEY"
      },
      {
        act: 10,
        title: "THE VOLTAGE SPIKE",
        cameraMotion: "pan_left",
        narration: "Suddenly, the severed electrical conduits pulsed with ungodly voltage. A wave of electric blue light washed down the canal, illuminating a reinforced blast door thirty yards away.",
        actionScene: "Electric blue arcs snapping between industrial busbars, throwing long violent shadows toward a hidden reinforced doorway",
        visualDesc: "Industrial canal wall illuminated by high-voltage sparks, showing heavy blast door hinges hidden behind vines of cables.",
        subtitle: "PRIMARY CONDUIT // VOLTAGE SPIKE"
      },
      {
        act: 11,
        title: "THE REACTOR ACCESS",
        cameraMotion: "pan_right",
        narration: "I pressed the stolen keycard against the reader. The heavy hydraulic locking bolts disengaged with a mechanical hiss that echoed through the cavern.",
        actionScene: "Max Vance swiping the keycard into a heavy wall-mounted terminal, yellow confirmation LED switching to deep emerald green",
        visualDesc: "Heavy vault latch mechanisms sliding back, pressurized air escaping around the steel portal.",
        subtitle: "ACCESS GRANTED // REACTOR VAULT"
      },
      {
        act: 12,
        title: "THE REVELATION",
        cameraMotion: "zoom_in",
        narration: "The blast door swung wide, revealing an enormous chamber bathed in eerie cobalt Cherenkov glow. And standing at the master console was the man who sent the contract.",
        actionScene: "Heavy door swinging open into a glowing blue reactor hall, silhouetting a commander in naval officer fatigue staring straight back at Max",
        visualDesc: "Cobalt nuclear glow filling the doorway, reflection on Max's visor, shocking character reveal in the shadows.",
        subtitle: "SYSTEMS CRITICAL // TO BE CONTINUED IN EPISODE 3"
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
    logline: "In the heart of the subterranean facility, Max Vance confronts his former black-ops commander before an orbital EMP grid permanently blacks out the continent.",
    acts: [
      {
        act: 1,
        title: "INSIDE THE SANCTUM",
        cameraMotion: "zoom_out",
        narration: "A monolithic titanium sphere was suspended over an abyssal coolant pit. Dynamos roared with terrifying power. This was the Ghost Vault's beating heart.",
        actionScene: "Enormous titanium spherical reactor housing suspended by heavy steel cables over a luminous turquoise coolant pool",
        visualDesc: "Futuristic Cold War subterranean facility, towering catwalks, coolant mist swirling over deep water.",
        subtitle: "CORE SPHERE // SECTOR ZERO"
      },
      {
        act: 2,
        title: "THE FAMILIAR FACE",
        cameraMotion: "zoom_in",
        narration: "Commander Vance turned slowly from the master console. My former squad commander, presumed dead in the North Sea three years ago. The man who taught me how to kill.",
        actionScene: "Commander Vance, weathered face with cybernetic right eye, standing at the master console wearing tactical black uniform",
        visualDesc: "High-contrast dramatic lighting on Vance's cold, calculated expression, reactor glow reflecting off his cybernetic eye.",
        subtitle: "IDENTITY CONFIRMED // VANCE, M."
      },
      {
        act: 3,
        title: "THE COLD MOTIVE",
        cameraMotion: "pan_left",
        narration: "'They threw us away, Max,' Vance's voice echoed over the turbine scream. 'This reactor doesn't power the city. It powers an orbital EMP grid designed to wipe clean the modern world.'",
        actionScene: "Holographic orbital trajectory projection showing satellites aligning over the continent, casting amber light across the gantry",
        visualDesc: "Tactical wireframe globe glowing in mid-air, showing EMP blast radiuses expanding over major cities.",
        subtitle: "PAYLOAD DECRYPT // ORBITAL EMP"
      },
      {
        act: 4,
        title: "THE COUNTDOWN",
        cameraMotion: "pan_right",
        narration: "On the terminal screen, the countdown read three minutes to global synchronization. The satellite uplink was locked. It could not be aborted from the software.",
        actionScene: "Digital master countdown display flashing '02:59:44' in stark crimson, terminal locked with military cipher key",
        visualDesc: "Console monitors flashing red alert banners, warning sirens casting rhythmic crimson light sweeps across the room.",
        subtitle: "SYNC T-MINUS 180 SECONDS"
      },
      {
        act: 5,
        title: "SNIPERS ON THE CATWALK",
        cameraMotion: "zoom_in",
        narration: "A red laser painted across my visor. Vance had two sniper mercenaries perched on the high crane gantry, their rifles locked directly onto my chest.",
        actionScene: "Overhead crane girder where two black-clad tactical marksmen aim suppressed rifles downward, laser sights crisscrossing the hall",
        visualDesc: "Dramatic vertical angle looking up past steel trusses, multiple laser targeting beams piercing through coolant fog.",
        subtitle: "SNIPER LOCK // OVERHEAD GANTRY"
      },
      {
        act: 6,
        title: "FLASHBANG IN THE FOG",
        cameraMotion: "pan_left",
        narration: "I drew a white phosphorus grenade from my belt and hurled it into the mist. The blinding explosion overloaded the snipers' night-vision optics in an instant.",
        actionScene: "Blinding magnesium flare exploding in the subterranean fog, creating overwhelming white illumination and long jagged shadows",
        visualDesc: "Intense white flare light reflecting off wet steel, snipers on the catwalk recoiling from optic overload.",
        subtitle: "OPTIC DISRUPTION // FLARE DEPLOYED"
      },
      {
        act: 7,
        title: "THE GANTRY SPRINT",
        cameraMotion: "pan_right",
        narration: "Suppressed rounds chewed through the steel grating beneath my feet. I sprinted through the sparks, vaulting over the coolant rail toward the manual breaker tower.",
        actionScene: "Max Vance sprinting along narrow metal catwalk under heavy rifle fire, bullet impacts throwing orange sparks off the handrails",
        visualDesc: "Dynamic action camera, motion blur on sprinting armor, sparks raining down into the turquoise coolant pool below.",
        subtitle: "TACTICAL SPRINT // FIRE UNDERWAY"
      },
      {
        act: 8,
        title: "THE MANUAL OVERRIDE",
        cameraMotion: "zoom_out",
        narration: "The manual emergency SCRAM switch sat fifty feet above, encased behind reinforced ballistic glass. It was the only way to physically drop the control rods.",
        actionScene: "Towering vertical emergency access ladder leading to an elevated control pulpit with bright red SCRAM lever",
        visualDesc: "High vertical shot showing the extreme height of the reactor chamber and the solitary emergency switch platform.",
        subtitle: "SCRAM LEVER // 50FT ELEVATION"
      },
      {
        act: 9,
        title: "THE CATWALK FIGHT",
        cameraMotion: "zoom_in",
        narration: "Vance intercepted me on the catwalk. Two seasoned black-ops veterans trading bone-shattering strikes forty feet above a boiling vortex of coolant.",
        actionScene: "Max Vance and Commander Vance locked in brutal hand-to-hand combat on a narrow suspended steel bridge above the glowing reactor pit",
        visualDesc: "High-stakes hand-to-hand melee, titanium armor clashing, coolant water boiling violently forty feet below.",
        subtitle: "MELEE ENGAGEMENT // CORE GANTRY"
      },
      {
        act: 10,
        title: "SHATTERED GLASS",
        cameraMotion: "pan_left",
        narration: "I took the full impact of Vance's carbon-fiber strike, using his momentum to smash my titanium elbow through the reinforced breaker housing.",
        actionScene: "Max Vance smashing the reinforced tempered glass of the emergency SCRAM box with his titanium elbow guard, glass shards flying",
        visualDesc: "Explosion of glass fragments frozen in air, illuminated by emergency crimson and cobalt lights.",
        subtitle: "BREAKER GLASS SHATTERED"
      },
      {
        act: 11,
        title: "THE SCRAM LEVER",
        cameraMotion: "zoom_in",
        narration: "With my remaining strength, I wrenched the heavy lead lever downward. The control rods slammed into the core with a deafening, thunderous roar.",
        actionScene: "Max Vance gripping the heavy red mechanical SCRAM lever with both hands, throwing his entire body weight downward",
        visualDesc: "Massive control rods plunging into the nuclear core below with huge mechanical shockwaves and steam exhaust vents.",
        subtitle: "EMERGENCY SCRAM ACTIVATED"
      },
      {
        act: 12,
        title: "SILENCE IN THE DEEP",
        cameraMotion: "zoom_out",
        narration: "The cobalt glow died into emergency amber. The turbines wound down into silence. The continent was saved. But deep in the dark, the true mystery of Protocol Zero was just beginning.",
        actionScene: "Max Vance standing battered on the high gantry in quiet amber emergency lighting, gazing down at the powering-down facility",
        visualDesc: "Atmospheric wide frame, amber emergency beacons, steam quietly rising, Max Vance looking toward an unexplored tunnel leading deeper.",
        subtitle: "END OF SEASON 1 // THE PROTOCOL NEVER SLEEPS"
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
 * - Centered in safe zone (MarginV 560: above YouTube handle/title/remix UI, below visual focal center)
 * - Ash-gray inactive words with brilliant Gold/Amber active highlight
 * - ZERO empty background boxes
 * - Elegant Title Hook card during first 3.2s
 * - Dynamic Act Badges (ACT I, ACT II, ACT III, ACT IV) at top-left
 */
function generateKaraokeAss(words, outAssPath, epMeta, fallbackText = '', targetDurationSec = 25) {
  let cleanWords = (words || []).map(w => ({
    text: String(w.part || '').replace(/[\r\n\t]/g, '').trim(),
    startMs: Math.round(w.start),
    endMs: Math.round(w.end)
  })).filter(w => w.text.length > 0);

  // Guarantee subtitles: If word timestamps were empty, synthesize from narration text
  if (cleanWords.length === 0 && fallbackText) {
    const rawWords = fallbackText.split(/\s+/).filter(w => w.length > 0);
    const totalMs = Math.max(12000, targetDurationSec * 1000 - 1500);
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

  // Add series title hook card during first 3.2s
  const titleLine = epMeta ? `Dialogue: 0,0:00:00.00,0:00:03.20,TitleCard,,0,0,0,,{\\fad(200,400)}${epMeta.seriesTitle.toUpperCase()} • EPISODE ${epMeta.episode}: ${epMeta.episodeTitle.toUpperCase()}` : '';

  // Add tactical Act badges at top-left for each act duration
  const actLines = [];
  if (epMeta && Array.isArray(epMeta.acts)) {
    const actMs = (targetDurationSec * 1000) / epMeta.acts.length;
    epMeta.acts.forEach((act, idx) => {
      const startMs = Math.round(idx * actMs);
      const endMs = Math.round((idx + 1) * actMs);
      actLines.push(`Dialogue: 0,${formatAssTimestamp(startMs)},${formatAssTimestamp(endMs)},ActBadge,,0,0,0,,{\\fad(150,150)}ACT ${idx + 1} // ${act.title.toUpperCase()}`);
    });
  }

  const assContent = `[Script Info]
Title: Protocol Zero Cinematic Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: MovieKaraoke, Liberation Sans, 52, &H0000F5FF, &H00D0D0D0, &H00000000, &H90000000, 1, 0, 0, 0, 100, 100, 1.4, 0, 1, 4.5, 2.2, 2, 80, 80, 560, 1
Style: TitleCard, Liberation Sans, 26, &H00FFFFFF, &H00FFFFFF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 2.0, 0, 1, 3.0, 1.5, 8, 40, 40, 140, 1
Style: ActBadge, Liberation Sans, 22, &H0000F5FF, &H0000F5FF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 2.2, 0, 1, 2.5, 1.2, 7, 70, 70, 220, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${titleLine}
${actLines.join('\n')}
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Synthesize Natural Broadcast Voiceover + Word Timing Metadata
 * Uses default pitch (+0Hz) and authoritative movie narrator voices for crisp, resonant speech
 */
async function synthesizeCinematicVoiceWithTiming(text, outWavPath, outAssPath, epMeta) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const tempMp3 = path.join(dir, `edge_movie_${Date.now()}.mp3`);
  const tempJson = `${tempMp3}.json`;

  const voicesToTry = [
    'en-US-ChristopherNeural', // Deep, authoritative, theatrical tone
    'en-US-GuyNeural',         // Crisp broadcast male
    'en-US-EricNeural',        // Clear narrative delivery
    'en-US-BrianNeural'        // Resonant pacing
  ];

  for (const voice of voicesToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { EdgeTTS } = require('node-edge-tts');
        const tts = new EdgeTTS({
          voice: voice,
          lang: 'en-US',
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
          saveSubtitles: true,
          timeout: 15000
        });

        console.log(`[Movie Voice] 🎙️ Synthesizing voiceover with ${voice} (Attempt ${attempt})...`);
        await tts.ttsPromise(cleanText, tempMp3);

        if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 2000) {
          // Clean broadcast audio filter: warm highpass + presence + normalization
          execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=80,lowpass=f=8500,loudnorm=I=-14:TP=-1.5:LRA=9" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);

          let words = [];
          if (fs.existsSync(tempJson)) {
            try {
              words = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
            } catch {}
          }
          
          let estDuration = 25;
          try {
            const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outWavPath}" 2>/dev/null`).toString().trim();
            const parsed = parseFloat(durStr);
            if (!isNaN(parsed) && parsed > 5.0) estDuration = parsed;
          } catch {}

          generateKaraokeAss(words, outAssPath, epMeta, cleanText, estDuration);

          try { fs.unlinkSync(tempMp3); fs.unlinkSync(tempJson); } catch {}
          console.log(`[Movie Voice] ✅ Voiceover synthesized successfully with ${voice} (${estDuration.toFixed(1)}s)`);
          return { success: true, wavPath: outWavPath, assPath: outAssPath };
        }
      } catch (err) {
        console.warn(`[Movie Voice] Notice with voice ${voice} (Attempt ${attempt}): ${err.message}`);
        if (attempt === 1) {
          // Short pause before retrying
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }
  }

  // Fallback 1: espeak-ng / espeak
  const espeakBin = execSync('which espeak-ng 2>/dev/null || which espeak 2>/dev/null || true').toString().trim();
  if (espeakBin) {
    try {
      console.log(`[Movie Voice] Using ${espeakBin} fallback voice...`);
      execSync(`${espeakBin} -v en-us -s 135 -p 45 -a 120 -w "${outWavPath}" "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`);
      if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
        let estDuration = 22;
        try {
          const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outWavPath}" 2>/dev/null`).toString().trim();
          const parsed = parseFloat(durStr);
          if (!isNaN(parsed)) estDuration = parsed;
        } catch {}
        generateKaraokeAss([], outAssPath, epMeta, cleanText, estDuration);
        return { success: true, wavPath: outWavPath, assPath: outAssPath };
      }
    } catch {}
  }

  // Fallback 2: Clear audible synthetic radio cadence (never silence!)
  const wordCount = cleanText.split(/\s+/).length;
  const targetDuration = Math.max(16, Math.round(wordCount * 0.45));
  console.log(`[Movie Voice] ⚠️ Synthesizing audible vocal cadence track (${targetDuration}s)...`);
  execSync(`ffmpeg -y -f lavfi -i "aevalsrc='sin(2*PI*140*t)*(0.35 + 0.15*sin(2*PI*3.2*t))*pow(max(0,sin(2*PI*2.5*t)),2)':s=44100:d=${targetDuration}" -af "highpass=f=100,lowpass=f=3400,volume=0.4" -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  generateKaraokeAss([], outAssPath, epMeta, cleanText, targetDuration);
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

  // Enforce 15.0 seconds per scene, 12 scenes = 180 seconds (3.0 minutes)
  const ACT_DURATION_SEC = 15.0;
  const totalDuration = Number((epMeta.acts.length * ACT_DURATION_SEC).toFixed(2));
  const actDuration = ACT_DURATION_SEC;
  console.log(`[Movie Generator] ⏱️ 3-Minute Episodic Master: ${epMeta.acts.length} Scenes x ${actDuration}s each = ${totalDuration}s total (Voice track: ${voiceDuration.toFixed(2)}s)`);

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
    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${musicFile}" -filter_complex "[0:a]volume=1.0,apad=whole_dur=${totalDuration}[v];[1:a]volume=0.09,atrim=0:${totalDuration}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-15:TP=-1.5:LRA=9[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${masterWav}" 2>/dev/null`;
    try { execSync(mixCmd); } catch { fs.copyFileSync(voiceWav, masterWav); }
  } else {
    fs.copyFileSync(voiceWav, masterWav);
  }

  // 3. Resolve Real 9:16 High-Resolution Images for Each Act
  const actImages = [];
  for (let i = 0; i < epMeta.acts.length; i++) {
    const act = epMeta.acts[i];
    let bgImg = await resolveActBackdropImage(act, epMeta, i);
    if (!bgImg || !fs.existsSync(bgImg) || fs.statSync(bgImg).size < 8000) {
      console.warn(`[Movie Generator] Act ${i + 1} image missing, rendering dedicated procedural frame...`);
      const safeTitle = epMeta.episodeTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fallbackImg = path.join(ARTIFACTS_DIR, `${safeTitle}_act_${i + 1}_procedural.jpg`);
      bgImg = generateProceduralCinematicFrame(act, epMeta, i, fallbackImg);
    }
    actImages.push(bgImg);
    console.log(`[Movie Generator] 🖼️ Act ${i + 1} Image: ${path.basename(bgImg)} (${(fs.statSync(bgImg).size / 1024).toFixed(1)} KB)`);
  }

  if (actImages.length < epMeta.acts.length) {
    throw new Error(`Insufficient act images for episode ${epMeta.episode}`);
  }

  // 4. Assemble Full-Frame 1080x1920 Video with Distinct Cinematic Camera Choreography
  // Render each act segment sequentially to guarantee rock-solid memory stability (no OOM kills)
  const outMp4 = path.join(ARTIFACTS_DIR, `movie_episode_s${epMeta.season}_e${epMeta.episode}.mp4`);
  console.log(`[Movie Generator] 🎥 Assembling Clean Full-Frame 1080x1920 Video (${actImages.length} Acts, Dynamic Pan/Zoom/Tilt, Karaoke Captions)...`);

  const actFrames = Math.round(actDuration * 30);
  const escapedAss = subtitleAss.replace(/\\/g, '/').replace(/:/g, '\\:');
  const tempSegments = [];

  for (let i = 0; i < actImages.length; i++) {
    const currentAct = epMeta.acts[i] || {};
    const motion = currentAct.cameraMotion || (i % 4 === 0 ? 'zoom_in' : i % 4 === 1 ? 'pan_left' : i % 4 === 2 ? 'pan_right' : 'zoom_out');
    let motionFilter = '';
    if (motion === 'zoom_in') {
      motionFilter = `zoompan=z='min(zoom+0.0018,1.25)':x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih/zoom*0.35)':d=${actFrames}:s=1080x1920:fps=30`;
    } else if (motion === 'pan_left') {
      motionFilter = `zoompan=z='1.18':x='(iw-iw/zoom)*(1-on/${actFrames})':y='ih*0.38-(ih/zoom*0.38)':d=${actFrames}:s=1080x1920:fps=30`;
    } else if (motion === 'pan_right') {
      motionFilter = `zoompan=z='1.18':x='(iw-iw/zoom)*(on/${actFrames})':y='ih*0.38-(ih/zoom*0.38)':d=${actFrames}:s=1080x1920:fps=30`;
    } else if (motion === 'zoom_out') {
      motionFilter = `zoompan=z='max(1.25-0.0018*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih*0.35-(ih/zoom*0.35)':d=${actFrames}:s=1080x1920:fps=30`;
    } else {
      motionFilter = `zoompan=z='min(zoom+0.0032,1.32)':x='iw/2-(iw/zoom/2)':y='ih*0.32-(ih/zoom*0.32)':d=${actFrames}:s=1080x1920:fps=30`;
    }

    const segPath = path.join(ARTIFACTS_DIR, `act_seg_${i}.mp4`);
    tempSegments.push(segPath);

    console.log(`[Movie Generator] 🎞️ Rendering Act ${i + 1}/${actImages.length} (${motion})...`);
    const segCmd = `ffmpeg -y -i "${actImages[i]}" -vf "${motionFilter},format=yuv420p" -c:v libx264 -preset veryfast -crf 22 -an "${segPath}" 2>/dev/null`;
    execSync(segCmd);
  }

  // Create concat demuxer list
  const concatListPath = path.join(ARTIFACTS_DIR, 'concat_list.txt');
  fs.writeFileSync(concatListPath, tempSegments.map(s => `file '${s.replace(/\\/g, '/')}'`).join('\n'));

  // Concatenate segments, burn subtitles, and mux master audio
  console.log(`[Movie Generator] 🎬 Final compositing: merging acts with master audio & karaoke subtitles...`);
  const finalCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${masterWav}" -vf "ass='${escapedAss}'" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k -movflags +faststart -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(finalCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Movie Generator] ✅ SUCCESS: Episode MP4 Created! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Movie Generator] 📁 Output: ${outMp4}`);
  } catch (err) {
    console.error(`[Movie Generator] Subtitle filter notice: ${err.message}, muxing direct...`);
    const directCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${masterWav}" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest "${outMp4}" 2>/dev/null`;
    execSync(directCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Movie Generator] ✅ Episode MP4 created via clean copy! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Also make available in rendered_videos directory for global serving & artifacts
  try {
    const renderedDir = path.join(process.cwd(), 'rendered_videos');
    if (!fs.existsSync(renderedDir)) fs.mkdirSync(renderedDir, { recursive: true });
    const renderedCopy = path.join(renderedDir, path.basename(outMp4));
    const latestCopy = path.join(renderedDir, 'movie_episode_latest.mp4');
    fs.copyFileSync(outMp4, renderedCopy);
    fs.copyFileSync(outMp4, latestCopy);
    console.log(`[Movie Generator] 📋 Mirrored to rendered_videos: ${renderedCopy}`);
  } catch (mirrorErr) {
    console.warn('[Movie Generator] Notice mirroring to rendered_videos:', mirrorErr.message);
  }

  // 6. Update Manifest & Database (Zero Git Commits, 100% Low Key)
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

  console.log(`[Movie Generator] 📝 Local cache updated: ${MANIFEST_PATH}`);
  
  // Persist to Cloud Database (Firestore)
  await saveEpisodeToFirestore(manifestEntry);

  console.log(`[Movie Generator] ⏸️ UPLOAD STATUS: HELD FOR REVIEW (Ready for your approval before live publishing)\n`);

  return manifestEntry;
}

/**
 * Log episode manifest to Firestore database low-key (no git commits)
 */
async function saveEpisodeToFirestore(entry) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return false;
    }
    const fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!fb || !fb.projectId || !fb.apiKey) {
      return false;
    }
    const dbId = fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';
    const docId = entry.id;
    const url = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/${dbId}/documents/movie_episodes/${docId}?key=${fb.apiKey}`;

    const docPayload = JSON.stringify({
      fields: {
        id: { stringValue: entry.id },
        seriesTitle: { stringValue: entry.seriesTitle || '' },
        episodeTitle: { stringValue: entry.episodeTitle || '' },
        season: { integerValue: String(entry.season || 1) },
        episode: { integerValue: String(entry.episode || 1) },
        videoPath: { stringValue: entry.videoPath || '' },
        narration: { stringValue: entry.narration || '' },
        duration: { doubleValue: Number(entry.duration || 0) },
        tags: {
          arrayValue: {
            values: (entry.tags || []).map(t => ({ stringValue: String(t) }))
          }
        },
        youtubeUploadStatus: { stringValue: entry.youtubeUploadStatus || 'PENDING_REVIEW' },
        createdAt: { stringValue: entry.createdAt || new Date().toISOString() }
      }
    });

    await new Promise((resolve) => {
      const https = require('https');
      const req = https.request(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(docPayload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Database Logger] 🔒 Episode logged to cloud Firestore database (ID: ${docId}) - Zero git commits made.`);
            resolve(true);
          } else {
            console.warn(`[Database Logger] Firestore write returned status ${res.statusCode}`);
            resolve(false);
          }
        });
      });
      req.on('error', (e) => {
        console.warn(`[Database Logger] Firestore notice: ${e.message}`);
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.write(docPayload);
      req.end();
    });
    return true;
  } catch (err) {
    console.warn(`[Database Logger] Notice: ${err.message}`);
    return false;
  }
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
