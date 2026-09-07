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
  
  // 1. Modern Creator Studio (YouTube / Tech Creator Desk, Warm LED Lightbars, Hex Acoustic Panels)
  if (style.includes('creator') || style.includes('studio') || style.includes('desk') || style.includes('room')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="wallBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b0f19" />
          <stop offset="60%" stop-color="#111827" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
        <linearGradient id="ambientLightLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="ambientLightRight" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="deskSpotlight" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Studio Dark Wall -->
      <rect width="${width}" height="${height}" fill="url(#wallBg)" />
      <!-- Ambient Rim Lights (Left Violet, Right Cyan) -->
      <rect x="0" y="0" width="360" height="${height}" fill="url(#ambientLightLeft)" />
      <rect x="720" y="0" width="360" height="${height}" fill="url(#ambientLightRight)" />

      <!-- Acoustic Hex Panels on back wall -->
      <g stroke="#1e293b" stroke-width="2" fill="#0f172a" opacity="0.6">
        <polygon points="200,240 240,265 240,315 200,340 160,315 160,265" />
        <polygon points="285,240 325,265 325,315 285,340 245,315 245,265" />
        <polygon points="242,318 282,343 282,393 242,418 202,393 202,343" />
        <polygon points="800,220 840,245 840,295 800,320 760,295 760,245" />
        <polygon points="885,220 925,245 925,295 885,320 845,295 845,245" />
      </g>

      <!-- Vertical LED Studio Lightbars -->
      <rect x="80" y="160" width="8" height="1100" rx="4" fill="#a855f7" />
      <rect x="76" y="150" width="16" height="1120" rx="8" fill="#c084fc" opacity="0.35" filter="blur(4px)" />
      <rect x="992" y="160" width="8" height="1100" rx="4" fill="#38bdf8" />
      <rect x="988" y="150" width="16" height="1120" rx="8" fill="#38bdf8" opacity="0.35" filter="blur(4px)" />

      <!-- Back Wall Shelving & Floating Tech Decor -->
      <line x1="140" y1="480" x2="440" y2="480" stroke="#334155" stroke-width="6" stroke-linecap="round" />
      <rect x="180" y="440" width="28" height="40" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="220" y="450" width="32" height="30" rx="4" fill="#1e293b" stroke="#6366f1" stroke-width="1.5" />
      <line x1="640" y1="440" x2="940" y2="440" stroke="#334155" stroke-width="6" stroke-linecap="round" />
      <rect x="680" y="405" width="40" height="35" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />

      <!-- Center Warm Studio Floor & Stage Spotlight -->
      <ellipse cx="540" cy="1420" rx="520" ry="260" fill="url(#deskSpotlight)" />
      <path d="M 0 1560 Q 540 1500 1080 1560 L 1080 1920 L 0 1920 Z" fill="#090d16" />
      <!-- Floor Edge Neon Runner Line -->
      <path d="M 0 1560 Q 540 1500 1080 1560" stroke="#38bdf8" stroke-width="3" fill="none" opacity="0.4" />
    </svg>`;
  }

  // 2. AI Datacenter / High-Performance Computing / Server Bays
  if (style.includes('datacenter') || style.includes('data_center') || style.includes('server') || style.includes('cloud')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="datacenterBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="50%" stop-color="#091322" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="serverGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#datacenterBg)" />
      
      <!-- Perspective Server Racks - Left Side -->
      <g stroke="#0369a1" stroke-width="2" fill="#0b1329">
        <polygon points="40,240 180,320 180,1400 40,1500" />
        <!-- Server unit slots -->
        <line x1="40" y1="400" x2="180" y2="450" stroke="#0284c7" stroke-width="1.5" />
        <line x1="40" y1="560" x2="180" y2="590" stroke="#0284c7" stroke-width="1.5" />
        <line x1="40" y1="720" x2="180" y2="730" stroke="#0284c7" stroke-width="1.5" />
        <line x1="40" y1="880" x2="180" y2="870" stroke="#0284c7" stroke-width="1.5" />
        <line x1="40" y1="1040" x2="180" y2="1010" stroke="#0284c7" stroke-width="1.5" />
        <line x1="40" y1="1200" x2="180" y2="1150" stroke="#0284c7" stroke-width="1.5" />
      </g>
      <!-- Blinking Activity LEDs Left -->
      <g fill="#10b981">
        <circle cx="90" cy="420" r="3" /><circle cx="110" cy="425" r="3" /><circle cx="130" cy="430" r="3" />
        <circle cx="90" cy="580" r="3" /><circle cx="110" cy="585" r="3" /><circle cx="130" cy="590" r="3" fill="#38bdf8" />
        <circle cx="90" cy="740" r="3" /><circle cx="110" cy="742" r="3" /><circle cx="130" cy="745" r="3" fill="#38bdf8" />
      </g>

      <!-- Perspective Server Racks - Right Side -->
      <g stroke="#0369a1" stroke-width="2" fill="#0b1329">
        <polygon points="1040,240 900,320 900,1400 1040,1500" />
        <!-- Server unit slots -->
        <line x1="1040" y1="400" x2="900" y2="450" stroke="#0284c7" stroke-width="1.5" />
        <line x1="1040" y1="560" x2="900" y2="590" stroke="#0284c7" stroke-width="1.5" />
        <line x1="1040" y1="720" x2="900" y2="730" stroke="#0284c7" stroke-width="1.5" />
        <line x1="1040" y1="880" x2="900" y2="870" stroke="#0284c7" stroke-width="1.5" />
        <line x1="1040" y1="1040" x2="900" y2="1010" stroke="#0284c7" stroke-width="1.5" />
        <line x1="1040" y1="1200" x2="900" y2="1150" stroke="#0284c7" stroke-width="1.5" />
      </g>
      <!-- Blinking Activity LEDs Right -->
      <g fill="#10b981">
        <circle cx="990" cy="420" r="3" /><circle cx="970" cy="425" r="3" /><circle cx="950" cy="430" r="3" fill="#38bdf8" />
        <circle cx="990" cy="580" r="3" /><circle cx="970" cy="585" r="3" /><circle cx="950" cy="590" r="3" />
        <circle cx="990" cy="740" r="3" /><circle cx="970" cy="742" r="3" /><circle cx="950" cy="745" r="3" fill="#38bdf8" />
      </g>

      <!-- Center Aisle Runway Floor & Overhead Cable Tray -->
      <polygon points="180,1400 900,1400 1080,1920 0,1920" fill="#040812" />
      <!-- Floor Guideline Tracks -->
      <line x1="420" y1="1400" x2="280" y2="1920" stroke="#0284c7" stroke-width="2" opacity="0.5" />
      <line x1="660" y1="1400" x2="800" y2="1920" stroke="#0284c7" stroke-width="2" opacity="0.5" />
      <!-- High-tech Overhead Cable Gantry -->
      <line x1="180" y1="320" x2="900" y2="320" stroke="#1e293b" stroke-width="10" />
      <line x1="180" y1="320" x2="900" y2="320" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="8 12" />
    </svg>`;
  }

  // 3. Holographic Lab / Cyber Workspace / Futuristic AI Lab
  if (style.includes('hologram') || style.includes('lab') || style.includes('cyber') || style.includes('quantum') || style.includes('tech')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="holoBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050814" />
          <stop offset="50%" stop-color="#0a1226" />
          <stop offset="100%" stop-color="#02040a" />
        </linearGradient>
        <pattern id="gridPattern" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#38bdf8" stroke-width="0.75" opacity="0.12" />
        </pattern>
        <radialGradient id="holoGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#02040a" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#holoBg)" />
      <rect width="${width}" height="${height}" fill="url(#gridPattern)" />
      <circle cx="540" cy="780" r="540" fill="url(#holoGlow)" />

      <!-- Floating Holographic Glass Panels in Background -->
      <g opacity="0.35">
        <!-- Floating Left Hologram Glass Widget -->
        <rect x="70" y="340" width="220" height="320" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
        <line x1="90" y1="380" x2="210" y2="380" stroke="#38bdf8" stroke-width="3" />
        <rect x="90" y="410" width="60" height="8" rx="2" fill="#0284c7" />
        <rect x="90" y="430" width="140" height="6" rx="2" fill="#334155" />
        <rect x="90" y="450" width="110" height="6" rx="2" fill="#334155" />
        <circle cx="240" cy="560" r="30" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="6 4" />

        <!-- Floating Right Hologram Neural Node Widget -->
        <rect x="790" y="380" width="220" height="340" rx="14" fill="#0f172a" stroke="#a855f7" stroke-width="2" />
        <line x1="810" y1="420" x2="930" y2="420" stroke="#a855f7" stroke-width="3" />
        <circle cx="850" cy="480" r="12" fill="#a855f7" />
        <circle cx="950" cy="480" r="8" fill="#38bdf8" />
        <circle cx="900" cy="560" r="14" fill="#6366f1" />
        <line x1="850" y1="480" x2="900" y2="560" stroke="#a855f7" stroke-width="1.5" />
        <line x1="950" y1="480" x2="900" y2="560" stroke="#38bdf8" stroke-width="1.5" />
      </g>

      <!-- Glowing Perspective Cyber Floor Grid -->
      <polygon points="0,1500 1080,1500 1080,1920 0,1920" fill="#030611" />
      <path d="M 0 1500 Q 540 1440 1080 1500" stroke="#38bdf8" stroke-width="3" fill="none" opacity="0.6" />
      <g stroke="#0284c7" stroke-width="1.5" opacity="0.3">
        <line x1="150" y1="1500" x2="0" y2="1920" />
        <line x1="360" y1="1500" x2="220" y2="1920" />
        <line x1="540" y1="1470" x2="540" y2="1920" />
        <line x1="720" y1="1500" x2="860" y2="1920" />
        <line x1="930" y1="1500" x2="1080" y2="1920" />
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

  // 5. Ensure Exact Mannequin Puppet Assets
  try {
    const { ensureExactPuppetAssets } = require('./build_exact_puppet_shapes.cjs');
    ensureExactPuppetAssets();
  } catch (err) {
    console.warn(`[Character Rig] Notice initializing exact puppet assets: ${err.message}`);
  }

  console.log(`[Character Rig] Initialized Archie SVG & PNG character assets in ${ASSETS_DIR}`);
}

/**
 * Generate a floating non-intrusive glossary translation board SVG for technical terms
 */
function generateGlossaryBoardSvg(term = '', explanation = '', width = 860, height = 180) {
  const cleanTerm = String(term || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanExpl = String(explanation || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="boardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#090d16" stop-opacity="0.94" />
        <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0.92" />
      </linearGradient>
      <filter id="hudGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#06b6d4" flood-opacity="0.3" />
      </filter>
    </defs>
    <!-- Glassmorphic Rounded Board -->
    <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="22" ry="22" fill="url(#boardGrad)" stroke="#38bdf8" stroke-width="2.5" filter="url(#hudGlow)" />
    <!-- Glowing Top Accent Line -->
    <path d="M 40 4 L ${width - 40} 4" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />
    <!-- Category Pill Badge -->
    <rect x="36" y="24" width="170" height="28" rx="14" ry="14" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5" />
    <text x="121" y="43" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5" text-anchor="middle">TECH TRANSLATION</text>
    <!-- Glossary Term (Bold Display) -->
    <text x="36" y="90" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800">${cleanTerm}</text>
    <!-- Non-Intrusive Plain English Definition -->
    <text x="36" y="132" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500">${cleanExpl}</text>
  </svg>`;
}

module.exports = {
  getMouthSvg,
  generateCharacterFrameSvg,
  generateCharacterBodySvg,
  generateSceneBackgroundSvg,
  generateGlossaryBoardSvg,
  rasterizeSvgToPng,
  getComponentSvgs,
  ensureCharacterRigAssets,
  ASSETS_DIR
};

