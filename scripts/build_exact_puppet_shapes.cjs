/**
 * Exact Geometric Puppet Shape Builder
 * 
 * Programmatically constructs the exact character from reference images:
 * - Tall, lanky geometric wooden/mannequin puppet
 * - Dark chocolate hair with 2 sharp upward/forward spikes
 * - Angular face, big round cartoon eyes, arched dark eyebrows, triangular coral-red nose
 * - Round protruding ears with warm orange-red inner contour
 * - Dark indigo navy blue crewneck t-shirt with spherical shoulder joint caps
 * - Long amber skin limbs with signature RED ELBOW BANDS & RED WRIST BANDS
 * - Classic mid-wash blue denim jeans with circular knee joints & rolled cuffs
 * - Low-top black canvas sneakers with white rubber toe caps, white foxing sole, and laces
 * 
 * Outputs high-resolution SVG and 32-bit transparent PNGs for MoviePy & FFmpeg compositors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
const COMP_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet');

// Helper to render Head component
function renderHead(pose = 'idle', blink = false, talking = false) {
  const pupilOffset = pose === 'point_left' ? -6 : (pose === 'point_right' ? 6 : 0);
  const eyeL = blink
    ? `<line x1="210" y1="215" x2="236" y2="215" stroke="#1f2937" stroke-width="4" stroke-linecap="round" />`
    : `<circle cx="223" cy="215" r="14" fill="#ffffff" stroke="#1f2937" stroke-width="2.5" />
       <circle cx="${223 + pupilOffset}" cy="215" r="7" fill="#111827" />
       <circle cx="${221 + pupilOffset}" cy="212" r="2.5" fill="#ffffff" />`;

  const eyeR = blink
    ? `<line x1="264" y1="215" x2="290" y2="215" stroke="#1f2937" stroke-width="4" stroke-linecap="round" />`
    : `<circle cx="277" cy="215" r="14" fill="#ffffff" stroke="#1f2937" stroke-width="2.5" />
       <circle cx="${277 + pupilOffset}" cy="215" r="7" fill="#111827" />
       <circle cx="${275 + pupilOffset}" cy="212" r="2.5" fill="#ffffff" />`;

  const mouth = talking
    ? `<path d="M 235 272 Q 250 288 265 272 Z" fill="#7f1d1d" stroke="#1f2937" stroke-width="2.5" />
       <path d="M 240 274 Q 250 278 260 274" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />`
    : `<path d="M 238 272 Q 250 278 262 272" fill="none" stroke="#29140c" stroke-width="3" stroke-linecap="round" />`;

  return `
    <!-- Neck -->
    <polygon points="238,300 262,300 265,340 235,340" fill="#f59e0b" stroke="#1f2937" stroke-width="2" />
    <polygon points="235,335 265,335 263,342 237,342" fill="#d97706" />

    <!-- Left Ear -->
    <ellipse cx="188" cy="235" rx="14" ry="18" fill="#f59e0b" stroke="#1f2937" stroke-width="2.5" />
    <ellipse cx="188" cy="235" rx="8" ry="11" fill="#ea580c" />

    <!-- Right Ear -->
    <ellipse cx="312" cy="235" rx="14" ry="18" fill="#f59e0b" stroke="#1f2937" stroke-width="2.5" />
    <ellipse cx="312" cy="235" rx="8" ry="11" fill="#ea580c" />

    <!-- Head Base / Face Polygon -->
    <polygon points="198,160 302,160 292,280 250,305 208,280" fill="#fbbf24" stroke="#1f2937" stroke-width="3" stroke-linejoin="round" />
    
    <!-- Face Shading (Geometric facets) -->
    <polygon points="250,160 302,160 292,280 250,305" fill="#f59e0b" opacity="0.45" />

    <!-- Hair (Dark chocolate brown with 2 iconic sharp upward/forward spikes) -->
    <path d="M 194 175 
             L 194 150 
             L 220 152 
             L 235 90 
             L 255 140 
             L 282 85 
             L 295 145 
             L 306 175 
             L 302 185 
             L 296 160 
             L 204 160 
             L 194 185 Z" 
          fill="#3b1d11" stroke="#1f2937" stroke-width="3" stroke-linejoin="round" />
    <polygon points="235,90 255,140 248,155 228,145" fill="#2c140a" />
    <polygon points="282,85 295,145 285,155 268,145" fill="#2c140a" />

    <!-- Eyebrows (Thick, angular, expressive) -->
    <polygon points="210,195 240,190 242,198 212,203" fill="#1f2937" />
    <polygon points="260,190 290,195 288,203 258,198" fill="#1f2937" />

    <!-- Eyes -->
    ${eyeL}
    ${eyeR}

    <!-- Triangular Red Nose (Signature feature) -->
    <polygon points="250,205 264,250 246,252" fill="#ef4444" stroke="#1f2937" stroke-width="2" stroke-linejoin="round" />
    <polygon points="250,205 264,250 256,251" fill="#dc2626" />

    <!-- Mouth -->
    ${mouth}
  `;
}

// Helper to render Torso and T-Shirt
function renderTorso() {
  return `
    <!-- Shoulder Ball Joints -->
    <circle cx="178" cy="365" r="18" fill="#1e3a8a" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="322" cy="365" r="18" fill="#1e3a8a" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="178" cy="365" r="14" fill="#2563eb" opacity="0.3" />
    <circle cx="322" cy="365" r="14" fill="#2563eb" opacity="0.3" />

    <!-- Dark Indigo Navy Blue Crewneck T-Shirt -->
    <path d="M 230 338 Q 250 348 270 338 L 330 355 L 340 450 L 305 460 L 298 520 L 202 520 L 195 460 L 160 450 L 170 355 Z" 
          fill="#1e3a8a" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
    
    <!-- T-Shirt Shading & Crewneck Collar -->
    <path d="M 230 338 Q 250 350 270 338" fill="none" stroke="#60a5fa" stroke-width="3" />
    <polygon points="250,344 330,355 340,450 305,460 298,520 250,520" fill="#0f172a" opacity="0.22" />

    <!-- Brown Belt with Buckle -->
    <rect x="200" y="520" width="100" height="24" rx="4" fill="#78350f" stroke="#0f172a" stroke-width="2.5" />
    <rect x="238" y="523" width="24" height="18" rx="3" fill="#b45309" stroke="#fef3c7" stroke-width="2" />
  `;
}

// Helper to render Legs, Denim Jeans & Converse Sneakers
function renderLegs(pose = 'idle') {
  if (pose === 'walking') {
    return `
      <!-- Leg Left (Forward stride) -->
      <polygon points="202,544 246,544 235,740 195,740" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
      <circle cx="215" cy="740" r="16" fill="#1d4ed8" stroke="#0f172a" stroke-width="2.5" />
      <polygon points="198,740 232,740 220,950 186,950" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
      <rect x="182" y="940" width="42" height="18" rx="4" fill="#93c5fd" stroke="#0f172a" stroke-width="2" />
      <!-- Left Shoe -->
      <path d="M 160 985 L 225 985 L 225 956 L 195 956 L 160 970 Z" fill="#18181b" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 155 985 L 180 985 L 180 972 L 162 972 Z" fill="#f4f4f5" stroke="#0f172a" stroke-width="2" />
      <rect x="155" y="983" width="72" height="7" fill="#f4f4f5" stroke="#0f172a" stroke-width="1.5" />
      <line x1="184" y1="964" x2="198" y2="964" stroke="#ffffff" stroke-width="2" />
      <line x1="186" y1="970" x2="200" y2="970" stroke="#ffffff" stroke-width="2" />

      <!-- Leg Right (Back stride) -->
      <polygon points="254,544 298,544 315,740 275,740" fill="#1d4ed8" stroke="#0f172a" stroke-width="2.5" />
      <circle cx="295" cy="740" r="16" fill="#1e40af" stroke="#0f172a" stroke-width="2.5" />
      <polygon points="278,740 312,740 330,950 296,950" fill="#1d4ed8" stroke="#0f172a" stroke-width="2.5" />
      <rect x="292" y="940" width="42" height="18" rx="4" fill="#93c5fd" stroke="#0f172a" stroke-width="2" />
      <!-- Right Shoe -->
      <path d="M 285 985 L 350 985 L 350 970 L 315 956 L 285 956 Z" fill="#18181b" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 330 985 L 355 985 L 355 972 L 338 972 Z" fill="#f4f4f5" stroke="#0f172a" stroke-width="2" />
      <rect x="282" y="983" width="75" height="7" fill="#f4f4f5" stroke="#0f172a" stroke-width="1.5" />
      <line x1="305" y1="964" x2="319" y2="964" stroke="#ffffff" stroke-width="2" />
      <line x1="307" y1="970" x2="321" y2="970" stroke="#ffffff" stroke-width="2" />
    `;
  }

  // Standard Straight Mannequin Stance
  return `
    <!-- Pelvis / Jeans Top -->
    <polygon points="202,544 298,544 294,590 250,600 206,590" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 250 544 L 250 590" stroke="#1e3a8a" stroke-width="2" />

    <!-- Left Leg (Straight, long, lanky) -->
    <polygon points="206,585 244,592 238,760 206,760" fill="#3b82f6" stroke="#0f172a" stroke-width="2.5" />
    <!-- Left Knee Joint Sphere -->
    <circle cx="222" cy="760" r="17" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="222" cy="760" r="11" fill="#60a5fa" opacity="0.4" />
    <!-- Left Lower Shin -->
    <polygon points="208,760 236,760 230,950 204,950" fill="#3b82f6" stroke="#0f172a" stroke-width="2.5" />
    <!-- Rolled Denim Cuff -->
    <rect x="200" y="942" width="34" height="18" rx="4" fill="#93c5fd" stroke="#0f172a" stroke-width="2" />

    <!-- Right Leg (Straight, long, lanky) -->
    <polygon points="256,592 294,585 294,760 262,760" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
    <!-- Right Knee Joint Sphere -->
    <circle cx="278" cy="760" r="17" fill="#1d4ed8" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="278" cy="760" r="11" fill="#60a5fa" opacity="0.4" />
    <!-- Right Lower Shin -->
    <polygon points="264,760 292,760 296,950 270,950" fill="#2563eb" stroke="#0f172a" stroke-width="2.5" />
    <!-- Rolled Denim Cuff -->
    <rect x="266" y="942" width="34" height="18" rx="4" fill="#93c5fd" stroke="#0f172a" stroke-width="2" />

    <!-- Left Shoe (Converse Style: Black canvas, white toe cap, white rubber sole, white laces) -->
    <path d="M 156 988 L 232 988 L 232 958 L 202 958 L 165 972 Z" fill="#18181b" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 152 988 L 178 988 L 178 972 L 158 974 Z" fill="#f4f4f5" stroke="#0f172a" stroke-width="2" />
    <rect x="152" y="986" width="82" height="7" fill="#f4f4f5" stroke="#0f172a" stroke-width="1.5" />
    <line x1="184" y1="966" x2="198" y2="966" stroke="#ffffff" stroke-width="2" />
    <line x1="186" y1="972" x2="200" y2="972" stroke="#ffffff" stroke-width="2" />

    <!-- Right Shoe (Converse Style) -->
    <path d="M 268 988 L 344 988 L 335 972 L 298 958 L 268 958 Z" fill="#18181b" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 322 988 L 348 988 L 342 974 L 322 972 Z" fill="#f4f4f5" stroke="#0f172a" stroke-width="2" />
    <rect x="266" y="986" width="84" height="7" fill="#f4f4f5" stroke="#0f172a" stroke-width="1.5" />
    <line x1="302" y1="966" x2="316" y2="966" stroke="#ffffff" stroke-width="2" />
    <line x1="300" y1="972" x2="314" y2="972" stroke="#ffffff" stroke-width="2" />
  `;
}

// Helper to render Arms with signature RED ELBOW BANDS and RED WRIST BANDS
function renderArms(pose = 'idle') {
  if (pose === 'point_right') {
    return `
      <!-- Left Arm (Resting idle at side with red bands) -->
      <polygon points="166,450 186,450 178,570 162,570" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Left Red Elbow Band -->
      <rect x="158" y="565" width="24" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
      <polygon points="162,580 178,580 175,700 161,700" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Left Red Wrist Band -->
      <rect x="157" y="695" width="22" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
      <!-- Left Hand -->
      <polygon points="161,710 175,710 178,765 160,765" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />

      <!-- Right Arm (Raised pointing right!) -->
      <polygon points="315,450 335,450 375,540 355,545" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Right Red Elbow Band -->
      <rect x="358" y="535" width="22" height="18" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(30 365 545)" />
      <!-- Right Forearm reaching out -->
      <polygon points="370,545 385,555 460,510 452,495" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Right Red Wrist Band -->
      <rect x="450" y="495" width="16" height="20" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(-30 460 505)" />
      <!-- Right Hand (Pointing finger) -->
      <path d="M 466 502 L 520 480 L 518 492 L 485 515 L 466 520 Z" fill="#fbbf24" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
    `;
  }

  if (pose === 'point_left') {
    return `
      <!-- Left Arm (Raised pointing left!) -->
      <polygon points="165,450 185,450 145,540 125,545" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Left Red Elbow Band -->
      <rect x="120" y="535" width="22" height="18" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(-30 135 545)" />
      <!-- Left Forearm reaching out -->
      <polygon points="130,545 115,555 40,510 48,495" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Left Red Wrist Band -->
      <rect x="34" y="495" width="16" height="20" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(30 40 505)" />
      <!-- Left Hand (Pointing finger) -->
      <path d="M 34 502 L -20 480 L -18 492 L 15 515 L 34 520 Z" fill="#fbbf24" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />

      <!-- Right Arm (Resting idle at side with red bands) -->
      <polygon points="314,450 334,450 338,570 322,570" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Right Red Elbow Band -->
      <rect x="318" y="565" width="24" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
      <polygon points="322,580 338,580 339,700 325,700" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <!-- Right Red Wrist Band -->
      <rect x="321" y="695" width="22" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
      <!-- Right Hand -->
      <polygon points="325,710 339,710 340,765 322,765" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />
    `;
  }

  if (pose === 'explain_both') {
    return `
      <!-- Left Arm (Gesturing left) -->
      <polygon points="166,450 186,450 148,540 130,535" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <rect x="126" y="528" width="22" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(-20 137 536)" />
      <polygon points="135,540 150,550 100,640 85,630" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <rect x="80" y="625" width="20" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(30 90 632)" />
      <polygon points="85,640 100,650 75,700 60,685" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />

      <!-- Right Arm (Gesturing right) -->
      <polygon points="314,450 334,450 370,540 352,545" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <rect x="352" y="535" width="22" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(20 363 543)" />
      <polygon points="350,550 365,540 415,630 400,640" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
      <rect x="400" y="625" width="20" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" transform="rotate(-30 410 632)" />
      <polygon points="400,650 415,640 440,685 425,700" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />
    `;
  }

  // Default Idle / Standing Pose
  return `
    <!-- Left Arm -->
    <polygon points="166,450 186,450 178,570 162,570" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
    <!-- Signature Red Elbow Joint Band -->
    <rect x="158" y="565" width="24" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
    <polygon points="162,580 178,580 175,700 161,700" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
    <!-- Signature Red Wrist Joint Band -->
    <rect x="157" y="695" width="22" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
    <!-- Left Hand -->
    <polygon points="161,710 175,710 178,765 160,765" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />

    <!-- Right Arm -->
    <polygon points="314,450 334,450 338,570 322,570" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
    <!-- Signature Red Elbow Joint Band -->
    <rect x="318" y="565" width="24" height="16" rx="4" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
    <polygon points="322,580 338,580 339,700 325,700" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />
    <!-- Signature Red Wrist Joint Band -->
    <rect x="321" y="695" width="22" height="14" rx="3" fill="#ef4444" stroke="#0f172a" stroke-width="2" />
    <!-- Right Hand -->
    <polygon points="325,710 339,710 340,765 322,765" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />
  `;
}

// Assemble full character SVG
function buildCompleteCharacterSVG(pose = 'idle', options = {}) {
  const { blink = false, talking = false } = options;
  const isWalking = pose === 'walking';
  
  // Frame width/height: 500 x 1050
  // If pointing left/right, extend viewbox
  let viewBox = "0 50 500 1000";
  let width = 500;
  if (pose === 'point_left') {
    viewBox = "-50 50 550 1000";
    width = 550;
  } else if (pose === 'point_right') {
    viewBox = "0 50 550 1000";
    width = 550;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="1000">
  <!-- Group for complete articulated mannequin puppet -->
  <g id="puppet_root">
    <!-- 1. Legs & Shoes -->
    ${renderLegs(isWalking ? 'walking' : 'idle')}

    <!-- 2. Arms (back/torso depth) -->
    ${renderArms(pose)}

    <!-- 3. Torso, T-Shirt, Belt -->
    ${renderTorso()}

    <!-- 4. Head, Hair, Face, Eyes, Red Nose -->
    ${renderHead(pose, blink, talking)}
  </g>
</svg>`;
}

// Build and export all key poses
const posesToGenerate = [
  { name: 'puppet_idle', pose: 'idle', options: { blink: false, talking: false } },
  { name: 'puppet_blink', pose: 'idle', options: { blink: true, talking: false } },
  { name: 'puppet_talking', pose: 'idle', options: { blink: false, talking: true } },
  { name: 'puppet_point_left', pose: 'point_left', options: { blink: false, talking: true } },
  { name: 'puppet_point_right', pose: 'point_right', options: { blink: false, talking: true } },
  { name: 'puppet_explain_both', pose: 'explain_both', options: { blink: false, talking: true } },
  { name: 'puppet_walking', pose: 'walking', options: { blink: false, talking: false } }
];

function ensureExactPuppetAssets(force = false) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(COMP_DIR)) fs.mkdirSync(COMP_DIR, { recursive: true });

  const idlePng = path.join(OUT_DIR, 'puppet_idle.png');
  const compIdlePng = path.join(COMP_DIR, 'puppet_idle.png');

  if (!force && fs.existsSync(idlePng) && fs.existsSync(compIdlePng)) {
    return true;
  }

  console.log('🎨 [Exact Puppet Builder] Generating vector SVGs and high-res PNGs...');

  posesToGenerate.forEach(p => {
    const svgContent = buildCompleteCharacterSVG(p.pose, p.options);
    const svgPath = path.join(OUT_DIR, `${p.name}.svg`);
    const pngPath = path.join(OUT_DIR, `${p.name}.png`);

    fs.writeFileSync(svgPath, svgContent, 'utf8');

    // Convert SVG to crisp 32-bit transparent PNG using FFmpeg librsvg
    try {
      execSync(`ffmpeg -y -i "${svgPath}" "${pngPath}" 2>/dev/null`);
      console.log(`✅ Generated: ${p.name}.png (${fs.statSync(pngPath).size} bytes)`);
    } catch (err) {
      console.error(`❌ Failed converting ${p.name}:`, err.message);
    }
  });

  // Also copy into cartoon_character_assets/comparison_puppet for drop-in backward compatibility
  try {
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_idle.png'), path.join(COMP_DIR, 'puppet_idle.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_blink.png'), path.join(COMP_DIR, 'puppet_eyes_closed.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_blink.png'), path.join(COMP_DIR, 'puppet_blink.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_talking.png'), path.join(COMP_DIR, 'puppet_talking.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_point_left.png'), path.join(COMP_DIR, 'puppet_point_left.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_point_right.png'), path.join(COMP_DIR, 'puppet_point_right.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_explain_both.png'), path.join(COMP_DIR, 'puppet_compare_both.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_explain_both.png'), path.join(COMP_DIR, 'puppet_explain_both.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_walking.png'), path.join(COMP_DIR, 'puppet_walking.png'));
    console.log('🔄 Synced exact puppet assets to comparison_puppet directory!');
  } catch (syncErr) {
    console.warn('Notice syncing comparison_puppet:', syncErr.message);
  }

  console.log('🚀 [Exact Puppet Builder] All shape assets rendered successfully!');
  return true;
}

if (require.main === module) {
  ensureExactPuppetAssets(true);
}

module.exports = {
  ensureExactPuppetAssets,
  buildCompleteCharacterSVG,
  OUT_DIR,
  COMP_DIR
};
