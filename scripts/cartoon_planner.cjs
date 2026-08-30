/**
 * Automated Cartoon Factory — AI Script & Scene Planner
 *
 * Provider Hierarchy:
 * 1. Groq (Llama 3.3 70B / 8B - Fast Structured Generation)
 * 2. Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct or @cf/deepseek-ai/deepseek-r1-distill-qwen-32b)
 * 3. OpenRouter (Model Router / Backup)
 * 4. Local / Deterministic Fallback Planner
 *
 * Output: Strictly validated JSON matching cartoon_episode_schema.json
 */

const https = require('https');
const http = require('http');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const DEFAULT_CHARACTER = 'Archie';

const SYSTEM_PROMPT = `You are the Lead Director and Screenwriter for an automated 2D/2.5D educational cartoon channel.
The main character is "${DEFAULT_CHARACTER}", a charismatic, curious, and witty animated explainer host.

TOPIC CATEGORIES:
Science, Technology, Money/Business, History, Everyday-Life Explanations, Investigations, and "What If?" stories.

RULES:
1. Generate an engaging 3 to 5 scene script for a fast-paced vertical video (30-60 seconds total).
2. Each scene MUST have:
   - "scene": integer (1, 2, 3...)
   - "duration": estimated seconds for narration (e.g. 5.0 to 12.0)
   - "dialogue": spoken lines by ${DEFAULT_CHARACTER} (snappy, conversational, educational)
   - "character_action": EXACTLY ONE OF ["idle", "talking", "walking", "point_right", "point_left", "thinking", "laughing", "surprise", "excitement", "looking_left", "looking_right"]
   - "emotion": EXACTLY ONE OF ["neutral", "happy", "surprised", "curious", "excited", "thinking", "concerned", "laughing"]
   - "camera": EXACTLY ONE OF ["wide", "medium", "close_up", "medium_to_close", "pan_left", "pan_right"]
   - "objects": array of visual props/items in the scene (e.g. ["smartphone", "wifi_waves", "satellite"])
   - "background_style": short visual setting (e.g. "modern_tech_lab", "busy_city_street", "deep_space")
   - "effects": array of 2D visual effects (e.g. ["signal_pulse", "glowing_wire", "floating_question_mark"])
3. Output MUST be ONLY valid JSON matching this schema:
{
  "topic": "string",
  "title": "Short, punchy, high-CTR title (under 55 chars)",
  "character_name": "${DEFAULT_CHARACTER}",
  "target_duration_seconds": 45,
  "category": "science" | "technology" | "money_business" | "history" | "everyday_explanations" | "what_if",
  "scenes": [
    {
      "scene": 1,
      "duration": 7.5,
      "dialogue": "...",
      "character_action": "point_right",
      "emotion": "surprised",
      "camera": "medium_to_close",
      "objects": ["..."],
      "background_style": "...",
      "effects": ["..."]
    }
  ]
}
Do not output markdown code blocks or conversational commentary. ONLY valid JSON.`;

/**
 * Validate and sanitize episode JSON
 */
function validateAndCleanEpisode(rawJson, fallbackTopic = 'How the Internet Actually Works') {
  try {
    const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

    if (!data.title || !Array.isArray(data.scenes) || data.scenes.length === 0) {
      throw new Error('Missing title or scenes array');
    }

    const validActions = [
      'idle', 'talking', 'walking', 'point_right', 'point_left',
      'thinking', 'laughing', 'surprise', 'excitement', 'looking_left', 'looking_right'
    ];
    const validEmotions = [
      'neutral', 'happy', 'surprised', 'curious', 'excited', 'thinking', 'concerned', 'laughing'
    ];
    const validCameras = [
      'wide', 'medium', 'close_up', 'medium_to_close', 'pan_left', 'pan_right'
    ];

    const cleanScenes = data.scenes.map((s, idx) => ({
      scene: Number(s.scene || idx + 1),
      duration: Math.max(2.0, Math.min(30.0, Number(s.duration || 6.5))),
      dialogue: String(s.dialogue || '').trim() || `Here is how ${data.topic || fallbackTopic} works!`,
      character_action: validActions.includes(s.character_action) ? s.character_action : 'talking',
      emotion: validEmotions.includes(s.emotion) ? s.emotion : 'curious',
      camera: validCameras.includes(s.camera) ? s.camera : 'medium',
      objects: Array.isArray(s.objects) ? s.objects.map(String) : ['prop'],
      background_style: String(s.background_style || 'tech_studio'),
      effects: Array.isArray(s.effects) ? s.effects.map(String) : ['glow']
    }));

    const totalDuration = cleanScenes.reduce((sum, sc) => sum + sc.duration, 0);

    return {
      topic: String(data.topic || fallbackTopic),
      title: String(data.title).replace(/["']/g, '').trim(),
      character_name: String(data.character_name || DEFAULT_CHARACTER),
      target_duration_seconds: Math.round(totalDuration),
      category: data.category || 'technology',
      scenes: cleanScenes
    };
  } catch (err) {
    console.warn('[Planner Validation Error]:', err.message);
    return null;
  }
}

/**
 * 1. Groq Inference Call
 */
async function callGroq(topic) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

  for (const model of models) {
    try {
      console.log(`[AI Planner] Requesting Groq (${model}) for topic: "${topic}"...`);
      const body = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create an educational cartoon episode scene plan for: "${topic}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1800
      });

      const raw = await new Promise((resolve, reject) => {
        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          timeout: 25000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.choices?.[0]?.message?.content || '');
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`Groq HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Groq request timed out')); });
        req.write(body);
        req.end();
      });

      const cleaned = validateAndCleanEpisode(raw, topic);
      if (cleaned) {
        return { plan: cleaned, provider: `groq/${model}` };
      }
    } catch (e) {
      console.warn(`[AI Planner] Groq ${model} failed:`, e.message);
    }
  }
  throw new Error('All Groq models failed');
}

/**
 * 2. Cloudflare Workers AI Inference Call
 */
async function callCloudflareAI(topic) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare credentials not configured');
  }

  const models = [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    '@cf/mistral/mistral-7b-instruct-v0.1'
  ];

  for (const model of models) {
    try {
      console.log(`[AI Planner] Requesting Cloudflare AI (${model})...`);
      const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;
      const body = JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create an educational cartoon episode scene plan for: "${topic}"` }
        ],
        max_tokens: 1800
      });

      const raw = await new Promise((resolve, reject) => {
        const req = https.request(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          timeout: 25000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                const text = parsed.result?.response || parsed.result?.text || '';
                resolve(text);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`Cloudflare HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Cloudflare request timed out')); });
        req.write(body);
        req.end();
      });

      // Extract JSON from potential markdown tags
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : raw;
      const cleaned = validateAndCleanEpisode(jsonStr, topic);
      if (cleaned) {
        return { plan: cleaned, provider: `cloudflare/${model}` };
      }
    } catch (e) {
      console.warn(`[AI Planner] Cloudflare AI (${model}) failed:`, e.message);
    }
  }
  throw new Error('All Cloudflare AI models failed');
}

/**
 * 3. OpenRouter Inference Call
 */
async function callOpenRouter(topic) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');

  const models = ['meta-llama/llama-3.1-8b-instruct:free', 'qwen/qwen-2.5-7b-instruct:free', 'google/gemma-2-9b-it:free', 'meta-llama/llama-3.3-70b-instruct'];

  for (const model of models) {
    try {
      console.log(`[AI Planner] Requesting OpenRouter (${model})...`);
      const body = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create an educational cartoon episode scene plan for: "${topic}"` }
        ],
        response_format: { type: 'json_object' }
      });

      const raw = await new Promise((resolve, reject) => {
        const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://voxam.factory.local',
            'X-Title': 'Voxam Cartoon Factory'
          },
          timeout: 25000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.choices?.[0]?.message?.content || '');
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`OpenRouter HTTP ${res.statusCode}`));
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('OpenRouter timed out')); });
        req.write(body);
        req.end();
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const cleaned = validateAndCleanEpisode(jsonMatch ? jsonMatch[0] : raw, topic);
      if (cleaned) {
        return { plan: cleaned, provider: `openrouter/${model}` };
      }
    } catch (e) {
      console.warn(`[AI Planner] OpenRouter ${model} failed:`, e.message);
    }
  }
  throw new Error('All OpenRouter models failed');
}

/**
 * 4. Deterministic Local Structured Fallback Planner
 */
function getDeterministicFallback(topic) {
  const safeTopic = topic || 'How Wi-Fi Works';
  console.log(`[AI Planner] Using deterministic fallback planner for: "${safeTopic}"`);

  return {
    topic: safeTopic,
    title: `The Secret Truth About ${safeTopic}!`,
    character_name: DEFAULT_CHARACTER,
    target_duration_seconds: 30,
    category: 'technology',
    scenes: [
      {
        scene: 1,
        duration: 7.0,
        dialogue: `Have you ever wondered what actually happens during ${safeTopic}? It's way wilder than you think!`,
        character_action: 'surprise',
        emotion: 'surprised',
        camera: 'medium_to_close',
        objects: ['smartphone', 'mystery_box'],
        background_style: 'neon_tech_lab',
        effects: ['question_marks', 'energy_spark']
      },
      {
        scene: 2,
        duration: 8.0,
        dialogue: `Under the hood, billions of invisible signals are pulsing back and forth at the speed of light.`,
        character_action: 'point_right',
        emotion: 'curious',
        camera: 'medium',
        objects: ['pulsing_waves', 'router'],
        background_style: 'digital_matrix_grid',
        effects: ['signal_pulse', 'speed_lines']
      },
      {
        scene: 3,
        duration: 8.0,
        dialogue: `Your device decodes all of this instant math into videos, games, and messages in less than a millisecond!`,
        character_action: 'thinking',
        emotion: 'thinking',
        camera: 'close_up',
        objects: ['microchip', 'data_flow'],
        background_style: 'inside_computer',
        effects: ['binary_rain', 'glowing_circuits']
      },
      {
        scene: 4,
        duration: 7.0,
        dialogue: `Follow along for your daily dose of everyday wonders decoded!`,
        character_action: 'excitement',
        emotion: 'excited',
        camera: 'medium_to_close',
        objects: ['bell_icon', 'star_badge'],
        background_style: 'neon_tech_lab',
        effects: ['confetti', 'sparkles']
      }
    ]
  };
}

/**
 * Primary Multi-Provider Planning Function
 */
async function generateCartoonEpisodePlan(topic) {
  const targetTopic = (topic || 'How Fiber Optic Cables Carry the Internet Under the Ocean').trim();

  // 1. Try Groq (Primary)
  try {
    const res = await callGroq(targetTopic);
    console.log(`[AI Planner] Successfully generated plan via ${res.provider}`);
    return { ...res.plan, modelUsed: res.provider };
  } catch (err) {
    console.warn('[AI Planner] Groq failed, failing over to Cloudflare AI...');
  }

  // 2. Try Cloudflare Workers AI (Backup 1)
  try {
    const res = await callCloudflareAI(targetTopic);
    console.log(`[AI Planner] Successfully generated plan via ${res.provider}`);
    return { ...res.plan, modelUsed: res.provider };
  } catch (err) {
    console.warn('[AI Planner] Cloudflare AI failed, failing over to OpenRouter...');
  }

  // 3. Try OpenRouter (Backup 2)
  try {
    const res = await callOpenRouter(targetTopic);
    console.log(`[AI Planner] Successfully generated plan via ${res.provider}`);
    return { ...res.plan, modelUsed: res.provider };
  } catch (err) {
    console.warn('[AI Planner] OpenRouter failed, using local deterministic fallback...');
  }

  // 4. Deterministic Structured Fallback
  const fallback = getDeterministicFallback(targetTopic);
  return { ...fallback, modelUsed: 'deterministic_local_fallback' };
}

module.exports = {
  generateCartoonEpisodePlan,
  validateAndCleanEpisode,
  getDeterministicFallback
};
