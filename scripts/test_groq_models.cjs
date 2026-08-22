const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

async function testGroqModels() {
  const modelsToTest = [
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'deepseek-r1-distill-llama-70b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama3-70b-8192',
    'llama-3.3-70b-versatile',
    'qwen/qwen3.6-27b'
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting Groq model: ${model}`);
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
        timeout: 6000
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
