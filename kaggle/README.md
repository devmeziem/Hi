# Kaggle GPU clip bridge (Hi repo)

**Name:** Kaggle (sounds like *cag-ul*), not Cargo.

## Architecture

```
GitHub Action (CPU)
  → writes job.json (prompts, N clips, channel)
  → kaggle kernels push  (starts GPU notebook)
Kaggle notebook (GPU, short run)
  → generates 5s clips → /kaggle/working/clips/
  → writes manifest.json → exits (GPU stops)
GitHub Action poll
  → kaggle kernels output download
  → stitch + Edge TTS + captions + post
```

## What YOU do in Kaggle (once)

1. **Account**
   - Go to https://www.kaggle.com and sign in (Google is fine).
   - **Verify phone** (Settings → Phone) — required for free GPU.

2. **API token (for GitHub Actions secrets)**
   - https://www.kaggle.com/settings → **Account** → **Create New API Token**
   - Downloads `kaggle.json` like:
     ```json
     {"username":"your_kaggle_user","key":"xxxxxxxx"}
     ```
   - In GitHub repo **devmeziem/Hi** → Settings → Secrets and variables → Actions:
     - `KAGGLE_USERNAME` = your_kaggle_user
     - `KAGGLE_KEY` = the key value

3. **Create the notebook (first time)**
   - Code → New Notebook
   - **Title:** `hi-ai-clip-worker` (must match kernel-metadata id slug)
   - Settings (right panel):
     - **Accelerator:** GPU T4 x2 (or P100)
     - **Internet:** On
     - **Persistence:** Files only is fine
   - Make notebook **Private**
   - You can paste cells from `kaggle/ai_clip_worker/ai_clip_worker.ipynb` in this repo, or let GH push overwrite it.

4. **Optional: “Connect GitHub” in Kaggle UI**
   - Kaggle → Settings → **Linked accounts** / GitHub (wording varies)
   - Connect the same GitHub user that owns `devmeziem/Hi`
   - This is **optional** for our design — we drive Kaggle via **API token + kernels push**, not Kaggle’s GitHub sync button.
   - If you use it: link repo `devmeziem/Hi`, path `kaggle/ai_clip_worker/` — still keep API secrets in GitHub.

5. **Edit `kernel-metadata.json`**
   - Replace `YOUR_KAGGLE_USERNAME` with your real Kaggle username in:
     `kaggle/ai_clip_worker/kernel-metadata.json`
   - id format: `username/hi-ai-clip-worker`

## What GitHub already has

- `.github/workflows/kaggle-clip-dispatch.yml` — push job + start kernel
- `.github/workflows/kaggle-clip-poll-stitch.yml` — download outputs + placeholder stitch
- `kaggle/ai_clip_worker/` — notebook + metadata

## Safe GPU habit

- Keep runs **under 1–2 hours**
- Notebook must **finish and exit** (no interactive idle)
- ~30 GPU hours/week free total

## First test order

1. Add secrets `KAGGLE_USERNAME` + `KAGGLE_KEY`
2. Fix username in `kernel-metadata.json` and commit (or tell Grok to patch)
3. Run workflow **Kaggle Clip Dispatch** (dry job)
4. After COMPLETE, run **Kaggle Clip Poll Stitch**
