#!/usr/bin/env node
/**
 * Cinema Vanguard — live open-source archive research (NO seed vault)
 * Genres only: history | horror | crime | untold_events
 * Sources: Wikipedia/Wikimedia, DuckDuckGo, Google News RSS
 * AI writes script from research only; dedup vs past documentary titles
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { callActiveAiForJson, queryDuckDuckGo, queryGoogleNewsRss } = require('./topic_discovery_engine.cjs');

const GENRES = ['history', 'horror', 'crime', 'untold_events'];
const HIST_PATH = path.join(process.cwd(), 'data', 'cinema_topic_history.json');

const ARCHIVE_SEEDS = [
  'Dyatlov Pass incident',
  'Mary Celeste',
  'Roanoke Colony',
  'Flannan Isles Lighthouse',
  'Ourang Medan',
  'SS Waratah',
  'Carroll A. Deering',
  'S.S. Baychimo',
  'Tamam Shud case',
  'Isdal Woman',
  'Somerton Man',
  'Amber Room',
  'Oak Island money pit',
  'Beale ciphers',
  'Voynich manuscript',
  'Antikythera mechanism',
  'Pharaoh Tutankhamun curse legend',
  'Philadelphia Experiment legend',
  'Max Headroom broadcast signal intrusion',
  'Hinterkaifeck murders',
  'Villisca axe murders',
  'Zodiac Killer unsolved letters',
  'DB Cooper hijacking',
  'Black Dahlia investigation',
  'Gardner Museum theft',
  'Goya theft from National Gallery',
  'Great Train Robbery aftermath',
  'USS Cyclops disappearance',
  'Flight 19 Bermuda Triangle',
  'Kinross incident',
  'Mantell UFO incident',
  'Kecksburg incident',
  'Hessdalen lights',
  'Taos Hum',
  'Bloop ocean sound',
  'Wow signal',
  'Piri Reis map',
  'Piri Reis 1513',
  'Yonaguni Monument',
  'Gobekli Tepe discovery',
  'Nazca Lines theories',
  'Lost City of Z Percy Fawcett',
  'Colonel Fawcett expedition',
  'Shackleton Endurance discovery',
  'Terra Nova expedition Scott',
  'Franklin expedition Arctic',
  'Andrée polar balloon expedition',
  'Hindenburg disaster investigation',
  'Titanic wireless warnings',
  'Lusitania controversy'
];

function loadHist() {
  try {
    if (!fs.existsSync(HIST_PATH)) return [];
    const j = JSON.parse(fs.readFileSync(HIST_PATH, 'utf8'));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveHist(entry) {
  const h = loadHist();
  h.push({ ...entry, at: new Date().toISOString() });
  fs.mkdirSync(path.dirname(HIST_PATH), { recursive: true });
  fs.writeFileSync(HIST_PATH, JSON.stringify(h.slice(-200), null, 2));
}

function httpGet(url, timeoutMs = 14000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(
        url,
        {
          headers: {
            'User-Agent': 'CinemaVanguardBot/2.1 (educational documentary; github.com/devmeziem)',
            Accept: 'application/json,text/html,*/*'
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(httpGet(res.headers.location, timeoutMs));
          }
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(d));
        }
      );
      req.on('error', () => resolve(''));
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBadWikiTitle(title) {
  const t = String(title || '').toLowerCase();
  if (!t) return true;
  // Skip list/index/disambiguation pages — thin extracts
  if (/^list of\b/.test(t)) return true;
  if (/\bindex of\b/.test(t)) return true;
  if (/\(disambiguation\)/.test(t)) return true;
  if (/^category:/.test(t)) return true;
  if (/^timeline of\b/.test(t)) return true;
  if (/^outline of\b/.test(t)) return true;
  if (/^bibliography of\b/.test(t)) return true;
  if (/^glossary of\b/.test(t)) return true;
  return false;
}

/** Wikipedia search → ranked candidates not in history */
async function wikiSearchMany(q, history, limit = 10) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&srlimit=' +
    limit +
    '&format=json&utf8=1';
  const raw = await httpGet(url);
  const out = [];
  try {
    const j = JSON.parse(raw);
    const hits = j?.query?.search || [];
    const past = new Set(
      (history || []).map((h) => String(h.title || h.topic || h.sourceTitle || '').toLowerCase())
    );
    for (const h of hits) {
      const title = h.title;
      if (!title || isBadWikiTitle(title)) continue;
      const low = title.toLowerCase();
      if ([...past].some((p) => p && (low.includes(p) || p.includes(low)))) continue;
      out.push({ title, snippet: stripHtml(h.snippet), pageid: h.pageid });
    }
  } catch (_) {}
  return out;
}

async function wikiExtract(title) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=0&explaintext=1&piprop=thumbnail&pithumbsize=800&inprop=url&titles=' +
    encodeURIComponent(title) +
    '&format=json&utf8=1';
  const raw = await httpGet(url);
  try {
    const j = JSON.parse(raw);
    const pages = j?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing) return null;
    // Redirect / thin list pages still sometimes slip through
    if (isBadWikiTitle(page.title)) return null;
    const extract = String(page.extract || '').trim();
    return {
      title: page.title,
      extract: extract.slice(0, 5000),
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumb: page.thumbnail?.source || null
    };
  } catch {
    return null;
  }
}

async function wikiImageQueries(title) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(title) +
    '&prop=images&imlimit=12&format=json';
  const raw = await httpGet(url);
  const queries = [];
  try {
    const j = JSON.parse(raw);
    const pages = j?.query?.pages || {};
    const page = Object.values(pages)[0];
    const imgs = page?.images || [];
    for (const im of imgs) {
      const name = String(im.title || '')
        .replace(/^File:/i, '')
        .replace(/\.(jpg|jpeg|png|gif|svg|webp)$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      if (name.length > 8 && !/logo|icon|map of|flag of|commons-logo/i.test(name)) {
        queries.push(name.slice(0, 80));
      }
    }
  } catch (_) {}
  return queries.slice(0, 10);
}

async function enrichWithSearch(topicTitle) {
  const notes = [];
  try {
    const ddg = (await queryDuckDuckGo(topicTitle + ' history mystery documentary', 5)) || [];
    for (const r of ddg) {
      notes.push({
        source: 'duckduckgo',
        title: r.title,
        snippet: r.snippet || r.body || ''
      });
    }
  } catch (_) {}
  try {
    const news = (await queryGoogleNewsRss(topicTitle, 4)) || [];
    for (const r of news) {
      notes.push({ source: 'google_news', title: r.title, snippet: r.snippet || '' });
    }
  } catch (_) {}
  if (!notes.length) {
    const html = await httpGet(
      'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(topicTitle + ' documentary facts')
    );
    const blocks = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) || [];
    for (const b of blocks.slice(0, 5)) {
      const snippet = stripHtml(b);
      if (snippet.length > 40) notes.push({ source: 'duckduckgo_html', title: snippet.slice(0, 80), snippet });
    }
  }
  return notes;
}

function pickGenre(text) {
  const t = String(text || '').toLowerCase();
  if (/murder|theft|robbery|heist|trial|suspect|fbi|police|crime|hijack/.test(t)) return 'crime';
  if (/haunt|ghost|curse|paranormal|horror|eerie/.test(t)) return 'horror';
  if (/unsolved|vanished|disappear|mystery|unknown|untold|incident/.test(t)) return 'untold_events';
  return 'history';
}

function softenLegalLanguage(text) {
  let s = String(text || '');
  s = s.replace(/\b(was |were |is |are )?(killed|murdered|slain|executed)\b/gi, (m, pre) => {
    return (pre || '') + 'allegedly unalived';
  });
  s = s.replace(/\b(died|dead|death of|deaths)\b/gi, (m) => {
    if (/unalived|allegedly/i.test(s.slice(Math.max(0, s.indexOf(m) - 20), s.indexOf(m) + 40))) return m;
    if (/^death$/i.test(m)) return 'passing';
    if (/^died$/i.test(m)) return 'was allegedly unalived';
    if (/^dead$/i.test(m)) return 'no longer living';
    if (/death of/i.test(m)) return 'passing of';
    if (/deaths/i.test(m)) return 'passings';
    return m;
  });
  s = s.replace(/\bassassinat(ed|ion)\b/gi, 'allegedly targeted');
  if (/\b(stole|poisoned|shot|strangled)\b/i.test(s) && !/allegedly/i.test(s)) {
    s = s.replace(/\b(stole|poisoned|shot|strangled)\b/i, 'allegedly $1');
  }
  return s;
}

const DISCLAIMER =
  'Disclaimer: This short is an educational dramatization based on publicly available historical records and reporting. Events involving harm are described with caution (including “allegedly” and non-graphic wording). Not legal advice. Sources may be incomplete; verify primary archives before drawing conclusions. #EducationalContent';

/**
 * Pick a Wikipedia article with enough extract (skip lists).
 */
async function findRichArticle(history) {
  // Shuffle seeds so each run explores different topics
  const seeds = [...ARCHIVE_SEEDS].sort(() => Math.random() - 0.5);
  const tried = new Set();

  for (const seed of seeds.slice(0, 12)) {
    console.log('[Cinema Research] try seed:', seed);
    // Prefer exact/title-ish search first
    let candidates = await wikiSearchMany(seed, history, 8);
    if (!candidates.length) {
      candidates = await wikiSearchMany(seed + ' unsolved OR mystery OR incident', history, 8);
    }
    // Also try the seed as a direct title extract
    if (!candidates.some((c) => c.title.toLowerCase() === seed.toLowerCase())) {
      candidates.unshift({ title: seed, snippet: seed, pageid: 0 });
    }

    for (const hit of candidates) {
      if (tried.has(hit.title)) continue;
      tried.add(hit.title);
      if (isBadWikiTitle(hit.title)) continue;

      console.log('[Cinema Research] candidate:', hit.title);
      const article = await wikiExtract(hit.title);
      if (!article) continue;
      if (isBadWikiTitle(article.title)) continue;
      if (!article.extract || article.extract.length < 400) {
        console.log('[Cinema Research] thin extract, skip:', article.title, article.extract?.length || 0);
        continue;
      }
      // Prefer narrative pages over pure lists that slipped through
      if (/^this is a list of\b/i.test(article.extract.slice(0, 80))) continue;

      return { article, seed, hit };
    }
  }
  return null;
}

async function researchAndBuildEpisode() {
  const history = loadHist();
  const found = await findRichArticle(history);
  if (!found) throw new Error('Cinema research: no rich Wikipedia article found after retries');

  const { article, seed, hit } = found;
  console.log('[Cinema Research] locked:', article.title, 'chars=', article.extract.length);

  const extra = await enrichWithSearch(article.title);
  const imgQueries = await wikiImageQueries(article.title);
  const genre = pickGenre(article.extract + ' ' + (hit.snippet || ''));

  const systemPrompt = `You are a documentary showrunner for Cinema Vanguard.
Return STRICT JSON only.

ALLOWED GENRES ONLY: history | horror | crime | untold_events
Use genre: "${genre}" unless research clearly forces another of the four.

RULES:
1. Base EVERY claim on the research packet. Do not invent named people, dates, or crimes not present in sources.
2. Scenes: between 5 and 10 (prefer 7 if research is rich). Continuous narrative arc.
3. Each scene.text: 18-28 spoken words. Each scene.query: concrete Wikimedia/Pexels-style search (places, objects, archives, not abstract words).
4. LEGAL TONE: For any killing/death/violence use "unalived" / "passing" and "allegedly" where responsibility is not adjudicated in the text. No graphic gore.
5. title max 55 chars. era like "1892 • New Orleans" or "1945 • Baltic Coast".
6. sfxType one of: creak | rain | wind | clock | projector
7. bgmQuery: 4-7 word instrumental search.
8. hashtags include #CinemaVanguard #Documentary and genre tags.
9. description: 2-4 sentences for YouTube/TikTok summarizing the case WITHOUT graphic detail.

JSON:
{
  "title": "...",
  "genre": "${genre}",
  "era": "...",
  "sfxType": "projector",
  "bgmQuery": "dark archival strings ambient tension",
  "scenes": [ { "text": "...", "query": "..." } ],
  "hashtags": ["#CinemaVanguard", "#Documentary"],
  "description": "..."
}`;

  const userPrompt = `PRIMARY SOURCE (Wikipedia extract):
Title: ${article.title}
URL: ${article.url}

${article.extract.slice(0, 3800)}

SECONDARY SNIPPETS:
${extra
  .slice(0, 8)
  .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${String(n.snippet).slice(0, 200)}`)
  .join('\n') || '(none)'}

Wikimedia-related visual phrases (prefer these in queries when relevant):
${imgQueries.join(' | ') || article.title}

Already used titles (do not repeat):
${history
  .slice(-25)
  .map((h) => h.title)
  .filter(Boolean)
  .join(' | ') || 'none'}

Build the documentary package now.`;

  let data = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'documentary',
        temperature: 0.55 + attempt * 0.08
      });
      data = res?.data || res;
      if (
        data?.title &&
        Array.isArray(data.scenes) &&
        data.scenes.length >= 5 &&
        data.scenes.length <= 10 &&
        data.scenes.every((s) => s.text && s.query)
      ) {
        break;
      }
      data = null;
    } catch (e) {
      console.warn(`[Cinema Research] AI attempt ${attempt}:`, e.message);
    }
  }
  if (!data) throw new Error('Cinema research: AI package failed — no seed fallback');

  if (!GENRES.includes(String(data.genre || '').toLowerCase())) data.genre = genre;
  data.genre = String(data.genre).toLowerCase();
  if (data.genre === 'story') data.genre = 'untold_events';

  data.scenes = data.scenes.map((s) => ({
    text: softenLegalLanguage(s.text),
    query: String(s.query || article.title).slice(0, 100)
  }));

  for (let i = 0; i < data.scenes.length; i++) {
    if (imgQueries[i] && data.scenes[i].query.split(' ').length < 3) {
      data.scenes[i].query = imgQueries[i];
    }
  }

  data.description = softenLegalLanguage(
    String(data.description || data.title) + '\n\n' + DISCLAIMER
  );
  data.archiveQuery = seed;
  data.sourceUrl = article.url;
  data.sourceTitle = article.title;
  if (!data.sfxType) data.sfxType = data.genre === 'horror' ? 'creak' : data.genre === 'crime' ? 'rain' : 'projector';
  if (!data.bgmQuery) data.bgmQuery = 'dark archival documentary strings ambient';
  if (!Array.isArray(data.hashtags)) data.hashtags = ['#CinemaVanguard', '#Documentary', '#Shorts'];

  saveHist({
    title: data.title,
    sourceTitle: article.title,
    genre: data.genre,
    sourceUrl: article.url
  });

  console.log(
    `[Cinema Research] OK "${data.title}" genre=${data.genre} scenes=${data.scenes.length} src=${article.title}`
  );
  return data;
}

module.exports = {
  researchAndBuildEpisode,
  softenLegalLanguage,
  DISCLAIMER,
  GENRES
};
