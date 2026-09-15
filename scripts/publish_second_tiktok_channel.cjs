#!/usr/bin/env node

/**
 * Secondary TikTok Channel Publisher
 * Dedicated standalone dispatcher for the secondary TikTok channel per user specification.
 * Completely decoupled from the primary channel.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUFFER_API_KEY = (process.env.BUFFER_API_KEY || '').trim();
const SECONDARY_TIKTOK_ID = (process.env.BUFFER_TIKTOK_CHANNEL_ID_2 || process.env.BUFFER_TIKTOK_SECONDARY_CHANNEL_ID || '').trim();
const IS_DRY_RUN = process.env.DRY_RUN === 'true';

async function publishToSecondaryTikTok() {
  console.log('=== [Secondary TikTok Dispatcher] Initiating Broadcast ===');

  if (!BUFFER_API_KEY) {
    console.error('❌ BUFFER_API_KEY is not configured in environment or GitHub Secrets.');
    process.exit(1);
  }

  // 1. Locate latest Archie MP4 video
  const searchDirs = [
    path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels'),
    path.join(process.cwd(), 'test_artifacts'),
    path.join(process.cwd(), 'rendered_videos'),
    path.join(process.cwd(), 'public', 'rendered_videos')
  ];

  let videoPath = null;
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({ file: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      if (files.length > 0) {
        videoPath = files[0].file;
        break;
      }
    }
  }

  if (!videoPath) {
    console.warn('⚠️ No rendered Archie MP4 found. Generating fresh video now...');
    try {
      execSync('node scripts/generate_archie_tech_fact_reel.cjs', { stdio: 'inherit' });
      videoPath = path.join(process.cwd(), 'test_artifacts', 'archie_tech_fact_5s_latest.mp4');
    } catch (e) {
      console.error('❌ Failed to generate video:', e.message);
      process.exit(1);
    }
  }

  console.log(`📹 Video selected: ${path.basename(videoPath)} (${Math.round(fs.statSync(videoPath).size / 1024)} KB)`);

  // 2. Load rich metadata (title, fact, tags)
  let metadata = {
    title: 'Did You Know? Mind-Blowing Science & Tech Breakdown',
    fact: 'Archie Explains: Cutting-edge science, AI, and everyday wonders!',
    citation: 'Verified Scientific Research',
    tags: ['#ArchieExplains', '#TechTok', '#TikTokTech', '#ScienceTok', '#FYP', '#Shorts']
  };

  const metaPath = path.join(process.cwd(), 'test_artifacts', 'archie_tech_fact_latest.json');
  if (fs.existsSync(metaPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (parsed.title) metadata.title = parsed.title;
      if (parsed.fact) metadata.fact = parsed.fact;
      if (parsed.reference) metadata.citation = parsed.reference;
      if (parsed.tags && parsed.tags.length > 0) {
        metadata.tags = Array.from(new Set([...parsed.tags, '#TikTokTech', '#TechTok', '#FYP', '#Shorts']));
      }
    } catch {}
  }

  const caption = `⚡ ${metadata.title.toUpperCase()}\n\n${metadata.fact}\n\n🔬 Verified Citation: ${metadata.citation}\n\nWhat topic should Archie explore next? Drop your thoughts below!\n\n${metadata.tags.join(' ')}`;

  // 3. Resolve Secondary TikTok Channel ID
  let targetChannelId = SECONDARY_TIKTOK_ID;
  if (!targetChannelId || targetChannelId.length !== 24) {
    console.log('🔍 Discovering secondary TikTok channel from Buffer accounts...');
    try {
      const query = `query GetChannels {
        account {
          channels {
            id
            service
            name
            displayName
          }
        }
      }`;
      const res = await fetch('https://api.bufferapp.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BUFFER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      const allTiktoks = (data?.data?.account?.channels || [])
        .filter(c => (c.service || '').toLowerCase() === 'tiktok')
        .filter(c => {
          const nameLower = `${c.name || ''} ${c.displayName || ''}`.toLowerCase();
          const isFirstOrMike = c.id === '6a9b6f3f065799be468f596b' || nameLower.includes('mike.the.tutor') || nameLower.includes('mikethetutor');
          if (isFirstOrMike) {
            console.log(`[Secondary TikTok] 🛑 Bypassing primary account / mike.the.tutor (ID: ${c.id})`);
            return false;
          }
          return true;
        });
      console.log(`Found ${allTiktoks.length} eligible secondary TikTok channel(s) in Buffer.`);
      if (allTiktoks.length >= 1) {
        targetChannelId = allTiktoks[0].id;
        console.log(`🎯 Using Secondary TikTok Channel: "${allTiktoks[0].displayName || allTiktoks[0].name}" (ID: ${targetChannelId})`);
      } else {
        console.warn('⚠️ No eligible secondary TikTok channel found (mike.the.tutor and first account excluded).');
      }
    } catch (e) {
      console.warn('⚠️ Discovery notice:', e.message);
    }
  }

  if (!targetChannelId || targetChannelId.length !== 24) {
    console.error('❌ No valid 24-character Secondary TikTok Channel ID found. Configure BUFFER_TIKTOK_CHANNEL_ID_2 in GitHub Secrets.');
    process.exit(1);
  }

  if (IS_DRY_RUN) {
    console.log(`🧪 DRY RUN MODE ACTIVE: Would post to TikTok Channel ID ${targetChannelId}`);
    console.log('Caption preview:\n', caption);
    process.exit(0);
  }

  // 4. Resolve media URL via Cloudinary or Public Git Release
  let mediaUrl = process.env.BUFFER_VIDEO_URL;
  if (!mediaUrl) {
    const { uploadToCloudinary, uploadToPublicRelay } = require('./publish_archie_to_buffer_omnichannel.cjs');
    try {
      mediaUrl = await uploadToCloudinary(videoPath);
    } catch (e) {
      console.warn('Cloudinary upload notice:', e.message);
    }
    if (!mediaUrl) {
      mediaUrl = await uploadToPublicRelay(videoPath);
    }
  }

  if (!mediaUrl) {
    console.error('❌ Failed to obtain a public HTTP URL for the video.');
    process.exit(1);
  }

  console.log(`🌐 Public video URL ready: ${mediaUrl}`);

  // 5. Dispatch via Buffer GraphQL
  const mutation = `mutation CreateSecondaryTikTokPost($input: CreatePostInput!) {
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
    channelId: targetChannelId,
    schedulingType: 'automatic',
    mode: 'shareNow',
    assets: [
      {
        video: {
          url: mediaUrl
        }
      }
    ],
    metadata: {
      tiktok: {}
    }
  };

  const response = await fetch('https://api.bufferapp.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: mutation, variables: { input } })
  });

  const respData = await response.json();
  if (respData?.data?.createPost?.post?.id) {
    console.log(`🎉 Successfully published to Secondary TikTok Channel! Post ID: ${respData.data.createPost.post.id}`);
  } else {
    console.error('❌ Buffer error:', JSON.stringify(respData));
    process.exit(1);
  }
}

if (require.main === module) {
  publishToSecondaryTikTok().catch(err => {
    console.error('Fatal Secondary TikTok Error:', err);
    process.exit(1);
  });
}

module.exports = { publishToSecondaryTikTok };
