/**
 * EMERGENCY RESTORE WRAPPER for generate_stoic_long_video.cjs
 * Writes patched source into scripts/ so relative requires work.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GOOD_REF = 'a00c9e83c801f94513ff002978558c5ee8c113bf';
const SCRIPTS_DIR = __dirname;
const CACHE = path.join(SCRIPTS_DIR, '_restored_stoic_long_src.cjs');
const PATCHED = path.join(SCRIPTS_DIR, '_patched_stoic_long_run.cjs');

function ensureRestored() {
  if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 20000) return CACHE;
  try {
    execSync(`git show ${GOOD_REF}:scripts/generate_stoic_long_video.cjs > "${CACHE}"`, { stdio: 'pipe', cwd: path.join(SCRIPTS_DIR, '..') });
    if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 20000) return CACHE;
  } catch (_) {}
  try {
    execSync(`curl -sL "https://raw.githubusercontent.com/devmeziem/Hi/${GOOD_REF}/scripts/generate_stoic_long_video.cjs" -o "${CACHE}"`, { stdio: 'pipe' });
  } catch (_) {}
  if (!fs.existsSync(CACHE) || fs.statSync(CACHE).size < 20000) {
    throw new Error('Could not restore generate_stoic_long_video.cjs from history.');
  }
  return CACHE;
}

function patchSource(src) {
  let text = src;
  text = text.replace(
    "let edgeRate = '-6%';\n  let edgePitch = '-15Hz';",
    "let edgeRate = '-12%';\n  let edgePitch = '-25Hz';"
  );

  if (text.includes('const viralTitle =')) {
    text = text.replace(
      /const viralTitle = `\$\{philosopher\.name\}: \$\{essayData\.title\.replace\(\/\[\?\!\.\]\+\$\/, ''\)\} #Shorts`;/,
      `const problemHooks = ['Why your mind feels heavy', 'Stop fighting the wrong battle', 'The quiet rule most people miss', 'When overthinking takes over', 'A calmer way to face hard days'];
      const hookPick = problemHooks[Math.floor(Math.random() * problemHooks.length)];
      const viralTitle = \`\${hookPick} (\${philosopher.name})\`;`
    );
  }
  if (text.includes('const viralDesc =')) {
    text = text.replace(
      /const viralDesc = `"\$\{quote\}" — \$\{philosopher\.name\} \(\$\{philosopher\.title\}\)[\s\S]*?#Shorts`;/,
      `const viralDesc = \`One idea from Stoicism you can use today.\n\n\"\${quote}\" — \${philosopher.name}\n\n\${(fullNarration || '').slice(0, 500)}\n\nIf this landed, leave one word below.\n\n\${ctaChannel}\n\n#Stoicism #\${String(philosopher.name).replace(/\\s+/g, '')} #InnerPeace #Mindset #Philosophy #MentalClarity\`;`
    );
  }

  const seedMarker = 'Utilizing resilient seed test essay';
  if (text.includes(seedMarker)) {
    const start = text.indexOf('  // Seed Test Data Safety Net');
    const end = text.indexOf('bgmSearchQuery: "hans zimmer interstellar stay ambient piano strings"');
    if (start >= 0 && end > start) {
      const endSemi = text.indexOf('};', end) + 2;
      const zeroAi = `  // ZERO-AI FALLBACK\n  console.log(\`[Stoic AI] Using zero-AI public-domain essay path for \${philosopher.name}...\`);\n  const q = String(quote || (philosopher.famousQuotes && philosopher.famousQuotes[0]) || 'You have power over your mind — not outside events.').trim();\n  const name = philosopher.name;\n  const era = philosopher.era || 'ancient philosophy';\n  return {\n    title: \`\${name}: A Quiet Law of the Mind\`,\n    hook: \`Most people fight the wrong battle. \${name} (\${era}) saw it clearly.\`,\n    audioSearchQuery: "calm emotional piano ambient reflection quiet soft strings",\n    scenes: [\n      { sceneNumber: 1, spokenText: \`When life feels heavy, the first instinct is to blame the world. \${name} taught a different discipline.\`, videoSearchQuery: "solitary figure foggy landscape contemplative dawn", imageSearchQuery: "foggy mountain path lone walker soft light", transition: "slide_right_in" },\n      { sceneNumber: 2, spokenText: \`The teaching is simple and exact: "\${q.length > 140 ? q.slice(0, 137) + '…' : q}". It points at judgment, not events.\`, videoSearchQuery: "rain on window night reflection moody", imageSearchQuery: "rainy window night city soft bokeh", transition: "pan_zoom" },\n      { sceneNumber: 3, spokenText: "Modern psychology agrees: suffering often grows from the story we tell ourselves about what happened, not only from the event itself.", videoSearchQuery: "calm ocean waves golden hour slow", imageSearchQuery: "peaceful ocean horizon golden light", transition: "slide_right_in" },\n      { sceneNumber: 4, spokenText: "You cannot control every outcome. You can control the quality of your attention and your next honest action.", videoSearchQuery: "open road empty quiet sunrise", imageSearchQuery: "empty road sunrise solitude calm", transition: "pan_zoom" },\n      { sceneNumber: 5, spokenText: "Practice once today. Notice the story in your head. Soften it. Then move with quiet strength. If this helped, leave one word that describes how you feel.", videoSearchQuery: "sunrise over hills soft clouds peaceful", imageSearchQuery: "golden sunrise hills soft clouds", transition: "slide_left_out" }\n    ],\n    hashtags: ["#Stoicism", "#InnerPeace", "#MentalHealth", "#Mindset", "#Philosophy"]\n  };`;
      text = text.slice(0, start) + zeroAi + text.slice(endSemi);
    }
  }

  const mind = "finalPath = path.join(process.cwd(), 'src', 'assets', 'images', 'mindrush_studio_bg_1790502544405.jpg');";
  const multi = `const publicFallbacks = [\n        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',\n        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&q=80',\n        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&q=80',\n        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80'\n      ];\n      finalPath = publicFallbacks[idx % publicFallbacks.length];`;
  if (text.includes(mind)) text = text.replace(mind, multi);
  return text;
}

const restoredPath = ensureRestored();
let source = fs.readFileSync(restoredPath, 'utf8');
source = patchSource(source);
// INJECT_YT_UPLOAD_RUNTIME — restored source calls uploadYouTubeShort without import
if (source.includes('uploadYouTubeShort') && !source.includes("require('./youtube_channel_dispatcher")) {
  source = source.replace(
    /const uploadRes = await uploadYouTubeShort\(/,
    "const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');\n      const uploadRes = await uploadYouTubeShort("
  );
}
fs.writeFileSync(PATCHED, source, 'utf8');

delete require.cache[PATCHED];
const mod = require(PATCHED);
module.exports = mod;

if (require.main === module) {
  const run = mod.generateStoicLongVideo || mod.main || mod.default;
  if (typeof run === 'function') {
    Promise.resolve(run()).catch((e) => { console.error(e); process.exit(1); });
  } else {
    console.log('[Stoic Restore] Exports:', Object.keys(mod).join(', ') || '(script ran on require)');
  }
}
