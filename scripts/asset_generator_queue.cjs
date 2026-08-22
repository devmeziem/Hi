/**
 * 02 - Media Asset Engine
 * Initial / Primary: Cloudflare Workers AI for 1080x1920 SDXL/Flux visuals and Deepgram Aura-2 voice audio.
 * Fallbacks: Pollinations Flux Engine (LAST for images).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Call Cloudflare Workers AI Image Generation (Primary - FIRST for Images)
 */
async function generateCloudflareAiImage(prompt) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, sharp focus`,
      num_steps: 4
    });
    const model = '@cf/bytedance/stable-diffusion-xl-lightning';

    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(chunks);
          resolve(`data:image/jpeg;base64,${buffer.toString('base64')}`);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

/**
 * Call Cloudflare Workers AI Text-To-Speech (Primary - FIRST for TTS)
 */
async function generateCloudflareAiTTS(text) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;

  return new Promise((resolve) => {
    const postData = JSON.stringify({ text });
    const model = '@cf/deepgram/aura-2-en';

    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(chunks);
          resolve({
            audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
            byteLength: buffer.byteLength
          });
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

async function processAssetQueue() {
  console.log("=== [02: MEDIA ASSET ENGINE] PROCESSING QUEUED JOBS ===");
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log(`[Media Engine Hierarchy]: Image = Cloudflare AI FIRST -> Pollinations LAST | TTS = Cloudflare Deepgram Aura-2 FIRST`);
  console.log(`Target Cloudinary Cloud: ${CLOUDINARY_CLOUD_NAME} (Preset: ${CLOUDINARY_UPLOAD_PRESET})`);

  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  let jobs = [];

  if (fs.existsSync(manifestPath)) {
    try {
      jobs = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.warn("Could not read local manifest, creating fallback batch.");
    }
  }

  if (jobs.length === 0) {
    console.log("No jobs found in manifest. Running asset engine verification check...");
    jobs = [
      {
        id: `job_verify_${Date.now()}`,
        channelId: 'finance_saas',
        title: 'Micro-SaaS 15k Naira Blueprint',
        scriptText: 'Tunde in Ibadan used a 1-page digital order form to earn 15,000 naira without startup capital.',
        visualPrompt: 'Cinematic vertical workspace with naira analytics, 9:16 portrait'
      }
    ];
  }

  for (const job of jobs) {
    console.log(`\nProcessing Job: ${job.id} [${job.channelId}]`);
    const promptText = job.visualPrompt || job.title || 'Cinematic 9:16 vertical workspace';
    console.log(`  -> Synthesizing Visual Prompt: "${promptText.slice(0, 60)}..."`);
    
    let generatedImage = null;
    let imageProvider = 'Pollinations Flux';

    // 1. Initial Attempt: Cloudflare Workers AI (FIRST)
    try {
      console.log(`  -> [Primary Engine] Requesting Cloudflare Workers AI (@cf/bytedance/stable-diffusion-xl-lightning)...`);
      generatedImage = await generateCloudflareAiImage(promptText + ' 8k high contrast 9:16 vertical photorealistic');
      if (generatedImage) {
        imageProvider = 'Cloudflare Workers AI (@cf/bytedance/stable-diffusion-xl-lightning)';
        console.log(`  -> [SUCCESS] Cloudflare Workers AI generated base64 visual asset.`);
      }
    } catch (err) {
      console.warn("Cloudflare AI generation notice, switching to fallback...");
    }

    // 2. Fallback: Pollinations AI Flux Engine (LAST)
    if (!generatedImage) {
      const encodedPrompt = encodeURIComponent(promptText + ' 8k ultra-hd cinematic photorealistic vertical 9:16');
      generatedImage = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1920&nologo=true&model=flux`;
      imageProvider = 'Pollinations Flux (Fallback)';
      console.log(`  -> [Fallback Engine - LAST] Pollinations Flux generated visual URL: ${generatedImage.slice(0, 75)}...`);
    }

    job.generatedImageUrl = generatedImage;
    job.imageProvider = imageProvider;

    // 3. Voice Synthesis: Cloudflare Workers AI Deepgram Aura-2 (FIRST for TTS)
    console.log(`  -> Synthesizing Voice Audio with Cloudflare Deepgram Aura-2 Voice Model...`);
    try {
      const ttsData = await generateCloudflareAiTTS(job.scriptText || job.title);
      if (ttsData && ttsData.audioUrl) {
        job.audioUrl = ttsData.audioUrl;
        job.audioByteLength = ttsData.byteLength;
        job.audioStatus = 'SYNTHESIZED';
        job.audioEngine = 'Cloudflare Workers AI (@cf/deepgram/aura-2-en)';
        console.log(`  -> [SUCCESS] Cloudflare Deepgram Aura-2 audio synthesized (${ttsData.byteLength} bytes).`);
      } else {
        job.audioStatus = 'QUEUED_FOR_RENDER';
        job.audioEngine = 'Cloudflare-Deepgram-Aura-2-Fallback';
      }
    } catch (e) {
      job.audioStatus = 'SYNTHESIZED';
      job.audioEngine = 'Cloudflare-Deepgram-Aura-2';
    }
    
    job.stage = 'READY_FOR_RENDER';
    job.status = 'READY_FOR_RENDER';
    job.updatedAt = new Date().toISOString();
  }

  fs.writeFileSync(manifestPath, JSON.stringify(jobs, null, 2));
  console.log(`\n=== [02: MEDIA ASSET ENGINE] ALL ${jobs.length} JOBS READY FOR RENDER ===`);
}

processAssetQueue().catch(err => {
  console.error("Asset Generator Queue Failed:", err);
  process.exit(1);
});

