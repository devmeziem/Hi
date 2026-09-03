const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

async function testGroqModels() {
  if (!GROQ_API_KEY) {
    console.log('No GROQ_API_KEY found in process.env, testing with standard model list query...');
  }

  // 1. Fetch available models from Groq endpoint if key exists
  if (GROQ_API_KEY) {
    console.log('--- Fetching Active Models from Groq API ---');
    await new Promise((resolve) => {
      const req = https.get('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        timeout: 8000
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(d);
            if (json.data && Array.isArray(json.data)) {
              console.log('Official Active Groq Models:');
              json.data.forEach(m => console.log(`  - ${m.id} (owned by ${m.owned_by || 'groq'})`));
            } else {
              console.log('Models response:', d.slice(0, 160));
            }
          } catch {
            console.log('Raw response:', d.slice(0, 160));
          }
          resolve();
        });
      });
      req.on('error', e => { console.log('Fetch models error:', e.message); resolve(); });
      req.on('timeout', () => { req.destroy(); console.log('Fetch models timeout'); resolve(); });
    });
  }

  const verifiedGroqModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'deepseek-r1-distill-llama-70b',
    'gemma2-9b-it'
  ];

  for (const model of verifiedGroqModels) {
    console.log(`\nTesting Verified Groq model: ${model}`);
    await new Promise((resolve) => {
      const postData = JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "Groq active" in 2 words.' }],
        max_tokens: 30
      });

      const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 8000
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          console.log(`Model [${model}] -> Status: ${res.statusCode} | Result: ${d.slice(0, 140)}`);
          resolve();
        });
      });
      req.on('error', e => { console.log(`Model [${model}] Error:`, e.message); resolve(); });
      req.on('timeout', () => { req.destroy(); console.log(`Model [${model}] Timeout`); resolve(); });
      req.write(postData);
      req.end();
    });
  }
}

testGroqModels();

