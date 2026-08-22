/**
 * 01 - The Brain: Daily Blueprint Generator
 * Initial / Primary: Grok 2 (xAI) for intelligent persona analysis and script creation.
 * Backup 1: Cloudflare Workers AI (Llama 3.3 70B / DeepSeek).
 * Secondary: Groq LPU (Llama 3.3 70B) and Deterministic Persona Templates.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2,
  process.env.GROK_KEY
].filter(Boolean)));
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const NICHES = [
  {
    id: 'finance_saas',
    channelName: 'Fin Blueprint (@bones_ceo)',
    displayName: 'Fin Blueprint',
    slots: [
      {
        formatType: 'side_hustle',
        topic: 'How to Start a High-Demand Side Hustle with Low Capital',
        hook: 'How to start a small side hustle that can boom with minimal friction',
        research: 'Local B2B WhatsApp digital catalog coordination & invoice tracking for small shops',
        action: 'Setup 1-page digital order forms for local retailers with zero upfront inventory',
        takeaway: 'Secure 3 local business retainers for steady cash flow. Link in bio for starter guide.',
        visualDetail: 'Professional entrepreneur in smart casual attire presenting a clean digital financial roadmap on tablet, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'finance_news_poll',
        topic: 'Finance News: High-Yield Digital Vaults vs Inflation',
        hook: 'Latest breaking finance news on high-yield fintech savings rates',
        research: 'Fintech automated vaults offering 15-18% APY to outpace standard bank deposits',
        action: 'Comparing liquid digital vaults versus traditional 1.5% fixed bank accounts',
        takeaway: 'Option A: Save in digital vaults, or Option B: Reinvest in side hustle? Drop your vote below!',
        visualDetail: 'Modern sleek financial news studio broadcast backdrop with glowing green market indices and digital ticker, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'realistic_story',
        topic: 'True Story: Starting with ₦10,000 to a 6-Figure Monthly Cashflow',
        hook: 'Realistic case study of starting with little funds and scaling big revenue',
        research: 'David started with ₦10,000 for mobile data, designing digital menus for 3 bakeries',
        action: 'Reinvested 100% of early profits into local delivery coordination without debt',
        takeaway: 'Start with what you have, keep overhead near zero, and compound daily.',
        visualDetail: 'Focused young entrepreneur working diligently on smartphone at clean wooden desk with morning sunlight, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'wealth_discipline',
        topic: '4 Financial Habits That Separate Wealth Builders from the Broke',
        hook: 'Core money management habits for growing sustainable long-term wealth',
        research: 'The 50/30/20 rule customized for volatile income and mandatory emergency buffers',
        action: 'Automate first 20% of all incoming revenue into untouchable growth reserves',
        takeaway: 'Financial freedom is built on daily habits, not luck. Follow for daily financial blueprints.',
        visualDetail: 'Clean aesthetic personal finance budgeting dashboard with emerald savings metrics and structured balance sheet, 8k 9:16 vertical'
      }
    ]
  },
  {
    id: 'motivation_stoicism',
    channelName: 'The Stoic Architect (@thestoicarchitect-n4b)',
    displayName: 'The Stoic Architect',
    slots: [
      {
        formatType: 'discipline_mastery',
        topic: '5 Ways to Master Unshakable Self-Discipline',
        quote: 'No person is free who is not master of himself.',
        author: 'Epictetus',
        theme: 'Overcoming Dopamine Traps & Winning the First 30 Minutes of Every Day',
        visualDetail: 'Aesthetic minimalist morning study desk with classical Roman bust, leather notebook, and golden sunrise light, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'manhood_character',
        topic: 'What Does It Mean to Be a Real Man? True Strength, Duty & Honor',
        quote: 'Waste no more time arguing what a good man should be. Be one.',
        author: 'Marcus Aurelius',
        theme: 'Emotional Maturity, Accountability, Protecting Others, and Quiet Competence Over Toxic Posturing',
        visualDetail: 'Statuesque composed man in thoughtful reflection overlooking vast mountains at dawn, cinematic chiaroscuro studio lighting, 8k 9:16 vertical'
      },
      {
        formatType: 'fame_and_validation',
        topic: 'The Illusion of Fame: Marcus Aurelius vs Social Media Validation',
        quote: 'How much peace of mind one gains by not caring what a neighbor says, does, or thinks.',
        author: 'Marcus Aurelius',
        theme: 'Rejecting the Social Media Clout Trap for True Inner Sovereignty and Real Worth',
        visualDetail: 'Split conceptual scene of classical marble Roman forum transitioning into a glowing dark smartphone interface, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'gender_equality_virtue',
        topic: 'Why Virtue Knows No Gender: Ancient Stoicism on Equality & Mutual Respect',
        quote: 'Women have the same reasoning capacity and inclination toward virtue as men.',
        author: 'Musonius Rufus & Seneca',
        theme: 'True Strength Upholds Equal Dignity, Shared Wisdom, and Mutual Respect in Modern Life',
        visualDetail: 'Inspiring aesthetic classical Greek marble statues of female and male thinkers standing shoulder to shoulder with golden illumination, 8k 9:16 vertical'
      },
      {
        formatType: 'action_over_anxiety',
        topic: 'Seneca on Time & Overcoming Paralysis by Analysis',
        quote: 'We suffer more often in imagination than in reality.',
        author: 'Seneca',
        theme: 'Killing Procrastination with Immediate Physical Action & Amor Fati',
        visualDetail: 'Ancient classical Roman peristyle courtyard with sunlight streaming through marble columns, 8k 9:16 vertical photorealistic'
      }
    ]
  },
  {
    id: 'tech_ai',
    channelName: 'Godswill Isaac (@bonesceo)',
    displayName: 'Godswill Isaac',
    slots: [
      {
        formatType: 'ai_benchmark',
        topic: 'DeepSeek-R1 vs Gemini 2.5 on Real Coding Tasks',
        hook: 'Practical AI tools that save you 10+ hours every week',
        research: 'Real-world benchmark of local reasoning models versus cloud inference APIs',
        takeaway: 'Which AI coding assistant do you use daily? Let me know in the comments!',
        visualDetail: 'Futuristic ultra-clean developer workspace with dual glowing OLED monitors showing AI code analysis matrix, 8k 9:16 vertical'
      },
      {
        formatType: 'tech_tools',
        topic: 'Top 3 Open-Source Developer CLI Tools in 2026',
        hook: 'Stop paying monthly subscriptions for tools you can run locally for free',
        research: 'Local terminal productivity utilities for modern full-stack software engineers',
        takeaway: 'Save this video and test these CLI tools this weekend.',
        visualDetail: 'High contrast aesthetic terminal console with green and cyan syntax highlighting on dark mode screen, 8k 9:16 vertical'
      },
      {
        formatType: 'cloud_infra',
        topic: 'How to Run Free Voice Synthesis with Cloudflare Workers AI',
        hook: 'Deepgram Aura-2 on Cloudflare edge servers costs $0 for creators',
        research: 'Deploying edge serverless audio pipelines for autonomous YouTube workflows',
        takeaway: 'Check the description for the full open-source setup blueprint.',
        visualDetail: 'Clean architectural diagram of global edge cloud computing nodes glowing in indigo and emerald, 8k 9:16 vertical'
      },
      {
        formatType: 'autonomous_pipeline',
        topic: 'Building Autonomous AI Content Pipelines with GitHub Actions',
        hook: 'How decoupled GitHub Actions runners produce high-CTR videos automatically',
        research: 'Automating multi-modal AI generation with zero server upkeep costs',
        takeaway: 'Drop a comment if you want the open-source GitHub workflow template!',
        visualDetail: 'Modern tech studio with automated robotic workflow interface and glowing server cluster, 8k 9:16 vertical'
      }
    ]
  }
];

/**
 * Call xAI Grok API (Primary - FIRST for Analysis & Creation) with Multi-Token Failover
 */
async function callGrok(prompt, systemPrompt) {
  for (let i = 0; i < XAI_API_KEYS.length; i++) {
    const key = XAI_API_KEYS[i];
    const masked = key.slice(0, 8) + '...' + key.slice(-4);
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1200
        });

        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
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
              } catch (e) {
                resolve(null);
              }
            } else {
              console.warn(`  [Grok]: Token #${i + 1} (${masked}) returned HTTP ${res.statusCode}`);
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
        console.log(`  -> [Grok Token #${i + 1} Succeeded] (${masked})`);
        return result;
      }
    } catch (err) {
      console.warn(`  [Grok]: Token #${i + 1} exception:`, err.message);
    }
  }
  return null;
}

/**
 * Call Cloudflare Workers AI (BACKUP for Analysis & Creation)
 */
async function callCloudflareAI(prompt, systemPrompt) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
    const model = '@cf/meta/llama-3.3-70b-instruct';

    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const content = json.result?.response || json.response;
          resolve(content || null);
        } catch (e) {
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
 * Call Groq with Multi-Model Fallback for Deprecation Resilience
 */
async function callGroq(prompt, systemPrompt) {
  const candidateModels = [
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'llama-3.1-8b-instant',
    'llama3-70b-8192'
  ];

  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        });

        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 10000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.message?.content;
                resolve(content || null);
              } catch (e) {
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
        console.log(`  -> [Groq Succeeded using model: ${model}]`);
        return result;
      }
    } catch {
      // Try next candidate model
    }
  }

  return null;
}

async function generateDailyBlueprints() {
  console.log("=== [01: THE BRAIN] STARTING DAILY BLUEPRINT GENERATION ===");
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log(`[AI Engine Hierarchy]: Grok 2 (xAI) FIRST -> Cloudflare Workers AI BACKUP -> Groq (Llama 3.3)`);

  const jobs = [];

  for (const niche of NICHES) {
    console.log(`\nGenerating 4 blueprints for ${niche.channelName}...`);
    for (let slotIdx = 0; slotIdx < niche.slots.length; slotIdx++) {
      const slot = niche.slots[slotIdx];
      const jobId = `job_${Date.now()}_${niche.id}_${slotIdx + 1}`;

      let scriptText = '';
      let visualPrompt = '';
      let title = '';
      let usedAiModel = 'Deterministic Template';

      const channelName = niche.displayName || niche.channelName;
      const systemPrompt = `You are a professional YouTube Shorts producer for "${channelName}".
STRICT YOUTUBE TOS COMPLIANCE: Professional, realistic, strictly educational, zero get-rich-quick claims, authentic numbers, engaging audience retention.

MANDATORY 5 TO 6 SCENE STORYBOARD STRUCTURE:
You MUST generate 5 to 6 sequential storyboard slides:
- Slide 1: "Hello, welcome to ${channelName}! Today we'll be discussing on how to [topic/hook]..." (12-16 words)
- Slide 2: Foundation / Problem / Economic Context (12-15 words)
- Slide 3: Practical Action Step 1 / Mechanism (12-15 words)
- Slide 4: Practical Action Step 2 / Real Example (12-15 words)
- Slide 5: Golden Rule / Mindset Discipline (12-15 words)
- Slide 6: Engagement Question (Option A vs B) or Action Takeaway + Link in Bio (10-14 words)

VISUAL PROMPT DIRECTIVE:
Every single slide (all 5-6) MUST have an extremely descriptive 9:16 vertical 8k photorealistic luxury studio prompt matching that exact moment.

Respond strictly in raw JSON format:
{
  "title": "High CTR Professional Title",
  "script": "Complete spoken voiceover of all slides combined",
  "visualPrompt": "Photorealistic 9:16 vertical luxury scene for the primary hook",
  "slides": [
    { "text": "Slide 1 narration...", "visual": "Photorealistic 9:16 vertical prompt 1..." },
    { "text": "Slide 2 narration...", "visual": "Photorealistic 9:16 vertical prompt 2..." },
    { "text": "Slide 3 narration...", "visual": "Photorealistic 9:16 vertical prompt 3..." },
    { "text": "Slide 4 narration...", "visual": "Photorealistic 9:16 vertical prompt 4..." },
    { "text": "Slide 5 narration...", "visual": "Photorealistic 9:16 vertical prompt 5..." },
    { "text": "Slide 6 narration...", "visual": "Photorealistic 9:16 vertical prompt 6..." }
  ]
}`;

      // 1. Initial attempt with Grok (xAI) - FIRST
      let aiResponse = null;
      try {
        const userPrompt = `Create a professional YouTube Short script for topic: "${slot.topic}". Focus details: ${JSON.stringify(slot)}. Channel: "${channelName}".`;
        aiResponse = await callGrok(userPrompt, systemPrompt);
        if (aiResponse) usedAiModel = 'Grok 2 (xAI)';
      } catch (err) {
        console.warn("Grok generation notice, checking Cloudflare AI backup...");
      }

      // 2. Backup attempt with Cloudflare Workers AI - BACKUP
      if (!aiResponse) {
        try {
          const userPrompt = `Create a professional YouTube Short script for topic: "${slot.topic}". Focus details: ${JSON.stringify(slot)}. Channel: "${channelName}".`;
          aiResponse = await callCloudflareAI(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Cloudflare Workers AI (Llama 3.3)';
        } catch (e) {
          console.warn("Cloudflare AI LLM backup notice, checking Groq fallback...");
        }
      }

      // 3. Secondary fallback attempt with Groq (Llama 3.3)
      if (!aiResponse) {
        try {
          const userPrompt = `Create a professional YouTube Short script for topic: "${slot.topic}". Focus details: ${JSON.stringify(slot)}. Channel: "${channelName}".`;
          aiResponse = await callGroq(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Groq (Llama 3.3 70B)';
        } catch (e) {
          // Fall through to deterministic
        }
      }

      // Parse AI output if available
      if (aiResponse) {
        try {
          const clean = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          title = parsed.title || title;
          scriptText = parsed.script || parsed.scriptText || scriptText;
          visualPrompt = parsed.visualPrompt || visualPrompt;
        } catch (e) {
          // Keep raw or fall back
        }
      }

      // Fallback defaults if not set
      if (!title || !scriptText) {
        title = slot.topic;
        visualPrompt = slot.visualDetail || `Cinematic photorealistic 9:16 vertical workspace in Nigeria with modern studio lighting, 8k resolution`;

        if (slot.formatType === 'side_hustle') {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing on how to start a high-demand side hustle with low capital that can boom with minimal friction. Focus on local digital service coordination: create automated WhatsApp catalogs and invoice tracking for retail shops with zero inventory. Secure 3 local retainers this week. Link to the blueprint is in bio!`;
        } else if (slot.formatType === 'finance_news_poll') {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the latest finance news on high-yield fintech savings rates. Automated digital vaults now offer 15% to 18% APY to beat inflation compared to standard fixed deposits. What would you do: Option A — Save in digital vaults, or Option B — Reinvest in your side hustle? Drop your thoughts below!`;
        } else if (slot.formatType === 'realistic_story') {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the realistic story of how starting with just little funds built big revenue. David started with only ₦10,000 for mobile data, designing digital menus for 3 local bakeries and reinvesting every single kobo into local deliveries. Start with what you have and compound daily!`;
        } else if (slot.formatType === 'wealth_discipline') {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the 4 essential money management habits for growing long-term wealth. Automate the first 20% of every payment into an emergency growth reserve before spending a single kobo. Discipline builds freedom. Follow for daily financial blueprints!`;
        } else if (slot.quote) {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing timeless wisdom on ${slot.theme}. "${slot.quote}" — ${slot.author}. True power begins when you master your reaction to outside noise. Focus on what you control.`;
        } else {
          scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing on ${slot.topic}. ${slot.hook}. Check out the full breakdown and let me know your thoughts in the comments!`;
        }
      }

      const jobData = {
        id: jobId,
        channelId: niche.id,
        channelName: niche.channelName,
        slotNumber: slotIdx + 1,
        title,
        scriptText,
        visualPrompt,
        aiEngine: usedAiModel,
        stage: 'QUEUED_FOR_ASSETS',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      jobs.push(jobData);
      console.log(`  [Slot ${slotIdx + 1}/4] Title: "${title}" (Generated via ${usedAiModel})`);
    }
  }

  // Save manifest locally for pipeline inspection
  const outPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2));
  console.log(`\nSuccessfully generated ${jobs.length} blueprints. Saved manifest to ${outPath}`);
  console.log("=== [01: THE BRAIN] BLUEPRINT RUN FINISHED ===");
}

generateDailyBlueprints().catch(err => {
  console.error("The Brain Generation Failed:", err);
  process.exit(1);
});

