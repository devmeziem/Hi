const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EdgeTTS } = require('node-edge-tts');
const https = require('https');

async function makeTestClips() {
  const outDir = path.join(process.cwd(), 'rendered_videos');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Generate Frame Image via Cloudflare Flux-1-schnell
  console.log('1. Fetching frame from Cloudflare Flux-1-schnell...');
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
  const imgPrompt = 'Marcus Aurelius Roman Emperor statue in dark luxury aesthetic, soft dramatic cinematic lighting, 9:16 vertical 8k';

  let imgPath = path.join(outDir, 'test_marcus_frame.jpg');
  if (!fs.existsSync(imgPath)) {
    const postData = JSON.stringify({ prompt: imgPrompt });
    await new Promise((resolve) => {
      const req = https.request('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/ai/run/@cf/black-forest-labs/flux-1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiToken,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          try {
            const j = JSON.parse(buf.toString('utf8'));
            if (j.result && j.result.image) {
              fs.writeFileSync(imgPath, Buffer.from(j.result.image, 'base64'));
              console.log('Saved Flux-1-schnell frame:', fs.statSync(imgPath).size, 'bytes');
            }
          } catch (e) {
            console.log('Err parsing image:', e.message);
          }
          resolve();
        });
      });
      req.write(postData);
      req.end();
    });
  }

  if (!fs.existsSync(imgPath)) {
    console.log('Using local fallback frame');
    fs.copyFileSync('test_flux_image.jpg', imgPath);
  }

  // 2. Audio 1: Cloudflare Aura-2
  console.log('2. Generating Audio 1 (Cloudflare Aura-2)...');
  const audio1Path = path.join(outDir, 'audio_cf_aura2.mp3');
  const script1 = 'Rule one. Control your perceptions. Marcus Aurelius taught that external events have no power over you until you judge them.';
  const postData1 = JSON.stringify({ text: script1 });
  await new Promise((resolve) => {
    const req = https.request('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/ai/run/@cf/deepgram/aura-2-en', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData1)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(audio1Path, Buffer.concat(chunks));
        console.log('Saved Cloudflare Aura-2 audio:', fs.statSync(audio1Path).size, 'bytes');
        resolve();
      });
    });
    req.write(postData1);
    req.end();
  });

  // 3. Audio 2: Edge TTS Christopher Neural
  console.log('3. Generating Audio 2 (Edge TTS Christopher)...');
  const audio2Path = path.join(outDir, 'audio_edge_christopher.mp3');
  const script2 = 'Rule two. Eliminate the nonessential. When you discard unnecessary noise, you double your focus and achieve absolute mental clarity.';
  const edge = new EdgeTTS({
    voice: 'en-US-ChristopherNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    pitch: '-5Hz',
    rate: '-10%'
  });
  await edge.ttsPromise(script2, audio2Path);
  console.log('Saved Edge TTS audio:', fs.statSync(audio2Path).size, 'bytes');

  // 4. Render Video 1 (Cloudflare Aura-2) with burned-in subtitles & Ken Burns zoom-in
  console.log('4. Compiling Video 1 (Cloudflare Aura-2) via FFmpeg...');
  const out1 = path.join(outDir, 'stoic_test_cloudflare_aura2.mp4');
  const sub1 = 'Rule 1: Control your perceptions. External events have no power until you judge them.';
  const filter1 = "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.25)':d=250:s=1080x1920:fps=30,drawbox=y=ih-500:color=black@0.65:width=iw:height=220:t=fill,drawtext=text='" + sub1 + "':fontcolor=white:fontsize=40:font='DejaVu Sans Bold':x=(w-text_w)/2:y=h-420:shadowcolor=black@0.9:shadowx=3:shadowy=3[v]";
  
  execSync(`ffmpeg -y -loop 1 -i "${imgPath}" -i "${audio1Path}" -filter_complex "${filter1}" -map "[v]" -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${out1}"`, { stdio: 'pipe' });
  console.log('VIDEO 1 SUCCESS! Path:', out1, 'Size:', fs.statSync(out1).size, 'bytes');

  // 5. Render Video 2 (Edge TTS Christopher) with burned-in subtitles & Ken Burns zoom-out
  console.log('5. Compiling Video 2 (Edge TTS Christopher) via FFmpeg...');
  const out2 = path.join(outDir, 'stoic_test_edge_christopher.mp4');
  const sub2 = 'Rule 2: Eliminate the nonessential. Discard noise to achieve absolute mental clarity.';
  const filter2 = "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(max(zoom,1.20)-0.0015,1.0)':d=250:s=1080x1920:fps=30,drawbox=y=ih-500:color=black@0.65:width=iw:height=220:t=fill,drawtext=text='" + sub2 + "':fontcolor=white:fontsize=40:font='DejaVu Sans Bold':x=(w-text_w)/2:y=h-420:shadowcolor=black@0.9:shadowx=3:shadowy=3[v]";
  
  execSync(`ffmpeg -y -loop 1 -i "${imgPath}" -i "${audio2Path}" -filter_complex "${filter2}" -map "[v]" -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${out2}"`, { stdio: 'pipe' });
  console.log('VIDEO 2 SUCCESS! Path:', out2, 'Size:', fs.statSync(out2).size, 'bytes');
}

makeTestClips().catch(e => console.error('Clip error:', e));
