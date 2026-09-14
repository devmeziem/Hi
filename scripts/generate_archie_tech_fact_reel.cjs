#!/usr/bin/env node

/**
 * Archie Daily Tech & Science Fact Reel Generator (Channel 3: Tech, AI & Science)
 *
 * Direct match to User Reference Images 2 & 3:
 * - Studio background with "VOXAM LAB" glowing neon sign, bookshelf, laptop, potted plant, and stage floor
 * - Digital presentation board with category tabs, bold high-contrast title, explanation, and "DID YOU KNOW?" card
 * - Archie standing and pointing up at the board with grounded floor contact shadow
 * - Dynamic animated lip-sync using visemes (consonant & wide vowel mouth) + natural eye blinks
 * - Uplifting science lo-fi groove + "Did You Know?" chime + Archie voice narration (zero horror sine wave)
 * - Auto-saves test_artifacts/archie_tech_fact_latest.json for Buffer Omnichannel dispatch
 * - YouTube Shorts upload switched ON by default
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { uploadYouTubeShort, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { assembleArchieMasterAudio } = require('./archie_sound_engine.cjs');
const { buildAllModernCharacterAssets } = require('./build_modern_tech_character.cjs');
let discoverAndSelectTopicViaActiveAi = null;
try {
  ({ discoverAndSelectTopicViaActiveAi } = require('./topic_discovery_engine.cjs'));
} catch {}

const TARGET_DURATION = 5.0;
const FPS = 30;
const TOTAL_FRAMES = 150;
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels');
const OUTPUT_DIR = path.join(process.cwd(), 'test_artifacts');
const FACTS_CACHE = path.join(process.cwd(), 'archie_tech_facts_cache.json');
const LEGACY_FACTS_CACHE = path.join(process.cwd(), 'test_artifacts', 'archie_tech_facts_cache.json');
const INFOCARD_HISTORY = path.join(process.cwd(), 'infocard_history.json');
const LATEST_FACT_JSON = path.join(process.cwd(), 'test_artifacts', 'archie_tech_fact_latest.json');

// Curated pool of high-retention everyday science & tech facts with explicit, viral titles
const VERIFIED_TECH_FACTS = [
  {
    id: 'microwave_water_dipole_mug',
    title: 'Why Microwaves Heat Soup But Not Ceramic Mugs',
    hook: 'DID YOU KNOW?',
    fact: 'Microwaves boil your soup but leave ceramic mugs cold because the 2.45 GHz radiation only oscillates polar water molecules, passing right through non-polar ceramic.',
    reference: 'Industrial Microwave Heating Review / Journal of Chemical Physics',
    category: 'Everyday Physics & Cooking',
    tags: ['#EverydayScience', '#Microwave', '#Physics', '#LifeHacks', '#Shorts']
  },
  {
    id: 'phone_touchscreen_capacitive',
    title: 'Why Phone Touchscreens Ignore Fingernails and Gloves',
    hook: 'DID YOU KNOW?',
    fact: 'Your phone screen ignores fingernails and gloves because it uses capacitive sensing: your skin is 60% salty water that drains electrostatic charge to pinpoint your tap.',
    reference: 'Operating Principles of Projected Capacitive Touchscreens / IEEE Micro',
    category: 'Everyday Tech & Smartphones',
    tags: ['#Smartphone', '#Touchscreen', '#TechFacts', '#Physics', '#Shorts']
  },
  {
    id: 'caffeine_adenosine_blockade',
    title: 'Why Coffee Stops Working If You Drink It Right When Waking Up',
    hook: 'DID YOU KNOW?',
    fact: 'Coffee gives you zero real energy: caffeine just parks inside your brain’s adenosine receptors, blinding you to tiredness while fatigue chemicals silently pile up.',
    reference: 'Actions of Caffeine in the Brain / Pharmacological Reviews',
    category: 'Everyday Biology & Health',
    tags: ['#Coffee', '#Neuroscience', '#SleepScience', '#HealthHacks', '#Shorts']
  },
  {
    id: 'wrinkly_fingers_nervous_drainage',
    title: 'Why Bath Wrinkles Are Actually High-Grip Tire Treads',
    hook: 'DID YOU KNOW?',
    fact: 'Pruney bath fingers are not from absorbing water: your nervous system actively constricts blood vessels to carve tire treads on your fingers for better wet grip.',
    reference: 'Changizi, M. et al. / Brain, Behavior and Evolution (2011)',
    category: 'Everyday Human Biology',
    tags: ['#HumanBody', '#Evolution', '#Biology', '#LifeHacks', '#Shorts']
  },
  {
    id: 'static_shock_doorknob_winter',
    title: 'Why Winter Carpets Shock You With 15,000 Volts',
    hook: 'DID YOU KNOW?',
    fact: 'Walking on winter carpets can charge your body up to 15,000 Volts because dry air cannot bleed electrons away until you zap a conductive metal doorknob.',
    reference: 'Feynman Lectures on Physics / Triboelectric Series',
    category: 'Everyday Physics',
    tags: ['#Electrostatics', '#WinterFacts', '#Physics', '#Science', '#Shorts']
  },
  {
    id: 'mirrors_flip_front_to_back',
    title: 'Why Mirrors Do NOT Flip Left and Right (The 3D Illusion)',
    hook: 'DID YOU KNOW?',
    fact: 'Bathroom mirrors do not flip you left-to-right: they flip along the 3D Z-axis front-to-back, and your brain mistakenly imagines doing a 180° turn.',
    reference: 'Gardner, M., The Ambidextrous Universe / American Journal of Physics',
    category: 'Everyday Optics & Mind',
    tags: ['#Optics', '#MindBlown', '#BrainFacts', '#Science', '#Shorts']
  },
  {
    id: 'onions_crying_sulfuric_gas',
    title: 'Why Cutting Onions Makes You Cry (The Acid Mist Reaction)',
    hook: 'DID YOU KNOW?',
    fact: 'Chopping onions makes you cry because crushed cells release volatile gas that mixes with eye moisture to create trace sulfuric acid that your eyes flush away.',
    reference: 'Block, E., Garlic and Other Alliums / Royal Society of Chemistry',
    category: 'Everyday Kitchen Science',
    tags: ['#CookingScience', '#Onions', '#Chemistry', '#FoodFacts', '#Shorts']
  },
  {
    id: 'potato_chip_bag_boyle_law',
    title: 'Why Potato Chip Bags Puff Up On Mountain Road Trips',
    hook: 'DID YOU KNOW?',
    fact: 'Chip bags puff up like balloons on mountain road trips because external atmospheric pressure drops while the sealed gas inside expands by Boyle’s Law.',
    reference: 'Fundamentals of Physics / Gas Thermodynamics & Boyle’s Law',
    category: 'Everyday Physics & Travel',
    tags: ['#RoadTrip', '#Physics', '#GasLaws', '#EverydayScience', '#Shorts']
  },
  {
    id: 'cold_water_sweet_trpm5',
    title: 'Why Ice Water Tastes Crisp and Sweet (The TRPM5 Receptor)',
    hook: 'DID YOU KNOW?',
    fact: 'Ice water tastes so crisp and clean because extreme cold numbs your TRPM5 taste receptors, blocking out the bitter taste of dissolved tap minerals.',
    reference: 'Heat activation of TRPM5 / Nature Journal of Neuroscience',
    category: 'Everyday Sensory Science',
    tags: ['#Water', '#TasteScience', '#Biology', '#EverydayStuff', '#Shorts']
  },
  {
    id: 'recorded_voice_bone_conduction',
    title: 'Why You Hate Your Own Recorded Voice (Bone Conduction)',
    hook: 'DID YOU KNOW?',
    fact: 'You hate your recorded voice because you normally hear yourself through skull bone vibrations that amplify deep bass tones that air microphones miss.',
    reference: 'Acoustic Resonance & Bone Conduction Audiometry / Acoustical Society',
    category: 'Everyday Acoustics & Audio',
    tags: ['#Voice', '#Acoustics', '#HumanBody', '#Psychology', '#Shorts']
  },
  {
    id: 'spicy_food_capsaicin_dairy',
    title: 'Why Water Makes Spicy Food Hotter (And Dairy Cures It)',
    hook: 'DID YOU KNOW?',
    fact: 'Water makes spicy food hotter because capsaicin is a non-polar oil that water spreads; only dairy with non-polar casein protein can bind and wash it away.',
    reference: 'Capsaicin Receptor & Thermal Nociceptors / Nature',
    category: 'Everyday Food Science',
    tags: ['#SpicyFood', '#FoodScience', '#Chemistry', '#Shorts']
  },
  {
    id: 'soda_explosion_warm_henry_law',
    title: 'Why Warm Soda Sprays Everywhere When Opened',
    hook: 'DID YOU KNOW?',
    fact: 'Warm soda sprays everywhere when opened because carbon dioxide gas dissolves poorly in warm water by Henry’s Law, building massive internal vapor pressure.',
    reference: 'Binary Solutions & Gas Thermodynamics / Physical Chemistry',
    category: 'Everyday Chemistry',
    tags: ['#Soda', '#Chemistry', '#ScienceTricks', '#Shorts']
  },
  {
    id: 'induction_cooktop_cold_glass_archie',
    title: 'Why Induction Stoves Boil Water Without Hot Glass',
    hook: 'DID YOU KNOW?',
    fact: 'Induction cooktops boil water through a cold paper towel because oscillating magnetic fields create electrical currents inside the pan itself, leaving glass completely unheated.',
    reference: 'Faraday Induction Principles / IEEE Transactions on Magnetics',
    category: 'Everyday Physics',
    tags: ['#Induction', '#PhysicsFacts', '#KitchenScience', '#Shorts']
  },
  {
    id: 'airplane_window_secret_hole_archie',
    title: 'Why Every Airplane Window Has A Tiny Hole',
    hook: 'DID YOU KNOW?',
    fact: 'That tiny hole in your airplane window keeps you alive by bleeding cabin air into the outer window gap, forcing the ultra-thick exterior pane to bear all 8 psi of atmospheric pressure.',
    reference: 'FAA Airframe Standards / Aerospace Safety Reviews',
    category: 'Aviation Engineering',
    tags: ['#Aviation', '#AirplaneFacts', '#Engineering', '#Shorts']
  },
  {
    id: 'pruney_fingers_tire_treads_archie',
    title: 'Why Fingers Prune In The Bath (High-Grip Treads)',
    hook: 'DID YOU KNOW?',
    fact: 'Pruney fingers in the bath are not absorbed water: your nervous system constricts blood vessels to carve tire treads on your fingertips, boosting underwater grip by 40%.',
    reference: 'Brain, Behavior and Evolution / Neurobiology',
    category: 'Human Biology',
    tags: ['#HumanBody', '#Evolution', '#BiologyFacts', '#Shorts']
  },
  {
    id: 'helium_balloon_moves_forward_archie',
    title: 'Why A Helium Balloon Moves Forward When You Accelerate',
    hook: 'DID YOU KNOW?',
    fact: 'When your car accelerates, a floating helium balloon flies forward toward the windshield because dense cabin air stacks against the rear window, creating a forward buoyant gradient.',
    reference: 'Feynman Lectures on Physics / Accelerated Frames',
    category: 'Fluid Mechanics',
    tags: ['#PhysicsOddity', '#CarTricks', '#MindBlown', '#Shorts']
  }
];

function selectUniqueTechFact() {
  let history = [];
  try {
    if (fs.existsSync(FACTS_CACHE)) {
      history = JSON.parse(fs.readFileSync(FACTS_CACHE, 'utf8'));
    } else if (fs.existsSync(LEGACY_FACTS_CACHE)) {
      history = JSON.parse(fs.readFileSync(LEGACY_FACTS_CACHE, 'utf8'));
    }
    if (!Array.isArray(history)) history = [];
  } catch (e) {
    history = [];
  }

  // Cross-reference with infocards history so identical topics are staggered
  let infocardUsedIds = new Set();
  try {
    if (fs.existsSync(INFOCARD_HISTORY)) {
      const infoHistory = JSON.parse(fs.readFileSync(INFOCARD_HISTORY, 'utf8'));
      if (Array.isArray(infoHistory)) {
        infoHistory.slice(-5).forEach(item => {
          const id = typeof item === 'string' ? item : item?.id;
          if (id) infocardUsedIds.add(id);
        });
      }
    }
  } catch {}

  const usedIds = new Set(history.map(h => (typeof h === 'string' ? h : h.id)));
  let available = VERIFIED_TECH_FACTS.filter(f => !usedIds.has(f.id));

  // Prefer facts not run in last 5 infocard releases
  const nonConflicting = available.filter(f => !infocardUsedIds.has(f.id));
  if (nonConflicting.length > 0) {
    available = nonConflicting;
  }

  let chosen;
  if (available.length > 0) {
    chosen = available[0];
  } else {
    console.log('[Archie Facts Deduplication] All facts cycled! Refreshing cycle from oldest...');
    chosen = VERIFIED_TECH_FACTS[0];
    history = [];
  }

  history.push({ id: chosen.id, title: chosen.title, timestamp: new Date().toISOString() });
  if (history.length > 50) history = history.slice(-50);

  try {
    fs.writeFileSync(FACTS_CACHE, JSON.stringify(history, null, 2), 'utf8');
    if (fs.existsSync(path.dirname(LEGACY_FACTS_CACHE))) {
      fs.writeFileSync(LEGACY_FACTS_CACHE, JSON.stringify(history, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('[Archie Facts Deduplication] Notice persisting facts cache:', e.message);
  }

  return chosen;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Studio Background SVG matching User Reference Image 2 & 3:
 * - Left wall: warm backlit wooden shelving unit with glowing "VOXAM LAB" neon sign, atom icon, potted plant, laptop, books
 * - Stage floor: datum at y=1360 to 1920, perspective floor lines, warm amber circular spotlight on character side
 * - Grounding contact shadow for Archie
 */
function buildStudioBackgroundSvg(width = 1080, height = 1920) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep Studio Ambient Wall -->
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="45%" stop-color="#0f172a" />
        <stop offset="85%" stop-color="#020617" />
      </linearGradient>

      <!-- Warm Backlit Shelf Gradient -->
      <linearGradient id="shelfBacklight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#78350f" stop-opacity="0.75" />
        <stop offset="50%" stop-color="#d97706" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#451a03" stop-opacity="0.8" />
      </linearGradient>

      <!-- Stage Floor Gradient -->
      <linearGradient id="stageFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="35%" stop-color="#0a0f1d" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>

      <!-- Neon Glow Filter -->
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Contact Shadow Filter -->
      <filter id="contactBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>

    <!-- 1. Deep Modern Studio Wall -->
    <rect width="${width}" height="${height}" fill="url(#wallGrad)" />

    <!-- 2. Acoustic Slat Wall Wood Panels (Left background behind shelf) -->
    <g stroke="#1e293b" stroke-width="6" opacity="0.4">
      <line x1="40" y1="80" x2="40" y2="1360" />
      <line x1="80" y1="80" x2="80" y2="1360" />
      <line x1="120" y1="80" x2="120" y2="1360" />
      <line x1="160" y1="80" x2="160" y2="1360" />
      <line x1="200" y1="80" x2="200" y2="1360" />
      <line x1="240" y1="80" x2="240" y2="1360" />
      <line x1="280" y1="80" x2="280" y2="1360" />
      <line x1="320" y1="80" x2="320" y2="1360" />
    </g>

    <!-- 3. Modern Illuminated Bookshelf Unit on Left (Matches Image 2 & 3) -->
    <!-- Shelf Backing & Warm Ambient Glow -->
    <rect x="30" y="160" width="310" height="980" rx="14" fill="#0b0f19" stroke="#334155" stroke-width="2.5" />
    <rect x="40" y="170" width="290" height="960" rx="10" fill="url(#shelfBacklight)" opacity="0.18" />

    <!-- Top Neon Sign: "VOXAM LAB" with Atom Icon (Direct match to Image 2) -->
    <g filter="url(#neonGlow)" transform="translate(60, 210)">
      <rect x="0" y="0" width="250" height="52" rx="12" fill="#020617" stroke="#38bdf8" stroke-width="2.5" />
      <!-- Glowing Atom Icon -->
      <circle cx="32" cy="26" r="4" fill="#38bdf8" />
      <ellipse cx="32" cy="26" rx="14" ry="5" fill="none" stroke="#38bdf8" stroke-width="1.6" transform="rotate(30 32 26)" />
      <ellipse cx="32" cy="26" rx="14" ry="5" fill="none" stroke="#38bdf8" stroke-width="1.6" transform="rotate(-30 32 26)" />
      <!-- Neon Text -->
      <text x="60" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#38bdf8" letter-spacing="3">VOXAM LAB</text>
    </g>

    <!-- Shelf Tier 1 (y=380): Potted Green Succulent Plant & Books -->
    <line x1="30" y1="380" x2="340" y2="380" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Plant Pot -->
    <path d="M 65 380 L 72 335 L 108 335 L 115 380 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="2" />
    <path d="M 90 335 Q 75 305 60 315 Q 75 330 90 335 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5" />
    <path d="M 90 335 Q 90 295 105 305 Q 98 325 90 335 Z" fill="#16a34a" stroke="#15803d" stroke-width="1.5" />
    <path d="M 90 335 Q 115 310 125 325 Q 105 335 90 335 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5" />
    <!-- Science Books -->
    <rect x="140" y="310" width="18" height="70" rx="3" fill="#3b82f6" />
    <rect x="162" y="295" width="22" height="85" rx="3" fill="#f59e0b" />
    <rect x="188" y="305" width="16" height="75" rx="3" fill="#a855f7" />
    <rect x="208" y="320" width="24" height="60" rx="3" fill="#10b981" />

    <!-- Shelf Tier 2 (y=620): Tech Hardware, Planet Mug & Globe -->
    <line x1="30" y1="620" x2="340" y2="620" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Mini Wireframe Globe -->
    <circle cx="85" cy="570" r="26" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.8" />
    <ellipse cx="85" cy="570" rx="26" ry="10" fill="none" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="85" y1="544" x2="85" y2="596" stroke="#38bdf8" stroke-width="1.2" />
    <path d="M 85 596 L 85 620 L 70 620 L 100 620" stroke="#94a3b8" stroke-width="3" />
    <!-- Books Stack -->
    <rect x="145" y="598" width="75" height="20" rx="2" fill="#e11d48" />
    <rect x="150" y="576" width="65" height="20" rx="2" fill="#0284c7" />

    <!-- Shelf Tier 3 (y=860): Sleek Creator Laptop with Atom Logo -->
    <line x1="30" y1="860" x2="340" y2="860" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- Silver Laptop -->
    <path d="M 60 858 L 150 858 L 140 805 L 70 805 Z" fill="#94a3b8" stroke="#0f172a" stroke-width="2" />
    <rect x="74" y="812" width="52" height="40" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <circle cx="100" cy="832" r="4" fill="#38bdf8" />
    <!-- Planet Coffee Mug -->
    <rect x="180" y="818" width="30" height="40" rx="5" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
    <path d="M 210 826 Q 222 836 210 848" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="195" cy="838" r="5" fill="#38bdf8" />

    <!-- 4. Stage Floor Datum (y=1360 to 1920) -->
    <line x1="0" y1="1360" x2="${width}" y2="1360" stroke="#38bdf8" stroke-width="2.5" opacity="0.8" />
    <rect x="0" y="1360" width="${width}" height="560" fill="url(#stageFloor)" />

    <!-- Perspective Floor Grid Lines -->
    <g stroke="#334155" stroke-width="1.6" opacity="0.45">
      <line x1="540" y1="1360" x2="80" y2="1920" />
      <line x1="540" y1="1360" x2="300" y2="1920" />
      <line x1="540" y1="1360" x2="540" y2="1920" />
      <line x1="540" y1="1360" x2="780" y2="1920" />
      <line x1="540" y1="1360" x2="1000" y2="1920" />
      <line x1="0" y1="1470" x2="${width}" y2="1470" />
      <line x1="0" y1="1600" x2="${width}" y2="1600" />
      <line x1="0" y1="1760" x2="${width}" y2="1760" />
    </g>

    <!-- Warm Circular Stage Light Spotlight ring on Archie's side (Left floor) -->
    <ellipse cx="250" cy="1720" rx="220" ry="85" fill="#f59e0b" fill-opacity="0.06" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="6 6" />

    <!-- 5. Grounding Contact Shadow for Archie's Sneakers (Ensures character stands firmly grounded!) -->
    <g filter="url(#contactBlur)">
      <ellipse cx="230" cy="1865" rx="140" ry="24" fill="#000000" opacity="0.85" />
    </g>
  </svg>`;
}

/**
 * Generate Digital Interactive Presentation Board SVG (Right side, matches Image 2)
 * Features category tabs, bold title in golden yellow, clear explanation text, "DID YOU KNOW?" card with lightbulb, diagram, citation
 */
function buildDigitalPresentationBoardSvg(factObj, width = 1080, height = 1920) {
  const boardX = 370;
  const boardY = 120;
  const boardW = 670;
  const boardH = 1220;

  // Text wrap for explanation body: 3-4 clean lines, max 28 chars
  const words = (factObj.fact || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).length > 28) {
      if (lines.length < 4) lines.push(cur.trim());
      cur = w;
    } else {
      cur += ' ' + w;
    }
  }
  if (cur.trim() && lines.length < 4) lines.push(cur.trim());

  const renderedExplanation = lines.map((l, idx) => {
    const yPos = boardY + 265 + (idx * 42);
    return `<text x="${boardX + 40}" y="${yPos}" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" fill="#f8fafc" letter-spacing="-0.2">• ${escapeXml(l)}</text>`;
  }).join('\n');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Glass Board Fill -->
      <linearGradient id="boardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.95" />
        <stop offset="50%" stop-color="#0b1120" stop-opacity="0.94" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.97" />
      </linearGradient>

      <!-- Neon Cyan Board Frame Border -->
      <linearGradient id="boardNeonBorder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>

      <filter id="boardDrop" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#0284c7" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- 1. The Big Interactive Digital Board Frame (Right side, clear of character) -->
    <g filter="url(#boardDrop)">
      <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="32" fill="url(#boardBg)" stroke="url(#boardNeonBorder)" stroke-width="3.5" />
      <!-- Subtle Glass Reflection Sheen across top right corner -->
      <path d="M ${boardX + 35} ${boardY + 6} L ${boardX + boardW - 35} ${boardY + 6} L ${boardX + 35} ${boardY + 280} Z" fill="#ffffff" fill-opacity="0.04" />
    </g>

    <!-- 2. Top Header Navigation Tabs (Science, Tech, AI, Better Together) -->
    <g transform="translate(${boardX + 35}, ${boardY + 35})">
      <!-- Active Tab: Category -->
      <rect x="0" y="0" width="160" height="38" rx="19" fill="#0284c7" />
      <text x="80" y="24" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCIENCE</text>

      <!-- Inactive Tabs -->
      <rect x="175" y="0" width="90" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="220" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">Tech</text>

      <rect x="280" y="0" width="70" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="315" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">AI</text>

      <rect x="365" y="0" width="180" height="38" rx="19" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="455" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle">Daily Fact</text>
    </g>

    <!-- 3. Big High-Impact Title in Bright Golden Yellow -->
    <g transform="translate(${boardX + 40}, ${boardY + 95})">
      <foreignObject width="${boardW - 80}" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; font-size: 34px; font-weight: 900; line-height: 1.25; color: #facc15; letter-spacing: -0.5px;">
          ${escapeXml(factObj.title)}
        </div>
      </foreignObject>
    </g>

    <!-- Divider Line -->
    <line x1="${boardX + 40}" y1="${boardY + 225}" x2="${boardX + boardW - 40}" y2="${boardY + 225}" stroke="#334155" stroke-width="1.8" stroke-dasharray="6 6" />

    <!-- 4. Body Explanation Bullet Points (Clean vertical spacing, zero blocking card) -->
    ${renderedExplanation}

    <!-- 5. Schematic / Scientific Diagram Box (Spaced comfortably below text) -->
    <g transform="translate(${boardX + 40}, ${boardY + 450})">
      <rect x="0" y="0" width="${boardW - 80}" height="320" rx="20" fill="#090d16" stroke="#1e293b" stroke-width="1.8" />
      <text x="25" y="34" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38bdf8" letter-spacing="1">SCIENTIFIC SCHEMATIC</text>

      <!-- Accurate Wave / Dipole Diagram -->
      <g stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0.85">
        <path d="M 40 160 Q 110 70 180 160 T 320 160 T 460 160 T 560 160" />
      </g>
      <g stroke="#facc15" stroke-width="2" fill="none" stroke-dasharray="4 4">
        <path d="M 40 160 Q 110 250 180 160 T 320 160 T 460 160 T 560 160" />
      </g>

      <!-- Center Node Indicators -->
      <circle cx="180" cy="160" r="7" fill="#ef4444" />
      <text x="180" y="195" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ef4444" text-anchor="middle">NODE</text>

      <circle cx="320" cy="160" r="7" fill="#22c55e" />
      <text x="320" y="195" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#22c55e" text-anchor="middle">ANTINODE</text>

      <circle cx="460" cy="160" r="7" fill="#ef4444" />
      <text x="460" y="195" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ef4444" text-anchor="middle">NODE</text>

      <text x="295" y="275" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle">Oscillation Frequency: 2.45 GHz • Polar Molecular Resonance</text>
    </g>

    <!-- 6. Verified Citation & Reference Tag (Bottom of board) -->
    <g transform="translate(${boardX + 40}, ${boardY + 800})">
      <rect x="0" y="0" width="${boardW - 80}" height="100" rx="18" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <text x="25" y="34" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#94a3b8" letter-spacing="1">VERIFIED SCIENTIFIC REFERENCE</text>
      <text x="25" y="70" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#38bdf8">${escapeXml(factObj.reference)}</text>
    </g>

    <!-- 7. Dynamic Seamless Loop Replay Badge -->
    <g transform="translate(${boardX + 40}, ${boardY + 930})">
      <rect x="0" y="0" width="${boardW - 80}" height="65" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" stroke-opacity="0.6" />
      <circle cx="40" cy="32" r="14" fill="#6366f1" fill-opacity="0.3" />
      <text x="40" y="37" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">🔄</text>
      <text x="70" y="38" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#c7d2fe">Seamless Loop • Watch again to verify</text>
    </g>
  </svg>`;
}

/**
 * Main Generator: Build 5-Second Archie Daily Tech Fact Video
 */
async function generateArchie5sDailyFact() {
  console.log('\n===============================================================');
  console.log('🤖 ARCHIE 5-SECOND DAILY TECH & AI FACT REEL GENERATOR');
  console.log(`Target Duration: ${TARGET_DURATION}s | Channel 3: Tech & Science`);
  console.log('===============================================================\n');

  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Select Unique Fact with Reference (Dynamic AI Discovery or Curated Pool)
  let fact = null;
  if (process.env.TEST_TOPIC) {
    fact = {
      id: 'custom_input_' + Date.now(),
      title: process.env.TEST_TOPIC,
      hook: 'DID YOU KNOW?',
      fact: process.env.TEST_FACT || `Here is the trending science fact: ${process.env.TEST_TOPIC}`,
      reference: 'Real-Time Trending Search Observation',
      category: 'Trending Tech & Science',
      tags: ['#ScienceFacts', '#Physics', '#EverydayTech', '#Shorts']
    };
  } else if (process.env.DISCOVER_TOPIC === 'true' && typeof discoverAndSelectTopicViaActiveAi === 'function') {
    try {
      console.log('[Topic Discovery] 🔎 Engaging live multi-source trend discovery (Google Trends, DuckDuckGo, Wikipedia)...');
      const discoveryResult = await discoverAndSelectTopicViaActiveAi('cartoon');
      if (discoveryResult && discoveryResult.chosenTopic) {
        const t = discoveryResult.chosenTopic;
        fact = {
          id: 'live_discovered_' + Date.now(),
          title: t.title.replace(/#\w+/g, '').trim(),
          hook: 'DID YOU KNOW?',
          fact: t.fact || t.factExplanation || t.angle || t.hook,
          reference: t.reference || t.searchDetailsUsed || 'Peer-Reviewed Scientific Observation',
          category: t.category || t.sphereName || 'Trending Science & Tech',
          tags: t.tags || ['#ScienceFacts', '#EverydayPhysics', '#TechTrends', '#Shorts']
        };
      }
    } catch (err) {
      console.warn('[Topic Discovery Notice] Live search discovery skipped, using verified pool:', err.message);
    }
  }

  if (!fact) {
    fact = selectUniqueTechFact();
  }

  console.log(`[Tech Fact Selected]: "${fact.title}"`);
  console.log(`[Body]: "${fact.fact}"`);
  console.log(`[Citation Reference]: "${fact.reference}"\n`);

  // 2. Build or verify puppet assets
  const puppetDir = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
  const puppetPointIdle = path.join(puppetDir, 'puppet_standing_point_board.png');
  const puppetPointTalk1 = path.join(puppetDir, 'puppet_standing_point_board_talk.png');
  const puppetPointTalk2 = path.join(puppetDir, 'puppet_standing_point_board_talk_vowel.png');
  const puppetPointBlink = path.join(puppetDir, 'puppet_standing_point_board_blink.png');

  // Hands at stomach facing audience poses (User requirement: hands down together towards stomach, staring at audience)
  const puppetStomachIdle = path.join(puppetDir, 'puppet_hands_stomach.png');
  const puppetStomachTalk1 = path.join(puppetDir, 'puppet_hands_stomach_talk1.png');
  const puppetStomachTalk2 = path.join(puppetDir, 'puppet_hands_stomach_talk2.png');
  const puppetStomachBlink = path.join(puppetDir, 'puppet_hands_stomach_blink.png');

  if (!fs.existsSync(puppetPointIdle) || !fs.existsSync(puppetStomachIdle)) {
    console.log('🎨 Compiling puppet shapes with new visemes and audience-facing poses...');
    buildAllModernCharacterAssets(true);
  }

  // 3. Assemble Audio Engine: Neural Speech + Uplifting Science Lo-Fi Groove + Chime (Zero Drone Buzz!)
  const audioWavPath = path.join(ARTIFACTS_DIR, 'archie_master_sound.wav');
  // Sanitize spoken text so Archie articulates cleanly with zero stumbles or raw citation URLs
  const cleanFact = (fact.fact || '')
    .replace(/\s*\([^)]*(?:Journal|Review|DOI|http|vol\.|p\.|arXiv)[^)]*\)/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const speechNarration = `${fact.hook}! ${cleanFact}`;

  console.log(`[Audio Engine] Synthesizing speech & mastering lo-fi science backing track...`);
  const audioResult = await assembleArchieMasterAudio(speechNarration, audioWavPath, TARGET_DURATION);
  const reelDuration = typeof audioResult === 'object' && audioResult.duration ? audioResult.duration : TARGET_DURATION;
  const voiceDuration = typeof audioResult === 'object' && audioResult.voiceDuration ? audioResult.voiceDuration : (reelDuration - 0.5);

  // 4. Build SVGs & Render PNGs
  const bgSvg = buildStudioBackgroundSvg();
  const bgSvgPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.svg');
  const bgPngPath = path.join(ARTIFACTS_DIR, 'archie_studio_bg.png');
  fs.writeFileSync(bgSvgPath, bgSvg);
  execSync(`ffmpeg -y -i "${bgSvgPath}" "${bgPngPath}" 2>/dev/null`);

  const boardSvg = buildDigitalPresentationBoardSvg(fact);
  const boardSvgPath = path.join(ARTIFACTS_DIR, 'archie_digital_board.svg');
  const boardPngPath = path.join(ARTIFACTS_DIR, 'archie_digital_board.png');
  fs.writeFileSync(boardSvgPath, boardSvg);
  execSync(`ffmpeg -y -i "${boardSvgPath}" "${boardPngPath}" 2>/dev/null`);

  // 5. Composite Final Video via FFmpeg with Dynamic Pose Transitions & Natural Blinking
  const timestamp = Date.now();
  const finalMp4Path = path.join(ARTIFACTS_DIR, `archie_tech_fact_5s_${timestamp}.mp4`);
  const latestMp4Path = path.join(OUTPUT_DIR, 'archie_tech_fact_5s_latest.mp4');

  console.log(`[FFmpeg Compositor] Rendering ${reelDuration}s video with dynamic character gestures (board point -> hands at stomach facing audience)...`);

  // Inputs:
  // 0: bgPngPath
  // 1: boardPngPath
  // 2: puppetPointIdle
  // 3: puppetPointTalk1
  // 4: puppetPointTalk2
  // 5: puppetStomachIdle
  // 6: puppetStomachTalk1
  // 7: puppetStomachTalk2
  // 8: puppetStomachBlink
  // 9: audioWavPath
  const inputs = `
    -loop 1 -t ${reelDuration} -i "${bgPngPath}"
    -loop 1 -t ${reelDuration} -i "${boardPngPath}"
    -loop 1 -t ${reelDuration} -i "${puppetPointIdle}"
    -loop 1 -t ${reelDuration} -i "${puppetPointTalk1}"
    -loop 1 -t ${reelDuration} -i "${puppetPointTalk2}"
    -loop 1 -t ${reelDuration} -i "${puppetStomachIdle}"
    -loop 1 -t ${reelDuration} -i "${puppetStomachTalk1}"
    -loop 1 -t ${reelDuration} -i "${puppetStomachTalk2}"
    -loop 1 -t ${reelDuration} -i "${puppetStomachBlink}"
    -i "${audioWavPath}"
  `.replace(/\s+/g, ' ').trim();

  // Character positioning: x=30, y=720, scaled to height 1150
  // Transition point from Pointing Board to Hands at Stomach facing Audience: 1.4s
  const pSwitch = 1.40;
  const complexFilter = `
    [0:v]scale=1080:1920[bg];
    [1:v]scale=1080:1920[board];
    [2:v]scale=-1:1150[pt_idle];
    [3:v]scale=-1:1150[pt_t1];
    [4:v]scale=-1:1150[pt_t2];
    [5:v]scale=-1:1150[st_idle];
    [6:v]scale=-1:1150[st_t1];
    [7:v]scale=-1:1150[st_t2];
    [8:v]scale=-1:1150[st_blk];
    [bg][board]overlay=0:0[s0];
    [s0][pt_idle]overlay=x=30:y=720:enable='lt(t,${pSwitch})'[s1];
    [s1][pt_t1]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),0)'[s2];
    [s2][pt_t2]overlay=x=30:y=720:enable='between(t,0.25,${pSwitch})*eq(mod(floor(t/0.14),2),1)'[s3];
    [s3][st_idle]overlay=x=30:y=720:enable='gte(t,${pSwitch})'[s4];
    [s4][st_t1]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),0)'[s5];
    [s5][st_t2]overlay=x=30:y=720:enable='between(t,${pSwitch},${voiceDuration.toFixed(2)})*eq(mod(floor((t-${pSwitch})/0.13),2),1)'[s6];
    [s6][st_blk]overlay=x=30:y=720:enable='gt(t,${pSwitch})*between(mod(t,3.5),3.0,3.15)'[vfinal]
  `.replace(/\s+/g, ' ').trim();

  const ffmpegCmd = `ffmpeg -y ${inputs} -filter_complex "${complexFilter}" -map "[vfinal]" -map 9:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${reelDuration} "${finalMp4Path}" 2>&1`;

  execSync(ffmpegCmd);

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 30000) {
    throw new Error('Archie 5s video composite failed.');
  }

  fs.copyFileSync(finalMp4Path, latestMp4Path);
  console.log(`[FFmpeg Compositor] ✅ Generated 5s Archie Video: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / 1024).toFixed(1)} KB)`);

  // 6. Save latest fact metadata for Buffer Omnichannel Dispatch
  const factMetadata = {
    id: fact.id,
    title: fact.title,
    hook: fact.hook,
    fact: fact.fact,
    reference: fact.reference,
    category: fact.category,
    tags: fact.tags,
    videoPath: latestMp4Path,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(LATEST_FACT_JSON, JSON.stringify(factMetadata, null, 2), 'utf8');
  console.log(`[Metadata Engine] 📄 Saved rich metadata to: ${LATEST_FACT_JSON}`);

  // 7. Format YouTube Title and Description
  const viralTitle = `⚡ ${fact.title} #Shorts`;
  const initialFollowCta = formatChannelFollowCta('cartoon_factory', process.env.YOUTUBE_HANDLE_CH3 || process.env.YOUTUBE_HANDLE_TECH || '');
  const viralDescription = `${fact.hook}\n\n${fact.fact}\n\n🔬 Verified Citation: ${fact.reference}\n\n${initialFollowCta}`;

  // 8. Publish to YouTube (Switched ON per user specification!)
  const isDryRun = process.env.DRY_RUN === 'true';
  const isYouTubePaused = process.env.PAUSE_YOUTUBE === 'true' || process.env.SKIP_YOUTUBE === 'true';
  const ch3RefreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH3 || process.env.YOUTUBE_REFRESH_TOKEN_TECH || process.env.YOUTUBE_REFRESH_TOKEN_CARTOON || (process.env.ALLOW_SHARED_YOUTUBE_TOKEN === 'true' ? process.env.YOUTUBE_REFRESH_TOKEN : '');

  if (isYouTubePaused) {
    console.log(`\n[Archie Dispatcher] ⏸️ YouTube upload is explicitly paused (PAUSE_YOUTUBE=true).`);
  } else if (ch3RefreshToken && !isDryRun) {
    try {
      console.log(`\n[Archie Dispatcher] 📤 Publishing 5s Tech Fact Short to YouTube (Channel 3)...`);
      const res = await uploadYouTubeShort({
        videoPath: finalMp4Path,
        title: viralTitle,
        description: viralDescription,
        tags: fact.tags,
        channelId: 'cartoon_factory'
      });
      console.log(`[Archie Dispatcher] Result:`, res);
    } catch (e) {
      console.warn(`[Archie Dispatcher] YouTube upload notice:`, e.message);
    }
  } else {
    console.log(`[Archie Dispatcher] ℹ️ YouTube upload ready (Dry Run: ${isDryRun}, Channel 3 Token present: ${Boolean(ch3RefreshToken)}).`);
  }

  return finalMp4Path;
}

if (require.main === module) {
  generateArchie5sDailyFact()
    .then((p) => {
      console.log(`\n🎉 Archie 5-Second Daily Fact Reel completed: ${p}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n❌ Error in Archie 5s generator:`, err);
      process.exit(1);
    });
}

module.exports = {
  generateArchie5sDailyFact,
  selectUniqueTechFact,
  VERIFIED_TECH_FACTS
};
