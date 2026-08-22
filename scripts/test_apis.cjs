const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testAll() {
  console.log('=== TEST 1: Cloudflare Workers AI Image Generation (@cf/black-forest-labs/flux-1-schnell) ===');
  const postDataImg = JSON.stringify({ prompt: 'A futuristic digital currency vault with glowing green indicators, 8k vertical 9:16 cinematic luxury' });
  await new Promise((resolve) => {
    const req = https.request('https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/@cf/black-forest-labs/flux-1-schnell', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postDataImg)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('Cloudflare Flux Status:', res.statusCode);
        try {
          const json = JSON.parse(buf.toString('utf8'));
          console.log('Cloudflare Flux result keys:', Object.keys(json), 'image base64 len:', json.result?.image ? json.result.image.length : 'none');
        } catch (e) {
          console.log('Cloudflare Flux raw length:', buf.length);
        }
        resolve();
      });
    });
    req.write(postDataImg);
    req.end();
  });

  console.log('\n=== TEST 2: Grok 2 (xAI) API ===');
  const XAI_KEYS = [process.env.XAI_API_KEY].filter(Boolean);
  for (const k of XAI_KEYS) {
    await new Promise((resolve) => {
      const post = JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: 'Say OK' }]
      });
      const req = https.request('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + k,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          console.log('xAI Key (' + k.slice(0, 10) + '...) Status:', res.statusCode, 'body:', Buffer.concat(chunks).toString().slice(0, 150));
          resolve();
        });
      });
      req.write(post);
      req.end();
    });
  }

  console.log('\n=== TEST 3: Cloudflare LLM (@cf/meta/llama-3.3-70b-instruct) ===');
  const postLlm = JSON.stringify({
    messages: [
      { role: 'system', content: 'You are an AI assistant.' },
      { role: 'user', content: 'Write a 1-sentence tip on starting a business.' }
    ]
  });
  await new Promise((resolve) => {
    const req = https.request('https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/@cf/meta/llama-3.3-70b-instruct', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postLlm)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        console.log('Cloudflare Llama 3.3 Status:', res.statusCode);
        try {
          const j = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          console.log('Cloudflare Llama 3.3 Response:', j.result?.response?.slice(0, 120));
        } catch(e) {
          console.log('Cloudflare Llama error:', e.message);
        }
        resolve();
      });
    });
    req.write(postLlm);
    req.end();
  });
}
testAll();
