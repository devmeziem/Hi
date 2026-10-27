#!/usr/bin/env node
/**
 * Driftreel: live Wikipedia article → short documentary episode + Commons media queries.
 * Never uses Ghost Blimp / Amber Room seed vault.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const HIST = path.join(process.cwd(), 'data', 'cinema_wiki_history.json');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'DriftreelBot/1.0 (education; github.com/devmeziem)' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(httpGet(res.headers.location));
        }
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      }
    );
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function loadHist() {
  try {
    return JSON.parse(fs.readFileSync(HIST, 'utf8'));
  } catch {
    return [];
  }
}

function saveHist(entry) {
  const h = loadHist();
  h.push({ ...entry, at: new Date().toISOString() });
  while (h.length > 80) h.shift();
  fs.mkdirSync(path.dirname(HIST), { recursive: true });
  fs.writeFileSync(HIST, JSON.stringify(h, null, 2));
}

const SEED_TITLES = [
  'List of unsolved deaths',
  'List of people who disappeared mysteriously',
  'List of maritime disasters',
  'List of aviation accidents and incidents',
  'List of major exploration achievements and disasters',
  'List of unsolved murders',
  'List of lost treasures',
  'List of shipwrecks',
  'Dyatlov Pass incident',
  'Mary Celeste',
  'Roanoke Colony',
  'Flannan Isles Lighthouse',
  'SS Ourang Medan',
  'Carroll A. Deering',
  'Sodder children disappearance'
];

async function wikiSummary(title) {
  const url =
    'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'));
  const raw = await httpGet(url);
  const j = JSON.parse(raw);
  if (j.type === 'disambiguation' || j.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
    return null;
  }
  return {
    title: j.title || title,
    extract: String(j.extract || '').trim(),
    description: j.description || '',
    thumbnail: (j.thumbnail && j.thumbnail.source) || null,
    pageUrl: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || ''
  };
}

async function randomLinkedTitle(listTitle) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=parse&page=' +
    encodeURIComponent(listTitle) +
    '&prop=links&format=json&formatversion=2';
  const raw = await httpGet(url);
  const j = JSON.parse(raw);
  const links = (j.parse && j.parse.links) || [];
  const candidates = links
    .map((l) => l.title)
    .filter(
      (t) =>
        t &&
        !t.includes(':') &&
        t.length > 4 &&
        t.length < 70 &&
        !/^List of/i.test(t) &&
        !/^Category:/i.test(t)
    );
  if (!candidates.length) return null;
  // shuffle pick
  for (let i = 0; i < 12; i++) {
    const t = candidates[Math.floor(Math.random() * candidates.length)];
    const hist = loadHist();
    if (hist.some((h) => h.title === t)) continue;
    return t;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function splitScenes(extract, title) {
  const text = extract.replace(/\s+/g, ' ').trim();
  if (text.length < 120) return null;
  // ~5 beats from sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let buf = '';
  for (const s of sentences) {
    buf = (buf + ' ' + s).trim();
    if (buf.split(/\s+/).length >= 18) {
      chunks.push(buf);
      buf = '';
    }
  }
  if (buf) chunks.push(buf);
  while (chunks.length < 5 && chunks.length > 0) {
    // pad by splitting longest
    const i = chunks.reduce((bi, c, idx, arr) => (c.length > arr[bi].length ? idx : bi), 0);
    const mid = Math.floor(chunks[i].length / 2);
    const sp = chunks[i].lastIndexOf(' ', mid);
    if (sp > 20) {
      const a = chunks[i].slice(0, sp).trim();
      const b = chunks[i].slice(sp).trim();
      chunks.splice(i, 1, a, b);
    } else break;
  }
  const scenes = chunks.slice(0, 6).map((c, i) => ({
    text: c.slice(0, 220),
    query: `${title} historical archive photograph scene ${i + 1}`
  }));
  if (scenes.length < 4) return null;
  return scenes;
}

async function buildWikiDocumentaryEpisode() {
  const list = SEED_TITLES[Math.floor(Math.random() * SEED_TITLES.length)];
  let title = await randomLinkedTitle(list);
  if (!title) title = 'Mary Celeste';

  // try a few titles until extract is rich enough
  let summary = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) {
      title = (await randomLinkedTitle(list)) || title;
    }
    summary = await wikiSummary(title);
    if (summary && summary.extract && summary.extract.length > 180) break;
    summary = null;
  }
  if (!summary) throw new Error('No usable Wikipedia extract');

  const scenes = splitScenes(summary.extract, summary.title);
  if (!scenes) throw new Error('Could not split Wikipedia extract into scenes');

  // First scene visual prefers real thumbnail concept
  if (summary.thumbnail) {
    scenes[0].query = summary.title + ' historical photograph archival';
  }

  const genrePool = ['history', 'crime', 'story', 'horror'];
  const genre = genrePool[Math.floor(Math.random() * genrePool.length)];

  const episode = {
    title: String(summary.title).slice(0, 48),
    genre,
    era: (summary.description || 'Historical record').slice(0, 40),
    sfxType: genre === 'horror' ? 'creak' : genre === 'crime' ? 'rain' : 'projector',
    bgmQuery: 'dark ambient documentary strings no drums',
    scenes,
    hashtags: ['#Driftreel', '#Documentary', '#TrueHistory', '#Shorts', '#FYP'],
    source: 'wikipedia',
    pageUrl: summary.pageUrl
  };

  saveHist({ title: episode.title, list });
  return episode;
}

module.exports = { buildWikiDocumentaryEpisode };

if (require.main === module) {
  buildWikiDocumentaryEpisode()
    .then((e) => {
      console.log(JSON.stringify(e, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
