#!/usr/bin/env node
/**
 * Fin Blueprint — LIVE public-source 5s quote reel (NO hardcoded catalog)
 * - Quote: Wikiquote only (fetch_live_finance_quote.cjs)
 * - Image: real Wikipedia portrait OR topic stock (Unsplash) — never fake titan faces
 * - Audio: rotating mystery bed (soft_piano_synthesizer if present)
 * - Hook-first title for YouTube algo
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { fetchLiveFinanceQuote } = require('./fetch_live_finance_quote.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const DUR = 5.0;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u, n = 0) => {
      if (n > 5) return reject(new Error('too many redirects'));
      https.get(u, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, n + 1);
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

async function fetchWikiPortrait(author) {
  const title = String(author).replace(/\s+/g, '_');
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'FinBlueprintBot/1.0' } }, (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try { resolve(JSON.parse(b)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });
    const img = data.originalimage?.source || data.thumbnail?.source;
    if (img && !img.endsWith('.svg')) return img.replace(/\/\d+px-/, '/800px-');
  } catch (_) {}
  return null;
}

function escapeDraw(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "'")
    .slice(0, 120);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

  console.log('[Fin Live Quote] Fetching public Wikiquote (no catalog)...');
  const live = await fetchLiveFinanceQuote();
  const quote = live.quote;
  const author = live.author;
  console.log('[Fin Live Quote]', author, '—', quote.slice(0, 90) + '…');

  const imgPath = path.join(ART, `fin_live_img_${Date.now()}.jpg`);
  const audioPath = path.join(ART, `fin_live_audio_${Date.now()}.wav`);
  const outPath = path.join(OUT, `fin_quote_live_${Date.now()}.mp4`);

  // Portrait: real wiki person only; else topic stock (not a fake face)
  let gotPortrait = false;
  const wikiImg = await fetchWikiPortrait(author);
  if (wikiImg) {
    try {
      await download(wikiImg, imgPath);
      if (fs.existsSync(imgPath) && fs.statSync(imgPath).size > 8000) gotPortrait = true;
    } catch (_) {}
  }
  if (!gotPortrait) {
    const stocks = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1080&q=80',
      'https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=1080&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&q=80'
    ];
    await download(stocks[Math.floor(Math.random() * stocks.length)], imgPath);
    console.log('[Fin Live Quote] Using topic stock image (no reliable wiki portrait)');
  } else {
    console.log('[Fin Live Quote] Wikipedia portrait OK');
  }

  // Soft bed audio
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=90:duration=${DUR}" -f lavfi -i "sine=frequency=135:duration=${DUR}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=600,volume=0.12" "${audioPath}"`,
    { stdio: 'pipe' }
  );

  // On-screen: quote (wrapped) + author — Ken Burns
  const q1 = escapeDraw(quote.slice(0, 70));
  const q2 = escapeDraw(quote.length > 70 ? quote.slice(70, 140) : '');
  const auth = escapeDraw('— ' + author);
  const draw =
    `drawtext=text='${q1}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.62:shadowcolor=black:shadowx=2:shadowy=2` +
    (q2
      ? `,drawtext=text='${q2}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.68:shadowcolor=black:shadowx=2:shadowy=2`
      : '') +
    `,drawtext=text='${auth}':fontcolor=0xcccccc:fontsize=28:x=(w-text_w)/2:y=h*0.78:shadowcolor=black:shadowx=1:shadowy=1`;

  const vf = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(DUR * 30)}:s=1080x1920:fps=30,eq=brightness=-0.06:contrast=1.15:saturation=0.7,${draw}`;

  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${audioPath}" -vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 128k -t ${DUR} -pix_fmt yuv420p "${outPath}"`,
    { stdio: 'inherit' }
  );

  // Hook-first SEO title
  const hooks = [
    'Most people learn this too late',
    'Read this before your next money move',
    'One rule that protects your cash',
    'Why this still matters in 2026'
  ];
  const title = `${hooks[Math.floor(Math.random() * hooks.length)]} (${author})`;
  const desc = `"${quote}"\n\n— ${author}\nSource: ${live.reference || 'Wikiquote (public)'}\n\n#Finance #MoneyTips #Wealth #Shorts`;

  console.log('[Fin Live Quote] Title:', title);
  console.log('[Fin Live Quote] Rendered', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      const res = await uploadYouTubeShort({
        videoPath: outPath,
        title,
        description: desc,
        tags: ['#Finance', '#MoneyTips', '#Wealth', '#Shorts'],
        channelId: 'finance_saas'
      });
      console.log('[Fin Live Quote] Upload', res?.id || res);
    } catch (e) {
      console.warn('[Fin Live Quote] Upload notice:', e.message);
    }
  } else {
    console.log('[Fin Live Quote] DRY_RUN — no upload');
  }
}

main().catch((e) => {
  console.error('[Fin Live Quote] FATAL', e);
  process.exit(1);
});
