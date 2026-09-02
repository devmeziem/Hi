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

  if (STRICT_BUFFER_FAIL) {
    process.exit(1);
  } else {
    console.log(`[Buffer/TikTok] Continuing pipeline (non-blocking mode). Set STRICT_BUFFER_FAIL=true in your environment to enforce exit code 1.`);
    process.exit(0);
  }
}

/**
 * Validate Cloudinary Configuration for unsigned uploads
 */
function validateCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    fail('Cloudinary configuration is missing required environment variables.', {
      what: 'Cloudinary media hosting upload initiation',
      why: `CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME ? 'Present' : 'MISSING'}, CLOUDINARY_UPLOAD_PRESET=${CLOUDINARY_UPLOAD_PRESET ? 'Present' : 'MISSING'}`,
      fixes: [
        'Create a free Cloudinary account at https://cloudinary.com',
        'Go to Settings > Upload > Upload presets > Add upload preset > set Signing Mode to "Unsigned"',
        'Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET into your GitHub Repository Secrets'
      ]
    });
    return false;
  }

  // Catch the common mistake where user pastes numeric API key into cloud name
  if (/^\d{6,15}$/.test(CLOUDINARY_CLOUD_NAME)) {
    fail('CLOUDINARY_CLOUD_NAME appears to contain a numeric API key instead of your Cloud Name.', {
      what: 'Cloudinary Cloud Name validation',
      why: `Configured CLOUDINARY_CLOUD_NAME is purely numeric ("${CLOUDINARY_CLOUD_NAME}"), which is an API key rather than your cloud identifier string.`,
      fixes: [
        'Visit your Cloudinary Dashboard at https://console.cloudinary.com/pm',
        'Locate your Cloud Name string (e.g. "dx9abc123" or your custom account name)',
        'Update CLOUDINARY_CLOUD_NAME in GitHub Secrets to that alphanumeric name.'
      ]
    });
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
  if (process.env.BUFFER_POST_TEXT && process.env.BUFFER_POST_TEXT.trim().length > 5) {
    return `${process.env.BUFFER_POST_TEXT.trim()}\n\n${MANDATORY_FINANCIAL_DISCLAIMER}`;
  }

  // 1. Check test_artifacts/fin_episode_plan.json
  const episodePlanPath = path.join(process.cwd(), 'test_artifacts', 'fin_episode_plan.json');
  if (fs.existsSync(episodePlanPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(episodePlanPath, 'utf8'));
      if (plan?.title) {
        const tags = (plan.tags || ['#Shorts', '#finance', '#moneytips', '#business', '#wealth', '#fyp']).join(' ');
        return `${plan.title}\n\n${plan.communityQuestion ? '💡 ' + plan.communityQuestion + '\n\n' : ''}${MANDATORY_FINANCIAL_DISCLAIMER}\n\n${tags}`;
      }
    } catch {}
  }

  // 2. Check daily_blueprint_manifest.json
  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const last = Array.isArray(manifest) ? manifest[manifest.length - 1] : manifest;
      if (last?.title) {
        return `${last.title}\n\n${MANDATORY_FINANCIAL_DISCLAIMER}\n\n#Shorts #finance #moneytips #business #sidehustle #fyp`;
      }
    } catch {}
  }

  return `${process.env.TEST_TOPIC || 'How to Build Cash Flow with Small Capital'}\n\n${MANDATORY_FINANCIAL_DISCLAIMER}\n\n#Shorts #finance #moneytips #fyp`;
}

/**
 * Upload local video file to Cloudinary unsigned endpoint
 */
async function uploadToCloudinary(videoPath) {
  validateCloudinaryConfig();
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
    throw new Error(
      `Cloudinary unsigned upload failed: ${cloudError}.\n` +
      `Ensure your upload preset "${CLOUDINARY_UPLOAD_PRESET}" is set to "Unsigned" in Cloudinary Settings > Upload.`
    );
  }

  console.log(`[Buffer/TikTok] ✅ Public Video URL generated: ${payload.secure_url}`);
  return payload.secure_url;
}

/**
 * Auto-discover or validate TikTok channel in Buffer account
 */
async function resolveTikTokChannel() {
  if (BUFFER_TIKTOK_CHANNEL_ID) {
    const data = await bufferRequest(`query GetChannel($id: ChannelId!) {
      channel(input: { id: $id }) { id name displayName service isDisconnected isLocked }
    }`, { id: BUFFER_TIKTOK_CHANNEL_ID });

    const channel = data?.channel;
    if (channel) {
      if (channel.isDisconnected) fail(`The configured TikTok channel (${channel.displayName || channel.name}) is disconnected from Buffer.`);
      if (channel.isLocked) fail(`The configured TikTok channel (${channel.displayName || channel.name}) is locked in Buffer.`);
      return channel;
    }
  }

  // Auto-discover TikTok channels from account
  console.log('[Buffer/TikTok] Querying Buffer account for connected channels...');
  const accountData = await bufferRequest(`query GetAccountChannels {
    account {
      organizations {
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

  const orgs = accountData?.account?.organizations || [];
  let foundTikTok = null;

  for (const org of orgs) {
    for (const ch of (org.channels || [])) {
      if (ch.service === 'tiktok' && !ch.isDisconnected && !ch.isLocked) {
        foundTikTok = ch;
        break;
      }
    }
    if (foundTikTok) break;
  }

  if (!foundTikTok) {
    fail('Could not find an active TikTok channel in your Buffer account.', {
      what: 'Buffer account channel discovery for TikTok',
      why: 'No connected, non-locked TikTok channels were returned by the Buffer GraphQL API.',
      fixes: [
        'Visit Buffer Channels settings: https://publish.buffer.com/channels',
        'Click "Connect Channel" -> Select "TikTok"',
        'Authorize Buffer to publish videos to your TikTok account',
        'Optionally set BUFFER_TIKTOK_CHANNEL_ID directly in your environment/secrets to skip auto-discovery.'
      ]
    });
  }

  console.log(`[Buffer/TikTok] Auto-selected TikTok channel: "${foundTikTok.displayName || foundTikTok.name}" (ID: ${foundTikTok.id})`);
  return foundTikTok;
}

/**
 * Create video post queue item on Buffer
 */
async function createBufferPost(channel, mediaUrl, caption) {
  console.log(`\n[Buffer/TikTok] 📝 Queuing post with caption:\n"${caption.slice(0, 120)}..."`);

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

  const input = {
    text: caption,
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: 'addToQueue',
    assets: [{ video: { url: mediaUrl } }]
  };

  const data = await bufferRequest(query, { input });
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

  console.log(`\n==================================================`);
  console.log(`🚀 [Buffer/TikTok] SUCCESS! Video added to Buffer queue!`);
  console.log(`📌 Post ID: ${result.post.id}`);
  console.log(`📅 Status:  ${result.post.status}`);
  console.log(`🎯 Channel: ${channel.displayName || channel.name} (TikTok)`);
  console.log(`==================================================\n`);
}

async function main() {
  if (!BUFFER_API_KEY) {
    console.log('[Buffer/TikTok] BUFFER_API_KEY is not configured. Skipping Buffer TikTok publication.');
    return;
  }

  const videoPath = findLatestVideo();
  const caption = resolvePostCaption();
  const mediaUrl = await uploadToCloudinary(videoPath);
  const channel = await resolveTikTokChannel();
  await createBufferPost(channel, mediaUrl, caption);
}

main().catch(error => fail(error?.stack || error?.message || String(error)));
