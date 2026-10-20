#!/usr/bin/env node
/**
 * Buffer TikTok publisher bootstrap.
 * Workflows curl the known-good body, then apply_buffer_ai_flag.cjs sets AI ticks.
 * Soft-fail if not restored yet.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SELF = __filename;
const GOOD =
  'https://raw.githubusercontent.com/devmeziem/Hi/a00c9e83c801f94513ff002978558c5ee8c113bf/scripts/publish_buffer_second_tiktok.cjs';

function restore() {
  const tmp = SELF + '.tmp';
  execSync(`curl -fsSL "${GOOD}" -o "${tmp}"`, { stdio: 'pipe', timeout: 25000 });
  let body = fs.readFileSync(tmp, 'utf8');
  try { fs.unlinkSync(tmp); } catch (_) {}
  if (!body.includes('createPost') || body.length < 1000) {
    throw new Error('bad restore body');
  }
  // Force AI flags
  if (!body.includes('aiAssisted')) {
    body = body.replace(
      /(schedulingType:\s*'automatic',\s*\n\s*mode:\s*mode,)/,
      "$1\n    aiAssisted: true,"
    );
  }
  body = body.replace(/isAiGenerated:\s*false/g, 'isAiGenerated: true');
  if (!body.includes('isAiGenerated: true')) {
    body = body.replace(
      /(metadata:\s*\{\s*tiktok:\s*\{)/,
      '$1\n        isAiGenerated: true,'
    );
  }
  if (!body.includes("is_ai_generated")) {
    body = body.replace(
      /form\.append\('now', SHARE_NOW \? 'true' : 'false'\);/,
      "form.append('now', SHARE_NOW ? 'true' : 'false');\n    form.append('is_ai_generated', 'true');"
    );
  }
  fs.writeFileSync(SELF, body);
  execSync(`node --check "${SELF}"`, { stdio: 'pipe' });
  console.log('[buffer-publisher] restored + AI flags');
}

const cur = fs.readFileSync(SELF, 'utf8');
if (!cur.includes('async function postToTikTok') || cur.includes('placeholder should be overwritten')) {
  try {
    restore();
  } catch (e) {
    console.error('[buffer-publisher] restore failed:', e.message);
    process.exit(1);
  }
}

// Re-exec real file after restore (avoid bootstrap loop)
delete require.cache[SELF];
require(SELF);
