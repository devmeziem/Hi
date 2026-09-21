# Custom Sound Assets for Motivation Reels

Upload your custom MP3 background audio files here!

### How it works:
1. Place any `.mp3`, `.wav`, or `.m4a` audio files directly in this folder (`sound_assets/motivation/`) or in `sound_assets/`.
2. Commit and push your changes to the repo.
3. The next time the `teen-motivation-pipeline` workflow runs (or whenever `generate_teen_motivation_reel.cjs` is executed), the audio engine will automatically detect your MP3 file, normalize the volume, loop or trim it seamlessly to match the reel duration (with smooth 0.2s fade-in and fade-out), and use it as the high-retention background sound!
4. If multiple files are uploaded, a random track from your collection will be selected for each run to keep content fresh.
5. If no MP3 files are present in this folder, the system automatically falls back to generating an atmospheric procedural focus drone.
