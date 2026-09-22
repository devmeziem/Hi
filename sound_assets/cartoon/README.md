# Cartoon & Archie Tech Facts Sound Assets

Drop your background music tracks and sound effects here.

### Supported Audio Formats:
- `.mp3`
- `.wav`
- `.m4a`
- `.aac`
- `.ogg`
- `.flac`

### How the Pipeline Uses Your Audio:
1. When generating Archie Tech Fact reels, the audio engine scans this directory (`sound_assets/cartoon/`).
2. If multiple tracks exist, one is selected at random (or rotated) for high variety.
3. The track is dynamically trimmed and ducked cleanly under Archie's narration (-18dB beneath voiceover, with loudnorm broadcast standard).
4. If no custom audio is uploaded here, the pipeline seamlessly falls back to a clean synthesized lo-fi science backing track.
