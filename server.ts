import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Embedded System API Keys (supporting primary & secondary candidate keys with automatic failover)
const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2,
  process.env.GROK_KEY
].filter(Boolean) as string[]));

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

/**
 * Server-Side Grok (xAI) Caller with Multi-Token & Multi-Model Auto-Fallback
 */
async function serverCallGrok(prompt: string, systemPrompt?: string, customKey?: string): Promise<{ content: string; keyUsed: string } | null> {
  const candidateKeys = Array.from(new Set([
    customKey,
    ...XAI_API_KEYS
  ].filter(Boolean) as string[]));

  const candidateModels = [
    'grok-4.3',
    'grok-4.6',
    'grok-4.5',
    'grok-4.1-fast',
    'grok-4',
    'grok-3',
    'grok-2-latest',
    'grok-2-1212',
    'grok-2',
    'grok-beta'
  ];

  for (let i = 0; i < candidateKeys.length; i++) {
    const key = candidateKeys[i];
    const masked = key.slice(0, 8) + '...' + key.slice(-4);

    for (const model of candidateModels) {
      try {
        const result = await new Promise<string | null>((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt || 'You are an expert AI automated content producer.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1800
          });

          const req = https.request('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.message?.content;
                  resolve(content || null);
                } catch {
                  resolve(null);
                }
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

        if (result) {
          console.log(`[Grok Caller]: Successfully generated response using Grok Token #${i + 1} (${masked}) with '${model}'`);
          return { content: result, keyUsed: `Grok (${model})` };
        }
      } catch (e: any) {
        console.warn(`[Grok Caller]: Attempt with key #${i + 1} threw error:`, e.message);
      }
    }
  }

  return null;
}

/**
 * Robust JSON Extractor from LLM raw text
 */
function extractFirstJson(str: string): any {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          const jsonSub = str.substring(start, i + 1);
          try {
            return JSON.parse(jsonSub);
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Server-Side Cloudflare Workers AI LLM Caller (Llama 3.3 / Llama 3.1 Instruct)
 */
async function serverCallCloudflareLLM(prompt: string, systemPrompt?: string, customAccountId?: string, customApiToken?: string): Promise<string | null> {
  const accountId = customAccountId || CLOUDFLARE_ACCOUNT_ID;
  const apiToken = customApiToken || CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;

  const candidateModels = [
    '@cf/meta/llama-3.3-70b-instruct',
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3-8b-instruct'
  ];

  for (const model of candidateModels) {
    try {
      const fullPrompt = `${systemPrompt || 'You are an expert YouTube Shorts creator.'}\n\nTask: ${prompt}\n\nStrict Raw JSON Response:`;
      const postData = JSON.stringify({
        prompt: fullPrompt,
        max_tokens: 1200
      });

      const res = await new Promise<string | null>((resolve) => {
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 18000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const result = json.result?.response || json.response;
              resolve(result || null);
            } catch {
              resolve(null);
            }
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
 * Server-Side Groq Caller (with Verified Active Groq Models)
 */
async function serverCallGroq(prompt: string, systemPrompt?: string): Promise<string | null> {
  const candidateModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'deepseek-r1-distill-llama-70b',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ];

  for (const model of candidateModels) {
    try {
      const result = await new Promise<string | null>((resolve) => {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt || 'You are an expert AI content generator.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1200
        });

        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 12000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.message?.content;
                resolve(content || null);
              } catch {
                resolve(null);
              }
            } else {
              console.warn(`[Groq Caller]: Model '${model}' failed with status ${res.statusCode}: ${data.slice(0, 100)}`);
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (result) {
        console.log(`[Groq Caller]: Successfully generated response using model '${model}'`);
        return result;
      }
    } catch {
      // Try next candidate model
    }
  }

  return null;
}

/**
 * Server-Side FLUX.1 Visual Enhancement Engine (High-CTR Shorts Thumbnail Specialist)
 */
async function serverGenerateFluxVisualEnhancement(
  topic: string,
  niche: string = 'finance_saas',
  baseVisual: string = '',
  customAccountId?: string,
  customApiToken?: string
): Promise<{ imageUrl: string; enhancedPrompt: string; model: string; provider: string } | null> {
  const cleanTopic = (topic || 'High Impact Opportunity').replace(/[#"]/g, '').trim();

  let styleModifier = '';
  if (niche.includes('finance') || niche.includes('saas') || niche.includes('wealth')) {
    styleModifier = 'dark obsidian slate studio setting, vibrant emerald green hologram revenue chart, crisp dual currency ₦ and $ floating glass coins, warm gold volumetric rim lighting, photorealistic hands holding sleek smartphone with positive cashflow dashboard, high contrast, sharp focus, 8k 9:16 vertical poster';
  } else if (niche.includes('stoic') || niche.includes('motivation') || niche.includes('mindset')) {
    styleModifier = 'ancient weathered Roman marble bust of Marcus Aurelius with intense gaze, dramatic chiaroscuro side lighting, warm amber golden-hour glow against pitch black void, anamorphic 35mm lens blur, hyperdetailed stone textures, deep shadows, 8k 9:16 vertical cinematic masterpiece';
  } else {
    styleModifier = 'futuristic cybernetic workstation, neon cyan and electric violet edge glow, glowing AI neural network nodes floating in air, dark glass terminal displaying clean automated code, ultra-sharp depth of field, 8k 9:16 vertical tech showcase';
  }

  const promptCore = baseVisual && baseVisual.length > 10 ? baseVisual : cleanTopic;
  const enhancedPrompt = `${promptCore}, ${styleModifier}, high contrast, saturated focal points, zero blur, professional YouTube Shorts viral thumbnail, 1080x1920`;

  // 1. Try Cloudflare Workers AI FLUX.1 Schnell
  const cfImage = await serverGenerateCloudflareImage(enhancedPrompt, customAccountId, customApiToken);
  if (cfImage) {
    return {
      imageUrl: cfImage,
      enhancedPrompt,
      model: 'FLUX.1-schnell (Black Forest Labs)',
      provider: 'Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)'
    };
  }

  // 2. Pollinations FLUX.1 Fallback
  const seed = Math.floor(Math.random() * 99999999);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt.slice(0, 260))}?width=1080&height=1920&nologo=true&model=flux&seed=${seed}`;
  return {
    imageUrl: pollinationsUrl,
    enhancedPrompt,
    model: 'FLUX.1 (Black Forest Labs)',
    provider: 'Pollinations FLUX.1 Engine'
  };
}

/**
 * Server-Side Cloudflare Workers AI Image Generation (@cf/black-forest-labs/flux-1-schnell FIRST, then SDXL-Lightning)
 */
async function serverGenerateCloudflareImage(prompt: string, customAccountId?: string, customApiToken?: string): Promise<string | null> {
  const accountId = customAccountId || CLOUDFLARE_ACCOUNT_ID;
  const apiToken = customApiToken || CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;

  const candidateModels = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/bytedance/stable-diffusion-xl-lightning',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ];

  for (const model of candidateModels) {
    try {
      const postData = JSON.stringify({
        prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, sharp focus`
      });

      const res = await new Promise<string | null>((resolve) => {
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 25000
        }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              const buffer = Buffer.concat(chunks);
              try {
                const json = JSON.parse(buffer.toString('utf8'));
                if (json.result?.image) {
                  resolve(`data:image/jpeg;base64,${json.result.image}`);
                  return;
                }
              } catch {
                // Raw binary image fallback
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
 * Server-Side Edge Neural TTS Fallback (en-US-ChristopherNeural / en-US-GuyNeural / en-US-BrianNeural)
 * Christopher / Guy: Deep resonant masculine authority tone with optimal +5% pacing
 */
async function serverGenerateEdgeTTS(text: string, voice = 'en-US-ChristopherNeural'): Promise<{ audio: string; byteLength: number } | null> {
  try {
    const { EdgeTTS } = await import('node-edge-tts');
    const edge = new EdgeTTS({
      voice: voice,
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: '+0Hz',
      rate: voice.includes('Guy') ? '+4%' : '+2%'
    });
    const tempAudioPath = path.join(process.cwd(), `temp_tts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp3`);
    await edge.ttsPromise(text, tempAudioPath);
    if (fs.existsSync(tempAudioPath)) {
      try {
        const tempTrim = tempAudioPath.replace(/\.mp3$/, '_trim.mp3');
        const { execSync } = await import('child_process');
        execSync(`ffmpeg -y -i "${tempAudioPath}" -af "silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-40dB,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-40dB" -b:a 192k "${tempTrim}" 2>/dev/null`);
        if (fs.existsSync(tempTrim) && fs.statSync(tempTrim).size > 500) {
          fs.renameSync(tempTrim, tempAudioPath);
        }
      } catch {}
      const buffer = fs.readFileSync(tempAudioPath);
      try { fs.unlinkSync(tempAudioPath); } catch {}
      return {
        audio: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
        byteLength: buffer.byteLength
      };
    }
  } catch (err: any) {
    console.warn('[Edge TTS Fallback]: Generation error:', err.message);
  }
  return null;
}

/**
 * Server-Side Cloudflare Workers AI Text-To-Speech
 * FIRST: Deepgram Aura-2 English with deep masculine speaker 'zeus' or 'orpheus'
 * FALLBACK: Microsoft Edge Neural TTS (en-US-ChristopherNeural / GuyNeural)
 */
async function serverGenerateCloudflareTTS(text: string, requestedSpeaker = 'zeus', voiceEngine?: string, customAccountId?: string, customApiToken?: string): Promise<{ audio: string; byteLength: number; provider: string } | null> {
  // If user explicitly asks for Edge TTS
  if (voiceEngine === 'edge' || voiceEngine === 'christopher' || voiceEngine === 'guy') {
    const edgeVoice = voiceEngine === 'guy' ? 'en-US-GuyNeural' : 'en-US-ChristopherNeural';
    const edgeRes = await serverGenerateEdgeTTS(text, edgeVoice);
    if (edgeRes) return { ...edgeRes, provider: `Microsoft Edge Neural (${edgeVoice})` };
  }

  const accountId = customAccountId || CLOUDFLARE_ACCOUNT_ID;
  const apiToken = customApiToken || CLOUDFLARE_API_TOKEN;

  if (accountId && apiToken) {
    // 1. Try Cloudflare Workers AI Deepgram Aura-2
    const validSpeaker = ['zeus', 'orpheus', 'arcas', 'aries', 'apollo', 'hyperion', 'jupiter', 'saturn', 'neptune', 'asteria', 'hera', 'athena'].includes(requestedSpeaker)
      ? requestedSpeaker
      : 'zeus';

    const cfResult = await new Promise<{ audio: string; byteLength: number } | null>((resolve) => {
      const postData = JSON.stringify({
        text,
        speaker: validSpeaker
      });
      const model = '@cf/deepgram/aura-2-en';

      const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            const buffer = Buffer.concat(chunks);
            const base64 = buffer.toString('base64');
            resolve({
              audio: `data:audio/mpeg;base64,${base64}`,
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

    if (cfResult) {
      return { ...cfResult, provider: `Cloudflare Deepgram Aura-2 (${validSpeaker.toUpperCase()} Bass Wise)` };
    }
  }

  // 2. Automatic Fallback to Microsoft Edge Neural TTS (Deep masculine authority)
  console.log('[TTS Server]: Cloudflare TTS fallback -> Engaging Microsoft Edge Neural TTS (en-US-ChristopherNeural)...');
  const edgeResult = await serverGenerateEdgeTTS(text, 'en-US-ChristopherNeural');
  if (edgeResult) {
    return { ...edgeResult, provider: 'Microsoft Edge Neural TTS (en-US-ChristopherNeural Deep Bass)' };
  }

  return null;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url?.split('?')[0] || '/';

  // 1. HIGH-LEVEL ORCHESTRATION: Server-side Unified Blueprint Generator (Grok 1st -> Cloudflare AI Backup -> Groq -> Gemini -> Fallback)
  if (urlPath === '/api/generate-blueprint' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { niche = 'finance_saas', topic = 'Low-Capital High-Demand Side Hustles', format = 'side_hustle' } = JSON.parse(body || '{}');

        const channelMap: Record<string, string> = {
          'finance_saas': 'Fin Blueprint',
          'motivation_stoicism': 'The Stoic Architect',
          'tech_ai': 'Godswill Isaac'
        };
        const channelName = channelMap[niche] || 'Fin Blueprint';

        const systemPrompt = `You are a world-class professional YouTube Shorts scriptwriter and producer for "${channelName}".
STRICT YOUTUBE TOS ALIGNMENT: Strictly educational, truthful, zero get-rich-quick claims, realistic financial metrics, professional and engaging tone.

MANDATORY 5 TO 6 SCENE STORYBOARD STRUCTURE:
You MUST generate exactly 5 to 6 sequential storyboard slides:
- Slide 1 (Greeting & Topic Hook): MUST start with: "Hello, welcome to ${channelName}! Today we'll be discussing on how to [clear topic hook]..." (12-16 words)
- Slide 2 (Foundation / Core Problem / Economic Context): Define the real barrier, inflation reality, or foundation clearly without fluff. (12-15 words)
- Slide 3 (Actionable Step 1 / Practical Framework): Concrete step, framework, or operational mechanism. (12-15 words)
- Slide 4 (Actionable Step 2 / Real Case Example): Second practical step, Option A vs Option B breakdown, or realistic case implementation. (12-15 words)
- Slide 5 (Discipline / Golden Rule / Crucial Pitfall): Core money habit or critical mistake to avoid. (12-15 words)
- Slide 6 (Engaging Conclusion / Community Poll / Takeaway): If news, ask Option A vs B poll question. If blueprint/hustle, key takeaway + "link in bio for full starter blueprint". (10-14 words)

VISUAL PROMPT DIRECTIVE:
Every single slide (all 5-6) MUST have a unique, photorealistic, 9:16 vertical, 8k luxury studio image prompt meticulously describing the setting, camera angle, subject, lighting, and exact props matching that scene.

Respond STRICTLY with valid raw JSON without markdown:
{
  "title": "High CTR Professional Title",
  "description": "Engaging description with verified insights, community question, and hashtags",
  "tags": ["#Shorts", "#Finance", "#Business", "#SideHustle", "#WealthCreation"],
  "slides": [
    {
      "text": "Hello, welcome to ${channelName}! Today we'll be discussing...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    },
    {
      "text": "Slide 2 text...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    },
    {
      "text": "Slide 3 text...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    },
    {
      "text": "Slide 4 text...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    },
    {
      "text": "Slide 5 text...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    },
    {
      "text": "Slide 6 text...",
      "visual": "Photorealistic 9:16 vertical scene depicting..."
    }
  ]
}`;

        let outputText: string | null = null;
        let modelUsed = 'Grok 2 (xAI)';

        // 1. Grok 2 (xAI) - FIRST for Analysis & Creation
        console.log(`[API Server]: Generating 5-6 Slide Professional Blueprint via Grok 2 (xAI) for "${topic}" (${channelName})...`);
        const grokResult = await serverCallGrok(`Generate a complete 5 to 6 slide professional YouTube Shorts script for topic: "${topic}" on channel "${channelName}". Ensure professional greeting and TOS compliance.`, systemPrompt);
        if (grokResult) {
          outputText = grokResult.content;
          modelUsed = grokResult.keyUsed;
        }

        // 2. Cloudflare Workers AI - BACKUP
        if (!outputText) {
          console.log(`[API Server]: Grok fallback -> Calling Cloudflare Workers AI (@cf/meta/llama-3.3-70b-instruct)...`);
          outputText = await serverCallCloudflareLLM(`Generate a complete 5 to 6 slide professional YouTube Shorts script for topic: "${topic}" on channel "${channelName}". Ensure professional greeting and TOS compliance.`, systemPrompt);
          if (outputText) modelUsed = 'Cloudflare Workers AI (Llama 3.3)';
        }

        // 3. Groq - SECONDARY
        if (!outputText) {
          console.log(`[API Server]: Cloudflare AI fallback -> Calling Groq (GPT-OSS 120B / Llama 4 Scout / DeepSeek R1)...`);
          outputText = await serverCallGroq(`Generate a complete 5 to 6 slide professional YouTube Shorts script for topic: "${topic}" on channel "${channelName}". Ensure professional greeting and TOS compliance.`, systemPrompt);
          if (outputText) modelUsed = 'Groq (Flagship Open-Weight Engine)';
        }

        let parsed: any = null;
        if (outputText) {
          try {
            const clean = outputText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            parsed = JSON.parse(clean);
          } catch {
            // Keep parsed null to trigger deterministic
          }
        }

        if (!parsed || !parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length < 4) {
          console.error(`[API Server] FATAL: AI Blueprint Generation Failed. Fallbacks are disabled.`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: `[FATAL AI ERROR] Failed to generate dynamic script using AI providers (Grok, Cloudflare, Groq). Deterministic fallback scripts have been removed. Please verify your AI API keys.`,
            rawOutput: outputText || 'No response received from AI models'
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...parsed,
          modelUsed,
          generatedAt: new Date().toISOString()
        }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Blueprint Generation Failed' }));
      }
    });
    return;
  }

  // 2. IMAGE GENERATION ENDPOINT: Cloudflare Workers AI (FLUX.1-schnell FIRST) -> Pollinations (FALLBACK)
  if (urlPath === '/api/generate-image' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { prompt = 'Cinematic vertical workspace 8k', accountId, apiToken } = JSON.parse(body || '{}');

        // 1. Cloudflare Workers AI Flux-1-Schnell (FIRST)
        console.log(`[API Server]: Generating Image via Cloudflare Workers AI FLUX.1-schnell (FIRST)...`);
        let imageUrl = await serverGenerateCloudflareImage(prompt, accountId, apiToken);
        let provider = 'Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)';

        // 2. Pollinations AI (FALLBACK)
        if (!imageUrl) {
          console.log(`[API Server]: Cloudflare AI Image fallback -> Using Pollinations Flux (FALLBACK)...`);
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ' 8k vertical 9:16 cinematic luxury lighting')}`;
          provider = 'Pollinations Flux (Fallback)';
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ imageUrl, provider }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Image Generation Failed' }));
      }
    });
    return;
  }

  // 2.5 VISUAL ENHANCEMENT ENDPOINT: FLUX.1 Model specifically for High-CTR YouTube Shorts Opening Slide & Thumbnails
  if (urlPath === '/api/visual-enhancement' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { topic = '', niche = 'finance_saas', baseVisual = '', prompt = '', accountId, apiToken } = JSON.parse(body || '{}');

        const activeTopic = topic || prompt || 'High Impact Opportunity';
        console.log(`[API Server: Visual Enhancement]: Synthesizing FLUX.1 high-contrast CTR thumbnail for "${activeTopic}" (${niche})...`);

        const result = await serverGenerateFluxVisualEnhancement(activeTopic, niche, baseVisual || prompt, accountId, apiToken);

        if (result) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            imageUrl: result.imageUrl,
            enhancedPrompt: result.enhancedPrompt,
            model: result.model,
            provider: result.provider,
            stage: 'visual_enhancement',
            generatedAt: new Date().toISOString()
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'FLUX.1 Visual Enhancement synthesis failed across all providers.' }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Visual Enhancement Request Failed' }));
      }
    });
    return;
  }

  // 3. TTS VOICE GENERATION ENDPOINT: Cloudflare Workers AI Deepgram Aura-2 (Wise Bass: zeus / orpheus) & Edge Neural
  if (urlPath === '/api/generate-tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { text = 'Welcome to the automated 15k Naira Micro-SaaS blueprint.', speaker = 'zeus', voiceEngine, accountId, apiToken } = JSON.parse(body || '{}');

        console.log(`[API Server]: Generating Voice via Cloudflare Workers AI Deepgram Aura-2 (${speaker})...`);
        const ttsResult = await serverGenerateCloudflareTTS(text, speaker, voiceEngine, accountId, apiToken);

        if (ttsResult) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            audioUrl: ttsResult.audio,
            byteLength: ttsResult.byteLength,
            provider: ttsResult.provider || 'Cloudflare Deepgram Aura-2 / Edge Neural'
          }));
        } else {
          // Send fallback
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            audioUrl: null,
            provider: 'Server Voice Fallback'
          }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'TTS Generation Failed' }));
      }
    });
    return;
  }

  // API Proxy Endpoint for xAI Grok (with Multi-Key Failover)
  if (urlPath === '/api/xai' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const candidateKeys = Array.from(new Set([
          data.apiKey,
          data.customKey,
          ...XAI_API_KEYS
        ].filter(Boolean) as string[]));

        let lastResponseText = '';
        let lastStatus = 500;

        for (let i = 0; i < candidateKeys.length; i++) {
          const apiKey = candidateKeys[i];
          try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: data.model || 'grok-2-latest',
                messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello Grok' }],
                temperature: data.temperature ?? 0.7,
                max_tokens: data.max_tokens ?? 1024
              })
            });

            lastStatus = response.status;
            lastResponseText = await response.text();

            if (response.ok) {
              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(lastResponseText);
              return;
            }
          } catch (e: any) {
            lastResponseText = JSON.stringify({ error: e.message });
          }
        }

        res.writeHead(lastStatus, { 'Content-Type': 'application/json' });
        res.end(lastResponseText || JSON.stringify({ error: 'All Grok keys failed' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'xAI Request Failed' }));
      }
    });
    return;
  }

  // API Proxy Endpoint for Cloudflare Workers AI
  if (urlPath === '/api/cloudflare-ai' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const accountId = (data.accountId || CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
        const apiToken = (data.apiToken || CLOUDFLARE_API_TOKEN || '').trim();
        let requestedModel = (data.model || '@cf/black-forest-labs/flux-1-schnell').trim().replace(/^\//, '');

        if (!accountId || !apiToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Cloudflare Account ID and API Token are missing. Please configure them in Integration Keys or .env'
          }));
          return;
        }

        const candidateModels = [
          requestedModel,
          // LLM fallbacks if route not found
          ...(requestedModel.includes('llama') ? ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct'] : []),
          // Image fallbacks if route not found
          ...(requestedModel.includes('flux') ? ['@cf/bytedance/stable-diffusion-xl-lightning', '@cf/stabilityai/stable-diffusion-xl-base-1.0'] : [])
        ];

        let lastResponse: Response | null = null;
        let lastText = '';

        for (const model of candidateModels) {
          try {
            const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data.inputs || { prompt: data.prompt || 'Cyberpunk neon city 8k' })
            });

            lastResponse = response;
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('image/')) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                image: `data:${contentType};base64,${base64}`,
                result: { image: base64 },
                contentType,
                model
              }));
              return;
            }

            if (contentType.includes('audio/') || contentType.includes('octet-stream')) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const mime = contentType.includes('audio/') ? contentType : 'audio/mpeg';
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                audio: `data:${mime};base64,${base64}`,
                result: { audio: base64 },
                contentType: mime,
                byteLength: arrayBuffer.byteLength,
                model
              }));
              return;
            }

            lastText = await response.text();
            try {
              const json = JSON.parse(lastText);
              if (json.success !== false && (json.result || json.response)) {
                if (json.result?.image) {
                  json.image = `data:image/jpeg;base64,${json.result.image}`;
                }
                if (json.result?.audio) {
                  json.audio = `data:audio/mpeg;base64,${json.result.audio}`;
                }
                res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ...json, model }));
                return;
              }

              if (json.errors?.some((e: any) => e.message?.includes('No route') || e.code === 7003)) {
                continue;
              }
            } catch {
              if (response.ok) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: lastText, model }));
                return;
              }
            }
          } catch {
            continue;
          }
        }

        res.writeHead(lastResponse?.status || 500, { 'Content-Type': 'application/json' });
        res.end(lastText || JSON.stringify({ error: 'Cloudflare AI Model failed to respond' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Cloudflare AI Request Failed' }));
      }
    });
    return;
  }

  // API Proxy Endpoint for Groq
  if (urlPath === '/api/groq' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const apiKey = data.apiKey || GROQ_API_KEY;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: data.model || 'llama-3.3-70b-versatile',
            messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello Groq' }],
            temperature: data.temperature ?? 0.7,
            max_tokens: data.max_tokens ?? 1024
          })
        });

        const text = await response.text();
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(text);
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Groq Request Failed' }));
      }
    });
    return;
  }

  // API Proxy Endpoint for Gemini Server-Side Generation
  if (urlPath === '/api/gemini' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY environment variable is required' }));
          return;
        }

        const data = JSON.parse(body);
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: data.model || 'gemini-2.5-flash',
          contents: data.prompt,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: response.text }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      }
    });
    return;
  }

  // API Manifest Endpoint
  if (urlPath === '/api/manifest' && req.method === 'GET') {
    try {
      const manifestPath = path.join(__dirname, 'daily_blueprint_manifest.json');
      if (fs.existsSync(manifestPath)) {
        const data = fs.readFileSync(manifestPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('[]');
      }
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API Health Check
  if (urlPath === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Rendered Videos Static File Serving
  if (urlPath.startsWith('/rendered_videos/')) {
    const relativeVideoPath = urlPath.replace('/rendered_videos/', '');
    const videoDiskPath = path.join(__dirname, 'rendered_videos', relativeVideoPath);
    if (fs.existsSync(videoDiskPath) && !fs.statSync(videoDiskPath).isDirectory()) {
      const stat = fs.statSync(videoDiskPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(videoDiskPath).pipe(res);
      return;
    }
  }

  // Static file serving
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Voxam Factory Server running on port ${PORT}`);
});

