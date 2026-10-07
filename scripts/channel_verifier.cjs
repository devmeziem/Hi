#!/usr/bin/env node

/**
 * ==============================================================================
 * Central Dynamic Channel Verifier & Registry
 * ==============================================================================
 * Resolves, verifies, and syncs channel handles, watermarks, and credentials
 * dynamically across all video pipelines and publishing workflows.
 *
 * Strictly prevents hardcoding wrong handles or mismatches:
 *  - Channel 1 (Finance): @bones_ceo / Fin Blueprint
 *  - Channel 2 (Stoic): @TheStoicArchitect / The Stoic Architect
 *  - Channel 3 (Archie / Tech): @ArchieExplains / Archie Explains
 *  - Channel 4 (Episodic Movies & TikTok Documentary Niche): @CinemaVanguard / Cinema Vanguard
 *  - Channel 5 (Teen & Youth Motivation): @MindRushOfficial / MindRush
 * ==============================================================================
 */

const https = require('https');

const CHANNELS = {
  ch1: {
    key: 'finance',
    name: 'Fin Blueprint',
    role: 'Financial Quotes & Wealth SaaS',
    defaultHandle: '@bones_ceo',
    envHandles: ['YOUTUBE_HANDLE_CH1', 'YOUTUBE_HANDLE_FIN', 'YOUTUBE_HANDLE'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH1',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH1',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH1',
    bufferEnv: ['BUFFER_TIKTOK_CHANNEL_ID', 'BUFFER_FACEBOOK_CHANNEL_ID', 'BUFFER_INSTAGRAM_CHANNEL_ID']
  },
  ch2: {
    key: 'stoic',
    name: 'The Stoic Architect',
    role: 'Daily Stoic Wisdom & Fortitude',
    defaultHandle: '@TheStoicArchitect',
    envHandles: ['YOUTUBE_HANDLE_CH2', 'YOUTUBE_HANDLE_STOIC'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH2',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH2',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH2',
    bufferEnv: []
  },
  ch3: {
    key: 'archie',
    name: 'Archie Explains',
    role: 'Science, Tech & Trivia 2D/3D Cartoon',
    defaultHandle: '@ArchieExplains',
    envHandles: ['YOUTUBE_HANDLE_CH3', 'YOUTUBE_HANDLE_TECH', 'YOUTUBE_HANDLE_CARTOON'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH3',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH3',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH3',
    bufferEnv: ['BUFFER_TIKTOK_CHANNEL_ID_ARCHIE']
  },
  ch4: {
    key: 'movie_brand',
    name: 'Cinema Vanguard',
    role: 'Episodic Movies & Crime/Horror/Mystery Documentaries',
    defaultHandle: '@CinemaVanguard',
    aliases: ['documentary', 'driftreel', 'episodic', 'protocol_zero', 'ch4', 'cinema'],
    envHandles: ['YOUTUBE_HANDLE_CH4', 'YOUTUBE_HANDLE_MOVIE', 'TIKTOK_HANDLE_DRIFTREEL'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH4',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH4',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH4',
    bufferEnv: ['BUFFER_TIKTOK_DRIFTREEL_CHANNEL_ID', 'BUFFER_TIKTOK_MOVIE_CHANNEL_ID']
  },
  ch5: {
    key: 'teen_motivation',
    name: 'MindRush',
    role: 'Teen & Youth Everyday Realities Motivation',
    defaultHandle: '@MindRushOfficial',
    aliases: ['motivation', 'apex_discipline', 'youth', 'teen', 'ch5'],
    envHandles: ['YOUTUBE_HANDLE_CH5', 'YOUTUBE_HANDLE_TEEN', 'YOUTUBE_HANDLE_MOTIVATION'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH5',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH5',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH5',
    bufferEnv: ['BUFFER_TIKTOK_TEEN_CHANNEL_ID', 'BUFFER_TIKTOK_MOTIVATION_CHANNEL_ID']
  }
};

/**
 * Normalizes input key to standard channel key (ch1, ch2, ch3, ch4, ch5)
 */
function resolveChannelKey(rawKey = '') {
  const norm = String(rawKey || '').toLowerCase().trim().replace(/^@/, '');
  if (['1', 'ch1', 'fin', 'finance', 'finance_saas', 'bones_ceo', 'bonesceo'].includes(norm)) return 'ch1';
  if (['2', 'ch2', 'stoic', 'thestoicarchitect', 'stoicism', 'philosophy'].includes(norm)) return 'ch2';
  if (['3', 'ch3', 'tech', 'archie', 'cartoon', 'cartoon_factory', 'archieexplains'].includes(norm)) return 'ch3';
  if (['4', 'ch4', 'movie', 'movie_brand', 'cinema', 'cinemavanguard', 'documentary', 'driftreel', 'protocol_zero', 'ghost_vault'].includes(norm)) return 'ch4';
  if (['5', 'ch5', 'teen', 'teen_motivation', 'mindrush', 'mindrushofficial', 'youth', 'apex_discipline'].includes(norm)) return 'ch5';
  return 'ch4'; // Default to episodic movie / documentary channel
}

/**
 * Resolves the verified channel handle for watermarks and video branding.
 * Checks environment overrides first, then configured defaults.
 */
function getVerifiedChannelHandle(targetKey) {
  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey];
  if (!def) return '@CinemaVanguard';

  for (const envVar of def.envHandles) {
    if (process.env[envVar] && process.env[envVar].trim()) {
      let h = process.env[envVar].trim();
      return h.startsWith('@') ? h : `@${h}`;
    }
  }

  return def.defaultHandle;
}

/**
 * Resolves verified channel display metadata for video watermarks and outro cards
 */
function getChannelMeta(targetKey) {
  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey] || CHANNELS.ch4;
  const handle = getVerifiedChannelHandle(resolvedKey);

  return {
    channelKey: resolvedKey,
    canonicalKey: def.key,
    name: def.name,
    role: def.role,
    handle,
    cleanHandle: handle.replace(/^@/, ''),
    watermarkText: `${def.name.toUpperCase()} • ${handle}`
  };
}

/**
 * Optional Live Verification: Queries YouTube Data API if token is provided
 */
async function verifyYouTubeLiveProfile(accessToken) {
  if (!accessToken) return null;
  return new Promise((resolve) => {
    const req = https.request('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const item = json.items?.[0]?.snippet;
          if (item) {
            resolve({
              title: item.title,
              handle: item.customUrl ? (item.customUrl.startsWith('@') ? item.customUrl : `@${item.customUrl}`) : null
            });
            return;
          }
        } catch {}
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

module.exports = {
  CHANNELS,
  resolveChannelKey,
  getVerifiedChannelHandle,
  getChannelMeta,
  verifyYouTubeLiveProfile
};
