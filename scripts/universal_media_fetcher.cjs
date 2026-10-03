/**
 * Universal Verified Media & Stock Asset Fetcher
 * Automated fetching & filtering for Video, Image, and Audio:
 * - Pexels (Videos & Photos) [PEXELS_API_KEY]
 * - Unsplash (High-Res Photos) [UNSPLASH_ACCESS_KEY]
 * - Pixabay (Videos & Images) [PIXABAY_API_KEY]
 * - Wikimedia Commons (Historical Portraits, Specimens, Speeches) [Zero-Key Free]
 * - Openverse (700M+ CC Images & Audio) [Zero-Key Free]
 * - Freesound (Ambient Music & Sound FX) [FREESOUND_API_KEY]
 * - Internet Archive (Public Domain Video & Audio) [Zero-Key Free]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const CACHE_DIR = path.join(process.cwd(), 'test_artifacts', 'media_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Media deduplication tracking (guarantees scenes never reuse the exact same photo/video)
const SEEN_MEDIA_URLS = new Set();

// API Credentials from GitHub Actions / Environment
const PEXELS_API_KEY = (process.env.PEXELS_API_KEY || '').trim();
const UNSPLASH_ACCESS_KEY = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '').trim();
const PIXABAY_API_KEY = (process.env.PIXABAY_API_KEY || '').trim();
const FREESOUND_API_KEY = (process.env.FREESOUND_API_KEY || '').trim();

/**
 * Robust HTTP GET helper with redirect following and timeout
 */
function fetchJson(url, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const reqHeaders = {
      'User-Agent': 'VoxamFactory/3.0 (Automated Educational Media Dispatcher; contact@voxam.ai)',
      'Accept': 'application/json, text/plain, */*',
      ...headers
    };

    const req = client.get(url, { headers: reqHeaders, timeout: timeoutMs }, (res) => {
      // Follow 301/302 redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = `${u.origin}${redirectUrl}`;
        }
        return resolve(fetchJson(redirectUrl, headers, timeoutMs));
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Download a remote binary file (image/video/audio) to disk
 */
function downloadFile(url, destPath, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = client.get(url, {
      headers: {
        'User-Agent': 'VoxamFactory/3.0 (Media Downloader; contact@voxam.ai)'
      },
      timeout: timeoutMs
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return resolve(downloadFile(res.headers.location, destPath, timeoutMs));
      }

      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
            resolve(destPath);
          } else {
            reject(new Error(`Downloaded file empty from ${url}`));
          }
        });
      });
    });

    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

// ============================================================================
// 1. IMAGE SEARCH & FETCH (Pexels, Unsplash, Pixabay, Wikimedia, Openverse)
// User Mandate: Search one preferred source first; fall back to others if needed.
// Deduplicate across scenes so no single video repeats identical media.
// ============================================================================

async function searchAndFetchImage(query, options = {}) {
  const cleanQuery = String(query || 'stoic philosophy wisdom').trim();
  const safeFilename = `img_${cleanQuery.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
  const destPath = path.join(CACHE_DIR, safeFilename);

  // Preferred source ordering
  const preferred = (options.preferredSource || 'auto').toLowerCase();
  const sourceKeys = ['pexels', 'unsplash', 'pixabay', 'wikimedia', 'openverse'];
  const orderedSources = preferred !== 'auto' && sourceKeys.includes(preferred)
    ? [preferred, ...sourceKeys.filter(s => s !== preferred)]
    : sourceKeys;

  console.log(`[Media Fetcher] 🖼️ Sourcing vertical image for: "${cleanQuery}" (Primary: ${orderedSources[0]})...`);

  for (const src of orderedSources) {
    // 1. Pexels
    if (src === 'pexels' && PEXELS_API_KEY) {
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=5`;
        const data = await fetchJson(url, { 'Authorization': PEXELS_API_KEY }, 6000);
        const photos = data?.photos || [];
        for (const photo of photos) {
          const imgUrl = photo?.src?.portrait || photo?.src?.large2x || photo?.src?.large;
          if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
            SEEN_MEDIA_URLS.add(imgUrl);
            await downloadFile(imgUrl, destPath);
            console.log(`[Media Fetcher] ✓ Sourced portrait from Pexels: "${photo.alt || cleanQuery}"`);
            return { localPath: destPath, source: 'Pexels', credit: photo.photographer || 'Pexels', mediaUrl: imgUrl };
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Pexels image search: ${e.message}`);
      }
    }

    // 2. Unsplash
    if (src === 'unsplash' && UNSPLASH_ACCESS_KEY) {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=5`;
        const data = await fetchJson(url, { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }, 6000);
        const results = data?.results || [];
        for (const photo of results) {
          const imgUrl = photo?.urls?.regular || photo?.urls?.full;
          if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
            SEEN_MEDIA_URLS.add(imgUrl);
            await downloadFile(imgUrl, destPath);
            console.log(`[Media Fetcher] ✓ Sourced photo from Unsplash: "${photo.description || cleanQuery}"`);
            return { localPath: destPath, source: 'Unsplash', credit: photo.user?.name || 'Unsplash', mediaUrl: imgUrl };
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Unsplash image search: ${e.message}`);
      }
    }

    // 3. Pixabay
    if (src === 'pixabay' && PIXABAY_API_KEY) {
      try {
        const url = `https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_API_KEY)}&q=${encodeURIComponent(cleanQuery)}&orientation=vertical&image_type=photo&per_page=5`;
        const data = await fetchJson(url, {}, 6000);
        const hits = data?.hits || [];
        for (const hit of hits) {
          const imgUrl = hit?.largeImageURL || hit?.webformatURL;
          if (imgUrl && !SEEN_MEDIA_URLS.has(imgUrl)) {
            SEEN_MEDIA_URLS.add(imgUrl);
            await downloadFile(imgUrl, destPath);
            console.log(`[Media Fetcher] ✓ Sourced photo from Pixabay: "${hit.tags || cleanQuery}"`);
            return { localPath: destPath, source: 'Pixabay', credit: hit.user || 'Pixabay', mediaUrl: imgUrl };
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Pixabay image search: ${e.message}`);
      }
    }

    // 4. Wikimedia Commons (Zero-Key Authentic High-Res Museum & Real-World Historical Portraits)
    if (src === 'wikimedia') {
      try {
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery + ' portrait')}&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&pithumbsize=1080&format=json`;
        const data = await fetchJson(wikiUrl, {}, 6000);
        const pages = data?.query?.pages || {};
        for (const pid of Object.keys(pages)) {
          const info = pages[pid]?.imageinfo?.[0];
          const thumb = pages[pid]?.thumbnail?.source;
          const imgUrl = thumb || info?.url;
          if (imgUrl && !imgUrl.endsWith('.svg') && !SEEN_MEDIA_URLS.has(imgUrl)) {
            SEEN_MEDIA_URLS.add(imgUrl);
            await downloadFile(imgUrl, destPath);
            console.log(`[Media Fetcher] ✓ Sourced authentic archive image from Wikimedia Commons`);
            return { localPath: destPath, source: 'Wikimedia Commons', credit: 'Public Domain / Wikimedia', mediaUrl: imgUrl };
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Wikimedia image search: ${e.message}`);
      }
    }

    // 5. Openverse API (700M+ CC Images)
    if (src === 'openverse') {
      try {
        const openverseUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(cleanQuery)}&aspect_ratio=tall&page_size=5`;
        const data = await fetchJson(openverseUrl, {}, 6000);
        const results = data?.results || [];
        for (const result of results) {
          if (result && result.url && !SEEN_MEDIA_URLS.has(result.url)) {
            SEEN_MEDIA_URLS.add(result.url);
            await downloadFile(result.url, destPath);
            console.log(`[Media Fetcher] ✓ Sourced tall photo from Openverse: "${result.title}"`);
            return { localPath: destPath, source: 'Openverse', credit: result.creator || 'Openverse', mediaUrl: result.url };
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Openverse image search: ${e.message}`);
      }
    }
  }

  return null;
}

// ============================================================================
// 2. VIDEO SEARCH & FETCH (Pexels Video, Pixabay Video, Archive.org)
// ============================================================================

async function searchAndFetchVideo(query, options = {}) {
  const cleanQuery = String(query || 'stoic statue marble dramatic lighting').trim();
  const safeFilename = `vid_${cleanQuery.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`;
  const destPath = path.join(CACHE_DIR, safeFilename);

  const preferred = (options.preferredSource || 'auto').toLowerCase();
  const sourceKeys = ['pexels', 'pixabay', 'archive'];
  const orderedSources = preferred !== 'auto' && sourceKeys.includes(preferred)
    ? [preferred, ...sourceKeys.filter(s => s !== preferred)]
    : sourceKeys;

  console.log(`[Media Fetcher] 🎥 Sourcing vertical video clip for: "${cleanQuery}" (Primary: ${orderedSources[0]})...`);

  for (const src of orderedSources) {
    // 1. Pexels Video API (Portrait 9:16)
    if (src === 'pexels' && PEXELS_API_KEY) {
      try {
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=5`;
        const data = await fetchJson(url, { 'Authorization': PEXELS_API_KEY }, 6000);
        const videos = data?.videos || [];
        for (const video of videos) {
          if (video && Array.isArray(video.video_files)) {
            const targetFile = video.video_files.find(f => f.quality === 'hd' && f.width < f.height)
              || video.video_files.find(f => f.width < f.height)
              || video.video_files[0];
            if (targetFile?.link && !SEEN_MEDIA_URLS.has(targetFile.link)) {
              SEEN_MEDIA_URLS.add(targetFile.link);
              await downloadFile(targetFile.link, destPath, 35000);
              console.log(`[Media Fetcher] ✓ Sourced vertical video from Pexels (${video.duration}s)`);
              return { localPath: destPath, source: 'Pexels Video', duration: video.duration, mediaUrl: targetFile.link };
            }
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Pexels video search: ${e.message}`);
      }
    }

    // 2. Pixabay Video API (Vertical orientation)
    if (src === 'pixabay' && PIXABAY_API_KEY) {
      try {
        const url = `https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_API_KEY)}&q=${encodeURIComponent(cleanQuery)}&orientation=vertical&per_page=5`;
        const data = await fetchJson(url, {}, 6000);
        const hits = data?.hits || [];
        for (const hit of hits) {
          if (hit?.videos) {
            const vidUrl = hit.videos.medium?.url || hit.videos.large?.url || hit.videos.small?.url;
            if (vidUrl && !SEEN_MEDIA_URLS.has(vidUrl)) {
              SEEN_MEDIA_URLS.add(vidUrl);
              await downloadFile(vidUrl, destPath, 35000);
              console.log(`[Media Fetcher] ✓ Sourced vertical video from Pixabay (${hit.duration}s)`);
              return { localPath: destPath, source: 'Pixabay Video', duration: hit.duration, mediaUrl: vidUrl };
            }
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Pixabay video search: ${e.message}`);
      }
    }

    // 3. Internet Archive (Zero-Key Public Domain Historical & Dramatic Footage)
    if (src === 'archive') {
      try {
        const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(cleanQuery)}+AND+mediatype:movies&fl[]=identifier,title,duration&rows=5&output=json`;
        const data = await fetchJson(archiveUrl, {}, 6000);
        const docs = data?.response?.docs || [];
        for (const doc of docs) {
          if (doc?.identifier) {
            const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
            const meta = await fetchJson(metaUrl, {}, 6000);
            const mp4File = meta?.files?.find(f => f.name && f.name.endsWith('.mp4'));
            if (mp4File) {
              const directUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp4File.name)}`;
              if (!SEEN_MEDIA_URLS.has(directUrl)) {
                SEEN_MEDIA_URLS.add(directUrl);
                await downloadFile(directUrl, destPath, 45000);
                console.log(`[Media Fetcher] ✓ Sourced archival footage from Internet Archive: "${doc.title}"`);
                return { localPath: destPath, source: 'Internet Archive', duration: 15, mediaUrl: directUrl };
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[Media Notice] Internet Archive search: ${e.message}`);
      }
    }
  }

  return null;
}

// ============================================================================
// 3. AUDIO SEARCH & FETCH (Freesound, Openverse, Local Music Bank, Procedural)
// ============================================================================

async function searchAndFetchAudio(query, targetDuration = 45, channelType = 'stoic') {
  const cleanQuery = String(query || 'calm piano emotional ambient').trim();
  const safeFilename = `audio_${cleanQuery.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`;
  const destPath = path.join(CACHE_DIR, safeFilename);

  console.log(`[Media Fetcher] 🎵 Sourcing background audio track for: "${cleanQuery}" (${targetDuration}s)...`);

  // Path 1: Freesound API
  if (FREESOUND_API_KEY) {
    try {
      const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(cleanQuery)}&filter=duration:[10.0+TO+180.0]&fields=id,name,previews,duration&token=${FREESOUND_API_KEY}`;
      const data = await fetchJson(url, {}, 6000);
      const sound = data?.results?.[0];
      const previewUrl = sound?.previews?.['preview-hq-mp3'] || sound?.previews?.['preview-lq-mp3'];
      if (previewUrl) {
        await downloadFile(previewUrl, destPath, 25000);
        console.log(`[Media Fetcher] ✓ Sourced track from Freesound: "${sound.name}" (${sound.duration}s)`);
        return { localPath: destPath, source: 'Freesound', duration: sound.duration };
      }
    } catch (e) {
      console.warn(`[Media Notice] Freesound search: ${e.message}`);
    }
  }

  // Path 2: Openverse Audio API
  try {
    const openverseUrl = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(cleanQuery)}&page_size=3`;
    const data = await fetchJson(openverseUrl, {}, 6000);
    const audioHit = data?.results?.[0];
    if (audioHit?.url) {
      await downloadFile(audioHit.url, destPath, 25000);
      console.log(`[Media Fetcher] ✓ Sourced track from Openverse: "${audioHit.title}"`);
      return { localPath: destPath, source: 'Openverse Audio', duration: 40 };
    }
  } catch (e) {
    console.warn(`[Media Notice] Openverse audio search: ${e.message}`);
  }

  // Path 3: Local Repository Sound Assets
  const soundFolder = path.join(process.cwd(), 'sound_assets', channelType);
  if (fs.existsSync(soundFolder)) {
    const files = fs.readdirSync(soundFolder).filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
    if (files.length > 0) {
      const chosen = files[Math.floor(Math.random() * files.length)];
      const localTrackPath = path.join(soundFolder, chosen);
      console.log(`[Media Fetcher] ✓ Using local repository audio track: ${chosen}`);
      return { localPath: localTrackPath, source: 'Local Repository Sound Asset', duration: targetDuration };
    }
  }

  return null;
}

module.exports = {
  searchAndFetchImage,
  searchAndFetchVideo,
  searchAndFetchAudio,
  CACHE_DIR
};
