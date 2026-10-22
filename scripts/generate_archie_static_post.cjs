#!/usr/bin/env node
/**
 * Archie static FB/IG — LIVE public facts (not a fixed topic bank)
 *
 * Flow:
 * 1) Discover topic from Wikimedia random, Wikipedia, Google News RSS, DuckDuckGo
 *    (science / tech / archaeology / biology / space)
 * 2) AI shapes: short on-image question OR one-line hook + full caption text
 * 3) Image: Wikimedia Commons search → Unsplash/Pexels fallback
 * 4) Bottom-third text on image; full teaching in post caption
 * 5) Dedup via data/archie_static_history.json
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const ART = path.join(process.cwd(), 'test_artifacts');
const OUT_DIR = path.join(ART, 'infocards');
const HIST = path.join(process.cwd(), 'data', 'archie_static_history.json');
const LATEST_PNG = path.join(ART, 'infocard_latest.png');
const MANIFEST = path.join(ART, 'infocard_manifest.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(HIST), { recursive: true });

let callActiveAiForJson, queryDuckDuckGo, queryGoogleNewsRss;
try {
  const tde = require('./topic_discovery_engine.cjs');
  callActiveAiForJson = tde.callActiveAiForJson;
  queryDuckDuckGo = tde.queryDuckDuckGo;
  queryGoogleNewsRss = tde.queryGoogleNewsRss;
} catch (e) {
  console.warn('[archie-static] topic engine:', e.message);
}

function loadHist() {
  try {
    return JSON.parse(fs.readFileSync(HIST, 'utf8'));
  } catch {
    return { used: [] };
  }
}
function saveHist(h) {
  fs.writeFileSync(HIST, JSON.stringify(h, null, 2));
}

function httpGet(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.get(
        url,
        {
          headers: {
            'User-Agent': 'ArchieExplorerBot/1.0 (education; github.com/devmeziem)',
            Accept: 'application/json,text/html,*/*'
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(httpGet(res.headers.location, timeoutMs));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            if (res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode));
            resolve(buf);
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('timeout'));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function httpGetText(url) {
  const b = await httpGet(url);
  return b.toString('utf8');
}

async function discoverLiveCandidates() {
  const buckets = [
    { niche: 'tech', q: 'breakthrough technology OR semiconductor OR AI research' },
    { niche: 'biology', q: 'biology discovery OR genetics OR neuroscience fact' },
    { niche: 'archaeology', q: 'archaeology discovery OR ancient civilization find' },
    { niche: 'space', q: 'astronomy OR NASA OR space telescope discovery' },
    { niche: 'physics', q: 'physics phenomenon OR quantum OR particle science' },
    { niche: 'earth', q: 'geology OR climate science OR ocean discovery' }
  ];
  const pick = buckets[Math.floor(Math.random() * buckets.length)];
  const candidates = [];

  // Wikipedia random related search
  try {
    const wikiSearch =
      'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
      encodeURIComponent(pick.q) +
      '&srlimit=6&format=json&origin=*';
    const raw = await httpGetText(wikiSearch);
    const j = JSON.parse(raw);
    for (const s of (j.query && j.query.search) || []) {
      candidates.push({
        source: 'wikipedia',
        niche: pick.niche,
        title: s.title,
        snippet: String(s.snippet || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        page: s.title
      });
    }
  } catch (e) {
    console.warn('[archie-static] wiki search:', e.message);
  }

  // Wikimedia Commons featured / search for visual topics
  try {
    const commons =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent(pick.niche + ' science photograph') +
      '&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json';
    const raw = await httpGetText(commons);
    const j = JSON.parse(raw);
    const pages = (j.query && j.query.pages) || {};
    for (const id of Object.keys(pages)) {
      const p = pages[id];
      const info = (p.imageinfo && p.imageinfo[0]) || {};
      const meta = info.extmetadata || {};
      const desc = (meta.ImageDescription && meta.ImageDescription.value) || p.title || '';
      const clean = String(desc).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
      if (info.thumburl || info.url) {
        candidates.push({
          source: 'wikimedia_commons',
          niche: pick.niche,
          title: (p.title || '').replace(/^File:/, '').slice(0, 120),
          snippet: clean,
          imageUrl: info.thumburl || info.url
        });
      }
    }
  } catch (e) {
    console.warn('[archie-static] commons:', e.message);
  }

  // News RSS
  if (queryGoogleNewsRss) {
    try {
      const news = (await queryGoogleNewsRss(pick.q, 6)) || [];
      for (const n of news) {
        candidates.push({
          source: 'google_news',
          niche: pick.niche,
          title: String(n.title || '').slice(0, 140),
          snippet: String(n.snippet || n.title || '').slice(0, 280)
        });
      }
    } catch (e) {
      console.warn('[archie-static] news:', e.message);
    }
  }

  if (queryDuckDuckGo) {
    try {
      const ddg = (await queryDuckDuckGo(pick.q + ' explained', 5)) || [];
      for (const r of ddg) {
        candidates.push({
          source: 'duckduckgo',
          niche: pick.niche,
          title: String(r.title || '').slice(0, 140),
          snippet: String(r.snippet || r.body || '').slice(0, 280)
        });
      }
    } catch (e) {
      console.warn('[archie-static] ddg:', e.message);
    }
  }

  console.log('[archie-static] niche=', pick.niche, 'candidates=', candidates.length);
  return { niche: pick.niche, candidates };
}

async function fetchWikiLead(title) {
  try {
    const url =
      'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'));
    const raw = await httpGetText(url);
    const j = JSON.parse(raw);
    return {
      title: j.title || title,
      extract: String(j.extract || '').slice(0, 600),
      thumb: j.thumbnail && j.thumbnail.source
    };
  } catch {
    return null;
  }
}

async function buildWithAi(niche, candidates, history) {
  const used = (history.used || []).slice(-40).map((x) => x.id || x.title).filter(Boolean);
  const systemPrompt = `You create engaging science/tech Instagram+Facebook educational cards for Archie the Explorer (teen-friendly, accurate).
Return STRICT JSON only.

Rules:
- Use the live candidate facts — do not invent hard numbers or false claims.
- Format rotates: quiz | fact | news_hook | did_you_know
- screenText: max 10 words, question or short hook for BOTTOM of image (no paragraph)
- caption: 4-8 short lines for the post body (full teaching + optional answer)
- If quiz: include options A-D and answer letter + one-line explanation in caption
- Tags: 5-8 hashtags including #ArchieExplains
- imageQuery: 3-6 word stock/Commons search for a real photo matching the topic
- topicId: short slug unique for dedup

JSON:
{
  "format": "quiz|fact|news_hook|did_you_know",
  "topicId": "slug",
  "title": "...",
  "screenText": "short question or hook",
  "caption": "multiline caption",
  "imageQuery": "search words",
  "tags": ["#..."],
  "niche": "${niche}"
}`;

  const userPrompt = `Niche: ${niche}

Live candidates:
${candidates
  .slice(0, 12)
  .map((c, i) => `${i + 1}. [${c.source}] ${c.title} — ${c.snippet}`)
  .join('\n')}

Avoid repeating these topicIds/titles: ${used.join(' | ') || 'none'}

Build one card now.`;

  if (!callActiveAiForJson) throw new Error('AI unavailable');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'cartoon',
        temperature: 0.65 + attempt * 0.05
      });
      const data = res?.data || res;
      if (data && data.screenText && data.caption && data.topicId) return data;
    } catch (e) {
      console.warn('[archie-static] AI attempt', attempt, e.message);
    }
  }
  throw new Error('AI package failed');
}

/** Fallback without AI: use Wikipedia lead */
async function buildWithoutAi(candidates, history) {
  const used = new Set((history.used || []).map((x) => x.id || x.title));
  for (const c of candidates) {
    if (used.has(c.title) || used.has(c.page)) continue;
    let extract = c.snippet;
    let thumb = c.imageUrl;
    if (c.source === 'wikipedia' && c.page) {
      const lead = await fetchWikiLead(c.page);
      if (lead) {
        extract = lead.extract || extract;
        thumb = lead.thumb || thumb;
        c.title = lead.title || c.title;
      }
    }
    if (!extract || extract.length < 40) continue;
    const screenText = (c.title || 'Did you know?').slice(0, 48);
    const caption = [
      c.title,
      '',
      extract.slice(0, 420),
      '',
      '— Archie the Explorer',
      '',
      '#ArchieExplains #Science #Tech #DidYouKnow #LearnOnInstagram'
    ].join('\n');
    return {
      format: 'fact',
      topicId: String(c.title || 'fact')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 48),
      title: c.title,
      screenText,
      caption,
      imageQuery: c.title,
      imageUrl: thumb,
      tags: ['#ArchieExplains', '#Science', '#DidYouKnow'],
      niche: c.niche || 'science'
    };
  }
  throw new Error('No usable public candidate');
}

async function fetchImageBuffer(card) {
  // Prefer URL from commons/wiki if present
  if (card.imageUrl) {
    try {
      return await httpGet(card.imageUrl);
    } catch (_) {}
  }
  const q = encodeURIComponent(card.imageQuery || card.title || 'science');
  // Unsplash source (no key required for source endpoint)
  try {
    return await httpGet('https://source.unsplash.com/1080x1350/?' + q);
  } catch (_) {}
  try {
    return await httpGet('https://picsum.photos/1080/1350');
  } catch (_) {}
  throw new Error('No image');
}

function renderCard(imgPath, screenText, outPng) {
  const safe = String(screenText || '')
    .replace(/[:\\]/g, ' ')
    .replace(/'/g, "'")
    .slice(0, 70);
  // Bottom third, bold white text, dark bar for readability — not a text wall
  const vf = [
    'scale=1080:1350:force_original_aspect_ratio=increase',
    'crop=1080:1350',
    "drawbox=x=0:y=ih*0.72:w=iw:h=ih*0.28:color=black@0.55:t=fill",
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safe.replace(/'/g, "\\'")}':fontsize=42:fontcolor=white:borderw=2:bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.82-text_h/2`
  ].join(',');
  execSync(
    `ffmpeg -y -i "${imgPath}" -vf "${vf}" -frames:v 1 "${outPng}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  console.log('\n=== ARCHIE STATIC LIVE (Wikimedia/News + AI) ===\n');
  const history = loadHist();
  const { niche, candidates } = await discoverLiveCandidates();
  if (!candidates.length) throw new Error('Zero live candidates');

  let card;
  try {
    card = await buildWithAi(niche, candidates, history);
  } catch (e) {
    console.warn('[archie-static] AI fallback:', e.message);
    card = await buildWithoutAi(candidates, history);
  }

  // Attach commons image if candidate matched title loosely
  for (const c of candidates) {
    if (c.imageUrl && (!card.imageUrl) && String(c.title).toLowerCase().includes(String(card.title || '').slice(0, 12).toLowerCase())) {
      card.imageUrl = c.imageUrl;
      break;
    }
  }
  if (!card.imageUrl) {
    const withImg = candidates.find((c) => c.imageUrl);
    if (withImg) card.imageUrl = withImg.imageUrl;
  }

  const buf = await fetchImageBuffer(card);
  const rawImg = path.join(OUT_DIR, `raw_${Date.now()}.jpg`);
  fs.writeFileSync(rawImg, buf);

  const outPng = path.join(OUT_DIR, `card_${Date.now()}.png`);
  renderCard(rawImg, card.screenText, outPng);
  fs.copyFileSync(outPng, LATEST_PNG);

  const manifest = {
    format: card.format,
    topicId: card.topicId,
    title: card.title,
    screenText: card.screenText,
    caption: card.caption,
    tags: card.tags,
    niche: card.niche || niche,
    imagePath: LATEST_PNG,
    createdAt: new Date().toISOString(),
    source: 'live_wikimedia_news_ai'
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  history.used = history.used || [];
  history.used.push({ id: card.topicId, title: card.title, at: Date.now(), niche: manifest.niche });
  if (history.used.length > 200) history.used = history.used.slice(-200);
  saveHist(history);

  console.log('[archie-static] OK', manifest.title);
  console.log('[archie-static] screen:', manifest.screenText);
  console.log('[archie-static] caption sample:', String(manifest.caption).slice(0, 160));
}

main().catch((e) => {
  console.error('[archie-static] FAIL', e.message);
  process.exit(1);
});
