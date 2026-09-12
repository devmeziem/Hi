#!/usr/bin/env node
/**
 * ==============================================================================
 * Archie Explains: Buffer Omnichannel Dispatcher (Facebook, Instagram, TikTok)
 * ==============================================================================
 * Automatically publishes or queues Archie animated videos & fact reels
 * to connected social platforms via Buffer's GraphQL API:
 *  - Facebook Page
 *  - Instagram Page (Reels)
 *  - TikTok Account
 *
 * Requirements:
 *  - BUFFER_API_KEY (from https://publish.buffer.com or Buffer Settings)
 *  - Channels connected inside Buffer account (Facebook, Instagram, TikTok)
 *  - Optional: BUFFER_FACEBOOK_CHANNEL_ID, BUFFER_INSTAGRAM_CHANNEL_ID, BUFFER_TIKTOK_CHANNEL_ID
 */

const fs = require('fs');
const path = require('path');

const BUFFER_API_URL = 'https://api.buffer.com';
const RAW_BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || process.env.BUFFER_TOKEN || '').trim();

// Automatically sanitize token: strip surrounding quotes, strip leading 'Bearer ', trim whitespace
function sanitizeToken(raw) {
  if (!raw) return '';
  let token = String(raw).trim();
  token = token.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token;
}

const BUFFER_API_KEY = sanitizeToken(RAW_BUFFER_API_KEY);

// Specific channel overrides (defaulting to configured Voxam Fact and bones_ceo)
const BUFFER_FACEBOOK_CHANNEL_ID = String(process.env.BUFFER_FACEBOOK_CHANNEL_ID || '6aa31cd2cd8b9c702c468b52').trim();
const BUFFER_INSTAGRAM_CHANNEL_ID = String(process.env.BUFFER_INSTAGRAM_CHANNEL_ID || '6aa31cd8b9c702c467a38').trim();
const BUFFER_TIKTOK_CHANNEL_ID = String(process.env.BUFFER_TIKTOK_CHANNEL_ID || '').trim();

// Media upload / Cloudinary options
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

const IS_DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SHARE_NOW = process.env.BUFFER_SHARE_NOW === 'true';

// Active API protocol mode: 'graphql' | 'rest' | 'auto'
let activeApiEngine = 'auto';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

/**
 * Execute GraphQL query against Buffer API
 */
async function bufferRequest(query, variables = {}) {
  if (!BUFFER_API_KEY) {
    throw new Error('BUFFER_API_KEY is not set. Please provide your Buffer access token.');
  }

  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUFFER_API_KEY}`
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Buffer returned non-JSON response (HTTP ${response.status}): ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(`Buffer HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  if (payload.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${payload.errors.map(e => e.message).join('; ')}`);
  }

  return payload.data;
}

/**
 * Fallback query using classic REST profiles endpoint
 */
async function queryRestProfiles(token) {
  try {
    const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) return list;
    }
  } catch {}

  try {
    const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) return list;
    }
  } catch {}

  return null;
}

function isValidChannelId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());
}

/**
 * Auto-discover connected channels in the Buffer account
 */
async function discoverConnectedChannels() {
  console.log(`[Buffer Omnichannel] 🔍 Querying Buffer account for connected social channels...`);

  const discovered = {
    facebook: [],
    instagram: [],
    tiktok: [],
    all: []
  };

  // Attempt 1: Modern GraphQL API via Organizations -> Channels
  try {
    // Step 1A: Get organizations
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
    const organizations = orgsData?.account?.organizations || [];

    if (organizations.length > 0) {
      console.log(`[Buffer Omnichannel] 🏢 Discovered ${organizations.length} Buffer workspace organization(s): ${organizations.map(o => `"${o.name}" (${o.id})`).join(', ')}`);

      // Step 1B: Query channels for each organization
      for (const org of organizations) {
        let chList = [];
        try {
          const channelsQuery = `query GetChannels($organizationId: OrganizationId!) {
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
          const chData = await bufferRequest(channelsQuery, { organizationId: org.id });
          chList = chData?.channels || [];
        } catch (orgChErr) {
          // Fallback pattern with input wrapper
          try {
            const channelsQueryB = `query GetChannels($input: ChannelsInput!) {
              channels(input: $input) {
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
            const chDataB = await bufferRequest(channelsQueryB, { input: { organizationId: org.id } });
            chList = chDataB?.channels || [];
          } catch (orgChErr2) {
            console.warn(`[Buffer Omnichannel] Notice querying channels for org "${org.name}": ${orgChErr.message}`);
          }
        }

        for (const ch of chList) {
          discovered.all.push(ch);
          const svc = String(ch.service || '').toLowerCase();
          const isUsable = !ch.isDisconnected && !ch.isLocked;
          if (!isUsable) continue;

          if (svc === 'facebook') {
            discovered.facebook.push(ch);
          } else if (svc === 'instagram') {
            discovered.instagram.push(ch);
          } else if (svc === 'tiktok') {
            discovered.tiktok.push(ch);
          }
        }
      }
    }

    // Step 1C: If channels array still empty, try flat channels query
    if (discovered.all.length === 0) {
      try {
        const flatQuery = `query GetAllChannels {
          channels {
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
        const flatData = await bufferRequest(flatQuery);
        const flatList = flatData?.channels || [];
        for (const ch of flatList) {
          discovered.all.push(ch);
          const svc = String(ch.service || '').toLowerCase();
          const isUsable = !ch.isDisconnected && !ch.isLocked;
          if (!isUsable) continue;

          if (svc === 'facebook') {
            discovered.facebook.push(ch);
          } else if (svc === 'instagram') {
            discovered.instagram.push(ch);
          } else if (svc === 'tiktok') {
            discovered.tiktok.push(ch);
          }
        }
      } catch {
        // continue
      }
    }

    if (discovered.all.length > 0) {
      activeApiEngine = 'graphql';
      console.log(`[Buffer Omnichannel] ✅ Connected via Modern GraphQL API (found ${discovered.all.length} channel(s))`);
      return discovered;
    }
  } catch (gqlErr) {
    console.warn(`[Buffer Omnichannel] ℹ️ GraphQL discovery notice: ${gqlErr.message}`);
  }

  // Attempt 2: Classic REST API Fallback (for legacy accounts)
  try {
    const restProfiles = await queryRestProfiles(BUFFER_API_KEY);
    if (Array.isArray(restProfiles) && restProfiles.length > 0) {
      activeApiEngine = 'rest';
      console.log(`[Buffer Omnichannel] ✅ Connected via Classic REST API (found ${restProfiles.length} profile(s))`);

      for (const p of restProfiles) {
        const ch = {
          id: p.id || p._id,
          name: p.formatted_username || p.service_username || p.service,
          displayName: p.formatted_username || p.service_username || p.service,
          service: (p.service || '').toLowerCase(),
          isDisconnected: Boolean(p.disconnected),
          isLocked: Boolean(p.locked)
        };
        discovered.all.push(ch);

        if (ch.isDisconnected || ch.isLocked) continue;

        const svc = ch.service;
        if (svc === 'facebook') {
          discovered.facebook.push(ch);
        } else if (svc === 'instagram') {
          discovered.instagram.push(ch);
        } else if (svc === 'tiktok') {
          discovered.tiktok.push(ch);
        }
      }

      return discovered;
    }
  } catch {
    // ignore
  }

  throw new Error(`Could not discover channels with provided BUFFER_API_KEY.`);
}

/**
 * Resolve target channels based on overrides or auto-discovery
 */
async function resolveTargetChannels(discovered) {
  const targets = [];

  // 1. Facebook Page (Voxam Fact)
  let fbTarget = null;
  if (isValidChannelId(BUFFER_FACEBOOK_CHANNEL_ID)) {
    fbTarget = discovered.all.find(c => c.id === BUFFER_FACEBOOK_CHANNEL_ID) || {
      id: BUFFER_FACEBOOK_CHANNEL_ID,
      service: 'facebook',
      name: 'Voxam Fact (Facebook Page)',
      displayName: 'Voxam Fact'
    };
  } else if (discovered.facebook.length > 0) {
    fbTarget = discovered.facebook[0];
  } else if (BUFFER_FACEBOOK_CHANNEL_ID) {
    console.warn(`[Buffer Omnichannel] ⚠️ Provided BUFFER_FACEBOOK_CHANNEL_ID ("${BUFFER_FACEBOOK_CHANNEL_ID}") is not a valid 24-character hex ID.`);
  }

  if (fbTarget) {
    targets.push(fbTarget);
  }

  // 2. Instagram Page / Business Account (bones_ceo)
  let igTarget = null;
  if (isValidChannelId(BUFFER_INSTAGRAM_CHANNEL_ID)) {
    igTarget = discovered.all.find(c => c.id === BUFFER_INSTAGRAM_CHANNEL_ID) || {
      id: BUFFER_INSTAGRAM_CHANNEL_ID,
      service: 'instagram',
      name: 'bones_ceo (Instagram Reels)',
      displayName: 'bones_ceo'
    };
  } else {
    if (BUFFER_INSTAGRAM_CHANNEL_ID) {
      console.warn(`[Buffer Omnichannel] ⚠️ Configured BUFFER_INSTAGRAM_CHANNEL_ID ("${BUFFER_INSTAGRAM_CHANNEL_ID}") is invalid (length ${BUFFER_INSTAGRAM_CHANNEL_ID.length}, expected 24 hex characters).`);
      console.warn(`[Buffer Omnichannel] 🔎 Searching auto-discovered accounts for "bones_ceo"...`);
    }
    // Auto-match from discovered channels
    const matchedBones = discovered.instagram.find(c =>
      (c.name && c.name.toLowerCase().includes('bones')) ||
      (c.displayName && c.displayName.toLowerCase().includes('bones'))
    );
    igTarget = matchedBones || (discovered.instagram.length > 0 ? discovered.instagram[0] : null);
  }

  if (igTarget) {
    targets.push(igTarget);
  } else if (BUFFER_INSTAGRAM_CHANNEL_ID && !isValidChannelId(BUFFER_INSTAGRAM_CHANNEL_ID)) {
    console.warn(`[Buffer Omnichannel] ⚠️ Could not automatically resolve Instagram channel for bones_ceo.`);
  }

  // 3. TikTok Account (optional - skip locked channels)
  if (isValidChannelId(BUFFER_TIKTOK_CHANNEL_ID)) {
    const matched = discovered.all.find(c => c.id === BUFFER_TIKTOK_CHANNEL_ID && !c.isLocked);
    targets.push(matched || { id: BUFFER_TIKTOK_CHANNEL_ID, service: 'tiktok', name: 'TikTok Account' });
  } else if (discovered.tiktok.length > 0) {
    targets.push(discovered.tiktok[0]);
  }

  return targets;
}

/**
 * Locate the latest Archie video file (fact reel or full cartoon episode)
 */
function findLatestArchieVideo(preferredPath = null) {
  if (preferredPath && fs.existsSync(preferredPath)) {
    return preferredPath;
  }

  const roots = [
    path.join(process.cwd(), 'test_artifacts'),
    path.join(process.cwd(), 'rendered_videos'),
    path.join(process.cwd(), 'output')
  ];

  const candidateFiles = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const full = path.join(root, name);
      if (fs.statSync(full).isFile() && /\.mp4$/i.test(name)) {
        // Prioritize archie / tech fact / cartoon videos
        const isArchie = /archie|fact_reel|cartoon|tech/i.test(name);
        candidateFiles.push({
          path: full,
          time: fs.statSync(full).mtimeMs,
          priority: isArchie ? 2 : 1
        });
      }
    }
  }

  if (!candidateFiles.length) {
    if (IS_DRY_RUN) {
      const mockDir = path.join(process.cwd(), 'test_artifacts');
      if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir, { recursive: true });
      const mockVideo = path.join(mockDir, 'archie_tech_fact_dryrun_sample.mp4');
      if (!fs.existsSync(mockVideo)) {
        fs.writeFileSync(mockVideo, 'DUMMY_MP4_FOR_DRYRUN_TESTING');
      }
      return mockVideo;
    }
    return null;
  }

  candidateFiles.sort((a, b) => (b.priority - a.priority) || (b.time - a.time));
  return candidateFiles[0].path;
}

/**
 * Direct temporary media relay (24h public link for Buffer to ingest)
 */
async function uploadToPublicRelay(videoPath) {
  console.log(`[Buffer Media Relay] 🚀 Uploading video to public relay: ${path.basename(videoPath)}...`);

  // Attempt 1: Litterbox Catbox (24h temporary mp4 link)
  try {
    const fileBuffer = fs.readFileSync(videoPath);
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '24h');
    formData.append('fileToUpload', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: formData
    });

    const text = (await res.text()).trim();
    if (res.ok && text.startsWith('http')) {
      console.log(`[Buffer Media Relay] ✅ Public video URL ready (Litterbox): ${text}`);
      return text;
    }
  } catch (e) {
    console.warn(`[Buffer Media Relay] Litterbox notice: ${e.message}`);
  }

  // Attempt 2: tmpfiles.org
  try {
    const fileBuffer = fs.readFileSync(videoPath);
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));

    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    const json = await res.json();
    if (json?.data?.url) {
      const directUrl = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      console.log(`[Buffer Media Relay] ✅ Public video URL ready (tmpfiles): ${directUrl}`);
      return directUrl;
    }
  } catch (e) {
    console.warn(`[Buffer Media Relay] tmpfiles notice: ${e.message}`);
  }

  throw new Error(`Public media relay failed across both primary and fallback hosts.`);
}

/**
 * Cloudinary unsigned upload (optional backup)
 */
async function uploadToCloudinary(videoPath) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return null;

  console.log(`[Buffer Media Relay] 📤 Uploading to Cloudinary (${CLOUDINARY_CLOUD_NAME})...`);
  const form = new FormData();
  const fileBuffer = fs.readFileSync(videoPath);
  form.append('file', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/video/upload`;
  const response = await fetch(uploadUrl, { method: 'POST', body: form });
  const text = await response.text();
  const payload = JSON.parse(text);

  if (response.ok && payload.secure_url) {
    console.log(`[Buffer Media Relay] ✅ Cloudinary Video URL: ${payload.secure_url}`);
    return payload.secure_url;
  }
  return null;
}

/**
 * Generate platform-tailored caption for Facebook, Instagram, and TikTok
 */
function buildOmnichannelCaption(metadata = {}, service = 'generic') {
  const title = metadata.title || 'Did You Know? Mind-Blowing Science & Tech Breakdown';
  const fact = metadata.fact || metadata.description || 'Archie Explains: Cutting-edge science, AI, and engineering wonders compared!';
  const citation = metadata.reference ? `📚 Citation: ${metadata.reference}` : '';

  const tags = ['#ArchieExplains', '#Tech', '#Science', '#AI', '#Engineering', '#HowItWorks', '#DidYouKnow'];

  if (service === 'tiktok') {
    tags.push('#TikTokTech', '#TechTok', '#FYP', '#LearnOnTikTok');
    return `${title}\n\n${fact}\n\n${citation}\n\nWhat topic should Archie explore next? Drop your thoughts!\n\n${tags.join(' ')}`.trim();
  }

  if (service === 'instagram') {
    tags.push('#ReelsInstagram', '#ScienceReels', '#TechNews', '#InstaScience');
    return `${title}\n\n${fact}\n\n${citation}\n\nFollow @ArchieExplains for daily animated tech & science breakdowns.\n\n${tags.join(' ')}`.trim();
  }

  if (service === 'facebook') {
    tags.push('#FacebookReels', '#ViralTech', '#ScienceExplained');
    return `${title}\n\n${fact}\n\n${citation}\n\nLike and share for more mind-blowing engineering comparisons!\n\n${tags.join(' ')}`.trim();
  }

  return `${title}\n\n${fact}\n\n${tags.join(' ')}`;
}

/**
 * Post via classic REST API endpoint (api.bufferapp.com/1/updates/create.json)
 */
async function postViaClassicRest(channel, mediaUrl, caption, shareNow = true) {
  const svcName = (channel.service || '').toUpperCase();
  const form = new URLSearchParams();
  form.append('profile_ids[]', channel.id);
  form.append('text', caption);
  form.append('now', shareNow ? 'true' : 'false');
  form.append('media[video]', mediaUrl);
  form.append('media[link]', mediaUrl);

  // Method 1: with access_token query param
  let endpoint = `https://api.bufferapp.com/1/updates/create.json?access_token=${encodeURIComponent(BUFFER_API_KEY)}`;
  let res = await fetch(endpoint, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    // Method 2: with Bearer header
    res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BUFFER_API_KEY}`
      },
      body: form
    });
  }

  const text = await res.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Buffer REST HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  if (payload.success || (payload.updates && payload.updates.length > 0)) {
    const updateId = payload.updates?.[0]?.id || payload.updates?.[0]?._id || 'REST-OK';
    console.log(`  ${colors.green}✔ Successfully posted via Classic REST on ${svcName}! (ID: ${updateId})${colors.reset}`);
    return { id: updateId, status: shareNow ? 'published' : 'queued' };
  }

  throw new Error(`Buffer REST ${svcName} error: ${payload.message || text.slice(0, 200)}`);
}

/**
 * Queue or publish a video post to a specific Buffer channel
 */
async function postToBufferChannel(channel, mediaUrl, caption) {
  const mode = SHARE_NOW ? 'shareNow' : 'addToQueue';
  const svc = (channel.service || '').toLowerCase();
  const svcName = svc.toUpperCase();
  const chLabel = channel.displayName || channel.name || channel.id;

  console.log(`\n[Buffer Dispatch] 📡 Sending to ${colors.cyan}${svcName}${colors.reset} (${chLabel}) [Mode: ${mode}]...`);

  if (!isValidChannelId(channel.id)) {
    throw new Error(`Invalid Buffer channelId format "${channel.id}" (length ${channel.id.length}, expected 24 hex characters). Please check your Instagram channel ID.`);
  }

  // If already confirmed in REST mode and token allows it, use REST directly
  if (activeApiEngine === 'rest') {
    return await postViaClassicRest(channel, mediaUrl, caption, SHARE_NOW);
  }

  // Otherwise use Modern GraphQL
  try {
    const mutation = `mutation CreateVideoPost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            status
            dueAt
            channelId
            text
          }
        }
        ... on MutationError {
          message
        }
      }
    }`;

    const input = {
      text: caption,
      channelId: channel.id,
      schedulingType: 'automatic',
      mode: mode,
      assets: [
        {
          video: {
            url: mediaUrl
          }
        }
      ]
    };

    // Facebook posts REQUIRE a type in metadata ('reel', 'post', or 'story')
    if (svc === 'facebook') {
      const fbPostType = (process.env.BUFFER_FACEBOOK_POST_TYPE || 'reel').toLowerCase();
      input.metadata = {
        facebook: {
          type: fbPostType
        }
      };
    }

    let data;
    try {
      data = await bufferRequest(mutation, { input });
    } catch (reqErr) {
      // If Facebook complained about post type, retry with 'post'
      if (svc === 'facebook' && reqErr.message.includes('Facebook posts require a type')) {
        console.log(`[Buffer Dispatch] Retrying Facebook with type: "post"...`);
        input.metadata.facebook.type = 'post';
        data = await bufferRequest(mutation, { input });
      } else {
        throw reqErr;
      }
    }

    const result = data?.createPost;

    if (result?.message) {
      throw new Error(`Buffer ${svcName} error: ${result.message}`);
    }

    if (result?.post) {
      console.log(`  ${colors.green}✔ Successfully scheduled on ${svcName}! Post ID: ${result.post.id} (Status: ${result.post.status})${colors.reset}`);
      return result.post;
    }

    return result;
  } catch (gqlErr) {
    console.warn(`[Buffer Dispatch] ⚠️ GraphQL post failed: ${gqlErr.message}`);
    // If the token is a modern Public API token, do not attempt the legacy REST API which rejects it with 401
    if (gqlErr.message.includes('Invalid ChannelId format') || gqlErr.message.includes('require a type') || activeApiEngine === 'graphql') {
      throw gqlErr;
    }
    console.log(`[Buffer Dispatch] Attempting Classic REST fallback...`);
    return await postViaClassicRest(channel, mediaUrl, caption, SHARE_NOW);
  }
}

/**
 * Main dispatcher function
 */
async function publishArchieOmnichannel(options = {}) {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🤖 ARCHIE EXPLAINS — BUFFER OMNICHANNEL DISPATCHER${colors.reset}`);
  console.log(`   Publishing to Facebook Page, Instagram Page, and TikTok via Buffer API`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (!BUFFER_API_KEY) {
    console.warn(`[Buffer Omnichannel] ⚠️ BUFFER_API_KEY is not configured.`);
    console.warn(`To set up Buffer Omnichannel publishing:`);
    console.warn(`  1. Get an API access token from https://publish.buffer.com or https://buffer.com/developers/api`);
    console.warn(`  2. Add BUFFER_API_KEY in your GitHub Secrets or pass via workflow dispatch.`);
    console.warn(`  3. Connect your Facebook Page and Instagram account in Buffer.`);
    return { success: false, reason: 'MISSING_BUFFER_API_KEY' };
  }

  const tokenMasked = BUFFER_API_KEY.length > 8 ? `${BUFFER_API_KEY.slice(0, 6)}...${BUFFER_API_KEY.slice(-4)}` : '***';
  console.log(`[Buffer Omnichannel] 🔑 Active Buffer Token: ${tokenMasked} (Length: ${BUFFER_API_KEY.length})`);

  // 1. Locate Video
  const videoPath = findLatestArchieVideo(options.videoPath);
  if (!videoPath) {
    console.warn(`[Buffer Omnichannel] ⚠️ No rendered Archie MP4 video found.`);
    return { success: false, reason: 'NO_VIDEO_FOUND' };
  }
  console.log(`[Buffer Omnichannel] 📹 Found video: ${path.basename(videoPath)} (${Math.round(fs.statSync(videoPath).size / 1024)} KB)`);

  // 2. Discover channels in Buffer (with graceful fallback to explicit channel IDs)
  let targetChannels = [];
  try {
    const discovered = await discoverConnectedChannels();
    console.log(`[Buffer Omnichannel] Discovered accounts in Buffer:`);
    console.log(`  - Facebook Pages: ${discovered.facebook.length > 0 ? discovered.facebook.map(c => `"${c.displayName || c.name}" (ID: ${c.id})`).join(', ') : 'None connected'}`);
    console.log(`  - Instagram Accounts: ${discovered.instagram.length > 0 ? discovered.instagram.map(c => `"${c.displayName || c.name}" (ID: ${c.id})`).join(', ') : 'None connected'}`);
    console.log(`  - TikTok Accounts: ${discovered.tiktok.length > 0 ? discovered.tiktok.map(c => `"${c.displayName || c.name}" (ID: ${c.id})`).join(', ') : 'None connected'}`);
    targetChannels = await resolveTargetChannels(discovered);
  } catch (err) {
    console.warn(`[Buffer Omnichannel] ⚠️ Channel auto-discovery notice: ${err.message}`);
    console.log(`[Buffer Omnichannel] 📌 Checking provided target channel IDs:`);
    const fallbackList = [];
    const fbId = BUFFER_FACEBOOK_CHANNEL_ID || '6aa31cd2cd8b9c702c468b52';
    if (isValidChannelId(fbId)) {
      fallbackList.push({ id: fbId, service: 'facebook', displayName: 'Voxam Fact', name: 'Voxam Fact (Facebook Page)' });
    } else {
      console.warn(`[Buffer Omnichannel] ⚠️ Skipping invalid Facebook Channel ID: "${fbId}"`);
    }

    const igId = BUFFER_INSTAGRAM_CHANNEL_ID;
    if (isValidChannelId(igId)) {
      fallbackList.push({ id: igId, service: 'instagram', displayName: 'bones_ceo', name: 'bones_ceo (Instagram Reels)' });
    } else if (igId) {
      console.warn(`[Buffer Omnichannel] ⚠️ Skipping invalid Instagram Channel ID: "${igId}" (length ${igId.length}, expected 24 hex characters).`);
      console.warn(`[Buffer Omnichannel] 💡 Tip: Run "node scripts/list_buffer_channels.cjs" to copy the exact 24-character ID for bones_ceo.`);
    }

    targetChannels = fallbackList;
  }

  // Filter only valid channel IDs
  targetChannels = targetChannels.filter(ch => {
    if (!isValidChannelId(ch.id)) {
      console.warn(`[Buffer Omnichannel] ⚠️ Omitted channel ${ch.name} because its ID "${ch.id}" is not a valid 24-char ObjectId.`);
      return false;
    }
    return true;
  });

  if (!targetChannels.length) {
    console.warn(`\n[Buffer Omnichannel] ⚠️ No Facebook, Instagram, or TikTok channels connected in your Buffer account.`);
    console.warn(`Please visit https://publish.buffer.com/channels to connect your accounts.`);
    return { success: false, reason: 'NO_TARGET_CHANNELS_FOUND' };
  }

  console.log(`\n[Buffer Omnichannel] 🎯 Target channels for this broadcast (${targetChannels.length}):`);
  targetChannels.forEach((ch, idx) => {
    console.log(`  ${idx + 1}. [${(ch.service || '').toUpperCase()}] ${ch.displayName || ch.name} (ID: ${ch.id})`);
  });

  if (IS_DRY_RUN) {
    console.log(`\n${colors.yellow}🧪 DRY RUN MODE ACTIVE — Skipping remote upload and post creation.${colors.reset}`);
    return { success: true, dryRun: true, targets: targetChannels };
  }

  // 3. Resolve Public Video URL
  let mediaUrl = options.videoUrl || process.env.BUFFER_VIDEO_URL;
  if (!mediaUrl) {
    try {
      mediaUrl = await uploadToCloudinary(videoPath);
    } catch (e) {
      console.warn(`[Buffer Omnichannel] Cloudinary upload notice: ${e.message}`);
    }

    if (!mediaUrl) {
      mediaUrl = await uploadToPublicRelay(videoPath);
    }
  }

  // 4. Dispatch to each connected channel
  const results = [];
  for (const ch of targetChannels) {
    const caption = buildOmnichannelCaption(options.metadata || {}, ch.service);
    try {
      const res = await postToBufferChannel(ch, mediaUrl, caption);
      results.push({ service: ch.service, channelId: ch.id, success: true, res });
    } catch (err) {
      console.error(`  ${colors.red}❌ Failed posting to ${ch.service}: ${err.message}${colors.reset}`);
      results.push({ service: ch.service, channelId: ch.id, success: false, error: err.message });
    }
  }

  console.log(`\n${colors.bright}${colors.green}🎉 Omnichannel broadcast completed across ${results.filter(r => r.success).length}/${results.length} channels!${colors.reset}\n`);
  return { success: true, results, mediaUrl };
}

// CLI execution check
if (require.main === module) {
  publishArchieOmnichannel()
    .then(res => {
      if (res.success) process.exit(0);
      process.exit(1);
    })
    .catch(err => {
      console.error('[Buffer Omnichannel Error]:', err);
      process.exit(1);
    });
}

module.exports = {
  publishArchieOmnichannel,
  discoverConnectedChannels,
  buildOmnichannelCaption
};
