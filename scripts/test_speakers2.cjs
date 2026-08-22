const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testSpeakersMore() {
  const speakers = ['orpheus', 'arcas', 'zeus', 'asteria', 'hera', 'luna', 'stella', 'athena', 'aries'];
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
          if (res.statusCode === 400) {
            console.log(`Speaker '${spk}': 400 error body:`, buf.toString('utf8'));
          } else {
            console.log(`Speaker '${spk}': status=${res.statusCode}, bytes=${buf.length}`);
          }
          resolve();
        });
      });
      req.write(postData);
      req.end();
    });
  }
}

testSpeakersMore();
