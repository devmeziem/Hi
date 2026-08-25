/**
 * Automated Multi-Network Affiliate Product Matcher & Deeplink Generator
 * 
 * Features:
 * - Auto-matches products relevant to video topics (e.g. finance books, stoic journals, SaaS tools, templates)
 * - Filters by price thresholds (e.g. 1k - 4k NGN / $1 - $5 USD / cheapest first)
 * - Multi-network fallback if no exact match is found
 * - Generates copy-paste ready description blocks and pinned comments with affiliate links
 */

export interface AffiliateProduct {
  id: string;
  title: string;
  network: 'aliexpress' | 'ebay' | 'jumia' | 'impact' | 'cj' | 'amazon' | 'gumroad' | 'rakuten';
  price: number;
  currency: string;
  formattedPrice: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl?: string;
  category?: string;
  relevanceScore?: number;
}

export interface AffiliateSearchQuery {
  topic: string;
  niche: 'finance_saas' | 'motivation_stoicism' | 'tech_ai' | string;
  targetPriceMin?: number;
  targetPriceMax?: number;
  preferredCurrency?: 'NGN' | 'USD';
  sortBy?: 'cheapest' | 'relevance' | 'highest_commission';
}

/**
 * Fallback curated catalogue for instant offline or zero-latency matching
 */
export const CURATED_AFFILIATE_CATALOG: AffiliateProduct[] = [
  // Finance & Small Business Tools & Books (NGN / USD)
  {
    id: 'fin-01',
    title: 'The Intelligent Investor & Wealth Blueprint Handbook (eBook)',
    network: 'gumroad',
    price: 3500,
    currency: 'NGN',
    formattedPrice: '₦3,500',
    productUrl: 'https://gumroad.com/l/wealth-blueprint-handbook',
    affiliateUrl: 'https://gumroad.com/a/bones_ceo/wealth-blueprint-handbook',
    category: 'Finance'
  },
  {
    id: 'fin-02',
    title: 'Automated Excel/Google Sheets Financial Budget Tracker & Net Worth Calculator',
    network: 'gumroad',
    price: 2500,
    currency: 'NGN',
    formattedPrice: '₦2,500',
    productUrl: 'https://gumroad.com/l/smart-budget-tracker',
    affiliateUrl: 'https://gumroad.com/a/bones_ceo/smart-budget-tracker',
    category: 'Finance'
  },
  {
    id: 'fin-03',
    title: 'Pocket Expense Tracker & Cash Envelope System',
    network: 'jumia',
    price: 4200,
    currency: 'NGN',
    formattedPrice: '₦4,200',
    productUrl: 'https://www.jumia.com.ng/generic-budget-binder-cash-envelopes-tracker',
    affiliateUrl: 'https://affiliates.jumia.com/click?aff_id=BONES_CEO&url=https%3A%2F%2Fwww.jumia.com.ng%2Fgeneric-budget-binder-cash-envelopes-tracker',
    category: 'Finance'
  },
  // Stoicism & Discipline Items & Journals
  {
    id: 'stoic-01',
    title: 'The Daily Stoic 366-Day Guided Journal & Reflection Guide',
    network: 'jumia',
    price: 3800,
    currency: 'NGN',
    formattedPrice: '₦3,800',
    productUrl: 'https://www.jumia.com.ng/meditations-marcus-aurelius-stoic-journal',
    affiliateUrl: 'https://affiliates.jumia.com/click?aff_id=BONES_CEO&url=https%3A%2F%2Fwww.jumia.com.ng%2Fmeditations-marcus-aurelius-stoic-journal',
    category: 'Stoicism'
  },
  {
    id: 'stoic-02',
    title: 'Marcus Aurelius Memento Mori Daily Habit & Discipline Notion Workspace',
    network: 'gumroad',
    price: 1500,
    currency: 'NGN',
    formattedPrice: '₦1,500',
    productUrl: 'https://gumroad.com/l/stoic-notion-system',
    affiliateUrl: 'https://gumroad.com/a/thestoicarchitect/stoic-notion-system',
    category: 'Stoicism'
  },
  {
    id: 'stoic-03',
    title: 'Minimalist Matte Black EDC Brass Memento Mori Pocket Coin',
    network: 'aliexpress',
    price: 2.80,
    currency: 'USD',
    formattedPrice: '$2.80 (~₦4,000)',
    productUrl: 'https://aliexpress.com/item/1005006200000000.html',
    affiliateUrl: 'https://s.click.aliexpress.com/e/_DkStoicCoin',
    category: 'Stoicism'
  }
];

/**
 * Searches and filters affiliate products matching a topic, automatically sorting by price or finding close matches.
 */
export function autoMatchAffiliateProduct(query: AffiliateSearchQuery): AffiliateProduct | null {
  const normalizedTopic = (query.topic || '').toLowerCase();
  const normalizedNiche = (query.niche || '').toLowerCase();

  // 1. Exact or keyword matching
  let matched = CURATED_AFFILIATE_CATALOG.filter(p => {
    const pTitle = p.title.toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    
    const isNicheMatch = 
      (normalizedNiche.includes('fin') && (pCat.includes('fin') || pTitle.includes('invest') || pTitle.includes('budget') || pTitle.includes('wealth'))) ||
      (normalizedNiche.includes('stoic') && (pCat.includes('stoic') || pTitle.includes('stoic') || pTitle.includes('discipline') || pTitle.includes('journal')));

    const isTopicMatch = normalizedTopic.split(' ').some(w => w.length > 3 && pTitle.includes(w));

    return isNicheMatch || isTopicMatch;
  });

  // 2. Price filtering (e.g. 1k - 5k NGN or under $5)
  if (query.targetPriceMin !== undefined) {
    matched = matched.filter(p => p.price >= query.targetPriceMin!);
  }
  if (query.targetPriceMax !== undefined) {
    matched = matched.filter(p => p.price <= query.targetPriceMax!);
  }

  // 3. Sorting (default: cheapest first)
  if (query.sortBy === 'cheapest' || !query.sortBy) {
    matched.sort((a, b) => a.price - b.price);
  }

  if (matched.length > 0) {
    return matched[0];
  }

  // 4. Fallback similar product in broad category
  const fallback = CURATED_AFFILIATE_CATALOG.find(p => {
    if (normalizedNiche.includes('fin')) return p.category === 'Finance';
    if (normalizedNiche.includes('stoic')) return p.category === 'Stoicism';
    return true;
  });

  return fallback || CURATED_AFFILIATE_CATALOG[0];
}

/**
 * Formats affiliate promotion snippet for YouTube descriptions and pinned comments
 */
export function formatAffiliatePromotion(product: AffiliateProduct, videoTitle: string) {
  const descriptionSnippet = `\n📌 Recommended Resource for this video:\n👉 ${product.title} (${product.formattedPrice})\n🔗 Get it here: ${product.affiliateUrl}\n*(Curated resource — discounted offer for our viewers)*\n`;

  const pinnedComment = `🎯 Resource mentioned in this video: \n👉 ${product.title} (${product.formattedPrice}) — Get yours here: ${product.affiliateUrl}\n\nWhat was your biggest takeaway from today's video? Drop your thoughts below! 👇`;

  return {
    descriptionSnippet,
    pinnedComment
  };
}
