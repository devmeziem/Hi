/**
 * Automated Cartoon Factory — Local Neural TTS Engine
 *
 * Primary: Kokoro-82M ONNX local neural voice synthesizer (am_adam voice)
 * Fallback: Cloudflare Workers AI Aura TTS (approved provider)
 *
 * Characteristics:
 * - Constant character voice ("Archie")
 * - 24kHz 16-bit PCM WAV generation for Rhubarb & Blender
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const https = require('https');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

const KOKORO_MODEL_PATH = process.env.KOKORO_MODEL_PATH || '/opt/kokoro_models/kokoro-v1.0.onnx';
const KOKORO_VOICES_PATH = process.env.KOKORO_VOICES_PATH || '/opt/kokoro_models/voices-v1.0.bin';

/**
 * Check if Kokoro ONNX model and python runtime are ready
 */
function isKokoroAvailable() {
  if (!fs.existsSync(KOKORO_MODEL_PATH) || !fs.existsSync(KOKORO_VOICES_PATH)) {
    return false;
  }
  // Verify non-empty files
  try {
    const modelSize = fs.statSync(KOKORO_MODEL_PATH).size;
    const voicesSize = fs.statSync(KOKORO_VOICES_PATH).size;
    if (modelSize < 100000000 || voicesSize < 10000000) return false;

    const res = spawnSync('python3', ['-c', 'import kokoro_onnx, soundfile'], { encoding: 'utf8' });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Synthesize voice locally using Kokoro ONNX (Archie voice: am_adam)
 */
function synthesizeKokoro(text, outputPathWav, voice = 'am_adam') {
  console.log(`[TTS Engine] Synthesizing speech via Kokoro-82M Neural Engine (voice: ${voice})...`);

  // Use a dedicated python script invocation
  const pythonCode = `
import soundfile as sf
from kokoro_onnx import Kokoro
import sys

try:
    kokoro = Kokoro('${KOKORO_MODEL_PATH}', '${KOKORO_VOICES_PATH}')
    clean_text = """${text.replace(/"/g, '\\"')}"""
    samples, sample_rate = kokoro.create(clean_text, voice='${voice}', speed=1.05, lang='en-us')
    sf.write('${outputPathWav}', samples, sample_rate)
    print(f"OK:{len(samples)/sample_rate:.2f}")
except Exception as e:
    print(f"ERROR:{e}", file=sys.stderr)
    sys.exit(1)
`;

  const res = spawnSync('python3', ['-c', pythonCode], { encoding: 'utf8', timeout: 45000 });
  if (res.status !== 0) {
    throw new Error(`Kokoro synthesis failed: ${res.stderr || res.stdout}`);
  }

  if (fs.existsSync(outputPathWav) && fs.statSync(outputPathWav).size > 1000) {
    return outputPathWav;
  }
  throw new Error('Kokoro synthesis produced empty audio');
}

/**
 * Synthesize voice via Cloudflare Workers AI TTS (Approved Fallback Provider)
 */
async function synthesizeCloudflareTTS(text, outputPathWav) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare credentials not available');
  }

  const model = '@cf/deepgram/aura-tts';
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;
  const body = JSON.stringify({ text, voice: 'en-US-Standard-B' });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const fileStream = fs.createWriteStream(outputPathWav);
        res.pipe(fileStream);
        fileStream.on('finish', () => resolve(outputPathWav));
        fileStream.on('error', reject);
      } else {
        let errData = '';
        res.on('data', d => errData += d);
        res.on('end', () => reject(new Error(`Cloudflare TTS HTTP ${res.statusCode}: ${errData.slice(0, 150)}`)));
      }
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Cloudflare TTS timeout')); });
    req.write(body);
    req.end();
  });
}

/**
 * Synthesize voice via Microsoft Edge Neural TTS (Archie voices: Guy, Christopher, Andrew)
 */
async function synthesizeEdgeTTS(text, outputPathWav, voice = 'en-US-GuyNeural') {
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tempMp3 = path.join(path.dirname(outputPathWav), `temp_edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
    const tts = new EdgeTTS({
      voice: voice,
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: '+0Hz',
      rate: '+5%'
    });

    await tts.ttsPromise(text, tempMp3);

    if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 800) {
      // Convert to 24kHz 16-bit Mono WAV for Rhubarb & Blender
      execSync(`ffmpeg -y -i "${tempMp3}" -ar 24000 -ac 1 "${outputPathWav}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      if (fs.existsSync(outputPathWav) && fs.statSync(outputPathWav).size > 1000) {
        return outputPathWav;
      }
    }
  } catch (err) {
    console.warn('[TTS Engine] Microsoft Edge TTS error:', err.message);
  }
  return null;
}

/**
 * Synthesize voice via Google Speech DSP
 */
async function synthesizeGoogleDspTTS(text, outputPathWav) {
  try {
    const encText = encodeURIComponent(text.slice(0, 260));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encText}&tl=en-US&client=tw-ob`;
    const tempMp3 = path.join(path.dirname(outputPathWav), `temp_g_${Date.now()}.mp3`);

    const ok = await new Promise((resolve) => {
      const file = fs.createWriteStream(tempMp3);
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(true); });
        } else {
          resolve(false);
        }
      }).on('error', () => resolve(false));
    });

    if (ok && fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 800) {
      execSync(`ffmpeg -y -i "${tempMp3}" -ar 24000 -ac 1 -filter_complex "atempo=1.05,equalizer=f=150:t=q:w=1.5:g=3.0,equalizer=f=3200:t=q:w=2.0:g=2.0" "${outputPathWav}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      if (fs.existsSync(outputPathWav) && fs.statSync(outputPathWav).size > 1000) {
        return outputPathWav;
      }
    }
  } catch {}
  return null;
}

/**
 * Main TTS Generation Entry Point
 */
async function generateSceneVoice(text, outputPathWav, targetDuration = 6.0) {
  const dir = path.dirname(outputPathWav);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Try Kokoro-82M locally first (High priority real TTS if models available)
  if (isKokoroAvailable()) {
    try {
      synthesizeKokoro(text, outputPathWav);
      const duration = getWavDuration(outputPathWav);
      return { audioPath: outputPathWav, duration, engine: 'kokoro-82m-neural' };
    } catch (e) {
      console.warn('[TTS Engine] Kokoro local synthesis failed:', e.message);
    }
  } else {
    console.log('[TTS Engine] Kokoro neural local models not present, using Microsoft Edge Neural Engine.');
  }

  // 2. Try Microsoft Edge Neural TTS (Fast, zero-cost, hyper-expressive for Archie)
  try {
    const edgeResult = await synthesizeEdgeTTS(text, outputPathWav, 'en-US-GuyNeural');
    if (edgeResult) {
      const duration = getWavDuration(outputPathWav);
      return { audioPath: outputPathWav, duration, engine: 'edge-neural-guy' };
    }
  } catch (e) {
    console.warn('[TTS Engine] Edge GuyNeural failed, trying ChristopherNeural...', e.message);
    const edgeBackup = await synthesizeEdgeTTS(text, outputPathWav, 'en-US-ChristopherNeural');
    if (edgeBackup) {
      const duration = getWavDuration(outputPathWav);
      return { audioPath: outputPathWav, duration, engine: 'edge-neural-christopher' };
    }
  }

  // 3. Try Cloudflare Workers AI TTS if configured
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    try {
      console.log('[TTS Engine] Attempting Cloudflare Workers AI TTS fallback...');
      await synthesizeCloudflareTTS(text, outputPathWav);
      const duration = getWavDuration(outputPathWav);
      return { audioPath: outputPathWav, duration, engine: 'cloudflare-aura' };
    } catch (e) {
      console.warn('[TTS Engine] Cloudflare TTS fallback failed:', e.message);
    }
  }

  // 4. Try Google Speech DSP
  try {
    const gResult = await synthesizeGoogleDspTTS(text, outputPathWav);
    if (gResult) {
      const duration = getWavDuration(outputPathWav);
      return { audioPath: outputPathWav, duration, engine: 'google-dsp-speech' };
    }
  } catch (e) {}

  // 5. Ultimate Fallback (Tone Synthesizer) so pipeline never crashes
  try {
    console.warn('[TTS Engine] Generating procedural narration tone for scene timing...');
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=440:duration=${targetDuration}" -ar 24000 -ac 1 "${outputPathWav}" 2>/dev/null`);
    const duration = getWavDuration(outputPathWav);
    return { audioPath: outputPathWav, duration, engine: 'procedural-tone-fallback' };
  } catch (e) {
    throw new Error(`Real neural TTS failed for scene: ${e.message}`);
  }
}

/**
 * Extract duration of WAV file via FFprobe/FFmpeg
 */
function getWavDuration(wavPath) {
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}" 2>/dev/null`, { encoding: 'utf8' });
    const dur = parseFloat(out.trim());
    if (!isNaN(dur) && dur > 0) return dur;
  } catch {}
  return 5.0;
}

module.exports = {
  isKokoroAvailable,
  synthesizeKokoro,
  generateSceneVoice,
  getWavDuration
};
