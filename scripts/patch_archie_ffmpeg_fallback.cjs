#!/usr/bin/env node
/**
 * Patches generate_archie_tech_fact_reel.cjs so FFmpeg failure uses a SIMPLE
 * 2-layer composite (studio bg + idle puppet + audio) instead of dying.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'scripts', 'generate_archie_tech_fact_reel.cjs');
if (!fs.existsSync(target)) {
  console.warn('[archie-patch] missing target');
  process.exit(0);
}

let t = fs.readFileSync(target, 'utf8');
if (t.includes('SIMPLE ARCHIE FALLBACK COMPOSITE')) {
  console.log('[archie-patch] already applied');
  process.exit(0);
}

const marker = `console.warn(\\[FFmpeg Notice] Subtitles notice: ${err.message}. Retrying with pass-through video filter...\\`);`;
// Use a more reliable string match
const old = `  try {
    execSync(ffmpegCmd);
  } catch (err) {
    console.warn(\`[FFmpeg Notice] Subtitles notice: \${err.message}. Retrying with pass-through video filter...\`);
    const fallbackCmd = ffmpegCmd.replace(\`[v_raw]subtitles='\${safeAssPath}'[vfinal]\`, '[v_raw]null[vfinal]');
    execSync(fallbackCmd);
  }`;

const neu = `  try {
    execSync(ffmpegCmd);
  } catch (err) {
    console.warn(\`[FFmpeg Notice] Complex composite failed: \${err.message}\`);
    // SIMPLE ARCHIE FALLBACK COMPOSITE — bg + idle puppet + audio only
    try {
      const idlePuppet = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_idle.png');
      const studioBg = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels', 'archie_studio_bg.png');
      const bg = fs.existsSync(studioBg) ? studioBg : idlePuppet;
      const puppet = fs.existsSync(idlePuppet) ? idlePuppet : bg;
      // Find last audio input path from a known artifact pattern
      const audioMatch = String(ffmpegCmd).match(/-i \"([^\"]+archie_master_audio[^\"]+)\"/) ||
        String(ffmpegCmd).match(/-i \"([^\"]+\\.wav)\"/g);
      let audioFile = null;
      if (audioMatch) {
        const all = String(ffmpegCmd).match(/-i \"([^\"]+\\.wav)\"/g) || [];
        const last = all[all.length - 1];
        audioFile = last ? last.replace(/^-i \"/, '').replace(/\"$/, '') : null;
      }
      if (!audioFile || !fs.existsSync(audioFile)) {
        throw new Error('No audio file for simple fallback');
      }
      const simple = \\`ffmpeg -y -loop 1 -t \${reelDuration.toFixed(2)} -i "\${bg}" -loop 1 -t \${reelDuration.toFixed(2)} -i "\${puppet}" -i "\${audioFile}" -filter_complex "[0:v]scale=1080:1920,zoompan=z='min(1.0+0.00004*on,1.05)':d=\${Math.ceil(reelDuration*30)}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s=1080x1920:fps=30[bg];[1:v]scale=-1:1100[pup];[bg][pup]overlay=x=(W-w)/2:y=H-h-80[vfinal]" -map "[vfinal]" -map 2:a -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -t \${reelDuration.toFixed(2)} "\${finalMp4Path}\"\\`;
      console.log('[FFmpeg] SIMPLE ARCHIE FALLBACK COMPOSITE');
      execSync(simple, { stdio: 'inherit' });
    } catch (e2) {
      console.error('[FFmpeg] Simple fallback also failed:', e2.message);
      throw err;
    }
  }`;

if (!t.includes('Retrying with pass-through video filter')) {
  console.warn('[archie-patch] expected block not found — writing helper instead');
  process.exit(0);
}

t = t.replace(old, neu);
if (!t.includes('SIMPLE ARCHIE FALLBACK COMPOSITE')) {
  // looser replace
  t = t.replace(
    /const fallbackCmd = ffmpegCmd\.replace\(`\[v_raw\]subtitles='\$\{safeAssPath\}'\[vfinal\]`, '\[v_raw\]null\[vfinal\]'\);\s*execSync\(fallbackCmd\);/,
    `// SIMPLE ARCHIE FALLBACK COMPOSITE
    const idlePuppet = require('path').join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_idle.png');
    const studioBg = require('path').join(process.cwd(), 'test_artifacts', 'archie_5s_reels', 'archie_studio_bg.png');
    const bg = require('fs').existsSync(studioBg) ? studioBg : idlePuppet;
    const puppet = require('fs').existsSync(idlePuppet) ? idlePuppet : bg;
    const audioMatches = String(ffmpegCmd).match(/-i "([^"]+\.wav)"/g) || [];
    const audioFile = (audioMatches[audioMatches.length - 1] || '').replace(/^-i "/, '').replace(/"$/, '');
    if (!audioFile) throw err;
    const simple = \\'ffmpeg -y -loop 1 -t ' + reelDuration.toFixed(2) + ' -i "' + bg + '" -loop 1 -t ' + reelDuration.toFixed(2) + ' -i "' + puppet + '" -i "' + audioFile + '" -filter_complex "[0:v]scale=1080:1920[bg];[1:v]scale=-1:1100[pup];[bg][pup]overlay=x=(W-w)/2:y=H-h-80[vfinal]" -map "[vfinal]" -map 2:a -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -t ' + reelDuration.toFixed(2) + ' "' + finalMp4Path + '"';
    console.log('[FFmpeg] SIMPLE ARCHIE FALLBACK COMPOSITE');
    execSync(simple, { stdio: 'inherit' });`
  );
}

fs.writeFileSync(target, t);
console.log('[archie-patch] applied simple FFmpeg fallback');
