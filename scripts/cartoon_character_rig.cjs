/**
 * Automated Cartoon Factory — Original 2D/2.5D Character Rig ("Archie")
 *
 * Reusable Components:
 * - Head & Hair
 * - Eyes (Neutral, Happy, Surprised, Thinking, Looking Left/Right)
 * - Brows
 * - Mouth Shapes (Preston Blair: A, B, C, D, E, F, G, H, X)
 * - Torso / Hoodie (Consistent signature color)
 * - Arms (Idle, Point Left, Point Right, Thinking/Chin, Excitement/Up)
 * - Dynamic Scene Props & Backgrounds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(process.cwd(), 'cartoon_character_assets');

/**
 * Generate SVGs for all mouth shapes (A through X)
 */
function getMouthSvg(shape) {
  switch (shape) {
    case 'A': // Closed / Rest (P, B, M)
      return `<path d="M 40 50 Q 50 51 60 50" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none" />`;
    case 'B': // Slightly Open (Consonants S, T, D)
      return `<ellipse cx="50" cy="50" rx="12" ry="5" fill="#e11d48" stroke="#1e293b" stroke-width="3" />
              <rect x="42" y="47" width="16" height="3" fill="#ffffff" rx="1" />`;
    case 'C': // Wide Open (Vowels AH, AA)
      return `<ellipse cx="50" cy="54" rx="14" ry="12" fill="#be123c" stroke="#1e293b" stroke-width="3.5" />
              <ellipse cx="50" cy="46" rx="9" ry="3" fill="#ffffff" />
              <ellipse cx="50" cy="62" rx="8" ry="4" fill="#fb7185" />`;
    case 'D': // Smile / Teeth Exposed (EE, I)
      return `<path d="M 36 48 Q 50 62 64 48 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3.5" />
              <line x1="38" y1="53" x2="62" y2="53" stroke="#cbd5e1" stroke-width="1.5" />`;
    case 'E': // Rounded / OO, W
      return `<circle cx="50" cy="50" r="9" fill="#e11d48" stroke="#1e293b" stroke-width="3.5" />
              <circle cx="50" cy="50" r="5" fill="#4c0519" />`;
    case 'F': // Lip Tuck (F, V)
      return `<path d="M 38 48 Q 50 52 62 48" stroke="#1e293b" stroke-width="3" fill="none" />
              <rect x="44" y="49" width="12" height="4" fill="#ffffff" rx="1" stroke="#1e293b" stroke-width="1" />
              <path d="M 42 54 Q 50 56 58 54" stroke="#e11d48" stroke-width="3" fill="none" />`;
    case 'G': // Narrow Open / Tongue behind teeth (L, TH)
      return `<ellipse cx="50" cy="50" rx="10" ry="7" fill="#e11d48" stroke="#1e293b" stroke-width="3" />
              <path d="M 45 49 Q 50 46 55 49" stroke="#ffffff" stroke-width="3" fill="none" />`;
    case 'H': // Wide Smiling Open
      return `<path d="M 34 46 Q 50 66 66 46 Z" fill="#e11d48" stroke="#1e293b" stroke-width="3.5" />
              <path d="M 38 46 L 62 46 Q 50 50 38 46 Z" fill="#ffffff" />
              <ellipse cx="50" cy="60" rx="8" ry="4" fill="#fb7185" />`;
    case 'X': // Total Rest / Silence
    default:
      return `<path d="M 42 50 Q 50 52 58 50" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" fill="none" />`;
  }
}

/**
 * Generate full SVG for Character Archie in a specific action and mouth shape
 */
function generateCharacterFrameSvg(action = 'talking', emotion = 'curious', mouthShape = 'B', width = 1080, height = 1920) {
  const mouthSvgContent = getMouthSvg(mouthShape);

  // Eye configurations
  let leftPupilX = 510;
  let rightPupilX = 570;
  let pupilY = 720;
  let eyeScaleY = 1.0;

  if (action === 'looking_left') {
    leftPupilX = 495;
    rightPupilX = 555;
  } else if (action === 'looking_right' || action === 'point_right') {
    leftPupilX = 525;
    rightPupilX = 585;
  } else if (emotion === 'surprised' || action === 'surprise') {
    eyeScaleY = 1.35;
    pupilY = 715;
  } else if (emotion === 'thinking' || action === 'thinking') {
    pupilY = 705;
    leftPupilX = 515;
    rightPupilX = 575;
  }

  // Arm positions based on action
  let leftArmSvg = `<path d="M 430 920 Q 380 1020 370 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                    <circle cx="370" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  let rightArmSvg = `<path d="M 650 920 Q 700 1020 710 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                     <circle cx="710" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;

  if (action === 'point_right') {
    rightArmSvg = `<path d="M 650 920 Q 750 900 880 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <path d="M 880 840 L 940 820" stroke="#fbcfe8" stroke-width="32" stroke-linecap="round" />
                   <circle cx="880" cy="840" r="24" fill="#fbcfe8" />`;
  } else if (action === 'point_left') {
    leftArmSvg = `<path d="M 430 920 Q 330 900 200 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                  <path d="M 200 840 L 140 820" stroke="#fbcfe8" stroke-width="32" stroke-linecap="round" />
                  <circle cx="200" cy="840" r="24" fill="#fbcfe8" />`;
  } else if (action === 'thinking') {
    rightArmSvg = `<path d="M 650 920 Q 720 980 620 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <circle cx="600" cy="820" r="30" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  } else if (action === 'excitement' || action === 'laughing') {
    leftArmSvg = `<path d="M 430 920 Q 320 800 310 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                  <circle cx="310" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
    rightArmSvg = `<path d="M 650 920 Q 760 800 770 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <circle cx="770" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <radialGradient id="charGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background Environment Canvas -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <circle cx="540" cy="900" r="600" fill="url(#charGlow)" />

  <!-- Shadow Floor -->
  <ellipse cx="540" cy="1580" rx="320" ry="45" fill="#020617" opacity="0.6" />

  <!-- Character Group: "Archie" -->
  <g id="character_archie">
    <!-- Legs / Pants -->
    <path d="M 460 1200 L 440 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
    <path d="M 620 1200 L 640 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
    <!-- Shoes -->
    <ellipse cx="420" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
    <ellipse cx="660" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />

    <!-- Torso / Signature Cobalt Hoodie -->
    <path d="M 410 880 C 410 880, 380 1220, 420 1240 L 660 1240 C 700 1220, 670 880, 670 880 Z" fill="#2563eb" stroke="#1e293b" stroke-width="5" />
    <!-- Hoodie Pocket -->
    <path d="M 460 1080 Q 540 1140 620 1080 L 600 1180 L 480 1180 Z" fill="#1d4ed8" stroke="#1e293b" stroke-width="4" />

    <!-- Left & Right Arms -->
    ${leftArmSvg}
    ${rightArmSvg}

    <!-- Neck -->
    <rect x="510" y="810" width="60" height="80" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" rx="8" />

    <!-- Head -->
    <ellipse cx="540" cy="710" rx="140" ry="155" fill="#fce7f3" stroke="#1e293b" stroke-width="6" />

    <!-- Hair / Signature Quirk -->
    <path d="M 400 680 C 400 520, 520 490, 680 570 C 680 570, 690 670, 680 700 C 650 560, 520 540, 420 620 Z" fill="#3b2d23" stroke="#1e293b" stroke-width="5" />
    <path d="M 520 510 Q 550 430 580 470 Q 550 490 540 520" fill="#3b2d23" stroke="#1e293b" stroke-width="4" />

    <!-- Eyebrows -->
    <path d="M 470 650 Q 510 635 535 655" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
    <path d="M 545 655 Q 570 635 610 650" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />

    <!-- Eyes (White) -->
    <ellipse cx="505" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
    <ellipse cx="575" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />

    <!-- Pupils -->
    <circle cx="${leftPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
    <circle cx="${leftPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />
    <circle cx="${rightPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
    <circle cx="${rightPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />

    <!-- Nose -->
    <path d="M 536 745 Q 546 760 536 770" stroke="#f472b6" stroke-width="5" stroke-linecap="round" fill="none" />

    <!-- Mouth Anchor (Nested SVG for Preston Blair shape: ${mouthShape}) -->
    <g transform="translate(490, 755) scale(1.0)">
      ${mouthSvgContent}
    </g>
  </g>
</svg>`;
}

/**
 * Ensure character base asset directory exists
 */
function ensureCharacterRigAssets() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Write all standard Preston Blair mouth shapes A-X
  const shapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
  for (const s of shapes) {
    const filePath = path.join(ASSETS_DIR, `mouth_${s}.svg`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${getMouthSvg(s)}</svg>`;
    fs.writeFileSync(filePath, svg);
  }

  console.log(`[Character Rig] Initialized Archie character assets in ${ASSETS_DIR}`);
}

module.exports = {
  getMouthSvg,
  generateCharacterFrameSvg,
  ensureCharacterRigAssets,
  ASSETS_DIR
};
