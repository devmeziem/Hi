#!/usr/bin/env node
/**
 * Force Buffer → TikTok AI disclosure flags in publisher script.
 * Soft-fail: never throws; skips if already present or file missing.
 * Does NOT modify captions/descriptions.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(p)) {
  console.warn('[buffer-ai] publisher missing — skip');
  process.exit(0);
}

let t = fs.readFileSync(p, 'utf8');
if (t.includes('placeholder should be overwritten') || t.length < 500) {
  console.warn('[buffer-ai] publisher still placeholder — skip until restore');
  process.exit(0);
}

if (t.includes('isAiGenerated: true') && t.includes('aiAssisted: true')) {
  console.log('[buffer-ai] flags already present');
  process.exit(0);
}

const backup = t;

// Inject top-level aiAssisted if missing near createPost input
if (!t.includes('aiAssisted')) {
  t = t.replace(
    /(schedulingType:\s*['"]automatic['"],\s*\n\s*mode:\s*mode,)/,
    "$1\n    aiAssisted: true,"
  );
}

// Force tiktok.isAiGenerated true
if (!t.includes('isAiGenerated')) {
  t = t.replace(
    /(metadata:\s*\{\s*tiktok:\s*\{)/,
    '$1\n        isAiGenerated: true,'
  );
} else {
  t = t.replace(/isAiGenerated:\s*false/g, 'isAiGenerated: true');
}

// REST fallback form field
if (!t.includes("is_ai_generated")) {
  t = t.replace(
    /form\.append\(['"]now['"],\s*SHARE_NOW[^)]*\);/,
    (m) => m + "\n    form.append('is_ai_generated', 'true');"
  );
}

if (t === backup) {
  console.log('[buffer-ai] no structural change needed');
  process.exit(0);
}

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[buffer-ai] isAiGenerated=true aiAssisted=true applied');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[buffer-ai] syntax fail — reverted (non-fatal)');
}
