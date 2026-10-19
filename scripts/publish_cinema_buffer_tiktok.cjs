#!/usr/bin/env node
/**
 * Cinema TikTok — BUFFER_TIKTOK_MOVIE_CHANNEL_ID only.
 * Prefers CINEMA_VIDEO_PUBLIC_URL (GitHub Release asset).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TOKEN = (process.env.BUFFER_API_KEY_2 || process.env.BUFFER_API_TOKEN_2 || '').trim();
const CHANNEL_ID = (process.env.BUFFER_TIKTOK_MOVIE_CHANNEL_ID || '').trim();
const PUBLIC_URL = (process.env.CINEMA_VIDEO_PUBLIC_URL || '').trim();

function findVideo() {
  const candidates = [
    path.join(process.cwd(), 'rendered_videos', 'cinema_latest.mp4'),
    path.join(process.cwd(), 'rendered_videos', 'driftreel_documentary_latest.mp4'),
    process.env.VIDEO_PATH
  ].filter(Boolean);
  for (const p of candidates) {
    if (p && fs.existsSync(p) && fs.statSync(p).size > 100000) return p;
  }
  const dir = path.join(process.cwd(), 'rendered_videos');
  if (!fs.existsSync(dir)) return null;
  return fs
    .readdirSync(dir)
    .filter((f) => /documentary|driftreel|cinema/i.test(f) && f.endsWith('.mp4'))
    .map((f) => path.join(dir, f))
    .filter((p) => fs.statSync(p).size > 100000)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
}

function request(method, apiPath, body) {
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

function headOk(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'http:' ? http : https;
      const req = lib.request(
        url,
        { method: 'HEAD', headers: { 'User-Agent': 'CinemaBuffer/1.0' } },
        (res) => resolve(res.statusCode >= 200 && res.statusCode < 400)
      );
      req.on('error', () => resolve(false));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  if (!TOKEN) {
    console.error('[Cinema Buffer] Missing BUFFER_API_KEY_2');
    process.exit(1);
  }
  if (!CHANNEL_ID) {
    console.error('[Cinema Buffer] Missing BUFFER_TIKTOK_MOVIE_CHANNEL_ID');
    process.exit(1);
  }
  const teenId = (process.env.BUFFER_TIKTOK_TEEN_CHANNEL_ID || '').trim();
  if (teenId && CHANNEL_ID === teenId) {
    console.error('[Cinema Buffer] HARD FAIL: movie id == teen id');
    process.exit(1);
  }

  const video = findVideo();
  console.log('[Cinema Buffer] local video', video || 'none');
  console.log('[Cinema Buffer] public URL', PUBLIC_URL || 'none');
  console.log('[Cinema Buffer] channel_id', CHANNEL_ID);

  const profiles = await request('GET', '/1/profiles.json?access_token=' + encodeURIComponent(TOKEN));
  if (profiles.status === 200 && Array.isArray(profiles.json)) {
    const hit = profiles.json.find((p) => String(p.id) === String(CHANNEL_ID));
    if (!hit) {
      console.error('[Cinema Buffer] CHANNEL_ID not in Buffer profiles');
      console.error(
        profiles.json.map((p) => ({
          id: p.id,
          service: p.service,
          name: p.formatted_username || p.service_username
        }))
      );
      process.exit(1);
    }
    console.log('[Cinema Buffer] verified', hit.formatted_username || hit.service_username, hit.service);
    if (String(hit.service || '').toLowerCase() !== 'tiktok') {
      console.error('[Cinema Buffer] not a TikTok profile');
      process.exit(1);
    }
  }

  const text =
    process.env.CINEMA_CAPTION ||
    'Archival documentary short. Watch to the end. #Documentary #TrueCrime #History #Shorts';

  if (!PUBLIC_URL) {
    const manifest = {
      channel_id: CHANNEL_ID,
      video_path: video,
      text,
      ts: new Date().toISOString(),
      note: 'Set CINEMA_VIDEO_PUBLIC_URL from GitHub Release asset'
    };
    fs.writeFileSync(
      path.join(process.cwd(), 'rendered_videos', 'cinema_buffer_dispatch.json'),
      JSON.stringify(manifest, null, 2)
    );
    console.warn('[Cinema Buffer] No public URL — manifest only');
    process.exit(0);
  }

  // Wait briefly for release CDN
  for (let i = 0; i < 6; i++) {
    if (await headOk(PUBLIC_URL)) break;
    console.log('[Cinema Buffer] waiting for release asset...', i + 1);
    await new Promise((r) => setTimeout(r, 3000));
  }

  const created = await request('POST', '/1/updates/create.json?access_token=' + encodeURIComponent(TOKEN), {
    text,
    profile_ids: [CHANNEL_ID],
    media: { link: PUBLIC_URL, photo: PUBLIC_URL },
    now: true
  });
  console.log('[Cinema Buffer] create', created.status, (created.raw || '').slice(0, 400));
  if (created.status >= 400) process.exit(1);
  console.log('[Cinema Buffer] OK posted with release URL');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
