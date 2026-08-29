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
 * DUAL GLOBAL/LOCAL CURRENCY FORMAT:
 * Formats financial sums seamlessly for both global (USD $) and local (₦ Naira) audiences,
 * e.g., "₦5,000 (about $3.50 USD)" or "$10 (around ₦15,000)".
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Local history cache file
const LOCAL_FIN_HISTORY_CACHE = path.join(process.cwd(), 'daily_fin_history_cache.json');
const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');

// Firestore credentials
const FIRESTORE_PROJECT_ID = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';
const FIRESTORE_API_KEY = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

/**
 * Format a complete, viral YouTube Shorts title with high-CTR trending hashtags
 * Ensures NO mid-word cutoffs, NO incomplete sentences, and fits within YouTube's 100-char limit.
 */
function formatViralShortsTitle(rawHeadline, nicheOrCategory = 'fin', isDeepDive = false) {
  if (!rawHeadline) rawHeadline = 'High Impact Daily Blueprint';
  
  // 1. Clean raw title from markdown, thinking blocks, code quotes, etc.
  let headline = String(rawHeadline)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .replace(/[<>|:]/g, ' - ')
    .replace(/[{}[\]]/g, '')
    .replace(/#\w+/g, '') // remove existing loose hashtags to rebuild systematically
    .replace(/\s+/g, ' ')
    .trim();

  // If long-form / deep-dive (15-20 min masterclass), no #Shorts hashtag
  if (isDeepDive) {
    if (headline.length > 90) {
      const trimmed = headline.slice(0, 88);
      const lastSpace = trimmed.lastIndexOf(' ');
      headline = (lastSpace > 30 ? trimmed.slice(0, lastSpace) : trimmed).trim();
    }
    headline = headline.replace(/[\s\-,;:]+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are)?$/i, '').trim();
    return headline;
  }

  // 2. Select curated viral & trending hashtags for this niche
  const lower = (nicheOrCategory || '').toLowerCase();
  let tagPool = [];
  if (lower.includes('fin') || lower.includes('money') || lower.includes('business') || lower.includes('wealth')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#money', '#finance', '#wealth', '#business', '#fyp'];
  } else if (lower.includes('stoic') || lower.includes('mind') || lower.includes('discipline') || lower.includes('motivation')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#stoic', '#mindset', '#discipline', '#motivation', '#fyp'];
  } else if (lower.includes('tech') || lower.includes('ai') || lower.includes('code') || lower.includes('developer')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#ai', '#tech', '#coding', '#developer', '#fyp'];
  } else {
    tagPool = ['#Shorts', '#viral', '#trending', '#fyp', '#explore'];
  }

  // Mandatory primary viral tags
  const coreTags = ['#Shorts', '#viral', '#trending'];
  const extraTags = tagPool.filter(t => !coreTags.includes(t));

  // Max headline length should leave room for at least "#Shorts #viral #trending" (25 chars + space = 26)
  // Max YouTube title limit is 100 characters. So max headline target is ~68 chars.
  if (headline.length > 68) {
    const trimmed = headline.slice(0, 68);
    const lastSpace = trimmed.lastIndexOf(' ');
    headline = (lastSpace > 25 ? trimmed.slice(0, lastSpace) : trimmed).trim();
  }

  // Clean trailing connector words or punctuation to guarantee a complete phrase
  headline = headline
    .replace(/[,\-;:–—]+$/, '')
    .replace(/\s+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are|your|their|that)\s*$/i, '')
    .replace(/[,\-;:–—]+$/, '')
    .trim();

  // 3. Greedily append hashtags up to 98 chars total
  let finalTitle = headline;
  const allTagsToTry = [...coreTags, ...extraTags];
  
  for (const tag of allTagsToTry) {
    if ((finalTitle + ' ' + tag).length <= 98) {
      finalTitle += ' ' + tag;
    }
  }

  return finalTitle;
}

// 10 Core Content Pillars
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

// 8 Distinct Rotating Hook Frameworks (Intro formats)
const ROTATING_FIN_HOOK_TEMPLATES = [
  {
    id: 'contrarian_myth_buster',
    name: 'Contrarian Myth Buster',
    formula: 'Stop doing [Common Habit] immediately if you want [Outcome]. Here is why 90% of people stay broke...',
    generateHook: (theme, budget) => `Stop saving cash under your mattress if you want financial freedom. Here is the harsh mathematical truth...`
  },
  {
    id: 'shocking_stat_math',
    name: 'Shocking Statistic / Mathematical Contrast',
    formula: '90% of beginners lose money doing X, while the top 1% use this exact formula with only [Budget]...',
    generateHook: (theme, budget) => `90% of beginners lose their money within 30 days, while smart builders turn ${budget} into daily cash flow with this rule...`
  },
  {
    id: 'direct_emergency_scenario',
    name: 'Direct Emergency Scenario',
    formula: 'If you have only [Budget] left in your bank account today, here is the exact protocol to execute before tomorrow...',
    generateHook: (theme, budget) => `If you have only ${budget} left to your name today, do not panic. Here is the exact protocol to execute before sunset...`
  },
  {
    id: 'curiosity_gap_trap',
    name: 'Curiosity Gap / The Silent Money Trap',
    formula: 'There is a silent money trap draining your account every month that banks will never warn you about...',
    generateHook: (theme, budget) => `There is a silent money leak draining your pockets every single week that nobody ever warned you about...`
  },
  {
    id: 'iron_rule_law',
    name: 'The Iron Rule / First Law',
    formula: 'Rule number one of [Theme]: If you do not master this first, every dollar you earn will disappear...',
    generateHook: (theme, budget) => `Rule number one of building wealth: If you do not master this fundamental habit, every dollar or naira you earn will disappear...`
  },
  {
    id: 'step_by_step_challenge',
    name: '45-Second Action Challenge',
    formula: 'Give me 45 seconds, and I will show you how to turn [Problem] into [Outcome] with zero upfront gear...',
    generateHook: (theme, budget) => `Give me 45 seconds, and I will show you how to launch a legitimate income stream with only ${budget}...`
  },
  {
    id: 'story_case_study',
    name: 'Realistic Micro Case Study',
    formula: 'A beginner with zero starting capital and just a mobile phone used this exact blueprint to generate daily cash...',
    generateHook: (theme, budget) => `A beginner with zero prior experience started with just a smartphone and ${budget}. Here is the exact blueprint they used...`
  },
  {
    id: 'question_pivot',
    name: 'Provocative Question & Pivot',
    formula: 'Why do most hardworking people stay broke? It is not lack of effort—it comes down to this single flaw...',
    generateHook: (theme, budget) => `Why do most people work 50 exhausting hours a week and still end up broke? It is not lack of effort—it is this single flaw...`
  }
];

// 10 Distinct Rotating Outro & Infinite Loop Formats (Outro formats)
const ROTATING_FIN_OUTROS = [
  {
    id: 'question_reversal',
    template: (handle) => `Save this video and follow ${handle}, because the single smartest question you can ask right now is...`
  },
  {
    id: 'first_principle',
    template: (handle) => `Tap follow on ${handle} for daily practical blueprints, and never forget that everything starts with rule number one...`
  },
  {
    id: 'silent_trap',
    template: (handle) => `Follow ${handle} to protect your money, because the single biggest mistake beginners make before starting is...`
  },
  {
    id: 'action_origin',
    template: (handle) => `Share this with a friend and follow ${handle}, because your financial transformation begins the exact second you ask...`
  },
  {
    id: 'reverse_psychology',
    template: (handle) => `Most people will scroll past this and stay broke, but disciplined builders follow ${handle} and immediately remember that...`
  },
  {
    id: 'foundation_recall',
    template: (handle) => `Follow ${handle} for real-world money mastery, because when you have zero cash in your pocket, your first move is...`
  },
  {
    id: 'critical_inquiry',
    template: (handle) => `Subscribe to ${handle} for daily financial clarity, and before you spend another single naira or dollar, ask yourself...`
  },
  {
    id: 'mathematical_truth',
    template: (handle) => `Follow ${handle} to build genuine wealth, because the math never lies, especially when it comes to...`
  },
  {
    id: 'discipline_contract',
    template: (handle) => `Lock in your financial discipline with ${handle}, because escaping the paycheck-to-paycheck cycle always begins with...`
  },
  {
    id: 'algorithmic_repeat',
    template: (handle) => `Watch this again and follow ${handle}, because the most profitable secret hidden inside this blueprint is...`
  }
];

// 25+ Comprehensive Diverse Financial Archetypes
const FIN_ARCHETYPES = [
  {
    id: 'fin_01_snack_reselling',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Snack & Micro-Item Reselling',
    angle: 'How to Turn ₦5,000 ($3.50 USD) into Daily Cash Flow Reselling Bottled Drinks and Snacks',
    targetBudget: '₦5,000 (~$3.50 USD)',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Crisp cinematic 9:16 vertical 8k scene, aesthetic wooden market stall, emerald green and gold rim lighting, dark obsidian slate backdrop'
  },
  {
    id: 'fin_02_budgeting_50_30_20',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'The 50/30/20 Budgeting Rule for Small Incomes',
    angle: 'How to Budget ₦20,000 ($13.50 USD) So Your Money Lasts the Entire Month Without Debt',
    targetBudget: '₦20,000 (~$13.50 USD)',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Clean high-contrast smartphone budgeting interface, warm studio lighting with dark slate background, clear typography, financial stability aesthetic'
  },
  {
    id: 'fin_03_inflation_purchasing_power',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Inflation & Why Saved Cash Loses Value',
    angle: 'What Inflation Actually Means for Your ₦50,000 ($35 USD) Bank Savings & 2 Ways to Protect It',
    targetBudget: '₦50,000 (~$35 USD)',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Sleek financial diagram, purchasing power comparison chart, obsidian black background with emerald and gold accents, 9:16 vertical 8k'
  },
  {
    id: 'fin_04_phone_video_editing',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Phone-Only Vertical Video Editing (CapCut)',
    angle: 'How to Earn Your First $15 (₦20,000) Editing Short-Form Videos Using Only Your Phone',
    targetBudget: '$0 (Phone & Internet Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Modern creator setup, smartphone with mobile video editor timeline, ambient cyan and gold backlight, crisp 35mm portrait lens'
  },
  {
    id: 'fin_05_ponzi_scam_red_flags',
    category: FIN_CATEGORIES.SCAM_AWARENESS,
    theme: 'Spotting Investment Scams & Ponzi Schemes',
    angle: '4 Immediate Red Flags of Fake High-Yield Investment Schemes Before You Lose Your Capital',
    targetBudget: 'Capital Protection ($0)',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'High-contrast security and warning aesthetic, deep charcoal and red-amber accent lighting, sleek digital shield motif, 9:16 vertical 8k'
  },
  {
    id: 'fin_06_thrift_clothing_flipping',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Second-Hand / Thrift Clothing Flipping',
    angle: 'How to Start a Curated Vintage Clothing Hustle With Under ₦15,000 ($10 USD)',
    targetBudget: '₦15,000 (~$10 USD)',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Aesthetic curated vintage clothing rack, smartphone product photoshoot setup, warm sunlight and tungsten studio lighting, 9:16 vertical 8k'
  },
  {
    id: 'fin_07_stablecoins_usdt_explained',
    category: FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO,
    theme: 'Digital Dollar (USDT) Savings & Devaluation Defense',
    angle: 'What Are Digital Dollars (USDT) and How Do Ordinary People Use Them to Hedge Inflation?',
    targetBudget: 'Any Budget ($1+ / ₦1,500+)',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Futuristic clean financial interface, glowing emerald and gold crypto tokens on dark obsidian slate, sleek 3D perspective, 9:16 vertical 8k'
  },
  {
    id: 'fin_08_free_google_certs',
    category: FIN_CATEGORIES.FREE_OPPORTUNITIES,
    theme: 'Free Big Tech Career Certifications',
    angle: '3 Completely Free Tech Certifications From Google and Microsoft You Can Finish on Your Phone',
    targetBudget: '$0 (100% Free)',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Modern digital certificate interface, glowing green verified badge, modern study desk, crisp cinematic lighting, 9:16 vertical 8k'
  },
  {
    id: 'fin_09_compound_interest_dollar_day',
    category: FIN_CATEGORIES.FINANCIAL_CALCULATORS,
    theme: 'The Compounding Math of Saving $1 (₦1,500) Daily',
    angle: 'The Real Math of What Happens When You Save Just $1 or ₦1,500 Every Single Day for 5 Years',
    targetBudget: '$1/day (₦1,500/day)',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Exponential growth chart visualization, glowing green compounding curve on sleek dark glass, 9:16 vertical 8k cinematic studio shot'
  },
  {
    id: 'fin_10_loan_apps_apr_danger',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Quick Mobile Loan Apps & Hidden High Fees',
    angle: 'The Hidden Math Behind Quick Loan Apps: Why a 30% Two-Week Fee Will Trap You in Debt',
    targetBudget: 'Financial Defense',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Digital smartphone loan interface warning breakdown, dramatic moody slate lighting with red and gold highlights, 9:16 vertical 8k'
  },
  {
    id: 'fin_11_emergency_fund_buffer',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Building Your First ₦10,000 ($7 USD) Safety Buffer',
    angle: 'How to Build a ₦10,000 ($7 USD) Emergency Fund When You Live on a Low Income',
    targetBudget: '₦10,000 (~$7 USD)',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Clean locked digital vault concept, warm emerald rim lighting, modern glass aesthetic, 9:16 vertical 8k cinematic'
  },
  {
    id: 'fin_12_freelance_whatsapp_catalogs',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Setting Up Digital WhatsApp Catalogs for Local Shops',
    angle: 'How to Charge Local Retailers ₦10,000 ($7 USD) to Digitize Their Inventory on WhatsApp',
    targetBudget: '$0 (Phone Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Smartphone screen showing clean mobile business catalog with incoming customer orders, warm gold lighting'
  },
  {
    id: 'fin_13_unit_economics_pricing',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    theme: 'Unit Economics: Cost per Unit vs Selling Price',
    angle: 'Why Most Small Businesses Fail: The Missing Unit Economics Formula Explained in Plain English',
    targetBudget: 'Business Mechanics',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'Clear financial unit cost balance ledger on tablet screen, emerald profit margin curves, 9:16 vertical 8k'
  },
  {
    id: 'fin_14_high_yield_vaults_vs_banks',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Fintech High-Yield Vaults vs Traditional Bank Accounts',
    angle: 'Why Traditional Banks Pay 1% While Fintech Digital Vaults Pay 15% APY Interest',
    targetBudget: '₦5,000+ ($3.50+ USD)',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Comparative high-contrast digital vault metrics glowing emerald against standard low bank ledger, 9:16 vertical'
  },
  {
    id: 'fin_15_ai_flyer_design_service',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'AI-Powered Business Flyer Design with Free Tools',
    angle: 'How to Create Professional Marketing Flyers for Local Churches and Businesses Using Free AI Tools',
    targetBudget: '$0 (Free AI Tools)',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Hands crafting sleek promotional flyers on tablet using modern AI design suite, vibrant lighting, 9:16 vertical'
  },
  {
    id: 'fin_16_micro_poultry_farming',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Small-Scale Backyard Poultry / Egg Logistics',
    angle: 'How to Start a Backyard Egg Distribution Route With Under ₦25,000 ($17 USD) Capital',
    targetBudget: '₦25,000 (~$17 USD)',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Clean organic farm crates with fresh farm eggs in morning golden sunlight, modern agricultural entrepreneur'
  },
  {
    id: 'fin_17_silent_subscription_audit',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'The 15-Minute Bank Statement & Airtime Leak Audit',
    angle: 'How to Find and Cut ₦15,000 ($10 USD) of Invisible Monthly Leaks from Your Bank Account',
    targetBudget: 'Cost Reduction ($0)',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Sharp financial audit checklist on dark sleek tablet with red expense cuts and green balance totals, 9:16 vertical'
  },
  {
    id: 'fin_18_cleaning_supplies_reselling',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Liquid Soap & Cleaning Chemical Formulation',
    angle: 'How to Produce and Bottle 20 Liters of Multi-Purpose Liquid Soap for Under ₦8,000 ($5.50 USD)',
    targetBudget: '₦8,000 (~$5.50 USD)',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Crystal clean bottled eco-friendly cleaning liquid with modern minimalist labels, warm bright studio lighting'
  },
  {
    id: 'fin_19_negotiation_skills_everyday',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    theme: 'Everyday Negotiation & Wholesale Purchasing Rules',
    angle: '3 Simple Negotiation Rules to Save 20% on Every Wholesale Market Purchase Without Being Aggressive',
    targetBudget: 'Smart Buying',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'Confident business person shaking hands in bustling modern marketplace, golden hour light, cinematic depth'
  },
  {
    id: 'fin_20_social_media_moderation',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'Remote WhatsApp & Instagram Community Management',
    angle: 'How to Get Paid ₦30,000 ($20 USD) Monthly to Manage Direct Messages for Busy Online Vendors',
    targetBudget: '$0 (Phone Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Smartphone display showing neatly answered client inquiries and confirmed deliveries in sleek dark UI'
  },
  {
    id: 'fin_21_pos_agent_cash_flow',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    theme: 'POS & Agency Banking Mechanics',
    angle: 'The Real Daily Math of Running a POS Agency Terminal: Terminal Costs, Float, and Daily Commission',
    targetBudget: '₦40,000 (~$27 USD)',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Modern POS terminal printing clean receipt with emerald transaction approved badge, high-contrast studio'
  },
  {
    id: 'fin_22_30_day_no_takeout_challenge',
    category: FIN_CATEGORIES.CHALLENGES_EXPERIMENTS,
    theme: 'The 30-Day Zero Impulse Spending Challenge',
    angle: 'What Happened When a Student Tracked Every Single ₦500 ($0.35 USD) Spent for 30 Days',
    targetBudget: 'Behavioral Reset',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Daily progress calendar with consecutive green checkmarks, minimalist wooden desk, warm morning glow'
  },
  {
    id: 'fin_23_freelance_resume_revamp',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    theme: 'ATS Resume & LinkedIn Optimization for Remote Jobs',
    angle: 'How to Fix Your Resume in 20 Minutes Using Free AI Tools to Pass Automated Job Filters',
    targetBudget: '$0 (Free AI)',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Modern sleek resume layout on computer screen with green 98% ATS match score, modern office backdrop'
  },
  {
    id: 'fin_24_micro_logistics_errand_service',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    theme: 'Campus & Neighborhood Micro-Errand Logistics',
    angle: 'How to Earn Daily Income Running Urgent Errand Deliveries for Busy Working Mothers and Professionals',
    targetBudget: '₦2,000 (~$1.40 USD Transport)',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Fast moving courier holding neatly sealed package with GPS route on smartphone, bright daylight city background'
  },
  {
    id: 'fin_25_separating_business_personal_cash',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    theme: 'Separating Business Capital From Personal Feeding Money',
    angle: 'The Fatal Mistake That Kills 80% of Micro-Businesses: Eating Your Startup Capital by Mistake',
    targetBudget: 'Discipline Rule',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Two distinct digital accounts displayed side by side: Business Working Float vs Personal Living Allowance'
  }
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
 * Resolve dynamic rotating outro for channel
 */
function resolveFinOutro(channelHandle = '@bones_ceo', seed = Math.random()) {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const index = Math.floor(Math.abs(seed) * ROTATING_FIN_OUTROS.length) % ROTATING_FIN_OUTROS.length;
  const outroObj = ROTATING_FIN_OUTROS[index];
  return outroObj.template(cleanHandle);
}

/**
 * Select a rotating hook format
 */
function selectFinHookFormat(slotIndex = 0, historyCount = 0) {
  const index = (slotIndex + historyCount + Math.floor(Math.random() * 3)) % ROTATING_FIN_HOOK_TEMPLATES.length;
  return ROTATING_FIN_HOOK_TEMPLATES[index];
}

/**
 * Fetch recent finance history from Firestore REST API and local cache
 */
async function fetchRecentFinHistoryFromFirestore(channelId = 'finance_business', limit = 35) {
  const historyItems = [];

  // 1. Check local manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item.title || item.topic) {
            historyItems.push({
              topic: item.topic || item.title,
              title: item.title || item.topic,
              theme: item.theme || item.title,
              angle: item.angle || '',
              createdAt: item.timestamp || item.createdAt || ''
            });
          }
        }
      }
    } catch {}
  }

  // 2. Check local fin cache file
  if (fs.existsSync(LOCAL_FIN_HISTORY_CACHE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(LOCAL_FIN_HISTORY_CACHE, 'utf8'));
      if (Array.isArray(cached)) {
        historyItems.push(...cached);
      }
    } catch {}
  }

  // 3. Fetch from Firestore REST API (content_history)
  if (FIRESTORE_API_KEY && FIRESTORE_PROJECT_ID) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/content_history?pageSize=${limit}&key=${FIRESTORE_API_KEY}`;
      const res = await new Promise((resolve) => {
        const req = https.get(url, { timeout: 6000 }, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => {
            if (resp.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, documents: j.documents || [] });
              } catch (e) { resolve({ success: false }); }
            } else { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
      });

      if (res.success && Array.isArray(res.documents)) {
        for (const doc of res.documents) {
          const fields = doc.fields || {};
          const item = {
            topic: fields.topic?.stringValue || fields.title?.stringValue || '',
            title: fields.title?.stringValue || fields.topic?.stringValue || '',
            theme: fields.theme?.stringValue || '',
            angle: fields.angle?.stringValue || '',
            createdAt: fields.createdAt?.stringValue || ''
          };
          if (item.topic) historyItems.push(item);
        }
      }
    } catch {}

    // 4. Fetch from Firestore saved_campaigns
    try {
      const campUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/saved_campaigns?pageSize=${limit}&key=${FIRESTORE_API_KEY}`;
      const campRes = await new Promise((resolve) => {
        const req = https.get(campUrl, { timeout: 6000 }, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => {
            if (resp.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, documents: j.documents || [] });
              } catch (e) { resolve({ success: false }); }
            } else { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
      });

      if (campRes.success && Array.isArray(campRes.documents)) {
        for (const doc of campRes.documents) {
          const fields = doc.fields || {};
          const title = fields.title?.stringValue || fields.topic?.stringValue || '';
          if (title) {
            historyItems.push({
              topic: title,
              title: title,
              theme: fields.theme?.stringValue || title,
              angle: fields.angle?.stringValue || '',
              createdAt: fields.createdAt?.stringValue || ''
            });
          }
        }
      }
    } catch {}
  }

  // Deduplicate history items
  const seen = new Set();
  const deduped = [];
  for (const h of historyItems) {
    const key = (h.topic || h.title || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }

  return deduped;
}

/**
 * Strict check if candidate topic matches or is too similar to recent history
 */
function isFinTopicSimilarToHistory(candidateTopic, candidateTheme, recentHistory = [], threshold = 0.50) {
  if (!candidateTopic) return true;
  const normCandidate = candidateTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const stopWords = new Set(['how', 'the', 'what', 'when', 'with', 'your', 'from', 'this', 'that', 'they', 'will', 'start', 'make', 'money', 'business', 'cash', 'daily', 'every', 'free', 'step', 'best', 'simple', 'real', 'naira', 'dollar', 'shorts']);

  const wordsCandidate = new Set(
    normCandidate.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  );

  const windowToCheck = recentHistory.slice(0, 30);

  for (const item of windowToCheck) {
    const prevText = ((item.topic || item.title || '') + ' ' + (item.theme || '')).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (normCandidate === prevText || prevText.includes(normCandidate) || normCandidate.includes(prevText)) {
      return true;
    }

    const wordsPrev = prevText.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    if (wordsCandidate.size > 0 && wordsPrev.length > 0) {
      let matches = 0;
      for (const w of wordsPrev) {
        if (wordsCandidate.has(w)) matches++;
      }
      const overlap = matches / Math.min(wordsCandidate.size, wordsPrev.length);
      if (overlap >= threshold) return true;
    }
  }

  return false;
}

/**
 * Pick an archetype that has NOT been used in recent history to prevent duplicate posts
 */
function selectDiverseFinArchetype(recentHistory = [], attemptOffset = 0) {
  const recentTitles = (recentHistory || []).map(h => ((h.title || h.topic || '') + ' ' + (h.theme || '')).toLowerCase());
  
  // Filter out any archetypes whose theme or id was used recently
  const unused = FIN_ARCHETYPES.filter(arch => {
    return !recentTitles.some(t => t.includes(arch.theme.toLowerCase()) || t.includes(arch.id.toLowerCase()) || t.includes(arch.angle.toLowerCase().slice(0, 20)));
  });

  const pool = unused.length > 0 ? unused : FIN_ARCHETYPES;
  const index = (Math.floor(Math.random() * pool.length) + attemptOffset) % pool.length;
  return pool[index];
}

/**
 * Build rich system and user prompts for finance LLM generation with rotating hook & outro formats
 */
function buildFinPromptForSlot(archetype, recentHistory = [], slotIndex = 0, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 20).map(h => `"${h.topic || h.title}"`).join(', ');
  
  const chosenHookFormat = selectFinHookFormat(slotIndex, recentHistory.length);
  const chosenOutro = resolveFinOutro(cleanHandle, slotIndex * 17 + Date.now());

  const systemPrompt = `You are the lead viral scriptwriter and financial educator for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 / ₦0 to ₦50,000).

CRITICAL YOUTUBE SHORTS ALGORITHM RETENTION RULES (32-42 SECONDS TOTAL):
1. RUNTIME & PACING: Exactly 6 high-impact slides (slideIndex 0 to 5). Each slide MUST have 18 to 25 punchy spoken words (110-140 words total).
2. SLIDE 0 (ANTI-SWIPE HOOK): Use the '${chosenHookFormat.name}' format! Formula: "${chosenHookFormat.formula}". Start directly with an intense pattern-interrupt question or shocking stat in under 12 words.
3. SLIDE 1 (THE COSTLY TRAP): Why 90% of beginners lose money or fail here.
4. SLIDE 2 (THE CORE MECHANISM): Explain the solution/skill in simple everyday language.
5. SLIDE 3 (THE DUAL-CURRENCY MATH): Tangible realistic breakdown with dual Nigerian Naira (₦) and US Dollar ($) equivalents (e.g. "₦5,000 (about $3.50 USD)").
6. SLIDE 4 (IMMEDIATE ACTION PROTOCOL): What to do right now with zero equipment.
7. SLIDE 5 (INFINITE RETENTION LOOP & OUTRO): Golden law + short CTA + this exact seamless bridge: "${chosenOutro}" that connects grammatically right back into Slide 0!

GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
- Seamlessly include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents for any money amounts.

EXCLUDED PREVIOUS TOPICS (DO NOT REPEAT):
[${recentTitles || 'None'}]

OUTPUT FORMAT: Return strictly a valid JSON object matching this schema:
CRITICAL: Output EXACTLY 6 slides (slideIndex 0 to 5).

{
  "title": "Complete High-Impact Hook Title (around 35-50 chars) #Shorts #viral #trending",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "estimatedBudget": "${archetype.targetBudget}",
  "description": "Practical money breakdown on ${archetype.theme}.\\n\\n#Shorts #viral #trending #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy #Wealth #fyp",
  "tags": ["#Shorts", "#viral", "#trending", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy", "#Wealth", "#fyp"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Intense pattern-interrupt hook matching ${chosenHookFormat.name} (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene, ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 1,
      "text": "The hidden cost or beginner mistake explained plainly (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 2,
      "text": "The core simple mechanism or strategy (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 3,
      "text": "The exact dual-currency math (e.g. ₦10,000 / $7 USD) breakdown (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 4,
      "text": "Step-by-step immediate execution roadmap (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 5,
      "text": "Golden takeaway rule + ${chosenOutro} (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${archetype.visualAesthetic}"
    }
  ]
}`;

  const userPrompt = `Generate a fresh, unique, viral 6-slide YouTube Shorts script for Slot ${slotIndex + 1}.
Theme: "${archetype.theme}". Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
Hook Format: "${chosenHookFormat.name}".
MANDATE: Output EXACTLY 6 slides (slideIndex 0 to 5) with 18-25 words per slide (32-42s runtime). Include realistic dual-currency calculations ($ and ₦). Connect Slide 5 seamlessly into Slide 0. Output strictly valid JSON.`;

  return { systemPrompt, userPrompt, chosenHookFormat, chosenOutro };
}

/**
 * Deterministic fallback storyboard synthesis for 6-Slide YouTube Shorts (32-42s runtime)
 */
function synthesizeDeterministicFinStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo', slotIndex = 0) {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const arch = archetype || FIN_ARCHETYPES[0];
  const cleanTopic = sanitizeFinString(topicTitle || arch.angle);
  const chosenHookFormat = selectFinHookFormat(slotIndex, 0);
  const resolvedOutro = resolveFinOutro(cleanHandle, slotIndex * 19 + Date.now());

  return {
    title: formatViralShortsTitle(cleanTopic, 'fin', false),
    category: arch.category,
    theme: arch.theme,
    angle: arch.angle,
    hook: arch.angle,
    description: `Comprehensive practical breakdown of ${arch.theme}.\n\n#Shorts #viral #trending #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy #Wealth #fyp`,
    tags: ["#Shorts", "#viral", "#trending", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy", "#Wealth", "#fyp"],
    estimatedBudget: arch.targetBudget,
    slides: [
      {
        slideIndex: 0,
        text: `If you have only ${arch.targetBudget} in your pocket today, you do not need millions in starting cash to generate real, honest daily profits.`,
        visual: `Cinematic 9:16 vertical 8k photorealistic scene, modern minimalist desk, emerald and gold rim lighting, dark obsidian slate backdrop`
      },
      {
        slideIndex: 1,
        text: `The biggest mistake ninety percent of beginners make is waiting months for massive capital instead of solving immediate everyday problems in their local area.`,
        visual: `Cinematic 9:16 vertical 8k shot, entrepreneur evaluating budget options on mobile phone screen, crisp depth of field`
      },
      {
        slideIndex: 2,
        text: `Focus on cash velocity. Moving five dollars or seven thousand naira three times a week creates more income than holding idle cash waiting for a miracle.`,
        visual: `Cinematic 9:16 vertical 8k shot, clean financial calculator diagram with glowing emerald growth curves`
      },
      {
        slideIndex: 3,
        text: `With ${arch.targetBudget}, calculate your gross margins first. Keep packaging near zero, deliver locally on foot, and retain eighty percent of every profit.`,
        visual: `Cinematic 9:16 vertical 8k shot, practical micro-business supply inventory in high-contrast studio setting`
      },
      {
        slideIndex: 4,
        text: `Separate your business cash box from personal feeding money immediately so unexpected daily expenses never drain your working startup float.`,
        visual: `Cinematic 9:16 vertical 8k shot, modern disciplined entrepreneur managing separated business and personal digital accounts`
      },
      {
        slideIndex: 5,
        text: `Compound your daily profits patiently, stay disciplined, and ${resolvedOutro}`,
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
  const recentTitles = (recentHistory || []).slice(0, 20).map(h => `"${h.topic || h.title}"`).join(', ');
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
3. GLOBAL DUAL-CURRENCY FORMAT (MANDATORY):
   - Whenever mentioning currency, budgets, costs, or revenues, include BOTH Nigerian Naira (₦) and US Dollar ($) equivalents.
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

OUTPUT FORMAT: Return strictly valid JSON matching this schema:
{
  "title": "Comprehensive Masterclass Title with Dual Currency Mention (No #Shorts)",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "estimatedBudget": "${archetype.targetBudget}",
  "description": "Full 15-chapter masterclass on ${archetype.theme}.\\n\\n#PersonalFinance #SmallBusiness #MoneySkills #FinancialEducation",
  "tags": ["#PersonalFinance", "#SmallBusiness", "#MoneySkills", "#FinancialEducation", "#BusinessBreakdown"],
  "slides": [
    {
      "slideIndex": 0,
      "chapterTitle": "Introduction & Market Opportunity",
      "text": "Detailed 110-140 words spoken narration covering the overview and opportunity...",
      "visual": "16:9 widescreen 8k photorealistic modern financial studio workspace with emerald green and gold ambient lighting..."
    }
  ]
}`;

  const userPrompt = `Generate a comprehensive 15-chapter 15-20 minute educational Masterclass script on "${archetype.theme}". Angle: "${archetype.angle}". Budget: "${archetype.targetBudget}". Avoid previous topics: [${recentTitles || 'None'}]. Ensure each slide has 110-140 words of rich spoken narration. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic Fallback for 15-Chapter Masterclass
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
  ROTATING_FIN_HOOK_TEMPLATES,
  ROTATING_FIN_OUTROS,
  formatViralShortsTitle,
  auditFinancialScriptSafety,
  sanitizeFinString,
  resolveFinOutro,
  selectFinHookFormat,
  fetchRecentFinHistoryFromFirestore,
  isFinTopicSimilarToHistory,
  selectDiverseFinArchetype,
  buildFinPromptForSlot,
  buildFinDeepDivePrompt,
  synthesizeDeterministicFinStoryboard,
  synthesizeDeterministicFinDeepDiveStoryboard
};
