/**
 * Global Finance & Small-Business Diversity Engine
 * Channel: @bones_ceo / Fin Blueprint
 * 
 * CORE CHANNEL POSITIONING:
 * "Learn how to manage money, start small businesses, develop valuable skills,
 * find legitimate opportunities, and understand finance in simple language."
 * 
 * Target: Ordinary young people, students, beginners, low-income users, and aspiring entrepreneurs
 * starting with little or no capital ($0 to $50 USD).
 * 
 * SINGLE STANDARD CURRENCY FORMAT:
 * Formats all financial sums strictly in US Dollars ($ USD) (e.g., "$5", "$10", "$50", "$500")
 * to ensure maximum global audience reach and consistent algorithmic classification.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Local history cache file
const LOCAL_FIN_HISTORY_CACHE = path.join(process.cwd(), 'daily_fin_history_cache.json');
const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');

/**
 * Safely resolve Firebase / Firestore configuration from env or firebase-applet-config.json
 */
function getFirestoreConfig() {
  let fb = null;
  try {
    if (process.env.FIREBASE_CONFIG_JSON) {
      fb = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
    }
  } catch {}
  if (!fb) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {}
    }
  }
  const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fb?.projectId || 'gen-lang-client-0135161700';
  const apiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || fb?.apiKey || '';
  const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || fb?.firestoreDatabaseId || fb?.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';
  return { projectId, apiKey, databaseId };
}

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

  // If headline is too long, find the best natural semantic breaking point
  if (headline.length > 75) {
    const parts = headline.split(/[\-–—:]+/);
    if (parts.length > 1 && parts[0].trim().length >= 25 && parts[0].trim().length <= 75) {
      headline = parts[0].trim();
    } else {
      const clauseMatches = [...headline.matchAll(/\b(with|using|so\s+that|so\s+your|when|before|to\s+pass|for\s+busy|for\s+under|to\s+turn|to\s+start|to\s+build|to\s+earn)\b/gi)];
      let bestCut = -1;
      for (const m of clauseMatches) {
        if (m.index && m.index >= 30 && m.index <= 75) {
          bestCut = m.index;
        }
      }
      if (bestCut > 0) {
        headline = headline.slice(0, bestCut).trim();
      } else {
        const trimmed = headline.slice(0, 72);
        const lastSpace = trimmed.lastIndexOf(' ');
        headline = (lastSpace > 30 ? trimmed.slice(0, lastSpace) : trimmed).trim();
      }
    }
  }

  // Clean trailing connector words or punctuation to guarantee a complete phrase
  const trailingConnectorsRegex = /[\s\-,;:–—&+/]+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are|your|their|that|before|after|how|what|why|when|where|which|while|if|as|at|into|onto|about|than|you|they|this|these|those|so|busy|multi|some|any|my|our)?\s*$/i;
  let prevLength = 0;
  while (headline.length !== prevLength && trailingConnectorsRegex.test(headline)) {
    prevLength = headline.length;
    headline = headline.replace(trailingConnectorsRegex, '').trim();
  }
  headline = headline.replace(/[,\-;:–—&+/]+$/, '').trim();

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

// Recurring Channel Series
const FIN_SERIES = {
  FIVE_K_CHALLENGE: '₦5K Challenge',
  MONEY_BASICS: 'Money Basics',
  FINANCE_EXPLAINED: 'Finance Explained',
  BUSINESS_BREAKDOWN: 'Business Breakdown',
  SCAM_ALERT: 'Scam Alert',
  PHONE_TO_INCOME: 'Phone-to-Income',
  CRYPTO_FOR_BEGINNERS: 'Crypto for Beginners',
  FREE_OPPORTUNITY_FRIDAY: 'Free Opportunity Friday',
  THIRTY_DAY_CHALLENGE: '30-Day Money Challenge'
};

// 8 Distinct Rotating Hook Frameworks (Intro formats)
const ROTATING_FIN_HOOK_TEMPLATES = [
  {
    id: 'contrarian_myth_buster',
    name: 'Contrarian Myth Buster',
    formula: 'Stop doing [Common Habit] immediately if you want [Outcome]. Here is why 90% of people stay broke...',
    generateHook: (theme, budget) => `Stop saving cash in a zero-interest account if you want real financial freedom. Here is the mathematical truth...`
  },
  {
    id: 'shocking_stat_math',
    name: 'Shocking Statistic / Mathematical Contrast',
    formula: '90% of beginners lose money doing X, while smart builders turn [Budget] into daily cash flow with this rule...',
    generateHook: (theme, budget) => `90% of beginners lose their money within 30 days, while smart builders turn ${budget} into daily cash flow with this exact rule...`
  },
  {
    id: 'direct_emergency_scenario',
    name: 'Direct Emergency Scenario',
    formula: 'If you have only [Budget] left in your bank account today, here is the exact protocol to execute before sunset...',
    generateHook: (theme, budget) => `If you have only ${budget} left to your name today, do not panic. Here is the exact protocol to execute before sunset...`
  },
  {
    id: 'curiosity_gap_trap',
    name: 'Curiosity Gap / The Silent Money Trap',
    formula: 'There is a silent money trap draining your account every month that banks will never warn you about...',
    generateHook: (theme, budget) => `There is a silent money leak draining your account every single week that nobody ever warned you about...`
  },
  {
    id: 'iron_rule_law',
    name: 'The Iron Rule / First Law',
    formula: 'Rule number one of [Theme]: If you do not master this first, every dollar or naira you earn will disappear...',
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

// Category-Specific Flow Schemas for High-Impact Narrative Execution (Conceptual & Minimalist Clarity)
const CATEGORY_FLOW_GUIDES = {
  [FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS]: {
    name: 'Small-Capital Business Flow',
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    slideSteps: [
      'High-Curiosity Opportunity Hook (Starting with small capital)',
      'The Simple Mechanism (Why local people happily pay for this service or item)',
      'Minimalist Setup (How to start today using everyday items and zero expensive gear)',
      'Practical Daily Execution (How to find your first 5 customers on foot or WhatsApp)',
      'The Fatal Beginner Trap (The exact mistake that drains your working float)',
      'Golden Rule & Infinite Loop Outro Bridge'
    ],
    communityQuestion: 'What business idea would you like us to explain in simple terms next?'
  },
  [FIN_CATEGORIES.SAVING_PERSONAL_FINANCE]: {
    name: 'Saving & Personal Finance Flow',
    series: FIN_SERIES.MONEY_BASICS,
    slideSteps: [
      'Relatable Spending Trap Hook',
      'The Root Cause (Why willpower alone fails when managing cash)',
      'The Minimalist Solution (The simple rule that automatically protects your money)',
      'Practical Implementation (Separating your safety buffer from daily spending)',
      'The Costly Mistake Beginners Make with Idle Money',
      'Golden Savings Rule & Retention Loop Bridge'
    ],
    communityQuestion: 'What is the single best money habit that helped you save consistently?'
  },
  [FIN_CATEGORIES.FINANCIAL_EDUCATION]: {
    name: 'Financial Education Flow',
    series: FIN_SERIES.FINANCE_EXPLAINED,
    slideSteps: [
      'Crystal-Clear Concept Hook (No financial jargon)',
      'Simple Real-World Analogy (Making the concept instantly obvious)',
      'Why This Directly Impacts Your Everyday Wallet',
      'The Hidden Trap 90% of People Fall Into',
      'The Minimalist Action to Protect Your Purchasing Power',
      'Core Lesson Takeaway & Channel Loop Bridge'
    ],
    communityQuestion: 'Which financial term would you like us to break down next?'
  },
  [FIN_CATEGORIES.SKILLS_TO_INCOME]: {
    name: 'Skills to Income Flow',
    series: FIN_SERIES.PHONE_TO_INCOME,
    slideSteps: [
      'Phone-Only High-Value Skill Hook',
      'The Market Need (Why busy shop owners and creators need this right now)',
      'Free Tools & Practice Method (Zero software cost)',
      'First Client Outreach Protocol (Simple message template to get paying work)',
      'The Beginner Fear That Stops Most People From Starting',
      'Immediate 24-Hour Execution Step & Outro Bridge'
    ],
    communityQuestion: 'Which digital skill are you focusing on mastering this month?'
  },
  [FIN_CATEGORIES.FREE_OPPORTUNITIES]: {
    name: 'Free & Low-Cost Opportunity Flow',
    series: FIN_SERIES.FREE_OPPORTUNITY_FRIDAY,
    slideSteps: [
      'Verified Free Opportunity Announcement & Eligibility',
      'What You Actually Gain (Skills, certificates, or career growth)',
      'Official Direct Access Channel (Zero third-party agents)',
      'Simple Mobile Application Walkthrough',
      'Scam Warning (Never pay anyone charging an application fee)',
      'Action Step & Community Share Bridge'
    ],
    communityQuestion: 'Have you taken advantage of any free online learning platforms yet?'
  },
  [FIN_CATEGORIES.SCAM_AWARENESS]: {
    name: 'Scam & Fraud Awareness Flow',
    series: FIN_SERIES.SCAM_ALERT,
    slideSteps: [
      'Urgent Warning Hook & The Unrealistic Bait',
      'The Hidden Trick (How fraudsters manipulate human emotion)',
      '3 Instant Red Flags to Spot Before Sending a Single Penny',
      'What Actually Happens Behind the Scenes (The Ponzi breakdown)',
      'The Golden Safety Rule for Your Hard-Earned Money',
      'Warning Takeaway & Infinite Protection Loop'
    ],
    communityQuestion: 'What is the most common suspicious money scheme you have seen online?'
  },
  [FIN_CATEGORIES.BUSINESS_BREAKDOWNS]: {
    name: 'Business Concept Breakdown Flow',
    series: FIN_SERIES.BUSINESS_BREAKDOWN,
    slideSteps: [
      'The Big Question Hook (How this business actually makes sustainable income)',
      'The Business Model Explained in 2 Simple Sentences',
      'Minimalist Equipment & Low-Cost Sourcing Strategy',
      'Customer Acquisition Without Spending on Paid Ads',
      'The Common Failure Point to Avoid at All Costs',
      'Actionable Verdict & Channel Outro Bridge'
    ],
    communityQuestion: 'Which popular business model should we explain simply next?'
  },
  [FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO]: {
    name: 'Beginner Investing & Inflation Defense Flow',
    series: FIN_SERIES.CRYPTO_FOR_BEGINNERS,
    slideSteps: [
      'Simple Concept Hook (Protecting savings against currency loss)',
      'How Everyday People Use Stable Digital Value to Protect Cash',
      'Basic Safety Rules & Avoiding Unregulated Speculation',
      'The Difference Between Investing and Gambling',
      'The 3 Golden Rules for Beginners Starting Small',
      'Takeaway Summary & Follow Loop Bridge'
    ],
    communityQuestion: 'How do you currently protect your savings against rising prices?'
  },
  [FIN_CATEGORIES.FINANCIAL_CALCULATORS]: {
    name: 'Compounding & Growth Concept Flow',
    series: FIN_SERIES.MONEY_BASICS,
    slideSteps: [
      'Eye-Opening Compounding Principle Hook',
      'The Power of Small Consistent Habits over Time',
      'Why Steady Daily Progress Beats Sudden Windfalls',
      'The Reinvestment Habit of Disciplined Builders',
      'The Mistake of Expecting Overnight Results',
      'Compounding Mindset Loop & Outro Bridge'
    ],
    communityQuestion: 'What small daily habit has made the biggest difference in your life?'
  },
  [FIN_CATEGORIES.CHALLENGES_EXPERIMENTS]: {
    name: '30-Day Money Challenge Flow',
    series: FIN_SERIES.THIRTY_DAY_CHALLENGE,
    slideSteps: [
      'The 30-Day Minimalist Money Challenge Hook',
      'The Single Core Rule to Follow Daily',
      'How to Handle Urges and Temptations in Week One',
      'The Clear Difference You Notice After 30 Days',
      'What to Do With Your Newly Built Safety Buffer',
      'Challenge Invitation & Community Outro'
    ],
    communityQuestion: 'Are you ready to join this month’s 30-day money challenge?'
  }
};

/**
 * Clean formatting markers, prefixes, and markdown tags from slide narration text
 */
function cleanSlideNarrationText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*\[\s*slide\s*\d+[^\]]*\]\s*[:\-–—]?\s*/i, '')
    .replace(/^\s*\(\s*slide\s*\d+[^)]*\)\s*[:\-–—]?\s*/i, '')
    .replace(/^\s*slide\s*\d+\s*[:\-–—]\s*/i, '')
    .replace(/^\s*scene\s*\d+\s*[:\-–—]\s*/i, '')
    .replace(/^\s*(narration|voiceover|voice\s*over|host|speaker|audio|script)\s*[:\-–—]\s*/i, '')
    .replace(/\(\s*\d+[-–]\d+\s*words?\s*\)/gi, '')
    .replace(/\[\s*\d+[-–]\d+\s*words?\s*\]/gi, '')
    .replace(/\(\s*around\s*\d+[-–]\d+\s*chars?\s*\)/gi, '')
    .replace(/\(\s*\d+\s*words?\s*\)/gi, '')
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Anti-Blueprint / Anti-Placeholder / Anti-Prompt-Leak Validator for Fin Channel
 * Automatically cleans formatting markers from LLM outputs without rejecting valid scripts
 */
function validateFinStoryboardQuality(storyboard) {
  if (!storyboard || typeof storyboard !== 'object') return { valid: false, reason: 'Storyboard is not an object' };
  if (!Array.isArray(storyboard.slides) || storyboard.slides.length < 3) {
    return { valid: false, reason: `Slide count is invalid (${storyboard.slides?.length || 0})` };
  }

  const bannedPatterns = [
    /\(\s*\d+[-–]\d+\s*words?\s*\)/i,
    /\(\s*around\s*\d+[-–]\d+\s*chars?\s*\)/i,
    /\(\s*110[-–]140\s*words\s*total\s*\)/i,
    /\b(shocking\s+hook|pattern-interrupt\s+hook|anti-swipe\s+hook)\b/i,
    /\b(matching\s+(contrarian|paradox|iron|law|curiosity|brutal|under|scenario|realistic|challenge))\b/i,
    /\b(following\s+[a-z_]+\s+formula)\b/i,
    /\b(use\s+the\s+'[^']+'\s+format)\b/i,
    /\b(slideIndex|slideSteps|flowGuide|slotArchetype|chosenHookFormat|chosenOutro)\b/i,
    /\b(communityQuestion|estimatedBudget|targetBudget)\b/i,
    /\b(dual\s+currency\s+numbers|dual-currency\s+format|realistic\s+dual\s+currency)\b/i,
    /\b(cinematic\s+9:16|vertical\s+8k\s+scene|obsidian\s+slate\s+backdrop|rim\s+lighting)\b/i,
    /\b(systemPrompt|userPrompt|json\s+schema|here\s+is\s+the\s+6-slide)\b/i,
    /\b(internal_plan|placeholder|blueprint\s+leak|diagnostic\s+report)\b/i
  ];

  const textsSeen = new Set();

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    if (slide && typeof slide.text === 'string') {
      slide.text = cleanSlideNarrationText(slide.text);
    }
    const text = String(slide?.text || '').trim();

    if (!text || text.length < 25) {
      return { valid: false, reason: `Slide ${i} text is too short or empty (${text.length} chars)` };
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 8) {
      return { valid: false, reason: `Slide ${i} word count too low (${wordCount} words)` };
    }

    for (const pattern of bannedPatterns) {
      if (pattern.test(text)) {
        return { valid: false, reason: `Slide ${i} matched banned blueprint/template pattern: ${pattern}` };
      }
    }

    const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (textsSeen.has(normalized)) {
      return { valid: false, reason: `Slide ${i} is an exact duplicate of a previous slide` };
    }
    textsSeen.add(normalized);
  }

  const title = String(storyboard.title || '').trim();
  if (!title || title.length < 10) {
    return { valid: false, reason: `Title is missing or too short: "${title}"` };
  }
  for (const pattern of bannedPatterns) {
    if (pattern.test(title)) {
      return { valid: false, reason: `Title contains blueprint/template leak: ${pattern}` };
    }
  }

  return { valid: true };
}

// 30+ Comprehensive Diverse Financial Archetypes
const FIN_ARCHETYPES = [
  // 1. SMALL CAPITAL BUSINESSES
  {
    id: 'fin_01_snack_reselling',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    theme: 'Snack & Micro-Item Reselling',
    angle: 'How to Turn $5 into Daily Cash Flow Reselling Bottled Drinks and Snacks',
    targetBudget: '$5 USD',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Crisp cinematic 9:16 vertical 8k scene, aesthetic wooden market stall, emerald green and gold rim lighting, dark obsidian slate backdrop'
  },
  {
    id: 'fin_02_thrift_clothing_flipping',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    theme: 'Second-Hand / Thrift Clothing Flipping',
    angle: 'How to Start a Curated Vintage Clothing Hustle With Under $15',
    targetBudget: '$15 USD',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Aesthetic curated vintage clothing rack, smartphone product photoshoot setup, warm sunlight and tungsten studio lighting, 9:16 vertical 8k'
  },
  {
    id: 'fin_03_cleaning_supplies_reselling',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    theme: 'Liquid Soap & Multi-Purpose Cleaning Formulation',
    angle: 'How to Produce and Bottle 20 Liters of Multi-Purpose Liquid Soap for Under $10',
    targetBudget: '$10 USD',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Crystal clean bottled eco-friendly cleaning liquid with modern minimalist labels, warm bright studio lighting'
  },
  {
    id: 'fin_04_micro_poultry_farming',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.BUSINESS_BREAKDOWN,
    theme: 'Small-Scale Backyard Poultry / Egg Logistics',
    angle: 'How to Start a Backyard Egg Distribution Route With Under $25 Capital',
    targetBudget: '$25 USD',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Clean organic farm crates with fresh farm eggs in morning golden sunlight, modern agricultural entrepreneur'
  },
  {
    id: 'fin_05_micro_logistics_errand_service',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    theme: 'Campus & Neighborhood Micro-Errand Logistics',
    angle: 'How to Earn Daily Income Running Urgent Errand Deliveries for Busy Working Mothers and Professionals',
    targetBudget: '$5 USD Transport',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Fast moving courier holding neatly sealed package with GPS route on smartphone, bright daylight city background'
  },
  {
    id: 'fin_06_food_snack_micro_stall',
    category: FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS,
    series: FIN_SERIES.FIVE_K_CHALLENGE,
    theme: 'Plantain Chips / Popcorn Micro-Production',
    angle: 'How to Package and Distribute 50 Packs of Plantain Chips with $5 Starting Capital',
    targetBudget: '$5 USD',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Freshly packaged crispy golden plantain snacks in clean branded pouches on sleek dark marble countertop'
  },

  // 2. SAVING & PERSONAL FINANCE
  {
    id: 'fin_07_budgeting_50_30_20',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'The 50/30/20 Budgeting Rule for Small Incomes',
    angle: 'How to Budget $50 So Your Money Lasts the Entire Month Without Debt',
    targetBudget: '$50 USD',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Clean high-contrast smartphone budgeting interface, warm studio lighting with dark slate background, clear typography, financial stability aesthetic'
  },
  {
    id: 'fin_08_emergency_fund_buffer',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'Building Your First $100 Safety Buffer',
    angle: 'How to Build a $100 Emergency Fund When You Live on a Low Income',
    targetBudget: '$100 USD',
    hookArchetypeId: 'direct_emergency_scenario',
    visualAesthetic: 'Clean locked digital vault concept, warm emerald rim lighting, modern glass aesthetic, 9:16 vertical 8k cinematic'
  },
  {
    id: 'fin_09_silent_subscription_audit',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'The 15-Minute Bank Statement & Subscription Audit',
    angle: 'How to Find and Cut $25 of Invisible Monthly Leaks from Your Bank Account',
    targetBudget: 'Cost Reduction ($0)',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Sharp financial audit checklist on dark sleek tablet with red expense cuts and green balance totals, 9:16 vertical'
  },
  {
    id: 'fin_10_separating_business_personal_cash',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'Separating Business Capital From Personal Spending Money',
    angle: 'The Fatal Mistake That Kills 80% of Micro-Businesses: Eating Your Startup Capital by Mistake',
    targetBudget: 'Discipline Rule',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Two distinct digital accounts displayed side by side: Business Working Float vs Personal Living Allowance'
  },
  {
    id: 'fin_11_needs_vs_wants_framework',
    category: FIN_CATEGORIES.SAVING_PERSONAL_FINANCE,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'The 24-Hour Impulse Purchase Delay Rule',
    angle: 'How the 24-Hour Rule Stops You from Spending Half Your Paycheck on Impulsive Purchases',
    targetBudget: 'Spending Discipline ($0)',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'Minimalist hourglass timer on obsidian desk with gold particles flowing downward, clean modern composition'
  },

  // 3. FINANCIAL EDUCATION (5-Part Flow: Definition -> Example -> Why it Matters -> Mistake -> Takeaway)
  {
    id: 'fin_12_inflation_purchasing_power',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    series: FIN_SERIES.FINANCE_EXPLAINED,
    theme: 'Inflation & Why Saved Cash Loses Value',
    angle: 'What Inflation Actually Means for Your $100 Bank Savings & 2 Ways to Protect It',
    targetBudget: '$100 USD',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Sleek financial diagram, purchasing power comparison chart, obsidian black background with emerald and gold accents, 9:16 vertical 8k'
  },
  {
    id: 'fin_13_loan_apps_apr_danger',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    series: FIN_SERIES.FINANCE_EXPLAINED,
    theme: 'Quick Mobile Loan Apps & Hidden High Fees (APR)',
    angle: 'The Hidden Math Behind Quick Loan Apps: Why a 30% Two-Week Fee Will Trap You in Debt',
    targetBudget: 'Financial Defense',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Digital smartphone loan interface warning breakdown, dramatic moody slate lighting with red and gold highlights, 9:16 vertical 8k'
  },
  {
    id: 'fin_14_high_yield_vaults_vs_banks',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    series: FIN_SERIES.FINANCE_EXPLAINED,
    theme: 'Fintech High-Yield Vaults vs Traditional Bank Accounts',
    angle: 'Why Traditional Banks Pay 1% While Fintech Digital Vaults Pay 5% APY Interest',
    targetBudget: '$10+ USD',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Comparative high-contrast digital vault metrics glowing emerald against standard low bank ledger, 9:16 vertical'
  },
  {
    id: 'fin_15_compound_interest_basics',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    series: FIN_SERIES.FINANCE_EXPLAINED,
    theme: 'Compound Interest Explained in Plain Everyday Words',
    angle: 'Einstein Called Compound Interest the 8th Wonder: Here is How It Works with Just $1',
    targetBudget: '$1 USD',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Geometric compounding tree branching outwards with glowing emerald leaves on obsidian dark glass'
  },
  {
    id: 'fin_16_opportunity_cost_rule',
    category: FIN_CATEGORIES.FINANCIAL_EDUCATION,
    series: FIN_SERIES.FINANCE_EXPLAINED,
    theme: 'Opportunity Cost: The Real Price of What You Buy',
    angle: 'Why Buying That $15 Dinner Actually Costs You $75 in Future Compounded Wealth',
    targetBudget: 'Mindset Concept',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Dual split-screen showing instant consumable item on left vs compounding investment asset on right'
  },

  // 4. SKILLS TO INCOME
  {
    id: 'fin_17_phone_video_editing',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    series: FIN_SERIES.PHONE_TO_INCOME,
    theme: 'Phone-Only Vertical Video Editing (CapCut)',
    angle: 'How to Earn Your First $25 Editing Short-Form Videos Using Only Your Phone',
    targetBudget: '$0 (Phone & Internet Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Modern creator setup, smartphone with mobile video editor timeline, ambient cyan and gold backlight, crisp 35mm portrait lens'
  },
  {
    id: 'fin_18_freelance_whatsapp_catalogs',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    series: FIN_SERIES.PHONE_TO_INCOME,
    theme: 'Setting Up Digital WhatsApp Catalogs for Local Shops',
    angle: 'How to Charge Local Retailers $15 to Digitize Their Inventory on WhatsApp',
    targetBudget: '$0 (Phone Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Smartphone screen showing clean mobile business catalog with incoming customer orders, warm gold lighting'
  },
  {
    id: 'fin_19_ai_flyer_design_service',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    series: FIN_SERIES.PHONE_TO_INCOME,
    theme: 'AI-Powered Business Flyer Design with Free Tools',
    angle: 'How to Create Professional Marketing Flyers for Local Businesses Using Free AI Tools',
    targetBudget: '$0 (Free AI Tools)',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Hands crafting sleek promotional flyers on tablet using modern AI design suite, vibrant lighting, 9:16 vertical'
  },
  {
    id: 'fin_20_social_media_moderation',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    series: FIN_SERIES.PHONE_TO_INCOME,
    theme: 'Remote WhatsApp & Instagram Community Management',
    angle: 'How to Get Paid $50 Monthly to Manage Direct Messages for Busy Online Vendors',
    targetBudget: '$0 (Phone Only)',
    hookArchetypeId: 'step_by_step_challenge',
    visualAesthetic: 'Smartphone display showing neatly answered client inquiries and confirmed deliveries in sleek dark UI'
  },
  {
    id: 'fin_21_freelance_resume_revamp',
    category: FIN_CATEGORIES.SKILLS_TO_INCOME,
    series: FIN_SERIES.PHONE_TO_INCOME,
    theme: 'ATS Resume & LinkedIn Optimization for Remote Jobs',
    angle: 'How to Fix Your Resume in 20 Minutes Using Free AI Tools to Pass Automated Job Filters',
    targetBudget: '$0 (Free AI)',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Modern sleek resume layout on computer screen with green 98% ATS match score, modern office backdrop'
  },

  // 5. FREE & LOW-COST OPPORTUNITIES
  {
    id: 'fin_22_free_google_certs',
    category: FIN_CATEGORIES.FREE_OPPORTUNITIES,
    series: FIN_SERIES.FREE_OPPORTUNITY_FRIDAY,
    theme: 'Free Big Tech Career Certifications',
    angle: '3 Completely Free Tech Certifications From Google and Microsoft You Can Finish on Your Phone',
    targetBudget: '$0 (100% Free)',
    hookArchetypeId: 'contrarian_myth_buster',
    visualAesthetic: 'Modern digital certificate interface, glowing green verified badge, modern study desk, crisp cinematic lighting, 9:16 vertical 8k'
  },
  {
    id: 'fin_23_legitimate_youth_grants',
    category: FIN_CATEGORIES.FREE_OPPORTUNITIES,
    series: FIN_SERIES.FREE_OPPORTUNITY_FRIDAY,
    theme: 'Verified Government & NGO Business Grants for Youth',
    angle: '3 Legitimate Micro-Grants That Provide Free Seed Funding for Small Businesses (No Application Fee)',
    targetBudget: '$0 (Free Grant Application)',
    hookArchetypeId: 'curiosity_gap_trap',
    visualAesthetic: 'Official grant approval portal displayed on modern laptop screen with golden checkmark seal'
  },

  // 6. SCAM & FRAUD AWARENESS
  {
    id: 'fin_24_ponzi_scam_red_flags',
    category: FIN_CATEGORIES.SCAM_AWARENESS,
    series: FIN_SERIES.SCAM_ALERT,
    theme: 'Spotting Investment Scams & Ponzi Schemes',
    angle: '4 Immediate Red Flags of Fake High-Yield Investment Schemes Before You Lose Your Capital',
    targetBudget: 'Capital Protection ($0)',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'High-contrast security and warning aesthetic, deep charcoal and red-amber accent lighting, sleek digital shield motif, 9:16 vertical 8k'
  },
  {
    id: 'fin_25_whatsapp_task_job_scams',
    category: FIN_CATEGORIES.SCAM_AWARENESS,
    series: FIN_SERIES.SCAM_ALERT,
    theme: 'Fake YouTube/TikTok Like & Subscribe Job Scams',
    angle: 'How the Fake Like & Earn WhatsApp Task Scam Works: How They Steal Your Money After Paying $1',
    targetBudget: 'Scam Prevention ($0)',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Digital chat screenshot analysis with red warning boxes highlighting scam bait tactics'
  },

  // 7. BUSINESS BREAKDOWNS (Unit Economics)
  {
    id: 'fin_26_unit_economics_pricing',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    series: FIN_SERIES.BUSINESS_BREAKDOWN,
    theme: 'Unit Economics: Cost per Unit vs Selling Price',
    angle: 'Why Most Small Businesses Fail: The Missing Unit Economics Formula Explained in Plain English',
    targetBudget: 'Business Mechanics',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'Clear financial unit cost balance ledger on tablet screen, emerald profit margin curves, 9:16 vertical 8k'
  },
  {
    id: 'fin_27_pos_agent_cash_flow',
    category: FIN_CATEGORIES.BUSINESS_BREAKDOWNS,
    series: FIN_SERIES.BUSINESS_BREAKDOWN,
    theme: 'POS & Agency Banking Mechanics',
    angle: 'The Real Daily Math of Running a Mobile Payment Terminal: Equipment Costs, Float, and Daily Commission',
    targetBudget: '$30 USD',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Modern POS terminal printing clean receipt with emerald transaction approved badge, high-contrast studio'
  },

  // 8. BEGINNER INVESTING & CRYPTO
  {
    id: 'fin_28_stablecoins_usdt_explained',
    category: FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO,
    series: FIN_SERIES.CRYPTO_FOR_BEGINNERS,
    theme: 'Digital Dollar (USDT) Savings & Devaluation Defense',
    angle: 'What Are Digital Dollars (USDT) and How Do Ordinary People Use Them to Hedge Inflation?',
    targetBudget: 'Any Budget ($1+ USD)',
    hookArchetypeId: 'question_pivot',
    visualAesthetic: 'Futuristic clean financial interface, glowing emerald and gold crypto tokens on dark obsidian slate, sleek 3D perspective, 9:16 vertical 8k'
  },
  {
    id: 'fin_29_crypto_wallet_safety_seed',
    category: FIN_CATEGORIES.BEGINNER_INVESTING_CRYPTO,
    series: FIN_SERIES.CRYPTO_FOR_BEGINNERS,
    theme: 'Crypto Wallet Self-Custody & Seed Phrase Security',
    angle: 'The Golden Rule of Crypto: Why Sharing Your 12-Word Seed Phrase Will Wipe Out Your Entire Balance',
    targetBudget: 'Security ($0)',
    hookArchetypeId: 'iron_rule_law',
    visualAesthetic: 'Encrypted hardware wallet concept with golden holographic security locks on dark slate background'
  },

  // 9. CALCULATORS & CHALLENGES
  {
    id: 'fin_30_compound_interest_dollar_day',
    category: FIN_CATEGORIES.FINANCIAL_CALCULATORS,
    series: FIN_SERIES.MONEY_BASICS,
    theme: 'The Compounding Math of Saving $1 Daily',
    angle: 'The Real Math of What Happens When You Save Just $1 Every Single Day for 5 Years',
    targetBudget: '$1/day USD',
    hookArchetypeId: 'shocking_stat_math',
    visualAesthetic: 'Exponential growth chart visualization, glowing green compounding curve on sleek dark glass, 9:16 vertical 8k cinematic studio shot'
  },
  {
    id: 'fin_31_30_day_no_takeout_challenge',
    category: FIN_CATEGORIES.CHALLENGES_EXPERIMENTS,
    series: FIN_SERIES.THIRTY_DAY_CHALLENGE,
    theme: 'The 30-Day Zero Impulse Spending Challenge',
    angle: 'What Happened When a Student Tracked Every Single $1 Spent for 30 Days',
    targetBudget: 'Behavioral Reset',
    hookArchetypeId: 'story_case_study',
    visualAesthetic: 'Daily progress calendar with consecutive green checkmarks, minimalist wooden desk, warm morning glow'
  }
];

// Dangerous financial claims blacklist for Safety System
const FINANCIAL_RISK_KEYWORDS = [
  'guaranteed profit', 'guaranteed returns', 'double your money', '100% risk free',
  'risk-free investment', 'get rich quick', 'instant wealth', 'make millions overnight',
  'guaranteed income', 'passive 50%', 'no work required', 'unlimited earnings',
  '100% guaranteed', '1000% return', 'ponzi', 'risk free profit'
];

/**
 * Audit financial script for compliance, safety, and lack of false guarantees
 */
function auditFinancialScriptSafety(scriptText) {
  if (!scriptText) return { safe: true, flags: [] };
  const lower = String(scriptText).toLowerCase();
  const flags = [];
  for (const kw of FINANCIAL_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      flags.push(`Forbidden risky financial phrase detected: "${kw}"`);
    }
  }
  return {
    safe: flags.length === 0,
    flags
  };
}

/**
 * Sanitize and clean output text
 */
function sanitizeFinString(str) {
  if (!str) return '';
  return String(str)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/```/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a rotating outro seamlessly
 */
function resolveFinOutro(channelHandle = '@bones_ceo', seed = 0) {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const idx = Math.abs(seed) % ROTATING_FIN_OUTROS.length;
  return ROTATING_FIN_OUTROS[idx].template(cleanHandle);
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
  const { projectId, apiKey, databaseId } = getFirestoreConfig();

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
              category: item.category || '',
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

  // 3. Fetch from Firestore REST API (saved_campaigns)
  if (apiKey && projectId) {
    try {
      const campUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/saved_campaigns?pageSize=${limit}&key=${apiKey}`;
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
              category: fields.category?.stringValue || '',
              theme: fields.theme?.stringValue || title,
              angle: fields.angle?.stringValue || '',
              createdAt: fields.createdAt?.stringValue || ''
            });
          }
        }
      }
    } catch {}

    // 4. Fetch from Firestore REST API (content_history)
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/content_history?pageSize=${limit}&key=${apiKey}`;
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
            category: fields.category?.stringValue || '',
            theme: fields.theme?.stringValue || '',
            angle: fields.angle?.stringValue || '',
            createdAt: fields.createdAt?.stringValue || ''
          };
          if (item.topic) historyItems.push(item);
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
  const historyArr = Array.isArray(recentHistory) ? recentHistory : [];
  const normCandidate = candidateTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const stopWords = new Set(['how', 'the', 'what', 'when', 'with', 'your', 'from', 'this', 'that', 'they', 'will', 'start', 'make', 'money', 'business', 'cash', 'daily', 'every', 'free', 'step', 'best', 'simple', 'real', 'naira', 'dollar', 'shorts']);

  const wordsCandidate = new Set(
    normCandidate.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  );

  const windowToCheck = historyArr.slice(0, 30);

  for (const item of windowToCheck) {
    const prevText = (((item && (item.topic || item.title)) || '') + ' ' + ((item && item.theme) || '')).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
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
 * Rotates archetypes systematically across categories based on history
 * Guarantees consecutive slots/days cycle through different pillars
 */
function selectDiverseFinArchetype(recentHistory = [], attemptOffset = 0) {
  const historyArr = Array.isArray(recentHistory) ? recentHistory : [];
  const recentTitles = historyArr.map(h => (((h && (h.title || h.topic)) || '') + ' ' + ((h && h.theme) || '')).toLowerCase());
  const recentCategories = historyArr.slice(0, 5).map(h => (h.category || '').toLowerCase()).filter(Boolean);

  // 1. First priority: Archetypes from categories NOT used in the last 3-5 posts
  const unrepresentedCategories = Object.values(FIN_CATEGORIES).filter(cat => !recentCategories.includes(cat.toLowerCase()));
  
  let candidates = FIN_ARCHETYPES.filter(arch => {
    const matchesCategory = unrepresentedCategories.length > 0 ? unrepresentedCategories.includes(arch.category) : true;
    const usedRecently = recentTitles.some(t => t.includes(arch.theme.toLowerCase()) || t.includes(arch.id.toLowerCase()) || t.includes(arch.angle.toLowerCase().slice(0, 20)));
    return matchesCategory && !usedRecently;
  });

  // 2. Secondary fallback: Any archetype not used recently
  if (candidates.length === 0) {
    candidates = FIN_ARCHETYPES.filter(arch => {
      return !recentTitles.some(t => t.includes(arch.theme.toLowerCase()) || t.includes(arch.id.toLowerCase()) || t.includes(arch.angle.toLowerCase().slice(0, 20)));
    });
  }

  const pool = candidates.length > 0 ? candidates : FIN_ARCHETYPES;
  const offset = typeof attemptOffset === 'number' ? attemptOffset : 0;
  const index = (Math.floor(Math.random() * pool.length) + offset) % pool.length;
  return pool[index];
}

/**
 * Build rich system and user prompts for finance LLM generation strictly adhering to category flow
 */
function buildFinPromptForSlot(archetype, recentHistory = [], slotIndex = 0, channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 20).map(h => `"${h.topic || h.title}"`).join(', ');
  
  const chosenHookFormat = selectFinHookFormat(slotIndex, recentHistory.length);
  const chosenOutro = resolveFinOutro(cleanHandle, slotIndex * 17 + Date.now());
  const flowGuide = CATEGORY_FLOW_GUIDES[archetype.category] || CATEGORY_FLOW_GUIDES[FIN_CATEGORIES.SMALL_CAPITAL_BUSINESS];

  const systemPrompt = `You are the lead viral scriptwriter and financial educator for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, students, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 USD).

CRITICAL PEDAGOGY MANDATES:
1. STRICT MINIMUM DURATION: All YouTube Shorts MUST BE OVER 1.5 MINUTES (90+ SECONDS, TARGET 95-115 SECONDS). To achieve this, output 7 to 8 detailed slides with 32 to 42 spoken, conversational words per slide (~240 to 300 words total).
2. SINGLE STANDARD CURRENCY: Use standard US Dollars ($ USD) for all financial numbers, budgets, costs, revenues, and savings (e.g., "$5", "$10", "$50", "$100", "$500"). Do NOT mix or mention multiple currencies in the narration to keep algorithms and global viewers focused.
3. CONVERSATIONAL & MINIMALIST EXPLANATIONS: Explain concepts clearly and simply so even a 12-year-old understands. NO boring mathematical equations, NO repetitive algebra formulas, and NO spreadsheet arithmetic. Break it down to its simplest everyday reality.
4. VARIED, ENGAGING VOCABULARY: When changing topics, do NOT repeat the same phrases over and over. Use rich, distinct language tailored to "${archetype.theme}".
5. SEAMLESS INFINITE LOOP: The last sentence of the final slide MUST naturally bridge back into the opening hook of Slide 0 to maximize viewer retention loops.
6. ZERO BLUEPRINT / PLACEHOLDER LEAKAGE: Never output template words, word-count markers like "(18-22 words)", or internal variable names. Output clean spoken narration text ONLY.

PROGRESSIVE 7-STEP NARRATIVE FLOW (${flowGuide.name} - Series: "${flowGuide.series}"):
- Slide 0: ${flowGuide.slideSteps[0]} -> (Hook: Use the '${chosenHookFormat.name}' approach: "${chosenHookFormat.formula}")
- Slide 1: ${flowGuide.slideSteps[1]} (The Hidden Friction / Reality Check)
- Slide 2: ${flowGuide.slideSteps[2]} (The Core Practical Setup & Startup Budget)
- Slide 3: ${flowGuide.slideSteps[3]} (The Step-by-Step Customer / Revenue Mechanism)
- Slide 4: Detailed Unit Economics, Pricing & Margin Breakdown in Plain English
- Slide 5: ${flowGuide.slideSteps[4]} (The #1 Fatal Beginner Mistake to Avoid)
- Slide 6: The Daily Scaling Protocol & Risk Mitigation Rule
- Slide 7: ${flowGuide.slideSteps[5]} -> (End seamlessly with this exact outro phrase connecting back to Slide 0: "${chosenOutro}")

RULES:
- Exactly 7 to 8 slides (slideIndex 0 to 6 or 7). Each slide must have 32 to 42 punchy, spoken words (240-300 words total = 95-115 seconds).
- No unrealistic promises. Use realistic, practical language.
- Integrate this community question in description: "${flowGuide.communityQuestion}".

EXCLUDED RECENT TOPICS (DO NOT REPEAT):
[${recentTitles || 'None'}]

OUTPUT FORMAT: Return strictly valid JSON:
{
  "title": "High-Impact Viral Title #Shorts #viral #trending #finance",
  "category": "${archetype.category}",
  "series": "${flowGuide.series}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "estimatedBudget": "${archetype.targetBudget}",
  "communityQuestion": "${flowGuide.communityQuestion}",
  "description": "Practical money breakdown on ${archetype.theme}.\\n\\nSeries: ${flowGuide.series}\\nQuestion: ${flowGuide.communityQuestion}\\n\\n#Shorts #viral #trending #PersonalFinance #SmallBusiness #MoneyTips #SideHustle #FinancialLiteracy #Wealth #fyp",
  "tags": ["#Shorts", "#viral", "#trending", "#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#SideHustle", "#FinancialLiteracy", "#Wealth", "#fyp"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Complete spoken hook text with zero placeholder words (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene, ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 1,
      "text": "Complete spoken explanation text (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 2,
      "text": "Complete spoken practical mechanism (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 3,
      "text": "Complete spoken action takeaway (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 4,
      "text": "Complete spoken unit economics and margin breakdown (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 5,
      "text": "Complete spoken mistake warning (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 6,
      "text": "Complete spoken daily protocol and scaling rule (32-42 words)...",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    },
    {
      "slideIndex": 7,
      "text": "Complete spoken golden rule ending with: ${chosenOutro} (32-42 words)",
      "visual": "Cinematic 9:16 vertical 8k photorealistic scene matching ${archetype.visualAesthetic}"
    }
  ]
}`;

  const userPrompt = `Generate a unique, viral 7-8 slide YouTube Shorts script for ${flowGuide.series}.
Topic Theme: "${archetype.theme}". Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
MANDATE: Output EXACTLY 7 to 8 slides (slideIndex 0 to 7) with 32-42 words per slide (total 240-300 words to guarantee runtime is ABOVE 1.5 MINUTES / 90+ SECONDS). Focus on crystal-clear explanations without tedious math. Connect Slide 7 seamlessly into Slide 0. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt, chosenHookFormat, chosenOutro, flowGuide };
}

/**
 * Build rich prompt for 15-chapter 15-20 min Fin Masterclass / Deep Dive video
 */
function buildFinDeepDivePrompt(archetype, recentHistory = [], channelHandle = '@bones_ceo') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const chosenOutro = resolveFinOutro(cleanHandle, Date.now());
  const chosenHookFormat = selectFinHookFormat(0, recentHistory.length);

  const systemPrompt = `You are the lead financial educator and master documentary scriptwriter for the Fin Blueprint channel (${cleanHandle}).
CHANNEL CORE POSITIONING:
"Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
TARGET AUDIENCE: Everyday young people, beginners, low-income earners, and aspiring entrepreneurs starting with little or no capital ($0 to $50 USD).

LONG-FORM MASTERCLASS REQUIREMENTS (15 CHAPTERS / 15-20 MINUTES):
1. EXACTLY 15 COMPREHENSIVE CHAPTERS (SLIDES 0 TO 14):
   - Each slide represents an in-depth practical lesson (~110-140 words of conversational, clear spoken narration).
   - Clear, low-level English (5th-7th grade readability) that answers real human questions without boring math or confusing jargon.
   - Use standard US Dollars ($ USD) for all financial amounts ($5, $10, $50, $100, $500).
2. 15-CHAPTER PROGRESSIVE FINANCIAL BLUEPRINT:
   - Slide 0: Executive Hook & The Reality of Modern Money Traps
   - Slide 1: The Core Foundation: Protecting Your Baseline Capital
   - Slide 2: Uncovering High-Value Everyday Skills You Can Monetize for Free
   - Slide 3: The $0 to $50 Starting Capital Framework: Realistic Small Steps
   - Slide 4: Real-Life Unit Economics & Margin Safety (Plain English Breakdown)
   - Slide 5: Finding Your First 10 Paying Customers Without Ad Spend
   - Slide 6: The #1 Fatal Mistake Beginners Make with Operating Cash
   - Slide 7: Zero-Cost Tools and Digital Platforms to Automate Your Workflow
   - Slide 8: The Separation Rule: Business Funds vs Personal Survival Money
   - Slide 9: Pricing Your Services and Overcoming Imposter Syndrome
   - Slide 10: Building Reinvestment Velocity (Turning $50 into $250)
   - Slide 11: Real-Life Case Study & Step-by-Step Execution Walkthrough
   - Slide 12: Daily Operational Protocol: The 3 Tasks You Must Do Each Morning
   - Slide 13: Emergency Cash Buffer: Bulletproofing Yourself Against Bad Weeks
   - Slide 14: The 30-Day Action Roadmap & Outro (${chosenOutro})
3. VISUALS: 16:9 widescreen 8k cinematic modern clean studio aesthetic, high-contrast dark slate with emerald green and gold accents.

OUTPUT FORMAT: Return strictly valid JSON:
{
  "title": "Clear High-Impact Documentary Title (No #Shorts)",
  "category": "${archetype.category}",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "description": "Full 15-chapter financial masterclass on ${archetype.theme}.\\n\\n#PersonalFinance #SmallBusiness #MoneyTips #FinancialLiteracy",
  "tags": ["#PersonalFinance", "#SmallBusiness", "#MoneyTips", "#FinancialLiteracy", "#Wealth"],
  "slides": [
    {
      "slideIndex": 0,
      "chapterTitle": "Executive Hook & Modern Money Traps",
      "text": "Detailed 110-140 words spoken narration...",
      "visual": "Cinematic 16:9 widescreen 8k photorealistic scene, ${archetype.visualAesthetic}"
    }
  ]
}`;

  const userPrompt = `Generate a complete 15-chapter Masterclass documentary script on "${archetype.theme}".
Angle: "${archetype.angle}". Target Budget: "${archetype.targetBudget}".
MANDATE: Output EXACTLY 15 chapters (slides 0 to 14) with 110-140 words per slide. Clear, actionable spoken guidance for beginners. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt, chosenHookFormat, chosenOutro };
}

const MANDATORY_FINANCIAL_DISCLAIMER = '⚠️ DISCLAIMER: This video and description are for educational and informational purposes only and do not constitute financial, investment, legal, or tax advice. Always conduct independent research and consult a licensed financial professional before making financial decisions.';

/**
 * Deterministic / Preset Fallback Synthesis has been REMOVED per user directive.
 * All scripts must be generated live by AI inference models.
 */
function synthesizeDeterministicFinStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo', slotIndex = 0) {
  const errorMsg = `[Fin Storyboard Engine FATAL] Fallback / preset scripts are strictly removed. All storyboards must be generated by active AI inference providers (Groq, Gemini, Grok, OpenRouter, DeepSeek, OpenAI, or Cloudflare).`;
  console.error(`\n${errorMsg}\n`);
  throw new Error(errorMsg);
}

/**
 * Deterministic / Preset Deep Dive Fallback Synthesis has been REMOVED per user directive.
 */
function synthesizeDeterministicFinDeepDiveStoryboard(archetype, topicTitle, channelHandle = '@bones_ceo') {
  const errorMsg = `[Fin Masterclass Engine FATAL] Fallback / preset masterclass scripts are strictly removed. All 15-chapter deep dives must be generated by active AI inference providers.`;
  console.error(`\n${errorMsg}\n`);
  throw new Error(errorMsg);
}

/**
 * INCREMENTAL DURATION EXPANSION ENGINE
 * If a generated YouTube Short has less than 92 seconds duration (under 1.5 minutes),
 * this function enriches and adds tactical instructional depth WITHOUT starting afresh.
 */
function expandFinStoryboardIfNeeded(storyboard, minDurationSeconds = 92.0, channelHandle = '@bones_ceo') {
  if (!storyboard || !Array.isArray(storyboard.slides) || storyboard.slides.length === 0) {
    return storyboard;
  }

  // Calculate current total word count and estimated speech duration
  const totalWords = storyboard.slides.reduce((acc, s) => acc + (s.text || '').split(/\s+/).filter(Boolean).length, 0);
  const estimatedSeconds = (totalWords / 2.35) + (storyboard.slides.length * 0.4);

  if (estimatedSeconds >= minDurationSeconds) {
    return storyboard;
  }

  console.log(`[Duration Expansion] Current script is ~${estimatedSeconds.toFixed(1)}s (${totalWords} words, ${storyboard.slides.length} slides). Expanding to >1.5 minutes without restarting...`);

  const originalSlides = [...storyboard.slides];
  const lastIndex = originalSlides.length - 1;
  const outroSlide = originalSlides[lastIndex];
  const bodySlides = originalSlides.slice(1, lastIndex);

  // 1. Expand existing body slides with deeper tactical nuance
  const expandedBodySlides = bodySlides.map((slide, idx) => {
    let text = slide.text.trim();
    const wordsInSlide = text.split(/\s+/).filter(Boolean).length;
    
    if (wordsInSlide < 35) {
      if (idx === 0) {
        text += ` Specifically, analyze your weekly bank statement to spot subtle recurring micro-leaks before they drain your foundational capital.`;
      } else if (idx === 1) {
        text += ` Focus entirely on high-turnover unit velocity, keeping your initial product inventory tightly aligned with immediate customer demand.`;
      } else if (idx === 2) {
        text += ` Make sure to separate your personal feeding money into a completely separate zero-fee digital wallet to protect your operating funds.`;
      } else {
        text += ` Track your exact daily gross receipts versus inventory replacement costs each night so you never eat your seed capital.`;
      }
    }
    return { ...slide, text };
  });

  // 2. Insert supplemental actionable breakdown slides if needed to securely exceed 95+ seconds
  const supplementalSlides = [
    {
      text: `Let us break down the exact unit economics in simple numbers: if you invest $10 to source 10 units and distribute them for $2.50 each, your gross return is $25, leaving you $15 in clean operating profit to immediately reinvest.`,
      visual: `Cinematic 9:16 vertical 8k photorealistic scene, high contrast financial breakdown diagram glowing on sleek obsidian slate with emerald and gold accents`
    },
    {
      text: `The single biggest reason most beginners fail is impulse withdrawal: taking money out of the business before reaching steady 30-day cash flow. Always protect your cash buffer like a fortress.`,
      visual: `Cinematic 9:16 vertical 8k photorealistic scene, digital vault security concept with emerald rim lighting, modern glass aesthetic`
    }
  ];

  const newSlidesList = [
    originalSlides[0],
    ...expandedBodySlides,
    ...supplementalSlides,
    outroSlide
  ];

  // Re-index slides sequentially
  const reindexedSlides = newSlidesList.map((s, i) => ({
    ...s,
    slideIndex: i
  }));

  const newTotalWords = reindexedSlides.reduce((acc, s) => acc + (s.text || '').split(/\s+/).filter(Boolean).length, 0);
  const newEstimatedSeconds = (newTotalWords / 2.35) + (reindexedSlides.length * 0.4);

  console.log(`[Duration Expansion] ✅ Script successfully expanded to ~${newEstimatedSeconds.toFixed(1)}s (${newTotalWords} words, ${reindexedSlides.length} slides) with intact infinite loop!`);

  return {
    ...storyboard,
    slides: reindexedSlides
  };
}

module.exports = {
  FIN_CATEGORIES,
  FIN_SERIES,
  FIN_ARCHETYPES,
  CATEGORY_FLOW_GUIDES,
  ROTATING_FIN_HOOK_TEMPLATES,
  ROTATING_FIN_OUTROS,
  MANDATORY_FINANCIAL_DISCLAIMER,
  getFirestoreConfig,
  formatViralShortsTitle,
  auditFinancialScriptSafety,
  sanitizeFinString,
  resolveFinOutro,
  selectFinHookFormat,
  fetchRecentFinHistoryFromFirestore,
  isFinTopicSimilarToHistory,
  selectDiverseFinArchetype,
  validateFinStoryboardQuality,
  buildFinPromptForSlot,
  buildFinDeepDivePrompt,
  expandFinStoryboardIfNeeded,
  synthesizeDeterministicFinStoryboard,
  synthesizeDeterministicFinDeepDiveStoryboard
};
