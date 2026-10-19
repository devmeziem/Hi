#!/usr/bin/env node
/** Fin live Wikiquote — ONE image + ONE BGM bed + text (no multi-scene stack) */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { VOLUMES, loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { FIN_AUTHORS, fetchWikiquoteQuotes } = require('./public_sources.cjs');
const { makeBgm } = require('./mix_bgm.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts');
const HISTORY = path.join(process.cwd(), 'fin_quote_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const DUR = 5.0;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('redirects'));
      https.get(u, { headers: { 'User-Agent': 'FinBot/1.0' } }, (res) => {
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
      console.log('[Fin] Wikiquote', page);
      const list = await fetchWikiquoteQuotes(page);
      console.log('[Fin] got', list.length, 'quotes');
      for (const q of list.sort(() => Math.random() - 0.5)) {
        // exact-only block first; soft overlap
        if (!isDuplicate(q, history, { authorWindow: 4, overlapMax: 0.45 })) {
          saveHistory(HISTORY, q);
          return q;
        }
      }
    } catch (e) {
      console.warn('[Fin]', page, e.message);
    }
  }
  // Last resort: any quote ignoring author window (still not catalog invent)
  for (const page of authors) {
    try {
      const list = await fetchWikiquoteQuotes(page);
      if (list[0]) {
        saveHistory(HISTORY, list[0]);
        return list[0];
      }
    } catch (_) {}
  }
  throw new Error('No live Wikiquote finance quote');
}

function escapeDraw(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '').slice(0, 110);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  const live = await pickLiveQuote();
  console.log('[Fin]', live.author, live.quote.slice(0, 90));

  const imgPath = path.join(ART, `fin_${Date.now()}.jpg`);
  const bgmPath = path.join(ART, `fin_b_${Date.now()}.wav`);
  const outPath = path.join(OUT, `fin_quote_live_${Date.now()}.mp4`);

  const stocks = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1080&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&q=80'
  ];
  await download(stocks[Math.floor(Math.random() * stocks.length)], imgPath);
  if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 5000) throw new Error('HOLLOW FAIL: no image');

  makeBgm(bgmPath, DUR, VOLUMES.fin.bgm);

  const q1 = escapeDraw(live.quote.slice(0, 70));
  const q2 = escapeDraw(live.quote.length > 70 ? live.quote.slice(70, 140) : '');
  const auth = escapeDraw('— ' + live.author);
  const draw =
    `drawtext=text='${q1}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.62:shadowcolor=black:shadowx=2:shadowy=2` +
    (q2 ? `,drawtext=text='${q2}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.68:shadowcolor=black:shadowx=2:shadowy=2` : '') +
    `,drawtext=text='${auth}':fontcolor=0xcccccc:fontsize=28:x=(w-text_w)/2:y=h*0.78`;

  const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(DUR * 30)}:s=1080x1920:fps=30,eq=brightness=-0.06:contrast=1.15,${draw}`;
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${bgmPath}" -vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 128k -t ${DUR} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );
  if (fs.statSync(outPath).size < 80000) throw new Error('HOLLOW FAIL: tiny output');
  const title = `Most people learn this too late (${live.author})`;
  console.log('[Fin] OK', title, outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title,
        description: `"${live.quote}"\n\n— ${live.author}\n${live.reference}\n\n#Finance #MoneyTips #Shorts`,
        tags: ['#Finance', '#Shorts'],
        channelId: 'finance_saas'
      });
    } catch (e) {
      console.warn('[Fin] upload', e.message);
    }
  } else console.log('[Fin] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
