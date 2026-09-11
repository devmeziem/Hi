/**
 * Modern Human-Like Tech Creator Character Rig ("Archie")
 * 
 * Aesthetic & Anatomy:
 * - Natural human skin tones (warm golden tan, natural sculpted shading)
 * - Modern stylish haircut (textured fade / modern tech creator crop)
 * - Expressive human eyes (white sclera, dark-ringed warm hazel iris, specular catchlights)
 * - Sculpted natural human nose and realistic expressive mouth visemes
 * - Modern creator wardrobe:
 *   - Sleek graphite/obsidian tech creator overshirt / jacket
 *   - Minimalist white/heather crewneck inner tee
 *   - Smartwatch on wrist with a subtle glowing holographic cyan/emerald ring
 *   - Tailored modern slate tech chinos
 *   - Designer clean modern sneakers
 * 
 * Dynamic Human Movements & Poses:
 * 1. idle: Natural standing conversational posture
 * 2. blink: Natural eyelid closure
 * 3. talking: Expressive open mouth articulation
 * 4. walking: Natural walking stride with fluid limb counter-swing
 * 5. sitting: Seated at a modern ergonomic desk setup with ultra-wide curved screen
 * 6. thinking: Hand under chin / tapping temple, head tilted up, floating neural sparkles
 * 7. confused: Shrugging palms up, tilted head, raised quizzical eyebrow ("Why did they deprecate this?")
 * 8. surprised: Hands raised, wide eyes, open mouth in genuine astonishment
 * 9. questioning_users: Leaning forward, hands welcoming audience ("What's your pick?")
 * 10. point_left & point_right: Extending index finger pointing to floating UI HUD / image card
 * 11. explain_both: Gesturing between two comparative models / products
 * 
 * Spawns high-resolution SVG and 32-bit transparent PNGs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
const COMP_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet');
const HUD_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'ui_hud');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(COMP_DIR)) fs.mkdirSync(COMP_DIR, { recursive: true });
if (!fs.existsSync(HUD_DIR)) fs.mkdirSync(HUD_DIR, { recursive: true });

// Natural Human Color Palette
const SKIN_BASE = '#eab383';
const SKIN_SHADOW = '#d09564';
const SKIN_HIGHLIGHT = '#f8d2b2';
const SKIN_BLUSH = '#e28878';
const HAIR_DARK = '#1f1917';
const HAIR_MID = '#382a26';
const HAIR_LIGHT = '#4e3b36';
const JACKET_DARK = '#0f172a';
const JACKET_MID = '#1e293b';
const JACKET_LIGHT = '#334155';
const TEE_WHITE = '#f8fafc';
const TEE_SHADOW = '#cbd5e1';
const PANTS_DARK = '#0f172a';
const PANTS_MID = '#1e293b';
const SNEAKER_WHITE = '#ffffff';
const SNEAKER_SOLE = '#e2e8f0';
const SNEAKER_TRIM = '#38bdf8';
const WATCH_STRAP = '#0f172a';
const WATCH_GLOW = '#06b6d4';

/**
 * Render Modern Human Head & Face
 */
function renderHumanHead(pose = 'idle', options = {}) {
  const { blink = false, talking = false } = options;

  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  let browLeftD = "M 206 200 Q 225 190 245 196";
  let browRightD = "M 255 196 Q 275 190 294 200";
  let mouthPath = "";

  if (pose === 'point_left' || pose === 'looking_left') {
    pupilOffsetX = -6;
  } else if (pose === 'point_right' || pose === 'looking_right') {
    pupilOffsetX = 6;
  } else if (pose === 'point_up_left') {
    pupilOffsetX = -7;
    pupilOffsetY = -6;
    browLeftD = "M 206 186 Q 225 176 245 186";
    browRightD = "M 255 192 Q 275 186 294 196";
  } else if (pose === 'point_up_right') {
    pupilOffsetX = 7;
    pupilOffsetY = -6;
    browLeftD = "M 206 192 Q 225 186 245 196";
    browRightD = "M 255 186 Q 275 176 294 186";
  } else if (pose === 'akimbo_jaw') {
    pupilOffsetX = 3;
    pupilOffsetY = -3;
    browLeftD = "M 206 198 Q 225 194 245 200";
    browRightD = "M 255 184 Q 275 174 294 184"; // Raised quizzical eyebrow
  } else if (pose === 'walking' || pose === 'walk_stride1' || pose === 'walk_stride2' || pose === 'walk_out') {
    pupilOffsetX = 5;
    pupilOffsetY = 0;
  } else if (pose === 'thinking') {
    pupilOffsetX = 3;
    pupilOffsetY = -5;
    browLeftD = "M 206 195 Q 225 188 245 198";
    browRightD = "M 255 190 Q 275 180 294 188"; // Raised right eyebrow
  } else if (pose === 'confused') {
    pupilOffsetX = -2;
    browLeftD = "M 206 198 Q 225 204 245 200"; // Lowered furrow
    browRightD = "M 255 188 Q 275 178 294 186"; // High raised eyebrow
  } else if (pose === 'surprised') {
    browLeftD = "M 206 186 Q 225 176 245 184";
    browRightD = "M 255 184 Q 275 176 294 186";
  }

  // Eyes rendering
  const eyeRadiusY = pose === 'surprised' ? 16 : 13;
  const eyeL = blink
    ? `<path d="M 210 216 Q 225 222 240 216" stroke="${HAIR_DARK}" stroke-width="3.5" stroke-linecap="round" fill="none" />`
    : `<ellipse cx="225" cy="215" rx="15" ry="${eyeRadiusY}" fill="#ffffff" stroke="#1e293b" stroke-width="2" />
       <!-- Iris -->
       <circle cx="${225 + pupilOffsetX}" cy="${215 + pupilOffsetY}" r="8.5" fill="#382218" stroke="#1c1917" stroke-width="1.5" />
       <!-- Pupil -->
       <circle cx="${225 + pupilOffsetX}" cy="${215 + pupilOffsetY}" r="4.5" fill="#090706" />
       <!-- Catchlight reflection -->
       <circle cx="${222 + pupilOffsetX}" cy="${212 + pupilOffsetY}" r="2.5" fill="#ffffff" opacity="0.9" />
       <circle cx="${227 + pupilOffsetX}" cy="${217 + pupilOffsetY}" r="1.2" fill="#ffffff" opacity="0.7" />`;

  const eyeR = blink
    ? `<path d="M 260 216 Q 275 222 290 216" stroke="${HAIR_DARK}" stroke-width="3.5" stroke-linecap="round" fill="none" />`
    : `<ellipse cx="275" cy="215" rx="15" ry="${eyeRadiusY}" fill="#ffffff" stroke="#1e293b" stroke-width="2" />
       <!-- Iris -->
       <circle cx="${275 + pupilOffsetX}" cy="${215 + pupilOffsetY}" r="8.5" fill="#382218" stroke="#1c1917" stroke-width="1.5" />
       <!-- Pupil -->
       <circle cx="${275 + pupilOffsetX}" cy="${215 + pupilOffsetY}" r="4.5" fill="#090706" />
       <!-- Catchlight reflection -->
       <circle cx="${272 + pupilOffsetX}" cy="${212 + pupilOffsetY}" r="2.5" fill="#ffffff" opacity="0.9" />
       <circle cx="${277 + pupilOffsetX}" cy="${217 + pupilOffsetY}" r="1.2" fill="#ffffff" opacity="0.7" />`;

  // Defined Anatomical Human Lips Rendering
  const upperLipClosed = `
    <!-- Upper Lip with Cupid's Bow -->
    <path d="M 235 269 C 241 265, 246 266, 250 264 C 254 266, 259 265, 265 269 C 258 271, 242 271, 235 269 Z" fill="#b4533c" stroke="#451a03" stroke-width="1.2" />
  `;
  const lowerLipClosed = `
    <!-- Lower Lip with Fleshy Fullness & Soft Highlight -->
    <path d="M 237 270 C 243 277, 257 277, 263 270 C 257 274, 243 274, 237 270 Z" fill="#cf705c" stroke="#451a03" stroke-width="1.2" />
    <ellipse cx="250" cy="273" rx="5" ry="1.5" fill="#f87171" opacity="0.45" />
    <!-- Subtle Lower Lip Shadow Crease -->
    <path d="M 243 279 Q 250 282 257 279" stroke="${SKIN_SHADOW}" stroke-width="1.8" fill="none" opacity="0.5" stroke-linecap="round" />
  `;

  if (talking) {
    mouthPath = `
      <!-- Dynamic Talking Mouth with Natural Upper/Lower Lips, Dental Arch & Tongue -->
      <!-- Inner Oral Cavity -->
      <path d="M 235 268 C 240 286, 260 286, 265 268 C 258 272, 242 272, 235 268 Z" fill="#4a0e17" stroke="#451a03" stroke-width="1.8" />
      <!-- Upper Teeth Arch -->
      <path d="M 237 269 Q 250 273 263 269 L 261 273 Q 250 276 239 273 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.6" />
      <!-- Tongue Curve -->
      <path d="M 243 282 C 246 278, 254 278, 257 282 C 253 285, 247 285, 243 282 Z" fill="#d94858" />
      <!-- Defined Upper Lip -->
      <path d="M 234 268 C 240 264, 246 265, 250 263 C 254 265, 260 264, 266 268 C 260 270, 240 270, 234 268 Z" fill="#b4533c" stroke="#451a03" stroke-width="1.2" />
      <!-- Defined Lower Lip -->
      <path d="M 237 283 C 243 288, 257 288, 263 283 C 257 285, 243 285, 237 283 Z" fill="#cf705c" stroke="#451a03" stroke-width="1.2" />
      <path d="M 243 290 Q 250 292 257 290" stroke="${SKIN_SHADOW}" stroke-width="1.6" fill="none" opacity="0.5" stroke-linecap="round" />
    `;
  } else if (pose === 'surprised') {
    mouthPath = `
      <!-- Astonished Idle Parted Lips & Small O cavity -->
      <path d="M 242 267 C 245 263, 255 263, 258 267 C 261 273, 260 282, 257 285 C 253 287, 247 287, 243 285 C 240 282, 239 273, 242 267 Z" fill="#380d12" stroke="#451a03" stroke-width="1.8" />
      <!-- Upper Teeth Accent -->
      <path d="M 244 269 Q 250 271 256 269" stroke="#f8fafc" stroke-width="1.2" fill="none" />
      <!-- Surprised Lip Outline -->
      <path d="M 240 267 C 245 263, 255 263, 260 267 C 263 274, 262 284, 258 287 C 252 290, 248 290, 242 287 C 238 283, 237 274, 240 267 Z" stroke="#b4533c" stroke-width="1.2" fill="none" />
    `;
  } else if (pose === 'akimbo_jaw' || pose === 'thinking') {
    mouthPath = `
      <!-- Thoughtful / Philosophical Subtle Pursed Lips with Musing Smile -->
      ${upperLipClosed}
      ${lowerLipClosed}
      <path d="M 236 269 Q 248 271 264 268" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="264" cy="268" r="1" fill="#451a03" />
    `;
  } else if (pose === 'confused') {
    mouthPath = `
      <!-- Quizzical Wry Smirk with Sculpted Lips -->
      ${upperLipClosed}
      ${lowerLipClosed}
      <path d="M 236 271 Q 248 268 263 273" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else {
    // Friendly, confident, welcoming smile with natural sculpted lips
    mouthPath = `
      ${upperLipClosed}
      ${lowerLipClosed}
      <!-- Smile Crease -->
      <path d="M 236 269 Q 250 274 264 269" fill="none" stroke="#451a03" stroke-width="2" stroke-linecap="round" />
      <circle cx="236" cy="269" r="0.8" fill="#451a03" />
      <circle cx="264" cy="269" r="0.8" fill="#451a03" />
    `;
  }

  // Thinking sparkles / Neural network thought nodes
  const thinkingParticles = pose === 'thinking' ? `
    <!-- Floating AI Neural Nodes / Insight Sparkles -->
    <g opacity="0.85">
      <circle cx="310" cy="115" r="7" fill="#38bdf8" />
      <circle cx="310" cy="115" r="14" fill="#38bdf8" opacity="0.25" />
      <circle cx="335" cy="85" r="5" fill="#818cf8" />
      <circle cx="285" cy="75" r="4" fill="#06b6d4" />
      <line x1="310" y1="115" x2="335" y2="85" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
      <line x1="310" y1="115" x2="285" y2="75" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3,3" />
      <!-- Subtle thought bubble connection -->
      <circle cx="280" cy="135" r="4" fill="#38bdf8" opacity="0.6" />
      <circle cx="265" cy="150" r="2.5" fill="#38bdf8" opacity="0.4" />
    </g>` : '';

  return `
    ${thinkingParticles}

    <!-- Neck with Natural Trapezius Contours -->
    <path d="M 234 295 L 230 338 L 270 338 L 266 295 Z" fill="${SKIN_BASE}" stroke="#1e293b" stroke-width="2" />
    <path d="M 245 295 L 230 338 L 270 338 Z" fill="${SKIN_SHADOW}" opacity="0.25" />

    <!-- Left Ear with Natural Helix -->
    <ellipse cx="192" cy="225" rx="11" ry="16" fill="${SKIN_BASE}" stroke="#1e293b" stroke-width="2" />
    <path d="M 194 216 Q 188 223 194 231" stroke="${SKIN_SHADOW}" stroke-width="2" fill="none" stroke-linecap="round" />

    <!-- Right Ear with Natural Helix -->
    <ellipse cx="308" cy="225" rx="11" ry="16" fill="${SKIN_BASE}" stroke="#1e293b" stroke-width="2" />
    <path d="M 306 216 Q 312 223 306 231" stroke="${SKIN_SHADOW}" stroke-width="2" fill="none" stroke-linecap="round" />

    <!-- Human Head & Jaw Structure -->
    <path d="M 198 175 
             C 198 150, 302 150, 302 175 
             C 302 210, 300 240, 285 272 
             C 272 298, 258 304, 250 304 
             C 242 304, 228 298, 215 272 
             C 200 240, 198 210, 198 175 Z" 
          fill="${SKIN_BASE}" stroke="#1e293b" stroke-width="2.5" />

    <!-- Natural Jaw and Cheek Contour Shading -->
    <path d="M 250 304 C 258 304, 272 298, 285 272 C 295 250, 298 225, 298 200 C 280 230, 260 280, 250 304 Z" fill="${SKIN_SHADOW}" opacity="0.3" />
    
    <!-- Subtle Cheek Health Glow -->
    <ellipse cx="218" cy="238" rx="10" ry="6" fill="${SKIN_BLUSH}" opacity="0.35" />
    <ellipse cx="282" cy="238" rx="10" ry="6" fill="${SKIN_BLUSH}" opacity="0.35" />

    <!-- Modern Textured Creator Hairstyle (Clean textured crop / fade) -->
    <path d="M 194 185
             C 190 150, 210 120, 250 116
             C 278 114, 304 130, 308 165
             C 310 185, 306 195, 302 195
             C 300 178, 294 152, 280 142
             C 265 132, 235 134, 215 152
             C 202 164, 196 178, 194 185 Z"
          fill="${HAIR_DARK}" stroke="#0f172a" stroke-width="2.5" />

    <!-- Modern Textured Hair Locks & Highlights -->
    <path d="M 220 142 Q 238 126 256 138" stroke="${HAIR_MID}" stroke-width="4" stroke-linecap="round" fill="none" />
    <path d="M 245 132 Q 262 122 280 134" stroke="${HAIR_LIGHT}" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 205 160 Q 215 145 230 155" stroke="${HAIR_MID}" stroke-width="3.5" stroke-linecap="round" fill="none" />

    <!-- Eyebrows (Sculpted, naturally arched) -->
    <path d="${browLeftD}" stroke="${HAIR_DARK}" stroke-width="4.5" stroke-linecap="round" fill="none" />
    <path d="${browRightD}" stroke="${HAIR_DARK}" stroke-width="4.5" stroke-linecap="round" fill="none" />

    <!-- Eyes (Sclera, Iris, Catchlight) -->
    ${eyeL}
    ${eyeR}

    <!-- Natural Sculpted Human Nose (Refined shading, no clown triangle!) -->
    <path d="M 248 214 L 246 244 Q 242 250 250 252 Q 258 250 254 244 L 252 214" fill="${SKIN_SHADOW}" opacity="0.35" />
    <path d="M 244 249 Q 250 254 256 249" stroke="${SKIN_SHADOW}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <circle cx="242" cy="249" r="1.5" fill="#451a03" />
    <circle cx="258" cy="249" r="1.5" fill="#451a03" />

    <!-- Mouth -->
    ${mouthPath}
  `;
}

/**
 * Render Modern Creator Torso & Jacket
 */
function renderModernTorso() {
  return `
    <!-- Minimalist Crewneck Inner Tee (Off-white / heather) -->
    <path d="M 225 338 Q 250 355 275 338 L 285 410 L 215 410 Z" fill="${TEE_WHITE}" stroke="#94a3b8" stroke-width="1.5" />
    <path d="M 230 338 Q 250 354 270 338" stroke="${TEE_SHADOW}" stroke-width="2" fill="none" />

    <!-- Sleek Tech Creator Overshirt / Bomber Jacket -->
    <!-- Left Collar & Lapel -->
    <path d="M 210 340 L 160 375 L 175 510 L 235 510 L 230 400 L 225 340 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
    <!-- Right Collar & Lapel -->
    <path d="M 290 340 L 340 375 L 325 510 L 265 510 L 270 400 L 275 340 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />

    <!-- Front Center Zipper / Placket -->
    <line x1="250" y1="395" x2="250" y2="510" stroke="#0284c7" stroke-width="2" stroke-linecap="round" />
    
    <!-- Minimalist Chest Pocket with Glowing Tech Accent Line -->
    <rect x="185" y="415" width="38" height="42" rx="4" fill="${JACKET_DARK}" stroke="${JACKET_LIGHT}" stroke-width="1.5" />
    <line x1="188" y1="422" x2="220" y2="422" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />

    <!-- Belt & Waistline -->
    <rect x="210" y="508" width="80" height="18" rx="3" fill="#0f172a" stroke="#0f172a" stroke-width="2" />
    <rect x="242" y="511" width="16" height="12" rx="2" fill="#38bdf8" opacity="0.8" />
  `;
}

/**
 * Render Modern Creator Legs & Designer Sneakers
 * Delivers true lateral side-walking profile when in motion, and grounded stance when stationary.
 */
function renderModernLegs(pose = 'idle') {
  if (pose === 'walking' || pose === 'walk_stride1' || pose === 'walk_out') {
    return `
      <!-- LATERAL SIDE-WALKING STRIDE 1 (Heading Rightward in dynamic lateral profile) -->
      <!-- Pelvis in 3/4 lateral stride -->
      <path d="M 215 526 C 230 526, 260 528, 275 530 L 285 580 C 265 585, 235 585, 215 578 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />

      <!-- Back Leg (Trailing Leg in Lateral Profile - pushing off backward-left) -->
      <path d="M 225 572 L 255 575 L 205 730 L 175 725 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 175 725 L 205 730 L 160 910 L 130 905 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <rect x="125" y="900" width="38" height="15" rx="4" fill="${JACKET_LIGHT}" transform="rotate(-15 144 907)" />
      <!-- Back Sneaker (Flexed upward on toe in lateral profile) -->
      <path d="M 115 930 L 180 942 L 188 926 L 158 912 L 126 916 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="114" y="934" width="70" height="9" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" transform="rotate(8 149 938)" />
      <line x1="135" y1="922" x2="160" y2="926" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />

      <!-- Front Leg (Leading Leg in Lateral Profile - stepping forward-right with knee flexed) -->
      <path d="M 245 572 L 278 576 L 330 720 L 295 725 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 295 725 L 330 720 L 370 900 L 335 905 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />
      <rect x="330" y="895" width="42" height="16" rx="4" fill="${JACKET_LIGHT}" transform="rotate(12 351 903)" />
      <!-- Front Sneaker (Reaching forward, heel planted rightward in lateral profile) -->
      <path d="M 330 945 L 420 945 L 416 925 L 375 912 L 335 922 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="328" y="942" width="95" height="10" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" />
      <line x1="365" y1="926" x2="395" y2="926" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />
    `;
  }

  if (pose === 'walk_stride2') {
    return `
      <!-- LATERAL SIDE-WALKING STRIDE 2 (Opposite Legs Crossing in lateral profile) -->
      <!-- Pelvis in 3/4 lateral stride -->
      <path d="M 215 526 C 230 526, 260 528, 275 530 L 285 580 C 265 585, 235 585, 215 578 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />

      <!-- Back Leg (Trailing Left Leg pushing back) -->
      <path d="M 240 572 L 270 576 L 200 730 L 170 725 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 170 725 L 200 730 L 150 910 L 120 905 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />
      <rect x="116" y="900" width="38" height="15" rx="4" fill="${JACKET_LIGHT}" transform="rotate(-15 135 907)" />
      <!-- Back Sneaker flexed on toe in profile -->
      <path d="M 106 930 L 172 942 L 180 926 L 150 912 L 118 916 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="105" y="934" width="70" height="9" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" transform="rotate(8 140 938)" />
      <line x1="126" y1="922" x2="152" y2="926" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />

      <!-- Front Leg (Leading Right Leg stepping forward-right) -->
      <path d="M 230 572 L 262 576 L 310 720 L 276 725 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 276 725 L 310 720 L 350 900 L 316 905 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <rect x="312" y="895" width="42" height="16" rx="4" fill="${JACKET_LIGHT}" transform="rotate(12 333 903)" />
      <!-- Front Sneaker stepping forward in profile -->
      <path d="M 312 945 L 402 945 L 398 925 L 358 912 L 318 922 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="310" y="942" width="95" height="10" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" />
      <line x1="346" y1="926" x2="376" y2="926" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />
    `;
  }

  if (pose === 'sitting') {
    return `
      <!-- Seated Ergonomic Pose -->
      <!-- Thighs projecting forward horizontally -->
      <path d="M 205 526 L 295 526 L 310 680 L 190 680 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />
      <!-- Lower legs descending to floor -->
      <path d="M 200 680 L 235 680 L 230 880 L 195 880 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 265 680 L 300 680 L 305 880 L 270 880 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <!-- Seated Sneakers planted on floor -->
      <rect x="180" y="880" width="55" height="28" rx="6" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="178" y="900" width="59" height="10" rx="3" fill="${SNEAKER_SOLE}" />
      <rect x="260" y="880" width="55" height="28" rx="6" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
      <rect x="258" y="900" width="59" height="10" rx="3" fill="${SNEAKER_SOLE}" />
      
      <!-- Modern Ergonomic Desk in foreground/midground -->
      <rect x="80" y="700" width="340" height="22" rx="5" fill="#334155" stroke="#0f172a" stroke-width="2.5" />
      <rect x="90" y="705" width="320" height="4" fill="#38bdf8" opacity="0.6" />
      <!-- Sleek Laptop / Holographic Keyboard Base on Desk -->
      <polygon points="170,700 330,700 315,670 185,670" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
      <rect x="200" y="674" width="100" height="16" fill="#0f172a" />
      <line x1="205" y1="682" x2="295" y2="682" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,2" />
    `;
  }

  // Standard Straight Stance
  return `
    <!-- Pelvis & Upper Pants -->
    <path d="M 210 526 L 290 526 L 296 575 L 250 585 L 204 575 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2.5" />

    <!-- Left Leg (Tailored modern slate tech chinos) -->
    <path d="M 206 575 L 246 580 L 240 750 L 204 750 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2" />
    <path d="M 204 750 L 240 750 L 235 915 L 202 915 Z" fill="${PANTS_MID}" stroke="#0f172a" stroke-width="2" />
    <rect x="198" y="908" width="40" height="16" rx="4" fill="${JACKET_LIGHT}" />

    <!-- Right Leg -->
    <path d="M 254 580 L 294 575 L 296 750 L 260 750 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2" />
    <path d="M 260 750 L 296 750 L 298 915 L 265 915 Z" fill="${PANTS_DARK}" stroke="#0f172a" stroke-width="2" />
    <rect x="262" y="908" width="40" height="16" rx="4" fill="${JACKET_LIGHT}" />

    <!-- Left Modern Designer Sneaker -->
    <path d="M 156 955 L 234 955 L 234 928 L 200 922 L 160 938 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
    <rect x="152" y="952" width="85" height="10" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" />
    <line x1="178" y1="934" x2="204" y2="934" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />

    <!-- Right Modern Designer Sneaker -->
    <path d="M 266 955 L 344 955 L 340 938 L 300 922 L 266 928 Z" fill="${SNEAKER_WHITE}" stroke="#0f172a" stroke-width="2" />
    <rect x="263" y="952" width="85" height="10" rx="3" fill="${SNEAKER_SOLE}" stroke="#0f172a" stroke-width="1.5" />
    <line x1="296" y1="934" x2="322" y2="934" stroke="${SNEAKER_TRIM}" stroke-width="2.5" stroke-linecap="round" />
  `;
}

/**
 * Anatomically Sculpted Human Hand Generator
 * Renders realistic palm, thenar eminence (thumb root), thumb, index, middle, ring, and pinky fingers
 */
function renderHumanHand(wristX, wristY, isLeft = true, gesture = 'relaxed') {
  const dir = isLeft ? 1 : -1;
  const flip = isLeft ? 1 : -1;

  if (gesture === 'relaxed') {
    // Sculpted human hand hanging at side
    return `
      <g id="human_hand_${isLeft ? 'l' : 'r'}" transform="translate(${wristX}, ${wristY}) scale(${flip}, 1)">
        <!-- Palm & Thenar Eminence (fleshy thumb base) -->
        <path d="M 0 0 C -4 14, -8 28, -6 44 C 0 54, 18 54, 24 44 C 24 28, 20 14, 16 0 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
        
        <!-- Opposable Human Thumb with Knuckle Joint -->
        <path d="M -4 16 C -12 22, -18 30, -16 40 C -14 46, -8 46, -4 38 C -2 30, -1 24, -2 18 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round" />
        <!-- Thumb crease & fingernail highlight -->
        <line x1="-12" y1="30" x2="-8" y2="34" stroke="${SKIN_SHADOW}" stroke-width="1.2" stroke-linecap="round" />
        <path d="M -14 38 Q -12 42 -10 39" stroke="${SKIN_SHADOW}" stroke-width="1" fill="none" opacity="0.6" />

        <!-- Index Finger (distinct joint curve) -->
        <path d="M -2 44 C -4 54, -4 66, -3 74 C -1 77, 3 77, 4 73 C 4 65, 3 54, 2 44 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
        <line x1="-2" y1="58" x2="2" y2="58" stroke="${SKIN_SHADOW}" stroke-width="1" stroke-linecap="round" opacity="0.6" />

        <!-- Middle Finger (longest, reaching downward with subtle knuckle) -->
        <path d="M 4 44 C 4 56, 4 70, 5 80 C 7 83, 11 83, 12 79 C 12 69, 11 56, 10 44 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
        <line x1="5" y1="62" x2="10" y2="62" stroke="${SKIN_SHADOW}" stroke-width="1" stroke-linecap="round" opacity="0.6" />

        <!-- Ring Finger -->
        <path d="M 11 44 C 11 55, 11 68, 12 76 C 14 79, 17 79, 18 75 C 18 66, 17 55, 16 44 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
        <line x1="12" y1="60" x2="16" y2="60" stroke="${SKIN_SHADOW}" stroke-width="1" stroke-linecap="round" opacity="0.6" />

        <!-- Pinky Finger (smaller, natural curl) -->
        <path d="M 17 42 C 18 50, 19 60, 20 67 C 22 70, 24 70, 25 66 C 25 58, 23 48, 22 40 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
        
        <!-- Fleshy palm crease / life line -->
        <path d="M 2 24 C 6 32, 10 38, 14 42" stroke="${SKIN_SHADOW}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.7" />
      </g>
    `;
  }

  return '';
}

/**
 * Render Modern Creator Arms, Hands & Smartwatch
 * Features anatomically sculpted human hands with fingers, thumb, knuckles,
 * tapered forearms, and fabric jacket sleeves.
 */
function renderModernArms(pose = 'idle') {
  // Smartwatch on left wrist
  const smartwatch = `
    <!-- Smartwatch Casing & Screen -->
    <rect x="156" y="652" width="22" height="18" rx="5" fill="${WATCH_STRAP}" stroke="#0f172a" stroke-width="1.5" />
    <rect x="159" y="655" width="16" height="12" rx="3" fill="#0f172a" stroke="${WATCH_GLOW}" stroke-width="1.5" />
    <circle cx="167" cy="661" r="3" fill="${WATCH_GLOW}" opacity="0.85" />
  `;

  if (pose === 'point_right') {
    return `
      <!-- Left Arm (Resting naturally at side with smartwatch) -->
      <!-- Upper Jacket Sleeve -->
      <path d="M 162 375 C 158 420, 156 460, 160 515 C 168 518, 182 518, 188 515 C 188 460, 186 420, 184 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 160 510 C 168 514, 180 514, 188 510 L 188 522 C 180 526, 168 526, 160 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Left Forearm (Tapered natural arm muscle) -->
      <path d="M 162 522 C 158 560, 156 610, 160 655 L 182 655 C 186 610, 184 560, 184 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      ${smartwatch}
      <!-- Anatomically Sculpted Left Hand -->
      ${renderHumanHand(164, 655, true, 'relaxed')}

      <!-- Right Arm (Dynamically pointing to right toward HUD/graphics) -->
      <!-- Upper Jacket Sleeve extending outward -->
      <path d="M 320 375 C 340 405, 370 435, 412 468 L 396 488 C 360 455, 335 420, 312 385 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 396 484 C 402 478, 410 472, 416 468 L 424 478 C 416 484, 406 490, 398 496 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Forearm reaching right -->
      <path d="M 416 472 C 445 456, 475 442, 506 432 L 512 448 C 480 460, 450 475, 422 490 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      
      <!-- Right Hand: Sculpted Human Pointing Hand with Natural Knuckles & Proportional Index Finger -->
      <!-- Wrist & Palm base -->
      <path d="M 506 432 C 518 428, 526 426, 535 425 L 536 450 C 526 452, 518 450, 510 448 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Curled Middle, Ring, Pinky Fingers -->
      <path d="M 534 436 C 542 436, 548 440, 545 446 C 542 450, 536 450, 532 448 Z" fill="${SKIN_SHADOW}" opacity="0.4" />
      <path d="M 533 444 C 543 444, 549 448, 546 454 C 542 458, 535 456, 530 454 Z" fill="${SKIN_SHADOW}" opacity="0.4" />
      <!-- Human-proportioned natural index finger (short, realistic 24px) -->
      <path d="M 532 425 
               C 542 423, 550 421, 558 420 
               C 562 420, 563 425, 559 427 
               C 551 430, 542 433, 534 434 Z" 
            fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
      <!-- Natural Knuckle accent line -->
      <line x1="545" y1="422" x2="546" y2="427" stroke="${SKIN_SHADOW}" stroke-width="1.5" stroke-linecap="round" />
      <!-- Thumb folded naturally over knuckles -->
      <path d="M 522 434 C 529 430, 536 432, 538 437 C 536 442, 528 444, 520 442 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Subtle highlight at fingertip -->
      <circle cx="560" cy="423" r="2.5" fill="#38bdf8" />
      <circle cx="560" cy="423" r="6" fill="#38bdf8" opacity="0.25" />
    `;
  }

  if (pose === 'point_left') {
    return `
      <!-- Left Arm (Dynamically pointing to left toward HUD/graphics) -->
      <!-- Upper Jacket Sleeve extending left -->
      <path d="M 180 375 C 160 405, 130 435, 88 468 L 104 488 C 140 455, 165 420, 188 385 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 104 484 C 98 478, 90 472, 84 468 L 76 478 C 84 484, 94 490, 102 496 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Forearm reaching left -->
      <path d="M 84 472 C 55 456, 25 442, -6 432 L -12 448 C 20 460, 50 475, 78 490 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      
      <!-- Left Hand: Sculpted Human Pointing Hand (pointing left) -->
      <!-- Palm base -->
      <path d="M -6 432 C -18 428, -26 426, -35 425 L -36 450 C -26 452, -18 450, -10 448 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Curled Fingers -->
      <path d="M -34 436 C -42 436, -48 440, -45 446 C -42 450, -36 450, -32 448 Z" fill="${SKIN_SHADOW}" opacity="0.4" />
      <!-- Human-proportioned natural index finger pointing left (short, realistic 24px) -->
      <path d="M -32 425 
               C -42 423, -50 421, -58 420 
               C -62 420, -63 425, -59 427 
               C -51 430, -42 433, -34 434 Z" 
            fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
      <!-- Natural Knuckle accent line -->
      <line x1="-45" y1="422" x2="-46" y2="427" stroke="${SKIN_SHADOW}" stroke-width="1.5" stroke-linecap="round" />
      <!-- Thumb folded naturally -->
      <path d="M -22 434 C -29 430, -36 432, -38 437 C -36 442, -28 444, -20 442 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Subtle highlight at fingertip -->
      <circle cx="-60" cy="423" r="2.5" fill="#38bdf8" />
      <circle cx="-60" cy="423" r="6" fill="#38bdf8" opacity="0.25" />

      <!-- Right Arm (Resting naturally at side) -->
      <path d="M 315 375 C 320 420, 324 460, 320 515 C 328 518, 342 518, 348 515 C 348 460, 346 420, 344 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 320 510 C 328 514, 340 514, 348 510 L 348 522 C 340 526, 328 526, 320 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <path d="M 322 522 C 320 560, 320 610, 324 655 L 346 655 C 348 610, 348 560, 346 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Anatomically Sculpted Right Hand -->
      ${renderHumanHand(344, 655, false, 'relaxed')}
    `;
  }

  if (pose === 'thinking') {
    return `
      <!-- Left Arm (Folded across chest supporting elbow) -->
      <path d="M 162 375 C 158 415, 172 455, 205 485 L 222 470 C 195 445, 185 410, 184 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 205 480 C 230 488, 258 480, 280 465 L 272 450 C 255 462, 230 470, 212 464 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      ${smartwatch}

      <!-- Right Arm (Raised thoughtfully with hand cradling chin/cheek) -->
      <path d="M 320 375 C 335 415, 348 450, 345 490 L 328 494 C 326 455, 318 415, 310 380 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <!-- Forearm ascending to chin -->
      <path d="M 335 488 C 342 445, 328 375, 286 312 L 272 322 C 310 378, 322 442, 318 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      
      <!-- Hand at Chin: Sculpted Fingers Resting Thoughtfully on Jaw -->
      <!-- Palm base under chin -->
      <path d="M 276 312 C 270 305, 268 295, 266 285 L 280 282 C 282 292, 285 300, 290 306 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Index & Middle Fingers gently resting alongside cheek/jaw -->
      <path d="M 268 286 C 267 274, 270 264, 273 252 C 277 252, 280 256, 278 266 L 276 286 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Thumb cradling lower jaw -->
      <path d="M 266 295 C 256 296, 248 297, 244 298 C 243 302, 248 304, 255 304 C 260 304, 266 303, 272 301 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
    `;
  }

  if (pose === 'confused') {
    return `
      <!-- Confused / Shrug Pose: Both arms lifted, expressive open palms turned up quizzically -->
      <!-- Left Upper Arm -->
      <path d="M 165 372 C 150 405, 134 440, 118 472 L 136 480 C 150 450, 166 415, 185 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 118 472 L 110 475 L 116 488 L 136 480 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Left Forearm angled up & out -->
      <path d="M 112 476 C 92 468, 72 458, 54 448 L 62 434 C 80 444, 98 454, 120 462 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Left Hand (Open palm facing up with 5 articulated fingers) -->
      <!-- Palm -->
      <ellipse cx="50" cy="438" rx="14" ry="10" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Thumb extending outward -->
      <path d="M 58 444 C 64 448, 70 452, 74 456 C 73 460, 68 460, 62 454 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <!-- 4 Spread upward fingers -->
      <path d="M 44 430 C 38 424, 34 416, 30 408 C 34 406, 38 410, 42 418 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 49 428 C 46 420, 44 412, 42 404 C 46 403, 50 406, 52 416 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 54 429 C 54 421, 54 413, 55 405 C 59 405, 61 409, 60 418 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 59 432 C 62 426, 66 420, 70 414 C 74 416, 73 421, 68 428 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />

      <!-- Right Upper Arm -->
      <path d="M 315 372 C 330 405, 346 440, 362 472 L 344 480 C 330 450, 314 415, 295 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 362 472 L 370 475 L 364 488 L 344 480 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Right Forearm angled up & out -->
      <path d="M 368 476 C 388 468, 408 458, 426 448 L 418 434 C 400 444, 382 454, 360 462 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Right Hand (Open palm facing up with 5 articulated fingers) -->
      <!-- Palm -->
      <ellipse cx="430" cy="438" rx="14" ry="10" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Thumb extending outward -->
      <path d="M 422 444 C 416 448, 410 452, 406 456 C 407 460, 412 460, 418 454 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <!-- 4 Spread upward fingers -->
      <path d="M 436 430 C 442 424, 446 416, 450 408 C 446 406, 442 410, 438 418 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 431 428 C 434 420, 436 412, 438 404 C 434 403, 430 406, 428 416 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 426 429 C 426 421, 426 413, 425 405 C 421 405, 419 409, 420 418 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 421 432 C 418 426, 414 420, 410 414 C 406 416, 407 421, 412 428 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
    `;
  }

  if (pose === 'surprised') {
    return `
      <!-- Surprised / Astonished: Both hands raised near chest/shoulders -->
      <path d="M 165 372 C 150 405, 135 440, 120 460 L 138 468 C 152 440, 168 405, 185 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 122 460 C 114 430, 108 395, 102 360 L 118 356 C 124 390, 130 425, 138 460 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Left Hand (Open palm facing camera in astonishment) -->
      <ellipse cx="106" cy="350" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <path d="M 96 342 C 92 334, 88 324, 86 314 C 91 312, 95 316, 98 326 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 103 340 C 102 330, 101 320, 100 310 C 105 310, 108 314, 108 324 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 110 341 C 112 331, 114 321, 116 312 C 120 314, 120 318, 118 326 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />

      <path d="M 315 372 C 330 405, 345 440, 360 460 L 342 468 C 328 440, 312 405, 295 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 358 460 C 366 430, 372 395, 378 360 L 362 356 C 356 390, 350 425, 342 460 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Right Hand (Open palm facing camera) -->
      <ellipse cx="374" cy="350" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <path d="M 384 342 C 388 334, 392 324, 394 314 C 389 312, 385 316, 382 326 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 377 340 C 378 330, 379 320, 380 310 C 375 310, 372 314, 372 324 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 370 341 C 368 331, 366 321, 364 312 C 360 314, 360 318, 362 326 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
    `;
  }

  if (pose === 'questioning_users' || pose === 'explain_both') {
    return `
      <!-- Welcoming / Explaining Gesture: Both arms open forward addressing the audience -->
      <!-- Left Arm -->
      <path d="M 165 375 C 152 410, 138 445, 122 480 L 140 488 C 154 455, 168 420, 185 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 124 480 L 118 484 L 122 494 L 140 488 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Forearm reaching forward/down -->
      <path d="M 122 486 C 110 520, 98 555, 86 585 L 104 592 C 116 560, 128 525, 138 490 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Left Hand: Sculpted welcoming open palm -->
      <ellipse cx="88" cy="595" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Fingers curled naturally forward toward viewer -->
      <path d="M 78 598 C 72 606, 68 616, 64 624 C 69 626, 74 622, 78 612 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 84 602 C 82 612, 80 622, 78 630 C 83 630, 87 626, 88 616 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 92 602 C 92 612, 94 622, 96 630 C 100 628, 101 624, 98 616 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />

      <!-- Right Arm -->
      <path d="M 315 375 C 328 410, 342 445, 358 480 L 340 488 C 326 455, 312 420, 295 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <path d="M 356 480 L 362 484 L 358 494 L 340 488 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="1.8" />
      <!-- Forearm reaching forward/down -->
      <path d="M 358 486 C 370 520, 382 555, 394 585 L 376 592 C 364 560, 352 525, 342 490 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Right Hand: Sculpted welcoming open palm -->
      <ellipse cx="392" cy="595" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Fingers curled naturally forward toward viewer -->
      <path d="M 402 598 C 408 606, 412 616, 416 624 C 411 626, 406 622, 402 612 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 396 602 C 398 612, 400 622, 402 630 C 397 630, 393 626, 392 616 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 388 602 C 388 612, 386 622, 384 630 C 380 628, 379 624, 382 616 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
    `;
  }

  if (pose === 'point_up_left') {
    return `
      <!-- Left Arm: Dynamically pointing upward and left toward Board 1 -->
      <path d="M 175 375 C 150 350, 120 320, 85 290 L 102 274 C 135 305, 165 338, 188 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 85 290 L 76 298 L 86 310 L 102 274 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Forearm extending upward-left -->
      <path d="M 80 292 C 50 260, 20 228, -8 195 L 8 182 C 34 214, 65 248, 96 278 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Sculpted Pointing Hand Up-Left -->
      <ellipse cx="-4" cy="190" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Natural human-length index finger pointing upward-left toward Board 1 (22px length) -->
      <path d="M -4 184 C -12 174, -20 165, -28 156 C -32 154, -34 159, -30 162 C -22 171, -14 180, -8 189 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
      <circle cx="-30" cy="158" r="3" fill="#38bdf8" />
      <circle cx="-30" cy="158" r="7" fill="#38bdf8" opacity="0.25" />

      <!-- Right Arm: Natural resting at waist/hip -->
      <path d="M 315 375 C 320 420, 324 460, 320 515 C 328 518, 342 518, 348 515 C 348 460, 346 420, 344 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 320 510 C 328 514, 340 514, 348 510 L 348 522 C 340 526, 328 526, 320 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <path d="M 322 522 C 320 560, 320 610, 324 655 L 346 655 C 348 610, 348 560, 346 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Sculpted Human Hand -->
      ${renderHumanHand(344, 655, false, 'relaxed')}
    `;
  }

  if (pose === 'point_up_right') {
    return `
      <!-- Left Arm (Resting at side with smartwatch) -->
      <path d="M 162 375 C 158 420, 156 460, 160 515 C 168 518, 182 518, 188 515 C 188 460, 186 420, 184 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 160 510 C 168 514, 180 514, 188 510 L 188 522 C 180 526, 168 526, 160 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <path d="M 162 522 C 158 560, 156 610, 160 655 L 182 655 C 186 610, 184 560, 184 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      ${smartwatch}
      <!-- Sculpted Human Hand -->
      ${renderHumanHand(164, 655, true, 'relaxed')}

      <!-- Right Arm: Dynamically pointing upward and right toward Board 2 -->
      <path d="M 320 375 C 345 350, 375 320, 410 290 L 393 274 C 360 305, 330 338, 307 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 410 290 L 419 298 L 409 310 L 393 274 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Forearm extending upward-right -->
      <path d="M 415 292 C 445 260, 475 228, 503 195 L 487 182 C 461 214, 430 248, 399 278 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Sculpted Pointing Hand Up-Right -->
      <ellipse cx="499" cy="190" rx="14" ry="12" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Natural human-length index finger pointing upward-right toward Board 2 (22px length) -->
      <path d="M 499 184 C 507 174, 515 165, 523 156 C 527 154, 529 159, 525 162 C 517 171, 509 180, 503 189 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
      <circle cx="525" cy="158" r="3" fill="#f97316" />
      <circle cx="525" cy="158" r="7" fill="#f97316" opacity="0.25" />
    `;
  }

  if (pose === 'akimbo_jaw') {
    return `
      <!-- Left Arm AKIMBO: Hand planted firmly on hip with elbow angled out -->
      <!-- Upper arm angling outward -->
      <path d="M 165 375 C 145 410, 125 445, 108 472 L 126 480 C 142 452, 160 415, 185 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Forearm angling inward to hip -->
      <path d="M 112 475 C 135 490, 160 505, 188 522 L 194 505 C 168 490, 142 475, 124 462 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Smartwatch at wrist -->
      <rect x="180" y="504" width="18" height="18" rx="4" fill="${WATCH_STRAP}" stroke="#0f172a" stroke-width="1.5" />
      <rect x="182" y="506" width="14" height="14" rx="3" fill="#0f172a" stroke="${WATCH_GLOW}" stroke-width="1.5" />
      <circle cx="189" cy="513" r="3" fill="${WATCH_GLOW}" opacity="0.9" />
      <!-- Left Hand resting firmly on hip/waist -->
      <path d="M 188 518 C 196 524, 204 530, 208 534 C 206 538, 200 540, 194 536 C 188 532, 184 526, 182 520 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />

      <!-- Right Arm ON JAW: Elbow bent, hand cradling chin/jawline thoughtfully -->
      <!-- Upper arm in front of torso -->
      <path d="M 315 375 C 330 415, 340 450, 335 490 L 318 494 C 318 455, 310 415, 305 380 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" />
      <!-- Forearm ascending to jaw -->
      <path d="M 326 488 C 332 445, 318 375, 276 312 L 262 322 C 300 378, 312 442, 308 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Hand at Jaw: Thumb cradling chin, index & middle fingers along lower cheek -->
      <path d="M 266 312 C 260 305, 258 295, 256 285 L 270 282 C 272 292, 275 300, 280 306 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <path d="M 258 286 C 257 274, 260 264, 263 252 C 267 252, 270 256, 268 266 L 266 286 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
      <path d="M 256 295 C 246 296, 238 297, 234 298 C 233 302, 238 304, 245 304 C 250 304, 256 303, 262 301 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="1.8" />
    `;
  }

  if (pose === 'walking' || pose === 'walk_stride1' || pose === 'walk_out') {
    return `
      <!-- Left Arm (Swinging forward with bent elbow & smartwatch visible) -->
      <path d="M 165 375 C 150 410, 136 445, 120 480 L 138 488 C 152 455, 166 420, 185 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 120 480 L 114 484 L 118 494 L 138 488 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
      <!-- Forearm swinging forward -->
      <path d="M 122 486 C 108 525, 96 565, 88 605 L 108 610 C 116 572, 126 532, 138 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Smartwatch swinging forward -->
      <rect x="86" y="590" width="20" height="16" rx="4" fill="${WATCH_STRAP}" stroke="#0f172a" stroke-width="1.5" />
      <circle cx="96" cy="598" r="3.5" fill="${WATCH_GLOW}" opacity="0.9" />
      <!-- Sculpted Left Hand relaxed in stride -->
      <ellipse cx="94" cy="625" rx="12" ry="14" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <path d="M 88 632 C 84 640, 82 648, 80 655" stroke="${SKIN_SHADOW}" stroke-width="1.8" fill="none" stroke-linecap="round" />

      <!-- Right Arm (Swinging backward counter to left arm) -->
      <path d="M 315 375 C 330 410, 345 445, 360 480 L 342 488 C 328 455, 314 420, 295 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 358 486 C 372 525, 386 565, 396 605 L 376 610 C 368 572, 356 532, 344 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <!-- Right Hand trailing backward in stride -->
      <ellipse cx="388" cy="625" rx="12" ry="14" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
    `;
  }

  if (pose === 'walk_stride2') {
    return `
      <!-- Right Arm (Swinging forward) -->
      <path d="M 315 375 C 300 410, 286 445, 270 480 L 288 488 C 302 455, 316 420, 335 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 272 486 C 258 525, 246 565, 238 605 L 258 610 C 266 572, 276 532, 288 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <ellipse cx="244" cy="625" rx="12" ry="14" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />

      <!-- Left Arm (Swinging backward with smartwatch) -->
      <path d="M 165 375 C 180 410, 195 445, 210 480 L 192 488 C 178 455, 164 420, 145 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 208 486 C 222 525, 236 565, 246 605 L 226 610 C 218 572, 206 532, 194 492 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
      <rect x="232" y="590" width="20" height="16" rx="4" fill="${WATCH_STRAP}" stroke="#0f172a" stroke-width="1.5" />
      <circle cx="242" cy="598" r="3.5" fill="${WATCH_GLOW}" opacity="0.9" />
      <ellipse cx="238" cy="625" rx="12" ry="14" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
    `;
  }

  // Default Relaxed Conversational Stance (Natural relaxed arms and sculpted hands)
  return `
    <!-- Left Arm -->
    <path d="M 162 375 C 158 420, 156 460, 160 515 C 168 518, 182 518, 188 515 C 188 460, 186 420, 184 375 Z" fill="${JACKET_MID}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 160 510 C 168 514, 180 514, 188 510 L 188 522 C 180 526, 168 526, 160 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
    <!-- Forearm -->
    <path d="M 162 522 C 158 560, 156 610, 160 655 L 182 655 C 186 610, 184 560, 184 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
    ${smartwatch}
    <!-- Anatomically Sculpted Left Hand -->
    ${renderHumanHand(164, 655, true, 'relaxed')}

    <!-- Right Arm -->
    <path d="M 315 375 C 320 420, 324 460, 320 515 C 328 518, 342 518, 348 515 C 348 460, 346 420, 344 375 Z" fill="${JACKET_DARK}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 320 510 C 328 514, 340 514, 348 510 L 348 522 C 340 526, 328 526, 320 522 Z" fill="${JACKET_LIGHT}" stroke="#0f172a" stroke-width="2" />
    <!-- Forearm -->
    <path d="M 322 522 C 320 560, 320 610, 324 655 L 346 655 C 348 610, 348 560, 346 522 Z" fill="${SKIN_BASE}" stroke="#0f172a" stroke-width="2" />
    <!-- Anatomically Sculpted Right Hand -->
    ${renderHumanHand(344, 655, false, 'relaxed')}
  `;
}

/**
 * Generate Complete Modern Human Character SVG
 */
function buildModernCharacterSVG(pose = 'idle', options = {}) {
  let viewBox = "0 50 500 1000";
  let width = 500;

  if (pose === 'point_left' || pose === 'point_up_left' || pose === 'confused' || pose === 'surprised') {
    viewBox = "-100 50 700 1000";
    width = 700;
  } else if (pose === 'point_right' || pose === 'point_up_right') {
    viewBox = "0 50 640 1000";
    width = 640;
  } else if (pose === 'walking' || pose === 'walk_stride1' || pose === 'walk_stride2' || pose === 'walk_out') {
    viewBox = "-30 50 560 1000";
    width = 560;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="1000">
  <g id="modern_character_root">
    <!-- 1. Legs, Trousers & Modern Designer Sneakers -->
    ${renderModernLegs(pose)}

    <!-- 2. Torso, Inner Tee & Modern Tech Overshirt (Base Layer) -->
    ${renderModernTorso()}

    <!-- 3. Arms, Forearms, Hands & Smartwatch (Rendered IN FRONT of Torso to prevent clipping into back) -->
    ${renderModernArms(pose)}

    <!-- 4. Sculpted Human Head, Face, Hair, Eyes & Anatomical Lips -->
    ${renderHumanHead(pose, options)}
  </g>
</svg>`;
}

/**
 * Generate Holographic UI HUD Comparison Card SVG
 * Rendered side-by-side when the host points to specs, deprecation notices, or comparisons!
 */
function buildHolographicHudCardSVG(title = "MODEL COMPARISON", modelA = "Claude 3.7", modelB = "GPT-4.5", type = "comparison") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 700" width="540" height="700">
  <defs>
    <linearGradient id="hudBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617" stop-opacity="0.92" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>

  <!-- Glass Card Frame with Glowing Cyan Border -->
  <rect x="10" y="10" width="520" height="680" rx="20" fill="url(#hudBg)" stroke="#0284c7" stroke-width="3" />
  <rect x="15" y="15" width="510" height="670" rx="16" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.4" />

  <!-- Top Tech Header Pill -->
  <rect x="30" y="30" width="220" height="36" rx="8" fill="#0369a1" opacity="0.35" />
  <text x="45" y="54" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="bold" letter-spacing="2">VERIFIED TECH INTEL</text>
  
  <!-- Live Signal Indicator -->
  <circle cx="485" cy="48" r="6" fill="#10b981" />
  <circle cx="485" cy="48" r="10" fill="#10b981" opacity="0.4" />

  <!-- Headline Title -->
  <text x="30" y="105" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800">${title}</text>
  <line x1="30" y1="125" x2="510" y2="125" stroke="#334155" stroke-width="1.5" />

  <!-- Model A vs Model B Split Columns -->
  <!-- Left Column: Model A -->
  <rect x="30" y="145" width="230" height="340" rx="14" fill="#0f172a" stroke="#0ea5e9" stroke-width="2" />
  <rect x="40" y="155" width="210" height="32" rx="6" fill="#0284c7" />
  <text x="145" y="177" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${modelA}</text>

  <text x="45" y="225" fill="#94a3b8" font-size="12">REASONING SPEED</text>
  <rect x="45" y="235" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="45" y="235" width="180" height="10" rx="5" fill="#38bdf8" />

  <text x="45" y="280" fill="#94a3b8" font-size="12">RESPONSE SPEED</text>
  <rect x="45" y="290" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="45" y="290" width="165" height="10" rx="5" fill="#10b981" />

  <text x="45" y="335" fill="#94a3b8" font-size="12">EFFICIENCY PER TOKEN</text>
  <rect x="45" y="345" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="45" y="345" width="190" height="10" rx="5" fill="#6366f1" />

  <rect x="45" y="390" width="200" height="70" rx="8" fill="#1e293b" />
  <text x="55" y="415" fill="#38bdf8" font-size="11" font-weight="bold">CODING BENCHMARK</text>
  <text x="55" y="445" fill="#f8fafc" font-size="19" font-weight="800">70.3% Verified</text>

  <!-- Right Column: Model B -->
  <rect x="280" y="145" width="230" height="340" rx="14" fill="#0f172a" stroke="#64748b" stroke-width="2" />
  <rect x="290" y="155" width="210" height="32" rx="6" fill="#334155" />
  <text x="395" y="177" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${modelB}</text>

  <text x="295" y="225" fill="#94a3b8" font-size="12">REASONING DEPTH</text>
  <rect x="295" y="235" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="295" y="235" width="150" height="10" rx="5" fill="#a855f7" />

  <text x="295" y="280" fill="#94a3b8" font-size="12">RESPONSE SPEED</text>
  <rect x="295" y="290" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="295" y="290" width="120" height="10" rx="5" fill="#f59e0b" />

  <text x="295" y="335" fill="#94a3b8" font-size="12">COMPUTE EXPENSE</text>
  <rect x="295" y="345" width="200" height="10" rx="5" fill="#1e293b" />
  <rect x="295" y="345" width="140" height="10" rx="5" fill="#ec4899" />

  <rect x="295" y="390" width="200" height="70" rx="8" fill="#1e293b" />
  <text x="305" y="415" fill="#94a3b8" font-size="11" font-weight="bold">SCALE CAPACITY</text>
  <text x="305" y="445" fill="#f8fafc" font-size="19" font-weight="800">100K+ Nuance</text>

  <!-- Bottom Citation Bar -->
  <rect x="30" y="515" width="480" height="145" rx="12" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
  <text x="45" y="545" fill="#38bdf8" font-size="13" font-weight="bold">SOURCE CITATION</text>
  <text x="45" y="575" fill="#e2e8f0" font-size="14">Empirical tests from research institutions and verified leaderboards</text>
  <text x="45" y="605" fill="#94a3b8" font-size="13">"Hybrid dynamic compute outpaces brute-force scaling"</text>
  <text x="45" y="635" fill="#22c55e" font-size="13" font-weight="bold">STATUS: VERIFIED INDUSTRY DATA</text>
</svg>`;
}

/**
 * Build Floating Non-Intrusive Glossary Board SVG (Explaining Big Terms Simply)
 * Dimensions: 860 x 200 (optimized for upper horizontal third without obscuring character)
 */
function buildFloatingGlossaryBoardSVG(rawTerm = 'Step-by-Step Reasoning', rawDefinition = 'When artificial intelligence breaks complex math or code into clear, individual steps before speaking.') {
  const term = String(rawTerm).replace(/[<>&'"]/g, '').toUpperCase();
  const definition = String(rawDefinition).replace(/[<>&'"]/g, '');

  // Wrap definition into two lines if needed (max ~55 chars per line)
  let line1 = definition;
  let line2 = '';
  if (definition.length > 55) {
    const splitIndex = definition.lastIndexOf(' ', 55);
    if (splitIndex !== -1) {
      line1 = definition.substring(0, splitIndex);
      line2 = definition.substring(splitIndex + 1);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 200" width="860" height="200">
  <defs>
    <linearGradient id="glossaryGlassBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b132b" stop-opacity="0.94" />
      <stop offset="100%" stop-color="#1c2541" stop-opacity="0.92" />
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0284c7" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Main Floating Obsidian Glass Container -->
  <rect x="15" y="15" width="830" height="170" rx="20" fill="url(#glossaryGlassBg)" stroke="#38bdf8" stroke-width="2" filter="url(#cyanGlow)" />
  
  <!-- Subtle Inner Top Highlight -->
  <path d="M 35 17 L 825 17" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" stroke-linecap="round" />

  <!-- Top Pill Badge: Plain English Breakdown -->
  <rect x="40" y="32" width="225" height="28" rx="14" fill="url(#pillGrad)" />
  <circle cx="56" cy="46" r="5" fill="#ffffff" />
  <text x="70" y="51" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="0.5">PLAIN ENGLISH TERM</text>

  <!-- Small Glowing Ambient Beacon on Right -->
  <circle cx="805" cy="46" r="5" fill="#38bdf8" />
  <circle cx="805" cy="46" r="10" fill="#38bdf8" opacity="0.3" />

  <!-- The Big Term Headline -->
  <text x="40" y="96" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" letter-spacing="0.8">${term}</text>

  <!-- Horizontal Thin Divider -->
  <line x1="40" y1="112" x2="820" y2="112" stroke="#334155" stroke-width="1" stroke-dasharray="4 4" />

  <!-- The Crystal-Clear Easy-to-Understand Definition -->
  <text x="40" y="140" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="500">${line1}</text>
  ${line2 ? `<text x="40" y="165" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400">${line2}</text>` : ''}
</svg>`;
}

// All Modern Human Poses to Generate
const ALL_MODERN_POSES = [
  { name: 'puppet_idle', pose: 'idle', options: { blink: false, talking: false } },
  { name: 'puppet_blink', pose: 'idle', options: { blink: true, talking: false } },
  { name: 'puppet_talking', pose: 'idle', options: { blink: false, talking: true } },
  { name: 'puppet_walking', pose: 'walking', options: { blink: false, talking: false } },
  { name: 'puppet_walk_stride1', pose: 'walk_stride1', options: { blink: false, talking: false } },
  { name: 'puppet_walk_stride2', pose: 'walk_stride2', options: { blink: false, talking: false } },
  { name: 'puppet_walk_talk1', pose: 'walk_stride1', options: { blink: false, talking: true } },
  { name: 'puppet_walk_talk2', pose: 'walk_stride2', options: { blink: false, talking: true } },
  { name: 'puppet_sitting', pose: 'sitting', options: { blink: false, talking: false } },
  { name: 'puppet_sitting_talk', pose: 'sitting', options: { blink: false, talking: true } },
  { name: 'puppet_thinking', pose: 'thinking', options: { blink: false, talking: false } },
  { name: 'puppet_thinking_talk', pose: 'thinking', options: { blink: false, talking: true } },
  { name: 'puppet_confused', pose: 'confused', options: { blink: false, talking: false } },
  { name: 'puppet_confused_talk', pose: 'confused', options: { blink: false, talking: true } },
  { name: 'puppet_surprised', pose: 'surprised', options: { blink: false, talking: false } },
  { name: 'puppet_surprised_talk', pose: 'surprised', options: { blink: false, talking: true } },
  { name: 'puppet_questioning_users', pose: 'questioning_users', options: { blink: false, talking: false } },
  { name: 'puppet_questioning_users_talk', pose: 'questioning_users', options: { blink: false, talking: true } },
  { name: 'puppet_point_left', pose: 'point_left', options: { blink: false, talking: false } },
  { name: 'puppet_point_left_talk', pose: 'point_left', options: { blink: false, talking: true } },
  { name: 'puppet_point_right', pose: 'point_right', options: { blink: false, talking: false } },
  { name: 'puppet_point_right_talk', pose: 'point_right', options: { blink: false, talking: true } },
  { name: 'puppet_point_up_left', pose: 'point_up_left', options: { blink: false, talking: false } },
  { name: 'puppet_point_up_left_talk', pose: 'point_up_left', options: { blink: false, talking: true } },
  { name: 'puppet_point_up_right', pose: 'point_up_right', options: { blink: false, talking: false } },
  { name: 'puppet_point_up_right_talk', pose: 'point_up_right', options: { blink: false, talking: true } },
  { name: 'puppet_akimbo_jaw', pose: 'akimbo_jaw', options: { blink: false, talking: false } },
  { name: 'puppet_akimbo_jaw_talk', pose: 'akimbo_jaw', options: { blink: false, talking: true } },
  { name: 'puppet_explain_both', pose: 'explain_both', options: { blink: false, talking: false } },
  { name: 'puppet_explain_both_talk', pose: 'explain_both', options: { blink: false, talking: true } }
];

/**
 * Main Builder Function
 */
function buildAllModernCharacterAssets(force = true) {
  console.log('🎨 [Modern Character Rig] Rendering modern human-like character assets & UI HUD...');

  // 1. Build character poses
  ALL_MODERN_POSES.forEach(p => {
    const svgPath = path.join(OUT_DIR, `${p.name}.svg`);
    const pngPath = path.join(OUT_DIR, `${p.name}.png`);

    if (!force && fs.existsSync(pngPath) && fs.statSync(pngPath).size > 1000) {
      return;
    }

    const svg = buildModernCharacterSVG(p.pose, p.options);
    fs.writeFileSync(svgPath, svg, 'utf8');

    try {
      execSync(`ffmpeg -y -i "${svgPath}" "${pngPath}" 2>/dev/null`);
      console.log(`  ✅ Rendered pose: ${p.name}.png (${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn(`  ⚠️ Pose render fallback: ${p.name}`);
    }
  });

  // 2. Build Holographic UI HUD Comparison Card
  const hudSvgPath = path.join(HUD_DIR, 'hud_comparison_card.svg');
  const hudPngPath = path.join(HUD_DIR, 'hud_comparison_card.png');
  const hudSvg = buildHolographicHudCardSVG();
  fs.writeFileSync(hudSvgPath, hudSvg, 'utf8');
  try {
    execSync(`ffmpeg -y -i "${hudSvgPath}" "${hudPngPath}" 2>/dev/null`);
    console.log(`  ✅ Rendered UI HUD: hud_comparison_card.png`);
  } catch {}

  // 3. Mirror into comparison_puppet directory for 100% backward compatibility
  ALL_MODERN_POSES.forEach(p => {
    const srcPng = path.join(OUT_DIR, `${p.name}.png`);
    const destPng = path.join(COMP_DIR, `${p.name}.png`);
    if (fs.existsSync(srcPng)) {
      try { fs.copyFileSync(srcPng, destPng); } catch {}
    }
  });

  // Also map aliases:
  try {
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_explain_both.png'), path.join(COMP_DIR, 'puppet_compare_both.png'));
    fs.copyFileSync(path.join(OUT_DIR, 'puppet_blink.png'), path.join(COMP_DIR, 'puppet_eyes_closed.png'));
  } catch {}

  console.log('🚀 [Modern Character Rig] All modern creator poses, movements, and HUD assets ready!');
  return true;
}

if (require.main === module) {
  buildAllModernCharacterAssets(true);
}

module.exports = {
  buildAllModernCharacterAssets,
  buildModernCharacterSVG,
  buildHolographicHudCardSVG,
  buildFloatingGlossaryBoardSVG,
  OUT_DIR,
  COMP_DIR,
  HUD_DIR
};
