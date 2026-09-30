import { VisualAssetRecord } from '../types';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    large: string;
    portrait: string;
    medium: string;
  };
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  user: {
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  image: string;
}

// In-memory query cache for Pexels responses to respect the 200 req/hr limit
const pexelsCache = new Map<string, { timestamp: number; photos: VisualAssetRecord[]; videos: VisualAssetRecord[] }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Pexels Visual Provider (Master Spec Section 14, 15, 114)
 */
export async function searchPexelsVisuals(
  query: string,
  apiKey?: string,
  perPage: number = 6
): Promise<{
  photos: VisualAssetRecord[];
  videos: VisualAssetRecord[];
  providerStatus: 'ok' | 'no_key' | 'rate_limited' | 'error';
}> {
  const normKey = query.toLowerCase().trim();
  const cached = pexelsCache.get(normKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      photos: cached.photos,
      videos: cached.videos,
      providerStatus: 'ok'
    };
  }

  const effectiveKey = apiKey || process.env.PEXELS_API_KEY || '';
  if (!effectiveKey) {
    // Curated high-relevance placeholder assets with licensed provenance
    const fallbackPhotos: VisualAssetRecord[] = [
      {
        id: `pexels-curated-${normKey.slice(0, 10)}-1`,
        type: 'photo',
        provider: 'pexels',
        sourceUrl: 'https://www.pexels.com',
        mediaUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920&fit=crop',
        thumbnailUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=300',
        creator: 'ThisIsEngineering',
        license: 'Pexels Free Commercial License',
        licenseUrl: 'https://www.pexels.com/license/',
        attributionText: 'Photo by ThisIsEngineering on Pexels',
        attributionRequired: false,
        retrievedAt: new Date().toISOString(),
        approved: true
      },
      {
        id: `pexels-curated-${normKey.slice(0, 10)}-2`,
        type: 'photo',
        provider: 'pexels',
        sourceUrl: 'https://www.pexels.com',
        mediaUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920&fit=crop',
        thumbnailUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=300',
        creator: 'Alexandre Debiève',
        license: 'Pexels Free Commercial License',
        licenseUrl: 'https://www.pexels.com/license/',
        attributionText: 'Photo by Alexandre Debiève on Pexels',
        attributionRequired: false,
        retrievedAt: new Date().toISOString(),
        approved: true
      }
    ];

    return {
      photos: fallbackPhotos,
      videos: [],
      providerStatus: 'no_key'
    };
  }

  try {
    // 1. Fetch Vertical Photos
    const photoUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=${perPage}`;
    const photoRes = await fetch(photoUrl, {
      headers: { Authorization: effectiveKey }
    });

    const photos: VisualAssetRecord[] = [];
    if (photoRes.ok) {
      const data = await photoRes.json();
      (data.photos || []).forEach((p: PexelsPhoto) => {
        photos.push({
          id: `pexels-photo-${p.id}`,
          type: 'photo',
          provider: 'pexels',
          sourceUrl: p.url,
          mediaUrl: p.src.portrait || p.src.large,
          thumbnailUrl: p.src.medium,
          creator: p.photographer,
          license: 'Pexels Free Commercial License',
          licenseUrl: 'https://www.pexels.com/license/',
          attributionText: `Photo by ${p.photographer} on Pexels`,
          attributionRequired: false,
          retrievedAt: new Date().toISOString(),
          approved: false
        });
      });
    }

    // 2. Fetch Vertical Videos
    const videoUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=3`;
    const videoRes = await fetch(videoUrl, {
      headers: { Authorization: effectiveKey }
    });

    const videos: VisualAssetRecord[] = [];
    if (videoRes.ok) {
      const data = await videoRes.json();
      (data.videos || []).forEach((v: PexelsVideo) => {
        const bestFile = v.video_files.find(f => f.width === 1080 && f.height === 1920) || v.video_files[0];
        if (bestFile) {
          videos.push({
            id: `pexels-video-${v.id}`,
            type: 'video',
            provider: 'pexels',
            sourceUrl: v.url,
            mediaUrl: bestFile.link,
            thumbnailUrl: v.image,
            creator: v.user?.name || 'Pexels Video Creator',
            license: 'Pexels Free Commercial License',
            licenseUrl: 'https://www.pexels.com/license/',
            attributionText: `Video by ${v.user?.name || 'Creator'} on Pexels`,
            attributionRequired: false,
            retrievedAt: new Date().toISOString(),
            approved: false
          });
        }
      });
    }

    pexelsCache.set(normKey, { timestamp: Date.now(), photos, videos });
    return {
      photos,
      videos,
      providerStatus: 'ok'
    };
  } catch (err: any) {
    console.warn('[Pexels Provider] Error querying Pexels API:', err);
    return {
      photos: [],
      videos: [],
      providerStatus: 'error'
    };
  }
}
