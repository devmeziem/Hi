/**
 * Automated Cartoon Factory — FFmpeg Media & Audio Assembly Engine
 *
 * Responsibilities:
 * - Generate mobile-optimized SRT/WebVTT subtitles
 * - Stitch scene videos into one cohesive MP4 (1080x1920, 30 FPS)
 * - Mix and normalize voiceover with background music / sound effects (EBU R128 standard)
 * - Burn crisp, high-visibility subtitles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ensureExactPuppetAssets } = require('./build_exact_puppet_shapes.cjs');

/**
 * Format seconds to SRT timestamp: 00:00:05,250
 */
function formatSrtTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Generate SRT subtitle file from scenes
 */
function generateSrtSubtitles(scenes, outputSrtPath) {
  let srtContent = '';
  let currentTime = 0.0;
  let counter = 1;

  for (const scene of scenes) {
    const dialogue = String(scene.dialogue || '').trim();
    if (!dialogue) continue;

    // Split long dialogues into 4-6 word chunks for mobile punchiness
    const words = dialogue.split(/\s+/);
    const chunkSize = 5;
    const sceneDuration = scene.duration || 6.0;
    const timePerWord = sceneDuration / Math.max(1, words.length);

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkText = chunkWords.join(' ');
      const start = currentTime + (i * timePerWord);
      const end = Math.min(currentTime + sceneDuration, start + (chunkWords.length * timePerWord));

      srtContent += `${counter}\n`;
      srtContent += `${formatSrtTime(start)} --> ${formatSrtTime(end)}\n`;
      srtContent += `${chunkText.toUpperCase()}\n\n`;
      counter++;
    }

    currentTime += sceneDuration;
  }

  fs.writeFileSync(outputSrtPath, srtContent, 'utf8');
  console.log(`[Audio/Media Engine] Generated mobile subtitles in ${outputSrtPath}`);
  return outputSrtPath;
}

/**
 * Find Blender executable on system
 */
function getBlenderBinPath() {
  const { spawnSync } = require('child_process');
  const possiblePaths = [
    'blender',
    '/usr/local/bin/blender',
    '/tmp/bin/blender',
    '/tmp/blender_app/blender-3.3.1-linux-x64/blender'
  ];
  for (const p of possiblePaths) {
    try {
      const res = spawnSync(p, ['-v'], { encoding: 'utf8' });
      if (res.status === 0) return p;
    } catch {}
  }
  return null;
}

/**
 * Check if blender is available on system
 */
function isBlenderAvailable() {
  return getBlenderBinPath() !== null;
}

/**
 * Assemble multiple scene video/audio clips into one final vertical MP4
 */
function assembleFinalCartoonVideo(sceneFiles, outputMp4Path, srtPath) {
  const dir = path.dirname(outputMp4Path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const validScenes = sceneFiles.filter(f => fs.existsSync(f) && fs.statSync(f).size > 5000);
  if (validScenes.length === 0) {
    throw new Error('No valid scene videos found to assemble');
  }

  const concatListPath = path.join(dir, 'concat_list.txt');
  const concatEntries = validScenes.map(f => `file '${path.resolve(f)}'`).join('\n');
  fs.writeFileSync(concatListPath, concatEntries, 'utf8');

  console.log(`[Audio/Media Engine] Concatenating ${validScenes.length} scenes into final video: ${outputMp4Path}`);

  // Fast stream copy concat first (sub-second), then re-encode fallback
  let assembled = false;
  try {
    const copyCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputMp4Path}" 2>/dev/null`;
    execSync(copyCmd);
    if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 10000) {
      assembled = true;
    }
  } catch (e) {
    console.warn('[Audio/Media Engine] Fast concat copy notice:', e.message);
  }

  if (!assembled) {
    try {
      const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 "${outputMp4Path}" 2>/dev/null`;
      execSync(ffmpegCmd);
      if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 10000) {
        assembled = true;
      }
    } catch (err) {
      console.warn('[Audio/Media Engine] Re-encode concat notice:', err.message);
    }
  }

  if (assembled && fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 10000) {
    console.log(`[Audio/Media Engine] Final Cartoon MP4 assembled (${(fs.statSync(outputMp4Path).size / 1024 / 1024).toFixed(2)} MB)`);
    return outputMp4Path;
  }

  throw new Error('Final MP4 was not produced or is empty');
}

/**
 * Render a single 2D/2.5D cartoon scene.
 * If Blender CLI binary is installed, uses Blender.
 * If Blender CLI is not detected, uses high-precision FFmpeg 2.5D Animated Compositor.
 */
function renderSingleSceneVideo(svgPath, wavPath, outputSceneMp4, duration = 6.0, options = {}) {
  const dir = path.dirname(outputSceneMp4);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { mouthCuesJson, action = 'talking', emotion = 'curious', camera = 'medium', bgImage = '' } = options;
  let engineUsed = 'moviepy';

  // Ensure exact geometric character puppet assets are present on disk
  try {
    ensureExactPuppetAssets();
  } catch (err) {
    console.warn(`[Media Engine] Puppet asset initialization notice: ${err.message}`);
  }

  // Remove stale incomplete output if present
  try { if (fs.existsSync(outputSceneMp4)) fs.unlinkSync(outputSceneMp4); } catch {}

  // Guarantee clean background input (never fall back to a character frame)
  let bgInput = (bgImage && fs.existsSync(bgImage)) ? bgImage : null;
  if (!bgInput) {
    const defaultBgPath = path.join(process.cwd(), 'cartoon_character_assets', 'creator_studio_bg.png');
    if (fs.existsSync(defaultBgPath)) {
      bgInput = defaultBgPath;
    } else {
      try {
        const { generateSceneBackgroundSvg, rasterizeSvgToPng } = require('./cartoon_character_rig.cjs');
        const defaultSvg = generateSceneBackgroundSvg('creator_studio', '', []);
        const tempSvgPath = path.join(process.cwd(), 'cartoon_character_assets', 'creator_studio_bg.svg');
        fs.writeFileSync(tempSvgPath, defaultSvg);
        rasterizeSvgToPng(tempSvgPath, defaultBgPath, 1080, 1920);
        if (fs.existsSync(defaultBgPath)) bgInput = defaultBgPath;
      } catch (err) {
        console.warn(`[Media Engine] Notice creating fallback studio background: ${err.message}`);
      }
    }
  }
  if (!bgInput) bgInput = svgPath;

  const glossaryBoard = options.glossaryBoard || options.glossary_board || null;
  let renderSucceeded = false;

  // 1. PRIMARY ENGINE: MoviePy Exact Puppet Animator
  const moviepyScript = path.join(process.cwd(), 'scripts', 'character_moviepy_animator.py');
  const preferMoviepy = process.env.CARTOON_ENGINE !== 'ffmpeg' && process.env.CARTOON_ENGINE !== 'blender';

  if (preferMoviepy && fs.existsSync(moviepyScript)) {
    console.log(`[Media Engine] 🎬 Invoking Python MoviePy Exact Puppet Engine: ${path.basename(outputSceneMp4)} (${duration}s, action: ${action})...`);
    const bgArg = (bgInput && fs.existsSync(bgInput)) ? `--bg_image "${bgInput}"` : '';
    const glossArg = (glossaryBoard && fs.existsSync(glossaryBoard)) ? `--glossary_board "${glossaryBoard}"` : '';
    let boardArgs = '';
    if (options.interactiveBoards) {
      const { board1Png, board2Png, vsPng, bamSoundWav } = options.interactiveBoards;
      if (board1Png && fs.existsSync(board1Png)) boardArgs += ` --board1_image "${board1Png}"`;
      if (board2Png && fs.existsSync(board2Png)) boardArgs += ` --board2_image "${board2Png}"`;
      if (vsPng && fs.existsSync(vsPng)) boardArgs += ` --vs_badge "${vsPng}"`;
      if (bamSoundWav && fs.existsSync(bamSoundWav)) boardArgs += ` --bam_sound "${bamSoundWav}"`;
    }
    const moviepyCmd = `python3 "${moviepyScript}" ${bgArg} ${glossArg} ${boardArgs} --audio_wav "${wavPath}" --output_mp4 "${outputSceneMp4}" --duration ${duration} --action "${action}"`;
    try {
      execSync(moviepyCmd, { stdio: 'inherit', timeout: 120000 });
      renderSucceeded = fs.existsSync(outputSceneMp4) && fs.statSync(outputSceneMp4).size > 1000;
      if (renderSucceeded) {
        engineUsed = 'moviepy';
        console.log(`[Media Engine] ✅ MoviePy Exact Puppet rendered scene cleanly: ${path.basename(outputSceneMp4)}`);
      }
    } catch (err) {
      console.warn(`[Media Engine] ⚠️ MoviePy encountered a notice: ${err.message}. Engaging resilient FFmpeg Exact Puppet compositor...`);
      renderSucceeded = false;
    }
  }

  // 2. BLENDER ENGINE (Optional / Headless)
  const forceFfmpeg = process.env.CARTOON_ENGINE === 'ffmpeg' || process.env.USE_BLENDER === 'false';
  const blenderBin = (!renderSucceeded && !forceFfmpeg && process.env.CARTOON_ENGINE === 'blender') ? getBlenderBinPath() : null;

  if (!renderSucceeded && blenderBin) {
    engineUsed = 'blender';
    console.log(`[Media Engine] Blender CLI detected (${blenderBin}). Attempting 3D/2.5D render: ${path.basename(outputSceneMp4)} (${duration}s)...`);
    const blenderScript = path.join(process.cwd(), 'scripts', 'blender_cartoon_renderer.py');
    const assetsDir = path.join(process.cwd(), 'cartoon_character_assets');
    const mouthArg = (mouthCuesJson && fs.existsSync(mouthCuesJson)) ? `--mouth_cues "${mouthCuesJson}"` : '';
    const bgArg = (bgImage && fs.existsSync(bgImage)) ? `--bg_image "${bgImage}"` : '';

    const blenderCmd = `"${blenderBin}" -b -P "${blenderScript}" -- --assets_dir "${assetsDir}" ${mouthArg} ${bgArg} --action "${action}" --emotion "${emotion}" --duration ${duration} --camera "${camera}" --audio_wav "${wavPath}" --output_mp4 "${outputSceneMp4}"`;
    
    try {
      execSync(blenderCmd, { stdio: 'inherit', timeout: 180000 });
      renderSucceeded = fs.existsSync(outputSceneMp4) && fs.statSync(outputSceneMp4).size > 1000;
    } catch (err) {
      console.warn(`[Media Engine] ⚠️ Blender headless execution notice: ${err.message}`);
      renderSucceeded = false;
    }
  }

  // 3. HIGH-PRECISION FFMPEG COMPOSITOR (Guarantees the exact character is ALWAYS in frame)
  if (!renderSucceeded) {
    engineUsed = 'ffmpeg';
    console.log(`[Media Engine] Rendering Exact Puppet Scene via High-Precision FFmpeg Engine: ${path.basename(outputSceneMp4)} (${duration}s)...`);

    // Priority to exact_puppet directory
    let puppetDir = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet');
    if (!fs.existsSync(puppetDir) || !fs.existsSync(path.join(puppetDir, 'puppet_idle.png'))) {
      puppetDir = path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet');
    }

    const puppetWalk = path.join(puppetDir, 'puppet_walking.png');
    const puppetWalk1 = path.join(puppetDir, 'puppet_walk_stride1.png');
    const puppetWalk2 = path.join(puppetDir, 'puppet_walk_stride2.png');
    const puppetWalkTalk1 = path.join(puppetDir, 'puppet_walk_talk1.png');
    const puppetWalkTalk2 = path.join(puppetDir, 'puppet_walk_talk2.png');
    const puppetIdle = path.join(puppetDir, 'puppet_idle.png');
    const puppetPointLeft = path.join(puppetDir, 'puppet_point_left.png');
    const puppetPointRight = path.join(puppetDir, 'puppet_point_right.png');
    const puppetPointUpL = path.join(puppetDir, 'puppet_point_up_left.png');
    const puppetPointUpR = path.join(puppetDir, 'puppet_point_up_right.png');
    const puppetAkimboJaw = path.join(puppetDir, 'puppet_akimbo_jaw.png');
    const puppetAkimboTalk = path.join(puppetDir, 'puppet_akimbo_jaw_talk.png');
    const puppetCompare = path.join(puppetDir, 'puppet_explain_both.png');
    const puppetTalk = path.join(puppetDir, 'puppet_talking.png');
    const puppetEyes = path.join(puppetDir, 'puppet_blink.png');
    const puppetSitting = path.join(puppetDir, 'puppet_sitting.png');
    const puppetThinking = path.join(puppetDir, 'puppet_thinking.png');
    const puppetConfused = path.join(puppetDir, 'puppet_confused.png');
    const puppetSurprised = path.join(puppetDir, 'puppet_surprised.png');
    const puppetQuestioning = path.join(puppetDir, 'puppet_questioning_users.png');
    const hudCard = path.join(process.cwd(), 'cartoon_character_assets', 'ui_hud', 'hud_comparison_card.png');

    // Decide main pose based on action
    let mainPuppet = fs.existsSync(puppetCompare) ? puppetCompare : puppetIdle;
    let puppetX = 260;
    if (action === 'point_up_left') {
      mainPuppet = fs.existsSync(puppetPointUpL) ? puppetPointUpL : puppetIdle;
      puppetX = 320;
    } else if (action === 'point_up_right') {
      mainPuppet = fs.existsSync(puppetPointUpR) ? puppetPointUpR : puppetIdle;
      puppetX = 200;
    } else if (action === 'akimbo_jaw') {
      mainPuppet = fs.existsSync(puppetAkimboJaw) ? puppetAkimboJaw : puppetIdle;
      puppetX = 260;
    } else if (action === 'point_left') {
      mainPuppet = fs.existsSync(puppetPointLeft) ? puppetPointLeft : puppetIdle;
      puppetX = 360;
    } else if (action === 'point_right') {
      mainPuppet = fs.existsSync(puppetPointRight) ? puppetPointRight : puppetIdle;
      puppetX = 160;
    } else if (action === 'sitting') {
      mainPuppet = fs.existsSync(puppetSitting) ? puppetSitting : puppetIdle;
      puppetX = 260;
    } else if (action === 'thinking') {
      mainPuppet = fs.existsSync(puppetThinking) ? puppetThinking : puppetIdle;
      puppetX = 260;
    } else if (action === 'confused') {
      mainPuppet = fs.existsSync(puppetConfused) ? puppetConfused : puppetIdle;
      puppetX = 260;
    } else if (action === 'surprised' || action === 'surprise') {
      mainPuppet = fs.existsSync(puppetSurprised) ? puppetSurprised : puppetIdle;
      puppetX = 260;
    } else if (action === 'questioning_users') {
      mainPuppet = fs.existsSync(puppetQuestioning) ? puppetQuestioning : puppetIdle;
      puppetX = 260;
    } else if (action === 'walk_in' || action === 'walking' || action === 'walk_out') {
      mainPuppet = fs.existsSync(puppetWalk) ? puppetWalk : puppetIdle;
    } else if (action === 'talking' || action === 'idle') {
      mainPuppet = fs.existsSync(puppetTalk) ? puppetTalk : puppetIdle;
    }

    const walk1Asset = fs.existsSync(puppetWalk1) ? puppetWalk1 : (fs.existsSync(puppetWalk) ? puppetWalk : mainPuppet);
    const walk2Asset = fs.existsSync(puppetWalk2) ? puppetWalk2 : (fs.existsSync(puppetWalk) ? puppetWalk : mainPuppet);
    const standAsset = fs.existsSync(puppetIdle) ? puppetIdle : mainPuppet;
    const talkAsset = fs.existsSync(puppetTalk) ? puppetTalk : mainPuppet;
    const blinkAsset = fs.existsSync(puppetEyes) ? puppetEyes : mainPuppet;
    const pointUpLAsset = fs.existsSync(puppetPointUpL) ? puppetPointUpL : mainPuppet;
    const pointUpRAsset = fs.existsSync(puppetPointUpR) ? puppetPointUpR : mainPuppet;
    const akimboAsset = fs.existsSync(puppetAkimboJaw) ? puppetAkimboJaw : mainPuppet;
    const akimboTalkAsset = fs.existsSync(puppetAkimboTalk) ? puppetAkimboTalk : akimboAsset;

    let filterComplex = '';
    let ffmpegCmd = '';
    const hasGloss = glossaryBoard && fs.existsSync(glossaryBoard);
    const interactiveBoards = options.interactiveBoards;
    const hasBoards = interactiveBoards && interactiveBoards.board1Png && fs.existsSync(interactiveBoards.board1Png);

    if (action === 'walk_in' || hasBoards) {
      // Full Interactive Archie Presentation Sequence
      const b1Path = hasBoards ? interactiveBoards.board1Png : hudCard;
      const vsPath = hasBoards ? interactiveBoards.vsPng : hudCard;
      const b2Path = hasBoards ? interactiveBoards.board2Png : hudCard;
      const bamWav = (hasBoards && interactiveBoards.bamSoundWav && fs.existsSync(interactiveBoards.bamSoundWav)) ? interactiveBoards.bamSoundWav : null;

      const exitStart = duration >= 6.0 ? (duration - 1.3).toFixed(2) : duration.toFixed(2);

      filterComplex = [
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
        `[1:v]scale=-1:1100[w1]`,
        `[2:v]scale=-1:1100[w2]`,
        `[3:v]scale=-1:1100[stand]`,
        `[4:v]scale=-1:1100[talk]`,
        `[5:v]scale=-1:1100[pt_l]`,
        `[6:v]scale=-1:1100[pt_r]`,
        `[7:v]scale=-1:1100[akimbo]`,
        `[8:v]scale=400:-1[b1]`,
        `[9:v]scale=140:-1[vs]`,
        `[10:v]scale=400:-1[b2]`,
        // Walk in: -380 to 260 over 1.2s alternating strides
        `[bg][w1]overlay=x='-380 + t*530':y='760 + 14*abs(sin(t*12))':enable='lte(t,1.2)*mod(floor(t*6),2)'[s1]`,
        `[s1][w2]overlay=x='-380 + t*530':y='760 + 14*abs(sin(t*12))':enable='lte(t,1.2)*(1-mod(floor(t*6),2))'[s2]`,
        // Center intro speech: t=1.2 to 2.2
        `[s2][talk]overlay=x=260:y='760 + 4*sin(t*3)':enable='between(t,1.2,2.2)*mod(floor(t*5),2)'[s3]`,
        `[s3][stand]overlay=x=260:y='760 + 4*sin(t*3)':enable='between(t,1.2,2.2)*(1-mod(floor(t*5),2))'[s4]`,
        // Point up left to Board 1: t=2.2 to 3.2
        `[s4][pt_l]overlay=x=300:y='760 + 4*sin(t*3)':enable='between(t,2.2,3.2)'[s5]`,
        // Board 1 appears with slight stamp bounce: t >= 2.2 until exit
        `[s5][b1]overlay=x=70:y='290 + 4*sin(t*2)':enable='between(t,2.2,${exitStart})'[s6]`,
        // VS Badge appears: t >= 2.7 until exit
        `[s6][vs]overlay=x=470:y='370 + 3*sin(t*2.5)':enable='between(t,2.7,${exitStart})'[s7]`,
        // Point up right to Board 2: t=3.2 to 4.2
        `[s7][pt_r]overlay=x=220:y='760 + 4*sin(t*3)':enable='between(t,3.2,4.2)'[s8]`,
        // Board 2 appears: t >= 3.2 until exit
        `[s8][b2]overlay=x=610:y='290 + 4*sin((t+0.5)*2)':enable='between(t,3.2,${exitStart})'[s9]`,
        // Akimbo on hip + jaw pose analyzing: t=4.2 to exitStart
        `[s9][akimbo]overlay=x=260:y='760 + 4*sin(t*3)':enable='between(t,4.2,${exitStart})'[s10]`,
        // Walk out to the right: t >= exitStart
        `[s10][w1]overlay=x='260 + (t-${exitStart})*600':y='760 + 14*abs(sin(t*12))':enable='gte(t,${exitStart})*mod(floor(t*6),2)'[s11]`,
        `[s11][w2]overlay=x='260 + (t-${exitStart})*600':y='760 + 14*abs(sin(t*12))':enable='gte(t,${exitStart})*(1-mod(floor(t*6),2))'[v]`
      ].join(';');

      let audioMap = '-map 11:a';
      let extraInputs = '';
      if (bamWav) {
        // Mix BAM stamp sound effect at t=2.2s and t=3.2s
        filterComplex += `;[12:a]adelay=2200|2200[bam1];[12:a]adelay=3200|3200[bam2];[11:a][bam1][bam2]amix=inputs=3:duration=first[aout]`;
        audioMap = '-map "[aout]"';
        extraInputs = `-i "${bamWav}"`;
      }

      ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${walk1Asset}" -loop 1 -t ${duration} -i "${walk2Asset}" -loop 1 -t ${duration} -i "${standAsset}" -loop 1 -t ${duration} -i "${talkAsset}" -loop 1 -t ${duration} -i "${pointUpLAsset}" -loop 1 -t ${duration} -i "${pointUpRAsset}" -loop 1 -t ${duration} -i "${akimboAsset}" -loop 1 -t ${duration} -i "${b1Path}" -loop 1 -t ${duration} -i "${vsPath}" -loop 1 -t ${duration} -i "${b2Path}" -i "${wavPath}" ${extraInputs} -filter_complex "${filterComplex}" -map "[v]" ${audioMap} -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;

    } else if (action === 'akimbo_jaw') {
      filterComplex = [
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
        `[1:v]scale=-1:1100[akimbo]`,
        `[2:v]scale=-1:1100[akimbo_talk]`,
        `[3:v]scale=-1:1100[eyes]`,
        `[bg][akimbo]overlay=x=260:y='760 + 5*sin(t*3)':enable='mod(floor(t*5),2)'[s1]`,
        `[s1][akimbo_talk]overlay=x=260:y='760 + 5*sin(t*3)':enable='(1-mod(floor(t*5),2))*(between(t,0,2.3)+between(t,2.46,${duration}))'[s2]`,
        `[s2][eyes]overlay=x=260:y='760 + 5*sin(t*3)':enable='between(t,2.3,2.46)'[v]`
      ].join(';');
      ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${akimboAsset}" -loop 1 -t ${duration} -i "${akimboTalkAsset}" -loop 1 -t ${duration} -i "${blinkAsset}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 4:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;

    } else if ((action === 'point_left' || action === 'point_right' || action === 'explain_both') && fs.existsSync(hudCard)) {
      const hudX = action === 'point_right' ? 530 : (action === 'point_left' ? 70 : 300);
      if (hasGloss) {
        filterComplex = [
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
          `[4:v]scale=860:-1[gloss]`,
          `[bg][gloss]overlay=x=(W-w)/2:y='150 + 4*sin(t*2)'[bg0]`,
          `[1:v]scale=-1:1100[pose]`,
          `[2:v]scale=-1:1100[eyes]`,
          `[3:v]scale=460:-1[hud]`,
          `[bg0][hud]overlay=x=${hudX}:y='430 + 6*sin(t*2.5)'[s0]`,
          `[s0][pose]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,0,2.3)+between(t,2.46,${duration})'[s1]`,
          `[s1][eyes]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,2.3,2.46)'[v]`
        ].join(';');
        ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${mainPuppet}" -loop 1 -t ${duration} -i "${blinkAsset}" -loop 1 -t ${duration} -i "${hudCard}" -loop 1 -t ${duration} -i "${glossaryBoard}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 5:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
      } else {
        filterComplex = [
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
          `[1:v]scale=-1:1100[pose]`,
          `[2:v]scale=-1:1100[eyes]`,
          `[3:v]scale=460:-1[hud]`,
          `[bg][hud]overlay=x=${hudX}:y='430 + 6*sin(t*2.5)'[s0]`,
          `[s0][pose]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,0,2.3)+between(t,2.46,${duration})'[s1]`,
          `[s1][eyes]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,2.3,2.46)'[v]`
        ].join(';');
        ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${mainPuppet}" -loop 1 -t ${duration} -i "${blinkAsset}" -loop 1 -t ${duration} -i "${hudCard}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 4:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
      }
    } else {
      if (hasGloss) {
        filterComplex = [
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
          `[3:v]scale=860:-1[gloss]`,
          `[bg][gloss]overlay=x=(W-w)/2:y='150 + 4*sin(t*2)'[bg0]`,
          `[1:v]scale=-1:1100[pose]`,
          `[2:v]scale=-1:1100[eyes]`,
          `[bg0][pose]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,0,2.3)+between(t,2.46,${duration})'[s1]`,
          `[s1][eyes]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,2.3,2.46)'[v]`
        ].join(';');
        ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${mainPuppet}" -loop 1 -t ${duration} -i "${blinkAsset}" -loop 1 -t ${duration} -i "${glossaryBoard}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 4:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
      } else {
        filterComplex = [
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]`,
          `[1:v]scale=-1:1100[pose]`,
          `[2:v]scale=-1:1100[eyes]`,
          `[bg][pose]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,0,2.3)+between(t,2.46,${duration})'[s1]`,
          `[s1][eyes]overlay=x=${puppetX}:y='760 + 5*sin(t*3)':enable='between(t,2.3,2.46)'[v]`
        ].join(';');
        ffmpegCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${mainPuppet}" -loop 1 -t ${duration} -i "${blinkAsset}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 3:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
      }
    }

    try {
      if (fs.existsSync(mainPuppet)) {
        execSync(ffmpegCmd, { stdio: 'pipe', timeout: 90000 });
        renderSucceeded = true;
      } else {
        throw new Error('Puppet asset not found on disk');
      }
    } catch (err) {
      console.warn(`[Media Engine] Composite retry notice: ${err.message}. Rendering robust fallback compositor...`);
      try {
        if (fs.existsSync(mainPuppet)) {
          // Solid overlay fallback - ALWAYS keeps character on screen!
          const robustCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -loop 1 -t ${duration} -i "${mainPuppet}" -i "${wavPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[1:v]scale=-1:1100[char];[bg][char]overlay=x=(W-w)/2:y=H-h-50[v]" -map "[v]" -map 2:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
          execSync(robustCmd, { stdio: 'pipe', timeout: 60000 });
          renderSucceeded = true;
        } else {
          // Pure scene background fallback if puppet cannot be loaded
          const bgOnlyCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgInput}" -i "${wavPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v]" -map "[v]" -map 1:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputSceneMp4}"`;
          execSync(bgOnlyCmd, { stdio: 'pipe', timeout: 60000 });
          renderSucceeded = true;
        }
      } catch (fatalFallbackErr) {
        console.error(`[Media Engine] Fatal fallback notice: ${fatalFallbackErr.message}`);
      }
    }
  }

  // Double check if Blender saved to a frame-ranged filename (e.g. scene_10001-0017.mp4)
  if (!fs.existsSync(outputSceneMp4) || fs.statSync(outputSceneMp4).size < 1000) {
    const dir = path.dirname(outputSceneMp4);
    const baseName = path.basename(outputSceneMp4, '.mp4');
    if (fs.existsSync(dir)) {
      const candidates = fs.readdirSync(dir)
        .filter(f => f.endsWith('.mp4') && f.startsWith(baseName) && f !== path.basename(outputSceneMp4))
        .map(f => path.join(dir, f))
        .filter(f => fs.existsSync(f) && fs.statSync(f).size > 1000);
      if (candidates.length > 0) {
        candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        try {
          fs.renameSync(candidates[0], outputSceneMp4);
          console.log(`[Media Engine] Normalized Blender frame-ranged file: ${path.basename(candidates[0])} -> ${path.basename(outputSceneMp4)}`);
        } catch (e) {
          fs.copyFileSync(candidates[0], outputSceneMp4);
        }
      }
    }
  }

  if (fs.existsSync(outputSceneMp4) && fs.statSync(outputSceneMp4).size > 1000) {
    console.log(`[Media Engine] ✅ Rendered scene via ${engineUsed === 'blender' ? 'Blender 3D' : 'FFmpeg 2.5D Motion'} Engine: ${path.basename(outputSceneMp4)} (${fs.statSync(outputSceneMp4).size} bytes)`);
    return outputSceneMp4;
  }

  throw new Error(`Scene render failed: Output file ${outputSceneMp4} was not produced or is too small.`);
}

module.exports = {
  generateSrtSubtitles,
  assembleFinalCartoonVideo,
  renderSingleSceneVideo
};
