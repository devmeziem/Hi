#!/usr/bin/env node
/** Driftreel branding, strip scene N/M on-screen labels, better hashtags, louder ominous SFX. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_documentary_movie_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[cinema-fix] missing generator');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
const backup = t;

// Strip PART N/M and FILE N/M from SVG overlays
t = t.replace(/\s*•\s*PART \$\{sceneNum\}\/\$\{totalScenes\}/g, '');
t = t.replace(/FILE \$\{sceneNum\}\/\$\{totalScenes\}/g, 'DRIFTREEL');
t = t.replace(/PART \$\{sceneNum\}\/\$\{totalScenes\}/g, 'ARCHIVE');
t = t.replace(/Scene\s*\$\{[^}]+\}\s*\/\s*\$\{[^}]+\}/gi, '');
t = t.replace(/sceneNum\s*\/\s*totalScenes/g, "'ARCHIVE'");

// Branding → Driftreel
t = t.replace(/Cinema Vanguard/g, 'Driftreel');
t = t.replace(/#CinemaVanguard/g, '#Driftreel');
t = t.replace(/CinemaVanguard/g, 'Driftreel');
t = t.replace(/lead executive showrunner for Driftreel/g, 'lead showrunner for Driftreel');

// Prompt hashtags
t = t.replace(
  /"hashtags": \["#Driftreel", "#Documentary", "#TrueMystery", "#Shorts"\]/g,
  '"hashtags": ["#Driftreel", "#TrueCrime", "#DarkHistory", "#Documentary", "#MysteryTok", "#Shorts", "#FYP"]'
);
t = t.replace(
  /#CinemaVanguard #Documentary #DarkHistory #TrueCrime #Mystery #Shorts/g,
  '#Driftreel #TrueCrime #DarkHistory #Documentary #MysteryTok #Shorts #FYP'
);

// Title includes Driftreel cue when missing
if (!t.includes('Driftreel ·') && t.includes('const viralTitle')) {
  t = t.replace(
    /const viralTitle = `\$\{genreEmoji\} \$\{chosenEpisode\.title\}/g,
    'const viralTitle = `Driftreel · ${genreEmoji} ${chosenEpisode.title}'
  );
}

// Ensure hashtags always include Driftreel at post time
if (!t.includes('ensureDriftreelTags')) {
  t = t.replace(
    'const viralDesc = `${fullNarration}',
    `// ensureDriftreelTags
      if (!Array.isArray(chosenEpisode.hashtags)) chosenEpisode.hashtags = [];
      const must = ['#Driftreel', '#TrueCrime', '#DarkHistory', '#Documentary', '#Shorts', '#FYP'];
      for (const h of must) if (!chosenEpisode.hashtags.map(x=>String(x).toLowerCase()).includes(h.toLowerCase())) chosenEpisode.hashtags.push(h);
      chosenEpisode.hashtags = chosenEpisode.hashtags.filter(h => !/cinemavanguard/i.test(h));
      const viralDesc = \`\${fullNarration}\``
  );
}

// Louder ominous SFX (was ~0.16)
t = t.replace(/\[2:a\]volume=0\.16/g, '[2:a]volume=0.38');
t = t.replace(/volume=0\.16,atrim/g, 'volume=0.38,atrim');
// Slightly stronger synth SFX amplitudes
t = t.replace(/0\.02\*sin\(2\*PI\*40\*t\)/g, '0.045*sin(2*PI*40*t)');
t = t.replace(/anoisesrc=d=\$\{duration\.toFixed\(2\)\}:c=pink:a=0\.025/g, 'anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.045');
t = t.replace(/anoisesrc=d=\$\{duration\.toFixed\(2\)\}:c=brown:a=0\.03/g, 'anoisesrc=d=${duration.toFixed(2)}:c=brown:a=0.05');

// ASS title brand
t = t.replace(/Title: Driftreel Unified Archival Karaoke/g, 'Title: Driftreel Unified Archival Karaoke');
t = t.replace(/Title: Cinema Vanguard Unified Archival Karaoke/g, 'Title: Driftreel Unified Archival Karaoke');

if (t === backup) {
  console.log('[cinema-fix] no text changes (already applied?)');
  process.exit(0);
}
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[cinema-fix] Driftreel branding + no scene counters + louder SFX OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[cinema-fix] syntax fail — reverted', e.message);
  process.exit(0);
}
