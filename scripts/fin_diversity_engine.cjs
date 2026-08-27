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

  const systemPrompt = `You are the lead financial educator and YouTube Shorts director for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).

MANDATORY RULES & CONTENT STANDARDS:
1. NEVER USE BIG OR COMPLICATED GRAMMAR (5TH-GRADE READING LEVEL):
   - Use simple, everyday words that a young student, kid, or complete beginner can understand immediately.
   - If you mention any financial concept (like "Inflation", "APR", "Gross Profit", "Emergency Fund", "Debt", "Compound Interest"), you MUST explain it immediately in plain, friendly words.
   - Example: "Inflation means market prices go up while your pocket money stays the same."
   - Example: "Profit is the extra money you keep after paying for your supplies."
2. NEVER BEHAVE AS A FINANCIAL GURU OR PROMISE WEALTH:
   - Do NOT promise or guarantee income, profit, or instant wealth.
   - ALWAYS use honest, measured language: "potential income", "estimated profit", "results vary", "possible startup costs".
   - The viewer must leave thinking: "I learned something practical, realistic, and risk-aware."
3. GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
   - Whenever mentioning money or budget amounts, seamlessly include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents.
   - Examples: "₦5,000 (about $3.50 USD)", "₦20,000 (around $13.50 USD)", "$10 (approx. ₦15,000)".
4. NATURAL SPEECH LENGTH (22-28 SPOKEN WORDS PER SLIDE):
   - Write exactly 22 to 28 spoken words per slide (around 2 complete, easy-to-read spoken sentences).
   - This ensures a steady, relaxed 10 to 11 seconds of continuous spoken voiceover per slide.
5. STRICT 6-SLIDE NARRATIVE COHESION (THE 6-STEP ARC):
   - Slide 0 (The Opening Hook): Direct question or statement naming the situation/budget in dual currency ($ / ₦).
   - Slide 1 (The Common Mistake): Explain the trap beginners fall into and why they lose money.
   - Slide 2 (The Simple Rule Explained): The main principle explained in super simple words.
   - Slide 3 (The Easy Math): A real, simple supply cost and profit calculation.
   - Slide 4 (Protecting Your Cash): How to avoid losing money or getting scammed.
   - Slide 5 (Closing Takeaway & Outro): A final friendly advice + "${resolvedOutro}".
6. ANTI-DUPLICATION MANDATE:
   - Recently covered titles: [${recentTitles || 'None'}]. Do NOT duplicate these topics or angles.
7. UNIFIED 9:16 VERTICAL VISUAL STYLE:
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
      "text": "Opening hook addressing the small budget in simple words with USD and Naira (22-28 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald and gold ambient rim light..."
    },
    {
      "slideIndex": 1,
      "text": "The hidden trap or mistake beginners make explained with simple everyday words (22-28 words)...",
      "visual": "Matching 9:16 vertical 8k shot with consistent emerald/gold color palette and sharp depth of field..."
    },
    {
      "slideIndex": 2,
      "text": "The simple financial rule explained with an easy everyday definition (22-28 words)...",
      "visual": "Matching 9:16 vertical shot, clean financial interface or business supply setup..."
    },
    {
      "slideIndex": 3,
      "text": "Concrete pricing, startup cost, or profit margin breakdown in simple math (22-28 words)...",
      "visual": "Matching 9:16 vertical shot, clear visual breakdown chart with high-contrast text..."
    },
    {
      "slideIndex": 4,
      "text": "The practical takeaway on how to protect your hard-earned cash (22-28 words)...",
      "visual": "Matching 9:16 vertical shot, confident modern entrepreneur in cinematic lighting..."
    },
    {
      "slideIndex": 5,
      "text": "Final punchy rule + '${resolvedOutro}' (22-28 words)...",
      "visual": "Matching 9:16 vertical shot, clean modern studio resolution with subtle logo watermark..."
    }
  ]
}`;

  const userPrompt = `Generate a brand new, highly practical Finance & Small-Business Short storyboard for Slot ${slotIndex + 1}.
Theme: "${archetype.theme}". Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
Use very simple, easy-to-understand words. Explain any difficult terms on the spot. Write 22-28 words per slide. Avoid previous titles: [${recentTitles || 'None'}]. Ensure realistic calculations with dual $ / ₦ context. Output strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic fallback storyboard synthesis if AI providers are unreachable.
 * Dynamically synthesizes topic-specific, highly tailored 6-slide storyboards
 * with unique scripts, dual-currency math, and matching visual prompts for every category.
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
      description: `The real danger of quick loan apps and how high interest rates trap everyday people in endless debt.\n\n#Shorts #PersonalFinance #LoanApps #DebtFree #MoneyTips #FinancialLiteracy`,
      tags: ["#Shorts", "#PersonalFinance", "#LoanApps", "#DebtFree", "#MoneyTips", "#FinancialLiteracy"],
      estimatedBudget: 'Financial Protection ($0)',
      slides: [
        {
          slideIndex: 0,
          text: `Have you ever wondered why quick loan apps give you instant money in five minutes without asking for any collateral or proof of salary?`,
          visual: `Cinematic 9:16 vertical 8k shot, smartphone screen displaying instant loan approved notification with warning glowing amber highlights`
        },
        {
          slideIndex: 1,
          text: `Here is the hidden trap: If you borrow ₦10,000 and they charge you ₦3,500 fee in just two weeks, that is not a small fee — that is 35 percent every fourteen days.`,
          visual: `Cinematic 9:16 vertical 8k visual breakdown chart showing small loan amount overshadowed by huge red repayment penalties`
        },
        {
          slideIndex: 2,
          text: `When you miss the deadline by just one day, predatory apps often start calling everyone in your phone contacts and texting shameful messages to force you to pay.`,
          visual: `Cinematic 9:16 vertical 8k shot, cyber security shield on modern mobile interface alerting user to unauthorized phone permissions`
        },
        {
          slideIndex: 3,
          text: `Before you click accept on any mobile loan app, always check the exact repayment date and total fees. If the interest is higher than five percent, do not take it.`,
          visual: `Cinematic 9:16 vertical 8k close-up, sharp financial checklist on clean desk with calculator and emerald approval checkmark`
        },
        {
          slideIndex: 4,
          text: `Instead of borrowing for daily food or transport, build a tiny emergency fund of ₦5,000 or about $3.50 so you never have to borrow to survive.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean transparent savings jar with neatly organized dollar and naira bills on dark slate desk`
        },
        {
          slideIndex: 5,
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
      description: `3 valuable digital skills you can learn and offer with just a smartphone and internet connection.\n\n#Shorts #DigitalSkills #MakeMoneyOnline #SideHustle #PhoneIncome #Freelancing`,
      tags: ["#Shorts", "#DigitalSkills", "#MakeMoneyOnline", "#SideHustle", "#PhoneIncome", "#Freelancing"],
      estimatedBudget: '$0 (Phone & Internet Only)',
      slides: [
        {
          slideIndex: 0,
          text: `You do not need an expensive laptop or millions of cash to earn money online in 2026. If you have a smartphone, you already have the tool.`,
          visual: `Cinematic 9:16 vertical 8k scene, hands holding a sleek smartphone displaying a video editing timeline with emerald and gold ambient light`
        },
        {
          slideIndex: 1,
          text: `The first high-demand skill is vertical video editing using free mobile apps like CapCut. Local businesses and creators will happily pay you $10 or ₦15,000 per video.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean screen recording view of mobile video cutting and dynamic captions on modern smartphone`
        },
        {
          slideIndex: 2,
          text: `The second skill is simple social media flyer design using Canva. Small shop owners need daily product posters and WhatsApp status designs to attract customers.`,
          visual: `Cinematic 9:16 vertical 8k shot, colorful modern promotional product flyer template being customized on mobile canvas`
        },
        {
          slideIndex: 3,
          text: `The third skill is writing short sales captions. Help busy shop owners write clear WhatsApp broadcast messages that describe their products and prices clearly.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean messaging interface showing customer orders coming in through clear promotional text`
        },
        {
          slideIndex: 4,
          text: `Spend just thirty minutes every evening watching free tutorials on YouTube. Practice creating three sample designs before messaging local shop owners.`,
          visual: `Cinematic 9:16 vertical 8k shot, organized student workspace with notebook, phone on tripod, and warm ambient lighting`
        },
        {
          slideIndex: 5,
          text: `Turn your screen time into daily income, and ${resolvedOutro}`,
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
      description: `How to spot fake investment schemes and protect your hard-earned money from Ponzi traps.\n\n#Shorts #ScamAlert #ProtectYourMoney #FinancialLiteracy #PersonalFinance`,
      tags: ["#Shorts", "#ScamAlert", "#ProtectYourMoney", "#FinancialLiteracy", "#PersonalFinance"],
      estimatedBudget: 'Capital Protection ($0)',
      slides: [
        {
          slideIndex: 0,
          text: `If anyone messages you promising guaranteed thirty percent weekly profit with zero risk, do not send one dime. It is one hundred percent a scam.`,
          visual: `Cinematic 9:16 vertical 8k scene, high-contrast security warning aesthetic with glowing red-amber caution icon and dark slate background`
        },
        {
          slideIndex: 1,
          text: `Real businesses and banks only make small realistic returns over months. No legitimate investment can double your cash in seven days out of thin air.`,
          visual: `Cinematic 9:16 vertical 8k shot, comparison chart showing realistic bank interest versus fake unrealistic scam spike`
        },
        {
          slideIndex: 2,
          text: `Watch out for high referral pressure. If an app forces you to bring three new people before you can withdraw your own money, it is a collapsing Ponzi scheme.`,
          visual: `Cinematic 9:16 vertical 8k shot, digital network diagram collapsing in red warnings with security lock engaging`
        },
        {
          slideIndex: 3,
          text: `Never invest money into any platform that has no verified government registration, no clear office address, and only accepts anonymous crypto or gift cards.`,
          visual: `Cinematic 9:16 vertical 8k shot, official financial regulatory license and padlock verification badge on clean digital tablet`
        },
        {
          slideIndex: 4,
          text: `Always remember: It is far better to protect your ₦10,000 or $7 than to lose everything chasing fast, fake profits that do not exist.`,
          visual: `Cinematic 9:16 vertical 8k shot, secure digital bank vault interface glowing with emerald green protective shields`
        },
        {
          slideIndex: 5,
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
      description: `What inflation is in simple language and how to protect your savings from losing purchasing power.\n\n#Shorts #Inflation #FinancialEducation #MoneyTips #Economics #Savings`,
      tags: ["#Shorts", "#Inflation", "#FinancialEducation", "#MoneyTips", "#Economics", "#Savings"],
      estimatedBudget: '₦50,000 (~$35 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Keeping idle cash under your mattress or in a zero-interest account quietly steals your purchasing power every single year. Here is why.`,
          visual: `Cinematic 9:16 vertical 8k scene, visual comparison of a full grocery basket in 2020 versus half-empty basket today on dark slate counter`
        },
        {
          slideIndex: 1,
          text: `Inflation simply means market prices go up while your cash note stays the same. If ₦5,000 bought two bags of rice before, today it might only buy one.`,
          visual: `Cinematic 9:16 vertical 8k shot, sleek price comparison chart with clean typography showing purchasing power trend over time`
        },
        {
          slideIndex: 2,
          text: `Your bank balance number did not decrease, but the amount of food, clothes, and fuel that money can actually purchase got smaller.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean smartphone banking screen showing balance beside real-world commodity costs`
        },
        {
          slideIndex: 3,
          text: `To protect your savings, do not leave extra money sitting idle. Put your long-term funds into income-producing assets, valuable skills, or stable dollar assets.`,
          visual: `Cinematic 9:16 vertical 8k shot, glowing emerald growth asset allocation diagram with gold accents on obsidian background`
        },
        {
          slideIndex: 4,
          text: `Even saving in digital dollars like USDT can help protect your savings if your local currency is falling in value against the US dollar.`,
          visual: `Cinematic 9:16 vertical 8k shot, secure digital dollar stablecoin wallet on modern smartphone screen`
        },
        {
          slideIndex: 5,
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
      description: `How to budget small money so it lasts all month without running broke before payday.\n\n#Shorts #Budgeting #MoneyManagement #PersonalFinance #SavingMoney #SalaryTips`,
      tags: ["#Shorts", "#Budgeting", "#MoneyManagement", "#PersonalFinance", "#SavingMoney", "#SalaryTips"],
      estimatedBudget: '₦20,000 (~$13.50 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Why does your money disappear three days after getting paid? The problem is not how much you earn — it is having zero budget structure.`,
          visual: `Cinematic 9:16 vertical 8k scene, young adult reviewing monthly expense spreadsheet on smartphone with dark emerald ambient glow`
        },
        {
          slideIndex: 1,
          text: `Here is the simple 50-30-20 rule: Take fifty percent of your income for must-have survival needs like basic food, rent, and daily transport.`,
          visual: `Cinematic 9:16 vertical 8k shot, clean pie chart visual breakdown showing fifty percent allocated to essentials in gold and emerald`
        },
        {
          slideIndex: 2,
          text: `Take thirty percent for your personal wants and small lifestyle items. This gives you freedom to enjoy life without feeling guilty or starving.`,
          visual: `Cinematic 9:16 vertical 8k shot, thirty percent lifestyle allocation section highlighted clearly on clean budget app interface`
        },
        {
          slideIndex: 3,
          text: `Most importantly, lock away the remaining twenty percent immediately for your future savings and emergency fund before you spend a single coin.`,
          visual: `Cinematic 9:16 vertical 8k shot, locked digital vault icon representing twenty percent emergency savings growing steadily`
        },
        {
          slideIndex: 4,
          text: `If you earn ₦20,000 or about $13.50, that means saving ₦4,000 ($2.70) every single month without fail. Small habits build big stability.`,
          visual: `Cinematic 9:16 vertical 8k shot, clear cash allocation envelopes neatly labeled Needs, Wants, and Savings on wooden desk`
        },
        {
          slideIndex: 5,
          text: `Take control of your cash flow today, and ${resolvedOutro}`,
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
      description: `Step-by-step breakdown of how to start a thrift clothing reselling business with minimal capital.\n\n#Shorts #ThriftReselling #SmallBusiness #SideHustle #FashionHustle #MakeMoney`,
      tags: ["#Shorts", "#ThriftReselling", "#SmallBusiness", "#SideHustle", "#FashionHustle", "#MakeMoney"],
      estimatedBudget: '₦15,000 (~$10 USD)',
      slides: [
        {
          slideIndex: 0,
          text: `Buying neat second-hand clothes and reselling them online is one of the easiest micro businesses you can start with under ₦15,000 or $10 USD.`,
          visual: `Cinematic 9:16 vertical 8k scene, aesthetic curated clothing rack with trendy vintage jackets in warm studio lighting`
        },
        {
          slideIndex: 1,
          text: `Go to your local wholesale market early in the morning. Handpick ten clean vintage shirts or tops for about ₦800 to ₦1,000 ($0.60) each.`,
          visual: `Cinematic 9:16 vertical 8k shot, close-up of quality fabric selection with sharp focus and warm natural sunlight`
        },
        {
          slideIndex: 2,
          text: `Wash them thoroughly with fragrant detergent and iron them crisply. Good presentation is what turns a regular item into a premium vintage piece.`,
          visual: `Cinematic 9:16 vertical 8k shot, beautifully ironed stylish shirt hanging against a clean minimalist backdrop with soft shadows`
        },
        {
          slideIndex: 3,
          text: `Take clear photos using natural morning sunlight. Post them on WhatsApp status and Instagram with exact sizes, pricing each shirt at ₦2,500 ($1.70).`,
          visual: `Cinematic 9:16 vertical 8k shot, smartphone camera screen snapping an aesthetic product photo with clean studio lighting`
        },
        {
          slideIndex: 4,
          text: `Selling all ten shirts brings in ₦25,000 ($17). After deducting your ₦10,000 cost, your estimated gross profit is ₦15,000 ($10 USD).`,
          visual: `Cinematic 9:16 vertical 8k shot, clean financial balance calculation showing startup costs versus gross profit margins`
        },
        {
          slideIndex: 5,
          text: `Reinvest your profit into buying twenty shirts next round, and ${resolvedOutro}`,
          visual: `Cinematic 9:16 vertical 8k shot, young fashion entrepreneur packing stylish orders into neat kraft paper bags with gold seal`
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
    description: `Practical step-by-step breakdown of ${arch.theme}.\n\n#Shorts #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy`,
    tags: ["#Shorts", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy"],
    estimatedBudget: arch.targetBudget,
    slides: [
      {
        slideIndex: 0,
        text: `If you only have ${arch.targetBudget} in your pocket today, you do not need millions of cash to start making honest daily income.`,
        visual: `Cinematic 9:16 vertical 8k photorealistic scene, modern minimalist desk, emerald and gold rim lighting, dark obsidian slate backdrop`
      },
      {
        slideIndex: 1,
        text: `The biggest mistake most beginners make is waiting around for huge money instead of testing small, simple services that people need right now in their neighborhood.`,
        visual: `Cinematic 9:16 vertical 8k shot, entrepreneur evaluating budget options on mobile phone screen, crisp depth of field`
      },
      {
        slideIndex: 2,
        text: `Always watch your cash flow. Cash flow simply means the money coming into your hand versus the money leaving your pocket every single day.`,
        visual: `Cinematic 9:16 vertical 8k shot, clean financial calculator diagram with glowing emerald growth curves`
      },
      {
        slideIndex: 3,
        text: `Check your profit margins before selling. Profit is the extra cash left over after buying your supplies, like spending $2 on items and selling for $5.`,
        visual: `Cinematic 9:16 vertical 8k shot, practical micro-business supply inventory in high-contrast studio setting`
      },
      {
        slideIndex: 4,
        text: `Never mix your personal pocket money with your business cash. Keep your business money separate so emergency expenses do not eat up your startup capital.`,
        visual: `Cinematic 9:16 vertical 8k shot, modern disciplined entrepreneur managing digital accounts`
      },
      {
        slideIndex: 5,
        text: `Start small, be patient, keep your costs low, and ${resolvedOutro}`,
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

