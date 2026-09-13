#!/usr/bin/env node

/**
 * Publisher for Facebook & Instagram Static InfoCards & Graphic Guides
 * Publishes deduplicated in-depth science & tech knowledge cards directly via Buffer.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUFFER_API_KEY = (process.env.BUFFER_API_KEY || '').trim();
const BUFFER_FACEBOOK_CHANNEL_ID = (process.env.BUFFER_FACEBOOK_CHANNEL_ID || '6aa31cd2cd8b9c702c468b52').trim();
const BUFFER_INSTAGRAM_CHANNEL_ID = (process.env.BUFFER_INSTAGRAM_CHANNEL_ID || '6aa31c1dcd8b9c702c467a38').trim();
const IS_DRY_RUN = process.env.DRY_RUN === 'true';

async function publishInfocards() {
  console.log('=== [Facebook & Instagram InfoCards Broadcast] ===');

  if (!BUFFER_API_KEY) {
    console.error('❌ BUFFER_API_KEY not configured.');
    process.exit(1);
  }

  // 1. Load or Generate InfoCard
  const metadataPath = path.join(process.cwd(), 'test_artifacts', 'infocard_latest.json');
  let meta = null;
  if (fs.existsSync(metadataPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch {}
  }

  if (!meta || !meta.imagePath || !fs.existsSync(meta.imagePath)) {
    console.log('🎨 Generating fresh in-depth science/tech infocard...');
    const { generateDailyInfocard } = require('./generate_facebook_instagram_infocard.cjs');
    meta = generateDailyInfocard();
  }

  console.log(`📌 Topic: "${meta.title}" (${meta.category})`);
  console.log(`🖼️ Image: ${meta.imagePath} (${Math.round(fs.statSync(meta.imagePath).size / 1024)} KB)`);

  // 2. Resolve Channels (Facebook & Instagram)
  const channels = [];
  if (BUFFER_FACEBOOK_CHANNEL_ID && BUFFER_FACEBOOK_CHANNEL_ID.length === 24) {
    channels.push({
      id: BUFFER_FACEBOOK_CHANNEL_ID,
      service: 'facebook',
      name: 'Voxam Fact (Facebook Page)',
      caption: meta.facebookCaption
    });
  }

  if (BUFFER_INSTAGRAM_CHANNEL_ID && BUFFER_INSTAGRAM_CHANNEL_ID.length === 24) {
    channels.push({
      id: BUFFER_INSTAGRAM_CHANNEL_ID,
      service: 'instagram',
      name: 'bones_ceo (Instagram)',
      caption: meta.instagramCaption
    });
  }

  if (!channels.length) {
    console.error('❌ No valid 24-char Facebook or Instagram channel IDs provided.');
    process.exit(1);
  }

  if (IS_DRY_RUN) {
    console.log(`\n🧪 DRY RUN MODE ACTIVE: Target channels (${channels.length}):`);
    channels.forEach(c => console.log(`  - ${c.name} (${c.id})`));
    console.log('\n--- Sample Facebook Caption ---');
    console.log(channels[0].caption.slice(0, 300) + '...\n');
    console.log('✅ Dry run completed successfully without making live posts.');
    process.exit(0);
  }

  // 3. Obtain Public Image URL (Cloudinary or GitHub Release)
  const { uploadToCloudinary, uploadToPublicRelay } = require('./publish_archie_to_buffer_omnichannel.cjs');
  let imageUrl = process.env.BUFFER_IMAGE_URL;
  if (!imageUrl) {
    try {
      imageUrl = await uploadToCloudinary(meta.imagePath);
    } catch (e) {
      console.warn('Cloudinary upload notice:', e.message);
    }
    if (!imageUrl) {
      imageUrl = await uploadToPublicRelay(meta.imagePath);
    }
  }

  if (!imageUrl) {
    console.error('❌ Could not obtain public URL for the graphic card.');
    process.exit(1);
  }

  console.log(`🌐 Public image URL ready: ${imageUrl}`);

  // 4. Dispatch each channel post via Buffer
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

  for (const ch of channels) {
    console.log(`\n📤 Dispatching to ${ch.name}...`);
    const input = {
      text: ch.caption,
      channelId: ch.id,
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

    if (ch.service === 'facebook') {
      input.metadata = {
        facebook: {
          type: 'post'
        }
      };
    } else if (ch.service === 'instagram') {
      input.metadata = {
        instagram: {
          type: 'post'
        }
      };
    }

    try {
      const res = await fetch('https://api.bufferapp.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BUFFER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation, variables: { input } })
      });

      const data = await res.json();
      if (data?.data?.createPost?.post?.id) {
        console.log(`  🎉 Successfully published to ${ch.service}! Post ID: ${data.data.createPost.post.id}`);
      } else {
        console.warn(`  ⚠️ Buffer response notice:`, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`  ❌ Failed dispatching to ${ch.service}:`, err.message);
    }
  }

  console.log('\n🏁 Facebook & Instagram visual knowledge broadcast complete.');
}

if (require.main === module) {
  publishInfocards().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
  });
}

module.exports = { publishInfocards };
