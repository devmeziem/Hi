#!/usr/bin/env node
/**
 * Publish the latest Fin Blueprint MP4 through Buffer to a connected TikTok channel.
 *
 * Flow:
 *   local MP4 -> Cloudinary public HTTPS URL -> Buffer GraphQL -> TikTok queue
 *
 * Required environment:
 *   BUFFER_API_KEY
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_UPLOAD_PRESET
 *
 * Optional:
 *   BUFFER_ORGANIZATION_ID
 *   BUFFER_TIKTOK_CHANNEL_ID
 *   BUFFER_POST_TEXT
 *   BUFFER_THUMBNAIL_OFFSET_MS
 */

const fs = require('fs');
const path = require('path');

const BUFFER_API_URL = 'https://api.buffer.com';
const BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();
const BUFFER_ORGANIZATION_ID = String(process.env.BUFFER_ORGANIZATION_ID || '').trim();
const BUFFER_TIKTOK_CHANNEL_ID = String(process.env.BUFFER_TIKTOK_CHANNEL_ID || '').trim();
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();
const POST_TEXT = String(process.env.BUFFER_POST_TEXT || process.env.TEST_TOPIC || 'Fin Blueprint').trim();
const THUMBNAIL_OFFSET_MS = Number.parseInt(process.env.BUFFER_THUMBNAIL_OFFSET_MS || '2000', 10);

function fail(message) {
  console.error(`\n[Buffer/TikTok] ERROR: ${message}`);
  process.exit(1);
}

async function bufferRequest(query, variables = {}) {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BUFFER_API_KEY}`
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

function findLatestVideo() {
  const roots = [
    path.join(process.cwd(), 'rendered_videos'),
    path.join(process.cwd(), 'test_artifacts')
  ];
  const files = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const full = path.join(root, name);
      if (fs.statSync(full).isFile() && /\.mp4$/i.test(name)) {
        files.push(full);
      }
    }
  }

  if (!files.length) fail('No MP4 was produced by test_fin_runner.cjs.');
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

async function uploadToCloudinary(videoPath) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    fail('CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are required because Buffer requires a public, stable media URL.');
  }

  console.log(`[Buffer/TikTok] Uploading ${path.basename(videoPath)} to Cloudinary...`);
  const bytes = fs.readFileSync(videoPath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'video/mp4' }), path.basename(videoPath));
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  form.append('resource_type', 'video');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/video/upload`, {
    method: 'POST',
    body: form
  });

  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`Cloudinary returned HTTP ${response.status}: ${text.slice(0, 500)}`); }
  if (!response.ok || !payload.secure_url) {
    throw new Error(`Cloudinary upload failed (HTTP ${response.status}): ${JSON.stringify(payload)}`);
  }

  console.log(`[Buffer/TikTok] Public media URL ready: ${payload.secure_url}`);
  return payload.secure_url;
}

async function resolveTikTokChannel() {
  if (BUFFER_TIKTOK_CHANNEL_ID) {
    const data = await bufferRequest(`query GetChannel($id: ChannelId!) {
      channel(input: { id: $id }) { id name displayName service isDisconnected isLocked allowedActions }
    }`, { id: BUFFER_TIKTOK_CHANNEL_ID });
    const channel = data?.channel;
    if (!channel) fail('BUFFER_TIKTOK_CHANNEL_ID was supplied but Buffer returned no channel.');
    if (channel.service !== 'tiktok') fail(`Configured Buffer channel is '${channel.service}', not TikTok.`);
    if (channel.isDisconnected || channel.isLocked) fail('Configured TikTok channel is disconnected or locked in Buffer.');
    return channel;
  }

  let organizationId = BUFFER_ORGANIZATION_ID;
  if (!organizationId) {
    const data = await bufferRequest(`query GetAccount { account { organizations { id name } } }`);
    const orgs = data?.account?.organizations || [];
    if (orgs.length !== 1) {
      fail('Set BUFFER_ORGANIZATION_ID when your Buffer account has more than one organization.');
    }
    organizationId = orgs[0]?.id;
  }

  const data = await bufferRequest(`query GetChannels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id name displayName service isDisconnected isLocked allowedActions
    }
  }`, { organizationId });

  const tiktoks = (data?.channels || []).filter(c => c.service === 'tiktok' && !c.isDisconnected && !c.isLocked);
  if (!tiktoks.length) fail('No usable TikTok channel was found in the selected Buffer organization.');
  if (tiktoks.length > 1) {
    fail(`Found ${tiktoks.length} usable TikTok channels. Set BUFFER_TIKTOK_CHANNEL_ID to choose one.`);
  }
  return tiktoks[0];
}

async function createBufferPost(channel, mediaUrl) {
  const query = `mutation CreateTikTokVideo($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id status dueAt channelService channelId text }
      }
      ... on MutationError { message }
    }
  }`;

  const input = {
    text: POST_TEXT,
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: 'addToQueue',
    assets: [{ video: { url: mediaUrl, metadata: { thumbnailOffset: Number.isFinite(THUMBNAIL_OFFSET_MS) ? THUMBNAIL_OFFSET_MS : 2000 } } }],
    metadata: { tiktok: { isAiGenerated: true } }
  };

  const data = await bufferRequest(query, { input });
  const result = data?.createPost;
  if (!result) fail('Buffer returned no createPost result.');
  if (result.message) fail(`Buffer could not create the TikTok post: ${result.message}`);
  if (!result.post?.id) fail(`Buffer did not return a post ID: ${JSON.stringify(result)}`);

  console.log(`[Buffer/TikTok] Queued successfully. Buffer post ID: ${result.post.id}`);
  console.log(`[Buffer/TikTok] Channel: ${channel.displayName || channel.name || channel.id}`);
  return result.post;
}

async function main() {
  if (!BUFFER_API_KEY) fail('BUFFER_API_KEY is missing. Add it as a GitHub Actions repository secret.');

  const videoPath = findLatestVideo();
  console.log(`[Buffer/TikTok] Selected video: ${videoPath}`);

  const mediaUrl = await uploadToCloudinary(videoPath);
  const channel = await resolveTikTokChannel();
  console.log(`[Buffer/TikTok] Target TikTok channel: ${channel.displayName || channel.name || channel.id}`);
  await createBufferPost(channel, mediaUrl);
}

main().catch(error => fail(error?.stack || error?.message || String(error)));
