import { NicheType } from './types';

export const NICHE_TOPIC_ANGLES: Record<string, string[]> = {
  'finance_saas': [
    'How to Start a High-Demand Side Hustle with Low Capital',
    'Finance News: High-Yield Digital Vaults vs Inflation',
    'True Story: Starting with ₦10,000 to a 6-Figure Monthly Cashflow',
    '4 Financial Habits That Separate Wealth Builders from the Broke',
    'Micro-B2B Logistics Coordination for Local Shops (Zero Inventory)',
    'Selar Digital Creator Blueprint: Packaging Skills with Low Overhead'
  ],
  'motivation_stoicism': [
    'Marcus Aurelius on Inner Fortress and Focus',
    'Seneca on Time Management & Overcoming Anxiety',
    'Epictetus on Financial & Emotional Self-Mastery',
    'Marcus Aurelius on Direct Action Over Excuses'
  ],
  'tech_ai': [
    'DeepSeek-R1 vs Gemini 2.5 on Real Coding Tasks',
    'Top 3 Open-Source Developer CLI Tools in 2026',
    'How to Run Free Voice Synthesis with Cloudflare Workers AI',
    'Building Autonomous AI Content Pipelines with GitHub Actions'
  ]
};

export interface AiScriptOutput {
  title: string;
  description: string;
  tags: string[];
  hook: string;
  slides: Array<{
    text: string;
    visual: string;
  }>;
  modelUsed?: string;
}

/**
 * 1. UNIFIED SCRIPT & BLUEPRINT GENERATOR
 * Hierarchy:
 * 1. Grok 2 (xAI) - FIRST for Analysis & Creation
 * 2. Cloudflare Workers AI (Llama 3.3 70B) - BACKUP
 * 3. Groq (Llama 3.3 70B) - SECONDARY
 * 4. Gemini & Deterministic Vault Templates - FINAL FALLBACK
 */
export async function generateContentScript(params: {
  niche: NicheType;
  topic: string;
  xaiKey?: string;
  groqKey?: string;
  cfAccount?: string;
  cfToken?: string;
}): Promise<AiScriptOutput> {
  const { niche, topic } = params;

  // Delegate directly to the server-side unified generator endpoint
  try {
    const res = await fetch('/api/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, topic })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.title && Array.isArray(data.slides)) {
        return {
          title: data.title,
          description: data.description || '',
          tags: data.tags || ['#Shorts', '#Automation'],
          hook: data.slides[0]?.text || topic,
          slides: data.slides,
          modelUsed: data.modelUsed
        };
      }
    }
  } catch (e) {
    console.warn("[Client]: Server unified blueprint generation notice:", e);
  }

  // Dynamic Topic-Aware Fallback if server call fails
  const channelName = niche === 'finance_saas' ? 'Fin Blueprint' : (niche === 'motivation_stoicism' ? 'The Stoic Architect' : 'Godswill Isaac');
  const cleanTopic = topic.trim();

  return {
    title: `${cleanTopic} | Practical Masterclass`,
    description: `Here is the comprehensive, practical breakdown on ${cleanTopic}.\n\nSubscribe to ${channelName} for daily high-impact blueprints!\n\n#Shorts #${channelName.replace(/\s+/g, '')} #Knowledge #Growth #Strategy`,
    tags: ['#Shorts', `#${channelName.replace(/\s+/g, '')}`, '#Mindset', '#ActionableTips', '#Strategy'],
    hook: `Hello, welcome to ${channelName}! Today we are breaking down everything you need to know about ${cleanTopic}.`,
    slides: [
      {
        text: `Hello, welcome to ${channelName}! Today we are breaking down everything you need to know about ${cleanTopic}.`,
        visual: `High-contrast 9:16 vertical cinematic opening scene illustrating ${cleanTopic}, luxury aesthetic studio lighting, 8k photorealistic`
      },
      {
        text: `The core foundation begins with understanding how ${cleanTopic} operates in high-leverage environments.`,
        visual: `Analytical workspace displaying high-resolution insights and digital roadmap for ${cleanTopic}, 8k 9:16 vertical photorealistic`
      },
      {
        text: `Focus on consistent daily execution and eliminating unnecessary friction to compound your results.`,
        visual: `Dynamic close-up of tactical execution and forward momentum related to ${cleanTopic}, sharp cinematic lighting, 8k 9:16 vertical`
      },
      {
        text: `Apply these key principles consistently to achieve lasting impact. Subscribe to ${channelName} for daily actionable breakdowns!`,
        visual: `Clean aesthetic call to action with glowing verified badge and notification bell icon, 8k 9:16 vertical studio lighting`
      }
    ],
    modelUsed: 'Dynamic Topic-Aware Synthesizer'
  };
}

/**
 * Chat with xAI Grok (FIRST for Analysis & Creation)
 */
export async function chatWithXaiGrok(params: {
  apiKey?: string;
  prompt: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
}): Promise<string> {
  const { apiKey, prompt, messages, model = 'grok-4.3' } = params;
  const conversation = messages || [{ role: 'user', content: prompt }];

  const candidateModels = [model, 'grok-4.3', 'grok-4.6', 'grok-4.1-fast', 'grok-4', 'grok-2-latest', 'grok-beta'];

  let lastError = '';
  for (const m of Array.from(new Set(candidateModels))) {
    try {
      const res = await fetch('/api/xai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: m,
          messages: conversation
        })
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }

      if (res.ok && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      lastError = data.error?.message || data.error || `HTTP ${res.status}`;
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || 'All Grok models unavailable');
}

/**
 * Chat with Cloudflare Workers AI (Llama 3.3 / Llama 3.1)
 */
export async function chatWithCloudflareLLM(params: {
  accountId?: string;
  apiToken?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  const { accountId, apiToken, prompt, model = '@cf/meta/llama-3.3-70b-instruct' } = params;

  const res = await fetch('/api/cloudflare-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      apiToken,
      model,
      inputs: {
        messages: [{ role: 'user', content: prompt }]
      }
    })
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Cloudflare AI LLM returned status ${res.status}`);
  }

  if (!res.ok) {
    const errMsg = data.error || (data.errors && data.errors[0]?.message) || `Cloudflare AI LLM failed with status ${res.status}`;
    throw new Error(errMsg);
  }

  return data.result?.response || data.response || 'No response from Cloudflare AI.';
}

/**
 * Chat with Groq (Flagship Open-Source Models: OpenAI GPT-OSS 120B / Llama 4 Scout / DeepSeek R1 / Llama 3.1 8B)
 */
export async function chatWithGroq(params: {
  apiKey?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  const { apiKey, prompt, model = 'openai/gpt-oss-120b' } = params;

  const candidateModels = [
    model,
    'openai/gpt-oss-120b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'deepseek-r1-distill-llama-70b',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-20b'
  ];

  let lastError = '';
  for (const m of Array.from(new Set(candidateModels))) {
    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: m,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }

      if (res.ok && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      lastError = data.error?.message || data.error || `HTTP ${res.status}`;
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || 'All Groq models unavailable');
}

/**
 * 2. IMAGE GENERATION (Cloudflare Workers AI FIRST, Pollinations LAST)
 */
export async function generateAutomatedImage(prompt: string): Promise<{ imageUrl: string; provider: string }> {
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) {
        return {
          imageUrl: data.imageUrl,
          provider: data.provider || 'Cloudflare Workers AI'
        };
      }
    }
  } catch (e) {
    console.warn("[Client]: Server generate-image fallback:", e);
  }

  // Ultimate Fallback: Pollinations AI (LAST)
  return {
    imageUrl: getPollinationsImageUrl(prompt),
    provider: 'Pollinations Flux (Fallback)'
  };
}

/**
 * Generate images with Cloudflare Workers AI (FLUX.1-schnell FIRST)
 */
export async function generateCloudflareImage(params: {
  accountId?: string;
  apiToken?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  const {
    accountId,
    apiToken,
    prompt,
    model = '@cf/black-forest-labs/flux-1-schnell'
  } = params;

  const res = await fetch('/api/cloudflare-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      apiToken,
      model,
      inputs: { prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic` }
    })
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Cloudflare AI returned status ${res.status}: ${text.slice(0, 160)}`);
  }

  if (!res.ok) {
    const errMsg = data.error || (data.errors && data.errors[0]?.message) || `Cloudflare AI failed: status ${res.status}`;
    throw new Error(errMsg);
  }

  if (data.image) {
    return data.image; // Base64 data URL
  }

  throw new Error('No image returned by Cloudflare AI: ' + (typeof data === 'object' ? (data?.error || data?.message || 'Empty response') : String(data)));
}

/**
 * 3. TTS VOICE GENERATION (Cloudflare Workers AI Deepgram Aura-2 FIRST with Deep Bass Wise Voice)
 */
export async function generateAutomatedTTS(
  text: string,
  speaker = 'zeus',
  voiceEngine?: string,
  accountId?: string,
  apiToken?: string
): Promise<{ audioUrl: string | null; provider: string; byteLength?: number }> {
  try {
    const res = await fetch('/api/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speaker, voiceEngine, accountId, apiToken })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        audioUrl: data.audioUrl || null,
        provider: data.provider || 'Cloudflare Workers AI (@cf/deepgram/aura-2-en)',
        byteLength: data.byteLength || 0
      };
    }
  } catch (e) {
    console.warn("[Client]: Server generate-tts notice:", e);
  }

  return {
    audioUrl: null,
    provider: 'Cloudflare TTS Fallback'
  };
}

/**
 * Generate Text-to-Speech audio with Cloudflare Workers AI (Deepgram Aura-2 / Edge Neural)
 */
export async function generateCloudflareTTS(params: {
  accountId?: string;
  apiToken?: string;
  text: string;
  model?: string;
  speaker?: string;
}): Promise<{ audioUrl: string; byteLength: number; model: string }> {
  const {
    accountId,
    apiToken,
    text,
    model = '@cf/deepgram/aura-2-en',
    speaker = 'zeus'
  } = params;

  const res = await fetch('/api/cloudflare-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      apiToken,
      model,
      inputs: { text, speaker }
    })
  });

  const rawText = await res.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Cloudflare TTS returned status ${res.status}: ${rawText.slice(0, 160)}`);
  }

  if (!res.ok) {
    const errMsg = data.error || (data.errors && data.errors[0]?.message) || `Cloudflare TTS failed with status ${res.status}`;
    throw new Error(errMsg);
  }

  if (data.audio) {
    return {
      audioUrl: data.audio,
      byteLength: data.byteLength || 0,
      model: `${model} (${speaker})`
    };
  }

  throw new Error('No audio returned by Cloudflare TTS: ' + (typeof data === 'object' ? (data?.error || data?.message || 'Empty audio') : String(data)));
}

/**
 * Pollinations AI Image URL builder (LAST Fallback)
 */
export function getPollinationsImageUrl(prompt: string, options?: {
  width?: number;
  height?: number;
  seed?: number;
  model?: 'flux' | 'turbo' | 'unity';
  enhance?: boolean;
}): string {
  const width = options?.width || 1080;
  const height = options?.height || 1920;
  const seed = options?.seed || Math.floor(Math.random() * 1000000);
  const model = options?.model || 'flux';
  const enhance = options?.enhance ? '&enhance=true' : '';

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true${enhance}`;
}

/**
 * Chat with Pollinations Text
 */
export async function chatWithPollinations(prompt: string): Promise<string> {
  const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
  if (!res.ok) {
    throw new Error(`Pollinations text request failed: ${res.status}`);
  }
  return await res.text();
}
