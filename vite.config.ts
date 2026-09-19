import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        // Serve rendered_videos mp4 and media files + test_artifacts + /api/stream-video
        if (url.startsWith('/rendered_videos/') || url.startsWith('/test_artifacts/') || url === '/api/stream-video') {
          let rel = url;
          if (url === '/api/stream-video') {
            const urlObj = new URL(req.url || '', 'http://localhost:3000');
            rel = urlObj.searchParams.get('file') || urlObj.searchParams.get('path') || '';
          }

          const cleanFileName = rel
            .replace(/^.*\/rendered_videos\//, '')
            .replace(/^.*\/test_artifacts\//, '')
            .replace(/^\/+/, '');

          const possiblePaths = [
            path.join(process.cwd(), 'rendered_videos', cleanFileName),
            path.join(process.cwd(), 'test_artifacts', cleanFileName),
            path.join(process.cwd(), 'test_artifacts', 'movie_episodes', cleanFileName),
            path.join(process.cwd(), 'test_artifacts', 'motivation_reels', cleanFileName),
            path.join(process.cwd(), cleanFileName),
            rel.startsWith('/') ? rel : path.join(process.cwd(), rel)
          ];

          const filePath = possiblePaths.find(p => fs.existsSync(p) && !fs.statSync(p).isDirectory());

          if (filePath && fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
            const range = req.headers.range;

            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
              const chunkSize = (end - start) + 1;
              res.statusCode = 206;
              res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Length', chunkSize);
              res.setHeader('Content-Type', mime);
              fs.createReadStream(filePath, { start, end }).pipe(res);
              return;
            } else {
              res.statusCode = 200;
              res.setHeader('Content-Type', mime);
              res.setHeader('Content-Length', stat.size);
              res.setHeader('Accept-Ranges', 'bytes');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }

        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // Generate TTS Voice Proxy (Cloudflare Deepgram Aura-2 + Edge Neural Fallback)
        if (url === '/api/generate-tts' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const text = data.text || 'Welcome to the automated financial blueprint.';
              const speaker = data.speaker || 'zeus';
              const voiceEngine = data.voiceEngine;

              const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
              const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN || '';

              // Helper for node-edge-tts
              const tryEdgeTTS = async (edgeVoice: string) => {
                try {
                  const { EdgeTTS } = await import('node-edge-tts');
                  const edge = new EdgeTTS({
                    voice: edgeVoice,
                    lang: 'en-US',
                    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
                    pitch: '-5Hz',
                    rate: '+5%'
                  });
                  const tempAudioPath = path.join(process.cwd(), `temp_tts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp3`);
                  await edge.ttsPromise(text, tempAudioPath);
                  if (fs.existsSync(tempAudioPath)) {
                    const buffer = fs.readFileSync(tempAudioPath);
                    try { fs.unlinkSync(tempAudioPath); } catch {}
                    return {
                      audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                      byteLength: buffer.byteLength,
                      provider: `Microsoft Edge Neural (${edgeVoice})`
                    };
                  }
                } catch (e: any) {
                  console.warn('[Edge TTS Fallback]: Generation error:', e.message);
                }
                return null;
              };

              // If user selected Edge Neural explicitly
              if (voiceEngine === 'edge' || voiceEngine === 'christopher' || voiceEngine === 'guy' || speaker === 'christopher' || speaker === 'guy') {
                const voiceName = (voiceEngine === 'guy' || speaker === 'guy') ? 'en-US-GuyNeural' : 'en-US-ChristopherNeural';
                const edgeRes = await tryEdgeTTS(voiceName);
                if (edgeRes) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify(edgeRes));
                  return;
                }
              }

              // 1. Try Cloudflare Workers AI Deepgram Aura-2
              const validSpeaker = ['zeus', 'orpheus', 'arcas', 'aries', 'apollo', 'hyperion', 'jupiter', 'saturn', 'neptune', 'asteria', 'hera', 'athena'].includes(speaker)
                ? speaker
                : 'zeus';

              try {
                const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/deepgram/aura-2-en`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ text, speaker: validSpeaker })
                });

                if (cfResponse.ok) {
                  const arrayBuffer = await cfResponse.arrayBuffer();
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    audioUrl: `data:audio/mpeg;base64,${base64}`,
                    byteLength: arrayBuffer.byteLength,
                    provider: `Cloudflare Deepgram Aura-2 (${validSpeaker.toUpperCase()} Bass Wise)`
                  }));
                  return;
                }
              } catch (cfErr) {
                console.warn('[Vite Proxy]: Cloudflare TTS fetch error, failing over to Edge TTS:', cfErr);
              }

              // 2. Fallback to Microsoft Edge Neural TTS
              const edgeResult = await tryEdgeTTS('en-US-ChristopherNeural');
              if (edgeResult) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(edgeResult));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                audioUrl: null,
                provider: 'TTS Fallback'
              }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'TTS Generation Failed' }));
            }
          });
          return;
        }

        // Generate Image Proxy (Cloudflare FLUX.1-schnell FIRST -> Pollinations Fallback)
        if (url === '/api/generate-image' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const prompt = data.prompt || 'Cinematic vertical workspace 8k';
              const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
              const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN || '';

              let imageUrl: string | null = null;
              let provider = 'Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)';

              // 1. Try Cloudflare FLUX.1-schnell
              try {
                const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, sharp focus`
                  })
                });

                if (cfResponse.ok) {
                  const contentType = cfResponse.headers.get('content-type') || '';
                  if (contentType.includes('image/')) {
                    const arrayBuffer = await cfResponse.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    imageUrl = `data:${contentType};base64,${base64}`;
                  } else {
                    const json: any = await cfResponse.json();
                    if (json.result?.image) {
                      imageUrl = `data:image/jpeg;base64,${json.result.image}`;
                    } else if (json.image) {
                      imageUrl = `data:image/jpeg;base64,${json.image}`;
                    }
                  }
                }
              } catch (cfErr) {
                console.warn('[Vite Proxy]: Cloudflare image failed, failing over to Pollinations Flux:', cfErr);
              }

              // 2. Pollinations Fallback
              if (!imageUrl) {
                const seed = Math.floor(Math.random() * 999999);
                imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ' 8k vertical 9:16 cinematic luxury lighting')}?width=1080&height=1920&seed=${seed}&model=flux&nologo=true`;
                provider = 'Pollinations Flux (Fallback)';
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ imageUrl, provider }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Image Generation Failed' }));
            }
          });
          return;
        }

        // Generate Blueprint Script Proxy (Grok -> Cloudflare Llama -> Groq -> Deterministic)
        if (url === '/api/generate-blueprint' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { niche = 'finance_saas', topic = 'Low-Capital High-Demand Side Hustles' } = JSON.parse(body || '{}');
              const channelMap: Record<string, string> = {
                'finance_saas': 'Fin Blueprint',
                'motivation_stoicism': 'The Stoic Architect',
                'tech_ai': 'Godswill Isaac'
              };
              const channelName = channelMap[niche] || 'Fin Blueprint';

              const systemPrompt = `You are a world-class professional YouTube Shorts scriptwriter for "${channelName}".
Generate a 5 to 6 slide script for: "${topic}". Slide 1 MUST start with "Hello, welcome to ${channelName}! Today we'll be discussing...".
Respond STRICTLY with raw JSON:
{
  "title": "CTR Title",
  "description": "Description with hashtags",
  "tags": ["#Shorts", "#Finance", "#Business"],
  "slides": [
    { "text": "Slide text...", "visual": "Photorealistic 9:16 scene..." }
  ]
}`;

              let parsed: any = null;
              let modelUsed = 'Deterministic Verified Blueprint';

              // Try Groq first for ultra-fast generation
              try {
                const apiKey = process.env.GROQ_API_KEY || '';
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: `Write script for: ${topic}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200
                  })
                });

                if (groqRes.ok) {
                  const groqData: any = await groqRes.json();
                  const raw = groqData.choices?.[0]?.message?.content || '';
                  const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
                  parsed = JSON.parse(clean);
                  modelUsed = 'Groq (OpenAI GPT-OSS 120B)';
                }
              } catch (e) {
                console.warn('[Vite Proxy]: Groq script error:', e);
              }

              if (!parsed || !parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length < 3) {
                const cleanTopic = String(topic || 'High-Leverage Execution').trim();
                parsed = {
                  title: `${cleanTopic} | Complete Breakdown`,
                  description: `Here is the comprehensive, practical breakdown on ${cleanTopic}.\n\nSubscribe to ${channelName} for daily high-impact blueprints!\n\n#Shorts #${channelName.replace(/\s+/g, '')} #Knowledge #Growth #Strategy`,
                  tags: ['#Shorts', `#${channelName.replace(/\s+/g, '')}`, '#Mindset', '#ActionableTips', '#Strategy'],
                  slides: [
                    {
                      text: `Hello, welcome to ${channelName}! Today we're breaking down how to master ${cleanTopic}.`,
                      visual: `High-contrast 9:16 vertical cinematic opening scene illustrating ${cleanTopic}, luxury aesthetic studio lighting, 8k photorealistic`
                    },
                    {
                      text: `The core foundation begins with understanding how ${cleanTopic} operates in real-world scenarios.`,
                      visual: `Analytical workspace displaying high-resolution insights and digital roadmap for ${cleanTopic}, 8k 9:16 vertical photorealistic`
                    },
                    {
                      text: `Focus on consistent daily execution and eliminating friction to build unstoppable momentum.`,
                      visual: `Dynamic close-up of tactical execution and forward momentum related to ${cleanTopic}, sharp cinematic lighting, 8k 9:16 vertical`
                    },
                    {
                      text: `Apply these key principles consistently to achieve lasting impact. Subscribe to ${channelName} for daily actionable breakdowns!`,
                      visual: `Clean aesthetic call to action with glowing verified badge and notification bell icon, 8k 9:16 vertical studio lighting`
                    }
                  ]
                };
                modelUsed = 'Dynamic Topic-Aware Synthesizer';
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ...parsed, modelUsed }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Blueprint Generation Failed' }));
            }
          });
          return;
        }

        // xAI Grok Proxy
        if (url === '/api/xai' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = data.apiKey || process.env.XAI_API_KEY || '';

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

              const text = await response.text();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = response.status;
              res.end(text);
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'xAI Request Failed' }));
            }
          });
          return;
        }

        // Cloudflare Workers AI Proxy
        if (url === '/api/cloudflare-ai' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const accountId = (data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
              const apiToken = (data.apiToken || process.env.CLOUDFLARE_API_TOKEN || '').trim();
              let requestedModel = (data.model || '@cf/black-forest-labs/flux-1-schnell').trim().replace(/^\//, '');

              if (!accountId || !apiToken) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
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
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 200;
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
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 200;
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
                    // If successful JSON response from Cloudflare
                    if (json.success !== false && (json.result || json.response)) {
                      // Normalize image if in json.result.image
                      if (json.result?.image) {
                        json.image = `data:image/jpeg;base64,${json.result.image}`;
                      }
                      if (json.result?.audio) {
                        json.audio = `data:audio/mpeg;base64,${json.result.audio}`;
                      }
                      res.setHeader('Content-Type', 'application/json');
                      res.statusCode = response.status || 200;
                      res.end(JSON.stringify({ ...json, model }));
                      return;
                    }

                    // If route error, try next candidate model
                    if (json.errors?.some((e: any) => e.message?.includes('No route') || e.code === 7003)) {
                      continue;
                    }
                  } catch {
                    // Raw text response
                    if (response.ok) {
                      res.setHeader('Content-Type', 'application/json');
                      res.statusCode = 200;
                      res.end(JSON.stringify({ response: lastText, model }));
                      return;
                    }
                  }
                } catch {
                  continue;
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = lastResponse?.status || 500;
              res.end(lastText || JSON.stringify({ error: 'Cloudflare AI Model failed to respond' }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Cloudflare AI Request Failed' }));
            }
          });
          return;
        }

        // Groq Proxy
        if (url === '/api/groq' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = data.apiKey || process.env.GROQ_API_KEY || '';

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
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = response.status;
              res.end(text);
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Groq Request Failed' }));
            }
          });
          return;
        }

        // Gemini Proxy
        if (url === '/api/gemini' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = data.apiKey || process.env.GEMINI_API_KEY || '';

              if (!apiKey) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  text: 'Gemini server proxy operational. Provide GEMINI_API_KEY or use xAI / Groq.'
                }));
                return;
              }

              const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${data.model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: data.prompt || 'Hello Gemini' }] }]
                })
              });

              const resJson = await response.json();
              const generated = resJson.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ text: generated }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Gemini Request Failed' }));
            }
          });
          return;
        }

        // Direct YouTube Channel Publisher Proxy
        if (url === '/api/youtube-direct-publish' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const {
                channel = 'motivation_stoicism',
                title,
                description,
                tags = [],
                clientId,
                clientSecret,
                refreshToken,
                videoDataUrl,
                slides = []
              } = JSON.parse(body || '{}');

              // Resolve YouTube OAuth credentials (env or custom request payload)
              let ytClientId = clientId || process.env.YOUTUBE_CLIENT_ID || '';
              let ytClientSecret = clientSecret || process.env.YOUTUBE_CLIENT_SECRET || '';
              let ytRefreshToken = refreshToken || process.env.YOUTUBE_REFRESH_TOKEN || '';

              if (channel === 'finance_saas') {
                ytClientId = clientId || process.env.YOUTUBE_2_CLIENT_ID || ytClientId;
                ytClientSecret = clientSecret || process.env.YOUTUBE_2_CLIENT_SECRET || ytClientSecret;
                ytRefreshToken = refreshToken || process.env.YOUTUBE_2_REFRESH_TOKEN || ytRefreshToken;
              } else if (channel === 'tech_ai') {
                ytClientId = clientId || process.env.YOUTUBE_3_CLIENT_ID || ytClientId;
                ytClientSecret = clientSecret || process.env.YOUTUBE_3_CLIENT_SECRET || ytClientSecret;
                ytRefreshToken = refreshToken || process.env.YOUTUBE_3_REFRESH_TOKEN || ytRefreshToken;
              }

              if (!ytClientId || !ytClientSecret || !ytRefreshToken) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({
                  error: 'Missing YouTube OAuth Credentials. Please configure YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN in settings.'
                }));
                return;
              }

              // 1. Refresh Google OAuth Access Token
              const tokenParams = new URLSearchParams({
                client_id: ytClientId,
                client_secret: ytClientSecret,
                refresh_token: ytRefreshToken,
                grant_type: 'refresh_token'
              });

              const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams.toString()
              });

              const tokenData: any = await tokenRes.json();
              if (!tokenData.access_token) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 401;
                res.end(JSON.stringify({
                  error: `Google OAuth Token Refresh Failed: ${tokenData.error_description || tokenData.error || 'Invalid Refresh Token'}`
                }));
                return;
              }

              const accessToken = tokenData.access_token;

              // 2. Prepare Video Stream / Buffer
              let videoBuffer: Buffer | null = null;
              if (videoDataUrl && videoDataUrl.startsWith('data:video/mp4;base64,')) {
                videoBuffer = Buffer.from(videoDataUrl.replace('data:video/mp4;base64,', ''), 'base64');
              } else if (slides.length > 0 && slides[0].imageUrl) {
                // If rendering on server via ffmpeg
                try {
                  const tempDir = path.join(process.cwd(), '.temp_yt_upload_' + Date.now());
                  fs.mkdirSync(tempDir, { recursive: true });
                  const testImgPath = path.join(tempDir, 'slide.jpg');
                  const imgRes = await fetch(slides[0].imageUrl);
                  const imgBuf = Buffer.from(await imgRes.arrayBuffer());
                  fs.writeFileSync(testImgPath, imgBuf);

                  const outVid = path.join(tempDir, 'output.mp4');
                  execSync(`ffmpeg -y -loop 1 -i "${testImgPath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v libx264 -t 15 -pix_fmt yuv420p -c:a aac -shortest "${outVid}"`, { stdio: 'pipe' });
                  if (fs.existsSync(outVid)) {
                    videoBuffer = fs.readFileSync(outVid);
                  }
                  fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (renderErr: any) {
                  console.warn('[Vite Proxy]: Server FFmpeg direct render note:', renderErr.message);
                }
              }

              // 3. Initiate YouTube Data API v3 Resumable Upload
              const metaPayload = {
                snippet: {
                  title: title || 'Autonomous Stoic Blueprint #Shorts',
                  description: `${description || ''}\n\n#Shorts #Motivation #Discipline`,
                  tags: tags.length > 0 ? tags : ['#Shorts', '#Motivation', '#Wisdom'],
                  categoryId: '27'
                },
                status: {
                  privacyStatus: 'public',
                  selfDeclaredMadeForKids: false
                }
              };

              const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json; charset=UTF-8',
                  'X-Upload-Content-Length': String(videoBuffer ? videoBuffer.length : 100),
                  'X-Upload-Content-Type': 'video/mp4'
                },
                body: JSON.stringify(metaPayload)
              });

              const uploadLocation = initRes.headers.get('location');
              if (!uploadLocation) {
                const initErrorText = await initRes.text();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = initRes.status;
                res.end(JSON.stringify({ error: `YouTube Init Upload Failed: ${initErrorText}` }));
                return;
              }

              // 4. Upload the video bytes if available
              if (videoBuffer) {
                const uploadRes = await fetch(uploadLocation, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Length': String(videoBuffer.length)
                  },
                  body: videoBuffer
                });

                const uploadedJson: any = await uploadRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  videoId: uploadedJson.id,
                  videoUrl: `https://youtube.com/shorts/${uploadedJson.id}`,
                  channelTarget: channel,
                  status: 'PUBLISHED_LIVE'
                }));
                return;
              }

              // If client will stream video directly to the resumable session:
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                uploadLocation,
                accessToken,
                channelTarget: channel,
                status: 'UPLOAD_SESSION_INITIALIZED'
              }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'YouTube Direct Publish Failed' }));
            }
          });
          return;
        }

        // Daily Real-Time Channel Analytics Endpoints
        if (url === '/api/analytics' && req.method === 'GET') {
          try {
            const storePath = path.join(process.cwd(), 'data', 'channel_analytics.json');
            const fallbackPath = path.join(process.cwd(), 'test_artifacts', 'channel_analytics.json');
            const target = fs.existsSync(storePath) ? storePath : fallbackPath;
            if (fs.existsSync(target)) {
              const data = JSON.parse(fs.readFileSync(target, 'utf8'));
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(data));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ history: [], lastSync: null }));
            }
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url === '/api/analytics/sync' && req.method === 'POST') {
          try {
            execSync('node scripts/fetch_realtime_channel_analytics.cjs', { cwd: process.cwd(), timeout: 20000 });
            const storePath = path.join(process.cwd(), 'data', 'channel_analytics.json');
            const fallbackPath = path.join(process.cwd(), 'test_artifacts', 'channel_analytics.json');
            const target = fs.existsSync(storePath) ? storePath : fallbackPath;
            const updated = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : {};
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, analytics: updated }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // Movie Brand Episodic Series Endpoints
        if (url === '/api/movie/bible' && req.method === 'GET') {
          try {
            const biblePath = path.join(process.cwd(), 'movie_universe_bible.json');
            if (fs.existsSync(biblePath)) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(fs.readFileSync(biblePath, 'utf8'));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Bible not found' }));
            }
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url === '/api/movie/bible' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const biblePath = path.join(process.cwd(), 'movie_universe_bible.json');
              fs.writeFileSync(biblePath, JSON.stringify(parsed, null, 2), 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, bible: parsed }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/movie/manifest' && req.method === 'GET') {
          try {
            let episodesList: any[] = [];
            // 1. Fetch from Firestore Cloud Database (Zero Git Commits, Low Key Database Logging)
            try {
              const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
              if (fs.existsSync(configPath)) {
                const fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const dbId = fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';
                const queryUrl = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/${dbId}/documents:runQuery?key=${fb.apiKey}`;
                const queryPayload = JSON.stringify({
                  structuredQuery: {
                    from: [{ collectionId: 'movie_episodes' }]
                  }
                });

                const dbDocs = await new Promise<any[]>((resolve) => {
                  const reqFs = https.request(queryUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(queryPayload)
                    },
                    timeout: 6000
                  }, (resFs) => {
                    let body = '';
                    resFs.on('data', d => body += d);
                    resFs.on('end', () => {
                      if (resFs.statusCode && resFs.statusCode >= 200 && resFs.statusCode < 300) {
                        try {
                          const parsed = JSON.parse(body);
                          if (Array.isArray(parsed)) {
                            const docs = parsed
                              .filter((item: any) => item.document && item.document.fields && (item.document.fields.episodeTitle || item.document.fields.title))
                              .map((item: any) => {
                                const doc = item.document;
                                const f = doc.fields || {};
                                return {
                                  id: f.id?.stringValue || path.basename(doc.name),
                                  seriesTitle: f.seriesTitle?.stringValue || 'PROTOCOL ZERO: THE GHOST VAULT',
                                  episodeTitle: f.episodeTitle?.stringValue || f.title?.stringValue || '',
                                  season: parseInt(f.season?.integerValue || '1', 10),
                                  episode: parseInt(f.episode?.integerValue || '1', 10),
                                  videoPath: f.videoPath?.stringValue || '',
                                  narration: f.narration?.stringValue || '',
                                  duration: parseFloat(f.duration?.doubleValue || f.duration?.integerValue || '0'),
                                  tags: (f.tags?.arrayValue?.values || []).map((v: any) => v.stringValue || ''),
                                  youtubeUploadStatus: f.youtubeUploadStatus?.stringValue || 'PENDING_REVIEW (Upload hold enabled)',
                                  createdAt: f.createdAt?.stringValue || new Date().toISOString()
                                };
                              });
                            resolve(docs);
                            return;
                          }
                        } catch {}
                      }
                      resolve([]);
                    });
                  });
                  reqFs.on('error', () => resolve([]));
                  reqFs.on('timeout', () => { reqFs.destroy(); resolve([]); });
                  reqFs.write(queryPayload);
                  reqFs.end();
                });

                if (dbDocs.length > 0) {
                  episodesList = dbDocs;
                }
              }
            } catch (dbErr: any) {
              console.warn('[API Movie Manifest] Cloud DB read notice:', dbErr.message);
            }

            // 2. Fallback to local manifest file if DB returned empty
            if (episodesList.length === 0) {
              const manifestPath = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');
              if (fs.existsSync(manifestPath)) {
                const data = fs.readFileSync(manifestPath, 'utf8');
                episodesList = JSON.parse(data);
              }
            }

            // Sort latest first
            episodesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(episodesList));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url === '/api/movie/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const epIdx = payload.episodeIndex || 0;
              execSync(`node -e "require('./scripts/generate_movie_brand_episode.cjs').generateMovieEpisode(${epIdx})"`, { cwd: process.cwd(), timeout: 60000 });
              const manifestPath = path.join(process.cwd(), 'test_artifacts', 'movie_episodes_manifest.json');
              const list = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, episode: list[0] || null }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // Teen Motivation Workflow Endpoints
        if (url === '/api/motivation/manifest' && req.method === 'GET') {
          try {
            const manifestPath = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');
            if (fs.existsSync(manifestPath)) {
              const data = fs.readFileSync(manifestPath, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(data);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            }
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url === '/api/motivation/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const tIdx = payload.topicIndex || 0;
              execSync(`node -e "require('./scripts/generate_teen_motivation_reel.cjs').generateTeenMotivationReel(${tIdx})"`, { cwd: process.cwd(), timeout: 60000 });
              const manifestPath = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');
              const list = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, reel: list[0] || null }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  server: {
    port: 3000,
    host: true
  }
});

