#!/usr/bin/env node

/**
 * Publisher for Facebook & Instagram Static InfoCards & Graphic Guides
 * Publishes deduplicated in-depth science & tech knowledge cards directly via Buffer.
 * 
 * Features:
 * - Dual Engine: Modern GraphQL (https://api.buffer.com) + Classic REST fallback
 * - Full Long-form caption support with zero truncation
 * - Multi-host CDN media relay fallback
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUFFER_API_KEY = (process.env.BUFFER_API_KEY || '').replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim();
const BUFFER_FACEBOOK_CHANNEL_ID = (process.env.BUFFER_FACEBOOK_CHANNEL_ID || '6aa31cd2cd8b9c702c468b52').trim();
const BUFFER_INSTAGRAM_CHANNEL_ID = (process.env.BUFFER_INSTAGRAM_CHANNEL_ID || '6aa31c1dcd8b9c702c467a38').trim();
const IS_DRY_RUN = process.env.DRY_RUN === 'true';

const BUFFER_GQL_URL = 'https://api.buffer.com';
const BUFFER_REST_URL = 'https://api.bufferapp.com/1/updates/create.json';

/**
 * Post via Modern Buffer GraphQL API
 */
async function postViaGraphQL(channel, imageUrl, caption) {
  const mutation = `mutation CreateImagePost($input: CreatePostInput!) {
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
    channelId: channel.id,
    schedulingType: 'automatic',
    mode: 'shareNow',
    assets: [
      {
        image: {
          url: imageUrl
        }
      }
    ]
  };

  if (channel.service === 'facebook') {
    input.metadata = { facebook: { type: 'post' } };
  } else if (channel.service === 'instagram') {
    input.metadata = {
      instagram: {
        type: 'post',
        shouldShareToFeed: true
      }
    };
  }

  async function executeGql(payload) {
    const res = await fetch(BUFFER_GQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BUFFER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: mutation, variables: { input: payload } })
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Buffer GQL returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    return data;
  }

  let data = await executeGql(input);

  // If error message indicates shareNow not supported for Instagram, retry with mode: 'addToQueue'
  const initialErr = data?.data?.createPost?.message || data?.errors?.[0]?.message;
  if (initialErr && (initialErr.toLowerCase().includes('sharenow') || initialErr.toLowerCase().includes('mode') || initialErr.toLowerCase().includes('cannot share'))) {
    console.log(`  🔄 Retrying ${channel.service} with mode: "addToQueue"...`);
    input.mode = 'addToQueue';
    data = await executeGql(input);
  }

  if (data?.data?.createPost?.post?.id) {
    return { ok: true, id: data.data.createPost.post.id, engine: 'graphql' };
  }

  const errMsg = data?.data?.createPost?.message || data?.errors?.[0]?.message || JSON.stringify(data);
  throw new Error(`Buffer GQL error: ${errMsg}`);
}

/**
 * Post via Classic Buffer REST API (Fallback)
 */
async function postViaRest(channel, imageUrl, caption) {
  const params = new URLSearchParams();
  params.append('profile_ids[]', channel.id);
  params.append('text', caption);
  params.append('media[photo]', imageUrl);
  params.append('now', 'true');

  const res = await fetch(BUFFER_REST_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Buffer REST returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  if (data?.success || (data?.updates && data.updates.length > 0)) {
    const id = data?.updates?.[0]?.id || 'REST_SUCCESS';
    return { ok: true, id, engine: 'rest' };
  }

  throw new Error(`Buffer REST error: ${data?.message || text}`);
}

async function publishInfocards() {
  console.log('=== [Facebook & Instagram InfoCards Broadcast] ===');

  if (!BUFFER_API_KEY && !IS_DRY_RUN) {
    console.error('❌ BUFFER_API_KEY not configured.');
    process.exit(1);
  }

  // 1. Load or Generate InfoCard
  const manifestPath = path.join(process.cwd(), 'test_artifacts', 'infocard_manifest.json');
  let meta = null;
  if (fs.existsSync(manifestPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {}
  }

  const imageFile = meta?.pngPath || path.join(process.cwd(), 'test_artifacts', 'infocard_latest.png');
  if (!meta || !fs.existsSync(imageFile)) {
    console.log('🎨 Generating fresh in-depth science/tech infocard...');
    const { generateDailyInfocard } = require('./generate_facebook_instagram_infocard.cjs');
    meta = await generateDailyInfocard();
  }

  const pngPath = meta.pngPath || imageFile;
  const fbCaption = meta.fbCaption || meta.facebookCaption || '';
  const igCaption = meta.igCaption || meta.instagramCaption || '';

  console.log(`📌 Topic: "${meta.title}" [Category: ${meta.category}]`);
  console.log(`🖼️ Image File: ${pngPath} (${Math.round(fs.statSync(pngPath).size / 1024)} KB)`);
  console.log(`📝 Facebook Caption Length: ${fbCaption.length} characters`);
  console.log(`📝 Instagram Caption Length: ${igCaption.length} characters`);

  // 2. Resolve Channels (Facebook & Instagram)
  const channels = [];
  if (BUFFER_FACEBOOK_CHANNEL_ID && BUFFER_FACEBOOK_CHANNEL_ID.length === 24) {
    channels.push({
      id: BUFFER_FACEBOOK_CHANNEL_ID,
      service: 'facebook',
      name: 'Voxam Fact (Facebook Page)',
      caption: fbCaption
    });
  }

  if (BUFFER_INSTAGRAM_CHANNEL_ID && BUFFER_INSTAGRAM_CHANNEL_ID.length === 24) {
    channels.push({
      id: BUFFER_INSTAGRAM_CHANNEL_ID,
      service: 'instagram',
      name: 'bones_ceo (Instagram)',
      caption: igCaption
    });
  }

  if (!channels.length) {
    console.error('❌ No valid 24-character Facebook or Instagram channel IDs provided.');
    process.exit(1);
  }

  if (IS_DRY_RUN) {
    console.log(`\n🧪 DRY RUN MODE ACTIVE: Target channels (${channels.length}):`);
    channels.forEach(c => console.log(`  - ${c.name} (${c.id})`));
    console.log('\n--- Sample Facebook Caption ---');
    console.log(channels[0].caption.slice(0, 400) + '...\n');
    console.log('✅ Dry run completed successfully without making live posts.');
    process.exit(0);
  }

  // 3. Obtain Public Image URL (Cloudinary, GitHub Release CDN, or Public Relay)
  const { uploadToCloudinary, uploadToPublicRelay } = require('./publish_archie_to_buffer_omnichannel.cjs');
  let imageUrl = process.env.BUFFER_IMAGE_URL;
  if (!imageUrl) {
    try {
      imageUrl = await uploadToCloudinary(pngPath);
    } catch (e) {
      console.warn('Cloudinary upload notice:', e.message);
    }
    if (!imageUrl) {
      imageUrl = await uploadToPublicRelay(pngPath);
    }
  }

  if (!imageUrl) {
    console.error('❌ Could not obtain public URL for the graphic card.');
    process.exit(1);
  }

  console.log(`🌐 Public image URL ready: ${imageUrl}`);

  // 4. Dispatch each channel post via Buffer with Modern GraphQL + REST Fallback
  for (const ch of channels) {
    console.log(`\n📤 Dispatching to ${ch.name} (${ch.id})...`);
    let posted = false;

    // Attempt 1: Modern GraphQL API
    try {
      const res = await postViaGraphQL(ch, imageUrl, ch.caption);
      console.log(`  🎉 Successfully published to ${ch.service} via GraphQL! (Post ID: ${res.id})`);
      posted = true;
    } catch (gqlErr) {
      console.warn(`  ℹ️ GraphQL notice: ${gqlErr.message}. Attempting Classic REST fallback...`);
    }

    // Attempt 2: Classic REST API Fallback
    if (!posted) {
      try {
        const restRes = await postViaRest(ch, imageUrl, ch.caption);
        console.log(`  🎉 Successfully published to ${ch.service} via Classic REST! (Update ID: ${restRes.id})`);
        posted = true;
      } catch (restErr) {
        console.error(`  ❌ REST fallback also failed for ${ch.service}:`, restErr.message);
      }
    }
  }

  console.log('\n🏁 Facebook & Instagram visual knowledge broadcast sequence completed.');
}

if (require.main === module) {
  publishInfocards().catch(e => {
    console.error('Fatal publish error:', e);
    process.exit(1);
  });
}

module.exports = { publishInfocards };
