import { VisualAssetRecord } from '../types';
import { filterDedupedImages, checkImageDedup, normalizeImageUrl } from '../../utils/imageDedupService';

export interface VisualSearchOptions {
  channelKey?: 'finance' | 'archie' | 'stoic' | 'mindrush' | 'movie_brand';
  aspectRatio?: '9:16' | '16:9' | 'any';
  maxResults?: number;
  pexelsApiKey?: string;
  strictNoCartoon?: boolean; // When true, forcefully bans cartoon/anime/vectors
  allowVideos?: boolean;
}

export interface RealtimeSearchResult {
  query: string;
  optimizedQuery: string;
  channelKey: string;
  photos: VisualAssetRecord[];
  videos: VisualAssetRecord[];
  rejectedDuplicates: number;
  sourcesSearched: string[];
}

/**
 * Optimizes search queries for stock and open repository search engines.
 * Strips conversational noise, prioritizes entity keywords, and enforces channel styles.
 */
export function optimizeVisualQuery(
  rawQuery: string,
  channelKey: string = 'archie',
  strictNoCartoon: boolean = false
): string {
  if (!rawQuery) return 'technology science';

  // 1. Strip conversational filler and punctuation
  let cleaned = rawQuery
    .replace(/\b(can you|show me|tell me|what is|how to|why does|explain|in this video|shorts|video about|picture of|image of|photo of|scene of)\b/gi, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isFinChannel = channelKey.toLowerCase().includes('fin') || channelKey.toLowerCase().includes('bones');

  // 2. Channel-specific editorial optimizations
  if (isFinChannel || strictNoCartoon) {
    // Strict Zero-Cartoon Standard for Finance Channel (@bones_ceo)
    // Eliminates cartoons, anime, 3D CGI plastic renders, vector clips
    const finTerms = ['business', 'finance', 'entrepreneur', 'office', 'market', 'currency', 'money', 'banking', 'desk', 'economics'];
    const hasFinTerm = finTerms.some(t => cleaned.toLowerCase().includes(t));
    if (!hasFinTerm) {
      cleaned = `${cleaned} business finance`;
    }
    // Append real-world editorial photography descriptors
    return `${cleaned} documentary photography real office desk -cartoon -anime -drawing -vector -illustration -caricature`;
  }

  if (channelKey.toLowerCase().includes('archie')) {
    const lower = cleaned.toLowerCase();
    // Targeted concrete entity optimization (stops off-topic stock images)
    if (lower.includes('phone') || lower.includes('battery') || lower.includes('charg')) {
      return `${cleaned} smartphone battery charging electronics`;
    }
    if (lower.includes('audio') || lower.includes('sound') || lower.includes('mic') || lower.includes('echo')) {
      return `${cleaned} audio waveform microphone recording studio`;
    }
    if (lower.includes('airplane') || lower.includes('window') || lower.includes('flight')) {
      return `${cleaned} airplane window passenger cabin aviation`;
    }
    if (lower.includes('photo') || lower.includes('edit') || lower.includes('software') || lower.includes('tool')) {
      return `${cleaned} computer screen video editing interface`;
    }
    if (lower.includes('delete') || lower.includes('storage') || lower.includes('flash') || lower.includes('chip')) {
      return `${cleaned} computer hardware flash memory circuit`;
    }
    return `${cleaned} technology hardware`;
  }

  if (channelKey.toLowerCase().includes('stoic') || channelKey.toLowerCase().includes('motivation')) {
    // High-Contrast Cinematic Realism
    return `${cleaned} cinematic portrait dramatic architecture chiaroscuro`;
  }

  return cleaned;
}

/**
 * Real-time Wikimedia Commons Image & Diagram Search (Completely Unseeded & Free)
 */
export async function searchWikimediaRealtime(
  optimizedQuery: string,
  maxResults: number = 6
): Promise<VisualAssetRecord[]> {
  try {
    // Strip exclusion operators for Wikimedia API syntax
    const searchTerms = optimizedQuery.replace(/-[a-z0-9_]+/gi, '').trim();
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      searchTerms + ' filetype:bitmap'
    )}&gsrnamespace=6&gsrlimit=${maxResults * 2}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VoxamFactoryRealtimeEngine/2.0 (Live Creative Search; devmeziem@gmail.com)'
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query?.pages || {};
    const assets: VisualAssetRecord[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = page.imageinfo?.[0];
      if (!info || !info.url) continue;

      const meta = info.extmetadata || {};
      const licenseShort = meta.LicenseShortName?.value || meta.License?.value || '';
      const usageTerms = meta.UsageTerms?.value || '';
      const artist = (meta.Artist?.value || 'Wikimedia Commons Contributor').replace(/<[^>]+>/g, '').trim();
      const credit = (meta.Credit?.value || '').replace(/<[^>]+>/g, '').trim();
      const description = (meta.ImageDescription?.value || page.title || '').replace(/<[^>]+>/g, '').trim();

      // Check commercial usability
      const licenseLower = (licenseShort + ' ' + usageTerms).toLowerCase();
      const isPublicDomain = licenseLower.includes('public domain') || licenseLower.includes('pd') || licenseLower.includes('cc0');
      const isCreativeCommons = licenseLower.includes('cc-by') || licenseLower.includes('cc by') || licenseLower.includes('attribution');

      if (!isPublicDomain && !isCreativeCommons) continue;

      const attributionRequired = !isPublicDomain;
      const attributionText = attributionRequired
        ? `Photo by ${artist || credit || 'Contributor'} (${licenseShort}) via Wikimedia Commons`
        : `Public Domain visual via Wikimedia Commons`;

      assets.push({
        id: `wiki-${page.pageid || pageId}`,
        type: 'photo',
        provider: 'wikimedia_commons',
        sourceUrl: page.fullurl || `https://commons.wikimedia.org/?curid=${pageId}`,
        mediaUrl: info.url,
        thumbnailUrl: info.thumburl || info.url,
        creator: artist || 'Wikimedia Contributor',
        license: licenseShort || (isPublicDomain ? 'Public Domain' : 'Creative Commons'),
        licenseUrl: meta.LicenseUrl?.value || 'https://creativecommons.org/',
        attributionText,
        attributionRequired,
        retrievedAt: new Date().toISOString(),
        approved: true
      });

      if (assets.length >= maxResults) break;
    }

    return assets;
  } catch (err) {
    console.warn('[Realtime Visuals] Wikimedia search notice:', err);
    return [];
  }
}

/**
 * Real-time Openverse Creative Commons & Public Domain Search (Unseeded & Free)
 */
export async function searchOpenverseRealtime(
  optimizedQuery: string,
  maxResults: number = 6
): Promise<VisualAssetRecord[]> {
  try {
    const cleanTerms = optimizedQuery.replace(/-[a-z0-9_]+/gi, '').trim();
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(cleanTerms)}&page_size=${maxResults}&license_type=commercial`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VoxamFactoryRealtimeEngine/2.0 (devmeziem@gmail.com)'
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.results || [];
    const assets: VisualAssetRecord[] = [];

    for (const item of results) {
      if (!item.url) continue;

      const license = item.license || 'CC';
      const isCC0 = license.toLowerCase().includes('cc0') || license.toLowerCase().includes('pdm');

      assets.push({
        id: `openverse-${item.id}`,
        type: 'photo',
        provider: 'openverse',
        sourceUrl: item.foreign_landing_url || item.url,
        mediaUrl: item.url,
        thumbnailUrl: item.thumbnail || item.url,
        creator: item.creator || 'Openverse Contributor',
        license: `CC ${license.toUpperCase()}`,
        licenseUrl: item.license_url || 'https://creativecommons.org/',
        attributionText: isCC0 ? 'Public Domain via Openverse' : `Photo by ${item.creator || 'Creator'} (${license.toUpperCase()}) via Openverse`,
        attributionRequired: !isCC0,
        retrievedAt: new Date().toISOString(),
        approved: true
      });
    }

    return assets;
  } catch (err) {
    console.warn('[Realtime Visuals] Openverse search notice:', err);
    return [];
  }
}

/**
 * Real-time Pexels Search (Live API, portrait 9:16 oriented)
 */
export async function searchPexelsRealtime(
  optimizedQuery: string,
  apiKey?: string,
  maxResults: number = 6
): Promise<{ photos: VisualAssetRecord[]; videos: VisualAssetRecord[] }> {
  const effectiveKey = apiKey || (typeof process !== 'undefined' ? process.env?.PEXELS_API_KEY : '') || '';
  if (!effectiveKey) {
    return { photos: [], videos: [] };
  }

  try {
    const searchTerms = optimizedQuery.replace(/-[a-z0-9_]+/gi, '').trim();
    const photoUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerms)}&orientation=portrait&per_page=${maxResults}`;
    
    const photoRes = await fetch(photoUrl, {
      headers: { Authorization: effectiveKey }
    });

    const photos: VisualAssetRecord[] = [];
    if (photoRes.ok) {
      const data = await photoRes.json();
      (data.photos || []).forEach((p: any) => {
        photos.push({
          id: `pexels-${p.id}`,
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
          approved: true
        });
      });
    }

    // Video queries
    const videoUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerms)}&orientation=portrait&per_page=3`;
    const videoRes = await fetch(videoUrl, {
      headers: { Authorization: effectiveKey }
    });

    const videos: VisualAssetRecord[] = [];
    if (videoRes.ok) {
      const data = await videoRes.json();
      (data.videos || []).forEach((v: any) => {
        const bestFile = v.video_files?.find((f: any) => f.width === 1080 && f.height === 1920) || v.video_files?.[0];
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
            approved: true
          });
        }
      });
    }

    return { photos, videos };
  } catch (err) {
    console.warn('[Realtime Visuals] Pexels search notice:', err);
    return { photos: [], videos: [] };
  }
}

/**
 * Primary Real-Time Visual Discovery Engine with Zero Seeding & 4-Video Deduplication
 *
 * Sequence:
 * 1. Cleans & Optimizes Query (Applies channel rules, bans cartoons for finance)
 * 2. Parallel Real-Time Search (Wikimedia Commons, Openverse, Pexels if keyed)
 * 3. Enforces 4-Video Rolling Window Deduplication (Filters candidate images against channel's last 4 videos)
 * 4. Returns pristine, live visual asset records
 */
export async function searchRealtimeVisuals(
  rawQuery: string,
  options: VisualSearchOptions = {}
): Promise<RealtimeSearchResult> {
  const channelKey = options.channelKey || 'archie';
  const maxResults = options.maxResults || 6;
  const isFinChannel = channelKey.toLowerCase().includes('fin') || channelKey.toLowerCase().includes('bones');
  const strictNoCartoon = options.strictNoCartoon ?? isFinChannel;

  const optimizedQuery = optimizeVisualQuery(rawQuery, channelKey, strictNoCartoon);
  const sourcesSearched: string[] = [];

  // Execute searches in parallel
  const searchPromises: Promise<any>[] = [
    searchWikimediaRealtime(optimizedQuery, maxResults)
      .then(res => { sourcesSearched.push('Wikimedia Commons (Free/Realtime)'); return res; }),
    searchOpenverseRealtime(optimizedQuery, maxResults)
      .then(res => { sourcesSearched.push('Openverse (Creative Commons/Realtime)'); return res; })
  ];

  if (options.pexelsApiKey) {
    searchPromises.push(
      searchPexelsRealtime(optimizedQuery, options.pexelsApiKey, maxResults)
        .then(res => { sourcesSearched.push('Pexels API (Realtime)'); return res; })
    );
  }

  const results = await Promise.allSettled(searchPromises);

  const rawPhotos: VisualAssetRecord[] = [];
  const rawVideos: VisualAssetRecord[] = [];

  results.forEach(res => {
    if (res.status === 'fulfilled') {
      if (Array.isArray(res.value)) {
        rawPhotos.push(...res.value);
      } else if (res.value && typeof res.value === 'object') {
        if (Array.isArray(res.value.photos)) rawPhotos.push(...res.value.photos);
        if (Array.isArray(res.value.videos)) rawVideos.push(...res.value.videos);
      }
    }
  });

  // Deduplicate results within the same batch by normalized URL
  const uniqueInBatch = new Map<string, VisualAssetRecord>();
  rawPhotos.forEach(p => {
    const norm = normalizeImageUrl(p.mediaUrl);
    if (!uniqueInBatch.has(norm)) {
      uniqueInBatch.set(norm, p);
    }
  });

  // Enforce 4-Video Rolling Window Deduplication Rule
  const { allowed: dedupedPhotos, rejected } = filterDedupedImages(
    channelKey,
    Array.from(uniqueInBatch.values())
  );

  return {
    query: rawQuery,
    optimizedQuery,
    channelKey,
    photos: dedupedPhotos.slice(0, maxResults),
    videos: rawVideos.slice(0, 3),
    rejectedDuplicates: rejected.length,
    sourcesSearched
  };
}
