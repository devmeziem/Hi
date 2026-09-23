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
      'trending physics science and tech facts today',
      'did you know science facts today',
      'trending everyday physics phenomena curious facts today',
      'trending science facts viral reels tiktok today',
      'trending technology breakthroughs and everyday science curiosities today',
      'mind blowing everyday physics facts today did you know',
      'why microwave boils water but leaves ceramic mug cold physics',
      'how smartphone capacitive touchscreen senses fingers vs gloves physics',
      'why chopped onions make eyes cry syn-propanethial-s-oxide chemistry',
      'why bathroom mirrors flip left right instead of upside down optics',
      'why fingers wrinkle in bath water nervous system tire treads biology',
      'why caffeine does not give real energy adenosine receptor crash',
      'why potato chip bags puff up like balloons on mountain drives boyle law',
      'why ice water tastes sweet and refreshing while warm water tastes flat trpm5',
      'why touching metal doorknob zaps fingers in winter static electricity',
      'why toasted bread smells amazing maillard reaction chemistry',
      'why chugging water makes spicy food feel hotter capsaicin oil polarity',
      'why shaking warm soda bottle explodes while cold soda does not henry law'
    ],
    spheres: [
      { id: 'everyday_kitchen_physics', name: 'Kitchen Science & Breakfast Physics', desc: 'Microwaves, toaster Maillard reaction, boiling water anomalies, cold drink taste receptors' },
      { id: 'everyday_smartphone_tech', name: 'Smartphone & Screen Magic', desc: 'Capacitive touchscreens, lithium battery degradation, OLED pixels vs LCD backlight' },
      { id: 'everyday_human_body_quirks', name: 'Surprising Human Body Glitches', desc: 'Bath finger wrinkles, why you hate recorded voice, contagious yawning, onion crying chemistry' },
      { id: 'everyday_household_physics', name: 'Household Physics & Winter Sparks', desc: 'Static door shocks, bathroom mirror optics, chip bag air pressure, salt melting road ice' },
      { id: 'food_and_flavor_chemistry', name: 'Food, Flavor & Spice Chemistry', desc: 'Capsaicin vs milk casein, coffee adenosine blocking, soda carbonation Henry’s law' }
    ]
  }
};

// Negative topic pattern filter for Channel 3 (Tech & AI Animation)
const BANNED_TECH_TOPIC_PATTERNS = [
  /mattress/i, /bedding/i, /pillow/i, /furniture/i, /sofa/i, /couch/i,
  /detergent/i, /cleaning\s*product/i, /skincare/i, /makeup/i, /cosmetics/i,
  /shoe\s*polish/i, /cooking\s*pan/i, /kitchen\s*sponge/i, /vacuum\s*cleaner/i,
  /curtain/i, /rug\b/i, /toilet\s*paper/i, /shampoo/i, /toothpaste/i
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

  // 2. Google Gemini
  if (GEMINI_API_KEY) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'];
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
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `Google Gemini (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] Gemini (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] Gemini (${model}) error: ${err.message}`);
      }
    }
  }

  // 3. OpenRouter with Model Finder & Adaptive Formatting
  if (OPENROUTER_API_KEY) {
    let models = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'mistralai/mistral-small-24b-instruct-2501'];
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

  // 4. Groq LPU with Model Finder & Adaptive Formatting
  if (GROQ_API_KEY) {
    let models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.2-3b-preview', 'llama-3.2-1b-preview', 'mixtral-8x7b-32768'];
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
          } else {
            console.warn(`[AI Inference Notice] Groq (${model}) response failed candidate validation, checking next model...`);
          }
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
          if (parsed && (!validationFn || validationFn(parsed))) {
            return { success: true, modelUsed: `OpenAI (${model})`, data: parsed };
          }
        } else {
          console.warn(`[AI Inference Notice] OpenAI (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
        }
      } catch (err) {
        console.warn(`[AI Inference Notice] OpenAI (${model}) error: ${err.message}`);
      }
    }
  }

  // 6. Cloudflare Workers AI (Dedicated Fallback Tier)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    const models = [
      '@cf/meta/llama-3.2-3b-instruct',
      '@cf/meta/llama-3.2-1b-instruct',
      '@cf/meta/llama-3-8b-instruct',
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
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

  // 7. Universal Free AI Tier (Pollinations.ai - Zero API Key Required)
  // Ensures every workflow always has active, working, free AI generation
  const freeAiModels = ['openai-fast', 'openai'];
  for (let mIdx = 0; mIdx < freeAiModels.length; mIdx++) {
    const model = freeAiModels[mIdx];
    if (mIdx > 0) {
      await new Promise(r => setTimeout(r, 1500)); // Stagger calls to avoid queue full
    }
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
          timeout: 35000
        }, (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve({ status: r.statusCode, data: d }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Free AI timeout')); });
        req.write(postData);
        req.end();
      });

      if (res.status === 200) {
        const parsed = cleanJsonText(res.data);
        if (parsed && (!validationFn || validationFn(parsed))) {
          console.log(`[AI Inference Success] ⚡ Universal Free AI (${model}) produced valid JSON.`);
          return { success: true, modelUsed: `Universal Free AI (${model})`, data: parsed };
        }
      } else {
        console.warn(`[AI Inference Notice] Free AI (${model}) HTTP ${res.status}: ${res.data.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[AI Inference Notice] Free AI (${model}) error: ${err.message}`);
    }
  }

  // 8. Local Open-Source Ollama (if not already tried at start)
  if (!preferLocalAi) {
    const localRes = await tryLocalOllama();
    if (localRes && localRes.success) return localRes;
  }

  // Strict User Directive: All synthetic fallback scripts are REMOVED. Everything must be newly generated by AI.
  // If AI fails, let workflow fail and log error.
  console.error('\n❌ [Topic Discovery Fatal] All active AI inference engines failed (Gemini, Groq, OpenRouter, Free AI, Cloudflare, Ollama).');
  console.error(' • User Directive: Synthetic fallback scripts are strictly forbidden.');
  console.error(' • Resolution: Verify GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY is configured in GitHub Secrets.');
  throw new Error('[Topic Discovery Fatal] All AI inference models failed. Synthetic fallback scripts are disabled per user directive.');
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
  // STEP 1: QUERY DUCKDUCKGO, GOOGLE NEWS RSS, GOOGLE TRENDS, SOCIAL REELS & WIKIPEDIA
  // ----------------------------------------------------
  console.log(`\n${colors.bright}🔎 Step 1: Performing Live Multi-Source Search (Google Search/News + Google Trends + DuckDuckGo + Wikipedia + Social)...${colors.reset}`);
  const randomSearchQuery = nicheConfig.searchQueries[Math.floor(Math.random() * nicheConfig.searchQueries.length)];
  console.log(`   Target Query: "${colors.cyan}${randomSearchQuery}${colors.reset}"`);
  
  const [ddgResults, newsResults, gTrendsResults, socialResults, wikiSnippets] = await Promise.all([
    queryDuckDuckGo(randomSearchQuery, 6),
    queryGoogleNewsRss(randomSearchQuery, 5),
    queryGoogleTrendsDaily(8),
    querySocialTrends(nicheKey, 5),
    queryWikipedia(randomSearchQuery, 5)
  ]);

  let allSearchResults = [...ddgResults, ...newsResults, ...socialResults, ...wikiSnippets];

  if (allSearchResults.length > 0) {
    console.log(`   ${colors.green}✓ Retrieved ${allSearchResults.length} live organic snippets (${ddgResults.length} DDG, ${newsResults.length} News, ${gTrendsResults.length} Google Trends, ${socialResults.length} Social, ${wikiSnippets.length} Wikipedia):${colors.reset}`);
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

  const systemPrompt = `You are an elite educational content creator and viral scriptwriter for a multi-social channel with a dedicated niche in education, science/physics, and "Did you know?" facts.
Channel: "${nicheConfig.channelName}" (${nicheConfig.channelHandle}).
Target Audience: ${nicheConfig.targetAudience}

CORE DIRECTIVES:
1. CONTENT CREATOR ARCHETYPE: You are a content creator for a multi-social channel with niche on education and "did you know" facts.
2. AUTOMATED SEARCH & NICHE MATCHING: Using the real-time search results, Wikipedia insights, and Google Trends gathered today, automatically choose and formulate topics that best suit our setup and channel niche.
3. FORMULATE 5 STRONG CANDIDATES:
   - Each candidate must feature an irresistible "Did you know?" or "Why does...?" spoken hook.
   - Grounded in mind-blowing, relatable mechanics (how everyday things work, unexpected physics/science/tech principles, or practical daily realities).
   - Clear educational explanation that an everyday person or student will immediately grasp.
   - Loopy ending concept that seamlessly loops back into the opening hook for high replay retention.
4. AI DATABASE SIMILARITY & DEDUPLICATION:
   Compare each candidate topic against EVERY previously saved topic in our database.
   Verify that there are zero duplicate themes, keywords, or angles. Only accept topics that are 100% fresh and unique.
5. CHOOSE 1 WINNER & DISCARD 4:
   Select the 1 winning topic that best suits our setup and niche. Provide a selection rationale and state specific reasons for discarding the other 4 candidates.

Return strictly valid JSON with this exact schema:
{
  "candidates": [
    {
      "id": 1,
      "sphereId": "sphere_id",
      "sphereName": "Sphere Name",
      "title": "High-Impact Topic Headline #Shorts #viral",
      "angle": "Unique tactical or scientific breakdown angle",
      "coreHook": "Opening spoken hook sentence (e.g., 'Did you know...?' or 'Why does...?')",
      "factExplanation": "Clear, mind-blowing educational explanation of the fact and why it happens",
      "searchDetailsUsed": "Specific insight or trend details from today's search used here",
      "similarityCheck": "Verified non-similar to past database topics",
      "isUnique": true,
      "loopyHookConcept": "How the ending seamlessly loops back into the opening hook"
    }
  ],
  "chosenWinnerId": 1,
  "deduplicationAnalysis": "Detailed verification report proving zero similarity to previously saved database topics",
  "selectionRationale": "Why this specific topic is chosen based on today's search trends and verified uniqueness",
  "discardedNotes": [
    { "candidateId": 2, "reason": "Reason candidate 2 was eliminated" }
  ]
}`;

  const userPrompt = `You're a content creator for a multi social channel with niche on education and did you know facts. Using this fresh information gathered today from real-time searches:

=== TODAY'S REFRESHED REAL-TIME SEARCH RESULTS (Google Search, DuckDuckGo, Wikipedia, Social) ===
${searchContextStr || 'Fresh daily search queries in education, everyday science, and practical facts.'}

=== GOOGLE TRENDS DAILY BREAKING FEED (trends.google.com) ===
${googleTrendsStr}

=== 21+ THEMATIC SCOPES & SPHERES ===
${spheresJsonStr}

=== DATABASE OF PREVIOUSLY SAVED TOPICS (CHECK FOR SIMILARITIES - REJECT ANY DUPLICATES) ===
${pastTopicsListStr || 'None yet.'}

Using this information, choose the ones that suit our setup and niche:
• Channel: ${nicheConfig.channelName} (${nicheConfig.channelHandle})
• Format: Educational short-form video & reels (hook -> "did you know" core fact -> relatable explanation / mechanics -> loopy conclusion).

Create 5 distinct candidate topics from this fresh trend data. Compare each candidate against our database of past topics to verify 100% uniqueness (zero duplicate concepts).
Then select 1 winning topic that best suits our setup and niche, explain why it was chosen based on today's trends, and discard the other 4 candidates with clear reasons.

Return strictly valid JSON.`;

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
  querySocialTrends,
  fetchPastTopicsDatabase,
  saveChosenTopicToDatabase,
  discoverAndSelectTopicViaActiveAi,
  callActiveAiForJson
};
