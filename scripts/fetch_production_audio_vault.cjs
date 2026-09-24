/**
 * Production Audio Vault Auto-Fetcher & Downloader
 *
 * Downloads real high-beat drift phonk tracks, dark stoic ambient soundscapes,
 * and chill lo-fi financial audio from public royalty-free archives (Archive.org, Wikimedia Commons).
 *
 * Never uses procedural sine wave synthesis.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const AUDIO_CATALOG = {
  mindrush: [
    {
      name: 'gigachad_phonk_house.mp3',
      url: 'https://archive.org/download/soundcloud-1412271310/1412271310.mp3',
      bpm: 130
    },
    {
      name: 'giga_chad_theme_phonk.mp3',
      url: 'https://archive.org/download/g-3ox-em-giga-chad-theme-phonk-house-version/g3ox_em%20-%20GigaChad%20Theme%20(Phonk%20House%20Version).mp3',
      bpm: 128
    },
    {
      name: 'brazilian_drift_phonk.mp3',
      url: 'https://archive.org/download/dj-samir-dj-shazam-beat-ritmo-selvagem-brazilian-phonk-256-kbps-shabakngy.com/DJ%20Samir%20%26%20DJ%20Shazam%20Beat%20-%20Ritmo%20Selvagem%20%5BBrazilian%20Phonk%5D%20(256%20%20kbps)%20(shabakngy.com).mp3',
      bpm: 135
    },
    {
      name: 'alexi_action_nightmare_phonk.ogg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Alexi_Action_-_Nightmare_%28Atmospheric_Hip-Hop-Phonk%29.ogg',
      bpm: 125
    },
    {
      name: 'drift_phonk_instrumental_140bpm.ogg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Phonk_sample.ogg',
      bpm: 140
    }
  ],
  stoic: [
    {
      name: 'stoic_dark_unseen_ambient.mp3',
      url: 'https://archive.org/download/ambcol_dark/02._dark-aka_unseen-gregg_plummer_64kb.mp3'
    },
    {
      name: 'stoic_the_storm_deep_ambient.mp3',
      url: 'https://archive.org/download/ambcol_dark/08_dark-aka_the_storm-tofuik_64kb.mp3'
    },
    {
      name: 'stoic_dark_keys_meditation.mp3',
      url: 'https://archive.org/download/ambcol_dark/09._dark-steve_the_keys_64kb.mp3'
    }
  ],
  finance: [
    {
      name: 'finance_lofi_days_like_these.mp3',
      url: 'https://archive.org/download/soundcloud-557089965/No_Copyright_Music_Chill_Lofi_Hip_Hop_Instrumental_Copyright_Free_Music_-_Days_Like_These-557089965.mp3'
    }
  ]
};

// Target directory mappings
const DIRECTORY_MAPPINGS = {
  mindrush: [
    path.join(process.cwd(), 'sound_assets', 'mindrush'),
    path.join(process.cwd(), 'sound_assets', 'motivation_15s'),
    path.join(process.cwd(), 'sound_assets', 'motivation_5s')
  ],
  stoic: [
    path.join(process.cwd(), 'sound_assets', 'stoic')
  ],
  finance: [
    path.join(process.cwd(), 'sound_assets', 'finance')
  ]
};

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 50000) {
    return destPath;
  }

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      const req = client.get(url, { headers, timeout: 25000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          console.warn(`[Audio Fetcher] HTTP ${res.statusCode} for ${url}`);
          resolve(null);
          return;
        }

        const tmp = `${destPath}.tmp_${Date.now()}`;
        const fileStream = fs.createWriteStream(tmp);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              if (fs.existsSync(tmp) && fs.statSync(tmp).size > 10000) {
                fs.renameSync(tmp, destPath);
                resolve(destPath);
              } else {
                try { fs.unlinkSync(tmp); } catch {}
                resolve(null);
              }
            } catch (err) {
              resolve(null);
            }
          });
        });

        fileStream.on('error', () => {
          try { fs.unlinkSync(tmp); } catch {}
          resolve(null);
        });
      });

      req.on('error', (e) => {
        console.warn(`[Audio Fetcher] Network notice: ${e.message}`);
        resolve(null);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

async function fetchAllProductionAudios(force = false) {
  console.log('===========================================================');
  console.log('⚡ PRODUCTION AUDIO VAULT: CRAWLING REAL AUDIO TRACKS');
  console.log('===========================================================');

  const downloadedByChannel = {};

  for (const [category, trackList] of Object.entries(AUDIO_CATALOG)) {
    const targetDirs = DIRECTORY_MAPPINGS[category] || [];
    targetDirs.forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    downloadedByChannel[category] = [];

    for (const track of trackList) {
      const primaryDir = targetDirs[0];
      const primaryDest = path.join(primaryDir, track.name);

      if (fs.existsSync(primaryDest) && !force && fs.statSync(primaryDest).size > 50000) {
        downloadedByChannel[category].push(primaryDest);
        continue;
      }

      console.log(`[Audio Fetcher] 📥 Fetching "${track.name}" for [${category}]...`);
      const downloaded = await downloadFile(track.url, primaryDest);

      if (downloaded && fs.existsSync(downloaded)) {
        const sizeMb = (fs.statSync(downloaded).size / (1024 * 1024)).toFixed(2);
        console.log(`[Audio Fetcher] ✅ Downloaded "${track.name}" (${sizeMb} MB)`);
        downloadedByChannel[category].push(downloaded);

        // Copy to sister directories (e.g. motivation_15s and motivation_5s for mindrush)
        for (let i = 1; i < targetDirs.length; i++) {
          const sisterDest = path.join(targetDirs[i], track.name);
          try {
            fs.copyFileSync(downloaded, sisterDest);
          } catch {}
        }
      }
    }
  }

  // Pre-generate normalized 15s and 5s slices for instant zero-latency compilation
  const mindrushDir = path.join(process.cwd(), 'sound_assets', 'mindrush');
  if (fs.existsSync(mindrushDir)) {
    const files = fs.readdirSync(mindrushDir).filter(f => /\.(mp3|ogg|wav)$/i.test(f) && !f.includes('_sliced_'));
    for (const file of files) {
      const fullPath = path.join(mindrushDir, file);
      const slice15 = path.join(mindrushDir, `${path.parse(file).name}_sliced_15s.wav`);
      const slice5 = path.join(mindrushDir, `${path.parse(file).name}_sliced_5s.wav`);

      if (!fs.existsSync(slice15) || fs.statSync(slice15).size < 1000) {
        try {
          execSync(`ffmpeg -y -stream_loop -1 -i "${fullPath}" -t 15.0 -af "loudnorm=I=-14:TP=-1.0:LRA=11,afade=t=in:ss=0:d=0.15,afade=t=out:st=14.6:d=0.4" -ar 44100 -ac 2 "${slice15}" 2>/dev/null`);
        } catch {}
      }

      if (!fs.existsSync(slice5) || fs.statSync(slice5).size < 1000) {
        try {
          execSync(`ffmpeg -y -stream_loop -1 -i "${fullPath}" -t 5.0 -af "loudnorm=I=-14:TP=-1.0:LRA=11,afade=t=in:ss=0:d=0.1,afade=t=out:st=4.7:d=0.3" -ar 44100 -ac 2 "${slice5}" 2>/dev/null`);
        } catch {}
      }
    }
  }

  console.log('[Audio Fetcher] 🎉 Audio Vault synchronization complete.');
  return downloadedByChannel;
}

if (require.main === module) {
  fetchAllProductionAudios().catch(console.error);
}

module.exports = {
  fetchAllProductionAudios,
  AUDIO_CATALOG
};
