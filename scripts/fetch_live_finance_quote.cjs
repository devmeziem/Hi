#!/usr/bin/env node
/**
 * Live public-source finance quote fetcher (no hardcoded spam pool).
 * Sources: Wikiquote API (public domain / freely licensed quotes).
 * Dedup against fin_quote_history.json — exact + author window.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const HISTORY = path.join(process.cwd(), 'fin_quote_history.json');

const AUTHOR_PAGES = [
  'Warren_Buffett',
  'Charlie_Munger',
  'Benjamin_Graham',
  'John_C._Bogle',
  'Peter_Lynch',
  'Ray_Dalio',
  'Nassim_Nicholas_Taleb',
  'Thomas_Sowell',
  'Morgan_Housel',
  'Naval_Ravikant',
  'Robert_Kiyosaki',
  'Dave_Ramsey'
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FinBlueprintBot/1.0 (education; contact: github.com/devmeziem)' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY)) {
      const j = JSON.parse(fs.readFileSync(HISTORY, 'utf8'));
      return Array.isArray(j) ? j : [];
    }
  } catch (_) {}
  return [];
}

function saveHistory(entry) {
  const hist = loadHistory();
  hist.push({ ...entry, timestamp: new Date().toISOString() });
  // keep 90 days worth roughly
  const trimmed = hist.slice(-200);
  fs.writeFileSync(HISTORY, JSON.stringify(trimmed, null, 2));
}

function stripWiki(text) {
  return String(text)
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQuotesFromWikitext(wikitext) {
  const quotes = [];
  // * "quote" patterns and plain quoted lines
  const lines = wikitext.split(/\n/);
  for (const line of lines) {
    const m = line.match(/^[\*\#]?\s*["“](.+?)["”]\s*(?:[-—–]\s*(.+))?$/);
    if (m) {
      const q = stripWiki(m[1]);
      if (q.length >= 40 && q.length <= 280) quotes.push(q);
    }
  }
  // Also {{quote|...}}
  const re = /\{\{quote\|([^}]+)\}\}/gi;
  let mm;
  while ((mm = re.exec(wikitext))) {
    const q = stripWiki(mm[1].split('|')[0]);
    if (q.length >= 40 && q.length <= 280) quotes.push(q);
  }
  return [...new Set(quotes)];
}

async function fetchAuthorQuotes(authorPage) {
  const url = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(authorPage)}&prop=wikitext&format=json&formatversion=2`;
  const { status, data } = await httpsGet(url);
  if (status !== 200) return [];
  let json;
  try { json = JSON.parse(data); } catch { return []; }
  const wt = json?.parse?.wikitext;
  if (!wt) return [];
  return extractQuotesFromWikitext(wt).map((quote) => ({
    quote,
    author: authorPage.replace(/_/g, ' '),
    credentials: 'Wikiquote (public source)',
    reference: `https://en.wikiquote.org/wiki/${authorPage}`,
    source: 'wikiquote_live'
  }));
}

async function fetchLiveFinanceQuote() {
  const history = loadHistory();
  const recentQuotes = new Set(history.map((h) => (h.quote || '').trim().toLowerCase()));
  const recentAuthors = history.slice(-6).map((h) => h.author);

  // Shuffle authors; prefer ones not in recent window
  const shuffled = [...AUTHOR_PAGES].sort(() => Math.random() - 0.5);
  shuffled.sort((a, b) => {
    const an = a.replace(/_/g, ' ');
    const bn = b.replace(/_/g, ' ');
    const ar = recentAuthors.includes(an) ? 1 : 0;
    const br = recentAuthors.includes(bn) ? 1 : 0;
    return ar - br;
  });

  for (const page of shuffled.slice(0, 6)) {
    try {
      console.log('[LiveQuote] Fetching Wikiquote:', page);
      const list = await fetchAuthorQuotes(page);
      const fresh = list.filter((q) => !recentQuotes.has(q.quote.toLowerCase()));
      if (fresh.length) {
        const pick = fresh[Math.floor(Math.random() * fresh.length)];
        saveHistory(pick);
        console.log('[LiveQuote] Picked', pick.author, '—', pick.quote.slice(0, 80) + '…');
        return pick;
      }
    } catch (e) {
      console.warn('[LiveQuote] fail', page, e.message);
    }
  }
  throw new Error('No live unique finance quote from public sources (Wikiquote). Refusing hardcoded pool.');
}

module.exports = { fetchLiveFinanceQuote, loadHistory, saveHistory };

if (require.main === module) {
  fetchLiveFinanceQuote()
    .then((q) => {
      console.log(JSON.stringify(q, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
