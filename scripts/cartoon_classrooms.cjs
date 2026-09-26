/**
 * Automated Cartoon Factory — 5 Distinct Classroom Environments
 *
 * Implements 5 completely different classroom environments with zero similarities:
 * 1. Futuristic Cyber STEM Lab Classroom (Dark navy, glowing neon cyan/purple smartboard, holographic HUD, robotic arm)
 * 2. Historic Ivy League / Harvard Lecture Amphitheater (Mahogany wood tiers, vintage green chalkboard with chalk equations, brass banker lamps)
 * 3. Bright Scandinavian Creative Science Studio (Daylight sunbeams from arched loft windows, light birch wood, botanical vines, magnetic whiteboard)
 * 4. Cosmic Astrophysics Planetarium Dome (Celestial starry dome ceiling, orbital holographic solar system projector, violet pod desks)
 * 5. Vintage Chemistry & Biology Discovery Lab (Subway tile walls, slate counters, brass condenser coils, glass flasks with bubbling fluid, microscope)
 */

const fs = require('fs');
const path = require('path');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Classroom 1: Futuristic Cyber STEM Innovation Lab
 */
function buildCyberStemLabSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cyberWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="60%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#02040a" />
      </linearGradient>
      <linearGradient id="cyberFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Wall -->
    <rect width="${width}" height="${height}" fill="url(#cyberWall)" />

    <!-- Circuit Lines on Back Wall -->
    <g stroke="#0ea5e9" stroke-width="2" opacity="0.35" fill="none">
      <path d="M 60 100 L 180 100 L 260 220 L 260 600" />
      <circle cx="260" cy="600" r="5" fill="#38bdf8" />
      <path d="M 800 80 L 920 80 L 980 180 L 980 500" />
      <circle cx="980" cy="500" r="5" fill="#06b6d4" />
      <path d="M 120 400 L 200 480 L 200 800" />
    </g>

    <!-- LED Pillar Strips -->
    <rect x="30" y="80" width="8" height="1280" rx="4" fill="url(#neonCyan)" filter="url(#cyberGlow)" opacity="0.8" />
    <rect x="1042" y="80" width="8" height="1280" rx="4" fill="#a855f7" filter="url(#cyberGlow)" opacity="0.8" />

    <!-- Floating Holographic Data Rings on Ceiling -->
    <g opacity="0.4" transform="translate(540, 120)">
      <ellipse cx="0" cy="0" rx="420" ry="60" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="14 10" />
      <ellipse cx="0" cy="0" rx="300" ry="42" fill="none" stroke="#818cf8" stroke-width="1.2" />
    </g>

    <!-- Cyber STEM Header Bar -->
    <g transform="translate(540, 60)" opacity="0.9">
      <rect x="-220" y="-18" width="440" height="36" rx="18" fill="#030712" stroke="#0ea5e9" stroke-width="1.5" />
      <circle cx="-195" cy="0" r="4" fill="#22c55e" />
      <text x="-175" y="5" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#38bdf8" letter-spacing="2">
        STEM LAB 01 • QUANTUM WORKSTATION
      </text>
    </g>

    <!-- Modern Robotic Arm Prop on Left Counter -->
    <g transform="translate(60, 920)" opacity="0.75">
      <rect x="0" y="320" width="220" height="140" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2" />
      <path d="M 60 320 L 90 200 L 160 140" stroke="#64748b" stroke-width="16" stroke-linecap="round" fill="none" />
      <circle cx="90" cy="200" r="14" fill="#0284c7" />
      <circle cx="160" cy="140" r="10" fill="#38bdf8" />
      <path d="M 160 140 L 185 110 M 160 140 L 195 150" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" />
    </g>

    <!-- Cyber Glass Floor with Grid -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#0ea5e9" stroke-width="3" opacity="0.9" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#cyberFloor)" />
    <g stroke="#0369a1" stroke-width="1.5" opacity="0.35">
      <line x1="540" y1="1360" x2="80" y2="1920" />
      <line x1="540" y1="1360" x2="320" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="760" y2="1920" />
      <line x1="540" y1="1360" x2="1000" y2="1920" />
      <line x1="0" y1="1500" x2="${width}" y2="1500" />
      <line x1="0" y1="1660" x2="${width}" y2="1660" />
    </g>
  </svg>`;
}

/**
 * Classroom 2: Historic Ivy League / Harvard Lecture Amphitheater
 */
function buildIvyHallSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ivyWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1c110a" />
        <stop offset="60%" stop-color="#2a1810" />
        <stop offset="100%" stop-color="#140a05" />
      </linearGradient>
      <linearGradient id="chalkboardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f291e" />
        <stop offset="100%" stop-color="#163829" />
      </linearGradient>
      <linearGradient id="mahoganyFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b1d11" />
        <stop offset="100%" stop-color="#1a0b06" />
      </linearGradient>
      <filter id="lampGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>

    <!-- Deep Wood Wall -->
    <rect width="${width}" height="${height}" fill="url(#ivyWall)" />

    <!-- Acoustic Vertical Wood Paneling on Back Wall -->
    <g stroke="#3d2217" stroke-width="8" opacity="0.6">
      <line x1="50" y1="60" x2="50" y2="1360" />
      <line x1="110" y1="60" x2="110" y2="1360" />
      <line x1="170" y1="60" x2="170" y2="1360" />
      <line x1="230" y1="60" x2="230" y2="1360" />
      <line x1="850" y1="60" x2="850" y2="1360" />
      <line x1="910" y1="60" x2="910" y2="1360" />
      <line x1="970" y1="60" x2="970" y2="1360" />
      <line x1="1030" y1="60" x2="1030" y2="1360" />
    </g>

    <!-- Classical Architectural Arch Molding -->
    <path d="M 0 180 Q 540 60 1080 180" stroke="#78350f" stroke-width="12" fill="none" opacity="0.45" />

    <!-- Giant Classic Green Chalkboard Behind Board Position -->
    <rect x="60" y="240" width="260" height="900" rx="10" fill="url(#chalkboardGrad)" stroke="#78350f" stroke-width="10" />
    <!-- Chalk Formulas & Sketches -->
    <g stroke="#fef08a" stroke-width="1.8" fill="none" opacity="0.45">
      <text x="80" y="320" font-family="Georgia, serif" font-size="22" font-style="italic" fill="#fef08a" stroke="none">ΔE = mc²</text>
      <text x="80" y="380" font-family="Georgia, serif" font-size="20" fill="#fef08a" stroke="none">PV = nRT</text>
      <circle cx="160" cy="480" r="35" />
      <line x1="125" y1="480" x2="195" y2="480" />
      <line x1="160" y1="445" x2="160" y2="515" />
      <text x="80" y="580" font-family="Georgia, serif" font-size="18" fill="#fef08a" stroke="none">H₂O + CO₂</text>
      <path d="M 80 660 Q 140 620 200 660 T 260 660" />
      <text x="80" y="740" font-family="Georgia, serif" font-size="18" fill="#fef08a" stroke="none">λ = h / p</text>
    </g>

    <!-- Vintage Emerald Banker Lamp on Wall Shelf (Warm Glow) -->
    <circle cx="180" cy="180" r="90" fill="#fbbf24" opacity="0.16" filter="url(#lampGlow)" />
    <rect x="130" y="170" width="100" height="24" rx="12" fill="#047857" stroke="#064e3b" stroke-width="2" />
    <path d="M 180 194 L 180 230 L 160 230 L 200 230" stroke="#d97706" stroke-width="4" />

    <!-- Mahogany Tiered Stage Floor -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#92400e" stroke-width="4" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#mahoganyFloor)" />

    <!-- Wood Plank Perspective Floor Lines -->
    <g stroke="#5c2e17" stroke-width="2" opacity="0.45">
      <line x1="540" y1="1360" x2="120" y2="1920" />
      <line x1="540" y1="1360" x2="360" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="720" y2="1920" />
      <line x1="540" y1="1360" x2="960" y2="1920" />
      <line x1="0" y1="1480" x2="${width}" y2="1480" stroke="#78350f" stroke-width="1.5" />
      <line x1="0" y1="1620" x2="${width}" y2="1620" stroke="#78350f" stroke-width="1.5" />
    </g>
  </svg>`;
}

/**
 * Classroom 3: Bright Scandinavian Creative Science Studio
 */
function buildScandiScienceSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scandiWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fdfbf7" />
        <stop offset="60%" stop-color="#f5ede0" />
        <stop offset="100%" stop-color="#ebdcc7" />
      </linearGradient>
      <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="scandiFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4a373" />
        <stop offset="100%" stop-color="#bc8a5f" />
      </linearGradient>
    </defs>

    <!-- Warm Daylight Wall -->
    <rect width="${width}" height="${height}" fill="url(#scandiWall)" />

    <!-- Big Arched Sunlit Studio Loft Window on Left -->
    <g transform="translate(60, 160)" opacity="0.85">
      <path d="M 0 180 Q 0 0 130 0 Q 260 0 260 180 L 260 700 L 0 700 Z" fill="#e0f2fe" stroke="#a8a29e" stroke-width="8" />
      <!-- Window Grids -->
      <line x1="130" y1="0" x2="130" y2="700" stroke="#a8a29e" stroke-width="6" />
      <line x1="0" y1="260" x2="260" y2="260" stroke="#a8a29e" stroke-width="6" />
      <line x1="0" y1="460" x2="260" y2="460" stroke="#a8a29e" stroke-width="6" />
    </g>

    <!-- Volumetric Sunlight Beams Casting Diagonal Warmth -->
    <polygon points="120,200 320,200 880,1400 400,1400" fill="url(#sunbeam)" />

    <!-- Lush Hanging Indoor Plants (Monstera & Pothos Vines) -->
    <g transform="translate(260, 180)">
      <!-- Macrame Plant Hanger -->
      <line x1="0" y1="0" x2="0" y2="140" stroke="#d6d3d1" stroke-width="3" />
      <ellipse cx="0" cy="150" rx="35" ry="18" fill="#e7e5e4" stroke="#a8a29e" stroke-width="2" />
      <!-- Green Leaves -->
      <path d="M 0 150 Q -30 180 -50 210 Q -20 220 0 160 Z" fill="#16a34a" />
      <path d="M 0 150 Q 30 190 60 230 Q 30 240 5 160 Z" fill="#22c55e" />
      <path d="M -15 155 Q -40 220 -30 280 Q -10 260 -5 160 Z" fill="#15803d" />
      <path d="M 15 155 Q 40 210 50 270 Q 20 250 10 160 Z" fill="#4ade80" />
    </g>

    <!-- Floating Minimalist Magnetic Whiteboard Shelf -->
    <rect x="60" y="900" width="280" height="24" rx="4" fill="#a8a29e" />
    <rect x="80" y="860" width="40" height="40" rx="4" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
    <rect x="135" y="850" width="45" height="50" rx="4" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
    <rect x="195" y="865" width="40" height="35" rx="4" fill="#f472b6" stroke="#db2777" stroke-width="1.5" />

    <!-- Light Scandinavian Birch Hardwood Floor -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#a16207" stroke-width="3" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#scandiFloor)" />
    <!-- Floor Planks -->
    <g stroke="#935610" stroke-width="1.8" opacity="0.35">
      <line x1="540" y1="1360" x2="60" y2="1920" />
      <line x1="540" y1="1360" x2="300" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="780" y2="1920" />
      <line x1="540" y1="1360" x2="1020" y2="1920" />
      <line x1="0" y1="1490" x2="${width}" y2="1490" />
      <line x1="0" y1="1650" x2="${width}" y2="1650" />
    </g>
  </svg>`;
}

/**
 * Classroom 4: Cosmic Astrophysics Planetarium Dome
 */
function buildPlanetariumSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="nebulaDome" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#4c1d95" stop-opacity="0.8" />
        <stop offset="45%" stop-color="#1e1b4b" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#050214" />
      </radialGradient>
      <linearGradient id="cosmicFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e1145" />
        <stop offset="100%" stop-color="#030014" />
      </linearGradient>
      <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>

    <!-- Interstellar Dark Ceiling -->
    <rect width="${width}" height="${height}" fill="url(#nebulaDome)" />

    <!-- Planetarium Constellations & Starfield -->
    <g fill="#ffffff" filter="url(#starGlow)">
      <circle cx="120" cy="180" r="3" />
      <circle cx="200" cy="150" r="2.5" />
      <circle cx="280" cy="220" r="3.5" />
      <circle cx="340" cy="160" r="2" />
      <circle cx="160" cy="320" r="2" />
      <circle cx="240" cy="400" r="3" />
      <circle cx="820" cy="140" r="3" />
      <circle cx="900" cy="220" r="2.5" />
      <circle cx="980" cy="160" r="3.5" />
      <circle cx="880" cy="340" r="2.8" />
    </g>
    <!-- Constellation Lines (Big Dipper / Orion Style) -->
    <g stroke="#818cf8" stroke-width="1.2" opacity="0.45" fill="none">
      <polyline points="120,180 200,150 280,220 340,160 380,240" />
      <polyline points="820,140 900,220 980,160 920,290 880,340" />
    </g>

    <!-- Holographic 3D Planetary Projection in Mid-Air -->
    <g transform="translate(180, 520)" opacity="0.85">
      <!-- Outer Orbit Rings -->
      <ellipse cx="0" cy="0" rx="140" ry="45" fill="none" stroke="#c084fc" stroke-width="2" stroke-dasharray="6 6" />
      <ellipse cx="0" cy="0" rx="190" ry="60" fill="none" stroke="#38bdf8" stroke-width="1.5" />
      <!-- Central Glowing Planet (Saturn / Gas Giant Style) -->
      <circle cx="0" cy="0" r="45" fill="#f59e0b" opacity="0.8" />
      <ellipse cx="0" cy="0" rx="90" ry="18" fill="none" stroke="#fbbf24" stroke-width="6" />
      <!-- Moon -->
      <circle cx="130" cy="-20" r="9" fill="#e0e7ff" />
    </g>

    <!-- Dome Projection Rib Beams -->
    <path d="M 0 0 Q 540 260 1080 0" stroke="#6366f1" stroke-width="2" opacity="0.3" fill="none" />
    <path d="M 0 80 Q 540 380 1080 80" stroke="#8b5cf6" stroke-width="1.5" opacity="0.2" fill="none" />

    <!-- Polished Obsidian Planetarium Floor -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#a855f7" stroke-width="2.5" opacity="0.8" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#cosmicFloor)" />

    <!-- Violet Circular Spotlight Ring on Archie Side -->
    <ellipse cx="230" cy="1680" rx="180" ry="65" fill="#8b5cf6" fill-opacity="0.08" stroke="#a855f7" stroke-width="2" stroke-dasharray="8 6" opacity="0.6" />
  </svg>`;
}

/**
 * Classroom 5: Vintage Chemistry & Biology Discovery Laboratory
 */
function buildChemLabSvg(width = 1080, height = 1920, topic = '') {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="subwayTiles" width="80" height="40" patternUnits="userSpaceOnUse">
        <rect width="80" height="40" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      </pattern>
      <linearGradient id="flaskGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <linearGradient id="flaskAmber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="chemFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
    </defs>

    <!-- White Subway Tile Backsplash Wall -->
    <rect width="${width}" height="1360" fill="url(#subwayTiles)" />

    <!-- Vintage Periodic Table Chart Hanging on Wall -->
    <g transform="translate(60, 160)" opacity="0.9">
      <rect x="0" y="0" width="260" height="280" rx="6" fill="#0f172a" stroke="#475569" stroke-width="3" />
      <text x="130" y="32" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="1">PERIODIC TABLE</text>
      <!-- Grid elements -->
      <g fill="#1e293b" stroke="#334155" stroke-width="1">
        <rect x="15" y="50" width="30" height="30" rx="2" fill="#ef4444" /><text x="30" y="70" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">H</text>
        <rect x="215" y="50" width="30" height="30" rx="2" fill="#3b82f6" /><text x="230" y="70" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">He</text>
        <rect x="15" y="90" width="30" height="30" rx="2" fill="#10b981" /><text x="30" y="110" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">Li</text>
        <rect x="55" y="90" width="30" height="30" rx="2" fill="#f59e0b" /><text x="70" y="110" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">Be</text>
        <rect x="175" y="90" width="30" height="30" rx="2" fill="#8b5cf6" /><text x="190" y="110" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
        <rect x="215" y="90" width="30" height="30" rx="2" fill="#3b82f6" /><text x="230" y="110" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">Ne</text>
      </g>
    </g>

    <!-- Lab Counter with Chemistry Glassware (Coils & Florence Flasks) -->
    <g transform="translate(50, 800)">
      <!-- Counter Surface -->
      <rect x="0" y="240" width="280" height="120" rx="4" fill="#0f172a" stroke="#334155" stroke-width="3" />
      
      <!-- Erlenmeyer Flask with Glowing Green Fluid -->
      <path d="M 60 170 L 75 170 L 75 120 L 55 120 L 55 170 Z" fill="#94a3b8" opacity="0.5" />
      <path d="M 35 240 L 95 240 L 75 170 L 55 170 Z" fill="url(#flaskGreen)" stroke="#059669" stroke-width="2" />
      <!-- Bubbles -->
      <circle cx="60" cy="220" r="3.5" fill="#ffffff" opacity="0.8" />
      <circle cx="75" cy="200" r="2.5" fill="#ffffff" opacity="0.8" />

      <!-- Florence Spherical Flask with Amber Fluid -->
      <path d="M 175 130 L 175 180" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" />
      <circle cx="175" cy="210" r="32" fill="url(#flaskAmber)" stroke="#d97706" stroke-width="2" />

      <!-- Vintage Brass Monocular Microscope -->
      <g transform="translate(230, 110)">
        <path d="M 20 130 L 20 60 L -10 30" stroke="#d97706" stroke-width="10" stroke-linecap="round" fill="none" />
        <rect x="-25" y="15" width="20" height="35" rx="3" fill="#b45309" stroke="#78350f" stroke-width="2" />
        <ellipse cx="20" cy="130" rx="25" ry="10" fill="#1e293b" />
      </g>
    </g>

    <!-- Dark Slate Chemical Lab Floor -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#059669" stroke-width="2.5" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#chemFloor)" />
    <!-- Slate Tile Floor Perspective -->
    <g stroke="#334155" stroke-width="1.8" opacity="0.45">
      <line x1="540" y1="1360" x2="80" y2="1920" />
      <line x1="540" y1="1360" x2="320" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="760" y2="1920" />
      <line x1="540" y1="1360" x2="1000" y2="1920" />
      <line x1="0" y1="1490" x2="${width}" y2="1490" />
      <line x1="0" y1="1650" x2="${width}" y2="1650" />
    </g>
  </svg>`;
}

const CLASSROOM_STYLES = [
  { id: 'cyber_stem', name: 'Cyber STEM Lab', fn: buildCyberStemLabSvg },
  { id: 'ivy_hall', name: 'Ivy League Lecture Hall', fn: buildIvyHallSvg },
  { id: 'scandi_science', name: 'Scandinavian Science Studio', fn: buildScandiScienceSvg },
  { id: 'planetarium', name: 'Astrophysics Planetarium', fn: buildPlanetariumSvg },
  { id: 'chem_lab', name: 'Discovery Chemistry Lab', fn: buildChemLabSvg }
];

/**
 * Get one of the 5 distinct classroom backgrounds
 * @param {number|string} selector - Index (0-4), style id, or seed number
 * @param {number} width - 1080 default
 * @param {number} height - 1920 default
 * @param {string} topic - optional topic name
 */
function getDistinctClassroomSvg(selector = 0, width = 1080, height = 1920, topic = '') {
  let idx = 0;
  if (typeof selector === 'number') {
    idx = Math.abs(selector) % CLASSROOM_STYLES.length;
  } else if (typeof selector === 'string') {
    const foundIdx = CLASSROOM_STYLES.findIndex(c => c.id === selector);
    if (foundIdx !== -1) {
      idx = foundIdx;
    } else {
      idx = Math.abs(selector.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % CLASSROOM_STYLES.length;
    }
  }

  const chosen = CLASSROOM_STYLES[idx];
  return {
    svg: chosen.fn(width, height, topic),
    styleId: chosen.id,
    styleName: chosen.name,
    styleIndex: idx
  };
}

module.exports = {
  CLASSROOM_STYLES,
  getDistinctClassroomSvg,
  buildCyberStemLabSvg,
  buildIvyHallSvg,
  buildScandiScienceSvg,
  buildPlanetariumSvg,
  buildChemLabSvg
};
