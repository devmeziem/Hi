#!/usr/bin/env node

/**
 * Central Dynamic Channel Verifier & Registry
 * Movie TikTok (Buffer API2) is archie.the.explorer6 — not @CinemaVanguard handle on TikTok.
 */

const CHANNELS = {
  ch1: {
    key: 'finance',
    name: 'Fin Blueprint',
    role: 'Financial Quotes & Wealth SaaS',
    defaultHandle: '@bones_ceo',
    aliases: ['bones_ceo', 'only_lanecash', 'fin'],
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
    aliases: ['stoic'],
    envHandles: ['YOUTUBE_HANDLE_CH2', 'YOUTUBE_HANDLE_STOIC'],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH2',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH2',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH2',
    bufferEnv: []
  },
  ch3: {
    key: 'archie',
    name: 'Archie Explains',
    role: 'Science, Tech & Trivia Cartoon (YouTube @bonesceo per owner)',
    defaultHandle: '@bonesceo',
    aliases: ['archie', 'bonesceo', 'archieexplains', 'cartoon'],
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
    // TikTok account for this niche is archie.the.explorer6 (Buffer movie channel ID)
    defaultHandle: '@archie.the.explorer6',
    aliases: [
      'documentary',
      'driftreel',
      'episodic',
      'protocol_zero',
      'ch4',
      'cinema',
      'cinemavanguard',
      'archie',
      'archie.the.explorer6',
      'archie.the.explorer',
      'explorer',
      'vanguard',
      'movie'
    ],
    envHandles: [
      'YOUTUBE_HANDLE_CH4',
      'YOUTUBE_HANDLE_CINEMA',
      'TIKTOK_HANDLE_MOVIE',
      'TIKTOK_HANDLE_CINEMA',
      'BUFFER_TIKTOK_MOVIE_CHANNEL_ID'
    ],
    youtubeClientEnv: 'YOUTUBE_CLIENT_ID_CH4',
    youtubeSecretEnv: 'YOUTUBE_CLIENT_SECRET_CH4',
    youtubeRefreshEnv: 'YOUTUBE_REFRESH_TOKEN_CH4',
    bufferEnv: ['BUFFER_TIKTOK_MOVIE_CHANNEL_ID', 'BUFFER_TIKTOK_DRIFTREEL_CHANNEL_ID']
  },
  ch5: {
    key: 'teen_motivation',
    name: 'Teens Motivation',
    role: 'Teen & Youth Motivation (TikTok bonesceo)',
    defaultHandle: '@bonesceo',
    aliases: [
      'motivation',
      'apex_discipline',
      'youth',
      'teen',
      'ch5',
      'bonesceo',
      'bones_ceo',
      'mindrush',
      'mindrushofficial'
    ],
    envHandles: ['TIKTOK_HANDLE_TEEN', 'TIKTOK_HANDLE_BONESCEO', 'BUFFER_TIKTOK_TEEN_CHANNEL_ID'],
    youtubeClientEnv: null,
    youtubeSecretEnv: null,
    youtubeRefreshEnv: null,
    bufferEnv: ['BUFFER_TIKTOK_TEEN_CHANNEL_ID']
  }
};

function resolveChannelKey(rawKey = '') {
  const norm = String(rawKey || '')
    .toLowerCase()
    .trim()
    .replace(/^@/, '');
  if (['1', 'ch1', 'fin', 'finance', 'finance_saas'].includes(norm)) return 'ch1';
  if (['2', 'ch2', 'stoic', 'thestoicarchitect', 'stoicism', 'philosophy'].includes(norm)) return 'ch2';
  if (['3', 'ch3', 'tech', 'archie', 'cartoon', 'cartoon_factory', 'archieexplains'].includes(norm)) return 'ch3';
  if (
    [
      '4',
      'ch4',
      'movie',
      'movie_brand',
      'cinema',
      'cinemavanguard',
      'documentary',
      'driftreel',
      'driftreel_documentary',
      'protocol_zero',
      'ghost_vault'
    ].includes(norm)
  )
    return 'ch4';
  if (
    ['5', 'ch5', 'teen', 'teen_motivation', 'mindrush', 'mindrushofficial', 'youth', 'apex_discipline', 'bonesceo', 'bones_ceo'].includes(
      norm
    )
  )
    return 'ch5';
  return 'ch4';
}

function getVerifiedChannelHandle(targetKey) {
  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey];
  if (!def) return null;

  for (const envVar of def.envHandles) {
    if (process.env[envVar] && process.env[envVar].trim()) {
      let h = process.env[envVar].trim();
      return h.startsWith('@') ? h : `@${h}`;
    }
  }

  if (process.env.VERIFIED_CHANNEL_HANDLE && process.env.VERIFIED_CHANNEL_HANDLE.trim()) {
    let h = process.env.VERIFIED_CHANNEL_HANDLE.trim();
    return h.startsWith('@') ? h : `@${h}`;
  }

  return def.defaultHandle || null;
}

function getChannelMeta(resolvedKey) {
  return CHANNELS[resolvedKey] || null;
}

async function verifyYouTubeLiveProfile() {
  return { ok: true };
}

/**
 * Verify Buffer/TikTok channel from live API.
 * For cinema (ch4): archie.the.explorer6 is the correct TikTok.
 * ID match against BUFFER_TIKTOK_MOVIE_CHANNEL_ID always counts as verified.
 */
function verifyChannelOrSkip(targetKey, apiChannel) {
  if (!apiChannel) {
    console.warn(`[Channel Verifier] No API channel payload for ${targetKey}.`);
    return { verified: false, skip: true, reason: 'NO_API_CHANNEL_DATA' };
  }

  const resolvedKey = resolveChannelKey(targetKey);
  const def = CHANNELS[resolvedKey];
  if (!def) {
    return { verified: false, skip: true, reason: 'UNKNOWN_CHANNEL_KEY' };
  }

  const channelName = (apiChannel.name || apiChannel.title || apiChannel.displayName || '').toLowerCase();
  const channelHandle = (apiChannel.handle || apiChannel.customUrl || apiChannel.username || '')
    .toLowerCase()
    .replace(/^@/, '');
  const channelId = String(apiChannel.id || '').toLowerCase();

  const expectedHandle = def.defaultHandle.toLowerCase().replace(/^@/, '');
  const expectedName = def.name.toLowerCase();
  const aliases = (def.aliases || []).map((a) => a.toLowerCase());

  // Hard ID match from secrets (most reliable for Buffer TikTok)
  const movieId = String(process.env.BUFFER_TIKTOK_MOVIE_CHANNEL_ID || '').toLowerCase();
  const teenId = String(process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID || '').toLowerCase();
  const idMatchesMovie = movieId && channelId === movieId && resolvedKey === 'ch4';
  const idMatchesTeen = teenId && channelId === teenId && resolvedKey === 'ch5';

  const matchesHandle =
    channelHandle && (channelHandle.includes(expectedHandle) || expectedHandle.includes(channelHandle));
  const matchesName = channelName && (channelName.includes(expectedName) || expectedName.includes(channelName));
  const matchesAlias = aliases.some((a) => channelName.includes(a) || channelHandle.includes(a));

  const envMatches = def.envHandles.some((env) => {
    const val = (process.env[env] || '').toLowerCase().replace(/^@/, '');
    return val && (channelHandle.includes(val) || channelName.includes(val) || channelId === val);
  });

  const isVerified = Boolean(idMatchesMovie || idMatchesTeen || matchesHandle || matchesName || matchesAlias || envMatches);

  if (!isVerified) {
    console.warn(`\n[Channel Verifier Guard] Channel mismatch detected from API!`);
    console.warn(` • Expected: "${def.name}" (${def.defaultHandle})`);
    console.warn(` • API Returned: "${apiChannel.name || apiChannel.title || 'Unknown'}" (${channelHandle || 'no handle'})`);
    console.warn(` • ACTION: SKIPPING publishing to prevent wrong username posting.\n`);
    return {
      verified: false,
      skip: true,
      reason: 'CHANNEL_NAME_NOT_VERIFIED_FROM_API',
      expected: def.name,
      received: apiChannel.name || apiChannel.title
    };
  }

  console.log(
    `[Channel Verifier] OK ${resolvedKey} → "${apiChannel.name}" id=${apiChannel.id} (idMatch=${idMatchesMovie || idMatchesTeen})`
  );
  return {
    verified: true,
    skip: false,
    channelMeta: getChannelMeta(resolvedKey)
  };
}

function cleanDescription(rawText) {
  if (!rawText) return '';
  let cleaned = String(rawText);
  cleaned = cleaned.replace(/undefined\s+undefined\s+undefined/gi, '');
  cleaned = cleaned.replace(/\bundefined\b/gi, '');
  cleaned = cleaned.replace(/\bnull\b/gi, '');
  cleaned = cleaned.replace(/\[Audio Engine\].*$/gim, '');
  cleaned = cleaned.replace(/\[Voice Synthesis\].*$/gim, '');
  cleaned = cleaned.replace(/\[Engine Logs?\].*$/gim, '');
  cleaned = cleaned.replace(/\[Pipeline\].*$/gim, '');
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
