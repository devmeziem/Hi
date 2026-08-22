const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const xaiKey = process.env.XAI_API_KEY || '';

async function diagnose() {
  // Test xAI with 'grok-beta', 'grok-2', 'grok-2-1212', 'grok-vision-beta'
  const models = ['grok-beta', 'grok-2', 'grok-2-1212', 'grok-vision-beta'];
  for (const m of models) {
    await new Promise((resolve) => {
      const post = JSON.stringify({
        model: m,
        messages: [{ role: 'user', content: 'Say hello in 3 words' }]
      });
      const req = https.request('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + xaiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          console.log(`xAI [${m}] Status:`, res.statusCode, 'body:', Buffer.concat(chunks).toString().slice(0, 150));
          resolve();
        });
      });
      req.write(post);
      req.end();
    });
  }

  // Test Cloudflare Workers AI with proper prompt format
  const cfModels = [
    '@cf/meta/llama-3.3-70b-instruct',
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3-8b-instruct'
  ];
  for (const cfm of cfModels) {
    await new Promise((resolve) => {
      const post = JSON.stringify({
        prompt: 'You are an expert script writer. Write a 1-sentence tip on launching an online business.'
      });
      const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${cfm}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          console.log(`CF [${cfm}] Status:`, res.statusCode, 'body:', Buffer.concat(chunks).toString().slice(0, 150));
          resolve();
        });
      });
      req.write(post);
      req.end();
    });
  }

  // Test Groq API Key
  const groqKey = process.env.GROQ_API_KEY || '';
  const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const gm of groqModels) {
    await new Promise((resolve) => {
      const post = JSON.stringify({
        model: gm,
        messages: [{ role: 'user', content: 'Say hello in 3 words' }]
      });
      const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + groqKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          console.log(`Groq [${gm}] Status:`, res.statusCode, 'body:', Buffer.concat(chunks).toString().slice(0, 150));
          resolve();
        });
      });
      req.write(post);
      req.end();
    });
  }
}

diagnose();
