/**
 * YouTube multi-channel dispatcher — pure fetch (NO googleapis dependency)
 * Soft-fail uploads. containsSyntheticMedia when API accepts it.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CHANNEL_CONFIG = {
  finance_saas: {
    name: 'Fin Blueprint',
    tags: ['finance', 'money', 'students', 'shorts'],
    cta: 'Learn money skills that fit real student life.'
  },
  motivation_stoicism: {
    name: 'Stoic',
    tags: ['stoicism', 'discipline', 'shorts'],
    cta: 'Stay consistent.'
  },
  cartoon_factory: {
    name: 'Archie Explains',
    tags: ['science', 'tech', 'learn', 'shorts'],
    cta: 'Save this if it helped.'
  },
  teen_motivation: {
    name: 'Apex Discipline',
    tags: ['motivation', 'teens', 'discipline', 'shorts'],
    cta: 'Action after the video is what matters.'
  },
  cinema_vanguard: {
    name: 'Driftreel',
    tags: ['documentary', 'history', 'shorts'],
    cta: 'Watch the full story.'
  }
};

CHANNEL_CONFIG.tech = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.ch3 = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.cartoon = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.ch1 = CHANNEL_CONFIG.finance_saas;
CHANNEL_CONFIG.fin = CHANNEL_CONFIG.finance_saas;
CHANNEL_CONFIG.ch2 = CHANNEL_CONFIG.motivation_stoicism;
CHANNEL_CONFIG.stoic = CHANNEL_CONFIG.motivation_stoicism;
CHANNEL_CONFIG.ch5 = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.teen = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.bonesceo = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.ch4 = CHANNEL_CONFIG.cinema_vanguard;
CHANNEL_CONFIG.driftreel = CHANNEL_CONFIG.cinema_vanguard;

function sanitizeVideoDescription(rawDesc = '', cta = '', tags = []) {
  let d = String(rawDesc || '').trim();
  if (cta && !d.includes(cta)) d = d + '\n\n' + cta;
  if (Array.isArray(tags) && tags.length && !d.includes('#')) {
    const hs = tags
      .map((t) => (String(t).startsWith('#') ? String(t) : '#' + String(t).replace(/\s+/g, '')))
      .join(' ');
    d = d + '\n\n' + hs;
  }
  return d.slice(0, 4900);
}

function formatChannelFollowCta(channelKey) {
  return CHANNEL_CONFIG[channelKey]?.cta || '';
}
function formatChannelPinnedComment() {
  return '';
}

function resolveCreds(channelKey) {
  const map = {
    cartoon_factory: ['CH3', 'TECH', ''],
    finance_saas: ['CH1', ''],
    motivation_stoicism: ['CH2', 'STOIC', ''],
    teen_motivation: ['CH5', 'TEEN', ''],
    cinema_vanguard: ['CH4', 'CINEMA', '']
  };
  const suffixes = map[channelKey] || [''];
  for (const s of suffixes) {
    const idKey = s ? `YOUTUBE_CLIENT_ID_${s}` : 'YOUTUBE_CLIENT_ID';
    const secKey = s ? `YOUTUBE_CLIENT_SECRET_${s}` : 'YOUTUBE_CLIENT_SECRET';
    const refKey = s ? `YOUTUBE_REFRESH_TOKEN_${s}` : 'YOUTUBE_REFRESH_TOKEN';
    if (process.env[idKey] && process.env[refKey]) {
      return {
        clientId: process.env[idKey],
        clientSecret: process.env[secKey] || process.env.YOUTUBE_CLIENT_SECRET,
        refresh: process.env[refKey]
      };
    }
  }
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    refresh: process.env.YOUTUBE_REFRESH_TOKEN
  };
}

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = new URLSearchParams(body).toString();
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve({ error: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getAccessToken(refreshToken, customClientId, customClientSecret) {
  try {
    const clientId = customClientId || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = customClientSecret || process.env.YOUTUBE_CLIENT_SECRET;
    const refresh = refreshToken || process.env.YOUTUBE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refresh) {
      console.warn('[yt] missing OAuth env');
      return null;
    }
    const tok = await postForm('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: 'refresh_token'
    });
    if (!tok.access_token) {
      console.warn('[yt] token error', tok.error || tok);
      return null;
    }
    return tok.access_token;
  } catch (e) {
    console.warn('[yt] token soft-fail', e.message);
    return null;
  }
}

async function putVideo(uploadUrl, videoFilePath, token) {
  const buf = fs.readFileSync(videoFilePath);
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'video/*',
      'Content-Length': String(buf.length)
    },
    body: buf
  });
  const raw = await putRes.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn('[yt] put non-json', putRes.status, raw.slice(0, 200));
    return null;
  }
  if (!putRes.ok) {
    console.warn('[yt] put fail', putRes.status, raw.slice(0, 300));
    return null;
  }
  const id = data.id || null;
  console.log('[yt] uploaded', id);
  return id;
}

async function uploadToYouTube(accessToken, videoFilePath, title, description, tags, channelKey = 'finance_saas') {
  try {
    if (!videoFilePath || !fs.existsSync(videoFilePath)) {
      console.warn('[yt] missing video');
      return null;
    }
    let token = accessToken;
    if (!token || typeof token !== 'string') {
      const creds = resolveCreds(channelKey);
      token = await getAccessToken(creds.refresh, creds.clientId, creds.clientSecret);
    }
    if (!token) return null;

    const meta = {
      snippet: {
        title: String(title || 'Short').slice(0, 95),
        description: String(description || '').slice(0, 4900),
        tags: Array.isArray(tags) ? tags.slice(0, 15).map(String) : [],
        categoryId: '27'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        containsSyntheticMedia: true
      }
    };

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': String(fs.statSync(videoFilePath).size)
        },
        body: JSON.stringify(meta)
      }
    );
    if (!initRes.ok) {
      const t = await initRes.text();
      if (t.includes('containsSyntheticMedia') || initRes.status === 400) {
        delete meta.status.containsSyntheticMedia;
        const init2 = await fetch(
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json; charset=UTF-8',
              'X-Upload-Content-Type': 'video/*',
              'X-Upload-Content-Length': String(fs.statSync(videoFilePath).size)
            },
            body: JSON.stringify(meta)
          }
        );
        if (!init2.ok) {
          console.warn('[yt] init fail', init2.status, await init2.text());
          return null;
        }
        const uploadUrl2 = init2.headers.get('location');
        if (!uploadUrl2) return null;
        return await putVideo(uploadUrl2, videoFilePath, token);
      }
      console.warn('[yt] init fail', initRes.status, t.slice(0, 400));
      return null;
    }
    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      console.warn('[yt] no upload location');
      return null;
    }
    return await putVideo(uploadUrl, videoFilePath, token);
  } catch (e) {
    console.warn('[yt] upload soft-fail:', e.message);
    return null;
  }
}

async function postPinnedComment() {
  return false;
}
async function dispatchScheduledVideos() {
  console.log('[yt] dispatchScheduledVideos no-op');
}

async function uploadYouTubeShort({
  videoPath,
  title,
  description,
  tags,
  channelId = 'cartoon_factory'
} = {}) {
  try {
    const targetKey = channelId || 'cartoon_factory';
    const config = CHANNEL_CONFIG[targetKey] || CHANNEL_CONFIG.cartoon_factory;
    const creds = resolveCreds(targetKey);
    if (!creds.clientId || !creds.refresh) {
      console.warn('[yt] missing credentials for', targetKey);
      return null;
    }
    const token = await getAccessToken(creds.refresh, creds.clientId, creds.clientSecret);
    if (!token) return null;
    const cleanDescription = sanitizeVideoDescription(description, config.cta, tags || config.tags);
    const videoId = await uploadToYouTube(
      token,
      videoPath,
      title,
      cleanDescription,
      tags || config.tags,
      targetKey
    );
    return videoId ? { id: videoId, videoId } : null;
  } catch (e) {
    console.warn('[yt] uploadYouTubeShort soft-fail:', e.message);
    return null;
  }
}

module.exports = {
  CHANNEL_CONFIG,
  sanitizeVideoDescription,
  formatChannelFollowCta,
  formatChannelPinnedComment,
  getAccessToken,
  uploadToYouTube,
  uploadYouTubeShort,
  postPinnedComment,
  dispatchScheduledVideos
};
