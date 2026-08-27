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

// 16 Comprehensive Financial Archetypes spanning all pillars with dual currency relevance and simple language
const FIN_ARCHETYPES = [
  {
    id: 'fin_01_micro_startup_food',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Small-Capital Business: Snack & Micro-Reselling',
    angle: '3 Simple Businesses You Can Start With Under ₦5,000 ($3.50 USD)',
    targetBudget: '₦5,000 (~$3.50 USD)',
    hookPatterns: [
      'If you only have ₦5,000 or about $3.50 to start a business, here is what actually works.',
      'Stop waiting for millions of cash — here are 3 simple micro businesses starting under $5 or ₦5,000.',
      'What you can do to make honest money if you only have ₦5,000 ($3.50 USD) in your pocket today.'
    ],
    narrativeArc: 'Hook on tiny capital -> 3 practical low-equipment ideas (snack packs, micro-delivery, item flipping) -> Real supply cost & margin math -> Downside risk -> CTA',
    visualAesthetic: 'Crisp cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald green and gold rim lighting, dark slate backdrop, crisp bokeh depth of field',
    outroPattern: 'Follow @bones_ceo to learn real money management and business blueprints every day.'
  },
  {
    id: 'fin_02_budgeting_50_30_20',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Personal Finance: Zero-Based Realistic Budgeting',
    angle: 'How to Budget ₦20,000 ($13.50 USD) So Your Money Lasts All Month',
    targetBudget: '₦20,000 (~$13.50 USD)',
    hookPatterns: [
      'Why does your money disappear 3 days after getting paid? Here is the simple 50-30-20 fix.',
      'How to budget ₦20,000 or $13.50 USD so you do not run out of cash before the month ends.',
      'The biggest budgeting mistake that keeps beginners broke, and how to fix it in 60 seconds.'
    ],
    narrativeArc: 'Hook on disappearing cash -> The 50/30/20 breakdown for small amounts -> Cutting silent expense leaks -> Emergency buffer -> CTA',
    visualAesthetic: 'Clean high-contrast smartphone budget interface, warm studio lighting with dark slate background, clear typography, financial stability aesthetic',
    outroPattern: 'Tap follow on @bones_ceo to master your personal finances and grow your savings.'
  },
  {
    id: 'fin_03_inflation_purchasing_power',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Financial Education: Inflation & Rising Market Prices Explained Simply',
    angle: 'What Inflation Actually Means For Your ₦50,000 ($35 USD) Savings',
    targetBudget: '₦50,000 (~$35 USD)',
    hookPatterns: [
      'Keeping cash under your mattress quietly steals your money. Here is what inflation means in plain words.',
      'What inflation actually does to your grocery shopping money in under 60 seconds.',
      'Why prices keep rising in the market and how to protect your savings from losing value.'
    ],
    narrativeArc: 'Definition in plain terms -> Real grocery basket purchasing power comparison -> Why idle cash erodes -> Practical hedging strategies -> CTA',
    visualAesthetic: 'Sleek financial diagram, purchasing power comparison chart, obsidian black background with emerald and gold accents, 9:16 vertical 8k cinematic shot',
    outroPattern: 'Follow @bones_ceo for simple, jargon-free financial education every morning.'
  },
  {
    id: 'fin_04_phone_only_monetization',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Phone-Only Digital Skills & Remote Income',
    angle: '3 Free Digital Skills You Can Learn On Just Your Smartphone',
    targetBudget: '$0 (Phone & Internet Only)',
    hookPatterns: [
      'You do not need an expensive laptop to make money online in 2026. Your phone is enough.',
      'Turn your smartphone into a daily income engine with these 3 free practical skills.',
      'Three high-value digital skills anyone with a phone and internet can learn this week for free.'
    ],
    narrativeArc: 'Problem of expensive gear -> 3 realistic phone skills (CapCut video editing, copywriting, social media management) -> Free learning sources -> Client outreach -> CTA',
    visualAesthetic: 'Modern creator setup, smartphone with mobile video editor timeline, ambient cyan and gold backlight, crisp 35mm portrait lens',
    outroPattern: 'Follow @bones_ceo for actionable skill breakdowns and remote income strategies.'
  },
  {
    id: 'fin_05_scam_red_flags',
    category: FIN_CATEGORIES.SCAM_AWARENESS,
    theme: 'Scam & Fraud Prevention: Exposing Ponzi & Fake Investment Traps',
    angle: '5 Simple Signs of a Fake Investment Scam Before You Lose Your Money',
    targetBudget: 'Protecting Your Capital',
    hookPatterns: [
      'If anyone promises you guaranteed 30% weekly profit, run away immediately. It is a scam.',
      'How to spot a fake investment scheme in under 30 seconds before losing your hard-earned cash.',
      'The 3 biggest money traps targeting young people and students right now.'
    ],
    narrativeArc: 'The psychological lure -> 5 undeniable red flags (guarantees, recruitment pressure, fake audits) -> Real example -> How to verify legitimacy -> CTA',
    visualAesthetic: 'High-contrast security and warning aesthetic, deep charcoal and red-amber accent lighting, sleek digital shield motif, 9:16 vertical 8k cinematic',
    outroPattern: 'Follow @bones_ceo to protect your money and stay ahead of financial scams.'
  },
  {
    id: 'fin_06_business_economics_breakdown',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    theme: 'Business Breakdowns: Real Profit Margins on Small Items',
    angle: 'The Real Math Behind Starting a ₦10,000 ($7 USD) Snack Reselling Business',
    targetBudget: '₦10,000 (~$7 USD)',
    hookPatterns: [
      'Can you turn ₦10,000 or $7 USD into daily profit? Let us do the simple math together.',
      'Here is the exact cost, selling price, and real profit of a simple street snack business.',
      'The hidden costs that hurt small business owners before they even make their first profit.'
    ],
    narrativeArc: 'The business premise -> Startup supply cost breakdown -> Pricing strategy -> Estimated gross margin & hidden expenses -> Break-even reality -> CTA',
    visualAesthetic: 'Clean commercial packaging setup, clear financial breakdown table, warm tungsten studio lighting, realistic depth of field',
    outroPattern: 'Follow @bones_ceo for transparent business breakdowns and startup economics.'
  },
  {
    id: 'fin_07_stablecoins_hedging',
    category: FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO,
    theme: 'Beginner Crypto: Digital Dollars (USDT) Explained for Starters',
    angle: 'What Are Digital Dollars (USDT) and Why Do People Save in Them?',
    targetBudget: 'Any Budget ($1+ / ₦1,500+)',
    hookPatterns: [
      'What is a digital dollar like USDT, and why do millions use it to protect their savings?',
      'Crypto does not have to be confusing — here is how digital dollar savings work for beginners.',
      'Before you touch crypto, learn why digital dollars stay stable while other coins go up and down.'
    ],
    narrativeArc: 'Plain definition -> How 1 USDT stays $1 USD -> Use case for beating local devaluation -> Self-custody safety rules -> CTA',
    visualAesthetic: 'Futuristic clean financial interface, glowing emerald and gold crypto tokens on dark obsidian slate, sleek 3D perspective, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for honest, hype-free crypto education and security tips.'
  },
  {
    id: 'fin_08_free_certifications_grants',
    category: FIN_CATEGORIES.FREE_OPPORTUNITIES,
    theme: 'Free Opportunities: Free Tech Certifications to Learn Online',
    angle: '3 Free Certifications From Google and Microsoft That Teach Real Skills',
    targetBudget: '$0 (100% Free)',
    hookPatterns: [
      'Top companies look for these skills, and Google teaches them completely for free.',
      'Do not pay for overpriced courses — get free certificates from big tech companies today.',
      'The top free global certificates you can finish right on your phone this week.'
    ],
    narrativeArc: 'High cost of education vs free tech programs -> 3 specific free certs -> What you learn -> How to put it on LinkedIn/Resume -> CTA',
    visualAesthetic: 'Modern digital certificate interface, glowing green verified badge, modern study desk, crisp cinematic lighting, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for verified free grants, courses, and career opportunities.'
  },
  {
    id: 'fin_09_compound_interest_dollar_day',
    category: FIN_CATEGORIES.FINANCIAL_CALCULATORS,
    theme: 'Financial Calculators: How Small Daily Savings Grow Over Time',
    angle: 'What Happens When You Save Just $1 (₦1,500) Every Single Day?',
    targetBudget: '$1/day (₦1,500/day)',
    hookPatterns: [
      'What happens if you save just $1 or ₦1,500 every single day for the next ten years?',
      'Why saving small amounts every day beats trying to save one big lump sum.',
      'How compound growth works: your money makes small profit, and that profit makes even more profit.'
    ],
    narrativeArc: 'The compound formula explained simply -> The 1-year vs 5-year vs 10-year curve -> Rule of 72 -> Practical starting step -> CTA',
    visualAesthetic: 'Exponential growth chart visualization, glowing green compounding curve on sleek dark glass, 9:16 vertical 8k cinematic studio shot',
    outroPattern: 'Follow @bones_ceo to learn how to build long-term wealth step by step.'
  },
  {
    id: 'fin_10_thrift_reselling_hustle',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Small-Capital Business: Buying and Reselling Clean Second-Hand Clothes',
    angle: 'How to Start a Clothing Reselling Hustle With Under ₦15,000 ($10 USD)',
    targetBudget: '₦15,000 (~$10 USD)',
    hookPatterns: [
      'Buying neat second-hand clothes and selling them online is one of the easiest small businesses to start.',
      'How to buy, take clean pictures, and sell thrift items with only $10 or ₦15,000.',
      'Three simple rules for selling clothes online so you never get stuck with unsold items.'
    ],
    narrativeArc: 'Sourcing cheap inventory -> Cleaning and presentation -> Pricing for 100% markup -> Packaging & shipping -> CTA',
    visualAesthetic: 'Aesthetic vintage clothing rack, smartphone product photoshoot setup, warm sunlight and tungsten studio lighting, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for practical small-business blueprints and side-hustle guides.'
  },
  {
    id: 'fin_11_emergency_fund_blueprint',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Personal Finance: Saving Your First ₦10,000 ($7 USD) Safety Buffer',
    angle: 'How to Save Your First ₦10,000 ($7 USD) Cushion When Money is Tight',
    targetBudget: '₦10,000 (~$7 USD)',
    hookPatterns: [
      'An emergency fund is money you lock away for unexpected emergencies like hospital bills or phone repairs.',
      'How to save your first ₦10,000 ($7 USD) emergency cushion without starving.',
      'Why you should always save a little emergency cash before putting money into any business.'
    ],
    narrativeArc: 'The unexpected expense trap -> Why emergency savings must be liquid -> The ₦500 / $0.35 daily savings challenge -> Where to store it safely -> CTA',
    visualAesthetic: 'Clean locked digital vault concept, warm emerald rim lighting, modern glass aesthetic, 9:16 vertical 8k cinematic',
    outroPattern: 'Follow @bones_ceo for realistic budgeting systems and emergency fund guides.'
  },
  {
    id: 'fin_12_interest_rates_apr_explained',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Financial Education: Quick Loan Apps & High Borrowing Fees Explained',
    angle: 'How High-Interest Quick Loan Apps Trap Borrowers in Endless Debt',
    targetBudget: 'Financial Protection',
    hookPatterns: [
      'If you borrow ₦10,000 and have to pay back ₦13,000 in just two weeks, that fee is dangerously high.',
      'What quick loan apps do not tell you about heavy hidden penalties and daily interest.',
      'How to check the real cost of borrowing money before taking any quick loan.'
    ],
    narrativeArc: 'The allure of instant loan apps -> The hidden math of bi-weekly fees (APR explained) -> Debt spiral danger -> Safe alternative solutions -> CTA',
    visualAesthetic: 'Digital smartphone loan interface warning breakdown, dramatic moody slate lighting with red and gold highlights, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo to protect your credit and make smart borrowing decisions.'
  },
  {
    id: 'fin_qa_why_always_broke',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Why Are You Still Broke Despite Working Hard?',
    angle: 'Question & Simple Answer: Why Hard Work Alone Does Not Make You Rich & The 3 Rules to Fix It',
    targetBudget: 'Any Income Level',
    hookPatterns: [
      'Why are you still broke even though you work long, exhausting hours every single day?',
      'Have you ever wondered why working hard at a normal job is not making you wealthy?',
      'Why does your salary disappear before the next month even begins?'
    ],
    narrativeArc: 'Relatable Question -> The Silent Spending Trap -> The Simple 3-Step Money Blueprint (Learn, Save, Multiply) -> Plain-Language Takeaway -> CTA',
    visualAesthetic: 'Modern realistic scene of a young professional looking at smartphone banking ledger with growing confidence, emerald green ambient rim lighting, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo to learn how to keep and grow your money in simple English.'
  },
  {
    id: 'fin_qa_phone_skills_zero_cash',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Can You Make Money With Just Your Phone and Zero Cash?',
    angle: 'Question & Simple Answer: 3 Real Phone Skills You Can Learn in 7 Days for Free',
    targetBudget: '$0 (Phone & Internet Only)',
    hookPatterns: [
      'Can you actually make honest money with just your smartphone and zero starting cash?',
      'If you have zero capital but you have a phone with internet, what can you start today?',
      'How can a student or beginner earn their first dollar online using only their mobile phone?'
    ],
    narrativeArc: 'Direct Question -> 3 Verified Phone Skills (CapCut editing, social media copywriting, flyer design) -> Free YouTube training roadmap -> Safe client outreach -> CTA',
    visualAesthetic: 'Crisp cinematic shot of hands editing vertical video clips smoothly on a modern smartphone, warm gold studio bokeh, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo for realistic phone-only income blueprints and daily money tips.'
  },
  {
    id: 'fin_qa_why_money_loses_value',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Why Does Saved Cash Buy Less Food Every Year?',
    angle: 'Question & Simple Answer: What Inflation Means in Plain Words & How to Protect Your Savings',
    targetBudget: '₦10,000+ ($7+ USD)',
    hookPatterns: [
      'Why does ₦10,000 or $10 buy fewer groceries today than it did last year?',
      'Why is leaving all your money sitting in a normal bank account quietly losing you cash?',
      'What is inflation, and why does the price of rice, bread, and fuel keep going up?'
    ],
    narrativeArc: 'Everyday Question -> Simple Grocery Basket Math -> The Definition of Inflation in Plain English -> 2 Easy Protection Steps (Commodities, Digital Dollars) -> CTA',
    visualAesthetic: 'Clean comparative infographic of everyday grocery baskets over time, sleek high-contrast financial display, 9:16 vertical 8k',
    outroPattern: 'Follow @bones_ceo to understand money and protect your hard-earned savings.'
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

  const systemPrompt = `You are the lead financial educator and YouTube director for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).

CRITICAL DURATION & DEPTH MANDATES:
1. MINIMUM RUNTIME RULE: Every video MUST be AT LEAST 60 SECONDS (1 full minute or more).
2. EXACTLY 8 COMPREHENSIVE SLIDES (slideIndex 0 to 7):
   - You MUST generate exactly 8 distinct, progressive, and deeply explanatory slides.
   - Each slide MUST contain 2 to 3 complete, natural spoken sentences (25 to 35 spoken words per slide).
   - Total script word count MUST be between 220 and 280 words to guarantee a 65-75 second natural spoken runtime.

STRICT 8-SLIDE EXPLANATORY NARRATIVE ARC:
   - Slide 0 (The Burning Question / Realistic Budget Hook): Hook the viewer with an everyday financial dilemma or realistic budget in dual currency ($ / ₦).
   - Slide 1 (The Hidden Trap / Why People Lose Money): Clearly explain the underlying mistake or predatory trap in plain, relatable language.
   - Slide 2 (The Core Financial Principle): Define the financial concept simply on the spot (e.g. cash flow, APR interest, profit margin, purchasing power).
   - Slide 3 (The Realistic Math & Sourcing Breakdown): Give tangible numbers, exact costs, and realistic profit/loss math in dual currency ($ / ₦).
   - Slide 4 (Step-by-Step Practical Execution): Explain exactly what action to take today without needing expensive equipment or outside connections.
   - Slide 5 (Protecting Your Capital & Risk Control): Give practical advice on how to avoid losing money, falling for scams, or running out of cash.
   - Slide 6 (The Compounding Long-Term Advantage): Describe how consistency and reinvesting builds real financial peace over time.
   - Slide 7 (The Final Golden Rule & Outro): A powerful final summary takeaway + "${resolvedOutro}".

GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
   - Seamlessly include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents for any money amounts.
   - Examples: "₦5,000 (about $3.50 USD)", "₦20,000 (around $13.50 USD)", "$10 (approx. ₦15,000)".

UNIFIED 9:16 VERTICAL VISUAL STYLE:
   - 9:16 vertical 8k photorealistic aesthetic with dark obsidian slate background, emerald green and warm gold rim lighting.

TARGET THEME & ANGLE:
   - Theme: ${archetype.theme}
   - Angle: ${archetype.angle}
   - Target Budget: ${archetype.targetBudget}
   - Avoid recent titles: [${recentTitles || 'None'}]

OUTPUT FORMAT: Return strictly a valid JSON object matching this schema:
CRITICAL: Output EXACTLY 8 slides (slideIndex 0 to 7). Never return less than 8 slides.

{
  "title": "Punchy High-CTR Title with Global Dual-Currency Mention #Shorts",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "hook": "${archetype.hookPatterns[slotIndex % archetype.hookPatterns.length]}",
  "description": "Comprehensive practical breakdown of ${archetype.theme}.\\n\\n#Shorts #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy #BusinessIdeas",
  "tags": ["#Shorts", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy", "#BusinessBreakdown"],
  "estimatedBudget": "${archetype.targetBudget}",
  "slides": [
    {
      "slideIndex": 0,
      "text": "Opening hook addressing the realistic starting budget and problem in simple words with USD and Naira (25-35 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald and gold ambient rim light..."
    },
    {
      "slideIndex": 1,
      "text": "The hidden trap or mistake beginners make explained with simple everyday words (25-35 words)...",
      "visual": "Matching 9:16 vertical 8k shot with consistent emerald/gold color palette and sharp depth of field..."
    },
    {
      "slideIndex": 2,
      "text": "The simple financial rule explained with an easy everyday definition (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, clean financial interface or business supply setup..."
    },
    {
      "slideIndex": 3,
      "text": "Concrete pricing, startup cost, or profit margin breakdown in simple dual-currency math (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, clear visual breakdown chart with high-contrast text..."
    },
    {
      "slideIndex": 4,
      "text": "Step-by-step practical execution of what to do today with zero friction (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, close-up hands demonstrating practical setup..."
    },
    {
      "slideIndex": 5,
      "text": "The critical risk warning on how to protect your capital and avoid scams (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, cyber security shield or verified accounting balance..."
    },
    {
      "slideIndex": 6,
      "text": "The compounding benefit of reinvesting and building sustainable cash flow (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, confident modern entrepreneur in cinematic lighting..."
    },
    {
      "slideIndex": 7,
      "text": "Final golden summary rule + '${resolvedOutro}' (25-35 words)...",
      "visual": "Matching 9:16 vertical shot, clean modern studio resolution with subtle gold accents..."
    }
  ]
}`;

  const userPrompt = `Generate a brand new, highly practical and deeply explanatory Finance Short storyboard for Slot ${slotIndex + 1}.
Theme: "${archetype.theme}". Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
MANDATE: Must contain EXACTLY 8 slides (slideIndex 0 to 7) with 25-35 words per slide for a full 60+ second deep explanatory runtime. Ensure realistic calculations with dual $ / ₦ context. Output strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic fallback storyboard synthesis if AI providers are unreachable.
 * Dynamically synthesizes topic-specific, highly tailored 8-slide storyboards
 * with unique scripts, dual-currency math, and matching visual prompts for every category (60s+ runtime).
 */
function synthesizeDeterministicFinStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveFinOutro(cleanHandle);
  const arch = archetype || FIN_ARCHETYPES[0];
  const cleanTopic = sanitizeFinString(topicTitle || arch.angle);
  const topicLower = (cleanTopic + ' ' + (arch.theme || '') + ' ' + (arch.angle || '')).toLowerCase();

  // 1. LOAN APPS / HIGH INTEREST / DEBT TRAP
  if (topicLower.includes('loan') || topicLower.includes('borrow') || topicLower.includes('apr') || topicLower.includes('debt') || topicLower.includes('interest')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
      theme: 'Financial Education: Quick Loan Apps & High Borrowing Fees Explained',
      angle: 'How High-Interest Quick Loan Apps Trap Borrowers in Endless Debt',
      hook: 'Have you ever wondered why quick loan apps give you instant cash in 5 minutes with no collateral?',
      description: `Comprehensive breakdown of quick loan apps and how high interest rates trap borrowers in endless debt cycles.\n\n#Shorts #PersonalFinance #LoanApps #DebtFree #MoneyTips #FinancialLiteracy`,
      tags: ["#Shorts", "#PersonalFinance", "#LoanApps", "#DebtFree", "#MoneyTips", "#FinancialLiteracy"],
      estimatedBudget: 'Financial Protection ($0)',
      slides: [
        {
          slideIndex: 0,
          text: `Have you ever wondered why quick mobile loan apps are willing to give you instant money in five minutes without asking for any collateral, salary slip, or guarantor?`,
          visual: `Cinematic 9:16 vertical 8k shot, smartphone screen displaying instant loan approved notification with warning glowing amber highlights`
        },
        {
          slideIndex: 1,
          text: `Here is the hidden trap they never advertise: If you borrow ₦10,000 (about $7 USD) and they deduct a ₦3,500 ($2.30) fee for a two-week period, that is a staggering 35 percent interest every fourteen days.`,
          visual: `Cinematic 9:16 vertical 8k visual breakdown chart showing small loan amount overshadowed by huge red repayment penalties`
        },
        {
          slideIndex: 2,
          text: `Annualized, that rate equals over nine hundred percent per year. When you cannot repay on time, they slap on extra daily penalties that quickly double your original debt.`,
          visual: `Cinematic 9:16 vertical 8k shot, financial graph showing compounding exponential debt spike in warning crimson`
        },
        {
          slideIndex: 3,
          text: `Worst of all, during installation, these apps demand full access to your phone contacts and photo gallery. If you miss one deadline, predatory agents start sending shameful broadcast messages to your family and coworkers.`,
          visual: `Cinematic 9:16 vertical 8k shot, cyber security shield on modern mobile interface alerting user to unauthorized phone permissions`
        },
        {
          slideIndex: 4,
          text: `Before you ever click accept on any mobile loan app, always inspect the exact repayment schedule and total fees. If the interest exceeds five percent per month, delete the app immediately.`,
          visual: `Cinematic 9:16 vertical 8k close-up, sharp financial checklist on clean desk with calculator and emerald approval checkmark`
        },
        {
          slideIndex: 5,
          text: `Never borrow money to pay for daily food, phone data, or transport fares. Borrowing for consumption only digs a deeper hole that destroys your peace of mind and credit history.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean transparent savings jar with neatly organized dollar and naira bills on dark slate desk`
        },
        {
          slideIndex: 6,
          text: `Instead, build a tiny emergency buffer of ₦5,000 to ₦10,000 (about $3.50 to $7 USD) locked away in a separate bank account so you never have to depend on loan sharks to survive.`,
          visual: `Cinematic 9:16 vertical 8k shot, secure digital bank vault interface glowing with emerald green protective shields`
        },
        {
          slideIndex: 7,
          text: `Protect your peace of mind, avoid predatory debt traps, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, confident disciplined entrepreneur working at modern desk in emerald and gold ambient studio glow`
        }
      ]
    };
  }

  // 2. PHONE SKILLS & REMOTE INCOME ($0 / ₦0)
  if (topicLower.includes('skill') || topicLower.includes('phone') || topicLower.includes('remote') || topicLower.includes('online income') || topicLower.includes('laptop') || topicLower.includes('canva') || topicLower.includes('capcut')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.SKILLS_TO_INCOME,
      theme: 'Phone-Only Digital Skills & Remote Income',
      angle: '3 Free Digital Skills You Can Learn On Just Your Smartphone',
      hook: 'You do not need an expensive laptop to make honest money online in 2026 — your phone is enough.',
      description: `Comprehensive breakdown of 3 valuable digital skills you can learn and offer with just a smartphone and internet connection.\n\n#Shorts #DigitalSkills #MakeMoneyOnline #SideHustle #PhoneIncome #Freelancing`,
      tags: ["#Shorts", "#DigitalSkills", "#MakeMoneyOnline", "#SideHustle", "#PhoneIncome", "#Freelancing"],
      estimatedBudget: '$0 (Phone & Internet Only)',
      slides: [
        {
          slideIndex: 0,
          text: `You do not need an expensive laptop, a college degree, or millions in starting cash to earn honest income online in 2026. If you have a working smartphone, you already have the tool.`,
          visual: `Cinematic 9:16 vertical 8k scene, hands holding a sleek smartphone displaying a video editing timeline with emerald and gold ambient light`
        },
        {
          slideIndex: 1,
          text: `The first high-demand skill is vertical video editing using free mobile apps like CapCut. Local businesses, online coaches, and content creators desperately need short-form video editors to grow their reach.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean screen recording view of mobile video cutting and dynamic captions on modern smartphone`
        },
        {
          slideIndex: 2,
          text: `You can easily charge $10 to $15, or about ₦15,000 to ₦20,000, to edit a batch of clean vertical videos with subtitles and smooth transitions for busy entrepreneurs.`,
          visual: `Cinematic 9:16 vertical 8k shot, sleek pricing rate card displayed on modern digital tablet with gold accents`
        },
        {
          slideIndex: 3,
          text: `The second valuable skill is promotional flyer design using Canva on your phone. Small shop owners need daily product banners, discount posters, and WhatsApp status graphics to attract paying buyers.`,
          visual: `Cinematic 9:16 vertical 8k shot, colorful modern promotional product flyer template being customized on mobile canvas`
        },
        {
          slideIndex: 4,
          text: `The third skill is writing short sales captions. Help local merchants write clear, persuasive WhatsApp broadcast messages and product descriptions that answer customer questions and close sales faster.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean messaging interface showing customer orders coming in through clear promotional text`
        },
        {
          slideIndex: 5,
          text: `To start, spend forty-five minutes every evening watching free step-by-step tutorials on YouTube. Practice making three sample flyers and two sample videos to build a simple portfolio.`,
          visual: `Cinematic 9:16 vertical 8k shot, organized student workspace with notebook, phone on tripod, and warm ambient lighting`
        },
        {
          slideIndex: 6,
          text: `Directly message five local store owners or online vendors on WhatsApp and offer to design their first promo flyer for free. Once they see the quality, they will happily pay for weekly work.`,
          visual: `Cinematic 9:16 vertical 8k shot, friendly business conversation handshake in modern minimalist cafe setting`
        },
        {
          slideIndex: 7,
          text: `Turn your daily screen time into steady income, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, young creator smiling confidently in modern workspace with emerald green rim lighting`
        }
      ]
    };
  }

  // 3. SCAM AWARENESS & FRAUD PREVENTION
  if (topicLower.includes('scam') || topicLower.includes('ponzi') || topicLower.includes('trap') || topicLower.includes('fake') || topicLower.includes('fraud') || topicLower.includes('giveaway')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.SCAM_AWARENESS,
      theme: 'Scam & Fraud Prevention: Exposing Ponzi & Fake Investment Traps',
      angle: '5 Simple Signs of a Fake Investment Scam Before You Lose Your Money',
      hook: 'If anyone promises you guaranteed 30% weekly profit with zero risk, run away immediately.',
      description: `Comprehensive breakdown of how to spot fake investment schemes and protect your hard-earned money from Ponzi traps.\n\n#Shorts #ScamAlert #ProtectYourMoney #FinancialLiteracy #PersonalFinance`,
      tags: ["#Shorts", "#ScamAlert", "#ProtectYourMoney", "#FinancialLiteracy", "#PersonalFinance"],
      estimatedBudget: 'Capital Protection ($0)',
      slides: [
        {
          slideIndex: 0,
          text: `If anyone messages you on WhatsApp or Telegram promising guaranteed thirty percent weekly returns with zero risk, block them immediately. It is one hundred percent a financial scam.`,
          visual: `Cinematic 9:16 vertical 8k scene, high-contrast security warning aesthetic with glowing red-amber caution icon and dark slate background`
        },
        {
          slideIndex: 1,
          text: `Let us look at basic financial reality: The largest global banks and legitimate investment funds only generate eight to fifteen percent profit in a whole year. No real business can double your money in seven days.`,
          visual: `Cinematic 9:16 vertical 8k shot, comparison chart showing realistic bank interest versus fake unrealistic scam spike`
        },
        {
          slideIndex: 2,
          text: `Here is how Ponzi schemes work: They take money from new investors to pay small fake profits to earlier members, creating an illusion of success until the operators suddenly shut down and run away with everything.`,
          visual: `Cinematic 9:16 vertical 8k shot, digital pyramid diagram collapsing in red warnings with security lock engaging`
        },
        {
          slideIndex: 3,
          text: `The second warning sign is referral lock-in. If an app tells you that you must recruit three new friends or pay an extra verification fee before you can withdraw your own money, your funds are already trapped.`,
          visual: `Cinematic 9:16 vertical 8k shot, locked withdrawal button on fraudulent mobile interface with warning amber glow`
        },
        {
          slideIndex: 4,
          text: `Never transfer your money to any company that lacks verified government registration, has no physical verifiable office address, and only accepts anonymous crypto wallets or gift card codes.`,
          visual: `Cinematic 9:16 vertical 8k shot, official financial regulatory license and padlock verification badge on clean digital tablet`
        },
        {
          slideIndex: 5,
          text: `Always remember: Honest wealth is built steadily through valuable skills, useful products, and patience. Greed and impatience are the exact emotional triggers that scammers exploit to rob unsuspecting victims.`,
          visual: `Cinematic 9:16 vertical 8k shot, disciplined professional reviewing legitimate financial documents on dark mahogany desk`
        },
        {
          slideIndex: 6,
          text: `It is infinitely better to keep your ₦10,000 or $7 USD safely in your pocket than to gamble it away on fraudulent schemes that promise overnight riches.`,
          visual: `Cinematic 9:16 vertical 8k shot, secure digital bank vault interface glowing with emerald green protective shields`
        },
        {
          slideIndex: 7,
          text: `Stay vigilant, protect your hard-earned money, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, modern professional standing with confidence in sleek office with gold and slate tones`
        }
      ]
    };
  }

  // 4. INFLATION & PURCHASING POWER
  if (topicLower.includes('inflation') || topicLower.includes('purchasing power') || topicLower.includes('prices') || topicLower.includes('devaluation') || topicLower.includes('market')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
      theme: 'Financial Education: Inflation & Rising Market Prices Explained Simply',
      angle: 'What Inflation Actually Means For Your ₦50,000 ($35 USD) Savings',
      hook: 'Keeping idle cash under your mattress quietly steals your money every single year.',
      description: `Comprehensive explanation of inflation in simple language and how to protect your savings from losing real purchasing power.\n\n#Shorts #Inflation #FinancialEducation #MoneyTips #Economics #Savings`,
      tags: ["#Shorts", "#Inflation", "#FinancialEducation", "#MoneyTips", "#Economics", "#Savings"],
      estimatedBudget: '₦50,000 (~$35 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Leaving extra cash sitting idle in a zero-interest savings account quietly steals your purchasing power every single year. Here is why your bank balance is actually shrinking in real value.`,
          visual: `Cinematic 9:16 vertical 8k scene, visual comparison of a full grocery basket in 2020 versus half-empty basket today on dark slate counter`
        },
        {
          slideIndex: 1,
          text: `Inflation simply means that market prices of essential goods rise over time while your paper notes stay the exact same number. If ₦5,000 bought two bags of rice previously, today it might only buy one.`,
          visual: `Cinematic 9:16 vertical 8k shot, sleek price comparison chart with clean typography showing purchasing power trend over time`
        },
        {
          slideIndex: 2,
          text: `Your bank account might still show fifty thousand Naira or thirty-five dollars, but the actual quantity of food, clothing, fuel, and healthcare that cash can purchase has been cut significantly.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean smartphone banking screen showing balance beside real-world commodity costs`
        },
        {
          slideIndex: 3,
          text: `When local currency devalues against the US Dollar, imported goods like smartphones, electronics, and cooking oil instantly become more expensive for everyone in the market.`,
          visual: `Cinematic 9:16 vertical 8k shot, currency exchange rate display showing FX conversion with emerald and gold accents`
        },
        {
          slideIndex: 4,
          text: `To protect your wealth from being eaten away by inflation, you must never keep all your long-term funds in idle local currency. Put your savings into income-producing assets or high-demand skills.`,
          visual: `Cinematic 9:16 vertical 8k shot, glowing emerald growth asset allocation diagram with gold accents on obsidian background`
        },
        {
          slideIndex: 5,
          text: `Saving a portion of your long-term money in digital dollar stablecoins like USDT can help protect your purchasing power if your local currency is depreciating rapidly.`,
          visual: `Cinematic 9:16 vertical 8k shot, secure digital dollar stablecoin wallet on modern smartphone screen`
        },
        {
          slideIndex: 6,
          text: `Most importantly, invest in learning skills that allow you to earn in foreign currencies online, creating an income stream that automatically rises whenever exchange rates change.`,
          visual: `Cinematic 9:16 vertical 8k shot, modern freelancer working at laptop with dual currency balance graphs`
        },
        {
          slideIndex: 7,
          text: `Stay ahead of rising prices, protect your purchasing power, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, confident young entrepreneur analyzing financial growth charts in modern studio lighting`
        }
      ]
    };
  }

  // 5. BUDGETING 50/30/20 & EXPENSE LEAKS
  if (topicLower.includes('budget') || topicLower.includes('salary') || topicLower.includes('50/30/20') || topicLower.includes('broke') || topicLower.includes('spending') || topicLower.includes('save money')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
      theme: 'Personal Finance: Zero-Based Realistic Budgeting',
      angle: 'How to Budget ₦20,000 ($13.50 USD) So Your Money Lasts All Month',
      hook: 'Why does your money disappear three days after payday? Here is the simple 50-30-20 rule.',
      description: `Comprehensive step-by-step guide to budgeting small income so it lasts all month without running broke before the next payday.\n\n#Shorts #Budgeting #MoneyManagement #PersonalFinance #SavingMoney #SalaryTips`,
      tags: ["#Shorts", "#Budgeting", "#MoneyManagement", "#PersonalFinance", "#SavingMoney", "#SalaryTips"],
      estimatedBudget: '₦20,000 (~$13.50 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Why does your money always disappear three days after getting paid? The real issue is rarely how much you earn — it is having zero budget structure to guide your daily cash flow.`,
          visual: `Cinematic 9:16 vertical 8k scene, young adult reviewing monthly expense spreadsheet on smartphone with dark emerald ambient glow`
        },
        {
          slideIndex: 1,
          text: `Here is the realistic 50-30-20 budgeting framework: Allocate fifty percent of your income strictly for survival essentials like basic groceries, housing rent, utility bills, and daily transit fares.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean pie chart visual breakdown showing fifty percent allocated to essentials in gold and emerald`
        },
        {
          slideIndex: 2,
          text: `If you earn ₦20,000 (about $13.50 USD), that means exactly ₦10,000 ($6.75) is set aside for absolute non-negotiable living expenses so you never go hungry or miss rent.`,
          visual: `Cinematic 9:16 vertical 8k shot, clear expense tracking breakdown on clean modern tablet with gold highlights`
        },
        {
          slideIndex: 3,
          text: `Allocate thirty percent, which is ₦6,000 ($4.00), for your personal lifestyle and small wants. This gives you guilt-free freedom to buy airtime, meet a friend, or enjoy a treat without blowing your budget.`,
          visual: `Cinematic 9:16 vertical 8k shot, thirty percent lifestyle allocation section highlighted clearly on clean budget app interface`
        },
        {
          slideIndex: 4,
          text: `Most critically, immediately lock away the remaining twenty percent — ₦4,000 or $2.70 — into a locked savings account or emergency vault before you spend a single dime on anything else.`,
          visual: `Cinematic 9:16 vertical 8k shot, locked digital vault icon representing twenty percent emergency savings growing steadily`
        },
        {
          slideIndex: 5,
          text: `Saving first rather than saving whatever is left over changes everything. If you wait until the end of the month to save, random impulse purchases will always consume every single coin.`,
          visual: `Cinematic 9:16 vertical 8k shot, clear cash allocation envelopes neatly labeled Needs, Wants, and Savings on wooden desk`
        },
        {
          slideIndex: 6,
          text: `Consistently saving ₦4,000 every single month builds a reliable safety cushion of nearly ₦50,000 in a year, protecting you from sudden medical emergencies or unexpected repairs.`,
          visual: `Cinematic 9:16 vertical 8k shot, visual annual compounding growth chart showing small monthly deposits turning into solid security`
        },
        {
          slideIndex: 7,
          text: `Take control of your cash flow today, build your financial armor, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, relaxed smiling young adult holding phone showing a balanced budget with gold rim lighting`
        }
      ]
    };
  }

  // 6. THRIFT / SECOND-HAND CLOTHES RESELLING
  if (topicLower.includes('thrift') || topicLower.includes('cloth') || topicLower.includes('wear') || topicLower.includes('okrika') || topicLower.includes('fashion')) {
    return {
      title: `${cleanTopic.slice(0, 60)} #Shorts`,
      category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
      theme: 'Small-Capital Business: Buying and Reselling Clean Second-Hand Clothes',
      angle: 'How to Start a Clothing Reselling Hustle With Under ₦15,000 ($10 USD)',
      hook: 'Buying neat second-hand clothes and selling them online is one of the easiest businesses to start with $10.',
      description: `Comprehensive step-by-step breakdown of how to start a thrift clothing reselling business with minimal starting capital.\n\n#Shorts #ThriftReselling #SmallBusiness #SideHustle #FashionHustle #MakeMoney`,
      tags: ["#Shorts", "#ThriftReselling", "#SmallBusiness", "#SideHustle", "#FashionHustle", "#MakeMoney"],
      estimatedBudget: '₦15,000 (~$10 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Curating and reselling clean vintage clothes online is one of the most accessible micro-businesses you can launch today with under ₦15,000 or approximately $10 USD.`,
          visual: `Cinematic 9:16 vertical 8k scene, aesthetic curated clothing rack with trendy vintage jackets in warm studio lighting`
        },
        {
          slideIndex: 1,
          text: `Head to your local wholesale thrift market early on market opening morning. Carefully inspect and handpick ten quality vintage shirts or graphic tees for about ₦800 to ₦1,000 ($0.60) each.`,
          visual: `Cinematic 9:16 vertical 8k shot, close-up of quality fabric selection with sharp focus and warm natural sunlight`
        },
        {
          slideIndex: 2,
          text: `Wash each item thoroughly with quality fragrant detergent, soften the fabric, and iron every collar crisply. Superior presentation is what transforms a regular thrift item into a premium vintage piece.`,
          visual: `Cinematic 9:16 vertical 8k shot, beautifully ironed stylish shirt hanging against a clean minimalist backdrop with soft shadows`
        },
        {
          slideIndex: 3,
          text: `Take clean, bright photos using natural morning sunlight against a plain neutral wall. Measure the exact chest and length dimensions so buyers know it fits perfectly without guessing.`,
          visual: `Cinematic 9:16 vertical 8k shot, smartphone camera screen snapping an aesthetic product photo with clean studio lighting`
        },
        {
          slideIndex: 4,
          text: `Post your photos on WhatsApp Status, Instagram, and TikTok with clear prices, setting each curated shirt at ₦2,500 to ₦3,000 (about $1.70 to $2.00 USD).`,
          visual: `Cinematic 9:16 vertical 8k shot, clean social media product showcase post with customer inquiries appearing in notifications`
        },
        {
          slideIndex: 5,
          text: `Selling all ten curated shirts brings in ₦25,000 to ₦30,000 ($17 to $20 USD). After subtracting your ₦10,000 inventory cost and detergent, your estimated gross profit is ₦15,000 ($10 USD).`,
          visual: `Cinematic 9:16 vertical 8k shot, clean financial balance calculation showing startup costs versus gross profit margins`
        },
        {
          slideIndex: 6,
          text: `Do not spend your initial profit on personal items. Reinvest the entire ₦25,000 into buying twenty-five quality shirts on your next wholesale trip to systematically scale your inventory.`,
          visual: `Cinematic 9:16 vertical 8k shot, young fashion entrepreneur packing stylish orders into neat kraft paper bags with gold seal`
        },
        {
          slideIndex: 7,
          text: `Start with what you have, build your client base patiently, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, thriving small fashion studio with packaged orders ready for dispatch in golden ambient light`
        }
      ]
    };
  }

  // 7. DEFAULT PRACTICAL BUSINESS BLUEPRINT (SNACK RESELLING / MICRO-STARTUP)
  return {
    title: `${cleanTopic.slice(0, 60)} #Shorts`,
    category: arch.category,
    theme: arch.theme,
    angle: arch.angle,
    hook: arch.hookPatterns[0],
    description: `Comprehensive step-by-step practical breakdown of ${arch.theme}.\n\n#Shorts #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy`,
    tags: ["#Shorts", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy"],
    estimatedBudget: arch.targetBudget,
    slides: [
      {
        slideIndex: 0,
        text: `If you have ${arch.targetBudget} in your pocket today, you do not need millions in venture funding or complicated equipment to start generating honest daily cash flow.`,
        visual: `Cinematic 9:16 vertical 8k photorealistic scene, modern minimalist desk, emerald and gold rim lighting, dark obsidian slate backdrop`
      },
      {
        slideIndex: 1,
        text: `The biggest mistake aspiring entrepreneurs make is waiting months for massive capital instead of testing simple, high-demand products or local services that solve immediate everyday problems.`,
        visual: `Cinematic 9:16 vertical 8k shot, entrepreneur evaluating budget options on mobile phone screen, crisp depth of field`
      },
      {
        slideIndex: 2,
        text: `Always monitor your cash velocity. Cash velocity means how fast your starting money goes out to buy supplies and comes back into your hands with added profit attached.`,
        visual: `Cinematic 9:16 vertical 8k shot, clean financial calculator diagram with glowing emerald growth curves`
      },
      {
        slideIndex: 3,
        text: `Calculate your unit margins precisely before launching. Profit margin is the extra money remaining after deducting wholesale inventory costs, packaging, and delivery expenses.`,
        visual: `Cinematic 9:16 vertical 8k shot, practical micro-business supply inventory in high-contrast studio setting`
      },
      {
        slideIndex: 4,
        text: `Keep your business operating costs as close to zero as possible. Use your existing smartphone, reach local customers through free social media groups, and deliver orders personally to save fees.`,
        visual: `Cinematic 9:16 vertical 8k shot, modern entrepreneur fulfilling local customer orders efficiently`
      },
      {
        slideIndex: 5,
        text: `Strictly separate your business cash from your personal living expenses. Opening a dedicated digital account prevents personal emergencies from draining your working startup capital.`,
        visual: `Cinematic 9:16 vertical 8k shot, modern disciplined entrepreneur managing separated business and personal digital accounts`
      },
      {
        slideIndex: 6,
        text: `Reinvest eighty percent of your profits back into growing your inventory each week. Compounding small daily profits is how a micro-hustle expands into a durable enterprise.`,
        visual: `Cinematic 9:16 vertical 8k shot, visual compounding chart showing small daily profits reinvested into business expansion`
      },
      {
        slideIndex: 7,
        text: `Start small, stay disciplined, manage your cash flow carefully, and ${resolvedOutro}`,
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

