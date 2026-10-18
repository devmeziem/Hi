#!/usr/bin/env node
/**
 * Patches generate_fin_quote_reel.cjs on the runner so it never falls back to the full catalog.
 * This stops exact-repeat spam (e.g. same Buffett quote every run).
 */
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'scripts', 'generate_fin_quote_reel.cjs');
if (!fs.existsSync(target)) {
  console.warn('[dedup-fix] target missing');
  process.exit(0);
}

let t = fs.readFileSync(target, 'utf8');
if (t.includes('NEVER dump full catalog')) {
  console.log('[dedup-fix] already patched');
  process.exit(0);
}

const oldStart = t.indexOf('function selectUniqueFinanceQuote()');
const oldEnd = t.indexOf('function calculateSimilarity', oldStart);
if (oldStart < 0 || oldEnd < 0) {
  console.warn('[dedup-fix] could not locate selectUniqueFinanceQuote');
  process.exit(0);
}

const replacement = `function selectUniqueFinanceQuote() {
  const history = loadLocalHistory();
  const recentAuthors = history.slice(-8).map(h => h.author).filter(Boolean);
  const recentQuotes = new Set(history.map(h => (h.quote || '').trim().toLowerCase()));

  // HARD: never re-post an exact quote already in history
  const freshQuotes = FINANCE_TITANS_QUOTES.filter(q => {
    const cleanQ = (q.quote || '').trim().toLowerCase();
    if (!cleanQ) return false;
    if (recentQuotes.has(cleanQ)) return false;
    for (const prev of history.slice(-60)) {
      if (prev.quote && calculateSimilarity(cleanQ, prev.quote.toLowerCase()) > 0.35) return false;
    }
    if (recentAuthors.includes(q.author)) return false;
    return true;
  });

  let candidatePool = freshQuotes;
  if (candidatePool.length === 0) {
    // NEVER dump full catalog (that caused Buffett spam) — least-recently-used only
    const authorLast = {};
    history.forEach((h, i) => { if (h.author) authorLast[h.author] = i; });
    candidatePool = [...FINANCE_TITANS_QUOTES]
      .sort((a, b) => (authorLast[a.author] ?? -1) - (authorLast[b.author] ?? -1))
      .filter(q => !recentQuotes.has((q.quote || '').trim().toLowerCase()));
    if (candidatePool.length === 0) {
      candidatePool = FINANCE_TITANS_QUOTES.filter(q => !recentQuotes.has((q.quote || '').trim().toLowerCase()));
    }
    if (candidatePool.length === 0) candidatePool = FINANCE_TITANS_QUOTES;
  }

  const seed = (Math.floor(Date.now() / (1000 * 60 * 30)) + Math.floor(Math.random() * 997)) % candidatePool.length;
  const chosen = candidatePool[seed];
  console.log('[Fin Dedup HARD] history=' + history.length + ' fresh=' + freshQuotes.length + ' picked=' + chosen.author);
  return chosen;
}\n\n`;

t = t.slice(0, oldStart) + replacement + t.slice(oldEnd);
fs.writeFileSync(target, t);
console.log('[dedup-fix] patched selectUniqueFinanceQuote');
