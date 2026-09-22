# Movie Brand "Protocol Zero" Sound Assets

Drop your cinematic music tracks, braams, and trailer sound effects here.

### Supported Audio Formats:
- `.mp3`
- `.wav`
- `.m4a`
- `.aac`
- `.ogg`
- `.flac`

### How the Pipeline Uses Your Audio:
1. When generating Protocol Zero movie episodes, the audio engine scans this directory (`sound_assets/movie_brand/`).
2. If multiple tracks exist, one is selected at random (or rotated) for high variety.
3. The track is dynamically trimmed, looped, and balanced with loudnorm broadcast standard to fit the episode acts.
4. If no custom audio is uploaded here, the pipeline seamlessly synthesizes a dark cyberpunk sub-bass cinematic drone.
