#!/usr/bin/env node

/**
 * Facebook & Instagram In-Depth Science/Tech InfoCards & Stories Generator
 * 
 * Generates beautiful, high-retention visual knowledge graphics:
 * 1. Big Card Above with "DID YOU KNOW?" fact & multi-line scientific explanation
 * 2. Full Figure of Archie with:
 *    - One hand on jaw / chin (pondering / inquisitive posture)
 *    - Other hand on waist / hip (akimbo)
 *    - One eye / eyebrow quizzically raised
 * 3. Deep-dive companion insight card from Archie
 * 4. Pure native SVG text elements (zero <foreignObject>) for 100% reliable PNG rendering
 * 5. Long-form comprehensive social captions for Facebook & Instagram
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { buildModernCharacterSVG } = require('./build_modern_tech_character.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const INFOCARDS_DIR = path.join(ARTIFACTS_DIR, 'infocards');
const HISTORY_FILE = path.join(ARTIFACTS_DIR, 'infocard_history.json');

const IN_DEPTH_KNOWLEDGE_BASE = [
  {
    id: 'pruney_fingers_tire_treads',
    category: 'EVERYDAY HUMAN BIOLOGY',
    title: 'Why Bath Wrinkles Are Actually High-Grip Tire Treads',
    hook: 'Did you know your bath wrinkles are not absorbed water?',
    mystery: 'Why do your fingers and toes prune in the bath, but never your stomach, arms, or back?',
    mythBuster: 'Myth: Skin absorbs water like a kitchen sponge. Fact: People with severed finger nerves NEVER get wrinkly fingers underwater!',
    mechanism: 'When submerged, your autonomic nervous system actively constricts subcutaneous blood vessels. This active shrinking pulls the skin inward, carving specialized drainage valleys.',
    takeaway: 'These valleys divert water away from the fingertip contact patch just like tire treads on rain-soaked highways, boosting your underwater grip by up to 40%.',
    proTip: 'If fingers on one hand fail to wrinkle in warm water, neurologists use it as a clinical bedside test for peripheral nerve health!',
    reference: 'Changizi, M. et al. / Brain, Behavior and Evolution',
    tags: ['#ScienceFacts', '#HumanBiology', '#Evolution', '#EverydayScience', '#DidYouKnow', '#ArchieExplains', '#LearnEveryday', '#VoxamFact']
  },
  {
    id: 'winter_static_shock_15000v',
    category: 'EVERYDAY APPLIANCE PHYSICS',
    title: 'Why Winter Carpets Shock You With 15,000 Volts',
    hook: 'Did you know a winter doorknob shock packs up to 15,000 Volts?',
    mystery: 'Why does touching a brass doorknob in dry winter feel like an electric cattle prod, but never happens in humid summer?',
    mythBuster: 'Myth: Cold weather creates electricity. Fact: Cold radiator heating drops indoor humidity below 20%, destroying air conductivity.',
    mechanism: 'Walking on carpet strips electrons via triboelectric contact. In summer, air moisture leaks this charge away safely. In dry winter, up to 15,000V builds up across your body.',
    takeaway: 'When your finger nears grounded metal, the massive voltage ionizes air into a microscopic 30,000°C plasma spark that snaps for nanoseconds.',
    proTip: 'Touch doorframes with a metal key or your knuckles first: the larger surface area discharges the voltage with zero pain receptors triggered!',
    reference: 'Feynman Lectures on Physics / Electrostatics & Triboelectric Charging',
    tags: ['#PhysicsFacts', '#WinterScience', '#Electricity', '#DidYouKnow', '#ScienceExplained', '#EverydayHacks', '#ArchieExplains']
  },
  {
    id: 'microwave_cold_spots_standing_waves',
    category: 'KITCHEN PHYSICS & THERMODYNAMICS',
    title: 'Why Microwaves Heat Food Unevenly (And The Simple Geometry Fix)',
    hook: 'Did you know microwaves only penetrate 1 to 2 centimeters into food?',
    mystery: 'Why is the edge of your soup bowl boiling lava while the exact center remains frozen solid?',
    mythBuster: 'Myth: Microwaves cook food from the inside out. Fact: Microwaves penetrate only 1 to 2 cm into liquids before radiation is absorbed.',
    mechanism: 'The 2.45 GHz magnetron forms 3D standing waves inside the metal chamber. Peak nodes have double energy while troughs have zero, creating fixed hot and cold spots.',
    takeaway: 'The spinning turntable cuts food through circles, but if food sits in the dead center node, it receives virtually zero direct microwave radiation.',
    proTip: 'Shape leftover pasta, rice, or stews into a ring or donut with an empty center hole: food heats evenly in half the time with zero frozen centers!',
    reference: 'Buffler, C. / Microwave Cooking & Processing Standards',
    tags: ['#KitchenScience', '#PhysicsHacks', '#LifeHacks', '#FoodScience', '#EngineeringWonders', '#ArchieExplains']
  },
  {
    id: 'crying_onions_syn_propanethial',
    category: 'KITCHEN BIOCHEMISTRY',
    title: 'Why Cutting Onions Makes You Cry (The Cornea Acid Reaction)',
    hook: 'Did you know onions make you cry by creating actual sulfuric acid on your eyes?',
    mystery: 'Why does slicing an onion trigger intense tears when garlic, potatoes, and carrots never do?',
    mythBuster: 'Myth: The pungent odor causes tears. Fact: It is an airborne aerosol reaction creating trace sulfuric acid directly on your cornea.',
    mechanism: 'Knife blades slice open plant cell vacuoles, letting alliinase enzymes react with sulfoxides. This releases syn-propanethial-S-oxide gas that rises into the air.',
    takeaway: 'When this gas touches the moisture film coating your eye, it hydrolyzes into mild sulfurous acid, triggering your lachrymal glands to flush the cornea.',
    proTip: 'Chill onions in the fridge for 20 minutes or use a razor-sharp blade: cold halts enzymatic reaction kinetics, and sharp blades slice cells instead of crushing them!',
    reference: 'Block, E. / Royal Society of Chemistry & Nature',
    tags: ['#FoodChemistry', '#CookingHacks', '#ScienceFacts', '#DidYouKnow', '#EverydayWonders', '#ArchieExplains']
  },
  {
    id: 'plane_cabin_taste_numbs_salt',
    category: 'AERONAUTICAL SENSORY SCIENCE',
    title: 'Why Airplane Food Tastes Bland (It Is Not The Chef’s Fault)',
    hook: 'Did you know flying at 35,000 feet shuts down your taste buds by up to 30%?',
    mystery: 'Why does identical gourmet pasta taste rich on the ground but utterly bland at cruising altitude?',
    mythBuster: 'Myth: Airlines cut costs with cheap ingredients. Fact: Lower cabin pressure and 12% Sahara-dry air temporarily numb human sensory receptors.',
    mechanism: 'At 8,000 ft equivalent cabin altitude, lower barometric pressure reduces blood oxygenation, while dry filtered air evaporates mucous layers covering olfactory receptors.',
    takeaway: 'Over 80% of perceived flavor is aroma. In addition, 85-decibel engine background noise selectively suppresses sweetness and salt perception while leaving Umami intact.',
    proTip: 'Airlines serve massive amounts of tomato juice because savory Umami in tomatoes remains completely unaffected by cabin pressure and engine acoustics!',
    reference: 'Fraunhofer Institute for Building Physics & Cornell University Study',
    tags: ['#AviationFacts', '#SensoryScience', '#FoodFacts', '#Neuroscience', '#TravelTips', '#ArchieExplains']
  },
  {
    id: 'phone_battery_20_80_rule',
    category: 'BATTERY CHEMISTRY & TECH',
    title: 'The Truth About Charging Overnight (The 20-80 Rule Explained)',
    hook: 'Did you know keeping your phone at 100% all night degrades its battery health?',
    mystery: 'Does leaving your smartphone plugged in on the nightstand really damage its battery lifespan?',
    mythBuster: 'Myth: Overnight charging causes fires or overcharging. Fact: Power IC chips stop current, but sustained high voltage mechanical strain ruins cells.',
    mechanism: 'At 100% state of charge, lithium ions are crammed tightly into the graphite anode, inducing maximum mechanical lattice strain and accelerating electrolyte breakdown.',
    takeaway: 'Storing cells at 100% charge while warm causes micro-cracking in the cathode structure, cutting total cycle life from 800 down to 400 recharge cycles.',
    proTip: 'Keep your smartphone between 20% and 80% charge. Enabling iOS "80% Limit" or Android "Protect Battery" can easily double your battery longevity for 3+ years!',
    reference: 'Journal of The Electrochemical Society / Jeff Dahn Research',
    tags: ['#TechHacks', '#BatteryHealth', '#SmartphoneTips', '#EngineeringFacts', '#ArchieExplains']
  },
  {
    id: 'mirrors_z_axis_reflection',
    category: 'OPTICS & COGNITIVE SCIENCE',
    title: 'Why Mirrors Do NOT Flip Left and Right (The 3D Perception Illusion)',
    hook: 'Did you know mirrors do not reverse left and right at all?',
    mystery: 'If a mirror supposedly flips left and right, why does it never flip your head and feet upside down?',
    mythBuster: 'Myth: Mirrors reverse horizontal axes. Fact: Mirrors do not reverse left or right AT ALL!',
    mechanism: 'Mirrors reflect photons perpendicularly along the front-to-back Z-axis. When you point North, your mirror reflection points directly South.',
    takeaway: 'Your brain creates the left-right illusion because humans are horizontally symmetrical. You mentally imagine rotating 180° around your spine behind the glass.',
    proTip: 'Hold a glove up to a mirror: the right-hand glove does not become a left-hand glove, it turns inside out along the depth dimension!',
    reference: 'Gardner, M., The Ambidextrous Universe / American Journal of Physics',
    tags: ['#OpticsFacts', '#MindBlown', '#BrainTricks', '#PhysicsExplained', '#ArchieExplains']
  },
  {
    id: 'coffee_caffeine_adenosine_blocker',
    category: 'NEUROCHEMISTRY & SLEEP SCIENCE',
    title: 'Why Coffee Stops Working If You Drink It Right When Waking Up',
    hook: 'Did you know caffeine contains zero biological calories or energy?',
    mystery: 'Why do you experience a brutal 2 PM afternoon crash even after drinking a double espresso at 7 AM?',
    mythBuster: 'Myth: Caffeine gives you energy. Fact: Caffeine has zero calories or metabolic energy—it is strictly an adenosine receptor antagonist.',
    mechanism: 'All day, brain cells break down ATP and produce adenosine (sleep pressure). Caffeine mimics adenosine’s shape and docks into its receptors without activating them.',
    takeaway: 'While caffeine blocks receptors, circulating adenosine continues to accumulate. When your liver clears the caffeine hours later, a tidal wave of adenosine floods in all at once.',
    proTip: 'Delay your morning coffee by 60 to 90 minutes after waking: let your natural cortisol peak clear morning sleep inertia first, preserving caffeine for the afternoon!',
    reference: 'Huberman, A. / Stanford University School of Medicine & Nature',
    tags: ['#CoffeeScience', '#SleepScience', '#Neurochemistry', '#ProductivityHacks', '#ArchieExplains']
  }
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Text wrapping helper that outputs native SVG <text> elements
 * Guaranteed to render across all SVG engines without <foreignObject> failure
 */
function renderWrappedSvgText(text, x, y, maxChars = 55, lineHeight = 28, fontSize = 20, fill = '#e2e8f0', fontWeight = '400') {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.map((line, i) => 
    `<text x="${x}" y="${y + i * lineHeight}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeXml(line)}</text>`
  ).join('\n');
}

/**
 * Select a deduplicated knowledge item
 */
function selectDeduplicatedItem() {
  let history = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      if (!Array.isArray(history)) history = [];
    }
  } catch {}

  const recentIds = new Set(history.slice(-6));
  const available = IN_DEPTH_KNOWLEDGE_BASE.filter(item => !recentIds.has(item.id));
  const selected = available.length > 0 ? available[0] : IN_DEPTH_KNOWLEDGE_BASE[0];

  history.push(selected.id);
  if (history.length > 30) history = history.slice(-30);
  try {
    if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch {}

  return selected;
}

/**
 * Build 1080x1350 High-Resolution Post InfoCard SVG
 * Features:
 * - Clean dark aesthetic, not too colorful, no tacky gradients
 * - Big Card Above with DID YOU KNOW? fact and long explanatory text
 * - Figure of Archie below: hands on jaw, other hand akimbo on waist, one eye slightly raised
 * - Companion insight card beside Archie
 */
function buildPostInfocardSvg(item) {
  const width = 1080;
  const height = 1350;

  // Generate Archie in the exact requested pose: akimbo_jaw (one hand on jaw, other on waist akimbo, one eyebrow raised)
  const archieRawSvg = buildModernCharacterSVG('akimbo_jaw', { mouth: 'closed', eye: 'raised_right' });
  // Extract the root group of Archie from the SVG
  const archieMatch = archieRawSvg.match(/<g id="modern_character_root">([\s\S]*?)<\/g>\s*<\/svg>/);
  const archieInnerContent = archieMatch ? archieMatch[1] : '';

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Clean Obsidian Canvas Background -->
  <rect width="${width}" height="${height}" fill="#090d16" />
  
  <!-- Subtle Framing Border -->
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="20" fill="none" stroke="#1e293b" stroke-width="2" />

  <!-- Top Category & Brand Bar -->
  <!-- Category Pill -->
  <rect x="50" y="40" width="360" height="38" rx="19" fill="#0f172a" stroke="#38bdf8" stroke-width="1.8" />
  <circle cx="72" cy="59" r="5" fill="#38bdf8" />
  <text x="88" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#38bdf8" letter-spacing="1.2">
    ${escapeXml(item.category)}
  </text>

  <!-- Brand Signature -->
  <text x="1030" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#94a3b8" text-anchor="end" letter-spacing="1">
    VOXAM FACT • ARCHIE EXPLAINS
  </text>

  <!-- ================================================================= -->
  <!-- BIG CARD ABOVE: THE "DID YOU KNOW?" FACT & IN-DEPTH EXPLANATION   -->
  <!-- ================================================================= -->
  <g transform="translate(50, 95)" filter="url(#softShadow)">
    <!-- Main Card Body -->
    <rect x="0" y="0" width="980" height="570" rx="20" fill="#101726" stroke="#38bdf8" stroke-width="2" />

    <!-- Card Header Badge: DID YOU KNOW? -->
    <rect x="30" y="26" width="220" height="38" rx="10" fill="#facc15" />
    <text x="140" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">
      💡 DID YOU KNOW?
    </text>

    <!-- Post Title / Main Headline -->
    ${renderWrappedSvgText(item.title, 30, 105, 48, 38, 28, '#ffffff', '800')}

    <!-- Divider -->
    <line x1="30" y1="185" x2="950" y2="185" stroke="#1e293b" stroke-width="2" />

    <!-- Long Explanatory Text: Mystery, Mechanism & Practical Impact -->
    <!-- Section 1: The Common Myth vs Reality -->
    <text x="30" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#f87171" letter-spacing="1">
      ❌ THE COMMON MYTH
    </text>
    ${renderWrappedSvgText(item.mythBuster, 30, 248, 72, 26, 18, '#e2e8f0', '400')}

    <!-- Section 2: The Biological / Physical Mechanism -->
    <text x="30" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#38bdf8" letter-spacing="1">
      🔬 THE SCIENTIFIC MECHANISM
    </text>
    ${renderWrappedSvgText(item.mechanism, 30, 353, 72, 26, 18, '#e2e8f0', '400')}

    <!-- Section 3: Why It Matters & Evolutionary Purpose -->
    <text x="30" y="435" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#4ade80" letter-spacing="1">
      ⚡ WHY IT MATTERS
    </text>
    ${renderWrappedSvgText(item.takeaway, 30, 463, 72, 26, 18, '#e2e8f0', '400')}

    <!-- Citation Footer along bottom of Card -->
    <line x1="30" y1="520" x2="950" y2="520" stroke="#1e293b" stroke-width="1.5" />
    <text x="30" y="546" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#94a3b8">
      📚 Verified Peer-Reviewed Source: <tspan fill="#38bdf8">${escapeXml(item.reference)}</tspan>
    </text>
  </g>

  <!-- ================================================================= -->
  <!-- LOWER SECTION: FIGURE OF ARCHIE & COMPANION INSIGHT CARD          -->
  <!-- ================================================================= -->
  <!-- Figure of Archie (Left Side): Hand on Jaw, Hand on Waist, Eyebrow Raised -->
  <g id="archie_character_figure" transform="translate(10, 680) scale(0.66)">
    <!-- Clip path to keep legs clean at canvas bottom -->
    ${archieInnerContent}
  </g>

  <!-- Companion Insight Card (Right of Archie) -->
  <g transform="translate(430, 690)" filter="url(#softShadow)">
    <rect x="0" y="0" width="600" height="610" rx="20" fill="#101726" stroke="#334155" stroke-width="2" />

    <!-- Card Header Pill -->
    <rect x="30" y="28" width="280" height="36" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
    <text x="45" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#38bdf8" letter-spacing="1">
      🧠 ARCHIE'S SCIENCE BREAKDOWN
    </text>

    <!-- Deep-Dive Breakdown Text -->
    <text x="30" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#facc15" letter-spacing="1">
      💡 THE EVERYDAY MYSTERY
    </text>
    ${renderWrappedSvgText(item.mystery, 30, 128, 44, 26, 18, '#cbd5e1', '500')}

    <!-- Pro Tip / Practical Hack -->
    <rect x="30" y="210" width="540" height="155" rx="12" fill="#0f172a" stroke="#facc15" stroke-width="1.5" />
    <text x="50" y="242" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#facc15" letter-spacing="1">
      ⚡ PRO TIP &amp; CLINICAL TEST:
    </text>
    ${renderWrappedSvgText(item.proTip, 50, 274, 42, 25, 17, '#fef08a', '500')}

    <!-- Engagement & Community Call To Action -->
    <rect x="30" y="390" width="540" height="185" rx="12" fill="#0b1120" stroke="#1e293b" stroke-width="1.5" />
    
    <text x="50" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#ffffff">
      💬 What everyday mystery should Archie explain next?
    </text>
    <text x="50" y="455" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" fill="#94a3b8">
      Drop your theories and questions in the comments below!
    </text>

    <!-- Follow & Save Bar -->
    <line x1="50" y1="485" x2="520" y2="485" stroke="#1e293b" stroke-width="1" />
    
    <rect x="50" y="505" width="220" height="42" rx="8" fill="#0284c7" />
    <text x="160" y="531" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">
      👉 Follow @bones_ceo
    </text>

    <rect x="285" y="505" width="235" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="402" y="531" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#e2e8f0" text-anchor="middle">
      📌 Save for Reference
    </text>
  </g>
</svg>`;
}

/**
 * Generate in-depth social captions for Facebook & Instagram
 * Includes full multi-paragraph educational breakdown with zero character truncation
 */
function buildInfocardCaptions(item) {
  const cleanTitle = item.title.trim();
  const hashtags = Array.from(new Set([
    ...item.tags,
    '#VoxamFact',
    '#BonesCeo',
    '#ScienceExplained',
    '#EverydayWonders',
    '#Infographic',
    '#KnowledgeIsPower',
    '#STEM'
  ])).join(' ');

  const fbCaption = `${cleanTitle} 💡

${item.hook}

🔍 THE EVERYDAY MYSTERY:
${item.mystery}

❌ COMMON MYTH:
${item.mythBuster}

🔬 THE SCIENTIFIC MECHANISM:
${item.mechanism}

⚡ WHY IT MATTERS:
${item.takeaway}

💡 PRO TIP / CLINICAL HACK:
${item.proTip}

📚 Verified Citation:
${item.reference}

💬 What everyday science mystery should Archie explain next? Tell us in the comments!
👉 Follow Voxam Fact & @bones_ceo for daily mind-expanding facts!
📌 Save this post so you have it ready next time!

${hashtags}`;

  const igCaption = `${cleanTitle} 💡

${item.hook}

🔍 The Mystery:
${item.mystery}

❌ The Myth:
${item.mythBuster}

🔬 How It Actually Works:
${item.mechanism}

⚡ Why Evolution Did This:
${item.takeaway}

💡 Pro Tip:
${item.proTip}

📚 Verified Source: ${item.reference}

💬 Have you ever noticed this in everyday life? Drop your thoughts below!
👉 Follow @bones_ceo & Voxam Fact for daily science breakdowns!
📌 Tap the ribbon to save this knowledge card!

.
.
${hashtags}`;

  return { fbCaption, igCaption };
}

/**
 * Main execution function
 */
async function generateDailyInfocard() {
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  if (!fs.existsSync(INFOCARDS_DIR)) fs.mkdirSync(INFOCARDS_DIR, { recursive: true });

  const item = selectDeduplicatedItem();
  console.log(`\n[InfoCard Factory] 🎨 Selected Topic: "${item.title}" [Category: ${item.category}]`);

  const svgContent = buildPostInfocardSvg(item);
  const svgPath = path.join(INFOCARDS_DIR, `infocard_${item.id}.svg`);
  const pngPath = path.join(INFOCARDS_DIR, `infocard_${item.id}.png`);
  const latestSvg = path.join(ARTIFACTS_DIR, 'infocard_latest.svg');
  const latestPng = path.join(ARTIFACTS_DIR, 'infocard_latest.png');
  const manifestPath = path.join(ARTIFACTS_DIR, 'infocard_manifest.json');

  fs.writeFileSync(svgPath, svgContent);
  fs.writeFileSync(latestSvg, svgContent);

  console.log(`[InfoCard Factory] 🖼️ Converting SVG to 1080x1350 High-Resolution PNG via FFmpeg...`);
  const ffmpegCmd = `ffmpeg -y -i "${svgPath}" -vf "scale=1080:1350" "${pngPath}" 2>&1`;
  try {
    execSync(ffmpegCmd);
  } catch (err) {
    console.error('[InfoCard Factory] FFmpeg render error:', err.message);
    throw err;
  }

  if (!fs.existsSync(pngPath) || fs.statSync(pngPath).size < 10000) {
    throw new Error('InfoCard PNG generation produced an empty or invalid image.');
  }

  fs.copyFileSync(pngPath, latestPng);
  console.log(`[InfoCard Factory] ✅ Successfully generated PNG: ${pngPath} (${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB)`);

  const { fbCaption, igCaption } = buildInfocardCaptions(item);

  const manifest = {
    id: item.id,
    title: item.title,
    category: item.category,
    generatedAt: new Date().toISOString(),
    pngPath: latestPng,
    svgPath: latestSvg,
    fbCaption,
    igCaption,
    tags: item.tags
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[InfoCard Factory] 📝 Manifest & captions saved to: ${manifestPath}`);

  return manifest;
}

module.exports = {
  IN_DEPTH_KNOWLEDGE_BASE,
  buildPostInfocardSvg,
  buildInfocardCaptions,
  generateDailyInfocard
};

if (require.main === module) {
  generateDailyInfocard().catch(err => {
    console.error('Fatal error generating infocard:', err);
    process.exit(1);
  });
}
