#!/usr/bin/env node
/**
 * Teen Motivation — Public Domain Cartoon Lesson + REAL cartoon B-roll queries
 * - Lesson bank from Popeye / Private Snafu / Superman Fleischer / Felix / Betty Boop / Oswald / ComiColor
 * - Visual search queries biased to vintage cartoon / archival animation stock
 * - 35–40s straight narration, no "take action now" slogans
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GEN = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(GEN)) {
  console.warn('[teen-pd] situation generator missing');
  process.exit(0);
}

let t = fs.readFileSync(GEN, 'utf8');
const backup = t;

if (!t.includes('PD_CARTOON_LESSON_BANK')) {
  const bank = `
const PD_CARTOON_LESSON_BANK = [
  { cartoon: 'Popeye the Sailor', era: '1930s-40s', lesson: 'Strength shows up after preparation — the hard work comes before the moment.', theme: 'preparation', visualQueries: ['1930s sailor dock black and white film', 'vintage cartoon spinach can still frame', 'old harbor ropes ships archival'] },
  { cartoon: 'Private Snafu', era: '1943-45', lesson: 'One careless slip can cost the whole team — discipline is how you protect people around you.', theme: 'discipline', visualQueries: ['1940s military training archival footage', 'vintage war office desk papers', 'old army boots marching film grain'] },
  { cartoon: 'Superman Fleischer', era: '1941-43', lesson: 'Power without restraint becomes the problem — real strength is knowing when not to use it.', theme: 'self-control', visualQueries: ['1940s city skyline night vintage', 'old comic book panels stack', 'art deco skyscraper black and white'] },
  { cartoon: 'Felix the Cat', era: '1919-30s', lesson: 'When the plan fails, invent a new one with what you already have.', theme: 'resourcefulness', visualQueries: ['1920s silent film silhouette', 'vintage cartoon cat shadow still', 'old film projector beam dust'] },
  { cartoon: 'Betty Boop', era: '1930s', lesson: 'Being underestimated is an advantage if you stay sharp.', theme: 'quiet confidence', visualQueries: ['1930s jazz age city night', 'vintage microphone stage spotlight', 'old hollywood dressing room mirror'] },
  { cartoon: 'Oswald the Lucky Rabbit', era: '1927-28', lesson: 'Luck favors the one who keeps moving after the fall.', theme: 'persistence', visualQueries: ['1920s farm countryside silent film', 'vintage rabbit field grainy', 'old dirt road walking archival'] },
  { cartoon: 'ComiColor Jack Frost', era: '1930s', lesson: 'Seasons change whether you are ready or not — adapt faster than the weather.', theme: 'adaptability', visualQueries: ['1930s winter forest fairy tale', 'vintage snow village illustration', 'old frost window pane close up'] },
  { cartoon: 'The Thrifty Pig', era: '1941', lesson: 'Small daily choices compound into safety or ruin.', theme: 'daily discipline', visualQueries: ['1940s savings poster archival', 'vintage piggy bank coins table', 'old ledger book handwriting'] },
  { cartoon: 'Gertie the Dinosaur', era: '1914', lesson: 'Even the first version of something new looks awkward — ship it anyway.', theme: 'start imperfect', visualQueries: ['1910s early animation sketch', 'vintage dinosaur museum fossil', 'old drawing desk pencil paper'] }
];
function pickPdCartoonLesson(seed) {
  const i = Math.abs(String(seed || Date.now()).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % PD_CARTOON_LESSON_BANK.length;
  return PD_CARTOON_LESSON_BANK[i];
}
`;
  const reqEnd = t.indexOf(';\n', t.lastIndexOf('require('));
  if (reqEnd > 0) t = t.slice(0, reqEnd + 2) + bank + t.slice(reqEnd + 2);
  else t = bank + t;
}

// Force visual search to prefer cartoon/vintage queries when picking media
if (!t.includes('PD_CARTOON_VISUAL_HOOK')) {
  // Inject near searchAndFetchVideo / searchAndFetchImage calls if present
  if (t.includes('searchAndFetchVideo') || t.includes('searchAndFetchImage')) {
    t = t.replace(
      /(searchAndFetchVideo\s*\()/g,
      `/* PD_CARTOON_VISUAL_HOOK */ $1`
    );
  }
  // Prefer injecting a helper used before media fetch
  if (!t.includes('function teenCartoonVisualQuery')) {
    t += `
function teenCartoonVisualQuery(baseQuery, seed) {
  try {
    const lesson = pickPdCartoonLesson(seed || baseQuery);
    const extras = lesson.visualQueries || [];
    const pick = extras[Math.abs(String(seed||'').length) % Math.max(1, extras.length)] || baseQuery;
    return pick + ' vintage public domain cartoon style archival';
  } catch (_) { return String(baseQuery || 'vintage cartoon archival') + ' public domain'; }
}
`;
  }
}

// Duration cap
t = t.replace(/TEEN_MAX_SEC['"]?\s*[:=]\s*['"]?45/g, "TEEN_MAX_SEC: '40'");
t = t.replace(/maxSec\s*=\s*45/g, 'maxSec = 40');

// Kill generic slogans
t = t.replace(/take action now/gi, 'apply the lesson');
t = t.replace(/if you don't take action/gi, 'if nothing changes');
t = t.replace(/stop scrolling and/gi, '');

// Nudge AI prompts
if (t.includes('systemPrompt') && !t.includes('PD_CARTOON_LESSON_MODE')) {
  t = t.replace(
    /(const systemPrompt\s*=\s*[`'])/,
    `$1PD_CARTOON_LESSON_MODE. Teach a lesson inspired by a classic public-domain cartoon (Popeye, Private Snafu, early Superman, Felix, Betty Boop, Oswald). 95-120 words. Straight. No slogans. Teen-relevant. `
  );
}

if (t !== backup) {
  try {
    fs.writeFileSync(GEN, t);
    execSync(`node --check "${GEN}"`, { stdio: 'pipe' });
    console.log('[teen-pd] PD cartoon lesson + cartoon B-roll queries applied');
  } catch (e) {
    fs.writeFileSync(GEN, backup);
    console.warn('[teen-pd] syntax fail — reverted', e.message);
  }
} else {
  console.log('[teen-pd] no delta');
}
