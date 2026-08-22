const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testCleanCF() {
  const systemPrompt = `You are an expert YouTube Shorts script creator for high-retention 9:16 videos.
Respond STRICTLY with valid raw JSON with no conversational text or markdown codeblocks:
{
  "title": "Short Catchy YouTube Short Title",
  "description": "Engaging description with #Shorts #FinBlueprint",
  "tags": ["#Shorts", "#Finance", "#Money"],
  "slides": [
    {
      "text": "Rule 1: Hook and clear statement.",
      "visual": "Aesthetic photorealistic 9:16 vertical workspace scene"
    },
    {
      "text": "Rule 2: Practical step breakdown.",
      "visual": "Smartphone screen showing clean automated dashboard"
    },
    {
      "text": "Rule 3: Scaling principle.",
      "visual": "Growth chart with emerald green surplus indicators"
    },
    {
      "text": "Rule 4: Call to action to check link in bio.",
      "visual": "Sleek notification bell and verified badge call to action"
    }
  ]
}`;

  const userPrompt = `Generate a 4-slide YouTube Short on topic: "How to Build a High-Demand ₦50k AI Automation Agency with Zero Coding in 2026" for channel "Fin Blueprint".`;

  const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}\n\nJSON Output:`;

  const postData = JSON.stringify({
    prompt: fullPrompt,
    max_tokens: 1000
  });

  const model = '@cf/meta/llama-3.1-8b-instruct';

  await new Promise((resolve) => {
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 20000
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        try {
          const j = JSON.parse(buf.toString('utf8'));
          const text = j.result?.response || j.response || '';
          console.log('Raw text:', text.slice(0, 300));
          
          // Extract JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Successfully Parsed Title:', parsed.title);
            console.log('Slides count:', parsed.slides.length);
            console.log('Slide 1:', parsed.slides[0]);
          } else {
            console.log('No JSON block found');
          }
        } catch(e) {
          console.log('Error:', e.message);
        }
        resolve();
      });
    });
    req.write(postData);
    req.end();
  });
}

testCleanCF();
