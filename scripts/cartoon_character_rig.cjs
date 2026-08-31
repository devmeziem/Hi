/**
 * Automated Cartoon Factory — Original 2D/2.5D Character Rig ("Archie")
 *
 * Source of Truth: SVG Artwork in /cartoon_character_assets
 *
 * Reusable Animatable Components:
 * - Background Layer (background.svg / background.png)
 * - Legs & Floor Shadow (legs.svg / legs.png)
 * - Torso / Signature Cobalt Blue Hoodie (torso.svg / torso.png)
 * - Arms (Idle, Point Left, Point Right, Thinking, Excitement)
 * - Head Base (Neck, Head Oval, Hair Quirk, Ears, Nose)
 * - Eyes (Open for idle/talk, Closed for blinking)
 * - Pupils (Movable X/Y for eye darting/expression)
 * - Eyebrows (Neutral, Curious, Surprised)
 * - Preston Blair Mouth Phonemes (A, B, C, D, E, F, G, H, X)
 * - Full Action Body Composites (body_talking, body_point_right, body_point_left, body_thinking, body_excitement)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(process.cwd(), 'cartoon_character_assets');

/**
 * Generate SVGs for all mouth shapes (A through X) in standard Preston Blair phoneme set
 */
function getMouthSvg(shape) {
  switch (shape) {
    case 'A': // Closed / Rest (P, B, M)
      return `<path d="M 20 50 Q 50 52 80 50" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />`;
    case 'B': // Slightly Open (Consonants S, T, D, N, K, G)
      return `<ellipse cx="50" cy="50" rx="28" ry="12" fill="#e11d48" stroke="#1e293b" stroke-width="5" />
              <rect x="32" y="44" width="36" height="6" fill="#ffffff" rx="2" stroke="#1e293b" stroke-width="1.5" />`;
    case 'C': // Wide Open (Vowels AH, AA)
      return `<ellipse cx="50" cy="52" rx="32" ry="24" fill="#be123c" stroke="#1e293b" stroke-width="5.5" />
              <ellipse cx="50" cy="38" rx="20" ry="7" fill="#ffffff" />
              <ellipse cx="50" cy="68" rx="18" ry="8" fill="#fb7185" />`;
    case 'D': // Smile / Teeth Exposed (EE, I)
      return `<path d="M 18 45 Q 50 75 82 45 Z" fill="#ffffff" stroke="#1e293b" stroke-width="5.5" />
              <line x1="20" y1="52" x2="80" y2="52" stroke="#cbd5e1" stroke-width="2.5" />`;
    case 'E': // Rounded / OO, W, U
      return `<circle cx="50" cy="50" r="20" fill="#e11d48" stroke="#1e293b" stroke-width="5.5" />
              <circle cx="50" cy="50" r="10" fill="#4c0519" />`;
    case 'F': // Lip Tuck (F, V)
      return `<path d="M 20 45 Q 50 55 80 45" stroke="#1e293b" stroke-width="5" fill="none" />
              <rect x="36" y="47" width="28" height="8" fill="#ffffff" rx="2" stroke="#1e293b" stroke-width="2" />
              <path d="M 30 58 Q 50 64 70 58" stroke="#e11d48" stroke-width="5" fill="none" />`;
    case 'G': // Narrow Open / Tongue behind teeth (L, TH)
      return `<ellipse cx="50" cy="50" rx="24" ry="16" fill="#e11d48" stroke="#1e293b" stroke-width="5" />
              <path d="M 38 48 Q 50 42 62 48" stroke="#ffffff" stroke-width="5" fill="none" />`;
    case 'H': // Wide Smiling Open
      return `<path d="M 15 42 Q 50 82 85 42 Z" fill="#e11d48" stroke="#1e293b" stroke-width="5.5" />
              <path d="M 24 42 L 76 42 Q 50 50 24 42 Z" fill="#ffffff" />
              <ellipse cx="50" cy="70" rx="18" ry="9" fill="#fb7185" />`;
    case 'X': // Total Rest / Neutral
    default:
      return `<path d="M 25 50 Q 50 54 75 50" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />`;
  }
}

/**
 * Generate full SVG for Character Archie in a specific action and mouth shape
 */
function generateCharacterFrameSvg(action = 'talking', emotion = 'curious', mouthShape = 'B', width = 1080, height = 1920) {
  const mouthSvgContent = getMouthSvg(mouthShape);

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

  <!-- Background Layer -->
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

    <!-- Mouth Anchor -->
    <g transform="translate(490, 755) scale(1.0)">
      ${mouthSvgContent}
    </g>
  </g>
</svg>`;
}

/**
 * Generate Individual Animatable Component SVGs
 */
function getComponentSvgs(width = 1080, height = 1920) {
  return {
    // 1. Background
    'background': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
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
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <circle cx="540" cy="900" r="600" fill="url(#charGlow)" />
    </svg>`,

    // 2. Legs & Shadow
    'legs': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <!-- Floor Shadow -->
      <ellipse cx="540" cy="1580" rx="320" ry="45" fill="#020617" opacity="0.6" />
      <!-- Pants Legs -->
      <path d="M 460 1200 L 440 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <path d="M 620 1200 L 640 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <!-- Shoes -->
      <ellipse cx="420" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
      <ellipse cx="660" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
    </svg>`,

    // 3. Torso / Signature Cobalt Hoodie
    'torso': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 410 880 C 410 880, 380 1220, 420 1240 L 660 1240 C 700 1220, 670 880, 670 880 Z" fill="#2563eb" stroke="#1e293b" stroke-width="5" />
      <path d="M 460 1080 Q 540 1140 620 1080 L 600 1180 L 480 1180 Z" fill="#1d4ed8" stroke="#1e293b" stroke-width="4" />
    </svg>`,

    // 4. Head Base (Neck, Head oval, Hair, Ears, Nose)
    'head': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect x="510" y="810" width="60" height="80" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" rx="8" />
      <ellipse cx="540" cy="710" rx="140" ry="155" fill="#fce7f3" stroke="#1e293b" stroke-width="6" />
      <path d="M 400 680 C 400 520, 520 490, 680 570 C 680 570, 690 670, 680 700 C 650 560, 520 540, 420 620 Z" fill="#3b2d23" stroke="#1e293b" stroke-width="5" />
      <path d="M 520 510 Q 550 430 580 470 Q 550 490 540 520" fill="#3b2d23" stroke="#1e293b" stroke-width="4" />
      <path d="M 536 745 Q 546 760 536 770" stroke="#f472b6" stroke-width="5" stroke-linecap="round" fill="none" />
    </svg>`,

    // 5. Eyebrows
    'eyebrows': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 470 650 Q 510 635 535 655" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M 545 655 Q 570 635 610 650" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
    </svg>`,

    // 6. Eyes Open (Sclera)
    'eyes_open': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <ellipse cx="505" cy="715" rx="30" ry="34" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
      <ellipse cx="575" cy="715" rx="30" ry="34" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
    </svg>`,

    // 7. Eyes Closed (Blink Eyelids)
    'eyes_closed': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 480 720 Q 505 735 530 720" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M 550 720 Q 575 735 600 720" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />
    </svg>`,

    // 8. Pupils
    'pupils': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <circle cx="510" cy="720" r="14" fill="#0f172a" />
      <circle cx="506" cy="716" r="5" fill="#ffffff" />
      <circle cx="570" cy="720" r="14" fill="#0f172a" />
      <circle cx="566" cy="716" r="5" fill="#ffffff" />
    </svg>`,

    // 9. Arm Left Idle
    'arm_left_idle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 430 920 Q 380 1020 370 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <circle cx="370" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />
    </svg>`,

    // 10. Arm Right Idle
    'arm_right_idle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 650 920 Q 700 1020 710 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <circle cx="710" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />
    </svg>`,

    // 11. Arm Right Pointing
    'arm_right_point': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 650 920 Q 750 900 880 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <path d="M 880 840 L 940 820" stroke="#fbcfe8" stroke-width="32" stroke-linecap="round" />
      <circle cx="880" cy="840" r="24" fill="#fbcfe8" />
    </svg>`,

    // 12. Arm Left Pointing
    'arm_left_point': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 430 920 Q 330 900 200 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <path d="M 200 840 L 140 820" stroke="#fbcfe8" stroke-width="32" stroke-linecap="round" />
      <circle cx="200" cy="840" r="24" fill="#fbcfe8" />
    </svg>`,

    // 13. Arm Right Thinking (hand on chin)
    'arm_right_thinking': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 650 920 Q 720 980 620 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <circle cx="600" cy="820" r="30" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />
    </svg>`,

    // 14. Arm Both Up (Excitement)
    'arms_excitement': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <path d="M 430 920 Q 320 800 310 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <circle cx="310" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />
      <path d="M 650 920 Q 760 800 770 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
      <circle cx="770" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />
    </svg>`
  };
}

/**
 * Generate Character Body & Face without Mouth (for Blender 2.5D layer composition)
 */
function generateCharacterBodySvg(action = 'talking', emotion = 'curious', width = 1080, height = 1920) {
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
    <g id="character_archie">
      <path d="M 460 1200 L 440 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <path d="M 620 1200 L 640 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <ellipse cx="420" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
      <ellipse cx="660" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
      <path d="M 410 880 C 410 880, 380 1220, 420 1240 L 660 1240 C 700 1220, 670 880, 670 880 Z" fill="#2563eb" stroke="#1e293b" stroke-width="5" />
      <path d="M 460 1080 Q 540 1140 620 1080 L 600 1180 L 480 1180 Z" fill="#1d4ed8" stroke="#1e293b" stroke-width="4" />
      ${leftArmSvg}
      ${rightArmSvg}
      <rect x="510" y="810" width="60" height="80" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" rx="8" />
      <ellipse cx="540" cy="710" rx="140" ry="155" fill="#fce7f3" stroke="#1e293b" stroke-width="6" />
      <path d="M 400 680 C 400 520, 520 490, 680 570 C 680 570, 690 670, 680 700 C 650 560, 520 540, 420 620 Z" fill="#3b2d23" stroke="#1e293b" stroke-width="5" />
      <path d="M 520 510 Q 550 430 580 470 Q 550 490 540 520" fill="#3b2d23" stroke="#1e293b" stroke-width="4" />
      <path d="M 470 650 Q 510 635 535 655" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M 545 655 Q 570 635 610 650" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
      <ellipse cx="505" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
      <ellipse cx="575" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
      <circle cx="${leftPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
      <circle cx="${leftPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />
      <circle cx="${rightPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
      <circle cx="${rightPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />
      <path d="M 536 745 Q 546 760 536 770" stroke="#f472b6" stroke-width="5" stroke-linecap="round" fill="none" />
    </g>
  </svg>`;
}

/**
 * Helper to rasterize SVG into PNG via FFmpeg with alpha
 */
function rasterizeSvgToPng(svgPath, pngPath, width = 1080, height = 1920) {
  try {
    execSync(`ffmpeg -y -i "${svgPath}" -vf "scale=${width}:${height}" "${pngPath}" 2>/dev/null`);
    if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 50) return true;
  } catch {}
  return false;
}

/**
 * Ensure character base SVG assets and rendered PNG textures exist for Blender
 */
function ensureCharacterRigAssets() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // 1. Write standard Preston Blair mouth shapes A-X
  const shapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
  for (const s of shapes) {
    const svgPath = path.join(ASSETS_DIR, `mouth_${s}.svg`);
    const pngPath = path.join(ASSETS_DIR, `mouth_${s}.png`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><g transform="scale(1.0)">${getMouthSvg(s)}</g></svg>`;
    fs.writeFileSync(svgPath, svg);
    rasterizeSvgToPng(svgPath, pngPath, 200, 200);
  }

  // 2. Write Component Layers (legs, torso, head, eyebrows, eyes, pupils, arms)
  const components = getComponentSvgs();
  for (const [name, svgContent] of Object.entries(components)) {
    const svgPath = path.join(ASSETS_DIR, `${name}.svg`);
    const pngPath = path.join(ASSETS_DIR, `${name}.png`);
    fs.writeFileSync(svgPath, svgContent);
    rasterizeSvgToPng(svgPath, pngPath, 1080, 1920);
  }

  // 3. Write Character Body Actions
  const actions = ['talking', 'point_right', 'point_left', 'thinking', 'excitement'];
  for (const act of actions) {
    const svgPath = path.join(ASSETS_DIR, `body_${act}.svg`);
    const pngPath = path.join(ASSETS_DIR, `body_${act}.png`);
    const svg = generateCharacterBodySvg(act, 'curious');
    fs.writeFileSync(svgPath, svg);
    rasterizeSvgToPng(svgPath, pngPath, 1080, 1920);
  }

  // 4. Write Default Background
  const bgSvgPath = path.join(ASSETS_DIR, `background.svg`);
  const bgPngPath = path.join(ASSETS_DIR, `background.png`);
  if (!fs.existsSync(bgSvgPath)) {
    fs.writeFileSync(bgSvgPath, components.background);
    rasterizeSvgToPng(bgSvgPath, bgPngPath, 1080, 1920);
  }

  console.log(`[Character Rig] Initialized Archie SVG & PNG character assets in ${ASSETS_DIR}`);
}

module.exports = {
  getMouthSvg,
  generateCharacterFrameSvg,
  generateCharacterBodySvg,
  getComponentSvgs,
  ensureCharacterRigAssets,
  ASSETS_DIR
};

