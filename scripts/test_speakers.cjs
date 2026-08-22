const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

// Let's test speaker options for aura-2-en: e.g., speaker: 'orpheus', 'helios', 'arcas', 'perseus', 'angus', 'zeus' or others
async function testAuraSpeakers() {
  console.log('Testing speaker options for @cf/deepgram/aura-2-en...');
  const speakers = ['orpheus', 'arcas', 'perseus', 'angus', 'helios', 'zeus', 'plato'];
  for (const spk of speakers) {
    const postData = JSON.stringify({
      text: 'Rule one: Master your thoughts and master your life.',
      speaker: spk
    });
    await new Promise((resolve) => {
      const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/deepgram/aura-2-en`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          console.log(`Speaker '${spk}': status=${res.statusCode}, bytes=${buf.length}`);
          resolve();
        });
      });
      req.write(postData);
      req.end();
    });
  }
}

testAuraSpeakers();
