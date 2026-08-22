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

  const candidateModels = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/bytedance/stable-diffusion-xl-lightning',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ];

  for (const model of candidateModels) {
    try {
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, sharp focus`,
          num_steps: model.includes('lightning') ? 4 : model.includes('flux') ? 8 : 20
        });

        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 18000
        }, (res) => {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              const buffer = Buffer.concat(chunks);
              if (buffer.length > 500) {
                resolve(`data:image/jpeg;base64,${buffer.toString('base64')}`);
                return;
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

      if (res) return res;
    } catch {}
  }
  return null;
}

/**
 * Call Cloudflare Workers AI Text-To-Speech (Primary - FIRST for TTS)
 */
async function generateCloudflareAiTTS(text) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;

  const candidateModels = [
    { model: '@cf/deepgram/aura-2-en', speaker: 'aura-helios-en' },
    { model: '@cf/deepgram/aura-2-en', speaker: 'aura-zeus-en' },
    { model: '@cf/deepgram/aura-2-en', speaker: 'aura-orpheus-en' }
  ];

  for (const item of candidateModels) {
    try {
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({ text, speaker: item.speaker });
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${item.model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 12000
        }, (res) => {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              const buffer = Buffer.concat(chunks);
              if (buffer.length > 500) {
                resolve({
                  audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                  byteLength: buffer.byteLength,
                  engine: `Cloudflare Workers AI (@cf/deepgram/aura-2-en - ${item.speaker})`
                });
                return;
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

      if (res) return res;
    } catch {}
  }
  return null;
}

/**
 * Microsoft Edge TTS Deep Resonant Bass Fallback (Second Fallback)
 */
async function generateEdgeBassTTS(text) {
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const voices = ['en-US-ChristopherNeural', 'en-US-GuyNeural', 'en-US-EricNeural'];
    for (const voice of voices) {
      try {
        const tempAudio = path.join(process.cwd(), `queue_bass_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        const tts = new EdgeTTS({
          voice: voice,
          lang: 'en-US',
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
          pitch: '-8Hz',
          rate: '-4%'
        });
        await tts.ttsPromise(text, tempAudio);
        if (fs.existsSync(tempAudio)) {
          const buffer = fs.readFileSync(tempAudio);
          try { fs.unlinkSync(tempAudio); } catch {}
          if (buffer.length > 1000) {
            return {
              audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
              byteLength: buffer.byteLength,
              engine: `Microsoft Edge TTS Deep Bass (${voice})`
            };
          }
        }
      } catch {}
    }
  } catch {}
  return null;
}

/**
 * Feminine Voice Fallback (Last Resort)
 */
async function generateLastResortFeminineTTS(text) {
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tempAudio = path.join(process.cwd(), `queue_fem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
    const tts = new EdgeTTS({
      voice: 'en-US-JennyNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
    });
    await tts.ttsPromise(text, tempAudio);
    if (fs.existsSync(tempAudio)) {
      const buffer = fs.readFileSync(tempAudio);
      try { fs.unlinkSync(tempAudio); } catch {}
      if (buffer.length > 1000) {
        return {
          audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
          byteLength: buffer.byteLength,
          engine: 'Microsoft Edge Jenny (Last Resort Fallback)'
        };
      }
    }
  } catch {}
  return null;
}

async function synthesizeVoiceWithHierarchy(text) {
  const cf = await generateCloudflareAiTTS(text);
  if (cf) return cf;

  const edge = await generateEdgeBassTTS(text);
  if (edge) return edge;

  const fem = await generateLastResortFeminineTTS(text);
  if (fem) return fem;

  return null;
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

    // 3. Voice Synthesis: Cloudflare Aura-2 -> Edge Bass -> Feminine Last
    console.log(`  -> Synthesizing Voice Audio with Multi-Tier Voiceover Engine...`);
    try {
      const ttsData = await synthesizeVoiceWithHierarchy(job.scriptText || job.title);
      if (ttsData && ttsData.audioUrl) {
        job.audioUrl = ttsData.audioUrl;
        job.audioByteLength = ttsData.byteLength;
        job.audioStatus = 'SYNTHESIZED';
        job.audioEngine = ttsData.engine || 'Multi-Tier Voice Engine';
        console.log(`  -> [SUCCESS] Voiceover synthesized (${ttsData.byteLength} bytes, ${job.audioEngine}).`);
      } else {
        job.audioStatus = 'QUEUED_FOR_RENDER';
        job.audioEngine = 'Edge-Bass-Fallback';
      }
    } catch (e) {
      job.audioStatus = 'QUEUED_FOR_RENDER';
      job.audioEngine = 'Edge-Bass-Fallback';
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

