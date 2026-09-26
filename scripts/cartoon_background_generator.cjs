/**
 * Automated Cartoon Factory — Dynamic Background Engine
 * 
 * Generates topic-synchronized, modern interface backgrounds per scene:
 * - Primary: AI-generated backgrounds via Pollinations AI (Zero-key, free, Flux/Turbo photorealistic/stylish 9:16)
 * - Fallback: Richly drawn modern interface vector SVGs rasterized to 1080x1920 PNG via FFmpeg
 * - Guarantees background transitions across scenes in sync with the topic
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { getDistinctClassroomSvg } = require('./cartoon_classrooms.cjs');

/**
 * Fetch image buffer from HTTPS with timeout
 */
function fetchHttpsBuffer(url, timeoutMs = 24000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttpsBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP Status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
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
 * Generate Engaging Studio Environment Props Overlay SVG (Sleek Side Lighting, Tech HUD & Room Depth)
 * Clean framing that leaves the central presentation floor open so character is not obstructed
 */
function generateStudioRoomPropsOverlaySvg(sceneIndex = 1, topic = '', width = 1080, height = 1920) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="lightPillarCyan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" />
    </linearGradient>
    <linearGradient id="lightPillarPurple" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.7" />
    </linearGradient>
    <linearGradient id="floorReflectionGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </linearGradient>
    <filter id="pillarGlow" x="-50%" y="-10%" width="200%" height="120%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- 1. SLEEK ARCHITECTURAL LED PILLARS (Left & Right Framing) -->
  <g id="studio_pillars" filter="url(#pillarGlow)">
    <!-- Left Pillar -->
    <rect x="25" y="120" width="8" height="1360" rx="4" fill="url(#lightPillarCyan)" />
    <!-- Right Pillar -->
    <rect x="1047" y="120" width="8" height="1360" rx="4" fill="url(#lightPillarPurple)" />
  </g>

  <!-- 2. RECESSED CEILING KEY LIGHT CONES (Subtle Volumetric Beams) -->
  <g id="ceiling_lights" opacity="0.18">
    <polygon points="180,0 260,0 340,700 100,700" fill="#38bdf8" />
    <polygon points="820,0 900,0 980,700 740,700" fill="#a855f7" />
  </g>

  <!-- 3. TOP TELEMETRY HUD STRIP (Clean Broadcast Header) -->
  <g id="top_hud_strip" transform="translate(540, 70)" opacity="0.85">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
    <circle cx="-215" cy="0" r="4" fill="#22c55e" />
    <text x="-195" y="5" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#94a3b8" letter-spacing="1.5">
      STUDIO ARCHIE • LIVE TELEMETRY
    </text>
    <rect x="150" y="-8" width="60" height="16" rx="4" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1" />
    <text x="180" y="4" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="900" fill="#38bdf8" text-anchor="middle">
      REC 4K
    </text>
  </g>

  <!-- 4. POLISHED CARBON FLOOR REFLECTION (Grounded Horizon at y=1500) -->
  <rect x="0" y="1500" width="${width}" height="420" fill="url(#floorReflectionGrad)" />
  <line x1="0" y1="1500" x2="${width}" y2="1500" stroke="#38bdf8" stroke-width="2" opacity="0.4" />
</svg>`;
}

/**
 * Craft high-quality prompt for Pollinations AI based on scene and topic
 */
function buildPollinationsPrompt(sceneIndex, topic = '', style = '') {
  const safeTopic = String(topic || 'Modern Technology').replace(/[^\w\s]/g, ' ').trim();
  const lowerTopic = safeTopic.toLowerCase();

  if (sceneIndex === 1) {
    // Scene 1: Host Arena / Studio Stage where boards appear
    return `modern tech creator studio stage, sleek dark minimalist interior, soft cyan and violet ambient LED strip lighting, clean reflective floor, subtle depth of field blur, cinematic lighting, 8k vertical 9:16 wallpaper`;
  }

  // Scene 2+: Dynamic topic-synchronized modern interface
  if (lowerTopic.includes('ai') || lowerTopic.includes('code') || lowerTopic.includes('developer') || lowerTopic.includes('deepseek') || lowerTopic.includes('model')) {
    return `futuristic AI laboratory, transparent curved glass monitors displaying glowing holographic neural networks and code terminals, sleek modern desk setup, ambient neon teal and dark blue lighting, ultra modern interface, 8k vertical 9:16`;
  }

  if (lowerTopic.includes('drop') || lowerTopic.includes('ship') || lowerTopic.includes('finance') || lowerTopic.includes('money') || lowerTopic.includes('business')) {
    return `ultra modern digital commerce operations room, floating curved glass analytics dashboards, global logistics tracking screens, ambient obsidian and emerald LED lighting, sleek glass workstation, 8k vertical 9:16`;
  }

  if (lowerTopic.includes('human') || lowerTopic.includes('animal') || lowerTopic.includes('biology') || lowerTopic.includes('science') || lowerTopic.includes('fast')) {
    return `high-tech science biomechanics observation lab, futuristic glass workstations with biometric telemetry displays, panoramic clean glass windows, ambient cyan lighting, high-tech interface, 8k vertical 9:16`;
  }

  // Default topic-driven modern interface
  return `modern tech interface workspace, curved transparent glass holographic screens displaying ${safeTopic} analytics, sleek designer desk, ambient studio neon rim lighting, cinematic 8k vertical 9:16`;
}

/**
 * Attempt to download and convert background from Pollinations AI
 * User directive: Pollinations AI background completely removed due to watermark and algorithm throttling.
 */
async function downloadPollinationsBg(prompt, outPngPath, seed = 42) {
  // Permanently disabled per user directive to prevent watermarks and optimize algorithm push
  return null;
}

/**
 * Rich Drawn Modern Interface Vector SVG (Resilient Local Generator)
 */
function generateDrawnModernInterfaceSvg(sceneIndex = 1, topic = '', style = '', width = 1080, height = 1920) {
  const safeTopic = String(topic || 'SCIENCE & TECH DATA').toUpperCase().slice(0, 24);
  const lowerTopic = String(topic || '').toLowerCase();

  // Detect thematic domain from topic keywords
  const isBiologyOrNature = /bio|cell|nerve|human|body|finger|honey|bacteria|blood|wrinkle|eye|taste|organism|brain/i.test(lowerTopic);
  const isOpticsOrLight = /light|sky|blue|violet|color|prism|refract|scatter|sun|lens|wavelength|wave|laser/i.test(lowerTopic);
  const isSpaceOrPhysics = /space|satellite|gps|einstein|relativ|orbit|gravity|moon|star|planet|cosmos|quantum/i.test(lowerTopic);
  const isElectromagnetism = /electric|volt|shock|static|current|magnet|induction|wire|circuit|plasma|spark/i.test(lowerTopic);

  if (sceneIndex === 1) {
    // Scene 1: Modern Stage & Presentation Arena with Archie Lab Warm Ambient Shelving & Acoustic Wood
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="stageWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="65%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
        <radialGradient id="stageGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#1e293b" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="neonLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="neonRight" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Stage Background -->
      <rect width="${width}" height="${height}" fill="url(#stageWall)" />

      <!-- Side Ambient Glows -->
      <rect x="0" y="0" width="400" height="${height}" fill="url(#neonLeft)" />
      <rect x="680" y="0" width="400" height="${height}" fill="url(#neonRight)" />

      <!-- Left Back Wall Acoustic Slat Panels & Neon Sign -->
      <g stroke="#1e293b" stroke-width="4" opacity="0.45">
        <line x1="60" y1="120" x2="60" y2="1350" />
        <line x1="110" y1="120" x2="110" y2="1350" />
        <line x1="160" y1="120" x2="160" y2="1350" />
        <line x1="210" y1="120" x2="210" y2="1350" />
        <line x1="260" y1="120" x2="260" y2="1350" />
        <line x1="310" y1="120" x2="310" y2="1350" />
      </g>

      <!-- Back Wall Acoustic Hexagon Grid on Right -->
      <g stroke="#1e293b" stroke-width="2.5" fill="#0f172a" opacity="0.65">
        <polygon points="820,240 860,265 860,315 820,340 780,315 780,265" />
        <polygon points="905,240 945,265 945,315 905,340 865,315 865,265" />
        <polygon points="862,318 902,343 902,393 862,418 822,393 822,343" />
        <polygon points="948,318 988,343 988,393 948,418 908,393 908,343" />
      </g>

      <!-- Sleek Vertical Studio Lightbars -->
      <rect x="90" y="160" width="10" height="1150" rx="5" fill="#38bdf8" />
      <rect x="85" y="150" width="20" height="1170" rx="10" fill="#38bdf8" opacity="0.3" filter="blur(6px)" />
      <rect x="980" y="160" width="10" height="1150" rx="5" fill="#a855f7" />
      <rect x="975" y="150" width="20" height="1170" rx="10" fill="#a855f7" opacity="0.3" filter="blur(6px)" />

      <!-- Stage Horizon & Reflective Glass Floor -->
      <ellipse cx="540" cy="1480" rx="560" ry="280" fill="url(#stageGlow)" />
      <path d="M 0 1520 Q 540 1460 1080 1520 L 1080 1920 L 0 1920 Z" fill="#070a12" />
      <path d="M 0 1520 Q 540 1460 1080 1520" stroke="#38bdf8" stroke-width="3" fill="none" opacity="0.6" />
      
      <!-- Stage Grid Accent Lines -->
      <line x1="200" y1="1520" x2="50" y2="1920" stroke="#1e293b" stroke-width="2" opacity="0.4" />
      <line x1="880" y1="1520" x2="1030" y2="1920" stroke="#1e293b" stroke-width="2" opacity="0.4" />
    </svg>`;
  }

  // Scene 2+: Dynamic topic-synchronized backdrop tailored to the specific scientific topic
  if (isBiologyOrNature) {
    // Biology & Cellular Bio-mechanics Lab Backdrop
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bioLabBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#02140f" />
          <stop offset="50%" stop-color="#06221c" />
          <stop offset="100%" stop-color="#010c08" />
        </linearGradient>
        <linearGradient id="bioGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#064e3b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#022c22" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bioLabBg)" />

      <!-- Floating DNA Double Helix / Cellular Structure Background -->
      <g stroke="#10b981" stroke-width="2" opacity="0.3" fill="none">
        <path d="M 80 200 Q 150 260 220 200 T 360 200 T 500 200" />
        <path d="M 80 260 Q 150 200 220 260 T 360 260 T 500 260" />
        <line x1="150" y1="230" x2="150" y2="230" />
        <line x1="220" y1="200" x2="220" y2="260" stroke-width="3" />
        <line x1="360" y1="200" x2="360" y2="260" stroke-width="3" />
      </g>

      <!-- Cellular Observation Holographic HUD -->
      <rect x="60" y="240" width="450" height="270" rx="18" fill="url(#bioGlass)" stroke="#34d399" stroke-width="2" />
      <text x="90" y="280" fill="#34d399" font-family="system-ui, sans-serif" font-size="16" font-weight="800" letter-spacing="1">🔬 CELLULAR TELEMETRY // ${safeTopic}</text>
      <!-- Cell membrane circles -->
      <circle cx="160" cy="380" r="45" fill="#065f46" stroke="#10b981" stroke-width="2.5" opacity="0.8" />
      <circle cx="160" cy="380" r="18" fill="#34d399" opacity="0.6" />
      <circle cx="280" cy="370" r="32" fill="#065f46" stroke="#10b981" stroke-width="2" opacity="0.8" />
      <circle cx="390" cy="390" r="25" fill="#065f46" stroke="#10b981" stroke-width="2" opacity="0.8" />

      <!-- Right Telemetry Panel -->
      <rect x="570" y="240" width="450" height="270" rx="18" fill="url(#bioGlass)" stroke="#34d399" stroke-width="2" />
      <text x="600" y="280" fill="#34d399" font-family="system-ui, sans-serif" font-size="16" font-weight="800">BIO-METRIC RESPONSE SPECTRUM</text>
      <path d="M 600 420 Q 660 330 730 400 T 850 310 T 960 380" fill="none" stroke="#10b981" stroke-width="3.5" />

      <!-- Laboratory Workstation Midground Floor -->
      <polygon points="100,1320 980,1320 1040,1390 40,1390" fill="#06221c" stroke="#10b981" stroke-width="2" />
      <path d="M 40 1390 L 1040 1390 L 1080 1920 L 0 1920 Z" fill="#02140f" />
      <ellipse cx="540" cy="1400" rx="440" ry="80" fill="#10b981" opacity="0.12" />
    </svg>`;
  }

  if (isOpticsOrLight) {
    // Optics & Atmospheric Dispersion Chamber Backdrop
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="opticsBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#080c1d" />
          <stop offset="50%" stop-color="#0d1b3e" />
          <stop offset="100%" stop-color="#030611" />
        </linearGradient>
        <linearGradient id="rainbowSpectrum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="25%" stop-color="#f59e0b" />
          <stop offset="50%" stop-color="#10b981" />
          <stop offset="75%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#opticsBg)" />

      <!-- Atmospheric Ray Scatter Simulation Rays in Background -->
      <g opacity="0.25">
        <line x1="540" y1="100" x2="100" y2="800" stroke="#38bdf8" stroke-width="3" />
        <line x1="540" y1="100" x2="300" y2="900" stroke="#818cf8" stroke-width="2.5" />
        <line x1="540" y1="100" x2="540" y2="1000" stroke="#a855f7" stroke-width="2" />
        <line x1="540" y1="100" x2="780" y2="900" stroke="#c084fc" stroke-width="2.5" />
        <line x1="540" y1="100" x2="980" y2="800" stroke="#38bdf8" stroke-width="3" />
      </g>

      <!-- Optics Spectrometer Screens -->
      <rect x="60" y="240" width="450" height="270" rx="18" fill="#0c1630" stroke="#38bdf8" stroke-width="2" />
      <text x="90" y="280" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="800">OPTICAL WAVELENGTH // ${safeTopic}</text>
      <!-- Spectrum Bar -->
      <rect x="90" y="320" width="390" height="24" rx="12" fill="url(#rainbowSpectrum)" />
      <text x="90" y="380" fill="#94a3b8" font-family="monospace" font-size="14">RAYLEIGH SCATTERING RATIO: 10x (BLUE/VIOLET)</text>

      <!-- Atmospheric Scattering Model on Right -->
      <rect x="570" y="240" width="450" height="270" rx="18" fill="#0c1630" stroke="#818cf8" stroke-width="2" />
      <text x="600" y="280" fill="#818cf8" font-family="system-ui, sans-serif" font-size="16" font-weight="800">RETINAL CONE SENSITIVITY</text>
      <circle cx="700" cy="380" r="38" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="0.8" />
      <circle cx="795" cy="380" r="38" fill="none" stroke="#22c55e" stroke-width="2.5" opacity="0.8" />
      <circle cx="890" cy="380" r="38" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.8" />

      <!-- Glass Horizon & Stage Floor -->
      <polygon points="100,1320 980,1320 1040,1390 40,1390" fill="#0d1b3e" stroke="#38bdf8" stroke-width="2" />
      <path d="M 40 1390 L 1040 1390 L 1080 1920 L 0 1920 Z" fill="#040918" />
      <ellipse cx="540" cy="1400" rx="440" ry="80" fill="#38bdf8" opacity="0.15" />
    </svg>`;
  }

  if (isSpaceOrPhysics) {
    // Relativistic Astrophysics & Orbital Geometry Backdrop
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="spaceBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#030712" />
          <stop offset="50%" stop-color="#0b112c" />
          <stop offset="100%" stop-color="#02040a" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#spaceBg)" />

      <!-- Distant Star Field and Orbital Ellipses -->
      <g opacity="0.4" stroke="#60a5fa" stroke-width="1.5" fill="none">
        <ellipse cx="540" cy="400" rx="480" ry="180" transform="rotate(-15 540 400)" />
        <ellipse cx="540" cy="400" rx="420" ry="140" transform="rotate(25 540 400)" />
        <circle cx="540" cy="400" r="32" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2" />
      </g>

      <!-- Satellite Telemetry HUD Left -->
      <rect x="60" y="240" width="450" height="270" rx="18" fill="#0b1120" stroke="#60a5fa" stroke-width="2" />
      <text x="90" y="280" fill="#60a5fa" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ORBITAL TIME DILATION // ${safeTopic}</text>
      <text x="90" y="330" fill="#facc15" font-family="monospace" font-size="20" font-weight="700">+38.00 μs / DAY</text>
      <path d="M 90 420 L 220 380 L 360 410 L 480 370" stroke="#38bdf8" stroke-width="3" fill="none" />

      <!-- Gravitational Curvature HUD Right -->
      <rect x="570" y="240" width="450" height="270" rx="18" fill="#0b1120" stroke="#a78bfa" stroke-width="2" />
      <text x="600" y="280" fill="#a78bfa" font-family="system-ui, sans-serif" font-size="16" font-weight="800">EINSTEIN RELATIVISTIC CORRECTION</text>
      <circle cx="795" cy="380" r="50" fill="none" stroke="#a78bfa" stroke-width="2" stroke-dasharray="6,4" />
      <circle cx="795" cy="380" r="20" fill="#6d28d9" />

      <!-- Ground Horizon & Carbon Floor -->
      <polygon points="100,1320 980,1320 1040,1390 40,1390" fill="#0b112c" stroke="#60a5fa" stroke-width="2" />
      <path d="M 40 1390 L 1040 1390 L 1080 1920 L 0 1920 Z" fill="#030613" />
      <ellipse cx="540" cy="1400" rx="440" ry="80" fill="#60a5fa" opacity="0.12" />
    </svg>`;
  }

  // Default: Modern Glass Interface Workspace / Futuristic Workstation
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="labBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0b1329" />
        <stop offset="100%" stop-color="#030712" />
      </linearGradient>
      <linearGradient id="hudScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.88" />
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.8" />
      </linearGradient>
      <linearGradient id="screenBorder" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="50%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
    </defs>

    <!-- Lab Background -->
    <rect width="${width}" height="${height}" fill="url(#labBg)" />

    <!-- Distant Holographic Grid Floor -->
    <g stroke="#0369a1" stroke-width="1.5" opacity="0.25">
      <line x1="0" y1="1400" x2="1080" y2="1400" />
      <line x1="0" y1="1500" x2="1080" y2="1500" />
      <line x1="0" y1="1620" x2="1080" y2="1620" />
      <line x1="0" y1="1760" x2="1080" y2="1760" />
      <line x1="540" y1="1350" x2="540" y2="1920" />
      <line x1="540" y1="1350" x2="200" y2="1920" />
      <line x1="540" y1="1350" x2="880" y2="1920" />
    </g>

    <!-- Upper Curved Holographic Telemetry Screen Left -->
    <rect x="60" y="240" width="440" height="260" rx="16" fill="url(#hudScreen)" stroke="url(#screenBorder)" stroke-width="2" />
    <text x="90" y="280" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="700">LIVE TELEMETRY // ${safeTopic}</text>
    <path d="M 90 380 Q 150 320 220 350 T 360 300 T 460 330" fill="none" stroke="#06b6d4" stroke-width="3" />
    <path d="M 90 420 Q 180 400 270 410 T 460 380" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-dasharray="6,3" />

    <!-- Upper Curved Holographic Telemetry Screen Right -->
    <rect x="580" y="240" width="440" height="260" rx="16" fill="url(#hudScreen)" stroke="url(#screenBorder)" stroke-width="2" />
    <text x="610" y="280" fill="#a855f7" font-family="monospace" font-size="16" font-weight="700">SYSTEM BENCHMARK // MATRIX</text>
    <!-- Bar charts -->
    <rect x="620" y="320" width="30" height="120" rx="4" fill="#38bdf8" opacity="0.8" />
    <rect x="670" y="360" width="30" height="80" rx="4" fill="#6366f1" opacity="0.8" />
    <rect x="720" y="300" width="30" height="140" rx="4" fill="#a855f7" opacity="0.8" />
    <rect x="770" y="340" width="30" height="100" rx="4" fill="#ec4899" opacity="0.8" />
    <rect x="820" y="310" width="30" height="130" rx="4" fill="#38bdf8" opacity="0.8" />

    <!-- Modern Interface Glass Workstation Desk in Midground -->
    <polygon points="120,1320 960,1320 1020,1390 60,1390" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
    <rect x="180" y="1328" width="720" height="8" rx="4" fill="#38bdf8" opacity="0.7" />
    
    <!-- Transparent Lower Desk Body -->
    <path d="M 60 1390 L 1020 1390 L 1080 1920 L 0 1920 Z" fill="#040813" />
    <line x1="60" y1="1390" x2="1020" y2="1390" stroke="#0284c7" stroke-width="3" />
    
    <!-- Ambient Studio Spotlight from Above -->
    <ellipse cx="540" cy="1400" rx="420" ry="80" fill="#38bdf8" opacity="0.12" />
  </svg>`;
}

/**
 * Get or generate background for a specific scene
 */
async function getSceneBackground(sceneIndex, topic = '', style = '', objects = [], artifactsDir = '/tmp') {
  const dir = artifactsDir || path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const finalPngPath = path.join(dir, `scene_${sceneIndex}_bg.png`);
  const rawBgPath = path.join(dir, `scene_${sceneIndex}_raw_ai.png`);
  const propsOverlaySvg = path.join(dir, `scene_${sceneIndex}_props.svg`);
  const seed = (Math.abs(hashString(topic)) % 10000) + sceneIndex * 100;

  // Check if style is one of the 5 distinct classroom environments or cartoon explainer
  const isClassroomStyle = ['cyber_stem', 'ivy_hall', 'scandi_science', 'planetarium', 'chem_lab'].includes(style);
  
  if (isClassroomStyle || style.includes('classroom') || style.includes('school') || style.includes('lecture') || style.includes('lab')) {
    console.log(`[Background Engine] 🏫 Rendering distinct classroom environment (${style || 'thematic'}) for Scene ${sceneIndex}...`);
    const classroomResult = getDistinctClassroomSvg(style || sceneIndex - 1, 1080, 1920, topic);
    const svgPath = path.join(dir, `scene_${sceneIndex}_classroom.svg`);
    fs.writeFileSync(svgPath, classroomResult.svg, 'utf8');
    try {
      execSync(`ffmpeg -y -i "${svgPath}" "${finalPngPath}" 2>/dev/null`);
      if (fs.existsSync(finalPngPath) && fs.statSync(finalPngPath).size > 5000) {
        return finalPngPath;
      }
    } catch (err) {
      console.warn(`[Background Engine] Notice rasterizing classroom: ${err.message}`);
    }
  }

  // 1. User Directive: Pollinations AI background removed (watermark free, clean algorithm friendly)
  // Render pristine, watermark-free drawn modern interface backdrop directly
  console.log(`[Background Engine] 🎨 Rendering clean, watermark-free modern interface backdrop for Scene ${sceneIndex}...`);
  const svgPath = path.join(dir, `scene_${sceneIndex}_interface.svg`);
  const svgContent = generateDrawnModernInterfaceSvg(sceneIndex, topic, style, 1080, 1920);
  fs.writeFileSync(svgPath, svgContent, 'utf8');

  let baseBgPath = null;
  try {
    execSync(`ffmpeg -y -i "${svgPath}" "${rawBgPath}" 2>/dev/null`);
    if (fs.existsSync(rawBgPath)) baseBgPath = rawBgPath;
  } catch (err) {
    console.warn(`[Background Engine] Notice rasterizing backdrop: ${err.message}`);
  }

  // 3. Composite custom props (sliding door, ergonomic creator chair, workstation desk, ambient light tube)
  try {
    const overlayContent = generateStudioRoomPropsOverlaySvg(sceneIndex, topic, 1080, 1920);
    fs.writeFileSync(propsOverlaySvg, overlayContent, 'utf8');

    if (baseBgPath && fs.existsSync(baseBgPath)) {
      console.log(`[Background Engine] 🛋️ Compositing custom studio props (seat, door, workstation) onto background...`);
      execSync(`ffmpeg -y -i "${baseBgPath}" -i "${propsOverlaySvg}" -filter_complex "[0:v][1:v]overlay=0:0" "${finalPngPath}" 2>/dev/null`);
      if (fs.existsSync(finalPngPath) && fs.statSync(finalPngPath).size > 10000) {
        return finalPngPath;
      }
    }
  } catch (err) {
    console.warn(`[Background Engine] Notice compositing studio props: ${err.message}`);
  }

  return (baseBgPath && fs.existsSync(baseBgPath)) ? baseBgPath : (fs.existsSync(finalPngPath) ? finalPngPath : null);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

module.exports = {
  getSceneBackground,
  downloadPollinationsBg,
  generateDrawnModernInterfaceSvg,
  buildPollinationsPrompt
};
