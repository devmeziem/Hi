export interface YouTubeAnalyticsResponse {
  channel: {
    id: string;
    title: string;
    customUrl: string;
    thumbnail: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
  };
}

export async function refreshYouTubeOAuthToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || `Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function fetchYouTubeAnalyticsClient(credentials: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<YouTubeAnalyticsResponse> {
  const accessToken = await refreshYouTubeOAuthToken(credentials.clientId, credentials.clientSecret, credentials.refreshToken);

  const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new Error(`YouTube API request failed with status: ${res.status}`);
  }

  const json = await res.json();
  if (!json.items || json.items.length === 0) {
    throw new Error('No YouTube channel found for the authenticated account.');
  }

  const item = json.items[0];
  return {
    channel: {
      id: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl || `@${item.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      videoCount: parseInt(item.statistics.videoCount || '0', 10)
    }
  };
}

export async function fetchYouTubeChannelByHandleOrId(
  identifier: string,
  credentials?: { clientId?: string; clientSecret?: string; refreshToken?: string }
): Promise<YouTubeAnalyticsResponse['channel']> {
  const clean = identifier.trim();
  let accessToken: string | null = null;
  
  if (credentials?.clientId && credentials?.clientSecret && credentials?.refreshToken) {
    try {
      accessToken = await refreshYouTubeOAuthToken(credentials.clientId, credentials.clientSecret, credentials.refreshToken);
    } catch {
      // fallback
    }
  }

  const queryParam = clean.startsWith('UC') ? `id=${clean}` : `forHandle=${clean.replace(/^@/, '')}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${queryParam}`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`YouTube Channel query failed: ${res.status}`);
  }

  const json = await res.json();
  if (!json.items || json.items.length === 0) {
    throw new Error(`No YouTube channel found for "${identifier}"`);
  }

  const item = json.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    customUrl: item.snippet.customUrl || (clean.startsWith('@') ? clean : `@${clean}`),
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
    viewCount: parseInt(item.statistics.viewCount || '0', 10),
    videoCount: parseInt(item.statistics.videoCount || '0', 10)
  };
}

export async function uploadToCloudinaryUnsigned(fileBlob: Blob, cloudName: string, uploadPreset: string = 'voxam_unsigned'): Promise<string> {
  const formData = new FormData();
  formData.append('file', fileBlob);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Cloudinary upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.secure_url || data.url;
}
