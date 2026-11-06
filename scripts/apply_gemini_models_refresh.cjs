#!/usr/bin/env node
/** Refresh Gemini model list to current IDs in topic_discovery_engine. */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'topic_discovery_engine.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
const before = t;
t = t.replace(
  /const models = \[[^\]]*gemini[^\]]*\];/,
  "const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];"
);
if (t !== before) {
  fs.writeFileSync(p, t);
  console.log('[gemini-models] refreshed');
} else {
  console.log('[gemini-models] ok');
}
