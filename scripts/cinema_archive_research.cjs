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
  // search seeds only — not scripts; used to discover public articles
  'unsolved historical mystery site:en.wikipedia.org',
  'unsolved crime cold case historical',
  'forgotten disaster history documentary',
  'haunted historical site legend',
  'lost treasure history mystery',
  'unexplained historical event',
  'maritime mystery ship disappearance',
  'museum theft unsolved',
  'ancient discovery controversy',
  'vanished expedition polar arctic'
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

function httpGet(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(
        url,
        {
          headers: {
            'User-Agent': 'CinemaVanguardBot/2.0 (educational documentary; github.com/devmeziem)',
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

/** Wikipedia search → pick page not in history */
async function wikiSearch(q, history) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&srlimit=8&format=json&utf8=1';
  const raw = await httpGet(url);
  try {
    const j = JSON.parse(raw);
    const hits = j?.query?.search || [];
    const past = new Set(
      (history || []).map((h) => String(h.title || h.topic || '').toLowerCase())
    );
    for (const h of hits) {
      const title = h.title;
      if (!title) continue;
      if ([...past].some((p) => p && (title.toLowerCase().includes(p) || p.includes(title.toLowerCase())))) {
        continue;
      }
      return { title, snippet: stripHtml(h.snippet), pageid: h.pageid };
    }
    if (hits[0]) return { title: hits[0].title, snippet: stripHtml(hits[0].snippet), pageid: hits[0].pageid };
  } catch (_) {}
  return null;
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
    return {
      title: page.title,
      extract: String(page.extract || '').slice(0, 4500),
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumb: page.thumbnail?.source || null
    };
  } catch {
    return null;
  }
}

async function wikiImageQueries(title) {
  // Related file titles / categories via Wikipedia images
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
      if (name.length > 8 && !/logo|icon|map_of|flag of|commons-logo/i.test(name)) {
        queries.push(name.slice(0, 80));
      }
    }
  } catch (_) {}
  return queries.slice(0, 10);
}

async function enrichWithSearch(topicTitle) {
  const notes = [];
  try {
    const ddg = (await queryDuckDuckGo(topicTitle + ' history mystery', 5)) || [];
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
  // DDG HTML fallback
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
  if (/murder|theft|robbery|heist|trial|suspect|fbi|police|crime/.test(t)) return 'crime';
  if (/haunt|ghost|curse|paranormal|horror|eerie/.test(t)) return 'horror';
  if (/unsolved|vanished|disappear|mystery|unknown|untold/.test(t)) return 'untold_events';
  return 'history';
}

/** Soften death language for platform safety */
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
  // Ensure "allegedly" near accusation verbs if missing
  if (/\b(stole|poisoned|shot|strangled)\b/i.test(s) && !/allegedly/i.test(s)) {
    s = s.replace(/\b(stole|poisoned|shot|strangled)\b/i, 'allegedly $1');
  }
  return s;
}

const DISCLAIMER =
  'Disclaimer: This short is an educational dramatization based on publicly available historical records and reporting. Events involving harm are described with caution (including “allegedly” and non-graphic wording). Not legal advice. Sources may be incomplete; verify primary archives before drawing conclusions. #EducationalContent';

/**
 * Build full episode package for generate_documentary_movie_reel.cjs
 * Returns same shape: title, genre, era, sfxType, bgmQuery, scenes[{text,query}], hashtags, description
 */
async function researchAndBuildEpisode() {
  const history = loadHist();
  const seed = ARCHIVE_SEEDS[Math.floor(Math.random() * ARCHIVE_SEEDS.length)];
  console.log('[Cinema Research] archive seed search:', seed);

  let wikiHit = await wikiSearch(seed, history);
  if (!wikiHit) {
    wikiHit = await wikiSearch('unsolved historical mystery', history);
  }
  if (!wikiHit) throw new Error('Cinema research: no Wikipedia candidate found');

  console.log('[Cinema Research] candidate:', wikiHit.title);
  const article = await wikiExtract(wikiHit.title);
  if (!article || !article.extract || article.extract.length < 200) {
    throw new Error('Cinema research: Wikipedia extract too thin for ' + wikiHit.title);
  }

  const extra = await enrichWithSearch(wikiHit.title);
  const imgQueries = await wikiImageQueries(wikiHit.title);
  const genre = pickGenre(article.extract + ' ' + wikiHit.snippet);

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

${article.extract.slice(0, 3500)}

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

  // Clamp genre
  if (!GENRES.includes(String(data.genre || '').toLowerCase())) data.genre = genre;
  data.genre = String(data.genre).toLowerCase();
  if (data.genre === 'story') data.genre = 'untold_events';

  // Soften language on all scene text
  data.scenes = data.scenes.map((s) => ({
    text: softenLegalLanguage(s.text),
    query: String(s.query || article.title).slice(0, 100)
  }));

  // Prefer Wikimedia-style queries when AI query is too abstract
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
