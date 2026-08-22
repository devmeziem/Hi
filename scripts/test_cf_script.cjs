const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testCFPrompt() {
  const prompt = `You are an expert YouTube Shorts content creator.
Topic: "How to Build a High-Demand ₦50k AI Automation Agency with Zero Coding in 2026"
Channel: "Fin Blueprint"

Write a high CTR 5-slide script. Respond STRICTLY in raw JSON format without markdown ticks:
{
  "title": "High CTR Title",
  "description": "Engaging description with #Shorts #FinBlueprint",
  "tags": ["#FinBlueprint", "#Business", "#Shorts"],
  "slides": [
    {
      "text": "Slide 1 text...",
      "visual": "9:16 vertical prompt..."
    },
    {
      "text": "Slide 2 text...",
      "visual": "9:16 vertical prompt..."
    },
    {
      "text": "Slide 3 text...",
      "visual": "9:16 vertical prompt..."
    },
    {
      "text": "Slide 4 text...",
      "visual": "9:16 vertical prompt..."
    },
    {
      "text": "Slide 5 text...",
      "visual": "9:16 vertical prompt..."
    }
  ]
}`;

  const postData = JSON.stringify({
    prompt: prompt,
    max_tokens: 1500
  });

  await new Promise((resolve) => {
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('CF Llama 3.1 8B Status:', res.statusCode);
        try {
          const j = JSON.parse(buf.toString('utf8'));
          console.log('Full Result:', JSON.stringify(j.result, null, 2));
        } catch (e) {
          console.log('Parse error:', e.message);
        }
        resolve();
      });
    });
    req.write(postData);
    req.end();
  });
}

testCFPrompt();
