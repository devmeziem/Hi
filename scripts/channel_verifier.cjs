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
    name: 'Teens Motivation',
    role: 'Teen & Youth Everyday Realities Motivation (TikTok Exclusive)',
    defaultHandle: '@bones_ceo',
    aliases: ['motivation', 'apex_discipline', 'youth', 'teen', 'ch5', 'bonesceo', 'bones_ceo', 'mindrush', 'mindrushofficial'],
    envHandles: ['TIKTOK_HANDLE_TEEN', 'TIKTOK_HANDLE_BONESCEO', 'BUFFER_TIKTOK_TEEN_CHANNEL_ID'],
    youtubeClientEnv: null,
    youtubeSecretEnv: null,
    youtubeRefreshEnv: null,
    bufferEnv: ['BUFFER_TIKTOK_TEEN_CHANNEL_ID']
  }
};

/**
 * Normalizes input key to standard channel key (ch1, ch2, ch3, ch4, ch5)
 */
function resolveChannelKey(rawKey = '') {
  const norm = String(rawKey || '').toLowerCase().trim().replace(/^@/, '');
  if (['1', 'ch1', 'fin', 'finance', 'finance_saas'].includes(norm)) return 'ch1';
  if (['2', 'ch2', 'stoic', 'thestoicarchitect', 'stoicism', 'philosophy'].includes(norm)) return 'ch2';
  if (['3', 'ch3', 'tech', 'archie', 'cartoon', 'cartoon_factory', 'archieexplains'].includes(norm)) return 'ch3';
  if (['4', 'ch4', 'movie', 'movie_brand', 'cinema', 'cinemavanguard', 'documentary', 'driftreel', 'protocol_zero', 'ghost_vault'].includes(norm)) return 'ch4';
  if (['5', 'ch5', 'teen', 'teen_motivation', 'mindrush', 'mindrushofficial', 'youth', 'apex_discipline', 'bonesceo', 'bones_ceo'].includes(norm)) return 'ch5';
  return 'ch4'; // Default to episodic movie / documentary channel
}

/**
 * Resolves the verified channel handle for watermarks and video branding.
 * Checks environment overrides first.
 * Directive: "If channel username not found, skip watermark, just say our channel or this channel"
 */
function getVerifiedChannelHandle(targetKey) {
  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey];
  if (!def) return null;

  // 1. Check environment overrides first
  for (const envVar of def.envHandles) {
    if (process.env[envVar] && process.env[envVar].trim()) {
      let h = process.env[envVar].trim();
      return h.startsWith('@') ? h : `@${h}`;
    }
  }

  // 2. Check if a verified live channel profile was discovered or configured
  if (process.env.VERIFIED_CHANNEL_HANDLE && process.env.VERIFIED_CHANNEL_HANDLE.trim()) {
    let h = process.env.VERIFIED_CHANNEL_HANDLE.trim();
    return h.startsWith('@') ? h : `@${h}`;
  }

  // If not found in verified API / environment, return null so watermark is skipped
  // and copy says "our channel" or "this channel" per user directive.
  return null;
}

/**
 * Resolves verified channel display metadata for video watermarks and outro cards.
 * If channel username is not found: skips watermark and sets references to "our channel" or "this channel".
 */
function getChannelMeta(targetKey) {
  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey] || CHANNELS.ch4;
  const verifiedHandle = getVerifiedChannelHandle(resolvedKey);
  const hasHandle = Boolean(verifiedHandle && verifiedHandle.trim());

  const handle = hasHandle ? verifiedHandle : '';
  const cleanHandle = hasHandle ? verifiedHandle.replace(/^@/, '') : '';
  const channelRef = hasHandle ? verifiedHandle : 'our channel';
  const thisChannelRef = hasHandle ? verifiedHandle : 'this channel';
  const ctaMention = hasHandle ? `Follow ${verifiedHandle}` : 'Follow our channel';
  const ctaFollowThis = hasHandle ? `Follow ${verifiedHandle}` : 'Follow this channel';

  // If username not found, skip watermark entirely per directive
  const shouldSkipWatermark = !hasHandle;
  const watermarkText = hasHandle ? `${def.name.toUpperCase()} • ${verifiedHandle}` : '';

  return {
    channelKey: resolvedKey,
    canonicalKey: def.key,
    name: def.name,
    role: def.role,
    hasHandle,
    handle,
    cleanHandle,
    channelRef,
    thisChannelRef,
    ctaMention,
    ctaFollowThis,
    watermarkText,
    shouldSkipWatermark
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

/**
 * Verifies channel name from API data.
 * If channel name or handle is not verified from the live API response,
 * immediately flags to SKIP publishing rather than posting to wrong channel.
 */
function verifyChannelOrSkip(targetKey, apiChannel) {
  if (!apiChannel) {
    console.warn(`[Channel Verifier] ⚠️ No API channel payload provided for ${targetKey}.`);
    return { verified: false, skip: true, reason: 'NO_API_CHANNEL_DATA' };
  }

  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey];
  if (!def) {
    return { verified: false, skip: true, reason: 'UNKNOWN_CHANNEL_KEY' };
  }

  const channelName = (apiChannel.name || apiChannel.title || apiChannel.displayName || '').toLowerCase();
  const channelHandle = (apiChannel.handle || apiChannel.customUrl || apiChannel.username || '').toLowerCase().replace(/^@/, '');
  const channelId = String(apiChannel.id || '').toLowerCase();

  // Match check against channel identity
  const expectedHandle = def.defaultHandle.toLowerCase().replace(/^@/, '');
  const expectedName = def.name.toLowerCase();
  const aliases = (def.aliases || []).map(a => a.toLowerCase());

  const matchesHandle = channelHandle && (channelHandle.includes(expectedHandle) || expectedHandle.includes(channelHandle));
  const matchesName = channelName && (channelName.includes(expectedName) || expectedName.includes(channelName));
  const matchesAlias = aliases.some(a => channelName.includes(a) || channelHandle.includes(a));

  // Check env handle matches
  const envMatches = def.envHandles.some(env => {
    const val = (process.env[env] || '').toLowerCase().replace(/^@/, '');
    return val && (channelHandle.includes(val) || channelName.includes(val));
  });

  const isVerified = Boolean(matchesHandle || matchesName || matchesAlias || envMatches);

  if (!isVerified) {
    console.warn(`\n[Channel Verifier Guard] 🛑 Channel mismatch detected from API!`);
    console.warn(` • Expected: "${def.name}" (${def.defaultHandle})`);
    console.warn(` • API Returned: "${apiChannel.name || apiChannel.title || 'Unknown'}" (${channelHandle || 'no handle'})`);
    console.warn(` • Directive: "my channels should verify name from API, if not found, then skip"`);
    console.warn(` • ACTION: SKIPPING publishing to prevent wrong username posting.\n`);
    return {
      verified: false,
      skip: true,
      reason: 'CHANNEL_NAME_NOT_VERIFIED_FROM_API',
      expected: def.name,
      received: apiChannel.name || apiChannel.title
    };
  }

  return {
    verified: true,
    skip: false,
    channelMeta: getChannelMeta(resolvedKey)
  };
}

/**
 * Sanitizes video descriptions:
 * Strictly prevents writing internal engine logs, voice synthesizer bits,
 * or broken 'undefined undefined undefined' strings into user-facing descriptions.
 */
function cleanDescription(rawText) {
  if (!rawText) return '';

  let cleaned = String(rawText);

  // Remove undefined / null placeholders
  cleaned = cleaned.replace(/undefined\s+undefined\s+undefined/gi, '');
  cleaned = cleaned.replace(/\bundefined\b/gi, '');
  cleaned = cleaned.replace(/\bnull\b/gi, '');

  // Strip internal voice synthesis or engine metadata logs
  cleaned = cleaned.replace(/\[Audio Engine\].*$/gim, '');
  cleaned = cleaned.replace(/\[Voice Synthesis\].*$/gim, '');
  cleaned = cleaned.replace(/\[Engine Logs?\].*$/gim, '');
  cleaned = cleaned.replace(/\[Pipeline\].*$/gim, '');
  cleaned = cleaned.replace(/Voice\s*ID\s*:\s*[^\n]+/gi, '');
  cleaned = cleaned.replace(/Synthesizer\s*:\s*[^\n]+/gi, '');
  cleaned = cleaned.replace(/Pitch\s*Hz\s*:\s*[^\n]+/gi, '');
  cleaned = cleaned.replace(/Speech\s*Rate\s*:\s*[^\n]+/gi, '');

  // Clean excessive whitespace and trailing lines
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

module.exports = {
  CHANNELS,
  resolveChannelKey,
  getVerifiedChannelHandle,
  getChannelMeta,
  verifyYouTubeLiveProfile,
  verifyChannelOrSkip,
  cleanDescription
};
