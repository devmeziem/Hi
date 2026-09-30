/**
 * Archie Scene & Environment Vector Compositor
 *
 * Deterministically composites:
 * 1. Background (any of the 15 distinct classroom/laboratory environments)
 * 2. Information Screen / Presentation HUD (with custom title, text, and diagram)
 * 3. Animated Archie character (pose, eye direction, Preston Blair mouth phoneme, scale, position)
 */

export interface SceneCompositeOptions {
  classroomId: string;
  pose: 'point_right' | 'point_left' | 'thinking' | 'talking' | 'excitement' | 'idle';
  phoneme: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  screenTitle?: string;
  screenText?: string;
  screenBadge?: string;
  archiePosition?: 'left' | 'center' | 'right';
  eyesClosed?: boolean;
}

export function getMouthSvg(shape: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): string {
  const LIP_UPPER = '#c77864';
  const LIP_LOWER = '#dc8a75';
  const LIP_CONTOUR = '#5c2417';
  const MOUTH_CAVITY = '#350b12';
  const TEETH_WHITE = '#f8fafc';
  const TONGUE_PINK = '#e26274';

  switch (shape) {
    case 'A': // Closed / Rest (P, B, M)
      return `<path d="M 22 50 Q 50 48 78 50" stroke="${LIP_CONTOUR}" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <path d="M 30 49 Q 50 45 70 49" stroke="${LIP_UPPER}" stroke-width="1.8" fill="none" />
              <path d="M 34 52 Q 50 55 66 52" stroke="${LIP_LOWER}" stroke-width="1.8" fill="none" />`;
    case 'B': // Slightly Open (S, T, D, N)
      return `<path d="M 24 49 C 24 44, 76 44, 76 49 C 76 56, 24 56, 24 49 Z" fill="${MOUTH_CAVITY}" stroke="${LIP_CONTOUR}" stroke-width="2" />
              <rect x="30" y="46" width="40" height="4" fill="${TEETH_WHITE}" rx="1" />
              <path d="M 26 47 Q 50 43 74 47" stroke="${LIP_UPPER}" stroke-width="1.8" fill="none" />
              <path d="M 30 54 Q 50 57 70 54" stroke="${LIP_LOWER}" stroke-width="1.8" fill="none" />`;
    case 'C': // Wide Open (AH, AA)
      return `<path d="M 22 47 C 22 36, 78 36, 78 47 C 78 66, 22 66, 22 47 Z" fill="${MOUTH_CAVITY}" stroke="${LIP_CONTOUR}" stroke-width="2.2" />
              <path d="M 32 42 Q 50 46 68 42 L 66 45 Q 50 48 34 45 Z" fill="${TEETH_WHITE}" />
              <ellipse cx="50" cy="59" rx="16" ry="6" fill="${TONGUE_PINK}" />
              <path d="M 26 43 Q 50 38 74 43" stroke="${LIP_UPPER}" stroke-width="2" fill="none" />
              <path d="M 28 64 Q 50 67 72 64" stroke="${LIP_LOWER}" stroke-width="2" fill="none" />`;
    case 'D': // Smile / Teeth Exposed (EE, I)
      return `<path d="M 20 48 Q 50 44 80 48 Q 50 62 20 48 Z" fill="${MOUTH_CAVITY}" stroke="${LIP_CONTOUR}" stroke-width="2" />
              <path d="M 24 48 Q 50 46 76 48 L 74 53 Q 50 55 26 53 Z" fill="${TEETH_WHITE}" />
              <path d="M 22 47 Q 50 43 78 47" stroke="${LIP_UPPER}" stroke-width="1.8" fill="none" />
              <path d="M 26 59 Q 50 63 74 59" stroke="${LIP_LOWER}" stroke-width="2" fill="none" />`;
    case 'E': // Rounded (OO, W)
      return `<ellipse cx="50" cy="50" rx="15" ry="14" fill="${MOUTH_CAVITY}" stroke="${LIP_CONTOUR}" stroke-width="2.2" />
              <ellipse cx="50" cy="50" rx="9" ry="8" fill="#1f070b" />`;
    case 'F': // Lip Tuck (F, V)
    default:
      return `<path d="M 24 48 Q 50 43 76 48 L 72 53 Q 50 56 28 53 Z" fill="${TEETH_WHITE}" stroke="${LIP_CONTOUR}" stroke-width="1.5" />
              <path d="M 22 53 Q 50 57 78 53" stroke="${LIP_LOWER}" stroke-width="3" stroke-linecap="round" fill="none" />`;
  }
}

/**
 * Builds the Archie 2D Vector Character
 */
export function buildArchieCharacter(
  pose: 'point_right' | 'point_left' | 'thinking' | 'talking' | 'excitement' | 'idle' = 'point_right',
  phoneme: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'B',
  eyesClosed: boolean = false
): string {
  let leftPupilX = 510;
  let rightPupilX = 570;
  let pupilY = 720;
  let eyeScaleY = 1.0;

  if (pose === 'point_right') {
    leftPupilX = 525;
    rightPupilX = 585;
  } else if (pose === 'point_left') {
    leftPupilX = 495;
    rightPupilX = 555;
  } else if (pose === 'thinking') {
    pupilY = 705;
    leftPupilX = 515;
    rightPupilX = 575;
  }

  let leftArmSvg = `<path d="M 430 920 Q 380 1020 370 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                    <circle cx="370" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  let rightArmSvg = `<path d="M 650 920 Q 700 1020 710 1150" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                     <circle cx="710" cy="1160" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;

  if (pose === 'point_right') {
    rightArmSvg = `<path d="M 650 920 Q 740 905 840 850" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <circle cx="840" cy="850" r="24" fill="#fbcfe8" stroke="#1e293b" stroke-width="3" />
                   <path d="M 850 844 Q 868 836 876 832" stroke="#fbcfe8" stroke-width="18" stroke-linecap="round" />
                   <path d="M 850 844 Q 868 836 876 832" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none" />`;
  } else if (pose === 'point_left') {
    leftArmSvg = `<path d="M 430 920 Q 340 905 240 850" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                  <circle cx="240" cy="850" r="24" fill="#fbcfe8" stroke="#1e293b" stroke-width="3" />
                  <path d="M 230 844 Q 212 836 204 832" stroke="#fbcfe8" stroke-width="18" stroke-linecap="round" />
                  <path d="M 230 844 Q 212 836 204 832" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none" />`;
  } else if (pose === 'thinking') {
    rightArmSvg = `<path d="M 650 920 Q 720 980 620 840" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <circle cx="600" cy="820" r="30" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  } else if (pose === 'excitement') {
    leftArmSvg = `<path d="M 430 920 Q 320 800 310 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                  <circle cx="310" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
    rightArmSvg = `<path d="M 650 920 Q 760 800 770 680" stroke="#2563eb" stroke-width="48" stroke-linecap="round" fill="none" />
                   <circle cx="770" cy="670" r="28" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" />`;
  }

  const eyesSvg = eyesClosed
    ? `<path d="M 480 720 Q 505 735 530 720" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />
       <path d="M 550 720 Q 575 735 600 720" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none" />`
    : `<ellipse cx="505" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
       <ellipse cx="575" cy="715" rx="30" ry="${34 * eyeScaleY}" fill="#ffffff" stroke="#1e293b" stroke-width="4.5" />
       <circle cx="${leftPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
       <circle cx="${leftPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />
       <circle cx="${rightPupilX}" cy="${pupilY}" r="14" fill="#0f172a" />
       <circle cx="${rightPupilX - 4}" cy="${pupilY - 4}" r="5" fill="#ffffff" />`;

  return `
    <g id="archie_character_rig">
      <!-- Legs & Shadow -->
      <ellipse cx="540" cy="1580" rx="320" ry="45" fill="#020617" opacity="0.6" />
      <path d="M 460 1200 L 440 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <path d="M 620 1200 L 640 1520" stroke="#1e293b" stroke-width="52" stroke-linecap="round" />
      <ellipse cx="420" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
      <ellipse cx="660" cy="1540" rx="55" ry="24" fill="#dc2626" stroke="#1e293b" stroke-width="4" />
      
      <!-- Torso / Signature Cobalt Blue Hoodie -->
      <path d="M 410 880 C 410 880, 380 1220, 420 1240 L 660 1240 C 700 1220, 670 880, 670 880 Z" fill="#2563eb" stroke="#1e293b" stroke-width="5" />
      <path d="M 460 1080 Q 540 1140 620 1080 L 600 1180 L 480 1180 Z" fill="#1d4ed8" stroke="#1e293b" stroke-width="4" />
      
      <!-- Arms -->
      ${leftArmSvg}
      ${rightArmSvg}

      <!-- Head Base -->
      <rect x="510" y="810" width="60" height="80" fill="#fbcfe8" stroke="#1e293b" stroke-width="4" rx="8" />
      <ellipse cx="540" cy="710" rx="140" ry="155" fill="#fce7f3" stroke="#1e293b" stroke-width="6" />
      <!-- Hair -->
      <path d="M 400 680 C 400 520, 520 490, 680 570 C 680 570, 690 670, 680 700 C 650 560, 520 540, 420 620 Z" fill="#3b2d23" stroke="#1e293b" stroke-width="5" />
      <path d="M 520 510 Q 550 430 580 470 Q 550 490 540 520" fill="#3b2d23" stroke="#1e293b" stroke-width="4" />
      
      <!-- Eyebrows -->
      <path d="M 470 650 Q 510 635 535 655" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M 545 655 Q 570 635 610 650" stroke="#1e293b" stroke-width="8" stroke-linecap="round" fill="none" />

      <!-- Eyes -->
      ${eyesSvg}

      <!-- Nose -->
      <path d="M 536 745 Q 546 760 536 770" stroke="#f472b6" stroke-width="5" stroke-linecap="round" fill="none" />

      <!-- Animated Mouth (Preston Blair Phoneme: ${phoneme}) -->
      <g transform="translate(490, 755)">
        ${getMouthSvg(phoneme)}
      </g>
    </g>
  `;
}

/**
 * Builds the In-Room Presentation Screen HUD
 */
export function buildPresentationScreen(
  title: string = 'WHY PHONES GET HOT',
  text: string = 'Electrical resistance transforms charging wattage into heat.',
  badge: string = 'ARCHIE EXPLAINS',
  position: 'left' | 'center' | 'right' = 'left'
): string {
  const x = position === 'left' ? 80 : position === 'right' ? 440 : 120;
  const width = position === 'center' ? 840 : 540;

  return `
    <!-- Presentation Screen HUD -->
    <g transform="translate(${x}, 220)">
      <rect width="${width}" height="380" rx="24" fill="#090d16" stroke="#06b6d4" stroke-width="4" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.6))" opacity="0.95" />
      
      <!-- Header Badge -->
      <rect x="30" y="30" width="180" height="34" rx="8" fill="#083344" stroke="#0891b2" stroke-width="1.5" />
      <text x="42" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#38bdf8" letter-spacing="1">${escapeXml(badge)}</text>

      <!-- Main Headline -->
      <text x="30" y="115" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff">${escapeXml(title)}</text>

      <!-- Explanation Body -->
      <foreignObject x="30" y="140" width="${width - 60}" height="180">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 18px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">
          ${escapeXml(text)}
        </div>
      </foreignObject>

      <!-- Subtle Cyber Grid in Screen Corner -->
      <g stroke="#0891b2" stroke-width="1" opacity="0.3">
        <line x1="${width - 120}" y1="330" x2="${width - 30}" y2="330" />
        <line x1="${width - 120}" y1="345" x2="${width - 30}" y2="345" />
        <circle cx="${width - 40}" cy="330" r="3" fill="#38bdf8" />
      </g>
    </g>
  `;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Master Scene Compositor
 */
export function buildCompositeSceneSvg(options: SceneCompositeOptions): string {
  const {
    classroomId = 'cyber_stem',
    pose = 'point_right',
    phoneme = 'B',
    screenTitle = 'WHY PHONES GET HOT',
    screenText = 'Electrical resistance transforms charging wattage into heat.',
    screenBadge = 'ARCHIE EXPLAINS',
    archiePosition = 'right',
    eyesClosed = false
  } = options;

  // Archie placement coordinates
  let archieTransform = 'translate(60, 220) scale(0.92)';
  let screenPlacement: 'left' | 'center' | 'right' = 'left';

  if (archiePosition === 'left') {
    archieTransform = 'translate(-180, 220) scale(0.92)';
    screenPlacement = 'right';
  } else if (archiePosition === 'center') {
    archieTransform = 'translate(-40, 260) scale(0.85)';
    screenPlacement = 'center';
  }

  // Pick backdrop
  const backgroundSvg = getBackgroundSvg(classroomId);
  const screenSvg = buildPresentationScreen(screenTitle, screenText, screenBadge, screenPlacement);
  const characterSvg = buildArchieCharacter(pose, phoneme, eyesClosed);

  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <!-- 1. Background Environment -->
    ${backgroundSvg}

    <!-- 2. Presentation HUD Screen -->
    ${screenSvg}

    <!-- 3. Archie Character Rig -->
    <g transform="${archieTransform}">
      ${characterSvg}
    </g>
  </svg>`;
}

function getBackgroundSvg(classroomId: string): string {
  // Safe vector classroom backgrounds
  switch (classroomId) {
    case 'robotics_garage':
      return `<rect width="1080" height="1920" fill="#0f172a" />
        <rect x="80" y="160" width="920" height="420" rx="16" fill="#1e293b" stroke="#475569" stroke-width="4" />
        <text x="120" y="210" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#f59e0b">ROBOTICS &amp; CYBERNETICS WORKSHOP // ARCHIE LAB 06</text>
        <rect x="0" y="1320" width="1080" height="600" fill="#1e293b" />
        <line x1="0" y1="1320" x2="1080" y2="1320" stroke="#f59e0b" stroke-width="6" />`;
    case 'particle_collider':
      return `<rect width="1080" height="1920" fill="#030712" />
        <circle cx="540" cy="700" r="420" fill="#0f172a" stroke="#0284c7" stroke-width="12" />
        <circle cx="540" cy="700" r="340" fill="#030712" stroke="#38bdf8" stroke-width="6" stroke-dasharray="14 10" />
        <text x="540" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#38bdf8">CERN SYNCHROTRON BEAMLINE // ARCHIE LAB 07</text>
        <rect x="0" y="1360" width="1080" height="560" fill="#090d16" />
        <line x1="0" y1="1360" x2="1080" y2="1360" stroke="#0284c7" stroke-width="4" />`;
    case 'zero_g_station':
      return `<rect width="1080" height="1920" fill="#030712" />
        <ellipse cx="540" cy="500" rx="460" ry="340" fill="#0284c7" opacity="0.3" stroke="#e2e8f0" stroke-width="16" />
        <text x="540" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#f8fafc">ORBITAL SPACE STATION ISS // ARCHIE LAB 09</text>
        <rect x="0" y="1380" width="1080" height="540" fill="#0f172a" />
        <line x1="0" y1="1380" x2="1080" y2="1380" stroke="#38bdf8" stroke-width="4" />`;
    case 'quantum_vault':
      return `<rect width="1080" height="1920" fill="#020617" />
        <text x="540" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#eab308">QUANTUM COMPUTING CRYOGENIC VAULT // ARCHIE LAB 10</text>
        <g transform="translate(360, 200)">
          <rect x="120" y="0" width="80" height="120" fill="#ca8a04" />
          <rect x="80" y="120" width="160" height="40" rx="6" fill="#eab308" />
          <rect x="40" y="200" width="240" height="35" rx="6" fill="#facc15" />
        </g>
        <rect x="0" y="1360" width="1080" height="560" fill="#090d16" />
        <line x1="0" y1="1360" x2="1080" y2="1360" stroke="#eab308" stroke-width="4" />`;
    case 'ivy_hall':
      return `<rect width="1080" height="1920" fill="#2d1810" />
        <rect x="80" y="180" width="920" height="520" rx="16" fill="#1b4332" stroke="#b45309" stroke-width="10" />
        <text x="540" y="140" text-anchor="middle" font-family="serif" font-weight="bold" font-size="30" fill="#fef3c7">HARVARD AMPHITHEATER // ARCHIE LAB 02</text>
        <rect x="0" y="1340" width="1080" height="580" fill="#3e1f13" />
        <line x1="0" y1="1340" x2="1080" y2="1340" stroke="#b45309" stroke-width="8" />`;
    case 'chem_lab':
      return `<rect width="1080" height="1920" fill="#0f172a" />
        <text x="540" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#10b981">CHEMISTRY &amp; BIOLOGY DISCOVERY LAB // ARCHIE LAB 05</text>
        <rect x="0" y="1360" width="1080" height="560" fill="#1e293b" />
        <line x1="0" y1="1360" x2="1080" y2="1360" stroke="#059669" stroke-width="4" />`;
    case 'cyber_stem':
    default:
      return `<rect width="1080" height="1920" fill="#020617" />
        <g stroke="#0ea5e9" stroke-width="2" opacity="0.35" fill="none">
          <path d="M 60 100 L 180 100 L 260 220 L 260 600" />
          <path d="M 800 80 L 920 80 L 980 180 L 980 500" />
        </g>
        <text x="540" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#38bdf8">FUTURISTIC CYBER STEM LAB // ARCHIE LAB 01</text>
        <rect x="0" y="1360" width="1080" height="560" fill="#0b0f19" />
        <line x1="0" y1="1360" x2="1080" y2="1360" stroke="#38bdf8" stroke-width="4" />`;
  }
}
