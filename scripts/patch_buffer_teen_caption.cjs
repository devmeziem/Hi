#!/usr/bin/env node
/** After Buffer publisher bootstrap, force TEEN_POST_TITLE into captions */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (!t.includes('async function postToTikTok')) {
  console.log('[buffer-caption] publisher not restored yet — skip');
  process.exit(0);
}
if (!t.includes('function preferEnvCaption')) {
  const inject = `function preferEnvCaption(fallback) {
  const title = (process.env.TEEN_POST_TITLE || process.env.POST_TITLE || '').trim();
  const desc = (process.env.TEEN_POST_DESCRIPTION || process.env.POST_DESCRIPTION || '').trim();
  if (title && desc) return title + '\\n\\n' + desc;
  if (title) return title + (fallback ? '\\n\\n' + String(fallback) : '');
  if (desc) return desc;
  return fallback || '';
}
`;
  t = inject + t;
  t = t.replace(/let caption = ([^;]+);/, 'let caption = preferEnvCaption($1);');
  t = t.replace(/const caption = ([^;]+);/, 'const caption = preferEnvCaption($1);');
}
// Strip metadata fields Buffer rejects
t = t.replace(/,?\s*allowComments\s*:\s*true/g, '');
t = t.replace(/,?\s*allowDuet\s*:\s*true/g, '');
t = t.replace(/,?\s*allowStitch\s*:\s*true/g, '');
fs.writeFileSync(p, t);
console.log('[buffer-caption] preferred env captions + stripped allow* fields');
