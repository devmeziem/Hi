/**
 * Universal Verified Media & Stock Asset Fetcher
 * Fallback (2026-10-27): multi-query variants, ban beauty/lipstick tags,
 * soft piano audio bias, niche-safe atmospheric visual fallbacks.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CACHE_DIR = path.join(process.cwd(), 'test_artifacts', 'media_cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const SEEN_MEDIA_URLS = new Set();
const PEXELS_API_KEY = (process.env.PEXELS_API_KEY || '').trim();
const UNSPLASH_ACCESS_KEY = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '').trim();
const PIXABAY_API_KEY = (process.env.PIXABAY_API_KEY || '').trim();
const FREESOUND_API_KEY = (process.env.FREESOUND_API_KEY || '').trim();

const BAD_TAG_RE = /lipstick|makeup|cosmetic|nail polish|beauty salon|fashion model runway|lipstick closeup/i;

function fetchJson(url, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'VoxamFactory/3.1 (Educational Media; github.com/devmeziem)',
          Accept: 'application/json, text/plain, */*',
          ...headers
        },
        timeout: timeoutMs
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            const u = new URL(url);
            redirectUrl = `${u.origin}${redirectUrl}`;
          }
          return resolve(fetchJson(redirectUrl, headers, timeoutMs));
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          } else resolve(null);
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function downloadFile(url, destPath, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = client.get(
      url,
      { headers: { 'User-Agent': 'VoxamFactory/3.1' }, timeout: timeoutMs },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          return resolve(downloadFile(res.headers.location, destPath, timeoutMs));
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          return reject(new Error('HTTP ' + res.statusCode));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) resolve(destPath);
            else reject(new Error('empty download'));
          });
        });
      }
    );
    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error('timeout'));
    });
  });
}

function buildQueryVariants(query, kind) {
  const q = String(query || '').replace(/[#@]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = q.split(' ').filter((w) => w.length > 2);
  const variants = [];
  if (q) variants.push(q);
  if (words.length >= 4) variants.push(words.slice(0, 4).join(' '));
  if (words.length >= 3) variants.push(words.slice(0, 3).join(' '));
  if (words.length >= 2) variants.push(words.slice(0, 2).join(' '));
  const core = words.filter(
    (w) => !/^(the|and|with|from|scene|stock|vertical|portrait|cinematic|beautiful)$/i.test(w)
  );
  if (core.length >= 2) variants.push(core.slice(0, 3).join(' '));

  if (kind === 'video' || kind === 'image') {
    variants.push(
      'foggy ocean waves dark',
      'empty street night rain',
      'old library books archival',
      'dramatic sky clouds slow',
      'silhouette person walking alone',
      'candle flame dark room',
      'typewriter desk study',
      'city lights bokeh night'
    );
  }
  if (kind === 'audio') {
    variants.push(
      'soft piano ambient instrumental',
      'calm piano solo no drums',
      'gentle piano atmospheric',
      'minimal piano pad ambient'
    );
  }

  const seen = new Set();
  const out = [];
  for (const v of variants) {
    const k = v.toLowerCase();
    if (!seen.has(k) && k.length > 2) {
      seen.add(k);
      out.push(v);
    }
  }
  return out.slice(0, 8);
}

function textLooksBad(metaText) {
  return BAD_TAG_RE.test(String(metaText || ''));
}

async function searchAndFetchImage(query, options = {}) {
  const variants = buildQueryVariants(query || 'archival photograph historical', 'image');
  const preferred = (options.preferredSource || 'auto').toLowerCase();
  const sourceKeys = ['pexels', 'unsplash', 'pixabay', 'wikimedia', 'openverse'];
  const orderedSources =
    preferred !== 'auto' && sourceKeys.includes(preferred)
      ? [preferred, ...sourceKeys.filter((s) => s !== preferred)]
      : sourceKeys;

  for (const cleanQuery of variants) {
    const destPath = path.join(
      CACHE_DIR,
      `img_${cleanQuery.slice(0, 28).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`
    );
    console.log(`[Media Fetcher] image try: "${cleanQuery}"`);

    for (const src of orderedSources) {
      if (src === 'pexels' && PEXELS_API_KEY) {
        try {
          const data = await fetchJson(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=8`,
            { Authorization: PEXELS_API_KEY },
            6000
          );
          for (const photo of data?.photos || []) {
            if (textLooksBad(photo.alt || '')) continue;
            const imgUrl = photo?.src?.portrait || photo?.src?.large2x || photo?.src?.large;
            if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
              SEEN_MEDIA_URLS.add(imgUrl);
              await downloadFile(imgUrl, destPath);
              console.log(`[Media Fetcher] OK Pexels image queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Pexels', credit: photo.photographer || 'Pexels', mediaUrl: imgUrl, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Pexels image', e.message);
        }
      }
      if (src === 'unsplash' && UNSPLASH_ACCESS_KEY) {
        try {
          const data = await fetchJson(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=8`,
            { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            6000
          );
          for (const photo of data?.results || []) {
            if (textLooksBad(`${photo.description || ''} ${photo.alt_description || ''}`)) continue;
            const imgUrl = photo?.urls?.regular || photo?.urls?.full;
            if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
              SEEN_MEDIA_URLS.add(imgUrl);
              await downloadFile(imgUrl, destPath);
              console.log(`[Media Fetcher] OK Unsplash queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Unsplash', credit: photo.user?.name || 'Unsplash', mediaUrl: imgUrl, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Unsplash', e.message);
        }
      }
      if (src === 'pixabay' && PIXABAY_API_KEY) {
        try {
          const data = await fetchJson(
            `https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_API_KEY)}&q=${encodeURIComponent(cleanQuery)}&orientation=vertical&image_type=photo&per_page=8`,
            {},
            6000
          );
          for (const hit of data?.hits || []) {
            if (textLooksBad(hit.tags || '')) continue;
            const imgUrl = hit?.largeImageURL || hit?.webformatURL;
            if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
              SEEN_MEDIA_URLS.add(imgUrl);
              await downloadFile(imgUrl, destPath);
              console.log(`[Media Fetcher] OK Pixabay image queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Pixabay', credit: hit.user || 'Pixabay', mediaUrl: imgUrl, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Pixabay image', e.message);
        }
      }
      if (src === 'wikimedia') {
        try {
          const data = await fetchJson(
            `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json`,
            {},
            6000
          );
          const pages = data?.query?.pages || {};
          for (const pid of Object.keys(pages)) {
            const imgUrl = pages[pid]?.imageinfo?.[0]?.url;
            if (imgUrl && !imgUrl.endsWith('.svg') && !SEEN_MEDIA_URLS.has(imgUrl)) {
              SEEN_MEDIA_URLS.add(imgUrl);
              await downloadFile(imgUrl, destPath);
              console.log('[Media Fetcher] OK Wikimedia');
              return { localPath: destPath, source: 'Wikimedia Commons', credit: 'Wikimedia', mediaUrl: imgUrl, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Wikimedia', e.message);
        }
      }
      if (src === 'openverse') {
        try {
          const data = await fetchJson(
            `https://api.openverse.org/v1/images/?q=${encodeURIComponent(cleanQuery)}&aspect_ratio=tall&page_size=6`,
            {},
            6000
          );
          for (const result of data?.results || []) {
            if (textLooksBad(result.title || '')) continue;
            if (result?.url && !SEEN_MEDIA_URLS.has(result.url)) {
              SEEN_MEDIA_URLS.add(result.url);
              await downloadFile(result.url, destPath);
              console.log(`[Media Fetcher] OK Openverse image queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Openverse', credit: result.creator || 'Openverse', mediaUrl: result.url, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Openverse image', e.message);
        }
      }
    }
  }
  console.warn('[Media Fetcher] FAIL image all variants:', query);
  return null;
}

async function searchAndFetchVideo(query, options = {}) {
  const variants = buildQueryVariants(query || 'foggy ocean waves dark', 'video');
  const preferred = (options.preferredSource || 'auto').toLowerCase();
  const sourceKeys = ['pexels', 'pixabay', 'archive'];
  const orderedSources =
    preferred !== 'auto' && sourceKeys.includes(preferred)
      ? [preferred, ...sourceKeys.filter((s) => s !== preferred)]
      : sourceKeys;

  for (const cleanQuery of variants) {
    const destPath = path.join(
      CACHE_DIR,
      `vid_${cleanQuery.slice(0, 28).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`
    );
    console.log(`[Media Fetcher] video try: "${cleanQuery}"`);

    for (const src of orderedSources) {
      if (src === 'pexels' && PEXELS_API_KEY) {
        try {
          const data = await fetchJson(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=8`,
            { Authorization: PEXELS_API_KEY },
            6000
          );
          for (const video of data?.videos || []) {
            if (!Array.isArray(video.video_files)) continue;
            const targetFile =
              video.video_files.find((f) => f.quality === 'hd' && f.width < f.height) ||
              video.video_files.find((f) => f.width < f.height) ||
              video.video_files[0];
            if (targetFile?.link && !SEEN_MEDIA_URLS.has(targetFile.link)) {
              SEEN_MEDIA_URLS.add(targetFile.link);
              await downloadFile(targetFile.link, destPath, 35000);
              console.log(`[Media Fetcher] OK Pexels video queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Pexels Video', duration: video.duration, mediaUrl: targetFile.link, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Pexels video', e.message);
        }
      }
      if (src === 'pixabay' && PIXABAY_API_KEY) {
        try {
          const data = await fetchJson(
            `https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_API_KEY)}&q=${encodeURIComponent(cleanQuery)}&orientation=vertical&per_page=8`,
            {},
            6000
          );
          for (const hit of data?.hits || []) {
            if (textLooksBad(hit.tags || '')) continue;
            const vidUrl = hit?.videos?.medium?.url || hit?.videos?.large?.url || hit?.videos?.small?.url;
            if (vidUrl && !SEEN_MEDIA_URLS.has(vidUrl)) {
              SEEN_MEDIA_URLS.add(vidUrl);
              await downloadFile(vidUrl, destPath, 35000);
              console.log(`[Media Fetcher] OK Pixabay video queryUsed=${cleanQuery}`);
              return { localPath: destPath, source: 'Pixabay Video', duration: hit.duration, mediaUrl: vidUrl, queryUsed: cleanQuery };
            }
          }
        } catch (e) {
          console.warn('[Media Notice] Pixabay video', e.message);
        }
      }
      if (src === 'archive') {
        try {
          const data = await fetchJson(
            `https://archive.org/advancedsearch.php?q=${encodeURIComponent(cleanQuery)}+AND+mediatype:movies&fl[]=identifier,title&rows=5&output=json`,
            {},
            6000
          );
          for (const doc of data?.response?.docs || []) {
            if (!doc?.identifier) continue;
            const meta = await fetchJson(`https://archive.org/metadata/${doc.identifier}`, {}, 6000);
            const mp4File = meta?.files?.find((f) => f.name && f.name.endsWith('.mp4'));
            if (!mp4File) continue;
            const directUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp4File.name)}`;
            if (SEEN_MEDIA_URLS.has(directUrl)) continue;
            SEEN_MEDIA_URLS.add(directUrl);
            await downloadFile(directUrl, destPath, 45000);
            console.log(`[Media Fetcher] OK Archive ${doc.title}`);
            return { localPath: destPath, source: 'Internet Archive', duration: 15, mediaUrl: directUrl, queryUsed: cleanQuery };
          }
        } catch (e) {
          console.warn('[Media Notice] Archive', e.message);
        }
      }
    }
  }
  console.warn('[Media Fetcher] FAIL video all variants:', query);
  return null;
}

async function searchAndFetchAudio(query, targetDuration = 45, channelType = 'stoic') {
  const forcedSoft = 'soft piano ambient instrumental no drums';
  const variants = buildQueryVariants(
    /piano|ambient|instrumental|calm|soft/i.test(String(query || '')) ? query : `${query || ''} ${forcedSoft}`,
    'audio'
  );
  if (!variants.includes(forcedSoft)) variants.unshift(forcedSoft);

  for (const cleanQuery of variants) {
    const destPath = path.join(
      CACHE_DIR,
      `audio_${cleanQuery.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`
    );
    console.log(`[Media Fetcher] audio try: "${cleanQuery}"`);

    if (FREESOUND_API_KEY) {
      try {
        const data = await fetchJson(
          `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(cleanQuery)}&filter=duration:[8.0+TO+180.0]&fields=id,name,previews,duration,tags&token=${FREESOUND_API_KEY}`,
          {},
          6000
        );
        for (const sound of data?.results || []) {
          const tags = (sound.tags || []).join(' ');
          if (/drum|beat|trap|edm|techno|vocal/i.test(tags + ' ' + (sound.name || ''))) continue;
          const previewUrl = sound?.previews?.['preview-hq-mp3'] || sound?.previews?.['preview-lq-mp3'];
          if (!previewUrl) continue;
          await downloadFile(previewUrl, destPath, 25000);
          console.log(`[Media Fetcher] OK Freesound ${sound.name}`);
          return { localPath: destPath, source: 'Freesound', duration: sound.duration, queryUsed: cleanQuery };
        }
      } catch (e) {
        console.warn('[Media Notice] Freesound', e.message);
      }
    }

    try {
      const data = await fetchJson(
        `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(cleanQuery)}&page_size=5`,
        {},
        6000
      );
      for (const audioHit of data?.results || []) {
        if (/drum|beat|trap|edm|vocal/i.test(audioHit.title || '')) continue;
        if (!audioHit?.url) continue;
        await downloadFile(audioHit.url, destPath, 25000);
        console.log(`[Media Fetcher] OK Openverse audio ${audioHit.title}`);
        return { localPath: destPath, source: 'Openverse Audio', duration: 40, queryUsed: cleanQuery };
      }
    } catch (e) {
      console.warn('[Media Notice] Openverse audio', e.message);
    }
  }

  const soundFolder = path.join(process.cwd(), 'sound_assets', channelType);
  if (fs.existsSync(soundFolder)) {
    const files = fs.readdirSync(soundFolder).filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f));
    if (files.length) {
      const chosen = files[Math.floor(Math.random() * files.length)];
      console.log(`[Media Fetcher] OK local audio ${chosen}`);
      return { localPath: path.join(soundFolder, chosen), source: 'Local', duration: targetDuration, queryUsed: 'local' };
    }
  }

  console.warn('[Media Fetcher] FAIL audio:', query);
  return null;
}

module.exports = {
  searchAndFetchImage,
  searchAndFetchVideo,
  searchAndFetchAudio,
  downloadFile,
  buildQueryVariants,
  CACHE_DIR
};
