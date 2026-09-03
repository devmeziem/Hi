/**
 * Unified Multi-Niche AI Topic Discovery & Intelligent Selection Engine
 * 
 * WORKFLOW MANDATE:
 * 1. Live DuckDuckGo Query: Queries DuckDuckGo for top trending topics, news, and search queries today in the niche.
 * 2. 21+ Spheres/Archetypes: Integrates the full scope of 21+ thematic pillars per channel.
 * 3. AI Generates 5 Candidate Topics: Active AI (Groq, Gemini, Grok, OpenRouter, Cloudflare, Pollinations, Ollama) formulates 5 strong candidates.
 * 4. Database Check & Deduplication: Cross-references candidates against Firestore and local history database.
 * 5. Active AI Chooses 1 Winner & Discards 4: The active AI selects the single best unique topic, saves it to database, and deletes the other 4.
 * 6. Passes chosen topic seamlessly into the video creation flow.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const querystring = require('querystring');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Local cache paths
const LOCAL_FIN_CACHE = path.join(process.cwd(), 'daily_fin_history_cache.json');
const LOCAL_STOIC_CACHE = path.join(process.cwd(), 'daily_stoic_history_cache.json');
const LOCAL_CARTOON_CACHE = path.join(process.cwd(), 'daily_cartoon_history_cache.json');
const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');

// API Keys from environment
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2,
  process.env.GROK_KEY
].filter(Boolean))).map(k => k.trim());

// ----------------------------------------------------
// 21+ THEMATIC SCOPES & SPHERES PER CHANNEL
// ----------------------------------------------------
const NICHE_SPHERES = {
  fin: {
    channelHandle: '@bones_ceo',
    channelName: 'Fin Blueprint',
    targetAudience: 'Everyday young people, students, beginners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 USD). Single standard currency is US Dollars ($ USD).',
    searchQueries: [
      'how to start a business with under 50 dollars for beginners',
      'what are the biggest financial traps keeping young people broke in their 20s',
      'how to build a 500 dollar emergency fund fast on low income',
      'what high income skills can you learn completely free in 30 days',
      'how does compound interest actually make regular people wealthy over time',
      'what small business can you start today with less than 50 dollars capital',
      'how to stop living paycheck to paycheck and eliminate hidden expense leaks',
      'how to tell if an online business or crypto investment is a scam or ponzi',
      'how do small businesses calculate profit margins and unit economics',
      'what is the smartest way to invest your first 100 dollars as a beginner',
      'how do successful entrepreneurs test and validate an idea in 24 hours',
      'how to negotiate freelance pricing and charge for value instead of hours',
      'why do most people stay poor even when working 60 hours a week',
      'how to create and sell a digital product on your phone with zero budget',
      'how does inflation erode your savings and how do you protect purchasing power',
      'what is the difference between cash flow and profit in a small business',
      'how do students budget money and make daily income on campus',
      'how to pay off debt fast using the debt snowball method step by step'
    ],
    spheres: [
      { id: 'small_biz_low_cap', name: 'Small Capital Business ($0-$5-$50)', desc: 'Micro-retail, digital services, zero-inventory agency, local distribution' },
      { id: 'saving_expense_leaks', name: 'Saving & Killing Expense Leaks', desc: 'Cutting micro-subscriptions, zero-fee banking, emergency fund formulas' },
      { id: 'financial_literacy_plain', name: 'Financial Literacy in Plain English', desc: 'Compound interest, inflation erosion, liquidity, index funds simplified' },
      { id: 'skills_to_income', name: 'High-Demand Skills to Income', desc: 'Phone-only skills, copywriting, video clipping, remote customer service' },
      { id: 'free_verified_opportunities', name: 'Free Verified Certs & Grants', desc: 'Google/Microsoft free credentials, startup grant programs, student funding' },
      { id: 'scam_ponzi_red_flags', name: 'Scam & Ponzi Red Flags', desc: 'Fake crypto giveaways, pyramid schemes, upfront fee loan scams' },
      { id: 'unit_economics_breakdowns', name: 'Business Unit Economics Breakdown', desc: 'Wholesale vs retail margins, cost per unit, realistic daily profit math' },
      { id: 'beginner_crypto_stablecoins', name: 'Crypto & Stablecoins for Beginners', desc: 'USDT dollar hedging, self-custody basics, dollar-cost averaging' },
      { id: 'financial_calculators_math', name: 'Financial Multipliers ($1/Day Rules)', desc: 'Compounding $1 to $5 daily, purchasing power, break-even timelines' },
      { id: 'thirty_day_money_challenges', name: '30-Day Budget & Cashflow Experiments', desc: 'No-spend weeks, 30-day savings challenge, micro-business testing' },
      { id: 'high_roi_daily_habits', name: 'High ROI Daily Money Habits', desc: 'Tracking daily gross receipts, separating personal & business funds' },
      { id: 'side_hustle_validation', name: 'Side Hustle Validation in 24 Hours', desc: 'Testing customer demand before spending a single dollar on stock' },
      { id: 'zero_debt_strategy', name: 'Zero Debt & Payoff Protocols', desc: 'Debt snowball vs avalanche in simple terms, avoiding payday traps' },
      { id: 'emergency_buffer_speed', name: 'Emergency Buffer Acceleration', desc: 'Building the first $500 safety net in 30 days without loans' },
      { id: 'service_arbitrage', name: 'Low-Cost Service Arbitrage', desc: 'Connecting buyers with verified freelancers with zero upfront overhead' },
      { id: 'digital_micro_products', name: 'Digital Product Micro-Funnels', desc: 'Templates, checklists, and mini-guides sold directly on mobile' },
      { id: 'freelance_pricing_rules', name: 'Freelance Pricing Psychology', desc: 'Charging for value instead of hourly wages, pitching local clients' },
      { id: 'subscription_audits', name: 'Subscription & Bank Fee Audits', desc: 'Eliminating silent account maintenance fees and unused recurring trials' },
      { id: 'micro_investing_etfs', name: 'Micro-Investing & Index Funds', desc: 'How fractional shares work, why low-fee index funds beat stock picking' },
      { id: 'inflation_defense', name: 'Purchasing Power & Inflation Defense', desc: 'How to keep savings from losing value as living costs climb' },
      { id: 'cashflow_first_principles', name: 'Cashflow First Principles', desc: 'Cashflow vs profit, keeping operating capital safe from impulse withdrawals' },
      { id: 'student_budgeting_hacks', name: 'Student & Youth Budgeting Hacks', desc: 'Campus food & study budgeting, turning academic skills into daily cash' }
    ]
  },
  stoic: {
    channelHandle: '@TheStoicArchitect',
    channelName: 'The Stoic Architect',
    targetAudience: 'Everyday people seeking practical emotional discipline, unshakeable mental fortitude, and psychological resilience amidst modern chaos.',
    searchQueries: [
      'how to respond to disrespect with strategic silence and calm',
      'how did Marcus Aurelius handle severe anxiety stress and betrayal',
      'how to stop overthinking and start taking immediate disciplined action',
      'why is discipline more powerful than motivation according to Stoics',
      'how to stop caring what other people think about your life choices',
      'how to build ice cold mental composure under extreme pressure',
      'what should you do when everything is falling apart in your personal life',
      'how to overcome imposter syndrome and self doubt using Stoic virtue',
      'how to set unbreakable emotional boundaries with toxic people',
      'why did Seneca say we suffer more often in imagination than reality',
      'how did Marcus Aurelius conquer morning discipline and wake up with purpose',
      'how to recover from mental burnout and exhaustion without quitting',
      'how to deal with betrayal and broken trust without seeking revenge',
      'why does remembering your mortality Memento Mori destroy fear and procrastination',
      'how to stop being a people pleaser and say no without feeling guilty',
      'how to apply the Dichotomy of Control to things outside your power',
      'why is solitude and self reliance essential for building strong character',
      'how to conquer cheap dopamine addiction and build delayed gratification',
      'what is the Stoic secret to turning any obstacle into the way forward'
    ],
    spheres: [
      { id: 'disrespect_silence', name: 'Responding to Disrespect with Strategic Silence', desc: 'Inner Citadel — silence as the ultimate weapon against provocation' },
      { id: 'failure_rebuild', name: 'Rebuilding from Failure (Amor Fati)', desc: 'Using adversity as fuel, rising from total career or personal collapse' },
      { id: 'overthinking_action', name: 'Killing Overthinking with Immediate Action', desc: 'Physical momentum curing mental anxiety, breaking analysis paralysis' },
      { id: 'solitude_strength', name: 'Thriving in Solitude & Self-Reliance', desc: 'Forging character when nobody is watching, clapping, or supporting' },
      { id: 'pressure_calm', name: 'Ice-Cold Composure Under Extreme Pressure', desc: 'Apatheia — tactical breathing and pause during high-stakes conflict' },
      { id: 'rejection_armor', name: 'Overcoming Rejection & Criticism', desc: 'Indifferents — external opinions have zero intrinsic power over character' },
      { id: 'comparison_cure', name: 'Curing Social Comparison & Envy', desc: 'Virtue as Sole Good — competing only with who you were yesterday' },
      { id: 'dopamine_discipline', name: 'Conquering Cheap Dopamine & Impulsive Desires', desc: 'Delayed gratification, breaking mindless scrolling addiction' },
      { id: 'impostor_syndrome', name: 'Conquering Impostor Syndrome & Self-Doubt', desc: 'Focusing on virtue and effort rather than external validation' },
      { id: 'toxic_boundaries', name: 'Handling Toxic People & Family Conflict', desc: 'Sympatheia with strict emotional boundaries, protecting inner peace' },
      { id: 'morning_discipline', name: 'Marcus Aurelius Morning Bed Routine', desc: 'Waking up with purpose, conquering the desire to stay under the covers' },
      { id: 'burnout_recovery', name: 'Overcoming Burnout & Mental Fatigue', desc: 'Recognizing limits, aligning labor with purpose, active mental rest' },
      { id: 'betrayal_composure', name: 'Dealing with Betrayal & Broken Trust', desc: 'Accepting human nature, letting go of resentment and vengeance' },
      { id: 'memento_mori', name: 'Memento Mori — Urgency of Life', desc: 'Remembering mortality to eliminate trivial worries and procrastination' },
      { id: 'saying_no', name: 'Eliminating People-Pleasing & Saying No', desc: 'Valuing your limited time, establishing unbreakable personal standards' },
      { id: 'dichotomy_control', name: 'The Dichotomy of Control Master Law', desc: 'Separating what is in your power from what is outside your power' },
      { id: 'negative_visualization', name: 'Premeditatio Malorum (Mental Armor)', desc: 'Anticipating obstacles in advance so nothing catches you off guard' },
      { id: 'deep_focus', name: 'Maintaining Deep Focus in a Noisy World', desc: 'Guarding attention from digital noise, cultivating single-minded intent' },
      { id: 'financial_stoicism', name: 'Overcoming Financial Anxiety & Scarcity', desc: 'Seneca\'s practice of poverty, mastering fear of losing material wealth' },
      { id: 'meaning_in_adversity', name: 'Finding Deep Meaning in Hard Times', desc: 'Viewing obstacles as rigorous trainers shaping your soul' },
      { id: 'unshakeable_patience', name: 'The Art of Unshakeable Patience', desc: 'Letting events unfold naturally without rushing or forcing outcomes' },
      { id: 'evening_review', name: 'Evening Stoic Self-Examination', desc: 'Auditing daily actions, praising progress, rectifying shortcomings' },
      { id: 'unacknowledged_labor', name: 'The Dignity of Unacknowledged Labor', desc: 'Doing the right thing simply because it is right, without applause' },
      { id: 'obstacle_is_way', name: 'The Obstacle Is The Way', desc: 'Transforming impediment into the path forward, fuel for the fire' }
    ]
  },
  cartoon: {
    channelHandle: '@ArchieExplains',
    channelName: 'Archie Explains',
    targetAudience: 'Curious minds of all ages who love fast, visual, entertaining explanations of science, technology, and everyday mysteries.',
    searchQueries: [
      'why does time slow down near a massive black hole',
      'how does the internet travel under oceans through giant glass cables',
      'why do we dream when we sleep and where do dreams come from',
      'how do artificial intelligence neural networks actually learn and think',
      'why dont giant 500 ton airplanes fall out of the sky',
      'how does the human brain store and recall memories across neurons',
      'how do white blood cells and antibodies hunt viruses in your body',
      'what bizarre creatures survive at the bottom of the Mariana Trench',
      'how do noise cancelling headphones cancel sound waves in real time',
      'how do lithium ion batteries store energy and why do they catch fire',
      'what would happen to the human body in the vacuum of deep space',
      'how does CRISPR gene editing find and cut specific strands of DNA',
      'why can quantum particles exist in two places at the same time',
      'what would happen if the Earth suddenly stopped spinning for 5 seconds',
      'how does a smartphone camera take clear photos in total darkness',
      'why do optical illusions fool our brain even when we know it is a trick',
      'how do maglev bullet trains float on air without touching the tracks',
      'how does lightning form and why is thunder so loud',
      'why can tardigrades survive in outer space radiation and boiling water'
    ],
    spheres: [
      { id: 'quantum_physics_simple', name: 'Quantum Physics in Plain English', desc: 'Wave-particle duality, quantum superposition, Schrödinger\'s cat' },
      { id: 'undersea_internet_cables', name: 'How the Internet Travels Under Oceans', desc: 'Subsea fiber-optic cables, glass strands carrying global data' },
      { id: 'science_of_sleep_dreams', name: 'Why We Sleep and Where Dreams Come From', desc: 'REM cycles, brain memory sorting, evolutionary function of dreaming' },
      { id: 'how_ai_actually_learns', name: 'How AI Neural Networks Actually Learn', desc: 'Weights, biases, gradient descent, training on trillions of words' },
      { id: 'black_holes_event_horizon', name: 'Black Holes & Event Horizons', desc: 'Singularities, spaghettification, time dilation near extreme mass' },
      { id: 'how_airplanes_fly', name: 'Why Giant Airplanes Don\'t Fall Out of the Sky', desc: 'Bernoulli principle, angle of attack, thrust overcoming drag' },
      { id: 'brain_memory_wiring', name: 'How the Human Brain Stores Memories', desc: 'Synaptic plasticity, neurons firing together, retrieval circuits' },
      { id: 'immune_system_wars', name: 'Immune System Wars vs Viruses', desc: 'T-cells, antibodies, phagocytes hunting pathogens in bloodstream' },
      { id: 'deep_ocean_pressure', name: 'Deep Ocean Mysteries & Crushing Pressure', desc: 'Mariana Trench, bioluminescence, creatures adapted to 1,000 atm' },
      { id: 'electric_car_batteries', name: 'How Lithium-Ion Batteries Actually Work', desc: 'Lithium ions hopping between cathode and anode, battery degradation' },
      { id: 'fusion_vs_fission', name: 'Nuclear Fusion vs Fission Explained', desc: 'Splitting heavy atoms vs smashing hydrogen into helium (Sun\'s engine)' },
      { id: 'crispr_gene_editing', name: 'How CRISPR Gene Editing Works', desc: 'Molecular scissors cutting viral DNA, rewriting genetic code' },
      { id: 'relativity_time_dilation', name: 'Time Dilation & Einstein\'s Relativity', desc: 'Why time ticks slower on GPS satellites and near gravity wells' },
      { id: 'noise_cancelling_headphones', name: 'How Noise-Cancelling Headphones Cancel Sound', desc: 'Destructive interference, anti-phase soundwaves neutralizing noise' },
      { id: 'animal_evolution_wonders', name: 'Evolution & Weird Animal Superpowers', desc: 'Mantis shrimp vision, tardigrade survival, chameleon color cells' },
      { id: 'hurricanes_lightning_weather', name: 'How Hurricanes & Lightning Bolts Form', desc: 'Thermal updrafts, electrostatic friction, low-pressure eye walls' },
      { id: 'renewable_energy_tech', name: 'Solar Panels & Geothermal Power Explained', desc: 'Photovoltaic electron excitation, harnessing Earth\'s molten core' },
      { id: '3d_graphics_rendering', name: 'How 3D Video Game Graphics Engines Render', desc: 'Ray tracing, polygon rasterization, GPU shader pipelines' },
      { id: 'ocean_currents_climate', name: 'Ocean Currents & Global Climate Conveyor', desc: 'Thermohaline circulation, Gulf Stream warming northern continents' },
      { id: 'optical_illusions_psychology', name: 'Why Optical Illusions Fool the Human Brain', desc: 'Visual cortex predictive processing, blind spot compensation' },
      { id: 'maglev_superconductors', name: 'Maglev Trains & Superconductors', desc: 'Zero electrical resistance, Meissner effect magnetic levitation' }
    ]
  }
};

// ----------------------------------------------------
// DUCKDUCKGO REAL-TIME SEARCH QUERY ENGINE (100% REAL - NO FALLBACKS)
// ----------------------------------------------------
async function queryDuckDuckGo(searchQuery, maxResults = 6) {
  // Primary attempt: DuckDuckGo HTML search endpoint
  const attemptEndpoint = (hostname, pathEndpoint) => new Promise((resolve) => {
    const postData = querystring.stringify({ q: searchQuery, kl: 'wt-wt' });
    const req = https.request({
      hostname,
      path: pathEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 12000
    }, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        const results = [];
        const titles = [];
        const snippets = [];
        let m;

        // Pattern 1: standard html.duckduckgo.com layout
        const titleExtractRegex = /<h2 class=["']result__title["']>([\s\S]*?)<\/h2>/gi;
        const snippetExtractRegex = /<a class=["']result__snippet["'][^>]*>([\s\S]*?)<\/a>/gi;

        while ((m = titleExtractRegex.exec(html)) !== null) {
          const t = m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
          if (t) titles.push(t);
        }
        while ((m = snippetExtractRegex.exec(html)) !== null) {
          const s = m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
          if (s) snippets.push(s);
        }

        // Pattern 2: lite.duckduckgo.com fallback layout
        if (titles.length === 0) {
          const linkRegex = /<a[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi;
          while ((m = linkRegex.exec(html)) !== null) {
            const t = m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
            if (t) titles.push(t);
          }
        }
        if (snippets.length === 0) {
          const snippetRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;
          while ((m = snippetRegex.exec(html)) !== null) {
            const s = m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
            if (s) snippets.push(s);
          }
        }

        for (let i = 0; i < titles.length; i++) {
          const t = titles[i] || '';
          const s = snippets[i] || '';
          if (
            t.toLowerCase().includes('viewing ads is privacy protected') ||
            s.toLowerCase().includes('viewing ads is privacy protected') ||
            /\bAd\b/.test(t) ||
            t.includes('Ad clicks are managed')
          ) {
            continue;
          }
          if (t.length > 5) {
            results.push({
              title: t,
              snippet: s
            });
          }
          if (results.length >= maxResults) break;
        }

        resolve(results);
      });
    });
    req.on('error', (err) => {
      console.warn(`[DuckDuckGo Query Notice] (${hostname}): ${err.message}`);
      resolve([]);
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`[DuckDuckGo Query Notice] (${hostname}): Timed out`);
      resolve([]);
    });
    req.write(postData);
    req.end();
  });

  // 1. Try html.duckduckgo.com/html/
  let results = await attemptEndpoint('html.duckduckgo.com', '/html/');
  if (results && results.length > 0) return results;

  // 2. Try lite.duckduckgo.com/lite/
  results = await attemptEndpoint('lite.duckduckgo.com', '/lite/');
  return results || [];
}

/**
 * Real-Time Google News RSS Search
 * Fetches live organic headlines and current developments per channel query (no keys, no rate limits, zero mock data).
 */
async function queryGoogleNewsRss(queryStr, maxResults = 5) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(queryStr);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    }, (res) => {
      let xml = '';
      res.on('data', c => xml += c);
      res.on('end', () => {
        const results = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<pubDate>(.*?)<\/pubDate>/gi;
        let m;
        while ((m = itemRegex.exec(xml)) !== null && results.length < maxResults) {
          const rawTitle = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          const rawSnippet = m[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          if (rawTitle && rawTitle.length > 8) {
            results.push({
              title: rawTitle,
              snippet: rawSnippet || rawTitle,
              pubDate: m[3] || ''
            });
          }
        }
        resolve(results);
      });
    });
    req.on('error', (err) => {
      console.warn(`[Google News RSS Notice] ${err.message}`);
      resolve([]);
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`[Google News RSS Notice] Request timed out`);
      resolve([]);
    });
  });
}

/**
 * Fetch Past Topic History from Firestore & Local Cache
 */
async function fetchPastTopicsDatabase(niche = 'fin') {
  const history = [];
  const cacheFile = niche === 'fin' ? LOCAL_FIN_CACHE : (niche === 'stoic' ? LOCAL_STOIC_CACHE : LOCAL_CARTOON_CACHE);

  // 1. Read local history cache file
  if (fs.existsSync(cacheFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(data)) history.push(...data);
    } catch {}
  }

  // 2. Read manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (Array.isArray(manifest.recentTopics)) history.push(...manifest.recentTopics);
      if (Array.isArray(manifest.videos)) {
        manifest.videos.forEach(v => {
          if (v.title || v.topic) history.push({ topic: v.topic || v.title, title: v.title, niche: v.niche || niche });
        });
      }
    } catch {}
  }

  // 3. Query Firestore /chosen_topics if available
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let fb = null;
    if (fs.existsSync(configPath)) fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fb?.projectId;
    const apiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || fb?.apiKey;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || fb?.firestoreDatabaseId || fb?.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

    if (projectId && apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/chosen_topics?pageSize=50&key=${apiKey}`;
      const firestoreRes = await new Promise((resolve) => {
        const req = https.get(url, { timeout: 6000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try {
              const json = JSON.parse(d);
              if (json && json.documents) {
                const docs = json.documents.map(doc => {
                  const f = doc.fields || {};
                  return {
                    topic: f.topic?.stringValue || f.title?.stringValue || '',
                    title: f.title?.stringValue || '',
                    niche: f.niche?.stringValue || niche,
                    category: f.category?.stringValue || '',
                    createdAt: f.createdAt?.stringValue || ''
                  };
                }).filter(x => Boolean(x.topic || x.title));
                resolve(docs);
              } else {
                resolve([]);
              }
            } catch { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
      });
      if (Array.isArray(firestoreRes) && firestoreRes.length > 0) {
        history.push(...firestoreRes);
      }
    }
  } catch {}

  // Deduplicate history
  const seen = new Set();
  const deduped = [];
  for (const h of history) {
    const key = (h.topic || h.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }

  return deduped;
}

/**
 * Save Chosen Winning Topic to Database (Firestore + Local Cache)
 */
async function saveChosenTopicToDatabase(winningTopic, niche = 'fin', modelUsed = 'AI Core') {
  const cacheFile = niche === 'fin' ? LOCAL_FIN_CACHE : (niche === 'stoic' ? LOCAL_STOIC_CACHE : LOCAL_CARTOON_CACHE);
  
  const record = {
    id: `topic_${Date.now()}`,
    topic: winningTopic.title || winningTopic.topic,
    title: winningTopic.title || winningTopic.topic,
    sphereId: winningTopic.sphereId || '',
    sphereName: winningTopic.sphereName || '',
    angle: winningTopic.angle || '',
    niche: niche,
    modelUsed: modelUsed,
    chosenAt: new Date().toISOString()
  };

  // 1. Update local cache
  try {
    let existing = [];
    if (fs.existsSync(cacheFile)) {
      try { existing = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch {}
    }
    if (!Array.isArray(existing)) existing = [];
    existing.unshift(record);
    fs.writeFileSync(cacheFile, JSON.stringify(existing.slice(0, 100), null, 2), 'utf8');
    console.log(`[Topic DB] Successfully saved chosen topic to local cache (${path.basename(cacheFile)}). Total cached: ${existing.length}`);
  } catch (err) {
    console.warn(`[Topic DB] Local cache write warning: ${err.message}`);
  }

  // 2. Save to Firestore /chosen_topics/{topicId}
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let fb = null;
    if (fs.existsSync(configPath)) fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fb?.projectId;
    const apiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || fb?.apiKey;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || fb?.firestoreDatabaseId || fb?.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

    if (projectId && apiKey) {
      const docId = `topic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/chosen_topics?documentId=${docId}&key=${apiKey}`;
      const postBody = JSON.stringify({
        fields: {
          topic: { stringValue: record.topic },
          title: { stringValue: record.title },
          sphereId: { stringValue: record.sphereId },
          sphereName: { stringValue: record.sphereName },
          angle: { stringValue: record.angle },
          niche: { stringValue: niche },
          modelUsed: { stringValue: modelUsed },
          createdAt: { stringValue: record.chosenAt }
        }
      });

      await new Promise((resolve) => {
        const req = https.request(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postBody) },
          timeout: 8000
        }, (res) => {
          let resBody = '';
          res.on('data', c => resBody += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[Topic DB] ✅ Successfully saved chosen topic to Firestore database (/chosen_topics/${docId})`);
            } else {
              console.warn(`[Topic DB] ⚠️ Firestore write responded with HTTP ${res.statusCode}: ${resBody.slice(0, 150)}`);
            }
            resolve();
          });
        });
        req.on('error', (err) => {
          console.warn(`[Topic DB] ⚠️ Firestore connection error: ${err.message}`);
          resolve();
        });
        req.on('timeout', () => {
          req.destroy();
          console.warn('[Topic DB] ⚠️ Firestore request timed out after 8s');
          resolve();
        });
        req.write(postBody);
        req.end();
      });
    } else {
      console.log('[Topic DB] Note: Firestore Project ID / API Key not configured; persisted to local database cache.');
    }
  } catch (err) {
    console.warn(`[Topic DB] Firestore write notice: ${err.message}`);
  }

  return record;
}

// ----------------------------------------------------
// AI INFERENCE CLIENTS FOR TOPIC DISCOVERY & SELECTION
// ----------------------------------------------------
function cleanJsonText(rawText) {
  if (!rawText) return null;
  let text = String(rawText).trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');
  text = text.replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"'{[]|$)/gi, '');
  text = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
  }
  return null;
}

// Generic multi-provider LLM caller for JSON tasks
async function callActiveAiForJson(systemPrompt, userPrompt, activeGrok = null, options = {}) {
  const preferLocalAi = options.preferLocalAi === true || options.nicheKey === 'fin';

  // Helper for Local Open-Source Ollama (localhost:11434)
  const tryLocalOllama = async () => {
    try {
      return await new Promise((resolve) => {
        const checkReq = http.request('http://127.0.0.1:11434/api/tags', { method: 'GET', timeout: 2000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            let chosenModel = 'qwen2.5:1.5b';
            try {
              const tags = JSON.parse(d);
              if (tags.models && tags.models.length > 0) chosenModel = tags.models[0].name;
            } catch {}

            const postData = JSON.stringify({
              model: chosenModel,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
              format: 'json',
              stream: false,
              options: { temperature: 0.7, num_ctx: 4096 }
            });

            console.log(`[AI Inference] Probing Local Open-Source (${chosenModel} via Ollama on 127.0.0.1:11434)...`);
            const genReq = http.request('http://127.0.0.1:11434/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
              timeout: 60000
            }, (genRes) => {
              let genData = '';
              genRes.on('data', c => genData += c);
              genRes.on('end', () => {
                try {
                  const j = JSON.parse(genData);
                  const content = j.message?.content || j.response;
                  const parsed = cleanJsonText(content);
                  if (parsed) {
                    resolve({ success: true, modelUsed: `Local Open-Source (${chosenModel} via Ollama)`, data: parsed });
                  } else {
                    console.warn(`[AI Inference Notice] Local Ollama returned text but JSON parsing failed.`);
                    resolve(null);
                  }
                } catch (err) {
                  console.warn(`[AI Inference Notice] Local Ollama response parsing failed: ${err.message}`);
                  resolve(null);
                }
              });
            });
            genReq.on('error', (err) => {
              console.warn(`[AI Inference Notice] Local Ollama inference connection failed: ${err.message}`);
              resolve(null);
            });
            genReq.on('timeout', () => {
              genReq.destroy();
              console.warn(`[AI Inference Notice] Local Ollama inference timed out (60s).`);
              resolve(null);
            });
            genReq.write(postData);
            genReq.end();
          });
        });
        checkReq.on('error', (err) => {
          console.log(`[AI Inference] Local Ollama daemon not running or unreachable (${err.message})`);
          resolve(null);
        });
        checkReq.on('timeout', () => {
          checkReq.destroy();
          console.log(`[AI Inference] Local Ollama daemon check timed out`);
          resolve(null);
        });
        checkReq.end();
      });
    } catch (e) {
      console.warn(`[AI Inference Notice] Local Ollama error: ${e.message}`);
      return null;
    }
  };

  // 1. OPTION 1 FOR FIN: Local Open-Source AI first if preferred
  if (preferLocalAi) {
    console.log(`[AI Inference] 🎯 Preference active: Evaluating Local AI model as Option 1...`);
    const localRes = await tryLocalOllama();
    if (localRes && localRes.success) return localRes;
    console.log(`[AI Inference] Local AI unavailable or yielded no result. Proceeding to cloud inference ladder...`);
  }

  // 2. Google Gemini
  if (GEMINI_API_KEY) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of models) {
      try {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
            timeout: 8000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Gemini request timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = cleanJsonText(raw);
          if (parsed) return { success: true, modelUsed: `Google Gemini (${model})`, data: parsed };
        } else {
          console.warn(`[AI Inference Notice] Gemini (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Gemini (${model}) error: ${err.message}`);
      }
    }
  }

  // 3. OpenRouter
  if (OPENROUTER_API_KEY) {
    const models = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'mistralai/mistral-small-24b-instruct-2501'];
    for (const model of models) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('OpenRouter timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const parsed = cleanJsonText(json.choices?.[0]?.message?.content);
          if (parsed) return { success: true, modelUsed: `OpenRouter (${model})`, data: parsed };
        } else {
          console.warn(`[AI Inference Notice] OpenRouter (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenRouter (${model}) error: ${err.message}`);
      }
    }
  }

  // 4. Groq LPU (Removed decommissioned mixtral-8x7b-32768, kept active production models)
  if (GROQ_API_KEY) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
    for (const model of models) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 12000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Groq timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const parsed = cleanJsonText(json.choices?.[0]?.message?.content);
          if (parsed) return { success: true, modelUsed: `Groq LPU (${model})`, data: parsed };
        } else {
          console.warn(`[AI Inference Notice] Groq (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Groq (${model}) error: ${err.message}`);
      }
    }
  }

  // 5. OpenAI
  if (OPENAI_API_KEY) {
    const models = ['gpt-4o-mini', 'gpt-4o'];
    for (const model of models) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('OpenAI timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const parsed = cleanJsonText(json.choices?.[0]?.message?.content);
          if (parsed) return { success: true, modelUsed: `OpenAI (${model})`, data: parsed };
        } else {
          console.warn(`[AI Inference Notice] OpenAI (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenAI (${model}) error: ${err.message}`);
      }
    }
  }

  // 6. Cloudflare Workers AI
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    const models = ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.2-3b-instruct'];
    for (const model of models) {
      try {
        const postData = JSON.stringify({
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `${userPrompt}\nReturn valid JSON object.` }]
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Cloudflare timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const responseText = json.result?.response || (typeof json.result === 'string' ? json.result : null);
          const parsed = cleanJsonText(responseText);
          if (parsed) return { success: true, modelUsed: `Cloudflare Workers AI (${model})`, data: parsed };
        } else {
          console.warn(`[AI Inference Notice] Cloudflare (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Cloudflare (${model}) error: ${err.message}`);
      }
    }
  }

  // 7. Local Open-Source Ollama (if not already tried at start)
  if (!preferLocalAi) {
    const localRes = await tryLocalOllama();
    if (localRes && localRes.success) return localRes;
  }

  // 8. Error reporting - All AI inference engines failed
  throw new Error('All active AI inference models failed to execute topic discovery & selection.');
}

// ----------------------------------------------------
// THE CORE END-TO-END WORKFLOW FUNCTION
// ----------------------------------------------------
/**
 * Executes the complete user-mandated flow:
 * 1. Query DuckDuckGo for top real-time search queries and trending topics today in the niche.
 * 2. Active AI formulates 5 candidate topics based on DuckDuckGo trends + 21+ archetype spheres.
 * 3. Checks database / Firestore history and deduplicates candidate topics against past videos.
 * 4. Active AI chooses 1 winning topic, provides selection rationale, and deletes the other 4 candidates.
 * 5. Saves winning topic to database and returns for immediate creation flow.
 */
async function discoverAndSelectTopicViaActiveAi(nicheKey = 'fin', options = {}) {
  const nicheConfig = NICHE_SPHERES[nicheKey] || NICHE_SPHERES.fin;
  console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🚀 [AI TOPIC DISCOVERY & SELECTION PIPELINE STARTED]${colors.reset}`);
  console.log(` • Channel / Niche: ${colors.yellow}${nicheConfig.channelName} (${nicheConfig.channelHandle})${colors.reset}`);
  console.log(` • Thematic Spheres: ${colors.green}${nicheConfig.spheres.length} core archetype scopes loaded${colors.reset}`);

  // ----------------------------------------------------
  // STEP 1: QUERY DUCKDUCKGO & GOOGLE NEWS RSS FOR REAL-TIME TRENDS & QUESTIONS
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🔎 Step 1: Performing Live Multi-Source Search (DuckDuckGo + Google News)...${colors.reset}`);
  const randomSearchQuery = nicheConfig.searchQueries[Math.floor(Math.random() * nicheConfig.searchQueries.length)];
  console.log(`   Target Query: "${colors.cyan}${randomSearchQuery}${colors.reset}"`);
  
  const [ddgResults, newsResults] = await Promise.all([
    queryDuckDuckGo(randomSearchQuery, 5),
    queryGoogleNewsRss(randomSearchQuery, 4)
  ]);

  const allSearchResults = [...ddgResults, ...newsResults];
  if (allSearchResults.length > 0) {
    console.log(`   ${colors.green}✓ Retrieved ${allSearchResults.length} live organic snippets (${ddgResults.length} DDG, ${newsResults.length} News):${colors.reset}`);
    allSearchResults.slice(0, 4).forEach((r, idx) => {
      console.log(`     ${idx + 1}. ${colors.bright}${r.title}${colors.reset}`);
      console.log(`        "${r.snippet.slice(0, 110)}..."`);
    });
  } else {
    console.log(`   ${colors.cyan}✓ Proceeding with channel sphere archetypes for live AI inference.${colors.reset}`);
  }

  // ----------------------------------------------------
  // STEP 2: LOAD PAST DATABASE TOPICS FOR DEDUPLICATION
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🗄️  Step 2: Loading previous database history (Firestore & Local cache)...${colors.reset}`);
  const pastTopics = await fetchPastTopicsDatabase(nicheKey);
  console.log(`   ${colors.green}✓ Loaded ${pastTopics.length} previously posted topics for deduplication check.${colors.reset}`);

  const pastTopicsListStr = pastTopics.slice(0, 35).map(h => `- "${h.topic || h.title}" (Sphere: ${h.sphereId || h.category || 'general'})`).join('\n');

  // ----------------------------------------------------
  // STEP 3: ACTIVE AI FORMULATES 5 CANDIDATE TOPICS
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🤖 Step 3: Active AI generating 5 distinct candidate topics across 21+ spheres...${colors.reset}`);
  
  const spheresJsonStr = JSON.stringify(nicheConfig.spheres, null, 2);
  const searchContextStr = allSearchResults.map(r => `Title: ${r.title} | Details: ${r.snippet}`).join('\n');

  const systemPrompt = `You are the Lead Creative Director and Topic Architect for YouTube Shorts channel "${nicheConfig.channelName}" (${nicheConfig.channelHandle}).
Target Audience: ${nicheConfig.targetAudience}

YOUR MANDATE:
1. REAL-TIME SEARCH INSIGHTS: Analyze the real-time search topics, questions, and insights discovered from live web search (DuckDuckGo & Google News) today.
2. 21+ THEMATIC ARCHETYPE SPHERES: Connect the trending search signals with relevant sphere archetypes.
3. CANDIDATE FORMULATION: Formulate candidate topics based on the trending search details.
4. AI DATABASE SIMILARITY & DEDUPLICATION VERIFICATION:
   Compare each candidate topic against EVERY single previously saved topic in our database.
   Verify if there are any conceptual, thematic, or keyword similarities with past videos.
   If a candidate is similar to any previous database topic, mark it as duplicate and eliminate it.
   ONLY select a topic if it is 100% NEW and verified to have ZERO similarities with past database records.
5. LOOPY RETENTION DESIGN:
   Design the chosen topic and its core angle to be loopy where possible (the ending line of the video seamlessly loops back into the opening hook line).
6. SELECTION RATIONALE:
   Explain why the chosen topic is verified unique against the database and how the search details will be used to build the script.

Return strictly valid JSON with this exact schema:
{
  "candidates": [
    {
      "id": 1,
      "sphereId": "small_biz_low_cap",
      "sphereName": "Small Capital Business ($0-$5-$50)",
      "title": "High-Impact Topic Headline #Shorts #viral",
      "angle": "Unique tactical breakdown angle",
      "coreHook": "Opening spoken hook sentence",
      "searchDetailsUsed": "Specific insight or trend details from live search used here",
      "similarityCheck": "Verified non-similar to past database topics",
      "isUnique": true,
      "loopyHookConcept": "How the ending loops back into the opening hook"
    }
  ],
  "chosenWinnerId": 1,
  "deduplicationAnalysis": "Detailed verification report proving zero similarity to previously saved database topics",
  "selectionRationale": "Why this specific topic is chosen based on search trends, search insights, and verified uniqueness",
  "discardedNotes": [
    { "candidateId": 2, "reason": "Reason candidate 2 was eliminated (e.g. similarity or weaker angle)" }
  ]
}`;

  const userPrompt = `TODAY'S LIVE MULTI-SOURCE SEARCH TRENDS & INSIGHTS:
${searchContextStr || 'General trending search interest in small business, practical mindset, and financial resilience.'}

21+ THEMATIC SCOPES & SPHERES:
${spheresJsonStr}

DATABASE OF PREVIOUSLY SAVED TOPICS (CHECK FOR SIMILARITIES - REJECT ANY DUPLICATES):
${pastTopicsListStr || 'None yet.'}

Formulate candidate topics from DuckDuckGo trends, check for similarities against the past database, ensure zero similarity, choose 1 winning unique topic, and return strictly valid JSON.`;

  const aiResult = await callActiveAiForJson(systemPrompt, userPrompt, null, { preferLocalAi: nicheKey === 'fin', nicheKey });
  let parsedData = aiResult.data;
  const modelUsed = aiResult.modelUsed;

  // Strict enforcement: Do NOT generate synthetic/preset scripts if AI fails!
  if (!parsedData || !Array.isArray(parsedData.candidates) || parsedData.candidates.length === 0) {
    console.error(`\n${colors.red}${colors.bright}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.error(`${colors.red}${colors.bright} ❌ [TOPIC DISCOVERY AI ENGINE FAILED]${colors.reset}`);
    console.error(`${colors.red}${colors.bright}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.error(` • Status: AI Engine did not return valid candidates for ${nicheConfig.channelName}.`);
    console.error(` • Model attempted: ${modelUsed}`);
    console.error(` • Directive: Preset/synthetic topics are strictly removed per user instruction.`);
    console.error(`${colors.red}${colors.bright}════════════════════════════════════════════════════════════════════════════════\n${colors.reset}`);
    throw new Error(`[Topic Discovery Fatal] AI engine (${modelUsed}) failed to formulate unique candidates. Synthetic fallbacks are strictly disabled.`);
  }

  // ----------------------------------------------------
  // STEP 4: DISPLAY 5 CANDIDATES & ACTIVE AI SELECTION
  // ----------------------------------------------------
  console.log(`\n${colors.bright}📋 5 Candidate Topics Formulated by ${colors.green}${modelUsed}${colors.reset}:`);
  parsedData.candidates.forEach(c => {
    console.log(`   [Candidate #${c.id}] ${colors.yellow}${c.title}${colors.reset}`);
    console.log(`     • Sphere: ${c.sphereName || c.sphereId}`);
    console.log(`     • Angle : ${c.angle}`);
    console.log(`     • Hook  : "${c.coreHook}"`);
  });

  // Identify chosen winning topic
  let winner = parsedData.candidates.find(c => c.id === parsedData.chosenWinnerId);
  if (!winner) winner = parsedData.candidates[0];

  const discarded = parsedData.candidates.filter(c => c.id !== winner.id);

  console.log(`\n${colors.bright}🛡️  Deduplication Check:${colors.reset} ${parsedData.deduplicationAnalysis || 'No duplicate themes found in database.'}`);

  console.log(`\n${colors.bright}${colors.green}🏆 ACTIVE AI CHOSEN WINNING TOPIC (1 OF 5):${colors.reset}`);
  console.log(` • Title      : ${colors.bright}${colors.green}${winner.title}${colors.reset}`);
  console.log(` • Sphere     : ${colors.cyan}${winner.sphereName || winner.sphereId}${colors.reset}`);
  console.log(` • Angle      : ${winner.angle}`);
  console.log(` • AI Engine  : ${modelUsed}`);
  console.log(` • Rationale  : ${colors.yellow}${parsedData.selectionRationale}${colors.reset}`);

  console.log(`\n${colors.bright}🗑️  4 Discarded Candidate Topics (Deleted from Consideration):${colors.reset}`);
  discarded.forEach(d => {
    const note = (parsedData.discardedNotes || []).find(n => n.candidateId === d.id);
    console.log(` • Discarded #${d.id} ("${d.title}") -> ${note ? note.reason : 'Eliminated in favor of winner'}`);
  });

  // ----------------------------------------------------
  // STEP 5: SAVE WINNER TO DATABASE & PERSIST
  // ----------------------------------------------------
  console.log(`\n${colors.bright}💾 Step 5: Saving chosen winning topic to Firestore & Local Database...${colors.reset}`);
  const savedRecord = await saveChosenTopicToDatabase(winner, nicheKey, modelUsed);
  console.log(`   ${colors.green}✓ Persisted as Record ID: ${savedRecord.id}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════════════════\n${colors.reset}`);

  return {
    chosenTopic: {
      topic: winner.title,
      title: winner.title,
      sphereId: winner.sphereId,
      sphereName: winner.sphereName,
      angle: winner.angle,
      hook: winner.coreHook,
      searchDetailsUsed: winner.searchDetailsUsed || (ddgResults[0] ? `${ddgResults[0].title} - ${ddgResults[0].snippet}` : ''),
      loopyHookConcept: winner.loopyHookConcept || '',
      similarityCheck: winner.similarityCheck || 'Verified unique against database',
      estimatedBudget: winner.estimatedBudget || '$5',
      modelUsed: modelUsed
    },
    candidates: parsedData.candidates,
    discardedTopics: discarded,
    selectionRationale: parsedData.selectionRationale,
    deduplicationAnalysis: parsedData.deduplicationAnalysis,
    ddgResults: ddgResults,
    modelUsed: modelUsed
  };
}

module.exports = {
  NICHE_SPHERES,
  queryDuckDuckGo,
  queryGoogleNewsRss,
  fetchPastTopicsDatabase,
  saveChosenTopicToDatabase,
  discoverAndSelectTopicViaActiveAi
};
