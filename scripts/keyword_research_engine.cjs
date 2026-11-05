#!/usr/bin/env node
/**
 * Keyword research for Fin / SEO titles.
 * 1) Ahrefs API v3 if AHREFS_API_KEY is set (Bearer)
 * 2) Else curated + AI-expanded niche keywords (students under 25, NG + global)
 */
const https = require('https');

const SEED_BANK = [
  { keyword: 'habits that waste money', intent: 'list', angle: 'behaviors that eat financial growth' },
  { keyword: 'how to save money as a student', intent: 'list', angle: 'simple ways to save without a big income' },
  { keyword: 'digital skills to make money 2026', intent: 'list', angle: 'overlooked digital skills with low startup cost' },
  { keyword: 'side hustle ideas for students Nigeria', intent: 'list', angle: 'campus-first earning ideas' },
  { keyword: 'budgeting for beginners', intent: 'teach', angle: 'budget types students actually use' },
  { keyword: 'emergency fund for beginners', intent: 'teach', angle: 'first buffer before investing' },
  { keyword: 'investment scams WhatsApp', intent: 'trap', angle: 'urgency and guaranteed return red flags' },
  { keyword: 'compound interest explained simply', intent: 'teach', angle: 'why small consistent saves matter' },
  { keyword: 'freelancing skills no capital', intent: 'list', angle: 'skills you can sell this month' },
  { keyword: 'track spending app free', intent: 'skill', angle: '3-day spend audit method' },
  { keyword: 'financial literacy for teens', intent: 'list', angle: 'money mistakes under 25' },
  { keyword: 'passive income myths students', intent: 'trap', angle: 'what is not passive income' }
];

function pickSeed(exclude = []) {
  const pool = SEED_BANK.filter((s) => !exclude.includes(s.keyword));
  const list = pool.length ? pool : SEED_BANK;
  return list[Math.floor(Math.random() * list.length)];
}

async function ahrefsKeywordOverview(keywords) {
  const key = process.env.AHREFS_API_KEY || process.env.AHREF_API_KEY || '';
  if (!key) return null;
  const q = encodeURIComponent(keywords.slice(0, 5).join(','));
  const url = `https://api.ahrefs.com/v3/keywords-explorer/overview?country=us&keywords=${q}&select=keyword,volume,difficulty,traffic_potential`;
  return new Promise((resolve) => {
    const req = https.request(
      url,
      { method: 'GET', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, timeout: 15000 },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(body);
            console.log('[Keywords] Ahrefs status', res.statusCode);
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: j });
          } catch (e) {
            resolve({ ok: false, error: e.message, raw: body.slice(0, 300) });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    req.end();
  });
}

async function researchFinKeyword(opts = {}) {
  const used = opts.exclude || [];
  const seed = pickSeed(used);
  let ahrefs = null;
  try {
    ahrefs = await ahrefsKeywordOverview([seed.keyword, seed.angle]);
  } catch (e) {
    console.warn('[Keywords] Ahrefs soft-fail', e.message);
  }

  // Title templates under 60s friendly
  const counts = [3, 5, 7];
  const n = counts[Math.floor(Math.random() * counts.length)];
  const templates = [
    `${n} behaviors that quietly eat your financial growth`,
    `${n} ways students can save without a big income`,
    `${n} digital skills people under 25 still ignore`,
    `${n} money mistakes that keep students broke`,
    `${n} free skills you can sell this month`,
    `${n} red flags before you send money to anyone`,
    `${n} small money moves that actually build discipline`
  ];
  const title = templates[Math.floor(Math.random() * templates.length)];

  return {
    primaryKeyword: seed.keyword,
    angle: seed.angle,
    intent: seed.intent,
    title,
    count: n,
    source: ahrefs && ahrefs.ok ? 'ahrefs+seed' : 'seed_bank',
    ahrefs: ahrefs && ahrefs.ok ? ahrefs.data : null,
    mediaHints: [
      'student budgeting notebook',
      'phone mobile banking',
      'laptop freelance work',
      'savings jar coins',
      'city market prices',
      'calm desk planning'
    ]
  };
}

module.exports = { researchFinKeyword, ahrefsKeywordOverview, SEED_BANK };

if (require.main === module) {
  researchFinKeyword().then((r) => {
    console.log(JSON.stringify(r, null, 2));
  });
}
