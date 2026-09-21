#!/usr/bin/env node

/**
 * ==============================================================================
 * Buffer TikTok Publisher for Movie Brand & Teen Motivation Channels
 * ==============================================================================
 * Connects to the second Buffer account (or secondary Buffer workspace) using
 * BUFFER_API_KEY_2 (or BUFFER_API_KEY as fallback) to publish:
 *  - Channel A: Movie Brand Episodic Video Reel -> TikTok Account 1
 *  - Channel B: Teen & Youth Motivation Reel    -> TikTok Account 2
 *
 * TikTok-First Philosophy:
 *  - Publishes directly to TikTok via Buffer GraphQL API (createPost mutation)
 *  - Fallbacks cleanly to Buffer REST API if token permissions dictate
 *  - Media relay via GitHub Release Asset CDN / Temporary HTTP 206 Direct Host
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const BUFFER_API_URL = 'https://api.buffer.com';

// Dedicated second Buffer token, falling back to primary token
const RAW_BUFFER_API_KEY_2 = String(
  process.env.BUFFER_API_KEY_2 ||
  process.env.BUFFER_TOKEN_2 ||
  process.env.BUFFER_API_KEY ||
  process.env.BUFFER_TOKEN ||
  ''
).trim();

function sanitizeToken(raw) {
  if (!raw) return '';
  let token = String(raw).trim();
  token = token.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token;
}

const BUFFER_API_KEY = sanitizeToken(RAW_BUFFER_API_KEY_2);

// Target TikTok channel IDs (Optional explicit overrides in GitHub Secrets)
const BUFFER_TIKTOK_MOVIE_CHANNEL_ID = String(
  process.env.BUFFER_TIKTOK_MOVIE_CHANNEL_ID ||
  process.env.BUFFER_TIKTOK_BRAND_CHANNEL_ID ||
  process.env.BUFFER_TIKTOK_CHANNEL_ID_MOVIE ||
  process.env.BUFFER_TIKTOK_CHANNEL_ID_1 ||
  ''
).trim();

const BUFFER_TIKTOK_TEEN_CHANNEL_ID = String(
  process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID ||
  process.env.BUFFER_TIKTOK_MOTIVATION_CHANNEL_ID ||
  process.env.BUFFER_TIKTOK_CHANNEL_ID_TEEN ||
  process.env.BUFFER_TIKTOK_CHANNEL_ID_2 ||
  ''
).trim();

const IS_DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SHARE_NOW = process.env.BUFFER_SHARE_NOW !== 'false';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function isValidChannelId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Make a GraphQL request to Buffer
 */
async function bufferRequest(query, variables = {}) {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUFFER_API_KEY}`
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Buffer non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok || (json.errors && json.errors.length > 0)) {
    const errorDetails = json.errors ? json.errors.map(e => e.message).join('; ') : `HTTP ${response.status}`;
    throw new Error(`Buffer API Error: ${errorDetails}`);
  }

  return json.data;
}

/**
 * Discover all TikTok channels connected to the second Buffer account
 */
async function discoverTikTokChannels() {
  console.log(`[Buffer TikTok Engine] 🔎 Scanning connected TikTok channels on Buffer...`);
  const tiktokChannels = [];

  // 1. Try GraphQL Organizations -> Channels
  try {
    const orgsQuery = `query GetOrganizations {
      account {
        id
        email
        organizations {
          id
          name
        }
      }
    }`;

    const orgsData = await bufferRequest(orgsQuery);
    const orgs = orgsData?.account?.organizations || [];

    for (const org of orgs) {
      try {
        const chQuery = `query GetChannels($organizationId: OrganizationId!) {
          channels(organizationId: $organizationId) {
            id
            name
            displayName
            service
            serviceId
            avatar
            isDisconnected
            isLocked
          }
        }`;
        const chData = await bufferRequest(chQuery, { organizationId: org.id });
        const list = chData?.channels || [];
        for (const ch of list) {
          if ((ch.service || '').toLowerCase() === 'tiktok') {
            tiktokChannels.push({
              id: ch.id,
              name: ch.displayName || ch.name || 'TikTok Channel',
              service: 'tiktok',
              isDisconnected: Boolean(ch.isDisconnected),
              isLocked: Boolean(ch.isLocked),
              orgName: org.name
            });
          }
        }
      } catch (chErr) {
        console.warn(`[Buffer TikTok Engine] Notice querying org "${org.name}": ${chErr.message}`);
      }
    }
  } catch (gqlErr) {
    console.warn(`[Buffer TikTok Engine] GraphQL account scan notice: ${gqlErr.message}`);
  }

  // 2. Try root channels query if empty
  if (tiktokChannels.length === 0) {
    try {
      const rootQuery = `query GetAllChannels {
        channels {
          id
          name
          displayName
          service
          serviceId
          isDisconnected
          isLocked
        }
      }`;
      const rootData = await bufferRequest(rootQuery);
      const list = rootData?.channels || [];
      for (const ch of list) {
        if ((ch.service || '').toLowerCase() === 'tiktok') {
          tiktokChannels.push({
            id: ch.id,
            name: ch.displayName || ch.name || 'TikTok Channel',
            service: 'tiktok',
            isDisconnected: Boolean(ch.isDisconnected),
            isLocked: Boolean(ch.isLocked),
            orgName: 'Default Workspace'
          });
        }
      }
    } catch {}
  }

  // 3. Fallback to classic REST profiles
  if (tiktokChannels.length === 0) {
    try {
      const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(BUFFER_API_KEY)}`);
      if (res.ok) {
        const profiles = await res.json();
        if (Array.isArray(profiles)) {
          for (const p of profiles) {
            if ((p.service || '').toLowerCase() === 'tiktok') {
              tiktokChannels.push({
                id: p.id || p._id,
                name: p.formatted_username || p.service_username || 'TikTok Channel',
                service: 'tiktok',
                isDisconnected: Boolean(p.disabled),
                isLocked: Boolean(p.locked),
                orgName: 'REST Workspace'
              });
            }
          }
        }
      }
    } catch {}
  }

  console.log(`[Buffer TikTok Engine] 📱 Discovered ${tiktokChannels.length} TikTok channel(s) in Buffer account.`);
  tiktokChannels.forEach((ch, idx) => {
    console.log(`  [${idx + 1}] "${ch.name}" (ID: ${ch.id}) ${ch.isLocked ? '[Locked]' : '[Active]'}`);
  });

  return tiktokChannels;
}

/**
 * Upload video to a public relay URL for Buffer ingestion
 */
async function uploadToPublicRelay(videoPath) {
  console.log(`[Buffer Media Relay] 🚀 Uploading video to public relay: ${path.basename(videoPath)}...`);

  // Method 1: GitHub Release CDN (fastest & most reliable when running in Actions)
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const ghRepo = process.env.GITHUB_REPOSITORY;

  if (ghToken && ghRepo) {
    try {
      const tag = 'buffer-media-assets';
      const assetName = `${Date.now()}_${path.basename(videoPath)}`;
      const fileBuffer = fs.readFileSync(videoPath);

      // Check or create release
      let releaseId = null;
      let uploadUrlTemplate = null;

      const getRes = await fetch(`https://api.github.com/repos/${ghRepo}/releases/tags/${tag}`, {
        headers: { 'Authorization': `Bearer ${ghToken}`, 'User-Agent': 'BufferTikTokRelay/1.0' }
      });

      if (getRes.ok) {
        const data = await getRes.json();
        releaseId = data.id;
        uploadUrlTemplate = data.upload_url;
      } else if (getRes.status === 404) {
        const createRes = await fetch(`https://api.github.com/repos/${ghRepo}/releases`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${ghToken}`, 'Content-Type': 'application/json', 'User-Agent': 'BufferTikTokRelay/1.0' },
          body: JSON.stringify({ tag_name: tag, name: 'Automated Social Media Video Assets', draft: false, prerelease: false })
        });
        if (createRes.ok) {
          const data = await createRes.json();
          releaseId = data.id;
          uploadUrlTemplate = data.upload_url;
        }
      }

      if (releaseId && uploadUrlTemplate) {
        const uploadUrl = uploadUrlTemplate.replace(/\{\?name,label\}/, `?name=${encodeURIComponent(assetName)}`);
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Content-Type': 'video/mp4',
            'Content-Length': String(fileBuffer.length),
            'User-Agent': 'BufferTikTokRelay/1.0'
          },
          body: fileBuffer
        });

        if (uploadRes.ok) {
          const assetData = await uploadRes.json();
          if (assetData.browser_download_url) {
            console.log(`[Buffer Media Relay] ✅ Public video URL ready (GitHub Release CDN): ${assetData.browser_download_url}`);
            return assetData.browser_download_url;
          }
        }
      }
    } catch (e) {
      console.warn(`[Buffer Media Relay] GitHub Release CDN notice: ${e.message}`);
    }
  }

  // Method 2: Uguu.se temporary direct hosting
  try {
    const fileBuffer = fs.readFileSync(videoPath);
    const formData = new FormData();
    formData.append('files[]', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));

    const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: formData });
    if (res.ok) {
      const json = await res.json();
      const directUrl = json?.files?.[0]?.url;
      if (directUrl && directUrl.startsWith('http')) {
        console.log(`[Buffer Media Relay] ✅ Public video URL ready (uguu.se): ${directUrl}`);
        return directUrl;
      }
    }
  } catch (e) {
    console.warn(`[Buffer Media Relay] uguu.se notice: ${e.message}`);
  }

  // Method 3: Litterbox Catbox
  try {
    const fileBuffer = fs.readFileSync(videoPath);
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '24h');
    formData.append('fileToUpload', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: formData });
    const text = (await res.text()).trim();
    if (res.ok && text.startsWith('http')) {
      console.log(`[Buffer Media Relay] ✅ Public video URL ready (Litterbox): ${text}`);
      return text;
    }
  } catch (e) {
    console.warn(`[Buffer Media Relay] Litterbox notice: ${e.message}`);
  }

  throw new Error(`Media relay failed. Please ensure GITHUB_TOKEN is available or host file on a public CDN.`);
}

/**
 * Dispatch video to TikTok via Buffer
 */
async function postToTikTok(channelId, videoUrl, caption) {
  const mode = SHARE_NOW ? 'shareNow' : 'addToQueue';
  console.log(`[Buffer TikTok Dispatch] 🚀 Dispatching to TikTok Channel ID: ${channelId} (Mode: ${mode})...`);

  const mutation = `mutation CreateTikTokPost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post {
          id
          status
          dueAt
          channelId
        }
      }
      ... on MutationError {
        message
      }
    }
  }`;

  const input = {
    text: caption,
    channelId: channelId,
    schedulingType: 'automatic',
    mode: mode,
    assets: [
      {
        video: {
          url: videoUrl
        }
      }
    ],
    metadata: {
      tiktok: {
        isAiGenerated: true,
        duetDisabled: false,
        stitchDisabled: false
      }
    }
  };

  try {
    const data = await bufferRequest(mutation, { input });
    const result = data?.createPost;

    if (result?.post?.id) {
      console.log(`  ${colors.green}✔ Successfully scheduled/posted to TikTok! Post ID: ${result.post.id} (Status: ${result.post.status})${colors.reset}`);
      return { success: true, id: result.post.id, status: result.post.status };
    }

    if (result?.message) {
      console.warn(`  ⚠️ Buffer GraphQL notice: ${result.message}. Trying classic REST...`);
    }
  } catch (gqlErr) {
    console.warn(`  ⚠️ Buffer GraphQL failed (${gqlErr.message}). Retrying without custom metadata...`);
    try {
      // Fallback GraphQL retry without extended metadata if schema is restrictive
      const basicInput = { ...input, metadata: { tiktok: {} } };
      const dataRetry = await bufferRequest(mutation, { input: basicInput });
      if (dataRetry?.createPost?.post?.id) {
        return { success: true, id: dataRetry.createPost.post.id, status: dataRetry.createPost.post.status };
      }
    } catch {}
  }

  // REST API Fallback
  try {
    const form = new URLSearchParams();
    form.append('profile_ids[]', channelId);
    form.append('text', caption);
    form.append('media[video]', videoUrl);
    form.append('now', SHARE_NOW ? 'true' : 'false');
    form.append('is_ai_generated', 'true');

    const res = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${encodeURIComponent(BUFFER_API_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const json = await res.json();
    if (json.success || (json.updates && json.updates.length > 0)) {
      const updateId = json.updates?.[0]?.id || 'REST-OK';
      console.log(`  ${colors.green}✔ Successfully posted via Buffer REST to TikTok! (ID: ${updateId})${colors.reset}`);
      return { success: true, id: updateId, status: SHARE_NOW ? 'published' : 'queued' };
    }
    throw new Error(json.message || JSON.stringify(json));
  } catch (restErr) {
    console.error(`  ❌ Failed to dispatch to TikTok channel ${channelId}: ${restErr.message}`);
    return { success: false, error: restErr.message };
  }
}

/**
 * Main Publisher Entry Point
 * @param {'movie_brand' | 'teen_motivation' | 'all'} channelType
 */
async function dispatchTikTok(channelType = 'movie_brand') {
  console.log(`\n${colors.bright}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bright}🎬 BUFFER TIKTOK DISPATCHER: ${channelType.toUpperCase()}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}======================================================${colors.reset}\n`);

  if (!BUFFER_API_KEY) {
    console.warn(`⚠️ BUFFER_API_KEY_2 (or BUFFER_API_KEY) is not set.`);
    console.warn(`  Add BUFFER_API_KEY_2 in your GitHub Repository Secrets.`);
    return { success: false, reason: 'MISSING_BUFFER_API_KEY' };
  }

  if (IS_DRY_RUN) {
    console.log(`[DRY RUN] Dry run enabled. Skipping live Buffer network call.`);
    return { success: true, dryRun: true };
  }

  const discoveredTikToks = await discoverTikTokChannels();

  // Channel 1: Movie Brand (First TikTok in 2nd Buffer API)
  // Channel 2: Teen Motivation (Second TikTok in 2nd Buffer API)
  let targetChannel = null;
  let videoPath = null;
  let caption = '';

  if (channelType === 'movie_brand') {
    // Select channel ID
    if (isValidChannelId(BUFFER_TIKTOK_MOVIE_CHANNEL_ID)) {
      targetChannel = discoveredTikToks.find(c => c.id === BUFFER_TIKTOK_MOVIE_CHANNEL_ID) || { id: BUFFER_TIKTOK_MOVIE_CHANNEL_ID, name: 'Movie Brand TikTok' };
    } else if (discoveredTikToks.length > 0) {
      // First TikTok channel
      targetChannel = discoveredTikToks[0];
    }

    // Locate latest Movie video
    const movieCandidates = [
      path.join(process.cwd(), 'rendered_videos', 'movie_episode_latest.mp4'),
      path.join(process.cwd(), 'test_artifacts', 'movie_episodes', 'movie_episode_latest.mp4')
    ];
    for (const c of movieCandidates) {
      if (fs.existsSync(c)) { videoPath = c; break; }
    }

    // Load movie manifest for rich caption
    const manifestPath = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');
    let meta = { episodeTitle: 'Protocol Zero: Episodic Cyberpunk Thriller', seriesTitle: 'Protocol Zero' };
    if (fs.existsSync(manifestPath)) {
      try {
        const arr = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (arr && arr[0]) meta = arr[0];
      } catch {}
    }

    caption = `🎬 ${meta.seriesTitle || 'Protocol Zero'} // Episode: ${meta.episodeTitle || 'The Breach'}\n\n${(meta.narration || '').slice(0, 180)}...\n\nFollow for daily cinematic episodes! 🍿🔥\n\n#AIGenerated #MovieTrailer #SciFi #CinemaVanguard #Cinematic #ShortFilm #ProtocolZero #TikTokMovies #Drama #AI`;

  } else if (channelType === 'teen_motivation') {
    // Select channel ID
    if (isValidChannelId(BUFFER_TIKTOK_TEEN_CHANNEL_ID)) {
      targetChannel = discoveredTikToks.find(c => c.id === BUFFER_TIKTOK_TEEN_CHANNEL_ID) || { id: BUFFER_TIKTOK_TEEN_CHANNEL_ID, name: 'Teen Motivation TikTok' };
    } else if (discoveredTikToks.length > 1) {
      // Second TikTok channel in account
      targetChannel = discoveredTikToks[1];
    } else if (discoveredTikToks.length === 1) {
      targetChannel = discoveredTikToks[0];
    }

    // Locate latest Teen Motivation video
    const teenCandidates = [
      path.join(process.cwd(), 'rendered_videos', 'teen_motivation_latest.mp4'),
      path.join(process.cwd(), 'test_artifacts', 'motivation_reels', 'teen_motivation_dopamine_reset_21_days.mp4')
    ];
    for (const c of teenCandidates) {
      if (fs.existsSync(c)) { videoPath = c; break; }
    }

    // Load teen motivation manifest
    const manifestPath = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');
    let meta = { title: 'How To Lock In and Level Up', hook: 'You are not lazy. You are just drowning in cheap dopamine.', challenge: 'RULE 1: NO PHONE IN BED FOR 7 DAYS' };
    if (fs.existsSync(manifestPath)) {
      try {
        const arr = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (arr && arr[0]) meta = arr[0];
      } catch {}
    }

    caption = `⚡ ${meta.hook || 'Lock in.'}\n\n👉 Challenge: ${meta.challenge || 'Discipline over mood.'}\n\nHit follow to build mental armor and level up daily. 🛡️\n\n#TeenMotivation #YouthDiscipline #LockIn #StudyMotivation #DopamineDetox #Grindset #SelfImprovement #Discipline`;
  }

  if (!targetChannel) {
    console.warn(`⚠️ No target TikTok channel found for ${channelType}.`);
    console.warn(`  Ensure your second Buffer account has TikTok connected, or set BUFFER_TIKTOK_MOVIE_CHANNEL_ID / BUFFER_TIKTOK_TEEN_CHANNEL_ID in secrets.`);
    return { success: false, reason: 'NO_TARGET_TIKTOK_CHANNEL' };
  }

  if (!videoPath || !fs.existsSync(videoPath)) {
    console.warn(`⚠️ Video file for ${channelType} not found.`);
    return { success: false, reason: 'VIDEO_NOT_FOUND' };
  }

  console.log(`🎯 Target TikTok Channel: "${targetChannel.name}" (ID: ${targetChannel.id})`);
  console.log(`📹 Video Source: ${videoPath} (${(fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`📝 Caption:\n${caption}\n`);

  const publicVideoUrl = process.env.BUFFER_VIDEO_URL || await uploadToPublicRelay(videoPath);
  const result = await postToTikTok(targetChannel.id, publicVideoUrl, caption);
  return result;
}

if (require.main === module) {
  const target = process.argv[2] || process.env.CHANNEL_TARGET || 'movie_brand';
  dispatchTikTok(target).catch(console.error);
}

module.exports = {
  dispatchTikTok,
  discoverTikTokChannels,
  postToTikTok
};
