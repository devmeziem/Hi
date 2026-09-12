#!/usr/bin/env node
/**
 * Archie Explains -> Buffer dispatcher.
 * Uses a public GitHub Release asset as the Buffer media host.
 * No Cloudinary or temporary relay is used.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const BUFFER_API_URL = 'https://api.buffer.com';
const token = String(process.env.BUFFER_API_KEY || process.env.BUFFER_TOKEN || '').replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
const dryRun = process.env.DRY_RUN === 'true';
const shareNow = process.env.BUFFER_SHARE_NOW === 'true';

function validId(id) { return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim()); }
function latestVideo() {
  const roots = ['test_artifacts', 'rendered_videos', 'public/rendered_videos', 'output'];
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const full = path.join(root, name);
      if (fs.statSync(full).isFile() && /\.mp4$/i.test(name)) {
        const priority = /archie|fact_reel|cartoon|tech/i.test(name) ? 2 : 1;
        files.push({ full, mtime: fs.statSync(full).mtimeMs, priority });
      }
    }
  }
  files.sort((a,b) => (b.priority-a.priority) || (b.mtime-a.mtime));
  return files[0]?.full || null;
}

function githubReleaseUrl(videoPath) {
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_REPOSITORY/GITHUB_TOKEN are required to publish the video as a GitHub Release asset.');
  }
  const tag = `buffer-media-${process.env.GITHUB_RUN_ID || Date.now()}`;
  const title = `Archie Buffer Media ${process.env.GITHUB_RUN_NUMBER || Date.now()}`;
  console.log(`[GitHub Release] Creating public release asset: ${path.basename(videoPath)}`);
  execFileSync('gh', ['release', 'create', tag, videoPath, '--title', title, '--notes', 'Public media asset for Buffer ingestion.'], {
    stdio: 'inherit',
    env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN }
  });
  return `https://github.com/${process.env.GITHUB_REPOSITORY}/releases/download/${tag}/${encodeURIComponent(path.basename(videoPath))}`;
}

async function bufferRequest(query, variables) {
  const res = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables })
  });
  const payload = await res.json();
  if (!res.ok || payload.errors?.length) throw new Error(`Buffer API error: ${JSON.stringify(payload)}`);
  return payload.data;
}

async function discoverChannels() {
  const query = `query GetChannels { account { organizations { id name } } }`;
  const data = await bufferRequest(query, {});
  const organizations = data?.account?.organizations || [];
  const all = [];
  for (const org of organizations) {
    const q = `query GetChannels($organizationId: OrganizationId!) { channels(organizationId: $organizationId) { id name displayName service serviceId isDisconnected isLocked } }`;
    try {
      const result = await bufferRequest(q, { organizationId: org.id });
      all.push(...(result?.channels || []));
    } catch (err) {
      console.warn(`[Buffer] Could not inspect organization ${org.name}: ${err.message}`);
    }
  }
  return all.filter(c => !c.isDisconnected && !c.isLocked);
}

function pickTargets(channels) {
  const targets = [];
  const fbId = String(process.env.BUFFER_FACEBOOK_CHANNEL_ID || '').trim();
  const igId = String(process.env.BUFFER_INSTAGRAM_CHANNEL_ID || '').trim();
  const ttId = String(process.env.BUFFER_TIKTOK_CHANNEL_ID || '').trim();
  const facebook = channels.filter(c => String(c.service).toLowerCase() === 'facebook');
  const instagram = channels.filter(c => String(c.service).toLowerCase() === 'instagram');
  const tiktok = channels.filter(c => String(c.service).toLowerCase() === 'tiktok');
  const fb = validId(fbId) ? channels.find(c => c.id === fbId) : facebook[0];
  const ig = validId(igId) ? channels.find(c => c.id === igId) : (instagram.find(c => /bones/i.test(`${c.name} ${c.displayName}`)) || instagram[0]);
  const tt = validId(ttId) ? channels.find(c => c.id === ttId) : tiktok[0];
  for (const c of [fb, ig, tt]) if (c && validId(c.id)) targets.push(c);
  return [...new Map(targets.map(c => [c.id, c])).values()];
}

function caption(service) {
  const title = 'Did You Know? Mind-Blowing Science & Tech Breakdown';
  const fact = 'Archie Explains: cutting-edge science, AI, and engineering wonders.';
  const tags = '#ArchieExplains #Tech #Science #AI #Engineering #HowItWorks #DidYouKnow';
  if (service === 'instagram') return `${title}\n\n${fact}\n\nFollow for daily animated tech & science breakdowns.\n\n${tags} #ReelsInstagram #ScienceReels`;
  if (service === 'tiktok') return `${title}\n\n${fact}\n\nWhat topic should Archie explore next?\n\n${tags} #TikTokTech #TechTok`;
  return `${title}\n\n${fact}\n\nLike and share for more engineering explanations.\n\n${tags} #FacebookReels`;
}

async function post(channel, mediaUrl) {
  const service = String(channel.service || '').toLowerCase();
  const input = {
    text: caption(service),
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: shareNow ? 'shareNow' : 'addToQueue',
    assets: [{ video: { url: mediaUrl } }]
  };
  if (service === 'instagram') input.metadata = { instagram: { type: 'reel', shouldShareToFeed: true } };
  if (service === 'facebook') input.metadata = { facebook: { type: String(process.env.BUFFER_FACEBOOK_POST_TYPE || 'reel').toLowerCase() } };
  const mutation = `mutation CreateVideoPost($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id status channelId } } ... on MutationError { message } } }`;
  const data = await bufferRequest(mutation, { input });
  const result = data?.createPost;
  if (result?.message) throw new Error(result.message);
  if (!result?.post) throw new Error('Buffer returned no post result.');
  console.log(`  ✔ ${service.toUpperCase()} scheduled: ${result.post.id}`);
  return result.post;
}

async function main() {
  if (!token) throw new Error('BUFFER_API_KEY is missing.');
  const video = latestVideo();
  if (!video) throw new Error('No MP4 video found for Buffer publishing.');
  console.log(`[Buffer] Video: ${video}`);
  const channels = await discoverChannels();
  const targets = pickTargets(channels);
  if (!targets.length) throw new Error('No usable Facebook, Instagram, or TikTok Buffer channels found.');
  console.log(`[Buffer] Targets: ${targets.map(c => `${c.service}:${c.displayName || c.name}`).join(', ')}`);
  if (dryRun) {
    console.log('[Buffer] DRY_RUN=true; skipping release creation and posts.');
    return;
  }
  const mediaUrl = process.env.BUFFER_VIDEO_URL || githubReleaseUrl(video);
  console.log(`[GitHub Release] Public media URL ready: ${mediaUrl}`);
  const results = [];
  for (const channel of targets) {
    try {
      results.push({ channel: channel.service, success: true, post: await post(channel, mediaUrl) });
    } catch (err) {
      console.error(`  ✖ ${channel.service}: ${err.message}`);
      results.push({ channel: channel.service, success: false, error: err.message });
    }
  }
  const ok = results.filter(r => r.success).length;
  console.log(`[Buffer] Broadcast completed across ${ok}/${results.length} channels.`);
  // Preserve the requested existing behavior: per-channel failures do not fail the GitHub job.
}

main().catch(err => { console.error(`[Buffer Dispatcher Error] ${err.message}`); process.exit(1); });
