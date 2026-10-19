#!/usr/bin/env node
/**
 * Fin live quote — EVERY run must be unique:
 * - Live Wikiquote (new author/quote via history)
 * - New image (portrait attempt + rotating Unsplash, no fixed single stock)
 * - New BGM (audio_asset_manager rotation or varied pad)
 * - Unique algorithm-friendly titles (never same template every post)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, loadHistory, saveHistory, isDuplicate, normalizeQuote } = require('./content_system_shared.cjs');
const { FIN_AUTHORS, fetchWikiquoteQuotes } = require('./public_sources.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts');
const HISTORY = path.join(process.cwd(), 'fin_quote_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const DUR = 5.0;
const runId = Date.now();

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      https
        .get(u, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, n + 1);
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        })
        .on('error', reject);
    };
    get(url);
  });
}

async function pickLiveQuote() {
  const history = loadHistory(HISTORY);
  const authors = [...FIN_AUTHORS].sort(() => Math.random() - 0.5);
  for (const page of authors) {
    try {
      console.log('[Fin] Wikiquote', page);
      const list = await fetchWikiquoteQuotes(page);
      console.log('[Fin] got', list.length, 'quotes');
      for (const q of list.sort(() => Math.random() - 0.5)) {
        if (!isDuplicate(q, history, { authorWindow: 8, overlapMax: 0.32 })) {
          saveHistory(HISTORY, q);
          return q;
        }
      }
    } catch (e) {
      console.warn('[Fin]', page, e.message);
    }
  }
  for (const page of authors) {
    try {
      const list = await fetchWikiquoteQuotes(page);
      const fresh = list.find((q) => !history.some((h) => normalizeQuote(h.quote) === normalizeQuote(q.quote)));
      if (fresh) {
        saveHistory(HISTORY, fresh);
        return fresh;
      }
      if (list[0]) {
        saveHistory(HISTORY, list[0]);
        return list[0];
      }
    } catch (_) {}
  }
  throw new Error('No live Wikiquote finance quote');
}

async function wikiPortrait(author) {
  try {
    const title = author.replace(/\s+/g, '_');
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title);
    const data = await new Promise((resolve, reject) => {
      https
        .get(url, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(b));
            } catch (e) {
              reject(e);
            }
          });
        })
        .on('error', reject);
    });
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/** Rotating Unsplash pool — different photo every run */
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1080&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&q=80',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1080&q=80',
  'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&q=80',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1080&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1080&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&q=80'
];

async function pickImage(author, dest) {
  // 1) try Wikipedia portrait (unique per author)
  const port = await wikiPortrait(author);
  if (port && !String(port).endsWith('.svg')) {
    try {
      await download(String(port).replace(/\/\d+px-/, '/800px-'), dest);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
        console.log('[Fin] image: Wikipedia portrait');
        return 'portrait';
      }
    } catch (_) {}
  }
  // 2) Unsplash via API if key present
  const key = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '').trim();
  if (key) {
    try {
      const q = encodeURIComponent('finance business desk charts abstract');
      const api =
        'https://api.unsplash.com/photos/random?query=' + q + '&orientation=portrait&client_id=' + key;
      const j = await new Promise((resolve, reject) => {
        https
          .get(api, { headers: { 'User-Agent': 'FinBot/1.0' } }, (res) => {
            let b = '';
            res.on('data', (c) => (b += c));
            res.on('end', () => {
              try {
                resolve(JSON.parse(b));
              } catch (e) {
                reject(e);
              }
            });
          })
          .on('error', reject);
      });
      const url = j?.urls?.regular || j?.urls?.full;
      if (url) {
        await download(url, dest);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
          console.log('[Fin] image: Unsplash random API');
          return 'unsplash-api';
        }
      }
    } catch (e) {
      console.warn('[Fin] Unsplash API', e.message);
    }
  }
  // 3) rotating pool — index by runId so consecutive runs differ
  const idx = Math.abs(runId + author.length) % IMAGE_POOL.length;
  await download(IMAGE_POOL[idx], dest);
  console.log('[Fin] image: pool #' + idx);
  return 'pool';
}

function makeUniqueBgm(outPath) {
  // Prefer real rotated track
  try {
    const { resolveRealMusicTrack } = require('./audio_asset_manager.cjs');
    const track = resolveRealMusicTrack({ channel: 'fin', durationSec: DUR });
    if (track && track.path && fs.existsSync(track.path)) {
      execSync(
        `ffmpeg -y -ss ${((runId % 40) + 5)} -i "${track.path}" -t ${DUR} -af "volume=${VOLUMES.fin.bgm},afade=t=in:d=0.4,afade=t=out:st=${DUR - 0.6}:d=0.5" -ar 44100 -ac 2 "${outPath}"`,
        { stdio: 'pipe' }
      );
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 2000) {
        console.log('[Fin] BGM: real track', path.basename(track.path));
        return;
      }
    }
  } catch (_) {}
  // Varied pad per run (different frequencies)
  const f1 = 90 + (runId % 7) * 8;
  const f2 = 140 + (runId % 5) * 11;
  const f3 = 200 + (runId % 6) * 9;
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=${f1}:duration=${DUR}" -f lavfi -i "sine=frequency=${f2}:duration=${DUR}" -f lavfi -i "sine=frequency=${f3}:duration=${DUR}" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=first,lowpass=f=700,volume=${VOLUMES.fin.bgm}" -ar 44100 -ac 2 "${outPath}"`,
    { stdio: 'pipe' }
  );
  console.log('[Fin] BGM: pad', f1, f2, f3);
}

function escapeDraw(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '').slice(0, 100);
}

/** Algorithm-friendly unique titles — never one template forever */
function buildTitle(live) {
  const q = live.quote;
  const a = live.author;
  const short = q.length > 48 ? q.slice(0, 45).trim() + '…' : q;
  const templates = [
    () => `${a}: "${short}"`,
    () => `What ${a.split(' ')[0]} knew about money`,
    () => `Read this before your next money decision`,
    () => `${a} on staying competent`,
    () => `A rule ${a.split(' ').slice(-1)[0]} never broke`,
    () => `Wealth mindset — ${a}`,
    () => `Stop repeating this money mistake`,
    () => `"${short}" — ${a}`
  ];
  const pick = templates[Math.abs(crypto.createHash('sha1').update(q).digest().readUInt32BE(0)) % templates.length];
  let title = pick();
  if (title.length > 95) title = title.slice(0, 92) + '…';
  return title;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const live = await pickLiveQuote();
  console.log('[Fin]', live.author, '—', live.quote.slice(0, 90));

  const imgPath = path.join(ART, `fin_img_${runId}.jpg`);
  const bgmPath = path.join(ART, `fin_bgm_${runId}.wav`);
  const outPath = path.join(OUT, `fin_quote_live_${runId}.mp4`);

  await pickImage(live.author, imgPath);
  if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 5000) throw new Error('HOLLOW: no image');

  makeUniqueBgm(bgmPath);
  if (!fs.existsSync(bgmPath) || fs.statSync(bgmPath).size < 1000) throw new Error('HOLLOW: no BGM');

  const q1 = escapeDraw(live.quote.slice(0, 55));
  const q2 = escapeDraw(live.quote.length > 55 ? live.quote.slice(55, 110) : '');
  const q3 = escapeDraw(live.quote.length > 110 ? live.quote.slice(110, 160) : '');
  const auth = escapeDraw('— ' + live.author);
  let draw = `drawtext=text='${q1}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h*0.58:shadowcolor=black:shadowx=2:shadowy=2`;
  if (q2) draw += `,drawtext=text='${q2}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h*0.64:shadowcolor=black:shadowx=2:shadowy=2`;
  if (q3) draw += `,drawtext=text='${q3}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h*0.70:shadowcolor=black:shadowx=2:shadowy=2`;
  draw += `,drawtext=text='${auth}':fontcolor=0xdddddd:fontsize=26:x=(w-text_w)/2:y=h*0.78`;

  const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0015,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(DUR * 30)}:s=1080x1920:fps=30,eq=brightness=-0.05:contrast=1.12:saturation=0.85,${draw}`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${bgmPath}" -vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 128k -t ${DUR} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );
  if (fs.statSync(outPath).size < 80000) throw new Error('HOLLOW: tiny output');

  const title = buildTitle(live);
  console.log('[Fin] Title:', title);
  console.log('[Fin] OK', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title,
        description: `"${live.quote}"\n\n— ${live.author}\nSource: ${live.reference || 'Wikiquote'}\n\n#Finance #MoneyMindset #Investing #Shorts`,
        tags: ['Finance', 'MoneyMindset', 'Investing', 'Shorts', live.author.replace(/\s+/g, '')],
        channelId: 'finance_saas'
      });
      console.log('[Fin] YouTube uploaded');
    } catch (e) {
      console.warn('[Fin] upload', e.message);
    }
  } else console.log('[Fin] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
