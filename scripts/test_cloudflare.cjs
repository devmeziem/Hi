const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testCloudflare() {
  console.log('--- 1. Testing Cloudflare Flux 1 Schnell ---');
  await new Promise((resolve) => {
    const postData = JSON.stringify({ prompt: 'cyberpunk neon city 8k vertical' });
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log(`Flux response status: ${res.statusCode}, content-type: ${res.headers['content-type']}, length: ${buf.length}`);
        if (buf.length < 500) {
          console.log('Body:', buf.toString('utf8'));
        }
        resolve();
      });
    });
    req.on('error', e => { console.log('Flux error:', e.message); resolve(); });
    req.write(postData);
    req.end();
  });

  console.log('\n--- 2. Testing Cloudflare Deepgram Aura-2 TTS ---');
  await new Promise((resolve) => {
    const postData = JSON.stringify({ text: 'Testing Cloudflare Deepgram Aura-2 voice synthesis.', speaker: 'zeus' });
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/deepgram/aura-2-en`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log(`TTS response status: ${res.statusCode}, content-type: ${res.headers['content-type']}, length: ${buf.length}`);
        if (buf.length < 500) {
          console.log('Body:', buf.toString('utf8'));
        }
        resolve();
      });
    });
    req.on('error', e => { console.log('TTS error:', e.message); resolve(); });
    req.write(postData);
    req.end();
  });
}

testCloudflare();
