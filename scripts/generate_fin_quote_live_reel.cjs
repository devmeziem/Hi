#!/usr/bin/env node
/**
 * Fin — LIVE Wikiquote 5s reel (no catalog)
 * Shared dedup + volumes + hook titles
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES } = require('./content_system_shared.cjs');
const { loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { FIN_AUTHORS, fetchWikiquoteQuotes } = require('./public_sources.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts');
const HISTORY = path.join(process.cwd(), 'fin_quote_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const DUR = 5.0;
const BGM_VOL = VOLUMES.fin.bgm;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      https.get(u, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, n + 1);
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

async function pickLiveQuote() {
  const history = loadHistory(HISTORY);
  const authors = [...FIN_AUTHORS].sort(() => Math.random() - 0.5);
  for (const page of authors) {
    try {
      const list = await fetchWikiquoteQuotes(page);
      for (const q of list.sort(() => Math.random() - 0.5)) {
        if (!isDuplicate(q, history, { authorWindow: 6, overlapMax: 0.28 })) {
          saveHistory(HISTORY, q);
          return q;
        }
      }
    } catch (e) {
      console.warn('[Fin Live]', page, e.message);
    }
  }
  throw new Error('No unique live Wikiquote finance quote available');
}

async function wikiPortrait(author) {
  try {
    const title = author.replace(/\s+/g, '_');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(b));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

function escapeDraw(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '').slice(0, 110);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const live = await pickLiveQuote();
  console.log('[Fin Live Quote]', live.author, '—', live.quote.slice(0, 80));

  const imgPath = path.join(ART, `fin_live_${Date.now()}.jpg`);
  const audioPath = path.join(ART, `fin_live_a_${Date.now()}.wav`);
  const outPath = path.join(OUT, `fin_quote_live_${Date.now()}.mp4`);

  let got = false;
  const port = await wikiPortrait(live.author);
  if (port && !String(port).endsWith('.svg')) {
    try {
      await download(port.replace(/\/\d+px-/, '/800px-'), imgPath);
      got = fs.existsSync(imgPath) && fs.statSync(imgPath).size > 8000;
    } catch (_) {}
  }
  if (!got) {
    const stocks = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1080&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&q=80'
    ];
    await download(stocks[Math.floor(Math.random() * stocks.length)], imgPath);
  }

  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=90:duration=${DUR}" -f lavfi -i "sine=frequency=135:duration=${DUR}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=600,volume=${BGM_VOL}" "${audioPath}"`,
    { stdio: 'pipe' }
  );

  const q1 = escapeDraw(live.quote.slice(0, 70));
  const q2 = escapeDraw(live.quote.length > 70 ? live.quote.slice(70, 140) : '');
  const auth = escapeDraw('— ' + live.author);
  const draw =
    `drawtext=text='${q1}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.62:shadowcolor=black:shadowx=2:shadowy=2` +
    (q2 ? `,drawtext=text='${q2}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.68:shadowcolor=black:shadowx=2:shadowy=2` : '') +
    `,drawtext=text='${auth}':fontcolor=0xcccccc:fontsize=28:x=(w-text_w)/2:y=h*0.78`;

  const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(DUR * 30)}:s=1080x1920:fps=30,eq=brightness=-0.06:contrast=1.15:saturation=0.7,${draw}`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${audioPath}" -vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 128k -t ${DUR} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );

  const hooks = ['Most people learn this too late', 'Read this before your next money move', 'One rule that protects your cash'];
  const title = `${hooks[Math.floor(Math.random() * hooks.length)]} (${live.author})`;
  console.log('[Fin Live Quote] Title:', title);
  console.log('[Fin Live Quote] OK', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title,
        description: `"${live.quote}"\n\n— ${live.author}\nSource: ${live.reference}\n\n#Finance #MoneyTips #Shorts`,
        tags: ['#Finance', '#MoneyTips', '#Shorts'],
        channelId: 'finance_saas'
      });
    } catch (e) {
      console.warn('[Fin Live] upload', e.message);
    }
  } else console.log('[Fin Live] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
