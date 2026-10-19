#!/usr/bin/env node
/**
 * Cinema / Driftreel TikTok ONLY — uses BUFFER_TIKTOK_MOVIE_CHANNEL_ID.
 * Never resolves teen/bonesceo/archie names.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = (process.env.BUFFER_API_KEY_2 || process.env.BUFFER_API_TOKEN_2 || '').trim();
const CHANNEL_ID = (process.env.BUFFER_TIKTOK_MOVIE_CHANNEL_ID || '').trim();

function findVideo() {
  const candidates = [
    path.join(process.cwd(), 'rendered_videos', 'driftreel_documentary_latest.mp4'),
    process.env.VIDEO_PATH
  ].filter(Boolean);
  for (const p of candidates) {
    if (p && fs.existsSync(p) && fs.statSync(p).size > 100000) return p;
  }
  const dir = path.join(process.cwd(), 'rendered_videos');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => /documentary|driftreel|cinema/i.test(f) && f.endsWith('.mp4'))
    .map((f) => path.join(dir, f))
    .filter((p) => fs.statSync(p).size > 100000)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] || null;
}

function bufferRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.bufferapp.com',
        path: apiPath,
        method,
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(b || '{}'), raw: b });
          } catch {
            resolve({ status: res.statusCode, json: {}, raw: b });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  if (!TOKEN) {
    console.error('[Cinema Buffer] Missing BUFFER_API_KEY_2');
    process.exit(1);
  }
  if (!CHANNEL_ID) {
    console.error('[Cinema Buffer] Missing BUFFER_TIKTOK_MOVIE_CHANNEL_ID — refusing name-based guess');
    process.exit(1);
  }
  // Hard reject if someone put teen id in movie secret by mistake
  const teenId = (process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID || '').trim();
  if (teenId && CHANNEL_ID === teenId) {
    console.error('[Cinema Buffer] HARD FAIL: MOVIE channel id equals TEEN id');
    process.exit(1);
  }

  const video = findVideo();
  if (!video) {
    console.error('[Cinema Buffer] No documentary mp4 found');
    process.exit(1);
  }
  console.log('[Cinema Buffer] video', video, (fs.statSync(video).size / 1e6).toFixed(2) + 'MB');
  console.log('[Cinema Buffer] channel_id', CHANNEL_ID);

  // Buffer media upload flow: create update with media link if already hosted;
  // many setups use media upload endpoint — try updates/create with text + service
  const text =
    process.env.CINEMA_CAPTION ||
    'Archival documentary short. #Documentary #TrueCrime #History #Shorts';

  // List profiles to log confirmation only
  const profiles = await bufferRequest('GET', '/1/profiles.json?access_token=' + encodeURIComponent(TOKEN));
  if (profiles.status === 200 && Array.isArray(profiles.json)) {
    const hit = profiles.json.find((p) => String(p.id) === String(CHANNEL_ID));
    if (!hit) {
      console.error('[Cinema Buffer] CHANNEL_ID not in Buffer profiles for this token');
      console.error(
        '[Cinema Buffer] profiles:',
        profiles.json.map((p) => ({ id: p.id, service: p.service, name: p.formatted_username || p.service_username }))
      );
      process.exit(1);
    }
    console.log('[Cinema Buffer] verified profile', hit.formatted_username || hit.service_username, hit.service);
    if (String(hit.service || '').toLowerCase() !== 'tiktok') {
      console.error('[Cinema Buffer] HARD FAIL: channel is not TikTok');
      process.exit(1);
    }
  }

  // Post via updates/create — media must be a public URL for classic Buffer API.
  // If video is local only, write a dispatch note for Driftreel path.
  const publicUrl = process.env.CINEMA_VIDEO_PUBLIC_URL || '';
  if (!publicUrl) {
    console.warn('[Cinema Buffer] No CINEMA_VIDEO_PUBLIC_URL — writing local dispatch manifest only');
    const manifest = {
      channel_id: CHANNEL_ID,
      video_path: video,
      text,
      ts: new Date().toISOString(),
      note: 'Upload this file to Buffer TikTok movie channel manually or via media host'
    };
    const out = path.join(process.cwd(), 'rendered_videos', 'cinema_buffer_dispatch.json');
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
    console.log('[Cinema Buffer] wrote', out);
    // Still attempt if Buffer accepts media service with attachment path — skip soft success
    process.exit(0);
  }

  const created = await bufferRequest('POST', '/1/updates/create.json?access_token=' + encodeURIComponent(TOKEN), {
    text,
    profile_ids: [CHANNEL_ID],
    media: { photo: publicUrl, thumbnail: publicUrl },
    now: true
  });
  console.log('[Cinema Buffer] create status', created.status, created.raw?.slice?.(0, 300));
  if (created.status >= 400) process.exit(1);
  console.log('[Cinema Buffer] OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
