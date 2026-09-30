/**
 * Archie Scene Compositor Engine
 *
 * Composites Archie vector puppet poses inside any of the 15 high-definition
 * classroom & laboratory environments in native 9:16 vertical (1080x1920) ratio.
 * Adds dynamic smartboard topic titles, speech bubbles, and studio lighting.
 */

const fs = require('fs');
const path = require('path');
const { getDistinctClassroomSvg, CLASSROOM_STYLES } = require('./cartoon_classrooms.cjs');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract inner puppet elements from SVG file
 */
function extractPuppetG(puppetSvgContent) {
  const rootMatch = puppetSvgContent.match(/<g id="modern_character_root"[\s\S]*?<\/g>\s*<\/svg>/);
  if (rootMatch) {
    // Return without the trailing </svg>
    return rootMatch[0].replace(/<\/svg>\s*$/, '');
  }
  // Fallback: strip <svg ...> and </svg>
  return puppetSvgContent
    .replace(/<\?xml[\s\S]*?\?>/, '')
    .replace(/<svg[\s\S]*?>/, '')
    .replace(/<\/svg>\s*$/, '');
}

/**
 * Composite Archie inside a classroom
 * @param {Object} options
 * @param {string|number} options.classroomId - ID or index of classroom (0-14)
 * @param {string} options.puppetId - e.g. 'puppet_idle', 'puppet_standing_point_board'
 * @param {string} options.topic - topic title for chalkboard / smartboard
 * @param {string} options.dialogue - dialogue speech bubble text
 * @param {string} options.position - 'left' | 'center' | 'right' | 'desk'
 * @param {number} options.scale - scale multiplier (e.g. 0.85, 1.0, 1.2)
 */
function compositeArchieScene(options = {}) {
  const {
    classroomId = 'cyber_stem',
    puppetId = 'puppet_standing_point_board',
    topic = 'Why Does Your Phone Get Hot While Charging?',
    dialogue = '',
    position = 'center',
    scale = 1.0,
    width = 1080,
    height = 1920
  } = options;

  // 1. Generate base classroom SVG
  const classroomRes = getDistinctClassroomSvg(classroomId, width, height, topic);
  let baseSvg = classroomRes.svg;

  // 2. Read puppet SVG
  let puppetInner = '';
  const puppetPath = path.join(__dirname, '..', 'cartoon_character_assets', 'exact_puppet', `${puppetId}.svg`);
  const publicPuppetPath = path.join(__dirname, '..', 'public', 'cartoon_character_assets', 'exact_puppet', `${puppetId}.svg`);
  
  const resolvedPath = fs.existsSync(puppetPath) ? puppetPath : (fs.existsSync(publicPuppetPath) ? publicPuppetPath : null);

  if (resolvedPath) {
    const rawPuppet = fs.readFileSync(resolvedPath, 'utf8');
    puppetInner = extractPuppetG(rawPuppet);
  }

  // 3. Compute coordinates for Archie in 1080x1920 vertical canvas
  let posX = 310;
  let posY = 880;
  let finalScale = 1.05 * scale;

  if (position === 'left') {
    posX = 40;
    posY = 880;
  } else if (position === 'right') {
    posX = 540;
    posY = 880;
  } else if (position === 'desk') {
    posX = 290;
    posY = 920;
    finalScale = 0.95 * scale;
  }

  // 4. Construct speech bubble if dialogue is provided
  let speechBubbleSvg = '';
  if (dialogue && dialogue.trim().length > 0) {
    const safeDialogue = escapeXml(dialogue.trim());
    const bubbleX = Math.min(Math.max(posX + 40, 80), width - 420);
    const bubbleY = Math.max(posY - 140, 220);
    const bubbleW = 380;
    const bubbleH = 110;

    speechBubbleSvg = `
    <!-- Archie Dialogue Speech Bubble -->
    <g transform="translate(${bubbleX}, ${bubbleY})" filter="drop-shadow(0 12px 24px rgba(0,0,0,0.5))">
      <!-- Bubble Background -->
      <rect x="0" y="0" width="${bubbleW}" height="${bubbleH}" rx="20" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <!-- Tail pointing down toward Archie's mouth -->
      <polygon points="120,${bubbleH} 145,${bubbleH} 100,${bubbleH + 24}" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <polygon points="122,${bubbleH - 3} 143,${bubbleH - 3} 102,${bubbleH + 21}" fill="#ffffff" />
      <!-- Speaker Tag -->
      <rect x="18" y="12" width="70" height="18" rx="5" fill="#0284c7" />
      <text x="53" y="24" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" text-anchor="middle" letter-spacing="1">ARCHIE</text>
      <!-- Dialogue Text (wrapped) -->
      <text x="18" y="52" fill="#0f172a" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" width="344">
        ${safeDialogue.length > 45 ? safeDialogue.slice(0, 42) + '...' : safeDialogue}
      </text>
      ${safeDialogue.length > 45 ? `
      <text x="18" y="76" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">
        ${safeDialogue.slice(42, 90)}
      </text>` : ''}
    </g>`;
  }

  // 5. Compose Archie puppet into the scene
  const puppetPlacementSvg = puppetInner ? `
    <!-- Composited Archie Character Puppet -->
    <g id="archie_character_layer" transform="translate(${posX}, ${posY}) scale(${finalScale})">
      ${puppetInner}
    </g>
    ${speechBubbleSvg}
  ` : '';

  // Inject before closing </svg>
  const finalSvg = baseSvg.replace(/<\/svg>\s*$/, `${puppetPlacementSvg}\n</svg>`);

  return {
    svg: finalSvg,
    classroomId: classroomRes.styleId,
    classroomName: classroomRes.styleName,
    puppetId,
    topic,
    dialogue,
    position,
    scale
  };
}

module.exports = {
  compositeArchieScene
};
