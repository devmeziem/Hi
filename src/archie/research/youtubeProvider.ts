import { SourceRecord } from '../types';

interface YouTubeSearchItem {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
}

// In-memory 48-hour cache to protect YouTube search quota (100 units/call)
const queryCache = new Map<string, { timestamp: number; items: YouTubeSearchItem[] }>();
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;

function hashQuery(query: string): string {
  return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * YouTube Research Provider (Master Spec Section 9, 47)
 */
export async function searchYouTubeSignals(
  topic: string,
  apiKey?: string,
  maxResults: number = 5
): Promise<{
  sources: SourceRecord[];
  signalScore: number;
  existingVideoTitles: string[];
}> {
  const normKey = hashQuery(topic);
  const now = Date.now();

  // Check cache first to save quota
  const cached = queryCache.get(normKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const items = cached.items;
    return formatResults(items, topic);
  }

  const effectiveKey = apiKey || process.env.YOUTUBE_API_KEY || '';
  if (!effectiveKey) {
    return {
      sources: [],
      signalScore: 50,
      existingVideoTitles: [`Simulated demand signal for "${topic}"`]
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&maxResults=${maxResults}&key=${effectiveKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[YouTube Provider] API call returned status ${res.status}`);
      return { sources: [], signalScore: 40, existingVideoTitles: [] };
    }

    const data = await res.json();
    const items: YouTubeSearchItem[] = (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId || '',
      title: item.snippet?.title || '',
      channelTitle: item.snippet?.channelTitle || '',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || ''
    }));

    queryCache.set(normKey, { timestamp: now, items });
    return formatResults(items, topic);
  } catch (err) {
    console.warn('[YouTube Provider] Failed to execute YouTube search:', err);
    return { sources: [], signalScore: 40, existingVideoTitles: [] };
  }
}

function formatResults(items: YouTubeSearchItem[], topic: string) {
  const sources: SourceRecord[] = items.slice(0, 3).map((item, idx) => ({
    id: `yt-${item.videoId || idx + 1}`,
    title: `YouTube: "${item.title}"`,
    url: `https://www.youtube.com/watch?v=${item.videoId}`,
    publisher: item.channelTitle || 'YouTube Creator',
    sourceType: 'discovery_source',
    extractedSnippet: item.description.slice(0, 200),
    accessedAt: new Date().toISOString(),
    reliabilityScore: 5.0
  }));

  const signalScore = Math.min(95, Math.max(30, items.length * 18));
  const existingVideoTitles = items.map(i => i.title);

  return {
    sources,
    signalScore,
    existingVideoTitles
  };
}
