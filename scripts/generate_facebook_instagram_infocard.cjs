#!/usr/bin/env node

/**
 * Facebook & Instagram In-Depth Science/Tech InfoCards & Stories Generator
 * Creates high-retention, deduplicated, crystal-clear visual knowledge graphics & captions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const INFOCARDS_DIR = path.join(ARTIFACTS_DIR, 'infocards');
const HISTORY_FILE = path.join(ARTIFACTS_DIR, 'infocard_history.json');

const IN_DEPTH_KNOWLEDGE_BASE = [
  {
    id: 'pruney_fingers_tire_treads',
    category: 'EVERYDAY HUMAN BIOLOGY',
    title: 'Why Bath Wrinkles Are Actually High-Grip Tire Treads',
    mystery: 'Why do your fingers and toes prune in the bath, but never your stomach or back?',
    mythBuster: 'Myth: Your skin absorbs water like a kitchen sponge. Fact: People with severed finger nerves never get wrinkly bath fingers!',
    mechanism: 'When wet, autonomic nerves actively trigger vasoconstriction, pulling subcutaneous tissue down to carve specialized drainage channels.',
    takeaway: 'These drainage valleys divert water droplets just like rain grooves on race car tires, boosting your wet-surface grip by nearly 40%.',
    proTip: 'If fingers on one hand fail to wrinkle in warm water, neurologists use it as a bedside test for nerve conduction health.',
    reference: 'Changizi, M. et al. / Brain, Behavior and Evolution (2011)',
    tags: ['#ScienceFacts', '#HumanBiology', '#Evolution', '#EverydayScience', '#DidYouKnow', '#ArchieExplains', '#LearnEveryday']
  },
  {
    id: 'winter_static_shock_15000v',
    category: 'EVERYDAY APPLIANCE PHYSICS',
    title: 'Why Winter Carpets Shock You With 15,000 Volts',
    mystery: 'Why does touching a cold brass doorknob in January feel like an electric cattle prod?',
    mythBuster: 'Myth: You are just naturally electric. Fact: Cold indoor radiators drop relative humidity below 20%, destroying air conductivity.',
    mechanism: 'Walking on nylon carpet strips electrons via triboelectric charging. In humid summer, water vapor leaks the charge safely away. In dry winter, you store up to 15,000 Volts on your skin.',
    takeaway: 'When your finger approaches grounded metal, the electric field ionizes air into a tiny blue plasma spark exceeding 30,000°C for nanoseconds.',
    proTip: 'Touch doorframes with a metal key or your knuckles first: the larger contact area dissipates charge with zero pain nerve stimulation!',
    reference: 'Feynman Lectures on Physics / Electrostatics & Triboelectric Series',
    tags: ['#PhysicsFacts', '#WinterScience', '#Electricity', '#DidYouKnow', '#ScienceExplained', '#EverydayHacks', '#ArchieExplains']
  },
  {
    id: 'microwave_cold_spots_standing_waves',
    category: 'KITCHEN PHYSICS & THERMODYNAMICS',
    title: 'Why Microwaves Heat Food Unevenly (And How To Fix It)',
    mystery: 'Why is the edge of your soup bowl boiling lava while the exact center is still frozen solid?',
    mythBuster: 'Myth: Microwaves heat food from the inside out. Fact: Microwaves penetrate only 1 to 2 centimeters into liquids.',
    mechanism: 'The 2.45 GHz magnetron creates 3D standing waves inside the metal box. Nodes have zero energy while antinodes have double power, creating permanent hot and cold hotspots.',
    takeaway: 'Food spinning on the carousel only cuts through circles—if food sits in a dead center node, it barely gets any direct microwave radiation.',
    proTip: 'Always shape leftover rice, pasta, or casseroles into a ring or donut with an empty center hole: heat distributes evenly in half the time!',
    reference: 'Buffler, C., Microwave Cooking and Processing / Engineering Standards',
    tags: ['#LifeHacks', '#KitchenScience', '#Physics', '#FoodScience', '#EngineeringWonders', '#ArchieExplains', '#ProTips']
  },
  {
    id: 'crying_onions_syn_propanethial',
    category: 'KITCHEN BIOCHEMISTRY',
    title: 'Why Cutting Onions Makes You Cry (The Acid Mist Reaction)',
    mystery: 'Why does slicing an onion trigger intense tears when garlic and carrots don’t?',
    mythBuster: 'Myth: The smell makes you cry. Fact: It is an airborne aerosol reaction that forms actual trace sulfuric acid on your cornea.',
    mechanism: 'Knife blades rupture plant cell vacuoles, allowing alliinase enzymes to mix with amino acid sulfoxides. This produces syn-propanethial-S-oxide gas that diffuses through the air.',
    takeaway: 'When the gas contacts tears coating your cornea, it hydrolyzes into mild sulfurous acid, triggering corneal lachrymal glands into maximum flush mode.',
    proTip: 'Chill onions in the fridge for 20 minutes or use a razor-sharp knife: cold slows enzymatic kinetics, and a sharp blade slices cells rather than crushing them!',
    reference: 'Block, E. / Royal Society of Chemistry & Nature',
    tags: ['#ChemistryInRealLife', '#CookingHacks', '#FoodChemistry', '#DidYouKnow', '#ScienceBreakdown', '#ArchieExplains']
  },
  {
    id: 'plane_cabin_taste_numbs_salt',
    category: 'AERONAUTICAL SENSORY SCIENCE',
    title: 'Why Airplane Food Tastes Bland (It’s Not The Chef’s Fault)',
    mystery: 'Why does identical pasta taste rich at home but utterly flavorless at 35,000 feet?',
    mythBuster: 'Myth: Airlines purchase cheaper ingredients. Fact: Cabin pressure and 12% desert-dry air shut down your taste buds by up to 30%.',
    mechanism: 'At 8,000 ft equivalent altitude, lower barometric pressure reduces blood oxygenation, while dry filtered air evaporates mucous layers covering olfactory receptors.',
    takeaway: 'Over 80% of perceived flavor is aroma. Furthermore, white noise above 80 decibels in the cabin selectively suppresses sweetness and salt perception while boosting savory Umami.',
    proTip: 'Airlines serve more tomato juice than beer because rich Umami in tomatoes remains completely unaffected by pressurized cabin physics!',
    reference: 'Fraunhofer Institute for Building Physics & Cornell University Sensory Study',
    tags: ['#TravelHacks', '#AviationFacts', '#SensoryScience', '#FoodFacts', '#Neuroscience', '#ArchieExplains']
  },
  {
    id: 'phone_battery_20_80_rule',
    category: 'LITHIUM-ION BATTERY CHEMISTRY',
    title: 'The Truth About Charging Your Phone Overnight (The 20-80 Rule)',
    mystery: 'Does charging your phone to 100% every night actually degrade its battery lifespan?',
    mythBuster: 'Myth: Leaving it plugged in causes overcharging explosions. Fact: Modern power IC chips halt current, but high mechanical stress persists.',
    mechanism: 'At 100% state of charge, lithium ions are crammed tightly into the graphite anode, inducing maximum mechanical lattice strain and accelerating electrolyte decomposition.',
    takeaway: 'Storing a battery at 100% state while warm generates microscopic cracks in the cathode structure, halving its total cycle count from 800 down to 400 cycles.',
    proTip: 'Keep your smartphone between 20% and 80% charge whenever possible. Enabling iOS "Clean Energy / 80% Limit" or Android "Protect Battery" can preserve peak battery health for 3+ years!',
    reference: 'Journal of The Electrochemical Society / Jeff Dahn Research Group',
    tags: ['#TechTips', '#BatteryLife', '#SmartphoneHacks', '#BatteryChemistry', '#Engineering', '#ArchieExplains']
  },
  {
    id: 'mirrors_z_axis_reflection',
    category: 'OPTICS & COGNITIVE SCIENCE',
    title: 'Why Mirrors Do NOT Flip Left and Right (The 3D Illusion)',
    mystery: 'If a mirror flips left and right, why doesn’t it flip your head and feet upside down?',
    mythBuster: 'Myth: Mirrors reverse horizontal coordinates. Fact: Mirrors do not reverse left or right AT ALL!',
    mechanism: 'Mirrors reflect photons perpendicularly along the front-to-back Z-axis. If you point north, your reflection points directly south.',
    takeaway: 'Your brain creates the left-right illusion because humans are horizontally symmetrical. You mentally imagine walking behind the glass and rotating 180° around your spine.',
    proTip: 'Hold a glove up to a mirror: the right-hand glove doesn’t turn into a left-hand glove, it turns inside out along the depth dimension!',
    reference: 'Gardner, M., The Ambidextrous Universe / American Journal of Physics',
    tags: ['#Optics', '#MindBlown', '#BrainTricks', '#PhysicsExplained', '#CognitiveScience', '#ArchieExplains']
  },
  {
    id: 'coffee_caffeine_adenosine_blocker',
    category: 'NEUROCHEMISTRY & SLEEP SCIENCE',
    title: 'Why Coffee Stops Working If You Drink It Right When Waking Up',
    mystery: 'Why do you crash at 2 PM even after downing a double espresso at 7 AM?',
    mythBuster: 'Myth: Caffeine gives you biological energy. Fact: Caffeine contains zero calories or biochemical energy—it is strictly an adenosine blocker.',
    mechanism: 'All day, brain cells consume ATP and produce adenosine (the sleep-pressure chemical). Caffeine mimics adenosine’s shape and parks in its brain receptors without activating them.',
    takeaway: 'While caffeine sits in the receptor, circulating adenosine continues to accumulate. When the liver breaks down the caffeine 4 to 6 hours later, the tidal wave of queued adenosine floods all receptors at once.',
    proTip: 'Delay your morning cup of coffee by 60 to 90 minutes after waking: your natural cortisol peak will naturally clear morning grogginess, saving caffeine’s receptor punch for later!',
    reference: 'Huberman, A. / Stanford University School of Medicine & Nature Neuroscience',
    tags: ['#CoffeeScience', '#SleepHacks', '#Neuroscience', '#Productivity', '#HealthTips', '#ArchieExplains']
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
 */
function buildPostInfocardSvg(item) {
  const width = 1080;
  const height = 1350;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0b1120" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#facc15" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="proTipGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#422006" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#713f12" stop-opacity="0.9" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Background Canvas -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Top Glow Line -->
    <rect x="0" y="0" width="${width}" height="6" fill="url(#accentGrad)" />

    <!-- Top Header Bar -->
    <g transform="translate(60, 50)">
      <!-- Channel Brand / Category Pill -->
      <rect x="0" y="0" width="340" height="42" rx="21" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.8" />
      <circle cx="24" cy="21" r="6" fill="#38bdf8" />
      <text x="42" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#38bdf8" letter-spacing="1.5">
        ${escapeXml(item.category)}
      </text>

      <!-- Brand Watermark -->
      <text x="960" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="end" letter-spacing="1">
        ARCHIE EXPLAINS • DEEP DIVE
      </text>
    </g>

    <!-- Main Title (Eye-Catching, High-Contrast) -->
    <g transform="translate(60, 140)">
      <foreignObject width="960" height="140">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; font-size: 38px; font-weight: 900; line-height: 1.25; color: #f8fafc; letter-spacing: -0.5px;">
          ${escapeXml(item.title)}
        </div>
      </foreignObject>
    </g>

    <!-- Mystery Hook Box -->
    <g transform="translate(60, 295)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="960" height="110" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
      <circle cx="45" cy="55" r="22" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5" />
      <text x="45" y="62" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#38bdf8" text-anchor="middle">?</text>
      <foreignObject x="85" y="20" width="845" height="75">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 20px; font-weight: 600; line-height: 1.4; color: #cbd5e1;">
          <strong style="color: #38bdf8;">The Everyday Mystery:</strong> ${escapeXml(item.mystery)}
        </div>
      </foreignObject>
    </g>

    <!-- Core Breakdown 3-Card Structure -->
    <!-- Card 1: Myth vs Reality -->
    <g transform="translate(60, 430)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="960" height="150" rx="20" fill="url(#cardGrad)" stroke="#ef4444" stroke-opacity="0.4" stroke-width="1.5" />
      <rect x="25" y="25" width="130" height="32" rx="16" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="1.2" />
      <text x="90" y="46" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#f87171" text-anchor="middle" letter-spacing="1">COMMON MYTH</text>
      <foreignObject x="25" y="68" width="910" height="70">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 19px; font-weight: 500; line-height: 1.45; color: #f1f5f9;">
          ${escapeXml(item.mythBuster)}
        </div>
      </foreignObject>
    </g>

    <!-- Card 2: Scientific Mechanism -->
    <g transform="translate(60, 605)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="960" height="175" rx="20" fill="url(#cardGrad)" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.5" />
      <rect x="25" y="25" width="165" height="32" rx="16" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1.2" />
      <text x="107" y="46" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1">THE MECHANISM</text>
      <foreignObject x="25" y="68" width="910" height="95">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 19px; font-weight: 500; line-height: 1.45; color: #f1f5f9;">
          ${escapeXml(item.mechanism)}
        </div>
      </foreignObject>
    </g>

    <!-- Card 3: The Practical Takeaway -->
    <g transform="translate(60, 805)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="960" height="160" rx="20" fill="url(#cardGrad)" stroke="#10b981" stroke-opacity="0.4" stroke-width="1.5" />
      <rect x="25" y="25" width="165" height="32" rx="16" fill="#059669" fill-opacity="0.2" stroke="#10b981" stroke-width="1.2" />
      <text x="107" y="46" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#34d399" text-anchor="middle" letter-spacing="1">WHY IT MATTERS</text>
      <foreignObject x="25" y="68" width="910" height="80">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 19px; font-weight: 500; line-height: 1.45; color: #f1f5f9;">
          ${escapeXml(item.takeaway)}
        </div>
      </foreignObject>
    </g>

    <!-- Pro-Tip / Practical Hack Box -->
    <g transform="translate(60, 990)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="960" height="165" rx="20" fill="url(#proTipGrad)" stroke="#facc15" stroke-opacity="0.6" stroke-width="2" />
      <rect x="25" y="22" width="135" height="32" rx="16" fill="#facc15" fill-opacity="0.2" stroke="#facc15" stroke-width="1.5" />
      <text x="92" y="43" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#facc15" text-anchor="middle" letter-spacing="1.5">⚡ PRO TIP</text>
      <foreignObject x="25" y="64" width="910" height="90">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, sans-serif; font-size: 19px; font-weight: 600; line-height: 1.45; color: #fef08a;">
          ${escapeXml(item.proTip)}
        </div>
      </foreignObject>
    </g>

    <!-- Footer Verified Citation & Engagement Bar -->
    <g transform="translate(60, 1205)">
      <!-- Citation Badge -->
      <rect x="0" y="0" width="960" height="75" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
      <text x="30" y="32" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#94a3b8" letter-spacing="1">VERIFIED CITATION</text>
      <text x="30" y="58" font-family="system-ui, sans-serif" font-size="17" font-weight="600" fill="#38bdf8">${escapeXml(item.reference)}</text>
      
      <!-- Archie Explains Sign-off -->
      <circle cx="890" cy="38" r="22" fill="#0284c7" />
      <text x="890" y="44" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">VOX</text>
      <text x="850" y="44" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#e2e8f0" text-anchor="end">Voxam Fact</text>
    </g>
  </svg>`;
}

/**
 * Generate in-depth social captions for Facebook & Instagram
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
    '#KnowledgeIsPower'
  ]));

  const facebookCaption = `⚡ ${cleanTitle.toUpperCase()}

Ever wondered about this everyday phenomenon? Here is the deep-dive science breakdown:

🔍 THE MYSTERY
${item.mystery}

❌ THE COMMON MYTH
${item.mythBuster}

🔬 HOW IT ACTUALLY WORKS
${item.mechanism}

💡 WHY IT MATTERS
${item.takeaway}

⚡ PRO TIP & PRACTICAL HACK
${item.proTip}

📚 Verified Scientific Source:
${item.reference}

👉 Follow Voxam Fact for twice-daily mind-blowing breakdowns of everyday science, tech, and human anatomy!

${hashtags.join(' ')}`;

  const instagramCaption = `⚡ ${cleanTitle.toUpperCase()}

Save this post so you don’t forget next time! 📌

🔍 The Question:
${item.mystery}

❌ The Myth:
${item.mythBuster}

🔬 The Actual Science:
${item.mechanism}

💡 The Evolution / Physics Takeaway:
${item.takeaway}

⚡ Practical Hack:
${item.proTip}

📚 Verified Citation:
${item.reference}

👉 Follow @bones_ceo for daily in-depth science & tech knowledge graphics!

${hashtags.join(' ')}`;

  return { facebookCaption, instagramCaption, cleanTitle };
}

/**
 * Main generator execution
 */
function generateDailyInfocard() {
  if (!fs.existsSync(INFOCARDS_DIR)) fs.mkdirSync(INFOCARDS_DIR, { recursive: true });

  const item = selectDeduplicatedItem();
  console.log(`[InfoCards Engine] 🎨 Generating in-depth graphic for: "${item.title}"`);

  // 1. Generate Post SVG & PNG (1080x1350)
  const postSvg = buildPostInfocardSvg(item);
  const postSvgPath = path.join(INFOCARDS_DIR, `infocard_${item.id}_post.svg`);
  const postPngPath = path.join(INFOCARDS_DIR, `infocard_${item.id}_post.png`);
  const latestPngPath = path.join(ARTIFACTS_DIR, 'infocard_latest.png');

  fs.writeFileSync(postSvgPath, postSvg, 'utf8');

  // Convert SVG to PNG using FFmpeg
  try {
    execSync(`ffmpeg -y -i "${postSvgPath}" "${postPngPath}" 2>/dev/null`);
    fs.copyFileSync(postPngPath, latestPngPath);
    console.log(`  ✅ Generated Post Card PNG: ${path.basename(postPngPath)} (${(fs.statSync(postPngPath).size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.warn('  ⚠️ FFmpeg conversion notice:', err.message);
  }

  // 2. Generate Captions & Metadata
  const captions = buildInfocardCaptions(item);
  const metadata = {
    id: item.id,
    title: item.title,
    category: item.category,
    reference: item.reference,
    tags: item.tags,
    facebookCaption: captions.facebookCaption,
    instagramCaption: captions.instagramCaption,
    imagePath: latestPngPath,
    generatedAt: new Date().toISOString()
  };

  const metadataPath = path.join(ARTIFACTS_DIR, 'infocard_latest.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`  📄 Metadata & captions saved to: ${metadataPath}`);

  return metadata;
}

if (require.main === module) {
  generateDailyInfocard();
}

module.exports = {
  generateDailyInfocard,
  IN_DEPTH_KNOWLEDGE_BASE
};
