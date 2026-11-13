#!/usr/bin/env node
/** Force TEEN_POST_TITLE + TEEN_POST_DESCRIPTION into Buffer teen captions. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'publish_buffer_second_tiktok.cjs');
if (!fs.existsSync(p)) process.exit(0);

let t = fs.readFileSync(p, 'utf8');
const backup = t;

if (t.includes('#!/usr/bin/env node') && !t.startsWith('#!/usr/bin/env node')) {
  const lines = t.split('\n');
  const body = lines.filter((ln) => !/^#!\s*\/usr\/bin\/env\s+node/.test(ln.trim()));
  t = '#!/usr/bin/env node\n' + body.join('\n');
}

if (!t.includes('async function postToTikTok')) {
  console.log('[buffer-caption] publisher not restored yet — skip');
  process.exit(0);
}

// Load meta if env empty
let metaTitle = (process.env.TEEN_POST_TITLE || '').trim();
let metaDesc = (process.env.TEEN_POST_DESCRIPTION || '').trim();
if (!metaTitle || !metaDesc) {
  try {
    const metaPath = path.join(process.cwd(), 'rendered_videos', 'teen_motivation_meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (!metaTitle) metaTitle = String(meta.title || '').trim();
      if (!metaDesc) metaDesc = String(meta.description || '').trim();
      const tags = Array.isArray(meta.hashtags) ? meta.hashtags.join(' ') : '#MindRush #TeenMotivation #FYP #Shorts';
      if (metaDesc && !metaDesc.includes('#')) metaDesc = metaDesc + '\n\n' + tags;
    }
  } catch (_) {}
}

if (!t.includes('function preferEnvCaption')) {
  const inject = `
function preferEnvCaption(fallback) {
  const title = (process.env.TEEN_POST_TITLE || ${JSON.stringify(metaTitle)} || process.env.POST_TITLE || '').trim();
  const desc = (process.env.TEEN_POST_DESCRIPTION || ${JSON.stringify(metaDesc)} || process.env.POST_DESCRIPTION || '').trim();
  if (title && desc) return title + '\\n\\n' + desc;
  if (title) return title + (fallback ? '\\n\\n' + String(fallback) : '');
  if (desc) return desc;
  return fallback || '';
}
`;
  if (t.startsWith('#!')) {
    const lines = t.split('\n');
    let i = 1;
    while (i < lines.length && (lines[i].startsWith('const ') || lines[i].startsWith('/**') || lines[i].startsWith(' *') || lines[i] === '' || lines[i].startsWith('//'))) i++;
    lines.splice(i, 0, inject);
    t = lines.join('\n');
  } else {
    t = inject + t;
  }
}

// Force teen_motivation branch to use preferEnvCaption / meta
if (t.includes("channelType === 'teen_motivation'") || t.includes('channelType === "teen_motivation"')) {
  t = t.replace(
    /(channelType === ['"]teen_motivation['"][\s\S]{0,3000}?)(\bcaption\s*=\s*)([^;]+;)/,
    '$1$2 preferEnvCaption($3);'
  );
}

t = t.replace(/,?\s*allowComments\s*:\s*true/g, '');
t = t.replace(/,?\s*allowDuet\s*:\s*true/g, '');
t = t.replace(/,?\s*allowStitch\s*:\s*true/g, '');

try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[buffer-caption] teen title/desc wired:', metaTitle.slice(0, 60) || '(env/meta)');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[buffer-caption] teen caption patch reverted:', e.message);
}
