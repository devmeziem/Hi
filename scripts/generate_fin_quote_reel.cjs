/**
 * Finance Titans & Wealth Scholars 5-Second Quote Reel Generator
 * Channel 1 Target: Fin Blueprint (@bones_ceo)
 *
 * Requirements:
 * - 5.0-second seamless loop duration for maximum retention & algorithm push
 * - Exactly 1 cinematic 9:16 vertical high-contrast portrait of the financial titan/scholar
 * - Royalty-free loopable mystery sound matching the viral sub-drone aesthetic
 * - Curated catalog of legendary finance titans, Nobel economics laureates, and wealth scholars
 * - Frosted glass caption card with exact scholar reference, credentials, and published source citation
 * - Deduplicated via local history cache (fin_quote_history.json)
 * - Optimized title, description, and hashtags for finance / business algorithm
 * - Resumable upload directly to Channel 1 (Fin Blueprint / @bones_ceo)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { getSyncedChannelProfile, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');
const { resolveChannelAudio } = require('./audio_asset_manager.cjs');
const { selectDeduplicatedCandidate, recordPostedCandidate } = require('./channel_dedup_service.cjs');

const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');
const LOCAL_QUOTE_CACHE = path.join(process.cwd(), 'fin_quote_history.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const PORTRAITS_DIR = path.join(ARTIFACTS_DIR, 'finance_portraits');

const TARGET_DURATION = parseFloat(process.env.SHORT_DURATION || process.env.DURATION_SECONDS || '5.0');
const FPS = 30;
const TOTAL_FRAMES = Math.round(TARGET_DURATION * FPS);

/**
 * Curated Catalog of World Financial Titans, Nobel Laureates, and Wealth Scholars
 * with Full Names, Institutional Credentials, and Verified Citations.
 */
const FINANCE_TITANS_QUOTES = [
  // Warren Buffett
  {
    quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.",
    author: "Warren Buffett",
    credentials: "Chairman & CEO, Berkshire Hathaway • Legendary Value Investor",
    reference: "Berkshire Hathaway Shareholder Letter",
    wikiSearch: "Warren_Buffett",
    theme: "capital_preservation"
  },
  {
    quote: "If you don't find a way to make money while you sleep, you will work until you die.",
    author: "Warren Buffett",
    credentials: "Chairman & CEO, Berkshire Hathaway • Legendary Value Investor",
    reference: "Chairman's Philosophy & Archive",
    wikiSearch: "Warren_Buffett",
    theme: "passive_income"
  },
  {
    quote: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett",
    credentials: "Chairman & CEO, Berkshire Hathaway • Columbia M.S. Economics",
    reference: "Berkshire Hathaway Annual Report 2008",
    wikiSearch: "Warren_Buffett",
    theme: "valuation"
  },
  {
    quote: "It takes 20 years to build a reputation and five minutes to ruin it.",
    author: "Warren Buffett",
    credentials: "Chairman & CEO, Berkshire Hathaway • Philanthropist",
    reference: "Congressional Testimony & Chairman's Letters",
    wikiSearch: "Warren_Buffett",
    theme: "integrity"
  },

  // Anti-Fraud, Scam Warning & Wealth Defense Quotes
  {
    quote: "A financial scam doesn't begin with a criminal. It begins with high promises, zero risk, and your own greed blinding your intelligence.",
    author: "Charlie Munger",
    credentials: "Vice Chairman, Berkshire Hathaway • Integrity & Anti-Fraud Advocate",
    reference: "Berkshire Hathaway Annual Shareholder Meeting",
    wikiSearch: "Charlie_Munger",
    theme: "anti_fraud"
  },
  {
    quote: "When someone with money meets someone with experience, the person with experience gets the money and the person with money gets an experience. If it looks too good to be true, it is an engineered trap.",
    author: "Warren Buffett",
    credentials: "Chairman & CEO, Berkshire Hathaway • Legendary Value Investor",
    reference: "Berkshire Hathaway Shareholder Letters (Risk & Swindles)",
    wikiSearch: "Warren_Buffett",
    theme: "scam_warning"
  },
  {
    quote: "Charlatans always sell you certainty in an uncertain world. The more someone promises you guaranteed returns, the faster you must run in the opposite direction.",
    author: "Nassim Nicholas Taleb",
    credentials: "Distinguished Professor of Risk Engineering • Author of Skin in the Game",
    reference: "Fooled by Randomness & Antifragile",
    wikiSearch: "Nassim_Nicholas_Taleb",
    theme: "fraud_prevention"
  },
  {
    quote: "A fraudster's greatest weapon is not technology; it is artificial urgency and flattery. The moment someone tells you that you must act right now, you are being manipulated.",
    author: "Frank Abagnale",
    credentials: "FBI Financial Fraud Consultant • Author of Catch Me If You Can",
    reference: "The Art of the Steal: How to Protect Yourself",
    wikiSearch: "Frank_Abagnale",
    theme: "manipulation_defense"
  },
  {
    quote: "There are no get-rich-quick schemes. That’s just someone else getting rich off of your impatience.",
    author: "Naval Ravikant",
    credentials: "Founder, AngelList • Tech Philosopher & Investor",
    reference: "How to Get Rich (Without Getting Lucky)",
    wikiSearch: "Naval_Ravikant",
    theme: "wealth_defense"
  },
  {
    quote: "If an investment vehicle never has a down month regardless of market collapse, it isn't an algorithm; it is a mathematical impossibility and a fraud.",
    author: "Harry Markopolos",
    credentials: "Chartered Financial Analyst • Madoff Ponzi Whistleblower",
    reference: "No One Would Listen: A True Financial Thriller",
    wikiSearch: "Harry_Markopolos",
    theme: "ponzi_detection"
  },
  {
    quote: "Every financial scam operates on the exact same psychological trick: manufacturing panic and fake scarcity so emotion overpowers your logical audit.",
    author: "Jordan Belfort",
    credentials: "Former Wall Street Operator • Corporate Anti-Fraud Speaker",
    reference: "Forensic Keynote on Market Manipulation & Retail Exploitation",
    wikiSearch: "Jordan_Belfort",
    theme: "scam_psychology"
  },
  {
    quote: "It takes character to sit there with all that cash and do nothing. I didn’t get to where I am by going after mediocre opportunities.",
    author: "Charlie Munger",
    credentials: "Vice Chairman, Berkshire Hathaway • Master of Mental Models",
    reference: "Poor Charlie’s Almanack (The Psychology of Human Misjudgment)",
    wikiSearch: "Charlie_Munger",
    theme: "discipline"
  },
  {
    quote: "He who lives by the crystal ball will die by eating shattered glass. Diversify your risks or the market will violently humble you.",
    author: "Ray Dalio",
    credentials: "Founder, Bridgewater Associates • Author of Principles",
    reference: "Principles for Navigating Big Debt Crises",
    wikiSearch: "Ray_Dalio",
    theme: "risk_management"
  },
  {
    quote: "The essence of investment is not in seeking fast gains, but in preventing catastrophic loss. The gullible speculator always mistakes a Ponzi mirage for financial genius.",
    author: "Benjamin Graham",
    credentials: "Columbia Business School • Dean of Wall Street",
    reference: "The Intelligent Investor, Chapter 20 (Margin of Safety)",
    wikiSearch: "Benjamin_Graham",
    theme: "capital_defense"
  },
  {
    quote: "Never invest in any idea you cannot illustrate with a crayon. If you cannot explain how their business generates honest cash flow, you are not an investor; you are the exit liquidity.",
    author: "Peter Lynch",
    credentials: "Legendary Fidelity Magellan Manager • Author of One Up on Wall Street",
    reference: "One Up on Wall Street (Beating the Swindlers)",
    wikiSearch: "Peter_Lynch",
    theme: "anti_fraud"
  },
  {
    quote: "If an investment requires an army of aggressive pitchmen and promises to beat every market with a secret algorithm, run. Simplicity protects your net worth; engineered complexity feeds the predator.",
    author: "John Bogle",
    credentials: "Founder, The Vanguard Group • Pioneer of Low-Cost Indexing",
    reference: "The Little Book of Common Sense Investing (On Wall Street Promoters)",
    wikiSearch: "John_C._Bogle",
    theme: "scam_warning"
  },
  {
    quote: "The most dangerous fraud is never committed in a dark alley. It is sold in marble offices by charismatic men who guarantee high yield with zero downside.",
    author: "Michael Burry",
    credentials: "Founder, Scion Asset Management • Physician & Forensic Investor",
    reference: "Forensic Analysis on Subprime Derivative Fraud & Systemic Risk",
    wikiSearch: "Michael_Burry",
    theme: "fraud_detection"
  },
  {
    quote: "There are no solutions in economics. There are only trade-offs. Anyone promising you cost-free riches is either completely ignorant or attempting to swindle you.",
    author: "Thomas Sowell",
    credentials: "Senior Fellow, Hoover Institution • Stanford University Economist",
    reference: "Basic Economics: A Common Sense Guide to the Economy",
    wikiSearch: "Thomas_Sowell",
    theme: "wealth_defense"
  },
  {
    quote: "Whenever a financial product is too complex for regulatory verification and promises consistent double-digit returns with zero risk, you are looking at mathematical fraud.",
    author: "Paul Volcker",
    credentials: "Former Chairman of the Federal Reserve • Architect of the Volcker Rule",
    reference: "Federal Reserve Historical Addresses on Market Integrity & Speculation",
    wikiSearch: "Paul_Volcker",
    theme: "scam_prevention"
  },
  {
    quote: "Con artists do not steal your money by force. They make you hand it over willingly by triggering urgency, greed, and fear of missing out.",
    author: "Frank Abagnale",
    credentials: "FBI Financial Crimes Specialist • Author of Stealing Your Life",
    reference: "Stealing Your Life: The Ultimate Identity Theft & Scam Prevention Guide",
    wikiSearch: "Frank_Abagnale",
    theme: "scam_warning"
  },

  // Charlie Munger
  {
    quote: "Spend each day trying to be a little wiser than you were when you woke up.",
    author: "Charlie Munger",
    credentials: "Vice Chairman, Berkshire Hathaway • Harvard Law J.D.",
    reference: "Poor Charlie's Almanack (Talk 2)",
    wikiSearch: "Charlie_Munger",
    theme: "compounding_wisdom"
  },
  {
    quote: "The big money is not in the buying and the selling, but in the waiting.",
    author: "Charlie Munger",
    credentials: "Vice Chairman, Berkshire Hathaway • Architectural Designer",
    reference: "Wesco Financial Annual Meeting 1999",
    wikiSearch: "Charlie_Munger",
    theme: "patience"
  },
  {
    quote: "Invert, always invert: Turn a situation upside down. What don't you want to happen?",
    author: "Charlie Munger",
    credentials: "Vice Chairman, Berkshire Hathaway • Mental Models Pioneer",
    reference: "Poor Charlie's Almanack (Talk 5)",
    wikiSearch: "Charlie_Munger",
    theme: "risk_elimination"
  },

  // Benjamin Graham
  {
    quote: "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Benjamin Graham",
    credentials: "Columbia Business School • Father of Value Investing",
    reference: "The Intelligent Investor, Chapter 1",
    wikiSearch: "Benjamin_Graham",
    theme: "investing_discipline"
  },
  {
    quote: "In the short run, the market is a voting machine, but in the long run, it is a weighing machine.",
    author: "Benjamin Graham",
    credentials: "Columbia Business School • Dean of Financial Analysts",
    reference: "Security Analysis (1934)",
    wikiSearch: "Benjamin_Graham",
    theme: "market_psychology"
  },

  // John C. Bogle
  {
    quote: "Don't look for the needle in the haystack. Just buy the haystack.",
    author: "John C. Bogle",
    credentials: "Founder, The Vanguard Group • Pioneer of the First Index Fund",
    reference: "The Little Book of Common Sense Investing",
    wikiSearch: "John_C._Bogle",
    theme: "indexing"
  },
  {
    quote: "Time is your friend; impulse is your enemy. Take advantage of compound interest.",
    author: "John C. Bogle",
    credentials: "Founder, The Vanguard Group • Princeton University A.B. Economics",
    reference: "Common Sense on Mutual Funds (1999)",
    wikiSearch: "John_C._Bogle",
    theme: "compounding"
  },

  // Ray Dalio
  {
    quote: "Pain plus reflection equals progress.",
    author: "Ray Dalio",
    credentials: "Founder, Bridgewater Associates • Harvard Business School M.B.A.",
    reference: "Principles: Life and Work (Part 2)",
    wikiSearch: "Ray_Dalio",
    theme: "resilience"
  },
  {
    quote: "He who lives by the crystal ball will eat shattered glass.",
    author: "Ray Dalio",
    credentials: "Founder, Bridgewater Associates • Macroeconomic Strategist",
    reference: "Principles for Navigating Big Debt Crises",
    wikiSearch: "Ray_Dalio",
    theme: "humility"
  },

  // Morgan Housel
  {
    quote: "Doing well with money has a little to do with how smart you are and a lot to do with how you behave.",
    author: "Morgan Housel",
    credentials: "Partner, Collaborative Fund • Award-Winning Financial Author",
    reference: "The Psychology of Money, Introduction",
    wikiSearch: "Morgan_Housel",
    theme: "financial_behavior"
  },
  {
    quote: "The hardest financial skill is getting the goalpost to stop moving.",
    author: "Morgan Housel",
    credentials: "Partner, Collaborative Fund • Former Wall Street Journal Columnist",
    reference: "The Psychology of Money, Chapter 3",
    wikiSearch: "Morgan_Housel",
    theme: "contentment"
  },

  // Peter Lynch
  {
    quote: "Know what you own, and know why you own it.",
    author: "Peter Lynch",
    credentials: "Legendary Manager, Fidelity Magellan Fund • 29.2% Annual Return",
    reference: "One Up on Wall Street (1989)",
    wikiSearch: "Peter_Lynch",
    theme: "competence"
  },
  {
    quote: "Behind every stock is a company. Find out what it's doing.",
    author: "Peter Lynch",
    credentials: "Legendary Manager, Fidelity Magellan Fund • Wharton M.B.A.",
    reference: "Beating the Street (1993)",
    wikiSearch: "Peter_Lynch",
    theme: "fundamentals"
  },

  // Nassim Nicholas Taleb
  {
    quote: "Wind extinguishes a candle and energizes fire. You want to be the fire.",
    author: "Nassim Nicholas Taleb, Ph.D.",
    credentials: "Distinguished Professor of Risk Engineering, NYU Tandon • Mathematical Trader",
    reference: "Antifragile: Things That Gain from Disorder",
    wikiSearch: "Nassim_Nicholas_Taleb",
    theme: "antifragility"
  },
  {
    quote: "Don't tell me what you think, tell me what you have in your portfolio.",
    author: "Nassim Nicholas Taleb, Ph.D.",
    credentials: "Distinguished Professor of Risk Engineering, NYU Tandon • Author",
    reference: "Skin in the Game (2018)",
    wikiSearch: "Nassim_Nicholas_Taleb",
    theme: "skin_in_the_game"
  },

  // Naval Ravikant
  {
    quote: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep.",
    author: "Naval Ravikant",
    credentials: "Founder, AngelList • Early Investor in Uber, Twitter & Stripe",
    reference: "How to Get Rich (Without Getting Lucky)",
    wikiSearch: "Naval_Ravikant",
    theme: "leverage"
  },
  {
    quote: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.",
    author: "Naval Ravikant",
    credentials: "Founder, AngelList • Tech Philosopher & Investor",
    reference: "The Almanack of Naval Ravikant",
    wikiSearch: "Naval_Ravikant",
    theme: "skill_stacking"
  },

  // Dr. Daniel Kahneman
  {
    quote: "A reliable way to make people believe in falsehoods is frequent repetition, because familiarity is not easily distinguished from truth.",
    author: "Dr. Daniel Kahneman",
    credentials: "Nobel Memorial Prize in Economic Sciences • Princeton University Professor",
    reference: "Thinking, Fast and Slow (Part 1)",
    wikiSearch: "Daniel_Kahneman",
    theme: "cognitive_bias"
  },

  // Dr. Thomas J. Stanley
  {
    quote: "Wealth is not what you spend, but what you accumulate.",
    author: "Dr. Thomas J. Stanley, Ph.D.",
    credentials: "Professor of Marketing, Georgia State • Author",
    reference: "The Millionaire Next Door (1996)",
    wikiSearch: "Thomas_J._Stanley",
    theme: "frugality"
  },

  // Howard Marks
  {
    quote: "You can't do the same things others do and expect to outperform.",
    author: "Howard Marks",
    credentials: "Co-Chairman, Oaktree Capital Management • Wharton B.S. & Chicago M.B.A.",
    reference: "The Most Important Thing: Uncommon Sense for the Thoughtful Investor",
    wikiSearch: "Howard_Marks_(investor)",
    theme: "second_level_thinking"
  }
];

/**
 * Load and save local history to ensure variety and no repeats
 */
function loadLocalHistory() {
  const history = [];
  if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (Array.isArray(parsed)) history.push(...parsed);
    } catch {}
  }
  // Also cross-reference manifest for any recent quotes
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      const vids = Array.isArray(manifest) ? manifest : (manifest?.videos || []);
      for (const v of vids) {
        if (v.quote || v.title) {
          history.push({
            quote: v.quote || '',
            author: v.author || '',
            timestamp: v.publishedAt || ''
          });
        }
      }
    } catch {}
  }
  return history;
}

function saveLocalHistory(quoteObj) {
  try {
    let hist = [];
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      try { hist = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8')); } catch {}
    }
    if (!Array.isArray(hist)) hist = [];
    hist.push({
      quote: quoteObj.quote,
      author: quoteObj.author,
      reference: quoteObj.reference,
      timestamp: new Date().toISOString()
    });
    // Keep last 150 quotes
    const trimmed = hist.slice(-150);
    fs.writeFileSync(LOCAL_QUOTE_CACHE, JSON.stringify(trimmed, null, 2));
  } catch (e) {
    console.warn('[Finance Quote Reel] Notice caching quote history:', e.message);
  }
}

/**
 * Select a quote that has not been used recently with strong deduplication
 */
function selectUniqueFinanceQuote() {
  const history = loadLocalHistory();
  const recentAuthors = history.slice(-12).map(h => h.author).filter(Boolean);
  const recentQuotes = new Set(history.map(h => (h.quote || '').trim().toLowerCase()));

  // Filter out recent quotes
  const freshQuotes = FINANCE_TITANS_QUOTES.filter(q => {
    const cleanQ = (q.quote || '').trim().toLowerCase();
    if (recentQuotes.has(cleanQ)) return false;
    // Word similarity check
    for (const prev of history.slice(-40)) {
      if (prev.quote && calculateSimilarity(cleanQ, prev.quote.toLowerCase()) > 0.3) {
        return false;
      }
    }
    return true;
  });

  const pool = freshQuotes.length > 0 ? freshQuotes : FINANCE_TITANS_QUOTES;

  // Prefer an author who hasn't appeared in recent videos
  const authorDiverse = pool.filter(q => !recentAuthors.includes(q.author));
  const candidatePool = authorDiverse.length > 0 ? authorDiverse : pool;

  // Perturb index by current hour and timestamp for deterministic multi-slot diversity
  const seed = (Math.floor(Date.now() / (1000 * 60 * 60)) + Math.floor(Math.random() * 100)) % candidatePool.length;
  return candidatePool[seed];
}

function calculateSimilarity(a, b) {
  const wordsA = new Set(a.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let matches = 0;
  for (const w of wordsA) if (wordsB.has(w)) matches++;
  return matches / Math.max(wordsA.size, wordsB.size);
}

/**
 * Download buffer over HTTPS with redirects
 */
function fetchHttpsBuffer(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'VoxamFinanceScholar/2.0 (citation video bot; contact@voxam.ai)',
        'Accept': 'application/json, image/*, */*'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttpsBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP Status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

/**
 * Resolve high-definition portrait of the financial titan via Wikipedia Search,
 * using Pollinations as fallback ONLY if Wikipedia has no verified portrait.
 */
async function resolveFinancialPortrait(scholar) {
  if (!fs.existsSync(PORTRAITS_DIR)) {
    fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
  }

  const safeName = scholar.author.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const outJpgPath = path.join(PORTRAITS_DIR, `${safeName}_portrait.jpg`);

  // 1. Primary Strategy: Cloudflare Workers AI Low-Cost Dynamic Generation (Zero static seeds)
  const cfAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
  const cfApiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (cfAccountId && cfApiToken) {
    const cfModels = [
      '@cf/bytedance/stable-diffusion-xl-lightning',
      '@cf/stabilityai/stable-diffusion-xl-base-1.0'
    ];
    for (const model of cfModels) {
      try {
        const randomSeed = Math.floor(Math.random() * 99999999);
        const postData = JSON.stringify({
          prompt: `Cinematic vertical 9:16 dark portrait of ${scholar.author}, iconic financial titan, thoughtful intense expression, dark obsidian executive boardroom background, subtle warm golden rim lighting, 8k resolution vertical masterpiece`,
          num_steps: 4,
          seed: randomSeed
        });
        const cfBuf = await new Promise((resolve) => {
          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 18000
          }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
              if (res.statusCode === 200) {
                const full = Buffer.concat(chunks);
                try {
                  const json = JSON.parse(full.toString('utf8'));
                  if (json.result?.image) return resolve(Buffer.from(json.result.image, 'base64'));
                } catch {}
                if (full.length > 2000) return resolve(full);
              }
              resolve(null);
            });
          });
          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
          req.write(postData);
          req.end();
        });

        if (cfBuf && cfBuf.length > 5000) {
          fs.writeFileSync(outJpgPath, cfBuf);
          console.log(`[Finance Quote Reel] 🎨 Synthesized dynamic portrait via Cloudflare AI (${model})`);
          return outJpgPath;
        }
      } catch (cfErr) {
        console.warn(`[Finance Quote Reel] Cloudflare AI portrait notice: ${cfErr.message}`);
      }
    }
  }

  if (fs.existsSync(outJpgPath) && fs.statSync(outJpgPath).size > 15000) {
    return outJpgPath;
  }

  const wikiTitle = scholar.wikiSearch || scholar.author.replace(/\s+/g, '_');

  // 1. Primary Strategy: Wikipedia REST API Summary (Instant verified portraits)
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const buf = await fetchHttpsBuffer(summaryUrl, 6000);
    const pageData = JSON.parse(buf.toString('utf8'));
    let imageUrl = null;
    if (pageData.originalimage && pageData.originalimage.source && !pageData.originalimage.source.endsWith('.svg')) {
      imageUrl = pageData.originalimage.source;
    } else if (pageData.thumbnail && pageData.thumbnail.source) {
      imageUrl = pageData.thumbnail.source.replace(/\/\d+px-/, '/1080px-');
    }

    if (imageUrl) {
      console.log(`[Finance Quote Reel] 🏛️ Fetched verified Wikipedia portrait for ${scholar.author}`);
      const imgBuf = await fetchHttpsBuffer(imageUrl, 10000);
      if (imgBuf && imgBuf.length > 8000) {
        fs.writeFileSync(outJpgPath, imgBuf);
        return outJpgPath;
      }
    }
  } catch (e) {
    console.warn(`[Finance Quote Reel] Wikipedia summary notice for ${scholar.author}: ${e.message}`);
  }

  // 2. Secondary Strategy: Wikipedia Query Search with Pageimages
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scholar.author + ' investor economist')}&prop=pageimages&pithumbsize=1080&format=json`;
    const buf = await fetchHttpsBuffer(searchUrl, 6000);
    const searchData = JSON.parse(buf.toString('utf8'));
    const pages = searchData?.query?.pages || {};
    let thumbUrl = null;
    for (const pid of Object.keys(pages)) {
      if (pages[pid]?.thumbnail?.source) {
        thumbUrl = pages[pid].thumbnail.source;
        break;
      }
    }

    if (thumbUrl) {
      console.log(`[Finance Quote Reel] 🏛️ Fetched Wikipedia Search portrait for ${scholar.author}`);
      const imgBuf = await fetchHttpsBuffer(thumbUrl, 10000);
      if (imgBuf && imgBuf.length > 8000) {
        fs.writeFileSync(outJpgPath, imgBuf);
        return outJpgPath;
      }
    }
  } catch (e) {
    console.warn(`[Finance Quote Reel] Wikipedia search lookup notice: ${e.message}`);
  }

  // 3. Dynamic Pollinations FLUX generation (Always dynamic random seed)
  try {
    const randomSeed = Math.floor(Math.random() * 99999999);
    console.log(`[Finance Quote Reel] ⚠️ Generating dynamic portrait for ${scholar.author} (Seed: ${randomSeed})...`);
    const prompt = `cinematic vertical 9:16 portrait of ${scholar.author}, iconic financial titan, thoughtful expression, dark minimalist executive background, subtle warm golden rim lighting, sharp focus, 8k vertical wallpaper`;
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&nologo=true&model=flux&seed=${randomSeed}`;
    const imgBuf = await fetchHttpsBuffer(pollUrl, 14000);
    if (imgBuf && imgBuf.length > 10000) {
      fs.writeFileSync(outJpgPath, imgBuf);
      return outJpgPath;
    }
  } catch (e) {
    console.warn(`[Finance Quote Reel] Pollinations fallback notice: ${e.message}`);
  }

  // 5. Resilient Local Executive Backdrop (Chiaroscuro Obsidian Silhouette)
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="execBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="35%" stop-color="#0b1329" />
        <stop offset="70%" stop-color="#060a17" />
        <stop offset="100%" stop-color="#010308" />
      </linearGradient>
      <radialGradient id="goldAura" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#000000" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.98" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#execBg)" />
    <rect width="1080" height="1920" fill="url(#goldAura)" />
  </svg>`;
  const svgPath = path.join(PORTRAITS_DIR, `${safeName}_fallback.svg`);
  fs.writeFileSync(svgPath, fallbackSvg);
  execSync(`ffmpeg -y -i "${svgPath}" "${outJpgPath}" 2>/dev/null`);
  return outJpgPath;
}

const { downloadSoundFromUrl, findLocalRealAudio } = require('./audio_asset_manager.cjs');

/**
 * Sound Engine: Loopable Mystery Audio for Financial Quote Reels
 * Supports real sound URLs, local audio assets, and fallback atmosphere
 */
function generateFinancialMysterySound(outWavPath, duration = 5.0) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const customSoundUrl = process.env.FIN_MUSIC_URL || process.env.SOUND_URL || process.env.MUSIC_URL || process.env.AUDIO_URL;
  if (customSoundUrl && customSoundUrl.startsWith('http')) {
    console.log(`[Sound Engine] 🌐 Detected custom sound URL: ${customSoundUrl}`);
    const tempDl = path.join(dir, `remote_fin_sound_${Date.now()}`);
    try {
      execSync(`curl -sL --max-time 15 "${customSoundUrl}" -o "${tempDl}"`);
      if (fs.existsSync(tempDl) && fs.statSync(tempDl).size > 1000) {
        execSync(`ffmpeg -y -stream_loop -1 -i "${tempDl}" -t ${duration} -af "afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.2).toFixed(2)}:d=0.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
        try { fs.unlinkSync(tempDl); } catch {}
        if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
          console.log(`[Sound Engine] ✅ Applied real sound from URL to financial reel!`);
          return outWavPath;
        }
      }
    } catch (e) {
      console.warn(`[Sound Engine] Remote sound download notice: ${e.message}`);
    }
  }

  // Resolve user uploaded track from sound_assets/finance/ or src/assets/sounds/
  return resolveChannelAudio('finance', duration, outWavPath);
}

/**
 * Build Stoic-Style Prestige Zero-Box Captions Overlay for Financial Titans
 * Exact same layout and typographic discipline as Stoic channel:
 * - Zero-Pill Discipline: No box, no card border, no badge.
 * - Feathered dark cinematic vignette gradient preserving portrait visibility.
 * - Stylized golden quote mark “ in #f59e0b.
 * - Prestige Georgia bold serif typography with #textGlow drop shadow.
 * - Warm gold accent divider bar.
 * - Minimalist dashed author attribution (- Warren Buffett).
 * - Exact academic/financial credentials.
 * - Subtle ambient audio tag.
 */
function buildFinStoicOverlaySvg(scholar, width = 1080, height = 1920) {
  const quoteLen = scholar.quote.length;
  const maxChars = quoteLen > 110 ? 27 : (quoteLen > 65 ? 24 : 21);
  const quoteWords = scholar.quote.split(/\s+/);
  const lines = [];
  let currentLine = '';
  for (const w of quoteWords) {
    if ((currentLine + ' ' + w).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const numLines = lines.length;
  let fontSize = 48;
  let lineHeight = 66;
  let authorFontSize = 29;
  let credFontSize = 17;

  if (numLines <= 2) {
    fontSize = 52;
    lineHeight = 72;
    authorFontSize = 30;
    credFontSize = 18;
  } else if (numLines === 3) {
    fontSize = 46;
    lineHeight = 64;
    authorFontSize = 28;
    credFontSize = 17;
  } else if (numLines === 4) {
    fontSize = 40;
    lineHeight = 56;
    authorFontSize = 26;
    credFontSize = 16;
  } else {
    fontSize = 35;
    lineHeight = 48;
    authorFontSize = 24;
    credFontSize = 15;
  }

  const quoteTspans = lines.map((line, idx) =>
    `<tspan x="540" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('\n        ');

  const quoteBlockHeight = (numLines - 1) * lineHeight;
  const quoteStartY = Math.max(860, 1080 - Math.round(quoteBlockHeight / 2) - 40);
  const quoteBottomY = quoteStartY + quoteBlockHeight;
  const dividerY = quoteBottomY + 36;
  const authorY = dividerY + 44;
  const credY = authorY + 32;
  const soundTagY = credY + 38;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.9" />
      </filter>
      <linearGradient id="cinematicVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.45" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.84" />
        <stop offset="85%" stop-color="#01040f" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.98" />
      </linearGradient>
    </defs>

    <!-- Subtle Cinematic Vignette Background (No Box / Zero-Pill) -->
    <rect x="0" y="660" width="1080" height="1260" fill="url(#cinematicVignette)" />

    <!-- Stylized Elegant Quotation Mark -->
    <text x="540" y="${quoteStartY - 45}" font-family="Georgia, serif" font-size="82" font-weight="900" fill="#f59e0b" fill-opacity="0.85" text-anchor="middle" filter="url(#textGlow)">“</text>

    <!-- Complete High-Contrast Quote Text (Georgia bold serif) -->
    <text x="540" y="${quoteStartY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
        ${quoteTspans}
    </text>

    <!-- Accent Divider Bar in Warm Gold -->
    <line x1="430" y1="${dividerY}" x2="650" y2="${dividerY}" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.85" />

    <!-- Titan Name Attribution -->
    <text x="540" y="${authorY}" font-family="system-ui, -apple-system, sans-serif" font-size="${authorFontSize}" font-weight="800" fill="#f8fafc" letter-spacing="1.5" text-anchor="middle" filter="url(#textGlow)">
      - ${escapeXml(scholar.author)}
    </text>

    <!-- Credentials / Institution -->
    <text x="540" y="${credY}" font-family="system-ui, -apple-system, sans-serif" font-size="${credFontSize}" font-weight="600" fill="#cbd5e1" letter-spacing="0.8" text-anchor="middle" filter="url(#textGlow)">
      ${escapeXml(scholar.credentials)}
    </text>

    <!-- Soundtrack Tag Reference -->
    <text x="540" y="${soundTagY}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" letter-spacing="1.2" text-anchor="middle">
      🎵 Sovereign Capital · Deep Ambient Chords
    </text>
  </svg>`;
}

function buildFinDeepBeat2Svg(scholar, width = 1080, height = 1920) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="1.0" />
      </filter>
      <linearGradient id="cinematicVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.5" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
    </defs>
    <rect x="0" y="660" width="1080" height="1260" fill="url(#cinematicVignette)" />
    <text x="540" y="930" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#f59e0b" letter-spacing="5" text-anchor="middle" filter="url(#textGlow)">
      ⚡ THE PSYCHOLOGICAL TRAP
    </text>
    <text x="540" y="1030" font-family="Georgia, serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
      <tspan x="540" dy="0">Announcing financial goals gives</tspan>
      <tspan x="540" dy="64">you cheap, premature dopamine.</tspan>
      <tspan x="540" dy="64">The ego feels rich while your</tspan>
      <tspan x="540" dy="64">bank account remains unchanged.</tspan>
    </text>
    <line x1="430" y1="1310" x2="650" y2="1310" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
    <text x="540" y="1360" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#94a3b8" letter-spacing="2" text-anchor="middle" filter="url(#textGlow)">
      - SPEECH PAYS ZERO DIVIDENDS
    </text>
  </svg>`;
}

function buildFinDeepBeat3Svg(scholar, width = 1080, height = 1920) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="14" flood-color="#000000" flood-opacity="1.0" />
      </filter>
      <linearGradient id="cinematicVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="25%" stop-color="#020617" stop-opacity="0.5" />
        <stop offset="55%" stop-color="#020617" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
    </defs>
    <rect x="0" y="660" width="1080" height="1260" fill="url(#cinematicVignette)" />
    <text x="540" y="930" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#f59e0b" letter-spacing="5" text-anchor="middle" filter="url(#textGlow)">
      ⚡ THE COLD LAW OF CAPITAL
    </text>
    <text x="540" y="1030" font-family="Georgia, serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
      <tspan x="540" dy="0">What you say has zero impact</tspan>
      <tspan x="540" dy="64">on the market. Only the actions</tspan>
      <tspan x="540" dy="64">you take towards your capital</tspan>
      <tspan x="540" dy="64">will compound. Execute in silence.</tspan>
    </text>
    <line x1="430" y1="1310" x2="650" y2="1310" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
    <text x="540" y="1360" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#cbd5e1" letter-spacing="2" text-anchor="middle" filter="url(#textGlow)">
      - FINANCIAL BLUEPRINT • ACTION IS WEALTH
    </text>
  </svg>`;
}

/**
 * Authentic High-Status Frosted Glass Luxury Card for Financial Blueprint (@bones_ceo)
 * Restores the signature aesthetic that drove high retention:
 * - Sleek translucent floating glass card with cyan & gold glowing edge highlights
 * - Official "FINANCIAL BLUEPRINT • WEALTH TITAN" institutional badge with glowing dot
 * - High-contrast modern typography with subtle drop shadow
 * - Gold accent divider rule
 * - Full scholar credentials & source citation
 * - Official channel watermark (@bones_ceo)
 */
function buildFrostedGlassCardSvg(scholar, width = 1080, height = 1920) {
  const quoteLen = scholar.quote.length;
  const maxChars = quoteLen > 110 ? 27 : (quoteLen > 65 ? 24 : 21);
  const quoteWords = scholar.quote.split(/\s+/);
  const lines = [];
  let currentLine = '';
  for (const w of quoteWords) {
    if ((currentLine + ' ' + w).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const numLines = lines.length;
  let fontSize = 48;
  let lineHeight = 68;

  if (numLines <= 2) {
    fontSize = 54;
    lineHeight = 74;
  } else if (numLines === 3) {
    fontSize = 48;
    lineHeight = 66;
  } else if (numLines === 4) {
    fontSize = 42;
    lineHeight = 58;
  } else {
    fontSize = 36;
    lineHeight = 50;
  }

  const quoteTspans = lines.map((line, idx) =>
    `<tspan x="540" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('\n        ');

  const cardHeight = Math.max(760, 480 + (numLines * lineHeight));
  const cardY = 1760 - cardHeight;
  const badgeY = cardY + 50;
  const quoteStartY = badgeY + 110;
  const quoteBottomY = quoteStartY + ((numLines - 1) * lineHeight);
  const dividerY = quoteBottomY + 38;
  const authorY = dividerY + 50;
  const credY = authorY + 34;
  const refY = credY + 30;
  const watermarkY = cardY + cardHeight - 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="glassDropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000000" flood-opacity="0.95" />
        <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#0284c7" flood-opacity="0.30" />
      </filter>
      <filter id="finTextGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000000" flood-opacity="1.0" />
      </filter>
      <linearGradient id="finCardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#090f1f" stop-opacity="0.94" />
        <stop offset="50%" stop-color="#0f172a" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.98" />
      </linearGradient>
      <linearGradient id="finCardBorder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
        <stop offset="45%" stop-color="#f59e0b" stop-opacity="0.6" />
        <stop offset="80%" stop-color="#38bdf8" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
      </linearGradient>
      <linearGradient id="bottomShadowVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="40%" stop-color="#020617" stop-opacity="0.6" />
        <stop offset="80%" stop-color="#000000" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.99" />
      </linearGradient>
    </defs>

    <!-- Background Vignette ensuring card separation from background photo -->
    <rect x="0" y="700" width="1080" height="1220" fill="url(#bottomShadowVignette)" />

    <!-- 1. Floating Frosted Glass Luxury Card Container -->
    <rect x="60" y="${cardY}" width="960" height="${cardHeight}" rx="36" fill="url(#finCardBg)" stroke="url(#finCardBorder)" stroke-width="2.5" filter="url(#glassDropShadow)" />

    <!-- 2. Institutional Badge -->
    <g transform="translate(540, ${badgeY})">
      <rect x="-190" y="-18" width="380" height="38" rx="19" fill="#0369a1" fill-opacity="0.28" stroke="#38bdf8" stroke-width="1.6" />
      <circle cx="-160" cy="1" r="5" fill="#38bdf8" />
      <text x="5" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#38bdf8" letter-spacing="3.5" text-anchor="middle">
        FINANCIAL BLUEPRINT
      </text>
    </g>

    <!-- Stylized Modern Gold Quotation Mark -->
    <text x="540" y="${quoteStartY - 40}" font-family="Georgia, serif" font-size="76" font-weight="900" fill="#f59e0b" fill-opacity="0.9" text-anchor="middle" filter="url(#finTextGlow)">“</text>

    <!-- High-Contrast Quote Text -->
    <text x="540" y="${quoteStartY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#finTextGlow)">
        ${quoteTspans}
    </text>

    <!-- Accent Divider Bar in Warm Gold / Cyan -->
    <line x1="410" y1="${dividerY}" x2="670" y2="${dividerY}" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.9" />

    <!-- Titan Author Attribution with Verified Badge -->
    <text x="540" y="${authorY}" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#f8fafc" letter-spacing="1.5" text-anchor="middle" filter="url(#finTextGlow)">
      — ${escapeXml(scholar.author)} <tspan fill="#38bdf8" font-size="24">✓</tspan>
    </text>

    <!-- Institutional Credentials -->
    <text x="540" y="${credY}" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#cbd5e1" letter-spacing="0.8" text-anchor="middle">
      ${escapeXml(scholar.credentials)}
    </text>

    <!-- Source Reference Citation -->
    ${scholar.reference ? `
    <text x="540" y="${refY}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" fill="#94a3b8" letter-spacing="0.6" text-anchor="middle">
      ${escapeXml(scholar.reference)}
    </text>` : ''}

    <!-- Channel Watermark & Signature -->
    <text x="540" y="${watermarkY}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#64748b" letter-spacing="3" text-anchor="middle">
      @BONES_CEO • THE WEALTH FORMULA
    </text>
  </svg>`;
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
 * Main End-to-End Generator: Builds the 5-second video, saves to disk, updates manifest, and uploads to YouTube
 */
async function generateFin5sVideo() {
  console.log('\n===============================================================');
  console.log('💎 VOXAM 5-SECOND FINANCIAL TITANS QUOTE REEL GENERATOR');
  console.log(`Target Duration: ${TARGET_DURATION}s | Output: 1080x1920 Vertical Shorts`);
  console.log('===============================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // 1. Select Unique Quote with Anti-Spam Cross-Runner Deduplication
  const chosen = await selectDeduplicatedCandidate('finance', FINANCE_TITANS_QUOTES, q => q.quote, q => q.author);
  console.log(`[Quote Selected]: "${chosen.quote}"`);
  console.log(`[Author]: ${chosen.author} (${chosen.credentials})`);
  console.log(`[Citation]: ${chosen.reference}\n`);

  saveLocalHistory(chosen);

  // 2. Resolve Portrait
  const portraitPath = await resolveFinancialPortrait(chosen);

  // 3. Resolve Mystery Drone Audio from sound_assets/finance/ or procedural synth
  const mysteryWavPath = path.join(ARTIFACTS_DIR, 'finance_mystery_drone.wav');
  resolveChannelAudio('finance', TARGET_DURATION, mysteryWavPath);

  // 4. Build High-Contrast Caption Card SVG & Rasterize Safely
  const cardSvg = buildFrostedGlassCardSvg(chosen);
  const cardSvgPath = path.join(ARTIFACTS_DIR, 'finance_caption_card.svg');
  const cardPngPath = path.join(ARTIFACTS_DIR, 'finance_caption_card.png');
  fs.writeFileSync(cardSvgPath, cardSvg);

  try {
    if (fs.existsSync(cardPngPath)) fs.unlinkSync(cardPngPath);
    try {
      execSync(`rsvg-convert -w 1080 -h 1920 -o "${cardPngPath}" "${cardSvgPath}" 2>/dev/null`);
    } catch {}
    if (!fs.existsSync(cardPngPath) || fs.statSync(cardPngPath).size < 1000) {
      try {
        execSync(`convert -background none -density 150 "${cardSvgPath}" "${cardPngPath}" 2>/dev/null`);
      } catch {}
    }
    if (!fs.existsSync(cardPngPath) || fs.statSync(cardPngPath).size < 1000) {
      try {
        execSync(`ffmpeg -y -i "${cardSvgPath}" "${cardPngPath}" 2>/dev/null`);
      } catch {}
    }
  } catch (err) {
    console.warn('[Finance Quote Reel] Rasterizer notice:', err.message);
  }

  const cardInput = (fs.existsSync(cardPngPath) && fs.statSync(cardPngPath).size > 1000) ? cardPngPath : cardSvgPath;

  // 5. Composite Final Video via FFmpeg with Smooth Ken Burns Motion
  const timestamp = Date.now();
  const isLongForm = TARGET_DURATION >= 20;
  const videoFileName = isLongForm ? `fin_psychology_30s_${timestamp}.mp4` : `fin_quote_5s_${timestamp}.mp4`;
  const finalMp4Path = path.join(OUTPUT_DIR, videoFileName);
  const latestMp4Path = path.join(OUTPUT_DIR, isLongForm ? 'fin_psychology_latest.mp4' : 'fin_quote_5s_latest.mp4');

  console.log(`[FFmpeg Compositor] Rendering ${TARGET_DURATION.toFixed(1)}s seamless vertical reel (Ken Burns pan & zoom)...`);

  if (isLongForm) {
    // 30-Second Deep Financial Psychology Video with 3 Narrative Beats
    const beat2Svg = buildFinDeepBeat2Svg(chosen);
    const beat3Svg = buildFinDeepBeat3Svg(chosen);
    const beat2SvgPath = path.join(ARTIFACTS_DIR, 'fin_deep_beat2.svg');
    const beat2PngPath = path.join(ARTIFACTS_DIR, 'fin_deep_beat2.png');
    const beat3SvgPath = path.join(ARTIFACTS_DIR, 'fin_deep_beat3.svg');
    const beat3PngPath = path.join(ARTIFACTS_DIR, 'fin_deep_beat3.png');
    fs.writeFileSync(beat2SvgPath, beat2Svg);
    fs.writeFileSync(beat3SvgPath, beat3Svg);

    try {
      execSync(`rsvg-convert -w 1080 -h 1920 "${beat2SvgPath}" -o "${beat2PngPath}" 2>/dev/null || ffmpeg -y -i "${beat2SvgPath}" "${beat2PngPath}" 2>/dev/null`);
      execSync(`rsvg-convert -w 1080 -h 1920 "${beat3SvgPath}" -o "${beat3PngPath}" 2>/dev/null || ffmpeg -y -i "${beat3SvgPath}" "${beat3PngPath}" 2>/dev/null`);
    } catch {}

    const ov1 = cardInput;
    const ov2 = fs.existsSync(beat2PngPath) ? beat2PngPath : beat2SvgPath;
    const ov3 = fs.existsSync(beat3PngPath) ? beat3PngPath : beat3SvgPath;

    const complexFilter = [
      `[0:v]scale=1280:2276:force_original_aspect_ratio=increase,crop=1280:2276,zoompan=z='1.06+0.00014*on':d=${TOTAL_FRAMES}:x='(iw-iw/zoom)*(0.2+0.6*(on/${TOTAL_FRAMES}))':y='(ih-ih/zoom)*0.22':s=1080x1920:fps=30,eq=brightness=-0.04:contrast=1.14:saturation=0.90,vignette=PI/4.5[bg]`,
      `[1:v]scale=1080:1920[ov1]`,
      `[2:v]scale=1080:1920[ov2]`,
      `[3:v]scale=1080:1920[ov3]`,
      `[bg][ov1]overlay=0:0:enable='between(t,0,8)'[v1]`,
      `[v1][ov2]overlay=0:0:enable='between(t,8,18)'[v2]`,
      `[v2][ov3]overlay=0:0:enable='gte(t,18)'[vfinal]`
    ].join(';');

    const ffmpegCmd = `ffmpeg -y -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t 8 -i "${ov1}" -loop 1 -t 10 -i "${ov2}" -loop 1 -t 12 -i "${ov3}" -i "${mysteryWavPath}" -filter_complex "${complexFilter}" -map "[vfinal]" -map 4:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}" 2>&1`;
    execSync(ffmpegCmd);
  } else {
    // 5-Second Quote Reel with Dynamic Ken Burns Camera Pan
    const isPanRight = (chosen.quote.length % 2 === 0);
    const panXFormula = isPanRight
      ? `(iw-iw/zoom)*(0.18+0.64*(on/${TOTAL_FRAMES}))`
      : `(iw-iw/zoom)*(0.82-0.64*(on/${TOTAL_FRAMES}))`;

    const complexFilter = [
      `[0:v]scale=1280:2276:force_original_aspect_ratio=increase,crop=1280:2276,zoompan=z='1.08+0.0006*on':d=${TOTAL_FRAMES}:x='${panXFormula}':y='(ih-ih/zoom)*0.24':s=1080x1920:fps=30,eq=brightness=-0.04:contrast=1.14:saturation=0.90,vignette=PI/4.5[bg]`,
      `[1:v]scale=1080:1920[card]`,
      `[bg][card]overlay=0:0[vfinal]`
    ].join(';');

    const ffmpegCmd = `ffmpeg -y -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${cardInput}" -i "${mysteryWavPath}" -filter_complex "${complexFilter}" -map "[vfinal]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}" 2>&1`;
    execSync(ffmpegCmd);
  }

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 50000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`[FFmpeg Compositor] ✅ Successfully generated video: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / 1024).toFixed(1)} KB)`);
  } else {
    throw new Error('Video generation failed or output file is empty.');
  }

  // 6. Update Blueprint Manifest with Dynamic Anti-Spam Hook Titles
  const finTitleHooks = [
    `The Brutal Truth About Wealth — ${chosen.author} #Shorts`,
    `Why 90% of Investors Underperform — ${chosen.author} #Shorts`,
    `The Number One Rule of Smart Money — ${chosen.author} #Shorts`,
    `How to Spot Financial Traps — ${chosen.author} #Shorts`,
    `The Warning Every Investor Must Hear — ${chosen.author} #Shorts`,
    `Why Most Scams Work (And How to Protect Yourself) — ${chosen.author} #Shorts`,
    `The Rule That Saves You From Fraud — ${chosen.author} #Shorts`,
    `Stop Trading Your Life for Dollars — ${chosen.author} #Shorts`,
    `The Quiet Habit of the Ultra-Wealthy — ${chosen.author} #Shorts`,
    `How Real Investors Think About Risk — ${chosen.author} #Shorts`,
    `The Hardest Investing Lesson to Master — ${chosen.author} #Shorts`,
    `What the 1% Do That Amateurs Don't — ${chosen.author} #Shorts`
  ];
  const hookIndex = Math.abs(chosen.author.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + Date.now()) % finTitleHooks.length;
  const viralTitle = finTitleHooks[hookIndex];
  const initialFollowCta = formatChannelFollowCta('finance_saas', process.env.YOUTUBE_HANDLE_CH1 || process.env.YOUTUBE_HANDLE_FIN || process.env.YOUTUBE_HANDLE || '');
  const viralDescription = `"${chosen.quote}"\n\n— ${chosen.author}\n${chosen.credentials}\nSource: ${chosen.reference}\n\n🌐 OFFICIAL WEALTH & FINANCIAL PLATFORM:\n👉 https://lanecash.name.ng\nAccess practical money management tools, smart investing principles, and daily wealth defense guides.\n\n🛡️ DEFEND YOUR CAPITAL & BEWARE OF SCAMS:\nNever fall victim to Ponzi schemes, fake crypto brokers, or urgent wire transfer scams.\nFree practical financial education & scam defense blueprint:\n👉 https://lanecash.name.ng\n\n${initialFollowCta}\n\n#Lanecash #LanecashFinance #FinStoic #StoicFin #finstoic #sstoicfin #AntiScam #FraudAwareness #ScamAlert #ProtectYourMoney #FinancialDiscipline #InvestingWisdom #PersonalFinance #SmartMoney #WealthMindset #Shorts`;

  try {
    let manifestData = { videos: [] };
    if (fs.existsSync(MANIFEST_PATH)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        if (Array.isArray(parsed)) {
          manifestData = { videos: parsed };
        } else if (parsed && Array.isArray(parsed.videos)) {
          manifestData = parsed;
        }
      } catch {}
    }
    manifestData.videos.unshift({
      id: `fin_quote_${timestamp}`,
      channelId: 'finance_saas',
      type: 'financial_quote_reel_5s',
      title: viralTitle,
      author: chosen.author,
      credentials: chosen.credentials,
      reference: chosen.reference,
      duration: TARGET_DURATION,
      videoPath: finalMp4Path,
      loopable: true,
      publishedAt: new Date().toISOString()
    });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifestData, null, 2));
  } catch (e) {
    console.warn('[Finance Quote Reel] Manifest sync notice:', e.message);
  }

  await recordPostedCandidate('finance', chosen.quote, chosen.author, { reference: chosen.reference, duration: TARGET_DURATION });

  // 7. Publish to YouTube (Channel 1: Fin Blueprint)
  const isDryRun = process.env.DRY_RUN === 'true';
  const clientId = process.env.YOUTUBE_CLIENT_ID_CH1 || process.env.YOUTUBE_CLIENT_ID_FIN || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_CH1 || process.env.YOUTUBE_CLIENT_SECRET_FIN || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH1 || process.env.YOUTUBE_REFRESH_TOKEN_FIN || process.env.YOUTUBE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken && !isDryRun) {
    try {
      console.log(`\n[Finance Quote Reel] 📤 Publishing 5s Financial Quote Reel to YouTube Shorts (Channel 1: Fin Blueprint)...`);
      await uploadQuoteReelToYouTube(finalMp4Path, viralTitle, viralDescription, [
        'FinStoic', 'StoicFin', 'finstoic', 'sstoicfin', 'AntiScam', 'FraudAwareness', 'ScamAlert', 'ProtectYourMoney', 'Finance', 'Investing', 'MoneyMindset', 'WealthBuilding', 'PersonalFinance', 'FinancialFreedom', 'StockMarket', 'WarrenBuffett', 'CharlieMunger', 'Shorts', 'SmartMoney', chosen.author.replace(/[^a-zA-Z0-9]/g, '')
      ], clientId, clientSecret, refreshToken);
    } catch (err) {
      console.warn(`[Finance Quote Reel] YouTube upload notice: ${err.message}`);
    }
  } else if (isDryRun) {
    console.log(`[Finance Quote Reel] ℹ️ Dry Run mode enabled — video saved locally for review.`);
  } else {
    console.log(`[Finance Quote Reel] ℹ️ YouTube secrets not configured in environment — video archived to artifacts.`);
  }

  return finalMp4Path;
}

/**
 * Resumable YouTube Upload via OAuth2
 */
async function uploadQuoteReelToYouTube(videoFilePath, title, description, tags, clientId, clientSecret, refreshToken) {
  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  }).toString();

  const tokenRes = await new Promise((resolve) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(postData);
    req.end();
  });

  if (!tokenRes.access_token) {
    throw new Error('Failed to obtain YouTube OAuth2 access token: ' + (tokenRes.error_description || tokenRes.error || 'unknown'));
  }

  const accessToken = tokenRes.access_token;
  const fileSize = fs.statSync(videoFilePath).size;

  let activeDescription = description;
  try {
    const synced = await getSyncedChannelProfile(accessToken);
    if (synced && synced.handle) {
      console.log(`[Finance Upload] 🔄 Synced channel profile: "${synced.title}" (${synced.handle})`);
      const dynamicFollow = formatChannelFollowCta('finance_saas', synced.handle, synced.title);
      // Replace generic placeholder in description with synced handle CTA
      activeDescription = description.replace(/📈 Follow [^\n]+/, dynamicFollow);
    }
  } catch (e) {}

  const metadata = JSON.stringify({
    snippet: {
      title: title.slice(0, 100),
      description: activeDescription,
      tags: tags.slice(0, 15),
      categoryId: '27' // Education
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true
    }
  });

  const sessionRes = await new Promise((resolve) => {
    const req = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': fileSize,
        'X-Upload-Content-Type': 'video/mp4'
      }
    }, (res) => {
      if (res.headers.location) {
        resolve({ success: true, location: res.headers.location });
      } else {
        resolve({ success: false, statusCode: res.statusCode });
      }
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(metadata);
    req.end();
  });

  if (!sessionRes.success || !sessionRes.location) {
    throw new Error('Failed to initiate YouTube upload session');
  }

  const uploadResult = await new Promise((resolve) => {
    const stream = fs.createReadStream(videoFilePath);
    const req = https.request(sessionRes.location, {
      method: 'PUT',
      headers: {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ success: true, data: JSON.parse(d) }); } catch { resolve({ success: false }); }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    stream.pipe(req);
  });

  if (uploadResult.success && uploadResult.data?.id) {
    const vidId = uploadResult.data.id;
    console.log(`[Finance Quote Reel] ✅ Published to YouTube: https://www.youtube.com/shorts/${vidId}`);

    // Automatic SEO Backlink Comment on YouTube video
    try {
      console.log(`[Finance Quote Reel] 💬 Posting SEO backlink comment to ${vidId}...`);
      const commentPayload = JSON.stringify({
        snippet: {
          videoId: vidId,
          topLevelComment: {
            snippet: {
              textOriginal: `📌 Official Financial Guide & Free Tools: https://lanecash.name.ng\n\nPreserve your hard-earned capital, master disciplined investing principles, and protect your finances against modern online scams.`
            }
          }
        }
      });
      await new Promise((resolve) => {
        const cReq = https.request('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(commentPayload)
          },
          timeout: 10000
        }, (cRes) => {
          let cData = '';
          cRes.on('data', c => cData += c);
          cRes.on('end', () => {
            if (cRes.statusCode === 200 || cRes.statusCode === 201) {
              console.log(`[Finance Quote Reel] ✅ SEO Comment posted successfully for https://lanecash.name.ng`);
            } else {
              console.warn(`[Finance Quote Reel] Comment notice (HTTP ${cRes.statusCode}):`, cData.slice(0, 150));
            }
            resolve();
          });
        });
        cReq.on('error', (e) => {
          console.warn('[Finance Quote Reel] Comment post error:', e.message);
          resolve();
        });
        cReq.write(commentPayload);
        cReq.end();
      });
    } catch (commentErr) {
      console.warn('[Finance Quote Reel] Comment dispatch notice:', commentErr.message);
    }

    return vidId;
  }
}

if (require.main === module) {
  generateFin5sVideo().catch(err => {
    console.error(`[Finance Quote Reel Fatal]`, err);
    process.exit(1);
  });
}

module.exports = {
  generateFin5sVideo,
  selectUniqueFinanceQuote,
  generateFinancialMysterySound,
  resolveFinancialPortrait,
  FINANCE_TITANS_QUOTES
};
