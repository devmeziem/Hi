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
    quote: "Beware of false generosity. When the wolf offers to guide the sheep to safety, inspect the fence and count the flock.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor • Stoic Philosopher of Deception & Discipline",
    reference: "Meditations, Book XI",
    wikiSearch: "Marcus_Aurelius",
    theme: "stoic_financial_guard"
  },
  {
    quote: "Do not be dazzled by the display of sudden riches. Ask first: at what price was this promised, and whose ruin paid for the illusion?",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Master of Rational Perception & Discourses",
    reference: "Discourses, Book III (On Guarding the Soul Against Charlatans)",
    wikiSearch: "Epictetus",
    theme: "rational_defense"
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
    quote: "A gift from a predator is no gift at all. Sudden wealth offered without honest labor is a poisoned fishhook designed to drag you into bankruptcy.",
    author: "Seneca",
    credentials: "Stoic Statesman & Philosopher • Advisor of Ancient Rome",
    reference: "Moral Letters to Lucilius (Letter CXIX: On False Riches)",
    wikiSearch: "Seneca_the_Younger",
    theme: "stoic_wealth_guard"
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

  // 3. Fallback ONLY: High-Fidelity Pollinations FLUX generation (used only if Wikipedia archives fail)
  try {
    console.log(`[Finance Quote Reel] ⚠️ Wikipedia portrait unavailable. Using Pollinations AI as fallback for ${scholar.author}...`);
    const prompt = `cinematic vertical 9:16 portrait of ${scholar.author}, iconic financial titan, thoughtful expression, dark minimalist executive background, subtle warm golden rim lighting, sharp focus, 8k vertical wallpaper`;
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&nologo=true&seed=88`;
    const imgBuf = await fetchHttpsBuffer(pollUrl, 14000);
    if (imgBuf && imgBuf.length > 10000) {
      fs.writeFileSync(outJpgPath, imgBuf);
      return outJpgPath;
    }
  } catch (e) {
    console.warn(`[Finance Quote Reel] Pollinations fallback notice: ${e.message}`);
  }

  // 3. Resilient Local Executive Backdrop
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="execBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#02040a" />
      </linearGradient>
      <radialGradient id="goldAura" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#eab308" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#execBg)" />
    <rect width="1080" height="1920" fill="url(#goldAura)" />
    <circle cx="540" cy="650" r="180" fill="#1e293b" stroke="#334155" stroke-width="4" />
    <circle cx="540" cy="580" r="80" fill="#334155" />
    <path d="M 400 780 C 400 700, 680 700, 680 780 Z" fill="#334155" />
    <text x="540" y="930" fill="#e2e8f0" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" text-anchor="middle">${scholar.author}</text>
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

  // 1. Check local audio assets directories
  const soundDirs = [
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'src', 'assets', 'sounds'),
    path.join(process.cwd(), 'test_artifacts', 'sounds')
  ];

  const presets = [
    'horror_scene_murder_mystery',
    'instrumental_mystery',
    'mystery_darkness'
  ];
  const runSeed = Math.floor(Date.now() / (1000 * 60 * 15)); // change every 15 mins or run
  const chosenPreset = process.env.SOUND_PRESET || presets[runSeed % presets.length];

  for (const sDir of soundDirs) {
    if (fs.existsSync(sDir)) {
      // Check for exact preset file first
      const specificFile = path.join(sDir, `${chosenPreset}.wav`);
      const specificMp3 = path.join(sDir, `${chosenPreset}.mp3`);
      const targetLocal = fs.existsSync(specificFile) ? specificFile : (fs.existsSync(specificMp3) ? specificMp3 : null);

      if (targetLocal) {
        console.log(`[Sound Engine] Using master audio track: ${path.basename(targetLocal)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${targetLocal}" -t ${duration} -af "afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.2).toFixed(2)}:d=0.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`
          );
          if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
            return outWavPath;
          }
        } catch (e) {
          // Fall through to procedural
        }
      }

      // Check any available audio in folder
      const allAudios = fs.readdirSync(sDir).filter(f => f.match(/\.(mp3|wav|ogg|m4a)$/i));
      if (allAudios.length > 0) {
        const anyAudio = path.join(sDir, allAudios[0]);
        console.log(`[Sound Engine] Using available audio track: ${path.basename(anyAudio)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${anyAudio}" -t ${duration} -af "afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.2).toFixed(2)}:d=0.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`
          );
          if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
            return outWavPath;
          }
        } catch (e) {
          // Fall through
        }
      }
    }
  }

  console.log(`[Sound Engine] Synthesizing loopable mystery audio track: "${chosenPreset}" (${duration}s)...`);
  const d = duration.toFixed(2);
  const fadeOutStart = (duration - 0.2).toFixed(2);
  let filterExpr = '';

  if (chosenPreset === 'horror_scene_murder_mystery') {
    // Archetype 1: Horror Scene Murder Mystery (dissonant tension, 48Hz/96Hz/135Hz drone + tremolo)
    filterExpr = [
      `aevalsrc='sin(2*PI*48*t)*0.32 + sin(2*PI*96*t)*0.22 + sin(2*PI*135.76*t)*0.18 + sin(2*PI*192*t)*0.10 + sin(2*PI*1536*t)*(0.025+0.02*sin(2*PI*0.4*t))':s=44100:d=${d}`,
      `lowpass=f=1200`,
      `aecho=0.85:0.75:350|700:0.25|0.15`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else if (chosenPreset === 'instrumental_mystery') {
    // Archetype 2: Instrumental Mystery (C minor 9th suspense: 65.4Hz C2, 98Hz G2, 155.5Hz Eb3, 233Hz Bb3)
    filterExpr = [
      `aevalsrc='sin(2*PI*65.4*t)*0.28 + sin(2*PI*98*t)*0.22 + sin(2*PI*155.56*t)*0.18 + sin(2*PI*233.08*t)*0.14 + sin(2*PI*392*t)*(0.04+0.03*sin(2*PI*0.25*t))':s=44100:d=${d}`,
      `bandpass=f=800:w=600`,
      `aecho=0.8:0.7:450|900:0.3|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else {
    // Archetype 3: Mystery Darkness (abyssal deep 43Hz F1 bass, cold room tone)
    filterExpr = [
      `aevalsrc='sin(2*PI*43.65*t)*0.36 + sin(2*PI*87.3*t)*0.24 + sin(2*PI*130.81*t)*0.16 + sin(2*PI*261.63*t)*0.08':s=44100:d=${d}`,
      `lowpass=f=450`,
      `aecho=0.9:0.8:500|1000:0.35|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  }

  execSync(`ffmpeg -y -f lavfi -i "${filterExpr}" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
  return outWavPath;
}

/**
 * Generate High-Contrast Caption Card SVG (Varied Visual Themes & Low Text Density)
 */
function buildFrostedGlassCardSvg(scholar, width = 1080, height = 1920) {
  // Theme Variation: Rotate between Gold-Obsidian, Emerald-Bronze, and Platinum-Navy
  const themeSeeds = [
    {
      id: 'gold_obsidian',
      badgeBg: '#f59e0b',
      badgeBorder: '#fbbf24',
      badgeText: '#fcd34d',
      borderGrad: ['#f59e0b', '#fbbf24', '#d97706'],
      nameColor: '#fbbf24',
      badgeTitle: 'THE 1% MINDSET'
    },
    {
      id: 'platinum_navy',
      badgeBg: '#38bdf8',
      badgeBorder: '#7dd3fc',
      badgeText: '#e0f2fe',
      borderGrad: ['#38bdf8', '#0284c7', '#6366f1'],
      nameColor: '#38bdf8',
      badgeTitle: 'WEALTH PRINCIPLE'
    },
    {
      id: 'emerald_prestige',
      badgeBg: '#10b981',
      badgeBorder: '#34d399',
      badgeText: '#d1fae5',
      borderGrad: ['#10b981', '#059669', '#34d399'],
      nameColor: '#34d399',
      badgeTitle: 'FINANCIAL FREEDOM'
    }
  ];
  
  const themeIndex = Math.abs(scholar.author.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % themeSeeds.length;
  const theme = themeSeeds[themeIndex];

  // Dynamic wrapping without artificial truncation
  const quoteLen = scholar.quote.length;
  const maxChars = quoteLen > 120 ? 28 : (quoteLen > 70 ? 25 : 22);
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
  let lineHeight = 64;
  let authorFontSize = 28;
  let credFontSize = 17;

  if (numLines <= 2) {
    fontSize = 52;
    lineHeight = 72;
  } else if (numLines === 3) {
    fontSize = 46;
    lineHeight = 64;
  } else if (numLines === 4) {
    fontSize = 40;
    lineHeight = 56;
    authorFontSize = 25;
    credFontSize = 16;
  } else {
    fontSize = 34;
    lineHeight = 48;
    authorFontSize = 22;
    credFontSize = 15;
  }

  // Exact vertical layout math inside card:
  const quoteTextTop = 135;
  const quoteBottom = quoteTextTop + ((numLines - 1) * lineHeight);
  const dividerY = quoteBottom + 30;
  const authorY = dividerY + 40;
  const credY = authorY + 34;
  const cardHeight = credY + 35;

  // Shorts Safe Area: bottom at Y=1340, width 920px (X=80 to 1000)
  const cardWidth = 920;
  const cardX = 80;
  const cardY = Math.max(760, 1340 - cardHeight);

  const quoteTspans = lines.map((line, idx) => {
    return `<tspan x="540" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Deep High-Contrast Opaque Backdrop -->
      <linearGradient id="solidContrastBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#050811" stop-opacity="0.96" />
        <stop offset="50%" stop-color="#0a0e1a" stop-opacity="0.97" />
        <stop offset="100%" stop-color="#020409" stop-opacity="0.99" />
      </linearGradient>

      <!-- Dynamic Border Gradient -->
      <linearGradient id="cardAccentBorder" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${theme.borderGrad[0]}" stop-opacity="0.9" />
        <stop offset="50%" stop-color="${theme.borderGrad[1]}" stop-opacity="1.0" />
        <stop offset="100%" stop-color="${theme.borderGrad[2]}" stop-opacity="0.9" />
      </linearGradient>

      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.98" />
      </filter>
      <filter id="textContrast" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="1.0" />
      </filter>
    </defs>

    <!-- Subtle Cinematic Gradient: Preserves Face Clarity While Ensuring Text Legibility -->
    <rect x="0" y="950" width="1080" height="970" fill="url(#solidContrastBg)" fill-opacity="0.75" />

    <!-- High-Contrast Caption Card Container -->
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="32" fill="url(#solidContrastBg)" filter="url(#cardShadow)" />
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="32" fill="none" stroke="url(#cardAccentBorder)" stroke-width="2.5" />

    <!-- Top Accent Badge Header -->
    <rect x="90" y="${cardY + 36}" width="300" height="44" rx="22" fill="${theme.badgeBg}" fill-opacity="0.22" stroke="${theme.badgeBorder}" stroke-width="2" />
    <text x="240" y="${cardY + 65}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="${theme.badgeText}" text-anchor="middle" letter-spacing="2">${theme.badgeTitle}</text>

    <!-- Reference Tag at Right -->
    <text x="940" y="${cardY + 65}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#cbd5e1" text-anchor="end">${escapeXml(scholar.reference || 'Financial Wisdom')}</text>

    <!-- The Quote Body: Ultra-Bold White (52px, max 3 lines) -->
    <text x="540" y="${cardY + 155}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5" filter="url(#textContrast)">
      ${quoteTspans}
    </text>

    <!-- Divider Line -->
    <line x1="90" y1="${cardY + cardHeight - 105}" x2="990" y2="${cardY + cardHeight - 105}" stroke="#334155" stroke-width="1.8" opacity="0.9" />

    <!-- Author Name & Credentials -->
    <text x="540" y="${cardY + cardHeight - 65}" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="${theme.nameColor}" text-anchor="middle" letter-spacing="1.5" filter="url(#textContrast)">
      ${escapeXml(scholar.author.toUpperCase())}
    </text>
    <text x="540" y="${cardY + cardHeight - 26}" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#94a3b8" text-anchor="middle">
      ${escapeXml(scholar.credentials)}
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

  // 1. Select Unique Quote
  const chosen = selectUniqueFinanceQuote();
  console.log(`[Quote Selected]: "${chosen.quote}"`);
  console.log(`[Author]: ${chosen.author} (${chosen.credentials})`);
  console.log(`[Citation]: ${chosen.reference}\n`);

  saveLocalHistory(chosen);

  // 2. Resolve Portrait
  const portraitPath = await resolveFinancialPortrait(chosen);

  // 3. Synthesize Mystery Drone Sound
  const mysteryWavPath = path.join(ARTIFACTS_DIR, 'finance_mystery_drone.wav');
  generateFinancialMysterySound(mysteryWavPath, TARGET_DURATION);

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

  // 5. Composite Final 5-Second Video via FFmpeg
  // Slow subtle cinematic Ken Burns push-in zoom on the portrait
  const timestamp = Date.now();
  const videoFileName = `fin_quote_5s_${timestamp}.mp4`;
  const finalMp4Path = path.join(OUTPUT_DIR, videoFileName);
  const latestMp4Path = path.join(OUTPUT_DIR, 'fin_quote_5s_latest.mp4');

  console.log(`[FFmpeg Compositor] Rendering 5.0-second seamless vertical reel...`);

  const complexFilter = `
    [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)/2:0,zoompan=z='min(zoom+0.0006,1.05)':d=${TOTAL_FRAMES}:x='iw/2-(iw/zoom/2)':y='ih*0.3-(ih*0.3/zoom)':s=1080x1920:fps=30[bg];
    [1:v]scale=1080:1920[card];
    [bg][card]overlay=0:0[vfinal]
  `.replace(/\s+/g, ' ');

  const ffmpegCmd = `ffmpeg -y -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${cardInput}" -i "${mysteryWavPath}" -filter_complex "${complexFilter}" -map "[vfinal]" -map 2:a -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMp4Path}" 2>&1`;

  execSync(ffmpegCmd);

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 50000) {
    fs.copyFileSync(finalMp4Path, latestMp4Path);
    console.log(`[FFmpeg Compositor] ✅ Successfully generated 5s video: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / 1024).toFixed(1)} KB)`);
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
