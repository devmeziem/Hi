#!/usr/bin/env node
/**
 * ==============================================================================
 * Voxam Fin Blueprint: Buffer TikTok Dispatcher & Cloudinary Media Relay
 * ==============================================================================
 * 1. Locates the newly rendered Fin Blueprint MP4 video.
 * 2. Uploads the MP4 to Cloudinary (using unsigned preset) to generate a public HTTPS media URL.
 * 3. Auto-discovers the connected TikTok channel on Buffer (or uses BUFFER_TIKTOK_CHANNEL_ID).
 * 4. Queues the video post to TikTok via Buffer GraphQL API with optimized hashtags.
 */

const fs = require('fs');
const path = require('path');

const BUFFER_API_URL = 'https://api.buffer.com';
const BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();
const BUFFER_TIKTOK_CHANNEL_ID = String(process.env.BUFFER_TIKTOK_CHANNEL_ID || '').trim();
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();
const STRICT_BUFFER_FAIL = process.env.STRICT_BUFFER_FAIL === 'true';

function logWarn(message) {
  console.warn(`\n[Buffer/TikTok] ⚠️ WARNING: ${message}`);
}

function printDiagnosticBanner(title, whatFailed, whyFailed, fixes) {
  console.error(`\n\x1b[31m\x1b[1m════════════════════════════════════════════════════════════════════════════════\x1b[0m`);
  console.error(`\x1b[31m\x1b[1m ❌ [BUFFER / TIKTOK DISPATCHER: ${title.toUpperCase()}]\x1b[0m`);
  console.error(`\x1b[31m\x1b[1m════════════════════════════════════════════════════════════════════════════════\x1b[0m`);
  console.error(`\n\x1b[1m📋 WHAT FAILED:\x1b[0m\n ${whatFailed}\n`);
  console.error(`\x1b[1m🔍 WHY IT FAILED:\x1b[0m\n ${whyFailed}\n`);
  console.error(`\x1b[1m🛠️ HOW TO FIX IT:\x1b[0m`);
  fixes.forEach((fix, idx) => console.error(` ${idx + 1}. ${fix}`));
  console.error(`\x1b[31m\x1b[1m════════════════════════════════════════════════════════════════════════════════\n\x1b[0m`);
}

function fail(message, details = {}) {
  const whatFailed = details.what || message;
  const whyFailed = details.why || 'An unhandled exception or API rejection occurred during Buffer/TikTok relay.';
  const fixes = details.fixes || [
    'Verify that BUFFER_API_KEY is active and authorized on https://publish.buffer.com',
    'Verify that CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are set to an "Unsigned" preset on https://cloudinary.com',
    'Ensure your TikTok channel is connected and active in Buffer.'
  ];

  printDiagnosticBanner('Pipeline Error', whatFailed, whyFailed, fixes);
  process.exit(1);
}

/**
 * Validate Cloudinary Configuration for unsigned uploads (Optional)
 */
function validateCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.log('[Buffer/TikTok] Cloudinary not configured. Proceeding with direct media hosting straight to Buffer TikTok (no Cloudinary needed).');
    return false;
  }

  // Catch the common mistake where user pastes numeric API key into cloud name
  if (/^\d{6,15}$/.test(CLOUDINARY_CLOUD_NAME)) {
    console.warn('[Buffer/TikTok] CLOUDINARY_CLOUD_NAME appears to contain a numeric API key. Falling back to direct media hosting.');
    return false;
  }

  console.log(`[Cloudinary] Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
  console.log(`[Cloudinary] Upload Preset: ${CLOUDINARY_UPLOAD_PRESET} (Unsigned Mode)`);
  return true;
}

/**
 * Send GraphQL request to Buffer API
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
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Buffer returned non-JSON HTTP ${response.status}: ${text.slice(0, 500)}`);
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
 * Locate latest rendered MP4 file from test_artifacts or rendered_videos
 */
function findLatestVideo() {
  const roots = [
    path.join(process.cwd(), 'rendered_videos'),
    path.join(process.cwd(), 'test_artifacts'),
    path.join(process.cwd(), 'output')
  ];

  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const full = path.join(root, name);
      if (fs.statSync(full).isFile() && /\.mp4$/i.test(name) && !name.includes('slide_') && !name.includes('temp_')) {
        files.push(full);
      }
    }
  }

  if (!files.length) {
    fail('No final rendered MP4 video found to upload.', {
      what: 'Locating rendered output MP4 video file',
      why: `Searched in directories [${roots.join(', ')}], but found no complete MP4 render.`,
      fixes: [
        'Ensure the video rendering step (e.g. test_fin_runner.cjs) ran successfully before this step.',
        'Check earlier workflow logs for FFmpeg rendering or audio synthesis errors.'
      ]
    });
  }

  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

const MANDATORY_FINANCIAL_DISCLAIMER = '⚠️ Educational only. Not financial advice.';

/**
 * Resolve caption text & hashtags from latest video manifest or episode plan
 */
function resolvePostCaption() {
  let rawCaption = '';

  if (process.env.BUFFER_POST_TEXT && process.env.BUFFER_POST_TEXT.trim().length > 5) {
    rawCaption = process.env.BUFFER_POST_TEXT.trim();
  } else {
    // 1. Check test_artifacts/fin_episode_plan.json
    const episodePlanPath = path.join(process.cwd(), 'test_artifacts', 'fin_episode_plan.json');
    if (fs.existsSync(episodePlanPath)) {
      try {
        const plan = JSON.parse(fs.readFileSync(episodePlanPath, 'utf8'));
        if (plan?.title) {
          const tags = (plan.tags || ['#Shorts', '#finance', '#moneytips', '#business', '#wealth', '#fyp']).join(' ');
          rawCaption = `${plan.title}\n\n${plan.communityQuestion ? '💡 ' + plan.communityQuestion + '\n\n' : ''}${tags}`;
        }
      } catch {}
    }

    if (!rawCaption) {
      // 2. Check daily_blueprint_manifest.json
      const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const last = Array.isArray(manifest) ? manifest[manifest.length - 1] : manifest;
          if (last?.title) {
            rawCaption = `${last.title}\n\n#Shorts #finance #moneytips #business #sidehustle #fyp`;
          }
        } catch {}
      }
    }

    if (!rawCaption) {
      rawCaption = `${process.env.TEST_TOPIC || 'How to Build Cash Flow with Small Capital'}\n\n#Shorts #finance #moneytips #fyp`;
    }
  }

  // Strictly strip any AI engine disclosure or model references from TikTok caption
  rawCaption = rawCaption.replace(/🤖.*AI (?:Script )?Architecture.*$/gim, '').trim();
  rawCaption = rawCaption.replace(/AI Engine.*$/gim, '').trim();

  // Enforce TikTok caption character limit (under 2,000 chars)
  if (rawCaption.length > 1800) {
    rawCaption = rawCaption.slice(0, 1780) + '...';
  }

  return `${rawCaption}\n\n${MANDATORY_FINANCIAL_DISCLAIMER}`;
}

/**
 * Upload local video file to direct media relay (Litterbox zero-config, no credentials required)
 */
async function uploadToDirectRelay(videoPath) {
  console.log(`\n[Buffer/TikTok] 🚀 Uploading ${path.basename(videoPath)} (${Math.round(fs.statSync(videoPath).size / 1024)} KB) straight to direct media relay (no Cloudinary needed)...`);

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
    console.log(`[Buffer/TikTok] ✅ Direct public video URL generated: ${text}`);
    return text;
  }
  throw new Error(`Direct media relay upload failed: ${text || res.statusText}`);
}

/**
 * Upload local video file to Cloudinary unsigned endpoint (if configured)
 */
async function uploadToCloudinary(videoPath) {
  const isCldReady = validateCloudinaryConfig();
  if (!isCldReady) return null;

  console.log(`\n[Buffer/TikTok] 📤 Uploading ${path.basename(videoPath)} (${Math.round(fs.statSync(videoPath).size / 1024)} KB) to Cloudinary...`);

  const form = new FormData();
  const fileBuffer = fs.readFileSync(videoPath);
  form.append('file', new Blob([fileBuffer], { type: 'video/mp4' }), path.basename(videoPath));
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/video/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: form
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Cloudinary returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  if (!response.ok || !payload.secure_url) {
    const cloudError = payload?.error?.message || response.headers.get('x-cld-error') || `HTTP ${response.status}`;
    throw new Error(`Cloudinary unsigned upload failed: ${cloudError}`);
  }

  console.log(`[Buffer/TikTok] ✅ Cloudinary Video URL generated: ${payload.secure_url}`);
  return payload.secure_url;
}

/**
 * Resolve public video URL for Buffer (No Cloudinary Required)
 */
async function resolvePublicVideoUrl(videoPath) {
  // 1. Check if public URL is passed directly in env
  if (process.env.BUFFER_VIDEO_URL && process.env.BUFFER_VIDEO_URL.startsWith('http')) {
    console.log(`[Buffer/TikTok] Using provided BUFFER_VIDEO_URL: ${process.env.BUFFER_VIDEO_URL}`);
    return process.env.BUFFER_VIDEO_URL;
  }

  // 2. Check if an existing verified public video URL is already present in artifacts
  const episodePlanPath = path.join(process.cwd(), 'test_artifacts', 'fin_episode_plan.json');
  if (fs.existsSync(episodePlanPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(episodePlanPath, 'utf8'));
      if (plan?.renderedVideoUrl && /^https?:\/\//.test(plan.renderedVideoUrl)) {
        console.log(`[Buffer/TikTok] Reusing verified public video URL from episode plan: ${plan.renderedVideoUrl}`);
        return plan.renderedVideoUrl;
      }
    } catch {}
  }

  // 3. Try Cloudinary if user specifically provided credentials
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
    try {
      const cldUrl = await uploadToCloudinary(videoPath);
      if (cldUrl) return cldUrl;
    } catch (e) {
      console.warn(`[Buffer/TikTok] Cloudinary upload attempted but encountered error: ${e.message}. Falling back to direct media relay...`);
    }
  }

  // 4. Straight direct media hosting relay (No Cloudinary needed!)
  return await uploadToDirectRelay(videoPath);
}

/**
 * Auto-discover or validate TikTok channel in Buffer account
 */
async function resolveTikTokChannel() {
  if (BUFFER_TIKTOK_CHANNEL_ID) {
    try {
      const data = await bufferRequest(`query GetChannel($id: ChannelId!) {
        channel(input: { id: $id }) { id name displayName service isDisconnected isLocked }
      }`, { id: BUFFER_TIKTOK_CHANNEL_ID });

      const channel = data?.channel;
      if (channel) {
        if (channel.isDisconnected) fail(`The configured TikTok channel (${channel.displayName || channel.name}) is disconnected from Buffer.`);
        if (channel.isLocked) fail(`The configured TikTok channel (${channel.displayName || channel.name}) is locked in Buffer.`);
        console.log(`[Buffer/TikTok] Verified target channel by ID: "${channel.displayName || channel.name}" (${channel.service || 'TikTok'}, ID: ${channel.id})`);
        return channel;
      }
    } catch (err) {
      logWarn(`Direct channel lookup with ID ${BUFFER_TIKTOK_CHANNEL_ID} failed: ${err.message}. Proceeding to auto-discovery...`);
    }
  }

  // Auto-discover TikTok channels from account organizations
  console.log('[Buffer/TikTok] Querying Buffer account for connected channels...');
  let orgs = [];
  try {
    const accountData = await bufferRequest(`query GetAccountChannels {
      account {
        organizations {
          id
          name
          channels {
            id
            name
            displayName
            service
            isDisconnected
            isLocked
          }
        }
      }
    }`);
    orgs = accountData?.account?.organizations || [];
  } catch (err) {
    logWarn(`Buffer account query notice: ${err.message}`);
  }

  const allDiscoveredChannels = [];
  let foundTikTok = null;

  for (const org of orgs) {
    for (const ch of (org.channels || [])) {
      allDiscoveredChannels.push(ch);
      const svc = String(ch.service || '').toLowerCase();
      const name = String(ch.displayName || ch.name || '').toLowerCase();
      if ((svc === 'tiktok' || svc.includes('tiktok') || name.includes('tiktok')) && !ch.isDisconnected && !ch.isLocked) {
        foundTikTok = ch;
        break;
      }
    }
    if (foundTikTok) break;
  }

  if (!foundTikTok) {
    const channelSummary = allDiscoveredChannels.length > 0
      ? allDiscoveredChannels.map(c => `[${c.service || 'unknown'}: "${c.displayName || c.name}" (ID: ${c.id})]`).join(', ')
      : 'None found';

    console.warn(`\n[Buffer/TikTok] ⚠️ NOTICE: No active TikTok channel found in Buffer account.`);
    console.warn(`Available channels in Buffer: ${channelSummary}`);
    console.warn(`To enable automated TikTok scheduling through Buffer:`);
    console.warn(`  1. Visit Buffer Channels settings: https://publish.buffer.com/channels`);
    console.warn(`  2. Click "Connect Channel" -> Select "TikTok"`);
    console.warn(`  3. Authorize Buffer to publish videos to your TikTok account`);
    console.warn(`  4. Optionally set BUFFER_TIKTOK_CHANNEL_ID in secrets to skip auto-discovery.\n`);
    console.log(`[Buffer/TikTok] Video is safely rendered and stored. Skipping Buffer queue dispatch.`);
    return null;
  }

  console.log(`[Buffer/TikTok] Auto-selected TikTok channel: "${foundTikTok.displayName || foundTikTok.name}" (ID: ${foundTikTok.id})`);
  return foundTikTok;
}

/**
 * Create video post queue item on Buffer
 */
async function createBufferPost(channel, mediaUrl, caption) {
  console.log(`\n[Buffer/TikTok] 📝 Queuing post to TikTok with caption:\n"${caption.slice(0, 120)}..."`);

  const mode = process.env.BUFFER_SHARE_NOW === 'true' ? 'shareNow' : 'addToQueue';
  const thumbnailOffsetMs = parseInt(process.env.BUFFER_THUMBNAIL_OFFSET_MS || '2000', 10);

  const query = `mutation CreateVideoPost($input: CreatePostInput!) {
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

  // Attempt with recommended TikTok thumbnailOffset metadata
  let input = {
    text: caption,
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: mode,
    assets: [
      {
        video: {
          url: mediaUrl,
          metadata: {
            thumbnailOffset: thumbnailOffsetMs
          }
        }
      }
    ]
  };

  let data;
  try {
    data = await bufferRequest(query, { input });
  } catch (err) {
    logWarn(`Initial VideoAssetInput with metadata returned error: ${err.message}. Retrying with direct video asset payload...`);
    input = {
      text: caption,
      channelId: channel.id,
      schedulingType: 'automatic',
      mode: mode,
      assets: [{ video: { url: mediaUrl } }]
    };
    data = await bufferRequest(query, { input });
  }

  const result = data?.createPost;

  if (!result) {
    fail('Buffer returned no createPost result.', {
      what: 'Buffer CreateVideoPost GraphQL mutation',
      why: 'Empty response payload received from Buffer API endpoint.',
      fixes: [
        'Check Buffer API service status at https://status.buffer.com/',
        'Verify your BUFFER_API_KEY rate limits and permissions.'
      ]
    });
  }

  if (result.message) {
    fail(`Buffer post creation failed: ${result.message}`, {
      what: 'Buffer post mutation validation',
      why: `Buffer GraphQL mutation error: "${result.message}"`,
      fixes: [
        'Verify your video URL is accessible without auth: ' + mediaUrl,
        'Ensure the video duration is under TikTok upload limits (typically < 10 mins)',
        'Check if your Buffer queue for this channel is full.'
      ]
    });
  }

  if (!result.post?.id) {
    fail('Buffer did not return a valid post ID.', {
      what: 'Buffer post response parsing',
      why: `Post object was missing from response: ${JSON.stringify(result)}`,
      fixes: ['Check Buffer dashboard at https://publish.buffer.com/ to inspect queue status manually.']
    });
  }

  // Record Buffer TikTok status into manifest
  try {
    const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(manifest) && manifest.length > 0) {
        manifest[manifest.length - 1].bufferTiktokPostId = result.post.id;
        manifest[manifest.length - 1].bufferTiktokStatus = result.post.status;
        manifest[manifest.length - 1].bufferTiktokChannel = channel.displayName || channel.name;
        manifest[manifest.length - 1].bufferTiktokPublishedAt = new Date().toISOString();
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
    }
  } catch (e) {
    logWarn(`Could not update manifest with Buffer TikTok post ID: ${e.message}`);
  }

  console.log(`\n==================================================`);
  console.log(`🚀 [Buffer/TikTok] SUCCESS! Video added to Buffer queue!`);
  console.log(`📌 Post ID: ${result.post.id}`);
  console.log(`📅 Status:  ${result.post.status}`);
  console.log(`🎯 Channel: ${channel.displayName || channel.name} (TikTok)`);
  console.log(`🌐 Media:   ${mediaUrl}`);
  console.log(`==================================================\n`);
}

async function main() {
  if (!BUFFER_API_KEY) {
    console.warn('[Buffer/TikTok] BUFFER_API_KEY environment variable is not configured. Skipping Buffer queue dispatch.');
    return;
  }

  const videoPath = findLatestVideo();
  const caption = resolvePostCaption();
  const mediaUrl = await resolvePublicVideoUrl(videoPath);
  const channel = await resolveTikTokChannel();
  if (!channel) {
    console.log('[Buffer/TikTok] No active TikTok channel selected. Skipping post creation.');
    return;
  }
  return await createBufferPost(channel, mediaUrl, caption);
}

module.exports = {
  uploadToDirectRelay,
  uploadToCloudinary,
  resolvePublicVideoUrl,
  resolveTikTokChannel,
  createBufferPost,
  main
};

if (require.main === module) {
  main().catch(error => fail(error?.stack || error?.message || String(error)));
}
