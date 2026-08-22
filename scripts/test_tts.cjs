const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testTTS() {
  console.log('=== TEST: Cloudflare Workers AI Aura-2 TTS ===');
  const postData = JSON.stringify({ text: 'Hello, this is a test of Cloudflare Aura-2 TTS.' });
  const model = '@cf/deepgram/aura-2-en';

  await new Promise((resolve) => {
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Buffer length:', buf.length);
        if (buf.length < 500) {
          console.log('Body:', buf.toString('utf8'));
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.log('Error:', e.message); resolve(); });
    req.write(postData);
    req.end();
  });
}

testTTS();
