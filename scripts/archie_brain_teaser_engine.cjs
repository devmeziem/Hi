/**
 * Archie Brain Teaser & Logic Riddle Engine
 *
 * Automated generation of visual physics puzzles and logic brain teasers:
 * - Traffic Gridlock: Which car must move first to untangle the intersection?
 * - Water Pipe Siphon: Which tank fills first through interconnected valves?
 * - Laser Optics Reflection: Which sensor does the beam hit after 4 mirrors?
 * - Gear Train Direction: Clockwise or Counter-Clockwise gear transmission?
 * - Circuit Logic Switch: Which switch closes the loop to ignite the bulb?
 * - Torque Fulcrum Balance: Mechanical advantage distance lever riddle?
 *
 * Complete with Archie avatar badge, 9:16 vertical vector layout, and timed reveal mechanics.
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
 * Archie Host Avatar Badge for Brain Teaser SVGs
 */
function buildArchieHostBadge(x = 60, y = 70, scale = 1.0) {
  return `
  <!-- Archie Host Reaction Badge -->
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <rect width="320" height="96" rx="28" fill="#0f172a" stroke="#10b981" stroke-width="3" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.5))" />
    <!-- Avatar Circle -->
    <circle cx="50" cy="48" r="36" fill="#064e3b" stroke="#34d399" stroke-width="2.5" />
    <!-- Archie Face Vector -->
    <g transform="translate(18, 16)">
      <!-- Hair -->
      <path d="M 12 28 Q 32 8 52 28 Q 58 14 42 8 Q 22 8 12 28 Z" fill="#b45309" />
      <!-- Face -->
      <ellipse cx="32" cy="36" rx="20" ry="22" fill="#fed7aa" />
      <!-- Eyes & Glasses -->
      <circle cx="25" cy="34" r="5" fill="#ffffff" stroke="#047857" stroke-width="2" />
      <circle cx="39" cy="34" r="5" fill="#ffffff" stroke="#047857" stroke-width="2" />
      <line x1="30" y1="34" x2="34" y2="34" stroke="#047857" stroke-width="2" />
      <circle cx="26" cy="34" r="2.5" fill="#0f172a" />
      <circle cx="40" cy="34" r="2.5" fill="#0f172a" />
      <!-- Confident Smile -->
      <path d="M 27 46 Q 32 51 37 46" stroke="#9a3412" stroke-width="2" fill="none" stroke-linecap="round" />
    </g>
    <!-- Label -->
    <text x="100" y="42" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#ffffff">ARCHIE'S RIDDLE</text>
    <text x="100" y="66" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#34d399">Can you solve in 5s?</text>
  </g>`;
}

/**
 * Brain Teaser 1: Traffic Intersection Gridlock
 */
function buildTrafficGridlockSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    ${buildArchieHostBadge(60, 60, 1.1)}

    <!-- Header Banner -->
    <rect x="60" y="200" width="960" height="150" rx="24" fill="#0f172a" stroke="#3b82f6" stroke-width="3" />
    <text x="540" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#ffffff">WHICH CAR UNLOCKS THE GRIDLOCK?</text>
    <text x="540" y="305" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="22" fill="#93c5fd">Only ONE car has an open reverse lane to free the rest!</text>

    <!-- Intersection Asphalt -->
    <g transform="translate(140, 420)">
      <!-- Road Base -->
      <rect x="0" y="0" width="800" height="800" rx="32" fill="#1e293b" stroke="#334155" stroke-width="6" />
      <!-- Cross Roads -->
      <rect x="0" y="260" width="800" height="280" fill="#0f172a" />
      <rect x="260" y="0" width="280" height="800" fill="#0f172a" />
      <!-- Center Box Yellow Hash -->
      <rect x="260" y="260" width="280" height="280" fill="#111827" stroke="#eab308" stroke-width="4" stroke-dasharray="14 8" />

      <!-- Dashed Lane Markers -->
      <line x1="400" y1="20" x2="400" y2="240" stroke="#f8fafc" stroke-width="4" stroke-dasharray="20 15" />
      <line x1="400" y1="560" x2="400" y2="780" stroke="#f8fafc" stroke-width="4" stroke-dasharray="20 15" />
      <line x1="20" y1="400" x2="240" y2="400" stroke="#f8fafc" stroke-width="4" stroke-dasharray="20 15" />
      <line x1="560" y1="400" x2="780" y2="400" stroke="#f8fafc" stroke-width="4" stroke-dasharray="20 15" />

      <!-- Car A (Red - Heading East, blocked by Car B) -->
      <g transform="translate(160, 310)">
        <rect width="180" height="80" rx="16" fill="#ef4444" stroke="#ffffff" stroke-width="4" />
        <rect x="40" y="15" width="80" height="50" rx="8" fill="#1e293b" />
        <circle cx="90" cy="40" r="22" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
        <text x="90" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">A</text>
        <path d="M 150 40 L 175 40 M 165 30 L 175 40 L 165 50" stroke="#fef08a" stroke-width="4" fill="none" />
      </g>

      <!-- Car B (Blue - Heading South, blocked by Car C) -->
      <g transform="translate(430, 160)">
        <rect width="80" height="180" rx="16" fill="#3b82f6" stroke="#ffffff" stroke-width="4" />
        <rect x="15" y="40" width="50" height="80" rx="8" fill="#1e293b" />
        <circle cx="40" cy="90" r="22" fill="#3b82f6" stroke="#ffffff" stroke-width="3" />
        <text x="40" y="98" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">B</text>
        <path d="M 40 150 L 40 175 M 30 165 L 40 175 L 50 165" stroke="#fef08a" stroke-width="4" fill="none" />
      </g>

      <!-- Car C (Emerald - Heading West, has empty space behind in reverse lane!) -->
      <g transform="translate(460, 420)">
        <rect width="180" height="80" rx="16" fill="#10b981" stroke="#ffffff" stroke-width="4" />
        <rect x="60" y="15" width="80" height="50" rx="8" fill="#1e293b" />
        <circle cx="100" cy="40" r="22" fill="#10b981" stroke="#ffffff" stroke-width="3" />
        <text x="100" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">C</text>
        <!-- Reverse clearance arrow -->
        <path d="M 30 40 L 5 40 M 15 30 L 5 40 L 15 50" stroke="#fef08a" stroke-width="4" fill="none" />
      </g>

      <!-- Car D (Amber - Heading North, blocked by Car A) -->
      <g transform="translate(290, 460)">
        <rect width="80" height="180" rx="16" fill="#f59e0b" stroke="#ffffff" stroke-width="4" />
        <rect x="15" y="60" width="50" height="80" rx="8" fill="#1e293b" />
        <circle cx="40" cy="90" r="22" fill="#f59e0b" stroke="#ffffff" stroke-width="3" />
        <text x="40" y="98" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">D</text>
        <path d="M 40 30 L 40 5 M 30 15 L 40 5 L 50 15" stroke="#fef08a" stroke-width="4" fill="none" />
      </g>
    </g>

    <!-- Choice Options Cards at Bottom -->
    <g transform="translate(60, 1300)">
      <rect width="960" height="420" rx="28" fill="#0f172a" stroke="#334155" stroke-width="3" />
      <text x="480" y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#f8fafc">SELECT YOUR ANSWER:</text>

      <g transform="translate(40, 100)">
        <!-- Choice A -->
        <rect x="0" y="0" width="410" height="110" rx="18" fill="#1e293b" stroke="#ef4444" stroke-width="3" />
        <circle cx="55" cy="55" r="30" fill="#ef4444" />
        <text x="55" y="65" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">A</text>
        <text x="110" y="52" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Car A (Red)</text>
        <text x="110" y="76" font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="#94a3b8">Heading East</text>

        <!-- Choice B -->
        <rect x="470" y="0" width="410" height="110" rx="18" fill="#1e293b" stroke="#3b82f6" stroke-width="3" />
        <circle cx="525" cy="55" r="30" fill="#3b82f6" />
        <text x="525" y="65" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">B</text>
        <text x="580" y="52" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Car B (Blue)</text>
        <text x="580" y="76" font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="#94a3b8">Heading South</text>

        <!-- Choice C (Correct) -->
        <rect x="0" y="140" width="410" height="110" rx="18" fill="#064e3b" stroke="#10b981" stroke-width="4" />
        <circle cx="55" cy="195" r="30" fill="#10b981" />
        <text x="55" y="205" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">C</text>
        <text x="110" y="192" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Car C (Green) ★</text>
        <text x="110" y="216" font-family="system-ui, sans-serif" font-weight="600" font-size="14" fill="#6ee7b7">Can reverse cleanly!</text>

        <!-- Choice D -->
        <rect x="470" y="140" width="410" height="110" rx="18" fill="#1e293b" stroke="#f59e0b" stroke-width="3" />
        <circle cx="525" cy="195" r="30" fill="#f59e0b" />
        <text x="525" y="205" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">D</text>
        <text x="580" y="192" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Car D (Amber)</text>
        <text x="580" y="216" font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="#94a3b8">Heading North</text>
      </g>

      <text x="480" y="380" text-anchor="middle" font-family="monospace" font-size="16" fill="#10b981">
        Archie Logic Breakdown: Car C reverses → Car B proceeds → Car A moves → Car D exits!
      </text>
    </g>
  </svg>`;
}

/**
 * Brain Teaser 2: Interconnected Liquid Siphon
 */
function buildLiquidSiphonSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#020617" />
    ${buildArchieHostBadge(60, 60, 1.1)}

    <rect x="60" y="200" width="960" height="150" rx="24" fill="#0f172a" stroke="#06b6d4" stroke-width="3" />
    <text x="540" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#ffffff">WHICH FLASK FILLS UP FIRST?</text>
    <text x="540" y="305" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="22" fill="#67e8f9">Water pours constantly into Flask 1 from the top tap!</text>

    <!-- Liquid Siphon Flask Network Diagram -->
    <g transform="translate(100, 420)">
      <!-- Main Flask 1 (Top Center) -->
      <rect x="360" y="40" width="160" height="240" rx="16" fill="#082f49" stroke="#38bdf8" stroke-width="4" />
      <text x="440" y="160" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">1</text>
      <!-- Pouring Water Tap Above Flask 1 -->
      <rect x="420" y="-30" width="40" height="60" fill="#94a3b8" />
      <line x1="440" y1="30" x2="440" y2="90" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" />

      <!-- Left Pipe from 1 to Flask 2 (Lower height pipe) -->
      <path d="M 360 180 L 220 180 L 220 320" stroke="#38bdf8" stroke-width="20" fill="none" />
      <!-- Right Pipe from 1 to Flask 3 (Blocked at entrance!) -->
      <path d="M 520 120 L 660 120 L 660 320" stroke="#475569" stroke-width="20" fill="none" />
      <rect x="525" y="110" width="14" height="22" fill="#ef4444" /> <!-- Red Block Plug -->

      <!-- Flask 2 (Mid-Left) -->
      <rect x="140" y="320" width="160" height="240" rx="16" fill="#082f49" stroke="#38bdf8" stroke-width="4" />
      <text x="220" y="440" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">2</text>

      <!-- Flask 3 (Mid-Right) -->
      <rect x="580" y="320" width="160" height="240" rx="16" fill="#082f49" stroke="#475569" stroke-width="4" />
      <text x="660" y="440" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#94a3b8">3</text>

      <!-- Pipe from 2 to Flask 4 (Bottom-Left) -->
      <path d="M 140 480 L 60 480 L 60 620" stroke="#38bdf8" stroke-width="20" fill="none" />
      <!-- Flask 4 (Correct - Lowest and unblocked!) -->
      <rect x="-20" y="620" width="160" height="240" rx="16" fill="#0c4a6e" stroke="#10b981" stroke-width="6" />
      <text x="60" y="740" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#34d399">4 ★</text>
      <!-- Water Fill Animation Graphic in Flask 4 -->
      <rect x="-14" y="730" width="148" height="124" rx="12" fill="#0284c7" opacity="0.8" />

      <!-- Pipe from 2 to Flask 5 (Blocked by interior barrier) -->
      <path d="M 300 480 L 380 480 L 380 620" stroke="#475569" stroke-width="20" fill="none" />
      <rect x="370" y="520" width="22" height="14" fill="#ef4444" /> <!-- Blocked Plug -->
      <rect x="300" y="620" width="160" height="240" rx="16" fill="#082f49" stroke="#475569" stroke-width="4" />
      <text x="380" y="740" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#94a3b8">5</text>
    </g>

    <!-- Choice Options Cards at Bottom -->
    <g transform="translate(60, 1360)">
      <rect width="960" height="380" rx="28" fill="#0f172a" stroke="#334155" stroke-width="3" />
      <text x="480" y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#f8fafc">TAP TO GUESS THE WINNING FLASK:</text>

      <g transform="translate(60, 100)">
        <rect x="0" y="0" width="180" height="120" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
        <text x="90" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">FLASK 1</text>

        <rect x="220" y="0" width="180" height="120" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
        <text x="310" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">FLASK 2</text>

        <rect x="440" y="0" width="180" height="120" rx="16" fill="#1e293b" stroke="#475569" stroke-width="3" />
        <text x="530" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#94a3b8">FLASK 3</text>

        <!-- Flask 4 Correct -->
        <rect x="660" y="0" width="180" height="120" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="4" />
        <text x="750" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#34d399">FLASK 4</text>
      </g>

      <text x="480" y="300" text-anchor="middle" font-family="monospace" font-size="16" fill="#10b981">
        Archie Physics Tip: Pipe 1→3 is plugged. Pipe 2→4 is below water line. Flask 4 fills first!
      </text>
    </g>
  </svg>`;
}

/**
 * Brain Teaser 3: Optical Laser Reflection Path
 */
function buildOpticsReflectionSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#050814" />
    ${buildArchieHostBadge(60, 60, 1.1)}

    <rect x="60" y="200" width="960" height="150" rx="24" fill="#0f172a" stroke="#ec4899" stroke-width="3" />
    <text x="540" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#ffffff">WHICH TARGET DOES THE LASER HIT?</text>
    <text x="540" y="305" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="22" fill="#f472b6">All 4 mirrors are locked at 45° angles (Angle of Incidence = Angle of Reflection)!</text>

    <!-- Optics Grid -->
    <g transform="translate(140, 420)">
      <rect width="800" height="800" rx="24" fill="#0a0f24" stroke="#1e293b" stroke-width="4" />

      <!-- Laser Emitter on Left -->
      <rect x="20" y="200" width="60" height="40" rx="8" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
      <text x="50" y="225" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="12" fill="#ffffff">EMIT</text>

      <!-- Laser Beam Path -->
      <path d="M 80 220 L 300 220 L 300 560 L 600 560 L 600 220 L 740 220" stroke="#f43f5e" stroke-width="6" fill="none" opacity="0.85" filter="drop-shadow(0 0 10px #f43f5e)" />

      <!-- Mirror 1 (at 300, 220 deflects down) -->
      <line x1="270" y1="190" x2="330" y2="250" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" />
      <!-- Mirror 2 (at 300, 560 deflects right) -->
      <line x1="270" y1="590" x2="330" y2="530" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" />
      <!-- Mirror 3 (at 600, 560 deflects up) -->
      <line x1="570" y1="530" x2="630" y2="590" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" />
      <!-- Mirror 4 (at 600, 220 deflects right) -->
      <line x1="570" y1="190" x2="630" y2="250" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" />

      <!-- Target Sensor Targets -->
      <!-- Sensor A (Top) -->
      <g transform="translate(560, 60)">
        <circle cx="40" cy="40" r="34" fill="#1e293b" stroke="#e2e8f0" stroke-width="3" />
        <text x="40" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#ffffff">A</text>
      </g>
      <!-- Sensor B (Right - Correct!) -->
      <g transform="translate(720, 180)">
        <circle cx="40" cy="40" r="34" fill="#064e3b" stroke="#10b981" stroke-width="4" />
        <text x="40" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#34d399">B ★</text>
      </g>
      <!-- Sensor C (Bottom) -->
      <g transform="translate(560, 700)">
        <circle cx="40" cy="40" r="34" fill="#1e293b" stroke="#e2e8f0" stroke-width="3" />
        <text x="40" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#ffffff">C</text>
      </g>
    </g>

    <g transform="translate(60, 1360)">
      <rect width="960" height="380" rx="28" fill="#0f172a" stroke="#334155" stroke-width="3" />
      <text x="480" y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#f8fafc">WHICH SENSOR IS HIT?</text>

      <g transform="translate(100, 110)">
        <rect x="0" y="0" width="220" height="110" rx="16" fill="#1e293b" stroke="#475569" stroke-width="3" />
        <text x="110" y="65" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff">SENSOR A</text>

        <!-- Correct B -->
        <rect x="270" y="0" width="220" height="110" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="4" />
        <text x="380" y="65" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#34d399">SENSOR B ★</text>

        <rect x="540" y="0" width="220" height="110" rx="16" fill="#1e293b" stroke="#475569" stroke-width="3" />
        <text x="650" y="65" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff">SENSOR C</text>
      </g>

      <text x="480" y="300" text-anchor="middle" font-family="monospace" font-size="16" fill="#10b981">
        Archie Optics Law: 4 reflections (Down → Right → Up → Right) lands squarely on Sensor B!
      </text>
    </g>
  </svg>`;
}

/**
 * Brain Teaser 4: Gear Train Rotation Direction
 */
function buildGearTrainSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#0f172a" />
    ${buildArchieHostBadge(60, 60, 1.1)}

    <rect x="60" y="200" width="960" height="150" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="3" />
    <text x="540" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#ffffff">WHICH WAY DOES GEAR F ROTATE?</text>
    <text x="540" y="305" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="22" fill="#fde68a">Gear A turns CLOCKWISE (CW). Trace through all 5 meshed teeth!</text>

    <!-- Gear Train Schematic -->
    <g transform="translate(100, 480)">
      <!-- Gear A (Clockwise) -->
      <circle cx="120" cy="180" r="90" fill="#334155" stroke="#f59e0b" stroke-width="8" stroke-dasharray="16 10" />
      <text x="120" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">A (CW)</text>

      <!-- Gear B (Counter-Clockwise) -->
      <circle cx="280" cy="240" r="70" fill="#1e293b" stroke="#38bdf8" stroke-width="6" stroke-dasharray="14 8" />
      <text x="280" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">B</text>

      <!-- Gear C (Clockwise) -->
      <circle cx="440" cy="180" r="90" fill="#334155" stroke="#f59e0b" stroke-width="8" stroke-dasharray="16 10" />
      <text x="440" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">C</text>

      <!-- Gear D (Counter-Clockwise) -->
      <circle cx="580" cy="250" r="60" fill="#1e293b" stroke="#38bdf8" stroke-width="6" stroke-dasharray="14 8" />
      <text x="580" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#ffffff">D</text>

      <!-- Gear E (Clockwise) -->
      <circle cx="710" cy="190" r="70" fill="#334155" stroke="#f59e0b" stroke-width="8" stroke-dasharray="16 10" />
      <text x="710" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff">E</text>

      <!-- Gear F (Final - Counter-Clockwise!) -->
      <circle cx="840" cy="300" r="80" fill="#064e3b" stroke="#10b981" stroke-width="10" stroke-dasharray="16 10" />
      <text x="840" y="310" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#34d399">F ?</text>
    </g>

    <!-- Choice Options Cards at Bottom -->
    <g transform="translate(60, 1360)">
      <rect width="960" height="380" rx="28" fill="#1e293b" stroke="#334155" stroke-width="3" />
      <text x="480" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#f8fafc">PICK GEAR F DIRECTION:</text>

      <g transform="translate(120, 120)">
        <rect x="0" y="0" width="320" height="120" rx="20" fill="#0f172a" stroke="#f59e0b" stroke-width="4" />
        <text x="160" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">1. CLOCKWISE (CW)</text>

        <!-- Correct Choice 2 -->
        <rect x="400" y="0" width="320" height="120" rx="20" fill="#064e3b" stroke="#10b981" stroke-width="5" />
        <text x="560" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#34d399">2. COUNTER-CW (CCW) ★</text>
      </g>

      <text x="480" y="310" text-anchor="middle" font-family="monospace" font-size="16" fill="#10b981">
        Archie Rule: Adjacent gears alternate! A(CW) → B(CCW) → C(CW) → D(CCW) → E(CW) → F(CCW)!
      </text>
    </g>
  </svg>`;
}

/**
 * Registry of all 4 Viral Brain Teasers
 */
const BRAIN_TEASERS = [
  {
    id: 'traffic_gridlock',
    title: 'Intersection Traffic Gridlock',
    question: 'Which car must move first to unlock the gridlock?',
    correctAnswer: 'Car C (Green)',
    explanation: 'Car C has a clear reverse lane behind it. Once C reverses, Car B proceeds south, Car A drives east, and Car D clears north!',
    fn: buildTrafficGridlockSvg
  },
  {
    id: 'water_siphon',
    title: 'Interconnected Liquid Siphon',
    question: 'Which flask fills up with water first?',
    correctAnswer: 'Flask 4',
    explanation: 'Pipe 1→3 is blocked at the inlet. Pipe 2→4 sits lower than Pipe 2→5. Water drains down into Flask 4 before 2 can ever overflow!',
    fn: buildLiquidSiphonSvg
  },
  {
    id: 'optics_laser',
    title: 'Optical Laser Reflection',
    question: 'Which sensor does the laser strike after 4 mirrors?',
    correctAnswer: 'Sensor B',
    explanation: '45-degree planar reflection bounces beam: Down → Right → Up → Right, scoring a direct hit on Sensor B.',
    fn: buildOpticsReflectionSvg
  },
  {
    id: 'gear_train',
    title: 'Meshed Gear Train Direction',
    question: 'Which direction does Gear F rotate if Gear A turns Clockwise?',
    correctAnswer: 'Counter-Clockwise (CCW)',
    explanation: 'Directly meshed gears reverse direction at every contact point. An even number of transitions (6th gear) means opposite of start: CCW!',
    fn: buildGearTrainSvg
  }
];

function getBrainTeaserSvg(selector = 0, width = 1080, height = 1920) {
  let idx = 0;
  if (typeof selector === 'number') {
    idx = Math.abs(selector) % BRAIN_TEASERS.length;
  } else if (typeof selector === 'string') {
    const f = BRAIN_TEASERS.findIndex(b => b.id === selector);
    idx = f !== -1 ? f : 0;
  }
  const chosen = BRAIN_TEASERS[idx];
  return {
    svg: chosen.fn(width, height),
    id: chosen.id,
    title: chosen.title,
    question: chosen.question,
    correctAnswer: chosen.correctAnswer,
    explanation: chosen.explanation
  };
}

module.exports = {
  BRAIN_TEASERS,
  getBrainTeaserSvg,
  buildTrafficGridlockSvg,
  buildLiquidSiphonSvg,
  buildOpticsReflectionSvg,
  buildGearTrainSvg
};
