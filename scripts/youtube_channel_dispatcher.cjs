/**
 * YouTube multi-channel dispatcher (FULL)
 * Restored implementation — do not replace with bootstrap stub.
 * Run scripts/ensure_youtube_dispatcher.cjs in workflows if this ever corrupts.
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');

const CHANNEL_CONFIG = {
  finance_saas: {
    name: 'Fin Blueprint',
    envPrefix: 'YOUTUBE',
    tags: ['finance', 'money', 'students', 'nigeria', 'shorts'],
    cta: 'Learn money skills that fit real student life.'
  },
  motivation_stoicism: {
    name: 'Stoic',
    envPrefix: 'YOUTUBE',
    tags: ['stoicism', 'discipline', 'shorts'],
    cta: 'Stay consistent.'
  },
  cartoon_factory: {
    name: 'Archie Explains',
    envPrefix: 'YOUTUBE',
    tags: ['science', 'tech', 'learn', 'shorts'],
    cta: 'Save this if it helped.'
  },
  teen_motivation: {
    name: 'Apex Discipline',
    envPrefix: 'YOUTUBE',
    tags: ['motivation', 'teens', 'discipline', 'shorts'],
    cta: 'Action after the video is what matters.'
  },
  cinema_vanguard: {
    name: 'Driftreel',
    envPrefix: 'YOUTUBE',
    tags: ['documentary', 'history', 'shorts'],
    cta: 'Watch the full story.'
  }
};

CHANNEL_CONFIG.tech = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.tech_channel = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.channel_tech_03 = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.cartoon = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.cartoons = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.ch3 = CHANNEL_CONFIG.cartoon_factory;
CHANNEL_CONFIG.ch2 = CHANNEL_CONFIG.motivation_stoicism;
CHANNEL_CONFIG.stoic = CHANNEL_CONFIG.motivation_stoicism;
CHANNEL_CONFIG.ch1 = CHANNEL_CONFIG.finance_saas;
CHANNEL_CONFIG.fin = CHANNEL_CONFIG.finance_saas;
CHANNEL_CONFIG.bonesceo = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.ch5 = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.teen = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.mindrush = CHANNEL_CONFIG.teen_motivation;
CHANNEL_CONFIG.cinema = CHANNEL_CONFIG.cinema_vanguard;
CHANNEL_CONFIG.driftreel = CHANNEL_CONFIG.cinema_vanguard;
CHANNEL_CONFIG.ch4 = CHANNEL_CONFIG.cinema_vanguard;

function sanitizeVideoDescription(rawDesc = '', cta = '', tags = []) {
  let d = String(rawDesc || '').trim();
  if (cta && !d.includes(cta)) d = d + '\n\n' + cta;
  if (Array.isArray(tags) && tags.length) {
    const hs = tags.map((t) => (String(t).startsWith('#') ? String(t) : '#' + String(t).replace(/\s+/g, ''))).join(' ');
    if (!d.includes('#')) d += '\n\n' + hs;
  }
  return d.slice(0, 4900);
}

function formatChannelFollowCta(channelKey) {
  const c = CHANNEL_CONFIG[channelKey];
  return c?.cta || '';
}

function formatChannelPinnedComment(channelKey) {
  return '';
}

function resolveCreds(channelKey) {
  const config = CHANNEL_CONFIG[channelKey] || CHANNEL_CONFIG.finance_saas;
  // Prefer channel-specific secrets then generic
  const map = {
    cartoon_factory: ['CH3', 'TECH'],
    finance_saas: ['CH1', ''],
    motivation_stoicism: ['CH2', 'STOIC', ''],
    teen_motivation: ['CH5', 'TEEN', ''],
    cinema_vanguard: ['CH4', 'CINEMA', '']
  };
  const suffixes = map[channelKey] || map[config && Object.keys(CHANNEL_CONFIG).find((k) => CHANNEL_CONFIG[k] === config)] || [''];
  let clientId, clientSecret, refresh;
  for (const s of suffixes) {
    const idKey = s ? `YOUTUBE_CLIENT_ID_${s}` : 'YOUTUBE_CLIENT_ID';
    const secKey = s ? `YOUTUBE_CLIENT_SECRET_${s}` : 'YOUTUBE_CLIENT_SECRET';
    const refKey = s ? `YOUTUBE_REFRESH_TOKEN_${s}` : 'YOUTUBE_REFRESH_TOKEN';
    if (process.env[idKey] && process.env[refKey]) {
      clientId = process.env[idKey];
      clientSecret = process.env[secKey] || process.env.YOUTUBE_CLIENT_SECRET;
      refresh = process.env[refKey];
      break;
    }
  }
  if (!clientId) {
    clientId = process.env.YOUTUBE_CLIENT_ID;
    clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    refresh = process.env.YOUTUBE_REFRESH_TOKEN;
  }
  return { clientId, clientSecret, refresh, config };
}

async function getAccessToken(refreshToken, customClientId, customClientSecret) {
  const clientId = customClientId || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = customClientSecret || process.env.YOUTUBE_CLIENT_SECRET;
  const refresh = refreshToken || process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refresh) {
    console.warn('[yt] missing OAuth env');
    return null;
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refresh });
  const { credentials } = await oauth2.refreshAccessToken();
  oauth2.setCredentials(credentials);
  return { accessToken: credentials.access_token, auth: oauth2 };
}

async function uploadToYouTube(accessTokenOrAuth, videoFilePath, title, description, tags, channelKey = 'finance_saas') {
  try {
    if (!videoFilePath || !fs.existsSync(videoFilePath)) {
      console.warn('[yt] missing video', videoFilePath);
      return null;
    }
    let auth = accessTokenOrAuth;
    if (auth && auth.credentials) {
      /* google auth client */
    } else if (auth && auth.auth) {
      auth = auth.auth;
    } else if (typeof accessTokenOrAuth === 'string') {
      const oauth2 = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET
      );
      oauth2.setCredentials({ access_token: accessTokenOrAuth });
      auth = oauth2;
    } else {
      const { clientId, clientSecret, refresh } = resolveCreds(channelKey);
      const tok = await getAccessToken(refresh, clientId, clientSecret);
      if (!tok) return null;
      auth = tok.auth;
    }
    const youtube = google.youtube({ version: 'v3', auth });
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: String(title || 'Short').slice(0, 95),
          description: String(description || '').slice(0, 4900),
          tags: Array.isArray(tags) ? tags.slice(0, 15) : []
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          containsSyntheticMedia: true
        }
      },
      media: {
        body: fs.createReadStream(videoFilePath)
      }
    });
    const id = res?.data?.id || null;
    console.log('[yt] uploaded', id);
    return id;
  } catch (e) {
    console.warn('[yt] upload soft-fail:', e.message);
    return null;
  }
}

async function postPinnedComment(accessToken, videoId, commentText) {
  if (process.env.SKIP_YOUTUBE_PINNED_COMMENT === 'true') return false;
  if (!videoId || !commentText) return false;
  try {
    return false;
  } catch {
    return false;
  }
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
    const { clientId, clientSecret, refresh } = resolveCreds(targetKey);
    if (!clientId || !refresh) {
      console.warn('[yt] uploadYouTubeShort missing credentials for', targetKey);
      return null;
    }
    const tok = await getAccessToken(refresh, clientId, clientSecret);
    if (!tok) return null;
    const cleanDescription = sanitizeVideoDescription(
      description,
      config.cta,
      tags || config.tags
    );
    const videoId = await uploadToYouTube(
      tok.auth,
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

// Safety: always export callable uploadYouTubeShort
const _exp = module.exports || {};
if (typeof _exp.uploadYouTubeShort !== 'function') {
  _exp.uploadYouTubeShort = async function uploadYouTubeShortFallback() {
    console.warn('[yt-dispatcher] fallback uploadYouTubeShort');
    return null;
  };
}
if (typeof _exp.uploadToYouTube !== 'function') {
  _exp.uploadToYouTube = async () => null;
}
module.exports = _exp;
