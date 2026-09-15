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
const HISTORY_FILE = path.join(process.cwd(), 'infocard_history.json');
const LEGACY_HISTORY_FILE = path.join(ARTIFACTS_DIR, 'infocard_history.json');
const ARCHIE_FACTS_CACHE = path.join(process.cwd(), 'archie_tech_facts_cache.json');

const IN_DEPTH_KNOWLEDGE_BASE = [
  {
    id: 'pruney_fingers_tire_treads',
    category: 'EVERYDAY HUMAN BIOLOGY',
    title: 'Why Bath Wrinkles Are Actually High-Grip Tire Treads',
    hook: 'Did you know bath wrinkles on your fingers are not caused by absorbed water?',
    mystery: 'Why do your fingers and toes get wrinkly in warm water, while your arms and face stay completely smooth?',
    mythBuster: 'Myth: Skin soaks up water like a kitchen sponge. Fact: People with cut finger nerves never get pruney fingers!',
    mechanism: 'When underwater, your autonomic nervous system (the involuntary brain controls) tightens subcutaneous blood vessels (tiny vessels under your skin). This shrinking pulls your skin downward into narrow channels.',
    takeaway: 'These channels channel water away from your fingertips just like tire grooves push rain off roads, boosting your underwater grip by up to 40%.',
    proTip: 'If your fingers do not prune after 15 minutes in warm water, doctors use this simple test to check nerve health!',
    reference: 'Changizi, M. et al. / Brain, Behavior and Evolution',
    tags: ['#ScienceFacts', '#HumanBiology', '#Evolution', '#EverydayScience', '#DidYouKnow', '#ArchieExplains', '#LearnEveryday', '#STEM']
  },
  {
    id: 'winter_static_shock_15000v',
    category: 'EVERYDAY APPLIANCE PHYSICS',
    title: 'Why Winter Carpets Shock You With 15,000 Volts',
    hook: 'Did you know a winter doorknob static shock carries up to 15,000 Volts?',
    mystery: 'Why does touching a metal doorknob in cold winter give you a painful zap, but almost never in humid summer?',
    mythBuster: 'Myth: Cold temperatures create electricity. Fact: Winter heaters dry out indoor air below 20% humidity, stopping electrical charge from leaking away.',
    mechanism: 'Walking across carpet rubs electrons off shoe soles through triboelectric friction (static electricity caused by rubbing). In dry winter air, up to 15,000 Volts build up on your body.',
    takeaway: 'When your hand nears grounded metal, the electric field ionizes the air (turns air particles into conductive paths), creating a tiny 30,000°C spark that snaps in nanoseconds.',
    proTip: 'Touch doorframes with a metal key or your knuckle first: spreading the spark over a wider contact point means your pain sensors feel zero shock!',
    reference: 'Feynman Lectures on Physics / Electrostatics & Triboelectric Charging',
    tags: ['#PhysicsFacts', '#WinterScience', '#Electricity', '#DidYouKnow', '#ScienceExplained', '#EverydayHacks', '#ArchieExplains']
  },
  {
    id: 'microwave_cold_spots_standing_waves',
    category: 'KITCHEN PHYSICS & THERMODYNAMICS',
    title: 'Why Microwaves Heat Food Unevenly (And The Donut Fix)',
    hook: 'Did you know microwaves only penetrate about 1 inch into your food?',
    mystery: 'Why does the outer edge of your soup bowl turn scalding hot while the exact center stays ice cold?',
    mythBuster: 'Myth: Microwaves cook food from the inside out. Fact: Microwaves only penetrate 1 to 2 centimeters (about 0.7 inches) before water absorbs them.',
    mechanism: 'The microwave magnetron (the wave generator tube) creates standing waves (bouncing wave patterns) inside the metal box. Wave peaks give double heat, while troughs give zero heat, making hot and cold spots.',
    takeaway: 'The spinning glass plate moves food in a circle, but whatever sits in the exact middle never crosses the hot wave peaks and stays cold.',
    proTip: 'Push food toward the outer rim of your plate and leave an empty hole in the middle like a donut: your food heats evenly in half the time!',
    reference: 'Buffler, C. / Microwave Cooking & Processing Standards',
    tags: ['#KitchenScience', '#PhysicsHacks', '#LifeHacks', '#FoodScience', '#EngineeringWonders', '#ArchieExplains']
  },
  {
    id: 'crying_onions_syn_propanethial',
    category: 'KITCHEN BIOCHEMISTRY',
    title: 'Why Cutting Onions Makes You Cry (The Acid Reaction)',
    hook: 'Did you know onions make you cry by forming mild acid directly on your eyes?',
    mystery: 'Why does slicing an onion trigger intense burning and tears, while potatoes and carrots never do?',
    mythBuster: 'Myth: The strong onion smell makes you cry. Fact: An invisible gas reacts with moisture on your eye to create real acid.',
    mechanism: 'Knife blades slice open plant cell walls, letting alliinase enzymes (special plant protein catalysts) mix with sulfur compounds. This produces a light gas called syn-propanethial-S-oxide.',
    takeaway: 'When this gas touches the tear film covering your eyes, it turns into mild sulfurous acid. Your lachrymal glands (tear ducts) instantly flood your eyes with tears to wash it out.',
    proTip: 'Chill onions in the fridge for 20 minutes or use a very sharp knife: cold slows down the chemical reaction, and sharp blades slice cells cleanly instead of popping them!',
    reference: 'Block, E. / Royal Society of Chemistry & Nature',
    tags: ['#FoodChemistry', '#CookingHacks', '#ScienceFacts', '#DidYouKnow', '#EverydayWonders', '#ArchieExplains']
  },
  {
    id: 'plane_cabin_taste_numbs_salt',
    category: 'AERONAUTICAL SENSORY SCIENCE',
    title: 'Why Airplane Food Tastes Bland (It Is Not The Chef)',
    hook: 'Did you know flying at 35,000 feet dulls your taste buds by up to 30%?',
    mystery: 'Why does the exact same meal taste rich on the ground, but bland and tasteless inside an airplane cabin?',
    mythBuster: 'Myth: Airlines use low-grade ingredients to save money. Fact: Cabin air pressure and desert-dry air temporarily numb human sensory receptors.',
    mechanism: 'Pressurized cabin air has less than 12% humidity (drier than the Sahara desert). This dries out the mucosal lining (protective moist layer) inside your nose where 80% of flavor is detected.',
    takeaway: 'In addition, loud 85-decibel engine background hum distracts the brain and suppresses sweet and salty flavors, but leaves savory Umami (rich meaty flavor) completely untouched.',
    proTip: 'This is why airlines pour millions of cans of tomato juice: tomato juice is packed with natural Umami, which stays delicious even at 35,000 feet!',
    reference: 'Fraunhofer Institute for Building Physics & Cornell University Study',
    tags: ['#AviationFacts', '#SensoryScience', '#FoodFacts', '#Neuroscience', '#TravelTips', '#ArchieExplains']
  },
  {
    id: 'phone_battery_20_80_rule',
    category: 'BATTERY CHEMISTRY & TECH',
    title: 'The Truth About Charging Overnight (The 20-80 Rule)',
    hook: 'Did you know leaving your phone at 100% all night wears out your battery faster?',
    mystery: 'Does keeping your phone plugged in while you sleep actually damage the battery lifespan over time?',
    mythBuster: 'Myth: Overnight charging causes phones to overcharge or explode. Fact: Phone safety chips stop electric current, but holding high voltage causes internal mechanical stress.',
    mechanism: 'At 100% full charge, lithium ions (the charged particles storing energy) are crammed tightly into the battery anode (the negative terminal), causing microscopic physical strain and chemical wear.',
    takeaway: 'Keeping battery cells at 100% in a warm room slowly cracks internal crystal layers, cutting the battery lifespan from 800 charge cycles down to 400 cycles.',
    proTip: 'Keep battery charge between 20% and 80%. Turning on the 80% charge limit in your phone settings can keep your battery healthy for 3+ years!',
    reference: 'Journal of The Electrochemical Society / Battery Lifetime Research',
    tags: ['#TechHacks', '#BatteryHealth', '#SmartphoneTips', '#EngineeringFacts', '#ArchieExplains']
  },
  {
    id: 'mirrors_z_axis_reflection',
    category: 'OPTICS & COGNITIVE SCIENCE',
    title: 'Why Mirrors Do NOT Flip Left and Right (The 3D Trick)',
    hook: 'Did you know mirrors do not reverse left and right at all?',
    mystery: 'If a mirror supposedly flips left and right, why does it never flip your head and feet upside down?',
    mythBuster: 'Myth: Mirrors flip images horizontally. Fact: Mirrors do not reverse left or right AT ALL!',
    mechanism: 'Mirrors reflect light rays along the front-to-back Z-axis (the depth dimension). When you point North, your mirror reflection points straight South.',
    takeaway: 'Your brain creates the left-right confusion because human bodies look symmetrical on the outside. Your brain imagines stepping behind the glass and turning around 180 degrees.',
    proTip: 'Hold a right-hand glove to a mirror: it does not become a left-hand glove, it is pushed inside out along the depth dimension!',
    reference: 'American Journal of Physics & Cognitive Perception Studies',
    tags: ['#OpticsFacts', '#MindBlown', '#BrainTricks', '#PhysicsExplained', '#ArchieExplains']
  },
  {
    id: 'coffee_caffeine_adenosine_blocker',
    category: 'NEUROCHEMISTRY & SLEEP SCIENCE',
    title: 'Why Coffee Fails When You Drink It Right Out Of Bed',
    hook: 'Did you know caffeine contains zero calories and zero real physical energy?',
    mystery: 'Why do you get a heavy afternoon crash around 2 PM even after having a big morning coffee?',
    mythBuster: 'Myth: Caffeine gives your body fuel. Fact: Caffeine has zero calories—it is strictly an adenosine receptor blocker (a chemical plug that blocks sleep signals).',
    mechanism: 'Throughout the day, brain activity creates adenosine (the natural chemical that creates tiredness). Caffeine has a similar shape and plugs into adenosine docks, hiding your tiredness temporarily.',
    takeaway: 'While caffeine blocks the docks, adenosine keeps piling up in the background. When your liver cleans out the caffeine hours later, all that stored tiredness hits your brain at once.',
    proTip: 'Wait 60 to 90 minutes after waking up before having your first coffee: this lets your morning cortisol (wake-up hormone) clear grogginess naturally so caffeine lasts all afternoon!',
    reference: 'Stanford University School of Medicine / Neurobiology of Sleep',
    tags: ['#CoffeeScience', '#SleepScience', '#Neurochemistry', '#ProductivityHacks', '#ArchieExplains']
  },
  {
    id: 'honey_never_spoils_eternal_sugar',
    category: 'BIOCHEMISTRY & PRESERVATION',
    title: 'Why 3,000-Year-Old Honey In Egyptian Tombs Is Still Good',
    hook: 'Did you know archaeologists found 3,000-year-old honey in Egyptian tombs that is still perfectly edible?',
    mystery: 'How can pure raw honey sit in jars for thousands of years without growing any mold or bacteria?',
    mythBuster: 'Myth: Honey has artificial preservatives. Fact: Natural honey has such high sugar density that bacteria dry out and die instantly.',
    mechanism: 'Honey has less than 17% water. Through osmosis (the movement of water toward high sugar areas), honey pulls water out of bacterial cell walls, dehydrating germs immediately.',
    takeaway: 'On top of that, bees add a natural enzyme (glucose oxidase) that creates tiny amounts of hydrogen peroxide (natural disinfectant), making an acidic environment where germs cannot live.',
    proTip: 'If your honey turns cloudy and hard, it is not spoiled—it has just crystallized (sugar forming natural crystals)! Set the jar in warm water to turn it smooth and clear again.',
    reference: 'National Honey Board & American Society for Microbiology',
    tags: ['#BiologyFacts', '#FoodScience', '#AncientHistory', '#Biochemistry', '#ArchieExplains']
  },
  {
    id: 'blue_sky_rayleigh_scattering',
    category: 'ATMOSPHERIC OPTICS',
    title: 'Why The Sky Is Blue Instead of Purple (The Eye Paradox)',
    hook: 'Did you know sunlight actually scatters purple light much more than blue light?',
    mystery: 'If violet light scatters strongest in the atmosphere, why does our sky look bright blue instead of violet?',
    mythBuster: 'Myth: The sky reflects blue oceans. Fact: Sunlight bounces off air molecules, and our human eyes are tuned to see blue!',
    mechanism: 'Rayleigh scattering (the way air particles scatter light) scatters short wavelengths (violet and blue) 10 times more than red light. Violet light is scattered most of all.',
    takeaway: 'However, human eyes have three cone color sensors (red, green, and blue). Our eye sensors are very sensitive to blue but weak at detecting violet, so our brain sees a sky-blue mix.',
    proTip: 'At sunset, sunlight travels through 10 times more air distance, scattering away all blue light and leaving only warm red and orange rays for your eyes!',
    reference: 'Lord Rayleigh / Royal Society Philosophical Magazine',
    tags: ['#OpticsFacts', '#AtmosphericScience', '#WhyTheSkyIsBlue', '#ColorScience', '#ArchieExplains']
  },
  {
    id: 'gps_relativity_time_dilation',
    category: 'RELATIVISTIC ASTROPHYSICS',
    title: 'Why GPS Would Fail In 2 Minutes Without Einstein',
    hook: 'Did you know GPS satellites age 38 microseconds faster than clocks on Earth every day?',
    mystery: 'How does Einstein’s theory of relativity stop phone navigation from pointing you into a river?',
    mythBuster: 'Myth: GPS only measures radio ping travel times. Fact: Clocks on fast, high-altitude satellites tick at different speeds than clocks on the ground!',
    mechanism: 'Special relativity proves fast motion slows clocks down (-7 microseconds daily). But General relativity proves weaker gravity up in space speeds clocks up (+45 microseconds daily).',
    takeaway: 'The result is +38 microseconds every day. If satellite computers did not fix this relativistic time difference, your GPS position would drift off by 6 miles (10 km) every single day!',
    proTip: 'Your phone calculates your location by reading distance signals from at least 4 GPS satellites at once!',
    reference: 'Relativity in the Global Positioning System / Living Reviews in Relativity',
    tags: ['#Astrophysics', '#Einstein', '#GPSFacts', '#TechSecrets', '#ArchieExplains']
  },
  {
    id: 'helium_balloon_accelerating_car',
    category: 'CLASSICAL MECHANICS & BUOYANCY',
    title: 'Why Helium Balloons Move Forward When You Accelerate',
    hook: 'Did you know tapping the gas pedal makes a helium balloon fly forward instead of backward?',
    mystery: 'When a car speeds up, your body is pushed back into the seat. Why does a floating helium balloon jerk forward toward the dashboard?',
    mythBuster: 'Myth: The balloon ignores the laws of motion. Fact: Dense car cabin air piles up at the back window, pushing the lighter balloon forward.',
    mechanism: 'Air has physical weight. When the car accelerates forward, the air inside rushes backward due to inertia (the tendency of mass to resist acceleration), creating high air pressure at the rear.',
    takeaway: 'Because helium is much lighter than air, the heavy air at the back squeezes the balloon forward toward the low-pressure windshield area.',
    proTip: 'If you step on the brakes hard, cabin air piles up at the front windshield, and the helium balloon flies backward toward the rear seats!',
    reference: 'Feynman Lectures on Physics / Principles of Buoyancy & Accelerated Frames',
    tags: ['#PhysicsOddity', '#CarScience', '#Buoyancy', '#MindBlown', '#ArchieExplains']
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
 * Select a deduplicated knowledge item with robust history tracking
 */
function selectDeduplicatedItem() {
  let history = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } else if (fs.existsSync(LEGACY_HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(LEGACY_HISTORY_FILE, 'utf8'));
    }
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }

  // Cross-check with Archie Tech facts cache to avoid same-day collisions
  let archieCacheIds = new Set();
  try {
    if (fs.existsSync(ARCHIE_FACTS_CACHE)) {
      const archieData = JSON.parse(fs.readFileSync(ARCHIE_FACTS_CACHE, 'utf8'));
      if (Array.isArray(archieData)) {
        archieData.forEach(item => {
          const id = typeof item === 'string' ? item : item?.id;
          if (id) archieCacheIds.add(id);
        });
      }
    }
  } catch {}

  const usedIds = new Set(history.map(item => typeof item === 'string' ? item : item.id));

  // Available items not in recent history
  let available = IN_DEPTH_KNOWLEDGE_BASE.filter(item => !usedIds.has(item.id));

  // Prefer items that also haven't run recently in Archie Tech Facts
  const nonConflicting = available.filter(item => !archieCacheIds.has(item.id));
  if (nonConflicting.length > 0) {
    available = nonConflicting;
  }

  let selected;
  if (available.length > 0) {
    selected = available[0];
  } else {
    // If all items have been cycled, rotate starting from oldest
    console.log('[InfoCard Deduplication] Full catalog has cycled! Restarting rotation from oldest entries...');
    selected = IN_DEPTH_KNOWLEDGE_BASE[0];
    history = [];
  }

  history.push({
    id: selected.id,
    title: selected.title,
    category: selected.category,
    usedAt: new Date().toISOString()
  });

  // Keep last 100 historical items
  if (history.length > 100) history = history.slice(-100);

  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    if (fs.existsSync(ARTIFACTS_DIR)) {
      fs.writeFileSync(LEGACY_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[InfoCard Deduplication] Notice persisting history:', err.message);
  }

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

  // Generate Archie in akimbo_jaw pose
  const archieRawSvg = buildModernCharacterSVG('akimbo_jaw', { mouth: 'closed', eye: 'raised_right' });
  const archieMatch = archieRawSvg.match(/<g id="modern_character_root">([\s\S]*?)<\/g>\s*<\/svg>/);
  const archieInnerContent = archieMatch ? archieMatch[1] : '';

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <linearGradient id="hookCardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="goldBadge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>

  <!-- Clean Obsidian Canvas Background -->
  <rect width="${width}" height="${height}" fill="#070a12" />
  
  <!-- Subtle Framing Border -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="24" fill="none" stroke="#1e293b" stroke-width="2" />

  <!-- Top Category & Brand Bar -->
  <g transform="translate(50, 48)">
    <rect x="0" y="0" width="340" height="38" rx="19" fill="#0f172a" stroke="#38bdf8" stroke-width="1.8" />
    <circle cx="22" cy="19" r="5" fill="#38bdf8" />
    <text x="38" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#38bdf8" letter-spacing="1.5">
      ${escapeXml(item.category)}
    </text>
    <text x="980" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#94a3b8" text-anchor="end" letter-spacing="1.5">
      ARCHIE LAB • FACT CHECK
    </text>
  </g>

  <!-- ================================================================= -->
  <!-- HERO HOOK CARD: CLEAN, UNCLUTTERED, MAXIMUM STOPPING POWER       -->
  <!-- ================================================================= -->
  <g transform="translate(50, 110)" filter="url(#softShadow)">
    <rect x="0" y="0" width="980" height="520" rx="24" fill="url(#hookCardBg)" stroke="#38bdf8" stroke-width="2.5" />

    <!-- Big Attention-Grabbing Hook Badge -->
    <rect x="36" y="32" width="230" height="42" rx="12" fill="url(#goldBadge)" />
    <text x="151" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">
      💡 DID YOU KNOW?
    </text>

    <!-- Bold Main Hook Title (Prominent, High Impact) -->
    ${renderWrappedSvgText(item.title, 36, 120, 36, 44, 34, '#ffffff', '900')}

    <!-- Divider -->
    <line x1="36" y1="210" x2="944" y2="210" stroke="#1e293b" stroke-width="2" />

    <!-- Core Hook Mystery Box: Readable, uncluttered, curiosity trigger -->
    <rect x="36" y="235" width="908" height="150" rx="16" fill="#0b1120" stroke="#334155" stroke-width="1.5" />
    <text x="64" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#38bdf8" letter-spacing="1.2">
      🔍 THE EVERYDAY QUESTION:
    </text>
    ${renderWrappedSvgText(item.mystery, 64, 310, 52, 32, 22, '#f1f5f9', '600')}

    <!-- Bottom Hook Punchline Bar -->
    <rect x="36" y="415" width="908" height="75" rx="14" fill="#06251f" stroke="#10b981" stroke-width="1.5" />
    <text x="64" y="452" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#34d399" letter-spacing="1.2">
      ⚡ THE VERDICT:
    </text>
    <text x="210" y="452" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700" fill="#ecfdf5">
      ${escapeXml(item.mythBuster.replace(/^Myth:\s*/i, '').slice(0, 72))}...
    </text>
    <text x="64" y="475" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#94a3b8">
      📖 Full scientific breakdown explained in caption below!
    </text>
  </g>

  <!-- ================================================================= -->
  <!-- LOWER SECTION: ARCHIE MASCOT & READABLE TAKEAWAY CARD             -->
  <!-- ================================================================= -->
  <!-- Archie Character on Left -->
  <g id="archie_character_figure" transform="translate(10, 645) scale(0.68)">
    ${archieInnerContent}
  </g>

  <!-- Hook Companion Card (Right of Archie) -->
  <g transform="translate(440, 655)" filter="url(#softShadow)">
    <rect x="0" y="0" width="590" height="625" rx="24" fill="#0b1120" stroke="#334155" stroke-width="2" />

    <!-- Card Header Pill -->
    <rect x="32" y="28" width="270" height="38" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
    <text x="48" y="53" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#38bdf8" letter-spacing="1.2">
      🧠 ARCHIE'S LAB NOTE
    </text>

    <!-- Key Scientific Takeaway -->
    <text x="32" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#facc15" letter-spacing="1">
      ⚡ KEY TAKEAWAY:
    </text>
    ${renderWrappedSvgText(item.takeaway, 32, 138, 38, 30, 20, '#f8fafc', '500')}

    <!-- Pro Tip / Practical Action -->
    <rect x="32" y="270" width="526" height="150" rx="14" fill="#0f172a" stroke="#facc15" stroke-width="1.5" />
    <text x="52" y="304" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#facc15" letter-spacing="1">
      💡 EVERYDAY LIFE HACK:
    </text>
    ${renderWrappedSvgText(item.proTip, 52, 338, 38, 28, 18, '#fef08a', '500')}

    <!-- Engagement & Community Call To Action -->
    <rect x="32" y="445" width="526" height="150" rx="14" fill="#070d18" stroke="#1e293b" stroke-width="1.5" />
    <text x="52" y="482" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff">
      💬 Did this surprise you?
    </text>
    <text x="52" y="512" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#94a3b8">
      Read the full caption for the full science details!
    </text>
    <text x="52" y="555" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#38bdf8">
      👉 Follow @bones_ceo • 📌 Save for later
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

  // Optimized hashtags: balanced mix of high-volume discovery (#ScienceFacts, #DidYouKnow),
  // niche educational tags (#HumanBiology, #EverydayScience), and platform community tags (#LearnOnInstagram)
  const algorithmOptimizedHashtags = Array.from(new Set([
    ...item.tags,
    '#BonesCeo',
    '#ArchieLab',
    '#ScienceFacts',
    '#DidYouKnow',
    '#EverydayScience',
    '#ScienceExplained',
    '#LearnOnInstagram',
    '#FactCheck',
    '#CuriosityDaily',
    '#STEM'
  ])).join(' ');

  // Format Facebook post: High engagement hook, clear everyday explanation with bracketed terms, clean spacing
  const fbCaption = `💡 ${cleanTitle}

${item.hook}

🔍 THE MYSTERY:
${item.mystery}

❌ WHAT MOST PEOPLE THINK:
${item.mythBuster}

🔬 HOW IT ACTUALLY WORKS (Plain Science):
${item.mechanism}

⚡ WHY IT MATTERS:
${item.takeaway}

💡 EVERYDAY HACK:
${item.proTip}

📖 Verified Citation:
${item.reference}

💬 Have you ever noticed this in everyday life? Share your thoughts below!
👉 Follow Archie Lab & @bones_ceo for daily everyday science & technology breakdowns.
📌 Save this post so you have it ready to share with friends!

${algorithmOptimizedHashtags}`;

  // Format Instagram post: First 2 lines hook above the fold, structured scannable layout, bracketed definitions
  const igCaption = `💡 ${cleanTitle}

${item.hook}

🔍 The Everyday Mystery:
${item.mystery}

❌ What Most People Believe:
${item.mythBuster}

🔬 How It Actually Works:
${item.mechanism}

⚡ Why This Happens:
${item.takeaway}

💡 Life Hack:
${item.proTip}

📖 Verified Citation: ${item.reference}

💬 What everyday mystery should Archie explain next? Let us know in the comments!
👉 Follow @bones_ceo for daily science & tech insights
📌 Tap save so you can revisit this anytime!

.
.
${algorithmOptimizedHashtags}`;

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
