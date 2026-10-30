#!/usr/bin/env node
/** After Buffer publisher bootstrap, force TEEN_POST_TITLE into captions. Shebang-safe. */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');

// Ensure shebang is line 1 if present anywhere
if (t.includes('#!/usr/bin/env node') && !t.startsWith('#!/usr/bin/env node')) {
  const lines = t.split('\n');
  const body = lines.filter((ln) => !/^#!\s*\/usr\/bin\/env\s+node/.test(ln.trim()));
  t = '#!/usr/bin/env node\n' + body.join('\n');
}

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
  // insert after shebang / requires, not before shebang
  if (t.startsWith('#!')) {
    const lines = t.split('\n');
    let i = 1;
    while (i < lines.length && (lines[i].startsWith('const ') || lines[i].startsWith('/**') || lines[i].startsWith(' *') || lines[i] === '')) i++;
    lines.splice(i, 0, inject);
    t = lines.join('\n');
  } else {
    t = inject + t;
  }
  t = t.replace(/let caption = ([^;]+);/, 'let caption = preferEnvCaption($1);');
  t = t.replace(/const caption = ([^;]+);/, 'const caption = preferEnvCaption($1);');
}
t = t.replace(/,?\s*allowComments\s*:\s*true/g, '');
t = t.replace(/,?\s*allowDuet\s*:\s*true/g, '');
t = t.replace(/,?\s*allowStitch\s*:\s*true/g, '');
fs.writeFileSync(p, t);
console.log('[buffer-caption] preferred env captions + stripped allow* fields');
