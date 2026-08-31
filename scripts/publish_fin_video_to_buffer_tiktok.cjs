#!/usr/bin/env node
/**
 * Publish the latest Fin Blueprint MP4 through Buffer to a connected TikTok channel.
 * Cloudinary uses an UNSIGNED upload preset: no Cloudinary API key or secret is required.
 */
const fs = require('fs');
const path = require('path');

const BUFFER_API_URL = 'https://api.buffer.com';
const BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();
const BUFFER_TIKTOK_CHANNEL_ID = String(process.env.BUFFER_TIKTOK_CHANNEL_ID || '').trim();
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();
const POST_TEXT = String(process.env.BUFFER_POST_TEXT || process.env.TEST_TOPIC || 'Fin Blueprint').trim();

function fail(message) { console.error(`\n[Buffer/TikTok] ERROR: ${message}`); process.exit(1); }

async function bufferRequest(query, variables = {}) {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BUFFER_API_KEY}` },
    body: JSON.stringify({ query, variables })
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`Buffer returned non-JSON HTTP ${response.status}: ${text.slice(0, 500)}`); }
  if (!response.ok) throw new Error(`Buffer HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (payload.errors?.length) throw new Error(`Buffer GraphQL error: ${payload.errors.map(e => e.message).join('; ')}`);
  return payload.data;
}

function findLatestVideo() {
  const roots = [path.join(process.cwd(), 'rendered_videos'), path.join(process.cwd(), 'test_artifacts')];
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const full = path.join(root, name);
      if (fs.statSync(full).isFile() && /\.mp4$/i.test(name)) files.push(full);
    }
  }
  if (!files.length) fail('No MP4 was produced by test_fin_runner.cjs.');
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

async function uploadToCloudinary(videoPath) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    fail('CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are required. The upload preset must be configured as UNSIGNED. No Cloudinary API key or API secret is required.');
  }

  console.log(`[Buffer/TikTok] Unsigned-uploading ${path.basename(videoPath)} to Cloudinary...`);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(videoPath)], { type: 'video/mp4' }), path.basename(videoPath));
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/video/upload`, { method: 'POST', body: form });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`Cloudinary returned HTTP ${response.status}: ${text.slice(0, 500)}`); }
  if (!response.ok || !payload.secure_url) throw new Error(`Cloudinary unsigned upload failed (HTTP ${response.status}): ${JSON.stringify(payload)}`);
  console.log(`[Buffer/TikTok] Public media URL ready: ${payload.secure_url}`);
  return payload.secure_url;
}

async function resolveTikTokChannel() {
  if (!BUFFER_TIKTOK_CHANNEL_ID) fail('BUFFER_TIKTOK_CHANNEL_ID is required.');
  const data = await bufferRequest(`query GetChannel($id: ChannelId!) {
    channel(input: { id: $id }) { id name displayName service isDisconnected isLocked }
  }`, { id: BUFFER_TIKTOK_CHANNEL_ID });
  const channel = data?.channel;
  if (!channel) fail('Buffer returned no channel for BUFFER_TIKTOK_CHANNEL_ID.');
  if (channel.service !== 'tiktok') fail(`Configured Buffer channel is '${channel.service}', not TikTok.`);
  if (channel.isDisconnected) fail('The configured TikTok channel is disconnected from Buffer.');
  if (channel.isLocked) fail('The configured TikTok channel is locked in Buffer.');
  return channel;
}

async function createBufferPost(channel, mediaUrl) {
  const query = `mutation CreateVideoPost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status dueAt channelId text } }
      ... on MutationError { message }
    }
  }`;
  const input = {
    text: POST_TEXT,
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: 'addToQueue',
    assets: [{ video: { url: mediaUrl } }]
  };
  const data = await bufferRequest(query, { input });
  const result = data?.createPost;
  if (!result) fail('Buffer returned no createPost result.');
  if (result.message) fail(`Buffer could not create the TikTok post: ${result.message}`);
  if (!result.post?.id) fail(`Buffer did not return a post ID: ${JSON.stringify(result)}`);
  console.log(`[Buffer/TikTok] Queued successfully. Buffer post ID: ${result.post.id}`);
}

async function main() {
  if (!BUFFER_API_KEY) fail('BUFFER_API_KEY is missing.');
  const videoPath = findLatestVideo();
  const mediaUrl = await uploadToCloudinary(videoPath);
  const channel = await resolveTikTokChannel();
  console.log(`[Buffer/TikTok] Target: ${channel.displayName || channel.name || channel.id}`);
  await createBufferPost(channel, mediaUrl);
}

main().catch(error => fail(error?.stack || error?.message || String(error)));
