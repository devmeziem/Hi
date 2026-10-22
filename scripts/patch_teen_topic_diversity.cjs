#!/usr/bin/env node
/** Broaden Teen discovery beyond school exhaustion / social media fatigue */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_TOPIC_DIVERSITY_V1')) {
  console.log('[teen-div] already');
  process.exit(0);
}
const backup = t;

const newQueries = `  const queries = [
    // TEEN_TOPIC_DIVERSITY_V1 — rotate far beyond school/social fatigue
    'teenagers money habits saving first job',
    'youth friendship boundaries peer pressure',
    'teenagers sports discipline training mindset',
    'students creative hobbies vs scrolling',
    'young people career curiosity skills learning',
    'teen confidence public speaking fear',
    'youth sleep routine energy focus',
    'teenagers family expectations communication',
    'students exam nerves practical routines',
    'young people comparison jealousy online offline',
    'teen volunteering community purpose',
    'youth gaming balance goals',
    'teenagers starting small business side hustle legal',
    'students leadership club responsibility',
    'young people rejection resilience sports arts',
    'teen identity values faith culture respect',
    'students nutrition simple energy food',
    'youth boredom creativity making things',
    'teenagers apology friendship repair',
    'students time blocking calendar simple system'
  ];`;

if (/const queries = \[[\s\S]*?\];/.test(t)) {
  t = t.replace(/const queries = \[[\s\S]*?\];/, newQueries);
}

// News query broader
t = t.replace(
  /queryGoogleNewsRss\('teenagers OR youth stress OR "student anxiety" OR "peer pressure"'/,
  "queryGoogleNewsRss('teenagers OR youth OR students (skills OR sports OR friendship OR money OR sleep OR career OR confidence)'"
);

// System prompt diversity rule
if (t.includes('You write short-form TikTok/YouTube motivation for teens')) {
  t = t.replace(
    'You write short-form TikTok/YouTube motivation for teens 14-19.\nReturn STRICT JSON only. No markdown.\n\nRules:\n- Firm, respectful, never cringe, never preachy, never medical advice.\n- Pick ONE real youth problem grounded in the live search snippets.',
    `You write short-form TikTok/YouTube motivation for teens 14-19.\nReturn STRICT JSON only. No markdown.\n\nRules:\n- Firm, respectful, never cringe, never preachy, never medical advice.\n- TOPIC DIVERSITY: Do NOT default to school exhaustion, homework overload, or social media fatigue unless the live search is clearly only about that. Prefer money skills, sports discipline, friendship, confidence, sleep, hobbies, career curiosity, family communication, rejection resilience, creativity, leadership when possible.\n- Pick ONE real youth problem grounded in the live search snippets.`
  );
}

t = '/** TEEN_TOPIC_DIVERSITY_V1 */\n' + t;
// Keep shebang first
if (t.indexOf('#!/usr/bin/env node') > 0) {
  t = t.replace('/** TEEN_TOPIC_DIVERSITY_V1 */\n', '');
  t = t.replace('#!/usr/bin/env node', '#!/usr/bin/env node\n/** TEEN_TOPIC_DIVERSITY_V1 */');
}

try {
  fs.writeFileSync(p, t);
  execSync('node --check "' + p + '"', { stdio: 'pipe' });
  console.log('[teen-div] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-div] reverted', e.message);
}
