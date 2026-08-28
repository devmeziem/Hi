/**
 * 02 - Media Asset Engine
 * Initial / Primary: Cloudflare Workers AI for 1080x1920 SDXL/Flux visuals and Deepgram Aura-2 voice audio.
 * Fallbacks: Pollinations Flux Engine (LAST for images).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

console.log("=== VOXAM MEDIA ASSET ENGINE ===");
console.log(`Cloudflare Account ID: ${CLOUDFLARE_ACCOUNT_ID ? 'Configured (' + CLOUDFLARE_ACCOUNT_ID.slice(0, 6) + '...)' : 'MISSING (Will fallback to Pollinations/Edge)'}`);
console.log(`Cloudflare API Token:  ${CLOUDFLARE_API_TOKEN ? 'Configured (' + CLOUDFLARE_API_TOKEN.slice(0, 6) + '...)' : 'MISSING'}`);
console.log(`Cloudinary Cloud:      ${CLOUDINARY_CLOUD_NAME ? 'Configured (' + CLOUDINARY_CLOUD_NAME + ')' : 'MISSING'}`);
console.log("================================\n");

/**
 * Call Cloudflare Workers AI Image Generation (Primary - FIRST for Images)
 */
async function generateCloudflareAiImage(prompt) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.log("  [Cloudflare Image] Skipped: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not set.");
    return null;
  }

  const candidateModels = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/bytedance/stable-diffusion-xl-lightning',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ];

  for (const model of candidateModels) {
    try {
      const randomSeed = Math.floor(Math.random() * 99999999);
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, sharp focus`,
          num_steps: model.includes('lightning') ? 4 : model.includes('flux') ? 4 : 20,
          seed: randomSeed
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
            const buffer = Buffer.concat(chunks);
            if (res.statusCode === 200) {
              try {
                const json = JSON.parse(buffer.toString('utf8'));
                if (json.result?.image) {
                  console.log(`  ✔ [Cloudflare Image] Success via ${model} (JSON base64, seed: ${randomSeed})`);
                  resolve({
                    url: `data:image/jpeg;base64,${json.result.image}`,
                    provider: `Cloudflare Workers AI (${model})`
                  });
                  return;
                }
              } catch {}

              if (buffer.length > 1000) {
                console.log(`  ✔ [Cloudflare Image] Success via ${model} (raw binary, ${buffer.length} bytes, seed: ${randomSeed})`);
                resolve({
                  url: `data:image/jpeg;base64,${buffer.toString('base64')}`,
                  provider: `Cloudflare Workers AI (${model})`
                });
                return;
              }
            } else {
              console.log(`  ⚠ [Cloudflare Image] ${model} returned HTTP ${res.statusCode}: ${buffer.toString('utf8').slice(0, 150).replace(/\n/g, ' ')}`);
            }
            resolve(null);
          });
        });

        req.on('error', (e) => {
          console.log(`  ⚠ [Cloudflare Image] ${model} error: ${e.message}`);
          resolve(null);
        });
        req.on('timeout', () => {
          console.log(`  ⚠ [Cloudflare Image] ${model} timed out after 18s`);
          req.destroy();
          resolve(null);
        });
        req.write(postData);
        req.end();
      });

      if (res) return res;
    } catch (err) {
      console.log(`  ⚠ [Cloudflare Image] ${model} exception: ${err.message}`);
    }
  }
  return null;
}

/**
 * Call Cloudflare Workers AI Text-To-Speech (Primary - FIRST for TTS)
 */
async function generateCloudflareAiTTS(text) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.log("  [Cloudflare TTS] Skipped: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not set.");
    return null;
  }

  const candidateModels = [
    { model: '@cf/deepgram/aura-2-en', speaker: 'zeus' },
    { model: '@cf/deepgram/aura-2-en', speaker: 'orpheus' },
    { model: '@cf/deepgram/aura-2-en', speaker: 'helios' },
    { model: '@cf/deepgram/aura-2-en', speaker: 'arcas' },
    { model: '@cf/deepgram/aura-1', speaker: 'helios' }
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
          timeout: 14000
        }, (res) => {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (res.statusCode === 200) {
              try {
                const json = JSON.parse(buffer.toString('utf8'));
                if (json.result?.audio) {
                  const audioBuf = Buffer.from(json.result.audio, 'base64');
                  console.log(`  ✔ [Cloudflare TTS] Success via ${item.model} (${item.speaker})`);
                  resolve({
                    audioUrl: `data:audio/mpeg;base64,${json.result.audio}`,
                    byteLength: audioBuf.byteLength,
                    engine: `Cloudflare Workers AI (${item.model} - ${item.speaker})`
                  });
                  return;
                }
              } catch {}

              if (buffer.length > 500) {
                console.log(`  ✔ [Cloudflare TTS] Success via ${item.model} (${item.speaker}, ${buffer.length} bytes raw)`);
                resolve({
                  audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                  byteLength: buffer.byteLength,
                  engine: `Cloudflare Workers AI (${item.model} - ${item.speaker})`
                });
                return;
              }
            } else {
              console.log(`  ⚠ [Cloudflare TTS] ${item.model} (${item.speaker}) returned HTTP ${res.statusCode}: ${buffer.toString('utf8').slice(0, 150).replace(/\n/g, ' ')}`);
            }
            resolve(null);
          });
        });

        req.on('error', (e) => {
          console.log(`  ⚠ [Cloudflare TTS] ${item.model} error: ${e.message}`);
          resolve(null);
        });
        req.on('timeout', () => {
          console.log(`  ⚠ [Cloudflare TTS] ${item.model} timed out after 14s`);
          req.destroy();
          resolve(null);
        });
        req.write(postData);
        req.end();
      });

      if (res) return res;
    } catch (err) {
      console.log(`  ⚠ [Cloudflare TTS] ${item.model} exception: ${err.message}`);
    }
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
  // 1. Primary: Microsoft Edge TTS Studio Voice (Natural, authoritative baritone, no skipped words)
  const edge = await generateEdgeBassTTS(text);
  if (edge) return edge;

  // 2. Fallback: Cloudflare Deepgram
  const cf = await generateCloudflareAiTTS(text);
  if (cf) return cf;

  // 3. Last Resort Fallback
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
    console.log(`\nProcessing Job: ${job.id} [${job.channelId}] - "${job.title}"`);
    
    // Ensure slides array exists
    let slides = job.slides;
    if (!Array.isArray(slides) || slides.length === 0) {
      const promptText = job.visualPrompt || job.title || 'Cinematic 9:16 vertical workspace';
      slides = [
        {
          slideIndex: 0,
          text: job.scriptText || job.title,
          visual: promptText
        }
      ];
    }

    const processedSlides = [];
    console.log(`  -> Processing ${slides.length} slides for storyboard asset generation...`);

    for (let sIdx = 0; sIdx < slides.length; sIdx++) {
      const slide = slides[sIdx];
      const isSlideZero = sIdx === 0;
      let slidePrompt = slide.visual || job.visualPrompt || job.title;

      // [VISUAL ENHANCEMENT STEP]: Optimize Slide 0 with FLUX.1 High-CTR Style Engine
      if (isSlideZero) {
        console.log(`\n  ⭐ [FLUX.1 Visual Enhancement Step]: Synthesizing high-contrast CTR thumbnail for Slide 0...`);
        const niche = job.channelId || 'finance_saas';
        let styleMod = 'dark obsidian slate studio setting, emerald green hologram revenue chart, crisp dual currency ₦ and $, warm gold rim lighting, photorealistic, high contrast, sharp focus, 8k 9:16 vertical poster';
        if (niche.includes('stoic') || niche.includes('motivation')) {
          styleMod = 'ancient weathered Roman marble bust with intense gaze, dramatic chiaroscuro side lighting, warm golden-hour glow against dark void, deep shadows, 8k 9:16 vertical cinematic';
        } else if (niche.includes('tech') || niche.includes('ai')) {
          styleMod = 'futuristic cybernetic workstation, neon cyan and violet glow, glowing neural network nodes, ultra-sharp depth of field, 8k 9:16 vertical tech showcase';
        }
        slidePrompt = `${slidePrompt}, ${styleMod}, saturated focal points, zero blur, YouTube Shorts high-CTR viral opening frame`;
      }

      console.log(`\n  [Slide ${sIdx + 1}/${slides.length}] Visual Prompt: "${slidePrompt.slice(0, 70)}..."`);

      let slideImageUrl = null;
      let slideImageProvider = 'Pollinations Flux';

      // 1. Primary: Cloudflare Workers AI FLUX.1 / SDXL
      try {
        const cfImg = await generateCloudflareAiImage(slidePrompt);
        if (cfImg) {
          slideImageUrl = cfImg.url;
          slideImageProvider = isSlideZero ? `FLUX.1 Visual Enhancement (${cfImg.provider})` : cfImg.provider;
          console.log(`    ✔ [Slide ${sIdx + 1} Image] ${slideImageProvider}`);
        }
      } catch (err) {
        console.warn(`    ⚠ [Slide ${sIdx + 1} Image] Cloudflare AI notice: ${err.message}`);
      }

      // 2. Fallback: Pollinations AI Flux Engine
      if (!slideImageUrl) {
        const slideSeed = Math.floor(Math.random() * 99999999);
        const encodedPrompt = encodeURIComponent(slidePrompt + ' 8k ultra-hd cinematic photorealistic vertical 9:16');
        slideImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1920&nologo=true&model=flux&seed=${slideSeed}&n=${Date.now() + sIdx}`;
        slideImageProvider = isSlideZero ? `FLUX.1 Visual Enhancement (Pollinations Engine)` : `Pollinations Flux (seed: ${slideSeed})`;
        console.log(`    ✔ [Slide ${sIdx + 1} Image Fallback] ${slideImageProvider}`);
      }

      // 3. Voice Synthesis for Slide Text
      const slideNarration = slide.text || slide.narration || job.scriptText || job.title;
      let slideAudioUrl = null;
      let slideAudioEngine = 'Multi-Tier Voice Engine';
      let slideAudioBytes = 0;

      try {
        const ttsData = await synthesizeVoiceWithHierarchy(slideNarration);
        if (ttsData && ttsData.audioUrl) {
          slideAudioUrl = ttsData.audioUrl;
          slideAudioBytes = ttsData.byteLength || 0;
          slideAudioEngine = ttsData.engine || 'Cloudflare Deepgram Aura-2';
          console.log(`    ✔ [Slide ${sIdx + 1} Voice] ${slideAudioEngine} (${slideAudioBytes.toLocaleString()} bytes)`);
        }
      } catch (err) {
        console.warn(`    ⚠ [Slide ${sIdx + 1} Voice] Synthesis notice: ${err.message}`);
      }

      processedSlides.push({
        slideIndex: sIdx,
        text: slideNarration,
        scriptText: slideNarration,
        voiceoverTts: slideNarration,
        visualPrompt: slidePrompt,
        imageUrl: slideImageUrl,
        imageProvider: slideImageProvider,
        audioUrl: slideAudioUrl,
        audioEngine: slideAudioEngine,
        audioByteLength: slideAudioBytes,
        durationSeconds: 6.0
      });
    }

    job.slides = processedSlides;
    job.generatedImageUrl = processedSlides[0]?.imageUrl || null;
    job.imageProvider = processedSlides[0]?.imageProvider || 'Pollinations Flux';
    job.audioUrl = processedSlides[0]?.audioUrl || null;
    job.audioEngine = processedSlides[0]?.audioEngine || 'Multi-Tier Voice Engine';
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

