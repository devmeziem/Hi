import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        // Serve rendered_videos mp4 and media files
        if (url.startsWith('/rendered_videos/')) {
          const rel = url.replace('/rendered_videos/', '');
          const filePath = path.join(process.cwd(), 'rendered_videos', rel);
          if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mp3' ? 'audio/mpeg' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.statusCode = 200;
            fs.createReadStream(filePath).pipe(res);
            return;
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

              const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '19db0749de1d68290aa88f04f2b3f14d';
              const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN || 'cfut_GwCYVRlxWQUto1DT1gPoDe55ZwNpcqGD7CrJyPHe58764d79';

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
              const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '19db0749de1d68290aa88f04f2b3f14d';
              const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN || 'cfut_GwCYVRlxWQUto1DT1gPoDe55ZwNpcqGD7CrJyPHe58764d79';

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
                const apiKey = process.env.GROQ_API_KEY || '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';
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
              const apiKey = data.apiKey || process.env.XAI_API_KEY || 'xai-BzO21GFhUWg7Dqdfs5Yt6yNOjXl5Xx6cGDEfIIWtVIt4hEMqdkkSxL8EOvcuLtAF09YlCtEk7XY65zV4';

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
              const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '19db0749de1d68290aa88f04f2b3f14d';
              const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN || 'cfut_GwCYVRlxWQUto1DT1gPoDe55ZwNpcqGD7CrJyPHe58764d79';
              const model = data.model || '@cf/bytedance/stable-diffusion-xl-lightning';

              const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data.inputs || { prompt: data.prompt || 'Cyberpunk neon city 8k' })
              });

              const contentType = response.headers.get('content-type') || '';
              if (contentType.includes('image/')) {
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  image: `data:${contentType};base64,${base64}`,
                  contentType
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
                  contentType: mime,
                  byteLength: arrayBuffer.byteLength
                }));
                return;
              }

              const text = await response.text();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = response.status;
              res.end(text);
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
              const apiKey = data.apiKey || process.env.GROQ_API_KEY || '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';

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

