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
 */
async function downloadPollinationsBg(prompt, outPngPath, seed = 42) {
  const encPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encPrompt}?width=1080&height=1920&nologo=true&seed=${seed}`;
  const tempJpg = outPngPath.replace(/\.png$/i, '_raw.jpg');

  try {
    console.log(`[Background Engine] 🌐 Requesting AI background from Pollinations: "${prompt.slice(0, 60)}..."`);
    const buf = await fetchHttpsBuffer(url, 7000);
    if (buf && buf.length > 5000) {
      fs.writeFileSync(tempJpg, buf);
      // Scale and crop cleanly to 1080x1920
      execSync(`ffmpeg -y -i "${tempJpg}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" "${outPngPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempJpg); } catch {}
      if (fs.existsSync(outPngPath) && fs.statSync(outPngPath).size > 10000) {
        console.log(`[Background Engine] ✅ AI Background fetched successfully (${(fs.statSync(outPngPath).size / 1024).toFixed(1)} KB)`);
        return outPngPath;
      }
    }
  } catch (err) {
    console.warn(`[Background Engine] Notice fetching AI background (${err.message}). Using drawn modern interface.`);
  }
  return null;
}

/**
 * Rich Drawn Modern Interface Vector SVG (Resilient Local Generator)
 */
function generateDrawnModernInterfaceSvg(sceneIndex = 1, topic = '', style = '', width = 1080, height = 1920) {
  const safeTopic = String(topic || 'SYSTEM DATA').toUpperCase().slice(0, 20);

  if (sceneIndex === 1) {
    // Scene 1: Modern Stage & Presentation Arena
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

      <!-- Back Wall Acoustic Hexagon Grid -->
      <g stroke="#1e293b" stroke-width="2.5" fill="#0f172a" opacity="0.65">
        <polygon points="180,260 220,285 220,335 180,360 140,335 140,285" />
        <polygon points="265,260 305,285 305,335 265,360 225,335 225,285" />
        <polygon points="222,338 262,363 262,413 222,438 182,413 182,363" />
        <polygon points="820,240 860,265 860,315 820,340 780,315 780,265" />
        <polygon points="905,240 945,265 945,315 905,340 865,315 865,265" />
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

  // Scene 2+: Modern Glass Interface Workspace / Futuristic Workstation
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

  // 1. Try Pollinations AI first
  const prompt = buildPollinationsPrompt(sceneIndex, topic, style);
  const pollinationsRes = await downloadPollinationsBg(prompt, rawBgPath, seed);

  let baseBgPath = null;
  if (pollinationsRes && fs.existsSync(pollinationsRes) && fs.statSync(pollinationsRes).size > 10000) {
    baseBgPath = pollinationsRes;
  } else {
    // 2. Resilient fallback: Draw rich modern interface vector SVG and rasterize
    console.log(`[Background Engine] 🎨 Rendering custom drawn modern interface backdrop for Scene ${sceneIndex}...`);
    const svgPath = path.join(dir, `scene_${sceneIndex}_fallback.svg`);
    const svgContent = generateDrawnModernInterfaceSvg(sceneIndex, topic, style, 1080, 1920);
    fs.writeFileSync(svgPath, svgContent, 'utf8');
    try {
      execSync(`ffmpeg -y -i "${svgPath}" "${rawBgPath}" 2>/dev/null`);
      if (fs.existsSync(rawBgPath)) baseBgPath = rawBgPath;
    } catch (err) {
      console.warn(`[Background Engine] Notice rasterizing fallback background: ${err.message}`);
    }
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
