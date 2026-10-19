#!/usr/bin/env node
/** Public sources — Wikiquote / Wikipedia */
const https = require('https');

function httpsGet(url, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
  return new Promise(function (resolve, reject) {
    var req = https.get(
      url,
      { headers: { 'User-Agent': 'VoxamContentBot/1.0 (education; github.com/devmeziem)' } },
      function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpsGet(res.headers.location, timeoutMs).then(resolve, reject);
        }
        var data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () { resolve({ status: res.statusCode, data: data }); });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, function () {
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
  var quotes = [];
  var raw = String(wikitext || '');
  var section = raw;
  var qi = raw.search(/==\s*Quotes\s*==/i);
  if (qi >= 0) section = raw.slice(qi);

  var lines = section.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^==/.test(line)) continue;
    if (/^\[\[File:/i.test(line)) continue;
    if (/^\{\{/.test(line)) continue;
    var m = line.match(/^\*\s*["\u201C](.+?)["\u201D]/);
    if (!m) m = line.match(/^\*\s*(.+)$/);
    if (!m) continue;
    var q = stripWiki(m[1]);
    q = q.replace(/\s*[-\u2014\u2013]\s*.{0,40}$/, '').trim();
    if (q.length >= 40 && q.length <= 280 && /[a-zA-Z]/.test(q)) quotes.push(q);
  }

  var re = /["\u201C]([^"\u201D]{40,280})["\u201D]/g;
  var mm;
  while ((mm = re.exec(raw))) {
    var qq = stripWiki(mm[1]);
    if (qq.length >= 40 && qq.length <= 280) quotes.push(qq);
  }
  return Array.from(new Set(quotes));
}

var FIN_AUTHORS = [
  'Warren_Buffett',
  'Charlie_Munger',
  'Benjamin_Graham',
  'John_C._Bogle',
  'Peter_Lynch',
  'Ray_Dalio',
  'Naval_Ravikant',
  'Morgan_Housel',
  'Thomas_Sowell',
  'Andrew_Carnegie',
  'John_D._Rockefeller'
];

var STOIC_AUTHORS = ['Marcus_Aurelius', 'Epictetus', 'Seneca_the_Younger', 'Zeno_of_Citium', 'Musonius_Rufus'];

async function fetchWikiquoteQuotes(authorPage) {
  var url =
    'https://en.wikiquote.org/w/api.php?action=parse&page=' +
    encodeURIComponent(authorPage) +
    '&prop=wikitext&format=json&formatversion=2';
  var res = await httpsGet(url);
  if (res.status !== 200) return [];
  var json;
  try {
    json = JSON.parse(res.data);
  } catch (e) {
    return [];
  }
  var wt = json && json.parse && json.parse.wikitext;
  if (!wt) return [];
  return extractQuotesFromWikitext(wt).map(function (quote) {
    return {
      quote: quote,
      author: authorPage.replace(/_/g, ' '),
      source: 'wikiquote',
      reference: 'https://en.wikiquote.org/wiki/' + authorPage
    };
  });
}

async function fetchWikipediaSummary(title) {
  var url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title);
  var res = await httpsGet(url);
  if (res.status !== 200) return null;
  try {
    var j = JSON.parse(res.data);
    return {
      title: j.title,
      extract: j.extract,
      thumbnail: (j.thumbnail && j.thumbnail.source) || (j.originalimage && j.originalimage.source) || null,
      url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page
    };
  } catch (e) {
    return null;
  }
}

var ARCHIE_TOPIC_SEEDS = [
  { title: 'Why do ears pop on planes?', wiki: 'Eustachian_tube', visual: 'airplane cabin window sky' },
  { title: 'Why is the sky blue?', wiki: 'Rayleigh_scattering', visual: 'clear blue sky daytime clouds' },
  { title: 'Why does ice float?', wiki: 'Ice', visual: 'ice cubes floating in water glass' },
  { title: 'Why do onions make you cry?', wiki: 'Onion', visual: 'person cutting onion kitchen' },
  { title: 'Why does metal feel cold?', wiki: 'Thermal_conductivity', visual: 'hand metal railing winter' },
  { title: 'Why do we see lightning before thunder?', wiki: 'Lightning', visual: 'lightning storm night sky' }
];

var TEEN_SITUATION_HOOKS = [
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
  httpsGet: httpsGet,
  stripWiki: stripWiki,
  extractQuotesFromWikitext: extractQuotesFromWikitext,
  FIN_AUTHORS: FIN_AUTHORS,
  STOIC_AUTHORS: STOIC_AUTHORS,
  fetchWikiquoteQuotes: fetchWikiquoteQuotes,
  fetchWikipediaSummary: fetchWikipediaSummary,
  ARCHIE_TOPIC_SEEDS: ARCHIE_TOPIC_SEEDS,
  TEEN_SITUATION_HOOKS: TEEN_SITUATION_HOOKS
};
