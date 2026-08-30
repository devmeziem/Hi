/**
 * Automated Cartoon Factory (Workflow 3) — Diagnostic Master Runner
 *
 * Core Flow:
 * TOPIC -> SCENE PLAN -> LOCAL TTS -> LIP SYNC -> 2D ANIMATION -> MUSIC/SFX -> SUBTITLES -> MP4 -> VALIDATION -> PUBLISHING ADAPTER
 */

const fs = require('fs');
const path = require('path');
const { generateCartoonEpisodePlan } = require('./cartoon_planner.cjs');
const { generateSceneVoice } = require('./cartoon_tts_engine.cjs');
const { extractMouthCues } = require('./cartoon_lipsync_engine.cjs');
const { ensureCharacterRigAssets, generateCharacterFrameSvg } = require('./cartoon_character_rig.cjs');
const { generateSrtSubtitles, assembleFinalCartoonVideo, renderSingleSceneVideo } = require('./cartoon_audio_assembler.cjs');
const { validateCartoonOutput } = require('./cartoon_validator.cjs');
const { publisher } = require('./cartoon_publishing_adapter.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
if (!fs.existsSync(RENDERED_DIR)) fs.mkdirSync(RENDERED_DIR, { recursive: true });

async function runCartoonPipelineDiagnostic() {
  const isDryRun = process.env.DRY_RUN === 'false' ? false : true;
  const inputTopic = process.env.TEST_TOPIC || 'How Undersea Cables Connect the Internet Across Continents';

  console.log('====================================================');
  console.log('🎨 STARTING AUTOMATED CARTOON FACTORY (WORKFLOW 3)');
  console.log(`📌 Topic: "${inputTopic}"`);
  console.log(`🛡️  Dry Run Mode: ${isDryRun ? 'ENABLED (Safe Local Diagnostic)' : 'PRODUCTION'}`);
  console.log('====================================================\n');

  // STEP 1: Ensure Reusable Character Rig Assets
  console.log('--- STEP 1: INITIALIZING CHARACTER RIG ("Archie") ---');
  ensureCharacterRigAssets();

  // STEP 2: AI Multi-Provider Script & Scene Planning
  console.log('\n--- STEP 2: AI MULTI-PROVIDER SCENE DIRECTING ---');
  const episodePlan = await generateCartoonEpisodePlan(inputTopic);
  console.log(`[Director] Created episode plan: "${episodePlan.title}" (${episodePlan.scenes.length} scenes, ~${episodePlan.target_duration_seconds}s)`);
  console.log(`[Director] Model Provider: ${episodePlan.modelUsed || 'default'}`);

  // Save Plan Artifact
  const planPath = path.join(ARTIFACTS_DIR, 'cartoon_episode_plan.json');
  fs.writeFileSync(planPath, JSON.stringify(episodePlan, null, 2));

  // STEP 3: Voiceover, Lip-Sync & Scene Rendering
  console.log('\n--- STEP 3: TTS SYNTHESIS & LIP-SYNC PHONEME TRACKING ---');
  const renderedScenes = [];

  for (let i = 0; i < episodePlan.scenes.length; i++) {
    const scene = episodePlan.scenes[i];
    const sceneIndex = i + 1;
    console.log(`\n🎬 [Scene ${sceneIndex}/${episodePlan.scenes.length}] "${scene.dialogue}"`);

    // A. Generate Local Audio
    const audioWavPath = path.join(ARTIFACTS_DIR, `scene_${sceneIndex}_audio.wav`);
    const ttsResult = await generateSceneVoice(scene.dialogue, audioWavPath, scene.duration);
    console.log(`   🔊 Audio Generated: ${ttsResult.duration.toFixed(2)}s via ${ttsResult.engine}`);

    // B. Extract Lip-Sync Mouth Cues (Rhubarb Standard A-X)
    const lipsyncResult = extractMouthCues(audioWavPath, scene.dialogue, ttsResult.duration, ARTIFACTS_DIR);
    console.log(`   👄 Lip-Sync Track: Extracted ${lipsyncResult.cues.length} mouth cues`);

    // Pick dominant mouth shape or talking action frame
    const dominantMouth = lipsyncResult.cues.find(c => c.value !== 'X')?.value || 'B';

    // C. Generate 2D Vector Frame for this scene
    const frameSvgPath = path.join(ARTIFACTS_DIR, `scene_${sceneIndex}_frame.svg`);
    const svgContent = generateCharacterFrameSvg(scene.character_action, scene.emotion, dominantMouth);
    fs.writeFileSync(frameSvgPath, svgContent);

    // D. Render Single Scene MP4
    const sceneMp4Path = path.join(ARTIFACTS_DIR, `scene_${sceneIndex}.mp4`);
    try {
      renderSingleSceneVideo(frameSvgPath, audioWavPath, sceneMp4Path, ttsResult.duration);
      renderedScenes.push({
        sceneIndex,
        videoPath: sceneMp4Path,
        audioPath: audioWavPath,
        duration: ttsResult.duration,
        mouthCues: lipsyncResult.cues
      });
    } catch (err) {
      console.warn(`   ⚠️ Scene ${sceneIndex} render warning:`, err.message);
    }
  }

  // STEP 4: Subtitles Generation
  console.log('\n--- STEP 4: MOBILE SUBTITLES FORMATTING ---');
  const srtPath = path.join(ARTIFACTS_DIR, 'subtitles.srt');
  generateSrtSubtitles(episodePlan.scenes, srtPath);

  // STEP 5: Final Video Assembly
  console.log('\n--- STEP 5: COMPOSITING FINAL VERTICAL MP4 ---');
  const timestamp = Date.now();
  const finalMp4Path = path.join(RENDERED_DIR, `cartoon_archie_${timestamp}.mp4`);

  const sceneVideoFiles = renderedScenes.map(s => s.videoPath);
  assembleFinalCartoonVideo(sceneVideoFiles, finalMp4Path, srtPath);

  // STEP 6: Validation Suite
  console.log('\n--- STEP 6: PRODUCTION QUALITY VALIDATION ---');
  const validationReport = validateCartoonOutput({
    episodePlan,
    videoMp4Path: finalMp4Path,
    sceneOutputs: renderedScenes,
    srtPath,
    minDurationSeconds: 8,
    maxDurationSeconds: 180
  });

  const reportPath = path.join(ARTIFACTS_DIR, 'validation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));

  // STEP 7: Publishing Adapter Dispatch
  console.log('\n--- STEP 7: DISPATCHING TO PUBLISHING ADAPTER ---');
  if (validationReport.valid) {
    const pubResult = await publisher.publish(
      finalMp4Path,
      isDryRun ? 'dry_run' : 'youtube',
      null,
      {
        title: episodePlan.title,
        description: `${episodePlan.title}\n\nJoin Archie for fast explanations of science, tech, and everyday mysteries!\n\n#Shorts #Cartoon #Animation #Science #Explained`,
        tags: ['Shorts', 'Cartoon', 'Science', 'Animation', 'Explained', 'Archie']
      }
    );
    console.log('[Runner Result]:', pubResult);
  } else {
    console.warn('⚠️ Video validation failed: Dispatch to publishing aborted. Review validation_report.json');
  }

  console.log('\n====================================================');
  console.log('🎉 CARTOON FACTORY DIAGNOSTIC RUN COMPLETED');
  console.log(`📁 Video Artifact: ${finalMp4Path}`);
  console.log('====================================================\n');
}

if (require.main === module) {
  runCartoonPipelineDiagnostic().catch(err => {
    console.error('Fatal Cartoon Pipeline Error:', err);
    process.exit(1);
  });
}

module.exports = {
  runCartoonPipelineDiagnostic
};
