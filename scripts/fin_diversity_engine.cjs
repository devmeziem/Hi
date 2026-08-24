/**
 * Global & Nigerian Finance & Small-Business Diversity Engine
 * Channel: @bones_ceo / Fin Blueprint
 * 
 * CORE CHANNEL POSITIONING (Strict 21-Pillar Compliance):
 * "Learn how to manage money, start small businesses, develop valuable skills,
 * find legitimate opportunities, and understand finance in simple language."
 * 
 * Target: Ordinary young people, students, beginners, low-income users, and aspiring entrepreneurs
 * starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).
 * 
 * NON-GURU / ANTI-HYPE PRINCIPLE:
 * Never present as a guru or promise guaranteed income/wealth.
 * Uses realistic disclaimer language: "potential revenue", "estimated margins", "results vary", "possible costs".
 * 
 * DUAL GLOBAL/LOCAL CURRENCY FORMAT:
 * Formats financial sums seamlessly for both global (USD $) and local (₦ Naira) audiences,
 * e.g., "₦5,000 (about $3.50 USD)" or "$10 (around ₦15,000)".
 */

// 10 Core Content Pillars from User Specification
const FIN_CATEGORIES = {
  SMALL_CAPITAL_BUSINESS: 'small_capital_business',       // ₦0 - ₦5k / $0 - $5 startup ideas
  SAVING_PERSONAL_FINANCE: 'saving_personal_finance',     // Budgeting, expense leaks, emergency funds
  FINANCIAL_EDUCATION: 'financial_education',             // Inflation, compound interest, loans, APR, ETFs in plain words
  SKILLS_TO_INCOME: 'skills_to_income',                   // Phone-only skills, video editing, copy, AI tools
  FREE_OPPORTUNITIES: 'free_opportunities',               // Verified free certs (Google/MS), grants, scholarships
  SCAM_AWARENESS: 'scam_awareness',                       // Ponzi schemes, fake crypto giveaways, phishing red flags
  BUSINESS_BREAKDOWNS: 'business_breakdowns',             // Unit economics, startup supplies, gross profit math
  BEGINNER_INVESTING_CRYPTO: 'beginner_investing_crypto', // Bitcoin, USDT stablecoins, inflation hedging, self-custody
  FINANCIAL_CALCULATORS: 'financial_calculators',         // Compounding $1/day, break-even math, purchasing power
  CHALLENGES_EXPERIMENTS: 'challenges_experiments'        // Transparent 30-day budget & micro-business experiments
};

// 16 Comprehensive Financial Archetypes spanning all pillars with dual currency relevance
const FIN_ARCHETYPES = [
  {
    id: 'fin_01_micro_startup_food',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Small-Capital Business: Snack & Micro-Reselling',
    angle: '3 Businesses You Can Start With Under ₦5,000 ($3.50 USD)',
    targetBudget: '₦5,000 (~$3.50 USD)',
    hookPatterns: [
      'If you only have ₦5,000 or about $3.50 to start a business, here is what actually works.',
      'Stop waiting for millions — here are 3 micro-businesses starting under $5 or ₦5,000.',
      'What I would do to make income if I only had ₦5,000 ($3.50 USD) left today.'
    ],
    narrativeArc: 'Hook on tiny capital -> 3 practical low-equipment ideas (snack packs, micro-delivery, item flipping) -> Real supply cost & margin math -> Downside risk -> CTA',
    visualAesthetic: 'Crisp cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald green and gold rim lighting, dark slate backdrop, crisp bokeh depth of field',
    outroPattern: 'Follow @bones_ceo to learn real money management and business blueprints every day.'
  },
  {
    id: 'fin_02_budgeting_50_30_20',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Personal Finance: Zero-Based Realistic Budgeting',
    angle: 'How to Budget ₦20,000 ($13.50 USD) Without Going Broke Before Month-End',
    targetBudget: '₦20,000 (~$13.50 USD)',
    hookPatterns: [
      'Why does your money disappear 3 days after you get paid? Here is the 50-30-20 fix.',
      'How to budget ₦20,000 ($13.50 USD) when prices and inflation keep climbing.',
      'The single budgeting mistake that keeps 90% of beginners trapped living paycheck to paycheck.'
    ],
    narrativeArc: 'Hook on disappearing cash -> The 50/30/20 breakdown for small amounts -> Cutting silent expense leaks -> Emergency buffer -> CTA',
    visualAesthetic: 'Clean high-contrast smartphone budget interface, warm studio lighting with dark slate background, clear typography, financial stability aesthetic',
    outroPattern: 'Tap follow on @bones_ceo to master your personal finances and grow your savings.'
  },
  {
    id: 'fin_03_inflation_purchasing_power',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Financial Education: Inflation & Cash Erosion Explained',
    angle: 'What Inflation Actually Does to ₦50,000 ($35 USD) Over 12 Months',
    targetBudget: '₦50,000 (~$35 USD)',
    hookPatterns: [
      'Keeping all your cash under the mattress is quietly costing you 25% of your purchasing power.',
      'What inflation really means for your everyday grocery shopping in 60 seconds.',
      'Why a 10% salary raise might still leave you poorer if you do not understand inflation.'
    ],
    narrativeArc: 'Definition in plain terms -> Real grocery basket purchasing power comparison -> Why idle cash erodes -> Practical hedging strategies -> CTA',
    visualAesthetic: 'Sleek financial diagram, purchasing power comparison chart, obsidian black background with emerald and gold accents, 9:16 vertical 8k cinematic shot',
    outroPattern: 'Follow @bones_ceo for simple, jargon-free financial education every morning.'
  },
  {
    id: 'fin_04_phone_only_monetization',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Phone-Only Digital Skills & Remote Income',
    angle: '3 High-Income Digital Skills You Can Learn for Free on Just Your Phone',
    targetBudget: '$0 (Phone & Internet Only)',
    hookPatterns: [
      'You do not need an expensive laptop to build monetizable digital skills in 2026.',
      'Turn your smartphone into a remote income engine with these 3 free skills.',
      'The highest-paying digital skills anyone with a phone and internet can learn this month.'
    ],
    narrativeArc: 'Problem of expensive gear -> 3 realistic phone skills (CapCut video editing, copywriting, social media management) -> Free learning sources -> Client outreach -> CTA',
    visualAesthetic: 'Modern creator setup, smartphone with mobile video editor timeline, ambient cyan and gold backlight, crisp 35mm portrait lens',
    outroPattern: 'Follow @bones_ceo for actionable skill breakdowns and remote income strategies.'
  },
  {
    id: 'fin_05_scam_red_flags',
    category: FIN_CATEGORIES.SCAM_AWARENESS,
    theme: 'Scam & Fraud Prevention: Exposing Ponzi & Crypto Traps',
    angle: '5 Red Flags of Fake Investment Schemes (Ponzi & Crypto Traps)',
    targetBudget: 'Protecting Your Capital',
    hookPatterns: [
      'If anyone promises you guaranteed 30% weekly returns, run the other way immediately.',
      'How to spot a fake investment scheme in under 30 seconds before losing your hard-earned money.',
      'The 3 biggest scams targeting young people and students right now.'
    ],
    narrativeArc: 'The psychological lure -> 5 undeniable red flags (guarantees, recruitment pressure, fake audits) -> Real example -> How to verify legitimacy -> CTA',
    visualAesthetic: 'High-contrast security and warning aesthetic, deep charcoal and red-amber accent lighting, sleek digital shield motif, 9:16 vertical 8k cinematic',
    outroPattern: 'Follow @bones_ceo to protect your money and stay ahead of financial scams.'
  },
  {
    id: 'fin_06_business_economics_breakdown',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    theme: 'Business Breakdowns: Unit Economics & Margins',
    angle: 'The Real Math Behind a ₦10,000 ($7 USD) Snack Reselling Micro-Business',
    targetBudget: '₦10,000 (~$7 USD)',
    hookPatterns: [
      'Can you really turn ₦10,000 ($7 USD) into a profitable micro-business? Let us do the exact math.',
      'Here is the complete cost breakdown, pricing, and profit margin of an everyday street snack business.',
      'The hidden costs that ruin small business owners before they even make their first profit.'
    ],
    narrativeArc: 'The business premise -> Startup supply cost breakdown -> Pricing strategy -> Estimated gross margin & hidden expenses -> Break-even reality -> CTA',
    visualAesthetic: 'Clean commercial packaging setup, clear financial breakdown table, warm tungsten studio lighting, realistic depth of field',
    outroPattern: 'Follow @bones_ceo for transparent business breakdowns and startup economics.'
  },
  {
    id: 'fin_07_stablecoins_hedging',
    category: FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO,
    theme: 'Beginner Crypto: Stablecoins (USDT/USDC) Demystified',
    angle: 'What Are Stablecoins (USDT/USDC) and Why Do Millions Use Them to Beat Inflation?',
    targetBudget: 'Any Budget ($1+ / ₦1,500+)',
    hookPatterns: [
      'What is a stablecoin, and why are millions using USDT to protect their savings from currency drops?',
      'Crypto does not have to be a gamble — here is how digital dollars work for complete beginners.',
      'Before you touch crypto, understand the difference between Bitcoin, Altcoins, and Stablecoins.'
    ],
    narrativeArc: 'Plain definition -> How 1 USDT stays $1 USD -> Use case for beating local devaluation -> Self-custody safety rules -> CTA',
    visualAesthetic: 'Futuristic clean financial interface, glowing emerald and gold crypto tokens on dark obsidian slate, sleek 3D perspective, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for honest, hype-free crypto education and security tips.'
  },
  {
    id: 'fin_08_free_certifications_grants',
    category: FIN_CATEGORIES.FREE_OPPORTUNITIES,
    theme: 'Free Opportunities: Verified Tech Certifications & Grants',
    angle: '3 100% Free Google & Microsoft Certifications to Boost Your Career',
    targetBudget: '$0 (100% Free)',
    hookPatterns: [
      'Companies are hiring for these 3 skills, and the training is 100% free from Google.',
      'Stop paying for overpriced courses — get certified by top tech companies for zero cost.',
      'The top free global certifications you can complete on your phone this weekend.'
    ],
    narrativeArc: 'High cost of education vs free tech programs -> 3 specific free certs -> What you learn -> How to put it on LinkedIn/Resume -> CTA',
    visualAesthetic: 'Modern digital certificate interface, glowing green verified badge, modern study desk, crisp cinematic lighting, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for verified free grants, courses, and career opportunities.'
  },
  {
    id: 'fin_09_compound_interest_dollar_day',
    category: FIN_CATEGORIES.FINANCIAL_CALCULATORS,
    theme: 'Financial Calculators: The Power of Compounding Growth',
    angle: 'What Happens If You Invest $1 a Day (₦1,500) Over 10 Years?',
    targetBudget: '$1/day (₦1,500/day)',
    hookPatterns: [
      'Albert Einstein called compound interest the eighth wonder of the world — here is why.',
      'What happens when you consistently invest just $1 or ₦1,500 every single day?',
      'How small consistent savings beat big lump sums through the power of compound growth.'
    ],
    narrativeArc: 'The compound formula explained simply -> The 1-year vs 5-year vs 10-year curve -> Rule of 72 -> Practical starting step -> CTA',
    visualAesthetic: 'Exponential growth chart visualization, glowing green compounding curve on sleek dark glass, 9:16 vertical 8k cinematic studio shot',
    outroPattern: 'Follow @bones_ceo to learn how to build long-term wealth step by step.'
  },
  {
    id: 'fin_10_thrift_reselling_hustle',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Small-Capital Business: Thrift & E-Commerce Reselling',
    angle: 'How to Start a Thrift Reselling Side-Hustle With Under ₦15,000 ($10 USD)',
    targetBudget: '₦15,000 (~$10 USD)',
    hookPatterns: [
      'Thrift and vintage clothing reselling is one of the highest margin micro-businesses today.',
      'How to source, photograph, and flip thrift items online starting with only $10 or ₦15,000.',
      'The 3 rules of profitable online reselling that guarantee you never get stuck with dead stock.'
    ],
    narrativeArc: 'Sourcing cheap inventory -> Cleaning and presentation -> Pricing for 100% markup -> Packaging & shipping -> CTA',
    visualAesthetic: 'Aesthetic vintage clothing rack, smartphone product photoshoot setup, warm sunlight and tungsten studio lighting, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for practical small-business blueprints and side-hustle guides.'
  },
  {
    id: 'fin_11_emergency_fund_blueprint',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Personal Finance: Building Your First ₦10,000 ($7 USD) Emergency Fund',
    angle: 'How to Save Your First ₦10,000 ($7 USD) Emergency Buffer on Low Income',
    targetBudget: '₦10,000 (~$7 USD)',
    hookPatterns: [
      'An emergency fund is not an investment — it is mental peace of mind for unexpected shock.',
      'How to save your first ₦10,000 ($7 USD) emergency cushion without starving.',
      'Why you should never invest your last cash before building an emergency safety net.'
    ],
    narrativeArc: 'The unexpected expense trap -> Why emergency savings must be liquid -> The ₦500 / $0.35 daily savings challenge -> Where to store it safely -> CTA',
    visualAesthetic: 'Clean locked digital vault concept, warm emerald rim lighting, modern glass aesthetic, 9:16 vertical 8k cinematic',
    outroPattern: 'Follow @bones_ceo for realistic budgeting systems and emergency fund guides.'
  },
  {
    id: 'fin_12_interest_rates_apr_explained',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Financial Education: Loan Apps & Hidden APR Traps',
    angle: 'How High-Interest Quick Loan Apps Trap Borrowers in Debt Cycles',
    targetBudget: 'Financial Protection',
    hookPatterns: [
      'Borrowing ₦10,000 and paying back ₦13,000 in two weeks is a 780% yearly interest rate.',
      'What quick loan apps do not tell you about compound penalties and privacy risks.',
      'How to calculate the real APR on any loan before accepting money into your account.'
    ],
    narrativeArc: 'The allure of instant loan apps -> The hidden math of bi-weekly fees (APR explained) -> Debt spiral danger -> Safe alternative solutions -> CTA',
    visualAesthetic: 'Digital smartphone loan interface warning breakdown, dramatic moody slate lighting with red and gold highlights, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo to protect your credit and make smart borrowing decisions.'
  }
];

const ROTATING_FIN_OUTROS = [
  "Follow @bones_ceo to learn real money management and business blueprints every day.",
  "You might not see this channel again — follow now for honest financial education and side-hustle guides.",
  "Tap follow on @bones_ceo to build your financial literacy and start making smarter money moves.",
  "Don't lose this guide — follow @bones_ceo for daily small-business breakdowns and scam alerts.",
  "Follow @bones_ceo today for practical money tips, budgeting tools, and realistic income ideas.",
  "Follow @bones_ceo if you want to understand finance in plain, simple English without the guru hype."
];

// Dangerous financial claims blacklist for Safety System
const FINANCIAL_RISK_KEYWORDS = [
  'guaranteed profit', 'guaranteed returns', 'double your money', '100% risk free',
  'risk-free investment', 'get rich quick', 'instant wealth', 'make millions overnight',
  'guaranteed income', 'passive 50%', 'no work required', 'unlimited earnings'
];

/**
 * Strict Safety Audit enforcing Anti-Hype and Non-Guru Standards
 */
function auditFinancialScriptSafety(scriptData) {
  const flags = [];
  const fullText = `${scriptData.title || ''} ${scriptData.description || ''} ${(scriptData.slides || []).map(s => s.text).join(' ')}`.toLowerCase();

  for (const phrase of FINANCIAL_RISK_KEYWORDS) {
    if (fullText.includes(phrase)) {
      flags.push({
        severity: 'HIGH_RISK',
        reason: `Script contains forbidden promise: "${phrase}". Financial content must remain realistic with no guaranteed returns.`
      });
    }
  }

  return {
    passed: flags.length === 0,
    flags
  };
}

/**
 * Bulletproof string sanitizer for FFmpeg & YouTube rendering
 */
function sanitizeFinString(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .replace(/[:%]/g, ' - ')
    .replace(/[[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve outro for channel
 */
function resolveFinOutro(channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const randomIndex = Math.floor(Math.random() * ROTATING_FIN_OUTROS.length);
  return ROTATING_FIN_OUTROS[randomIndex].replace('@bones_ceo', cleanHandle);
}

/**
 * Pick an archetype that has NOT been used in recent history to prevent duplicate posts
 */
function selectDiverseArchetype(recentHistory = []) {
  const recentTitles = (recentHistory || []).map(h => (h.title || h.topic || '').toLowerCase());
  const available = FIN_ARCHETYPES.filter(arch => {
    return !recentTitles.some(t => t.includes(arch.theme.toLowerCase()) || t.includes(arch.id));
  });

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return FIN_ARCHETYPES[Math.floor(Math.random() * FIN_ARCHETYPES.length)];
}

/**
 * Build rich system and user prompts for finance LLM generation with global dual currency
 */
function buildFinPromptForSlot(archetype, recentHistory = [], slotIndex = 0, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 15).map(h => `"${h.topic || h.title}"`).join(', ');
  const resolvedOutro = resolveFinOutro(cleanHandle);

  const systemPrompt = `You are the lead financial educator and YouTube Shorts director for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).

MANDATORY RULES & CONTENT STANDARDS:
1. NEVER BEHAVE AS A FINANCIAL GURU OR PROMISE WEALTH:
   - Do NOT promise or guarantee income, profit, or instant wealth.
   - ALWAYS use honest, measured language: "potential revenue", "estimated margins", "results vary", "possible startup costs".
   - The viewer must leave thinking: "I learned something practical, realistic, and risk-aware."
2. GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
   - Whenever mentioning currency or budget amounts, seamlessly include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents.
   - Examples: "₦5,000 (about $3.50 USD)", "₦20,000 (around $13.50 USD)", "$10 (approx. ₦15,000)".
3. CRYSTAL CLEAR, SPOKEN CONVERSATIONAL ENGLISH:
   - Write in plain, conversational English suitable for clear text-to-speech reading.
   - Avoid complicated financial jargon; if a term like "gross margin" or "APR" is used, explain it immediately in plain words.
   - Slide lengths: strictly 1-2 complete spoken sentences (12-16 words per slide).
4. STRICT 6-SLIDE NARRATIVE COHESION (THE 6-STEP ARC):
   - Slide 0 (Hook): Direct opening naming the real situation/budget in dual currency ($ / ₦).
   - Slide 1 (The Trap / Friction): Explain the common mistake or why people lose money here.
   - Slide 2 (The Simple Principle): The foundational rule or concept explained plainly.
   - Slide 3 (The Actionable Math): Real startup cost, supply breakdown, or calculation.
   - Slide 4 (The Risk & Defense): The downside risk and how to protect money.
   - Slide 5 (Closing & Outro): A final piece of advice + "${resolvedOutro}".
5. ANTI-DUPLICATION MANDATE:
   - Recently covered titles: [${recentTitles || 'None'}]. Do NOT duplicate these topics or angles.
6. UNIFIED VISUAL STYLE:
   - 9:16 vertical 8k photorealistic aesthetic with dark obsidian slate background, emerald green and warm gold rim lighting.

OUTPUT FORMAT: Return strictly a valid JSON object matching this schema:
{
  "title": "Punchy High-CTR Title with Global Dual-Currency Mention #Shorts",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "hook": "${archetype.hookPatterns[slotIndex % archetype.hookPatterns.length]}",
  "description": "Practical breakdown of ${archetype.theme}.\\n\\n#Shorts #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy #BusinessIdeas",
  "tags": ["#Shorts", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy", "#BusinessBreakdown"],
  "estimatedBudget": "${archetype.targetBudget}",
  "slides": [
    {
      "slideIndex": 0,
      "text": "Opening hook addressing the small budget in USD and Naira (12-16 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald and gold ambient rim light..."
    },
    {
      "slideIndex": 1,
      "text": "The hidden trap or mistake beginners make with this budget (12-15 words)...",
      "visual": "Matching 9:16 vertical 8k shot with consistent emerald/gold color palette and sharp depth of field..."
    },
    {
      "slideIndex": 2,
      "text": "The core simple financial rule or business model (12-15 words)...",
      "visual": "Matching 9:16 vertical shot, clean financial interface or business supply setup..."
    },
    {
      "slideIndex": 3,
      "text": "Concrete pricing, startup cost, or profit margin breakdown (12-15 words)...",
      "visual": "Matching 9:16 vertical shot, clear visual breakdown chart with high-contrast text..."
    },
    {
      "slideIndex": 4,
      "text": "The practical takeaway and how to manage downside risks (12-15 words)...",
      "visual": "Matching 9:16 vertical shot, confident modern entrepreneur in cinematic lighting..."
    },
    {
      "slideIndex": 5,
      "text": "Final punchy rule + '${resolvedOutro}' (12-15 words)...",
      "visual": "Matching 9:16 vertical shot, clean modern studio resolution with subtle logo watermark..."
    }
  ]
}`;

  const userPrompt = `Generate a brand new, highly practical Finance & Small-Business Short storyboard for Slot ${slotIndex + 1}.
Theme: "${archetype.theme}". Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
Avoid previous titles: [${recentTitles || 'None'}]. Ensure realistic calculations with dual $ / ₦ context. Output strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic fallback storyboard synthesis if AI providers are unreachable
 */
function synthesizeDeterministicFinStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveFinOutro(cleanHandle);
  const arch = archetype || FIN_ARCHETYPES[0];
  const cleanTopic = sanitizeFinString(topicTitle || arch.angle);

  return {
    title: `${cleanTopic.slice(0, 60)} #Shorts`,
    category: arch.category,
    theme: arch.theme,
    angle: arch.angle,
    hook: arch.hookPatterns[0],
    description: `Practical step-by-step breakdown of ${arch.theme}.\n\n#Shorts #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy`,
    tags: ["#Shorts", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy"],
    estimatedBudget: arch.targetBudget,
    slides: [
      {
        slideIndex: 0,
        text: `If you have ${arch.targetBudget} to start, you do not need huge capital to build real momentum.`,
        visual: `Cinematic 9:16 vertical 8k photorealistic scene, modern minimalist desk, emerald and gold rim lighting, dark obsidian slate backdrop`
      },
      {
        slideIndex: 1,
        text: `The biggest mistake beginners make is waiting for millions instead of testing high-demand micro-services today.`,
        visual: `Cinematic 9:16 vertical 8k shot, entrepreneur evaluating budget options on mobile phone screen, crisp depth of field`
      },
      {
        slideIndex: 2,
        text: `Focus entirely on cash flow: keep your fixed costs near zero and reinvest your first profits immediately.`,
        visual: `Cinematic 9:16 vertical 8k shot, clean financial calculator diagram with glowing emerald growth curves`
      },
      {
        slideIndex: 3,
        text: `Calculate your margins beforehand: if supplies cost $2 and you sell for $5, your gross profit is $3 per unit.`,
        visual: `Cinematic 9:16 vertical 8k shot, practical micro-business supply inventory in high-contrast studio setting`
      },
      {
        slideIndex: 4,
        text: `Always separate your personal money from your business cash so inflation and impulse buys never eat your working capital.`,
        visual: `Cinematic 9:16 vertical 8k shot, modern disciplined entrepreneur managing digital accounts`
      },
      {
        slideIndex: 5,
        text: `Start small, test fast, and ${resolvedOutro}`,
        visual: `Cinematic 9:16 vertical 8k shot, inspiring modern city office background with amber and emerald bokeh glow`
      }
    ]
  };
}

/**
 * Build rich prompt for 15-chapter 15-20 min educational masterclass video
 */
function buildFinDeepDivePrompt(archetype, recentHistory = [], channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 15).map(h => `"${h.topic || h.title}"`).join(', ');
  const resolvedOutro = resolveFinOutro(cleanHandle);

  const systemPrompt = `You are a world-class financial educator and long-form documentary scriptwriter for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).

LONG-FORM DEEP-DIVE REQUIREMENTS (15-20 MINUTE MASTERCLASS WITH 15 CHAPTERS):
1. EXACTLY 15 COMPREHENSIVE CHAPTERS / SLIDES:
   - Each slide represents an in-depth, thorough teaching section (~110-140 words per slide of rich, spoken-word educational narration).
   - Total narration word count across 15 slides: ~1,800 to 2,100 words (translates to ~15-18 minutes of steady spoken audio).
2. NON-GURU, PRACTICAL, HIGH-PROFIT VALUE:
   - Do NOT promise or guarantee income, profit, or instant wealth.
   - ALWAYS use honest, measured language: "potential revenue", "estimated margins", "results vary", "possible startup costs".
   - The teaching must be intensely actionable, breakdown real supply costs, pricing formulas, and downside risks.
3. GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
   - Whenever mentioning currency, budgets, costs, or revenues, include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents (e.g. "₦5,000 (about $3.50 USD)", "₦20,000 (around $13.50 USD)", "$10 (approx. ₦15,000)").
4. 15-CHAPTER PROGRESSIVE CURRICULUM:
   - Slide 0: Executive Hook & The Landscape
   - Slide 1: The Core Problem & Common Financial Leaks
   - Slide 2: The Foundational Principle & Mental Model
   - Slide 3: Equipment, Phone Tools & Zero-Cost Resources Needed
   - Slide 4: Step 1 - Market Research & Finding High-Demand Niches
   - Slide 5: Step 2 - Sourcing, Production & Supply Costs
   - Slide 6: Step 3 - Pricing Strategy & Unit Economics
   - Slide 7: Step 4 - Gross Profit Margins & Break-Even Math
   - Slide 8: Step 5 - Digital Customer Acquisition (Organic & Free Outreach)
   - Slide 9: Step 6 - Cash Flow Discipline & Working Capital Safety
   - Slide 10: Step 7 - Inflation Defense & Hedging Purchasing Power
   - Slide 11: Real-World Case Study Breakdown (Scenario Walkthrough)
   - Slide 12: Scaling from ₦5,000 ($3.50) to ₦50,000 ($35) Reinvestment Rules
   - Slide 13: Free Certifications, Tools & Legitimate Grants Directory
   - Slide 14: 30-Day Step-by-Step Action Checklist & Channel Outro (${resolvedOutro})
5. MULTI-SOURCE VISUAL PLANNING:
   - Detail a crisp, widescreen 16:9 cinematic photorealistic scene for each slide.

OUTPUT FORMAT: Return strictly valid JSON matching this schema:
{
  "title": "Comprehensive Masterclass Title with Dual Currency Mention (No #Shorts)",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "estimatedBudget": "${archetype.targetBudget}",
  "description": "Full 15-chapter masterclass on ${archetype.theme}.\\n\\nTimestamps:\\n00:00 Introduction & Overview\\n...\\n\\n#PersonalFinance #SmallBusiness #MoneySkills #FinancialEducation",
  "tags": ["#PersonalFinance", "#SmallBusiness", "#MoneySkills", "#FinancialEducation", "#BusinessBreakdown"],
  "slides": [
    {
      "slideIndex": 0,
      "chapterTitle": "Introduction & Market Opportunity",
      "text": "Detailed 110-140 words spoken narration covering the overview and opportunity...",
      "visual": "16:9 widescreen 8k photorealistic modern financial studio workspace with emerald green and gold ambient lighting..."
    }
    // ... exactly 15 slides total (index 0 to 14)
  ]
}`;

  const userPrompt = `Generate a comprehensive 15-chapter 15-20 minute educational Masterclass script on "${archetype.theme}". Angle: "${archetype.angle}". Budget: "${archetype.targetBudget}". Avoid previous topics: [${recentTitles || 'None'}]. Ensure each slide has 110-140 words of rich spoken narration. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic Fallback for 15-Chapter 15-20 Minute Masterclass
 */
function synthesizeDeterministicFinDeepDiveStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveFinOutro(cleanHandle);
  const arch = archetype || FIN_ARCHETYPES[0];
  const cleanTopic = sanitizeFinString(topicTitle || arch.theme);

  const chapters = [
    { title: 'Executive Overview & The Small Capital Paradigm', focus: 'Why tiny capital is not a barrier when you focus on high-utility micro-services and zero-inventory business models.' },
    { title: 'The Silent Money Traps & Beginner Mistakes', focus: 'Why 80% of new earners fail by buying unnecessary gear or trusting get-rich-quick schemes instead of solving real problems.' },
    { title: 'The Core Principle: Cash Velocity Over Big Capital', focus: 'Understanding how moving $5 or ₦5,000 ten times a week creates more income than waiting months for a large grant.' },
    { title: 'Essential Zero-Cost Tools & Smartphone Setup', focus: 'The exact free smartphone apps, digital ledger tools, and communication channels needed to operate efficiently.' },
    { title: 'Step 1: Finding High-Demand Local & Digital Demand', focus: 'How to survey your neighborhood, school, or online communities to find what people are already spending money on.' },
    { title: 'Step 2: Sourcing Supplies & Managing Initial Costs', focus: 'Negotiating micro-quantities from wholesale markets and keeping your upfront commitments strictly within your budget.' },
    { title: 'Step 3: Realistic Pricing Strategy & Value Perception', focus: 'How to price your offer based on customer convenience and speed rather than competing on the bottom price.' },
    { title: 'Step 4: Unit Economics & Calculating Break-Even Points', focus: 'The exact mathematical formula for calculating gross profit per unit and knowing how many sales you need each day.' },
    { title: 'Step 5: Free Customer Acquisition & Word of Mouth', focus: 'Simple WhatsApp broadcast strategies, direct neighborhood outreach, and social media showcase techniques that cost $0.' },
    { title: 'Step 6: Protecting Working Capital & Cash Leaks', focus: 'Why you must separate your personal feeding money from your business cash box from the very first transaction.' },
    { title: 'Step 7: Inflation Defense & Currency Preservation', focus: 'How to hedge your growing savings using stable value methods and avoiding leaving idle cash in low-interest accounts.' },
    { title: 'Case Study: The ₦10,000 to ₦100,000 Journey', focus: 'A step-by-step hypothetical walkthrough showing realistic timeline, reinvestment cycles, and operational challenges.' },
    { title: 'Reinvestment Rules & Scaling Safely', focus: 'The 70-30 profit allocation rule: taking 30% for personal buffer and rolling 70% back into inventory expansion.' },
    { title: 'Verified Free Certifications & Learning Resources', focus: 'Google Career certificates, digital skill libraries, and legitimate enterprise development resources you can access for free.' },
    { title: '30-Day Step-by-Step Action Checklist & Conclusion', focus: `Your concrete 4-week implementation blueprint. Start small, stay disciplined, and ${resolvedOutro}` }
  ];

  return {
    title: `${cleanTopic} - Complete Step-by-Step Masterclass`,
    category: arch.category,
    theme: arch.theme,
    angle: arch.angle,
    estimatedBudget: arch.targetBudget,
    description: `Comprehensive 15-Chapter Masterclass on ${arch.theme}.\n\nTimestamps:\n` +
      chapters.map((c, i) => `${String(Math.floor(i * 1.2)).padStart(2, '0')}:00 Chapter ${i + 1}: ${c.title}`).join('\n') +
      `\n\n#PersonalFinance #SmallBusiness #MoneySkills #FinancialEducation`,
    tags: ["#PersonalFinance", "#SmallBusiness", "#MoneySkills", "#FinancialEducation", "#BusinessBreakdown"],
    slides: chapters.map((c, idx) => ({
      slideIndex: idx,
      chapterTitle: c.title,
      text: `In this section of our masterclass on ${arch.theme}, we examine ${c.title.toLowerCase()}. ${c.focus} When you are working with a budget of ${arch.targetBudget}, every single dollar or naira counts. The goal is to build sustainable operational habits that eliminate unnecessary risk while steadily compounding your gross profit margins over time. Remember that real financial growth is not about overnight luck, but consistent daily execution.`,
      visual: `16:9 widescreen 8k photorealistic modern educational scene, sleek dark obsidian slate studio, emerald green and gold ambient lighting, ultra-high definition, professional cinematic depth`
    }))
  };
}

module.exports = {
  FIN_CATEGORIES,
  FIN_ARCHETYPES,
  ROTATING_FIN_OUTROS,
  auditFinancialScriptSafety,
  sanitizeFinString,
  resolveFinOutro,
  selectDiverseArchetype,
  buildFinPromptForSlot,
  buildFinDeepDivePrompt,
  synthesizeDeterministicFinStoryboard,
  synthesizeDeterministicFinDeepDiveStoryboard
};

