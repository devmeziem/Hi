import { VisualAssetRecord } from '../types';
import { searchWikimediaRealtime, searchOpenverseRealtime } from './realtimeVisualEngine';
import { filterDedupedImages } from '../../utils/imageDedupService';

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

  const effectiveKey = apiKey || (typeof process !== 'undefined' ? process.env?.PEXELS_API_KEY : '') || '';
  if (!effectiveKey) {
    // Unseeded Real-Time Fallback: Query live public open repositories (Wikimedia & Openverse)
    try {
      const [wikiPhotos, openversePhotos] = await Promise.all([
        searchWikimediaRealtime(query, perPage),
        searchOpenverseRealtime(query, perPage)
      ]);
      const combined = [...wikiPhotos, ...openversePhotos];
      const { allowed } = filterDedupedImages('archie', combined);

      return {
        photos: allowed.slice(0, perPage),
        videos: [],
        providerStatus: 'no_key'
      };
    } catch {
      return {
        photos: [],
        videos: [],
        providerStatus: 'no_key'
      };
    }
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

    const { allowed: dedupedPhotos } = filterDedupedImages('archie', photos);

    pexelsCache.set(normKey, { timestamp: Date.now(), photos: dedupedPhotos, videos });
    return {
      photos: dedupedPhotos,
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
