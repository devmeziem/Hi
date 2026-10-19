#!/usr/bin/env node
/**
 * One-shot runner patch: louder BGM under VO, Motivation/Stoic prosody where present.
 * Safe to run at the start of any workflow.
 */
const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(process.cwd(), 'scripts');
const files = fs.existsSync(scriptsDir)
  ? fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.cjs') || f.endsWith('.js'))
  : [];

const replacements = [
  // Quiet BGM → audible under voice
  [/volume=0\.08/g, 'volume=0.26'],
  [/volume=0\.10/g, 'volume=0.28'],
  [/volume=0\.12/g, 'volume=0.28'],
  [/volume=0\.14/g, 'volume=0.30'],
  [/volume=0\.15/g, 'volume=0.30'],
  [/volume=0\.16/g, 'volume=0.30'],
  [/volume=0\.18/g, 'volume=0.30']
];

let total = 0;
for (const f of files) {
  const p = path.join(scriptsDir, f);
  let t = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [re, to] of replacements) {
    const before = t;
    t = t.replace(re, to);
    if (t !== before) n++;
  }
  // Teen motivation prosody if file is teen generator
  if (f.includes('teen_motivation')) {
    const b = t;
    t = t.replace(/rate:\s*['"]-4%['"]/g, "rate: '-5%'");
    t = t.replace(/pitch:\s*['"]-10Hz['"]/g, "pitch: '-15Hz'");
    t = t.replace(/rate:\s*['"]-3%['"]/g, "rate: '-5%'");
    if (t !== b) n++;
  }
  // Stoic locked prosody hints in long video
  if (f.includes('stoic_long') || f.includes('generate_stoic_long')) {
    const b = t;
    t = t.replace(/rate:\s*['"]-6%['"]/g, "rate: '-12%'");
    t = t.replace(/pitch:\s*['"]-15Hz['"]/g, "pitch: '-25Hz'");
    if (t !== b) n++;
  }
  if (n) {
    fs.writeFileSync(p, t);
    total += n;
    console.log('[content-system]', f, 'patches', n);
  }
}
console.log('[content-system] total file touches', total);
