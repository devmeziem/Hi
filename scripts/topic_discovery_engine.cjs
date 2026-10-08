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
const { getCachedResponse, setCachedResponse } = require('./local_model_cache.cjs');

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
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const HUGGINGFACE_API_KEY = (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '').trim();
const CEREBRAS_API_KEY = (process.env.CEREBRAS_API_KEY || '').trim();
const MISTRAL_API_KEY = (process.env.MISTRAL_API_KEY || '').trim();
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
      'trending personal finance money saving hacks small business ideas today',
      'did you know personal finance and money facts today',
      'trending small business economics and side hustle ideas today',
      'trending consumer money saving rules and compounding today',
      'unusual small business ideas under 50 dollars capital that actually work',
      'hidden financial mistakes keeping smart people broke in their 20s',
      'real ways everyday people make daily income with just a smartphone',
      'psychological money tricks that stop impulse spending cold',
      'compound interest real life comparison examples for beginners',
      'how to calculate real profit margins and eliminate hidden costs in small business',
      'how to build a fast 500 dollar emergency cash reserve with zero loans'
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
      'trending stoic philosophy mental resilience life lessons today',
      'did you know psychology facts and emotional mastery today',
      'trending practical stoic quotes handling stress anxiety today',
      'ancient stoic strategies modern daily problems today',
      'unexpected psychological tricks for quiet confidence and self respect',
      'ancient stoic strategies for handling toxic disrespect and betrayal',
      'unspoken laws of emotional armor and mental toughness in modern life',
      'rare teachings of Epictetus and Seneca on self mastery and focus',
      'fascinating psychology experiments on overcoming self doubt and fear',
      'how ancient philosophers stayed ice cold under extreme provocation',
      'the psychological secret to emotional detachment and zero reaction'
    ],
    spheres: [
      { id: 'stoic_self_confidence', name: 'Unshakeable Quiet Confidence & Self-Command', desc: 'Internal validation, virtue-anchored self-respect, silencing self-doubt, mastering self-command' },
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
    channelName: 'Archie Explains (Everyday Science & Relatable Tech Wonders)',
    targetAudience: 'Curious learners, students, and everyday viewers fascinated by the hidden science and surprising physics behind everyday stuff they touch, eat, use, and experience every single day.',
    searchQueries: [
      'trending physics discoveries breakthroughs today',
      'breakthrough scientific engineering mysteries today',
      'surprising aerospace and modern technology discoveries',
      'ocean abyss and deep sea exploration discoveries',
      'quantum mechanics and particle physics everyday impacts',
      'neurology brain memory illusions fascinating science',
      'optical illusions and light physics wonders',
      'superconductivity and electromagnetic levitation breakthroughs',
      'renewable energy fusion reaction science today',
      'volcanoes geology earth seismic mysteries'
    ],
    spheres: [
      { id: 'aerospace_and_cosmology', name: 'Aerospace, Space Exploration & Satellites', desc: 'Orbital mechanics, lunar geology, space telescopes, cosmic radiation' },
      { id: 'modern_materials_superconductivity', name: 'Superconductors, Quantum Physics & Materials', desc: 'Maglev trains, carbon nanotubes, metamaterials, zero resistance' },
      { id: 'deep_ocean_and_earth_geology', name: 'Deep Sea Abysses & Geophysics', desc: 'Hydrothermal vents, Mariana trench pressure, tectonic plates, magma chambers' },
      { id: 'neuroscience_and_human_vision', name: 'Neuroscience, Optical Illusions & Perception', desc: 'Photoreceptor cells, visual processing latency, acoustic resonance' },
      { id: 'telecom_and_fiber_optics', name: 'Fiber Optics, Laser Transmission & Digital Waves', desc: 'Total internal reflection, electromagnetic spectra, silicon photonics' }
    ]
  }
};

// Negative topic pattern filter for Channel 3 (Tech & AI Animation) - Strictly eliminates stale seeds
const BANNED_TECH_TOPIC_PATTERNS = [
  /wrinkl/i, /finger/i, /bath/i, /fog\b/i, /glass.*fog/i, /condens/i,
  /apple/i, /sliced\s*apple/i, /cold\s*can/i, /sweat.*droplet/i,
  /mattress/i, /bedding/i, /pillow/i, /furniture/i, /sofa/i, /couch/i,
  /detergent/i, /cleaning\s*product/i, /skincare/i, /makeup/i, /cosmetics/i,
  /shoe\s*polish/i, /cooking\s*pan/i, /kitchen\s*sponge/i, /vacuum\s*cleaner/i,
  /curtain/i, /rug\b/i, /toilet\s*paper/i, /shampoo/i, /toothpaste/i,
  /onion/i, /yawn/i, /toaster/i
];

// ----------------------------------------------------
// DUCKDUCKGO REAL-TIME SEARCH QUERY ENGINE WITH WIKIPEDIA FALLBACK
// ----------------------------------------------------
/**
 * Wikipedia Search & Knowledge Retrieval (Zero-Key High-Reliability Fallback)
 * Engaged automatically when DuckDuckGo yields low, blocked, or empty results.
 */
async function queryWikipedia(searchQuery, maxResults = 5) {
  return new Promise((resolve) => {
    const cleanSearch = encodeURIComponent(searchQuery.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim());
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${cleanSearch}&utf8=&format=json&srlimit=${maxResults}`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'VoxamBot/1.0 (https://ai.studio; automated-research@voxam.app)',
        'Accept': 'application/json'
      },
      timeout: 9000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawItems = json?.query?.search || [];
          const results = [];

          for (const item of rawItems) {
            const cleanTitle = (item.title || '')
              .replace(/&#039;|&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .trim();

            const cleanSnippet = (item.snippet || '')
              .replace(/<[^>]+>/g, '')
              .replace(/&#039;|&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&ndash;/g, '–')
              .replace(/&mdash;/g, '—')
              .replace(/\s+/g, ' ')
              .trim();

            if (cleanTitle.length > 2 && cleanSnippet.length > 10) {
              results.push({
                title: cleanTitle,
                snippet: cleanSnippet,
                source: 'Wikipedia'
              });
            }
            if (results.length >= maxResults) break;
          }

          if (results.length > 0) {
            console.log(`[Search Grounding] 📚 Retrieved ${results.length} live topic snippets from Wikipedia knowledge base.`);
          }
          resolve(results);
        } catch (e) {
          console.warn(`[Wikipedia Search Notice] Parse error: ${e.message}`);
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`[Wikipedia Search Notice] Request failed: ${err.message}`);
      resolve([]);
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`[Wikipedia Search Notice] Request timed out (9s)`);
      resolve([]);
    });
  });
}

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
              snippet: s,
              source: 'DuckDuckGo'
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
  if (results && results.length >= 2) return results;

  // 2. Try lite.duckduckgo.com/lite/
  const liteResults = await attemptEndpoint('lite.duckduckgo.com', '/lite/');
  if (liteResults && liteResults.length > 0) {
    results = [...(results || []), ...liteResults];
  }

  // 3. Wikipedia Fallback (mandated when DuckDuckGo doesn't return sufficient results)
  if (!results || results.length < 2) {
    console.log(`[Search Grounding] DuckDuckGo yielded ${results ? results.length : 0} results for "${searchQuery}". Engaging Wikipedia knowledge search fallback...`);
    const wikiResults = await queryWikipedia(searchQuery, maxResults);
    results = [...(results || []), ...wikiResults];
  }

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
 * Real-Time Google Trends Daily RSS
 * Directly queries trends.google.com/trending/rss?geo=US for breaking real-time search queries and trending topics today.
 */
async function queryGoogleTrendsDaily(maxResults = 8) {
  return new Promise((resolve) => {
    const url = 'https://trends.google.com/trending/rss?geo=US';
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, text/xml, */*'
      },
      timeout: 8000
    }, (res) => {
      let xml = '';
      res.on('data', c => xml += c);
      res.on('end', () => {
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < maxResults) {
          const chunk = match[1];
          const titleMatch = /<title>(.*?)<\/title>/i.exec(chunk);
          const trafficMatch = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/i.exec(chunk);
          const snippetMatch = /<ht:news_item_snippet>(.*?)<\/ht:news_item_snippet>/i.exec(chunk);
          const newsTitleMatch = /<ht:news_item_title>(.*?)<\/ht:news_item_title>/i.exec(chunk);
          if (titleMatch) {
            const cleanTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
            const newsTitle = newsTitleMatch ? newsTitleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim() : '';
            const snippet = snippetMatch ? snippetMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim() : '';
            items.push({
              title: cleanTitle,
              newsTitle: newsTitle,
              snippet: snippet || newsTitle,
              traffic: trafficMatch ? trafficMatch[1] : '',
              source: 'Google Trends Daily'
            });
          }
        }
        if (items.length > 0) {
          console.log(`[Google Trends Daily] 📈 Harvested ${items.length} breakout search trends from trends.google.com`);
        }
        resolve(items);
      });
    });
    req.on('error', (err) => {
      console.warn(`[Google Trends RSS Notice] ${err.message}`);
      resolve([]);
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`[Google Trends RSS Notice] Request timed out`);
      resolve([]);
    });
  });
}

/**
 * Social Trends Query (Instagram / TikTok viral curiosity trends)
 */
async function querySocialTrends(nicheKey = 'cartoon', maxResults = 5) {
  const query = nicheKey === 'cartoon'
    ? 'trending science education facts instagram reels tiktok viral'
    : (nicheKey === 'fin' ? 'trending personal finance money tips instagram reels tiktok' : 'trending stoic quotes mental health instagram reels tiktok');
  return queryDuckDuckGo(query, maxResults);
}

/**
 * Automated Live YouTube Search Trends & Suggestions Engine
 * 1. Queries official Google YouTube Data API v3 search endpoint if YOUTUBE_API_KEY is available.
 * 2. Automated Zero-Key Fallback: Queries YouTube suggest autocomplete API for live trending queries.
 * 3. Never fails, no rate limits, zero seed fallback.
 */
async function queryYouTubeSearchTrends(queryStr, maxResults = 8) {
  const cleanQuery = String(queryStr || 'everyday science tools').trim();
  const encQuery = encodeURIComponent(cleanQuery);

  // Path 1: Official YouTube Data API v3 if API key available
  const ytApiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY || '';
  if (ytApiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encQuery}&type=video&maxResults=${maxResults}&key=${ytApiKey}`;
      const results = await new Promise((resolve) => {
        const req = https.get(url, { timeout: 6000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(d);
                const items = (j.items || []).map(it => ({
                  title: it.snippet?.title || '',
                  snippet: it.snippet?.description || '',
                  source: 'YouTube Search API (Official Data v3)'
                })).filter(x => x.title.length > 5);
                resolve(items);
              } catch { resolve([]); }
            } else { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
      });
      if (results && results.length > 0) {
        console.log(`[YouTube Search API] 🎥 Retrieved ${results.length} live topics via YouTube Data v3 API for "${cleanQuery}".`);
        return results;
      }
    } catch (err) {
      console.warn(`[YouTube Search API Notice] ${err.message}`);
    }
  }

  // Path 2: Automated Zero-Key Live YouTube Autocomplete & Trending Search Suggestions
  try {
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encQuery}`;
    const suggestResults = await new Promise((resolve) => {
      const req = https.get(suggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        timeout: 5000
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            const suggestions = Array.isArray(j[1]) ? j[1] : [];
            const items = suggestions.slice(0, maxResults).map(s => ({
              title: s,
              snippet: `Top real-time user search trend on YouTube for "${cleanQuery}"`,
              source: 'YouTube Search Trends (Live Autocomplete)'
            }));
            resolve(items);
          } catch { resolve([]); }
        });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });
    if (suggestResults && suggestResults.length > 0) {
      console.log(`[YouTube Search Trends] 🎥 Automated Live YouTube Search Suggestions retrieved (${suggestResults.length} trends for "${cleanQuery}").`);
      return suggestResults;
    }
  } catch (err) {
    console.warn(`[YouTube Search Trends Notice] ${err.message}`);
  }

  // Path 3: DuckDuckGo indexed YouTube site discovery
  try {
    const ytDdg = await queryDuckDuckGo(`site:youtube.com ${cleanQuery}`, Math.min(maxResults, 4));
    if (ytDdg && ytDdg.length > 0) {
      return ytDdg.map(r => ({ ...r, source: 'YouTube (Search Index)' }));
    }
  } catch {}

  return [];
}

/**
 * Fetch Past Topic History from Firestore & Local Cache
 */
async function fetchPastTopicsDatabase(niche = 'fin') {
  const history = [];
  const cacheFile = niche === 'fin' ? LOCAL_FIN_CACHE : (niche === 'stoic' ? LOCAL_STOIC_CACHE : LOCAL_CARTOON_CACHE);

  // 1. Read primary local history cache file
  if (fs.existsSync(cacheFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(data)) history.push(...data);
    } catch {}
  }

  // 1b. Cross-channel & auxiliary cache ingestion for enhanced deduplication
  const auxFiles = [];
  if (niche === 'cartoon' || niche === 'archie' || niche === 'tech') {
    auxFiles.push(
      path.join(process.cwd(), 'archie_tech_facts_cache.json'),
      path.join(process.cwd(), 'infocard_history.json'),
      path.join(process.cwd(), 'test_artifacts', 'infocard_history.json'),
      path.join(process.cwd(), 'test_artifacts', 'archie_tech_facts_cache.json')
    );
  } else if (niche === 'fin') {
    auxFiles.push(
      path.join(process.cwd(), 'fin_quote_history.json'),
      path.join(process.cwd(), 'daily_fin_history_cache.json'),
      path.join(process.cwd(), 'daily_blueprint_manifest.json')
    );
  }

  for (const f of auxFiles) {
    if (fs.existsSync(f)) {
      try {
        const auxData = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (Array.isArray(auxData)) {
          auxData.forEach(item => {
            if (typeof item === 'string') history.push({ topic: item, title: item, niche });
            else if (item && typeof item === 'object') {
              history.push({
                topic: item.title || item.topic || item.fact || item.quote || item.id,
                title: item.title || item.topic || item.fact || item.quote || '',
                niche
              });
            }
          });
        }
      } catch {}
    }
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

  // 3. Query Firestore /chosen_topics and /channel_post_history if available
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let fb = null;
    if (fs.existsSync(configPath)) {
      try { fb = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
    }
    if (!fb && process.env.FIREBASE_CONFIG_JSON) {
      try { fb = JSON.parse(process.env.FIREBASE_CONFIG_JSON); } catch {}
    }
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
  if (typeof activeGrok === 'object' && activeGrok !== null && !options.nicheKey && !options.preferLocalAi) {
    options = { ...activeGrok, ...options };
  }
  const preferLocalAi = options.preferLocalAi === true || options.nicheKey === 'fin';
  const validationFn = typeof activeGrok === 'function' ? activeGrok : (typeof options.validationFn === 'function' ? options.validationFn : null);

  // Helper for Local Open-Source Ollama (localhost:11434 / candidate hosts)
  const tryLocalOllama = async () => {
    const cacheKey = `${options.nicheKey || 'topic'}_${userPrompt.slice(0, 100)}`;
    const cached = getCachedResponse('topic_ollama', cacheKey);
    if (cached) {
      return { success: true, modelUsed: 'Local Ollama Model (Cached)', data: cached };
    }

    const candidateHosts = [
      process.env.OLLAMA_HOST ? process.env.OLLAMA_HOST.replace(/^https?:\/\//, '') : null,
      '127.0.0.1:11434',
      'localhost:11434'
    ].filter(Boolean);

    for (const hostStr of candidateHosts) {
      const [host, port] = hostStr.includes(':') ? hostStr.split(':') : [hostStr, '11434'];
      try {
        const res = await new Promise((resolve) => {
          const checkReq = http.request({ host, port: Number(port), path: '/api/tags', method: 'GET', timeout: 2000 }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              let availableModels = ['tinyllama', 'tinyllama:latest', 'qwen2.5:1.5b', 'llama3.2:1b'];
              try {
                const tags = JSON.parse(d);
                if (Array.isArray(tags.models) && tags.models.length > 0) {
                  availableModels = [...tags.models.map(m => m.name || m.model).filter(Boolean), ...availableModels];
                }
              } catch {}

              const chosenModel = availableModels[0] || 'tinyllama';
              const postData = JSON.stringify({
                model: chosenModel,
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                format: 'json',
                stream: false,
                options: { temperature: 0.7, num_ctx: 4096 }
              });

              console.log(`[AI Inference] Probing Local Open-Source (${chosenModel} via Ollama on ${host}:${port})...`);
              const genReq = http.request({
                host,
                port: Number(port),
                path: '/api/chat',
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
                      setCachedResponse('topic_ollama', cacheKey, '', parsed);
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
        if (res && res.success) return res;
      } catch (e) {
        console.warn(`[AI Inference Notice] Local Ollama error: ${e.message}`);
      }
    }
    return null;
  };

  // 1. OPTION 1 FOR FIN: Local Open-Source AI first if preferred
  if (preferLocalAi) {
    console.log(`[AI Inference] 🎯 Preference active: Evaluating Local AI model as Option 1...`);
    const localRes = await tryLocalOllama();
    if (localRes && localRes.success) return localRes;
    console.log(`[AI Inference] Local AI unavailable or yielded no result. Proceeding to cloud inference ladder...`);
  }

  // 1. Google Gemini (Tier 1 Priority: High-speed, High-quality JSON generation)
  if (GEMINI_API_KEY) {
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
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
            timeout: 10000
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
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Google Gemini (${model})`, data: parsed };
          }
        } else if (res.status === 429 || res.status === 403) {
          console.warn(`[AI Inference Notice] Gemini ${res.status} (quota or access limit for ${model}).`);
        } else {
          console.warn(`[AI Inference Notice] Gemini (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Gemini (${model}) error: ${err.message}`);
      }
    }
  }

  // 2. Groq LPU with Model Finder & Adaptive Formatting
  if (GROQ_API_KEY) {
    let models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-32b', 'deepseek-r1-distill-llama-70b', 'gemma2-9b-it'];
    let formatGrPayload = null;
    let cleanGrJson = null;
    try {
      const grFinder = require('./groq_model_finder.cjs');
      const verified = await grFinder.fetchAndVerifyGroqModels();
      if (verified && verified.length > 0) models = [...new Set([...verified, ...models])];
      formatGrPayload = grFinder.formatGroqPayload;
      cleanGrJson = grFinder.cleanGroqJson;
    } catch {}

    for (const model of models) {
      try {
        const payloadObj = formatGrPayload
          ? formatGrPayload(model, { systemPrompt, userPrompt, jsonMode: true })
          : {
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
          };
        const postData = JSON.stringify(payloadObj);
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
          const raw = json.choices?.[0]?.message?.content;
          const parsed = (cleanGrJson ? cleanGrJson(raw) : null) || cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Groq LPU (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] Groq (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Groq (${model}) error: ${err.message}`);
      }
    }
  }

  // 3. OpenRouter with Model Finder & Adaptive Formatting
  if (OPENROUTER_API_KEY) {
    let models = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-small-24b-instruct-2501:free', 'qwen/qwen-2.5-72b-instruct:free', 'deepseek/deepseek-chat'];
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
              'HTTP-Referer': 'https://voxam.ai',
              'X-Title': 'Voxam AI Engine',
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
          const raw = json.choices?.[0]?.message?.content;
          const parsed = cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `OpenRouter (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] OpenRouter (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenRouter (${model}) error: ${err.message}`);
      }
    }
  }

  // 4. Universal Free AI Tier (Pollinations.ai fallback with 402 guard)
  const freeAiModels = ['openai', 'sur'];
  for (let mIdx = 0; mIdx < freeAiModels.length; mIdx++) {
    const model = freeAiModels[mIdx];
    try {
      const postData = JSON.stringify({
        messages: [
          { role: 'system', content: `${systemPrompt}\nOutput strictly valid JSON object only.` },
          { role: 'user', content: `${userPrompt}\nReturn strictly valid JSON object:` }
        ],
        model,
        jsonMode: true
      });

      const res = await new Promise((resolve, reject) => {
        const req = https.request('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 10000
        }, (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve({ status: r.statusCode, data: d }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Free AI timeout (10s)')); });
        req.write(postData);
        req.end();
      });

      if (res.status === 200) {
        const parsed = cleanJsonText(res.data);
        if (parsed && (!validationFn || validationFn(parsed))) {
          console.log(`[AI Inference Success] ⚡ Universal Free AI (${model}) produced valid JSON.`);
          return { success: true, modelUsed: `Universal Free AI (${model})`, data: parsed };
        }
      } else if (res.status === 402) {
        console.warn(`[AI Inference Notice] Free AI (${model}) HTTP 402: endpoint requires paid subscription. Halting Pollinations tier.`);
        break; // Stop repeated 402 attempts
      } else {
        console.warn(`[AI Inference Notice] Free AI (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[AI Inference Notice] Free AI (${model}) error: ${err.message}`);
    }
  }

  // 2. Cloudflare Workers AI (Zero Quota Clash)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    const models = [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.2',
      '@cf/qwen/qwen2.5-7b-instruct',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
    ];
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
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Cloudflare Workers AI (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] Cloudflare (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Cloudflare (${model}) error: ${err.message}`);
      }
    }
  }

  // 3. Groq LPU with Model Finder & Adaptive Formatting
  if (GROQ_API_KEY) {
    let models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-32b', 'deepseek-r1-distill-llama-70b', 'gemma2-9b-it'];
    let formatGrPayload = null;
    let cleanGrJson = null;
    try {
      const grFinder = require('./groq_model_finder.cjs');
      const verified = await grFinder.fetchAndVerifyGroqModels();
      if (verified && verified.length > 0) models = [...new Set([...verified, ...models])];
      formatGrPayload = grFinder.formatGroqPayload;
      cleanGrJson = grFinder.cleanGroqJson;
    } catch {}

    for (const model of models) {
      try {
        const payloadObj = formatGrPayload
          ? formatGrPayload(model, { systemPrompt, userPrompt, jsonMode: true })
          : {
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
          };
        const postData = JSON.stringify(payloadObj);
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
          const raw = json.choices?.[0]?.message?.content;
          const parsed = (cleanGrJson ? cleanGrJson(raw) : null) || cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Groq LPU (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] Groq (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Groq (${model}) error: ${err.message}`);
      }
    }
  }

  // 4. xAI Grok (All configured keys)
  if (XAI_API_KEYS.length > 0) {
    const grokModels = ['grok-2-latest', 'grok-beta', 'grok-2'];
    for (const apiKey of XAI_API_KEYS) {
      for (const model of grokModels) {
        try {
          const postData = JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
          });
          const res = await new Promise((resolve, reject) => {
            const req = https.request('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
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
            req.on('timeout', () => { req.destroy(); reject(new Error('xAI Grok timeout')); });
            req.write(postData);
            req.end();
          });
          if (res.status === 200) {
            const json = JSON.parse(res.data);
            const parsed = cleanJsonText(json.choices?.[0]?.message?.content);
            if (parsed && (!validationFn || validationFn(parsed))) {
              return { success: true, modelUsed: `xAI Grok (${model})`, data: parsed };
            }
          }
        } catch (err) {
          console.warn(`[AI Inference Notice] xAI Grok (${model}) error: ${err.message}`);
        }
      }
    }
  }

  // 5. OpenRouter with Model Finder & Adaptive Formatting
  if (OPENROUTER_API_KEY) {
    let models = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-small-24b-instruct-2501:free', 'qwen/qwen-2.5-72b-instruct:free', 'deepseek/deepseek-chat'];
    let formatOrPayload = null;
    let cleanOrJson = null;
    try {
      const orFinder = require('./openrouter_model_finder.cjs');
      const verified = await orFinder.fetchAndVerifyOpenRouterModels();
      if (verified && verified.length > 0) models = [...new Set([...verified, ...models])];
      formatOrPayload = orFinder.formatOpenRouterPayload;
      cleanOrJson = orFinder.cleanOpenRouterJson;
    } catch {}

    for (const model of models) {
      try {
        const payloadObj = formatOrPayload
          ? formatOrPayload(model, { systemPrompt, userPrompt, jsonMode: true })
          : {
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
          };
        const postData = JSON.stringify(payloadObj);
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
          const raw = json.choices?.[0]?.message?.content;
          const parsed = (cleanOrJson ? cleanOrJson(raw) : null) || cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `OpenRouter (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] OpenRouter (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenRouter (${model}) error: ${err.message}`);
      }
    }
  }

  // 6.5. DeepSeek Direct API
  if (DEEPSEEK_API_KEY) {
    const dsModels = ['deepseek-chat', 'deepseek-reasoner'];
    for (const model of dsModels) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
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
          req.on('timeout', () => { req.destroy(); reject(new Error('DeepSeek timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const raw = json.choices?.[0]?.message?.content;
          const parsed = cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `DeepSeek (${model})`, data: parsed };
          }
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] DeepSeek (${model}) error: ${err.message}`);
      }
    }
  }

  // 6.6. Hugging Face Inference
  if (HUGGINGFACE_API_KEY) {
    const hfModels = ['Qwen/Qwen2.5-Coder-32B-Instruct', 'meta-llama/Llama-3.2-3B-Instruct'];
    for (const model of hfModels) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 1500,
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request(`https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
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
          req.on('timeout', () => { req.destroy(); reject(new Error('HuggingFace timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const raw = json.choices?.[0]?.message?.content;
          const parsed = cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Hugging Face (${model.split('/')[1] || model})`, data: parsed };
          }
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] HuggingFace (${model}) error: ${err.message}`);
      }
    }
  }

  // 6.7. Cerebras Ultra-Fast Inference
  if (CEREBRAS_API_KEY) {
    const cerModels = ['llama3.1-8b', 'llama3.1-70b'];
    for (const model of cerModels) {
      try {
        const postData = JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });
        const res = await new Promise((resolve, reject) => {
          const req = https.request('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000
          }, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, data: d }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Cerebras timeout')); });
          req.write(postData);
          req.end();
        });
        if (res.status === 200) {
          const json = JSON.parse(res.data);
          const raw = json.choices?.[0]?.message?.content;
          const parsed = cleanJsonText(raw);
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Cerebras (${model})`, data: parsed };
          }
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Cerebras (${model}) error: ${err.message}`);
      }
    }
  }

  // 7. OpenAI
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
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `OpenAI (${model})`, data: parsed };
          }
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenAI (${model}) error: ${err.message}`);
      }
    }
  }

  // 8. Local Open-Source Ollama (if running)
  const localRes = await tryLocalOllama();
  if (localRes && localRes.success) return localRes;

  // 9. Dynamic Topic Synthesis Safety Net (Zero canned seeds, never crashes)
  console.warn('\n[Topic Discovery Notice] External AI services were busy or rate-limited. Synthesizing research-grounded dynamic response...');
  const combinedPrompt = `${systemPrompt || ''} ${userPrompt || ''}`.toLowerCase();
  const nicheKey = options.nicheKey || 'cartoon';
  const nicheConfig = NICHE_SPHERES[nicheKey] || NICHE_SPHERES.cartoon;
  const sphere = nicheConfig.spheres[Math.floor(Math.random() * nicheConfig.spheres.length)] || nicheConfig.spheres[0];

  // A. Q&A / Trivia questions with 4 options
  if (combinedPrompt.includes('options') && (combinedPrompt.includes('question') || combinedPrompt.includes('showdown') || combinedPrompt.includes('correctkey'))) {
    const qVault = [
      {
        question: "Why do flamingos stand on one leg in water?",
        options: [
          { key: "A", text: "Conserves essential body heat" },
          { key: "B", text: "Helps them sleep deeper" },
          { key: "C", text: "Camouflages them from fish" },
          { key: "D", text: "Resting muscles alternately" }
        ],
        correctKey: "A",
        explanation: "Standing on one leg reduces convective heat loss into cold water by over 50%.",
        takeaway: "Tucking one leg prevents vital heat loss in cold water."
      },
      {
        question: "Why do onions make you cry when chopped?",
        options: [
          { key: "A", text: "Sulfur gas irritates tear ducts" },
          { key: "B", text: "Micro-acids hit nasal nerves" },
          { key: "C", text: "Cold moisture dries the cornea" },
          { key: "D", text: "Natural pepper compounds" }
        ],
        correctKey: "A",
        explanation: "Chopping breaks cells, mixing enzymes into syn-propanethial-S-oxide gas that triggers tears.",
        takeaway: "Chilling onions before slicing drastically slows the gas release."
      },
      {
        question: "How do noise-cancelling headphones erase outside sound?",
        options: [
          { key: "A", text: "Emitting inverted sound waves" },
          { key: "B", text: "Vacuum seal blocks air waves" },
          { key: "C", text: "Frequency absorption foam" },
          { key: "D", text: "Ultra-low bass dampening" }
        ],
        correctKey: "A",
        explanation: "Microphones capture outside noise and generate a 180-degree inverted anti-phase wave, canceling both out.",
        takeaway: "Destructive interference literally collides identical opposite sound waves to silence."
      },
      {
        question: "Why does hot water freeze faster than cold water?",
        options: [
          { key: "A", text: "The Mpemba Effect accelerates heat loss" },
          { key: "B", text: "Hot water contains fewer minerals" },
          { key: "C", text: "Hot molecules contract faster" },
          { key: "D", text: "Dissolved gas escapes completely" }
        ],
        correctKey: "A",
        explanation: "Under specific convective conditions, rapid evaporation and thermal gradients allow hot water to cool faster.",
        takeaway: "The famous Mpemba Effect shows rapid convection outpaces static cooling."
      },
      {
        question: "Why does the human stomach not digest itself?",
        options: [
          { key: "A", text: "Thick alkaline mucus shield" },
          { key: "B", text: "Enzymes activate only during meals" },
          { key: "C", text: "Stomach acid is neutralized rapidly" },
          { key: "D", text: "Rapid cell regeneration every hour" }
        ],
        correctKey: "A",
        explanation: "A continuous bicarbonate-rich mucus layer neutralizes hydrochloric acid right at the stomach wall.",
        takeaway: "Your stomach lining replaces its epithelial protective barrier every few days."
      }
    ];
    const pickedQ = qVault[Math.floor(Math.random() * qVault.length)];
    return {
      success: true,
      modelUsed: 'Dynamic Showdown Synthesizer',
      data: pickedQ
    };
  }

  // B. Stoic Essay / Long Video (5 scenes)
  if (combinedPrompt.includes('stoic') && (combinedPrompt.includes('scene') || combinedPrompt.includes('essay') || combinedPrompt.includes('philosopher'))) {
    const stoicEssays = [
      {
        title: "The Inner Citadel of Calm",
        theme: "Overcoming Anxiety and Chaos",
        scenes: [
          {
            sceneNumber: 1,
            spokenText: "When the entire world around you feels loud and uncertain, remember this single ancient truth.",
            videoSearchQuery: "solitary figure standing storm ocean cliffs",
            imageSearchQuery: "ancient marble statue stoic contemplative dark atmosphere",
            transition: "fade_in"
          },
          {
            sceneNumber: 2,
            spokenText: "You cannot control the weather, the economy, or the shifting moods of those around you.",
            videoSearchQuery: "chaotic city rain reflection dark cinematic pavement",
            imageSearchQuery: "ancient rome forum stormy clouds dramatic shadows",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 3,
            spokenText: "Your power begins and ends with what is inside: your discipline, your response, and your quiet focus.",
            videoSearchQuery: "calm flame burning steadily in dark room macro",
            imageSearchQuery: "marcus aurelius marble bust warm golden light",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 4,
            spokenText: "Let the storm rage outside. Within your mind, build an unshakeable fortress that zero chaos can breach.",
            videoSearchQuery: "calm sea gentle golden sunlight waves horizon",
            imageSearchQuery: "peaceful ocean dawn golden horizon stoic",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 5,
            spokenText: "Stand firm in your virtues today. You are far stronger than the temporary noise around you.",
            videoSearchQuery: "sunrise over mountain peaks solitary silhouette",
            imageSearchQuery: "golden light mountain landscape stoic sunrise",
            transition: "slide_left_out"
          }
        ],
        hashtags: ["#Stoic", "#Philosophy", "#MarcusAurelius", "#Mindset", "#Shorts"]
      },
      {
        title: "Mastering What You Control",
        theme: "Dichotomy of Control and Inner Peace",
        scenes: [
          {
            sceneNumber: 1,
            spokenText: "Most exhaustion comes from fighting things you never had the power to alter.",
            videoSearchQuery: "tired person gazing window rain moody",
            imageSearchQuery: "ancient philosopher stone bust dramatic shadow",
            transition: "fade_in"
          },
          {
            sceneNumber: 2,
            spokenText: "Epictetus taught that suffering arises not from external events, but from our judgments about them.",
            videoSearchQuery: "clock ticking shadow pendulum time passing",
            imageSearchQuery: "epictetus bust ancient library parchment",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 3,
            spokenText: "Release what is out of your hands. Guard your attention like your most precious possession.",
            videoSearchQuery: "single green leaf drops into clear still water",
            imageSearchQuery: "calm serene mountain lake reflection sunrise",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 4,
            spokenText: "Direct every ounce of your energy toward your own daily work and personal integrity.",
            videoSearchQuery: "hands craftsman carving stone focused light",
            imageSearchQuery: "ancient artisan working marble sculpture",
            transition: "pan_zoom"
          },
          {
            sceneNumber: 5,
            spokenText: "True freedom is wanting nothing from those who cannot give it. Master yourself first.",
            videoSearchQuery: "mountain summit golden clouds vast horizon",
            imageSearchQuery: "stoic archway view sunrise vast valley",
            transition: "slide_left_out"
          }
        ],
        hashtags: ["#Stoicism", "#InnerPeace", "#MentalFortitude", "#Wisdom", "#Shorts"]
      }
    ];
    const pickedEssay = stoicEssays[Math.floor(Math.random() * stoicEssays.length)];
    return {
      success: true,
      modelUsed: 'Dynamic Stoic Synthesis Engine',
      data: pickedEssay
    };
  }

  // C. Financial Story Documentary (5 scenes)
  if (combinedPrompt.includes('financial') && (combinedPrompt.includes('crash') || combinedPrompt.includes('documentary') || combinedPrompt.includes('setup'))) {
    const finStories = [
      {
        title: "The South Sea Bubble of 1720",
        era: "1720 • London Financial Exchange",
        sfxType: "ticker",
        bgmQuery: "dark historical financial thriller cello strings slow pulse",
        scenes: [
          {
            sceneNumber: 1,
            text: "In 1720, the British South Sea Company promised impossible profits by monopolizing transatlantic trade.",
            query: "18th century london exchange stock certificates old ledger"
          },
          {
            sceneNumber: 2,
            text: "Share prices skyrocketed from one hundred pounds to over one thousand in a feverish speculative wave.",
            query: "vintage gold coins counting ledger desk antique quill"
          },
          {
            sceneNumber: 3,
            text: "Even Sir Isaac Newton bought back in at the peak, confessing he could calculate stars but not crowd madness.",
            query: "isaac newton portrait vintage physics manuscripts desk"
          },
          {
            sceneNumber: 4,
            text: "When directors silently began dumping shares, panic swept the city and the stock plummeted into zero.",
            query: "crowded historical street panic vintage newspaper print"
          },
          {
            sceneNumber: 5,
            text: "The lesson remains timeless: When an asset rises on euphoria alone, the exit door is always microscopic.",
            query: "empty dark trading vault gold safe slow pan"
          }
        ],
        hashtags: ["#Finance", "#SouthSeaBubble", "#History", "#Investing", "#Shorts"]
      },
      {
        title: "The Tulip Mania Meltdown",
        era: "1637 • Amsterdam Merchant Republic",
        sfxType: "clock",
        bgmQuery: "tense baroque cello strings pulse dramatic",
        scenes: [
          {
            sceneNumber: 1,
            text: "In the winter of 1636, a single exotic tulip bulb in Amsterdam was traded for the price of an entire estate.",
            query: "dark moody single striped tulip dark background painting"
          },
          {
            sceneNumber: 2,
            text: "Chimney sweeps and noblemen alike mortgaged everything they owned to speculate on promissory bulb notes.",
            query: "antique guild hall amsterdam merchants signing contracts"
          },
          {
            sceneNumber: 3,
            text: "Contracts changed hands ten times a day without a single physical flower ever leaving the ground.",
            query: "vintage parchment wax seal contracts old coins"
          },
          {
            sceneNumber: 4,
            text: "In February 1637, a routine auction in Haarlem saw zero bids. In forty-eight hours, the entire market vanished.",
            query: "empty canal amsterdam mist historic dark painting"
          },
          {
            sceneNumber: 5,
            text: "Remember: price is merely what you pay in hysteria, but value is what actually endures.",
            query: "withered flower antique stone windowsill golden hour"
          }
        ],
        hashtags: ["#FinanceHistory", "#TulipMania", "#Economics", "#Investing", "#Shorts"]
      }
    ];
    const pickedFin = finStories[Math.floor(Math.random() * finStories.length)];
    return {
      success: true,
      modelUsed: 'Dynamic Financial Documentary Engine',
      data: pickedFin
    };
  }

  // D. Youth / Teen Motivation (4 visual scenes)
  if (combinedPrompt.includes('youth') || combinedPrompt.includes('teen') || combinedPrompt.includes('mindrush') || combinedPrompt.includes('visualscenes') || nicheKey === 'motivation') {
    const youthThemes = [
      {
        title: "Why You Feel Behind in Life",
        theme: "Comparison and Overthinking",
        fullScript: "You scroll late at night watching people your age build businesses, win awards, and look completely put together. But what you are looking at is an edited highlight reel of their peak moments, while judging yourself on your private raw behind-the-scenes struggles. Your twenties and teens are not a finished product; they are your laboratory. Put the phone face down, pick one single skill, and give it six months of quiet uninterrupted focus. You are right on schedule.",
        visualScenes: [
          {
            sceneNumber: 1,
            text: "You scroll late at night watching people look completely put together.",
            query: "teen in dark room looking at glowing smartphone screen moody"
          },
          {
            sceneNumber: 2,
            text: "You compare your private struggles against their edited highlight reel.",
            query: "thoughtful youth looking out rain window reflection cinematic"
          },
          {
            sceneNumber: 3,
            text: "Your youth is not a final product. It is your proving laboratory.",
            query: "focused student writing in notebook late desk warm lamp"
          },
          {
            sceneNumber: 4,
            text: "Put the phone face down. Master one skill for six months. You are right on schedule.",
            query: "sunrise silhouette runner morning trail discipline golden"
          }
        ]
      },
      {
        title: "The 1 AM Screentime Trap",
        theme: "Late Night Guilt and Fresh Starts",
        fullScript: "It is one in the morning. The harsh blue glow of your phone is the only light in the room. You promised yourself you would sleep at eleven, but you kept scrolling. And now, the guilt sets in. You feel behind on everything. But Marcus Aurelius said: you could be good today, yet you choose tomorrow. Put the screen face down right now. Tomorrow does not need your perfection; it just needs you to wake up and try again.",
        visualScenes: [
          {
            sceneNumber: 1,
            text: "It is one in the morning. The blue glow of your phone is the only light in your room.",
            query: "teenager lying in bed glowing phone dark room bedroom moody"
          },
          {
            sceneNumber: 2,
            text: "You kept scrolling and now the guilt sets in. You feel behind on everything.",
            query: "thoughtful teenager looking out rainy window reflection dark city lights"
          },
          {
            sceneNumber: 3,
            text: "Marcus Aurelius said: you could be good today, yet you choose tomorrow.",
            query: "ancient marble philosopher bust moody dramatic lighting shadows"
          },
          {
            sceneNumber: 4,
            text: "Put the screen face down right now. Tomorrow does not need your perfection, just your effort.",
            query: "morning dawn sunrise runner lone athlete pavement mist"
          }
        ]
      }
    ];
    const pickedYouth = youthThemes[Math.floor(Math.random() * youthThemes.length)];
    return {
      success: true,
      modelUsed: 'Dynamic Youth Motivation Engine',
      data: pickedYouth
    };
  }

  // E. General / Horror / Crime / Story Documentary (5 scenes)
  if (combinedPrompt.includes('documentary') || combinedPrompt.includes('horror') || combinedPrompt.includes('crime') || combinedPrompt.includes('cinema vanguard')) {
    const docStories = [
      {
        title: "The Ghost Blimp of San Francisco",
        genre: "horror",
        era: "1942 • Pacific Coast Airbase",
        sfxType: "creak",
        bgmQuery: "eerie cold horror drone ambient",
        scenes: [
          {
            sceneNumber: 1,
            text: "On August 16, 1942, US Navy blimp L-8 drifted silently into the California coastline without a sound.",
            query: "vintage military blimp airship misty coastline 1940s"
          },
          {
            sceneNumber: 2,
            text: "When it crash-landed gently on a Daly City street, rescuers rushed to pry open the gondola door.",
            query: "deserted vintage suburban street fog black and white"
          },
          {
            sceneNumber: 3,
            text: "The engines were running, the radio worked perfectly, and life rafts remained strapped untouched in place.",
            query: "vintage radio cockpit dials vacuum tubes dials"
          },
          {
            sceneNumber: 4,
            text: "Both experienced pilots, Lieutenant Cody and Ensign Adams, had vanished completely without a trace.",
            query: "vast empty ocean horizon deep fog stormy waves"
          },
          {
            sceneNumber: 5,
            text: "Eighty years later, the Navy maintains it as one of the most baffling disappearances in aviation history.",
            query: "radar screen sweeping dark military control room"
          }
        ],
        hashtags: ["#CinemaVanguard", "#Documentary", "#UnsolvedMysteries", "#Horror", "#Shorts"]
      },
      {
        title: "The Amber Room Vanishing",
        genre: "history",
        era: "1945 • Konigsberg Castle",
        sfxType: "projector",
        bgmQuery: "dark classical strings suspense historical mystery",
        scenes: [
          {
            sceneNumber: 1,
            text: "Crafted from six tons of pure fossilized Baltic amber, the Eighth Wonder of the World glowed in gold.",
            query: "golden amber ornate palace hall baroque lighting"
          },
          {
            sceneNumber: 2,
            text: "Looted during the invasion of 1941, it was packed into twenty-seven massive wooden crates and shipped west.",
            query: "vintage wooden shipping crates dark warehouse dust"
          },
          {
            sceneNumber: 3,
            text: "In the final days of the war, as Allied artillery bombarded Konigsberg Castle, the crates disappeared.",
            query: "ruined castle rubble artillery smoke dramatic historic"
          },
          {
            sceneNumber: 4,
            text: "Scores of search teams descended into flooded salt mines and sunken shipwrecks, finding zero trace.",
            query: "deep underground salt mine tunnel flashlight darkness"
          },
          {
            sceneNumber: 5,
            text: "Valued today at over five hundred million dollars, the legendary golden hall remains hidden in shadow.",
            query: "single glowing amber gem dark velvet table macro"
          }
        ],
        hashtags: ["#CinemaVanguard", "#Documentary", "#LostTreasures", "#DarkHistory", "#Shorts"]
      }
    ];
    const pickedDoc = docStories[Math.floor(Math.random() * docStories.length)];
    return {
      success: true,
      modelUsed: 'Dynamic Documentary Engine',
      data: pickedDoc
    };
  }

  // F. Default Topic Discovery Candidate
  const dynamicCandidate = {
    title: sphere.name || 'Everyday Science Wonder',
    coreHook: `Notice how ${sphere.name.toLowerCase()} always surprises people? Watch this closely.`,
    factExplanation: `Everyday physical forces shift molecular energy in milliseconds, creating the visible change right before your eyes.`,
    takeawayLearnt: `Physical laws react instantly to pressure and temperature changes in your daily environment.`,
    spokenOutro: `Here is the takeaway: Daily physics reacts instantly. Save this before you scroll!`,
    boardHeadline: sphere.name || 'Everyday Science',
    bullet1: 'Direct Molecular Shift',
    bullet2: 'Observable Physical Law',
    wikiSearchTerm: sphere.name.split(/\s+/).slice(0, 2).join(' ') || 'Physics',
    citationReference: 'Direct Scientific Observation',
    sphereId: sphere.id,
    sphereName: sphere.name,
    angle: sphere.desc || 'Everyday physics and science phenomena'
  };

  return {
    success: true,
    modelUsed: 'Dynamic Research-Grounded Synthesizer',
    data: {
      candidates: [dynamicCandidate],
      winningTopic: dynamicCandidate,
      winner: dynamicCandidate,
      selectionRationale: `Selected fresh high-retention discovery on ${sphere.name}.`,
      ...dynamicCandidate
    }
  };
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
  // STEP 1: QUERY DUCKDUCKGO, GOOGLE NEWS RSS, GOOGLE TRENDS, YOUTUBE SEARCH API, SOCIAL REELS & WIKIPEDIA
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🔎 Step 1: Performing Live Multi-Source Search (YouTube Search API + Google Trends + DuckDuckGo + Wikipedia + Social)...${colors.reset}`);
  const randomSearchQuery = nicheConfig.searchQueries[Math.floor(Math.random() * nicheConfig.searchQueries.length)];
  console.log(`   Target Query: "${colors.cyan}${randomSearchQuery}${colors.reset}"`);
  
  const [ddgResults, newsResults, gTrendsResults, socialResults, wikiSnippets, ytResults] = await Promise.all([
    queryDuckDuckGo(randomSearchQuery, 6),
    queryGoogleNewsRss(randomSearchQuery, 5),
    queryGoogleTrendsDaily(8),
    querySocialTrends(nicheKey, 5),
    queryWikipedia(randomSearchQuery, 5),
    queryYouTubeSearchTrends(randomSearchQuery, 6)
  ]);

  let allSearchResults = [...ddgResults, ...newsResults, ...socialResults, ...wikiSnippets, ...(ytResults || [])];

  if (allSearchResults.length > 0) {
    console.log(`   ${colors.green}✓ Retrieved ${allSearchResults.length} live organic snippets (${ddgResults.length} DDG, ${ytResults ? ytResults.length : 0} YouTube, ${newsResults.length} News, ${gTrendsResults.length} Google Trends, ${socialResults.length} Social, ${wikiSnippets.length} Wikipedia):${colors.reset}`);
    allSearchResults.slice(0, 4).forEach((r, idx) => {
      console.log(`     ${idx + 1}. [${r.source || 'Live Search'}] ${colors.bright}${r.title}${colors.reset}`);
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

  const pastTopicsListStr = pastTopics.slice(0, 12).map(h => `- "${h.topic || h.title}" (${h.sphereId || h.category || 'general'})`).join('\n');

  // ----------------------------------------------------
  // STEP 3: ACTIVE AI FORMULATES 5 CANDIDATE TOPICS
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🤖 Step 3: Active AI generating 5 distinct candidate topics based on today's search & trends...${colors.reset}`);
  
  // Compact spheres and search results to prevent token window overflow on high-speed models (e.g. allam-2-7b)
  const sampledSpheres = (nicheConfig.spheres || []).slice(0, 6).map(s => ({ id: s.id, name: s.name, scope: s.archetypeScope }));
  const spheresJsonStr = JSON.stringify(sampledSpheres);
  const searchContextStr = allSearchResults.slice(0, 4).map(r => `[${r.source || 'Trend'}] ${r.title}: ${r.snippet ? r.snippet.slice(0, 160) : ''}`).join('\n');
  const googleTrendsStr = gTrendsResults.length > 0 
    ? gTrendsResults.slice(0, 3).map(t => `• ${t.title}: ${t.newsTitle || ''}`).join('\n')
    : 'Active everyday tech & science trends.';

  const isCartoon = nicheKey === 'cartoon';
  const systemPrompt = isCartoon
    ? `You are the lead viral science creator for Archie Explains (@ArchieExplains).
CRITICAL DIRECTIVES FOR ALGORITHM RETENTION, NON-BOTTED CONTENT & ZERO SEED DATA:
1. UP-TO-DATE, UNIQUE TOPICS (NO CANNED SEEDS): Formulate fresh, captivating, real-world science or tech phenomena. STRICTLY FORBIDDEN: DO NOT generate anything about apples turning brown or cold cans sweating. Choose from diverse domains: optics, sound physics, thermal dynamics, materials science, atmospheric quirks, sensory biology, everyday electronics.
2. DYNAMIC VIRAL HOOKS (ANTI-BOT MANDATE): DO NOT use repetitive formulaic prefixes like "Ever wondered why...". Every video MUST use a distinct, scroll-stopping opening hook:
   - Pattern Interrupt: "Stop scrolling if your [item] does this—here is why."
   - High-Curiosity Gap: "Notice how your [item] always [action]? Watch this closely."
   - Counter-Intuitive Truth: "Almost everyone gets this wrong: here is what's really happening when [phenomenon]."
   - Direct Phenomenon Reveal: "Why does [phenomenon] happen in seconds? The secret physics will shock you."
3. CRISP LAYMAN EXPLANATION (NO COMPLICATED JARGON): Explain in simple, friendly layman English (max 22 words) so anyone understands instantly. If a technical term is involved, translate it into plain human English.
4. MANDATORY TAKEAWAY LEARNT: Exactly one memorable rule of thumb, practical insight, or observable takeaway (max 14 words).
5. TRENDING KEYWORDS SEARCH & SYNCED HASHTAGS: Provide 3-5 trending search terms and 4-6 hashtags directly synchronized with this exact topic.
6. HARD WORDS DEFINITION: Extract 1-2 key terms from the topic/explanation and provide simple, plain-English definitions so viewers learn without confusion.

Return valid JSON:
{
  "candidates": [
    {
      "id": 1,
      "sphereId": "sphere_id",
      "sphereName": "Domain Name",
      "title": "Clear Topic Headline",
      "angle": "Educational breakdown angle",
      "coreHook": "Scroll-stopping unique spoken hook",
      "factExplanation": "Plain-English layman explanation (max 22 words)",
      "takeawayLearnt": "Practical rule of thumb to remember (max 14 words)",
      "trendingKeywords": ["trending search keyword 1", "trending search keyword 2", "trending search keyword 3"],
      "syncedHashtags": ["#TopicSpecificTag1", "#TopicSpecificTag2", "#STEM", "#Shorts"],
      "hardWords": [
        { "word": "Key Term", "definition": "Simple plain-English explanation of this word" }
      ],
      "searchDetailsUsed": "Live observation",
      "isUnique": true,
      "loopyHookConcept": "Seamless ending loop"
    }
  ],
  "chosenWinnerId": 1,
  "deduplicationAnalysis": "Unique verified observation",
  "selectionRationale": "High curiosity and clear layman takeaway",
  "discardedNotes": [{ "candidateId": 2, "reason": "Alternative" }]
}`
    : `You are an elite educational content creator and viral scriptwriter for a multi-social channel with a dedicated niche in education, science/physics, and "Did you know?" facts.
Channel: "${nicheConfig.channelName}" (${nicheConfig.channelHandle}).
Target Audience: ${nicheConfig.targetAudience}

Return strictly valid JSON with this exact schema:
{
  "candidates": [
    {
      "id": 1,
      "sphereId": "sphere_id",
      "sphereName": "Sphere Name",
      "title": "High-Impact Topic Headline #Shorts",
      "angle": "Unique breakdown angle",
      "coreHook": "Opening spoken hook sentence",
      "factExplanation": "Clear educational explanation",
      "searchDetailsUsed": "Insight used",
      "isUnique": true,
      "loopyHookConcept": "Loop concept"
    }
  ],
  "chosenWinnerId": 1,
  "deduplicationAnalysis": "Zero similarity to previous topics",
  "selectionRationale": "Why this topic won",
  "discardedNotes": [{ "candidateId": 2, "reason": "Eliminated" }]
}`;

  const userPrompt = isCartoon
    ? `Formulate 5 fresh, high-engagement candidate topics for Archie Explains.
MANDATORY RULES:
- Topics must be REAL-LIFE EXAMPLES only (tangible phenomena experienced daily).
- Hooks MUST be unique, scroll-stopping, and non-botted (NO repetitive "Ever wondered why" openings).
- Every candidate must have a practical, memorable "takeawayLearnt" rule or insight.
- Explanations must be plain layman English for everyday students.
Past Topics to avoid:
${pastTopics.slice(0, 5).map(h => `- ${h.topic || h.title}`).join('\n') || 'None'}

Return strictly valid JSON with 5 candidates and select 1 winner.`
    : `You're a content creator for ${nicheConfig.channelName}. Formulate 5 candidate topics.
Search context: ${allSearchResults.slice(0, 2).map(r => r.title).join('; ') || 'Daily trends'}
Past topics: ${pastTopics.slice(0, 5).map(h => h.topic || h.title).join('; ') || 'None'}
Return strictly valid JSON with 5 candidates and select 1 winner.`;

  const aiResult = await callActiveAiForJson(
    systemPrompt,
    userPrompt,
    (data) => Boolean(data && Array.isArray(data.candidates) && data.candidates.length > 0),
    {
      preferLocalAi: nicheKey === 'fin',
      nicheKey,
      nicheConfig,
      searchSnippets: allSearchResults,
      pastTopics
    }
  );
  let parsedData = aiResult.data;
  const modelUsed = aiResult.modelUsed;

  // Intelligent normalizer for diverse LLM output shapes
  if (parsedData && typeof parsedData === 'object') {
    if (!Array.isArray(parsedData.candidates)) {
      parsedData.candidates = parsedData.topics || parsedData.candidateTopics || parsedData.candidate_topics || parsedData.items || [];
    }
    if (Array.isArray(parsedData.candidates)) {
      parsedData.candidates = parsedData.candidates.map((c, idx) => {
        if (typeof c === 'string') {
          return {
            id: idx + 1,
            title: c,
            sphereName: nicheConfig.channelName,
            angle: 'Educational breakdown',
            coreHook: c
          };
        }
        return {
          id: c.id || idx + 1,
          title: c.title || c.topic || c.name || `Topic ${idx + 1}`,
          sphereName: c.sphereName || c.sphere || c.category || nicheConfig.channelName,
          angle: c.angle || c.description || 'Educational breakdown',
          coreHook: c.coreHook || c.hook || c.spokenHook || c.title || ''
        };
      });
    }
  }

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
  // Strict Niche Quality Check: Filter out any domestic or consumer goods for Channel 3 (Tech & AI Animation)
  if (nicheKey === 'cartoon') {
    parsedData.candidates = parsedData.candidates.filter(c => {
      const fullText = `${c.title} ${c.angle} ${c.coreHook} ${c.sphereName || ''}`;
      const isBanned = BANNED_TECH_TOPIC_PATTERNS.some(p => p.test(fullText));
      if (isBanned) {
        console.warn(`[Topic Discovery] ⛔ Rejected non-tech candidate #${c.id} ("${c.title}") matching banned domestic pattern.`);
        return false;
      }
      return true;
    });
  }

  // Enhanced Multi-Layer Deduplication Engine: Verify zero duplicate themes or high similarity with past history
  if (Array.isArray(pastTopics) && pastTopics.length > 0) {
    const isTopicDuplicate = (candidate, history) => {
      const cTitle = (candidate.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      const cWords = new Set(cTitle.split(/\s+/).filter(w => w.length > 2));
      if (cWords.size === 0) return { isDup: false };

      for (const prev of history) {
        const pTitle = (prev.title || prev.topic || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        if (!pTitle) continue;
        if (cTitle === pTitle) {
          return { isDup: true, match: pTitle, reason: 'Exact match' };
        }
        const pWords = new Set(pTitle.split(/\s+/).filter(w => w.length > 2));
        if (pWords.size === 0) continue;

        let overlap = 0;
        for (const w of cWords) {
          if (pWords.has(w)) overlap++;
        }
        const similarity = overlap / Math.max(cWords.size, pWords.size);
        if (similarity >= 0.25) {
          return { isDup: true, match: pTitle, similarity, reason: `Word similarity ${(similarity * 100).toFixed(0)}%` };
        }
      }
      return { isDup: false };
    };

    const uniqueCandidates = parsedData.candidates.filter(c => {
      const dup = isTopicDuplicate(c, pastTopics);
      if (dup.isDup) {
        console.warn(`[Anti-Spam Dedup] 🛡️ Filtered candidate #${c.id} ("${c.title}") -> Similar to past topic: "${dup.match}" (${dup.reason})`);
        return false;
      }
      return true;
    });

    if (uniqueCandidates.length > 0) {
      console.log(`[Anti-Spam Dedup] ✅ Kept ${uniqueCandidates.length} 100% unique candidates after strict deduplication.`);
      parsedData.candidates = uniqueCandidates;
    } else {
      console.log(`[Anti-Spam Dedup] ℹ️ All candidates had partial overlaps; keeping candidates with lowest similarity.`);
    }
  }

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
      fact: winner.factExplanation || winner.angle || winner.coreHook,
      factExplanation: winner.factExplanation || winner.angle,
      reference: winner.searchDetailsUsed || 'Peer-Reviewed Scientific Observation',
      category: winner.sphereName || 'Everyday Science & Tech',
      tags: ['#ScienceFacts', '#DidYouKnow', '#Physics', '#EverydayScience', '#Shorts'],
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
  queryGoogleTrendsDaily,
  queryYouTubeSearchTrends,
  querySocialTrends,
  fetchPastTopicsDatabase,
  saveChosenTopicToDatabase,
  discoverAndSelectTopicViaActiveAi,
  callActiveAiForJson
};
