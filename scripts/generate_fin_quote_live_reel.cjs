#!/usr/bin/env node
/** Fin live quote — clean Wikiquote, CENTER bold ASS, unique image+BGM */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, loadHistory, saveHistory, isDuplicate, normalizeQuote } = require('./content_system_shared.cjs');
const { FIN_AUTHORS, fetchWikiquoteQuotes, isCleanQuote } = require('./public_sources.cjs');

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
      let list = await fetchWikiquoteQuotes(page);
      list = list.filter((q) => isCleanQuote(q.quote));
      console.log('[Fin] clean quotes', list.length);
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
  throw new Error('No clean live Wikiquote finance quote');
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
  const key = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '').trim();
  if (key) {
    try {
      const api =
        'https://api.unsplash.com/photos/random?query=' +
        encodeURIComponent('finance business abstract') +
        '&orientation=portrait&client_id=' +
        key;
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
  const idx = Math.abs(runId + author.length) % IMAGE_POOL.length;
  await download(IMAGE_POOL[idx], dest);
  console.log('[Fin] image: pool #' + idx);
  return 'pool';
}

function makeUniqueBgm(outPath) {
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
  const f1 = 90 + (runId % 7) * 8;
  const f2 = 140 + (runId % 5) * 11;
  const f3 = 200 + (runId % 6) * 9;
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=${f1}:duration=${DUR}" -f lavfi -i "sine=frequency=${f2}:duration=${DUR}" -f lavfi -i "sine=frequency=${f3}:duration=${DUR}" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=first,lowpass=f=700,volume=${VOLUMES.fin.bgm}" -ar 44100 -ac 2 "${outPath}"`,
    { stdio: 'pipe' }
  );
  console.log('[Fin] BGM: pad', f1, f2, f3);
}

function assEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, ' ')
    .slice(0, 160);
}

function wrapLines(text, maxLen) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxLen) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 5);
}

/** Center-screen bold ASS — Alignment 5, opaque box, no overflow */
function writeAss(quote, author, assPath) {
  const lines = wrapLines(quote, 28).map(assEscape);
  const startY = 860;
  const body = lines.map((ln, i) => {
    const y = startY + i * 72;
    return `Dialogue: 0,0:00:00.00,0:00:05.00,Quote,,0,0,0,,{\\an5\\pos(540,${y})\\b1\\fs40}${ln}`;
  });
  body.push(
    `Dialogue: 0,0:00:00.00,0:00:05.00,Quote,,0,0,0,,{\\an5\\pos(540,${startY + lines.length * 72})\\b1\\fs28\\c&HCCCCCC&}— ${assEscape(author)}`
  );
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Quote,DejaVu Sans,40,&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,4,0,5,70,70,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${body.join('\n')}
`;
  fs.writeFileSync(assPath, ass, 'utf8');
}

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
  const pick =
    templates[Math.abs(crypto.createHash('sha1').update(q).digest().readUInt32BE(0)) % templates.length];
  let title = pick();
  if (title.length > 95) title = title.slice(0, 92) + '…';
  return title;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const live = await pickLiveQuote();
  if (!isCleanQuote(live.quote)) throw new Error('Rejected dirty quote after pick');
  console.log('[Fin]', live.author, '—', live.quote.slice(0, 90));

  const imgPath = path.join(ART, `fin_img_${runId}.jpg`);
  const bgmPath = path.join(ART, `fin_bgm_${runId}.wav`);
  const assPath = path.join(ART, `fin_cap_${runId}.ass`);
  const outPath = path.join(OUT, `fin_quote_live_${runId}.mp4`);

  await pickImage(live.author, imgPath);
  if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 5000) throw new Error('HOLLOW: no image');

  makeUniqueBgm(bgmPath);
  if (!fs.existsSync(bgmPath) || fs.statSync(bgmPath).size < 1000) throw new Error('HOLLOW: no BGM');

  writeAss(live.quote, live.author, assPath);

  // Copy ASS next to cwd-relative safe path without special chars issues
  const assSafe = path.join(ART, 'fin_caption.ass');
  fs.copyFileSync(assPath, assSafe);
  const assForFilter = assSafe.replace(/\\/g, '/').replace(/:/g, '\\:');

  const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0015,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(DUR * 30)}:s=1080x1920:fps=30,eq=brightness=-0.05:contrast=1.12:saturation=0.85,ass=${assForFilter}`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${bgmPath}" -vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 128k -t ${DUR} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 80000) throw new Error('HOLLOW: tiny output');

  const title = buildTitle(live);
  console.log('[Fin] Title:', title);
  console.log('[Fin] OK', outPath, (fs.statSync(outPath).size / 1024).toFixed(0) + 'KB');

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
