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
 * Generate Engaging Studio Environment Props Overlay SVG (Seat, Door, Desk, Studio Gear)
 * Composited over the Pollinations AI image to provide depth and physical room realism
 */
function generateStudioRoomPropsOverlaySvg(sceneIndex = 1, topic = '', width = 1080, height = 1920) {
  const isScene1 = sceneIndex === 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="doorGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.6" />
    </linearGradient>
    <linearGradient id="chairMesh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="lightTubeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
  </defs>

  <!-- 1. MODERN SLIDING STUDIO DOOR (Left Side, Background Plane) -->
  <g id="studio_door" opacity="0.92">
    <!-- Outer Door Frame -->
    <rect x="-10" y="380" width="170" height="1160" rx="12" fill="#090d16" stroke="#1e293b" stroke-width="3" />
    <!-- Glass Slats Panel -->
    <rect x="15" y="410" width="130" height="1100" rx="8" fill="url(#doorGlass)" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="15" y1="560" x2="145" y2="560" stroke="#38bdf8" stroke-width="1" opacity="0.4" />
    <line x1="15" y1="720" x2="145" y2="720" stroke="#38bdf8" stroke-width="1" opacity="0.4" />
    <line x1="15" y1="880" x2="145" y2="880" stroke="#38bdf8" stroke-width="1" opacity="0.4" />
    <line x1="15" y1="1040" x2="145" y2="1040" stroke="#38bdf8" stroke-width="1" opacity="0.4" />
    <line x1="15" y1="1200" x2="145" y2="1200" stroke="#38bdf8" stroke-width="1" opacity="0.4" />

    <!-- Modern Recessed Vertical Door Handle -->
    <rect x="125" y="850" width="12" height="180" rx="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" />
    <circle cx="131" cy="940" r="3" fill="#38bdf8" />

    <!-- Digital Keycard Access Panel beside door -->
    <rect x="150" y="880" width="22" height="42" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
    <circle cx="161" cy="893" r="3.5" fill="#10b981" />
    <circle cx="161" cy="893" r="7" fill="#10b981" opacity="0.3" />
    <rect x="155" y="904" width="12" height="10" rx="2" fill="#1e293b" />
  </g>

  <!-- 2. ERGONOMIC CREATOR MESH CHAIR / EXECUTIVE SEAT (Right Midground Plane) -->
  <g id="creator_chair" transform="translate(820, 920)" opacity="0.88">
    <!-- Adjustable Headrest -->
    <rect x="40" y="0" width="70" height="34" rx="10" fill="#0f172a" stroke="#334155" stroke-width="2" />
    <path d="M 45 6 Q 75 14 105 6" stroke="#38bdf8" stroke-width="1.5" fill="none" opacity="0.6" />
    <line x1="75" y1="34" x2="75" y2="52" stroke="#475569" stroke-width="4" stroke-linecap="round" />

    <!-- Curved Lumbar Mesh Backrest -->
    <path d="M 25 52 C 15 100, 15 180, 28 230 C 45 235, 105 235, 122 230 C 135 180, 135 100, 125 52 Z" fill="url(#chairMesh)" stroke="#38bdf8" stroke-width="2" />
    <!-- Lumbar Support Band -->
    <rect x="35" y="150" width="80" height="24" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <circle cx="75" cy="162" r="4" fill="#38bdf8" opacity="0.7" />

    <!-- 3D Padded Armrests -->
    <rect x="10" y="170" width="22" height="60" rx="8" fill="#0f172a" stroke="#475569" stroke-width="2" />
    <rect x="118" y="170" width="22" height="60" rx="8" fill="#0f172a" stroke="#475569" stroke-width="2" />

    <!-- High-Density Foam Seat Cushion -->
    <path d="M 12 230 L 138 230 C 144 260, 136 280, 128 290 L 22 290 C 14 280, 6 260, 12 230 Z" fill="#090d16" stroke="#334155" stroke-width="2.5" />
    <line x1="20" y1="260" x2="130" y2="260" stroke="#38bdf8" stroke-width="2" opacity="0.5" />

    <!-- Heavy-Duty Pneumatic Piston Cylinder Stem -->
    <rect x="68" y="290" width="14" height="80" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
    <rect x="71" y="300" width="8" height="60" fill="#64748b" />

    <!-- 5-Star Aluminum Caster Wheel Base -->
    <path d="M 75 370 L 15 415" stroke="#334155" stroke-width="6" stroke-linecap="round" />
    <path d="M 75 370 L 135 415" stroke="#334155" stroke-width="6" stroke-linecap="round" />
    <path d="M 75 370 L 75 425" stroke="#334155" stroke-width="6" stroke-linecap="round" />
    <!-- Caster Wheels -->
    <circle cx="15" cy="420" r="7" fill="#0f172a" stroke="#64748b" stroke-width="2" />
    <circle cx="135" cy="420" r="7" fill="#0f172a" stroke="#64748b" stroke-width="2" />
    <circle cx="75" cy="430" r="7" fill="#0f172a" stroke="#64748b" stroke-width="2" />
  </g>

  <!-- 3. STUDIO AMBIENT RGB TUBE LIGHT (Right Edge) -->
  <g id="ambient_light_tube">
    <rect x="1040" y="320" width="12" height="1180" rx="6" fill="url(#lightTubeGrad)" opacity="0.9" />
    <rect x="1030" y="300" width="32" height="1220" rx="16" fill="url(#lightTubeGrad)" opacity="0.25" filter="blur(8px)" />
  </g>

  <!-- 4. WORKSTATION DESK & BROADCAST GEAR (Lower-Mid Horizon) -->
  <g id="creator_workstation" opacity="0.90">
    <!-- Console Surface Table Edge -->
    <polygon points="100,1400 980,1400 1060,1470 20,1470" fill="#0b0f19" stroke="#1e293b" stroke-width="2.5" />
    <line x1="30" y1="1466" x2="1050" y2="1466" stroke="#38bdf8" stroke-width="2" opacity="0.75" />

    <!-- Background Ultrawide Curved Display Bezel (Behind Host) -->
    <path d="M 280 1280 Q 540 1260 800 1280 L 785 1395 Q 540 1380 295 1395 Z" fill="#020617" stroke="#0ea5e9" stroke-width="2" opacity="0.75" />
    <!-- Curved Bias Backlight Glow -->
    <path d="M 280 1280 Q 540 1250 800 1280" stroke="#38bdf8" stroke-width="8" opacity="0.3" filter="blur(6px)" fill="none" />

    <!-- Articulated Broadcast Mic Arm (Left Desk Edge) -->
    <path d="M 160 1420 L 195 1330 L 220 1370" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <circle cx="160" cy="1420" r="6" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
    <circle cx="195" cy="1330" r="5" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
    <!-- Professional Studio Condenser Mic with Pop Filter -->
    <rect x="215" y="1360" width="16" height="34" rx="7" fill="#0f172a" stroke="#94a3b8" stroke-width="2" />
    <circle cx="223" cy="1355" r="9" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
    <circle cx="223" cy="1368" r="2.5" fill="#ef4444" /> <!-- Live mic recording LED -->

    <!-- Creator Minimalist Matte Black Mug / Tumbler -->
    <rect x="880" y="1410" width="22" height="34" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.8" />
    <path d="M 902 1418 Q 912 1426 902 1434" stroke="#334155" stroke-width="2" fill="none" />
  </g>
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
