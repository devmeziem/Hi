#!/usr/bin/env node
/**
 * Injects live Wikiquote quote selection into generate_fin_quote_reel.cjs
 * Replaces selectUniqueFinanceQuote to call fetch_live_finance_quote first.
 * No full-catalog fallback.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'scripts', 'generate_fin_quote_reel.cjs');
if (!fs.existsSync(target)) {
  console.warn('[dedup-fix] target missing');
  process.exit(0);
}

let t = fs.readFileSync(target, 'utf8');
if (t.includes('fetchLiveFinanceQuote')) {
  console.log('[dedup-fix] live quote already wired');
  process.exit(0);
}

const oldStart = t.indexOf('function selectUniqueFinanceQuote()');
const oldEnd = t.indexOf('function calculateSimilarity', oldStart);
if (oldStart < 0 || oldEnd < 0) {
  console.warn('[dedup-fix] could not locate selectUniqueFinanceQuote');
  process.exit(0);
}

const replacement = `async function selectUniqueFinanceQuote() {
  // LIVE public sources only — no hardcoded pool as primary
  try {
    const { fetchLiveFinanceQuote } = require('./fetch_live_finance_quote.cjs');
    const live = await fetchLiveFinanceQuote();
    if (live && live.quote) {
      return {
        quote: live.quote,
        author: live.author,
        credentials: live.credentials || 'Public source',
        reference: live.reference || 'Wikiquote',
        wikiSearch: String(live.author || '').replace(/\\s+/g, '_'),
        theme: 'live_public'
      };
    }
  } catch (e) {
    console.error('[Fin Quote] Live public fetch failed:', e.message);
    throw e; // no silent catalog fallback
  }
}\n\n`;

// Also need callers of selectUniqueFinanceQuote to await it
t = t.slice(0, oldStart) + replacement + t.slice(oldEnd);

// Best-effort: sync call sites → await
t = t.replace(
  /const chosen = selectUniqueFinanceQuote\(\);/g,
  'const chosen = await selectUniqueFinanceQuote();'
);
t = t.replace(
  /let chosen = selectUniqueFinanceQuote\(\);/g,
  'let chosen = await selectUniqueFinanceQuote();'
);

fs.writeFileSync(target, t);
console.log('[dedup-fix] wired live Wikiquote selectUniqueFinanceQuote');
