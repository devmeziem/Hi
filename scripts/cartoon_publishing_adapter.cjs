/**
 * Automated Cartoon Factory — Abstract Publishing Adapter
 *
 * Pluggable architecture:
 * publish(video_path, platform, scheduled_time, metadata)
 *
 * Keeps video rendering decoupled from publishing APIs.
 */

class PublishingAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Abstract publish method
   * @param {string} videoPath - Absolute path to final validated MP4
   * @param {string} platform - 'youtube' | 'local_vault' | 'webhook' | 'cloudinary'
   * @param {string|null} scheduledTime - ISO 8601 timestamp or null for draft/immediate
   * @param {object} metadata - { title, description, tags, category }
   */
  async publish(videoPath, platform = 'local_vault', scheduledTime = null, metadata = {}) {
    console.log(`[Publishing Adapter] Dispatching "${metadata.title || 'Untitled Video'}" to platform: ${platform}`);

    if (platform === 'local_vault' || platform === 'dry_run') {
      return {
        success: true,
        platform,
        status: 'SAVED_TO_VAULT',
        videoPath,
        scheduledTime,
        message: 'Video preserved in local production artifacts vault without remote dispatch.'
      };
    }

    if (platform === 'youtube' || platform === 'omnichannel') {
      // Defer to YouTube API dispatcher only if OAuth credentials are fully provided
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      const defaultTags = ['#Animation', '#Tech', '#Science', '#AI', '#HowItWorks', '#FutureTech', '#Engineering', '#TechExplained', '#Archie', '#Educational', '#Shorts', '#DidYouKnow'];
      const defaultDesc = `${metadata.title}\n\nArchie breaks down tech, AI, and science concepts in animated visual breakdowns! What topic should Archie explore next? Drop your thoughts below!\n\n${defaultTags.join(' ')}`;
      let ytResult = null;
      try {
        const result = await uploadYouTubeShort({
          videoPath,
          title: metadata.title,
          description: metadata.description || defaultDesc,
          tags: metadata.tags || defaultTags,
          channelId: 'cartoon_factory'
        });
        ytResult = { success: true, platform: 'youtube', videoId: result?.id, status: 'PUBLISHED' };
      } catch (err) {
        console.warn('[Publishing Adapter] YouTube dispatch skipped or failed:', err.message);
        ytResult = { success: false, platform: 'youtube', error: err.message, status: 'FAILED' };
      }

      // If BUFFER_API_KEY is available, also cross-publish to Facebook, Instagram, and TikTok
      if (process.env.BUFFER_API_KEY) {
        try {
          const { publishArchieOmnichannel } = require('./publish_archie_to_buffer_omnichannel.cjs');
          const bufferResult = await publishArchieOmnichannel({
            videoPath,
            metadata: {
              title: metadata.title,
              fact: metadata.description,
              reference: metadata.reference
            }
          });
          return {
            success: ytResult?.success || bufferResult?.success,
            platform: 'omnichannel',
            youtube: ytResult,
            buffer: bufferResult
          };
        } catch (bufErr) {
          console.warn('[Publishing Adapter] Buffer omnichannel dispatch notice:', bufErr.message);
        }
      }

      return ytResult;
    }

    if (platform === 'buffer') {
      const { publishArchieOmnichannel } = require('./publish_archie_to_buffer_omnichannel.cjs');
      const bufferResult = await publishArchieOmnichannel({
        videoPath,
        metadata: {
          title: metadata.title,
          fact: metadata.description,
          reference: metadata.reference
        }
      });
      return {
        success: bufferResult?.success,
        platform: 'buffer',
        buffer: bufferResult
      };
    }

    return {
      success: true,
      platform,
      status: 'MOCK_DISPATCH',
      videoPath
    };
  }
}

module.exports = {
  PublishingAdapter,
  publisher: new PublishingAdapter()
};
