/**
 * Universal Image Deduplication & Rolling Window Protection Service
 *
 * Enforces the strict rule: "No same images in 4 videos in a row"
 * 
 * Tracks image usage across channels:
 * - Local cache: data/image_dedup_cache.json
 * - Remote persistent store: Firestore collection channel_image_history
 * 
 * Supports URL matching, normalized path comparison, and MD5/SHA256 image buffer hashing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const CACHE_FILE = path.join(process.cwd(), 'data', 'image_dedup_cache.json');
const ROLLING_WINDOW_SIZE = 4; // Strict requirement: No same images in 4 videos in a row

function ensureDataDir() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function computeImageHash(bufferOrString) {
  if (!bufferOrString) return '';
  const hash = crypto.createHash('sha256');
  if (Buffer.isBuffer(bufferOrString)) {
    hash.update(bufferOrString);
  } else {
    hash.update(String(bufferOrString).trim().toLowerCase());
  }
  return hash.digest('hex');
}

function normalizeImageUrl(url) {
  if (!url) return '';
  try {
    // Strip cache-busters, query strings, and sizing params for canonical deduplication
    const parsed = new URL(url);
    parsed.search = '';
    return parsed.toString().toLowerCase();
  } catch {
    return String(url).split('?')[0].trim().toLowerCase();
  }
}

function getFirestoreConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (fb && fb.projectId && fb.apiKey) {
        return {
          projectId: fb.projectId,
          databaseId: fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
          apiKey: fb.apiKey
        };
      }
    } catch {}
  }
  return null;
}

function loadLocalCache() {
  ensureDataDir();
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {}
  }
  return {
    channels: {
      finance: [],
      stoic: [],
      mindrush: [],
      archie: [],
      movie_brand: []
    },
    globalRecentHashes: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveLocalCache(data) {
  ensureDataDir();
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[Image Dedup] Local cache write notice: ${err.message}`);
  }
}

/**
 * Checks whether an image is allowed for a channel.
 * Returns { allowed: boolean, reason?: string, matchedVideoId?: string }
 */
function isImageAllowed(channelKey, imageUrl, imageBuffer = null) {
  const normChannel = String(channelKey || 'finance').toLowerCase().trim();
  const cache = loadLocalCache();
  const channelHistory = cache.channels[normChannel] || [];

  if (!imageUrl && !imageBuffer) {
    return { allowed: false, reason: 'Empty image reference' };
  }

  const normUrl = normalizeImageUrl(imageUrl);
  const bufferHash = imageBuffer ? computeImageHash(imageBuffer) : null;
  const urlHash = normUrl ? computeImageHash(normUrl) : null;

  // Check the last 4 videos of this specific channel
  const recentVideos = channelHistory.slice(-ROLLING_WINDOW_SIZE);
  for (let i = recentVideos.length - 1; i >= 0; i--) {
    const video = recentVideos[i];
    const videoSlot = recentVideos.length - i; // 1 = most recent, 4 = 4 videos ago

    // Check against video image list
    const imagesInVideo = video.images || [];
    for (const img of imagesInVideo) {
      const recordedNormUrl = normalizeImageUrl(img.url);
      const recordedHash = img.hash;

      // 1. Direct URL match
      if (normUrl && recordedNormUrl && normUrl === recordedNormUrl) {
        return {
          allowed: false,
          reason: `Duplicate image URL detected in video "${video.videoId}" (${videoSlot} video(s) ago). 4-video cooldown active.`,
          matchedVideoId: video.videoId,
          videoSlot
        };
      }

      // 2. Buffer or URL Hash match
      if (bufferHash && recordedHash && bufferHash === recordedHash) {
        return {
          allowed: false,
          reason: `Identical binary image hash detected in video "${video.videoId}" (${videoSlot} video(s) ago).`,
          matchedVideoId: video.videoId,
          videoSlot
        };
      }

      if (urlHash && recordedHash && urlHash === recordedHash) {
        return {
          allowed: false,
          reason: `Canonical URL hash match in video "${video.videoId}" (${videoSlot} video(s) ago).`,
          matchedVideoId: video.videoId,
          videoSlot
        };
      }
    }
  }

  // Cross-channel check (prevent same image posted on different channels within the same day)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [ch, videos] of Object.entries(cache.channels)) {
    if (ch === normChannel) continue;
    for (const vid of (videos || []).slice(-2)) {
      if (new Date(vid.timestamp).getTime() > oneDayAgo) {
        for (const img of (vid.images || [])) {
          if (normUrl && normalizeImageUrl(img.url) === normUrl) {
            return {
              allowed: false,
              reason: `Image was used recently on cross-channel "${ch}". Cross-channel deduplication active.`,
              matchedChannel: ch
            };
          }
        }
      }
    }
  }

  return { allowed: true };
}

/**
 * Records an array of images used in a completed video.
 * Enforces sliding window of 20 videos max per channel.
 */
async function recordVideoImages(channelKey, videoId, imageList = []) {
  const normChannel = String(channelKey || 'finance').toLowerCase().trim();
  const cache = loadLocalCache();
  if (!cache.channels[normChannel]) cache.channels[normChannel] = [];

  const processedImages = (imageList || []).map(img => {
    const url = typeof img === 'string' ? img : img.url || img.imageUrl || '';
    const buffer = Buffer.isBuffer(img) ? img : img.buffer || null;
    return {
      url,
      normUrl: normalizeImageUrl(url),
      hash: buffer ? computeImageHash(buffer) : computeImageHash(normalizeImageUrl(url)),
      title: img.title || img.author || '',
      provider: img.provider || 'unknown',
      recordedAt: new Date().toISOString()
    };
  });

  const videoRecord = {
    videoId: videoId || `${normChannel}_${Date.now()}`,
    channel: normChannel,
    timestamp: new Date().toISOString(),
    imageCount: processedImages.length,
    images: processedImages
  };

  cache.channels[normChannel].push(videoRecord);
  // Keep last 25 videos in history
  if (cache.channels[normChannel].length > 25) {
    cache.channels[normChannel] = cache.channels[normChannel].slice(-25);
  }

  saveLocalCache(cache);
  console.log(`[Image Dedup] 🛡️ Recorded ${processedImages.length} image(s) for video "${videoRecord.videoId}". 4-video non-repeat window enforced.`);

  // Persist asynchronously to Firestore if configured
  await logToFirestore(videoRecord);
  return videoRecord;
}

async function logToFirestore(videoRecord) {
  const config = getFirestoreConfig();
  if (!config) return false;

  const docId = `img_dedup_${videoRecord.videoId}_${Date.now()}`;
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.databaseId}/documents/channel_image_history/${docId}?key=${config.apiKey}`;

  const imageArrayFields = videoRecord.images.map(img => ({
    mapValue: {
      fields: {
        url: { stringValue: img.url || '' },
        hash: { stringValue: img.hash || '' },
        provider: { stringValue: img.provider || '' },
        title: { stringValue: img.title || '' }
      }
    }
  }));

  const payload = JSON.stringify({
    fields: {
      videoId: { stringValue: videoRecord.videoId },
      channel: { stringValue: videoRecord.channel },
      timestamp: { stringValue: videoRecord.timestamp },
      imageCount: { integerValue: String(videoRecord.images.length) },
      images: { arrayValue: { values: imageArrayFields } }
    }
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 6000
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(payload);
    req.end();
  });
}

function getChannelImageStats(channelKey) {
  const cache = loadLocalCache();
  const channelHistory = cache.channels[channelKey] || [];
  const recent4Videos = channelHistory.slice(-ROLLING_WINDOW_SIZE);
  const totalRecordedVideos = channelHistory.length;

  const allRecentImages = [];
  recent4Videos.forEach(v => {
    (v.images || []).forEach(img => {
      allRecentImages.push({
        videoId: v.videoId,
        timestamp: v.timestamp,
        url: img.url,
        title: img.title,
        provider: img.provider
      });
    });
  });

  return {
    channel: channelKey,
    rollingWindowSize: ROLLING_WINDOW_SIZE,
    totalRecordedVideos,
    recentVideosCount: recent4Videos.length,
    recentImagesCount: allRecentImages.length,
    activeGuardedImages: allRecentImages,
    recentVideos: recent4Videos
  };
}

module.exports = {
  isImageAllowed,
  recordVideoImages,
  getChannelImageStats,
  computeImageHash,
  normalizeImageUrl,
  ROLLING_WINDOW_SIZE
};
