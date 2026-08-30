# Third-Party Licenses & Model Registry

This document records the exact open-source licenses, repositories, model checkpoints, and commercial usage guidelines for all software components and AI models used in the **Automated Cartoon Video Factory**.

---

## 1. Local Neural TTS Engines

### Kokoro-82M
- **Role:** Primary Local Neural Text-to-Speech Engine
- **Source:** [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) / [style-tts2](https://github.com/yl4579/StyleTTS2)
- **License:** Apache License 2.0
- **Model Checkpoint:** `Kokoro-82M-v0.19` (82 Million Parameters)
- **Voice Weights:** Built-in multi-speaker weights (`af_heart`, `am_adam`, `bf_emma`, `bm_george`, etc.)
- **Commercial Use:** Permitted under Apache-2.0.
- **Attribution:** Kokoro TTS developed by Hexgrad.

### Piper TTS (Alternative / Fallback)
- **Role:** Fast, lightweight local neural TTS for low-resource environments
- **Source:** [rhasspy/piper](https://github.com/rhasspy/piper)
- **License:** MIT License
- **Model Weights License:** Public domain (CC0) / Open Data Commons (ODC-By / MIT depending on voice checkpoint).
- **Commercial Use:** Permitted under MIT. Verify individual voice model card before commercial broadcast.

---

## 2. Lip-Sync & Phoneme Timing

### Rhubarb Lip Sync
- **Role:** Audio-driven phoneme and mouth-shape timing extractor (WAV -> JSON / TSV)
- **Source:** [DanielSWolf/rhubarb-lip-sync](https://github.com/DanielSWolf/rhubarb-lip-sync)
- **License:** MIT License
- **Mouth Shapes:** Preston Blair Standard:
  - `A`: Closed mouth, rest, P/B/M
  - `B`: Slightly open mouth, consonants (S, T, D, N, K, G)
  - `C`: Wide open mouth, vowels (AH, AA)
  - `D`: Teeth exposed, smile (EE, I)
  - `E`: Rounded mouth, OO, W, U
  - `F`: Lower lip tucked under upper teeth (F, V)
  - `G`: Narrow open mouth, tongue behind teeth (L, TH)
  - `H`: Wide open smiling mouth
  - `X`: Total silence / idle rest
- **Commercial Use:** Permitted under MIT License.

---

## 3. 2D/2.5D Animation & Rendering

### Blender (Headless CLI Mode)
- **Role:** 2D/2.5D scene compositor, camera animator, character controller, and frame renderer
- **Source:** [Blender Foundation](https://www.blender.org/)
- **License:** GNU General Public License v2+ (GPLv2+)
- **Output License:** Works rendered by Blender (video files, animations, images) are the sole copyright of the creator/author and are NOT infected by GPL.
- **Commercial Use:** Full commercial production permitted for rendered videos.

---

## 4. Media Assembly & Subtitles

### FFmpeg
- **Role:** Video/audio multiplexing, audio normalization, WebVTT/SRT subtitle burning, MP4 encoding (H.264 / AAC)
- **Source:** [FFmpeg Project](https://ffmpeg.org/)
- **License:** LGPL v2.1+ / GPL v2+ (depending on enabled codecs: `--enable-gpl --enable-libx264`)
- **Commercial Use:** Permitted with standard dynamic linking and license compliance.

---

## 5. AI Planning & Language Models

### Groq Cloud API
- **Role:** Fast external LLM inference provider for script and scene planning (Llama 3.3 70B / 8B)
- **License / Terms:** Groq Developer Terms of Service. Llama 3 Community License.
- **Commercial Use:** Allowed according to Meta Llama 3 license terms.

### Cloudflare Workers AI
- **Role:** Alternate cloud LLM inference & fallback planning (`@cf/meta/llama-3.1-8b-instruct`)
- **License / Terms:** Cloudflare Terms of Service.
- **Commercial Use:** Permitted.

### OpenRouter
- **Role:** Model routing and secondary fallback API provider.
- **License / Terms:** OpenRouter Terms of Service.
- **Commercial Use:** Permitted.

### Qwen3 / Qwen 2.5 Instruct Models (Local Planning Fallback)
- **Role:** Local instruction model for scene JSON generation and schema validation repair
- **Source:** [QwenLM/Qwen2.5](https://github.com/QwenLM/Qwen2.5) / Hugging Face
- **License:** Apache License 2.0 / Qwen Open License (free for commercial use under threshold).
- **Commercial Use:** Permitted.

---

## 6. Character Assets & Intellectual Property

### Original Recurring Character: "Archie"
- **Ownership:** 100% self-owned, original 2D/2.5D vector and rigged character asset.
- **Components:** Modular swappable head, eyes, brows, mouth shapes (A-X), arms, torso, and props.
- **Copyright:** Proprietary / Project Owner.
