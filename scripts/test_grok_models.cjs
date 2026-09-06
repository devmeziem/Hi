const { fetchAndVerifyGrokModels } = require('./grok_model_finder.cjs');

async function testGrokModels() {
  console.log('=== AUTO-DISCOVERING & TESTING GROK MODELS ===');
  const activeModels = await fetchAndVerifyGrokModels(true);
  console.log(`\nDiscovered ${activeModels.length} candidate models:`, activeModels.join(', '));
}

testGrokModels();
