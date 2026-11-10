#!/usr/bin/env node
/**
 * Teen Motivation — Public Domain Cartoon Lesson mode
 * - Pick a classic PD cartoon (Popeye, early Superman, Felix, Private Snafu, Betty Boop, Oswald, ComiColor…)
 * - Extract / invent a clear life lesson from that story
 * - Narration 35–40s, straight to the point (NO "take action now" slogans)
 * - B-roll preference: clips/images themed to that cartoon era + lesson
 * - 5s format remains separate: stoic-psych for teens, no VO, loopable, high-contrast text
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

// Inject PD cartoon lesson bank + prompt override near top if not present
if (!t.includes('PD_CARTOON_LESSON_BANK')) {
  const bank = `
const PD_CARTOON_LESSON_BANK = [
  { cartoon: 'Popeye the Sailor', era: '1930s–40s', lesson: 'Strength comes after you do the hard thing first — spinach was the metaphor for preparation.', theme: 'preparation over panic', visual: '1930s sailor dock vintage cartoon black and white' },
  { cartoon: 'Private Snafu', era: '1943–45', lesson: 'One careless mistake can cost the whole team — discipline is not optional when stakes are real.', theme: 'discipline under pressure', visual: '1940s military training archival film grain' },
  { cartoon: 'Superman Fleischer', era: '1941–43', lesson: 'Power without restraint becomes the problem — real strength is knowing when not to use it.', theme: 'self-control', visual: '1940s city skyline night vintage comic' },
  { cartoon: 'Felix the Cat', era: '1919–30s', lesson: 'When the plan fails, invent a new one with what you already have.', theme: 'resourcefulness', visual: '1920s silent film cat silhouette vintage' },
  { cartoon: 'Betty Boop', era: '1930s', lesson: 'Being underestimated is an advantage if you stay sharp.', theme: 'quiet confidence', visual: '1930s jazz age city night vintage' },
  { cartoon: 'Oswald the Lucky Rabbit', era: '1927–28', lesson: 'Luck favors the one who keeps moving after the fall.', theme: 'persistence', visual: '1920s farm countryside silent film' },
  { cartoon: 'ComiColor / Jack Frost', era: '1930s', lesson: 'Seasons change whether you are ready or not — adapt faster than the weather.', theme: 'adaptability', visual: '1930s winter forest fairy tale animation' },
  { cartoon: 'The Thrifty Pig', era: '1941', lesson: 'Small daily choices compound into safety or ruin.', theme: 'daily discipline', visual: '1940s savings war poster archival' },
  { cartoon: 'Education for Death', era: '1943', lesson: 'What you are taught early shapes what you accept later — question the story.', theme: 'critical thinking', visual: '1940s classroom archival documentary' },
  { cartoon: 'Gertie the Dinosaur', era: '1914', lesson: 'Even the first version of something new looks awkward — ship it anyway.', theme: 'start imperfect', visual: '1910s early animation dinosaur sketch' }
];
function pickPdCartoonLesson(seed) {
  const i = Math.abs(String(seed || Date.now()).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % PD_CARTOON_LESSON_BANK.length;
  return PD_CARTOON_LESSON_BANK[i];
}
`;
  // Insert after first require block
  const reqEnd = t.indexOf(';\n', t.lastIndexOf('require('));
  if (reqEnd > 0) {
    t = t.slice(0, reqEnd + 2) + bank + t.slice(reqEnd + 2);
  } else {
    t = bank + t;
  }
}

// Cap duration language
t = t.replace(/TEEN_MAX_SEC['"]?\s*[:=]\s*['"]?45/g, "TEEN_MAX_SEC: '40'");
t = t.replace(/maxSec\s*=\s*45/g, 'maxSec = 40');
t = t.replace(/45\s*seconds/gi, '38 seconds');

// Strip generic action slogans from prompts if present
t = t.replace(/take action now/gi, 'apply the lesson');
t = t.replace(/if you don't take action/gi, 'if nothing changes');
t = t.replace(/stop scrolling and/gi, '');

// Nudge system / user prompts toward PD lesson style when AI is called
if (t.includes('callActiveAi') || t.includes('generateScript') || t.includes('systemPrompt')) {
  if (!t.includes('PD_CARTOON_LESSON_MODE')) {
    t = t.replace(
      /(const systemPrompt\s*=\s*[`'])/,
      `$1PD_CARTOON_LESSON_MODE. Use a lesson inspired by a classic public-domain cartoon (Popeye, Private Snafu, early Superman, Felix, Betty Boop, Oswald). 95-120 words. Straight to the point. No slogans like take action now. Teen-relevant. `
    );
  }
}

if (t !== backup) {
  try {
    fs.writeFileSync(GEN, t);
    execSync(`node --check "${GEN}"`, { stdio: 'pipe' });
    console.log('[teen-pd] PD cartoon lesson mode + 35-40s cap applied');
  } catch (e) {
    fs.writeFileSync(GEN, backup);
    console.warn('[teen-pd] syntax fail — reverted', e.message);
  }
} else {
  console.log('[teen-pd] no delta');
}

// 5s boost: force high-contrast text, loop-friendly, no VO already expected
const BOOST = path.join(process.cwd(), 'scripts', 'generate_teen_boost_5s_reel.cjs');
if (fs.existsSync(BOOST)) {
  let b = fs.readFileSync(BOOST, 'utf8');
  const bb = b;
  b = b.replace(/BorderStyle,\s*3/g, 'BorderStyle,1');
  b = b.replace(/&H80000000/g, '&H00000000');
  if (!b.includes('stoic psychology for teens')) {
    b = b.replace(
      /(const|let)\s+(HOOKS|QUOTES|LINES)\s*=/,
      `// stoic psychology for teens — high contrast loop\n$1 $2 =`
    );
  }
  if (b !== bb) {
    fs.writeFileSync(BOOST, b);
    console.log('[teen-pd] 5s boost contrast hardened');
  }
}
