const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testFluxPrompt(prompt) {
  console.log('Testing Cloudflare Flux Schnell with prompt:', prompt);
  const postData = JSON.stringify({
    prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic`
  });

  const model = '@cf/black-forest-labs/flux-1-schnell';
  await new Promise((resolve) => {
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('Status:', res.statusCode);
        try {
          const j = JSON.parse(buf.toString('utf8'));
          console.log('Result has image field:', !!j.result?.image);
          if (j.result?.image) {
            console.log('Image base64 length:', j.result.image.length);
          }
        } catch(e) {
          console.log('Non-json or binary response, length:', buf.length);
        }
        resolve();
      });
    });
    req.on('error', e => { console.log('Error:', e.message); resolve(); });
    req.write(postData);
    req.end();
  });
}

testFluxPrompt('Marcus Aurelius ancient Roman marble statue in dramatic golden hour mist, hyperdetailed');
