#!/usr/bin/env node
/** Public sources — Wikiquote / Wikipedia with strict quote hygiene */
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
        res.on('data', function (c) {
          data += c;
        });
        res.on('end', function () {
          resolve({ status: res.statusCode, data: data });
        });
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

/** Reject URLs, citations, book titles, interview metadata, junk Wikiquote lines */
function isCleanQuote(q) {
  if (!q || typeof q !== 'string') return false;
  var t = q.trim();
  if (t.length < 35 || t.length > 220) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  var low = t.toLowerCase();

  // URLs / media
  if (/https?:\/\//i.test(t)) return false;
  if (/www\./i.test(t)) return false;
  if (/youtube\.com|youtu\.be|watch\?v=/i.test(t)) return false;

  // Citation / bibliography junk (this was the last Fin nonsense post)
  if (/^\*?\s*interview\b/i.test(t)) return false;
  if (/\binterview with\b/i.test(low)) return false;
  if (/\bquoted in\b/i.test(low)) return false;
  if (/\bas quoted\b/i.test(low)) return false;
  if (/\bin an interview\b/i.test(low)) return false;
  if (/\bsaid to\b.*\bin\b/i.test(low) && /\(\d{4}\)/.test(t)) return false;
  if (/^\*?\s*\[/.test(t)) return false;
  if (/\]\s*\(at\s+\d/i.test(t)) return false;
  if (/isbn|doi:|pmid/i.test(low)) return false;
  if (/god's gold|principles for dealing with the changing/i.test(low)) return false;
  if (/^\*\s/.test(t)) return false; // bare wiki bullet residue
  if (/^[-–—*]\s/.test(t)) return false;

  // Prefer spoken sentence-like quotes
  var letters = (t.match(/[a-zA-Z]/g) || []).length;
  if (letters / t.length < 0.55) return false;
  // Must contain a verb-ish / sentence signal (space + lowercase common words)
  if (!/\b(the|a|to|of|is|are|was|be|you|i|we|it|that|and|in|for|on)\b/i.test(t)) return false;
  // Reject pure titles: few spaces
  if ((t.match(/\s+/g) || []).length < 4) return false;

  return true;
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
    if (/https?:\/\//i.test(line)) continue;
    if (/\binterview with\b/i.test(line) && !/["\u201C]/.test(line)) continue;
    var m = line.match(/^\*\s*["\u201C](.+?)["\u201D]/);
    if (!m) m = line.match(/^\*\s*(.+)$/);
    if (!m) continue;
    var q = stripWiki(m[1]);
    q = q.replace(/\s*[-\u2014\u2013]\s*.{0,40}$/, '').trim();
    q = q.replace(/\[https?:[^\]]+\]/gi, '').trim();
    q = q.replace(/^\*+\s*/, '').trim();
    if (isCleanQuote(q)) quotes.push(q);
  }

  var re = /["\u201C]([^"\u201D]{35,220})["\u201D]/g;
  var mm;
  while ((mm = re.exec(raw))) {
    var qq = stripWiki(mm[1]);
    if (isCleanQuote(qq)) quotes.push(qq);
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

var STOIC_AUTHORS = [
  'Marcus_Aurelius',
  'Epictetus',
  'Seneca_the_Younger',
  'Zeno_of_Citium',
  'Cleanthes',
  'Musonius_Rufus'
];

var ARCHIE_TOPIC_SEEDS = [
  { title: 'Why the sky is blue', wiki: 'Rayleigh_scattering', hook: 'The sky is blue because of how sunlight scatters.' },
  { title: 'Why ears pop on planes', wiki: 'Eustachian_tube', hook: 'Your ears pop when cabin pressure changes.' },
  { title: 'Why ice floats', wiki: 'Ice', hook: 'Ice floats because it is less dense than liquid water.' },
  { title: 'How bees find flowers', wiki: 'Honey_bee', hook: 'Bees use dance, scent, and ultraviolet patterns.' },
  { title: 'What causes thunder', wiki: 'Thunder', hook: 'Thunder is the sound of rapidly expanding air from lightning.' }
];

var TEEN_SITUATION_HOOKS = [
  'You keep unlocking your phone with no reason',
  'You say you will start tomorrow every night',
  'You study after scrolling for an hour',
  'You quit the hard task the moment it feels boring',
  'You check grades more than you practice'
];

async function fetchWikiquoteQuotes(pageTitle) {
  var title = String(pageTitle || '').replace(/ /g, '_');
  var url =
    'https://en.wikiquote.org/w/api.php?action=parse&page=' +
    encodeURIComponent(title) +
    '&prop=wikitext&format=json&formatversion=2';
  var res = await httpsGet(url);
  if (res.status !== 200) throw new Error('Wikiquote HTTP ' + res.status);
  var j = JSON.parse(res.data);
  if (j.error) throw new Error(j.error.info || 'wikiquote error');
  var wt = j.parse && j.parse.wikitext;
  if (!wt) throw new Error('no wikitext');
  var list = extractQuotesFromWikitext(wt).filter(isCleanQuote);
  return list.map(function (quote) {
    return {
      quote: quote,
      author: title.replace(/_/g, ' '),
      reference: 'Wikiquote:' + title
    };
  });
}

async function fetchWikipediaSummary(title) {
  var t = String(title || '').replace(/ /g, '_');
  var url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t);
  var res = await httpsGet(url);
  if (res.status !== 200) throw new Error('Wikipedia HTTP ' + res.status);
  var j = JSON.parse(res.data);
  return {
    title: j.title,
    extract: j.extract || '',
    thumbnail: (j.thumbnail && j.thumbnail.source) || null,
    url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page
  };
}

module.exports = {
  FIN_AUTHORS,
  STOIC_AUTHORS,
  ARCHIE_TOPIC_SEEDS,
  TEEN_SITUATION_HOOKS,
  fetchWikiquoteQuotes,
  fetchWikipediaSummary,
  isCleanQuote,
  stripWiki,
  extractQuotesFromWikitext
};
