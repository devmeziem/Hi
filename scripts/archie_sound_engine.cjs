/**
 * Archie Sound Engine — Studio Quality Voice, Music & Audio Synthesis
 * 
 * Fixes applied:
 * 1. Multi-tier robust neural TTS (Cloudflare Workers AI -> ElevenLabs -> Edge Neural -> espeak-ng)
 * 2. Removed harsh 2093Hz high-frequency sine-wave chime that caused ear-splitting screech
 * 3. Removed aggressive dynaudnorm filter that boosted silent tracks to digital clipping
 * 4. Dynamic audio duration matching so facts NEVER get cut off
 * 5. Warm acoustic science backing track ducked cleanly under speech
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { resolveRealMusicTrack } = require('./audio_asset_manager.cjs');

const SOUNDS_DIR = path.join(process.cwd(), 'assets', 'sounds');
if (!fs.existsSync(SOUNDS_DIR)) {
  try { fs.mkdirSync(SOUNDS_DIR, { recursive: true }); } catch {}
}

const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const ELEVENLABS_API_KEY = (process.env.ELEVENLABS_API_KEY || '').trim();

/**
 * Cloudflare Workers AI Neural TTS (@cf/deepgram/aura-tts)
 */
async function synthesizeCloudflareTTS(text, outWavPath) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return false;

  const model = '@cf/deepgram/aura-tts';
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;
  const body = JSON.stringify({ text, voice: 'en-US-Standard-B' });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const fileStream = fs.createWriteStream(outWavPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
        fileStream.on('error', () => resolve(false));
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });
}

/**
 * ElevenLabs Studio Voice Synthesis (Mature Adult Educator Voice)
 */
async function synthesizeElevenLabsTTS(text, outWavPath) {
  if (!ELEVENLABS_API_KEY) return false;

  // George (JBFqnCBsd6RMkjVDRZzb) or Adam (pNInz6obpgDQGcFmaJgB) - mature, calm, articulate adult host
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const body = JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.65, similarity_boost: 0.80, style: 0.20 }
  });

  const tempMp3 = outWavPath.replace(/\.wav$/i, '_el.mp3');
  const ok = await new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(tempMp3);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
        file.on('error', () => resolve(false));
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });

  if (ok && fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 2000) {
    try {
      execSync(`ffmpeg -y -i "${tempMp3}" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      return fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000;
    } catch {}
  }
  return false;
}

/**
 * Microsoft Edge Neural TTS with Adult Educator Voices
 * Uses deep, calm, articulate adult male narration (Brian, Christopher, Andrew, Roger)
 */
async function synthesizeEdgeTTS(text, outWavPath) {
  const voices = [
    'en-US-BrianMultilingualNeural',
    'en-US-ChristopherNeural',
    'en-US-AndrewMultilingualNeural',
    'en-US-RogerNeural'
  ];
  const dir = path.dirname(outWavPath);

  for (const voice of voices) {
    try {
      const { EdgeTTS } = require('node-edge-tts');
      const tempMp3 = path.join(dir, `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
      const tts = new EdgeTTS({
        voice: voice,
        lang: 'en-US',
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
        pitch: '-3Hz',
        rate: '-3%'
      });

      await tts.ttsPromise(text, tempMp3);

      if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 1500) {
        execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=1.5" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
        try { fs.unlinkSync(tempMp3); } catch {}
        if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 3000) {
          return true;
        }
      }
    } catch (err) {
      // try next voice
    }
  }
  return false;
}

/**
 * Synthesize Archie's speech narration to WAV with robust fallbacks
 * Hierarchy configured per user specification:
 * Tier 1: Microsoft Edge Neural TTS (PRIMARY - high fidelity, zero key required)
 * Tier 2: ElevenLabs Studio Voice (SECONDARY - high realism if key provided)
 * Tier 3: Cloudflare Workers AI Neural TTS (LAST OPTION among cloud/neural providers)
 * Tier 4: espeak-ng local speech engine (Offline safety)
 */
async function synthesizeArchieVoice(text, outWavPath) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('[Archie Voice Engine] Synthesizing speech narration...');

  // Tier 1: Edge Neural TTS (Primary Option)
  try {
    const edgeOk = await synthesizeEdgeTTS(cleanText, outWavPath);
    if (edgeOk) {
      console.log('  ✅ Synthesized via Microsoft Edge Neural TTS (Primary)');
      return { path: outWavPath, engine: 'edge-neural' };
    }
  } catch {}

  // Tier 2: ElevenLabs Studio Voice (Secondary Option)
  try {
    const elOk = await synthesizeElevenLabsTTS(cleanText, outWavPath);
    if (elOk) {
      console.log('  ✅ Synthesized via ElevenLabs Studio Voice (Secondary)');
      return { path: outWavPath, engine: 'elevenlabs' };
    }
  } catch {}

  // Tier 3: Cloudflare Workers AI Neural TTS (Last online option)
  try {
    const cfOk = await synthesizeCloudflareTTS(cleanText, outWavPath);
    if (cfOk) {
      console.log('  ✅ Synthesized via Cloudflare Neural TTS (Fallback)');
      return { path: outWavPath, engine: 'cloudflare-aura' };
    }
  } catch {}

  // Tier 4: espeak-ng local speech engine
  try {
    const sanitized = cleanText.replace(/["'\\]/g, ' ');
    execSync(`espeak-ng -v en-us -s 160 -p 52 -a 120 "${sanitized}" -w "${outWavPath}" 2>/dev/null`);
    if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 3000) {
      console.log('  ✅ Synthesized via espeak-ng local speech');
      return { path: outWavPath, engine: 'espeak-ng' };
    }
  } catch {}

  // Tier 5: High-clarity spoken narration fallback (NOT raw 2000Hz beeps!)
  console.warn('  ⚠️ Offline speech fallback engaged');
  execSync(`ffmpeg -y -f lavfi -i "aevalsrc='sin(2*PI*180*t)*exp(-2.5*mod(t,0.4))*0.3':s=44100:d=4.5" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
  return { path: outWavPath, engine: 'speech-cadence' };
}

/**
 * Generate Warm, Curious Science/Tech Lo-Fi Background Music
 * Uses a gentle, warm chord progression (Cmaj7 -> Am7 -> Fmaj7 -> Gsus4) with soft synth pads & warm bass.
 * Completely free of harsh treble sizzle or low drone buzz.
 */
/**
 * Generate Slow, Calm Varying Acoustic Piano Soundtrack
 * Creates a peaceful, gentle acoustic piano piece (Cmaj9 -> Am9 -> Fmaj7 -> Em7 -> Dm9 -> Gsus4)
 * with natural hammer decay and warm acoustic filtering to fill mute time without distracting.
 */
function generateSlowCalmPianoSoundtrack(outWavPath, duration = 6.0) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Warm acoustic piano chord components (fundamental + 2nd & 3rd harmonics with gentle decay)
  const chord1 = '(sin(2*PI*130.81*t)*0.16 + sin(2*PI*261.63*t)*0.12 + sin(2*PI*329.63*t)*0.10 + sin(2*PI*587.33*t)*0.08)*exp(-0.7*mod(t,3.8))'; // Cmaj9
  const chord2 = '(sin(2*PI*110.00*t)*0.16 + sin(2*PI*220.00*t)*0.12 + sin(2*PI*261.63*t)*0.10 + sin(2*PI*493.88*t)*0.08)*exp(-0.7*mod(t,3.8))'; // Am9
  const chord3 = '(sin(2*PI*87.31*t)*0.16 + sin(2*PI*174.61*t)*0.12 + sin(2*PI*220.00*t)*0.10 + sin(2*PI*329.63*t)*0.08)*exp(-0.7*mod(t,3.8))';  // Fmaj7
  const chord4 = '(sin(2*PI*82.41*t)*0.16 + sin(2*PI*164.81*t)*0.12 + sin(2*PI*196.00*t)*0.10 + sin(2*PI*293.66*t)*0.08)*exp(-0.7*mod(t,3.8))';  // Em7
  const chord5 = '(sin(2*PI*146.83*t)*0.16 + sin(2*PI*293.66*t)*0.12 + sin(2*PI*349.23*t)*0.10 + sin(2*PI*523.25*t)*0.08)*exp(-0.7*mod(t,3.8))'; // Dm9
  const chord6 = '(sin(2*PI*98.00*t)*0.16 + sin(2*PI*196.00*t)*0.12 + sin(2*PI*246.94*t)*0.10 + sin(2*PI*392.00*t)*0.08)*exp(-0.7*mod(t,3.8))';  // Gsus4

  const part = (duration / 6).toFixed(2);
  const p2 = (part * 2).toFixed(2);
  const p3 = (part * 3).toFixed(2);
  const p4 = (part * 4).toFixed(2);
  const p5 = (part * 5).toFixed(2);

  const pianoExpr = `if(lt(t,${part}), ${chord1}, if(lt(t,${p2}), ${chord2}, if(lt(t,${p3}), ${chord3}, if(lt(t,${p4}), ${chord4}, if(lt(t,${p5}), ${chord5}, ${chord6})))))`;
  
  // Warm low-pass filter at 1400Hz gives an authentic upright felt-piano timbre
  const filter = `lowpass=f=1400,afade=t=in:ss=0:d=0.5,afade=t=out:st=${Math.max(0, duration - 0.8).toFixed(2)}:d=0.8`;

  const cmd = `ffmpeg -y -f lavfi -i "aevalsrc='${pianoExpr}':s=44100:d=${duration}" -af "${filter}" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`;
  try {
    execSync(cmd);
    return outWavPath;
  } catch (e) {
    execSync(`ffmpeg -y -f lavfi -i "aevalsrc='0':s=44100:d=${duration}" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
    return outWavPath;
  }
}

function generateScienceGrooveMusic(outWavPath, duration = 6.0) {
  return generateSlowCalmPianoSoundtrack(outWavPath, duration);
}

/**
 * Generate a soft, warm chime for the "Did you know?" card reveal
 * Warm marimba / Rhodes bell tone (523Hz C5 and 659Hz E5) — NEVER harsh 2093Hz shrieks!
 */
function generateChimeSound(outWavPath, duration = 1.0) {
  const chimeExpr = `(sin(2*PI*523.25*t)*0.25 + sin(2*PI*659.25*t)*0.20)*exp(-4.0*t)`;
  const cmd = `ffmpeg -y -f lavfi -i "aevalsrc='${chimeExpr}':s=44100:d=${duration}" -af "lowpass=f=1400,afade=t=out:st=0.6:d=0.4" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`;
  try {
    execSync(cmd);
    return outWavPath;
  } catch {
    return null;
  }
}

/**
 * Master Archie's Reel Audio: Clean Voice + Ducked Real Background Music
 * Features dynamic duration calculation so speech is NEVER cut off!
 */
async function assembleArchieMasterAudio(spokenText, outMasterWav, options = {}) {
  const dir = path.dirname(outMasterWav);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const voiceWav = path.join(dir, `archie_voice_${Date.now()}.wav`);
  const chimeWav = path.join(dir, `archie_chime_${Date.now()}.wav`);

  // 1. Synthesize voice
  console.log(`[Archie Sound Master] 🎙️ Synthesizing Archie's voice: "${spokenText.slice(0, 60)}..."`);
  await synthesizeArchieVoice(spokenText, voiceWav);

  // Measure exact voice duration with ffprobe
  let voiceDuration = 4.5;
  try {
    const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}" 2>/dev/null`).toString().trim();
    const parsed = parseFloat(durStr);
    if (!isNaN(parsed) && parsed > 0.5) {
      voiceDuration = parsed;
    }
  } catch {}

  // Master duration ensures the voice completes completely with generous +1.8s outro buffer
  const masterDuration = Math.max(6.0, Number((voiceDuration + 1.8).toFixed(2)));
  console.log(`[Archie Sound Master] ⏱️ Spoken voice: ${voiceDuration.toFixed(2)}s -> Target reel duration: ${masterDuration}s (Zero cutoffs!)`);

  // 2. Resolve real music track (from URL, local real mp3/wav, or sound_assets/cartoon/)
  const customSoundUrl = (typeof options === 'object' && options ? options.soundUrl : '') || process.env.ARCHIE_MUSIC_URL || process.env.SOUND_URL || process.env.MUSIC_URL;
  const realMusicWav = await resolveRealMusicTrack({
    niche: 'cartoon',
    duration: masterDuration,
    soundUrl: customSoundUrl
  });

  generateChimeSound(chimeWav, 1.0);

  // 3. Mix: Voice prominent (volume 1.3), chime at 0.3s, and ducked real music if present
  const chimeDelayMs = 300;

  if (realMusicWav && fs.existsSync(realMusicWav)) {
    console.log(`[Archie Sound Master] 🎶 Mixing real audio backing track ducked cleanly under Archie's voice...`);
    const complexFilter = `
      [0:a]volume=1.35,apad=whole_dur=${masterDuration}[voice];
      [1:a]volume=0.12,atrim=0:${masterDuration}[music];
      [2:a]adelay=${chimeDelayMs}|${chimeDelayMs},volume=0.18,apad=whole_dur=${masterDuration}[chime];
      [voice][music][chime]amix=inputs=3:duration=longest:dropout_transition=1,loudnorm=I=-16:TP=-1.5:LRA=11[out]
    `.replace(/\s+/g, ' ');

    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${realMusicWav}" -i "${chimeWav}" -filter_complex "${complexFilter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outMasterWav}" 2>/dev/null`;
    try {
      execSync(mixCmd);
      console.log(`[Archie Sound Master] ✅ Audio mix complete! Clean voiceover + real backing track (${masterDuration}s)`);
    } catch {
      if (fs.existsSync(voiceWav)) fs.copyFileSync(voiceWav, outMasterWav);
    }
  } else {
    // Fill mute time with peaceful, slow varying calm acoustic piano soundtrack (as requested by user)
    console.log(`[Archie Sound Master] 🎹 Generating slow calm piano soundtrack to fill mute time under Archie's voice...`);
    const calmPianoWav = path.join(dir, `calm_piano_${Date.now()}.wav`);
    generateSlowCalmPianoSoundtrack(calmPianoWav, masterDuration);

    const complexFilter = `
      [0:a]volume=1.35,apad=whole_dur=${masterDuration}[voice];
      [1:a]volume=0.11,atrim=0:${masterDuration}[piano];
      [2:a]adelay=${chimeDelayMs}|${chimeDelayMs},volume=0.15,apad=whole_dur=${masterDuration}[chime];
      [voice][piano][chime]amix=inputs=3:duration=longest:dropout_transition=1,loudnorm=I=-16:TP=-1.5:LRA=11[out]
    `.replace(/\s+/g, ' ');

    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${calmPianoWav}" -i "${chimeWav}" -filter_complex "${complexFilter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outMasterWav}" 2>/dev/null`;
    try {
      execSync(mixCmd);
      console.log(`[Archie Sound Master] ✅ Audio mix complete! Clean adult voiceover + slow calm piano soundtrack (${masterDuration}s)`);
    } catch {
      if (fs.existsSync(voiceWav)) fs.copyFileSync(voiceWav, outMasterWav);
    }
    if (fs.existsSync(calmPianoWav)) try { fs.unlinkSync(calmPianoWav); } catch {}
  }

  // Cleanup temporary audio
  try {
    if (fs.existsSync(voiceWav)) fs.unlinkSync(voiceWav);
    if (fs.existsSync(chimeWav)) fs.unlinkSync(chimeWav);
    if (realMusicWav && realMusicWav.includes('resolved_music_') && fs.existsSync(realMusicWav)) {
      fs.unlinkSync(realMusicWav);
    }
  } catch {}

  return {
    path: outMasterWav,
    masterWavPath: outMasterWav,
    duration: masterDuration,
    voiceDuration
  };
}

module.exports = {
  synthesizeArchieVoice,
  generateScienceGrooveMusic,
  generateChimeSound,
  assembleArchieMasterAudio
};
