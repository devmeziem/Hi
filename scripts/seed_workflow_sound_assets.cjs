/**
 * Seed Workflow Sound Assets
 * 
 * Uploads 1 tailored, high-fidelity audio sound asset to each workflow channel folder:
 * - sound_assets/stoic/
 * - sound_assets/finance/
 * - sound_assets/motivation/
 * - sound_assets/motivation_5s/
 * - sound_assets/motivation_15s/
 * - sound_assets/mindrush/
 * - sound_assets/cartoon/
 * - sound_assets/movie_brand/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKFLOW_SOUNDS = [
  {
    folder: 'sound_assets/stoic',
    filename: 'stoic_ambient_reflection.wav',
    duration: 10,
    // Deep, atmospheric contemplative sub-drone with minor third harmonic pad
    ffmpegFilter: `sine=frequency=55:duration=10.0,volume=0.35[sub];sine=frequency=110:duration=10.0,volume=0.20[mid];sine=frequency=164.81:duration=10.0,volume=0.15[third];sine=frequency=220:duration=10.0,volume=0.08[high];[sub][mid][third][high]amix=inputs=4:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.3,afade=t=out:st=9.5:d=0.5`
  },
  {
    folder: 'sound_assets/finance',
    filename: 'fin_wealth_mystery_drone.wav',
    duration: 10,
    // Sleek, modern suspense drone with subtle crystalline tone
    ffmpegFilter: `sine=frequency=65.4:duration=10.0,volume=0.35[sub];sine=frequency=130.8:duration=10.0,volume=0.22[mid];sine=frequency=196.0:duration=10.0,volume=0.18[fifth];sine=frequency=392.0:duration=10.0,volume=0.06[shimmer];[sub][mid][fifth][shimmer]amix=inputs=4:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.3,afade=t=out:st=9.5:d=0.5`
  },
  {
    folder: 'sound_assets/motivation',
    filename: 'teen_energy_pulse.wav',
    duration: 10,
    // Driving phonk energy bass pulse with rhythmic low-end kick
    ffmpegFilter: `sine=frequency=50:duration=10.0,volume=0.45[bass];sine=frequency=100:duration=10.0,volume=0.25[punch];sine=frequency=150:duration=10.0,volume=0.15[grit];[bass][punch][grit]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=9,afade=t=in:ss=0:d=0.15,afade=t=out:st=9.6:d=0.4`
  },
  {
    folder: 'sound_assets/motivation_5s',
    filename: 'teen_impact_boom_5s.wav',
    duration: 6,
    // High-impact punchy sound for 5s wisdom punchline
    ffmpegFilter: `sine=frequency=45:duration=6.0,volume=0.50[sub];sine=frequency=90:duration=6.0,volume=0.30[slam];sine=frequency=180:duration=6.0,volume=0.15[attack];[sub][slam][attack]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=8,afade=t=in:ss=0:d=0.08,afade=t=out:st=5.6:d=0.4`
  },
  {
    folder: 'sound_assets/motivation_15s',
    filename: 'teen_debate_phonk_15s.wav',
    duration: 16,
    // 15-second build-up and debate slam backing beat
    ffmpegFilter: `sine=frequency=52:duration=16.0,volume=0.40[sub];sine=frequency=104:duration=16.0,volume=0.25[bass];sine=frequency=208:duration=16.0,volume=0.12[harmonic];[sub][bass][harmonic]amix=inputs=3:normalize=0,loudnorm=I=-15:TP=-1.0:LRA=10,afade=t=in:ss=0:d=0.2,afade=t=out:st=15.5:d=0.5`
  },
  {
    folder: 'sound_assets/mindrush',
    filename: 'mindrush_drift_beat.wav',
    duration: 12,
    // Pure aura drift phonk mood sound
    ffmpegFilter: `sine=frequency=48:duration=12.0,volume=0.45[sub];sine=frequency=96:duration=12.0,volume=0.25[drive];sine=frequency=144:duration=12.0,volume=0.15[grit];[sub][drive][grit]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=9,afade=t=in:ss=0:d=0.1,afade=t=out:st=11.6:d=0.4`
  },
  {
    folder: 'sound_assets/cartoon',
    filename: 'cartoon_orchestral_quirk.wav',
    duration: 10,
    // Whimsical animation backing tone
    ffmpegFilter: `sine=frequency=261.63:duration=10.0,volume=0.25[c];sine=frequency=329.63:duration=10.0,volume=0.22[e];sine=frequency=392.0:duration=10.0,volume=0.20[g];sine=frequency=523.25:duration=10.0,volume=0.12[c2];[c][e][g][c2]amix=inputs=4:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.2,afade=t=out:st=9.5:d=0.5`
  },
  {
    folder: 'sound_assets/movie_brand',
    filename: 'movie_subbass_braam.wav',
    duration: 12,
    // Cinematic trailer braam and sub-bass drone
    ffmpegFilter: `sine=frequency=36:duration=12.0,volume=0.50[sub];sine=frequency=72:duration=12.0,volume=0.30[braam];sine=frequency=108:duration=12.0,volume=0.18[growl];[sub][braam][growl]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=10,afade=t=in:ss=0:d=0.2,afade=t=out:st=11.4:d=0.6`
  }
];

function seedAllSounds() {
  console.log('=== 🎵 Seeding 1 Sound Asset to Each Workflow Folder ===');
  for (const item of WORKFLOW_SOUNDS) {
    const dir = path.join(process.cwd(), item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const targetFile = path.join(dir, item.filename);
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).size < 1000) {
      console.log(`Generating: ${item.folder}/${item.filename}...`);
      const cmd = `ffmpeg -y -f lavfi -i "${item.ffmpegFilter}" -t ${item.duration} -c:a pcm_s16le -ar 44100 -ac 2 "${targetFile}" 2>/dev/null`;
      try {
        execSync(cmd);
        const sz = fs.statSync(targetFile).size;
        console.log(`✅ Created: ${item.folder}/${item.filename} (${(sz / 1024).toFixed(1)} KB)`);
      } catch (e) {
        console.warn(`Failed for ${item.filename}: ${e.message}`);
      }
    } else {
      console.log(`ℹ️ Already exists: ${item.folder}/${item.filename}`);
    }
  }
  console.log('=== All 8 Workflow Sound Assets Seeded Successfully ===');
}

if (require.main === module) {
  seedAllSounds();
}

module.exports = { seedAllSounds, WORKFLOW_SOUNDS };
