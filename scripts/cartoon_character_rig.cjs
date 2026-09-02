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
 * Generate full SVG for Character Archie in a specific action, mouth shape, and topic-specific background
 */
function generateCharacterFrameSvg(action = 'talking', emotion = 'curious', mouthShape = 'B', width = 1080, height = 1920, backgroundStyle = 'tech_studio', topic = '', objects = []) {
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

  // Generate dynamic thematic background according to the scene's topic
  const rawBgSvg = generateSceneBackgroundSvg(backgroundStyle, topic, objects, width, height);
  // Extract inner defs and elements
  const bgInner = rawBgSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Dynamic Topic-Tailored Background Layer -->
  ${bgInner}

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
 * Generate Dynamic Background Environment SVG based on scene theme & objects
 */
function generateSceneBackgroundSvg(backgroundStyle = 'tech_studio', topic = '', objects = [], width = 1080, height = 1920) {
  const style = String(backgroundStyle || '').toLowerCase();
  
  // 1. Modern Tech Lab / Server Room / Cyber
  if (style.includes('tech') || style.includes('lab') || style.includes('server') || style.includes('internet') || style.includes('cable')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="techBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="60%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
        <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#38bdf8" stroke-width="0.75" opacity="0.18" />
        </pattern>
        <radialGradient id="techGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#techBg)" />
      <rect width="${width}" height="${height}" fill="url(#gridPattern)" />
      <circle cx="540" cy="800" r="550" fill="url(#techGlow)" />
      <!-- Server Racks / Digital Nodes in background -->
      <g opacity="0.4" stroke="#38bdf8" stroke-width="2" fill="none">
        <rect x="80" y="300" width="160" height="900" rx="10" stroke="#0284c7" stroke-width="3" />
        <line x1="100" y1="360" x2="220" y2="360" /><line x1="100" y1="420" x2="220" y2="420" /><line x1="100" y1="480" x2="220" y2="480" />
        <rect x="840" y="300" width="160" height="900" rx="10" stroke="#0284c7" stroke-width="3" />
        <line x1="860" y1="360" x2="980" y2="360" /><line x1="860" y1="420" x2="980" y2="420" /><line x1="860" y1="480" x2="980" y2="480" />
        <!-- Glowing Data Stream Lines -->
        <path d="M 0 1400 Q 540 1200 1080 1400" stroke="#06b6d4" stroke-width="4" />
        <path d="M 0 1480 Q 540 1320 1080 1480" stroke="#3b82f6" stroke-width="3" />
      </g>
    </svg>`;
  }

  // 2. Deep Space / Astronomy / Cosmic / Physics
  if (style.includes('space') || style.includes('cosmic') || style.includes('star') || style.includes('universe')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <radialGradient id="spaceBg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#311042" />
          <stop offset="50%" stop-color="#0f0728" />
          <stop offset="100%" stop-color="#02000a" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#spaceBg)" />
      <!-- Distant Stars & Constellations -->
      <g fill="#ffffff">
        <circle cx="120" cy="180" r="2.5" opacity="0.9" /><circle cx="280" cy="320" r="1.8" opacity="0.7" />
        <circle cx="820" cy="220" r="3.0" opacity="0.9" /><circle cx="940" cy="400" r="2.0" opacity="0.8" />
        <circle cx="200" cy="650" r="2.0" opacity="0.6" /><circle cx="900" cy="750" r="2.5" opacity="0.8" />
        <circle cx="450" cy="200" r="1.5" opacity="0.7" /><circle cx="650" cy="150" r="2.2" opacity="0.8" />
      </g>
      <!-- Glowing Planet Silhouette -->
      <circle cx="880" cy="350" r="120" fill="#6366f1" opacity="0.25" />
      <circle cx="880" cy="350" r="110" fill="#4338ca" opacity="0.4" />
    </svg>`;
  }

  // 3. Ocean / Underwater / Undersea Cables / Nature
  if (style.includes('ocean') || style.includes('water') || style.includes('sea') || style.includes('marine') || style.includes('nature')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="oceanBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#083344" />
          <stop offset="40%" stop-color="#0c4a6e" />
          <stop offset="100%" stop-color="#021a28" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#oceanBg)" />
      <!-- Light Caustics / Sun Rays penetrating water -->
      <path d="M 100 0 L 250 1200 L 150 1200 Z" fill="#38bdf8" opacity="0.08" />
      <path d="M 600 0 L 850 1200 L 750 1200 Z" fill="#38bdf8" opacity="0.09" />
      <!-- Sea Bed Floor & Glowing Undersea Cable -->
      <path d="M 0 1550 Q 540 1480 1080 1560 L 1080 1920 L 0 1920 Z" fill="#032b43" opacity="0.8" />
      <path d="M 0 1620 Q 540 1540 1080 1630" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M 0 1620 Q 540 1540 1080 1630" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />
    </svg>`;
  }

  // 4. Finance / Stock Market / Wealth / Business
  if (style.includes('money') || style.includes('market') || style.includes('finance') || style.includes('business') || style.includes('stock')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="finBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="50%" stop-color="#022c22" />
          <stop offset="100%" stop-color="#02140d" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#finBg)" />
      <!-- Candlestick chart silhouettes in background -->
      <g opacity="0.25" stroke="#10b981" fill="#10b981">
        <line x1="150" y1="600" x2="150" y2="900" stroke-width="2" /><rect x="140" y="660" width="20" height="180" />
        <line x1="280" y1="520" x2="280" y2="850" stroke-width="2" /><rect x="270" y="580" width="20" height="200" />
        <line x1="800" y1="450" x2="800" y2="780" stroke-width="2" /><rect x="790" y="490" width="20" height="210" />
        <line x1="930" y1="380" x2="930" y2="720" stroke-width="2" /><rect x="920" y="420" width="20" height="230" />
      </g>
      <!-- Glowing Uptrend Line -->
      <path d="M 0 1100 Q 400 950 600 700 T 1080 400" stroke="#34d399" stroke-width="6" fill="none" opacity="0.4" />
    </svg>`;
  }

  // 5. Biology / Neuroscience / Dreams / Brain / Cells
  if (style.includes('brain') || style.includes('dream') || style.includes('bio') || style.includes('cell') || style.includes('neuron') || style.includes('sleep')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="brainBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="50%" stop-color="#311042" />
          <stop offset="100%" stop-color="#090514" />
        </linearGradient>
        <radialGradient id="synapseGlow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#c084fc" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#brainBg)" />
      <circle cx="540" cy="700" r="500" fill="url(#synapseGlow)" />
      <!-- Neural Synapse network nodes & connections -->
      <g stroke="#a855f7" stroke-width="3" opacity="0.35" fill="none">
        <path d="M 200 400 Q 350 500 540 450 T 880 350" />
        <path d="M 150 700 Q 300 600 540 750 T 920 680" />
        <path d="M 250 950 Q 540 850 820 980" />
      </g>
      <g fill="#e9d5ff">
        <circle cx="200" cy="400" r="10" opacity="0.7" /><circle cx="540" cy="450" r="14" opacity="0.8" /><circle cx="880" cy="350" r="10" opacity="0.7" />
        <circle cx="150" cy="700" r="8" opacity="0.6" /><circle cx="540" cy="750" r="12" opacity="0.7" /><circle cx="920" cy="680" r="9" opacity="0.6" />
      </g>
    </svg>`;
  }

  // 6. Food / Chemistry / Onions / Plants / Kitchen
  if (style.includes('onion') || style.includes('food') || style.includes('chem') || style.includes('kitchen') || style.includes('plant')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="chemBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#14532d" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#chemBg)" />
      <!-- Floating Molecular Hexagons and Chemical Bonds -->
      <g stroke="#4ade80" stroke-width="2.5" fill="none" opacity="0.3">
        <polygon points="200,300 240,280 280,300 280,340 240,360 200,340" />
        <polygon points="800,450 840,430 880,450 880,490 840,510 800,490" />
        <polygon points="150,750 190,730 230,750 230,790 190,810 150,790" />
        <polygon points="850,850 890,830 930,850 930,890 890,910 850,890" />
        <line x1="280" y1="320" x2="340" y2="320" stroke-dasharray="4" />
        <line x1="800" y1="470" x2="740" y2="470" stroke-dasharray="4" />
      </g>
      <!-- Steam / Gas Vapor Particles -->
      <g fill="#86efac" opacity="0.25">
        <circle cx="480" cy="500" r="18" /><circle cx="580" cy="460" r="24" /><circle cx="520" cy="400" r="30" />
      </g>
    </svg>`;
  }

  // 7. Physics / Lightning / Electricity / Quantum
  if (style.includes('electric') || style.includes('light') || style.includes('quantum') || style.includes('energy') || style.includes('particle')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="energyBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#172554" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#energyBg)" />
      <!-- High-Voltage Lightning Arc & Particle Orbits -->
      <path d="M 540 200 L 510 450 L 580 470 L 480 800 L 590 820 L 530 1200" stroke="#fde047" stroke-width="8" fill="none" opacity="0.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 540 200 L 510 450 L 580 470 L 480 800 L 590 820 L 530 1200" stroke="#38bdf8" stroke-width="3" fill="none" opacity="0.8" stroke-linecap="round" stroke-linejoin="round" />
      <ellipse cx="540" cy="700" rx="360" ry="140" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.25" transform="rotate(-15 540 700)" />
      <ellipse cx="540" cy="700" rx="360" ry="140" stroke="#60a5fa" stroke-width="2" fill="none" opacity="0.25" transform="rotate(25 540 700)" />
    </svg>`;
  }

  // 8. Ancient History / Roman Architecture / Philosophy
  if (style.includes('history') || style.includes('stoic') || style.includes('ancient') || style.includes('rome') || style.includes('greek')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="historyBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1c1917" />
          <stop offset="50%" stop-color="#292524" />
          <stop offset="100%" stop-color="#0c0a09" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#historyBg)" />
      <!-- Roman Doric Marble Columns Silhouettes in background -->
      <g fill="#78716c" opacity="0.2">
        <rect x="120" y="350" width="90" height="1100" rx="6" />
        <rect x="90" y="320" width="150" height="35" rx="4" />
        <rect x="870" y="350" width="90" height="1100" rx="6" />
        <rect x="840" y="320" width="150" height="35" rx="4" />
      </g>
      <circle cx="540" cy="500" r="180" fill="#f59e0b" opacity="0.15" />
    </svg>`;
  }

  // 9. Default Clean Explainer Studio
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="studioBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
      <radialGradient id="spotlight" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.30" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#studioBg)" />
    <circle cx="540" cy="850" r="600" fill="url(#spotlight)" />
    <!-- Studio floor line -->
    <ellipse cx="540" cy="1600" rx="480" ry="120" fill="#020617" opacity="0.5" />
  </svg>`;
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
  generateSceneBackgroundSvg,
  rasterizeSvgToPng,
  getComponentSvgs,
  ensureCharacterRigAssets,
  ASSETS_DIR
};

