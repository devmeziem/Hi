#!/usr/bin/env node
/**
 * Repair scripts where apply-patches prepended code ABOVE the shebang.
 * Node only accepts #! on line 1; otherwise: SyntaxError Invalid or unexpected token
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd(), 'scripts');
if (!fs.existsSync(DIR)) {
  console.log('[shebang] no scripts dir');
  process.exit(0);
}

let fixed = 0;
for (const name of fs.readdirSync(DIR)) {
  if (!/\.(cjs|js)$/.test(name)) continue;
  const p = path.join(DIR, name);
  let t;
  try {
    t = fs.readFileSync(p, 'utf8');
  } catch {
    continue;
  }
  if (!t.includes('#!/usr/bin/env node') && !t.includes('#!/usr/bin/env node')) continue;

  const lines = t.split('\n');
  // Find all shebang lines
  const shebangIdx = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^#!\s*\/usr\/bin\/env\s+node/.test(lines[i].trim()) || lines[i].trim() === '#!/usr/bin/env node') {
      shebangIdx.push(i);
    }
  }
  if (!shebangIdx.length) continue;

  // If first line is already shebang and no extras, ok
  if (shebangIdx[0] === 0 && shebangIdx.length === 1) continue;

  // Collect non-shebang lines; keep one shebang at top
  const body = lines.filter((ln, i) => !shebangIdx.includes(i));
  // Drop leading empty lines in body
  while (body.length && body[0].trim() === '') body.shift();
  const next = '#!/usr/bin/env node\n' + body.join('\n');
  if (next !== t) {
    fs.writeFileSync(p, next);
    fixed++;
    console.log('[shebang] fixed', name, 'moved #! to line 1');
  }
}
console.log('[shebang] done, fixed', fixed);
