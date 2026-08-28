/**
 * Voxam Visual Enhancement Engine - FLUX.1 High-CTR Shorts Thumbnail Generator
 * Model: @cf/black-forest-labs/flux-1-schnell (Cloudflare Workers AI)
 * Fallback: Pollinations.ai FLUX.1 Engine (1080x1920 9:16)
 *
 * Specifically engineered to maximize YouTube Shorts Click-Through Rate (CTR)
 * and 2-Second Viewed-vs-Swiped-Away (VVSA) retention by creating ultra-high-contrast,
 * punchy, cinematic opening frames for Slide 0.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

/**
 * Niche-Specific CTR Visual Hook Engineering
 */
function buildHighCtrFluxPrompt(topic, niche = 'finance_saas', baseVisual = '') {
  const cleanTopic = (topic || 'High Yield Opportunity').replace(/[#"]/g, '').trim();

  let styleModifier = '';
  if (niche.includes('finance') || niche.includes('saas') || niche.includes('wealth')) {
    styleModifier = 'dark obsidian slate studio setting, vibrant emerald green hologram revenue chart, crisp dual currency ₦ and $ floating glass coins, warm gold volumetric rim lighting, photorealistic hands holding sleek smartphone with positive cashflow dashboard, high contrast, sharp focus, 8k 9:16 vertical poster';
  } else if (niche.includes('stoic') || niche.includes('motivation') || niche.includes('mindset')) {
    styleModifier = 'ancient weathered Roman marble bust of Marcus Aurelius with intense gaze, dramatic chiaroscuro side lighting, warm amber golden-hour glow against pitch black void, anamorphic 35mm lens blur, hyperdetailed stone textures, deep shadows, 8k 9:16 vertical cinematic masterpiece';
  } else {
    // Tech & AI
    styleModifier = 'futuristic cybernetic workstation, neon cyan and electric violet edge glow, glowing AI neural network nodes floating in air, dark glass terminal displaying clean automated code, ultra-sharp depth of field, 8k 9:16 vertical tech showcase';
  }

  const promptCore = baseVisual && baseVisual.length > 10 ? baseVisual : cleanTopic;
  return `${promptCore}, ${styleModifier}, high contrast, saturated focal points, zero blur, professional YouTube Shorts viral thumbnail, 1080x1920`;
}

/**
 * Primary: Cloudflare Workers AI FLUX.1 Schnell
 */
async function generateFluxSchnellImage(prompt, customAccountId, customApiToken) {
  const accountId = customAccountId || CLOUDFLARE_ACCOUNT_ID;
  const apiToken = customApiToken || CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return null;
  }

  const model = '@cf/black-forest-labs/flux-1-schnell';
  const randomSeed = Math.floor(Math.random() * 99999999);

  try {
    const postData = JSON.stringify({
      prompt: `${prompt.slice(0, 400)}, 8k vertical 9:16, masterpiece, extreme detail`,
      steps: 4,
      seed: randomSeed
    });

    const result = await new Promise((resolve) => {
      const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 25000
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(buffer.toString('utf8'));
              if (json.result?.image) {
                return resolve({
                  imageUrl: `data:image/jpeg;base64,${json.result.image}`,
                  model: 'FLUX.1-schnell (Cloudflare Workers AI)',
                  provider: 'Cloudflare Workers AI'
                });
              }
            } catch {}

            if (buffer.length > 1000) {
              return resolve({
                imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
                model: 'FLUX.1-schnell (Cloudflare Workers AI)',
                provider: 'Cloudflare Workers AI'
              });
            }
          }
          resolve(null);
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });

    return result;
  } catch (err) {
    return null;
  }
}

/**
 * Fallback: Pollinations FLUX.1 Engine (High-Resolution 9:16)
 */
async function generatePollinationsFluxImage(prompt) {
  try {
    const seed = Math.floor(Math.random() * 99999999);
    const encoded = encodeURIComponent(prompt.slice(0, 260));
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true&model=flux&seed=${seed}`;

    const buffer = await new Promise((resolve) => {
      const req = https.get(url, { headers: { 'User-Agent': 'VoxamFluxEngine/1.0' }, timeout: 20000 }, (res) => {
        if (res.statusCode === 200) {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        } else {
          resolve(null);
        }
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });

    if (buffer && buffer.length > 4000) {
      return {
        imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
        fallbackUrl: url,
        model: 'FLUX.1 (Pollinations Engine)',
        provider: 'Pollinations AI FLUX.1'
      };
    }
    
    // Return direct URL as ultra-safe fallback
    return {
      imageUrl: url,
      model: 'FLUX.1 (Pollinations Engine Direct)',
      provider: 'Pollinations AI FLUX.1'
    };
  } catch {
    return null;
  }
}

/**
 * Main Visual Enhancement Pipeline Step
 */
async function enhanceVisualForSlideZero(topic, niche = 'finance_saas', baseVisual = '', customAccountId, customApiToken) {
  const highCtrPrompt = buildHighCtrFluxPrompt(topic, niche, baseVisual);
  console.log(`[Visual Enhancement FLUX.1] Generating High-CTR Thumbnail for: "${topic}" (${niche})...`);

  // 1. Try Cloudflare FLUX.1 Schnell
  let result = await generateFluxSchnellImage(highCtrPrompt, customAccountId, customApiToken);
  if (result) {
    console.log(`  ✔ [FLUX.1 Success] Generated via ${result.model}`);
    return {
      ...result,
      enhancedPrompt: highCtrPrompt
    };
  }

  // 2. Fallback to Pollinations FLUX.1
  console.log(`  -> Engaging Pollinations FLUX.1 Engine fallback...`);
  result = await generatePollinationsFluxImage(highCtrPrompt);
  if (result) {
    console.log(`  ✔ [FLUX.1 Success] Generated via ${result.model}`);
    return {
      ...result,
      enhancedPrompt: highCtrPrompt
    };
  }

  return null;
}

/**
 * Process Visual Enhancement for entire manifest queue
 */
async function runVisualEnhancementQueue() {
  console.log("=== [02.5: FLUX.1 VISUAL ENHANCEMENT ENGINE] ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.log("No manifest file found. Nothing to enhance.");
    return;
  }

  let jobs = [];
  try {
    jobs = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.error("Could not parse manifest:", e.message);
    return;
  }

  let enhancedCount = 0;
  for (const job of jobs) {
    const topic = job.title || job.topic || 'High Impact Short';
    const niche = job.channelId || job.niche || 'finance_saas';
    const initialSlideVisual = job.slides?.[0]?.visual || job.visualPrompt || '';

    console.log(`\nEnhancing Slide 0 for Job: ${job.id} [${niche}]`);
    const enhanced = await enhanceVisualForSlideZero(topic, niche, initialSlideVisual);

    if (enhanced && enhanced.imageUrl) {
      if (!Array.isArray(job.slides) || job.slides.length === 0) {
        job.slides = [{ slideIndex: 0, text: job.scriptText || topic, visual: enhanced.enhancedPrompt }];
      }
      job.slides[0].imageUrl = enhanced.imageUrl;
      job.slides[0].imageProvider = enhanced.provider;
      job.slides[0].enhancedCtr = true;
      job.enhancedThumbnailUrl = enhanced.imageUrl;
      job.thumbnailModel = enhanced.model;
      job.stage = 'visual_enhancement';
      job.updatedAt = new Date().toISOString();
      enhancedCount++;
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(jobs, null, 2));
  console.log(`\n=== Visual Enhancement complete: ${enhancedCount}/${jobs.length} Slide 0 thumbnails enhanced with FLUX.1 ===\n`);
}

// Execute if run directly from CLI
if (require.main === module) {
  runVisualEnhancementQueue().catch(err => {
    console.error("Visual Enhancement Engine error:", err);
    process.exit(1);
  });
}

module.exports = {
  buildHighCtrFluxPrompt,
  generateFluxSchnellImage,
  generatePollinationsFluxImage,
  enhanceVisualForSlideZero,
  runVisualEnhancementQueue
};
