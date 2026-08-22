const https = require('https');

const XAI_API_KEYS = [
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY
].filter(Boolean);

async function testGrokModels() {
  const modelsToTest = [
    'grok-4',
    'grok-4.1-fast',
    'grok-4.3',
    'grok-2-latest',
    'grok-2-1212',
    'grok-2',
    'grok-beta'
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting Grok model: ${model}`);
    await new Promise((resolve) => {
      const postData = JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "Grok is active"' }],
        max_tokens: 30
      });

      const apiKey = XAI_API_KEYS[0] || '';
      const req = https.request('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}, Body: ${d.slice(0, 120)}`);
          resolve();
        });
      });
      req.on('error', e => { console.log('Err:', e.message); resolve(); });
      req.write(postData);
      req.end();
    });
  }
}

testGrokModels();
