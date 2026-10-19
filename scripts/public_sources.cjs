#!/usr/bin/env node
/** Public sources — Wikiquote / Wikipedia with robust quote extraction */
const https = require('https');

function httpsGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'VoxamContentBot/1.0 (education; github.com/devmeziem)' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpsGet(res.headers.location, timeoutMs).then(resolve, reject);
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function stripWiki(text) {
  return String(text)
    .replace(/\[\[File:[^\]]+\]\]/gi, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQuotesFromWikitext(wikitext) {
  const quotes = [];
  const raw = String(wikitext || '');
  // Prefer section after == Quotes ==
  let section = raw;
  const qi = raw.search(/==\s*Quotes\s*==/i);
  if (qi >= 0) section = raw.slice(qi);
  const end = section.search(/\n==\s*[^=]/s*==/);
  // keep quotes section mostly
  const lines = section.split('\n');
  for (const line of lines) {
    if (/^==/.test(line)) continue;
    if (/^\[\[File:/i.test(line)) continue;
    if (/^\{\{/.test(line)) continue;
    // * "quote" or * quote
    let m = line.match(/^\*\s*["“](.+?)["”]/);
    if (!m) m = line.match(/^\*\s*(.+)$/);
    if (!m) continue;
    let q = stripWiki(m[1]);
    // drop attribution tails
    q = q.replace(/\s*[-—–]\s*.{0,40}$/, '').trim();
    if (q.length >= 40 && q.length <= 280 && /[a-zA-Z]/.test(q)) quotes.push(q);
  }
  // Also "quoted" phrases anywhere
  const re = /["“]([^"”]{40,280})["”]/g;
  let mm;
  while ((mm = re.exec(raw))) {
    const q = stripWiki(mm[1]);
    if (q.length >= 40 && q.length <= 280) quotes.push(q);
  }
  return [...new Set(quotes)];
}

const FIN_AUTHORS = [
  'Warren_Buffett',
  'Charlie_Munger',
  'Benjamin_Graham',
  'John_C._Bogle',
  'Peter_Lynch',
  'Ray_Dalio',
  'Naval_Ravikant',
  'Morgan_Housel',
  'Thomas_Sowell',
  'Robert_Kiyosaki',
  'Andrew_Carnegie',
  'John_D._Rockefeller'
];

const STOIC_AUTHORS = ['Marcus_Aurelius', 'Epictetus', 'Seneca_the_Younger', 'Zeno_of_Citium', 'Musonius_Rufus'];

async function fetchWikiquoteQuotes(authorPage) {
  const url = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(authorPage)}&prop=wikitext&format=json&formatversion=2`;
  const { status, data } = await httpsGet(url);
  if (status !== 200) return [];
  let json;
  try {
    json = JSON.parse(data);
  } catch {
    return [];
  }
  const wt = json?.parse?.wikitext;
  if (!wt) return [];
  return extractQuotesFromWikitext(wt).map((quote) => ({
    quote,
    author: authorPage.replace(/_/g, ' '),
    source: 'wikiquote',
    reference: `https://en.wikiquote.org/wiki/${authorPage}`
  }));
}

async function fetchWikipediaSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const { status, data } = await httpsGet(url);
  if (status !== 200) return null;
  try {
    const j = JSON.parse(data);
    return {
      title: j.title,
      extract: j.extract,
      thumbnail: j.thumbnail?.source || j.originalimage?.source || null,
      url: j.content_urls?.desktop?.page
    };
  } catch {
    return null;
  }
}

const ARCHIE_TOPIC_SEEDS = [
  { title: 'Why do ears pop on planes?', wiki: 'Eustachian_tube', visual: 'airplane cabin window sky' },
  { title: 'Why is the sky blue?', wiki: 'Rayleigh_scattering', visual: 'clear blue sky daytime clouds' },
  { title: 'Why does ice float?', wiki: 'Ice', visual: 'ice cubes floating in water glass' },
  { title: 'Why do onions make you cry?', wiki: 'Onion', visual: 'person cutting onion kitchen' },
  { title: 'Why does metal feel cold?', wiki: 'Thermal_conductivity', visual: 'hand metal railing winter' },
  { title: 'Why do we see lightning before thunder?', wiki: 'Lightning', visual: 'lightning storm night sky' }
];

const TEEN_SITUATION_HOOKS = [
  'You keep unlocking your phone with no reason',
  'You say you will start tomorrow every night',
  'Everyone looks ahead while you feel behind',
  'Your room is chaos and so is your focus',
  'You study for hours but remember nothing',
  'You sleep late and hate your morning self',
  'You wait for motivation that never arrives',
  'You compare your chapter 2 to someone chapter 20'
];

module.exports = {
  httpsGet,
  stripWiki,
  extractQuotesFromWikitext,
  FIN_AUTHORS,
  STOIC_AUTHORS,
  fetchWikiquoteQuotes,
  fetchWikipediaSummary,
  ARCHIE_TOPIC_SEEDS,
  TEEN_SITUATION_HOOKS
};
